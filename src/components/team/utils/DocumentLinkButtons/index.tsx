import { useNavigate } from "react-router"
import { useCreateLinkedDocument, type CreateLinked } from "./hooks"
import { documentPath } from "./utils"

// Types
import type { DocumentLink } from "@context/App/types"

type DocumentLinkButtonsProps = {
  links?: DocumentLink[]
  // Offered when there's nothing to link to yet; omit where the document can't be the source
  createLinked?: CreateLinked
}

// A preview modal's buttons to the documents linked to it (the same policy terms on another tool) —
// each opens that tool's page with the linked document's preview already open. With no links yet,
// offers to build the linked document instead.
function DocumentLinkButtons({ links, createLinked }: DocumentLinkButtonsProps) {
  const navigate = useNavigate()

  if(!links?.length) {
    return createLinked ?
      <CreateLinkedButton createLinked={createLinked} /> :
      null
  }

  return (
    <>
      {links.map((link) => (
        <button
          key={link.id}
          type="button"
          onClick={() => navigate(documentPath(link.tool, link.id))}
          className="btn btn-secondary">
            Open {link.label}
        </button>
      ))}
    </>
  )
}

const CreateLinkedButton = ({ createLinked }: { createLinked: CreateLinked }) => {
  const { build, isPending, error } = useCreateLinkedDocument(createLinked)

  return (
    <>
      {error && (
        <span role="alert" className="self-center text-sm text-error">{error.message}</span>
      )}
      <button
        type="button"
        disabled={isPending}
        onClick={build}
        className="btn btn-secondary btn-outline">
          {isPending && <span className="loading loading-spinner loading-xs" />}
          {isPending ? "Building…" : `Create ${ createLinked.label }`}
      </button>
    </>
  )
}

export default DocumentLinkButtons
