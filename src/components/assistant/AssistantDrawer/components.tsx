import claudeLogo from "@assets/claude.png"
import { motion } from "framer-motion"
import { ASSISTANT_NAME, ASSISTANT_TAGLINE, SUGGESTED_QUESTIONS } from "./utils"
import { LogoDisc } from "./messages"

const SLIDE_TRANSITION = { type: "spring", stiffness: 400, damping: 40 } as const

// The launcher, beside Logout in the top-right corner: the Boxwood mark in a white disc plus the
// assistant's name. Collapses to just the mark on small screens.
export const LauncherButton = ({ onClick }: { onClick: () => void }) => (
  <motion.button
    type="button"
    onClick={onClick}
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    whileHover={{ y: -1 }}
    aria-label={`Open ${ ASSISTANT_NAME }`}
    className="flex cursor-pointer items-center gap-2 rounded-md border border-primary/50 bg-base-100 p-1 shadow-md shadow-primary/20 transition-colors hover:border-primary sm:pr-4">
      <LogoDisc size="size-8" />
      <span className="hidden translate-y-px font-display text-xl leading-none tracking-wide text-primary uppercase sm:inline">
        {ASSISTANT_NAME}
      </span>
  </motion.button>
)

// The drawer itself. A stub until the chat endpoint lands: header, a welcome message with starter
// questions, and a disabled input.
export const Panel = ({ onClose }: { onClose: () => void }) => (
  <motion.aside
    role="dialog"
    aria-label={ASSISTANT_NAME}
    initial={{ x: "100%" }}
    animate={{ x: 0 }}
    exit={{ x: "100%" }}
    transition={SLIDE_TRANSITION}
    className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-base-300 bg-base-100 shadow-2xl sm:w-[26rem]">
      <PanelHeader onClose={onClose} />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <WelcomeMessage />
      </div>
      <PanelFooter />
  </motion.aside>
)

const PanelHeader = ({ onClose }: { onClose: () => void }) => (
  <header className="flex items-center gap-3 border-b-2 border-primary px-4 py-3">
    <LogoDisc size="size-12" />
    <div className="flex flex-1 flex-col items-end text-end">
      <h2 className="text-2xl leading-tight font-bold text-shadow-md">{ASSISTANT_NAME}</h2>
      <span className="text-sm leading-tight font-semibold text-secondary">
        {ASSISTANT_TAGLINE.map((line) => <span key={line} className="block">{line}</span>)}
      </span>
    </div>
    <button
      type="button"
      onClick={onClose}
      aria-label={`Close ${ ASSISTANT_NAME }`}
      className="btn btn-ghost btn-sm btn-circle text-xl">
        ×
    </button>
  </header>
)

const WelcomeMessage = () => (
  <div className="flex items-start gap-2">
    <LogoDisc size="size-8" />
    <div className="flex flex-col gap-3 rounded-box rounded-tl-none bg-base-200 p-3 text-sm">
      <p>Hi! I can point you to the right Boxwood tool for a job, explain how a page works, or answer general insurance and Boxwood standards questions.</p>
      <div className="flex flex-col gap-2">
        {SUGGESTED_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            disabled
            className="btn btn-sm h-auto justify-start border-primary/40 bg-base-100 py-2 text-left font-normal normal-case">
              {question}
          </button>
        ))}
      </div>
    </div>
  </div>
)

const PanelFooter = () => (
  <footer className="flex flex-col gap-2 border-t border-base-300 p-3">
    <div className="flex gap-2">
      <input
        type="text"
        disabled
        placeholder="Chat is coming soon…"
        className="input input-sm flex-1" />
      <button type="button" disabled className="btn btn-primary btn-sm">Send</button>
    </div>
    <PoweredByClaude />
  </footer>
)

// Claude's mark and name in its brand orange (#d97757), with the usual AI disclaimer
const PoweredByClaude = () => (
  <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-base-content/50">
    <img src={claudeLogo} alt="" className="size-3.5" />
    <span><b className="font-semibold tracking-wide text-[#d97757]">CLAUDE</b> is AI and can make mistakes.</span>
  </p>
)
