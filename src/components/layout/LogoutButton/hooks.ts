import { useLocation } from "react-router"
import * as AuthActions from "@context/Auth/AuthActions"

// Re-checks on every navigation, so the button appears once Login stores the token and redirects
export const useIsSignedIn = () => {
  useLocation()
  return AuthActions.hasStoredToken()
}
