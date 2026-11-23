import { useState, useRef, useEffect, useCallback } from "react"
import { useCountedDownload } from "@components/team/utils/DownloadOdometer/hooks"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { usePreviewModal } from "@components/team/utils/PreviewModal/hooks"
import { useChatSession } from "@utils/hooks"
import * as AppActions from '@context/App/AppActions'
import { PAGE_SIZE } from "@components/team/utils/Pagination/utils"
import { sortChecks, hasRunningCheck, isPolicyCheckCall, clientName } from "./utils"

// Types
import type { QueryClient } from "@tanstack/react-query"
import type * as AppTypes from "@context/App/types"
import type { ChatAttachment } from "@components/team/utils/ChatInput/types"

const MANIFEST_QUERY_KEY = ["policy-check-manifest"]
const CHAT_SESSION_KEY = "boxwood_policy_check_chat_session"
const ATTACHMENT_POLL_MS = 4000
const RUNNING_POLL_MS = 5000

export const usePolicyCheckManifest = (scope: AppTypes.PolicyCheckScope) => useQuery({
  queryKey: [...MANIFEST_QUERY_KEY, scope],
  queryFn: () => AppActions.getPolicyCheckManifest(scope),
  placeholderData: keepPreviousData,
  // Checks run 2–6 minutes in the background; keep polling until none are left running
  refetchInterval: (query) => (hasRunningCheck(query.state.data) ? RUNNING_POLL_MS : false),
})

export const useDownloadPolicyCheckFile = () => useCountedDownload(AppActions.downloadPolicyCheckFile)

export const useDownloadPolicyCheckPdf = () => useCountedDownload(AppActions.downloadPolicyCheckPdf)

export const useDeletePolicyCheck = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: AppActions.deletePolicyCheck,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MANIFEST_QUERY_KEY }),
  })
}

export const usePreviewPolicyCheckFile = (filename: string) =>
  usePreviewModal(useCallback(() => AppActions.getPolicyCheckFileBlob(filename, true), [filename]))

// Ids of every file any cached check already owns, so the zones can let go of them
const cachedSourceIds = (queryClient: QueryClient) =>
  new Set(queryClient.getQueriesData<AppTypes.PolicyCheckManifest>({ queryKey: MANIFEST_QUERY_KEY })
    .flatMap(([, manifest]) => manifest?.groups ?? [])
    .flatMap((group) => group.checks)
    .flatMap((check) => check.sources.map((source) => source.id)))

export type StagedFile = ChatAttachment & {
  id?: string
  role: AppTypes.PolicyCheckRole
  profile?: AppTypes.PolicyCheckProfile
  moving?: boolean
}

const fromServer = (attachment: AppTypes.PolicyCheckAttachment): Partial<StagedFile> => ({
  id: attachment.id,
  role: attachment.role,
  status: attachment.status,
  error: attachment.error,
  profile: attachment.profile,
})

export const usePolicyCheckFiles = () => {
  const [files, setFiles] = useState<StagedFile[]>([])
  const nextKey = useRef(0)

  const update = (match: (f: StagedFile) => boolean, changes: Partial<StagedFile>) =>
    setFiles((prev) => prev.map((f) => (match(f) ? { ...f, ...changes } : f)))

  const addFiles = (role: AppTypes.PolicyCheckRole, accepted: File[], rejected: string[]) => {
    const rejectedChips = rejected.map((error) => ({ key: `r${ nextKey.current++ }`, role, filename: error, status: "error" as const, error }))
    const uploads = accepted.map((file) => ({ key: `u${ nextKey.current++ }`, file }))
    const uploadChips = uploads.map(({ key, file }) => ({ key, role, filename: file.name, status: "uploading" as const }))
    setFiles((prev) => [...prev, ...rejectedChips, ...uploadChips])

    uploads.forEach(({ key, file }) => {
      AppActions.uploadPolicyCheckAttachment(file, role)
        .then((attachment) => update((f) => f.key === key, fromServer(attachment)))
        .catch((err: Error) => update((f) => f.key === key, { status: "error", error: `${ file.name }: ${ err.message }` }))
    })
  }

  const processingIds = files.filter((f) => f.status === "processing" && f.id).map((f) => f.id!).join(",")

  useEffect(() => {
    if(!processingIds) return

    const interval = setInterval(() => {
      processingIds.split(",").forEach((id) => {
        AppActions.getPolicyCheckAttachment(id)
          .then((attachment) => update((f) => f.id === id, fromServer(attachment)))
          .catch(() => {})
      })
    }, ATTACHMENT_POLL_MS)

    return () => clearInterval(interval)
  }, [processingIds])

  const remove = (key: string) => {
    const file = files.find((f) => f.key === key)
    if(file?.id) AppActions.deletePolicyCheckAttachment(file.id).catch(() => {})
    setFiles((prev) => prev.filter((f) => f.key !== key))
  }

  // Moves the chip right away; puts it back if the server refuses (e.g. it's already part of a check)
  const move = (key: string, role: AppTypes.PolicyCheckRole) => {
    const file = files.find((f) => f.key === key)
    if(!file?.id || file.role === role) return

    const previousRole = file.role
    update((f) => f.key === key, { role, moving: true })
    AppActions.setPolicyCheckAttachmentRole(file.id, role)
      .then((attachment) => update((f) => f.key === key, { ...fromServer(attachment), moving: false }))
      .catch(() => update((f) => f.key === key, { role: previousRole, moving: false }))
  }

  // Drops chips a check now owns; the server keeps them with the check, so nothing is deleted
  const release = (ids: Set<string>) => setFiles((prev) => prev.filter((f) => !f.id || !ids.has(f.id)))

  const readyIds = files.filter((f) => f.id && f.status !== "error").map((f) => f.id!)
  const busy = files.some((f) => f.status === "uploading" || f.status === "processing" || f.moving)
  const hasRead = (role: AppTypes.PolicyCheckRole) => files.some((f) => f.role === role && f.status === "done")
  const canRun = hasRead("baseline") && hasRead("compared") && !busy

  return { files, addFiles, remove, move, release, readyIds, busy, canRun, hasRead }
}

