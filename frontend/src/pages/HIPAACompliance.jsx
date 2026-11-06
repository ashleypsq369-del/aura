/**
 * HIPAACompliance - Compliance score, checklist & breach incident log
 * Route: /admin/hipaa-compliance
 *
 * Built with: AdminPageShell + DataTable (TanStack) + Dialog (Radix) + Recharts
 * Reference: Vanta compliance UI + Linear issue tracker + Recharts radial
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle, AlertTriangle, XCircle, Activity,
  Plus, X, Loader2, RefreshCw, Download, Lock,
  FileText, ChevronDown, ChevronRight,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import axios from 'axios';
import apiClient from '../api/client';
import AdminPageShell from '../components/admin/AdminPageShell';
import DataTable from '../components/admin/DataTable';
import StatusDot from '../components/admin/StatusDot';
import Dialog from '../components/ui/Dialog';
import SearchableSelect from '../components/ui/SearchableSelect';
import toast from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../api/client';

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });
const col   = createColumnHelper();

/* ─── Config ──────────────────────────────────────────────────────── */
const IMPL = {
  implemented:     { Icon: CheckCircle, color: '#10b981', label: 'Implemented'     },
  partial:         { Icon: Activity,    color: '#f59e0b', label: 'Partial'          },
  not_implemented: { Icon: XCircle,     color: '#ef4444', label: 'Not implemented'  },
};
const SEV_COLOR = { critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#64748b' };

/* ─── Recharts radial score ring ───────────────────────────────────── */
function ScoreRing({ score }) {
  const clr  = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const data = [{ value: score, fill: clr }];
  return (
    <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%" cy="50%"
          innerRadius="60%" outerRadius="95%"
          data={data}
          startAngle={90}
          endAngle={-270}
          barSize={12}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            dataKey="value"
            background={{ fill: 'var(--card-border)' }}
            cornerRadius={6}
            clockWise
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: clr, lineHeight: 1 }}>
          {score.toFixed(0)}%
        </span>
        <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-400)', marginTop: 3 }}>
          {score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'At risk'}
        </span>
      </div>
    </div>
  );
}

