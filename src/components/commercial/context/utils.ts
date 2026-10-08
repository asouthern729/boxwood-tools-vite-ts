// Types
import type { OrderingOption } from '@components/team/utils/Ordering'

export const SUMMARY_ORDER_OPTIONS: OrderingOption[] = [
  { value: "client_name_asc", label: "Client Name (A–Z)" },
  { value: "client_name_desc", label: "Client Name (Z–A)" },
  { value: "renewal_date_asc", label: "Renewal Date (Soonest)" },
  { value: "renewal_date_desc", label: "Renewal Date (Latest)" },
]

export const sortSummaries = <T extends { client_name: string; renewal_date: string }>(summaries: T[], order: string): T[] => {
  const sorted = [...summaries]
  switch(order) {
    case "client_name_desc": return sorted.sort((a, b) => b.client_name.localeCompare(a.client_name))
    case "renewal_date_asc": return sorted.sort((a, b) => a.renewal_date.localeCompare(b.renewal_date))
    case "renewal_date_desc": return sorted.sort((a, b) => b.renewal_date.localeCompare(a.renewal_date))
    default: return sorted.sort((a, b) => a.client_name.localeCompare(b.client_name))
  }
}

const todayISODate = () => {
  const now = new Date()
  return `${ now.getFullYear() }-${ String(now.getMonth() + 1).padStart(2, "0") }-${ String(now.getDate()).padStart(2, "0") }`
}

export const isPastRenewal = (renewalDate: string) => renewalDate < todayISODate()

export const filterPastRenewals = <T extends { renewal_date: string }>(summaries: T[], showPastRenewals: boolean): T[] =>
  showPastRenewals ? summaries : summaries.filter((summary) => !isPastRenewal(summary.renewal_date))

const currentISOMonth = () => todayISODate().slice(0, 7)

export const filterCurrentMonth = <T extends { renewal_date: string }>(summaries: T[], currentMonthOnly: boolean): T[] =>
  currentMonthOnly ? summaries.filter((summary) => summary.renewal_date.startsWith(currentISOMonth())) : summaries

export const isToday = (dateStr: string) =>
  new Date(dateStr).toDateString() === new Date().toDateString()

export const collectCreatedToday = <T extends { generated_at: string }>(groups: { summaries: T[] }[]): T[] =>
  groups.flatMap((group) => group.summaries).filter((summary) => isToday(summary.generated_at))

export const isUpdatedToday = <T extends { last_refreshed_at?: string }>(summary: T): summary is T & { last_refreshed_at: string } =>
  summary.last_refreshed_at !== undefined && isToday(summary.last_refreshed_at)

export const updatedTooltip = (summary: { last_refresh_reason?: string }, timestamp: string) =>
  summary.last_refresh_reason ? `${ summary.last_refresh_reason } — ${ timestamp }` : timestamp

export const collectUpdatedToday = <T extends { last_refreshed_at?: string }>(groups: { summaries: T[] }[]): T[] =>
  groups.flatMap((group) => group.summaries).filter(isUpdatedToday)

const stripSpaces = (value: string) => value.replace(/\s+/g, "")

export const collectSearchMatches = <T extends { client_name: string, polnos: string }>(groups: { summaries: T[] }[], query: string): T[] => {
  const needle = query.trim().toLowerCase()
  if(!needle) return []
  return groups.flatMap((group) => group.summaries).filter((summary) =>
    summary.client_name.toLowerCase().includes(needle) || stripSpaces(summary.polnos.toLowerCase()).includes(stripSpaces(needle)))
}
