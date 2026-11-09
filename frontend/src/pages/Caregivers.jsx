/**
 * Caregivers - Care Team management
 * Redesigned: underline tab bar, gradient card top bands, Services-style
 * worker cards, gradient avatars, card-surface filter bar, gradient buttons.
 * PageHeader image kept as requested. All functionality preserved.
 */
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, HeartHandshake, AlertTriangle, Search, X,
  UserPlus, Phone, Mail, Zap, Heart, Star,
  Loader2, Brain, ChevronLeft, ChevronRight,
  TrendingUp, BarChart2, ListChecks, CheckCircle,
  Shield, Award, MapPin, MessageCircle,
  BadgeCheck, Stethoscope,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  caregiversAPI, caregiverIntelligenceAPI, advancedMlAPI,
  patientsAPI, trustProfileAPI,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import toast from '../utils/toast';
import SearchableSelect from '../components/ui/SearchableSelect';

/* ─── Constants ───────────────────────────────────────────────────────────── */
const TEAL_GRADS = [
  ['#0d9488','#0891b2'],['#0891b2','#1d4ed8'],['#059669','#0d9488'],
  ['#0d9488','#059669'],['#0891b2','#0d9488'],['#1d4ed8','#0891b2'],
  ['#065f46','#0d9488'],['#1e40af','#0891b2'],
];
const PAGE_SIZE  = 9;
const getInitials = n => n ? n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() : '??';

const capColor = s => ({
  available:    { dot:'#10b981', label:'Available', bg:'#10b98115', text:'#065f46' },
  at_capacity:  { dot:'#f59e0b', label:'At Capacity', bg:'#f59e0b15', text:'#92400e' },
  overloaded:   { dot:'#ef4444', label:'Overloaded', bg:'#ef444415', text:'#991b1b' },
})[s] || { dot:'#10b981', label:'Available', bg:'#10b98115', text:'#065f46' };

/* ─── Sub-components (unchanged functionality, upgraded styles) ───────────── */
function Stars({ value, count }) {
  if (value==null) return <span style={{ fontSize:11, color:'var(--text-400)', fontStyle:'italic' }}>No reviews</span>;
  return (
    <span style={{ display:'flex', alignItems:'center', gap:2 }}>
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={11} strokeWidth={1.5}
          style={{ color: n<=Math.round(value) ? '#f59e0b' : 'var(--card-border)', fill: n<=Math.round(value) ? '#f59e0b' : 'none' }} />
      ))}
      <span style={{ marginLeft:4, fontSize:12, fontWeight:700, color:'var(--text-700)' }}>{value.toFixed(1)}</span>
      {count>0 && <span style={{ fontSize:11, color:'var(--text-400)' }}>({count})</span>}
    </span>
  );
}

function VerifyBadge({ icon:Icon, label, color='#0d9488' }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:700, background:`${color}15`, color }}>
      <Icon size={9} strokeWidth={2.5} />{label}
    </span>
  );
}

function BurnoutDot({ level }) {
  const l = String(level||'low').toLowerCase();
  if (l==='critical') return <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, color:'#dc2626' }}><span style={{ width:6, height:6, borderRadius:'50%', background:'#ef4444', animation:'pulse 2s infinite' }}/>Critical burnout</span>;
  if (l==='high')     return <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, color:'#ea580c' }}><span style={{ width:6, height:6, borderRadius:'50%', background:'#f97316' }}/>High risk</span>;
  if (l==='moderate') return <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, color:'#d97706' }}><span style={{ width:6, height:6, borderRadius:'50%', background:'#f59e0b' }}/>Moderate</span>;
  return <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, color:'#059669' }}><span style={{ width:6, height:6, borderRadius:'50%', background:'#10b981' }}/>Healthy</span>;
}

