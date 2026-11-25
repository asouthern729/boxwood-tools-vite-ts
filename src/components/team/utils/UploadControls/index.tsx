// Types
import type { DropFileKind } from "@components/team/utils/PdfDropZone/utils"

// Components
import AcceptsHint from "@components/team/utils/AcceptsHint"
import UploadButton from "@components/team/utils/UploadButton"

type UploadControlsProps = {
  onFiles: (files: File[], rejected: string[]) => void
  accept: DropFileKind[]
  title?: string
  disabled?: boolean
  className?: string
  iconClassName?: string
}

// The Accepts hint with the Browse button to its right, for the bottom-right corner of every drop zone
function UploadControls({ onFiles, accept, title, disabled, className = "", iconClassName }: UploadControlsProps) {
  return (
    <div className={`flex items-center justify-end gap-3.5 ${ className }`}>
      <AcceptsHint
        accept={accept}
        iconClassName={iconClassName} />
      <UploadButton
        onFiles={onFiles}
        accept={accept}
        title={title}
        disabled={disabled}
        iconClassName={iconClassName} />
    </div>
  )
}

export default UploadControls
