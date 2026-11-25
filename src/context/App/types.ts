export type CommercialTools =
  | "Pre-Renewal Risk Profile"
  | "Renewal Premium Spreadsheet"
  | "CL Renewal Summary"
  | "Proposal Builder"
  | "Policy Check"
  | "CL Coverage Comparison"
  | "Coverage Gap"

export type PersonalTools =
  | "Download Change Report"
  | "Premium Change Tool"
  | "PL Renewal Summary"

export type AllTools = CommercialTools|PersonalTools

export type ToolOutputs =
  | "xlsx"
  | "docx"
  | "pdf"

export type DownloadReportManifestEntry = {
  date: string
  filename: string
  sizeBytes: number
}

// Reflects only the most recently generated report — the backend watermark it's read from is
// overwritten each sync run, not kept per report date.
export type DownloadReportLastSync = {
  syncedUntil: string
  tablesTouched: string[]
  rowsEntered: number
}

export type DownloadReportManifest = {
  reports: DownloadReportManifestEntry[]
  lastSync: DownloadReportLastSync | null
}

// One line of business on a renewal document and whether its renewal values are in yet (CL Renewal
// Summary: renewal terms; Renewal Premium Spreadsheet: renewal premium). polno can list several
// policies when the spreadsheet combines them on one row.
export type LineStatus = { title: string, polno: string, renewed: boolean }

// Another tool's document for the same policy terms (backend documentLinks.ts) — the preview modal
// shows a button to it. id is that document's id, the ?doc= key on its tool page.
export type DocumentTool = "cl-renewal-summary" | "renewal-premium-summary"
export type DocumentLink = { tool: DocumentTool, id: string, label: string }
// POST .../linked: the other tool's document for these policy terms. created is false when it already
// existed (a second click, or built since the page loaded) — either way, open id.
export type LinkedDocumentResult = { id: string, created: boolean }

export type RenewalPremiumSummaryManifestEntry = {
  // Opaque, stable document id — the ?doc= key in the page URL. Absent from older backends;
  // use documentId() rather than reading it directly.
  id?: string
  links?: DocumentLink[]
  filename: string
  generated_at: string
  last_refreshed_at?: string
  last_refresh_reason?: string
  // Absent on spreadsheets whose renewal values haven't been recorded yet (the nightly Refresh does it)
  sections?: LineStatus[]
  csr_code: string | null
  csr_name: string | null
  client_name: string
  polnos: string
  renewal_date: string
  renewal_date_label: string
  sizeBytes: number
}

export type RenewalPremiumSummaryCsrGroup = {
  csr_code: string | null
  csr_name: string | null
  summaries: RenewalPremiumSummaryManifestEntry[]
}

export type RenewalPremiumSummaryManifest = {
  groups: RenewalPremiumSummaryCsrGroup[]
}

export type RenewalPremiumSummaryChatMessage = {
  role: "user" | "assistant"
  text: string
}

export type RenewalPremiumSummaryChatTurn = {
  reply: string
  session_id: string
  tool_calls: { name: string; input: unknown }[]
}

// A line of business on the policy in AMS360 that has no section in the archived document.
// Absent on documents archived before the backend started recording it.
export type CoverageGap = {
  polno: string
  line: string
  missing: string
}

export type PreRenewalRiskProfileManifestEntry = {
  filename: string
  generated_at: string
  csr_code: string | null
  csr_name: string | null
  client_name: string
  polnos: string
  renewal_date: string
  renewal_date_label: string
  sizeBytes: number
  coverage_gaps?: CoverageGap[]
}

export type PreRenewalRiskProfileCsrGroup = {
  csr_code: string | null
  csr_name: string | null
  summaries: PreRenewalRiskProfileManifestEntry[]
}

export type PreRenewalRiskProfileManifest = {
  groups: PreRenewalRiskProfileCsrGroup[]
}

export type PreRenewalRiskProfileChatMessage = {
  role: "user" | "assistant"
  text: string
}

export type PreRenewalRiskProfileChatTurn = {
  reply: string
  session_id: string
  tool_calls: { name: string; input: unknown }[]
}

export type RenewalSummaryManifestEntry = {
  // Opaque, stable document id — the ?doc= key in the page URL. Absent from older backends;
  // use documentId() rather than reading it directly.
  id?: string
  links?: DocumentLink[]
  filename: string
  generated_at: string
  last_refreshed_at?: string
  last_refresh_reason?: string
  sections?: LineStatus[]
  csr_code: string | null
  csr_name: string | null
  client_name: string
  polnos: string
  renewal_date: string
  renewal_date_label: string
  sizeBytes: number
  coverage_gaps?: CoverageGap[]
}

