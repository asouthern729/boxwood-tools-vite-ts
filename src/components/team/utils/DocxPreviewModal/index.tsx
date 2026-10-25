import { useHandleDocPreviewModal } from "./hooks"

// Components
import LoadingMsg from "@components/team/utils/LoadingMsg"
import ErrorMsg from "@components/team/utils/ErrorMsg"
import * as PreviewModal from "@components/team/utils/PreviewModal/components"

type DocxPreviewModalProps = {
  title: string
  open: boolean
  onClose: () => void
  fetchBlob: () => Promise<Blob>
}

function DocxPreviewModal({ title, open, onClose, fetchBlob }: DocxPreviewModalProps) {
  const { isLoading, error, refs } = useHandleDocPreviewModal(open, fetchBlob)

  return (
    <dialog ref={refs.dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-h-[85vh] max-w-4xl">
        <h3 className="mb-4 text-lg font-bold">{title}</h3>

        {isLoading && <LoadingMsg />}
        {error && <ErrorMsg message={error} />}

        <div
          ref={refs.bodyRef}
          className="max-h-[65vh] overflow-y-auto rounded-box border border-base-300 bg-white"
          hidden={isLoading || !!error} />

        <PreviewModal.ModalActions />
      </div>
      <PreviewModal.ModalBackdrop />
    </dialog>
  )
}

export default DocxPreviewModal
