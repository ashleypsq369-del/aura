/**
 * AdminUserManagement - User CRUD, role management, care-setting approvals
 * Route: /admin/users
 *
 * Built with: AdminPageShell + DataTable (TanStack) + Dialog (Radix) + StatusDot
 * Removes: PageHeader image, KpiCard grid, teal left-border rows, separate filter card
 * Stats live inline in the topbar meta strip.
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Users, Plus, Edit2, KeyRound, Loader2,
  CheckCircle, AlertCircle, Download, Shield,
  MoreVertical, AlertTriangle, Clock, X,
} from 'lucide-react';
import axios from 'axios';
import toast from '../utils/toast';
import AdminPageShell from '../components/admin/AdminPageShell';
import DataTable from '../components/admin/DataTable';
import StatusDot from '../components/admin/StatusDot';
import Dialog from '../components/ui/Dialog';
import SearchableSelect from '../components/ui/SearchableSelect';
import { API_URL } from '../api/client';

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });
const col   = createColumnHelper();

/* ─── Config ──────────────────────────────────────────────────────── */
const ROLES = ['admin', 'clinician', 'caregiver', 'patient', 'family'];

const ROLE_COLOR = {
  admin:     '#ef4444',
  clinician: '#3b82f6',
  caregiver: '#10b981',
  patient:   '#f59e0b',
  family:    '#8b5cf6',
};

const CARE_SETTINGS = {
  hospital_based:       'Hospital-Based',
  hospice:              'Hospice',
  home_based:           'Home-Based',
  outpatient_clinic:    'Outpatient Clinic',
  long_term_residential:'Long-Term Residential',
};

/* ─── Role badge - Services TYPE_META pill style ───────────────────── */
function RoleBadge({ role }) {
  const color = ROLE_COLOR[role] || '#64748b';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 700,
      padding: '3px 9px', borderRadius: 8,
      background: `linear-gradient(135deg,${color}18,${color}10)`,
      color,
      border: `1px solid ${color}28`,
      textTransform: 'capitalize',
      letterSpacing: '0.01em',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {role}
    </span>
  );
}

/* ─── Inline confirm ───────────────────────────────────────────────── */
function InlineConfirm({ message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        position: 'absolute', right: 0, top: 36, zIndex: 50, width: 280,
        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
        borderRadius: 12, padding: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <p style={{ fontSize: 12, color: 'var(--text-700)', lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 11, fontWeight: 600,
          border: '1px solid var(--card-border)', background: 'transparent',
          color: 'var(--text-600)', cursor: 'pointer',
        }}>Cancel</button>
        <button onClick={onConfirm} style={{
          flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 11, fontWeight: 700,
          border: 'none', color: '#fff', cursor: 'pointer',
          background: danger ? 'var(--c-danger)' : '#10b981',
        }}>{confirmLabel}</button>
      </div>
    </motion.div>
  );
}

