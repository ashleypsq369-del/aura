import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, X, AlertTriangle, Activity, ChevronDown, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from '../utils/toast';
import { useNavigate } from 'react-router-dom';
import { offlineAlertsAPI } from '../api/offlineClient';

export default function RealTimeAlerts() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const [lastAlertCount, setLastAlertCount] = useState(0);
  const navigate = useNavigate();

  const { data: alertsData } = useQuery({
    queryKey: ['realtime-alerts'],
    queryFn: async () => {
      const response = await offlineAlertsAPI.getAll();
      return response.data;
    },
    refetchInterval: 30000,
    onSuccess: (data) => {
      if (data && data.length > lastAlertCount) {
        const newAlerts = data.slice(0, data.length - lastAlertCount);
        newAlerts.forEach(alert => {
          if (alert.severity === 'critical') {
            toast.error(
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm">{alert.alert_type.replace(/_/g, ' ').toUpperCase()}</div>
                  <div className="text-xs mt-1">{alert.message}</div>
                </div>
              </div>,
              { duration: 10000, position: 'top-right' }
            );
          }
        });
      }
      setLastAlertCount(data?.length || 0);
    }
  });

  const unreadCount = alertsData?.length || 0;
  const recentAlerts = alertsData?.slice(0, 5) || [];
  const allAlerts = alertsData || [];

  return (
    <div className="relative">
      {/* Alert trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/20 transition-all"
        title="Medical Alerts"
      >
        <AlertCircle className="w-6 h-6" style={{ color: '#ffffff' }} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5
                       text-xs font-bold flex items-center justify-center border-2 border-white shadow-lg animate-pulse"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* -- Dropdown -- */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-96 rounded-xl shadow-2xl border border-slate-300 dark:border-gray-700 z-50 overflow-hidden flex flex-col bg-white dark:bg-gray-900"
              style={{ maxHeight: '480px' }}
            >
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-rose-600 to-red-600 shadow-md flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-white" />
                    <h3 className="font-bold text-white">Active Alerts</h3>
                    <span className="text-xs bg-white/25 text-white px-2 py-0.5 rounded-full font-bold">
                      {unreadCount}
                    </span>
                  </div>
                  {/* X close - transparent bg, white icon, rose on hover */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 flex items-center justify-center bg-transparent hover:bg-rose-500 border border-white/30 hover:border-rose-400 rounded-lg transition group"
                  >
                    <X size={18} strokeWidth={2.5} className="text-white group-hover:text-white transition-colors" />
                  </button>
                </div>
              </div>

              {/* Alert list */}
              <div className="flex-1 overflow-y-auto">
                {recentAlerts.length === 0 ? (
                  <div className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-400 dark:text-gray-600" />
                    <p className="font-medium text-slate-600 dark:text-gray-400">No active alerts</p>
                    <p className="text-sm text-slate-400 dark:text-gray-500">All patients stable</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-gray-700">
                    {recentAlerts.map((alert) => (
                      <AlertItem key={alert.id} alert={alert} onClose={() => setIsOpen(false)} />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 p-3 bg-slate-50 dark:bg-gray-800 border-t border-slate-200 dark:border-gray-700 flex items-center justify-between gap-2">
                {allAlerts.length > 5 && (
                  <button
                    onClick={() => setShowAllModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition"
                  >
                    <ExternalLink size={12} /> View All ({allAlerts.length})
                  </button>
                )}
                <button
                  onClick={() => { navigate('/alerts'); setIsOpen(false); }}
                  className="ml-auto text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition"
                >
                  Go to Alerts page →
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* -- View All Alerts Modal -- */}
      <AnimatePresence>
        {showAllModal && (
          <>
            <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowAllModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-gray-700 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">

                {/* Modal header */}
                <div className="bg-gradient-to-r from-rose-600 to-red-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                      <Activity size={20} className="text-white" />
                    </div>
                    <h2 className="font-bold text-white text-lg">All Active Alerts</h2>
                    <span className="px-2.5 py-0.5 bg-white/25 text-white text-sm font-bold rounded-full">{allAlerts.length}</span>
                  </div>
                  {/* X close - transparent bg, white icon, rose on hover */}
                  <button
                    onClick={() => setShowAllModal(false)}
                    className="w-8 h-8 bg-transparent hover:bg-rose-500 border border-white/30 hover:border-rose-400 rounded-lg flex items-center justify-center transition group"
                  >
                    <X size={16} strokeWidth={2.5} className="text-white group-hover:text-white transition-colors" />
                  </button>
                </div>

                {/* Severity filter pills */}
                <div className="severity-filter-bar px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 flex-wrap">
                  {['all', 'critical', 'high', 'medium', 'low'].map(sev => {
                    const count = sev === 'all' ? allAlerts.length : allAlerts.filter(a => a.severity === sev).length;
                    const colors = {
                      all:      'bg-slate-700 text-white',
                      critical: 'bg-red-600 text-white',
                      high:     'bg-orange-500 text-white',
                      medium:   'bg-amber-500 text-white',
                      low:      'bg-blue-500 text-white',
                    };
                    return count > 0 ? (
                      <span key={sev} className={`px-3 py-1 rounded-full text-xs font-bold ${colors[sev]}`}>
                        {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)} ({count})
                      </span>
                    ) : null;
                  })}
                </div>

                {/* Alert list */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-gray-700">
                  {allAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-gray-500">
                      <AlertCircle size={40} className="mb-3 opacity-30" />
                      <p className="font-semibold text-sm">No active alerts</p>
                      <p className="text-xs mt-1">All patients are stable</p>
                    </div>
                  ) : allAlerts.map(alert => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      onClose={() => { setShowAllModal(false); setIsOpen(false); }}
                    />
                  ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-gray-800 border-t border-slate-200 dark:border-gray-700 flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {allAlerts.length} alert{allAlerts.length !== 1 ? 's' : ''} total
                  </p>
                  <button
                    onClick={() => { navigate('/alerts'); setShowAllModal(false); setIsOpen(false); }}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl transition"
                  >
                    <ExternalLink size={14} /> Open Alerts Page
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// -- Alert row --------------------------------------------------------------
function AlertItem({ alert, onClose }) {
  const navigate = useNavigate();

  const severityConfig = {
    critical: {
      badge:       { backgroundColor: '#e11d48', borderColor: '#be123c', color: '#ffffff' },
      iconColor:   '#ffffff',
      iconBgStyle: { backgroundColor: '#e11d48', borderColor: '#be123c' },
      accentStyle: { borderLeftColor: '#e11d48' },
      Icon:        AlertTriangle,
    },
    high: {
      badge:       { backgroundColor: '#ea580c', borderColor: '#c2410c', color: '#ffffff' },
      iconColor:   '#ffffff',
      iconBgStyle: { backgroundColor: '#ea580c', borderColor: '#c2410c' },
      accentStyle: { borderLeftColor: '#f97316' },
      Icon:        AlertTriangle,
    },
    medium: {
      badge:       { backgroundColor: '#ca8a04', borderColor: '#a16207', color: '#ffffff' },
      iconColor:   '#ffffff',
      iconBgStyle: { backgroundColor: '#ca8a04', borderColor: '#a16207' },
      accentStyle: { borderLeftColor: '#eab308' },
      Icon:        Activity,
    },
    low: {
      badge:       { backgroundColor: '#0284c7', borderColor: '#0369a1', color: '#ffffff' },
      iconColor:   '#ffffff',
      iconBgStyle: { backgroundColor: '#0284c7', borderColor: '#0369a1' },
      accentStyle: { borderLeftColor: '#0284c7' },
      Icon:        Activity,
    },
  };

  // Type-specific overrides
  const typeLabels = {
    vital_abnormal:      'Abnormal Vitals',
    pain_spike:          'Pain Spike',
    missed_medication:   'Missed Medication',
    appointment_due:     'Appointment Due',
    deterioration:       'Deteriorating',
    deterioration_trend: 'ML Deterioration Trend',
    drug_interaction:    'Drug Interaction',
    ml_high_risk:        'ML High Risk Alert',
    system:              'System Alert',
  };

  const cfg = severityConfig[alert.severity] || severityConfig.low;
  const typeLabel = typeLabels[alert.alert_type] || alert.alert_type?.replace(/_/g, ' ');

  const handleClick = () => {
    if (alert.patient_id) {
      navigate(`/patients/${alert.patient_id}`);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="alert-item p-3 pl-4 border-l-4 hover:bg-slate-50 cursor-pointer transition-all"
      style={cfg.accentStyle}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div
          className="w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5"
          style={cfg.iconBgStyle}
        >
          <cfg.Icon size={16} strokeWidth={2.5} style={{ color: cfg.iconColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase"
              style={cfg.badge}
            >
              {alert.severity}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-gray-500 font-medium">
              {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
            {typeLabel}
          </p>
          <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {alert.message}
          </p>
          {alert.patient_name && (
            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1 font-semibold">
              Patient: <span className="text-slate-600 dark:text-gray-300">{alert.patient_name}</span>
            </p>
          )}
        </div>

        <ChevronDown
          size={16}
          className="transform -rotate-90 flex-shrink-0 mt-1 text-slate-400 dark:text-gray-500"
        />
      </div>
    </motion.div>
  );
}
