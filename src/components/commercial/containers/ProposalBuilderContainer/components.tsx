import { useState } from "react"
import trashIcon from "@assets/icons/trash/trash.svg"
import { useHandleChatScrolling } from "@utils/hooks"
import { useDownloadProposalFile, useDownloadProposalPdf, useDeleteProposalFile, usePreviewProposalFile, useHandleChatPanel, useHandleProposalList, useHandleProposalSection, useHandleConfirmButton, useProposalAttachments, useAnnounceReadErrors, announceReading } from "./hooks"
import { AVAILABLE_MCP_TOOLS, ACCEPTED_FILES, PROPOSAL_ORDER_OPTIONS, SOURCE_LABELS, filterProposals, formatTimestamp } from "./utils"
import { isToday, isUpdatedToday, updatedTooltip } from "@components/commercial/context/utils"

// Types
import type * as AppTypes from "@context/App/types"

// Components
import ChatHeader from "@components/team/utils/ChatHeader"
import ClaudeDisclaimer from "@components/team/utils/ClaudeDisclaimer"
import DocxPreviewModal from "@components/team/utils/DocxPreviewModal"
import ChatMessageText from "@components/team/utils/ChatMessageText"
import Ordering from "@components/team/utils/Ordering"
import CustomerSearch from "@components/team/utils/CustomerSearch"
import Pagination from "@components/team/utils/Pagination"
import FooterMessage from "@components/team/utils/FooterMessage"
import DownloadOdometer from "@components/team/utils/DownloadOdometer"
import SendButton from "@components/team/utils/SendButton"
import ChatInput from "@components/team/utils/ChatInput"
import AvailableTools from "@components/team/utils/AvailableTools"

type ChatPanelProps = {
  messages: AppTypes.ProposalChatMessage[]
  onSend: (message: string, attachmentIds: string[], attachedNames: string[], shown?: string) => void
  onAnnounce: (text: string) => void
  isPending: boolean
}

export const ChatPanel = ({ messages, onSend, onAnnounce, isPending }: ChatPanelProps) => {
  const staged = useProposalAttachments()
  const { messagesRef, send, build, canBuild, draft, setDraft } = useHandleChatPanel(onSend, staged, isPending)
  useHandleChatScrolling(messagesRef, messages, isPending)
  useAnnounceReadErrors(staged.attachments, onAnnounce)

  const addFiles = (files: File[], rejected: string[]) => {
    staged.addFiles(files, rejected)
    if(files.length > 0) onAnnounce(announceReading(files.map((file) => file.name)))
  }

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
            placeholder="Drop quotes or AMS360 proposals here, add any notes, then press Build proposal…"
            onFiles={addFiles}
            accept={ACCEPTED_FILES}
            attachments={staged.attachments}
            onRemoveAttachment={staged.remove} />
          <SendButton
            draft={staged.uploading ? "" : draft}
            isPending={isPending}
            onClick={send} />
          <BuildButton
            visible={staged.attachments.length > 0}
            disabled={!canBuild}
            reading={!staged.allRead}
            onClick={build} />
        </div>

        <ClaudeDisclaimer />
      </div>
    </div>
  )
}

type BuildButtonProps = {
  visible: boolean
  disabled: boolean
  reading: boolean
  onClick: () => void
}

const BuildButton = ({ visible, disabled, reading, onClick }: BuildButtonProps) => {
  if(!visible) return null

  const title = reading ?
    "Waiting for the files to finish reading" :
    "Build the proposal from these files, using anything typed as guidance"

  const btnContent = reading ? "Reading files…" : "Build proposal"

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className="btn btn-accent w-full self-end sm:w-auto">
        {btnContent}
    </button>
  )
}

type ProposalListProps = {
  manifest: AppTypes.ProposalManifest
  scope: AppTypes.ProposalScope
  onScopeChange: (scope: AppTypes.ProposalScope) => void
  scrollSignal: number
}

export const ProposalList = ({ manifest, scope, onScopeChange, scrollSignal }: ProposalListProps) => {
  const { rowRefs, highlightedFilename, footerMessage, notify } = useHandleProposalList(manifest.groups, scrollSignal)
  const [searchQuery, setSearchQuery] = useState("")
  const [order, setOrder] = useState(PROPOSAL_ORDER_OPTIONS[0].value)

  const visibleGroups = filterProposals(manifest.groups, searchQuery)

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
          <ProposalSection
            key={group.prepared_by ?? "__unattributed__"}
            group={group}
            scope={scope}
            order={order}
            viewerSub={manifest.viewer_sub}
            rowRefs={rowRefs.current}
            highlightedFilename={highlightedFilename}
            onNotify={notify} />
        ))}
      </div>
      <DownloadOdometer tool="proposal-builder" />
      <FooterMessage message={footerMessage?.text ?? null} error={footerMessage?.error} />
    </>
  )
}

