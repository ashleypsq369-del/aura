/**
 * InlineTaskReminder
 * ==================
 * A subtle banner shown at the top of a specific page when that
 * page's related task is still pending for today.
 *
 * Shows only when:
 *   - The relevant task is NOT yet done
 *   - The user is a patient, family or caregiver
 *   - Dismissed by user (persists in sessionStorage)
 *
 * Props:
 *   taskId   — the compliance task ID to check (e.g. 'esas_daily')
 *   message  — what to tell the user
 *   doneMsg  — shown briefly after task is detected as done (optional)
 *
 * Usage:
 *   <InlineTaskReminder taskId="esas_daily"
 *     message="Your daily wellness check-in counts on this page." />
 */
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../api/client';

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });
const DISMISS_KEY = (uid, taskId) => `inline_remind_dismiss_${uid}_${taskId}_${new Date().toDateString()}`;

export default function InlineTaskReminder({ taskId, message, doneMsg = null }) {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const eligible = user?.role && ['patient', 'family', 'caregiver'].includes(user.role);

  // Check dismiss state on mount
  useEffect(() => {
    if (user?.id && sessionStorage.getItem(DISMISS_KEY(user.id, taskId))) {
      setDismissed(true);
    }
  }, [user?.id, taskId]);

  const { data } = useQuery({
    queryKey: ['task-status', null, user?.id],
    queryFn: () => axios.get(`${API_URL}/api/compliance/my-tasks`, { headers: authH() }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: eligible && !!user?.id && !dismissed,
    retry: false,
  });

  if (!eligible || dismissed) return null;

  const task = (data?.tasks || []).find(t => t.id === taskId);
  if (!task) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (user?.id) sessionStorage.setItem(DISMISS_KEY(user.id, taskId), '1');
  };

  // Task is done — show brief success state (no banner needed)
  if (task.done) {
    if (!doneMsg) return null;
    return (
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="flex items-center gap-2 px-4 py-2.5 mx-4 sm:mx-6 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
        <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0"/>
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{doneMsg}</p>
      </motion.div>
    );
  }

  // Task is pending — show reminder banner
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-3 px-4 py-2.5 mx-4 sm:mx-6 mt-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30"
      >
        <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0"/>
        <p className="flex-1 text-xs font-medium text-amber-800 dark:text-amber-300 leading-snug">
          {message}
        </p>
        <button onClick={handleDismiss}
          className="text-amber-400 hover:text-amber-600 dark:hover:text-amber-200 transition-colors flex-shrink-0">
          <X size={13}/>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
