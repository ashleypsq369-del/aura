import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle, AlertTriangle, XCircle, Activity,
  Plus, X, Loader2, RefreshCw, Download, Lock, Users,
  FileText, ChevronDown, ChevronUp, AlertCircle, Clock,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import apiClient from '../api/client';
import PageHeader from '../components/PageHeader';
import SearchableSelect from '../components/ui/SearchableSelect';
import toast from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../api/client';

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

const STATUS_CFG = {
  implemented:     { icon: CheckCircle, cls: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Implemented' },
  partial:         { icon: Activity,    cls: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700 border-amber-200',     label: 'Partial' },
  not_implemented: { icon: XCircle,     cls: 'text-red-600',     badge: 'bg-red-100 text-red-700 border-red-200',           label: 'Not Implemented' },
};
const SEV_CFG = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high:     'bg-orange-100 text-orange-700 border-orange-200',
  medium:   'bg-amber-100 text-amber-700 border-amber-200',
  low:      'bg-slate-100 text-slate-600 border-slate-200',
};

function KpiCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3">
      <Icon size={18} className={color}/>
      <div><p className="text-xs text-slate-500">{label}</p><p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p></div>
    </div>
  );
}

function ScoreRing({ score }) {
  const r = 54; const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626';
  return (
    <svg width={128} height={128}>
      <circle cx={64} cy={64} r={r} fill="none" stroke="#e2e8f0" strokeWidth={10}/>
      <circle cx={64} cy={64} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 64 64)" style={{ transition:'stroke-dashoffset 0.8s ease' }}/>
      <text x={64} y={68} textAnchor="middle" fontSize={22} fontWeight="800" fill={color}>{score.toFixed(0)}%</text>
    </svg>
  );
}

