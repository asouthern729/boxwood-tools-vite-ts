import { useState } from 'react'
import { usePolicyCheckChat, usePolicyCheckFiles, usePolicyCheckManifest } from './hooks'

// Types
import type * as AppTypes from '@context/App/types'

// Components
import FadeIn from '@utils/animations/FadeIn'
import LoadingMsg from '@components/team/utils/LoadingMsg'
import ErrorMsg from '@components/team/utils/ErrorMsg'
import * as Components from './components'

function PolicyCheckContainer() {
  const [scope, setScope] = useState<AppTypes.PolicyCheckScope>("mine")
  const { data: manifest, isLoading, isError } = usePolicyCheckManifest(scope)
  const staged = usePolicyCheckFiles()
  const chat = usePolicyCheckChat(staged)

  return (
    <FadeIn>
      <div className="flex flex-col gap-6">
        <Components.ChatPanel
          chat={chat}
          staged={staged} />

        {isLoading && <LoadingMsg />}
        {isError && <ErrorMsg message="Couldn't load policy checks right now." />}
        {manifest && (
          <Components.CheckList
            manifest={manifest}
            scope={scope}
            onScopeChange={setScope}
            scrollSignal={chat.scrollSignal} />
        )}
      </div>
    </FadeIn>
  )
}

export default PolicyCheckContainer
