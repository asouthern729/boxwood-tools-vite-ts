import { useDownloadReportFile } from "./hooks"
import { formatFileSize, formatReportDate, formatSyncedUntil } from "./utils"

// Types
import type * as AppTypes from "@context/App/types"

export const LastSyncBanner = ({ lastSync }: { lastSync: AppTypes.DownloadReportLastSync | null }) => {
  if(!lastSync) return null

  const { syncedUntil, tablesTouched, rowsEntered } = lastSync

  return (
    <p className="px-4 py-2 text-sm text-base-content/60">
      Last sync ({ formatSyncedUntil(syncedUntil) }): { rowsEntered === 0 ?
        "no new rows" :
        `${ rowsEntered } row${ rowsEntered === 1 ? "" : "s" } from ${ tablesTouched.join(", ") }` }
    </p>
  )
}

export const ReportList = ({ reports }: { reports: AppTypes.DownloadReportManifestEntry[] }) => {
  if(reports.length === 0) {
    return <p className="py-8 text-center text-base-content/70">No reports available yet.</p>
  }

  return (
      <ul className="divide-y divide-base-300">
        {reports.map((report) => (
          <ReportRow 
            key={report.filename} 
            report={report} />
        ))}
      </ul>
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

const DownloadButton = ({ isPending, onClick }: DownloadButtonProps) => (
  <button
    type="button"
    disabled={isPending}
    onClick={onClick}
    className="btn btn-neutral btn-sm ml-auto hover:bg-secondary">
    {isPending ? "Downloading…" : "Download"}
  </button>
)