export const PAGE_SIZE = 10

type HandlePaginationProps = {
  totalItems: number
  onPageChange: (page: number) => void
  scrollTargetRef?: React.RefObject<HTMLElement | null>
}

export const handlePagination = ({ totalItems, onPageChange, scrollTargetRef }: HandlePaginationProps) => {
  const totalPages = Math.max(Math.ceil(totalItems / PAGE_SIZE), 1)
  
  const visible = totalPages <= 1 ?
    false :
    true

  const goToPage = (newPage: number) => {
    onPageChange(newPage)
    scrollTargetRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return { visible, totalPages, goToPage }
}