function IncidentRow({ incident, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ resolution_notes: incident.resolution_notes || '', reported_to_authorities: incident.reported_to_authorities || false, notification_sent: incident.notification_sent || false });
  const discovered = new Date(incident.discovered_at);
  const deadline = new Date(discovered.getTime() + 60 * 24 * 3600 * 1000);
  const daysLeft = Math.ceil((deadline - Date.now()) / (24 * 3600 * 1000));
  const overdue = daysLeft < 0;

  return (
    <div className={`border rounded-xl overflow-hidden ${incident.is_resolved ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-[#f0f6fa]'}`}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50/50 transition" onClick={() => setOpen(!open)}>
        <div className={`w-2 h-8 rounded-full flex-shrink-0 ${SEV_CFG[incident.severity]?.split(' ')[0] || 'bg-slate-300'}`}/>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-800">{(incident.breach_type||'').replace(/_/g,' ')}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${SEV_CFG[incident.severity]}`}>{incident.severity}</span>
            {incident.is_resolved && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Resolved</span>}
            {!incident.is_resolved && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${overdue ? 'bg-red-100 text-red-700 border-red-200' : daysLeft < 7 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {overdue ? `${Math.abs(daysLeft)}d OVERDUE` : `${daysLeft}d to HHS deadline`}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{incident.affected_count} records · Discovered {discovered.toLocaleDateString('en-GB')}</p>
        </div>
        {open ? <ChevronUp size={14} className="text-slate-400"/> : <ChevronDown size={14} className="text-slate-400"/>}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
            className="border-t border-slate-200 px-4 py-4 space-y-3 bg-[#f0f6fa]">
            {incident.description && <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{incident.description}</p>}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Resolution Notes</label>
              <textarea rows={3} value={form.resolution_notes} onChange={e => setForm(f => ({ ...f, resolution_notes: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm resize-none focus:border-teal-500 outline-none"/>
            </div>
            <div className="flex gap-4">
              {[['reported_to_authorities','Reported to HHS/Authorities'],['notification_sent','Patient Notifications Sent']].map(([k,label]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.checked }))} className="w-4 h-4 accent-teal-600"/>
                  <span className="text-xs font-semibold text-slate-700">{label}</span>
                </label>
              ))}
            </div>
            <button onClick={() => onUpdate({ id: incident.id, ...form, resolved_at: !incident.is_resolved && form.resolution_notes ? new Date().toISOString() : undefined })}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition">
              Save Update
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HIPAACompliance() {
  const [tab, setTab] = useState('overview');
  const [catFilter, setCatFilter] = useState('all');
  const [showBreachForm, setShowBreachForm] = useState(false);
  const [breachForm, setBreachForm] = useState({ breach_type:'unauthorized_access', description:'', affected_count:0, severity:'medium', discovered_at: new Date().toISOString().slice(0,16) });
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = ['admin','clinician'].includes(user?.role);
  const isPatient = ['patient','family'].includes(user?.role);

  const { data: compliance, isLoading, refetch } = useQuery({
    queryKey:['hipaa-compliance'], enabled: isAdmin,
    queryFn: () => apiClient.get('/api/hipaa/compliance/status').then(r => r.data),
  });
  const { data: breachStats } = useQuery({
    queryKey:['breach-stats'], enabled: isAdmin,
    queryFn: () => apiClient.get('/api/hipaa/breach-incidents/stats').then(r => r.data),
  });
  const { data: incidentsData } = useQuery({
    queryKey:['breach-incidents'], enabled: isAdmin && tab === 'breaches',
    queryFn: () => apiClient.get('/api/hipaa/breach-incidents').then(r => r.data),
  });

  const createBreachMutation = useMutation({
    mutationFn: d => apiClient.post('/api/hipaa/breach-incidents', { ...d, affected_count: parseInt(d.affected_count)||0, discovered_at: new Date(d.discovered_at).toISOString() }),
    onSuccess: () => { qc.invalidateQueries(['breach-stats','breach-incidents']); setShowBreachForm(false); toast.success('Incident logged'); },
    onError: e => toast.error(e.response?.data?.detail || 'Failed'),
  });
  const updateBreachMutation = useMutation({
    mutationFn: ({ id, ...data }) => apiClient.put(`/api/hipaa/breach-incidents/${id}`, data),
    onSuccess: () => { qc.invalidateQueries(['breach-incidents']); toast.success('Updated'); },
    onError: e => toast.error(e.response?.data?.detail || 'Failed'),
  });

  const exportData = async () => {
    try {
      const r = await axios.get(`${API_URL}/api/hipaa/portal/my-data/export`, { headers: authH(), responseType:'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a'); a.href = url;
      a.download = `my_health_data_${new Date().toISOString().slice(0,10)}.json`; a.click();
      toast.success('Download started');
    } catch { toast.error('Export failed'); }
  };

  const score = compliance?.compliance_score || 0;
  const categories = ['all', ...new Set((compliance?.items||[]).map(i => i.category))];
  const filtered = catFilter === 'all' ? (compliance?.items||[]) : (compliance?.items||[]).filter(i => i.category === catFilter);
  const incidents = incidentsData?.incidents || [];

  const TABS = [
    { id:'overview', label:'Overview', icon: Shield },
    { id:'checklist', label:'Checklist', icon: CheckCircle },
    { id:'breaches', label:`Breaches${breachStats?.unresolved > 0 ? ` (${breachStats.unresolved})` : ''}`, icon: AlertTriangle },
    ...(isPatient ? [{ id:'export', label:'My Data Export', icon: Download }] : []),
  ];

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="animate-spin text-teal-600"/></div>;

  return (
    <div className="min-h-screen pb-12">
      <PageHeader image="/resources/african/african-health-tech.jpg" title="HIPAA Compliance" icon={Shield}
        subtitle="Health Insurance Portability and Accountability Act — compliance tracking & breach management">
        {isAdmin && <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-bold border border-white/30 transition"><RefreshCw size={15}/> Refresh</button>}
      </PageHeader>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${tab===id ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}>
              <Icon size={14}/>{label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && isAdmin && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Compliance Score" value={`${score.toFixed(1)}%`} icon={Shield} color={score>=80?'text-emerald-600':score>=60?'text-amber-600':'text-red-600'}/>
              <KpiCard label="Implemented" value={compliance?.implemented||0} icon={CheckCircle} color="text-emerald-600"/>
              <KpiCard label="Partial" value={compliance?.partial||0} icon={Activity} color="text-amber-600"/>
              <KpiCard label="Not Implemented" value={compliance?.not_implemented||0} icon={XCircle} color="text-red-600"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Score ring card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center gap-3">
                <ScoreRing score={score}/>
                <p className="text-sm font-bold text-slate-700">Overall Compliance</p>
                <div className="text-xs text-slate-500 text-center">
                  Next review: {compliance?.next_review_date ? new Date(compliance.next_review_date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : '—'}
                </div>
              </div>
              {/* Live metrics */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Users size={15} className="text-teal-600"/> Live System Metrics</h3>
                {[
                  ['Total Users', compliance?.live_metrics?.total_users],
                  ['Active Users', compliance?.live_metrics?.active_users],
                  ['Audit Log Entries', compliance?.live_metrics?.audit_log_entries],
                  ['Audit IP Coverage', `${compliance?.live_metrics?.audit_ip_coverage_pct||0}%`],
                  ['Open Breach Incidents', compliance?.live_metrics?.open_breach_incidents],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-bold text-slate-900">{val ?? '—'}</span>
                  </div>
                ))}
              </div>
              {/* Breach summary */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><AlertTriangle size={15} className="text-red-500"/> Breach Incidents</h3>
                {breachStats ? [
                  ['Total', breachStats.total_incidents, 'text-slate-800'],
                  ['Resolved', breachStats.resolved, 'text-emerald-600'],
                  ['Unresolved', breachStats.unresolved, 'text-red-600'],
                  ['Last 30 Days', breachStats.recent_30_days, 'text-amber-600'],
                  ['Critical', breachStats.by_severity?.critical||0, 'text-red-700'],
                ].map(([label, val, color]) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{label}</span>
                    <span className={`font-bold ${color}`}>{val}</span>
                  </div>
                )) : <p className="text-slate-400 text-xs">No data</p>}
              </div>
            </div>
          </div>
        )}

        {/* CHECKLIST TAB */}
        {tab === 'checklist' && isAdmin && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button key={cat} onClick={() => setCatFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${catFilter===cat ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'}`}>
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {filtered.map((item, i) => {
                const cfg = STATUS_CFG[item.status] || STATUS_CFG.partial;
                const Icon = cfg.icon;
                return (
                  <motion.div key={item.id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.03 }}
                    className="flex items-start gap-4 px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                    <Icon size={20} className={`${cfg.cls} flex-shrink-0 mt-0.5`}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold text-slate-900">{item.requirement}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${cfg.badge}`}>{cfg.label}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{item.category}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.notes}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">#{item.id}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* BREACHES TAB */}
        {tab === 'breaches' && isAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700">Breach Incident Log</h3>
              <button onClick={() => setShowBreachForm(!showBreachForm)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${showBreachForm ? 'bg-slate-200 text-slate-700' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                {showBreachForm ? <><X size={14}/> Cancel</> : <><Plus size={14}/> Log Incident</>}
              </button>
            </div>
            <AnimatePresence>
              {showBreachForm && (
                <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                  className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 space-y-4">
                  <h4 className="text-sm font-bold text-red-900">Log New HIPAA Breach Incident</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SearchableSelect label="Incident Type" accent="rose" allowClear={false} value={breachForm.breach_type}
                      onChange={v => setBreachForm(f => ({ ...f, breach_type: v||'unauthorized_access' }))}
                      options={['unauthorized_access','data_theft','accidental_disclosure','system_breach','lost_device','insider_threat','ransomware','other'].map(v => ({ value:v, label:v.replace(/_/g,' ') }))}/>
                    <SearchableSelect label="Severity" accent="rose" allowClear={false} value={breachForm.severity}
                      onChange={v => setBreachForm(f => ({ ...f, severity: v||'medium' }))}
                      options={['low','medium','high','critical'].map(v => ({ value:v, label:v.charAt(0).toUpperCase()+v.slice(1) }))}/>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Affected Records</label>
                      <input type="number" min="0" value={breachForm.affected_count} onChange={e => setBreachForm(f => ({ ...f, affected_count: e.target.value }))}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:border-red-500 outline-none"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Discovery Date & Time</label>
                      <input type="datetime-local" value={breachForm.discovered_at} onChange={e => setBreachForm(f => ({ ...f, discovered_at: e.target.value }))}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:border-red-500 outline-none"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Description *</label>
                    <textarea rows={4} value={breachForm.description} onChange={e => setBreachForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe what happened, how discovered, what data was affected, and immediate actions taken..."
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm resize-none focus:border-red-500 outline-none"/>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => createBreachMutation.mutate(breachForm)} disabled={!breachForm.description.trim() || createBreachMutation.isPending}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center gap-2">
                      {createBreachMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <FileText size={14}/>} Log Incident
                    </button>
                    <button onClick={() => setShowBreachForm(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {incidents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Shield size={36} className="mx-auto text-slate-300 mb-3"/>
                <p className="text-slate-600 font-semibold">No breach incidents recorded</p>
              </div>
            ) : (
              <div className="space-y-2">
                {incidents.map(inc => <IncidentRow key={inc.id} incident={inc} onUpdate={data => updateBreachMutation.mutate(data)}/>)}
              </div>
            )}
          </div>
        )}

        {/* DATA EXPORT TAB */}
        {tab === 'export' && isPatient && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-teal-200 shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0"><Lock size={24} className="text-teal-600"/></div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-900 mb-1">HIPAA Right of Access</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">Under HIPAA (45 CFR §164.524), you have the right to access and receive a copy of all your health information held by this system. This includes vitals, medications, assessments, AI predictions, and clinical notes.</p>
                  <button onClick={exportData} className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition shadow-sm">
                    <Download size={15}/> Download My Complete Health Record
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <strong>Note:</strong> The export will be a JSON file containing all your health data. Store it securely and do not share it with unauthorized parties.
            </div>
          </div>
        )}
        {tab === 'export' && !isPatient && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Shield size={36} className="mx-auto text-slate-300 mb-3"/>
            <p className="text-slate-600 font-semibold">Data Export for Patients</p>
            <p className="text-slate-400 text-sm mt-1">This feature allows patients to download their complete health record. Clinicians and admins access data through Reports.</p>
          </div>
        )}
      </div>
    </div>
  );
}
