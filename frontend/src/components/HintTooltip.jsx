/**
 * HintTooltip.jsx
 * Wraps any button/section with:
 *  - A pulsing teal dot indicator (shows there's a hint)
 *  - A tooltip on hover showing what the element does
 *  - Optional avatar pose shown in the tooltip
 *
 * Usage:
 *   <HintTooltip hint="Click to view patient risk predictions">
 *     <button>AI Insights</button>
 *   </HintTooltip>
 *
 * Props:
 *   hint        - string: the hint text
 *   position    - 'top' | 'bottom' | 'left' | 'right' (default: 'top')
 *   dot         - boolean: show the pulsing dot (default: true)
 *   dotColor    - string: dot color (default: teal)
 *   alwaysShow  - boolean: keep tooltip visible always (default: false)
 *   delay       - number: ms before tooltip appears (default: 300)
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

const POSITIONS = {
  top:    { tooltip: { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' }, tail: { top: '100%', left: '50%', transform: 'translateX(-50%)', borderColor: '#0d9488 transparent transparent transparent', borderWidth: '5px 5px 0 5px' } },
  bottom: { tooltip: { top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' },    tail: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', borderColor: 'transparent transparent #0d9488 transparent', borderWidth: '0 5px 5px 5px' } },
  left:   { tooltip: { right: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' },   tail: { left: '100%', top: '50%', transform: 'translateY(-50%)', borderColor: 'transparent transparent transparent #0d9488', borderWidth: '5px 0 5px 5px' } },
  right:  { tooltip: { left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' },    tail: { right: '100%', top: '50%', transform: 'translateY(-50%)', borderColor: 'transparent #0d9488 transparent transparent', borderWidth: '5px 5px 5px 0' } },
};

export default function HintTooltip({
  children,
  hint,
  position = 'top',
  dot = true,
  dotColor = '#0d9488',
  alwaysShow = false,
  delay = 300,
  className = '',
}) {
  const [visible, setVisible] = useState(alwaysShow);
  const timerRef = useRef(null);
  const pos = POSITIONS[position] || POSITIONS.top;

  const show = () => {
    if (alwaysShow) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(true), delay);
  };
  const hide = () => {
    if (alwaysShow) return;
    clearTimeout(timerRef.current);
    setVisible(false);
  };

  if (!hint) return <>{children}</>;

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {/* Pulsing dot indicator */}
      {dot && !alwaysShow && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center"
          style={{ zIndex: 10 }}
          aria-hidden="true"
        >
          <span
            className="absolute inline-flex rounded-full animate-ping"
            style={{ width: 10, height: 10, background: dotColor, opacity: 0.4 }}
          />
          <span
            className="relative inline-flex rounded-full"
            style={{ width: 7, height: 7, background: dotColor }}
          />
        </span>
      )}

      {/* Tooltip */}
      <AnimatePresence>
        {(visible || alwaysShow) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="absolute z-[9999] pointer-events-none"
            style={pos.tooltip}
          >
            <div
              className="flex items-start gap-1.5 px-3 py-2 rounded-xl shadow-xl text-left whitespace-nowrap"
              style={{
                background: '#0d3b36',
                border: '1px solid rgba(255,255,255,0.1)',
                maxWidth: 240,
                whiteSpace: 'normal',
                minWidth: 120,
              }}
            >
              <HelpCircle size={11} className="flex-shrink-0 mt-0.5" style={{ color: '#2dd4bf' }} />
              <p className="text-[11px] font-medium leading-snug" style={{ color: '#e2e8f0' }}>
                {hint}
              </p>
            </div>
            {/* Tail */}
            <span
              className="absolute"
              style={{
                ...pos.tail,
                borderStyle: 'solid',
                width: 0,
                height: 0,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
