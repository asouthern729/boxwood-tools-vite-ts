// Components
import FadeIn from '@utils/animations/FadeIn'
import LoadingMsg from '@components/team/utils/LoadingMsg'
import ErrorMsg from '@components/team/utils/ErrorMsg'
import * as Components from './components'
import { useDownloadReportManifest } from './hooks'

function DownloadChangeReportContainer() {
  const { data: reports, isLoading, isError } = useDownloadReportManifest()

  if(isLoading) return <LoadingMsg />
  if(isError) return <ErrorMsg />

  return (
    <FadeIn>
      <>
        <Components.LastSyncBanner lastSync={reports?.lastSync ?? null} />
        <Components.ReportList reports={reports?.reports ?? []} />
      </>
    </FadeIn>
  )
}

export default DownloadChangeReportContainer
