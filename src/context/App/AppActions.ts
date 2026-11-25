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
 * List generated CL Renewal Premium Spreadsheet xlsx files, grouped by CSR
 *
 * GET /renewal-premium-summaries/manifest
 */
export const getRenewalPremiumSummaryManifest = async (): Promise<AppTypes.RenewalPremiumSummaryManifest> => {
  const res = await authorizedFetch(`${ API_BASE }/renewal-premium-summaries/manifest`)

  if(!res.ok) throw new Error(`Failed to load renewal premium spreadsheet manifest: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * Fetch a generated CL Renewal Premium Spreadsheet xlsx as a blob, for download or preview
 *
 * GET /renewal-premium-summaries/files/Acme_Corp_....xlsx
 */
export const getRenewalPremiumSummaryFileBlob = async (filename: string, preview = false): Promise<Blob> => {
  const res = await authorizedFetch(`${ API_BASE }/renewal-premium-summaries/files/${ encodeURIComponent(filename) }${ preview ? "?preview=1" : "" }`)

  if(!res.ok) throw new Error(`Failed to load renewal premium spreadsheet file: HTTP ${ res.status }`)

  return await res.blob()
}

/**
 * Download a generated CL Renewal Premium Spreadsheet xlsx
 */
export const downloadRenewalPremiumSummaryFile = async (filename: string): Promise<void> => {
  triggerBlobDownload(await getRenewalPremiumSummaryFileBlob(filename), filename)
}

/**
 * Delete a generated CL Renewal Premium Spreadsheet xlsx
 *
 * DELETE /renewal-premium-summaries/files/Acme_Corp_....xlsx
 */
export const deleteRenewalPremiumSummaryFile = async (filename: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/renewal-premium-summaries/files/${ encodeURIComponent(filename) }`, {
    method: "DELETE",
  })

  if(!res.ok && res.status !== 404) throw new Error(`Failed to delete renewal premium spreadsheet file: HTTP ${ res.status }`)
}

/**
 * Send one turn of the CL Renewal Premium Spreadsheet chat (scoped to customer_lookup +
 * renewal_premium_spreadsheet only), resuming the same agent session when sessionId is given
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
 * Fetch a generated CL Pre-Renewal Risk Profile docx as a blob, for download or preview
 *
 * GET /risk-profile/files/Acme_Corp_....docx
 */
export const getPreRenewalRiskProfileFileBlob = async (filename: string, preview = false): Promise<Blob> => {
  const res = await authorizedFetch(`${ API_BASE }/risk-profile/files/${ encodeURIComponent(filename) }${ preview ? "?preview=1" : "" }`)

  if(!res.ok) throw new Error(`Failed to load pre-renewal risk profile file: HTTP ${ res.status }`)

  return await res.blob()
}

/**
 * Download a generated CL Pre-Renewal Risk Profile docx
 */
export const downloadPreRenewalRiskProfileFile = async (filename: string): Promise<void> => {
  triggerBlobDownload(await getPreRenewalRiskProfileFileBlob(filename), filename)
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

// POST a linked-document build; the body's error is written for staff, so it's shown as-is.
const postLinkedDocument = async (path: string, body: Record<string, string>): Promise<AppTypes.LinkedDocumentResult> => {
  const res = await authorizedFetch(`${ API_BASE }${ path }`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if(!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error ?? err?.error_description ?? `Couldn't build the document: HTTP ${ res.status }`)
  }

  return await res.json()
}

/**
 * Build the CL Renewal Summary for a Renewal Premium Spreadsheet's policy terms (early builds allowed)
 *
 * POST /cl-renewal-summary/linked { spreadsheet_id }
 */
export const createLinkedRenewalSummary = (spreadsheetId: string) =>
  postLinkedDocument("/cl-renewal-summary/linked", { spreadsheet_id: spreadsheetId })

/**
 * Build the Renewal Premium Spreadsheet for a CL Renewal Summary's renewal month
 *
 * POST /renewal-premium-summaries/linked { summary_id }
 */
export const createLinkedRenewalPremiumSummary = (summaryId: string) =>
  postLinkedDocument("/renewal-premium-summaries/linked", { summary_id: summaryId })

/**
 * List generated CL Renewal Summary docx files, grouped by CSR
 *
 * GET /cl-renewal-summary/manifest
 */
export const getRenewalSummaryManifest = async (): Promise<AppTypes.RenewalSummaryManifest> => {
  const res = await authorizedFetch(`${ API_BASE }/cl-renewal-summary/manifest`)

  if(!res.ok) throw new Error(`Failed to load renewal summary manifest: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * Fetch a generated CL Renewal Summary docx as a blob, for download or preview
 *
 * GET /cl-renewal-summary/files/Acme_Corp_....docx
 */
export const getRenewalSummaryFileBlob = async (filename: string, preview = false): Promise<Blob> => {
  const res = await authorizedFetch(`${ API_BASE }/cl-renewal-summary/files/${ encodeURIComponent(filename) }${ preview ? "?preview=1" : "" }`)

  if(!res.ok) throw new Error(`Failed to load renewal summary file: HTTP ${ res.status }`)

  return await res.blob()
}

/**
 * Download a generated CL Renewal Summary docx
 */
export const downloadRenewalSummaryFile = async (filename: string): Promise<void> => {
  triggerBlobDownload(await getRenewalSummaryFileBlob(filename), filename)
}

/**
 * Download a generated CL Renewal Summary as a PDF, converted server-side from the docx
 *
 * GET /cl-renewal-summary/files/Acme_Corp_....docx/pdf
 */
export const downloadRenewalSummaryPdf = async (filename: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/cl-renewal-summary/files/${ encodeURIComponent(filename) }/pdf`)

  if(!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error_description ?? `Failed to download renewal summary PDF: HTTP ${ res.status }`)
  }

  triggerBlobDownload(await res.blob(), filename.replace(/\.docx$/i, ".pdf"))
}

