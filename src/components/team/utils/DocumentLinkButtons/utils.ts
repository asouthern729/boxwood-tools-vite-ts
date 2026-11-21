import { DOC_PARAM } from "@utils/hooks"

// Types
import type { DocumentLink, DocumentTool } from "@context/App/types"

// The tool page each linked document opens on.
const TOOL_PATHS: Record<DocumentTool, string> = {
  "cl-renewal-summary": "/commercial/renewal-summary",
  "renewal-premium-summary": "/commercial/renewal-premium-summary",
}

export const documentPath = (tool: DocumentTool, id: string) =>
  `${ TOOL_PATHS[tool] }?${ DOC_PARAM }=${ encodeURIComponent(id) }`

// When a document links to several on one tool, the backend tells them apart in the label:
// "CL Renewal Summary (BOP 123, GL 456)" or "Renewal Premium Spreadsheet (Feb 2027)".
export const splitLinkLabel = (label: string) => {
  const match = label.match(/^(.*?) \((.+)\)$/)
  return match ? { base: match[1], detail: match[2] } : { base: label, detail: null }
}

export type LinkGroup = { tool: DocumentTool, label: string, links: DocumentLink[] }

// Links grouped by tool, in first-seen order; label is the tool's shared name for the menu button
export const groupLinks = (links: DocumentLink[]): LinkGroup[] => {
  const groups = new Map<DocumentTool, LinkGroup>()

  links.forEach((link) => {
    const group = groups.get(link.tool) ?? { tool: link.tool, label: splitLinkLabel(link.label).base, links: [] }
    group.links.push(link)
    groups.set(link.tool, group)
  })

  return [...groups.values()]
}
