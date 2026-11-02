/**
 * PageHeader — full-width banner for page tops
 *
 * Design DNA from Services:
 *  - Stats rendered inside the header image as a horizontal pill strip
 *  - Each stat: colored left-bar accent + bold number + small label
 *    (same as Services hero right-panel stat strip)
 *  - Frosted glass backdrop on the stat row
 *  - Title always clean white — no gradient text
 *  - Height auto-expands when stats are present
 *
 * Props:
 *   image     — background photo URL
 *   title     — page heading
 *   subtitle  — one-line description
 *   icon      — Lucide icon component
 *   children  — action buttons (top-right slot)
 *   compact   — shorter height
 *   gradient  — override per-route gradient
 *   stats     — [{ label, value, icon?, color?, onClick?, pulse? }]
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { MESSAGES } from '../data/inspirationalMessages';

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

function getDailyMessage() {
  const d = new Date();
  const idx = (d.getFullYear() * 365 + d.getMonth() * 31 + d.getDate()) % MESSAGES.length;
  return MESSAGES[idx] || '';
}

export default function PageHeader({
  image, title, subtitle, icon: Icon,
  children, compact = false, gradient,
  stats,
}) {
  const location   = useLocation();
  const dailyQuote = useMemo(() => getDailyMessage(), []);

  const resolvedGradient = gradient
    || Object.entries(ROUTE_GRADIENTS).find(([k]) => location.pathname.startsWith(k))?.[1]
    || 'linear-gradient(135deg, #0d9488, #0891b2)';

  const hasStats = stats?.length > 0;

  /* Height grows when stats are present */
  const heightClass = compact
    ? 'h-32'
    : hasStats
    ? 'h-56 sm:h-60'
    : 'h-40';

  return (
    <div
      className={`img-card relative w-full overflow-hidden ${heightClass}`}
      role="banner"
    >
      {/* Gradient fallback */}
      <div
        className="img-card-bg absolute inset-0"
        style={{ background: resolvedGradient, zIndex: 0 }}
      />

      {/* Background photo */}
      {image && (
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ zIndex: 1 }}
          loading="lazy"
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
      )}

      {/* Dark overlay — heavier on left for text legibility (WCAG AA ≥4.5:1) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: hasStats
            ? 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.25) 100%)'
            : 'linear-gradient(to right, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.20) 100%)',
          zIndex: 2,
        }}
      />

      {/* Kente strip at bottom */}
      <div
        className="kente-strip absolute inset-x-0 bottom-0 pointer-events-none"
        style={{ zIndex: 3 }}
      />

      {/* ── Content ── */}
      <div
        className="relative h-full flex flex-col justify-between px-4 sm:px-6 md:px-8 py-4 sm:py-5"
        style={{ zIndex: 4 }}
      >
        {/* Top row: title + action buttons */}
        <div className="flex items-start justify-between gap-3">
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28 }}
            className="flex items-center gap-3 min-w-0"
          >
            {Icon && (
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
                aria-hidden="true"
              >
                <Icon size={20} style={{ color: '#fff' }} />
              </div>
            )}
            <div className="min-w-0">
              {/* Title — always pure white, no gradient text */}
              <h1
                className="img-heading text-lg sm:text-xl md:text-2xl font-bold leading-tight truncate"
                style={{
                  color: '#ffffff',
                  textShadow: '0 1px 8px rgba(0,0,0,0.7)',
                  WebkitTextFillColor: '#ffffff',
                }}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className="text-xs sm:text-sm mt-0.5 font-medium"
                  style={{
                    color: 'rgba(255,255,255,0.88)',
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </motion.div>

          {/* Action buttons — Services gradient style */}
          {children && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {children}
            </div>
          )}
        </div>

        {/* Daily quote — only shown when no stats */}
        {!hasStats && dailyQuote && (
          <p
            className="text-xs sm:text-[13px] italic truncate select-none"
            style={{
              color: 'rgba(45,212,191,0.85)',
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              letterSpacing: '0.01em',
            }}
            aria-label="Daily motivational quote"
          >
            {dailyQuote}
          </p>
        )}

        {/* ── Stat strip — Services DNA ────────────────────────────────────
            Frosted glass backdrop row with individual stats.
            Each stat uses the Services vertical-bar accent pattern:
            [colored 3px bar] [bold number] [small label]
            Clickable stats get a hover glow matching their accent color.
        ──────────────────────────────────────────────────────────────── */}
        {hasStats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.18 }}
            style={{
              display: 'inline-flex',
              alignItems: 'stretch',
              gap: 0,
              background: 'rgba(0,0,0,0.38)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.14)',
              overflow: 'hidden',
              maxWidth: '100%',
            }}
            role="region"
            aria-label="Page statistics"
          >
            {stats.map(({ label, value, icon: StatIcon, color = '#2dd4bf', onClick, pulse }, i) => (
              <button
                key={label}
                onClick={onClick}
                disabled={!onClick}
                aria-label={`${label}: ${value}`}
                style={{
                  display:     'flex',
                  alignItems:  'center',
                  gap:         10,
                  padding:     '10px 18px',
                  background:  'transparent',
                  border:      'none',
                  borderLeft:  i > 0 ? '1px solid rgba(255,255,255,0.10)' : 'none',
                  cursor:      onClick ? 'pointer' : 'default',
                  transition:  'background 0.18s',
                  outline:     'none',
                  minWidth:    0,
                  flexShrink:  0,
                }}
                onMouseEnter={e => {
                  if (onClick) e.currentTarget.style.background = `${color}22`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                }}
                onFocus={e  => { e.currentTarget.style.outline = `2px solid ${color}`; e.currentTarget.style.outlineOffset = '-2px'; }}
                onBlur={e   => { e.currentTarget.style.outline = 'none'; }}
              >
                {/* Colored left-bar accent — Services DNA */}
                <div
                  aria-hidden="true"
                  style={{
                    width:        3,
                    height:       34,
                    borderRadius: 2,
                    background:   color,
                    flexShrink:   0,
                    boxShadow:    `0 0 8px ${color}80`,
                  }}
                />

                {/* Value + label */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {/* Pulse dot for urgent values */}
                    {pulse && (
                      <span
                        aria-hidden="true"
                        style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: color,
                          animation: 'pulse 2s infinite',
                          flexShrink: 0,
                          boxShadow: `0 0 0 2px ${color}40`,
                        }}
                      />
                    )}
                    {StatIcon && !pulse && (
                      <StatIcon size={12} style={{ color, flexShrink: 0 }} aria-hidden="true" />
                    )}
                    <span
                      style={{
                        fontSize:           17,
                        fontWeight:         900,
                        color:              '#ffffff',
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight:         1,
                        letterSpacing:      '-0.01em',
                      }}
                    >
                      {value}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize:   10,
                      fontWeight: 600,
                      color:      'rgba(255,255,255,0.55)',
                      whiteSpace: 'nowrap',
                      lineHeight: 1,
                    }}
                  >
                    {label}
                  </span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
