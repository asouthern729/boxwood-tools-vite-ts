import { motion } from "framer-motion"

type FadeOutProps = {
  children: React.ReactElement
  duration?: number
  delay?: number
  className?: string
}

function FadeOut({ children, duration = 0.3, delay = 0, className }: FadeOutProps) {

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration, delay }}
      className={className}>
        {children}
    </motion.div>
  )
}

export default FadeOut
