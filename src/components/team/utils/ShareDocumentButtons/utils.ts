import boxwoodLogo from "@assets/boxwood-logo.png"
import { LOGO_CID, shareHtml, shareSubject, shareText, type ShareEmail } from "./emailTemplate"

// The open document's own URL: the page already carries ?doc=<id>, and filters live in
// localStorage, so the address bar is exactly what a colleague needs.
export const currentDocumentUrl = () => window.location.href

// Bytes → base64, wrapped at 76 characters as MIME requires
const base64Lines = (bytes: Uint8Array) => {
  let binary = ""
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/.{76}(?=.)/g, "$&\r\n")
}

const base64Utf8 = (text: string) => base64Lines(new TextEncoder().encode(text))

// RFC 2047 encoded-word, so client names with accents survive in the Subject header
const encodeHeader = (text: string) => `=?UTF-8?B?${ base64Utf8(text).replace(/\r\n/g, "") }?=`

// mailto: can only carry plain text, so the email is an .eml draft instead: a branded HTML body
// with the logo attached inline (cid:, which Outlook shows without a "download pictures" prompt),
// plus a plain-text alternative. X-Unsent: 1 makes Outlook open it as an editable draft.
export const buildShareEml = (email: ShareEmail, logo: Uint8Array) => {
  const alt = `alt-${ crypto.randomUUID() }`
  const related = `rel-${ crypto.randomUUID() }`

  return [
    `Subject: ${ encodeHeader(shareSubject(email)) }`,
    "X-Unsent: 1",
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${ alt }"`,
    "",
    `--${ alt }`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    base64Utf8(shareText(email)),
    `--${ alt }`,
    `Content-Type: multipart/related; boundary="${ related }"`,
    "",
    `--${ related }`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    base64Utf8(shareHtml(email)),
    `--${ related }`,
    "Content-Type: image/png",
    "Content-Transfer-Encoding: base64",
    `Content-ID: <${ LOGO_CID }>`,
    `Content-Disposition: inline; filename="boxwood-logo.png"`,
    "",
    base64Lines(logo),
    `--${ related }--`,
    `--${ alt }--`,
    "",
  ].join("\r\n")
}

// Downloads the draft; opening it from the browser's downloads launches Outlook's compose window.
export const downloadShareEml = async (clientName: string, documentType: string) => {
  const logo = new Uint8Array(await (await fetch(boxwoodLogo)).arrayBuffer())
  const eml = buildShareEml({ clientName, documentType, url: currentDocumentUrl() }, logo)

  const href = URL.createObjectURL(new Blob([eml], { type: "message/rfc822" }))
  const link = document.createElement("a")
  link.href = href
  link.download = `${ `${ clientName } ${ documentType }`.replace(/[\\/:*?"<>|]+/g, "").trim() || "Shared document" }.eml`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(href)
}
