import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, UserPlus, ArrowUpCircle, Brain } from 'lucide-react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from '../utils/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function CriticalAlertModal({ alert, onClose }) {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('auth_token');

  const handleAction = useMutation({
    mutationFn: async (action) => {
      // Acknowledge the alert
      await axios.put(
        `${API_URL}/api/alerts/${alert.id}/acknowledge`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      return action;
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries(['alerts']);
      
      const messages = {
        urgent: 'Patient assigned to urgent review queue',
        contact: 'Family contact notification sent',
        escalate: 'Alert escalated to senior clinician'
      };
      
      toast.success(messages[action] || 'Action completed');
      onClose();
    },
    onError: () => {
      toast.error('Failed to process action');
    }
  });

  if (!alert) return null;

  return (
    <AnimatePresence>
      <Dialog
        open={true}
        onClose={() => {}} // Cannot close by clicking outside
        className="relative z-50"
        static // Prevent closing on backdrop click
      >
        {/* Backdrop - Non-clickable */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm pointer-events-none"
        />

        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel
            as={motion.div}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{
              borderTop: '6px solid #DC2626',
              animation: 'crisis-glow 2s infinite'
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 px-8 py-6 border-b-2 border-red-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <AlertTriangle className="w-9 h-9 text-white" />
                  </motion.div>
                  <div>
                    <Dialog.Title className="text-3xl font-bold text-red-900 mb-1">
                      {alert.risk_level === 'Crisis' ? 'CRITICAL RISK' : 'HIGH RISK'} DETECTED
                    </Dialog.Title>
                    <p className="text-xl text-red-700 font-semibold">
                      {alert.patient_name}
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      Immediate attention required
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Risk Score */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-red-50 to-red-100 rounded-2xl border-2 border-red-200 shadow-inner">
                  <div>
                    <span className="block text-sm font-semibold text-red-800 uppercase tracking-wide mb-1">
                      Risk Score
                    </span>
                    <span className="block text-lg text-red-700">
                      Threshold: 78% (Crisis Level)
                    </span>
                  </div>
                  <div className="text-right">
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className="text-6xl font-bold text-red-600"
                    >
                      {Math.round(alert.risk_score * 100)}%
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Top Risk Drivers */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                  Top Risk Drivers (SHAP Analysis)
                </h3>
                <div className="space-y-3">
                  {alert.top_shap_features?.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * (idx + 1) }}
                      className="group"
                    >
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-200">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{feature.feature}</div>
                            <div className="text-sm text-gray-600">Current value: <span className="font-medium">{feature.value}</span></div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {/* Impact Bar */}
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${feature.impact * 100}%` }}
                              transition={{ delay: 0.2 * (idx + 1), duration: 0.5 }}
                              className="h-full bg-gradient-to-r from-orange-500 to-red-600"
                            />
                          </div>
                          <span className="text-lg font-bold text-red-600 min-w-[60px] text-right">
                            +{Math.round(feature.impact * 100)}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* AI Explanation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl shadow-sm"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <Brain size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">AI Clinical Assessment</h4>
                    <p className="text-gray-800 leading-relaxed">
                      {alert.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Recommended Actions Banner */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2">⚡ Immediate Actions Required</h4>
                <p className="text-blue-800 text-sm">
                  Select one of the actions below to ensure this patient receives appropriate care within the next hour.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 px-8 py-6 border-t-2 border-gray-200 flex flex-wrap gap-3">
              <button
                onClick={() => handleAction.mutate('urgent')}
                disabled={handleAction.isPending}
                className="flex-1 min-w-[200px] flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                <UserPlus className="w-5 h-5" />
                <span>Assign to Urgent Review</span>
              </button>

              <button
                onClick={() => handleAction.mutate('contact')}
                disabled={handleAction.isPending}
                className="flex-1 min-w-[200px] flex items-center justify-center space-x-2 px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                <Phone className="w-5 h-5" />
                <span>Contact Family Now</span>
              </button>

              <button
                onClick={() => handleAction.mutate('escalate')}
                disabled={handleAction.isPending}
                className="flex-1 min-w-[200px] flex items-center justify-center space-x-2 px-6 py-4 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                <ArrowUpCircle className="w-5 h-5" />
                <span>Escalate to Senior</span>
              </button>
            </div>
          </Dialog.Panel>
        </div>

        {/* Keyframe animation for glow effect */}
        <style jsx>{`
          @keyframes crisis-glow {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4);
            }
            50% {
              box-shadow: 0 0 0 20px rgba(220, 38, 38, 0);
            }
          }
        `}</style>
      </Dialog>
    </AnimatePresence>
  );
}
