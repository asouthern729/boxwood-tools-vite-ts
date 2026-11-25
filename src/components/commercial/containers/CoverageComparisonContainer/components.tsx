import { useState } from "react"
import trashIcon from "@assets/icons/trash/trash.svg"
import { useHandleChatScrolling } from "@utils/hooks"
import { useDownloadCoverageComparisonFile, useDownloadCoverageComparisonPdf, useDeleteCoverageComparison, usePreviewCoverageComparisonFile, useHandleChatPanel, useHandleComparisonList, useHandleComparisonSection, useHandleConfirmButton, useAnnounceReadErrors, announceReading } from "./hooks"
import { AVAILABLE_MCP_TOOLS, ACCEPTED_FILES, SET_ZONES, SET_LABELS, OTHER_SET, COMPARISON_ORDER_OPTIONS, clientName, filterComparisons, formatTimestamp, formatMoney, formatDifference, profileSummary } from "./utils"
import { isToday } from "@components/commercial/context/utils"

// Types
import type * as AppTypes from "@context/App/types"
import type { CoverageComparisonChat, ComparisonFiles, StagedFile } from "./hooks"

// Components
import ChatHeader from "@components/team/utils/ChatHeader"
import ClaudeDisclaimer from "@components/team/utils/ClaudeDisclaimer"
import DocxPreviewModal from "@components/team/utils/DocxPreviewModal"
import ChatMessageText from "@components/team/utils/ChatMessageText"
import Ordering from "@components/team/utils/Ordering"
import CustomerSearch from "@components/team/utils/CustomerSearch"
import Pagination from "@components/team/utils/Pagination"
import { toastDeleted } from "@components/layout/Toast/utils"
import DownloadOdometer from "@components/team/utils/DownloadOdometer"
import SendButton from "@components/team/utils/SendButton"
import NewChatButton from "@components/team/utils/NewChatButton"
import ChatInput from "@components/team/utils/ChatInput"
import AvailableTools from "@components/team/utils/AvailableTools"
import PdfDropZone from "@components/team/utils/PdfDropZone"
import UploadControls from "@components/team/utils/UploadControls"

type ChatPanelProps = {
  chat: CoverageComparisonChat
  staged: ComparisonFiles
}

export const ChatPanel = ({ chat, staged }: ChatPanelProps) => {
  const { messagesRef, send, run, canRun, draft, setDraft } = useHandleChatPanel(chat, staged)
  useHandleChatScrolling(messagesRef, chat.messages, chat.isPending)
  useAnnounceReadErrors(staged.files, chat.announce)

  const addFiles = (role: AppTypes.CoverageComparisonRole, files: File[], rejected: string[]) => {
    staged.addFiles(role, files, rejected)
    if(files.length > 0) chat.announce(announceReading(files.map((file) => file.name)))
  }

  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body gap-3">
        <ChatHeader />

        <AvailableTools tools={AVAILABLE_MCP_TOOLS} />

        <SetZones
          staged={staged}
          onFiles={addFiles} />

        <div
          ref={messagesRef}
          className="flex max-h-72 flex-col gap-1 overflow-y-auto"
          style={{ scrollbarWidth: "thin" }}>
            <ChatTip visible={chat.messages.length === 0} />
            <ChatMsgs messages={chat.messages} />
            <ClaudeLoading visible={chat.isPending} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <ChatInput
            draft={draft}
            setDraft={setDraft}
            isPending={chat.isPending}
            send={send}
            placeholder="Ask about the files or a finished comparison, or add notes for it, then press Compare…" />
          <div className="flex flex-col gap-2 sm:w-32 sm:self-end">
            <NewChatButton
              disabled={!chat.canStartNewChat}
              onClick={chat.newChat} />
            <SendButton
              draft={staged.busy ? "" : draft}
              isPending={chat.isPending}
              onClick={send} />
          </div>
          <CompareButton
            visible={staged.files.length > 0}
            disabled={!canRun}
            staged={staged}
            onClick={run} />
        </div>

        <ClaudeDisclaimer />
      </div>
    </div>
  )
}

