import { useState } from "react"
import { usePersistedState } from "@utils/hooks"
import { CommercialCtx } from "./CommercialContext"
import { SUMMARY_ORDER_OPTIONS } from "./utils"

// Types
import type { ReactNode } from "react"

const ORDER_STORAGE_KEY = "boxwood_commercial_order"

export const CommercialProvider = ({ children }: { children: ReactNode }) => {
  const [showPastRenewals, setShowPastRenewals] = useState(false)
  const [currentMonthOnly, setCurrentMonthOnly] = useState(false)
  const [createdTodayOnly, setCreatedTodayOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [order, setOrder] = usePersistedState(ORDER_STORAGE_KEY, SUMMARY_ORDER_OPTIONS[0].value)

  return (
    <CommercialCtx.Provider value={{ showPastRenewals, setShowPastRenewals, currentMonthOnly, setCurrentMonthOnly, createdTodayOnly, setCreatedTodayOnly, searchQuery, setSearchQuery, order, setOrder }}>
      {children}
    </CommercialCtx.Provider>
  )
}
