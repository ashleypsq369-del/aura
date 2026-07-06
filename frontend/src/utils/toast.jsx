/**
 * toast.jsx - Premium notification toasts for ProjectAura
 * =========================================================
 * Design system: Linear / Vercel / Stripe inspired
 * - Clean pill shape - no garish square icon blocks
 * - Inline SVG icon + message in one row
 * - Subtle left colour accent line
 * - Smooth slide-in from right, fade out
 * - Accessible: aria-live, dismiss button, keyboard navigable
 */

import { toast as hotToast } from 'react-hot-toast';

// -- Icon SVGs - 14px, minimal ---------------------------------------------
const ICONS = {
  success: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7l3 3 6-6" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 3l8 8M11 3L3 11" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  warning: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 5.5v3M7 10v.5" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 6.5v4M7 4v.5" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  default: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="2" fill="#9ca3af"/>
    </svg>
  ),
};

// -- Left accent colours ---------------------------------------------------
const ACCENT = {
  success: '#16a34a',
  error:   '#dc2626',
  warning: '#d97706',
  info:    '#2563eb',
  default: '#9ca3af',
};

// -- Icon dot bg colours ---------------------------------------------------
const ICON_BG = {
  success: '#f0fdf4',
  error:   '#fef2f2',
  warning: '#fffbeb',
  info:    '#eff6ff',
  default: '#f9fafb',
};

// -- Shared container  --  dynamically picks dark/light bg -------------------
function getContainerStyle() {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  return {
    background:   isDark ? '#1e293b' : '#ffffff',
    borderRadius: '8px',
    padding:      '0',
    boxShadow:    isDark
      ? '0 2px 8px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.08)'
      : '0 1px 4px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)',
    maxWidth:     '320px',
    minWidth:     '220px',
    overflow:     'hidden',
  };
}
const CONTAINER = {
  background:   '#ffffff',
  borderRadius: '8px',
  padding:      '0',
  boxShadow:    '0 1px 4px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)',
  maxWidth:     '320px',
  minWidth:     '220px',
  overflow:     'hidden',
};

// -- Dismiss icon ----------------------------------------------------------
const DismissIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// -- Normalise message (handles FastAPI 422 arrays) ------------------------
function normalise(msg) {
  if (typeof msg === 'string') return msg;
  if (Array.isArray(msg)) {
    return msg.map(e => {
      const field = Array.isArray(e.loc) ? e.loc.filter(l => l !== 'body').join('  ') : '';
      return field ? `${field}: ${e.msg}` : e.msg;
    }).join(' · ');
  }
  if (msg && typeof msg === 'object') {
    return msg.message || msg.detail || msg.msg || JSON.stringify(msg);
  }
  return String(msg ?? 'An error occurred');
}

// -- Toast content ---------------------------------------------------------
// eslint-disable-next-line react-refresh/only-export-components
function ToastContent({ t, message, type = 'default', title }) {
  const accent = ACCENT[type] || ACCENT.default;
  const iconBg = ICON_BG[type] || ICON_BG.default;
  const icon   = ICONS[type]  || ICONS.default;
  // Detect dark mode at render time
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const cardBg      = isDark ? '#1e293b' : '#ffffff';
  const titleColor  = isDark ? '#f1f5f9' : '#0f172a';
  const bodyColor   = isDark ? (title ? '#94a3b8' : '#cbd5e1') : (title ? '#64748b' : '#1e293b');
  const iconBgFinal = isDark ? 'rgba(255,255,255,0.08)' : iconBg;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display:   'flex',
        alignItems: 'center',
        width:      '100%',
        animation:  t.visible
          ? 'toast-in 0.2s cubic-bezier(0.22,1,0.36,1) both'
          : 'toast-out 0.15s ease-in both',
      }}
    >
      {/* Left accent bar - thin, 3px */}
      <div style={{ width: '3px', background: accent, alignSelf: 'stretch', flexShrink: 0 }} />

      {/* Icon dot - 28px, no border, no circle outline */}
      <div style={{
        width:          '28px',
        height:         '28px',
        borderRadius:   '6px',
        background:     iconBgFinal,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
        margin:         '0 10px 0 10px',
      }}>
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, padding: '9px 8px 9px 0', minWidth: 0 }}>
        {title && (
          <p style={{ margin: '0 0 1px', fontSize: '12px', fontWeight: '700', color: titleColor, lineHeight: 1.3 }}>
            {title}
          </p>
        )}
        <p style={{
          margin:     0,
          fontSize:   '12.5px',
          fontWeight: title ? '400' : '500',
          color:      bodyColor,
          lineHeight: '1.4',
        }}>
          {message}
        </p>
      </div>

      {/* Dismiss - clean × */}
      <button
        onClick={() => hotToast.dismiss(t.id)}
        aria-label="Dismiss"
        style={{
          flexShrink: 0,
          background: 'none',
          border:     'none',
          cursor:     'pointer',
          color:      '#d1d5db',
          padding:    '0 10px',
          alignSelf:  'stretch',
          display:    'flex',
          alignItems: 'center',
          fontSize:   '14px',
          transition: 'color 0.1s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#6b7280'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#d1d5db'; }}
      >
        <DismissIcon />
      </button>
    </div>
  );
}

// -- Inject keyframe animations once --------------------------------------
if (typeof document !== 'undefined' && !document.getElementById('toast-keyframes')) {
  const style = document.createElement('style');
  style.id = 'toast-keyframes';
  style.textContent = `
    @keyframes toast-in {
      from { opacity: 0; transform: translateX(12px) scale(0.97); }
      to   { opacity: 1; transform: translateX(0)    scale(1);    }
    }
    @keyframes toast-out {
      from { opacity: 1; transform: scale(1); }
      to   { opacity: 0; transform: scale(0.95); }
    }
  `;
  document.head.appendChild(style);
}

// -- Factory ---------------------------------------------------------------
function show(message, type, duration = 3500, opts = {}) {
  const safeMsg = normalise(message);
  return hotToast(
    (t) => <ToastContent t={t} message={safeMsg} type={type} title={opts.title} />,
    { duration, style: getContainerStyle(), ...opts }
  );
}

// -- Public API ------------------------------------------------------------
const toast = {
  success: (msg, opts = {}) => show(msg, 'success', opts.duration ?? 3500, opts),
  error:   (msg, opts = {}) => show(msg, 'error',   opts.duration ?? 6000, opts),
  info:    (msg, opts = {}) => show(msg, 'info',    opts.duration ?? 4000, opts),
  warning: (msg, opts = {}) => show(msg, 'warning', opts.duration ?? 5000, opts),
  show:    (msg, opts = {}) => show(msg, 'default', opts.duration ?? 4000, opts),

  loading: (msg, opts = {}) =>
    hotToast.loading(msg, { style: { ...getContainerStyle() }, ...opts }),

  dismiss:    (id) => hotToast.dismiss(id),
  dismissAll: ()   => hotToast.dismiss(),

  promise: (promise, msgs, opts = {}) =>
    hotToast.promise(promise, msgs, { style: { ...getContainerStyle() }, ...opts }),
};

export default toast;
