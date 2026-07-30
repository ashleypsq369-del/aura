import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from '../utils/toast';
import { offlinePatientsAPI } from '../api/offlineClient';
import { motion } from 'framer-motion';
import { Activity, Pill, AlertCircle, FileText, Calendar,
  MessageCircle, Phone, Mail, User, MapPin, Heart,
  ClipboardList, Edit2, Brain, HeartHandshake,
  Stethoscope, BedDouble, ArrowRight,
  Building2, Home, Info,
} from 'lucide-react';
import { caregiverIntelligenceAPI, careSettingsAPI, mlAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCareTeamChat } from '../hooks/useCareTeamChat';
import PageTransition from '../components/PageTransition';
import RiskExplanationPanel from '../components/RiskExplanationPanel';
import MLRiskSummaryCard from '../components/MLRiskSummaryCard';
import ModalShell from '../components/ui/ModalShell';
import PageHeader from '../components/PageHeader';
import ImageCard from '../components/ImageCard';

import { API_URL } from '../api/client';

/* ── Care setting context banner for staff ─────────────────────────────── */
const SETTING_INFO = {
  hospital_based:        { label:'Hospital-Based',    icon:Building2,   color:'#1d4ed8', bg:'#eff6ff',
    clinical_notes: 'Inpatient specialist care. Prioritise: vitals q4-8h, pain control, daily MDT review.',
    key_tasks: ['Vitals every 4–8h', 'Daily symptom assessment (ESAS)', 'Medication review', 'Family communication'],
  },
  hospice:               { label:'Hospice',           icon:Heart,       color:'#be123c', bg:'#fff1f2',
    clinical_notes: 'Comfort-focused care. Prioritise: dignity, pain & symptom control, family support, legacy planning.',
    key_tasks: ['Comfort measures', 'Pain & symptom control', 'Family/bereavement support', 'Advance directive review'],
  },
  home_based:            { label:'Home-Based',        icon:Home,        color:'#15803d', bg:'#f0fdf4',
    clinical_notes: 'Community care visits. Prioritise: medication compliance, carer education, safety, daily remote monitoring.',
    key_tasks: ['Daily vitals log', 'Medication adherence', 'Carer training', 'Remote symptom monitoring'],
  },
  outpatient_clinic:     { label:'Outpatient Clinic', icon:Stethoscope, color:'#0d9488', bg:'#f0fdfa',
    clinical_notes: 'Clinic-based visits. Prioritise: appointment adherence, medication review, assessment completion.',
    key_tasks: ['Appointment scheduling', 'Assessment completion', 'Medication review', 'Pre-clinic prep'],
  },
  long_term_residential: { label:'Residential Care',  icon:BedDouble,   color:'#7c3aed', bg:'#f5f3ff',
    clinical_notes: 'Residential facility. Prioritise: ADL support, socialisation, monthly PPS, family updates.',
    key_tasks: ['Monthly PPS assessment', 'ADL monitoring', 'Community engagement', 'Family liaison'],
  },
};

