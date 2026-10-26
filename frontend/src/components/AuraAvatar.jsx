/**
 * AuraAvatar - Duolingo-style interactive companion 🦋🌻
 * Fully draggable · Glassmorphism design · Rich features
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  X, ChevronRight, Sparkles, Sun, HelpCircle,
  Bell, Calendar, Heart, BookOpen,
  Users, Brain, Pill, MessageCircle,
  Minimize2, Home, FileText, Globe,
  Star, RefreshCw, Coffee,
  ClipboardList, Settings, BarChart2, Building2,
} from 'lucide-react';
import AuraMascot from './AuraMascot';
import { useRestartTour } from './AuraOnboarding';

// -- Content data --------------------------------------------------------------
const TIPS = {
  '/dashboard':        ['Check your high-risk patients first. 🌻', "You're making a real difference today. Keep going!", 'Review unacknowledged alerts to keep your queue clean.'],
  '/patients':         ['Click any row to open the full patient record.', 'Use the search bar to filter by name or diagnosis quickly.', 'The risk badge shows the AI-assessed danger level.'],
  '/ai-insights':      ['SHAP values reveal what drove each AI prediction.', 'Patients above 0.7 risk score need priority attention.', 'The AI learns from your clinical documentation.'],
  '/alerts':           ['Acknowledge alerts to keep your queue clean.', 'Crisis alerts always appear at the top. Act fast.', 'You can filter alerts by severity level.'],
  '/medications':      ['Always verify dosages before logging. 💊', 'Timely rounds = better pain and comfort management.', 'Check for drug interactions on the patient detail page.'],
  '/appointments':     ['Set reminders so no visit slips through.', 'Upcoming appointments are sorted by scheduled date.', 'You can log notes directly on each appointment.'],
  '/resources':        ['Share PDF guides with families - they truly help.', 'Bookmark your most-used resources for quick access.', 'Filter by Ghana-specific resources for local guidance.'],
  '/memory-vault':     ['These memories mean the world to families. 🌻', 'Private memories are only visible to the person who wrote them.'],
  '/messages':         ['Timely replies show patients they are heard.', 'You can message the whole care team at once.'],
  '/my-space':         ["Take a breath. You're not alone on this. 🦋", 'Your wellness check-in is available here.', 'Your personal care plan is updated by your team.'],
  '/community':        ['Support groups can transform a patient\'s experience.', 'Recommend groups matching a patient\'s condition and interests.'],
  '/caregivers':       ['Balanced workloads lead to better care quality.', 'Check the AI workload analysis to spot overloaded staff.'],
  '/settings':         ['Dark mode is easier during long shifts!', 'You can toggle every AI feature from the Features tab.'],
  '/journal':          ['Writing is healing. Take your time. 🦋', 'Your entries are private and encrypted.'],
};

const GENERIC = [
  "Tap me anytime for tips and quick actions! 🦋",
  'Every care interaction you have today truly matters.',
  'Take a moment to breathe. Your work is important.',
  "Remember: you can't pour from an empty cup. 🌻",
  'Need to navigate somewhere fast? Tap the ✦ button!',
  'Check in on your own wellbeing too. 🦋',
];

const GREETINGS = {
  clinician: ['Good to see you, Doctor! Your patients are in great hands. 🌻', 'Ready to make a difference today? 🦋'],
  caregiver: ['Your compassion is a superpower. 🦋', 'Thank you for the care you bring every single day. 🌻'],
  patient:   ['How are you feeling today? 🌻', "You are not alone on this journey. 🦋"],
  family:    ['Being here for your loved one means everything. 🌻', 'Your presence is the most powerful medicine. 🦋'],
  admin:     ['System looking healthy! 🌻', 'You keep everything running smoothly for the whole team.'],
};

const MOOD_RESPONSES = {
  great:    ["That's wonderful! Your energy lifts the whole team. 🌻", 'Fantastic! Keep that positivity flowing. 🦋'],
  good:     ['Glad to hear it! You\'re doing great. 🌻', 'Keep it up - steady progress every day. 🦋'],
  okay:     ['Every day has its value. You\'re doing just fine. 🦋', 'Okay is perfectly fine. One step at a time. 🌻'],
  tired:    ['Make sure to take a proper break today. 🌻', 'Rest is part of caring well. Look after yourself. 🦋'],
  stressed: ['Breathe. You are enough. 🦋 Try a 2-minute break.', "It's okay to feel stressed. Talk to someone if you can. 🌻"],
  sad:      ['I\'m sorry you\'re feeling down. 🌻 You\'re not alone.', 'Give yourself grace today. Reach out to your team. 🦋'],
};

const QUICK_ACTIONS = [
  { icon: Home,          label: 'Dashboard',    path: '/',             color: '#0d9488', group: 'core' },
  { icon: Users,         label: 'Patients',     path: '/patients',     color: '#7c3aed', group: 'core' },
  { icon: Bell,          label: 'Alerts',       path: '/alerts',       color: '#dc2626', group: 'core' },
  { icon: Brain,         label: 'AI Insights',  path: '/ai-insights',  color: '#6d28d9', group: 'core' },
  { icon: Calendar,      label: 'Appointments', path: '/appointments', color: '#2563eb', group: 'care' },
  { icon: Pill,          label: 'Medications',  path: '/medications',  color: '#be123c', group: 'care' },
  { icon: MessageCircle, label: 'Messages',     path: '/messages',     color: '#0891b2', group: 'care' },
  { icon: Users,         label: 'Caregivers',   path: '/caregivers',   color: '#0f766e', group: 'care' },
  { icon: BookOpen,      label: 'Resources',    path: '/resources',    color: '#15803d', group: 'info' },
  { icon: Globe,         label: 'Community',    path: '/community',    color: '#0369a1', group: 'info' },
  { icon: Heart,         label: 'Memories',     path: '/memory-vault', color: '#9d174d', group: 'info' },
  { icon: FileText,      label: 'Journal',      path: '/journal',      color: '#4c1d95', group: 'info' },
];

const MOODS = [
  { emoji: '🤩', label: 'Great!',   value: 'great',    color: '#fbbf24' },
  { emoji: '😊', label: 'Good',     value: 'good',     color: '#34d399' },
  { emoji: '😐', label: 'Okay',     value: 'okay',     color: '#94a3b8' },
  { emoji: '😴', label: 'Tired',    value: 'tired',    color: '#a78bfa' },
  { emoji: '😓', label: 'Stressed', value: 'stressed', color: '#f87171' },
  { emoji: '😔', label: 'Sad',      value: 'sad',      color: '#60a5fa' },
];

const AFFIRMATIONS = [
  "You are doing better than you think. 🌻",
  "Every small act of care matters deeply. 🦋",
  "You chose a beautiful, hard path. Thank you.",
  "Your patience today is someone's comfort. 🌻",
  "Rest when you need to. That\'s wisdom, not weakness. 🦋",
  "The world is better because you show up. 🌻",
];

// -- Butterfly replaced by AuraMascot -----------------------------------------

// -- Sunflower row -------------------------------------------------------------
function SunflowerRow() {
  return (
    <svg width="100" height="28" viewBox="0 0 100 28" fill="none">
      {/* Grass */}
      <rect x="0" y="24" width="100" height="4" rx="2" fill="#16a34a" />
      {/* Stems */}
      {[16, 50, 84].map(x => (
        <path key={x} d={`M ${x} 24 Q ${x-2} 18 ${x} 12`} stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
      ))}
      {/* Flowers */}
      {[16, 50, 84].map((x, i) => {
        const s = i === 1 ? 10 : 7;
        return [0,45,90,135,180,225,270,315].map((a, j) => {
          const r = (a * Math.PI) / 180;
          return (
            <ellipse key={j}
              cx={x + (s * 1.35) * Math.cos(r)} cy={12 + (s * 1.35) * Math.sin(r)}
              rx={s * 0.55} ry={s * 0.85}
              fill={j % 2 === 0 ? '#fbbf24' : '#f59e0b'}
              transform={`rotate(${a}, ${x + (s * 1.35) * Math.cos(r)}, ${12 + (s * 1.35) * Math.sin(r)})`}
            />
          );
        });
      })}
      {[16, 50, 84].map((x, i) => {
        const r = i === 1 ? 7 : 5;
        return [
          <circle key={`c1-${x}`} cx={x} cy={12} r={r} fill="#78350f" />,
          <circle key={`c2-${x}`} cx={x} cy={12} r={r * 0.65} fill="#92400e" />,
        ];
      })}
      {/* Leaves */}
      <path d="M 50 20 Q 42 17 40 12 Q 46 14 50 20" fill="#22c55e" />
      <path d="M 50 19 Q 58 16 60 11 Q 54 14 50 19" fill="#16a34a" />
    </svg>
  );
}

