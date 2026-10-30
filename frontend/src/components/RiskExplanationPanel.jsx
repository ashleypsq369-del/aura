/**
 * RiskExplanationPanel - Full XAI / SHAP explanation modal
 * =========================================================
 * Redesigned with ModalContent structured display components.
 * Shows: overall risk summary, component risk breakdown, SHAP feature
 * contributions, key clinical concerns, recommendations, clinician feedback.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 AlertTriangle, CheckCircle,
 ThumbsUp, ThumbsDown, Brain, Zap, Target, MessageSquare, Stethoscope
} from 'lucide-react';
import apiClient from '../api/client';
import ModalShell from './ui/ModalShell';
import {
 InfoGrid, InfoBadge, InfoAlert,
 ProgressRow, SHAPRow, Divider
} from './ui/ModalContent';

/* Risk level configs */
const RISK_CFG = {
 Critical: { variant: 'danger', ring: 'ring-red-400', bar: 'bg-red-500', bg: 'bg-red-600' },
 High: { variant: 'warning', ring: 'ring-amber-400', bar: 'bg-amber-500', bg: 'bg-amber-600' },
 Moderate: { variant: 'info', ring: 'ring-blue-400', bar: 'bg-teal-500', bg: 'bg-teal-600' },
 Low: { variant: 'success', ring: 'ring-emerald-400',bar: 'bg-emerald-500', bg: 'bg-emerald-600'},
};

const TABS = [
 { id: 'shap', label: 'SHAP Drivers', icon: Zap },
 { id: 'breakdown', label: 'Components', icon: Target },
 { id: 'action', label: 'Concerns', icon: AlertTriangle },
 { id: 'feedback', label: 'Feedback', icon: MessageSquare },
];

