/**
 * Modal.jsx — T4TSA-inspired universal modal
 * ============================================
 * Dark glassmorphism backdrop · scale-in spring animation
 * Gradient header · rounded-2xl panel · light + dark mode
 * WCAG 2.1 AA: focus trap, aria-modal, escape key, body scroll lock
 */

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const ACCENT_GRADS = {
  teal:   'from-teal-600 to-cyan-700',
  violet: 'from-violet-600 to-purple-700',
  red:    'from-red-600 to-rose-700',
  amber:  'from-amber-500 to-orange-600',
  blue:   'from-blue-600 to-indigo-700',
  slate:  'from-slate-700 to-slate-900',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnBackdrop = true,
  showClose = true,
  footerContent,
  children,
  zIndex = 50,
  accent = 'teal',
  icon: Icon,
  description,
}) {
  const panelRef = useRef(null);
  const previousActiveRef = useRef(null);
  const grad = ACCENT_GRADS[accent] || ACCENT_GRADS.teal;

  /* ── Body scroll lock ── */
  useEffect(() => {
    if (!isOpen) return;
    const y = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.top = `-${y}px`;
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, y);
    };
  }, [isOpen]);

  /* ── Focus management ── */
  useEffect(() => {
    if (isOpen) {
      previousActiveRef.current = document.activeElement;
      const t = setTimeout(() => {
        panelRef.current?.querySelector(
          'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
        )?.focus();
      }, 80);
      return () => clearTimeout(t);
    } else {
      previousActiveRef.current?.focus();
    }
  }, [isOpen]);

  /* ── Keyboard: Escape + focus trap ── */
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); return; }
    if (e.key === 'Tab' && panelRef.current) {
      const nodes = Array.from(panelRef.current.querySelectorAll(
        'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
      ));
      if (!nodes.length) return;
      if (e.shiftKey && document.activeElement === nodes[0]) { e.preventDefault(); nodes[nodes.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === nodes[nodes.length - 1]) { e.preventDefault(); nodes[0].focus(); }
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        /* ── Backdrop: heavy dark blur (T4TSA style) ── */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ zIndex }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => closeOnBackdrop && onClose?.()}
        >
          {/* ── Panel ── */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            initial={{ opacity: 0, scale: 0.93, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360, mass: 0.7 }}
            style={{ zIndex: zIndex + 1 }}
            className={`
              relative flex flex-col w-full ${SIZE_CLASSES[size] || SIZE_CLASSES.md}
              rounded-t-2xl sm:rounded-2xl
              max-h-[92dvh] sm:max-h-[90dvh]
              bg-white dark:bg-slate-900
              shadow-2xl shadow-black/50
              border border-white/10
              overflow-hidden
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Gradient header (T4TSA style) ── */}
            {(title || showClose) && (
              <div className={`bg-gradient-to-r ${grad} px-5 py-4 flex-shrink-0 relative overflow-hidden`}>
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none"/>
                <div className="relative z-10 flex items-center gap-3">
                  {Icon && (
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Icon size={17} className="text-white"/>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {title && (
                      <h2 id="modal-title" className="text-base font-bold text-white leading-tight pr-6 truncate">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p className="text-xs text-white/70 mt-0.5 truncate">{description}</p>
                    )}
                  </div>
                  {showClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="absolute top-0 right-0 w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/60"
                      aria-label="Close"
                    >
                      <X size={16} className="text-white"/>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 dark:text-slate-200">
              {children}
            </div>

            {/* ── Sticky footer ── */}
            {footerContent && (
              <div className="flex-shrink-0 px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                {footerContent}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── ModalFooter ── right-aligned action row */
export function ModalFooter({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  );
}

/* ── ModalSection ── labelled content block */
export function ModalSection({ label, children, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>}
      {children}
    </div>
  );
}

/* ── ConfirmModal ── two-button confirm dialog */
export function ConfirmModal({
  isOpen, onClose, onConfirm,
  title = 'Are you sure?', message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  isLoading = false,
}) {
  const confirmCls = confirmVariant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-teal-600 hover:bg-teal-700 text-white';

  return (
    <Modal
      isOpen={isOpen} onClose={onClose} title={title} size="sm"
      accent={confirmVariant === 'danger' ? 'red' : 'teal'}
      footerContent={
        <ModalFooter>
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={isLoading}
            className={`px-5 py-2 text-sm font-bold rounded-xl transition disabled:opacity-50 shadow-sm ${confirmCls}`}>
            {isLoading ? 'Please wait…' : confirmLabel}
          </button>
        </ModalFooter>
      }
    >
      {message && <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{message}</p>}
    </Modal>
  );
}
