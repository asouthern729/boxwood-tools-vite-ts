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
 * Delete a generated CL Renewal Premium Summary xlsx
 *
 * DELETE /renewal-premium-summaries/files/Acme_Corp_....xlsx
 */
export const deleteRenewalPremiumSummaryFile = async (filename: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/renewal-premium-summaries/files/${ encodeURIComponent(filename) }`, {
    method: "DELETE",
  })

  if(!res.ok && res.status !== 404) throw new Error(`Failed to delete renewal premium summary file: HTTP ${ res.status }`)
}

/**
 * Refresh Current/Renewal premiums on a generated CL Renewal Premium Summary xlsx from AMS360
 *
 * POST /renewal-premium-summaries/files/Acme_Corp_....xlsx/refresh
 */
export const refreshRenewalPremiumSummaryFile = async (filename: string): Promise<AppTypes.RenewalPremiumSummaryRefreshResult> => {
  const res = await authorizedFetch(`${ API_BASE }/renewal-premium-summaries/files/${ encodeURIComponent(filename) }/refresh`, {
    method: "POST",
  })

  if(res.status === 409) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error_description ?? "This report was generated before Refresh support existed.")
  }

  if(!res.ok) throw new Error(`Failed to refresh renewal premium summary file: HTTP ${ res.status }`)

  return await res.json()
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

/**
 * List generated CL Pre-Renewal Risk Profile docx files, grouped by CSR
 *
 * GET /risk-profile/manifest
 */
export const getPreRenewalRiskProfileManifest = async (): Promise<AppTypes.PreRenewalRiskProfileManifest> => {
  const res = await authorizedFetch(`${ API_BASE }/risk-profile/manifest`)

  if(!res.ok) throw new Error(`Failed to load pre-renewal risk profile manifest: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * Return a generated CL Pre-Renewal Risk Profile docx
 *
 * GET /risk-profile/files/Acme_Corp_....docx
 */
export const downloadPreRenewalRiskProfileFile = async (filename: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/risk-profile/files/${ encodeURIComponent(filename) }`)

  if(!res.ok) throw new Error(`Failed to download pre-renewal risk profile file: HTTP ${ res.status }`)

  triggerBlobDownload(await res.blob(), filename)
}

/**
 * Delete a generated CL Pre-Renewal Risk Profile docx
 *
 * DELETE /risk-profile/files/Acme_Corp_....docx
 */
export const deletePreRenewalRiskProfileFile = async (filename: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/risk-profile/files/${ encodeURIComponent(filename) }`, {
    method: "DELETE",
  })

  if(!res.ok && res.status !== 404) throw new Error(`Failed to delete pre-renewal risk profile file: HTTP ${ res.status }`)
}

/**
 * Send one turn of the CL Pre-Renewal Risk Profile chat (scoped to customer_lookup, upcoming_renewals,
 * risk_profile, and employee_lookup), resuming the same agent session when sessionId is given
 *
 * POST /risk-profile/chat
 */
export const postPreRenewalRiskProfileChat = async (message: string, sessionId: string | undefined): Promise<AppTypes.PreRenewalRiskProfileChatTurn> => {
  const res = await authorizedFetch(`${ API_BASE }/risk-profile/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId })
  })

  if(!res.ok) throw new Error(`Failed to send chat message: HTTP ${ res.status }`)

  return await res.json()
}
