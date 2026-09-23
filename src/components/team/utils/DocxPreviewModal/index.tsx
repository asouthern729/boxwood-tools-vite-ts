import { useEffect, useRef, useState } from "react"
import { renderAsync } from "docx-preview"

// Components
import LoadingMsg from "@components/team/utils/LoadingMsg"
import ErrorMsg from "@components/team/utils/ErrorMsg"

type DocxPreviewModalProps = {
  title: string
  open: boolean
  onClose: () => void
  fetchBlob: () => Promise<Blob>
}

function DocxPreviewModal({ title, open, onClose, fetchBlob }: DocxPreviewModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if(open) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [open])

  useEffect(() => {
    if(!open || !bodyRef.current) return

    let cancelled = false
    setIsLoading(true)
    setError(null)
    bodyRef.current.innerHTML = ""

    fetchBlob()
      .then((blob) => cancelled ? undefined : renderAsync(blob, bodyRef.current!, undefined, { inWrapper: true }))
      .catch(() => {
        if(!cancelled) setError("Couldn't load this document for preview.")
      })
      .finally(() => {
        if(!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [open, fetchBlob])

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-h-[85vh] max-w-4xl">
        <h3 className="mb-4 text-lg font-bold">{title}</h3>

        {isLoading && <LoadingMsg />}
        {error && <ErrorMsg message={error} />}

        <div
          ref={bodyRef}
          className="max-h-[65vh] overflow-y-auto rounded-box border border-base-300 bg-white"
          hidden={isLoading || !!error} />

        <div className="modal-action">
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

export default DocxPreviewModal
