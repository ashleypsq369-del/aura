import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Users, Search, Plus, Edit2, UserCheck, UserX, KeyRound,
 X, Loader2, CheckCircle, AlertCircle, Download,
 Shield, MoreVertical, AlertTriangle, Clock, ChevronDown,
} from 'lucide-react';
import axios from 'axios';
import toast from '../utils/toast';
import PageHeader from '../components/PageHeader';
import SearchableSelect from '../components/ui/SearchableSelect';
import ModalShell from '../components/ui/ModalShell';
import { API_URL } from '../api/client';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

const ROLES = ['admin', 'clinician', 'caregiver', 'patient', 'family'];

const CARE_SETTINGS = {
 hospital_based: 'Hospital-Based',
 hospice: 'Hospice',
 home_based: 'Home-Based',
 outpatient_clinic: 'Outpatient Clinic',
 long_term_residential: 'Long-Term Residential',
};

const ROLE_BADGE = {
 admin: 'bg-red-100 text-red-700 border-red-200',
 clinician: 'bg-slate-100 text-[var(--text-600)] border-slate-200',
 caregiver: 'bg-green-100 text-green-700 border-green-200',
 patient: 'bg-amber-100 text-amber-700 border-amber-200',
 family: 'bg-pink-100 text-pink-700 border-pink-200',
};

// ─────────────────────────────────────────────
// KpiCard
// ─────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, onClick, active }) {
 return (
 <button
 onClick={onClick}
 className={`bg-[var(--card-bg)] rounded-xl border-2 px-4 py-3 text-left w-full transition-all ${
 active ? 'border-teal-500 shadow-md' : 'border-[var(--card-border)] hover:border-slate-300'
 }`}
 >
 <div className="flex items-center gap-2 mb-1">
 <Icon size={15} className={color} />
 <span className="text-xs font-medium text-slate-500">{label}</span>
 </div>
 <p className={`text-2xl font-bold ${color}`}>{value}</p>
 </button>
 );
}

