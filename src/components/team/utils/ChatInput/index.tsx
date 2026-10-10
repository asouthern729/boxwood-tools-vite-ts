import { useFocusOnSlash } from "./hooks"

// Types
import type { DropFileKind } from "@components/team/utils/PdfDropZone/utils"
import type { ChatAttachment } from "./types"

// Components
import PdfDropZone from "@components/team/utils/PdfDropZone"

type ChatInputProps = {
  draft: string
  setDraft: (value: string) => void
  isPending: boolean
  send: () => void
  placeholder: string
  onFiles?: (files: File[], rejected: string[]) => void
  accept?: DropFileKind[]
  attachments?: ChatAttachment[]
  onRemoveAttachment?: (key: string) => void
}

function ChatInput({ draft, setDraft, isPending, send, placeholder, onFiles, accept, attachments = [], onRemoveAttachment }: ChatInputProps) {
  const textareaRef = useFocusOnSlash()

  const textarea = (
    <textarea
      ref={textareaRef}
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
      placeholder={placeholder}
      className="textarea textarea-bordered w-full flex-1" />
  )

  if(!onFiles) return textarea

  return (
    <PdfDropZone
      variant="area"
      onFiles={onFiles}
      accept={accept}
      className="flex w-full flex-1 flex-col gap-2 rounded-box">
        <AttachmentChips attachments={attachments} onRemove={onRemoveAttachment} />
        {textarea}
    </PdfDropZone>
  )
}

function AttachmentChips({ attachments, onRemove }: { attachments: ChatAttachment[], onRemove?: (key: string) => void }) {
  if(attachments.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <li
          key={attachment.key}
          title={attachment.error ?? attachment.filename}
          className={`badge gap-1 rounded-sm ${ attachment.status === "error" ? "badge-soft badge-error h-auto py-0.5 whitespace-normal" : "badge-ghost text-base-content/90" }`}>
            <AttachmentStatus status={attachment.status} />
            <AttachmentLabel attachment={attachment} />
            {onRemove && (
              <button
                type="button"
                aria-label={`Remove ${ attachment.filename }`}
                onClick={() => onRemove(attachment.key)}
                className="cursor-pointer opacity-60 hover:opacity-100">
                  ✕
              </button>
            )}
        </li>
      ))}
    </ul>
  )
}

function AttachmentLabel({ attachment }: { attachment: ChatAttachment }) {
  if(attachment.status === "error" && attachment.error) return <span>{attachment.error}</span>

  return <span className="max-w-48 truncate">{attachment.filename}</span>
}

function AttachmentStatus({ status }: { status: ChatAttachment["status"] }) {
  if(status === "done") return <span className="text-success/70">✓</span>
  if(status === "error") return <span>!</span>

  return <span className="loading loading-spinner loading-xs text-base-content/90" />
}

export default ChatInput
