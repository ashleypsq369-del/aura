import { motion } from 'framer-motion';
import { AlertTriangle, Phone, UserPlus, ArrowUpCircle, Brain, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from '../utils/toast';
import ModalShell from './ui/ModalShell';

import { API_URL } from '../api/client';

export default function CriticalAlertModal({ alert, onClose }) {
 const queryClient = useQueryClient();
 const token = localStorage.getItem('auth_token');

 const handleAction = useMutation({
 mutationFn: async (action) => {
 await axios.put(`${API_URL}/api/alerts/${alert.id}/acknowledge`, {},
 { headers: { Authorization: `Bearer ${token}` } });
 return action;
 },
 onSuccess: (action) => {
 queryClient.invalidateQueries(['alerts']);
 const messages = { urgent:'Patient assigned to urgent review queue', contact:'Family contact notification sent', escalate:'Alert escalated to senior clinician' };
 toast.success(messages[action] || 'Action completed');
 onClose();
 },
 onError: () => toast.error('Failed to process action'),
 });

 if (!alert) return null;

 return (
 <ModalShell
 open={true}
 onClose={() => {}}
 title={`${alert.risk_level === 'Crisis' ? 'CRITICAL RISK' : 'HIGH RISK'} DETECTED`}
 description={`${alert.patient_name} - Immediate attention required`}
 icon={AlertTriangle}
 accent="red"
 size="lg"
 closeOnBackdrop={false}
 showClose={false}
 footer={
 <div className="flex flex-wrap gap-3">
 <button onClick={() => handleAction.mutate('urgent')} disabled={handleAction.isPending}
 className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-lg disabled:opacity-50">
 {handleAction.isPending ? <Loader2 size={16} className="animate-spin"/> : <UserPlus size={16}/>}
 Assign to Urgent Review
 </button>
 <button onClick={() => handleAction.mutate('contact')} disabled={handleAction.isPending}
 className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-5 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition shadow-lg disabled:opacity-50">
 <Phone size={16}/> Contact Family Now
 </button>
 <button onClick={() => handleAction.mutate('escalate')} disabled={handleAction.isPending}
 className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition shadow-lg disabled:opacity-50">
 <ArrowUpCircle size={16}/> Escalate to Senior
 </button>
 </div>
 }
 >
 <div className="space-y-4">
 {/* Risk score */}
 <div className="flex items-center justify-between p-5 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 rounded-2xl border-2 border-red-200 dark:border-red-700">
 <div>
 <span className="block text-xs font-bold text-red-800 dark:text-red-300 mb-1">Risk Score</span>
 <span className="text-sm text-red-700 dark:text-red-400">Threshold exceeded - Crisis Level</span>
 </div>
 <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type:'spring' }}
 className="text-5xl font-black text-red-600">
 {Math.round(alert.risk_score * 100)}%
 </motion.div>
 </div>

 {/* SHAP drivers */}
 {alert.top_shap_features?.length > 0 && (
 <div>
 <h3 className="text-sm font-bold text-[var(--text-800)] mb-3 flex items-center gap-2">
 <span className="w-2 h-2 bg-red-600 rounded-full"/> Top Risk Drivers (SHAP Analysis)
 </h3>
 <div className="space-y-2">
 {alert.top_shap_features.map((feature, idx) => (
 <motion.div key={idx} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay: 0.08*idx }}
 className="flex items-center justify-between px-4 py-3 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)]">
 <div className="flex items-center gap-3 flex-1 min-w-0">
 <div className="w-7 h-7 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">{idx+1}</div>
 <div className="min-w-0">
 <p className="font-semibold text-[var(--text-900)] text-sm truncate">{feature.feature}</p>
 <p className="text-xs text-slate-500">Value: <span className="font-medium">{feature.value}</span></p>
 </div>
 </div>
 <div className="flex items-center gap-2 flex-shrink-0">
 <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
 <motion.div className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full"
 initial={{ width:0 }} animate={{ width:`${feature.impact*100}%` }} transition={{ delay:0.1*idx, duration:0.5 }}/>
 </div>
 <span className="text-sm font-black text-red-600 w-12 text-right">+{Math.round(feature.impact*100)}%</span>
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 )}

 {/* AI Explanation */}
 {alert.explanation && (
 <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
 <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
 <Brain size={17} className="text-white"/>
 </div>
 <div>
 <p className="font-bold text-[var(--text-900)] text-sm mb-1">AI Clinical Assessment</p>
 <p className="text-[var(--text-700)] text-sm leading-relaxed">{alert.explanation}</p>
 </div>
 </div>
 )}

 {/* Required action notice */}
 <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
 <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-1">⚡ Immediate Action Required</p>
 <p className="text-blue-800 dark:text-blue-400 text-xs">Select one of the actions below to ensure this patient receives appropriate care within the next hour.</p>
 </div>
 </div>
 </ModalShell>
 );
}
