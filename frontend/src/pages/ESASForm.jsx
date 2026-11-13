/**
 * ESASForm.jsx - Edmonton Symptom Assessment System
 * Redesigned: PageHeader + clean question cards
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Save, Zap, Moon, Wind, UtensilsCrossed,
  Brain, AlertCircle, Smile, Activity, ArrowRight,
  ChevronLeft, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import apiClient, { mlAPI } from '../api/client';
import toast from '../utils/toast';
import FormFileUpload from '../components/FormFileUpload';
import { fireMilestone } from '../components/MilestoneConfetti';
import SectionErrorBoundary from '../components/SectionErrorBoundary';
import PageHeader from '../components/PageHeader';

const RISK_LEVEL_CLASSES = {
  critical: 'text-red-700 bg-red-50 border-red-200',
  high:     'text-orange-700 bg-orange-50 border-orange-200',
  moderate: 'text-amber-700 bg-amber-50 border-amber-200',
  low:      'text-green-700 bg-green-50 border-green-200',
};

const symptoms = [
  { key: 'pain',              label: 'Pain',              description: '0 = No pain · 10 = Worst possible',        Icon: Zap,             color: '#f43f5e' },
  { key: 'tiredness',         label: 'Tiredness',         description: '0 = Not tired · 10 = Worst possible',       Icon: Moon,            color: '#6366f1' },
  { key: 'drowsiness',        label: 'Drowsiness',        description: '0 = Not drowsy · 10 = Very drowsy',         Icon: Moon,            color: '#a855f7' },
  { key: 'nausea',            label: 'Nausea',            description: '0 = No nausea · 10 = Worst possible',       Icon: AlertCircle,     color: '#f59e0b' },
  { key: 'lack_of_appetite',  label: 'Lack of Appetite',  description: '0 = Normal appetite · 10 = No appetite',    Icon: UtensilsCrossed, color: '#f97316' },
  { key: 'depression',        label: 'Depression',        description: '0 = Not depressed · 10 = Very depressed',   Icon: Brain,           color: '#3b82f6' },
  { key: 'anxiety',           label: 'Anxiety',           description: '0 = Not anxious · 10 = Very anxious',       Icon: Activity,        color: '#0d9488' },
  { key: 'shortness_of_breath', label: 'Breathlessness',  description: '0 = No shortness · 10 = Worst possible',   Icon: Wind,            color: '#0891b2' },
  { key: 'wellbeing',         label: 'Wellbeing',         description: '0 = Best wellbeing · 10 = Worst wellbeing', Icon: Smile,           color: '#10b981' },
];

function getScoreLabel(v) {
  if (v === 0) return { text: 'None', cls: 'badge-low' };
  if (v <= 3)  return { text: 'Mild', cls: 'badge-stable' };
  if (v <= 6)  return { text: 'Moderate', cls: 'badge-moderate' };
  if (v <= 8)  return { text: 'Severe', cls: 'badge-high' };
  return              { text: 'Very Severe', cls: 'badge-critical' };
}

function ScoreSlider({ symptom, value, onChange, previous }) {
  const { Icon, label, description, color } = symptom;
  const lbl = getScoreLabel(value);
  const pct = (value / 10) * 100;
  const prevDelta = previous != null ? value - previous : null;

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border border-[var(--card-border)]"
          style={{ backgroundColor: color + '18' }}>
          <Icon size={16} style={{ color }} strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--text-900)]">{label}</p>
          <p className="text-xs text-[var(--text-400)]">{description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {prevDelta !== null && (
            <span className="text-[11px] text-[var(--text-400)]">
              {prevDelta > 0 ? <TrendingUp size={11} className="inline text-red-500 mr-0.5" /> :
               prevDelta < 0 ? <TrendingDown size={11} className="inline text-green-500 mr-0.5" /> :
               <Minus size={11} className="inline text-slate-400 mr-0.5" />}
              prev {previous}
            </span>
          )}
          <span className="text-2xl font-black tabular-nums" style={{ color }}>{value}</span>
          <span className={lbl.cls}>{lbl.text}</span>
        </div>
      </div>

      {/* Segmented track */}
      <div className="relative mb-2">
        <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all"
              style={{
                backgroundColor: i < value
                  ? (i < 3 ? '#10b981' : i < 6 ? '#f59e0b' : '#ef4444')
                  : 'var(--card-border)',
              }}
            />
          ))}
        </div>
        <input
          type="range"
          min="0" max="10" value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          aria-label={`${label} score`}
        />
      </div>

      <div className="flex justify-between text-[10px] text-[var(--text-400)] font-medium">
        <span>0 - None</span>
        <span>5 - Moderate</span>
        <span>10 - Worst</span>
      </div>
    </div>
  );
}

