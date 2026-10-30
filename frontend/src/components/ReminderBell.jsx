/**
 * ReminderBell.jsx - Inline reminder bell for any item row
 *
 * Positioning: anchors near the clicked bell button,
 * always stays within the viewport (no overflow).
 * No backdrop/blur - content stays fully interactive.
 *
 * Critical fields for a functional healthcare reminder:
 * 1. Title (what to remind)
 * 2. Date & Time (when)
 * 3. Remind Before (how far in advance to notify)
 * 4. Repeat (once/daily/weekly/monthly)
 * 5. Priority (low/medium/high/urgent)
 * 6. Action Required (acknowledge/give medication/log vitals/call patient)
 * 7. Notify Via (in-app/email/SMS/all)
 * 8. Assigned To (who should act)
 * 9. Notes (clinical instructions)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Bell, X, Clock, Repeat, Check, AlertTriangle,
 User, MessageSquare, Smartphone, Mail,
 ChevronDown, Activity, Pill, Phone,
} from 'lucide-react';
import toast from '../utils/toast';
import { useAuth } from '../context/AuthContext';

/* ── Config ──────────────────────────────────────────────────────────────── */
const BEFORE_OPTS = [
 { id: '0', label: 'At time of event' },
 { id: '5', label: '5 min before' },
 { id: '15', label: '15 min before' },
 { id: '30', label: '30 min before' },
 { id: '60', label: '1 hour before' },
 { id: '120', label: '2 hours before' },
 { id: '360', label: '6 hours before' },
 { id: '1440', label: '1 day before' },
];

const REPEAT_OPTS = [
 { id: 'none', label: 'Once' },
 { id: 'daily', label: 'Daily' },
 { id: 'weekly', label: 'Weekly' },
 { id: 'monthly', label: 'Monthly' },
];

const PRIORITY_OPTS = [
 { id: 'low', label: 'Low', color: '#22c55e' },
 { id: 'medium', label: 'Medium', color: '#f59e0b' },
 { id: 'high', label: 'High', color: '#ef4444' },
 { id: 'urgent', label: 'Urgent', color: '#7c3aed' },
];

const ACTION_OPTS = [
 { id: 'acknowledge', label: 'Acknowledge', Icon: Check },
 { id: 'give_med', label: 'Give Medication', Icon: Pill },
 { id: 'log_vitals', label: 'Log Vitals', Icon: Activity },
 { id: 'call_patient', label: 'Call Patient', Icon: Phone },
 { id: 'contact_team', label: 'Contact Team', Icon: MessageSquare },
];

const NOTIFY_OPTS = [
 { id: 'in-app', label: 'In-app', Icon: Bell },
 { id: 'email', label: 'Email', Icon: Mail },
 { id: 'sms', label: 'SMS', Icon: Smartphone },
 { id: 'all', label: 'All', Icon: MessageSquare },
];

const ASSIGN_OPTS = [
 { id: 'self', label: 'Myself' },
 { id: 'caregiver', label: 'Caregiver' },
 { id: 'clinician', label: 'Clinician' },
 { id: 'all', label: 'All team' },
];

const TYPE_COLORS = {
 medication: '#2563eb',
 appointment: '#7c3aed',
 assessment: '#d97706',
 wellness: '#0d9488',
 patient: '#db2777',
 custom: '#0d9488',
};

/* ── Storage helpers ─────────────────────────────────────────────────────── */
const storageKey = (uid) => `aura_reminders_${uid}`;
const loadReminders = (uid) => {
 try { return JSON.parse(localStorage.getItem(storageKey(uid)) || '[]'); }
 catch { return []; }
};
const saveReminders = (uid, list) => localStorage.setItem(storageKey(uid), JSON.stringify(list));