type CompareButtonProps = {
  visible: boolean
  disabled: boolean
  staged: ComparisonFiles
  onClick: () => void
}

const compareButtonState = (staged: ComparisonFiles) => {
  if(staged.busy) return { label: "Reading files…", title: "Waiting for the files to finish reading" }
  if(!staged.hasRead("set_a")) return { label: "Compare", title: "Add at least one file to Set A first" }
  if(!staged.hasRead("set_b")) return { label: "Compare", title: "Add at least one file to Set B first" }
  return { label: "Compare", title: "Compare the two sets, using anything typed as notes for the comparison" }
}

const CompareButton = ({ visible, disabled, staged, onClick }: CompareButtonProps) => {
  if(!visible) return null

  const { label, title } = compareButtonState(staged)

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className="btn btn-accent w-full self-end sm:w-auto">
        {label}
    </button>
  )
}

type SetZonesProps = {
  staged: ComparisonFiles
  onFiles: (role: AppTypes.CoverageComparisonRole, files: File[], rejected: string[]) => void
}

const SetZones = ({ staged, onFiles }: SetZonesProps) => (
  <div className="grid gap-3 md:grid-cols-2">
    {SET_ZONES.map((zone) => (
      <SetZone
        key={zone.role}
        zone={zone}
        files={staged.files.filter((f) => f.role === zone.role)}
        columnLabel={staged.setLabels[zone.role]}
        onColumnLabel={(value) => staged.setLabel(zone.role, value)}
        onFiles={(files, rejected) => onFiles(zone.role, files, rejected)}
        onRemove={staged.remove}
        onMove={staged.move} />
    ))}
  </div>
)

type SetZoneProps = {
  zone: typeof SET_ZONES[number]
  files: StagedFile[]
  columnLabel: string
  onColumnLabel: (value: string) => void
  onFiles: (files: File[], rejected: string[]) => void
  onRemove: (key: string) => void
  onMove: (key: string, role: AppTypes.CoverageComparisonRole) => void
}

const SetZone = ({ zone, files, columnLabel, onColumnLabel, onFiles, onRemove, onMove }: SetZoneProps) => (
  <PdfDropZone
    variant="area"
    onFiles={onFiles}
    accept={ACCEPTED_FILES}
    title={`Drop files here: ${ zone.hint }`}
    className="flex min-h-40 flex-col gap-2 rounded-box border-2 border-dashed border-base-300 p-3">
      <div className="flex items-start gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{zone.label}</span>
          <span className="text-xs text-base-content/60">{zone.hint}</span>
        </div>
      </div>
      <input
        type="text"
        value={columnLabel}
        onChange={(e) => onColumnLabel(e.target.value)}
        placeholder={`Column heading (optional), ${ zone.labelPlaceholder }`}
        title="The heading for this set's column in the comparison; left blank, it's read from the documents"
        className="input input-sm input-bordered w-full" />
      <EmptyZoneMsg visible={files.length === 0} />
      <ul className="flex flex-col gap-1.5">
        {files.map((file) => (
          <FileChip
            key={file.key}
            file={file}
            onRemove={onRemove}
            onMove={onMove} />
        ))}
      </ul>
      <UploadControls
        onFiles={onFiles}
        accept={ACCEPTED_FILES}
        title={`Choose files for ${ zone.label }`}
        className="mt-auto" />
  </PdfDropZone>
)

const EmptyZoneMsg = ({ visible }: { visible: boolean }) => {
  if(!visible) return null

  return (
    <p className="m-auto text-xs text-base-content/40 italic">Drop files here</p>
  )
}

type FileChipProps = {
  file: StagedFile
  onRemove: (key: string) => void
  onMove: (key: string, role: AppTypes.CoverageComparisonRole) => void
}

