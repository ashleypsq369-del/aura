/**
 * Modal.jsx — clean, professional healthcare modal
 * ==================================================
 * White header with left-accent colour strip. No dark gradients.
 * WCAG 2.1 AA: focus trap, aria-modal, escape key, body scroll lock.
 */
import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppSettings } from '../context/AppSettingsContext';

const SIZE_CLASSES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

const ACCENT_COLORS = {
  teal:   { light: '#0d9488', dark: '#2dd4bf' },
  violet: { light: '#7c3aed', dark: '#a78bfa' },
  red:    { light: '#dc2626', dark: '#f87171' },
  amber:  { light: '#d97706', dark: '#fbbf24' },
  blue:   { light: '#2563eb', dark: '#60a5fa' },
  slate:  { light: '#475569', dark: '#94a3b8' },
  green:  { light: '#059669', dark: '#34d399' },
};

const ICON_BGS = {
  teal:   { light: '#f0fdf4', dark: 'rgba(13,148,136,0.15)'  },
  violet: { light: '#f5f3ff', dark: 'rgba(124,58,237,0.15)' },
  red:    { light: '#fef2f2', dark: 'rgba(220,38,38,0.15)'  },
  amber:  { light: '#fffbeb', dark: 'rgba(217,119,6,0.15)'  },
  blue:   { light: '#eff6ff', dark: 'rgba(29,78,216,0.15)'  },
  slate:  { light: '#f8fafc', dark: 'rgba(71,85,105,0.15)'  },
  green:  { light: '#f0fdf4', dark: 'rgba(5,150,105,0.15)'  },
};

export default function Modal({
  isOpen, onClose,
  title, description,
  size = 'md',
  closeOnBackdrop = true,
  showClose = true,
  footerContent, children,
  zIndex = 50,
  accent = 'teal',
  icon: Icon,
}) {
  const panelRef   = useRef(null);
  const prevFocus  = useRef(null);
  const { theme }  = useAppSettings();
  const isDark     = theme === 'dark';

  const accentClr = (ACCENT_COLORS[accent] || ACCENT_COLORS.teal)[isDark ? 'dark' : 'light'];
  const iconBg    = (ICON_BGS[accent]       || ICON_BGS.teal)[isDark ? 'dark' : 'light'];
  const headerBg  = isDark ? '#1e293b' : '#ffffff';
  const headerBdr = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const panelBg   = isDark ? '#1e293b' : '#ffffff';
  const panelBdr  = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const bodyClr   = isDark ? '#e2e8f0' : '#1e293b';
  const footerBg  = isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc';
  const closeBg   = isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9';
  const closeClr  = isDark ? '#94a3b8' : '#64748b';

  /* body scroll lock */
  useEffect(() => {
    if (!isOpen) return;
    const y = window.scrollY;
    Object.assign(document.body.style, { overflow: 'hidden', top: `-${y}px`, position: 'fixed', width: '100%' });
    return () => {
      Object.assign(document.body.style, { overflow: '', top: '', position: '', width: '' });
      window.scrollTo(0, y);
    };
  }, [isOpen]);

  /* focus management */
  useEffect(() => {
    if (isOpen) {
      prevFocus.current = document.activeElement;
      const t = setTimeout(() => {
        panelRef.current?.querySelector(
          'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )?.focus();
      }, 80);
      return () => clearTimeout(t);
    } else { prevFocus.current?.focus(); }
  }, [isOpen]);

  /* keyboard */
  const handleKey = useCallback((e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); return; }
    if (e.key === 'Tab' && panelRef.current) {
      const els = Array.from(panelRef.current.querySelectorAll(
        'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
      ));
      if (!els.length) return;
      if (e.shiftKey && document.activeElement === els[0]) { e.preventDefault(); els[els.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === els[els.length - 1]) { e.preventDefault(); els[0].focus(); }
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ zIndex, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
          className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => closeOnBackdrop && onClose?.()}
        >
          <motion.div
            ref={panelRef}
            role="dialog" aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380, mass: 0.6 }}
            style={{
              zIndex: zIndex + 1,
              background: panelBg,
              border: `1px solid ${panelBdr}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.10)',
            }}
            className={`relative flex flex-col w-full ${SIZE_CLASSES[size] || SIZE_CLASSES.md} rounded-t-2xl sm:rounded-2xl max-h-[92dvh] sm:max-h-[90dvh] overflow-hidden`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showClose) && (
              <div
                className="flex-shrink-0 flex items-center gap-3 px-5 py-4 border-b"
                style={{ background: headerBg, borderColor: headerBdr, borderLeft: `4px solid ${accentClr}` }}
              >
                {Icon && (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: iconBg }}>
                    <Icon size={17} style={{ color: accentClr }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {title && (
                    <h2 id="modal-title" className="text-sm font-bold leading-tight truncate"
                      style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-xs mt-0.5 truncate"
                      style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                      {description}
                    </p>
                  )}
                </div>
                {showClose && (
                  <button type="button" onClick={onClose} aria-label="Close"
                    className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
                    style={{ background: closeBg, color: closeClr }}>
                    <X size={15} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5"
              style={{ color: bodyClr }}>
              {children}
            </div>

            {/* Footer */}
            {footerContent && (
              <div className="flex-shrink-0 px-5 py-4 border-t"
                style={{ background: footerBg, borderColor: headerBdr }}>
                {footerContent}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ModalFooter({ children, className = '' }) {
  return <div className={`flex items-center justify-end gap-3 ${className}`}>{children}</div>;
}

export function ModalSection({ label, children, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>}
      {children}
    </div>
  );
}

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
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
      accent={confirmVariant === 'danger' ? 'red' : 'teal'}
      footerContent={
        <ModalFooter>
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition">
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
