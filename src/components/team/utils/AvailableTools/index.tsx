type AvailableToolsProps = {
  tools: { name: string, description: string }[]
}

function AvailableTools({ tools }: AvailableToolsProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:flex-wrap">
      <span className="font-mono text-[10px] font-bold tracking-widest text-base-content/50 uppercase">
        MCP Tools Available
      </span>
      {tools.map((tool) => (
        <span 
          key={tool.name} 
          title={tool.description} 
          className="badge badge-outline badge-accent badge-sm cursor-default">
            {tool.name}
        </span>
      ))}
    </div>
  )
}

export default AvailableTools
