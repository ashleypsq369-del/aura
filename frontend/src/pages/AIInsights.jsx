/**
 * AIInsights · Clinical Intelligence Hub v3
 * ==========================================
 * Design: Premium medical dark-header + card-based layout
 * Inspired by: Dribbble Netra (deep-slate + glow), Behance patient management
 * (dense cards, avatar rings, real-time indicators), fuselabcreative (surface
 * critical first, single-action deep-dive, coherent color system).
 *
 * Layout:
 * [Gradient dark hero header with KPI pills]
 * [3 main tabs: Risk | Drugs | System]
 * [LEFT: patient card list 55% | RIGHT: deep-dive panel 45% (sticky)]
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Brain, AlertTriangle, CheckCircle, TrendingDown, Search,
 RefreshCw, Activity, AlertCircle, Zap, Pill, Clock,
 Users, TrendingUp, ExternalLink, Loader2, BarChart2,
 Shield, X, Cpu, Beaker, ChevronRight, ListFilter,
 Heart, Target, Stethoscope,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { aiAPI, advancedMlAPI, mlAPI, patientsAPI } from '../api/client';
import PageHeader from '../components/PageHeader';
import toast from '../utils/toast';
import {
 ResponsiveContainer, RadialBarChart, RadialBar,
 BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

/* --- Design tokens ----------------------------------------------------------- */
const RISK = {
 critical: {
 border: 'border-l-red-500', glow: 'shadow-red-500/20',
 ring: 'ring-2 ring-red-500/40', bg: 'bg-slate-50',
 badge: 'bg-red-600 text-white', text: 'text-red-600',
 barColor: '#e11d48', gradFrom: 'from-red-600', gradTo: 'to-rose-700',
 dot: 'bg-red-500 animate-pulse',label: 'Critical', Icon: AlertTriangle,
 avatarGrad: 'from-red-600 to-rose-700',
 topStripe: true,
 },
 high: {
 border: 'border-l-orange-500', glow: 'shadow-orange-500/20',
 ring: 'ring-2 ring-orange-400/40', bg: 'bg-slate-50',
 badge: 'bg-orange-500 text-white', text: 'text-orange-600',
 barColor: '#f97316', gradFrom: 'from-orange-500', gradTo: 'to-amber-600',
 dot: 'bg-orange-500', label: 'High Risk', Icon: AlertCircle,
 avatarGrad: 'from-orange-500 to-amber-600',
 topStripe: false,
 },
 moderate: {
 border: 'border-l-amber-500', glow: 'shadow-amber-400/15',
 ring: 'ring-2 ring-amber-400/30', bg: 'bg-slate-50',
 badge: 'bg-amber-500 text-white', text: 'text-amber-600',
 barColor: '#d97706', gradFrom: 'from-amber-500', gradTo: 'to-orange-500',
 dot: 'bg-amber-500', label: 'Moderate', Icon: Activity,
 avatarGrad: 'from-amber-500 to-orange-500',
 topStripe: false,
 },
 low: {
 border: 'border-l-teal-500', glow: 'shadow-teal-500/10',
 ring: '', bg: 'bg-slate-50',
 badge: 'bg-teal-600 text-white',text: 'text-teal-600',
 barColor: '#0d9488', gradFrom: 'from-teal-600', gradTo: 'to-emerald-600',
 dot: 'bg-teal-500', label: 'Stable', Icon: CheckCircle,
 avatarGrad: 'from-teal-500 to-emerald-600',
 topStripe: false,
 },
 unknown: {
 border: 'border-l-slate-400', glow: '',
 ring: '', bg: 'bg-slate-50',
 badge: 'bg-slate-500 text-white',text: 'text-slate-500',
 barColor: '#94a3b8', gradFrom: 'from-slate-500', gradTo: 'to-slate-600',
 dot: 'bg-slate-400', label: 'Unknown', Icon: Shield,
 avatarGrad: 'from-slate-500 to-slate-600',
 topStripe: false,
 },
};

function riskToken(level) {
 const l = (level || '').toLowerCase();
 if (l === 'crisis' || l === 'critical') return RISK.critical;
 if (l === 'high') return RISK.high;
 if (l === 'moderate' || l === 'medium') return RISK.moderate;
 if (l === 'low' || l === 'normal' || l === 'stable') return RISK.low;
 return RISK.unknown;
}

const TASK_SHORT = {
 vital_risk: 'Vitals', symptom_burden: 'Symptoms',
 functional_decline: 'ADL', cognitive_impairment: 'Cognition',
 mental_health_risk: 'Mental', medication_risk: 'Meds',
 caregiver_burden: 'Caregiver', admission_risk: 'Admission',
};

function getInitials(name = '') {
 return name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
}

/* --- Mini radial risk gauge -------------------------------------------------- */
function RiskGauge({ score = 0, size = 52 }) {
 const pct = Math.round(score * 100);
 const color = score > 0.7 ? '#e11d48' : score > 0.4 ? '#f97316' : '#16a34a';
 return (
 <div className="flex flex-col items-center" style={{ width: size }}>
 <ResponsiveContainer width={size} height={Math.round(size * 0.72)}>
 <RadialBarChart cx="50%" cy="82%" innerRadius="56%" outerRadius="88%"
 barSize={6} data={[{ value: pct, fill: color }]} startAngle={180} endAngle={0}>
 <RadialBar minAngle={4} background={{ fill: '#f1f5f9' }} clockWise dataKey="value" cornerRadius={4} />
 </RadialBarChart>
 </ResponsiveContainer>
 <span className="font-black tabular-nums leading-none" style={{ fontSize: size < 50 ? 10 : 12, color }}>{pct}%</span>
 </div>
 );
}

/* --- 8-task compact pill grid · solid colors, white text, skip zeros ---------- */
function TaskGrid({ tasks }) {
 if (!tasks || !Object.keys(tasks).length) return null;
 const entries = Object.entries(tasks)
 .map(([key, t]) => [key, t, Math.round((t.probability || 0) * 100)])
 .filter(([, , pct]) => pct > 0) // skip 0% tasks
 .sort(([, , a], [, , b]) => b - a); // highest first

 if (!entries.length) return null; // all zeros · show nothing

 return (
 <div className="flex flex-wrap gap-1 mt-2">
 {entries.slice(0, 6).map(([key, , pct]) => {
 const [bg, txt, borderC] = pct > 70
 ? ['#fef2f2', '#dc2626', '#fca5a5']
 : pct > 40
 ? ['#fff7ed', '#ea580c', '#fed7aa']
 : pct > 15
 ? ['#fefce8', '#ca8a04', '#fde68a']
 : ['#f8fafc', '#64748b', '#e2e8f0'];
 return (
 <span key={key}
 className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
 style={{ background: bg, color: txt, border: `1px solid ${borderC}` }}>
 {TASK_SHORT[key] || key}
 <span className="font-bold opacity-80">{pct}%</span>
 </span>
 );
 })}
 </div>
 );
}

