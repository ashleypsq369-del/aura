/**
 * Tooltip.jsx - WCAG 2.1 AA compliant tooltip using Radix UI
 * ============================================================
 * Replaces CSS data-tip tooltips for complex interactive elements.
 * - Keyboard accessible (shows on focus, not just hover)
 * - Screen reader compatible (role="tooltip", aria-describedby wired automatically)
 * - Respects prefers-reduced-motion
 * - 700ms show delay, instant hide - matches our CSS tooltip timing
 *
 * Usage:
 *   <Tooltip content="Save profile changes">
 *     <button>Save</button>
 *   </Tooltip>
 *
 *   <Tooltip content="Critical - requires immediate attention" side="right">
 *     <AlertBadge />
 *   </Tooltip>
 */

import * as RadixTooltip from '@radix-ui/react-tooltip';

// Wrap your app (or Layout) with this once
export function TooltipProvider({ children }) {
  return (
    <RadixTooltip.Provider delayDuration={700} skipDelayDuration={100}>
      {children}
    </RadixTooltip.Provider>
  );
}

export default function Tooltip({
  content,
  children,
  side = 'top',       // 'top' | 'bottom' | 'left' | 'right'
  align = 'center',   // 'start' | 'center' | 'end'
  disabled = false,
}) {
  if (!content || disabled) return children;

  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>
        {children}
      </RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          align={align}
          sideOffset={6}
          className="
            z-[9999] px-2.5 py-1.5 rounded-lg
            bg-slate-900 text-white text-[11px] font-semibold leading-snug
            shadow-xl max-w-[220px]
            select-none pointer-events-none
            data-[state=delayed-open]:animate-tooltip-in
            data-[state=closed]:animate-tooltip-out
          "
        >
          {content}
          <RadixTooltip.Arrow className="fill-slate-900" width={10} height={5} />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
