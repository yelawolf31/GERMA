import { LazyMotion, MotionConfig, domAnimation, m } from 'motion/react'
import { baseTransition, fadeUpItem, staggerContainer } from '../../lib/motion'

/**
 * Provides Motion to the whole app.
 *
 * - LazyMotion + domAnimation keeps the bundle small (no drag/layout features).
 * - reducedMotion="user" automatically disables transforms for users who have
 *   asked for reduced motion; opacity-only fades still play.
 */
export function MotionProvider({ children }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={baseTransition}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}

/** A container that fades its children in one after another on entry. */
export function StaggerGrid({ className = '', children }) {
  return (
    <m.div className={className} variants={staggerContainer} initial="initial" animate="animate">
      {children}
    </m.div>
  )
}

/** A single child of StaggerGrid. */
export function StaggerItem({ className = '', children }) {
  return (
    <m.div className={className} variants={fadeUpItem}>
      {children}
    </m.div>
  )
}

/** One-off fade + slide used for standalone blocks. */
export function Reveal({ className = '', delay = 0, children }) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...baseTransition, delay }}
    >
      {children}
    </m.div>
  )
}
