import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Bell, Pill, Calendar, MessageCircle, Users, FileText,
 Activity, CheckCheck, Trash2, Search, MailOpen, BellOff,
 AlertTriangle, Clock, Heart,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import toast from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import SearchableSelect from '../components/ui/SearchableSelect';

// ─── Type config - matches Settings icon style ────────────────────────────────
const TYPE_CONFIG = {
 medication_reminder: { icon: Pill, label: 'Medication', bar: '#2563eb', bg: '#eff6ff', color: '#1d4ed8' },
 appointment_reminder: { icon: Calendar, label: 'Appointment', bar: '#7c3aed', bg: '#f5f3ff', color: '#6d28d9' },
 appointment_reminder_24h: { icon: Calendar, label: 'Appointment', bar: '#7c3aed', bg: '#f5f3ff', color: '#6d28d9' },
 appointment_reminder_1h: { icon: Calendar, label: 'Appt Soon', bar: '#7c3aed', bg: '#f5f3ff', color: '#6d28d9' },
 medication_missed: { icon: Pill, label: 'Missed Dose', bar: '#dc2626', bg: '#fef2f2', color: '#b91c1c' },
 new_message: { icon: MessageCircle, label: 'Message', bar: '#059669', bg: '#f0fdf4', color: '#047857' },
 community_event: { icon: Users, label: 'Community', bar: '#0891b2', bg: '#f0f9ff', color: '#0369a1' },
 community_post: { icon: Users, label: 'Community', bar: '#0891b2', bg: '#f0f9ff', color: '#0369a1' },
 peer_support: { icon: Heart, label: 'Support', bar: '#db2777', bg: '#fdf2f8', color: '#be185d' },
 care_plan_update: { icon: FileText, label: 'Care Plan', bar: '#0284c7', bg: '#f0f9ff', color: '#0369a1' },
 assessment_reminder: { icon: Activity, label: 'Assessment', bar: '#d97706', bg: '#fffbeb', color: '#92400e' },
 report_available: { icon: FileText, label: 'Report', bar: '#64748b', bg: '#f8fafc', color: '#475569' },
 alert_generated: { icon: AlertTriangle, label: 'Alert', bar: '#dc2626', bg: '#fef2f2', color: '#b91c1c' },
 medical_flag: { icon: AlertTriangle, label: 'Flag', bar: '#dc2626', bg: '#fef2f2', color: '#b91c1c' },
 crisis_alert: { icon: AlertTriangle, label: 'Crisis', bar: '#991b1b', bg: '#fff1f2', color: '#991b1b' },
 ml_risk_alert: { icon: Activity, label: 'ML Risk', bar: '#7c3aed', bg: '#f5f3ff', color: '#6d28d9' },
 critical_vitals: { icon: Activity, label: 'Vitals', bar: '#dc2626', bg: '#fef2f2', color: '#b91c1c' },
 high_risk: { icon: AlertTriangle, label: 'High Risk', bar: '#ea580c', bg: '#fff7ed', color: '#c2410c' },
 // Services & bookings
 booking_confirmed: { icon: Calendar, label: 'Booking Confirmed', bar: '#0d9488', bg: '#f0fdfa', color: '#0d9488' },
 booking_cancelled: { icon: Calendar, label: 'Booking Cancelled', bar: '#dc2626', bg: '#fef2f2', color: '#b91c1c' },
 booking_reminder:  { icon: Clock,    label: 'Booking Reminder',  bar: '#7c3aed', bg: '#faf5ff', color: '#7c3aed' },
 booking_request:   { icon: Calendar, label: 'New Booking',       bar: '#0891b2', bg: '#f0f9ff', color: '#0369a1' },
 provider_approved: { icon: Activity, label: 'Provider Approved', bar: '#059669', bg: '#f0fdf4', color: '#047857' },
 provider_review:   { icon: FileText, label: 'Review Received',   bar: '#d97706', bg: '#fffbeb', color: '#92400e' },
};
const DEFAULT_CFG = { icon: Bell, label: 'Notification', bar: '#94a3b8', bg: '#f8fafc', color: '#64748b' };
const getCfg = (t) => TYPE_CONFIG[t] || DEFAULT_CFG;

