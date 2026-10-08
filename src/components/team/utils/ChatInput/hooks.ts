import { useRef, useEffect } from "react"

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))

export const useFocusOnSlash = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if(e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return
      if(isTypingTarget(e.target) || document.querySelector("dialog[open]")) return

      e.preventDefault()
      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      textareaRef.current?.focus({ preventScroll: true })
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return textareaRef
}
