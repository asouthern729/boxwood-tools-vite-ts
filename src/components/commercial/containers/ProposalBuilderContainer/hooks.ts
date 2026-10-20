import { useState, useRef, useEffect, useCallback } from "react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { usePreviewModal } from "@components/team/utils/PreviewModal/hooks"
import * as AppActions from '@context/App/AppActions'
import { PAGE_SIZE } from "@components/team/utils/Pagination/utils"
import { sortProposals } from "./utils"

// Types
import type * as AppTypes from "@context/App/types"
import type { ChatAttachment } from "@components/team/utils/ChatInput/types"

const MANIFEST_QUERY_KEY = ["proposal-builder-manifest"]
const CHAT_SESSION_KEY = "boxwood_proposal_builder_chat_session"
const PREPARED_BY_KEY = "boxwood_proposal_builder_prepared_by"
const ATTACHMENT_POLL_MS = 4000
const BUILD_MESSAGE = "Build the proposal from these files."

export const useProposalManifest = (scope: AppTypes.ProposalScope) => useQuery({
  queryKey: [...MANIFEST_QUERY_KEY, scope],
  queryFn: () => AppActions.getProposalManifest(scope),
  placeholderData: keepPreviousData,
})

export const useDownloadProposalFile = () => useMutation({
  mutationFn: AppActions.downloadProposalFile,
})

export const useDownloadProposalPdf = () => useMutation({
  mutationFn: AppActions.downloadProposalPdf,
})

export const useDeleteProposalFile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: AppActions.deleteProposalFile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MANIFEST_QUERY_KEY }),
  })
}

export const usePreviewProposalFile = (filename: string) =>
  usePreviewModal(useCallback(() => AppActions.getProposalFileBlob(filename), [filename]))

type StagedAttachment = ChatAttachment & { id?: string }

export const useProposalAttachments = () => {
  const [attachments, setAttachments] = useState<StagedAttachment[]>([])
  const nextKey = useRef(0)

  const update = (key: string, changes: Partial<StagedAttachment>) =>
    setAttachments((prev) => prev.map((a) => (a.key === key ? { ...a, ...changes } : a)))

  const addFiles = (files: File[], rejected: string[]) => {
    const rejectedChips = rejected.map((error) => ({ key: `r${ nextKey.current++ }`, filename: error, status: "error" as const, error }))
    const uploads = files.map((file) => ({ key: `u${ nextKey.current++ }`, file }))
    const uploadChips = uploads.map(({ key, file }) => ({ key, filename: file.name, status: "uploading" as const }))
    setAttachments((prev) => [...prev, ...rejectedChips, ...uploadChips])

    uploads.forEach(({ key, file }) => {
      AppActions.uploadProposalAttachment(file)
        .then((attachment) => update(key, { id: attachment.id, status: attachment.status, error: attachment.error }))
        .catch((err: Error) => update(key, { status: "error", error: `${ file.name }: ${ err.message }` }))
    })
  }

  const processingIds = attachments.filter((a) => a.status === "processing" && a.id).map((a) => a.id!).join(",")

  useEffect(() => {
    if(!processingIds) return

    const interval = setInterval(() => {
      processingIds.split(",").forEach((id) => {
        AppActions.getProposalAttachment(id)
          .then((attachment) => setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, status: attachment.status, error: attachment.error } : a))))
          .catch(() => {})
      })
    }, ATTACHMENT_POLL_MS)

    return () => clearInterval(interval)
  }, [processingIds])

  const remove = (key: string) => {
    const attachment = attachments.find((a) => a.key === key)
    if(attachment?.id) AppActions.deleteProposalAttachment(attachment.id).catch(() => {})
    setAttachments((prev) => prev.filter((a) => a.key !== key))
  }

  // Failed uploads have nothing to send; processing ones are fine, the server waits on them
  const ready = attachments.filter((a) => a.id && a.status !== "error")
  const uploading = attachments.some((a) => a.status === "uploading")
  const allRead = ready.length > 0 && attachments.every((a) => a.status === "done" || a.status === "error")

  const take = () => {
    setAttachments((prev) => prev.filter((a) => !ready.includes(a)))
    return ready.map((a) => a.id!)
  }

  return { attachments, addFiles, remove, take, uploading, allRead, ready }
}

const readPreparedBy = () => {
  try {
    return localStorage.getItem(PREPARED_BY_KEY)
  } catch {
    return null
  }
}

const savePreparedBy = (turn: AppTypes.ProposalChatTurn) => {
  const call = turn.tool_calls.findLast((c) => c.name.endsWith("proposal_builder"))
  const preparedBy = (call?.input as { prepared_by?: unknown } | undefined)?.prepared_by
  if(typeof preparedBy !== "string" || !preparedBy.trim()) return

  try {
    localStorage.setItem(PREPARED_BY_KEY, preparedBy.trim())
  } catch {
    // Storage blocked; Claude just asks again next time
  }
}

const listNames = (names: string[]) =>
  names.length <= 2 ? names.join(" and ") : `${ names.slice(0, -1).join(", ") } and ${ names.at(-1) }`

export const announceReading = (names: string[]) =>
  `Reading ${ listNames(names) } — this usually takes about a minute. Add any other files and notes for the proposal, then press Build proposal.`

