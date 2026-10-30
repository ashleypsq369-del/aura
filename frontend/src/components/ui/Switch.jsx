/**
 * Switch.jsx - Pill/Capsule toggle with sliding thumb
 * ====================================================
 * Pure CSS transition - no Framer Motion conflict.
 * Radix manages state via data-[state=checked/unchecked].
 * Thumb slides left→right using translateX via Tailwind data: variants.
 *
 * WCAG 2.1 AA: role="switch" + aria-checked + Space key.
 */
import * as RadixSwitch from '@radix-ui/react-switch';
import { useId } from 'react';

export default function Switch({
 checked,
 onCheckedChange,
 label,
 disabled = false,
 color = '#0d9488',
 id,
}) {
 const autoId  = useId();
 const switchId = id || autoId;

 return (
 <div className="flex items-center gap-2">
 {label && (
 <label
 htmlFor={switchId}
 className="text-sm text-[var(--text-700)] cursor-pointer select-none"
 >
 {label}
 </label>
 )}

 <RadixSwitch.Root
 id={switchId}
 checked={checked}
 onCheckedChange={onCheckedChange}
 disabled={disabled}
 aria-label={label}
 className={[
 'relative inline-flex items-center shrink-0 cursor-pointer select-none',
 'w-[52px] h-[26px] rounded-full px-[3px]',
 'transition-colors duration-200 ease-in-out',
 'data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-600',
 'hover:brightness-95',
 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500',
 'disabled:opacity-50 disabled:cursor-not-allowed',
 ].join(' ')}
 style={{ backgroundColor: checked ? color : undefined }}
 >
 <RadixSwitch.Thumb
 className={[
 'block rounded-full bg-white shadow-md',
 'w-[20px] h-[20px]',
 'transition-transform duration-200 ease-in-out',
 'data-[state=unchecked]:translate-x-0',
 'data-[state=checked]:translate-x-[26px]',
 'will-change-transform',
 ].join(' ')}
 />
 </RadixSwitch.Root>
 </div>
 );
}
