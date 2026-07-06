import { motion } from 'framer-motion';

/**
 * Animated Button Component
 * Professional button animations for healthcare UI
 */
export default function AnimatedButton({ 
  children, 
  className = '',
  loading = false,
  disabled = false,
  onClick,
  ...props 
}) {
  return (
    <motion.button
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{
        duration: 0.2,
        ease: 'easeInOut'
      }}
      {...props}
    >
      {loading ? (
        <motion.div
          className="flex items-center justify-center space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
          <span>Loading...</span>
        </motion.div>
      ) : (
        children
      )}
    </motion.button>
  );
}
