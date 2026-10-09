import trashIcon from "@assets/icons/trash/trash.svg"
import { useHandleChatScrolling } from "@utils/hooks"
import { useDownloadPersonalPremiumChangeFile, useDeletePersonalPremiumChangeFile, usePreviewPersonalPremiumChangeFile, useHandleChatPanel, useHandleCsrGroupList, useHandleCsrSection, useHandleConfirmButton, useCopyForAms } from "./hooks"
import { AVAILABLE_MCP_TOOLS, formatTimestamp, extractPremiumChangeTable, formatCurrency, formatPercentChange } from "./utils"

// Types
import type * as AppTypes from "@context/App/types"
import type { WorkBook } from "xlsx"
import type { PremiumChangeRow } from "./utils"

// Components
import { usePersonalCtx } from "@components/personal/context/hooks"
import { SUMMARY_ORDER_OPTIONS, filterPastRenewals, filterCurrentMonth, isToday, collectCreatedToday, collectSearchMatches } from "@components/commercial/context/utils"
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
import ChatHeader from "@components/team/utils/ChatHeader"

type ChatPanelProps = {
  messages: AppTypes.PersonalPremiumChangeChatMessage[]
  onSend: (message: string) => void
  isPending: boolean
}

export const ChatPanel = ({ messages, onSend, isPending }: ChatPanelProps) => {
  const { messagesRef, send, draft, setDraft } = useHandleChatPanel(onSend)

  useHandleChatScrolling(messagesRef, messages, isPending)

  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body gap-3">
        <ChatHeader />

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
            placeholder="Ask Claude to build a renewal premium change…" />
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

export const CsrGroupList = ({ groups, scrollSignal }: { groups: AppTypes.PersonalPremiumChangeCsrGroup[], scrollSignal: number }) => {
  const { rowRefs, highlightedFilename, deletedMessage, notifyDeleted } = useHandleCsrGroupList(groups, scrollSignal)
  const { showPastRenewals, setShowPastRenewals, currentMonthOnly, setCurrentMonthOnly, createdTodayOnly, setCreatedTodayOnly, searchQuery, setSearchQuery, order, setOrder } = usePersonalCtx()

  if(groups.length === 0) {
    return (
      <>
        <p className="py-8 text-center text-base-content/70">No premium change workbooks generated yet.</p>
        <FooterMessage message={deletedMessage} />
      </>
    )
  }

  const createdToday = collectCreatedToday(groups)
  const searchResults = collectSearchMatches(groups, searchQuery)
  const searching = searchQuery.trim() !== ""
  const showCreatedToday = !searching && createdTodayOnly && createdToday.length > 0
  const filtersLocked = searching || showCreatedToday
  const sectionTitle = searching ? "Search Results" : showCreatedToday ? "Created Today" : undefined

  // Search and Created Today ignore the other filters so they never land on a filtered-out list
  const visibleGroups = searching ?
    (searchResults.length > 0 ? [{ csr_code: "__search_results__", csr_name: null, summaries: searchResults }] : []) :
    showCreatedToday ?
    [{ csr_code: "__created_today__", csr_name: null, summaries: createdToday }] :
    groups
      .map((group) => ({ ...group, summaries: filterCurrentMonth(filterPastRenewals(group.summaries, showPastRenewals), currentMonthOnly) }))
      .filter((group) => group.summaries.length > 0)

  const emptyMsg = searching ?
    `No customers or policies match "${ searchQuery.trim() }".` :
    currentMonthOnly ? "No renewals this month." : "No upcoming renewals — all generated workbooks are past their renewal date."

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
            onChange={setCreatedTodayOnly} />
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
  group: AppTypes.PersonalPremiumChangeCsrGroup
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
        <Pagination
          page={currentPage}
          totalItems={totalItems}
          onPageChange={setPage}
          scrollTargetRef={sectionRef} />
      </div>
    </div>
  )
}

type SummaryRowProps = {
  summary: AppTypes.PersonalPremiumChangeManifestEntry
  rowRefs: Map<string, HTMLLIElement>
  highlighted: boolean
  onDeleted: (clientName: string) => void
}

