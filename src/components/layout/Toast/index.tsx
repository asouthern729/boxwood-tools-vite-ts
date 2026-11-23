import { useEffect, useRef } from "react"
import { Toaster, toast } from "sonner"
import { useHandleToolName } from "@pages/Tool/hooks"

// App-wide toasts (sonner): bottom-left, black with white Teko text, 2s. Call `toast("...")` from
// "sonner" anywhere to show one.
function Toasts() {
  return (
    <>
      <Toaster
        position="bottom-left"
        duration={2000}
        visibleToasts={1}
        toastOptions={{
          style: {
            background: "#000",
            color: "#fff",
            border: "none",
            // Tailwind rounded-sm (inline, since sonner's own radius outranks utility classes)
            borderRadius: "0.25rem",
            fontFamily: "var(--font-display)",
            fontSize: "1.5rem",
            letterSpacing: "0.025em",
            lineHeight: 1,
            width: "auto",
            whiteSpace: "nowrap",
            paddingBlock: "0.75rem 0.5rem",
          },
        }}
      />
      <ToolChangeToast />
    </>
  )
}

// Toasts the tool's name whenever the user moves to a different tool page (not on first load)
const ToolChangeToast = () => {
  const toolName = useHandleToolName()
  const previous = useRef(toolName)

  useEffect(() => {
    if(toolName && toolName !== previous.current) toast(<><span className="opacity-70">Showing</span> {toolName}</>, { id: "tool-change" })
    previous.current = toolName
  }, [toolName])

  return null
}

export default Toasts