export const useAnnounceReadErrors = (attachments: ChatAttachment[], onAnnounce: (text: string) => void) => {
  const announced = useRef(new Set<string>())

  useEffect(() => {
    attachments
      .filter((a) => a.status === "error" && a.key.startsWith("u") && !announced.current.has(a.key))
      .forEach((a) => {
        announced.current.add(a.key)
        onAnnounce(`I couldn't read ${ a.filename }. ${ a.error?.replace(`${ a.filename }: `, "") ?? "" }`.trim())
      })
  }, [attachments, onAnnounce])
}

export const useProposalBuilderChat = () => {
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<AppTypes.ProposalChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | undefined>(() => sessionStorage.getItem(CHAT_SESSION_KEY) ?? undefined)
  const [scrollSignal, setScrollSignal] = useState(0)

  const { mutate, isPending } = useMutation({
    mutationFn: ({ message, attachmentIds }: { message: string, attachmentIds: string[] }) =>
      AppActions.postProposalChat(message, attachmentIds, sessionId, readPreparedBy()),
    onSuccess: async (turn) => {
      sessionStorage.setItem(CHAT_SESSION_KEY, turn.session_id)
      setSessionId(turn.session_id)
      setMessages((prev) => [...prev, { role: "assistant", text: turn.reply || "(no reply)" }])

      savePreparedBy(turn)

      const builtProposal = turn.tool_calls.some((call) => call.name.endsWith("proposal_builder"))
      if(builtProposal) {
        await queryClient.invalidateQueries({ queryKey: MANIFEST_QUERY_KEY })
        setScrollSignal((n) => n + 1)
      }
    },
    onError: () => {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, something went wrong — please try again." }])
    },
  })

  const announce = useCallback((text: string) => setMessages((prev) => [...prev, { role: "assistant", text }]), [])

  // shown: what the chat displays for the user's turn, when it differs from what Claude is sent
  const sendMessage = (message: string, attachmentIds: string[], attachedNames: string[], shown?: string) => {
    const trimmed = message.trim()
    if(!trimmed || isPending) return

    const display = shown ?? trimmed
    const text = attachedNames.length > 0 ? `${ display }\n\n📎 ${ attachedNames.join(", ") }` : display
    setMessages((prev) => [...prev, { role: "user", text }])
    mutate({ message: trimmed, attachmentIds })
  }

  return { messages, sendMessage, announce, isPending, scrollSignal }
}

export const useHandleChatPanel = (
  onSend: (message: string, attachmentIds: string[], attachedNames: string[], shown?: string) => void,
  staged: ReturnType<typeof useProposalAttachments>,
  isPending: boolean
) => {
  const [draft, setDraft] = useState("")
  const messagesRef = useRef<HTMLDivElement>(null)

  const sendStaged = (message: string, shown?: string) => {
    const names = staged.ready.map((a) => a.filename)
    onSend(message, staged.take(), names, shown)
    setDraft("")
  }

  const send = () => {
    if(!draft.trim() || staged.uploading) return
    sendStaged(draft)
  }

  // Nothing builds on its own (Patrick, 2026-10-18: the first file to finish reading used to build
  // before the rest were in). Build waits for every staged file, and whatever's typed rides along as
  // guidance for the build.
  const canBuild = staged.allRead && !isPending
  const build = () => {
    if(!canBuild) return
    const guidance = draft.trim()
    sendStaged(guidance ? `${ BUILD_MESSAGE } ${ guidance }` : BUILD_MESSAGE, guidance || "Build proposal")
  }

  return { messagesRef, send, build, canBuild, draft, setDraft }
}

const FOOTER_MESSAGE_TIMEOUT_MS = 4000

export const useHandleProposalList = (groups: AppTypes.ProposalGroup[], scrollSignal: number) => {
  const rowRefs = useRef(new Map<string, HTMLLIElement>())
  const lastHandledSignal = useRef(0)
  const [highlightedFilename, setHighlightedFilename] = useState<string | null>(null)
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

    const all = groups.flatMap((group) => group.proposals)
    if(all.length === 0) return

    const newest = all.reduce((a, b) => ((a.last_refreshed_at ?? a.generated_at) > (b.last_refreshed_at ?? b.generated_at) ? a : b))
    rowRefs.current.get(newest.filename)?.scrollIntoView({ behavior: "smooth", block: "center" })

    clearTimeout(highlightTimeoutRef.current)
    setHighlightedFilename(newest.filename)
    highlightTimeoutRef.current = setTimeout(() => setHighlightedFilename(null), 2000)
  }, [groups, scrollSignal])

  useEffect(() => () => clearTimeout(highlightTimeoutRef.current), [])

  return { rowRefs, highlightedFilename, footerMessage, notify }
}

export const useHandleProposalSection = (proposals: AppTypes.ProposalManifestEntry[], order: string) => {
  const sorted = sortProposals(proposals, order)
  const [page, setPage] = useState(0)
  const currentPage = Math.min(page, Math.max(Math.ceil(sorted.length / PAGE_SIZE) - 1, 0))
  const pageProposals = sorted.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)
  const sectionRef = useRef<HTMLDivElement>(null)

  return { pageProposals, currentPage, totalItems: sorted.length, setPage, sectionRef }
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
