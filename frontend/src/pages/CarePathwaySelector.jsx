/**
 * CarePathwaySelector
 * Guided onboarding wizard - "What does your loved one need?"
 * Feature 7: Care Pathway Selector
 * Route: /care-pathway-selector
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Stethoscope, Heart, Navigation, Coffee, ClipboardList,
 CheckCircle, ChevronRight, ChevronLeft, ArrowRight,
} from 'lucide-react';
import { carePathwaysAPI, patientsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { usePatientId } from '../hooks/usePatientId';
import { toast } from 'sonner';

const ICON_MAP = {
 Stethoscope, Heart, Navigation, Coffee, ClipboardList,
};

const SUPPORT_LEVELS = [
 { key: 'basic', label: 'Basic', desc: '1–2 visits per week' },
 { key: 'standard', label: 'Standard', desc: '3–4 visits per week' },
 { key: 'intensive', label: 'Intensive', desc: 'Daily or twice-daily' },
];

export default function CarePathwaySelector() {
 const navigate = useNavigate();
 const { user } = useAuth();
 const { patientId } = usePatientId();
 const qc = useQueryClient();

 const [step, setStep] = useState(0); // 0=pathway, 1=services, 2=support, 3=concern, 4=done
 const [selected, setSelected] = useState({
 pathway_type: null,
 selected_services: [],
 support_level: 'standard',
 primary_concern: '',
 });

 const { data: optionsData, isLoading: loadingOptions } = useQuery({
 queryKey: ['pathway-options'],
 queryFn: () => carePathwaysAPI.getOptions().then(r => r.data),
 });

 const { mutate, isPending } = useMutation({
 mutationFn: (data) => carePathwaysAPI.select(data),
 onSuccess: () => {
 qc.invalidateQueries({ queryKey: ['care-pathways', patientId] });
 setStep(4);
 },
 onError: () => toast.error('Could not save your selection'),
 });

 const pathways = optionsData?.pathways || [];
 const activePathway = pathways.find(p => p.key === selected.pathway_type);

 function toggleService(svc) {
 setSelected(s => ({
 ...s,
 selected_services: s.selected_services.includes(svc)
 ? s.selected_services.filter(x => x !== svc)
 : [...s.selected_services, svc],
 }));
 }

 function handleSubmit() {
 if (!patientId) { toast.error('No patient profile linked'); return; }
 mutate({
 patient_id: patientId,
 pathway_type: selected.pathway_type,
 selected_services: selected.selected_services,
 support_level: selected.support_level,
 primary_concern: selected.primary_concern,
 });
 }

 const STEPS = ['Choose Pathway', 'Select Services', 'Support Level', 'Your Concern'];

 return (
 <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#c2dde8' }}>
 <div className="w-full max-w-lg">
 {/* Progress indicator */}
 {step < 4 && (
 <div className="mb-6">
 <div className="flex items-center gap-1 mb-2">
 {STEPS.map((label, idx) => (
 <div key={idx} className="flex items-center flex-1">
 <div
 className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
 style={{
 background: idx <= step ? '#0d9488' : '#cbd5e1',
 color: '#fff',
 }}
 >
 {idx < step ? <CheckCircle size={12} /> : idx + 1}
 </div>
 {idx < STEPS.length - 1 && (
 <div className="flex-1 h-0.5 mx-1" style={{ background: idx < step ? '#0d9488' : '#e2e8f0' }} />
 )}
 </div>
 ))}
 </div>
 <p className="text-[11px] text-slate-500 text-center">{STEPS[step]}</p>
 </div>
 )}

 <AnimatePresence mode="wait">
 {/* STEP 0: Choose pathway */}
 {step === 0 && (
 <motion.div key="step0"
 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
 className="space-y-4"
 >
 <div className="text-center mb-2">
 <h1 className="text-xl font-bold text-slate-800 dark:text-white">What does your loved one need?</h1>
 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
 Choose the care pathway that best fits their situation.
 </p>
 </div>

 {loadingOptions ? (
 <div className="space-y-3">
 {[1,2,3].map(i => (
 <div key={i} className="h-20 bg-slate-50 dark:bg-slate-800 rounded-xl animate-pulse border border-slate-200 dark:border-slate-700" />
 ))}
 </div>
 ) : (
 <div className="space-y-3">
 {pathways.map(p => {
 const Icon = ICON_MAP[p.icon] || Stethoscope;
 const isSelected = selected.pathway_type === p.key;
 return (
 <button
 key={p.key}
 onClick={() => setSelected(s => ({ ...s, pathway_type: p.key }))}
 className="w-full text-left rounded-xl border transition-all p-4 flex items-center gap-3"
 style={{
 background: isSelected ? `${p.color}12` : 'white',
 borderColor: isSelected ? p.color : '#e2e8f0',
 boxShadow: isSelected ? `0 0 0 2px ${p.color}30` : undefined,
 }}
 >
 <div
 className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
 style={{ background: `${p.color}18`, color: p.color }}
 >
 <Icon size={18} />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-semibold text-slate-800 text-sm">{p.title}</p>
 <p className="text-xs text-slate-500 leading-tight">{p.description}</p>
 </div>
 {isSelected && <CheckCircle size={18} style={{ color: p.color }} />}
 </button>
 );
 })}
 </div>
 )}

 <button
 onClick={() => setStep(1)}
 disabled={!selected.pathway_type}
 className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40"
 style={{ background: '#0d9488' }}
 >
 Continue <ChevronRight size={16} />
 </button>
 </motion.div>
 )}

 {/* STEP 1: Services */}
 {step === 1 && activePathway && (
 <motion.div key="step1"
 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
 className="space-y-4"
 >
 <div>
 <h2 className="text-lg font-bold text-slate-800">Select services</h2>
 <p className="text-sm text-slate-500">
 Choose all that apply under <strong>{activePathway.title}</strong>
 </p>
 </div>

 <div className="space-y-2">
 {activePathway.services.map(svc => {
 const checked = selected.selected_services.includes(svc);
 return (
 <button
 key={svc}
 onClick={() => toggleService(svc)}
 className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
 style={{
 background: checked ? '#0d948812' : 'white',
 borderColor: checked ? '#0d9488' : '#e2e8f0',
 }}
 >
 <div
 className="w-5 h-5 rounded flex items-center justify-center border-2 transition-all"
 style={{ borderColor: checked ? '#0d9488' : '#cbd5e1', background: checked ? '#0d9488' : 'white' }}
 >
 {checked && <CheckCircle size={12} color="white" strokeWidth={3} />}
 </div>
 <span className="text-sm text-slate-700 capitalize">{svc.replace(/_/g, ' ')}</span>
 </button>
 );
 })}
 </div>

 <div className="flex gap-2">
 <button onClick={() => setStep(0)}
 className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 flex items-center gap-1">
 <ChevronLeft size={14} /> Back
 </button>
 <button onClick={() => setStep(2)}
 className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1"
 style={{ background: '#0d9488' }}>
 Continue <ChevronRight size={16} />
 </button>
 </div>
 </motion.div>
 )}

 {/* STEP 2: Support level */}
 {step === 2 && (
 <motion.div key="step2"
 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
 className="space-y-4"
 >
 <div>
 <h2 className="text-lg font-bold text-slate-800">How much support is needed?</h2>
 <p className="text-sm text-slate-500">This helps us schedule the right frequency of visits.</p>
 </div>

 <div className="space-y-3">
 {SUPPORT_LEVELS.map(lvl => {
 const isSelected = selected.support_level === lvl.key;
 return (
 <button
 key={lvl.key}
 onClick={() => setSelected(s => ({ ...s, support_level: lvl.key }))}
 className="w-full text-left p-4 rounded-xl border transition-all"
 style={{
 background: isSelected ? '#0d948812' : 'white',
 borderColor: isSelected ? '#0d9488' : '#e2e8f0',
 }}
 >
 <div className="flex items-center justify-between">
 <div>
 <p className="font-semibold text-slate-800 text-sm">{lvl.label}</p>
 <p className="text-xs text-slate-500">{lvl.desc}</p>
 </div>
 {isSelected && <CheckCircle size={18} className="text-teal-600" />}
 </div>
 </button>
 );
 })}
 </div>

 <div className="flex gap-2">
 <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 flex items-center gap-1">
 <ChevronLeft size={14} /> Back
 </button>
 <button onClick={() => setStep(3)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1" style={{ background: '#0d9488' }}>
 Continue <ChevronRight size={16} />
 </button>
 </div>
 </motion.div>
 )}

 {/* STEP 3: Primary concern */}
 {step === 3 && (
 <motion.div key="step3"
 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
 className="space-y-4"
 >
 <div>
 <h2 className="text-lg font-bold text-slate-800">Your main concern</h2>
 <p className="text-sm text-slate-500">
 Help us personalise the care plan by telling us what matters most.
 </p>
 </div>

 <textarea
 value={selected.primary_concern}
 onChange={e => setSelected(s => ({ ...s, primary_concern: e.target.value }))}
 rows={4}
 placeholder="e.g. My father has severe pain and difficulty moving. We need help with wound care and daily medication…"
 className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
 />

 <div className="flex gap-2">
 <button onClick={() => setStep(2)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 flex items-center gap-1">
 <ChevronLeft size={14} /> Back
 </button>
 <button
 onClick={handleSubmit}
 disabled={isPending}
 className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
 style={{ background: '#0d9488' }}
 >
 {isPending ? 'Saving…' : <>Confirm <ArrowRight size={16} /></>}
 </button>
 </div>
 </motion.div>
 )}

 {/* STEP 4: Done */}
 {step === 4 && (
 <motion.div key="step4"
 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
 className="text-center space-y-4"
 >
 <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto">
 <CheckCircle size={32} className="text-teal-600" />
 </div>
 <h2 className="text-xl font-bold text-slate-800">Care pathway saved</h2>
 <p className="text-sm text-slate-500">
 We've noted your preferences for <strong>{activePathway?.title || selected.pathway_type}</strong>.
 Your care team will reach out to arrange visits.
 </p>
 <button
 onClick={() => navigate('/my-space')}
 className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
 style={{ background: '#0d9488' }}
 >
 Back to My Space
 </button>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 );
}
