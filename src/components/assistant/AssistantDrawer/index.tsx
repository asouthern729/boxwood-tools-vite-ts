import { createPortal } from "react-dom"
import { AnimatePresence } from "framer-motion"
import { useIsSignedIn } from "@components/layout/LogoutButton/hooks"
import { useAssistant } from "@components/assistant/AssistantContext"

// Components
import * as Components from "./components"

function AssistantDrawer() {
  const isSignedIn = useIsSignedIn()
  const { open, show, hide, chat } = useAssistant()

  if(!isSignedIn) return null

  return (
    <>
      <AnimatePresence initial={false}>
        {!open && 
          <Components.LauncherButton 
            key="launcher" 
            onClick={show} />}
      </AnimatePresence>
      {createPortal(
        <AnimatePresence>
          {open && 
            <Components.Panel 
              key="panel" 
              chat={chat} 
              onClose={hide} />}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

export default AssistantDrawer
