import { useCompleteLogin } from "./hooks"

function Login() {
  useCompleteLogin()

  return (
    <div className="my-12 text-center text-base-content/70">Signing in&hellip;</div>
  )
}

export default Login
