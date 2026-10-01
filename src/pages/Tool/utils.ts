// Types
import * as AppTypes from '@context/App/types'

// Components
import DownloadChangeReportContainer from '@components/personal/containers/DownloadChangeReportContainer'
import RenewalPremiumSummaryContainer from '@components/commercial/containers/RenewalPremiumSummaryContainer'
import PreRenewalRiskProfileContainer from '@components/commercial/containers/PreRenewalRiskProfileContainer'
import PremiumChangeToolContainer from '@components/personal/containers/PremiumChangeToolContainer'
import RenewalSummaryContainer from '@components/commercial/containers/RenewalSummaryContainer'
import PersonalRenewalSummaryContainer from '@components/personal/containers/RenewalSummaryContainer'

export const toolNames: Record<string, AppTypes.AllTools> = {
  "pre-renewal-risk-profile": "Pre-Renewal Risk Profile",
  "renewal-premium-summary": "Renewal Premium Summary",
  "renewal-summary": "Renewal Summary",
  "download-change-report": "Download Change Report",
  "premium-change-tool": "Premium Change Tool",
}

export const handleToolContent = (section: string, toolName: AppTypes.AllTools) => {
  switch(toolName) {
    case "Pre-Renewal Risk Profile":
      return PreRenewalRiskProfileContainer
    case "Renewal Premium Summary":
      return RenewalPremiumSummaryContainer
    case "Renewal Summary":
      return section === "personal" ? PersonalRenewalSummaryContainer : RenewalSummaryContainer
    case "Download Change Report":
      return DownloadChangeReportContainer
    case "Premium Change Tool":
      return PremiumChangeToolContainer
    default:
      return null
  }
}
// Mirrors the cron jobs in boxwood-mcp-ts (crontab -l / scripts/*.sh) — keep in sync if a schedule changes.
// Times are America/Chicago wall-clock; "last run" is the most recent scheduled time, not a confirmed job result.
const SCHEDULE_TZ = "America/Chicago"

type ToolSchedule = {
  label: string
  hour: number
  minute: number
  runsOn: (dayOfWeek: number, dayOfMonth: number) => boolean
}

const WEEKDAYS_8AM: ToolSchedule = { label: "Weekdays at 8:00 AM CT", hour: 8, minute: 0, runsOn: (dow) => dow >= 1 && dow <= 5 }
const MONTHLY_1ST_8AM: ToolSchedule = { label: "1st of each month at 8:00 AM CT", hour: 8, minute: 0, runsOn: (_dow, dom) => dom === 1 }

export const toolSchedules: Record<string, ToolSchedule> = {
  "/commercial/renewal-premium-summary": MONTHLY_1ST_8AM,
  "/commercial/pre-renewal-risk-profile": MONTHLY_1ST_8AM,
  "/commercial/renewal-summary": WEEKDAYS_8AM,
  "/personal/download-change-report": WEEKDAYS_8AM,
  "/personal/premium-change-tool": WEEKDAYS_8AM,
  "/personal/renewal-summary": WEEKDAYS_8AM,
}

const chicagoParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SCHEDULE_TZ, hourCycle: "h23",
    year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric",
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") }
}

// Converts a Chicago wall-clock time to an instant by measuring the zone offset at that moment
const chicagoTimeToDate = (year: number, month: number, day: number, hour: number, minute: number) => {
  const asUtc = Date.UTC(year, month - 1, day, hour, minute)
  const p = chicagoParts(new Date(asUtc))
  const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - asUtc
  return new Date(asUtc - offset)
}

export const getScheduleRuns = (schedule: ToolSchedule, now = new Date()) => {
  const today = chicagoParts(now)
  let lastRun: Date | null = null
  let nextRun: Date | null = null

  for(let offset = -40; offset <= 40; offset++) {
    const day = new Date(Date.UTC(today.year, today.month - 1, today.day + offset))
    if(!schedule.runsOn(day.getUTCDay(), day.getUTCDate())) continue

    const run = chicagoTimeToDate(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), schedule.hour, schedule.minute)
    if(run <= now) lastRun = run
    else if(!nextRun) nextRun = run
  }

  return { lastRun, nextRun }
}

export const formatScheduleRun = (date: Date | null) =>
  date ?
    date.toLocaleString("en-US", { timeZone: SCHEDULE_TZ, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) :
    "—"
