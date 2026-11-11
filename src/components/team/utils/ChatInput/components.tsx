// Types
import type { ChatAttachment } from "./types"

export const AttachmentChips = ({ attachments, onRemove }: { attachments: ChatAttachment[], onRemove?: (key: string) => void }) => {
  if(attachments.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <AttachmentChip
          key={attachment.key}
          attachment={attachment}
          onRemove={onRemove} />
      ))}
    </ul>
  )
}

const AttachmentChip = ({ attachment, onRemove }: { attachment: ChatAttachment, onRemove?: (key: string) => void }) => {
  const chipStyle = attachment.status === "error" ?
    "badge-soft badge-error h-auto py-0.5 whitespace-normal" :
    "badge-ghost text-base-content/90"

  return (
    <li
      title={attachment.error ?? attachment.filename}
      className={`badge gap-1 rounded-sm ${ chipStyle }`}>
        <AttachmentStatus status={attachment.status} />
        <AttachmentLabel attachment={attachment} />
        <RemoveAttachmentBtn attachment={attachment} onRemove={onRemove} />
    </li>
  )
}

const AttachmentStatus = ({ status }: { status: ChatAttachment["status"] }) => {
  if(status === "done") return <span className="text-success/70">✓</span>
  if(status === "error") return <span>!</span>

  return <span className="loading loading-spinner loading-xs text-base-content/90" />
}

const AttachmentLabel = ({ attachment }: { attachment: ChatAttachment }) => {
  if(attachment.status === "error" && attachment.error) return <span>{attachment.error}</span>

  return <span className="max-w-48 truncate">{attachment.filename}</span>
}

const RemoveAttachmentBtn = ({ attachment, onRemove }: { attachment: ChatAttachment, onRemove?: (key: string) => void }) => {
  if(!onRemove) return null

  return (
    <button
      type="button"
      aria-label={`Remove ${ attachment.filename }`}
      onClick={() => onRemove(attachment.key)}
      className="cursor-pointer opacity-60 hover:opacity-100">
        ✕
    </button>
  )
}
