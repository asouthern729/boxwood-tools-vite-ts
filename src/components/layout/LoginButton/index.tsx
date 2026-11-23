import { useLocation } from "react-router"
import * as AuthActions from "@context/Auth/AuthActions"
import { useIsSignedIn } from "@components/layout/LogoutButton/hooks"

// The signed-out counterpart to LogoutButton, in the same spot and style. Hidden on /login, which
// is mid-sign-in.
function LoginButton() {
  const isSignedIn = useIsSignedIn()
  const { pathname } = useLocation()

  if(isSignedIn || pathname === "/login") return null

  return (
    <button
      type="button"
      onClick={AuthActions.login}
      className="flex h-[42px] cursor-pointer items-center rounded-md border border-primary/50 bg-base-100 px-4 shadow-md shadow-primary/20 transition hover:-translate-y-px hover:border-primary">
        <span className="translate-y-px font-display text-xl leading-none tracking-wide text-primary uppercase">Login</span>
    </button>
  )
}

export default LoginButton
