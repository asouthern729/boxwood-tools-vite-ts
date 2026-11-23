import { useState, useRef, useEffect, useCallback } from "react"
import { useCountedDownload } from "@components/team/utils/DownloadOdometer/hooks"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useChatSession, documentId } from "@utils/hooks"
import * as AppActions from '@context/App/AppActions'
import { sortSummaries, DOCUMENT_MANIFEST_QUERY_KEYS } from '@components/commercial/context/utils'
import { PAGE_SIZE } from "@components/team/utils/Pagination/utils"

// Types
import type * as AppTypes from "@context/App/types"

const MANIFEST_QUERY_KEY = DOCUMENT_MANIFEST_QUERY_KEYS["renewal-premium-summary"]
const CHAT_SESSION_KEY = "boxwood_renewal_premium_spreadsheet_chat_session"

export const useRenewalPremiumSummaryManifest = () => useQuery({
  queryKey: MANIFEST_QUERY_KEY,
  queryFn: AppActions.getRenewalPremiumSummaryManifest,
})

export const useDownloadRenewalPremiumSummaryFile = () => useCountedDownload(AppActions.downloadRenewalPremiumSummaryFile)

export const useDeleteRenewalPremiumSummaryFile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: AppActions.deleteRenewalPremiumSummaryFile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MANIFEST_QUERY_KEY }),
  })
}

// The page's one preview modal follows ?doc= (useDocumentParam); this is its document's fetch.
export const useRenewalPremiumSummaryPreviewBlob = (filename: string) =>
  useCallback(() => AppActions.getRenewalPremiumSummaryFileBlob(filename, true), [filename])

// The manifest entry the URL's ?doc= names, wherever it sits — filters and pages don't hide it.
export const useDocumentEntry = (groups: AppTypes.RenewalPremiumSummaryCsrGroup[], docId: string | null) =>
  docId ? groups.flatMap((group) => group.summaries).find((summary) => documentId(summary) === docId) : undefined

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

export const useRenewalPremiumSummaryChat = () => {
  const queryClient = useQueryClient()
  const { messages, setMessages, sessionId, saveSession, resetSession, hasConversation } = useChatSession<AppTypes.RenewalPremiumSummaryChatMessage>(CHAT_SESSION_KEY)
  const [scrollSignal, setScrollSignal] = useState(0)

  const { mutate, isPending } = useMutation({
    mutationFn: (message: string) => AppActions.postRenewalPremiumSummaryChat(message, sessionId),
    onSuccess: async (turn) => {
      saveSession(turn.session_id)
      setMessages((prev) => [...prev, { role: "assistant", text: turn.reply || "(no reply)" }])

      const builtWorkbook = turn.tool_calls.some((call) => call.name.endsWith("renewal_premium_spreadsheet"))
      if(builtWorkbook) {
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

  // Waits out an in-flight turn, otherwise its reply would land in (and re-save the session of) the new chat
  const canStartNewChat = hasConversation && !isPending
  const newChat = () => {
    if(canStartNewChat) resetSession()
  }

  return { messages, sendMessage, isPending, scrollSignal, newChat, canStartNewChat }
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

export const useHandleCsrGroupList = (groups: AppTypes.RenewalPremiumSummaryCsrGroup[], scrollSignal: number) => {
  const rowRefs = useRef(new Map<string, HTMLLIElement>())
  const lastHandledSignal = useRef(0)
  const [highlightedFilename, setHighlightedFilename] = useState<string | null>(null)
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

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

  return { rowRefs, highlightedFilename }
}

export const useHandleCsrSection = (summaries: AppTypes.RenewalPremiumSummaryManifestEntry[], order: string) => {
  const sorted = sortSummaries(summaries, order)
  const [page, setPage] = useState(0)
  const currentPage = Math.min(page, Math.max(Math.ceil(sorted.length / PAGE_SIZE) - 1, 0))
  const pageSummaries = sorted.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)
  const sectionRef = useRef<HTMLDivElement>(null)

  return { pageSummaries, currentPage, totalItems: sorted.length, setPage, sectionRef }
}