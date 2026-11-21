import { useNavigate } from "react-router"
import { useCreateLinkedDocument, type CreateLinked } from "./hooks"
import { documentPath, groupLinks, splitLinkLabel, type LinkGroup } from "./utils"

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
      {groupLinks(links).map((group) => group.links.length === 1 ?
        <button
          key={group.links[0].id}
          type="button"
          onClick={() => navigate(documentPath(group.links[0].tool, group.links[0].id))}
          className="btn btn-secondary">
            Open {group.links[0].label}
        </button> :
        <LinkMenu
          key={group.tool}
          group={group}
          onOpen={(link) => navigate(documentPath(link.tool, link.id))} />
      )}
    </>
  )
}

// Several documents on one tool (a spreadsheet whose terms span more than one CL summary): one
// button that opens a menu of them, listed by what tells them apart (their policies, or month).
// Opens upward, since it sits at the bottom of the modal.
const LinkMenu = ({ group, onOpen }: { group: LinkGroup, onOpen: (link: DocumentLink) => void }) => (
  <div className="dropdown dropdown-top dropdown-end">
    <div tabIndex={0} role="button" className="btn btn-secondary">
      Open {group.label}
      <span aria-hidden="true">▾</span>
    </div>
    <ul tabIndex={-1} className="dropdown-content menu z-10 mb-1 w-72 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
      {group.links.map((link) => (
        <li key={link.id}>
          <button type="button" onClick={() => onOpen(link)}>
            {splitLinkLabel(link.label).detail ?? link.label}
          </button>
        </li>
      ))}
    </ul>
  </div>
)

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
