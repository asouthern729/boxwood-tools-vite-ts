import claudeIcon from "@assets/claude.png"
import refreshIcon from "@assets/icons/refersh/refresh.svg"
import trashIcon from "@assets/icons/trash/trash.svg"
import { useHandleChatScrolling } from "@utils/hooks"
import { useDownloadRenewalPremiumSummaryFile, useRefreshRenewalPremiumSummaryFile, useDeleteRenewalPremiumSummaryFile, usePreviewRenewalPremiumSummaryFile, useHandleChatPanel, useHandleCsrGroupList, useHandleCsrSection, useHandleConfirmButton } from "./hooks"
import { AVAILABLE_MCP_TOOLS, formatTimestamp, extractKeyPremiumRows, formatCurrency, formatPercentChange } from "./utils"

// Types
import type * as AppTypes from "@context/App/types"
import type { WorkBook } from "xlsx"

// Components
import { useCommercialCtx } from "@components/commercial/context/hooks"
import { SUMMARY_ORDER_OPTIONS, filterPastRenewals } from "@components/commercial/context/utils"
import ClaudeDisclaimer from "@components/team/utils/ClaudeDisclaimer"
import LinkifiedText from "@components/team/utils/LinkifiedText"
import Ordering from "@components/team/utils/Ordering"
import Pagination from "@components/team/utils/Pagination"
import XlsxPreviewModal from "@components/team/utils/XlsxPreviewModal"
import FadeOut from "@utils/animations/FadeOut"

type ChatPanelProps = {
  messages: AppTypes.RenewalPremiumSummaryChatMessage[]
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

export const CsrGroupList = ({ groups, scrollSignal }: { groups: AppTypes.RenewalPremiumSummaryCsrGroup[], scrollSignal: number }) => {
  const { rowRefs, highlightedFilename, deletedMessage, notifyDeleted } = useHandleCsrGroupList(groups, scrollSignal)
  const { showPastRenewals, setShowPastRenewals, order, setOrder } = useCommercialCtx()

  if(groups.length === 0) {
    return (
      <>
        <p className="py-8 text-center text-base-content/70">No renewal premium summaries generated yet.</p>
        <DeletedMessage message={deletedMessage} />
      </>
    )
  }

  const visibleGroups = groups
    .map((group) => ({ ...group, summaries: filterPastRenewals(group.summaries, showPastRenewals) }))
    .filter((group) => group.summaries.length > 0)

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Ordering value={order} onChange={setOrder} options={SUMMARY_ORDER_OPTIONS} />
          <label className="label cursor-pointer gap-2 text-sm">
            <input
              type="checkbox"
              checked={showPastRenewals}
              onChange={(e) => setShowPastRenewals(e.target.checked)}
              className="checkbox checkbox-sm" />
            Show past renewals
          </label>
        </div>
        {visibleGroups.length === 0 ? (
          <p className="py-8 text-center text-base-content/70">No upcoming renewals — all generated summaries are past their renewal date.</p>
        ) : (
          visibleGroups.map((group) => (
            <CsrSection
              key={group.csr_code ?? "__unassigned__"}
              group={group}
              order={order}
              rowRefs={rowRefs.current}
              highlightedFilename={highlightedFilename}
              onDeleted={notifyDeleted} />
          ))
        )}
      </div>
      <DeletedMessage message={deletedMessage} />
    </>
  )
}

const DeletedMessage = ({ message }: { message: string | null }) => {
  if(!message) return null

  return (
    <FadeOut duration={4} className="fixed bottom-4 left-4 z-50 text-sm text-primary italic">
      <span>{message}</span>
    </FadeOut>
  )
}

type CsrSectionProps = {
  group: AppTypes.RenewalPremiumSummaryCsrGroup
  order: string
  rowRefs: Map<string, HTMLLIElement>
  highlightedFilename: string | null
  onDeleted: (clientName: string) => void
}

