import { utils } from 'xlsx'

// Types
import type { WorkBook } from 'xlsx'

export const AVAILABLE_MCP_TOOLS = [
  { name: "Customer Lookup", description: "Look up a customer by name or ID, including contacts, policies, and related records." },
  { name: "Upcoming Renewals", description: "Find active policies renewing soon, filterable by producer, CSR, or carrier." },
  { name: "Renewal Premium Summary", description: "Build the Commercial Renewal Premium Summary workbook for one account's upcoming renewal." },
  { name: "Employee Lookup", description: "Look up an employee (producer/CSR) by name or code to resolve their rep code." }
]

export const formatTimestamp = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

export type PremiumSummaryRow = {
  coverage: string
  policyNumbers: string
  carrier: string
  current: number | null
  renewal: number | null
  percentChange: number | null
}

// Patrick's template (assets/templates/commercial-renewal-template.xlsx) is reused directly, so
// the "Coverage"/"TOTAL PREMIUM" markers and B/C/D/E column positions are stable across accounts —
// anchoring on that text rather than fixed row numbers survives minor template row shifts.
export const extractKeyPremiumRows = (workbook: WorkBook): PremiumSummaryRow[] => {
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if(!sheet?.["!ref"]) return []

  const range = utils.decode_range(sheet["!ref"])
  const cellAt = (r: number, col: string) => sheet[`${ col }${ r + 1 }`]?.v

  let headerRow = -1
  for(let r = range.s.r; r <= range.e.r; r++) {
    if(String(cellAt(r, "B") ?? "").trim().toLowerCase() === "coverage") {
      headerRow = r
      break
    }
  }
  if(headerRow === -1) return []

  const rows: PremiumSummaryRow[] = []
  for(let r = headerRow + 1; r <= range.e.r; r++) {
    const label = String(cellAt(r, "B") ?? "").trim()
    if(!label || label.toLowerCase() === "total premium") break

    const [coverage, policyNumbers] = label.split(/ {2,}/)
    const current = typeof cellAt(r, "C") === "number" ? cellAt(r, "C") as number : null
    const renewal = typeof cellAt(r, "E") === "number" ? cellAt(r, "E") as number : null
    const carrier = String(cellAt(r, "D") ?? "").trim()

    if(current === null && renewal === null && !policyNumbers) continue

    const percentChange = current !== null && current !== 0 && renewal !== null ?
      ((renewal - current) / current) * 100 :
      null

    rows.push({ coverage: coverage ?? label, policyNumbers: policyNumbers ?? "", carrier, current, renewal, percentChange })
  }

  return rows
}

export const formatCurrency = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })

export const formatPercentChange = (n: number) =>
  `${ n > 0 ? "+" : "" }${ n.toFixed(1) }%`
