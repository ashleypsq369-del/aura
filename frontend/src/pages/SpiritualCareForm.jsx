import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Save, ArrowLeft, ChevronDown, ChevronUp, Shield, Eye, EyeOff } from 'lucide-react';
import apiClient from '../api/client';
import toast from '../utils/toast';

const FAITH_TRADITIONS = [
  { value: 'christian', label: 'Christian', detail: 'e.g. Catholic, Methodist, Pentecostal, Anglican...' },
  { value: 'muslim', label: 'Muslim', detail: 'e.g. Sunni, Shia, Sufi...' },
  { value: 'traditional_african', label: 'Traditional African', detail: 'e.g. Akan, Ewe, Ga, Dagomba tradition...' },
  { value: 'hindu', label: 'Hindu', detail: '' },
  { value: 'buddhist', label: 'Buddhist', detail: '' },
  { value: 'bahai', label: "Bahá'í", detail: '' },
  { value: 'spiritual_not_religious', label: 'Spiritual, not religious', detail: '' },
  { value: 'no_religion', label: 'Secular / No religion', detail: '' },
  { value: 'other', label: 'Other', detail: '' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', detail: '' },
];

const CARE_PROVIDER_TYPES = [
  'Hospital Chaplain', 'Imam', 'Pastor / Reverend', 'Priest / Father',
  'Traditional Elder / Chief', 'Sangoma / Herbalist', 'Buddhist Monk / Nun',
  'Secular Counsellor', 'Community Spiritual Leader', 'Spiritual Care Worker', 'Other'
];

const VISIT_TYPES = [
  { value: 'prayer', label: 'Prayer' },
  { value: 'reading', label: 'Scripture / Sacred Text Reading' },
  { value: 'listening', label: 'Listening / Presence' },
  { value: 'ritual', label: 'Ritual / Ceremony' },
  { value: 'anointing', label: 'Anointing / Blessing' },
  { value: 'communion', label: 'Holy Communion / Eucharist' },
  { value: 'libation', label: 'Libation Ceremony' },
  { value: 'ancestral_rites', label: 'Ancestral Acknowledgement Rites' },
  { value: 'meditation', label: 'Meditation / Mindfulness' },
  { value: 'music', label: 'Music / Hymns / Nasheeds' },
  { value: 'storytelling', label: 'Storytelling / Life Review' },
  { value: 'counselling', label: 'Spiritual Counselling' },
  { value: 'reconciliation', label: 'Reconciliation / Forgiveness' },
  { value: 'other', label: 'Other' },
];

const SPIRITUAL_NEEDS = [
  'Meaning & Purpose', 'Forgiveness', 'Hope', 'Connection', 'Reconciliation',
  'Peace', 'Ritual / Rites', 'Prayer', 'Sacred Text', 'Music', 'Legacy',
  'Ancestral Connection', 'None expressed',
];

export default function SpiritualCareForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const now = new Date().toISOString().slice(0, 16);

  const [form, setForm] = useState({
    visit_date: now,
    faith_tradition: '',
    faith_tradition_detail: '',
    specific_denomination: '',
    care_provider_type: '',
    care_provider_name: '',
    visit_type: '',
    visit_duration_minutes: '',
    spiritual_distress_level: 5,
    family_present: false,
    interventions_provided: '',
    sacred_items_needed: '',
    referral_to_community_leader: false,
    community_leader_name: '',
    patient_response: '',
    comfort_level_after: 5,
    meaning_making_supported: false,
    reconciliation_facilitated: false,
    unresolved_concerns: '',
    patient_wishes_expressed: '',
    follow_up_needed: false,
    follow_up_date: '',
    confidential: true,
    notes: '',
  });
  const [selectedNeeds, setSelectedNeeds] = useState([]);
  const [expandedHistory, setExpandedHistory] = useState(null);
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const toggleNeed = (n) => setSelectedNeeds(s => s.includes(n) ? s.filter(x => x !== n) : [...s, n]);

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => (await apiClient.get(`/api/patients/${patientId}`)).data,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['spiritual-care', patientId],
    queryFn: async () => {
      try { return (await apiClient.get(`/api/palliative/chaplain/${patientId}`)).data; }
      catch { return []; }
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload) => apiClient.post('/api/palliative/chaplain', payload),
    onSuccess: () => {
      toast.success('Spiritual care note saved');
      queryClient.invalidateQueries(['spiritual-care', patientId]);
      queryClient.invalidateQueries(['assessment-overview', patientId]);
      navigate(`/assessments/${patientId}`);
    },
    onError: () => toast.error('Failed to save note'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      patient_id: parseInt(patientId),
      ...form,
      visit_duration_minutes: form.visit_duration_minutes ? parseInt(form.visit_duration_minutes) : null,
      spiritual_needs: JSON.stringify(selectedNeeds),
    });
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-[#f0f6fa] dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
  const textareaCls = `${inputCls} resize-none`;
  const selectCls = inputCls;

  const Section = ({ title, icon: Icon, color = 'violet', children }) => (
    <div className="bg-[#f0f6fa] dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className={`px-5 py-3 bg-${color}-50 dark:bg-${color}-900/20 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2`}>
        <Icon className={`w-4 h-4 text-${color}-600 dark:text-${color}-400`} />
        <h3 className={`font-semibold text-${color}-900 dark:text-${color}-100 text-sm`}>{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );

  const Field = ({ label, hint, children }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/assessments/${patientId}`)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Heart className="w-6 h-6 text-teal-600" />
            Spiritual & Wellbeing Care Note
          </h1>
          {patient && <p className="text-slate-500 dark:text-slate-400 text-sm">{patient.full_name}</p>}
        </div>
      </div>

      <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-xl px-4 py-3 text-sm text-violet-800 dark:text-violet-200">
        <strong>Inclusive spiritual care</strong> — this form supports all faith traditions and belief systems: Christian, Muslim, Traditional African, Buddhist, Hindu, Bahá'í, secular, and others. All fields use respectful, tradition-neutral language.
      </div>

      {/* Previous Visits */}
      {history.length > 0 && (
        <Section title={`Previous Visits (${history.length})`} icon={Heart} color="slate">
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.id} className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden">
                <button type="button" onClick={() => setExpandedHistory(expandedHistory === h.id ? null : h.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {new Date(h.visit_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-violet-100 text-teal-700 dark:bg-violet-900/30 dark:text-violet-300">{h.visit_type}</span>
                    <span className="text-xs text-slate-400">{h.religious_denomination}</span>
                  </div>
                  {expandedHistory === h.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                <AnimatePresence>
                  {expandedHistory === h.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="border-t border-slate-200 dark:border-slate-600 px-4 py-3 bg-slate-50 dark:bg-slate-750 text-sm space-y-1">
                      {h.spiritual_needs && <div><span className="font-medium text-slate-600 dark:text-slate-300">Needs: </span><span className="text-slate-700 dark:text-slate-200">{h.spiritual_needs}</span></div>}
                      {h.interventions && <div><span className="font-medium text-slate-600 dark:text-slate-300">Interventions: </span><span className="text-slate-700 dark:text-slate-200">{h.interventions}</span></div>}
                      {h.notes && <div><span className="font-medium text-slate-600 dark:text-slate-300">Notes: </span><span className="text-slate-700 dark:text-slate-200">{h.notes}</span></div>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </Section>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Visit Details */}
        <Section title="Visit Details" icon={Heart} color="violet">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Visit Date & Time *">
              <input type="datetime-local" className={inputCls} value={form.visit_date} onChange={e => set('visit_date', e.target.value)} required />
            </Field>
            <Field label="Duration (minutes)">
              <input type="number" className={inputCls} min="1" max="240" value={form.visit_duration_minutes} onChange={e => set('visit_duration_minutes', e.target.value)} placeholder="e.g. 30" />
            </Field>
            <Field label="Care Provider Type">
              <select className={selectCls} value={form.care_provider_type} onChange={e => set('care_provider_type', e.target.value)}>
                <option value="">Select type...</option>
                {CARE_PROVIDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Care Provider Name">
              <input className={inputCls} placeholder="Name of chaplain, imam, pastor, elder, counsellor..." value={form.care_provider_name} onChange={e => set('care_provider_name', e.target.value)} />
            </Field>
          </div>
          <Field label="Type of Visit">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VISIT_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => set('visit_type', t.value)}
                  className={`text-left px-3 py-2 rounded-lg border-2 text-xs transition ${
                    form.visit_type === t.value
                      ? 'border-teal-500 bg-violet-50 dark:bg-violet-900/30'
                      : 'border-slate-200 dark:border-slate-600 hover:border-violet-300'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </Field>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="fam" checked={form.family_present} onChange={e => set('family_present', e.target.checked)} className="w-4 h-4 rounded text-teal-600" />
            <label htmlFor="fam" className="text-sm text-slate-700 dark:text-slate-300">Family member(s) present during visit</label>
          </div>
        </Section>

        {/* Faith / Tradition (patient-identified) */}
        <Section title="Patient's Spiritual Background" icon={Heart} color="blue">
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">Always based on what the patient identifies — never assumed.</p>
          <Field label="Faith Tradition (as identified by patient)">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FAITH_TRADITIONS.map(t => (
                <button key={t.value} type="button" onClick={() => set('faith_tradition', t.value)}
                  className={`text-left px-3 py-2 rounded-lg border-2 text-sm transition ${
                    form.faith_tradition === t.value
                      ? 'border-teal-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-slate-200 dark:border-slate-600 hover:border-blue-300'
                  }`}>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{t.label}</div>
                  {t.detail && <div className="text-xs text-slate-400 mt-0.5">{t.detail}</div>}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Specific Denomination / Branch" hint="e.g. Catholic, Sunni, Akan tradition, Ga Homowo">
              <input className={inputCls} value={form.specific_denomination} onChange={e => set('specific_denomination', e.target.value)} />
            </Field>
            <Field label="Additional Detail">
              <input className={inputCls} value={form.faith_tradition_detail} onChange={e => set('faith_tradition_detail', e.target.value)} placeholder="Any further context..." />
            </Field>
          </div>
        </Section>

        {/* Spiritual Needs Assessment */}
        <Section title="Spiritual Needs Assessment" icon={Heart} color="indigo">
          <Field label={`Spiritual Distress Level: ${form.spiritual_distress_level}/10`} hint="0 = No distress, 10 = Severe existential / spiritual distress">
            <input type="range" min="0" max="10" step="1" className="w-full accent-indigo-600"
              value={form.spiritual_distress_level} onChange={e => set('spiritual_distress_level', parseInt(e.target.value))} />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>No distress</span><span>Moderate</span><span>Severe</span>
            </div>
          </Field>
          <Field label="Spiritual Needs Identified (select all that apply)">
            <div className="flex flex-wrap gap-2">
              {SPIRITUAL_NEEDS.map(n => (
                <button key={n} type="button" onClick={() => toggleNeed(n)}
                  className={`px-3 py-1.5 rounded-full text-xs border-2 transition ${
                    selectedNeeds.includes(n)
                      ? 'border-teal-500 bg-indigo-50 dark:bg-indigo-900/30 text-teal-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-300'
                  }`}>{n}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        {/* Interventions */}
        <Section title="Interventions & Care Provided" icon={Heart} color="teal">
          <Field label="Interventions Provided" hint="Describe what was done — in neutral, inclusive language">
            <textarea className={textareaCls} rows={3} value={form.interventions_provided}
              onChange={e => set('interventions_provided', e.target.value)}
              placeholder="e.g. 'Offered prayer in Twi', 'Quranic recitation', 'Libation ceremony with family', 'Reflective listening session'..." />
          </Field>
          <Field label="Sacred / Spiritual Items Needed or Used" hint="e.g. prayer mat, rosary, Bible, Quran, libation bowl, candles">
            <input className={inputCls} value={form.sacred_items_needed} onChange={e => set('sacred_items_needed', e.target.value)} />
          </Field>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="ref" checked={form.referral_to_community_leader} onChange={e => set('referral_to_community_leader', e.target.checked)} className="w-4 h-4 rounded text-teal-600" />
            <label htmlFor="ref" className="text-sm text-slate-700 dark:text-slate-300">Referral made to community / religious leader</label>
          </div>
          {form.referral_to_community_leader && (
            <Field label="Community Leader Name">
              <input className={inputCls} value={form.community_leader_name} onChange={e => set('community_leader_name', e.target.value)} placeholder="Name of imam, pastor, chief, elder, etc." />
            </Field>
          )}
        </Section>

        {/* Patient Response */}
        <Section title="Patient Response & Wellbeing" icon={Heart} color="green">
          <Field label="Patient's Response to Visit">
            <textarea className={textareaCls} rows={2} value={form.patient_response}
              onChange={e => set('patient_response', e.target.value)} placeholder="How did the patient respond?" />
          </Field>
          <Field label={`Comfort Level After Visit: ${form.comfort_level_after}/10`} hint="0 = No comfort, 10 = Greatly comforted">
            <input type="range" min="0" max="10" step="1" className="w-full accent-green-600"
              value={form.comfort_level_after} onChange={e => set('comfort_level_after', parseInt(e.target.value))} />
          </Field>
          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={form.meaning_making_supported} onChange={e => set('meaning_making_supported', e.target.checked)} className="w-4 h-4 rounded text-green-600" />
              Meaning-making supported
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={form.reconciliation_facilitated} onChange={e => set('reconciliation_facilitated', e.target.checked)} className="w-4 h-4 rounded text-green-600" />
              Reconciliation facilitated
            </label>
          </div>
          <Field label="Unresolved Concerns / Unfinished Business" hint="Forgiveness issues, estranged family, regrets — handle sensitively">
            <textarea className={textareaCls} rows={2} value={form.unresolved_concerns}
              onChange={e => set('unresolved_concerns', e.target.value)} />
          </Field>
          <Field label="Patient's Wishes or Messages Expressed" hint="Any final wishes, messages to family, legacy desires">
            <textarea className={textareaCls} rows={2} value={form.patient_wishes_expressed}
              onChange={e => set('patient_wishes_expressed', e.target.value)} />
          </Field>
        </Section>

        {/* Confidentiality & Follow-up */}
        <Section title="Confidentiality & Follow-up" icon={Shield} color="slate">
          <div className="flex items-center gap-3">
            {form.confidential ? <Shield className="w-4 h-4 text-teal-600" /> : <Eye className="w-4 h-4 text-amber-600" />}
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.confidential} onChange={e => set('confidential', e.target.checked)} className="w-4 h-4 rounded text-teal-600" />
              Mark as confidential (spiritual notes are confidential by default)
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="fu" checked={form.follow_up_needed} onChange={e => set('follow_up_needed', e.target.checked)} className="w-4 h-4 rounded text-teal-600" />
            <label htmlFor="fu" className="text-sm text-slate-700 dark:text-slate-300">Follow-up visit needed</label>
          </div>
          {form.follow_up_needed && (
            <Field label="Follow-up Date">
              <input type="date" className={inputCls} value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} />
            </Field>
          )}
          <Field label="General Notes (clinician-visible summary)">
            <textarea className={textareaCls} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Brief summary for the wider care team..." />
          </Field>
        </Section>

        <div className="flex items-center gap-3 justify-end">
          <button type="button" onClick={() => navigate(`/assessments/${patientId}`)}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm font-medium">
            Cancel
          </button>
          <button type="submit" disabled={mutation.isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm transition disabled:opacity-50">
            <Save className="w-4 h-4" />
            {mutation.isLoading ? 'Saving...' : 'Save Care Note'}
          </button>
        </div>
      </form>
    </div>
  );
}
