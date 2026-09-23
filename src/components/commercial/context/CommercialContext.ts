import { createContext } from "react"

export type CommercialCtxValue = {
  showPastRenewals: boolean
  setShowPastRenewals: (value: boolean) => void
  order: string
  setOrder: (value: string) => void
}

export const CommercialCtx = createContext<CommercialCtxValue | null>(null)
