type SendButtonProps = {
  draft: string
  isPending: boolean
  onClick: () => void
}

function SendButton({ draft, isPending, onClick }: SendButtonProps) {
  const btnContent = isPending ? "Sending…" : "Send"

  return (
    <button
      type="button"
      disabled={isPending || !draft.trim()}
      onClick={onClick}
      className="btn btn-neutral w-full self-end text-accent hover:bg-accent hover:text-accent-content sm:w-auto">
        {btnContent}
    </button>
  )
}

export default SendButton
