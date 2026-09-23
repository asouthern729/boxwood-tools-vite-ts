import { useState } from "react"

export const usePreviewModal = (fetchBlob: () => Promise<Blob>) => {
  const [open, setOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  return {
    open,
    show: () => setOpen(true),
    hide: () => setOpen(false),
    reload: () => setReloadKey((n) => n + 1),
    reloadKey,
    fetchBlob,
  }
}
