import { NavLink, useLocation } from "react-router"
import { teamNavDescriptions } from "@components/team/containers/TeamContainer/utils"
import { useHandleToolName } from "./hooks"
import { handleToolContent } from "./utils"

export const ToolName = () => {
  const toolName = useHandleToolName()

  return (
    <h2 className="font-display text-3xl uppercase tracking-wide text-center text-primary my-8">{toolName}</h2>
  )
}

export const ToolNavLinks = () => {
  const { pathname } = useLocation()

  const descriptions = pathname.startsWith("/commercial") ?
    teamNavDescriptions[0] :
    teamNavDescriptions[1]

  return (
    <nav aria-label="Tool pages" className="mb-8 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
      {[...descriptions].map(([title, { to }]) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            isActive ?
              "font-semibold text-base-content no-underline" :
              "text-base-content/60 no-underline hover:underline"}>
          {title}
        </NavLink>
      ))}
    </nav>
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