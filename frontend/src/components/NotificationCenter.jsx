import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Calendar, Pill, AlertTriangle, Activity,
  Check, X, Trash2, MessageSquare, FileText,
  Users, Heart, ChevronRight, ArrowLeft, ExternalLink
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from '../utils/toast';
import apiClient from '../api/client';

// € Category definitions €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
const CATEGORIES = [
  {
    id: 'all',
    label: 'All Notifications',
    icon: Bell,
    iconColor: '#ffffff',
    bgColor:   '#0d9488',  // teal-600
    bdColor:   '#0f766e',  // teal-700
    types: null,
  },
  {
    id: 'appointments',
    label: 'Appointments',
    icon: Calendar,
    iconColor: '#ffffff',
    bgColor:   '#0284c7',  // sky-600
    bdColor:   '#0369a1',  // sky-700
    types: ['appointment_reminder_24h', 'appointment_reminder_1h'],
  },
  {
    id: 'medications',
    label: 'Medications',
    icon: Pill,
    iconColor: '#ffffff',
    bgColor:   '#4338ca',  // indigo-700
    bdColor:   '#3730a3',  // indigo-800
    types: ['medication_reminder', 'medication_missed'],
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: MessageSquare,
    iconColor: '#ffffff',
    bgColor:   '#059669',  // emerald-600
    bdColor:   '#047857',  // emerald-700
    types: ['new_message'],
  },
  {
    id: 'alerts',
    label: 'Clinical Alerts',
    icon: AlertTriangle,
    iconColor: '#ffffff',
    bgColor:   '#e11d48',  // rose-600
    bdColor:   '#be123c',  // rose-700
    types: ['critical_vitals', 'high_risk', 'report_available'],
  },
  {
    id: 'social',
    label: 'Community & Social',
    icon: Users,
    iconColor: '#ffffff',
    bgColor:   '#7c3aed',  // violet-600
    bdColor:   '#6d28d9',  // violet-700
    types: ['community_post', 'community_reply', 'peer_support', 'group_invite'],
  },
];

const PRIORITY_COLORS = {
  critical: { bgColor: '#e11d48', iconColor: '#ffffff', bdColor: '#be123c', accentColor: '#e11d48' },
  high:     { bgColor: '#ea580c', iconColor: '#ffffff', bdColor: '#c2410c', accentColor: '#f97316' },
  medium:   { bgColor: '#0284c7', iconColor: '#ffffff', bdColor: '#0369a1', accentColor: '#0284c7' },
  low:      { bgColor: '#475569', iconColor: '#ffffff', bdColor: '#334155', accentColor: '#64748b' },
};

const ICON_MAP = {
  appointment_reminder_24h: Calendar,
  appointment_reminder_1h:  Calendar,
  medication_reminder:      Pill,
  medication_missed:        Pill,
  critical_vitals:          AlertTriangle,
  high_risk:                Activity,
  new_message:              MessageSquare,
  report_available:         FileText,
  community_post:           Users,
  community_reply:          Users,
  peer_support:             Heart,
  group_invite:             Users,
  default:                  Bell,
};

const NAV_ROUTES = {
  appointment_reminder_24h: '/appointments',
  appointment_reminder_1h:  '/appointments',
  medication_reminder:      '/medications',
  medication_missed:        '/medications',
  critical_vitals:          '/alerts',
  new_message:              '/messages',
  report_available:         '/dashboard',
  community_post:           '/community',
  community_reply:          '/community',
  peer_support:             '/community',
};

function getPriority(type) {
  if (type?.includes('critical') || type?.includes('missed')) return 'critical';
  if (type?.includes('1h') || type?.includes('high'))         return 'high';
  if (type?.includes('reminder') || type?.includes('message') || type?.includes('community')) return 'medium';
  return 'low';
}

