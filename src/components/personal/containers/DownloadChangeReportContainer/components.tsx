import { useDownloadReportFile } from "./hooks"
import { formatFileSize, formatReportDate } from "./utils"

// Types
import type * as AppTypes from "@context/App/types"

export const ReportList = ({ reports }: { reports: AppTypes.DownloadReportManifestEntry[] }) => {
  if(reports.length === 0) {
    return <p className="py-8 text-center text-base-content/70">No reports available yet.</p>
  }

  return (
    <ul className="divide-y divide-base-300">
      {reports.map((report) => (
        <ReportRow key={report.filename} report={report} />
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
      <button
        type="button"
        disabled={isPending}
        onClick={() => downloadFile(report.filename)}
        className="btn btn-sm ml-auto">
        {isPending ? "Downloading…" : "Download"}
      </button>
    </li>
  )
}
