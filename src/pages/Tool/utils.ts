import DownloadChangeReportContainer from '@components/personal/containers/DownloadChangeReportContainer'
import RenewalPremiumSummaryContainer from '@components/commercial/containers/RenewalPremiumSummaryContainer'
import PreRenewalRiskProfileContainer from '@components/commercial/containers/PreRenewalRiskProfileContainer'
import PremiumChangeToolContainer from '@components/personal/containers/PremiumChangeToolContainer'
import RenewalSummaryContainer from '@components/commercial/containers/RenewalSummaryContainer'
import PersonalRenewalSummaryContainer from '@components/personal/containers/RenewalSummaryContainer'

// Types
import * as AppTypes from '@context/App/types'

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