import { useState, useRef, useEffect, useCallback } from "react"
import { useCountedDownload } from "@components/team/utils/DownloadOdometer/hooks"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { usePreviewModal } from "@components/team/utils/PreviewModal/hooks"
import { useChatSession } from "@utils/hooks"
import * as AppActions from '@context/App/AppActions'
import { PAGE_SIZE } from "@components/team/utils/Pagination/utils"
import { sortAnalyses, hasRunningAnalysis, startsAnalysis, clientName } from "./utils"

// Types
import type { QueryClient } from "@tanstack/react-query"
import type * as AppTypes from "@context/App/types"
import type { ChatAttachment } from "@components/team/utils/ChatInput/types"

const MANIFEST_QUERY_KEY = ["coverage-gap-manifest"]
const CHAT_SESSION_KEY = "boxwood_coverage_gap_chat_session"
const ATTACHMENT_POLL_MS = 4000
const RUNNING_POLL_MS = 5000

export const useCoverageGapManifest = (scope: AppTypes.CoverageGapScope) => useQuery({
  queryKey: [...MANIFEST_QUERY_KEY, scope],
  queryFn: () => AppActions.getCoverageGapManifest(scope),
  placeholderData: keepPreviousData,
  // Analyses run a few minutes in the background; keep polling until none are left running
  refetchInterval: (query) => (hasRunningAnalysis(query.state.data) ? RUNNING_POLL_MS : false),
})

export const useDownloadCoverageGapFile = () => useCountedDownload(AppActions.downloadCoverageGapFile)

export const useDownloadCoverageGapPdf = () => useCountedDownload(AppActions.downloadCoverageGapPdf)

export const useDeleteCoverageGapAnalysis = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: AppActions.deleteCoverageGapAnalysis,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MANIFEST_QUERY_KEY }),
  })
}

export const usePreviewCoverageGapFile = (filename: string) =>
  usePreviewModal(useCallback(() => AppActions.getCoverageGapFileBlob(filename, true), [filename]))

// Ids of every file any cached analysis already owns, so the drop zone can let go of them
const cachedSourceIds = (queryClient: QueryClient) =>
  new Set(queryClient.getQueriesData<AppTypes.CoverageGapManifest>({ queryKey: MANIFEST_QUERY_KEY })
    .flatMap(([, manifest]) => manifest?.groups ?? [])
    .flatMap((group) => group.analyses)
    .flatMap((analysis) => analysis.sources.map((source) => source.id)))

export type StagedFile = ChatAttachment & {
  id?: string
  profile?: AppTypes.CoverageGapAttachment["profile"]
}

const fromServer = (attachment: AppTypes.CoverageGapAttachment): Partial<StagedFile> => ({
  id: attachment.id,
  status: attachment.status,
  error: attachment.error,
  profile: attachment.profile,
})

