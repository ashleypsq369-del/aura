/**
 * PatientMonitor - redesigned to match Project Aura design system
 * Route: /patient/:id (legacy deep-link, separate from /patients/:patientId)
 * Teal palette · no old .card / text-charcoal / text-muted CSS classes
 * Tabs: Vitals · Symptoms · Medications · Appointments · Care Plan
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
 patientsAPI, vitalsAPI, symptomsAPI,
 medicationsAPI, appointmentsAPI,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/toast';
import {
 LineChart, Line, XAxis, YAxis, CartesianGrid,
 Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
 Activity, Heart, Thermometer, Droplets, AlertCircle,
 Pill, Calendar, FileText, TrendingUp, TrendingDown,
 Minus, User, MapPin, ChevronLeft, Clock, CheckCircle,
 Plus, X, Loader2,
} from 'lucide-react';

/* ─── Vital status helpers ───────────────────────────────────────────────── */
const getStatus = (v, min, max) => {
 if (v == null) return 'unknown';
 if (v < min || v > max) return 'critical';
 if (v < min + 5 || v > max - 5) return 'warning';
 return 'normal';
};

const STATUS_STYLE = {
 normal: { bg: '#f0fdfa', border: '#99f6e4', text: '#0f766e', badge: 'Normal' },
 warning: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', badge: 'Watch' },
 critical: { bg: '#fff1f2', border: '#fca5a5', text: '#991b1b', badge: 'Alert' },
 unknown: { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b', badge: ' - ' },
};

/* ─── VitalCard ─────────────────────────────────────────────────────────── */
function VitalCard({ icon: Icon, label, value, unit, status, normalRange }) {
 const s = STATUS_STYLE[status] || STATUS_STYLE.unknown;
 return (
 <motion.div
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 className="rounded-xl border-2 p-4 flex flex-col gap-2"
 style={{ background: s.bg, borderColor: s.border }}
 >
 <div className="flex items-center justify-between">
 <div className="w-8 h-8 rounded-lg flex items-center justify-center"
 style={{ background: `${s.border}60`, color: s.text }}>
 <Icon size={16} />
 </div>
 <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
 style={{ background: `${s.text}15`, color: s.text }}>
 {s.badge}
 </span>
 </div>
 <div>
 <p className="text-xs font-medium text-slate-500">{label}</p>
 <p className="text-xl font-black tabular-nums" style={{ color: s.text }}>
 {value ?? ' - '} <span className="text-sm font-normal text-slate-400">{unit}</span>
 </p>
 </div>
 <p className="text-[11px] text-slate-400">Normal: {normalRange}</p>
 </motion.div>
 );
}

/* ─── Section card wrapper ───────────────────────────────────────────────── */
function Section({ title, children }) {
 return (
 <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden">
 {title && (
 <div className="px-5 py-3 border-b border-[var(--card-border)]/50"
 style={{ background: 'linear-gradient(to right, #0d948808, transparent)' }}>
 <h3 className="font-bold text-[var(--text-800)] text-sm">{title}</h3>
 </div>
 )}
 <div className="p-5">{children}</div>
 </div>
 );
}

/* ─── Symptom badge ──────────────────────────────────────────────────────── */
function SymBadge({ label, color = '#0d9488' }) {
 return (
 <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold"
 style={{ background: `${color}18`, color }}>
 {label}
 </span>
 );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function PatientMonitor() {
 const { id } = useParams();
 const navigate = useNavigate();
 const { user } = useAuth();
 const queryClient = useQueryClient();
 const patientId = parseInt(id) || 1;
 const [activeTab, setActiveTab] = useState('vitals');
 const [showVitalsModal, setShowVitalsModal] = useState(false);
 const [vitalsForm, setVitalsForm] = useState({
 heart_rate: '', blood_pressure_sys: '', blood_pressure_dia: '',
 oxygen_saturation: '', temperature: '', respiratory_rate: '', notes: '',
 });

 const canRecordVitals = user?.role && ['admin','clinician','caregiver'].includes(user.role);

 const { data: patient } = useQuery({
 queryKey: ['patient', patientId],
 queryFn: () => patientsAPI.getById(patientId).then(r => r.data),
 });
 const { data: vitals } = useQuery({
 queryKey: ['vitals', patientId],
 queryFn: () => vitalsAPI.getPatientVitals(patientId, 50).then(r => r.data),
 });
 const { data: symptoms } = useQuery({
 queryKey: ['symptoms', patientId],
 queryFn: () => symptomsAPI.getPatientSymptoms(patientId, 50).then(r => r.data),
 });
 const { data: medications } = useQuery({
 queryKey: ['medications', patientId],
 queryFn: () => medicationsAPI.getPatientMedications(patientId).then(r => r.data),
 });
 const { data: appointments } = useQuery({
 queryKey: ['appointments', patientId],
 queryFn: () => appointmentsAPI.getPatientAppointments(patientId).then(r => r.data),
 });

 const recordVitalsMutation = useMutation({
 mutationFn: (data) => vitalsAPI.log({ patient_id: patientId, ...data }),
 onSuccess: () => {
 toast.success('Vitals recorded');
 setShowVitalsModal(false);
 setVitalsForm({ heart_rate:'', blood_pressure_sys:'', blood_pressure_dia:'', oxygen_saturation:'', temperature:'', respiratory_rate:'', notes:'' });
 queryClient.invalidateQueries({ queryKey: ['vitals', patientId] });
 },
 onError: e => toast.error(e?.response?.data?.detail || 'Could not record vitals'),
 });

 const latest = vitals?.[0];
 const vitalsChart = (vitals?.slice(-20) || []).map(v => ({
 time: new Date(v.recorded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
 'Heart Rate': Math.round(v.heart_rate ?? 0),
 'BP Systolic': Math.round(v.blood_pressure_sys ?? v.blood_pressure_systolic ?? 0),
 'O₂ Sat': parseFloat((v.oxygen_saturation ?? 0).toFixed(1)),
 'Temp': parseFloat((v.temperature ?? 0).toFixed(1)),
 }));

 const TABS = [
 { id: 'vitals', label: 'Vitals', icon: Activity },
 { id: 'symptoms', label: 'Symptoms', icon: AlertCircle },
 { id: 'medications', label: 'Medications', icon: Pill },
 { id: 'appointments', label: 'Appointments', icon: Calendar },
 { id: 'careplan', label: 'Care Plan', icon: FileText },
 ];

 const riskColor = { Crisis:'#dc2626', High:'#ea580c', Medium:'#d97706', Low:'#10b981' };
 const rc = riskColor[patient?.risk_level] || '#64748b';

 return (
 <div className="min-h-screen pb-10 space-y-5" style={{ background: '#c2dde8' }}>

 {/* ── Header ── */}
 <div className="relative overflow-hidden rounded-b-2xl"
 style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)' }}>
 <div className="absolute inset-0 opacity-10"
 style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)' }} />
 <div className="relative px-6 pt-6 pb-5">
 <button onClick={() => navigate(-1)}
 className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-semibold mb-4 transition-colors">
 <ChevronLeft size={14} /> Back
 </button>
 <div className="flex items-start justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-base">
 {patient?.full_name?.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || '?'}
 </div>
 <div>
 <h1 className="text-white font-bold text-lg leading-tight">
 {patient?.full_name || 'Loading…'}
 </h1>
 <p className="text-white/70 text-xs">
 {patient?.patient_code} · {patient?.age}y · {patient?.gender}
 </p>
 </div>
 </div>
 {patient?.risk_level && (
 <span className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold"
 style={{ background: `${rc}30`, color: '#fff', border: `1px solid ${rc}60` }}>
 {patient.risk_level} Risk
 </span>
 )}
 </div>

 {/* Meta strip */}
 <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/80">
 {patient?.primary_diagnosis && (
 <span className="flex items-center gap-1"><FileText size={11} />{patient.primary_diagnosis}</span>
 )}
 {patient?.facility_name && (
 <span className="flex items-center gap-1"><MapPin size={11} />{patient.facility_name}</span>
 )}
 {patient?.status && (
 <span className="flex items-center gap-1"><User size={11} />
 Status: <strong className="text-white capitalize">{patient.status}</strong>
 </span>
 )}
 </div>

 {/* ── Vitals stat strip - Services DNA inside header ── */}
 {latest && (
 <div className="mt-4 flex flex-wrap items-stretch gap-0 overflow-hidden rounded-xl"
 style={{ background:'rgba(0,0,0,0.32)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.14)', display:'inline-flex' }}>
 {[
 { label:'Heart Rate', value:`${Math.round(latest.heart_rate??0)} bpm`, icon:Heart, status:getStatus(latest.heart_rate,60,100) },
 { label:'Blood Pressure', value:`${Math.round(latest.blood_pressure_sys??0)}/${Math.round(latest.blood_pressure_dia??0)}`, icon:Activity, status:getStatus(latest.blood_pressure_sys,90,140) },
 { label:'O₂ Sat', value:`${parseFloat((latest.oxygen_saturation??0).toFixed(1))}%`, icon:Droplets, status:getStatus(latest.oxygen_saturation,95,100) },
 { label:'Temp', value:`${parseFloat((latest.temperature??0).toFixed(1))}°C`, icon:Thermometer, status:getStatus(latest.temperature,36.5,37.5) },
 ].map((v, i) => {
 const statusColor = v.status==='critical' ? '#f87171' : v.status==='warning' ? '#fbbf24' : '#4ade80';
 return (
 <div key={v.label} style={{
 display:'flex', alignItems:'center', gap:10,
 padding:'9px 16px',
 borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.10)' : 'none',
 }}>
 <div style={{ width:3, height:32, borderRadius:2, background:statusColor, flexShrink:0, boxShadow:`0 0 8px ${statusColor}80` }}/>
 <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
 <div style={{ display:'flex', alignItems:'center', gap:5 }}>
 <v.icon size={11} style={{ color:statusColor, flexShrink:0 }} aria-hidden="true"/>
 <span style={{ fontSize:15, fontWeight:900, color:'#fff', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{v.value}</span>
 </div>
 <span style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.55)', whiteSpace:'nowrap' }}>{v.label}</span>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>

 {/* ── Tab bar ── */}
 <div className="px-6">
 <div className="flex gap-0 border-b border-[var(--card-border)] overflow-x-auto bg-[var(--card-bg)] rounded-t-xl">
 {TABS.map(({ id, label, icon: Icon }) => (
 <button key={id} onClick={() => setActiveTab(id)}
 className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex-shrink-0
 ${activeTab === id
 ? 'border-teal-600 text-teal-700 dark:text-teal-400'
 : 'border-transparent text-[var(--text-500)] hover:text-[var(--text-700)] dark:hover:text-slate-300'}`}>
 <Icon size={14} />{label}
 </button>
 ))}
 </div>
 </div>

 {/* ── Tab content ── */}
 <div className="px-6">
 <AnimatePresence mode="wait">
 <motion.div key={activeTab}
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -8 }}
 transition={{ duration: 0.18 }}
 className="space-y-4">

 {/* ── VITALS ── */}
 {activeTab === 'vitals' && (
 <>
 {/* Record vitals button - staff only */}
 {canRecordVitals && (
 <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
 <button onClick={() => setShowVitalsModal(true)}
 style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, background:'linear-gradient(135deg,#0d9488,#0891b2)', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700, boxShadow:'0 2px 10px rgba(13,148,136,0.3)' }}>
 <Plus size={14} /> Record Vitals
 </button>
 </div>
 )}
 <Section title="Vitals Trend - last 20 readings">
 {vitalsChart.length > 0 ? (
 <ResponsiveContainer width="100%" height={320}>
 <LineChart data={vitalsChart}>
 <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
 <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} />
 <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
 <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
 <Legend wrapperStyle={{ fontSize: 12 }} />
 <Line type="monotone" dataKey="Heart Rate" stroke="#dc2626" strokeWidth={2} dot={{ r: 2 }} />
 <Line type="monotone" dataKey="BP Systolic" stroke="#0d9488" strokeWidth={2} dot={{ r: 2 }} />
 <Line type="monotone" dataKey="O₂ Sat" stroke="#0891b2" strokeWidth={2} dot={{ r: 2 }} />
 <Line type="monotone" dataKey="Temp" stroke="#d97706" strokeWidth={2} dot={{ r: 2 }} />
 </LineChart>
 </ResponsiveContainer>
 ) : (
 <p className="text-center text-[var(--text-400)] py-8 text-sm">No vitals data recorded yet</p>
 )}
 </Section>

 <Section title="Recent Readings">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-[var(--card-border)]/50">
 {['Time','HR','BP','O₂ Sat','Temp'].map(h => (
 <th key={h} className="pb-2 text-left text-xs font-semibold text-[var(--text-400)] pr-4">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
 {(vitals?.slice(0, 12) || []).map(v => (
 <tr key={v.id} className="hover:bg-[var(--card-bg)] dark:hover:bg-slate-700/30 transition-colors">
 <td className="py-2 pr-4 text-xs text-[var(--text-500)] whitespace-nowrap">
 {new Date(v.recorded_at).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
 </td>
 <td className="py-2 pr-4 font-medium text-[var(--text-700)]">{Math.round(v.heart_rate ?? 0)}</td>
 <td className="py-2 pr-4 font-medium text-[var(--text-700)]">
 {Math.round(v.blood_pressure_sys ?? v.blood_pressure_systolic ?? 0)}/{Math.round(v.blood_pressure_dia ?? v.blood_pressure_diastolic ?? 0)}
 </td>
 <td className="py-2 pr-4 font-medium text-[var(--text-700)]">{(v.oxygen_saturation ?? 0).toFixed(1)}%</td>
 <td className="py-2 font-medium text-[var(--text-700)]">{(v.temperature ?? 0).toFixed(1)}°C</td>
 </tr>
 ))}
 </tbody>
 </table>
 {(!vitals || vitals.length === 0) && (
 <p className="text-center text-[var(--text-400)] py-6 text-sm">No vitals recorded</p>
 )}
 </div>
 </Section>
 </>
 )}

 {/* ── SYMPTOMS ── */}
 {activeTab === 'symptoms' && (
 <Section title="Symptom Log">
 {symptoms && symptoms.length > 0 ? (
 <div className="space-y-3">
 {symptoms.slice(0, 15).map((s, i) => (
 <motion.div key={s.id}
 initial={{ opacity: 0, x: -12 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: i * 0.04 }}
 className="border-l-4 border-teal-400 pl-4 py-2">
 <div className="flex items-start justify-between gap-2 flex-wrap">
 <div>
 <p className="font-semibold text-[var(--text-800)] text-sm">
 Pain: <span className="text-rose-600">{s.pain_level ?? ' - '}/10</span>
 </p>
 <p className="text-xs text-[var(--text-500)] mt-0.5">
 {new Date(s.recorded_at).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
 </p>
 </div>
 <div className="flex flex-wrap gap-1">
 {s.nausea && <SymBadge label="Nausea" color="#d97706" />}
 {s.fatigue && <SymBadge label="Fatigue" color="#ea580c" />}
 {s.anxiety && <SymBadge label="Anxiety" color="#0d9488" />}
 {s.dyspnea && <SymBadge label="Breathlessness" color="#0891b2" />}
 {s.confusion && <SymBadge label="Confusion" color="#7c3aed" />}
 </div>
 </div>
 {s.notes && <p className="text-xs text-[var(--text-500)] italic mt-1">"{s.notes}"</p>}
 </motion.div>
 ))}
 </div>
 ) : (
 <p className="text-center text-[var(--text-400)] py-8 text-sm">No symptoms recorded</p>
 )}
 </Section>
 )}

 {/* ── MEDICATIONS ── */}
 {activeTab === 'medications' && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 {medications && medications.length > 0 ? medications.map((m, i) => (
 <motion.div key={m.id}
 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.04 }}
 className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
 <div className="flex items-start justify-between gap-2 mb-2">
 <p className="font-bold text-[var(--text-800)] text-sm">{m.name}</p>
 <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0
 ${m.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
 {m.is_active ? 'Active' : 'Stopped'}
 </span>
 </div>
 <div className="space-y-0.5 text-xs text-[var(--text-500)] dark:text-slate-400">
 {m.dose && <p>Dose: <span className="font-medium text-[var(--text-700)]">{m.dose}</span></p>}
 {m.frequency && <p>Frequency: <span className="font-medium text-[var(--text-700)]">{m.frequency}</span></p>}
 {m.route && <p>Route: <span className="font-medium text-[var(--text-700)]">{m.route}</span></p>}
 {m.indication && <p>For: <span className="font-medium text-[var(--text-700)]">{m.indication}</span></p>}
 </div>
 </motion.div>
 )) : (
 <div className="col-span-2 bg-[var(--card-bg)] rounded-xl border border-dashed border-slate-300 p-10 text-center">
 <p className="text-[var(--text-400)] text-sm">No medications prescribed</p>
 </div>
 )}
 </div>
 )}

 {/* ── APPOINTMENTS ── */}
 {activeTab === 'appointments' && (
 <div className="space-y-3">
 {appointments && appointments.length > 0 ? appointments.map((a, i) => (
 <motion.div key={a.id}
 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.04 }}
 className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4 flex items-start gap-3">
 <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 flex-shrink-0">
 <Calendar size={16} />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-semibold text-[var(--text-800)] text-sm">{a.appointment_type || 'Consultation'}</p>
 <p className="text-xs text-[var(--text-500)] mt-0.5 flex items-center gap-1">
 <Clock size={10} />
 {a.scheduled_at ? new Date(a.scheduled_at).toLocaleString('en-GB', {
 weekday:'short', day:'numeric', month:'short', year:'numeric',
 hour:'2-digit', minute:'2-digit',
 }) : 'Date TBC'}
 </p>
 {a.location && <p className="text-xs text-[var(--text-400)] mt-0.5 flex items-center gap-1"><MapPin size={9} />{a.location}</p>}
 </div>
 <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
 a.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
 a.status === 'cancelled' ? 'bg-red-100 text-red-700' :
 'bg-teal-50 text-teal-700'
 }`}>{a.status || 'scheduled'}</span>
 </motion.div>
 )) : (
 <div className="bg-[var(--card-bg)] rounded-xl border border-dashed border-slate-300 p-10 text-center">
 <p className="text-[var(--text-400)] text-sm">No appointments scheduled</p>
 </div>
 )}
 </div>
 )}

 {/* ── CARE PLAN ── */}
 {activeTab === 'careplan' && (
 <div className="space-y-3">
 <Section title="Care Pathway">
 <div className="rounded-lg p-4" style={{ background: '#0d948810', border: '1px solid #0d948830' }}>
 <p className="font-bold text-teal-800 dark:text-teal-300 capitalize">
 {patient?.care_pathway?.replace(/_/g, ' ') || 'Standard Palliative Care'}
 </p>
 <p className="text-xs text-[var(--text-500)] mt-1">
 Risk score: {patient?.risk_score ? `${Math.round(patient.risk_score * 100)}%` : ' - '}
 {' · '}Level: {patient?.risk_level || ' - '}
 </p>
 </div>
 </Section>

 <Section title="Patient Details">
 <div className="grid grid-cols-2 gap-2 text-sm">
 {[
 { l: 'Diagnosis', v: patient?.primary_diagnosis },
 { l: 'Status', v: patient?.status },
 { l: 'DNR Status', v: patient?.dnr_status ? 'Yes' : 'No' },
 { l: 'Advance Directive', v: patient?.advance_directive ? 'Yes' : 'No' },
 { l: 'Language', v: patient?.preferred_language },
 { l: 'Facility', v: patient?.facility_name },
 ].filter(r => r.v).map(({ l, v }) => (
 <div key={l} className="p-3 bg-[var(--card-bg)]/40 rounded-lg">
 <p className="text-[11px] text-[var(--text-400)] font-medium mb-0.5">{l}</p>
 <p className="font-semibold text-[var(--text-800)] text-xs capitalize">{v}</p>
 </div>
 ))}
 </div>
 </Section>

 {patient?.secondary_diagnoses && (
 <Section title="Secondary Diagnoses">
 <p className="text-sm text-[var(--text-600)]">{patient.secondary_diagnoses}</p>
 </Section>
 )}

 {patient?.emergency_contact_name && (
 <Section title="Emergency Contact">
 <div className="space-y-1 text-sm">
 <p className="font-semibold text-[var(--text-800)]">{patient.emergency_contact_name}</p>
 {patient.emergency_contact_relationship && (
 <p className="text-slate-500">{patient.emergency_contact_relationship}</p>
 )}
 {patient.emergency_contact_phone && (
 <p className="text-teal-600 font-medium">{patient.emergency_contact_phone}</p>
 )}
 </div>
 </Section>
 )}
 </div>
 )}

 </motion.div>
 </AnimatePresence>
 </div>

 {/* ── Record Vitals Modal ── */}
 <AnimatePresence>
 {showVitalsModal && (
 <>
 <motion.div key="vbdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
 onClick={() => setShowVitalsModal(false)}
 style={{ position:'fixed', inset:0, zIndex:9000, background:'rgba(15,23,42,0.55)', backdropFilter:'blur(4px)' }} />
 <div style={{ position:'fixed', inset:0, zIndex:9001, display:'flex', alignItems:'center', justifyContent:'center', padding:16, pointerEvents:'none' }}>
 <motion.div key="vmodal" initial={{opacity:0,scale:0.96,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96,y:8}}
 transition={{ type:'spring', damping:30, stiffness:360 }}
 onClick={e=>e.stopPropagation()}
 style={{ pointerEvents:'all', background:'var(--card-bg)', borderRadius:16, width:'100%', maxWidth:440, overflow:'hidden', boxShadow:'0 12px 60px rgba(15,23,42,0.2)' }}>
 <div style={{ height:3, background:'linear-gradient(90deg,#0d9488,#0891b2)' }} />
 <div style={{ padding:'18px 20px', borderBottom:'1px solid var(--card-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
 <div>
 <p style={{ fontWeight:800, fontSize:15, color:'var(--text-900)', margin:0 }}>Record Vitals</p>
 <p style={{ fontSize:11, color:'var(--text-400)', margin:'2px 0 0' }}>{patient?.full_name}</p>
 </div>
 <button onClick={() => setShowVitalsModal(false)}
 style={{ width:28, height:28, borderRadius:'50%', background:'var(--page-bg)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-500)' }}>
 <X size={13} />
 </button>
 </div>
 <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
 {[
 { key:'heart_rate', label:'Heart Rate (bpm)', placeholder:'e.g. 72' },
 { key:'oxygen_saturation', label:'O₂ Saturation (%)', placeholder:'e.g. 98' },
 { key:'temperature', label:'Temperature (°C)', placeholder:'e.g. 37.0' },
 { key:'respiratory_rate', label:'Respiratory Rate', placeholder:'e.g. 16' },
 ].map(f => (
 <div key={f.key}>
 <label style={{ fontSize:11, fontWeight:700, color:'var(--text-500)', display:'block', marginBottom:4 }}>{f.label}</label>
 <input type="number" value={vitalsForm[f.key]} onChange={e => setVitalsForm(p=>({...p,[f.key]:e.target.value}))}
 placeholder={f.placeholder}
 style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid var(--card-border)', background:'var(--page-bg)', color:'var(--text-800)', fontSize:13, outline:'none', boxSizing:'border-box' }}
 onFocus={e=>e.target.style.borderColor='var(--c-teal)'}
 onBlur={e=>e.target.style.borderColor='var(--card-border)'} />
 </div>
 ))}
 </div>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
 <div>
 <label style={{ fontSize:11, fontWeight:700, color:'var(--text-500)', display:'block', marginBottom:4 }}>BP Systolic (mmHg)</label>
 <input type="number" value={vitalsForm.blood_pressure_sys} onChange={e=>setVitalsForm(p=>({...p,blood_pressure_sys:e.target.value}))}
 placeholder="e.g. 120"
 style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid var(--card-border)', background:'var(--page-bg)', color:'var(--text-800)', fontSize:13, outline:'none', boxSizing:'border-box' }}
 onFocus={e=>e.target.style.borderColor='var(--c-teal)'}
 onBlur={e=>e.target.style.borderColor='var(--card-border)'} />
 </div>
 <div>
 <label style={{ fontSize:11, fontWeight:700, color:'var(--text-500)', display:'block', marginBottom:4 }}>BP Diastolic (mmHg)</label>
 <input type="number" value={vitalsForm.blood_pressure_dia} onChange={e=>setVitalsForm(p=>({...p,blood_pressure_dia:e.target.value}))}
 placeholder="e.g. 80"
 style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid var(--card-border)', background:'var(--page-bg)', color:'var(--text-800)', fontSize:13, outline:'none', boxSizing:'border-box' }}
 onFocus={e=>e.target.style.borderColor='var(--c-teal)'}
 onBlur={e=>e.target.style.borderColor='var(--card-border)'} />
 </div>
 </div>
 <div>
 <label style={{ fontSize:11, fontWeight:700, color:'var(--text-500)', display:'block', marginBottom:4 }}>Notes (optional)</label>
 <textarea value={vitalsForm.notes} onChange={e=>setVitalsForm(p=>({...p,notes:e.target.value}))} rows={2}
 placeholder="Any clinical observations…"
 style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid var(--card-border)', background:'var(--page-bg)', color:'var(--text-800)', fontSize:13, outline:'none', resize:'none', boxSizing:'border-box', fontFamily:'inherit' }}
 onFocus={e=>e.target.style.borderColor='var(--c-teal)'}
 onBlur={e=>e.target.style.borderColor='var(--card-border)'} />
 </div>
 <button onClick={() => recordVitalsMutation.mutate(vitalsForm)}
 disabled={recordVitalsMutation.isPending || !vitalsForm.heart_rate}
 style={{ width:'100%', padding:'11px 0', borderRadius:10, background:'linear-gradient(135deg,#0d9488,#0891b2)', color:'#fff', border:'none', cursor:'pointer', fontSize:14, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity: recordVitalsMutation.isPending || !vitalsForm.heart_rate ? 0.6 : 1 }}>
 {recordVitalsMutation.isPending ? <><Loader2 size={14} className="animate-spin"/> Saving…</> : <><CheckCircle size={14}/> Save Vitals</>}
 </button>
 </div>
 </motion.div>
 </div>
 </>
 )}
 </AnimatePresence>
 </div>
 );
}
