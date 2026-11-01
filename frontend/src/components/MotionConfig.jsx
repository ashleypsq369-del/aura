/**
 * MotionConfig — shared animation presets used across the whole app
 * All values tuned for healthcare: calm, purposeful, never distracting.
 * Reference: ux-ui-skills/interaction-craft doctrine
 */

// Spring presets — use for entrance, hover, selection
export const spring = {
  snappy:  { type: 'spring', stiffness: 400, damping: 28, mass: 0.6 },
  smooth:  { type: 'spring', stiffness: 260, damping: 26, mass: 0.8 },
  gentle:  { type: 'spring', stiffness: 160, damping: 22, mass: 1.0 },
  elastic: { type: 'spring', stiffness: 500, damping: 24, mass: 0.5 },
};

// Tween presets — use for opacity, colour, background
export const tween = {
  fast:   { duration: 0.14, ease: 'easeOut' },
  normal: { duration: 0.22, ease: 'easeOut' },
  slow:   { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
};

// Stagger container — wrap lists/grids
export const staggerContainer = (staggerAmt = 0.07) => ({
  hidden:  {},
  visible: { transition: { staggerChildren: staggerAmt, delayChildren: 0.05 } },
});

// Stagger item — individual child
export const staggerItem = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: spring.smooth },
};

// Card lift on hover
export const cardHover = {
  whileHover: { y: -4, boxShadow: '0 12px 36px rgba(0,0,0,0.13)' },
  whileTap:   { scale: 0.97 },
  transition:  spring.snappy,
};

// Fade in from below — standard page section entrance
export const fadeUp = {
  initial:   { opacity: 0, y: 18 },
  animate:   { opacity: 1, y: 0  },
  transition: tween.slow,
};

// Fade in — for overlays, tooltips
export const fadeIn = {
  initial:   { opacity: 0 },
  animate:   { opacity: 1 },
  transition: tween.fast,
};

// Page transition — route-level
export const pageTransition = {
  initial:   { opacity: 0, y: 10 },
  animate:   { opacity: 1, y: 0  },
  exit:      { opacity: 0, y: -6 },
  transition: tween.slow,
};

// Slide in from right — sheets, panels
export const slideInRight = {
  initial:   { x: '100%', opacity: 0 },
  animate:   { x: 0,      opacity: 1 },
  exit:      { x: '100%', opacity: 0 },
  transition: spring.smooth,
};

// Scale pop — for badges, notifications, chips
export const scalePop = {
  initial:    { scale: 0, opacity: 0 },
  animate:    { scale: 1, opacity: 1 },
  transition: spring.elastic,
};
