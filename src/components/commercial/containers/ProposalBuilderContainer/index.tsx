import { useState } from 'react'
import { useProposalBuilderChat, useProposalManifest } from './hooks'

// Types
import type * as AppTypes from '@context/App/types'

// Components
import FadeIn from '@utils/animations/FadeIn'
import LoadingMsg from '@components/team/utils/LoadingMsg'
import ErrorMsg from '@components/team/utils/ErrorMsg'
import * as Components from './components'

function ProposalBuilderContainer() {
  const [scope, setScope] = useState<AppTypes.ProposalScope>("mine")
  const { data: manifest, isLoading, isError } = useProposalManifest(scope)
  const { messages, sendMessage, announce, isPending, scrollSignal } = useProposalBuilderChat()

  return (
    <FadeIn>
      <div className="flex flex-col gap-6">
        <Components.ChatPanel
          messages={messages}
          onSend={sendMessage}
          onAnnounce={announce}
          isPending={isPending} />

        {isLoading && <LoadingMsg />}
        {isError && <ErrorMsg message="Couldn't load proposals right now." />}
        {manifest && (
          <Components.ProposalList
            manifest={manifest}
            scope={scope}
            onScopeChange={setScope}
            scrollSignal={scrollSignal} />
        )}
      </div>
    </FadeIn>
  )
}

export default ProposalBuilderContainer
