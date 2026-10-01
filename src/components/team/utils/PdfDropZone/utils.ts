export const MAX_PDF_BYTES = 24 * 1024 * 1024

const isPdf = (file: File) => file.type === "application/pdf" || /\.pdf$/i.test(file.name)

export const hasDraggedFiles = (dataTransfer: DataTransfer | null) => !!dataTransfer?.types.includes("Files")

export const partitionPdfFiles = (files: File[]) => {
  const accepted: File[] = []
  const rejected: string[] = []

  files.forEach((file) => {
    if(!isPdf(file)) rejected.push(`${ file.name } isn't a PDF.`)
    else if(file.size > MAX_PDF_BYTES) rejected.push(`${ file.name } is over the 24 MB limit.`)
    else accepted.push(file)
  })

  return { accepted, rejected }
}
