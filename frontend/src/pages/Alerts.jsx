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
import ReminderBell from '../components/ReminderBell';

// ── Severity config ──────────────────────────────────────────────────────────
const SEV = {
  critical: { borderL: 'border-l-red-500',   bg: 'bg-red-50',    badge: 'badge-critical', Icon: XCircle,      dot: 'bg-red-500',    text: 'text-red-600',   label: 'Critical',  pulse: true  },
  high:     { borderL: 'border-l-amber-500', bg: 'bg-amber-50',  badge: 'badge-high',     Icon: AlertTriangle,dot: 'bg-amber-500',  text: 'text-amber-600', label: 'High',      pulse: false },
  medium:   { borderL: 'border-l-teal-500',  bg: 'bg-teal-50',   badge: 'badge-stable',   Icon: Bell,         dot: 'bg-teal-500',   text: 'text-teal-600',  label: 'Medium',    pulse: false },
  low:      { borderL: 'border-l-slate-400', bg: 'bg-slate-50',  badge: 'badge-low',      Icon: Bell,         dot: 'bg-slate-400',  text: 'text-slate-500', label: 'Low',       pulse: false },
};

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
function AlertCard({ alert, mlRisk, onAck, ackPending, onExplain, explainLoading, onNavigate }) {
  const cfg = SEV[alert.severity] || SEV.low;
  const { Icon: SevIcon } = cfg;
  const TypeIcon = TYPE_ICONS[alert.alert_type] || SevIcon;

  return (
    <motion.div
      layout
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, y:-8 }}
      className={`group border-l-4 ${cfg.borderL} ${cfg.bg} rounded-r-xl border border-slate-200 p-3 transition-shadow hover:shadow-md`}
    >
      <div className="flex items-start gap-2.5">
        {/* Type icon */}
        <div className={`mt-0.5 flex-shrink-0 ${cfg.pulse ? 'animate-pulse' : ''}`}>
          <TypeIcon className={`w-4 h-4 ${cfg.text}`} />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-900 text-xs">{label(alert.alert_type)}</span>
              <span className={cfg.badge}>{cfg.label}</span>
              {mlRisk && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 flex items-center gap-0.5">
                  <Zap size={8}/> ML {(mlRisk.overall_risk*100).toFixed(0)}%
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 flex-shrink-0">
              <Clock size={10}/>{timeAgo(alert.created_at)}
            </span>
          </div>

          <p className="text-slate-600 text-xs leading-snug mt-1 mb-2">{alert.message}</p>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            {alert.patient_name && (
              <span className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-full px-2 py-0.5">
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

// ── KPI card ──────────────────────────────────────────────────────────────────
// ── Compact stat strip ────────────────────────────────────────────────────────
function StatStrip({ stats }) {
  return (
    <div className="flex flex-wrap gap-2">
      {stats.map(({ label, value, icon: Icon, accent, active, onClick }) => (
        <button key={label} onClick={onClick}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all duration-150
            ${active
              ? `${accent.activeBg} ${accent.activeBorder} shadow-sm`
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}>
          <Icon size={14} className={active ? accent.icon : 'text-slate-400'}/>
          <span className={`text-xl font-black tabular-nums leading-none ${active ? accent.text : 'text-slate-800'}`}>{value}</span>
          <span className={`text-xs font-semibold ${active ? accent.text : 'text-slate-500'}`}>{label}</span>
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
      <div className="px-6">
        <StatStrip stats={[
          { label:'Critical',      value:kpi.critical, icon:XCircle,      active:filterSeverity==='critical'&&filterStatus==='active',     onClick:()=>{setFilterSeverity('critical');setFilterStatus('active');},
            accent:{activeBg:'bg-red-50',     activeBorder:'border-red-400',     icon:'text-red-500',     text:'text-red-600'    }},
          { label:'High Priority', value:kpi.high,     icon:AlertTriangle, active:filterSeverity==='high'&&filterStatus==='active',        onClick:()=>{setFilterSeverity('high');setFilterStatus('active');},
            accent:{activeBg:'bg-amber-50',   activeBorder:'border-amber-400',   icon:'text-amber-500',   text:'text-amber-600'  }},
          { label:'Active',        value:kpi.active,   icon:Bell,          active:filterSeverity==='all'&&filterStatus==='active',         onClick:()=>{setFilterSeverity('all');setFilterStatus('active');},
            accent:{activeBg:'bg-teal-50',    activeBorder:'border-teal-400',    icon:'text-teal-500',    text:'text-teal-700'   }},
          { label:'Resolved',      value:kpi.resolved, icon:CheckCircle,   active:filterStatus==='acknowledged',                          onClick:()=>{setFilterSeverity('all');setFilterStatus('acknowledged');},
            accent:{activeBg:'bg-emerald-50', activeBorder:'border-emerald-400', icon:'text-emerald-500', text:'text-emerald-700'}},
        ]}/>
      </div>

      {/* ── Filter bar ── */}
      <div className="px-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search alerts, patients, types..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-xs"
              />
            </div>

            {/* Severity pills */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
              <span className="text-[10px] text-slate-400 font-bold uppercase px-1.5">Severity</span>
              {['all','critical','high','medium','low'].map(s => (
                <button key={s} onClick={() => setFilterSeverity(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    filterSeverity === s
                      ? s === 'critical' ? 'bg-red-600 text-white shadow-sm'
                      : s === 'high'     ? 'bg-amber-500 text-white shadow-sm'
                      : s === 'medium'   ? 'bg-teal-600 text-white shadow-sm'
                      : s === 'low'      ? 'bg-slate-500 text-white shadow-sm'
                      :                   'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}>
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {[
                { v:'active',       l:'Active Only' },
                { v:'all',          l:'All'         },
                { v:'acknowledged', l:'Resolved'    },
              ].map(({ v,l }) => (
                <button key={v} onClick={() => setFilterStatus(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterStatus === v ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                  }`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Active filter pills */}
          {(filterSeverity !== 'all' || searchTerm || filterStatus !== 'active') && (
            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <ListFilter size={11}/> Filters:
              </span>
              {filterSeverity !== 'all' && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                  filterSeverity==='critical'?'bg-red-100 text-red-700':
                  filterSeverity==='high'    ?'bg-amber-100 text-amber-700':
                  filterSeverity==='medium'  ?'bg-teal-100 text-teal-700':
                                              'bg-slate-100 text-slate-600'}`}>
                  {filterSeverity}
                  <button onClick={() => setFilterSeverity('all')} className="hover:text-red-600 font-black">×</button>
                </span>
              )}
              {filterStatus !== 'active' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1">
                  {filterStatus}
                  <button onClick={() => setFilterStatus('active')} className="hover:text-red-600 font-black">×</button>
                </span>
              )}
              {searchTerm && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-700 flex items-center gap-1">
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
      <div className="px-6 space-y-5">
        {isLoading ? (
          <ListSkeleton items={5} />
        ) : (
          <>
            {/* Active alerts section */}
            {showActive && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Active Alerts
                    <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                      {activeAlerts.length}
                    </span>
                  </h2>
                  {activeAlerts.length > 0 && (
                    <span className="text-xs text-slate-400">Sorted: critical first</span>
                  )}
                </div>

                {activeAlerts.length === 0 ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-10 text-center">
                    <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3 opacity-80" />
                    <p className="text-emerald-800 font-bold text-base mb-1">All clear</p>
                    <p className="text-emerald-600 text-sm">No active alerts match your current filters.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    <div className="space-y-2.5">
                      {activeAlerts.map(a => (
                        <AlertCard key={a.id} alert={a} mlRisk={getML(a.patient_id)}
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
                  className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl border-2 font-bold text-sm transition-all ${
                    ackedExpanded
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle size={16} className={ackedExpanded ? 'text-emerald-500' : 'text-green-400'} />
                    Resolved Alerts
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      ackedExpanded ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {ackedAlerts.length}
                    </span>
                  </div>
                  {ackedExpanded
                    ? <ChevronUp size={16} className="text-emerald-500" />
                    : <ChevronDown size={16} className="text-slate-400" />}
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
                              className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-3 py-2 opacity-60 hover:opacity-100 transition-opacity">
                              <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-[11px] text-slate-700">{label(a.alert_type)}</span>
                                  <span className={cfg.badge}>{cfg.label}</span>
                                  {a.patient_name && <span className="text-[10px] text-slate-500">{a.patient_name}</span>}
                                </div>
                                <p className="text-[10px] text-slate-400 truncate">{a.message}</p>
                              </div>
                              <span className="text-[10px] text-slate-400 flex-shrink-0">
                                {timeAgo(a.acknowledged_at || a.created_at)}
                              </span>
                              {a.patient_id && (
                                <button onClick={() => navigate(`/patients/${a.patient_id}`)}
                                  className="flex-shrink-0 text-[10px] text-teal-600 hover:text-teal-800 font-semibold px-2 py-0.5 rounded hover:bg-teal-50 transition">
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
