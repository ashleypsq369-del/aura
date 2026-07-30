/**
 * Reports Page — ProjectAura
 * Full rebuild: working patient/user search dropdowns, correct API field mapping,
 * complete report body renderers, proper error handling.
 * Standards: HIPAA §164.312(b), NHS NACEL 2024, HQIP, ISO 9001, CQC
 */
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Shield, Users, AlertTriangle,
  Activity, Clock, BarChart3, Search, Lock,
  Loader2, ChevronDown, ChevronUp, Printer, User,
  Calendar, Filter, CheckCircle, XCircle, TrendingDown,
  AlertCircle, Target,
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import toast from '../utils/toast';
import { API_URL } from '../api/client';

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

const REPORT_META = {
  patient_summary:       { icon: FileText,      color: '#0891b2', needsPatient: true },
  user_activity:         { icon: Clock,         color: '#7c3aed', needsUser: true },
  audit_trail:           { icon: Shield,        color: '#dc2626' },
  population:            { icon: BarChart3,     color: '#059669' },
  incidents:             { icon: AlertTriangle, color: '#d97706' },
  caregiver_performance: { icon: Users,         color: '#1d4ed8', needsCaregiver: true },
  medication_adherence:  { icon: Activity,      color: '#be123c', needsPatient: true },
  assessment_completion: { icon: CheckCircle,   color: '#0891b2' },
  care_plan_progress:    { icon: BarChart3,     color: '#059669', needsPatient: true },
};

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit',
  });
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

/* ── Shared UI atoms ──────────────────────────────────────────────────── */
function SevBadge({ sev }) {
  const cfg = {
    critical:'bg-red-100 text-red-700', high:'bg-amber-100 text-amber-700',
    moderate:'bg-yellow-100 text-yellow-700', low:'bg-green-100 text-green-700',
    info:'bg-blue-100 text-blue-700', normal:'bg-slate-100 text-slate-600',
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg[sev]||cfg.normal}`}>{sev||'—'}</span>;
}

function KpiGrid({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
      {items.map(({ label, value, color='#0d9488', warn }) => (
        <div key={label} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-center">
          <p className="text-xl font-bold" style={{ color: warn && value > 0 ? '#dc2626' : color }}>
            {value ?? '—'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{label}</p>
        </div>
      ))}
    </div>
  );
}

function Table({ headers, rows }) {
  if (!rows?.length) return <p className="text-xs text-slate-400 py-2">No data.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {headers.map(h => (
              <th key={h} className="text-left py-2 px-2 text-slate-500 font-semibold uppercase tracking-wide text-[10px] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40">
              {row.map((cell, j) => (
                <td key={j} className="py-2 px-2 text-slate-700 dark:text-slate-300">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ title, icon: Icon, color='#0d9488', children }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 dark:border-slate-700"
        style={{ backgroundColor: color + '14' }}>
        {Icon && <Icon size={15} style={{ color }} />}
        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">{title}</h3>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

/* ── Searchable dropdown for patients ────────────────────────────────── */
function PatientPicker({ value, onChange }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ['patients-list-report'],
    queryFn: () => axios.get(`${API_URL}/api/patients`, { headers: authH() }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const patients = (data?.patients || data || []);
  const filtered = patients.filter(p =>
    !q || p.full_name?.toLowerCase().includes(q.toLowerCase()) ||
    String(p.id).includes(q) || p.patient_code?.toLowerCase().includes(q.toLowerCase())
  );
  const selected = patients.find(p => p.id === value);

  return (
    <div className="relative">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Patient</label>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 text-left">
        <span className={selected ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}>
          {selected ? `${selected.full_name} (#${selected.id})` : 'Select patient…'}
        </span>
        <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
            <input autoFocus value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search by name or ID…"
              className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-slate-100 outline-none" />
          </div>
          {filtered.length === 0
            ? <p className="text-xs text-slate-400 px-3 py-3">No patients found</p>
            : filtered.slice(0, 30).map(p => (
              <button key={p.id} type="button"
                onClick={() => { onChange(p.id); setOpen(false); setQ(''); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-teal-50 dark:hover:bg-teal-900/20 flex items-center justify-between">
                <span className="font-medium text-slate-800 dark:text-slate-100">{p.full_name}</span>
                <span className="text-slate-400">{p.patient_code || '#'+p.id}</span>
              </button>
            ))
          }
        </div>
      )}
    </div>
  );
}