/* ─── Incident accordion row ───────────────────────────────────────── */
function IncidentRow({ incident, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    resolution_notes:        incident.resolution_notes || '',
    reported_to_authorities: incident.reported_to_authorities || false,
    notification_sent:       incident.notification_sent || false,
  });

  const disc  = new Date(incident.discovered_at);
  const ddl   = new Date(disc.getTime() + 60 * 24 * 3600_000);
  const dLeft = Math.ceil((ddl - Date.now()) / 86_400_000);
  const over  = dLeft < 0;
  const clr   = SEV_COLOR[incident.severity] || '#64748b';

  return (
    <div style={{ borderBottom: '1px solid var(--card-border)' }}
      className="last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 20px', textAlign: 'left', background: 'transparent',
          border: 'none', cursor: 'pointer',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--page-bg)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ width: 4, height: 32, borderRadius: 2, flexShrink: 0, background: clr }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-800)' }}>
              {(incident.breach_type || '').replace(/_/g, ' ')}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
              background: `${clr}15`, color: clr, textTransform: 'uppercase' }}>
              {incident.severity}
            </span>
            {incident.is_resolved && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                background: '#dcfce7', color: '#16a34a' }}>Resolved</span>
            )}
            {!incident.is_resolved && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                background: over ? '#fee2e2' : dLeft < 7 ? '#fef3c7' : 'var(--page-bg)',
                color:      over ? '#dc2626' : dLeft < 7 ? '#d97706' : 'var(--text-500)' }}>
                {over ? `${Math.abs(dLeft)}d OVERDUE` : `${dLeft}d to HHS deadline`}
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-400)', marginTop: 2 }}>
            {incident.affected_count} records · Discovered {disc.toLocaleDateString('en-GB')}
          </p>
        </div>
        <ChevronDown size={14} style={{
          color: 'var(--text-400)', flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.18s',
        }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '8px 20px 16px 36px',
              borderLeft: `2px solid ${clr}`,
              marginLeft: 20,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {incident.description && (
                <p style={{ fontSize: 12, color: 'var(--text-600)', lineHeight: 1.6 }}>
                  {incident.description}
                </p>
              )}
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: 'var(--text-400)', marginBottom: 6 }}>
                  Resolution notes
                </label>
                <textarea
                  rows={3}
                  value={form.resolution_notes}
                  onChange={e => setForm(f => ({ ...f, resolution_notes: e.target.value }))}
                  style={{
                    width: '100%', borderRadius: 10, padding: '8px 12px', fontSize: 12,
                    resize: 'none', border: '1px solid var(--card-border)', outline: 'none',
                    background: 'var(--card-bg)', color: 'var(--text-800)', boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--c-teal)')}
                  onBlur={e  => (e.target.style.borderColor = 'var(--card-border)')}
                />
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                {[
                  ['reported_to_authorities', 'Reported to HHS / Authorities'],
                  ['notification_sent', 'Patient notifications sent'],
                ].map(([k, label]) => (
                  <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox" checked={form[k]}
                      onChange={e => setForm(f => ({ ...f, [k]: e.target.checked }))}
                      style={{ width: 14, height: 14, accentColor: 'var(--c-teal)' }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-700)' }}>{label}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={() => onUpdate({ id: incident.id, ...form,
                  resolved_at: !incident.is_resolved && form.resolution_notes
                    ? new Date().toISOString() : undefined })}
                style={{
                  alignSelf: 'flex-start', padding: '8px 16px', borderRadius: 10,
                  fontSize: 12, fontWeight: 700, color: '#fff', border: 'none',
                  cursor: 'pointer', background: 'var(--c-teal)',
                }}
              >
                Save update
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Log breach dialog ────────────────────────────────────────────── */
function LogBreachDialog({ open, onClose, onCreate, isPending }) {
  const [form, setForm] = useState({
    breach_type: 'unauthorized_access', description: '',
    affected_count: 0, severity: 'medium',
    discovered_at: new Date().toISOString().slice(0, 16),
  });

  return (
    <Dialog
      open={open} onOpenChange={o => !o && onClose()}
      title="Log New HIPAA Breach Incident"
      icon={AlertTriangle} accent="red" size="lg"
      footer={
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{
            padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            border: '1px solid var(--card-border)', background: 'transparent',
            color: 'var(--text-600)', cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button
            onClick={() => onCreate(form)}
            disabled={!form.description.trim() || isPending}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              color: '#fff', border: 'none', cursor: 'pointer',
              background: 'var(--c-danger)', opacity: (!form.description.trim() || isPending) ? 0.5 : 1,
            }}
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
            Log incident
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <SearchableSelect
            label="Incident type" accent="rose" allowClear={false}
            value={form.breach_type}
            onChange={v => setForm(f => ({ ...f, breach_type: v || 'unauthorized_access' }))}
            options={['unauthorized_access','data_theft','accidental_disclosure',
              'system_breach','lost_device','insider_threat','ransomware','other']
              .map(v => ({ value: v, label: v.replace(/_/g, ' ') }))}
          />
          <SearchableSelect
            label="Severity" accent="rose" allowClear={false}
            value={form.severity}
            onChange={v => setForm(f => ({ ...f, severity: v || 'medium' }))}
            options={['low','medium','high','critical'].map(v => ({
              value: v, label: v.charAt(0).toUpperCase() + v.slice(1),
            }))}
          />
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.04em',
              color: 'var(--text-500)', marginBottom: 6 }}>
              Affected records
            </label>
            <input type="number" min="0" value={form.affected_count}
              onChange={e => setForm(f => ({ ...f, affected_count: e.target.value }))}
              style={{
                width: '100%', height: 38, borderRadius: 10, padding: '0 12px',
                fontSize: 13, border: '1px solid var(--card-border)',
                background: 'transparent', color: 'var(--text-800)', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = '#ef4444')}
              onBlur={e  => (e.target.style.borderColor = 'var(--card-border)')}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.04em',
              color: 'var(--text-500)', marginBottom: 6 }}>
              Discovery date & time
            </label>
            <input type="datetime-local" value={form.discovered_at}
              onChange={e => setForm(f => ({ ...f, discovered_at: e.target.value }))}
              style={{
                width: '100%', height: 38, borderRadius: 10, padding: '0 12px',
                fontSize: 13, border: '1px solid var(--card-border)',
                background: 'transparent', color: 'var(--text-800)', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = '#ef4444')}
              onBlur={e  => (e.target.style.borderColor = 'var(--card-border)')}
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.04em',
            color: 'var(--text-500)', marginBottom: 6 }}>
            Description *
          </label>
          <textarea rows={4} value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What happened, how it was discovered, what data was affected, and immediate actions taken…"
            style={{
              width: '100%', borderRadius: 10, padding: '10px 12px', fontSize: 13,
              resize: 'none', border: '1px solid var(--card-border)',
              background: 'transparent', color: 'var(--text-800)', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => (e.target.style.borderColor = '#ef4444')}
            onBlur={e  => (e.target.style.borderColor = 'var(--card-border)')}
          />
        </div>
      </div>
    </Dialog>
  );
}

