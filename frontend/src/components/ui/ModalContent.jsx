/**
 * ModalContent.jsx — Structured display building blocks for modals
 * ================================================================
 * Provides consistent, well-designed content patterns for all modal types:
 *
 * FORM INPUTS
 *   <Field>           — labelled input with validation state + helper text
 *   <FieldGroup>      — grid row of 2 fields
 *   <FieldSection>    — labelled group of fields with divider
 *   <SelectField>     — styled select
 *   <TextareaField>   — styled textarea
 *   <ToggleField>     — switch + label + description
 *   <StepWizard>      — multi-step form progress bar
 *
 * INFORMATION DISPLAY (read-only)
 *   <InfoRow>         — label / value pair in a row
 *   <InfoGrid>        — 2–3 column grid of InfoRows
 *   <InfoBadge>       — colour-coded status pill
 *   <InfoAlert>       — contextual alert/callout box (info/warning/danger/success)
 *   <InfoSection>     — titled section with icon inside a modal body
 *   <DataCard>        — metric card (label + big number + sub-text)
 *   <ListItem>        — labelled bullet list item
 *   <ProgressRow>     — label + animated horizontal bar + value
 *   <SHAPRow>         — SHAP feature contribution row (clinical AI)
 *
 * LAYOUT HELPERS
 *   <Divider>         — slim horizontal rule with optional label
 *   <Spacer>          — fixed vertical gap
 *   <TwoCol>          — 2-column responsive grid
 */

import { CheckCircle, Info, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════════
   FORM FIELDS
═══════════════════════════════════════════════════════════════════════ */

/**
 * Field — standard labelled form input
 * required, error, helperText supported
 */
export function Field({
  label, name, type = 'text', placeholder, required,
  error, helperText, children, className = '', ...rest
}) {
  const base = `w-full px-3 py-2.5 text-sm rounded-xl border transition-all outline-none
    ${error
      ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200 text-red-900'
      : 'border-slate-300 bg-[#e8fafa] focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-slate-900'}`;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children
        ? children
        : <input id={name} name={name} type={type} placeholder={placeholder} className={base} {...rest} />}
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><XCircle size={12} />{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-400">{helperText}</p>}
    </div>
  );
}

/**
 * SelectField — styled select inside a Field
 */
export function SelectField({ label, name, options = [], required, error, helperText, ...rest }) {
  const base = `w-full px-3 py-2.5 text-sm rounded-xl border transition-all outline-none bg-[#e8fafa]
    ${error ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100'}
    text-slate-900`;
  return (
    <Field label={label} name={name} required={required} error={error} helperText={helperText}>
      <select id={name} name={name} className={base} {...rest}>
        {options.map((opt) =>
          typeof opt === 'string'
            ? <option key={opt} value={opt}>{opt}</option>
            : <option key={opt.value} value={opt.value}>{opt.label}</option>
        )}
      </select>
    </Field>
  );
}

/**
 * TextareaField — styled textarea inside a Field
 */
export function TextareaField({ label, name, rows = 3, required, error, helperText, className = '', ...rest }) {
  const base = `w-full px-3 py-2.5 text-sm rounded-xl border transition-all outline-none resize-none
    ${error ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-slate-300 bg-[#e8fafa] focus:border-teal-500 focus:ring-2 focus:ring-teal-100'}
    text-slate-900`;
  return (
    <Field label={label} name={name} required={required} error={error} helperText={helperText} className={className}>
      <textarea id={name} name={name} rows={rows} className={base} {...rest} />
    </Field>
  );
}

/**
 * FieldGroup — 2-column grid of fields
 */
export function FieldGroup({ children, cols = 2, className = '' }) {
  const colClass = { 1: '', 2: 'grid-cols-2', 3: 'grid-cols-3' }[cols] || 'grid-cols-2';
  return <div className={`grid ${colClass} gap-4 ${className}`}>{children}</div>;
}

/**
 * FieldSection — titled divider group of fields
 */