/* --- SHAP / Feature Importance display --------------------------------------- */
function ShapBars({ features, shapAvailable }) {
 if (!features?.length) return (
 <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
 <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center">
 <CheckCircle size={22} className="text-teal-600" />
 </div>
 <p className="text-sm font-bold text-slate-700">Low Risk Profile</p>
 <p className="text-xs text-[var(--text-400)] max-w-[200px]">
 No significant risk drivers detected. This patient appears to have a stable health profile.
 </p>
 </div>
 );

 const maxPct = Math.max(...features.map(f => f.pct || 0), 1);

 return (
 <div className="space-y-2.5">
 {/* Mode indicator */}
 <div className="flex items-center gap-2 pb-1">
 <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${
 shapAvailable
 ? 'bg-teal-600 text-white'
 : 'bg-amber-500 text-white'
 }`}>
 {shapAvailable ? 'XGBoost SHAP' : 'Feature Importance'}
 </span>
 <span className="text-[10px] text-slate-500">
 {shapAvailable
 ? 'Real SHAP values · mathematically precise feature contributions'
 : 'Fallback: XGBoost feature importance (SHAP computation unavailable)'
 }
 </span>
 </div>

 {features.map((f, i) => {
 const risk = f.impact === 'increases_risk' || f.shap_value > 0;
 const neutral = f.impact === 'neutral';
 // Bar width relative to max pct in this set
 const barW = Math.round((f.pct / maxPct) * 100);

 const rowCls = neutral
 ? 'bg-[var(--card-bg)] border-slate-200'
 : risk
 ? 'bg-red-50 border-red-100'
 : 'bg-emerald-50 border-emerald-100';

 const barCls = neutral
 ? 'bg-slate-400'
 : risk
 ? 'bg-gradient-to-r from-red-500 to-rose-600'
 : 'bg-gradient-to-r from-emerald-500 to-teal-600';

 const iconCls = neutral
 ? 'bg-slate-400'
 : risk ? 'bg-red-500' : 'bg-emerald-500';

 return (
 <motion.div key={i}
 initial={{ opacity: 0, y: 4 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.04 }}
 className={`rounded-xl border p-3 ${rowCls}`}
 >
 {/* Row top: icon + name + value badges */}
 <div className="flex items-start gap-2.5 mb-2">
 {/* Direction dot */}
 <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${iconCls}`}>
 {neutral ? (
 <span className="w-2 h-2 rounded-full bg-slate-50" />
 ) : risk ? (
 <TrendingUp size={11} className="text-white" />
 ) : (
 <TrendingDown size={11} className="text-white" />
 )}
 </span>

 <div className="flex-1 min-w-0">
 <p className="text-xs font-bold text-[var(--text-800)] leading-tight truncate">
 {f.name}
 </p>
 {/* Clinical measurement value */}
 {f.feature_value !== undefined && f.feature_value !== 0 && (
 <p className="text-[10px] text-[var(--text-500)] mt-0.5">
 Value: <span className="font-bold text-slate-700">{
 typeof f.feature_value === 'number'
 ? f.feature_value % 1 === 0
 ? f.feature_value
 : f.feature_value.toFixed(1)
 : f.feature_value
 }</span>
 </p>
 )}
 </div>

 {/* SHAP / importance badges */}
 <div className="flex flex-col items-end gap-1 flex-shrink-0">
 {/* Importance % badge */}
 <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
 neutral
 ? 'bg-slate-100 text-slate-600'
 : risk
 ? 'bg-red-600 text-white'
 : 'bg-emerald-600 text-white'
 }`}>
 {f.pct.toFixed(1)}% importance
 </span>
 {/* SHAP value (only if real SHAP, not zero) */}
 {shapAvailable && f.shap_value !== 0 && (
 <span className="text-[9px] text-[var(--text-400)] font-mono">
 SHAP: {f.shap_value > 0 ? '+' : ''}{f.shap_value.toFixed(4)}
 </span>
 )}
 </div>
 </div>

 {/* Relative importance bar */}
 <div className="h-1.5 rounded-full bg-white/80 overflow-hidden">
 <motion.div
 className={`h-full rounded-full ${barCls}`}
 initial={{ width: 0 }}
 animate={{ width: `${barW}%` }}
 transition={{ duration: 0.5, delay: i * 0.04 }}
 />
 </div>
 </motion.div>
 );
 })}

 <div className="flex gap-4 pt-1 border-t border-slate-100">
 <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
 <span className="w-2.5 h-2.5 rounded-full bg-red-500" />Increases risk
 </span>
 <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
 <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Decreases risk
 </span>
 <span className="flex items-center gap-1.5 text-[10px] text-[var(--text-400)] ml-auto">
 Bar width = relative importance
 </span>
 </div>
 </div>
 );
}

/* --- Premium patient card ----------------------------------------------------
 Design: Avatar ring with risk color glow, compact data density, two CTA buttons
 ------------------------------------------------------------------------------- */
function PatientCard({ p, isSelected, onSelect, onNavigate }) {
 const tok = riskToken(p.risk_level);
 const pct = Math.round((p.overall_risk || 0) * 100);
 const name = p.full_name || p.patient_name || 'Unknown Patient';

 return (
 <motion.div
 layout
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.97 }}
 whileHover={{ y: -1 }}
 transition={{ type: 'spring', damping: 28, stiffness: 400 }}
 className={`
 relative rounded-2xl border border-[var(--card-border)] overflow-hidden cursor-pointer
 shadow-sm transition-all duration-150
 border-l-4 ${tok.border}
 ${isSelected
 ? `${tok.ring} shadow-lg`
 : `hover:shadow-md hover:border-slate-300`
 }
 `}
 style={{ background: '#ffffff' }}
 onClick={() => onSelect(p.id)}
 >
 {/* Critical pulsing top border */}
 {(p.risk_level?.toLowerCase() === 'critical' || p.risk_level?.toLowerCase() === 'crisis') && (
 <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 via-rose-400 to-red-600 animate-pulse" />
 )}

 <div className="p-4">
 {/* Top row: Avatar + name + risk badge + gauge */}
 <div className="flex items-start gap-3 mb-3">
 {/* Avatar with risk-colored ring */}
 <div className="relative flex-shrink-0">
 <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tok.avatarGrad} flex items-center justify-center text-white font-black text-sm shadow-md`}>
 {getInitials(name)}
 </div>
 {/* Live status dot */}
 <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${tok.dot}`} />
 </div>

 {/* Patient info */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
 <span className="font-bold text-[var(--text-900)] text-sm leading-tight truncate">{name}</span>
 <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide ${tok.badge}`}>
 {tok.label}
 </span>
 </div>
 <div className="flex items-center gap-2 text-[11px] text-[var(--text-400)] dark:text-slate-500">
 {p.patient_code && <span className="font-semibold">{p.patient_code}</span>}
 {p.age && <><span className="opacity-40">·</span><span>{p.age}y</span></>}
 {p.gender && <><span className="opacity-40">·</span><span>{p.gender}</span></>}
 </div>
 </div>

 {/* Risk gauge */}
 <div className="flex-shrink-0">
 <RiskGauge score={p.overall_risk || 0} size={48} />
 </div>
 </div>

 {/* Diagnosis / top concern */}
 {(p.top_concern || p.primary_diagnosis) && (
 <div className="flex items-start gap-1.5 mb-2.5">
 <Target size={11} className="text-amber-400 flex-shrink-0 mt-0.5" />
 <p className="text-[11px] text-[var(--text-600)] dark:text-[var(--text-400)] leading-snug line-clamp-1 font-medium">
 {p.top_concern || p.primary_diagnosis}
 </p>
 </div>
 )}

 {/* First key concern */}
 {p.key_concerns?.[0] && (
 <div className="flex items-start gap-1.5 mb-2.5 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
 <AlertTriangle size={10} className="text-amber-500 flex-shrink-0 mt-0.5" />
 <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-snug line-clamp-1">{p.key_concerns[0]}</p>
 </div>
 )}

 {/* Task mini-bars grid */}
 {p.tasks && Object.keys(p.tasks).length > 0 && (
 <div className="mb-3">
 <TaskGrid tasks={p.tasks} />
 </div>
 )}

 {/* Action buttons */}
 <div className="flex items-center gap-2 pt-2.5 border-t border-[var(--card-border)]/50 dark:border-slate-700/50">
 <button
 onClick={e => { e.stopPropagation(); onNavigate(p.id || p.patient_id); }}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-[var(--text-700)] rounded-lg text-xs font-bold transition"
 >
 <ExternalLink size={11} /> View Patient
 </button>
 <button
 onClick={e => { e.stopPropagation(); onSelect(p.id); }}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ml-auto ${
 isSelected
 ? 'bg-teal-700 text-white'
 : 'bg-teal-600 hover:bg-teal-700 text-white'
 }`}
 >
 <Brain size={11} /> {isSelected ? 'Close' : 'Deep-Dive'}
 </button>
 </div>
 </div>
 </motion.div>
 );
}

/* --- Deep-Dive right panel · redesigned ------------------------------------ */
function DeepDivePanel({ patient, navigate, onClose }) {
 const pid = String(patient.id || patient.patient_id);
 const [innerTab, setInnerTab] = useState('overview');
 const tok = riskToken(patient.risk_level);

 const { data: mlRisk, isLoading: mlLoad } = useQuery({
 queryKey: ['ml-risk', pid],
 queryFn: () => mlAPI.getPatientRisk(pid).then(r => r.data),
 enabled: !!pid, staleTime: 5 * 60 * 1000, retry: false,
 });
 const { data: deterioration } = useQuery({
 queryKey: ['deterioration', pid],
 queryFn: () => advancedMlAPI.getDeterioration(pid).then(r => r.data),
 enabled: !!pid, staleTime: 5 * 60 * 1000, retry: false,
 });
 const { data: drugData } = useQuery({
 queryKey: ['drug-ints', pid],
 queryFn: () => advancedMlAPI.getDrugInteractions(pid).then(r => r.data),
 enabled: !!pid, staleTime: 5 * 60 * 1000, retry: false,
 });

 const riskScore = mlRisk?.overall_risk ?? (patient.overall_risk || 0);
 const severeInts = (drugData?.interactions || []).filter(i => ['severe','SEVERE','major'].includes(i.severity));

 const shapFeatures = useMemo(() => {
 if (!mlRisk?.tasks) return null;

 // Collect top features from all tasks, deduplicate by display_name,
 // keep whichever task gives the highest pct (importance %)
 const map = {};
 Object.values(mlRisk.tasks).forEach(t => {
 (t.top_features || []).forEach(f => {
 const k = f.display_name || f.feature;
 if (!map[k] || (f.pct || 0) > (map[k].pct || 0)) {
 map[k] = f;
 }
 });
 });

 const arr = Object.values(map)
 .filter(f => (f.pct || f.importance || 0) > 0) // only features with non-zero importance
 .sort((a, b) => (b.pct || b.importance || 0) - (a.pct || a.importance || 0))
 .slice(0, 10);

 if (!arr.length) return null;

 return arr.map(f => ({
 name: f.display_name || f.feature,
 shap_value: f.shap_value, // raw SHAP value (may be 0 for fallback)
 pct: f.pct || 0, // importance % · always meaningful
 impact: f.impact,
 feature_value: f.value, // actual clinical measurement
 shap_available: mlRisk.tasks[Object.keys(mlRisk.tasks)[0]]?.shap_available ?? false,
 }));
 }, [mlRisk]);

 const sortedTasks = Object.entries(mlRisk?.tasks || {}).sort(([, a], [, b]) => (b.probability || 0) - (a.probability || 0));

 const TABS = [
 { id: 'overview', label: 'Overview', Icon: Stethoscope },
 { id: 'shap', label: 'AI Explain', Icon: Zap },
 { id: 'domains', label: 'Domains', Icon: BarChart2 },
 { id: 'timeline', label: 'Timeline', Icon: TrendingDown },
 ];

 /* avatar initials */
 const initials = (patient.full_name || patient.patient_name || 'P')
 .split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
 const riskPct = Math.round(riskScore * 100);
 const hdrBg = tok.label === 'Critical' ? 'linear-gradient(135deg,#991b1b,#b91c1c)'
 : tok.label === 'High' ? 'linear-gradient(135deg,#9a3412,#c2410c)'
 : (tok.label === 'Moderate' || tok.label === 'Medium') ? 'linear-gradient(135deg,#92400e,#b45309)'
 : 'linear-gradient(135deg,#065f46,#0f766e)';

 return (
 <motion.div key={pid}
 initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
 transition={{ type: 'spring', damping: 28, stiffness: 320 }}
 className="flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-[var(--card-border)] dark:border-slate-700 bg-[var(--card-bg)] dark:bg-slate-900"
 style={{ height: 'calc(100vh - 200px)', minHeight: 520 }}
 >
 {/* -- Header -- */}
 <div className="flex-shrink-0 relative overflow-hidden" style={{ background: hdrBg }}>
 <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white, transparent 60%)' }} />
 <div className="relative px-5 py-4">
 <div className="flex items-start gap-3">
 <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-lg"
 style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}>
 {initials}
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-bold text-white text-base leading-tight truncate">{patient.full_name || patient.patient_name}</p>
 <p className="text-white/60 text-xs mt-0.5 truncate">{patient.patient_code} · {patient.primary_diagnosis?.split('(')[0]?.trim() || ' - '}</p>
 <div className="flex items-center gap-2 mt-2">
 <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wide">{tok.label}</span>
 {patient.age && <span className="text-[10px] text-white/50">{patient.age}y</span>}
 </div>
 </div>
 <div className="flex flex-col items-center flex-shrink-0">
 <span className="text-3xl font-black text-white tabular-nums leading-none">{riskPct}%</span>
 <span className="text-[9px] text-white/50 font-bold uppercase mt-0.5">risk</span>
 </div>
 <button onClick={onClose}
 className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition flex-shrink-0 self-start"
 style={{ background: 'rgba(255,255,255,0.15)' }}
 onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.3)'}
 onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
 <X size={14} />
 </button>
 </div>
 </div>
 </div>

 {/* Drug interaction alert bar */}
 {severeInts.length > 0 && (
 <div className="flex items-center gap-2 px-4 py-2 bg-red-600 flex-shrink-0">
 <Pill size={11} className="text-white flex-shrink-0" />
 <p className="text-xs font-bold text-white">
 {severeInts.length} severe drug interaction{severeInts.length > 1 ? 's' : ''} · review before administering
 </p>
 </div>
 )}

 {/* -- Pill tab bar -- */}
 <div className="flex-shrink-0 px-4 py-2.5 bg-[var(--card-bg)] border-b border-[var(--card-border)]/50 dark:border-slate-700">
 <div className="flex gap-1 bg-[var(--card-bg)] rounded-xl p-1 shadow-sm border border-[var(--card-border)]/50 dark:border-slate-600">
 {TABS.map(({ id, label, Icon: Ic }) => (
 <button key={id} onClick={() => setInnerTab(id)}
 className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all"
 style={innerTab === id
 ? { background: '#0d9488', color: 'white', boxShadow: '0 2px 8px rgba(13,148,136,0.25)' }
 : { color: '#94a3b8' }}
 onMouseEnter={e => { if (innerTab !== id) e.currentTarget.style.color = '#475569'; }}
 onMouseLeave={e => { if (innerTab !== id) e.currentTarget.style.color = '#94a3b8'; }}>
 <Ic size={11} className="flex-shrink-0" />{label}
 </button>
 ))}
 </div>
 </div>

 {/* -- Tab body -- */}
 <div className="flex-1 overflow-y-auto overscroll-contain">
 {mlLoad ? (
 <div className="flex flex-col items-center justify-center h-full gap-3">
 <div className="w-10 h-10 rounded-full border-2 border-violet-200 border-t-violet-600 animate-spin" />
 <p className="text-xs text-slate-400">Analysing with XGBoost - </p>
 </div>
 ) : (
 <div className="p-4 space-y-3">
 {/* -- OVERVIEW -- */}
 {innerTab === 'overview' && <>
 <div className="grid grid-cols-3 gap-2">
 {[
 { label:'Overall Risk', value:`${riskPct}%`, sub: tok.label,
 color: tok.label==='Critical'?'#ef4444':tok.label==='High'?'#f97316':tok.label==='Moderate'?'#f59e0b':'#10b981' },
 { label:'Domains', value: sortedTasks.filter(([,t])=>(t.probability||0)>0).length, sub:'elevated', color:'#818cf8' },
 { label:'Drug Flags', value: severeInts.length||(drugData?.interactions?.length??0), sub:'interactions',
 color: severeInts.length>0?'#ef4444':'#10b981' },
 ].map(s => (
 <div key={s.label} className="rounded-xl p-3 text-center bg-[var(--card-bg)] border border-[var(--card-border)]/50 dark:border-slate-700">
 <p className="text-xl font-black tabular-nums leading-none" style={{ color: s.color }}>{s.value}</p>
 <p className="text-[9px] text-[var(--text-400)] uppercase tracking-wide mt-0.5">{s.sub}</p>
 <p className="text-[10px] text-[var(--text-500)] font-semibold mt-0.5">{s.label}</p>
 </div>
 ))}
 </div>
 {/* Key concerns */}
 <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]/50 dark:border-slate-700 overflow-hidden">
 <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--card-border)]/50 dark:border-slate-700">
 <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
 <p className="text-xs font-bold text-[var(--text-700)] dark:text-slate-300">Key Concerns</p>
 {mlRisk?.key_concerns?.length > 0 && <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{mlRisk.key_concerns.length}</span>}
 </div>
 <div className="p-3 space-y-2">
 {mlRisk?.key_concerns?.length ? mlRisk.key_concerns.slice(0,5).map((c,i) => (
 <div key={i} className="flex items-start gap-2.5">
 <span className="w-5 h-5 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black">{i+1}</span>
 <p className="text-xs text-[var(--text-700)] leading-relaxed">{c}</p>
 </div>
 )) : (
 <div className="flex items-center gap-2 py-1 text-slate-400">
 <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
 <p className="text-xs">No critical concerns flagged</p>
 </div>
 )}
 </div>
 </div>

 {/* Recommended actions */}
 <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]/50 dark:border-slate-700 overflow-hidden">
 <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--card-border)]/50 dark:border-slate-700">
 <CheckCircle size={13} className="text-teal-500 flex-shrink-0" />
 <p className="text-xs font-bold text-[var(--text-700)] dark:text-slate-300">Recommended Actions</p>
 </div>
 <div className="p-3 space-y-2">
 {mlRisk?.recommended_actions?.length ? mlRisk.recommended_actions.slice(0,4).map((a,i) => (
 <div key={i} className="flex items-start gap-2.5">
 <span className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-teal-500"/></span>
 <p className="text-xs text-[var(--text-700)] leading-relaxed">{a}</p>
 </div>
 )) : <p className="text-xs text-[var(--text-400)] py-1">Continue current care plan and monitoring schedule.</p>}
 </div>
 </div>

 {/* Drug interactions */}
 {drugData?.interactions?.length > 0 && (
 <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]/50 dark:border-slate-700 overflow-hidden">
 <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--card-border)]/50 dark:border-slate-700">
 <Pill size={13} className="text-red-500 flex-shrink-0" />
 <p className="text-xs font-bold text-[var(--text-700)] dark:text-slate-300">Drug Interactions</p>
 <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700">{drugData.interactions.length}</span>
 </div>
 <div className="divide-y divide-slate-100 dark:divide-slate-700">
 {drugData.interactions.slice(0,4).map((it,i) => {
 const sev=['severe','SEVERE','major'].includes(it.severity);
 return (
 <div key={i} className="px-4 py-2.5 flex items-center gap-3">
 <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${sev?'bg-red-600 text-white':'bg-amber-500 text-white'}`}>{it.severity}</span>
 <p className="text-xs font-semibold flex-1 min-w-0 truncate text-[var(--text-800)] dark:text-slate-200">{it.drug1} + {it.drug2}</p>
 </div>
 );
 })}
 </div>
 </div>
 )}
 {drugData && !drugData.interactions?.length && (
 <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 flex items-center gap-2">
 <CheckCircle size={14} className="text-emerald-600 flex-shrink-0"/>
 <p className="text-xs font-semibold text-emerald-800">No drug interactions · medication profile is clear</p>
 </div>
 )}
 </>}

 {/* -- AI EXPLANATION -- */}
 {innerTab === 'shap' && (<>
 <div className="flex items-center gap-2 px-1">
 <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${sortedTasks.some(([,t])=>t.shap_available)?'bg-teal-600 text-white':'bg-amber-500 text-white'}`}>
 {sortedTasks.some(([,t])=>t.shap_available)?'XGBoost SHAP':'Feature Importance'}
 </span>
 <p className="text-[10px] text-slate-400">Factors driving this risk prediction</p>
 </div>
 <ShapBars features={shapFeatures} shapAvailable={sortedTasks.some(([,t])=>t.shap_available)} />
 </>)}

 {/* -- DOMAINS -- */}
 {innerTab === 'domains' && (() => {
 const nonZero = sortedTasks.filter(([,t])=>(t.probability||0)>0);
 const display = nonZero.length>0?nonZero:sortedTasks;
 return (
 <div className="space-y-2">
 <p className="text-[10px] text-[var(--text-400)] px-1">Risk probability across XGBoost clinical domains</p>
 {display.slice(0,8).map(([key,task]) => {
 const pct = Math.round((task.probability||0)*100);
 const barC = pct>70?'#ef4444':pct>40?'#f97316':pct>15?'#f59e0b':'#10b981';
 const valC = pct>70?'text-red-600 dark:text-red-400':pct>40?'text-orange-600 dark:text-orange-400':pct>15?'text-amber-600 dark:text-amber-400':'text-emerald-600 dark:text-emerald-400';
 return (
 <div key={key} className="rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]/50 dark:border-slate-700 px-4 py-3">
 <div className="flex items-center justify-between mb-2">
 <p className="text-xs font-bold text-[var(--text-800)] dark:text-slate-200">{TASK_SHORT[key]||key}</p>
 <span className={`text-xs font-black tabular-nums ${valC}`}>{pct}%</span>
 </div>
 <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
 <motion.div className="h-full rounded-full" style={{ background: barC }}
 initial={{ width: 0 }} animate={{ width: `${pct}%` }}
 transition={{ duration: 0.5, ease: 'easeOut' }} />
 </div>
 {task.top_features?.[0] && (
 <p className="text-[10px] text-[var(--text-400)] mt-1.5 truncate">Top factor: {task.top_features[0].display_name}</p>
 )}
 </div>
 );
 })}
 </div>
 );
 })()}

 {/* -- TIMELINE -- */}
 {innerTab === 'timeline' && (
 !deterioration ? (
 <div className="flex flex-col items-center justify-center gap-3 py-10">
 <Loader2 size={20} className="animate-spin text-teal-400" />
 <p className="text-sm text-slate-400">Loading deterioration analysis - </p>
 </div>
 ) : (
 <div className="space-y-3">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {(() => {
 const dr = deterioration.deterioration_risk||0;
 const drPct = Math.round(dr*100);
 const drC = dr>0.5?'#ef4444':dr>0.25?'#f59e0b':'#10b981';
 const trend = deterioration.trend_direction||'stable';
 const tC = trend==='worsening'?'#ef4444':trend==='improving'?'#10b981':'#94a3b8';
 return (<>
 <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]/50 dark:border-slate-700 p-4 text-center">
 <p className="text-3xl font-black tabular-nums leading-none" style={{color:drC}}>{drPct}%</p>
 <p className="text-[10px] text-[var(--text-400)] uppercase tracking-wide mt-1.5">Deterioration Risk</p>
 </div>
 <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]/50 dark:border-slate-700 p-4 text-center">
 <p className="text-xl font-black capitalize leading-none mt-1" style={{color:tC}}>{trend}</p>
 <p className="text-[10px] text-[var(--text-400)] uppercase tracking-wide mt-1.5">30-Day Trend</p>
 </div>
 </>);
 })()}
 </div>
 {deterioration.top_drivers?.length > 0 && (
 <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]/50 dark:border-slate-700 overflow-hidden">
 <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--card-border)]/50 dark:border-slate-700">
 <TrendingDown size={13} className="text-amber-500 flex-shrink-0" />
 <p className="text-xs font-bold text-[var(--text-700)] dark:text-slate-300">Top Deterioration Drivers</p>
 </div>
 <div className="p-3 space-y-2">
 {deterioration.top_drivers.slice(0,4).map((d,i) => (
 <div key={i} className="flex items-start gap-2.5">
 <span className="w-5 h-5 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black">{i+1}</span>
 <p className="text-xs text-[var(--text-700)] leading-relaxed">{d.reason||d}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 {(!deterioration.top_drivers||deterioration.top_drivers.length===0) && (
 <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 flex items-center gap-3">
 <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
 <div>
 <p className="text-sm font-bold text-emerald-800">Stable Trajectory</p>
 <p className="text-xs text-emerald-700 mt-0.5">No significant deterioration drivers over 30 days.</p>
 </div>
 </div>
 )}
 {deterioration.recommendations?.length > 0 && (
 <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]/50 dark:border-slate-700 overflow-hidden">
 <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--card-border)]/50 dark:border-slate-700">
 <CheckCircle size={13} className="text-teal-500 flex-shrink-0" />
 <p className="text-xs font-bold text-[var(--text-700)] dark:text-slate-300">Recommendations</p>
 </div>
 <div className="p-3 space-y-2">
 {deterioration.recommendations.slice(0,3).map((r,i) => (
 <div key={i} className="flex items-start gap-2.5">
 <span className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-teal-500"/></span>
 <p className="text-xs text-[var(--text-700)] leading-relaxed">{r}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )
 )}

 {/* Open full record */}
 <button onClick={() => navigate(`/patients/${pid}`)}
 className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white transition shadow-sm"
 style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}
 onMouseEnter={e => e.currentTarget.style.opacity='.88'}
 onMouseLeave={e => e.currentTarget.style.opacity='1'}>
 <ExternalLink size={13} /> Open Full Patient Record
 </button>

 </div>
 )}
 </div>
 </motion.div>
 );
}

/* --- Drug Interactions Tab -------------------------------------------------- */
function DrugInteractionsTab() {
 const { data: drugAll, isLoading } = useQuery({
 queryKey: ['all-drug-ints'],
 queryFn: () => advancedMlAPI.getAllDrugInteractions().then(r => r.data),
 staleTime: 10 * 60 * 1000, retry: false,
 });
 const patients = drugAll?.patients || [];
 const severeCount = patients.filter(p => p.severe > 0).length;
 const totalInts = patients.reduce((s, p) => s + (p.total || p.interactions?.length || 0), 0);
 const allInts = patients
 .flatMap(p => (p.interactions || []).map(i => ({ ...i, patient_name: p.patient_name })))
 .sort((a, b) => { const o = { severe:0, SEVERE:0, major:1, moderate:2, minor:3 }; return (o[a.severity]??4)-(o[b.severity]??4); });

 if (isLoading) return (
 <div className="flex flex-col items-center justify-center py-20 gap-3">
 <Loader2 size={24} className="animate-spin text-teal-500" />
 <p className="text-sm text-slate-400">Scanning all patient medications - </p>
 </div>
 );

 return (
 <div className="space-y-4">
 {/* Compact stat row · no giant gradient blocks */}
 <div className="grid grid-cols-3 gap-3">
 {[
 { label: 'Patients Affected', value: patients.length,
 icon: Users, iconBg: '#fff7ed', iconColor: '#ea580c', valColor: '#9a3412' },
 { label: 'Severe / Major', value: severeCount,
 icon: AlertTriangle, iconBg: '#fef2f2', iconColor: '#dc2626', valColor: '#991b1b' },
 { label: 'Total Detected', value: totalInts,
 icon: Pill, iconBg: '#f8fafc', iconColor: '#475569', valColor: '#1e293b' },
 ].map(({ label, value, icon: Ico, iconBg, iconColor, valColor }) => (
 <div key={label} className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 flex items-center gap-3 shadow-sm">
 <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
 style={{ backgroundColor: iconBg }}>
 <Ico size={15} style={{ color: iconColor }} />
 </div>
 <div className="min-w-0">
 <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-400)] mb-0.5">{label}</p>
 <p className="text-xl font-bold tabular-nums leading-none" style={{ color: valColor }}>{value}</p>
 </div>
 </div>
 ))}
 </div>
 {allInts.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
 <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
 <CheckCircle size={20} className="text-emerald-500" />
 </div>
 <p className="font-semibold text-emerald-700 text-sm">No drug interactions detected</p>
 <p className="text-xs text-slate-400">All patient medications are currently clear.</p>
 </div>
 ) : (
 <div className="space-y-2">
 {allInts.map((it, i) => {
 const sev = ['severe','SEVERE','major'].includes(it.severity);
 return (
 <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
 className={`rounded-xl border p-3.5 ${sev ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' : 'bg-amber-50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-800'}`}>
 <div className="flex items-start justify-between gap-3">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap mb-1">
 <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${sev ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>{it.severity}</span>
 <span className="text-xs font-bold text-[var(--text-800)] dark:text-white">{it.drug1} + {it.drug2}</span>
 </div>
 {it.description && <p className="text-[11px] text-[var(--text-600)] dark:text-slate-400">{it.description}</p>}
 </div>
 {it.patient_name && <span className="text-[10px] text-[var(--text-400)] flex-shrink-0">{it.patient_name}</span>}
 </div>
 </motion.div>
 );
 })}
 </div>
 )}
 </div>
 );
}

