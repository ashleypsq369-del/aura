/**
 * MentalHealthForm.jsx - PHQ-9 (Depression) + GAD-7 (Anxiety)
 * Redesigned: PageHeader + clean question cards + crisis alert
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Brain, Save, AlertTriangle, ChevronLeft, Phone } from 'lucide-react';
import apiClient from '../api/client';
import toast from '../utils/toast';
import FormFileUpload from '../components/FormFileUpload';
import PageHeader from '../components/PageHeader';

const PHQ9_QUESTIONS = [
  { key: 'little_interest',          text: 'Little interest or pleasure in doing things', crisis: false },
  { key: 'feeling_down',             text: 'Feeling down, depressed, or hopeless', crisis: false },
  { key: 'sleep_trouble',            text: 'Trouble falling or staying asleep, or sleeping too much', crisis: false },
  { key: 'feeling_tired',            text: 'Feeling tired or having little energy', crisis: false },
  { key: 'appetite_change',          text: 'Poor appetite or overeating', crisis: false },
  { key: 'feeling_bad_about_self',   text: 'Feeling bad about yourself - feeling like a failure', crisis: false },
  { key: 'trouble_concentrating',    text: 'Trouble concentrating on things, such as reading or watching TV', crisis: false },
  { key: 'moving_slowly_or_fidgety', text: 'Moving/speaking so slowly others noticed, or being unusually fidgety', crisis: false },
  { key: 'thoughts_of_harm',         text: 'Thoughts that you would be better off dead, or of hurting yourself', crisis: true },
];

const GAD7_QUESTIONS = [
  { key: 'feeling_nervous',    text: 'Feeling nervous, anxious, or on edge' },
  { key: 'not_stop_worrying',  text: 'Not being able to stop or control worrying' },
  { key: 'worrying_too_much',  text: 'Worrying too much about different things' },
  { key: 'trouble_relaxing',   text: 'Trouble relaxing' },
  { key: 'being_restless',     text: 'Being so restless that it is hard to sit still' },
  { key: 'easily_annoyed',     text: 'Becoming easily annoyed or irritable' },
  { key: 'feeling_afraid',     text: 'Feeling afraid, as if something awful might happen' },
];

const FREQ = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half' },
  { value: 3, label: 'Nearly every day' },
];

function getSeverityPHQ9(total) {
  if (total <= 4)  return { label: 'Minimal',           badge: 'badge-low'      };
  if (total <= 9)  return { label: 'Mild',               badge: 'badge-stable'   };
  if (total <= 14) return { label: 'Moderate',           badge: 'badge-moderate' };
  if (total <= 19) return { label: 'Moderately Severe',  badge: 'badge-high'     };
  return                   { label: 'Severe',             badge: 'badge-critical' };
}

function getSeverityGAD7(total) {
  if (total <= 4)  return { label: 'Minimal',  badge: 'badge-low'      };
  if (total <= 9)  return { label: 'Mild',      badge: 'badge-stable'   };
  if (total <= 14) return { label: 'Moderate',  badge: 'badge-moderate' };
  return                   { label: 'Severe',   badge: 'badge-critical' };
}

function QuestionCard({ question, value, onChange, idx, isCrisis }) {
  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-colors ${
      isCrisis && value > 0 ? 'border-red-300 bg-red-50' : 'border-[var(--card-border)] bg-[var(--card-bg)]'
    }`}>
      <div className="flex items-start gap-3 px-4 py-3">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
          isCrisis ? 'bg-red-600 text-white' : 'bg-[var(--card-border)] text-[var(--text-600)]'
        }`}>{idx + 1}</span>
        <p className="text-sm text-[var(--text-800)] flex-1 leading-relaxed">
          {question}
          {isCrisis && (
            <span className="ml-2 inline-flex items-center gap-0.5 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full">
              <AlertTriangle size={9} /> Crisis
            </span>
          )}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1.5 px-4 pb-3">
        {FREQ.map(opt => (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
              value === opt.value
                ? isCrisis && value > 0
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-purple-600 text-white border-purple-600'
                : 'bg-[var(--page-bg)] text-[var(--text-700)] border-[var(--card-border)] hover:border-purple-300 hover:bg-purple-50'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MentalHealthForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [phq9Scores, setPhq9Scores] = useState({
    little_interest:0, feeling_down:0, sleep_trouble:0, feeling_tired:0,
    appetite_change:0, feeling_bad_about_self:0, trouble_concentrating:0,
    moving_slowly_or_fidgety:0, thoughts_of_harm:0,
  });
  const [gad7Scores, setGad7Scores] = useState({
    feeling_nervous:0, not_stop_worrying:0, worrying_too_much:0,
    trouble_relaxing:0, being_restless:0, easily_annoyed:0, feeling_afraid:0,
  });
  const [difficulty, setDifficulty] = useState('');
  const [notes, setNotes] = useState('');

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => (await apiClient.get(`/api/patients/${patientId}`)).data,
  });

  const submitPHQ9 = useMutation({ mutationFn: async (d) => apiClient.post('/api/assessments/phq9', d) });
  const submitGAD7 = useMutation({ mutationFn: async (d) => apiClient.post('/api/assessments/gad7', d) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const [phq9Res, gad7Res] = await Promise.all([
        submitPHQ9.mutateAsync({ patient_id: parseInt(patientId), ...phq9Scores, difficulty_level: difficulty, notes }),
        submitGAD7.mutateAsync({ patient_id: parseInt(patientId), ...gad7Scores, difficulty_level: difficulty, notes }),
      ]);
      toast.success('Mental health assessments saved');
      if (phq9Res.data.crisis_alert)
        toast.error('CRISIS ALERT - Suicide risk detected. Immediate intervention required.', { duration: 10000 });
      const alerts = (phq9Res.data.alerts_generated?.length || 0) + (gad7Res.data.alerts_generated?.length || 0);
      if (alerts > 0) toast.error(`${alerts} alert(s) generated`, { duration: 5000 });
      queryClient.invalidateQueries(['phq9', patientId]);
      queryClient.invalidateQueries(['gad7', patientId]);
      queryClient.invalidateQueries(['assessment-overview', patientId]);
      setTimeout(() => navigate(`/assessments/${patientId}`), 1800);
    } catch {
      toast.error('Failed to save assessments');
    }
  };

  const phq9Total = Object.values(phq9Scores).reduce((s, v) => s + v, 0);
  const gad7Total = Object.values(gad7Scores).reduce((s, v) => s + v, 0);
  const phq9Sev = getSeverityPHQ9(phq9Total);
  const gad7Sev = getSeverityGAD7(gad7Total);
  const hasCrisis = phq9Scores.thoughts_of_harm > 0;
  const isBusy = submitPHQ9.isLoading || submitGAD7.isLoading;

  return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/african/african-wellbeing.jpg"
        title="Mental Health Screening"
        subtitle={`PHQ-9 Depression & GAD-7 Anxiety${patient?.full_name ? ` · ${patient.full_name}` : ''}`}
        icon={Brain}
        stats={[
          { label: 'PHQ-9', value: `${phq9Total}/27`, color: phq9Total > 14 ? '#f87171' : '#2dd4bf' },
          { label: 'GAD-7', value: `${gad7Total}/21`, color: gad7Total > 9  ? '#fbbf24' : '#2dd4bf' },
        ]}
      >
        <button onClick={() => navigate(`/assessments/${patientId}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--page-bg)] hover:bg-[var(--card-border)] text-[var(--text-700)] rounded-lg border border-[var(--card-border)] text-xs font-semibold transition">
          <ChevronLeft size={14} /> Assessments
        </button>
      </PageHeader>

      <div className="max-w-[760px] mx-auto px-4 py-5 space-y-5">

        {/* Instructions */}
        <div className="flex items-start gap-3 px-4 py-3 bg-purple-50 rounded-xl border border-purple-200">
          <Brain size={15} className="text-purple-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-purple-800">
            Over the <strong>last 2 weeks</strong>, how often has the patient been bothered by the following problems?
            Select the response that best applies.
          </p>
        </div>

        {/* Crisis alert */}
        {hasCrisis && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 rounded-xl border-2 border-red-400 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-900">⚠ CRISIS ALERT - Self-harm thoughts indicated</p>
                <p className="text-xs text-red-800 mt-1">
                  Patient has indicated thoughts of self-harm. <strong>Do not leave patient alone.</strong>
                  Immediate psychiatric evaluation required.
                </p>
                <div className="flex gap-2 mt-3">
                  <a href="tel:193"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition">
                    <Phone size={12} /> Emergency: 193
                  </a>
                  <a href="tel:0800111011"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition">
                    <Phone size={12} /> MH Line: 0800-111-011
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* PHQ-9 Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-900)]">PHQ-9: Depression Screening</h2>
                <p className="text-xs text-[var(--text-400)]">9 questions · score 0-27</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tabular-nums text-purple-600">{phq9Total}</span>
                <span className="text-xs text-[var(--text-400)]">/ 27</span>
                <span className={phq9Sev.badge}>{phq9Sev.label}</span>
              </div>
            </div>
            <div className="space-y-2">
              {PHQ9_QUESTIONS.map((q, idx) => (
                <motion.div key={q.key} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx * 0.03 }}>
                  <QuestionCard
                    question={q.text}
                    value={phq9Scores[q.key]}
                    onChange={v => setPhq9Scores(p => ({ ...p, [q.key]: v }))}
                    idx={idx}
                    isCrisis={q.crisis}
                  />
                </motion.div>
              ))}
            </div>
          </section>

          {/* GAD-7 Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-900)]">GAD-7: Anxiety Screening</h2>
                <p className="text-xs text-[var(--text-400)]">7 questions · score 0-21</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tabular-nums text-amber-600">{gad7Total}</span>
                <span className="text-xs text-[var(--text-400)]">/ 21</span>
                <span className={gad7Sev.badge}>{gad7Sev.label}</span>
              </div>
            </div>
            <div className="space-y-2">
              {GAD7_QUESTIONS.map((q, idx) => (
                <motion.div key={q.key} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx * 0.03 }}>
                  <QuestionCard
                    question={q.text}
                    value={gad7Scores[q.key]}
                    onChange={v => setGad7Scores(p => ({ ...p, [q.key]: v }))}
                    idx={idx}
                    isCrisis={false}
                  />
                </motion.div>
              ))}
            </div>
          </section>

          {/* Difficulty level */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <p className="text-sm font-semibold text-[var(--text-700)] mb-3">
              How difficult have these problems made it to work, care for yourself, or get along with others?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value:'not_difficult', label:'Not difficult' },
                { value:'somewhat',      label:'Somewhat difficult' },
                { value:'very',          label:'Very difficult' },
                { value:'extremely',     label:'Extremely difficult' },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => setDifficulty(opt.value)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-all border ${
                    difficulty === opt.value
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-[var(--page-bg)] text-[var(--text-700)] border-[var(--card-border)] hover:border-purple-300'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <label className="block text-sm font-semibold text-[var(--text-700)] mb-2">
              Clinical Notes <span className="font-normal text-[var(--text-400)]">(optional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Additional clinical observations or context…"
              className="w-full px-3 py-2 text-sm border border-[var(--card-border)] rounded-lg bg-[var(--page-bg)] text-[var(--text-800)] focus:border-purple-500 focus:outline-none resize-none" />
          </div>

          <FormFileUpload category="documents" label="Clinical Documentation"
            description="Attach clinical notes or assessment records"
            accept=".pdf,.doc,.docx" multiple maxSizeMB={50} />

          <div className="flex gap-3">
            <button type="submit" disabled={isBusy}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50">
              <Save size={15} />
              {isBusy ? 'Saving…' : 'Save Both Assessments'}
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
