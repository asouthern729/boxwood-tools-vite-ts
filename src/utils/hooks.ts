import { useEffect, useState } from "react"
import { QueryClient } from "@tanstack/react-query"

export const useHandleVisibilityChange = (queryClient: QueryClient) => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if(!document.hidden) {
        queryClient.refetchQueries()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}

export const useSetTheme = (theme: string) => {
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    return () => {
      delete document.documentElement.dataset.theme
    }
  }, [theme])
}

export const useHandleChatScrolling = <T,>(messagesRef: React.RefObject<HTMLDivElement | null>, messages: T[], isPending: boolean) => {
  useEffect(() => {
    const el = messagesRef.current
    if(el) el.scrollTop = el.scrollHeight
  }, [messages, isPending])
}

export const usePersistedState = (key: string, defaultValue: string) => {
  const [value, setValue] = useState(() => localStorage.getItem(key) ?? defaultValue)

  useEffect(() => {
    localStorage.setItem(key, value)
  }, [key, value])

  return [value, setValue] as const
}

// Page chats keep their agent session id in sessionStorage so a reload continues the same conversation.
// resetSession starts over: the next turn goes out with no session_id, so the backend opens a fresh one.
export const useChatSession = <M,>(storageKey: string) => {
  const [messages, setMessages] = useState<M[]>([])
  const [sessionId, setSessionId] = useState<string | undefined>(() => sessionStorage.getItem(storageKey) ?? undefined)

  const saveSession = (id: string) => {
    sessionStorage.setItem(storageKey, id)
    setSessionId(id)
  }

  const resetSession = () => {
    sessionStorage.removeItem(storageKey)
    setSessionId(undefined)
    setMessages([])
  }

  // A restored session has no visible messages but is still a live conversation
  const hasConversation = messages.length > 0 || sessionId !== undefined

  return { messages, setMessages, sessionId, saveSession, resetSession, hasConversation }
}
