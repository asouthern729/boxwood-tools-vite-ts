import { useState } from "react"
import trashIcon from "@assets/icons/trash/trash.svg"
import { useHandleChatScrolling } from "@utils/hooks"
import { useDownloadCoverageGapFile, useDownloadCoverageGapPdf, useDeleteCoverageGapAnalysis, usePreviewCoverageGapFile, useHandleChatPanel, useHandleAnalysisList, useHandleAnalysisSection, useHandleConfirmButton, useAnnounceReadErrors, announceReading } from "./hooks"
import { AVAILABLE_MCP_TOOLS, ACCEPTED_FILES, MAX_NOTES_LENGTH, ANALYSIS_ORDER_OPTIONS, clientName, filterAnalyses, formatTimestamp, countsSummary, profileSummary } from "./utils"
import { isToday } from "@components/commercial/context/utils"

// Types
import type * as AppTypes from "@context/App/types"
import type { CoverageGapChat, GapFiles, StagedFile } from "./hooks"

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
  chat: CoverageGapChat
  staged: GapFiles
}

export const ChatPanel = ({ chat, staged }: ChatPanelProps) => {
  const { messagesRef, send, run, canRun, draft, setDraft } = useHandleChatPanel(chat, staged)
  useHandleChatScrolling(messagesRef, chat.messages, chat.isPending)
  useAnnounceReadErrors(staged.files, chat.announce)

  const addFiles = (files: File[], rejected: string[]) => {
    staged.addFiles(files, rejected)
    if(files.length > 0) chat.announce(announceReading(files.map((file) => file.name)))
  }

  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body gap-3">
        <ChatHeader />

        <AvailableTools tools={AVAILABLE_MCP_TOOLS} />

        <div className="grid gap-3 md:grid-cols-2">
          <PolicyZone
            files={staged.files}
            onFiles={addFiles}
            onRemove={staged.remove} />
          <AccountNotes
            value={staged.notes}
            onChange={staged.setNotes} />
        </div>

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
            placeholder="Ask about the policies or a finished gap analysis, or press Run…" />
          <div className="flex flex-col gap-2 sm:w-32 sm:self-end">
            <NewChatButton
              disabled={!chat.canStartNewChat}
              onClick={chat.newChat} />
            <SendButton
              draft={staged.busy ? "" : draft}
              isPending={chat.isPending}
              onClick={send} />
          </div>
          <RunButton
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

type RunButtonProps = {
  visible: boolean
  disabled: boolean
  staged: GapFiles
  onClick: () => void
}

const runButtonState = (staged: GapFiles) => {
  if(staged.busy) return { label: "Reading files…", title: "Waiting for the files to finish reading" }
  if(!staged.hasRead) return { label: "Run", title: "Add at least one policy file first" }
  return { label: "Run", title: "Run the gap analysis on these policies, with the account notes" }
}

const RunButton = ({ visible, disabled, staged, onClick }: RunButtonProps) => {
  if(!visible) return null

  const { label, title } = runButtonState(staged)

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

type PolicyZoneProps = {
  files: StagedFile[]
  onFiles: (files: File[], rejected: string[]) => void
  onRemove: (key: string) => void
}

const PolicyZone = ({ files, onFiles, onRemove }: PolicyZoneProps) => (
  <PdfDropZone
    variant="area"
    onFiles={onFiles}
    accept={ACCEPTED_FILES}
    title="Drop the account's policy files here"
    className="flex min-h-28 flex-col gap-2 rounded-box border-2 border-dashed border-base-300 p-3">
      <div className="flex items-start gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Policies</span>
          <span className="text-xs text-base-content/60">Every policy on the account: dec pages, forms and endorsements</span>
        </div>
      </div>
      <EmptyZoneMsg visible={files.length === 0} />
      <ul className="flex flex-col gap-1.5">
        {files.map((file) => (
          <FileChip
            key={file.key}
            file={file}
            onRemove={onRemove} />
        ))}
      </ul>
      <UploadControls
        onFiles={onFiles}
        accept={ACCEPTED_FILES}
        title="Choose policy files"
        className="mt-auto" />
  </PdfDropZone>
)

const AccountNotes = ({ value, onChange }: { value: string, onChange: (value: string) => void }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-sm font-semibold">Account notes (optional)</span>
    <span className="text-xs text-base-content/60">
      Anything the policies won't show: revenue, payroll, employee count, operations, contract requirements,
      what the client told you. Used as exposure info; cited as "Staff notes" in the report.
    </span>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={MAX_NOTES_LENGTH}
      rows={4}
      placeholder="e.g. ~$4.2M revenue, $1.1M payroll, 18 employees. GC contracts require $2M/$4M GL and a $5M umbrella. Client mentioned adding a second location in spring."
      className="textarea textarea-bordered min-h-28 w-full flex-1 text-sm placeholder:italic" />
    <NotesLength length={value.length} />
  </label>
)

// Only shows once the notes get close to the limit
const NotesLength = ({ length }: { length: number }) => {
  if(length < MAX_NOTES_LENGTH * 0.8) return null

  return (
    <span className="self-end text-xs text-base-content/50">{length} / {MAX_NOTES_LENGTH}</span>
  )
}

const EmptyZoneMsg = ({ visible }: { visible: boolean }) => {
  if(!visible) return null

  return (
    <p className="m-auto text-xs text-base-content/40 italic">Drop files here</p>
  )
}

type FileChipProps = {
  file: StagedFile
  onRemove: (key: string) => void
}

const FileChip = ({ file, onRemove }: FileChipProps) => {
  const isError = file.status === "error"
  const chipStyle = isError ?
    "bg-error/10 text-error" :
    "bg-base-200"

  return (
    <li title={file.error ?? file.filename} className={`flex flex-col gap-0.5 rounded-sm px-2 py-1 text-sm ${ chipStyle }`}>
      <div className="flex items-center gap-1.5">
        <ChipStatus file={file} />
        <span className={isError ? "flex-1" : "min-w-0 flex-1 truncate"}>{isError && file.error ? file.error : file.filename}</span>
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

const ChipStatus = ({ file }: { file: StagedFile }) => {
  if(file.status === "done") return <span className="text-success/70">✓</span>
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

type AnalysisListProps = {
  manifest: AppTypes.CoverageGapManifest
  scope: AppTypes.CoverageGapScope
  onScopeChange: (scope: AppTypes.CoverageGapScope) => void
  scrollSignal: number
}

export const AnalysisList = ({ manifest, scope, onScopeChange, scrollSignal }: AnalysisListProps) => {
  const { rowRefs, highlightedId } = useHandleAnalysisList(manifest.groups, scrollSignal)
  const [searchQuery, setSearchQuery] = useState("")
  const [order, setOrder] = useState(ANALYSIS_ORDER_OPTIONS[0].value)

  const visibleGroups = filterAnalyses(manifest.groups, searchQuery)

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
          <AnalysisSection
            key={group.prepared_by ?? "__unattributed__"}
            group={group}
            scope={scope}
            order={order}
            viewerSub={manifest.viewer_sub}
            rowRefs={rowRefs.current}
            highlightedId={highlightedId} />
        ))}
      </div>
      <DownloadOdometer tool="coverage-gap" />
    </>
  )
}

type ListControlsProps = {
  order: string
  setOrder: (value: string) => void
  searchQuery: string
  setSearchQuery: (value: string) => void
  scope: AppTypes.CoverageGapScope
  onScopeChange: (scope: AppTypes.CoverageGapScope) => void
}

const ListControls = ({ order, setOrder, searchQuery, setSearchQuery, scope, onScopeChange }: ListControlsProps) => (
  <div className="flex flex-col items-center gap-4 sm:grid sm:grid-cols-[1fr_auto_1fr]">
    <div className="self-start sm:justify-self-start">
      <Ordering
        value={order}
        onChange={setOrder}
        options={ANALYSIS_ORDER_OPTIONS} />
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
  scope: AppTypes.CoverageGapScope
  searchQuery: string
}

const NoVisibleGroupsMsg = ({ visible, scope, searchQuery }: NoVisibleGroupsMsgProps) => {
  if(!visible) return null

  const msg = searchQuery.trim() ?
    `No gap analyses match "${ searchQuery.trim() }".` :
    scope === "mine" ?
    "You haven't run any gap analyses yet." :
    "No gap analyses have been run yet."

  return (
    <p className="py-8 text-center text-base-content/70">{msg}</p>
  )
}

const ScopeToggle = ({ scope, onChange }: { scope: AppTypes.CoverageGapScope, onChange: (scope: AppTypes.CoverageGapScope) => void }) => (
  <div className="join">
    <ScopeBtn
      label="My Analyses"
      active={scope === "mine"}
      onClick={() => onChange("mine")} />
    <ScopeBtn
      label="All Analyses"
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

type AnalysisSectionProps = {
  group: AppTypes.CoverageGapGroup
  scope: AppTypes.CoverageGapScope
  order: string
  viewerSub: string
  rowRefs: Map<string, HTMLLIElement>
  highlightedId: string | null
}

const AnalysisSection = ({ group, scope, order, viewerSub, rowRefs, highlightedId }: AnalysisSectionProps) => {
  const { pageAnalyses, currentPage, totalItems, setPage, sectionRef } = useHandleAnalysisSection(group.analyses, order)

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
          {pageAnalyses.map((analysis) => (
            <AnalysisRow
              key={analysis.id}
              analysis={analysis}
              canDelete={analysis.created_by.sub === viewerSub}
              rowRefs={rowRefs}
              highlighted={analysis.id === highlightedId} />
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

type AnalysisRowProps = {
  analysis: AppTypes.CoverageGapEntry
  canDelete: boolean
  rowRefs: Map<string, HTMLLIElement>
  highlighted: boolean
}

const AnalysisRow = ({ analysis, canDelete, rowRefs, highlighted }: AnalysisRowProps) => {
  const { mutate: deleteAnalysis, isPending: isDeleting, error: deleteError } = useDeleteCoverageGapAnalysis()

  return (
    <li
      ref={(el) => {
        if(el) rowRefs.set(analysis.id, el)
        else rowRefs.delete(analysis.id)
      }}
      className={`flex flex-col gap-3 px-4 py-3 transition-colors duration-1000 sm:flex-row sm:items-center ${ highlighted ? "bg-base-200" : "" }`}>
      <AnalysisRowDetails
        analysis={analysis}
        deleteError={deleteError} />
      <div className="flex flex-col items-center gap-2 sm:items-end">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap">
          <DeleteButton
            visible={canDelete}
            running={analysis.status === "running"}
            isPending={isDeleting}
            onConfirm={() => deleteAnalysis(analysis.id, { onSuccess: () => toastDeleted(clientName(analysis)) })} />
          <AnalysisActions analysis={analysis} />
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-base-content/50 italic sm:justify-end">
          <CreatedAt analysis={analysis} />
        </div>
      </div>
    </li>
  )
}

const AnalysisActions = ({ analysis }: { analysis: AppTypes.CoverageGapEntry }) => {
  if(analysis.status === "running") return (
    <span className="flex items-center gap-2 text-sm text-base-content/70">
      <span className="loading loading-spinner loading-sm text-accent" />
      Reviewing…
    </span>
  )

  if(analysis.status === "failed" || !analysis.filename) return (
    <span className="badge badge-soft badge-error badge-sm rounded-sm">Failed</span>
  )

  return <ReportButtons analysis={analysis} filename={analysis.filename} />
}

const ReportButtons = ({ analysis, filename }: { analysis: AppTypes.CoverageGapEntry, filename: string }) => {
  const { mutate: downloadFile, isPending: isDownloading } = useDownloadCoverageGapFile()
  const { mutate: downloadPdf, isPending: isDownloadingPdf, error: pdfError } = useDownloadCoverageGapPdf()
  const preview = usePreviewCoverageGapFile(filename)

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
        title={clientName(analysis)}
        open={preview.open}
        onClose={preview.hide}
        fetchBlob={preview.fetchBlob} />
    </>
  )
}

const AnalysisRowDetails = ({ analysis, deleteError }: { analysis: AppTypes.CoverageGapEntry, deleteError: Error | null }) => (
  <div className="flex w-full min-w-0 flex-col sm:w-auto sm:flex-1">
    <span className="font-semibold">{clientName(analysis)}</span>
    <RunningMsg visible={analysis.status === "running"} />
    <FailedMsg analysis={analysis} />
    <Findings analysis={analysis} />
    <NotesBadge visible={analysis.has_notes} notes={analysis.notes} />
    <SourceList sources={analysis.sources} />
    {deleteError && <span className="text-sm text-error">{deleteError.message}</span>}
  </div>
)

const RunningMsg = ({ visible }: { visible: boolean }) => {
  if(!visible) return null

  return (
    <span className="text-sm text-base-content/60">Running in the background — usually a few minutes. You can leave this page.</span>
  )
}

const FailedMsg = ({ analysis }: { analysis: AppTypes.CoverageGapEntry }) => {
  if(analysis.status !== "failed") return null

  return (
    <span className="text-sm text-error">{analysis.error ?? "The gap analysis didn't finish."} Try running it again.</span>
  )
}

// e.g. "4 policies · 6 gaps · 3 to confirm · 2 High priority"
const Findings = ({ analysis }: { analysis: AppTypes.CoverageGapEntry }) => {
  if(analysis.status !== "done") return null

  const summary = countsSummary(analysis)
  const high = analysis.counts?.high ?? 0
  if(!summary && high === 0) return null

  return (
    <span className="text-sm text-base-content/70">
      {summary}
      {high > 0 && <span className="font-semibold text-error">{summary ? " · " : ""}{high} High priority</span>}
    </span>
  )
}

// The notes themselves only come back to the person who ran it; everyone else just sees that there were some
const NotesBadge = ({ visible, notes }: { visible: boolean, notes?: string }) => {
  if(!visible) return null

  return (
    <span title={notes ?? "Run with account notes"} className="text-xs text-base-content/50 italic">Includes account notes</span>
  )
}

const SourceList = ({ sources }: { sources: AppTypes.CoverageGapEntry["sources"] }) => {
  if(sources.length === 0) return null

  return (
    <ul className="mt-1 flex flex-wrap gap-1.5">
      {sources.map((source) => (
        <li key={source.id} title={source.filename} className="badge badge-ghost badge-sm max-w-56 gap-1 rounded-sm">
          <span className="truncate">{source.filename}</span>
        </li>
      ))}
    </ul>
  )
}

const PreviewButton = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick} className="btn btn-ghost btn-sm hover:bg-secondary hover:text-white">
    Preview
  </button>
)

const CreatedAt = ({ analysis }: { analysis: AppTypes.CoverageGapEntry }) => {
  if(isToday(analysis.generated_at)) return (
    <span title={formatTimestamp(analysis.generated_at)} className="badge badge-success dark:badge-outline badge-sm cursor-default rounded-sm not-italic">
      Created Today
    </span>
  )

  return (
    <div>Created {formatTimestamp(analysis.generated_at)}</div>
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

  const idleTitle = running ? "Cancel and delete this gap analysis" : "Delete this gap analysis"

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
      className="btn btn-neutral btn-sm hover:bg-secondary hover:text-white">
        {btnContent}
    </button>
  )
}

const ChatTip = ({ visible }: { visible: boolean }) => {
  if(!visible) return null

  return (
    <p className="text-sm text-base-content/60">
      Drop every policy on the account (BOP, auto, WC, umbrella, and so on), add any account notes,
      then press Run. Ask me about the files or a finished analysis here.
    </p>
  )
}

const ChatMsgs = ({ messages }: { messages: AppTypes.CoverageGapChatMessage[] }) => (
  <>
    {messages.map((message, i) => (
      <ChatMsg
        key={i}
        message={message} />
    ))}
  </>
)

const ChatMsg = ({ message }: { message: AppTypes.CoverageGapChatMessage }) => {
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
