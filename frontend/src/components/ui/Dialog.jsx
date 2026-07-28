/**
 * Dialog.jsx — T4TSA-inspired modal design
 * ==========================================
 * Dark glassmorphism backdrop · scale-in spring animation · rounded-2xl panel
 * Gradient header strip · works in light AND dark mode
 * WCAG 2.1 AA: focus trap, aria-modal, escape key, body scroll lock
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
  size = 'md',
  hideClose = false,
  icon: Icon,
  accent = 'teal', // teal | violet | red | amber | blue
}) {
  const sizeClass = {
    sm:   'max-w-sm',
    md:   'max-w-lg',
    lg:   'max-w-2xl',
    xl:   'max-w-4xl',
    full: 'max-w-[95vw]',
  }[size] || 'max-w-lg';

  const accentGrad = {
    teal:   'from-teal-600 to-cyan-700',
    violet: 'from-violet-600 to-purple-700',
    red:    'from-red-600 to-rose-700',
    amber:  'from-amber-500 to-orange-600',
    blue:   'from-blue-600 to-indigo-700',
  }[accent] || 'from-teal-600 to-cyan-700';

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            {/* ── Backdrop: dark + heavy blur (T4TSA style) ── */}
            <RadixDialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
              />
            </RadixDialog.Overlay>

            {/* ── Panel ── */}
            <RadixDialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 16 }}
                transition={{ type: 'spring', damping: 28, stiffness: 360, mass: 0.7 }}
                className={`
                  fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                  w-[92vw] ${sizeClass}
                  max-h-[90dvh] flex flex-col
                  bg-white dark:bg-slate-900
                  rounded-2xl shadow-2xl shadow-black/40
                  border border-white/10 dark:border-white/10
                  overflow-hidden
                  focus:outline-none
                `}
              >
                {/* ── Gradient header strip ── */}
                {(title || !hideClose) && (
                  <div className={`bg-gradient-to-r ${accentGrad} px-5 py-4 flex-shrink-0 relative overflow-hidden`}>
                    {/* Decorative circle */}
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none"/>
                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {Icon && (
                          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                            <Icon size={17} className="text-white"/>
                          </div>
                        )}
                        <div className="min-w-0">
                          {title && (
                            <RadixDialog.Title className="text-base font-bold text-white leading-tight truncate">
                              {title}
                            </RadixDialog.Title>
                          )}
                          {description && (
                            <RadixDialog.Description className="text-xs text-white/70 mt-0.5 truncate">
                              {description}
                            </RadixDialog.Description>
                          )}
                        </div>
                      </div>
                      {!hideClose && (
                        <RadixDialog.Close
                          className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0 focus-visible:ring-2 focus-visible:ring-white/60"
                          aria-label="Close"
                        >
                          <X size={16} className="text-white"/>
                        </RadixDialog.Close>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Scrollable body ── */}
                <div className="flex-1 overflow-y-auto px-5 py-5 dark:text-slate-200">
                  {children}
                </div>

                {/* ── Footer ── */}
                {footer && (
                  <div className="flex-shrink-0 px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
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
