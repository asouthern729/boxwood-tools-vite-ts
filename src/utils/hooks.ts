import { useEffect } from "react"

// Types
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