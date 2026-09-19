// Actions
import { authorizedFetch } from '@context/Auth/AuthActions'

// Types
import type * as AppTypes from './types'

const API_BASE = `${ window.location.origin }/api/v1/boxwood-mcp`

const triggerBlobDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * List available download report xlsx files
 *
 * GET /reports/manifest
 */
export const getDownloadReportManifest = async (): Promise<AppTypes.DownloadReportManifest> => {
  const res = await authorizedFetch(`${ API_BASE }/reports/manifest`)

  if(!res.ok) throw new Error(`Failed to load download report manifest: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * Return download report xlsx
 *
 * GET /reports/files/2026-09-17_report.xlsx
 */
export const downloadReportFile = async (filename: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/reports/files/${ encodeURIComponent(filename) }`)

  if(!res.ok) throw new Error(`Failed to download report file: HTTP ${ res.status }`)

  triggerBlobDownload(await res.blob(), filename)
}

/**
 * List generated CL Renewal Premium Summary xlsx files, grouped by CSR
 *
 * GET /renewal-premium-summaries/manifest
 */
export const getRenewalPremiumSummaryManifest = async (): Promise<AppTypes.RenewalPremiumSummaryManifest> => {
  const res = await authorizedFetch(`${ API_BASE }/renewal-premium-summaries/manifest`)

  if(!res.ok) throw new Error(`Failed to load renewal premium summary manifest: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * Return a generated CL Renewal Premium Summary xlsx
 *
 * GET /renewal-premium-summaries/files/Acme_Corp_....xlsx
 */
export const downloadRenewalPremiumSummaryFile = async (filename: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/renewal-premium-summaries/files/${ encodeURIComponent(filename) }`)

  if(!res.ok) throw new Error(`Failed to download renewal premium summary file: HTTP ${ res.status }`)

  triggerBlobDownload(await res.blob(), filename)
}

/**
 * Send one turn of the CL Renewal Premium Summary chat (scoped to customer_lookup +
 * renewal_premium_summary only), resuming the same agent session when sessionId is given
 *
 * POST /renewal-premium-summaries/chat
 */
export const postRenewalPremiumSummaryChat = async (message: string, sessionId: string | undefined): Promise<AppTypes.RenewalPremiumSummaryChatTurn> => {
  const res = await authorizedFetch(`${ API_BASE }/renewal-premium-summaries/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId })
  })

  if(!res.ok) throw new Error(`Failed to send chat message: HTTP ${ res.status }`)

  return await res.json()
}
