import claudeLogo from "@assets/claude.png"
import { motion } from "framer-motion"
import { ASSISTANT_NAME, ASSISTANT_TAGLINE, MAX_ATTACHMENTS, MAX_MESSAGE_CHARS, SUGGESTED_QUESTIONS } from "./utils"
import { AssistantMessage, LogoDisc, TypingIndicator, UserMessage } from "./messages"
import { useScrollToBottom, type AssistantChat, type AssistantFile } from "./chatHooks"
import AssistantMarkdown from "./markdown"
import { UPLOAD_FILES } from "@components/team/utils/PdfDropZone/utils"

// Types
import type * as AppTypes from "@context/App/types"

// Components
import PdfDropZone from "@components/team/utils/PdfDropZone"
import UploadControls from "@components/team/utils/UploadControls"

const SLIDE_TRANSITION = { type: "spring", stiffness: 400, damping: 40 } as const

export const LauncherButton = ({ onClick }: { onClick: () => void }) => (
  <motion.button
    type="button"
    onClick={onClick}
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    whileHover={{ y: -1 }}
    aria-label={`Open ${ ASSISTANT_NAME }`}
    className="flex cursor-pointer items-center gap-2 rounded-md border border-primary/50 bg-base-100 p-1 shadow-md shadow-primary/20 transition-colors hover:border-primary sm:pr-4">
      <LogoDisc size="size-8" />
      <span className="hidden translate-y-px font-display text-xl leading-none tracking-wide text-primary uppercase sm:inline">
        {ASSISTANT_NAME}
      </span>
  </motion.button>
)

export const Panel = ({ chat, onClose }: { chat: AssistantChat, onClose: () => void }) => {
  const scrollRef = useScrollToBottom([chat.messages, chat.streaming, chat.error])

  return (
    <motion.aside
      role="dialog"
      aria-label={ASSISTANT_NAME}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={SLIDE_TRANSITION}
      className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-base-300 bg-base-100 shadow-2xl sm:w-[26rem]">
        <PanelHeader
          onClose={onClose}
          onNewChat={chat.messages.length || chat.attachments.files.length ? chat.newChat : undefined} />
        {/* Files can be dropped anywhere on the panel */}
        <PdfDropZone
          variant="area"
          onFiles={chat.addFiles}
          accept={UPLOAD_FILES}
          className="flex min-h-0 flex-1 flex-col">
            <div ref={scrollRef} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              {chat.messages.length ?
                chat.messages.map((message, i) => <ChatTurn key={i} message={message} />) :
                <WelcomeMessage onAsk={chat.send} disabled={chat.isPending} />}
              <StreamingReply text={chat.streaming} />
              <ChatError message={chat.error} />
            </div>
            <PanelFooter chat={chat} />
        </PdfDropZone>
    </motion.aside>
  )
}

const ChatTurn = ({ message }: { message: AppTypes.AssistantMessage }) => (
  message.role === "user" ?
    <UserMessage>{message.content}</UserMessage> :
    <AssistantMessage><AssistantMarkdown text={message.content} /></AssistantMessage>
)

const StreamingReply = ({ text }: { text: string | null }) => {
  if(text === null) return null
  if(!text) return <TypingIndicator />

  return (
    <AssistantMessage><AssistantMarkdown text={text} /></AssistantMessage>
  )
}

const ChatError = ({ message }: { message: string | null }) => {
  if(!message) return null

  return (
    <p role="alert" className="rounded-box border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{message}</p>
  )
}

type PanelHeaderProps = {
  onClose: () => void
  onNewChat?: () => void
}

const PanelHeader = ({ onClose, onNewChat }: PanelHeaderProps) => (
  <header className="flex items-center gap-3 border-b-2 border-primary px-4 py-3">
    <div className="flex flex-1 flex-col items-end text-end">
      <h2 className="text-2xl leading-tight font-bold text-shadow-md">{ASSISTANT_NAME}</h2>
      <span className="text-sm leading-tight font-semibold text-secondary">
        {ASSISTANT_TAGLINE.map((line) => <span key={line} className="block">{line}</span>)}
      </span>
    </div>
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClose}
        aria-label={`Close ${ ASSISTANT_NAME }`}
        className="btn btn-ghost btn-sm btn-circle text-xl">
          ×
      </button>
      {onNewChat && (
        <button
          type="button"
          onClick={onNewChat}
          title="Start a new conversation"
          className="btn btn-ghost btn-xs">
            New chat
        </button>
      )}
    </div>
  </header>
)

