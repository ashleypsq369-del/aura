/**
 * AIAssistant.jsx - Aura AI Assistant (Clinical Navigator)
 * =========================================================
 * Proactive, context-aware, streaming clinical assistant.
 * Uses /api/llm-chatbot/stream (SSE).
 * Two-panel modal: action tiles LEFT, conversation RIGHT.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  X, Send, Loader2, ExternalLink, Brain, AlertTriangle,
  Activity, Calendar, Heart, Pill, BookOpen, Users,
  FileText, Map, MessageCircle, Zap, TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import AuraMascot from './AuraMascot';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// "- Action tiles per role "-------------------------------------------------
const CLINICAL_ACTIONS = [
  { icon: Users,        label: 'Patients',     msg: 'Show me all patients and their status',              path: '/patients',      color: '#7c3aed' },
  { icon: AlertTriangle,label: 'Alerts',       msg: 'Show all active alerts needing attention',           path: '/alerts',        color: '#dc2626' },
  { icon: Brain,        label: 'AI Insights',  msg: 'Give me the AI risk summary for all patients',       path: '/ai-insights',   color: '#6d28d9' },
  { icon: Pill,         label: 'Medications',  msg: 'Show active medications and any concerns',           path: '/medications',   color: '#be123c' },
  { icon: Calendar,     label: 'Appointments', msg: "Show today's and upcoming appointments",             path: '/appointments',  color: '#1d4ed8' },
  { icon: FileText,     label: 'Care Plans',   msg: 'Summarise care plans needing review',               path: '/care-settings', color: '#0f766e' },
  { icon: Users,        label: 'Caregivers',   msg: 'Show caregiver workloads and assignments',          path: '/caregivers',    color: '#0891b2' },
  { icon: TrendingUp,   label: 'Assessments',  msg: 'Which patients need clinical assessments?',         path: null,             color: '#7c3aed' },
  { icon: Activity,     label: 'Patient Monitor', msg: 'Show real-time patient vitals and alerts',       path: '/patient/1',     color: '#0f766e' },
];

const PATIENT_ACTIONS = [
  { icon: Pill,          label: 'My Meds',      msg: 'What are my medications and when do I take them?', path: '/medications',  color: '#be123c' },
  { icon: Calendar,      label: 'Appointments', msg: 'Show my upcoming appointments',                    path: '/appointments', color: '#1d4ed8' },
  { icon: Map,           label: 'My Journey',   msg: 'Show my care journey and recent milestones',       path: '/my-journey',   color: '#0f766e' },
  { icon: Heart,         label: 'Memory Vault', msg: 'Help me with the Memory Vault',                   path: '/memory-vault', color: '#9d174d' },
  { icon: BookOpen,      label: 'Resources',    msg: 'Find helpful resources for my condition',          path: '/resources',    color: '#15803d' },
  { icon: MessageCircle, label: 'Care Team',    msg: 'How do I contact my care team?',                   path: '/messages',     color: '#0891b2' },
  { icon: Activity,      label: 'Wellness',     msg: 'What does my wellness check-in say today?',        path: '/wellness-checkin', color: '#7c3aed' },
  { icon: FileText,      label: 'My Journal',   msg: 'Show my recent journal entries',                   path: '/journal',      color: '#0891b2' },
];

// "- Context-smart chips per route "----------------------------------------
const PAGE_CHIPS = {
  '/patients':          ['Who are the critical patients?', 'Show deteriorating patients', 'Which patients need urgent review?'],
  '/medications':       ['Show active medications', 'Which patients have polypharmacy?', 'Any drug interactions detected?', 'Show SEVERE interactions'],
  '/alerts':            ['Summarise today\'s alerts', 'Which alerts need immediate action?', 'What triggered these alerts?'],
  '/ai-insights':       ['Explain the AI risk predictions', 'Who has the highest risk score?', 'What does SHAP mean?', 'Which patients have drug interactions?'],
  '/appointments':      ['Show today\'s appointments', 'Which appointments are most urgent?', 'Any missed appointments?'],
  '/caregivers':        ['Who has the highest workload?', 'Which caregivers are at burnout risk?', 'Show caregiver burnout scores'],
  '/resources':         ['Find resources about pain management', 'Palliative care support guides', 'Family caregiver resources'],
  '/memory-vault':      ['How do I add a memory?', 'Show recent memories', 'How do I share memories?'],
  '/my-journey':        ['What are my recent milestones?', 'What is coming up in my care plan?'],
  '/community':         ['Find a support group', 'Who else has my condition?'],
  '/community-hub':     ['Find a support group', 'Who else has my condition?'],
  '/my-space':          ['How am I doing today?', 'Show my care summary', 'What should I focus on?'],
  '/journal':           ['What did I write last week?', 'Help me reflect on today', 'Show mood trends'],
  '/care-settings':     ['What are the current care goals?', 'Which plans are due for review?'],
  '/wellness-checkin':  ['What do my scores mean?', 'How have I been trending?', 'When should I be concerned?'],
};

// "- Message markdown renderer "--------------------------------------------
function MsgContent({ text, streaming }) {
  if (!text && !streaming) return null;
  return (
    <div className="space-y-0.5 leading-relaxed">
      {(text || '').split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/).map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j}>{p.slice(2, -2)}</strong>
            : <span key={j}>{p.replace(/`/g, '')}</span>
        );
        return <div key={i}>{parts}</div>;
      })}
      {streaming && (
        <span className="inline-block w-1.5 h-4 bg-violet-400 rounded-sm ml-0.5 animate-pulse align-middle" />
      )}
    </div>
  );
}

// "- Main component "--------------------------------------------------------
export default function AIAssistant() {
  const [isOpen,      setIsOpen]      = useState(false);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [streaming,   setStreaming]   = useState(false);
  const [sessionId,   setSessionId]   = useState(null);
  const [provider,    setProvider]    = useState(null);
  const [btnPos,      setBtnPos]      = useState({ x: window.innerWidth - 80, y: window.innerHeight - 220 });
  const [btnDragging, setBtnDragging] = useState(false);

  const btnDragRef  = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, moved: false });
  const abortRef    = useRef(null);
  const msgEndRef   = useRef(null);
  const inputRef    = useRef(null);
  const streamMsgId = useRef(null);

  const { user }   = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const params     = useParams();

  // Extract patient ID from URL if on a patient-specific page
  const urlPatientId = params.patientId || params.patient_id || null;

  const isClinical = ['clinician', 'admin', 'caregiver'].includes(user?.role);

  // "- Proactive system insights (clinical only) "---------------------------
  const { data: sysInsights } = useQuery({
    queryKey: ['ai-system-insights-assistant'],
    queryFn:  () => apiClient.get('/api/ai-analysis/system-insights').then(r => r.data),
    enabled:  isClinical,
    refetchInterval: 60000,
    retry: false,
  });

  // "- Dashboard summary for live counts "-----------------------------------
  const { data: dashSummary } = useQuery({
    queryKey: ['assistant-dashboard-summary'],
    queryFn:  () => apiClient.get('/api/dashboard/summary').then(r => r.data),
    enabled:  isClinical,
    refetchInterval: 30000,
    retry: false,
  });

  // "- ML batch risk for proactive context "---------------------------------
  const { data: mlBatch } = useQuery({
    queryKey: ['assistant-ml-batch'],
    queryFn:  () => apiClient.get('/api/ml/patients/batch-risk').then(r => r.data),
    enabled:  isClinical,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const criticalMLCount = mlBatch?.patients?.filter(p => p.risk_level === 'critical').length || 0;

  const criticalCount    = sysInsights?.critical_patients?.length || 0;
  const hasUrgent        = criticalCount > 0 || criticalMLCount > 0;
  const topAction        = sysInsights?.immediate_actions?.[0];

  // "- Viewport clamp on resize "--------------------------------------------
  useEffect(() => {
    const fn = () => setBtnPos(p => ({
      x: Math.min(p.x, window.innerWidth  - 80),
      y: Math.min(p.y, window.innerHeight - 80),
    }));
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streaming]);
  useEffect(() => { if (isOpen && !loading) setTimeout(() => inputRef.current?.focus(), 250); }, [isOpen, loading]);
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  // "- Drag "----------------------------------------------------------------
  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    btnDragRef.current = { startX: e.clientX, startY: e.clientY, origX: btnPos.x, origY: btnPos.y, moved: false };
    setBtnDragging(true);
  };
  const onPointerMove = (e) => {
    if (!btnDragging) return;
    const dx = e.clientX - btnDragRef.current.startX;
    const dy = e.clientY - btnDragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) btnDragRef.current.moved = true;
    setBtnPos({
      x: Math.max(20, Math.min(window.innerWidth  - 60, btnDragRef.current.origX + dx)),
      y: Math.max(20, Math.min(window.innerHeight - 60, btnDragRef.current.origY + dy)),
    });
  };
  const onPointerUp = () => {
    setBtnDragging(false);
    if (!btnDragRef.current.moved) setIsOpen(o => !o);
  };

  // "- Navigate helpers "----------------------------------------------------
  const handleNavigate = useCallback((path) => { navigate(path); setIsOpen(false); }, [navigate]);
  const extractPath    = (text) => text?.match(/`(\/[a-zA-Z0-9-/]+)`/)?.[1] ?? null;

  // "- SSE streaming send "--------------------------------------------------
  const sendMessage = useCallback(async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const userId = `u-${Date.now()}`;
    setMessages(prev => [...prev, { id: userId, role: 'user', content: trimmed, ts: new Date() }]);
    setInput('');
    setLoading(true);

    const aid = `a-${Date.now()}`;
    streamMsgId.current = aid;
    setTimeout(() => {
      setStreaming(true);
      setMessages(prev => [...prev, { id: aid, role: 'assistant', content: '', streaming: true, ts: new Date() }]);
    }, 300);

    try {
      const params = new URLSearchParams({ message: trimmed });
      if (sessionId) params.set('conversation_id', String(sessionId));
      if (urlPatientId) params.set('patient_id', String(urlPatientId));

      const resp = await fetch(
        `${API_URL}/api/llm-chatbot/stream?${params}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }, signal: ctrl.signal }
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body.getReader();
      const dec    = new TextDecoder();
      let buf  = '';
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const p = JSON.parse(line.slice(6));
            if (p.type === 'start' && p.model) {
              setProvider(p.model.includes('nex') ? 'OpenRouter' : p.model.includes('gemini') ? 'Gemini' : 'Groq');
            } else if (p.type === 'chunk' && p.text) {
              full += p.text;
              setMessages(prev => prev.map(m => m.id === aid ? { ...m, content: full } : m));
            } else if (p.type === 'meta' && !sessionId && p.conversation_id) {
              setSessionId(p.conversation_id);
            }
          } catch { /* ignore malformed lines */ }
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === aid ? { ...m, content: full || 'Let me know how I can help.', streaming: false } : m
      ));
    } catch (err) {
      if (err.name === 'AbortError') return;
      setMessages(prev => prev.map(m =>
        m.id === aid ? { ...m, content: 'Connection issue - please try again.', streaming: false, error: true } : m
      ));
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  }, [input, loading, sessionId]);

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(); };

  // "- Chip + action sets "--------------------------------------------------
  const actions = isClinical ? CLINICAL_ACTIONS : PATIENT_ACTIONS;
  const pageChips = PAGE_CHIPS[location.pathname] || [];
  const defaultChips = isClinical
    ? ['Who are the critical patients?', 'Show active alerts', 'AI risk summary']
    : user?.role === 'caregiver'
    ? ['Show my assigned patients', 'Log patient symptoms', 'View appointments']
    : ['What are my medications?', 'Show my appointments', 'Find resources'];
  const chips = pageChips.length > 0 ? pageChips : defaultChips;

  return (
    <>
      {/* "- Floating butterfly trigger "---------------------------------- */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            style={{
              position: 'fixed',
              left: btnPos.x - 60,
              top: btnPos.y - 24,
              zIndex: 55,
              touchAction: 'none',
              cursor: btnDragging ? 'grabbing' : 'grab',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <motion.div
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.94 }}
              className="flex flex-col items-center gap-0 select-none cursor-pointer relative"
              title="Aura AI Assistant - click to open"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}
            >
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
                <AuraMascot size={58} isThinking={loading && !streaming} isStreaming={streaming} />
              </motion.div>
              {hasUrgent && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
              <div
                className="px-2.5 py-0.5 text-white text-[10px] font-bold rounded-full -mt-1 shadow-sm"
                style={{ background: 'linear-gradient(to right, #5a7d9e, #4a6a88)' }}
              >
                AI Assistant
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "- Modal "---------------------------------------------------------- */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={  { opacity: 0, scale: 0.94,  y: 20 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-200"
              style={{ width: 'min(92vw,680px)', height: 'min(92dvh,700px)' }}
            >
              {/* Header */}
              <div
                className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
                style={{ background: 'linear-gradient(to right, #4a6a88, #5a7d9e)' }}
              >
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AuraMascot size={32} isThinking={loading && !streaming} isStreaming={streaming} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm">Aura AI Assistant</h3>
                    {hasUrgent && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        {criticalCount} URGENT
                      </span>
                    )}
                    {provider && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-white/20 text-white rounded-full flex items-center gap-1">
                        <Zap size={9} />{provider}
                      </span>
                    )}                  </div>
                  <p className="text-[10px] text-purple-200 capitalize">
                    {user?.role} · {location.pathname.split('/')[1] || 'home'}
                    {urlPatientId && ` · Patient #${urlPatientId}`}
                  </p>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-xl transition">
                  <X size={16} className="text-white" />
                </button>
              </div>

              {/* Disclaimer strip */}
              <div className="px-4 py-1.5 bg-amber-50 border-b border-amber-100 flex items-center gap-1.5 flex-shrink-0">
                <AlertTriangle size={11} className="text-amber-600 flex-shrink-0" />
                <p className="text-[10px] text-amber-700 font-medium">
                  Not a substitute for professional medical advice · Emergency: <strong>193</strong>
                </p>
              </div>

              {/* Two-panel body */}
              <div className="flex flex-1 overflow-hidden">

                {/* LEFT - action tiles */}
                <div className="w-44 flex-shrink-0 bg-slate-50 border-r border-slate-100 overflow-y-auto p-2 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-1 mb-1">Quick Access</p>

                  {/* Live system stats for clinicians */}
                  {isClinical && dashSummary && (
                    <div className="mb-2 space-y-1">
                      {[
                        { label: 'Total Patients',  value: dashSummary.total_patients  ?? dashSummary.patients_count ?? '-', color: '#7c3aed' },
                        { label: 'Critical',        value: criticalCount || '0',         color: '#dc2626' },
                        { label: 'ML Critical',     value: criticalMLCount || '0',       color: '#9333ea' },
                        { label: 'Active Alerts',   value: dashSummary.active_alerts   ?? dashSummary.alerts_count   ?? '-', color: '#d97706' },
                        { label: 'Appointments',    value: dashSummary.todays_appointments ?? dashSummary.appointments_today ?? '-', color: '#1d4ed8' },
                      ].map(s => (
                        <div key={s.label} className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-white border border-slate-100">
                          <span className="text-[10px] text-slate-500">{s.label}</span>
                          <span className="text-[11px] font-bold" style={{ color: s.color }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {actions.map(a => {
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.label}
                        onClick={() => { sendMessage(a.msg); if (!isOpen) setIsOpen(true); }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left group"
                      >
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${a.color}18` }}
                        >
                          <Icon size={13} style={{ color: a.color }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 group-hover:text-purple-700 truncate">{a.label}</span>
                        {a.path && <ChevronRight size={10} className="ml-auto text-slate-300 group-hover:text-purple-400 flex-shrink-0" />}
                      </button>
                    );
                  })}

                  {/* Direct navigation links */}
                  <div className="pt-2 pb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-1">Navigate</p>                    {actions.filter(a => a.path).slice(0, 6).map(a => {
                      const Icon = a.icon;
                      return (
                        <button
                          key={`nav-${a.path}`}
                          onClick={() => handleNavigate(a.path)}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition-colors text-left"
                        >
                          <Icon size={11} className="text-slate-400 flex-shrink-0" />
                          <span className="text-[11px] text-slate-500 truncate">{a.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT - conversation */}
                <div className="flex-1 flex flex-col overflow-hidden">

                  {/* Proactive urgent insight */}
                  {isClinical && hasUrgent && topAction && messages.length === 0 && (
                    <div className="mx-3 mt-3 mb-0 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 flex-shrink-0">
                      <Activity size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-amber-800">
                          {criticalCount} patient{criticalCount > 1 ? 's' : ''} need immediate attention
                        </p>
                        <p className="text-[11px] text-amber-700 truncate">
                          {topAction.patient}: {topAction.action}
                        </p>
                      </div>
                      <button
                        onClick={() => sendMessage('Show me the critical patients and what actions are needed')}
                        className="text-[10px] font-bold text-amber-700 hover:text-amber-900 whitespace-nowrap flex-shrink-0"
                      >
                        Ask AI †'
                      </button>
                    </div>
                  )}

                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">

                    {/* Empty state with chips */}
                    {messages.length === 0 && (
                      <div className="text-center pt-6">
                        <div className="w-16 h-16 mx-auto mb-2">
                          <AuraMascot size={64} isThinking={loading && !streaming} isStreaming={streaming} />
                        </div>
                        <p className="text-sm font-bold text-slate-700 mb-1">How can I help you?</p>
                        <p className="text-xs text-slate-400 mb-4">
                          Ask me anything - clinical data, navigation, explanations.
                        </p>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {chips.map(c => (
                            <button
                              key={c}
                              onClick={() => sendMessage(c)}
                              className="px-2.5 py-1 text-[11px] bg-purple-50 border border-purple-200 text-purple-700 rounded-full hover:bg-purple-100 transition-colors font-medium"
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message bubbles */}
                    {messages.map(msg => {
                      const isUser  = msg.role === 'user';
                      const navPath = !isUser ? extractPath(msg.content) : null;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                            isUser
                              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-sm'
                              : msg.error
                              ? 'bg-slate-100 border border-slate-300 text-slate-600 rounded-bl-sm'
                              : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm'
                          }`}>
                            <MsgContent text={msg.content} streaming={msg.streaming} />
                            {navPath && !isUser && (
                              <button
                                onClick={() => handleNavigate(navPath)}
                                className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition"
                              >
                                <ExternalLink size={12} /> Go there now
                              </button>
                            )}
                            <p className={`text-[10px] mt-1 ${isUser ? 'text-white/60' : 'text-slate-400'}`}>
                              {msg.ts?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Thinking indicator */}
                    <AnimatePresence>
                      {loading && !streaming && (
                        <motion.div
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex justify-start"
                        >
                          <div className="bg-purple-50 border border-purple-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                            <Loader2 size={13} className="animate-spin text-purple-600" />
                            <span className="text-xs text-purple-700 font-medium">Thinking...</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div ref={msgEndRef} />
                  </div>

                  {/* Follow-up chips (shown when conversation has started but few messages) */}
                  {messages.length > 0 && messages.length < 4 && (
                    <div className="px-3 pb-1 flex flex-wrap gap-1">
                      {chips.slice(0, 3).map(c => (
                        <button
                          key={c}
                          onClick={() => sendMessage(c)}
                          className="px-2 py-0.5 text-[10px] bg-purple-50 border border-purple-200 text-purple-600 rounded-full hover:bg-purple-100 transition-colors"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input */}
                  <form
                    onSubmit={handleSubmit}
                    className="p-3 border-t border-slate-100 flex gap-2 flex-shrink-0 bg-white"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Ask anything..."
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition"
                      maxLength={500}
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || loading}
                      className="w-9 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center justify-center transition disabled:opacity-40 flex-shrink-0"
                    >
                      {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    </button>
                  </form>

                  {/* Footer */}
                  <div className="px-3 pb-2 flex items-center justify-between flex-shrink-0">
                    <p className="text-[9px] text-slate-400">Not a substitute for professional medical advice</p>
                    {sessionId && (
                      <button
                        type="button"
                        onClick={() => { setMessages([]); setSessionId(null); setProvider(null); }}
                        className="text-[9px] text-slate-400 hover:text-purple-600 transition-colors"
                      >
                        New chat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

