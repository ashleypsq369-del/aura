/**
 * Dialog.jsx - WCAG 2.1 AA compliant modal using Radix UI Dialog
 * ==============================================================
 * - Focus trap - keyboard can't escape the modal while open
 * - Screen reader: role="dialog", aria-labelledby, aria-describedby
 * - Escape key closes, click-outside closes
 * - Scroll-locks body when open
 * - Replaces the hand-rolled Modal.jsx for clinical forms
 *
 * Usage:
 *   <Dialog open={open} onOpenChange={setOpen} title="Schedule Appointment">
 *     <p>Form content here</p>
 *   </Dialog>
 */

import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',       // 'sm' | 'md' | 'lg' | 'xl' | 'full'
  hideClose = false,
}) {
  const sizeClass = {
    sm:   'max-w-sm',
    md:   'max-w-lg',
    lg:   'max-w-2xl',
    xl:   'max-w-4xl',
    full: 'max-w-[95vw]',
  }[size] || 'max-w-lg';

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            {/* Backdrop */}
            <RadixDialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
              />
            </RadixDialog.Overlay>

            {/* Panel */}
            <RadixDialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ type: 'spring', damping: 26, stiffness: 340, mass: 0.8 }}
                className={`
                  fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                  w-[90vw] ${sizeClass}
                  max-h-[90dvh] flex flex-col
                  bg-white rounded-2xl shadow-2xl border border-slate-200
                  overflow-hidden
                  focus:outline-none
                `}
              >
                {/* Header */}
                {(title || !hideClose) && (
                  <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-100 flex-shrink-0">
                    <div className="flex-1 min-w-0">
                      {title && (
                        <RadixDialog.Title className="text-base font-bold text-slate-900 leading-tight">
                          {title}
                        </RadixDialog.Title>
                      )}
                      {description && (
                        <RadixDialog.Description className="text-sm text-slate-500 mt-0.5">
                          {description}
                        </RadixDialog.Description>
                      )}
                    </div>
                    {!hideClose && (
                      <RadixDialog.Close
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0 focus-visible:ring-2 focus-visible:ring-teal-500"
                        aria-label="Close dialog"
                        data-tip="Close"
                      >
                        <X size={18} />
                      </RadixDialog.Close>
                    )}
                  </div>
                )}

                {/* Body - scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50">
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

// Convenience trigger wrapper
export function DialogTrigger({ children, asChild = true }) {
  return <RadixDialog.Trigger asChild={asChild}>{children}</RadixDialog.Trigger>;
}
