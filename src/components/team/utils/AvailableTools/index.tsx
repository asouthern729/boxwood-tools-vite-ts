// Components
import * as Components from "./components"

type AvailableToolsProps = {
  tools: { name: string, description: string }[]
}

function AvailableTools({ tools }: AvailableToolsProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:flex-wrap">
      <Components.ToolsLabel />
      {tools.map((tool) => (
        <Components.ToolBadge
          key={tool.name}
          {...tool} />
      ))}
    </div>
  )
}

export default AvailableTools
