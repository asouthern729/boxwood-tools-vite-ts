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