/* --- System Overview Tab ----------------------------------------------------- */
function SystemOverviewTab({ batchRisk, sysData, onScan, scanning }) {
 const { data: mlStatus } = useQuery({
 queryKey: ['ml-status'],
 queryFn: () => mlAPI.getStatus().then(r => r.data),
 staleTime: 5 * 60 * 1000, retry: false,
 });
 const patients = batchRisk?.patients || [];
 const distData = [
 { name: 'Critical', count: patients.filter(p => p.risk_level === 'critical').length, fill: '#e11d48' },
 { name: 'High', count: patients.filter(p => p.risk_level === 'high').length, fill: '#f97316' },
 { name: 'Moderate', count: patients.filter(p => p.risk_level === 'moderate').length, fill: '#d97706' },
 { name: 'Low', count: patients.filter(p => ['low','normal'].includes(p.risk_level)).length, fill: '#16a34a' },
 ].filter(d => d.count > 0);

 const stats = [
 { l: 'Total Monitored', v: patients.length,
 iconBg: '#f0fdfa', iconColor: '#0d9488', valColor: '#0f766e' },
 { l: 'Critical', v: patients.filter(p => p.risk_level === 'critical').length,
 iconBg: '#fef2f2', iconColor: '#dc2626', valColor: '#991b1b' },
 { l: 'Deteriorating', v: (sysData?.deteriorating_patients || []).length,
 iconBg: '#fffbeb', iconColor: '#d97706', valColor: '#92400e' },
 { l: 'Stable', v: (sysData?.stable_patients || []).length,
 iconBg: '#f0fdf4', iconColor: '#16a34a', valColor: '#166534' },
 { l: 'ML Tasks Loaded', v: (mlStatus?.total_tasks || 8) + 4,
 iconBg: '#f5f3ff', iconColor: '#7c3aed', valColor: '#4c1d95' },
 { l: 'SHAP Active', v: mlStatus?.shap_enabled ? 'Yes' : (mlStatus ? 'No' : ' - '),
 iconBg: '#f8fafc', iconColor: '#475569', valColor: '#1e293b' },
 ];

 return (
 <div className="space-y-5">
 <div className="grid grid-cols-3 gap-3">
 {stats.map(({ l, v, iconBg, iconColor, valColor }) => (
 <div key={l} className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 flex items-center gap-3 shadow-sm">
 <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
 style={{ backgroundColor: iconBg }}>
 <BarChart2 size={14} style={{ color: iconColor }} />
 </div>
 <div className="min-w-0">
 <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-400)] mb-0.5">{l}</p>
 <p className="text-xl font-bold tabular-nums leading-none" style={{ color: valColor }}>{v}</p>
 </div>
 </div>
 ))}
 </div>

 {distData.length > 0 && (
 <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] dark:border-slate-700 p-4">
 <p className="text-xs font-bold text-[var(--text-500)] mb-3 flex items-center gap-1">
 <BarChart2 size={12} className="text-teal-500" /> Patient Risk Distribution
 </p>
 <ResponsiveContainer width="100%" height={130}>
 <BarChart data={distData} barCategoryGap="30%">
 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
 <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={24} />
 <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }} cursor={{ fill: '#f8fafc' }} />
 <Bar dataKey="count" name="Patients" radius={[5, 5, 0, 0]}>
 {distData.map((d, i) => <Cell key={i} fill={d.fill} />)}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 )}

 {mlStatus && (
 <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] dark:border-slate-700 p-4">
 <p className="text-xs font-bold text-[var(--text-500)] mb-3 flex items-center gap-1">
 <Cpu size={12} className="text-teal-500" /> Model Health
 </p>
 <div className="space-y-2.5">
 {[
 { label: 'Status', value: mlStatus.available ? '?? Online' : '?? Offline' },
 { label: 'Loaded Tasks', value: `${(mlStatus.loaded_tasks?.length || 0) + 4} / ${(mlStatus.total_tasks || 8) + 4} (8 XGBoost + 4 Advanced)` },
 { label: 'SHAP Explanations', value: mlStatus.shap_enabled ? '? Active' : '? Disabled' },
 ].map(({ label, value }) => (
 <div key={label} className="flex items-center justify-between py-1.5 border-b border-[var(--card-border)]/50 dark:border-slate-700 last:border-0">
 <span className="text-xs text-slate-500">{label}</span>
 <span className="text-xs font-bold text-[var(--text-800)] dark:text-white">{value}</span>
 </div>
 ))}
 {mlStatus.loaded_tasks?.length > 0 && (
 <div className="flex flex-wrap gap-1 pt-1">
 {mlStatus.loaded_tasks.map(t => (
 <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-50 text-teal-700 border border-violet-100">
 {TASK_SHORT[t] || t}
 </span>
 ))}
 </div>
 )}
 </div>
 </div>
 )}

 <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] dark:border-slate-700 p-4">
 <div className="flex items-center gap-3 mb-3">
 <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center">
 <Beaker size={15} className="text-teal-600" />
 </div>
 <div>
 <p className="font-semibold text-[var(--text-800)] text-sm">Proactive Risk Scan</p>
 <p className="text-[11px] text-[var(--text-500)] dark:text-slate-400">XGBoost across all active patients</p>
 </div>
 </div>
 <button onClick={onScan} disabled={scanning}
 className="w-full py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2">
 {scanning ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
 {scanning ? 'Scanning patients - ' : 'Run Proactive Scan'}
 </button>
 </div>
 </div>
 );
}

