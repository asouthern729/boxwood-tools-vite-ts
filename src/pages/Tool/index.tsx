// Components
import ToolContainer from '@components/team/containers/ToolContainer'
import * as Components from './components'

function Tool() {

  return (
    <div className="w-full">
      <Components.ToolName />
      <ToolContainer>
        <Components.ToolContent />
      </ToolContainer>
    </div>
  )
}

export default Tool