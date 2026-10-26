import { useState, useMemo, useEffect } from 'react';
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

// ── Severity config ──────────────────────────────────────────────────────────
const SEV = {
  critical: { borderL: 'border-l-red-500',   badge: 'badge-critical', Icon: XCircle,       dot: 'bg-red-500',   label: 'Critical',  pulse: true  },
  high:     { borderL: 'border-l-amber-500', badge: 'badge-high',     Icon: AlertTriangle, dot: 'bg-amber-500', label: 'High',      pulse: false },
  medium:   { borderL: 'border-l-teal-500',  badge: 'badge-stable',   Icon: Bell,          dot: 'bg-teal-500',  label: 'Medium',    pulse: false },
  low:      { borderL: 'border-l-slate-400', badge: 'badge-low',      Icon: Bell,          dot: 'bg-slate-400', label: 'Low',       pulse: false },
};

// Dark-mode-safe severity styles — applied via inline style or data-sev
function getSevStyle(severity, dark) {
  const map = {
    critical: { light: { bg: '#fff5f5', text: '#c53030', icon: '#e53e3e' }, dark: { bg: 'rgba(220,38,38,0.10)', text: '#fc8181', icon: '#fc8181' } },
    high:     { light: { bg: '#fffbeb', text: '#b45309', icon: '#d97706' }, dark: { bg: 'rgba(217,119,6,0.10)',  text: '#fcd34d', icon: '#fcd34d' } },
    medium:   { light: { bg: '#f0fdf9', text: '#0f766e', icon: '#0d9488' }, dark: { bg: 'rgba(13,148,136,0.10)', text: '#5eead4', icon: '#2dd4bf' } },
    low:      { light: { bg: '#f8fafc', text: '#475569', icon: '#64748b' }, dark: { bg: 'rgba(100,116,139,0.08)', text: '#94a3b8', icon: '#94a3b8' } },
  };
  const cfg = map[severity] || map.low;
  return dark ? cfg.dark : cfg.light;
}

const TYPE_ICONS = {
  vital_abnormal: Activity, deterioration: TrendingDown, deterioration_trend: TrendingDown,
  drug_interaction: Pill, ml_risk: Zap, ml_high_risk: Zap,
};

const TYPE_LABELS = {
  vital_abnormal:'Abnormal Vitals', pain_spike:'Pain Spike', missed_medication:'Missed Medication',
  appointment_due:'Appointment Due', deterioration:'Deteriorating', deterioration_trend:'ML Deterioration',
  drug_interaction:'Drug Interaction', ml_risk:'ML High Risk', ml_high_risk:'ML High Risk', system:'System',
};

const label  = t => TYPE_LABELS[t] || t?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) || 'Alert';
const sevOrd = { critical:0, high:1, medium:2, low:3 };

