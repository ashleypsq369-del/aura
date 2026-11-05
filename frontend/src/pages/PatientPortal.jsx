/**
 * PatientPortal — My Space
 * Dashboard for patients: daily tasks, quick access, care journey, and wellbeing.
 */
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import usePersonalisation from '../hooks/usePersonalisation';
import { usePersonalisationFlags } from '../context/PersonalisationContext';
import {
  Heart, Calendar, Users, BookOpen, MessageCircle, Activity,
  Clock, Stethoscope, TrendingUp, TrendingDown, ArrowRight, MapPin,
  Pill, FileText, Brain, Globe, CheckCircle, Sparkles, Smile, Shield,
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
import ServicesWidget from '../components/ServicesWidget';
import { clinicalAssessmentsAPI, mlAPI } from '../api/client';
import { API_URL } from '../api/client';

function getTimeOfDay() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
}

/* ── Reusable card section header ──────────────────────────────────── */
function CardSection({ icon: Icon, iconColor = '#0d9488', title, action, children, noPad }) {
  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: iconColor + '18', color: iconColor }}>
            <Icon size={14} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-[var(--text-800)]">{title}</span>
        </div>
        {action}
      </div>
      <div className={noPad ? '' : 'p-4'}>{children}</div>
    </div>
  );
}

