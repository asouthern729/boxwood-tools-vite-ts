import { useHandlePdfDropZone, usePreventWindowFileDrop } from "./hooks"

type PdfDropZoneProps = {
  variant: "button" | "area"
  onFiles: (files: File[], rejected: string[]) => void
  children?: React.ReactNode
  className?: string
  title?: string
}

function PdfDropZone({ variant, onFiles, children, className = "", title }: PdfDropZoneProps) {
  const { isDragging, dropHandlers, inputRef, onInputChange, openPicker } = useHandlePdfDropZone(onFiles)

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
          accept="application/pdf"
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
