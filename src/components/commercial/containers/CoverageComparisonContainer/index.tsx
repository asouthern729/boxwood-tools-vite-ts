import { useState } from 'react'
import { useCoverageComparisonChat, useComparisonFiles, useCoverageComparisonManifest } from './hooks'

// Types
import type * as AppTypes from '@context/App/types'

// Components
import FadeIn from '@utils/animations/FadeIn'
import LoadingMsg from '@components/team/utils/LoadingMsg'
import ErrorMsg from '@components/team/utils/ErrorMsg'
import * as Components from './components'

function CoverageComparisonContainer() {
  const [scope, setScope] = useState<AppTypes.CoverageComparisonScope>("mine")
  const { data: manifest, isLoading, isError } = useCoverageComparisonManifest(scope)
  const staged = useComparisonFiles()
  const chat = useCoverageComparisonChat(staged)

  return (
    <FadeIn>
      <div className="flex flex-col gap-6">
        <Components.ChatPanel
          chat={chat}
          staged={staged} />

        {isLoading && <LoadingMsg />}
        {isError && <ErrorMsg message="Couldn't load coverage comparisons right now." />}
        {manifest && (
          <Components.ComparisonList
            manifest={manifest}
            scope={scope}
            onScopeChange={setScope}
            scrollSignal={chat.scrollSignal} />
        )}
      </div>
    </FadeIn>
  )
}

export default CoverageComparisonContainer
