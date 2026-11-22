import { useState, useRef, useEffect, useCallback } from "react"
import { useCountedDownload } from "@components/team/utils/DownloadOdometer/hooks"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { usePreviewModal } from "@components/team/utils/PreviewModal/hooks"
import { useChatSession } from "@utils/hooks"
import * as AppActions from '@context/App/AppActions'
import { PAGE_SIZE } from "@components/team/utils/Pagination/utils"
import { sortComparisons, hasRunningComparison, startsComparison, clientName } from "./utils"

// Types
import type { QueryClient } from "@tanstack/react-query"
import type * as AppTypes from "@context/App/types"
import type { ChatAttachment } from "@components/team/utils/ChatInput/types"

const MANIFEST_QUERY_KEY = ["coverage-comparison-manifest"]
const CHAT_SESSION_KEY = "boxwood_coverage_comparison_chat_session"
const ATTACHMENT_POLL_MS = 4000
const RUNNING_POLL_MS = 5000

export const useCoverageComparisonManifest = (scope: AppTypes.CoverageComparisonScope) => useQuery({
  queryKey: [...MANIFEST_QUERY_KEY, scope],
  queryFn: () => AppActions.getCoverageComparisonManifest(scope),
  placeholderData: keepPreviousData,
  // Comparisons run a few minutes in the background; keep polling until none are left running
  refetchInterval: (query) => (hasRunningComparison(query.state.data) ? RUNNING_POLL_MS : false),
})

export const useDownloadCoverageComparisonFile = () => useCountedDownload(AppActions.downloadCoverageComparisonFile)

export const useDownloadCoverageComparisonPdf = () => useCountedDownload(AppActions.downloadCoverageComparisonPdf)

export const useDeleteCoverageComparison = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: AppActions.deleteCoverageComparison,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MANIFEST_QUERY_KEY }),
  })
}

export const usePreviewCoverageComparisonFile = (filename: string) =>
  usePreviewModal(useCallback(() => AppActions.getCoverageComparisonFileBlob(filename, true), [filename]))

// Ids of every file any cached comparison already owns, so the zones can let go of them
const cachedSourceIds = (queryClient: QueryClient) =>
  new Set(queryClient.getQueriesData<AppTypes.CoverageComparisonManifest>({ queryKey: MANIFEST_QUERY_KEY })
    .flatMap(([, manifest]) => manifest?.groups ?? [])
    .flatMap((group) => group.comparisons)
    .flatMap((comparison) => comparison.sources.map((source) => source.id)))

export type StagedFile = ChatAttachment & {
  id?: string
  role: AppTypes.CoverageComparisonRole
  profile?: AppTypes.CoverageComparisonAttachment["profile"]
  moving?: boolean
}

const fromServer = (attachment: AppTypes.CoverageComparisonAttachment): Partial<StagedFile> => ({
  id: attachment.id,
  role: attachment.role,
  status: attachment.status,
  error: attachment.error,
  profile: attachment.profile,
})

