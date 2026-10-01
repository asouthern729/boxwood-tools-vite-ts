import { createContext } from "react"

export type PersonalCtxValue = {
  showPastRenewals: boolean
  setShowPastRenewals: (value: boolean) => void
  currentMonthOnly: boolean
  setCurrentMonthOnly: (value: boolean) => void
  order: string
  setOrder: (value: string) => void
}

export const PersonalCtx = createContext<PersonalCtxValue | null>(null)
