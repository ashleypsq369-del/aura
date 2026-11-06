/**
 * CognitiveAssessmentForm.jsx - MMSE / MoCA Cognitive Assessment
 * Redesigned: PageHeader + clean component score inputs
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Brain, Save, ChevronLeft, Info } from 'lucide-react';
import apiClient from '../api/client';
import toast from '../utils/toast';
import FormFileUpload from '../components/FormFileUpload';
import PageHeader from '../components/PageHeader';

const mmseComponents = [
  { key:'mmse_orientation_time',       label:'Orientation to Time',       max:5, desc:'Year, season, date, day, month'                                },
  { key:'mmse_orientation_place',      label:'Orientation to Place',      max:5, desc:'State, county, town, hospital, floor'                         },
  { key:'mmse_registration',           label:'Registration',              max:3, desc:'Repeat 3 words immediately after examiner'                    },
  { key:'mmse_attention_calculation',  label:'Attention & Calculation',   max:5, desc:'Serial 7s or spell WORLD backwards'                          },
  { key:'mmse_recall',                 label:'Recall',                    max:3, desc:'Recall the 3 words from Registration'                        },
  { key:'mmse_language',               label:'Language',                  max:8, desc:'Naming, repetition, 3-stage command, reading, writing'        },
  { key:'mmse_visual_construction',    label:'Visual Construction',       max:1, desc:'Copy the intersecting pentagons'                              },
];

const mocaComponents = [
  { key:'moca_visuospatial_executive', label:'Visuospatial / Executive', max:5, desc:'Trail making B, cube copy, clock drawing'                    },
  { key:'moca_naming',                 label:'Naming',                   max:3, desc:'Name the lion, rhinoceros, camel'                             },
  { key:'moca_attention',              label:'Attention',                max:6, desc:'Forward/backward digit span, vigilance, serial 7s'           },
  { key:'moca_language',               label:'Language',                 max:3, desc:'Sentence repetition and verbal fluency'                      },
  { key:'moca_abstraction',            label:'Abstraction',              max:2, desc:'Similarities between paired words'                           },
  { key:'moca_delayed_recall',         label:'Delayed Recall',           max:5, desc:'Remember 5 words after 5-minute delay'                      },
  { key:'moca_orientation',            label:'Orientation',              max:6, desc:'Date, month, year, day, place, city'                         },
];

function getMMSEInterp(total) {
  if (total >= 24) return { label:'Normal',             badge:'badge-low'      };
  if (total >= 18) return { label:'Mild Impairment',    badge:'badge-stable'   };
  if (total >= 10) return { label:'Moderate Impairment',badge:'badge-moderate' };
  return                   { label:'Severe Impairment', badge:'badge-critical' };
}

function getMoCAInterp(total) {
  if (total >= 26) return { label:'Normal',                      badge:'badge-low'      };
  if (total >= 18) return { label:'Mild Cognitive Impairment',   badge:'badge-stable'   };
  if (total >= 10) return { label:'Moderate Impairment',         badge:'badge-moderate' };
  return                   { label:'Severe Impairment',          badge:'badge-critical' };
}

export default function CognitiveAssessmentForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [assessmentType, setAssessmentType] = useState('MMSE');
  const [educationYears, setEducationYears] = useState('');
  const [mmseScores, setMmseScores] = useState(Object.fromEntries(mmseComponents.map(c => [c.key, ''])));
  const [mocaScores, setMocaScores] = useState(Object.fromEntries(mocaComponents.map(c => [c.key, ''])));
  const [notes, setNotes] = useState('');

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => (await apiClient.get(`/api/patients/${patientId}`)).data,
  });

  const calcMMSE = () => Object.values(mmseScores).reduce((s, v) => s + (parseInt(v) || 0), 0);
  const calcMoCA = () => {
    let t = Object.values(mocaScores).reduce((s, v) => s + (parseInt(v) || 0), 0);
    if (parseInt(educationYears) <= 12 && parseInt(educationYears) > 0) t += 1;
    return Math.min(t, 30);
  };

  const currentScores  = assessmentType === 'MMSE' ? mmseScores  : mocaScores;
  const setCurrentScores = assessmentType === 'MMSE' ? setMmseScores : setMocaScores;
  const currentComponents = assessmentType === 'MMSE' ? mmseComponents : mocaComponents;
  const currentTotal   = assessmentType === 'MMSE' ? calcMMSE() : calcMoCA();
  const currentInterp  = assessmentType === 'MMSE' ? getMMSEInterp(currentTotal) : getMoCAInterp(currentTotal);
  const allFilled      = Object.values(currentScores).every(v => v !== '');
  const educationBonus = assessmentType === 'MoCA' && parseInt(educationYears) <= 12 && parseInt(educationYears) > 0;

  const submitMutation = useMutation({
    mutationFn: async (data) => apiClient.post('/api/assessments/cognitive', data),
    onSuccess: (response) => {
      toast.success('Cognitive assessment saved');
      if (response.data.alerts_generated?.length > 0)
        toast.error(`${response.data.alerts_generated.length} alert(s) generated`, { duration: 5000 });
      queryClient.invalidateQueries(['cognitive', patientId]);
      queryClient.invalidateQueries(['assessment-overview', patientId]);
      setTimeout(() => navigate(`/assessments/${patientId}`), 1500);
    },
    onError: () => toast.error('Failed to save assessment'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!allFilled) { toast.error(`Please complete all ${assessmentType} components`); return; }

    const data = { patient_id: parseInt(patientId), assessment_type: assessmentType,
      patient_education_years: parseInt(educationYears) || null, notes };

    if (assessmentType === 'MMSE') {
      Object.entries(mmseScores).forEach(([k, v]) => { data[k] = parseInt(v); });
      data.mmse_total = calcMMSE();
      data.interpretation = getMMSEInterp(data.mmse_total).label;
    } else {
      Object.entries(mocaScores).forEach(([k, v]) => { data[k] = parseInt(v); });
      data.moca_education_adjustment = educationBonus ? 1 : 0;
      data.moca_total = calcMoCA();
      data.interpretation = getMoCAInterp(data.moca_total).label;
    }
    submitMutation.mutate(data);
  };

  return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/african/african-clinical-team.jpg"
        title="Cognitive Assessment"
        subtitle={`MMSE / MoCA Screening${patient?.full_name ? ` · ${patient.full_name}` : ''}`}
        icon={Brain}
        stats={[
          { label: assessmentType, value: `${currentTotal}/30`, color: currentTotal >= 24 ? '#16a34a' : currentTotal >= 18 ? '#d97706' : '#dc2626' },
          { label: 'Interpretation', value: allFilled ? currentInterp.label.split(' ')[0] : '-', color: '#818cf8' },
        ]}
      >
        <button onClick={() => navigate(`/assessments/${patientId}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--page-bg)] hover:bg-[var(--card-border)] text-[var(--text-700)] rounded-lg border border-[var(--card-border)] text-xs font-semibold transition">
          <ChevronLeft size={14} /> Assessments
        </button>
      </PageHeader>

      <div className="max-w-[760px] mx-auto px-4 py-5 space-y-4">

        {/* Type selector */}
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
          <p className="text-xs font-bold text-[var(--text-500)] uppercase tracking-wider mb-3">Assessment Type</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { type:'MMSE', name:'MMSE', sub:'Mini-Mental State Exam', note:'Most widely used · 7 components' },
              { type:'MoCA', name:'MoCA', sub:'Montreal Cognitive Assessment', note:'More sensitive · 7 components' },
            ].map(opt => (
              <button key={opt.type} type="button" onClick={() => setAssessmentType(opt.type)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  assessmentType === opt.type
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-[var(--card-border)] hover:border-indigo-300 hover:bg-[var(--page-bg)]'
                }`}>
                <p className="text-sm font-bold text-[var(--text-900)]">{opt.name}</p>
                <p className="text-xs text-[var(--text-600)]">{opt.sub}</p>
                <p className="text-[11px] text-[var(--text-400)] mt-0.5">{opt.note}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
          <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">
            Patient's Years of Education
            {assessmentType === 'MoCA' && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input type="number" min="0" max="30" value={educationYears}
            onChange={e => setEducationYears(e.target.value)}
            placeholder="e.g. 12"
            className="w-32 px-3 py-2 text-sm border border-[var(--card-border)] rounded-lg bg-[var(--page-bg)] text-[var(--text-800)] focus:border-indigo-500 focus:outline-none"
            required={assessmentType === 'MoCA'} />
          {educationBonus && (
            <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
              <Info size={11} /> +1 education adjustment point will be added
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="flex items-start gap-3 px-4 py-3 bg-indigo-50 rounded-xl border border-indigo-200">
          <Brain size={15} className="text-indigo-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-800">
            Administer the <strong>{assessmentType}</strong> following the standardised protocol.
            Enter each component score - all components must be completed.
            {assessmentType === 'MoCA' && ' +1 point is added automatically if education ≤12 years.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {currentComponents.map((comp, idx) => {
            const val = currentScores[comp.key];
            const pct = val !== '' ? (parseInt(val) / comp.max) * 100 : null;
            return (
              <motion.div key={comp.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4 flex items-center gap-4">

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-[var(--text-900)]">{comp.label}</p>
                    <span className="text-xs text-[var(--text-400)] flex-shrink-0">max {comp.max}</span>
                  </div>
                  <p className="text-xs text-[var(--text-400)]">{comp.desc}</p>
                  {pct !== null && (
                    <div className="mt-2 h-1.5 bg-[var(--card-border)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626' }} />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input type="number" min="0" max={comp.max} value={val} required
                    onChange={e => {
                      const v = e.target.value;
                      if (v === '' || (parseInt(v) >= 0 && parseInt(v) <= comp.max))
                        setCurrentScores(p => ({ ...p, [comp.key]: v }));
                    }}
                    className="w-16 text-center text-lg font-black px-2 py-1.5 border-2 border-[var(--card-border)] rounded-lg bg-[var(--page-bg)] text-indigo-600 focus:border-indigo-500 focus:outline-none"
                    aria-label={`${comp.label} score`} />
                  <span className="text-xs text-[var(--text-400)]">/ {comp.max}</span>
                </div>
              </motion.div>
            );
          })}

          {/* Score summary */}
          {allFilled && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[var(--card-bg)] rounded-xl border-2 border-indigo-200 p-4 text-center">
              <p className="text-xs font-bold text-[var(--text-500)] uppercase tracking-wider mb-1">{assessmentType} Total Score</p>
              <p className="text-4xl font-black tabular-nums text-indigo-600">{currentTotal} <span className="text-lg text-[var(--text-400)]">/ 30</span></p>
              <span className={`${currentInterp.badge} mt-2 inline-block`}>{currentInterp.label}</span>
              {educationBonus && (
                <p className="text-[11px] text-[var(--text-400)] mt-1">Includes +1 education adjustment</p>
              )}
            </motion.div>
          )}

          {/* Notes */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <label className="block text-sm font-semibold text-[var(--text-700)] mb-2">
              Clinical Notes <span className="font-normal text-[var(--text-400)]">(optional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Observations during testing, patient cooperation, environmental factors…"
              className="w-full px-3 py-2 text-sm border border-[var(--card-border)] rounded-lg bg-[var(--page-bg)] text-[var(--text-800)] focus:border-indigo-500 focus:outline-none resize-none" />
          </div>

          <FormFileUpload category="documents" label="Assessment Documentation"
            description="Attach test sheets or supporting files"
            accept=".pdf,.doc,.docx,image/*" multiple maxSizeMB={50} />

          <div className="flex gap-3">
            <button type="submit" disabled={submitMutation.isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50">
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
