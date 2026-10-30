import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, X, AlertTriangle, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from '../utils/toast';
import { useNavigate } from 'react-router-dom';
import { offlineAlertsAPI } from '../api/offlineClient';
import { useAppSettings } from '../context/AppSettingsContext';

// Proper human-readable labels for every alert_type
const TYPE_LABELS = {
 vital_abnormal: 'Abnormal Vitals',
 pain_spike: 'Pain Spike',
 missed_medication: 'Missed Medication',
 appointment_due: 'Appointment Due',
 deterioration: 'Deteriorating',
 deterioration_trend: 'Deterioration Trend',
 drug_interaction: 'Drug Interaction',
 ml_high_risk: 'ML High Risk',
 ml_risk: 'ML Risk Alert',
 ml_risk_alert: 'ML Risk Alert',
 system: 'System Notice',
 critical_vitals: 'Critical Vitals',
 high_risk: 'High Risk Flag',
 crisis_alert: 'Crisis Alert',
 alert_generated: 'Clinical Alert',
 medical_flag: 'Medical Flag',
};

function getLabel(type) {
 if (!type) return 'Alert';
 return TYPE_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const SEV = {
 critical: { bg: '#dc2626', text: '#fff' },
 high: { bg: '#ea580c', text: '#fff' },
 medium: { bg: '#ca8a04', text: '#fff' },
 low: { bg: '#0284c7', text: '#fff' },
};

export default function RealTimeAlerts() {
 const [isOpen, setIsOpen] = useState(false);
 const [lastAlertCount, setLastAlertCount] = useState(0);
 const navigate = useNavigate();
 const { theme } = useAppSettings();
 const isDark = theme === 'dark';

 const panel = isDark
 ? { bg: '#1a2332', bdr: 'rgba(255,255,255,0.09)', sep: 'rgba(255,255,255,0.05)',
 text: '#f1f5f9', sub: '#94a3b8', hover: 'rgba(255,255,255,0.06)' }
 : { bg: '#ffffff', bdr: 'rgba(0,0,0,0.10)', sep: '#f1f5f9',
 text: '#0f172a', sub: '#6b7280', hover: '#fff5f5' };

 const { data: alertsData = [] } = useQuery({
 queryKey: ['realtime-alerts'],
 queryFn: async () => {
 // Hard cap at 20 - never fetch all 400+
 const res = await offlineAlertsAPI.getAll({ limit: 20 });
 return res.data || [];
 },
 refetchInterval: 30000,
 onSuccess: (data) => {
 if (data.length > lastAlertCount) {
 data.slice(0, data.length - lastAlertCount).forEach(a => {
 if (a.severity === 'critical') {
 toast.error(
 <div className="flex gap-2">
 <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
 <div>
 <p className="font-bold text-sm">{getLabel(a.alert_type)}</p>
 <p className="text-xs mt-0.5 opacity-80">{a.message}</p>
 </div>
 </div>,
 { duration: 10000, id: `alert-${a.id}` }
 );
 }
 });
 }
 setLastAlertCount(data.length);
 },
 });

 // Always show only 5 in dropdown - navigate to /alerts for more
 const preview = [...alertsData]
 .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
 .slice(0, 5);

 const totalCount = alertsData.length;

 return (
 <div className="relative">
 {/* Trigger */}
 <button onClick={() => setIsOpen(v => !v)}
 className="relative p-2 rounded-lg hover:bg-white/20 transition-all"
 title="Medical Alerts">
 <AlertCircle size={20} color="#ffffff" />
 {totalCount > 0 && (
 <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
 className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full font-bold flex items-center justify-center border-2 border-white shadow"
 style={{ fontSize: 9, minWidth: 18, minHeight: 18, padding: '0 3px' }}>
 {totalCount > 20 ? '20+' : totalCount}
 </motion.span>
 )}
 </button>

 <AnimatePresence>
 {isOpen && (
 <>
 {/* Backdrop */}
 <div className="fixed inset-0 z-40 bg-black/30 sm:bg-transparent"
 onClick={() => setIsOpen(false)} />

 {/* ── Mobile: anchored below header, full width ── */}
 <motion.div
 key="mobile-alerts"
 initial={{ opacity: 0, y: -8 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -8 }}
 transition={{ duration: 0.15 }}
 className="sm:hidden fixed z-50 flex flex-col rounded-b-2xl overflow-hidden shadow-2xl"
 style={{
 top: 60,
 left: 8,
 right: 8,
 maxHeight: 'calc(100dvh - 76px)',
 background: panel.bg,
 border: `1px solid ${panel.bdr}`,
 }}>
 {/* Header */}
 <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
 style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
 <div className="flex items-center gap-2">
 <Activity size={13} color="#fff" />
 <span className="font-bold text-white text-xs">Active Alerts</span>
 <span className="text-[11px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-bold">{totalCount}</span>
 </div>
 <button onClick={() => setIsOpen(false)} className="w-6 h-6 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/15">
 <X size={12} strokeWidth={2.5} />
 </button>
 </div>
 <div className="flex-1 overflow-y-auto" style={{ background: panel.bg }}>
 {preview.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-10">
 <AlertCircle size={22} style={{ color: panel.sub }} className="mb-2 opacity-30" />
 <p className="text-xs font-medium" style={{ color: panel.sub }}>No active alerts</p>
 </div>
 ) : (
 preview.map(alert => <AlertRow key={alert.id} alert={alert} panel={panel} onClose={() => { setIsOpen(false); navigate(`/patients/${alert.patient_id}`); }} />)
 )}
 </div>
 <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style={{ borderTop: `1px solid ${panel.sep}`, background: panel.bg }}>
 {totalCount > 5 && <span className="text-[11px] font-semibold" style={{ color: '#ef4444' }}>+{totalCount - 5} more</span>}
 <button onClick={() => { navigate('/alerts'); setIsOpen(false); }} className="ml-auto text-[11px] font-semibold" style={{ color: isDark ? '#34d399' : '#0d9488' }}>All alerts →</button>
 </div>
 </motion.div>

 {/* ── Desktop: classic right-anchored dropdown ── */}
 <motion.div
 key="desktop-alerts"
 initial={{ opacity: 0, y: -8, scale: 0.97 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -8, scale: 0.97 }}
 transition={{ duration: 0.13 }}
 className="hidden sm:flex absolute right-0 mt-2 z-50 rounded-2xl overflow-hidden flex-col"
 style={{
 width: 310,
 maxHeight: 'min(400px, calc(100dvh - 80px))',
 background: panel.bg,
 border: `1px solid ${panel.bdr}`,
 boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
 }}>

 {/* Header */}
 <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
 style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
 <div className="flex items-center gap-2">
 <Activity size={13} color="#fff" />
 <span className="font-bold text-white text-xs">Active Alerts</span>
 <span className="text-[11px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-bold">
 {totalCount}
 </span>
 </div>
 <button onClick={() => setIsOpen(false)}
 className="w-6 h-6 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition">
 <X size={12} strokeWidth={2.5} />
 </button>
 </div>

 {/* List */}
 <div className="flex-1 overflow-y-auto" style={{ background: panel.bg }}>
 {preview.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-10">
 <AlertCircle size={22} style={{ color: panel.sub }} className="mb-2 opacity-30" />
 <p className="text-xs font-medium" style={{ color: panel.sub }}>No active alerts</p>
 </div>
 ) : (
 preview.map(alert => (
 <AlertRow key={alert.id} alert={alert} panel={panel}
 onClose={() => { setIsOpen(false); navigate(`/patients/${alert.patient_id}`); }} />
 ))
 )}
 </div>

 {/* Footer - always navigate to page, no modal */}
 <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
 style={{ borderTop: `1px solid ${panel.sep}`, background: panel.bg }}>
 {totalCount > 5 && (
 <span className="text-[11px] font-semibold" style={{ color: '#ef4444' }}>
 +{totalCount - 5} more
 </span>
 )}
 <button onClick={() => { navigate('/alerts'); setIsOpen(false); }}
 className="ml-auto text-[11px] font-semibold transition"
 style={{ color: isDark ? '#34d399' : '#0d9488' }}>
 All alerts →
 </button>
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>
 </div>
 );
}

// ── Alert row ──────────────────────────────────────────────────────────────────
function AlertRow({ alert, panel, onClose }) {
 const sev = SEV[alert.severity] || SEV.low;
 const Icon = alert.severity === 'critical' || alert.severity === 'high' ? AlertTriangle : Activity;
 const label = getLabel(alert.alert_type);

 return (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="group relative flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors"
 style={{ borderBottom: `1px solid ${panel.sep}` }}
 onClick={onClose}
 onMouseEnter={e => e.currentTarget.style.background = panel.hover}
 onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
 >
 {/* Left severity bar */}
 <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r"
 style={{ background: sev.bg }} />

 {/* Icon */}
 <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
 style={{ background: sev.bg }}>
 <Icon size={13} color="#fff" strokeWidth={2.5} />
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-1.5 mb-0.5">
 <p className="text-[12px] font-bold truncate" style={{ color: panel.text }}>
 {label}
 </p>
 <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex-shrink-0"
 style={{ background: sev.bg, color: sev.text }}>
 {alert.severity}
 </span>
 </div>
 <p className="text-[11px] truncate" style={{ color: panel.sub }}>
 {alert.patient_name ? `${alert.patient_name} · ` : ''}{alert.message?.slice(0, 55)}
 </p>
 </div>

 {/* Time */}
 <span className="text-[11px] flex-shrink-0 mt-0.5" style={{ color: panel.sub }}>
 {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </span>
 </motion.div>
 );
}
