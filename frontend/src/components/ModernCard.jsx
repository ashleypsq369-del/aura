import { motion } from 'framer-motion';

// Grain texture as a constant — keeps JSX clean and avoids parser issues
const GRAIN_BG = {
  backgroundImage: [
    "url(\"data:image/svg+xml,",
    "%3Csvg xmlns='http://www.w3.org/2000/svg' width='65' height='65'%3E",
    "%3Cfilter id='n'%3E",
    "%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E",
    "%3C/filter%3E",
    "%3Crect width='65' height='65' filter='url(%23n)'/%3E",
    "%3C/svg%3E",
    "\")",
  ].join(''),
};

/**
 * ModernCard — base card with premium elevation + inner highlight
 */
export default function ModernCard({
  children,
  className = '',
  hover = true,
  elevated = false,
  onClick,
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={[
        'relative bg-white rounded-xl overflow-hidden',
        'border border-black/[0.06]',
        elevated
          ? 'shadow-[0_2px_4px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,0.9)]'
          : 'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]',
        hover ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)]' : '',
        onClick ? 'cursor-pointer' : '',
        'dark:bg-[#1a2332] dark:border-white/[0.06]',
        'dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {/* Grain texture overlay — very subtle physical feel */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-[0.018] mix-blend-overlay"
        style={GRAIN_BG}
      />
      {children}
    </motion.div>
  );
}

// ─── ProStatCard ─────────────────────────────────────────────────────────────
/**
 * Premium SaaS-grade stat/metric card
 *
 * Props:
 *   label      string   metric name
 *   value      any      main number / string
 *   icon       Lucide   icon component
 *   iconColor  hex      accent / icon colour  (default teal)
 *   trend      number   optional ±% change
 *   trendLabel string   optional trend caption
 *   subtitle   string   optional small line below value
 *   onClick    fn       makes card clickable
 *   accent     hex      left-border colour override
 *   index      number   animation stagger index
 */
export function ProStatCard({
  label,
  value,
  icon: Icon,
  iconColor = '#0d9488',
  trend,
  trendLabel = 'vs last period',
  subtitle,
  onClick,
  accent,
  index = 0,
  className = '',
}) {
  const borderColor = accent || iconColor;
  const trendUp   = trend > 0;
  const trendDown = trend < 0;

  const iconBg     = iconColor + '14';
  const iconBorder = iconColor + '28';
  const iconShadow = `0 1px 3px ${iconColor}15`;
  const stripFrom  = borderColor + '88';
  const stripTo    = borderColor + '22';
  const hoverWash  = iconColor + '06';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      whileHover={onClick ? { y: -3 } : undefined}
      onClick={onClick}
      className={[
        'relative bg-white rounded-xl overflow-hidden',
        'border border-black/[0.06]',
        'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_3px_8px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.9)]',
        'transition-all duration-200',
        'dark:bg-[#1a2332] dark:border-white/[0.06]',
        'dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]',
        onClick
          ? 'cursor-pointer hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)] hover:border-black/10 dark:hover:border-white/10'
          : '',
        className,
      ].filter(Boolean).join(' ')}
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      {/* Grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.018] mix-blend-overlay"
        style={GRAIN_BG}
      />

      {/* Accent colour strip along the top */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(to right, ${stripFrom}, ${stripTo})` }}
      />

      <div className="p-3 pt-3.5 relative z-10">
        {/* Icon + trend row */}
        <div className="flex items-start justify-between mb-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: iconBg, border: `1px solid ${iconBorder}`, boxShadow: iconShadow }}
          >
            <Icon size={15} strokeWidth={2.2} style={{ color: iconColor }} />
          </div>

          {trend !== undefined && trend !== null && (
            <span className={[
              'flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              trendUp
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                : trendDown
                  ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                  : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
            ].join(' ')}>
              {trendUp && '↑'}{trendDown && '↓'}
              {trend !== 0 ? `${Math.abs(trend)}%` : '—'}
            </span>
          )}
        </div>

        {/* Value */}
        <p
          className="text-2xl font-bold text-slate-900 dark:text-white leading-none tracking-tight mb-1"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {value}
        </p>

        {/* Label */}
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
          {label}
        </p>

        {/* Sub-line */}
        {(subtitle || (trend !== undefined && trend !== null)) && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            {subtitle || trendLabel}
          </p>
        )}
      </div>

      {/* Hover colour wash */}
      {onClick && (
        <div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none rounded-xl"
          style={{ background: hoverWash }}
        />
      )}
    </motion.div>
  );
}

// ─── ProStatCardGrid ──────────────────────────────────────────────────────────
export function ProStatCardGrid({ cards, cols = 4 }) {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  }[cols] ?? 'grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid ${colClass} gap-3 sm:gap-4`}>
      {cards.map((c, i) => (
        <ProStatCard key={c.label} {...c} index={i} />
      ))}
    </div>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────
export function SectionCard({ title, subtitle, icon: Icon, children, actions, accent, className = '' }) {
  const headerStyle = accent
    ? { borderLeft: `3px solid ${accent}`, background: `${accent}08` }
    : {};

  return (
    <ModernCard className={className}>
      <div
        className="px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between bg-slate-50/80 dark:bg-white/[0.02]"
        style={headerStyle}
      >
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={
                accent
                  ? { background: `${accent}15`, border: `1px solid ${accent}25` }
                  : { background: '#f1f5f9', border: '1px solid #e2e8f0' }
              }
            >
              <Icon
                size={13}
                strokeWidth={2.2}
                style={accent ? { color: accent } : { color: '#64748b' }}
              />
            </div>
          )}
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-4">{children}</div>
    </ModernCard>
  );
}

// ─── InfoCard ─────────────────────────────────────────────────────────────────
export function InfoCard({ title, children, variant = 'info', className = '' }) {
  const variants = {
    info:    { bg: 'bg-sky-50 dark:bg-sky-950/30',    border: 'border-sky-200 dark:border-sky-800',    title: 'text-sky-900 dark:text-sky-300',    accent: '#0284c7' },
    success: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', title: 'text-emerald-900 dark:text-emerald-300', accent: '#059669' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-950/30',  border: 'border-amber-200 dark:border-amber-800',  title: 'text-amber-900 dark:text-amber-300',  accent: '#d97706' },
    error:   { bg: 'bg-red-50 dark:bg-red-950/30',     border: 'border-red-200 dark:border-red-800',     title: 'text-red-900 dark:text-red-300',     accent: '#dc2626' },
    violet:  { bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800', title: 'text-violet-900 dark:text-violet-300', accent: '#7c3aed' },
    teal:    { bg: 'bg-teal-50 dark:bg-teal-950/30',   border: 'border-teal-200 dark:border-teal-800',   title: 'text-teal-900 dark:text-teal-300',   accent: '#0d9488' },
  };
  const cfg = variants[variant] ?? variants.info;

  return (
    <div
      className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border} ${className}`}
      style={{ borderLeft: `3px solid ${cfg.accent}` }}
    >
      {title && (
        <h4 className={`font-semibold text-sm mb-1.5 ${cfg.title}`}>{title}</h4>
      )}
      <div className="text-sm text-slate-700 dark:text-slate-300">{children}</div>
    </div>
  );
}

// ─── StatCard — legacy compat ─────────────────────────────────────────────────
export function StatCard({ title, value, icon: Icon, color = 'bg-blue-500', trend, className = '' }) {
  return (
    <ModernCard elevated className={className}>
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-1.5 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
          </div>
          {trend && (
            <span className={`text-xs font-semibold ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">{title}</h3>
        <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
      </div>
    </ModernCard>
  );
}