const SummaryRow = ({ summary, rowRefs, highlighted, onDeleted }: SummaryRowProps) => {
  const { mutate: downloadFile, isPending: isDownloading } = useDownloadPersonalPremiumChangeFile()
  const { mutate: deleteFile, isPending: isDeleting, error: deleteError } = useDeletePersonalPremiumChangeFile(() => onDeleted(summary.client_name))
  const preview = usePreviewPersonalPremiumChangeFile(summary.filename)

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
            onConfirm={() => deleteFile(summary.filename)} />
          <CopyForAmsButton note={summary.note} />
          <button type="button" onClick={preview.show} className="btn btn-ghost btn-sm hover:bg-secondary">
            Preview
          </button>
          <DownloadButton
            isPending={isDownloading}
            onClick={() => downloadFile(summary.filename)} />
        </div>
        <div className="text-center text-xs text-base-content/50 italic sm:text-right">
          <CreatedAt generatedAt={summary.generated_at} />
        </div>
      </div>
      <XlsxPreviewModal
        title={summary.client_name}
        open={preview.open}
        onClose={preview.hide}
        fetchBlob={preview.fetchBlob}
        reloadKey={preview.reloadKey}>
        {(workbook) => <PremiumChangeTableView workbook={workbook} term={summary.term} />}
      </XlsxPreviewModal>
    </li>
  )
}

const CreatedAt = ({ generatedAt }: { generatedAt: string }) => {
  if(isToday(generatedAt)) return (
    <span title={formatTimestamp(generatedAt)} className="badge badge-success dark:badge-outline badge-sm cursor-default rounded-sm not-italic">
      Created Today
    </span>
  )

  return (
    <div>Created {formatTimestamp(generatedAt)}</div>
  )
}

const PremiumChangeTableView = ({ workbook, term }: { workbook: WorkBook, term: AppTypes.PersonalPremiumChangeManifestEntry["term"] }) => {
  const { headers, rows, totals } = extractPremiumChangeTable(workbook, term)

  if(rows.length === 0) return (
    <p className="py-8 text-center text-base-content/70">Couldn't find any premiums in this workbook.</p>
  )

  return (
    <table className="table-zebra table table-sm">
      <thead>
        <tr className="text-secondary">
          {headers.map((header, i) => <th key={i}>{header}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => <PremiumChangeTableRow key={row.lob} row={row} />)}
      </tbody>
      {totals && (
        <tfoot>
          <PremiumChangeTableRow row={{ ...totals, lob: totals.lob || "Totals" }} />
        </tfoot>
      )}
    </table>
  )
}

const PremiumChangeTableRow = ({ row }: { row: PremiumChangeRow }) => (
  <tr>
    <td>{row.lob}</td>
    <td>{formatCurrency(row.current)}</td>
    <td>{formatCurrency(row.renewal)}</td>
    <td>{row.termIncrease !== null ? formatCurrency(row.termIncrease) : "—"}</td>
    <td>{row.monthlyIncrease !== null ? formatCurrency(row.monthlyIncrease) : "—"}</td>
    <td>{row.percentChange !== null ? formatPercentChange(row.percentChange) : "—"}</td>
  </tr>
)

const CopyForAmsButton = ({ note }: { note: string }) => {
  const { copied, copy } = useCopyForAms(note)

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy the renewal premium change, column-aligned, for pasting into AMS360"
      className="btn btn-ghost btn-sm hover:bg-secondary">
        {copied ? "Copied!" : "Copy For AMS"}
    </button>
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
    <img src={trashIcon} alt="Delete" className={`size-4 ${ armed ? "" : "invert dark:invert-0" }`} />

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
  const btnContent = isPending ? "Downloading…" : "Download"

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
      Ask Claude to build a renewal premium change workbook for a personal lines client — e.g.
      "Build the renewal change for Jane Smith." — or search for clients with upcoming renewals.
    </p>
  )
}

const ChatMsgs = ({ messages }: { messages: AppTypes.PersonalPremiumChangeChatMessage[] }) => (
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
