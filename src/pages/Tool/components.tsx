import { useHandleToolName } from "./hooks"
import { handleToolContent } from "./utils"

export const ToolName = () => {
  const toolName = useHandleToolName()

  return (
    <h2 className="font-display text-3xl uppercase tracking-wide text-center text-primary my-8">{toolName}</h2>
  )
}

export const ToolContent = () => {
  const toolName = useHandleToolName()
  const Component = handleToolContent(toolName)

  return (
    <Component />
  )
}