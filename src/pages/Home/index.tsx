// Components
import { Header } from "@components/layout/Layout/components"
import * as Components from './components'

function Home() {

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <Header />
      <div className="flex flex-wrap justify-center gap-4">
        <Components.HomeBtns />
      </div>
    </div>
  )
}

export default Home