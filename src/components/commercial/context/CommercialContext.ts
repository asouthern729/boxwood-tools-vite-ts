import { createContext } from "react"

export type CommercialCtxValue = {
  showPastRenewals: boolean
  setShowPastRenewals: (value: boolean) => void
  currentMonthOnly: boolean
  setCurrentMonthOnly: (value: boolean) => void
  createdTodayOnly: boolean
  setCreatedTodayOnly: (value: boolean) => void
  searchQuery: string
  setSearchQuery: (value: string) => void
  order: string
  setOrder: (value: string) => void
}

export const CommercialCtx = createContext<CommercialCtxValue | null>(null)
