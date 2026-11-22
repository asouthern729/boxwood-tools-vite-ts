import { useEffect, useState } from "react"

const OPEN_KEY = "boxwood_assistant_open"

// Open/closed state for the drawer, kept per tab (sessionStorage, like the chat history will be)
// so it stays open across route changes and reloads. Escape closes it.
export const useAssistantDrawer = () => {
  const [open, setOpen] = useState(() => {
    try { return sessionStorage.getItem(OPEN_KEY) === "1" } catch { return false }
  })

  useEffect(() => {
    try { sessionStorage.setItem(OPEN_KEY, open ? "1" : "0") } catch { /* storage blocked: state just won't persist */ }
  }, [open])

  useEffect(() => {
    if(!open) return
    const onKey = (e: KeyboardEvent) => { if(e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return { open, show: () => setOpen(true), hide: () => setOpen(false) }
}
