import type { CoverageGap } from "@context/App/types"

export const formatGap = (gap: CoverageGap) => `${ gap.polno } ${ gap.line }: no ${ gap.missing }`

export const gapCountLabel = (count: number) => `Check: ${ count } line${ count === 1 ? "" : "s" } missing`
