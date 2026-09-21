import { useDownloadReportFile, useHandleReportList } from "./hooks"
import { formatFileSize, formatReportDate, formatSyncedUntil, handleLastSyncBanner, REPORT_ORDER_OPTIONS } from "./utils"

// Types
import type * as AppTypes from "@context/App/types"

// Components
import Ordering from "@components/team/utils/Ordering"
import Pagination from "@components/team/utils/Pagination"

export const LastSyncBanner = ({ lastSync }: { lastSync: AppTypes.DownloadReportLastSync | null }) => {
  const { summaryText, syncedUntil } = handleLastSyncBanner(lastSync)

  if(!syncedUntil) return null

  return (
    <p className="px-4 py-2 text-sm text-base-content/60">
      Last sync ({ formatSyncedUntil(syncedUntil) }): {summaryText}
    </p>
  )
}

export const ReportList = ({ reports }: { reports: AppTypes.DownloadReportManifestEntry[] }) => {
  const { order, setOrder, pageReports, currentPage, totalItems, setPage, listRef } = useHandleReportList(reports)

  if(reports.length === 0) {
    return <p className="py-8 text-center text-base-content/70">No reports available yet.</p>
  }

  return (
    <>
      <Ordering 
        value={order} 
        onChange={setOrder} 
        options={REPORT_ORDER_OPTIONS} />
      <ul ref={listRef} className="divide-y divide-base-300">
        {pageReports.map((report) => (
          <ReportRow
            key={report.filename}
            report={report} />
        ))}
      </ul>
      <Pagination 
        page={currentPage} 
        totalItems={totalItems} 
        onPageChange={setPage} 
        scrollTargetRef={listRef} />
    </>
  )
}

const ReportRow = ({ report }: { report: AppTypes.DownloadReportManifestEntry }) => {
  const { mutate: downloadFile, isPending } = useDownloadReportFile()

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="min-w-48 font-semibold">{formatReportDate(report.date)}</span>
      <span className="text-sm text-base-content/60">{formatFileSize(report.sizeBytes)}</span>
      <DownloadButton
        isPending={isPending}
        onClick={() => downloadFile(report.filename)} />
    </li>
  )
}

type DownloadButtonProps = {
  isPending: boolean
  onClick: () => void
}

const DownloadButton = ({ isPending, onClick }: DownloadButtonProps) => {
  const btnContent = isPending ? "Downloading…" : "Download"

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={onClick}
      className="btn btn-neutral btn-sm ml-auto hover:bg-secondary">
        {btnContent}
    </button>
  )
}