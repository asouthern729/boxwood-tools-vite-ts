import { Outlet } from "react-router"
import { useSetTheme } from "@utils/hooks"

function Commercial() {
  useSetTheme("boxwood-dark")

  return (
    <Outlet />
  )
}

export default Commercial