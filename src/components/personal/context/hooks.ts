import { useContext } from "react"
import { PersonalCtx } from "./PersonalContext"

export const usePersonalCtx = () => {
  const ctx = useContext(PersonalCtx)
  if(!ctx) throw new Error("usePersonalCtx must be used within a PersonalProvider")
  return ctx
}
