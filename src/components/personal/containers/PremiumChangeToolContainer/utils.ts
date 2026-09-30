// Types
import type { WorkBook } from 'xlsx'
import type * as AppTypes from '@context/App/types'

export const AVAILABLE_MCP_TOOLS = [
  { name: "Customer Lookup", description: "Look up a customer by name or ID, including contacts, policies, and related records." },
  { name: "Upcoming Renewals", description: "Find active policies renewing soon, filterable by producer, CSR, or carrier." },
  { name: "Renewal Premium Change", description: "Fill the Renewal Calculator workbook with current vs renewal premium per line of business for one client's renewal." },
  { name: "Employee Lookup", description: "Look up an employee (producer/CSR) by name or code to resolve their rep code." }
]

export const formatTimestamp = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

export type PremiumChangeRow = {
  lob: string
  current: number
  renewal: number
  termIncrease: number | null
  monthlyIncrease: number | null
  percentChange: number | null
}

export type PremiumChangeTable = {
  headers: string[]
  rows: PremiumChangeRow[]
  totals: PremiumChangeRow | null
}

// Employees' Renewal Calculator template: annual table A2:F16, six-month table J3:O17
const TABLE_LAYOUT = {
  annual: { cols: ["A", "B", "C", "D", "E", "F"], headerRow: 2, firstRow: 3, totalsRow: 16 },
  six_month: { cols: ["J", "K", "L", "M", "N", "O"], headerRow: 3, firstRow: 4, totalsRow: 17 },
}

export const extractPremiumChangeTable = (workbook: WorkBook, term: AppTypes.PersonalPremiumChangeManifestEntry["term"]): PremiumChangeTable => {
  const sheet = workbook.Sheets["Sheet1"] ?? workbook.Sheets[workbook.SheetNames[0]]
  const { cols, headerRow, firstRow, totalsRow } = TABLE_LAYOUT[term]
  const cellAt = (col: string, r: number) => sheet?.[`${ col }${ r }`]?.v
  const numAt = (col: string, r: number) => typeof cellAt(col, r) === "number" ? cellAt(col, r) as number : null

  const readRow = (r: number): PremiumChangeRow => {
    const current = numAt(cols[1], r) ?? 0
    const renewal = numAt(cols[2], r) ?? 0

    return {
      lob: String(cellAt(cols[0], r) ?? "").trim(),
      current,
      renewal,
      termIncrease: numAt(cols[3], r),
      monthlyIncrease: numAt(cols[4], r),
      percentChange: current !== 0 ? ((renewal - current) / current) * 100 : null,
    }
  }

  const headers = cols.map((col) => String(cellAt(col, headerRow) ?? "").trim())
  const rows: PremiumChangeRow[] = []
  for(let r = firstRow; r < totalsRow; r++) {
    const row = readRow(r)
    if(row.lob && (row.current !== 0 || row.renewal !== 0)) rows.push(row)
  }

  return { headers, rows, totals: sheet ? readRow(totalsRow) : null }
}

export const formatCurrency = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" })

export const formatPercentChange = (n: number) =>
  `${ n > 0 ? "+" : "" }${ n.toFixed(2) }%`
