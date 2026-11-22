import claudeLogo from "@assets/claude.png"
import { motion } from "framer-motion"
import { ASSISTANT_NAME, ASSISTANT_TAGLINE, MAX_MESSAGE_CHARS, SUGGESTED_QUESTIONS } from "./utils"
import { AssistantMessage, LogoDisc, TypingIndicator, UserMessage } from "./messages"
import { useScrollToBottom, type AssistantChat } from "./chatHooks"
import AssistantMarkdown from "./markdown"

// Types
import type * as AppTypes from "@context/App/types"

const SLIDE_TRANSITION = { type: "spring", stiffness: 400, damping: 40 } as const

// The launcher, beside Logout in the top-right corner: the Boxwood mark in a white disc plus the
// assistant's name. Collapses to just the mark on small screens.
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

// The drawer: header, the conversation (or a welcome with starter questions), and the input.
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
          onNewChat={chat.messages.length ? chat.newChat : undefined} />
        <div ref={scrollRef} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {chat.messages.length ?
            chat.messages.map((message, i) => <ChatTurn key={i} message={message} />) :
            <WelcomeMessage onAsk={chat.send} disabled={chat.isPending} />}
          <StreamingReply text={chat.streaming} />
          <ChatError message={chat.error} />
        </div>
        <PanelFooter
          draft={chat.draft}
          setDraft={chat.setDraft}
          isPending={chat.isPending}
          onSend={() => chat.send()} />
    </motion.aside>
  )
}

const ChatTurn = ({ message }: { message: AppTypes.AssistantMessage }) => (
  message.role === "user" ?
    <UserMessage>{message.content}</UserMessage> :
    <AssistantMessage><AssistantMarkdown text={message.content} /></AssistantMessage>
)

// The reply as it streams in: typing dots until the first words arrive
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

type PanelFooterProps = {
  draft: string
  setDraft: (value: string) => void
  isPending: boolean
  onSend: () => void
}

const PanelFooter = ({ draft, setDraft, isPending, onSend }: PanelFooterProps) => (
  <footer className="flex flex-col gap-2 border-t border-base-300 p-3">
    <div className="flex items-end gap-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if(e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            onSend()
          }
        }}
        rows={2}
        maxLength={MAX_MESSAGE_CHARS}
        aria-label={`Message ${ ASSISTANT_NAME }`}
        placeholder="Ask about the Boxwood tools or insurance…"
        className="textarea textarea-sm flex-1 resize-none" />
      <button
        type="button"
        onClick={onSend}
        disabled={isPending || !draft.trim()}
        className="btn btn-primary btn-sm">
          {isPending ? <span className="loading loading-spinner loading-xs" /> : "Send"}
      </button>
    </div>
    <PoweredByClaude />
  </footer>
)

// Claude's mark and name in its brand orange (#d97757), with the usual AI disclaimer
const PoweredByClaude = () => (
  <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-base-content/50">
    <img src={claudeLogo} alt="" className="size-3.5" />
    <span><b className="font-semibold tracking-wide text-[#d97757]">CLAUDE</b> is AI and can make mistakes.</span>
  </p>
)
