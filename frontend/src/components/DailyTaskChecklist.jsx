/**
 * DailyTaskChecklist
 * Redesigned: tasks clickable to destinations, dark mode modal fixed,
 * Refresh/End buttons fixed (no blur), Do Now working, compact mode clean.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Circle, AlertCircle, Calendar,
  Heart, Pill, Book, Activity, Clipboard,
  ChevronRight, RefreshCw, Loader2, Lock,
  X, ListChecks, Zap, ArrowRight,
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../api/client';
import toast from '../utils/toast';

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

const ICON_MAP = {
  heart: Heart, pill: Pill, book: Book,
  activity: Activity, clipboard: Clipboard, calendar: Calendar,
};

// Map task types/names to navigate destinations
function getTaskDestination(task) {
  if (task.link) return task.link;
  const name = (task.name || '').toLowerCase();
  const patId = task.patient_id;
  if (name.includes('vital') && patId)     return `/patients/${patId}/vitals`;
  if (name.includes('esas') && patId)       return `/assessments/${patId}/esas`;
  if (name.includes('assessment') && patId) return `/assessments/${patId}`;
  if (name.includes('medication'))           return '/medications';
  if (name.includes('appointment'))          return '/appointments';
  if (name.includes('symptom') && patId)    return `/patients/${patId}/symptoms`;
  if (name.includes('wound') && patId)      return `/patients/${patId}/wound-care`;
  if (name.includes('pps') && patId)        return `/assessments/${patId}/pps`;
  if (name.includes('wellbeing') || name.includes('wellness')) return '/wellness-checkin';
  if (name.includes('message'))             return '/messages';
  if (patId)                                return `/patients/${patId}`;
  return '/dashboard';
}

function ProgressRing({ pct, size = 44 }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct / 100);
  const color = pct === 100 ? '#059669' : pct >= 50 ? '#d97706' : '#dc2626';
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--card-border)" strokeWidth="5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={dash}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      <text x={size/2} y={size/2+4} textAnchor="middle" fontSize="11" fontWeight="bold" fill={color}>
        {pct}%
      </text>
    </svg>
  );
}

/* ── Task Row ────────────────────────────────────────────────────────────── */
function TaskRow({ task, onNavigate, isCaregiverView, onAcknowledge, ackPending }) {
  const Icon = ICON_MAP[task.icon] || Activity;
  const dest = getTaskDestination(task);

  const handleClick = () => {
    if (!task.done) onNavigate(dest);
  };

  return (
    <motion.div
      layout
      onClick={handleClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer group ${
        task.done
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 cursor-default'
          : task.required
          ? 'bg-[var(--page-bg)] border-[var(--card-border)] hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20'
          : 'bg-[var(--page-bg)] border-[var(--card-border)] hover:border-[var(--text-400)]'
      }`}
      whileHover={!task.done ? { x: 2 } : {}}
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        task.done ? 'bg-emerald-100 dark:bg-emerald-800/40' : 'bg-[var(--card-bg)] border border-[var(--card-border)]'
      }`}>
        {task.done
          ? <CheckCircle2 size={15} className="text-emerald-600" />
          : <Icon size={15} className="text-teal-600" />}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-semibold truncate ${
            task.done
              ? 'text-emerald-700 dark:text-emerald-300 line-through opacity-70'
              : 'text-[var(--text-900)]'
          }`}>
            {task.name}
          </p>
          {!task.done && task.required && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 flex-shrink-0">
              Required
            </span>
          )}
        </div>
        {task.description && (
          <p className="text-xs text-[var(--text-400)] truncate mt-0.5">{task.description}</p>
        )}
      </div>

      {/* CTA */}
      {task.done ? (
        <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
      ) : task.required ? (
        <button
          onClick={e => { e.stopPropagation(); onNavigate(dest); }}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors"
        >
          {isCaregiverView ? 'Do Now' : 'Do it'} <ArrowRight size={11} />
        </button>
      ) : (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {dest && (
            <button
              onClick={e => { e.stopPropagation(); onNavigate(dest); }}
              className="px-2.5 py-1.5 rounded-lg border border-teal-500 text-teal-600 dark:text-teal-400 bg-transparent hover:bg-teal-50 dark:hover:bg-teal-900/30 text-xs font-semibold transition-colors"
            >
              Start
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onAcknowledge(task.id); }}
            disabled={ackPending}
            className="px-2.5 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-600)] hover:bg-[var(--page-bg)] text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {ackPending ? '...' : 'Done'}
          </button>
        </div>
      )}
    </motion.div>
  );
}

/* ── Full modal (portal) ─────────────────────────────────────────────────── */
function TaskModal({ data, onClose, onNavigate, onAcknowledge, ackMutation, onRefetch, isRefetching }) {
  const { tasks, required_total, required_completed, completion_pct, all_required_done } = data;
  const required = tasks.filter(t => t.required);
  const optional = tasks.filter(t => !t.required && t.type !== 'appointment');
  const appts    = tasks.filter(t => t.type === 'appointment');
  const pending  = required.filter(t => !t.done).length;

  return createPortal(
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          key="dtc-bg"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 9400, background: 'rgba(0,0,0,0.5)' }}
        />

        {/* Modal card */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 9401, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, pointerEvents: 'none' }}>
          <motion.div
            key="dtc-card"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            onClick={e => e.stopPropagation()}
            style={{
              pointerEvents: 'all',
              background: 'var(--card-bg)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 560,
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
              border: '1px solid var(--card-border)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid var(--card-border)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ProgressRing pct={completion_pct} size={40} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-900)', margin: 0 }}>
                    Today's Care Tasks
                    {pending > 0 && (
                      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#ef4444', color: '#fff' }}>
                        {pending} pending
                      </span>
                    )}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-400)', margin: '2px 0 0' }}>
                    {required_completed}/{required_total} required done
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={onRefetch}
                  disabled={isRefetching}
                  style={{
                    width: 34, height: 34, borderRadius: 10,
                    border: '1px solid var(--card-border)',
                    background: 'var(--page-bg)',
                    color: 'var(--text-500)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  title="Refresh tasks"
                >
                  <RefreshCw size={14} style={{ animation: isRefetching ? 'spin 1s linear infinite' : 'none' }} />
                </button>
                <button
                  onClick={onClose}
                  style={{
                    width: 34, height: 34, borderRadius: 10,
                    border: '1px solid var(--card-border)',
                    background: 'var(--page-bg)',
                    color: 'var(--text-500)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Required */}
              {required.length > 0 && (
                <section>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-400)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Lock size={10} style={{ color: '#f87171' }} />
                    Required Today - {required_completed}/{required_total}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {required.map(task => (
                      <TaskRow key={task.id} task={task} onNavigate={dest => { onNavigate(dest); onClose(); }}
                        isCaregiverView={!!task.patient_id}
                        onAcknowledge={onAcknowledge}
                        ackPending={ackMutation.isPending && ackMutation.variables === task.id} />
                    ))}
                  </div>
                </section>
              )}

              {/* Appointments */}
              {appts.length > 0 && (
                <section>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-400)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Calendar size={10} style={{ color: '#0891b2' }} /> Appointments
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {appts.map(task => (
                      <div key={task.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                        borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe',
                      }}>
                        <Calendar size={15} style={{ color: '#0891b2', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, color: '#1e40af', margin: 0 }}>{task.name}</p>
                          <p style={{ fontSize: 11, color: '#3b82f6', margin: '2px 0 0' }}>{task.description}</p>
                        </div>
                        <button onClick={() => { onNavigate(getTaskDestination(task)); onClose(); }}
                          style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 8, background: '#0891b2', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Optional */}
              {optional.length > 0 && (
                <section>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-400)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                    Optional today
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {optional.map(task => (
                      <TaskRow key={task.id} task={task}
                        onNavigate={dest => { onNavigate(dest); onClose(); }}
                        isCaregiverView={!!task.patient_id}
                        onAcknowledge={onAcknowledge}
                        ackPending={ackMutation.isPending && ackMutation.variables === task.id} />
                    ))}
                  </div>
                </section>
              )}

              {/* All done */}
              {all_required_done && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                  <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: '#15803d', margin: 0 }}>All required tasks complete!</p>
                    <p style={{ fontSize: 11, color: '#16a34a', margin: '2px 0 0' }}>Great work today. Your care team has been notified.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </>
    </AnimatePresence>,
    document.body
  );
}

/* ── TaskStatusBar - inline collapsed view ──────────────────────────────── */
export function TaskStatusBar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['daily-tasks', null],
    queryFn: () => axios.get(`${API_URL}/api/compliance/my-tasks`, { headers: authH() }).then(r => r.data),
    staleTime: 2 * 60 * 1000,
    retry: false,
  });

  const ackMutation = useMutation({
    mutationFn: (taskId) => axios.put(`${API_URL}/api/compliance/acknowledge`, { task_id: taskId }, { headers: authH() }),
    onSuccess: () => { toast.success('Task acknowledged'); queryClient.invalidateQueries({ queryKey: ['daily-tasks'] }); },
    onError: () => toast.error('Could not acknowledge task'),
  });

  if (isLoading || !data?.tasks) return null;

  const { tasks, required_total, required_completed, completion_pct } = data;
  const pending = tasks.filter(t => t.required && !t.done).length;

  return (
    <>
      {/* Collapsed bar */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <ProgressRing pct={completion_pct} size={40} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-[var(--text-900)]">Today's Care Tasks</span>
              {pending > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                  {pending} pending
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-400)] mt-0.5">
              {required_completed}/{required_total} required done
              {tasks.filter(t => !t.required).length > 0 && ` · ${tasks.filter(t => !t.required && !t.done).length}/${tasks.filter(t => !t.required).length} optional`}
            </p>
          </div>
          {/* Refresh - visible, proper contrast */}
          <button
            onClick={e => { e.stopPropagation(); refetch(); }}
            disabled={isFetching}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--page-bg)] border border-[var(--card-border)] text-[var(--text-500)] hover:text-teal-600 hover:border-teal-400 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={13} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          {/* Expand */}
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors"
          >
            <ListChecks size={12} /> View All
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[var(--card-border)] mx-4 mb-3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${completion_pct}%`,
              background: completion_pct === 100 ? '#059669' : completion_pct >= 50 ? '#d97706' : '#dc2626',
            }}
          />
        </div>

        {/* Preview: first 3 pending required tasks */}
        {tasks.filter(t => t.required && !t.done).length > 0 && (
          <div className="px-4 pb-3 space-y-1.5">
            {tasks.filter(t => t.required && !t.done).slice(0, 3).map(task => {
              const Icon = ICON_MAP[task.icon] || Activity;
              const dest = getTaskDestination(task);
              return (
                <button
                  key={task.id}
                  onClick={() => navigate(dest)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--page-bg)] border border-[var(--card-border)] hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors text-left group"
                >
                  <Icon size={13} className="text-teal-600 flex-shrink-0" />
                  <span className="flex-1 min-w-0 text-xs font-semibold text-[var(--text-800)] truncate">{task.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex-shrink-0">Required</span>
                  <ChevronRight size={12} className="text-[var(--text-400)] group-hover:text-teal-500 flex-shrink-0" />
                </button>
              );
            })}
            {tasks.filter(t => t.required && !t.done).length > 3 && (
              <button
                onClick={() => setOpen(true)}
                className="w-full text-center text-xs font-semibold text-teal-600 hover:text-teal-700 py-1 transition-colors"
              >
                +{tasks.filter(t => t.required && !t.done).length - 3} more tasks - view all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Full modal */}
      {open && (
        <TaskModal
          data={data}
          onClose={() => setOpen(false)}
          onNavigate={dest => navigate(dest)}
          onAcknowledge={id => ackMutation.mutate(id)}
          ackMutation={ackMutation}
          onRefetch={refetch}
          isRefetching={isFetching}
        />
      )}
    </>
  );
}

/* ── Default export - full page mode ────────────────────────────────────── */
export default function DailyTaskChecklist({ compact = false, patientId = null }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const endpoint = patientId
    ? `${API_URL}/api/compliance/patient/${patientId}`
    : `${API_URL}/api/compliance/my-tasks`;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['daily-tasks', patientId],
    queryFn: () => axios.get(endpoint, { headers: authH() }).then(r => r.data),
    staleTime: 2 * 60 * 1000,
    retry: false,
  });

  const ackMutation = useMutation({
    mutationFn: (taskId) => axios.put(`${API_URL}/api/compliance/acknowledge`,
      { task_id: taskId }, { headers: authH() }),
    onSuccess: () => {
      toast.success('Task acknowledged');
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
    },
    onError: () => toast.error('Could not acknowledge task'),
  });

  if (isLoading) return (
    <div className="flex items-center gap-2 p-4 text-[var(--text-400)]">
      <Loader2 size={15} className="animate-spin" />
      <span className="text-sm">Loading today's tasks...</span>
    </div>
  );

  if (!data?.tasks) return null;

  const { tasks, required_total, required_completed, completion_pct, all_required_done } = data;
  const required = tasks.filter(t => t.required);
  const optional = tasks.filter(t => !t.required && t.type !== 'appointment');
  const appts    = tasks.filter(t => t.type === 'appointment');
  const pending  = required.filter(t => !t.done).length;

  /* Compact mode - for dashboard sidebar */
  if (compact) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <ProgressRing pct={completion_pct} size={40} />
            <div>
              <p className="text-sm font-bold text-[var(--text-800)]">Today's Tasks</p>
              <p className="text-xs text-[var(--text-400)]">{required_completed}/{required_total} required</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--page-bg)] border border-[var(--card-border)] text-[var(--text-500)] hover:text-teal-600 hover:border-teal-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
        <div className="space-y-1.5">
          {required.slice(0, 3).map(task => {
            const Icon = ICON_MAP[task.icon] || Activity;
            const dest = getTaskDestination(task);
            return (
              <button key={task.id}
                onClick={() => !task.done && navigate(dest)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all ${
                  task.done
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-[var(--page-bg)] border border-[var(--card-border)] hover:border-teal-400'
                }`}>
                {task.done
                  ? <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                  : <Icon size={13} className="text-teal-600 flex-shrink-0" />}
                <span className={`text-xs font-semibold flex-1 truncate ${task.done ? 'text-emerald-700 dark:text-emerald-300 line-through opacity-70' : 'text-[var(--text-700)]'}`}>
                  {task.name}
                </span>
                {!task.done && <ChevronRight size={11} className="text-[var(--text-400)] flex-shrink-0" />}
              </button>
            );
          })}
        </div>
        {all_required_done && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">All required tasks done!</p>
          </div>
        )}
      </div>
    );
  }

  /* Full inline mode */
  return (
    <>
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)]">
          <div className="flex items-center gap-3">
            <ProgressRing pct={completion_pct} size={40} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-[var(--text-900)]">Today's Care Tasks</span>
                {pending > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                    {pending} pending
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-400)] mt-0.5">
                {required_completed}/{required_total} required done
                {optional.length > 0 && ` · ${tasks.filter(t => !t.required && !t.done).length}/${optional.length} optional`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--page-bg)] border border-[var(--card-border)] text-[var(--text-500)] hover:text-teal-600 hover:border-teal-400 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={13} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--page-bg)] border border-[var(--card-border)] text-[var(--text-600)] hover:border-teal-400 hover:text-teal-600 text-xs font-semibold transition-colors"
            >
              <ListChecks size={12} /> Expand
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[var(--card-border)] mx-4 mt-3 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${completion_pct}%`, background: completion_pct === 100 ? '#059669' : completion_pct >= 50 ? '#d97706' : '#dc2626' }} />
        </div>

        {/* Task list */}
        <div className="p-4 space-y-3">
          {/* Required */}
          {required.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[var(--text-400)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lock size={9} className="text-red-400" /> Required Today - {required_completed}/{required_total}
              </p>
              <div className="space-y-1.5">
                {required.map(task => (
                  <TaskRow key={task.id} task={task}
                    onNavigate={dest => navigate(dest)}
                    isCaregiverView={!!task.patient_id}
                    onAcknowledge={id => ackMutation.mutate(id)}
                    ackPending={ackMutation.isPending && ackMutation.variables === task.id} />
                ))}
              </div>
            </div>
          )}

          {/* Appointments */}
          {appts.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[var(--text-400)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar size={9} className="text-blue-400" /> Appointments
              </p>
              <div className="space-y-1.5">
                {appts.map(task => (
                  <button key={task.id}
                    onClick={() => navigate(getTaskDestination(task))}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left">
                    <Calendar size={14} className="text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 truncate">{task.name}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{task.description}</p>
                    </div>
                    <ChevronRight size={13} className="text-blue-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Optional */}
          {optional.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[var(--text-400)] uppercase tracking-wider mb-2">
                Optional today
              </p>
              <div className="space-y-1.5">
                {optional.map(task => (
                  <TaskRow key={task.id} task={task}
                    onNavigate={dest => navigate(dest)}
                    isCaregiverView={!!task.patient_id}
                    onAcknowledge={id => ackMutation.mutate(id)}
                    ackPending={ackMutation.isPending && ackMutation.variables === task.id} />
                ))}
              </div>
            </div>
          )}

          {all_required_done && (
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">All required tasks complete!</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Great work today.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full modal */}
      {open && (
        <TaskModal
          data={data}
          onClose={() => setOpen(false)}
          onNavigate={dest => navigate(dest)}
          onAcknowledge={id => ackMutation.mutate(id)}
          ackMutation={ackMutation}
          onRefetch={refetch}
          isRefetching={isFetching}
        />
      )}
    </>
  );
}
