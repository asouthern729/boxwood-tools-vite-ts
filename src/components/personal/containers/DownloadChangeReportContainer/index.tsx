// Components
import * as Components from './components'
import { useDownloadReportManifest } from './hooks'

function DownloadChangeReportContainer() {
  const { data: reports, isLoading, isError } = useDownloadReportManifest()

  if(isLoading) return <p className="py-8 text-center text-base-content/70">Loading&hellip;</p>
  if(isError) return <p className="py-8 text-center text-error">Couldn't load reports right now.</p>

  return (
    <Components.ReportList reports={reports ?? []} />
  )
}

export default DownloadChangeReportContainer
