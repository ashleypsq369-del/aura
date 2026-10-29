/**
 * DropdownMenu.jsx - WAI-ARIA compliant dropdown using Radix UI
 * White background, compact items, Sign Out as a bottom strip.
 * avoidCollisions prevents viewport bleed.
 */
import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function DropdownMenu({ trigger, items = [], align = 'end', sideOffset = 8 }) {
 const [open, setOpen] = useState(false);

 const mainItems = items.filter(i => i.variant !== 'danger');
 const dangerItem = items.find(i => i.variant === 'danger');

 return (
 <RadixDropdown.Root open={open} onOpenChange={setOpen}>
 <RadixDropdown.Trigger asChild>{trigger}</RadixDropdown.Trigger>

 <AnimatePresence>
 {open && (
 <RadixDropdown.Portal forceMount>
 <RadixDropdown.Content
 align={align}
 sideOffset={sideOffset}
 avoidCollisions
 collisionPadding={{ top: 12, bottom: 16, left: 8, right: 8 }}
 asChild
 onCloseAutoFocus={e => e.preventDefault()}
 >
 <motion.div
 initial={{ opacity: 0, scale: 0.96, y: -4 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.96, y: -4 }}
 transition={{ duration: 0.13, ease: 'easeOut' }}
 className="z-[9999] w-60 rounded-xl shadow-xl outline-none overflow-hidden"
 style={{
 background: '#ffffff',
 border: '1px solid #e2e8f0',
 boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
 maxHeight: 'min(560px, calc(100dvh - 80px))',
 display: 'flex',
 flexDirection: 'column',
 }}
 >
 {/* Scrollable main items */}
 <div className="flex-1 overflow-y-auto p-1.5" style={{ overscrollBehavior: 'contain' }}>
 {mainItems.map((item, i) => {
 if (item.type === 'separator') {
 return <div key={i} className="h-px bg-slate-100 my-1 mx-1" />;
 }
 if (item.type === 'label') {
 return (
 <div key={i} className="px-3 py-2">
 <p className="text-[11px] font-semibold text-slate-500 truncate">{item.label}</p>
 </div>
 );
 }
 const Icon = item.icon;
 return (
 <RadixDropdown.Item
 key={i}
 onSelect={item.onClick}
 disabled={item.disabled}
 className="outline-none cursor-pointer select-none rounded-lg data-[highlighted]:bg-slate-50 data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed"
 >
 <div className="flex items-center gap-3 px-3 py-2.5">
 {Icon && (
 <Icon size={16} className="flex-shrink-0 text-slate-500" />
 )}
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-900)' }}>{item.label}</p>
 {item.desc && (
 <p className="text-[11px] mt-0.5 leading-tight truncate" style={{ color: 'var(--text-500)' }}>{item.desc}</p>
 )}
 </div>
 {item.badge && (
 <span className="text-[10px] font-bold px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded-full flex-shrink-0">
 {item.badge}
 </span>
 )}
 </div>
 </RadixDropdown.Item>
 );
 })}
 </div>

 {/* Sign Out - pinned bottom, simple text row, NO extra border/button */}
 {dangerItem && (() => {
 const Icon = dangerItem.icon;
 return (
 <RadixDropdown.Item
 onSelect={dangerItem.onClick}
 className="outline-none cursor-pointer select-none flex-shrink-0 data-[highlighted]:bg-red-50"
 style={{ borderTop: '1px solid #fee2e2' }}
 >
 <div className="flex items-center gap-3 px-4 py-3">
 {Icon && <Icon size={15} className="text-red-500 flex-shrink-0" />}
 <span className="text-sm font-semibold text-red-600">{dangerItem.label}</span>
 </div>
 </RadixDropdown.Item>
 );
 })()}
 </motion.div>
 </RadixDropdown.Content>
 </RadixDropdown.Portal>
 )}
 </AnimatePresence>
 </RadixDropdown.Root>
 );
}