const WelcomeMessage = ({ onAsk, disabled }: { onAsk: (question: string) => void, disabled: boolean }) => (
  <AssistantMessage>
    <p>Hi! Ask about the Boxwood tools (which one to use for a job, or how a page works), or about insurance and Boxwood standards.</p>
    <div className="flex flex-col gap-2">
      {SUGGESTED_QUESTIONS.map((question) => (
        <button
          key={question}
          type="button"
          disabled={disabled}
          onClick={() => onAsk(question)}
          className="btn btn-sm h-auto justify-center border-primary/40 bg-base-100 py-2 text-center font-normal normal-case hover:border-primary hover:bg-primary/10">
            {question}
        </button>
      ))}
    </div>
  </AssistantMessage>
)

const PanelFooter = ({ chat }: { chat: AssistantChat }) => {
  const { draft, setDraft, isPending, attachments } = chat
  const hasFiles = attachments.ids.length > 0
  const placeholder = hasFiles ? "Ask about the attached files…" : "Ask about the Boxwood tools or insurance, or drop in files to ask about…"

  return (
    <footer className="flex flex-col gap-2 border-t border-base-300 p-3">
      <FileChips
        files={attachments.files}
        onRemove={attachments.remove} />
      <div className="flex items-end gap-2">
        {/* Browse and the Accepts hint sit inside the box, like the other tools' upload inputs */}
        <div className="relative flex flex-1 [&>textarea]:pb-11">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if(e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                chat.send()
              }
            }}
            rows={3}
            maxLength={MAX_MESSAGE_CHARS}
            aria-label={`Message ${ ASSISTANT_NAME }`}
            placeholder={placeholder}
            className="textarea textarea-sm w-full flex-1 resize-none" />
          <UploadControls
            onFiles={chat.addFiles}
            accept={UPLOAD_FILES}
            disabled={!attachments.canAttach}
            title={attachments.canAttach ? `Attach files to ask about (up to ${ MAX_ATTACHMENTS }), or drop them on the panel` : `Up to ${ MAX_ATTACHMENTS } files per chat`}
            className="absolute right-1.5 bottom-1.5" />
        </div>
        <button
          type="button"
          onClick={() => chat.send()}
          disabled={isPending || attachments.uploading || !draft.trim()}
          title={attachments.uploading ? "Waiting for the files to finish attaching" : undefined}
          className="btn btn-primary btn-sm">
            {isPending ? <span className="loading loading-spinner loading-xs" /> : "Send"}
        </button>
      </div>
      <PoweredByClaude />
    </footer>
  )
}

const FileChips = ({ files, onRemove }: { files: AssistantFile[], onRemove: (key: string) => void }) => {
  if(files.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-1.5">
      {files.map((file) => (
        <FileChip
          key={file.key}
          file={file}
          onRemove={onRemove} />
      ))}
    </ul>
  )
}

const FileChip = ({ file, onRemove }: { file: AssistantFile, onRemove: (key: string) => void }) => {
  const isError = file.status === "error"
  const chipStyle = isError ?
    "badge-soft badge-error h-auto py-0.5 whitespace-normal" :
    "badge-ghost text-base-content/90"

  return (
    <li title={file.error ?? file.filename} className={`badge gap-1 rounded-sm ${ chipStyle }`}>
      <FileChipStatus status={file.status} />
      <span className={isError ? "" : "max-w-40 truncate"}>{isError ? file.error : file.filename}</span>
      <FilePages pages={file.status === "done" ? file.pages : undefined} />
      <button
        type="button"
        disabled={file.status === "uploading"}
        aria-label={`Remove ${ file.filename }`}
        onClick={() => onRemove(file.key)}
        className="cursor-pointer opacity-60 hover:opacity-100 disabled:hidden">
          ✕
      </button>
    </li>
  )
}

const FileChipStatus = ({ status }: { status: AssistantFile["status"] }) => {
  if(status === "error") return <span>!</span>
  if(status === "uploading") return <span className="loading loading-spinner loading-xs text-base-content/90" />

  return null
}

const FilePages = ({ pages }: { pages?: number }) => {
  if(pages == null) return null

  return (
    <span className="text-base-content/50">· {pages} {pages === 1 ? "page" : "pages"}</span>
  )
}

// Claude's mark and name in its brand orange (#d97757), with the usual AI disclaimer
const PoweredByClaude = () => (
  <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-base-content/50">
    <img src={claudeLogo} alt="" className="size-3.5" />
    <span><b className="font-semibold tracking-wide text-[#d97757]">CLAUDE</b> is AI and can make mistakes.</span>
  </p>
)
