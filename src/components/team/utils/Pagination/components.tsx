type PaginationBtnProps = {
  disabled: boolean
  onClick: React.MouseEventHandler<HTMLButtonElement>
  children: React.ReactNode
}

export const PaginationBtn = ({ disabled, onClick, children }: PaginationBtnProps) => (
  <button
    type="button"
    className="join-item btn btn-sm text-secondary text-xl"
    disabled={disabled}
    onClick={onClick}>
      {children}
  </button>
)

export const PageLabel = ({ page, totalPages }: { page: number, totalPages: number }) => (
  <span className="join-item btn btn-sm btn-disabled pointer-events-none text-secondary">
    Page {page + 1} of {totalPages}
  </span>
)
