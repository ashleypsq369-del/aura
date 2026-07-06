import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from '../utils/toast';
import { offlinePatientsAPI } from '../api/offlineClient';
import { motion } from 'framer-motion';
import {
  Activity, Pill, AlertCircle, FileText, Calendar,
  MessageCircle, Phone, Mail, User, MapPin, Heart,
  ClipboardList, Edit2, Brain, HeartHandshake,
  Stethoscope, BedDouble, ArrowRight
} from 'lucide-react';
import { caregiverIntelligenceAPI, careSettingsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import RiskExplanationPanel from '../components/RiskExplanationPanel';
import MLRiskPanel from '../components/MLRiskPanel';
import PageHeader from '../components/PageHeader';
import ImageCard from '../components/ImageCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function PatientDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
      const r = await axios.post(
        `${API_URL}/api/comprehensive-ai/comprehensive-risk/${patientId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRiskData(r.data);
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
    { image: '/resources/cards/pd-vitals.jpg',      icon: Activity,      title: 'Vitals',       description: 'Vital signs history',        onClick: () => navigate(`/patients/${patientId}/vitals`),      color: '#0d9488' },
    { image: '/resources/cards/card-symptoms.jpg',  icon: AlertCircle,   title: 'Symptoms',     description: 'Symptom log',                onClick: () => navigate(`/patients/${patientId}/symptoms`),    color: '#e11d48' },
    { image: '/resources/cards/card-medications.jpg',icon: Pill,         title: 'Medications',  description: `${activeMeds} active`,        onClick: () => navigate(`/patients/${patientId}/medications`), color: '#be123c' },
    { image: '/resources/cards/card-ai-insights.jpg',icon: ClipboardList,title: 'Assessments',  description: 'Clinical assessments',       onClick: () => navigate(`/assessments/${patientId}`),         color: '#7c3aed' },
    { image: '/resources/cards/card-care-plan.jpg', icon: FileText,      title: 'Care Plan',    description: 'Goals & interventions',      onClick: () => navigate(`/patients/${patientId}/care-plan`),  color: '#0369a1' },
    { image: '/resources/cards/card-checkin.jpg',   icon: Heart,         title: 'Wellbeing',    description: 'ESAS assessments',           onClick: () => navigate(`/patients/${patientId}/wellbeing`),   color: '#9d174d' },
    { image: '/resources/cards/card-appointments.jpg',icon: Calendar,    title: 'Appointments', description: 'Scheduled visits',           onClick: () => navigate(`/patients/${patientId}/appointments`),color: '#1d4ed8' },
    { image: '/resources/cards/card-messages.jpg',  icon: MessageCircle, title: 'Message',      description: 'Contact patient',            onClick: () => navigate(`/messages?patient=${patientId}`),    color: '#0f766e' },
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
            <button onClick={() => navigate(`/messages?patient=${patientId}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl border border-white/30 text-xs font-bold transition">
              <MessageCircle size={13} /> Message
            </button>
          </div>
        </PageHeader>

        {/* Patient info strip */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-slate-200 shadow-sm px-5 py-3 flex items-center gap-6 flex-wrap text-sm overflow-hidden bg-white mb-4">
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
          <div className="flex items-center gap-2 flex-wrap bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Latest Vitals</span>
            {[
              { label: 'HR',   value: lastVital.heart_rate ? `${Math.round(lastVital.heart_rate)} bpm` : '--',    ok: !lastVital.heart_rate || (lastVital.heart_rate >= 60 && lastVital.heart_rate <= 100) },
              { label: 'SpO₂', value: lastVital.oxygen_saturation ? `${lastVital.oxygen_saturation.toFixed(1)}%` : '--', ok: !lastVital.oxygen_saturation || lastVital.oxygen_saturation >= 95 },
              { label: 'BP',   value: lastVital.blood_pressure_sys ? `${Math.round(lastVital.blood_pressure_sys)}/${Math.round(lastVital.blood_pressure_dia || 0)}` : '--', ok: true },
              { label: 'Temp', value: lastVital.temperature ? `${lastVital.temperature.toFixed(1)}°C` : '--',     ok: !lastVital.temperature || (lastVital.temperature >= 36 && lastVital.temperature <= 38) },
            ].map(({ label, value, ok }) => (
              <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${
                ok ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-red-50 border-red-200 text-red-700 animate-pulse'
              }`}>
                <span>{label}</span>
                <span className="tabular-nums">{value}</span>
                {!ok && <span>!</span>}
              </div>
            ))}
            <span className="text-[10px] text-slate-400 ml-auto">
              {new Date(lastVital.recorded_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Caregiver Assignment */}
        {canAssignCaregiver && caregiverMatches?.recommendations?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-white rounded-lg border border-purple-200 border-l-4 border-l-purple-500 p-4">
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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {quickActions.map((c, i) => (
            <motion.div key={c.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <ImageCard {...c} />
            </motion.div>
          ))}
        </div>

        {/* ML Risk Panel */}
        <MLRiskPanel patientId={patientId} />

        {/* Risk Explanation Panel */}
        {showRiskExplanation && riskData && (
          <RiskExplanationPanel
            data={riskData}
            onClose={() => { setShowRiskExplanation(false); setRiskData(null); }}
          />
        )}

        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">Update Patient Status</h3>
              <div className="space-y-2 mb-6">
                {['active','stable','deteriorating','critical','deceased','discharged'].map(s => (
                  <button key={s} onClick={() => setSelectedStatus(s)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition capitalize ${
                      selectedStatus === s ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300'
                    }`}>
                    <span className={getStatusBadgeColor(s)}>{s}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowStatusModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={() => statusMutation.mutate(selectedStatus)} disabled={statusMutation.isPending}
                  className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-50">
                  {statusMutation.isPending ? 'Saving...' : 'Update'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
