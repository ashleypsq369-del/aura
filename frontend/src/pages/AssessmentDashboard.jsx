import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ClipboardList, Heart, Activity, Brain, Frown, AlertCircle,
  TrendingUp, ArrowRight, Smile, Users
} from 'lucide-react';
import apiClient from '../api/client';
import { PageSkeleton } from '../components/LoadingSkeleton';
import FocusedAIExplanation from '../components/FocusedAIExplanation';
import MLRiskPanel from '../components/MLRiskPanel';

export default function AssessmentDashboard() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [xaiData, setXaiData] = useState(null);
  const [loadingXai, setLoadingXai] = useState(false);

  // XAI Handler
  const handleGetXaiExplanation = async (assessmentType, totalScore, e) => {
    e.stopPropagation(); // Prevent card click
    setLoadingXai(true);
    try {
      const response = await apiClient.post('/api/comprehensive-ai/focused-explanation', {
        patient_id: parseInt(patientId),
        focus_type: 'assessment',
        focus_data: {
          assessment_type: assessmentType,
          total_score: totalScore
        }
      });
      setXaiData(response.data);
    } catch (error) {
      console.error('Failed to get AI explanation:', error);
      alert('Could not get AI explanation. Please try again.');
    } finally {
      setLoadingXai(false);
    }
  };

  // Fetch patient and assessments
  const { data: patient, isLoading: patientLoading, error: patientError } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/patients/${patientId}`);
      return response.data;
    },
    retry: 1,
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['assessment-overview', patientId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/assessments/patient/${patientId}/overview`);
        return response.data;
      } catch {
        return {}; // Return empty object on error - assessments will show as "not done"
      }
    },
    retry: 1,
  });

  if (patientLoading || overviewLoading) return <PageSkeleton />;

  if (patientError || !patient) {
    return (
      <div className="max-w-[1400px] mx-auto px-8 py-12 text-center">
        <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-red-200">
          <ClipboardList className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Patient Not Found</h2>
          <p className="text-slate-600 mb-6">Could not load patient with ID {patientId}.</p>
          <button
            onClick={() => navigate('/patients')}
            className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition"
          >
            ← Back to Patients
          </button>
        </div>
      </div>
    );
  }

  const assessmentTypes = [
    {
      id: 'esas',
      name: 'ESAS',
      fullName: 'Edmonton Symptom Assessment',
      icon: Heart,
      color: 'rose',
      description: '9 symptom scales (pain, tiredness, etc.)',
      data: overview?.esas,
      route: `/assessments/${patientId}/esas`,
      frequency: 'Daily'
    },
    {
      id: 'pps',
      name: 'PPS',
      fullName: 'Palliative Performance Scale',
      icon: Activity,
      color: 'blue',
      description: 'Functional status assessment',
      data: overview?.pps,
      route: `/assessments/${patientId}/pps`,
      frequency: 'Weekly'
    },
    {
      id: 'phq9',
      name: 'PHQ-9',
      fullName: 'Depression Screening',
      icon: Frown,
      color: 'purple',
      description: '9-question depression assessment',
      data: overview?.phq9,
      route: `/assessments/${patientId}/mental-health`,
      frequency: 'Bi-weekly'
    },
    {
      id: 'gad7',
      name: 'GAD-7',
      fullName: 'Anxiety Screening',
      icon: Brain,
      color: 'amber',
      description: '7-question anxiety assessment',
      data: overview?.gad7,
      route: `/assessments/${patientId}/mental-health`,
      frequency: 'Bi-weekly'
    },
    {
      id: 'barthel',
      name: 'Barthel',
      fullName: 'Activities of Daily Living',
      icon: Activity,
      color: 'cyan',
      description: '10-item ADL assessment',
      data: overview?.barthel,
      route: `/assessments/${patientId}/barthel`,
      frequency: 'Weekly'
    },
    {
      id: 'cognitive',
      name: 'MMSE/MoCA',
      fullName: 'Cognitive Assessment',
      icon: Brain,
      color: 'indigo',
      description: 'Memory and cognitive function',
      data: overview?.cognitive,
      route: `/assessments/${patientId}/cognitive`,
      frequency: 'Monthly'
    },
    {
      id: 'pain',
      name: 'BPI',
      fullName: 'Brief Pain Inventory',
      icon: AlertCircle,
      color: 'red',
      description: 'Comprehensive pain evaluation',
      data: overview?.pain,
      route: `/assessments/${patientId}/pain`,
      frequency: 'As needed'
    },
    {
      id: 'qol',
      name: 'FACT-G',
      fullName: 'Quality of Life',
      icon: Smile,
      color: 'green',
      description: '27-question wellbeing assessment',
      data: overview?.qol,
      route: `/assessments/${patientId}/qol`,
      frequency: 'Monthly'
    },
    {
      id: 'caregiver_burden',
      name: 'Zarit',
      fullName: 'Caregiver Burden',
      icon: Users,
      color: 'violet',
      description: '12-question caregiver burden assessment',
      data: overview?.caregiver_burden,
      route: `/assessments/${patientId}/caregiver-burden`,
      frequency: 'Monthly'
    },
    {
      id: 'motor_skills',
      name: 'Motor',
      fullName: 'Motor Skills & Mobility',
      icon: TrendingUp,
      color: 'orange',
      description: 'Physical function tests (TUG, 6MWT, etc.)',
      data: overview?.motor_skills,
      route: `/assessments/${patientId}/motor-skills`,
      frequency: 'Quarterly'
    }
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-0 space-y-5">
      {/* Back button */}
      <button
        onClick={() => navigate(`/patients/${patientId}`)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors mt-4"
      >
        ← Back to Patient
      </button>

      {/* Header */}
      <div className="rounded-lg border border-slate-200 px-5 py-4 flex items-center justify-between overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #4338ca)' }}>
        <div>
          <h1 className="text-base font-bold text-white">Clinical Assessments</h1>
          <p className="text-sm text-purple-200 mt-0.5">
            {patient?.full_name} · Validated palliative care assessment tools
          </p>
        </div>
        <ClipboardList size={24} className="text-white/30" />
      </div>

      {/* ML Risk Summary compact */}
      <MLRiskPanel patientId={parseInt(patientId)} compact />

      {/* Assessment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assessmentTypes.map((assessment, idx) => (
          <AssessmentCard
            key={assessment.id}
            assessment={assessment}
            onClick={() => navigate(assessment.route)}
            onXaiClick={handleGetXaiExplanation}
            loadingXai={loadingXai}
            delay={idx * 0.05}
          />
        ))}
      </div>

      {/* XAI Modal */}
      {xaiData && (
        <FocusedAIExplanation
          data={xaiData}
          onClose={() => setXaiData(null)}
        />
      )}
    </div>
  );
}

