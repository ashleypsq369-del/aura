/**
 * Reports Page — ProjectAura
 * ===========================
 * Secure clinical and operational report generation.
 * All report generations are logged to the audit trail.
 *
 * Reports available (by role):
 *   admin:    all 6 reports
 *   clinician: patient summary, audit trail, population, incidents, caregiver
 *
 * Standards: HIPAA §164.312(b), NHS NACEL 2024, HQIP Clinical Audit Guide,
 *            ISO 9001 Traceability, CQC Fundamental Standards
 */
import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Shield, Users, AlertTriangle,
  Activity, Clock, BarChart3, Search, Calendar,
  Loader2, CheckCircle, Lock, ChevronDown, ChevronUp,
  Printer, RefreshCw, Eye, User,
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import toast from '../utils/toast';
import { API_URL } from '../api/client';

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

const REPORT_ICONS = {
  patient_summary:     FileText,
  user_activity:       Clock,
  audit_trail:         Shield,
  population:          BarChart3,
  incidents:           AlertTriangle,
  caregiver_performance: Users,
};

const REPORT_COLORS = {
  patient_summary:     '#0891b2',
  user_activity:       '#7c3aed',
  audit_trail:         '#dc2626',
  population:          '#059669',
  incidents:           '#d97706',
  caregiver_performance: '#1d4ed8',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day:'2-digit', month:'short', year:'numeric',
    hour:'2-digit', minute:'2-digit'
  });
}

