/**
 * MLRiskPanel.jsx
 * ================
 * Displays real XGBoost ML risk predictions with SHAP waterfall chart.
 * Used on PatientMonitor and AIInsights pages.
 *
 * Features:
 * - Overall risk score + gauge
 * - Per-task breakdown (8 clinical tasks)
 * - SHAP waterfall: shows which features push risk up/down
 * - Key concerns + recommended actions from model
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Brain, AlertTriangle, Activity, TrendingUp, ChevronDown,
  ChevronUp, RefreshCw, Info, Zap, Shield, CheckCircle,
} from 'lucide-react';
import { mlAPI } from '../api/client';

// ── Color helpers ─────────────────────────────────────────────────────────
const RISK_COLORS = {
  critical: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', bar: '#e11d48', left: 'border-l-red-500' },
  warning:  { bg: '#fff7ed', text: '#9a3412', border: '#fdba74', bar: '#f97316', left: 'border-l-orange-500' },
  normal:   { bg: '#f0fdf4', text: '#166534', border: '#86efac', bar: '#16a34a', left: 'border-l-green-500' },
  high:     { bg: '#fef3c7', text: '#92400e', border: '#fcd34d', bar: '#d97706', left: 'border-l-amber-500' },
  moderate: { bg: '#eff6ff', text: '#1e40af', border: '#93c5fd', bar: '#3b82f6', left: 'border-l-blue-500' },
  low:      { bg: '#f0fdf4', text: '#166534', border: '#86efac', bar: '#16a34a', left: 'border-l-green-400' },
  unknown:  { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', bar: '#94a3b8', left: 'border-l-gray-300' },
};

// left-border colour map for Tailwind (can't use dynamic class names)
const LEFT_BORDER_STYLE = {
  critical: '#e11d48',
  warning:  '#f97316',
  normal:   '#16a34a',
  high:     '#d97706',
  moderate: '#3b82f6',
  low:      '#16a34a',
  unknown:  '#94a3b8',
};

function riskColor(level) {
  return RISK_COLORS[level] || RISK_COLORS.unknown;
}

function leftBorderColor(level) {
  return LEFT_BORDER_STYLE[level] || LEFT_BORDER_STYLE.unknown;
}

// ── Task display names ────────────────────────────────────────────────────
const TASK_LABELS = {
  vital_risk:           { label: 'Vital Signs Risk',       icon: Activity,      color: '#e11d48' },
  symptom_burden:       { label: 'Symptom Burden',         icon: AlertTriangle, color: '#f97316' },
  functional_decline:   { label: 'Functional Decline',     icon: TrendingUp,    color: '#d97706' },
  cognitive_impairment: { label: 'Cognitive Risk',         icon: Brain,         color: '#7c3aed' },
  mental_health_risk:   { label: 'Mental Health Risk',     icon: Brain,         color: '#0891b2' },
  medication_risk:      { label: 'Medication Risk',        icon: Shield,        color: '#dc2626' },
  caregiver_burden:     { label: 'Caregiver Burden',       icon: Activity,      color: '#059669' },
  admission_risk:       { label: '7-Day Admission Risk',   icon: AlertTriangle, color: '#b45309' },
};

// ── Risk gauge ────────────────────────────────────────────────────────────
function RiskGauge({ value, level, size = 70 }) {
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const pct   = Math.min(Math.max(safeValue, 0), 1);
  const angle = pct * 180 - 90;
  const c     = riskColor(level);
  const safeSize = typeof size === 'number' && size > 0 ? size : 70;
  const r     = safeSize / 2 - 8;
  const cx    = safeSize / 2;
  const cy    = safeSize / 2 + 6;

  const arcPath = (startDeg, endDeg, radius) => {
    const toRad = d => (d - 90) * Math.PI / 180;
    const x1 = cx + radius * Math.cos(toRad(startDeg));
    const y1 = cy + radius * Math.sin(toRad(startDeg));
    const x2 = cx + radius * Math.cos(toRad(endDeg));
    const y2 = cy + radius * Math.sin(toRad(endDeg));
    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  };

  const needleX = cx + r * 0.7 * Math.cos((angle - 90) * Math.PI / 180);
  const needleY = cy + r * 0.7 * Math.sin((angle - 90) * Math.PI / 180);

  return (
    <svg width={safeSize} height={safeSize * 0.65} viewBox={`0 0 ${safeSize} ${safeSize * 0.65}`} aria-hidden="true">
      <path d={arcPath(0, 180, r)} fill="none" stroke="#e2e8f0" strokeWidth="5" strokeLinecap="round"/>
      {pct > 0 && (
        <path d={arcPath(0, pct * 180, r)} fill="none" stroke={c.bar} strokeWidth="5" strokeLinecap="round"/>
      )}
      <line x1={cx} y1={cy} x2={needleX} y2={needleY}
        stroke={c.text} strokeWidth="2" strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r="3.5" fill={c.text}/>
      <text x={cx} y={cy - r * 0.3} textAnchor="middle"
        fontSize="10" fontWeight="700" fill={c.text}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

// ── SHAP waterfall bar ────────────────────────────────────────────────────
function SHAPBar({ feature, maxImp }) {
  const pct  = maxImp > 0 ? (feature.importance / maxImp) * 100 : 0;
  const isUp = feature.impact === 'increases_risk';
  const barColor  = isUp ? 'bg-red-500' : 'bg-emerald-500';
  const chipColor = isUp
    ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] font-semibold text-gray-600 truncate max-w-[55%]">
          {feature.display_name}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] text-gray-400 tabular-nums">
            {typeof feature.value === 'number' ? feature.value.toFixed(1) : feature.value}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border tabular-nums ${chipColor}`}>
            {isUp ? '+' : ''}{feature.pct?.toFixed(1) ?? Math.abs(feature.shap_value).toFixed(3)}%
          </span>
        </div>
      </div>
      {/* Bar — h-1.5 per spec */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ── Single task card ──────────────────────────────────────────────────────
