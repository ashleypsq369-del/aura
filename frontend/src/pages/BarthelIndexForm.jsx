/**
 * BarthelIndexForm.jsx — Activities of Daily Living (Barthel Index)
 * Redesigned: PageHeader + clean option cards + live score bar
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Save, UtensilsCrossed, Droplets, Scissors,
  Shirt, Activity, Droplet, Home, BedDouble, Footprints, StepForward,
  Brain, ArrowRight, ChevronLeft, CheckCircle2, TrendingUp, TrendingDown,
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

const barthelItems = [
  { key:'feeding',         label:'Feeding',              Icon:UtensilsCrossed, options:[
    { value:0,  label:'Unable',       desc:'Needs to be fed' },
    { value:5,  label:'Needs help',   desc:'Cutting, spreading, etc.' },
    { value:10, label:'Independent',  desc:'Can use any device' },
  ]},
  { key:'bathing',         label:'Bathing',              Icon:Droplets, options:[
    { value:0, label:'Dependent',    desc:'Needs full assistance' },
    { value:5, label:'Independent',  desc:'Bath, shower, or sponge bath' },
  ]},
  { key:'grooming',        label:'Grooming',             Icon:Scissors, options:[
    { value:0, label:'Needs help',   desc:'With personal care' },
    { value:5, label:'Independent',  desc:'Face, hair, teeth, shaving' },
  ]},
  { key:'dressing',        label:'Dressing',             Icon:Shirt, options:[
    { value:0,  label:'Dependent',   desc:'Needs full help' },
    { value:5,  label:'Needs help',  desc:'With at least half the task' },
    { value:10, label:'Independent', desc:'Including buttons, zips, laces' },
  ]},
  { key:'bowel_control',   label:'Bowel Control',        Icon:Activity, options:[
    { value:0,  label:'Incontinent',          desc:'Or needs enemas' },
    { value:5,  label:'Occasional accident',  desc:'Once per week or less' },
    { value:10, label:'Continent',            desc:'No accidents' },
  ]},
  { key:'bladder_control', label:'Bladder Control',      Icon:Droplet, options:[
    { value:0,  label:'Incontinent / catheterised', desc:'Unable to manage' },
    { value:5,  label:'Occasional accident',         desc:'Max once per day' },
    { value:10, label:'Continent',                   desc:'For >7 days' },
  ]},
  { key:'toilet_use',      label:'Toilet Use',           Icon:Home, options:[
    { value:0,  label:'Dependent',   desc:'Needs full help' },
    { value:5,  label:'Needs help',  desc:'Balance, clothes, wiping' },
    { value:10, label:'Independent', desc:'On/off, dressing, wiping' },
  ]},
  { key:'transfers',       label:'Transfers (Bed/Chair)',Icon:BedDouble, options:[
    { value:0,  label:'Unable',       desc:'No sitting balance' },
    { value:5,  label:'Major help',   desc:'1–2 people, physical' },
    { value:10, label:'Minor help',   desc:'Verbal or physical' },
    { value:15, label:'Independent',  desc:'No help needed' },
  ]},
  { key:'mobility',        label:'Mobility',             Icon:Footprints, options:[
    { value:0,  label:'Immobile',              desc:'Cannot use wheelchair' },
    { value:5,  label:'Wheelchair independent',desc:'50m independently' },
    { value:10, label:'Walks with help',        desc:'One person, 50m' },
    { value:15, label:'Independent',            desc:'50m, may use aid' },
  ]},
  { key:'stairs',          label:'Stairs',               Icon:StepForward, options:[
    { value:0,  label:'Unable',       desc:'Cannot climb stairs' },
    { value:5,  label:'Needs help',   desc:'Verbal, physical, or carrying aid' },
    { value:10, label:'Independent',  desc:'May use handrail or aid' },
  ]},
];

function getIndependenceLevel(total) {
  if (total >= 90) return { label:'Independent',         hex:'#16a34a', badge:'badge-low'      };
  if (total >= 60) return { label:'Slightly Dependent',  hex:'#0d9488', badge:'badge-stable'   };
  if (total >= 40) return { label:'Moderately Dependent',hex:'#d97706', badge:'badge-moderate' };
  if (total >= 20) return { label:'Severely Dependent',  hex:'#ea580c', badge:'badge-high'     };
  return                   { label:'Totally Dependent',   hex:'#dc2626', badge:'badge-critical' };
}

export default function BarthelIndexForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [scores, setScores] = useState(Object.fromEntries(barthelItems.map(i => [i.key, null])));
  const [notes, setNotes] = useState('');
  const [mlResult, setMlResult] = useState(null);

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => (await apiClient.get(`/api/patients/${patientId}`)).data,
  });

  const { data: previousAssessments } = useQuery({
    queryKey: ['barthel', patientId],
    queryFn: async () => (await apiClient.get(`/api/assessments/barthel/${patientId}?limit=5`)).data,
  });

  const total = Object.values(scores).reduce((s, v) => s + (v ?? 0), 0);
  const allScored = Object.values(scores).every(v => v !== null);
  const independence = getIndependenceLevel(total);
  const prev = previousAssessments?.assessments?.[0];

  const submitMutation = useMutation({
    mutationFn: async (data) => apiClient.post('/api/assessments/barthel', data),
    onSuccess: (response) => {
      toast.success('Barthel Index saved');
      if (response.data.alerts_generated?.length > 0)
        toast.error(`${response.data.alerts_generated.length} alert(s) generated`, { duration: 5000 });
      queryClient.invalidateQueries(['barthel', patientId]);
      queryClient.invalidateQueries(['assessment-overview', patientId]);
      try { mlAPI.getTaskPrediction(patientId, 'functional_decline').then(r => setMlResult(r.data)); } catch (_) {}
    },
    onError: () => toast.error('Failed to save assessment'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!allScored) { toast.error('Please score all 10 items'); return; }
    submitMutation.mutate({
      patient_id: parseInt(patientId), ...scores,
      total_score: total, independence_level: independence.label, notes,
    });
  };

  return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/african/african-nurse-female.jpg"
        title="Barthel Index"
        subtitle={`Activities of Daily Living${patient?.full_name ? ` · ${patient.full_name}` : ''}`}
        icon={User}
        stats={[
          { label: 'Total Score', value: total, color: independence.hex },
          { label: 'Out of', value: '100', color: '#818cf8' },
          { label: 'Scored', value: `${Object.values(scores).filter(v => v !== null).length}/10`, color: '#2dd4bf' },
        ]}
      >
        <button onClick={() => navigate(`/assessments/${patientId}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--page-bg)] hover:bg-[var(--card-border)] text-[var(--text-700)] rounded-lg border border-[var(--card-border)] text-xs font-semibold transition">
          <ChevronLeft size={14} /> Assessments
        </button>
      </PageHeader>

      <div className="max-w-[760px] mx-auto px-4 py-5 space-y-4">

        {/* Score summary bar */}
        {allScored && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] px-5 py-4 flex items-center gap-4">
            <div>
              <p className="text-3xl font-black tabular-nums" style={{ color: independence.hex }}>{total}</p>
              <p className="text-[10px] text-[var(--text-400)] font-semibold">/ 100</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className={independence.badge}>{independence.label}</span>
                <span className="text-xs text-[var(--text-400)]">{Math.round((total/100)*100)}%</span>
              </div>
              <div className="h-2 bg-[var(--card-border)] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width:`${total}%`, backgroundColor: independence.hex }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 rounded-xl border border-blue-200">
          <User size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            Score each item by selecting the option that best describes the patient's
            <strong> current ability</strong>. Higher scores indicate greater independence.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {barthelItems.map((item, idx) => {
            const Icon = item.icon ?? item.Icon;
            const prevVal = prev?.[item.key];
            const currVal = scores[item.key];
            const delta = prevVal != null && currVal != null ? currVal - prevVal : null;
            return (
              <motion.div key={item.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden">

                {/* Item header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--card-border)]">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-[var(--card-border)] flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-teal-600" />
                  </div>
                  <p className="text-sm font-bold text-[var(--text-900)] flex-1">{item.label}</p>
                  {currVal !== null && (
                    <div className="flex items-center gap-1.5">
                      {delta !== null && (
                        delta > 0 ? <TrendingUp size={12} className="text-green-500" /> :
                        delta < 0 ? <TrendingDown size={12} className="text-red-500" /> : null
                      )}
                      {prevVal != null && <span className="text-[11px] text-[var(--text-400)]">prev {prevVal}</span>}
                      <span className="text-sm font-black text-teal-600">{currVal}</span>
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="p-3 grid grid-cols-1 gap-2">
                  {item.options.map((opt) => {
                    const selected = scores[item.key] === opt.value;
                    return (
                      <button key={opt.value} type="button"
                        onClick={() => setScores(p => ({ ...p, [item.key]: opt.value }))}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border-2 transition-all flex items-center gap-3 ${
                          selected
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-[var(--card-border)] hover:border-teal-300 hover:bg-[var(--page-bg)]'
                        }`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          selected ? 'border-teal-500 bg-teal-500' : 'border-[var(--card-border)]'
                        }`}>
                          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-[var(--text-800)]">{opt.label}</span>
                          <span className="text-xs text-[var(--text-400)] ml-2">{opt.desc}</span>
                        </div>
                        <span className="text-xs font-bold text-[var(--text-400)] flex-shrink-0">{opt.value} pts</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}

          {/* Notes */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <label className="block text-sm font-semibold text-[var(--text-700)] mb-2">
              Additional Notes <span className="font-normal text-[var(--text-400)]">(optional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Observations about patient's functional status…"
              className="w-full px-3 py-2 text-sm border border-[var(--card-border)] rounded-lg bg-[var(--page-bg)] text-[var(--text-800)] focus:border-teal-500 focus:outline-none resize-none" />
          </div>

          <FormFileUpload category="documents" label="Supporting Evidence"
            description="Attach photos, videos, or documentation"
            accept="image/*,video/*,.pdf" multiple maxSizeMB={50} />

          <div className="flex gap-3">
            <button type="submit"
              disabled={submitMutation.isLoading || !allScored || !!mlResult}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50">
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

          <AnimatePresence>
            {mlResult && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-[var(--card-bg)] border-l-4 border-cyan-500 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-[var(--text-900)] flex items-center gap-2">
                    <Brain size={14} className="text-purple-500" /> Functional Independence Risk
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tabular-nums text-cyan-700">
                      {Math.round((mlResult.probability ?? 0) * 100)}%
                    </span>
                    {mlResult.risk_level && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${RISK_LEVEL_CLASSES[mlResult.risk_level] || RISK_LEVEL_CLASSES.low}`}>
                        {mlResult.risk_level}
                      </span>
                    )}
                  </div>
                </div>
                <button type="button" onClick={() => navigate(`/assessments/${patientId}`)}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition">
                  Continue <ArrowRight size={13} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
