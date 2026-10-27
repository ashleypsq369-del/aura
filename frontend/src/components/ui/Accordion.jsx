/**
 * Accordion.jsx - Physics-based expandable section using React Spring
 * ==================================================================
 * Natural, fluid expand/collapse for patient detail sections.
 * Reduces abrupt layout jumps - important for anxious/elderly users.
 *
 * Usage:
 *   <Accordion title="Vital Signs" defaultOpen>
 *     <VitalSignsTable />
 *   </Accordion>
 *
 *   <Accordion title="Medications" badge={medCount}>
 *     <MedList />
 *   </Accordion>
 */

import { useState } from 'react';
import { useSpring, animated, config } from '@react-spring/web';
import { ChevronDown } from 'lucide-react';

export default function Accordion({
  title,
  children,
  defaultOpen = false,
  badge,           // optional count badge
  icon: Icon,
  iconColor = 'text-teal-600',
  iconBg    = 'bg-teal-50',
  className = '',
}) {
  const [open, setOpen] = useState(defaultOpen);

  // Physics-based spring for the chevron rotation
  const chevronStyle = useSpring({
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
    config: config.stiff,
  });

  // Height animation - expand/collapse
  const contentStyle = useSpring({
    opacity:   open ? 1 : 0,
    maxHeight: open ? 2000 : 0,
    config:    { tension: 280, friction: 26 },
  });

  return (
    <div className={`bg-slate-50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header - clickable trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset"
      >
        {Icon && (
          <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={16} className={iconColor} />
          </div>
        )}
        <span className="flex-1 font-semibold text-slate-900 text-sm">{title}</span>
        {badge != null && (
          <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[11px] font-bold rounded-full">
            {badge}
          </span>
        )}
        <animated.span style={chevronStyle} className="flex-shrink-0 text-slate-400">
          <ChevronDown size={18} />
        </animated.span>
      </button>

      {/* Animated content */}
      <animated.div style={{ ...contentStyle, overflow: 'hidden' }}>
        <div className="px-5 pb-5 pt-1">
          {children}
        </div>
      </animated.div>
    </div>
  );
}
