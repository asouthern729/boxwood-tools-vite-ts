import DownloadChangeReportContainer from '@components/personal/containers/DownloadChangeReportContainer'

// Types
import * as AppTypes from '@context/App/types'

export const toolNames: Record<string, AppTypes.AllTools> = {
  "pre-renewal-risk-profile": "Pre-Renewal Risk Profile",
  "renewal-premium-summary": "Renewal Premium Summary",
  "renewal-summary": "Renewal Summary",
  "download-change-report": "Download Change Report",
  "premium-change-tool": "Premium Change Tool",
}

export const handleToolContent = (toolName: AppTypes.AllTools) => {
  switch(toolName) {
    case "Download Change Report":
      return DownloadChangeReportContainer
    default:
      return DownloadChangeReportContainer
  }
}