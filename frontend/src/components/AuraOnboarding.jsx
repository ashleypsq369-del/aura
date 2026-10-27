/**
 * AuraOnboarding.jsx — Spotlight-style guided tour
 *
 * Design: Shows a small floating avatar card bottom-right while navigating
 * the user through each page. NO full-screen blur overlay — instead navigates
 * to each page so the user actually SEES it while Aura explains it.
 *
 * Step flow:
 *  1. Navigate to the step's path (if any)
 *  2. Show a small floating card (avatar + title + body + Next button)
 *  3. On "Next", save step to sessionStorage, navigate to next page
 *
 * This way the user experiences each page live, not behind a blur.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuraMascot from './AuraMascot';
import { X, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';

/* ── Role-specific tour steps — covers EVERY sidebar page ─────────────────── */
const TOURS = {
  clinician: [
    { pose:'heart',       path: null,                 title:"Hi, I'm Aura! 👋",           body:"I'll show you every section of the system. Let's visit each page together — it only takes 2 minutes." },
    { pose:'compass',     path: '/dashboard',         title:"Dashboard",                   body:"Your command centre. See today's patient load, active alerts, AI risk scores, and appointments at a glance." },
    { pose:'stethoscope', path: '/patients',          title:"Patients",                    body:"All your patients. Click any row to see vitals, AI risk score, medications, and full care history." },
    { pose:'phone',       path: '/messages',          title:"Messages",                    body:"Communicate with patients, families, and the care team. Timely replies are part of great care." },
    { pose:'think',       path: '/ai-insights',       title:"AI Insights",                 body:"ML risk predictions for all patients. SHAP values explain exactly which factors drove each prediction." },
    { pose:'megaphone',   path: '/alerts',            title:"Alerts",                      body:"Real-time clinical alerts. Crisis flags always show first — acknowledge to clear your queue." },
    { pose:'cross',       path: '/medications',       title:"Medications",                 body:"All active prescriptions. Check interactions, log administrations, and flag missed doses." },
    { pose:'compass',     path: '/appointments',      title:"Appointments",                body:"Scheduled patient visits. Add notes, set reminders, and log outcomes directly here." },
    { pose:'stethoscope', path: '/caregivers',        title:"Caregivers",                  body:"View your care team's workload, patient assignments, and the AI burnout risk analysis." },
    { pose:'book',        path: '/resources',         title:"Resources",                   body:"Clinical guides, patient education materials, and Ghana-specific palliative care resources." },
    { pose:'book',        path: '/care-guide',        title:"Care Guide",                  body:"Adaptive care pathways tailored to each patient's care setting and disease stage." },
    { pose:'compass',     path: '/care-settings',     title:"Care Settings",               body:"Configure the 5 palliative care settings for each patient — affects their entire care pathway." },
    { pose:'book',        path: '/shift-handover',    title:"Shift Handover",              body:"Create and review handover notes at the end of each shift to keep the whole team informed." },
    { pose:'cross',       path: '/pre-clinic',        title:"Pre-Clinic Checklist",        body:"Prepare for clinic visits. Review patient status, pending tasks, and priority items before you start." },
    { pose:'book',        path: '/medical-knowledge', title:"Medical Knowledge Base",      body:"Evidence-based palliative care protocols, drug dosing guides, and clinical decision support." },
    { pose:'sleep',       path: '/profile',           title:"Your Profile",                body:"Edit your details, customise your avatar, and manage your professional settings." },
    { pose:'heart',       path: null,                 title:"Tour complete! 🎉",           body:"The sky-blue Aura Copilot button (bottom-right) is always here — ask it to summarise patients, explain AI predictions, or draft clinical notes." },
  ],

  patient: [
    { pose:'heart',       path: null,                 title:"Welcome! I'm Aura 👋",        body:"I'm your personal care companion. Let me show you everything in your space — takes under 2 minutes." },
    { pose:'yoga',        path: '/my-space',          title:"Your Space",                  body:"Your personal dashboard. See your wellness score, care team, upcoming appointments, and daily tips." },
    { pose:'yoga',        path: '/wellness-checkin',  title:"Wellness Check-In",           body:"Tell your care team how you're really feeling each day. It helps them give you better support." },
    { pose:'phone',       path: '/messages',          title:"Messages",                    body:"Message your care team anytime. They'll respond as soon as possible." },
    { pose:'compass',     path: '/my-journey',        title:"My Journey",                  body:"Your care journey map — see milestones, progress, and next steps along your pathway." },
    { pose:'compass',     path: '/care-settings',     title:"Care Setting",                body:"Your personalised care setting — this shapes your entire experience and what support you receive." },
    { pose:'book',        path: '/resources',         title:"Resources",                   body:"Guides, videos, and information about palliative care, managing symptoms, and spiritual support." },
    { pose:'phone',       path: '/community',         title:"Community",                   body:"Peer support groups where you can connect with others on a similar journey." },
    { pose:'heart',       path: '/memory-vault',      title:"Memory Vault",                body:"Store precious memories, photos, and voice messages — private and only shared with people you choose." },
    { pose:'sleep',       path: '/journal',           title:"My Journal",                  body:"Your private grief journal. Write freely — your entries are completely confidential." },
    { pose:'heart',       path: '/legacy-setup',      title:"Digital Legacy",              body:"Leave messages, photos, and final wishes for your loved ones to access after you're gone." },
    { pose:'stethoscope', path: '/heir-management',   title:"Manage Heirs",                body:"Choose who can access your digital legacy — family members, close friends, or loved ones." },
    { pose:'heart',       path: '/legacy-content',    title:"Legacy Content",              body:"Create letters, audio messages, and personal content to leave behind for your heirs." },
    { pose:'sleep',       path: '/profile',           title:"Your Profile",                body:"Update your personal details and preferences here." },
    { pose:'heart',       path: null,                 title:"I'm always here 💚",          body:"The teal heart button (bottom-right) opens Aura anytime — for support, questions, or just to talk." },
  ],

  family: [
    { pose:'stand',       path: null,                 title:"Welcome! 👋",                 body:"I'm Aura. Let me show you everything available to support you and your loved one." },
    { pose:'compass',     path: '/dashboard',         title:"Overview",                    body:"Your overview dashboard — see your loved one's care status and upcoming appointments." },
    { pose:'phone',       path: '/messages',          title:"Messages",                    body:"Stay in touch with the care team. Ask questions, share concerns, get updates — anytime." },
    { pose:'heart',       path: '/continuity-bridge', title:"Continuity Bridge",           body:"Capture memories, stories, and important moments to preserve your loved one's legacy." },
    { pose:'heart',       path: '/bereavement-support', title:"Bereavement Support",       body:"Grief resources, counselling guides, and support materials for you and your family." },
    { pose:'compass',     path: '/care-settings',     title:"Care Setting",                body:"Understand your loved one's personalised care pathway and what it means for their treatment." },
    { pose:'phone',       path: '/community',         title:"Community",                   body:"Connect with other families navigating similar experiences — a space to share and find support." },
    { pose:'book',        path: '/resources',         title:"Resources",                   body:"Guides on palliative care, how to help at home, and grief support — in multiple languages." },
    { pose:'heart',       path: '/my-legacy-access',  title:"Legacy Access",               body:"Access memories and messages your loved one has chosen to share with you." },
    { pose:'sleep',       path: '/profile',           title:"Your Profile",                body:"Update your contact details and notification preferences here." },
    { pose:'heart',       path: null,                 title:"Aura is here for you 💚",     body:"The teal heart button (bottom-right) opens Aura — ask me anything about palliative care or how to help." },
  ],

  caregiver: [
    { pose:'cross',       path: null,                 title:"Welcome! 👋",                 body:"I'm Aura. Let me show you every tool you'll use to care for your patients." },
    { pose:'compass',     path: '/dashboard',         title:"Overview",                    body:"Your daily overview — assigned patients, active alerts, and today's schedule at a glance." },
    { pose:'stethoscope', path: '/patients',          title:"Your Patients",               body:"All assigned patients with current status, risk levels, and pending care tasks." },
    { pose:'phone',       path: '/messages',          title:"Messages",                    body:"Communicate with patients, families, and the clinical team directly here." },
    { pose:'cross',       path: '/medications',       title:"Medications",                 body:"Track medication schedules and log administrations. Missed doses trigger automatic alerts." },
    { pose:'compass',     path: '/appointments',      title:"Appointments",                body:"Patient visit schedule. Confirm attendance and add notes after each visit." },
    { pose:'book',        path: '/shift-handover',    title:"Shift Handover",              body:"Write and review handover notes at shift end. Critical for continuity of care." },
    { pose:'book',        path: '/daily-care-log',    title:"Daily Care Log",              body:"Log daily care activities and observations for your assigned patients." },
    { pose:'book',        path: '/residential-log',   title:"Residential Log",             body:"Residential care activity log — track ADLs, mobility, and comfort measures." },
    { pose:'compass',     path: '/care-settings',     title:"Care Settings",               body:"View and understand the care setting for each patient — shapes their care plan." },
    { pose:'book',        path: '/resources',         title:"Resources",                   body:"Clinical guides, caregiver support resources, and Ghana-specific care protocols." },
    { pose:'phone',       path: '/community',         title:"Community",                   body:"Connect with other caregivers for support and shared experiences." },
    { pose:'sleep',       path: '/profile',           title:"Your Profile",                body:"Your personal settings and professional details." },
    { pose:'heart',       path: null,                 title:"Aura is with you 💚",         body:"The teal heart button (bottom-right) opens Aura — ask about care advice, patient questions, or support." },
  ],

  admin: [
    { pose:'compass',     path: null,                 title:"Welcome, Admin! 👋",          body:"I'm Aura. Let me walk you through every section you can manage from this account." },
    { pose:'compass',     path: '/dashboard',         title:"Dashboard",                   body:"System overview — all patients, active alerts, AI risk scores, and today's activity." },
    { pose:'stethoscope', path: '/patients',          title:"Patients",                    body:"Full patient registry. Manage records, care plans, and clinical history for all patients." },
    { pose:'phone',       path: '/messages',          title:"Messages",                    body:"Oversee all system communications between patients, families, and clinical staff." },
    { pose:'think',       path: '/ai-insights',       title:"AI Insights",                 body:"System-wide risk predictions. Monitor ML model outputs and SHAP explanations." },
    { pose:'megaphone',   path: '/alerts',            title:"Alerts",                      body:"All active clinical alerts across the system. Escalate or acknowledge as needed." },
    { pose:'book',        path: '/resources',         title:"Resources",                   body:"Manage and curate the resource library available to patients, families, and staff." },
    { pose:'book',        path: '/medical-knowledge', title:"Medical Knowledge",           body:"System-wide clinical knowledge base — protocols, dosing guides, and decision support." },
    { pose:'compass',     path: '/care-settings',     title:"Care Settings",               body:"System-level care setting configuration affecting all patients and care pathways." },
    { pose:'stethoscope', path: '/caregivers',        title:"Caregivers",                  body:"Manage care team assignments, workload distribution, and burnout risk monitoring." },
    { pose:'stethoscope', path: '/admin/users',       title:"User Management",             body:"Add, edit, and manage all users — assign roles, verify professionals, reset passwords." },
    { pose:'megaphone',   path: '/admin/hipaa-compliance', title:"HIPAA Compliance",      body:"Consent tracking, audit logs, breach incidents, and data governance — your compliance command centre." },
    { pose:'think',       path: '/admin/model-bias-report', title:"AI Model Monitoring",  body:"Track model bias, prediction accuracy, and fairness metrics across all patients." },
    { pose:'cross',       path: '/admin/audit',       title:"Audit Log",                   body:"Full audit trail of every action taken in the system — essential for HIPAA compliance." },
    { pose:'sleep',       path: '/profile',           title:"Your Profile",                body:"Your admin profile and system preferences." },
    { pose:'heart',       path: null,                 title:"All set! 🎉",                 body:"The sky-blue Aura Copilot button (bottom-right) can summarise system activity and answer clinical questions." },
  ],
};

