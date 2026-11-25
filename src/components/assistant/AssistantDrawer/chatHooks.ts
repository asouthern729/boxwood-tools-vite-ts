import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router"
import { useHandleToolName } from "@pages/Tool/hooks"
import * as AppActions from "@context/App/AppActions"
import { ATTACHMENTS_STORAGE_KEY, CHAT_STORAGE_KEY, MAX_ATTACHMENTS, MAX_MESSAGE_CHARS, MAX_SENT_MESSAGES } from "./utils"

// Types
import type { AssistantAttachment, AssistantContext, AssistantMessage } from "@context/App/types"

// A chip above the input: uploading, attached (has an id and page count), or a failed upload to dismiss
export type AssistantFile = {
  key: string
  filename: string
  status: "uploading" | "done" | "error"
  id?: string
  pages?: number
  error?: string
}

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

const loadAttachments = (): AssistantFile[] => {
  try {
    const parsed: AssistantAttachment[] = JSON.parse(sessionStorage.getItem(ATTACHMENTS_STORAGE_KEY) ?? "[]")
    if(!Array.isArray(parsed)) return []
    return parsed.map((a) => ({ key: a.id, id: a.id, filename: a.filename, pages: a.pages, status: "done" }))
  } catch {
    return []
  }
}

// Only attached files are kept; uploads in flight and failures don't survive a reload
const saveAttachments = (files: AssistantFile[]) => {
  const attached = files.filter((f) => f.status === "done" && f.id).map((f) => ({ id: f.id, filename: f.filename, pages: f.pages }))
  try { sessionStorage.setItem(ATTACHMENTS_STORAGE_KEY, JSON.stringify(attached)) } catch { /* storage blocked */ }
}

let nextFileKey = 0

// Files attached to the conversation, kept with it in sessionStorage. Saved files are re-checked on
// load since they expire after 24 hours. These are client documents, so removing a chip or starting a
// new chat deletes them on the server too.
const useAssistantAttachments = () => {
  const [files, setFiles] = useState<AssistantFile[]>(loadAttachments)

  useEffect(() => saveAttachments(files), [files])

  // Drops any restored file that has expired or been removed; keeps it if the check itself fails
  useEffect(() => {
    loadAttachments().forEach(({ id }) => {
      AppActions.getAssistantAttachment(id!)
        .then((attachment) => {
          if(!attachment) setFiles((prev) => prev.filter((f) => f.id !== id))
        })
        .catch(() => {})
    })
  }, [])

  const update = (key: string, changes: Partial<AssistantFile>) =>
    setFiles((prev) => prev.map((f) => (f.key === key ? { ...f, ...changes } : f)))

  const attachedCount = files.filter((f) => f.status !== "error").length
  const canAttach = attachedCount < MAX_ATTACHMENTS

  // Returns a message when some files were turned away for going over the per-chat limit
  const addFiles = (accepted: File[], rejected: string[]): string | null => {
    const room = Math.max(MAX_ATTACHMENTS - attachedCount, 0)
    const uploads = accepted.slice(0, room).map((file) => ({ key: `f${ nextFileKey++ }`, file }))
    const rejectedChips = rejected.map((error) => ({ key: `f${ nextFileKey++ }`, filename: error, status: "error" as const, error }))
    const uploadChips = uploads.map(({ key, file }) => ({ key, filename: file.name, status: "uploading" as const }))
    setFiles((prev) => [...prev, ...rejectedChips, ...uploadChips])

    uploads.forEach(({ key, file }) => {
      AppActions.uploadAssistantAttachment(file)
        .then((attachment) => update(key, { status: "done", id: attachment.id, filename: attachment.filename, pages: attachment.pages }))
        .catch((err: Error) => update(key, { status: "error", error: `${ file.name }: ${ err.message }` }))
    })

    return accepted.length > room ?
      `You can attach up to ${ MAX_ATTACHMENTS } files to a chat. Remove one to add another.` :
      null
  }

  // Deletes on the server first, then drops the chip either way (a failed delete expires in 24 hours)
  const remove = (key: string) => {
    const file = files.find((f) => f.key === key)
    if(!file?.id) {
      setFiles((prev) => prev.filter((f) => f.key !== key))
      return
    }

    update(key, { status: "uploading" })
    AppActions.deleteAssistantAttachment(file.id)
      .catch(() => {})
      .finally(() => setFiles((prev) => prev.filter((f) => f.key !== key)))
  }

  const dropIds = (ids: string[]) => setFiles((prev) => prev.filter((f) => !f.id || !ids.includes(f.id)))

  const clear = () => {
    files.forEach((f) => {
      if(f.id) AppActions.deleteAssistantAttachment(f.id).catch(() => {})
    })
    setFiles([])
  }

  const ids = files.filter((f) => f.status === "done" && f.id).map((f) => f.id!)
  const uploading = files.some((f) => f.status === "uploading")

  return { files, ids, uploading, canAttach, addFiles, remove, dropIds, clear }
}

export type AssistantAttachments = ReturnType<typeof useAssistantAttachments>

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

// The conversation, kept per tab in sessionStorage. Lives in AssistantProvider (above the whole
// layout), so closing the drawer doesn't cut off a reply or lose the draft. Each turn sends the conversation so far
// (stateless server) and streams the reply into `streaming` until it's done.
export const useAssistantChat = () => {
  const context = useAssistantContext()
  const [messages, setMessages] = useState<AssistantMessage[]>(loadMessages)
  const [streaming, setStreaming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const abortRef = useRef<AbortController | null>(null)
  const attachments = useAssistantAttachments()

  useEffect(() => saveMessages(messages), [messages])
  useEffect(() => () => abortRef.current?.abort(), [])

  const isPending = streaming !== null

  const addFiles = (accepted: File[], rejected: string[]) => {
    const limitMsg = attachments.addFiles(accepted, rejected)
    setError(limitMsg)
  }

  // Sends the draft, or a starter question when one is given
  const send = (text = draft) => {
    const content = text.trim()
    if(!content || isPending || attachments.uploading) return
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

    AppActions.streamAssistantChat(toSend(conversation), context, attachments.ids, (delta) => {
      reply += delta
      setStreaming(reply)
    }, controller.signal)
      .then(() => setMessages([...conversation, { role: "assistant", content: reply }]))
      .catch((err: Error) => {
        if(controller.signal.aborted) return
        if(err instanceof AppActions.AssistantAttachmentsMissingError) attachments.dropIds(err.missing)
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
    attachments.clear()
  }

  return { messages, streaming, isPending, error, draft, setDraft, send, newChat, attachments, addFiles }
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
