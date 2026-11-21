// The branded HTML body of a share email. Outlook renders HTML with Word's engine, so this sticks to
// what it supports: nested tables for layout, inline styles, web-safe fonts, and a table-cell button
// (no CSS variables, flexbox, or web fonts). Colours are the boxwood theme's (src/index.css).
const BRAND = {
  primary: "#157fa5",
  secondary: "#b44272",
  text: "#0a0a0a",
  muted: "#5c5c5c",
  border: "#e2e2e2",
  page: "#f6f6f6",
  font: "'Segoe UI', Arial, Helvetica, sans-serif",
}

export const LOGO_CID = "boxwood-logo"

export type ShareEmail = { clientName: string, documentType: string, url: string }

export const SIGN_IN_NOTE = "You'll need to be signed in to Boxwood Employee Tools to open it."

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

export const shareSubject = ({ clientName, documentType }: ShareEmail) => `Sharing: ${ clientName } ${ documentType }`

export const shareText = ({ clientName, documentType, url }: ShareEmail) =>
  `Hi,\r\n\r\nI'm sharing the ${ documentType } for ${ clientName }:\r\n\r\n${ url }\r\n\r\n${ SIGN_IN_NOTE }\r\n`

export const shareHtml = (email: ShareEmail) => {
  const client = escapeHtml(email.clientName)
  const type = escapeHtml(email.documentType)
  const url = escapeHtml(email.url)

  return `<!DOCTYPE html>
<html>
<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head>
<body style="margin:0;padding:0;background:${ BRAND.page };">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${ BRAND.page };">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid ${ BRAND.border };">
    <tr><td style="padding:20px 28px;border-bottom:3px solid ${ BRAND.primary };">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="padding-right:14px;vertical-align:middle;">
          <img src="cid:${ LOGO_CID }" width="52" height="52" alt="Boxwood Insurance Group" style="display:block;border:0;">
        </td>
        <td style="vertical-align:middle;font-family:${ BRAND.font };">
          <div style="font-size:20px;font-weight:bold;color:${ BRAND.text };">Boxwood Insurance Group</div>
          <div style="font-size:14px;font-weight:bold;color:${ BRAND.secondary };">Employee Tools</div>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:28px;font-family:${ BRAND.font };font-size:15px;line-height:22px;color:${ BRAND.text };">
      <p style="margin:0 0 16px;">Hi,</p>
      <p style="margin:0 0 24px;">I'm sharing the <strong>${ type }</strong> for <strong>${ client }</strong>.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td bgcolor="${ BRAND.primary }" style="background:${ BRAND.primary };padding:12px 24px;">
          <a href="${ url }" style="font-family:${ BRAND.font };font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">Open ${ type }</a>
        </td>
      </tr></table>
      <p style="margin:24px 0 0;font-size:13px;line-height:19px;color:${ BRAND.muted };">
        Or open this link: <a href="${ url }" style="color:${ BRAND.primary };">${ url }</a>
      </p>
    </td></tr>
    <tr><td style="padding:16px 28px;border-top:1px solid ${ BRAND.border };font-family:${ BRAND.font };font-size:12px;line-height:18px;color:${ BRAND.muted };">
      ${ SIGN_IN_NOTE }
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`
}
