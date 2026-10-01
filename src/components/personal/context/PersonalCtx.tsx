import { useState } from "react"
import { usePersistedState } from "@utils/hooks"
import { PersonalCtx } from "./PersonalContext"
import { SUMMARY_ORDER_OPTIONS } from "@components/commercial/context/utils"

// Types
import type { ReactNode } from "react"

const ORDER_STORAGE_KEY = "boxwood_personal_order"

export const PersonalProvider = ({ children }: { children: ReactNode }) => {
  const [showPastRenewals, setShowPastRenewals] = useState(false)
  const [currentMonthOnly, setCurrentMonthOnly] = useState(false)
  const [order, setOrder] = usePersistedState(ORDER_STORAGE_KEY, SUMMARY_ORDER_OPTIONS[0].value)

  return (
    <PersonalCtx.Provider value={{ showPastRenewals, setShowPastRenewals, currentMonthOnly, setCurrentMonthOnly, order, setOrder }}>
      {children}
    </PersonalCtx.Provider>
  )
}
