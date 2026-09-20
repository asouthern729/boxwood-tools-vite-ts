import claudeIcon from "@assets/claude.png"
import ClaudeDisclaimer from "@components/team/utils/ClaudeDisclaimer"
import { useHandleChatScrolling } from "@utils/hooks"
import { useDownloadPreRenewalRiskProfileFile, useHandleChatPanel, useHandleCsrGroupList } from "./hooks"
import { AVAILABLE_MCP_TOOLS } from "./utils"

// Types
import type * as AppTypes from "@context/App/types"

type ChatPanelProps = {
  messages: AppTypes.PreRenewalRiskProfileChatMessage[]
  onSend: (message: string) => void
  isPending: boolean
}

export const ChatPanel = ({ messages, onSend, isPending }: ChatPanelProps) => {
  const { messagesRef, send, draft, setDraft } = useHandleChatPanel(onSend)

  useHandleChatScrolling(messagesRef, messages, isPending)

  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body gap-3">
        <h2 className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-accent uppercase">
          <img src={claudeIcon} alt="" className="size-5" />
          Claude
        </h2>

        <AvailableTools />

        <div
          ref={messagesRef}
          className="flex max-h-72 flex-col gap-1 overflow-y-auto"
          style={{ scrollbarWidth: "thin" }}>
          <ChatTip visible={messages.length === 0} />
          <ChatMsgs messages={messages} />
          <ClaudeLoading visible={isPending} />
        </div>

        <div className="flex gap-2">
          <ChatInput
            draft={draft}
            setDraft={setDraft}
            isPending={isPending}
            send={send} />
          <SendButton
            draft={draft}
            isPending={isPending}
            onClick={send} />
        </div>

        <ClaudeDisclaimer />
      </div>
    </div>
  )
}

export const CsrGroupList = ({ groups, scrollSignal }: { groups: AppTypes.PreRenewalRiskProfileCsrGroup[], scrollSignal: number }) => {
  const { rowRefs, highlightedFilename } = useHandleCsrGroupList(groups, scrollSignal)

  if(groups.length === 0) {
    return (
      <p className="py-8 text-center text-base-content/70">No pre-renewal risk profiles generated yet.</p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <CsrSection
          key={group.csr_code ?? "__unassigned__"}
          group={group}
          rowRefs={rowRefs.current}
          highlightedFilename={highlightedFilename} />
      ))}
    </div>
  )
}

type CsrSectionProps = {
  group: AppTypes.PreRenewalRiskProfileCsrGroup
  rowRefs: Map<string, HTMLLIElement>
  highlightedFilename: string | null
}

const CsrSection = ({ group, rowRefs, highlightedFilename }: CsrSectionProps) => (
  <div className="card border border-base-300 bg-base-100 shadow-sm">
    <div className="card-body gap-1 p-0 py-2">
      <h3 className="px-4 pt-1 text-sm font-semibold text-primary">
        {group.csr_name ?? "Unassigned"}
      </h3>
      <ul className="divide-y divide-base-300">
        {[...group.summaries].sort((a, b) => a.client_name.localeCompare(b.client_name)).map((summary) => (
          <SummaryRow
            key={summary.filename}
            summary={summary}
            rowRefs={rowRefs}
            highlighted={summary.filename === highlightedFilename} />
        ))}
      </ul>
    </div>
  </div>
)

type SummaryRowProps = {
  summary: AppTypes.PreRenewalRiskProfileManifestEntry
  rowRefs: Map<string, HTMLLIElement>
  highlighted: boolean
}

const SummaryRow = ({ summary, rowRefs, highlighted }: SummaryRowProps) => {
  const { mutate: downloadFile, isPending } = useDownloadPreRenewalRiskProfileFile()

  return (
    <li
      ref={(el) => {
        if(el) rowRefs.set(summary.filename, el)
        else rowRefs.delete(summary.filename)
      }}
      className={`flex items-center gap-3 px-4 py-3 transition-colors duration-1000 ${ highlighted ? "bg-base-200" : "" }`}>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold">{summary.client_name}</span>
        <span className="text-sm text-base-content/60 italic">Renews {summary.renewal_date_label}</span>
        <span className="text-sm text-base-content/60">{summary.polnos}</span>
      </div>
      <DownloadButton
        isPending={isPending}
        onClick={() => downloadFile(summary.filename)} />
    </li>
  )
}

type DownloadButtonProps = {
  isPending: boolean
  onClick: () => void
}

const DownloadButton = ({ isPending, onClick }: DownloadButtonProps) => (
  <button
    type="button"
    disabled={isPending}
    onClick={onClick}
    className="btn btn-neutral btn-sm hover:bg-secondary">
      {isPending ? "Downloading…" : "Download"}
  </button>
)

const AvailableTools = () => (
  <div className="flex flex-wrap items-center gap-1.5">
    <span className="font-mono text-[10px] font-bold tracking-widest text-base-content/50 uppercase">
      MCP Tools Available
    </span>
    {AVAILABLE_MCP_TOOLS.map((tool) => (
      <span key={tool.name} title={tool.description} className="badge badge-outline badge-accent badge-sm cursor-default">
        {tool.name}
      </span>
    ))}
  </div>
)

const ChatTip = ({ visible }: { visible: boolean }) => {
  if(!visible) return null

  return (
    <p className="text-sm text-base-content/60">
      Ask Claude to build a pre-renewal risk profile for a customer — e.g. "Build the
      pre-renewal risk profile for Acme Corp." — or search for customers with upcoming renewals.
    </p>
  )
}

const ChatMsgs = ({ messages }: { messages: AppTypes.PreRenewalRiskProfileChatMessage[] }) => (
  <>
    {messages.map((message, i) => (
      <div key={i} className={`chat ${ message.role === "user" ? "chat-end" : "chat-start" }`}>
        {message.role === "assistant" && (
          <div className="chat-header text-xs font-semibold text-accent">Claude</div>
        )}
        <div
          className={`chat-bubble whitespace-pre-wrap text-sm ${ message.role === "user" ?
            "bg-base-300 text-base-content" :
            "bg-accent/20 text-base-content" }`}>
          {message.text}
        </div>
      </div>
    ))}
  </>
)

const ClaudeLoading = ({ visible }: { visible: boolean }) => {
  if(!visible) return null

  return (
    <div className="chat chat-start">
      <div className="chat-header text-xs font-semibold text-accent">Claude</div>
      <div className="chat-bubble bg-accent/20">
        <span className="loading loading-dots loading-sm" />
      </div>
    </div>
  )
}

type ChatInputProps = {
  draft: string
  setDraft: (value: string) => void
  isPending: boolean
  send: () => void
}

const ChatInput = ({ draft, setDraft, isPending, send }: ChatInputProps) => (
  <textarea
    value={draft}
    onChange={(e) => setDraft(e.target.value)}
    onKeyDown={(e) => {
      if(e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        send()
      }
    }}
    rows={2}
    disabled={isPending}
    placeholder="Ask Claude to build a pre-renewal risk profile…"
    className="textarea textarea-bordered flex-1" />
)

type SendButtonProps = {
  draft: string
  isPending: boolean
  onClick: () => void
}

const SendButton = ({ draft, isPending, onClick }: SendButtonProps) => (
  <button
    type="button"
    disabled={isPending || !draft.trim()}
    onClick={onClick}
    className="btn btn-neutral self-end text-accent hover:bg-accent hover:text-accent-content">
    {isPending ? "Sending…" : "Send"}
  </button>
)