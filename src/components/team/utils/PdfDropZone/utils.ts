export const MAX_PDF_BYTES = 24 * 1024 * 1024

export type DropFileKind = "pdf" | "docx" | "xlsx" | "image"

// No .heic: the server explains how to resave one if someone forces it through
export const FILE_KINDS: Record<DropFileKind, { label: string, mimes: string[], extensions: string[] }> = {
  pdf: { label: "PDF", mimes: ["application/pdf"], extensions: ["pdf"] },
  docx: { label: "Word", mimes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"], extensions: ["docx"] },
  xlsx: { label: "Excel", mimes: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"], extensions: ["xlsx", "xls"] },
  image: { label: "PNG/JPEG", mimes: ["image/png", "image/jpeg"], extensions: ["png", "jpg", "jpeg"] },
}

// Every upload tool takes the same files; the server sniffs the bytes to tell them apart
export const UPLOAD_FILES: DropFileKind[] = ["pdf", "docx", "xlsx", "image"]

const extensionOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? ""

const matchesKind = (file: File, kind: DropFileKind) =>
  FILE_KINDS[kind].mimes.includes(file.type) || FILE_KINDS[kind].extensions.includes(extensionOf(file.name))

// e.g. "PDF, Word, Excel or PNG/JPEG"
const acceptedLabel = (accept: DropFileKind[]) => {
  const labels = accept.map((kind) => FILE_KINDS[kind].label)
  return labels.length <= 2 ? labels.join(" or ") : `${ labels.slice(0, -1).join(", ") } or ${ labels.at(-1) }`
}

export const acceptAttribute = (accept: DropFileKind[]) =>
  accept.flatMap((kind) => [...FILE_KINDS[kind].mimes, ...FILE_KINDS[kind].extensions.map((ext) => `.${ ext }`)]).join(",")

export const hasDraggedFiles = (dataTransfer: DataTransfer | null) => !!dataTransfer?.types.includes("Files")

export const partitionFiles = (files: File[], accept: DropFileKind[] = ["pdf"]) => {
  const accepted: File[] = []
  const rejected: string[] = []

  files.forEach((file) => {
    if(!accept.some((kind) => matchesKind(file, kind))) rejected.push(`${ file.name } isn't a ${ acceptedLabel(accept) } file.`)
    else if(file.size > MAX_PDF_BYTES) rejected.push(`${ file.name } is over the 24 MB limit.`)
    else accepted.push(file)
  })

  return { accepted, rejected }
}
