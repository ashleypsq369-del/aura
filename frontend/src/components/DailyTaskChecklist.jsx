/**
 * DailyTaskChecklist
 * ==================
 * Displays the patient's daily care task checklist with completion status.
 * Shows compulsory tasks (required every day) and optional tasks.
 * Integrates with the compliance engine backend.
 *
 * Used on: PatientPortal (My Space), Dashboard (patient/family view)
 *
 * Usage:
 *   <DailyTaskChecklist compact />     — mini version for dashboard
 *   <DailyTaskChecklist />             — full version for patient portal
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Circle, AlertCircle, Calendar,
  Heart, Pill, Book, Activity, Clipboard,
  ChevronRight, RefreshCw, Loader2, Lock,
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../api/client';
import toast from '../utils/toast';

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

// Map task icons to Lucide components
const ICON_MAP = {
  heart:     Heart,
  pill:      Pill,
  book:      Book,
  activity:  Activity,
  clipboard: Clipboard,
  calendar:  Calendar,
};

const TYPE_CFG = {
  compulsory_daily: {
    label:     'Required Today',
    dotColor:  'bg-red-500',
    badgeCls:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    ringColor: 'ring-red-200',
  },
  optional_daily: {
    label:     'Optional',
    dotColor:  'bg-teal-400',
    badgeCls:  'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    ringColor: 'ring-teal-200',
  },
  appointment: {
    label:     'Appointment',
    dotColor:  'bg-blue-500',
    badgeCls:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    ringColor: 'ring-blue-200',
  },
};

function ProgressRing({ pct, size = 48 }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct / 100);
  const color = pct === 100 ? '#059669' : pct >= 50 ? '#d97706' : '#dc2626';

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={dash}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text x={size/2} y={size/2 + 4} textAnchor="middle"
        fontSize="11" fontWeight="bold" fill={color}>
        {pct}%
      </text>
    </svg>
  );
}

export default function DailyTaskChecklist({ compact = false, patientId = null }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const endpoint = patientId
    ? `${API_URL}/api/compliance/patient/${patientId}`
    : `${API_URL}/api/compliance/my-tasks`;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['daily-tasks', patientId],
    queryFn: () => axios.get(endpoint, { headers: authH() }).then(r => r.data),
    staleTime: 2 * 60 * 1000,
    retry: false,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (taskId) => axios.put(`${API_URL}/api/compliance/acknowledge`,
      { task_id: taskId }, { headers: authH() }),
    onSuccess: (_, taskId) => {
      toast.success('Task acknowledged');
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
    },
    onError: () => toast.error('Could not acknowledge task'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 text-slate-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading today's tasks...</span>
      </div>
    );
  }

  if (!data || !data.tasks) return null;

  const { tasks, required_total, required_completed, completion_pct, all_required_done } = data;
  const required = tasks.filter(t => t.required);
  const optional  = tasks.filter(t => !t.required && t.type !== 'appointment');
  const appts     = tasks.filter(t => t.type === 'appointment');

  // ── Compact mode — for dashboard card ─────────────────────────────────
  if (compact) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ProgressRing pct={completion_pct} size={44} />
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Today's Tasks</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {required_completed}/{required_total} required complete
              </p>
            </div>
          </div>
          <button onClick={() => refetch()}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition">
            <RefreshCw size={13} />
          </button>
        </div>

        <div className="space-y-1.5">
          {required.slice(0, 3).map(task => {
            const Icon = ICON_MAP[task.icon] || Activity;
            return (
              <button key={task.id}
                onClick={() => navigate(task.link)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
                  task.done
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800'
                    : task.required
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'
                      : 'bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 hover:bg-slate-100'
                }`}>
                {task.done
                  ? <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                  : task.required
                    ? <AlertCircle size={15} className="text-red-500 flex-shrink-0 animate-pulse" />
                    : <Circle size={15} className="text-slate-400 flex-shrink-0" />
                }
                <span className={`text-xs font-semibold truncate ${
                  task.done ? 'text-emerald-700 dark:text-emerald-300' :
                  task.required ? 'text-red-700 dark:text-red-300' :
                  'text-slate-600 dark:text-slate-300'
                }`}>{task.name}</span>
                {!task.done && <ChevronRight size={12} className="ml-auto text-slate-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {all_required_done && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">All required tasks done!</p>
          </div>
        )}
      </div>
    );
  }

  // ── Full mode ─────────────────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ProgressRing pct={completion_pct} size={52} />
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Today's Care Tasks</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })}
              {' · '}{required_completed}/{required_total} required done
            </p>
          </div>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="p-5 space-y-5">

        {/* Compulsory tasks */}
        {required.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lock size={12} className="text-red-500" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Required Daily</p>
            </div>
            <div className="space-y-2">
              {required.map(task => {
                const Icon = ICON_MAP[task.icon] || Activity;
                const cfg  = TYPE_CFG[task.type] || TYPE_CFG.compulsory_daily;
                return (
                  <motion.div key={task.id} layout
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                      task.done
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                        : 'bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800'
                    }`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      task.done ? 'bg-emerald-100 dark:bg-emerald-800/40' : 'bg-red-100 dark:bg-red-800/40'
                    }`}>
                      <Icon size={17} className={task.done ? 'text-emerald-600' : 'text-red-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm truncate ${
                          task.done ? 'text-emerald-700 dark:text-emerald-300 line-through opacity-70' : 'text-slate-800 dark:text-slate-100'
                        }`}>{task.name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${cfg.badgeCls}`}>
                          Required
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{task.description}</p>
                      )}
                    </div>
                    {task.done ? (
                      <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
                    ) : (
                      <button onClick={() => navigate(task.link)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition">
                        Do it <ChevronRight size={12} />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Appointments */}
        {appts.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Calendar size={12} className="text-blue-500" /> Upcoming Appointments
            </p>
            <div className="space-y-2">
              {appts.map(task => (
                <div key={task.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <Calendar size={16} className="text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-blue-800 dark:text-blue-200 truncate">{task.name}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{task.description}</p>
                  </div>
                  <button onClick={() => navigate(task.link)}
                    className="flex-shrink-0 px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition">
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optional tasks */}
        {optional.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
              Optional — Encouraged Today
            </p>
            <div className="space-y-2">
              {optional.map(task => {
                const Icon = ICON_MAP[task.icon] || Activity;
                return (
                  <div key={task.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-800/30 flex items-center justify-center flex-shrink-0">
                      <Icon size={15} className="text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate">{task.name}</p>
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{task.description}</p>
                      )}
                    </div>
                    <button onClick={() => navigate(task.link)}
                      className="flex-shrink-0 px-2.5 py-1 border border-teal-300 dark:border-teal-600 text-teal-700 dark:text-teal-300 rounded-lg text-xs font-semibold hover:bg-teal-50 dark:hover:bg-teal-900/30 transition">
                      Start
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All done banner */}
        <AnimatePresence>
          {all_required_done && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700"
            >
              <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">All required tasks complete!</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Great work today. Your care team has been notified.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
