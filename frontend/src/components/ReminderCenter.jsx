/**
 * ReminderCenter.jsx - Global reminder bell in the header
 * Accessible from every page. Users can set reminders for:
 * - Medications (with patient/med name)
 * - Appointments
 * - Wellness check-in
 * - Assessments
 * - Custom item
 *
 * Saves to localStorage for persistence and shows a browser notification
 * (if permission granted) or an in-app toast at the reminder time.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 BellRing, X, Plus, Clock, Repeat, Trash2, Check,
 Pill, Calendar, Activity, ClipboardList, Pencil,
 ChevronDown,
} from 'lucide-react';
import toast from '../utils/toast';
import { useAuth } from '../context/AuthContext';

/* ── Reminder types ───────────────────────────────────────────────────────── */
const TYPES = [
 { id: 'medication', label: 'Medication', icon: Pill, color: '#2563eb' },
 { id: 'appointment', label: 'Appointment', icon: Calendar, color: '#7c3aed' },
 { id: 'wellness', label: 'Wellness Check-In', icon: Activity, color: '#0d9488' },
 { id: 'assessment', label: 'Assessment', icon: ClipboardList, color: '#d97706' },
 { id: 'custom', label: 'Custom', icon: Pencil, color: '#64748b' },
];

const REPEATS = [
 { id: 'none', label: 'Once' },
 { id: 'daily', label: 'Daily' },
 { id: 'weekly', label: 'Weekly' },
 { id: 'monthly', label: 'Monthly' },
];

const BEFORE = [
 { id: '0', label: 'At the time' },
 { id: '5', label: '5 min before' },
 { id: '15', label: '15 min before' },
 { id: '30', label: '30 min before' },
 { id: '60', label: '1 hour before' },
 { id: '1440',label: '1 day before' },
];

function storageKey(userId) { return `aura_reminders_${userId}`; }

function loadReminders(userId) {
 try { return JSON.parse(localStorage.getItem(storageKey(userId)) || '[]'); }
 catch { return []; }
}

function saveReminders(userId, list) {
 localStorage.setItem(storageKey(userId), JSON.stringify(list));
}

