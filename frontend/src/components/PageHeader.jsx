/**
 * PageHeader  --  full-width banner for page tops
 * Includes sliding inspirational message ticker (444 messages)
 * Click ticker to advance manually; auto-advances every 6s and on route change
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { MESSAGES } from '../data/inspirationalMessages';

// Per-route gradient palette
const ROUTE_GRADIENTS = {
  '/dashboard':         'linear-gradient(135deg, #0d9488, #0891b2)',
  '/patients':          'linear-gradient(135deg, #1d4ed8, #4338ca)',
  '/alerts':            'linear-gradient(135deg, #e11d48, #dc2626)',
  '/ai-insights':       'linear-gradient(135deg, #7c3aed, #6d28d9)',
  '/medications':       'linear-gradient(135deg, #be123c, #e11d48)',
  '/appointments':      'linear-gradient(135deg, #1d4ed8, #0891b2)',
  '/caregivers':        'linear-gradient(135deg, #059669, #0d9488)',
  '/community':         'linear-gradient(135deg, #db2777, #7c3aed)',
  '/community-hub':     'linear-gradient(135deg, #db2777, #7c3aed)',
  '/resources':         'linear-gradient(135deg, #0d9488, #059669)',
  '/my-journey':        'linear-gradient(135deg, #d97706, #ea580c)',
  '/memory-vault':      'linear-gradient(135deg, #9d174d, #db2777)',
  '/settings':          'linear-gradient(135deg, #4338ca, #7c3aed)',
  '/profile':           'linear-gradient(135deg, #0891b2, #0d9488)',
  '/messages':          'linear-gradient(135deg, #0891b2, #0d9488)',
  '/my-space':          'linear-gradient(135deg, #059669, #0d9488)',
  '/my-legacy-access':  'linear-gradient(135deg, #9d174d, #7c3aed)',
  '/legacy-setup':      'linear-gradient(135deg, #7c3aed, #4338ca)',
  '/continuity-bridge': 'linear-gradient(135deg, #0d9488, #0891b2)',
  '/journal':           'linear-gradient(135deg, #4338ca, #0891b2)',
  '/wellness-checkin':  'linear-gradient(135deg, #059669, #0d9488)',
  '/care-settings':     'linear-gradient(135deg, #1d4ed8, #0891b2)',
  '/admin':             'linear-gradient(135deg, #1e293b, #334155)',
  '/medical-knowledge': 'linear-gradient(135deg, #0891b2, #0d9488)',
  '/assessments':       'linear-gradient(135deg, #7c3aed, #4338ca)',
  '/shift-handover':    'linear-gradient(135deg, #1d4ed8, #0891b2)',
  '/daily-care-log':    'linear-gradient(135deg, #059669, #0d9488)',
  '/residential-log':   'linear-gradient(135deg, #7c3aed, #4338ca)',
  '/pre-clinic':        'linear-gradient(135deg, #0891b2, #059669)',
  '/bereavement-support':'linear-gradient(135deg, #9d174d, #7c3aed)',
};

// Deterministic start index based on today's date so all users see the same message
function getTodayStart() {
  const d = new Date();
  return (d.getFullYear() * 365 + d.getMonth() * 31 + d.getDate()) % MESSAGES.length;
}

export default function PageHeader({ image, title, subtitle, icon: Icon, children, compact = false, gradient }) {
  const location = useLocation();

  const resolvedGradient = gradient
    || Object.entries(ROUTE_GRADIENTS).find(([k]) => location.pathname.startsWith(k))?.[1]
    || 'linear-gradient(135deg, #0d9488, #0891b2)';

  // ── Sliding message state ─────────────────────────────────────────────
  const [msgIdx, setMsgIdx] = useState(getTodayStart);
  const [visible, setVisible] = useState(true);

  const advance = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setMsgIdx(i => (i + 1) % MESSAGES.length);
      setVisible(true);
    }, 380);
  }, []);

  // Auto-advance every 6 seconds
  useEffect(() => {
    const t = setInterval(advance, 6000);
    return () => clearInterval(t);
  }, [advance]);

  // Also advance on route change so each page gets a fresh message
  const pathname = location.pathname;
  useEffect(() => {
    setMsgIdx(prev => (prev + 1) % MESSAGES.length);
    setVisible(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const currentMsg = MESSAGES[msgIdx] || '';

  return (
    <div
      className={`img-card relative w-full overflow-hidden ${compact ? 'h-32' : 'h-40'}`}
    >
      {/* Fallback gradient bg  --  hidden in dark so img shows through */}
      <div
        className="img-card-bg absolute inset-0"
        style={{ background: resolvedGradient, zIndex: 0 }}
      />
      {/* Real <img>  --  CSS-immune, always shows photo */}
      {image && (
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ zIndex: 1 }}
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}

      {/* Gradient overlay above photo */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.10) 100%)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Bottom accent line */}
      <div className="absolute inset-0 border-b-2 pointer-events-none" style={{ borderColor: 'rgba(45,212,191,0.65)', zIndex: 3 }} />

      {/* Main content  --  above photo + overlay */}
      <div className="relative h-full flex flex-col justify-center px-3 sm:px-6 md:px-8" style={{ zIndex: 4 }}>

        {/* Title row */}
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4"
          >
            {Icon && (
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center flex-shrink-0">
                <Icon size={22} className="text-white" />
              </div>
            )}
            <div>
              <h1
                className="img-heading text-xl md:text-2xl font-bold leading-tight text-white"
                style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className="text-xs md:text-sm mt-0.5 font-medium"
                  style={{
                    color: 'rgba(255,255,255,0.9)',
                    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </motion.div>

          {/* Right action buttons */}
          {children && (
            <div className="ml-auto flex items-center gap-2 flex-shrink-0">
              {children}
            </div>
          )}
        </div>

        {/* Inspirational message ticker */}
        <div
          className="mt-2.5 overflow-hidden"
          style={{ height: '1.25rem' }}
          aria-live="polite"
          aria-label="Inspirational message"
        >
          <AnimatePresence mode="wait">
            {visible && (
              <motion.p
                key={msgIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.32, ease: 'easeOut' }}
                className="text-[11px] font-medium italic truncate cursor-pointer select-none transition-colors"
                style={{
                  color: 'rgba(255,255,255,0.55)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                }}
                onClick={advance}
                title={`${currentMsg}  --  Click for next`}
              >
                {currentMsg}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
