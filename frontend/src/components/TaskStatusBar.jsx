/**
 * TaskStatusBar - Universal task completion widget
 * ================================================
 * compact - header pill: fits the dark teal nav bar
 * full - expandable card on every page
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
 CheckCircle2, Circle, AlertCircle, ChevronDown, ChevronUp,
 Calendar, Heart, Pill, Activity, Clipboard, Book,
 RefreshCw, Loader2, ClipboardCheck, ListChecks, X, Lock,
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
 const r = (size - 6) / 2;
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
 <svg width={size} height={size} className="flex-shrink-0" style={{ display:'block' }}>
 {/* Track */}
 <circle cx={cx} cy={cy} r={r} fill="none"
 stroke={light ? 'rgba(255,255,255,0.20)' : '#e5e7eb'} strokeWidth="4"/>
 {/* Progress arc */}
 <circle cx={cx} cy={cy} r={r} fill="none"
 stroke={color} strokeWidth="4"
 strokeDasharray={circ} strokeDashoffset={dash}
 strokeLinecap="round"
 transform={`rotate(-90 ${cx} ${cy})`}
 style={{ transition: 'stroke-dashoffset 0.6s ease' }}/>
 {/* Percentage - bold, crisp */}
 <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
 fontSize={size <= 28 ? '9' : '10'} fontWeight="900"
 fontFamily="system-ui, sans-serif"
 fill={light ? '#ffffff' : color}
 style={{ letterSpacing: '-0.5px' }}>
 {pct}%
 </text>
 </svg>
 );
}

/* ── Task row in full card ──────────────────────────────── */
function TaskRow({ task, onAcknowledge, acknowledging }) {
 const navigate = useNavigate();
 const Icon = ICON_MAP[task.icon] || Activity;
 const isReq = task.required;
 const isAppt = task.type === 'appointment';

 // Resolve destination — use task.link first, fall back by task name
 const getDestination = () => {
   const pid = task.patient_id;
   if (task.link && !task.link.includes('{patient_id}')) return task.link;
   if (task.link && pid) return task.link.replace('{patient_id}', pid);
   const name = (task.name || '').toLowerCase();
   if (name.includes('vital') && pid)      return `/patients/${pid}/vitals`;
   if (name.includes('esas') && pid)        return `/assessments/${pid}/esas`;
   if (name.includes('pps') && pid)         return `/assessments/${pid}/pps`;
   if (name.includes('assessment') && pid)  return `/assessments/${pid}`;
   if (name.includes('medication'))          return '/medications';
   if (name.includes('appointment'))         return '/appointments';
   if (name.includes('symptom') && pid)     return `/patients/${pid}/symptoms`;
   if (name.includes('wound') && pid)       return `/patients/${pid}/wound-care`;
   if (name.includes('wellness') || name.includes('wellbeing')) return '/wellness-checkin';
   if (name.includes('message'))            return '/messages';
   if (pid)                                  return `/patients/${pid}`;
   return '/dashboard';
 };

 const dest = getDestination();

 return (
 <motion.div
 initial={{ opacity: 0, x: -6 }}
 animate={{ opacity: 1, x: 0 }}
 onClick={() => { if (!task.done) navigate(dest); }}
 className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors border group ${
   task.done
     ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/20 cursor-default'
     : isReq
     ? 'bg-red-50/60 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 cursor-pointer hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20'
     : 'bg-[var(--page-bg)] border-[var(--card-border)] cursor-pointer hover:border-teal-400'
 }`}
 >
 {/* Status icon */}
 {task.done
   ? <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0"/>
   : isReq
   ? <AlertCircle size={16} className="text-red-400 flex-shrink-0"/>
   : <Circle size={16} className="text-slate-300 flex-shrink-0"/>
 }

 {/* Feature icon */}
 <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
   task.done ? 'bg-emerald-100 dark:bg-emerald-800/30' : isAppt ? 'bg-blue-100 dark:bg-blue-900/30' : isReq ? 'bg-red-50 dark:bg-red-900/20' : 'bg-[var(--card-bg)] border border-[var(--card-border)]'
 }`}>
   <Icon size={13} className={task.done ? 'text-emerald-600' : isAppt ? 'text-teal-600' : isReq ? 'text-teal-600' : 'text-[var(--text-500)]'}/>
 </div>

 {/* Text */}
 <div className="flex-1 min-w-0">
   <p className={`text-xs font-semibold leading-tight truncate ${
     task.done ? 'text-[var(--text-400)] line-through' : 'text-[var(--text-800)]'
   }`}>{task.name}</p>
   {task.description && !task.done && (
     <p className="text-[11px] text-[var(--text-400)] truncate mt-0.5">{task.description}</p>
   )}
 </div>

 {/* Action */}
 <div className="flex items-center gap-1.5 flex-shrink-0">
   {isReq && !task.done && (
     <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-600 text-white">Required</span>
   )}
   {!task.done && (
     <button
       onClick={e => { e.stopPropagation(); navigate(dest); }}
       className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors"
     >
       Do Now
     </button>
   )}
   {task.done && (
     <CheckCircle2 size={14} className="text-emerald-500"/>
   )}
 </div>
 </motion.div>
 );
}

