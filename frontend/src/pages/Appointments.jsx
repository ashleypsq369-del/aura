/**
 * Appointments — redesigned to match Alerts.jsx design system
 * Pattern: motion.div min-h-screen space-y-5 pb-8, px-6 sections
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { appointmentsAPI, patientsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { usePatientId } from '../hooks/usePatientId';
import { useCareSettingContext } from '../context/CareSettingContext';
import axios from 'axios';
import { API_URL } from '../api/client';
import PageHeader from '../components/PageHeader';
import toast from '../utils/toast';
import ReminderBell from '../components/ReminderBell';
import SearchableSelect from '../components/ui/SearchableSelect';
import {
  Calendar, Plus, X, CheckCircle, Search, Clock,
  MapPin, Loader2, CheckSquare, XCircle, Bell, Sparkles,
  ChevronDown, ChevronUp, ListFilter,
} from 'lucide-react';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const APPT_TYPES = [
  'Palliative Consultation','Pain Management Review','Physiotherapy',
  'Occupational Therapy','Social Work','Chaplaincy / Spiritual',
  'Psychiatry / Psychology','Nursing Assessment','Family Meeting',
  'Medication Review','Telehealth Follow-up',
];
const LOCATIONS = [
  'Inpatient Ward','Outpatient Clinic','Home Visit',
  'Hospice Centre','Telehealth','Emergency Department',
  'Korle Bu Teaching Hospital','Ridge Hospital','37 Military Hospital',
];
const STATUS_CFG = {
  scheduled: { borderL:'border-l-blue-500',   bg:'bg-white',       badge:'badge-moderate', label:'Scheduled', pulse:false },
  completed: { borderL:'border-l-emerald-500', bg:'bg-emerald-50',  badge:'badge-stable',   label:'Completed', pulse:false },
  cancelled: { borderL:'border-l-slate-400',   bg:'bg-slate-50',    badge:'badge-info',     label:'Cancelled', pulse:false },
  today:     { borderL:'border-l-teal-500',    bg:'bg-teal-50',     badge:'badge-low',      label:'Today',     pulse:true  },
};

function isToday(d)  { const t = new Date(); const n = new Date(d); return t.toDateString() === n.toDateString(); }
function isPast(d)   { return new Date(d) < new Date(); }
function timeUntil(d) {
  const diff = new Date(d) - new Date();
  if (diff < 0) return null;
  const m = Math.round(diff / 60000);
  if (m < 60) return `in ${m}m`;
  if (m < 1440) return `in ${Math.round(m/60)}h`;
  return `in ${Math.round(m/1440)}d`;
}

/* ── KPI card ─────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, icon:Icon, color, selected, onClick, subtitle }) {
  return (
    <button onClick={onClick}
      className={`relative rounded-xl border-2 px-4 py-3 text-left w-full transition-all duration-150 ${
        selected ? `${color} border-current shadow-md scale-[1.01]` : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}>
      {selected && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor:'currentColor'}}/>}
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${selected?'bg-white/30':'bg-slate-100'}`}>
          <Icon size={13} className={selected?'text-current':'text-slate-500'}/>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${selected?'text-current opacity-80':'text-slate-500'}`}>{label}</span>
      </div>
      <p className={`text-2xl font-bold tabular-nums leading-none ${selected?'text-current':'text-slate-800'}`}>{value}</p>
      {subtitle && <p className={`text-[11px] mt-1 ${selected?'text-current opacity-70':'text-slate-400'}`}>{subtitle}</p>}
    </button>
  );
}

/* PatientSearch replaced by SearchableSelect */

/* ── Schedule Modal ──────────────────────────────────────────────────────── */
const EMPTY_FORM = { appointment_type:'Palliative Consultation', scheduled_at:'', location:'Outpatient Clinic', location_detail:'', notes:'' };

