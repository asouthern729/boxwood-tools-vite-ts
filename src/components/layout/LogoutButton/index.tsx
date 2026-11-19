import * as AuthActions from "@context/Auth/AuthActions"
import { useIsSignedIn } from "./hooks"

function LogoutButton() {
  const isSignedIn = useIsSignedIn()

  if(!isSignedIn) return null

  return (
    <button
      type="button"
      onClick={AuthActions.logout}
      className="btn btn-outline btn-sm absolute top-4 right-4 z-20">
        Logout
    </button>
  )
}

export default LogoutButton
