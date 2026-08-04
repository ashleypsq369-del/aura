/**
 * Reports Page — ProjectAura (Redesigned)
 * =========================================
 * Uses:
 *   - Recharts  for interactive charts (ESAS trends, risk distribution)
 *   - react-to-print  for clean print output (report content only)
 *   - Tab navigation (Clinical | Operational | Compliance | Palliative)
 *   - Print CSS that hides everything except #report-print-content
 *
 * 12 report types covering all palliative care needs:
 *   Clinical:    Patient Summary, MDT Handover, Advance Care Plan, Care Plan Progress
 *   Assessment:  Assessment Completion, Medication Adherence, Bereavement Outcome
 *   Operational: Population, Incidents, Caregiver Performance
 *   Governance:  User Activity, Audit Trail
 */
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  FileText, Shield, Users, AlertTriangle, Activity,
  Clock, BarChart3, Lock, Loader2, ChevronDown, ChevronUp,
  Printer, User, Filter, CheckCircle, Target,
  Heart, AlertCircle, Pill,
  ClipboardCheck, Building2,
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import toast from '../utils/toast';
import { API_URL } from '../api/client';
import SearchableSelect from '../components/ui/SearchableSelect';

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

/* ── Report metadata ─────────────────────────────────────────── */
const REPORT_META = {
  patient_summary:      { icon: FileText,      color:'#0891b2', tab:'clinical',    needsPatient:true  },
  mdt_handover:         { icon: ClipboardCheck,color:'#0369a1', tab:'clinical'                        },
  advance_care_plan:    { icon: Heart,          color:'#be123c', tab:'clinical',    needsPatient:true  },
  care_plan_progress:   { icon: Target,         color:'#059669', tab:'clinical',    needsPatient:true  },
  assessment_completion:{ icon: CheckCircle,    color:'#7c3aed', tab:'assessment'                      },
  medication_adherence: { icon: Pill,           color:'#be123c', tab:'assessment',  needsPatient:true  },
  bereavement_outcome:  { icon: Heart,          color:'#9d174d', tab:'assessment'                      },
  population:           { icon: BarChart3,      color:'#059669', tab:'operational'                     },
  incidents:            { icon: AlertTriangle,  color:'#d97706', tab:'operational'                     },
  caregiver_performance:{ icon: Users,          color:'#1d4ed8', tab:'operational', needsCaregiver:true},
  user_activity:        { icon: Clock,          color:'#7c3aed', tab:'governance',  needsUser:true      },
  audit_trail:          { icon: Shield,         color:'#dc2626', tab:'governance'                      },
};

const TABS = [
  { id:'clinical',    label:'Clinical',    icon: FileText,      desc:'Patient-level clinical reports' },
  { id:'assessment',  label:'Assessment',  icon: Activity,      desc:'Assessment & adherence tracking' },
  { id:'operational', label:'Operational', icon: BarChart3,     desc:'Caseload & performance reports' },
  { id:'governance',  label:'Governance',  icon: Shield,        desc:'Audit & compliance reports' },
];

const CHART_COLORS = ['#0891b2','#7c3aed','#059669','#dc2626','#d97706','#be123c']; // eslint-disable-line no-unused-vars

