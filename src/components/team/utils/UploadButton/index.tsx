import uploadIcon from "@assets/icons/upload/upload.svg"

// Types
import type { DropFileKind } from "@components/team/utils/PdfDropZone/utils"

// Components
import PdfDropZone from "@components/team/utils/PdfDropZone"

type UploadButtonProps = {
  onFiles: (files: File[], rejected: string[]) => void
  accept?: DropFileKind[]
  title?: string
  disabled?: boolean
  className?: string
  iconClassName?: string
  showLabel?: boolean
}

// Opens the file picker; the counterpart to dropping files on a drop zone, for staff who'd rather click
function UploadButton({ onFiles, accept, title = "Choose files", disabled = false, className = "", iconClassName = "size-4", showLabel = true }: UploadButtonProps) {
  return (
    <PdfDropZone
      variant="button"
      onFiles={onFiles}
      accept={accept}
      title={title}
      disabled={disabled}
      className={`group btn btn-ghost btn-sm hover:bg-secondary hover:text-white ${ showLabel ? "gap-1.5 px-2" : "btn-square" } ${ className }`}>
        <img src={uploadIcon} alt="" aria-hidden className={`${ iconClassName } opacity-70 group-hover:opacity-100 group-hover:invert dark:invert`} />
        {showLabel ? "Browse" : <span className="sr-only">{title}</span>}
    </PdfDropZone>
  )
}

export default UploadButton
