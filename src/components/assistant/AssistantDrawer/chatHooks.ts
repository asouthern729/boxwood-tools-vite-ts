import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router"
import { useHandleToolName } from "@pages/Tool/hooks"
import * as AppActions from "@context/App/AppActions"
import { CHAT_STORAGE_KEY, MAX_MESSAGE_CHARS, MAX_SENT_MESSAGES } from "./utils"

// Types
import type { AssistantContext, AssistantMessage } from "@context/App/types"

const loadMessages = (): AssistantMessage[] => {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(CHAT_STORAGE_KEY) ?? "[]")
    if(!Array.isArray(parsed)) return []
    // A reload mid-reply leaves an unanswered question last; drop it so turns still alternate
    return parsed.at(-1)?.role === "user" ? parsed.slice(0, -1) : parsed
  } catch {
    return []
  }
}

const saveMessages = (messages: AssistantMessage[]) => {
  try { sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages)) } catch { /* storage blocked */ }
}

// The last messages the server will read, starting on a user turn
const toSend = (messages: AssistantMessage[]) => {
  const recent = messages.slice(-MAX_SENT_MESSAGES)
  return recent[0]?.role === "assistant" ? recent.slice(1) : recent
}

// The page the user is on, so the assistant can answer "how do I use this page?"
const useAssistantContext = (): AssistantContext => {
  const { pathname } = useLocation()
  const tool = useHandleToolName()
  return { path: pathname, tool: tool ?? null }
}

// The conversation, kept per tab in sessionStorage. Lives in AssistantDrawer (mounted on every page
// while signed in), so closing the drawer doesn't cut off a reply or lose the draft. Each turn sends the conversation so far
// (stateless server) and streams the reply into `streaming` until it's done.
export const useAssistantChat = () => {
  const context = useAssistantContext()
  const [messages, setMessages] = useState<AssistantMessage[]>(loadMessages)
  const [streaming, setStreaming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => saveMessages(messages), [messages])
  useEffect(() => () => abortRef.current?.abort(), [])

  const isPending = streaming !== null

  // Sends the draft, or a starter question when one is given
  const send = (text = draft) => {
    const content = text.trim()
    if(!content || isPending) return
    if(content.length > MAX_MESSAGE_CHARS) {
      setError(`Messages can be up to ${ MAX_MESSAGE_CHARS.toLocaleString() } characters.`)
      return
    }

    const conversation = [...messages, { role: "user" as const, content }]
    const controller = new AbortController()
    abortRef.current = controller
    let reply = ""

    setMessages(conversation)
    setDraft("")
    setStreaming("")
    setError(null)

    AppActions.streamAssistantChat(toSend(conversation), context, (delta) => {
      reply += delta
      setStreaming(reply)
    }, controller.signal)
      .then(() => setMessages([...conversation, { role: "assistant", content: reply }]))
      .catch((err: Error) => {
        if(controller.signal.aborted) return
        // Keep a partial reply. With nothing back, take the unanswered question out of the
        // conversation (so the next turn doesn't send two user messages in a row) and put it back
        // in the input to retry.
        if(reply) setMessages([...conversation, { role: "assistant", content: reply }])
        else {
          setMessages(messages)
          setDraft((current) => current || content)
        }
        setError(err.message)
      })
      .finally(() => {
        if(abortRef.current === controller) {
          abortRef.current = null
          setStreaming(null)
        }
      })
  }

  const newChat = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(null)
    setMessages([])
    setError(null)
  }

  return { messages, streaming, isPending, error, draft, setDraft, send, newChat }
}

// Keeps the message list scrolled to the newest content as replies stream in
export const useScrollToBottom = (deps: unknown[]) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if(el) el.scrollTop = el.scrollHeight
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}

export type AssistantChat = ReturnType<typeof useAssistantChat>