function AssessmentCard({ assessment, onClick, onXaiClick, loadingXai, delay }) {
  const Icon = assessment.icon;

  // Per-color accent palette (border-left + icon bg)
  const accent = {
    rose:   { border: '#f43f5e', iconBg: 'bg-rose-50',   iconText: 'text-rose-600'   },
    blue:   { border: '#3b82f6', iconBg: 'bg-blue-50',   iconText: 'text-blue-600'   },
    purple: { border: '#a855f7', iconBg: 'bg-purple-50', iconText: 'text-purple-600' },
    amber:  { border: '#f59e0b', iconBg: 'bg-amber-50',  iconText: 'text-amber-600'  },
    cyan:   { border: '#06b6d4', iconBg: 'bg-cyan-50',   iconText: 'text-cyan-600'   },
    indigo: { border: '#6366f1', iconBg: 'bg-indigo-50', iconText: 'text-indigo-600' },
    red:    { border: '#ef4444', iconBg: 'bg-red-50',    iconText: 'text-red-600'    },
    green:  { border: '#10b981', iconBg: 'bg-emerald-50',iconText: 'text-emerald-600'},
    violet: { border: '#7c3aed', iconBg: 'bg-violet-50', iconText: 'text-violet-600' },
    orange: { border: '#f97316', iconBg: 'bg-orange-50', iconText: 'text-orange-600' },
  }[assessment.color] || { border: '#0d9488', iconBg: 'bg-teal-50', iconText: 'text-teal-600' };

  const getStatus = () => {
    if (!assessment.data) return { label: 'Never completed', cls: 'badge-info' };
    const daysSince = Math.floor((new Date() - new Date(assessment.data.assessed_at)) / 86400000);
    if (daysSince === 0) return { label: 'Completed today',  cls: 'badge-low' };
    if (daysSince === 1) return { label: 'Yesterday',         cls: 'badge-low' };
    if (daysSince <= 7)  return { label: `${daysSince}d ago`, cls: 'badge-stable' };
    if (daysSince <= 14) return { label: `${daysSince}d ago`, cls: 'badge-moderate' };
    return                      { label: `${daysSince}d ago`, cls: 'badge-high' };
  };

  const status = getStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer overflow-hidden group"
      style={{ borderLeft: `4px solid ${accent.border}` }}
    >
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-lg ${accent.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={16} className={accent.iconText} strokeWidth={2.5} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <span className="text-sm font-bold text-slate-900">{assessment.name}</span>
              <span className="text-xs text-slate-400 ml-2">{assessment.fullName}</span>
            </div>
            <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
          </div>

          <p className="text-xs text-slate-500 mb-2">{assessment.description}</p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={status.cls}>{status.label}</span>
            <span className="text-[10px] text-slate-400">every {assessment.frequency}</span>
          </div>

          {/* Latest scores */}
          {assessment.data && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1.5 flex-wrap">
                  {assessment.id === 'esas' && (
                    <>
                      <ScorePill label="Pain" value={assessment.data.pain} max={10} />
                      <ScorePill label="Fatigue" value={assessment.data.tiredness} max={10} />
                      <ScorePill label="Wellbeing" value={assessment.data.wellbeing} max={10} />
                    </>
                  )}
                  {assessment.id === 'pps' && (
                    <ScorePill label="PPS" value={assessment.data.pps_score} max={100} />
                  )}
                  {assessment.id === 'barthel' && (
                    <ScorePill label="Barthel" value={assessment.data.total_score} max={100} />
                  )}
                  {(assessment.id === 'phq9' || assessment.id === 'gad7') && (
                    <ScorePill label="Score" value={assessment.data.total_score} max={27} />
                  )}
                  {(assessment.id === 'cognitive' || assessment.id === 'qol' || assessment.id === 'caregiver_burden' || assessment.id === 'motor_skills') && (
                    <ScorePill label="Score" value={assessment.data.total_score} max={assessment.data.max_score || 100} />
                  )}
                </div>
                {assessment.id === 'esas' && assessment.data?.esas_total > 40 && (
                  <button
                    onClick={e => { e.stopPropagation(); onXaiClick('ESAS', assessment.data.esas_total, e); }}
                    disabled={loadingXai}
                    className="p-1.5 rounded-md bg-purple-50 hover:bg-purple-100 transition-colors disabled:opacity-50 flex-shrink-0"
                    title="AI explanation"
                  >
                    <Brain size={14} className="text-purple-600" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ScorePill({ label, value, max }) {
  const pct = (value / max) * 100;
  const cls = pct >= 70 ? 'badge-high' : pct >= 40 ? 'badge-moderate' : 'badge-low';
  return (
    <span className={cls}>
      {label}: {value}/{max}
    </span>
  );
}

function getSeverityColor(severity) {
  const map = {
    minimal:          'badge-low',
    mild:             'badge-stable',
    moderate:         'badge-moderate',
    moderately_severe:'badge-high',
    severe:           'badge-critical',
  };
  return map[severity] || 'badge-info';
}
