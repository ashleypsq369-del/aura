/**
 * Tip.jsx - Reusable rich tooltip wrapper
 *
 * Usage:
 *   <Tip text="Go to your dashboard">
 *     <button>Dashboard</button>
 *   </Tip>
 *
 *   <Tip text="Your pain score from last assessment" side="right">
 *     <span>Pain: 7/10</span>
 *   </Tip>
 *
 * Props:
 *   text     - tooltip string (required)
 *   side     - 'top' (default) | 'bottom' | 'left' | 'right'
 *   delay    - ms before showing (default 400)
 *   children - the element to wrap
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tip({ text, side = 'top', delay = 400, children, className = '' }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  if (!text) return children;

  const positions = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrows = {
    top:    'top-full left-1/2 -translate-x-1/2 border-t-slate-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900',
    left:   'left-full top-1/2 -translate-y-1/2 border-l-slate-900',
    right:  'right-full top-1/2 -translate-y-1/2 border-r-slate-900',
  };

  const motionProps = {
    top:    { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 4 } },
    bottom: { initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 } },
    left:   { initial: { opacity: 0, x: 4 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 4 } },
    right:  { initial: { opacity: 0, x: -4 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -4 } },
  };

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.span
            role="tooltip"
            {...motionProps[side]}
            transition={{ duration: 0.12 }}
            className={`
              absolute z-[9999] pointer-events-none
              ${positions[side]}
              bg-slate-900 text-white text-[11px] font-semibold
              px-2.5 py-1.5 rounded-lg shadow-xl
              whitespace-nowrap max-w-[240px]
              leading-snug
            `}
            style={{ whiteSpace: 'pre-wrap', maxWidth: '240px' }}
          >
            {text}
            {/* Arrow */}
            <span className={`absolute w-0 h-0 border-4 border-transparent ${arrows[side]}`} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