/* ── Main export ────────────────────────────────────────── */
export default function TaskStatusBar({ compact = false, patientId = null }) {
 const { user } = useAuth();
 const navigate = useNavigate();
 const qc = useQueryClient();
 const [expanded, setExpanded] = useState(false);
 const [acknowledging,setAcknowledging]= useState(null);
 const [showModal, setShowModal] = useState(false);

 const endpoint = patientId
 ? `${API_URL}/api/compliance/patient/${patientId}`
 : `${API_URL}/api/compliance/my-tasks`;

 const { data, isLoading, refetch } = useQuery({
 queryKey: ['task-status', patientId, user?.id],
 queryFn: () => axios.get(endpoint, { headers: authH() }).then(r => r.data),
 refetchInterval: 5 * 60 * 1000,
 enabled: !!user?.id,
 retry: false,
 });

 const acknowledgeMutation = useMutation({
 mutationFn: (taskId) =>
 axios.put(`${API_URL}/api/compliance/acknowledge`, { task_id: taskId }, { headers: authH() }),
 onMutate: (id) => setAcknowledging(id),
 onSuccess: () => { qc.invalidateQueries({ queryKey: ['task-status'] }); toast.success('Task marked done'); },
 onError: () => toast.error('Could not update task'),
 onSettled: () => setAcknowledging(null),
 });

 const tasks = data?.tasks || [];
 const reqTotal = data?.required_total ?? 0;
 const reqDone = data?.required_completed ?? 0;
 const pct = data?.completion_pct ?? 0;
 const allDone = data?.all_required_done ?? (reqTotal === 0);
 const message = data?.message;

 /* ── Nothing to show ─────────────── */
 if (!user || (!isLoading && tasks.length === 0)) return null;
 if (message && tasks.length === 0) return null;

 /* ── COMPACT - header pill ───────────────────────────────
 * Lives inside the dark teal navigation bar.
 * Uses white/translucent colours so it looks native there.
 * ────────────────────────────────────────────────────── */
 if (compact) {
 if (isLoading) return null;

 const pendingReq = tasks.filter(t => t.required && !t.done);
 const allReqDone = pendingReq.length === 0 && reqTotal > 0;

 return (
 <>
 <button
 onClick={() => setShowModal(true)}
 className="flex items-center gap-2 px-3 py-1.5 rounded-full select-none"
 style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.30)', cursor:'pointer' }}
 title="View today's tasks"
 >
 {/* Percent badge */}
 <span style={{
 fontSize: 11, fontWeight: 900, color: '#fff',
 background: allReqDone ? 'rgba(52,211,153,0.35)' : pendingReq.length > 0 ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.15)',
 padding: '1px 6px', borderRadius: 99, lineHeight: '18px', letterSpacing: '-0.3px',
 border: `1px solid ${allReqDone ? 'rgba(52,211,153,0.5)' : pendingReq.length > 0 ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.2)'}`,
 }}>
 {pct}%
 </span>
 {/* Status dots */}
 <div className="flex gap-1.5 items-center">
 {tasks.filter(t => t.required).slice(0, 5).map(t => (
 <div key={t.id} title={t.name}
 style={{ width:8, height:8, borderRadius:'50%', flexShrink:0,
 background: t.done ? '#6ee7b7' : '#f87171',
 boxShadow: t.done ? '0 0 4px rgba(110,231,183,0.6)' : '0 0 4px rgba(248,113,113,0.6)',
 }} />
 ))}
 </div>
 {/* Count */}
 <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.90)', whiteSpace:'nowrap', letterSpacing:'-0.3px' }}>
 {allReqDone ? '✓ Done' : `${reqDone}/${reqTotal}`}
 </span>
 </button>

 {/* ── Task Modal Portal ── */}
 {showModal && typeof document !== 'undefined' && createPortal(
 <>
 <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
 onClick={() => setShowModal(false)}
 style={{position:'fixed',inset:0,zIndex:9000,background:'rgba(15,23,42,0.55)',backdropFilter:'blur(4px)'}} />
 <div style={{position:'fixed',inset:0,zIndex:9001,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'70px 16px 16px',pointerEvents:'none'}}>
 <motion.div initial={{opacity:0,y:-12,scale:0.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-12}}
 transition={{type:'spring',damping:30,stiffness:400}}
 onClick={e=>e.stopPropagation()}
 style={{pointerEvents:'all',background:'var(--card-bg)',border:'1px solid var(--card-border)',borderRadius:16,width:'100%',maxWidth:420,maxHeight:'80vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 12px 60px rgba(15,23,42,0.22)'}}>
 {/* Header */}
 <div style={{height:3,background:'linear-gradient(90deg,#0d9488,#0891b2)',flexShrink:0}} />
 <div style={{padding:'14px 18px',borderBottom:'1px solid var(--card-border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
 <div style={{display:'flex',alignItems:'center',gap:10}}>
 <ListChecks size={16} style={{color:'var(--c-teal)'}} />
 <div>
 <p style={{fontWeight:800,fontSize:14,color:'var(--text-900)',margin:0}}>Today's Care Tasks</p>
 <p style={{fontSize:11,color:'var(--text-400)',margin:0}}>{reqDone}/{reqTotal} required done</p>
 </div>
 </div>
 <div style={{display:'flex',gap:6}}>
 <button onClick={()=>refetch()} style={{width:28,height:28,borderRadius:8,background:'var(--page-bg)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-400)'}}>
 <RefreshCw size={12}/>
 </button>
 <button onClick={()=>setShowModal(false)} style={{width:28,height:28,borderRadius:8,background:'var(--page-bg)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-500)'}}>
 <X size={13}/>
 </button>
 </div>
 </div>
 {/* Task list */}
 <div style={{flex:1,overflowY:'auto',padding:'12px 14px',display:'flex',flexDirection:'column',gap:6}}>
 {tasks.filter(t=>t.required).length > 0 && (
 <p style={{fontSize:10,fontWeight:800,color:'var(--text-400)',textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 4px',display:'flex',alignItems:'center',gap:5}}>
 <Lock size={9} style={{color:'#f87171'}}/> Required today
 </p>
 )}
 {tasks.map(task => {
 const Icon = ICON_MAP[task.icon] || Activity;
 const isReq = task.required;
 return (
 <div key={task.id}
 onClick={() => {
                   if (!task.done) {
                     const pid = task.patient_id;
                     const link = task.link && pid ? task.link.replace('{patient_id}', pid) : task.link;
                     const name = (task.name || '').toLowerCase();
                     const dest = link || (name.includes('vital') && pid ? `/patients/${pid}/vitals` : name.includes('esas') && pid ? `/assessments/${pid}/esas` : name.includes('medication') ? '/medications' : name.includes('appointment') ? '/appointments' : pid ? `/patients/${pid}` : '/dashboard');
                     navigate(dest);
                     setShowModal(false);
                   }
                 }}
 style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,
 background: task.done ? '#f0fdf4' : isReq ? '#fef2f2' : 'var(--page-bg)',
 border:`1px solid ${task.done?'#bbf7d0':isReq?'#fca5a5':'var(--card-border)'}`,
 cursor: task.done ? 'default' : 'pointer',transition:'all 0.12s'}}>
 <div style={{width:30,height:30,borderRadius:9,background:task.done?'#dcfce7':isReq?'#fee2e2':'#0d948815',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
 {task.done ? <CheckCircle2 size={15} style={{color:'#16a34a'}}/> : <Icon size={14} style={{color:isReq?'#dc2626':'#0d9488'}}/>}
 </div>
 <div style={{flex:1,minWidth:0}}>
 <p style={{fontWeight:600,fontSize:12,color:task.done?'#15803d':isReq?'#dc2626':'var(--text-800)',margin:0,textDecoration:task.done?'line-through':'none',opacity:task.done?0.7:1}}>{task.name}</p>
 {task.description && <p style={{fontSize:11,color:'var(--text-400)',margin:'1px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.description}</p>}
 </div>
 {task.done
 ? <CheckCircle2 size={14} style={{color:'#22c55e',flexShrink:0}}/>
 : <button onClick={e=>{e.stopPropagation();acknowledgeMutation.mutate(task.id)}} disabled={acknowledging===task.id}
   style={{fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:7,background:'#0d9488',color:'#fff',border:'none',cursor:'pointer',opacity:acknowledging===task.id?0.5:1}}>
   {acknowledging===task.id?'...':'Do Now'}
 </button>
 }
 </div>
 );
 })}
 </div>
 </motion.div>
 </div>
 </>,
 document.body
 )}
 </>
 );
 }

 /* ── FULL - expandable content card ──────────────────────
 * Lives on the page, below the header.
 * Clean white card, no heavy background colour tint.
 * ────────────────────────────────────────────────────── */
 const pendingCount = tasks.filter(t => t.required && !t.done).length;
 const requiredTasks = tasks.filter(t => t.required);
 const optionalTasks = tasks.filter(t => !t.required);

 // Subtle left-border colour only - no background tint
 const accentColor = allDone ? '#059669' : pendingCount > 0 ? '#ef4444' : '#d97706';

 return (
 <div
 className="rounded-2xl border border-[var(--card-border)] overflow-hidden shadow-sm"
 style={{ borderLeft: `4px solid ${accentColor}`, background: 'var(--card-bg, #e8fafa)' }}
 >
 {/* ── Collapsed header (always visible) ── */}
 <button
 onClick={() => setExpanded(!expanded)}
 className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--card-bg)] dark:hover:bg-slate-700/40 transition-colors"
 >
 {/* Ring */}
 {isLoading
 ? <Loader2 size={26} className="animate-spin text-slate-300 flex-shrink-0"/>
 : <Ring pct={pct} size={40}/>
 }

 {/* Summary text */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <p className="text-sm font-bold text-[var(--text-800)] truncate">
 {allDone ? 'All tasks complete for today ✓' : "Today's Care Tasks"}
 </p>
 {!allDone && pendingCount > 0 && (
 <span className="flex-shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
 {pendingCount} pending
 </span>
 )}
 </div>
 <p className="text-xs text-[var(--text-500)] dark:text-[var(--text-400)] mt-0.5">
 {reqDone} of {reqTotal} required done
 {optionalTasks.length > 0 && ` · ${optionalTasks.filter(t=>t.done).length}/${optionalTasks.length} optional`}
 </p>
 {/* Thin progress bar */}
 <div className="mt-1.5 h-1 rounded-full bg-slate-200 overflow-hidden">
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
 className="p-1.5 rounded-lg bg-[var(--page-bg)] border border-[var(--card-border)] text-[var(--text-500)] hover:text-teal-600 hover:border-teal-400 transition-colors"
 title="Refresh"
 >
 <RefreshCw size={12}/>
 </button>
 <div className="text-[var(--text-400)]">
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
 <div className="h-px bg-slate-100 mb-3"/>

 {/* Required tasks */}
 {requiredTasks.length > 0 && (
 <div className="space-y-2">
 <p className="text-[11px] font-bold text-[var(--text-400)] dark:text-[var(--text-500)] ">
 Required Today - {reqDone}/{reqTotal}
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
 <p className="text-[11px] font-bold text-[var(--text-400)] dark:text-[var(--text-500)] mt-1">
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
 All required tasks complete - well done!
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
