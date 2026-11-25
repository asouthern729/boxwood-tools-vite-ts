import { useFocusOnSlash } from "./hooks"

import { UPLOAD_FILES } from "@components/team/utils/PdfDropZone/utils"

// Types
import type { DropFileKind } from "@components/team/utils/PdfDropZone/utils"
import type { ChatAttachment } from "./types"

// Components
import PdfDropZone from "@components/team/utils/PdfDropZone"
import UploadControls from "@components/team/utils/UploadControls"
import * as Components from "./components"

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
        <Components.AttachmentChips
          attachments={attachments}
          onRemove={onRemoveAttachment} />
        {/* Bottom padding keeps typed text clear of the Accepts hint and Browse button */}
        <div className="relative flex flex-1 [&>textarea]:pb-11">
          {textarea}
          <UploadControls
            onFiles={onFiles}
            accept={accept ?? UPLOAD_FILES}
            disabled={isPending}
            title="Choose files to attach, or drop them on the message box"
            className="absolute right-1.5 bottom-1.5" />
        </div>
    </PdfDropZone>
  )
}

export default ChatInput