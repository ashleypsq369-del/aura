/**
 * DropdownMenu.jsx - WAI-ARIA compliant dropdown using Radix UI
 * =============================================================
 * - Full keyboard nav (arrow keys, Enter, Escape)
 * - Focus management - returns focus to trigger on close
 * - Used to replace the header profile dropdown in Layout.jsx
 *
 * Usage:
 *   <DropdownMenu
 *     trigger={<button>Open</button>}
 *     items={[
 *       { label: 'Profile', icon: User, onClick: () => navigate('/profile') },
 *       { type: 'separator' },
 *       { label: 'Sign Out', icon: LogOut, onClick: logout, variant: 'danger' },
 *     ]}
 *   />
 */

import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function DropdownMenu({ trigger, items = [], align = 'end', sideOffset = 6 }) {
  const [open, setOpen] = useState(false);

  return (
    <RadixDropdown.Root open={open} onOpenChange={setOpen}>
      <RadixDropdown.Trigger asChild>
        {trigger}
      </RadixDropdown.Trigger>

      <AnimatePresence>
        {open && (
          <RadixDropdown.Portal forceMount>
            <RadixDropdown.Content
              align={align}
              sideOffset={sideOffset}
              /* ── prevent viewport overflow ── */
              avoidCollisions
              collisionPadding={{ top: 12, bottom: 12, left: 8, right: 8 }}
              asChild
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.14 }}
                className="z-[9999] min-w-[220px] rounded-xl shadow-2xl border border-slate-200 outline-none overflow-hidden dropdown-menu-content"
                style={{
                  background: 'var(--card-bg, #e8fafa)',
                  /* cap height so it never clips the viewport */
                  maxHeight: 'min(520px, calc(100dvh - 80px))',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Scrollable item list */}
                <div className="flex-1 overflow-y-auto p-1.5" style={{ overscrollBehavior: 'contain' }}>
                  {items.map((item, i) => {
                    if (item.type === 'separator') {
                      return <RadixDropdown.Separator key={i} className="h-px bg-slate-200 dark:bg-slate-700 my-1" />;
                    }
                    if (item.type === 'label') {
                      return (
                        <RadixDropdown.Label
                          key={i}
                          className="px-3 py-2 text-[11px] font-bold tracking-wide"
                          style={{ color: 'var(--text-600)' }}
                        >
                          {item.label}
                        </RadixDropdown.Label>
                      );
                    }

                    const Icon = item.icon;
                    const isDanger = item.variant === 'danger';

                    if (isDanger) {
                      /* Sign Out — full-width red block at bottom */
                      return (
                        <RadixDropdown.Item
                          key={i}
                          onSelect={item.onClick}
                          className="outline-none cursor-pointer select-none mt-1"
                        >
                          <div
                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg font-bold text-sm text-white transition-all"
                            style={{ background: '#ef4444' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                            onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
                          >
                            {Icon && <Icon size={15} className="flex-shrink-0" />}
                            {item.label}
                          </div>
                        </RadixDropdown.Item>
                      );
                    }

                    return (
                      <RadixDropdown.Item
                        key={i}
                        onSelect={item.onClick}
                        disabled={item.disabled}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer outline-none select-none transition-colors data-[highlighted]:bg-teal-50 data-[highlighted]:text-teal-800 data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed"
                        style={{ color: 'var(--text-700)' }}
                      >
                        {Icon && (
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(13,148,136,0.10)', color: '#0d9488' }}
                          >
                            <Icon size={14} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold leading-tight truncate">{item.label}</p>
                          {item.desc && (
                            <p className="text-[11px] mt-0.5 leading-tight truncate" style={{ color: 'var(--text-500)' }}>
                              {item.desc}
                            </p>
                          )}
                        </div>
                        {item.badge && (
                          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded-full flex-shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </RadixDropdown.Item>
                    );
                  })}
                </div>
              </motion.div>
            </RadixDropdown.Content>
          </RadixDropdown.Portal>
        )}
      </AnimatePresence>
    </RadixDropdown.Root>
  );
}
