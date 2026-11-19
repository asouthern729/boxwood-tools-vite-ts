import { useHandleCoverageGapsBadge } from "./hooks"
import { formatGap, gapCountLabel } from "./utils"

// Types
import type { CoverageGap } from "@context/App/types"

// Components
import * as Components from "./components"

// CSR-only prompt: lines on the policy in AMS360 that have no section in the document. The document
// itself is fine to open and send, so this stays a quiet amber chip rather than an error.
function CoverageGapsBadge({ gaps }: { gaps?: CoverageGap[] }) {
  const { expanded, toggle } = useHandleCoverageGapsBadge()

  if(!gaps?.length) return null

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        title={gaps.map(formatGap).join("\n")}
        className="badge badge-sm cursor-pointer gap-1 rounded-sm border-amber-300 bg-amber-50 text-amber-800 not-italic hover:bg-amber-100">
          <span aria-hidden="true">⚠</span>
          {gapCountLabel(gaps.length)}
      </button>
      <Components.GapList
        visible={expanded}
        gaps={gaps} />
    </div>
  )
}

export default CoverageGapsBadge