function timeAgo(iso) {
  if (!iso) return '';
  const m = Math.round((Date.now()-new Date(iso))/60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m/60)}h ago`;
  return new Date(iso).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
}

// ── Alert card ───────────────────────────────────────────────────────────────
function AlertCard({ alert, mlRisk, onAck, ackPending, onExplain, explainLoading, onNavigate, isDark }) {
  const cfg = SEV[alert.severity] || SEV.low;
  const { Icon: SevIcon } = cfg;
  const TypeIcon = TYPE_ICONS[alert.alert_type] || SevIcon;
  const ss = getSevStyle(alert.severity, isDark);

  const borderColors = { critical:'#ef4444', high:'#f59e0b', medium:'#0d9488', low:'#94a3b8' };
  const borderColor = borderColors[alert.severity] || borderColors.low;

  return (
    <motion.div
      layout
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, y:-8 }}
      className="rounded-xl border overflow-hidden transition-shadow hover:shadow-md"
      style={{
        background: ss.bg,
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      <div className="p-3 flex items-start gap-2.5">
        {/* Type icon */}
        <div className={`mt-0.5 flex-shrink-0 ${cfg.pulse ? 'animate-pulse' : ''}`}>
          <TypeIcon size={16} style={{ color: ss.icon }}/>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs" style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>
                {label(alert.alert_type)}
              </span>
              <span className={cfg.badge}>{cfg.label}</span>
              {mlRisk && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                  style={{ background: isDark ? 'rgba(124,58,237,0.2)' : '#ede9fe', color: isDark ? '#c4b5fd' : '#6d28d9' }}>
                  <Zap size={8}/> ML {(mlRisk.overall_risk*100).toFixed(0)}%
                </span>
              )}
            </div>
            <span className="text-[10px] flex items-center gap-1 flex-shrink-0"
              style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
              <Clock size={10}/>{timeAgo(alert.created_at)}
            </span>
          </div>

          <p className="text-xs leading-snug mt-1 mb-2"
            style={{ color: isDark ? '#94a3b8' : '#475569' }}>
            {alert.message}
          </p>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            {alert.patient_name && (
              <span className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                style={{ color: isDark ? '#94a3b8' : '#475569', background: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}` }}>
                {alert.patient_name}
              </span>
            )}
            <div className="flex gap-1.5 ml-auto items-center">
              <ReminderBell
                label={`${label(alert.alert_type)}${alert.patient_name ? ` — ${alert.patient_name}` : ''}`}
                type="custom"
                size="xs"
              />
              {alert.patient_id && (
                <button onClick={() => onNavigate(alert.patient_id)}
                  className="flex items-center gap-1 px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold transition">
                  <ExternalLink size={10}/> Patient
                </button>
              )}
              <button onClick={() => onExplain(alert)} disabled={explainLoading}
                className="flex items-center gap-1 px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10px] font-bold transition disabled:opacity-50">
                <Brain size={10}/> AI Explain
              </button>
              <button onClick={() => onAck(alert.id)} disabled={ackPending}
                className="flex items-center gap-1 px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition disabled:opacity-50">
                <CheckCircle size={10}/> {ackPending ? '...' : 'Resolve'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Compact stat strip ────────────────────────────────────────────────────────
function StatStrip({ stats, isDark }) {
  return (
    <div className="flex flex-wrap gap-2">
      {stats.map(({ label, value, icon: Icon, accent, active, onClick }) => (
        <button key={label} onClick={onClick}
          className="flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all duration-150"
          style={{
            background: active
              ? (isDark ? accent.darkActiveBg : accent.activeBg)
              : (isDark ? 'rgba(255,255,255,0.04)' : '#ffffff'),
            borderColor: active
              ? (isDark ? accent.darkActiveBorder : accent.activeBorder)
              : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'),
            boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          }}>
          <Icon size={14} style={{ color: active ? (isDark ? accent.darkIcon : accent.iconColor) : (isDark ? '#64748b' : '#94a3b8') }}/>
          <span className="text-xl font-black tabular-nums leading-none"
            style={{ color: active ? (isDark ? accent.darkText : accent.text) : (isDark ? '#f1f5f9' : '#1e293b') }}>
            {value}
          </span>
          <span className="text-xs font-semibold"
            style={{ color: active ? (isDark ? accent.darkText : accent.text) : (isDark ? '#64748b' : '#64748b') }}>
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
  const { subscribe } = useWS();
  const { theme } = useAppSettings();
  const isDark = theme === 'dark';

  // Real-time: invalidate alerts on WS push
  useEffect(() => {
    const u1 = subscribe('new_alert',    () => queryClient.invalidateQueries({ queryKey: ['alerts'] }));
    const u2 = subscribe('alert_update', () => queryClient.invalidateQueries({ queryKey: ['alerts'] }));
    return () => { u1(); u2(); };
  }, [subscribe, queryClient]);

  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus,   setFilterStatus]   = useState('active');
  const [searchTerm,     setSearchTerm]      = useState('');
  const [ackedExpanded,  setAckedExpanded]   = useState(false);
  const [pendingAck,     setPendingAck]      = useState(null);
  const [showFocused,    setShowFocused]     = useState(false);
  const [focusedData,    setFocusedData]     = useState(null);
  const [explainLoading, setExplainLoading]  = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data: rawAlerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const res = await apiClient.get('/api/alerts');
      return (res.data || []).map(a => ({
        ...a,
        acknowledged: a.acknowledged ?? a.is_acknowledged ?? false,
      }));
    },
    refetchInterval: 30000,
  });

  const { data: mlBatch } = useQuery({
    queryKey: ['ml-batch-risk'],
    queryFn: () => mlAPI.getAllPatientsRisk().then(r => r.data),
    staleTime: 5*60*1000, retry: false,
  });

  const getML = pid =>
    mlBatch?.ml_available && pid
      ? mlBatch.patients?.find(p => p.patient_id === pid) || null
      : null;

  // ── Mutations ──────────────────────────────────────────────────────────────
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
        patient_id: alert.patient_id, focus_type: 'alert',
        focus_data: { alert_id: alert.id },
      });
      setFocusedData(res.data);
      setShowFocused(true);
    } catch { toast.error('AI explanation failed'); }
    finally { setExplainLoading(false); }
  };

  // ── KPI counts (always from all raw alerts, not filtered) ─────────────────
  const kpi = useMemo(() => ({
    critical: rawAlerts?.filter(a => a.severity === 'critical' && !a.is_acknowledged).length || 0,
    high:     rawAlerts?.filter(a => a.severity === 'high'     && !a.is_acknowledged).length || 0,
    active:   rawAlerts?.filter(a => !a.is_acknowledged).length || 0,
    resolved: rawAlerts?.filter(a =>
      a.is_acknowledged && a.acknowledged_at &&
      new Date(a.acknowledged_at).toDateString() === new Date().toDateString()
    ).length || 0,
  }), [rawAlerts]);

  // ── Filtered + sorted ─────────────────────────────────────────────────────
  const { activeAlerts, ackedAlerts } = useMemo(() => {
    if (!rawAlerts) return { activeAlerts:[], ackedAlerts:[] };
    const q = searchTerm.toLowerCase();
    const base = rawAlerts.filter(a => {
      const mSearch = !q || a.alert_type?.toLowerCase().includes(q) ||
        a.message?.toLowerCase().includes(q) || a.patient_name?.toLowerCase().includes(q);
      const mSev = filterSeverity === 'all' || a.severity === filterSeverity;
      return mSearch && mSev;
    });
    const sort = arr => [...arr].sort(
      (a,b) => (sevOrd[a.severity]??4)-(sevOrd[b.severity]??4) ||
                new Date(b.created_at)-new Date(a.created_at)
    );
    return {
      activeAlerts: sort(base.filter(a => !a.is_acknowledged)),
      ackedAlerts:  [...base.filter(a => a.is_acknowledged)]
                      .sort((a,b) => new Date(b.acknowledged_at||b.created_at)-new Date(a.acknowledged_at||a.created_at)),
    };
  }, [rawAlerts, searchTerm, filterSeverity]);

  const showActive = filterStatus === 'active' || filterStatus === 'all';
  const showAcked  = filterStatus === 'acknowledged' || filterStatus === 'all';

  return (
    <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.2 }}
      className="min-h-screen space-y-5 pb-8">

      {/* ── Page Header ── */}
      <PageHeader
        image="/resources/african/african-nurse-female.jpg"
        title="Clinical Alerts"
        subtitle="Active patient safety alerts — click a card to filter by severity"
        icon={ShieldAlert}
      />

      {/* Compact stat strip */}
      <div className="px-4 sm:px-6">
        <StatStrip isDark={isDark} stats={[
          { label:'Critical',      value:kpi.critical, icon:XCircle,       active:filterSeverity==='critical'&&filterStatus==='active', onClick:()=>{setFilterSeverity('critical');setFilterStatus('active');},
            accent:{ activeBg:'#fff5f5', activeBorder:'#fca5a5', iconColor:'#ef4444', text:'#dc2626', darkActiveBg:'rgba(220,38,38,0.15)', darkActiveBorder:'rgba(220,38,38,0.4)', darkIcon:'#f87171', darkText:'#f87171' }},
          { label:'High Priority', value:kpi.high,     icon:AlertTriangle, active:filterSeverity==='high'&&filterStatus==='active',     onClick:()=>{setFilterSeverity('high');setFilterStatus('active');},
            accent:{ activeBg:'#fffbeb', activeBorder:'#fcd34d', iconColor:'#f59e0b', text:'#d97706', darkActiveBg:'rgba(217,119,6,0.15)',  darkActiveBorder:'rgba(217,119,6,0.4)',  darkIcon:'#fbbf24', darkText:'#fbbf24' }},
          { label:'Active',        value:kpi.active,   icon:Bell,           active:filterSeverity==='all'&&filterStatus==='active',      onClick:()=>{setFilterSeverity('all');setFilterStatus('active');},
            accent:{ activeBg:'#f0fdf9', activeBorder:'#5eead4', iconColor:'#0d9488', text:'#0f766e', darkActiveBg:'rgba(13,148,136,0.15)', darkActiveBorder:'rgba(13,148,136,0.4)', darkIcon:'#2dd4bf', darkText:'#2dd4bf' }},
          { label:'Resolved',      value:kpi.resolved, icon:CheckCircle,   active:filterStatus==='acknowledged',                        onClick:()=>{setFilterSeverity('all');setFilterStatus('acknowledged');},
            accent:{ activeBg:'#f0fdf4', activeBorder:'#86efac', iconColor:'#16a34a', text:'#15803d', darkActiveBg:'rgba(22,163,74,0.15)',  darkActiveBorder:'rgba(22,163,74,0.4)',  darkIcon:'#4ade80', darkText:'#4ade80' }},
        ]}/>
      </div>

      {/* ── Filter bar ── */}
      <div className="px-4 sm:px-6">
        <div className="rounded-xl border p-4 space-y-3"
          style={{ background: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
          <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Search */}
            <div className="flex-1 relative w-full">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: isDark ? '#475569' : '#94a3b8' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search alerts, patients, types..."
                className="w-full pl-9 pr-4 py-2 rounded-xl outline-none text-xs transition-all"
                style={{
                  background: isDark ? '#0f172a' : '#f8fafc',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                  color: isDark ? '#f1f5f9' : '#1e293b',
                  caretColor: '#0d9488',
                }}
              />
            </div>

            {/* Severity pills */}
            <div className="flex items-center gap-1 rounded-xl p-1 flex-wrap flex-shrink-0"
              style={{ background: isDark ? '#0f172a' : '#f1f5f9' }}>
              <span className="text-[10px] font-bold uppercase px-1.5"
                style={{ color: isDark ? '#475569' : '#94a3b8' }}>Severity</span>
              {['all','critical','high','medium','low'].map(s => {
                const active = filterSeverity === s;
                const activeBg = { critical:'#dc2626', high:'#f59e0b', medium:'#0d9488', low:'#64748b', all: isDark ? '#334155' : '#334155' }[s];
                return (
                  <button key={s} onClick={() => setFilterSeverity(s)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all"
                    style={{
                      background: active ? activeBg : 'transparent',
                      color: active ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                    }}>
                    {s === 'all' ? 'All' : s}
                  </button>
                );
              })}
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-1 rounded-xl p-1 flex-shrink-0"
              style={{ background: isDark ? '#0f172a' : '#f1f5f9' }}>
              {[
                { v:'active',       l:'Active Only' },
                { v:'all',          l:'All'         },
                { v:'acknowledged', l:'Resolved'    },
              ].map(({ v, l }) => (
                <button key={v} onClick={() => setFilterStatus(v)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: filterStatus === v ? '#0d9488' : 'transparent',
                    color: filterStatus === v ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                  }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Active filter chips */}
          {(filterSeverity !== 'all' || searchTerm || filterStatus !== 'active') && (
            <div className="flex items-center gap-2 flex-wrap pt-1"
              style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}` }}>
              <span className="text-[11px] font-semibold flex items-center gap-1"
                style={{ color: isDark ? '#475569' : '#94a3b8' }}>
                <ListFilter size={11}/> Filters:
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
                  <button onClick={() => setSearchTerm('')} className="hover:text-red-600 font-black">×</button>
                </span>
              )}
              <button onClick={() => { setFilterSeverity('all'); setFilterStatus('active'); setSearchTerm(''); }}
                className="text-xs text-slate-400 hover:text-red-500 font-semibold ml-auto">
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 sm:px-6 space-y-5">
        {isLoading ? (
          <ListSkeleton items={5} />
        ) : (
          <>
            {/* Active alerts section */}
            {showActive && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold flex items-center gap-2"
                    style={{ color: isDark ? '#e2e8f0' : '#374151' }}>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Active Alerts
                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: isDark ? 'rgba(220,38,38,0.2)' : '#fee2e2', color: isDark ? '#f87171' : '#dc2626' }}>
                      {activeAlerts.length}
                    </span>
                  </h2>
                  {activeAlerts.length > 0 && (
                    <span className="text-xs" style={{ color: isDark ? '#475569' : '#94a3b8' }}>
                      Sorted: critical first
                    </span>
                  )}
                </div>

                {activeAlerts.length === 0 ? (
                  <div className="rounded-xl p-10 text-center border"
                    style={{ background: isDark ? 'rgba(5,150,105,0.08)' : '#f0fdf4', borderColor: isDark ? 'rgba(5,150,105,0.2)' : '#bbf7d0' }}>
                    <CheckCircle className="w-14 h-14 mx-auto mb-3 opacity-80" style={{ color: isDark ? '#34d399' : '#16a34a' }} />
                    <p className="font-bold text-base mb-1" style={{ color: isDark ? '#34d399' : '#15803d' }}>All clear</p>
                    <p className="text-sm" style={{ color: isDark ? '#6ee7b7' : '#16a34a' }}>No active alerts match your current filters.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    <div className="space-y-2.5">
                      {activeAlerts.map(a => (
                        <AlertCard key={a.id} alert={a} mlRisk={getML(a.patient_id)}
                          isDark={isDark}
                          onAck={id => ackMutation.mutate(id)}
                          ackPending={pendingAck === a.id}
                          onExplain={explainAlert}
                          explainLoading={explainLoading}
                          onNavigate={pid => navigate(`/patients/${pid}`)}
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </div>
            )}

            {/* Resolved alerts — collapsed accordion */}
            {showAcked && ackedAlerts.length > 0 && (
              <div>
                <button
                  onClick={() => setAckedExpanded(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl border font-bold text-sm transition-all"
                  style={{
                    background: ackedExpanded ? (isDark ? 'rgba(5,150,105,0.1)' : '#f0fdf4') : (isDark ? '#1e293b' : '#ffffff'),
                    borderColor: ackedExpanded ? (isDark ? 'rgba(52,211,153,0.3)' : '#86efac') : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'),
                    color: ackedExpanded ? (isDark ? '#34d399' : '#15803d') : (isDark ? '#94a3b8' : '#475569'),
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle size={16} style={{ color: ackedExpanded ? (isDark ? '#34d399' : '#16a34a') : (isDark ? '#6ee7b7' : '#4ade80') }} />
                    Resolved Alerts
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: ackedExpanded ? (isDark ? 'rgba(52,211,153,0.2)' : '#bbf7d0') : (isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'), color: ackedExpanded ? (isDark ? '#34d399' : '#15803d') : (isDark ? '#64748b' : '#64748b') }}>
                      {ackedAlerts.length}
                    </span>
                  </div>
                  {ackedExpanded
                    ? <ChevronUp size={16} style={{ color: isDark ? '#34d399' : '#16a34a' }} />
                    : <ChevronDown size={16} style={{ color: isDark ? '#64748b' : '#94a3b8' }} />}
                </button>

                <AnimatePresence>
                  {ackedExpanded && (
                    <motion.div
                      initial={{ height:0, opacity:0 }}
                      animate={{ height:'auto', opacity:1 }}
                      exit={{ height:0, opacity:0 }}
                      className="overflow-hidden mt-2"
                    >
                      <div className="space-y-1.5">
                        {ackedAlerts.slice(0,25).map(a => {
                          const cfg = SEV[a.severity] || SEV.low;
                          return (
                            <div key={a.id}
                              className="flex items-center gap-2.5 rounded-xl px-3 py-2 opacity-60 hover:opacity-100 transition-opacity"
                              style={{ background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}` }}>
                              <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-[11px]"
                                    style={{ color: isDark ? '#e2e8f0' : '#374151' }}>{label(a.alert_type)}</span>
                                  <span className={cfg.badge}>{cfg.label}</span>
                                  {a.patient_name && (
                                    <span className="text-[10px]" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{a.patient_name}</span>
                                  )}
                                </div>
                                <p className="text-[10px] truncate" style={{ color: isDark ? '#475569' : '#94a3b8' }}>{a.message}</p>
                              </div>
                              <span className="text-[10px] flex-shrink-0" style={{ color: isDark ? '#475569' : '#94a3b8' }}>
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

      {/* ── AI explanation modal ── */}
      {showFocused && focusedData && (
        <FocusedAIExplanation data={focusedData} onClose={() => setShowFocused(false)} />
      )}
    </motion.div>
  );
}
