import { formatGap } from "./utils"

// Types
import type { CoverageGap } from "@context/App/types"

export const GapList = ({ visible, gaps }: { visible: boolean, gaps: CoverageGap[] }) => {
  if(!visible) return null

  return (
    <ul className="mt-1 flex flex-col gap-0.5 text-xs text-amber-800">
      {gaps.map((gap) => (
        <li key={`${ gap.polno }-${ gap.line }-${ gap.missing }`}>
          {formatGap(gap)}
        </li>
      ))}
    </ul>
  )
}
