/**
 * FocusedAIExplanation - Context-specific clinical AI explanation modal
 * ======================================================================
 * Used from Alerts page when a clinician clicks "Explain" on a specific alert.
 * Shows: what triggered the alert, AI explanation, contributing factors,
 * drug interactions (if relevant), recommendations, clinician feedback.
 * Redesigned with ModalContent structured display components.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Brain, TrendingUp, TrendingDown, AlertTriangle,
 CheckCircle, ThumbsUp, ThumbsDown, Minus, Pill,
 Activity, MessageSquare
} from 'lucide-react';
import axios from 'axios';
import ModalShell from './ui/ModalShell';
import {
 InfoGrid, InfoBadge, InfoAlert, InfoSection,
 SHAPRow, ListItem, Divider
} from './ui/ModalContent';

import { API_URL } from '../api/client';

function formatVal(v) {
 if (v === undefined || v === null) return ' - ';
 if (typeof v === 'object' && v.systolic) return `${v.systolic}/${v.diastolic} mmHg`;
 if (typeof v === 'object') return JSON.stringify(v);
 return String(v);
}

const RISK_MAP = {
 critical: { variant: 'danger', label: 'Critical', color: 'red' },
 warning: { variant: 'warning', label: 'Warning', color: 'amber' },
 normal: { variant: 'success', label: 'Normal', color: 'green' },
};

export default function FocusedAIExplanation({ data, onClose }) {
 const [feedbackType, setFeedback] = useState(null);
 const [note, setNote] = useState('');
 const [submitting, setSubmitting] = useState(false);
 const [submitted, setSubmitted] = useState(false);

 const level = data?.risk_level || 'normal';
 const rCfg = RISK_MAP[level] || RISK_MAP.normal;

 // Derive the "reading name" from whatever type of alert this is
 const readingLabel = (
 data?.vital_type?.replace(/_/g,' ') ||
 data?.symptom_type?.replace(/_/g,' ') ||
 data?.medication_name ||
 data?.alert_type?.replace(/_/g,' ') ||
 'Clinical Finding'
 ).toUpperCase();

 const currentValue = formatVal(
 data?.current_value ?? data?.current_severity ??
 data?.triggered_value ?? data?.total_score
 );

 const submitFeedback = async () => {
 if (!feedbackType) return;
 setSubmitting(true);
 try {
 await axios.post(`${API_URL}/api/comprehensive-ai/focused-explanation-feedback`, {
 patient_id: data.patient_id,
 focus_type: data.focus_type,
 focus_identifier: data.vital_type || data.symptom_type || data.medication_name || 'unknown',
 focus_value: currentValue,
 feedback_type: feedbackType,
 feedback_note: note,
 risk_level_shown: data.risk_level,
 explanation_shown: data.explanation,
 });
 setSubmitted(true);
 } catch { /* silent */ }
 finally { setSubmitting(false); }
 };

 return (
 <ModalShell
 open={true} onClose={onClose}
 title="Clinical AI Explanation"
 description="Context-aware analysis of this specific clinical finding"
 icon={Brain} accent="violet" size="lg"
 >
 <div className="space-y-4">

 {/* ── § 1 Finding summary ledger ────────────────────────── */}
 <div className="rounded-lg border border-slate-200 overflow-hidden">
 <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
 <span className="w-1 h-4 rounded-full bg-slate-400 flex-shrink-0" />
 <Activity size={12} className="text-slate-500 flex-shrink-0" />
 <span className="text-[11px] font-bold text-slate-500 select-none">Clinical Finding</span>
 </div>
 <div className="px-4 py-3 bg-slate-50">
 <InfoGrid cols={2} items={[
 { label: 'Patient', value: data?.patient_name || ' - ' },
 { label: 'Finding', value: readingLabel, sub: data?.focus_type?.replace(/_/g,' ') },
 { label: 'Value', value: currentValue, accent: rCfg.color },
 { label: 'Risk Level', value: rCfg.label, accent: rCfg.color },
 ]} />
 </div>
 </div>

 {/* ── § 2 Trend indicator ────────────────────────────────── */}
 {data?.trend && (
 <div className={`rounded-lg border overflow-hidden ${
 ['increasing','worsening'].includes(data.trend) ? 'border-red-200' :
 ['decreasing','improving'].includes(data.trend) ? 'border-emerald-200' : 'border-slate-200'
 }`}>
 <div className={`flex items-center gap-3 px-4 py-2.5 ${
 ['increasing','worsening'].includes(data.trend) ? 'bg-red-50' :
 ['decreasing','improving'].includes(data.trend) ? 'bg-emerald-50' : 'bg-slate-50'
 }`}>
 {['increasing','worsening'].includes(data.trend)
 ? <TrendingUp size={14} className="text-red-500 flex-shrink-0" />
 : ['decreasing','improving'].includes(data.trend)
 ? <TrendingDown size={14} className="text-emerald-500 flex-shrink-0" />
 : <Minus size={14} className="text-slate-400 flex-shrink-0" />}
 <p className="text-sm font-semibold text-slate-800 capitalize">{data.trend} trend</p>
 {data.baseline_value && (
 <p className="text-xs text-slate-500 ml-auto">Baseline: {formatVal(data.baseline_value)}</p>
 )}
 </div>
 </div>
 )}

 {/* ── § 3 AI Explanation - book-inset style ──────────────── */}
 <div className="rounded-lg border border-violet-200 overflow-hidden">
 <div className="flex items-center gap-2.5 px-4 py-2.5 bg-teal-50 border-b border-teal-200">
 <span className="w-1 h-4 rounded-full bg-teal-400 flex-shrink-0" />
 <Brain size={12} className="text-teal-600 flex-shrink-0" />
 <span className="text-[11px] font-bold text-teal-700 select-none">Why is this clinically concerning?</span>
 </div>
 <div className="px-5 py-4 bg-slate-50">
 <div className="pl-4 border-l-2 border-teal-200">
 <p className="text-sm text-slate-800 leading-7">{data?.explanation || 'No explanation available.'}</p>
 </div>
 {data?.confidence && (
 <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
 AI Confidence: <span className="font-bold text-slate-600">{Math.round(data.confidence * 100)}%</span>
 </p>
 )}
 </div>
 </div>

 {/* ── § 4 Contributing factors (SHAP-like bars) ─────────── */}
 {data?.relevant_factors?.length > 0 && (
 <div className="rounded-lg border border-slate-200 overflow-hidden">
 <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
 <span className="w-1 h-4 rounded-full bg-slate-400 flex-shrink-0" />
 <span className="text-[11px] font-bold text-slate-500 select-none">Contributing Factors</span>
 </div>
 <div className="px-4 py-3 bg-slate-50 space-y-2">
 {data.relevant_factors.map((f, i) => (
 <SHAPRow key={i} rank={i + 1}
 feature={f.feature_name}
 value={f.display_value}
 pct={f.importance ? parseFloat(f.importance) : 50 - i * 8}
 impact={f.impact || 'increases_risk'} />
 ))}
 </div>
 </div>
 )}

 {/* ── § 5 Drug interactions ──────────────────────────────── */}
 {data?.interactions?.length > 0 && (
 <div className="rounded-lg border border-amber-200 overflow-hidden">
 <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border-b border-amber-200">
 <span className="w-1 h-4 rounded-full bg-amber-400 flex-shrink-0" />
 <Pill size={12} className="text-amber-600 flex-shrink-0" />
 <span className="text-[11px] font-bold text-amber-700 select-none">Drug Interactions Detected</span>
 </div>
 <div className="px-4 py-3 bg-slate-50 space-y-2">
 {data.interactions.map((ix, i) => (
 <div key={i} className="flex items-start gap-3 pl-3 border-l-2 border-amber-300">
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-slate-800">{ix.medication}</p>
 <p className="text-xs text-slate-600 mt-0.5">{ix.interaction}</p>
 </div>
 <InfoBadge label={ix.severity}
 variant={ix.severity === 'high' ? 'danger' : ix.severity === 'moderate' ? 'warning' : 'info'} size="xs" />
 </div>
 ))}
 </div>
 </div>
 )}

 {/* ── § 6 Recommended actions ────────────────────────────── */}
 {data?.recommendations?.length > 0 && (
 <div className="rounded-lg border border-teal-200 overflow-hidden">
 <div className="flex items-center gap-2.5 px-4 py-2.5 bg-teal-50 border-b border-teal-200">
 <span className="w-1 h-4 rounded-full bg-teal-400 flex-shrink-0" />
 <CheckCircle size={12} className="text-teal-600 flex-shrink-0" />
 <span className="text-[11px] font-bold text-teal-700 select-none">Recommended Actions</span>
 </div>
 <div className="px-4 py-3 bg-slate-50 space-y-2">
 {data.recommendations.map((r, i) => (
 <div key={i} className="flex items-start gap-3">
 <span className="w-5 h-5 rounded bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">{i+1}</span>
 <p className="text-sm text-slate-700 leading-relaxed">{r}</p>
 </div>
 ))}
 </div>
 </div>
 )}

 {data?.history_count !== undefined && (
 <p className="text-xs text-slate-400 text-center">
 Based on analysis of {data.history_count} historical readings
 </p>
 )}

 {/* ── § 7 Clinician feedback ─────────────────────────────── */}
 <div className="rounded-lg border border-slate-200 overflow-hidden">
 <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
 <span className="w-1 h-4 rounded-full bg-slate-300 flex-shrink-0" />
 <MessageSquare size={12} className="text-slate-500 flex-shrink-0" />
 <span className="text-[11px] font-bold text-slate-500 select-none">Was this explanation helpful?</span>
 </div>
 <div className="px-4 py-3 bg-slate-50">
 {!submitted ? (
 <div className="space-y-3">
 <p className="text-xs text-slate-500">Your feedback helps improve AI explanations for all clinicians.</p>
 <div className="grid grid-cols-3 gap-2">
 {[
 { type: 'helpful', label: 'Helpful', Icon: ThumbsUp, active: 'bg-emerald-600 text-white', passive: 'border-emerald-300 text-emerald-700' },
 { type: 'partially_helpful', label: 'Partial', Icon: Activity, active: 'bg-amber-500 text-white', passive: 'border-amber-300 text-amber-700' },
 { type: 'not_helpful', label: 'Not Helpful', Icon: ThumbsDown, active: 'bg-red-600 text-white', passive: 'border-red-300 text-red-700' },
 ].map(({ type, label, Icon, active, passive }) => (
 <button key={type} onClick={() => setFeedback(type)}
 className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-semibold transition-all
 ${feedbackType === type ? active : `bg-slate-50 ${passive} hover:opacity-80`}`}>
 <Icon size={16} />{label}
 </button>
 ))}
 </div>
 <AnimatePresence>
 {feedbackType && (
 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
 className="overflow-hidden space-y-2">
 <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
 placeholder="What would make this explanation more useful? (optional)"
 className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 resize-none transition-all" />
 <button onClick={submitFeedback} disabled={submitting}
 className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl disabled:opacity-50 transition-colors text-sm shadow-sm">
 {submitting ? 'Submitting…' : 'Submit Feedback'}
 </button>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 ) : (
 <InfoAlert type="success" title="Thank you!">
 Your feedback helps us improve AI explanations for all clinical users.
 </InfoAlert>
 )}
 </div>
 </div>

 </div>
 </ModalShell>
 );
}
