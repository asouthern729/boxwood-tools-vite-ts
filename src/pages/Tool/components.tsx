import { NavLink, useLocation } from "react-router"
import { teamNavDescriptions } from "@components/team/containers/TeamContainer/utils"
import { useHandleToolName } from "./hooks"
import { handleToolContent, toolSchedules, getScheduleRuns, formatScheduleRun } from "./utils"

export const ToolName = () => {
  const toolName = useHandleToolName()

  return (
    <h2 className="font-display text-3xl uppercase tracking-wide text-center text-primary my-8">{toolName}</h2>
  )
}

export const ToolSchedule = () => {
  const { pathname } = useLocation()
  const schedule = toolSchedules[pathname]

  if(!schedule) return null

  const { lastRun, nextRun } = getScheduleRuns(schedule)

  return (
    <div title={`Runs automatically: ${ schedule.label }`} className="-mt-4 mb-6 flex flex-wrap justify-center gap-2 text-xs">
      <span className="badge badge-ghost badge-sm gap-1.5">
        <ClockIcon />
        Last run {formatScheduleRun(lastRun)}
      </span>
      <span className="badge badge-primary dark:badge-outline badge-sm gap-1.5">
        <ClockIcon />
        Next run {formatScheduleRun(nextRun)}
      </span>
    </div>
  )
}

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

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