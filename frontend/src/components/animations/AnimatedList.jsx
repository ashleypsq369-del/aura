import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../utils/animations';

/**
 * Animated List Component
 * Creates a staggered animation effect for list items
 */
export default function AnimatedList({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
}

/**
 * List Item Component
 * Individual item with stagger animation
 */
export function AnimatedListItem({ children, className = '', ...props }) {
  return (
    <motion.div
      className={className}
      variants={staggerItem}
      {...props}
    >
      {children}
    </motion.div>
  );
}
