/**
 * Medications — redesigned to match Alerts.jsx design system
 * Pattern: motion.div min-h-screen space-y-5 pb-8, px-6 sections
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { medicationsAPI, patientsAPI, advancedMlAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { usePatientId } from '../hooks/usePatientId';
import axios from 'axios';
import { API_URL } from '../api/client';
import PageHeader from '../components/PageHeader';
import InlineTaskReminder from '../components/InlineTaskReminder';
import toast from '../utils/toast';
import ReminderBell from '../components/ReminderBell';
import SearchableSelect from '../components/ui/SearchableSelect';
import {
  Pill, Plus, X, CheckCircle, Search, Edit2, Ban,
  AlertTriangle, Clock, Loader2, Bell, Sparkles,
  Activity, ChevronDown, ChevronUp, ListFilter, Info,
} from 'lucide-react';

/* ── Constants ───────────────────────────────────────────────────────────── */
// Maps both DB-stored plain English AND frontend code keys to hours
const FREQ_HOURS = {
  // Code keys (from frontend form)
  once_daily:  24, twice_daily: 12, three_daily: 8,
  every_4h: 4, every_6h: 6, every_8h: 8, every_12h: 12,
  // Plain English (from seeded/imported data)
  'once daily': 24, 'twice daily': 12, 'three times daily': 8,
  'four times daily': 6, 'every 4 hours': 4, 'every 6 hours': 6,
  'every 8 hours': 8, 'every 12 hours': 12,
  'every 4h': 4, 'every 6h': 6, 'every 8h': 8, 'every 12h': 12,
  prn: null, 'as needed': null, 'when required': null,
};

const FREQ_OPTS = [
  { v:'once_daily',  l:'Once Daily'         },
  { v:'twice_daily', l:'Twice Daily'        },
  { v:'three_daily', l:'Three Times Daily'  },
  { v:'every_4h',    l:'Every 4 Hours'      },
  { v:'every_6h',    l:'Every 6 Hours'      },
  { v:'every_8h',    l:'Every 8 Hours'      },
  { v:'every_12h',   l:'Every 12 Hours'     },
  { v:'prn',         l:'PRN (As Needed)'    },
];

const ROUTE_OPTS = ['Oral','IV','IM','SC','Sublingual','Transdermal','Rectal','Inhaled'];

// Normalize a frequency string to a displayable label
const freqLabel = (v) => {
  if (!v) return '—';
  const opt = FREQ_OPTS.find(o => o.v === v);
  if (opt) return opt.l;
  // Already plain English — capitalize first letter
  return v.charAt(0).toUpperCase() + v.slice(1);
};

function nextDose(med) {
  if (!med.start_date) return null;
  const freqKey = (med.frequency || '').toLowerCase().trim();
  const h = FREQ_HOURS[freqKey] ?? FREQ_HOURS[med.frequency];
  if (!h) return null;
  const start = new Date(med.start_date);
  const now   = new Date();
  const elapsed    = (now - start) / 3600000;
  const dosesGiven = Math.floor(elapsed / h);
  const next       = new Date(start.getTime() + (dosesGiven + 1) * h * 3600000);
  const hoursUntil = (next - now) / 3600000;
  return hoursUntil >= 0 && hoursUntil <= 24 ? { next, hoursUntil } : null;
}

function timeAgo(iso) {
  if (!iso) return '';
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short' });
}

