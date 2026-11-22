import { createPortal } from "react-dom"
import { AnimatePresence } from "framer-motion"
import { useIsSignedIn } from "@components/layout/LogoutButton/hooks"
import { useAssistantDrawer } from "./hooks"
import { useAssistantChat } from "./chatHooks"

// Components
import * as Components from "./components"

// The Boxwood Assistant: a launcher in the page's top-right actions for signed-in users, opening a
// side drawer. The drawer is portalled to <body> so it isn't trapped in that row's stacking context.
function AssistantDrawer() {
  const isSignedIn = useIsSignedIn()
  const { open, show, hide } = useAssistantDrawer()
  const chat = useAssistantChat()

  if(!isSignedIn) return null

  return (
    <>
      <AnimatePresence initial={false}>
        {!open && <Components.LauncherButton key="launcher" onClick={show} />}
      </AnimatePresence>
      {createPortal(
        <AnimatePresence>
          {open && <Components.Panel key="panel" chat={chat} onClose={hide} />}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

export default AssistantDrawer
