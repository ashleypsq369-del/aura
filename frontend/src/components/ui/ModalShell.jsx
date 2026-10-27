/**
 * ModalShell - shared modal wrapper
 * ==================================
 * Clean, professional healthcare modal.
 * White header with coloured left-accent strip.
 * Subtle backdrop. Consistent with standard healthcare app modals (Epic, Cerner).
 */
import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppSettings } from '../../context/AppSettingsContext';

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-[95vw]' };

// Accent colour token → left border + icon colour
const ACCENT = {
 teal: { border: '#0d9488', icon: '#0d9488', iconBg: '#f0fdf4', headerBg: '#ffffff', titleClr: '#0f172a', subClr: '#64748b' },
 violet: { border: '#7c3aed', icon: '#7c3aed', iconBg: '#f5f3ff', headerBg: '#ffffff', titleClr: '#0f172a', subClr: '#64748b' },
 red: { border: '#dc2626', icon: '#dc2626', iconBg: '#fef2f2', headerBg: '#ffffff', titleClr: '#0f172a', subClr: '#64748b' },
 amber: { border: '#d97706', icon: '#d97706', iconBg: '#fffbeb', headerBg: '#ffffff', titleClr: '#0f172a', subClr: '#64748b' },
 blue: { border: '#2563eb', icon: '#2563eb', iconBg: '#eff6ff', headerBg: '#ffffff', titleClr: '#0f172a', subClr: '#64748b' },
 slate: { border: '#475569', icon: '#475569', iconBg: '#f8fafc', headerBg: '#ffffff', titleClr: '#0f172a', subClr: '#64748b' },
 green: { border: '#059669', icon: '#059669', iconBg: '#f0fdf4', headerBg: '#ffffff', titleClr: '#0f172a', subClr: '#64748b' },
};

// Dark-mode accent tokens
const ACCENT_DARK = {
 teal: { border: '#2dd4bf', icon: '#2dd4bf', iconBg: 'rgba(13,148,136,0.15)', headerBg: '#1e293b', titleClr: '#f1f5f9', subClr: '#94a3b8' },
 violet: { border: '#a78bfa', icon: '#a78bfa', iconBg: 'rgba(124,58,237,0.15)', headerBg: '#1e293b', titleClr: '#f1f5f9', subClr: '#94a3b8' },
 red: { border: '#f87171', icon: '#f87171', iconBg: 'rgba(220,38,38,0.15)', headerBg: '#1e293b', titleClr: '#f1f5f9', subClr: '#94a3b8' },
 amber: { border: '#fbbf24', icon: '#fbbf24', iconBg: 'rgba(217,119,6,0.15)', headerBg: '#1e293b', titleClr: '#f1f5f9', subClr: '#94a3b8' },
 blue: { border: '#60a5fa', icon: '#60a5fa', iconBg: 'rgba(29,78,216,0.15)', headerBg: '#1e293b', titleClr: '#f1f5f9', subClr: '#94a3b8' },
 slate: { border: '#94a3b8', icon: '#94a3b8', iconBg: 'rgba(71,85,105,0.15)', headerBg: '#1e293b', titleClr: '#f1f5f9', subClr: '#94a3b8' },
 green: { border: '#34d399', icon: '#34d399', iconBg: 'rgba(5,150,105,0.15)', headerBg: '#1e293b', titleClr: '#f1f5f9', subClr: '#94a3b8' },
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
 const { theme } = useAppSettings();
 const isDark = theme === 'dark';

 const A = (isDark ? ACCENT_DARK[accent] : ACCENT[accent]) || (isDark ? ACCENT_DARK.teal : ACCENT.teal);

 /* body scroll lock */
 useEffect(() => {
 if (!open) return;
 const y = window.scrollY;
 Object.assign(document.body.style, { overflow: 'hidden', top: `-${y}px`, position: 'fixed', width: '100%' });
 return () => {
 Object.assign(document.body.style, { overflow: '', top: '', position: '', width: '' });
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

 /* keyboard trap */
 const onKey = useCallback((e) => {
 if (!open) return;
 if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); return; }
 if (e.key === 'Tab' && panelRef.current) {
 const els = Array.from(panelRef.current.querySelectorAll(
 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
 ));
 if (!els.length) return;
 if (e.shiftKey && document.activeElement === els[0]) { e.preventDefault(); els[els.length - 1].focus(); }
 else if (!e.shiftKey && document.activeElement === els[els.length - 1]) { e.preventDefault(); els[0].focus(); }
 }
 }, [open, onClose]);

 useEffect(() => {
 document.addEventListener('keydown', onKey);
 return () => document.removeEventListener('keydown', onKey);
 }, [onKey]);

 return (
 <AnimatePresence>
 {open && (
 /* ── Backdrop: subtle dark scrim, no heavy blur ── */
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.18 }}
 style={{ zIndex }}
 className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
 style={{ zIndex, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
 onClick={() => closeOnBackdrop && onClose?.()}
 >
 {/* ── Panel ── */}
 <motion.div
 ref={panelRef}
 role="dialog"
 aria-modal="true"
 aria-labelledby={title ? 'msh-title' : undefined}
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 12 }}
 transition={{ type: 'spring', damping: 28, stiffness: 380, mass: 0.6 }}
 style={{
 zIndex: zIndex + 1,
 background: isDark ? '#1e293b' : '#ffffff',
 border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
 boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.10)',
 }}
 className={`
 relative flex flex-col w-full ${SIZES[size] || SIZES.md}
 rounded-t-2xl sm:rounded-2xl
 max-h-[92dvh] sm:max-h-[88dvh]
 overflow-hidden
 `}
 onClick={e => e.stopPropagation()}
 >
 {/* ── Clean header with left-accent strip ── */}
 {(title || showClose) && (
 <div
 className="flex-shrink-0 flex items-center gap-3 px-5 py-4 border-b"
 style={{
 background: A.headerBg,
 borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
 borderLeft: `4px solid ${A.border}`,
 }}
 >
 {Icon && (
 <div
 className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
 style={{ background: A.iconBg, border: `1px solid ${A.border}28` }}
 >
 <Icon size={17} style={{ color: A.icon }} />
 </div>
 )}
 <div className="flex-1 min-w-0">
 {title && (
 <h2 id="msh-title" className="text-sm font-bold leading-tight truncate"
 style={{ color: A.titleClr }}>
 {title}
 </h2>
 )}
 {description && (
 <p className="text-xs mt-0.5 truncate" style={{ color: A.subClr }}>
 {description}
 </p>
 )}
 </div>
 {showClose && (
 <button
 type="button"
 onClick={onClose}
 aria-label="Close"
 className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
 style={{
 background: isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9',
 color: isDark ? '#94a3b8' : '#64748b',
 }}
 onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'; }}
 onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9'; }}
 >
 <X size={15} />
 </button>
 )}
 </div>
 )}

 {/* ── Scrollable body ── */}
 <div
 className="flex-1 overflow-y-auto overscroll-contain px-5 py-5"
 style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
 >
 {children}
 </div>

 {/* ── Footer ── */}
 {footer && (
 <div
 className="flex-shrink-0 px-5 py-4 border-t"
 style={{
 background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
 borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
 }}
 >
 {footer}
 </div>
 )}
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 );
}
