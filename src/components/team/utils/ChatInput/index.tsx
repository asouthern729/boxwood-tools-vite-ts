type ChatInputProps = {
  draft: string
  setDraft: (value: string) => void
  isPending: boolean
  send: () => void
  placeholder: string
}

function ChatInput({ draft, setDraft, isPending, send, placeholder }: ChatInputProps) {
  return (
    <textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if(e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          send()
        }
      }}
      rows={2}
      disabled={isPending}
      placeholder={placeholder}
      className="textarea textarea-bordered w-full flex-1" />
  )
}

export default ChatInput
