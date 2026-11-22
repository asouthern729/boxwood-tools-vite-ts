import { useAssistant } from "@components/assistant/AssistantContext"

// Components
import * as Components from "./components"

type AvailableToolsProps = {
  tools: { name: string, description: string }[]
}

// The chat tools a page's Claude chat can use; each badge asks the Boxwood Assistant to explain it
function AvailableTools({ tools }: AvailableToolsProps) {
  const { ask, chat } = useAssistant()

  return (
    <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:flex-wrap">
      <Components.ToolsLabel />
      {tools.map((tool) => (
        <Components.ToolBadge
          key={tool.name}
          {...tool}
          disabled={chat.isPending}
          onClick={() => ask(`What does the ${ tool.name } tool in this page's chat do, and how do I use it?`)} />
      ))}
    </div>
  )
}

export default AvailableTools
