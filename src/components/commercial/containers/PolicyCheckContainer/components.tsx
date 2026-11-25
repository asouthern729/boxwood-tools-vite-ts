import { useState } from "react"
import trashIcon from "@assets/icons/trash/trash.svg"
import { useHandleChatScrolling } from "@utils/hooks"
import { useDownloadPolicyCheckFile, useDownloadPolicyCheckPdf, useDeletePolicyCheck, usePreviewPolicyCheckFile, useHandleChatPanel, useHandleCheckList, useHandleCheckSection, useHandleConfirmButton, useAnnounceReadErrors, announceReading } from "./hooks"
import { AVAILABLE_MCP_TOOLS, ACCEPTED_FILES, ROLE_ZONES, ROLE_LABELS, DOCUMENT_TYPE_LABELS, MODE_LABELS, BANNER_CLASSES, CHECK_ORDER_OPTIONS, clientName, filterChecks, formatTimestamp, formatMoney, formatPremiumChange, profileSummary } from "./utils"
import { isToday } from "@components/commercial/context/utils"

// Types
import type * as AppTypes from "@context/App/types"
import type { PolicyCheckChat, PolicyCheckFiles, StagedFile } from "./hooks"

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
  chat: PolicyCheckChat
  staged: PolicyCheckFiles
}

export const ChatPanel = ({ chat, staged }: ChatPanelProps) => {
  const { messagesRef, send, run, canRun, draft, setDraft } = useHandleChatPanel(chat, staged)
  useHandleChatScrolling(messagesRef, chat.messages, chat.isPending)
  useAnnounceReadErrors(staged.files, chat.announce)

  const addFiles = (role: AppTypes.PolicyCheckRole, files: File[], rejected: string[]) => {
    staged.addFiles(role, files, rejected)
    if(files.length > 0) chat.announce(announceReading(files.map((file) => file.name)))
  }

  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body gap-3">
        <ChatHeader />

        <AvailableTools tools={AVAILABLE_MCP_TOOLS} />

        <RoleZones
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
            placeholder="Ask about the files or a finished check, or add notes for the check, then press Check…" />
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
  staged: PolicyCheckFiles
  onClick: () => void
}

const runButtonState = (staged: PolicyCheckFiles) => {
  if(staged.busy) return { label: "Reading files…", title: "Waiting for the files to finish reading" }
  if(!staged.hasRead("baseline")) return { label: "Check", title: "Add the quote, binder or expiring policy first" }
  if(!staged.hasRead("compared")) return { label: "Check", title: "Add the issued or renewal policy first" }
  return { label: "Check", title: "Check these files, using anything typed as notes for the check" }
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

type RoleZonesProps = {
  staged: PolicyCheckFiles
  onFiles: (role: AppTypes.PolicyCheckRole, files: File[], rejected: string[]) => void
}

const RoleZones = ({ staged, onFiles }: RoleZonesProps) => (
  <div className="grid gap-3 md:grid-cols-3">
    {ROLE_ZONES.map((zone) => (
      <RoleZone
        key={zone.role}
        zone={zone}
        files={staged.files.filter((f) => f.role === zone.role)}
        onFiles={(files, rejected) => onFiles(zone.role, files, rejected)}
        onRemove={staged.remove}
        onMove={staged.move} />
    ))}
  </div>
)

type RoleZoneProps = {
  zone: typeof ROLE_ZONES[number]
  files: StagedFile[]
  onFiles: (files: File[], rejected: string[]) => void
  onRemove: (key: string) => void
  onMove: (key: string, role: AppTypes.PolicyCheckRole) => void
}

const RoleZone = ({ zone, files, onFiles, onRemove, onMove }: RoleZoneProps) => (
  <PdfDropZone
    variant="area"
    onFiles={onFiles}
    accept={ACCEPTED_FILES}
    title={`Drop files here: ${ zone.hint }`}
    className="flex min-h-28 flex-col gap-2 rounded-box border-2 border-dashed border-base-300 p-3">
      <div className="flex items-start gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{zone.label}</span>
          <span className="text-xs text-base-content/60">{zone.hint}{zone.optional ? " · optional" : ""}</span>
        </div>
      </div>
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
        title={`Choose files for "${ zone.label }"`}
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
  onMove: (key: string, role: AppTypes.PolicyCheckRole) => void
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
        <button
          type="button"
          aria-label={`Remove ${ file.filename }`}
          onClick={() => onRemove(file.key)}
          className="cursor-pointer opacity-60 hover:opacity-100">
            ✕
        </button>
      </div>
      <ChipProfile profile={file.profile} />
      <RoleHint
        file={file}
        onMove={onMove} />
    </li>
  )
}

