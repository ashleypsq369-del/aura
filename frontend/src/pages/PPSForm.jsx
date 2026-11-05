/**
 * PPSForm.jsx — Palliative Performance Scale
 * Redesigned: PageHeader + clean score display + domain details
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Save, AlertTriangle, TrendingDown, Brain,
  ArrowRight, ChevronLeft, TrendingUp, Minus,
} from 'lucide-react';
import apiClient, { mlAPI } from '../api/client';
import toast from '../utils/toast';
import FormFileUpload from '../components/FormFileUpload';
import PageHeader from '../components/PageHeader';

const RISK_LEVEL_CLASSES = {
  critical: 'text-red-700 bg-red-50 border-red-200',
  high:     'text-orange-700 bg-orange-50 border-orange-200',
  moderate: 'text-amber-700 bg-amber-50 border-amber-200',
  low:      'text-green-700 bg-green-50 border-green-200',
};

const PPS_LEVELS = {
  100: { ambulation:'Full',          activity:'Normal — no disease',            self_care:'Complete', intake:'Normal',         consciousness:'Full',                description:'Full ambulation, normal activity, no disease evidence' },
  90:  { ambulation:'Full',          activity:'Normal — some disease',          self_care:'Complete', intake:'Normal',         consciousness:'Full',                description:'Full ambulation, normal activity with effort, some disease' },
  80:  { ambulation:'Full',          activity:'Normal with effort — extensive', self_care:'Complete', intake:'Normal/reduced', consciousness:'Full',                description:'Full ambulation, normal activity with effort, extensive disease' },
  70:  { ambulation:'Reduced',       activity:'Unable to work',                 self_care:'Complete', intake:'Normal/reduced', consciousness:'Full',                description:'Reduced ambulation, unable to do work, significant disease' },
  60:  { ambulation:'Reduced',       activity:'Unable hobbies/housework',       self_care:'Occasional assistance', intake:'Normal/reduced', consciousness:'Full/confusion', description:'Reduced ambulation, unable to do hobbies or housework' },
  50:  { ambulation:'Mainly sit/lie',activity:'Unable any work',                self_care:'Considerable assistance', intake:'Reduced', consciousness:'Full/confusion', description:'Mainly sitting or lying, unable to do any work' },
  40:  { ambulation:'Mainly bed',    activity:'Unable most activity',           self_care:'Mainly assistance', intake:'Reduced', consciousness:'Full/drowsy/confusion', description:'Mainly in bed, unable to do most activity' },
  30:  { ambulation:'Totally bed',   activity:'Unable all activity',            self_care:'Total care', intake:'Minimal sips', consciousness:'Full/drowsy/confusion', description:'Totally bed bound, unable to do any activity' },
  20:  { ambulation:'Totally bed',   activity:'Unable all activity',            self_care:'Total care', intake:'Mouth care only', consciousness:'Drowsy/coma', description:'Totally bed bound, minimal intake, drowsy or coma' },
  10:  { ambulation:'Totally bed',   activity:'Unable all activity',            self_care:'Total care', intake:'Mouth care only', consciousness:'Drowsy/coma', description:'Death imminent, mouth care only' },
};

function getPpsColor(score) {
  if (score >= 70) return { hex: '#16a34a', cls: 'text-green-700', badge: 'badge-low' };
  if (score >= 50) return { hex: '#d97706', cls: 'text-amber-700', badge: 'badge-moderate' };
  if (score >= 30) return { hex: '#ea580c', cls: 'text-orange-700', badge: 'badge-high' };
  return                  { hex: '#dc2626', cls: 'text-red-700',    badge: 'badge-critical' };
}

function getPpsLabel(score) {
  if (score >= 70) return 'Good functional status';
  if (score >= 50) return 'Moderate functional decline';
  if (score >= 30) return 'Significant decline — intensive care needed';
  return 'Critical — end-of-life care discussion';
}

const DOMAIN_LABELS = [
  ['Ambulation',        'ambulation'],
  ['Activity & Disease','activity'],
  ['Self-Care',         'self_care'],
  ['Oral Intake',       'intake'],
  ['Consciousness',     'consciousness'],
];

export default function PPSForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ppsScore, setPpsScore] = useState(70);
  const [notes, setNotes] = useState('');
  const [mlResult, setMlResult] = useState(null);

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => (await apiClient.get(`/api/patients/${patientId}`)).data,
  });

  const { data: previousPPS } = useQuery({
    queryKey: ['pps', patientId],
    queryFn: async () => (await apiClient.get(`/api/assessments/pps/${patientId}?limit=5`)).data,
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => apiClient.post('/api/assessments/pps', data),
    onSuccess: (response) => {
      toast.success('PPS assessment saved');
      if (response.data.alerts_generated?.length > 0)
        toast.error(`${response.data.alerts_generated.length} alert(s) generated`, { duration: 5000 });
      queryClient.invalidateQueries(['pps', patientId]);
      queryClient.invalidateQueries(['assessment-overview', patientId]);
      try { mlAPI.getTaskPrediction(patientId, 'functional_decline').then(r => setMlResult(r.data)); } catch (_) {}
    },
    onError: () => toast.error('Failed to save assessment'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const level = PPS_LEVELS[ppsScore];
    submitMutation.mutate({
      patient_id: parseInt(patientId),
      pps_score: ppsScore,
      ambulation: level.ambulation,
      activity_disease: level.activity,
      self_care: level.self_care,
      oral_intake: level.intake,
      consciousness: level.consciousness,
      notes,
    });
  };

  const color = getPpsColor(ppsScore);
  const currentLevel = PPS_LEVELS[ppsScore];
  const previousScore = previousPPS?.assessments?.[0]?.pps_score;
  const delta = previousScore != null ? ppsScore - previousScore : null;

  return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/african/african-vitals.jpg"
        title="PPS Assessment"
        subtitle={`Palliative Performance Scale${patient?.full_name ? ` · ${patient.full_name}` : ''}`}
        icon={Activity}
        stats={[
          { label: 'Current PPS', value: `${ppsScore}%`, color: color.hex },
          { label: 'Status', value: ppsScore >= 70 ? 'Good' : ppsScore >= 50 ? 'Moderate' : 'Critical', color: color.hex },
        ]}
      >
        <button onClick={() => navigate(`/assessments/${patientId}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--page-bg)] hover:bg-[var(--card-border)] text-[var(--text-700)] rounded-lg border border-[var(--card-border)] text-xs font-semibold transition">
          <ChevronLeft size={14} /> Assessments
        </button>
      </PageHeader>

      <div className="max-w-[760px] mx-auto px-4 py-5 space-y-4">

        {/* Instructions */}
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 rounded-xl border border-blue-200">
          <Activity size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            Select the PPS level <strong>(10–100%)</strong> that best describes the patient's current functional status
            across ambulation, activity, self-care, intake, and consciousness.
          </p>
        </div>

        {/* End-of-life alert */}
        {ppsScore <= 30 && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-3 px-4 py-3 bg-red-50 rounded-xl border border-red-200">
            <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-900">Critical PPS Level</p>
              <p className="text-xs text-red-800 mt-0.5">
                PPS ≤30% indicates end-of-life trajectory. Consider goals of care, advance directives, and hospice services.
              </p>
            </div>
          </motion.div>
        )}

        {/* Rapid decline alert */}
        {previousScore != null && ppsScore < previousScore - 15 && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-3 px-4 py-3 bg-orange-50 rounded-xl border border-orange-200">
            <TrendingDown size={16} className="text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-orange-900">Rapid Functional Decline</p>
              <p className="text-xs text-orange-800 mt-0.5">
                PPS dropped from {previousScore}% to {ppsScore}% (−{previousScore - ppsScore}%). Consider MDT reassessment.
              </p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* PPS Selector card */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-5">
            {/* Score display */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-bold text-[var(--text-500)] uppercase tracking-wider mb-1">PPS Level</p>
                <p className="text-xs text-[var(--text-400)]">{getPpsLabel(ppsScore)}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black tabular-nums" style={{ color: color.hex }}>{ppsScore}%</p>
                {delta !== null && (
                  <p className="text-xs mt-1 text-[var(--text-400)]">
                    {delta > 0 ? <TrendingUp size={11} className="inline text-green-500 mr-0.5" /> :
                     delta < 0 ? <TrendingDown size={11} className="inline text-red-500 mr-0.5" /> :
                     <Minus size={11} className="inline text-slate-400 mr-0.5" />}
                    prev {previousScore}%
                  </p>
                )}
              </div>
            </div>

            {/* Segmented slider */}
            <div className="relative mb-2">
              <div className="flex gap-0.5 h-3 rounded-full overflow-hidden">
                {[10,20,30,40,50,60,70,80,90,100].map((step) => (
                  <div key={step} className="flex-1 rounded-sm transition-all"
                    style={{ backgroundColor: step <= ppsScore ? color.hex : 'var(--card-border)' }} />
                ))}
              </div>
              <input type="range" min="10" max="100" step="10" value={ppsScore}
                onChange={e => setPpsScore(parseInt(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                aria-label="PPS score" />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--text-400)]">
              <span>10%</span><span>30%</span><span>50%</span><span>70%</span><span>100%</span>
            </div>

            {/* Domain details */}
            <div className="mt-5 pt-4 border-t border-[var(--card-border)]">
              <p className="text-xs font-bold text-[var(--text-500)] uppercase tracking-wider mb-3">
                PPS {ppsScore}% — {currentLevel.description}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DOMAIN_LABELS.map(([title, key]) => (
                  <div key={key} className="bg-[var(--page-bg)] rounded-lg px-3 py-2 border border-[var(--card-border)]">
                    <p className="text-[10px] font-bold text-[var(--text-400)] uppercase tracking-wider mb-0.5">{title}</p>
                    <p className="text-xs text-[var(--text-700)] font-semibold">{currentLevel[key]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <label className="block text-sm font-semibold text-[var(--text-700)] mb-2">
              Clinical Notes <span className="font-normal text-[var(--text-400)]">(optional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Additional observations about functional status…"
              className="w-full px-3 py-2 text-sm border border-[var(--card-border)] rounded-lg bg-[var(--page-bg)] text-[var(--text-800)] focus:border-teal-500 focus:outline-none resize-none" />
          </div>

          {/* File upload */}
          <FormFileUpload category="documents" label="Assessment Documentation"
            description="Attach notes or supporting files"
            accept="image/*,.pdf,.doc,.docx" multiple maxSizeMB={50} />

          {/* Submit */}
          <div className="flex gap-3">
            <button type="submit"
              disabled={submitMutation.isLoading || !!mlResult}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50">
              <Save size={15} />
              {submitMutation.isLoading ? 'Saving…' : 'Save PPS Assessment'}
            </button>
            {!mlResult && (
              <button type="button" onClick={() => navigate(`/assessments/${patientId}`)}
                className="px-5 py-3 bg-[var(--page-bg)] hover:bg-[var(--card-border)] text-[var(--text-700)] rounded-xl text-sm font-semibold border border-[var(--card-border)] transition">
                Cancel
              </button>
            )}
          </div>

          {/* ML panel */}
          <AnimatePresence>
            {mlResult && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-[var(--card-bg)] border-l-4 border-blue-500 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-[var(--text-900)] flex items-center gap-2">
                    <Brain size={14} className="text-purple-500" /> Functional Decline Risk
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tabular-nums text-blue-700">
                      {Math.round((mlResult.probability ?? 0) * 100)}%
                    </span>
                    {mlResult.risk_level && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${RISK_LEVEL_CLASSES[mlResult.risk_level] || RISK_LEVEL_CLASSES.low}`}>
                        {mlResult.risk_level}
                      </span>
                    )}
                  </div>
                </div>
                {mlResult.top_features?.slice(0,3).map((f, i) => (
                  <div key={i} className="mt-1.5">
                    <p className="text-xs text-[var(--text-600)] mb-0.5">{f.display_name}</p>
                    <div className="w-full h-1.5 bg-[var(--card-border)] rounded-full">
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min(f.pct, 100)}%`,
                        backgroundColor: f.impact === 'increases_risk' ? '#ef4444' : '#16a34a',
                      }} />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => navigate(`/assessments/${patientId}`)}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition">
                  Continue to Assessments <ArrowRight size={13} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
