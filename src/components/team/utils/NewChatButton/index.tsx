type NewChatButtonProps = {
  disabled: boolean
  onClick: () => void
}

function NewChatButton({ disabled, onClick }: NewChatButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title="Clear this conversation and start fresh with Claude"
      className="btn btn-outline w-full">
        New chat
    </button>
  )
}

export default NewChatButton
