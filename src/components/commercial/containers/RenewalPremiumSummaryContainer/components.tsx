import { useEffect, useRef, useState } from "react"
import claudeIcon from "@assets/claude.png"
import { useDownloadRenewalPremiumSummaryFile } from "./hooks"

// Types
import type * as AppTypes from "@context/App/types"

export const ChatPanel = ({
  messages,
  onSend,
  isPending
}: {
  messages: AppTypes.RenewalPremiumSummaryChatMessage[]
  onSend: (message: string) => void
  isPending: boolean
}) => {
  const [draft, setDraft] = useState("")
  const messagesRef = useRef<HTMLDivElement>(null)

  // Keeps pace with new messages/the pending "thinking" bubble without the person having to scroll
  // by hand, matching site/roadmap.html's chat panel.
  useEffect(() => {
    const el = messagesRef.current
    if(el) el.scrollTop = el.scrollHeight
  }, [messages, isPending])

  const send = () => {
    onSend(draft)
    setDraft("")
  }

  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body gap-3">
        <h2 className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-accent uppercase">
          <img src={claudeIcon} alt="" className="size-5" />
          Claude
        </h2>

        <div
          ref={messagesRef}
          className="flex max-h-72 flex-col gap-1 overflow-y-auto"
          style={{ scrollbarWidth: "thin" }}>
          {messages.length === 0 && (
            <p className="text-sm text-base-content/60">
              Ask Claude to run the renewal premium tool for a customer — e.g. "Build the renewal
              premium overview for Acme Corp." — or search for customers with upcoming renewals.
            </p>
          )}

          {messages.map((message, i) => (
            <div key={i} className={`chat ${ message.role === "user" ? "chat-end" : "chat-start" }`}>
              {message.role === "assistant" && (
                <div className="chat-header text-xs font-semibold text-accent">Claude</div>
              )}
              <div
                className={`chat-bubble whitespace-pre-wrap text-sm ${ message.role === "user" ?
                  "bg-base-300 text-base-content" :
                  "bg-accent/20 text-base-content" }`}>
                {message.text}
              </div>
            </div>
          ))}

          {isPending && (
            <div className="chat chat-start">
              <div className="chat-header text-xs font-semibold text-accent">Claude</div>
              <div className="chat-bubble bg-accent/20">
                <span className="loading loading-dots loading-sm" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
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
            placeholder="Ask Claude to build a renewal premium overview…"
            className="textarea textarea-bordered flex-1" />
          <button
            type="button"
            disabled={isPending || !draft.trim()}
            onClick={send}
            className="btn btn-neutral self-end text-accent hover:bg-accent hover:text-accent-content">
            {isPending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  )
}

export const CsrGroupList = ({
  groups,
  scrollSignal
}: {
  groups: AppTypes.RenewalPremiumSummaryCsrGroup[]
  scrollSignal: number
}) => {
  // Keyed by filename rather than lifted into state — this is a DOM-node registry for imperative
  // scrollIntoView, not something that should ever trigger its own re-render.
  const rowRefs = useRef(new Map<string, HTMLLIElement>())
  const lastHandledSignal = useRef(0)
  const [highlightedFilename, setHighlightedFilename] = useState<string | null>(null)
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if(scrollSignal === 0 || scrollSignal === lastHandledSignal.current) return
    lastHandledSignal.current = scrollSignal

    const allSummaries = groups.flatMap((group) => group.summaries)
    if(allSummaries.length === 0) return

    // The row Claude just (re)built is always the one with the newest generated_at — regenerating
    // an account overwrites its own prior entry rather than adding a new one, so this is "which row
    // changed," not just "which row is newest overall."
    const newest = allSummaries.reduce((a, b) => (a.generated_at > b.generated_at ? a : b))
    rowRefs.current.get(newest.filename)?.scrollIntoView({ behavior: "smooth", block: "center" })

    clearTimeout(highlightTimeoutRef.current)
    setHighlightedFilename(newest.filename)
    highlightTimeoutRef.current = setTimeout(() => setHighlightedFilename(null), 2000)
  }, [groups, scrollSignal])

  useEffect(() => () => clearTimeout(highlightTimeoutRef.current), [])

  if(groups.length === 0) {
    return <p className="py-8 text-center text-base-content/70">No renewal premium summaries generated yet.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <CsrSection
          key={group.csr_code ?? "__unassigned__"}
          group={group}
          rowRefs={rowRefs.current}
          highlightedFilename={highlightedFilename} />
      ))}
    </div>
  )
}

const CsrSection = ({
  group,
  rowRefs,
  highlightedFilename
}: {
  group: AppTypes.RenewalPremiumSummaryCsrGroup
  rowRefs: Map<string, HTMLLIElement>
  highlightedFilename: string | null
}) => (
  <div className="card border border-base-300 bg-base-100 shadow-sm">
    <div className="card-body gap-1 p-0 py-2">
      <h3 className="px-4 pt-1 text-sm font-semibold text-primary">
        {group.csr_name ?? "Unassigned"}
      </h3>
      <ul className="divide-y divide-base-300">
        {group.summaries.map((summary) => (
          <SummaryRow
            key={summary.filename}
            summary={summary}
            rowRefs={rowRefs}
            highlighted={summary.filename === highlightedFilename} />
        ))}
      </ul>
    </div>
  </div>
)

const SummaryRow = ({
  summary,
  rowRefs,
  highlighted
}: {
  summary: AppTypes.RenewalPremiumSummaryManifestEntry
  rowRefs: Map<string, HTMLLIElement>
  highlighted: boolean
}) => {
  const { mutate: downloadFile, isPending } = useDownloadRenewalPremiumSummaryFile()

  return (
    <li
      ref={(el) => {
        if(el) rowRefs.set(summary.filename, el)
        else rowRefs.delete(summary.filename)
      }}
      className={`flex items-center gap-3 px-4 py-3 transition-colors duration-1000 ${ highlighted ? "bg-base-200" : "" }`}>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold">{summary.client_name}</span>
        <span className="text-sm text-base-content/60 italic">Renews {summary.renewal_date_label}</span>
        <span className="text-sm text-base-content/60">{summary.polnos}</span>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => downloadFile(summary.filename)}
        className="btn btn-neutral btn-sm hover:bg-secondary">
        {isPending ? "Downloading…" : "Download"}
      </button>
    </li>
  )
}
