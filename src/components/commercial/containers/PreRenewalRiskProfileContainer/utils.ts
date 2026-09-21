// Types
import type * as AppTypes from '@context/App/types'
import type { OrderingOption } from '@components/team/utils/Ordering'

export const AVAILABLE_MCP_TOOLS = [
  { name: "Customer Lookup", description: "Look up a customer by name or ID, including contacts, policies, and related records." },
  { name: "Upcoming Renewals", description: "Find active policies renewing soon, filterable by producer, CSR, or carrier." },
  { name: "Risk Profile", description: "Build the Pre-Renewal Risk Profile Word document (exposures — buildings, vehicles, drivers, payroll) for one account's upcoming renewal." },
  { name: "Employee Lookup", description: "Look up an employee (producer/CSR) by name or code to resolve their rep code." }
]

export const SUMMARY_ORDER_OPTIONS: OrderingOption[] = [
  { value: "client_name_asc", label: "Client Name (A–Z)" },
  { value: "client_name_desc", label: "Client Name (Z–A)" },
  { value: "renewal_date_asc", label: "Renewal Date (Soonest)" },
  { value: "renewal_date_desc", label: "Renewal Date (Latest)" },
]

export const sortSummaries = (summaries: AppTypes.PreRenewalRiskProfileManifestEntry[], order: string) => {
  const sorted = [...summaries]
  switch(order) {
    case "client_name_desc": return sorted.sort((a, b) => b.client_name.localeCompare(a.client_name))
    case "renewal_date_asc": return sorted.sort((a, b) => a.renewal_date.localeCompare(b.renewal_date))
    case "renewal_date_desc": return sorted.sort((a, b) => b.renewal_date.localeCompare(a.renewal_date))
    default: return sorted.sort((a, b) => a.client_name.localeCompare(b.client_name))
  }
}

export const formatTimestamp = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}
