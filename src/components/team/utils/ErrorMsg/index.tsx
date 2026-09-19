type ErrorMsgProps = {
  message?: string
}

function ErrorMsg({ message = "Couldn't load reports right now." }: ErrorMsgProps) {
  return (
    <p className="py-8 text-center text-error">{message}</p>
  )
}

export default ErrorMsg