/**
 * Delete a generated CL Renewal Summary docx
 *
 * DELETE /cl-renewal-summary/files/Acme_Corp_....docx
 */
export const deleteRenewalSummaryFile = async (filename: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/cl-renewal-summary/files/${ encodeURIComponent(filename) }`, {
    method: "DELETE",
  })

  if(!res.ok && res.status !== 404) throw new Error(`Failed to delete renewal summary file: HTTP ${ res.status }`)
}

/**
 * List quotes attached to a CL Renewal Summary, oldest first
 *
 * GET /cl-renewal-summary/files/Acme_Corp_....docx/quotes
 */
export const getRenewalSummaryQuotes = async (filename: string): Promise<AppTypes.RenewalSummaryQuote[]> => {
  const res = await authorizedFetch(`${ API_BASE }/cl-renewal-summary/files/${ encodeURIComponent(filename) }/quotes`)

  if(!res.ok) throw new Error(`Failed to load quotes: HTTP ${ res.status }`)

  const body: { quotes: AppTypes.RenewalSummaryQuote[] } = await res.json()
  return body.quotes
}

/**
 * Upload a carrier quote, PDF, Word, Excel or a PNG/JPEG image (raw bytes, not multipart); the server sniffs the
 * bytes and reads it in the background
 *
 * POST /cl-renewal-summary/files/Acme_Corp_....docx/quotes?name=quote.pdf
 */
export const uploadRenewalSummaryQuote = async (filename: string, file: File): Promise<AppTypes.RenewalSummaryQuote> => {
  const res = await authorizedFetch(`${ API_BASE }/cl-renewal-summary/files/${ encodeURIComponent(filename) }/quotes?name=${ encodeURIComponent(file.name) }`, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  })

  if(res.status === 413) throw new Error("File is too large (24 MB max).")
  if(!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error_description ?? `Failed to upload quote: HTTP ${ res.status }`)
  }

  return await res.json()
}

/**
 * Remove a quote; the server rebuilds the docx without it before responding
 *
 * DELETE /cl-renewal-summary/files/Acme_Corp_....docx/quotes/:quoteId
 */
export const deleteRenewalSummaryQuote = async (filename: string, quoteId: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/cl-renewal-summary/files/${ encodeURIComponent(filename) }/quotes/${ encodeURIComponent(quoteId) }`, {
    method: "DELETE",
  })

  if(!res.ok && res.status !== 404) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error_description ?? `Failed to remove quote: HTTP ${ res.status }`)
  }
}

/**
 * Send one turn of the CL Renewal Summary chat (scoped to customer_lookup, upcoming_renewals,
 * cl_renewal_summary, and employee_lookup), resuming the same agent session when sessionId is given
 *
 * POST /cl-renewal-summary/chat
 */
