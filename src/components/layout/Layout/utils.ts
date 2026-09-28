export const handleDataFreshNotice = () => {
  const now = new Date()
  const todaySevenAM = new Date(now)
  todaySevenAM.setHours(7, 0, 0, 0)
  const label = now < todaySevenAM ? "yesterday" : "this morning"

  return label
}

export const FOOTER_EXT_LINKS = [
  { href: "https://mcp.boxwoodins.com/mcp-tools/", label: "MCP Tools" },
  { href: "https://mcp.boxwoodins.com/ams360-sync/", label: "AMS360 Sync" },
  { href: "https://mcp.boxwoodins.com/roadmap/", label: "Roadmap" },
]