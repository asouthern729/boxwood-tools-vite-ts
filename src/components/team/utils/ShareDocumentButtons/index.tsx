import { useState } from "react"
import emailIcon from "@assets/icons/email/email.svg"
import linkIcon from "@assets/icons/link/link.svg"
import { useCopyDocumentLink } from "./hooks"
import { downloadShareEml } from "./utils"

const COPY_LABELS = { idle: "Copy link", copied: "Copied!", failed: "Couldn't copy" }

// The icons are black line art; invert them on dark themes so they stay visible
const ICON_CLASS = "size-4 dark:invert"

// A preview modal's share buttons: copy the document's URL, or download an Outlook draft email
// with a branded hyperlink to it.
function ShareDocumentButtons({ clientName, documentType }: { clientName: string, documentType: string }) {
  const { copy, status } = useCopyDocumentLink()
  const [emailFailed, setEmailFailed] = useState(false)

  const emailLink = () => {
    setEmailFailed(false)
    downloadShareEml(clientName, documentType).catch(() => setEmailFailed(true))
  }

  return (
    <div className="mr-auto flex flex-wrap gap-2">
      <button
        type="button"
        onClick={copy}
        aria-live="polite"
        className={`btn btn-ghost ${ status === "failed" ? "text-error" : "" }`}>
          <img src={linkIcon} alt="" className={ICON_CLASS} />
          {COPY_LABELS[status]}
      </button>
      <button
        type="button"
        onClick={emailLink}
        title="Downloads an Outlook draft. Open it to add a recipient and send."
        className={`btn btn-ghost ${ emailFailed ? "text-error" : "" }`}>
          <img src={emailIcon} alt="" className={ICON_CLASS} />
          {emailFailed ? "Couldn't build email" : "Email link"}
      </button>
    </div>
  )
}

export default ShareDocumentButtons
