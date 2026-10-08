import claudeIcon from "@assets/claude.png"
import trashIcon from "@assets/icons/trash/trash.svg"
import { useHandleChatScrolling } from "@utils/hooks"
import { useDownloadRenewalPremiumSummaryFile, useDeleteRenewalPremiumSummaryFile, usePreviewRenewalPremiumSummaryFile, useHandleChatPanel, useHandleCsrGroupList, useHandleCsrSection, useHandleConfirmButton } from "./hooks"
import { AVAILABLE_MCP_TOOLS, formatTimestamp, extractKeyPremiumRows, formatCurrency, formatPercentChange, type PremiumSummaryRow } from "./utils"

// Types
import type * as AppTypes from "@context/App/types"
import type { WorkBook } from "xlsx"

// Components
import { useCommercialCtx } from "@components/commercial/context/hooks"
import { SUMMARY_ORDER_OPTIONS, filterPastRenewals, filterCurrentMonth, isToday, collectCreatedToday, collectUpdatedToday, isUpdatedToday, updatedTooltip, collectSearchMatches } from "@components/commercial/context/utils"
import ClaudeDisclaimer from "@components/team/utils/ClaudeDisclaimer"
import ChatMessageText from "@components/team/utils/ChatMessageText"
import Ordering from "@components/team/utils/Ordering"
import TodayFilter from "@components/team/utils/TodayFilter"
import CustomerSearch from "@components/team/utils/CustomerSearch"
import Pagination from "@components/team/utils/Pagination"
import FooterMessage from "@components/team/utils/FooterMessage"
import XlsxPreviewModal from "@components/team/utils/XlsxPreviewModal"
import SendButton from "@components/team/utils/SendButton"
import ChatInput from "@components/team/utils/ChatInput"
import AvailableTools from "@components/team/utils/AvailableTools"

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

        <AvailableTools tools={AVAILABLE_MCP_TOOLS} />

        <div
          ref={messagesRef}
          className="flex max-h-72 flex-col gap-1 overflow-y-auto"
          style={{ scrollbarWidth: "thin" }}>
            <ChatTip visible={messages.length === 0} />
            <ChatMsgs messages={messages} />
            <ClaudeLoading visible={isPending} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <ChatInput
            draft={draft}
            setDraft={setDraft}
            isPending={isPending}
            send={send}
            placeholder="Ask Claude to build a renewal premium overview…" />
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
  const { showPastRenewals, setShowPastRenewals, currentMonthOnly, setCurrentMonthOnly, createdTodayOnly, setCreatedTodayOnly, updatedTodayOnly, setUpdatedTodayOnly, searchQuery, setSearchQuery, order, setOrder } = useCommercialCtx()

  if(groups.length === 0) {
    return (
      <>
        <p className="py-8 text-center text-base-content/70">No renewal premium summaries generated yet.</p>
        <FooterMessage message={deletedMessage} />
      </>
    )
  }

  const createdToday = collectCreatedToday(groups)
  const updatedToday = collectUpdatedToday(groups)
  const searchResults = collectSearchMatches(groups, searchQuery)
  const searching = searchQuery.trim() !== ""
  const showCreatedToday = !searching && createdTodayOnly && createdToday.length > 0
  const showUpdatedToday = !searching && !showCreatedToday && updatedTodayOnly && updatedToday.length > 0
  const filtersLocked = searching || showCreatedToday || showUpdatedToday
  const sectionTitle = searching ? "Search Results" : showCreatedToday ? "Created Today" : showUpdatedToday ? "Updated Today" : undefined

  const toggleCreatedToday = (active: boolean) => {
    setCreatedTodayOnly(active)
    if(active) setUpdatedTodayOnly(false)
  }

  const toggleUpdatedToday = (active: boolean) => {
    setUpdatedTodayOnly(active)
    if(active) setCreatedTodayOnly(false)
  }

  // Search and the Today lists ignore the other filters so they never land on a filtered-out list
  const visibleGroups = searching ?
    (searchResults.length > 0 ? [{ csr_code: "__search_results__", csr_name: null, summaries: searchResults }] : []) :
    showCreatedToday ?
    [{ csr_code: "__created_today__", csr_name: null, summaries: createdToday }] :
    showUpdatedToday ?
    [{ csr_code: "__updated_today__", csr_name: null, summaries: updatedToday }] :
    groups
      .map((group) => ({ ...group, summaries: filterCurrentMonth(filterPastRenewals(group.summaries, showPastRenewals), currentMonthOnly) }))
      .filter((group) => group.summaries.length > 0)

  const emptyMsg = searching ?
    `No customers or policies match "${ searchQuery.trim() }".` :
    currentMonthOnly ? "No renewals this month." : "No upcoming renewals — all generated summaries are past their renewal date."

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Ordering value={order} onChange={setOrder} options={SUMMARY_ORDER_OPTIONS} />
          <TodayFilter
            label="Created Today"
            count={createdToday.length}
            active={showCreatedToday}
            disabled={searching}
            onChange={toggleCreatedToday} />
          <TodayFilter
            label="Updated Today"
            count={updatedToday.length}
            active={showUpdatedToday}
            disabled={searching}
            btnStyle="btn-info"
            onChange={toggleUpdatedToday} />
          <div className="ml-auto flex flex-wrap items-center gap-4">
            <label className="label cursor-pointer gap-2 text-sm">
              <input
                type="checkbox"
                checked={showPastRenewals}
                onChange={(e) => setShowPastRenewals(e.target.checked)}
                disabled={filtersLocked}
                className="checkbox checkbox-sm" />
              Show past renewals
            </label>
            <label className="label cursor-pointer gap-2 text-sm">
              <input
                type="checkbox"
                checked={currentMonthOnly}
                onChange={(e) => setCurrentMonthOnly(e.target.checked)}
                disabled={filtersLocked}
                className="checkbox checkbox-sm" />
              Current month only
            </label>
          </div>
        </div>
        <div className="flex justify-center">
          <CustomerSearch value={searchQuery} onChange={setSearchQuery} />
        </div>
        {visibleGroups.length === 0 ? (
          <p className="py-8 text-center text-base-content/70">{emptyMsg}</p>
        ) : (
          visibleGroups.map((group) => (
            <CsrSection
              key={group.csr_code ?? "__unassigned__"}
              group={group}
              title={sectionTitle}
              order={order}
              rowRefs={rowRefs.current}
              highlightedFilename={highlightedFilename}
              onDeleted={notifyDeleted} />
          ))
        )}
      </div>
      <FooterMessage message={deletedMessage} />
    </>
  )
}