export const postRenewalSummaryChat = async (message: string, sessionId: string | undefined): Promise<AppTypes.RenewalSummaryChatTurn> => {
  const res = await authorizedFetch(`${ API_BASE }/cl-renewal-summary/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId })
  })

  if(!res.ok) throw new Error(`Failed to send chat message: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * List generated PL Renewal Summary docx files, grouped by CSR
 *
 * GET /pl-renewal-summary/manifest
 */
export const getPersonalRenewalSummaryManifest = async (): Promise<AppTypes.PersonalRenewalSummaryManifest> => {
  const res = await authorizedFetch(`${ API_BASE }/pl-renewal-summary/manifest`)

  if(!res.ok) throw new Error(`Failed to load renewal summary manifest: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * Fetch a generated PL Renewal Summary docx as a blob, for download or preview
 *
 * GET /pl-renewal-summary/files/Jane_Doe_H01_....docx
 */
export const getPersonalRenewalSummaryFileBlob = async (filename: string, preview = false): Promise<Blob> => {
  const res = await authorizedFetch(`${ API_BASE }/pl-renewal-summary/files/${ encodeURIComponent(filename) }${ preview ? "?preview=1" : "" }`)

  if(!res.ok) throw new Error(`Failed to load renewal summary file: HTTP ${ res.status }`)

  return await res.blob()
}

/**
 * Download a generated PL Renewal Summary docx
 */
export const downloadPersonalRenewalSummaryFile = async (filename: string): Promise<void> => {
  triggerBlobDownload(await getPersonalRenewalSummaryFileBlob(filename), filename)
}

/**
 * Download a generated PL Renewal Summary as a PDF, converted server-side from the docx
 *
 * GET /pl-renewal-summary/files/Jane_Doe_H01_....docx/pdf
 */
export const downloadPersonalRenewalSummaryPdf = async (filename: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/pl-renewal-summary/files/${ encodeURIComponent(filename) }/pdf`)

  if(!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error_description ?? `Failed to download renewal summary PDF: HTTP ${ res.status }`)
  }

  triggerBlobDownload(await res.blob(), filename.replace(/\.docx$/i, ".pdf"))
}

/**
 * Delete a generated PL Renewal Summary docx
 *
 * DELETE /pl-renewal-summary/files/Jane_Doe_H01_....docx
 */
export const deletePersonalRenewalSummaryFile = async (filename: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/pl-renewal-summary/files/${ encodeURIComponent(filename) }`, {
    method: "DELETE",
  })

  if(!res.ok && res.status !== 404) throw new Error(`Failed to delete renewal summary file: HTTP ${ res.status }`)
}

/**
 * Send one turn of the PL Renewal Summary chat (scoped to customer_lookup, upcoming_renewals,
 * pl_renewal_summary, and employee_lookup), resuming the same agent session when sessionId is given
 *
 * POST /pl-renewal-summary/chat
 */
export const postPersonalRenewalSummaryChat = async (message: string, sessionId: string | undefined): Promise<AppTypes.PersonalRenewalSummaryChatTurn> => {
  const res = await authorizedFetch(`${ API_BASE }/pl-renewal-summary/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId })
  })

  if(!res.ok) throw new Error(`Failed to send chat message: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * List generated PL Renewal Premium Change xlsx files, grouped by CSR
 *
 * GET /pl-renewal-premium-change/manifest
 */
export const getPersonalPremiumChangeManifest = async (): Promise<AppTypes.PersonalPremiumChangeManifest> => {
  const res = await authorizedFetch(`${ API_BASE }/pl-renewal-premium-change/manifest`)

  if(!res.ok) throw new Error(`Failed to load premium change manifest: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * Fetch a generated PL Renewal Premium Change xlsx as a blob, for download or preview
 *
 * GET /pl-renewal-premium-change/files/Jane_Doe_2026-10-18_Renewal_Change.xlsx
 */
export const getPersonalPremiumChangeFileBlob = async (filename: string, preview = false): Promise<Blob> => {
  const res = await authorizedFetch(`${ API_BASE }/pl-renewal-premium-change/files/${ encodeURIComponent(filename) }${ preview ? "?preview=1" : "" }`)

  if(!res.ok) throw new Error(`Failed to load premium change file: HTTP ${ res.status }`)

  return await res.blob()
}

/**
 * Download a generated PL Renewal Premium Change xlsx
 */
export const downloadPersonalPremiumChangeFile = async (filename: string): Promise<void> => {
  triggerBlobDownload(await getPersonalPremiumChangeFileBlob(filename), filename)
}

/**
 * Delete a generated PL Renewal Premium Change xlsx
 *
 * DELETE /pl-renewal-premium-change/files/Jane_Doe_2026-10-18_Renewal_Change.xlsx
 */
export const deletePersonalPremiumChangeFile = async (filename: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/pl-renewal-premium-change/files/${ encodeURIComponent(filename) }`, {
    method: "DELETE",
  })

  if(!res.ok && res.status !== 404) throw new Error(`Failed to delete premium change file: HTTP ${ res.status }`)
}

/**
 * Send one turn of the PL Renewal Premium Change chat (scoped to customer_lookup, upcoming_renewals,
 * employee_lookup, and pl_renewal_premium_change), resuming the same agent session when sessionId is given
 *
 * POST /pl-renewal-premium-change/chat
 */
export const postPersonalPremiumChangeChat = async (message: string, sessionId: string | undefined): Promise<AppTypes.PersonalPremiumChangeChatTurn> => {
  const res = await authorizedFetch(`${ API_BASE }/pl-renewal-premium-change/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId })
  })

  if(!res.ok) throw new Error(`Failed to send chat message: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * List Proposal Builder documents grouped by creator; "mine" returns only the signed-in user's
 *
 * GET /proposal-builder/manifest?scope=mine
 */
export const getProposalManifest = async (scope: AppTypes.ProposalScope): Promise<AppTypes.ProposalManifest> => {
  const res = await authorizedFetch(`${ API_BASE }/proposal-builder/manifest?scope=${ scope }`)

  if(!res.ok) throw new Error(`Failed to load proposals: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * Fetch a generated proposal docx as a blob, for download or preview
 *
 * GET /proposal-builder/files/Acme_Corp_....docx
 */
export const getProposalFileBlob = async (filename: string, preview = false): Promise<Blob> => {
  const res = await authorizedFetch(`${ API_BASE }/proposal-builder/files/${ encodeURIComponent(filename) }${ preview ? "?preview=1" : "" }`)

  if(!res.ok) throw new Error(`Failed to load proposal file: HTTP ${ res.status }`)

  return await res.blob()
}

/**
 * Download a generated proposal docx
 */
export const downloadProposalFile = async (filename: string): Promise<void> => {
  triggerBlobDownload(await getProposalFileBlob(filename), filename)
}

/**
 * Download a generated proposal as a PDF, converted server-side from the docx
 *
 * GET /proposal-builder/files/Acme_Corp_....docx/pdf
 */
export const downloadProposalPdf = async (filename: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/proposal-builder/files/${ encodeURIComponent(filename) }/pdf`)

  if(!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error_description ?? `Failed to download proposal PDF: HTTP ${ res.status }`)
  }

  triggerBlobDownload(await res.blob(), filename.replace(/\.docx$/i, ".pdf"))
}

/**
 * Delete a generated proposal; only its creator may
 *
 * DELETE /proposal-builder/files/Acme_Corp_....docx
 */
export const deleteProposalFile = async (filename: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/proposal-builder/files/${ encodeURIComponent(filename) }`, {
    method: "DELETE",
  })

  if(!res.ok && res.status !== 404) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error_description ?? `Failed to delete proposal: HTTP ${ res.status }`)
  }
}