function CareSettingBanner({ setting }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SETTING_INFO[setting];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: cfg.color + '30', backgroundColor: cfg.bg }}>
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: cfg.color + '20' }}>
          <Icon size={16} style={{ color: cfg.color }}/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold" style={{ color: cfg.color }}>
            Care Setting: {cfg.label}
          </p>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">{cfg.clinical_notes}</p>
        </div>
        <Info size={14} className="text-slate-400 flex-shrink-0"/>
      </button>
      {expanded && (
        <div className="px-4 pb-3 border-t" style={{ borderColor: cfg.color + '20' }}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2 mb-1.5">Key Clinical Tasks</p>
          <div className="flex flex-wrap gap-1.5">
            {cfg.key_tasks.map(t => (
              <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: cfg.color + '18', color: cfg.color }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PatientDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { chatWith } = useCareTeamChat();
  const queryClient = useQueryClient();
  const token = localStorage.getItem('auth_token');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showRiskExplanation, setShowRiskExplanation] = useState(false);
  const [riskData, setRiskData] = useState(null);
  const [loadingRisk, setLoadingRisk] = useState(false);

  useEffect(() => {
    if (!patientId || patientId === 'undefined') navigate('/patients');
  }, [patientId, navigate]);

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      if (!patientId || patientId === 'undefined') throw new Error('Invalid ID');
      const r = await offlinePatientsAPI.getById(parseInt(patientId));
      return r.data;
    },
    enabled: !!patientId && patientId !== 'undefined' && !!token,
  });

  const { data: vitals } = useQuery({
    queryKey: ['patient-vitals', patientId],
    queryFn: () => axios.get(`${API_URL}/api/patients/${patientId}/vitals`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.data),
    enabled: !!patientId && patientId !== 'undefined' && !!token,
    retry: false,
  });

  const { data: medications } = useQuery({
    queryKey: ['patient-medications', patientId],
    queryFn: () => axios.get(`${API_URL}/api/patients/${patientId}/medications`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.data),
    enabled: !!patientId && patientId !== 'undefined' && !!token,
    retry: false,
  });

  const { data: caregiverMatches } = useQuery({
    queryKey: ['caregiver-matches', patientId],
    queryFn: () => caregiverIntelligenceAPI.findMatches(patientId).then(r => r.data),
    enabled: !!patientId && (user?.role === 'admin' || user?.role === 'clinician'),
    retry: false,
  });

  const { data: careSettingData } = useQuery({
    queryKey: ['patient-care-setting', patientId],
    queryFn: () => careSettingsAPI.getPatientSettings(patientId).then(r => r.data),
    enabled: !!patientId && patientId !== 'undefined' && !!token,
    retry: false,
  });

  // Must be here (not after early returns) — Rules of Hooks
  const { data: patientUserData } = useQuery({
    queryKey: ['patient-user-id', patientId],
    queryFn: async () => {
      const r = await axios.get(`${API_URL}/api/messaging/patient-user/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return r.data;
    },
    enabled: !!patientId && !!token && ['admin','clinician','caregiver'].includes(user?.role),
    retry: false,
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus) => axios.put(
      `${API_URL}/api/patients/${patientId}/status`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    ),
    onSuccess: () => {
      queryClient.invalidateQueries(['patient', patientId]);
      setShowStatusModal(false);
      toast.success('Patient status updated');
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to update status'),
  });

  const assignOptimalMutation = useMutation({
    mutationFn: () => caregiverIntelligenceAPI.assignOptimal(patientId),
    onSuccess: (data) => {
      toast.success(data.message || 'Caregiver assigned');
      queryClient.invalidateQueries(['caregiver-matches', patientId]);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Auto-assign failed'),
  });

  const getStatusBadgeColor = (status) => {
    const map = {
      active:       'badge-low',
      stable:       'badge-stable',
      deteriorating:'badge-high',
      critical:     'badge-critical',
      deceased:     'badge-info',
      discharged:   'badge-stable',
    };
    return map[status] || 'badge-info';
  };

  const explainRisk = async () => {
    setLoadingRisk(true);
    try {
      const r = await mlAPI.getPatientRisk(patientId);
      const raw = r.data;

      // Transform PatientRiskProfile → RiskExplanationPanel expected shape
      const levelMap = { low: 'Low', moderate: 'Moderate', high: 'High', critical: 'Critical' };
      const level = levelMap[raw.overall_level] || 'Low';

      // Aggregate SHAP features across all tasks (deduplicate by feature name, sum importance)
      const featureMap = {};
      Object.values(raw.tasks || {}).forEach(task => {
        (task.top_features || []).forEach(f => {
          const key = f.feature;
          if (!featureMap[key]) {
            featureMap[key] = { ...f, importance: 0, pct: 0 };
          }
          featureMap[key].importance += f.importance;
          featureMap[key].pct += f.pct;
        });
      });
      const allFeatures = Object.values(featureMap)
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 10);
      // Re-normalise pct to 100%
      const totalPct = allFeatures.reduce((s, f) => s + f.pct, 0) || 1;
      allFeatures.forEach(f => { f.pct = parseFloat((f.pct / totalPct * 100).toFixed(1)); });

      // Build component breakdown from tasks
      const components = Object.entries(raw.tasks || {}).map(([key, t]) => ({
        name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        score: parseFloat((t.probability * 100).toFixed(1)),
        risk_level: t.risk_level,
        shap_available: t.shap_available,
      }));

      const adapted = {
        // RiskExplanationPanel hero fields
        overall_risk_score: raw.overall_risk,
        confidence:         raw.models_available / 8,   // proportion of models that ran
        risk_level:         level,
        summary:            raw.key_concerns?.[0] || `${level} overall risk — ${raw.models_available} models assessed`,
        prediction_id:      null,

        // SHAP tab
        shap_explanations: allFeatures.map(f => ({
          feature_name:   f.display_name || f.feature,
          display_name:   f.display_name,
          display_value:  String(f.value ?? ''),
          value:          f.value,
          shap_value:     f.shap_value,
          impact:         f.impact,
          pct:            f.pct,
          importance:     f.importance,
        })),

        // Components tab
        component_scores: components,

        // Concerns + actions tabs
        key_concerns:        raw.key_concerns || [],
        recommended_actions: raw.recommended_actions || [],

        // Metadata
        patient_id:   raw.patient_id,
        patient_name: raw.patient_name,
        assessed_at:  raw.assessed_at,
        models_available: raw.models_available,
        tasks: raw.tasks,
      };

      setRiskData(adapted);
      setShowRiskExplanation(true);
      toast.success('Risk assessment generated');
    } catch (e) {
      console.error('Risk assessment error:', e);
      toast.error('Failed to generate risk assessment. Please try again.');
    } finally {
      setLoadingRisk(false);
    }
  };

  const canUpdateStatus = user?.role === 'admin' || user?.role === 'clinician';
  const canAssignCaregiver = user?.role === 'admin' || user?.role === 'clinician';

  if (isLoading) {
    return (
      <PageTransition>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-0">
          <div className="animate-pulse space-y-4 pt-2">
            <div className="h-36 bg-slate-200 rounded-lg" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-40 bg-slate-200 rounded-lg" />)}
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error || !patient) {
    return (
      <PageTransition>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
          <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900 mb-1">Patient Not Found</h2>
            <p className="text-sm text-slate-500 mb-4">Unable to load patient information</p>
            <button onClick={() => navigate('/patients')}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors">
              Back to Patients
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const lastVital = vitals?.vitals?.[0];
  const activeMeds = medications?.medications?.filter(m => m.is_active)?.length || 0;

  const quickActions = [
    { image: '/resources/african/african-vitals.jpg',      icon: Activity,      title: 'Vitals',       description: 'Vital signs history',        onClick: () => navigate(`/patients/${patientId}/vitals`),      color: '#0d9488' },
    { image: '/resources/cards/card-symptoms.jpg',  icon: AlertCircle,   title: 'Symptoms',     description: 'Symptom log',                onClick: () => navigate(`/patients/${patientId}/symptoms`),    color: '#e11d48' },
    { image: '/resources/african/african-medications.jpg',icon: Pill,         title: 'Medications',  description: `${activeMeds} active`,        onClick: () => navigate(`/patients/${patientId}/medications`), color: '#be123c' },
    { image: '/resources/african/african-nurse-female.jpg',icon: ClipboardList,title: 'Assessments',  description: 'Clinical assessments',       onClick: () => navigate(`/assessments/${patientId}`),         color: '#7c3aed' },
    { image: '/resources/african/african-clinical-team.jpg', icon: FileText,      title: 'Care Plan',    description: 'Goals & interventions',      onClick: () => navigate(`/patients/${patientId}/care-plan`),  color: '#0369a1' },
    { image: '/resources/african/african-wellbeing.jpg',   icon: Heart,         title: 'Wellbeing',    description: 'ESAS assessments',           onClick: () => navigate(`/patients/${patientId}/wellbeing`),   color: '#9d174d' },
    { image: '/resources/african/african-appointment.jpg',icon: Calendar,    title: 'Appointments', description: 'Scheduled visits',           onClick: () => navigate(`/patients/${patientId}/appointments`),color: '#1d4ed8' },
    {
      image: '/resources/african/african-clinical-team.jpg',
      icon: MessageCircle,
      title: 'Message',
      description: patientUserData?.found ? `Chat with ${patient?.full_name?.split(' ')[0]}` : 'Contact patient',
      onClick: () => patientUserData?.user_id
        ? chatWith(patientUserData.user_id, `Hi ${patient?.full_name?.split(' ')[0]}, this is ${user?.full_name} from the care team.`)
        : navigate('/messages'),
      color: '#0f766e',
    },
  ];

  return (
    <PageTransition>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-0">
        <PageHeader
          image="/resources/headers/header-patient-detail.jpg"
          title={patient.full_name}
          subtitle={`${patient.age || 'N/A'} yrs · ${patient.primary_diagnosis || 'No diagnosis recorded'} · ${(patient.risk_level || 'Low')} Risk`}
          icon={User}
        >
          <div className="flex items-center gap-2">
            <span className={getStatusBadgeColor(patient.status)}>
              {patient.status || 'active'}
            </span>
            {canUpdateStatus && (
              <button onClick={() => { setSelectedStatus(patient.status || 'active'); setShowStatusModal(true); }}
                className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition" title="Update Status">
                <Edit2 size={13} className="text-white" />
              </button>
            )}
            <button onClick={explainRisk} disabled={loadingRisk}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl border border-white/30 text-xs font-bold transition disabled:opacity-50">
              <Brain size={13} /> {loadingRisk ? 'Analyzing...' : 'AI Risk'}
            </button>
            <button onClick={() => patientUserData?.user_id
                ? chatWith(patientUserData.user_id, `Hi ${patient?.full_name?.split(' ')[0]}, this is ${user?.full_name} from the care team.`)
                : navigate('/messages')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl border border-white/30 text-xs font-bold transition">
              <MessageCircle size={13} /> Message
            </button>
          </div>
        </PageHeader>

        {/* Care setting context banner — shows clinical guidance for staff */}
        {patient.care_setting && ['clinician','admin','caregiver'].includes(user?.role) && (
          <div className="mt-3">
            <CareSettingBanner setting={patient.care_setting} />
          </div>
        )}

        {/* Patient content */}
        <div className="flex flex-col gap-4">

            {/* Patient info strip */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-slate-200 shadow-sm px-5 py-3 flex items-center gap-6 flex-wrap text-sm overflow-hidden bg-white">
              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <User size={13} className="text-blue-600" />
                </div>
                <span className="font-semibold">{patient.age || 'N/A'} yrs · {patient.gender || 'N/A'}</span>
              </div>
              {patient.location && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin size={15} className="text-teal-600" />
                  <span>{patient.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className={`${
                  patient.risk_level === 'Crisis' ? 'badge-critical' :
                  patient.risk_level === 'High'   ? 'badge-high' :
                  patient.risk_level === 'Medium' ? 'badge-moderate' : 'badge-low'
                }`}>{patient.risk_level || 'Low'} Risk</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <FileText size={15} className="text-teal-600" />
                <span className="font-medium">{patient.primary_diagnosis}</span>
              </div>
              {/* Care setting pill */}
              {patient.care_setting && (() => {
                const cfg = SETTING_INFO[patient.care_setting];
                if (!cfg) return null;
                const Icon = cfg.icon;
                return (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                    <Icon size={11}/> {cfg.label}
                  </span>
                );
              })()}
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => navigate(`/assessments/${patientId}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition">
                  <ClipboardList size={13} /> Assessments
                </button>
                <button className="p-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition" title="Call">
                  <Phone size={15} className="text-slate-600" />
                </button>
                <button className="p-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition" title="Email">
                  <Mail size={15} className="text-slate-600" />
                </button>
              </div>
            </motion.div>

            {/* Vitals ribbon */}
            {lastVital && (
              <div className="flex items-center gap-2 flex-wrap bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Latest Vitals</span>
                {[
                  { label: 'HR',   value: lastVital.heart_rate ? `${Math.round(lastVital.heart_rate)} bpm` : '--',    ok: !lastVital.heart_rate || (lastVital.heart_rate >= 60 && lastVital.heart_rate <= 100) },
                  { label: 'SpO2', value: lastVital.oxygen_saturation ? `${lastVital.oxygen_saturation.toFixed(1)}%` : '--', ok: !lastVital.oxygen_saturation || lastVital.oxygen_saturation >= 95 },
                  { label: 'BP',   value: (lastVital.blood_pressure_sys || lastVital.blood_pressure_systolic)
                      ? `${Math.round(lastVital.blood_pressure_sys || lastVital.blood_pressure_systolic)}/${Math.round(lastVital.blood_pressure_dia || lastVital.blood_pressure_diastolic || 0)} mmHg`
                      : '--', ok: true },
                  { label: 'Temp', value: lastVital.temperature ? `${lastVital.temperature.toFixed(1)} C` : '--',     ok: !lastVital.temperature || (lastVital.temperature >= 36 && lastVital.temperature <= 38) },
                  { label: 'RR',   value: lastVital.respiratory_rate ? `${Math.round(lastVital.respiratory_rate)}/min` : '--', ok: !lastVital.respiratory_rate || (lastVital.respiratory_rate >= 12 && lastVital.respiratory_rate <= 20) },
                ].map(({ label, value, ok }) => (
                  <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${
                    ok ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-red-50 border-red-200 text-red-700 animate-pulse'
                  }`}>
                    <span className="text-slate-500 font-semibold">{label}</span>
                    <span className="tabular-nums font-black">{value}</span>
                    {!ok && <span className="ml-0.5 text-red-600 font-black">!</span>}
                  </div>
                ))}
                <span className="text-[10px] text-slate-400 ml-auto">
                  {new Date(lastVital.recorded_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}

            {/* ML Risk Summary Card — teaser widget */}
            <MLRiskSummaryCard patientId={patientId} />

            {/* Caregiver Assignment */}
            {canAssignCaregiver && caregiverMatches?.recommendations?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-purple-200 border-l-4 border-l-purple-500 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <HeartHandshake size={15} className="text-purple-600" />
                    Caregiver Assignment
                  </h3>
                  <button onClick={() => assignOptimalMutation.mutate()} disabled={assignOptimalMutation.isPending}
                    className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50">
                    AI Auto-Assign
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {caregiverMatches.recommendations.slice(0, 3).map((rec) => (
                    <div key={rec.caregiver_id}
                      className={`bg-white rounded-lg p-3 border-2 ${rec.already_assigned ? 'border-green-400 bg-green-50' : 'border-slate-200'}`}>
                      <p className="font-bold text-slate-900 text-sm">{rec.caregiver_name}</p>
                      <p className="text-xs text-slate-600 mb-2">Match: {rec.match_score}% · {rec.workload?.capacity_status}</p>
                      {rec.already_assigned
                        ? <span className="text-xs font-bold text-green-700">Currently Assigned</span>
                        : <button onClick={() => caregiverIntelligenceAPI.assign(patientId, { caregiver_id: rec.caregiver_id }).then(() => { toast.success('Caregiver assigned'); queryClient.invalidateQueries(['caregiver-matches', patientId]); })}
                            className="text-xs px-2 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition">Assign</button>
                      }
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quick Actions grid */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Stethoscope size={10}/> Clinical Tools
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {quickActions.map((c, i) => (
                  <motion.div key={c.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <ImageCard {...c} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

        {/* Risk Explanation Panel */}
        {showRiskExplanation && riskData && (
          <RiskExplanationPanel
            data={riskData}
            onClose={() => { setShowRiskExplanation(false); setRiskData(null); }}
          />
        )}

        {/* Status Update Modal */}
        {showStatusModal && (
          <ModalShell open={showStatusModal} onClose={() => setShowStatusModal(false)}
            title="Update Patient Status" accent="teal" size="sm"
            footer={
              <div className="flex gap-3">
                <button onClick={() => setShowStatusModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={() => statusMutation.mutate(selectedStatus)} disabled={statusMutation.isPending}
                  className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-50">
                  {statusMutation.isPending ? 'Saving...' : 'Update'}
                </button>
              </div>
            }>
            <div className="space-y-2">
              {['active','stable','deteriorating','critical','deceased','discharged'].map(s => (
                <button key={s} onClick={() => setSelectedStatus(s)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition capitalize ${
                    selectedStatus === s ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300'
                  }`}>
                  <span className={getStatusBadgeColor(s)}>{s}</span>
                </button>
              ))}
            </div>
          </ModalShell>
        )}
      </div>
    </PageTransition>
  );
}