/* ─── Checklist columns ────────────────────────────────────────────── */
const checklistCols = [
  col.accessor('requirement', {
    header: 'Requirement',
    cell: info => (
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-800)' }}>{info.getValue()}</p>
        {info.row.original.notes && (
          <p style={{ fontSize: 11, color: 'var(--text-500)', marginTop: 2, lineHeight: 1.5 }}>
            {info.row.original.notes}
          </p>
        )}
      </div>
    ),
    meta: { tdStyle: { whiteSpace: 'normal', minWidth: 220 } },
  }),
  col.accessor('status', {
    header: 'Status',
    cell: info => {
      const cfg  = IMPL[info.getValue()] || IMPL.partial;
      const Icon = cfg.Icon;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon size={13} style={{ color: cfg.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
        </div>
      );
    },
    meta: { thStyle: { width: 150 } },
  }),
  col.accessor('category', {
    header: 'Category',
    cell: info => <span style={{ fontSize: 11, color: 'var(--text-400)' }}>{info.getValue()}</span>,
    meta: { thStyle: { width: 160 } },
  }),
];

/* ═══════════════════════════════════════════════════════════════════
   Main page
═══════════════════════════════════════════════════════════════════ */
export default function HIPAACompliance() {
  const [tab,           setTab]           = useState('overview');
  const [catFilter,     setCatFilter]     = useState('all');
  const [showBreachDlg, setShowBreachDlg] = useState(false);

  const { user }  = useAuth();
  const qc        = useQueryClient();
  const isAdmin   = ['admin', 'clinician'].includes(user?.role);
  const isPatient = ['patient', 'family'].includes(user?.role);

  const { data: compliance, isLoading, refetch } = useQuery({
    queryKey: ['hipaa-compliance'], enabled: isAdmin,
    queryFn:  () => apiClient.get('/api/hipaa/compliance/status').then(r => r.data),
  });
  const { data: breachStats } = useQuery({
    queryKey: ['breach-stats'], enabled: isAdmin,
    queryFn:  () => apiClient.get('/api/hipaa/breach-incidents/stats').then(r => r.data),
  });
  const { data: incidentsData } = useQuery({
    queryKey: ['breach-incidents'], enabled: isAdmin && tab === 'breaches',
    queryFn:  () => apiClient.get('/api/hipaa/breach-incidents').then(r => r.data),
  });

  const createBreachMut = useMutation({
    mutationFn: d => apiClient.post('/api/hipaa/breach-incidents', {
      ...d,
      affected_count: parseInt(d.affected_count) || 0,
      discovered_at:  new Date(d.discovered_at).toISOString(),
    }),
    onSuccess: () => {
      qc.invalidateQueries(['breach-stats', 'breach-incidents']);
      setShowBreachDlg(false);
      toast.success('Incident logged');
    },
    onError: e => toast.error(e.response?.data?.detail || 'Failed'),
  });

  const updateBreachMut = useMutation({
    mutationFn: ({ id, ...d }) => apiClient.put(`/api/hipaa/breach-incidents/${id}`, d),
    onSuccess: () => { qc.invalidateQueries(['breach-incidents']); toast.success('Updated'); },
    onError: e => toast.error(e.response?.data?.detail || 'Failed'),
  });

  const exportData = async () => {
    try {
      const r = await axios.get(`${API_URL}/api/hipaa/portal/my-data/export`,
        { headers: authH(), responseType: 'blob' });
      const a = document.createElement('a');
      a.href  = URL.createObjectURL(r.data);
      a.download = `my_health_data_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      toast.success('Download started');
    } catch { toast.error('Export failed'); }
  };

  const score      = compliance?.compliance_score || 0;
  const categories = ['all', ...new Set((compliance?.items || []).map(i => i.category))];
  const filtered   = catFilter === 'all'
    ? (compliance?.items || [])
    : (compliance?.items || []).filter(i => i.category === catFilter);
  const incidents  = incidentsData?.incidents || [];

  /* Recharts breakdown bar data */
  const breakdownData = [
    { name: 'Implemented',    value: compliance?.implemented     || 0, fill: '#10b981' },
    { name: 'Partial',        value: compliance?.partial         || 0, fill: '#f59e0b' },
    { name: 'Not impl.',      value: compliance?.not_implemented || 0, fill: '#ef4444' },
  ];

  const TABS = [
    { id: 'overview',  label: 'Overview',  Icon: Shield        },
    { id: 'checklist', label: 'Checklist', Icon: CheckCircle   },
    { id: 'breaches',  label: 'Breaches',  Icon: AlertTriangle, badge: breachStats?.unresolved || 0 },
    ...(isPatient ? [{ id: 'export', label: 'My Data', Icon: Download }] : []),
  ];

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Loader2 size={22} className="animate-spin" style={{ color: 'var(--c-teal)' }} />
    </div>
  );

  return (
    <>
      <AdminPageShell
        icon={Shield}
        title="HIPAA Compliance"
        meta={isAdmin ? [
          { label: 'score', value: `${score.toFixed(0)}%`,
            color: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444' },
          ...(breachStats?.unresolved > 0
            ? [{ label: 'unresolved incidents', value: breachStats.unresolved, color: '#ef4444' }]
            : []),
        ] : []}
        toolbar={tab === 'checklist' ? (
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                style={{
                  padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:600,
                  cursor:'pointer', textTransform:'capitalize', transition:'all 0.15s',
                  border: catFilter===cat ? '1px solid var(--c-teal)' : '1px solid var(--card-border)',
                  background: catFilter===cat ? 'color-mix(in srgb,var(--c-teal) 12%,var(--card-bg))' : 'var(--card-bg)',
                  color: catFilter===cat ? 'var(--c-teal)' : 'var(--text-500)',
                }}>
                {cat==='all' ? 'All categories' : cat}
              </button>
            ))}
          </div>
        ) : undefined}
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
        actions={isAdmin && (
          <button
            onClick={() => refetch()}
            style={{
              width: 36, height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--card-border)',
              background: 'var(--card-bg)', cursor: 'pointer',
              color: 'var(--text-500)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-teal)'; e.currentTarget.style.color = 'var(--c-teal)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.color = 'var(--text-500)'; }}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        )}
      >

        {/* ══ OVERVIEW ════════════════════════════════════════════ */}
        {tab === 'overview' && isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Top row: Score + Metrics + Breach summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>

              {/* Score card - Services ProviderCard photo-area style */}
              <div style={{
                borderRadius: 16,
                border: '1px solid var(--card-border)',
                background: 'var(--card-bg)',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(13,148,136,0.10)',
              }}>
                {/* Gradient header strip - like Services card photo area */}
                <div style={{
                  padding: '20px 20px 16px',
                  background: 'linear-gradient(135deg,#0d948808,#0891b208)',
                  borderBottom: '1px solid var(--card-border)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                }}>
                  <ScoreRing score={score} />
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-600)', margin: 0 }}>
                    Overall compliance
                  </p>
                  {compliance?.next_review_date && (
                    <p style={{ fontSize: 10, color: 'var(--text-400)', margin: 0 }}>
                      Next review: {new Date(compliance.next_review_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Implemented',    color: '#10b981', val: compliance?.implemented     },
                    { label: 'Partial',        color: '#f59e0b', val: compliance?.partial         },
                    { label: 'Not implemented',color: '#ef4444', val: compliance?.not_implemented },
                  ].map(({ label, color, val }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <StatusDot color={color} label={label} size="sm" />
                      <span style={{ fontSize: 13, fontWeight: 800, color }}>{val ?? '-'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* System metrics */}
              <div style={{
                borderRadius: 16, border: '1px solid var(--card-border)',
                background: 'var(--card-bg)', padding: 20,
                display: 'flex', flexDirection: 'column', gap: 10,
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.06em', color: 'var(--text-400)', margin: 0 }}>
                  System metrics
                </p>
                {[
                  ['Total users',       compliance?.live_metrics?.total_users],
                  ['Active users',      compliance?.live_metrics?.active_users],
                  ['Audit log entries', compliance?.live_metrics?.audit_log_entries],
                  ['IP coverage',       `${compliance?.live_metrics?.audit_ip_coverage_pct || 0}%`],
                  ['Open incidents',    compliance?.live_metrics?.open_breach_incidents],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-600)' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-800)' }}>{val ?? '-'}</span>
                  </div>
                ))}
              </div>

              {/* Breach summary - red-accent left border like Services availability */}
              <div style={{
                borderRadius: 16,
                border: '1px solid var(--card-border)',
                borderLeft: `3px solid ${(breachStats?.unresolved ?? 0) > 0 ? '#ef4444' : '#10b981'}`,
                background: 'var(--card-bg)', padding: 20,
                display: 'flex', flexDirection: 'column', gap: 10,
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.06em', color: 'var(--text-400)', margin: 0 }}>
                    Breach incidents
                  </p>
                  <button
                    onClick={() => setTab('breaches')}
                    style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-teal)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 2 }}
                  >
                    View all <ChevronRight size={10} />
                  </button>
                </div>
                {breachStats
                  ? [
                      ['Total',        breachStats.total_incidents,          'var(--text-800)'],
                      ['Resolved',     breachStats.resolved,                 '#10b981'        ],
                      ['Unresolved',   breachStats.unresolved,               '#ef4444'        ],
                      ['Last 30 days', breachStats.recent_30_days,           '#f59e0b'        ],
                      ['Critical',     breachStats.by_severity?.critical||0, '#dc2626'        ],
                    ].map(([label, val, color]) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-600)' }}>{label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color }}>{val}</span>
                      </div>
                    ))
                  : <p style={{ fontSize: 12, color: 'var(--text-400)' }}>No data</p>}
              </div>
            </div>

            {/* Recharts: compliance status breakdown bar */}
            {(compliance?.implemented || compliance?.partial || compliance?.not_implemented) && (
              <div style={{
                borderRadius: 16, border: '1px solid var(--card-border)',
                background: 'var(--card-bg)', padding: '16px 20px 8px',
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-400)', marginBottom: 12 }}>
                  Requirement breakdown by status
                </p>
                <ResponsiveContainer width="100%" height={60}>
                  <BarChart data={breakdownData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barSize={18}>
                    <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--text-400)' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-600)' }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip
                      contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, fontSize: 11, color: 'var(--text-800)' }}
                      cursor={{ fill: 'color-mix(in srgb, var(--c-teal) 5%, transparent)' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {breakdownData.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={0.85} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* ══ CHECKLIST ═══════════════════════════════════════════ */}
        {tab === 'checklist' && isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Category filter */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setCatFilter(cat)}
                  style={{
                    padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                    textTransform: 'capitalize',
                    background:  catFilter === cat ? 'var(--c-teal)' : 'var(--card-bg)',
                    borderColor: catFilter === cat ? 'var(--c-teal)' : 'var(--card-border)',
                    color:       catFilter === cat ? '#fff' : 'var(--text-600)',
                  }}>
                  {cat === 'all' ? 'All categories' : cat}
                </button>
              ))}
            </div>
            <DataTable
              columns={checklistCols}
              data={filtered}
              emptyTitle="No items"
              searchColumnId="requirement"
              searchPlaceholder="Search requirements…"
            />
          </div>
        )}

        {/* ══ BREACHES ════════════════════════════════════════════ */}
        {tab === 'breaches' && isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-700)' }}>Breach incident log</p>
              <button
                onClick={() => setShowBreachDlg(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  color: '#fff', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                  boxShadow: '0 2px 10px rgba(239,68,68,0.28)',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <Plus size={12} /> Log incident
              </button>
            </div>

            {incidents.length === 0 ? (
              <div style={{
                borderRadius: 16, border: '1px solid var(--card-border)',
                background: 'var(--card-bg)', padding: 48, textAlign: 'center',
              }}>
                <Shield size={28} style={{ color: 'var(--card-border)', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-500)' }}>No breach incidents recorded</p>
                <p style={{ fontSize: 11, color: 'var(--text-400)', marginTop: 4 }}>
                  Use "Log incident" to report a HIPAA breach event.
                </p>
              </div>
            ) : (
              <div style={{
                borderRadius: 16, border: '1px solid var(--card-border)',
                background: 'var(--card-bg)', overflow: 'hidden',
              }}>
                {incidents.map(inc => (
                  <IncidentRow key={inc.id} incident={inc} onUpdate={d => updateBreachMut.mutate(d)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ DATA EXPORT ═════════════════════════════════════════ */}
        {tab === 'export' && isPatient && (
          <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              borderRadius: 16, border: '1px solid var(--card-border)',
              background: 'var(--card-bg)', padding: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#f0fdfa',
                }}>
                  <Lock size={20} style={{ color: 'var(--c-teal)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-900)', margin: 0 }}>
                    HIPAA Right of Access
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-600)', marginTop: 6, lineHeight: 1.6 }}>
                    Under HIPAA (45 CFR §164.524) you have the right to receive a copy of all your health
                    information held by this system, including vitals, medications, assessments, AI
                    predictions, and clinical notes.
                  </p>
                  <button
                    onClick={exportData}
                    style={{
                      marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                      color: '#fff', border: 'none', cursor: 'pointer', background: 'var(--c-teal)',
                    }}
                  >
                    <Download size={14} /> Download my health record
                  </button>
                </div>
              </div>
            </div>
            <div style={{
              borderRadius: 10, padding: 14, fontSize: 12,
              background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e',
            }}>
              <strong>Note:</strong> The export is a JSON file containing all your health data.
              Store it securely and do not share it with unauthorised parties.
            </div>
          </div>
        )}

        {tab === 'export' && !isPatient && (
          <div style={{
            borderRadius: 16, border: '1px solid var(--card-border)',
            background: 'var(--card-bg)', padding: 48, textAlign: 'center',
          }}>
            <Shield size={28} style={{ color: 'var(--card-border)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-500)' }}>Patient data export</p>
            <p style={{ fontSize: 11, color: 'var(--text-400)', marginTop: 4 }}>
              This tab allows patients to download their complete health record.
            </p>
          </div>
        )}
      </AdminPageShell>

      {/* Log breach dialog */}
      <LogBreachDialog
        open={showBreachDlg}
        onClose={() => setShowBreachDlg(false)}
        onCreate={d => createBreachMut.mutate(d)}
        isPending={createBreachMut.isPending}
      />
    </>
  );
}
