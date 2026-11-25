// Types
import type * as AppTypes from "@context/App/types"
import type { OrderingOption } from "@components/team/utils/Ordering"
import { UPLOAD_FILES } from "@components/team/utils/PdfDropZone/utils"
import { DOCUMENT_TYPE_LABELS } from "@components/commercial/containers/CoverageComparisonContainer/utils"

export const AVAILABLE_MCP_TOOLS = [
  { name: "Coverage Gap", description: "Runs Boxwood's 11-step coverage gap review on a commercial account's policy PDFs and builds an internal Word report: scorecard, priority findings, exhibits and questions to confirm with the client." },
]

export const ACCEPTED_FILES = UPLOAD_FILES

// Mirrors MAX_NOTES_LENGTH on the backend
export const MAX_NOTES_LENGTH = 4000

export const ANALYSIS_ORDER_OPTIONS: OrderingOption[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "client_name_asc", label: "Client Name (A–Z)" },
  { value: "client_name_desc", label: "Client Name (Z–A)" },
]

export const clientName = (analysis: AppTypes.CoverageGapEntry) => analysis.client_name || "Untitled gap analysis"

export const sortAnalyses = (analyses: AppTypes.CoverageGapEntry[], order: string) => {
  const sorted = [...analyses]
  switch(order) {
    case "oldest": return sorted.sort((a, b) => a.generated_at.localeCompare(b.generated_at))
    case "client_name_asc": return sorted.sort((a, b) => clientName(a).localeCompare(clientName(b)))
    case "client_name_desc": return sorted.sort((a, b) => clientName(b).localeCompare(clientName(a)))
    default: return sorted.sort((a, b) => b.generated_at.localeCompare(a.generated_at))
  }
}

export const filterAnalyses = (groups: AppTypes.CoverageGapGroup[], query: string) => {
  const needle = query.trim().toLowerCase()
  if(!needle) return groups

  return groups
    .map((group) => ({ ...group, analyses: group.analyses.filter((a) => clientName(a).toLowerCase().includes(needle)) }))
    .filter((group) => group.analyses.length > 0)
}

export const hasRunningAnalysis = (manifest: AppTypes.CoverageGapManifest | undefined) =>
  !!manifest?.groups.some((group) => group.analyses.some((analysis) => analysis.status === "running"))

export const formatTimestamp = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

const plural = (count: number, one: string, many: string) => `${ count } ${ count === 1 ? one : many }`

// e.g. "4 policies · 6 gaps · 3 to confirm"
export const countsSummary = (analysis: AppTypes.CoverageGapEntry) => {
  const parts = [
    analysis.policies != null ? plural(analysis.policies, "policy", "policies") : null,
    analysis.counts ? plural(analysis.counts.gap, "gap", "gaps") : null,
    analysis.counts ? `${ analysis.counts.confirm } to confirm` : null,
  ]
  return parts.filter(Boolean).join(" · ")
}

// e.g. "Issued policy · Erie · Q-123 · 1/1/27–1/1/28"
export const profileSummary = (profile: NonNullable<AppTypes.CoverageGapAttachment["profile"]>) =>
  [profile.document_type && DOCUMENT_TYPE_LABELS[profile.document_type], profile.carrier, profile.policy_number, profile.policy_period].filter(Boolean).join(" · ")

// coverage_gap_analysis starts one; coverage_gap_results only reads one back
export const startsAnalysis = (call: { name: string }) => call.name.endsWith("coverage_gap_analysis")
