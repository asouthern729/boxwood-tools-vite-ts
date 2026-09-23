import { useEffect, useRef, useState } from "react"
import { read } from "xlsx"

// Types
import type { ReactNode } from "react"
import type { WorkBook } from "xlsx"

// Components
import LoadingMsg from "@components/team/utils/LoadingMsg"
import ErrorMsg from "@components/team/utils/ErrorMsg"

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
  const dialogRef = useRef<HTMLDialogElement>(null)
  const hasLoadedRef = useRef(false)
  const [workbook, setWorkbook] = useState<WorkBook | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if(open) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [open])

  useEffect(() => {
    if(!open) return

    let cancelled = false
    if(hasLoadedRef.current) setIsRefreshing(true)
    else setIsLoading(true)
    setError(null)

    fetchBlob()
      .then((blob) => blob.arrayBuffer())
      .then((buffer) => {
        if(cancelled) return
        setWorkbook(read(buffer, { type: "array" }))
        hasLoadedRef.current = true
      })
      .catch(() => {
        if(!cancelled) setError(hasLoadedRef.current ?
          "Couldn't refresh — showing the last loaded version." :
          "Couldn't load this workbook for preview.")
      })
      .finally(() => {
        if(!cancelled) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      })

    return () => { cancelled = true }
  }, [open, fetchBlob, reloadKey])

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-h-[85vh] max-w-4xl">
        <h3 className="mb-4 text-lg font-bold">{title}</h3>

        {isLoading && <LoadingMsg />}
        {error && <ErrorMsg message={error} />}

        {workbook && (
          <div className="max-h-[65vh] overflow-auto rounded-box border border-base-300">
            {isRefreshing && (
              <p className="p-2 text-center text-sm text-base-content/60 italic">Refreshing…</p>
            )}
            {children(workbook)}
          </div>
        )}

        <div className="modal-action">
          {footerActions}
          <form method="dialog">
            <button type="submit" className="btn">Close</button>
          </form>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  )
}

export default XlsxPreviewModal
