import { useRef, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { PAGE_SIZE } from "@components/team/utils/Pagination"
import { usePersistedState } from "@utils/hooks"
import { REPORT_ORDER_OPTIONS, sortReports } from './utils'

// Actions
import { downloadReportFile, getDownloadReportManifest } from "@context/App/AppActions"

// Types
import type * as AppTypes from "@context/App/types"

const ORDER_STORAGE_KEY = "boxwood_download_change_report_order"

export const useDownloadReportManifest = () => useQuery({
  queryKey: ["download-report-manifest"],
  queryFn: getDownloadReportManifest,
})

export const useDownloadReportFile = () => useMutation({
  mutationFn: downloadReportFile,
})

export const useHandleReportList = (reports: AppTypes.DownloadReportManifestEntry[]) => {
  const [order, setOrder] = usePersistedState(ORDER_STORAGE_KEY, REPORT_ORDER_OPTIONS[0].value)
  const [page, setPage] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const sorted = sortReports(reports, order)
  const currentPage = Math.min(page, Math.max(Math.ceil(sorted.length / PAGE_SIZE) - 1, 0))
  const pageReports = sorted.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)

  return { order, setOrder, pageReports, currentPage, totalItems: sorted.length, setPage, listRef }
}
