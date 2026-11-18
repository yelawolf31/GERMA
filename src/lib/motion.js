// Shared animation primitives.
// Keep motion subtle and GPU-friendly: opacity + small transforms only.
// Timing is deliberately short so navigation and mobile interactions stay snappy.

// Matches the app's easing feel (fast start, soft landing).
export const EASE_OUT = [0.22, 1, 0.36, 1]

export const baseTransition = { duration: 0.24, ease: EASE_OUT }
export const quickTransition = { duration: 0.18, ease: EASE_OUT }

export const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: baseTransition },
  exit: { opacity: 0, y: -6, transition: quickTransition },
}

export const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.045, delayChildren: 0.02 } },
}

export const fadeUpItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: baseTransition },
}

export const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.16 } },
}

export const sheetPanelVariants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 },
  },
  exit: { opacity: 0, y: 16, transition: quickTransition },
}

export const modalPanelVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 },
  },
  exit: { opacity: 0, y: 12, scale: 0.98, transition: quickTransition },
}

export const dropdownVariants = {
  initial: { opacity: 0, y: -4, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: quickTransition },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } },
}

export const toastVariants = {
  initial: { opacity: 0, y: -12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: baseTransition },
  exit: { opacity: 0, y: -8, scale: 0.98, transition: quickTransition },
}
