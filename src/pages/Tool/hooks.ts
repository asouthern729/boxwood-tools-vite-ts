import { useLocation } from "react-router"
import { toolNames } from "./utils"

export const useHandleToolName = () => {
  const { pathname } = useLocation()

  const toolName = toolNames[pathname.split('/')[2]]

  return toolName
}