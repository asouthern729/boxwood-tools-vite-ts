import trashIcon from "@assets/icons/trash/trash.svg"
import pdfIcon from "@assets/icons/pdf/pdf.svg"
import { useHandleChatScrolling } from "@utils/hooks"
import { useDownloadRenewalSummaryFile, useDownloadRenewalSummaryPdf, useDeleteRenewalSummaryFile, usePreviewRenewalSummaryFile, useHandleChatPanel, useHandleCsrGroupList, useHandleCsrSection, useHandleConfirmButton, useRenewalSummaryQuotes, useUploadRenewalSummaryQuotes, useHandleQuoteRemoval } from "./hooks"
import { AVAILABLE_MCP_TOOLS, QUOTE_HELP_TEXT, formatTimestamp, formatQuoteLine } from "./utils"

// Types
import type * as AppTypes from "@context/App/types"

// Components
import { useCommercialCtx } from "@components/commercial/context/hooks"
import { SUMMARY_ORDER_OPTIONS, filterPastRenewals, filterCurrentMonth, isToday, collectCreatedToday, collectUpdatedToday, isUpdatedToday, updatedTooltip, collectSearchMatches } from "@components/commercial/context/utils"
import ClaudeDisclaimer from "@components/team/utils/ClaudeDisclaimer"
import DocxPreviewModal from "@components/team/utils/DocxPreviewModal"
import ChatMessageText from "@components/team/utils/ChatMessageText"
import Ordering from "@components/team/utils/Ordering"
import TodayFilter from "@components/team/utils/TodayFilter"
import CustomerSearch from "@components/team/utils/CustomerSearch"
import Pagination from "@components/team/utils/Pagination"
import FooterMessage from "@components/team/utils/FooterMessage"
import DownloadOdometer from "@components/team/utils/DownloadOdometer"
import PdfDropZone from "@components/team/utils/PdfDropZone"
import SendButton from "@components/team/utils/SendButton"
import ChatInput from "@components/team/utils/ChatInput"
import AvailableTools from "@components/team/utils/AvailableTools"
import ChatHeader from "@components/team/utils/ChatHeader"

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
            placeholder="Ask Claude to build a renewal summary…" />
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
  const { rowRefs, highlightedFilename, footerMessage, notify } = useHandleCsrGroupList(groups, scrollSignal)
  const { showPastRenewals, setShowPastRenewals, currentMonthOnly, setCurrentMonthOnly, createdTodayOnly, setCreatedTodayOnly, updatedTodayOnly, setUpdatedTodayOnly, searchQuery, setSearchQuery, order, setOrder } = useCommercialCtx()

  if(groups.length === 0) {
    return (
      <>
        <p className="py-8 text-center text-base-content/70">No renewal summaries generated yet.</p>
        <DownloadOdometer tool="cl-renewal-summary" />
        <FooterMessage message={footerMessage?.text ?? null} error={footerMessage?.error} />
      </>
    )
  }

  const createdToday = collectCreatedToday(groups)
  const updatedToday = collectUpdatedToday(groups)
  const searchResults = collectSearchMatches(groups, searchQuery)
  const searching = searchQuery.trim() !== ""
  const showCreatedToday = !searching && createdTodayOnly && createdToday.length > 0
  const showUpdatedToday = !searching && !showCreatedToday && updatedTodayOnly && updatedToday.length > 0
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

  return (
    <>
      <div className="flex flex-col gap-4">
        <ListControls
          order={order}
          setOrder={setOrder}
          showPastRenewals={showPastRenewals}
          setShowPastRenewals={setShowPastRenewals}
          currentMonthOnly={currentMonthOnly}
          setCurrentMonthOnly={setCurrentMonthOnly}
          createdTodayCount={createdToday.length}
          showCreatedToday={showCreatedToday}
          toggleCreatedToday={toggleCreatedToday}
          updatedTodayCount={updatedToday.length}
          showUpdatedToday={showUpdatedToday}
          toggleUpdatedToday={toggleUpdatedToday}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery} />
        <NoVisibleGroupsMsg
          visible={visibleGroups.length === 0}
          currentMonthOnly={currentMonthOnly}
          searchQuery={searchQuery} />
        {visibleGroups.map((group) => (
          <CsrSection
            key={group.csr_code ?? "__unassigned__"}
            group={group}
            title={sectionTitle}
            order={order}
            rowRefs={rowRefs.current}
            highlightedFilename={highlightedFilename}
            onNotify={notify} />
        ))}
      </div>
      <DownloadOdometer tool="cl-renewal-summary" />
      <FooterMessage message={footerMessage?.text ?? null} error={footerMessage?.error} />
    </>
  )
}

type ListControlsProps = {
  order: string
  setOrder: (value: string) => void
  showPastRenewals: boolean
  setShowPastRenewals: (value: boolean) => void
  currentMonthOnly: boolean
  setCurrentMonthOnly: (value: boolean) => void
  createdTodayCount: number
  showCreatedToday: boolean
  toggleCreatedToday: (active: boolean) => void
  updatedTodayCount: number
  showUpdatedToday: boolean
  toggleUpdatedToday: (active: boolean) => void
  searchQuery: string
  setSearchQuery: (value: string) => void
}

