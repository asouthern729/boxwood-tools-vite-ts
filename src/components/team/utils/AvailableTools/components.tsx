export const ToolsLabel = () => (
  <span className="font-mono text-[10px] font-bold tracking-widest text-base-content/50 uppercase">
    MCP Tools Available
  </span>
)

export const ToolBadge = ({ name, description }: { name: string, description: string }) => (
  <span
    title={description}
    className="badge badge-outline badge-accent badge-sm cursor-default">
      {name}
  </span>
)
