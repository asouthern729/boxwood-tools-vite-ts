import { useNavigate } from "react-router"
import { DOC_PARAM } from "@utils/hooks"

// Types
import type { DocumentLink, DocumentTool } from "@context/App/types"

// The tool page each linked document opens on.
const TOOL_PATHS: Record<DocumentTool, string> = {
  "cl-renewal-summary": "/commercial/renewal-summary",
  "renewal-premium-summary": "/commercial/renewal-premium-summary",
}

// A preview modal's buttons to the documents linked to it (the same policy terms on another tool) —
// each opens that tool's page with the linked document's preview already open.
function DocumentLinkButtons({ links }: { links?: DocumentLink[] }) {
  const navigate = useNavigate()

  if(!links?.length) return null

  return (
    <>
      {links.map((link) => (
        <button
          key={link.id}
          type="button"
          onClick={() => navigate(`${ TOOL_PATHS[link.tool] }?${ DOC_PARAM }=${ link.id }`)}
          className="btn btn-secondary">
            Open {link.label} →
        </button>
      ))}
    </>
  )
}

export default DocumentLinkButtons
