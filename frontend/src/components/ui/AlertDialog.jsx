/**
 * AlertDialog.jsx - WCAG 2.1 AA destructive confirmation using Radix
 * ==================================================================
 * Use this instead of window.confirm() for:
 *   - Delete patient record
 *   - Cancel appointment
 *   - Clear all data
 *   - Sign out confirmation
 *
 * - Focus trap - keyboard cannot escape while open
 * - Screen reader: role="alertdialog" announces immediately
 * - Cancel returns focus to the trigger element
 *
 * Usage:
 *   <AlertDialog
 *     open={showDelete}
 *     onOpenChange={setShowDelete}
 *     title="Delete this appointment?"
 *     description="This cannot be undone. The appointment record will be permanently removed."
 *     confirmLabel="Delete"
 *     onConfirm={() => deleteMutation.mutate(id)}
 *     variant="danger"
 *   />
 */

import * as RadixAlert from '@radix-ui/react-alert-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info } from 'lucide-react';

export default function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  onConfirm,
  variant = 'danger',   // 'danger' | 'warning' | 'info'
  loading = false,
}) {
  const iconConfig = {
    danger:  { icon: AlertTriangle, iconClass: 'text-red-600',   iconBg: 'bg-red-100',   btnClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'   },
    warning: { icon: AlertTriangle, iconClass: 'text-amber-600', iconBg: 'bg-amber-100', btnClass: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500' },
    info:    { icon: Info,          iconClass: 'text-blue-600',  iconBg: 'bg-blue-100',  btnClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'   },
  }[variant] || iconConfig.danger;

  const Icon = iconConfig.icon;

  return (
    <RadixAlert.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RadixAlert.Portal forceMount>
            {/* Overlay */}
            <RadixAlert.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              />
            </RadixAlert.Overlay>

            {/* Panel */}
            <RadixAlert.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                className="
                  fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                  w-[90vw] max-w-md
                  bg-white rounded-2xl shadow-2xl border border-slate-200
                  p-6 focus:outline-none
                "
              >
                {/* Icon + title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-10 h-10 rounded-full ${iconConfig.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} className={iconConfig.iconClass} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <RadixAlert.Title className="text-base font-bold text-slate-900 leading-tight">
                      {title}
                    </RadixAlert.Title>
                    {description && (
                      <RadixAlert.Description className="text-sm text-slate-500 mt-1 leading-relaxed">
                        {description}
                      </RadixAlert.Description>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                  <RadixAlert.Cancel asChild>
                    <button
                      className="px-4 py-2 text-sm font-semibold text-slate-700 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                      disabled={loading}
                    >
                      {cancelLabel}
                    </button>
                  </RadixAlert.Cancel>
                  <RadixAlert.Action asChild>
                    <button
                      onClick={onConfirm}
                      disabled={loading}
                      className={`
                        px-4 py-2 text-sm font-bold text-white rounded-xl
                        ${iconConfig.btnClass}
                        disabled:opacity-50 disabled:cursor-not-allowed
                        focus:outline-none focus:ring-2 focus:ring-offset-1
                        transition-colors
                      `}
                    >
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