const FileChip = ({ file, onRemove, onMove }: FileChipProps) => {
  const isError = file.status === "error"
  const chipStyle = isError ?
    "bg-error/10 text-error" :
    "bg-base-200"

  return (
    <li title={file.error ?? file.filename} className={`flex flex-col gap-0.5 rounded-sm px-2 py-1 text-sm ${ chipStyle }`}>
      <div className="flex items-center gap-1.5">
        <ChipStatus file={file} />
        <span className={isError ? "flex-1" : "min-w-0 flex-1 truncate"}>{isError && file.error ? file.error : file.filename}</span>
        <MoveButton
          file={file}
          onMove={onMove} />
        <button
          type="button"
          aria-label={`Remove ${ file.filename }`}
          onClick={() => onRemove(file.key)}
          className="cursor-pointer opacity-60 hover:opacity-100">
            ✕
        </button>
      </div>
      <ChipProfile profile={file.profile} />
    </li>
  )
}

// Swaps a file to the other set, for one dropped in the wrong box
const MoveButton = ({ file, onMove }: { file: StagedFile, onMove: (key: string, role: AppTypes.CoverageComparisonRole) => void }) => {
  if(!file.id || file.status === "error" || file.moving) return null

  const target = OTHER_SET[file.role]

  return (
    <button
      type="button"
      title={`Move to ${ SET_LABELS[target] }`}
      aria-label={`Move ${ file.filename } to ${ SET_LABELS[target] }`}
      onClick={() => onMove(file.key, target)}
      className="cursor-pointer opacity-60 hover:opacity-100">
        ⇄
    </button>
  )
}

const ChipStatus = ({ file }: { file: StagedFile }) => {
  if(file.status === "done" && !file.moving) return <span className="text-success/70">✓</span>
  if(file.status === "error") return <span>!</span>

  return <span className="loading loading-spinner loading-xs text-base-content/90" />
}

const ChipProfile = ({ profile }: { profile?: StagedFile["profile"] }) => {
  if(!profile) return null

  const summary = profileSummary(profile)
  if(!summary) return null

  return (
    <span className="truncate pl-5 text-xs text-base-content/60">{summary}</span>
  )
}

type ComparisonListProps = {
  manifest: AppTypes.CoverageComparisonManifest
  scope: AppTypes.CoverageComparisonScope
  onScopeChange: (scope: AppTypes.CoverageComparisonScope) => void
  scrollSignal: number
}

export const ComparisonList = ({ manifest, scope, onScopeChange, scrollSignal }: ComparisonListProps) => {
  const { rowRefs, highlightedId } = useHandleComparisonList(manifest.groups, scrollSignal)
  const [searchQuery, setSearchQuery] = useState("")
  const [order, setOrder] = useState(COMPARISON_ORDER_OPTIONS[0].value)

  const visibleGroups = filterComparisons(manifest.groups, searchQuery)

  return (
    <>
      <div className="flex flex-col gap-4">
        <ListControls
          order={order}
          setOrder={setOrder}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          scope={scope}
          onScopeChange={onScopeChange} />
        <NoVisibleGroupsMsg
          visible={visibleGroups.length === 0}
          scope={scope}
          searchQuery={searchQuery} />
        {visibleGroups.map((group) => (
          <ComparisonSection
            key={group.prepared_by ?? "__unattributed__"}
            group={group}
            scope={scope}
            order={order}
            viewerSub={manifest.viewer_sub}
            rowRefs={rowRefs.current}
            highlightedId={highlightedId} />
        ))}
      </div>
      <DownloadOdometer tool="coverage-comparison" />
    </>
  )
}

type ListControlsProps = {
  order: string
  setOrder: (value: string) => void
  searchQuery: string
  setSearchQuery: (value: string) => void
  scope: AppTypes.CoverageComparisonScope
  onScopeChange: (scope: AppTypes.CoverageComparisonScope) => void
}

