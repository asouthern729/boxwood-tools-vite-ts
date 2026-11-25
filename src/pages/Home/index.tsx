// Components
import FadeIn from "../../utils/animations/FadeIn"
import { Header } from "@components/layout/Layout/components"
import LogoutButton from "@components/layout/LogoutButton"
import LoginButton from "@components/layout/LoginButton"
import * as Components from './components'
import { useSilentLogin } from "./hooks"

function Home() {
  const isSilentLoginAttempting = useSilentLogin()

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <LogoutButton />
        {!isSilentLoginAttempting && <LoginButton />}
      </div>
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