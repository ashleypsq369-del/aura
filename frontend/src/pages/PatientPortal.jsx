import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import usePersonalisation from '../hooks/usePersonalisation';
import { usePersonalisationFlags } from '../context/PersonalisationContext';
import {
 Heart, Calendar, Users, BookOpen, MessageCircle, Activity,
 Clock, Stethoscope, TrendingUp, ArrowRight, MapPin,
 Pill, FileText, Brain, Globe, CheckCircle, Sparkles, TrendingDown, Smile, Shield
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCareTeamChat } from '../hooks/useCareTeamChat';
import { usePatientId } from '../hooks/usePatientId';
import { useCareSettingContext } from '../context/CareSettingContext';
import DailyTaskChecklist from '../components/DailyTaskChecklist';
import ImageCard from '../components/ImageCard';
import PageHeader from '../components/PageHeader';
import ScrollReveal from '../components/ScrollReveal';
import SectionErrorBoundary from '../components/SectionErrorBoundary';
import Progress from '../components/ui/Progress';
import ServicesWidget from '../components/ServicesWidget';
import { clinicalAssessmentsAPI, mlAPI } from '../api/client';

import { API_URL } from '../api/client';

function getTimeOfDay() {
 const h = new Date().getHours();
 return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
}

// € Reusable white content card €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
function Section({ icon: Icon, iconColor = 'text-teal-600', iconBg = 'bg-teal-50', title, children, action, accentColor = '#0d9488' }) {
 return (
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] dark:border-slate-700 shadow-sm overflow-hidden"
 >
 <div className="px-5 py-3.5 border-b border-[var(--card-border)]/50 dark:border-slate-700 flex items-center justify-between"
 style={{ background: `linear-gradient(to right, ${accentColor}12, transparent)` }}>
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
 style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
 <Icon size={16} strokeWidth={2.5} />
 </div>
 <h2 className="font-bold text-[var(--text-800)] text-sm">{title}</h2>
 </div>
 {action}
 </div>
 <div className="p-5">{children}</div>
 </motion.div>
 );
}

