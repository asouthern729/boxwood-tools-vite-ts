import { motion } from "framer-motion"

type SlideInLeftProps = {
  children: React.ReactElement
  distance?: number
  stiffness?: number
  damping?: number
  delay?: number
  className?: string
}

function SlideInLeft({ children, distance = 24, stiffness = 500, damping = 30, delay = 0, className }: SlideInLeftProps) {

  return (
    <motion.div
      initial={{ opacity: 0, x: -distance }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness, damping, delay }}
      className={className}>
      {children}
    </motion.div>
  )
}

export default SlideInLeft
