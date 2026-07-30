/**
 * TaskStatusBar — Universal task completion widget
 * ================================================
 * Shows every user (patient, caregiver, clinician, admin) a live
 * summary of what is done and what is still pending today.
 *
 * Renders two modes:
 *   compact  — single row of coloured dots + % ring (for headers/sidebars)
 *   full     — expandable card listing each task with status icon
 *
 * Data sources (by role):
 *   patient/family  → GET /api/compliance/my-tasks
 *   caregiver       → GET /api/compliance/my-tasks  (their own tasks)
 *   clinician/admin → GET /api/compliance/patient/{id}  (for a specific patient)
 *                     or no ID → shows team-level overdue count
 *
 * Usage:
 *   <TaskStatusBar />                  — auto-detects role, full mode
 *   <TaskStatusBar compact />          — compact dot row
 *   <TaskStatusBar patientId={3} />    — clinician viewing patient 3
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Circle, AlertCircle, ChevronDown, ChevronUp,
  Calendar, Heart, Pill, Activity, Clipboard, Book,
  RefreshCw, Loader2, ClipboardCheck,
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../api/client';
import toast from '../utils/toast';

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

const ICON_MAP = {
  heart: Heart, pill: Pill, activity: Activity,
  clipboard: Clipboard, book: Book, calendar: Calendar,
};

/* tiny ring */
function Ring({ pct, size = 36 }) {
  const r = (size - 5) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct / 100);
  const color = pct === 100 ? '#059669' : pct >= 60 ? '#d97706' : '#dc2626';
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="4"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition:'stroke-dashoffset 0.5s ease' }}/>
      <text x={size/2} y={size/2+3.5} textAnchor="middle" fontSize="9" fontWeight="bold" fill={color}>
        {pct}%
      </text>
    </svg>
  );
}

function TaskRow({ task, onAcknowledge, acknowledging }) {
  const navigate = useNavigate();
  const Icon = ICON_MAP[task.icon] || Activity;
  const isRequired = task.required;

  const statusIcon = task.done
    ? <CheckCircle2 size={17} className="text-green-500 flex-shrink-0"/>
    : isRequired
      ? <AlertCircle size={17} className="text-red-500 flex-shrink-0 animate-pulse"/>
      : <Circle size={17} className="text-slate-300 flex-shrink-0"/>;

  const rowBg = task.done
    ? 'bg-green-50/60 dark:bg-green-900/10 border-green-100 dark:border-green-800/30'
    : isRequired
      ? 'bg-red-50/60 dark:bg-red-900/10 border-red-100 dark:border-red-800/30'
      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/50';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${rowBg}`}
    >
      {statusIcon}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Icon size={13} className="text-slate-400"/>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold leading-tight truncate ${task.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
          {task.name}
        </p>
        {task.description && (
          <p className="text-[10px] text-slate-400 truncate mt-0.5">{task.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Type badge */}
        {isRequired && !task.done && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 uppercase tracking-wide">
            Required
          </span>
        )}
        {task.type === 'appointment' && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 uppercase tracking-wide">
            Appt
          </span>
        )}
        {/* Action buttons */}
        {!task.done && task.link && (
          <button
            onClick={() => navigate(task.link.replace('{patient_id}', ''))}
            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition"
          >
            Do Now
          </button>
        )}
        {!task.done && !isRequired && !task.link && (
          <button
            onClick={() => onAcknowledge(task.id)}
            disabled={acknowledging === task.id}
            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition disabled:opacity-50"
          >
            {acknowledging === task.id ? '…' : 'Mark Done'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function TaskStatusBar({ compact = false, patientId = null }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [acknowledging, setAcknowledging] = useState(null);

  const isPatientView = ['patient', 'family'].includes(user?.role);
  const isClinical    = ['clinician', 'admin', 'caregiver'].includes(user?.role);

  // Choose endpoint based on context
  const endpoint = patientId
    ? `${API_URL}/api/compliance/patient/${patientId}`
    : `${API_URL}/api/compliance/my-tasks`;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['task-status', patientId, user?.id],
    queryFn: () => axios.get(endpoint, { headers: authH() }).then(r => r.data),
    refetchInterval: 5 * 60 * 1000,   // refresh every 5 min
    enabled: !!user?.id,
    retry: false,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (taskId) =>
      axios.put(`${API_URL}/api/compliance/acknowledge`, { task_id: taskId }, { headers: authH() }),
    onMutate: (taskId) => setAcknowledging(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-status'] });
      toast.success('Task marked as done');
    },
    onError: () => toast.error('Could not update task'),
    onSettled: () => setAcknowledging(null),
  });

  if (!user || isLoading) return compact ? null : (
    <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400">
      <Loader2 size={13} className="animate-spin"/> Loading tasks…
    </div>
  );

  const tasks     = data?.tasks || [];
  const reqTotal  = data?.required_total  ?? 0;
  const reqDone   = data?.required_completed ?? 0;
  const pct       = data?.completion_pct ?? 0;
  const allDone   = data?.all_required_done ?? (reqTotal === 0);
  const message   = data?.message;

  // Nothing to show
  if (message && tasks.length === 0) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 italic">
        <ClipboardCheck size={13}/> {message}
      </div>
    );
  }

  if (tasks.length === 0 && !isLoading) return null;

  /* ── COMPACT mode — single row ────────────────────────── */
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Ring pct={pct} size={32}/>
        <div className="flex gap-1">
          {tasks.filter(t => t.required).slice(0, 5).map(t => (
            <div key={t.id}
              className={`w-2 h-2 rounded-full flex-shrink-0 ${t.done ? 'bg-green-500' : 'bg-red-400 animate-pulse'}`}
              title={t.name}
            />
          ))}
        </div>
        <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">
          {reqDone}/{reqTotal} done
        </span>
      </div>
    );
  }

  /* ── FULL mode — expandable card ──────────────────────── */
  const color = allDone ? '#059669' : pct >= 60 ? '#d97706' : '#dc2626';
  const requiredTasks = tasks.filter(t => t.required);
  const optionalTasks = tasks.filter(t => !t.required);

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ borderColor: color + '30', backgroundColor: color + '08' }}>

      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-90 transition"
      >
        <Ring pct={pct} size={44}/>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {allDone ? '✅ All tasks complete for today' : `Today's Care Tasks`}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {reqDone} of {reqTotal} required done
            {optionalTasks.length > 0 && ` · ${optionalTasks.filter(t=>t.done).length}/${optionalTasks.length} optional`}
          </p>
          {/* Mini progress bar */}
          <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: color }}/>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); refetch(); }}
            className="p-1 rounded-lg hover:bg-white/50 text-slate-400 hover:text-slate-600 transition">
            <RefreshCw size={12}/>
          </button>
          {expanded ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
        </div>
      </button>

      {/* Expanded task list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {/* Required tasks */}
              {requiredTasks.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-1">
                    Required Today ({reqDone}/{reqTotal})
                  </p>
                  {requiredTasks.map(task => (
                    <TaskRow key={task.id} task={task}
                      onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
                      acknowledging={acknowledging}/>
                  ))}
                </>
              )}

              {/* Optional tasks */}
              {optionalTasks.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-2">
                    Optional
                  </p>
                  {optionalTasks.map(task => (
                    <TaskRow key={task.id} task={task}
                      onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
                      acknowledging={acknowledging}/>
                  ))}
                </>
              )}

              {/* All done banner */}
              {allDone && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 mt-1">
                  <CheckCircle2 size={15} className="text-green-600 flex-shrink-0"/>
                  <p className="text-xs font-semibold text-green-700 dark:text-green-300">
                    All required tasks complete for today. Great work!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
