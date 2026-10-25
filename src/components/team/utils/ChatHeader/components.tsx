import claudeIcon from "@assets/claude.png"

export const Title = () => (
  <h2 className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-accent uppercase">
    <img
      src={claudeIcon}
      alt=""
      className="size-5" />
    Claude
  </h2>
)

export const ShortcutHint = () => (
  <span className="hidden items-center gap-1.5 text-[11px] text-base-content/40 sm:flex">
    <kbd className="kbd kbd-sm">/</kbd>
    to jump to Claude chat
  </span>
)
