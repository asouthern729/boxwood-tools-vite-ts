import { toast } from "sonner"

// "<label> <subject>" toast with the label dimmed, e.g. "Showing Policy Check". Toasts sharing an id
// replace each other instead of queueing.
export const toastLabeled = (label: string, subject: string, id?: string) =>
  toast(<><span className="opacity-70">{label}</span> {subject}</>, { id })

export const toastDeleted = (name: string) => toastLabeled("Deleted", name, "deleted")
