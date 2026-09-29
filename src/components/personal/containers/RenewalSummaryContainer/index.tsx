import { usePersonalRenewalSummaryChat, usePersonalRenewalSummaryManifest } from './hooks'

// Components
import FadeIn from '@utils/animations/FadeIn'
import LoadingMsg from '@components/team/utils/LoadingMsg'
import ErrorMsg from '@components/team/utils/ErrorMsg'
import * as Components from './components'

function RenewalSummaryContainer() {
  const { data: manifest, isLoading, isError } = usePersonalRenewalSummaryManifest()
  const { messages, sendMessage, isPending, scrollSignal } = usePersonalRenewalSummaryChat()

  const isReady = !isLoading && !isError

  return (
    <FadeIn>
      <div className="flex flex-col gap-6">
        <Components.ChatPanel
          messages={messages}
          onSend={sendMessage}
          isPending={isPending} />

        {isLoading && <LoadingMsg />}
        {isError && <ErrorMsg message="Couldn't load renewal summaries right now." />}
        {isReady && (
          <Components.CsrGroupList
            groups={manifest?.groups ?? []}
            scrollSignal={scrollSignal} />
        )}
      </div>
    </FadeIn>
  )
}

export default RenewalSummaryContainer
