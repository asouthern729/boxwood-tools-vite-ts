import pdfIcon from "@assets/icons/pdf/pdf.svg"
import docxIcon from "@assets/icons/docx/docx.svg"
import xlsxIcon from "@assets/icons/xlsx/xlsx.svg"
import imageIcon from "@assets/icons/image/image.svg"
import { FILE_KINDS } from "@components/team/utils/PdfDropZone/utils"

// Types
import type { DropFileKind } from "@components/team/utils/PdfDropZone/utils"

const ICONS: Record<DropFileKind, string> = {
  pdf: pdfIcon,
  docx: docxIcon,
  xlsx: xlsxIcon,
  image: imageIcon,
}

type AcceptsHintProps = {
  accept: DropFileKind[]
  iconClassName?: string
}

// "Accepts" plus one icon per file type, sat beside a Browse button: visible but not prominent.
// The word drops out on very narrow screens so it doesn't crowd the button.
function AcceptsHint({ accept, iconClassName = "size-4" }: AcceptsHintProps) {
  // e.g. "Tool accepts PDF, .docx, .xlsx, .xls, .png, .jpg, .jpeg"
  const label = `Tool accepts ${ accept.flatMap((kind) => FILE_KINDS[kind].extensions).map((ext) => (ext === "pdf" ? "PDF" : `.${ ext }`)).join(", ") }`

  return (
    <span title={label} aria-label={label} className="flex shrink-0 cursor-default items-center gap-1 text-xs text-base-content italic opacity-50">
      <span aria-hidden className="mr-0.5 max-[380px]:hidden">Accepts</span>
      {accept.map((kind) => (
        <img
          key={kind}
          src={ICONS[kind]}
          alt=""
          aria-hidden
          className={iconClassName} />
      ))}
    </span>
  )
}

export default AcceptsHint
