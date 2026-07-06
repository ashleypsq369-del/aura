/**
 * Caregivers — Premium 2-column layout
 * Design: gradient KPI cards, glass-effect panels, rich color, no infinite scroll
 * LEFT:  Search + Caregiver Directory (paginated 6/page)
 * RIGHT: AI Auto-Assign + Team Analytics + Assignments (sticky)
 */
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { caregiversAPI, caregiverIntelligenceAPI, advancedMlAPI, patientsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import toast from '../utils/toast';
import {
  Users, HeartHandshake, AlertTriangle, Search, X,
  UserPlus, Phone, Mail, Zap, Heart, Trash2, ChevronRight,
  Loader2, Brain, Activity, ChevronLeft, ChevronDown,
  Star, Shield, TrendingUp,
} from 'lucide-react';

const AVATARS = [
  'from-violet-500 to-purple-700',
  'from-teal-500 to-emerald-600',
  'from-blue-500 to-indigo-700',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-sky-600',
];
const getInitials = n => n ? n.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';
const PAGE_SIZE = 6;

/* ── Gradient KPI stat card ───────────────────────────────────────────────── */
const STAT_THEMES = {
  teal:   { bg: 'bg-gradient-to-br from-teal-500 to-cyan-600',     icon: 'bg-white/20', text: 'text-white', glow: 'shadow-teal-500/30' },
  violet: { bg: 'bg-gradient-to-br from-violet-500 to-purple-700', icon: 'bg-white/20', text: 'text-white', glow: 'shadow-violet-500/30' },
  blue:   { bg: 'bg-gradient-to-br from-blue-500 to-indigo-600',   icon: 'bg-white/20', text: 'text-white', glow: 'shadow-blue-500/30' },
  amber:  { bg: 'bg-gradient-to-br from-amber-500 to-orange-600',  icon: 'bg-white/20', text: 'text-white', glow: 'shadow-amber-500/30' },
  rose:   { bg: 'bg-gradient-to-br from-rose-500 to-pink-600',     icon: 'bg-white/20', text: 'text-white', glow: 'shadow-rose-500/30' },
  slate:  { bg: 'bg-gradient-to-br from-slate-600 to-slate-800',   icon: 'bg-white/20', text: 'text-white', glow: 'shadow-slate-500/30' },
};

function StatCard({ label, value, icon: Icon, theme = 'teal', subtitle, pulse }) {
  const t = STAT_THEMES[theme] || STAT_THEMES.teal;
  return (
    <div className={`${t.bg} rounded-xl px-4 py-3.5 shadow-lg ${t.glow} relative overflow-hidden`}>
      <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-white/10 pointer-events-none"/>
      {pulse && <span className="w-2 h-2 rounded-full bg-white/70 animate-ping absolute top-2.5 right-2.5"/>}
      <div className="relative z-10 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${t.icon} flex items-center justify-center flex-shrink-0`}>
          <Icon size={15} className="text-white"/>
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-black text-white tabular-nums leading-none">{value}</p>
          <p className="text-white/80 font-semibold text-xs mt-0.5 truncate">{label}</p>
          {subtitle && <p className="text-white/55 text-[10px] truncate">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Patient picker ───────────────────────────────────────────────────────── */
function PatientPicker({ list, value, onChange, placeholder = 'Search patient…' }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const sel = list.find(p => String(p.id) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const hits = list.filter(p => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (p.full_name || '').toLowerCase().includes(s) || (p.patient_code || '').toLowerCase().includes(s);
  }).slice(0, 6);
  return (
    <div ref={ref} className="relative flex-1">
      <div className={`flex items-center gap-2 border-2 rounded-xl px-3 py-2 bg-white transition-all ${open ? 'border-violet-500 shadow-md shadow-violet-100' : 'border-slate-200 hover:border-slate-300'}`}
        onClick={() => { setQ(''); setOpen(true); }}>
        <Search size={13} className="text-slate-400 flex-shrink-0"/>
        <input value={open ? q : sel ? (sel.patient_code || sel.full_name) : ''}
          onChange={e => setQ(e.target.value)} onFocus={() => { setQ(''); setOpen(true); }}
          placeholder={placeholder}
          className="flex-1 outline-none bg-transparent text-sm text-slate-700 placeholder-slate-400 min-w-0"/>
        {sel && <button onClick={e => { e.stopPropagation(); onChange(''); }}><X size={12} className="text-slate-400 hover:text-red-500"/></button>}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
            {hits.length === 0
              ? <div className="px-4 py-3 text-sm text-slate-400 text-center">No patients found</div>
              : hits.map(p => (
                <button key={p.id} type="button"
                  onClick={() => { onChange(String(p.id)); setOpen(false); setQ(''); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-violet-50 flex items-center gap-3 border-b border-slate-50 last:border-0 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                    {getInitials(p.full_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{p.full_name}</p>
                    <p className="text-xs text-slate-400">{p.patient_code} · {p.age}y</p>
                  </div>
                </button>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Risk badge helper ────────────────────────────────────────────────────── */
function RiskBadge({ level }) {
  if (!level) return null;
  const l = String(level).toLowerCase();
  if (l === 'critical' || l === 'burnout')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>Burnout</span>;
  if (l === 'high' || l === 'struggling')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">High Risk</span>;
  if (l === 'moderate')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">Moderate</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">Low Risk</span>;
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function Caregivers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isStaff     = user?.role === 'clinician' || user?.role === 'admin';
  const isCaregiver = user?.role === 'caregiver';

  const [search, setSearch]         = useState('');
  const [assignMap, setAssignMap]   = useState({});
  const [optimalPid, setOptimalPid] = useState('');
  const [page, setPage]             = useState(0);
  const [selectedCg, setSelectedCg] = useState(null);

  /* ── Queries ─────────────────────────────────────────────────────────── */
  const { data: cgRaw, isLoading } = useQuery({
    queryKey: ['caregivers-all'],
    queryFn: () => caregiversAPI.getAll().then(r => r.data),
    staleTime: 5 * 60 * 1000, retry: false,
  });
  const { data: assignmentsRaw } = useQuery({
    queryKey: ['cg-assignments'],
    queryFn: () => caregiversAPI.getAssignments().then(r => r.data),
    enabled: isStaff, staleTime: 3 * 60 * 1000, retry: false,
  });
  const { data: myPatientsRaw } = useQuery({
    queryKey: ['cg-my-patients'],
    queryFn: () => caregiverIntelligenceAPI.getMyPatients().then(r => r.data),
    enabled: isCaregiver, staleTime: 3 * 60 * 1000, retry: false,
  });
  const { data: teamRaw } = useQuery({
    queryKey: ['cg-team'],
    queryFn: () => caregiverIntelligenceAPI.getTeamOverview().then(r => r.data),
    staleTime: 5 * 60 * 1000, retry: false,
  });
  const { data: burnoutRaw } = useQuery({
    queryKey: ['cg-burnout'],
    queryFn: () => advancedMlAPI.getAllCaregiverBurnout().then(r => r.data),
    staleTime: 10 * 60 * 1000, retry: false,
  });
  const { data: patientsRaw } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsAPI.getAll().then(r => r.data),
    enabled: isStaff, staleTime: 5 * 60 * 1000,
  });

  const caregivers  = Array.isArray(cgRaw) ? cgRaw : cgRaw?.caregivers || [];
  const assignments = Array.isArray(assignmentsRaw) ? assignmentsRaw : assignmentsRaw?.assignments || [];
  const myPatients  = Array.isArray(myPatientsRaw?.patients) ? myPatientsRaw.patients : [];
  const burnoutList = Array.isArray(burnoutRaw) ? burnoutRaw : burnoutRaw?.caregivers || [];
  const patientList = Array.isArray(patientsRaw) ? patientsRaw : patientsRaw?.patients || [];

  const burnoutAlerts = burnoutList.filter(b => {
    const l = String(b.burnout_level || b.risk_level || '').toLowerCase();
    return l === 'critical' || l === 'high' || l === 'burnout' || l === 'struggling';
  }).length;

  const filtered = caregivers.filter(cg => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (cg.full_name || '').toLowerCase().includes(s) || (cg.role || '').toLowerCase().includes(s);
  });

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [search]);

  /* ── Mutations ───────────────────────────────────────────────────────── */
  const assignMutation = useMutation({
    mutationFn: d => caregiversAPI.assign(d),
    onSuccess: (_, d) => {
      toast.success('Caregiver assigned');
      setAssignMap(m => ({ ...m, [d.caregiver_id]: '' }));
      queryClient.invalidateQueries(['cg-assignments']);
      queryClient.invalidateQueries(['cg-team']);
    },
    onError: e => toast.error(e?.response?.data?.detail || 'Assignment failed'),
  });
  const removeMutation = useMutation({
    mutationFn: id => caregiversAPI.removeAssignment(id),
    onSuccess: () => { toast.success('Assignment removed'); queryClient.invalidateQueries(['cg-assignments']); },
    onError: () => toast.error('Failed to remove'),
  });
  const optimalMutation = useMutation({
    mutationFn: pid => caregiverIntelligenceAPI.assignOptimal(pid),
    onSuccess: d => {
      toast.success(`AI assigned ${d?.data?.caregiver_name || 'caregiver'}`);
      setOptimalPid('');
      queryClient.invalidateQueries(['cg-assignments']);
      queryClient.invalidateQueries(['cg-team']);
    },
    onError: e => toast.error(e?.response?.data?.detail || 'AI assign failed'),
  });

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }}
      className="min-h-screen space-y-6 pb-10">

      <PageHeader image="/resources/cards/card-patients.jpg" title="Care Team"
        subtitle="AI-powered caregiver management, workload intelligence and team analytics" icon={HeartHandshake}/>

      {/* ── Gradient KPI cards ── */}
      <div className="px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Caregivers" value={caregivers.length} icon={Users} theme="teal" subtitle="Active team members"/>
          <StatCard label="Assignments" value={assignments.length} icon={HeartHandshake} theme="blue" subtitle="Patient-caregiver pairs"/>
          <StatCard label="Burnout Alerts" value={burnoutAlerts} icon={AlertTriangle}
            theme={burnoutAlerts > 0 ? 'amber' : 'slate'} subtitle={burnoutAlerts > 0 ? 'Need attention' : 'Team healthy'} pulse={burnoutAlerts > 0}/>
          <StatCard label={isCaregiver ? 'My Patients' : 'Total Patients'}
            value={isCaregiver ? myPatients.length : (teamRaw?.total_patients_assigned ?? '—')}
            icon={Heart} theme="violet" subtitle={isCaregiver ? 'Assigned to you' : 'In the system'}/>
        </div>
      </div>

      {/* ── Burnout warning ── */}
      {burnoutAlerts > 0 && (
        <div className="px-6">
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} className="text-white"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-900 text-sm">{burnoutAlerts} Caregiver Burnout Alert{burnoutAlerts > 1 ? 's' : ''} Detected</p>
              {burnoutList.filter(b => ['critical','high','burnout','struggling'].includes(String(b.burnout_level || b.risk_level || '').toLowerCase())).map((b, i) => (
                <p key={i} className="text-xs text-amber-800 mt-0.5">
                  <strong>{b.caregiver_name || b.name}</strong> — {b.burnout_level || b.risk_level} risk{b.recommendation ? `. ${b.recommendation}` : ''}
                </p>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── TWO-COLUMN LAYOUT ── */}
      <div className="px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

          {/* ── LEFT COLUMN: Search + Directory ── */}
          <div className="flex flex-col gap-4">

            {/* Search bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search caregivers by name or role…"
                    className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none text-sm font-medium transition-all"/>
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-slate-100 hover:bg-red-100 flex items-center justify-center transition-colors">
                      <X size={12} className="text-slate-500 hover:text-red-500"/>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2.5">
                <p className="text-xs text-slate-400">
                  {filtered.length === 0 ? 'No results' : `Showing ${Math.min(PAGE_SIZE, filtered.length - page * PAGE_SIZE)} of ${filtered.length} caregivers`}
                </p>
                {pageCount > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                      className="w-7 h-7 rounded-lg border-2 border-slate-200 hover:border-violet-400 hover:text-violet-600 disabled:opacity-40 flex items-center justify-center transition-all text-slate-500">
                      <ChevronLeft size={14}/>
                    </button>
                    <span className="text-xs font-semibold text-slate-600 min-w-[48px] text-center">{page + 1} / {pageCount}</span>
                    <button onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page === pageCount - 1}
                      className="w-7 h-7 rounded-lg border-2 border-slate-200 hover:border-violet-400 hover:text-violet-600 disabled:opacity-40 flex items-center justify-center transition-all text-slate-500">
                      <ChevronRight size={14}/>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Section label */}
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Users size={16} className="text-violet-600"/>
                Caregiver Directory
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">{filtered.length}</span>
            </div>

            {/* Caregiver cards */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 h-64 gap-3">
                <Loader2 size={30} className="animate-spin text-violet-500"/>
                <p className="text-sm text-slate-500 font-medium">Loading team…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300 h-64 gap-3">
                <Users size={40} className="text-slate-300"/>
                <p className="font-bold text-slate-500">No caregivers found</p>
                {search && <button onClick={() => setSearch('')} className="text-xs text-violet-600 hover:underline font-medium">Clear search</button>}
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {paginated.map((cg, i) => {
                    const bi = burnoutList.find(b => b.caregiver_id === cg.id || b.user_id === cg.id);
                    const bLevel = bi ? String(bi.burnout_level || bi.risk_level || '').toLowerCase() : null;
                    const isSelected = selectedCg?.id === cg.id;
                    const idx = (page * PAGE_SIZE + i) % AVATARS.length;
                    return (
                      <motion.div key={cg.id || i} layout
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ delay: i * 0.04 }}
                        className={`bg-white rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden ${
                          isSelected
                            ? 'border-violet-400 shadow-lg shadow-violet-100'
                            : 'border-slate-200 hover:border-violet-300 hover:shadow-md'
                        }`}
                        onClick={() => setSelectedCg(isSelected ? null : cg)}>
                        <div className="p-3 flex items-center gap-3">
                          {/* Avatar */}
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${AVATARS[idx]} flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0`}>
                            {getInitials(cg.full_name)}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-bold text-slate-900">{cg.full_name}</span>
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">{cg.role || 'Caregiver'}</span>
                              {bLevel && <RiskBadge level={bLevel}/>}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              {cg.email && <span className="flex items-center gap-1 truncate"><Mail size={11}/>{cg.email}</span>}
                              {cg.phone && <span className="flex items-center gap-1"><Phone size={11}/>{cg.phone}</span>}
                            </div>
                          </div>
                          <ChevronDown size={16} className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${isSelected ? 'rotate-180 text-violet-500' : ''}`}/>
                        </div>

                        {/* Expandable assign panel */}
                        <AnimatePresence>
                          {isSelected && isStaff && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden">
                              <div className="px-4 pb-4 pt-1 border-t border-violet-100 bg-violet-50/50">
                                <p className="text-xs font-semibold text-violet-700 mb-2.5 flex items-center gap-1.5">
                                  <UserPlus size={12}/> Assign a patient to {cg.full_name?.split(' ')[0]}
                                </p>
                                <div className="flex gap-2">
                                  <PatientPicker list={patientList} value={assignMap[cg.id] || ''} onChange={v => setAssignMap(m => ({ ...m, [cg.id]: v }))}/>
                                  <button
                                    onClick={e => { e.stopPropagation(); if (assignMap[cg.id]) assignMutation.mutate({ patient_id: parseInt(assignMap[cg.id]), caregiver_id: cg.id, notes: '' }); }}
                                    disabled={!assignMap[cg.id] || assignMutation.isPending}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs disabled:opacity-50 transition shadow-md shadow-violet-200 flex-shrink-0">
                                    {assignMutation.isPending ? <Loader2 size={12} className="animate-spin"/> : <UserPlus size={12}/>}
                                    Assign
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* Page dots */}
            {pageCount > 1 && (
              <div className="flex items-center justify-center gap-1.5 py-1">
                {Array.from({ length: pageCount }, (_, idx) => (
                  <button key={idx} onClick={() => setPage(idx)}
                    className={`rounded-full transition-all duration-200 ${idx === page ? 'w-7 h-2.5 bg-violet-600' : 'w-2.5 h-2.5 bg-slate-300 hover:bg-violet-400'}`}/>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: Analytics + AI + Assignments (sticky) ── */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-4">

            {/* AI Auto-Assign */}
            {isStaff && patientList.length > 0 && (
              <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl p-4 shadow-lg shadow-violet-500/20 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none"/>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                      <Zap size={14} className="text-white"/>
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">AI Auto-Assign</p>
                      <p className="text-violet-200 text-[10px]">ML-powered optimal matching</p>
                    </div>
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white">🧠 AI</span>
                  </div>
                  <div className="flex gap-2">
                    <PatientPicker list={patientList} value={optimalPid} onChange={setOptimalPid} placeholder="Select patient…"/>
                    <button onClick={() => optimalPid && optimalMutation.mutate(parseInt(optimalPid))}
                      disabled={!optimalPid || optimalMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white text-violet-700 rounded-xl font-bold text-xs disabled:opacity-50 transition hover:bg-violet-50 shadow-md flex-shrink-0">
                      {optimalMutation.isPending ? <Loader2 size={12} className="animate-spin"/> : <Zap size={12}/>}
                      Assign
                    </button>
                  </div>
                  <p className="text-violet-200 text-[10px] mt-2">Matches by workload score, patient complexity &amp; continuity of care.</p>
                </div>
              </div>
            )}

            {/* Team Analytics */}
            {teamRaw && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2 bg-gradient-to-r from-slate-50 to-white">
                  <Brain size={15} className="text-violet-600"/>
                  <h3 className="font-bold text-slate-800 text-sm">Team Analytics</h3>
                  <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">🧠 AI</span>
                </div>
                <div className="p-4 space-y-4">
                  {/* Mini stats */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { l: 'Team Size',    v: teamRaw.team_size ?? caregivers.length,              c: 'bg-teal-500',   t: 'text-teal-700',   bg: 'bg-teal-50' },
                      { l: 'Patients',     v: teamRaw.total_patients_assigned ?? '—',              c: 'bg-violet-500', t: 'text-violet-700', bg: 'bg-violet-50' },
                      { l: 'Avg / Carer',  v: teamRaw.average_patients_per_caregiver ?? '—',      c: 'bg-blue-500',   t: 'text-blue-700',   bg: 'bg-blue-50' },
                      { l: 'Overloaded',   v: teamRaw.overloaded_caregivers ?? burnoutAlerts,     c: 'bg-rose-500',   t: 'text-rose-700',   bg: 'bg-rose-50' },
                    ].map(({ l, v, c, t, bg }) => (
                      <div key={l} className={`${bg} rounded-xl p-3 text-center border border-white`}>
                        <p className={`text-2xl font-black ${t}`}>{v}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{l}</p>
                      </div>
                    ))}
                  </div>

                  {/* Workload bars */}
                  {teamRaw.team_metrics?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Workload Distribution</p>
                      <div className="space-y-2.5">
                        {teamRaw.team_metrics.slice(0, 6).map(m => {
                          const w = m.workload;
                          const pct = Math.min(100, w.workload_score || 0);
                          const barColor = w.capacity_status === 'overloaded' ? 'bg-rose-500' : w.capacity_status === 'full' ? 'bg-amber-500' : 'bg-teal-500';
                          const labelColor = w.capacity_status === 'overloaded' ? 'text-rose-600' : w.capacity_status === 'full' ? 'text-amber-600' : 'text-teal-600';
                          return (
                            <div key={m.caregiver_id} className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0 shadow-sm">
                                {(m.caregiver_name || '?')[0]}
                              </div>
                              <p className="text-xs font-semibold text-slate-700 w-24 truncate flex-shrink-0">{m.caregiver_name}</p>
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div className={`h-full rounded-full ${barColor}`}
                                  initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: .7, ease: 'easeOut' }}/>
                              </div>
                              <span className={`text-[10px] font-bold w-5 text-right tabular-nums ${labelColor}`}>{pct}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {teamRaw.recommendations?.filter(Boolean).slice(0, 3).map((rec, i) => (
                    <div key={i} className={`flex items-start gap-2 text-xs px-3 py-2.5 rounded-xl border ${
                      rec.includes('⚠️') || rec.includes('❌')
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}>
                      <TrendingUp size={11} className="flex-shrink-0 mt-0.5"/>
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Assignments */}
            {isStaff && assignments.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Activity size={14} className="text-blue-500"/>Active Assignments
                  </h3>
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{assignments.length}</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {assignments.map((a, i) => (
                    <motion.div key={a.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50/50 transition-colors group">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(a.patient_name || '?')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-xs truncate">{a.patient_name || a.patient_code || `Patient #${a.patient_id}`}</p>
                        <p className="text-[10px] text-slate-400 truncate">{a.caregiver_name || `Caregiver #${a.caregiver_id}`}</p>
                      </div>
                      <button onClick={() => removeMutation.mutate(a.id)} disabled={removeMutation.isPending}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold disabled:opacity-50 transition-all">
                        <Trash2 size={10}/> Remove
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* My Patients (caregiver role) */}
            {isCaregiver && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100 flex items-center justify-between">
                  <h3 className="font-bold text-teal-900 text-sm flex items-center gap-2">
                    <Heart size={14} className="text-teal-600"/>My Patients
                  </h3>
                  <span className="w-6 h-6 rounded-full bg-teal-200 text-teal-800 text-xs font-bold flex items-center justify-center">{myPatients.length}</span>
                </div>
                {myPatients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-2">
                    <Heart size={28} className="text-slate-300"/>
                    <p className="text-sm text-slate-400 font-medium">No patients assigned yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {myPatients.map((p, i) => {
                      const pid = p.id || p.patient_id;
                      const rl = p.risk_level || 'Stable';
                      const rColor = rl === 'Crisis' ? 'text-red-700 bg-red-100' : rl === 'High' ? 'text-amber-700 bg-amber-100' : rl === 'Medium' ? 'text-teal-700 bg-teal-100' : 'text-emerald-700 bg-emerald-100';
                      return (
                        <motion.div key={pid} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                          onClick={() => navigate(`/patients/${pid}`)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-teal-50/60 cursor-pointer transition-colors">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${AVATARS[i % AVATARS.length]} flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0`}>
                            {getInitials(p.full_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">{p.full_name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{p.patient_code} · {p.primary_diagnosis || '—'}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${rColor}`}>{rl}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>{/* end right column */}
        </div>{/* end grid */}
      </div>

    </motion.div>
  );
}
