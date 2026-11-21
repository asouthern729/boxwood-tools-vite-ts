import { DOC_PARAM } from "@utils/hooks"

// Types
import type { DocumentTool } from "@context/App/types"

// The tool page each linked document opens on.
const TOOL_PATHS: Record<DocumentTool, string> = {
  "cl-renewal-summary": "/commercial/renewal-summary",
  "renewal-premium-summary": "/commercial/renewal-premium-summary",
}

export const documentPath = (tool: DocumentTool, id: string) =>
  `${ TOOL_PATHS[tool] }?${ DOC_PARAM }=${ encodeURIComponent(id) }`
