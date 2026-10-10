// Types
import type * as AppTypes from "@context/App/types"
import type { OrderingOption } from "@components/team/utils/Ordering"
import type { DropFileKind } from "@components/team/utils/PdfDropZone/utils"

export const AVAILABLE_MCP_TOOLS = [
  { name: "Customer Lookup", description: "Look up a customer by name or ID, including contacts, policies, and related records." },
  { name: "Proposal Builder", description: "Build a branded proposal Word document from the carrier quotes and AMS360 proposals dropped into this chat." },
]

export const ACCEPTED_FILES: DropFileKind[] = ["pdf", "docx"]

export const PROPOSAL_ORDER_OPTIONS: OrderingOption[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "client_name_asc", label: "Client Name (A–Z)" },
  { value: "client_name_desc", label: "Client Name (Z–A)" },
]

const lastActivity = (proposal: AppTypes.ProposalManifestEntry) => proposal.last_refreshed_at ?? proposal.generated_at

export const sortProposals = (proposals: AppTypes.ProposalManifestEntry[], order: string) => {
  const sorted = [...proposals]
  switch(order) {
    case "oldest": return sorted.sort((a, b) => lastActivity(a).localeCompare(lastActivity(b)))
    case "client_name_asc": return sorted.sort((a, b) => a.client_name.localeCompare(b.client_name))
    case "client_name_desc": return sorted.sort((a, b) => b.client_name.localeCompare(a.client_name))
    default: return sorted.sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)))
  }
}

export const filterProposals = (groups: AppTypes.ProposalGroup[], query: string) => {
  const needle = query.trim().toLowerCase()
  if(!needle) return groups

  return groups
    .map((group) => ({ ...group, proposals: group.proposals.filter((p) => p.client_name.toLowerCase().includes(needle)) }))
    .filter((group) => group.proposals.length > 0)
}

export const SOURCE_LABELS: Record<AppTypes.ProposalSourceKind, string> = {
  quote_pdf: "Quote",
  ams_docx: "AMS360",
  ams_pdf: "AMS360",
}

export const formatTimestamp = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}