// Clinical-only types - never shown to patient/family tabs
const CLINICAL_TYPES = ['alert_generated','medical_flag','crisis_alert','ml_risk_alert','critical_vitals','high_risk'];
const CRITICAL_TYPES = [...CLINICAL_TYPES, 'medication_missed'];

function relTime(ts) {
 const d = Math.floor((Date.now() - new Date(ts)) / 1000);
 if (d < 60) return 'Just now';
 if (d < 3600) return `${Math.floor(d/60)}m ago`;
 if (d < 86400) return `${Math.floor(d/3600)}h ago`;
 if (d < 172800)return 'Yesterday';
 return new Date(ts).toLocaleDateString('en-GB', { day:'numeric', month:'short' });
}
function isToday(ts) { return new Date(ts).toDateString() === new Date().toDateString(); }
function isThisWeek(ts) { const a = Date.now()-new Date(ts); return a >= 86400000 && a < 604800000; }

// ─── Single notification row - Settings-style ─────────────────────────────────
function NotifRow({ n, onRead, onDelete }) {
 const cfg = getCfg(n.notification_type);
 const Icon = cfg.icon;
 const unread = !n.is_read;
 const isCrit = CRITICAL_TYPES.includes(n.notification_type);

 return (
 <motion.div layout
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
 transition={{ duration: 0.15 }}
 className="group relative flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-slate-700 last:border-0 hover:bg-[var(--card-bg)] dark:hover:bg-slate-700 transition-colors"
 >
 {/* Unread left bar */}
 {unread && (
 <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r"
 style={{ background: cfg.bar }} />
 )}

 {/* Icon - compact */}
 <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
 style={{ background: cfg.bg }}>
 <Icon size={13} style={{ color: cfg.color }} strokeWidth={2} />
 </div>

 {/* Text block */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-1.5 mb-0.5">
 <span className="text-[9px] font-bold px-1 py-0.5 rounded"
 style={{ background: cfg.bg, color: cfg.color }}>
 {cfg.label}
 </span>
 {isCrit && unread && (
 <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-red-600 text-white uppercase">urgent</span>
 )}
 {unread && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.bar }} />}
 </div>
 <p className="text-xs font-semibold text-gray-900 leading-tight truncate">{n.title}</p>
 {n.body && <p className="text-[11px] text-gray-500 dark:text-[var(--text-400)] mt-0.5 leading-snug truncate">{n.body}</p>}
 </div>

 {/* Right - time + actions */}
 <div className="flex flex-col items-end gap-1 flex-shrink-0">
 <span className="text-[10px] text-gray-400 flex items-center gap-0.5 whitespace-nowrap">
 <Clock size={9} />{relTime(n.created_at)}
 </span>
 <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
 {unread && (
 <button onClick={() => onRead(n.id)}
 className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
 title="Mark read"><MailOpen size={11} /></button>
 )}
 <button onClick={() => onDelete(n.id)}
 className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
 title="Delete"><Trash2 size={11} /></button>
 </div>
 </div>
 </motion.div>
 );
}

