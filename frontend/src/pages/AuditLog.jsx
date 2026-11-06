/**
 * AuditLog - System activity trail, HIPAA compliance record
 * Route: /admin/audit
 *
 * Built with: AdminPageShell + DataTable (TanStack) + StatusDot
 * Removes: dark gradient header card, search-inside-card, bg-slate-100 thead
 * Stats live inline in topbar meta strip.
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Shield, Activity, User, Eye, Edit2, Trash2, LogIn, LogOut,
  Download,
} from 'lucide-react';
import axios from 'axios';
import AdminPageShell from '../components/admin/AdminPageShell';
import DataTable from '../components/admin/DataTable';
import { API_URL } from '../api/client';

const col = createColumnHelper();

/* ─── Config ──────────────────────────────────────────────────────── */
const ACTION_CFG = {
  CREATE: { color: '#10b981', label: 'Create',  Icon: Activity },
  UPDATE: { color: '#0d9488', label: 'Update',  Icon: Edit2    },
  DELETE: { color: '#ef4444', label: 'Delete',  Icon: Trash2   },
  LOGIN:  { color: '#f59e0b', label: 'Login',   Icon: LogIn    },
  LOGOUT: { color: '#64748b', label: 'Logout',  Icon: LogOut   },
  VIEW:   { color: '#3b82f6', label: 'View',    Icon: Eye      },
  ACCESS: { color: '#8b5cf6', label: 'Access',  Icon: Shield   },
};

function getActionCfg(action) {
  const key = action?.toUpperCase();
  const match = Object.keys(ACTION_CFG).find(k => key?.includes(k));
  return ACTION_CFG[match] || { color: '#64748b', label: action, Icon: Activity };
}

/* ─── Action badge - Services TYPE_META gradient pill style ─────────── */
function ActionBadge({ action }) {
  const cfg  = getActionCfg(action);
  const Icon = cfg.Icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 8,
      fontSize: 11, fontWeight: 700,
      background: `linear-gradient(135deg,${cfg.color}18,${cfg.color}0c)`,
      color: cfg.color,
      border: `1px solid ${cfg.color}28`,
    }}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

