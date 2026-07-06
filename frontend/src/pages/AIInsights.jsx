/**
 * AIInsights -- Premium 2-column layout
 * LEFT:  Paginated patient cards (6/page) -- no infinite scroll
 * RIGHT: Deep-dive panel (sticky) -- XGBoost + SHAP
 * System-wide proactive analysis -- /api/ai-analysis/system-insights
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { aiAPI, advancedMlAPI, mlAPI, ethicsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import toast from '../utils/toast';
import { ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import {
  Brain, AlertTriangle, TrendingDown, CheckCircle,
  Users, RefreshCw, Loader2, ChevronRight, Activity,
  AlertCircle, Zap, ShieldAlert, Pill, X, Clock, Sparkles,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const PAGE_SIZE = 6;

/* -- Priority visual config ------------------------------------------------ */
const P = {
  CRITICAL: {
    border: 'border-l-red-500',
    bg: 'bg-gradient-to-r from-red-50 to-rose-50/40',
    badge: 'bg-red-100 text-red-700 border-red-200',
    icon: 'text-red-600',
    dot: 'bg-red-500',
    Icon: AlertTriangle,
    pulse: true,
  },
  HIGH: {
    border: 'border-l-amber-500',
    bg: 'bg-gradient-to-r from-amber-50 to-orange-50/30',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: 'text-amber-600',
    dot: 'bg-amber-500',
    Icon: AlertCircle,
    pulse: false,
  },
  MODERATE: {
    border: 'border-l-blue-400',
    bg: 'bg-gradient-to-r from-blue-50/60 to-indigo-50/20',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: 'text-blue-600',
    dot: 'bg-blue-400',
    Icon: Activity,
    pulse: false,
  },
  LOW: {
    border: 'border-l-emerald-400',
    bg: 'bg-white',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: 'text-emerald-600',
    dot: 'bg-emerald-400',
    Icon: CheckCircle,
    pulse: false,
  },
};