type CsrSectionProps = {
  group: AppTypes.RenewalPremiumSummaryCsrGroup
  title?: string
  order: string
  rowRefs: Map<string, HTMLLIElement>
  highlightedFilename: string | null
  onDeleted: (clientName: string) => void
}

const CsrSection = ({ group, title, order, rowRefs, highlightedFilename, onDeleted }: CsrSectionProps) => {
  const { pageSummaries, currentPage, totalItems, setPage, sectionRef } = useHandleCsrSection(group.summaries, order)

  return (
    <div ref={sectionRef} className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body gap-1 p-0 py-2">
        <h3 className="px-4 pt-1 text-sm font-semibold text-primary">
          {title ?? group.csr_name ?? "Unassigned"}
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
  const { mutate: deleteFile, isPending: isDeleting, error: deleteError } = useDeleteRenewalPremiumSummaryFile()
  const preview = usePreviewRenewalPremiumSummaryFile(summary.filename)

  return (
    <li
      ref={(el) => {
        if(el) rowRefs.set(summary.filename, el)
        else rowRefs.delete(summary.filename)
      }}
      className={`flex flex-col gap-3 px-4 py-3 transition-colors duration-1000 sm:flex-row sm:items-center ${ highlighted ? "bg-base-200" : "" }`}>
      <div className="flex w-full min-w-0 flex-col sm:w-auto sm:flex-1">
        <span className="font-semibold">{summary.client_name}</span>
        <span className="text-sm text-base-content/60 italic">Renews {summary.renewal_date_label}</span>
        <span className="text-sm text-base-content/60">{summary.polnos}</span>
        {deleteError && <span className="text-sm text-error">{deleteError.message}</span>}
      </div>
      <div className="flex flex-col items-center gap-2 sm:items-end">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap">
          <DeleteButton
            isPending={isDeleting}
            onConfirm={() => deleteFile(summary.filename, { onSuccess: () => onDeleted(summary.client_name) })} />
          <button type="button" onClick={preview.show} className="btn btn-ghost btn-sm hover:bg-secondary">
            Preview
          </button>
          <DownloadButton
            isPending={isDownloading}
            onClick={() => downloadFile(summary.filename)} />
        </div>
        <div className="text-center text-xs text-base-content/50 italic sm:text-right">
          <CreatedAt summary={summary} />
        </div>
      </div>
      <XlsxPreviewModal
        title={summary.client_name}
        open={preview.open}
        onClose={preview.hide}
        fetchBlob={preview.fetchBlob}
        reloadKey={preview.reloadKey}>
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
          <PremiumSummaryTableRow 
            key={row.coverage} 
            row={row} />
        ))}
      </tbody>
    </table>
  )
}

const PremiumSummaryTableRow = ({ row }: { row: PremiumSummaryRow }) => (
  <tr key={row.coverage}>
    <td>{row.coverage}</td>
    <td>{row.policyNumbers}</td>
    <td>{row.carrier}</td>
    <td>{row.current !== null ? formatCurrency(row.current) : "—"}</td>
    <td>{row.renewal !== null ? formatCurrency(row.renewal) : "—"}</td>
    <td>{row.percentChange !== null ? formatPercentChange(row.percentChange) : "—"}</td>
  </tr>
)

const CreatedAt = ({ summary }: { summary: AppTypes.RenewalPremiumSummaryManifestEntry }) => {
  if(isUpdatedToday(summary)) return (
    <span title={updatedTooltip(summary, formatTimestamp(summary.last_refreshed_at))} className="badge badge-info dark:badge-outline badge-sm cursor-default rounded-sm not-italic">
      Updated Today
    </span>
  )

  if(isToday(summary.generated_at)) return (
    <span title={formatTimestamp(summary.generated_at)} className="badge badge-success dark:badge-outline badge-sm cursor-default rounded-sm not-italic">
      Created Today
    </span>
  )

  if(summary.last_refreshed_at) return (
    <div title={updatedTooltip(summary, formatTimestamp(summary.last_refreshed_at))}>
      Updated {formatTimestamp(summary.last_refreshed_at)}
    </div>
  )

  return (
    <div>Created {formatTimestamp(summary.generated_at)}</div>
  )
}

type DeleteButtonProps = {
  isPending: boolean
  onConfirm: () => void
}

const DeleteButton = ({ isPending, onConfirm }: DeleteButtonProps) => {
  const { armed, handleClick } = useHandleConfirmButton(onConfirm)

  const btnContent = isPending ? 
    <span className="loading loading-spinner loading-xs" /> : 
    <img src={trashIcon} alt="Delete" className="size-4" />

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      title={armed ? "Click again to permanently delete" : "Delete this report"}
      className={`btn btn-sm btn-square ${ armed ? "btn-error" : "btn-ghost hover:bg-error/20" }`}>
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
          <ChatMessageText text={message.text} />
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
