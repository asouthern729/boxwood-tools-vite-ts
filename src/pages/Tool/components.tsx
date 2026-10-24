import { Fragment, useState } from "react"
import { NavLink, useLocation } from "react-router"
import { AnimatePresence, MotionConfig, motion } from "framer-motion"
import { teamNavDescriptions } from "@components/team/containers/TeamContainer/utils"
import { useHandleToolName, useToolJobStatuses } from "./hooks"
import { handleToolContent, toolSchedules, getScheduleRuns, formatScheduleRun, getJobLastRun, splitJobSummary } from "./utils"

// Types
import type * as AppTypes from "@context/App/types"
import type { ToolSchedule } from "./utils"

const HEADER_TRANSITION = { type: "spring", stiffness: 400, damping: 40 } as const

export const ToolHeader = () => {
  const { isLoading } = useToolJobStatuses()
  const [ready, setReady] = useState(false)

  // Mount once the first run details are ready so the box and its contents appear together
  if(!ready && !isLoading) setReady(true)
  if(!ready) return null

  return (
    <MotionConfig reducedMotion="user" transition={HEADER_TRANSITION}>
      <ToolHeaderBox />
    </MotionConfig>
  )
}

const ToolHeaderBox = () => (
  <motion.header
    layout
    initial={{ opacity: 0, y: -12 }}
    animate={{ opacity: 1, y: 0 }}
    className="mx-auto my-8 flex w-fit max-w-full flex-col items-center gap-3 rounded-box border-t border-l border-r-2 border-b-2 border-t-neutral-content/50 border-l-neutral-content/50 border-r-primary border-b-primary bg-base-100/60 px-10 py-6 backdrop-blur-md">
    <ToolName />
    <ToolSchedule />
  </motion.header>
)

const ToolName = () => {
  const toolName = useHandleToolName()

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.h2
        key={toolName}
        layout="position"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="font-display text-3xl uppercase tracking-wide text-center text-primary">
        {toolName}
      </motion.h2>
    </AnimatePresence>
  )
}

const ToolSchedule = () => {
  const { pathname } = useLocation()
  const { data: jobs, isError } = useToolJobStatuses()
  const schedule = toolSchedules[pathname]

  const content = jobs?.length ?
    <JobsSchedule jobs={jobs} /> :
    isError && schedule ?
      <FallbackSchedule schedule={schedule} /> :
      null

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {content && (
        <motion.div
          key={pathname}
          layout="position"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}>
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const JobsSchedule = ({ jobs }: { jobs: AppTypes.JobStatus[] }) => (
  <div className="flex flex-col items-center gap-4 text-xs">
    {jobs.map((job, i) => (
      <Fragment key={job.job}>
        {i > 0 && <hr className="w-full border-neutral-content/30" />}
        <JobBadges job={job} showLabel={jobs.length > 1} />
      </Fragment>
    ))}
  </div>
)

const FallbackSchedule = ({ schedule }: { schedule: ToolSchedule }) => {
  const { lastRun, nextRun } = getScheduleRuns(schedule)

  return (
    <div title={`Runs automatically: ${ schedule.label }`} className="flex flex-wrap justify-center gap-2 text-xs">
      <span className="badge badge-ghost badge-sm gap-1.5">
        <ClockIcon />
        Last run {formatScheduleRun(lastRun)}
      </span>
      <span className="badge badge-neutral dark:badge-outline dark:border-neutral-content dark:text-neutral-content badge-sm gap-1.5">
        <ClockIcon />
        Next run {formatScheduleRun(nextRun)}
      </span>
    </div>
  )
}

const JobBadges = ({ job, showLabel }: { job: AppTypes.JobStatus, showLabel: boolean }) => {
  const lastRun = getJobLastRun(job)
  const summary = job.last_run?.summary

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div title={`Runs automatically: ${ job.schedule }`} className="flex flex-wrap items-center justify-center gap-2">
        {showLabel && <span className="text-base-content/60">{job.label}</span>}
        <span className={`badge badge-sm gap-1.5 ${ lastRun.warn ? "badge-warning" : "badge-ghost" }`}>
          <ClockIcon />
          {lastRun.text}
        </span>
        <span className="badge badge-neutral dark:badge-outline dark:border-neutral-content dark:text-neutral-content badge-sm gap-1.5">
          <ClockIcon />
          Next run {formatScheduleRun(job.next_run_at ? new Date(job.next_run_at) : null)}
        </span>
      </div>
      {summary && (
        <p className={`text-center ${ job.last_run?.ok ? "text-base-content/60" : "text-error" }`}>
          {job.last_run?.ok ? <JobSummary job={job.job} summary={summary} /> : summary}
        </p>
      )}
    </div>
  )
}

const JobSummary = ({ job, summary }: { job: string, summary: string }) => (
  splitJobSummary(job, summary).map((part, i) => {
    if(i % 2 === 0) return part

    return (
      <b key={i} className={part.startsWith("Built") ? "text-success" : "text-info"}>{part}</b>
    )
  })
)

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