export const useComparisonFiles = () => {
  const [files, setFiles] = useState<StagedFile[]>([])
  const [setLabels, setSetLabels] = useState<Record<AppTypes.CoverageComparisonRole, string>>({ set_a: "", set_b: "" })
  const nextKey = useRef(0)

  const update = (match: (f: StagedFile) => boolean, changes: Partial<StagedFile>) =>
    setFiles((prev) => prev.map((f) => (match(f) ? { ...f, ...changes } : f)))

  const addFiles = (role: AppTypes.CoverageComparisonRole, accepted: File[], rejected: string[]) => {
    const rejectedChips = rejected.map((error) => ({ key: `r${ nextKey.current++ }`, role, filename: error, status: "error" as const, error }))
    const uploads = accepted.map((file) => ({ key: `u${ nextKey.current++ }`, file }))
    const uploadChips = uploads.map(({ key, file }) => ({ key, role, filename: file.name, status: "uploading" as const }))
    setFiles((prev) => [...prev, ...rejectedChips, ...uploadChips])

    uploads.forEach(({ key, file }) => {
      AppActions.uploadCoverageComparisonAttachment(file, role)
        .then((attachment) => update((f) => f.key === key, fromServer(attachment)))
        .catch((err: Error) => update((f) => f.key === key, { status: "error", error: `${ file.name }: ${ err.message }` }))
    })
  }

  const processingIds = files.filter((f) => f.status === "processing" && f.id).map((f) => f.id!).join(",")

  useEffect(() => {
    if(!processingIds) return

    const interval = setInterval(() => {
      processingIds.split(",").forEach((id) => {
        AppActions.getCoverageComparisonAttachment(id)
          .then((attachment) => update((f) => f.id === id, fromServer(attachment)))
          .catch(() => {})
      })
    }, ATTACHMENT_POLL_MS)

    return () => clearInterval(interval)
  }, [processingIds])

  const remove = (key: string) => {
    const file = files.find((f) => f.key === key)
    if(file?.id) AppActions.deleteCoverageComparisonAttachment(file.id).catch(() => {})
    setFiles((prev) => prev.filter((f) => f.key !== key))
  }

  // Moves the chip right away; puts it back if the server refuses (e.g. it's already part of a comparison)
  const move = (key: string, role: AppTypes.CoverageComparisonRole) => {
    const file = files.find((f) => f.key === key)
    if(!file?.id || file.role === role) return

    const previousRole = file.role
    update((f) => f.key === key, { role, moving: true })
    AppActions.setCoverageComparisonAttachmentRole(file.id, role)
      .then((attachment) => update((f) => f.key === key, { ...fromServer(attachment), moving: false }))
      .catch(() => update((f) => f.key === key, { role: previousRole, moving: false }))
  }

  const setLabel = (role: AppTypes.CoverageComparisonRole, value: string) => setSetLabels((prev) => ({ ...prev, [role]: value }))

  // Drops chips a comparison now owns (the server keeps them with it), and the labels typed for them
  const release = (ids: Set<string>) => {
    setFiles((prev) => prev.filter((f) => !f.id || !ids.has(f.id)))
    setSetLabels({ set_a: "", set_b: "" })
  }

  const readyIds = files.filter((f) => f.id && f.status !== "error").map((f) => f.id!)
  const busy = files.some((f) => f.status === "uploading" || f.status === "processing" || f.moving)
  const hasRead = (role: AppTypes.CoverageComparisonRole) => files.some((f) => f.role === role && f.status === "done")
  const canRun = hasRead("set_a") && hasRead("set_b") && !busy

  return { files, addFiles, remove, move, release, setLabels, setLabel, readyIds, busy, canRun, hasRead }
}

export type ComparisonFiles = ReturnType<typeof useComparisonFiles>

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

export const useCoverageComparisonChat = (staged: ComparisonFiles) => {
  const queryClient = useQueryClient()
  const { messages, setMessages, sessionId, saveSession, resetSession, hasConversation } = useChatSession<AppTypes.CoverageComparisonChatMessage>(CHAT_SESSION_KEY)
  const [scrollSignal, setScrollSignal] = useState(0)

  const announce = useCallback((text: string) => setMessages((prev) => [...prev, { role: "assistant", text }]), [setMessages])

  const comparisonStarted = async () => {
    await queryClient.invalidateQueries({ queryKey: MANIFEST_QUERY_KEY })
    staged.release(cachedSourceIds(queryClient))
    setScrollSignal((n) => n + 1)
  }

  const chat = useMutation({
    mutationFn: ({ message, attachmentIds }: { message: string, attachmentIds: string[] }) =>
      AppActions.postCoverageComparisonChat(message, attachmentIds, sessionId),
    onSuccess: async (turn) => {
      saveSession(turn.session_id)
      announce(turn.reply || "(no reply)")
      if(turn.tool_calls.some(startsComparison)) await comparisonStarted()
    },
    onError: () => announce("Sorry, something went wrong — please try again."),
  })

  const run = useMutation({
    mutationFn: ({ notes }: { notes: string }) =>
      AppActions.createCoverageComparison(staged.readyIds, {
        notes,
        setALabel: staged.setLabels.set_a.trim(),
        setBLabel: staged.setLabels.set_b.trim(),
      }),
    onSuccess: async (comparison) => {
      staged.release(new Set(comparison.sources.map((source) => source.id)))
      announce(`Comparing ${ comparison.client_name ? clientName(comparison) : "the two sets" } now — this takes a few minutes. It'll show in the list below as soon as it's done, and you can ask me about it here.`)
      await comparisonStarted()
    },
    onError: (err: Error) => announce(`I couldn't start the comparison. ${ err.message }`),
  })

  const isPending = chat.isPending || run.isPending

  const sendMessage = (message: string) => {
    const trimmed = message.trim()
    if(!trimmed || isPending) return

    setMessages((prev) => [...prev, { role: "user", text: trimmed }])
    chat.mutate({ message: trimmed, attachmentIds: staged.readyIds })
  }

  const runComparison = (notes: string) => {
    if(!staged.canRun || isPending) return

    const trimmed = notes.trim()
    setMessages((prev) => [...prev, { role: "user", text: trimmed ? `Compare — ${ trimmed }` : "Compare" }])
    run.mutate({ notes: trimmed })
  }

  // Waits out an in-flight turn, otherwise its reply would land in (and re-save the session of) the new chat
  const canStartNewChat = hasConversation && !isPending
  const newChat = () => {
    if(canStartNewChat) resetSession()
  }

  return { messages, sendMessage, runComparison, announce, isPending, scrollSignal, newChat, canStartNewChat }
}

