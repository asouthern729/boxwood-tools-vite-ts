import { useHandlePdfDropZone, usePreventWindowFileDrop } from "./hooks"
import { acceptAttribute } from "./utils"

// Types
import type { DropFileKind } from "./utils"

type PdfDropZoneProps = {
  variant: "button" | "area"
  onFiles: (files: File[], rejected: string[]) => void
  children?: React.ReactNode
  className?: string
  title?: string
  accept?: DropFileKind[]
}

function PdfDropZone({ variant, onFiles, children, className = "", title, accept = ["pdf"] }: PdfDropZoneProps) {
  const { isDragging, dropHandlers, inputRef, onInputChange, openPicker } = useHandlePdfDropZone(onFiles, accept)

  usePreventWindowFileDrop()

  if(variant === "button") {
    return (
      <>
        <button type="button" onClick={openPicker} title={title} className={className}>
          {children}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttribute(accept)}
          multiple
          hidden
          onChange={onInputChange} />
      </>
    )
  }

  const dragClass = isDragging ?
    "bg-secondary/20 outline-2 -outline-offset-2 outline-secondary" :
    ""

  return (
    <div {...dropHandlers} title={title} className={`${ className } ${ dragClass }`}>
      {children}
    </div>
  )
}

export default PdfDropZone
