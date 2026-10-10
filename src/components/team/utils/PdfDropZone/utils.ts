export const MAX_PDF_BYTES = 24 * 1024 * 1024

export type DropFileKind = "pdf" | "docx"

const FILE_KINDS: Record<DropFileKind, { label: string, mime: string, extension: RegExp }> = {
  pdf: { label: "PDF", mime: "application/pdf", extension: /\.pdf$/i },
  docx: { label: "Word document", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extension: /\.docx$/i },
}

const matchesKind = (file: File, kind: DropFileKind) => file.type === FILE_KINDS[kind].mime || FILE_KINDS[kind].extension.test(file.name)

const acceptedLabel = (accept: DropFileKind[]) => accept.map((kind) => FILE_KINDS[kind].label).join(" or ")

export const acceptAttribute = (accept: DropFileKind[]) => accept.map((kind) => `${ FILE_KINDS[kind].mime },.${ kind }`).join(",")

export const hasDraggedFiles = (dataTransfer: DataTransfer | null) => !!dataTransfer?.types.includes("Files")

export const partitionFiles = (files: File[], accept: DropFileKind[] = ["pdf"]) => {
  const accepted: File[] = []
  const rejected: string[] = []

  files.forEach((file) => {
    if(!accept.some((kind) => matchesKind(file, kind))) rejected.push(`${ file.name } isn't a ${ acceptedLabel(accept) }.`)
    else if(file.size > MAX_PDF_BYTES) rejected.push(`${ file.name } is over the 24 MB limit.`)
    else accepted.push(file)
  })

  return { accepted, rejected }
}
