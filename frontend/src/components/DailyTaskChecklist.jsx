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
 * <DailyTaskChecklist compact /> - mini version for dashboard
 * <DailyTaskChecklist /> - full version for patient portal
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
 heart: Heart,
 pill: Pill,
 book: Book,
 activity: Activity,
 clipboard: Clipboard,
 calendar: Calendar,
};

const TYPE_CFG = {
 compulsory_daily: {
 label: 'Required Today',
 dotColor: 'bg-red-500',
 badgeCls: 'bg-red-600 text-white',
 ringColor: 'ring-red-200',
 },
 optional_daily: {
 label: 'Optional',
 dotColor: 'bg-teal-400',
 badgeCls: 'bg-teal-600 text-white',
 ringColor: 'ring-teal-200',
 },
 appointment: {
 label: 'Appointment',
 dotColor: 'bg-teal-500',
 badgeCls: 'bg-teal-600 text-white',
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
 onSuccess: () => {
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
 const optional = tasks.filter(t => !t.required && t.type !== 'appointment');
 const appts = tasks.filter(t => t.type === 'appointment');

 // ── Compact mode - for dashboard card ─────────────────────────────────
 if (compact) {
 return (
 <div className="rounded-2xl border border-[var(--card-border)] p-4"
 style={{ background: 'var(--card-bg, #e8fafa)' }}>
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <ProgressRing pct={completion_pct} size={44} />
 <div>
 <p className="font-bold text-[var(--text-800)] text-sm">Today's Tasks</p>
 <p className="text-xs text-[var(--text-500)] dark:text-slate-400">
 {required_completed}/{required_total} required complete
 </p>
 </div>
 </div>
 <button onClick={() => refetch()}
 className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-[var(--text-400)] transition">
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
 : 'bg-[var(--card-bg)]/40 border border-[var(--card-border)]/50 hover:bg-slate-100'
 }`}>
 {task.done
 ? <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
 : task.required
 ? <AlertCircle size={15} className="text-red-500 flex-shrink-0 animate-pulse" />
 : <Circle size={15} className="text-[var(--text-400)] flex-shrink-0" />
 }
 <span className={`text-xs font-semibold truncate ${
 task.done ? 'text-emerald-700 dark:text-emerald-300' :
 task.required ? 'text-red-700 dark:text-red-300' :
 'text-[var(--text-600)]'
 }`}>{task.name}</span>
 {!task.done && <ChevronRight size={12} className="ml-auto text-[var(--text-400)] flex-shrink-0" />}
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
 const isCaregiverView = !!patientId;
 const pendingRequired = required.filter(t => !t.done).length;

 return (
 <div className="rounded-2xl border border-[var(--card-border)] overflow-hidden"
   style={{ background: 'var(--card-bg)' }}>

   {/* ── Header ── */}
   <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--card-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
     <div style={{ display:'flex', alignItems:'center', gap:12 }}>
       <ProgressRing pct={completion_pct} size={44} />
       <div>
         <div style={{ display:'flex', alignItems:'center', gap:8 }}>
           <h3 style={{ fontWeight:700, fontSize:14, color:'var(--text-900)', margin:0 }}>Today's Care Tasks</h3>
           {pendingRequired > 0 && (
             <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99, background:'#ef4444', color:'#fff' }}>
               {pendingRequired} pending
             </span>
           )}
         </div>
         <p style={{ fontSize:12, color:'var(--text-500)', margin:'2px 0 0' }}>
           {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })}
           {' · '}{required_completed}/{required_total} required done
         </p>
       </div>
     </div>
     <button onClick={() => refetch()}
       style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:10, border:'1px solid var(--card-border)', background:'transparent', cursor:'pointer', fontSize:12, color:'var(--text-500)', fontWeight:600 }}
       onMouseEnter={e=>e.currentTarget.style.background='var(--page-bg)'}
       onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
       <RefreshCw size={12} /> Refresh
     </button>
   </div>

   {/* ── Task groups ── */}
   <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:16 }}>

     {/* Required tasks */}
     {required.length > 0 && (
       <div>
         <p style={{ fontSize:11, fontWeight:700, color:'var(--text-400)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
           <Lock size={10} style={{ color:'#f87171' }} /> Required daily · {required_completed}/{required_total}
         </p>
         <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
           {required.map(task => {
             const Icon = ICON_MAP[task.icon] || Activity;
             return (
               <motion.div key={task.id} layout
                 onClick={() => !task.done && task.link && navigate(task.link)}
                 style={{
                   display:'flex', alignItems:'center', gap:12,
                   padding:'12px 14px', borderRadius:12,
                   background: task.done ? '#f0fdf4' : 'var(--page-bg)',
                   border: `1px solid ${task.done ? '#bbf7d0' : 'var(--card-border)'}`,
                   transition:'all 0.15s',
                   cursor: task.done ? 'default' : 'pointer',
                 }}
                 whileHover={!task.done ? { x: 2 } : {}}
               >                 {/* Icon */}
                 <div style={{
                   width:36, height:36, borderRadius:10, flexShrink:0,
                   background: task.done ? '#dcfce7' : `${task.done ? '#dcfce7' : '#0d948815'}`,
                   display:'flex', alignItems:'center', justifyContent:'center',
                 }}>
                   {task.done
                     ? <CheckCircle2 size={16} style={{ color:'#16a34a' }} />
                     : <Icon size={16} style={{ color:'#0d9488' }} />}
                 </div>
                 {/* Text */}
                 <div style={{ flex:1, minWidth:0 }}>
                   <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                     <p style={{ fontWeight:600, fontSize:13, color: task.done ? '#15803d' : 'var(--text-900)', margin:0, textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.7 : 1 }}>
                       {task.name}
                     </p>
                     {!task.done && (
                       <span style={{ fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:99, background:'#fef2f2', color:'#dc2626', border:'1px solid #fca5a5' }}>
                         Required
                       </span>
                     )}
                   </div>
                   {task.description && (
                     <p style={{ fontSize:11, color:'var(--text-500)', margin:'2px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task.description}</p>
                   )}
                 </div>
                 {/* CTA */}
                 {task.done
                   ? <CheckCircle2 size={18} style={{ color:'#22c55e', flexShrink:0 }} />
                   : <button onClick={() => navigate(task.link)}
                       style={{ flexShrink:0, display:'flex', alignItems:'center', gap:4, padding:'8px 14px', borderRadius:10, background:'linear-gradient(135deg,#0d9488,#0891b2)', color:'#fff', border:'none', cursor:'pointer', fontSize:12, fontWeight:700, whiteSpace:'nowrap' }}>
                       {isCaregiverView ? 'Do Now' : 'Do it'} <ChevronRight size={12} />
                     </button>
                 }
               </motion.div>
             );
           })}
         </div>
       </div>
     )}

     {/* Appointments */}
     {appts.length > 0 && (
       <div>
         <p style={{ fontSize:11, fontWeight:700, color:'var(--text-400)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
           <Calendar size={10} style={{ color:'#0891b2' }} /> Appointments
         </p>
         <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
           {appts.map(task => (
             <div key={task.id} style={{
               display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
               borderRadius:12, background:'#eff6ff', border:'1px solid #bfdbfe' }}>
               <Calendar size={16} style={{ color:'#0891b2', flexShrink:0 }} />
               <div style={{ flex:1, minWidth:0 }}>
                 <p style={{ fontWeight:600, fontSize:13, color:'#1e40af', margin:0 }}>{task.name}</p>
                 <p style={{ fontSize:11, color:'#3b82f6', margin:'2px 0 0' }}>{task.description}</p>
               </div>
               <button onClick={() => navigate(task.link)}
                 style={{ flexShrink:0, padding:'6px 12px', borderRadius:8, background:'#0891b2', color:'#fff', border:'none', cursor:'pointer', fontSize:12, fontWeight:700 }}>
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
         <p style={{ fontSize:11, fontWeight:700, color:'var(--text-400)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
           Optional today
         </p>
         <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
           {optional.map(task => {
             const Icon = ICON_MAP[task.icon] || Activity;
             const isPending = acknowledgeMutation.isPending && acknowledgeMutation.variables === task.id;
             return (
               <div key={task.id} style={{
                 display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                 borderRadius:12, background: task.done ? '#f0fdf4' : 'var(--page-bg)',
                 border:`1px solid ${task.done ? '#bbf7d0' : 'var(--card-border)'}`,
                 transition:'all 0.15s',
                 cursor: task.done ? 'default' : 'pointer',
               }}
               onClick={() => !task.done && task.link && navigate(task.link)}>
                 <div style={{ width:34, height:34, borderRadius:10, flexShrink:0, background: task.done ? '#dcfce7' : '#0d948815', display:'flex', alignItems:'center', justifyContent:'center' }}>
                   {task.done ? <CheckCircle2 size={15} style={{ color:'#16a34a' }} /> : <Icon size={15} style={{ color:'#0d9488' }} />}
                 </div>
                 <div style={{ flex:1, minWidth:0 }}>
                   <p style={{ fontWeight:600, fontSize:13, color: task.done ? '#15803d' : 'var(--text-800)', margin:0, textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.7 : 1 }}>{task.name}</p>
                   {task.description && <p style={{ fontSize:11, color:'var(--text-500)', margin:'2px 0 0' }}>{task.description}</p>}
                 </div>
                 {!task.done && (
                   <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                     {task.link && (
                       <button onClick={() => navigate(task.link)}
                         style={{ padding:'7px 12px', borderRadius:9, border:'1.5px solid #0d9488', color:'#0d9488', background:'transparent', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                         Start
                       </button>
                     )}
                     <button onClick={() => acknowledgeMutation.mutate(task.id)} disabled={isPending}
                       style={{ padding:'7px 12px', borderRadius:9, background:'var(--card-bg)', border:'1px solid var(--card-border)', color:'var(--text-600)', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                       {isPending ? '...' : 'Done'}
                     </button>
                   </div>
                 )}
               </div>
             );
           })}
         </div>
       </div>
     )}

     {/* All done */}
     <AnimatePresence>
       {all_required_done && (
         <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
           style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#f0fdf4', borderRadius:12, border:'1px solid #bbf7d0' }}>
           <CheckCircle2 size={20} style={{ color:'#16a34a', flexShrink:0 }} />
           <div>
             <p style={{ fontWeight:700, fontSize:13, color:'#15803d', margin:0 }}>All required tasks complete!</p>
             <p style={{ fontSize:11, color:'#16a34a', margin:'2px 0 0' }}>Great work today. Your care team has been notified.</p>
           </div>
         </motion.div>
       )}
     </AnimatePresence>

   </div>
 </div>
 );
}