/* ── Helpers ──────────────────────────────────────────────────── */
function fmt(iso)     { if(!iso) return '—'; return new Date(iso).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
function fmtD(iso)    { if(!iso) return '—'; return new Date(iso).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }

/* ── Shared atoms ────────────────────────────────────────────── */
function KpiGrid({items}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
      {items.map(({label,value,color='#0d9488',warn,subtitle})=>(
        <div key={label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
          <p className="text-xl font-bold" style={{color:warn&&value>0?'#dc2626':color}}>{value??'—'}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{label}</p>
          {subtitle&&<p className="text-[9px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      ))}
    </div>
  );
}
function Tbl({headers,rows}) {
  if(!rows?.length) return <p className="text-xs text-slate-400 py-2">No data.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr className="border-b border-slate-200">
          {headers.map(h=><th key={h} className="text-left py-2 px-2 text-slate-500 font-semibold uppercase tracking-wide text-[10px] whitespace-nowrap">{h}</th>)}
        </tr></thead>
        <tbody>{rows.map((row,i)=>(
          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
            {row.map((cell,j)=><td key={j} className="py-2 px-2 text-slate-700">{cell}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
function Sec({title,icon:Icon,color='#0d9488',children,collapsible=false}) {
  const [open,setOpen]=useState(true);
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button onClick={()=>collapsible&&setOpen(v=>!v)}
        className={`w-full flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 ${collapsible?'cursor-pointer':'cursor-default'}`}
        style={{backgroundColor:color+'12'}}>
        {Icon&&<Icon size={14} style={{color}}/>}
        <h3 className="font-bold text-sm text-slate-700 flex-1 text-left">{title}</h3>
        {collapsible&&(open?<ChevronUp size={13} className="text-slate-400"/>:<ChevronDown size={13} className="text-slate-400"/>)}
      </button>
      {(!collapsible||open)&&<div className="px-4 py-4">{children}</div>}
    </div>
  );
}

/* ── Searchable patient/user pickers ─────────────────────────── */
function PatientPicker({value,onChange}) {
  const [q,setQ]=useState('');const [open,setOpen]=useState(false);
  const {data}=useQuery({queryKey:['pts-rpt'],queryFn:()=>axios.get(`${API_URL}/api/patients`,{headers:authH()}).then(r=>r.data),staleTime:5*60*1000});
  const pts=(data?.patients||data||[]);
  const sel=pts.find(p=>p.id===value);
  const filtered=pts.filter(p=>!q||p.full_name?.toLowerCase().includes(q.toLowerCase())||String(p.id).includes(q)||(p.patient_code||'').toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="relative">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Patient</label>
      <button type="button" onClick={()=>setOpen(!open)} className="w-full flex items-center justify-between border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 text-left">
        <span className={sel?'text-slate-800 dark:text-slate-100':'text-slate-400'}>{sel?`${sel.full_name} (#${sel.id})`:'Select patient…'}</span>
        <ChevronDown size={14} className="text-slate-400 flex-shrink-0"/>
      </button>
      {open&&(
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
            <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…" className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-slate-100 outline-none"/>
          </div>
          {filtered.slice(0,30).map(p=>(
            <button key={p.id} type="button" onClick={()=>{onChange(p.id);setOpen(false);setQ('');}} className="w-full text-left px-3 py-2 text-xs hover:bg-teal-50 dark:hover:bg-teal-900/20 flex items-center justify-between">
              <span className="font-medium text-slate-800 dark:text-slate-100">{p.full_name}</span>
              <span className="text-slate-400">{p.patient_code||'#'+p.id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function UserPicker({value,onChange,label='User',roles}) {
  const [q,setQ]=useState('');const [open,setOpen]=useState(false);
  const {data}=useQuery({queryKey:['users-rpt'],queryFn:()=>axios.get(`${API_URL}/api/admin/users`,{headers:authH()}).then(r=>r.data),staleTime:5*60*1000});
  const all=(data?.users||data||[]);
  const users=roles?all.filter(u=>roles.includes(u.role)):all;
  const filtered=users.filter(u=>!q||u.full_name?.toLowerCase().includes(q.toLowerCase())||String(u.id).includes(q));
  const sel=users.find(u=>u.id===value);
  return (
    <div className="relative">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
      <button type="button" onClick={()=>setOpen(!open)} className="w-full flex items-center justify-between border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 text-left">
        <span className={sel?'text-slate-800 dark:text-slate-100':'text-slate-400'}>{sel?`${sel.full_name} (#${sel.id})`:`All ${label.toLowerCase()}s…`}</span>
        <ChevronDown size={14} className="text-slate-400 flex-shrink-0"/>
      </button>
      {open&&(
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
            <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…" className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-slate-100 outline-none"/>
          </div>
          <button type="button" onClick={()=>{onChange(null);setOpen(false);setQ('');}} className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700">— All {label.toLowerCase()}s</button>
          {filtered.slice(0,30).map(u=>(
            <button key={u.id} type="button" onClick={()=>{onChange(u.id);setOpen(false);setQ('');}} className="w-full text-left px-3 py-2 text-xs hover:bg-teal-50 dark:hover:bg-teal-900/20 flex items-center justify-between">
              <span className="font-medium text-slate-800 dark:text-slate-100">{u.full_name}</span>
              <span className="text-slate-400 capitalize">{u.role} #{u.id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Report body renderers ────────────────────────────────────── */
function PatientSummaryBody({data}) {
  const p=data.patient||{};const crit=data.critical_events||{};
  const esas=data.symptom_assessments?.esas_trend||[];
  const vitals=data.vitals_summary?.trend||[];
  const esasChart=esas.map(e=>({date:new Date(e.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}),TSDS:e.tsds,Pain:e.pain,Anxiety:e.anxiety})).reverse();
  const vitalsChart=vitals.map(v=>({date:new Date(v.recorded_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}),HR:v.heart_rate,SpO2:v.spo2})).reverse();
  return (
    <div className="space-y-5">
      <Sec title="Patient Demographics" icon={User} color="#0891b2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[['Name',p.full_name],['Code',p.patient_code],['Age',p.age],['Gender',p.gender],['Diagnosis',p.primary_diagnosis],['Risk Level',p.risk_level],['Status',p.status],['Care Setting',(p.care_setting||'—').replace(/_/g,' ')]].map(([k,v])=>(
            <div key={k} className="bg-slate-50 rounded-lg p-2.5">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">{k}</p>
              <p className="font-semibold text-slate-800 text-xs mt-0.5">{v||'—'}</p>
            </div>
          ))}
        </div>
      </Sec>
      <KpiGrid items={[{label:'Total Alerts',value:crit.total_alerts,color:'#dc2626'},{label:'Critical',value:crit.critical_count,warn:crit.critical_count>0},{label:'Unacknowledged',value:crit.unacknowledged,warn:crit.unacknowledged>0},{label:'Active Meds',value:data.medications?.active_count}]}/>
      {esasChart.length>0&&(
        <Sec title="ESAS Symptom Trend" icon={Activity} color="#059669" collapsible>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={esasChart}>
              <XAxis dataKey="date" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}} domain={[0,90]}/><Tooltip/><Legend wrapperStyle={{fontSize:11}}/>
              <Line type="monotone" dataKey="TSDS" stroke="#dc2626" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="Pain" stroke="#f97316" strokeWidth={1.5} dot={false}/>
              <Line type="monotone" dataKey="Anxiety" stroke="#7c3aed" strokeWidth={1.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </Sec>
      )}
      {vitalsChart.length>0&&(
        <Sec title="Vitals Trend" icon={Activity} color="#0891b2" collapsible>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={vitalsChart}>
              <XAxis dataKey="date" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip/><Legend wrapperStyle={{fontSize:11}}/>
              <Line type="monotone" dataKey="HR" stroke="#0891b2" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="SpO2" stroke="#059669" strokeWidth={1.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </Sec>
      )}
      <Sec title="Medications" icon={Pill} color="#be123c" collapsible>
        <Tbl headers={['Medication','Dose','Frequency','Route','Active']}
          rows={(data.medications?.list||[]).map(m=>[
            m.name, m.dose||'—', m.frequency||'—', m.route||'—',
            m.is_active ? '✓ Active' : '✗ Stopped',
          ])}/>
      </Sec>
      <Sec title="Audit Trail" icon={Shield} color="#374151" collapsible>
        <p className="text-xs text-slate-500 mb-2">{data.audit_trail?.total_actions} actions in period.</p>
        <Tbl headers={['Timestamp','Action','Role','Success']}
          rows={(data.audit_trail?.actions||[]).slice(0,15).map(a=>[
            fmt(a.timestamp), a.action, a.user_role,
            a.success ? '✓' : '✗',
          ])}/>
      </Sec>
    </div>
  );
}

function MdtHandoverBody({data}) {
  const urgent = data.patients?.filter(p=>p.priority==='urgent')||[];
  const allPatients = data.patients||[];
  return (
    <div className="space-y-5">
      <KpiGrid items={[{label:'Active Patients',value:data.summary?.total_active_patients},{label:'Urgent',value:data.summary?.urgent_patients,warn:data.summary?.urgent_patients>0},{label:'Unack. Alerts',value:data.summary?.unacknowledged_alerts,warn:data.summary?.unacknowledged_alerts>0},{label:'ESAS Overdue',value:data.summary?.esas_overdue,warn:data.summary?.esas_overdue>0}]}/>
      {urgent.length>0&&(
        <Sec title={`URGENT — ${urgent.length} patient(s) require immediate attention`} icon={AlertTriangle} color="#dc2626">
          {urgent.map(p=>(
            <div key={p.patient_id} className="mb-3 p-3 rounded-xl border border-red-200 bg-red-50">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-bold text-sm text-slate-800">{p.full_name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{p.risk_level}</span>
                <span className="text-[10px] text-slate-500">{p.diagnosis}</span>
              </div>
              {p.recent_alerts.map((a,i)=>(
                <p key={i} className="text-xs text-red-700">⚠ {a.severity.toUpperCase()} — {a.message}</p>
              ))}
              {p.outstanding?.esas_overdue&&<p className="text-xs text-amber-700 mt-0.5">ESAS overdue ({p.last_esas_days!=null?`${p.last_esas_days}d ago`:'never done'})</p>}
              {p.assigned_caregivers?.length>0&&<p className="text-[10px] text-slate-500 mt-0.5">Assigned: {p.assigned_caregivers.join(', ')}</p>}
            </div>
          ))}
        </Sec>
      )}
      <Sec title="All Patients — Handover Summary" icon={Users} color="#0369a1" collapsible>
        <Tbl headers={['Patient','Risk','Last ESAS','Last Vitals','Alerts','Appts Today','Caregivers']}
          rows={allPatients.map(p=>[
            p.full_name,
            p.risk_level || '—',
            p.last_esas_days!=null ? `${p.last_esas_days}d ago` : 'Never',
            p.last_vitals_hours!=null ? `${p.last_vitals_hours}h ago` : 'Never',
            p.recent_alerts.length > 0 ? `⚠ ${p.recent_alerts.length}` : '—',
            p.appointments_today || '—',
            p.assigned_caregivers?.join(', ') || '—',
          ])}
        />
      </Sec>
    </div>
  );
}

function AdvanceCarePlanBody({data}) {
  const ad=data.advance_directives||{};const cp=data.care_plan||{};
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl border-2 ${ad.dnr_status?'border-red-400 bg-red-50':'border-green-400 bg-green-50'}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">DNR / DNACPR Status</p>
          <p className={`text-xl font-bold mt-1 ${ad.dnr_status?'text-red-700':'text-green-700'}`}>{ad.dnr_status?'DNR — Do Not Resuscitate':'Full Resuscitation'}</p>
        </div>
        <div className={`p-4 rounded-xl border-2 ${ad.has_advance_directive?'border-blue-400 bg-blue-50':'border-slate-300 bg-slate-50'}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Advance Directive</p>
          <p className={`text-xl font-bold mt-1 ${ad.has_advance_directive?'text-blue-700':'text-slate-500'}`}>{ad.has_advance_directive?'Document on File':'Not Documented'}</p>
        </div>
      </div>
      <Sec title="Patient Wishes & Preferences" icon={Heart} color="#be123c">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[['Language Preference',ad.preferred_language||'—'],['Religious/Spiritual',ad.religious_preference||'—']].map(([k,v])=>(
            <div key={k} className="bg-slate-50 rounded-lg p-2.5"><p className="text-[10px] text-slate-400 font-semibold uppercase">{k}</p><p className="font-semibold text-slate-800 text-xs mt-0.5">{v}</p></div>
          ))}
        </div>
      </Sec>
      <KpiGrid items={[{label:'PPS Score',value:data.functional_status?.pps_score},{label:'Risk Level',value:data.functional_status?.risk_level},{label:'Care Plan Goals',value:data.goals_summary?.total},{label:'Goals Achieved',value:data.goals_summary?.achieved,color:'#059669'}]}/>
      {cp&&(
        <Sec title="Care Plan" icon={FileText} color="#0369a1" collapsible>
          {[['Goals of Care',cp.goals_of_care],['Pain Management',cp.pain_management_plan],['Psychological Support',cp.psychological_support],['Spiritual Care',cp.spiritual_care],['Family Support',cp.family_support_plan],['Bereavement Plan',cp.bereavement_plan],['Advance Directives Notes',cp.advance_directives_notes]].filter(([,v])=>v).map(([k,v])=>(
            <div key={k} className="mb-3"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{k}</p><p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5 whitespace-pre-wrap">{v}</p></div>
          ))}
        </Sec>
      )}
      <Sec title="Emergency Contact" icon={AlertCircle} color="#dc2626">
        <div className="grid grid-cols-3 gap-3">
          {[['Name',data.emergency_contact?.name],['Relationship',data.emergency_contact?.relationship],['Phone',data.emergency_contact?.phone]].map(([k,v])=>(
            <div key={k} className="bg-slate-50 rounded-lg p-2.5"><p className="text-[10px] text-slate-400 font-semibold uppercase">{k}</p><p className="font-semibold text-slate-800 text-xs mt-0.5">{v||'—'}</p></div>
          ))}
        </div>
      </Sec>
    </div>
  );
}

function PopulationBody({data}) {
  const risk=data.risk_distribution||{};
  const riskData=[{name:'Critical',value:risk.critical||0,fill:'#dc2626'},{name:'High',value:risk.high||0,fill:'#d97706'},{name:'Moderate',value:risk.moderate||0,fill:'#f59e0b'},{name:'Low',value:risk.low||0,fill:'#059669'}].filter(d=>d.value>0);
  const careData=Object.entries(data.care_settings||{}).map(([k,v])=>({name:k.replace(/_/g,' '),value:v}));
  return (
    <div className="space-y-5">
      <KpiGrid items={[{label:'Active Patients',value:data.summary?.total_active_patients},{label:'Unack. Alerts',value:data.summary?.unacknowledged_alerts,warn:data.summary?.unacknowledged_alerts>0},{label:'Critical Alerts',value:data.summary?.critical_alerts,warn:data.summary?.critical_alerts>0},{label:'ESAS 7-day %',value:data.summary?.esas_completion_rate_pct+'%'}]}/>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Sec title="Risk Distribution" icon={AlertTriangle} color="#d97706">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={riskData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,value})=>`${name}: ${value}`} labelLine={false} fontSize={10}>
              {riskData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
            </Pie><Tooltip/></PieChart>
          </ResponsiveContainer>
        </Sec>
        {careData.length>0&&(
          <Sec title="Care Settings" icon={Building2} color="#0891b2">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={careData} layout="vertical">
                <XAxis type="number" tick={{fontSize:10}}/>
                <YAxis dataKey="name" type="category" tick={{fontSize:10}} width={90}/>
                <Tooltip/>
                <Bar dataKey="value" fill="#0891b2" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Sec>
        )}
      </div>
      <Sec title="Top Diagnoses" icon={FileText} color="#374151" collapsible>
        <Tbl headers={['Diagnosis','Count']} rows={(data.top_diagnoses||[]).map(d=>[d.diagnosis,d.count])}/>
      </Sec>
    </div>
  );
}

function AssessmentCompletionBody({data}) {
  const overdueTypes=Object.entries(data.summary?.overdue_by_type||{});
  const barData=overdueTypes.map(([k,v])=>({name:k.toUpperCase(),overdue:v}));
  return (
    <div className="space-y-5">
      <KpiGrid items={[{label:'Total Patients',value:data.summary?.total_patients},{label:'Patients Overdue',value:data.summary?.patients_overdue,warn:data.summary?.patients_overdue>0},{label:'Critical Scores',value:data.summary?.critical_scores,warn:data.summary?.critical_scores>0}]}/>
      {barData.length>0&&(
        <Sec title="Overdue by Assessment Type" icon={Activity} color="#7c3aed">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip/>
              <Bar dataKey="overdue" fill="#7c3aed" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Sec>
      )}
      {(data.critical_scores||[]).length>0&&(
        <Sec title="Critical Scores — Immediate Review Required" icon={AlertTriangle} color="#dc2626">
          <Tbl headers={['Patient','Assessment','Score','Flag','Date']}
            rows={data.critical_scores.map(c=>[c.patient_name, c.assessment, `${c.score}`, c.flag, fmtD(c.date)])}/>
        </Sec>
      )}
      <Sec title="Patient Assessment Status" icon={Users} color="#0891b2" collapsible>
        <Tbl headers={['Patient','Risk','ESAS','PPS','PHQ-9','GAD-7','Overdue']}
          rows={(data.patients||[]).map(p=>{const a=p.assessments||{};
            const d=(item)=>{if(!item||item.days_since==null)return 'Never';return `${item.days_since}d ${item.overdue?'(!)':''}`;};
            return[p.patient_name, p.risk_level||'—', d(a.esas), d(a.pps), d(a.phq9), d(a.gad7),
              p.overdue_count>0 ? p.overdue.join(', ') : '✓ Up to date',
            ];
          })}/>
      </Sec>
    </div>
  );
}

function BereavementBody({data}) {
  const atRisk=data.families?.filter(f=>f.at_risk)||[];
  return (
    <div className="space-y-5">
      <KpiGrid items={[{label:'Total Families',value:data.summary?.total_families},{label:'At Risk',value:data.summary?.at_risk_families,warn:data.summary?.at_risk_families>0},{label:'Bereaved',value:data.summary?.bereaved_families,color:'#9d174d'},{label:'Engaged',value:data.summary?.engaged_families,color:'#059669'}]}/>
      {atRisk.length>0&&(
        <Sec title="Families Requiring Follow-Up" icon={Heart} color="#9d174d">
          {atRisk.map(f=>(
            <div key={f.family_user_id} className="mb-2.5 p-3 rounded-xl border border-rose-200 bg-rose-50">
              <p className="font-bold text-sm text-slate-800">{f.family_name} <span className="text-slate-500 font-normal">({f.relationship})</span></p>
              <p className="text-xs text-slate-600">Patient: {f.patient_name} · Status: {f.patient_status}</p>
              {f.phq9_score!=null&&<p className="text-xs text-amber-700">PHQ-9: {f.phq9_score} — {f.phq9_severity}</p>}
              {f.gad7_score!=null&&<p className="text-xs text-purple-700">GAD-7: {f.gad7_score} — {f.gad7_severity}</p>}
              {f.bereavement_entries===0&&<p className="text-xs text-red-600">No bereavement support engagement recorded</p>}
            </div>
          ))}
        </Sec>
      )}
      <Sec title="All Families" icon={Users} color="#374151" collapsible>
        <Tbl headers={['Family Member','Relationship','Patient','PHQ-9','GAD-7','Engagement','At Risk']}
          rows={(data.families||[]).map(f=>[
            f.family_name, f.relationship||'—', f.patient_name,
            f.phq9_score!=null ? `${f.phq9_score} (${f.phq9_severity||'—'})` : '—',
            f.gad7_score!=null ? `${f.gad7_score} (${f.gad7_severity||'—'})` : '—',
            `${f.bereavement_entries} entries`,
            f.at_risk ? '⚠ Yes — Follow up needed' : '✓ OK',
          ])}/>
      </Sec>
    </div>
  );
}

function GenericBody({data}) {
  return <pre className="text-xs overflow-auto bg-slate-50 rounded-xl p-4 max-h-96">{JSON.stringify(data,null,2)}</pre>;
}

/* ── Additional body renderers for all 12 report types ───────── */
function MedicationAdherenceBody({data}) {
  const s = data.summary || {};
  const statusColor = s.adherence_status === 'good' ? '#059669'
    : s.adherence_status === 'warning' ? '#d97706'
    : s.adherence_status === 'critical' ? '#dc2626' : '#94a3b8';
  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl border-2" style={{borderColor: statusColor, backgroundColor: statusColor+'14'}}>
        <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Overall Adherence Rate</p>
        <p className="text-3xl font-bold" style={{color: statusColor}}>
          {s.overall_adherence_pct != null ? s.overall_adherence_pct + '%' : 'No data'}
        </p>
        <p className="text-xs text-slate-600 mt-1">
          {s.adherence_status === 'good'    && '≥80% — Meeting clinical threshold (NHS Medicines Management)'}
          {s.adherence_status === 'warning' && '60–79% — Below threshold. Review with prescriber.'}
          {s.adherence_status === 'critical'&& '<60% — Critical. Immediate clinical review required.'}
          {s.adherence_status === 'no_data' && 'No adherence logs found for this period.'}
        </p>
      </div>
      <KpiGrid items={[
        {label:'Active Medications',value:s.total_active_medications},
        {label:'Doses Scheduled',   value:s.total_scheduled_doses},
        {label:'Doses Taken',       value:s.total_taken_doses, color:'#059669'},
        {label:'Doses Missed',      value:s.total_missed_doses, warn:s.total_missed_doses>0},
      ]}/>
      {(data.at_risk_medications||[]).length > 0 && (
        <Sec title="Medications Needing Attention (<80%)" icon={AlertTriangle} color="#dc2626">
          <Tbl headers={['Medication','Dose','Scheduled','Taken','Missed','Adherence']}
            rows={(data.at_risk_medications||[]).map(m=>[
              m.name, m.dose||'—', m.scheduled, m.taken, m.missed,
              m.adherence_pct != null ? m.adherence_pct+'%' : '—',
            ])}/>
        </Sec>
      )}
      <Sec title="All Medications" icon={Pill} color="#be123c" collapsible>
        <Tbl headers={['Medication','Dose','Frequency','Taken','Missed','Adherence','Status']}
          rows={(data.medications||[]).map(m=>[
            m.name, m.dose||'—', m.frequency||'—', m.taken, m.missed,
            m.adherence_pct != null ? m.adherence_pct+'%' : 'No data',
            m.status==='good'?'✓ Good':m.status==='warning'?'⚠ Low':m.status==='critical'?'✗ Critical':'—',
          ])}/>
      </Sec>
    </div>
  );
}

function CarePlanProgressBody({data}) {
  const s = data.summary || {};
  const barData = Object.entries(data.category_progress||{}).map(([k,v])=>({name:k.replace(/_/g,' '),progress:v}));
  return (
    <div className="space-y-5">
      <KpiGrid items={[
        {label:'Total Goals', value:s.total_goals},
        {label:'Achieved',    value:s.achieved,    color:'#059669'},
        {label:'In Progress', value:s.in_progress, color:'#0891b2'},
        {label:'Overdue',     value:s.overdue,     warn:s.overdue>0},
      ]}/>
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
          <span>Overall Progress</span><span>{s.overall_progress||0}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-3 rounded-full bg-teal-500" style={{width:`${s.overall_progress||0}%`}}/>
        </div>
      </div>
      {barData.length>0&&(
        <Sec title="Progress by Goal Category" icon={Target} color="#0d9488">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} layout="vertical">
              <XAxis type="number" tick={{fontSize:10}} domain={[0,100]}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:10}} width={100}/>
              <Tooltip formatter={v=>v+'%'}/><Bar dataKey="progress" fill="#0d9488" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Sec>
      )}
      {(data.overdue_goals||[]).length>0&&(
        <Sec title="Overdue Goals" icon={AlertTriangle} color="#dc2626">
          <Tbl headers={['Goal','Category','Priority','Progress','Target Date']}
            rows={(data.overdue_goals||[]).map(g=>[
              g.title.length>45?g.title.substring(0,45)+'…':g.title,
              g.category, g.priority, `${g.progress}%`, fmtD(g.target_date),
            ])}/>
        </Sec>
      )}
      <Sec title="All Goals" icon={FileText} color="#374151" collapsible>
        <Tbl headers={['Goal','Category','Status','Progress','Checklist','Source']}
          rows={(data.goals||[]).map(g=>[
            g.title.length>40?g.title.substring(0,40)+'…':g.title,
            g.category||'—', g.status, `${g.progress}%`,
            g.checklist.total>0?`${g.checklist.completed}/${g.checklist.total}`:'—',
            g.ai_suggested?'AI':'Manual',
          ])}/>
      </Sec>
    </div>
  );
}

function UserActivityBody({data}) {
  const s = data.summary||{};
  return (
    <div className="space-y-5">
      <KpiGrid items={[{label:'Users',value:s.total_users},{label:'Total Actions',value:s.total_actions},{label:'Active Mins',value:s.total_active_mins},{label:'Failed Logins',value:s.total_failed_logins,warn:s.total_failed_logins>0}]}/>
      {(data.users||[]).map(u=>(
        <Sec key={u.user_id} title={`${u.user_name} (${u.user_role})`} icon={User} color="#7c3aed" collapsible>
          <KpiGrid items={[{label:'Actions',value:u.total_actions},{label:'Sessions',value:u.active_sessions},{label:'Active Mins',value:u.total_active_mins},{label:'Logins',value:u.login_count}]}/>
          {(u.critical_actions||[]).length>0&&(
            <Tbl headers={['Timestamp','Action','Resource','Patient']}
              rows={u.critical_actions.slice(0,10).map(a=>[fmt(a.timestamp),a.action,a.resource||'—',a.patient_id?'#'+a.patient_id:'—'])}/>
          )}
        </Sec>
      ))}
    </div>
  );
}

function AuditTrailBody({data}) {
  const t = data.totals||{};
  return (
    <div className="space-y-5">
      <KpiGrid items={[{label:'Total Entries',value:t.total_entries},{label:'Critical',value:t.critical,warn:t.critical>0},{label:'High',value:t.high,color:'#d97706'},{label:'Failed',value:t.failed,warn:t.failed>0}]}/>
      <Sec title="Audit Entries" icon={Shield} color="#374151" collapsible>
        <Tbl headers={['Timestamp','User','Role','Action','Resource','Patient','Sev.','OK']}
          rows={(data.entries||[]).slice(0,80).map(e=>[
            fmt(e.timestamp),e.user_name||'—',e.user_role||'—',e.action,
            e.resource_type||'—',e.patient_id?'#'+e.patient_id:'—',
            e.severity,e.success?'✓':'✗',
          ])}/>
      </Sec>
    </div>
  );
}

function IncidentsBody({data}) {
  const s = data.summary||{};
  return (
    <div className="space-y-5">
      <KpiGrid items={[{label:'Total Incidents',value:s.total_incidents},{label:'Critical',value:s.critical,warn:s.critical>0},{label:'Unacknowledged',value:s.unacknowledged,warn:s.unacknowledged>0},{label:'Avg Response',value:s.avg_response_mins!=null?s.avg_response_mins.toFixed(1)+'m':'—'}]}/>
      <Sec title="Incident Log" icon={AlertTriangle} color="#d97706" collapsible>
        <Tbl headers={['Date/Time','Patient','Type','Severity','Response','Ack.','Overdue']}
          rows={(data.incidents||[]).map(i=>[
            fmt(i.created_at),i.patient_name||'—',i.alert_type||'—',i.severity,
            i.response_time_mins!=null?i.response_time_mins.toFixed(1)+'m':'Pending',
            i.is_acknowledged?'✓':'✗',i.overdue?'⚠ Yes':'No',
          ])}/>
      </Sec>
    </div>
  );
}

function CaregiverBody({data}) {
  const s = data.summary||{};const cgv = data.caregiver||{};
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
          {cgv.name?.split(' ').map(n=>n[0]).join('').slice(0,2)||'??'}
        </div>
        <div>
          <p className="font-bold text-slate-800">{cgv.name||'Unknown'}</p>
          <p className="text-xs text-slate-500 capitalize">{cgv.role} · @{cgv.username}</p>
        </div>
      </div>
      <KpiGrid items={[{label:'Patients Assigned',value:s.assigned_patients},{label:'Total Actions',value:s.total_actions},{label:'Active Mins',value:s.total_active_mins},{label:'Vitals Logged',value:s.vitals_logged,color:'#0891b2'}]}/>
      {(data.assigned_patients||[]).length>0&&(
        <Sec title="Assigned Patients" icon={Users} color="#1d4ed8">
          <Tbl headers={['Patient','Diagnosis','Risk Level','Assigned Since']}
            rows={data.assigned_patients.map(p=>[p.patient_name,p.diagnosis||'—',p.risk_level||'—',fmtD(p.assigned_since)])}/>
        </Sec>
      )}
    </div>
  );
}

/* ── Report Viewer ───────────────────────────────────────────── */
function ReportViewer({data,onClose}) {
  const meta  = REPORT_META[data.report_type] || {};
  const Icon  = meta.icon || FileText;
  const color = meta.color || '#0d9488';
  const genBy = data.generated_by?.name || data.generated_by?.full_name || '—';

  const renderBody = () => {
    switch (data.report_type) {
      case 'patient_summary':        return <PatientSummaryBody data={data}/>;
      case 'mdt_handover':           return <MdtHandoverBody data={data}/>;
      case 'advance_care_plan':      return <AdvanceCarePlanBody data={data}/>;
      case 'care_plan_progress':     return <CarePlanProgressBody data={data}/>;
      case 'assessment_completion':  return <AssessmentCompletionBody data={data}/>;
      case 'medication_adherence':   return <MedicationAdherenceBody data={data}/>;
      case 'bereavement_outcome':    return <BereavementBody data={data}/>;
      case 'population':             return <PopulationBody data={data}/>;
      case 'incidents':              return <IncidentsBody data={data}/>;
      case 'caregiver_performance':  return <CaregiverBody data={data}/>;
      case 'user_activity':          return <UserActivityBody data={data}/>;
      case 'audit_trail':            return <AuditTrailBody data={data}/>;
      default:                       return <GenericBody data={data}/>;
    }
  };

  // Print using a hidden iframe — no new window, triggers print dialog directly
  const handlePrint = useCallback(() => {
    const previewEl = document.getElementById('aura-report-preview-body');
    if (!previewEl) return;

    // Reuse or create hidden iframe
    let iframe = document.getElementById('aura-print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'aura-print-iframe';
      iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:0;height:0;border:none;';
      document.body.appendChild(iframe);
    }

    const html = `<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>${data.report_title || 'Aura Report'}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:system-ui,-apple-system,sans-serif;font-size:12px;color:#1e293b;background:white;padding:20px;}
        @page{size:A4 portrait;margin:12mm 10mm;}
        h1{font-size:18px;font-weight:700;color:#0f172a;margin-bottom:6px;}
        h3{font-size:11px;font-weight:700;color:#374151;}
        p,div,span{font-size:11px;}
        table{border-collapse:collapse;width:100%;margin-bottom:12px;}
        th{text-align:left;padding:5px 6px;background:#f1f5f9;border-bottom:2px solid #cbd5e1;font-weight:700;text-transform:uppercase;font-size:9px;color:#475569;letter-spacing:.04em;}
        td{padding:5px 6px;border-bottom:1px solid #f1f5f9;color:#334155;vertical-align:top;}
        .rpt-hdr{border-bottom:2px solid #334155;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start;}
        .rpt-hdr-left h1{margin-bottom:4px;}
        .rpt-hdr-meta{font-size:10px;color:#64748b;margin-top:2px;}
        .rpt-hdr-right{text-align:right;}
        .rpt-hdr-right .brand{font-weight:700;font-size:13px;color:#0f172a;}
        .confidentiality{border:2px solid #d97706;background:#fffbeb;padding:6px 12px;border-radius:6px;margin-bottom:16px;font-weight:700;font-size:10px;color:#92400e;}
        .section{border:1px solid #e2e8f0;border-radius:8px;margin-bottom:14px;overflow:hidden;page-break-inside:avoid;}
        .section-hdr{padding:8px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:11px;color:#374151;}
        .section-body{padding:10px 12px;}
        .kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px;}
        .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px;text-align:center;}
        .kpi-val{font-size:18px;font-weight:700;}
        .kpi-lbl{font-size:9px;color:#64748b;margin-top:2px;}
        .progress-bar-wrap{height:10px;background:#e2e8f0;border-radius:5px;overflow:hidden;margin:4px 0;}
        .progress-bar-fill{height:10px;background:#0d9488;border-radius:5px;}
        .footer{margin-top:20px;padding-top:8px;border-top:1px solid #e2e8f0;text-align:center;font-size:8px;color:#94a3b8;}
        /* recharts SVGs */
        .recharts-wrapper{page-break-inside:avoid;}
      </style>
    </head><body>
      <div class="rpt-hdr">
        <div class="rpt-hdr-left">
          <h1>${data.report_title}</h1>
          <div class="rpt-hdr-meta">Generated: ${fmt(data.generated_at)} · By: ${genBy} (${data.generated_by?.role || ''})</div>
          ${data.period ? `<div class="rpt-hdr-meta">Period: ${fmtD(data.period.from)} – ${fmtD(data.period.to)}</div>` : ''}
          ${data.standard ? `<div style="font-size:9px;color:#94a3b8;margin-top:4px;">Standards: ${data.standard}</div>` : ''}
        </div>
        <div class="rpt-hdr-right">
          <div class="brand">Project Aura</div>
          <div style="font-size:10px;color:#64748b;">Palliative Care Platform</div>
        </div>
      </div>
      ${data.confidentiality ? `<div class="confidentiality">${data.confidentiality}</div>` : ''}
      ${previewEl.innerHTML}
      <div class="footer">Project Aura · Printed ${new Date().toLocaleString('en-GB')} · ${data.confidentiality || 'CLINICAL IN CONFIDENCE'}</div>
    </body></html>`;

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    // Wait for iframe to render then print
    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch(e) {
        // Fallback: open in new tab if iframe print fails (some browsers block it)
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        setTimeout(() => { win.print(); }, 500);
      }
    };
    // Trigger load if already loaded
    if (doc.readyState === 'complete') {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  }, [data, genBy]);

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}>
      <motion.div initial={{scale:0.95,y:20}} animate={{scale:1,y:0}} exit={{scale:0.95}}
        onClick={e=>e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
          style={{borderTop:`4px solid ${color}`}}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{backgroundColor:color+'18'}}>
              <Icon size={18} style={{color}}/>
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm leading-tight">{data.report_title}</p>
              <p className="text-xs text-slate-500 mt-0.5">Generated {fmt(data.generated_at)} · {genBy} ({data.generated_by?.role})</p>
              {data.period&&<p className="text-xs text-slate-400">{fmtD(data.period.from)} — {fmtD(data.period.to)}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition">
              <Printer size={13}/> Print / PDF
            </button>
            <button onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 text-lg">
              ✕
            </button>
          </div>
        </div>

        {data.confidentiality&&(
          <div className="mx-6 mt-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <Lock size={12} className="text-amber-600 flex-shrink-0"/>
            <p className="text-[10px] font-bold text-amber-800">{data.confidentiality}</p>
          </div>
        )}

        {/* Screen preview (innerHTML copied to print window) */}
        <div id="aura-report-preview-body" className="px-6 py-6 space-y-5">
          {renderBody()}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Report Card ──────────────────────────────────────────────── */
function ReportCard({report,onGenerate,generating,patientId,caregiverId}) {
  const meta=REPORT_META[report.id]||{};
  const Icon=meta.icon||FileText;
  const color=meta.color||'#0d9488';
  const [expanded,setExpanded]=useState(false);
  const blocked=(meta.needsPatient&&!patientId)||(meta.needsCaregiver&&!caregiverId);
  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      style={{borderLeft:`4px solid ${color}`}}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{backgroundColor:color+'18'}}>
            <Icon size={16} style={{color}}/>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">{report.name}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{report.description}</p>
          </div>
        </div>
        {blocked&&(
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 mb-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg">
            <AlertTriangle size={11} className="text-amber-600 flex-shrink-0"/>
            <p className="text-[10px] text-amber-700 dark:text-amber-300">{meta.needsPatient?'Select a patient first.':'Select a caregiver first.'}</p>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={()=>onGenerate(report.id)} disabled={generating===report.id||blocked}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs text-white transition-all disabled:opacity-40 active:scale-95"
            style={{backgroundColor:color}}>
            {generating===report.id?<><Loader2 size={12} className="animate-spin"/> Generating…</>:<><FileText size={12}/> Generate</>}
          </button>
          <button onClick={()=>setExpanded(!expanded)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            {expanded?<ChevronUp size={13}/>:<ChevronDown size={13}/>}
          </button>
        </div>
        <AnimatePresence>
          {expanded&&(
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}}
              exit={{height:0,opacity:0}} className="overflow-hidden">
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Use For</p>
                  <div className="flex flex-wrap gap-1 mt-1">{(report.uses||[]).map(u=><span key={u} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{u}</span>)}</div>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Standard</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{report.standard}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Main Reports Page ────────────────────────────────────────── */
export default function Reports() {
  const {user}=useAuth();
  const navigate=useNavigate();
  const [activeTab,setActiveTab]=useState('clinical');
  const [generating,setGenerating]=useState(null);
  const [reportData,setReportData]=useState(null);
  const [showViewer,setShowViewer]=useState(false);
  const [patientId,setPatientId]=useState(null);
  const [userId,setUserId]=useState(null);
  const [caregiverId,setCaregiverId]=useState(null);
  const [dateFrom,setDateFrom]=useState('');
  const [dateTo,setDateTo]=useState('');
  const [minSeverity,setMinSeverity]=useState('high');

  // All hooks MUST run before any early return
  const {data:typesData,isLoading:typesLoading}=useQuery({
    queryKey:['report-types'],
    queryFn:()=>axios.get(`${API_URL}/api/reports/types`,{headers:authH()}).then(r=>r.data),
    staleTime:10*60*1000,retry:false,
    enabled:['admin','clinician'].includes(user?.role),
  });

  // Access guard — after all hooks
  if(!['admin','clinician'].includes(user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <Lock size={48} className="mx-auto text-slate-300 mb-4"/>
          <h2 className="text-xl font-bold text-slate-600">Access Restricted</h2>
          <p className="text-slate-400 mt-2">Reports are for Admin and Clinician roles only.</p>
          <button onClick={()=>navigate('/dashboard')} className="mt-4 px-5 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const allReports=typesData?.reports||[];
  const tabReports=allReports.filter(r=>(REPORT_META[r.id]?.tab||'clinical')===activeTab);

  const generateReport=async(reportId)=>{
    setGenerating(reportId);
    try {
      const p=new URLSearchParams();
      if(dateFrom) p.set('date_from',dateFrom);
      if(dateTo)   p.set('date_to',dateTo);
      const qs=p.toString()?'?'+p:'';
      let url;
      if(reportId==='patient_summary'){if(!patientId){toast.error('Select a patient');return;}url=`${API_URL}/api/reports/patient/${patientId}${qs}`;}
      else if(reportId==='mdt_handover')       url=`${API_URL}/api/reports/mdt-handover${qs}`;
      else if(reportId==='advance_care_plan')  {if(!patientId){toast.error('Select a patient');return;}url=`${API_URL}/api/reports/advance-care-plan/${patientId}${qs}`;}
      else if(reportId==='care_plan_progress') {if(!patientId){toast.error('Select a patient');return;}url=`${API_URL}/api/reports/care-plan-progress/${patientId}${qs}`;}
      else if(reportId==='assessment_completion') url=`${API_URL}/api/reports/assessment-completion${qs}`;
      else if(reportId==='medication_adherence'){if(!patientId){toast.error('Select a patient');return;}url=`${API_URL}/api/reports/medication-adherence/${patientId}${qs}`;}
      else if(reportId==='bereavement_outcome') url=`${API_URL}/api/reports/bereavement-outcome${qs}`;
      else if(reportId==='population')         url=`${API_URL}/api/reports/population`;
      else if(reportId==='incidents')          {p.set('min_severity',minSeverity);url=`${API_URL}/api/reports/incidents?${p}`;}
      else if(reportId==='caregiver_performance'){if(!caregiverId){toast.error('Select a caregiver');return;}url=`${API_URL}/api/reports/caregiver/${caregiverId}${qs}`;}
      else if(reportId==='user_activity')      {if(userId)p.set('user_id',String(userId));url=`${API_URL}/api/reports/user-activity?${p}`;}
      else if(reportId==='audit_trail')        url=`${API_URL}/api/reports/audit-trail${qs}`;
      else{toast.error('Unknown report');return;}

      const r=await axios.get(url,{headers:authH()});
      setReportData(r.data);
      setShowViewer(true);
      toast.success('Report generated');
    } catch(e){
      toast.error(e.response?.data?.detail||'Report generation failed');
      console.error('[Reports]',e);
    } finally{setGenerating(null);}
  };

  const showParams=tabReports.some(r=>{const m=REPORT_META[r.id];return m?.needsPatient||m?.needsCaregiver||m?.needsUser;});

  return (
    <div className="min-h-screen pb-12">
      <PageHeader image="/resources/african/african-health-tech.jpg" title="Clinical Reports"
        subtitle="Secure, audited report generation · 12 report types · HIPAA §164.312(b) compliant" icon={FileText}/>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Tab navigation ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-1.5 flex gap-1">
          {TABS.map(tab=>{
            const Icon=tab.icon;
            const count=allReports.filter(r=>(REPORT_META[r.id]?.tab||'clinical')===tab.id).length;
            const active=activeTab===tab.id;
            return (
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${active?'bg-teal-600 text-white shadow-sm':'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                <Icon size={15}/><span className="hidden sm:inline">{tab.label}</span>
                {count>0&&<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active?'bg-white/30 text-white':'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* ── Parameters panel (only when tab has reports needing selection) ── */}
        {showParams&&(
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Filter size={13} className="text-teal-600"/> Report Parameters
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <PatientPicker value={patientId} onChange={setPatientId}/>
              <UserPicker value={userId} onChange={setUserId} label="User (Activity Report)"/>
              <UserPicker value={caregiverId} onChange={setCaregiverId} label="Caregiver" roles={['caregiver','clinician']}/>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
              {[{label:'Date From',value:dateFrom,set:setDateFrom},{label:'Date To',value:dateTo,set:setDateTo}].map(({label,value,set})=>(
                <div key={label}>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
                  <input type="date" value={value} onChange={e=>set(e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-700 dark:text-slate-100"/>
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Min Severity</label>
                <SearchableSelect
                  accent="teal"
                  size="sm"
                  value={minSeverity}
                  onChange={v => setMinSeverity(v || 'high')}
                  allowClear={false}
                  options={['low','moderate','high','critical'].map(s => ({ value: s, label: s.charAt(0).toUpperCase()+s.slice(1) }))}
                  placeholder="Severity…"
                />
              </div>
              <button onClick={()=>{setPatientId(null);setUserId(null);setCaregiverId(null);setDateFrom('');setDateTo('');}}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-600 border border-slate-200 dark:border-slate-600 rounded-xl hover:border-red-300 transition">
                Clear
              </button>
            </div>
            {/* Active filter chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {patientId&&<span className="text-[10px] px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-200 font-medium">Patient #{patientId}</span>}
              {userId&&<span className="text-[10px] px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200 font-medium">User #{userId}</span>}
              {caregiverId&&<span className="text-[10px] px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 font-medium">Caregiver #{caregiverId}</span>}
              {dateFrom&&<span className="text-[10px] px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">From: {dateFrom}</span>}
              {dateTo&&<span className="text-[10px] px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">To: {dateTo}</span>}
            </div>
          </div>
        )}

        {/* ── Tab description ── */}
        <div className="flex items-center gap-2">
          {TABS.find(t=>t.id===activeTab)&&(()=>{const t=TABS.find(t=>t.id===activeTab);const Icon=t.icon;return(<><Icon size={14} className="text-slate-400"/><p className="text-sm text-slate-500">{t.desc}</p></>);})()}
          <span className="ml-auto text-xs text-slate-400">{tabReports.length} report{tabReports.length!==1?'s':''}</span>
        </div>

        {/* ── Report cards grid ── */}
        {typesLoading?(
          <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-teal-500"/></div>
        ):(
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tabReports.map(r=>(
              <ReportCard key={r.id} report={r} onGenerate={generateReport} generating={generating}
                patientId={patientId} userId={userId} caregiverId={caregiverId}/>
            ))}
            {tabReports.length===0&&(
              <div className="col-span-3 text-center py-16 text-slate-400">
                <FileText size={40} className="mx-auto mb-3 opacity-30"/>
                <p className="text-sm">No reports available for your role in this category.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Security notice ── */}
        <div className="flex items-start gap-3 px-5 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
          <Lock size={14} className="text-amber-600 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Security Notice</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">All report generations are logged to the system audit trail. Reports contain identifiable clinical data — handle per HIPAA §164.312(b), GDPR Art.30, and your organisation's data governance policy.</p>
          </div>
        </div>
      </div>

      {/* ── Report viewer ── */}
      <AnimatePresence>
        {showViewer&&reportData&&(
          <ReportViewer data={reportData} onClose={()=>setShowViewer(false)}/>
        )}
      </AnimatePresence>
    </div>
  );
}