/**
 * Stage a quote (PDF, Word, Excel or a PNG/JPEG image) or AMS360 proposal (raw bytes, not multipart) for the next chat turn; the
 * server reads it in the background
 *
 * POST /proposal-builder/attachments?name=quote.pdf
 */
export const uploadProposalAttachment = async (file: File): Promise<AppTypes.ProposalAttachment> => {
  const res = await authorizedFetch(`${ API_BASE }/proposal-builder/attachments?name=${ encodeURIComponent(file.name) }`, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  })

  if(res.status === 413) throw new Error("File is too large (24 MB max).")
  if(!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error_description ?? `Failed to upload file: HTTP ${ res.status }`)
  }

  return await res.json()
}

/**
 * GET /proposal-builder/attachments/:id
 */
export const getProposalAttachment = async (id: string): Promise<AppTypes.ProposalAttachment> => {
  const res = await authorizedFetch(`${ API_BASE }/proposal-builder/attachments/${ encodeURIComponent(id) }`)

  if(!res.ok) throw new Error(`Failed to load attachment: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * DELETE /proposal-builder/attachments/:id
 */
export const deleteProposalAttachment = async (id: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/proposal-builder/attachments/${ encodeURIComponent(id) }`, {
    method: "DELETE",
  })

  if(!res.ok && res.status !== 404) throw new Error(`Failed to remove attachment: HTTP ${ res.status }`)
}

/**
 * Send one turn of the Proposal Builder chat (scoped to customer_lookup and proposal_builder) with
 * any staged attachments, resuming the same agent session when sessionId is given
 *
 * POST /proposal-builder/chat
 */