/* ─── Columns ──────────────────────────────────────────────────────── */
const columns = [
  col.accessor(r => r.timestamp || r.created_at, {
    id: 'time',
    header: 'Time',
    cell: info => {
      const val = info.getValue();
      return (
        <span style={{ fontSize: 11, color: 'var(--text-500)', whiteSpace: 'nowrap' }}>
          {val
            ? new Date(val).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
            : '-'}
        </span>
      );
    },
    meta: { thStyle: { width: 140 } },
  }),
  col.accessor(r => r.user_name || r.username || 'System', {
    id: 'user',
    header: 'User',
    cell: info => {
      const log     = info.row.original;
      const name    = info.getValue();
      const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      const grads   = ['#0d9488','#0891b2','#059669','#7c3aed','#d97706','#e11d48'];
      const grad    = grads[(log.user_id || 0) % grads.length];
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: `linear-gradient(135deg,${grad},${grad}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: '#fff',
            boxShadow: `0 2px 6px ${grad}30`,
          }}>
            {initials}
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-800)', margin: 0 }}>{name}</p>
            {log.user_role && (
              <p style={{ fontSize: 10, color: 'var(--text-400)', margin: 0, textTransform: 'capitalize' }}>
                {log.user_role}
              </p>
            )}
          </div>
        </div>
      );
    },
    meta: { thStyle: { minWidth: 150 }, tdStyle: { whiteSpace: 'normal' } },
  }),
  col.accessor(r => r.action_type || r.action, {
    id: 'action',
    header: 'Action',
    cell: info => <ActionBadge action={info.getValue()} />,
    meta: { thStyle: { width: 110 } },
  }),
  col.accessor(r => r.resource_type || r.resource, {
    id: 'resource',
    header: 'Resource',
    cell: info => {
      const log = info.row.original;
      const res = info.getValue();
      return (
        <span style={{ fontSize: 11, color: 'var(--text-600)' }}>
          {res || '-'}
          {log.resource_id && (
            <span style={{ color: 'var(--text-400)' }}> #{log.resource_id}</span>
          )}
        </span>
      );
    },
    meta: { thStyle: { width: 130 } },
  }),
  col.accessor('ip_address', {
    header: 'IP',
    cell: info => (
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-500)' }}>
        {info.getValue() || '-'}
      </span>
    ),
    meta: { thStyle: { width: 120 } },
  }),
  col.accessor(r => r.details || r.description, {
    id: 'details',
    header: 'Details',
    cell: info => (
      <span style={{ fontSize: 11, color: 'var(--text-500)', maxWidth: 240, display: 'block',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {info.getValue() || '-'}
      </span>
    ),
    meta: { thStyle: { minWidth: 160 }, tdStyle: { whiteSpace: 'normal' } },
  }),
];

/* ═══════════════════════════════════════════════════════════════════
   Main page
═══════════════════════════════════════════════════════════════════ */
export default function AuditLog() {
  const [actionFilter, setActionFilter] = useState('all');
  const token   = localStorage.getItem('auth_token');
  const headers = { Authorization: `Bearer ${token}` };

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: 500 });
      if (actionFilter !== 'all') params.append('action', actionFilter);
      const r = await axios.get(`${API_URL}/api/admin/audit-log?${params}`, { headers });
      return r.data;
    },
    retry: 1,
  });

  const logs = useMemo(() =>
    Array.isArray(logsData) ? logsData
    : Array.isArray(logsData?.logs) ? logsData.logs
    : [],
  [logsData]);

  /* Count by action type for meta */
  const counts = useMemo(() => {
    const map = {};
    logs.forEach(l => {
      const key = Object.keys(ACTION_CFG).find(k => (l.action_type || l.action)?.toUpperCase().includes(k)) || 'other';
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [logs]);

  /* Export CSV */
  const exportCSV = () => {
    const header = ['Time','User','Role','Action','Resource','IP','Details'];
    const rows   = logs.map(l => [
      l.timestamp || l.created_at || '',
      l.user_name || l.username || 'System',
      l.user_role || '',
      l.action_type || l.action || '',
      (l.resource_type || l.resource || '') + (l.resource_id ? ` #${l.resource_id}` : ''),
      l.ip_address || '',
      (l.details || l.description || '').replace(/,/g, ' '),
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const a   = document.createElement('a');
    a.href    = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <AdminPageShell
      icon={Shield}
      title="Audit Log"
      meta={[
        { label: 'entries', value: logs.length },
        ...(counts.DELETE > 0 ? [{ label: 'deletes', value: counts.DELETE, color: '#ef4444' }] : []),
        ...(counts.LOGIN  > 0 ? [{ label: 'logins',  value: counts.LOGIN,  color: '#f59e0b' }] : []),
      ]}
      actions={
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
      }
      toolbar={
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {[{ key: 'all', label: 'All' }, ...Object.entries(ACTION_CFG).map(([k, v]) => ({ key: k, label: v.label }))].map(({ key, label }) => {
            const active = actionFilter === key;
            const cfg    = ACTION_CFG[key];
            const color  = cfg?.color || 'var(--c-teal)';
            return (
              <button key={key} onClick={() => setActionFilter(key)}
                style={{
                  padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: active ? `1px solid ${color}` : '1px solid var(--card-border)',
                  background: active ? `${color}15` : 'var(--card-bg)',
                  color: active ? color : 'var(--text-500)',
                }}>
                {label}
                {key !== 'all' && counts[key] > 0 && (
                  <span style={{ marginLeft: 4, opacity: 0.6 }}>({counts[key]})</span>
                )}
              </button>
            );
          })}
        </div>
      }
      maxWidth="1300px"
    >
      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        searchColumnId="user"
        searchPlaceholder="Search by user, action, resource…"
        emptyTitle="No audit records found"
        emptyBody="No activity has been recorded yet."
        noResultsTitle="No matching entries"
        noResultsBody="Try adjusting your search or action filter."
        pageSize={50}
      />
    </AdminPageShell>
  );
}