const ListControls = ({ order, setOrder, showPastRenewals, setShowPastRenewals, currentMonthOnly, setCurrentMonthOnly, createdTodayCount, showCreatedToday, toggleCreatedToday, updatedTodayCount, showUpdatedToday, toggleUpdatedToday, searchQuery, setSearchQuery }: ListControlsProps) => {
  const searching = searchQuery.trim() !== ""
  const filtersLocked = searching || showCreatedToday || showUpdatedToday

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center justify-end gap-4">
        <FilterToggle
          label="Show past renewals"
          checked={showPastRenewals}
          onChange={setShowPastRenewals}
          disabled={filtersLocked} />
        <FilterToggle
          label="Current month only"
          checked={currentMonthOnly}
          onChange={setCurrentMonthOnly}
          disabled={filtersLocked} />
      </div>
      <div className="flex flex-col items-center gap-4 sm:grid sm:grid-cols-[1fr_auto_1fr]">
        <div className="self-start sm:justify-self-start">
          <Ordering
            value={order}
            onChange={setOrder}
            options={SUMMARY_ORDER_OPTIONS} />
        </div>
        <CustomerSearch
          value={searchQuery}
          onChange={setSearchQuery} />
        <div className="flex flex-wrap items-center gap-4 self-end sm:justify-self-end">
          <TodayFilter
            label="Created Today"
            count={createdTodayCount}
            active={showCreatedToday}
            disabled={searching}
            onChange={toggleCreatedToday} />
          <TodayFilter
            label="Updated Today"
            count={updatedTodayCount}
            active={showUpdatedToday}
            disabled={searching}
            btnStyle="btn-info"
            onChange={toggleUpdatedToday} />
        </div>
      </div>
    </>
  )
}

type FilterToggleProps = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled: boolean
}

const FilterToggle = ({ label, checked, onChange, disabled }: FilterToggleProps) => (
  <label className="label cursor-pointer gap-2 text-sm">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className="checkbox checkbox-sm" />
    {label}
  </label>
)

type NoVisibleGroupsMsgProps = {
  visible: boolean
  currentMonthOnly: boolean
  searchQuery: string
}

const NoVisibleGroupsMsg = ({ visible, currentMonthOnly, searchQuery }: NoVisibleGroupsMsgProps) => {
  if(!visible) return null

  const msg = searchQuery.trim() ?
    `No customers or policies match "${ searchQuery.trim() }".` :
    currentMonthOnly ?
    "No renewals this month." :
    "No upcoming renewals — all generated summaries are past their renewal date."

  return (
    <p className="py-8 text-center text-base-content/70">{msg}</p>
  )
}

type CsrSectionProps = {
  group: AppTypes.RenewalSummaryCsrGroup
  title?: string
  order: string
  rowRefs: Map<string, HTMLLIElement>
  highlightedFilename: string | null
  onNotify: (message: string, error?: boolean) => void
}

const CsrSection = ({ group, title, order, rowRefs, highlightedFilename, onNotify }: CsrSectionProps) => {
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
              onNotify={onNotify} />
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
  onNotify: (message: string, error?: boolean) => void
}

const SummaryRow = ({ summary, rowRefs, highlighted, onNotify }: SummaryRowProps) => {
  const { mutate: downloadFile, isPending: isDownloading } = useDownloadRenewalSummaryFile()
  const { mutate: downloadPdf, isPending: isDownloadingPdf, error: pdfError } = useDownloadRenewalSummaryPdf()
  const { mutate: deleteFile, isPending: isDeleting, error: deleteError } = useDeleteRenewalSummaryFile()
  const preview = usePreviewRenewalSummaryFile(summary.filename)
  const quotes = useRenewalSummaryQuotes(summary.filename, summary.client_name, onNotify)
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
          <SummaryRowDetails
            summary={summary}
            errors={[deleteError, pdfError]} />
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap">
              <DeleteButton
                isPending={isDeleting}
                onConfirm={() => deleteFile(summary.filename, { onSuccess: () => onNotify(`Deleted ${ summary.client_name }...`) })} />
              <UploadQuoteButton onFiles={upload} />
              <PreviewButton onClick={preview.show} />
              <DownloadButton
                isPending={isDownloading}
                onClick={() => downloadFile(summary.filename)} />
              <PdfDownloadButton
                isPending={isDownloadingPdf}
                onClick={() => downloadPdf(summary.filename)} />
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-base-content/50 italic sm:justify-end">
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

const SummaryRowDetails = ({ summary, errors }: { summary: AppTypes.RenewalSummaryManifestEntry, errors: (Error | null)[] }) => (
  <div className="flex w-full min-w-0 flex-col sm:w-auto sm:flex-1">
    <span className="font-semibold">{summary.client_name}</span>
    <span className="text-sm text-base-content/60 italic">Renews {summary.renewal_date_label}</span>
    <span className="text-sm text-base-content/60">{summary.polnos}</span>
    <LineItemStatus summary={summary} />
    {errors.map((error, i) => error && <span key={i} className="text-sm text-error">{error.message}</span>)}
  </div>
)

const UploadQuoteButton = ({ onFiles }: { onFiles: (files: File[], rejected: string[]) => void }) => (
  <PdfDropZone
    variant="button"
    onFiles={onFiles}
    title={`Upload a carrier quote PDF, or drop it on this row. ${ QUOTE_HELP_TEXT }`}
    className="btn btn-ghost btn-sm hover:bg-secondary">
      Upload Quote
  </PdfDropZone>
)

const PreviewButton = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick} className="btn btn-ghost btn-sm hover:bg-secondary">
    Preview
  </button>
)

