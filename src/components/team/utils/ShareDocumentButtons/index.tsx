import emailIcon from "@assets/icons/email/email.svg"
import linkIcon from "@assets/icons/link/link.svg"
import { useCopyDocumentLink } from "./hooks"
import { currentDocumentUrl, shareMailto } from "./utils"

const COPY_LABELS = { idle: "Copy link", copied: "Copied!", failed: "Couldn't copy" }

// The icons are black line art; invert them on dark themes so they stay visible
const ICON_CLASS = "size-4 dark:invert"

// A preview modal's share buttons: copy the document's URL, or start an email with it in the
// user's mail app. documentName reads naturally in a sentence, e.g. "Acme Corp CL Renewal Summary".
function ShareDocumentButtons({ documentName }: { documentName: string }) {
  const { copy, status } = useCopyDocumentLink()

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
      <a
        href={shareMailto(documentName, currentDocumentUrl())}
        className="btn btn-ghost">
          <img src={emailIcon} alt="" className={ICON_CLASS} />
          Email link
      </a>
    </div>
  )
}

export default ShareDocumentButtons
