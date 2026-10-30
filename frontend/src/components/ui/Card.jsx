/**
 * Card.jsx — Premium healthcare card components
 * ─────────────────────────────────────────────
 * Design system: ui-ux-pro-max Healthcare App palette (No.8)
 *   Primary #0891B2  Accent #059669  Bg #ECFEFF
 *   Card: var(--card-bg)  Border: var(--card-border)
 * Style: Neumorphism/Soft UI — ui-ux-pro-max recommends for health/wellness
 * Typography: Inter body + Poppins headings (weight hierarchy)
 */
import { forwardRef } from 'react';

/* ── Base card ────────────────────────────────────────────────────── */
export const Card = forwardRef(function Card({ className = '', children, onClick, style, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={`overflow-hidden ${className}`}
      style={{
        background: 'var(--card-bg)',
        borderRadius: 14,
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--card-shadow)',
        transition: onClick ? 'box-shadow 0.18s ease, transform 0.18s ease' : undefined,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={onClick ? e => {
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(8,145,178,0.12), 0 2px 8px rgba(0,0,0,0.07)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      } : undefined}
      onMouseLeave={onClick ? e => {
        e.currentTarget.style.boxShadow = 'var(--card-shadow)';
        e.currentTarget.style.transform = 'translateY(0)';
      } : undefined}
      {...(onClick ? { role: 'button', tabIndex: 0,
        onKeyDown: e => (e.key === 'Enter' || e.key === ' ') && onClick?.(e) } : {})}
      {...props}
    >
      {children}
    </div>
  );
});

/* ── Card sections ───────────────────────────────────────────────── */
export const CardHeader = ({ className = '', children, style, ...props }) => (
  <div className={`px-5 pt-5 pb-3 ${className}`} style={style} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = '', children, as: Tag = 'h3', style, ...props }) => (
  <Tag
    className={`font-bold leading-tight ${className}`}
    style={{ color: 'var(--text-900)', fontFamily: "'Poppins', 'Inter', sans-serif", ...style }}
    {...props}
  >
    {children}
  </Tag>
);

export const CardDescription = ({ className = '', children, style, ...props }) => (
  <p
    className={`text-sm mt-0.5 leading-snug ${className}`}
    style={{ color: 'var(--text-500)', ...style }}
    {...props}
  >
    {children}
  </p>
);

export const CardContent = ({ className = '', children, style, ...props }) => (
  <div className={`px-5 pb-5 ${className}`} style={style} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className = '', children, style, ...props }) => (
  <div
    className={`px-5 py-3 flex items-center gap-3 ${className}`}
    style={{
      borderTop: '1px solid var(--card-border)',
      background: 'color-mix(in srgb, var(--card-bg) 60%, var(--page-bg))',
      borderBottomLeftRadius: 14,
      borderBottomRightRadius: 14,
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

/* ── Stat card ───────────────────────────────────────────────────── */
const STAT_V = {
  teal:    { css: 'stat-card-teal',    iBg: '#ccfbf1', iClr: '#0d9488', vClr: '#0d9488' },
  red:     { css: 'stat-card-rose',    iBg: '#ffe4e6', iClr: '#e11d48', vClr: '#e11d48' },
  danger:  { css: 'stat-card-rose',    iBg: '#ffe4e6', iClr: '#e11d48', vClr: '#e11d48' },
  amber:   { css: 'stat-card-amber',   iBg: '#fef3c7', iClr: '#d97706', vClr: '#b45309' },
  green:   { css: 'stat-card-emerald', iBg: '#d1fae5', iClr: '#059669', vClr: '#059669' },
  emerald: { css: 'stat-card-emerald', iBg: '#d1fae5', iClr: '#059669', vClr: '#059669' },
  purple:  { css: 'stat-card-violet',  iBg: '#ede9fe', iClr: '#7c3aed', vClr: '#7c3aed' },
  violet:  { css: 'stat-card-violet',  iBg: '#ede9fe', iClr: '#7c3aed', vClr: '#7c3aed' },
  blue:    { css: 'stat-card-blue',    iBg: '#dbeafe', iClr: '#1d4ed8', vClr: '#1d4ed8' },
  indigo:  { css: 'stat-card-indigo',  iBg: '#e0e7ff', iClr: '#4338ca', vClr: '#4338ca' },
  pink:    { css: 'stat-card-pink',    iBg: '#fce7f3', iClr: '#db2777', vClr: '#db2777' },
  orange:  { css: 'stat-card-orange',  iBg: '#ffedd5', iClr: '#ea580c', vClr: '#ea580c' },
  cyan:    { css: 'stat-card-cyan',    iBg: '#cffafe', iClr: '#0891b2', vClr: '#0891b2' },
  slate:   { css: '',                  iBg: '#f1f5f9', iClr: '#64748b', vClr: '#334155' },
  white:   { css: '',                  iBg: '#f1f5f9', iClr: '#64748b', vClr: '#334155' },
};

export function StatCard({ label, value, icon: Icon, variant = 'teal', onClick, className = '', 'data-tip': dataTip }) {
  const v = STAT_V[variant] || STAT_V.teal;
  return (
    <div
      onClick={onClick}
      data-tip={dataTip}
      className={`rounded-xl border px-4 py-3 flex items-center gap-3 transition-all duration-150 ${v.css} ${onClick ? 'cursor-pointer hover:shadow-sm hover:-translate-y-px' : ''} ${className}`}
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      {...(onClick ? { role: 'button', tabIndex: 0,
        onKeyDown: e => (e.key === 'Enter' || e.key === ' ') && onClick?.(e) } : {})}
    >
      {Icon && (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: v.iBg, color: v.iClr }}>
          <Icon size={15} strokeWidth={2} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-500)' }}>{label}</p>
        <p className="text-lg font-black leading-tight tabular-nums" style={{ color: v.vClr }}>{value}</p>
      </div>
    </div>
  );
}
