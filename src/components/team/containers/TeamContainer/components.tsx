import { Link } from "react-router"
import xlsxIcon from "@assets/icons/xlsx/xlsx.svg"
import docxIcon from "@assets/icons/docx/docx.svg"
import pdfIcon from "@assets/icons/pdf/pdf.svg"
import linkIcon from "@assets/icons/link/link.svg"
import { useHandleNavBtns } from "./hooks"

// Types
import type * as AppTypes from '@context/App/types'

// Components
import FadeIn from "@utils/animations/FadeIn"

export const TeamNavBtns = () => {
  const { descriptions, Animation } = useHandleNavBtns()

  return (
    <FadeIn>
      <Animation damping={30}>
        <TeamNavGrid tools={[...descriptions]} />
      </Animation>
    </FadeIn>
  )
}

type NavTool = [string, { to: string, description: string, outputs: AppTypes.ToolOutputs[], linkedWith?: string, triggeredBy?: string }]

const TeamNavGrid = ({ tools }: { tools: NavTool[] }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {tools.map(([title, { to, description, outputs, linkedWith, triggeredBy }]) => (
      <TeamNavBtn
        key={to}
        to={to}
        title={title}
        description={description}
        outputs={outputs}
        linkedWith={linkedWith}
        triggeredBy={triggeredBy} />
    ))}
  </div>
)

type TeamNavBtnProps = {
  to: string
  title: string
  description: string
  outputs: AppTypes.ToolOutputs[]
  linkedWith?: string
  triggeredBy?: string
}

const TeamNavBtn = ({ to, title, description, outputs, linkedWith, triggeredBy }: TeamNavBtnProps) => (
  <Link
    to={to}
    className="card border border-base-300 bg-base-100 shadow-sm transition hover:border-primary hover:shadow-md hover:bg-primary/10 hover:backdrop-blur-sm">
    <div className="card-body gap-1">
      <div className="flex items-center justify-between gap-2">
        <h2 className="card-title text-base">{title}</h2>
      </div>
      <LinkedWith tool={linkedWith} />
      <TriggeredBy tool={triggeredBy} />
      <p className="text-sm text-base-content/70 mb-4">{description}</p>
      <div className="ml-auto flex gap-2">
        {outputs.map(output => <ToolOutput key={output} output={output} />)}
      </div>
    </div>
  </Link>
)

// Notes the tool whose documents this one's previews link to, so the pair reads as related
const LinkedWith = ({ tool }: { tool?: string }) => {
  if(!tool) return null

  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
      <img src={linkIcon} alt="" className="size-3 dark:invert" />
      Linked with {tool}
    </span>
  )
}

// Notes the tool whose results kick this one off. A bolt rather than the link icon: these tools
// aren't joined by a shared key, they run when the other one turns something up.
const TriggeredBy = ({ tool }: { tool?: string }) => {
  if(!tool) return null

  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
      <BoltIcon />
      Triggered by {tool}
    </span>
  )
}

const BoltIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3">
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
)

const outputIcons: Record<AppTypes.ToolOutputs, string> = {
  xlsx: xlsxIcon,
  docx: docxIcon,
  pdf: pdfIcon,
}

const ToolOutput = ({ output }: { output: AppTypes.ToolOutputs }) => (
  <img src={outputIcons[output]} alt="tool output icon" title={`Tool outputs ${ output }`} className="w-7" />
)