export const postProposalChat = async (message: string, attachmentIds: string[], sessionId: string | undefined, preparedBy: string | null): Promise<AppTypes.ProposalChatTurn> => {
  const res = await authorizedFetch(`${ API_BASE }/proposal-builder/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, attachment_ids: attachmentIds, session_id: sessionId, prepared_by: preparedBy ?? undefined })
  })

  if(!res.ok) throw new Error(`Failed to send chat message: HTTP ${ res.status }`)

  return await res.json()
}

const errorFrom = async (res: Response, fallback: string) => {
  const body = await res.json().catch(() => null)
  return new Error(body?.error_description ?? `${ fallback }: HTTP ${ res.status }`)
}

/**
 * List Policy Check runs grouped by creator, newest first; "mine" returns only the signed-in user's
 *
 * GET /policy-check/manifest?scope=mine
 */
export const getPolicyCheckManifest = async (scope: AppTypes.PolicyCheckScope): Promise<AppTypes.PolicyCheckManifest> => {
  const res = await authorizedFetch(`${ API_BASE }/policy-check/manifest?scope=${ scope }`)

  if(!res.ok) throw new Error(`Failed to load policy checks: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * Upload a PDF (raw bytes, not multipart) into one of the three role zones; the server reads it in
 * the background
 *
 * POST /policy-check/attachments?name=policy.pdf&role=compared
 */
export const uploadPolicyCheckAttachment = async (file: File, role: AppTypes.PolicyCheckRole): Promise<AppTypes.PolicyCheckAttachment> => {
  const res = await authorizedFetch(`${ API_BASE }/policy-check/attachments?name=${ encodeURIComponent(file.name) }&role=${ role }`, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  })

  if(res.status === 413) throw new Error("File is too large (24 MB max).")
  if(!res.ok) throw await errorFrom(res, "Failed to upload file")

  return await res.json()
}

/**
 * GET /policy-check/attachments/:id
 */
export const getPolicyCheckAttachment = async (id: string): Promise<AppTypes.PolicyCheckAttachment> => {
  const res = await authorizedFetch(`${ API_BASE }/policy-check/attachments/${ encodeURIComponent(id) }`)

  if(!res.ok) throw new Error(`Failed to load attachment: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * Move an attachment to another role zone; 409 once it's part of a check
 *
 * PATCH /policy-check/attachments/:id
 */
export const setPolicyCheckAttachmentRole = async (id: string, role: AppTypes.PolicyCheckRole): Promise<AppTypes.PolicyCheckAttachment> => {
  const res = await authorizedFetch(`${ API_BASE }/policy-check/attachments/${ encodeURIComponent(id) }`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  })

  if(!res.ok) throw await errorFrom(res, "Failed to move file")

  return await res.json()
}

/**
 * DELETE /policy-check/attachments/:id (409 in_use once it's part of a check; the check owns it then)
 */
export const deletePolicyCheckAttachment = async (id: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/policy-check/attachments/${ encodeURIComponent(id) }`, {
    method: "DELETE",
  })

  if(!res.ok && res.status !== 404 && res.status !== 409) throw new Error(`Failed to remove attachment: HTTP ${ res.status }`)
}

/**
 * Start a check in the background (2–6 minutes); needs a read baseline and a read compared document
 *
 * POST /policy-check/checks
 */
export const createPolicyCheck = async (attachmentIds: string[], notes?: string): Promise<AppTypes.PolicyCheckEntry> => {
  const res = await authorizedFetch(`${ API_BASE }/policy-check/checks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attachment_ids: attachmentIds, notes: notes || undefined }),
  })

  if(!res.ok) throw await errorFrom(res, "Failed to start the check")

  return await res.json()
}

/**
 * Delete a check and its attachments; only its creator may. A running check's result is discarded.
 *
 * DELETE /policy-check/checks/:id
 */
export const deletePolicyCheck = async (id: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/policy-check/checks/${ encodeURIComponent(id) }`, {
    method: "DELETE",
  })

  if(!res.ok && res.status !== 404) throw await errorFrom(res, "Failed to delete check")
}

/**
 * Fetch a finished check's report docx as a blob, for download or preview
 *
 * GET /policy-check/files/Acme_Corp_....docx
 */
export const getPolicyCheckFileBlob = async (filename: string, preview = false): Promise<Blob> => {
  const res = await authorizedFetch(`${ API_BASE }/policy-check/files/${ encodeURIComponent(filename) }${ preview ? "?preview=1" : "" }`)

  if(!res.ok) throw new Error(`Failed to load policy check file: HTTP ${ res.status }`)

  return await res.blob()
}

export const downloadPolicyCheckFile = async (filename: string): Promise<void> => {
  triggerBlobDownload(await getPolicyCheckFileBlob(filename), filename)
}

/**
 * GET /policy-check/files/Acme_Corp_....docx/pdf (503 converter_unavailable possible)
 */
export const downloadPolicyCheckPdf = async (filename: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/policy-check/files/${ encodeURIComponent(filename) }/pdf`)

  if(!res.ok) throw await errorFrom(res, "Failed to download policy check PDF")

  triggerBlobDownload(await res.blob(), filename.replace(/\.docx$/i, ".pdf"))
}

/**
 * Send one turn of the Policy Check chat with the ids of every file currently in the zones, so
 * Claude can see what's loaded; it may start a check itself (policy_check tool)
 *
 * POST /policy-check/chat
 */
export const postPolicyCheckChat = async (message: string, attachmentIds: string[], sessionId: string | undefined): Promise<AppTypes.PolicyCheckChatTurn> => {
  const res = await authorizedFetch(`${ API_BASE }/policy-check/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, attachment_ids: attachmentIds, session_id: sessionId })
  })

  if(!res.ok) throw new Error(`Failed to send chat message: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * List CL Coverage Comparison runs grouped by creator, newest first; "mine" returns only the signed-in user's
 *
 * GET /coverage-comparison/manifest?scope=mine
 */
export const getCoverageComparisonManifest = async (scope: AppTypes.CoverageComparisonScope): Promise<AppTypes.CoverageComparisonManifest> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-comparison/manifest?scope=${ scope }`)

  if(!res.ok) throw new Error(`Failed to load coverage comparisons: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * Upload a PDF (raw bytes, not multipart) into Set A or Set B; the server reads it in the background
 *
 * POST /coverage-comparison/attachments?name=bop.pdf&role=set_a
 */
export const uploadCoverageComparisonAttachment = async (file: File, role: AppTypes.CoverageComparisonRole): Promise<AppTypes.CoverageComparisonAttachment> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-comparison/attachments?name=${ encodeURIComponent(file.name) }&role=${ role }`, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  })

  if(res.status === 413) throw new Error("File is too large (24 MB max).")
  if(!res.ok) throw await errorFrom(res, "Failed to upload file")

  return await res.json()
}

