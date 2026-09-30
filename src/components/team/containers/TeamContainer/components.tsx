import { Link } from "react-router"
import xlsxIcon from "@assets/icons/xlsx/xlsx.svg"
import docxIcon from "@assets/icons/docx/docx.svg"
import pdfIcon from "@assets/icons/pdf/pdf.svg"
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...descriptions].map(([title, { to, description, outputs }]) => (
            <TeamNavBtn
              key={to}
              to={to}
              title={title}
              description={description}
              outputs={outputs} />
          ))}
        </div>
      </Animation>
    </FadeIn>
  )
}

type TeamNavBtnProps = {
  to: string
  title: string
  description: string
  outputs: AppTypes.ToolOutputs[]
}

const TeamNavBtn = ({ to, title, description, outputs }: TeamNavBtnProps) => (
  <Link
    to={to}
    className="card border border-base-300 bg-base-100 shadow-sm transition hover:border-primary hover:shadow-md hover:bg-primary/10 hover:backdrop-blur-sm">
    <div className="card-body gap-1">
      <div className="flex items-center justify-between gap-2">
        <h2 className="card-title text-base">{title}</h2>
      </div>
      <p className="text-sm text-base-content/70 mb-4">{description}</p>
      <div className="ml-auto flex gap-2">
        {outputs.map(output => <ToolOutput key={output} output={output} />)}
      </div>
    </div>
  </Link>
)

const outputIcons: Record<AppTypes.ToolOutputs, string> = {
  xlsx: xlsxIcon,
  docx: docxIcon,
  pdf: pdfIcon,
}

const ToolOutput = ({ output }: { output: AppTypes.ToolOutputs }) => (
  <img src={outputIcons[output]} alt="tool output icon" title={`Tool outputs ${ output }`} className="w-7" />
)