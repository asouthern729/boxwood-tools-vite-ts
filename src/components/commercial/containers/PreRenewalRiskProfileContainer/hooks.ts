import { useState, useRef, useEffect, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PAGE_SIZE } from "@components/team/utils/Pagination"
import { usePreviewModal } from "@components/team/utils/PreviewModal/hooks"
import * as AppActions from '@context/App/AppActions'
import { sortSummaries } from '@components/commercial/context/utils'

// Types
import type * as AppTypes from "@context/App/types"

const MANIFEST_QUERY_KEY = ["pre-renewal-risk-profile-manifest"]
const CHAT_SESSION_KEY = "boxwood_pre_renewal_risk_profile_chat_session"

export const usePreRenewalRiskProfileManifest = () => useQuery({
  queryKey: MANIFEST_QUERY_KEY,
  queryFn: AppActions.getPreRenewalRiskProfileManifest,
})

export const useDownloadPreRenewalRiskProfileFile = () => useMutation({
  mutationFn: AppActions.downloadPreRenewalRiskProfileFile,
})

export const useDeletePreRenewalRiskProfileFile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: AppActions.deletePreRenewalRiskProfileFile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MANIFEST_QUERY_KEY }),
  })
}

export const usePreviewPreRenewalRiskProfileFile = (filename: string) =>
  usePreviewModal(useCallback(() => AppActions.getPreRenewalRiskProfileFileBlob(filename), [filename]))

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

export const usePreRenewalRiskProfileChat = () => {
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<AppTypes.PreRenewalRiskProfileChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | undefined>(() => sessionStorage.getItem(CHAT_SESSION_KEY) ?? undefined)
  const [scrollSignal, setScrollSignal] = useState(0)

  const { mutate, isPending } = useMutation({
    mutationFn: (message: string) => AppActions.postPreRenewalRiskProfileChat(message, sessionId),
    onSuccess: async (turn) => {
      sessionStorage.setItem(CHAT_SESSION_KEY, turn.session_id)
      setSessionId(turn.session_id)
      setMessages((prev) => [...prev, { role: "assistant", text: turn.reply || "(no reply)" }])

      const builtProfile = turn.tool_calls.some((call) => call.name.endsWith("risk_profile"))
      if(builtProfile) {
        await queryClient.invalidateQueries({ queryKey: MANIFEST_QUERY_KEY })
        setScrollSignal((n) => n + 1)
      }
    },
    onError: () => {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, something went wrong — please try again." }])
    },
  })

  const sendMessage = (message: string) => {
    const trimmed = message.trim()
    if(!trimmed || isPending) return

    setMessages((prev) => [...prev, { role: "user", text: trimmed }])
    mutate(trimmed)
  }

  return { messages, sendMessage, isPending, scrollSignal }
}

export const useHandleChatPanel = (onSend: (message: string) => void) => {
  const [draft, setDraft] = useState("")
  const messagesRef = useRef<HTMLDivElement>(null)

  const send = () => {
    onSend(draft)
    setDraft("")
  }

  return { messagesRef, send, draft, setDraft }
}

const DELETED_MESSAGE_TIMEOUT_MS = 4000

export const useHandleCsrGroupList = (groups: AppTypes.PreRenewalRiskProfileCsrGroup[], scrollSignal: number) => {
  const rowRefs = useRef(new Map<string, HTMLLIElement>())
  const lastHandledSignal = useRef(0)
  const [highlightedFilename, setHighlightedFilename] = useState<string | null>(null)
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [deletedMessage, setDeletedMessage] = useState<string | null>(null)
  const deletedMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const notifyDeleted = (clientName: string) => {
    clearTimeout(deletedMessageTimeoutRef.current)
    setDeletedMessage(`Deleted ${ clientName }...`)
    deletedMessageTimeoutRef.current = setTimeout(() => setDeletedMessage(null), DELETED_MESSAGE_TIMEOUT_MS)
  }

  useEffect(() => () => clearTimeout(deletedMessageTimeoutRef.current), [])

  useEffect(() => {
    if(scrollSignal === 0 || scrollSignal === lastHandledSignal.current) return
    lastHandledSignal.current = scrollSignal

    const allSummaries = groups.flatMap((group) => group.summaries)
    if(allSummaries.length === 0) return

    const newest = allSummaries.reduce((a, b) => (a.generated_at > b.generated_at ? a : b))
    rowRefs.current.get(newest.filename)?.scrollIntoView({ behavior: "smooth", block: "center" })

    clearTimeout(highlightTimeoutRef.current)
    setHighlightedFilename(newest.filename)
    highlightTimeoutRef.current = setTimeout(() => setHighlightedFilename(null), 2000)
  }, [groups, scrollSignal])

  useEffect(() => () => clearTimeout(highlightTimeoutRef.current), [])

  return { rowRefs, highlightedFilename, deletedMessage, notifyDeleted }
}

export const useHandleCsrSection = (summaries: AppTypes.PreRenewalRiskProfileManifestEntry[], order: string) => {
  const sorted = sortSummaries(summaries, order)
  const [page, setPage] = useState(0)
  const currentPage = Math.min(page, Math.max(Math.ceil(sorted.length / PAGE_SIZE) - 1, 0))
  const pageSummaries = sorted.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)
  const sectionRef = useRef<HTMLDivElement>(null)

  return { pageSummaries, currentPage, totalItems: sorted.length, setPage, sectionRef }
}