function ScheduleModal({ onClose, onSave, pending }) {
  const [f, setF] = useState(EMPTY_FORM);
  const up = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const valid = f.appointment_type && f.scheduled_at && f.location;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{scale:.95,y:20}} animate={{scale:1,y:0}} exit={{scale:.95,y:20}}
        onClick={e=>e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center"><Calendar size={15}/></div>
            <h2 className="font-bold text-slate-800">Schedule Appointment</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X size={16} className="text-slate-400"/></button>
        </div>
        <div className="p-6 space-y-4">
          <SearchableSelect
            label="Type *"
            accent="blue"
            value={f.appointment_type}
            onChange={v => setF(p => ({ ...p, appointment_type: v || 'Palliative Consultation' }))}
            options={APPT_TYPES.map(t => ({ value: t, label: t }))}
            allowClear={false}
            placeholder="Select appointment type…"
          />
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date & Time *</label>
            <input type="datetime-local" value={f.scheduled_at} onChange={up('scheduled_at')}
              min={new Date().toISOString().slice(0,16)}
              className="w-full border border-slate-300 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm outline-none"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SearchableSelect
              label="Location *"
              accent="blue"
              value={f.location}
              onChange={v => setF(p => ({ ...p, location: v || 'Outpatient Clinic' }))}
              options={LOCATIONS.map(l => ({ value: l, label: l }))}
              allowClear={false}
              placeholder="Select location…"
            />
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Detail</label>
              <input value={f.location_detail} onChange={up('location_detail')} placeholder="e.g. Room 4B"
                className="w-full border border-slate-300 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm outline-none"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea value={f.notes} onChange={up('notes')} rows={3}
              className="w-full border border-slate-300 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none"/>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-xl font-semibold text-sm hover:bg-white">Cancel</button>
          <button onClick={()=>onSave(f)} disabled={!valid||pending}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {pending?<Loader2 size={13} className="animate-spin"/>:<CheckCircle size={13}/>}
            Schedule
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Appointment card (AlertCard style) ─────────────────────────────────── */
function AppointmentCard({ appt, canSchedule, onComplete, onCancel }) {
  const today   = isToday(appt.scheduled_at);
  const past    = isPast(appt.scheduled_at);
  const status  = today && appt.status === 'scheduled' ? 'today' : (appt.status || 'scheduled');
  const cfg     = STATUS_CFG[status] || STATUS_CFG.scheduled;
  const until   = !past && appt.status === 'scheduled' ? timeUntil(appt.scheduled_at) : null;

  return (
    <motion.div layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
      className={`group border-l-4 ${cfg.borderL} ${cfg.bg} rounded-r-xl border border-slate-200 p-4 transition-shadow hover:shadow-md ${past&&appt.status==='scheduled'?'opacity-70':''}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex-shrink-0 ${cfg.pulse?'animate-pulse':''}`}>
          <Calendar className={`w-5 h-5 ${today?'text-teal-600':appt.status==='completed'?'text-emerald-600':appt.status==='cancelled'?'text-slate-400':'text-blue-600'}`}/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-sm">{appt.appointment_type}</span>
              <span className={cfg.badge}>{cfg.label}</span>
              {until && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-0.5">
                  <Clock size={9}/> {until}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
                <Clock size={11}/>
                {new Date(appt.scheduled_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                {' '}
                {new Date(appt.scheduled_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
              </span>
              <ReminderBell
                label={`${appt.appointment_type} - ${new Date(appt.scheduled_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}`}
                type="appointment"
                defaultTime={new Date(appt.scheduled_at).toTimeString().slice(0,5)}
                size="sm"
              />
            </div>
          </div>

          <p className="text-slate-600 text-sm mt-1 flex items-center gap-1.5">
            <MapPin size={13} className="text-slate-400 flex-shrink-0"/>
            {appt.location || '—'}
            {appt.location_detail && <span className="text-slate-400">· {appt.location_detail}</span>}
          </p>
          {appt.notes && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{appt.notes}</p>}

          {canSchedule && appt.status === 'scheduled' && (
            <div className="flex gap-2 mt-3">
              <button onClick={() => onComplete(appt.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition">
                <CheckSquare size={11}/> Complete
              </button>
              <button onClick={() => onCancel(appt.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition">
                <XCircle size={11}/> Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function Appointments() {
  const { user }       = useAuth();
  const queryClient    = useQueryClient();
  const isStaff    = ['clinician','admin','caregiver'].includes(user?.role);
  const isPatient  = user?.role === 'patient';
  const isFamily   = user?.role === 'family';
  const canSchedule = ['clinician','admin'].includes(user?.role); // only clinical staff can create

  // For patients/family: resolve linked patient record via hook
  const { patientId: ownPatientId } = usePatientId();

  // Care setting gate — hospice patients don't visit clinics
  const { careSetting, isHidden } = useCareSettingContext();
  const appointmentsHidden = (isPatient || isFamily) && isHidden('/appointments');

  const [staffPatientId, setStaffPatientId] = useState(null);
  const patientId  = isStaff ? staffPatientId : ownPatientId;
  const setPatientId = isStaff ? setStaffPatientId : () => {};

  const [filterStatus, setFilterStatus] = useState('active');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [resolvedExpanded, setResolvedExpanded] = useState(false);

  const { data: patientsRaw } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsAPI.getAll().then(r => r.data),
    enabled: isStaff,
    staleTime: 5 * 60 * 1000,
  });
  const patientList = Array.isArray(patientsRaw) ? patientsRaw : patientsRaw?.patients || [];

  // Auto-select first patient for staff so data shows immediately
  useEffect(() => {
    if (isStaff && !staffPatientId && patientList.length > 0) {
      setStaffPatientId(patientList[0].id);
    }
  }, [patientList, isStaff, staffPatientId]);

  const { data: apptsRaw, isLoading } = useQuery({
    queryKey: ['appointments', patientId],
    queryFn: () => appointmentsAPI.getPatientAppointments(patientId).then(r => r.data),
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 60000,
  });
  const appts = Array.isArray(apptsRaw) ? apptsRaw : [];

  // Preferences for patient-facing priority display
  const { data: prefsData } = useQuery({
    queryKey: ['prefs-mine', user?.id],
    queryFn: () => axios.get(`${API_URL}/api/preferences/my`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(r => r.data),
    enabled: isPatient && !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(todayStart.getTime() + 86400000);

  const kpi = useMemo(() => ({
    upcoming: appts.filter(a => new Date(a.scheduled_at) > now && a.status !== 'cancelled' && a.status !== 'completed').length,
    today:    appts.filter(a => { const d = new Date(a.scheduled_at); return d >= todayStart && d < todayEnd && a.status !== 'cancelled'; }).length,
    completed:appts.filter(a => a.status === 'completed').length,
    cancelled:appts.filter(a => a.status === 'cancelled').length,
  }), [appts]);

  const { upcomingAppts, pastAppts } = useMemo(() => {
    const q = search.toLowerCase();
    const base = appts.filter(a =>
      !q || a.appointment_type?.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q)
    );
    const sort = arr => [...arr].sort((a,b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    const sortDesc = arr => [...arr].sort((a,b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));
    return {
      upcomingAppts: sort(base.filter(a => !isPast(a.scheduled_at) || isToday(a.scheduled_at)).filter(a => a.status !== 'completed' && a.status !== 'cancelled')),
      pastAppts: sortDesc(base.filter(a => a.status === 'completed' || a.status === 'cancelled' || (isPast(a.scheduled_at) && !isToday(a.scheduled_at)))),
    };
  }, [appts, search]);

  const todayReminders = useMemo(() =>
    appts.filter(a => isToday(a.scheduled_at) && a.status !== 'cancelled'),
    [appts]
  );

  const createMutation = useMutation({
    mutationFn: d => appointmentsAPI.create({ patient_id: patientId, ...d, scheduled_at: new Date(d.scheduled_at).toISOString() }),
    onSuccess: () => { toast.success('Appointment scheduled'); setShowModal(false); queryClient.invalidateQueries(['appointments', patientId]); },
    onError: e => toast.error(e?.response?.data?.detail || 'Failed'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => appointmentsAPI.update(id, { status }),
    onSuccess: (_, v) => {
      toast.success(v.status === 'completed' ? 'Marked complete' : 'Appointment cancelled');
      queryClient.invalidateQueries(['appointments', patientId]);
    },
    onError: () => toast.error('Update failed'),
  });

  const prefs = prefsData?.care_priorities || prefsData?.priorities || [];
  const painFocus = Array.isArray(prefs) && (prefs.includes('Pain control') || prefs.includes('Manage pain'));
  const showActive   = filterStatus === 'active' || filterStatus === 'all';
  const showResolved = filterStatus === 'resolved' || filterStatus === 'all';

  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.2}}
      className="min-h-screen space-y-5 pb-8">

      <PageHeader image="/resources/african/african-appointment.jpg"
        title={isPatient ? "My Appointments" : isFamily ? "Appointments" : "Appointments"}
        subtitle={
          isPatient ? "Your upcoming visits, today's schedule and past appointments" :
          isFamily  ? "Your loved one's appointment schedule" :
          "Patient appointments — schedule, complete, cancel and track visits"
        }
        icon={Calendar}>
        {canSchedule && patientId && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl border border-white/30 text-sm font-semibold">
            <Plus size={15}/> Schedule
          </button>
        )}
      </PageHeader>

      {/* Care setting gate — hospice patients: appointments are hidden */}
      {appointmentsHidden && (
        <div className="px-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
            <Calendar size={36} className="mx-auto text-slate-300 mb-3"/>
            <p className="font-bold text-slate-600 text-base mb-1">No clinic appointments needed</p>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Your care setting ({careSetting?.replace(/_/g,' ')}) focuses on comfort care at home or in the hospice.
              Your care team visits you directly — no clinic appointments required.
            </p>
            <p className="text-xs text-slate-400 mt-3">
              If you have questions about your care schedule, use{' '}
              <a href="/messages" className="text-teal-600 font-semibold hover:underline">Messages</a>{' '}
              to contact your care team.
            </p>
          </div>
        </div>
      )}

      {/* Inline reminder — upcoming appointment today */}
      {!appointmentsHidden && (isPatient || isFamily) && kpi.today > 0 && (
        <div className="px-6">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-50 border border-teal-200">
            <Bell size={15} className="text-teal-600 animate-pulse flex-shrink-0"/>
            <p className="text-xs font-semibold text-teal-800">
              You have {kpi.today} appointment{kpi.today > 1 ? 's' : ''} today — check the schedule below.
            </p>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className={`px-6 ${appointmentsHidden ? 'opacity-30 pointer-events-none' : ''}`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Upcoming" value={kpi.upcoming} icon={Calendar}
            color="bg-teal-50 text-teal-700 border-teal-400"
            selected={filterStatus==='active'} onClick={() => setFilterStatus('active')}
            subtitle="Scheduled visits"/>
          <KpiCard label="Today" value={kpi.today} icon={Clock}
            color="bg-blue-50 text-blue-700 border-blue-400"
            selected={false} onClick={() => setFilterStatus('active')}
            subtitle={new Date().toLocaleDateString('en-GB',{weekday:'long'})}/>
          <KpiCard label="Completed" value={kpi.completed} icon={CheckCircle}
            color="bg-emerald-50 text-emerald-700 border-emerald-400"
            selected={filterStatus==='resolved'} onClick={() => setFilterStatus('resolved')}
            subtitle="Done appointments"/>
          <KpiCard label="Cancelled" value={kpi.cancelled} icon={XCircle}
            color="bg-slate-100 text-slate-600 border-slate-400"
            selected={false} onClick={() => setFilterStatus('all')}
            subtitle="Cancelled visits"/>
        </div>
      </div>

      {/* Today's reminders */}
      {todayReminders.length > 0 && (
        <div className="px-6">
          <div className="bg-teal-50 border-l-4 border-l-teal-500 border border-teal-200 rounded-r-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={15} className="text-teal-700 animate-pulse"/>
              <h3 className="font-bold text-teal-900 text-sm">Today's Appointments ({todayReminders.length})</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {todayReminders.map(a => (
                <span key={a.id} className="inline-flex items-center gap-1.5 text-xs bg-white border border-teal-200 text-teal-800 font-semibold px-3 py-1.5 rounded-full shadow-sm">
                  <Clock size={10}/>
                  {new Date(a.scheduled_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})} — {a.appointment_type}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Personalisation */}
      {isPatient && painFocus && (
        <div className="px-6">
          <div className="border-l-4 border-l-teal-500 bg-teal-50 border border-teal-200 rounded-r-xl px-4 py-3 flex items-start gap-3">
            <Sparkles size={15} className="text-teal-600 flex-shrink-0 mt-0.5"/>
            <p className="text-sm text-teal-800 font-medium">Pain control is a priority — your appointments are scheduled to support ongoing symptom management.</p>
          </div>
        </div>
      )}

      {/* Filter bar + Content — hidden for care settings that gate appointments */}
      {!appointmentsHidden && (<>
      <div className="px-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            {isStaff && (
              <SearchableSelect
                className="flex-1 max-w-xs"
                placeholder="Search patient…"
                accent="blue"
                value={patientId ? String(patientId) : null}
                onChange={v => setPatientId(v ? Number(v) : null)}
                options={patientList.map(p => ({
                  value: String(p.id),
                  label: p.full_name,
                  sublabel: `${p.patient_code || '#'+p.id} · ${p.age}y`,
                  avatar: 'linear-gradient(135deg,#1d4ed8,#0891b2)',
                }))}
                nullLabel="All patients"
              />
            )}
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by type or location…"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"/>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {[['active','Upcoming'],['all','All'],['resolved','Resolved']].map(([v,l]) => (
                <button key={v} onClick={() => setFilterStatus(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterStatus===v ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                  }`}>{l}</button>
              ))}
            </div>
          </div>
          {(search || filterStatus !== 'active') && (
            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1"><ListFilter size={11}/> Filters:</span>
              {filterStatus !== 'active' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1">
                  {filterStatus}<button onClick={() => setFilterStatus('active')} className="font-black hover:text-red-600">×</button>
                </span>
              )}
              {search && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-700 flex items-center gap-1">
                  "{search}"<button onClick={() => setSearch('')} className="font-black hover:text-red-600">×</button>
                </span>
              )}
              <button onClick={() => { setFilterStatus('active'); setSearch(''); }} className="text-xs text-slate-400 hover:text-red-500 font-semibold ml-auto">Clear all</button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 space-y-5">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={28} className="animate-spin text-blue-600"/>
          </div>
        ) : !patientId ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-14 text-center">
            <Search size={36} className="mx-auto text-slate-300 mb-3"/>
            <p className="font-bold text-slate-600 text-base mb-1">Search for a patient</p>
            <p className="text-slate-400 text-sm">Select a patient above to view their appointments.</p>
          </div>
        ) : (
          <>
            {/* Upcoming / active */}
            {showActive && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>
                    Upcoming Appointments
                    <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{upcomingAppts.length}</span>
                  </h2>
                </div>
                {upcomingAppts.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
                    <p className="text-slate-600 font-bold mb-1">No upcoming appointments</p>
                    <p className="text-slate-400 text-sm mb-4">
                      {appointmentsHidden
                        ? 'Your care team visits you directly — no clinic appointments needed.'
                        : 'No appointments currently scheduled.'}
                    </p>
                    {canSchedule && !appointmentsHidden && (
                      <button onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold">
                        <Plus size={14}/> Schedule First Appointment
                      </button>
                    )}
                  </div>
                ) : (
                  <AnimatePresence>
                    <div className="space-y-2.5">
                      {upcomingAppts.map(a => (
                        <AppointmentCard key={a.id} appt={a} canSchedule={canSchedule}
                          onComplete={id => updateMutation.mutate({ id, status:'completed' })}
                          onCancel={id => updateMutation.mutate({ id, status:'cancelled' })}/>
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </div>
            )}

            {/* Past / resolved (collapsible) */}
            {showResolved && pastAppts.length > 0 && (
              <div>
                <button onClick={() => setResolvedExpanded(v => !v)}
                  className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl border-2 font-bold text-sm transition-all ${
                    resolvedExpanded ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle size={16} className={resolvedExpanded?'text-emerald-500':'text-green-400'}/>
                    Past Appointments
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${resolvedExpanded?'bg-slate-200 text-slate-700':'bg-slate-100 text-slate-500'}`}>
                      {pastAppts.length}
                    </span>
                  </div>
                  {resolvedExpanded ? <ChevronUp size={16} className="text-slate-500"/> : <ChevronDown size={16} className="text-slate-400"/>}
                </button>
                <AnimatePresence>
                  {resolvedExpanded && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden mt-2">
                      <div className="space-y-2.5">
                        {pastAppts.slice(0, 20).map(a => (
                          <AppointmentCard key={a.id} appt={a} canSchedule={false}
                            onComplete={() => {}} onCancel={() => {}}/>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
      </>) } {/* end !appointmentsHidden */}

      <AnimatePresence>
        {showModal && (
          <ScheduleModal onClose={() => setShowModal(false)}
            onSave={d => createMutation.mutate(d)} pending={createMutation.isPending}/>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
