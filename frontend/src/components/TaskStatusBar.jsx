/**
 * TaskStatusBar — Universal task completion widget
 * ================================================
 * compact  — header pill: fits the dark teal nav bar
 * full     — expandable card on every page
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Circle, AlertCircle, ChevronDown, ChevronUp,
  Calendar, Heart, Pill, Activity, Clipboard, Book,
  RefreshCw, Loader2, ClipboardCheck, ListChecks,
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

/* ── Arc ring ───────────────────────────────────────────── */
function Ring({ pct, size = 38, light = false }) {
  const r    = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct / 100);
  const color = pct === 100
    ? (light ? '#6ee7b7' : '#059669')
    : pct >= 60
      ? (light ? '#fcd34d' : '#d97706')
      : (light ? '#fca5a5' : '#ef4444');
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={light ? 'rgba(255,255,255,0.15)' : '#e5e7eb'} strokeWidth="5"/>
      {/* Progress arc — starts at top (−90°) */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={dash}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}/>
      {/* Centred percentage text */}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={size <= 28 ? '8' : '9'} fontWeight="800"
        fill={light ? 'rgba(255,255,255,0.9)' : color}>
        {pct}%
      </text>
    </svg>
  );
}

/* ── Task row in full card ──────────────────────────────── */
function TaskRow({ task, onAcknowledge, acknowledging }) {
  const navigate  = useNavigate();
  const Icon      = ICON_MAP[task.icon] || Activity;
  const isReq     = task.required;
  const isAppt    = task.type === 'appointment';

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors
        ${task.done
          ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20'
          : isReq
            ? 'bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30'
            : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50'
        }`}
    >
      {/* Status icon */}
      {task.done
        ? <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0"/>
        : isReq
          ? <AlertCircle  size={16} className="text-red-400   flex-shrink-0"/>
          : <Circle       size={16} className="text-slate-300 flex-shrink-0"/>
      }

      {/* Feature icon */}
      <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
        ${task.done ? 'bg-emerald-100 dark:bg-emerald-800/30' : isAppt ? 'bg-blue-100 dark:bg-blue-900/30' : isReq ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
        <Icon size={13} className={task.done ? 'text-emerald-600' : isAppt ? 'text-teal-600' : isReq ? 'text-red-500' : 'text-slate-500'}/>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold leading-tight truncate
          ${task.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-100'}`}>
          {task.name}
        </p>
        {task.description && !task.done && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{task.description}</p>
        )}
      </div>

      {/* Badges + action */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isReq && !task.done && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-600 text-white ">
            Required
          </span>
        )}
        {isAppt && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-teal-600 ">
            Appt
          </span>
        )}
        {!task.done && task.link && (
          <button
            onClick={() => navigate(task.link.replace('{patient_id}', ''))}
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors"
          >
            Do Now
          </button>
        )}
        {!task.done && !isReq && !task.link && (
          <button
            onClick={() => onAcknowledge(task.id)}
            disabled={acknowledging === task.id}
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-40"
          >
            {acknowledging === task.id ? '…' : 'Mark Done'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main export ────────────────────────────────────────── */
export default function TaskStatusBar({ compact = false, patientId = null }) {
  const { user } = useAuth();
  const qc       = useQueryClient();
  const [expanded,     setExpanded]     = useState(false);
  const [acknowledging,setAcknowledging]= useState(null);

  const endpoint = patientId
    ? `${API_URL}/api/compliance/patient/${patientId}`
    : `${API_URL}/api/compliance/my-tasks`;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['task-status', patientId, user?.id],
    queryFn:  () => axios.get(endpoint, { headers: authH() }).then(r => r.data),
    refetchInterval: 5 * 60 * 1000,
    enabled: !!user?.id,
    retry: false,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (taskId) =>
      axios.put(`${API_URL}/api/compliance/acknowledge`, { task_id: taskId }, { headers: authH() }),
    onMutate:  (id) => setAcknowledging(id),
    onSuccess: ()  => { qc.invalidateQueries({ queryKey: ['task-status'] }); toast.success('Task marked done'); },
    onError:   ()  => toast.error('Could not update task'),
    onSettled: ()  => setAcknowledging(null),
  });

  const tasks    = data?.tasks    || [];
  const reqTotal = data?.required_total    ?? 0;
  const reqDone  = data?.required_completed ?? 0;
  const pct      = data?.completion_pct    ?? 0;
  const allDone  = data?.all_required_done ?? (reqTotal === 0);
  const message  = data?.message;

  /* ── Nothing to show ─────────────── */
  if (!user || (!isLoading && tasks.length === 0)) return null;
  if (message && tasks.length === 0) return null;

  /* ── COMPACT — header pill ───────────────────────────────
   *  Lives inside the dark teal navigation bar.
   *  Uses white/translucent colours so it looks native there.
   * ────────────────────────────────────────────────────── */
  if (compact) {
    if (isLoading) return null;

    const pendingReq = tasks.filter(t => t.required && !t.done);
    const allReqDone = pendingReq.length === 0 && reqTotal > 0;
    const dotColor   = allReqDone
      ? 'bg-emerald-400'
      : pendingReq.length > 0
        ? 'bg-red-400 animate-pulse'
        : 'bg-slate-400';

    return (
      <div
        className="flex items-center gap-2 px-2.5 py-1 rounded-full cursor-default select-none"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
        title={`Today's tasks: ${reqDone}/${reqTotal} required done`}
      >
        {/* Mini ring */}
        <Ring pct={pct} size={26} light />

        {/* Status dots — one per required task, max 4 */}
        <div className="flex gap-1 items-center">
          {tasks.filter(t => t.required).slice(0, 4).map(t => (
            <div
              key={t.id}
              title={t.name}
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${t.done ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`}
            />
          ))}
        </div>

        {/* Text label */}
        <span className="text-[11px] font-semibold text-white/80 whitespace-nowrap hidden md:block">
          {allReqDone
            ? <span className="text-emerald-300">All done ✓</span>
            : <span>{reqDone}<span className="text-white/40">/{reqTotal}</span></span>
          }
        </span>
      </div>
    );
  }

  /* ── FULL — expandable content card ──────────────────────
   *  Lives on the page, below the header.
   *  Clean white card, no heavy background colour tint.
   * ────────────────────────────────────────────────────── */
  const pendingCount  = tasks.filter(t => t.required && !t.done).length;
  const requiredTasks = tasks.filter(t => t.required);
  const optionalTasks = tasks.filter(t => !t.required);

  // Subtle left-border colour only — no background tint
  const accentColor = allDone ? '#059669' : pendingCount > 0 ? '#ef4444' : '#d97706';

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      {/* ── Collapsed header (always visible) ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
      >
        {/* Ring */}
        {isLoading
          ? <Loader2 size={26} className="animate-spin text-slate-300 flex-shrink-0"/>
          : <Ring pct={pct} size={40}/>
        }

        {/* Summary text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              {allDone ? 'All tasks complete for today ✓' : "Today's Care Tasks"}
            </p>
            {!allDone && pendingCount > 0 && (
              <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                {pendingCount} pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {reqDone} of {reqTotal} required done
            {optionalTasks.length > 0 && ` · ${optionalTasks.filter(t=>t.done).length}/${optionalTasks.length} optional`}
          </p>
          {/* Thin progress bar */}
          <div className="mt-1.5 h-1 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
            <div
              className="h-1 rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: accentColor }}
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); refetch(); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-teal-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={12}/>
          </button>
          <div className="text-slate-400">
            {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </div>
        </div>
      </button>

      {/* ── Expanded task list ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              <div className="h-px bg-slate-100 dark:bg-slate-700 mb-3"/>

              {/* Required tasks */}
              {requiredTasks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ">
                    Required Today — {reqDone}/{reqTotal}
                  </p>
                  {requiredTasks.map(task => (
                    <TaskRow
                      key={task.id} task={task}
                      onAcknowledge={id => acknowledgeMutation.mutate(id)}
                      acknowledging={acknowledging}
                    />
                  ))}
                </div>
              )}

              {/* Optional tasks */}
              {optionalTasks.length > 0 && (
                <div className="space-y-2 mt-3">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500  mt-1">
                    Optional
                  </p>
                  {optionalTasks.map(task => (
                    <TaskRow
                      key={task.id} task={task}
                      onAcknowledge={id => acknowledgeMutation.mutate(id)}
                      acknowledging={acknowledging}
                    />
                  ))}
                </div>
              )}

              {/* All done banner */}
              {allDone && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 mt-2">
                  <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0"/>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    All required tasks complete — well done!
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