function formatTime(dateStr) {
 const d = new Date(dateStr);
 return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function isPast(dateStr) { return new Date(dateStr) < new Date(); }

/* ── Compact reminder row ─────────────────────────────────────────────────── */
function ReminderRow({ r, onDelete, onComplete }) {
 const type = TYPES.find(t => t.id === r.type) || TYPES[4];
 const Icon = type.icon;
 const past = isPast(r.datetime);
 return (
 <div className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0 ${past ? 'opacity-50' : ''}`}>
 <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
 style={{ background: `${type.color}18` }}>
 <Icon size={13} style={{ color: type.color }}/>
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-semibold text-gray-900 truncate">{r.label}</p>
 <div className="flex items-center gap-2 mt-0.5">
 <span className="text-[11px] text-gray-500 flex items-center gap-1">
 <Clock size={9}/>{formatTime(r.datetime)}
 </span>
 {r.repeat !== 'none' && (
 <span className="text-[11px] text-gray-400 flex items-center gap-1">
 <Repeat size={9}/>{r.repeat}
 </span>
 )}
 </div>
 </div>
 <div className="flex items-center gap-1 flex-shrink-0">
 {!past && (
 <button onClick={() => onComplete(r.id)}
 className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-teal-600 hover:bg-teal-50 transition-colors"
 title="Mark done">
 <Check size={11}/>
 </button>
 )}
 <button onClick={() => onDelete(r.id)}
 className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
 title="Delete">
 <Trash2 size={11}/>
 </button>
 </div>
 </div>
 );
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function ReminderCenter() {
 const { user } = useAuth();
 const [open, setOpen] = useState(false);
 const [view, setView] = useState('list'); // 'list' | 'add'
 const [reminders, setReminders] = useState([]);

 // New reminder form state
 const [type, setType] = useState('medication');
 const [label, setLabel] = useState('');
 const [datetime, setDatetime] = useState('');
 const [repeat, setRepeat] = useState('none');
 const [before, setBefore] = useState('15');

 const userId = user?.id || 'guest';

 // Load from localStorage
 useEffect(() => {
 setReminders(loadReminders(userId));
 }, [userId]);

 // Request browser notification permission on open
 useEffect(() => {
 if (open && 'Notification' in window && Notification.permission === 'default') {
 Notification.requestPermission();
 }
 }, [open]);

 // Check for due reminders every 30s
 useEffect(() => {
 const check = () => {
 const now = new Date();
 const list = loadReminders(userId);
 list.forEach(r => {
 if (r.notified) return;
 const target = new Date(r.datetime);
 const diffMin = (target - now) / 60000;
 const beforeMin = parseInt(r.before || '0', 10);
 if (diffMin <= beforeMin && diffMin > beforeMin - 1) {
 // Fire notification
 const msg = `⏰ Reminder: ${r.label}`;
 toast.info(msg, { duration: 8000 });
 if (Notification.permission === 'granted') {
 new Notification('Project Aura Reminder', { body: r.label, icon: '/logo.png' });
 }
 // Mark as notified (unless repeating)
 if (r.repeat === 'none') {
 const updated = list.map(x => x.id === r.id ? { ...x, notified: true } : x);
 saveReminders(userId, updated);
 setReminders(updated);
 }
 }
 });
 };
 check();
 const iv = setInterval(check, 30000);
 return () => clearInterval(iv);
 }, [userId]);

 const addReminder = useCallback(() => {
 if (!label.trim() || !datetime) return;
 const r = {
 id: Date.now().toString(),
 type, label: label.trim(), datetime,
 repeat, before, notified: false,
 created: new Date().toISOString(),
 };
 const updated = [r, ...reminders];
 setReminders(updated);
 saveReminders(userId, updated);
 toast.success(`Reminder set: ${label}`);
 setLabel('');
 setDatetime('');
 setRepeat('none');
 setBefore('15');
 setView('list');
 }, [label, datetime, type, repeat, before, reminders, userId]);

 const deleteReminder = useCallback((id) => {
 const updated = reminders.filter(r => r.id !== id);
 setReminders(updated);
 saveReminders(userId, updated);
 }, [reminders, userId]);

 const completeReminder = useCallback((id) => {
 const updated = reminders.filter(r => r.id !== id);
 setReminders(updated);
 saveReminders(userId, updated);
 toast.success('Reminder marked as done');
 }, [reminders, userId]);

 const upcoming = reminders.filter(r => !isPast(r.datetime) || r.repeat !== 'none');
 const past = reminders.filter(r => isPast(r.datetime) && r.repeat === 'none');

 // Default datetime to 1 hour from now
 const defaultDt = () => {
 const d = new Date(Date.now() + 3600000);
 return d.toISOString().slice(0, 16);
 };

 return (
 <div className="relative">
 {/* Bell button */}
 <button
 onClick={() => { setOpen(v => !v); setView('list'); }}
 className="w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-lg border border-white/30 hover:bg-white/20 transition-all relative"
 aria-label="Reminders"
 title="Reminders"
 >
 <BellRing size={18} className="text-white" strokeWidth={2}/>
 {upcoming.length > 0 && (
 <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-amber-400 text-white rounded-full text-[11px] font-bold flex items-center justify-center px-0.5">
 {upcoming.length > 9 ? '9+' : upcoming.length}
 </span>
 )}
 </button>

 <AnimatePresence>
 {open && (
 <>
 <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}/>
 <motion.div
 initial={{ opacity: 0, y: -10, scale: 0.96 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -10, scale: 0.96 }}
 transition={{ duration: 0.15 }}
 className="absolute right-0 mt-2 z-50 rounded-2xl overflow-hidden flex flex-col bg-slate-50"
 style={{ width: 340, maxHeight: 520, border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
 onClick={e => e.stopPropagation()}
 >
 {/* Header */}
 <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
 style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)' }}>
 <div className="flex items-center gap-2">
 <BellRing size={15} className="text-white"/>
 <span className="font-bold text-white text-sm">Reminders</span>
 {upcoming.length > 0 && (
 <span className="text-[11px] bg-white/25 text-white px-1.5 py-0.5 rounded-full font-bold">
 {upcoming.length} active
 </span>
 )}
 </div>
 <div className="flex items-center gap-1">
 <button onClick={() => { setView(v => v === 'add' ? 'list' : 'add'); if (view !== 'add') setDatetime(defaultDt()); }}
 className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white">
 {view === 'add' ? <ChevronDown size={14}/> : <Plus size={14}/>}
 </button>
 <button onClick={() => setOpen(false)}
 className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white">
 <X size={13}/>
 </button>
 </div>
 </div>

 {/* Add reminder form */}
 <AnimatePresence>
 {view === 'add' && (
 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
 className="border-b border-gray-100 overflow-hidden flex-shrink-0">
 <div className="p-4 space-y-3">
 {/* Type selector */}
 <div className="flex gap-1.5 flex-wrap">
 {TYPES.map(t => {
 const Icon = t.icon;
 return (
 <button key={t.id} onClick={() => setType(t.id)}
 className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all border"
 style={{
 background: type === t.id ? `${t.color}18` : '#f8fafc',
 borderColor: type === t.id ? t.color : '#e2e8f0',
 color: type === t.id ? t.color : '#64748b',
 }}>
 <Icon size={10}/>{t.label}
 </button>
 );
 })}
 </div>

 {/* Label */}
 <input type="text" value={label} onChange={e => setLabel(e.target.value)}
 placeholder="What do you need to be reminded about?"
 className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
 onKeyDown={e => e.key === 'Enter' && addReminder()}/>

 {/* Date/time */}
 <input type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)}
 className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 bg-slate-50"/>

 <div className="flex gap-2">
 {/* Remind before */}
 <select value={before} onChange={e => setBefore(e.target.value)}
 className="flex-1 px-2 py-2 text-xs border border-gray-200 rounded-xl bg-[var(--card-bg)] focus:outline-none focus:border-amber-400">
 {BEFORE.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
 </select>
 {/* Repeat */}
 <select value={repeat} onChange={e => setRepeat(e.target.value)}
 className="flex-1 px-2 py-2 text-xs border border-gray-200 rounded-xl bg-[var(--card-bg)] focus:outline-none focus:border-amber-400">
 {REPEATS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
 </select>
 </div>

 <button onClick={addReminder} disabled={!label.trim() || !datetime}
 className="w-full py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
 style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)' }}>
 Set Reminder
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Reminder list */}
 <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
 {reminders.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-12 text-center px-4">
 <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-3">
 <BellRing size={22} className="text-amber-400"/>
 </div>
 <p className="text-sm font-semibold text-gray-700 mb-1">No reminders yet</p>
 <p className="text-xs text-gray-400">Tap + to set a reminder for medications, appointments, or anything else.</p>
 <button onClick={() => { setView('add'); setDatetime(defaultDt()); }}
 className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
 style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)' }}>
 <Plus size={12}/> Add first reminder
 </button>
 </div>
 ) : (
 <>
 {upcoming.length > 0 && (
 <div>
 <div className="px-4 py-1.5 bg-[var(--card-bg)] border-b border-gray-100">
 <p className="text-[11px] font-bold text-gray-500">Upcoming</p>
 </div>
 {upcoming.map(r => (
 <ReminderRow key={r.id} r={r} onDelete={deleteReminder} onComplete={completeReminder}/>
 ))}
 </div>
 )}
 {past.length > 0 && (
 <div>
 <div className="px-4 py-1.5 bg-[var(--card-bg)] border-b border-gray-100">
 <p className="text-[11px] font-bold text-gray-500">Past</p>
 </div>
 {past.slice(0, 5).map(r => (
 <ReminderRow key={r.id} r={r} onDelete={deleteReminder} onComplete={completeReminder}/>
 ))}
 </div>
 )}
 </>
 )}
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>
 </div>
 );
}
