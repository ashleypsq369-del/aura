/**
 * Notifications.jsx - Polished notification centre
 * =================================================
 * Design: Linear / Notion / Stripe inbox style
 * - Clean card rows with left accent by priority
 * - Type icon in a soft pill badge
 * - Relative timestamps ("2 minutes ago")
 * - Unread indicator dot
 * - Grouped by Today / Earlier
 * - Keyboard accessible actions
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Pill, Calendar, MessageCircle, Users, FileText,
  Activity, CheckCheck, Trash2, Search,
  MailOpen, BellOff, Clock,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import toast from '../utils/toast';

// € Type config €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
const TYPE_CONFIG = {
  medication_reminder:  { icon: Pill,         label: 'Medication',   accent: '#0891b2', bg: '#ecfeff', color: '#0e7490' },
  appointment_reminder: { icon: Calendar,     label: 'Appointment',  accent: '#7c3aed', bg: '#f5f3ff', color: '#6d28d9' },
  new_message:          { icon: MessageCircle,label: 'Message',      accent: '#0d9488', bg: '#f0fdfa', color: '#0f766e' },
  community_event:      { icon: Users,        label: 'Community',    accent: '#059669', bg: '#f0fdf4', color: '#047857' },
  care_plan_update:     { icon: FileText,     label: 'Care Plan',    accent: '#2563eb', bg: '#eff6ff', color: '#1d4ed8' },
  assessment_reminder:  { icon: Activity,     label: 'Assessment',   accent: '#d97706', bg: '#fffbeb', color: '#b45309' },
  report_available:     { icon: FileText,     label: 'Report',       accent: '#6b7280', bg: '#f9fafb', color: '#374151' },
  alert_generated:      { icon: Bell,         label: 'Alert',        accent: '#dc2626', bg: '#fef2f2', color: '#b91c1c' },
  medical_flag:         { icon: Bell,         label: 'Flag',         accent: '#dc2626', bg: '#fef2f2', color: '#b91c1c' },
  crisis_alert:         { icon: Bell,         label: 'Crisis',       accent: '#991b1b', bg: '#fff1f2', color: '#991b1b' },
};

const DEFAULT_TYPE = { icon: Bell, label: 'Notification', accent: '#6b7280', bg: '#f9fafb', color: '#374151' };

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || DEFAULT_TYPE;
}

// € Relative time €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
function relativeTime(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// € Is today? €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
function isToday(dateStr) {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

// € Single notification row €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
function NotifRow({ notif, onRead, onDelete }) {
  const cfg = getTypeConfig(notif.notification_type);
  const Icon = cfg.icon;
  const isUnread = !notif.is_read;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8, height: 0 }}
      transition={{ duration: 0.18 }}
      className={`group relative flex items-start gap-3 px-4 py-3.5 transition-colors ${
        isUnread ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/50 hover:bg-slate-100/60'
      }`}
    >
      {/* Left accent bar */}
      {isUnread && (
        <div
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
          style={{ background: cfg.accent }}
        />
      )}

      {/* Type icon */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
        style={{ background: cfg.bg }}
      >
        <Icon size={16} style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Type badge + timestamp */}
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.label}
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock size={10} />
                {relativeTime(notif.created_at)}
              </span>
              {isUnread && (
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
              )}
            </div>
            {/* Title */}
            <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-600'}`}>
              {notif.title}
            </p>
            {/* Body */}
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
              {notif.body}
            </p>
          </div>

          {/* Actions - appear on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {isUnread && (
              <button
                onClick={() => onRead(notif.id)}
                data-tip="Mark as read"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                aria-label="Mark as read"
              >
                <MailOpen size={14} />
              </button>
            )}
            <button
              onClick={() => onDelete(notif.id)}
              data-tip="Delete notification"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label="Delete notification"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// € Group header €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
function GroupHeader({ label, count }) {
  return (
    <div className="px-4 py-2 flex items-center gap-2">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <div className="h-px flex-1 bg-slate-100" />
      <span className="text-xs text-slate-400">{count}</span>
    </div>
  );
}

// € Main component €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
export default function Notifications() {
  const [search, setSearch]   = useState('');
  const [typeFilter, setType] = useState('all');
  const [statusFilter, setStatus] = useState('all');
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const r = await apiClient.get('/api/notifications', { params: { limit: 100 } });
      return r.data;
    },
  });

  const markRead = useMutation({
    mutationFn: (id) => apiClient.put(`/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notification-count']);
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => apiClient.put('/api/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notification-count']);
      toast.success('All notifications marked as read');
    },
  });

  const del = useMutation({
    mutationFn: (id) => apiClient.delete(`/api/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notification-count']);
    },
  });

  const clearRead = useMutation({
    mutationFn: () => apiClient.delete('/api/notifications/clear-read'),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.info('Read notifications cleared');
    },
  });

  // Filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return notifications.filter(n => {
      const matchSearch = !q || n.title?.toLowerCase().includes(q) || n.body?.toLowerCase().includes(q);
      const matchType   = typeFilter === 'all' || n.notification_type === typeFilter;
      const matchStatus = statusFilter === 'all'
        || (statusFilter === 'unread' && !n.is_read)
        || (statusFilter === 'read'   && n.is_read);
      return matchSearch && matchType && matchStatus;
    });
  }, [notifications, search, typeFilter, statusFilter]);

  // Group
  const today   = filtered.filter(n => isToday(n.created_at));
  const earlier = filtered.filter(n => !isToday(n.created_at));
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const typeOptions = [
    { value: 'all',                   label: 'All types' },
    { value: 'medication_reminder',   label: 'Medications' },
    { value: 'appointment_reminder',  label: 'Appointments' },
    { value: 'new_message',           label: 'Messages' },
    { value: 'care_plan_update',      label: 'Care Plans' },
    { value: 'assessment_reminder',   label: 'Assessments' },
    { value: 'alert_generated',       label: 'Alerts' },
    { value: 'community_event',       label: 'Community' },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">

        {/* € Header € */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center">
                <Bell size={16} className="text-teal-700" />
              </div>
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-teal-600 text-white text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 ml-10">
              {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Bulk actions */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                data-tip="Mark all as read"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 transition-colors disabled:opacity-50"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
            <button
              onClick={() => { if (window.confirm('Clear all read notifications?')) clearRead.mutate(); }}
              data-tip="Remove all read notifications"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 hover:border-red-200 transition-colors"
            >
              <BellOff size={13} />
              Clear read
            </button>
          </div>
        </div>

        {/* € Filters € */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px] search-wrap">
            <span className="search-icon"><Search size={15} /></span>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notifications..."
              className="w-full py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 bg-white"
              aria-label="Search notifications"
            />
          </div>
          {/* Type */}
          <select
            value={typeFilter}
            onChange={e => setType(e.target.value)}
            data-tip="Filter by type"
            className="py-2 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-400 text-slate-700"
          >
            {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {/* Status */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {['all', 'unread', 'read'].map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                  statusFilter === s
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* € Notification list € */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-4 border-b border-slate-100 last:border-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 skeleton flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-slate-100 rounded skeleton" />
                  <div className="h-3.5 w-3/4 bg-slate-100 rounded skeleton" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Bell size={24} className="text-slate-300" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">No notifications</p>
            <p className="text-sm text-slate-400">
              {search || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {today.length > 0 && (
              <>
                <GroupHeader label="Today" count={today.length} />
                <AnimatePresence initial={false}>
                  {today.map(n => (
                    <NotifRow
                      key={n.id}
                      notif={n}
                      onRead={markRead.mutate}
                      onDelete={del.mutate}
                    />
                  ))}
                </AnimatePresence>
              </>
            )}
            {earlier.length > 0 && (
              <>
                <GroupHeader label="Earlier" count={earlier.length} />
                <AnimatePresence initial={false}>
                  {earlier.map(n => (
                    <NotifRow
                      key={n.id}
                      notif={n}
                      onRead={markRead.mutate}
                      onDelete={del.mutate}
                    />
                  ))}
                </AnimatePresence>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

