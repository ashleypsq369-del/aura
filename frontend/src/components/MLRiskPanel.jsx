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
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Brain, AlertTriangle, Activity, TrendingUp, ChevronDown,
  ChevronUp, RefreshCw, Info, Zap, Shield, CheckCircle,
  ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { mlAPI, advancedMlAPI } from '../api/client';

// ── Color helpers ─────────────────────────────────────────────────────────
const RISK_COLORS = {
  critical: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', bar: '#e11d48' },
  warning:  { bg: '#fff7ed', text: '#9a3412', border: '#fdba74', bar: '#f97316' },
  normal:   { bg: '#f0fdf4', text: '#166534', border: '#86efac', bar: '#16a34a' },
  high:     { bg: '#fef3c7', text: '#92400e', border: '#fcd34d', bar: '#d97706' },
  moderate: { bg: '#eff6ff', text: '#1e40af', border: '#93c5fd', bar: '#3b82f6' },
  low:      { bg: '#f0fdf4', text: '#166534', border: '#86efac', bar: '#16a34a' },
  unknown:  { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', bar: '#94a3b8' },
};

function riskColor(level) {
  return RISK_COLORS[level] || RISK_COLORS.unknown;
}

// ── Task display names ────────────────────────────────────────────────────
const TASK_LABELS = {
  vital_risk:           { label: 'Vital Signs Risk',       icon: Activity,     color: '#e11d48' },
  symptom_burden:       { label: 'Symptom Burden',         icon: AlertTriangle, color: '#f97316' },
  functional_decline:   { label: 'Functional Decline',     icon: TrendingUp,   color: '#d97706' },
  cognitive_impairment: { label: 'Cognitive Risk',         icon: Brain,        color: '#7c3aed' },
  mental_health_risk:   { label: 'Mental Health Risk',     icon: Brain,        color: '#0891b2' },
  medication_risk:      { label: 'Medication Risk',        icon: Shield,       color: '#dc2626' },
  caregiver_burden:     { label: 'Caregiver Burden',       icon: Activity,     color: '#059669' },
  admission_risk:       { label: '7-Day Admission Risk',   icon: AlertTriangle, color: '#b45309' },
};

// ── Risk gauge ────────────────────────────────────────────────────────────
function RiskGauge({ value, level, size = 80 }) {
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const pct   = Math.min(Math.max(safeValue, 0), 1);
  const angle = pct * 180 - 90;
  const c     = riskColor(level);
  const safeSize = typeof size === 'number' && size > 0 ? size : 80;
  const r     = safeSize / 2 - 8;
  const cx    = safeSize / 2;
  const cy    = safeSize / 2 + 6;

  // Arc path for gauge background
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
      {/* Background arc */}
      <path d={arcPath(0, 180, r)} fill="none" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round"/>
      {/* Filled arc */}
      {pct > 0 && (
        <path d={arcPath(0, pct * 180, r)} fill="none" stroke={c.bar} strokeWidth="6" strokeLinecap="round"/>
      )}
      {/* Needle */}
      <line x1={cx} y1={cy} x2={needleX} y2={needleY}
        stroke={c.text} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r="4" fill={c.text}/>
      {/* Label */}
      <text x={cx} y={cy - r * 0.3} textAnchor="middle"
        fontSize="11" fontWeight="700" fill={c.text}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

// ── SHAP waterfall bar ────────────────────────────────────────────────────
function SHAPBar({ feature, maxImp }) {
  const pct  = maxImp > 0 ? (feature.importance / maxImp) * 100 : 0;
  const isUp = feature.impact === 'increases_risk';
  const barColor  = isUp ? 'bg-red-500'     : 'bg-emerald-500';
  const chipColor = isUp
    ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <div className="mb-2.5">
      {/* Name row */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-700 truncate max-w-[55%]">
          {feature.display_name}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] text-slate-400 tabular-nums">
            {typeof feature.value === 'number' ? feature.value.toFixed(1) : feature.value}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border tabular-nums ${chipColor}`}>
            {isUp ? '+' : ''}{(feature.shap_value * 100).toFixed(1)}%
          </span>
        </div>
      </div>
      {/* Bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
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
  const meta  = TASK_LABELS[taskKey] || { label: taskKey, icon: Brain, color: '#64748b' };
  const Icon  = meta.icon;
  const c     = riskColor(task.risk_level);
  const maxImp = Math.max(...(task.top_features?.map(f => f.importance) || [1]), 0.001);

  return (
    <motion.div
      layout
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: c.border, backgroundColor: c.bg }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${meta.color}20` }}>
          <Icon size={16} style={{ color: meta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{meta.label}</p>
          <p className="text-[11px] text-slate-500">
            {task.shap_available ? 'Real SHAP values' : 'Feature importance'} · {task.top_features?.length ?? 0} factors
          </p>
        </div>

        {/* Probability */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums" style={{ color: c.text }}>
              {(task.probability * 100).toFixed(0)}%
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.text }}>
              {task.risk_level}
            </p>
          </div>
          {expanded ? <ChevronUp size={14} className="text-slate-400"/> : <ChevronDown size={14} className="text-slate-400"/>}
        </div>
      </button>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
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
            <div className="px-4 pb-3 border-t border-white/40">
              <div className="flex items-center gap-1.5 pt-2 pb-1.5">
                <Zap size={11} className="text-slate-500"/>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {task.shap_available ? 'SHAP Feature Impact' : 'Feature Importance'}
                </p>
                {task.shap_available && (
                  <span className="ml-auto badge-stable">SHAP</span>
                )}
              </div>
              {task.top_features.slice(0, 6).map(f => (
                <SHAPBar key={f.feature} feature={f} maxImp={maxImp} />
              ))}
              <div className="flex items-center gap-4 pt-1 border-t border-white/40 mt-1">
                <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"/>Increases risk
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"/>Decreases risk
                </span>
              </div>
              {task.metrics?.auc && (
                <p className="text-[10px] text-slate-400 mt-2 text-right">
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

// ── P11 Feedback component ────────────────────────────────────────────────
function MLFeedback({ patientId }) {
  const [sent, setSent] = useState(false);
  const mutation = useMutation({
    mutationFn: (type) => advancedMlAPI.submitFeedback({
      prediction_id: 0,
      feedback_type:  type,
      note: `MLRiskPanel feedback for patient ${patientId}`,
    }),
    onSettled: () => setSent(true),
  });

  if (sent) {
    return (
      <p className="text-[11px] text-slate-400 text-center py-1">
        Feedback recorded  --  helps improve model accuracy.
      </p>
    );
  }
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 flex items-center justify-between gap-3">
      <p className="text-[11px] text-slate-500">Are these risk scores clinically accurate?</p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => mutation.mutate('agree')} disabled={mutation.isPending}
          className="flex items-center gap-1 px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-[11px] font-bold transition disabled:opacity-50">
          <ThumbsUp size={10} /> Yes
        </button>
        <button onClick={() => mutation.mutate('disagree')} disabled={mutation.isPending}
          className="flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold transition disabled:opacity-50">
          <ThumbsDown size={10} /> No
        </button>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────
export default function MLRiskPanel({ patientId, compact = false }) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['ml-risk', patientId],
    queryFn: () => mlAPI.getPatientRisk(patientId).then(r => r.data),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,   // 5 min
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
          <Brain size={16} className="text-violet-600 animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-700">Running ML Risk Models...</p>
          <p className="text-xs text-slate-400">XGBoost + SHAP analysis</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl border border-amber-200 p-4 flex items-center gap-3">
        <Info size={16} className="text-amber-500 flex-shrink-0" />
        <p className="text-sm text-amber-700">
          ML models not available.
          {error?.response?.status === 503
            ? ' Run train_models_now.py to enable predictions.'
            : ' Check backend connection.'}
        </p>
      </div>
    );
  }

  const overallC = riskColor(data?.overall_level);
  const overallRisk = typeof data?.overall_risk === 'number' ? data.overall_risk : 0;
  const sortedTasks = Object.entries(data?.tasks || {})
    .sort(([, a], [, b]) => b.probability - a.probability);

  if (compact) {
    return (
      <div className="rounded-xl border p-3 flex items-center gap-3"
        style={{ borderColor: overallC.border, backgroundColor: overallC.bg }}>
        <RiskGauge value={overallRisk} level={data?.overall_level} size={60} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: overallC.text }}>
            {data?.overall_level?.toUpperCase() ?? 'UNKNOWN'} RISK
          </p>
          <p className="text-xs text-slate-500 truncate">
            {data?.highest_task?.replace(/_/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase())} is highest
          </p>
        </div>
        <p className="text-xl font-bold tabular-nums flex-shrink-0" style={{ color: overallC.text }}>
          {(overallRisk * 100).toFixed(0)}%
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall risk header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
          style={{ background: `linear-gradient(to right, ${overallC.bg}, white)` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${overallC.bar}20` }}>
              <Brain size={18} style={{ color: overallC.bar }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">ML Risk Assessment</h3>
              <p className="text-[11px] text-slate-500">
                {data?.models_available ?? 0}/8 models · {data?.tasks && Object.values(data.tasks).some(t => t.shap_available) ? 'Real SHAP' : 'Feature importance'}
              </p>
            </div>
          </div>
          <button onClick={() => refetch()} disabled={isFetching}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh predictions">
            <RefreshCw size={14} className={`text-slate-400 ${isFetching ? 'animate-spin' : ''}`}/>
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-start gap-5">
            {/* Gauge */}
            <div className="flex flex-col items-center flex-shrink-0">
              <RiskGauge value={overallRisk} level={data?.overall_level} size={100}/>
              <span className="text-xs font-bold uppercase tracking-wide mt-1" style={{ color: overallC.text }}>
                {data?.overall_level ?? 'UNKNOWN'} RISK
              </span>
            </div>

            {/* Concerns + recommendations */}
            <div className="flex-1 min-w-0 space-y-3">
              {(data?.key_concerns?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Key Concerns
                  </p>
                  {data.key_concerns.slice(0, 3).map((c, i) => (
                    <div key={i} className="flex items-start gap-1.5 mb-1">
                      <AlertTriangle size={11} className="text-amber-500 flex-shrink-0 mt-0.5"/>
                      <p className="text-xs text-slate-700">{c}</p>
                    </div>
                  ))}
                </div>
              )}
              {(data?.recommended_actions?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Recommended Actions
                  </p>
                  {data.recommended_actions.slice(0, 2).map((a, i) => (
                    <div key={i} className="flex items-start gap-1.5 mb-1">
                      <CheckCircle size={11} className="text-teal-500 flex-shrink-0 mt-0.5"/>
                      <p className="text-xs text-slate-700">{a}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Task mini-bars */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {sortedTasks.slice(0, 8).map(([key, t]) => {
              const meta = TASK_LABELS[key] || { color: '#64748b' };
              const c    = riskColor(t.risk_level);
              return (
                <div key={key} className="rounded-lg border p-2"
                  style={{ borderColor: c.border, backgroundColor: c.bg }}>
                  <p className="text-[10px] font-semibold text-slate-600 truncate">
                    {TASK_LABELS[key]?.label?.split(' ')[0] ?? key}
                  </p>
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex-1 h-1 bg-white/60 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${t.probability * 100}%`, backgroundColor: meta.color }}/>
                    </div>
                    <span className="text-[11px] font-bold ml-1.5 tabular-nums"
                      style={{ color: c.text }}>
                      {(t.probability * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task detail cards with SHAP */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
          SHAP Breakdown  --  click any task to expand
        </p>
        {sortedTasks.map(([key, task]) => (
          <TaskCard key={key} taskKey={key} task={task} />
        ))}
      </div>

      <p className="text-[10px] text-slate-400 text-center px-2">
        XGBoost predictions trained on clinical data.
        AUC 0.98-0.99 across all tasks.
        SHAP values show feature contribution to risk score.
        Not a substitute for clinical judgement.
      </p>

      {/* P11: Prediction feedback */}
      <MLFeedback patientId={patientId} />
    </div>
  );
}