function ReportCard({ report, onGenerate, generating }) {
  const Icon = REPORT_ICONS[report.id] || FileText;
  const color = REPORT_COLORS[report.id] || '#0d9488';
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: color + '18', border: `1.5px solid ${color}30` }}>
            <Icon size={20} style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{report.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{report.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {report.uses?.map(u => (
                <span key={u} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">{u}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => onGenerate(report.id)}
            disabled={generating === report.id}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: color }}
          >
            {generating === report.id
              ? <><Loader2 size={14} className="animate-spin" /> Generating...</>
              : <><FileText size={14} /> Generate Report</>
            }
          </button>
          <button onClick={() => setExpanded(!expanded)}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Standard</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{report.standard}</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-2 mb-1">Access</p>
                <div className="flex gap-1">
                  {report.access?.map(r => (
                    <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 font-medium capitalize">{r}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ReportViewer({ data, onClose, onPrint }) {
  if (!data) return null;
  const Icon = REPORT_ICONS[data.report_type] || FileText;
  const color = REPORT_COLORS[data.report_type] || '#0d9488';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl my-4"
        id="report-print-area"
      >
        {/* Report header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700"
          style={{ borderTop: `4px solid ${color}` }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: color + '18' }}>
                <Icon size={22} style={{ color }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{data.report_title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generated {formatDate(data.generated_at)} by {data.generated_by?.name} ({data.generated_by?.role})
                </p>
                {data.period && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Period: {formatDate(data.period.from)} — {formatDate(data.period.to)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={onPrint}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition">
                <Printer size={14} /> Print / PDF
              </button>
              <button onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500">
                ✕
              </button>
            </div>
          </div>

          {data.confidentiality && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
              <Lock size={13} className="text-amber-600 flex-shrink-0" />
              <p className="text-xs font-semibold text-amber-800">{data.confidentiality}</p>
            </div>
          )}
          {data.standard && (
            <p className="mt-2 text-[10px] text-slate-400">Standards: {data.standard}</p>
          )}
        </div>

        {/* Report body */}
        <div className="px-8 py-6 space-y-6">
          <ReportBody data={data} />
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReportBody({ data }) {
  const type = data.report_type;

  if (type === 'patient_summary') return <PatientSummaryBody data={data} />;
  if (type === 'user_activity')   return <UserActivityBody data={data} />;
  if (type === 'audit_trail')     return <AuditTrailBody data={data} />;
  if (type === 'population')      return <PopulationBody data={data} />;
  if (type === 'incidents')       return <IncidentsBody data={data} />;
  if (type === 'caregiver_performance') return <CaregiverBody data={data} />;
  return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>;
}

function SectionBox({ title, icon: Icon, color = '#0d9488', children }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 dark:border-slate-700"
        style={{ backgroundColor: color + '10' }}>
        {Icon && <Icon size={15} style={{ color }} />}
        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">{title}</h3>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

function KpiRow({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(({ label, value, color = '#0d9488', warn }) => (
        <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
          <p className={`text-2xl font-bold ${warn ? 'text-red-600' : ''}`} style={!warn ? { color } : {}}>{value ?? '—'}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

function SeverityBadge({ sev }) {
  const cfg = {
    critical: 'bg-red-100 text-red-700',
    high:     'bg-amber-100 text-amber-700',
    moderate: 'bg-yellow-100 text-yellow-700',
    low:      'bg-green-100 text-green-700',
    info:     'bg-blue-100 text-blue-700',
    normal:   'bg-slate-100 text-slate-600',
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg[sev] || cfg.normal}`}>{sev}</span>;
}

function DataTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200">
            {headers.map(h => <th key={h} className="text-left py-2 px-2 text-slate-500 font-semibold uppercase tracking-wide text-[10px]">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              {row.map((cell, j) => <td key={j} className="py-2 px-2 text-slate-700 dark:text-slate-300">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Report body renderers ─────────────────────────────────────────────────

function PatientSummaryBody({ data }) {
  const p = data.patient || {};
  const risk = data.latest_risk_prediction;
  const vitals = data.vitals_summary;
  const crit = data.critical_events;
  const esas = data.symptom_assessments?.esas_trend || [];

  return (
    <div className="space-y-5">
      <SectionBox title="Patient Demographics" icon={User} color="#0891b2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {[['Name', p.full_name],['Code', p.patient_code],['Age', p.age],
            ['Gender', p.gender],['Diagnosis', p.primary_diagnosis],
            ['Status', p.status],['Risk Level', p.risk_level],['Risk Score', p.risk_score ? (p.risk_score*100).toFixed(1)+'%' : '—'],
            ['Care Setting', p.care_setting || 'Unknown'],
          ].map(([k,v]) => (
            <div key={k} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
              <p className="text-[10px] text-slate-400 font-medium uppercase">{k}</p>
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs mt-0.5">{v || '—'}</p>
            </div>
          ))}
        </div>
      </SectionBox>

      {risk && (
        <SectionBox title="Latest AI Risk Prediction" icon={Activity} color="#7c3aed">
          <KpiRow items={[
            { label: 'Risk Level', value: risk.risk_level?.toUpperCase(), color: risk.risk_level === 'critical' ? '#dc2626' : '#7c3aed' },
            { label: 'Risk Score', value: risk.risk_score ? (risk.risk_score*100).toFixed(1)+'%' : '—' },
            { label: 'Predicted', value: risk.predicted_at ? new Date(risk.predicted_at).toLocaleDateString('en-GB') : '—' },
          ]} />
          {risk.explanation && <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">{risk.explanation}</p>}
        </SectionBox>
      )}

      <SectionBox title="Critical Events" icon={AlertTriangle} color="#dc2626">
        <KpiRow items={[
          { label: 'Total Alerts', value: crit?.total_alerts, color: '#dc2626' },
          { label: 'Critical', value: crit?.critical_count, warn: crit?.critical_count > 0 },
          { label: 'High', value: crit?.high_count, color: '#d97706' },
          { label: 'Unacknowledged', value: crit?.unacknowledged, warn: crit?.unacknowledged > 0 },
        ]} />
        {crit?.events?.length > 0 && (
          <div className="mt-3">
            <DataTable
              headers={['Date/Time','Type','Severity','Response Time','Acknowledged']}
              rows={crit.events.map(e => [
                formatDate(e.date), e.type, <SeverityBadge sev={e.severity} />,
                e.response_time_hours != null ? e.response_time_hours+'h' : 'Pending',
                e.acknowledged ? '✅' : '❌',
              ])}
            />
          </div>
        )}
      </SectionBox>

      <SectionBox title="ESAS Symptom Trend" icon={Activity} color="#059669">
        {esas.length > 0 ? (
          <DataTable
            headers={['Date','TSDS','Pain','Depression','Anxiety','Wellbeing','Risk Flag']}
            rows={esas.map(e => [
              new Date(e.date).toLocaleDateString('en-GB'), e.tsds+'/90',
              e.pain, e.depression, e.anxiety, e.wellbeing,
              <SeverityBadge sev={e.risk_flag === 'critical' ? 'critical' : e.risk_flag === 'high' ? 'high' : 'normal'} />,
            ])}
          />
        ) : <p className="text-sm text-slate-400">No ESAS assessments in this period.</p>}
      </SectionBox>

      <SectionBox title="Medications" icon={FileText} color="#be123c">
        <KpiRow items={[
          { label: 'Active', value: data.medications?.active_count },
          { label: 'Total', value: data.medications?.total_count },
        ]} />
        {data.medications?.list?.length > 0 && (
          <div className="mt-3">
            <DataTable
              headers={['Medication','Dose','Frequency','Route','Active']}
              rows={data.medications.list.map(m => [m.name, m.dose, m.frequency, m.route, m.is_active ? '✅' : '❌'])}
            />
          </div>
        )}
      </SectionBox>

      <SectionBox title="Audit Trail (this patient)" icon={Shield} color="#374151">
        <p className="text-xs text-slate-500 mb-2">{data.audit_trail?.total_actions} recorded actions in period.</p>
        {data.audit_trail?.actions?.length > 0 && (
          <DataTable
            headers={['Timestamp','Action','Role','Success']}
            rows={data.audit_trail.actions.slice(0,20).map(a => [
              formatDate(a.timestamp), a.action, a.user_role, a.success ? '✅' : '❌'
            ])}
          />
        )}
      </SectionBox>
    </div>
  );
}

function UserActivityBody({ data }) {
  return (
    <div className="space-y-5">
      <SectionBox title="Summary" icon={Clock} color="#7c3aed">
        <KpiRow items={[
          { label: 'Users', value: data.summary?.total_users },
          { label: 'Total Actions', value: data.summary?.total_actions },
          { label: 'Active Time (mins)', value: data.summary?.total_active_mins },
          { label: 'Failed Logins', value: data.summary?.total_failed_logins, warn: data.summary?.total_failed_logins > 0 },
        ]} />
      </SectionBox>
      {data.users?.map(u => (
        <SectionBox key={u.user_id} title={`${u.user_name} (${u.user_role})`} icon={User} color="#7c3aed">
          <KpiRow items={[
            { label: 'Actions', value: u.total_actions },
            { label: 'Sessions', value: u.active_sessions },
            { label: 'Active Mins', value: u.total_active_mins },
            { label: 'Logins', value: u.login_count },
          ]} />
          {u.critical_actions?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-600 mb-2">Critical Actions</p>
              <DataTable
                headers={['Timestamp','Action','Resource','Patient','IP']}
                rows={u.critical_actions.slice(0,10).map(a => [
                  formatDate(a.timestamp), a.action, a.resource,
                  a.patient_id ? '#'+a.patient_id : '—', a.ip || '—'
                ])}
              />
            </div>
          )}
        </SectionBox>
      ))}
    </div>
  );
}

function AuditTrailBody({ data }) {
  const SCOLOR = { critical:'#dc2626', high:'#d97706', normal:'#64748b', info:'#0891b2' };
  return (
    <div className="space-y-5">
      <SectionBox title="Totals" icon={Shield} color="#dc2626">
        <KpiRow items={[
          { label: 'Total Entries', value: data.totals?.total_entries },
          { label: 'Critical', value: data.totals?.critical, warn: data.totals?.critical > 0 },
          { label: 'High', value: data.totals?.high, color: '#d97706' },
          { label: 'Failed', value: data.totals?.failed, warn: data.totals?.failed > 0 },
        ]} />
      </SectionBox>
      <SectionBox title="Audit Entries" icon={Shield} color="#374151">
        <DataTable
          headers={['Timestamp','User','Role','Action','Resource','Patient','Severity','Success','IP']}
          rows={(data.entries || []).slice(0,100).map(e => [
            formatDate(e.timestamp), e.user_name, e.user_role,
            e.action, e.resource_type, e.patient_id ? '#'+e.patient_id : '—',
            <SeverityBadge sev={e.severity} />, e.success ? '✅' : '❌', e.ip_address || '—',
          ])}
        />
      </SectionBox>
    </div>
  );
}

function PopulationBody({ data }) {
  const s = data.summary || {};
  const risk = data.risk_distribution || {};
  return (
    <div className="space-y-5">
      <SectionBox title="System Overview" icon={BarChart3} color="#059669">
        <KpiRow items={[
          { label: 'Active Patients', value: s.total_active_patients },
          { label: 'Unack. Alerts', value: s.unacknowledged_alerts, warn: s.unacknowledged_alerts > 0 },
          { label: 'Critical Alerts', value: s.critical_alerts, warn: s.critical_alerts > 0 },
          { label: 'ESAS (7d) %', value: s.esas_completion_rate_pct+'%' },
        ]} />
      </SectionBox>
      <SectionBox title="Risk Distribution" icon={AlertTriangle} color="#d97706">
        <div className="grid grid-cols-4 gap-3">
          {['critical','high','moderate','low'].map(lvl => (
            <div key={lvl} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <p className="text-2xl font-bold" style={{color: lvl==='critical'?'#dc2626':lvl==='high'?'#d97706':lvl==='moderate'?'#f59e0b':'#059669'}}>
                {risk[lvl] || 0}
              </p>
              <p className="text-[11px] text-slate-500 capitalize">{lvl}</p>
            </div>
          ))}
        </div>
      </SectionBox>
      {data.top_diagnoses?.length > 0 && (
        <SectionBox title="Top Diagnoses" icon={FileText} color="#0891b2">
          <DataTable headers={['Diagnosis','Patient Count']} rows={data.top_diagnoses.map(d => [d.diagnosis, d.count])} />
        </SectionBox>
      )}
    </div>
  );
}

function IncidentsBody({ data }) {
  const s = data.summary || {};
  return (
    <div className="space-y-5">
      <SectionBox title="Incident Summary" icon={AlertTriangle} color="#dc2626">
        <KpiRow items={[
          { label: 'Total Incidents', value: s.total_incidents },
          { label: 'Critical', value: s.critical, warn: s.critical > 0 },
          { label: 'Unacknowledged', value: s.unacknowledged, warn: s.unacknowledged > 0 },
          { label: 'Overdue', value: s.overdue, warn: s.overdue > 0 },
        ]} />
        <KpiRow items={[
          { label: 'Avg Response (mins)', value: s.avg_response_mins },
          { label: 'Fastest (mins)', value: s.fastest_response_mins, color: '#059669' },
          { label: 'Slowest (mins)', value: s.slowest_response_mins, color: '#dc2626' },
        ]} />
      </SectionBox>
      <SectionBox title="Incident Log" icon={AlertTriangle} color="#d97706">
        <DataTable
          headers={['Date/Time','Patient','Type','Severity','Response (mins)','Acknowledged','Overdue']}
          rows={(data.incidents || []).map(i => [
            formatDate(i.created_at), i.patient_name, i.alert_type,
            <SeverityBadge sev={i.severity} />,
            i.response_time_mins ?? 'Pending',
            i.is_acknowledged ? '✅' : '❌',
            i.overdue ? '⚠️ Yes' : 'No',
          ])}
        />
      </SectionBox>
    </div>
  );
}

function CaregiverBody({ data }) {
  const s = data.summary || {};
  return (
    <div className="space-y-5">
      <SectionBox title="Caregiver Profile" icon={User} color="#1d4ed8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
            {data.caregiver?.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">{data.caregiver?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{data.caregiver?.role} · @{data.caregiver?.username}</p>
          </div>
        </div>
        <KpiRow items={[
          { label: 'Patients Assigned', value: s.assigned_patients },
          { label: 'Total Actions', value: s.total_actions },
          { label: 'Active Mins', value: s.total_active_mins },
          { label: 'Logins', value: s.login_count },
        ]} />
        <KpiRow items={[
          { label: 'Vitals Logged', value: s.vitals_logged, color: '#0891b2' },
          { label: 'Assessments Done', value: s.assessments_submitted, color: '#059669' },
          { label: 'Sessions', value: s.active_sessions },
        ]} />
      </SectionBox>
      {data.assigned_patients?.length > 0 && (
        <SectionBox title="Assigned Patients" icon={Users} color="#1d4ed8">
          <DataTable
            headers={['Patient','Diagnosis','Risk Level','Assigned Since']}
            rows={data.assigned_patients.map(p => [
              p.patient_name, p.diagnosis, <SeverityBadge sev={p.risk_level?.toLowerCase()||'normal'} />,
              p.assigned_since ? new Date(p.assigned_since).toLocaleDateString('en-GB') : '—',
            ])}
          />
        </SectionBox>
      )}
    </div>
  );
}

// ── Main Reports Page ────────────────────────────────────────────────────

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [showViewer, setShowViewer] = useState(false);

  // Form state for parameterised reports
  const [patientId, setPatientId] = useState('');
  const [userId, setUserId] = useState('');
  const [caregiverId, setCaregiverId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minSeverity, setMinSeverity] = useState('high');

  if (!['admin','clinician'].includes(user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <Lock size={48} className="mx-auto text-slate-300 mb-4" />
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
  const { data: typesData } = useQuery({
    queryKey: ['report-types'],
    queryFn: () => axios.get(`${API_URL}/api/reports/types`, { headers: authH() }).then(r => r.data),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const reports = typesData?.reports || [];

  const generateReport = async (reportId) => {
    setGenerating(reportId);
    try {
      let url = '';
      const params = new URLSearchParams();
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo)   params.set('date_to',   dateTo);
      const qs = params.toString() ? '?' + params : '';

      if (reportId === 'patient_summary') {
        if (!patientId) { toast.error('Enter a Patient ID first'); setGenerating(null); return; }
        url = `${API_URL}/api/reports/patient/${patientId}${qs}`;
      } else if (reportId === 'user_activity') {
        const p = new URLSearchParams(params);
        if (userId) p.set('user_id', userId);
        url = `${API_URL}/api/reports/user-activity?${p}`;
      } else if (reportId === 'audit_trail') {
        url = `${API_URL}/api/reports/audit-trail${qs}`;
      } else if (reportId === 'population') {
        url = `${API_URL}/api/reports/population`;
      } else if (reportId === 'incidents') {
        const p = new URLSearchParams(params);
        p.set('min_severity', minSeverity);
        url = `${API_URL}/api/reports/incidents?${p}`;
      } else if (reportId === 'caregiver_performance') {
        if (!caregiverId) { toast.error('Enter a Caregiver User ID first'); setGenerating(null); return; }
        url = `${API_URL}/api/reports/caregiver/${caregiverId}${qs}`;
      }

      const r = await axios.get(url, { headers: authH() });
      setReportData(r.data);
      setShowViewer(true);
      toast.success('Report generated');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Report generation failed');
    } finally {
      setGenerating(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${reportData.report_type}_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON report downloaded');
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

        {/* Parameters panel */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Search size={15} className="text-teal-600" /> Report Parameters
            <span className="text-xs text-slate-400 font-normal ml-2">Set filters before generating any report</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Patient ID', value: patientId, set: setPatientId, ph: 'e.g. 3' },
              { label: 'User ID (activity)', value: userId, set: setUserId, ph: 'All users' },
              { label: 'Caregiver User ID', value: caregiverId, set: setCaregiverId, ph: 'e.g. 12' },
              { label: 'Date From', value: dateFrom, set: setDateFrom, type: 'date' },
              { label: 'Date To',   value: dateTo,   set: setDateTo,   type: 'date' },
            ].map(({ label, value, set, ph, type='text' }) => (
              <div key={label}>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
                <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={ph}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-700 dark:text-slate-100" />
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Min Severity</label>
              <select value={minSeverity} onChange={e => setMinSeverity(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-700 dark:text-slate-100">
                {['low','moderate','high','critical'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Report cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map(r => (
            <ReportCard key={r.id} report={r} onGenerate={generateReport} generating={generating} />
          ))}
        </div>

        {/* Security notice */}
        <div className="flex items-start gap-3 px-5 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
          <Lock size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Security Notice</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              All report generations are logged to the system audit trail under your user account.
              Reports contain identifiable patient and staff data — handle in accordance with
              HIPAA §164.312(b), GDPR Art.30, and your organisation's data governance policy.
              Do not share, print, or store unsecured.
            </p>
          </div>
        </div>

      </div>

      {/* Report viewer modal */}
      <AnimatePresence>
        {showViewer && reportData && (
          <ReportViewer
            data={reportData}
            onClose={() => setShowViewer(false)}
            onPrint={handlePrint}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