// ─── Section header - matches Settings Section style ─────────────────────────
function SectionLabel({ label, count }) {
 return (
 <div className="flex items-center gap-2 px-1 mb-2 mt-5 first:mt-0">
 <p className="text-xs font-semibold text-gray-400 ">{label}</p>
 <div className="h-px flex-1 bg-gray-200" />
 <span className="text-xs text-gray-400 font-medium">{count}</span>
 </div>
 );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Notifications() {
 const [search, setSearch] = useState('');
 const [typeFilter, setType] = useState('all');
 const [statusFilter, setSt] = useState('all');
 const queryClient = useQueryClient();
 const { user } = useAuth();
 const isPatientLike = ['patient','family'].includes(user?.role);

 const { data: notifications = [], isLoading } = useQuery({
 queryKey: ['notifications'],
 queryFn: () => apiClient.get('/api/notifications', { params: { limit: 200 } }).then(r => r.data),
 });

 const inv = () => {
 queryClient.invalidateQueries(['notifications']);
 queryClient.invalidateQueries(['unread-count']);
 };
 const markRead = useMutation({ mutationFn: (id) => apiClient.put(`/api/notifications/${id}/read`), onSuccess: inv });
 const markAllRead = useMutation({ mutationFn: () => apiClient.put('/api/notifications/mark-all-read'),
 onSuccess: () => { inv(); toast.success('All marked as read'); } });
 const del = useMutation({ mutationFn: (id) => apiClient.delete(`/api/notifications/${id}`), onSuccess: inv });
 const clearRead = useMutation({ mutationFn: () => apiClient.delete('/api/notifications/clear-read'),
 onSuccess: () => { inv(); toast.success('Read notifications cleared'); } });

 // For patient/family: filter out clinical-only types entirely
 const visibleNotifications = useMemo(() =>
 isPatientLike
 ? notifications.filter(n => !CLINICAL_TYPES.includes(n.notification_type))
 : notifications,
 [notifications, isPatientLike]
 );

 const typeOptions = [
 { value: 'all', label: 'All types' },
 { value: 'medication', label: 'Medications' },
 { value: 'appointment', label: 'Appointments' },
 { value: 'new_message', label: 'Messages' },
 { value: 'care_plan_update', label: 'Care Plans' },
 { value: 'assessment_reminder', label: 'Assessments' },
 { value: 'community', label: 'Community' },
 ...(!isPatientLike ? [{ value: 'alert', label: 'Alerts' }] : []),
 ];

 const filtered = useMemo(() => {
 const q = search.toLowerCase();
 const base = visibleNotifications.filter(n => {
 const matchQ = !q || n.title?.toLowerCase().includes(q) || n.body?.toLowerCase().includes(q);
 const matchT = typeFilter === 'all' || n.notification_type?.includes(typeFilter);
 const matchS = statusFilter === 'all'
 || (statusFilter === 'unread' && !n.is_read)
 || (statusFilter === 'read' && n.is_read);
 return matchQ && matchT && matchS;
 });
 // Sort: urgent unread first, then other unread, then read by time
 return [...base].sort((a, b) => {
 const score = n => CRITICAL_TYPES.includes(n.notification_type) && !n.is_read ? 0 : !n.is_read ? 1 : 2;
 const d = score(a) - score(b);
 return d !== 0 ? d : new Date(b.created_at) - new Date(a.created_at);
 });
 }, [visibleNotifications, search, typeFilter, statusFilter]);

 const todayItems = filtered.filter(n => isToday(n.created_at));
 const weekItems = filtered.filter(n => isThisWeek(n.created_at));
 const olderItems = filtered.filter(n => !isToday(n.created_at) && !isThisWeek(n.created_at));
 const unreadCount = visibleNotifications.filter(n => !n.is_read).length;
 const critCount = visibleNotifications.filter(n => !n.is_read && CRITICAL_TYPES.includes(n.notification_type)).length;

 return (
 <div className="min-h-screen bg-[var(--card-bg)] p-4 md:p-6">
 <div className="max-w-2xl mx-auto">

 {/* ── Header - matches Settings header style ── */}
 <div className="flex items-start justify-between mb-6 gap-3">
 <div>
 <div className="flex items-center gap-3 mb-1">
 <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
 <Bell size={17} color="#0d9488" />
 </div>
 <div>
 <h1 className="text-base font-bold text-gray-900 leading-tight flex items-center gap-2">
 Notifications
 {unreadCount > 0 && (
 <span className="px-2 py-0.5 bg-teal-600 text-white text-[11px] font-bold rounded-full">
 {unreadCount}
 </span>
 )}
 {critCount > 0 && (
 <span className="px-2 py-0.5 bg-red-600 text-white text-[11px] font-bold rounded-full animate-pulse">
 {critCount} urgent
 </span>
 )}
 </h1>
 <p className="text-xs text-gray-500 dark:text-slate-400">{filtered.length} notification{filtered.length !== 1 ? 's' : ''}</p>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
 {unreadCount > 0 && (
 <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}
 className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-700 bg-[var(--card-bg)] hover:bg-teal-50 dark:hover:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 transition shadow-sm disabled:opacity-50">
 <CheckCheck size={13} /> Mark all read
 </button>
 )}
 <button onClick={() => clearRead.mutate()}
 className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-[var(--text-400)] bg-[var(--card-bg)] hover:bg-red-50 dark:hover:bg-slate-700 hover:text-red-600 rounded-xl border border-gray-200 dark:border-slate-600 transition shadow-sm">
 <BellOff size={13} /> Clear read
 </button>
 </div>
 </div>

 {/* ── Filters ── */}
 <div className="bg-[var(--card-bg)] rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-4 mb-4">
 <div className="flex items-start gap-2 flex-wrap">
 {/* Search - full width on mobile */}
 <div className="relative w-full sm:flex-1 sm:min-w-[160px]">
 <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
 <input type="search" value={search} onChange={e => setSearch(e.target.value)}
 placeholder="Search notifications…"
 className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 bg-gray-50" />
 </div>
 {/* Type */}
 <SearchableSelect
 className="w-44"
 accent="teal"
 size="sm"
 value={typeFilter}
 onChange={v => setType(v || 'all')}
 options={typeOptions.map(o => ({ value: o.value, label: o.label }))}
 allowClear={false}
 placeholder="Filter by type…"
 />
 {/* Status toggle */}
 <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
 {['all','unread','read'].map(s => (
 <button key={s} onClick={() => setSt(s)}
 className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
 statusFilter === s ? 'bg-[var(--card-bg)] text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
 }`}>
 {s}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* ── List - wrapped in Settings-style white card ── */}
 {isLoading ? (
 <div className="bg-[var(--card-bg)] rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
 {[...Array(5)].map((_, i) => (
 <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-100 last:border-0 animate-pulse">
 <div className="w-9 h-9 rounded-xl bg-gray-100 flex-shrink-0" />
 <div className="flex-1 space-y-2">
 <div className="h-2 w-16 bg-gray-100 rounded-full" />
 <div className="h-3 w-3/4 bg-gray-100 rounded-full" />
 <div className="h-2.5 w-1/2 bg-gray-100 rounded-full" />
 </div>
 </div>
 ))}
 </div>
 ) : filtered.length === 0 ? (
 <div className="bg-[var(--card-bg)] rounded-2xl border border-gray-200 shadow-sm p-14 text-center">
 <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
 <Bell size={20} className="text-gray-300" />
 </div>
 <p className="text-sm font-semibold text-gray-700 mb-1">No notifications</p>
 <p className="text-xs text-gray-400">
 {search || typeFilter !== 'all' || statusFilter !== 'all' ? 'Try adjusting your filters' : "You're all caught up!"}
 </p>
 </div>
 ) : (
 <>
 {todayItems.length > 0 && (
 <>
 <SectionLabel label="Today" count={todayItems.length} />
 <div className="bg-[var(--card-bg)] rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden mb-2">
 <AnimatePresence initial={false}>
 {todayItems.map(n => <NotifRow key={n.id} n={n} onRead={id => markRead.mutate(id)} onDelete={id => del.mutate(id)} />)}
 </AnimatePresence>
 </div>
 </>
 )}
 {weekItems.length > 0 && (
 <>
 <SectionLabel label="Earlier this week" count={weekItems.length} />
 <div className="bg-[var(--card-bg)] rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden mb-2">
 <AnimatePresence initial={false}>
 {weekItems.map(n => <NotifRow key={n.id} n={n} onRead={id => markRead.mutate(id)} onDelete={id => del.mutate(id)} />)}
 </AnimatePresence>
 </div>
 </>
 )}
 {olderItems.length > 0 && (
 <>
 <SectionLabel label="Older" count={olderItems.length} />
 <div className="bg-[var(--card-bg)] rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden mb-2">
 <AnimatePresence initial={false}>
 {olderItems.map(n => <NotifRow key={n.id} n={n} onRead={id => markRead.mutate(id)} onDelete={id => del.mutate(id)} />)}
 </AnimatePresence>
 </div>
 </>
 )}
 <div className="flex items-center justify-between px-1 mt-3 text-xs text-gray-400 dark:text-slate-500">
 <span>{unreadCount} unread · {visibleNotifications.length} total</span>
 <button onClick={() => clearRead.mutate()}
 className="flex items-center gap-1 hover:text-red-500 font-medium transition">
 <Trash2 size={10} /> Clear all read
 </button>
 </div>
 </>
 )}

 </div>
 </div>
 );
}
