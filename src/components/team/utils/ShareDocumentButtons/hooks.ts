import { useEffect, useState } from "react"
import { currentDocumentUrl } from "./utils"

const FEEDBACK_MS = 2000

export const useCopyDocumentLink = () => {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle")

  useEffect(() => {
    if(status === "idle") return
    const timer = setTimeout(() => setStatus("idle"), FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [status])

  // The Clipboard API needs a secure context (https or localhost); report rather than fail silently
  const copy = () => navigator.clipboard.writeText(currentDocumentUrl())
    .then(() => setStatus("copied"))
    .catch(() => setStatus("failed"))

  return { copy, status }
}