export type CoverageComparisonChat = ReturnType<typeof useCoverageComparisonChat>

export const useHandleChatPanel = (chat: CoverageComparisonChat, staged: ComparisonFiles) => {
  const [draft, setDraft] = useState("")
  const messagesRef = useRef<HTMLDivElement>(null)

  const send = () => {
    if(!draft.trim() || staged.busy) return
    chat.sendMessage(draft)
    setDraft("")
  }

  // Anything typed rides along as notes for the comparison
  const canRun = staged.canRun && !chat.isPending
  const run = () => {
    if(!canRun) return
    chat.runComparison(draft)
    setDraft("")
  }

  return { messagesRef, send, run, canRun, draft, setDraft }
}

const FOOTER_MESSAGE_TIMEOUT_MS = 4000

export const useHandleComparisonList = (groups: AppTypes.CoverageComparisonGroup[], scrollSignal: number) => {
  const rowRefs = useRef(new Map<string, HTMLLIElement>())
  const lastHandledSignal = useRef(0)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [footerMessage, setFooterMessage] = useState<{ text: string, error: boolean } | null>(null)
  const footerMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const notify = useCallback((text: string, error = false) => {
    clearTimeout(footerMessageTimeoutRef.current)
    setFooterMessage({ text, error })
    footerMessageTimeoutRef.current = setTimeout(() => setFooterMessage(null), FOOTER_MESSAGE_TIMEOUT_MS)
  }, [])

  useEffect(() => () => clearTimeout(footerMessageTimeoutRef.current), [])

  useEffect(() => {
    if(scrollSignal === 0 || scrollSignal === lastHandledSignal.current) return
    lastHandledSignal.current = scrollSignal

    const all = groups.flatMap((group) => group.comparisons)
    if(all.length === 0) return

    const newest = all.reduce((a, b) => (a.generated_at > b.generated_at ? a : b))
    rowRefs.current.get(newest.id)?.scrollIntoView({ behavior: "smooth", block: "center" })

    clearTimeout(highlightTimeoutRef.current)
    setHighlightedId(newest.id)
    highlightTimeoutRef.current = setTimeout(() => setHighlightedId(null), 2000)
  }, [groups, scrollSignal])

  useEffect(() => () => clearTimeout(highlightTimeoutRef.current), [])

  return { rowRefs, highlightedId, footerMessage, notify }
}

export const useHandleComparisonSection = (comparisons: AppTypes.CoverageComparisonEntry[], order: string) => {
  const sorted = sortComparisons(comparisons, order)
  const [page, setPage] = useState(0)
  const currentPage = Math.min(page, Math.max(Math.ceil(sorted.length / PAGE_SIZE) - 1, 0))
  const pageComparisons = sorted.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)
  const sectionRef = useRef<HTMLDivElement>(null)

  return { pageComparisons, currentPage, totalItems: sorted.length, setPage, sectionRef }
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
