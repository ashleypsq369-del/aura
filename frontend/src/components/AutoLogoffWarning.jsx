import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, Activity } from 'lucide-react';

/**
 * Auto-Logoff Warning Modal
 * HIPAA Compliance: Warns user before automatic logout
 * Gap Analysis Priority 2
 * 
 * Shows at 14 minutes of inactivity, auto-logout at 15 minutes
 */
export default function AutoLogoffWarning({ 
  show, 
  remainingSeconds, 
  onStayActive, 
  onLogout 
}) {
  if (!show) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
            style={{ pointerEvents: 'auto' }}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-4 border-amber-400"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 rounded-t-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <AlertTriangle className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Session Timeout Warning
                    </h2>
                    <p className="text-amber-100 text-sm">
                      HIPAA Security Requirement
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Countdown */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 border-4 border-amber-300 mb-4">
                    <div className="text-center">
                      <Clock className="w-12 h-12 text-amber-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-amber-700">
                        {minutes}:{seconds.toString().padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    You will be automatically logged out in
                  </p>
                  <p className="text-2xl font-bold text-amber-600">
                    {remainingSeconds} second{remainingSeconds !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Message */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <span className="font-semibold">For your security:</span> You've been inactive for 14 minutes. 
                    To protect patient data and comply with HIPAA regulations, you will be automatically 
                    logged out after 15 minutes of inactivity.
                  </p>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={onStayActive}
                    className="flex items-center justify-center space-x-2 px-6 py-4 bg-teal-600 text-white rounded-xl font-bold hover:shadow-lg transition-all border-2 border-teal-500"
                  >
                    <Activity size={20} strokeWidth={2.5} />
                    <span>I'm Still Here</span>
                  </button>

                  <button
                    onClick={onLogout}
                    className="px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    Logout Now
                  </button>
                </div>

                {/* Info */}
                <div className="text-center pt-2 border-t-2 border-gray-200">
                  <p className="text-xs text-gray-500">
                     <span className="font-semibold">Tip:</span> Any mouse movement, click, or key press 
                    will reset the timer and keep you logged in.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}


