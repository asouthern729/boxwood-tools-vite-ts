// Types
import type * as AppTypes from '@context/App/types'

// linkedWith names the tool whose documents this one's previews link to (shared policy terms);
// triggeredBy names the tool whose results kick this one off (e.g. a renewal on the download report)
type TeamNavDescription = {
  description: string
  to: string
  outputs: AppTypes.ToolOutputs[]
  linkedWith?: string
  triggeredBy?: string
}

export const teamNavDescriptions: [Map<AppTypes.CommercialTools, TeamNavDescription>, Map<AppTypes.PersonalTools, TeamNavDescription>] = [
  new Map([
    ["Renewal Premium Spreadsheet", {
      description: "Builds the renewal premium spreadsheet so account managers can review and adjust it before the renewal conversation.",
      to: "/commercial/renewal-premium-summary",
      outputs: ["xlsx"],
      linkedWith: "CL Renewal Summary",
    }],
    ["CL Renewal Summary", {
      description: "Generates a branded pre-renewal review document for a commercial policy, ready to send or walk through with the client.",
      to: "/commercial/renewal-summary",
      outputs: ["docx", "pdf"],
      linkedWith: "Renewal Premium Spreadsheet",
    }],
    ["Pre-Renewal Risk Profile", {
      description: "Pulls current exposures to prep for a client's pre-renewal meeting, no premiums or coverages included.",
      to: "/commercial/pre-renewal-risk-profile",
      outputs: ["docx"],
    }],
    ["Proposal Builder", {
      description: "Builds a branded client proposal from carrier quotes and AMS360 proposals dropped into the chat.",
      to: "/commercial/proposal-builder",
      outputs: ["docx", "pdf"],
    }],
    ["Policy Check", {
      description: "Checks an issued or renewal policy against the quote, binder or expiring policy and flags every discrepancy before it goes to the client.",
      to: "/commercial/policy-check",
      outputs: ["docx", "pdf"],
    }],
  ]),
  new Map([
    ["Download Change Report", {
      description: "Reviews the overnight carrier download and flags what changed, so team members can confirm items.",
      to: "/personal/download-change-report",
      outputs: ["xlsx"],
    }],
    ["Premium Change Tool", {
      description: "Checks a policy's premium against the prior term to validate rate changes and flag ones that may need remarketing.",
      to: "/personal/premium-change-tool",
      outputs: ["xlsx"],
      triggeredBy: "Download Change Report",
    }],
    ["PL Renewal Summary", {
      description: "Puts together a renewal summary for a personal lines account so it's ready to review with the client ahead of renewal.",
      to: "/personal/renewal-summary",
      outputs: ["docx", "pdf"],
      triggeredBy: "Download Change Report",
    }],
  ]),
]