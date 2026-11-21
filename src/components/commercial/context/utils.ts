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

const UPCOMING_MONTH_COUNT = 4

// "YYYY-MM" -> "November 2026"
export const formatRenewalMonth = (isoMonth: string) => {
  const [year, month] = isoMonth.split("-").map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

// The current month plus the following three, as "YYYY-MM" values
export const upcomingRenewalMonths = (): OrderingOption[] => {
  const now = new Date()
  return Array.from({ length: UPCOMING_MONTH_COUNT }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const value = `${ date.getFullYear() }-${ String(date.getMonth() + 1).padStart(2, "0") }`
    return { value, label: formatRenewalMonth(value) }
  })
}

export const isUpcomingRenewalMonth = (isoMonth: string) =>
  upcomingRenewalMonths().some((month) => month.value === isoMonth)

// An empty month means every month
export const filterRenewalMonth = <T extends { renewal_date: string }>(summaries: T[], renewalMonth: string): T[] =>
  renewalMonth ? summaries.filter((summary) => summary.renewal_date.startsWith(renewalMonth)) : summaries

const UNASSIGNED_CSR = "__unassigned__"
export const UNASSIGNED_CSR_LABEL = "Unassigned"

type CsrGroupLike = { csr_code: string | null, csr_name: string | null }

const csrKey = (group: CsrGroupLike) => group.csr_code ?? UNASSIGNED_CSR

// One option per CSR group, in the order the server sent them
export const csrOptions = (groups: CsrGroupLike[]): OrderingOption[] =>
  groups.map((group) => ({ value: csrKey(group), label: group.csr_name ?? group.csr_code ?? UNASSIGNED_CSR_LABEL }))

// An empty CSR means every CSR
export const filterCsr = <T extends CsrGroupLike>(groups: T[], csr: string): T[] =>
  csr ? groups.filter((group) => csrKey(group) === csr) : groups

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
