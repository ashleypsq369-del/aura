/**
 * Alerts - Clinical Safety Alerts
 * Table layout: Severity · Type · Patient · Message · Time · Actions
 */
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, AlertTriangle, CheckCircle, XCircle,
  Search, Brain, ExternalLink, Activity, Zap, Pill,
  TrendingDown, ChevronDown, ChevronUp, Clock, ShieldAlert,
  X,
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
  critical: { Icon: XCircle,      label:'Critical', pill:'#dc2626', text:'#fff', dot:'#dc2626', pulse:true  },
  high:     { Icon: AlertTriangle, label:'High',     pill:'#ea580c', text:'#fff', dot:'#ea580c', pulse:false },
  medium:   { Icon: Bell,          label:'Medium',   pill:'#0d9488', text:'#fff', dot:'#0d9488', pulse:false },
  low:      { Icon: Bell,          label:'Low',      pill:'#94a3b8', text:'#fff', dot:'#94a3b8', pulse:false },
};
function sevCfg(s) { return SEV[s]||SEV.low; }

const TYPE_ICONS = {
  vital_abnormal:'vital', deterioration:'det', deterioration_trend:'det',
  drug_interaction:'drug', ml_risk:'ml', ml_high_risk:'ml',
};
const TYPE_LABELS = {
  vital_abnormal:'Abnormal Vitals', pain_spike:'Pain Spike', missed_medication:'Missed Medication',
  appointment_due:'Appointment Due', deterioration:'Deteriorating', deterioration_trend:'ML Deterioration',
  drug_interaction:'Drug Interaction', ml_risk:'ML High Risk', ml_high_risk:'ML High Risk', system:'System',
};
const alertLabel = t => TYPE_LABELS[t]||(t||'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())||'Alert';
const TypeIconMap = { vital:Activity, det:TrendingDown, drug:Pill, ml:Zap };
const sevOrd = { critical:0, high:1, medium:2, low:3 };

function timeAgo(iso) {
  if (!iso) return '';
  const m = Math.round((Date.now()-new Date(iso))/60000);
  if (m<1) return 'just now';
  if (m<60) return `${m}m ago`;
  if (m<1440) return `${Math.round(m/60)}h ago`;
  return new Date(iso).toLocaleDateString('en-GB',{ day:'numeric', month:'short' });
}

/* ─── Table row — Severity+Type merged into one "Alert" column ───────────── */
function AlertRow({ alert, mlRisk, onAck, ackPending, onExplain, explainLoading, onNavigate, index }) {
  const cfg      = sevCfg(alert.severity);
  const ikey     = TYPE_ICONS[alert.alert_type];
  const TypeIcon = ikey ? TypeIconMap[ikey] : cfg.Icon;

  return (
    <motion.tr
      layout
      initial={{ opacity:0, y:-6 }}
      animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, x:40, transition:{ duration:0.22 } }}
      transition={{ duration:0.18 }}
      style={{
        background: index%2===0 ? 'var(--card-bg)' : 'var(--page-bg)',
        borderBottom: '1px solid var(--card-border)',
      }}
      onMouseEnter={e=>(e.currentTarget.style.background='color-mix(in srgb,#0d9488 4%,var(--card-bg))')}
      onMouseLeave={e=>(e.currentTarget.style.background=index%2===0?'var(--card-bg)':'var(--page-bg)')}
    >
      {/* Alert = Severity dot + badge + type label (merged) */}
      <td style={{ padding:'10px 12px', whiteSpace:'nowrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{
            width:8, height:8, borderRadius:'50%', flexShrink:0,
            background:cfg.dot, animation:cfg.pulse?'pulse 2s infinite':'none',
          }}/>
          <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99,
            background:cfg.pill, color:cfg.text, flexShrink:0 }}>
            {cfg.label}
          </span>
          <TypeIcon size={12} style={{ color:cfg.dot, flexShrink:0 }}/>
          <span style={{ fontSize:12, fontWeight:600, color:'var(--text-700)' }}>
            {alertLabel(alert.alert_type)}
          </span>
          {mlRisk && (
            <span style={{ fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:99,
              background:'#ede9fe', color:'#6d28d9', display:'inline-flex', alignItems:'center', gap:3 }}>
              <Zap size={9}/> {(mlRisk.overall_risk*100).toFixed(0)}%
            </span>
          )}
        </div>
      </td>

      {/* Patient */}
      <td style={{ padding:'10px 12px', whiteSpace:'nowrap' }}>
        {alert.patient_name
          ? <span style={{ fontSize:12, fontWeight:600, color:'var(--text-700)' }}>{alert.patient_name}</span>
          : <span style={{ fontSize:12, color:'var(--text-300)', fontStyle:'italic' }}>None</span>}
      </td>

      {/* Message */}
      <td style={{ padding:'10px 12px', maxWidth:300 }}>
        <p style={{ margin:0, fontSize:12, color:'var(--text-600)', lineHeight:1.4,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
          title={alert.message}>
          {alert.message}
        </p>
      </td>

      {/* Time */}
      <td style={{ padding:'10px 12px', whiteSpace:'nowrap' }}>
        <span style={{ fontSize:11, color:'var(--text-400)', display:'flex', alignItems:'center', gap:4 }}>
          <Clock size={10}/>{timeAgo(alert.created_at)}
        </span>
      </td>

      {/* Actions */}
      <td style={{ padding:'10px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'nowrap' }}>
          <ReminderBell
            label={`${alertLabel(alert.alert_type)}${alert.patient_name?` - ${alert.patient_name}`:''}`}
            type="custom" size="xs"
          />
          {alert.patient_id && (
            <button onClick={()=>onNavigate(alert.patient_id)} style={{
              display:'inline-flex', alignItems:'center', gap:4,
              padding:'4px 9px', borderRadius:7, fontSize:11, fontWeight:700,
              background:'var(--c-teal)', color:'#fff', border:'none', cursor:'pointer',
            }}>
              <ExternalLink size={10}/> Patient
            </button>
          )}
          <button onClick={()=>onExplain(alert)} disabled={explainLoading} style={{
            display:'inline-flex', alignItems:'center', gap:4,
            padding:'4px 9px', borderRadius:7, fontSize:11, fontWeight:600,
            background:'var(--page-bg)', color:'var(--text-600)',
            border:'1px solid var(--card-border)', cursor:'pointer', opacity:explainLoading?0.5:1,
          }}>
            <Brain size={10}/> Explain
          </button>
          <button onClick={()=>onAck(alert.id)} disabled={ackPending} style={{
            display:'inline-flex', alignItems:'center', gap:4,
            padding:'4px 9px', borderRadius:7, fontSize:11, fontWeight:700,
            background:'linear-gradient(135deg,#10b981,#059669)',
            color:'#fff', border:'none', cursor:'pointer', opacity:ackPending?0.5:1,
            boxShadow:'0 2px 6px rgba(16,185,129,0.25)',
          }}>
            <CheckCircle size={10}/> {ackPending?'…':'Resolve'}
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

/* ─── Resolved compact row ────────────────────────────────────────────────── */
function ResolvedRow({ alert, onNavigate, index }) {
  const cfg  = sevCfg(alert.severity);
  const ikey = TYPE_ICONS[alert.alert_type];
  const TypeIcon = ikey ? TypeIconMap[ikey] : cfg.Icon;
  return (
    <tr style={{
      background: index%2===0 ? 'var(--card-bg)' : 'var(--page-bg)',
      borderBottom:'1px solid var(--card-border)', opacity:0.72,
      transition:'opacity 0.15s',
    }}
    onMouseEnter={e=>(e.currentTarget.style.opacity='1')}
    onMouseLeave={e=>(e.currentTarget.style.opacity='0.72')}>
      {/* Alert (merged) */}
      <td style={{ padding:'8px 12px', whiteSpace:'nowrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99,
            background:cfg.pill, color:cfg.text }}>{cfg.label}</span>
          <TypeIcon size={12} style={{ color:cfg.dot, flexShrink:0 }}/>
          <span style={{ fontSize:12, fontWeight:600, color:'var(--text-700)' }}>{alertLabel(alert.alert_type)}</span>
        </div>
      </td>
      <td style={{ padding:'8px 12px' }}>
        <span style={{ fontSize:12, color:'var(--text-500)' }}>{alert.patient_name||''}</span>
      </td>
      <td style={{ padding:'8px 12px', maxWidth:280 }}>
        <p style={{ margin:0, fontSize:11, color:'var(--text-400)',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {alert.message}
        </p>
      </td>
      <td style={{ padding:'8px 12px' }}>
        <span style={{ fontSize:11, color:'var(--text-400)', display:'flex', alignItems:'center', gap:4 }}>
          <CheckCircle size={10} style={{ color:'#10b981' }}/>{timeAgo(alert.acknowledged_at||alert.created_at)}
        </span>
      </td>
      <td style={{ padding:'8px 12px' }}>
        {alert.patient_id && (
          <button onClick={()=>onNavigate(alert.patient_id)}
            style={{ fontSize:11, fontWeight:600, color:'var(--c-teal)',
              background:'none', border:'none', cursor:'pointer' }}>
            View
          </button>
        )}
      </td>
    </tr>
  );
}

/* ─── Alerts table wrapper ────────────────────────────────────────────────── */
function AlertsTable({ alerts, mlBatch, onAck, pendingAck, onExplain, explainLoading, onNavigate, resolved }) {
  const getML = pid => mlBatch?.ml_available&&pid
    ? mlBatch.patients?.find(p=>p.patient_id===pid)||null : null;

  if (!alerts.length) return (
    <div style={{ textAlign:'center', padding:'48px 24px' }}>
      <div style={{ width:52, height:52, borderRadius:16,
        background:'linear-gradient(135deg,#10b981,#059669)',
        display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
        <CheckCircle size={26} style={{ color:'#fff' }}/>
      </div>
      <p style={{ fontWeight:700, fontSize:14, color:'#15803d', marginBottom:4 }}>All clear</p>
      <p style={{ fontSize:12, color:'#16a34a' }}>No alerts match your filters.</p>
    </div>
  );

  /* 5 columns: Alert (merged) · Patient · Message · Time · Actions */
  const headers = ['Alert','Patient','Message','Time','Actions'];

  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ borderBottom:'2px solid var(--card-border)' }}>
            {headers.map(h=>(
              <th key={h} style={{
                padding:'10px 12px', textAlign:'left',
                fontSize:11, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase',
                color:'var(--text-400)', background:'var(--page-bg)', whiteSpace:'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence mode="popLayout">
            {alerts.map((a,i) => resolved
              ? <ResolvedRow key={a.id} alert={a} onNavigate={onNavigate} index={i}/>
              : (
                <AlertRow key={a.id} alert={a} index={i}
                  mlRisk={getML(a.patient_id)}
                  onAck={onAck} ackPending={pendingAck===a.id}
                  onExplain={onExplain} explainLoading={explainLoading}
                  onNavigate={onNavigate}
                />
              )
            )}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */
export default function Alerts() {
  const navigate      = useNavigate();
  const queryClient   = useQueryClient();
  const { subscribe } = useWS();

  useEffect(() => {
    const u1 = subscribe('new_alert',    ()=>queryClient.invalidateQueries({ queryKey:['alerts'] }));
    const u2 = subscribe('alert_update', ()=>queryClient.invalidateQueries({ queryKey:['alerts'] }));
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

  const { data:rawAlerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn:  async () => {
      const res = await apiClient.get('/api/alerts');
      return (res.data||[]).map(a=>({ ...a, acknowledged:a.acknowledged??a.is_acknowledged??false }));
    },
    refetchInterval: 30000,
  });

  const { data:mlBatch } = useQuery({
    queryKey: ['ml-batch-risk'],
    queryFn:  ()=>mlAPI.getAllPatientsRisk().then(r=>r.data),
    staleTime: 5*60*1000, retry:false,
  });

  const ackMutation = useMutation({
    mutationFn: id => apiClient.put(`/api/alerts/${id}/acknowledge`),
    onMutate: id => {
      setPendingAck(id);
      // Optimistic: immediately mark as acknowledged in cache so row disappears instantly
      queryClient.setQueryData(['alerts'], old =>
        old?.map(a => a.id === id
          ? { ...a, is_acknowledged:true, acknowledged:true }
          : a)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey:['alerts'] });
      queryClient.invalidateQueries({ queryKey:['alerts-unread-count'] });
      setPendingAck(null);
      clinicalToast.success('Alert resolved');
    },
    onError: (_, id) => {
      // Rollback optimistic change on failure
      queryClient.invalidateQueries({ queryKey:['alerts'] });
      setPendingAck(null);
      clinicalToast.error('Could not resolve alert');
    },
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
    critical: rawAlerts?.filter(a=>a.severity==='critical'&&!a.acknowledged).length||0,
    high:     rawAlerts?.filter(a=>a.severity==='high'&&!a.acknowledged).length||0,
    active:   rawAlerts?.filter(a=>!a.acknowledged).length||0,
    resolved: rawAlerts?.filter(a=>a.acknowledged&&a.acknowledged_at&&
      new Date(a.acknowledged_at).toDateString()===new Date().toDateString()).length||0,
  }), [rawAlerts]);

  const { activeAlerts, ackedAlerts } = useMemo(() => {
    if (!rawAlerts) return { activeAlerts:[], ackedAlerts:[] };
    const q = searchTerm.toLowerCase();
    const base = rawAlerts.filter(a => {
      const mS = !q||a.alert_type?.toLowerCase().includes(q)||a.message?.toLowerCase().includes(q)||a.patient_name?.toLowerCase().includes(q);
      const mV = filterSeverity==='all'||a.severity===filterSeverity;
      return mS&&mV;
    });
    const sort = arr=>[...arr].sort((a,b)=>(sevOrd[a.severity]??4)-(sevOrd[b.severity]??4)||new Date(b.created_at)-new Date(a.created_at));
    return {
      activeAlerts: sort(base.filter(a=>!a.acknowledged)),
      ackedAlerts:  [...base.filter(a=>a.acknowledged)].sort((a,b)=>new Date(b.acknowledged_at||b.created_at)-new Date(a.acknowledged_at||a.created_at)),
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
      <PageHeader
        image="/resources/african/african-nurse-female.jpg"
        title="Clinical Alerts"
        subtitle="Active patient safety alerts — sorted by severity"
        icon={ShieldAlert}
        stats={[
          { label:'Critical',       value:kpi.critical, color:'#f87171', pulse:kpi.critical>0, onClick:()=>{ setFilterSeverity('critical'); setFilterStatus('active'); } },
          { label:'High',           value:kpi.high,     color:'#fbbf24', pulse:false,           onClick:()=>{ setFilterSeverity('high');     setFilterStatus('active'); } },
          { label:'Active',         value:kpi.active,   color:'#2dd4bf', pulse:false,           onClick:()=>{ setFilterSeverity('all');      setFilterStatus('active'); } },
          { label:'Resolved today', value:kpi.resolved, color:'#4ade80', pulse:false,           onClick:()=>{ setFilterSeverity('all');      setFilterStatus('acknowledged'); } },
        ]}
      >
        {/* Search */}
        <div style={{ position:'relative', flex:1, minWidth:180, maxWidth:340 }}>
          <Search size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-400)', pointerEvents:'none' }}/>
          <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
            placeholder="Search alerts, patients…"
            style={{ width:'100%', height:34, paddingLeft:32, paddingRight:12, fontSize:12, borderRadius:20,
              border:'1px solid var(--card-border)', background:'var(--page-bg)', color:'var(--text-800)',
              outline:'none', boxSizing:'border-box' }}
            onFocus={e=>(e.target.style.borderColor='var(--c-teal)')}
            onBlur={e=>(e.target.style.borderColor='var(--card-border)')}/>
        </div>

        <div style={{ width:1, height:22, background:'var(--card-border)', flexShrink:0 }}/>

        {/* Severity pills */}
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:10, fontWeight:600, color:'var(--text-400)', marginRight:2, whiteSpace:'nowrap' }}>Severity</span>
          {['all','critical','high','medium','low'].map(s=>{
            const active=filterSeverity===s;
            const col=SEV[s]?.dot||'#334155';
            return (
              <button key={s} onClick={()=>setFilterSeverity(s)} style={{
                padding:'4px 11px', borderRadius:20, fontSize:11, fontWeight:600,
                border:active?`1.5px solid ${col}`:'1px solid var(--card-border)',
                background:active?`${col}12`:'var(--card-bg)',
                color:active?col:'var(--text-500)',
                cursor:'pointer', transition:'all 0.15s', textTransform:'capitalize',
              }}>{s==='all'?'All':s}</button>
            );
          })}
        </div>

        <div style={{ width:1, height:22, background:'var(--card-border)', flexShrink:0 }}/>

        {/* Status pills */}
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:10, fontWeight:600, color:'var(--text-400)', marginRight:2, whiteSpace:'nowrap' }}>Status</span>
          {[{v:'active',l:'Active'},{v:'all',l:'All'},{v:'acknowledged',l:'Resolved'}].map(({v,l})=>(
            <button key={v} onClick={()=>setFilterStatus(v)} style={{
              padding:'4px 11px', borderRadius:20, fontSize:11, fontWeight:600,
              border:filterStatus===v?'1.5px solid var(--c-teal)':'1px solid var(--card-border)',
              background:filterStatus===v?'color-mix(in srgb,var(--c-teal) 10%,var(--card-bg))':'var(--card-bg)',
              color:filterStatus===v?'var(--c-teal)':'var(--text-500)',
              cursor:'pointer', transition:'all 0.15s',
            }}>{l}</button>
          ))}
        </div>

        {/* Active filter chips */}
        {(filterSeverity!=='all'||searchTerm) && (
          <div style={{ display:'flex', alignItems:'center', gap:5, marginLeft:'auto' }}>
            {filterSeverity!=='all' && (
              <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:99,
                background:'#fee2e2', color:'#dc2626', display:'inline-flex', alignItems:'center', gap:3 }}>
                {filterSeverity}
                <button onClick={()=>setFilterSeverity('all')} style={{
                  fontWeight:900, background:'none', border:'none', cursor:'pointer',
                  color:'#dc2626', lineHeight:1, padding:0 }}>
                  <X size={10}/>
                </button>
              </span>
            )}
            {searchTerm && (
              <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:99,
                background:'#f5f3ff', color:'#7c3aed', display:'inline-flex', alignItems:'center', gap:3 }}>
                "{searchTerm}"
                <button onClick={()=>setSearchTerm('')} style={{
                  fontWeight:900, background:'none', border:'none', cursor:'pointer',
                  color:'#7c3aed', lineHeight:1, padding:0 }}>
                  <X size={10}/>
                </button>
              </span>
            )}
          </div>
        )}
      </PageHeader>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'20px 20px 0', display:'flex', flexDirection:'column', gap:20 }}>
        {isLoading ? <ListSkeleton items={5}/> : (
          <>
            {/* Active alerts table */}
            {showActive && (
              <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:14, overflow:'hidden' }}>
                {/* Section header */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'12px 16px', borderBottom:'1px solid var(--card-border)', background:'var(--page-bg)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:'#ef4444',
                      animation:'pulse 2s infinite', flexShrink:0 }}/>
                    <h2 style={{ margin:0, fontSize:13, fontWeight:700, color:'var(--text-800)' }}>Active Alerts</h2>
                    <span style={{ fontSize:11, fontWeight:800, padding:'2px 8px', borderRadius:99,
                      background:'#fee2e2', color:'#dc2626' }}>
                      {activeAlerts.length}
                    </span>
                  </div>
                  {activeAlerts.length>0 && (
                    <span style={{ fontSize:11, color:'var(--text-400)' }}>Sorted: critical first</span>
                  )}
                </div>

                <AlertsTable
                  alerts={activeAlerts} mlBatch={mlBatch} resolved={false}
                  onAck={id=>ackMutation.mutate(id)} pendingAck={pendingAck}
                  onExplain={explainAlert} explainLoading={explainLoading}
                  onNavigate={pid=>navigate(`/patients/${pid}`)}
                />
              </div>
            )}

            {/* Resolved accordion */}
            {showAcked && ackedAlerts.length>0 && (
              <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:14, overflow:'hidden' }}>
                <button
                  onClick={()=>setAckedExpanded(v=>!v)}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'12px 16px', border:'none', cursor:'pointer', transition:'all 0.15s',
                    background: ackedExpanded ? '#f0fdf4' : 'var(--card-bg)',
                    borderBottom: ackedExpanded ? '1px solid var(--card-border)' : 'none',
                  }}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <CheckCircle size={15} style={{ color:ackedExpanded?'#16a34a':'var(--text-400)' }}/>
                    <span style={{ fontSize:13, fontWeight:700, color:ackedExpanded?'#15803d':'var(--text-700)' }}>
                      Resolved Alerts
                    </span>
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99,
                      background:ackedExpanded?'#bbf7d0':'var(--page-bg)',
                      color:ackedExpanded?'#15803d':'var(--text-400)' }}>
                      {ackedAlerts.length}
                    </span>
                  </div>
                  {ackedExpanded
                    ? <ChevronUp  size={15} style={{ color:'#16a34a' }}/>
                    : <ChevronDown size={15} style={{ color:'var(--text-400)' }}/>}
                </button>

                <AnimatePresence>
                  {ackedExpanded && (
                    <motion.div
                      initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
                      exit={{ height:0, opacity:0 }} style={{ overflow:'hidden' }}>
                      <AlertsTable
                        alerts={ackedAlerts.slice(0,30)} mlBatch={null} resolved={true}
                        onAck={()=>{}} pendingAck={null}
                        onExplain={()=>{}} explainLoading={false}
                        onNavigate={pid=>navigate(`/patients/${pid}`)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      {/* AI Explanation overlay */}
      {showFocused && focusedData && (
        <FocusedAIExplanation data={focusedData} onClose={()=>{ setShowFocused(false); setFocusedData(null); }}/>
      )}
    </motion.div>
  );
}
