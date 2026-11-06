import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ClipboardList, Heart, Activity, Brain, Frown, AlertCircle,
  TrendingUp, ArrowRight, Smile, Users, FileText, Send,
  ChevronLeft, Sparkles,
} from 'lucide-react';
import apiClient from '../api/client';
import { PageSkeleton } from '../components/LoadingSkeleton';
import FocusedAIExplanation from '../components/FocusedAIExplanation';
import MLRiskPanel from '../components/MLRiskPanel';
import PageHeader from '../components/PageHeader';

export default function AssessmentDashboard() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [xaiData, setXaiData] = useState(null);
  const [loadingXai, setLoadingXai] = useState(false);

  const handleGetXaiExplanation = async (assessmentType, totalScore, e) => {
    e.stopPropagation();
    setLoadingXai(true);
    try {
      const response = await apiClient.post('/api/comprehensive-ai/focused-explanation', {
        patient_id: parseInt(patientId),
        focus_type: 'assessment',
        focus_data: { assessment_type: assessmentType, total_score: totalScore },
      });
      setXaiData(response.data);
    } catch (error) {
      console.error('Failed to get AI explanation:', error);
      alert('Could not get AI explanation. Please try again.');
    } finally {
      setLoadingXai(false);
    }
  };

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
        return {};
      }
    },
    retry: 1,
  });

  if (patientLoading || overviewLoading) return <PageSkeleton />;

  if (patientError || !patient) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 sm:py-12 text-center">
        <div className="bg-[var(--card-bg)] rounded-xl p-8 border border-red-200">
          <ClipboardList className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-base font-bold text-[var(--text-900)] mb-2">Patient Not Found</h2>
          <p className="text-sm text-[var(--text-600)] mb-6">Could not load patient with ID {patientId}.</p>
          <button
            onClick={() => navigate('/patients')}
            className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition"
          >
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  // Tally completed vs total
  const allTypes = [
    'esas','pps','phq9','gad7','barthel','cognitive','pain','qol',
    'caregiver_burden','motor_skills','acp','mdt','referrals','spiritual_care',
  ];
  const completedCount = allTypes.filter(k => overview?.[k]).length;
  const overdueCount = allTypes.filter(k => {
    if (!overview?.[k]) return false;
    const days = Math.floor((new Date() - new Date(overview[k].assessed_at)) / 86400000);
    return days > 14;
  }).length;

  const assessmentTypes = [
    {
      id: 'esas',
      name: 'ESAS',
      fullName: 'Edmonton Symptom Assessment',
      icon: Heart,
      color: 'rose',
      description: '9 symptom scales - pain, fatigue, nausea and more',
      data: overview?.esas,
      route: `/assessments/${patientId}/esas`,
      frequency: 'Daily',
    },
    {
      id: 'pps',
      name: 'PPS',
      fullName: 'Palliative Performance Scale',
      icon: Activity,
      color: 'blue',
      description: 'Functional status across 5 domains',
      data: overview?.pps,
      route: `/assessments/${patientId}/pps`,
      frequency: 'Weekly',
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
      frequency: 'Bi-weekly',
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
      frequency: 'Bi-weekly',
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
      frequency: 'Weekly',
    },
    {
      id: 'cognitive',
      name: 'MMSE / MoCA',
      fullName: 'Cognitive Assessment',
      icon: Brain,
      color: 'indigo',
      description: 'Memory and cognitive function',
      data: overview?.cognitive,
      route: `/assessments/${patientId}/cognitive`,
      frequency: 'Monthly',
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
      frequency: 'As needed',
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
      frequency: 'Monthly',
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
      frequency: 'Monthly',
    },
    {
      id: 'motor_skills',
      name: 'Motor',
      fullName: 'Motor Skills & Mobility',
      icon: TrendingUp,
      color: 'orange',
      description: 'Grip, TUG, 6-minute walk, balance',
      data: overview?.motor_skills,
      route: `/assessments/${patientId}/motor-skills`,
      frequency: 'Quarterly',
    },
    {
      id: 'acp',
      name: 'ACP',
      fullName: 'Advance Care Plan',
      icon: FileText,
      color: 'teal',
      description: 'Goals of care, DNR, end-of-life wishes, cultural & spiritual preferences',
      data: overview?.acp,
      route: `/assessments/${patientId}/acp`,
      frequency: 'As needed',
      isPalliative: true,
    },
    {
      id: 'mdt',
      name: 'MDT',
      fullName: 'MDT Meeting Log',
      icon: Users,
      color: 'blue',
      description: 'Multi-disciplinary team meeting records, decisions, action items',
      data: overview?.mdt,
      route: `/assessments/${patientId}/mdt`,
      frequency: 'Monthly',
      isPalliative: true,
    },
    {
      id: 'referrals',
      name: 'Referrals',
      fullName: 'Referral Tracker',
      icon: Send,
      color: 'green',
      description: 'Allied health referrals - physio, social work, chaplaincy and more',
      data: overview?.referrals,
      route: `/assessments/${patientId}/referrals`,
      frequency: 'As needed',
      isPalliative: true,
    },
    {
      id: 'spiritual_care',
      name: 'Spiritual',
      fullName: 'Spiritual & Wellbeing Care',
      icon: Heart,
      color: 'violet',
      description: 'Inclusive spiritual care - all faiths and secular',
      data: overview?.spiritual_care,
      route: `/assessments/${patientId}/spiritual-care`,
      frequency: 'As needed',
      isPalliative: true,
    },
  ];

  const headerStats = [
    { label: 'Completed', value: completedCount, color: '#2dd4bf' },
    { label: 'Total Tools', value: allTypes.length,   color: '#818cf8' },
    { label: 'Overdue',    value: overdueCount,  color: overdueCount > 0 ? '#f87171' : '#4ade80', pulse: overdueCount > 0 },
  ];

  return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/african/african-clinical-team.jpg"
        title="Clinical Assessments"
        subtitle={`${patient?.full_name} · Validated palliative care tools`}
        icon={ClipboardList}
        stats={headerStats}
      >
        <button
          onClick={() => navigate(`/patients/${patientId}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--page-bg)] hover:bg-[var(--card-border)] text-[var(--text-700)] rounded-lg border border-[var(--card-border)] text-xs font-semibold transition"
        >
          <ChevronLeft size={14} /> Back to Patient
        </button>
      </PageHeader>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-5 space-y-5">

        {/* ML Risk Summary */}
        <MLRiskPanel patientId={parseInt(patientId)} compact />

        {/* Standard Assessments */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-[var(--text-500)] uppercase tracking-wider">Standard Assessments</span>
            <div className="h-px flex-1 bg-[var(--card-border)]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assessmentTypes.filter(a => !a.isPalliative).map((assessment, idx) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                onClick={() => navigate(assessment.route)}
                onXaiClick={handleGetXaiExplanation}
                loadingXai={loadingXai}
                delay={idx * 0.04}
              />
            ))}
          </div>
        </section>

        {/* Palliative Care Modules */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-[var(--text-500)] uppercase tracking-wider">Palliative Care Modules</span>
            <div className="h-px flex-1 bg-[var(--card-border)]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assessmentTypes.filter(a => a.isPalliative).map((assessment, idx) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                onClick={() => navigate(assessment.route)}
                onXaiClick={handleGetXaiExplanation}
                loadingXai={loadingXai}
                delay={idx * 0.04}
              />
            ))}
          </div>
        </section>
      </div>

      {xaiData && (
        <FocusedAIExplanation data={xaiData} onClose={() => setXaiData(null)} />
      )}
    </div>
  );
}

/* ── Assessment Card ──────────────────────────────────────────────────── */
function AssessmentCard({ assessment, onClick, onXaiClick, loadingXai, delay }) {
  const Icon = assessment.icon;

  const accent = {
    rose:   { border: '#f43f5e', iconBg: 'bg-rose-50',   iconText: 'text-rose-600',    gradFrom: 'from-rose-500'   },
    blue:   { border: '#3b82f6', iconBg: 'bg-blue-50',   iconText: 'text-blue-600',    gradFrom: 'from-blue-500'   },
    purple: { border: '#a855f7', iconBg: 'bg-purple-50', iconText: 'text-purple-600',  gradFrom: 'from-purple-500' },
    amber:  { border: '#f59e0b', iconBg: 'bg-amber-50',  iconText: 'text-amber-600',   gradFrom: 'from-amber-500'  },
    cyan:   { border: '#06b6d4', iconBg: 'bg-cyan-50',   iconText: 'text-cyan-600',    gradFrom: 'from-cyan-500'   },
    indigo: { border: '#6366f1', iconBg: 'bg-indigo-50', iconText: 'text-indigo-600',  gradFrom: 'from-indigo-500' },
    red:    { border: '#ef4444', iconBg: 'bg-red-50',    iconText: 'text-red-600',     gradFrom: 'from-red-500'    },
    green:  { border: '#10b981', iconBg: 'bg-emerald-50',iconText: 'text-emerald-600', gradFrom: 'from-emerald-500'},
    violet: { border: '#7c3aed', iconBg: 'bg-violet-50', iconText: 'text-violet-600',  gradFrom: 'from-violet-500' },
    orange: { border: '#f97316', iconBg: 'bg-orange-50', iconText: 'text-orange-600',  gradFrom: 'from-orange-500' },
    teal:   { border: '#0d9488', iconBg: 'bg-teal-50',   iconText: 'text-teal-600',    gradFrom: 'from-teal-500'   },
  }[assessment.color] || { border: '#0d9488', iconBg: 'bg-teal-50', iconText: 'text-teal-600', gradFrom: 'from-teal-500' };

  const getStatus = () => {
    if (!assessment.data) return { label: 'Not completed', cls: 'badge-info', urgent: true };
    const days = Math.floor((new Date() - new Date(assessment.data.assessed_at)) / 86400000);
    if (days === 0) return { label: 'Completed today', cls: 'badge-low',      urgent: false };
    if (days === 1) return { label: 'Yesterday',        cls: 'badge-low',      urgent: false };
    if (days <= 7)  return { label: `${days}d ago`,     cls: 'badge-stable',   urgent: false };
    if (days <= 14) return { label: `${days}d ago`,     cls: 'badge-moderate', urgent: false };
    return                 { label: `${days}d ago`,     cls: 'badge-high',     urgent: true  };
  };

  const status = getStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] hover:shadow-md hover:border-slate-300 transition-all cursor-pointer overflow-hidden group"
      style={{ borderLeft: `3px solid ${accent.border}` }}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Icon with subtle gradient band */}
        <div className={`w-10 h-10 rounded-xl ${accent.iconBg} flex items-center justify-center flex-shrink-0 border border-[var(--card-border)]`}>
          <Icon size={18} className={accent.iconText} strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-[var(--text-900)]">{assessment.name}</span>
              <span className="text-xs text-[var(--text-400)]">{assessment.fullName}</span>
            </div>
            <ArrowRight
              size={14}
              className="text-slate-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1"
            />
          </div>

          <p className="text-xs text-[var(--text-500)] mb-2 leading-relaxed">{assessment.description}</p>

          {/* Status + frequency */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={status.cls}>{status.label}</span>
            <span className="text-[11px] text-[var(--text-400)]">· {assessment.frequency}</span>
          </div>

          {/* Score pills */}
          {assessment.data && (
            <div className="mt-2.5 pt-2.5 border-t border-[var(--card-border)] flex items-center justify-between gap-2">
              <div className="flex gap-1.5 flex-wrap">
                {assessment.id === 'esas' && (
                  <>
                    <ScorePill label="Pain"    value={assessment.data.pain}      max={10} />
                    <ScorePill label="Fatigue" value={assessment.data.tiredness} max={10} />
                    <ScorePill label="WB"      value={assessment.data.wellbeing} max={10} />
                  </>
                )}
                {assessment.id === 'pps' && (
                  <ScorePill label="PPS" value={assessment.data.pps_score} max={100} higherIsBetter />
                )}
                {assessment.id === 'barthel' && (
                  <ScorePill label="ADL" value={assessment.data.total_score} max={100} higherIsBetter />
                )}
                {(assessment.id === 'phq9' || assessment.id === 'gad7') && (
                  <ScorePill label="Score" value={assessment.data.total_score} max={27} />
                )}
                {['cognitive', 'qol', 'caregiver_burden', 'motor_skills'].includes(assessment.id) && (
                  <ScorePill label="Score" value={assessment.data.total_score} max={assessment.data.max_score || 100} />
                )}
              </div>
              {assessment.id === 'esas' && assessment.data?.esas_total > 40 && (
                <button
                  onClick={e => { e.stopPropagation(); onXaiClick('ESAS', assessment.data.esas_total, e); }}
                  disabled={loadingXai}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold border border-purple-200 transition disabled:opacity-50 flex-shrink-0"
                  title="AI explanation"
                >
                  <Sparkles size={11} /> AI
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ScorePill({ label, value, max, higherIsBetter = false }) {
  if (value == null) return null;
  const pct = (value / max) * 100;
  // For higher-is-better tools (PPS, Barthel), flip the severity logic
  const level = higherIsBetter
    ? (pct >= 70 ? 'badge-low' : pct >= 40 ? 'badge-moderate' : 'badge-high')
    : (pct >= 70 ? 'badge-high' : pct >= 40 ? 'badge-moderate' : 'badge-low');
  return <span className={level}>{label}: {value}/{max}</span>;
}
