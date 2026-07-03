import type { Transition, Variants } from 'framer-motion'

/** Shared easing curve for a smooth, premium feel. */
export const EASE_OUT: Transition['ease'] = [0.16, 1, 0.3, 1]

/** Fade + slide up, meant to be triggered via `whileInView`. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT },
  },
}

/** Container variant that staggers its children's `fadeUp` animations. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
}

/** Simple fade for elements that shouldn't move much (e.g. state swaps). */
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: EASE_OUT } },
}

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: EASE_OUT } },
}