/**
 * GET /coverage-comparison/attachments/:id
 */
export const getCoverageComparisonAttachment = async (id: string): Promise<AppTypes.CoverageComparisonAttachment> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-comparison/attachments/${ encodeURIComponent(id) }`)

  if(!res.ok) throw new Error(`Failed to load attachment: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * Move an attachment to the other set; 409 once it's part of a comparison
 *
 * PATCH /coverage-comparison/attachments/:id
 */
export const setCoverageComparisonAttachmentRole = async (id: string, role: AppTypes.CoverageComparisonRole): Promise<AppTypes.CoverageComparisonAttachment> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-comparison/attachments/${ encodeURIComponent(id) }`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  })

  if(!res.ok) throw await errorFrom(res, "Failed to move file")

  return await res.json()
}

/**
 * DELETE /coverage-comparison/attachments/:id (409 once it's part of a comparison; the comparison owns it then)
 */
export const deleteCoverageComparisonAttachment = async (id: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-comparison/attachments/${ encodeURIComponent(id) }`, {
    method: "DELETE",
  })

  if(!res.ok && res.status !== 404 && res.status !== 409) throw new Error(`Failed to remove attachment: HTTP ${ res.status }`)
}

/**
 * Start a comparison in the background (a few minutes); needs a read file in each set. The set labels
 * are optional column headers, read from the documents when left out.
 *
 * POST /coverage-comparison/comparisons
 */
export const createCoverageComparison = async (attachmentIds: string[], options: { notes?: string, setALabel?: string, setBLabel?: string }): Promise<AppTypes.CoverageComparisonEntry> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-comparison/comparisons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attachment_ids: attachmentIds,
      notes: options.notes || undefined,
      set_a_label: options.setALabel || undefined,
      set_b_label: options.setBLabel || undefined,
    }),
  })

  if(!res.ok) throw await errorFrom(res, "Failed to start the comparison")

  return await res.json()
}

/**
 * Delete a comparison and its attachments; only its creator may. A running comparison's result is discarded.
 *
 * DELETE /coverage-comparison/comparisons/:id
 */
export const deleteCoverageComparison = async (id: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-comparison/comparisons/${ encodeURIComponent(id) }`, {
    method: "DELETE",
  })

  if(!res.ok && res.status !== 404) throw await errorFrom(res, "Failed to delete comparison")
}

/**
 * GET /coverage-comparison/files/Acme_Corp_....docx
 */
export const getCoverageComparisonFileBlob = async (filename: string, preview = false): Promise<Blob> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-comparison/files/${ encodeURIComponent(filename) }${ preview ? "?preview=1" : "" }`)

  if(!res.ok) throw new Error(`Failed to load coverage comparison file: HTTP ${ res.status }`)

  return await res.blob()
}

export const downloadCoverageComparisonFile = async (filename: string): Promise<void> => {
  triggerBlobDownload(await getCoverageComparisonFileBlob(filename), filename)
}

/**
 * GET /coverage-comparison/files/Acme_Corp_....docx/pdf
 */
