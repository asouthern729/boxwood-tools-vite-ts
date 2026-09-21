import { useEffect, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router"

// Actions
import { completeLogin, consumeReturnTo } from "@context/Auth/AuthActions"

function Login() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const hasRun = useRef(false)

  useEffect(() => {
    // Auth0 codes are single-use — StrictMode's double-invoke would otherwise burn the code on
    // a second exchange that fails, wiping out the return-to path the first exchange just used
    if(hasRun.current) return
    hasRun.current = true

    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if(!code || !state) {
      navigate(consumeReturnTo(), { replace: true })
      return
    }

    completeLogin(code, state).then(() => {
      navigate(consumeReturnTo(), { replace: true })
    })
  }, [searchParams, navigate])

  return (
    <div className="my-12 text-center text-base-content/70">Signing in&hellip;</div>
  )
}

export default Login