/* ── Contextual page hints ─────────────────────────────────────────────────── */
const PAGE_HINTS = {
  '/dashboard':        { pose:'compass',     hint:"Tap a patient card to see their full record and AI risk analysis." },
  '/patients':         { pose:'stethoscope', hint:"Click any row to see vitals, medications, risk score, and SHAP explanations." },
  '/alerts':           { pose:'megaphone',   hint:"Acknowledge alerts to clear your queue. Crisis alerts always show at the top." },
  '/ai-insights':      { pose:'think',       hint:"SHAP values show which clinical factors drove each AI risk prediction." },
  '/medications':      { pose:'cross',       hint:"Flag missed doses early — they're a key indicator of patient deterioration." },
  '/appointments':     { pose:'compass',     hint:"Add notes to appointments after each visit to keep the care team informed." },
  '/messages':         { pose:'phone',       hint:"Reply promptly — patients and families check messages often." },
  '/my-space':         { pose:'yoga',        hint:"Your wellness check-in here helps your team understand how you're doing." },
  '/settings':         { pose:'sleep',       hint:"Dark mode is easier on long shifts! Try it under Appearance settings." },
  '/caregivers':       { pose:'stethoscope', hint:"The AI workload analysis flags who may be approaching burnout." },
  '/my-journey':       { pose:'compass',     hint:"Your journey map updates as your care team logs activities and milestones." },
  '/community':        { pose:'phone',       hint:"Peer support groups can make a real difference — explore what's available." },
  '/memory-vault':     { pose:'heart',       hint:"Your memories here are private — only you and your chosen heirs can see them." },
  '/resources':        { pose:'book',        hint:"Filter by language or condition to find resources relevant to your patient." },
};