type ListControlsProps = {
  order: string
  setOrder: (value: string) => void
  searchQuery: string
  setSearchQuery: (value: string) => void
  scope: AppTypes.ProposalScope
  onScopeChange: (scope: AppTypes.ProposalScope) => void
}

const ListControls = ({ order, setOrder, searchQuery, setSearchQuery, scope, onScopeChange }: ListControlsProps) => (
  <div className="flex flex-col items-center gap-4 sm:grid sm:grid-cols-[1fr_auto_1fr]">
    <div className="self-start sm:justify-self-start">
      <Ordering
        value={order}
        onChange={setOrder}
        options={PROPOSAL_ORDER_OPTIONS} />
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
  scope: AppTypes.ProposalScope
  searchQuery: string
}

const NoVisibleGroupsMsg = ({ visible, scope, searchQuery }: NoVisibleGroupsMsgProps) => {
  if(!visible) return null

  const msg = searchQuery.trim() ?
    `No proposals match "${ searchQuery.trim() }".` :
    scope === "mine" ?
    "You haven't built any proposals yet." :
    "No proposals have been built yet."

  return (
    <p className="py-8 text-center text-base-content/70">{msg}</p>
  )
}

const ScopeToggle = ({ scope, onChange }: { scope: AppTypes.ProposalScope, onChange: (scope: AppTypes.ProposalScope) => void }) => (
  <div className="join">
    <ScopeBtn
      label="My Proposals"
      active={scope === "mine"}
      onClick={() => onChange("mine")} />
    <ScopeBtn
      label="All Proposals"
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

type ProposalSectionProps = {
  group: AppTypes.ProposalGroup
  scope: AppTypes.ProposalScope
  order: string
  viewerSub: string
  rowRefs: Map<string, HTMLLIElement>
  highlightedFilename: string | null
  onNotify: (message: string, error?: boolean) => void
}

const ProposalSection = ({ group, scope, order, viewerSub, rowRefs, highlightedFilename, onNotify }: ProposalSectionProps) => {
  const { pageProposals, currentPage, totalItems, setPage, sectionRef } = useHandleProposalSection(group.proposals, order)

  const title = scope === "mine" ?
    "Created By Me" :
    group.prepared_by ?? "No Prepared By Name"

  return (
    <div ref={sectionRef} className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body gap-1 p-0 py-2">
        <h3 className="px-4 pt-1 text-sm font-semibold text-primary">{title}</h3>
        <ul className="divide-y divide-base-300">
          {pageProposals.map((proposal) => (
            <ProposalRow
              key={proposal.filename}
              proposal={proposal}
              canDelete={proposal.created_by.sub === viewerSub}
              rowRefs={rowRefs}
              highlighted={proposal.filename === highlightedFilename}
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

type ProposalRowProps = {
  proposal: AppTypes.ProposalManifestEntry
  canDelete: boolean
  rowRefs: Map<string, HTMLLIElement>
  highlighted: boolean
  onNotify: (message: string, error?: boolean) => void
}

const ProposalRow = ({ proposal, canDelete, rowRefs, highlighted, onNotify }: ProposalRowProps) => {
  const { mutate: downloadFile, isPending: isDownloading } = useDownloadProposalFile()
  const { mutate: downloadPdf, isPending: isDownloadingPdf, error: pdfError } = useDownloadProposalPdf()
  const { mutate: deleteFile, isPending: isDeleting, error: deleteError } = useDeleteProposalFile()
  const preview = usePreviewProposalFile(proposal.filename)

  return (
    <li
      ref={(el) => {
        if(el) rowRefs.set(proposal.filename, el)
        else rowRefs.delete(proposal.filename)
      }}
      className={`flex flex-col gap-3 px-4 py-3 transition-colors duration-1000 sm:flex-row sm:items-center ${ highlighted ? "bg-base-200" : "" }`}>
      <ProposalRowDetails
        proposal={proposal}
        errors={[deleteError, pdfError]} />
      <div className="flex flex-col items-center gap-2 sm:items-end">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap">
          <DeleteButton
            visible={canDelete}
            isPending={isDeleting}
            onConfirm={() => deleteFile(proposal.filename, { onSuccess: () => onNotify(`Deleted ${ proposal.client_name }...`) })} />
          <PreviewButton onClick={preview.show} />
          <DownloadButton
            label="Word"
            title="Download as Word (.docx)"
            isPending={isDownloading}
            onClick={() => downloadFile(proposal.filename)} />
          <DownloadButton
            label="PDF"
            title="Download as PDF"
            isPending={isDownloadingPdf}
            onClick={() => downloadPdf(proposal.filename)} />
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-base-content/50 italic sm:justify-end">
          <CreatedAt proposal={proposal} />
        </div>
      </div>
      <DocxPreviewModal
        title={proposal.client_name}
        open={preview.open}
        onClose={preview.hide}
        fetchBlob={preview.fetchBlob} />
    </li>
  )
}

const ProposalRowDetails = ({ proposal, errors }: { proposal: AppTypes.ProposalManifestEntry, errors: (Error | null)[] }) => (
  <div className="flex w-full min-w-0 flex-col sm:w-auto sm:flex-1">
    <span className="font-semibold">{proposal.client_name}</span>
    <SectionList sections={proposal.sections} />
    <SourceList sources={proposal.sources} />
    {errors.map((error, i) => error && <span key={i} className="text-sm text-error">{error.message}</span>)}
  </div>
)

const PreviewButton = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick} className="btn btn-ghost btn-sm hover:bg-secondary">
    Preview
  </button>
)

const SectionList = ({ sections }: { sections: AppTypes.ProposalManifestEntry["sections"] }) => {
  if(sections.length === 0) return null

  return (
    <ul className="mt-1 flex flex-wrap gap-x-3 text-sm text-base-content/70">
      {sections.map((section, i) => (
        <SectionItem
          key={`${ section.title }-${ i }`}
          section={section} />
      ))}
    </ul>
  )
}

const SectionItem = ({ section }: { section: AppTypes.ProposalManifestEntry["sections"][number] }) => {
  const sourceLabel = section.source === "quote" ?
    "From a carrier quote" :
    "From an AMS360 proposal"

  return (
    <li title={section.source_file ?? sourceLabel}>
      {section.title}
      <SectionCarrier carrier={section.carrier} />
    </li>
  )
}

const SectionCarrier = ({ carrier }: { carrier: string | null }) => {
  if(!carrier) return null

  return (
    <span className="text-base-content/40"> · {carrier}</span>
  )
}

const SourceList = ({ sources }: { sources: AppTypes.ProposalManifestEntry["sources"] }) => {
  if(sources.length === 0) return null

  return (
    <ul className="mt-1 flex flex-wrap gap-1.5">
      {sources.map((source) => (
        <SourceBadge
          key={source.id}
          source={source} />
      ))}
    </ul>
  )
}

const SourceBadge = ({ source }: { source: AppTypes.ProposalManifestEntry["sources"][number] }) => (
  <li title={source.filename} className="badge badge-ghost badge-sm max-w-56 gap-1 rounded-sm">
    <span className="font-semibold">{SOURCE_LABELS[source.kind]}</span>
    <span className="truncate">{source.filename}</span>
  </li>
)

const CreatedAt = ({ proposal }: { proposal: AppTypes.ProposalManifestEntry }) => {
  if(isUpdatedToday(proposal)) return (
    <span title={updatedTooltip(proposal, formatTimestamp(proposal.last_refreshed_at))} className="badge badge-info dark:badge-outline badge-sm cursor-default rounded-sm not-italic">
      Updated Today
    </span>
  )

  if(isToday(proposal.generated_at)) return (
    <span title={formatTimestamp(proposal.generated_at)} className="badge badge-success dark:badge-outline badge-sm cursor-default rounded-sm not-italic">
      Created Today
    </span>
  )

  if(proposal.last_refreshed_at) return (
    <div title={updatedTooltip(proposal, formatTimestamp(proposal.last_refreshed_at))}>
      Updated {formatTimestamp(proposal.last_refreshed_at)}
    </div>
  )

  return (
    <div>Created {formatTimestamp(proposal.generated_at)}</div>
  )
}

type DeleteButtonProps = {
  visible: boolean
  isPending: boolean
  onConfirm: () => void
}

const DeleteButton = ({ visible, isPending, onConfirm }: DeleteButtonProps) => {
  const { armed, handleClick } = useHandleConfirmButton(onConfirm)

  if(!visible) return null

  const btnContent = isPending ?
    <span className="loading loading-spinner loading-xs" /> :
    <img src={trashIcon} alt="Delete" className="size-4" />

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      title={armed ? "Click again to permanently delete" : "Delete this proposal"}
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
      Drop carrier quote PDFs or an AMS360 proposal (.docx or PDF) onto the message box, then ask
      Claude to build the proposal — e.g. "Build a proposal for Acme Corp from these quotes."
    </p>
  )
}

const ChatMsgs = ({ messages }: { messages: AppTypes.ProposalChatMessage[] }) => (
  <>
    {messages.map((message, i) => (
      <ChatMsg
        key={i}
        message={message} />
    ))}
  </>
)

const ChatMsg = ({ message }: { message: AppTypes.ProposalChatMessage }) => {
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
