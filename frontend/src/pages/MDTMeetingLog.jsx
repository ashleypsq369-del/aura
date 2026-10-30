import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Users, Plus, Trash2, Save, ArrowLeft, Calendar,
 ClipboardList, CheckSquare, ChevronDown, ChevronUp
} from 'lucide-react';
import apiClient from '../api/client';
import toast from '../utils/toast';

const MEETING_TYPES = [
 { value: 'routine', label: 'Routine Review' },
 { value: 'urgent', label: 'Urgent Meeting' },
 { value: 'family_meeting', label: 'Family Meeting' },
 { value: 'discharge_planning', label: 'Discharge Planning' },
 { value: 'goals_of_care', label: 'Goals of Care Discussion' },
];

const ROLES = [
 'Palliative Care Physician', 'Nurse', 'Social Worker', 'Chaplain / Spiritual Care',
 'Physiotherapist', 'Occupational Therapist', 'Dietitian', 'Psychologist',
 'Family Member', 'Patient', 'Traditional Healer Liaison', 'Community Health Worker', 'Other'
];

const REFERRAL_TYPES = [
 'Physiotherapy', 'Occupational Therapy', 'Social Work', 'Chaplaincy / Spiritual Care',
 'Dietitian', 'Wound Care', 'Psychology', 'Traditional Healer Liaison',
 'Palliative Specialist', 'Other'
];