const ChipStatus = ({ file }: { file: StagedFile }) => {
  if(file.status === "done" && !file.moving) return <span className="text-success/70">✓</span>
  if(file.status === "error") return <span>!</span>

  return <span className="loading loading-spinner loading-xs text-base-content/90" />
}

const ChipProfile = ({ profile }: { profile?: AppTypes.PolicyCheckProfile }) => {
  if(!profile) return null

  const summary = profileSummary(profile)
  const type = profile.document_type ? DOCUMENT_TYPE_LABELS[profile.document_type] : null
  if(!summary && !type) return null

  return (
    <span className="truncate pl-5 text-xs text-base-content/60">
      {[type && type[0].toUpperCase() + type.slice(1), summary].filter(Boolean).join(" · ")}
    </span>
  )
}

// A soft nudge when the reader thinks the file belongs in another zone; staff can ignore it
const RoleHint = ({ file, onMove }: { file: StagedFile, onMove: (key: string, role: AppTypes.PolicyCheckRole) => void }) => {
  const suggested = file.profile?.suggested_role
  if(file.status !== "done" || file.moving || !suggested || suggested === file.role) return null

  const looksLike = file.profile?.document_type ? DOCUMENT_TYPE_LABELS[file.profile.document_type] : ROLE_LABELS[suggested].toLowerCase()
  const target = ROLE_ZONES.find((zone) => zone.role === suggested)?.label ?? ROLE_LABELS[suggested]

  return (
    <div className="flex flex-wrap items-center gap-1 pl-5 text-xs text-warning">
      <span>Looks like {/^[aeiou]/i.test(looksLike) ? "an" : "a"} {looksLike}.</span>
      <button
        type="button"
        title={`Move to "${ target }"`}
        onClick={() => onMove(file.key, suggested)}
        className="link link-hover font-semibold">
          Move it?
      </button>
    </div>
  )
}

type CheckListProps = {
  manifest: AppTypes.PolicyCheckManifest
  scope: AppTypes.PolicyCheckScope
  onScopeChange: (scope: AppTypes.PolicyCheckScope) => void
  scrollSignal: number
}

export const CheckList = ({ manifest, scope, onScopeChange, scrollSignal }: CheckListProps) => {
  const { rowRefs, highlightedId } = useHandleCheckList(manifest.groups, scrollSignal)
  const [searchQuery, setSearchQuery] = useState("")
  const [order, setOrder] = useState(CHECK_ORDER_OPTIONS[0].value)

  const visibleGroups = filterChecks(manifest.groups, searchQuery)

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
          <CheckSection
            key={group.prepared_by ?? "__unattributed__"}
            group={group}
            scope={scope}
            order={order}
            viewerSub={manifest.viewer_sub}
            rowRefs={rowRefs.current}
            highlightedId={highlightedId} />
        ))}
      </div>
      <DownloadOdometer tool="policy-check" />
    </>
  )
}

type ListControlsProps = {
  order: string
  setOrder: (value: string) => void
  searchQuery: string
  setSearchQuery: (value: string) => void
  scope: AppTypes.PolicyCheckScope
  onScopeChange: (scope: AppTypes.PolicyCheckScope) => void
}

const ListControls = ({ order, setOrder, searchQuery, setSearchQuery, scope, onScopeChange }: ListControlsProps) => (
  <div className="flex flex-col items-center gap-4 sm:grid sm:grid-cols-[1fr_auto_1fr]">
    <div className="self-start sm:justify-self-start">
      <Ordering
        value={order}
        onChange={setOrder}
        options={CHECK_ORDER_OPTIONS} />
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
  scope: AppTypes.PolicyCheckScope
  searchQuery: string
}

const NoVisibleGroupsMsg = ({ visible, scope, searchQuery }: NoVisibleGroupsMsgProps) => {
  if(!visible) return null

  const msg = searchQuery.trim() ?
    `No checks match "${ searchQuery.trim() }".` :
    scope === "mine" ?
    "You haven't run any policy checks yet." :
    "No policy checks have been run yet."

  return (
    <p className="py-8 text-center text-base-content/70">{msg}</p>
  )
}

