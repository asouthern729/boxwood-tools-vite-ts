// Types
import type * as AppTypes from "@context/App/types"
import type { OrderingOption } from "@components/team/utils/Ordering"
import type { DropFileKind } from "@components/team/utils/PdfDropZone/utils"

export const AVAILABLE_MCP_TOOLS = [
  { name: "CL Coverage Comparison", description: "Compares two sets of commercial quote or policy PDFs into a branded Word comparison to review with the client: premium, key points and a side-by-side table for each coverage line." },
]

export const ACCEPTED_FILES: DropFileKind[] = ["pdf"]

// One drop zone per set; each set may hold several lines (e.g. BOP + umbrella + WC)
export const SET_ZONES: { role: AppTypes.CoverageComparisonRole, label: string, hint: string, labelPlaceholder: string }[] = [
  { role: "set_a", label: "Set A", hint: "Current program, expiring policy or first quote", labelPlaceholder: "e.g. Current — Erie" },
  { role: "set_b", label: "Set B", hint: "Proposed program, renewal or second quote", labelPlaceholder: "e.g. Proposed — Cincinnati" },
]

export const SET_LABELS: Record<AppTypes.CoverageComparisonRole, string> = {
  set_a: "Set A",
  set_b: "Set B",
}

export const OTHER_SET: Record<AppTypes.CoverageComparisonRole, AppTypes.CoverageComparisonRole> = {
  set_a: "set_b",
  set_b: "set_a",
}

export const DOCUMENT_TYPE_LABELS: Record<AppTypes.PolicyCheckDocumentType, string> = {
  quote: "Quote",
  binder: "Binder",
  issued_policy: "Issued policy",
  renewal_policy: "Renewal policy",
  expiring_policy: "Expiring policy",
  endorsement: "Endorsement",
  application: "Application",
  contract: "Contract",
  other: "Other document",
}

export const COMPARISON_ORDER_OPTIONS: OrderingOption[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "client_name_asc", label: "Client Name (A–Z)" },
  { value: "client_name_desc", label: "Client Name (Z–A)" },
]

export const clientName = (comparison: AppTypes.CoverageComparisonEntry) => comparison.client_name || "Untitled comparison"

export const sortComparisons = (comparisons: AppTypes.CoverageComparisonEntry[], order: string) => {
  const sorted = [...comparisons]
  switch(order) {
    case "oldest": return sorted.sort((a, b) => a.generated_at.localeCompare(b.generated_at))
    case "client_name_asc": return sorted.sort((a, b) => clientName(a).localeCompare(clientName(b)))
    case "client_name_desc": return sorted.sort((a, b) => clientName(b).localeCompare(clientName(a)))
    default: return sorted.sort((a, b) => b.generated_at.localeCompare(a.generated_at))
  }
}

export const filterComparisons = (groups: AppTypes.CoverageComparisonGroup[], query: string) => {
  const needle = query.trim().toLowerCase()
  if(!needle) return groups

  return groups
    .map((group) => ({ ...group, comparisons: group.comparisons.filter((c) => clientName(c).toLowerCase().includes(needle)) }))
    .filter((group) => group.comparisons.length > 0)
}

export const hasRunningComparison = (manifest: AppTypes.CoverageComparisonManifest | undefined) =>
  !!manifest?.groups.some((group) => group.comparisons.some((comparison) => comparison.status === "running"))

export const formatTimestamp = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

export const formatMoney = (value: number | null | undefined) => (value == null ? "—" : currency.format(value))

export const formatDifference = (difference: number | null) => {
  if(difference == null) return null
  const sign = difference > 0 ? "+" : difference < 0 ? "−" : ""
  return `${ sign }${ currency.format(Math.abs(difference)) }`
}

// e.g. "Quote · Erie · Q-123 · 1/1/27–1/1/28"
export const profileSummary = (profile: NonNullable<AppTypes.CoverageComparisonAttachment["profile"]>) =>
  [profile.document_type && DOCUMENT_TYPE_LABELS[profile.document_type], profile.carrier, profile.policy_number, profile.policy_period].filter(Boolean).join(" · ")

// coverage_comparison starts one; coverage_comparison_results only reads one back
export const startsComparison = (call: { name: string }) => call.name.endsWith("coverage_comparison")