const ListControls = ({ order, setOrder, searchQuery, setSearchQuery, scope, onScopeChange }: ListControlsProps) => (
  <div className="flex flex-col items-center gap-4 sm:grid sm:grid-cols-[1fr_auto_1fr]">
    <div className="self-start sm:justify-self-start">
      <Ordering
        value={order}
        onChange={setOrder}
        options={COMPARISON_ORDER_OPTIONS} />
    </div>
    <CustomerSearch
      value={searchQuery}
      onChange={setSearchQuery} />
    <div className="self-end sm:justify-self-end">
      <ScopeToggle
        scope={scope}
        onChange={onScopeChange} />
    </div>
  </div>
)

type NoVisibleGroupsMsgProps = {
  visible: boolean
  scope: AppTypes.CoverageComparisonScope
  searchQuery: string
}

const NoVisibleGroupsMsg = ({ visible, scope, searchQuery }: NoVisibleGroupsMsgProps) => {
  if(!visible) return null

  const msg = searchQuery.trim() ?
    `No comparisons match "${ searchQuery.trim() }".` :
    scope === "mine" ?
    "You haven't run any coverage comparisons yet." :
    "No coverage comparisons have been run yet."

  return (
    <p className="py-8 text-center text-base-content/70">{msg}</p>
  )
}

const ScopeToggle = ({ scope, onChange }: { scope: AppTypes.CoverageComparisonScope, onChange: (scope: AppTypes.CoverageComparisonScope) => void }) => (
  <div className="join">
    <ScopeBtn
      label="My Comparisons"
      active={scope === "mine"}
      onClick={() => onChange("mine")} />
    <ScopeBtn
      label="All Comparisons"
      active={scope === "all"}
      onClick={() => onChange("all")} />
  </div>
)

type ScopeBtnProps = {
  label: string
  active: boolean
  onClick: () => void
}

const ScopeBtn = ({ label, active, onClick }: ScopeBtnProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`btn join-item btn-sm ${ active ? "btn-secondary" : "btn-ghost" }`}>
      {label}
  </button>
)

type ComparisonSectionProps = {
  group: AppTypes.CoverageComparisonGroup
  scope: AppTypes.CoverageComparisonScope
  order: string
  viewerSub: string
  rowRefs: Map<string, HTMLLIElement>
  highlightedId: string | null
}

