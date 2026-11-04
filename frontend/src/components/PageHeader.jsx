/**
 * PageHeader — full-width banner
 *
 * Layout (matches Services hero exactly):
 *   ┌─────────────────────────────────────────────────────┐
 *   │  [icon] Title                    ┃ 64  ┃ 130 ┃ ... │  ← header image
 *   │         Subtitle                 ┃ Crit ┃ High┃     │
 *   │         [action buttons]         ┃     ┃     ┃     │
 *   └─────────────────────────────────────────────────────┘
 *   [ search bar / filter toolbar — children slot ]         ← below image, on page-bg
 *
 * Stats: vertical stack on the RIGHT side of the header.
 * Each stat: colored 3px bar | bold number | small label (Services DNA).
 *
 * children: rendered BELOW the image in a toolbar strip.
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
  /* action buttons slot — NOW renders below the image as a toolbar */
  children,
  compact    = false,
  gradient,
  /* stats: vertical stack on the RIGHT — Services DNA */
  stats,
}) {
  const location   = useLocation();
  const dailyQuote = useMemo(() => getDailyMessage(), []);

  const resolvedGradient = gradient
    || Object.entries(ROUTE_GRADIENTS).find(([k]) => location.pathname.startsWith(k))?.[1]
    || 'linear-gradient(135deg,#0d9488,#0891b2)';

  const hasStats    = stats?.length > 0;
  const hasChildren = !!children;

  /* Image height — compact if no stats */
  const imgHeight = compact ? 110 : hasStats ? 180 : 140;

  return (
    <div role="banner">

      {/* ══ Header image band ════════════════════════════════════════ */}
      <div
        className="img-card relative w-full overflow-hidden"
        style={{ height: imgHeight }}
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

        {/* Dark overlay — heavier on left for text, lighter on right for stats */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: hasStats
              ? 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.50) 55%, rgba(0,0,0,0.35) 100%)'
              : 'linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.42) 60%, rgba(0,0,0,0.20) 100%)',
            zIndex: 2,
          }}
        />

        {/* Kente strip */}
        <div
          className="kente-strip absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ zIndex: 4 }}
        />

        {/* ── Content: LEFT text + RIGHT stat stack ── */}
        <div
          className="relative h-full flex items-center justify-between px-4 sm:px-6 md:px-8"
          style={{ zIndex: 3, gap: 20 }}
        >
          {/* LEFT — icon + title + subtitle */}
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.26 }}
            style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12 }}
          >
            {Icon && (
              <div
                aria-hidden="true"
                style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon size={19} style={{ color: '#ffffff' }} />
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <h1
                className="img-heading"
                style={{
                  fontSize: 'clamp(16px,2.6vw,22px)',
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
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.85)',
                    margin: '3px 0 0',
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  {subtitle}
                </p>
              )}
              {/* Daily quote — only when no stats */}
              {!hasStats && dailyQuote && !compact && (
                <p
                  style={{
                    fontSize: 11,
                    fontStyle: 'italic',
                    color: 'rgba(45,212,191,0.85)',
                    margin: '5px 0 0',
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                    letterSpacing: '0.01em',
                  }}
                  aria-label="Daily motivational quote"
                >
                  {dailyQuote}
                </p>
              )}
            </div>
          </motion.div>

          {/* RIGHT — 2×2 grid of stats when 4 items, vertical stack otherwise */}
          {hasStats && (
            <motion.div
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.12 }}
              style={{
                display:             'grid',
                gridTemplateColumns: stats.length >= 4 ? '1fr 1fr' : '1fr',
                gap:                 '6px 12px',
                flexShrink:          0,
                paddingRight:        4,
                background:          'rgba(0,0,0,0.38)',
                backdropFilter:      'blur(12px)',
                WebkitBackdropFilter:'blur(12px)',
                borderRadius:        12,
                padding:             '10px 14px',
                border:              '1px solid rgba(255,255,255,0.12)',
              }}
              role="region"
              aria-label="Page statistics"
            >
              {stats.map(({ label, value, color = '#2dd4bf', pulse, onClick }) => {
                const Tag = onClick ? 'button' : 'div';
                return (
                <Tag
                  key={label}
                  onClick={onClick}
                  aria-label={`${label}: ${value}`}
                  style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        9,
                    background: 'transparent',
                    border:     'none',
                    cursor:     onClick ? 'pointer' : 'default',
                    padding:    0,
                    outline:    'none',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={onClick ? (e => { e.currentTarget.style.opacity = '0.72'; }) : undefined}
                  onMouseLeave={onClick ? (e => { e.currentTarget.style.opacity = '1'; }) : undefined}
                >
                  {/* Colored left-bar accent */}
                  <div
                    aria-hidden="true"
                    style={{
                      width:        3,
                      height:       26,
                      borderRadius: 2,
                      background:   color,
                      flexShrink:   0,
                      boxShadow:    `0 0 10px ${color}, 0 0 20px ${color}88`,
                    }}
                  />
                  {/* Number + label */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {pulse && (
                        <span
                          aria-hidden="true"
                          style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: color,
                            animation: 'pulse 2s infinite',
                            flexShrink: 0,
                            boxShadow: `0 0 0 2px ${color}35`,
                          }}
                        />
                      )}
                      <span style={{
                          fontSize: 16, fontWeight: 900, color: '#ffffff',
                          fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-0.03em',
                          textShadow: `0 0 14px ${color}, 0 1px 2px rgba(0,0,0,0.6)`,
                        }}>
                        {value}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', lineHeight: 1 }}>
                      {label}
                    </span>
                  </div>
                </Tag>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* ══ Toolbar strip — search + filters slot (below image) ═══════
          Renders children in a clean card-surface row directly under
          the header image. No more padding wrapper needed in the page.
      ══════════════════════════════════════════════════════════════ */}
      {hasChildren && (
        <div
          style={{
            background:   'var(--card-bg)',
            borderBottom: '1px solid var(--card-border)',
            boxShadow:    '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              maxWidth:   '1200px',
              margin:     '0 auto',
              padding:    '10px 20px',
              display:    'flex',
              alignItems: 'center',
              flexWrap:   'wrap',
              gap:        10,
            }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
