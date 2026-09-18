import { useMutation, useQuery } from "@tanstack/react-query"

// Actions
import { downloadReportFile, getDownloadReportManifest } from "@context/App/AppActions"

export const useDownloadReportManifest = () => useQuery({
  queryKey: ["download-report-manifest"],
  queryFn: getDownloadReportManifest,
})

export const useDownloadReportFile = () => useMutation({
  mutationFn: downloadReportFile,
})
