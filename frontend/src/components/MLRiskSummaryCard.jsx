/**
 * MLRiskSummaryCard - compact ML risk teaser on PatientDetail
 * Clean white card with solid colored badges (no bars, no faint tints)
 * Clicking navigates to /patients/:id/ml-risk for full SHAP detail
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, ChevronRight, Loader2, AlertTriangle, TrendingUp, CheckCircle, AlertCircle, Activity, Shield } from 'lucide-react';
import { mlAPI } from '../api/client';

/* ── Risk level config - solid colors, always readable ─────────────────────── */
const RISK_CFG = {
 critical: {
 badgeBg: 'bg-red-600', badgeText: 'text-white',
 iconColor: '#e11d48', borderL: 'border-l-red-500',
 labelText: 'text-red-700',label: 'Critical', Icon: AlertTriangle,
 topStripeBg: 'bg-red-500',
 },
 high: {
 badgeBg: 'bg-orange-500', badgeText: 'text-white',
 iconColor: '#f97316', borderL: 'border-l-orange-500',
 labelText: 'text-orange-700', label: 'High Risk', Icon: AlertCircle,
 topStripeBg: 'bg-orange-400',
 },
 moderate: {
 badgeBg: 'bg-amber-500', badgeText: 'text-white',
 iconColor: '#d97706', borderL: 'border-l-amber-400',
 labelText: 'text-amber-700', label: 'Moderate', Icon: Activity,
 topStripeBg: 'bg-amber-400',
 },
 low: {
 badgeBg: 'bg-teal-600', badgeText: 'text-white',
 iconColor: '#0d9488', borderL: 'border-l-teal-500',
 labelText: 'text-teal-700', label: 'Stable', Icon: CheckCircle,
 topStripeBg: 'bg-teal-400',
 },
 normal: {
 badgeBg: 'bg-teal-600', badgeText: 'text-white',
 iconColor: '#0d9488', borderL: 'border-l-teal-500',
 labelText: 'text-teal-700', label: 'Normal', Icon: CheckCircle,
 topStripeBg: 'bg-teal-400',
 },
 unknown: {
 badgeBg: 'bg-slate-500', badgeText: 'text-white',
 iconColor: '#94a3b8', borderL: 'border-l-slate-400',
 labelText: 'text-slate-500', label: 'Unknown', Icon: Shield,
 topStripeBg: 'bg-slate-400',
 },
};

const TASK_SHORT = {
 vital_risk: 'Vitals', symptom_burden: 'Symptoms',
 functional_decline: 'ADL', cognitive_impairment: 'Cognition',
 mental_health_risk: 'Mental', medication_risk: 'Meds',
 caregiver_burden: 'Caregiver', admission_risk: 'Admission',
};

export default function MLRiskSummaryCard({ patientId }) {
 const navigate = useNavigate();

 const { data, isLoading } = useQuery({
 queryKey: ['ml-risk', patientId],
 queryFn: () => mlAPI.getPatientRisk(patientId).then(r => r.data),
 enabled: !!patientId,
 staleTime: 5 * 60 * 1000,
 retry: 1,
 });

 const level = data?.overall_level || 'unknown';
 const cfg = RISK_CFG[level] || RISK_CFG.unknown;
 const pct = Math.round((data?.overall_risk ?? 0) * 100);
 const concern = data?.key_concerns?.[0];

 // Only show tasks with actual risk (> 0%)
 const activeTasks = Object.entries(data?.tasks || {})
 .map(([k, t]) => [k, Math.round((t.probability || 0) * 100)])
 .filter(([, p]) => p > 5)
 .sort(([, a], [, b]) => b - a)
 .slice(0, 6);

 return (
 <motion.button
 whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
 whileTap={{ scale: 0.99 }}
 onClick={() => navigate(`/patients/${patientId}/ml-risk`)}
 className={`w-full text-left rounded-2xl border border-[var(--card-border)] border-l-4 ${cfg.borderL} bg-[var(--card-bg)] overflow-hidden shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 transition-all`}
 >
 {/* Top strip for critical/high */}
 {(level === 'critical' || level === 'high') && (
 <div className={`h-0.5 w-full ${cfg.topStripeBg} animate-pulse`} />
 )}

 {/* Header */}
 <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
 <Brain size={16} className="text-teal-700" />
 </div>
 <div>
 <p className="text-sm font-bold text-[var(--text-900)] leading-tight">ML Risk Assessment</p>
 <p className="text-[11px] text-slate-400">XGBoost · SHAP · 8 models</p>
 </div>
 </div>

 {isLoading ? (
 <Loader2 size={16} className="animate-spin text-[var(--text-400)] flex-shrink-0" />
 ) : (
 <div className="flex items-center gap-2 flex-shrink-0">
 <span className="text-2xl font-black tabular-nums text-slate-900">{pct}%</span>
 <div className="flex flex-col items-end gap-1">
 <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText} uppercase tracking-wide`}>
 {cfg.label}
 </span>
 <ChevronRight size={13} className="text-slate-300" />
 </div>
 </div>
 )}
 </div>

 {/* Top concern */}
 {concern && (
 <div className="mx-4 mb-2 flex items-start gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
 <AlertTriangle size={11} className="text-amber-500 flex-shrink-0 mt-0.5" />
 <p className="text-[11px] text-amber-900 font-semibold leading-snug line-clamp-1">{concern}</p>
 </div>
 )}

 {/* Active task pills - only non-zero risks */}
 {activeTasks.length > 0 ? (
 <div className="px-4 pb-3 flex flex-wrap gap-1.5">
 {activeTasks.map(([key, p]) => {
 const [bg, txt] = p > 70 ? ['bg-red-600', 'text-white']
 : p > 40 ? ['bg-orange-500', 'text-white']
 : p > 15 ? ['bg-amber-400', 'text-white']
 : ['bg-slate-400', 'text-white'];
 return (
 <span key={key}
 className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black shadow-sm ${bg} ${txt}`}>
 {TASK_SHORT[key] || key}
 <span className="bg-white/25 rounded-full px-1">{p}%</span>
 </span>
 );
 })}
 </div>
 ) : !isLoading && data && (
 <div className="px-4 pb-3">
 <span className="inline-flex items-center gap-1.5 text-[11px] text-teal-700 font-semibold">
 <CheckCircle size={12} className="text-teal-500" /> No elevated risk domains detected
 </span>
 </div>
 )}

 {/* Footer */}
 <div className="px-4 py-2 border-t border-[var(--card-border)]/50 flex items-center gap-1 text-[10px] text-[var(--text-400)] font-medium bg-slate-50">
 <Brain size={9} className="text-teal-400" />
 Tap for full SHAP breakdown &amp; clinical analysis
 <ChevronRight size={10} className="ml-auto text-slate-300" />
 </div>
 </motion.button>
 );
}
