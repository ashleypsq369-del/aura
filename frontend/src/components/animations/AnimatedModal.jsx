import { motion, AnimatePresence } from 'framer-motion';
import { slideUp } from '../../utils/animations';

/**
 * Animated Modal Component
 * Smooth modal animations with backdrop
 */
export default function AnimatedModal({ isOpen, onClose, children, size = 'md' }) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full mx-4'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              className={`${sizeClasses[size]} w-full bg-slate-50 rounded-2xl shadow-2xl pointer-events-auto`}
              variants={slideUp}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Modal Header Component
 */
export function ModalHeader({ title, onClose, className = '' }) {
  return (
    <div className={`flex items-center justify-between p-6 border-b border-gray-200 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      {onClose && (
        <motion.button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
      )}
    </div>
  );
}

/**
 * Modal Body Component
 */
export function ModalBody({ children, className = '' }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Modal Footer Component
 */
export function ModalFooter({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-end space-x-3 p-6 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
}
