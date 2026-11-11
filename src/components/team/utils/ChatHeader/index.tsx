// Components
import * as Components from "./components"

function ChatHeader() {
  return (
    <div className="flex items-center justify-between gap-2">
      <Components.Title />
      <Components.ShortcutHint />
    </div>
  )
}

export default ChatHeader
