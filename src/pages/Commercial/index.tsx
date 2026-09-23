import { Outlet } from "react-router"
import { useSetTheme } from "@utils/hooks"

// Components
import { CommercialProvider } from "@components/commercial/context/CommercialCtx"

function Commercial() {
  useSetTheme("boxwood-dark")

  return (
    <CommercialProvider>
      <Outlet />
    </CommercialProvider>
  )
}

export default Commercial