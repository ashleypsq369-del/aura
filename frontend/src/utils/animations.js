/**
 * Healthcare Animation Library
 * Professional, accessible, and calming animations for healthcare applications
 * Following WCAG guidelines and healthcare UX best practices
 */

// ============================================================================
// FRAMER MOTION VARIANTS - Healthcare Optimized
// ============================================================================

/**
 * Page Transitions - Smooth and Subtle
 * Healthcare principle: Avoid jarring movements that could distress users
 */
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] // Custom easing for smooth feel
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 1, 1]
    }
  }
};

/**
 * Fade In Animations - For content appearing
 */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

/**
 * Slide Up - For modals and cards
 */
export const slideUp = {
  initial: { opacity: 0, y: 50, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: { 
    opacity: 0, 
    y: 30,
    scale: 0.95,
    transition: { duration: 0.25 }
  }
};

/**
 * Scale In - For alerts and notifications
 */
export const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.34, 1.56, 0.64, 1] // Slight bounce for attention
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    transition: { duration: 0.2 }
  }
};

/**
 * Slide In from Side - For sidebars and drawers
 */
export const slideInFromLeft = {
  initial: { x: -300, opacity: 0 },
  animate: { 
    x: 0, 
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: { 
    x: -300, 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

export const slideInFromRight = {
  initial: { x: 300, opacity: 0 },
  animate: { 
    x: 0, 
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: { 
    x: 300, 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

/**
 * Stagger Children - For lists and grids
 * Creates a cascading effect
 */
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1, // 100ms delay between each child
      delayChildren: 0.2
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  }
};

/**
 * Card Hover - Subtle lift effect
 */
export const cardHover = {
  rest: { 
    scale: 1,
    y: 0,
    transition: { duration: 0.2 }
  },
  hover: { 
    scale: 1.02,
    y: -4,
    transition: { duration: 0.2 }
  }
};

/**
 * Pulse - For drawing attention (use sparingly)
 */
export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

/**
 * Heartbeat - For health indicators
 */
export const heartbeat = {
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut',
      times: [0, 0.3, 1]
    }
  }
};

/**
 * Loading Spinner - Smooth rotation
 */
export const spin = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

/**
 * Gentle Shake - For errors (subtle, not alarming)
 */
export const gentleShake = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
      ease: 'easeInOut'
    }
  }
};

/**
 * Success Checkmark Animation
 */
export const successCheck = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { 
    pathLength: 1, 
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeInOut'
    }
  }
};

// ============================================================================
// REACT SPRING ANIMATIONS - Physics-Based
// ============================================================================

/**
 * Spring Configuration Presets
 * More natural feeling animations
 */
export const springConfigs = {
  // Gentle spring for most UI elements
  gentle: {
    tension: 120,
    friction: 14
  },
  
  // Slow spring for large elements
  slow: {
    tension: 80,
    friction: 20
  },
  
  // Wobbly spring for playful elements (use sparingly)
  wobbly: {
    tension: 180,
    friction: 12
  },
  
  // Stiff spring for quick responses
  stiff: {
    tension: 210,
    friction: 20
  },
  
  // Molasses for very slow, smooth movements
  molasses: {
    tension: 50,
    friction: 25
  }
};

// ============================================================================
// AOS (Animate On Scroll) CONFIGURATIONS
// ============================================================================

/**
 * Initialize AOS with healthcare-appropriate settings
 */
export const initAOS = () => {
  if (typeof window !== 'undefined') {
    import('aos').then((AOS) => {
      AOS.init({
        duration: 800, // Animation duration
        easing: 'ease-out-cubic', // Smooth easing
        once: true, // Animate only once
        mirror: false, // Don't animate on scroll up
        offset: 100, // Offset from viewport
        delay: 0, // No delay
        anchorPlacement: 'top-bottom',
        disable: false // Can be 'mobile', 'phone', 'tablet', or function
      });
    });
  }
};

/**
 * AOS Animation Classes
 * Use these as data-aos attributes
 */
export const aosAnimations = {
  // Fade animations
  fade: 'fade',
  fadeUp: 'fade-up',
  fadeDown: 'fade-down',
  fadeLeft: 'fade-left',
  fadeRight: 'fade-right',
  fadeUpRight: 'fade-up-right',
  fadeUpLeft: 'fade-up-left',
  fadeDownRight: 'fade-down-right',
  fadeDownLeft: 'fade-down-left',
  
  // Flip animations (use sparingly)
  flipUp: 'flip-up',
  flipDown: 'flip-down',
  flipLeft: 'flip-left',
  flipRight: 'flip-right',
  
  // Slide animations
  slideUp: 'slide-up',
  slideDown: 'slide-down',
  slideLeft: 'slide-left',
  slideRight: 'slide-right',
  
  // Zoom animations
  zoom: 'zoom-in',
  zoomOut: 'zoom-out',
  zoomUpRight: 'zoom-in-up-right',
  zoomUpLeft: 'zoom-in-up-left',
  zoomDownRight: 'zoom-in-down-right',
  zoomDownLeft: 'zoom-in-down-left'
};

