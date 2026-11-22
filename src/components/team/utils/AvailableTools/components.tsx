export const ToolsLabel = () => (
  <span className="font-mono text-[10px] font-bold tracking-widest text-base-content/50 uppercase">
    MCP Tools Available
  </span>
)

type ToolBadgeProps = {
  name: string
  description: string
  disabled: boolean
  onClick: () => void
}

// Clicking asks the Boxwood Assistant to explain this chat tool; the description stays as a tooltip
export const ToolBadge = ({ name, description, disabled, onClick }: ToolBadgeProps) => (
  <button
    type="button"
    title={`${ description } Click to ask the Boxwood Assistant about it.`}
    disabled={disabled}
    onClick={onClick}
    className="badge badge-accent badge-sm cursor-pointer transition hover:brightness-110 hover:ring-2 hover:ring-accent/40 disabled:cursor-default disabled:opacity-60">
      {name}
  </button>
)
