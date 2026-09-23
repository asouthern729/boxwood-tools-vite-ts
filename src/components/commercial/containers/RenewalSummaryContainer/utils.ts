export const AVAILABLE_MCP_TOOLS = [
  { name: "Customer Lookup", description: "Look up a customer by name or ID, including contacts, policies, and related records." },
  { name: "Upcoming Renewals", description: "Find active policies renewing soon, filterable by producer, CSR, or carrier." },
  { name: "Renewal Summary", description: "Build the CL Renewal Summary Word document (exposures plus coverage limits/deductibles by line of business) for one account's upcoming renewal." },
  { name: "Employee Lookup", description: "Look up an employee (producer/CSR) by name or code to resolve their rep code." }
]

export const formatTimestamp = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}
