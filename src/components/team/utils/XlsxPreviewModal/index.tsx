import { useHandleXlsxPreviewModal } from "./hooks"

// Types
import type { ReactNode } from "react"
import type { WorkBook } from "xlsx"

// Components
import LoadingMsg from "@components/team/utils/LoadingMsg"
import ErrorMsg from "@components/team/utils/ErrorMsg"
import * as PreviewModal from "@components/team/utils/PreviewModal/components"
import * as Components from "./components"

type XlsxPreviewModalProps = {
  title: string
  open: boolean
  onClose: () => void
  fetchBlob: () => Promise<Blob>
  reloadKey?: number
  footerActions?: ReactNode
  children: (workbook: WorkBook) => ReactNode
}

function XlsxPreviewModal({ title, open, onClose, fetchBlob, reloadKey, footerActions, children }: XlsxPreviewModalProps) {
  const { workbook, isLoading, isRefreshing, error, refs } = useHandleXlsxPreviewModal(open, fetchBlob, reloadKey)

  return (
    <dialog ref={refs.dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-h-[85vh] max-w-4xl">
        <h3 className="mb-4 text-lg font-bold">{title}</h3>

        {isLoading && <LoadingMsg />}
        {error && <ErrorMsg message={error} />}

        {workbook && (
          <Components.WorkbookView isRefreshing={isRefreshing}>
            {children(workbook)}
          </Components.WorkbookView>
        )}

        <PreviewModal.ModalActions>
          {footerActions}
        </PreviewModal.ModalActions>
      </div>
      <PreviewModal.ModalBackdrop />
    </dialog>
  )
}

export default XlsxPreviewModal
