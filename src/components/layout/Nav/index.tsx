import * as Components from './components'

function Nav() {

  return (
    <nav aria-label="Primary" className="flex flex-wrap gap-2 mx-auto">
      <Components.NavButtons />
    </nav>
  )
}

export default Nav