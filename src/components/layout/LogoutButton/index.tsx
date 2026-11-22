import * as AuthActions from "@context/Auth/AuthActions"
import { useIsSignedIn } from "./hooks"

// Styled to match the Boxwood Assistant launcher beside it (same pill, border, shadow and type)
function LogoutButton() {
  const isSignedIn = useIsSignedIn()

  if(!isSignedIn) return null

  return (
    <button
      type="button"
      onClick={AuthActions.logout}
      className="flex h-[42px] cursor-pointer items-center rounded-md border border-primary/50 bg-base-100 px-4 shadow-md shadow-primary/20 transition hover:-translate-y-px hover:border-primary">
        <span className="translate-y-px font-display text-xl leading-none tracking-wide text-primary uppercase">Logout</span>
    </button>
  )
}

export default LogoutButton
