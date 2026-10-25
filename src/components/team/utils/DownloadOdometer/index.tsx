import { MotionConfig } from "framer-motion"
import { useDownloadStats } from "./hooks"
import { toDigits, isDimmed, WHEEL_TRANSITION } from "./utils"

// Types
import type * as AppTypes from "@context/App/types"

// Components
import * as Components from "./components"

function DownloadOdometer({ tool }: { tool: AppTypes.DownloadTool }) {
  const { data: counts, isSuccess } = useDownloadStats()

  if(!isSuccess) return null

  const count = counts[tool] ?? 0
  const digits = toDigits(count)

  return (
    <MotionConfig
      reducedMotion="user"
      transition={WHEEL_TRANSITION}>
      <div title={`${ count.toLocaleString() } all-time downloads`} className="mt-2 flex items-center justify-end">
        <div className="flex overflow-hidden rounded-sm border border-neutral/20 bg-neutral-content font-mono text-sm text-neutral shadow-inner dark:border-neutral dark:bg-neutral dark:text-neutral-content">
          {digits.map((digit, i) => (
            <Components.DigitWheel
              key={digits.length - i}
              digit={digit}
              dimmed={isDimmed(digits, i)} />
          ))}
        </div>
      </div>
    </MotionConfig>
  )
}

export default DownloadOdometer
