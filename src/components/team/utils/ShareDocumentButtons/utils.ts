// The open document's own URL: the page already carries ?doc=<id>, and filters live in
// localStorage, so the address bar is exactly what a colleague needs.
export const currentDocumentUrl = () => window.location.href

// mailto: only takes plain text, so the link is a bare URL — mail apps turn it into a hyperlink.
export const shareMailto = (documentName: string, url: string) => {
  const subject = `Sharing: ${ documentName }`
  const body = `Here's the ${ documentName }:\n\n${ url }\n\nYou'll need to be signed in to Boxwood Employee Tools to open it.`

  return `mailto:?subject=${ encodeURIComponent(subject) }&body=${ encodeURIComponent(body) }`
}
