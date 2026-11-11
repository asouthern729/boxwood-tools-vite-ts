import { useEffect, useRef, useState } from "react"
import { read } from "xlsx"

// Types
import type { WorkBook } from "xlsx"

export const useHandleXlsxPreviewModal = (open: boolean, fetchBlob: () => Promise<Blob>, reloadKey?: number) => {
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

  return { workbook, isLoading, isRefreshing, error, refs: { dialogRef } }
}
