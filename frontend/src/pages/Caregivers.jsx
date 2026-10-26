import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, HeartHandshake, AlertTriangle, Search, X,
  UserPlus, Phone, Mail, Zap, Heart, Trash2,
  Loader2, Brain, ChevronLeft, ChevronRight,
  TrendingUp, BarChart2, ListChecks, CheckCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { caregiversAPI, caregiverIntelligenceAPI, advancedMlAPI, patientsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import toast from '../utils/toast';
import SearchableSelect from '../components/ui/SearchableSelect';

/* ── constants ──────────────────────────────────────────────────────────── */
const GRAD = [
  'from-violet-500 to-purple-700', 'from-teal-500 to-emerald-600',
  'from-blue-500 to-indigo-700',   'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',  'from-cyan-500 to-sky-600',
  'from-fuchsia-500 to-pink-700',  'from-lime-500 to-green-600',
];
const PAGE_SIZE = 9;
const getInitials = n => n ? n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() : '?';
const wbColor = p => p > 75 ? 'bg-red-500' : p >= 50 ? 'bg-amber-400' : 'bg-emerald-500';
const wbText  = p => p > 75 ? 'text-red-600' : p >= 50 ? 'text-amber-600' : 'text-emerald-600';

/* ── BurnoutBadge ───────────────────────────────────────────────────────── */
function BurnoutBadge({ level }) {
  const l = String(level || 'low').toLowerCase();
  if (l === 'critical') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white"><span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse"/>Critical</span>;
  if (l === 'high')     return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-white"><span className="w-1.5 h-1.5 rounded-full bg-white/70"/>High Risk</span>;
  if (l === 'moderate') return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-white">Moderate</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>Healthy</span>;
}

/* PatientPicker replaced by SearchableSelect */

/* ── CaregiverCard ──────────────────────────────────────────────────────── */
function CaregiverCard({ cg, workload, burnoutLevel, avatarGrad, onBurnoutClick }) {
  const activePatients = workload?.active_patients ?? 0;
  const workloadPct    = Math.min(workload?.workload_score ?? 0, 100);
  const capStatus      = workload?.capacity_status || 'available';
  const bl = String(burnoutLevel || 'low').toLowerCase();

  const borderL = bl==='critical' ? 'border-l-red-500' : bl==='high' ? 'border-l-orange-400' : bl==='moderate' ? 'border-l-amber-400' : 'border-l-teal-400';
  const ringC   = bl==='critical' ? 'ring-red-400'     : bl==='high' ? 'ring-orange-400'     : bl==='moderate' ? 'ring-amber-400'     : 'ring-teal-400';

  return (
    <motion.div layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
      className={`border-l-4 ${borderL} bg-white rounded-r-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200`}>
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white font-black text-sm shadow-md ring-2 ring-offset-1 ${ringC} flex-shrink-0`}>
            {getInitials(cg.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-sm truncate">{cg.full_name}</p>
            <p className="text-[11px] text-slate-500">{cg.role || 'Caregiver'}</p>
            <div className="mt-1.5"><BurnoutBadge level={bl}/></div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-black tabular-nums text-violet-700 leading-none">{activePatients}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">patients</p>
          </div>
        </div>
        {/* Workload */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workload</span>
            <span className={`text-[10px] font-black tabular-nums ${wbText(workloadPct)}`}>
              {workloadPct}% · <span className="font-semibold text-slate-500 capitalize">{capStatus.replace('_',' ')}</span>
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div className={`h-full rounded-full ${wbColor(workloadPct)}`}
              initial={{width:0}} animate={{width:`${workloadPct}%`}} transition={{duration:0.7,ease:'easeOut'}}/>
          </div>
        </div>
        {/* Contact */}
        <div className="space-y-0.5">
          {cg.email && <p className="flex items-center gap-1.5 text-xs text-slate-500 truncate"><Mail size={11} className="text-slate-400 flex-shrink-0"/>{cg.email}</p>}
          {cg.phone && <p className="flex items-center gap-1.5 text-xs text-slate-500"><Phone size={11} className="text-slate-400 flex-shrink-0"/>{cg.phone}</p>}
        </div>
        {/* AI button */}
        <button onClick={onBurnoutClick}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs border border-violet-200 transition-all">
          <Brain size={11}/> AI Burnout Analysis
        </button>
      </div>
    </motion.div>
  );
}

/* ── BurnoutModal ───────────────────────────────────────────────────────── */
function BurnoutModal({ cg, data, loading, onClose }) {
  if (!cg) return null;
  const pct   = data ? Math.round((data.burnout_score ?? 0) * 100) : 0;
  const level = data?.burnout_level || 'low';
  const ringCls = level==='critical'?'bg-red-500':level==='high'?'bg-orange-500':level==='moderate'?'bg-amber-400':'bg-emerald-500';
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{opacity:0,scale:0.94,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.94}}
        transition={{type:'spring',damping:28,stiffness:380}}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700" style={{borderLeft:'4px solid #7c3aed'}}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 flex items-center justify-center text-violet-700 dark:text-violet-300 font-black text-sm">{getInitials(cg.full_name)}</div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{cg.full_name}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">AI Burnout Analysis · {cg.role||'Caregiver'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"><X size={15}/></button>
        </div>
        <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {loading && <div className="flex flex-col items-center py-14 gap-3"><Loader2 size={28} className="animate-spin text-violet-500"/><p className="text-sm text-slate-500 font-medium">Analysing burnout risk…</p></div>}
          {!loading && !data && <div className="flex flex-col items-center py-14 gap-2 text-slate-400"><Brain size={36} className="text-slate-300"/><p className="text-sm font-medium">No burnout data available</p></div>}
          {!loading && data && (
            <>
              <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className={`w-16 h-16 rounded-2xl ${ringCls} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <p className="text-white font-black text-xl tabular-nums">{pct}%</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-base capitalize">{level} Risk</p>
                  <p className="text-xs text-slate-500">ML burnout probability</p>
                  <BurnoutBadge level={level}/>
                </div>
              </div>
              {data.signals?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Risk Signals</p>
                  <div className="space-y-2">
                    {data.signals.map((s,i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                        <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5"/>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800">{s.signal}</p>
                          {s.value && <p className="text-[11px] text-slate-500 mt-0.5">{s.value}</p>}
                        </div>
                        {s.severity && <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 ${s.severity==='critical'?'bg-red-600 text-white':s.severity==='warning'?'bg-amber-500 text-white':'bg-slate-200 text-slate-600'}`}>{s.severity}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!data.signals||data.signals.length===0) && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle size={18} className="text-emerald-600 flex-shrink-0"/>
                  <p className="text-sm font-semibold text-emerald-800">No burnout signals detected</p>
                </div>
              )}
              {data.recommendations?.filter(Boolean).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Recommendations</p>
                  <div className="space-y-2">
                    {data.recommendations.filter(Boolean).map((rec,i) => (
                      <div key={i} className="flex items-start gap-2 text-sm px-3 py-2.5 rounded-xl bg-violet-50 border border-violet-100 text-violet-800">
                        <TrendingUp size={13} className="flex-shrink-0 mt-0.5 text-violet-600"/>{rec}
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

/* ══════════════════════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════════════════════ */
export default function Caregivers() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const qc          = useQueryClient();
  const isStaff     = user?.role === 'clinician' || user?.role === 'admin';
  const isCaregiver = user?.role === 'caregiver';

  const [tab,            setTab]            = useState('team');
  const [search,         setSearch]         = useState('');
  const [filter,         setFilter]         = useState('all');
  const [page,           setPage]           = useState(0);
  const [burnoutCg,      setBurnoutCg]      = useState(null);
  const [burnoutMap,     setBurnoutMap]     = useState({});
  const [burnoutLoading, setBurnoutLoading] = useState(false);
  const [optPid,         setOptPid]         = useState('');
  const [manualCg,       setManualCg]       = useState('');
  const [manualPt,       setManualPt]       = useState('');

  useEffect(() => { setPage(0); }, [search, filter]);

  /* ── queries ── */
  const { data: cgRaw,   isLoading } = useQuery({ queryKey:['caregivers-all'], queryFn:()=>caregiversAPI.getAll().then(r=>r.data),                          staleTime:5*60*1000, retry:false });
  const { data: assnRaw }            = useQuery({ queryKey:['cg-assignments'], queryFn:()=>caregiversAPI.getAssignments().then(r=>r.data),                  enabled:isStaff,     staleTime:3*60*1000, retry:false });
  const { data: myPtsRaw }           = useQuery({ queryKey:['cg-my-patients'], queryFn:()=>caregiverIntelligenceAPI.getMyPatients().then(r=>r.data),         enabled:isCaregiver, staleTime:3*60*1000, retry:false });
  const { data: teamRaw }            = useQuery({ queryKey:['cg-team'],        queryFn:()=>caregiverIntelligenceAPI.getTeamOverview().then(r=>r.data),                            staleTime:5*60*1000, retry:false });
  const { data: burnoutRaw }         = useQuery({ queryKey:['cg-burnout'],     queryFn:()=>advancedMlAPI.getAllCaregiverBurnout().then(r=>r.data),                                 staleTime:10*60*1000,retry:false });
  const { data: patientsRaw }        = useQuery({ queryKey:['patients-list'],  queryFn:()=>patientsAPI.getAll().then(r=>r.data),                            enabled:isStaff,     staleTime:5*60*1000  });

  /* ── normalise ── */
  const caregivers  = Array.isArray(cgRaw)             ? cgRaw             : cgRaw?.caregivers   || [];
  const assignments = Array.isArray(assnRaw)            ? assnRaw           : assnRaw?.assignments || [];
  const myPatients  = Array.isArray(myPtsRaw?.patients) ? myPtsRaw.patients : [];
  const burnoutList = Array.isArray(burnoutRaw)          ? burnoutRaw        : burnoutRaw?.caregivers || [];
  const patientList = Array.isArray(patientsRaw)         ? patientsRaw       : patientsRaw?.patients  || [];

  /* ── derived ── */
  const workloadMap = useMemo(() => {
    const m = {};
    (teamRaw?.team_metrics || []).forEach(tm => { m[tm.caregiver_id] = tm.workload; });
    return m;
  }, [teamRaw]);

  const burnoutLevelMap = useMemo(() => {
    const m = {};
    burnoutList.forEach(b => { const id = b.caregiver_id||b.user_id; if(id) m[id] = String(b.burnout_level||b.risk_level||'low').toLowerCase(); });
    return m;
  }, [burnoutList]);

  const burnoutAlerts = Object.values(burnoutLevelMap).filter(l => l==='critical'||l==='high').length;
  const overloaded    = Object.values(workloadMap).filter(w => w?.capacity_status==='overloaded').length;

  const FILTERS = [
    { id:'all',        label:'All',        count: caregivers.length },
    { id:'burnout',    label:'Burnout',    count: burnoutAlerts },
    { id:'overloaded', label:'Overloaded', count: overloaded },
    { id:'available',  label:'Available',  count: caregivers.length - overloaded },
  ];

  const filtered = useMemo(() => caregivers.filter(cg => {
    if (search) {
      const s = search.toLowerCase();
      if (!(cg.full_name||'').toLowerCase().includes(s) && !(cg.role||'').toLowerCase().includes(s) && !(cg.email||'').toLowerCase().includes(s)) return false;
    }
    const wl = workloadMap[cg.id] || {};
    const bl = burnoutLevelMap[cg.id] || 'low';
    if (filter==='burnout')    return ['critical','high','moderate'].includes(bl);
    if (filter==='overloaded') return wl.capacity_status === 'overloaded';
    if (filter==='available')  return wl.capacity_status !== 'overloaded';
    return true;
  }), [caregivers, search, filter, workloadMap, burnoutLevelMap]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  /* ── mutations ── */
  const assignMutation = useMutation({
    mutationFn: d => caregiversAPI.assign(d),
    onSuccess: () => { toast.success('Patient assigned'); setManualCg(''); setManualPt(''); qc.invalidateQueries(['cg-assignments']); qc.invalidateQueries(['cg-team']); },
    onError: e => toast.error(e?.response?.data?.detail || 'Assignment failed'),
  });
  const removeMutation = useMutation({
    mutationFn: id => caregiversAPI.removeAssignment(id),
    onSuccess: () => { toast.success('Assignment removed'); qc.invalidateQueries(['cg-assignments']); },
    onError: () => toast.error('Failed to remove'),
  });
  const optimalMutation = useMutation({
    mutationFn: pid => caregiverIntelligenceAPI.assignOptimal(pid),
    onSuccess: d => { toast.success(`AI assigned ${d?.data?.caregiver_name||'caregiver'}`); setOptPid(''); qc.invalidateQueries(['cg-assignments']); qc.invalidateQueries(['cg-team']); },
    onError: e => toast.error(e?.response?.data?.detail || 'Auto-assign failed'),
  });

  const openBurnout = useCallback((cg) => {
    setBurnoutCg(cg);
    if (!burnoutMap[cg.id]) {
      setBurnoutLoading(true);
      advancedMlAPI.getCaregiverBurnout(cg.id)
        .then(r => { setBurnoutMap(m => ({...m,[cg.id]:r.data})); setBurnoutLoading(false); })
        .catch(() => setBurnoutLoading(false));
    }
  }, [burnoutMap]);

  const filterColor = (id, active) => {
    if (!active) return 'bg-slate-100 text-slate-600 hover:bg-slate-200';
    if (id==='burnout')    return 'bg-red-600 text-white';
    if (id==='overloaded') return 'bg-amber-500 text-white';
    if (id==='available')  return 'bg-emerald-600 text-white';
    return 'bg-violet-600 text-white';
  };

  /* ── tab definitions ── */
  const TABS = [
    { id:'team',        label:'Team',        Icon:Users      },
    { id:'analytics',   label:'Analytics',   Icon:BarChart2  },
    { id:'assignments', label:'Assignments', Icon:ListChecks },
    ...(isCaregiver ? [{ id:'mypatients', label:'My Patients', Icon:Heart }] : []),
  ];

  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.2}}
      className="min-h-screen pb-10 space-y-5">

      <PageHeader image="/resources/african/african-caregiver.jpg" title="Care Team"
        subtitle="Caregiver management · workload intelligence · AI burnout analysis" icon={HeartHandshake}/>

      {/* Burnout banner */}
      {burnoutAlerts > 0 && (
        <div className="px-6">
          <div className="border-l-4 border-l-red-500 bg-red-50 border border-red-200 rounded-r-xl p-3.5 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5"/>
            <div>
              <p className="font-bold text-red-900 text-sm">{burnoutAlerts} Caregiver{burnoutAlerts>1?'s':''} at Burnout Risk</p>
              {burnoutList.filter(b=>['critical','high'].includes(String(b.burnout_level||b.risk_level||'').toLowerCase())).map((b,i)=>(
                <p key={i} className="text-xs text-red-700 mt-0.5"><strong>{b.caregiver_name||b.name}</strong> — {b.burnout_level||b.risk_level} risk</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab bar ── */}
      <div className="px-6">
        <div className="flex border-b border-slate-200 gap-0">
          {TABS.map(({id,label,Icon}) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap
                ${tab===id ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
              <Icon size={15}/>{label}
              {id==='team' && <span className={`text-[10px] font-black px-1.5 rounded-full tabular-nums ${tab===id?'bg-violet-100 text-violet-700':'bg-slate-100 text-slate-500'}`}>{caregivers.length}</span>}
              {id==='assignments' && assignments.length > 0 && <span className={`text-[10px] font-black px-1.5 rounded-full tabular-nums ${tab===id?'bg-violet-100 text-violet-700':'bg-slate-100 text-slate-500'}`}>{assignments.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ══ TAB: TEAM ══ */}
      {tab === 'team' && (
        <div className="px-6 space-y-3">
          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, role or email…"
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none text-sm shadow-sm"/>
              {search && <button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-slate-100 hover:bg-red-100 flex items-center justify-center"><X size={11} className="text-slate-500"/></button>}
            </div>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-1.5 py-1 shadow-sm flex-shrink-0">
              {FILTERS.map(f => (
                <button key={f.id} onClick={()=>setFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterColor(f.id, filter===f.id)}`}>
                  {f.label}
                  <span className={`text-[10px] font-black px-1 rounded-full tabular-nums ${filter===f.id?'bg-white/25 text-current':'bg-slate-200 text-slate-500'}`}>{f.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64 gap-3">
              <Loader2 size={26} className="animate-spin text-violet-400"/>
              <p className="text-sm text-slate-500 font-medium">Loading care team…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300 h-64 gap-3 shadow-sm">
              <Users size={36} className="text-slate-300"/>
              <p className="font-bold text-slate-500">No caregivers match</p>
              <button onClick={()=>{setSearch('');setFilter('all');}} className="text-xs text-violet-600 hover:underline font-semibold">Clear filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                <AnimatePresence mode="popLayout">
                  {paginated.map((cg,i) => (
                    <CaregiverCard key={cg.id||i}
                      cg={cg} workload={workloadMap[cg.id]} burnoutLevel={burnoutLevelMap[cg.id]}
                      avatarGrad={GRAD[(page*PAGE_SIZE+i)%GRAD.length]}
                      onBurnoutClick={()=>openBurnout(cg)}/>
                  ))}
                </AnimatePresence>
              </div>
              {pageCount > 1 && (
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-slate-400">{filtered.length} caregivers · page {page+1} of {pageCount}</p>
                  <div className="flex items-center gap-1.5">
                    <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}
                      className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:border-violet-400 disabled:opacity-40 flex items-center justify-center text-slate-500 shadow-sm transition-all">
                      <ChevronLeft size={14}/>
                    </button>
                    {Array.from({length:pageCount},(_,idx)=>(
                      <button key={idx} onClick={()=>setPage(idx)}
                        className={`h-2 rounded-full transition-all duration-200 ${idx===page?'w-6 bg-violet-600':'w-2 bg-slate-300 hover:bg-violet-400'}`}/>
                    ))}
                    <button onClick={()=>setPage(p=>Math.min(pageCount-1,p+1))} disabled={page===pageCount-1}
                      className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:border-violet-400 disabled:opacity-40 flex items-center justify-center text-slate-500 shadow-sm transition-all">
                      <ChevronRight size={14}/>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══ TAB: ANALYTICS ══ */}
      {tab === 'analytics' && (
        <div className="px-6 space-y-6">
          {!teamRaw ? (
            <div className="flex flex-col items-center py-20 gap-3 text-slate-400">
              <BarChart2 size={40} className="text-slate-300"/>
              <p className="font-medium">Team analytics unavailable</p>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              {/* Compact stat strip */}
              <div className="flex flex-wrap gap-2">
                {[
                  { l:'Team Size',        v: teamRaw.team_size ?? caregivers.length,          icon: Users,         cls:'border-violet-300 text-violet-700 bg-violet-50' },
                  { l:'Assigned Patients',v: teamRaw.total_patients_assigned ?? '—',          icon: Heart,         cls:'border-teal-300 text-teal-700 bg-teal-50'       },
                  { l:'Avg per Carer',    v: teamRaw.average_patients_per_caregiver ?? '—',   icon: TrendingUp,    cls:'border-blue-300 text-blue-700 bg-blue-50'       },
                  { l:'Overloaded',       v: teamRaw.overloaded_caregivers ?? 0,               icon: AlertTriangle, cls:'border-red-300 text-red-700 bg-red-50'          },
                ].map(({l,v,icon:Icon,cls}) => (
                  <div key={l} className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border ${cls}`}>
                    <Icon size={14} className="opacity-70 flex-shrink-0"/>
                    <span className="text-xl font-black tabular-nums leading-none">{v}</span>
                    <span className="text-xs font-semibold opacity-80">{l}</span>
                  </div>
                ))}
              </div>

              {/* Workload distribution table */}
              {teamRaw.team_metrics?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Workload Distribution</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Current patient load per caregiver</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {teamRaw.team_metrics.map((m, i) => {
                      const pct = Math.min(m.workload?.workload_score ?? 0, 100);
                      const pts = m.workload?.active_patients ?? 0;
                      const cap = m.workload?.capacity_status || 'available';
                      const capBadge = cap==='overloaded' ? 'bg-red-100 text-red-700' : cap==='at_capacity' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
                      return (
                        <div key={m.caregiver_id} className="flex items-center gap-4 px-5 py-3.5">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${GRAD[i%GRAD.length]} flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0 shadow-sm`}>
                            {(m.caregiver_name||'?')[0]}
                          </div>
                          <div className="w-40 min-w-0 flex-shrink-0">
                            <p className="font-semibold text-slate-800 text-sm truncate">{m.caregiver_name}</p>
                            <p className="text-xs text-slate-400">{pts} patient{pts!==1?'s':''}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div className={`h-full rounded-full ${wbColor(pct)}`}
                                initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.7,ease:'easeOut',delay:i*0.05}}/>
                            </div>
                          </div>
                          <span className={`text-xs font-black tabular-nums w-10 text-right flex-shrink-0 ${wbText(pct)}`}>{pct}%</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 capitalize ${capBadge}`}>{cap.replace('_',' ')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {teamRaw.recommendations?.filter(Boolean).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Recommendations</p>
                  {teamRaw.recommendations.filter(Boolean).map((rec,i) => (
                    <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm
                      ${rec.includes('⚠')||rec.includes('❌') ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                      <TrendingUp size={14} className="flex-shrink-0 mt-0.5"/>{rec}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══ TAB: ASSIGNMENTS ══ */}
      {tab === 'assignments' && (
        <div className="px-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">

            {/* Manual assign form */}
            {isStaff && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <UserPlus size={16} className="text-violet-500"/>
                  <h3 className="font-bold text-slate-800">Manual Assignment</h3>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Caregiver</label>
                    <SearchableSelect
                      accent="violet"
                      value={manualCg ? String(manualCg) : null}
                      onChange={v => setManualCg(v || '')}
                      placeholder="Select caregiver…"
                      options={caregivers.map(cg => ({
                        value: String(cg.id),
                        label: cg.full_name,
                        sublabel: cg.role || 'Caregiver',
                        avatar: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Patient</label>
                    <SearchableSelect
                      accent="violet"
                      value={manualPt ? String(manualPt) : null}
                      onChange={v => setManualPt(v || '')}
                      placeholder="Search patient…"
                      options={patientList.map(p => ({
                        value: String(p.id),
                        label: p.full_name,
                        sublabel: `${p.patient_code || '#'+p.id} · ${p.age}y`,
                        avatar: 'linear-gradient(135deg,#7c3aed,#4338ca)',
                      }))}
                    />
                  </div>
                  <button
                    onClick={() => { if(manualCg&&manualPt) assignMutation.mutate({caregiver_id:parseInt(manualCg),patient_id:parseInt(manualPt),notes:''}); }}
                    disabled={!manualCg||!manualPt||assignMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all shadow-sm">
                    {assignMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <UserPlus size={14}/>}
                    {assignMutation.isPending ? 'Assigning…' : 'Assign Patient'}
                  </button>
                </div>

                {/* AI Auto-Assign */}
                <div className="border-t border-slate-100 px-5 py-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-violet-500"/>
                    <h4 className="font-bold text-slate-700 text-sm">AI Auto-Assign</h4>
                    <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">🧠 ML</span>
                  </div>
                  <p className="text-xs text-slate-500">ML selects the best available caregiver based on workload and patient complexity.</p>
                  <SearchableSelect
                    accent="violet"
                    value={optPid ? String(optPid) : null}
                    onChange={v => setOptPid(v || '')}
                    placeholder="Select patient to auto-assign…"
                    options={patientList.map(p => ({
                      value: String(p.id),
                      label: p.full_name,
                      sublabel: `${p.patient_code || '#'+p.id} · ${p.age}y`,
                      avatar: 'linear-gradient(135deg,#7c3aed,#4338ca)',
                    }))}
                  />
                  <button
                    onClick={() => optPid && optimalMutation.mutate(parseInt(optPid))}
                    disabled={!optPid||optimalMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-7et-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all shadow-sm">
                    {optimalMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <Zap size={14}/>}
                    {optimalMutation.isPending ? 'Finding best match…' : 'Auto-Assign'}
                  </button>
                </div>
              </div>
            )}

            {/* Active assignments list */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks size={16} className="text-violet-500"/>
                  <h3 className="font-bold text-slate-800">Active Assignments</h3>
                </div>
                <span className="text-xs font-bold text-slate-400">{assignments.length} total</span>
              </div>
              {assignments.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3 text-slate-400">
                  <ListChecks size={36} className="text-slate-300"/>
                  <p className="font-medium text-sm">No active assignments</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                  {assignments.map((a,i) => (
                    <motion.div key={a.id||i} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}}
                      className="flex items-center gap-3 px-5 py-3.5 group hover:bg-slate-50 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                        {(a.patient_name||'?')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{a.patient_name||a.patient_code||`Patient #${a.patient_id}`}</p>
                        <p className="text-xs text-slate-400 truncate flex items-center gap-1"><UserPlus size={9}/>{a.caregiver_name||`Caregiver #${a.caregiver_id}`}</p>
                      </div>
                      {isStaff && (
                        <button onClick={()=>removeMutation.mutate(a.id)} disabled={removeMutation.isPending}
                          className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-all disabled:opacity-50 flex-shrink-0">
                          <Trash2 size={13}/>
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: MY PATIENTS (caregiver) ══ */}
      {tab === 'mypatients' && (
        <div className="px-6">
          {myPatients.length === 0 ? (
            <div className="flex flex-col items-center py-20 gap-3 text-slate-400">
              <Heart size={40} className="text-slate-300"/>
              <p className="font-medium">No patients assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {myPatients.map((p,i) => {
                const pid = p.id||p.patient_id;
                const rl = p.risk_level||'Stable';
                const rc = rl==='Crisis'?'text-red-700 bg-red-50 border-red-200':rl==='High'?'text-amber-700 bg-amber-50 border-amber-200':'text-emerald-700 bg-emerald-50 border-emerald-200';
                return (
                  <motion.div key={pid} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                    onClick={()=>navigate(`/patients/${pid}`)}
                    className="bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer hover:shadow-md hover:border-teal-300 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRAD[i%GRAD.length]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {getInitials(p.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{p.full_name}</p>
                        <p className="text-xs text-slate-400 truncate">{p.patient_code}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 truncate mb-2">{p.primary_diagnosis||'—'}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rc}`}>{rl}</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Burnout modal */}
      <AnimatePresence>
        {burnoutCg && (
          <BurnoutModal cg={burnoutCg} data={burnoutMap[burnoutCg.id]}
            loading={burnoutLoading&&!burnoutMap[burnoutCg.id]} onClose={()=>setBurnoutCg(null)}/>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