// The staged policy PDFs and the account notes that go with them into the next analysis
export const useGapFiles = () => {
  const [files, setFiles] = useState<StagedFile[]>([])
  const [notes, setNotes] = useState("")
  const nextKey = useRef(0)

  const update = (match: (f: StagedFile) => boolean, changes: Partial<StagedFile>) =>
    setFiles((prev) => prev.map((f) => (match(f) ? { ...f, ...changes } : f)))

  const addFiles = (accepted: File[], rejected: string[]) => {
    const rejectedChips = rejected.map((error) => ({ key: `r${ nextKey.current++ }`, filename: error, status: "error" as const, error }))
    const uploads = accepted.map((file) => ({ key: `u${ nextKey.current++ }`, file }))
    const uploadChips = uploads.map(({ key, file }) => ({ key, filename: file.name, status: "uploading" as const }))
    setFiles((prev) => [...prev, ...rejectedChips, ...uploadChips])

    uploads.forEach(({ key, file }) => {
      AppActions.uploadCoverageGapAttachment(file)
        .then((attachment) => update((f) => f.key === key, fromServer(attachment)))
        .catch((err: Error) => update((f) => f.key === key, { status: "error", error: `${ file.name }: ${ err.message }` }))
    })
  }

  const processingIds = files.filter((f) => f.status === "processing" && f.id).map((f) => f.id!).join(",")

  useEffect(() => {
    if(!processingIds) return

    const interval = setInterval(() => {
      processingIds.split(",").forEach((id) => {
        AppActions.getCoverageGapAttachment(id)
          .then((attachment) => update((f) => f.id === id, fromServer(attachment)))
          .catch(() => {})
      })
    }, ATTACHMENT_POLL_MS)

    return () => clearInterval(interval)
  }, [processingIds])

  const remove = (key: string) => {
    const file = files.find((f) => f.key === key)
    if(file?.id) AppActions.deleteCoverageGapAttachment(file.id).catch(() => {})
    setFiles((prev) => prev.filter((f) => f.key !== key))
  }

  // Drops chips an analysis now owns (the server keeps them with it), and the notes sent with them
  const release = (ids: Set<string>) => {
    setFiles((prev) => prev.filter((f) => !f.id || !ids.has(f.id)))
    setNotes("")
  }

  const readyIds = files.filter((f) => f.id && f.status !== "error").map((f) => f.id!)
  const busy = files.some((f) => f.status === "uploading" || f.status === "processing")
  const hasRead = files.some((f) => f.status === "done")
  const canRun = hasRead && !busy

  return { files, addFiles, remove, release, notes, setNotes, readyIds, busy, canRun, hasRead }
}

export type GapFiles = ReturnType<typeof useGapFiles>

const listNames = (names: string[]) =>
  names.length <= 2 ? names.join(" and ") : `${ names.slice(0, -1).join(", ") } and ${ names.at(-1) }`

export const announceReading = (names: string[]) =>
  `Reading ${ listNames(names) } — this usually takes under a minute.`

export const useAnnounceReadErrors = (files: StagedFile[], onAnnounce: (text: string) => void) => {
  const announced = useRef(new Set<string>())

  useEffect(() => {
    files
      .filter((f) => f.status === "error" && f.key.startsWith("u") && !announced.current.has(f.key))
      .forEach((f) => {
        announced.current.add(f.key)
        onAnnounce(`I couldn't read ${ f.filename }. ${ f.error?.replace(`${ f.filename }: `, "") ?? "" }`.trim())
      })
  }, [files, onAnnounce])
}

export const useCoverageGapChat = (staged: GapFiles) => {
  const queryClient = useQueryClient()
  const { messages, setMessages, sessionId, saveSession, resetSession, hasConversation } = useChatSession<AppTypes.CoverageGapChatMessage>(CHAT_SESSION_KEY)
  const [scrollSignal, setScrollSignal] = useState(0)

  const announce = useCallback((text: string) => setMessages((prev) => [...prev, { role: "assistant", text }]), [setMessages])

  const analysisStarted = async () => {
    await queryClient.invalidateQueries({ queryKey: MANIFEST_QUERY_KEY })
    staged.release(cachedSourceIds(queryClient))
    setScrollSignal((n) => n + 1)
  }

  // The notes ride along on every turn so the chat can use them (and pass them on if asked to run)
  const chat = useMutation({
    mutationFn: ({ message, attachmentIds, notes }: { message: string, attachmentIds: string[], notes: string }) =>
      AppActions.postCoverageGapChat(message, attachmentIds, notes, sessionId),
    onSuccess: async (turn) => {
      saveSession(turn.session_id)
      announce(turn.reply || "(no reply)")
      if(turn.tool_calls.some(startsAnalysis)) await analysisStarted()
    },
    onError: () => announce("Sorry, something went wrong — please try again."),
  })

  const run = useMutation({
    mutationFn: ({ notes }: { notes: string }) => AppActions.createCoverageGapAnalysis(staged.readyIds, notes),
    onSuccess: async (analysis) => {
      staged.release(new Set(analysis.sources.map((source) => source.id)))
      announce(`Reviewing ${ analysis.client_name ? clientName(analysis) : "the policies" } now — this takes a few minutes. It'll show in the list below as soon as it's done, and you can ask me about it here.`)
      await analysisStarted()
    },
    onError: (err: Error) => announce(`I couldn't start the gap analysis. ${ err.message }`),
  })

  const isPending = chat.isPending || run.isPending

  const sendMessage = (message: string) => {
    const trimmed = message.trim()
    if(!trimmed || isPending) return

    setMessages((prev) => [...prev, { role: "user", text: trimmed }])
    chat.mutate({ message: trimmed, attachmentIds: staged.readyIds, notes: staged.notes.trim() })
  }

  const runAnalysis = () => {
    if(!staged.canRun || isPending) return

    setMessages((prev) => [...prev, { role: "user", text: staged.notes.trim() ? "Run gap analysis (with account notes)" : "Run gap analysis" }])
    run.mutate({ notes: staged.notes.trim() })
  }

  // Waits out an in-flight turn, otherwise its reply would land in (and re-save the session of) the new chat
  const canStartNewChat = hasConversation && !isPending
  const newChat = () => {
    if(canStartNewChat) resetSession()
  }

  return { messages, sendMessage, runAnalysis, announce, isPending, scrollSignal, newChat, canStartNewChat }
}

