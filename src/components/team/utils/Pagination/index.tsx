export const PAGE_SIZE = 10

type PaginationProps = {
  page: number
  totalItems: number
  onPageChange: (page: number) => void
  scrollTargetRef?: React.RefObject<HTMLElement | null>
}

function Pagination({ page, totalItems, onPageChange, scrollTargetRef }: PaginationProps) {
  const totalPages = Math.max(Math.ceil(totalItems / PAGE_SIZE), 1)

  if(totalPages <= 1) return null

  const goToPage = (newPage: number) => {
    onPageChange(newPage)
    scrollTargetRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="join flex items-center justify-center py-2">
      <button
        type="button"
        disabled={page === 0}
        onClick={() => goToPage(page - 1)}
        className="join-item btn btn-sm text-secondary text-xl">«</button>
      <span className="join-item btn btn-sm btn-disabled pointer-events-none text-secondary">
        Page {page + 1} of {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages - 1}
        onClick={() => goToPage(page + 1)}
        className="join-item btn btn-sm text-secondary text-xl">»</button>
    </div>
  )
}

export default Pagination
