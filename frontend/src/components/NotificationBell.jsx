import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import toast from '../utils/toast';
import { useNavigate } from 'react-router-dom';

import { API_URL } from '../api/client';

export default function NotificationBell() {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Poll for unread count every 30 seconds
  const { data: countData } = useQuery({
    queryKey: ['alert-count'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/api/alerts/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    refetchInterval: 30000, // 30 seconds
    refetchIntervalInBackground: true,
  });

  // Fetch full alert list when dropdown opens
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/api/alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: showDropdown,
  });

  const unreadCount = countData?.count || 0;

  const lastCountRef = useRef(0);

  // Show toast notification when count increases
  useEffect(() => {
    const showNotificationIfNeeded = () => {
      if (unreadCount > lastCountRef.current && lastCountRef.current > 0) {
        toast((t) => (
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">New Alert</p>
              <p className="text-xs text-[var(--text-600)]">You have {unreadCount - lastCountRef.current} new alert(s)</p>
            </div>
            <button onClick={() => toast.dismiss(t.id)} className="ml-2">
              <X size={16} />
            </button>
          </div>
        ), {
          duration: 5000,
          position: 'top-right',
          icon: null,
        });
      }
      lastCountRef.current = unreadCount;
    };
    showNotificationIfNeeded();
  }, [unreadCount]);

  // Acknowledge alert mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId) => {
      const token = localStorage.getItem('auth_token');
      return axios.put(
        `${API_URL}/api/alerts/${alertId}/acknowledge`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      queryClient.invalidateQueries(['alert-count']);
      toast.success('Alert acknowledged');
    },
  });

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-teal-600 bg-blue-50';
      default: return 'text-[var(--text-600)] bg-[var(--card-bg)]';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-[var(--card-border)]/30 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-[var(--text-700)]" />
        
        {/* Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}

        {/* Pulse animation for critical alerts */}
        {unreadCount > 0 && (
          <motion.span
            className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 0, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-30"
              onClick={() => setShowDropdown(false)}
            />

            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-[var(--card-bg)] rounded-xl shadow-2xl border border-[var(--card-border)] z-40 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-red-50 to-orange-50 border-b border-[var(--card-border)] flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[var(--text-900)]">Notifications</h3>
                  <p className="text-xs text-[var(--text-600)]">{unreadCount} unread</p>
                </div>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1 rounded hover:bg-white/50 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Alert List */}
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center text-[var(--text-500)]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aura-forest mx-auto mb-2"></div>
                    <p className="text-sm">Loading alerts...</p>
                  </div>
                ) : alerts && alerts.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {alerts.slice(0, 10).map((alert) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-4 hover:bg-[var(--card-bg)] transition-colors ${
                          alert.is_acknowledged ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between space-x-3">
                          <div className="flex-1 min-w-0">
                            {/* Severity Badge */}
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-1 ${getSeverityColor(alert.severity)}`}>
                              {alert.severity}
                            </span>

                            {/* Alert Type */}
                            <p className="text-sm font-medium text-[var(--text-900)] mb-1">
                              {alert.alert_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>

                            {/* Message */}
                            <p className="text-sm text-[var(--text-600)] mb-2">
                              {alert.message}
                            </p>

                            {/* Time */}
                            <p className="text-xs text-[var(--text-500)]">
                              {formatTime(alert.created_at)}
                            </p>
                          </div>

                          {/* Action Button */}
                          {!alert.is_acknowledged && (
                            <button
                              onClick={() => acknowledgeMutation.mutate(alert.id)}
                              disabled={acknowledgeMutation.isPending}
                              className="flex-shrink-0 p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors disabled:opacity-50"
                              title="Mark as read"
                            >
                              <Check size={18} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-[var(--text-500)]">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium">No alerts</p>
                    <p className="text-xs text-[var(--text-400)]">You're all caught up!</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {alerts && alerts.length > 0 && (
                <div className="px-4 py-3 bg-[var(--card-bg)] border-t border-[var(--card-border)]">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/alerts');
                    }}
                    className="text-sm text-aura-forest font-medium hover:text-green-700 transition-colors"
                  >
                    View all alerts →
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
