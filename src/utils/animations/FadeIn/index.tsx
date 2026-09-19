import { motion } from "framer-motion"

type FadeInProps = {
  children: React.ReactElement
  duration?: number
  delay?: number
  className?: string
}

function FadeIn({ children, duration = 0.3, delay = 0, className }: FadeInProps) {

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay }}
      className={className}>
        {children}
    </motion.div>
  )
}

export default FadeIn