// Types
import type * as AppTypes from '@context/App/types'

type TeamNavDescription = { description: string, to: string, output: AppTypes.ToolOutputs }

export const teamNavDescriptions: [Map<AppTypes.CommercialTools, TeamNavDescription>, Map<AppTypes.PersonalTools, TeamNavDescription>] = [
  new Map([
    ["Renewal Premium Summary", {
      description: "Builds the renewal premium summary spreadsheet so account managers can review and adjust it before the renewal conversation.",
      to: "/commercial/renewal-premium-summary",
      output: "xlsx",
    }],
    ["Pre-Renewal Risk Profile", {
      description: "Pulls current exposures to prep for a client's pre-renewal meeting, no premiums or coverages included.",
      to: "/commercial/pre-renewal-risk-profile",
      output: "docx",
    }],
    ["Renewal Summary", {
      description: "Generates a branded pre-renewal review document for a commercial policy, ready to send or walk through with the client.",
      to: "/commercial/renewal-summary",
      output: "docx",
    }],
  ]),
  new Map([
    ["Download Change Report", {
      description: "Reviews the overnight carrier download and flags what changed, so team members can confirm items.",
      to: "/personal/download-change-report",
      output: "xlsx",
    }],
    ["Premium Change Tool", {
      description: "Checks a policy's premium against the prior term to validate rate changes and flag ones that may need remarketing.",
      to: "/personal/premium-change-tool",
      output: "xlsx",
    }],
    ["Renewal Summary", {
      description: "Puts together a renewal summary for a personal lines account so it's ready to review with the client ahead of renewal.",
      to: "/personal/renewal-summary",
      output: "docx",
    }],
  ]),
]