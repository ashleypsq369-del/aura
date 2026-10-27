/**
 * Card.jsx - Semantic card components (Shadcn-style)
 * ===================================================
 * Builds on standard HTML structural tags so screen readers
 * can navigate card content meaningfully.
 *
 * Usage:
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>Pain Score</CardTitle>
 *       <CardDescription>Last 7 days average</CardDescription>
 *     </CardHeader>
 *     <CardContent>
 *       <Progress value={7} max={10} />
 *     </CardContent>
 *     <CardFooter>
 *       <button>View History</button>
 *     </CardFooter>
 *   </Card>
 *
 *   <StatCard label="Active Alerts" value={3} icon={Bell} variant="danger" />
 */

import { forwardRef } from 'react';

// -- Base card -------------------------------------------------------------

export const Card = forwardRef(({ className = '', children, onClick, ...props }, ref) => (
  <div
    ref={ref}
    className={`
      bg-[#e8fafa] rounded-2xl border border-slate-200 shadow-sm
      ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150' : ''}
      ${className}
    `}
    onClick={onClick}
    {...(onClick ? { role: 'button', tabIndex: 0,
      onKeyDown: e => (e.key === 'Enter' || e.key === ' ') && onClick?.(e) } : {})}
    {...props}
  >
    {children}
  </div>
));
Card.displayName = 'Card';

export const CardHeader = ({ className = '', children, ...props }) => (
  <div className={`px-5 pt-5 pb-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = '', children, as: Tag = 'h3', ...props }) => (
  <Tag className={`font-bold text-slate-900 leading-tight ${className}`} {...props}>
    {children}
  </Tag>
);

export const CardDescription = ({ className = '', children, ...props }) => (
  <p className={`text-sm text-slate-500 mt-0.5 leading-snug ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className = '', children, ...props }) => (
  <div className={`px-5 pb-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className = '', children, ...props }) => (
  <div className={`px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center gap-3 ${className}`} {...props}>
    {children}
  </div>
);

// -- Stat card - compact clinical KPI (Linear / Stripe density) ----------

const STAT_VARIANTS = {
  teal:    { css: 'stat-card-teal',    iconBg: '#ccfbf1', iconColor: '#0d9488', valColor: '#0d9488' },
  red:     { css: 'stat-card-rose',    iconBg: '#ffe4e6', iconColor: '#e11d48', valColor: '#e11d48' },
  danger:  { css: 'stat-card-rose',    iconBg: '#ffe4e6', iconColor: '#e11d48', valColor: '#e11d48' },
  amber:   { css: 'stat-card-amber',   iconBg: '#fef3c7', iconColor: '#d97706', valColor: '#b45309' },
  green:   { css: 'stat-card-emerald', iconBg: '#d1fae5', iconColor: '#059669', valColor: '#059669' },
  emerald: { css: 'stat-card-emerald', iconBg: '#d1fae5', iconColor: '#059669', valColor: '#059669' },
  purple:  { css: 'stat-card-violet',  iconBg: '#ede9fe', iconColor: '#7c3aed', valColor: '#7c3aed' },
  violet:  { css: 'stat-card-violet',  iconBg: '#ede9fe', iconColor: '#7c3aed', valColor: '#7c3aed' },
  blue:    { css: 'stat-card-blue',    iconBg: '#dbeafe', iconColor: '#1d4ed8', valColor: '#1d4ed8' },
  indigo:  { css: 'stat-card-indigo',  iconBg: '#e0e7ff', iconColor: '#4338ca', valColor: '#4338ca' },
  pink:    { css: 'stat-card-pink',    iconBg: '#fce7f3', iconColor: '#db2777', valColor: '#db2777' },
  orange:  { css: 'stat-card-orange',  iconBg: '#ffedd5', iconColor: '#ea580c', valColor: '#ea580c' },
  cyan:    { css: 'stat-card-cyan',    iconBg: '#cffafe', iconColor: '#0891b2', valColor: '#0891b2' },
  slate:   { css: '',                  iconBg: '#f1f5f9', iconColor: '#64748b', valColor: '#334155' },
  white:   { css: '',                  iconBg: '#f1f5f9', iconColor: '#64748b', valColor: '#334155' },
};

export function StatCard({ label, value, icon: Icon, variant = 'teal', onClick, className = '', 'data-tip': dataTip }) {
  const v = STAT_VARIANTS[variant] || STAT_VARIANTS.teal;

  return (
    <div
      onClick={onClick}
      data-tip={dataTip}
      className={`
        rounded-lg border px-4 py-3 flex items-center gap-3
        transition-all duration-150 bg-[#e8fafa]
        ${v.css}
        ${onClick ? 'cursor-pointer hover:shadow-sm hover:-translate-y-px' : ''}
        ${className}
      `}
      {...(onClick ? { role: 'button', tabIndex: 0,
        onKeyDown: e => (e.key === 'Enter' || e.key === ' ') && onClick?.(e) } : {})}
    >
      {Icon && (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: v.iconBg, color: v.iconColor }}
        >
          <Icon size={15} strokeWidth={2} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400 leading-none mb-1 tracking-wide">{label}</p>
        <p className="text-xl font-bold tabular-nums leading-none" style={{ color: v.valColor }}>{value}</p>
      </div>
    </div>
  );
}
