// Actions
import { authorizedFetch } from '@context/Auth/AuthActions'

// Types
import type * as AppTypes from './types'

const API_BASE = `${ window.location.origin }/api/v1/boxwood-mcp`

/**
 * List available download report xlsx files
 *
 * GET /reports/manifest
 */
export const getDownloadReportManifest = async (): Promise<AppTypes.DownloadReportManifestEntry[]> => {
  const res = await authorizedFetch(`${ API_BASE }/reports/manifest`)

  if(!res.ok) throw new Error(`Failed to load download report manifest: HTTP ${ res.status }`)

  const data: { reports: AppTypes.DownloadReportManifestEntry[] } = await res.json()
  return data.reports
}

/**
 * Return download report xlsx
 *
 * GET /reports/files/2026-09-17_report.xlsx
 */
export const downloadReportFile = async (filename: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/reports/files/${ encodeURIComponent(filename) }`)

  if(!res.ok) throw new Error(`Failed to download report file: HTTP ${ res.status }`)

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