export type PolicyCheckFiles = ReturnType<typeof usePolicyCheckFiles>

const listNames = (names: string[]) =>
  names.length <= 2 ? names.join(" and ") : `${ names.slice(0, -1).join(", ") } and ${ names.at(-1) }`

export const announceReading = (names: string[]) =>
  `Reading ${ listNames(names) } — this usually takes under a minute. I'll flag anything that looks like it's in the wrong box.`

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

export const usePolicyCheckChat = (staged: PolicyCheckFiles) => {
  const queryClient = useQueryClient()
  const { messages, setMessages, sessionId, saveSession, resetSession, hasConversation } = useChatSession<AppTypes.PolicyCheckChatMessage>(CHAT_SESSION_KEY)
  const [scrollSignal, setScrollSignal] = useState(0)

  const announce = useCallback((text: string) => setMessages((prev) => [...prev, { role: "assistant", text }]), [setMessages])

  const checkStarted = async () => {
    await queryClient.invalidateQueries({ queryKey: MANIFEST_QUERY_KEY })
    staged.release(cachedSourceIds(queryClient))
    setScrollSignal((n) => n + 1)
  }

  const chat = useMutation({
    mutationFn: ({ message, attachmentIds }: { message: string, attachmentIds: string[] }) =>
      AppActions.postPolicyCheckChat(message, attachmentIds, sessionId),
    onSuccess: async (turn) => {
      saveSession(turn.session_id)
      announce(turn.reply || "(no reply)")
      if(turn.tool_calls.some(isPolicyCheckCall)) await checkStarted()
    },
    onError: () => announce("Sorry, something went wrong — please try again."),
  })

  const run = useMutation({
    mutationFn: ({ notes }: { notes: string }) => AppActions.createPolicyCheck(staged.readyIds, notes),
    onSuccess: async (check) => {
      staged.release(new Set(check.sources.map((source) => source.id)))
      announce(`Checking ${ check.client_name ? clientName(check) : "the policy" } now — this takes 2–6 minutes. It'll show in the list below as soon as it's done, and you can ask me about any item it flags.`)
      await checkStarted()
    },
    onError: (err: Error) => announce(`I couldn't start the check. ${ err.message }`),
  })

  const isPending = chat.isPending || run.isPending

  const sendMessage = (message: string) => {
    const trimmed = message.trim()
    if(!trimmed || isPending) return

    setMessages((prev) => [...prev, { role: "user", text: trimmed }])
    chat.mutate({ message: trimmed, attachmentIds: staged.readyIds })
  }

  const runCheck = (notes: string) => {
    if(!staged.canRun || isPending) return

    const trimmed = notes.trim()
    setMessages((prev) => [...prev, { role: "user", text: trimmed ? `Check — ${ trimmed }` : "Check" }])
    run.mutate({ notes: trimmed })
  }

  // Waits out an in-flight turn, otherwise its reply would land in (and re-save the session of) the new chat
  const canStartNewChat = hasConversation && !isPending
  const newChat = () => {
    if(canStartNewChat) resetSession()
  }

  return { messages, sendMessage, runCheck, announce, isPending, scrollSignal, newChat, canStartNewChat }
}

export type PolicyCheckChat = ReturnType<typeof usePolicyCheckChat>

export const useHandleChatPanel = (chat: PolicyCheckChat, staged: PolicyCheckFiles) => {
  const [draft, setDraft] = useState("")
  const messagesRef = useRef<HTMLDivElement>(null)

  const send = () => {
    if(!draft.trim() || staged.busy) return
    chat.sendMessage(draft)
    setDraft("")
  }

  // Anything typed rides along as notes for the check
  const canRun = staged.canRun && !chat.isPending
  const run = () => {
    if(!canRun) return
    chat.runCheck(draft)
    setDraft("")
  }

  return { messagesRef, send, run, canRun, draft, setDraft }
}

export const useHandleCheckList = (groups: AppTypes.PolicyCheckGroup[], scrollSignal: number) => {
  const rowRefs = useRef(new Map<string, HTMLLIElement>())
  const lastHandledSignal = useRef(0)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if(scrollSignal === 0 || scrollSignal === lastHandledSignal.current) return
    lastHandledSignal.current = scrollSignal

    const all = groups.flatMap((group) => group.checks)
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

export const useHandleCheckSection = (checks: AppTypes.PolicyCheckEntry[], order: string) => {
  const sorted = sortChecks(checks, order)
  const [page, setPage] = useState(0)
  const currentPage = Math.min(page, Math.max(Math.ceil(sorted.length / PAGE_SIZE) - 1, 0))
  const pageChecks = sorted.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)
  const sectionRef = useRef<HTMLDivElement>(null)

  return { pageChecks, currentPage, totalItems: sorted.length, setPage, sectionRef }
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
