import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router"

// Actions
import { completeLogin, consumeReturnTo } from "@context/Auth/AuthActions"

function Login() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
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
