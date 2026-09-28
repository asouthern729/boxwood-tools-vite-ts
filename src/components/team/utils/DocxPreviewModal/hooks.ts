import { useRef, useState, useEffect } from "react"
import { renderAsync } from "docx-preview"

export const useHandleDocPreviewModal = (open: boolean, fetchBlob: () => Promise<Blob>) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if(open) {
      dialogRef.current?.showModal()
    } else dialogRef.current?.close()
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

  return { isLoading, error, refs: { dialogRef, bodyRef } }
}