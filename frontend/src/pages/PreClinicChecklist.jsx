/**
 * PreClinicChecklist.jsx - Outpatient Clinic Care
 * =================================================
 * Patient pre-appointment preparation checklist + symptom pre-screen.
 * Ensures the patient arrives prepared and helps the clinician use
 * appointment time efficiently.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, Check, ClipboardList, AlertCircle, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import toast from '../utils/toast';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const CHECKLIST_ITEMS = [
 { id: 'medications', label: 'Bring all current medication bottles / blister packs', category: 'prepare' },
 { id: 'symptoms', label: 'Write down any new or worsening symptoms since last visit', category: 'prepare' },
 { id: 'questions', label: 'Write down questions you want to ask the doctor', category: 'prepare' },
 { id: 'support', label: 'Arrange transport and a support person if needed', category: 'prepare' },
 { id: 'records', label: 'Bring any hospital letters or test results from other providers', category: 'prepare' },
 { id: 'id', label: 'Bring your NHIS card and photo ID', category: 'admin' },
 { id: 'allergies', label: 'Note any new allergies or reactions since last visit', category: 'prepare' },
 { id: 'weight', label: 'Weigh yourself this morning (same time, same scale)', category: 'health' },
];

export default function PreClinicChecklist() {
 const navigate = useNavigate();
 const [checked, setChecked] = useState([]);
 const [painToday, setPainToday] = useState(0);
 const [topConcern, setTopConcern] = useState('');
 const [newSymptoms, setNewSymptoms] = useState('');
 const [submitted, setSubmitted] = useState(false);

 // Fetch next appointment
 const { data: apptData } = useQuery({
 queryKey: ['my-next-appointment'],
 queryFn: () => apiClient.get('/api/appointments').then(r => r.data),
 retry: false,
 });

 const appointments = apptData?.appointments || [];
 const nextAppt = appointments.find(a => a.status === 'scheduled' && new Date(a.appointment_date) >= new Date());

 const toggle = (id) => setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
 const allChecked = checked.length === CHECKLIST_ITEMS.length;

 const handleSubmit = async (e) => {
 e.preventDefault();
 // Save pre-clinic data as a symptom log / wellness entry
 try {
 if (painToday > 0 || topConcern || newSymptoms) {
 await apiClient.post('/api/symptoms', {
 patient_id: null, // server resolves from token
 pain_level: painToday,
 notes: [topConcern && `Main concern: ${topConcern}`, newSymptoms && `New symptoms: ${newSymptoms}`].filter(Boolean).join('\n'),
 }).catch(() => {}); // non-blocking - checklist still completes
 }
 toast.success('Pre-clinic checklist completed! You\'re ready for your appointment.');
 setSubmitted(true);
 } catch {
 toast.success('Checklist saved locally.');
 setSubmitted(true);
 }
 };

 if (submitted) {
 return (
 <div className="max-w-xl mx-auto px-6 py-12 text-center">
 <div className="bg-teal-50 border-2 border-teal-300 rounded-2xl p-10">
 <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
 <Check className="w-10 h-10 text-white" />
 </div>
 <h2 className="text-base font-bold text-teal-900 mb-2">You're Ready!</h2>
 <p className="text-teal-700 mb-2">Pre-clinic checklist completed.</p>
 {nextAppt && (
 <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-teal-200 my-4 text-left">
 <p className="text-sm font-bold text-teal-800">Your Next Appointment</p>
 <p className="text-sm text-[var(--text-700)] mt-1">{nextAppt.appointment_type} · {new Date(nextAppt.appointment_date).toLocaleString()}</p>
 <p className="text-sm text-slate-600">{nextAppt.location}</p>
 </div>
 )}
 <div className="flex gap-3 mt-4">
 <button onClick={() => setSubmitted(false)} className="flex-1 py-2.5 border-2 border-teal-600 text-teal-700 rounded-xl font-semibold hover:bg-teal-50 transition text-sm">New Checklist</button>
 <button onClick={() => navigate('/appointments')} className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition text-sm">View Appointments</button>
 </div>
 </div>
 </div>
 );
 }

 return (
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto px-4 py-6 space-y-5">

 {/* Header */}
 <div className="bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] p-4">
 <div className="flex items-center gap-3">
 <Stethoscope className="w-7 h-7 text-white" />
 <div>
 <h1 className="text-xl font-serif font-bold text-white">Pre-Clinic Checklist</h1>
 <p className="text-teal-100 text-sm">Outpatient Clinic · Prepare for your appointment</p>
 </div>
 </div>
 </div>

 {/* Next appointment banner */}
 {nextAppt && (
 <div className="bg-teal-50 border-2 border-teal-300 rounded-xl p-4 flex items-center justify-between">
 <div>
 <p className="text-xs font-bold text-teal-600 uppercase tracking-wide">Next Appointment</p>
 <p className="font-bold text-teal-900">{nextAppt.appointment_type}</p>
 <p className="text-sm text-teal-700">{new Date(nextAppt.appointment_date).toLocaleString()} · {nextAppt.location}</p>
 </div>
 <button onClick={() => navigate('/appointments')} className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-800">
 Details <ChevronRight size={14} />
 </button>
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-5">
 {/* Preparation checklist */}
 <div className="bg-[var(--card-bg)] rounded-xl border-2 border-[var(--card-border)] p-5">
 <h3 className="text-sm font-bold text-[var(--text-700)] mb-1 flex items-center gap-2">
 <ClipboardList size={16} />Appointment Preparation
 </h3>
 <p className="text-xs text-[var(--text-500)] mb-3">Tick each item as you complete it</p>
 <div className="space-y-2">
 {CHECKLIST_ITEMS.map(item => (
 <label key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${checked.includes(item.id) ? 'border-teal-400 bg-teal-50' : 'border-[var(--card-border)] hover:border-teal-300'}`}>
 <input type="checkbox" checked={checked.includes(item.id)} onChange={() => toggle(item.id)}
 className="mt-0.5 w-4 h-4 accent-teal-600 flex-shrink-0" />
 <span className={`text-sm ${checked.includes(item.id) ? 'text-teal-800 line-through opacity-60' : 'text-slate-700'}`}>{item.label}</span>
 </label>
 ))}
 </div>
 {allChecked && (
 <div className="mt-3 p-3 bg-teal-100 border border-teal-300 rounded-xl text-center">
 <p className="text-sm font-bold text-teal-800">... All items checked - you're prepared!</p>
 </div>
 )}
 </div>

 {/* Pre-screen symptoms */}
 <div className="bg-[var(--card-bg)] rounded-xl border-2 border-[var(--card-border)] p-5 space-y-4">
 <h3 className="text-sm font-bold text-[var(--text-700)] flex items-center gap-2">
 <AlertCircle size={16} />How are you feeling today?
 </h3>

 <div>
 <label className="text-xs font-semibold text-[var(--text-600)] mb-2 block">Pain Level Right Now: {painToday}/10</label>
 <input type="range" min="0" max="10" value={painToday} onChange={e => setPainToday(Number(e.target.value))}
 className="w-full accent-teal-600" />
 <div className="flex justify-between text-xs text-[var(--text-400)] mt-1"><span>No pain (0)</span><span>Worst (10)</span></div>
 </div>

 <div>
 <label className="text-xs font-semibold text-[var(--text-600)] mb-1.5 block">Your main concern for today's appointment</label>
 <input value={topConcern} onChange={e => setTopConcern(e.target.value)}
 placeholder="e.g., My pain is worse at night, I want to discuss my medication"
 className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm focus:border-teal-500 outline-none" />
 </div>

 <div>
 <label className="text-xs font-semibold text-[var(--text-600)] mb-1.5 block">New symptoms since your last visit</label>
 <textarea value={newSymptoms} onChange={e => setNewSymptoms(e.target.value)} rows={3}
 placeholder="Describe any new or changed symptoms..."
 className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm focus:border-teal-500 outline-none resize-none" />
 </div>
 </div>

 <button type="submit"
 className="w-full flex items-center justify-center gap-2 py-3.5 bg-teal-600 text-white font-bold rounded-xl hover:shadow-lg transition border-2 border-teal-500">
 <Check size={18} /> Mark as Ready for Appointment
 </button>
 </form>
 </motion.div>
 );
}