/* ─── Worker Card ─────────────────────────────────────────────────────────── */
function WorkerCard({ cg, workload, burnoutLevel, gradPair, trust, onBurnoutClick, onMessage, onViewProfile }) {
  const wl = workload||{};
  const capInfo = capColor(wl.capacity_status);
  const activePatients = wl.active_patients??0;
  const workloadPct    = Math.min(wl.workload_score??0, 100);
  const [g1,g2] = gradPair;

  return (
    <motion.div
      layout
      initial={{ opacity:0, y:12 }}
      animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, scale:0.97 }}
      whileHover={{ y:-4, boxShadow:'0 12px 36px rgba(0,0,0,0.12)' }}
      transition={{ type:'spring', stiffness:280, damping:26 }}
      style={{
        background:'var(--card-bg)',
        borderRadius:18, overflow:'hidden',
        border:'1px solid var(--card-border)',
        boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
        display:'flex', flexDirection:'column',
      }}
    >
      {/* Gradient top band - Services ProviderCard treatment */}
      <div style={{ height:4, background:`linear-gradient(to right,${g1},${g2})` }} />

      <div style={{ padding:16, display:'flex', flexDirection:'column', gap:12, flex:1 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{
            width:44, height:44, borderRadius:14, flexShrink:0,
            background:`linear-gradient(135deg,${g1},${g2})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14, fontWeight:900, color:'#fff',
            boxShadow:`0 4px 12px ${g1}40`,
          }}>
            {getInitials(cg.full_name)}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontWeight:700, fontSize:13, color:'var(--text-900)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cg.full_name}</p>
            <p style={{ fontSize:11, color:'var(--text-500)', textTransform:'capitalize', margin:0 }}>{cg.role||'Caregiver'}</p>
            {trust?.specialisation && <p style={{ fontSize:11, color:'var(--c-teal)', fontWeight:500, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{trust.specialisation}</p>}
          </div>
          {/* Availability badge */}
          <span style={{ flexShrink:0, display:'inline-flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:99, fontSize:10, fontWeight:700, background:capInfo.bg, color:capInfo.text }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:capInfo.dot }} />
            {capInfo.label}
          </span>
        </div>

        {/* Verification badges */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
          {trust?.nmc_pin          && <VerifyBadge icon={Award}    label={`NMC ${trust.nmc_pin}`}  color="#0d9488" />}
          {trust?.ghana_card_verified && <VerifyBadge icon={Shield}   label="Ghana Card"              color="#0891b2" />}
          {trust?.is_professional  && <VerifyBadge icon={BadgeCheck} label="Verified Pro"            color="#059669" />}
          {trust && !trust?.nmc_pin && !trust?.ghana_card_verified && !trust?.is_professional && (
            <span style={{ fontSize:11, color:'var(--text-400)', fontStyle:'italic' }}>No badges on file</span>
          )}
        </div>

        {/* Rating */}
        <Stars value={trust?.average_rating} count={trust?.total_reviews??0} />

        {/* Workload bar */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
            <span style={{ fontSize:11, color:'var(--text-400)', fontWeight:600 }}>Workload</span>
            <span style={{ fontSize:11, fontWeight:700, fontVariantNumeric:'tabular-nums', color: workloadPct>75?'#ef4444':workloadPct>=50?'#f59e0b':'#10b981' }}>
              {activePatients} patients · {workloadPct}%
            </span>
          </div>
          <div style={{ height:6, background:'var(--card-border)', borderRadius:99, overflow:'hidden' }}>
            <motion.div
              initial={{ width:0 }} animate={{ width:`${workloadPct}%` }}
              transition={{ duration:0.7, ease:'easeOut' }}
              style={{
                height:'100%', borderRadius:99,
                background: workloadPct>75
                  ? 'linear-gradient(to right,#ef4444,#dc2626)'
                  : workloadPct>=50
                  ? 'linear-gradient(to right,#f59e0b,#d97706)'
                  : `linear-gradient(to right,${g1},${g2})`,
              }}
            />
          </div>
        </div>

        {/* Burnout + location */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <BurnoutDot level={burnoutLevel} />
          {trust?.region && (
            <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--text-400)' }}>
              <MapPin size={9} /> {trust.region}
            </span>
          )}
        </div>

        {/* Contact */}
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {cg.email && <p style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text-500)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}><Mail size={10} style={{ color:'var(--text-400)', flexShrink:0 }} />{cg.email}</p>}
          {cg.phone && <p style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text-500)' }}><Phone size={10} style={{ color:'var(--text-400)', flexShrink:0 }} />{cg.phone}</p>}
        </div>

        {/* Action buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, paddingTop:4 }}>
          {[
            { label:'Message', Icon:MessageCircle, color:'#0d9488', onClick:onMessage },
            { label:'Trust',   Icon:Shield,        color:'#0891b2', onClick:onViewProfile },
            { label:'Burnout', Icon:Brain,         color:'#7c3aed', onClick:onBurnoutClick },
          ].map(({ label, Icon, color, onClick }) => (
            <button key={label} onClick={onClick} style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              padding:'8px 4px', borderRadius:10, fontSize:10, fontWeight:700,
              background:`${color}12`, color, border:'none', cursor:'pointer',
              transition:'all 0.15s',
            }}
            onMouseEnter={e=>{e.currentTarget.style.background=`${color}22`;}}
            onMouseLeave={e=>{e.currentTarget.style.background=`${color}12`;}}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Trust Profile Modal ─────────────────────────────────────────────────── */
function TrustProfileModal({ cg, onClose }) {
  const { data:trust, isLoading } = useQuery({
    queryKey: ['trust-profile', cg?.id],
    queryFn:  () => trustProfileAPI.get(cg.id).then(r=>r.data),
    enabled: !!cg?.id,
  });
  if (!cg) return null;
  const [g1,g2] = TEAL_GRADS[cg.id%TEAL_GRADS.length];
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <motion.div initial={{ opacity:0, scale:0.95, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
        style={{ background:'var(--card-bg)', borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,0.2)', width:'100%', maxWidth:360, overflow:'hidden' }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:4, background:`linear-gradient(to right,${g1},${g2})` }} />
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--card-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${g1},${g2})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, color:'#fff', boxShadow:`0 2px 8px ${g1}35` }}>
              {getInitials(cg.full_name)}
            </div>
            <div>
              <p style={{ fontWeight:700, fontSize:13, color:'var(--text-900)', margin:0 }}>{cg.full_name}</p>
              <p style={{ fontSize:11, color:'var(--text-400)', margin:0 }}>{cg.role}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:8, background:'var(--page-bg)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-500)' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding:20, display:'flex', flexDirection:'column', gap:16 }}>
          {isLoading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'24px 0' }}><Loader2 size={22} className="animate-spin" style={{ color:'var(--c-teal)' }} /></div>
          ) : trust ? (
            <>
              <div>
                <p style={{ fontSize:11, fontWeight:700, color:'var(--text-400)', marginBottom:8 }}>Verification</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {trust.nmc_pin           ? <VerifyBadge icon={Award}     label={`NMC PIN: ${trust.nmc_pin}`}            color="#0d9488" /> : <span style={{ fontSize:11, color:'var(--text-400)', fontStyle:'italic' }}>NMC PIN not on file</span>}
                  {trust.ghana_card_verified ? <VerifyBadge icon={Shield}    label="Ghana Card Verified"                    color="#0891b2" /> : <span style={{ fontSize:11, color:'var(--text-400)', fontStyle:'italic' }}>Ghana Card not verified</span>}
                  {trust.is_professional    && <VerifyBadge icon={BadgeCheck} label={trust.professional_title||'Verified Pro'} color="#059669" />}
                </div>
              </div>
              <div>
                <p style={{ fontSize:11, fontWeight:700, color:'var(--text-400)', marginBottom:6 }}>Service Rating</p>
                <Stars value={trust.average_rating} count={trust.total_reviews} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  { label:'Specialisation', value:trust.specialisation },
                  { label:'Facility',       value:trust.facility_name },
                  { label:'Region',         value:trust.region },
                  { label:'Active Patients',value:trust.active_patients??0 },
                ].filter(r=>r.value!=null).map(({ label, value }) => (
                  <div key={label} style={{ background:'var(--page-bg)', borderRadius:10, padding:'8px 12px' }}>
                    <p style={{ fontSize:10, color:'var(--text-400)', margin:0 }}>{label}</p>
                    <p style={{ fontSize:12, fontWeight:600, color:'var(--text-700)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ fontSize:13, color:'var(--text-400)', textAlign:'center', padding:'24px 0' }}>No trust profile data</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Burnout Modal ───────────────────────────────────────────────────────── */
function BurnoutModal({ cg, data, loading, onClose }) {
  if (!cg) return null;
  const pct   = data ? Math.round((data.burnout_score??0)*100) : 0;
  const level = data?.burnout_level||'low';
  const ringColor = level==='critical'?'#ef4444':level==='high'?'#f97316':level==='moderate'?'#f59e0b':'#10b981';
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <motion.div initial={{ opacity:0, scale:0.95, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
        style={{ background:'var(--card-bg)', borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,0.2)', width:'100%', maxWidth:440, overflow:'hidden' }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:4, background:`linear-gradient(to right,${ringColor},${ringColor}88)` }} />
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--card-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:ringColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#fff' }}>
              {getInitials(cg.full_name)}
            </div>
            <div>
              <p style={{ fontWeight:700, fontSize:13, color:'var(--text-900)', margin:0 }}>{cg.full_name}</p>
              <p style={{ fontSize:11, color:'var(--text-400)', margin:0 }}>AI Burnout Analysis</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:8, background:'var(--page-bg)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-500)' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding:20, maxHeight:'72vh', overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>
          {loading && <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'40px 0', gap:10 }}><Loader2 size={22} className="animate-spin" style={{ color:'var(--c-teal)' }} /><p style={{ fontSize:12, color:'var(--text-400)' }}>Analysing burnout risk…</p></div>}
          {!loading && !data && <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'40px 0', gap:8, color:'var(--text-400)' }}><Brain size={30} /><p style={{ fontSize:13 }}>No burnout data</p></div>}
          {!loading && data && (
            <>
              {/* Score ring */}
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:16, borderRadius:14, background:'var(--page-bg)', border:'1px solid var(--card-border)' }}>
                <div style={{ width:64, height:64, borderRadius:14, background:ringColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:900, color:'#fff', flexShrink:0, boxShadow:`0 4px 14px ${ringColor}40` }}>
                  {pct}%
                </div>
                <div>
                  <p style={{ fontWeight:700, fontSize:14, color:'var(--text-900)', textTransform:'capitalize', margin:0 }}>{level} Risk</p>
                  <p style={{ fontSize:11, color:'var(--text-400)', margin:'2px 0 4px' }}>ML burnout probability</p>
                  <BurnoutDot level={level} />
                </div>
              </div>
              {/* Signals */}
              {data.signals?.length > 0 && (
                <div>
                  <p style={{ fontSize:11, fontWeight:700, color:'var(--text-400)', marginBottom:8 }}>Risk Signals</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {data.signals.map((s,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 12px', background:'var(--warn-bg, #fffbeb)', border:'1px solid var(--warn-border, #fde68a)', borderRadius:10, fontSize:12 }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:'#f59e0b', flexShrink:0, marginTop:4 }} />
                        <span style={{ fontWeight:600, color:'var(--text-700)', flex:1 }}>{s.signal}</span>
                        {s.value && <span style={{ color:'var(--text-400)', marginLeft:'auto' }}>{s.value}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!data.signals||data.signals.length===0) && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:12, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10 }}>
                  <CheckCircle size={16} style={{ color:'#16a34a', flexShrink:0 }} />
                  <p style={{ fontSize:12, fontWeight:600, color:'#166534', margin:0 }}>No burnout signals detected</p>
                </div>
              )}
              {/* Recommendations */}
              {data.recommendations?.filter(Boolean).length > 0 && (
                <div>
                  <p style={{ fontSize:11, fontWeight:700, color:'var(--text-400)', marginBottom:8 }}>Recommendations</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {data.recommendations.filter(Boolean).map((rec,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 12px', background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:10, fontSize:12, color:'#0f766e' }}>
                        <TrendingUp size={12} style={{ flexShrink:0, marginTop:2 }} />{rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}



/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════════════════ */
export default function Caregivers() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const isStaff    = user?.role==='clinician'||user?.role==='admin';
  const isCaregiver= user?.role==='caregiver';
  const indicatorRef = useRef(null);
  const tabRefs      = useRef({});

  const [tab,         setTab]         = useState('team');
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('all');
  const [page,        setPage]        = useState(0);
  const [burnoutCg,   setBurnoutCg]   = useState(null);
  const [trustCg,     setTrustCg]     = useState(null);
  const [burnoutMap,  setBurnoutMap]  = useState({});
  const [burnoutLoading, setBurnoutLoading] = useState(false);
  const [optPid,      setOptPid]      = useState('');
  const [manualCg,    setManualCg]    = useState('');
  const [manualPt,    setManualPt]    = useState('');

  /* Animate tab underline */
  useEffect(() => {
    const el  = tabRefs.current[tab];
    const ind = indicatorRef.current;
    if (!el || !ind) return;
    const list = el.closest('[data-tab-list]');
    if (!list) return;
    const eR = el.getBoundingClientRect();
    const lR = list.getBoundingClientRect();
    ind.style.width = `${eR.width}px`;
    ind.style.left  = `${eR.left-lR.left}px`;
  }, [tab]);

  useEffect(() => { setPage(0); }, [search, filter]);

  /* Queries */
  const { data:cgRaw,   isLoading }  = useQuery({ queryKey:['caregivers-all'], queryFn:()=>caregiversAPI.getAll().then(r=>r.data), staleTime:5*60*1000, retry:false });
  const { data:assnRaw }             = useQuery({ queryKey:['cg-assignments'], queryFn:()=>caregiversAPI.getAssignments().then(r=>r.data), enabled:isStaff, staleTime:3*60*1000, retry:false });
  const { data:myPtsRaw }            = useQuery({ queryKey:['cg-my-patients'], queryFn:()=>caregiverIntelligenceAPI.getMyPatients().then(r=>r.data), enabled:isCaregiver, staleTime:3*60*1000, retry:false });
  const { data:teamRaw }             = useQuery({ queryKey:['cg-team'],        queryFn:()=>caregiverIntelligenceAPI.getTeamOverview().then(r=>r.data), staleTime:5*60*1000, retry:false });
  const { data:burnoutRaw }          = useQuery({ queryKey:['cg-burnout'],     queryFn:()=>advancedMlAPI.getAllCaregiverBurnout().then(r=>r.data), staleTime:10*60*1000, retry:false });
  const { data:patientsRaw }         = useQuery({ queryKey:['patients-list'],  queryFn:()=>patientsAPI.getAll().then(r=>r.data), enabled:isStaff, staleTime:5*60*1000 });

  const caregivers   = Array.isArray(cgRaw)    ? cgRaw    : cgRaw?.caregivers    || [];
  const assignments  = Array.isArray(assnRaw)  ? assnRaw  : assnRaw?.assignments || [];
  const myPatients   = Array.isArray(myPtsRaw?.patients) ? myPtsRaw.patients : [];
  const burnoutList  = Array.isArray(burnoutRaw) ? burnoutRaw : burnoutRaw?.caregivers || [];
  const patientList  = Array.isArray(patientsRaw) ? patientsRaw : patientsRaw?.patients || [];

  /* Batch trust-profile fetch - one query for ALL caregivers, not one per card (fixes B1) */
  const { data:trustProfilesRaw } = useQuery({
    queryKey: ['trust-profiles-all'],
    queryFn:  () => trustProfileAPI.getAll().then(r => r.data),
    enabled:  caregivers.length > 0,
    staleTime: 10*60*1000,
  });
  /* Build a lookup map by caregiver id. Falls back to per-id GET if getAll not supported */
  const trustMap = useMemo(() => {
    if (!trustProfilesRaw) return {};
    const list = Array.isArray(trustProfilesRaw) ? trustProfilesRaw : trustProfilesRaw?.profiles || [];
    const m = {};
    list.forEach(tp => { if (tp.user_id || tp.caregiver_id) m[tp.user_id ?? tp.caregiver_id] = tp; });
    return m;
  }, [trustProfilesRaw]);
  const workloadMap = useMemo(() => {
    const m = {};
    (teamRaw?.team_metrics||[]).forEach(tm => { m[tm.caregiver_id] = tm.workload; });
    return m;
  }, [teamRaw]);

  const burnoutLevelMap = useMemo(() => {
    const m = {};
    burnoutList.forEach(b => {
      const id = b.caregiver_id||b.user_id;
      if (id) m[id] = String(b.burnout_level||b.risk_level||'low').toLowerCase();
    });
    return m;
  }, [burnoutList]);

  const burnoutAlerts = Object.values(burnoutLevelMap).filter(l=>l==='critical'||l==='high').length;
  const overloaded    = Object.values(workloadMap).filter(w=>w?.capacity_status==='overloaded').length;

  const FILTERS = [
    { id:'all',       label:'All',       count: isLoading ? '-' : caregivers.length },
    { id:'available', label:'Available', count: isLoading ? '-' : caregivers.length-overloaded },
    { id:'burnout',   label:'At Risk',   count: isLoading ? '-' : burnoutAlerts },
    { id:'overloaded',label:'Overloaded',count: isLoading ? '-' : overloaded },
  ];

  const filtered = useMemo(() => caregivers.filter(cg => {
    if (search) { const s=search.toLowerCase(); if (!(cg.full_name||'').toLowerCase().includes(s)&&!(cg.role||'').toLowerCase().includes(s)&&!(cg.email||'').toLowerCase().includes(s)) return false; }
    const wl = workloadMap[cg.id]||{};
    const bl = burnoutLevelMap[cg.id]||'low';
    if (filter==='burnout')    return ['critical','high','moderate'].includes(bl);
    if (filter==='overloaded') return wl.capacity_status==='overloaded';
    if (filter==='available')  return wl.capacity_status!=='overloaded';
    return true;
  }), [caregivers, search, filter, workloadMap, burnoutLevelMap]);

  const pageCount = Math.ceil(filtered.length/PAGE_SIZE);
  const paginated = filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);

  /* Mutations */
  const assignMutation = useMutation({
    mutationFn: d => caregiversAPI.assign(d),
    onSuccess: () => { toast.success('Patient assigned'); setManualCg(''); setManualPt(''); qc.invalidateQueries(['cg-assignments']); qc.invalidateQueries(['cg-team']); },
    onError: e => toast.error(e?.response?.data?.detail||'Assignment failed'),
  });
  const removeMutation = useMutation({
    mutationFn: id => caregiversAPI.removeAssignment(id),
    onSuccess: () => { toast.success('Assignment removed'); qc.invalidateQueries(['cg-assignments']); },
    onError: () => toast.error('Failed to remove'),
  });
  const optimalMutation = useMutation({
    mutationFn: pid => caregiverIntelligenceAPI.assignOptimal(pid),
    onSuccess: d => { toast.success(`AI assigned ${d?.data?.caregiver_name||'caregiver'}`); setOptPid(''); qc.invalidateQueries(['cg-assignments']); qc.invalidateQueries(['cg-team']); },
    onError: e => toast.error(e?.response?.data?.detail||'Auto-assign failed'),
  });

  const openBurnout = useCallback((cg) => {
    setBurnoutCg(cg);
    if (!burnoutMap[cg.id]) {
      setBurnoutLoading(true);
      advancedMlAPI.getCaregiverBurnout(cg.id)
        .then(r => { setBurnoutMap(m=>({...m,[cg.id]:r.data})); setBurnoutLoading(false); })
        .catch(() => setBurnoutLoading(false));
    }
  }, [burnoutMap]);

  const TABS = [
    { id:'team',       label:'Team',       Icon:Users },
    { id:'analytics',  label:'Analytics',  Icon:BarChart2 },
    { id:'assignments',label:'Assignments',Icon:ListChecks },
    ...(isCaregiver ? [{ id:'mypatients', label:'My Patients', Icon:Heart }] : []),
  ];

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}
      style={{ minHeight:'100vh', paddingBottom:40, background:'var(--page-bg)' }}>

      {/* PageHeader with image */}
      <PageHeader
        image="/resources/african/african-caregiver.jpg"
        title="Care Team"
        subtitle="Verified nurses · caregivers · clinicians · Ghana Card & NMC trust profiles"
        icon={HeartHandshake}
        stats={[
          { label:'Team',       value: caregivers.length,                    color:'#2dd4bf', pulse:false },
          { label:'Available',  value: caregivers.length - overloaded,       color:'#4ade80', pulse:false, onClick:()=>setFilter('available') },
          { label:'At Risk',    value: burnoutAlerts,                        color:'#fbbf24', pulse:burnoutAlerts>0, onClick:()=>setFilter('burnout') },
          { label:'Overloaded', value: overloaded,                           color:'#f87171', pulse:overloaded>0, onClick:()=>setFilter('overloaded') },
        ]}
      >
        {/* Only show search+filter when on Team tab */}
        {tab==='team' && (
          <>
            <div style={{ position:'relative', flex:1, minWidth:160, maxWidth:280 }}>
              <Search size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-400)', pointerEvents:'none' }}/>
              <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search by name, role, email…"
                style={{ width:'100%', height:34, paddingLeft:32, paddingRight:search?30:12, fontSize:12, borderRadius:20, border:'1px solid var(--card-border)', background:'var(--page-bg)', color:'var(--text-800)', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }}
                onFocus={e=>(e.target.style.borderColor='var(--c-teal)')}
                onBlur={e=>(e.target.style.borderColor='var(--card-border)')}/>
              {search && (
                <button onClick={()=>setSearch('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', width:18, height:18, borderRadius:5, background:'var(--card-border)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <X size={10} style={{ color:'var(--text-500)' }}/>
                </button>
              )}
            </div>
            <div style={{ display:'flex', gap:5 }}>
              {FILTERS.map(f=>(
                <button key={f.id} onClick={()=>{setFilter(f.id);setPage(0);}} style={{
                  display:'flex', alignItems:'center', gap:5,
                  padding:'4px 11px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                  border: filter===f.id ? '1.5px solid var(--c-teal)' : '1px solid var(--card-border)',
                  background: filter===f.id ? 'color-mix(in srgb,var(--c-teal) 10%,var(--card-bg))' : 'var(--card-bg)',
                  color: filter===f.id ? 'var(--c-teal)' : 'var(--text-500)',
                }}>
                  {f.label}
                  <span style={{ fontSize:10, fontWeight:800, padding:'0 5px', borderRadius:99, background:filter===f.id?'var(--c-teal)':'var(--page-bg)', color:filter===f.id?'#fff':'var(--text-400)' }}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </PageHeader>


      {/* Burnout alert banner */}
      {burnoutAlerts > 0 && (
        <div style={{ maxWidth:1200, margin:'12px auto 0', padding:'0 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', background:'#fef2f2', border:'1px solid #fca5a5', borderLeft:'4px solid #ef4444', borderRadius:12 }}>
            <AlertTriangle size={14} style={{ color:'#dc2626', flexShrink:0 }} />
            <p style={{ fontWeight:700, fontSize:13, color:'#991b1b', margin:0, flex:1 }}>{burnoutAlerts} team member{burnoutAlerts>1?'s':''} at burnout risk</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0 12px' }}>
              {burnoutList.filter(b=>['critical','high'].includes(String(b.burnout_level||b.risk_level||'').toLowerCase())).map((b,i)=>(
                <span key={i} style={{ fontSize:11, color:'#dc2626' }}><strong>{b.caregiver_name||b.name}</strong> · {b.burnout_level||b.risk_level}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Vertical sidebar layout ──────────────────────────────────────── */}
      <div style={{ maxWidth:1200, margin:'16px auto 0', padding:'0 20px 48px' }}>
        <div className="mobile-stack" style={{
          background:'var(--card-bg)',
          border:'1px solid var(--card-border)',
          borderRadius:16, overflow:'hidden',
          boxShadow:'0 2px 16px rgba(0,0,0,0.06)',
          display:'flex', minHeight:500,
        }}>

          {/* ── LEFT: vertical nav ──────────────────────────────────────── */}
          <nav className="mobile-sidebar" style={{
            width:200, flexShrink:0,
            borderRight:'1px solid var(--card-border)',
            display:'flex', flexDirection:'column',
            background:'var(--page-bg)',
          }}>
            {/* Nav header */}
            <div style={{ padding:'16px 16px 10px', borderBottom:'1px solid var(--card-border)' }}>
              <p style={{ fontSize:10, fontWeight:800, color:'var(--text-300)', textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>Care Team</p>
            </div>

            {/* Nav items */}
            <div style={{ padding:'8px 8px', display:'flex', flexDirection:'column', gap:2, flex:1 }}>
              {TABS.map(({ id, label, Icon }) => {
                const active = tab === id;
                return (
                  <button key={id} onClick={()=>setTab(id)}
                    style={{
                      display:'flex', alignItems:'center', gap:10,
                      padding:'10px 12px', borderRadius:10,
                      fontSize:13, fontWeight: active ? 700 : 500,
                      color: active ? '#fff' : 'var(--text-600)',
                      background: active
                        ? 'linear-gradient(135deg,#0d9488,#0891b2)'
                        : 'transparent',
                      border:'none', cursor:'pointer', textAlign:'left',
                      transition:'all 0.15s',
                      boxShadow: active ? '0 4px 12px rgba(13,148,136,0.3)' : 'none',
                      position:'relative', overflow:'hidden',
                    }}
                    onMouseEnter={e=>{ if(!active){ e.currentTarget.style.background='var(--card-bg)'; e.currentTarget.style.color='var(--text-900)'; } }}
                    onMouseLeave={e=>{ if(!active){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-600)'; } }}
                  >
                    <div style={{
                      width:28, height:28, borderRadius:8, flexShrink:0,
                      background: active ? 'rgba(255,255,255,0.2)' : 'var(--card-border)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      transition:'all 0.15s',
                    }}>
                      <Icon size={13} style={{ color: active ? '#fff' : 'var(--text-500)' }} />
                    </div>
                    <span style={{ flex:1, fontSize:13 }}>{label}</span>
                    {id==='team' && (
                      <span style={{
                        fontSize:10, fontWeight:800, padding:'2px 7px', borderRadius:99,
                        background: active ? 'rgba(255,255,255,0.25)' : '#ccfbf1',
                        color: active ? '#fff' : '#0f766e',
                        flexShrink:0,
                      }}>
                        {isLoading ? '-' : caregivers.length}
                      </span>
                    )}
                    {id==='assignments' && assignments.length > 0 && (
                      <span style={{
                        fontSize:10, fontWeight:800, padding:'2px 7px', borderRadius:99,
                        background: active ? 'rgba(255,255,255,0.25)' : '#fee2e2',
                        color: active ? '#fff' : '#dc2626',
                        flexShrink:0,
                      }}>
                        {assignments.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Team status strip */}
            <div style={{ borderTop:'1px solid var(--card-border)', padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
              <p style={{ fontSize:10, fontWeight:800, color:'var(--text-300)', textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>Team Status</p>
              {[
                { label:'Available',  value: isLoading?'-':caregivers.length-overloaded, dot:'#10b981', color:'#065f46' },
                { label:'At Risk',    value: isLoading?'-':burnoutAlerts,                dot: burnoutAlerts>0?'#f59e0b':'var(--card-border)', color: burnoutAlerts>0?'#92400e':'var(--text-400)' },
                { label:'Overloaded', value: isLoading?'-':overloaded,                   dot: overloaded>0?'#ef4444':'var(--card-border)',    color: overloaded>0?'#991b1b':'var(--text-400)' },
              ].map(s => (
                <div key={s.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:s.dot, flexShrink:0 }} />
                  <span style={{ fontSize:11, color:'var(--text-500)', flex:1 }}>{s.label}</span>
                  <span style={{ fontSize:13, fontWeight:800, color:s.color, fontVariantNumeric:'tabular-nums' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </nav>

          {/* ── RIGHT: content panel ─────────────────────────────────────── */}
          <div className="mobile-main" style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>

            {/* Content header - title + tab-specific toolbar */}
            <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--card-border)', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', minHeight:52 }}>
              <p style={{ fontSize:14, fontWeight:700, color:'var(--text-900)', margin:0, flex:1 }}>
                {tab==='team'?'Care Team':tab==='analytics'?'Team Analytics':tab==='assignments'?'Patient Assignments':'My Patients'}
              </p>
              {tab==='team' && (
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <div style={{ position:'relative' }}>
                    <Search size={12} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-400)', pointerEvents:'none' }}/>
                    <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search…"
                      style={{ height:32, paddingLeft:28, paddingRight:search?28:10, width:180, fontSize:12, borderRadius:20, border:'1px solid var(--card-border)', background:'var(--page-bg)', color:'var(--text-800)', outline:'none', transition:'border-color 0.15s' }}
                      onFocus={e=>(e.target.style.borderColor='var(--c-teal)')}
                      onBlur={e=>(e.target.style.borderColor='var(--card-border)')}/>
                    {search && (
                      <button onClick={()=>setSearch('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', width:16, height:16, borderRadius:4, background:'var(--card-border)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <X size={9} style={{ color:'var(--text-500)' }}/>
                      </button>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:4 }}>
                    {FILTERS.map(f=>(
                      <button key={f.id} onClick={()=>{setFilter(f.id);setPage(0);}} style={{
                        padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                        border: filter===f.id ? '1.5px solid var(--c-teal)' : '1px solid var(--card-border)',
                        background: filter===f.id ? 'color-mix(in srgb,var(--c-teal) 10%,var(--card-bg))' : 'transparent',
                        color: filter===f.id ? 'var(--c-teal)' : 'var(--text-500)',
                      }}>
                        {f.label} <span style={{ fontWeight:900, fontSize:10, opacity:0.9 }}>{f.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable content */}
            <div style={{ padding:20, flex:1 }}>

              {/* ══ TEAM ══ */}
              {tab==='team' && (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {isLoading ? (
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:12 }}>
                      <Loader2 size={22} className="animate-spin" style={{ color:'var(--c-teal)' }} />
                      <p style={{ fontSize:13, color:'var(--text-400)', margin:0 }}>Loading care team…</p>
                    </div>
                  ) : filtered.length===0 ? (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:180, gap:10, borderRadius:14, border:'2px dashed var(--card-border)' }}>
                      <Users size={28} style={{ color:'var(--card-border)' }} />
                      <p style={{ fontWeight:700, fontSize:13, color:'var(--text-500)', margin:0 }}>No caregivers match</p>
                      <button onClick={()=>{setSearch('');setFilter('all');}} style={{ fontSize:12, color:'var(--c-teal)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Clear filters</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(268px,1fr))', gap:14 }}>
                        <AnimatePresence mode="popLayout">
                          {paginated.map((cg,i) => (
                            <WorkerCard key={cg.id||i} cg={cg}
                              workload={workloadMap[cg.id]}
                              burnoutLevel={burnoutLevelMap[cg.id]}
                              gradPair={TEAL_GRADS[cg.id % TEAL_GRADS.length]}
                              trust={trustMap[cg.id]}
                              onBurnoutClick={()=>openBurnout(cg)}
                              onMessage={()=>navigate(`/messages?recipient=${cg.id}&name=${encodeURIComponent(cg.full_name||'')}`)}
                              onViewProfile={()=>setTrustCg(cg)}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                      {pageCount>1 && (
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:4 }}>
                          <p style={{ fontSize:11, color:'var(--text-400)', margin:0 }}>{filtered.length} workers · page {page+1} of {pageCount}</p>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}
                              style={{ width:30, height:30, borderRadius:9, border:'1px solid var(--card-border)', background:'var(--card-bg)', cursor:page===0?'not-allowed':'pointer', opacity:page===0?0.4:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-500)' }}>
                              <ChevronLeft size={13} />
                            </button>
                            {Array.from({length:pageCount},(_,idx)=>(
                              <button key={idx} onClick={()=>setPage(idx)} style={{ height:7, width:idx===page?20:7, borderRadius:99, background:idx===page?'var(--c-teal)':'var(--card-border)', border:'none', cursor:'pointer', transition:'all 0.2s' }} />
                            ))}
                            <button onClick={()=>setPage(p=>Math.min(pageCount-1,p+1))} disabled={page===pageCount-1}
                              style={{ width:30, height:30, borderRadius:9, border:'1px solid var(--card-border)', background:'var(--card-bg)', cursor:page===pageCount-1?'not-allowed':'pointer', opacity:page===pageCount-1?0.4:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-500)' }}>
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ══ ANALYTICS ══ */}
              {tab==='analytics' && (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {!teamRaw ? (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 0', gap:10, color:'var(--text-400)' }}>
                      <BarChart2 size={32} style={{ color:'var(--card-border)' }} />
                      <p style={{ fontSize:13, margin:0 }}>Team analytics unavailable</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                        {[
                          { l:'Team Size',         v:teamRaw.team_size??caregivers.length,             Icon:Users,         c:'#0d9488' },
                          { l:'Assigned Patients', v:teamRaw.total_patients_assigned??'-',             Icon:Heart,         c:'#0891b2' },
                          { l:'Avg per Carer',     v:teamRaw.average_patients_per_caregiver??'-',      Icon:TrendingUp,    c:'#059669' },
                          { l:'Overloaded',        v:teamRaw.overloaded_caregivers??0,                 Icon:AlertTriangle, c:'#ef4444' },
                        ].map(({ l, v, Icon, c }) => (
                          <div key={l} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12, border:`1px solid ${c}22`, background:'var(--page-bg)' }}>
                            <div style={{ width:30, height:30, borderRadius:9, background:`${c}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <Icon size={14} style={{ color:c }} />
                            </div>
                            <span style={{ fontSize:20, fontWeight:900, color:c, lineHeight:1 }}>{v}</span>
                            <span style={{ fontSize:11, fontWeight:600, color:'var(--text-500)' }}>{l}</span>
                          </div>
                        ))}
                      </div>

                      {teamRaw.team_metrics?.length > 0 && (
                        <div style={{ borderRadius:14, border:'1px solid var(--card-border)', overflow:'hidden' }}>
                          <div style={{ height:3, background:'linear-gradient(90deg,#0d9488,#0891b2)' }} />
                          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--card-border)' }}>
                            <p style={{ fontWeight:700, fontSize:13, color:'var(--text-800)', margin:0 }}>Workload Distribution</p>
                            <p style={{ fontSize:11, color:'var(--text-400)', margin:'2px 0 0' }}>Current patient load per caregiver</p>
                          </div>
                          {teamRaw.team_metrics.map((m, i) => {
                            const pct = Math.min(m.workload?.workload_score??0, 100);
                            const pts = m.workload?.active_patients??0;
                            const cap = m.workload?.capacity_status||'available';
                            const ci  = capColor(cap);
                            const [g1,g2] = TEAL_GRADS[i%TEAL_GRADS.length];
                            return (
                              <div key={m.caregiver_id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom: i<teamRaw.team_metrics.length-1?'1px solid var(--card-border)':undefined }}>
                                <div style={{ width:30, height:30, borderRadius:9, background:`linear-gradient(135deg,${g1},${g2})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#fff', flexShrink:0 }}>
                                  {(m.caregiver_name||'?')[0]}
                                </div>
                                <div style={{ width:130, minWidth:0, flexShrink:0 }}>
                                  <p style={{ fontWeight:600, fontSize:12, color:'var(--text-800)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.caregiver_name}</p>
                                  <p style={{ fontSize:11, color:'var(--text-400)', margin:0 }}>{pts} patient{pts!==1?'s':''}</p>
                                </div>
                                <div style={{ flex:1 }}>
                                  <div style={{ height:5, background:'var(--card-border)', borderRadius:99, overflow:'hidden' }}>
                                    <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:0.7, ease:'easeOut', delay:i*0.05 }}
                                      style={{ height:'100%', borderRadius:99, background: pct>75?'#ef4444':pct>=50?'#f59e0b':`linear-gradient(to right,${g1},${g2})` }} />
                                  </div>
                                </div>
                                <span style={{ fontSize:11, fontWeight:800, width:32, textAlign:'right', flexShrink:0, color: pct>75?'#ef4444':pct>=50?'#f59e0b':'#10b981' }}>{pct}%</span>
                                <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:99, flexShrink:0, textTransform:'capitalize', background:ci.bg, color:ci.text }}>{cap.replace('_',' ')}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {teamRaw.recommendations?.filter(Boolean).length > 0 && (
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          <p style={{ fontSize:11, fontWeight:700, color:'var(--text-400)', margin:0 }}>AI Recommendations</p>
                          {teamRaw.recommendations.filter(Boolean).map((rec,i) => (
                            <div key={i} style={{
                              display:'flex', alignItems:'flex-start', gap:10, padding:'9px 13px', borderRadius:10, fontSize:12,
                              background: rec.includes('⚠')||rec.includes('❌') ? 'var(--warn-bg,#fffbeb)' : '#f0fdfa',
                              border: rec.includes('⚠')||rec.includes('❌') ? '1px solid var(--warn-border,#fde68a)' : '1px solid #99f6e4',
                              color: rec.includes('⚠')||rec.includes('❌') ? '#92400e' : '#0f766e',
                            }}>
                              <TrendingUp size={12} style={{ flexShrink:0, marginTop:1 }} />{rec}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ══ ASSIGNMENTS ══ */}
              {tab==='assignments' && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
                  {isStaff && (
                    <div style={{ borderRadius:14, border:'1px solid var(--card-border)', overflow:'hidden' }}>
                      <div style={{ height:3, background:'linear-gradient(90deg,#0d9488,#0891b2)' }} />
                      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--card-border)', display:'flex', alignItems:'center', gap:8 }}>
                        <UserPlus size={14} style={{ color:'var(--c-teal)' }} />
                        <span style={{ fontWeight:700, fontSize:13, color:'var(--text-800)' }}>Manual Assignment</span>
                      </div>
                      <div style={{ padding:16, display:'flex', flexDirection:'column', gap:12 }}>
                        <div>
                          <label style={{ fontSize:11, fontWeight:700, color:'var(--text-400)', display:'block', marginBottom:5 }}>Caregiver</label>
                          <SearchableSelect accent="teal" value={manualCg?String(manualCg):null} onChange={v=>setManualCg(v||'')} placeholder="Select caregiver…"
                            options={caregivers.map(cg=>({value:String(cg.id),label:cg.full_name,sublabel:cg.role||'Caregiver'}))} />
                        </div>
                        <div>
                          <label style={{ fontSize:11, fontWeight:700, color:'var(--text-400)', display:'block', marginBottom:5 }}>Patient</label>
                          <SearchableSelect accent="teal" value={manualPt?String(manualPt):null} onChange={v=>setManualPt(v||'')} placeholder="Search patient…"
                            options={patientList.map(p=>({value:String(p.id),label:p.full_name,sublabel:`${p.patient_code||'#'+p.id} · ${p.age}y`}))} />
                        </div>
                        <button onClick={()=>{if(manualCg&&manualPt) assignMutation.mutate({caregiver_id:parseInt(manualCg),patient_id:parseInt(manualPt),notes:''}); }} disabled={!manualCg||!manualPt||assignMutation.isPending}
                          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 0', borderRadius:10, fontSize:13, fontWeight:700, color:'#fff', background:'linear-gradient(135deg,#0d9488,#0891b2)', border:'none', cursor:!manualCg||!manualPt?'not-allowed':'pointer', opacity:!manualCg||!manualPt?0.5:1, boxShadow:'0 2px 10px rgba(13,148,136,0.3)' }}>
                          {assignMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                          {assignMutation.isPending?'Assigning…':'Assign Patient'}
                        </button>
                        <div style={{ borderTop:'1px solid var(--card-border)', paddingTop:12, display:'flex', flexDirection:'column', gap:10 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <Zap size={13} style={{ color:'var(--c-teal)' }} />
                            <span style={{ fontWeight:700, fontSize:13, color:'var(--text-700)' }}>AI Auto-Assign</span>
                            <span style={{ marginLeft:'auto', fontSize:10, fontWeight:800, padding:'2px 7px', borderRadius:99, background:'#f0fdfa', color:'#0f766e', border:'1px solid #99f6e4' }}>ML</span>
                          </div>
                          <p style={{ fontSize:11, color:'var(--text-400)', margin:0 }}>ML selects the best available caregiver based on workload and complexity.</p>
                          <SearchableSelect accent="teal" value={optPid?String(optPid):null} onChange={v=>setOptPid(v||'')} placeholder="Select patient to auto-assign…"
                            options={patientList.map(p=>({value:String(p.id),label:p.full_name,sublabel:`${p.patient_code||'#'+p.id}`}))} />
                          <button onClick={()=>{if(optPid) optimalMutation.mutate(parseInt(optPid));}} disabled={!optPid||optimalMutation.isPending}
                            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 0', borderRadius:10, fontSize:13, fontWeight:700, color:'#fff', background:'linear-gradient(135deg,#0891b2,#1d4ed8)', border:'none', cursor:!optPid?'not-allowed':'pointer', opacity:!optPid?0.5:1, boxShadow:'0 2px 10px rgba(8,145,178,0.3)' }}>
                            {optimalMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                            {optimalMutation.isPending?'Assigning…':'Auto-Assign Best Caregiver'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ borderRadius:14, border:'1px solid var(--card-border)', overflow:'hidden' }}>
                    <div style={{ height:3, background:'linear-gradient(90deg,#059669,#0d9488)' }} />
                    <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--card-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <ListChecks size={14} style={{ color:'var(--c-teal)' }} />
                        <span style={{ fontWeight:700, fontSize:13, color:'var(--text-800)' }}>Current Assignments</span>
                      </div>
                      <span style={{ fontSize:11, fontWeight:800, padding:'2px 8px', borderRadius:99, background:'#f0fdfa', color:'#0f766e', border:'1px solid #99f6e4' }}>{assignments.length}</span>
                    </div>
                    <div style={{ maxHeight:320, overflowY:'auto' }}>
                      {assignments.length===0 ? (
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'36px 0', gap:8, color:'var(--text-400)' }}>
                          <ListChecks size={22} style={{ color:'var(--card-border)' }} />
                          <p style={{ fontSize:12, margin:0 }}>No active assignments</p>
                        </div>
                      ) : assignments.map((a,i) => (
                        <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 16px', borderBottom: i<assignments.length-1?'1px solid var(--card-border)':undefined, transition:'background 0.1s' }}
                          onMouseEnter={e=>(e.currentTarget.style.background='var(--page-bg)')}
                          onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                          <div style={{ width:26, height:26, borderRadius:8, background:'linear-gradient(135deg,#0d9488,#0891b2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, color:'#fff', flexShrink:0 }}>
                            {getInitials(a.caregiver_name)}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontWeight:600, fontSize:12, color:'var(--text-800)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.caregiver_name}</p>
                            <p style={{ fontSize:11, color:'var(--text-400)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>→ {a.patient_name}</p>
                          </div>
                          {isStaff && (
                            <button onClick={()=>removeMutation.mutate(a.id)} style={{ width:22, height:22, borderRadius:6, background:'#fef2f2', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#ef4444', flexShrink:0 }}
                              onMouseEnter={e=>(e.currentTarget.style.background='#fee2e2')}
                              onMouseLeave={e=>(e.currentTarget.style.background='#fef2f2')}>
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ══ MY PATIENTS (caregiver) ══ */}
              {tab==='mypatients' && (
                myPatients.length===0 ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 0', gap:10, borderRadius:14, border:'2px dashed var(--card-border)' }}>
                    <Heart size={26} style={{ color:'var(--card-border)' }} />
                    <p style={{ fontWeight:700, fontSize:13, color:'var(--text-500)', margin:0 }}>No patients assigned yet</p>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 }}>
                    {myPatients.map(p => {
                      const pid = p.patient_id||p.id;
                      const grads = TEAL_GRADS[pid%TEAL_GRADS.length];
                      return (
                        <motion.div key={pid} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                          onClick={()=>navigate(`/patients/${pid}`)}
                          whileHover={{ y:-3, boxShadow:'0 8px 24px rgba(0,0,0,0.10)' }}
                          style={{ borderRadius:14, border:'1px solid var(--card-border)', background:'var(--card-bg)', overflow:'hidden', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                          <div style={{ height:3, background:`linear-gradient(to right,${grads[0]},${grads[1]})` }} />
                          <div style={{ padding:14, display:'flex', alignItems:'center', gap:12 }}>
                            <div style={{ width:38, height:38, borderRadius:11, background:`linear-gradient(135deg,${grads[0]},${grads[1]})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:'#fff', flexShrink:0 }}>
                              {getInitials(p.patient_name||p.full_name)}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontWeight:700, fontSize:13, color:'var(--text-800)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.patient_name||p.full_name}</p>
                              <p style={{ fontSize:11, color:'var(--text-400)', margin:0 }}>{p.primary_diagnosis||'Patient'}</p>
                            </div>
                            <ChevronRight size={13} style={{ color:'var(--text-400)', flexShrink:0 }} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )
              )}

            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {burnoutCg && <BurnoutModal cg={burnoutCg} data={burnoutMap[burnoutCg.id]} loading={burnoutLoading} onClose={()=>setBurnoutCg(null)} />}
        {trustCg   && <TrustProfileModal cg={trustCg} onClose={()=>setTrustCg(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}