/* ── Select helper ───────────────────────────────────────────────────────── */
function Sel({ value, onChange, opts, className = '' }) {
 return (
 <div className={`relative ${className}`}>
 <select value={value} onChange={e => onChange(e.target.value)}
 className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-[var(--card-bg)] focus:outline-none focus:border-teal-400 appearance-none pr-6">
 {opts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
 </select>
 <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
 </div>
 );
}

/* ── Label helper ────────────────────────────────────────────────────────── */
function FL({ children }) {
 return <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">{children}</label>;
}

/* ══ Main Component ════════════════════════════════════════════════════════ */
export default function ReminderBell({ label, type = 'custom', defaultTime = '', size = 'sm', className = '' }) {
 const { user } = useAuth();
 const uid = user?.id || 'guest';
 const accent = TYPE_COLORS[type] || TYPE_COLORS.custom;
 const iconSz = size === 'xs' ? 11 : 13;
 const btnCls = size === 'xs' ? 'w-5 h-5' : 'w-6 h-6';

 // Form state
 const [open, setOpen] = useState(false);
 const [title, setTitle] = useState('');
 const [datetime, setDatetime] = useState('');
 const [before, setBefore] = useState('15');
 const [repeat, setRepeat] = useState('none');
 const [priority, setPriority] = useState('medium');
 const [action, setAction] = useState('acknowledge');
 const [notifyVia, setNotifyVia] = useState('in-app');
 const [assignedTo, setAssignedTo] = useState('self');
 const [notes, setNotes] = useState('');
 const [saved, setSaved] = useState(false);
 const [hasReminder,setHasReminder]= useState(false);

 // Positioning
 const [pos, setPos] = useState({ top: 100, right: 16 });
 const bellRef = useRef(null);
 const panelRef = useRef(null);

 const PANEL_W = 320;
 const PANEL_H = 560; // approximate

 // Check existing reminder
 useEffect(() => {
 setHasReminder(loadReminders(uid).some(r => r.label === label && !r.notified));
 }, [uid, label, open]);

 // Check due reminders
 useEffect(() => {
 const tick = () => {
 const now = new Date();
 const list = loadReminders(uid);
 list.forEach(r => {
 if (r.notified) return;
 const diff = (new Date(r.datetime) - now) / 60000;
 const need = parseInt(r.before || '0', 10);
 if (diff <= need && diff > need - 1) {
 toast.info(`\u23F0 ${r.title || r.label}`, { duration: 8000 });
 if ('Notification' in window && Notification.permission === 'granted')
 new Notification('Aura Reminder', { body: r.title || r.label, icon: '/logo.png' });
 if (r.repeat === 'none') {
 saveReminders(uid, list.map(x => x.id === r.id ? { ...x, notified: true } : x));
 }
 }
 });
 };
 tick();
 const iv = setInterval(tick, 30000);
 return () => clearInterval(iv);
 }, [uid]);

 // Close on outside click
 useEffect(() => {
 if (!open) return;
 const h = (e) => {
 if (panelRef.current && !panelRef.current.contains(e.target) &&
 bellRef.current && !bellRef.current.contains(e.target)) {
 setOpen(false);
 }
 };
 document.addEventListener('mousedown', h);
 return () => document.removeEventListener('mousedown', h);
 }, [open]);

 const openPanel = useCallback((e) => {
 e.stopPropagation();
 if (open) { setOpen(false); return; }

 // Calculate position anchored to the bell button
 const rect = bellRef.current?.getBoundingClientRect() || { top: 100, right: 100, left: 100 };
 const vw = window.innerWidth;
 const vh = window.innerHeight;

 // Try to position panel to the LEFT of the bell (since bell is on the right of a row)
 // Default: right edge = 16px from viewport right
 let right = 16;
 let top = rect.top;

 // Clamp top so panel doesn't go off bottom
 if (top + PANEL_H > vh - 16) top = vh - PANEL_H - 16;
 if (top < 16) top = 16;

 setPos({ top, right });

 // Reset form
 setTitle(label);
 setNotes('');
 setSaved(false);
 setPriority('medium');
 setAction('acknowledge');
 setRepeat('none');
 setBefore('15');
 setNotifyVia('in-app');
 setAssignedTo('self');

 if (defaultTime) {
 const d = new Date();
 d.setDate(d.getDate() + 1);
 const [h, m] = defaultTime.split(':');
 d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
 setDatetime(d.toISOString().slice(0, 16));
 } else {
 const d = new Date(Date.now() + 3600000);
 setDatetime(d.toISOString().slice(0, 16));
 }

 if ('Notification' in window && Notification.permission === 'default')
 Notification.requestPermission();

 setOpen(true);
 }, [open, label, defaultTime]);

 const save = useCallback(() => {
 if (!datetime) return;
 const r = {
 id: Date.now().toString(),
 type, label,
 title: title || label,
 datetime, before, repeat,
 priority, action, notifyVia, assignedTo, notes,
 notified: false,
 created: new Date().toISOString(),
 };
 saveReminders(uid, [r, ...loadReminders(uid)]);
 setSaved(true);
 setHasReminder(true);
 toast.success(`Reminder set: ${r.title}`);
 setTimeout(() => setOpen(false), 900);
 }, [datetime, title, label, before, repeat, priority, action, notifyVia, assignedTo, notes, type, uid]);

 return (
 <div className={`relative inline-flex ${className}`}>
 {/* Bell button */}
 <button ref={bellRef} onClick={openPanel}
 title={hasReminder ? 'Reminder set' : 'Set reminder'}
 aria-label={`Set reminder for ${label}`}
 className={`${btnCls} flex items-center justify-center rounded-lg transition-all flex-shrink-0`}
 style={{
 background: hasReminder ? `${accent}18` : open ? `${accent}10` : 'transparent',
 color: hasReminder || open ? accent : '#9ca3af',
 border: `1px solid ${hasReminder ? accent + '40' : open ? accent + '25' : 'transparent'}`,
 }}>
 <Bell size={iconSz} strokeWidth={hasReminder ? 2.5 : 2} fill={hasReminder ? accent : 'none'}/>
 </button>

 {/* Panel - fixed, viewport-clamped, no backdrop */}
 <AnimatePresence>
 {open && (
 <motion.div ref={panelRef}
 initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
 transition={{ type: 'spring', damping: 24, stiffness: 320 }}
 className="fixed z-[9999] flex flex-col bg-slate-50"
 style={{
 top: pos.top,
 right: pos.right,
 width: PANEL_W,
 maxHeight: `calc(100vh - ${pos.top + 16}px)`,
 borderRadius: 14,
 border: '1px solid #e2e8f0',
 boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
 }}
 onClick={e => e.stopPropagation()}>

 {/* Header */}
 <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0 rounded-t-[13px]"
 style={{ background: `linear-gradient(135deg,${accent},${accent}cc)` }}>
 <div className="flex items-center gap-2">
 <Bell size={13} className="text-white"/>
 <span className="text-sm font-bold text-white">Set Reminder</span>
 </div>
 <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
 <X size={14}/>
 </button>
 </div>

 {/* Body */}
 <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5" style={{ scrollbarWidth: 'thin' }}>
 {saved ? (
 <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
 <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: `${accent}18` }}>
 <Check size={20} style={{ color: accent }}/>
 </div>
 <p className="font-bold text-gray-800 text-sm">Reminder saved!</p>
 <p className="text-[11px] text-gray-400">{title || label}</p>
 </div>
 ) : (
 <>
 {/* Item badge */}
 <div className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold truncate"
 style={{ background: `${accent}10`, color: accent, border: `1px solid ${accent}20` }}>
 {label}
 </div>

 {/* 1. Title */}
 <div>
 <FL>Title</FL>
 <input type="text" value={title} onChange={e => setTitle(e.target.value)}
 placeholder="Reminder title..."
 className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-[var(--card-bg)] focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20"/>
 </div>

 {/* 2. Date & Time */}
 <div>
 <FL><Clock size={9} className="inline mr-1"/>Date &amp; Time *</FL>
 <input type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)}
 className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-[var(--card-bg)] focus:outline-none focus:border-teal-400"/>
 </div>

 {/* 3+4. Notify Before + Repeat */}
 <div className="grid grid-cols-2 gap-2">
 <div>
 <FL>Notify before</FL>
 <Sel value={before} onChange={setBefore} opts={BEFORE_OPTS}/>
 </div>
 <div>
 <FL><Repeat size={9} className="inline mr-1"/>Repeat</FL>
 <Sel value={repeat} onChange={setRepeat} opts={REPEAT_OPTS}/>
 </div>
 </div>

 {/* 5. Priority */}
 <div>
 <FL><AlertTriangle size={9} className="inline mr-1"/>Priority</FL>
 <div className="flex gap-1.5">
 {PRIORITY_OPTS.map(p => (
 <button key={p.id} onClick={() => setPriority(p.id)}
 className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all border"
 style={{
 background: priority === p.id ? `${p.color}15` : '#f8fafc',
 borderColor: priority === p.id ? p.color : '#e2e8f0',
 color: priority === p.id ? p.color : '#94a3b8',
 }}>
 {p.label}
 </button>
 ))}
 </div>
 </div>

 {/* 6. Action Required */}
 <div>
 <FL>Action required</FL>
 <div className="grid grid-cols-2 gap-1.5">
 {ACTION_OPTS.map(a => {
 const Icon = a.Icon;
 return (
 <button key={a.id} onClick={() => setAction(a.id)}
 className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all border"
 style={{
 background: action === a.id ? `${accent}12` : '#f8fafc',
 borderColor: action === a.id ? accent : '#e2e8f0',
 color: action === a.id ? accent : '#64748b',
 }}>
 <Icon size={10}/>{a.label}
 </button>
 );
 })}
 </div>
 </div>

 {/* 7. Notify Via */}
 <div>
 <FL>Notify via</FL>
 <div className="flex gap-1.5">
 {NOTIFY_OPTS.map(n => {
 const Icon = n.Icon;
 return (
 <button key={n.id} onClick={() => setNotifyVia(n.id)}
 className="flex-1 flex flex-col items-center py-1.5 rounded-lg text-[11px] font-semibold transition-all border gap-0.5"
 style={{
 background: notifyVia === n.id ? `${accent}12` : '#f8fafc',
 borderColor: notifyVia === n.id ? accent : '#e2e8f0',
 color: notifyVia === n.id ? accent : '#94a3b8',
 }}>
 <Icon size={12}/>{n.label}
 </button>
 );
 })}
 </div>
 </div>

 {/* 8. Assigned To */}
 <div>
 <FL><User size={9} className="inline mr-1"/>Assigned to</FL>
 <Sel value={assignedTo} onChange={setAssignedTo} opts={ASSIGN_OPTS}/>
 </div>

 {/* 9. Notes */}
 <div>
 <FL><MessageSquare size={9} className="inline mr-1"/>Clinical notes</FL>
 <textarea value={notes} onChange={e => setNotes(e.target.value)}
 placeholder="Instructions, context, or clinical notes..."
 rows={2}
 className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-[var(--card-bg)] focus:outline-none focus:border-teal-400 resize-none"/>
 </div>

 {hasReminder && (
 <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
 <AlertTriangle size={10}/> A reminder already exists for this item
 </p>
 )}
 </>
 )}
 </div>

 {/* Footer */}
 {!saved && (
 <div className="flex-shrink-0 px-4 py-2.5 border-t border-gray-100 flex gap-2 rounded-b-[13px] bg-gray-50">
 <button onClick={() => setOpen(false)}
 className="flex-1 py-2 rounded-xl text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-white transition-colors">
 Cancel
 </button>
 <button onClick={save} disabled={!datetime}
 className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
 style={{ background: `linear-gradient(135deg,${accent},${accent}cc)` }}>
 Set Reminder
 </button>
 </div>
 )}
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}