/* ── Searchable dropdown for users/caregivers ─────────────────────────── */
function UserPicker({ value, onChange, label = 'User', roles }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ['users-list-report'],
    queryFn: () => axios.get(`${API_URL}/api/admin/users`, { headers: authH() }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const all = (data?.users || data || []);
  const users = roles ? all.filter(u => roles.includes(u.role)) : all;
  const filtered = users.filter(u =>
    !q || u.full_name?.toLowerCase().includes(q.toLowerCase()) ||
    String(u.id).includes(q) || u.username?.toLowerCase().includes(q.toLowerCase())
  );
  const selected = users.find(u => u.id === value);

  return (
    <div className="relative">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 text-left">
        <span className={selected ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}>
          {selected ? `${selected.full_name} (#${selected.id})` : `All ${label.toLowerCase()}s…`}
        </span>
        <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
            <input autoFocus value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search by name or ID…"
              className="w-full text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-slate-100 outline-none" />
          </div>
          <button type="button" onClick={() => { onChange(null); setOpen(false); setQ(''); }}
            className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700">
            — All {label.toLowerCase()}s
          </button>
          {filtered.slice(0, 30).map(u => (
            <button key={u.id} type="button"
              onClick={() => { onChange(u.id); setOpen(false); setQ(''); }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-teal-50 dark:hover:bg-teal-900/20 flex items-center justify-between">
              <span className="font-medium text-slate-800 dark:text-slate-100">{u.full_name}</span>
              <span className="text-slate-400 capitalize">{u.role} #{u.id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Report body renderers ────────────────────────────────────────────── */
function PatientSummaryBody({ data }) {
  const p    = data.patient || {};
  const risk = data.latest_risk_prediction;
  const crit = data.critical_events || {};
  const esas = data.symptom_assessments?.esas_trend || [];
  const meds = data.medications || {};
  const audit= data.audit_trail || {};
  return (
    <div className="space-y-5">
      <Section title="Patient Demographics" icon={User} color="#0891b2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[['Full Name', p.full_name], ['Patient Code', p.patient_code], ['Age', p.age],
            ['Gender', p.gender], ['Diagnosis', p.primary_diagnosis], ['Status', p.status],
            ['Risk Level', p.risk_level], ['Risk Score', p.risk_score != null ? (p.risk_score*100).toFixed(1)+'%' : '—'],
            ['Care Setting', p.care_setting||'—'], ['Admission', fmtDate(p.admission_date)],
          ].map(([k,v]) => (
            <div key={k} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{k}</p>
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs mt-0.5 break-words">{v||'—'}</p>
            </div>
          ))}
        </div>
      </Section>

      {risk && (
        <Section title="Latest AI Risk Prediction" icon={Activity} color="#7c3aed">
          <KpiGrid items={[
            { label:'Risk Level', value: risk.risk_level?.toUpperCase(), color: risk.risk_level==='critical'?'#dc2626':'#7c3aed' },
            { label:'Risk Score', value: risk.risk_score!=null?(risk.risk_score*100).toFixed(1)+'%':'—' },
            { label:'Predicted', value: risk.predicted_at ? fmtDate(risk.predicted_at) : '—' },
          ]} />
          {risk.explanation && <p className="text-xs text-slate-600 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">{risk.explanation}</p>}
        </Section>
      )}

      <Section title="Critical Events & Alerts" icon={AlertTriangle} color="#dc2626">
        <KpiGrid items={[
          { label:'Total Alerts',    value: crit.total_alerts,    color:'#dc2626' },
          { label:'Critical',        value: crit.critical_count,  warn: crit.critical_count > 0 },
          { label:'High',            value: crit.high_count,      color:'#d97706' },
          { label:'Unacknowledged',  value: crit.unacknowledged,  warn: crit.unacknowledged > 0 },
        ]} />
        <Table headers={['Date/Time','Type','Severity','Response','Ack.']}
          rows={(crit.events||[]).map(e => [
            fmt(e.date), e.type, <SevBadge sev={e.severity} />,
            e.response_time_hours!=null ? e.response_time_hours+'h' : 'Pending',
            e.acknowledged ? <CheckCircle size={13} className="text-green-600"/> : <XCircle size={13} className="text-red-400"/>,
          ])} />
      </Section>

      <Section title="ESAS Symptom Trend" icon={Activity} color="#059669">
        {esas.length > 0
          ? <Table headers={['Date','TSDS','Pain','Depression','Anxiety','Wellbeing','Flag']}
              rows={esas.map(e => [fmtDate(e.date), e.tsds+'/90', e.pain, e.depression, e.anxiety, e.wellbeing,
                <SevBadge sev={e.risk_flag} />])} />
          : <p className="text-xs text-slate-400">No ESAS assessments in this period.</p>}
      </Section>

      <Section title="Medications" icon={FileText} color="#be123c">
        <KpiGrid items={[{ label:'Active', value: meds.active_count }, { label:'Total', value: meds.total_count }]} />
        <Table headers={['Medication','Dose','Frequency','Route','Active']}
          rows={(meds.list||[]).map(m => [m.name, m.dose||'—', m.frequency||'—', m.route||'—',
            m.is_active ? <CheckCircle size={13} className="text-green-600"/> : <XCircle size={13} className="text-slate-300"/>])} />
      </Section>

      <Section title="Audit Trail (this patient)" icon={Shield} color="#374151">
        <p className="text-xs text-slate-500 mb-2">{audit.total_actions} recorded actions in period.</p>
        <Table headers={['Timestamp','Action','Role','Success']}
          rows={(audit.actions||[]).slice(0,20).map(a => [
            fmt(a.timestamp), a.action, a.user_role,
            a.success ? <CheckCircle size={13} className="text-green-600"/> : <XCircle size={13} className="text-red-400"/>,
          ])} />
      </Section>
    </div>
  );
}

function UserActivityBody({ data }) {
  const s = data.summary || {};
  return (
    <div className="space-y-5">
      <Section title="Summary" icon={Clock} color="#7c3aed">
        <KpiGrid items={[
          { label:'Users', value: s.total_users },
          { label:'Total Actions', value: s.total_actions },
          { label:'Active Mins', value: s.total_active_mins },
          { label:'Failed Logins', value: s.total_failed_logins, warn: s.total_failed_logins > 0 },
        ]} />
      </Section>
      {(data.users||[]).map(u => (
        <Section key={u.user_id} title={`${u.user_name} (${u.user_role})`} icon={User} color="#7c3aed">
          <KpiGrid items={[
            { label:'Actions', value: u.total_actions },
            { label:'Sessions', value: u.active_sessions },
            { label:'Active Mins', value: u.total_active_mins },
            { label:'Logins', value: u.login_count },
          ]} />
          {(u.critical_actions||[]).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Critical Actions</p>
              <Table headers={['Timestamp','Action','Resource','Patient','IP']}
                rows={u.critical_actions.slice(0,10).map(a => [
                  fmt(a.timestamp), a.action, a.resource||'—',
                  a.patient_id ? '#'+a.patient_id : '—', a.ip||'—'
                ])} />
            </div>
          )}
        </Section>
      ))}
    </div>
  );
}

function AuditTrailBody({ data }) {
  const t = data.totals || {};
  return (
    <div className="space-y-5">
      <Section title="Totals" icon={Shield} color="#dc2626">
        <KpiGrid items={[
          { label:'Total Entries', value: t.total_entries },
          { label:'Critical', value: t.critical, warn: t.critical > 0 },
          { label:'High', value: t.high, color:'#d97706' },
          { label:'Failed', value: t.failed, warn: t.failed > 0 },
        ]} />
      </Section>
      <Section title="Audit Entries" icon={Shield} color="#374151">
        <Table headers={['Timestamp','User','Role','Action','Resource','Patient','Severity','Success','IP']}
          rows={(data.entries||[]).slice(0,100).map(e => [
            fmt(e.timestamp), e.user_name||'—', e.user_role||'—', e.action,
            e.resource_type||'—', e.patient_id ? '#'+e.patient_id : '—',
            <SevBadge sev={e.severity} />,
            e.success ? <CheckCircle size={13} className="text-green-600"/> : <XCircle size={13} className="text-red-400"/>,
            e.ip_address||'—',
          ])} />
      </Section>
    </div>
  );
}

function PopulationBody({ data }) {
  const s = data.summary || {};
  const risk = data.risk_distribution || {};
  return (
    <div className="space-y-5">
      <Section title="System Overview" icon={BarChart3} color="#059669">
        <KpiGrid items={[
          { label:'Active Patients', value: s.total_active_patients },
          { label:'Unack. Alerts', value: s.unacknowledged_alerts, warn: s.unacknowledged_alerts > 0 },
          { label:'Critical Alerts', value: s.critical_alerts, warn: s.critical_alerts > 0 },
          { label:'ESAS 7d %', value: s.esas_completion_rate_pct!=null ? s.esas_completion_rate_pct+'%' : '—' },
        ]} />
      </Section>
      <Section title="Risk Distribution" icon={AlertTriangle} color="#d97706">
        <div className="grid grid-cols-4 gap-3">
          {['critical','high','moderate','low'].map(lvl => {
            const colors = { critical:'#dc2626', high:'#d97706', moderate:'#f59e0b', low:'#059669' };
            return (
              <div key={lvl} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <p className="text-2xl font-bold" style={{ color: colors[lvl] }}>{risk[lvl] || 0}</p>
                <p className="text-[11px] text-slate-500 capitalize">{lvl}</p>
              </div>
            );
          })}
        </div>
      </Section>
      {(data.care_settings && Object.keys(data.care_settings).length > 0) && (
        <Section title="Care Settings" icon={Activity} color="#0891b2">
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(data.care_settings).map(([k,v]) => (
              <div key={k} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5 text-center">
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{v}</p>
                <p className="text-[10px] text-slate-500 capitalize">{k.replace(/_/g,' ')}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
      {(data.top_diagnoses||[]).length > 0 && (
        <Section title="Top Diagnoses" icon={FileText} color="#0891b2">
          <Table headers={['Diagnosis','Patient Count']}
            rows={data.top_diagnoses.map(d => [d.diagnosis, d.count])} />
        </Section>
      )}
    </div>
  );
}

function IncidentsBody({ data }) {
  const s = data.summary || {};
  return (
    <div className="space-y-5">
      <Section title="Incident Summary" icon={AlertTriangle} color="#dc2626">
        <KpiGrid items={[
          { label:'Total Incidents', value: s.total_incidents },
          { label:'Critical', value: s.critical, warn: s.critical > 0 },
          { label:'Unacknowledged', value: s.unacknowledged, warn: s.unacknowledged > 0 },
          { label:'Overdue', value: s.overdue, warn: s.overdue > 0 },
        ]} />
        <KpiGrid items={[
          { label:'Avg Response (mins)', value: s.avg_response_mins!=null ? s.avg_response_mins.toFixed(1) : '—' },
          { label:'Fastest (mins)', value: s.fastest_response_mins!=null ? s.fastest_response_mins.toFixed(1) : '—', color:'#059669' },
          { label:'Slowest (mins)', value: s.slowest_response_mins!=null ? s.slowest_response_mins.toFixed(1) : '—', color:'#dc2626' },
        ]} />
      </Section>
      <Section title="Incident Log" icon={AlertTriangle} color="#d97706">
        <Table headers={['Date/Time','Patient','Type','Severity','Response','Ack.','Overdue']}
          rows={(data.incidents||[]).map(i => [
            fmt(i.created_at), i.patient_name||'—', i.alert_type||'—',
            <SevBadge sev={i.severity} />,
            i.response_time_mins!=null ? i.response_time_mins.toFixed(1)+' mins' : 'Pending',
            i.is_acknowledged ? <CheckCircle size={13} className="text-green-600"/> : <XCircle size={13} className="text-red-400"/>,
            i.overdue ? '⚠️ Yes' : 'No',
          ])} />
      </Section>
    </div>
  );
}

function CaregiverBody({ data }) {
  const s = data.summary || {};
  const cgv = data.caregiver || {};
  return (
    <div className="space-y-5">
      <Section title="Caregiver Profile" icon={User} color="#1d4ed8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
            {cgv.name?.split(' ').map(n=>n[0]).join('').slice(0,2)||'??'}
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">{cgv.name||'Unknown'}</p>
            <p className="text-xs text-slate-500 capitalize">{cgv.role} · @{cgv.username}</p>
          </div>
        </div>
        <KpiGrid items={[
          { label:'Patients Assigned', value: s.assigned_patients },
          { label:'Total Actions', value: s.total_actions },
          { label:'Active Mins', value: s.total_active_mins },
          { label:'Logins', value: s.login_count },
        ]} />
        <KpiGrid items={[
          { label:'Vitals Logged', value: s.vitals_logged, color:'#0891b2' },
          { label:'Assessments', value: s.assessments_submitted, color:'#059669' },
          { label:'Sessions', value: s.active_sessions },
        ]} />
      </Section>
      {(data.assigned_patients||[]).length > 0 && (
        <Section title="Assigned Patients" icon={Users} color="#1d4ed8">
          <Table headers={['Patient','Diagnosis','Risk Level','Assigned Since']}
            rows={data.assigned_patients.map(p => [
              p.patient_name, p.diagnosis||'—',
              <SevBadge sev={p.risk_level?.toLowerCase()||'normal'} />,
              fmtDate(p.assigned_since),
            ])} />
        </Section>
      )}
    </div>
  );
}

/* ── New Report Body Renderers ───────────────────────────────────────── */

function MedicationAdherenceBody({ data }) {
  const s = data.summary || {};
  const adherenceColor = s.adherence_status === 'good' ? '#059669'
    : s.adherence_status === 'warning' ? '#d97706'
    : s.adherence_status === 'critical' ? '#dc2626' : '#94a3b8';

  return (
    <div className="space-y-5">
      <Section title="Overall Adherence" icon={Activity} color={adherenceColor}>
        <KpiGrid items={[
          { label: 'Active Medications', value: s.total_active_medications },
          { label: 'Doses Scheduled',    value: s.total_scheduled_doses },
          { label: 'Doses Taken',        value: s.total_taken_doses,   color: '#059669' },
          { label: 'Doses Missed',       value: s.total_missed_doses,  warn: s.total_missed_doses > 0 },
        ]} />
        <div className="flex items-center gap-4 p-4 rounded-xl mt-2"
          style={{ backgroundColor: adherenceColor + '14', border: `1.5px solid ${adherenceColor}30` }}>
          <div className="text-4xl font-bold" style={{ color: adherenceColor }}>
            {s.overall_adherence_pct != null ? s.overall_adherence_pct + '%' : 'No data'}
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Overall Adherence Rate</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {s.adherence_status === 'good' && '≥80% — Meeting clinical threshold (NHS Medicines Management)'}
              {s.adherence_status === 'warning' && '60–79% — Below threshold. Review with prescriber.'}
              {s.adherence_status === 'critical' && '<60% — Critical. Immediate clinical review required.'}
              {s.adherence_status === 'no_data' && 'No adherence logs found for this period.'}
            </p>
          </div>
        </div>
      </Section>

      {(data.at_risk_medications || []).length > 0 && (
        <Section title="⚠️ Medications Needing Attention (<80%)" icon={AlertTriangle} color="#dc2626">
          <Table
            headers={['Medication', 'Dose', 'Frequency', 'Scheduled', 'Taken', 'Missed', 'Adherence', 'Status']}
            rows={(data.at_risk_medications || []).map(m => [
              m.name, m.dose || '—', m.frequency || '—',
              m.scheduled, m.taken, m.missed,
              m.adherence_pct != null ? m.adherence_pct + '%' : '—',
              <SevBadge sev={m.status === 'critical' ? 'critical' : m.status === 'warning' ? 'high' : 'normal'} />,
            ])}
          />
        </Section>
      )}

      <Section title="All Medications" icon={FileText} color="#be123c">
        {(data.medications || []).map(m => (
          <div key={m.medication_id} className="mb-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{m.name}</p>
                <p className="text-xs text-slate-500">{m.dose} · {m.frequency} · {m.route}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: m.status === 'good' ? '#059669' : m.status === 'warning' ? '#d97706' : m.status === 'critical' ? '#dc2626' : '#94a3b8' }}>
                  {m.adherence_pct != null ? m.adherence_pct + '%' : 'No data'}
                </p>
                <SevBadge sev={m.status === 'good' ? 'normal' : m.status === 'warning' ? 'high' : m.status === 'critical' ? 'critical' : 'info'} />
              </div>
            </div>
            {m.scheduled > 0 && (
              <div className="grid grid-cols-4 gap-2 text-center text-xs mt-2">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{m.scheduled}</p>
                  <p className="text-slate-500">Scheduled</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                  <p className="font-bold text-green-700">{m.taken}</p>
                  <p className="text-green-600">Taken</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                  <p className="font-bold text-red-700">{m.missed}</p>
                  <p className="text-red-600">Missed</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    {Object.values(m.missed_patterns || {}).reduce((a, b) => a + b, 0)}
                  </p>
                  <p className="text-slate-500">Pattern</p>
                </div>
              </div>
            )}
            {(m.recent_missed || []).length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Recent Missed Doses</p>
                {m.recent_missed.slice(0, 3).map((miss, i) => (
                  <p key={i} className="text-xs text-red-600 dark:text-red-400">
                    • {fmtDate(miss.scheduled_at)} — {miss.skipped_reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </Section>
    </div>
  );
}

function AssessmentCompletionBody({ data }) {
  const s = data.summary || {};
  const thresholds = data.thresholds || {};
  return (
    <div className="space-y-5">
      <Section title="System Overview" icon={CheckCircle} color="#0891b2">
        <KpiGrid items={[
          { label: 'Total Patients', value: s.total_patients },
          { label: 'Patients Overdue', value: s.patients_overdue, warn: s.patients_overdue > 0 },
          { label: 'Critical Scores', value: s.critical_scores, warn: s.critical_scores > 0 },
        ]} />
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
          {Object.entries(s.overdue_by_type || {}).map(([type, count]) => (
            <div key={type} className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <p className="text-lg font-bold" style={{ color: count > 0 ? '#dc2626' : '#059669' }}>{count}</p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">{type.toUpperCase()}</p>
              <p className="text-[10px] text-slate-400">overdue</p>
            </div>
          ))}
        </div>
      </Section>

      {(data.critical_scores || []).length > 0 && (
        <Section title="🚨 Critical Scores — Immediate Review Required" icon={AlertTriangle} color="#dc2626">
          <Table
            headers={['Patient', 'Assessment', 'Score', 'Clinical Flag', 'Date']}
            rows={data.critical_scores.map(c => [
              c.patient_name, c.assessment,
              <span className="font-bold text-red-700">{c.score}</span>,
              <span className="text-xs text-red-600 font-medium">{c.flag}</span>,
              fmtDate(c.date),
            ])}
          />
        </Section>
      )}

      <Section title="Patient Assessment Status" icon={Activity} color="#0891b2">
        <Table
          headers={['Patient', 'Diagnosis', 'Risk', 'ESAS', 'PPS', 'PHQ-9', 'GAD-7', 'Barthel', 'Overdue']}
          rows={(data.patients || []).map(p => {
            const a = p.assessments || {};
            const daysBadge = (item, threshold) => {
              if (!item) return <span className="text-slate-400 text-[10px]">Never</span>;
              const d = item.days_since;
              if (d == null) return <span className="text-slate-400 text-[10px]">Never</span>;
              const color = item.overdue ? 'text-red-600 font-bold' : d <= Math.ceil(threshold / 2) ? 'text-green-600' : 'text-amber-600';
              return <span className={`text-[10px] ${color}`}>{d}d ago</span>;
            };
            return [
              p.patient_name, p.diagnosis ? p.diagnosis.substring(0, 20) + '…' : '—',
              <SevBadge sev={p.risk_level?.toLowerCase() || 'normal'} />,
              daysBadge(a.esas, thresholds.esas || 1),
              daysBadge(a.pps, thresholds.pps || 30),
              daysBadge(a.phq9, thresholds.phq9 || 14),
              daysBadge(a.gad7, thresholds.gad7 || 14),
              daysBadge(a.barthel, thresholds.barthel || 30),
              p.overdue_count > 0
                ? <span className="text-[10px] font-bold text-red-600">{p.overdue.join(', ')}</span>
                : <CheckCircle size={12} className="text-green-600" />,
            ];
          })}
        />
      </Section>
    </div>
  );
}

function CarePlanProgressBody({ data }) {
  const s = data.summary || {};
  const catColors = {
    pain: '#dc2626', symptom: '#d97706', functional: '#0891b2',
    psychological: '#7c3aed', spiritual: '#059669', family: '#be123c',
    medication: '#0369a1', nutrition: '#ca8a04', safety: '#374151',
    general: '#64748b',
  };
  return (
    <div className="space-y-5">
      <Section title="Care Plan Summary" icon={Target} color="#059669">
        <KpiGrid items={[
          { label: 'Total Goals',   value: s.total_goals },
          { label: 'Achieved',      value: s.achieved,     color: '#059669' },
          { label: 'In Progress',   value: s.in_progress,  color: '#0891b2' },
          { label: 'Pending',       value: s.pending,      color: '#d97706' },
          { label: 'Overdue Goals', value: s.overdue,      warn: s.overdue > 0 },
          { label: 'AI Suggested',  value: s.ai_suggested, color: '#7c3aed' },
        ]} />
        {/* Overall progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            <span>Overall Progress</span>
            <span>{s.overall_progress || 0}%</span>
          </div>
          <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-3 rounded-full transition-all"
              style={{ width: `${s.overall_progress || 0}%`, background: 'linear-gradient(90deg,#059669,#0d9488)' }} />
          </div>
        </div>
      </Section>

      {Object.keys(data.category_progress || {}).length > 0 && (
        <Section title="Progress by Goal Category" icon={BarChart3} color="#0d9488">
          <div className="space-y-2">
            {Object.entries(data.category_progress || {}).map(([cat, pct]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-0.5">
                  <span className="capitalize">{cat.replace(/_/g, ' ')}</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-2 rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: catColors[cat] || '#0d9488' }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {(data.overdue_goals || []).length > 0 && (
        <Section title="⚠️ Overdue Goals" icon={AlertTriangle} color="#dc2626">
          <Table
            headers={['Goal', 'Category', 'Priority', 'Progress', 'Target Date', 'Status']}
            rows={data.overdue_goals.map(g => [
              g.title.length > 40 ? g.title.substring(0, 40) + '…' : g.title,
              <span className="capitalize text-xs">{g.category}</span>,
              <SevBadge sev={g.priority === 'critical' ? 'critical' : g.priority === 'high' ? 'high' : 'normal'} />,
              <div className="flex items-center gap-1">
                <div className="w-16 h-1.5 rounded-full bg-slate-200">
                  <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${g.progress}%` }} />
                </div>
                <span className="text-xs">{g.progress}%</span>
              </div>,
              fmtDate(g.target_date),
              <SevBadge sev="high" />,
            ])}
          />
        </Section>
      )}

      <Section title="All Goals" icon={FileText} color="#374151">
        <Table
          headers={['Goal', 'Category', 'Priority', 'Status', 'Progress', 'Checklist', 'AI']}
          rows={(data.goals || []).map(g => [
            g.title.length > 35 ? g.title.substring(0, 35) + '…' : g.title,
            <span className="capitalize text-xs">{g.category}</span>,
            <SevBadge sev={g.priority === 'critical' ? 'critical' : g.priority === 'high' ? 'high' : 'normal'} />,
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
              g.status === 'achieved' ? 'bg-green-100 text-green-700'
              : g.status === 'in_progress' ? 'bg-blue-100 text-blue-700'
              : g.status === 'discontinued' ? 'bg-slate-100 text-slate-500'
              : 'bg-amber-100 text-amber-700'
            }`}>{g.status}</span>,
            <div className="flex items-center gap-1">
              <div className="w-12 h-1.5 rounded-full bg-slate-200">
                <div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${g.progress}%` }} />
              </div>
              <span className="text-[10px]">{g.progress}%</span>
            </div>,
            g.checklist.total > 0
              ? `${g.checklist.completed}/${g.checklist.total}`
              : '—',
            g.ai_suggested ? '🤖' : '👤',
          ])}
        />
      </Section>
    </div>
  );
}

/* ── Report Viewer Modal ─────────────────────────────────────────────── */
function ReportViewer({ data, onClose, onPrint }) {
  const meta = REPORT_META[data.report_type] || {};
  const Icon = meta.icon || FileText;
  const color = meta.color || '#0d9488';
  // generated_by.name OR generated_by.full_name
  const genBy = data.generated_by?.name || data.generated_by?.full_name || data.generated_by?.username || '—';

  const renderBody = () => {
    switch (data.report_type) {
      case 'patient_summary':       return <PatientSummaryBody data={data} />;
      case 'user_activity':         return <UserActivityBody data={data} />;
      case 'audit_trail':           return <AuditTrailBody data={data} />;
      case 'population':            return <PopulationBody data={data} />;
      case 'incidents':             return <IncidentsBody data={data} />;
      case 'caregiver_performance': return <CaregiverBody data={data} />;
      case 'medication_adherence':  return <MedicationAdherenceBody data={data} />;
      case 'assessment_completion': return <AssessmentCompletionBody data={data} />;
      case 'care_plan_progress':    return <CarePlanProgressBody data={data} />;
      default: return <pre className="text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
    }
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}>
      <motion.div initial={{ scale:0.95, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl my-4"
        id="report-print-area">

        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700"
          style={{ borderTop: `4px solid ${color}` }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: color+'18' }}>
                <Icon size={22} style={{ color }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{data.report_title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generated {fmt(data.generated_at)} by {genBy} ({data.generated_by?.role})
                </p>
                {data.period && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Period: {fmtDate(data.period.from)} → {fmtDate(data.period.to)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={onPrint}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition">
                <Printer size={14}/> Print / PDF
              </button>
              <button onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500">
                ✕
              </button>
            </div>
          </div>
          {data.confidentiality && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
              <Lock size={13} className="text-amber-600 flex-shrink-0"/>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">{data.confidentiality}</p>
            </div>
          )}
          {data.standard && <p className="mt-2 text-[10px] text-slate-400">Standards: {data.standard}</p>}
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-6">{renderBody()}</div>
      </motion.div>
    </motion.div>
  );
}

/* ── Report Card ─────────────────────────────────────────────────────── */
function ReportCard({ report, onGenerate, generating, patientId, userId, caregiverId }) {
  const meta = REPORT_META[report.id] || {};
  const Icon = meta.icon || FileText;
  const color = meta.color || '#0d9488';
  const [expanded, setExpanded] = useState(false);

  // Warn if required ID is missing
  const missingPatient  = meta.needsPatient  && !patientId;
  const missingCaregiver= meta.needsCaregiver && !caregiverId;
  const blocked = missingPatient || missingCaregiver;

  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: color+'18', border:`1.5px solid ${color}30` }}>
            <Icon size={20} style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{report.name}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{report.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(report.uses||[]).map(u => (
                <span key={u} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">{u}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Missing ID warning */}
        {blocked && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg">
            <AlertTriangle size={12} className="text-amber-600 flex-shrink-0"/>
            <p className="text-[11px] text-amber-700 dark:text-amber-300">
              {missingPatient ? 'Select a patient above first.' : 'Select a caregiver above first.'}
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <button onClick={() => onGenerate(report.id)} disabled={generating === report.id || blocked}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40"
            style={{ backgroundColor: color }}>
            {generating === report.id
              ? <><Loader2 size={14} className="animate-spin"/> Generating…</>
              : <><FileText size={14}/> Generate Report</>}
          </button>
          <button onClick={() => setExpanded(!expanded)}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            {expanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
              exit={{ height:0, opacity:0 }} className="overflow-hidden">
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Standard</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{report.standard}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Access</p>
                  <div className="flex gap-1 flex-wrap mt-0.5">
                    {(report.access||[]).map(r => (
                      <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 font-medium capitalize">{r}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Main Reports Page ───────────────────────────────────────────────── */
export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [showViewer, setShowViewer] = useState(false);

  // Picker state — IDs selected from dropdowns
  const [patientId,   setPatientId]   = useState(null);
  const [userId,      setUserId]      = useState(null);
  const [caregiverId, setCaregiverId] = useState(null);
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');
  const [minSeverity, setMinSeverity] = useState('high');

  // Access guard
  if (!['admin','clinician'].includes(user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <Lock size={48} className="mx-auto text-slate-300 mb-4"/>
          <h2 className="text-xl font-bold text-slate-600">Access Restricted</h2>
          <p className="text-slate-400 mt-2">Reports are available to Admin and Clinician roles only.</p>
          <button onClick={() => navigate('/dashboard')}
            className="mt-4 px-5 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Fetch available report types
  const { data: typesData, isLoading: typesLoading } = useQuery({
    queryKey: ['report-types'],
    queryFn: () => axios.get(`${API_URL}/api/reports/types`, { headers: authH() }).then(r => r.data),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const reports = typesData?.reports || [];

  const generateReport = async (reportId) => {
    setGenerating(reportId);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo)   params.set('date_to', dateTo);

      let url;
      if (reportId === 'patient_summary') {
        if (!patientId) { toast.error('Please select a patient first'); setGenerating(null); return; }
        url = `${API_URL}/api/reports/patient/${patientId}?${params}`;
      } else if (reportId === 'user_activity') {
        if (userId) params.set('user_id', String(userId));
        url = `${API_URL}/api/reports/user-activity?${params}`;
      } else if (reportId === 'audit_trail') {
        url = `${API_URL}/api/reports/audit-trail?${params}`;
      } else if (reportId === 'population') {
        url = `${API_URL}/api/reports/population`;
      } else if (reportId === 'incidents') {
        params.set('min_severity', minSeverity);
        url = `${API_URL}/api/reports/incidents?${params}`;
      } else if (reportId === 'caregiver_performance') {
        if (!caregiverId) { toast.error('Please select a caregiver first'); setGenerating(null); return; }
        url = `${API_URL}/api/reports/caregiver/${caregiverId}?${params}`;
      } else if (reportId === 'medication_adherence') {
        if (!patientId) { toast.error('Please select a patient first'); setGenerating(null); return; }
        url = `${API_URL}/api/reports/medication-adherence/${patientId}?${params}`;
      } else if (reportId === 'assessment_completion') {
        url = `${API_URL}/api/reports/assessment-completion?${params}`;
      } else if (reportId === 'care_plan_progress') {
        if (!patientId) { toast.error('Please select a patient first'); setGenerating(null); return; }
        url = `${API_URL}/api/reports/care-plan-progress/${patientId}?${params}`;
      } else {
        toast.error('Unknown report type'); setGenerating(null); return;
      }

      const r = await axios.get(url, { headers: authH() });
      setReportData(r.data);
      setShowViewer(true);
      toast.success('Report generated successfully');
    } catch (e) {
      const detail = e.response?.data?.detail || e.message || 'Report generation failed';
      toast.error(detail);
      console.error('[Reports]', e);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        image="/resources/african/african-health-tech.jpg"
        title="Clinical Reports"
        subtitle="Secure, audited report generation — HIPAA §164.312(b) compliant"
        icon={FileText}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Parameters Panel ─────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2">
            <Filter size={15} className="text-teal-600"/>
            Report Parameters
          </h2>
          <p className="text-xs text-slate-400 mb-4">Set filters before generating. Patient and Caregiver selectors are required for those reports.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <PatientPicker value={patientId} onChange={setPatientId}/>
            <UserPicker value={userId} onChange={setUserId} label="User (Activity Report)" />
            <UserPicker value={caregiverId} onChange={setCaregiverId} label="Caregiver" roles={['caregiver','clinician']} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label:'Date From', value:dateFrom, set:setDateFrom, type:'date' },
              { label:'Date To',   value:dateTo,   set:setDateTo,   type:'date' },
            ].map(({ label, value, set, type }) => (
              <div key={label}>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
                <input type={type} value={value} onChange={e => set(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-700 dark:text-slate-100"/>
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Min Severity (Incidents)</label>
              <select value={minSeverity} onChange={e => setMinSeverity(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-700 dark:text-slate-100">
                {['low','moderate','high','critical'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {/* Quick clear */}
            <div className="flex items-end">
              <button onClick={() => { setPatientId(null); setUserId(null); setCaregiverId(null); setDateFrom(''); setDateTo(''); }}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-600 border border-slate-200 dark:border-slate-600 rounded-xl hover:border-red-300 transition">
                Clear Filters
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {patientId && <span className="text-[11px] px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-200 font-medium">Patient #{patientId}</span>}
            {userId    && <span className="text-[11px] px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200 font-medium">User #{userId}</span>}
            {caregiverId && <span className="text-[11px] px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 font-medium">Caregiver #{caregiverId}</span>}
            {dateFrom  && <span className="text-[11px] px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200 font-medium">From: {dateFrom}</span>}
            {dateTo    && <span className="text-[11px] px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200 font-medium">To: {dateTo}</span>}
          </div>
        </div>

        {/* ── Report Cards ─────────────────────────────────────── */}
        {typesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-teal-500"/>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText size={40} className="mx-auto mb-3 opacity-30"/>
            <p className="text-sm">No reports available for your role.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map(r => (
              <ReportCard key={r.id} report={r} onGenerate={generateReport} generating={generating}
                patientId={patientId} userId={userId} caregiverId={caregiverId} />
            ))}
          </div>
        )}

        {/* ── Security notice ───────────────────────────────────── */}
        <div className="flex items-start gap-3 px-5 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
          <Lock size={15} className="text-amber-600 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Security Notice</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              All report generations are logged to the system audit trail under your account.
              Reports contain identifiable patient and staff data — handle in accordance with
              HIPAA §164.312(b), GDPR Art.30, and your organisation's data governance policy.
              Do not share, print, or store unsecured.
            </p>
          </div>
        </div>
      </div>

      {/* ── Viewer Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showViewer && reportData && (
          <ReportViewer data={reportData} onClose={() => setShowViewer(false)}
            onPrint={() => window.print()} />
        )}
      </AnimatePresence>
    </div>
  );
}
