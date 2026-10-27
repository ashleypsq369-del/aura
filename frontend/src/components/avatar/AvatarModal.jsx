/**
 * AvatarModal.jsx - Full-screen avatar builder modal
 */
import { motion, AnimatePresence } from 'framer-motion';
import AvatarBuilder from './AvatarBuilder';

export default function AvatarModal({ isOpen, onClose, onSave }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={e => e.stopPropagation()}
            className="bg-[#f0f6fa] rounded-2xl shadow-2xl overflow-hidden"
            style={{ width: '680px', maxWidth: '96vw', height: '88vh', maxHeight: '700px' }}
          >
            <AvatarBuilder
              onSave={(config) => { onSave?.(config); onClose(); }}
              onClose={onClose}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