export default function PatientPortal() {
 const { user } = useAuth();
 const { signals, prefs } = usePersonalisation();
 const { uiFlags, hiddenSections } = usePersonalisationFlags();
 const navigate = useNavigate();
 const { chatWithCareTeam } = useCareTeamChat();
 const { patientId } = usePatientId();
 const { isHidden: careSettingHidden, emphasis: careEmphasis } = useCareSettingContext();
 const token = localStorage.getItem('auth_token');

 // Family should use their own Family Dashboard, not the Patient Portal
 useEffect(() => {
 if (user?.role === 'family') {
 navigate('/dashboard', { replace: true });
 }
 }, [user?.role, navigate]);

 const { data: portalData, isLoading } = useQuery({
 queryKey: ['patient-portal', patientId],
 queryFn: async () => {
 const response = await axios.get(`${API_URL}/api/patient-portal/${patientId}`, {
 headers: { Authorization: `Bearer ${token}` }
 });
 return response.data;
 },
 enabled: !!user && !!patientId
 });

 const { data: esasTrends } = useQuery({
 queryKey: ['esas-trends-portal', patientId],
 queryFn: () => clinicalAssessmentsAPI.getESASTrends(patientId, 14).then(r => r.data),
 enabled: !!patientId && !isLoading && !!portalData && !portalData?.error,
 staleTime: 10 * 60 * 1000,
 retry: false,
 });

 const { data: mlRisk } = useQuery({
 queryKey: ['patient-ml-risk', patientId],
 queryFn: () => mlAPI.getPatientRisk(patientId).then(r => r.data),
 enabled: !!patientId && !isLoading && !!portalData && !portalData?.error,
 staleTime: 15 * 60 * 1000,
 retry: false,
 });

 // € Loading €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
 if (isLoading) {
 return (
 <div className="min-h-full p-6">
 <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
 <div className="h-36 bg-slate-200 rounded-2xl" />
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {[...Array(8)].map((_, i) => <div key={i} className="h-36 bg-slate-200 rounded-2xl" />)}
 </div>
 </div>
 </div>
 );
 }

 // € Error / no data €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
 if (!portalData || portalData.error) {
 return (
 <div className="min-h-full flex items-center justify-center p-6">
 <div className="bg-[var(--card-bg)] rounded-lg shadow-sm p-10 text-center max-w-md border border-slate-200">
 <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
 <Sparkles className="w-8 h-8 text-teal-600" />
 </div>
 <h2 className="text-base font-bold text-[var(--text-800)] mb-2">Almost there!</h2>
 <p className="text-[var(--text-500)] mb-2">Your profile is being set up. Your care team will link your account shortly.</p>
 <p className="text-sm text-slate-400">If you just completed your questionnaire, try refreshing the page.</p>
 <div className="flex gap-3 justify-center mt-6">
 <button onClick={() => window.location.reload()}
 data-tip="Refresh the page"
 className="px-5 py-2.5 bg-teal-700 text-white rounded-xl font-semibold text-sm hover:bg-teal-800 transition-all duration-150">
 Refresh
 </button>
 <button onClick={() => chatWithCareTeam()}
 data-tip="Message your care team"
 className="px-5 py-2.5 bg-slate-100 text-[var(--text-700)] rounded-xl font-semibold text-sm hover:bg-slate-200 transition-all duration-150">
 Message Care Team
 </button>
 </div>
 </div>
 </div>
 );
 }

 const { patient, journey_phase, today_focus, care_team, recommended_resources, community_groups } = portalData;
 const timeOfDay = getTimeOfDay();

 // ⚡ Personalised greeting based on questionnaire context
 const personalGreeting = (() => {
 if (!signals) return `Good ${timeOfDay}, ${(user?.full_name || user?.username || 'there').split(' ')[0]}`;
 const firstName = (user?.full_name || user?.username || 'there').split(' ')[0];
 const contextMsg = {
 pain: `${firstName}, let's focus on your comfort today`,
 emotional: `${firstName}, you're not alone in this`,
 spiritual: `${firstName}, peace and strength to you today`,
 family: `${firstName}, cherish every moment`,
 general: `Good ${timeOfDay}, ${firstName}`,
 };
 return contextMsg[signals.greetingContext] || contextMsg.general;
 })();

 // Quick-action cards definition
 const quickActions = [
 { image: '/resources/african/african-wellbeing.jpg', icon: Heart, title: 'Log Feeling', description: 'Daily wellness check-in', onClick: () => navigate('/wellness-checkin'), color: '#be123c', priority: 'wellness-checkin' },
 { image: '/resources/cards/card-symptoms.jpg', icon: Activity, title: 'My Symptoms', description: 'Track pain & symptoms', onClick: () => patientId ? navigate(`/patients/${patientId}/symptoms`) : navigate('/my-space'), color: '#0f766e', priority: 'wellness-checkin' },
 { image: '/resources/african/african-appointment.jpg', icon: Calendar, title: 'Appointments', description: 'Upcoming care visits', onClick: () => navigate('/appointments'), color: '#1d4ed8', priority: null },
 { image: '/resources/african/african-medications.jpg', icon: Pill, title: 'Medications', description: 'My prescription schedule', onClick: () => navigate('/medications'), color: '#7c3aed', priority: null },
 { image: '/resources/african/african-clinical-team.jpg', icon: MessageCircle, title: 'Message Team', description: 'Contact care team', onClick: () => chatWithCareTeam(), color: '#0369a1', priority: 'messages' },
 { image: '/resources/african/african-medical-reading.jpg', icon: BookOpen, title: 'Resources', description: 'Health guides & support', onClick: () => navigate('/resources'), color: '#b45309', priority: null },
 { image: '/resources/african/african-community.jpg', icon: Globe, title: 'Community', description: 'Peer support groups', onClick: () => navigate('/community'), color: '#166534', priority: 'community' },
 { image: '/resources/african/african-memory.jpg', icon: Heart, title: 'Memory Vault', description: 'Preserve precious memories', onClick: () => navigate('/memory-vault'), color: '#4c1d95', priority: null },
 { image: '/resources/african/african-family-care.jpg', icon: MapPin, title: 'My Journey', description: 'Care timeline', onClick: () => navigate('/my-journey'), color: '#166534', priority: 'journey' },
 { image: '/resources/african/african-clinical-team.jpg', icon: FileText, title: 'Care Plan', description: 'Your care pathway', onClick: () => patientId ? navigate(`/patients/${patientId}/care-plan`) : navigate('/my-space'), color: '#0369a1', priority: null },
 { image: '/resources/african/african-health-tech.jpg', icon: Brain, title: 'AI Companion', description: 'Ask Aura AI', onClick: () => window.dispatchEvent(new CustomEvent('aura:open')), color: '#7c3aed', priority: null },
 { image: '/resources/african/african-vitals.jpg', icon: TrendingUp, title: 'My Records', description: 'Full health data', onClick: () => patientId ? navigate(`/patients/${patientId}`) : navigate('/my-space'), color: '#1d4ed8', priority: null },
 { image: '/resources/african/african-clinical-team.jpg', icon: Shield, title: 'Family Sharing', description: 'Control what family can see', onClick: () => navigate('/settings', { state: { tab: 'privacy' } }), color: '#0f766e', priority: null },
 { image: '/resources/african/african-appointment.jpg', icon: Stethoscope, title: 'Care Pathway', description: 'Choose your care type', onClick: () => navigate('/care-pathway-selector'), color: '#0891b2', priority: null },
 ];

 // ⚡ Reorder quick actions based on personalisation signals
 // Filter: questionnaire opt-outs + care setting gates
 const filteredActions = quickActions.filter(a => {
 if (a.title === 'Community' && !uiFlags.showCommunity) return false;
 if (a.title === 'Memory Vault' && !uiFlags.showLegacy) return false;
 if (a.title === 'AI Companion' && !uiFlags.showAI) return false;
 // Care setting: hide irrelevant features
 const routeSegment = a.onClick?.toString().match(/navigate\(['"`]([^'"`]+)['"`]\)/)?.[1] || '';
 if (careSettingHidden(routeSegment)) return false;
 return true;
 });

 const orderedActions = signals?.prioritisedActions?.length
 ? [
 ...filteredActions.filter(a => signals.prioritisedActions.includes(a.priority)),
 ...filteredActions.filter(a => !signals.prioritisedActions.includes(a.priority)),
 ]
 : filteredActions;

 return (
 <div className="min-h-full">
 {/* Hero header with personalised greeting */}
 <PageHeader
 image="/resources/cards/header-patient-dash.jpg"
 title={personalGreeting}
 subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
 icon={Sparkles}
 />

 <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">

 {/* § Daily Task Checklist - compulsory + optional care tasks */}
 <SectionErrorBoundary name="Daily Tasks">
 <DailyTaskChecklist />
 </SectionErrorBoundary>

 {/* € Section 1: Quick Actions (all 12 features) € */}
 <div>
 <h3 className="text-xs font-bold text-[var(--text-400)] mb-3 pl-1">Your Features</h3>
 <SectionErrorBoundary name="Quick Actions">
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
 {orderedActions.map((c, i) => (
 <ScrollReveal key={c.title} delay={i * 40} direction="up">
 <ImageCard {...c} className="min-h-[120px]" />
 </ScrollReveal>
 ))}
 </div>
 </SectionErrorBoundary>
 </div>

 {/* € Main 2-column layout € */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

 {/* LEFT: Journey + Today's Focus + Resources + Community */}
 <div className="lg:col-span-2 space-y-5">

 {/* Journey Phase */}
 {journey_phase && (
 <Section icon={MapPin} title="Your Care Journey" accentColor="#7c3aed">
 <div className="flex gap-4 flex-wrap">
 {/* Current phase highlight */}
 <div className="flex-1 min-w-[200px] p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200">
 <p className="text-xs font-bold text-purple-600 mb-1">Current Phase</p>
 <h3 className="text-lg font-serif font-bold text-[var(--text-800)] mb-1">{journey_phase.name}</h3>
 <p className="text-sm text-[var(--text-600)] leading-relaxed">{journey_phase.description}</p>
 {/* Phase progress bar */}
 <div className="mt-3">
 <Progress
 value={journey_phase.phase || 1}
 max={6}
 label={`Phase ${journey_phase.phase || 1} of 6`}
 showValue={false}
 variant="purple"
 size="md"
 />
 </div>
 {journey_phase.what_next && (
 <div className="mt-3 p-3 bg-white/80 rounded-lg border border-purple-100">
 <p className="text-xs font-semibold text-[var(--text-500)] mb-0.5">What's Next</p>
 <p className="text-sm text-slate-700">{journey_phase.what_next}</p>
 </div>
 )}
 </div>

 {/* Phase steps */}
 <div className="flex flex-col gap-1.5 justify-center">
 {['Diagnosis', 'Care Planning', 'Active Monitoring', 'Escalation', 'Transition', 'Legacy'].map((name, idx) => {
 const num = idx + 1;
 const isActive = num === journey_phase.phase;
 const isPast = num < journey_phase.phase;
 return (
 <div key={name} className="flex items-center gap-2">
 <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm transition-all ${
 isActive ? 'text-white scale-110' : isPast ? 'text-white' : 'bg-[var(--card-bg)] text-slate-300 border-slate-200'
 }`}
 style={isActive ? { background: 'linear-gradient(135deg,#7c3aed,#4338ca)' } :
 isPast ? { background: 'linear-gradient(135deg,#0d9488,#0891b2)' } : {}}>
 {isPast ? <CheckCircle size={12} /> : num}
 </div>
 <span className={`text-sm ${isActive ? 'font-bold text-slate-800' : isPast ? 'text-slate-500' : 'text-slate-400'}`}>{name}</span>
 </div>
 );
 })}
 </div>
 </div>
 </Section>
 )}

 {/* My Care Today - Personalized greeting */}
 <Section icon={Smile} iconColor="text-rose-500" iconBg="bg-rose-50" title="My Care Today" accentColor="#e11d48">
 {signals?.todayFocusMessage && (
 <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-900 leading-relaxed">
 <p className="font-medium">{signals.todayFocusMessage}</p>
 </div>
 )}
 {today_focus && (
 <>
 <h4 className="font-serif font-bold text-lg text-[var(--text-800)] mb-2">{today_focus.title}</h4>
 <p className="text-[var(--text-600)] leading-relaxed text-sm mb-4">{today_focus.content}</p>
 {today_focus.action && (
 <button onClick={() => navigate(today_focus.action_link)}
 data-tip={today_focus.action}
 className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 text-white rounded-xl font-semibold text-sm hover:bg-teal-800 transition-all duration-150 shadow-sm">
 {today_focus.action} <ArrowRight size={16} />
 </button>
 )}
 </>
 )}
 </Section>

 {/* Recommended Resources - Personalized */}
 {(recommended_resources?.length > 0 || signals?.recommendedResources?.length > 0) && (
 <Section icon={BookOpen} title="For You Today" accentColor="#d97706"
 action={
 <button onClick={() => navigate('/resources')} data-tip="See all resources" className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1">
 View all <ArrowRight size={12} />
 </button>
 }>
 <div className="space-y-3">
 {/* Show personalized resources first, then portal recommended */}
 {signals?.recommendedResources?.slice(0, 2).map((resource, idx) => (
 <div key={`pers-${idx}`} className="p-3.5 rounded-xl border-2 border-purple-200 bg-purple-50/50">
 <div className="flex items-start justify-between gap-3">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <Sparkles size={12} className="text-purple-600 flex-shrink-0" />
 <span className="text-[10px] font-bold text-purple-600 ">Picked for you</span>
 </div>
 <h5 className="font-semibold text-sm text-slate-800">{resource.title}</h5>
 <p className="text-xs text-[var(--text-600)] mt-0.5 line-clamp-2">{resource.reason}</p>
 </div>
 </div>
 </div>
 ))}
 {recommended_resources?.slice(0, 3).map(resource => (
 <button key={resource.id} onClick={() => navigate('/resources')}
 data-tip="Open this resource"
 className="w-full text-left p-3.5 rounded-xl border border-[var(--card-border)] hover:border-teal-400 hover:bg-teal-50/50 transition-all group">
 <div className="flex items-start justify-between gap-3">
 <div className="flex-1 min-w-0">
 <h5 className="font-semibold text-sm text-[var(--text-800)] group-hover:text-teal-700 truncate">{resource.title}</h5>
 <p className="text-xs text-[var(--text-500)] mt-0.5 line-clamp-1">{resource.summary}</p>
 <div className="flex items-center gap-2 mt-1.5">
 <span className="text-[10px] font-bold text-[var(--text-400)] uppercase">{resource.format}</span>
 <span className="text-slate-300">·</span>
 <span className="text-[10px] text-[var(--text-400)] capitalize">{resource.category?.replace('_', ' ')}</span>
 </div>
 </div>
 <ArrowRight size={14} className="text-slate-300 group-hover:text-teal-500 flex-shrink-0 mt-1" />
 </div>
 </button>
 ))}
 </div>
 </Section>
 )}

 {/* Community Groups - only if user opted in */}
 {community_groups?.length > 0 && uiFlags.showCommunity !== false && (
 <Section icon={Users} title="Connect with Others" accentColor="#1d4ed8">
 <div className="space-y-2.5">
 {community_groups.slice(0, 3).map(group => (
 <button key={group.id} onClick={() => navigate('/community')}
 data-tip="Join this community group"
 className="w-full text-left p-3.5 rounded-xl border border-[var(--card-border)] hover:border-teal-400 hover:bg-blue-50/50 transition-all group flex items-center justify-between">
 <div>
 <h5 className="font-semibold text-sm text-[var(--text-800)] group-hover:text-teal-700">{group.name}</h5>
 <p className="text-xs text-[var(--text-400)] mt-0.5">{group.member_count} members</p>
 </div>
 <ArrowRight size={14} className="text-slate-300 group-hover:text-teal-500" />
 </button>
 ))}
 </div>
 </Section>
 )}
 </div>

 {/* RIGHT: Care Team + Next Appointment */}
 <div className="space-y-5">

 {/* Care Team */}
 <Section icon={Users} title="Your Care Team" accentColor="#059669">
 <div className="space-y-4">
 {care_team?.clinician && (
 <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card-bg)] border border-slate-100">
 <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-base shadow-sm flex-shrink-0">
 {care_team.clinician.name[0]}
 </div>
 <div className="min-w-0">
 <p className="font-semibold text-[var(--text-800)] text-sm truncate">{care_team.clinician.name}</p>
 <p className="text-xs text-[var(--text-500)] flex items-center gap-1 mt-0.5">
 <Stethoscope size={11} /> {care_team.clinician.role}
 </p>
 </div>
 </div>
 )}
 {care_team?.caregiver && (
 <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card-bg)] border border-slate-100">
 <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-base shadow-sm flex-shrink-0">
 {care_team.caregiver.name[0]}
 </div>
 <div className="min-w-0">
 <p className="font-semibold text-[var(--text-800)] text-sm truncate">{care_team.caregiver.name}</p>
 <p className="text-xs text-[var(--text-500)] mt-0.5">Caregiver</p>
 </div>
 </div>
 )}

 {/* Next appointment */}
 {care_team?.next_appointment && (
 <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-200 mt-1">
 <div className="flex items-center gap-2 text-teal-700 mb-2">
 <Calendar size={15} />
 <span className="text-xs font-bold uppercase tracking-wide">Next Visit</span>
 </div>
 <p className="font-bold text-[var(--text-800)] text-sm">
 {new Date(care_team.next_appointment.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
 </p>
 <p className="text-sm text-[var(--text-600)] mt-0.5">
 {care_team.next_appointment.type} with {care_team.next_appointment.with}
 </p>
 <p className="text-xs text-[var(--text-400)] flex items-center gap-1 mt-1.5">
 <Clock size={11} />
 {new Date(care_team.next_appointment.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
 </p>
 </div>
 )}

 <button onClick={() => chatWithCareTeam()}
 data-tip="Message your care team"
 className="w-full py-2.5 rounded-xl border border-teal-300 text-teal-700 font-semibold text-sm hover:bg-teal-50 transition-all duration-150 flex items-center justify-center gap-2">
 <MessageCircle size={15} /> Message Care Team
 </button>
 </div>
 </Section>

 {/* Wellbeing snapshot */}
 <Section icon={Activity} title="Wellbeing Snapshot" iconColor="text-rose-600" iconBg="bg-rose-50" accentColor="#e11d48">
 {/* Personalized wellbeing insight */}
 {signals?.wellbeingInsight && (
 <div className="mb-4 px-4 py-3 bg-gradient-to-r from-rose-50 to-purple-50 border border-rose-200 rounded-xl text-sm leading-relaxed">
 <div className="flex items-center gap-2 mb-1">
 <Sparkles size={13} className="text-rose-600" />
 <span className="font-bold text-rose-900">Your Wellbeing</span>
 </div>
 <p className="text-slate-700">{signals.wellbeingInsight}</p>
 </div>
 )}
 {/* ESAS mini-trend if data available */}
 {esasTrends && esasTrends.count > 0 && (
 <div className="mb-4 p-3 bg-[var(--card-bg)] rounded-xl border border-slate-200">
 <div className="flex items-center justify-between mb-2">
 <p className="text-[11px] font-bold text-[var(--text-500)] ">
 Symptom Trends -- Last {esasTrends.period_days} days
 </p>
 <span className="text-[10px] text-slate-400">{esasTrends.count} check-in{esasTrends.count !== 1 ? 's' : ''}</span>
 </div>
 <div className="grid grid-cols-2 gap-2">
 {[
 { key: 'pain', label: 'Pain', color: '#e11d48' },
 { key: 'tiredness', label: 'Tiredness', color: '#7c3aed' },
 { key: 'anxiety', label: 'Anxiety', color: '#d97706' },
 { key: 'wellbeing', label: 'Wellbeing', color: '#059669', invert: true },
 ].map(({ key, label, color, invert }) => {
 const vals = esasTrends.trends?.[key] || [];
 if (!vals.length) return null;
 const latest = vals[vals.length - 1];
 const prev = vals.length > 1 ? vals[vals.length - 2] : latest;
 const delta = latest - prev;
 const worse = invert ? delta < -0.5 : delta > 0.5;
 const better = invert ? delta > 0.5 : delta < -0.5;
 // Mini SVG sparkline
 const max = Math.max(...vals, 1);
 const w = 48; const h = 18;
 const pts = vals.map((v, i) => {
 const x = vals.length < 2 ? w/2 : (i / (vals.length - 1)) * w;
 const y = h - (v / 10) * h;
 return `${x},${y}`;
 }).join(' ');
 return (
 <div key={key} className="flex items-center gap-2 bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)]/50 px-2.5 py-2">
 <div className="flex-1 min-w-0">
 <p className="text-[10px] text-slate-500">{label}</p>
 <p className="text-sm font-bold tabular-nums" style={{ color }}>
 {latest}/10
 </p>
 </div>
 <svg width={w} height={h} className="flex-shrink-0">
 <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
 </svg>
 {worse && <TrendingUp size={13} className="text-red-500 flex-shrink-0" />}
 {better && <TrendingDown size={13} className="text-green-500 flex-shrink-0" />}
 </div>
 );
 })}
 </div>
 </div>
 )}
 <div className="space-y-2.5">
 {/* ML AI Health Check card */}
 <AnimatePresence>
 {mlRisk && mlRisk.overall_level !== 'unknown' && (() => {
 const levelMap = { critical: 'Needs Attention', high: 'Monitor Closely', moderate: 'Doing OK', low: 'Feeling Good' };
 const colorMap = {
 critical: 'border-red-300 bg-red-50 text-red-700',
 high: 'border-orange-300 bg-orange-50 text-orange-700',
 moderate: 'border-amber-300 bg-amber-50 text-amber-700',
 low: 'border-teal-300 bg-teal-50 text-teal-700',
 };
 const dotMap = { critical: 'bg-red-500', high: 'bg-orange-500', moderate: 'bg-amber-500', low: 'bg-teal-500' };
 const level = mlRisk.overall_level || 'low';
 return (
 <motion.div key="ml-health-card"
 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
 className={`rounded-xl border-2 p-3.5 ${colorMap[level] || colorMap.low}`}>
 <div className="flex items-center gap-2 mb-2">
 <Brain size={15} className="text-teal-600 flex-shrink-0" />
 <span className="text-[10px] font-bold text-teal-700">AI Health Check</span>
 </div>
 <div className="flex items-center gap-2 mb-2">
 <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotMap[level] || dotMap.low}`} />
 <span className="font-bold text-sm text-slate-800">Your Health Status: {levelMap[level] || 'Feeling Good'}</span>
 </div>
 {mlRisk.recommended_actions?.slice(0, 2).map((action, i) => (
 <div key={i} className="flex items-start gap-1.5 mt-1">
 <span className="text-teal-600 font-bold text-xs flex-shrink-0 mt-0.5">•</span>
 <p className="text-xs text-slate-700">{action}</p>
 </div>
 ))}
 </motion.div>
 );
 })()}
 </AnimatePresence>
 {[
 { label: 'Log how I feel today', icon: Heart, color: 'bg-rose-500', nav: '/wellness-checkin', action: null },
 { label: 'View my pain scores', icon: Activity, color: 'bg-orange-500', nav: patientId ? `/patients/${patientId}` : '/my-space', action: null },
 { label: 'My care plan', icon: FileText, color: 'bg-teal-600', nav: patientId ? `/patients/${patientId}/care-plan` : '/my-space', action: null },
 { label: 'Find a Care Professional', icon: Stethoscope, color: 'bg-teal-700', nav: '/services', action: null },
 { label: 'Ask Aura AI', icon: Brain, color: 'bg-purple-600', nav: null, action: () => window.dispatchEvent(new CustomEvent('aura:open')) },
 ].map(({ label, icon: Icon, color, nav, action }) => (
 <button key={label} onClick={() => action ? action() : navigate(nav)}
 data-tip={label}
 className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--card-bg)] border border-transparent hover:border-[var(--card-border)] transition-all duration-150 group text-left">
 <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
 <Icon size={15} className="text-white" strokeWidth={2.5} />
 </div>
 <span className="text-sm font-medium text-[var(--text-700)] group-hover:text-slate-900">{label}</span>
 <ArrowRight size={13} className="ml-auto text-slate-300 group-hover:text-slate-500" />
 </button>
 ))}
 </div>
 </Section>

 {/* ── Services Widget ── */}
 <SectionErrorBoundary>
 <ServicesWidget />
 </SectionErrorBoundary>

 </div>
 </div>
 </div>
 </div>
 );
}

