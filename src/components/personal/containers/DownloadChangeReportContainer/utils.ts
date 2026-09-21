// Types
import type * as AppTypes from '@context/App/types'
import type { OrderingOption } from '@components/team/utils/Ordering'

export const formatReportDate = (dateStr: string) => {
  const date = new Date(`${ dateStr }T00:00:00`)
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

export const formatSyncedUntil = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

export const formatFileSize = (bytes: number) => {
  if(bytes < 1024) return `${ bytes } B`

  const kb = bytes / 1024
  if(kb < 1024) return `${ kb.toFixed(1) } KB`

  return `${ (kb / 1024).toFixed(1) } MB`
}

export const handleLastSyncBanner = (lastSync: AppTypes.DownloadReportLastSync | null) => {
  if(!lastSync) return {}

  const { syncedUntil, tablesTouched, rowsEntered } = lastSync!

  const summaryText = rowsEntered === 0 ?
    "no new rows" :
    `${ rowsEntered } row${ rowsEntered === 1 ? "" : "s" } from ${ tablesTouched.join(", ") }`

  return { summaryText, syncedUntil }
}

export const REPORT_ORDER_OPTIONS: OrderingOption[] = [
  { value: "date_desc", label: "Date (Newest)" },
  { value: "date_asc", label: "Date (Oldest)" },
]

export const sortReports = (reports: AppTypes.DownloadReportManifestEntry[], order: string) => {
  const sorted = [...reports]
  return order === "date_asc" ?
    sorted.sort((a, b) => a.date.localeCompare(b.date)) :
    sorted.sort((a, b) => b.date.localeCompare(a.date))
}