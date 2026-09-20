import { Outlet } from "react-router"
import { useSetTheme } from "@utils/hooks"

function Personal() {
  useSetTheme("boxwood")

  return (
    <Outlet />
  )
}

export default Personal