/* --- Main component ---------------------------------------------------------- */
export default function AIInsights() {
 const navigate = useNavigate();
 const queryClient = useQueryClient();

 const [activeTab, setActiveTab] = useState('risk');
 const [filterRisk, setFilterRisk] = useState('all');
 const [searchTerm, setSearchTerm] = useState('');
 const [deepDiveId, setDeepDiveId] = useState(null);

 /* -- Fetches --------------------------------------------------------------- */
 const { data: sysData, isLoading: sysLoad, refetch: refetchSys } = useQuery({
 queryKey: ['system-insights'],
 queryFn: () => aiAPI.getSystemInsights().then(r => r.data),
 refetchInterval: 30000, staleTime: 25000, retry: false,
 });
 const { data: batchRisk, isLoading: batchLoad } = useQuery({
 queryKey: ['batch-risk'],
 queryFn: () => mlAPI.getAllPatientsRisk().then(r => r.data),
 staleTime: 5 * 60 * 1000, retry: false,
 });
 const { data: patientsRaw } = useQuery({
 queryKey: ['patients-list'],
 queryFn: () => patientsAPI.getAll().then(r => r.data),
 staleTime: 5 * 60 * 1000,
 });
 const patientsMap = useMemo(() => {
 const arr = Array.isArray(patientsRaw) ? patientsRaw : patientsRaw?.patients || [];
 return Object.fromEntries(arr.map(p => [String(p.id), p]));
 }, [patientsRaw]);

 const scanMutation = useMutation({
 mutationFn: () => mlAPI.triggerScan(),
 onSuccess: () => {
 toast.success('Proactive scan started');
 setTimeout(() => { queryClient.invalidateQueries(['system-insights']); queryClient.invalidateQueries(['batch-risk']); }, 5000);
 },
 onError: () => toast.error('Scan failed'),
 });

 /* -- Build unified patient list -------------------------------------------- */
 const allPatients = useMemo(() => {
 const batchArr = batchRisk?.patients || [];
 const sysLists = [
 ...(sysData?.critical_patients || []),
 ...(sysData?.deteriorating_patients || []),
 ...(sysData?.stable_patients || []),
 ];
 const merged = {};
 [...sysLists, ...batchArr].forEach(p => {
 const pid = String(p.id || p.patient_id || '');
 if (!pid) return;
 const meta = patientsMap[pid] || {};
 const prev = merged[pid] || {};
 merged[pid] = {
 ...meta, ...prev, ...p, id: pid,
 full_name: p.full_name || p.patient_name || meta.full_name || prev.full_name || 'Unknown',
 risk_level: p.risk_level || p.overall_level || prev.risk_level || 'unknown',
 overall_risk: p.overall_risk || p.risk_score || prev.overall_risk || 0,
 };
 });
 const order = { critical:0, high:1, moderate:2, low:3, normal:3, stable:3, unknown:4 };
 return Object.values(merged).sort((a, b) => {
 const oa = order[(a.risk_level||'').toLowerCase()] ?? 4;
 const ob = order[(b.risk_level||'').toLowerCase()] ?? 4;
 return oa !== ob ? oa - ob : (b.overall_risk||0) - (a.overall_risk||0);
 });
 }, [batchRisk, sysData, patientsMap]);

 /* -- Filter ---------------------------------------------------------------- */
 const visiblePatients = useMemo(() => {
 let base = allPatients;
 if (filterRisk === 'critical') base = base.filter(p => ['critical','crisis'].includes((p.risk_level||'').toLowerCase()));
 else if (filterRisk === 'high') base = base.filter(p => (p.risk_level||'').toLowerCase() === 'high');
 else if (filterRisk === 'moderate') base = base.filter(p => ['moderate','medium'].includes((p.risk_level||'').toLowerCase()));
 else if (filterRisk === 'stable') base = base.filter(p => ['low','normal','stable'].includes((p.risk_level||'').toLowerCase()));
 if (!searchTerm.trim()) return base;
 const q = searchTerm.toLowerCase();
 return base.filter(p =>
 p.full_name?.toLowerCase().includes(q) ||
 p.patient_code?.toLowerCase().includes(q) ||
 p.primary_diagnosis?.toLowerCase().includes(q) ||
 p.top_concern?.toLowerCase().includes(q)
 );
 }, [allPatients, filterRisk, searchTerm]);

 const kpi = useMemo(() => ({
 total: allPatients.length,
 critical: allPatients.filter(p => ['critical','crisis'].includes((p.risk_level||'').toLowerCase())).length,
 high: allPatients.filter(p => (p.risk_level||'').toLowerCase() === 'high').length,
 stable: allPatients.filter(p => ['low','normal','stable'].includes((p.risk_level||'').toLowerCase())).length,
 }), [allPatients]);

 const deepDivePatient = useMemo(() =>
 deepDiveId
 ? visiblePatients.find(p => p.id === deepDiveId) || allPatients.find(p => p.id === deepDiveId) || null
 : null
 , [deepDiveId, visiblePatients, allPatients]);

 const isLoading = sysLoad || batchLoad;

 /* -- KPI pills config ------------------------------------------------------ */
 const KPI_PILLS = [
 { v: 'all', label: 'All Patients', count: kpi.total, grad: 'from-teal-600 to-cyan-600', icon: Users },
 { v: 'critical', label: 'Critical', count: kpi.critical, grad: 'from-red-600 to-rose-700', icon: AlertTriangle },
 { v: 'high', label: 'High Risk', count: kpi.high, grad: 'from-orange-500 to-amber-600', icon: TrendingUp },
 { v: 'stable', label: 'Stable', count: kpi.stable, grad: 'from-emerald-600 to-teal-600', icon: Heart },
 ];

 return (
 <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
 className="min-h-screen space-y-0 pb-8">

 {/* -- Standard page header (matches all other pages) -- */}
 <PageHeader
 image="/resources/headers/header-ai-insights.jpg"
 title="AI Clinical Intelligence"
 subtitle="XGBoost · 8 Models · Real SHAP · Auto-refresh 30s"
 icon={Brain}
 >
 <button onClick={() => { refetchSys(); queryClient.invalidateQueries(['batch-risk']); toast.success('Refreshed'); }}
 className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl text-xs font-bold transition border border-white/30">
 <RefreshCw size={12} /> Refresh
 </button>
 <button onClick={() => scanMutation.mutate()} disabled={scanMutation.isPending}
 className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl text-xs font-bold transition border border-white/30 disabled:opacity-60">
 {scanMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
 {scanMutation.isPending ? 'Scanning - ' : 'Run AI Scan'}
 </button>
 </PageHeader>

 {/* -- KPI pills + tab bar -- */}
 <div className="bg-[var(--card-bg)] border-b border-[var(--card-border)] dark:border-slate-700 px-6 py-3">
 {/* Compact KPI row */}
 <div className="flex items-center gap-2 flex-wrap mb-3">
 {KPI_PILLS.map(({ v, label, count, grad, icon: Ico }) => (
 <button key={v} onClick={() => { setActiveTab('risk'); setFilterRisk(v); }}
 className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
 filterRisk === v && activeTab === 'risk'
 ? `bg-gradient-to-r ${grad} text-white border-transparent shadow-sm`
 : 'bg-[var(--card-bg)] text-[var(--text-700)] border-[var(--card-border)] dark:border-slate-600 hover:border-slate-300'
 }`}>
 <Ico size={12} />
 <span>{count}</span>
 <span className="text-[10px] uppercase tracking-wide opacity-80">{label}</span>
 {v === 'critical' && count > 0 && filterRisk !== 'critical' && (
 <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse ml-0.5" />
 )}
 </button>
 ))}
 </div>
 {/* Tab bar */}
 <div className="flex gap-1">
 {[
 { id: 'risk', label: 'Risk Stratification', icon: Brain },
 { id: 'drugs', label: 'Drug Interactions', icon: Pill },
 { id: 'system', label: 'System Overview', icon: BarChart2 },
 ].map(({ id, label, icon: Ico }) => (
 <button key={id} onClick={() => { setActiveTab(id); setDeepDiveId(null); }}
 className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all border ${
 activeTab === id
 ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
 : 'text-[var(--text-600)] dark:text-[var(--text-400)] border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}>
 <Ico size={13} />
 {label}
 </button>
 ))}
 </div>
 </div>

 {/* -- Content -- */}
 <div className="px-6 pt-5">

 {/* Risk tab · search + filter bar */}
 {activeTab === 'risk' && (
 <div className="flex flex-col sm:flex-row gap-3 mb-5 items-center">
 <div className="flex-1 relative w-full">
 <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-400)] pointer-events-none" />
 <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
 placeholder="Search patients, diagnoses, concerns - "
 className="w-full pl-10 pr-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm shadow-sm" />
 </div>
 <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 flex-shrink-0">
 <ListFilter size={12} className="text-[var(--text-400)] ml-1" />
 {[
 { v: 'all', l: 'All' },
 { v: 'critical', l: 'Crisis' },
 { v: 'high', l: 'High' },
 { v: 'moderate', l: 'Medium' },
 { v: 'stable', l: 'Stable' },
 ].map(({ v, l }) => {
 const ac = v === 'all' ? 'bg-slate-700 text-white' : v === 'critical' ? 'bg-red-600 text-white' :
 v === 'high' ? 'bg-orange-500 text-white' : v === 'moderate' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white';
 return (
 <button key={v} onClick={() => setFilterRisk(v)}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterRisk === v ? ac : 'text-[var(--text-600)] dark:text-[var(--text-400)] hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
 {l}
 </button>
 );
 })}
 </div>
 </div>
 )}

 {/* Risk tab content */}
 {activeTab === 'risk' && (
 isLoading ? (
 <div className="flex flex-col items-center justify-center gap-4 py-24">
 <div className="relative w-20 h-20">
 <div className="w-20 h-20 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin" />
 <div className="absolute inset-0 flex items-center justify-center">
 <Brain size={24} className="text-teal-600" />
 </div>
 </div>
 <div className="text-center">
 <p className="font-bold text-[var(--text-700)] dark:text-slate-300">Running ML analysis - </p>
 <p className="text-xs text-[var(--text-400)] mt-1">XGBoost · 8 models · Real SHAP</p>
 </div>
 </div>
 ) : (
 <div className={deepDivePatient ? 'grid gap-5 lg:grid-cols-[1fr_420px]' : ''}>
 {/* Patient card list */}
 <div className="space-y-3">
 {/* Heading row */}
 <div className="flex items-center justify-between">
 <h2 className="text-sm font-bold text-[var(--text-700)] flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
 {filterRisk === 'all' ? 'All Patients' : `${filterRisk.charAt(0).toUpperCase() + filterRisk.slice(1)} Risk`}
 <span className="px-2 py-0.5 bg-slate-100 text-[var(--text-600)] rounded-full text-xs font-semibold">{visiblePatients.length}</span>
 </h2>
 {batchRisk?.ml_available === false && (
 <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
 ? ML offline · rule-based fallback
 </span>
 )}
 </div>

 {visiblePatients.length === 0 ? (
 <div className="flex flex-col items-center justify-center bg-[var(--card-bg)] rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 py-20 gap-4">
 <CheckCircle className="w-14 h-14 text-emerald-400 opacity-50" />
 <p className="font-bold text-[var(--text-600)] dark:text-slate-400">No patients match current filters</p>
 <button onClick={() => { setFilterRisk('all'); setSearchTerm(''); }}
 className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition">
 Show All Patients
 </button>
 </div>
 ) : (
 <AnimatePresence mode="popLayout">
 <div className="grid gap-3 sm:grid-cols-1">
 {visiblePatients.map((p, idx) => (
 <PatientCard
 key={p.id || `p-${idx}`}
 p={p}
 isSelected={deepDiveId === p.id}
 onSelect={id => setDeepDiveId(prev => prev === id ? null : id)}
 onNavigate={id => navigate(`/patients/${id}`)}
 />
 ))}
 </div>
 </AnimatePresence>
 )}
 </div>

 {/* Deep-dive panel */}
 <AnimatePresence>
 {deepDivePatient && (
 <div className="lg:sticky lg:top-4 self-start">
 <DeepDivePanel patient={deepDivePatient} navigate={navigate} onClose={() => setDeepDiveId(null)} />
 </div>
 )}
 </AnimatePresence>
 </div>
 )
 )}

 {activeTab === 'drugs' && <DrugInteractionsTab />}
 {activeTab === 'system' && <SystemOverviewTab batchRisk={batchRisk} sysData={sysData} onScan={() => scanMutation.mutate()} scanning={scanMutation.isPending} />}
 </div>
 </motion.div>
 );
}
