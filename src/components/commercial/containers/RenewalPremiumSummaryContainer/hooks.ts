import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

// Actions
import {
  downloadRenewalPremiumSummaryFile,
  getRenewalPremiumSummaryManifest,
  postRenewalPremiumSummaryChat
} from "@context/App/AppActions"

// Types
import type * as AppTypes from "@context/App/types"

const MANIFEST_QUERY_KEY = ["renewal-premium-summary-manifest"]
const CHAT_SESSION_KEY = "boxwood_renewal_premium_summary_chat_session"

export const useRenewalPremiumSummaryManifest = () => useQuery({
  queryKey: MANIFEST_QUERY_KEY,
  queryFn: getRenewalPremiumSummaryManifest,
})

export const useDownloadRenewalPremiumSummaryFile = () => useMutation({
  mutationFn: downloadRenewalPremiumSummaryFile,
})

// Session id persists across a reload (sessionStorage) so a resumed conversation keeps its agent-
// side context, matching site/roadmap.html's chat — the message transcript itself doesn't persist,
// only the id needed to resume it.
export const useRenewalPremiumSummaryChat = () => {
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<AppTypes.RenewalPremiumSummaryChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | undefined>(() => sessionStorage.getItem(CHAT_SESSION_KEY) ?? undefined)
  // Bumped only when a turn actually called renewal_premium_summary (most turns, e.g. "what's
  // renewing soon?", never touch the archive) — the index below watches this to scroll to the
  // just-(re)generated row once the refreshed manifest data has landed.
  const [scrollSignal, setScrollSignal] = useState(0)

  const { mutate, isPending } = useMutation({
    mutationFn: (message: string) => postRenewalPremiumSummaryChat(message, sessionId),
    onSuccess: async (turn) => {
      sessionStorage.setItem(CHAT_SESSION_KEY, turn.session_id)
      setSessionId(turn.session_id)
      setMessages((prev) => [...prev, { role: "assistant", text: turn.reply || "(no reply)" }])

      const builtWorkbook = turn.tool_calls.some((call) => call.name.endsWith("renewal_premium_summary"))
      if(builtWorkbook) {
        // Awaited so the manifest refetch has actually landed in the cache before the scroll signal
        // fires — otherwise the index would scroll to what's still the previous data.
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