// ============================================================================
// CSS ANIMATION UTILITIES
// ============================================================================

/**
 * Keyframe animations for CSS
 * Add these to your CSS/Tailwind config
 */
export const keyframes = {
  // Gentle pulse for attention
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.8 }
  },
  
  // Smooth fade in
  fadeIn: {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 }
  },
  
  // Slide in from bottom
  slideInUp: {
    '0%': { transform: 'translateY(20px)', opacity: 0 },
    '100%': { transform: 'translateY(0)', opacity: 1 }
  },
  
  // Gentle bounce (for success messages)
  gentleBounce: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-5px)' }
  },
  
  // Shimmer loading effect
  shimmer: {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' }
  },
  
  // Heartbeat for vitals
  heartbeat: {
    '0%, 100%': { transform: 'scale(1)' },
    '14%': { transform: 'scale(1.1)' },
    '28%': { transform: 'scale(1)' },
    '42%': { transform: 'scale(1.1)' },
    '70%': { transform: 'scale(1)' }
  }
};

// ============================================================================
// ACCESSIBILITY UTILITIES
// ============================================================================

/**
 * Check if user prefers reduced motion
 * Healthcare principle: Respect user preferences for motion
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get animation duration based on user preference
 */
export const getAnimationDuration = (normalDuration = 300) => {
  return prefersReducedMotion() ? 0 : normalDuration;
};

/**
 * Get spring config based on user preference
 */
export const getSpringConfig = (config = springConfigs.gentle) => {
  if (prefersReducedMotion()) {
    return { tension: 1000, friction: 50 }; // Nearly instant
  }
  return config;
};

// ============================================================================
// HEALTHCARE-SPECIFIC ANIMATIONS
// ============================================================================

/**
 * Vital Signs Animation - Subtle pulse
 */
export const vitalSignsPulse = {
  animate: {
    scale: [1, 1.02, 1],
    opacity: [1, 0.9, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

/**
 * Alert Animation - Draws attention without alarming
 */
export const alertAnimation = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: { 
    scale: 0.9, 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

/**
 * Medication Reminder - Gentle attention-grabber
 */
export const medicationReminder = {
  animate: {
    scale: [1, 1.05, 1],
    rotate: [0, -5, 5, 0],
    transition: {
      duration: 0.6,
      repeat: 3,
      ease: 'easeInOut'
    }
  }
};

/**
 * Chart Line Drawing - For health metrics
 */
export const chartLineDraw = {
  initial: { pathLength: 0 },
  animate: { 
    pathLength: 1,
    transition: {
      duration: 1.5,
      ease: 'easeInOut'
    }
  }
};

/**
 * Progress Bar Fill
 */
export const progressBarFill = (percentage) => ({
  initial: { width: '0%' },
  animate: { 
    width: `${percentage}%`,
    transition: {
      duration: 1,
      ease: 'easeOut'
    }
  }
});

/**
 * Toast Notification Animation
 */
export const toastAnimation = {
  initial: { opacity: 0, y: -50, scale: 0.3 },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.175, 0.885, 0.32, 1.275]
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.5,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

/**
 * Loading Skeleton Animation
 */
export const skeletonAnimation = {
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// ============================================================================
// TRANSITION GROUPS
// ============================================================================

/**
 * List Transition Config
 */
export const listTransitionConfig = {
  enter: 'transform transition ease-out duration-300',
  enterFrom: 'opacity-0 translate-y-4',
  enterTo: 'opacity-100 translate-y-0',
  leave: 'transform transition ease-in duration-200',
  leaveFrom: 'opacity-100 translate-y-0',
  leaveTo: 'opacity-0 translate-y-4'
};

/**
 * Modal Transition Config
 */
export const modalTransitionConfig = {
  enter: 'ease-out duration-300',
  enterFrom: 'opacity-0 scale-95',
  enterTo: 'opacity-100 scale-100',
  leave: 'ease-in duration-200',
  leaveFrom: 'opacity-100 scale-100',
  leaveTo: 'opacity-0 scale-95'
};

export default {
  pageTransition,
  fadeIn,
  slideUp,
  scaleIn,
  slideInFromLeft,
  slideInFromRight,
  staggerContainer,
  staggerItem,
  cardHover,
  pulse,
  heartbeat,
  spin,
  gentleShake,
  successCheck,
  springConfigs,
  initAOS,
  aosAnimations,
  keyframes,
  prefersReducedMotion,
  getAnimationDuration,
  getSpringConfig,
  vitalSignsPulse,
  alertAnimation,
  medicationReminder,
  chartLineDraw,
  progressBarFill,
  toastAnimation,
  skeletonAnimation,
  listTransitionConfig,
  modalTransitionConfig
};
