// Components
import FadeIn from "../../utils/animations/FadeIn"
import { Header } from "@components/layout/Layout/components"
import LogoutButton from "@components/layout/LogoutButton"
import * as Components from './components'

function Home() {

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <LogoutButton />
      <FadeIn duration={2}>
        <Header />
      </FadeIn>
      <div className="flex flex-wrap justify-center gap-4">
        <Components.HomeBtns />
      </div>
    </div>
  )
}

export default Home