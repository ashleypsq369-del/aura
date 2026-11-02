/**
 * Alerts — Clinical Safety Alerts
 * Redesigned: underline tab bar, gradient card accents, card-surface filter bar,
 * gradient avatar/icon badges, Services-inspired button and badge treatment.
 * PageHeader image kept as requested.
 */
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, AlertTriangle, CheckCircle, XCircle,
  Search, Brain, ExternalLink, Activity, Zap, Pill,
  TrendingDown, ChevronDown, ChevronUp, Clock, ShieldAlert,
  ListFilter, X,
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

/* ─── Severity config ─────────────────────────────────────────────────────── */
const SEV = {
  critical: { badge: 'badge-critical', Icon: XCircle,       label: 'Critical', pulse: true  },
  high:     { badge: 'badge-high',     Icon: AlertTriangle,  label: 'High',     pulse: false },
  medium:   { badge: 'badge-stable',   Icon: Bell,           label: 'Medium',   pulse: false },
  low:      { badge: 'badge-low',      Icon: Bell,           label: 'Low',      pulse: false },
};

const SEV_COLOR  = { critical:'#ef4444', high:'#f59e0b', medium:'#0d9488', low:'#94a3b8' };
const SEV_GRAD   = { critical:'linear-gradient(135deg,#ef4444,#dc2626)', high:'linear-gradient(135deg,#f59e0b,#d97706)', medium:'linear-gradient(135deg,#0d9488,#0891b2)', low:'linear-gradient(135deg,#94a3b8,#64748b)' };