function TaskCard({ taskKey, task }) {
  const [expanded, setExpanded] = useState(false);
  const meta    = TASK_LABELS[taskKey] || { label: taskKey, icon: Brain, color: '#64748b' };
  const Icon    = meta.icon;
  const lvl     = task.risk_level || 'unknown';
  const maxImp  = Math.max(...(task.top_features?.map(f => f.importance) || [1]), 0.001);
  const lbColor = leftBorderColor(lvl);
  const textCol = riskColor(lvl).text;

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: lbColor }}
    >
      {/* Header — px-4 py-2.5 */}
      <button
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Icon — w-7 h-7 rounded-lg */}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${meta.color}18` }}>
          <Icon size={14} style={{ color: meta.color }} />
        </div>

        <div className="flex-1 min-w-0">
          {/* title text-xs font-semibold */}
          <p className="text-xs font-semibold text-gray-800 truncate">{meta.label}</p>
          <p className="text-[10px] text-gray-400">
            {task.shap_available ? 'SHAP values' : 'Feature importance'} · {task.top_features?.length ?? 0} factors
          </p>
        </div>

        {/* Probability — text-sm font-bold */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <p className="text-sm font-bold tabular-nums" style={{ color: textCol }}>
              {(task.probability * 100).toFixed(0)}%
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: textCol }}>
              {task.risk_level}
            </p>
          </div>
          {expanded
            ? <ChevronUp size={13} className="text-gray-400"/>
            : <ChevronDown size={13} className="text-gray-400"/>}
        </div>
      </button>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full"
            style={{ backgroundColor: meta.color }}
            initial={{ width: 0 }}
            animate={{ width: `${task.probability * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* SHAP waterfall (expanded) */}
      <AnimatePresence>
        {expanded && task.top_features?.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 pt-2 pb-1.5">
                <Zap size={10} className="text-gray-400"/>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {task.shap_available ? 'SHAP Feature Impact' : 'Feature Importance'}
                </p>
                {task.shap_available && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                    SHAP
                  </span>
                )}
              </div>
              {task.top_features.slice(0, 6).map(f => (
                <SHAPBar key={f.feature} feature={f} maxImp={maxImp} />
              ))}
              <div className="flex items-center gap-4 pt-1 border-t border-gray-100 mt-1">
                <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"/>Increases risk
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"/>Decreases risk
                </span>
              </div>
              {task.metrics?.auc && (
                <p className="text-[10px] text-gray-400 mt-2 text-right">
                  Model AUC: {task.metrics.auc.toFixed(3)}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────
export default function MLRiskPanel({ patientId, compact = false }) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['ml-risk', patientId],
    queryFn: () => mlAPI.getPatientRisk(patientId).then(r => r.data),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
          <Brain size={14} className="text-violet-600 animate-pulse" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700">Running ML Risk Models...</p>
          <p className="text-[10px] text-gray-400">XGBoost + SHAP analysis</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4 flex items-center gap-3">
        <Info size={14} className="text-amber-500 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          ML models not available.
          {error?.response?.status === 503
            ? ' Run train_models_now.py to enable predictions.'
            : ' Check backend connection.'}
        </p>
      </div>
    );
  }

  const overallRisk = typeof data?.overall_risk === 'number' ? data.overall_risk : 0;
  const overallLvl  = data?.overall_level || 'unknown';
  const lbColor     = leftBorderColor(overallLvl);
  const overallC    = riskColor(overallLvl);

  const sortedTasks = Object.entries(data?.tasks || {})
    .sort(([, a], [, b]) => b.probability - a.probability);

  if (compact) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex items-center gap-3 px-4 py-3"
        style={{ borderLeftWidth: 4, borderLeftColor: lbColor }}>
        <RiskGauge value={overallRisk} level={overallLvl} size={60} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: overallC.text }}>
            {overallLvl.toUpperCase()} RISK
          </p>
          <p className="text-[10px] text-gray-500 truncate">
            {data?.highest_task?.replace(/_/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase())} is highest
          </p>
        </div>
        <p className="text-sm font-bold tabular-nums flex-shrink-0" style={{ color: overallC.text }}>
          {(overallRisk * 100).toFixed(0)}%
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Overall Risk Hero Card — white bg, left border-l-4 ── */}
      <div
        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        style={{ borderLeftWidth: 4, borderLeftColor: lbColor }}
      >
        {/* Header bar — px-4 py-3 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-violet-50">
              <Brain size={14} className="text-violet-600"/>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-semibold text-gray-800 leading-none">ML Risk Assessment</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500"/>
                XGBoost
              </span>
              {data?.tasks && Object.values(data.tasks).some(t => t.shap_available) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"/>
                  SHAP Live
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"/>
                {(data?.models_available ?? 0) + 4}/12 models
              </span>
            </div>
          </div>
          <button onClick={() => refetch()} disabled={isFetching}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh">
            <RefreshCw size={12} className={`text-gray-400 ${isFetching ? 'animate-spin' : ''}`}/>
          </button>
        </div>

        {/* Risk score + concerns row — px-4 py-3 */}
        <div className="px-4 py-3 flex items-start gap-4">
          {/* Gauge */}
          <div className="flex flex-col items-center flex-shrink-0">
            <RiskGauge value={overallRisk} level={overallLvl} size={70}/>
            <span className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: overallC.text }}>
              {overallLvl} risk
            </span>
          </div>

          {/* Concerns */}
          <div className="flex-1 min-w-0 space-y-2">
            {(data?.key_concerns?.length ?? 0) > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Key Concerns</p>
                {data.key_concerns.slice(0, 3).map((c, i) => (
                  <div key={i} className="flex items-start gap-1.5 mb-0.5">
                    <AlertTriangle size={9} className="text-amber-500 flex-shrink-0 mt-0.5"/>
                    <p className="text-[10px] text-gray-700 leading-snug">{c}</p>
                  </div>
                ))}
              </div>
            )}
            {(data?.recommended_actions?.length ?? 0) > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Actions</p>
                {data.recommended_actions.slice(0, 2).map((a, i) => (
                  <div key={i} className="flex items-start gap-1.5 mb-0.5">
                    <CheckCircle size={9} className="text-teal-500 flex-shrink-0 mt-0.5"/>
                    <p className="text-[10px] text-gray-700 leading-snug">{a}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Task mini-grid — white bg, left border-l-2, p-2 */}
        <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {sortedTasks.slice(0, 8).map(([key, t]) => {
            const meta = TASK_LABELS[key] || { color: '#64748b', label: key };
            const lbc  = leftBorderColor(t.risk_level);
            const tc   = riskColor(t.risk_level).text;
            return (
              <div key={key}
                className="bg-white rounded-xl border border-gray-200 p-2 transition-colors hover:bg-gray-50"
                style={{ borderLeftWidth: 2, borderLeftColor: lbc }}>
                <p className="text-[10px] font-semibold text-gray-600 truncate leading-tight">
                  {meta.label?.replace(' Risk', '').replace(' Burden', '') ?? key}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden mr-1.5">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${t.probability * 100}%`, backgroundColor: meta.color }}/>
                  </div>
                  <span className="text-[10px] font-bold tabular-nums flex-shrink-0" style={{ color: tc }}>
                    {(t.probability * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Task detail cards with SHAP (expandable) ── */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
          <Brain size={10}/> SHAP Breakdown — tap any task to expand
        </p>
        {sortedTasks.map(([key, task]) => (
          <TaskCard key={key} taskKey={key} task={task} />
        ))}
      </div>
    </div>
  );
}