/* ── KPI card (compact — moderate size) ─────────────────────────────────── */
function KpiCard({ label, value, icon: Icon, color, selected, onClick, subtitle }) {
  return (
    <button onClick={onClick}
      className={`relative rounded-xl border-2 px-4 py-3 text-left w-full transition-all duration-150 ${
        selected ? `${color} border-current shadow-md scale-[1.01]` : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}>
      {selected && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor:'currentColor' }}/>}
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

/* PatientSearch is now handled by SearchableSelect — see import below */

/* ── Add/Edit Modal ──────────────────────────────────────────────────────── */
const EMPTY_MED = { name:'', dose:'', frequency:'once_daily', route:'Oral', indication:'', start_date: new Date().toISOString().slice(0,10) };

function MedModal({ initial, onClose, onSave, pending }) {
  const [f, setF] = useState(initial || EMPTY_MED);
  const up = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const valid = f.name.trim() && f.dose.trim() && f.frequency;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{scale:.95,y:20}} animate={{scale:1,y:0}} exit={{scale:.95,y:20}}
        onClick={e=>e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center"><Pill size={15}/></div>
            <h2 className="font-bold text-slate-800">{initial ? 'Edit Medication' : 'Add Medication'}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X size={16} className="text-slate-400"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Medication Name *</label>
            <input value={f.name} onChange={up('name')} placeholder="e.g. Morphine Sulfate"
              className="w-full border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl px-3.5 py-2.5 text-sm outline-none"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Dose *</label>
              <input value={f.dose} onChange={up('dose')} placeholder="e.g. 10mg"
                className="w-full border border-slate-300 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-sm outline-none"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
              <input type="date" value={f.start_date} onChange={up('start_date')}
                className="w-full border border-slate-300 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-sm outline-none"/>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SearchableSelect
              label="Frequency *"
              accent="teal"
              value={f.frequency}
              onChange={v => setF(p => ({ ...p, frequency: v || 'once_daily' }))}
              options={FREQ_OPTS.map(o => ({ value: o.v, label: o.l }))}
              allowClear={false}
              placeholder="Select frequency…"
            />
            <SearchableSelect
              label="Route"
              accent="teal"
              value={f.route}
              onChange={v => setF(p => ({ ...p, route: v || 'Oral' }))}
              options={ROUTE_OPTS.map(r => ({ value: r, label: r }))}
              allowClear={false}
              placeholder="Select route…"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Indication</label>
            <input value={f.indication} onChange={up('indication')} placeholder="e.g. Pain management"
              className="w-full border border-slate-300 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-sm outline-none"/>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-xl font-semibold text-sm hover:bg-white">Cancel</button>
          <button onClick={() => onSave(f)} disabled={!valid||pending}
            className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {pending?<Loader2 size={13} className="animate-spin"/>:<CheckCircle size={13}/>}
            {initial ? 'Save' : 'Add'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Discontinue confirm ─────────────────────────────────────────────────── */
function StopModal({ med, onClose, onConfirm, pending }) {
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{scale:.95,y:20}} animate={{scale:1,y:0}} exit={{scale:.95,y:20}}
        onClick={e=>e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Ban size={22} className="text-red-600"/></div>
          <h3 className="font-bold text-slate-900 text-lg mb-2">Discontinue {med?.name}?</h3>
          <p className="text-slate-500 text-sm mb-6">This marks <strong>{med?.dose}</strong> as inactive and logs it in the patient's history.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50">Keep Active</button>
            <button onClick={onConfirm} disabled={pending}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {pending?<Loader2 size={13} className="animate-spin"/>:<Ban size={13}/>}
              Discontinue
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Medication row (same feel as AlertCard) ─────────────────────────────── */
function MedRow({ med, index, canEdit, canLogAdherence, onEdit, onStop, onMarkTaken, todayTaken, isTakingLoading }) {
  const isActive = med.is_active;
  const dose     = nextDose(med);
  return (
    <motion.div layout initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}}
      className="group rounded-lg border bg-white transition-shadow hover:shadow-sm"
      style={{ borderLeft:`3px solid ${isActive?'#0d9488':'#cbd5e1'}`, borderColor:'#c8d0da' }}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Icon */}
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive?'bg-teal-50 text-teal-600':'bg-slate-100 text-slate-400'}`}>
          <Pill size={14}/>
        </div>

        {/* Left: name + dose info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800 text-sm truncate">{med.name}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isActive?'bg-teal-50 text-teal-700 border border-teal-200':'bg-slate-100 text-slate-500 border border-slate-200'}`}>
              {isActive ? 'Active' : 'Stopped'}
            </span>
            {med.frequency === 'prn' && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">PRN</span>
            )}
            {dose && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                dose.hoursUntil < 1 ? 'bg-red-50 text-red-600' : dose.hoursUntil < 4 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
              }`}>
                <Bell size={8}/> {dose.hoursUntil < 1 ? 'Due now' : dose.next.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
              </span>
            )}
            {isActive && todayTaken === true && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-0.5">
                <CheckCircle size={8}/> Taken
              </span>
            )}
            {isActive && todayTaken === false && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center gap-0.5">
                <AlertTriangle size={8}/> Not confirmed
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {med.dose} · {freqLabel(med.frequency)}{med.route ? ` · ${med.route}` : ''}
            {med.indication ? <> · <span className="text-slate-400">{med.indication}</span></> : null}
          </p>
        </div>

        {/* Right: date + actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1">
            <Clock size={10}/>
            {med.start_date ? new Date(med.start_date).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '—'}
          </span>
          <ReminderBell label={`${med.name} - ${med.dose}`} type="medication" size="sm" />
          {/* Patient / Caregiver: Mark Taken */}
          {isActive && canLogAdherence && todayTaken !== true && (
            <button onClick={() => onMarkTaken(med.id)} disabled={isTakingLoading}
              className="flex items-center gap-1 px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-[11px] font-semibold transition disabled:opacity-50">
              {isTakingLoading ? <Loader2 size={10} className="animate-spin"/> : <CheckCircle size={10}/>} Taken
            </button>
          )}
          {/* Clinician: Edit + Stop — compact icon buttons */}
          {canEdit && isActive && (
            <div className="flex items-center gap-1">
              <button onClick={() => onEdit(med)}
                className="flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md text-[11px] font-medium transition">
                <Edit2 size={10}/> Edit
              </button>
              <button onClick={() => onStop(med)}
                className="flex items-center gap-1 px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md text-[11px] font-medium transition">
                <Ban size={10}/> Stop
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function Medications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isPatient  = user?.role === 'patient';
  const isFamily   = user?.role === 'family';
  const isCaregiver= user?.role === 'caregiver';
  const isClinical = ['clinician','admin'].includes(user?.role);
  // Staff = can pick patients; patients/family see their own
  const isStaff    = ['clinician','admin','caregiver'].includes(user?.role);
  // Read-only: patients and family cannot prescribe/edit/discontinue
  const canEdit    = isClinical;
  // Can log adherence (mark as taken): patients and caregivers
  const canLogAdherence = isPatient || isCaregiver;

  // For patients/family: resolve their linked patient record ID via the hook
  const { patientId: ownPatientId } = usePatientId();
  const [staffPatientId, setStaffPatientId] = useState(null);
  // patients/family see their own; staff pick from a list
  const patientId  = isStaff ? staffPatientId : ownPatientId;
  const setPatientId = isStaff ? setStaffPatientId : () => {};

  const [filterTab, setFilterTab]           = useState('active');
  const [search, setSearch]                 = useState('');
  const [showAddModal, setShowAddModal]     = useState(false);
  const [editingMed, setEditingMed]         = useState(null);
  const [stopTarget, setStopTarget]         = useState(null);
  const [inactiveExpanded, setInactiveExpanded] = useState(false);

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

  // Patient preferences for pain-level personalisation
  const { data: prefsData } = useQuery({
    queryKey: ['prefs-my', user?.id],
    queryFn: () => axios.get(`${API_URL}/api/preferences/my`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(r => r.data).catch(() => null),
    enabled: isPatient && !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: medsRaw, isLoading } = useQuery({
    queryKey: ['medications', patientId],
    queryFn: () => medicationsAPI.getPatientMedications(patientId).then(r => r.data),
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 60000,
  });
  const meds     = Array.isArray(medsRaw) ? medsRaw : [];
  const active   = meds.filter(m => m.is_active);
  const inactive = meds.filter(m => !m.is_active);

  // Compliance: fetch today's adherence status for the patient view
  const { data: complianceData } = useQuery({
    queryKey: ['compliance-tasks', patientId],
    queryFn: () => axios.get(`${API_URL}/api/compliance/my-tasks`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    }).then(r => r.data).catch(() => null),
    enabled: isPatient && !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  // true = taken, false = not taken, undefined = no data
  const medAckDone = complianceData?.tasks?.find(t => t.id === 'medication_acknowledge')?.done;

  const { data: drugData } = useQuery({
    queryKey: ['drug-ints', patientId],
    queryFn: () => advancedMlAPI.getDrugInteractions(patientId).then(r => r.data),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const severeInts = (drugData?.interactions || []).filter(i => i.severity === 'severe' || i.severity === 'major');

  // Dose reminders — use 'doseTime' to avoid clobbering med.dose string
  const reminders = useMemo(() =>
    active.map(m => ({ ...m, doseTime: nextDose(m) })).filter(m => m.doseTime).sort((a,b) => a.doseTime.next - b.doseTime.next),
    [active]
  );

  // Filtered display
  const filtered = useMemo(() => {
    const pool = filterTab === 'active' ? active : inactive;
    if (!search) return pool;
    const q = search.toLowerCase();
    return pool.filter(m => (m.name||'').toLowerCase().includes(q) || (m.indication||'').toLowerCase().includes(q));
  }, [filterTab, active, inactive, search]);

  const createMutation = useMutation({
    mutationFn: d => medicationsAPI.create({ patient_id: patientId, ...d }),
    onSuccess: () => { toast.success('Medication added'); setShowAddModal(false); queryClient.invalidateQueries(['medications', patientId]); },
    onError: e => toast.error(e?.response?.data?.detail || 'Failed'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, d }) => medicationsAPI.update(id, d),
    onSuccess: () => { toast.success('Updated'); setEditingMed(null); queryClient.invalidateQueries(['medications', patientId]); },
    onError: () => toast.error('Update failed'),
  });
  const stopMutation = useMutation({
    mutationFn: id => medicationsAPI.delete(id),
    onSuccess: () => { toast.success('Discontinued'); setStopTarget(null); queryClient.invalidateQueries(['medications', patientId]); },
    onError: () => toast.error('Failed'),
  });

  // Mark as taken — logs adherence for patient/caregiver
  const markTakenMutation = useMutation({
    mutationFn: (medId) => axios.post(
      `${API_URL}/api/compliance/acknowledge`,
      { task_id: 'medication_acknowledge', notes: `Medication ID ${medId} taken` },
      { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } }
    ),
    onSuccess: () => {
      toast.success('Medication marked as taken');
      queryClient.invalidateQueries(['task-status']);
      queryClient.invalidateQueries(['compliance-tasks']);
    },
    onError: () => toast.error('Could not log medication'),
  });

  const painLevel = prefsData?.esas_pain || prefsData?.pain_level || 0;

  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.2}}
      className="min-h-screen space-y-5 pb-8">

      <PageHeader image="/resources/african/african-medications.jpg"
        title={isPatient ? "My Medications" : isFamily ? "Medications" : "Medications"}
        subtitle={
          isPatient ? "Your prescribed medications, dose schedule and daily confirmation" :
          isFamily  ? "Your loved one's current medications" :
          isCaregiver ? "Patient medications — record doses and flag missed administrations" :
          "Prescriptions, dosage schedules, reminders and interaction monitoring"
        }
        icon={Pill}>
        {canEdit && patientId && (
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl border border-white/30 text-sm font-semibold transition-all">
            <Plus size={15}/> Add Medication
          </button>
        )}
      </PageHeader>

      {/* Inline reminder for patients — medication acknowledgement */}
      {isPatient && (
        <InlineTaskReminder
          taskId="medication_acknowledge"
          message="Please confirm you have taken your scheduled medications today using the 'Mark as Taken' option below."
          doneMsg="✓ Medication acknowledgement recorded for today."
        />
      )}

      {/* KPI cards */}
      <div className="px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Active" value={active.length} icon={Pill}
            color="bg-teal-50 text-teal-700 border-teal-400"
            selected={filterTab==='active'} onClick={() => setFilterTab('active')}
            subtitle="Currently prescribed"/>
          <KpiCard label="Discontinued" value={inactive.length} icon={Ban}
            color="bg-slate-100 text-slate-600 border-slate-400"
            selected={filterTab==='inactive'} onClick={() => setFilterTab('inactive')}
            subtitle="Stopped medications"/>
          <KpiCard label="Dose Reminders" value={reminders.length} icon={Bell}
            color="bg-amber-50 text-amber-700 border-amber-400"
            selected={false} onClick={() => {}} subtitle="Due in next 24h"/>
          <KpiCard label="Drug Interactions" value={severeInts.length} icon={AlertTriangle}
            color={severeInts.length > 0 ? "bg-red-50 text-red-700 border-red-400" : "bg-slate-50 text-slate-500 border-slate-300"}
            selected={false} onClick={() => {}} subtitle={severeInts.length > 0 ? "Severe/major flags" : "None detected"}/>
        </div>
      </div>

      {/* Drug interaction warning */}
      {severeInts.length > 0 && (
        <div className="px-6">
          <div className="bg-red-50 border-l-4 border-l-red-500 border border-red-200 rounded-r-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5"/>
              <div>
                <p className="font-bold text-red-900 text-sm mb-1">⚠ {severeInts.length} Severe Drug Interaction{severeInts.length>1?'s':''} Detected</p>
                {severeInts.map((it,i)=>(
                  <p key={i} className="text-xs text-red-700 mb-0.5">
                    <strong>{it.drug1}</strong> + <strong>{it.drug2}</strong>{it.description?`: ${it.description}`:''}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personalisation banners */}
      {isPatient && painLevel >= 7 && (
        <div className="px-6">
          <div className="border-l-4 border-l-rose-500 bg-rose-50 border border-rose-200 rounded-r-xl px-4 py-3 flex items-start gap-3">
            <Sparkles size={15} className="text-rose-500 flex-shrink-0 mt-0.5"/>
            <p className="text-sm text-rose-800 font-medium">High pain level noted ({painLevel}/10) — take medications exactly as prescribed. Contact your care team if pain is uncontrolled.</p>
          </div>
        </div>
      )}

      {/* Dose reminders */}
      {reminders.length > 0 && (
        <div className="px-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={15} className="text-amber-600"/>
              <h3 className="font-bold text-slate-800 text-sm">Upcoming Doses — Next 24 Hours</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{reminders.length}</span>
            </div>
            <div className="space-y-2">
              {reminders.map(m => {
                const { hoursUntil, next } = m.doseTime;
                const urgency = hoursUntil < 1 ? 'bg-red-100 text-red-800 border-red-200' : hoursUntil < 4 ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-800 border-blue-200';
                const badge = hoursUntil < 1 ? 'NOW' : hoursUntil < 4 ? 'SOON' : next.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
                return (
                  <div key={m.id} className={`flex items-center justify-between border rounded-xl px-3 py-2.5 ${urgency}`}>
                    <div className="flex items-center gap-2.5">
                      <Pill size={14}/>
                      <div>
                        <span className="font-bold text-sm">{m.name}</span>
                        <span className="text-xs ml-1.5 opacity-70">{m.dose} · {freqLabel(m.frequency)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black">{badge}</span>
                      {hoursUntil >= 1 && <span className="text-[10px] opacity-60">{hoursUntil.toFixed(1)}h</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="px-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Patient search (staff) */}
            {isStaff && (
              <SearchableSelect
                className="flex-1 max-w-xs"
                placeholder="Search patient…"
                accent="teal"
                value={patientId ? String(patientId) : null}
                onChange={v => setPatientId(v ? Number(v) : null)}
                options={patientList.map(p => ({
                  value: String(p.id),
                  label: p.full_name,
                  sublabel: `${p.patient_code || '#'+p.id} · ${p.age}y`,
                  avatar: 'linear-gradient(135deg,#0d9488,#0891b2)',
                }))}
                nullLabel="All patients"
              />
            )}
            {/* Text search */}
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search medications or indication…"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm"/>
            </div>
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {[['active','Active',active.length],['inactive','History',inactive.length]].map(([v,l,n])=>(
                <button key={v} onClick={() => setFilterTab(v)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterTab===v ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                  }`}>
                  {l} ({n})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 space-y-2.5">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-teal-600"/>
              <p className="text-sm text-slate-500 font-medium">Loading medications…</p>
            </div>
          </div>
        ) : !patientId ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-14 text-center">
            <Search size={36} className="mx-auto text-slate-300 mb-3"/>
            <p className="font-bold text-slate-600 text-base mb-1">Search for a patient</p>
            <p className="text-slate-400 text-sm">Select a patient above to view their medications.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Pill size={36} className="mx-auto text-slate-300 mb-3"/>
            <p className="font-bold text-slate-600 mb-1">{filterTab==='active' ? 'No active medications' : 'No medication history'}</p>
            <p className="text-slate-400 text-sm mb-4">{filterTab==='active' ? 'No medications currently prescribed.' : 'No discontinued medications on record.'}</p>
            {isStaff && filterTab==='active' && (
              <button onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm">
                <Plus size={14}/> Add First Medication
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((med, i) => (
              <MedRow key={med.id} med={med} index={i}
                canEdit={canEdit}
                canLogAdherence={canLogAdherence}
                todayTaken={canLogAdherence && med.is_active ? medAckDone : undefined}
                onEdit={setEditingMed}
                onStop={setStopTarget}
                onMarkTaken={(medId) => markTakenMutation.mutate(medId)}
                isTakingLoading={markTakenMutation.isPending}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <MedModal onClose={() => setShowAddModal(false)}
            onSave={d => createMutation.mutate(d)} pending={createMutation.isPending}/>
        )}
        {editingMed && (
          <MedModal initial={editingMed} onClose={() => setEditingMed(null)}
            onSave={d => updateMutation.mutate({ id: editingMed.id, d })} pending={updateMutation.isPending}/>
        )}
        {stopTarget && (
          <StopModal med={stopTarget} onClose={() => setStopTarget(null)}
            onConfirm={() => stopMutation.mutate(stopTarget.id)} pending={stopMutation.isPending}/>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
