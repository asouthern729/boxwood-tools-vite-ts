export type ChatAttachment = {
  key: string
  filename: string
  status: "uploading" | "processing" | "done" | "error"
  error?: string
}
