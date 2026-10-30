import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Bell, AlertTriangle, CheckCircle, XCircle,
 Search, Brain, ExternalLink, Activity, Zap, Pill,
 TrendingDown, ChevronDown, ChevronUp, Clock, ShieldAlert,
 ListFilter
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient, { mlAPI } from '../api/client';
import { useWS } from '../context/WebSocketContext';
import toast from '../utils/toast';
import { clinicalToast } from '../utils/clinicalToast';
import { ListSkeleton } from '../components/LoadingSkeleton';
import FocusedAIExplanation from '../components/FocusedAIExplanation';
import PageHeader from '../components/PageHeader';
import { useAppSettings } from '../context/AppSettingsContext';
import ReminderBell from '../components/ReminderBell';

// ── Severity config ───────────────────────────────────────────────────────────
const SEV = {
 critical: { badge: 'badge-critical', Icon: XCircle, label: 'Critical', pulse: true },
 high: { badge: 'badge-high', Icon: AlertTriangle, label: 'High', pulse: false },
 medium: { badge: 'badge-stable', Icon: Bell, label: 'Medium', pulse: false },
 low: { badge: 'badge-low', Icon: Bell, label: 'Low', pulse: false },
};

const BORDER_COLOR = { critical: '#ef4444', high: '#f59e0b', medium: '#0d9488', low: '#94a3b8' };

function getSevStyle(severity, dark) {
 const light = { critical:'#fff5f5', high:'#fffbeb', medium:'#f0fdf9', low:'#f8fafc' };
 const darkBg = { critical:'rgba(220,38,38,0.10)', high:'rgba(217,119,6,0.10)', medium:'rgba(13,148,136,0.10)', low:'rgba(100,116,139,0.07)' };
 const iconLight = { critical:'#e53e3e', high:'#d97706', medium:'#0d9488', low:'#64748b' };
 const iconDark = { critical:'#f87171', high:'#fcd34d', medium:'#2dd4bf', low:'#94a3b8' };
 return {
 bg: dark ? (darkBg[severity] || darkBg.low) : (light[severity] || light.low),
 icon: dark ? (iconDark[severity] || iconDark.low) : (iconLight[severity] || iconLight.low),
 };
}

const TYPE_ICONS = {
 vital_abnormal: Activity, deterioration: TrendingDown, deterioration_trend: TrendingDown,
 drug_interaction: Pill, ml_risk: Zap, ml_high_risk: Zap,
};

const TYPE_LABELS = {
 vital_abnormal: 'Abnormal Vitals', pain_spike: 'Pain Spike', missed_medication: 'Missed Medication',
 appointment_due: 'Appointment Due', deterioration: 'Deteriorating', deterioration_trend: 'ML Deterioration',
 drug_interaction: 'Drug Interaction', ml_risk: 'ML High Risk', ml_high_risk: 'ML High Risk', system: 'System',
};

const alertLabel = t => TYPE_LABELS[t] || t?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Alert';
const sevOrd = { critical: 0, high: 1, medium: 2, low: 3 };

