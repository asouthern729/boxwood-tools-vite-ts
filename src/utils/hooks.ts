import { useEffect } from "react"
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