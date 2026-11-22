import { createContext, useContext } from "react"
import { useAssistantDrawer } from "@components/assistant/AssistantDrawer/hooks"
import { useAssistantChat } from "@components/assistant/AssistantDrawer/chatHooks"

type AssistantValue = ReturnType<typeof useAssistantDrawer> & {
  chat: ReturnType<typeof useAssistantChat>
  // Opens the drawer and sends a question, e.g. from a tool page's "Learn about this tool" button
  ask: (question: string) => void
}

const AssistantCtx = createContext<AssistantValue | null>(null)

// Holds the Boxwood Assistant's drawer state and conversation above the whole layout, so anything on
// a page can open the drawer or ask it something. Must sit inside the router (the chat reads the route).
export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const drawer = useAssistantDrawer()
  const chat = useAssistantChat()

  const ask = (question: string) => {
    drawer.show()
    chat.send(question)
  }

  return (
    <AssistantCtx.Provider value={{ ...drawer, chat, ask }}>
      {children}
    </AssistantCtx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAssistant = () => {
  const value = useContext(AssistantCtx)
  if(!value) throw new Error("useAssistant must be used inside AssistantProvider")
  return value
}
