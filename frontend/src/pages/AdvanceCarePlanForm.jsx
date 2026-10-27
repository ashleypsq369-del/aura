import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FileText, Save, ArrowLeft, Heart, User, Shield,
  AlertTriangle, Globe, CheckCircle, RefreshCw
} from 'lucide-react';
import apiClient from '../api/client';
import toast from '../utils/toast';

const GOAL_OPTIONS = [
  { value: 'comfort', label: 'Comfort & Quality of Life', desc: 'Focus on relief of symptoms and dignity' },
  { value: 'function', label: 'Maintain Function', desc: 'Balance comfort with maintaining independence' },
  { value: 'cure_directed', label: 'Cure-Directed', desc: 'Continue curative/life-prolonging treatment' },
  { value: 'unclear', label: 'Not Yet Decided', desc: 'Still exploring goals with patient/family' },
];

const PLACE_OPTIONS = [
  'Home', 'Hospice', 'Hospital', 'Care Home / Facility', 'Other', 'Not Discussed'
];

const DNR_OPTIONS = [
  { value: 'dnr', label: 'Do Not Resuscitate (DNR)' },
  { value: 'resuscitate', label: 'Attempt Resuscitation' },
  { value: 'not_discussed', label: 'Not Yet Discussed' },
];

const TREATMENT_OPTIONS = [
  { value: 'refuse', label: 'Decline' },
  { value: 'accept', label: 'Accept' },
  { value: 'trial_only', label: 'Trial Period Only' },
  { value: 'not_discussed', label: 'Not Discussed' },
  { value: 'not_applicable', label: 'Not Applicable' },
];

const LANG_OPTIONS = [
  'English', 'Twi / Akan', 'Ga', 'Ewe', 'Dagbani', 'Hausa', 'French', 'Other'
];

