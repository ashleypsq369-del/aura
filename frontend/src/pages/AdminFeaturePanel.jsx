/**
 * AdminFeaturePanel — Feature flag management per user
 * Route: /admin/features
 *
 * Built with: AdminPageShell + DataTable (TanStack Table) + Dialog (Radix)
 * Reference: satnaing/shadcn-admin user management table pattern
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { AnimatePresence } from 'framer-motion';
import {
  ToggleRight, Users, Clock, Shield, CheckCircle,
  XCircle, Lock, EyeOff, Eye, Plus, RefreshCw, Loader2,
  ChevronDown,
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
const STATE = {
  enabled:  { label: 'Enabled',  dot: '#10b981', Icon: Eye         },
  disabled: { label: 'Disabled', dot: '#94a3b8', Icon: EyeOff      },
  locked:   { label: 'Locked',   dot: '#ef4444', Icon: Lock        },
};
const REQ_STATUS = {
  pending:  { dot: '#f59e0b', label: 'Pending'  },
  approved: { dot: '#10b981', label: 'Approved' },
  denied:   { dot: '#ef4444', label: 'Denied'   },
};
const SOURCE_LABEL = { admin: 'Admin', questionnaire: 'Questionnaire', request_approved: 'User request' };
const FEATURES = [
  ['/memory-vault','Memory Vault'],['/legacy-setup','Digital Legacy Setup'],
  ['/legacy-content','Legacy Content'],['/heir-management','Heir Management'],
  ['/journal','Personal Journal'],['/community','Community Hub'],
  ['/bereavement-support','Bereavement Support'],['/pre-clinic','Pre-Clinic Checklist'],
  ['/appointments','Appointments'],['/medications','Medications'],
  ['/wellness-checkin','Wellness Check-In'],['/messages','Messages'],
  ['/my-space','Patient Portal'],['/resources','Resources'],
  ['/my-journey','My Journey Timeline'],['/reports','Reports'],
];

/* ─── Override mini-list (sub-row content) ─────────────────────────── */
function OverrideList({ u, onAdd, onEdit, onRemove }) {
  return (
    <div style={{
      padding: '10px 20px 16px 32px',
      borderLeft: '3px solid var(--c-teal)',
      marginLeft: 16,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-400)', margin: '4px 0 8px' }}>
        Active overrides
      </p>
      {u.overrides.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-400)', margin: 0 }}>
          No overrides — features follow care-setting defaults.
        </p>
      )}
      {u.overrides.map(o => {
        const cfg = STATE[o.state] || STATE.disabled;
        return (
          <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusDot color={cfg.dot} label={cfg.label} size="sm" />
            <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--text-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {o.feature_name}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-400)' }}>
              {SOURCE_LABEL[o.source] || o.source}
            </span>
            <button
              onClick={e => { e.stopPropagation(); onEdit(u.id, o); }}
              style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-teal)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 6 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb,var(--c-teal) 10%,transparent)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >Edit</button>
            <button
              onClick={e => { e.stopPropagation(); onRemove(o.id); }}
              style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 6 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >Remove</button>
          </div>
        );
      })}
      <button
        onClick={e => { e.stopPropagation(); onAdd(u); }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 700, color: '#fff',
          background: 'linear-gradient(135deg,#0d9488,#0891b2)',
          border: 'none', cursor: 'pointer',
          padding: '5px 12px', borderRadius: 8,
          marginTop: 4, alignSelf: 'flex-start',
          boxShadow: '0 2px 8px rgba(13,148,136,0.25)',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <Plus size={11} /> Add override
      </button>
    </div>
  );
}
/* ─── Override dialog ──────────────────────────────────────────────── */
function OverrideDialog({ modal, onClose, onSave, isPending }) {
  const [featurePath, setFeaturePath] = useState(modal.featurePath || '');
  const [state, setState] = useState(modal.current || 'disabled');
  const [note,  setNote]  = useState(modal.note || '');

  const HELP = {
    enabled: 'Feature shown even if care-setting hides it.',
    disabled: 'Feature hidden regardless of care-setting.',
    locked: 'Hidden — user cannot request access.',
  };

  return (
    <Dialog
      open
      onOpenChange={open => !open && onClose()}
      title={modal.overrideId ? 'Edit Override' : 'Add Override'}
      description={modal.userName ? `for ${modal.userName}` : undefined}
      icon={Shield}
      accent="teal"
      size="sm"
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
            style={{ borderColor: 'var(--card-border)', color: 'var(--text-600)' }}
          >Cancel</button>
          <button
            disabled={(!modal.overrideId && !featurePath) || isPending}
            onClick={() => onSave({ user_id: modal.userId, feature_path: featurePath || modal.featurePath, state, note })}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: 'var(--c-teal)' }}
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Shield size={13} />}
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {!modal.overrideId && (
          <SearchableSelect
            accent="teal"
            value={featurePath || null}
            onChange={v => setFeaturePath(v || '')}
            placeholder="Select a feature…"
            options={FEATURES.map(([path, name]) => ({ value: path, label: name, sublabel: path }))}
          />
        )}
        {modal.overrideId && (
          <p className="text-sm font-semibold" style={{ color: 'var(--text-800)' }}>{modal.featureName}</p>
        )}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-500)' }}>State</p>
          <div className="grid grid-cols-3 gap-2">
            {(['enabled', 'disabled', 'locked']).map(s => {
              const cfg    = STATE[s];
              const active = state === s;
              return (
                <button key={s} onClick={() => setState(s)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-[11px] font-semibold transition-all"
                  style={{
                    borderColor: active ? cfg.dot : 'var(--card-border)',
                    background:  active ? `${cfg.dot}12` : 'transparent',
                    color:       active ? cfg.dot : 'var(--text-500)',
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.dot }} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-400)' }}>{HELP[state]}</p>
        </div>
        <div>
          <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--text-500)' }}>Note (optional)</label>
          <input
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="Reason for this override…"
            className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none"
            style={{ background: 'transparent', borderColor: 'var(--card-border)', color: 'var(--text-800)' }}
            onFocus={e => (e.target.style.borderColor = 'var(--c-teal)')}
            onBlur={e  => (e.target.style.borderColor = 'var(--card-border)')}
          />
        </div>
      </div>
    </Dialog>
  );
}

/* ─── Review dialog ────────────────────────────────────────────────── */
function ReviewDialog({ r, onClose, onDecide, isPending }) {
  const [note, setNote] = useState('');
  return (
    <Dialog
      open
      onOpenChange={open => !open && onClose()}
      title="Review Access Request"
      description={`${r.user?.name || 'User'} · ${r.feature_name}`}
      icon={Clock}
      accent="teal"
      size="sm"
      footer={
        <div className="flex gap-3">
          <button
            onClick={() => onDecide('denied', note)} disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition flex items-center justify-center gap-1.5"
            style={{ borderColor: 'var(--c-danger)', color: 'var(--c-danger)' }}
          >
            <XCircle size={13} /> Deny
          </button>
          <button
            onClick={() => onDecide('approved', note)} disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 transition"
            style={{ background: '#10b981' }}
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
            Approve
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="rounded-xl p-4 space-y-1.5" style={{ background: 'var(--page-bg)', border: '1px solid var(--card-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-800)' }}>{r.user?.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-600)' }}>
            Requesting: <span className="font-bold" style={{ color: 'var(--c-teal)' }}>{r.feature_name}</span>
          </p>
          {r.reason && <p className="text-xs leading-relaxed" style={{ color: 'var(--text-500)' }}>{r.reason}</p>}
        </div>
        <div>
          <label className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--text-500)' }}>Admin note (optional)</label>
          <textarea
            value={note} onChange={e => setNote(e.target.value)} rows={2}
            placeholder="Reason for your decision…"
            className="w-full rounded-xl px-3 py-2 text-sm border outline-none resize-none"
            style={{ background: 'transparent', borderColor: 'var(--card-border)', color: 'var(--text-800)' }}
            onFocus={e => (e.target.style.borderColor = 'var(--c-teal)')}
            onBlur={e  => (e.target.style.borderColor = 'var(--card-border)')}
          />
        </div>
      </div>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main page
═══════════════════════════════════════════════════════════════════ */
export default function AdminFeaturePanel() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const qc        = useQueryClient();

  const [tab,           setTab]           = useState('users');
  const [statusFilter,  setStatusFilter]  = useState('pending');
  const [reviewModal,   setReviewModal]   = useState(null);
  const [overrideModal, setOverrideModal] = useState(null);

  /* ── Queries ── */
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-feature-users'],
    queryFn: () => axios.get(`${API_URL}/api/features/admin/users`, { headers: authH() }).then(r => r.data),
    staleTime: 30_000, enabled: user?.role === 'admin',
  });
  const { data: requestsData, isLoading: loadingReqs } = useQuery({
    queryKey: ['admin-feature-requests', statusFilter],
    queryFn: () => axios.get(
      `${API_URL}/api/features/admin/requests?status=${statusFilter === 'all' ? '' : statusFilter}`,
      { headers: authH() }
    ).then(r => r.data),
    staleTime: 15_000, enabled: user?.role === 'admin',
  });

  /* ── Mutations ── */
  const reviewMut = useMutation({
    mutationFn: ({ id, status, admin_note }) =>
      axios.put(`${API_URL}/api/features/admin/requests/${id}/review`, { status, admin_note }, { headers: authH() }),
    onSuccess: (_, v) => { toast.success(`Request ${v.status}`); qc.invalidateQueries({ queryKey: ['admin-feature-requests'] }); qc.invalidateQueries({ queryKey: ['admin-feature-users'] }); setReviewModal(null); },
    onError: e => toast.error(e.response?.data?.detail || 'Failed'),
  });
  const overrideMut = useMutation({
    mutationFn: ({ user_id, feature_path, state, note }) =>
      axios.put(`${API_URL}/api/features/admin/override`, { user_id, feature_path, state, note }, { headers: authH() }),
    onSuccess: () => { toast.success('Override saved'); qc.invalidateQueries({ queryKey: ['admin-feature-users'] }); setOverrideModal(null); },
    onError: e => toast.error(e.response?.data?.detail || 'Failed'),
  });
  const removeMut = useMutation({
    mutationFn: id => axios.delete(`${API_URL}/api/features/admin/override/${id}`, { headers: authH() }),
    onSuccess: () => { toast.success('Override removed'); qc.invalidateQueries({ queryKey: ['admin-feature-users'] }); },
    onError: e => toast.error(e.response?.data?.detail || 'Failed'),
  });

  /* ── Derived ── */
  const userList   = usersData?.users     || [];
  const requests   = requestsData?.requests || [];
  const pending    = userList.reduce((s, u) => s + (u.pending_requests || 0), 0);
  const overrides  = userList.reduce((s, u) => s + u.override_count, 0);

  /* ── Columns — Users tab ── */
  const userCols = useMemo(() => [
    col.accessor('name', {
      header: 'User',
      cell: info => {
        const u        = info.row.original;
        const initials = (u.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const grads    = ['#0d9488','#0891b2','#059669','#7c3aed','#d97706','#e11d48'];
        const grad     = grads[(u.id || 0) % grads.length];
        return (
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:34, height:34, borderRadius:10, flexShrink:0,
              background:`linear-gradient(135deg,${grad},${grad}88)`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, fontWeight:800, color:'#fff',
              boxShadow:`0 2px 8px ${grad}35`,
            }}>
              {initials}
            </div>
            <div>
              <p style={{ fontSize:13, fontWeight:600, color:'var(--text-800)', margin:0 }}>{u.name}</p>
              <p style={{ fontSize:11, color:'var(--text-400)', margin:0 }}>{u.email || '—'}</p>
            </div>
          </div>
        );
      },
      meta: { thStyle: { minWidth: 180 } },
    }),
    col.accessor('role', {
      header: 'Role',
      cell: info => <span style={{ fontSize:12, textTransform:'capitalize', color:'var(--text-600)' }}>{info.getValue()}</span>,
    }),
    col.accessor('care_setting', {
      header: 'Care Setting',
      cell: info => <span className="text-xs" style={{ color: 'var(--text-500)' }}>{info.getValue() || '—'}</span>,
    }),
    col.accessor('override_count', {
      header: 'Overrides',
      cell: info => info.getValue() > 0
        ? <span className="text-xs font-semibold" style={{ color: 'var(--c-teal)' }}>{info.getValue()}</span>
        : <span className="text-xs" style={{ color: 'var(--text-400)' }}>—</span>,
    }),
    col.accessor('pending_requests', {
      header: 'Pending',
      cell: info => info.getValue() > 0
        ? <StatusDot color="#f59e0b" label={`${info.getValue()} pending`} size="sm" />
        : <span className="text-xs" style={{ color: 'var(--text-400)' }}>—</span>,
    }),
    col.display({
      id: 'expand',
      header: '',
      cell: info => (
        <ChevronDown
          size={13}
          style={{
            color: 'var(--text-400)',
            transition: 'transform 0.18s',
            transform: info.row.getIsExpanded() ? 'rotate(180deg)' : 'rotate(0)',
          }}
        />
      ),
      meta: { thStyle: { width: 32 } },
    }),
  ], []);

  /* ── Columns — Requests tab ── */
  const requestCols = useMemo(() => [
    col.accessor(r => r.user?.name || `#${r.user_id}`, {
      id: 'user',
      header: 'User',
      cell: info => (
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-800)' }}>{info.getValue()}</p>
          <p className="text-[11px] capitalize" style={{ color: 'var(--text-400)' }}>{info.row.original.user?.role}</p>
        </div>
      ),
    }),
    col.accessor('feature_name', {
      header: 'Feature',
      cell: info => <span className="text-xs font-semibold" style={{ color: 'var(--text-700)' }}>{info.getValue()}</span>,
    }),
    col.accessor('reason', {
      header: 'Reason',
      cell: info => (
        <span className="text-xs line-clamp-2" style={{ color: 'var(--text-600)', maxWidth: 220, display: 'block' }}>
          {info.getValue() || '—'}
        </span>
      ),
      meta: { tdStyle: { whiteSpace: 'normal' } },
    }),
    col.accessor('status', {
      header: 'Status',
      cell: info => {
        const sc = REQ_STATUS[info.getValue()] || REQ_STATUS.pending;
        const r  = info.row.original;
        return (
          <div>
            <StatusDot color={sc.dot} label={sc.label} size="sm" />
            {r.admin_note && (
              <p className="text-[10px] mt-0.5 italic" style={{ color: 'var(--text-400)' }}>{r.admin_note}</p>
            )}
          </div>
        );
      },
    }),
    col.accessor('created_at', {
      header: 'Date',
      cell: info => (
        <span className="text-[11px]" style={{ color: 'var(--text-400)' }}>
          {new Date(info.getValue()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      ),
    }),
    col.display({
      id: 'action',
      header: '',
      cell: info => info.row.original.status === 'pending' ? (
        <button
          onClick={e => { e.stopPropagation(); setReviewModal(info.row.original); }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 700, color: '#fff',
            background: 'linear-gradient(135deg,#0d9488,#0891b2)',
            border: 'none', cursor: 'pointer',
            padding: '4px 12px', borderRadius: 8,
            boxShadow: '0 2px 6px rgba(13,148,136,0.28)',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >Review</button>
      ) : null,
      meta: { thStyle: { width: 90 }, tdStyle: { textAlign: 'right' } },
    }),
  ], []);

  if (user?.role !== 'admin') { navigate('/dashboard'); return null; }

  return (
    <>
      <AdminPageShell
        icon={ToggleRight}
        title="Feature Control"
        meta={[
          { label: 'users',    value: usersData?.total ?? '—' },
          { label: 'overrides', value: overrides },
          ...(pending > 0 ? [{ label: 'pending', value: pending, color: '#f59e0b' }] : []),
        ]}
        tabs={[
          { id: 'users',    label: 'Users & Overrides', Icon: Users },
          { id: 'requests', label: 'Access Requests',   Icon: Clock, badge: pending },
        ]}
        activeTab={tab}
        onTabChange={setTab}
        toolbar={
          tab === 'users' ? undefined : (
            <div style={{ display: 'flex', gap: 6 }}>
              {(['pending','approved','denied','all']).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  style={{
                    padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
                    border: statusFilter === s ? '1px solid var(--c-teal)' : '1px solid var(--card-border)',
                    background: statusFilter === s ? 'color-mix(in srgb,var(--c-teal) 12%,var(--card-bg))' : 'var(--card-bg)',
                    color: statusFilter === s ? 'var(--c-teal)' : 'var(--text-500)',
                  }}>
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
          )
        }
      >
        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <>
            <DataTable
            columns={userCols}
            data={userList}
            isLoading={loadingUsers}
            searchColumnId="name"
            searchPlaceholder="Filter by name, role…"
            emptyTitle="No users found"
            renderSubRow={row => (
              <OverrideList
                u={row.original}
                onAdd={u => setOverrideModal({ userId: u.id, userName: u.name, featurePath: '', current: 'disabled', overrideId: null })}
                onEdit={(uid, o) => setOverrideModal({ userId: uid, featurePath: o.feature_path, featureName: o.feature_name, current: o.state, overrideId: o.id, note: o.note })}
                onRemove={id => removeMut.mutate(id)}
              />
            )}
          />
          </>
        )}

        {/* ── REQUESTS TAB ── */}
        {tab === 'requests' && (
          <DataTable
            columns={requestCols}
            data={requests}
            isLoading={loadingReqs}
            emptyTitle="No requests"
            emptyBody={`No ${statusFilter === 'all' ? '' : statusFilter} access requests.`}
          />
        )}
      </AdminPageShell>

      {/* ── Dialogs ── */}
      <AnimatePresence>
        {reviewModal && (
          <ReviewDialog
            r={reviewModal}
            onClose={() => setReviewModal(null)}
            onDecide={(status, admin_note) => reviewMut.mutate({ id: reviewModal.id, status, admin_note })}
            isPending={reviewMut.isPending}
          />
        )}
        {overrideModal && (
          <OverrideDialog
            modal={overrideModal}
            onClose={() => setOverrideModal(null)}
            onSave={data => overrideMut.mutate(data)}
            isPending={overrideMut.isPending}
          />
        )}
      </AnimatePresence>
    </>
  );
}