// -- Main component -------------------------------------------------------------
export default function AuraAvatar() {
  const { user }  = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const dragControls = useDragControls();
  const restartTour = useRestartTour();

  // State
  const [mood,       setMood]       = useState('happy');
  const [fluttering, setFluttering] = useState(true); // start with flutter
  const [tip,        setTip]        = useState('');
  const [tipIdx,     setTipIdx]     = useState(0);
  const [panel,      setPanel]      = useState('tip'); // open tip on load
  const [dismissed,  setDismissed]  = useState(() => {
    // Clear any old dismiss keys from previous versions
    localStorage.removeItem('aura_dismissed');
    return localStorage.getItem('aura_v3_dismissed') === 'true';
  });
  const [minimized,  setMinimized]  = useState(false);
  const [userMood,   setUserMood]   = useState(null);
  const [affirmation,setAffirmation]= useState('');
  const [actionFilter, setActionFilter] = useState('core');
  const collapseRef = useRef(null);
  const prevPath    = useRef('');

  const getTips = useCallback(() => {
    const p = location.pathname;
    for (const [k, v] of Object.entries(TIPS)) {
      if (p.startsWith(k)) return v;
    }
    return [...(GREETINGS[user?.role] || []), ...GENERIC];
  }, [location.pathname, user?.role]);

  const flutter = useCallback((ms = 800) => {
    setFluttering(true);
    setTimeout(() => setFluttering(false), ms);
  }, []);

  const showTip = useCallback((idx) => {
    const tips = getTips();
    const i = idx ?? Math.floor(Math.random() * tips.length);
    setTip(tips[i % tips.length]);
    setTipIdx(i % tips.length);
    setPanel('tip');
    clearTimeout(collapseRef.current);
    collapseRef.current = setTimeout(() => setPanel(null), 7000);
  }, [getTips]);

  // Mount - set tip immediately, stop flutter after 1s
  useEffect(() => {
    if (dismissed) return;
    const greets = GREETINGS[user?.role] || GENERIC;
    setTip(greets[Math.floor(Math.random() * greets.length)]);
    setTimeout(() => setFluttering(false), 1000);
    collapseRef.current = setTimeout(() => setPanel(null), 8000);
  }, []);

  // Route change
  useEffect(() => {
    if (dismissed) return;
    if (location.pathname === prevPath.current) return;
    prevPath.current = location.pathname;
    flutter(700);
    setMood('happy');
    showTip(undefined);
  }, [location.pathname]);

  // Idle flutter
  useEffect(() => {
    if (dismissed) return;
    const iv = setInterval(() => flutter(600), 12000);
    return () => clearInterval(iv);
  }, [dismissed]);

  const openPanel = (p) => {
    clearTimeout(collapseRef.current);
    flutter(400);
    if (panel === p) { setPanel(null); return; }
    setPanel(p);
    if (p === 'affirmation') {
      setAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
      setMood('celebrate');
      setTimeout(() => setMood('happy'), 1200);
    }
  };

  const handleNav = (path) => {
    navigate(path);
    setPanel(null);
    flutter(600);
    setMood('celebrate');
    setTimeout(() => setMood('happy'), 800);
  };

  const handleMoodSelect = (m) => {
    setUserMood(m);
    const responses = MOOD_RESPONSES[m.value] || GENERIC;
    setTip(responses[Math.floor(Math.random() * responses.length)]);
    setMood(m.value === 'great' || m.value === 'good' ? 'celebrate' :
            m.value === 'tired' || m.value === 'sad' || m.value === 'stressed' ? 'sad' : 'happy');
    flutter(800);
    setTimeout(() => { if (m.value !== 'sad' && m.value !== 'stressed') setMood('happy'); }, 1200);
    setPanel('tip');
    clearTimeout(collapseRef.current);
    collapseRef.current = setTimeout(() => setPanel(null), 9000);
  };

  const nextTip = () => {
    const tips = getTips();
    const next = (tipIdx + 1) % tips.length;
    setTipIdx(next);
    setTip(tips[next]);
    flutter(300);
    clearTimeout(collapseRef.current);
    collapseRef.current = setTimeout(() => setPanel(null), 7000);
  };

  const handleDismiss = () => {
    setMood('sleep');
    clearTimeout(collapseRef.current);
    setTimeout(() => {
      setDismissed(true);
      localStorage.setItem('aura_v3_dismissed', 'true');
    }, 900);
  };

  if (dismissed) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: 'spring' }}
        onClick={() => {
          setDismissed(false);
          localStorage.removeItem('aura_v3_dismissed');
        }}
        className="fixed bottom-4 left-4 z-[80] w-11 h-11 rounded-full flex items-center justify-center shadow-xl"
        style={{
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          border: '2.5px solid white',
        }}
        title="Bring back Aura"
        aria-label="Restore Aura avatar"
      >
        <div className="flex items-center justify-center w-full h-full transform translate-y-[-1px]">
          <AuraMascot size={32} />
        </div>
      </motion.button>
    );
  }

  const filteredActions = QUICK_ACTIONS.filter(a => a.group === actionFilter);

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0.08}
      dragConstraints={{
        left:   -(Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - 200),
        right:  0,
        top:    -(Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 200),
        bottom: 0,
      }}
      className="fixed bottom-4 right-4 z-[80] select-none touch-none"
      style={{ userSelect: 'none', maxWidth: 'calc(100vw - 16px)' }}
    >
      <div className="relative flex flex-col items-start gap-2">

        {/* -- Expandable Panel - opens LEFT of avatar -- */}
        <AnimatePresence>
          {panel && !minimized && (
            <motion.div
              key={panel}
              initial={{ opacity: 0, scale: 0.88, y: 14 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={  { opacity: 0, scale: 0.88,  y: 10 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              className="absolute bottom-full mb-3 right-0 pointer-events-auto"
              style={{ width: 'min(250px, calc(100vw - 100px))', maxWidth: 'calc(100vw - 100px)' }}
            >
              <div
                className="rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(251,191,36,0.5)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(251,191,36,0.2)',
                }}
              >
                {/* Panel top bar */}
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', cursor: 'grab' }}
                  onPointerDown={e => dragControls.start(e)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center flex-shrink-0">
                      <AuraMascot size={22} />
                    </div>
                    <span className="text-sm font-bold text-white">
                      {panel === 'tip'         ? 'Aura says...'       :
                       panel === 'nav'         ? 'Go somewhere'     :
                       panel === 'mood'        ? 'How are you?'     :
                       panel === 'affirmation' ? 'Daily Affirmation':
                       panel === 'tools'       ? 'Quick Tools'      : 'Aura'}
                    </span>
                  </div>
                  <button onClick={() => setPanel(null)} className="text-white/80 hover:text-white">
                    <X size={15} />
                  </button>
                </div>

                {/* -- TIP panel -- */}
                {panel === 'tip' && (
                  <div className="p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <Sparkles size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">{tip}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <button onClick={nextTip}
                        className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors">
                        Next tip <ChevronRight size={12} />
                      </button>
                      <span className="text-[10px] text-slate-400">{tipIdx + 1}/{getTips().length}</span>
                    </div>
                  </div>
                )}

                {/* -- NAV panel -- */}
                {panel === 'nav' && (
                  <div className="p-3">
                    {/* Filter tabs */}
                    <div className="flex gap-1 mb-3">
                      {['core','care','info'].map(g => (
                        <button key={g} onClick={() => setActionFilter(g)}
                          className="flex-1 py-1 rounded-lg text-[11px] font-bold capitalize transition-all"
                          style={{
                            background: actionFilter === g ? '#f59e0b' : 'rgba(251,191,36,0.12)',
                            color: actionFilter === g ? 'white' : '#92400e',
                          }}>
                          {g === 'core' ? '⚡ Core' : g === 'care' ? '💊 Care' : '📚 Info'}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {filteredActions.map(a => {
                        const Icon = a.icon;
                        return (
                          <motion.button
                            key={a.path}
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                            onClick={() => handleNav(a.path)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                            style={{ background: `linear-gradient(135deg, ${a.color}dd, ${a.color})` }}
                          >
                            <Icon size={13} /> {a.label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* -- MOOD panel -- */}
                {panel === 'mood' && (
                  <div className="p-4">
                    <p className="text-xs font-bold text-slate-600 mb-3 ">
                      How are you feeling right now?
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {MOODS.map(m => (
                        <motion.button
                          key={m.value}
                          whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.92 }}
                          onClick={() => handleMoodSelect(m)}
                          className="flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all"
                          style={{
                            borderColor: userMood?.value === m.value ? m.color : 'rgba(251,191,36,0.3)',
                            background:  userMood?.value === m.value ? `${m.color}22` : 'rgba(255,255,255,0.8)',
                          }}
                        >
                          <span className="text-2xl">{m.emoji}</span>
                          <span className="text-[10px] font-bold" style={{ color: m.color }}>{m.label}</span>
                        </motion.button>
                      ))}
                    </div>
                    {userMood && (
                      <button onClick={() => setUserMood(null)}
                        className="mt-2.5 text-[11px] text-slate-400 hover:text-slate-600 w-full text-center transition-colors">
                        Change response
                      </button>
                    )}
                  </div>
                )}

                {/* -- AFFIRMATION panel -- */}
                {panel === 'affirmation' && (
                  <div className="p-5 text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                      <Sparkles size={22} className="text-amber-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 leading-relaxed mb-4 italic">
                      "{affirmation}"
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
                        flutter(400);
                      }}
                      className="flex items-center gap-1.5 mx-auto px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
                      style={{ background: 'linear-gradient(to right, #f59e0b, #fbbf24)' }}
                    >
                      <RefreshCw size={12} /> New affirmation
                    </motion.button>
                  </div>
                )}

                {/* -- TOOLS panel -- */}
                {panel === 'tools' && (
                  <div className="p-3 space-y-2">
                    {/* Restart tour CTA — always first */}
                    <motion.button
                      whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
                      onClick={() => { restartTour(); setPanel(null); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left"
                      style={{ background: 'linear-gradient(135deg,#0d9488,#0369a1)', marginBottom: 4 }}
                    >
                      <Sparkles size={15} className="text-white flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">Take the tour again</p>
                        <p className="text-[10px] text-white/70">Aura will guide you through everything</p>
                      </div>
                      <ChevronRight size={12} className="ml-auto text-white/60" />
                    </motion.button>

                    {/* Divider */}
                    <div className="h-px bg-amber-100 my-1"/>

                    {[
                      { Icon: ClipboardList, label: 'Assessments',   desc: 'Patient clinical assessments', nav: '/assessments' },
                      { Icon: Building2,     label: 'Care Settings', desc: '5 palliative care settings',   nav: '/care-settings' },
                      { Icon: FileText,      label: 'Shift Handover',desc: 'Daily handover notes',         nav: '/shift-handover' },
                      { Icon: BarChart2,     label: 'AI Insights',   desc: 'Risk predictions & analytics', nav: '/ai-insights' },
                      { Icon: Bell,          label: 'Notifications', desc: 'Your notification inbox',      nav: '/notifications' },
                      { Icon: Settings,      label: 'Settings',      desc: 'App preferences',              nav: '/settings' },
                    ].map(t => (
                      <motion.button
                        key={t.nav}
                        whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
                        onClick={() => handleNav(t.nav)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-50 transition-colors text-left"
                      >
                        <t.Icon size={16} className="text-slate-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{t.label}</p>
                          <p className="text-[10px] text-slate-400">{t.desc}</p>
                        </div>
                        <ChevronRight size={12} className="ml-auto text-slate-300" />
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Bubble tail - right-aligned */}
                <div className="absolute -bottom-3 right-8 w-0 h-0"
                  style={{ borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '12px solid rgba(251,191,36,0.5)' }} />
                <div className="absolute -bottom-2.5 right-9 w-0 h-0"
                  style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '10px solid rgba(255,255,255,0.92)' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* -- Avatar + buttons row -- */}
        {/* Buttons on LEFT, character on RIGHT - stays in viewport */}
        <div className="flex items-end gap-1.5 pointer-events-auto">

          {/* Action buttons - LEFT side */}
          {!minimized && (
            <div className="flex flex-col gap-1 mb-7">
              {[
                { icon: HelpCircle, p: 'tip',         active: '#f59e0b', emoji: '💡' },
                { icon: Sparkles,   p: 'nav',         active: '#7c3aed', emoji: '✦'  },
                { icon: Sun,        p: 'mood',        active: '#f59e0b', emoji: '☀'  },
                { icon: Star,       p: 'affirmation', active: '#ec4899', emoji: '🌸' },
                { icon: Coffee,     p: 'tools',       active: '#0d9488', emoji: '🛠' },
              ].map(btn => (
                <motion.button key={btn.p}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => openPanel(btn.p)}
                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                  style={{
                    background: panel === btn.p ? btn.active : 'rgba(255,255,255,0.92)',
                    border: `1.5px solid ${panel === btn.p ? btn.active : 'rgba(251,191,36,0.45)'}`,
                  }}
                >
                  {panel === btn.p
                    ? <span className="text-white text-xs leading-none">{btn.emoji}</span>
                    : <btn.icon size={13} color={btn.active} />}
                </motion.button>
              ))}
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => setMinimized(v => !v)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.88)', border: '1.5px solid #cbd5e1' }}>
                <Minimize2 size={11} color="#64748b" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={handleDismiss}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,241,242,0.9)', border: '1.5px solid #fca5a5' }}>
                <X size={11} color="#ef4444" />
              </motion.button>
            </div>
          )}

          {/* Character - RIGHT side */}
          <div className="flex flex-col items-center">
            <motion.div
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={e => dragControls.start(e)}
              animate={fluttering
                ? { y: [0, -14, -4, -9, 0], rotate: [0,-4,4,-2,0], transition: { duration: 0.65 } }
                : { y: [0, -4, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }
              }
              style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.18))' }}
            >
              {!minimized ? (
                <motion.div onClick={() => openPanel('tip')} role="button" tabIndex={0}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <AuraMascot 
                    size={72} 
                    pose={panel ? (panel === 'tip' ? 'stethoscope' : panel === 'nav' ? 'compass' : panel === 'mood' ? (mood === 'great' || mood === 'good' ? 'heart' : mood === 'sleep' || mood === 'tired' || mood === 'sad' || mood === 'stressed' ? 'sleep' : 'stand') : panel === 'affirmation' ? 'heart' : 'cross') : undefined} 
                  />
                </motion.div>
              ) : (
                <motion.div onClick={() => setMinimized(false)}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
                  className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer shadow-lg bg-white border-2 border-amber-400"
                >
                  <AuraMascot size={32} />
                </motion.div>
              )}
            </motion.div>

            {!minimized && <SunflowerRow />}
            {!minimized && (
              <div className="mt-0.5 px-2 py-0.5 text-white text-[9px] font-bold rounded-full shadow-sm"
                style={{ background: 'linear-gradient(to right, #d97706, #fbbf24)' }}>
                Aura 🌻
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}