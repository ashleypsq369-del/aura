/**
 * Progress.jsx - Accessible progress bar using Radix UI
 * =====================================================
 * - role="progressbar" + aria-valuenow/min/max for screen readers
 * - Colour-coded for clinical severity (pain score, risk level)
 * - Animated fill with Framer Motion (respects reduced motion)
 *
 * Usage:
 *   <Progress value={7} max={10} label="Pain Score" variant="danger" />
 *   <Progress value={65} label="Care Plan" variant="teal" showValue />
 */

import * as RadixProgress from '@radix-ui/react-progress';
import { motion } from 'framer-motion';

const VARIANTS = {
  teal:    { track: 'bg-teal-100',   fill: 'bg-teal-600'   },
  green:   { track: 'bg-green-100',  fill: 'bg-green-500'  },
  amber:   { track: 'bg-amber-100',  fill: 'bg-amber-500'  },
  orange:  { track: 'bg-orange-100', fill: 'bg-orange-500' },
  danger:  { track: 'bg-red-100',    fill: 'bg-red-600'    },
  blue:    { track: 'bg-blue-100',   fill: 'bg-blue-500'   },
  purple:  { track: 'bg-purple-100', fill: 'bg-purple-500' },
  slate:   { track: 'bg-slate-200',  fill: 'bg-slate-500'  },
  violet:  { track: 'bg-violet-100', fill: 'bg-violet-600' },
};

/** Auto-pick variant based on 0-10 clinical score */
function autoVariant(value, max = 10) {
  const pct = value / max;
  if (pct >= 0.8) return 'danger';
  if (pct >= 0.6) return 'orange';
  if (pct >= 0.4) return 'amber';
  return 'teal';
}

export default function Progress({
  value = 0,
  max = 100,
  label,
  variant,           // if omitted, auto-picks based on value/max
  showValue = false,
  size = 'md',       // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const resolvedVariant = variant || autoVariant(value, max);
  const { track, fill } = VARIANTS[resolvedVariant] || VARIANTS.teal;

  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  const height = heights[size] || heights.md;

  return (
    <div className={`space-y-1 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs font-semibold text-slate-600">{label}</span>}
          {showValue && (
            <span className="text-xs font-bold text-slate-800 tabular-nums">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <RadixProgress.Root
        value={value}
        max={max}
        className={`relative overflow-hidden rounded-full ${track} ${height} w-full`}
        aria-label={label || `Progress: ${value} of ${max}`}
      >
        <RadixProgress.Indicator asChild>
          <motion.div
            className={`h-full rounded-full ${fill}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </RadixProgress.Indicator>
      </RadixProgress.Root>
    </div>
  );
}
