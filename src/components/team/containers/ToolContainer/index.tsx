function ToolContainer({ children }: { children: React.ReactElement }) {

  return (
    <div className="p-4 bg-base-300/40 m-auto rounded-lg max-w-5xl">
      {children}
    </div>
  )
}

export default ToolContainer