/**
 * QualityOfLifeForm.jsx - FACT-G Quality of Life Assessment
 * Redesigned: PageHeader + domain sections + clean option buttons
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Smile, Save, ChevronLeft, Heart, Users, Brain, Activity } from 'lucide-react';
import apiClient from '../api/client';
import toast from '../utils/toast';
import offlineStorage from '../utils/offlineStorage';
import FormFileUpload from '../components/FormFileUpload';
import PageHeader from '../components/PageHeader';

const DOMAINS = {
  physical: {
    label: 'Physical Wellbeing', Icon: Activity, color: '#f43f5e', max: 28,
    questions: [
      { key:'physical_lack_of_energy',  text:'I have a lack of energy' },
      { key:'physical_nausea',          text:'I have nausea' },
      { key:'physical_meeting_needs',   text:'Because of my physical condition, I have trouble meeting the needs of my family' },
      { key:'physical_pain',            text:'I have pain' },
      { key:'physical_side_effects',    text:'I am bothered by side effects of treatment' },
      { key:'physical_feel_ill',        text:'I feel ill' },
      { key:'physical_bed_time',        text:'I am forced to spend time in bed' },
    ],
  },
  social: {
    label: 'Social / Family Wellbeing', Icon: Users, color: '#7c3aed', max: 28,
    questions: [
      { key:'social_close_to_friends',       text:'I feel close to my friends' },
      { key:'social_emotional_support',      text:'I get emotional support from my family' },
      { key:'social_support_from_family',    text:'I get support from my friends' },
      { key:'social_acceptance_of_illness',  text:'My family has accepted my illness' },
      { key:'social_family_communication',   text:'I am satisfied with family communication about my illness' },
      { key:'social_close_to_partner',       text:'I feel close to my partner (or main support person)' },
      { key:'social_satisfaction_sex_life',  text:'I am satisfied with my sex life' },
    ],
  },
  emotional: {
    label: 'Emotional Wellbeing', Icon: Heart, color: '#db2777', max: 24,
    questions: [
      { key:'emotional_feel_sad',             text:'I feel sad' },
      { key:'emotional_coping_with_illness',  text:'I am satisfied with how I am coping with my illness' },
      { key:'emotional_losing_hope',          text:'I am losing hope in the fight against my illness' },
      { key:'emotional_feel_nervous',         text:'I feel nervous' },
      { key:'emotional_worry_about_dying',    text:'I worry about dying' },
      { key:'emotional_worry_about_condition',text:'I worry that my condition will get worse' },
    ],
  },
  functional: {
    label: 'Functional Wellbeing', Icon: Brain, color: '#0d9488', max: 28,
    questions: [
      { key:'functional_able_to_work',     text:'I am able to work (include work at home)' },
      { key:'functional_work_fulfilling',  text:'My work (including at home) is fulfilling' },
      { key:'functional_enjoy_life',       text:'I am able to enjoy life' },
      { key:'functional_accepted_illness', text:'I have accepted my illness' },
      { key:'functional_sleeping_well',    text:'I am sleeping well' },
      { key:'functional_enjoying_hobbies', text:'I am enjoying the things I usually do for fun' },
      { key:'functional_content_with_qol', text:'I am content with the quality of my life right now' },
    ],
  },
};

const OPTIONS = [
  { value:0, label:'Not at all' },
  { value:1, label:'A little bit' },
  { value:2, label:'Somewhat' },
  { value:3, label:'Quite a bit' },
  { value:4, label:'Very much' },
];

function DomainSection({ domain, domainKey, scores, setScores, delay }) {
  const { label, Icon, color, questions } = domain;
  const domainTotal = questions.reduce((s, q) => s + (scores[q.key] ?? 0), 0);
  const filled = questions.every(q => scores[q.key] != null);
  return (
    <motion.section initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center border border-[var(--card-border)]"
            style={{ backgroundColor: color + '18' }}>
            <Icon size={14} style={{ color }} />
          </div>
          <span className="text-sm font-bold text-[var(--text-900)]">{label}</span>
        </div>
        <span className="text-sm font-black tabular-nums" style={{ color }}>{domainTotal}/{domain.max}</span>
      </div>
      <div className="space-y-2">
        {questions.map((q, idx) => (
          <div key={q.key}
            className={`bg-[var(--card-bg)] rounded-xl border overflow-hidden ${
              scores[q.key] != null ? 'border-[var(--card-border)]' : 'border-[var(--card-border)]'
            }`}>
            <div className="flex items-start gap-3 px-4 py-3">
              <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: color + '18', color }}>
                {idx + 1}
              </span>
              <p className="text-xs text-[var(--text-800)] flex-1 leading-relaxed">{q.text}</p>
              {scores[q.key] != null && (
                <span className="text-xs font-bold flex-shrink-0" style={{ color }}>{scores[q.key]}</span>
              )}
            </div>
            <div className="grid grid-cols-5 gap-px px-3 pb-3">
              {OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setScores(p => ({ ...p, [q.key]: opt.value }))}
                  className={`py-2 rounded-lg text-[10px] font-semibold transition-all border ${
                    scores[q.key] === opt.value
                      ? 'text-white border-transparent'
                      : 'bg-[var(--page-bg)] text-[var(--text-600)] border-[var(--card-border)] hover:opacity-80'
                  }`}
                  style={scores[q.key] === opt.value ? { backgroundColor: color, borderColor: color } : {}}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

export default function QualityOfLifeForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const allKeys = Object.values(DOMAINS).flatMap(d => d.questions.map(q => q.key));
  const [scores, setScores] = useState(Object.fromEntries(allKeys.map(k => [k, null])));
  const [notes, setNotes] = useState('');

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => (await apiClient.get(`/api/patients/${patientId}`)).data,
  });

  const totalScore = allKeys.reduce((s, k) => s + (scores[k] ?? 0), 0);
  const maxScore = 108;
  const pct = Math.round((totalScore / maxScore) * 100);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      if (!navigator.onLine) { await offlineStorage.saveOffline('qol', data); return { offline: true }; }
      return apiClient.post('/api/assessments/qol', data);
    },
    onSuccess: (res) => {
      if (res.offline) toast.success('Saved offline - will sync when online', { duration: 5000 });
      else toast.success('Quality of Life assessment saved');
      queryClient.invalidateQueries(['qol', patientId]);
      queryClient.invalidateQueries(['assessment-overview', patientId]);
      setTimeout(() => navigate(`/assessments/${patientId}`), 1500);
    },
    onError: () => toast.error('Failed to save assessment'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { patient_id: parseInt(patientId), ...scores, total_score: totalScore, notes };
    // Build domain subtotals
    Object.entries(DOMAINS).forEach(([dk, d]) => {
      payload[`${dk}_total`] = d.questions.reduce((s, q) => s + (scores[q.key] ?? 0), 0);
    });
    submitMutation.mutate(payload);
  };

  return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/african/african-wellbeing.jpg"
        title="Quality of Life (FACT-G)"
        subtitle={`Functional Assessment of Cancer Therapy${patient?.full_name ? ` · ${patient.full_name}` : ''}`}
        icon={Smile}
        stats={[
          { label: 'Total Score', value: totalScore, color: pct >= 60 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626' },
          { label: 'Out of',      value: maxScore,   color: '#818cf8' },
        ]}
      >
        <button onClick={() => navigate(`/assessments/${patientId}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--page-bg)] hover:bg-[var(--card-border)] text-[var(--text-700)] rounded-lg border border-[var(--card-border)] text-xs font-semibold transition">
          <ChevronLeft size={14} /> Assessments
        </button>
      </PageHeader>

      <div className="max-w-[760px] mx-auto px-4 py-5 space-y-5">
        <div className="flex items-start gap-3 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-200">
          <Smile size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-800">
            27 questions across 4 wellbeing domains. Higher scores = better quality of life.
            Rate how true each statement has been for you <strong>in the past 7 days</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {Object.entries(DOMAINS).map(([key, domain], idx) => (
            <DomainSection key={key} domain={domain} domainKey={key}
              scores={scores} setScores={setScores} delay={idx * 0.06} />
          ))}

          {/* Notes */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <label className="block text-sm font-semibold text-[var(--text-700)] mb-2">
              Clinical Notes <span className="font-normal text-[var(--text-400)]">(optional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Additional observations or context…"
              className="w-full px-3 py-2 text-sm border border-[var(--card-border)] rounded-lg bg-[var(--page-bg)] text-[var(--text-800)] focus:border-emerald-500 focus:outline-none resize-none" />
          </div>

          <FormFileUpload category="documents" label="Assessment Documentation"
            description="Attach supporting documents"
            accept=".pdf,.doc,.docx" multiple maxSizeMB={50} />

          <div className="flex gap-3">
            <button type="submit" disabled={submitMutation.isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50">
              <Save size={15} />
              {submitMutation.isLoading ? 'Saving…' : 'Save Assessment'}
            </button>
            <button type="button" onClick={() => navigate(`/assessments/${patientId}`)}
              className="px-5 py-3 bg-[var(--page-bg)] hover:bg-[var(--card-border)] text-[var(--text-700)] rounded-xl text-sm font-semibold border border-[var(--card-border)] transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
