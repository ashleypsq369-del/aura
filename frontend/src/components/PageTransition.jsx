import { motion } from 'framer-motion';

/**
 * PageTransition - Smooth page transitions for navigation
 * Provides professional slide-in effect when navigating between pages
 */
export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ 
        duration: 0.2, 
        ease: 'easeOut'
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
