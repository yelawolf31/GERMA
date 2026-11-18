import { AnimatePresence, m } from 'motion/react'
import { useLocation } from 'react-router-dom'
import { pageVariants } from '../../lib/motion'

/**
 * Subtle fade + slide between routes.
 *
 * `mode="wait"` lets the outgoing page finish before the next one enters, and
 * `initial={false}` avoids animating on first load. The wrapper is h-full so
 * full-height pages (the map) keep their existing layout.
 */
export default function PageTransition({ children }) {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={location.pathname}
        className="h-full"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </m.div>
    </AnimatePresence>
  )
}
