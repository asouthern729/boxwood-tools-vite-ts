import { motion } from "framer-motion"

export const DigitWheel = ({ digit, dimmed }: { digit: number, dimmed: boolean }) => (
  <div className="relative h-6 w-4 overflow-hidden border-l border-neutral/15 first:border-l-0 dark:border-neutral-content/15">
    <motion.div
      initial={{ y: "0%" }}
      animate={{ y: `${ -digit * 10 }%` }}
      className={`flex flex-col ${ dimmed ? "text-neutral/40 dark:text-neutral-content/40" : "" }`}>
      {Array.from({ length: 10 }, (_, n) => (
        <span key={n} className="flex h-6 items-center justify-center">{n}</span>
      ))}
    </motion.div>
    <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-black/10 dark:from-black/30 dark:to-black/30" />
  </div>
)
