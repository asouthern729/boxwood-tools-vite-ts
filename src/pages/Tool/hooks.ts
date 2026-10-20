import { useLocation } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { toolNames, toolJobs } from "./utils"

// Actions
import { getJobStatuses } from "@context/App/AppActions"

export const useHandleToolName = () => {
  const { pathname } = useLocation()

  const toolName = toolNames[pathname.split('/')[2]]

  return toolName
}

export const useToolJobStatuses = () => {
  const { pathname } = useLocation()
  const names = toolJobs[pathname] ?? []

  return useQuery({
    queryKey: ["job-statuses", names],
    queryFn: () => getJobStatuses(names),
    enabled: names.length > 0,
  })
}
