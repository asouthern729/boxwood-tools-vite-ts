export const WorkbookView = ({ isRefreshing, children }: { isRefreshing: boolean, children: React.ReactNode }) => (
  <div className="max-h-[65vh] overflow-auto rounded-box border border-base-300">
    {isRefreshing && (
      <p className="p-2 text-center text-sm text-base-content/60 italic">Refreshing…</p>
    )}
    {children}
  </div>
)
