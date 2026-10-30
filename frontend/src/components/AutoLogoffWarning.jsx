import { AlertTriangle, Clock, Activity } from 'lucide-react';
import ModalShell from './ui/ModalShell';

/**
 * Auto-Logoff Warning Modal - HIPAA Compliance
 * T4TSA design: gradient header, dark blur backdrop
 */
export default function AutoLogoffWarning({ show, remainingSeconds, onStayActive, onLogout }) {
 if (!show) return null;

 const minutes = Math.floor(remainingSeconds / 60);
 const seconds = remainingSeconds % 60;

 return (
 <ModalShell
 open={show}
 onClose={onStayActive}
 title="Session Timeout Warning"
 description="HIPAA Security Requirement"
 icon={AlertTriangle}
 accent="amber"
 size="sm"
 zIndex={9999}
 closeOnBackdrop={false}
 showClose={false}
 footer={
 <div className="grid grid-cols-2 gap-3">
 <button onClick={onStayActive}
 className="flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-all shadow-sm">
 <Activity size={16}/> I'm Still Here
 </button>
 <button onClick={onLogout}
 className="py-3 bg-[var(--card-bg)] border-2 border-slate-300 dark:border-slate-600 text-[var(--text-700)] rounded-xl font-semibold hover:bg-[var(--card-bg)] transition-all">
 Logout Now
 </button>
 </div>
 }
 >
 <div className="space-y-4">
 {/* Countdown circle */}
 <div className="text-center py-2">
 <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-amber-50 border-4 border-amber-300 mb-3">
 <div className="text-center">
 <Clock className="w-8 h-8 text-amber-600 mx-auto mb-1"/>
 <p className="text-2xl font-black text-amber-700 tabular-nums">
 {minutes}:{seconds.toString().padStart(2,'0')}
 </p>
 </div>
 </div>
 <p className="text-base font-semibold text-[var(--text-800)] dark:text-slate-200">
 Auto-logout in <span className="text-amber-600 font-black">{remainingSeconds}s</span>
 </p>
 </div>
 {/* Message */}
 <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
 <p className="text-sm text-[var(--text-700)] leading-relaxed">
 <span className="font-bold">For your security:</span> You've been inactive for 14 minutes.
 To protect patient data and comply with HIPAA regulations, you will be logged out after 15 minutes of inactivity.
 </p>
 </div>
 <p className="text-xs text-[var(--text-400)] text-center">
 Any mouse movement, click, or key press will reset the timer.
 </p>
 </div>
 </ModalShell>
 );
}
