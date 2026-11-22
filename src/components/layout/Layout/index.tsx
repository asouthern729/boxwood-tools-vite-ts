import { Outlet } from "react-router"

// Components
import * as Components from './components'
import Nav from '../Nav'
import LogoutButton from '../LogoutButton'
import AssistantDrawer from '@components/assistant/AssistantDrawer'

function Layout() {

  return (
    <div className="relative flex flex-col w-full min-h-screen lg:h-full">
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <AssistantDrawer />
        <LogoutButton />
      </div>
      <Components.Header />
      <Nav />
      <main className="flex flex-col lg:flex-1">
        <div className="relative m-auto w-full px-4 lg:h-full lg:flex-1 xl:px-0 xl:w-[90%] 2xl:w-[80%]">
          <Outlet />
        </div>
      </main>
      <Components.FooterMessageSlot />
      <Components.Footer />
    </div>
  )
}

export default Layout