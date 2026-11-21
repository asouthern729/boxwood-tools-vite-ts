import { useNavigate } from "react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { DOCUMENT_MANIFEST_QUERY_KEYS } from "@components/commercial/context/utils"
import { documentPath } from "./utils"

// Types
import type { DocumentTool, LinkedDocumentResult } from "@context/App/types"

export type CreateLinked = {
  // The tool the new document belongs to, and the tool whose preview offers the button
  tool: DocumentTool
  fromTool: DocumentTool
  label: string
  create: () => Promise<LinkedDocumentResult>
}

// Builds the missing linked document, then opens it on its own tool's page.
//
// The target manifest is refetched (inactive queries too) before navigating: that page renders from
// cache first, and a cached list without the new document would read its ?doc= as missing.
// Navigating happens in mutate's own callback, so it's skipped if the modal closed mid-build.
export const useCreateLinkedDocument = ({ tool, fromTool, create }: CreateLinked) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: async () => {
      const result = await create()
      await queryClient.invalidateQueries({ queryKey: DOCUMENT_MANIFEST_QUERY_KEYS[tool], refetchType: "all" })
      return result
    },
    // The source document now links to the new one
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DOCUMENT_MANIFEST_QUERY_KEYS[fromTool] }),
  })

  const build = () => mutate(undefined, { onSuccess: ({ id }) => navigate(documentPath(tool, id)) })

  return { build, isPending, error }
}
