import claudeIcon from "@assets/claude.png"
import trashIcon from "@assets/icons/trash/trash.svg"
import pdfIcon from "@assets/icons/pdf/pdf.svg"
import { useHandleChatScrolling } from "@utils/hooks"
import { useDownloadRenewalSummaryFile, useDownloadRenewalSummaryPdf, useDeleteRenewalSummaryFile, usePreviewRenewalSummaryFile, useHandleChatPanel, useHandleCsrGroupList, useHandleCsrSection, useHandleConfirmButton, useRenewalSummaryQuotes, useUploadRenewalSummaryQuotes, useHandleQuoteRemoval } from "./hooks"
import { AVAILABLE_MCP_TOOLS, QUOTE_HELP_TEXT, formatTimestamp, formatQuoteLine } from "./utils"

// Types
import type * as AppTypes from "@context/App/types"

// Components
import { useCommercialCtx } from "@components/commercial/context/hooks"
import { SUMMARY_ORDER_OPTIONS, filterPastRenewals, filterCurrentMonth, isToday, collectCreatedToday, collectUpdatedToday, isUpdatedToday, collectSearchMatches } from "@components/commercial/context/utils"
import ClaudeDisclaimer from "@components/team/utils/ClaudeDisclaimer"
import DocxPreviewModal from "@components/team/utils/DocxPreviewModal"
import ChatMessageText from "@components/team/utils/ChatMessageText"
import Ordering from "@components/team/utils/Ordering"
import TodayFilter from "@components/team/utils/TodayFilter"
import CustomerSearch from "@components/team/utils/CustomerSearch"
import Pagination from "@components/team/utils/Pagination"
import FooterMessage from "@components/team/utils/FooterMessage"
import PdfDropZone from "@components/team/utils/PdfDropZone"
import SendButton from "@components/team/utils/SendButton"

