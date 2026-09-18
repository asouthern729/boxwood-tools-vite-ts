import { Outlet } from "react-router"

// Components
import * as Components from './components'
import Nav from '../Nav'

function Layout() {

  return (
    <div className="flex flex-col w-full min-h-screen lg:h-full">
      <Components.Header />
      <Nav />
      <main className="flex flex-col lg:flex-1">
        <div className="relative m-auto w-full px-4 lg:h-full lg:flex-1 xl:px-0 xl:w-[90%] 2xl:w-[80%]">
          <Outlet />
        </div>
      </main>
      <Components.Footer />
    </div>
  )
}

export default Layout