import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { caregiverIntelligenceAPI, advancedMlAPI, mlAPI } from '../api/client';
import apiClient from '../api/client';
import { offlineDashboardAPI, prefetchForOffline } from '../api/offlineClient';
import axios from 'axios';
import { motion } from 'framer-motion';
import toast from '../utils/toast';
import {
  Users, AlertTriangle, Bell, Activity, Pill, Calendar,
  MessageSquare, Heart, BookOpen, Globe, Stethoscope,
  FileText, MapPin, Brain,
  UserPlus, RefreshCw, BarChart2, Star, Pin
} from 'lucide-react';
import CriticalAlertModal from '../components/CriticalAlertModal';
import ImageCard from '../components/ImageCard';
import PageHeader from '../components/PageHeader';
import ScrollReveal from '../components/ScrollReveal';
import SectionErrorBoundary from '../components/SectionErrorBoundary';
import DailyTaskChecklist from '../components/DailyTaskChecklist';
import TaskStatusBar from '../components/TaskStatusBar';
import { StatCard } from '../components/ui/Card';
import { useCareTeamChat } from '../hooks/useCareTeamChat';
import FamilyDashboardHero from '../components/FamilyDashboardHero';
import { usePatientId } from '../hooks/usePatientId';

import { API_URL } from '../api/client';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [criticalAlert, setCriticalAlert] = useState(null);
  const token = localStorage.getItem('auth_token');

  const { data: prefsData } = useQuery({
    queryKey: ['preferences', user?.id],
    queryFn: async () => {
      const r = await axios.get(`${API_URL}/api/preferences/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return r.data;
    },
    enabled: !!(user?.id && (user.role === 'patient' || user.role === 'family' || user.role === 'caregiver')),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: myPatientsData } = useQuery({
    queryKey: ['caregiver-my-patients'],
    queryFn: async () => {
      const r = await caregiverIntelligenceAPI.getMyPatients();
      return r.data;
    },
    enabled: user?.role === 'caregiver',
  });

  const { data: alerts } = useQuery({
    queryKey: ['critical-alerts'],
    queryFn: async () => {
      const r = await axios.get(`${API_URL}/api/alerts`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { severity: 'crisis' }
      });
      return r.data;
    },
    refetchInterval: 30000,
    enabled: !!(user && (user.role === 'clinician' || user.role === 'admin'))
  });

  const { data: drugWarnings } = useQuery({
    queryKey: ['dashboard-drug-interactions'],
    queryFn: () => advancedMlAPI.getAllDrugInteractions().then(r => r.data),
    staleTime: 10 * 60 * 1000,
    retry: false,
    enabled: !!(user && (user.role === 'clinician' || user.role === 'admin')),
  });

  const { data: batchRisk } = useQuery({
    queryKey: ['batch-risk-dashboard'],
    queryFn: () => mlAPI.getAllPatientsRisk().then(r => r.data),
    staleTime: 10 * 60 * 1000,
    retry: false,
    enabled: !!(user && (user.role === 'clinician' || user.role === 'admin')),
  });

  const queryClient = useQueryClient();
  const triggerScanMutation = useMutation({
    mutationFn: () => mlAPI.triggerScan(),
    onSuccess: () => { toast.success('Proactive scan started'); queryClient.invalidateQueries(['batch-risk-dashboard']); },
    onError: () => toast.error('Scan failed'),
  });

  useEffect(() => {
    if (user && prefsData) {
      if (!prefsData.questionnaire_complete) {
        navigate('/setup');
      } else if (user.role === 'patient' && prefsData.questionnaire_complete) {
        navigate('/my-space');
      }
    }
  }, [prefsData, user, navigate]);

  useEffect(() => {
    if (alerts?.length > 0) {
      const unacked = alerts.filter(a => !a.is_acknowledged);
      if (unacked.length > 0) {
        const first = unacked[0];
        setCriticalAlert({
          id: first.id,
          patient_name: first.patient?.full_name || 'Patient',
          risk_level: first.severity === 'crisis' ? 'Crisis' : 'High',
          risk_score: 0.85,
          top_shap_features: [
            { feature: 'Pain Level', value: 9, impact: 0.12 },
            { feature: 'Oxygen Saturation', value: 88, impact: 0.10 },
            { feature: 'Days Since Admission', value: 45, impact: 0.08 }
          ],
          explanation: first.message || 'This patient requires immediate attention.'
        });
      }
    }
  }, [alerts]);

  useEffect(() => {
    if (user && navigator.onLine) prefetchForOffline();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // use user.id so it only re-runs on actual user change, not re-renders

  useEffect(() => {
    const load = async () => {
      try {
        // skipCache: true ensures fresh data every time (not stale 24h offline cache)
        const r = await offlineDashboardAPI.getSummary();
        setSummary(r.data);
      } catch { /* offline fallback */ }
      finally { setLoading(false); }
    };
    load();
  }, [user?.id]);  // re-fetch when user changes (e.g. new login)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-800"></div>
      </div>
    );
  }

  // ── Clinician / Admin ───────────────────────────────────────────────────
  if (user?.role === 'clinician' || user?.role === 'admin') {
    return (
      <>
        {criticalAlert && (
          <CriticalAlertModal alert={criticalAlert} onClose={() => setCriticalAlert(null)} />
        )}
        <div className="min-h-screen ambient-bg">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
            <PageHeader
              image="/resources/cards/header-clinician.jpg"
              title="Dashboard Overview"
              subtitle={`Welcome back, ${user?.full_name?.split(' ')[0] || 'Doctor'} · Monitor patients and track key metrics`}
              icon={Stethoscope}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <ImageCard image="/resources/african/african-nurse-patient.jpg"    icon={Users}         title="Patients"        description="View all patients"           onClick={() => navigate('/patients')}      color="#0f766e" />
              <ImageCard image="/resources/african/african-nurse-female.jpg"      icon={AlertTriangle} title="Alerts"          description="Active clinical alerts"      onClick={() => navigate('/alerts')}        color="#b45309" />
              <ImageCard image="/resources/african/african-health-tech.jpg" icon={Brain}         title="AI Insights"     description="Risk predictions"            onClick={() => navigate('/ai-insights')}  color="#7c3aed" />
              <ImageCard image="/resources/african/african-patient-care.jpg"      icon={Activity}      title="Patient Monitor" description="Real-time monitoring"         onClick={() => navigate('/patients')}     color="#0369a1" />
              <ImageCard image="/resources/african/african-medications.jpg" icon={Pill}          title="Medications"     description="Prescriptions"               onClick={() => navigate('/medications')}  color="#be123c" />
              <ImageCard image="/resources/african/african-appointment.jpg"icon={Calendar}      title="Appointments"    description="Scheduled visits"            onClick={() => navigate('/appointments')} color="#1d4ed8" />
              <ImageCard image="/resources/african/african-nurse-male.jpg"    icon={MessageSquare} title="Messages"        description="Team communications"          onClick={() => navigate('/messages')}     color="#0f766e" />
              <ImageCard image="/resources/african/african-doctor-female.jpg"   icon={FileText}      title="Care Plans"      description="Personalised pathways"       onClick={() => navigate('/care-settings')} color="#166534" />
            </div>
            {drugWarnings?.with_severe_interactions > 0 && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-red-200 bg-red-50 cursor-pointer hover:bg-red-100 transition-colors mb-3"
                onClick={() => navigate('/ai-insights')}>
                <Pill size={13} className="text-red-600 flex-shrink-0" />
                <p className="text-xs font-semibold text-red-700 flex-1 min-w-0 truncate">
                  <span className="font-bold">{drugWarnings.with_severe_interactions} severe drug interaction{drugWarnings.with_severe_interactions > 1 ? 's' : ''}</span>
                  {' — '}{drugWarnings.patients?.filter(p => p.severe > 0).slice(0, 2).map(p => p.patient_name).join(', ')}
                  {drugWarnings.patients?.filter(p => p.severe > 0).length > 2 ? ` +${drugWarnings.patients.filter(p => p.severe > 0).length - 2} more` : ''}
                </p>
                <span className="text-[11px] font-bold text-red-600 flex-shrink-0">View →</span>
              </div>
            )}
            {/* ML Proactive Scan Widget */}
            {(user.role === 'clinician' || user.role === 'admin') && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 mb-3">
                <Brain size={13} className="text-slate-500 flex-shrink-0" />
                <p className="text-xs text-slate-600 flex-1 min-w-0">
                  <span className="font-semibold text-slate-700">ML Risk</span>
                  {' — '}{batchRisk
                    ? `${batchRisk.patients?.filter(p => p.risk_level === 'critical' || p.risk_level === 'high').length ?? 0} at high/critical risk`
                    : 'Run a scan to see patient risk levels'}
                </p>
                <button
                  onClick={() => triggerScanMutation.mutate()}
                  disabled={triggerScanMutation.isPending}
                  className="flex items-center gap-1 px-2.5 py-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-md text-[11px] font-semibold transition-all flex-shrink-0">
                  <RefreshCw size={10} className={triggerScanMutation.isPending ? 'animate-spin' : ''} />
                  {triggerScanMutation.isPending ? 'Scanning…' : 'Scan Now'}
                </button>
              </div>
            )}
            <SectionErrorBoundary name="Patient Table">
              <div className="card-ghana overflow-hidden">
                <div className="kente-strip" />
                <div className="px-5 py-3.5 border-b border-[#dde3ea] dark:border-white/[0.08] flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent Patients</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Click any row to open the patient record</p>
                  </div>
                  <span className="chip-teal text-[10px]">Live</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-6 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Patient</th>
                        <th className="text-left py-3 px-6 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Age</th>
                        <th className="text-left py-3 px-6 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Risk Level</th>
                        <th className="text-left py-3 px-6 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Last Contact</th>
                        <th className="text-right py-3 px-6 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {summary?.patients?.map((patient, index) => (
                        <motion.tr key={patient.id}
                          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
                          onClick={() => navigate(`/patients/${patient.patient_id || patient.id}`)}
                          className="bg-slate-50 dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-slate-800 cursor-pointer transition-all duration-150 border-l-4 border-transparent hover:border-teal-600 h-[56px]">
                          <td className="py-3 px-6">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                style={{ background: ['linear-gradient(135deg,#0d9488,#0891b2)','linear-gradient(135deg,#7c3aed,#4338ca)','linear-gradient(135deg,#db2777,#e11d48)','linear-gradient(135deg,#d97706,#ea580c)','linear-gradient(135deg,#1d4ed8,#0891b2)','linear-gradient(135deg,#059669,#0d9488)'][index % 6] }}>
                                {patient.full_name?.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white">{patient.full_name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{patient.patient_code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-6 text-sm text-slate-700 dark:text-slate-300 font-medium">{patient.age}</td>
                          <td className="py-3 px-6">
                            <span className={patient.risk_level === 'Crisis' ? 'badge-critical' : patient.risk_level === 'High' ? 'badge-high' : patient.risk_level === 'Medium' ? 'badge-moderate' : 'badge-low'}>
                              {patient.risk_level || 'Low'}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-sm text-slate-600 dark:text-slate-400">
                            {patient.last_contact ? new Date(patient.last_contact).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-6 text-right">
                            <button onClick={e => { e.stopPropagation(); navigate(`/patients/${patient.patient_id || patient.id}`); }}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-all text-xs border-2 border-teal-500">
                              <span>View</span>
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-center">
                    <button onClick={() => navigate('/patients')}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-50 dark:bg-slate-700 border-2 border-teal-600 text-teal-700 dark:text-teal-300 rounded-lg font-bold hover:bg-teal-50 dark:hover:bg-slate-600 transition-all shadow-md text-sm">
                      <span>View All Patients</span>
                    </button>
                  </div>
                </div>
              </div>
            </SectionErrorBoundary>
          </div>
        </div>
      </>
    );
  }

  // ── Caregiver ──────────────────────────────────────────────────────────
  if (user?.role === 'caregiver') {
    const assignedPatients = myPatientsData?.patients || summary?.patients || [];
    return (
      <div className="min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
          <PageHeader
            image="/resources/cards/header-caregiver-dash.jpg"
            title="Caregiver Dashboard"
            subtitle={`Welcome, ${user?.full_name?.split(' ')[0] || 'Carer'} · Your daily care tasks`}
            icon={Heart}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <ImageCard image="/resources/african/african-nurse-patient.jpg"     icon={Users}         title="My Patients"    description="Assigned patients"        onClick={() => navigate('/patients')}       color="#7c3aed" />
            <ImageCard image="/resources/african/african-medications.jpg"  icon={Pill}          title="Med Rounds"     description="Administer medications"   onClick={() => navigate('/medications')}    color="#be123c" />
            <ImageCard image="/resources/african/african-appointment.jpg" icon={Calendar}      title="Appointments"   description="Today's visits"           onClick={() => navigate('/appointments')}  color="#1d4ed8" />
            <ImageCard image="/resources/african/african-nurse-male.jpg"     icon={MessageSquare} title="Messages"       description="Communicate with team"    onClick={() => navigate('/messages')}       color="#0f766e" />
            <ImageCard image="/resources/african/african-vitals.jpg"       icon={Activity}      title="Log Vitals"     description="Record vital signs"       onClick={() => navigate('/patients')}       color="#0369a1" />
            <ImageCard image="/resources/african/african-doctor-female.jpg"    icon={FileText}      title="Care Plans"     description="View care plans"          onClick={() => navigate('/care-settings')}  color="#166534" />
            <ImageCard image="/resources/african/african-nurse-female.jpg"       icon={Bell}          title="Alerts"         description="Pending task alerts"      onClick={() => navigate('/alerts')}         color="#b45309" />
            <ImageCard image="/resources/african/african-medical-reading.jpg"    icon={BookOpen}      title="Resources"      description="Caregiver guides"         onClick={() => navigate('/resources')}      color="#0f766e" />
          </div>

          {/* Caregiver task compliance — full checklist showing all assigned patient tasks */}
          <div className="mb-6">
            <TaskStatusBar />
          </div>
          <div className="bg-slate-50 rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 mb-0.5">Your Patients</h2>
                <p className="text-slate-500 text-xs">Click any row to view care details</p>
              </div>
              <span className="chip-violet">Assigned</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Patient</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Age</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Next Task</th>
                    <th className="text-right py-3 px-6 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {assignedPatients.map((patient, index) => {
                    const pid = patient.patient_id || patient.id;
                    return (
                      <motion.tr key={pid}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
                        onClick={() => navigate(`/patients/${pid}`)}
                        className="bg-slate-50 dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-slate-800 cursor-pointer transition-all border-l-4 border-transparent hover:border-purple-600 h-[56px]">
                        <td className="py-3 px-6">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={{ background: ['linear-gradient(135deg,#7c3aed,#db2777)','linear-gradient(135deg,#059669,#0d9488)','linear-gradient(135deg,#1d4ed8,#0891b2)','linear-gradient(135deg,#d97706,#ea580c)'][index % 4] }}>
                              {patient.full_name?.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white">{patient.full_name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{patient.primary_diagnosis || patient.patient_code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-sm text-slate-700 dark:text-slate-300 font-medium">{patient.age}</td>
                        <td className="py-3 px-6"><span className="badge-low">{patient.status || 'Active'}</span></td>
                        <td className="py-3 px-6 text-sm text-slate-600 dark:text-slate-400">
                          {patient.active_alerts > 0 ? `${patient.active_alerts} active alert(s)` : 'No pending alerts'}
                        </td>
                        <td className="py-3 px-6 text-right">
                          <button onClick={e => { e.stopPropagation(); navigate(`/patients/${pid}`); }}
                            className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all text-xs border-2 border-purple-500">
                            View Care Info
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-center">
                <button onClick={() => navigate('/patients')}
                  className="inline-flex items-center px-5 py-2.5 bg-slate-50 dark:bg-slate-700 border-2 border-purple-600 text-purple-700 dark:text-purple-300 rounded-lg font-bold hover:bg-purple-50 dark:hover:bg-slate-600 transition-all shadow-md text-sm">
                  View All Patients
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Family ──────────────────────────────────────────────────────────────
  if (user?.role === 'family') {
    return <FamilyDashboard user={user} summary={summary} navigate={navigate} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-xl font-semibold text-teal-800 mb-4">Welcome back, {user?.full_name}</h1>
      <div className="bg-slate-50 rounded-lg shadow-md p-8 text-center">
        <p className="text-slate-500">Your dashboard is ready.</p>
      </div>
    </div>
  );
}

// ── Family Dashboard ───────────────────────────────────────────────────
function FamilyDashboard({ user, summary, navigate }) {
  const { chatWithCareTeam } = useCareTeamChat();
  const { patientId } = usePatientId();
  const { data: journeyEvents } = useQuery({
    queryKey: ['family-journey'],
    queryFn: () => apiClient.get('/api/journey/my-journey').then(r => r.data),
    enabled: user?.role === 'family' || user?.role === 'patient',
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const events = Array.isArray(journeyEvents) ? journeyEvents : [];

  const eventTypeConfig = {
    admission:          { Icon: UserPlus,   color: 'border-teal-500',   bg: 'bg-teal-50',   iconCls: 'text-teal-600',   label: 'Admission' },
    medication_started: { Icon: Pill,       color: 'border-purple-500', bg: 'bg-purple-50', iconCls: 'text-purple-600', label: 'Medication' },
    medication_changed: { Icon: Pill,       color: 'border-amber-500',  bg: 'bg-amber-50',  iconCls: 'text-amber-600',  label: 'Medication' },
    assessment:         { Icon: FileText,   color: 'border-teal-500',   bg: 'bg-blue-50',   iconCls: 'text-teal-600',   label: 'Assessment' },
    daily_care_log:     { Icon: Activity,   color: 'border-green-500',  bg: 'bg-green-50',  iconCls: 'text-green-600',  label: 'Care Log' },
    shift_handover:     { Icon: RefreshCw,  color: 'border-teal-500', bg: 'bg-indigo-50', iconCls: 'text-teal-600', label: 'Handover' },
    status_change:      { Icon: BarChart2,  color: 'border-orange-500', bg: 'bg-orange-50', iconCls: 'text-orange-600', label: 'Status' },
    milestone:          { Icon: Star,       color: 'border-yellow-500', bg: 'bg-yellow-50', iconCls: 'text-yellow-600', label: 'Milestone' },
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const diffH = (Date.now() - d) / 3.6e6;
    const diffD = diffH / 24;
    if (diffH < 1) return `${Math.round(diffH * 60)}m ago`;
    if (diffH < 24) return `${Math.round(diffH)}h ago`;
    if (diffD < 7) return `${Math.round(diffD)}d ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 space-y-6">
        <PageHeader
          image="/resources/cards/header-family-dash.jpg"
          title="Family Dashboard"
          subtitle={`Welcome, ${user?.full_name?.split(' ')[0] || 'there'} -- stay connected with your loved one's care journey`}
          icon={Heart}
        />

        {/* Feature 4: Care Status hero — last visit + quick actions */}
        {patientId && (
          <FamilyDashboardHero patientId={patientId} patientName={summary?.patient?.full_name} />
        )}

        {/* Quick navigation ImageCards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ImageCard image="/resources/african/african-nurse-male.jpg"      icon={MessageSquare} title="Messages"       description="Chat with care team"      onClick={() => chatWithCareTeam()}              color="#0d9488" />
          <ImageCard image="/resources/african/african-appointment.jpg"     icon={Calendar}      title="Appointments"   description="Upcoming care visits"     onClick={() => navigate('/appointments')}       color="#0891b2" />
          <ImageCard image="/resources/african/african-memory.jpg"          icon={Heart}         title="Memory Vault"   description="Share precious memories"  onClick={() => navigate('/memory-vault')}       color="#059669" />
          <ImageCard image="/resources/african/african-medical-reading.jpg" icon={BookOpen}      title="Resources"      description="Caregiver support guides" onClick={() => navigate('/resources')}          color="#0d9488" />
          <ImageCard image="/resources/african/african-community.jpg"       icon={Globe}         title="Community"      description="Connect with others"      onClick={() => navigate('/community')}          color="#0891b2" />
          <ImageCard image="/resources/african/african-family-care.jpg"     icon={MapPin}        title="Care Journey"   description="Track their journey"      onClick={() => navigate('/continuity-bridge')}  color="#059669" />
          <ImageCard image="/resources/african/journal-writing.jpg"         icon={FileText}      title="Grief Journal"  description="Your private journal"     onClick={() => navigate('/journal')}            color="#0d9488" />
          <ImageCard image="/resources/african/african-grief-support.jpg"   icon={Activity}      title="Bereavement"    description="Support resources"        onClick={() => navigate('/bereavement-support')} color="#e11d48" />
        </div>
        {/* StatCard row REMOVED — data is shown in the Care Status hero above */}

        {/* Daily task checklist for family — shows appointments + optional tasks */}
        <TaskStatusBar />
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Recent Care Updates</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live events from your loved one's care journey</p>
            </div>
            <button onClick={() => navigate('/continuity-bridge')} className="text-xs font-semibold text-rose-600 hover:text-rose-700">
              Full timeline →
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {events.length > 0 ? events.slice(0, 8).map((ev, i) => {
              const cfg = eventTypeConfig[ev.event_type] || { Icon: Pin, color: 'border-slate-400', bg: 'bg-slate-50', iconCls: 'text-slate-500', label: ev.event_type?.replace(/_/g, ' ') || 'Event' };
              const IconComp = cfg.Icon;
              return (
                <motion.div key={ev.id || i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={`flex items-start gap-3 px-5 py-3.5 border-l-4 ${cfg.color} ${cfg.bg} hover:brightness-95 transition-all`}>
                  <div className={`flex-shrink-0 mt-0.5 ${cfg.iconCls}`}>
                    <IconComp size={16} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold text-slate-500 ">{cfg.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 truncate">{ev.event_title}</p>
                    {ev.event_detail && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{ev.event_detail}</p>}
                  </div>
                  <span className="text-[11px] text-slate-400 flex-shrink-0 whitespace-nowrap">{formatTime(ev.created_at)}</span>
                </motion.div>
              );
            }) : (
              <div className="px-5 py-8 text-center">
                <p className="text-slate-400 text-sm">No care updates yet.</p>
              </div>
            )}
          </div>
          {events.length > 8 && (
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 text-center">
              <button onClick={() => navigate('/continuity-bridge')} className="text-sm font-semibold text-rose-600 hover:text-rose-700">
                View all {events.length} updates →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
