/**
 * AlertDialog.jsx - WCAG 2.1 AA destructive confirmation using Radix
 * Full dark mode support via inline styles (immune to CSS var overrides).
 */

import * as RadixAlert from '@radix-ui/react-alert-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info } from 'lucide-react';
import { useAppSettings } from '../../context/AppSettingsContext';

export default function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  onConfirm,
  variant = 'danger',
  loading = false,
}) {
  const { theme } = useAppSettings();
  const isDark = theme === 'dark';

  const variants = {
    danger:  { icon: AlertTriangle, iconColor:'#dc2626', iconBg: isDark?'rgba(220,38,38,0.15)':'#fef2f2', btnBg:'#ef4444', btnHover:'#dc2626' },
    warning: { icon: AlertTriangle, iconColor:'#d97706', iconBg: isDark?'rgba(217,119,6,0.15)':'#fffbeb',  btnBg:'#f59e0b', btnHover:'#d97706' },
    info:    { icon: Info,          iconColor:'#0d9488', iconBg: isDark?'rgba(13,148,136,0.15)':'#f0fdfa', btnBg:'#0d9488', btnHover:'#0f766e' },
  }[variant] || {};

  const Icon = variants.icon;

  // Dialog colours based on theme
  const dialogBg     = isDark ? '#0f1f26' : '#ffffff';
  const dialogBorder = isDark ? '#1a3040' : '#e2e8f0';
  const titleColor   = isDark ? '#e8edf3' : '#0f172a';
  const descColor    = isDark ? '#8ba0b4' : '#64748b';
  const cancelBg     = isDark ? '#1a3040' : '#f8fafc';
  const cancelColor  = isDark ? '#b0c0d0' : '#475569';
  const cancelBorder = isDark ? '#1a3040' : '#e2e8f0';

  return (
    <RadixAlert.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RadixAlert.Portal forceMount>
            <RadixAlert.Overlay asChild>
              <motion.div
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                transition={{ duration:0.15 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
            </RadixAlert.Overlay>

            <RadixAlert.Content asChild>
              <motion.div
                initial={{ opacity:0, scale:0.95, y:12 }}
                animate={{ opacity:1, scale:1, y:0 }}
                exit={{ opacity:0, scale:0.95, y:12 }}
                transition={{ type:'spring', damping:28, stiffness:380 }}
                className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md rounded-2xl shadow-2xl p-6 focus:outline-none"
                style={{
                  background: dialogBg,
                  border: `1px solid ${dialogBorder}`,
                  boxShadow: isDark
                    ? '0 25px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)'
                    : '0 25px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
                }}
              >
                {/* Icon + title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: variants.iconBg }}>
                    <Icon size={20} style={{ color: variants.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <RadixAlert.Title className="text-base font-bold leading-tight"
                      style={{ color: titleColor }}>
                      {title}
                    </RadixAlert.Title>
                    {description && (
                      <RadixAlert.Description className="text-sm mt-1 leading-relaxed"
                        style={{ color: descColor }}>
                        {description}
                      </RadixAlert.Description>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                  <RadixAlert.Cancel asChild>
                    <button
                      className="px-4 py-2 text-sm font-semibold rounded-xl border-2 transition-colors focus:outline-none"
                      style={{
                        background: cancelBg,
                        color: cancelColor,
                        borderColor: cancelBorder,
                      }}
                      disabled={loading}>
                      {cancelLabel}
                    </button>
                  </RadixAlert.Cancel>
                  <RadixAlert.Action asChild>
                    <button
                      onClick={onConfirm}
                      disabled={loading}
                      className="px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors focus:outline-none disabled:opacity-50"
                      style={{ background: variants.btnBg }}
                      onMouseEnter={e => e.currentTarget.style.background = variants.btnHover}
                      onMouseLeave={e => e.currentTarget.style.background = variants.btnBg}>
                      {loading ? 'Please wait...' : confirmLabel}
                    </button>
                  </RadixAlert.Action>
                </div>
              </motion.div>
            </RadixAlert.Content>
          </RadixAlert.Portal>
        )}
      </AnimatePresence>
    </RadixAlert.Root>
  );
}