export function FieldSection({ title, icon: Icon, children, accent = 'teal', className = '' }) {
  const colors = {
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
    blue: 'bg-blue-50 border-blue-200 text-teal-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider ${colors[accent] || colors.teal}`}>
          {Icon && <Icon size={13} />}
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * ToggleField — switch with label + optional description
 */
export function ToggleField({ label, description, checked, onChange, name }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5 flex-shrink-0">
        <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} name={name} />
        <div className={`w-10 h-5.5 rounded-full transition-colors ${checked ? 'bg-teal-600' : 'bg-slate-300'}`} style={{height:'1.375rem'}} />
        <div className={`absolute top-0.5 w-4 h-4 bg-[#e8fafa] rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
      </div>
    </label>
  );
}

/**
 * StepWizard — multi-step progress indicator
 */
export function StepWizard({ steps, current }) {
  return (
    <div className="flex items-center gap-1 mb-2">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className={`flex flex-col items-center flex-1 px-1 py-1.5 rounded-lg text-center transition-all text-xs font-semibold
              ${active ? 'bg-teal-700 text-white shadow-sm' : done ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'}`}>
              {Icon && <Icon size={13} className="mb-0.5" />}
              <span className="truncate leading-tight">{step.title}</span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight size={12} className={`flex-shrink-0 mx-0.5 ${i < current ? 'text-teal-500' : 'text-slate-300'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   INFORMATION DISPLAY
═══════════════════════════════════════════════════════════════════════ */

/**
 * InfoRow — label / value display pair
 */
export function InfoRow({ label, value, valueClass = '', mono = false, children }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex-shrink-0 mt-0.5">{label}</span>
      <span className={`text-sm font-medium text-slate-800 text-right ${mono ? 'font-mono' : ''} ${valueClass}`}>
        {children || value || <span className="text-slate-400 italic">—</span>}
      </span>
    </div>
  );
}

/**
 * InfoGrid — 2-column grid of key-value tiles
 */
export function InfoGrid({ items = [], cols = 2 }) {
  const colClass = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' }[cols] || 'grid-cols-2';
  return (
    <div className={`grid ${colClass} gap-2`}>
      {items.map(({ label, value, sub, accent }) => {
        const colors = {
          teal: 'border-teal-200 bg-teal-50',
          blue: 'border-blue-200 bg-blue-50',
          red: 'border-red-200 bg-red-50',
          amber: 'border-amber-200 bg-amber-50',
          green: 'border-green-200 bg-green-50',
          purple: 'border-purple-200 bg-purple-50',
        };
        return (
          <div key={label} className={`border rounded-xl p-2.5 ${colors[accent] || 'border-slate-200 bg-slate-50'}`}>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide truncate">{label}</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5 leading-tight">{value || '—'}</p>
            {sub && <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{sub}</p>}
          </div>
        );
      })}
    </div>
  );
}

/**
 * InfoBadge — colour-coded status/type pill
 */
export function InfoBadge({ label, variant = 'default', size = 'sm' }) {
  const variants = {
    success:  'bg-green-100 text-green-800 border-green-200',
    warning:  'bg-amber-100 text-amber-800 border-amber-200',
    danger:   'bg-red-100 text-red-800 border-red-200',
    info:     'bg-blue-100 text-blue-800 border-blue-200',
    purple:   'bg-purple-100 text-purple-800 border-purple-200',
    teal:     'bg-teal-100 text-teal-800 border-teal-200',
    default:  'bg-slate-100 text-slate-700 border-slate-200',
  };
  const sizes = { xs: 'px-2 py-0.5 text-[10px]', sm: 'px-2.5 py-1 text-xs', md: 'px-3 py-1.5 text-sm' };
  return (
    <span className={`inline-flex items-center border rounded-full font-semibold ${variants[variant]} ${sizes[size]}`}>
      {label}
    </span>
  );
}

/**
 * InfoAlert — contextual callout box
 */
export function InfoAlert({ type = 'info', title, children, compact = false }) {
  const configs = {
    info:    { bg: 'bg-blue-50 border-blue-200',   icon: Info,          iconClass: 'text-teal-500',   titleClass: 'text-blue-800'   },
    warning: { bg: 'bg-amber-50 border-amber-200', icon: AlertTriangle, iconClass: 'text-amber-500',  titleClass: 'text-amber-800'  },
    danger:  { bg: 'bg-red-50 border-red-200',     icon: XCircle,       iconClass: 'text-red-500',    titleClass: 'text-red-800'    },
    success: { bg: 'bg-green-50 border-green-200', icon: CheckCircle,   iconClass: 'text-green-500',  titleClass: 'text-green-800'  },
  };
  const { bg, icon: Icon, iconClass, titleClass } = configs[type] || configs.info;
  return (
    <div className={`border rounded-xl ${compact ? 'px-3 py-2.5' : 'px-4 py-3'} flex gap-3 ${bg}`}>
      <Icon size={compact ? 14 : 16} className={`${iconClass} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        {title && <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${titleClass}`}>{title}</p>}
        <div className="text-xs text-slate-700 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

/**
 * InfoSection — titled section with icon inside modal body
 */
export function InfoSection({ title, icon: Icon, iconColor = 'text-teal-600', iconBg = 'bg-teal-50', children, action, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={14} className={iconColor} />
            </div>
          )}
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/**
 * DataCard — compact metric tile (number + label)
 */
export function DataCard({ label, value, sub, icon: Icon, accent = 'teal', trend }) {
  const accentMap = {
    teal:   { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-700',   num: 'text-teal-800' },
    red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    num: 'text-red-800'  },
    amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  num: 'text-amber-800'},
    green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  num: 'text-green-800'},
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-teal-700',   num: 'text-blue-800' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', num: 'text-purple-800'},
    slate:  { bg: 'bg-slate-50',  border: 'border-slate-200',  text: 'text-slate-600',  num: 'text-slate-800'},
  };
  const c = accentMap[accent] || accentMap.teal;
  return (
    <div className={`${c.bg} ${c.border} border rounded-xl p-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${c.text} truncate`}>{label}</p>
          <p className={`text-2xl font-bold ${c.num} leading-none mt-1`}>{value}</p>
          {sub && <p className={`text-xs mt-1 ${c.text} opacity-75`}>{sub}</p>}
        </div>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
            <Icon size={16} className={c.text} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ListItem — styled bullet list item with optional badge
 */
export function ListItem({ children, badge, badgeVariant = 'default', icon: Icon, accent = 'teal' }) {
  const dotColors = { teal: 'bg-teal-500', blue: 'bg-teal-500', red: 'bg-red-500', amber: 'bg-amber-500', green: 'bg-green-500' };
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      {Icon
        ? <Icon size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
        : <div className={`w-1.5 h-1.5 rounded-full ${dotColors[accent] || dotColors.teal} flex-shrink-0 mt-1.5`} />}
      <span className="text-sm text-slate-700 flex-1 leading-relaxed">{children}</span>
      {badge && <InfoBadge label={badge} variant={badgeVariant} size="xs" />}
    </div>
  );
}

/**
 * ProgressRow — label + animated horizontal progress bar + value
 */
export function ProgressRow({ label, value, max = 100, color = 'teal', showValue = true, valueLabel }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColors = {
    teal: 'bg-teal-500', blue: 'bg-teal-500', red: 'bg-red-500',
    amber: 'bg-amber-500', green: 'bg-green-500', purple: 'bg-purple-500',
  };
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        {showValue && <span className="text-xs font-bold text-slate-800">{valueLabel || `${value}/${max}`}</span>}
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${barColors[color] || barColors.teal}`}
        />
      </div>
    </div>
  );
}

/**
 * SHAPRow — SHAP feature explanation row (clinical AI explainability)
 * Shows feature name + value + direction + % contribution bar
 */
export function SHAPRow({ feature, value, pct, impact, rank }) {
  const isRisk = impact === 'increases_risk';
  const barColor = isRisk ? 'bg-red-400' : 'bg-emerald-400';
  const textColor = isRisk ? 'text-red-700' : 'text-emerald-700';
  const bgColor = isRisk ? 'bg-red-50' : 'bg-emerald-50';
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${isRisk ? 'border-red-100' : 'border-emerald-100'} ${bgColor}`}>
      {rank && <span className="w-5 h-5 rounded-full bg-[#e8fafa] border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0">{rank}</span>}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-semibold text-slate-800 truncate">{feature}</span>
          <span className={`text-xs font-bold flex-shrink-0 ${textColor}`}>
            {isRisk ? '▲' : '▼'} {pct}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/70 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, delay: (rank || 1) * 0.05 }}
              className={`h-full rounded-full ${barColor}`}
            />
          </div>
          {value !== undefined && (
            <span className="text-[10px] text-slate-500 flex-shrink-0 font-mono">{typeof value === 'number' ? value.toFixed(1) : value}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   LAYOUT HELPERS
═══════════════════════════════════════════════════════════════════════ */

export function Divider({ label, className = '' }) {
  return (
    <div className={`flex items-center gap-3 my-1 ${className}`}>
      <div className="flex-1 h-px bg-slate-200" />
      {label && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">{label}</span>}
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

export function Spacer({ size = 4 }) {
  return <div style={{ height: `${size * 4}px` }} />;
}

export function TwoCol({ children, className = '' }) {
  return <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>{children}</div>;
}
