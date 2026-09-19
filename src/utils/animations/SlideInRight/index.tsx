import { motion } from "framer-motion"

type SlideInRightProps = {
  children: React.ReactElement
  distance?: number
  stiffness?: number
  damping?: number
  delay?: number
  className?: string
}

function SlideInRight({ children, distance = 24, stiffness = 500, damping = 30, delay = 0, className }: SlideInRightProps) {

  return (
    <motion.div
      initial={{ opacity: 0, x: distance }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness, damping, delay }}
      className={className}>
      {children}
    </motion.div>
  )
}

export default SlideInRight
