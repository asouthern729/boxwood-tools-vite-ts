import { useEffect, useState } from "react"

// Actions
import * as AuthActions from "@context/Auth/AuthActions"

// Signs the user in from their Auth0 session if they have one, so they don't have to press Login.
// Returns true while that redirect is under way, so the Login button can stay hidden until it's
// clear the user actually needs it.
export const useSilentLogin = () => {
  const [isAttempting] = useState(AuthActions.canTrySilentLogin)

  useEffect(() => {
    if(isAttempting) AuthActions.silentLogin()
  }, [isAttempting])

  return isAttempting
}
