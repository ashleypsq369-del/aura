/**
 * VoiceCommandOverlay.jsx
 * Shows a floating toast at the bottom of the screen when voice
 * control hears a command - green tick = recognised, red = unknown.
 * Auto-dismisses after 3 seconds.
 */
import { useEffect, useState } from 'react';
import { Mic, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import voiceControlService from '../services/VoiceControlService';
import { useAccessibility } from '../context/AccessibilityContext';

export default function VoiceCommandOverlay() {
 const { settings } = useAccessibility();
 const [feedback, setFeedback] = useState(null);
 const [listening, setListening] = useState(false);

 useEffect(() => {
 if (!settings.voiceControl) return;

 // Poll listening state (lightweight)
 const poll = setInterval(() => {
 setListening(voiceControlService.getIsListening());
 }, 1000);

 const unsub = voiceControlService.onCommandFeedback(({ command, matched }) => {
 setFeedback({ command, matched, ts: Date.now() });
 });

 return () => { clearInterval(poll); unsub(); };
 }, [settings.voiceControl]);

 // Auto-clear feedback
 useEffect(() => {
 if (!feedback) return;
 const t = setTimeout(() => setFeedback(null), 3200);
 return () => clearTimeout(t);
 }, [feedback]);

 if (!settings.voiceControl) return null;

 return (
 <>
 {/* Mic indicator - fixed bottom-left */}
 <div
 className="fixed bottom-4 left-4 z-[9997] flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg"
 style={{
 background: listening ? 'rgba(13,148,136,0.92)' : 'rgba(71,85,105,0.85)',
 backdropFilter: 'blur(8px)',
 border: `1px solid ${listening ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)'}`,
 }}
 aria-live="polite"
 aria-label={listening ? 'Voice control active - listening' : 'Voice control inactive'}
 >
 <Mic
 size={14}
 className={listening ? 'text-white animate-pulse' : 'text-slate-400'}
 />
 <span className="text-[11px] font-semibold text-white/90">
 {listening ? 'Listening…' : 'Voice off'}
 </span>
 {listening && (
 <span className="text-[10px] text-white/60 hidden sm:inline">
 Say &quot;help&quot; for commands
 </span>
 )}
 </div>

 {/* Command feedback toast */}
 <AnimatePresence>
 {feedback && (
 <motion.div
 key={feedback.ts}
 initial={{ opacity: 0, y: 20, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 20, scale: 0.95 }}
 transition={{ duration: 0.2 }}
 className="fixed bottom-16 left-4 z-[9997] flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-xl max-w-xs"
 style={{
 background: feedback.matched
 ? 'rgba(5,150,105,0.95)'
 : 'rgba(220,38,38,0.92)',
 backdropFilter: 'blur(10px)',
 border: '1px solid rgba(255,255,255,0.2)',
 }}
 role="status"
 aria-live="assertive"
 >
 {feedback.matched
 ? <Check size={15} className="text-white flex-shrink-0" />
 : <X size={15} className="text-white flex-shrink-0" />
 }
 <div className="min-w-0">
 <p className="text-[11px] font-bold text-white/70 uppercase tracking-wide">
 {feedback.matched ? 'Command heard' : 'Not recognised'}
 </p>
 <p className="text-sm font-semibold text-white truncate">
 &quot;{feedback.command}&quot;
 </p>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </>
 );
}
