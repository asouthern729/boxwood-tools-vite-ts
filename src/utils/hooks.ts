import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router"
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

// The open document lives in the URL (?doc=<document id>), not component state, so a link from one
// tool's preview can open the other tool's page straight onto its linked document — and back/forward
// step through the documents visited.
//
// Opening from a row pushes a history entry marked in its state; closing that entry steps back to
// the list, so history doesn't pile up duplicate list entries and Back still behaves. A document
// reached any other way (a link button, a pasted URL) has no entry of ours behind it, so closing it
// just drops ?doc in place.
export const useDocumentParam = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const docId = searchParams.get(DOC_PARAM)

  const openDocument = (id: string) => setSearchParams((prev) => {
    const next = new URLSearchParams(prev)
    next.set(DOC_PARAM, id)
    return next
  }, { state: { [DOC_OPENED_STATE]: true } })

  const closeDocument = () => {
    if(state?.[DOC_OPENED_STATE]) return navigate(-1)

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete(DOC_PARAM)
      return next
    }, { replace: true })
  }

  return { docId, openDocument, closeDocument }
}

// Closes a ?doc= that names no document on this page (deleted, or a stale link) and says so,
// rather than leaving the page silently without a preview.
export const useMissingDocumentNotice = (docId: string | null, found: boolean, closeDocument: () => void) => {
  const [message, setMessage] = useState<string | null>(null)
  // Latest closeDocument without making it a dependency: it changes every render, and re-running
  // before the URL updates could close twice (stepping back two history entries).
  const closeRef = useRef(closeDocument)
  useEffect(() => { closeRef.current = closeDocument })

  useEffect(() => {
    if(!docId) return
    if(found) return setMessage(null)

    setMessage("That document is no longer available.")
    closeRef.current()
  }, [docId, found])

  return message
}

// The ?doc= key for a manifest entry. Falls back to the filename for manifests from a backend that
// predates document ids, so Preview keeps working whichever deploys first.
export const documentId = (entry: { id?: string, filename: string }) => entry.id ?? entry.filename

export const DOC_PARAM = "doc"
const DOC_OPENED_STATE = "docOpenedFromList"