export default function RiskExplanationPanel({ data, onClose, onFeedbackSubmitted }) {
 const [tab, setTab] = useState('shap');
 const [feedbackType, setFeedback] = useState(null);
 const [note, setNote] = useState('');
 const [submitting, setSubmitting] = useState(false);

 const level = data?.risk_level || 'Low';
 const cfg = RISK_CFG[level] || RISK_CFG.Low;
 const pct = Math.round((data?.overall_risk_score || 0) * 100);
 const conf = Math.round((data?.confidence || 0) * 100);

 const submitFeedback = async () => {
 if (!feedbackType) return;
 setSubmitting(true);
 try {
 await apiClient.post('/api/comprehensive-ai/clinician-feedback', {
 prediction_id: data.prediction_id,
 feedback_type: feedbackType,
 note,
 });
 onFeedbackSubmitted?.();
 onClose();
 } catch { /* silent */ }
 finally { setSubmitting(false); }
 };

 return (
 <ModalShell
 open={true} onClose={onClose}
 title="AI Risk Explanation"
 description="XGBoost ML Analysis · SHAP Explainability"
 icon={Brain} accent="violet" size="xl"
 >
 <div className="space-y-4">

 {/* ── § 1 Risk summary - ledger-style header ───────────────── */}
 <div className={`rounded-lg border overflow-hidden ${
 level === 'Critical' ? 'border-red-200' :
 level === 'High' ? 'border-amber-200' :
 level === 'Moderate' ? 'border-blue-200' : 'border-emerald-200'
 }`}>
 {/* Coloured header bar */}
 <div className={`flex items-center justify-between gap-4 px-4 py-3 ${
 level === 'Critical' ? 'bg-red-50' :
 level === 'High' ? 'bg-amber-50' :
 level === 'Moderate' ? 'bg-blue-50' : 'bg-emerald-50'
 }`}>
 <div className="flex items-center gap-3">
 <span className={`w-1 h-8 rounded-full flex-shrink-0 ${cfg.bar}`} />
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <InfoBadge label={`${level} Risk`} variant={cfg.variant} size="sm" />
 <InfoBadge label={`${conf}% confidence`} variant="default" size="xs" />
 </div>
 {data?.summary && (
 <p className="text-xs text-[var(--text-600)] mt-1 leading-snug max-w-xs">{data.summary}</p>
 )}
 </div>
 </div>
 <div className="text-right flex-shrink-0">
 <p className="text-3xl font-black tabular-nums leading-none text-slate-900">{pct}<span className="text-base font-semibold text-slate-400">%</span></p>
 <p className="text-[10px] text-[var(--text-400)] uppercase tracking-wide mt-0.5">overall risk</p>
 </div>
 </div>
 {/* Animated bar - reading gauge */}
 <div className="h-1.5 bg-slate-100">
 <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(pct, 1)}%` }}
 transition={{ duration: 0.9, ease: 'easeOut' }}
 className={`h-full ${cfg.bar}`} />
 </div>
 </div>

 {/* ── § 2 Chapter tabs - book divider style ────────────────── */}
 <div className="flex border border-[var(--card-border)] rounded-t-lg overflow-hidden bg-slate-50">
 {TABS.map(({ id, label, icon: Icon }, idx) => (
 <button key={id} onClick={() => setTab(id)}
 className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-[11px] font-semibold transition-all border-r border-[var(--card-border)] last:border-r-0 ${
 tab === id
 ? 'bg-[var(--card-bg)] text-teal-700 shadow-[inset_0_-2px_0_0_#7c3aed]'
 : 'text-[var(--text-400)] hover:bg-white/70 hover:text-slate-600'
 }`}>
 <Icon size={11} className={tab === id ? 'text-teal-600' : ''} />
 <span className="hidden sm:inline">{label}</span>
 <span className={`ml-auto hidden md:inline text-[9px] font-normal ${tab === id ? 'text-slate-300' : 'text-slate-200'}`}>
 §{idx + 2}
 </span>
 </button>
 ))}
 </div>

 {/* ── § 3 Tab panel ────────────────────────────────────────── */}
 <div className="border border-t-0 border-[var(--card-border)] rounded-b-lg bg-[var(--card-bg)] overflow-hidden">
 <AnimatePresence mode="wait">
 <motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>

 {/* SHAP Drivers */}
 {tab === 'shap' && (
 <div className="p-4 space-y-3">
 <div className="flex items-center gap-2 mb-1 pb-2 border-b border-slate-100">
 <span className="w-4 h-4 rounded bg-violet-100 flex items-center justify-center text-[9px] font-bold text-teal-600">§</span>
 <p className="text-[11px] font-bold text-[var(--text-500)] select-none">SHAP Feature Drivers</p>
 </div>

 {/* Low risk explanation banner */}
 {pct < 15 && (
 <div className="flex items-start gap-2.5 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
 <span className="text-emerald-600 text-base flex-shrink-0">✓</span>
 <div>
 <p className="text-xs font-bold text-emerald-800">All clinical indicators within healthy range</p>
 <p className="text-[10px] text-emerald-600 mt-0.5">The features below are PROTECTING this patient from risk. Green bars = risk-reducing factors. Continue monitoring - low risk today does not mean zero risk tomorrow.</p>
 </div>
 </div>
 )}

 <InfoAlert type="info" compact>
 {data?.shap_explanations?.some(e => e.shap_value !== 0)
 ? `Real SHAP values from XGBoost TreeExplainer. ${pct < 15 ? 'Green bars show factors keeping risk low.' : 'Red bars show factors increasing risk, green bars show protective factors.'}`
 : 'XGBoost feature importance - shows which clinical measurements matter most for this prediction.'}
 </InfoAlert>

 {/* Show top risk-increasing features first, then protective */}
 {(() => {
 const explanations = data?.shap_explanations || [];
 const riskIncreasing = explanations.filter(e => e.impact === 'increases_risk');
 const riskDecreasing = explanations.filter(e => e.impact !== 'increases_risk');
 return (
 <>
 {riskIncreasing.length > 0 && (
 <>
 <p className="text-[10px] font-bold text-red-500 mt-1">Risk-Increasing Factors</p>
 {riskIncreasing.slice(0, 5).map((exp, i) => (
 <SHAPRow key={'r'+i} rank={i + 1}
 feature={exp.feature_name || exp.display_name}
 value={exp.display_value || exp.value}
 pct={exp.pct ? parseFloat(exp.pct.toFixed(1)) : Math.min(100, Math.abs(exp.shap_value || 0) * 10)}
 impact={exp.impact || 'increases_risk'} />
 ))}
 </>
 )}
 {riskDecreasing.length > 0 && (
 <>
 <p className="text-[10px] font-bold text-emerald-600 mt-2">Protective Factors</p>
 {riskDecreasing.slice(0, 5).map((exp, i) => (
 <SHAPRow key={'d'+i} rank={i + 1}
 feature={exp.feature_name || exp.display_name}
 value={exp.display_value || exp.value}
 pct={exp.pct ? parseFloat(exp.pct.toFixed(1)) : Math.min(100, Math.abs(exp.shap_value || 0) * 10)}
 impact={exp.impact || 'decreases_risk'} />
 ))}
 </>
 )}
 {explanations.length === 0 && (
 <div className="text-center py-8 text-[var(--text-400)] italic text-sm">No SHAP data available - run AI Risk assessment first.</div>
 )}
 </>
 );
 })()}

 {/* Task-level probability summary */}
 {data?.tasks && Object.keys(data.tasks).length > 0 && (
 <div className="mt-3 pt-3 border-t border-slate-100">
 <p className="text-[10px] font-bold text-[var(--text-400)] mb-2">Model Scores by Clinical Domain</p>
 <div className="grid grid-cols-2 gap-1.5">
 {Object.entries(data.tasks).map(([key, task]) => {
 const prob = Math.round((task.probability || 0) * 100);
 const color = prob > 70 ? 'text-red-600 bg-red-50 border-red-200' : prob > 40 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200';
 return (
 <div key={key} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold ${color}`}>
 <span className="truncate">{key.replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase())}</span>
 <span className="font-bold ml-1 flex-shrink-0">{prob}%</span>
 </div>
 );
 })}
 </div>
 </div>
 )}
 </div>
 )}

 {/* Component Breakdown */}
 {tab === 'breakdown' && (
 <div className="p-4 space-y-4">
 <div className="flex items-center gap-2 mb-1 pb-2 border-b border-slate-100">
 <span className="w-4 h-4 rounded bg-violet-100 flex items-center justify-center text-[9px] font-bold text-teal-600">§</span>
 <p className="text-[11px] font-bold text-[var(--text-500)] select-none">Risk Component Breakdown</p>
 </div>
 <InfoGrid cols={2} items={[
 ...(data?.component_scores || []).slice(0, 5).map(c => ({
 label: c.name, value: `${Math.round(c.score)}%`,
 accent: c.score > 65 ? 'red' : c.score > 40 ? 'amber' : 'teal', sub: c.risk_level,
 })),
 { label: 'Overall Risk', value: `${pct}%`, accent: level === 'Critical' ? 'red' : level === 'High' ? 'amber' : 'teal', sub: level },
 ]} />
 <Divider label="Domain Progress" />
 {(data?.component_scores || []).map(({ name, score }) => (
 <ProgressRow key={name} label={name} value={Math.round(score)} max={100}
 color={score > 70 ? 'red' : score > 40 ? 'amber' : 'green'}
 valueLabel={`${Math.round(score)}%`} />
 ))}
 {!(data?.component_scores?.length) && (
 <InfoAlert type="info">No component breakdown available - run the risk assessment again.</InfoAlert>
 )}
 </div>
 )}

 {/* Concerns & Recommendations */}
 {tab === 'action' && (
 <div className="p-4 space-y-4">
 <div className="flex items-center gap-2 mb-1 pb-2 border-b border-slate-100">
 <span className="w-4 h-4 rounded bg-amber-100 flex items-center justify-center text-[9px] font-bold text-amber-600">§</span>
 <p className="text-[11px] font-bold text-[var(--text-500)] select-none">Clinical Concerns & Actions</p>
 </div>
 {(data?.key_concerns?.length > 0) ? (
 <div className="rounded-lg border border-amber-200 overflow-hidden">
 <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border-b border-amber-200">
 <span className="w-1 h-4 rounded-full bg-amber-400 flex-shrink-0" />
 <AlertTriangle size={12} className="text-amber-600 flex-shrink-0" />
 <span className="text-[11px] font-bold text-amber-700 select-none">Key Clinical Concerns</span>
 </div>
 <div className="px-5 py-3 bg-[var(--card-bg)] space-y-2">
 {data.key_concerns.map((c, i) => (
 <div key={i} className="flex items-start gap-3">
 <span className="w-5 h-5 rounded bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">{i+1}</span>
 <p className="text-sm text-[var(--text-700)] leading-relaxed">{c}</p>
 </div>
 ))}
 </div>
 </div>
 ) : (
 <InfoAlert type="success">No critical concerns flagged for this patient at this time.</InfoAlert>
 )}
 <Divider />
 <div className="rounded-lg border border-teal-200 overflow-hidden">
 <div className="flex items-center gap-2.5 px-4 py-2.5 bg-teal-50 border-b border-teal-200">
 <span className="w-1 h-4 rounded-full bg-teal-400 flex-shrink-0" />
 <CheckCircle size={12} className="text-teal-600 flex-shrink-0" />
 <span className="text-[11px] font-bold text-teal-700 select-none">Recommended Actions</span>
 </div>
 <div className="px-5 py-3 bg-[var(--card-bg)] space-y-2">
 {(data?.recommended_actions || data?.recommendations || []).map((r, i) => (
 <div key={i} className="flex items-start gap-3">
 <span className="w-5 h-5 rounded bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">{i+1}</span>
 <p className="text-sm text-[var(--text-700)] leading-relaxed">{r}</p>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* Clinician Feedback */}
 {tab === 'feedback' && (
 <div className="p-4 space-y-4">
 <div className="flex items-center gap-2 mb-1 pb-2 border-b border-slate-100">
 <span className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">§</span>
 <p className="text-[11px] font-bold text-[var(--text-500)] select-none">Clinician Feedback</p>
 </div>
 <InfoAlert type="info">
 Your feedback improves the AI model for future predictions. Do you agree with this risk assessment?
 </InfoAlert>
 <div className="grid grid-cols-3 gap-2">
 {[
 { type: 'agree', label: 'Agree', icon: ThumbsUp, cls: 'border-emerald-300 text-emerald-700 data-[sel]:bg-emerald-600 data-[sel]:text-white' },
 { type: 'partially_agree', label: 'Partial', icon: Stethoscope, cls: 'border-amber-300 text-amber-700 data-[sel]:bg-amber-500 data-[sel]:text-white' },
 { type: 'disagree', label: 'Disagree', icon: ThumbsDown, cls: 'border-red-300 text-red-700 data-[sel]:bg-red-600 data-[sel]:text-white' },
 ].map(({ type, label, icon: Icon, cls }) => (
 <button key={type} onClick={() => setFeedback(type)}
 data-sel={feedbackType === type ? '' : undefined}
 className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-semibold text-sm transition-all ${cls} ${feedbackType === type ? '' : 'hover:bg-slate-50'}`}>
 <Icon size={20} />{label}
 </button>
 ))}
 </div>
 <AnimatePresence>
 {feedbackType && (
 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
 className="overflow-hidden space-y-3">
 <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
 placeholder="Add a clinical note to explain your assessment (optional)..."
 className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-violet-100 resize-none transition-all" />
 <button onClick={submitFeedback} disabled={submitting}
 className="w-full py-3 bg-teal-700 hover:bg-violet-800 text-white font-bold rounded-xl disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2">
 {submitting ? 'Submitting…' : 'Submit Feedback'}
 </button>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 )}

 </motion.div>
 </AnimatePresence>
 </div>

 {/* ── Model footnote ────────────────────────────────────────── */}
 <div className="flex items-start gap-2 px-1 border-t border-[var(--card-border)]/50 pt-3">
 <span className="text-slate-300 text-base leading-none select-none mt-0.5">§</span>
 <p className="text-[10px] text-[var(--text-400)] leading-relaxed">
 <span className="font-semibold text-slate-500">XGBoost v1.0 · SHAP TreeExplainer</span> ·
 Trained on clinically-parameterised synthetic data · Results should be reviewed by a qualified clinician
 </p>
 </div>

 </div>
 </ModalShell>
 );
}