// ─────────────────────────────────────────────
// TempPasswordModal
// ─────────────────────────────────────────────
function TempPasswordModal({ password, onClose }) {
 const [copied, setCopied] = useState(false);
 const copy = () => {
 navigator.clipboard.writeText(password);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };
 return (
 <ModalShell
 open onClose={onClose}
 title="Temporary Password" icon={KeyRound} accent="amber" size="sm"
 footer={
 <button onClick={onClose} className="w-full py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700">
 Done
 </button>
 }
 >
 <p className="text-sm text-[var(--text-600)] mb-3">
 Share this temporary password securely. The user must change it on next login.
 </p>
 <div className="flex items-center gap-2 p-3 bg-amber-50 border-2 border-amber-300 rounded-xl">
 <code className="flex-1 font-mono text-base font-bold text-amber-900 break-all">{password}</code>
 <button
 onClick={copy}
 className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
 copied ? 'bg-green-600 text-white' : 'bg-amber-200 text-amber-800 hover:bg-amber-300'
 }`}
 >
 {copied ? '✓ Copied' : 'Copy'}
 </button>
 </div>
 </ModalShell>
 );
}

// ─────────────────────────────────────────────
// CreateUserModal
// ─────────────────────────────────────────────
function CreateUserModal({ open, onClose, onSubmit, pending }) {
 const [form, setForm] = useState({
 username: '', email: '', full_name: '', role: 'clinician',
 password: '', phone: '', department: '',
 });
 const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
 const valid = form.username && form.email && form.password && form.full_name;

 const fields = [
 ['Full Name', 'full_name', 'text', 'Dr. Kofi Mensah'],
 ['Username', 'username', 'text', 'kmensah'],
 ['Email', 'email', 'email', 'k.mensah@hospital.gh'],
 ['Password', 'password', 'password', 'Min 8 characters'],
 ['Phone', 'phone', 'text', '+233 24 000 0000'],
 ['Department', 'department', 'text', 'Palliative Care Unit'],
 ];

 return (
 <ModalShell
 open={open} onClose={onClose}
 title="Create New User" icon={Plus} accent="teal" size="md"
 footer={
 <div className="flex gap-3">
 <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold border-2 border-slate-300 rounded-xl hover:bg-slate-50">
 Cancel
 </button>
 <button
 onClick={() => onSubmit(form)} disabled={pending || !valid}
 className="flex-1 py-2.5 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
 >
 {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
 Create User
 </button>
 </div>
 }
 >
 <div className="space-y-3">
 {fields.map(([label, key, type, ph]) => (
 <div key={key}>
 <label className="block text-xs font-semibold text-slate-600r mb-1">{label}</label>
 <input
 type={type} value={form[key]} onChange={f(key)} placeholder={ph}
 className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm focus:border-teal-500 outline-none"
 />
 </div>
 ))}
 <SearchableSelect
 label="Role" accent="teal" value={form.role}
 onChange={(v) => setForm((p) => ({ ...p, role: v || 'clinician' }))}
 allowClear={false}
 options={ROLES.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))}
 />
 </div>
 </ModalShell>
 );
}

// ─────────────────────────────────────────────
// EditUserModal
// ─────────────────────────────────────────────
function EditUserModal({ user, open, onClose, onSubmit, pending }) {
 const [form, setForm] = useState({
 full_name: user.full_name || '',
 email: user.email || '',
 phone: user.phone || '',
 role: user.role || 'clinician',
 department: user.department || '',
 professional_title: user.professional_title || '',
 is_professional: user.is_professional || false,
 care_setting: user.care_setting || null,
 });
 const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

 const textFields = [
 ['Full Name', 'full_name', 'text'],
 ['Email', 'email', 'email'],
 ['Phone', 'phone', 'text'],
 ['Department', 'department', 'text'],
 ['Professional Title', 'professional_title', 'text'],
 ];

 return (
 <ModalShell
 open={open} onClose={onClose}
 title={`Edit: ${user.full_name}`} icon={Edit2} accent="teal" size="md"
 footer={
 <div className="flex gap-3">
 <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold border-2 border-slate-300 rounded-xl hover:bg-slate-50">
 Cancel
 </button>
 <button
 onClick={() => onSubmit(form)} disabled={pending}
 className="flex-1 py-2.5 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
 >
 {pending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
 Save Changes
 </button>
 </div>
 }
 >
 <div className="space-y-3">
 {textFields.map(([label, key, type]) => (
 <div key={key}>
 <label className="block text-xs font-semibold text-slate-600r mb-1">{label}</label>
 <input
 type={type} value={form[key]} onChange={f(key)}
 className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm focus:border-teal-500 outline-none"
 />
 </div>
 ))}
 <SearchableSelect
 label="Role" accent="teal" value={form.role}
 onChange={(v) => setForm((p) => ({ ...p, role: v || p.role }))}
 allowClear={false}
 options={ROLES.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))}
 />
 <SearchableSelect
 label="Care Setting" accent="teal" value={form.care_setting}
 onChange={(v) => setForm((p) => ({ ...p, care_setting: v }))}
 nullLabel="No setting"
 options={Object.entries(CARE_SETTINGS).map(([v, l]) => ({ value: v, label: l }))}
 />
 <label className="flex items-center gap-3 p-3 bg-teal-50 border border-teal-200 rounded-xl cursor-pointer">
 <input
 type="checkbox" checked={form.is_professional}
 onChange={(e) => setForm((p) => ({ ...p, is_professional: e.target.checked }))}
 className="w-4 h-4 accent-teal-600"
 />
 <div>
 <p className="text-sm font-semibold text-teal-900">Professional Verification</p>
 <p className="text-xs text-teal-700">Mark this user as a verified healthcare professional</p>
 </div>
 </label>
 </div>
 </ModalShell>
 );
}

// ─────────────────────────────────────────────
// InlineConfirm - small card shown in-row for destructive actions
// ─────────────────────────────────────────────
function InlineConfirm({ message, onConfirm, onCancel, confirmLabel = 'Confirm', confirmClass = 'bg-red-600 hover:bg-red-700' }) {
 return (
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: -4 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: -4 }}
 transition={{ duration: 0.15 }}
 className="flex items-center gap-3 px-3 py-2 bg-amber-50 border border-amber-300 rounded-xl shadow-md flex-wrap"
 >
 <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
 <span className="text-xs text-amber-900 font-medium flex-1 min-w-0">{message}</span>
 <div className="flex items-center gap-2 flex-shrink-0">
 <button
 onClick={onCancel}
 className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--card-bg)] border border-slate-300 hover:bg-[var(--card-bg)] text-[var(--text-700)] transition"
 >
 Cancel
 </button>
 <button
 onClick={onConfirm}
 className={`px-3 py-1.5 text-xs font-bold rounded-lg text-white transition ${confirmClass}`}
 >
 {confirmLabel}
 </button>
 </div>
 </motion.div>
 );
}

// ─────────────────────────────────────────────
// ActionMenu - 3-dot dropdown per row
// ─────────────────────────────────────────────
function ActionMenu({ user, onEdit, onToggle, onReset, togglePending, resetPending }) {
 const [open, setOpen] = useState(false);
 // 'deactivate' | 'reset' | null
 const [confirm, setConfirm] = useState(null);
 const menuRef = useRef(null);

 // Close on outside click
 useEffect(() => {
 if (!open) return;
 const handler = (e) => {
 if (menuRef.current && !menuRef.current.contains(e.target)) {
 setOpen(false);
 setConfirm(null);
 }
 };
 document.addEventListener('mousedown', handler);
 return () => document.removeEventListener('mousedown', handler);
 }, [open]);

 const handleEdit = () => {
 setOpen(false);
 setConfirm(null);
 onEdit();
 };

 const handleResetClick = () => {
 setConfirm('reset');
 setOpen(false);
 };

 const handleToggleClick = () => {
 setConfirm('deactivate');
 setOpen(false);
 };

 const handleConfirmReset = () => {
 setConfirm(null);
 onReset();
 };

 const handleConfirmToggle = () => {
 setConfirm(null);
 onToggle();
 };

 return (
 <div className="relative" ref={menuRef}>
 {/* 3-dot trigger */}
 <button
 onClick={() => { setOpen((o) => !o); setConfirm(null); }}
 disabled={togglePending || resetPending}
 className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-[var(--text-500)] hover:text-[var(--text-700)] transition disabled:opacity-40"
 aria-label="Actions"
 >
 {(togglePending || resetPending)
 ? <Loader2 size={14} className="animate-spin" />
 : <MoreVertical size={16} />
 }
 </button>

 {/* Dropdown */}
 <AnimatePresence>
 {open && (
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: -6 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: -6 }}
 transition={{ duration: 0.12, ease: 'easeOut' }}
 className="absolute right-0 top-9 z-50 w-52 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-xl overflow-hidden"
 >
 <button
 onClick={handleEdit}
 className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-700)] hover:bg-[var(--card-bg)] transition text-left"
 >
 <span>✏️</span> Edit User
 </button>
 <button
 onClick={handleResetClick}
 className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-700)] hover:bg-amber-50 transition text-left"
 >
 <span>🔑</span> Reset Password
 </button>
 <div className="border-t border-[var(--card-border)]/50 my-0.5" />
 <button
 onClick={handleToggleClick}
 className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition text-left ${
 user.is_active
 ? 'text-red-600 hover:bg-red-50'
 : 'text-emerald-600 hover:bg-emerald-50'
 }`}
 >
 <span>{user.is_active ? '🚫' : '✅'}</span>
 {user.is_active ? 'Deactivate' : 'Activate'}
 </button>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Inline confirm cards */}
 <AnimatePresence>
 {confirm === 'reset' && (
 <div className="absolute right-0 top-9 z-50 w-72">
 <InlineConfirm
 message="This will generate a temporary password. Continue?"
 confirmLabel="Yes, Reset"
 confirmClass="bg-amber-600 hover:bg-amber-700"
 onConfirm={handleConfirmReset}
 onCancel={() => setConfirm(null)}
 />
 </div>
 )}
 {confirm === 'deactivate' && (
 <div className="absolute right-0 top-9 z-50 w-80">
 <InlineConfirm
 message={
 user.is_active
 ? `Deactivate ${user.full_name}? They will lose access immediately.`
 : `Reactivate ${user.full_name}? They will regain access.`
 }
 confirmLabel={user.is_active ? 'Deactivate' : 'Activate'}
 confirmClass={user.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}
 onConfirm={handleConfirmToggle}
 onCancel={() => setConfirm(null)}
 />
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function AdminUserManagement() {
 const [search, setSearch] = useState('');
 const [roleFilter, setRoleFilter] = useState(null);
 const [statusFilter, setStatusFilter] = useState(null);
 const [showCreate, setShowCreate] = useState(false);
 const [editUser, setEditUser] = useState(null);
 const [tempPwd, setTempPwd] = useState(null);
 const qc = useQueryClient();

 // ── Fetch users ───────────────────────────────────────────────
 const { data: usersData, isLoading } = useQuery({
 queryKey: ['admin-users', roleFilter, statusFilter, search],
 queryFn: async () => {
 const p = new URLSearchParams();
 if (roleFilter) p.append('role', roleFilter);
 if (statusFilter === 'active') p.append('is_active', 'true');
 if (statusFilter === 'inactive') p.append('is_active', 'false');
 if (search) p.append('search', search);
 const r = await axios.get(`${API_URL}/api/admin/users?${p}&per_page=100`, { headers: authH() });
 return r.data;
 },
 staleTime: 0,
 });

 const users = usersData?.users || [];
 const total = usersData?.total || 0;

 const kpi = useMemo(() => ({
 active: users.filter((u) => u.is_active).length,
 inactive: users.filter((u) => !u.is_active).length,
 admins: users.filter((u) => u.role === 'admin').length,
 }), [users]);

 const changeRequests = useMemo(() => users.filter((u) => u.care_setting_change_request), [users]);

 // ── Mutations ─────────────────────────────────────────────────
 const toggleMutation = useMutation({
 mutationFn: (id) => axios.put(`${API_URL}/api/admin/users/${id}/deactivate`, {}, { headers: authH() }),
 onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('User status updated'); },
 onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
 });

 const resetMutation = useMutation({
 mutationFn: (id) => axios.put(`${API_URL}/api/admin/users/${id}/reset-password`, {}, { headers: authH() }),
 onSuccess: (r) => setTempPwd(r.data.temp_password),
 onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
 });

 const createMutation = useMutation({
 mutationFn: (data) => axios.post(`${API_URL}/api/admin/users`, data, { headers: authH() }),
 onSuccess: () => { qc.invalidateQueries(['admin-users']); setShowCreate(false); toast.success('User created'); },
 onError: (e) => toast.error(e.response?.data?.detail || 'Failed to create user'),
 });

 const editMutation = useMutation({
 mutationFn: ({ id, data }) => axios.put(`${API_URL}/api/admin/users/${id}`, data, { headers: authH() }),
 onSuccess: () => { qc.invalidateQueries(['admin-users']); setEditUser(null); toast.success('User updated'); },
 onError: (e) => toast.error(e.response?.data?.detail || 'Failed to update user'),
 });

 const approveSettingMutation = useMutation({
 mutationFn: ({ id, setting }) => axios.put(`${API_URL}/api/admin/users/${id}`, { care_setting: setting }, { headers: authH() }),
 onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('Care setting approved'); },
 onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
 });

 const dismissSettingMutation = useMutation({
 mutationFn: (id) => axios.put(`${API_URL}/api/admin/users/${id}`, { care_setting_change_request: null }, { headers: authH() }),
 onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('Request dismissed'); },
 onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
 });

 // ── Export CSV ────────────────────────────────────────────────
 const exportCSV = () => {
 const headers = ['ID', 'Name', 'Email', 'Username', 'Role', 'Care Setting', 'Active', 'Last Login', 'Created'];
 const rows = users.map((u) => [
 u.id, u.full_name, u.email, u.username, u.role,
 u.care_setting || '',
 u.is_active ? 'Yes' : 'No',
 u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never',
 u.created_at ? new Date(u.created_at).toLocaleDateString() : '',
 ]);
 const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
 const blob = new Blob([csv], { type: 'text/csv' });
 const a = document.createElement('a');
 a.href = URL.createObjectURL(blob);
 a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
 a.click();
 };

 // ─────────────────────────────────────────────
 // Render
 // ─────────────────────────────────────────────
 return (
 <div className="min-h-screen pb-12">

 {/* ── Page Header ─────────────────────────── */}
 <PageHeader
 image="/resources/african/african-health-tech.jpg"
 title="User Management"
 subtitle="Manage system users, roles, and access"
 icon={Users}
 >
 <button
 onClick={() => setShowCreate(true)}
 className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-bold border border-white/30 transition"
 >
 <Plus size={15} /> Add User
 </button>
 <button
 onClick={exportCSV}
 className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-bold border border-white/30 transition"
 >
 <Download size={15} /> Export CSV
 </button>
 </PageHeader>

 <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-5">

 {/* ── KPI Cards ───────────────────────────── */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 <KpiCard
 label="Total Users" value={total} icon={Users} color="text-teal-600"
 onClick={() => { setRoleFilter(null); setStatusFilter(null); }}
 active={!roleFilter && !statusFilter}
 />
 <KpiCard
 label="Active" value={kpi.active} icon={CheckCircle} color="text-emerald-600"
 onClick={() => setStatusFilter('active')}
 active={statusFilter === 'active'}
 />
 <KpiCard
 label="Inactive" value={kpi.inactive} icon={AlertCircle} color="text-red-500"
 onClick={() => setStatusFilter('inactive')}
 active={statusFilter === 'inactive'}
 />
 <KpiCard
 label="Admins" value={kpi.admins} icon={Shield} color="text-purple-600"
 onClick={() => setRoleFilter('admin')}
 active={roleFilter === 'admin'}
 />
 </div>

 {/* ── Filters ─────────────────────────────── */}
 <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] shadow-sm p-4 flex flex-col md:flex-row gap-3">
 <div className="flex-1 relative">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search name, email, username…"
 className="w-full pl-9 pr-4 py-2.5 border border-[var(--card-border)] rounded-xl text-sm focus:border-teal-500 outline-none"
 />
 </div>
 <SearchableSelect
 className="w-48" accent="teal" size="sm"
 value={roleFilter} onChange={(v) => setRoleFilter(v)}
 placeholder="All Roles" nullLabel="All Roles"
 options={ROLES.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))}
 />
 <SearchableSelect
 className="w-44" accent="teal" size="sm"
 value={statusFilter} onChange={(v) => setStatusFilter(v)}
 placeholder="All Status" nullLabel="All Status"
 options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
 />
 </div>

 {/* ── Pending Care Setting Change Requests ── */}
 {changeRequests.length > 0 && (
 <div className="space-y-2">
 {changeRequests.map((u) => (
 <div key={`req-${u.id}`} className="flex items-center gap-3 flex-wrap px-4 py-3 bg-amber-50 border-l-4 border-l-amber-400 border border-amber-200 rounded-xl shadow-sm">
 <Clock size={14} className="text-amber-600 flex-shrink-0" />
 <p className="text-xs font-semibold text-amber-900 flex-1 min-w-0">
 <strong>{u.full_name}</strong> requests care setting change to{' '}
 <strong>{CARE_SETTINGS[u.care_setting_change_request] || u.care_setting_change_request}</strong>
 {u.care_setting_change_reason && ` - "${u.care_setting_change_reason}"`}
 </p>
 <button
 onClick={() => approveSettingMutation.mutate({ id: u.id, setting: u.care_setting_change_request })}
 disabled={approveSettingMutation.isPending}
 className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
 >
 Approve
 </button>
 <button
 onClick={() => dismissSettingMutation.mutate(u.id)}
 disabled={dismissSettingMutation.isPending}
 className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-[var(--text-700)] text-xs font-bold rounded-lg transition disabled:opacity-50"
 >
 Dismiss
 </button>
 </div>
 ))}
 </div>
 )}

 {/* ── Users Table ─────────────────────────── */}
 <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] shadow-sm overflow-hidden">
 {isLoading ? (
 <div className="p-12 text-center">
 <Loader2 size={28} className="animate-spin text-teal-600 mx-auto mb-3" />
 <p className="text-[var(--text-500)] text-sm">Loading users…</p>
 </div>
 ) : users.length === 0 ? (
 <div className="p-12 text-center">
 <Users size={36} className="mx-auto text-slate-300 mb-3" />
 <p className="text-[var(--text-600)] font-semibold">No users found</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-[var(--card-bg)] border-b-2 border-slate-200">
 <tr>
 {['User', 'Role', 'Care Setting', 'Status', 'Last Login', 'Actions'].map((h) => (
 <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-[var(--text-500)] ">
 {h}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {users.map((u) => (
 <motion.tr
 key={u.id}
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="hover:bg-teal-50/30 transition-colors border-l-4 border-transparent hover:border-l-teal-500"
 >
 {/* User cell */}
 <td className="px-4 py-3">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
 {(u.full_name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
 </div>
 <div>
 <div className="flex items-center gap-1.5">
 <p className="font-semibold text-slate-900">{u.full_name}</p>
 {u.is_professional && (
 <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700">
 Verified
 </span>
 )}
 </div>
 <p className="text-xs text-slate-500">{u.email}</p>
 <p className="text-[10px] text-slate-400">@{u.username}</p>
 </div>
 </div>
 </td>

 {/* Role cell */}
 <td className="px-4 py-3">
 <span className={`text-xs font-bold px-2 py-1 rounded-full border capitalize ${
 ROLE_BADGE[u.role] || 'bg-slate-100 text-[var(--text-600)] border-slate-200'
 }`}>
 {u.role}
 </span>
 </td>

 {/* Care setting cell */}
 <td className="px-4 py-3 text-xs text-slate-600">
 {u.care_setting
 ? <span className="px-2 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-medium">
 {CARE_SETTINGS[u.care_setting] || u.care_setting}
 </span>
 : <span className="text-slate-400"> - </span>
 }
 </td>

 {/* Status cell */}
 <td className="px-4 py-3">
 {u.is_active
 ? <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle size={12} /> Active</span>
 : <span className="flex items-center gap-1 text-xs font-semibold text-red-600"><AlertCircle size={12} /> Inactive</span>
 }
 </td>

 {/* Last login cell */}
 <td className="px-4 py-3 text-xs text-slate-500">
 {u.last_login
 ? new Date(u.last_login).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
 : 'Never'
 }
 </td>

 {/* Actions cell */}
 <td className="px-4 py-3">
 <ActionMenu
 user={u}
 onEdit={() => setEditUser(u)}
 onToggle={() => toggleMutation.mutate(u.id)}
 onReset={() => resetMutation.mutate(u.id)}
 togglePending={toggleMutation.isPending}
 resetPending={resetMutation.isPending}
 />
 </td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>

 {/* ── Modals ──────────────────────────────── */}
 <AnimatePresence>
 {showCreate && (
 <CreateUserModal
 open
 onClose={() => setShowCreate(false)}
 onSubmit={createMutation.mutate}
 pending={createMutation.isPending}
 />
 )}
 {editUser && (
 <EditUserModal
 user={editUser}
 open
 onClose={() => setEditUser(null)}
 onSubmit={(d) => editMutation.mutate({ id: editUser.id, data: d })}
 pending={editMutation.isPending}
 />
 )}
 {tempPwd && (
 <TempPasswordModal password={tempPwd} onClose={() => setTempPwd(null)} />
 )}
 </AnimatePresence>
 </div>
 );
}