export type CoverageGapChat = ReturnType<typeof useCoverageGapChat>

export const useHandleChatPanel = (chat: CoverageGapChat, staged: GapFiles) => {
  const [draft, setDraft] = useState("")
  const messagesRef = useRef<HTMLDivElement>(null)

  const send = () => {
    if(!draft.trim() || staged.busy) return
    chat.sendMessage(draft)
    setDraft("")
  }

  const canRun = staged.canRun && !chat.isPending
  const run = () => {
    if(canRun) chat.runAnalysis()
  }

  return { messagesRef, send, run, canRun, draft, setDraft }
}

export const useHandleAnalysisList = (groups: AppTypes.CoverageGapGroup[], scrollSignal: number) => {
  const rowRefs = useRef(new Map<string, HTMLLIElement>())
  const lastHandledSignal = useRef(0)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if(scrollSignal === 0 || scrollSignal === lastHandledSignal.current) return
    lastHandledSignal.current = scrollSignal

    const all = groups.flatMap((group) => group.analyses)
    if(all.length === 0) return

    const newest = all.reduce((a, b) => (a.generated_at > b.generated_at ? a : b))
    rowRefs.current.get(newest.id)?.scrollIntoView({ behavior: "smooth", block: "center" })

    clearTimeout(highlightTimeoutRef.current)
    setHighlightedId(newest.id)
    highlightTimeoutRef.current = setTimeout(() => setHighlightedId(null), 2000)
  }, [groups, scrollSignal])

  useEffect(() => () => clearTimeout(highlightTimeoutRef.current), [])

  return { rowRefs, highlightedId }
}

export const useHandleAnalysisSection = (analyses: AppTypes.CoverageGapEntry[], order: string) => {
  const sorted = sortAnalyses(analyses, order)
  const [page, setPage] = useState(0)
  const currentPage = Math.min(page, Math.max(Math.ceil(sorted.length / PAGE_SIZE) - 1, 0))
  const pageAnalyses = sorted.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)
  const sectionRef = useRef<HTMLDivElement>(null)

  return { pageAnalyses, currentPage, totalItems: sorted.length, setPage, sectionRef }
}

const CONFIRM_TIMEOUT_MS = 3000

export const useHandleConfirmButton = (onConfirm: () => void) => {
  const [armed, setArmed] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const handleClick = () => {
    if(armed) {
      clearTimeout(timeoutRef.current)
      setArmed(false)
      onConfirm()
      return
    }

    setArmed(true)
    timeoutRef.current = setTimeout(() => setArmed(false), CONFIRM_TIMEOUT_MS)
  }

  return { armed, handleClick }
}
