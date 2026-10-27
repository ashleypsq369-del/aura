/**
 * TaskNudge — Smart session nudge for pending care tasks
 * ======================================================
 * Fires ONCE per browser session when the user has pending required tasks.
 * Slides in from bottom-right after a 3s delay (doesn't interrupt on-load).
 * Dismissable — once dismissed, won't show again this session.
 * Tapping "View Tasks" navigates to their home page (My Space / Dashboard).
 *
 * Who sees it:
 *   patient / family  → if ESAS or medication not done today
 *   caregiver         → if any patient's vitals are overdue
 *   clinician / admin → never (they use reports/patient detail instead)
 *
 * Design: compact pill card, Aura mascot expression, warm not alarming tone.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../api/client';

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

// Session key — one nudge per session per user
const NUDGE_KEY = (uid) => `task_nudge_shown_${uid}_${new Date().toDateString()}`;

// Pages where the nudge is NOT shown (user is already on their task page)
const TASK_HOME_PATHS = ['/my-space', '/dashboard', '/wellness-checkin', '/medications'];

export default function TaskNudge() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const eligible = user?.role && ['patient', 'family', 'caregiver'].includes(user.role);

  const { data } = useQuery({
    queryKey: ['task-nudge', user?.id],
    queryFn: () => axios.get(`${API_URL}/api/compliance/my-tasks`, { headers: authH() }).then(r => r.data),
    enabled: eligible && !!user?.id,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (!user?.id || !eligible || !data) return;

    // Already shown this session-day
    if (sessionStorage.getItem(NUDGE_KEY(user.id))) return;

    // User is already on a task page — no need to nudge
    if (TASK_HOME_PATHS.some(p => location.pathname.startsWith(p))) return;

    const pending = (data.tasks || []).filter(t => t.required && !t.done);
    if (pending.length === 0) return;

    // Show after 3.5s so page renders first
    const timer = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem(NUDGE_KEY(user.id), '1');
    }, 3500);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, data]);

  // Hide when user navigates to a task page
  useEffect(() => {
    if (TASK_HOME_PATHS.some(p => location.pathname.startsWith(p))) {
      setVisible(false);
    }
  }, [location.pathname]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
  };

  const handleGoToTasks = () => {
    setVisible(false);
    const home = user?.role === 'patient' || user?.role === 'family'
      ? '/my-space'
      : '/dashboard';
    navigate(home);
  };

  if (!eligible || dismissed) return null;

  const pendingTasks = (data?.tasks || []).filter(t => t.required && !t.done);
  const pct          = data?.completion_pct ?? 0;
  const reqDone      = data?.required_completed ?? 0;
  const reqTotal     = data?.required_total ?? 0;

  // Role-specific message
  const messages = {
    patient:  `You have ${pendingTasks.length} care task${pendingTasks.length > 1 ? 's' : ''} to complete today.`,
    family:   `${pendingTasks.length} care task${pendingTasks.length > 1 ? 's' : ''} pending for today.`,
    caregiver:`${pendingTasks.length} patient task${pendingTasks.length > 1 ? 's' : ''} need attention.`,
  };
  const message = messages[user?.role] || 'You have pending tasks today.';
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="fixed bottom-24 right-5 z-[9000] w-72 pointer-events-auto"
        >
          <div className="bg-[#f0f6fa] dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)' }}>

            {/* Accent top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-teal-500 to-blue-500"/>

            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={15} className="text-amber-600 dark:text-amber-400"/>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      Hey {firstName} 👋
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Today's care tasks
                    </p>
                  </div>
                </div>
                <button onClick={handleDismiss}
                  className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-200 transition-colors mt-0.5 flex-shrink-0">
                  <X size={14}/>
                </button>
              </div>

              {/* Progress ring + message */}
              <div className="flex items-center gap-3 mb-3">
                {/* Mini ring */}
                <svg width="40" height="40" className="flex-shrink-0">
                  <circle cx="20" cy="20" r="15" fill="none" stroke="#e5e7eb" strokeWidth="4"/>
                  <circle cx="20" cy="20" r="15" fill="none"
                    stroke={pct === 100 ? '#059669' : pct >= 60 ? '#d97706' : '#ef4444'}
                    strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 15}`}
                    strokeDashoffset={`${2 * Math.PI * 15 * (1 - pct / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 20 20)"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}/>
                  <text x="20" y="21" textAnchor="middle" dominantBaseline="middle"
                    fontSize="9" fontWeight="800"
                    fill={pct === 100 ? '#059669' : pct >= 60 ? '#d97706' : '#ef4444'}>
                    {pct}%
                  </text>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 leading-snug">
                    {message}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {reqDone} of {reqTotal} required done
                  </p>
                </div>
              </div>

              {/* Pending task pills — show first 3 */}
              <div className="space-y-1.5 mb-3">
                {pendingTasks.slice(0, 3).map(t => (
                  <div key={t.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0"/>
                    <p className="text-[11px] font-bold text-red-800 truncate">{t.name}</p>
                  </div>
                ))}
                {pendingTasks.length > 3 && (
                  <p className="text-[10px] text-slate-500 pl-2">+{pendingTasks.length - 3} more tasks</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={handleGoToTasks}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors">
                  View My Tasks <ArrowRight size={11}/>
                </button>
                <button onClick={handleDismiss}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Later
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