const LineItemStatus = ({ summary }: { summary: AppTypes.RenewalSummaryManifestEntry }) => {
  if(!summary.sections?.length) return null

  if(summary.sections.every((s) => s.renewed)) return (
    <div className="mt-1">
      <CompleteBadge />
    </div>
  )

  return (
    <ul className="mt-1 flex flex-wrap gap-x-3 text-sm">
      {summary.sections.map((section) => (
        <LineItemSection
          key={`${ section.polno }-${ section.title }`}
          section={section} />
      ))}
    </ul>
  )
}

const LineItemSection = ({ section }: { section: { title: string, renewed: boolean } }) => {
  const title = section.renewed ? "Renewed" : "Awaiting renewal terms"
  const textColor = section.renewed ? "text-success/70" : "text-base-content/35"

  return (
    <li title={title} className={textColor}>
      {section.renewed && "✓ "}{section.title}
    </li>
  )
}

const CompleteBadge = () => (
  <span title="Every section has renewal terms from AMS360 or an uploaded quote" className="badge badge-soft badge-success badge-sm cursor-default rounded-sm border-success/30 text-success/70 not-italic">
    ✓ Complete
  </span>
)

const CreatedAt = ({ summary }: { summary: AppTypes.RenewalSummaryManifestEntry }) => {
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
      <UploadErrors
        errors={errors}
        onDismiss={onDismissErrors} />
      <ul className="flex flex-col gap-1.5">
        {quotes.map((quote) => (
          <QuoteChip
            key={quote.id}
            filename={filename}
            quote={quote} />
        ))}
        {uploading.map((upload) => (
          <UploadingChip
            key={upload.key}
            name={upload.name} />
        ))}
      </ul>
      <QuoteHelpText visible={quotes.some((quote) => quote.status === "done")} />
    </div>
  )
}

const UploadErrors = ({ errors, onDismiss }: { errors: string[], onDismiss: () => void }) => {
  if(errors.length === 0) return null

  return (
    <div className="flex items-start gap-2 text-sm text-error">
      <div className="flex flex-1 flex-col">
        {errors.map((error, i) => <span key={i}>{error}</span>)}
      </div>
      <button type="button" onClick={onDismiss} title="Dismiss" className="btn btn-ghost btn-xs">×</button>
    </div>
  )
}

const UploadingChip = ({ name }: { name: string }) => (
  <li className="flex items-center gap-2 rounded-box bg-base-200 px-3 py-1.5 text-sm">
    <img src={pdfIcon} alt="" className="size-4" />
    <span className="truncate font-medium">{name}</span>
    <span className="loading loading-spinner loading-xs text-base-content/90" />
    <span className="text-base-content/80 italic">Uploading…</span>
  </li>
)

const QuoteHelpText = ({ visible }: { visible: boolean }) => {
  if(!visible) return null

  return (
    <p className="text-xs text-base-content/50 italic">{QUOTE_HELP_TEXT}</p>
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
        <span className="flex items-center gap-1.5 text-base-content/80 italic">
          <span className="loading loading-spinner loading-xs text-base-content/90" />Reading quote…
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
      <ChatMsg
        key={i}
        message={message} />
    ))}
  </>
)

const ChatMsg = ({ message }: { message: AppTypes.RenewalSummaryChatMessage }) => {
  const isUser = message.role === "user"

  const bubbleClass = isUser ?
    "bg-base-300 text-base-content" :
    "bg-accent/20 text-base-content"

  return (
    <div className={`chat ${ isUser ? "chat-end" : "chat-start" }`}>
      <ChatMsgHeader visible={message.role === "assistant"} />
      <div className={`chat-bubble whitespace-pre-wrap text-sm ${ bubbleClass }`}>
        <ChatMessageText text={message.text} />
      </div>
    </div>
  )
}

const ChatMsgHeader = ({ visible }: { visible: boolean }) => {
  if(!visible) return null

  return (
    <div className="chat-header text-xs font-semibold text-accent">Claude</div>
  )
}

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
