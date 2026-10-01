import { useState, useRef, useEffect } from "react"
import { hasDraggedFiles, partitionPdfFiles } from "./utils"

// Keeps a drop that misses every drop zone from navigating the browser to the file
export const usePreventWindowFileDrop = () => {
  useEffect(() => {
    const preventDragOver = (e: DragEvent) => {
      if(e.defaultPrevented || !hasDraggedFiles(e.dataTransfer)) return
      e.preventDefault()
      e.dataTransfer!.dropEffect = "none"
    }
    const preventDrop = (e: DragEvent) => {
      if(hasDraggedFiles(e.dataTransfer)) e.preventDefault()
    }

    window.addEventListener("dragover", preventDragOver)
    window.addEventListener("drop", preventDrop)

    return () => {
      window.removeEventListener("dragover", preventDragOver)
      window.removeEventListener("drop", preventDrop)
    }
  }, [])
}

export const useHandlePdfDropZone = (onFiles: (files: File[], rejected: string[]) => void) => {
  const [isDragging, setIsDragging] = useState(false)
  const dragDepth = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = (files: File[]) => {
    const { accepted, rejected } = partitionPdfFiles(files)
    onFiles(accepted, rejected)
  }

  const dropHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      if(!hasDraggedFiles(e.dataTransfer)) return
      e.preventDefault()
      dragDepth.current += 1
      setIsDragging(true)
    },
    onDragOver: (e: React.DragEvent) => {
      if(!hasDraggedFiles(e.dataTransfer)) return
      e.preventDefault()
      e.dataTransfer.dropEffect = "copy"
    },
    onDragLeave: (e: React.DragEvent) => {
      if(!hasDraggedFiles(e.dataTransfer)) return
      dragDepth.current = Math.max(dragDepth.current - 1, 0)
      if(dragDepth.current === 0) setIsDragging(false)
    },
    onDrop: (e: React.DragEvent) => {
      if(!hasDraggedFiles(e.dataTransfer)) return
      e.preventDefault()
      dragDepth.current = 0
      setIsDragging(false)
      submit(Array.from(e.dataTransfer.files))
    },
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    submit(Array.from(e.target.files ?? []))
    e.target.value = ""
  }

  const openPicker = () => inputRef.current?.click()

  return { isDragging, dropHandlers, inputRef, onInputChange, openPicker }
}
