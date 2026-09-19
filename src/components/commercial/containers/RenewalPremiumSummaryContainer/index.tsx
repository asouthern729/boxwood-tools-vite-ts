// Components
import FadeIn from '@utils/animations/FadeIn'
import LoadingMsg from '@components/team/utils/LoadingMsg'
import ErrorMsg from '@components/team/utils/ErrorMsg'
import * as Components from './components'
import { useRenewalPremiumSummaryChat, useRenewalPremiumSummaryManifest } from './hooks'

function RenewalPremiumSummaryContainer() {
  const { data: manifest, isLoading, isError } = useRenewalPremiumSummaryManifest()
  const { messages, sendMessage, isPending, scrollSignal } = useRenewalPremiumSummaryChat()

  return (
    <FadeIn>
      <div className="flex flex-col gap-6">
        <Components.ChatPanel messages={messages} onSend={sendMessage} isPending={isPending} />

        {isLoading && <LoadingMsg />}
        {isError && <ErrorMsg message="Couldn't load renewal premium summaries right now." />}
        {!isLoading && !isError && <Components.CsrGroupList groups={manifest?.groups ?? []} scrollSignal={scrollSignal} />}
      </div>
    </FadeIn>
  )
}

export default RenewalPremiumSummaryContainer
