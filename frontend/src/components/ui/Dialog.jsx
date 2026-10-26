/**
 * Dialog.jsx — clean, professional healthcare modal (Radix UI)
 * =============================================================
 * White header with left-accent colour strip.
 * Subtle backdrop. WCAG 2.1 AA accessible.
 */
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSettings } from '../../context/AppSettingsContext';

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-[95vw]' };

const ACCENT = {
  teal:   { light: '#0d9488', dark: '#2dd4bf' },
  violet: { light: '#7c3aed', dark: '#a78bfa' },
  red:    { light: '#dc2626', dark: '#f87171' },
  amber:  { light: '#d97706', dark: '#fbbf24' },
  blue:   { light: '#2563eb', dark: '#60a5fa' },
  slate:  { light: '#475569', dark: '#94a3b8' },
  green:  { light: '#059669', dark: '#34d399' },
};

const ICON_BG = {
  teal:   { light: '#f0fdf4', dark: 'rgba(13,148,136,0.15)'  },
  violet: { light: '#f5f3ff', dark: 'rgba(124,58,237,0.15)' },
  red:    { light: '#fef2f2', dark: 'rgba(220,38,38,0.15)'  },
  amber:  { light: '#fffbeb', dark: 'rgba(217,119,6,0.15)'  },
  blue:   { light: '#eff6ff', dark: 'rgba(29,78,216,0.15)'  },
  slate:  { light: '#f8fafc', dark: 'rgba(71,85,105,0.15)'  },
  green:  { light: '#f0fdf4', dark: 'rgba(5,150,105,0.15)'  },
};

export default function Dialog({
  open, onOpenChange,
  title, description,
  children, footer,
  size = 'md',
  hideClose = false,
  icon: Icon,
  accent = 'teal',
}) {
  const { theme } = useAppSettings();
  const isDark = theme === 'dark';

  const accentClr = (ACCENT[accent] || ACCENT.teal)[isDark ? 'dark' : 'light'];
  const iconBg    = (ICON_BG[accent]  || ICON_BG.teal)[isDark ? 'dark' : 'light'];
  const headerBg  = isDark ? '#1e293b' : '#ffffff';
  const headerBdr = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const titleClr  = isDark ? '#f1f5f9' : '#0f172a';
  const subClr    = isDark ? '#94a3b8' : '#64748b';
  const panelBg   = isDark ? '#1e293b' : '#ffffff';
  const panelBdr  = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const bodyClr   = isDark ? '#e2e8f0' : '#1e293b';
  const footerBg  = isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc';
  const closeBg   = isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9';
  const closeClr  = isDark ? '#94a3b8' : '#64748b';

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            {/* Backdrop */}
            <RadixDialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-50"
                style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
              />
            </RadixDialog.Overlay>

            {/* Panel */}
            <RadixDialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ type: 'spring', damping: 28, stiffness: 380, mass: 0.6 }}
                className={`fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] ${SIZES[size] || SIZES.md} max-h-[90dvh] flex flex-col rounded-2xl overflow-hidden focus:outline-none`}
                style={{
                  background:  panelBg,
                  border:      `1px solid ${panelBdr}`,
                  boxShadow:   '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.10)',
                }}
              >
                {/* Header */}
                {(title || !hideClose) && (
                  <div className="flex-shrink-0 flex items-center gap-3 px-5 py-4 border-b"
                    style={{ background: headerBg, borderColor: headerBdr, borderLeft: `4px solid ${accentClr}` }}>
                    {Icon && (
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: iconBg }}>
                        <Icon size={17} style={{ color: accentClr }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {title && (
                        <RadixDialog.Title className="text-sm font-bold leading-tight truncate"
                          style={{ color: titleClr }}>
                          {title}
                        </RadixDialog.Title>
                      )}
                      {description && (
                        <RadixDialog.Description className="text-xs mt-0.5 truncate"
                          style={{ color: subClr }}>
                          {description}
                        </RadixDialog.Description>
                      )}
                    </div>
                    {!hideClose && (
                      <RadixDialog.Close asChild>
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors flex-shrink-0 focus-visible:ring-2 focus-visible:ring-teal-400/50"
                          style={{ background: closeBg, color: closeClr }}
                          aria-label="Close"
                        >
                          <X size={15} />
                        </button>
                      </RadixDialog.Close>
                    )}
                  </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-5" style={{ color: bodyClr }}>
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="flex-shrink-0 px-5 py-4 border-t"
                    style={{ background: footerBg, borderColor: headerBdr }}>
                    {footer}
                  </div>
                )}
              </motion.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}

export function DialogTrigger({ children, asChild = true }) {
  return <RadixDialog.Trigger asChild={asChild}>{children}</RadixDialog.Trigger>;
}
