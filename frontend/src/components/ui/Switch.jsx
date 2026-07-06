/**
 * Switch.jsx - WCAG 2.1 AA compliant toggle using Radix UI Switch
 * ================================================================
 * - Proper role="switch" + aria-checked announced to screen readers
 * - Full keyboard support (Space to toggle)
 * - Focus-visible ring for keyboard navigation
 * - Replaces the hand-rolled Toggle in Settings.jsx
 *
 * Usage:
 *   <Switch checked={on} onCheckedChange={setOn} label="Enable notifications" />
 */

import * as RadixSwitch from '@radix-ui/react-switch';

export default function Switch({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  color = '#0d9488',   // teal default
  id,
}) {
  const switchId = id || `switch-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex items-center gap-2">
      {label && (
        <label
          htmlFor={switchId}
          className="text-sm text-gray-700 cursor-pointer select-none"
        >
          {label}
        </label>
      )}
      <RadixSwitch.Root
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        style={{
          '--switch-color': color,
        }}
        className={`
          relative inline-flex h-[26px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
          data-[state=checked]:bg-[var(--switch-color)]
          data-[state=unchecked]:bg-gray-300
        `}
        aria-label={label}
      >
        <RadixSwitch.Thumb
          className={`
            pointer-events-none block h-[20px] w-[20px] rounded-full bg-white shadow-lg ring-0
            transition-transform duration-200 ease-in-out
            data-[state=checked]:translate-x-[18px]
            data-[state=unchecked]:translate-x-0
          `}
        />
      </RadixSwitch.Root>
    </div>
  );
}
