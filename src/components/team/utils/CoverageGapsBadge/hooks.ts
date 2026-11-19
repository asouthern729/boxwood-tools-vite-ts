import { useState } from "react"

export const useHandleCoverageGapsBadge = () => {
  const [expanded, setExpanded] = useState(false)

  return { expanded, toggle: () => setExpanded((prev) => !prev) }
}
