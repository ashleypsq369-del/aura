import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { caregiverIntelligenceAPI, advancedMlAPI } from '../api/client';
import apiClient from '../api/client';
import { offlineDashboardAPI, prefetchForOffline } from '../api/offlineClient';
import axios from 'axios';
import { motion } from 'framer-motion';
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
import { StatCard } from '../components/ui/Card';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
      const r = await axios.get(`${API_URL}/api/preferences/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return r.data;
    },
    enabled: !!(user && (user.role === 'patient' || user.role === 'family'))
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
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await offlineDashboardAPI.getSummary();
        setSummary(r.data);
      } catch { /* offline fallback */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

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
        <div className="min-h-screen">
          <div className="max-w-[1400px] mx-auto px-8 py-8">
            <PageHeader
              image="/resources/cards/header-clinician.jpg"
              title="Dashboard Overview"
              subtitle={`Welcome back, ${user?.full_name?.split(' ')[0] || 'Doctor'} · Monitor patients and track key metrics`}
              icon={Stethoscope}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <ImageCard image="/resources/cards/card-patients.jpg"    icon={Users}         title="Patients"        description="View all patients"           onClick={() => navigate('/patients')}      color="#0f766e" />
              <ImageCard image="/resources/cards/card-alerts.jpg"      icon={AlertTriangle} title="Alerts"          description="Active clinical alerts"      onClick={() => navigate('/alerts')}        color="#b45309" />
              <ImageCard image="/resources/cards/card-ai-insights.jpg" icon={Brain}         title="AI Insights"     description="Risk predictions"            onClick={() => navigate('/ai-insights')}  color="#7c3aed" />
              <ImageCard image="/resources/cards/card-vitals.jpg"      icon={Activity}      title="Patient Monitor" description="Real-time monitoring"         onClick={() => navigate('/patients')}     color="#0369a1" />
              <ImageCard image="/resources/cards/card-medications.jpg" icon={Pill}          title="Medications"     description="Prescriptions"               onClick={() => navigate('/medications')}  color="#be123c" />
              <ImageCard image="/resources/cards/card-appointments.jpg"icon={Calendar}      title="Appointments"    description="Scheduled visits"            onClick={() => navigate('/appointments')} color="#1d4ed8" />
              <ImageCard image="/resources/cards/card-messages.jpg"    icon={MessageSquare} title="Messages"        description="Team communications"          onClick={() => navigate('/messages')}     color="#0f766e" />
              <ImageCard image="/resources/cards/card-care-plan.jpg"   icon={FileText}      title="Care Plans"      description="Personalised pathways"       onClick={() => navigate('/care-settings')} color="#166534" />
            </div>
            <ScrollReveal delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Patients"  value={summary?.stats?.total_patients || 0}                  icon={Users}         variant="teal"  onClick={() => navigate('/patients')} />
                <StatCard label="High Risk"        value={summary?.stats?.high_risk_patients || 0}              icon={AlertTriangle} variant="red"   onClick={() => navigate('/ai-insights')} />
                <StatCard label="Active Alerts"    value={summary?.stats?.active_alerts || 0}                  icon={Bell}          variant="amber" onClick={() => navigate('/alerts')} />
                <StatCard label="Avg Pain Score"   value={summary?.stats?.avg_pain_score?.toFixed(1) || '0.0'} icon={Activity}      variant="green" onClick={() => navigate('/ai-insights')} />
              </div>
            </ScrollReveal>
            {drugWarnings?.with_severe_interactions > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-red-100 transition-colors mb-4"
                onClick={() => navigate('/ai-insights')}>
                <Pill size={16} className="text-red-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-800">
                    {drugWarnings.with_severe_interactions} patient{drugWarnings.with_severe_interactions > 1 ? 's' : ''} with SEVERE drug interactions
                  </p>
                  <p className="text-xs text-red-600">
                    {drugWarnings.patients?.filter(p => p.severe > 0).slice(0, 3).map(p => p.patient_name).join(', ')}
                    {drugWarnings.patients?.filter(p => p.severe > 0).length > 3 ? ` +${drugWarnings.patients.filter(p => p.severe > 0).length - 3} more` : ''}
                    {' -- pharmacist review required'}
                  </p>
                </div>
                <span className="text-xs font-bold text-red-600 flex-shrink-0">View</span>
              </div>
            )}
            <SectionErrorBoundary name="Patient Table">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 mb-0.5">Recent Patients</h2>
                    <p className="text-slate-500 text-xs">Click any row to open the patient record</p>
                  </div>
                  <span className="chip-teal">Live</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left py-3 px-6 text-sm font-bold text-slate-700 uppercase tracking-wide">Patient</th>
                        <th className="text-left py-3 px-6 text-sm font-bold text-slate-700 uppercase tracking-wide">Age</th>
                        <th className="text-left py-3 px-6 text-sm font-bold text-slate-700 uppercase tracking-wide">Risk Level</th>
                        <th className="text-left py-3 px-6 text-sm font-bold text-slate-700 uppercase tracking-wide">Last Contact</th>
                        <th className="text-right py-3 px-6 text-sm font-bold text-slate-700 uppercase tracking-wide">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summary?.patients?.map((patient, index) => (
                        <motion.tr key={patient.id}
                          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
                          onClick={() => navigate(`/patients/${patient.patient_id || patient.id}`)}
                          className="hover:bg-teal-50 cursor-pointer transition-all duration-150 border-l-4 border-transparent hover:border-teal-600 h-[56px]">
                          <td className="py-3 px-6">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                style={{ background: ['linear-gradient(135deg,#0d9488,#0891b2)','linear-gradient(135deg,#7c3aed,#4338ca)','linear-gradient(135deg,#db2777,#e11d48)','linear-gradient(135deg,#d97706,#ea580c)','linear-gradient(135deg,#1d4ed8,#0891b2)','linear-gradient(135deg,#059669,#0d9488)'][index % 6] }}>
                                {patient.full_name?.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">{patient.full_name}</div>
                                <div className="text-xs text-slate-600">{patient.patient_code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-6 text-sm text-slate-700 font-medium">{patient.age}</td>
                          <td className="py-3 px-6">
                            <span className={patient.risk_level === 'Crisis' ? 'badge-critical' : patient.risk_level === 'High' ? 'badge-high' : patient.risk_level === 'Medium' ? 'badge-moderate' : 'badge-low'}>
                              {patient.risk_level || 'Low'}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-sm text-slate-600">
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
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-center">
                    <button onClick={() => navigate('/patients')}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white border-2 border-teal-600 text-teal-700 rounded-lg font-bold hover:bg-teal-50 transition-all shadow-md text-sm">
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
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <PageHeader
            image="/resources/cards/header-caregiver-dash.jpg"
            title="Caregiver Dashboard"
            subtitle={`Welcome, ${user?.full_name?.split(' ')[0] || 'Carer'} · Your daily care tasks`}
            icon={Heart}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <ImageCard image="/resources/cards/card-patients.jpg"     icon={Users}         title="My Patients"    description="Assigned patients"        onClick={() => navigate('/patients')}       color="#7c3aed" />
            <ImageCard image="/resources/cards/card-medications.jpg"  icon={Pill}          title="Med Rounds"     description="Administer medications"   onClick={() => navigate('/medications')}    color="#be123c" />
            <ImageCard image="/resources/cards/card-appointments.jpg" icon={Calendar}      title="Appointments"   description="Today's visits"           onClick={() => navigate('/appointments')}  color="#1d4ed8" />
            <ImageCard image="/resources/cards/card-messages.jpg"     icon={MessageSquare} title="Messages"       description="Communicate with team"    onClick={() => navigate('/messages')}       color="#0f766e" />
            <ImageCard image="/resources/cards/card-vitals.jpg"       icon={Activity}      title="Log Vitals"     description="Record vital signs"       onClick={() => navigate('/patients')}       color="#0369a1" />
            <ImageCard image="/resources/cards/card-care-plan.jpg"    icon={FileText}      title="Care Plans"     description="View care plans"          onClick={() => navigate('/care-settings')}  color="#166534" />
            <ImageCard image="/resources/cards/card-alerts.jpg"       icon={Bell}          title="Alerts"         description="Pending task alerts"      onClick={() => navigate('/alerts')}         color="#b45309" />
            <ImageCard image="/resources/cards/card-resources.jpg"    icon={BookOpen}      title="Resources"      description="Caregiver guides"         onClick={() => navigate('/resources')}      color="#0f766e" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="My Patients"   value={assignedPatients.length || summary?.stats?.total_patients || 0} icon={Users}    variant="purple" onClick={() => navigate('/patients')} />
            <StatCard label="Med Rounds"    value={summary?.stats?.active_alerts || 0}                             icon={Pill}     variant="blue"   onClick={() => navigate('/medications')} />
            <StatCard label="Pending Tasks" value={summary?.stats?.high_risk_patients || 0}                        icon={Bell}     variant="amber"  onClick={() => navigate('/alerts')} />
            <StatCard label="Today Appts"   value={summary?.stats?.today_appointments || 0}                        icon={Calendar} variant="teal"   onClick={() => navigate('/appointments')} />
          </div>
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
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
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-6 text-sm font-bold text-slate-700 uppercase tracking-wide">Patient</th>
                    <th className="text-left py-3 px-6 text-sm font-bold text-slate-700 uppercase tracking-wide">Age</th>
                    <th className="text-left py-3 px-6 text-sm font-bold text-slate-700 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-bold text-slate-700 uppercase tracking-wide">Next Task</th>
                    <th className="text-right py-3 px-6 text-sm font-bold text-slate-700 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignedPatients.map((patient, index) => {
                    const pid = patient.patient_id || patient.id;
                    return (
                      <motion.tr key={pid}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
                        onClick={() => navigate(`/patients/${pid}`)}
                        className="hover:bg-purple-50 cursor-pointer transition-all border-l-4 border-transparent hover:border-purple-600 h-[56px]">
                        <td className="py-3 px-6">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={{ background: ['linear-gradient(135deg,#7c3aed,#db2777)','linear-gradient(135deg,#059669,#0d9488)','linear-gradient(135deg,#1d4ed8,#0891b2)','linear-gradient(135deg,#d97706,#ea580c)'][index % 4] }}>
                              {patient.full_name?.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">{patient.full_name}</div>
                              <div className="text-xs text-slate-600">{patient.primary_diagnosis || patient.patient_code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-sm text-slate-700 font-medium">{patient.age}</td>
                        <td className="py-3 px-6"><span className="badge-low">{patient.status || 'Active'}</span></td>
                        <td className="py-3 px-6 text-sm text-slate-600">
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
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-center">
                <button onClick={() => navigate('/patients')}
                  className="inline-flex items-center px-5 py-2.5 bg-white border-2 border-purple-600 text-purple-700 rounded-lg font-bold hover:bg-purple-50 transition-all shadow-md text-sm">
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
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-slate-500">Your dashboard is ready.</p>
      </div>
    </div>
  );
}

// ── Family Dashboard ───────────────────────────────────────────────────
function FamilyDashboard({ user, summary, navigate }) {
  const { data: journeyEvents } = useQuery({
    queryKey: ['family-journey'],
    queryFn: () => apiClient.get('/api/journey/my-journey').then(r => r.data),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const events = Array.isArray(journeyEvents) ? journeyEvents : [];

  const eventTypeConfig = {
    admission:          { Icon: UserPlus,   color: 'border-teal-500',   bg: 'bg-teal-50',   iconCls: 'text-teal-600',   label: 'Admission' },
    medication_started: { Icon: Pill,       color: 'border-purple-500', bg: 'bg-purple-50', iconCls: 'text-purple-600', label: 'Medication' },
    medication_changed: { Icon: Pill,       color: 'border-amber-500',  bg: 'bg-amber-50',  iconCls: 'text-amber-600',  label: 'Medication' },
    assessment:         { Icon: FileText,   color: 'border-blue-500',   bg: 'bg-blue-50',   iconCls: 'text-blue-600',   label: 'Assessment' },
    daily_care_log:     { Icon: Activity,   color: 'border-green-500',  bg: 'bg-green-50',  iconCls: 'text-green-600',  label: 'Care Log' },
    shift_handover:     { Icon: RefreshCw,  color: 'border-indigo-500', bg: 'bg-indigo-50', iconCls: 'text-indigo-600', label: 'Handover' },
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
      <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-6">
        <PageHeader
          image="/resources/cards/header-family-dash.jpg"
          title="Family Dashboard"
          subtitle={`Welcome, ${user?.full_name?.split(' ')[0] || 'there'} -- stay connected with your loved one's care journey`}
          icon={Heart}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ImageCard image="/resources/cards/card-messages.jpg"      icon={MessageSquare} title="Messages"       description="Chat with care team"      onClick={() => navigate('/messages')}           color="#be123c" />
          <ImageCard image="/resources/cards/card-memory-vault.jpg"  icon={Heart}         title="Memory Vault"   description="Share precious memories"  onClick={() => navigate('/memory-vault')}       color="#7c3aed" />
          <ImageCard image="/resources/cards/card-resources.jpg"     icon={BookOpen}      title="Resources"      description="Caregiver support guides" onClick={() => navigate('/resources')}          color="#1d4ed8" />
          <ImageCard image="/resources/cards/card-community.jpg"     icon={Globe}         title="Community"      description="Connect with others"      onClick={() => navigate('/community')}          color="#0f766e" />
          <ImageCard image="/resources/cards/card-appointments.jpg"  icon={Calendar}      title="Appointments"   description="Upcoming care visits"     onClick={() => navigate('/appointments')}       color="#0369a1" />
          <ImageCard image="/resources/cards/card-journey.jpg"       icon={MapPin}        title="Care Journey"   description="Track their journey"      onClick={() => navigate('/continuity-bridge')}  color="#166534" />
          <ImageCard image="/resources/cards/card-journal.jpg"       icon={FileText}      title="Grief Journal"  description="Your private journal"     onClick={() => navigate('/journal')}            color="#4c1d95" />
          <ImageCard image="/resources/cards/card-wellbeing.jpg"     icon={Activity}      title="Bereavement"    description="Support resources"        onClick={() => navigate('/bereavement-support')} color="#9f1239" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Care Updates"  value={events.length || summary?.stats?.recent_updates || 0}  icon={Heart}         variant="red"    onClick={() => navigate('/continuity-bridge')} />
          <StatCard label="Messages"      value={summary?.stats?.unread_messages ?? 0}                   icon={MessageSquare} variant="blue"   onClick={() => navigate('/messages')} />
          <StatCard label="Appointments"  value={summary?.stats?.upcoming_appointments ?? 0}             icon={Calendar}      variant="purple" onClick={() => navigate('/appointments')} />
          <StatCard label="Memories"      value={summary?.stats?.memory_count ?? 0}                     icon={Activity}      variant="teal"   onClick={() => navigate('/memory-vault')} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Recent Care Updates</h2>
              <p className="text-xs text-slate-500">Live events from your loved one's care journey</p>
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
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{cfg.label}</span>
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
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center">
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