export default function PatientPortal() {
  const { user } = useAuth();
  const { signals, prefs } = usePersonalisation();
  const { uiFlags } = usePersonalisationFlags();
  const navigate = useNavigate();
  const { chatWithCareTeam } = useCareTeamChat();
  const { patientId } = usePatientId();
  const { isHidden: careSettingHidden } = useCareSettingContext();
  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    if (user?.role === 'family') navigate('/dashboard', { replace: true });
  }, [user?.role, navigate]);

  const { data: portalData, isLoading } = useQuery({
    queryKey: ['patient-portal', patientId],
    queryFn: async () => {
      const r = await axios.get(`${API_URL}/api/patient-portal/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return r.data;
    },
    enabled: !!user && !!patientId,
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

  if (isLoading) return (
    <div className="min-h-full p-6">
      <div className="max-w-7xl mx-auto space-y-4 animate-pulse">
        <div className="h-36 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-xl" />)}</div>
        <div className="h-48 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );

  if (!portalData || portalData.error) return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="bg-[var(--card-bg)] rounded-xl p-8 text-center max-w-sm border border-[var(--card-border)]">
        <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-teal-600" />
        </div>
        <h2 className="text-base font-bold text-[var(--text-800)] mb-2">Almost there!</h2>
        <p className="text-sm text-[var(--text-500)] mb-5">Your profile is being set up. Your care team will link your account shortly.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-700 text-white rounded-lg text-sm font-semibold hover:bg-teal-800 transition">
            Refresh
          </button>
          <button onClick={() => chatWithCareTeam()}
            className="px-4 py-2 bg-[var(--page-bg)] text-[var(--text-700)] rounded-lg text-sm font-semibold border border-[var(--card-border)] hover:bg-[var(--card-border)] transition">
            Message Care Team
          </button>
        </div>
      </div>
    </div>
  );

  const { patient, journey_phase, today_focus, care_team, recommended_resources, community_groups } = portalData;
  const firstName = (user?.full_name || user?.username || 'there').split(' ')[0];
  const timeOfDay = getTimeOfDay();
  const personalGreeting = (() => {
    if (!signals) return `Good ${timeOfDay}, ${firstName}`;
    const map = {
      pain: `${firstName}, let's focus on your comfort today`,
      emotional: `${firstName}, you're not alone in this`,
      spiritual: `${firstName}, peace and strength to you today`,
      family: `${firstName}, cherish every moment`,
      general: `Good ${timeOfDay}, ${firstName}`,
    };
    return map[signals.greetingContext] || map.general;
  })();

  const quickActions = [
    { image:'/resources/african/african-wellbeing.jpg',       icon:Heart,        title:'Log Feeling',    description:'Daily wellness check-in',   onClick:() => navigate('/wellness-checkin'),                                                   color:'#be123c', priority:'wellness-checkin' },
    { image:'/resources/cards/card-symptoms.jpg',              icon:Activity,     title:'My Symptoms',    description:'Track pain & symptoms',      onClick:() => patientId ? navigate(`/patients/${patientId}/symptoms`) : navigate('/my-space'), color:'#0f766e', priority:'wellness-checkin' },
    { image:'/resources/african/african-appointment.jpg',     icon:Calendar,     title:'Appointments',   description:'Upcoming care visits',       onClick:() => navigate('/appointments'),                                                        color:'#1d4ed8', priority:null },
    { image:'/resources/african/african-medications.jpg',     icon:Pill,         title:'Medications',    description:'My prescription schedule',   onClick:() => navigate('/medications'),                                                         color:'#7c3aed', priority:null },
    { image:'/resources/african/african-clinical-team.jpg',   icon:MessageCircle,title:'Message Team',   description:'Contact care team',          onClick:() => chatWithCareTeam(),                                                               color:'#0369a1', priority:'messages' },
    { image:'/resources/african/african-medical-reading.jpg', icon:BookOpen,     title:'Resources',      description:'Health guides & support',    onClick:() => navigate('/resources'),                                                           color:'#b45309', priority:null },
    { image:'/resources/african/african-community.jpg',       icon:Globe,        title:'Community',      description:'Peer support groups',        onClick:() => navigate('/community'),                                                           color:'#166534', priority:'community' },
    { image:'/resources/african/african-memory.jpg',          icon:Heart,        title:'Memory Vault',   description:'Preserve precious memories', onClick:() => navigate('/memory-vault'),                                                        color:'#4c1d95', priority:null },
    { image:'/resources/african/african-family-care.jpg',     icon:MapPin,       title:'My Journey',     description:'Care timeline',              onClick:() => navigate('/my-journey'),                                                          color:'#166534', priority:'journey' },
    { image:'/resources/african/african-clinical-team.jpg',   icon:FileText,     title:'Care Plan',      description:'Your care pathway',          onClick:() => patientId ? navigate(`/patients/${patientId}/care-plan`) : navigate('/my-space'), color:'#0369a1', priority:null },
    { image:'/resources/african/african-health-tech.jpg',     icon:Brain,        title:'AI Companion',   description:'Ask Aura AI',                onClick:() => window.dispatchEvent(new CustomEvent('aura:open')),                               color:'#7c3aed', priority:null },
    { image:'/resources/african/african-vitals.jpg',          icon:TrendingUp,   title:'My Records',     description:'Full health data',           onClick:() => patientId ? navigate(`/patients/${patientId}`) : navigate('/my-space'),           color:'#1d4ed8', priority:null },
    { image:'/resources/african/african-clinical-team.jpg',   icon:Shield,       title:'Family Sharing', description:'Privacy controls',           onClick:() => navigate('/settings', { state:{ tab:'privacy' } }),                               color:'#0f766e', priority:null },
  ].filter(a => {
    if (a.title === 'Community'   && !uiFlags.showCommunity) return false;
    if (a.title === 'Memory Vault'&& !uiFlags.showLegacy)    return false;
    if (a.title === 'AI Companion'&& !uiFlags.showAI)        return false;
    const seg = a.onClick?.toString().match(/navigate\(['"`]([^'"`]+)['"`]\)/)?.[1] || '';
    if (careSettingHidden(seg)) return false;
    return true;
  });

  const orderedActions = signals?.prioritisedActions?.length
    ? [
        ...quickActions.filter(a =>  signals.prioritisedActions.includes(a.priority)),
        ...quickActions.filter(a => !signals.prioritisedActions.includes(a.priority)),
      ]
    : quickActions;

  // ML level display helpers
  const mlLevel  = mlRisk?.overall_level || 'low';
  const mlLabels = { critical:'Needs Attention', high:'Monitor Closely', moderate:'Doing OK', low:'Feeling Good' };
  const mlColors = { critical:'#dc2626', high:'#ea580c', moderate:'#d97706', low:'#0d9488' };

  return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/cards/header-patient-dash.jpg"
        title={personalGreeting}
        subtitle={new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        icon={Sparkles}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-6">

        {/* Daily Tasks */}
        <SectionErrorBoundary name="Daily Tasks">
          <DailyTaskChecklist />
        </SectionErrorBoundary>

        {/* Quick Actions */}
        <section>
          <p className="text-xs font-bold text-[var(--text-400)] uppercase tracking-wider mb-3">Your Features</p>
          <SectionErrorBoundary name="Quick Actions">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {orderedActions.map((c, i) => (
                <ScrollReveal key={c.title} delay={i * 35} direction="up">
                  <ImageCard {...c} className="min-h-[110px]" />
                </ScrollReveal>
              ))}
            </div>
          </SectionErrorBoundary>
        </section>

        {/* Two-column main area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT col */}
          <div className="lg:col-span-2 space-y-4">

            {/* Journey Phase — compact strip, not a giant card */}
            {journey_phase && (
              <CardSection icon={MapPin} iconColor="#7c3aed" title="Your Care Journey"
                action={
                  <button onClick={() => navigate('/my-journey')}
                    className="text-xs font-semibold text-[var(--text-500)] hover:text-teal-600 flex items-center gap-1 transition-colors">
                    View timeline <ArrowRight size={11} />
                  </button>
                }>
                <div className="flex items-center gap-4">
                  {/* Phase steps — horizontal compact */}
                  <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto py-1">
                    {['Diagnosis','Care Planning','Active Monitoring','Escalation','Transition','Legacy'].map((name, idx) => {
                      const num = idx + 1;
                      const isActive = num === journey_phase.phase;
                      const isPast   = num < journey_phase.phase;
                      return (
                        <div key={name} className="flex items-center gap-1 flex-shrink-0">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                            isActive ? 'text-white border-transparent scale-110'
                            : isPast  ? 'text-white border-transparent'
                            : 'bg-[var(--page-bg)] text-[var(--text-400)] border-[var(--card-border)]'
                          }`}
                          style={isActive ? { background:'linear-gradient(135deg,#7c3aed,#4338ca)' }
                                : isPast  ? { background:'linear-gradient(135deg,#0d9488,#0891b2)' } : {}}>
                            {isPast ? <CheckCircle size={10} /> : num}
                          </div>
                          {idx < 5 && <div className={`w-4 h-0.5 ${num < journey_phase.phase ? 'bg-teal-400' : 'bg-[var(--card-border)]'}`} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--card-border)] flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-purple-600 mb-0.5">Phase {journey_phase.phase} · {journey_phase.name}</p>
                    <p className="text-sm text-[var(--text-600)] leading-relaxed">{journey_phase.description}</p>
                  </div>
                  {journey_phase.what_next && (
                    <div className="flex-shrink-0 max-w-[180px] px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-[10px] font-bold text-purple-500 mb-0.5">What's Next</p>
                      <p className="text-xs text-[var(--text-700)] leading-relaxed">{journey_phase.what_next}</p>
                    </div>
                  )}
                </div>
              </CardSection>
            )}

            {/* Today's Focus + Resources merged into one card with two sections */}
            {(today_focus || recommended_resources?.length > 0 || signals?.recommendedResources?.length > 0) && (
              <CardSection icon={Smile} iconColor="#e11d48" title="For You Today"
                action={
                  <button onClick={() => navigate('/resources')}
                    className="text-xs font-semibold text-[var(--text-500)] hover:text-teal-600 flex items-center gap-1 transition-colors">
                    All resources <ArrowRight size={11} />
                  </button>
                }
                noPad>
                <div>
                  {/* Personalized focus message */}
                  {signals?.todayFocusMessage && (
                    <div className="px-4 py-3 bg-rose-50 border-b border-[var(--card-border)] text-xs text-rose-800 leading-relaxed">
                      {signals.todayFocusMessage}
                    </div>
                  )}
                  {/* Today's focus */}
                  {today_focus && (
                    <div className="px-4 py-3 border-b border-[var(--card-border)]">
                      <p className="text-sm font-bold text-[var(--text-800)] mb-1">{today_focus.title}</p>
                      <p className="text-xs text-[var(--text-600)] leading-relaxed">{today_focus.content}</p>
                      {today_focus.action && (
                        <button onClick={() => navigate(today_focus.action_link)}
                          className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 text-white rounded-lg text-xs font-semibold hover:bg-teal-800 transition">
                          {today_focus.action} <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  )}
                  {/* Personalised recommendations */}
                  {signals?.recommendedResources?.slice(0,2).map((r, i) => (
                    <div key={`pers-${i}`} className="px-4 py-3 border-b border-[var(--card-border)] flex items-start gap-3">
                      <Sparkles size={13} className="text-purple-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-purple-600 mb-0.5">Picked for you</p>
                        <p className="text-xs font-semibold text-[var(--text-800)]">{r.title}</p>
                        <p className="text-[11px] text-[var(--text-500)] mt-0.5 line-clamp-2">{r.reason}</p>
                      </div>
                    </div>
                  ))}
                  {/* Portal resources */}
                  {recommended_resources?.slice(0,3).map(r => (
                    <button key={r.id} onClick={() => navigate('/resources')}
                      className="w-full text-left px-4 py-3 border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--page-bg)] transition-colors group flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-800)] group-hover:text-teal-700 transition-colors truncate">{r.title}</p>
                        <p className="text-[11px] text-[var(--text-400)] mt-0.5">
                          {r.format} · {r.category?.replace('_',' ')}
                        </p>
                      </div>
                      <ArrowRight size={13} className="text-[var(--text-300)] group-hover:text-teal-500 flex-shrink-0 ml-3" />
                    </button>
                  ))}
                </div>
              </CardSection>
            )}

            {/* Community — only if opted in */}
            {community_groups?.length > 0 && uiFlags.showCommunity !== false && (
              <CardSection icon={Users} iconColor="#1d4ed8" title="Connect with Others"
                action={
                  <button onClick={() => navigate('/community')}
                    className="text-xs font-semibold text-[var(--text-500)] hover:text-teal-600 transition-colors">
                    Browse all
                  </button>
                }
                noPad>
                <div className="divide-y divide-[var(--card-border)]">
                  {community_groups.slice(0,3).map(g => (
                    <button key={g.id} onClick={() => navigate('/community')}
                      className="w-full text-left px-4 py-3 hover:bg-[var(--page-bg)] transition-colors group flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-800)] group-hover:text-teal-700 transition-colors">{g.name}</p>
                        <p className="text-[11px] text-[var(--text-400)] mt-0.5">{g.member_count} members</p>
                      </div>
                      <ArrowRight size={13} className="text-[var(--text-300)] group-hover:text-teal-500 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </CardSection>
            )}
          </div>

          {/* RIGHT col */}
          <div className="space-y-4">

            {/* Care Team + Next Appointment in one card */}
            <CardSection icon={Users} iconColor="#059669" title="Your Care Team" noPad>
              <div className="divide-y divide-[var(--card-border)]">
                {care_team?.clinician && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {care_team.clinician.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--text-800)] truncate">{care_team.clinician.name}</p>
                      <p className="text-xs text-[var(--text-500)] flex items-center gap-1">
                        <Stethoscope size={10} /> {care_team.clinician.role}
                      </p>
                    </div>
                  </div>
                )}
                {care_team?.caregiver && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {care_team.caregiver.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--text-800)] truncate">{care_team.caregiver.name}</p>
                      <p className="text-xs text-[var(--text-500)]">Caregiver</p>
                    </div>
                  </div>
                )}
                {care_team?.next_appointment && (
                  <div className="px-4 py-3 bg-teal-50">
                    <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-1.5">Next Visit</p>
                    <p className="text-sm font-bold text-[var(--text-800)]">
                      {new Date(care_team.next_appointment.date).toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })}
                    </p>
                    <p className="text-xs text-[var(--text-500)] mt-0.5">
                      {care_team.next_appointment.type} with {care_team.next_appointment.with}
                    </p>
                    <p className="text-xs text-[var(--text-400)] flex items-center gap-1 mt-1">
                      <Clock size={10} />
                      {new Date(care_team.next_appointment.date).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
                    </p>
                  </div>
                )}
                <div className="px-4 py-3">
                  <button onClick={() => chatWithCareTeam()}
                    className="w-full py-2 rounded-lg border border-teal-300 text-teal-700 font-semibold text-xs hover:bg-teal-50 transition flex items-center justify-center gap-2">
                    <MessageCircle size={13} /> Message Care Team
                  </button>
                </div>
              </div>
            </CardSection>

            {/* Wellbeing snapshot — ESAS sparklines + AI health check */}
            <CardSection icon={Activity} iconColor="#e11d48" title="Wellbeing Snapshot" noPad>
              <div>
                {/* Wellbeing insight from personalisation */}
                {signals?.wellbeingInsight && (
                  <div className="px-4 py-3 bg-rose-50 border-b border-[var(--card-border)] text-xs text-rose-800 leading-relaxed">
                    <Sparkles size={11} className="inline text-rose-600 mr-1" />
                    {signals.wellbeingInsight}
                  </div>
                )}

                {/* ESAS sparklines — 2-col compact grid */}
                {esasTrends && esasTrends.count > 0 && (
                  <div className="px-4 py-3 border-b border-[var(--card-border)]">
                    <p className="text-[10px] font-bold text-[var(--text-400)] uppercase tracking-wider mb-2">
                      Symptom Trends · {esasTrends.period_days}d
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key:'pain',      label:'Pain',     color:'#e11d48'               },
                        { key:'tiredness', label:'Tiredness',color:'#7c3aed'               },
                        { key:'anxiety',   label:'Anxiety',  color:'#d97706'               },
                        { key:'wellbeing', label:'Wellbeing',color:'#059669', invert:true  },
                      ].map(({ key, label, color, invert }) => {
                        const vals = esasTrends.trends?.[key] || [];
                        if (!vals.length) return null;
                        const latest = vals[vals.length - 1];
                        const prev   = vals.length > 1 ? vals[vals.length - 2] : latest;
                        const delta  = latest - prev;
                        const worse  = invert ? delta < -0.5 : delta > 0.5;
                        const better = invert ? delta > 0.5  : delta < -0.5;
                        const w = 40; const h = 16;
                        const pts = vals.map((v, i) => {
                          const x = vals.length < 2 ? w/2 : (i / (vals.length-1)) * w;
                          const y = h - (v / 10) * h;
                          return `${x},${y}`;
                        }).join(' ');
                        return (
                          <div key={key} className="flex items-center gap-2 bg-[var(--page-bg)] rounded-lg border border-[var(--card-border)] px-2.5 py-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-[var(--text-400)]">{label}</p>
                              <p className="text-sm font-bold tabular-nums leading-none mt-0.5" style={{ color }}>{latest}/10</p>
                            </div>
                            <svg width={w} height={h} className="flex-shrink-0">
                              <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {worse  && <TrendingUp   size={11} className="text-red-500 flex-shrink-0" />}
                            {better && <TrendingDown size={11} className="text-green-500 flex-shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ML AI health card */}
                <AnimatePresence>
                  {mlRisk && mlRisk.overall_level !== 'unknown' && (
                    <motion.div key="ml" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                      className="px-4 py-3 border-b border-[var(--card-border)]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: mlColors[mlLevel] }} />
                        <p className="text-xs font-bold text-[var(--text-800)]">
                          Your Health: {mlLabels[mlLevel] || 'Feeling Good'}
                        </p>
                      </div>
                      {mlRisk.recommended_actions?.slice(0,1).map((a, i) => (
                        <p key={i} className="text-xs text-[var(--text-500)] mt-1 leading-relaxed">{a}</p>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quick links */}
                <div className="divide-y divide-[var(--card-border)]">
                  {[
                    { label:'Log how I feel today',    icon:Heart,      color:'#be123c', nav:'/wellness-checkin',                                                action:null },
                    { label:'View my pain scores',     icon:Activity,   color:'#f97316', nav:patientId ? `/patients/${patientId}` : '/my-space',                action:null },
                    { label:'My care plan',            icon:FileText,   color:'#0d9488', nav:patientId ? `/patients/${patientId}/care-plan` : '/my-space',      action:null },
                    { label:'Find a Care Professional',icon:Stethoscope,color:'#0d9488', nav:'/services',                                                        action:null },
                    { label:'Ask Aura AI',             icon:Brain,      color:'#7c3aed', nav:null, action:() => window.dispatchEvent(new CustomEvent('aura:open')) },
                  ].map(({ label, icon: Icon, color, nav, action }) => (
                    <button key={label} onClick={() => action ? action() : navigate(nav)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--page-bg)] transition text-left group">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: color + '18' }}>
                        <Icon size={13} style={{ color }} strokeWidth={2.5} />
                      </div>
                      <span className="text-xs font-semibold text-[var(--text-700)] group-hover:text-[var(--text-900)] flex-1">{label}</span>
                      <ArrowRight size={12} className="text-[var(--text-300)] group-hover:text-[var(--text-500)]" />
                    </button>
                  ))}
                </div>
              </div>
            </CardSection>

            {/* Services widget */}
            <SectionErrorBoundary>
              <ServicesWidget />
            </SectionErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
