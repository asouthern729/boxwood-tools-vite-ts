import { createPortal } from "react-dom"
import { FOOTER_MESSAGE_SLOT_ID } from "./utils"

// Components
import FadeOut from "@utils/animations/FadeOut"

// Renders into the slot Layout reserves directly above the Footer
function FooterMessage({ message }: { message: string | null }) {
  const slot = document.getElementById(FOOTER_MESSAGE_SLOT_ID)
  if(!message || !slot) return null

  return createPortal(
    <FadeOut duration={4} className="text-sm text-primary italic">
      <span>{message}</span>
    </FadeOut>,
    slot
  )
}

export default FooterMessage
