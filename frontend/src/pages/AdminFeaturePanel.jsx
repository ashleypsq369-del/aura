/**
 * AdminFeaturePanel
 * =================
 * Admin-only page to:
 * - View all users and their feature overrides
 * - Enable / Disable / Lock features per user
 * - Review and approve/deny user feature access requests
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Shield, Users, Search, CheckCircle, XCircle,
 Lock, Unlock, Eye, EyeOff, ChevronDown, ChevronUp,
 AlertCircle, Clock, RefreshCw, Loader2, Filter,
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from '../utils/toast';
import PageHeader from '../components/PageHeader';
import SearchableSelect from '../components/ui/SearchableSelect';
import { API_URL } from '../api/client';

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

const STATE_CFG = {
 enabled: { label: 'Enabled', icon: Eye, cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
 disabled: { label: 'Disabled', icon: EyeOff, cls: 'bg-slate-100 text-[var(--text-600)] border-slate-200' },
 locked: { label: 'Locked', icon: Lock, cls: 'bg-red-100 text-red-700 border-red-200' },
};
const SOURCE_CFG = {
 admin: { label: 'Admin', cls: 'text-teal-600' },
 questionnaire: { label: 'Questionnaire', cls: 'text-teal-600' },
 request_approved: { label: 'User Request', cls: 'text-emerald-600' },
};
const STATUS_CFG = {
 pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-700', icon: Clock },
 approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
 denied: { label: 'Denied', cls: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function AdminFeaturePanel() {
 const { user } = useAuth();
 const navigate = useNavigate();
 const queryClient = useQueryClient();
 const [activeTab, setActiveTab] = useState('users');
 const [search, setSearch] = useState('');
 const [expandedUser, setExpandedUser] = useState(null);
 const [reviewModal, setReviewModal] = useState(null);
 const [overrideModal, setOverrideModal] = useState(null);
 const [reviewNote, setReviewNote] = useState('');
 const [overrideNote, setOverrideNote] = useState('');
 const [statusFilter, setStatusFilter] = useState('pending');

 // ── Queries - always run (hooks must not be conditional) ──────────────────
 const { data: usersData, isLoading: loadingUsers } = useQuery({
 queryKey: ['admin-feature-users'],
 queryFn: () => axios.get(`${API_URL}/api/features/admin/users`, { headers: authH() }).then(r => r.data),
 staleTime: 30000,
 enabled: user?.role === 'admin',
 });

 const { data: requestsData, isLoading: loadingReqs } = useQuery({
 queryKey: ['admin-feature-requests', statusFilter],
 queryFn: () => axios.get(`${API_URL}/api/features/admin/requests?status=${statusFilter === 'all' ? '' : statusFilter}`, { headers: authH() }).then(r => r.data),
 staleTime: 15000,
 enabled: user?.role === 'admin',
 });

 // ── Mutations ─────────────────────────────────────────────────────────────
 const reviewMutation = useMutation({
 mutationFn: ({ id, status, admin_note }) =>
 axios.put(`${API_URL}/api/features/admin/requests/${id}/review`, { status, admin_note }, { headers: authH() }),
 onSuccess: (_, vars) => {
 toast.success(`Request ${vars.status}`);
 queryClient.invalidateQueries({ queryKey: ['admin-feature-requests'] });
 queryClient.invalidateQueries({ queryKey: ['admin-feature-users'] });
 setReviewModal(null);
 setReviewNote('');
 },
 onError: e => toast.error(e.response?.data?.detail || 'Failed'),
 });

 const overrideMutation = useMutation({
 mutationFn: ({ user_id, feature_path, state, note }) =>
 axios.put(`${API_URL}/api/features/admin/override`, { user_id, feature_path, state, note }, { headers: authH() }),
 onSuccess: () => {
 toast.success('Override saved');
 queryClient.invalidateQueries({ queryKey: ['admin-feature-users'] });
 setOverrideModal(null);
 setOverrideNote('');
 },
 onError: e => toast.error(e.response?.data?.detail || 'Failed'),
 });

 const removeMutation = useMutation({
 mutationFn: (id) => axios.delete(`${API_URL}/api/features/admin/override/${id}`, { headers: authH() }),
 onSuccess: () => {
 toast.success('Override removed - reverts to care-setting default');
 queryClient.invalidateQueries({ queryKey: ['admin-feature-users'] });
 },
 onError: e => toast.error(e.response?.data?.detail || 'Failed'),
 });

 // ── Filtered users ────────────────────────────────────────────────────────
 const users = useMemo(() => {
 const list = usersData?.users || [];
 if (!search) return list;
 const q = search.toLowerCase();
 return list.filter(u => u.name?.toLowerCase().includes(q) || u.role?.includes(q) || u.care_setting?.includes(q));
 }, [usersData, search]);

 const requests = requestsData?.requests || [];
 const pendingCount = (usersData?.users || []).reduce((sum, u) => sum + (u.pending_requests || 0), 0);

 // ── Role guard - after all hooks ──────────────────────────────────────────
 if (user?.role !== 'admin') {
 navigate('/dashboard');
 return null;
 }

 return (
 <div className="min-h-screen pb-12">
 <PageHeader
 image="/resources/african/african-health-tech.jpg"
 title="Feature Control Panel"
 subtitle="Manage per-user feature access, approve requests, lock or unlock features"
 icon={Shield}
 />

 <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

 {/* KPI row */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 {[
 { label: 'Total Users', value: usersData?.total || 0, icon: Users, color: 'text-teal-600' },
 { label: 'Pending Requests', value: pendingCount, icon: Clock, color: pendingCount > 0 ? 'text-amber-600' : 'text-slate-400' },
 { label: 'Active Overrides', value: (usersData?.users || []).reduce((s, u) => s + u.override_count, 0), icon: Shield, color: 'text-teal-600' },
 { label: 'Locked Features', value: (usersData?.users || []).reduce((s, u) => s + u.overrides.filter(o => o.state === 'locked').length, 0), icon: Lock, color: 'text-red-500' },
 ].map(({ label, value, icon: Icon, color }) => (
 <div key={label} className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] px-4 py-3 flex items-center gap-3">
 <Icon size={18} className={color} />
 <div>
 <p className="text-xs text-slate-500">{label}</p>
 <p className="text-xl font-bold text-slate-800">{value}</p>
 </div>
 </div>
 ))}
 </div>

 {/* Tab bar */}
 <div className="flex gap-2 border-b border-[var(--card-border)] pb-0">
 {[
 { id: 'users', label: 'Users & Overrides', icon: Users },
 { id: 'requests', label: `Access Requests${pendingCount > 0 ? ` (${pendingCount})` : ''}`, icon: Clock },
 ].map(({ id, label, icon: Icon }) => (
 <button key={id} onClick={() => setActiveTab(id)}
 className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
 activeTab === id
 ? 'border-teal-600 text-teal-700'
 : 'border-transparent text-[var(--text-500)] hover:text-slate-700'
 }`}>
 <Icon size={15} />{label}
 </button>
 ))}
 </div>

 {/* ── USERS TAB ── */}
 {activeTab === 'users' && (
 <div className="space-y-3">
 <div className="relative max-w-sm">
 <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input value={search} onChange={e => setSearch(e.target.value)}
 placeholder="Search users..."
 className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-teal-500" />
 </div>

 {loadingUsers ? (
 <div className="flex items-center justify-center py-12 text-slate-400">
 <Loader2 size={24} className="animate-spin mr-2" /> Loading users...
 </div>
 ) : (
 <div className="space-y-2">
 {users.map(u => (
 <div key={u.id} className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden">
 {/* User row */}
 <div className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-[var(--card-bg)] transition-colors"
 onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}>
 <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
 {u.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-semibold text-[var(--text-800)] text-sm truncate">{u.name}</p>
 <p className="text-xs text-[var(--text-500)] capitalize">{u.role} · {u.care_setting || 'No setting'}</p>
 </div>
 <div className="flex items-center gap-2 flex-shrink-0">
 {u.override_count > 0 && (
 <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
 {u.override_count} override{u.override_count !== 1 ? 's' : ''}
 </span>
 )}
 {u.pending_requests > 0 && (
 <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
 <Clock size={10} /> {u.pending_requests} pending
 </span>
 )}
 {expandedUser === u.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
 </div>
 </div>

 {/* Expanded overrides */}
 <AnimatePresence>
 {expandedUser === u.id && (
 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
 className="border-t border-[var(--card-border)]/50 overflow-hidden">
 <div className="px-5 py-4 space-y-3">
 <p className="text-xs font-bold text-[var(--text-400)] ">Active Overrides</p>
 {u.overrides.length === 0 ? (
 <p className="text-sm text-[var(--text-400)] italic">No overrides - all features follow care-setting defaults</p>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 {u.overrides.map(o => {
 const sc = STATE_CFG[o.state] || STATE_CFG.disabled;
 const Icon = sc.icon;
 const src = SOURCE_CFG[o.source] || {};
 return (
 <div key={o.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm ${sc.cls}`}>
 <Icon size={14} className="flex-shrink-0" />
 <div className="flex-1 min-w-0">
 <p className="font-semibold truncate">{o.feature_name}</p>
 <p className={`text-[10px] ${src.cls}`}>{src.label}</p>
 </div>
 <div className="flex gap-1.5 flex-shrink-0">
 <button onClick={() => { setOverrideModal({ userId: u.id, featurePath: o.feature_path, current: o.state, overrideId: o.id }); setOverrideNote(o.note || ''); }}
 className="p-1 rounded hover:bg-white/50 transition" title="Change state">
 <RefreshCw size={12} />
 </button>
 <button onClick={() => removeMutation.mutate(o.id)}
 className="p-1 rounded hover:bg-white/50 transition" title="Remove override">
 <XCircle size={12} />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* Add new override */}
 <button onClick={() => { setOverrideModal({ userId: u.id, featurePath: '', current: 'disabled', overrideId: null }); setOverrideNote(''); }}
 className="mt-1 flex items-center gap-1.5 text-xs text-teal-600 font-semibold hover:text-teal-700 transition">
 <Shield size={13} /> Add Feature Override
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* ── REQUESTS TAB ── */}
 {activeTab === 'requests' && (
 <div className="space-y-3">
 <div className="flex gap-2">
 {['pending', 'approved', 'denied', 'all'].map(s => (
 <button key={s} onClick={() => setStatusFilter(s)}
 className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
 statusFilter === s ? 'bg-teal-600 text-white' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-600)] hover:bg-slate-50'
 }`}>
 {s === 'all' ? 'All' : s}
 </button>
 ))}
 </div>

 {loadingReqs ? (
 <div className="flex items-center justify-center py-12 text-slate-400">
 <Loader2 size={24} className="animate-spin mr-2" /> Loading requests...
 </div>
 ) : requests.length === 0 ? (
 <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-12 text-center">
 <Clock size={36} className="mx-auto text-slate-300 mb-3" />
 <p className="text-[var(--text-500)] text-sm">No {statusFilter === 'all' ? '' : statusFilter} requests</p>
 </div>
 ) : (
 <div className="space-y-2">
 {requests.map(r => {
 const sc = STATUS_CFG[r.status] || STATUS_CFG.pending;
 const Icon = sc.icon;
 return (
 <div key={r.id} className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] px-5 py-4">
 <div className="flex items-start gap-4">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap mb-1">
 <p className="font-semibold text-[var(--text-800)] text-sm">{r.user?.name || `User #${r.user_id || ''}`}</p>
 <span className="text-xs text-slate-400">·</span>
 <p className="text-xs text-[var(--text-500)] capitalize">{r.user?.role}</p>
 <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sc.cls}`}>
 <Icon size={10} />{sc.label}
 </span>
 </div>
 <p className="text-sm font-medium text-teal-700 mb-1">
 Requesting: <span className="font-bold">{r.feature_name}</span>
 </p>
 <p className="text-sm text-slate-600">{r.reason}</p>
 {r.admin_note && (
 <p className="text-xs text-[var(--text-400)] mt-1 italic">Admin note: {r.admin_note}</p>
 )}
 <p className="text-xs text-[var(--text-400)] mt-1.5">
 {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
 </p>
 </div>
 {r.status === 'pending' && (
 <button onClick={() => { setReviewModal(r); setReviewNote(''); }}
 className="flex-shrink-0 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition">
 Review
 </button>
 )}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}
 </div>

 {/* ── Review Modal ── */}
 <AnimatePresence>
 {reviewModal && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
 onClick={() => setReviewModal(null)}>
 <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
 onClick={e => e.stopPropagation()}
 className="bg-[var(--card-bg)] rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
 <h2 className="text-base font-bold text-slate-800">Review Feature Request</h2>
 <div className="bg-[var(--card-bg)] rounded-xl p-4">
 <p className="text-sm font-semibold text-slate-700">{reviewModal.user?.name}</p>
 <p className="text-sm text-teal-700 font-medium mt-1">Requesting: {reviewModal.feature_name}</p>
 <p className="text-sm text-[var(--text-600)] mt-1">{reviewModal.reason}</p>
 </div>
 <div>
 <label className="block text-xs font-semibold text-slate-600r mb-1.5">Admin Note (optional)</label>
 <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={3}
 placeholder="Reason for your decision..."
 className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500 resize-none" />
 </div>
 <div className="flex gap-3">
 <button onClick={() => reviewMutation.mutate({ id: reviewModal.id, status: 'denied', admin_note: reviewNote })}
 disabled={reviewMutation.isPending}
 className="flex-1 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
 <XCircle size={14} /> Deny
 </button>
 <button onClick={() => reviewMutation.mutate({ id: reviewModal.id, status: 'approved', admin_note: reviewNote })}
 disabled={reviewMutation.isPending}
 className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
 {reviewMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* ── Override Modal ── */}
 <AnimatePresence>
 {overrideModal && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
 onClick={() => setOverrideModal(null)}>
 <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
 onClick={e => e.stopPropagation()}
 className="bg-[var(--card-bg)] rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
 <h2 className="text-base font-bold text-slate-800">
 {overrideModal.overrideId ? 'Update' : 'Add'} Feature Override
 </h2>

 {!overrideModal.overrideId && (
 <div>
 <label className="block text-xs font-semibold text-slate-600r mb-1.5">Feature</label>
 <SearchableSelect
 accent="teal"
 value={overrideModal.featurePath || null}
 onChange={v => setOverrideModal(p => ({ ...p, featurePath: v || '' }))}
 placeholder="Select a feature..."
 options={Object.entries({
 '/memory-vault': 'Memory Vault', '/legacy-setup': 'Digital Legacy Setup',
 '/legacy-content': 'Legacy Content', '/heir-management': 'Heir Management',
 '/journal': 'Personal Journal', '/community': 'Community Hub',
 '/bereavement-support': 'Bereavement Support', '/pre-clinic': 'Pre-Clinic Checklist',
 '/appointments': 'Appointments', '/medications': 'Medications',
 '/wellness-checkin': 'Wellness Check-In', '/messages': 'Messages',
 '/my-space': 'Patient Portal (My Space)', '/resources': 'Resources',
 '/my-journey': 'My Journey Timeline', '/reports': 'Reports',
 }).map(([path, name]) => ({ value: path, label: name, sublabel: path }))}
 />
 </div>
 )}

 <div>
 <label className="block text-xs font-semibold text-slate-600r mb-1.5">State</label>
 <div className="grid grid-cols-3 gap-2">
 {['enabled', 'disabled', 'locked'].map(s => {
 const cfg = STATE_CFG[s];
 const Icon = cfg.icon;
 return (
 <button key={s} onClick={() => setOverrideModal(p => ({ ...p, current: s }))}
 className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
 overrideModal.current === s
 ? `${cfg.cls} border-current`
 : 'border-[var(--card-border)] text-[var(--text-500)] hover:bg-slate-50'
 }`}>
 <Icon size={16} /> {cfg.label}
 </button>
 );
 })}
 </div>
 <p className="text-xs text-[var(--text-400)] mt-2">
 {overrideModal.current === 'enabled' && 'Feature will be shown even if care setting hides it.'}
 {overrideModal.current === 'disabled' && 'Feature will be hidden regardless of care setting.'}
 {overrideModal.current === 'locked' && 'Feature is hidden and the user cannot request access to it.'}
 </p>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-600r mb-1.5">Note (optional)</label>
 <input value={overrideNote} onChange={e => setOverrideNote(e.target.value)}
 placeholder="Reason for this override..."
 className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
 </div>

 <div className="flex gap-3">
 <button onClick={() => setOverrideModal(null)}
 className="flex-1 py-2.5 border border-slate-300 text-[var(--text-600)] font-semibold rounded-xl text-sm hover:bg-[var(--card-bg)] transition">
 Cancel
 </button>
 <button
 disabled={!overrideModal.featurePath || overrideMutation.isPending}
 onClick={() => overrideMutation.mutate({
 user_id: overrideModal.userId,
 feature_path: overrideModal.featurePath,
 state: overrideModal.current,
 note: overrideNote,
 })}
 className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-2">
 {overrideMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
 Save Override
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}
