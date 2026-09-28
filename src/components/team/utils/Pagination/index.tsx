import { handlePagination } from "./utils"
// Components
import * as Components from './components'

type PaginationProps = {
  page: number
  totalItems: number
  onPageChange: (page: number) => void
  scrollTargetRef?: React.RefObject<HTMLElement | null>
}

function Pagination({ page, totalItems, onPageChange, scrollTargetRef }: PaginationProps) {
  const { visible, totalPages, goToPage } = handlePagination({ totalItems, onPageChange, scrollTargetRef })

  if(!visible) return null

  return (
    <div className="join flex items-center justify-center py-2">
      <Components.PaginationBtn
        disabled={page === 0}
        onClick={() => goToPage(page - 1)}>
          «
      </Components.PaginationBtn>
      <span className="join-item btn btn-sm btn-disabled pointer-events-none text-secondary">Page {page + 1} of {totalPages}</span>
      <Components.PaginationBtn
        disabled={page >= totalPages - 1}
        onClick={() => goToPage(page + 1)}>
          »
      </Components.PaginationBtn>
    </div>
  )
}

export default Pagination