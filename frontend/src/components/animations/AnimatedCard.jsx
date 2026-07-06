import { motion } from 'framer-motion';
import { cardHover, fadeIn } from '../../utils/animations';

/**
 * Animated Card Component
 * Healthcare-appropriate animations for card elements
 */
export default function AnimatedCard({ 
  children, 
  className = '',
  onClick,
  delay = 0,
  hover = true,
  ...props 
}) {
  const variants = hover ? cardHover : fadeIn;
  
  return (
    <motion.div
      className={className}
      initial="rest"
      animate="rest"
      whileHover={hover ? "hover" : undefined}
      variants={variants}
      transition={{ delay }}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
}
