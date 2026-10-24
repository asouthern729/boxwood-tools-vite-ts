import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getDownloadStats } from "@context/App/AppActions"

const DOWNLOAD_STATS_QUERY_KEY = ["download-stats"]

export const useDownloadStats = () => useQuery({
  queryKey: DOWNLOAD_STATS_QUERY_KEY,
  queryFn: getDownloadStats,
  retry: false,
})

// A download mutation that refreshes the odometer once the file has been fetched
export const useCountedDownload = <TVariables>(mutationFn: (variables: TVariables) => Promise<void>) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DOWNLOAD_STATS_QUERY_KEY }),
  })
}