export default function MDTMeetingLog() {
 const { patientId } = useParams();
 const navigate = useNavigate();
 const queryClient = useQueryClient();

 const now = new Date().toISOString().slice(0, 16);

 const [form, setForm] = useState({
 meeting_date: now,
 meeting_type: 'routine',
 chair_name: '',
 clinical_summary: '',
 current_concerns: '',
 goals_of_care_discussed: false,
 acp_reviewed: false,
 care_plan_changes: '',
 medication_decisions: '',
 family_present: false,
 family_feedback: '',
 meeting_notes: '',
 next_meeting_date: '',
 });
 const [attendees, setAttendees] = useState([{ name: '', role: '' }]);
 const [actionItems, setActionItems] = useState([{ action: '', responsible: '', due_date: '' }]);
 const [referralsMade, setReferralsMade] = useState([]);
 const [expandedMeeting, setExpandedMeeting] = useState(null);

 const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

 const { data: patient } = useQuery({
 queryKey: ['patient', patientId],
 queryFn: async () => (await apiClient.get(`/api/patients/${patientId}`)).data,
 });

 const { data: meetings = [] } = useQuery({
 queryKey: ['mdt', patientId],
 queryFn: async () => {
 try {
 return (await apiClient.get(`/api/palliative/mdt/${patientId}`)).data;
 } catch { return []; }
 },
 });

 const mutation = useMutation({
 mutationFn: async (payload) => apiClient.post('/api/palliative/mdt', payload),
 onSuccess: () => {
 toast.success('MDT meeting record saved');
 queryClient.invalidateQueries(['mdt', patientId]);
 queryClient.invalidateQueries(['assessment-overview', patientId]);
 },
 onError: () => toast.error('Failed to save meeting record'),
 });

 const handleSubmit = (e) => {
 e.preventDefault();
 const validAttendees = attendees.filter(a => a.name.trim());
 const validActions = actionItems.filter(a => a.action.trim());
 mutation.mutate({
 patient_id: parseInt(patientId),
 ...form,
 attendees: validAttendees,
 action_items: validActions,
 referrals_made: referralsMade,
 });
 };

 const addAttendee = () => setAttendees(a => [...a, { name: '', role: '' }]);
 const removeAttendee = (i) => setAttendees(a => a.filter((_, idx) => idx !== i));
 const updateAttendee = (i, field, val) => setAttendees(a => a.map((att, idx) => idx === i ? { ...att, [field]: val } : att));

 const addAction = () => setActionItems(a => [...a, { action: '', responsible: '', due_date: '' }]);
 const removeAction = (i) => setActionItems(a => a.filter((_, idx) => idx !== i));
 const updateAction = (i, field, val) => setActionItems(a => a.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

 const toggleReferral = (type) => setReferralsMade(r => r.includes(type) ? r.filter(t => t !== type) : [...r, type]);

 const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-300 bg-[var(--card-bg)] text-[var(--text-900)] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
 const selectCls = inputCls;
 const textareaCls = `${inputCls} resize-none`;

 const Field = ({ label, children }) => (
 <div>
 <label className="block text-sm font-medium text-[var(--text-700)] mb-1">{label}</label>
 {children}
 </div>
 );

 const Section = ({ title, icon: Icon, color = 'teal', children }) => (
 <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden">
 <div className={`px-5 py-3 bg-${color}-50 dark:bg-${color}-900/20 border-b border-[var(--card-border)] flex items-center gap-2`}>
 <Icon className={`w-4 h-4 text-${color}-600 dark:text-${color}-400`} />
 <h3 className={`font-semibold text-${color}-900 dark:text-${color}-100 text-sm`}>{title}</h3>
 </div>
 <div className="p-5 space-y-4">{children}</div>
 </div>
 );

 return (
 <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
 {/* Header */}
 <div className="flex items-center gap-3">
 <button onClick={() => navigate(`/assessments/${patientId}`)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
 <ArrowLeft className="w-5 h-5 text-[var(--text-600)]" />
 </button>
 <div>
 <h1 className="text-2xl font-bold text-[var(--text-900)] flex items-center gap-2">
 <Users className="w-6 h-6 text-teal-600" />
 MDT Meeting Log
 </h1>
 {patient && <p className="text-[var(--text-500)] dark:text-[var(--text-400)] text-sm">{patient.full_name}</p>}
 </div>
 </div>

 {/* Previous Meetings */}
 {meetings.length > 0 && (
 <Section title={`Previous Meetings (${meetings.length})`} icon={Calendar} color="slate">
 <div className="space-y-2">
 {meetings.map((m) => (
 <div key={m.id} className="border border-[var(--card-border)] rounded-xl overflow-hidden">
 <button
 type="button"
 onClick={() => setExpandedMeeting(expandedMeeting === m.id ? null : m.id)}
 className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--card-bg)] dark:hover:bg-slate-700 transition text-left"
 >
 <div className="flex items-center gap-3">
 <span className="text-sm font-medium text-[var(--text-900)]">
 {new Date(m.meeting_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
 </span>
 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
 m.meeting_type === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
 m.meeting_type === 'family_meeting' ? 'bg-blue-100 text-teal-700 dark:bg-blue-900/30 dark:text-blue-300' :
 'bg-slate-100 text-[var(--text-600)]'
 }`}>
 {MEETING_TYPES.find(t => t.value === m.meeting_type)?.label || m.meeting_type}
 </span>
 <span className="text-xs text-slate-400">{m.attendees?.length || 0} attendees</span>
 </div>
 {expandedMeeting === m.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
 </button>
 <AnimatePresence>
 {expandedMeeting === m.id && (
 <motion.div
 initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
 className="border-t border-[var(--card-border)] px-4 py-3 space-y-2 bg-[var(--card-bg)] dark:bg-slate-750 text-sm"
 >
 {m.attendees?.length > 0 && (
 <div>
 <span className="font-medium text-[var(--text-600)]">Attendees: </span>
 <span className="text-[var(--text-700)]">{m.attendees.map(a => `${a.name} (${a.role})`).join(', ')}</span>
 </div>
 )}
 {m.clinical_summary && <div><span className="font-medium text-[var(--text-600)]">Summary: </span><span className="text-[var(--text-700)]">{m.clinical_summary}</span></div>}
 {m.decisions && <div><span className="font-medium text-[var(--text-600)]">Decisions: </span><span className="text-[var(--text-700)]">{m.decisions}</span></div>}
 {m.action_items?.length > 0 && (
 <div>
 <span className="font-medium text-[var(--text-600)]">Actions: </span>
 <ul className="mt-1 space-y-1">
 {m.action_items.map((a, i) => (
 <li key={i} className="text-[var(--text-700)]">• {a.action} - {a.responsible} {a.due_date && `(by ${a.due_date})`}</li>
 ))}
 </ul>
 </div>
 )}
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 ))}
 </div>
 </Section>
 )}

 {/* New Meeting Form */}
 <form onSubmit={handleSubmit} className="space-y-5">
 <Section title="Meeting Details" icon={Calendar} color="blue">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Field label="Meeting Date & Time *">
 <input type="datetime-local" className={inputCls} value={form.meeting_date}
 onChange={e => set('meeting_date', e.target.value)} required />
 </Field>
 <Field label="Meeting Type">
 <select className={selectCls} value={form.meeting_type} onChange={e => set('meeting_type', e.target.value)}>
 {MEETING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
 </select>
 </Field>
 <Field label="Chair / Facilitator">
 <input className={inputCls} value={form.chair_name} onChange={e => set('chair_name', e.target.value)}
 placeholder="e.g. Dr Mensah" />
 </Field>
 <div className="flex items-end gap-3">
 <label className="flex items-center gap-2 text-sm text-[var(--text-700)]">
 <input type="checkbox" checked={form.family_present} onChange={e => set('family_present', e.target.checked)} className="w-4 h-4 rounded text-teal-600" />
 Family member(s) present
 </label>
 </div>
 </div>
 </Section>

 {/* Attendees */}
 <Section title="Attendees" icon={Users} color="indigo">
 <div className="space-y-2">
 {attendees.map((att, i) => (
 <div key={i} className="flex items-center gap-2">
 <input className={`${inputCls} flex-1`} placeholder="Name" value={att.name}
 onChange={e => updateAttendee(i, 'name', e.target.value)} />
 <select className={`${selectCls} flex-1`} value={att.role}
 onChange={e => updateAttendee(i, 'role', e.target.value)}>
 <option value="">Select role</option>
 {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
 </select>
 {attendees.length > 1 && (
 <button type="button" onClick={() => removeAttendee(i)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition">
 <Trash2 className="w-4 h-4" />
 </button>
 )}
 </div>
 ))}
 </div>
 <button type="button" onClick={addAttendee} className="flex items-center gap-2 text-sm text-teal-600 dark:text-blue-400 hover:underline">
 <Plus className="w-3.5 h-3.5" /> Add attendee
 </button>
 </Section>

 {/* Clinical Review */}
 <Section title="Clinical Review" icon={ClipboardList} color="teal">
 <Field label="Clinical Summary">
 <textarea className={textareaCls} rows={3} value={form.clinical_summary}
 onChange={e => set('clinical_summary', e.target.value)}
 placeholder="Patient's current clinical status, symptom burden, functional level..." />
 </Field>
 <Field label="Current Concerns">
 <textarea className={textareaCls} rows={2} value={form.current_concerns}
 onChange={e => set('current_concerns', e.target.value)}
 placeholder="Key issues to address today..." />
 </Field>
 <div className="flex gap-4 flex-wrap">
 <label className="flex items-center gap-2 text-sm text-[var(--text-700)]">
 <input type="checkbox" checked={form.goals_of_care_discussed} onChange={e => set('goals_of_care_discussed', e.target.checked)} className="w-4 h-4 rounded text-teal-600" />
 Goals of care discussed
 </label>
 <label className="flex items-center gap-2 text-sm text-[var(--text-700)]">
 <input type="checkbox" checked={form.acp_reviewed} onChange={e => set('acp_reviewed', e.target.checked)} className="w-4 h-4 rounded text-teal-600" />
 ACP reviewed
 </label>
 </div>
 <Field label="Care Plan Changes">
 <textarea className={textareaCls} rows={2} value={form.care_plan_changes}
 onChange={e => set('care_plan_changes', e.target.value)} />
 </Field>
 <Field label="Medication Decisions">
 <textarea className={textareaCls} rows={2} value={form.medication_decisions}
 onChange={e => set('medication_decisions', e.target.value)} />
 </Field>
 {form.family_present && (
 <Field label="Family Feedback">
 <textarea className={textareaCls} rows={2} value={form.family_feedback}
 onChange={e => set('family_feedback', e.target.value)} />
 </Field>
 )}
 </Section>

 {/* Referrals Agreed */}
 <Section title="Referrals Agreed in This Meeting" icon={CheckSquare} color="green">
 <div className="flex flex-wrap gap-2">
 {REFERRAL_TYPES.map(type => (
 <button
 key={type}
 type="button"
 onClick={() => toggleReferral(type)}
 className={`px-3 py-1.5 rounded-full text-sm border-2 transition ${
 referralsMade.includes(type)
 ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
 : 'border-[var(--card-border)] text-[var(--text-600)] hover:border-green-300'
 }`}
 >
 {type}
 </button>
 ))}
 </div>
 </Section>

 {/* Action Items */}
 <Section title="Action Items" icon={CheckSquare} color="amber">
 <div className="space-y-2">
 {actionItems.map((item, i) => (
 <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 items-start">
 <input className={inputCls} placeholder="Action / task" value={item.action}
 onChange={e => updateAction(i, 'action', e.target.value)} />
 <input className={inputCls} placeholder="Responsible" value={item.responsible}
 onChange={e => updateAction(i, 'responsible', e.target.value)} />
 <input type="date" className={inputCls} value={item.due_date}
 onChange={e => updateAction(i, 'due_date', e.target.value)} />
 {actionItems.length > 1 && (
 <button type="button" onClick={() => removeAction(i)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition">
 <Trash2 className="w-4 h-4" />
 </button>
 )}
 </div>
 ))}
 </div>
 <button type="button" onClick={addAction} className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:underline">
 <Plus className="w-3.5 h-3.5" /> Add action item
 </button>
 </Section>

 {/* Follow-up */}
 <Section title="Follow-up" icon={Calendar} color="slate">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Field label="Next Meeting Date">
 <input type="date" className={inputCls} value={form.next_meeting_date}
 onChange={e => set('next_meeting_date', e.target.value)} />
 </Field>
 </div>
 <Field label="General Meeting Notes">
 <textarea className={textareaCls} rows={2} value={form.meeting_notes}
 onChange={e => set('meeting_notes', e.target.value)} />
 </Field>
 </Section>

 <div className="flex items-center gap-3 justify-end">
 <button type="button" onClick={() => navigate(`/assessments/${patientId}`)}
 className="px-5 py-2.5 rounded-xl border border-slate-300 text-[var(--text-700)] hover:bg-[var(--card-bg)] dark:hover:bg-slate-700 transition text-sm font-medium">
 Cancel
 </button>
 <button type="submit" disabled={mutation.isLoading}
 className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm transition disabled:opacity-50">
 <Save className="w-4 h-4" />
 {mutation.isLoading ? 'Saving...' : 'Save Meeting Record'}
 </button>
 </div>
 </form>
 </div>
 );
}
