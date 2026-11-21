import { handlePagination } from "./utils"

// Components
import * as Components from "./components"

type PaginationProps = {
  page: number
  totalItems: number
  onPageChange: (page: number) => void
  scrollTargetRef?: React.RefObject<HTMLElement | null>
  className?: string
}

function Pagination({ page, totalItems, onPageChange, scrollTargetRef, className = "justify-center py-2" }: PaginationProps) {
  const { visible, totalPages, goToPage } = handlePagination({ totalItems, onPageChange, scrollTargetRef })

  if(!visible) return null

  return (
    <div className={`join flex items-center ${ className }`}>
      <Components.PaginationBtn
        disabled={page === 0}
        onClick={() => goToPage(page - 1)}>
          «
      </Components.PaginationBtn>
      <Components.PageLabel
        page={page}
        totalPages={totalPages} />
      <Components.PaginationBtn
        disabled={page >= totalPages - 1}
        onClick={() => goToPage(page + 1)}>
          »
      </Components.PaginationBtn>
    </div>
  )
}

export default Pagination
