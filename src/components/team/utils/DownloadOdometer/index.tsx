import { MotionConfig, motion } from "framer-motion"
import { useDownloadStats } from "./hooks"
import { toDigits } from "./utils"

// Types
import type * as AppTypes from "@context/App/types"

const WHEEL_TRANSITION = { type: "spring", stiffness: 120, damping: 20 } as const

function DownloadOdometer({ tool }: { tool: AppTypes.DownloadTool }) {
  const { data: counts, isSuccess } = useDownloadStats()

  if(!isSuccess) return null

  const count = counts[tool] ?? 0
  const digits = toDigits(count)
  const firstSignificant = digits.findIndex((digit) => digit !== 0)

  return (
    <MotionConfig reducedMotion="user" transition={WHEEL_TRANSITION}>
      <div title={`${ count.toLocaleString() } all-time downloads`} className="mt-2 flex items-center justify-end gap-2">
        <span className="text-xs uppercase tracking-wide text-base-content/60">Downloads</span>
        <div className="flex overflow-hidden rounded-sm border border-neutral bg-neutral font-mono text-sm text-neutral-content shadow-inner">
          {digits.map((digit, i) => (
            <DigitWheel
              key={digits.length - i}
              digit={digit}
              dimmed={firstSignificant === -1 ? i < digits.length - 1 : i < firstSignificant} />
          ))}
        </div>
      </div>
    </MotionConfig>
  )
}

const DigitWheel = ({ digit, dimmed }: { digit: number, dimmed: boolean }) => (
  <div className="relative h-6 w-4 overflow-hidden border-l border-neutral-content/15 first:border-l-0">
    <motion.div
      initial={{ y: "0%" }}
      animate={{ y: `${ -digit * 10 }%` }}
      className={`flex flex-col ${ dimmed ? "text-neutral-content/40" : "" }`}>
      {Array.from({ length: 10 }, (_, n) => (
        <span key={n} className="flex h-6 items-center justify-center">{n}</span>
      ))}
    </motion.div>
    <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/30" />
  </div>
)

export default DownloadOdometer
