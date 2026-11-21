import { useState } from "react"
import { usePersistedState } from "@utils/hooks"
import { PersonalCtx } from "./PersonalContext"
import { SUMMARY_ORDER_OPTIONS, isUpcomingRenewalMonth } from "@components/commercial/context/utils"

// Types
import type { ReactNode } from "react"

const ORDER_STORAGE_KEY = "boxwood_personal_order"
const PAST_RENEWALS_STORAGE_KEY = "boxwood_personal_show_past_renewals"
const RENEWAL_MONTH_STORAGE_KEY = "boxwood_personal_renewal_month"
const CSR_STORAGE_KEY = "boxwood_personal_csr"

export const PersonalProvider = ({ children }: { children: ReactNode }) => {
  const [storedShowPastRenewals, setStoredShowPastRenewals] = usePersistedState(PAST_RENEWALS_STORAGE_KEY, "false")
  const showPastRenewals = storedShowPastRenewals === "true"
  const setShowPastRenewals = (value: boolean) => setStoredShowPastRenewals(String(value))
  // A month saved before the calendar rolled over is no longer offered, so it stops filtering
  const [storedRenewalMonth, setRenewalMonth] = usePersistedState(RENEWAL_MONTH_STORAGE_KEY, "")
  const renewalMonth = isUpcomingRenewalMonth(storedRenewalMonth) ? storedRenewalMonth : ""
  const [csrFilter, setCsrFilter] = usePersistedState(CSR_STORAGE_KEY, "")
  const [createdTodayOnly, setCreatedTodayOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [order, setOrder] = usePersistedState(ORDER_STORAGE_KEY, SUMMARY_ORDER_OPTIONS[0].value)

  return (
    <PersonalCtx.Provider value={{ showPastRenewals, setShowPastRenewals, renewalMonth, setRenewalMonth, csrFilter, setCsrFilter, createdTodayOnly, setCreatedTodayOnly, searchQuery, setSearchQuery, order, setOrder }}>
      {children}
    </PersonalCtx.Provider>
  )
}
