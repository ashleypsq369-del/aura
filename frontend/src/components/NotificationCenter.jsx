import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Calendar, Pill, AlertTriangle,
  Check, X, Trash2, MessageSquare, FileText,
  Users, Heart, Clock
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/AppSettingsContext';
import toast from '../utils/toast';
import apiClient from '../api/client';

// ─── Role-aware tab definitions ───────────────────────────────────────────────
const TABS = [
  { id: 'all',    label: 'All',           types: null,
    roles: ['admin','clinician','caregiver','patient','family'] },
  { id: 'appts',  label: 'Appointments',  types: ['appointment_reminder_24h','appointment_reminder_1h'],
    roles: ['admin','clinician','caregiver','patient','family'] },
  { id: 'meds',   label: 'Medications',   types: ['medication_reminder','medication_missed'],
    roles: ['admin','clinician','caregiver','patient'] },
  { id: 'msgs',   label: 'Messages',      types: ['new_message'],
    roles: ['admin','clinician','caregiver','patient','family'] },
  { id: 'alerts', label: 'Alerts',        types: ['critical_vitals','high_risk','ml_risk_alert','crisis_alert','alert_generated','medical_flag'],
    roles: ['admin','clinician','caregiver'] },
  { id: 'health', label: 'Health',        types: ['critical_vitals','high_risk','ml_risk_alert','crisis_alert','alert_generated','medical_flag'],
    roles: ['patient','family'] },
];

const NAV_ROUTES = {
  appointment_reminder_24h: '/appointments', appointment_reminder_1h: '/appointments',
  medication_reminder: '/medications',       medication_missed: '/medications',
  critical_vitals: '/alerts',                high_risk: '/alerts',
  ml_risk_alert: '/ai-insights',             crisis_alert: '/alerts',
  alert_generated: '/alerts',                new_message: '/messages',
  report_available: '/dashboard',            community_post: '/community',
};

// Severity color system — left border + icon badge, WCAG-AA compliant
function getSeverity(type) {
  const critical = ['critical_vitals','crisis_alert','medication_missed'];
  const high     = ['high_risk','ml_risk_alert','alert_generated','medical_flag'];
  const appt     = ['appointment_reminder_24h','appointment_reminder_1h'];
  const med      = ['medication_reminder'];
  const msg      = ['new_message','community_post','community_reply','peer_support'];
  if (critical.includes(type)) return { bar: '#dc2626', badge: '#fee2e2', icon: '#dc2626', label: 'critical' };
  if (high.includes(type))     return { bar: '#ea580c', badge: '#ffedd5', icon: '#ea580c', label: 'high'     };
  if (appt.includes(type))     return { bar: '#7c3aed', badge: '#ede9fe', icon: '#7c3aed', label: 'appt'    };
  if (med.includes(type))      return { bar: '#2563eb', badge: '#dbeafe', icon: '#2563eb', label: 'med'     };
  if (msg.includes(type))      return { bar: '#059669', badge: '#d1fae5', icon: '#059669', label: 'msg'     };
  return                              { bar: '#94a3b8', badge: '#f1f5f9', icon: '#64748b', label: 'info'    };
}

function getIcon(type) {
  const m = {
    appointment_reminder_24h: Calendar, appointment_reminder_1h: Calendar,
    medication_reminder: Pill,          medication_missed: Pill,
    new_message: MessageSquare,         report_available: FileText,
    critical_vitals: AlertTriangle,     high_risk: AlertTriangle,
    ml_risk_alert: AlertTriangle,       crisis_alert: AlertTriangle,
    alert_generated: AlertTriangle,     medical_flag: AlertTriangle,
    community_post: Users,              community_reply: Users,
    peer_support: Heart,
  };
  return m[type] || Bell;
}