// € Main component €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
export default function NotificationCenter() {
  const [showDropdown, setShowDropdown]         = useState(false);
  const [activeCategory, setActiveCategory]     = useState(null);
  const [showAllModal, setShowAllModal]         = useState(false);
  const [allModalCategory, setAllModalCategory] = useState(null);
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/api/notifications?limit=50').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => apiClient.get('/api/notifications/unread-count').then(r => r.data),
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count || 0;

  const markAsReadMutation = useMutation({
    mutationFn: (id) => apiClient.put(`/api/notifications/${id}/read`),
    onSuccess: () => { queryClient.invalidateQueries(['notifications']); queryClient.invalidateQueries(['unread-count']); },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiClient.put('/api/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unread-count']);
      toast.success('All marked as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/api/notifications/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['notifications']); queryClient.invalidateQueries(['unread-count']); },
  });

  const clearReadMutation = useMutation({
    mutationFn: () => apiClient.delete('/api/notifications/clear-read'),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unread-count']);
      toast.success('Read notifications cleared');
    },
  });

  const handleNotifClick = (n) => {
    if (!n.is_read) markAsReadMutation.mutate(n.id);
    const route = NAV_ROUTES[n.notification_type];
    if (route) navigate(route);
    setShowDropdown(false);
    setActiveCategory(null);
  };

  useEffect(() => {
    notifications
      .filter(n => !n.is_read && (n.notification_type?.includes('critical') || n.notification_type?.includes('missed')))
      .forEach(n => toast.error(
        <div className="flex gap-2"><AlertTriangle size={16} className="text-red-600 flex-shrink-0" /><div><p className="font-bold text-sm">{n.title}</p><p className="text-xs">{n.body}</p></div></div>,
        { duration: 10000, id: `critical-${n.id}` }
      ));
  }, [notifications]);

  const getCount = (cat) => {
    const unread = notifications.filter(n => !n.is_read);
    if (!cat.types) return unread.length;
    return unread.filter(n => cat.types.includes(n.notification_type)).length;
  };

  const categoryNotifs = activeCategory
    ? activeCategory.types
      ? notifications.filter(n => activeCategory.types.includes(n.notification_type))
      : notifications
    : [];

  const close = () => { setShowDropdown(false); setActiveCategory(null); };

  return (
    <>
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => { setShowDropdown(!showDropdown); setActiveCategory(null); }}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" color="#ffffff" />
        {unreadCount > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] min-h-[18px] flex items-center justify-center px-1 shadow-lg">
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={close} />

            {/* € CATEGORY LIST VIEW € */}
            {!activeCategory && (
              <motion.div
                key="category-list"
                initial={{ opacity: 0, y: -10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border border-slate-300 dark:border-gray-700 z-50 overflow-hidden bg-white dark:bg-gray-900"
              >
                {/* Header */}
                <div className="px-5 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg border border-teal-400 bg-white/20 flex items-center justify-center">
                      <Bell size={16} strokeWidth={2.5} className="text-white" />
                    </div>
                    <h3 className="font-bold text-white text-base">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-rose-500 text-white shadow-sm">{unreadCount} new</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={() => markAllAsReadMutation.mutate()}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5">
                        <Check size={14} strokeWidth={2.5} /> Mark read
                      </button>
                    )}
                    {/* X close - transparent bg, white icon, rose on hover */}
                    <button onClick={close}
                      className="w-8 h-8 bg-transparent hover:bg-rose-500 border border-white/30 hover:border-rose-400 rounded-lg flex items-center justify-center transition group">
                      <X size={18} strokeWidth={2.5} className="text-white group-hover:text-white transition-colors" />
                    </button>
                  </div>
                </div>

                {/* Category list */}
                <div className="divide-y divide-slate-200 dark:divide-gray-700">
                  {CATEGORIES.map(cat => {
                    const Icon  = cat.icon;
                    const count = getCount(cat);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat)}
                        className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-left group"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
                          style={{ backgroundColor: cat.bgColor, borderColor: cat.bdColor }}
                        >
                          <Icon size={20} strokeWidth={2.5} style={{ color: cat.iconColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">{cat.label}</p>
                          <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
                            {cat.types
                              ? notifications.filter(n => cat.types.includes(n.notification_type)).length
                              : notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {count > 0 && (
                            <span
                              className="px-2 py-0.5 text-[10px] font-bold rounded-full min-w-[20px] text-center border"
                              style={{ backgroundColor: cat.bgColor, borderColor: cat.bdColor, color: cat.iconColor }}
                            >
                              {count}
                            </span>
                          )}
                          <ChevronRight size={18} strokeWidth={3} className="notif-chevron" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-5 py-3 bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-700 flex justify-end">
                    <button onClick={() => clearReadMutation.mutate()}
                      className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold transition">
                      <Trash2 size={12} /> Clear read
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* € CATEGORY DETAIL VIEW € */}
            {activeCategory && (
              <motion.div
                key={`detail-${activeCategory.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 mt-2 w-96 rounded-2xl shadow-2xl border border-slate-300 dark:border-gray-700 z-50 overflow-hidden flex flex-col bg-white dark:bg-gray-900"
                style={{ maxHeight: '520px' }}
              >
                {/* Header */}
                <div className="px-5 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 flex items-center gap-3 flex-shrink-0 shadow-md">
                  <button onClick={() => setActiveCategory(null)}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition flex-shrink-0">
                    <ArrowLeft size={18} strokeWidth={2.5} className="text-white" />
                  </button>
                  <div className="w-10 h-10 rounded-xl border border-white/30 bg-white/20 flex items-center justify-center flex-shrink-0">
                    <activeCategory.icon size={20} strokeWidth={2.5} className="text-white" />
                  </div>
                  <h3 className="font-bold text-lg flex-1 text-white">{activeCategory.label}</h3>
                  <span className="text-xs font-bold text-white bg-white/20 px-2.5 py-1 rounded-full">{categoryNotifs.length} total</span>
                  {/* X close - transparent bg, white icon, rose on hover */}
                  <button onClick={close}
                    className="w-9 h-9 bg-transparent hover:bg-rose-500 border border-white/30 hover:border-rose-400 rounded-lg flex items-center justify-center transition group">
                    <X size={18} strokeWidth={2.5} className="text-white group-hover:text-white transition-colors" />
                  </button>
                </div>

                {/* Notification list */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-gray-700">
                  {categoryNotifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: activeCategory.bgColor }}
                      >
                        <activeCategory.icon size={24} strokeWidth={2.5} style={{ color: activeCategory.iconColor }} />
                      </div>
                      <p className="font-semibold text-slate-700 dark:text-gray-300 text-sm">No {activeCategory.label.toLowerCase()}</p>
                      <p className="text-slate-400 dark:text-gray-500 text-xs mt-1">You're all caught up!</p>
                    </div>
                  ) : (
                    categoryNotifs.map(n => {
                      const Icon     = ICON_MAP[n.notification_type] || ICON_MAP.default;
                      const priority = getPriority(n.notification_type);
                      const pc       = PRIORITY_COLORS[priority];
                      return (
                        <div
                          key={n.id}
                          className={`notif-row relative flex gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
                            !n.is_read
                              ? 'notif-row-unread bg-slate-100 hover:bg-slate-200'
                              : 'notif-row-read bg-slate-50 hover:bg-slate-100'
                          }`}
                          onClick={() => handleNotifClick(n)}
                        >
                          {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: pc.accentColor }} />}
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border"
                            style={{ backgroundColor: pc.bgColor, borderColor: pc.bdColor }}
                          >
                            <Icon size={16} strokeWidth={2.5} style={{ color: pc.iconColor }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{n.title}</p>
                            <p className="text-xs text-slate-600 dark:text-gray-400 font-medium mt-0.5 line-clamp-2">{n.body}</p>
                            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1 font-semibold">
                              {new Date(n.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </p>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); deleteMutation.mutate(n.id); }}
                            className="notif-dismiss-btn"
                            title="Dismiss"
                          >
                            <X size={18} strokeWidth={3} />
                          </button>
                        </div>
                      );
                    })
                  )}
                  {categoryNotifs.length > 8 && (
                    <div className="p-3 bg-slate-50 dark:bg-gray-800 border-t border-slate-200 dark:border-gray-700 flex justify-center">
                      <button
                        onClick={() => { setAllModalCategory(activeCategory); setShowAllModal(true); }}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition"
                      >
                        <ExternalLink size={12} /> View All {categoryNotifs.length} †'
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>

    {/* € View All Notifications Modal €€€€€€€€€€€€€€€€€€€€€€€€ */}
    <AnimatePresence>
      {showAllModal && allModalCategory && (() => {
        const CatIcon = allModalCategory.icon;
        const modalNotifs = allModalCategory.types
          ? notifications.filter(n => allModalCategory.types.includes(n.notification_type))
          : notifications;
        return (
          <>
            <div className="fixed inset-0 bg-black/60 z-[60]" onClick={() => setShowAllModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-gray-700 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div
                  className="px-6 py-4 flex items-center justify-between flex-shrink-0"
                  style={{ background: `linear-gradient(to right, ${allModalCategory.bgColor}, ${allModalCategory.bdColor})` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                      <CatIcon size={20} className="text-white" strokeWidth={2.5} />
                    </div>
                    <h2 className="font-bold text-white text-lg">{allModalCategory.label}</h2>
                    <span className="px-2.5 py-0.5 bg-white/25 text-white text-sm font-bold rounded-full">{modalNotifs.length}</span>
                  </div>
                  {/* X close - transparent bg, white icon, rose on hover */}
                  <button onClick={() => setShowAllModal(false)}
                    className="w-8 h-8 bg-transparent hover:bg-rose-500 border border-white/30 hover:border-rose-400 rounded-lg flex items-center justify-center transition group">
                    <X size={16} strokeWidth={2.5} className="text-white group-hover:text-white transition-colors" />
                  </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-gray-700">
                  {modalNotifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-gray-500">
                      <CatIcon size={36} className="mb-3 opacity-30" />
                      <p className="font-semibold text-sm">No {allModalCategory.label.toLowerCase()}</p>
                      <p className="text-xs mt-1">You're all caught up!</p>
                    </div>
                  ) : modalNotifs.map(n => {
                    const Icon = ICON_MAP[n.notification_type] || ICON_MAP.default;
                    const priority = getPriority(n.notification_type);
                    const pc = PRIORITY_COLORS[priority];
                    return (
                      <div key={n.id}
                        className={`notif-row relative flex gap-3 px-5 py-4 cursor-pointer transition-colors ${
                          !n.is_read
                            ? 'notif-row-unread bg-slate-100 hover:bg-slate-200'
                            : 'notif-row-read bg-slate-50 hover:bg-slate-100'
                        }`}
                        onClick={() => { handleNotifClick(n); setShowAllModal(false); }}
                      >
                        {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-teal-500" />}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
                          style={{ backgroundColor: pc.bgColor, borderColor: pc.bdColor }}
                        >
                          <Icon size={17} strokeWidth={2.5} style={{ color: pc.iconColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{n.title}</p>
                          <p className="text-xs text-slate-700 dark:text-gray-400 font-medium mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1.5 font-semibold">
                            {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(n.id); }}
                          className="notif-dismiss-btn">
                          <X size={18} strokeWidth={3} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 bg-slate-50 dark:bg-gray-800 border-t border-slate-100 dark:border-gray-700 flex items-center justify-between">
                  <button onClick={() => markAllAsReadMutation.mutate()}
                    className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400 hover:text-teal-700 dark:hover:text-teal-400 font-semibold transition">
                    <Check size={12} /> Mark all read
                  </button>
                  <button onClick={() => setShowAllModal(false)}
                    className="px-4 py-2 bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200 text-xs font-bold rounded-lg transition">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        );
      })()}
    </AnimatePresence>
    </>
  );
}