export default function ESASForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mlResult, setMlResult] = useState(null);
  const [scores, setScores] = useState({ pain:0, tiredness:0, drowsiness:0, nausea:0,
    lack_of_appetite:0, depression:0, anxiety:0, shortness_of_breath:0, wellbeing:0 });
  const [notes, setNotes] = useState('');
  const [completedByProxy, setCompletedByProxy] = useState(false);
  const [proxyRelationship, setProxyRelationship] = useState('');

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => (await apiClient.get(`/api/patients/${patientId}`)).data,
  });

  const { data: previousAssessments } = useQuery({
    queryKey: ['esas', patientId],
    queryFn: async () => (await apiClient.get(`/api/assessments/esas/${patientId}?limit=5`)).data,
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => apiClient.post('/api/assessments/esas', data),
    onSuccess: (response) => {
      toast.success('ESAS assessment saved');
      fireMilestone('hearts');
      if (response.data.alerts_generated?.length > 0) {
        toast.error(`${response.data.alerts_generated.length} alert(s) generated - please review`, { duration: 5000 });
      }
      queryClient.invalidateQueries(['esas', patientId]);
      queryClient.invalidateQueries(['assessment-overview', patientId]);
      try { mlAPI.getPatientRisk(patientId).then(r => setMlResult(r.data)); } catch (_) {}
    },
    onError: () => toast.error('Failed to save assessment'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate({
      patient_id: parseInt(patientId), ...scores, notes,
      completed_by_proxy: completedByProxy,
      proxy_relationship: completedByProxy ? proxyRelationship : null,
    });
  };

  const prev = previousAssessments?.assessments?.[0];
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/african/african-wellbeing.jpg"
        title="ESAS Assessment"
        subtitle={`Edmonton Symptom Assessment System${patient?.full_name ? ` · ${patient.full_name}` : ''}`}
        icon={Heart}
        stats={[
          { label: 'Total Score', value: totalScore, color: totalScore > 40 ? '#f87171' : totalScore > 20 ? '#fbbf24' : '#2dd4bf' },
          { label: 'Out of', value: '90', color: '#818cf8' },
        ]}
      >
        <button onClick={() => navigate(`/assessments/${patientId}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--page-bg)] hover:bg-[var(--card-border)] text-[var(--text-700)] rounded-lg border border-[var(--card-border)] text-xs font-semibold transition">
          <ChevronLeft size={14} /> Assessments
        </button>
      </PageHeader>

      <div className="max-w-[760px] mx-auto px-4 py-5 space-y-5">

        {/* Info banner */}
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 rounded-xl border border-blue-200">
          <AlertCircle size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            Rate each symptom from <strong>0 to 10</strong> based on how it has affected you in the <strong>last 24 hours</strong>.
            Drag the slider or click the track.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {symptoms.map((symptom, idx) => (
            <motion.div
              key={symptom.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <ScoreSlider
                symptom={symptom}
                value={scores[symptom.key]}
                onChange={v => setScores(p => ({ ...p, [symptom.key]: v }))}
                previous={prev?.[symptom.key]}
              />
            </motion.div>
          ))}

          {/* Proxy section */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={completedByProxy}
                onChange={e => setCompletedByProxy(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 accent-teal-600" />
              <span className="text-sm font-semibold text-[var(--text-800)]">
                Completed by proxy (nurse / family member)
              </span>
            </label>
            {completedByProxy && (
              <input type="text" value={proxyRelationship}
                onChange={e => setProxyRelationship(e.target.value)}
                placeholder="Relationship to patient (e.g. Spouse, Nurse)"
                required
                className="mt-3 w-full px-3 py-2 text-sm border border-[var(--card-border)] rounded-lg bg-[var(--page-bg)] text-[var(--text-800)] focus:border-teal-500 focus:outline-none" />
            )}
          </div>

          {/* Notes */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <label className="block text-sm font-semibold text-[var(--text-700)] mb-2">
              Additional Notes <span className="font-normal text-[var(--text-400)]">(optional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Any additional observations or context…"
              className="w-full px-3 py-2 text-sm border border-[var(--card-border)] rounded-lg bg-[var(--page-bg)] text-[var(--text-800)] focus:border-teal-500 focus:outline-none resize-none" />
          </div>

          {/* File upload */}
          <SectionErrorBoundary>
            <FormFileUpload category="documents" label="Supporting Documentation"
              description="Attach reports, photos, or charts"
              accept="image/*,video/*,.pdf,.doc,.docx" multiple maxSizeMB={50} />
          </SectionErrorBoundary>

          {/* Submit row */}
          <div className="flex gap-3">
            <button type="submit"
              disabled={submitMutation.isLoading || !!mlResult}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50">
              <Save size={15} />
              {submitMutation.isLoading ? 'Saving…' : 'Save Assessment'}
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
                className="bg-[var(--card-bg)] border-l-4 border-teal-500 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-[var(--text-900)] flex items-center gap-2">
                    <Brain size={14} className="text-teal-600" /> Updated Risk Assessment
                  </p>
                  {mlResult.overall_level && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${RISK_LEVEL_CLASSES[mlResult.overall_level] || RISK_LEVEL_CLASSES.low}`}>
                      {mlResult.overall_level} · {Math.round((mlResult.overall_risk ?? 0) * 100)}%
                    </span>
                  )}
                </div>
                {mlResult.key_concerns?.slice(0,3).map((c, i) => (
                  <p key={i} className="text-xs text-[var(--text-600)] flex items-start gap-1.5 mt-1">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" /> {c}
                  </p>
                ))}
                <button type="button" onClick={() => navigate(`/assessments/${patientId}`)}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition">
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