function relTime(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Group notifications by time bucket — standard healthcare inbox pattern
function groupByTime(list) {
  const now   = Date.now();
  const today = [], week = [], older = [];
  list.forEach(n => {
    const age = now - new Date(n.created_at);
    if (age < 86400000)   today.push(n);
    else if (age < 604800000) week.push(n);
    else                  older.push(n);
  });
  const groups = [];
  if (today.length)  groups.push({ label: 'Today',            items: today });
  if (week.length)   groups.push({ label: 'Earlier this week', items: week  });
  if (older.length)  groups.push({ label: 'Older',             items: older });
  return groups;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function NotificationCenter() {
  const [open, setOpen]           = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const navigate                  = useNavigate();
  const queryClient               = useQueryClient();
  const { user }                  = useAuth();
  const { theme }                 = useAppSettings();
  const isDark                    = theme === 'dark';

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/api/notifications?limit=200').then(r => r.data),
    refetchInterval: 30000,
  });
  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => apiClient.get('/api/notifications/unread-count').then(r => r.data),
    refetchInterval: 30000,
  });
  const unreadCount = unreadData?.count ?? 0;

  // ── Mutations ─────────────────────────────────────────────────────────────
  const inv = () => { queryClient.invalidateQueries(['notifications']); queryClient.invalidateQueries(['unread-count']); };
  const markRead    = useMutation({ mutationFn: (id) => apiClient.put(`/api/notifications/${id}/read`), onSuccess: inv });
  const markAllRead = useMutation({ mutationFn: () => apiClient.put('/api/notifications/mark-all-read'),
    onSuccess: () => { inv(); toast.success('All marked as read'); } });
  const del         = useMutation({ mutationFn: (id) => apiClient.delete(`/api/notifications/${id}`), onSuccess: inv });
  const clearRead   = useMutation({ mutationFn: () => apiClient.delete('/api/notifications/clear-read'),
    onSuccess: () => { inv(); toast.success('Cleared read notifications'); } });

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const tabs = useMemo(() => TABS.filter(t => t.roles.includes(user?.role)), [user?.role]);

  // ── Filtered + sorted list ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const tab  = tabs.find(t => t.id === activeTab);
    const base = tab?.types ? notifications.filter(n => tab.types.includes(n.notification_type)) : notifications;
    return [...base].sort((a, b) => {
      if (!a.is_read && b.is_read)  return -1;
      if (a.is_read  && !b.is_read) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [notifications, activeTab, tabs]);

  // Group for dropdown preview (max 10)
  const previewGroups = useMemo(() => groupByTime(filtered.slice(0, 10)), [filtered]);

  // Toast critical ones
  useEffect(() => {
    notifications
      .filter(n => !n.is_read && (n.notification_type?.includes('critical') || n.notification_type?.includes('missed')))
      .forEach(n => toast.error(
        <div className="flex gap-2">
          <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div><p className="font-bold text-sm">{n.title}</p><p className="text-xs opacity-80">{n.body}</p></div>
        </div>,
        { duration: 8000, id: `crit-${n.id}` }
      ));
  }, [notifications]);

  const handleClick = (n) => {
    if (!n.is_read) markRead.mutate(n.id);
    const route = NAV_ROUTES[n.notification_type];
    if (route) navigate(route);
    setOpen(false);
  };

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const T = isDark ? {
    bg: '#1a2332', bdr: 'rgba(255,255,255,0.09)',
    headBg: '#1e2d3e', headBdr: 'rgba(255,255,255,0.07)',
    tabBg: '#1a2332', tabBdr: 'rgba(255,255,255,0.06)',
    listBg: '#1a2332', rowBdr: 'rgba(255,255,255,0.04)',
    rowUnread: 'rgba(255,255,255,0.03)', rowHover: 'rgba(255,255,255,0.06)',
    footBg: '#151e2b', footBdr: 'rgba(255,255,255,0.06)',
    title: '#f1f5f9', body: '#94a3b8', time: '#64748b',
    grpLabel: '#475569',
    tabActiveBg: '#334155', tabActiveClr: '#f1f5f9',
    tabIdleClr: '#64748b', tabHover: 'rgba(255,255,255,0.06)',
    badgeBg: 'rgba(255,255,255,0.10)', badgeClr: '#94a3b8',
    badgeActiveBg: 'rgba(255,255,255,0.18)', badgeActiveClr: '#f1f5f9',
    btnBg: 'rgba(255,255,255,0.06)', btnClr: '#94a3b8', btnHoverClr: '#f1f5f9',
    link: '#34d399', clear: '#475569', emptyClr: '#475569',
  } : {
    bg: '#ffffff', bdr: '#e2e8f0',
    headBg: '#ffffff', headBdr: '#e2e8f0',
    tabBg: '#f8fafc', tabBdr: '#e2e8f0',
    listBg: '#ffffff', rowBdr: '#f1f5f9',
    rowUnread: '#fafafa', rowHover: '#f5f5f5',
    footBg: '#f8fafc', footBdr: '#e2e8f0',
    title: '#0f172a', body: '#64748b', time: '#94a3b8',
    grpLabel: '#94a3b8',
    tabActiveBg: '#0f172a', tabActiveClr: '#ffffff',
    tabIdleClr: '#64748b', tabHover: '#f1f5f9',
    badgeBg: '#e2e8f0', badgeClr: '#475569',
    badgeActiveBg: 'rgba(255,255,255,0.25)', badgeActiveClr: '#ffffff',
    btnBg: '#f1f5f9', btnClr: '#64748b', btnHoverClr: '#0f172a',
    link: '#0d9488', clear: '#94a3b8', emptyClr: '#cbd5e1',
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="relative">
        {/* Bell button */}
        <button onClick={() => setOpen(v => !v)}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
          aria-label="Notifications">
          <Bell size={17} color="#ffffff" strokeWidth={2} />
          {unreadCount > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 bg-red-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg"
              style={{ fontSize: 9, minWidth: 16, minHeight: 16, padding: '0 3px', lineHeight: 1 }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </button>

        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 mt-2 z-50 rounded-2xl overflow-hidden flex flex-col"
                style={{ width: 360, maxHeight: 500, background: T.bg, border: `1px solid ${T.bdr}`,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)' }}>

                {/* ── Header — teal gradient with unread count + actions ── */}
                <div className="flex items-center justify-between px-3 py-2.5 flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg,#0d9488,#0891b2)',
                    borderBottom: '1px solid rgba(255,255,255,0.15)',
                  }}>
                  <div className="flex items-center gap-2">
                    <Bell size={13} color="rgba(255,255,255,0.9)" />
                    <span className="text-[11px] font-bold text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-white font-bold rounded-full flex items-center justify-center"
                        style={{ fontSize: 9, background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)', minWidth: 18, minHeight: 18, padding: '0 4px' }}>
                        {unreadCount} unread
                      </span>
                    )}
                    {unreadCount === 0 && (
                      <span className="text-[10px] font-medium text-white/70">All caught up</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button onClick={() => markAllRead.mutate()}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-colors text-white/80 hover:text-white hover:bg-white/15">
                        <Check size={10} strokeWidth={2.5} /> Mark all read
                      </button>
                    )}
                    <button onClick={() => setOpen(false)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors text-white/70 hover:text-white hover:bg-white/15">
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* ── Filter tabs — underline style, on slightly tinted bg ── */}
                <div className="flex items-center overflow-x-auto flex-shrink-0"
                  style={{ background: isDark ? T.tabBg : '#f0fdfa', borderBottom: `1px solid ${isDark ? T.tabBdr : '#99f6e4'}`, padding: '0 10px' }}>
                  {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    const unreadInTab = tab.types
                      ? notifications.filter(n => !n.is_read && tab.types.includes(n.notification_type)).length
                      : unreadCount;
                    return (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className="inline-flex items-center gap-1 py-2 px-2.5 text-[11px] font-semibold whitespace-nowrap transition-all flex-shrink-0 border-b-2"
                        style={{
                          borderColor:  isActive ? '#0d9488' : 'transparent',
                          color:        isActive ? '#0d9488' : (isDark ? '#94a3b8' : '#475569'),
                          marginBottom: '-1px',
                          background:   'transparent',
                        }}>
                        {tab.label}
                        {unreadInTab > 0 && (
                          <span style={{
                            fontSize: 8, minWidth: 14, minHeight: 14, padding: '0 3px',
                            borderRadius: 999, fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            background: isActive ? '#0d9488' : (isDark ? 'rgba(255,255,255,0.12)' : '#ccfbf1'),
                            color: isActive ? '#fff' : (isDark ? '#94a3b8' : '#0d9488'),
                          }}>
                            {unreadInTab > 99 ? '99+' : unreadInTab}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* ── Notification list — grouped by time ── */}
                <div className="flex-1 overflow-y-auto" style={{ background: T.listBg }}>
                  {previewGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Bell size={22} style={{ color: isDark ? '#475569' : '#cbd5e1' }} className="mb-2" />
                      <p className="text-xs font-semibold" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>You're all caught up</p>
                      <p className="text-[11px] mt-0.5" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>No notifications here</p>
                    </div>
                  ) : (
                    previewGroups.map(group => (
                      <div key={group.label}>
                        {/* Time group label — minimal */}
                        <div className="flex items-center gap-1.5 px-3 py-1"
                          style={{ borderBottom: `1px solid ${T.rowBdr}` }}>
                          <span className="text-[9px] font-bold uppercase tracking-wider"
                            style={{ color: T.grpLabel }}>
                            {group.label}
                          </span>
                        </div>
                        {group.items.map(n => <NotifRow key={n.id} n={n} T={T} isDark={isDark} onDelete={() => del.mutate(n.id)} onClick={() => handleClick(n)} />)}
                      </div>
                    ))
                  )}
                  {filtered.length > 10 && (
                    <button onClick={() => { setOpen(false); navigate('/notifications'); }}
                      className="w-full py-2 text-[10px] font-semibold transition text-center"
                      style={{ color: T.link, borderTop: `1px solid ${T.rowBdr}` }}>
                      +{filtered.length - 10} more →
                    </button>
                  )}
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-between px-3 py-2 flex-shrink-0"
                  style={{ background: T.footBg, borderTop: `1px solid ${T.footBdr}` }}>
                  <button onClick={() => { setOpen(false); navigate('/notifications'); }}
                    className="text-[10px] font-semibold transition" style={{ color: T.link }}>
                    Open inbox →
                  </button>
                  <button onClick={() => clearRead.mutate()}
                    className="flex items-center gap-1 text-[10px] transition" style={{ color: T.clear }}>
                    <Trash2 size={9} /> Clear read
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* no modal — "view all" navigates directly to /notifications */}
    </>
  );
}

// ─── Notification row — dropdown ─────────────────────────────────────────────
// Uses left colored bar for severity (standard EHR/healthcare pattern)
function NotifRow({ n, T, isDark, onClick, onDelete }) {
  const sev   = getSeverity(n.notification_type);
  const Icon  = getIcon(n.notification_type);
  const unread = !n.is_read;

  return (
    <div className="group relative flex items-center gap-2.5 pr-2.5 pl-3.5 py-2 cursor-pointer transition-colors"
      style={{
        background: unread ? T.rowUnread : 'transparent',
        borderBottom: `1px solid ${T.rowBdr}`,
      }}
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.background = T.rowHover}
      onMouseLeave={e => e.currentTarget.style.background = unread ? T.rowUnread : 'transparent'}>

      {/* Left severity bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r"
        style={{ background: unread ? sev.bar : 'transparent' }} />

      {/* Icon badge — 24×24, solid */}
      <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: sev.bar }}>
        <Icon size={11} color="#ffffff" strokeWidth={2.5} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] leading-tight truncate"
          style={{ color: T.title, fontWeight: unread ? 600 : 400 }}>
          {n.title}
        </p>
        <p className="text-[10px] truncate" style={{ color: isDark ? '#64748b' : '#6b7280' }}>
          {n.body}
        </p>
      </div>

      {/* Time + dismiss */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-1">
        <span className="text-[9px] whitespace-nowrap" style={{ color: T.time }}>{relTime(n.created_at)}</span>
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: T.body }}>
          <X size={9} />
        </button>
      </div>
    </div>
  );
}

