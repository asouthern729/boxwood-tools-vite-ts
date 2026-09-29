import { Outlet } from "react-router"
import { useSetTheme } from "@utils/hooks"

// Components
import { PersonalProvider } from "@components/personal/context/PersonalCtx"

function Personal() {
  useSetTheme("boxwood")

  return (
    <PersonalProvider>
      <Outlet />
    </PersonalProvider>
  )
}

export default Personal