export type RenewalSummaryCsrGroup = {
  csr_code: string | null
  csr_name: string | null
  summaries: RenewalSummaryManifestEntry[]
}

export type RenewalSummaryManifest = {
  groups: RenewalSummaryCsrGroup[]
}

export type RenewalSummaryChatMessage = {
  role: "user" | "assistant"
  text: string
}

export type RenewalSummaryChatTurn = {
  reply: string
  session_id: string
  tool_calls: { name: string; input: unknown }[]
}

export type RenewalSummaryQuoteLine = {
  title: string
  carrier: string | null
  annual_premium: number | null
}

export type RenewalSummaryQuote = {
  id: string
  filename: string
  uploaded_at: string
  status: "processing" | "done" | "error"
  error?: string
  lines: RenewalSummaryQuoteLine[]
}
export type PersonalRenewalSummaryManifestEntry = RenewalSummaryManifestEntry
export type PersonalRenewalSummaryCsrGroup = RenewalSummaryCsrGroup
export type PersonalRenewalSummaryManifest = RenewalSummaryManifest
export type PersonalRenewalSummaryChatMessage = RenewalSummaryChatMessage
export type PersonalRenewalSummaryChatTurn = RenewalSummaryChatTurn

export type PersonalPremiumChangeManifestEntry = RenewalSummaryManifestEntry & {
  carriers: string
  current_total: number
  renewal_total: number
  change_amount: number
  change_percent: number | null
  term: "annual" | "six_month"
  note: string
}

export type PersonalPremiumChangeCsrGroup = {
  csr_code: string | null
  csr_name: string | null
  summaries: PersonalPremiumChangeManifestEntry[]
}

export type PersonalPremiumChangeManifest = {
  groups: PersonalPremiumChangeCsrGroup[]
}

export type PersonalPremiumChangeChatMessage = RenewalSummaryChatMessage
export type PersonalPremiumChangeChatTurn = RenewalSummaryChatTurn

export type ProposalSourceKind = "quote_pdf" | "quote_xlsx" | "ams_docx" | "ams_pdf"

export type ProposalAttachment = {
  id: string
  filename: string
  kind: ProposalSourceKind
  status: "processing" | "done" | "error"
  error?: string
}

export type ProposalCreator = {
  sub: string
  name: string
  email: string | null
}

export type ProposalManifestEntry = {
  filename: string
  client_name: string
  line_type: string
  created_by: ProposalCreator
  prepared_by?: string
  generated_at: string
  last_refreshed_at?: string
  last_refresh_reason?: string
  sections: { title: string, carrier: string | null, source: "quote" | "ams", source_file?: string }[]
  sources: { id: string, filename: string, kind: ProposalSourceKind }[]
  sizeBytes: number
}

export type ProposalGroup = {
  prepared_by: string | null
  proposals: ProposalManifestEntry[]
}

export type ProposalManifest = {
  viewer_sub: string
  groups: ProposalGroup[]
}

export type ProposalScope = "mine" | "all"

export type ProposalChatMessage = RenewalSummaryChatMessage
export type ProposalChatTurn = RenewalSummaryChatTurn

// Policy Check (/policy-check/*): staff drop the baseline (quote, binder or expiring policy), the
// compared document (issued or renewal policy) and any references, then a background job checks them
export type PolicyCheckRole = "baseline" | "compared" | "reference"

export type PolicyCheckDocumentType =
  | "quote"
  | "binder"
  | "issued_policy"
  | "renewal_policy"
  | "expiring_policy"
  | "endorsement"
  | "application"
  | "contract"
  | "other"

// Only present once the attachment is read; any field but suggested_role may be null
export type PolicyCheckProfile = {
  document_type: PolicyCheckDocumentType | null
  named_insured: string | null
  carrier: string | null
  policy_number: string | null
  policy_period: string | null
  pages: number | null
  suggested_role: PolicyCheckRole
}

export type PolicyCheckAttachment = {
  id: string
  filename: string
  role: PolicyCheckRole
  status: "processing" | "done" | "error"
  error?: string
  profile?: PolicyCheckProfile
}

export type PolicyCheckStatus = "running" | "failed" | "done"

export type PolicyCheckMode = "quote_to_issued" | "expiring_to_renewal" | "both"

