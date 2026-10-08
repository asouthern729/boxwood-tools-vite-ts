import claudeIcon from "@assets/claude.png"
import trashIcon from "@assets/icons/trash/trash.svg"
import { useHandleChatScrolling } from "@utils/hooks"
import { useDownloadPreRenewalRiskProfileFile, useDeletePreRenewalRiskProfileFile, usePreviewPreRenewalRiskProfileFile, useHandleChatPanel, useHandleCsrGroupList, useHandleCsrSection, useHandleConfirmButton } from "./hooks"
import { AVAILABLE_MCP_TOOLS, formatTimestamp } from "./utils"

// Types
import type * as AppTypes from "@context/App/types"

// Components
import { useCommercialCtx } from "@components/commercial/context/hooks"
import { SUMMARY_ORDER_OPTIONS, filterPastRenewals, filterCurrentMonth, isToday, collectCreatedToday, collectSearchMatches } from "@components/commercial/context/utils"
import ClaudeDisclaimer from "@components/team/utils/ClaudeDisclaimer"
import DocxPreviewModal from "@components/team/utils/DocxPreviewModal"
import ChatMessageText from "@components/team/utils/ChatMessageText"
import Ordering from "@components/team/utils/Ordering"
import TodayFilter from "@components/team/utils/TodayFilter"
import CustomerSearch from "@components/team/utils/CustomerSearch"
import Pagination from "@components/team/utils/Pagination"
import FooterMessage from "@components/team/utils/FooterMessage"
import SendButton from "@components/team/utils/SendButton"
import ChatInput from "@components/team/utils/ChatInput"
import AvailableTools from "@components/team/utils/AvailableTools"

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
            placeholder="Ask Claude to build a pre-renewal risk profile…" />
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
  const { rowRefs, highlightedFilename, deletedMessage, notifyDeleted } = useHandleCsrGroupList(groups, scrollSignal)
  const { showPastRenewals, setShowPastRenewals, currentMonthOnly, setCurrentMonthOnly, createdTodayOnly, setCreatedTodayOnly, searchQuery, setSearchQuery, order, setOrder } = useCommercialCtx()

  if(groups.length === 0) {
    return (
      <>
        <p className="py-8 text-center text-base-content/70">No pre-renewal risk profiles generated yet.</p>
        <FooterMessage message={deletedMessage} />
      </>
    )
  }

  const createdToday = collectCreatedToday(groups)
  const searchResults = collectSearchMatches(groups, searchQuery)
  const searching = searchQuery.trim() !== ""
  const showCreatedToday = !searching && createdTodayOnly && createdToday.length > 0
  const sectionTitle = searching ? "Search Results" : showCreatedToday ? "Created Today" : undefined

  // Search and Created Today ignore the other filters so they never land on a filtered-out list
  const visibleGroups = searching ?
    (searchResults.length > 0 ? [{ csr_code: "__search_results__", csr_name: null, summaries: searchResults }] : []) :
    showCreatedToday ?
    [{ csr_code: "__created_today__", csr_name: null, summaries: createdToday }] :
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
          setCreatedTodayOnly={setCreatedTodayOnly}
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
            onDeleted={notifyDeleted} />
        ))}
      </div>
      <FooterMessage message={deletedMessage} />
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
  setCreatedTodayOnly: (value: boolean) => void
  searchQuery: string
  setSearchQuery: (value: string) => void
}

const ListControls = ({ order, setOrder, showPastRenewals, setShowPastRenewals, currentMonthOnly, setCurrentMonthOnly, createdTodayCount, showCreatedToday, setCreatedTodayOnly, searchQuery, setSearchQuery }: ListControlsProps) => {
  const searching = searchQuery.trim() !== ""
  const filtersLocked = searching || showCreatedToday

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <Ordering 
          value={order} 
          onChange={setOrder} 
          options={SUMMARY_ORDER_OPTIONS} />
        <TodayFilter
          label="Created Today"
          count={createdTodayCount}
          active={showCreatedToday}
          disabled={searching}
          onChange={setCreatedTodayOnly} />
        <div className="ml-auto flex flex-wrap items-center gap-4">
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
      </div>
      <div className="flex justify-center">
        <CustomerSearch
          value={searchQuery}
          onChange={setSearchQuery} />
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
    "No upcoming renewals — all generated profiles are past their renewal date."

  return (
    <p className="py-8 text-center text-base-content/70">{msg}</p>
  )
}

type CsrSectionProps = {
  group: AppTypes.PreRenewalRiskProfileCsrGroup
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
  summary: AppTypes.PreRenewalRiskProfileManifestEntry
  rowRefs: Map<string, HTMLLIElement>
  highlighted: boolean
  onDeleted: (clientName: string) => void
}

const SummaryRow = ({ summary, rowRefs, highlighted, onDeleted }: SummaryRowProps) => {
  const { mutate: downloadFile, isPending: isDownloading } = useDownloadPreRenewalRiskProfileFile()
  const { mutate: deleteFile, isPending: isDeleting, error: deleteError } = useDeletePreRenewalRiskProfileFile()
  const preview = usePreviewPreRenewalRiskProfileFile(summary.filename)

  return (
    <li
      ref={(el) => {
        if(el) rowRefs.set(summary.filename, el)
        else rowRefs.delete(summary.filename)
      }}
      className={`flex flex-col gap-3 px-4 py-3 transition-colors duration-1000 sm:flex-row sm:items-center ${ highlighted ? "bg-base-200" : "" }`}>
      <SummaryRowDetails
        summary={summary}
        error={deleteError} />
      <div className="flex flex-col items-center gap-2 sm:items-end">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap">
          <DeleteButton
            isPending={isDeleting}
            onConfirm={() => deleteFile(summary.filename, { onSuccess: () => onDeleted(summary.client_name) })} />
          <PreviewButton onClick={preview.show} />
          <DownloadButton
            isPending={isDownloading}
            onClick={() => downloadFile(summary.filename)} />
        </div>
        <div className="text-center text-xs text-base-content/50 italic sm:text-right">
          <CreatedAt generatedAt={summary.generated_at} />
        </div>
      </div>
      <DocxPreviewModal
        title={summary.client_name}
        open={preview.open}
        onClose={preview.hide}
        fetchBlob={preview.fetchBlob} />
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

const SummaryRowDetails = ({ summary, error }: { summary: AppTypes.PreRenewalRiskProfileManifestEntry, error: Error | null }) => (
  <div className="flex w-full min-w-0 flex-col sm:w-auto sm:flex-1">
    <span className="font-semibold">{summary.client_name}</span>
    <span className="text-sm text-base-content/60 italic">Renews {summary.renewal_date_label}</span>
    <span className="text-sm text-base-content/60">{summary.polnos}</span>
    {error && <span className="text-sm text-error">{error.message}</span>}
  </div>
)

const PreviewButton = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick} className="btn btn-ghost btn-sm hover:bg-secondary">
    Preview
  </button>
)

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
      Ask Claude to build a pre-renewal risk profile for a customer — e.g. "Build the
      pre-renewal risk profile for Acme Corp." — or search for customers with upcoming renewals.
    </p>
  )
}

const ChatMsgs = ({ messages }: { messages: AppTypes.PreRenewalRiskProfileChatMessage[] }) => (
  <>
    {messages.map((message, i) => (
      <ChatMsg
        key={i}
        message={message} />
    ))}
  </>
)

const ChatMsg = ({ message }: { message: AppTypes.PreRenewalRiskProfileChatMessage }) => {
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