const CsrSection = ({ group, order, rowRefs, highlightedFilename, onDeleted }: CsrSectionProps) => {
  const { pageSummaries, currentPage, totalItems, setPage, sectionRef } = useHandleCsrSection(group.summaries, order)

  return (
    <div ref={sectionRef} className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body gap-1 p-0 py-2">
        <h3 className="px-4 pt-1 text-sm font-semibold text-primary">
          {group.csr_name ?? "Unassigned"}
        </h3>
        <ul className="divide-y divide-base-300">
          {pageSummaries.map((summary) => (
            <SummaryRow
              key={summary.filename}
              summary={summary}
              rowRefs={rowRefs}
              highlighted={summary.filename === highlightedFilename}
              onDeleted={onDeleted} />
          ))}
        </ul>
        <Pagination page={currentPage} totalItems={totalItems} onPageChange={setPage} scrollTargetRef={sectionRef} />
      </div>
    </div>
  )
}

type SummaryRowProps = {
  summary: AppTypes.RenewalPremiumSummaryManifestEntry
  rowRefs: Map<string, HTMLLIElement>
  highlighted: boolean
  onDeleted: (clientName: string) => void
}

const SummaryRow = ({ summary, rowRefs, highlighted, onDeleted }: SummaryRowProps) => {
  const { mutate: downloadFile, isPending: isDownloading } = useDownloadRenewalPremiumSummaryFile()
  const { mutate: refreshFile, isPending: isRefreshing, data: refreshResult, error: refreshError } = useRefreshRenewalPremiumSummaryFile()
  const { mutate: deleteFile, isPending: isDeleting, error: deleteError } = useDeleteRenewalPremiumSummaryFile()
  const preview = usePreviewRenewalPremiumSummaryFile(summary.filename)

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
        <RefreshFeedback result={refreshResult} error={refreshError} />
        {deleteError && <span className="text-sm text-error">{deleteError.message}</span>}
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <DeleteButton
            isPending={isDeleting}
            disabled={isRefreshing}
            onConfirm={() => deleteFile(summary.filename, { onSuccess: () => onDeleted(summary.client_name) })} />
          <RefreshButton
            isPending={isRefreshing}
            disabled={isDeleting}
            onClick={() => refreshFile(summary.filename)} />
          <button type="button" onClick={preview.show} className="btn btn-ghost btn-sm hover:bg-secondary">
            Preview
          </button>
          <DownloadButton
            isPending={isDownloading}
            onClick={() => downloadFile(summary.filename)} />
        </div>
        <div className="text-right text-xs text-base-content/50 italic">
          <CreatedAt summary={summary} />
        </div>
      </div>
      <XlsxPreviewModal
        title={summary.client_name}
        open={preview.open}
        onClose={preview.hide}
        fetchBlob={preview.fetchBlob}
        reloadKey={preview.reloadKey}
        footerActions={
          <div className="flex items-center gap-2">
            <RefreshFeedback result={refreshResult} error={refreshError} />
            <RefreshButton
              isPending={isRefreshing}
              disabled={isDeleting}
              onClick={() => refreshFile(summary.filename, { onSuccess: () => preview.reload() })} />
          </div>
        }>
        {(workbook) => <PremiumSummaryTable workbook={workbook} />}
      </XlsxPreviewModal>
    </li>
  )
}

