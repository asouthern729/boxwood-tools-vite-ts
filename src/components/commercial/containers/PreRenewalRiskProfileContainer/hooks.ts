import { useState, useRef, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { usePersistedState } from "@utils/hooks"
import * as AppActions from '@context/App/AppActions'
import { SUMMARY_ORDER_OPTIONS } from './utils'

const ORDER_STORAGE_KEY = "boxwood_pre_renewal_risk_profile_order"

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

export const useHandleCsrGroupList = (groups: AppTypes.PreRenewalRiskProfileCsrGroup[], scrollSignal: number) => {
  const rowRefs = useRef(new Map<string, HTMLLIElement>())
  const lastHandledSignal = useRef(0)
  const [highlightedFilename, setHighlightedFilename] = useState<string | null>(null)
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [order, setOrder] = usePersistedState(ORDER_STORAGE_KEY, SUMMARY_ORDER_OPTIONS[0].value)

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

  return { rowRefs, highlightedFilename, order, setOrder }
}