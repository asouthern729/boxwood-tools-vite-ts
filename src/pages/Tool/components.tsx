import { useLocation } from "react-router"
import { useHandleToolName } from "./hooks"
import { handleToolContent } from "./utils"

export const ToolName = () => {
  const toolName = useHandleToolName()

  return (
    <h2 className="font-display text-3xl uppercase tracking-wide text-center text-primary my-8">{toolName}</h2>
  )
}

export const ToolContent = () => {
  const { pathname } = useLocation()
  const toolName = useHandleToolName()
  const Component = handleToolContent(pathname.split('/')[1], toolName)

  if(!Component) return null

  return (
    <Component />
  )
}