const TYPE_ICONS = {
  vital_abnormal:'vital', deterioration:'det', deterioration_trend:'det',
  drug_interaction:'drug', ml_risk:'ml', ml_high_risk:'ml',
};
const TYPE_LABELS = {
  vital_abnormal:'Abnormal Vitals', pain_spike:'Pain Spike', missed_medication:'Missed Medication',
  appointment_due:'Appointment Due', deterioration:'Deteriorating', deterioration_trend:'ML Deterioration',
  drug_interaction:'Drug Interaction', ml_risk:'ML High Risk', ml_high_risk:'ML High Risk', system:'System',
};
const alertLabel = t => TYPE_LABELS[t] || (t||'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) || 'Alert';
const sevOrd = { critical:0, high:1, medium:2, low:3 };

function timeAgo(iso) {
  if (!iso) return '';
  const m = Math.round((Date.now()-new Date(iso))/60000);
  if (m<1) return 'just now';
  if (m<60) return `${m}m ago`;
  if (m<1440) return `${Math.round(m/60)}h ago`;
  return new Date(iso).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
}

/* ─── Alert card ──────────────────────────────────────────────────────────── */
function AlertCard({ alert, mlRisk, onAck, ackPending, onExplain, explainLoading, onNavigate }) {
  const cfg   = SEV[alert.severity] || SEV.low;
  const color = SEV_COLOR[alert.severity] || SEV_COLOR.low;
  const grad  = SEV_GRAD[alert.severity]  || SEV_GRAD.low;

  const TypeIconMap = { vital:Activity, det:TrendingDown, drug:Pill, ml:Zap };
  const ikey = TYPE_ICONS[alert.alert_type];
  const Icon = ikey ? TypeIconMap[ikey] : cfg.Icon;

  return (
    <motion.div
      layout
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, y:-6 }}
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      }}
    >
      {/* Gradient top accent — matches Services ProviderCard band */}
      <div style={{ height: 3, background: grad }} />

      <div style={{ padding: '12px 16px', display:'flex', alignItems:'flex-start', gap: 12 }}>
        {/* Icon badge */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `${color}15`,
          display:'flex', alignItems:'center', justifyContent:'center',
          animation: cfg.pulse ? 'pulse 2s infinite' : 'none',
        }}>
          <Icon size={16} style={{ color }} />
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          {/* Title row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:6, marginBottom:4 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontWeight:700, fontSize:12, color:'var(--text-800)' }}>
                {alertLabel(alert.alert_type)}
              </span>
              <span className={cfg.badge}>{cfg.label}</span>
              {mlRisk && (
                <span style={{
                  fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99,
                  background:'#ede9fe', color:'#6d28d9',
                  display:'inline-flex', alignItems:'center', gap:3,
                }}>
                  <Zap size={9} /> ML {(mlRisk.overall_risk*100).toFixed(0)}%
                </span>
              )}
            </div>
            <span style={{ fontSize:10, color:'var(--text-400)', display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
              <Clock size={10} />{timeAgo(alert.created_at)}
            </span>
          </div>

          {/* Message */}
          <p style={{ fontSize:12, color:'var(--text-600)', lineHeight:1.5, marginBottom:10 }}>
            {alert.message}
          </p>

          {/* Actions row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:6 }}>
            {alert.patient_name && (
              <span style={{
                fontSize:11, fontWeight:600, padding:'2px 10px', borderRadius:99,
                background:'var(--page-bg)', color:'var(--text-600)',
                border:'1px solid var(--card-border)',
              }}>
                {alert.patient_name}
              </span>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:6, marginLeft:'auto', flexWrap:'wrap' }}>
              <ReminderBell
                label={`${alertLabel(alert.alert_type)}${alert.patient_name?` - ${alert.patient_name}`:''}`}
                type="custom" size="xs"
              />
              {alert.patient_id && (
                <button onClick={()=>onNavigate(alert.patient_id)} style={{
                  display:'inline-flex', alignItems:'center', gap:5,
                  padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:700,
                  background:'var(--c-teal)', color:'#fff', border:'none', cursor:'pointer',
                  transition:'opacity 0.15s',
                }}
                onMouseEnter={e=>(e.currentTarget.style.opacity='0.85')}
                onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
                  <ExternalLink size={10} /> Patient
                </button>
              )}
              <button onClick={()=>onExplain(alert)} disabled={explainLoading} style={{
                display:'inline-flex', alignItems:'center', gap:5,
                padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:600,
                background:'var(--page-bg)', color:'var(--text-600)',
                border:'1px solid var(--card-border)', cursor:'pointer',
                opacity: explainLoading ? 0.5 : 1, transition:'all 0.15s',
              }}
              onMouseEnter={e=>(e.currentTarget.style.borderColor='var(--c-teal)')}
              onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--card-border)')}>
                <Brain size={10} /> Explain
              </button>
              <button onClick={()=>onAck(alert.id)} disabled={ackPending} style={{
                display:'inline-flex', alignItems:'center', gap:5,
                padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:700,
                background:'linear-gradient(135deg,#10b981,#059669)',
                color:'#fff', border:'none', cursor:'pointer',
                opacity: ackPending ? 0.5 : 1, transition:'opacity 0.15s',
                boxShadow:'0 2px 6px rgba(16,185,129,0.25)',
              }}>
                <CheckCircle size={10} /> {ackPending ? '…' : 'Resolve'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── KPI strip ───────────────────────────────────────────────────────────── */
function KpiStrip({ kpi, filterSeverity, filterStatus, setFilterSeverity, setFilterStatus }) {
  const items = [
    { key:'critical', label:'Critical',   value:kpi.critical, color:'#ef4444', grad:'#ef4444', active: filterSeverity==='critical' && filterStatus==='active', onClick:()=>{setFilterSeverity('critical');setFilterStatus('active');} },
    { key:'high',     label:'High',       value:kpi.high,     color:'#f59e0b', grad:'#f59e0b', active: filterSeverity==='high'     && filterStatus==='active', onClick:()=>{setFilterSeverity('high');    setFilterStatus('active');} },
    { key:'active',   label:'Active',     value:kpi.active,   color:'#0d9488', grad:'#0d9488', active: filterSeverity==='all'      && filterStatus==='active', onClick:()=>{setFilterSeverity('all');     setFilterStatus('active');} },
    { key:'resolved', label:'Resolved',   value:kpi.resolved, color:'#10b981', grad:'#10b981', active: filterStatus==='acknowledged',                          onClick:()=>{setFilterSeverity('all');     setFilterStatus('acknowledged');} },
  ];
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
      {items.map(({ key, label, value, color, grad, active, onClick }) => (
        <button key={key} onClick={onClick} style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'10px 16px', borderRadius:12,
          background: active ? `${color}12` : 'var(--card-bg)',
          border: active ? `1.5px solid ${color}` : '1px solid var(--card-border)',
          cursor:'pointer', transition:'all 0.15s',
          boxShadow: active ? `0 2px 10px ${color}20` : '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <span style={{ fontSize:22, fontWeight:900, color: active ? color : 'var(--text-800)', lineHeight:1 }}>
            {value}
          </span>
          <span style={{ fontSize:11, fontWeight:600, color: active ? color : 'var(--text-500)', whiteSpace:'nowrap' }}>
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */
export default function Alerts() {
  const navigate      = useNavigate();
  const queryClient   = useQueryClient();
  const { subscribe } = useWS();
  const { theme }     = useAppSettings();
  const isDark        = theme === 'dark';

  useEffect(() => {
    const u1 = subscribe('new_alert',    () => queryClient.invalidateQueries({ queryKey:['alerts'] }));
    const u2 = subscribe('alert_update', () => queryClient.invalidateQueries({ queryKey:['alerts'] }));
    return () => { u1(); u2(); };
  }, [subscribe, queryClient]);

  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus,   setFilterStatus]   = useState('active');
  const [searchTerm,     setSearchTerm]     = useState('');
  const [ackedExpanded,  setAckedExpanded]  = useState(false);
  const [pendingAck,     setPendingAck]     = useState(null);
  const [showFocused,    setShowFocused]    = useState(false);
  const [focusedData,    setFocusedData]    = useState(null);
  const [explainLoading, setExplainLoading] = useState(false);

  const { data: rawAlerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn:  async () => {
      const res = await apiClient.get('/api/alerts');
      return (res.data||[]).map(a=>({...a, acknowledged: a.acknowledged ?? a.is_acknowledged ?? false}));
    },
    refetchInterval: 30000,
  });

  const { data: mlBatch } = useQuery({
    queryKey: ['ml-batch-risk'],
    queryFn:  () => mlAPI.getAllPatientsRisk().then(r=>r.data),
    staleTime: 5*60*1000, retry: false,
  });

  const getML = pid => mlBatch?.ml_available && pid
    ? mlBatch.patients?.find(p=>p.patient_id===pid) || null : null;

  const ackMutation = useMutation({
    mutationFn: id => apiClient.put(`/api/alerts/${id}/acknowledge`),
    onMutate:   id => setPendingAck(id),
    onSuccess:  ()  => { queryClient.invalidateQueries(['alerts']); queryClient.invalidateQueries(['alerts-unread-count']); setPendingAck(null); clinicalToast.success('Alert resolved'); },
    onError:    ()  => { setPendingAck(null); clinicalToast.error('Could not resolve alert'); },
  });

  const explainAlert = async (alert) => {
    setExplainLoading(true);
    try {
      const res = await apiClient.post('/api/comprehensive-ai/focused-explanation', {
        patient_id: alert.patient_id, focus_type:'alert', focus_data:{ alert_id:alert.id },
      });
      setFocusedData(res.data);
      setShowFocused(true);
    } catch { toast.error('AI explanation failed'); }
    finally { setExplainLoading(false); }
  };

  const kpi = useMemo(() => ({
    critical: rawAlerts?.filter(a=>a.severity==='critical'&&!a.is_acknowledged).length||0,
    high:     rawAlerts?.filter(a=>a.severity==='high'    &&!a.is_acknowledged).length||0,
    active:   rawAlerts?.filter(a=>!a.is_acknowledged).length||0,
    resolved: rawAlerts?.filter(a=>a.is_acknowledged&&a.acknowledged_at&&new Date(a.acknowledged_at).toDateString()===new Date().toDateString()).length||0,
  }), [rawAlerts]);

  const { activeAlerts, ackedAlerts } = useMemo(() => {
    if (!rawAlerts) return { activeAlerts:[], ackedAlerts:[] };
    const q = searchTerm.toLowerCase();
    const base = rawAlerts.filter(a => {
      const mS = !q||a.alert_type?.toLowerCase().includes(q)||a.message?.toLowerCase().includes(q)||a.patient_name?.toLowerCase().includes(q);
      const mV = filterSeverity==='all'||a.severity===filterSeverity;
      return mS && mV;
    });
    const sort = arr=>[...arr].sort((a,b)=>(sevOrd[a.severity]??4)-(sevOrd[b.severity]??4)||new Date(b.created_at)-new Date(a.created_at));
    return {
      activeAlerts: sort(base.filter(a=>!a.is_acknowledged)),
      ackedAlerts:  [...base.filter(a=>a.is_acknowledged)].sort((a,b)=>new Date(b.acknowledged_at||b.created_at)-new Date(a.acknowledged_at||a.created_at)),
    };
  }, [rawAlerts, searchTerm, filterSeverity]);

  const showActive = filterStatus==='active'||filterStatus==='all';
  const showAcked  = filterStatus==='acknowledged'||filterStatus==='all';

  return (
    <motion.div
      data-page="alerts"
      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}
      style={{ minHeight:'100vh', paddingBottom:40, background:'var(--page-bg)' }}
    >
      {/* PageHeader with image — kept as requested */}
      <PageHeader
        image="/resources/african/african-nurse-female.jpg"
        title="Clinical Alerts"
        subtitle="Active patient safety alerts — sorted by severity"
        icon={ShieldAlert}
        stats={[
          { label:'Critical',  value:kpi.critical, color:'#f87171', pulse:kpi.critical>0,  onClick:()=>{setFilterSeverity('critical');setFilterStatus('active');} },
          { label:'High',      value:kpi.high,     color:'#fbbf24', pulse:false,            onClick:()=>{setFilterSeverity('high');    setFilterStatus('active');} },
          { label:'Active',    value:kpi.active,   color:'#2dd4bf', pulse:false,            onClick:()=>{setFilterSeverity('all');     setFilterStatus('active');} },
          { label:'Resolved today', value:kpi.resolved, color:'#4ade80', pulse:false,      onClick:()=>{setFilterSeverity('all');     setFilterStatus('acknowledged');} },
        ]}
      />

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'20px 20px 0', display:'flex', flexDirection:'column', gap:20 }}>

        {/* Filter card */}
        <div style={{
          borderRadius:14, border:'1px solid var(--card-border)',
          background:'var(--card-bg)',
          boxShadow:'0 2px 10px rgba(0,0,0,0.05)',
          overflow:'hidden',
        }}>
          {/* Gradient accent band */}
          <div style={{ height:3, background:'linear-gradient(90deg,#ef4444,#f59e0b,#0d9488)' }} />

          <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }}>
            {/* Search + pills row */}
            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:10 }}>
              {/* Search */}
              <div style={{ position:'relative', flex:1, minWidth:200 }}>
                <Search size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-400)', pointerEvents:'none' }} />
                <input
                  value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                  placeholder="Search alerts, patients, types…"
                  style={{
                    width:'100%', height:36, paddingLeft:32, paddingRight:12,
                    fontSize:12, borderRadius:10,
                    border:'1px solid var(--card-border)',
                    background:'var(--page-bg)', color:'var(--text-800)',
                    outline:'none', boxSizing:'border-box',
                    transition:'border-color 0.15s',
                  }}
                  onFocus={e=>(e.target.style.borderColor='var(--c-teal)')}
                  onBlur={e=>(e.target.style.borderColor='var(--card-border)')}
                />
              </div>

              {/* Severity pills */}
              <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>
                <span style={{ fontSize:10, fontWeight:700, color:'var(--text-400)', paddingRight:4 }}>Severity</span>
                {['all','critical','high','medium','low'].map(s => {
                  const active = filterSeverity===s;
                  const col = SEV_COLOR[s] || '#334155';
                  return (
                    <button key={s} onClick={()=>setFilterSeverity(s)} style={{
                      padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:700,
                      border: active ? `1px solid ${col}` : '1px solid var(--card-border)',
                      background: active ? `${col}15` : 'transparent',
                      color: active ? col : 'var(--text-500)',
                      cursor:'pointer', transition:'all 0.15s', textTransform:'capitalize',
                    }}>
                      {s==='all'?'All':s}
                    </button>
                  );
                })}
              </div>

              {/* Status pills */}
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                {[{v:'active',l:'Active'},{v:'all',l:'All'},{v:'acknowledged',l:'Resolved'}].map(({v,l})=>(
                  <button key={v} onClick={()=>setFilterStatus(v)} style={{
                    padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:700,
                    border: filterStatus===v ? '1px solid var(--c-teal)' : '1px solid var(--card-border)',
                    background: filterStatus===v ? 'color-mix(in srgb,var(--c-teal) 12%,var(--card-bg))' : 'transparent',
                    color: filterStatus===v ? 'var(--c-teal)' : 'var(--text-500)',
                    cursor:'pointer', transition:'all 0.15s',
                  }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Active filter chips */}
            {(filterSeverity!=='all'||searchTerm||filterStatus!=='active') && (
              <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:6, paddingTop:8, borderTop:'1px solid var(--card-border)' }}>
                <span style={{ fontSize:10, fontWeight:600, color:'var(--text-400)', display:'flex', alignItems:'center', gap:4 }}>
                  <ListFilter size={10} /> Filters:
                </span>
                {filterSeverity!=='all' && (
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99, background:'#fee2e2', color:'#dc2626', display:'inline-flex', alignItems:'center', gap:4 }}>
                    {filterSeverity}
                    <button onClick={()=>setFilterSeverity('all')} style={{ fontWeight:900, background:'none', border:'none', cursor:'pointer', color:'#dc2626', lineHeight:1 }}>×</button>
                  </span>
                )}
                {filterStatus!=='active' && (
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99, background:'#f0fdf9', color:'#0f766e', display:'inline-flex', alignItems:'center', gap:4 }}>
                    {filterStatus}
                    <button onClick={()=>setFilterStatus('active')} style={{ fontWeight:900, background:'none', border:'none', cursor:'pointer', color:'#0f766e', lineHeight:1 }}>×</button>
                  </span>
                )}
                {searchTerm && (
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99, background:'#f5f3ff', color:'#7c3aed', display:'inline-flex', alignItems:'center', gap:4 }}>
                    "{searchTerm}"
                    <button onClick={()=>setSearchTerm('')} style={{ fontWeight:900, background:'none', border:'none', cursor:'pointer', color:'#7c3aed', lineHeight:1 }}>×</button>
                  </span>
                )}
                <button onClick={()=>{setFilterSeverity('all');setFilterStatus('active');setSearchTerm('');}}
                  style={{ marginLeft:'auto', fontSize:11, fontWeight:600, color:'var(--text-400)', background:'none', border:'none', cursor:'pointer' }}>
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {isLoading ? <ListSkeleton items={5} /> : (
            <>
              {/* Active alerts */}
              {showActive && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <h2 style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:700, color:'var(--text-800)', margin:0 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:'#ef4444', animation:'pulse 2s infinite', flexShrink:0 }} />
                      Active Alerts
                      <span style={{ fontSize:11, fontWeight:800, padding:'2px 8px', borderRadius:99, background:'#fee2e2', color:'#dc2626' }}>
                        {activeAlerts.length}
                      </span>
                    </h2>
                    {activeAlerts.length > 0 && (
                      <span style={{ fontSize:11, color:'var(--text-400)' }}>Sorted: critical first</span>
                    )}
                  </div>

                  {activeAlerts.length === 0 ? (
                    <div style={{
                      borderRadius:14, padding:'40px 24px', textAlign:'center',
                      background:'linear-gradient(135deg,#f0fdf490,#dcfce790)',
                      border:'1px solid #bbf7d0',
                    }}>
                      <div style={{ width:56, height:56, borderRadius:18, background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', boxShadow:'0 4px 14px rgba(16,185,129,0.3)' }}>
                        <CheckCircle size={28} style={{ color:'#fff' }} />
                      </div>
                      <p style={{ fontWeight:700, fontSize:15, color:'#15803d', marginBottom:4 }}>All clear</p>
                      <p style={{ fontSize:12, color:'#16a34a' }}>No active alerts match your filters.</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {activeAlerts.map(a => (
                          <AlertCard key={a.id} alert={a} mlRisk={getML(a.patient_id)}
                            onAck={id=>ackMutation.mutate(id)} ackPending={pendingAck===a.id}
                            onExplain={explainAlert} explainLoading={explainLoading}
                            onNavigate={pid=>navigate(`/patients/${pid}`)}
                          />
                        ))}
                      </div>
                    </AnimatePresence>
                  )}
                </div>
              )}

              {/* Resolved accordion */}
              {showAcked && ackedAlerts.length > 0 && (
                <div>
                  <button
                    onClick={()=>setAckedExpanded(v=>!v)}
                    style={{
                      width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'12px 16px', borderRadius:12, border:'1px solid var(--card-border)',
                      background: ackedExpanded ? '#f0fdf4' : 'var(--card-bg)',
                      cursor:'pointer', transition:'all 0.15s',
                    }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <CheckCircle size={15} style={{ color: ackedExpanded ? '#16a34a' : 'var(--text-400)' }} />
                      <span style={{ fontSize:13, fontWeight:700, color: ackedExpanded ? '#15803d' : 'var(--text-700)' }}>
                        Resolved Alerts
                      </span>
                      <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99, background: ackedExpanded ? '#bbf7d0' : 'var(--page-bg)', color: ackedExpanded ? '#15803d' : 'var(--text-400)' }}>
                        {ackedAlerts.length}
                      </span>
                    </div>
                    {ackedExpanded
                      ? <ChevronUp  size={15} style={{ color:'#16a34a' }} />
                      : <ChevronDown size={15} style={{ color:'var(--text-400)' }} />}
                  </button>

                  <AnimatePresence>
                    {ackedExpanded && (
                      <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} style={{ overflow:'hidden' }}>
                        <div style={{ display:'flex', flexDirection:'column', gap:6, paddingTop:8 }}>
                          {ackedAlerts.slice(0,25).map(a => {
                            const cfg = SEV[a.severity]||SEV.low;
                            return (
                              <div key={a.id} style={{
                                display:'flex', alignItems:'center', gap:10,
                                borderRadius:10, padding:'8px 14px', opacity:0.75,
                                background:'var(--card-bg)', border:'1px solid var(--card-border)',
                                transition:'opacity 0.15s',
                              }}
                              onMouseEnter={e=>(e.currentTarget.style.opacity='1')}
                              onMouseLeave={e=>(e.currentTarget.style.opacity='0.75')}>
                                <CheckCircle size={12} style={{ color:'#10b981', flexShrink:0 }} />
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                                    <span style={{ fontSize:11, fontWeight:600, color:'var(--text-700)' }}>{alertLabel(a.alert_type)}</span>
                                    <span className={cfg.badge}>{cfg.label}</span>
                                    {a.patient_name && <span style={{ fontSize:11, color:'var(--text-400)' }}>{a.patient_name}</span>}
                                  </div>
                                  <p style={{ fontSize:11, color:'var(--text-400)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.message}</p>
                                </div>
                                <span style={{ fontSize:10, color:'var(--text-400)', flexShrink:0 }}>{timeAgo(a.acknowledged_at||a.created_at)}</span>
                                {a.patient_id && (
                                  <button onClick={()=>navigate(`/patients/${a.patient_id}`)} style={{ fontSize:11, fontWeight:600, color:'var(--c-teal)', background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>
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
      </div>

      {/* AI Explanation overlay */}
      {showFocused && focusedData && (
        <FocusedAIExplanation data={focusedData} onClose={()=>{ setShowFocused(false); setFocusedData(null); }} />
      )}
    </motion.div>
  );
}