export const downloadCoverageComparisonPdf = async (filename: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-comparison/files/${ encodeURIComponent(filename) }/pdf`)

  if(!res.ok) throw await errorFrom(res, "Failed to download coverage comparison PDF")

  triggerBlobDownload(await res.blob(), filename.replace(/\.docx$/i, ".pdf"))
}

/**
 * Send one turn of the CL Coverage Comparison chat with the ids of every file in the two sets; it may
 * start a comparison itself (coverage_comparison tool)
 *
 * POST /coverage-comparison/chat
 */
export const postCoverageComparisonChat = async (message: string, attachmentIds: string[], sessionId: string | undefined): Promise<AppTypes.CoverageComparisonChatTurn> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-comparison/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, attachment_ids: attachmentIds, session_id: sessionId })
  })

  if(!res.ok) throw new Error(`Failed to send chat message: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * GET /coverage-gap/manifest?scope=mine
 */
export const getCoverageGapManifest = async (scope: AppTypes.CoverageGapScope): Promise<AppTypes.CoverageGapManifest> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-gap/manifest?scope=${ scope }`)

  if(!res.ok) throw new Error(`Failed to load gap analyses: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * Upload a policy PDF (raw bytes, not multipart); the server reads it in the background
 *
 * POST /coverage-gap/attachments?name=bop.pdf
 */
export const uploadCoverageGapAttachment = async (file: File): Promise<AppTypes.CoverageGapAttachment> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-gap/attachments?name=${ encodeURIComponent(file.name) }`, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  })

  if(res.status === 413) throw new Error("File is too large (24 MB max).")
  if(!res.ok) throw await errorFrom(res, "Failed to upload file")

  return await res.json()
}

/**
 * GET /coverage-gap/attachments/:id
 */
export const getCoverageGapAttachment = async (id: string): Promise<AppTypes.CoverageGapAttachment> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-gap/attachments/${ encodeURIComponent(id) }`)

  if(!res.ok) throw new Error(`Failed to load attachment: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * DELETE /coverage-gap/attachments/:id (409 once it's part of an analysis; the analysis owns it then)
 */
export const deleteCoverageGapAttachment = async (id: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-gap/attachments/${ encodeURIComponent(id) }`, {
    method: "DELETE",
  })

  if(!res.ok && res.status !== 404 && res.status !== 409) throw new Error(`Failed to remove attachment: HTTP ${ res.status }`)
}

/**
 * Start a gap analysis in the background (a few minutes); needs at least one read policy
 *
 * POST /coverage-gap/analyses
 */
export const createCoverageGapAnalysis = async (attachmentIds: string[], notes: string): Promise<AppTypes.CoverageGapEntry> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-gap/analyses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attachment_ids: attachmentIds, notes: notes || undefined }),
  })

  if(!res.ok) throw await errorFrom(res, "Failed to start the gap analysis")

  return await res.json()
}

/**
 * DELETE /coverage-gap/analyses/:id
 */
export const deleteCoverageGapAnalysis = async (id: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-gap/analyses/${ encodeURIComponent(id) }`, {
    method: "DELETE",
  })

  if(!res.ok && res.status !== 404) throw await errorFrom(res, "Failed to delete gap analysis")
}

/**
 * GET /coverage-gap/files/Acme_Corp_....docx
 */
export const getCoverageGapFileBlob = async (filename: string, preview = false): Promise<Blob> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-gap/files/${ encodeURIComponent(filename) }${ preview ? "?preview=1" : "" }`)

  if(!res.ok) throw new Error(`Failed to load gap analysis file: HTTP ${ res.status }`)

  return await res.blob()
}

export const downloadCoverageGapFile = async (filename: string): Promise<void> => {
  triggerBlobDownload(await getCoverageGapFileBlob(filename), filename)
}

/**
 * GET /coverage-gap/files/Acme_Corp_....docx/pdf
 */
