import { useState } from 'react'
import { useCoverageGapChat, useGapFiles, useCoverageGapManifest } from './hooks'

// Types
import type * as AppTypes from '@context/App/types'

// Components
import FadeIn from '@utils/animations/FadeIn'
import LoadingMsg from '@components/team/utils/LoadingMsg'
import ErrorMsg from '@components/team/utils/ErrorMsg'
import * as Components from './components'

function CoverageGapContainer() {
  const [scope, setScope] = useState<AppTypes.CoverageGapScope>("mine")
  const { data: manifest, isLoading, isError } = useCoverageGapManifest(scope)
  const staged = useGapFiles()
  const chat = useCoverageGapChat(staged)

  return (
    <FadeIn>
      <div className="flex flex-col gap-6">
        <Components.ChatPanel
          chat={chat}
          staged={staged} />

        {isLoading && <LoadingMsg />}
        {isError && <ErrorMsg message="Couldn't load gap analyses right now." />}
        {manifest && (
          <Components.AnalysisList
            manifest={manifest}
            scope={scope}
            onScopeChange={setScope}
            scrollSignal={chat.scrollSignal} />
        )}
      </div>
    </FadeIn>
  )
}

export default CoverageGapContainer
