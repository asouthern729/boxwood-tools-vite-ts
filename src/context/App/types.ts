export type CommercialTools =
  | "Pre-Renewal Risk Profile"
  | "Renewal Premium Summary"
  | "Renewal Summary"

export type PersonalTools =
  | "Download Change Report"
  | "Premium Change Tool"
  | "Renewal Summary"

export type AllTools = CommercialTools|PersonalTools

export type ToolOutputs =
  | "xlsx"
  | "docx"

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

export type RenewalPremiumSummaryManifestEntry = {
  filename: string
  generated_at: string
  last_refreshed_at?: string
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

export type RenewalPremiumSummaryRefreshChange = {
  row: number
  polnos: string[]
  field: "current" | "renewal"
  old_value: number | null
  new_value: number
}

export type RenewalPremiumSummaryRefreshSkippedRow = {
  row: number
  polnos: string[]
  reason: string
}

export type RenewalPremiumSummaryRefreshResult = {
  filename: string
  refreshed_at: string
  changes: RenewalPremiumSummaryRefreshChange[]
  skipped_rows: RenewalPremiumSummaryRefreshSkippedRow[]
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