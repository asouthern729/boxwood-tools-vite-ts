export const formatReportDate = (dateStr: string) => {
  const date = new Date(`${ dateStr }T00:00:00`)
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

export const formatFileSize = (bytes: number) => {
  if(bytes < 1024) return `${ bytes } B`

  const kb = bytes / 1024
  if(kb < 1024) return `${ kb.toFixed(1) } KB`

  return `${ (kb / 1024).toFixed(1) } MB`
}
