// Types
import type * as AppTypes from "@context/App/types"
import type { OrderingOption } from "@components/team/utils/Ordering"
import { UPLOAD_FILES } from "@components/team/utils/PdfDropZone/utils"

export const AVAILABLE_MCP_TOOLS = [
  { name: "Customer Lookup", description: "Look up a customer by name or ID, including contacts, policies, and related records." },
  { name: "Policy Check", description: "Checks an issued or renewal policy against the quote, binder or expiring policy, line by line, with an AMS360 cross-check, and produces an internal report with every discrepancy by priority on page one." },
]

export const ACCEPTED_FILES = UPLOAD_FILES

// One labeled drop zone per role (Patrick asked for separate upload areas)
export const ROLE_ZONES: { role: AppTypes.PolicyCheckRole, label: string, hint: string, optional?: boolean }[] = [
  { role: "baseline", label: "Quote, binder or expiring policy", hint: "What was promised or what's expiring" },
  { role: "compared", label: "Issued or renewal policy", hint: "What the carrier actually issued" },
  { role: "reference", label: "Endorsements & other references", hint: "ACORD apps, leases, contracts", optional: true },
]

export const ROLE_LABELS: Record<AppTypes.PolicyCheckRole, string> = {
  baseline: "Baseline",
  compared: "Issued/Renewal",
  reference: "Reference",
}

export const DOCUMENT_TYPE_LABELS: Record<AppTypes.PolicyCheckDocumentType, string> = {
  quote: "quote",
  binder: "binder",
  issued_policy: "issued policy",
  renewal_policy: "renewal policy",
  expiring_policy: "expiring policy",
  endorsement: "endorsement",
  application: "application",
  contract: "contract",
  other: "reference document",
}

export const MODE_LABELS: Record<AppTypes.PolicyCheckMode, string> = {
  quote_to_issued: "Quote → Issued",
  expiring_to_renewal: "Expiring → Renewal",
  both: "Quote & Expiring → Issued",
}

export const BANNER_CLASSES: Record<NonNullable<AppTypes.PolicyCheckEntry["banner"]>["level"], string> = {
  red: "badge-error",
  amber: "badge-warning",
  green: "badge-success",
}

export const CHECK_ORDER_OPTIONS: OrderingOption[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "client_name_asc", label: "Client Name (A–Z)" },
  { value: "client_name_desc", label: "Client Name (Z–A)" },
]

export const clientName = (check: AppTypes.PolicyCheckEntry) => check.client_name || "Untitled check"

export const sortChecks = (checks: AppTypes.PolicyCheckEntry[], order: string) => {
  const sorted = [...checks]
  switch(order) {
    case "oldest": return sorted.sort((a, b) => a.generated_at.localeCompare(b.generated_at))
    case "client_name_asc": return sorted.sort((a, b) => clientName(a).localeCompare(clientName(b)))
    case "client_name_desc": return sorted.sort((a, b) => clientName(b).localeCompare(clientName(a)))
    default: return sorted.sort((a, b) => b.generated_at.localeCompare(a.generated_at))
  }
}

export const filterChecks = (groups: AppTypes.PolicyCheckGroup[], query: string) => {
  const needle = query.trim().toLowerCase()
  if(!needle) return groups

  return groups
    .map((group) => ({ ...group, checks: group.checks.filter((c) => clientName(c).toLowerCase().includes(needle)) }))
    .filter((group) => group.checks.length > 0)
}

export const hasRunningCheck = (manifest: AppTypes.PolicyCheckManifest | undefined) =>
  !!manifest?.groups.some((group) => group.checks.some((check) => check.status === "running"))

export const formatTimestamp = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

export const formatMoney = (value: number | null | undefined) => (value == null ? "—" : currency.format(value))

export const formatPremiumChange = ({ change, percent }: NonNullable<AppTypes.PolicyCheckEntry["premium_change"]>) => {
  if(change == null) return null
  const sign = change > 0 ? "+" : change < 0 ? "−" : ""
  const pct = percent == null ? "" : ` (${ sign }${ Math.abs(percent).toFixed(1) }%)`
  return `${ sign }${ currency.format(Math.abs(change)) }${ pct }`
}

// e.g. "Hartford · CP 1234567 · 1/1/27–1/1/28"
export const profileSummary = (profile: AppTypes.PolicyCheckProfile) =>
  [profile.carrier, profile.policy_number, profile.policy_period].filter(Boolean).join(" · ")

export const isPolicyCheckCall = (call: { name: string }) => call.name.endsWith("policy_check")
