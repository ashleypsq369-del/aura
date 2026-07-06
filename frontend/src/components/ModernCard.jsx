import { motion } from 'framer-motion';

/**
 * ModernCard Component - Professional Healthcare Design
 */

export default function ModernCard({ 
  children, 
  className = '', 
  hover = true,
  elevated = false,
  gradient = false,
  onClick,
  ...props 
}) {
  const baseClasses = `
    bg-white rounded-xl transition-all duration-200
    ${elevated ? 'shadow-lg border-2' : 'shadow-md border'}
    ${hover ? 'hover:shadow-xl hover:scale-[1.02]' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    border-slate-200 hover:border-slate-300
    ${gradient ? 'bg-gradient-to-br from-white to-slate-50' : ''}
  `;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${baseClasses} ${className}`}
      onClick={onClick}
      whileHover={hover ? { y: -4 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * ProStatCard - Professional SaaS-grade stat/metric card.
 *
 * Props:
 *   label      - metric name (e.g. "Total Patients")
 *   value      - the number / string to display prominently
 *   icon       - Lucide icon component
 *   iconColor  - hex or tailwind color string used for icon bg tint  e.g. '#0d9488'
 *   trend      - optional number (positive = up, negative = down, shown as ±X%)
 *   trendLabel - optional custom trend label (e.g. "vs last week")
 *   subtitle   - optional small text below the value
 *   onClick    - makes the card a clickable button with hover lift
 *   accent     - left-border accent color (hex)
 *   index      - animation delay index
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
  const trendUp   = trend > 0;
  const trendDown = trend < 0;

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      whileHover={onClick ? { y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' } : undefined}
      onClick={onClick}
      className={`relative bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${onClick ? 'cursor-pointer card-hover-glow' : ''} ${className}`}
      style={accent ? { borderLeft: `4px solid ${accent}` } : { borderLeft: `4px solid ${iconColor}` }}
    >
      {/* Subtle top gradient strip */}
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(to right, ${iconColor}66, ${iconColor}22)` }} />

      <div className="p-5">
        {/* Top row: icon + trend */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: `${iconColor}18`, border: `1.5px solid ${iconColor}30` }}>
            <Icon size={20} strokeWidth={2} style={{ color: iconColor }} />
          </div>
          {trend !== undefined && trend !== null && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${
              trendUp   ? 'bg-emerald-50 text-emerald-700' :
              trendDown ? 'bg-red-50 text-red-600'         :
                          'bg-slate-100 text-slate-500'
            }`}>
              {trendUp   && <span>↑</span>}
              {trendDown && <span>↓</span>}
              {trend !== 0 && <span>{Math.abs(trend)}%</span>}
              {trend === 0 && <span>-</span>}
            </div>
          )}
        </div>

        {/* Value */}
        <p className="text-3xl font-extrabold text-slate-900 leading-none tracking-tight mb-1">
          {value}
        </p>

        {/* Label */}
        <p className="text-sm font-semibold text-slate-500">{label}</p>

        {/* Subtitle or trend label */}
        {(subtitle || (trend !== undefined && trend !== null)) && (
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            {subtitle || trendLabel}
          </p>
        )}
      </div>

      {/* Hover ripple overlay */}
      {onClick && (
        <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
          style={{ background: `${iconColor}08` }} />
      )}
    </motion.div>
  );

  return card;
}

/**
 * ProStatCardGrid - convenience wrapper for 2 or 4 column grids
 */
export function ProStatCardGrid({ cards, cols = 4 }) {
  const colClass = cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4';
  return (
    <div className={`grid ${colClass} gap-4 mb-6`}>
      {cards.map((c, i) => (
        <ProStatCard key={c.label} {...c} index={i} />
      ))}
    </div>
  );
}

export function StatCard({ title, value, icon: Icon, color = 'bg-blue-500', trend, className = '' }) {
  return (
    <ModernCard elevated hover className={className}>
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-1.5 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
          </div>
          {trend && (
            <span className={`text-xs font-semibold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        <h3 className="text-xs font-medium text-slate-600 mb-0.5">{title}</h3>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </ModernCard>
  );
}

export function SectionCard({ title, subtitle, icon: Icon, children, actions, className = '' }) {
  return (
    <ModernCard className={className}>
      <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {Icon && (
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Icon className="w-4 h-4 text-primary" />
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
              {subtitle && <p className="text-xs text-slate-600">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </ModernCard>
  );
}

export function InfoCard({ title, children, variant = 'info', className = '' }) {
  const variants = {
    info:    'border-blue-200 bg-blue-50/60',
    success: 'border-emerald-200 bg-emerald-50/60',
    warning: 'border-amber-200 bg-amber-50/60',
    error:   'border-red-200 bg-red-50/60',
    violet:  'border-violet-200 bg-violet-50/60',
    teal:    'border-teal-200 bg-teal-50/60',
  };
  const titleColors = {
    info:    'text-blue-900',
    success: 'text-emerald-900',
    warning: 'text-amber-900',
    error:   'text-red-900',
    violet:  'text-violet-900',
    teal:    'text-teal-900',
  };
  return (
    <div className={`rounded-xl border p-4 ${variants[variant] || variants.info} ${className}`}>
      {title && <h4 className={`font-semibold text-sm mb-2 ${titleColors[variant] || 'text-slate-900'}`}>{title}</h4>}
      <div className="text-sm text-slate-700">{children}</div>
    </div>
  );
}
