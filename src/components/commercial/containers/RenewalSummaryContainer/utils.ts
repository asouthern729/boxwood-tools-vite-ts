// Types
import type * as AppTypes from "@context/App/types"
import type { DropFileKind } from "@components/team/utils/PdfDropZone/utils"

export const AVAILABLE_MCP_TOOLS = [
  { name: "Customer Lookup", description: "Look up a customer by name or ID, including contacts, policies, and related records." },
  { name: "Upcoming Renewals", description: "Find active policies renewing soon, filterable by producer, CSR, or carrier." },
  { name: "CL Renewal Summary", description: "Build the CL Renewal Summary Word document (exposures plus coverage limits/deductibles by line of business) for one account's upcoming renewal." },
  { name: "Employee Lookup", description: "Look up an employee (producer/CSR) by name or code to resolve their rep code." }
]

export const formatTimestamp = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

// Carrier quotes can be a PDF or an Excel workbook
export const QUOTE_FILES: DropFileKind[] = ["pdf", "xlsx"]

export const QUOTE_HELP_TEXT = "Check sections added from a quote against the quote before sending."

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

export const formatQuoteLine = (line: AppTypes.RenewalSummaryQuoteLine) =>
  [line.title, line.carrier, line.annual_premium == null ? null : currency.format(line.annual_premium)]
    .filter(Boolean)
    .join(" — ")