/* ─── 3-dot action menu ────────────────────────────────────────────── */
function ActionMenu({ user, onEdit, onToggle, onReset, togglePending, resetPending }) {
  const [open, setOpen]       = useState(false);
  const [confirm, setConfirm] = useState(null);
  const ref                   = useRef(null);

  useEffect(() => {
    if (!open && !confirm) return;
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setConfirm(null); } };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open, confirm]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(o => !o); setConfirm(null); }}
        disabled={togglePending || resetPending}
        style={{
          width: 30, height: 30, borderRadius: 8, border: 'none',
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-400)',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--page-bg)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        aria-label="Actions"
      >
        {(togglePending || resetPending)
          ? <Loader2 size={13} className="animate-spin" />
          : <MoreVertical size={14} />}
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{
              position: 'absolute', right: 0, top: 34, zIndex: 50, width: 180,
              background: 'var(--card-bg)', border: '1px solid var(--card-border)',
              borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }}
          >
            {[
              { label: 'Edit user',       icon: '✏️', onClick: () => { setOpen(false); onEdit(); }           },
              { label: 'Reset password',  icon: '🔑', onClick: () => { setOpen(false); setConfirm('reset'); } },
            ].map(({ label, icon, onClick }) => (
              <button key={label} onClick={onClick} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px', background: 'transparent', border: 'none',
                fontSize: 12, color: 'var(--text-700)', cursor: 'pointer', textAlign: 'left',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--page-bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {icon} {label}
              </button>
            ))}
            <div style={{ height: 1, background: 'var(--card-border)', margin: '2px 0' }} />
            <button
              onClick={() => { setOpen(false); setConfirm('toggle'); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px', background: 'transparent', border: 'none',
                fontSize: 12, cursor: 'pointer', textAlign: 'left',
                color: user.is_active ? 'var(--c-danger)' : '#10b981',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--page-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {user.is_active ? '🚫 Deactivate' : '✅ Activate'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline confirm popups */}
      <AnimatePresence>
        {confirm === 'reset' && (
          <InlineConfirm
            message="Generate a temporary password for this user?"
            confirmLabel="Reset"
            danger={false}
            onConfirm={() => { setConfirm(null); onReset(); }}
            onCancel={() => setConfirm(null)}
          />
        )}
        {confirm === 'toggle' && (
          <InlineConfirm
            message={user.is_active
              ? `Deactivate ${user.full_name}? They will lose access immediately.`
              : `Reactivate ${user.full_name}?`}
            confirmLabel={user.is_active ? 'Deactivate' : 'Activate'}
            danger={user.is_active}
            onConfirm={() => { setConfirm(null); onToggle(); }}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Temp password dialog ─────────────────────────────────────────── */
function TempPasswordDialog({ password, onClose }) {
  const [copied, setCopied] = useState(false);
  return (
    <Dialog open onOpenChange={o => !o && onClose()} title="Temporary Password" icon={KeyRound} accent="amber" size="sm"
      footer={
        <button onClick={onClose} style={{
          width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 13,
          fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer',
          background: 'var(--c-teal)',
        }}>Done</button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 13, color: 'var(--text-600)', lineHeight: 1.5 }}>
          Share this temporary password securely. The user must change it on next login.
        </p>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: 12, borderRadius: 10,
          background: '#fffbeb', border: '2px solid #fcd34d',
        }}>
          <code style={{ flex: 1, fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#92400e', wordBreak: 'break-all' }}>
            {password}
          </code>
          <button
            onClick={() => { navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{
              flexShrink: 0, padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              border: 'none', cursor: 'pointer',
              background: copied ? '#10b981' : '#fcd34d',
              color: copied ? '#fff' : '#92400e',
            }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

/* ─── Create user dialog ───────────────────────────────────────────── */
function CreateUserDialog({ open, onClose, onSubmit, pending }) {
  const [form, setForm] = useState({
    username: '', email: '', full_name: '', role: 'clinician',
    password: '', phone: '', department: '',
  });
  const f   = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const ok  = form.username && form.email && form.password && form.full_name;

  const fields = [
    ['Full Name',   'full_name',  'text',     'Dr. Kofi Mensah'],
    ['Username',    'username',   'text',     'kmensah'],
    ['Email',       'email',      'email',    'k.mensah@hospital.gh'],
    ['Password',    'password',   'password', 'Min 8 characters'],
    ['Phone',       'phone',      'text',     '+233 24 000 0000'],
    ['Department',  'department', 'text',     'Palliative Care Unit'],
  ];

  const inputStyle = {
    width: '100%', height: 38, borderRadius: 10, padding: '0 12px',
    fontSize: 13, border: '1px solid var(--card-border)',
    background: 'transparent', color: 'var(--text-800)',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}
      title="Create New User" icon={Plus} accent="teal" size="md"
      footer={
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--text-600)', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => onSubmit(form)} disabled={pending || !ok} style={{
            flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700,
            color: '#fff', border: 'none', cursor: ok && !pending ? 'pointer' : 'not-allowed',
            background: 'var(--c-teal)', opacity: !ok || pending ? 0.5 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {pending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Create User
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fields.map(([label, key, type, ph]) => (
          <div key={key}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-500)', marginBottom: 5 }}>
              {label}
            </label>
            <input type={type} value={form[key]} onChange={f(key)} placeholder={ph}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--c-teal)')}
              onBlur={e  => (e.target.style.borderColor = 'var(--card-border)')}
            />
          </div>
        ))}
        <SearchableSelect label="Role" accent="teal" value={form.role}
          onChange={v => setForm(p => ({ ...p, role: v || 'clinician' }))}
          allowClear={false}
          options={ROLES.map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))}
        />
      </div>
    </Dialog>
  );
}

/* ─── Edit user dialog ─────────────────────────────────────────────── */
function EditUserDialog({ user, open, onClose, onSubmit, pending }) {
  const [form, setForm] = useState({
    full_name:          user.full_name || '',
    email:              user.email || '',
    phone:              user.phone || '',
    role:               user.role || 'clinician',
    department:         user.department || '',
    professional_title: user.professional_title || '',
    is_professional:    user.is_professional || false,
    care_setting:       user.care_setting || null,
  });
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const inputStyle = {
    width: '100%', height: 38, borderRadius: 10, padding: '0 12px',
    fontSize: 13, border: '1px solid var(--card-border)',
    background: 'transparent', color: 'var(--text-800)',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}
      title={`Edit: ${user.full_name}`} icon={Edit2} accent="teal" size="md"
      footer={
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--text-600)', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => onSubmit(form)} disabled={pending} style={{
            flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700,
            color: '#fff', border: 'none', cursor: pending ? 'not-allowed' : 'pointer',
            background: 'var(--c-teal)', opacity: pending ? 0.5 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {pending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
            Save Changes
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          ['Full Name',          'full_name',          'text'],
          ['Email',              'email',              'email'],
          ['Phone',              'phone',              'text'],
          ['Department',         'department',         'text'],
          ['Professional Title', 'professional_title', 'text'],
        ].map(([label, key, type]) => (
          <div key={key}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-500)', marginBottom: 5 }}>
              {label}
            </label>
            <input type={type} value={form[key]} onChange={f(key)}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--c-teal)')}
              onBlur={e  => (e.target.style.borderColor = 'var(--card-border)')}
            />
          </div>
        ))}
        <SearchableSelect label="Role" accent="teal" value={form.role}
          onChange={v => setForm(p => ({ ...p, role: v || p.role }))}
          allowClear={false}
          options={ROLES.map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))}
        />
        <SearchableSelect label="Care Setting" accent="teal" value={form.care_setting}
          onChange={v => setForm(p => ({ ...p, care_setting: v }))}
          nullLabel="No setting"
          options={Object.entries(CARE_SETTINGS).map(([v, l]) => ({ value: v, label: l }))}
        />
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: 12, borderRadius: 10, cursor: 'pointer',
          background: 'color-mix(in srgb, var(--c-teal) 6%, var(--card-bg))',
          border: '1px solid color-mix(in srgb, var(--c-teal) 20%, var(--card-border))',
        }}>
          <input type="checkbox" checked={form.is_professional}
            onChange={e => setForm(p => ({ ...p, is_professional: e.target.checked }))}
            style={{ width: 14, height: 14, accentColor: 'var(--c-teal)' }}
          />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-800)', margin: 0 }}>
              Professional verification
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-500)', marginTop: 2 }}>
              Mark as a verified healthcare professional
            </p>
          </div>
        </label>
      </div>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main page