const PremiumSummaryTable = ({ workbook }: { workbook: WorkBook }) => {
  const rows = extractKeyPremiumRows(workbook)

  if(rows.length === 0) return (
    <p className="py-8 text-center text-base-content/70">Couldn't find a premium table in this workbook.</p>
  )

  return (
    <table className="table-zebra table table-sm">
      <thead>
        <tr className="text-secondary">
          <th>Coverage</th>
          <th>Policy #</th>
          <th>Carrier</th>
          <th>Current</th>
          <th>Renewal</th>
          <th>% Change</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.coverage}>
            <td>{row.coverage}</td>
            <td>{row.policyNumbers}</td>
            <td>{row.carrier}</td>
            <td>{row.current !== null ? formatCurrency(row.current) : "—"}</td>
            <td>{row.renewal !== null ? formatCurrency(row.renewal) : "—"}</td>
            <td>{row.percentChange !== null ? formatPercentChange(row.percentChange) : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const CreatedAt = ({ summary }: { summary: AppTypes.RenewalPremiumSummaryManifestEntry }) => {
  if(summary.last_refreshed_at) return (
    <div title="Last refreshed since this report was generated">
      Updated {formatTimestamp(summary.last_refreshed_at)}
    </div>
  )

  return (
    <div>Created {formatTimestamp(summary.generated_at)}</div>
  )
}

type RefreshFeedbackProps = {
  result: AppTypes.RenewalPremiumSummaryRefreshResult | undefined
  error: Error | null
}

const RefreshFeedback = ({ result, error }: RefreshFeedbackProps) => {
  if(error) return <span className="text-sm text-error">{error.message}</span>
  if(!result) return null

  const feedbackText = result.changes.length === 0 ?
    "Refreshed — already up to date" :
    `Refreshed — ${ result.changes.length } value${ result.changes.length === 1 ? "" : "s" } updated`

  return (
    <span className="text-sm text-success">
      {feedbackText}
    </span>
  )
}

type DeleteButtonProps = {
  isPending: boolean
  disabled: boolean
  onConfirm: () => void
}

const DeleteButton = ({ isPending, disabled, onConfirm }: DeleteButtonProps) => {
  const { armed, handleClick } = useHandleConfirmButton(onConfirm)

  const btnContent = isPending ? 
    <span className="loading loading-spinner loading-xs" /> : 
    <img src={trashIcon} alt="Delete" className="size-4" />

  return (
    <button
      type="button"
      disabled={isPending || disabled}
      onClick={handleClick}
      title={armed ? "Click again to permanently delete" : "Delete this report"}
      className={`btn btn-sm btn-square ${ armed ? "btn-error" : "btn-ghost hover:bg-error/20" }`}>
        {btnContent}
    </button>
  )
}

type RefreshButtonProps = {
  isPending: boolean
  disabled: boolean
  onClick: () => void
}

const RefreshButton = ({ isPending, disabled, onClick }: RefreshButtonProps) => {
  const btnContent = isPending ? 
    <span className="loading loading-spinner loading-xs" /> : 
    <img src={refreshIcon} alt="Refresh" className="size-4" />

  return (
    <button
      type="button"
      disabled={isPending || disabled}
      onClick={onClick}
      title="Refresh Current/Renewal premiums from AMS360"
      className="btn btn-ghost btn-sm btn-square hover:bg-secondary">
        {btnContent}
    </button>
  )
}

type DownloadButtonProps = {
  isPending: boolean
  onClick: () => void
}

const DownloadButton = ({ isPending, onClick }: DownloadButtonProps) => {
  const btnContent = isPending ? 
    "Downloading…" : 
    "Download"
  
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={onClick}
      className="btn btn-neutral btn-sm hover:bg-secondary">
        {btnContent}
    </button>
  )
}

const AvailableTools = () => (
  <div className="flex flex-wrap items-center gap-1.5">
    <span className="font-mono text-[10px] font-bold tracking-widest text-base-content/50 uppercase">
      MCP Tools Available
    </span>
    {AVAILABLE_MCP_TOOLS.map((tool) => (
      <span 
        key={tool.name} 
        title={tool.description} 
        className="badge badge-outline badge-accent badge-sm cursor-default">
          {tool.name}
      </span>
    ))}
  </div>
)

const ChatTip = ({ visible }: { visible: boolean }) => {
  if(!visible) return null

  return (
    <p className="text-sm text-base-content/60">
      Ask Claude to run the renewal premium tool for a customer — e.g. "Build the renewal
      premium summary for Acme Corp." — or search for customers with upcoming renewals.
    </p>
  )
}

const ChatMsgs = ({ messages }: { messages: AppTypes.RenewalPremiumSummaryChatMessage[] }) => (
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
          <LinkifiedText text={message.text} />
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
    placeholder="Ask Claude to build a renewal premium overview…"
    className="textarea textarea-bordered flex-1" />
)

type SendButtonProps = {
  draft: string
  isPending: boolean
  onClick: () => void
}

const SendButton = ({ draft, isPending, onClick }: SendButtonProps) => {
  const btnContent = isPending ? 
    "Sending…" : 
    "Send"

  return (
    <button
      type="button"
      disabled={isPending || !draft.trim()}
      onClick={onClick}
      className="btn btn-neutral self-end text-accent hover:bg-accent hover:text-accent-content">
        {btnContent}
    </button>
  )
}