function timeAgo(iso) {
 if (!iso) return '';
 const m = Math.round((Date.now() - new Date(iso)) / 60000);
 if (m < 1) return 'just now';
 if (m < 60) return `${m}m ago`;
 if (m < 1440) return `${Math.round(m / 60)}h ago`;
 return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ── Alert card ────────────────────────────────────────────────────────────────
function AlertCard({ alert, mlRisk, onAck, ackPending, onExplain, explainLoading, onNavigate, isDark }) {
 const cfg = SEV[alert.severity] || SEV.low;
 const SevIcon = cfg.Icon;
 const TypeIcon = TYPE_ICONS[alert.alert_type] || SevIcon;
 const ss = getSevStyle(alert.severity, isDark);
 const border = BORDER_COLOR[alert.severity] || BORDER_COLOR.low;

 return (
 <motion.div
 layout
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -8 }}
 className="rounded-xl overflow-hidden transition-shadow hover:shadow-md"
 style={{
 background: ss.bg,
 border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
 borderLeft: `4px solid ${border}`,
 }}
 >
 <div className="p-3 flex items-start gap-2.5">
 <div className={`mt-0.5 flex-shrink-0 ${cfg.pulse ? 'animate-pulse' : ''}`}>
 <TypeIcon size={16} style={{ color: ss.icon }} />
 </div>

 <div className="flex-1 min-w-0">
 {/* Title row */}
 <div className="flex items-start justify-between gap-2 flex-wrap">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="font-bold text-xs" style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>
 {alertLabel(alert.alert_type)}
 </span>
 <span className={cfg.badge}>{cfg.label}</span>
 {mlRisk && (
 <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
 style={{ background: isDark ? 'rgba(124,58,237,0.2)' : '#ede9fe', color: isDark ? '#c4b5fd' : '#6d28d9' }}>
 <Zap size={8} /> ML {(mlRisk.overall_risk * 100).toFixed(0)}%
 </span>
 )}
 </div>
 <span className="text-[10px] flex items-center gap-1 flex-shrink-0"
 style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
 <Clock size={10} />{timeAgo(alert.created_at)}
 </span>
 </div>

 {/* Message */}
 <p className="text-xs leading-snug mt-1 mb-2" style={{ color: isDark ? '#94a3b8' : '#475569' }}>
 {alert.message}
 </p>

 {/* Actions row */}
 <div className="flex items-center justify-between gap-2 flex-wrap">
 {alert.patient_name && (
 <span className="text-[10px] font-semibold rounded-full px-2 py-0.5"
 style={{
 color: isDark ? '#94a3b8' : '#475569',
 background: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
 border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : '#e2e8f0'}`,
 }}>
 {alert.patient_name}
 </span>
 )}
 <div className="flex gap-1.5 ml-auto items-center flex-wrap">
 <ReminderBell
 label={`${alertLabel(alert.alert_type)}${alert.patient_name ? ` - ${alert.patient_name}` : ''}`}
 type="custom"
 size="xs"
 />
 {alert.patient_id && (
 <button onClick={() => onNavigate(alert.patient_id)}
 className="flex items-center gap-1 px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold transition">
 <ExternalLink size={10} /> Patient
 </button>
 )}
 <button onClick={() => onExplain(alert)} disabled={explainLoading}
 className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[var(--text-600)] rounded-md text-[10px] font-semibold transition disabled:opacity-50"
 style={{ color: isDark ? '#94a3b8' : undefined, background: isDark ? 'rgba(255,255,255,0.08)' : undefined }}>
 <Brain size={10} /> Explain
 </button>
 <button onClick={() => onAck(alert.id)} disabled={ackPending}
 className="flex items-center gap-1 px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-[10px] font-semibold transition disabled:opacity-50">
 <CheckCircle size={10} /> {ackPending ? '…' : 'Resolve'}
 </button>
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 );
}

// ── Stat strip ────────────────────────────────────────────────────────────────
function StatStrip({ stats, isDark }) {
 return (
 <div className="flex flex-wrap gap-2">
 {stats.map(({ label, value, icon: Icon, accent, active, onClick }) => (
 <button key={label} onClick={onClick}
 className="flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all duration-150"
 style={{
 background: active ? (isDark ? accent.darkBg : accent.bg) : (isDark ? 'rgba(255,255,255,0.04)' : '#ffffff'),
 borderColor: active ? (isDark ? accent.darkBdr : accent.bdr) : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'),
 boxShadow: active ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
 }}>
 <Icon size={14} style={{ color: active ? (isDark ? accent.darkIcon : accent.icon) : (isDark ? '#64748b' : '#94a3b8') }} />
 <span className="text-xl font-black tabular-nums leading-none"
 style={{ color: active ? (isDark ? accent.darkTxt : accent.txt) : (isDark ? '#f1f5f9' : '#1e293b') }}>
 {value}
 </span>
 <span className="text-xs font-semibold"
 style={{ color: active ? (isDark ? accent.darkTxt : accent.txt) : (isDark ? '#64748b' : '#64748b') }}>
 {label}
 </span>
 </button>
 ))}
 </div>
 );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Alerts() {
 const navigate = useNavigate();
 const queryClient = useQueryClient();
 const { subscribe }= useWS();
 const { theme } = useAppSettings();
 const isDark = theme === 'dark';

 useEffect(() => {
 const u1 = subscribe('new_alert', () => queryClient.invalidateQueries({ queryKey: ['alerts'] }));
 const u2 = subscribe('alert_update', () => queryClient.invalidateQueries({ queryKey: ['alerts'] }));
 return () => { u1(); u2(); };
 }, [subscribe, queryClient]);

 const [filterSeverity, setFilterSeverity] = useState('all');
 const [filterStatus, setFilterStatus] = useState('active');
 const [searchTerm, setSearchTerm] = useState('');
 const [ackedExpanded, setAckedExpanded] = useState(false);
 const [pendingAck, setPendingAck] = useState(null);
 const [showFocused, setShowFocused] = useState(false);
 const [focusedData, setFocusedData] = useState(null);
 const [explainLoading, setExplainLoading] = useState(false);

 const { data: rawAlerts, isLoading } = useQuery({
 queryKey: ['alerts'],
 queryFn: async () => {
 const res = await apiClient.get('/api/alerts');
 return (res.data || []).map(a => ({ ...a, acknowledged: a.acknowledged ?? a.is_acknowledged ?? false }));
 },
 refetchInterval: 30000,
 });

 const { data: mlBatch } = useQuery({
 queryKey: ['ml-batch-risk'],
 queryFn: () => mlAPI.getAllPatientsRisk().then(r => r.data),
 staleTime: 5 * 60 * 1000,
 retry: false,
 });

 const getML = pid =>
 mlBatch?.ml_available && pid
 ? mlBatch.patients?.find(p => p.patient_id === pid) || null
 : null;

 const ackMutation = useMutation({
 mutationFn: id => apiClient.put(`/api/alerts/${id}/acknowledge`),
 onMutate: id => setPendingAck(id),
 onSuccess: () => {
 queryClient.invalidateQueries(['alerts']);
 queryClient.invalidateQueries(['alerts-unread-count']);
 setPendingAck(null);
 clinicalToast.success('Alert resolved');
 },
 onError: () => { setPendingAck(null); clinicalToast.error('Could not resolve alert'); },
 });

 const explainAlert = async (alert) => {
 setExplainLoading(true);
 try {
 const res = await apiClient.post('/api/comprehensive-ai/focused-explanation', {
 patient_id: alert.patient_id, focus_type: 'alert', focus_data: { alert_id: alert.id },
 });
 setFocusedData(res.data);
 setShowFocused(true);
 } catch { toast.error('AI explanation failed'); }
 finally { setExplainLoading(false); }
 };

 const kpi = useMemo(() => ({
 critical: rawAlerts?.filter(a => a.severity === 'critical' && !a.is_acknowledged).length || 0,
 high: rawAlerts?.filter(a => a.severity === 'high' && !a.is_acknowledged).length || 0,
 active: rawAlerts?.filter(a => !a.is_acknowledged).length || 0,
 resolved: rawAlerts?.filter(a =>
 a.is_acknowledged && a.acknowledged_at &&
 new Date(a.acknowledged_at).toDateString() === new Date().toDateString()
 ).length || 0,
 }), [rawAlerts]);

 const { activeAlerts, ackedAlerts } = useMemo(() => {
 if (!rawAlerts) return { activeAlerts: [], ackedAlerts: [] };
 const q = searchTerm.toLowerCase();
 const base = rawAlerts.filter(a => {
 const mS = !q || a.alert_type?.toLowerCase().includes(q) || a.message?.toLowerCase().includes(q) || a.patient_name?.toLowerCase().includes(q);
 const mV = filterSeverity === 'all' || a.severity === filterSeverity;
 return mS && mV;
 });
 const sort = arr => [...arr].sort((a, b) =>
 (sevOrd[a.severity] ?? 4) - (sevOrd[b.severity] ?? 4) || new Date(b.created_at) - new Date(a.created_at)
 );
 return {
 activeAlerts: sort(base.filter(a => !a.is_acknowledged)),
 ackedAlerts: [...base.filter(a => a.is_acknowledged)].sort((a, b) => new Date(b.acknowledged_at || b.created_at) - new Date(a.acknowledged_at || a.created_at)),
 };
 }, [rawAlerts, searchTerm, filterSeverity]);

 const showActive = filterStatus === 'active' || filterStatus === 'all';
 const showAcked = filterStatus === 'acknowledged' || filterStatus === 'all';

 const T = isDark
 ? { card: '#1e293b', cardBdr: 'rgba(255,255,255,0.08)', pill: '#0f172a', txt: '#f1f5f9', sub: '#94a3b8', faint: '#475569', input: '#0f172a', inputBdr: 'rgba(255,255,255,0.10)' }
 : { card: '#ffffff', cardBdr: '#e2e8f0', pill: '#f1f5f9', txt: '#1e293b', sub: '#64748b', faint: '#94a3b8', input: '#f8fafc', inputBdr: '#e2e8f0' };

 return (
 <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
 className="min-h-screen space-y-5 pb-8">

 {/* Header */}
 <PageHeader
 image="/resources/african/african-nurse-female.jpg"
 title="Clinical Alerts"
 subtitle="Active patient safety alerts - click a card to filter by severity"
 icon={ShieldAlert}
 />

 {/* Stat strip */}
 <div className="px-4 sm:px-6">
 <StatStrip isDark={isDark} stats={[
 { label:'Critical', value:kpi.critical, icon:XCircle, active:filterSeverity==='critical'&&filterStatus==='active', onClick:()=>{setFilterSeverity('critical');setFilterStatus('active');},
 accent:{bg:'#fff5f5', bdr:'#fca5a5', icon:'#ef4444', txt:'#dc2626', darkBg:'rgba(220,38,38,0.15)', darkBdr:'rgba(220,38,38,0.4)', darkIcon:'#f87171', darkTxt:'#f87171'}},
 { label:'High Priority', value:kpi.high, icon:AlertTriangle, active:filterSeverity==='high' &&filterStatus==='active', onClick:()=>{setFilterSeverity('high'); setFilterStatus('active');},
 accent:{bg:'#fffbeb', bdr:'#fcd34d', icon:'#f59e0b', txt:'#d97706', darkBg:'rgba(217,119,6,0.15)', darkBdr:'rgba(217,119,6,0.4)', darkIcon:'#fbbf24', darkTxt:'#fbbf24'}},
 { label:'Active', value:kpi.active, icon:Bell, active:filterSeverity==='all' &&filterStatus==='active', onClick:()=>{setFilterSeverity('all'); setFilterStatus('active');},
 accent:{bg:'#f0fdf9', bdr:'#5eead4', icon:'#0d9488', txt:'#0f766e', darkBg:'rgba(13,148,136,0.15)', darkBdr:'rgba(13,148,136,0.4)', darkIcon:'#2dd4bf', darkTxt:'#2dd4bf'}},
 { label:'Resolved', value:kpi.resolved, icon:CheckCircle, active:filterStatus==='acknowledged', onClick:()=>{setFilterSeverity('all'); setFilterStatus('acknowledged');},
 accent:{bg:'#f0fdf4', bdr:'#86efac', icon:'#16a34a', txt:'#15803d', darkBg:'rgba(22,163,74,0.15)', darkBdr:'rgba(22,163,74,0.4)', darkIcon:'#4ade80', darkTxt:'#4ade80'}},
 ]} />
 </div>

 {/* Filter bar */}
 <div className="px-4 sm:px-6">
 <div className="rounded-xl border p-4 space-y-3"
 style={{ background: T.card, borderColor: T.cardBdr }}>
 <div className="flex flex-col md:flex-row gap-3 items-center">

 {/* Search */}
 <div className="flex-1 relative w-full">
 <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
 style={{ color: T.faint }} />
 <input
 type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
 placeholder="Search alerts, patients, types..."
 className="w-full pl-9 pr-4 py-2 rounded-xl outline-none text-xs"
 style={{ background: T.input, border: `1px solid ${T.inputBdr}`, color: T.txt, caretColor: '#0d9488' }}
 />
 </div>

 {/* Severity pills */}
 <div className="flex items-center gap-1 rounded-xl p-1 flex-wrap flex-shrink-0"
 style={{ background: T.pill }}>
 <span className="text-[10px] font-bold uppercase px-1.5" style={{ color: T.faint }}>Severity</span>
 {['all', 'critical', 'high', 'medium', 'low'].map(s => {
 const isActive = filterSeverity === s;
 const activeBg = { critical: '#dc2626', high: '#f59e0b', medium: '#0d9488', low: '#64748b', all: '#334155' }[s];
 return (
 <button key={s} onClick={() => setFilterSeverity(s)}
 className="px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all"
 style={{ background: isActive ? activeBg : 'transparent', color: isActive ? '#fff' : T.sub }}>
 {s === 'all' ? 'All' : s}
 </button>
 );
 })}
 </div>

 {/* Status pills */}
 <div className="flex items-center gap-1 rounded-xl p-1 flex-shrink-0"
 style={{ background: T.pill }}>
 {[{ v: 'active', l: 'Active Only' }, { v: 'all', l: 'All' }, { v: 'acknowledged', l: 'Resolved' }].map(({ v, l }) => (
 <button key={v} onClick={() => setFilterStatus(v)}
 className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
 style={{ background: filterStatus === v ? '#0d9488' : 'transparent', color: filterStatus === v ? '#fff' : T.sub }}>
 {l}
 </button>
 ))}
 </div>
 </div>

 {/* Active filter chips */}
 {(filterSeverity !== 'all' || searchTerm || filterStatus !== 'active') && (
 <div className="flex items-center gap-2 flex-wrap pt-1"
 style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}` }}>
 <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: T.faint }}>
 <ListFilter size={11} /> Filters:
 </span>
 {filterSeverity !== 'all' && (
 <span className="px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"
 style={{ background: isDark ? 'rgba(220,38,38,0.15)' : '#fee2e2', color: isDark ? '#f87171' : '#dc2626' }}>
 {filterSeverity}
 <button onClick={() => setFilterSeverity('all')} className="font-black opacity-70 hover:opacity-100">×</button>
 </span>
 )}
 {filterStatus !== 'active' && (
 <span className="px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"
 style={{ background: isDark ? 'rgba(13,148,136,0.15)' : '#f0fdf9', color: isDark ? '#2dd4bf' : '#0f766e' }}>
 {filterStatus}
 <button onClick={() => setFilterStatus('active')} className="font-black opacity-70 hover:opacity-100">×</button>
 </span>
 )}
 {searchTerm && (
 <span className="px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"
 style={{ background: isDark ? 'rgba(124,58,237,0.15)' : '#f5f3ff', color: isDark ? '#c4b5fd' : '#7c3aed' }}>
 "{searchTerm}"
 <button onClick={() => setSearchTerm('')} className="font-black opacity-70 hover:opacity-100">×</button>
 </span>
 )}
 <button onClick={() => { setFilterSeverity('all'); setFilterStatus('active'); setSearchTerm(''); }}
 className="text-xs font-semibold ml-auto transition-colors" style={{ color: T.faint }}>
 Clear all
 </button>
 </div>
 )}
 </div>
 </div>

 {/* Content */}
 <div className="px-4 sm:px-6 space-y-5">
 {isLoading ? <ListSkeleton items={5} /> : (
 <>
 {/* Active alerts */}
 {showActive && (
 <div>
 <div className="flex items-center justify-between mb-3">
 <h2 className="text-xs font-bold flex items-center gap-2" style={{ color: T.txt }}>
 <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
 Active Alerts
 <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold"
 style={{ background: isDark ? 'rgba(220,38,38,0.2)' : '#fee2e2', color: isDark ? '#f87171' : '#dc2626' }}>
 {activeAlerts.length}
 </span>
 </h2>
 {activeAlerts.length > 0 && (
 <span className="text-xs" style={{ color: T.faint }}>Sorted: critical first</span>
 )}
 </div>

 {activeAlerts.length === 0 ? (
 <div className="rounded-xl p-10 text-center border"
 style={{ background: isDark ? 'rgba(5,150,105,0.08)' : '#f0fdf4', borderColor: isDark ? 'rgba(5,150,105,0.2)' : '#bbf7d0' }}>
 <CheckCircle className="w-14 h-14 mx-auto mb-3 opacity-80" style={{ color: isDark ? '#34d399' : '#16a34a' }} />
 <p className="font-bold text-base mb-1" style={{ color: isDark ? '#34d399' : '#15803d' }}>All clear</p>
 <p className="text-sm" style={{ color: isDark ? '#6ee7b7' : '#16a34a' }}>No active alerts match your filters.</p>
 </div>
 ) : (
 <AnimatePresence>
 <div className="space-y-2.5">
 {activeAlerts.map(a => (
 <AlertCard key={a.id} alert={a} mlRisk={getML(a.patient_id)} isDark={isDark}
 onAck={id => ackMutation.mutate(id)} ackPending={pendingAck === a.id}
 onExplain={explainAlert} explainLoading={explainLoading}
 onNavigate={pid => navigate(`/patients/${pid}`)}
 />
 ))}
 </div>
 </AnimatePresence>
 )}
 </div>
 )}

 {/* Resolved accordion */}
 {showAcked && ackedAlerts.length > 0 && (
 <div>
 <button
 onClick={() => setAckedExpanded(v => !v)}
 className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl border font-bold text-sm transition-all"
 style={{
 background: ackedExpanded ? (isDark ? 'rgba(5,150,105,0.1)' : '#f0fdf4') : T.card,
 borderColor: ackedExpanded ? (isDark ? 'rgba(52,211,153,0.3)' : '#86efac') : T.cardBdr,
 color: ackedExpanded ? (isDark ? '#34d399' : '#15803d') : T.sub,
 }}>
 <div className="flex items-center gap-2.5">
 <CheckCircle size={16} style={{ color: ackedExpanded ? (isDark ? '#34d399' : '#16a34a') : (isDark ? '#4ade80' : '#86efac') }} />
 Resolved Alerts
 <span className="px-2 py-0.5 rounded-full text-xs font-bold"
 style={{ background: ackedExpanded ? (isDark ? 'rgba(52,211,153,0.2)' : '#bbf7d0') : (isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'), color: ackedExpanded ? (isDark ? '#34d399' : '#15803d') : T.faint }}>
 {ackedAlerts.length}
 </span>
 </div>
 {ackedExpanded
 ? <ChevronUp size={16} style={{ color: isDark ? '#34d399' : '#16a34a' }} />
 : <ChevronDown size={16} style={{ color: T.faint }} />}
 </button>

 <AnimatePresence>
 {ackedExpanded && (
 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
 className="overflow-hidden mt-2">
 <div className="space-y-1.5">
 {ackedAlerts.slice(0, 25).map(a => {
 const cfg = SEV[a.severity] || SEV.low;
 return (
 <div key={a.id}
 className="flex items-center gap-2.5 rounded-xl px-3 py-2 opacity-60 hover:opacity-100 transition-opacity"
 style={{ background: T.card, border: `1px solid ${T.cardBdr}` }}>
 <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="font-semibold text-[11px]" style={{ color: T.txt }}>{alertLabel(a.alert_type)}</span>
 <span className={cfg.badge}>{cfg.label}</span>
 {a.patient_name && <span className="text-[10px]" style={{ color: T.faint }}>{a.patient_name}</span>}
 </div>
 <p className="text-[10px] truncate" style={{ color: T.faint }}>{a.message}</p>
 </div>
 <span className="text-[10px] flex-shrink-0" style={{ color: T.faint }}>
 {timeAgo(a.acknowledged_at || a.created_at)}
 </span>
 {a.patient_id && (
 <button onClick={() => navigate(`/patients/${a.patient_id}`)}
 className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded transition"
 style={{ color: '#0d9488' }}>
 View
 </button>
 )}
 </div>
 );
 })}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 )}
 </>
 )}
 </div>

 {/* AI explanation modal */}
 {showFocused && focusedData && (
 <FocusedAIExplanation data={focusedData} onClose={() => setShowFocused(false)} />
 )}
 </motion.div>
 );
}