const ScopeToggle = ({ scope, onChange }: { scope: AppTypes.PolicyCheckScope, onChange: (scope: AppTypes.PolicyCheckScope) => void }) => (
  <div className="join">
    <ScopeBtn
      label="My Checks"
      active={scope === "mine"}
      onClick={() => onChange("mine")} />
    <ScopeBtn
      label="All Checks"
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

type CheckSectionProps = {
  group: AppTypes.PolicyCheckGroup
  scope: AppTypes.PolicyCheckScope
  order: string
  viewerSub: string
  rowRefs: Map<string, HTMLLIElement>
  highlightedId: string | null
}

const CheckSection = ({ group, scope, order, viewerSub, rowRefs, highlightedId }: CheckSectionProps) => {
  const { pageChecks, currentPage, totalItems, setPage, sectionRef } = useHandleCheckSection(group.checks, order)

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
          {pageChecks.map((check) => (
            <CheckRow
              key={check.id}
              check={check}
              canDelete={check.created_by.sub === viewerSub}
              rowRefs={rowRefs}
              highlighted={check.id === highlightedId} />
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

type CheckRowProps = {
  check: AppTypes.PolicyCheckEntry
  canDelete: boolean
  rowRefs: Map<string, HTMLLIElement>
  highlighted: boolean
}

const CheckRow = ({ check, canDelete, rowRefs, highlighted }: CheckRowProps) => {
  const { mutate: deleteCheck, isPending: isDeleting, error: deleteError } = useDeletePolicyCheck()

  return (
    <li
      ref={(el) => {
        if(el) rowRefs.set(check.id, el)
        else rowRefs.delete(check.id)
      }}
      className={`flex flex-col gap-3 px-4 py-3 transition-colors duration-1000 sm:flex-row sm:items-center ${ highlighted ? "bg-base-200" : "" }`}>
      <CheckRowDetails
        check={check}
        deleteError={deleteError} />
      <div className="flex flex-col items-center gap-2 sm:items-end">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap">
          <DeleteButton
            visible={canDelete}
            running={check.status === "running"}
            isPending={isDeleting}
            onConfirm={() => deleteCheck(check.id, { onSuccess: () => toastDeleted(clientName(check)) })} />
          <CheckActions check={check} />
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-base-content/50 italic sm:justify-end">
          <CreatedAt check={check} />
        </div>
      </div>
    </li>
  )
}

const CheckActions = ({ check }: { check: AppTypes.PolicyCheckEntry }) => {
  if(check.status === "running") return (
    <span className="flex items-center gap-2 text-sm text-base-content/70">
      <span className="loading loading-spinner loading-sm text-accent" />
      Checking…
    </span>
  )

  if(check.status === "failed" || !check.filename) return (
    <span className="badge badge-soft badge-error badge-sm rounded-sm">Failed</span>
  )

  return <ReportButtons check={check} filename={check.filename} />
}

const ReportButtons = ({ check, filename }: { check: AppTypes.PolicyCheckEntry, filename: string }) => {
  const { mutate: downloadFile, isPending: isDownloading } = useDownloadPolicyCheckFile()
  const { mutate: downloadPdf, isPending: isDownloadingPdf, error: pdfError } = useDownloadPolicyCheckPdf()
  const preview = usePreviewPolicyCheckFile(filename)

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
        title={clientName(check)}
        open={preview.open}
        onClose={preview.hide}
        fetchBlob={preview.fetchBlob} />
    </>
  )
}

const CheckRowDetails = ({ check, deleteError }: { check: AppTypes.PolicyCheckEntry, deleteError: Error | null }) => (
  <div className="flex w-full min-w-0 flex-col sm:w-auto sm:flex-1">
    <div className="flex flex-wrap items-center gap-x-2">
      <span className="font-semibold">{clientName(check)}</span>
      <ModeLabel mode={check.mode} />
    </div>
    <RunningMsg visible={check.status === "running"} />
    <FailedMsg check={check} />
    <Banner banner={check.status === "done" ? check.banner : undefined} />
    <Counts counts={check.status === "done" ? check.counts : undefined} />
    <PremiumChange premiumChange={check.status === "done" ? check.premium_change : undefined} />
    <SourceList sources={check.sources} />
    {deleteError && <span className="text-sm text-error">{deleteError.message}</span>}
  </div>
)

const ModeLabel = ({ mode }: { mode: AppTypes.PolicyCheckMode | null }) => {
  if(!mode) return null

  return (
    <span className="text-sm text-base-content/50">{MODE_LABELS[mode]}</span>
  )
}

const RunningMsg = ({ visible }: { visible: boolean }) => {
  if(!visible) return null

  return (
    <span className="text-sm text-base-content/60">Running in the background — usually 2–6 minutes. You can leave this page.</span>
  )
}

const FailedMsg = ({ check }: { check: AppTypes.PolicyCheckEntry }) => {
  if(check.status !== "failed") return null

  return (
    <span className="text-sm text-error">{check.error ?? "The check didn't finish."} Try running it again.</span>
  )
}

const Banner = ({ banner }: { banner?: AppTypes.PolicyCheckEntry["banner"] }) => {
  if(!banner) return null

  return (
    <span className={`badge badge-soft badge-sm mt-1 h-auto rounded-sm py-0.5 whitespace-normal ${ BANNER_CLASSES[banner.level] }`}>
      {banner.text}
    </span>
  )
}

const COUNT_ITEMS: { key: keyof NonNullable<AppTypes.PolicyCheckEntry["counts"]>, label: string, className: string }[] = [
  { key: "correction", label: "to correct", className: "text-error" },
  { key: "confirm", label: "to confirm", className: "text-warning" },
  { key: "housekeeping", label: "housekeeping", className: "text-base-content/70" },
  { key: "match", label: "match", className: "text-success" },
]

const Counts = ({ counts }: { counts?: AppTypes.PolicyCheckEntry["counts"] }) => {
  if(!counts) return null

  return (
    <ul className="mt-1 flex flex-wrap gap-x-3 text-sm">
      {COUNT_ITEMS.map(({ key, label, className }) => (
        <li key={key} className={counts[key] > 0 ? className : "text-base-content/40"}>
          <span className="font-semibold">{counts[key]}</span> {label}
        </li>
      ))}
    </ul>
  )
}

const PremiumChange = ({ premiumChange }: { premiumChange?: AppTypes.PolicyCheckEntry["premium_change"] }) => {
  if(!premiumChange) return null
  if(premiumChange.baseline == null && premiumChange.compared == null) return null

  const change = formatPremiumChange(premiumChange)

  return (
    <span className="text-sm text-base-content/70">
      Premium {formatMoney(premiumChange.baseline)} → {formatMoney(premiumChange.compared)}
      {change && <span className="text-base-content/50"> · {change}</span>}
    </span>
  )
}

const SourceList = ({ sources }: { sources: AppTypes.PolicyCheckEntry["sources"] }) => {
  if(sources.length === 0) return null

  return (
    <ul className="mt-1 flex flex-wrap gap-1.5">
      {sources.map((source) => (
        <li key={source.id} title={source.filename} className="badge badge-ghost badge-sm max-w-56 gap-1 rounded-sm">
          <span className="font-semibold">{ROLE_LABELS[source.role]}</span>
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

const CreatedAt = ({ check }: { check: AppTypes.PolicyCheckEntry }) => {
  if(isToday(check.generated_at)) return (
    <span title={formatTimestamp(check.generated_at)} className="badge badge-success dark:badge-outline badge-sm cursor-default rounded-sm not-italic">
      Run Today
    </span>
  )

  return (
    <div>Run {formatTimestamp(check.generated_at)}</div>
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

  const idleTitle = running ? "Cancel and delete this check" : "Delete this check"

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
      Drop the quote, binder or expiring policy in the first box and the issued or renewal policy in
      the second, plus any endorsements or references, then press Check. Ask Claude here about
      anything it flags — e.g. "Why is #3 flagged?"
    </p>
  )
}

const ChatMsgs = ({ messages }: { messages: AppTypes.PolicyCheckChatMessage[] }) => (
  <>
    {messages.map((message, i) => (
      <ChatMsg
        key={i}
        message={message} />
    ))}
  </>
)

const ChatMsg = ({ message }: { message: AppTypes.PolicyCheckChatMessage }) => {
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
