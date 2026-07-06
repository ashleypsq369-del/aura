/**
 * Modal - Universal Healthcare-Grade Dialog Component
 * =====================================================
 * Follows clinical UI best practices (Epic, NHS Digital, Doximity):
 *  - Proper focus trap & aria-modal for accessibility
 *  - Body scroll lock while open
 *  - Escape key dismiss
 *  - Backdrop click dismiss (configurable)
 *  - Sticky header + scrollable body + sticky footer
 *  - 4 size variants: sm | md | lg | xl
 *  - Spring entry/exit animation
 *  - Works on all screen sizes including mobile
 */

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'max-w-sm',    // 384px  - confirm dialogs, simple inputs
  md: 'max-w-lg',    // 512px  - single-section forms
  lg: 'max-w-2xl',   // 672px  - multi-field forms
  xl: 'max-w-4xl',   // 896px  - complex / multi-step content
};

/**
 * Modal wrapper - handles backdrop, animation, a11y, scroll lock.
 *
 * Props:
 *   isOpen       boolean          - controls visibility
 *   onClose      () => void       - called on backdrop click / Escape / X
 *   title        string           - modal heading (shown in sticky header)
 *   size         'sm'|'md'|'lg'|'xl'  - default 'md'
 *   closeOnBackdrop  boolean      - default true
 *   showClose    boolean          - show X button, default true
 *   headerClass  string           - extra classes for header
 *   footerContent  ReactNode      - rendered in sticky footer (action buttons go here)
 *   children     ReactNode        - the scrollable body content
 *   zIndex       number           - default 50
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnBackdrop = true,
  showClose = true,
  headerClass = '',
  footerContent,
  children,
  zIndex = 50,
}) {
  const panelRef = useRef(null);
  const previousActiveRef = useRef(null);

  // -- Body scroll lock ----------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // -- Focus management ----------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      previousActiveRef.current = document.activeElement;
      // Small delay to allow animation
      const t = setTimeout(() => {
        if (panelRef.current) {
          const focusable = panelRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          focusable?.focus();
        }
      }, 100);
      return () => clearTimeout(t);
    } else {
      previousActiveRef.current?.focus();
    }
  }, [isOpen]);

  // -- Keyboard handling ----------------------------------------------------
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose?.();
      return;
    }
    // Basic focus trap
    if (e.key === 'Tab' && panelRef.current) {
      const focusable = Array.from(
        panelRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleBackdropClick = () => {
    if (closeOnBackdrop) onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        /* -- Backdrop ---------------------------------------------------- */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ zIndex }}
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={handleBackdropClick}
        >
          {/* -- Panel ---------------------------------------------------- */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 380, mass: 0.8 }}
            style={{ zIndex: zIndex + 1 }}
            className={`
              relative bg-white shadow-2xl flex flex-col
              w-full ${SIZE_CLASSES[size]}
              rounded-t-2xl sm:rounded-2xl
              max-h-[92dvh] sm:max-h-[90dvh]
              overflow-hidden
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* -- Sticky Header ---------------------------------------- */}
            {(title || showClose) && (
              <div className={`
                flex-shrink-0 flex items-center justify-between
                px-5 py-4 border-b border-slate-200
                bg-white sticky top-0 z-10
                ${headerClass}
              `}>
                {title && (
                  <h2
                    id="modal-title"
                    className="text-lg font-bold text-slate-900 leading-tight pr-8"
                  >
                    {title}
                  </h2>
                )}
                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className={`
                      ${!title ? 'ml-auto' : ''}
                      flex-shrink-0 w-9 h-9 flex items-center justify-center
                      rounded-xl text-red-500 hover:text-red-700
                      hover:bg-red-50 transition-all
                      focus:outline-none focus:ring-2 focus:ring-red-500
                    `}
                    aria-label="Close"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            )}

            {/* -- Scrollable Body --------------------------------------- */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
              {children}
            </div>

            {/* -- Sticky Footer ----------------------------------------- */}
            {footerContent && (
              <div className="
                flex-shrink-0 px-5 py-4 border-t border-slate-200
                bg-slate-50 sticky bottom-0
              ">
                {footerContent}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * ModalFooter - standardised action row used inside footerContent.
 * Buttons always right-aligned: [secondary] [primary]
 */
export function ModalFooter({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  );
}

/**
 * ModalSection - a labelled section inside the modal body
 */
export function ModalSection({ label, children, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      )}
      {children}
    </div>
  );
}

/**
 * ConfirmModal - two-button confirmation dialog
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',  // 'danger' | 'primary'
  isLoading = false,
}) {
  const confirmCls = confirmVariant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
    : 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footerContent={
        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 text-sm font-bold rounded-xl border-2 transition disabled:opacity-50 ${confirmCls}`}
          >
            {isLoading ? 'Please wait...' : confirmLabel}
          </button>
        </ModalFooter>
      }
    >
      {message && (
        <p className="text-sm text-slate-700 leading-relaxed">{message}</p>
      )}
    </Modal>
  );
}
