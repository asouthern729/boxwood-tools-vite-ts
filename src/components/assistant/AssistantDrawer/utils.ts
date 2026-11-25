export const ASSISTANT_NAME = "Boxwood Assistant"
// Shown on two lines under the title
export const ASSISTANT_TAGLINE = ["Employee Tools", "& Insurance Help"]

// Starter questions shown before the first message — one per thing the assistant is scoped to
export const SUGGESTED_QUESTIONS = [
  "Which tool should I use to prep for a commercial renewal?",
  "What's the difference between the Renewal Premium Spreadsheet and the CL Renewal Summary?",
  "What umbrella limit do we recommend for a homeowner?",
]

// Server limits (POST /assistant/chat)
export const MAX_MESSAGE_CHARS = 4000
export const MAX_SENT_MESSAGES = 20

export const CHAT_STORAGE_KEY = "boxwood_assistant_chat"
export const ATTACHMENTS_STORAGE_KEY = "boxwood_assistant_attachments"

// Server limits (POST /assistant/attachments): files per chat; 150 pages in total is checked server side
export const MAX_ATTACHMENTS = 3

// The pages the assistant may link to as boxwood://tool/<path>; anything else renders as plain text
export const TOOL_LINK_PREFIX = "boxwood://tool/"
export const TOOL_PATHS = new Set([
  "commercial",
  "commercial/renewal-premium-summary",
  "commercial/renewal-summary",
  "commercial/pre-renewal-risk-profile",
  "commercial/proposal-builder",
  "commercial/policy-check",
  "commercial/coverage-comparison",
  "commercial/coverage-gap",
  "personal",
  "personal/download-change-report",
  "personal/premium-change-tool",
  "personal/renewal-summary",
])

export const toolLinkPath = (href?: string) => {
  if(!href?.startsWith(TOOL_LINK_PREFIX)) return null
  const path = href.slice(TOOL_LINK_PREFIX.length).replace(/^\/+|\/+$/g, "")
  return TOOL_PATHS.has(path) ? path : null
}