type ChatPanelProps = {
  messages: AppTypes.RenewalSummaryChatMessage[]
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

        <div className="flex flex-col gap-2 sm:flex-row">
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

export const CsrGroupList = ({ groups, scrollSignal }: { groups: AppTypes.RenewalSummaryCsrGroup[], scrollSignal: number }) => {
  const { rowRefs, highlightedFilename, deletedMessage, notifyDeleted } = useHandleCsrGroupList(groups, scrollSignal)
  const { showPastRenewals, setShowPastRenewals, currentMonthOnly, setCurrentMonthOnly, createdTodayOnly, setCreatedTodayOnly, updatedTodayOnly, setUpdatedTodayOnly, searchQuery, setSearchQuery, order, setOrder } = useCommercialCtx()

  if(groups.length === 0) {
    return (
      <>
        <p className="py-8 text-center text-base-content/70">No renewal summaries generated yet.</p>
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
    `No customers match "${ searchQuery.trim() }".` :
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
  group: AppTypes.RenewalSummaryCsrGroup
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
  summary: AppTypes.RenewalSummaryManifestEntry
  rowRefs: Map<string, HTMLLIElement>
  highlighted: boolean
  onDeleted: (clientName: string) => void
}

const SummaryRow = ({ summary, rowRefs, highlighted, onDeleted }: SummaryRowProps) => {
  const { mutate: downloadFile, isPending: isDownloading } = useDownloadRenewalSummaryFile()
  const { mutate: downloadPdf, isPending: isDownloadingPdf, error: pdfError } = useDownloadRenewalSummaryPdf()
  const { mutate: deleteFile, isPending: isDeleting, error: deleteError } = useDeleteRenewalSummaryFile()
  const preview = usePreviewRenewalSummaryFile(summary.filename)
  const quotes = useRenewalSummaryQuotes(summary.filename)
  const { upload, uploading, errors: uploadErrors, clearErrors } = useUploadRenewalSummaryQuotes(summary.filename)

  return (
    <li
      ref={(el) => {
        if(el) rowRefs.set(summary.filename, el)
        else rowRefs.delete(summary.filename)
      }}
      className={`transition-colors duration-1000 ${ highlighted ? "bg-base-200" : "" }`}>
      <PdfDropZone variant="area" onFiles={upload} className="flex flex-col gap-2 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex w-full min-w-0 flex-col sm:w-auto sm:flex-1">
            <span className="font-semibold">{summary.client_name}</span>
            <span className="text-sm text-base-content/60 italic">Renews {summary.renewal_date_label}</span>
            <span className="text-sm text-base-content/60">{summary.polnos}</span>
            {deleteError && <span className="text-sm text-error">{deleteError.message}</span>}
            {pdfError && <span className="text-sm text-error">{pdfError.message}</span>}
          </div>
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap">
              <DeleteButton
                isPending={isDeleting}
                onConfirm={() => deleteFile(summary.filename, { onSuccess: () => onDeleted(summary.client_name) })} />
              <PdfDropZone
                variant="button"
                onFiles={upload}
                title={`Upload a carrier quote PDF, or drop it on this row. ${ QUOTE_HELP_TEXT }`}
                className="btn btn-ghost btn-sm hover:bg-secondary">
                  Upload Quote
              </PdfDropZone>
              <button type="button" onClick={preview.show} className="btn btn-ghost btn-sm hover:bg-secondary">
                Preview
              </button>
              <DownloadButton
                isPending={isDownloading}
                onClick={() => downloadFile(summary.filename)} />
              <PdfDownloadButton
                isPending={isDownloadingPdf}
                onClick={() => downloadPdf(summary.filename)} />
            </div>
            <div className="text-center text-xs text-base-content/50 italic sm:text-right">
              <CreatedAt summary={summary} />
            </div>
          </div>
        </div>
        <QuoteList
          filename={summary.filename}
          quotes={quotes}
          uploading={uploading}
          errors={uploadErrors}
          onDismissErrors={clearErrors} />
      </PdfDropZone>
      <DocxPreviewModal
        title={summary.client_name}
        open={preview.open}
        onClose={preview.hide}
        fetchBlob={preview.fetchBlob} />
    </li>
  )
}

const CreatedAt = ({ summary }: { summary: AppTypes.RenewalSummaryManifestEntry }) => {
  if(isUpdatedToday(summary)) return (
    <span title={formatTimestamp(summary.last_refreshed_at)} className="badge badge-info dark:badge-outline badge-sm rounded-sm not-italic">
      Updated Today
    </span>
  )

  if(isToday(summary.generated_at)) return (
    <span title={formatTimestamp(summary.generated_at)} className="badge badge-success dark:badge-outline badge-sm rounded-sm not-italic">
      Created Today
    </span>
  )

  if(summary.last_refreshed_at) return (
    <div title="Last rebuilt since this summary was generated">
      Updated {formatTimestamp(summary.last_refreshed_at)}
    </div>
  )

  return (
    <div>Created {formatTimestamp(summary.generated_at)}</div>
  )
}

type QuoteListProps = {
  filename: string
  quotes: AppTypes.RenewalSummaryQuote[]
  uploading: { key: number, name: string }[]
  errors: string[]
  onDismissErrors: () => void
}

const QuoteList = ({ filename, quotes, uploading, errors, onDismissErrors }: QuoteListProps) => {
  if(quotes.length === 0 && uploading.length === 0 && errors.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5">
      {errors.length > 0 && (
        <div className="flex items-start gap-2 text-sm text-error">
          <div className="flex flex-1 flex-col">
            {errors.map((error, i) => <span key={i}>{error}</span>)}
          </div>
          <button type="button" onClick={onDismissErrors} title="Dismiss" className="btn btn-ghost btn-xs">×</button>
        </div>
      )}
      <ul className="flex flex-col gap-1.5">
        {quotes.map((quote) => (
          <QuoteChip key={quote.id} filename={filename} quote={quote} />
        ))}
        {uploading.map((upload) => (
          <li key={upload.key} className="flex items-center gap-2 rounded-box bg-base-200 px-3 py-1.5 text-sm">
            <img src={pdfIcon} alt="" className="size-4" />
            <span className="truncate font-medium">{upload.name}</span>
            <span className="loading loading-spinner loading-xs" />
            <span className="text-base-content/60 italic">Uploading…</span>
          </li>
        ))}
      </ul>
      {quotes.some((quote) => quote.status === "done") && (
        <p className="text-xs text-base-content/50 italic">{QUOTE_HELP_TEXT}</p>
      )}
    </div>
  )
}

const QuoteChip = ({ filename, quote }: { filename: string, quote: AppTypes.RenewalSummaryQuote }) => {
  const { confirming, askConfirm, cancel, remove, isPending, error } = useHandleQuoteRemoval(filename, quote.id)

  return (
    <li className="flex flex-col gap-1 rounded-box bg-base-200 px-3 py-1.5 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <img src={pdfIcon} alt="" className="size-4" />
        <span className="truncate font-medium">{quote.filename}</span>
        <QuoteChipStatusMsg
          status={quote.status}
          error={quote.error} />
        <QuoteChipActionContent 
          confirming={confirming} 
          isPending={isPending} 
          cancel={cancel} 
          remove={remove} 
          askConfirm={askConfirm} />
      </div>
      <Quotes 
        visible={quote.status === "done" && quote.lines.length > 0}
        lines={quote.lines} />
      <NoLinesMsg visible={quote.status === "done" && quote.lines.length === 0} />
      {error && <span className="pl-6 text-error">{error.message}</span>}
    </li>
  )
}

const QuoteChipStatusMsg = ({ status, error }: { status: "processing" | "done" | "error", error?: string }) => {
  switch(status) {
    case "error":
      return <span className="text-error">{error ?? "Couldn't read this quote."}</span>
    case "done":
      return <span className="badge badge-success badge-sm">Done</span>
    default:
      return (
        <span className="flex items-center gap-1.5 text-base-content/60 italic">
          <span className="loading loading-spinner loading-xs" />Reading quote…
        </span>
      )
  }
}

type QuoteChipActionContentProps = {
  confirming: boolean
  isPending: boolean
  remove: () => void
  cancel: () => void
  askConfirm: () => void
}

const QuoteChipActionContent = ({ confirming, isPending, remove, cancel, askConfirm }: QuoteChipActionContentProps) => {
  const removeBtnContent = isPending ?
    <span className="loading loading-spinner loading-xs" /> :
    "Remove"

  const actionContent = confirming ? (
    <span className="flex items-center gap-2">
      <span className="text-base-content/70">Remove this quote? The document will be rebuilt without it.</span>
      <button type="button" disabled={isPending} onClick={remove} className="btn btn-error btn-xs">
        {removeBtnContent}
      </button>
      <button type="button" disabled={isPending} onClick={cancel} className="btn btn-ghost btn-xs">Cancel</button>
    </span>
  ) : (
    <button type="button" onClick={askConfirm} title="Remove this quote" className="btn btn-ghost btn-xs hover:bg-error/20">×</button>
  )

  return (
    <span className="ml-auto">{actionContent}</span>
  )
}

const Quotes = ({ visible, lines }: { visible: boolean, lines: AppTypes.RenewalSummaryQuoteLine[] }) => {
  if(!visible) return null

  return (
    <ul className="flex flex-col pl-6 text-base-content/70">
      {lines.map((line, i) => <li key={i}>{formatQuoteLine(line)}</li>)}
    </ul>
  )
}

const NoLinesMsg = ({ visible }: { visible: boolean }) => {
  if(!visible) return null

  return ( 
    <span className="pl-6 text-base-content/60 italic">No lines found in this quote.</span>
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
    "Word"

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={onClick}
      title="Download as Word (.docx)"
      className="btn btn-neutral btn-sm hover:bg-secondary">
        {btnContent}
    </button>
  )
}

const PdfDownloadButton = ({ isPending, onClick }: DownloadButtonProps) => {
  const btnContent = isPending ?
    "Downloading…" : 
    "PDF"

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={onClick}
      title="Download as PDF"
      className="btn btn-neutral btn-sm hover:bg-secondary">
        {btnContent}
    </button>
  )
}

const AvailableTools = () => (
  <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:flex-wrap">
    <span className="font-mono text-[10px] font-bold tracking-widest text-base-content/50 uppercase">
      MCP Tools Available
    </span>
    {AVAILABLE_MCP_TOOLS.map((tool) => (
      <AvailableTool 
        key={tool.name} 
        tool={tool} />
    ))}
  </div>
)

const AvailableTool = ({ tool }: { tool: { name: string, description: string } }) => (
  <span title={tool.description} className="badge badge-outline badge-accent badge-sm cursor-default">
    {tool.name}
  </span>
)

const ChatTip = ({ visible }: { visible: boolean }) => {
  if(!visible) return null

  return (
    <p className="text-sm text-base-content/60">
      Ask Claude to build a renewal summary for a customer — e.g. "Build the
      renewal summary for Acme Corp." — or search for customers with upcoming renewals.
    </p>
  )
}

const ChatMsgs = ({ messages }: { messages: AppTypes.RenewalSummaryChatMessage[] }) => (
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
    placeholder="Ask Claude to build a renewal summary…"
    className="textarea textarea-bordered w-full flex-1" />
)