const TOUR_KEY      = (role) => `aura_tour_done_${role}_v3`;
const TOUR_STEP_KEY = (role) => `aura_tour_step_${role}`;

/* ── Main component ────────────────────────────────────────────────────────── */
export default function AuraOnboarding() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();

  // Use the ACTUAL role from user object — never fallback to 'patient' until we
  // know the real role. If user isn't loaded yet, defer everything.
  const role = user?.role;   // undefined until auth resolves

  // Steps are empty until role is known — prevents wrong tour from flashing
  const steps = role ? (TOURS[role] || TOURS.patient) : [];

  /* Step state — sessionStorage survives navigation, cleared when done */
  const [step, setStepState] = useState(0);
  const [showTour,  setShowTour]  = useState(false);
  const [showHint,  setShowHint]  = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [navigating,setNavigating]= useState(false); // hides card briefly during page transition
  const [skipConfirm,setSkipConfirm] = useState(false); // show "are you sure?" before skipping

  const saveStep = useCallback((n) => {
    if (!role) return;
    sessionStorage.setItem(TOUR_STEP_KEY(role), String(n));
    setStepState(n);
  }, [role]);

  /* ── Session-level dismissed guard — prevents tour re-showing after skip in same session ── */
  const [tourDismissedThisSession, setTourDismissedThisSession] = useState(false);

  /* Start tour once per login — fires when BOTH user.id AND role are known */
  useEffect(() => {
    // Wait until auth is fully resolved (both id and role populated)
    if (!user?.id || !user?.role) return;

    // Already dismissed in this browser session — never show again until page reload
    if (tourDismissedThisSession) return;

    const currentRole = user.role;
    const currentSteps = TOURS[currentRole] || TOURS.patient;

    // Already done in localStorage? Never show again.
    const done = localStorage.getItem(TOUR_KEY(currentRole));
    if (done) return;

    // Resume from saved step if user navigated away mid-tour
    const saved = sessionStorage.getItem(TOUR_STEP_KEY(currentRole));
    const resumeStep = saved !== null ? parseInt(saved, 10) : 0;

    // Clamp to valid range (guard against stale values for a different tour length)
    const safeStep = Math.min(resumeStep, currentSteps.length - 1);
    setStepState(safeStep);
    if (saved === null) {
      sessionStorage.setItem(TOUR_STEP_KEY(currentRole), '0');
    }

    // Navigate to the step's page if not already there
    const target = currentSteps[safeStep]?.path;
    if (target && location.pathname !== target) {
      navigate(target, { replace: true });
    }

    setTimeout(() => setShowTour(true), 600);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, tourDismissedThisSession]);

  /* Listen for restart event */
  useEffect(() => {
    const restart = () => {
      const currentRole = user?.role;
      if (!currentRole) return;
      localStorage.removeItem(TOUR_KEY(currentRole));
      sessionStorage.removeItem(TOUR_STEP_KEY(currentRole));
      saveStep(0);
      const currentSteps = TOURS[currentRole] || TOURS.patient;
      const firstPath = currentSteps[0]?.path;
      if (firstPath) navigate(firstPath);
      setTimeout(() => setShowTour(true), 400);
    };
    window.addEventListener('aura:restart-tour', restart);
    return () => window.removeEventListener('aura:restart-tour', restart);
  }, [user?.role, navigate, saveStep]);

  /* Page hints — only when NOT in tour */
  useEffect(() => {
    if (showTour) return;
    setShowHint(false);
    setHintShown(false);
  }, [showTour]);

  useEffect(() => {
    if (showTour) return;
    const hint = PAGE_HINTS[location.pathname];
    if (!hint || hintShown) return;
    const t = setTimeout(() => {
      setShowHint(true);
      setHintShown(true);
      setTimeout(() => setShowHint(false), 7000);
    }, 2500);
    return () => clearTimeout(t);
  }, [location.pathname, showTour, hintShown]);

  useEffect(() => { setHintShown(false); }, [location.pathname]);

  // Derived from step — safe because steps always has at least 1 entry once role is known
  const current = steps.length > 0 ? steps[Math.min(step, steps.length - 1)] : null;
  const isLast  = steps.length > 0 && step >= steps.length - 1;

  const advance = useCallback(() => {
    const currentRole = user?.role;
    if (!currentRole) return;
    if (isLast) {
      // Done — mark permanent, clean up session, guard against re-show
      localStorage.setItem(TOUR_KEY(currentRole), '1');
      sessionStorage.removeItem(TOUR_STEP_KEY(currentRole));
      setTourDismissedThisSession(true);
      setShowTour(false);
      return;
    }
    const next     = step + 1;
    const nextStep = steps[next];
    saveStep(next);

    if (nextStep.path) {
      // Navigate first, show card after page settles
      setNavigating(true);
      navigate(nextStep.path);
      setTimeout(() => setNavigating(false), 500);
    }
  }, [step, isLast, steps, user?.role, navigate, saveStep]);

  const goBack = useCallback(() => {
    if (step <= 0) return;
    const prev     = step - 1;
    const prevStep = steps[prev];
    saveStep(prev);
    if (prevStep.path) {
      setNavigating(true);
      navigate(prevStep.path);
      setTimeout(() => setNavigating(false), 500);
    }
  }, [step, steps, navigate, saveStep]);

  const skip = useCallback(() => {
    const currentRole = user?.role;
    if (!currentRole) return;
    // Persist permanently in localStorage
    localStorage.setItem(TOUR_KEY(currentRole), '1');
    // Also clear session step so it can't resume
    sessionStorage.removeItem(TOUR_STEP_KEY(currentRole));
    // Guard against the useEffect re-showing the tour in the same session
    setTourDismissedThisSession(true);
    setShowTour(false);
    setSkipConfirm(false);
  }, [user?.role]);

  const requestSkip = useCallback(() => {
    // Don't confirm on last step — just finish
    if (isLast) { skip(); return; }
    setSkipConfirm(true);
    // Auto-cancel confirm after 5s
    setTimeout(() => setSkipConfirm(false), 5000);
  }, [isLast, skip]);

  const hint = PAGE_HINTS[location.pathname];

  // Don't render anything until role + user are fully resolved
  // Prevents wrong-role tour from flashing before auth completes
  if (!role || !current) return null;

  return (
    <>
      {/* ── Tour card — bottom-right, compact ────────────────────── */}
      <AnimatePresence>
        {showTour && !navigating && (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            className="fixed z-[9999]"
            style={{
              bottom: 24,
              right: 16,
              width: 320,
              pointerEvents: 'auto',
            }}
          >
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
              style={{
                background: 'var(--card-bg, #e8fafa)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
              }}>

              {/* Progress bar */}
              <div className="h-1 w-full" style={{ background: 'rgba(13,148,136,0.15)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${((step+1)/steps.length)*100}%`, background:'linear-gradient(90deg,#0d9488,#0369a1)' }}/>
              </div>

              {/* Skip confirmation overlay */}
              <AnimatePresence>
                {skipConfirm && (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl backdrop-blur-sm"
                    style={{ background: 'rgba(240,253,250,0.97)' }}>
                    <p className="text-sm font-bold text-center px-4" style={{ color: '#071520' }}>End the tour?</p>
                    <p className="text-[11px] text-center px-6 leading-snug" style={{ color: '#1e4f6a' }}>
                      You can restart it anytime from the avatar menu.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setSkipConfirm(false)}
                        className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                        style={{ background: '#e2e8f0', color: '#0b2235' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#cbd5e1'}
                        onMouseLeave={e => e.currentTarget.style.background = '#e2e8f0'}>
                        Keep going
                      </button>
                      <button onClick={skip}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-colors"
                        style={{ background: '#ef4444' }}>
                        End tour
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main content row */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Avatar */}
                <motion.div className="flex-shrink-0" key={current.pose}
                  initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',damping:20}}>
                  <AuraMascot size={48} pose={current.pose} showShadow={false}/>
                </motion.div>

                {/* Text */}
                <motion.div key={step} initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} transition={{duration:0.18}} className="flex-1 min-w-0">
                  <p className="text-xs font-bold leading-tight" style={{ color: '#071520' }}>{current.title}</p>
                  <p className="text-[11px] leading-snug mt-0.5 line-clamp-2" style={{ color: '#1e4f6a' }}>{current.body}</p>
                </motion.div>
              </div>

              {/* Footer controls */}
              <div className="flex items-center justify-between px-4 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium tabular-nums" style={{ color: '#2a6080' }}>{step+1}/{steps.length}</span>
                  {step > 0 && (
                    <button onClick={goBack}
                      className="flex items-center gap-0.5 text-[11px] transition-colors"
                      style={{ color: '#2a6080' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#071520'}
                      onMouseLeave={e => e.currentTarget.style.color = '#2a6080'}>
                      <ChevronLeft size={11}/>Back
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isLast && (
                    <button onClick={requestSkip}
                      className="text-[11px] transition-colors px-1.5 py-1 rounded-lg"
                      style={{ color: '#3a7592' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#3a7592'; e.currentTarget.style.background = 'transparent'; }}>
                      End tour
                    </button>
                  )}
                  <button onClick={advance}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-[12px] font-bold text-white transition-all"
                    style={{ background:'linear-gradient(135deg,#0d9488,#0369a1)', boxShadow:'0 2px 8px rgba(13,148,136,0.35)' }}>
                    {isLast ? '🎉 Done!' : 'Next →'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page hint bubble — bottom-right, shows on each new page ───── */}
      <AnimatePresence>
        {showHint && !showTour && hint && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 8,   scale: 0.95 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed bottom-36 right-6 z-[90] flex items-end gap-2 pointer-events-none"
            style={{ maxWidth: 280 }}
          >
            <div className="flex-shrink-0 mb-1">
              <AuraMascot size={48} pose={hint.pose} showShadow={false}/>
            </div>
            <div className="relative px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-xl pointer-events-auto border border-slate-200 dark:border-slate-600"
              style={{
                background: 'var(--card-bg, #e8fafa)',
                boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
              }}>
              <div className="flex items-start gap-2">
                <HelpCircle size={12} className="text-teal-500 flex-shrink-0 mt-0.5"/>
                <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200 leading-snug pr-4">{hint.hint}</p>
              </div>
              <button onClick={() => setShowHint(false)}
                className="absolute top-2 right-2 text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 transition-colors pointer-events-auto">
                <X size={10}/>
              </button>
              {/* Tail */}
              <div className="absolute -bottom-1.5 left-4 w-3 h-3 rotate-45 bg-slate-50 dark:bg-slate-800 border-r border-b border-slate-200 dark:border-slate-600"/>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Hook for restarting tour from other components ───────────────────────── */
export function useRestartTour() {
  const { user } = useAuth();
  return useCallback(() => {
    const currentRole = user?.role;
    if (!currentRole) return;
    localStorage.removeItem(TOUR_KEY(currentRole));
    sessionStorage.removeItem(TOUR_STEP_KEY(currentRole));
    window.dispatchEvent(new CustomEvent('aura:restart-tour'));
  }, [user?.role]);
}
