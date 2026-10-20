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

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={reading ? "Waiting for the files to finish reading" : "Build the proposal from these files, using anything typed as guidance"}
      className="btn btn-accent w-full self-end sm:w-auto">
        {reading ? "Reading files…" : "Build proposal"}
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
  const searching = searchQuery.trim() !== ""

  const emptyMsg = searching ?
    `No proposals match "${ searchQuery.trim() }".` :
    scope === "mine" ? "You haven't built any proposals yet." : "No proposals have been built yet."

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-4 sm:grid sm:grid-cols-[1fr_auto_1fr]">
          <div className="self-start sm:justify-self-start">
            <Ordering value={order} onChange={setOrder} options={PROPOSAL_ORDER_OPTIONS} />
          </div>
          <CustomerSearch value={searchQuery} onChange={setSearchQuery} />
          <div className="self-end sm:justify-self-end">
            <ScopeToggle scope={scope} onChange={onScopeChange} />
          </div>
        </div>
        {visibleGroups.length === 0 ? (
          <p className="py-8 text-center text-base-content/70">{emptyMsg}</p>
        ) : (
          visibleGroups.map((group) => (
            <ProposalSection
              key={group.prepared_by ?? "__unattributed__"}
              group={group}
              title={scope === "mine" ? "Created By Me" : group.prepared_by ?? "No Prepared By Name"}
              order={order}
              viewerSub={manifest.viewer_sub}
              rowRefs={rowRefs.current}
              highlightedFilename={highlightedFilename}
              onNotify={notify} />
          ))
        )}
      </div>
      <FooterMessage message={footerMessage?.text ?? null} error={footerMessage?.error} />
    </>
  )
}

const ScopeToggle = ({ scope, onChange }: { scope: AppTypes.ProposalScope, onChange: (scope: AppTypes.ProposalScope) => void }) => (
  <div className="join">
    <button
      type="button"
      onClick={() => onChange("mine")}
      className={`btn join-item btn-sm ${ scope === "mine" ? "btn-secondary" : "btn-ghost" }`}>
        My Proposals
    </button>
    <button
      type="button"
      onClick={() => onChange("all")}
      className={`btn join-item btn-sm ${ scope === "all" ? "btn-secondary" : "btn-ghost" }`}>
        All Proposals
    </button>
  </div>
)

type ProposalSectionProps = {
  group: AppTypes.ProposalGroup
  title: string
  order: string
  viewerSub: string
  rowRefs: Map<string, HTMLLIElement>
  highlightedFilename: string | null
  onNotify: (message: string, error?: boolean) => void
}

const ProposalSection = ({ group, title, order, viewerSub, rowRefs, highlightedFilename, onNotify }: ProposalSectionProps) => {
  const { pageProposals, currentPage, totalItems, setPage, sectionRef } = useHandleProposalSection(group.proposals, order)

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
      <div className="flex w-full min-w-0 flex-col sm:w-auto sm:flex-1">
        <span className="font-semibold">{proposal.client_name}</span>
        <SectionList sections={proposal.sections} />
        <SourceList sources={proposal.sources} />
        {deleteError && <span className="text-sm text-error">{deleteError.message}</span>}
        {pdfError && <span className="text-sm text-error">{pdfError.message}</span>}
      </div>
      <div className="flex flex-col items-center gap-2 sm:items-end">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap">
          {canDelete && (
            <DeleteButton
              isPending={isDeleting}
              onConfirm={() => deleteFile(proposal.filename, { onSuccess: () => onNotify(`Deleted ${ proposal.client_name }...`) })} />
          )}
          <button type="button" onClick={preview.show} className="btn btn-ghost btn-sm hover:bg-secondary">
            Preview
          </button>
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

const SectionList = ({ sections }: { sections: AppTypes.ProposalManifestEntry["sections"] }) => {
  if(sections.length === 0) return null

  return (
    <ul className="mt-1 flex flex-wrap gap-x-3 text-sm text-base-content/70">
      {sections.map((section, i) => (
        <li key={`${ section.title }-${ i }`} title={section.source_file ?? (section.source === "quote" ? "From a carrier quote" : "From an AMS360 proposal")}>
          {section.title}
          {section.carrier && <span className="text-base-content/40"> · {section.carrier}</span>}
        </li>
      ))}
    </ul>
  )
}

const SourceList = ({ sources }: { sources: AppTypes.ProposalManifestEntry["sources"] }) => {
  if(sources.length === 0) return null

  return (
    <ul className="mt-1 flex flex-wrap gap-1.5">
      {sources.map((source) => (
        <li key={source.id} title={source.filename} className="badge badge-ghost badge-sm max-w-56 gap-1 rounded-sm">
          <span className="font-semibold">{SOURCE_LABELS[source.kind]}</span>
          <span className="truncate">{source.filename}</span>
        </li>
      ))}
    </ul>
  )
}

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

const DeleteButton = ({ isPending, onConfirm }: { isPending: boolean, onConfirm: () => void }) => {
  const { armed, handleClick } = useHandleConfirmButton(onConfirm)

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

const DownloadButton = ({ label, title, isPending, onClick }: DownloadButtonProps) => (
  <button
    type="button"
    disabled={isPending}
    onClick={onClick}
    title={title}
    className="btn btn-neutral btn-sm hover:bg-secondary">
      {isPending ? "Downloading…" : label}
  </button>
)

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
