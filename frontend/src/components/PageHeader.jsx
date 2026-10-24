/**
 * PageHeader — full-width banner for page tops
 *
 * Replaces the auto-advancing 6-second ticker with a single calm quote
 * that changes once per day (deterministic, same for all users on the same day).
 * No animations, no blinking, no distraction — just a subtle italic line.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { MESSAGES } from '../data/inspirationalMessages';

// Per-route gradient palette
const ROUTE_GRADIENTS = {
  '/dashboard':          'linear-gradient(135deg, #0d9488, #0891b2)',
  '/patients':           'linear-gradient(135deg, #1d4ed8, #4338ca)',
  '/alerts':             'linear-gradient(135deg, #e11d48, #dc2626)',
  '/ai-insights':        'linear-gradient(135deg, #7c3aed, #6d28d9)',
  '/medications':        'linear-gradient(135deg, #be123c, #e11d48)',
  '/appointments':       'linear-gradient(135deg, #1d4ed8, #0891b2)',
  '/caregivers':         'linear-gradient(135deg, #059669, #0d9488)',
  '/community':          'linear-gradient(135deg, #db2777, #7c3aed)',
  '/community-hub':      'linear-gradient(135deg, #db2777, #7c3aed)',
  '/resources':          'linear-gradient(135deg, #0d9488, #059669)',
  '/my-journey':         'linear-gradient(135deg, #d97706, #ea580c)',
  '/memory-vault':       'linear-gradient(135deg, #9d174d, #db2777)',
  '/settings':           'linear-gradient(135deg, #4338ca, #7c3aed)',
  '/profile':            'linear-gradient(135deg, #0891b2, #0d9488)',
  '/messages':           'linear-gradient(135deg, #0891b2, #0d9488)',
  '/my-space':           'linear-gradient(135deg, #059669, #0d9488)',
  '/my-legacy-access':   'linear-gradient(135deg, #9d174d, #7c3aed)',
  '/legacy-setup':       'linear-gradient(135deg, #7c3aed, #4338ca)',
  '/continuity-bridge':  'linear-gradient(135deg, #0d9488, #0891b2)',
  '/journal':            'linear-gradient(135deg, #4338ca, #0891b2)',
  '/wellness-checkin':   'linear-gradient(135deg, #059669, #0d9488)',
  '/care-settings':      'linear-gradient(135deg, #1d4ed8, #0891b2)',
  '/admin':              'linear-gradient(135deg, #1e293b, #334155)',
  '/medical-knowledge':  'linear-gradient(135deg, #0891b2, #0d9488)',
  '/assessments':        'linear-gradient(135deg, #7c3aed, #4338ca)',
  '/shift-handover':     'linear-gradient(135deg, #1d4ed8, #0891b2)',
  '/daily-care-log':     'linear-gradient(135deg, #059669, #0d9488)',
  '/residential-log':    'linear-gradient(135deg, #7c3aed, #4338ca)',
  '/pre-clinic':         'linear-gradient(135deg, #0891b2, #059669)',
  '/bereavement-support':'linear-gradient(135deg, #9d174d, #7c3aed)',
};

// One message per day — stable across all sessions and users
function getDailyMessage() {
  const d = new Date();
  const idx = (d.getFullYear() * 365 + d.getMonth() * 31 + d.getDate()) % MESSAGES.length;
  return MESSAGES[idx] || '';
}

export default function PageHeader({
  image, title, subtitle, icon: Icon,
  children, compact = false, gradient,
}) {
  const location = useLocation();

  const resolvedGradient = gradient
    || Object.entries(ROUTE_GRADIENTS).find(([k]) => location.pathname.startsWith(k))?.[1]
    || 'linear-gradient(135deg, #0d9488, #0891b2)';

  // Stable — only recomputes when the calendar day changes
  const dailyQuote = useMemo(() => getDailyMessage(), []);

  return (
    <div className={`img-card relative w-full overflow-hidden ${compact ? 'h-32' : 'h-40'}`}>

      {/* Fallback gradient background */}
      <div className="img-card-bg absolute inset-0" style={{ background: resolvedGradient, zIndex: 0 }} />

      {/* Photo */}
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

      {/* Dark overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.20) 100%)',
          zIndex: 2,
        }}
      />

      {/* Bottom accent line */}
      <div
        className="absolute inset-0 border-b-2 pointer-events-none"
        style={{ borderColor: 'rgba(45,212,191,0.65)', zIndex: 3 }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center px-3 sm:px-6 md:px-8" style={{ zIndex: 4 }}>

        {/* Title + action buttons row */}
        <div className="flex items-center justify-between gap-3">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 min-w-0"
          >
            {Icon && (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-white" />
              </div>
            )}
            <div className="min-w-0">
              <h1
                className="img-heading text-lg sm:text-xl md:text-2xl font-bold leading-tight text-white truncate"
                style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className="text-xs md:text-sm mt-0.5 font-medium truncate"
                  style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </motion.div>

          {children && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {children}
            </div>
          )}
        </div>

        {/* Daily quote — static, one-liner, no animation loop */}
        {dailyQuote && (
          <p
            className="mt-2 text-xs sm:text-[13px] italic truncate select-none"
            style={{
              color: 'rgba(45,212,191,0.85)',
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              letterSpacing: '0.01em',
            }}
            aria-label="Daily quote"
          >
            {dailyQuote}
          </p>
        )}
      </div>
    </div>
  );
}
