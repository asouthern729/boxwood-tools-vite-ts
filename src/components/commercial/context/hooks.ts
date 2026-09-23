import { useContext } from "react"
import { CommercialCtx } from "./CommercialContext"

export const useCommercialCtx = () => {
  const ctx = useContext(CommercialCtx)
  if(!ctx) throw new Error("useCommercialCtx must be used within a CommercialProvider")
  return ctx
}
