/**
 * ModalShell — T4TSA-inspired shared modal wrapper
 * ==================================================
 * Drop-in replacement for all the inline `fixed inset-0 bg-black/60` patterns.
 * Provides: dark heavy blur backdrop · scale-in spring · gradient header · dark mode
 *
 * Usage:
 *   <ModalShell open={show} onClose={() => setShow(false)} title="Title" accent="violet">
 *     <p>body content</p>
 *   </ModalShell>
 */
import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const SIZES = { sm:'max-w-sm', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl', full:'max-w-[95vw]' };
const GRADS = {
  teal:   'from-teal-600 to-cyan-700',
  violet: 'from-violet-600 to-purple-700',
  red:    'from-red-600 to-rose-700',
  amber:  'from-amber-500 to-orange-600',
  blue:   'from-blue-600 to-indigo-700',
  slate:  'from-slate-700 to-slate-900',
  green:  'from-emerald-600 to-teal-700',
};

export default function ModalShell({
  open, onClose,
  title, description,
  icon: Icon,
  accent = 'teal',
  size = 'md',
  footer,
  children,
  zIndex = 50,
  closeOnBackdrop = true,
  showClose = true,
}) {
  const panelRef = useRef(null);
  const prevFocus = useRef(null);
  const grad = GRADS[accent] || GRADS.teal;

  /* body scroll lock */
  useEffect(() => {
    if (!open) return;
    const y = window.scrollY;
    Object.assign(document.body.style, { overflow:'hidden', top:`-${y}px`, position:'fixed', width:'100%' });
    return () => {
      Object.assign(document.body.style, { overflow:'', top:'', position:'', width:'' });
      window.scrollTo(0, y);
    };
  }, [open]);

  /* focus management */
  useEffect(() => {
    if (open) {
      prevFocus.current = document.activeElement;
      const t = setTimeout(() => {
        panelRef.current?.querySelector('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')?.focus();
      }, 80);
      return () => clearTimeout(t);
    } else { prevFocus.current?.focus(); }
  }, [open]);

  /* keyboard */
  const onKey = useCallback((e) => {
    if (!open) return;
    if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); return; }
    if (e.key === 'Tab' && panelRef.current) {
      const els = Array.from(panelRef.current.querySelectorAll(
        'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
      ));
      if (!els.length) return;
      if (e.shiftKey && document.activeElement === els[0]) { e.preventDefault(); els[els.length-1].focus(); }
      else if (!e.shiftKey && document.activeElement === els[els.length-1]) { e.preventDefault(); els[0].focus(); }
    }
  }, [open, onClose]);
  useEffect(() => { document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, [onKey]);

  return (
    <AnimatePresence>
      {open && (
        /* ── T4TSA backdrop: very dark + heavy blur ── */
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          transition={{ duration:0.2 }}
          style={{ zIndex }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => closeOnBackdrop && onClose?.()}
        >
          {/* ── Panel ── */}
          <motion.div
            ref={panelRef}
            role="dialog" aria-modal="true" aria-labelledby={title ? 'msh-title' : undefined}
            initial={{ opacity:0, scale:0.93, y:28 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.93, y:16 }}
            transition={{ type:'spring', damping:28, stiffness:360, mass:0.7 }}
            style={{ zIndex: zIndex+1 }}
            className={`
              relative flex flex-col w-full ${SIZES[size]||SIZES.md}
              rounded-t-2xl sm:rounded-2xl
              max-h-[92dvh] sm:max-h-[88dvh]
              bg-white dark:bg-slate-900
              shadow-2xl shadow-black/50
              border border-white/10
              overflow-hidden
            `}
            onClick={e => e.stopPropagation()}
          >
            {/* ── Gradient header (T4TSA signature) ── */}
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
                    {title && <h2 id="msh-title" className="text-base font-bold text-white leading-tight truncate">{title}</h2>}
                    {description && <p className="text-xs text-white/70 mt-0.5 truncate">{description}</p>}
                  </div>
                  {showClose && (
                    <button type="button" onClick={onClose} aria-label="Close"
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/30 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white/60">
                      <X size={15} className="text-white"/>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 dark:text-slate-200">
              {children}
            </div>

            {/* ── Footer ── */}
            {footer && (
              <div className="flex-shrink-0 px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