export type PolicyCheckEntry = {
  id: string
  client_name: string | null
  status: PolicyCheckStatus
  error?: string
  mode: PolicyCheckMode | null
  created_by: ProposalCreator
  prepared_by?: string | null
  generated_at: string
  finished_at?: string
  filename?: string
  sizeBytes?: number
  banner?: { level: "red" | "amber" | "green", text: string }
  counts?: { correction: number, confirm: number, housekeeping: number, match: number }
  premium_change?: { baseline: number | null, compared: number | null, change: number | null, percent: number | null }
  sources: { id: string, filename: string, role: PolicyCheckRole }[]
}

export type PolicyCheckGroup = {
  prepared_by: string | null
  checks: PolicyCheckEntry[]
}

export type PolicyCheckManifest = {
  viewer_sub: string
  groups: PolicyCheckGroup[]
}

export type PolicyCheckScope = ProposalScope

export type PolicyCheckChatMessage = RenewalSummaryChatMessage
export type PolicyCheckChatTurn = RenewalSummaryChatTurn

// CL Coverage Comparison (/coverage-comparison/*): staff drop two sets of quote/policy PDFs (each may
// hold several lines) and a background job builds a client-facing Word comparison
export type CoverageComparisonRole = "set_a" | "set_b"

export type CoverageComparisonAttachment = {
  id: string
  filename: string
  role: CoverageComparisonRole
  status: "processing" | "done" | "error"
  error?: string
  profile?: Omit<PolicyCheckProfile, "suggested_role">
}

export type CoverageComparisonEntry = {
  id: string
  client_name: string | null
  status: "running" | "failed" | "done"
  error?: string
  created_by: ProposalCreator
  prepared_by?: string | null
  generated_at: string
  finished_at?: string
  filename?: string
  sizeBytes?: number
  sets?: { a: string, b: string }
  premium?: { a: number | null, b: number | null, difference: number | null }
  key_points?: number
  sources: { id: string, filename: string, role: CoverageComparisonRole }[]
}

export type CoverageComparisonGroup = {
  prepared_by: string | null
  comparisons: CoverageComparisonEntry[]
}

export type CoverageComparisonManifest = {
  viewer_sub: string
  groups: CoverageComparisonGroup[]
}

export type CoverageComparisonScope = ProposalScope

export type CoverageComparisonChatMessage = RenewalSummaryChatMessage
export type CoverageComparisonChatTurn = RenewalSummaryChatTurn

// Coverage Gap (/coverage-gap/*): staff drop a commercial account's policy PDFs (one zone, every file
// is a "policy") plus optional account notes, and a background job builds an internal Word gap analysis
export type CoverageGapAttachment = {
  id: string
  filename: string
  role: "policy"
  status: "processing" | "done" | "error"
  error?: string
  profile?: Omit<PolicyCheckProfile, "suggested_role">
}

export type CoverageGapEntry = {
  id: string
  client_name: string | null
  status: "running" | "failed" | "done"
  error?: string
  created_by: ProposalCreator
  prepared_by?: string | null
  generated_at: string
  finished_at?: string
  filename?: string
  sizeBytes?: number
  sources: { id: string, filename: string, role: "policy" }[]
  has_notes: boolean
  // Only returned to the person who ran it
  notes?: string
  policies?: number
  counts?: { gap: number, confirm: number, high: number }
}

export type CoverageGapGroup = {
  prepared_by: string | null
  analyses: CoverageGapEntry[]
}

export type CoverageGapManifest = {
  viewer_sub: string
  groups: CoverageGapGroup[]
}

export type CoverageGapScope = ProposalScope

export type CoverageGapChatMessage = RenewalSummaryChatMessage
export type CoverageGapChatTurn = RenewalSummaryChatTurn

export type JobRun = {
  started_at: string
  finished_at: string
  ok: boolean
  summary: string | null
}

export type JobStatus = {
  job: string
  label: string
  schedule: string
  last_run: JobRun | null
  last_success_at: string | null
  overdue: boolean
  expected_at: string | null
  next_run_at: string | null
}

export type DownloadTool =
  | "cl-renewal-summary"
  | "renewal-premium-summaries"
  | "risk-profile"
  | "pl-renewal-premium-change"
  | "proposal-builder"
  | "policy-check"
  | "coverage-comparison"
  | "coverage-gap"
  | "pl-renewal-summary"
  | "download-report"

export type DownloadCounts = Partial<Record<DownloadTool | "chat-link", number>>

// Boxwood Assistant (POST /assistant/chat). Stateless: each turn sends the conversation so far.
export type AssistantMessage = { role: "user" | "assistant", content: string }
export type AssistantContext = { path: string, tool: string | null }
