import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, X, Heart, ShieldCheck, Sparkles } from 'lucide-react';

export default function ChatbotConsentModal({ isOpen, onAccept, onDecline, userName }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 26 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200"
          >
            {/* -- Header -- */}
            <div className="relative bg-gradient-to-br from-teal-700 to-teal-600 px-7 py-6">
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/25">
                    <Sparkles size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-white leading-tight">Meet Aura AI</h3>
                    <p className="text-teal-100 text-sm mt-0.5">
                      {userName ? `Hi ${userName?.split(' ')[0]}, ` : ''}a quick note before we chat
                    </p>
                  </div>
                </div>
                <button onClick={onDecline}
                  className="w-8 h-8 bg-white/15 hover:bg-white/25 rounded-lg flex items-center justify-center transition flex-shrink-0">
                  <X size={16} className="text-white" />
                </button>
              </div>
            </div>

            {/* -- Body -- */}
            <div className="px-7 py-6 space-y-5 overflow-y-auto max-h-[55vh]">

              {/* Critical disclaimer */}
              <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <div>
                  <p className="font-bold text-amber-900 text-sm">Aura is an AI, not a medical professional</p>
                  <p className="text-amber-800 text-xs mt-1 leading-relaxed">
                    I cannot diagnose, prescribe, or provide emergency care. For urgent medical needs, contact your care team or call <strong>193</strong> (Ghana Ambulance).
                  </p>
                </div>
              </div>

              {/* CAN / CANNOT split */}
              <div className="grid grid-cols-2 gap-3">
                {/* CAN */}
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-teal-600" /> What I can do
                  </p>
                  <ul className="space-y-1.5 text-xs text-teal-900">
                    {['Navigate the platform', 'View your records', 'Answer care questions', 'Offer emotional support', 'Explain features'].map(t => (
                      <li key={t} className="flex items-start gap-1.5">
                        <span className="text-teal-500 font-bold mt-0.5">✓</span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* CANNOT */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-red-500" /> What I cannot do
                  </p>
                  <ul className="space-y-1.5 text-xs text-red-900">
                    {['Diagnose conditions', 'Prescribe medications', 'Handle emergencies', 'Replace your doctor', 'Modify records'].map(t => (
                      <li key={t} className="flex items-start gap-1.5">
                        <span className="text-red-500 font-bold mt-0.5">✗</span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Privacy */}
              <div className="flex gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <ShieldCheck size={18} className="text-slate-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  Conversations are securely stored and may be reviewed by your care team.
                  Aura has <strong>read-only</strong> access to your health data. All data is HIPAA-compliant and encrypted.
                </p>
              </div>

              {/* Emergency */}
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <Heart size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-800 leading-relaxed">
                  <p className="font-bold mb-1">Emergency contacts (Ghana)</p>
                  <p>🚨 Medical Emergency: <strong>193</strong> (Ambulance)</p>
                  <p>📞 National Emergency: <strong>112</strong></p>
                </div>
              </div>

              {/* Consent checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group p-4 rounded-xl border-2 border-slate-200 hover:border-teal-400 transition-colors bg-white">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4.5 h-4.5 rounded text-teal-600 border-slate-400 focus:ring-teal-500 cursor-pointer flex-shrink-0 accent-teal-600" />
                <span className="text-sm text-slate-700 leading-relaxed">
                  I understand Aura is an AI assistant. For medical concerns I will contact my care team or emergency services.
                </span>
              </label>
            </div>

            {/* -- Footer -- */}
            <div className="px-7 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button onClick={onDecline}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl hover:bg-white transition-all">
                Use Human Support
              </button>
              <button onClick={onAccept} disabled={!agreed}
                className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
                  agreed
                    ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-700/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}>
                <Sparkles size={15} />
                Start Chatting with Aura
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
