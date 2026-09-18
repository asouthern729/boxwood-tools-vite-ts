import { Link, useLocation } from "react-router"
import xlsxIcon from "@assets/icons/xlsx/xlsx.svg"
import docxIcon from "@assets/icons/docx/docx.svg"
import { teamNavDescriptions } from "./utils"

// Types
import type * as AppTypes from '@context/App/types'

export const TeamNavBtns = () => {
  const { pathname } = useLocation()

  const descriptions = pathname.startsWith("/commercial") ?
    teamNavDescriptions[0] :
    teamNavDescriptions[1]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...descriptions].map(([title, { to, description, output }]) => (
        <TeamNavBtn
          key={to}
          to={to}
          title={title}
          description={description}
          output={output} />
      ))}
    </div>
  )
}

type TeamNavBtnProps = {
  to: string
  title: string
  description: string
  output: AppTypes.ToolOutputs
}

const TeamNavBtn = ({ to, title, description, output }: TeamNavBtnProps) => (
  <Link
    to={to}
    className="card border border-base-300 bg-base-100 shadow-sm transition hover:border-primary hover:shadow-md hover:bg-primary/10">
    <div className="card-body gap-1">
      <div className="flex items-center justify-between gap-2">
        <h2 className="card-title text-base">{title}</h2>
      </div>
      <p className="text-sm text-base-content/70 mb-4">{description}</p>
      <ToolOutput output={output} />
    </div>
  </Link>
)

const ToolOutput = ({ output }: { output: AppTypes.ToolOutputs }) => {
  const iconSrc = output === "xlsx" ?
    xlsxIcon :
    docxIcon

  return (
    <img src={iconSrc} alt="tool output icon" title={`Tool outputs ${ output }`} className="ml-auto w-7" />
  )
}