/* -- Patient insight card -------------------------------------------------- */
function PatientCard({ insight, isSelected, onDeepDive }) {
  const priority = insight.priority || 'LOW';
  const cfg = P[priority] || P.LOW;
  const { Icon } = cfg;

  const concerns = Array.isArray(insight.key_concerns)
    ? insight.key_concerns
    : (insight.key_concerns || '').split('. ').map(s => s.trim()).filter(Boolean);

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className={`border-l-4 ${cfg.border} ${isSelected ? 'bg-violet-50 ring-2 ring-inset ring-violet-200' : cfg.bg} rounded-r-2xl transition-all duration-200 cursor-pointer group overflow-hidden`}
      onClick={() => onDeepDive(insight.patient_id)}>
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Priority icon */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
            priority === 'CRITICAL' ? 'bg-red-100' : priority === 'HIGH' ? 'bg-amber-100' : priority === 'MODERATE' ? 'bg-blue-100' : 'bg-emerald-100'
          } ${cfg.pulse ? 'animate-pulse' : ''}`}>
            <Icon size={14} className={cfg.icon}/>
          </div>

          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900">{insight.patient_name || `Patient #${insight.patient_id}`}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`}/>
                  {priority}
                </span>
                {(insight.trend === 'deteriorating' || insight.trend === 'worsening') && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-600"><TrendingDown size={11}/> Deteriorating</span>
                )}
              </div>
              <span className="flex items-center gap-1 text-[10px] text-slate-400 flex-shrink-0">
                <Clock size={10}/> Live
              </span>
            </div>

            {/* Clinical notes */}
            {insight.clinical_notes && (
              <p className="text-sm text-slate-600 leading-relaxed mb-2 line-clamp-2">{insight.clinical_notes}</p>
            )}

            {/* Key concerns */}
            {concerns.slice(0, 2).map((c, i) => (
              <div key={i} className="flex items-start gap-2 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} flex-shrink-0 mt-1.5`}/>
                <span className="text-xs text-slate-600">{c}</span>
              </div>
            ))}

            {/* Action */}
            <div className="flex items-center gap-2 mt-2.5">
              <button onClick={e => { e.stopPropagation(); onDeepDive(insight.patient_id); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-violet-200">
                <Brain size={11}/> XAI Deep-Dive
              </button>
              {isSelected && (
                <span className="flex items-center gap-1 text-xs text-violet-600 font-bold">
                  <ChevronRight size={12}/> Analysis open
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* -- SHAP chart ------------------------------------------------------------ */
function ShapChart({ features }) {
  if (!features || features.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-24 gap-2 text-slate-400">
        <Brain size={20} className="opacity-40"/>
        <p className="text-xs">No SHAP data available</p>
      </div>
    );

  // Normalise to 0-100 scale based on max absolute value
  const maxAbs = Math.max(...features.map(f => Math.abs(f.value)), 1);

  return (
    <div className="space-y-2.5">
      {features.slice(0, 8).map((f, i) => {
        const isRisk    = f.impact === 'increases_risk' || f.value > 0;
        const barWidth  = Math.round((Math.abs(f.value) / maxAbs) * 100);
        const barColor  = isRisk ? 'bg-red-500'     : 'bg-emerald-500';
        const chipColor = isRisk
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200';

        return (
          <div key={i} className="group">
            {/* Feature name row */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[60%]">{f.name}</span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {f.displayValue && (
                  <span className="text-[10px] text-slate-400 tabular-nums">{f.displayValue}</span>
                )}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border tabular-nums ${chipColor}`}>
                  {f.value > 0 ? '+' : ''}{f.value.toFixed(1)}%
                </span>
              </div>
            </div>
            {/* Bar */}
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${barColor}`}
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ duration: 0.5, delay: i * 0.04, ease: 'easeOut' }}
              />
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1 border-t border-slate-100">
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"/>Increases risk
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"/>Decreases risk
        </span>
      </div>
    </div>
  );
}

/* -- Risk gauge ------------------------------------------------------------ */
function RiskGauge({ score = 0 }) {
  const pct = Math.round(score * 100);
  const color = score > 0.7 ? '#ef4444' : score > 0.4 ? '#f59e0b' : '#10b981';
  const label = score > 0.7 ? 'High Risk' : score > 0.4 ? 'Moderate' : 'Stable';
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full">
        <ResponsiveContainer width="100%" height={100}>
          <RadialBarChart cx="50%" cy="80%" innerRadius="60%" outerRadius="90%"
            barSize={10} data={[{ name: 'Risk', value: pct, fill: color }]} startAngle={180} endAngle={0}>
            <RadialBar minAngle={5} background clockWise dataKey="value" cornerRadius={8}/>
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-0.5">
          <span className="text-2xl font-black tabular-nums" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <span className={`text-xs font-bold px-3 py-1 rounded-full ${score > 0.7 ? 'bg-red-100 text-red-700' : score > 0.4 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
        {label}
      </span>
    </div>
  );
}

/* -- Clinical Override Modal ----------------------------------------------- */
function OverrideModal({ patientId, onClose, onSubmit, pending }) {
  const [reason, setReason] = useState('');
  const [type, setType] = useState('risk_level_override');
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: .95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center"><ShieldAlert size={16} className="text-amber-600"/></div>
            <h2 className="font-bold text-slate-800">Clinical Override</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center"><X size={15} className="text-slate-400"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-amber-800">This override is logged in the ethics audit trail. Provide clear clinical justification.</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Override Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full border-2 border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm outline-none bg-white">
              <option value="risk_level_override">Risk Level Override</option>
              <option value="care_pathway_override">Care Pathway Override</option>
              <option value="prediction_disagreement">Clinical Disagreement</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Clinical Justification *</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4}
              placeholder="Describe the clinical reasoning..."
              className="w-full border-2 border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none"/>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-white">Cancel</button>
          <button onClick={() => onSubmit({ patient_id: patientId, override_type: type, reason, override_value: 'clinician_reviewed' })}
            disabled={!reason.trim() || pending}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {pending ? <Loader2 size={13} className="animate-spin"/> : <CheckCircle size={13}/>}
            Submit Override
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* -- Main page -------------------------------------------------------------- */
export default function AIInsights() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab,         setActiveTab]         = useState('all');
  const [deepDivePatientId, setDeepDivePatientId] = useState(null);
  const [showOverride,      setShowOverride]      = useState(false);
  const [page,              setPage]              = useState(0);

  /* -- Queries ------------------------------------------------------------- */
  const { data: sysData, isLoading: sysLoading, dataUpdatedAt } = useQuery({
    queryKey: ['system-insights'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${API_URL}/api/ai-analysis/system-insights`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
    refetchInterval: 30000, staleTime: 25000, retry: false,
  });
  // Use the richer ML risk endpoint (XGBoost + per-task SHAP)
  const { data: mlRisk, isLoading: predLoading } = useQuery({
    queryKey: ['ml-risk', deepDivePatientId],
    queryFn: () => mlAPI.getPatientRisk(deepDivePatientId).then(r => r.data),
    enabled: !!deepDivePatientId, staleTime: 5*60*1000, retry: false,
  });
  // Also fetch legacy predict for plain_english_explanation
  const { data: prediction } = useQuery({
    queryKey: ['ai-pred', deepDivePatientId],
    queryFn: () => aiAPI.predict(deepDivePatientId).then(r => r.data),
    enabled: !!deepDivePatientId, staleTime: 5*60*1000, retry: false,
  });
  const { data: deterioration } = useQuery({
    queryKey: ['deterioration', deepDivePatientId],
    queryFn: () => advancedMlAPI.getDeterioration(deepDivePatientId).then(r => r.data),
    enabled: !!deepDivePatientId, staleTime: 5*60*1000, retry: false,
  });
  const { data: drugData } = useQuery({
    queryKey: ['drug-ints', deepDivePatientId],
    queryFn: () => advancedMlAPI.getDrugInteractions(deepDivePatientId).then(r => r.data),
    enabled: !!deepDivePatientId, staleTime: 5*60*1000, retry: false,
  });
  const { data: mlStatus } = useQuery({
    queryKey: ['ml-status'],
    queryFn: () => mlAPI.getStatus().then(r => r.data),
    staleTime: 5*60*1000, retry: false,
  });

  /* -- Mutations ----------------------------------------------------------- */
  const scanMutation = useMutation({
    mutationFn: () => mlAPI.triggerScan(),
    onSuccess: () => { toast.success('AI scan triggered'); queryClient.invalidateQueries(['system-insights']); },
    onError: () => toast.error('Scan failed'),
  });
  const overrideMutation = useMutation({
    mutationFn: d => ethicsAPI.createClinicalOverride(d),
    onSuccess: () => { toast.success('Override logged'); setShowOverride(false); },
    onError: () => toast.error('Override failed'),
  });

  /* -- Derived ------------------------------------------------------------- */
  const criticalList      = sysData?.critical_patients      || [];
  const deterioratingList = sysData?.deteriorating_patients || [];
  const stableList        = sysData?.stable_patients        || [];
  const allInsights       = [...criticalList, ...deterioratingList, ...stableList];
  const immediateActions  = sysData?.immediate_actions      || [];

  const tabInsights = {
    all:          allInsights,
    critical:     criticalList,
    deteriorating:[...criticalList, ...deterioratingList],
    stable:       stableList,
  };
  const displayed = tabInsights[activeTab] || allInsights;

  const normalizeInsight = i => ({
    ...i,
    priority: i.priority || (criticalList.includes(i) ? 'CRITICAL' : deterioratingList.includes(i) ? 'HIGH' : 'LOW'),
    key_concerns: typeof i.key_concerns === 'string' ? i.key_concerns.split('. ').filter(Boolean) : (i.key_concerns || []),
    recommendations: typeof i.recommended_actions === 'string' ? i.recommended_actions.split('. ').filter(Boolean) : (i.recommendations || []),
  });

  const riskScore  = mlRisk?.overall_risk ?? prediction?.risk_score ?? 0;
  // Build SHAP data from the richest available source:
  // mlRisk.tasks has per-task top_features [{feature, display_name, value, shap_value, impact, pct}]
  // prediction.shap_features has [{feature_name, shap_value, feature_value, display_value}]
  const shapFeatures = (() => {
    // Collect all top_features across tasks from mlRisk
    if (mlRisk?.tasks) {
      const all = Object.values(mlRisk.tasks)
        .flatMap(t => (t.top_features || []).map(f => ({ ...f, task: t.task })));
      // Deduplicate by display_name, keep highest abs shap_value
      const map = {};
      all.forEach(f => {
        const key = f.display_name || f.feature;
        if (!map[key] || Math.abs(f.shap_value) > Math.abs(map[key].shap_value)) map[key] = f;
      });
      const arr = Object.values(map).sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value)).slice(0, 8);
      if (arr.length) return arr.map(f => ({
        name: f.display_name || f.feature,
        value: parseFloat((f.shap_value * 100).toFixed(1)),
        pct: f.pct,
        displayValue: f.value != null ? String(f.value) : '',
        impact: f.impact,
      }));
    }
    // Fallback to legacy predict shap_features
    if (prediction?.shap_features) {
      return prediction.shap_features.slice(0, 8).map(f => ({
        name: f.feature_name,
        value: parseFloat((f.shap_value * 100).toFixed(1)),
        displayValue: f.display_value || String(f.feature_value),
        impact: f.shap_value > 0 ? 'increases_risk' : 'decreases_risk',
      }));
    }
    return null;
  })();
  const severeInts = (drugData?.interactions || []).filter(i => i.severity === 'severe' || i.severity === 'major');

  const handleTab = v => { setActiveTab(v); setPage(0); };

  const pageCount = Math.ceil(displayed.length / PAGE_SIZE);
  const paginated = displayed.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }}
      className="min-h-screen space-y-6 pb-10">

      <PageHeader image="/resources/cards/card-ai-insights.jpg" title="AI Clinical Insights"
        subtitle="Machine learning · Proactive system-wide monitoring · Auto-refreshes every 30s" icon={Brain}>
        <button onClick={() => queryClient.invalidateQueries(['system-insights'])}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl border border-white/30 text-sm font-semibold transition-all">
          <RefreshCw size={14}/> Refresh
        </button>
        <button onClick={() => scanMutation.mutate()} disabled={scanMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600/80 hover:bg-violet-700 backdrop-blur-sm text-white rounded-xl border border-violet-400/40 text-sm font-bold disabled:opacity-60 transition-all">
          {scanMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <Zap size={14}/>}
          Run AI Scan
        </button>
      </PageHeader>

      {/* AI Summary banner */}
      {(sysData?.clinical_summary || sysData?.summary) && (
        <div className="px-6">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-xl p-4 shadow-lg shadow-violet-500/20 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none"/>
            <div className="relative z-10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Sparkles size={15} className="text-white"/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-bold text-white text-sm">AI Clinical Summary</p>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">🧠 AI-POWERED</span>
                  {dataUpdatedAt && (
                    <span className="text-white/50 text-[10px]">
                      {new Date(dataUpdatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="text-violet-100 text-sm leading-relaxed">{sysData.clinical_summary || sysData.summary}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Immediate actions */}
      {immediateActions.length > 0 && (
        <div className="px-6">
          <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-red-600 to-rose-600 flex items-center gap-2">
              <AlertTriangle size={15} className="text-white animate-pulse"/>
              <p className="font-bold text-white text-sm">Immediate Actions Required</p>
              <span className="ml-auto w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-black">{immediateActions.length}</span>
            </div>
            <div className="p-3 space-y-1.5">
              {immediateActions.slice(0, 4).map((a, i) => {
                const name = a?.patient_name || a?.patient || (typeof a === 'string' ? a : `Patient #${a.patient_id}`);
                const act  = a?.action || a?.recommendations?.[0] || 'Requires immediate attention';
                const urg  = a?.urgency || a?.priority || 'HIGH';
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .05 }}
                    className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 hover:bg-red-100 transition-colors">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-full flex-shrink-0 ${urg === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>{urg}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate">{name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{act}</p>
                    </div>
                    {a?.patient_id && (
                      <button onClick={() => navigate(`/patients/${a.patient_id}`)}
                        className="flex items-center gap-0.5 text-[10px] font-bold text-red-700 hover:text-red-900 flex-shrink-0 hover:underline">
                        View <ChevronRight size={10}/>
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs — the only filter mechanism */}
      <div className="px-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {[
                { v: 'all',           l: 'All',           n: allInsights.length,                          active: 'bg-violet-600 text-white' },
                { v: 'critical',      l: 'Critical',      n: criticalList.length,                         active: 'bg-red-600 text-white' },
                { v: 'deteriorating', l: 'Deteriorating', n: criticalList.length + deterioratingList.length, active: 'bg-amber-500 text-white' },
                { v: 'stable',        l: 'Stable',        n: stableList.length,                           active: 'bg-emerald-600 text-white' },
              ].map(({ v, l, n, active }) => (
                <button key={v} onClick={() => handleTab(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === v ? active + ' shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-white'
                  }`}>
                  {l} <span className={`ml-1 ${activeTab === v ? 'opacity-80' : 'text-slate-400'}`}>({n})</span>
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"/>
              Auto-refresh 30s
            </div>
          </div>
        </div>
      </div>

      {/* -- TWO-COLUMN LAYOUT -------------------------------------------- */}
      <div className="px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">

          {/* LEFT: Patient list -- paginated, no infinite scroll */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  activeTab === 'critical' ? 'bg-red-500 animate-pulse' :
                  activeTab === 'deteriorating' ? 'bg-amber-500' :
                  activeTab === 'stable' ? 'bg-emerald-500' : 'bg-violet-500'
                }`}/>
                Patient Insights
                <span className="text-sm font-normal text-slate-400">({displayed.length} total)</span>
              </h2>
              {pageCount > 1 && (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    className="w-8 h-8 rounded-xl border-2 border-slate-200 hover:border-violet-400 hover:text-violet-600 disabled:opacity-40 flex items-center justify-center text-slate-500 transition-all text-sm font-bold">&#8249;</button>
                  <span className="text-sm text-slate-500 font-semibold min-w-[48px] text-center">{page + 1} / {pageCount}</span>
                  <button onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page === pageCount - 1}
                    className="w-8 h-8 rounded-xl border-2 border-slate-200 hover:border-violet-400 hover:text-violet-600 disabled:opacity-40 flex items-center justify-center text-slate-500 transition-all text-sm font-bold">&#8250;</button>
                </div>
              )}
            </div>

            {sysLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center h-64 gap-3 shadow-sm">
                <Loader2 size={32} className="animate-spin text-violet-600"/>
                <p className="text-sm text-slate-500 font-medium">Analysing all patients...</p>
              </div>
            ) : displayed.length === 0 ? (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 flex flex-col items-center justify-center h-64 gap-3 shadow-sm">
                <CheckCircle className="w-14 h-14 text-emerald-500 opacity-80"/>
                <p className="text-emerald-800 font-bold text-base">All clear</p>
                <p className="text-emerald-600 text-sm">No patients in this category right now.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
                <AnimatePresence mode="popLayout">
                  {paginated.map((insight, i) => (
                    <PatientCard
                      key={insight.patient_id || i}
                      insight={normalizeInsight(insight)}
                      isSelected={deepDivePatientId === insight.patient_id}
                      onDeepDive={id => { setDeepDivePatientId(prev => prev === id ? null : id); setShowOverride(false); }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination dots */}
            {pageCount > 1 && (
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: pageCount }, (_, idx) => (
                  <button key={idx} onClick={() => setPage(idx)}
                    className={`rounded-full transition-all duration-200 ${idx === page ? 'w-8 h-2.5 bg-violet-600' : 'w-2.5 h-2.5 bg-slate-300 hover:bg-violet-400'}`}/>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Deep-dive panel (sticky) */}
          <div className="lg:sticky lg:top-4">
            <AnimatePresence mode="wait">
              {deepDivePatientId ? (
                <motion.div key={deepDivePatientId}
                  initial={{ opacity: 0, x: 20, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 20, scale: 0.98 }}
                  className="bg-white rounded-2xl border-2 border-violet-200 overflow-hidden shadow-xl shadow-violet-100">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Brain size={15} className="text-white"/>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm">XGBoost Deep-Dive</p>
                        <p className="text-violet-200 text-[10px]">Patient #{deepDivePatientId} · SHAP analysis</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {(user?.role === 'clinician' || user?.role === 'admin') && (
                        <button onClick={() => setShowOverride(true)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-400/20 hover:bg-amber-400/40 border border-amber-300/30 text-white rounded-xl text-[10px] font-bold transition">
                          <ShieldAlert size={10}/> Override
                        </button>
                      )}
                      <button onClick={() => setDeepDivePatientId(null)}
                        className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                        <X size={13} className="text-white"/>
                      </button>
                    </div>
                  </div>

                  {predLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 size={24} className="animate-spin text-violet-600"/>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3 max-h-[calc(100vh-14rem)] overflow-y-auto">

                      {/* Drug interactions */}
                      {severeInts.length > 0 && (
                        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
                          <Pill size={14} className="text-red-600 flex-shrink-0 mt-0.5"/>
                          <div>
                            <p className="font-bold text-red-900 text-xs mb-0.5">
                              {severeInts.length} Severe Drug Interaction{severeInts.length > 1 ? 's' : ''}
                            </p>
                            {severeInts.map((it, j) => (
                              <p key={j} className="text-[11px] text-red-700">
                                <strong>{it.drug1}</strong> + <strong>{it.drug2}</strong>
                                {it.description ? `: ${it.description}` : ''}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Risk overview */}
                      <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                        <RiskGauge score={riskScore}/>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="bg-white rounded-xl border border-slate-100 p-2 text-center">
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Risk Level</p>
                            <p className="text-xs font-black text-slate-800 capitalize">{mlRisk?.overall_level || prediction?.risk_level || 'N/A'}</p>
                          </div>
                          <div className="bg-white rounded-xl border border-slate-100 p-2 text-center">
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Pathway</p>
                            <p className="text-[10px] font-bold text-slate-700 capitalize leading-tight">
                              {(mlRisk?.highest_task || prediction?.predicted_pathway || 'Unknown').replace(/_/g, ' ')}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl border border-slate-100 p-2 text-center">
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Confidence</p>
                            <p className="text-xs font-black text-slate-800">
                              {prediction?.confidence ? `${Math.round(prediction.confidence * 100)}%` : (mlRisk ? '—' : 'N/A')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Key concerns from ML risk */}
                      {mlRisk?.key_concerns?.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <AlertTriangle size={11}/> Key Concerns
                          </p>
                          <ul className="space-y-1">
                            {mlRisk.key_concerns.slice(0, 4).map((c, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-amber-900">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5"/>
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* SHAP feature bars */}
                      <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <Zap size={10}/> SHAP Feature Impact
                        </p>
                        <ShapChart features={shapFeatures}/>
                      </div>

                      {/* Task breakdown (top 5 tasks) */}
                      {mlRisk?.tasks && Object.keys(mlRisk.tasks).length > 0 && (
                        <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Risk by Clinical Domain</p>
                          <div className="space-y-3">
                            {Object.entries(mlRisk.tasks)
                              .sort((a, b) => (b[1].probability || 0) - (a[1].probability || 0))
                              .slice(0, 5)
                              .map(([key, task]) => {
                                const pct = Math.round((task.probability || 0) * 100);
                                const isHigh = pct > 60;
                                const isMid  = pct > 30;
                                const barColor  = isHigh ? 'bg-red-500'     : isMid ? 'bg-amber-500'   : 'bg-emerald-500';
                                const chipColor = isHigh
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : isMid
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                const levelLabel = task.risk_level
                                  ? task.risk_level.charAt(0).toUpperCase() + task.risk_level.slice(1)
                                  : (isHigh ? 'High' : isMid ? 'Moderate' : 'Normal');
                                return (
                                  <div key={key}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-semibold text-slate-700 capitalize">
                                        {key.replace(/_/g, ' ')}
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${chipColor}`}>
                                          {levelLabel}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-500 tabular-nums w-7 text-right">
                                          {pct}%
                                        </span>
                                      </div>
                                    </div>
                                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                      <motion.div className={`h-full rounded-full ${barColor}`}
                                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.5, ease: 'easeOut' }}/>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Plain-English explanation */}
                      {prediction?.plain_english_explanation && (
                        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl p-3">
                          <Brain size={13} className="text-blue-600 flex-shrink-0 mt-0.5"/>
                          <div>
                            <p className="text-[10px] font-bold text-blue-700 mb-1">AI Explanation</p>
                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                              {prediction.plain_english_explanation}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Recommended actions */}
                      {mlRisk?.recommended_actions?.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <CheckCircle size={11}/> Recommended Actions
                          </p>
                          <ul className="space-y-1">
                            {mlRisk.recommended_actions.slice(0, 4).map((r, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-emerald-900">
                                <ChevronRight size={11} className="flex-shrink-0 mt-0.5 text-emerald-600"/>
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Deterioration */}
                      {deterioration && (
                        <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Deterioration Risk (30d)</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { l: 'Risk',  v: deterioration.deterioration_risk != null ? `${Math.round(deterioration.deterioration_risk * 100)}%` : 'N/A', c: 'text-rose-600' },
                              { l: 'Trend', v: deterioration.trend_direction || 'Stable', c: 'text-violet-600' },
                            ].map(({ l, v, c }) => (
                              <div key={l} className="bg-white rounded-xl border border-slate-100 p-2.5 text-center">
                                <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">{l}</p>
                                <p className={`text-sm font-black capitalize ${c}`}>{v}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* View patient */}
                      <button onClick={() => navigate(`/patients/${deepDivePatientId}`)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-bold text-sm transition shadow-md shadow-teal-500/25">
                        View Full Patient Record <ChevronRight size={14}/>
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-gradient-to-br from-violet-50 to-indigo-50 border-2 border-dashed border-violet-200 rounded-2xl p-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                    <Brain size={28} className="text-violet-500"/>
                  </div>
                  <p className="font-bold text-violet-800 text-base mb-1">Select a patient</p>
                  <p className="text-violet-500 text-sm leading-relaxed">Click "XAI Deep-Dive" on any patient card to view detailed ML analysis, SHAP feature impact, and risk breakdown here.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="px-6">
        <div className="flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <span className="flex items-center gap-1.5">
            <Activity size={11}/>
            Model: XGBoost v{mlStatus?.model_version || '1.0'} ·
            <span className={mlStatus?.status === 'active' ? 'text-teal-600 font-bold' : ''}>{mlStatus?.status || 'Unknown'}</span>
          </span>
          <span>Proactive monitoring · SHAP explainability · Auto-refresh 30s</span>
        </div>
      </div>

      <AnimatePresence>
        {showOverride && deepDivePatientId && (
          <OverrideModal patientId={deepDivePatientId} onClose={() => setShowOverride(false)}
            onSubmit={d => overrideMutation.mutate(d)} pending={overrideMutation.isPending}/>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