const ComparisonSection = ({ group, scope, order, viewerSub, rowRefs, highlightedId }: ComparisonSectionProps) => {
  const { pageComparisons, currentPage, totalItems, setPage, sectionRef } = useHandleComparisonSection(group.comparisons, order)

  const title = scope === "mine" ?
    "Created By Me" :
    group.prepared_by ?? "No Name"

  return (
    <div ref={sectionRef} className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body gap-1 p-0 py-2">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pt-1">
          <h3 className="text-sm font-semibold text-primary">{title}</h3>
          <Pagination
            page={currentPage}
            totalItems={totalItems}
            onPageChange={setPage}
            className="py-0" />
        </div>
        <ul className="divide-y divide-base-300">
          {pageComparisons.map((comparison) => (
            <ComparisonRow
              key={comparison.id}
              comparison={comparison}
              canDelete={comparison.created_by.sub === viewerSub}
              rowRefs={rowRefs}
              highlighted={comparison.id === highlightedId} />
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

type ComparisonRowProps = {
  comparison: AppTypes.CoverageComparisonEntry
  canDelete: boolean
  rowRefs: Map<string, HTMLLIElement>
  highlighted: boolean
}

const ComparisonRow = ({ comparison, canDelete, rowRefs, highlighted }: ComparisonRowProps) => {
  const { mutate: deleteComparison, isPending: isDeleting, error: deleteError } = useDeleteCoverageComparison()

  return (
    <li
      ref={(el) => {
        if(el) rowRefs.set(comparison.id, el)
        else rowRefs.delete(comparison.id)
      }}
      className={`flex flex-col gap-3 px-4 py-3 transition-colors duration-1000 sm:flex-row sm:items-center ${ highlighted ? "bg-base-200" : "" }`}>
      <ComparisonRowDetails
        comparison={comparison}
        deleteError={deleteError} />
      <div className="flex flex-col items-center gap-2 sm:items-end">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap">
          <DeleteButton
            visible={canDelete}
            running={comparison.status === "running"}
            isPending={isDeleting}
            onConfirm={() => deleteComparison(comparison.id, { onSuccess: () => toastDeleted(clientName(comparison)) })} />
          <ComparisonActions comparison={comparison} />
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-base-content/50 italic sm:justify-end">
          <CreatedAt comparison={comparison} />
        </div>
      </div>
    </li>
  )
}

const ComparisonActions = ({ comparison }: { comparison: AppTypes.CoverageComparisonEntry }) => {
  if(comparison.status === "running") return (
    <span className="flex items-center gap-2 text-sm text-base-content/70">
      <span className="loading loading-spinner loading-sm text-accent" />
      Comparing…
    </span>
  )

  if(comparison.status === "failed" || !comparison.filename) return (
    <span className="badge badge-soft badge-error badge-sm rounded-sm">Failed</span>
  )

  return <ReportButtons comparison={comparison} filename={comparison.filename} />
}

const ReportButtons = ({ comparison, filename }: { comparison: AppTypes.CoverageComparisonEntry, filename: string }) => {
  const { mutate: downloadFile, isPending: isDownloading } = useDownloadCoverageComparisonFile()
  const { mutate: downloadPdf, isPending: isDownloadingPdf, error: pdfError } = useDownloadCoverageComparisonPdf()
  const preview = usePreviewCoverageComparisonFile(filename)

  return (
    <>
      <PreviewButton onClick={preview.show} />
      <DownloadButton
        label="Word"
        title="Download as Word (.docx)"
        isPending={isDownloading}
        onClick={() => downloadFile(filename)} />
      <DownloadButton
        label="PDF"
        title={pdfError?.message ?? "Download as PDF"}
        isPending={isDownloadingPdf}
        onClick={() => downloadPdf(filename)} />
      <DocxPreviewModal
        title={clientName(comparison)}
        open={preview.open}
        onClose={preview.hide}
        fetchBlob={preview.fetchBlob} />
    </>
  )
}

const ComparisonRowDetails = ({ comparison, deleteError }: { comparison: AppTypes.CoverageComparisonEntry, deleteError: Error | null }) => (
  <div className="flex w-full min-w-0 flex-col sm:w-auto sm:flex-1">
    <span className="font-semibold">{clientName(comparison)}</span>
    <SetsLine sets={comparison.status === "done" ? comparison.sets : undefined} />
    <RunningMsg visible={comparison.status === "running"} />
    <FailedMsg comparison={comparison} />
    <Premium
      premium={comparison.status === "done" ? comparison.premium : undefined}
      sets={comparison.sets} />
    <KeyPoints count={comparison.status === "done" ? comparison.key_points : undefined} />
    <SourceList sources={comparison.sources} />
    {deleteError && <span className="text-sm text-error">{deleteError.message}</span>}
  </div>
)

const SetsLine = ({ sets }: { sets?: AppTypes.CoverageComparisonEntry["sets"] }) => {
  if(!sets) return null

  return (
    <span className="text-sm text-base-content/60">{sets.a} vs {sets.b}</span>
  )
}

const RunningMsg = ({ visible }: { visible: boolean }) => {
  if(!visible) return null

  return (
    <span className="text-sm text-base-content/60">Running in the background — usually a few minutes. You can leave this page.</span>
  )
}

const FailedMsg = ({ comparison }: { comparison: AppTypes.CoverageComparisonEntry }) => {
  if(comparison.status !== "failed") return null

  return (
    <span className="text-sm text-error">{comparison.error ?? "The comparison didn't finish."} Try running it again.</span>
  )
}

type PremiumProps = {
  premium?: AppTypes.CoverageComparisonEntry["premium"]
  sets?: AppTypes.CoverageComparisonEntry["sets"]
}

const Premium = ({ premium, sets }: PremiumProps) => {
  if(!premium) return null
  if(premium.a == null && premium.b == null) return null

  const difference = formatDifference(premium.difference)
  const title = sets ? `${ sets.a }: ${ formatMoney(premium.a) } · ${ sets.b }: ${ formatMoney(premium.b) }` : undefined

  return (
    <span title={title} className="text-sm text-base-content/70">
      Premium {formatMoney(premium.a)} → {formatMoney(premium.b)}
      {difference && <span className="text-base-content/50"> · {difference}</span>}
    </span>
  )
}

const KeyPoints = ({ count }: { count?: number }) => {
  if(count == null) return null

  return (
    <span className="text-sm text-base-content/70">
      <span className="font-semibold">{count}</span> key {count === 1 ? "point" : "points"}
    </span>
  )
}

const SourceList = ({ sources }: { sources: AppTypes.CoverageComparisonEntry["sources"] }) => {
  if(sources.length === 0) return null

  return (
    <ul className="mt-1 flex flex-wrap gap-1.5">
      {sources.map((source) => (
        <li key={source.id} title={source.filename} className="badge badge-ghost badge-sm max-w-56 gap-1 rounded-sm">
          <span className="font-semibold">{SET_LABELS[source.role]}</span>
          <span className="truncate">{source.filename}</span>
        </li>
      ))}
    </ul>
  )
}

const PreviewButton = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick} className="btn btn-ghost btn-sm hover:bg-secondary">
    Preview
  </button>
)

const CreatedAt = ({ comparison }: { comparison: AppTypes.CoverageComparisonEntry }) => {
  if(isToday(comparison.generated_at)) return (
    <span title={formatTimestamp(comparison.generated_at)} className="badge badge-success dark:badge-outline badge-sm cursor-default rounded-sm not-italic">
      Created Today
    </span>
  )

  return (
    <div>Created {formatTimestamp(comparison.generated_at)}</div>
  )
}

type DeleteButtonProps = {
  visible: boolean
  running: boolean
  isPending: boolean
  onConfirm: () => void
}

const DeleteButton = ({ visible, running, isPending, onConfirm }: DeleteButtonProps) => {
  const { armed, handleClick } = useHandleConfirmButton(onConfirm)

  if(!visible) return null

  const btnContent = isPending ?
    <span className="loading loading-spinner loading-xs" /> :
    <img src={trashIcon} alt="Delete" className={`size-4 ${ armed ? "" : "invert dark:invert-0" }`} />

  const idleTitle = running ? "Cancel and delete this comparison" : "Delete this comparison"

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      title={armed ? "Click again to permanently delete" : idleTitle}
      className={`btn btn-sm btn-square ${ armed ? "btn-error" : "btn-ghost hover:bg-error/20" }`}>
        {btnContent}
    </button>
  )
}

type DownloadButtonProps = {
  label: string
  title: string
  isPending: boolean
  onClick: () => void
}

const DownloadButton = ({ label, title, isPending, onClick }: DownloadButtonProps) => {
  const btnContent = isPending ? "Downloading…" : label

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={onClick}
      title={title}
      className="btn btn-neutral btn-sm hover:bg-secondary">
        {btnContent}
    </button>
  )
}

const ChatTip = ({ visible }: { visible: boolean }) => {
  if(!visible) return null

  return (
    <p className="text-sm text-base-content/60">
      Drop the current program, expiring policy or first quote in Set A and the proposed program,
      renewal or second quote in Set B — several files per set is fine (e.g. BOP, umbrella and WC).
      Add column headings if you like, then press Compare.
    </p>
  )
}

const ChatMsgs = ({ messages }: { messages: AppTypes.CoverageComparisonChatMessage[] }) => (
  <>
    {messages.map((message, i) => (
      <ChatMsg
        key={i}
        message={message} />
    ))}
  </>
)

const ChatMsg = ({ message }: { message: AppTypes.CoverageComparisonChatMessage }) => {
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
