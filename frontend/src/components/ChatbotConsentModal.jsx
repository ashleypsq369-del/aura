import { useState } from 'react';
import { AlertTriangle, CheckCircle, Heart, ShieldCheck, Sparkles } from 'lucide-react';
import ModalShell from './ui/ModalShell';

export default function ChatbotConsentModal({ isOpen, onAccept, onDecline, userName }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <ModalShell
      open={isOpen}
      onClose={onDecline}
      title="Meet Aura AI"
      description={userName ? `Hi ${userName?.split(' ')[0]}, a quick note before we chat` : 'A quick note before we chat'}
      icon={Sparkles}
      accent="teal"
      size="md"
      zIndex={60}
      footer={
        <div className="flex items-center justify-between gap-3">
          <button onClick={onDecline}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 dark:border-slate-600 dark:text-slate-300 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all">
            Use Human Support
          </button>
          <button onClick={onAccept} disabled={!agreed}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
              agreed ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}>
            <Sparkles size={15}/> Start Chatting with Aura
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Critical disclaimer */}
        <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2.5}/>
          <div>
            <p className="font-bold text-amber-900 dark:text-amber-300 text-sm">Aura is an AI, not a medical professional</p>
            <p className="text-amber-800 dark:text-amber-400 text-xs mt-1 leading-relaxed">
              I cannot diagnose, prescribe, or provide emergency care. For urgent medical needs, contact your care team or call <strong>193</strong>.
            </p>
          </div>
        </div>

        {/* CAN / CANNOT */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-xl p-3.5">
            <p className="text-xs font-bold text-teal-700 dark:text-teal-400  mb-2 flex items-center gap-1.5">
              <CheckCircle size={12}/> What I can do
            </p>
            <ul className="space-y-1.5 text-xs text-teal-900 dark:text-teal-200">
              {['Navigate the platform','View your records','Answer care questions','Offer emotional support','Explain features'].map(t => (
                <li key={t} className="flex items-start gap-1.5"><span className="text-teal-500 font-bold mt-0.5">✓</span>{t}</li>
              ))}
            </ul>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-3.5">
            <p className="text-xs font-bold text-red-700 dark:text-red-400  mb-2 flex items-center gap-1.5">
              <AlertTriangle size={12}/> What I cannot do
            </p>
            <ul className="space-y-1.5 text-xs text-red-900 dark:text-red-200">
              {['Diagnose conditions','Prescribe medications','Handle emergencies','Replace your doctor','Modify records'].map(t => (
                <li key={t} className="flex items-start gap-1.5"><span className="text-red-500 font-bold mt-0.5">✗</span>{t}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Privacy */}
        <div className="flex gap-3 p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
          <ShieldCheck size={16} className="text-slate-500 flex-shrink-0 mt-0.5"/>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Conversations are securely stored and may be reviewed by your care team. Aura has <strong>read-only</strong> access to your health data. All data is HIPAA-compliant and encrypted.
          </p>
        </div>

        {/* Emergency */}
        <div className="flex gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
          <Heart size={16} className="text-red-500 flex-shrink-0 mt-0.5"/>
          <div className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
            <p className="font-bold mb-1">Emergency contacts (Ghana)</p>
            <p>🚨 Medical Emergency: <strong>193</strong> (Ambulance)</p>
            <p>📞 National Emergency: <strong>112</strong></p>
          </div>
        </div>

        {/* Consent checkbox */}
        <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-teal-400 transition-colors bg-[#e8fafa] dark:bg-slate-800">
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-teal-600 border-slate-400 focus:ring-teal-500 cursor-pointer accent-teal-600"/>
          <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            I understand Aura is an AI assistant. For medical concerns I will contact my care team or emergency services.
          </span>
        </label>
      </div>
    </ModalShell>
  );
}
