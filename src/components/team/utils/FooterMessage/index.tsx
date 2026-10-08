import { createPortal } from "react-dom"
import { FOOTER_MESSAGE_SLOT_ID } from "./utils"

// Components
import FadeOut from "@utils/animations/FadeOut"

// Renders into the slot Layout reserves directly above the Footer
function FooterMessage({ message, error = false }: { message: string | null, error?: boolean }) {
  const slot = document.getElementById(FOOTER_MESSAGE_SLOT_ID)
  if(!message || !slot) return null

  const textColor = error ? "text-error" : "text-primary"

  return createPortal(
    <FadeOut duration={4} className={`text-sm italic ${ textColor }`}>
      <span>{message}</span>
    </FadeOut>,
    slot
  )
}

export default FooterMessage
