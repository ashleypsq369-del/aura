/**
 * PageHeader — full-width banner with frosted glass stat strip
 *
 * Layout:
 *   TOP    — icon + title + subtitle + action buttons (left-aligned)
 *   BOTTOM — frosted glass pill strip with Services-style stat bars
 *
 * Each stat pill: [colored 3px bar] [bold number] [small label]
 * The strip sits at the bottom of the header image, frosted glass backdrop.
 * Each page keeps its own background image.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { MESSAGES } from '../data/inspirationalMessages';

const ROUTE_GRADIENTS = {
  '/dashboard':          'linear-gradient(135deg,#0d9488,#0891b2)',
  '/patients':           'linear-gradient(135deg,#1d4ed8,#4338ca)',
  '/alerts':             'linear-gradient(135deg,#e11d48,#dc2626)',
  '/ai-insights':        'linear-gradient(135deg,#7c3aed,#6d28d9)',
  '/medications':        'linear-gradient(135deg,#be123c,#e11d48)',
  '/appointments':       'linear-gradient(135deg,#1d4ed8,#0891b2)',
  '/caregivers':         'linear-gradient(135deg,#059669,#0d9488)',
  '/community':          'linear-gradient(135deg,#db2777,#7c3aed)',
  '/community-hub':      'linear-gradient(135deg,#db2777,#7c3aed)',
  '/resources':          'linear-gradient(135deg,#0d9488,#059669)',
  '/my-journey':         'linear-gradient(135deg,#d97706,#ea580c)',
  '/memory-vault':       'linear-gradient(135deg,#9d174d,#db2777)',
  '/settings':           'linear-gradient(135deg,#4338ca,#7c3aed)',
  '/profile':            'linear-gradient(135deg,#0891b2,#0d9488)',
  '/messages':           'linear-gradient(135deg,#0891b2,#0d9488)',
  '/my-space':           'linear-gradient(135deg,#059669,#0d9488)',
  '/my-legacy-access':   'linear-gradient(135deg,#9d174d,#7c3aed)',
  '/legacy-setup':       'linear-gradient(135deg,#7c3aed,#4338ca)',
  '/continuity-bridge':  'linear-gradient(135deg,#0d9488,#0891b2)',
  '/journal':            'linear-gradient(135deg,#4338ca,#0891b2)',
  '/wellness-checkin':   'linear-gradient(135deg,#059669,#0d9488)',
  '/care-settings':      'linear-gradient(135deg,#1d4ed8,#0891b2)',
  '/admin':              'linear-gradient(135deg,#1e293b,#334155)',
  '/medical-knowledge':  'linear-gradient(135deg,#0891b2,#0d9488)',
  '/assessments':        'linear-gradient(135deg,#7c3aed,#4338ca)',
  '/shift-handover':     'linear-gradient(135deg,#1d4ed8,#0891b2)',
  '/daily-care-log':     'linear-gradient(135deg,#059669,#0d9488)',
  '/residential-log':    'linear-gradient(135deg,#7c3aed,#4338ca)',
  '/pre-clinic':         'linear-gradient(135deg,#0891b2,#059669)',
  '/bereavement-support':'linear-gradient(135deg,#9d174d,#7c3aed)',
};

function getDailyMessage() {
  const d   = new Date();
  const idx = (d.getFullYear() * 365 + d.getMonth() * 31 + d.getDate()) % MESSAGES.length;
  return MESSAGES[idx] || '';
}

export default function PageHeader({
  image,
  title,
  subtitle,
  icon: Icon,
  children,           // action buttons — rendered top-right
  compact = false,
  gradient,
  stats,              // [{ label, value, color?, pulse?, onClick? }]
}) {
  const location   = useLocation();
  const dailyQuote = useMemo(() => getDailyMessage(), []);

  const resolvedGradient = gradient
    || Object.entries(ROUTE_GRADIENTS).find(([k]) => location.pathname.startsWith(k))?.[1]
    || 'linear-gradient(135deg,#0d9488,#0891b2)';

  const hasStats = stats?.length > 0;

  // Height: taller when stats present so strip doesn't crowd the title
  const height = compact ? 120 : hasStats ? 210 : 160;

  return (
    <div
      className="img-card relative w-full overflow-hidden"
      style={{ height }}
      role="banner"
    >
      {/* Gradient fallback */}
      <div
        className="img-card-bg absolute inset-0"
        style={{ background: resolvedGradient, zIndex: 0 }}
      />

      {/* Background photo — each page passes its own image */}
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

      {/* Dark overlay — strong enough for WCAG AA contrast on white text */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.40) 60%, rgba(0,0,0,0.70) 100%)',
          zIndex: 2,
        }}
      />

      {/* Kente accent strip */}
      <div
        className="kente-strip absolute inset-x-0 bottom-0 pointer-events-none"
        style={{ zIndex: 4 }}
      />

      {/* ── Content ───────────────────────────────────────────────── */}
      <div
        className="relative h-full flex flex-col justify-between px-4 sm:px-6 md:px-8"
        style={{ zIndex: 3, paddingTop: 20, paddingBottom: hasStats ? 0 : 20 }}
      >
        {/* TOP: title row + action buttons */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.26 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}
          >
            {Icon && (
              <div
                aria-hidden="true"
                style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon size={20} style={{ color: '#ffffff' }} />
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              {/* Title — always pure white, no design-system gradient-text override */}
              <h1
                className="img-heading"
                style={{
                  fontSize: 'clamp(17px,2.8vw,24px)',
                  fontWeight: 800,
                  color: '#ffffff',
                  WebkitTextFillColor: '#ffffff',
                  backgroundImage: 'none',
                  lineHeight: 1.2,
                  margin: 0,
                  textShadow: '0 1px 8px rgba(0,0,0,0.7)',
                }}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.88)',
                    margin: '3px 0 0',
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </motion.div>

          {/* Action buttons */}
          {children && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {children}
            </div>
          )}
        </div>

        {/* Daily quote — shown only when no stats */}
        {!hasStats && dailyQuote && (
          <p
            style={{
              fontSize: 12,
              fontStyle: 'italic',
              color: 'rgba(45,212,191,0.85)',
              margin: 0,
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
              letterSpacing: '0.01em',
            }}
            aria-label="Daily motivational quote"
          >
            {dailyQuote}
          </p>
        )}

        {/* ── FROSTED GLASS STAT STRIP — bottom of image ────────────
            Services DNA: horizontal pill strip, frosted glass backdrop,
            each stat has a colored 3px left-bar + bold number + tiny label.
            Sits flush at the bottom edge of the header.
        ─────────────────────────────────────────────────────────── */}
        {hasStats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.18 }}
            style={{
              display:              'flex',
              alignItems:           'stretch',
              alignSelf:            'flex-start',
              gap:                  0,
              /* Frosted glass pill */
              background:           'rgba(0,0,0,0.38)',
              backdropFilter:       'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius:         '12px 12px 0 0',   // flat bottom — flush with header edge
              border:               '1px solid rgba(255,255,255,0.15)',
              borderBottom:         'none',
              overflow:             'hidden',
              marginBottom:         0,
            }}
            role="region"
            aria-label="Page statistics"
          >
            {stats.map(({ label, value, color = '#2dd4bf', pulse, onClick }, i) => (
              <button
                key={label}
                onClick={onClick}
                disabled={!onClick}
                aria-label={`${label}: ${value}`}
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        10,
                  padding:    '10px 20px',
                  background: 'transparent',
                  border:     'none',
                  borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.10)' : 'none',
                  cursor:     onClick ? 'pointer' : 'default',
                  outline:    'none',
                  transition: 'background 0.15s',
                  minWidth:   80,
                }}
                onMouseEnter={e => { if (onClick) e.currentTarget.style.background = `${color}18`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                onFocus={e => { e.currentTarget.style.outline = `2px solid ${color}`; e.currentTarget.style.outlineOffset = '-2px'; }}
                onBlur={e  => { e.currentTarget.style.outline = 'none'; }}
              >
                {/* Colored vertical accent bar — Services signature */}
                <div
                  aria-hidden="true"
                  style={{
                    width:        3,
                    height:       32,
                    borderRadius: 2,
                    background:   color,
                    flexShrink:   0,
                    boxShadow:    `0 0 10px ${color}99`,
                  }}
                />

                {/* Value + label */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                  {/* Value row — optionally with pulse dot */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {pulse && (
                      <span
                        aria-hidden="true"
                        style={{
                          width:        7,
                          height:       7,
                          borderRadius: '50%',
                          background:   color,
                          animation:    'pulse 2s infinite',
                          flexShrink:   0,
                          boxShadow:    `0 0 0 2px ${color}40`,
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontSize:           18,
                        fontWeight:         900,
                        color:              '#ffffff',
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight:         1,
                        letterSpacing:      '-0.02em',
                      }}
                    >
                      {value}
                    </span>
                  </div>
                  {/* Label */}
                  <span
                    style={{
                      fontSize:   10,
                      fontWeight: 500,
                      color:      'rgba(255,255,255,0.50)',
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