export default function AdvanceCarePlanForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    primary_goal: '',
    goals_detail: '',
    patient_understanding: '',
    preferred_place_of_death: '',
    preferred_place_detail: '',
    dnr_status: 'not_discussed',
    cpr_wishes: 'not_decided',
    mechanical_ventilation: 'not_discussed',
    artificial_nutrition: 'not_discussed',
    dialysis: 'not_applicable',
    hospital_admission: 'if_needed',
    cultural_considerations: '',
    spiritual_wishes: '',
    language_preference: 'English',
    family_involvement_wishes: '',
    organ_donation: 'not_discussed',
    post_death_wishes: '',
    has_lasting_power_of_attorney: false,
    attorney_name: '',
    attorney_contact: '',
    has_living_will: false,
    patient_confirmed: false,
    family_witnessed: false,
    next_review_date: '',
    review_notes: '',
  });

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  // Fetch patient
  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => (await apiClient.get(`/api/patients/${patientId}`)).data,
  });

  // Load existing ACP
  const { data: existing } = useQuery({
    queryKey: ['acp', patientId],
    queryFn: async () => {
      try {
        const r = await apiClient.get(`/api/palliative/acp/${patientId}`);
        return r.data;
      } catch { return null; }
    },
    onSuccess: (data) => {
      if (data) {
        setForm(prev => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== null && v !== undefined)
          )
        }));
      }
    }
  });

  const mutation = useMutation({
    mutationFn: async (payload) => apiClient.post('/api/palliative/acp', payload),
    onSuccess: () => {
      toast.success('Advance Care Plan saved');
      queryClient.invalidateQueries(['acp', patientId]);
      queryClient.invalidateQueries(['assessment-overview', patientId]);
      navigate(`/assessments/${patientId}`);
    },
    onError: () => toast.error('Failed to save ACP'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.primary_goal) return toast.error('Please select a primary goal of care');
    mutation.mutate({ patient_id: parseInt(patientId), ...form });
  };

  const Section = ({ title, icon: Icon, color = 'teal', children }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
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

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
  const selectCls = inputCls;
  const textareaCls = `${inputCls} resize-none`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/assessments/${patientId}`)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600" />
            Advance Care Plan
          </h1>
          {patient && (
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {patient.full_name} • {existing ? `Version ${existing.version} — updating` : 'Creating new ACP'}
            </p>
          )}
        </div>
      </div>

      {existing && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 text-amber-800 dark:text-amber-200 text-sm"
        >
          <RefreshCw className="w-4 h-4 flex-shrink-0" />
          An existing ACP was found. Saving will create a new version with your changes.
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Goals of Care */}
        <Section title="Goals of Care" icon={Heart} color="teal">
          <Field label="Primary Goal *" hint="What matters most to the patient right now?">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GOAL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('primary_goal', opt.value)}
                  className={`text-left p-3 rounded-xl border-2 transition ${
                    form.primary_goal === opt.value
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30'
                      : 'border-slate-200 dark:border-slate-600 hover:border-teal-300'
                  }`}
                >
                  <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{opt.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Goals Detail">
            <textarea
              className={textareaCls} rows={3}
              placeholder="Describe the patient's goals in their own words where possible..."
              value={form.goals_detail} onChange={e => set('goals_detail', e.target.value)}
            />
          </Field>
          <Field label="Patient's Understanding" hint="What does the patient understand about their diagnosis and prognosis?">
            <textarea
              className={textareaCls} rows={2}
              value={form.patient_understanding} onChange={e => set('patient_understanding', e.target.value)}
            />
          </Field>
        </Section>

        {/* Place of Death */}
        <Section title="Preferred Place of Death" icon={Globe} color="blue">
          <Field label="Preference">
            <div className="flex flex-wrap gap-2">
              {PLACE_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => set('preferred_place_of_death', opt.toLowerCase().replace(/ \/ /, '_').replace(/ /g, '_'))}
                  className={`px-3 py-1.5 rounded-full text-sm border-2 transition ${
                    form.preferred_place_of_death === opt.toLowerCase().replace(/ \/ /, '_').replace(/ /g, '_')
                      ? 'border-teal-500 bg-blue-50 dark:bg-blue-900/30 text-teal-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Additional details">
            <input
              className={inputCls} type="text"
              placeholder="e.g. 'at home in Kumasi with family present'"
              value={form.preferred_place_detail} onChange={e => set('preferred_place_detail', e.target.value)}
            />
          </Field>
        </Section>

        {/* Resuscitation & Life-sustaining Treatment */}
        <Section title="Resuscitation & Life-sustaining Treatment" icon={AlertTriangle} color="red">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="DNR / CPR Status">
              <select className={selectCls} value={form.dnr_status} onChange={e => set('dnr_status', e.target.value)}>
                {DNR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Mechanical Ventilation">
              <select className={selectCls} value={form.mechanical_ventilation} onChange={e => set('mechanical_ventilation', e.target.value)}>
                {TREATMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Artificial Nutrition / Hydration">
              <select className={selectCls} value={form.artificial_nutrition} onChange={e => set('artificial_nutrition', e.target.value)}>
                {TREATMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Dialysis">
              <select className={selectCls} value={form.dialysis} onChange={e => set('dialysis', e.target.value)}>
                {TREATMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Hospital Admission">
              <select className={selectCls} value={form.hospital_admission} onChange={e => set('hospital_admission', e.target.value)}>
                {TREATMENT_OPTIONS.filter(o => o.value !== 'not_applicable').map(o =>
                  <option key={o.value} value={o.value}>{o.label}</option>
                )}
              </select>
            </Field>
            <Field label="Organ Donation">
              <select className={selectCls} value={form.organ_donation} onChange={e => set('organ_donation', e.target.value)}>
                <option value="yes">Yes — willing to donate</option>
                <option value="no">No — does not wish to donate</option>
                <option value="not_discussed">Not Discussed</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* Cultural & Spiritual Wishes */}
        <Section title="Cultural & Spiritual Wishes" icon={Heart} color="violet">
          <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-lg px-4 py-2.5 text-sm text-violet-800 dark:text-violet-200 mb-3">
            These fields are inclusive of all religious traditions and cultural practices — Christian, Muslim, Traditional African, Buddhist, Hindu, Baha'i, secular, and others.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Language Preference">
              <select className={selectCls} value={form.language_preference} onChange={e => set('language_preference', e.target.value)}>
                {LANG_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Cultural / Religious Considerations" hint="Rituals, practices, customs important to the patient">
            <textarea
              className={textareaCls} rows={3}
              placeholder="e.g. 'Wants family elders present', 'Islamic last rites by imam', 'Libation ceremony', 'No blood products per faith'..."
              value={form.cultural_considerations} onChange={e => set('cultural_considerations', e.target.value)}
            />
          </Field>
          <Field label="Spiritual Wishes" hint="Prayers, blessings, sacraments, rites at end of life">
            <textarea
              className={textareaCls} rows={3}
              placeholder="e.g. 'Wants pastor to pray', 'Wants Quran recitation', 'Wants Akan death rites', 'Prefers secular, no religious content'..."
              value={form.spiritual_wishes} onChange={e => set('spiritual_wishes', e.target.value)}
            />
          </Field>
          <Field label="Family Involvement" hint="How does the patient want family involved?">
            <textarea
              className={textareaCls} rows={2}
              value={form.family_involvement_wishes} onChange={e => set('family_involvement_wishes', e.target.value)}
            />
          </Field>
          <Field label="Post-death Wishes" hint="Burial rites, body handling per religion/culture">
            <textarea
              className={textareaCls} rows={2}
              value={form.post_death_wishes} onChange={e => set('post_death_wishes', e.target.value)}
            />
          </Field>
        </Section>

        {/* Legal */}
        <Section title="Legal Documentation" icon={Shield} color="slate">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Lasting Power of Attorney">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="lpa" checked={form.has_lasting_power_of_attorney}
                  onChange={e => set('has_lasting_power_of_attorney', e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600" />
                <label htmlFor="lpa" className="text-sm text-slate-700 dark:text-slate-300">Has LPA / Power of Attorney</label>
              </div>
            </Field>
            <Field label="Living Will">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="lw" checked={form.has_living_will}
                  onChange={e => set('has_living_will', e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600" />
                <label htmlFor="lw" className="text-sm text-slate-700 dark:text-slate-300">Has a Living Will / Advance Directive</label>
              </div>
            </Field>
          </div>
          {form.has_lasting_power_of_attorney && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Attorney Name">
                <input className={inputCls} value={form.attorney_name} onChange={e => set('attorney_name', e.target.value)} />
              </Field>
              <Field label="Attorney Contact">
                <input className={inputCls} value={form.attorney_contact} onChange={e => set('attorney_contact', e.target.value)} />
              </Field>
            </div>
          )}
        </Section>

        {/* Confirmation */}
        <Section title="Confirmation & Review" icon={CheckCircle} color="green">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Next Review Date">
              <input type="date" className={inputCls} value={form.next_review_date}
                onChange={e => set('next_review_date', e.target.value)} />
            </Field>
          </div>
          <Field label="Review Notes">
            <textarea className={textareaCls} rows={2} value={form.review_notes}
              onChange={e => set('review_notes', e.target.value)} />
          </Field>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.patient_confirmed}
                onChange={e => set('patient_confirmed', e.target.checked)}
                className="w-4 h-4 rounded text-teal-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Patient has confirmed this reflects their wishes</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.family_witnessed}
                onChange={e => set('family_witnessed', e.target.checked)}
                className="w-4 h-4 rounded text-teal-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Family member has witnessed and is aware</span>
            </label>
          </div>
        </Section>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate(`/assessments/${patientId}`)}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {mutation.isLoading ? 'Saving...' : existing ? 'Update ACP' : 'Save ACP'}
          </button>
        </div>
      </form>
    </div>
  );
}
