// Types
import type { LineStatus } from "@context/App/types"

type LineItemStatusProps = {
  lines?: LineStatus[]
  // Hover text for a line still waiting, e.g. "Awaiting renewal terms"
  pendingTitle: string
  // Hover text for the badge shown once every line is in
  completeTitle: string
}

// Each line of business on a renewal document, ticked once its renewal values are in — collapses to a
// single "Complete" badge when every line is. Shared by the CL Renewal Summary (renewal terms) and the
// Renewal Premium Spreadsheet (renewal premiums). Absent lines means the entry predates the backend
// recording them, so nothing shows.
function LineItemStatus({ lines, pendingTitle, completeTitle }: LineItemStatusProps) {
  if(!lines?.length) return null

  if(lines.every((line) => line.renewed)) return (
    <div className="mt-1">
      <CompleteBadge title={completeTitle} />
    </div>
  )

  return (
    <ul className="mt-1 flex flex-wrap gap-x-3 text-sm">
      {lines.map((line) => (
        <LineItem
          key={`${ line.polno }-${ line.title }`}
          line={line}
          pendingTitle={pendingTitle} />
      ))}
    </ul>
  )
}

const LineItem = ({ line, pendingTitle }: { line: LineStatus, pendingTitle: string }) => {
  const title = line.renewed ? "Renewed" : pendingTitle
  const textColor = line.renewed ? "text-success/70" : "text-base-content/35"

  return (
    <li title={title} className={textColor}>
      {line.renewed && "✓ "}{line.title}
    </li>
  )
}

const CompleteBadge = ({ title }: { title: string }) => (
  <span title={title} className="badge badge-soft badge-success badge-sm cursor-default rounded-sm border-success/30 text-success/70 not-italic">
    ✓ Complete
  </span>
)

export default LineItemStatus