═══════════════════════════════════════════════════════════════════ */
export default function AdminUserManagement() {
  const [roleFilter,   setRoleFilter]   = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [showCreate,   setShowCreate]   = useState(false);
  const [editUser,     setEditUser]     = useState(null);
  const [tempPwd,      setTempPwd]      = useState(null);
  const qc = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter, statusFilter],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (roleFilter)              p.append('role',      roleFilter);
      if (statusFilter === 'active')   p.append('is_active', 'true');
      if (statusFilter === 'inactive') p.append('is_active', 'false');
      const r = await axios.get(`${API_URL}/api/admin/users?${p}&per_page=200`, { headers: authH() });
      return r.data;
    },
    staleTime: 0,
  });

  const users = usersData?.users || [];
  const total = usersData?.total  || 0;

  const kpi = useMemo(() => ({
    active:   users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    admins:   users.filter(u => u.role === 'admin').length,
  }), [users]);

  const changeRequests = useMemo(() => users.filter(u => u.care_setting_change_request), [users]);

  /* ── Mutations ── */
  const toggleMut = useMutation({
    mutationFn: id => axios.put(`${API_URL}/api/admin/users/${id}/deactivate`, {}, { headers: authH() }),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('User status updated'); },
    onError: e => toast.error(e.response?.data?.detail || 'Failed'),
  });
  const resetMut = useMutation({
    mutationFn: id => axios.put(`${API_URL}/api/admin/users/${id}/reset-password`, {}, { headers: authH() }),
    onSuccess: r => setTempPwd(r.data.temp_password),
    onError: e => toast.error(e.response?.data?.detail || 'Failed'),
  });
  const createMut = useMutation({
    mutationFn: data => axios.post(`${API_URL}/api/admin/users`, data, { headers: authH() }),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); setShowCreate(false); toast.success('User created'); },
    onError: e => toast.error(e.response?.data?.detail || 'Failed to create user'),
  });
  const editMut = useMutation({
    mutationFn: ({ id, data }) => axios.put(`${API_URL}/api/admin/users/${id}`, data, { headers: authH() }),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); setEditUser(null); toast.success('User updated'); },
    onError: e => toast.error(e.response?.data?.detail || 'Failed'),
  });
  const approveSettingMut = useMutation({
    mutationFn: ({ id, setting }) => axios.put(`${API_URL}/api/admin/users/${id}`, { care_setting: setting }, { headers: authH() }),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('Care setting approved'); },
    onError: e => toast.error(e.response?.data?.detail || 'Failed'),
  });
  const dismissSettingMut = useMutation({
    mutationFn: id => axios.put(`${API_URL}/api/admin/users/${id}`, { care_setting_change_request: null }, { headers: authH() }),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('Request dismissed'); },
    onError: e => toast.error(e.response?.data?.detail || 'Failed'),
  });

  /* ── Export ── */
  const exportCSV = () => {
    const header = ['ID','Name','Email','Username','Role','Care Setting','Active','Last Login'];
    const rows   = users.map(u => [
      u.id, u.full_name, u.email, u.username, u.role,
      u.care_setting || '', u.is_active ? 'Yes' : 'No',
      u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never',
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const a   = document.createElement('a');
    a.href    = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  /* ── Table columns ── */
  const columns = useMemo(() => [
    col.accessor('full_name', {
      header: 'User',
      cell: info => {
        const u       = info.row.original;
        const initials = (u.full_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        /* Services ProviderCard: gradient avatar, initials watermark */
        const colors = ['#0d9488','#0891b2','#059669','#7c3aed','#d97706','#e11d48','#0369a1'];
        const grad   = colors[(u.id || 0) % colors.length];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12, flexShrink: 0,
              background: `linear-gradient(135deg,${grad},${grad}aa)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#fff',
              boxShadow: `0 2px 8px ${grad}30`,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-800)', margin: 0 }}>
                  {u.full_name}
                </p>
                {u.is_professional && (
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 4,
                    background: 'linear-gradient(90deg,#f0fdfa,#e0f2fe)',
                    color: '#0d9488', border: '1px solid #99f6e4',
                  }}>
                    ✓ Verified
                  </span>
                )}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-400)', margin: 0 }}>{u.email}</p>
            </div>
          </div>
        );
      },
      meta: { thStyle: { minWidth: 200 }, tdStyle: { whiteSpace: 'normal' } },
    }),
    col.accessor('role', {
      header: 'Role',
      cell: info => <RoleBadge role={info.getValue()} />,
      meta: { thStyle: { width: 110 } },
    }),
    col.accessor('care_setting', {
      header: 'Care Setting',
      cell: info => {
        const val = info.getValue();
        return val
          ? <span style={{ fontSize: 11, color: 'var(--c-teal)' }}>{CARE_SETTINGS[val] || val}</span>
          : <span style={{ fontSize: 11, color: 'var(--text-400)' }}>-</span>;
      },
      meta: { thStyle: { width: 160 } },
    }),
    col.accessor('is_active', {
      header: 'Status',
      cell: info => info.getValue()
        ? <StatusDot color="#10b981" label="Active"   size="sm" pulse pill />
        : <StatusDot color="#ef4444" label="Inactive" size="sm" pill />,
      meta: { thStyle: { width: 100 } },
    }),
    col.accessor('last_login', {
      header: 'Last login',
      cell: info => (
        <span style={{ fontSize: 11, color: 'var(--text-400)' }}>
          {info.getValue()
            ? new Date(info.getValue()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Never'}
        </span>
      ),
      meta: { thStyle: { width: 110 } },
    }),
    col.display({
      id: 'actions',
      header: '',
      cell: info => {
        const u = info.row.original;
        return (
          <ActionMenu
            user={u}
            onEdit={() => setEditUser(u)}
            onToggle={() => toggleMut.mutate(u.id)}
            onReset={() => resetMut.mutate(u.id)}
            togglePending={toggleMut.isPending}
            resetPending={resetMut.isPending}
          />
        );
      },
      meta: { thStyle: { width: 44 }, tdStyle: { textAlign: 'right' } },
    }),
  ], [toggleMut.isPending, resetMut.isPending]);

  /* ── Filter pills for role and status ── */
  const filterPills = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {/* Role pills */}
      {[null, ...ROLES].map(r => {
        const active = roleFilter === r;
        const color  = r ? ROLE_COLOR[r] : 'var(--c-teal)';
        return (
          <button key={r ?? 'all-roles'} onClick={() => setRoleFilter(r)}
            style={{
              padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s',
              border: active ? `1px solid ${color}` : '1px solid var(--card-border)',
              background: active ? `${color}15` : 'var(--card-bg)',
              color: active ? color : 'var(--text-500)',
            }}>
            {r ?? 'All roles'}
          </button>
        );
      })}
      <div style={{ width: 1, height: 16, background: 'var(--card-border)', margin: '0 4px' }} />
      {/* Status pills */}
      {[
        { key: null,       label: 'All status' },
        { key: 'active',   label: 'Active'     },
        { key: 'inactive', label: 'Inactive'   },
      ].map(({ key, label }) => {
        const active = statusFilter === key;
        const color  = key === 'active' ? '#10b981' : key === 'inactive' ? '#ef4444' : 'var(--c-teal)';
        return (
          <button key={key ?? 'all-status'} onClick={() => setStatusFilter(key)}
            style={{
              padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
              border: active ? `1px solid ${color}` : '1px solid var(--card-border)',
              background: active ? `${color}15` : 'var(--card-bg)',
              color: active ? color : 'var(--text-500)',
            }}>
            {label}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <AdminPageShell
        icon={Users}
        title="User Management"
        meta={[
          { label: 'total',    value: total },
          { label: 'active',   value: kpi.active,   color: '#10b981' },
          { label: 'inactive', value: kpi.inactive,  color: kpi.inactive > 0 ? '#ef4444' : 'var(--text-400)' },
          { label: 'admins',   value: kpi.admins,    color: '#8b5cf6' },
        ]}
        actions={
          <>
            <button onClick={exportCSV}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                border: '1px solid var(--card-border)',
                background: 'var(--card-bg)',
                color: 'var(--text-600)', cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-teal)'; e.currentTarget.style.color = 'var(--c-teal)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.color = 'var(--text-600)'; }}
            >
              <Download size={13} /> Export CSV
            </button>
            <button onClick={() => setShowCreate(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                border: 'none',
                background: 'linear-gradient(135deg,#0d9488,#0891b2)',
                color: '#fff', cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(13,148,136,0.35)',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Plus size={13} /> Add User
            </button>
          </>
        }
        toolbar={filterPills}
      >
        {/* Care setting change request banners */}
        {changeRequests.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {changeRequests.map(u => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                padding: '10px 14px', borderRadius: 10,
                background: '#fffbeb', border: '1px solid #fde68a',
                borderLeft: '3px solid #f59e0b',
              }}>
                <Clock size={13} style={{ color: '#d97706', flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#92400e', flex: 1, minWidth: 0, margin: 0 }}>
                  <strong>{u.full_name}</strong> requests care setting →{' '}
                  <strong>{CARE_SETTINGS[u.care_setting_change_request] || u.care_setting_change_request}</strong>
                  {u.care_setting_change_reason && ` - "${u.care_setting_change_reason}"`}
                </p>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => approveSettingMut.mutate({ id: u.id, setting: u.care_setting_change_request })}
                    disabled={approveSettingMut.isPending}
                    style={{ padding: '4px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', background: '#10b981' }}>
                    Approve
                  </button>
                  <button onClick={() => dismissSettingMut.mutate(u.id)}
                    disabled={dismissSettingMut.isPending}
                    style={{ padding: '4px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, color: 'var(--text-600)', border: '1px solid var(--card-border)', background: 'transparent', cursor: 'pointer' }}>
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          searchColumnId="full_name"
          searchPlaceholder="Search name, email, username…"
          emptyTitle="No users found"
          emptyBody="Try adjusting your filters."
          pageSize={25}
        />
      </AdminPageShell>

      {/* Dialogs */}
      <AnimatePresence>
        {showCreate && (
          <CreateUserDialog open onClose={() => setShowCreate(false)}
            onSubmit={createMut.mutate} pending={createMut.isPending} />
        )}
        {editUser && (
          <EditUserDialog user={editUser} open onClose={() => setEditUser(null)}
            onSubmit={d => editMut.mutate({ id: editUser.id, data: d })} pending={editMut.isPending} />
        )}
        {tempPwd && <TempPasswordDialog password={tempPwd} onClose={() => setTempPwd(null)} />}
      </AnimatePresence>
    </>
  );
}