export const downloadCoverageGapPdf = async (filename: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-gap/files/${ encodeURIComponent(filename) }/pdf`)

  if(!res.ok) throw await errorFrom(res, "Failed to download gap analysis PDF")

  triggerBlobDownload(await res.blob(), filename.replace(/\.docx$/i, ".pdf"))
}

/**
 * Send one turn of the Coverage Gap chat with the staged file ids and the current account notes; it may
 * start an analysis itself (coverage_gap_analysis tool)
 *
 * POST /coverage-gap/chat
 */
export const postCoverageGapChat = async (message: string, attachmentIds: string[], accountNotes: string, sessionId: string | undefined): Promise<AppTypes.CoverageGapChatTurn> => {
  const res = await authorizedFetch(`${ API_BASE }/coverage-gap/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, attachment_ids: attachmentIds, account_notes: accountNotes || undefined, session_id: sessionId })
  })

  if(!res.ok) throw new Error(`Failed to send chat message: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * Status of scheduled cron jobs, in the order requested
 *
 * GET /jobs?names=cl-renewal-summaries,morning-download
 */
export const getJobStatuses = async (names: string[]): Promise<AppTypes.JobStatus[]> => {
  const res = await authorizedFetch(`${ API_BASE }/jobs?names=${ names.map(encodeURIComponent).join(",") }`)

  if(!res.ok) throw new Error(`Failed to load job status: HTTP ${ res.status }`)

  const body: { jobs: AppTypes.JobStatus[] } = await res.json()
  return body.jobs
}

/**
 * All-time download counts keyed by tool id; a missing tool means 0
 *
 * GET /downloads/stats
 */
export const getDownloadStats = async (): Promise<AppTypes.DownloadCounts> => {
  const res = await authorizedFetch(`${ API_BASE }/downloads/stats`)

  if(!res.ok) throw new Error(`Failed to load download stats: HTTP ${ res.status }`)

  const body: { counts: AppTypes.DownloadCounts } = await res.json()
  return body.counts
}

/**
 * Attach a file to the Boxwood Assistant chat (raw bytes, not multipart). Synchronous: the server
 * converts it before answering, a few seconds for Word or .xls.
 *
 * POST /assistant/attachments?name=quote.pdf
 */
export const uploadAssistantAttachment = async (file: File): Promise<AppTypes.AssistantAttachment> => {
  const res = await authorizedFetch(`${ API_BASE }/assistant/attachments?name=${ encodeURIComponent(file.name) }`, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  })

  if(res.status === 413) throw new Error("File is too large (24 MB max).")
  if(!res.ok) throw await errorFrom(res, "Failed to attach file")

  return await res.json()
}

/**
 * GET /assistant/attachments/:id, or null once it has expired or been removed (404)
 */
export const getAssistantAttachment = async (id: string): Promise<AppTypes.AssistantAttachment | null> => {
  const res = await authorizedFetch(`${ API_BASE }/assistant/attachments/${ encodeURIComponent(id) }`)

  if(res.status === 404) return null
  if(!res.ok) throw new Error(`Failed to load attachment: HTTP ${ res.status }`)

  return await res.json()
}

/**
 * DELETE /assistant/attachments/:id (404 means it's already gone)
 */
export const deleteAssistantAttachment = async (id: string): Promise<void> => {
  const res = await authorizedFetch(`${ API_BASE }/assistant/attachments/${ encodeURIComponent(id) }`, {
    method: "DELETE",
  })

  if(!res.ok && res.status !== 404) throw new Error(`Failed to remove attachment: HTTP ${ res.status }`)
}

/**
 * Thrown when files on the chat have expired or been removed, so the chat can drop their chips
 */
export class AssistantAttachmentsMissingError extends Error {
  readonly missing: string[]

  constructor(message: string, missing: string[]) {
    super(message)
    this.missing = missing
  }
}

/**
 * Send the Boxwood Assistant conversation and stream its reply. onDelta gets each chunk of text as it
 * arrives; resolves when the reply is done. Errors carry a message written for staff: validation,
 * rate-limit and auth errors come back as JSON before the stream, mid-stream ones as an error event.
 *
 * POST /assistant/chat (text/event-stream: delta {text} … done {} | error {message})
 * 404 attachment_not_found → AssistantAttachmentsMissingError with the ids that are gone
 */
export const streamAssistantChat = async (
  messages: AppTypes.AssistantMessage[],
  context: AppTypes.AssistantContext,
  attachmentIds: string[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> => {
  // Every turn sends all the chat's files; the server puts them at the start of the conversation
  const res = await authorizedFetch(`${ API_BASE }/assistant/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ messages, context, attachment_ids: attachmentIds.length ? attachmentIds : undefined }),
    signal,
  })

  if(!res.ok || !res.body) {
    const err = await res.json().catch(() => null)
    if(err?.error === "attachment_not_found") throw new AssistantAttachmentsMissingError(err.error_description, err.missing ?? [])
    throw new Error(err?.error_description ?? err?.error ?? (res.status === 429 ?
      "You've sent a lot of messages in a short time. Please wait a few minutes and try again." :
      `The assistant isn't available right now (HTTP ${ res.status }).`))
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ""

  for(;;) {
    const { value, done } = await reader.read()
    if(done) break
    buffer += value

    // SSE events are separated by a blank line; keep any partial event for the next chunk
    const events = buffer.split(/\r?\n\r?\n/)
    buffer = events.pop() ?? ""

    for(const raw of events) {
      const { event, data } = parseSseEvent(raw)
      if(event === "delta") onDelta(data?.text ?? "")
      else if(event === "error") throw new Error(data?.message ?? "Something went wrong. Please try again.")
      else if(event === "done") return
    }
  }

  throw new Error("The reply was cut off. Please try again.")
}

const parseSseEvent = (raw: string) => {
  let event = "message"
  const dataLines: string[] = []

  for(const line of raw.split(/\r?\n/)) {
    if(line.startsWith("event:")) event = line.slice(6).trim()
    else if(line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^ /, ""))
  }

  try {
    return { event, data: dataLines.length ? JSON.parse(dataLines.join("\n")) : null }
  } catch {
    return { event, data: null }
  }
}
