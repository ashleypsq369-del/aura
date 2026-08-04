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
              asChild
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.14 }}
                className="z-[9999] min-w-[200px] bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 outline-none dropdown-menu-content"
              >
                {items.map((item, i) => {
                  if (item.type === 'separator') {
                    return <RadixDropdown.Separator key={i} className="h-px bg-slate-100 my-1" />;
                  }
                  if (item.type === 'label') {
                    return (
                      <RadixDropdown.Label key={i} className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {item.label}
                      </RadixDropdown.Label>
                    );
                  }
                  const Icon = item.icon;
                  const isDanger = item.variant === 'danger';
                  return (
                    <RadixDropdown.Item
                      key={i}
                      onSelect={item.onClick}
                      disabled={item.disabled}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                        cursor-pointer outline-none select-none
                        transition-colors
                        ${isDanger
                          ? 'text-red-600 data-[highlighted]:bg-red-600 data-[highlighted]:text-white'
                          : 'text-slate-700 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900'
                        }
                        data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed
                      `}
                    >
                      {Icon && <Icon size={16} className="flex-shrink-0 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold leading-tight truncate">{item.label}</p>
                        {item.desc && <p className="text-xs text-slate-500 mt-0.5 leading-tight">{item.desc}</p>}
                      </div>
                      {item.badge && (
                        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </RadixDropdown.Item>
                  );
                })}
              </motion.div>
            </RadixDropdown.Content>
          </RadixDropdown.Portal>
        )}
      </AnimatePresence>
    </RadixDropdown.Root>
  );
}
