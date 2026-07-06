/**
 * AuraChat.jsx - Aura AI Companion
 * ==================================
 * - Persistent chat history (session list + restore)
 * - Medical flag detection †' care team alert badge in UI
 * - Ethical guardrails enforced in system prompt + UI
 * - SSE streaming via /api/llm-chatbot/stream
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Loader2, ExternalLink, Brain,
  AlertTriangle, Sparkles, Zap, WifiOff, CheckCheck,
  History, ChevronLeft, Trash2, MessageSquare, ShieldAlert,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatbotConsentModal from './ChatbotConsentModal';
import CrisisInterventionOverlay from './CrisisInterventionOverlay';
import { chatbotConsentAPI, crisisAPI } from '../api/client';
import useAppStore from '../store/useAppStore';
import AuraMascot from './AuraMascot';
import usePersonalisation from '../hooks/usePersonalisation';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// € Crisis keyword detection (client-side fast-path) €€€€€€€€€€€€€€€€€€€€€
const CRISIS_PHRASES = [
  'kill myself', 'end my life', 'want to die', 'better off dead',
  'suicide', 'suicidal', 'self harm', 'hurt myself', 'end it all',
  'no reason to live', "can't go on", "don't want to live",
];
const isCrisis = (text) => {
  const t = text.toLowerCase();
  return CRISIS_PHRASES.some(p => t.includes(p));
};

// € Quick prompts per role €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
const QUICK_PROMPTS = {
  clinician: ['Show critical patients', 'AI Insights summary', 'Active alerts today', 'Latest vitals overview'],
  patient:   ["I'm feeling pain", 'Side effects of my meds', 'I feel anxious', 'What is my care setting?'],
  family:    ['How can I support my loved one?', 'What is palliative care?', 'What care is my loved one receiving?', 'Memory Vault guide'],
  caregiver: ['Patient needs attention', 'How to record symptoms', 'What does home-based care involve?', 'Caregiver burnout help'],
  admin:     ['System overview', 'User management', 'Care settings distribution', 'Compliance status'],
};

// € Render markdown-style content €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
function MessageContent({ content, streaming = false }) {
  if (!content && !streaming) return null;
  return (
    <div className="space-y-0.5">
      {(content || '').split('\n').map((line, i) => {
        if (line.trim() === '') return <div key={i} className="h-1.5" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/).map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j} className="font-semibold">{p.slice(2, -2)}</strong>
            : <span key={j}>{p}</span>
        );
        if (line.trim().startsWith('-')) {
          return <div key={i} className="flex items-start gap-2"><span className="text-teal-400 font-bold flex-shrink-0 mt-0.5">-</span><span>{parts}</span></div>;
        }
        return <div key={i}>{parts}</div>;
      })}
      {streaming && (
        <span className="inline-block w-2 h-4 bg-teal-500 rounded-sm ml-0.5 animate-pulse align-middle" />
      )}
    </div>
  );
}

// € LLM status badge €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
function LLMBadge({ provider, offline }) {
  if (offline) return (
    <span className="flex items-center gap-1 text-[10px] text-amber-300 font-medium">
      <WifiOff size={9} />Offline mode
    </span>
  );
  if (provider === 'openrouter') return (
    <span className="flex items-center gap-1 text-[10px] text-teal-100 font-medium">
      <Zap size={9} className="text-green-300" />Nex N2 Pro
    </span>
  );
  if (provider === 'gemini') return (
    <span className="flex items-center gap-1 text-[10px] text-teal-100 font-medium">
      <Zap size={9} className="text-yellow-300" />Gemini 2.0 Flash
    </span>
  );
  if (provider === 'groq') return (
    <span className="flex items-center gap-1 text-[10px] text-teal-100 font-medium">
      <Zap size={9} className="text-purple-300" />Groq Llama 3
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[10px] text-teal-100 font-medium">
      <Brain size={9} />AI Companion
    </span>
  );
}

// € Flag alert banner €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
function FlagBanner({ flags }) {
  if (!flags || flags.length === 0) return null;
  const isCritical = flags.some(f => f.severity === 'critical');
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-4 mt-2 mb-1 px-3 py-2 rounded-xl flex items-start gap-2 text-xs font-medium ${
        isCritical
          ? 'bg-red-50 border border-red-300 text-red-800'
          : 'bg-amber-50 border border-amber-300 text-amber-800'
      }`}
    >
      <ShieldAlert size={13} className="flex-shrink-0 mt-0.5" />
      <span>
        {isCritical
          ? 'Your care team has been notified immediately. Help is on the way.'
          : 'Your care team has been notified about what you shared.'}
      </span>
    </motion.div>
  );
}

// € History list panel €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
function HistoryPanel({ conversations, onSelect, onDelete, onNewChat, loading }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h4 className="font-semibold text-slate-700 text-sm">Chat History</h4>
        <button
          onClick={onNewChat}
          data-tip="Start a new conversation"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg transition"
        >
          <Plus size={13} />New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-teal-400" />
          </div>
        )}
        {!loading && conversations.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <MessageSquare size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No previous chats yet.</p>
          </div>
        )}
        {!loading && conversations.map(conv => (
          <div
            key={conv.id}
            className="group relative bg-white border border-slate-200 hover:border-teal-300 rounded-xl p-3 cursor-pointer transition"
            onClick={() => onSelect(conv.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate leading-snug">
                  {conv.has_crisis && <span className="text-red-500 mr-1 font-bold">[Crisis]</span>}
                  {conv.title}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{conv.last_message}</p>
                <p className="text-[10px] text-slate-300 mt-1">
                  {conv.message_count} messages · {new Date(conv.updated_at || conv.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onDelete(conv.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-slate-300 hover:text-red-400 rounded-lg transition flex-shrink-0"
                aria-label="Delete"
                data-tip="Delete this conversation"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// € Main component €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€

export default function AuraChat() {
  const [isOpen, setIsOpen]           = useState(false);
  const [view, setView]               = useState('chat');   // 'chat' | 'history'
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [sessionId, setSessionId]     = useState(null);
  const [thinking, setThinking]       = useState(false);
  const [thinkingText, setThinkingText] = useState('');
  const [provider, setProvider]       = useState(null);
  const [activeFlags, setActiveFlags] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showConsentModal, setShowConsentModal]   = useState(false);
  const [hasConsent, setHasConsent]               = useState(false);
  const [showCrisisOverlay, setShowCrisisOverlay] = useState(false);
  const abortRef = useRef(null);

  // Draggable button
  const [btnPos, setBtnPos]   = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, moved: false });

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const { user }       = useAuth();
  const { signals }    = usePersonalisation();
  const navigate       = useNavigate();
  const hasWelcomed    = useRef(false);
  const pushCrisis     = useAppStore(s => s.pushCrisis);
  const token = () => localStorage.getItem('auth_token');

  // Open via sidebar
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('aura:open', handler);
    return () => window.removeEventListener('aura:open', handler);
  }, []);

  useEffect(() => {
    const onResize = () => setBtnPos(p => ({
      x: Math.min(p.x, window.innerWidth - 80),
      y: Math.min(p.y, window.innerHeight - 80),
    }));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Drag handlers
  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: btnPos.x, origY: btnPos.y, moved: false };
    setDragging(true);
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    setBtnPos({
      x: Math.max(20, Math.min(window.innerWidth - 60, dragRef.current.origX + dx)),
      y: Math.max(20, Math.min(window.innerHeight - 60, dragRef.current.origY + dy)),
    });
  };
  const onPointerUp = () => {
    setDragging(false);
    if (!dragRef.current.moved) setIsOpen(o => !o);
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, thinking]);
  useEffect(() => { if (isOpen && view === 'chat') setTimeout(() => inputRef.current?.focus(), 250); }, [isOpen, view]);

  // Welcome message — personalised from questionnaire signals
  const showWelcome = useCallback(() => {
    const firstName = user?.full_name?.split(' ')[0] || 'there';
    let context = '';
    if (signals?.painLevel >= 7) {
      context = `\n\nI can see pain management is a focus for you. I'm here to help with that, or anything else on your mind.`;
    } else if (signals?.needsEmotionalSupport) {
      context = `\n\nI know things can feel overwhelming sometimes. I'm here to listen and support you — no question is too small.`;
    } else if (signals?.needsSpiritualSupport) {
      context = `\n\nSpiritual wellbeing is part of your care plan. I'm here for any questions — medical, emotional, or personal.`;
    } else if (signals?.condition && signals.condition !== 'other') {
      context = `\n\nI'm aware of your care needs around ${signals.condition.replace(/_/g, ' ')} and can help tailor my answers to your situation.`;
    }
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${firstName}!  I'm **Aura**, your AI care companion.\n\nI can help with symptoms, medications, emotional support, care navigation, or just a conversation. What's on your mind?${context}`,
      created_at: new Date().toISOString(),
    }]);
  }, [user, signals]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && !hasWelcomed.current && view === 'chat') {
      hasWelcomed.current = true;
      setTimeout(showWelcome, 200);
    }
  }, [isOpen, messages.length, view, showWelcome]);

  // Consent
  useEffect(() => {
    if (isOpen && user && !hasConsent) {
      chatbotConsentAPI.getConsent(user.id)
        .then(r => { if (r.data.consent_given) setHasConsent(true); else setShowConsentModal(true); })
        .catch(() => setShowConsentModal(true));
    }
  }, [isOpen, user, hasConsent]);

  // Provider status
  useEffect(() => {
    if (isOpen && !provider) {
      fetch(`${API_URL}/api/llm-chatbot/status`, { headers: { Authorization: `Bearer ${token()}` } })
        .then(r => r.json())
        .then(d => setProvider(d.provider))
        .catch(() => setProvider('rule-based'));
    }
  }, [isOpen, provider]);

  // Load history
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const resp = await fetch(`${API_URL}/api/llm-chatbot/conversations`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await resp.json();
      setConversations(data.conversations || []);
    } catch {
      setConversations([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && view === 'history') loadHistory();
  }, [isOpen, view, loadHistory]);

  // Load a past conversation
  const loadConversation = useCallback(async (convId) => {
    try {
      const resp = await fetch(`${API_URL}/api/llm-chatbot/conversations/${convId}/messages`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await resp.json();
      setMessages(data.messages.map(m => ({
        id:           `db-${m.id}`,
        role:         m.role,
        content:      m.content,
        crisis_flagged: m.crisis_flagged,
        created_at:   m.created_at,
      })));
      setSessionId(convId);
      setView('chat');
    } catch {
      // fallback: just open chat
      setView('chat');
    }
  }, []);

  const deleteConversation = useCallback(async (convId) => {
    try {
      await fetch(`${API_URL}/api/llm-chatbot/conversations/${convId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      setConversations(prev => prev.filter(c => c.id !== convId));
    } catch { /* non-fatal */ }
  }, []);

  const startNewChat = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setActiveFlags([]);
    hasWelcomed.current = false;
    setView('chat');
  }, []);

  const handleConsentAccept = async () => {
    try {
      await chatbotConsentAPI.saveConsent({
        user_id: user.id, consent_given: true,
        consent_text: 'User consented to AI companion chatbot use.', ip_address: null,
      });
      setHasConsent(true);
      setShowConsentModal(false);
    } catch { alert('Failed to save consent. Please try again.'); }
  };
  const handleConsentDecline = () => { setShowConsentModal(false); setIsOpen(false); navigate('/messages'); };

  const extractNavPath = (content) => content?.match(/`(\/[a-z0-9-/]+)`/)?.[1] ?? null;
  const handleNavigate = (path) => { navigate(path); setIsOpen(false); };

  // Send message
  const sendMessage = useCallback(async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: userMsgId, role: 'user', content: trimmed,
      created_at: new Date().toISOString(),
    }]);
    setInput('');
    setLoading(true);
    setThinking(true);
    setThinkingText('Connecting to Aura AI...');
    setActiveFlags([]);

    const streamId = `stream-${Date.now()}`;
    setTimeout(() => {
      setThinking(false);
      setMessages(prev => [...prev, {
        id: streamId, role: 'assistant', content: '', streaming: true,
        created_at: new Date().toISOString(),
      }]);
    }, 400);

    const params = new URLSearchParams({ message: trimmed });
    if (sessionId) params.set('conversation_id', String(sessionId));
    // Pass personalisation context to the LLM for richer responses
    if (signals && user?.role === 'patient') {
      if (signals.condition) params.set('patient_condition', signals.condition);
      if (signals.painLevel)  params.set('pain_level', String(signals.painLevel));
      if (signals.carePriorities?.length) params.set('care_priorities', signals.carePriorities.join(','));
      if (signals.needsEmotionalSupport) params.set('emotional_support', 'true');
    }

    let fullText = '';
    const detectedCrisis = isCrisis(trimmed);

    try {
      const response = await fetch(
        `${API_URL}/api/llm-chatbot/stream?${params}`,
        { headers: { Authorization: `Bearer ${token()}` }, signal: controller.signal }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.type === 'start') {
              if (payload.model) {
                if (payload.model.includes('nex') || payload.model.includes('openrouter')) setProvider('openrouter');
                else if (payload.model.includes('gemini')) setProvider('gemini');
                else if (payload.model.includes('llama') || payload.model.includes('groq')) setProvider('groq');
              }
            } else if (payload.type === 'chunk' && payload.text) {
              fullText += payload.text;
              setMessages(prev => prev.map(m =>
                m.id === streamId ? { ...m, content: fullText } : m
              ));
            } else if (payload.type === 'meta') {
              if (!sessionId && payload.conversation_id) setSessionId(payload.conversation_id);
              // Show flag banner if backend detected flags
              if (payload.flags && payload.flags.length > 0) {
                setActiveFlags(payload.flags);
              }
            } else if (payload.type === 'error') {
              console.warn('[AuraChat] LLM error event:', payload.message);
            }
          } catch { /* skip malformed */ }
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === streamId
          ? { ...m, content: fullText || "I'm here. Could you try rephrasing that? ", streaming: false }
          : m
      ));

      if (detectedCrisis) {
        setShowCrisisOverlay(true);
        // Push to Zustand crisis queue so clinicians get a banner anywhere in the app
        pushCrisis({
          id:           Date.now(),
          patient_name: user?.full_name || 'Unknown',
          message:      trimmed.slice(0, 120),
          created_at:   new Date().toISOString(),
        });
        try {
          await crisisAPI.reportCrisis({
            user_id: user?.id, patient_id: null,
            crisis_type: 'chatbot_detected', message_content: trimmed.slice(0, 500),
            source: 'chatbot', confidence_score: 0.9,
          });
        } catch { /* non-fatal */ }
      }

    } catch (err) {
      if (err.name === 'AbortError') return;
      setMessages(prev => prev.map(m =>
        m.id === streamId
          ? { ...m, content: "I'm having trouble connecting right now. Please try again in a moment. ", streaming: false, is_error: true }
          : m
      ));
    } finally {
      setLoading(false);
      setThinking(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, sessionId, user]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(); };
  const basePrompts = QUICK_PROMPTS[user?.role] || QUICK_PROMPTS.patient;
  // For patients: inject personalised prompts based on their signals
  const prompts = user?.role === 'patient' && signals ? (() => {
    const personalised = [];
    if (signals.painLevel >= 5) personalised.push("How can I manage my pain better?");
    if (signals.needsEmotionalSupport) personalised.push("I'm feeling anxious and overwhelmed");
    if (signals.needsSpiritualSupport) personalised.push("Can you suggest spiritual care resources?");
    if (signals.carePriorities?.includes('Staying at home')) personalised.push("What does home-based palliative care involve?");
    if (signals.needsCommunity) personalised.push("How do I join a peer support group?");
    // Fill remaining slots with base prompts (no duplicates)
    const all = [...new Set([...personalised, ...basePrompts])];
    return all.slice(0, 4);
  })() : basePrompts;
  const isOffline = provider === 'rule-based' || provider === 'offline-fallback';

  return (
    <>
      <ChatbotConsentModal isOpen={showConsentModal} onAccept={handleConsentAccept} onDecline={handleConsentDecline} userName={user?.full_name} />
      <CrisisInterventionOverlay
        isOpen={showCrisisOverlay}
        onClose={() => setShowCrisisOverlay(false)}
        onTalkToHuman={() => { setShowCrisisOverlay(false); setIsOpen(false); navigate('/messages'); }}
        patientName={user?.full_name}
        crisisType="chatbot_detected"
      />

      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            style={{ position: 'fixed', left: btnPos.x - 60, top: btnPos.y - 24, zIndex: 50, touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab' }}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-teal-600 text-white rounded-full shadow-2xl border-2 border-white select-none"
              title="Aura AI - drag to move, click to open"
            >
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles size={15} className="text-white" />
              </div>
              <div className="text-left pointer-events-none">
                <p className="text-xs font-bold leading-none">Aura</p>
                <p className="text-[10px] text-teal-100 leading-none mt-0.5">AI Companion</p>
              </div>
              {loading && <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse flex-shrink-0" />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320, mass: 0.8 }}
              onClick={e => e.stopPropagation()}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] sm:w-[580px] h-[90dvh] sm:h-[720px] max-h-[90dvh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 border-teal-400"
            >
              {/* Header */}
              <div className="bg-teal-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center justify-center flex-shrink-0">
                  <AuraMascot size={32} isThinking={thinking} isStreaming={loading && !thinking} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm">Aura</h3>
                    <span className="text-[10px] px-2 py-0.5 bg-white/20 text-white rounded-full font-semibold">AI Care Companion</span>
                  </div>
                  <LLMBadge provider={provider} offline={isOffline} />
                </div>
                <div className="flex items-center gap-1">
                  {/* History toggle */}
                  <button
                    onClick={() => setView(v => v === 'history' ? 'chat' : 'history')}
                    className={`p-2 rounded-xl transition ${view === 'history' ? 'bg-white/30' : 'hover:bg-white/20'}`}
                    data-tip={view === 'history' ? 'Back to chat' : 'Chat history'}
                    aria-label="Chat history"
                  >
                    <History size={16} className="text-white" />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition" aria-label="Close" data-tip="Close chat">
                    <X size={18} className="text-white" />
                  </button>
                </div>
              </div>

              {/* Safety notice */}
              <div className="px-4 py-1.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2 flex-shrink-0">
                <AlertTriangle size={12} className="text-amber-600 flex-shrink-0" />
                <p className="text-[11px] text-amber-800 font-medium">Not a substitute for professional medical advice. Emergencies: <strong>193</strong></p>
              </div>

              {/* € History view €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ */}
              {view === 'history' && (
                <div className="flex-1 overflow-hidden">
                  <HistoryPanel
                    conversations={conversations}
                    onSelect={loadConversation}
                    onDelete={deleteConversation}
                    onNewChat={startNewChat}
                    loading={historyLoading}
                  />
                </div>
              )}

              {/* € Chat view €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ */}
              {view === 'chat' && (
                <>
                  {/* Back to history button when viewing past session */}
                  {sessionId && messages.some(m => m.id?.startsWith('db-')) && (
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={startNewChat}
                        className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium"
                      >
                        <ChevronLeft size={14} />New chat
                      </button>
                      <span className="text-slate-300 text-xs">|</span>
                      <span className="text-xs text-slate-400">Viewing saved conversation</span>
                    </div>
                  )}

                  {/* Flag alert banner */}
                  <FlagBanner flags={activeFlags} />

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-slate-50 to-white overscroll-contain">
                    {/* Quick prompts */}
                    {messages.length <= 1 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                        <p className="text-xs text-slate-400 font-semibold px-1">Suggested questions</p>
                        <div className="grid grid-cols-2 gap-2">
                          {prompts.map((prompt, i) => (
                            <button key={i} onClick={() => sendMessage(prompt)} disabled={loading}
                              data-tip={`Ask: "${prompt}"`}
                              className="text-xs text-left px-3 py-2.5 bg-white border-2 border-slate-200 hover:border-teal-400 hover:bg-teal-50 rounded-xl transition font-medium text-slate-700 disabled:opacity-50 leading-snug">
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {messages.map((msg) => {
                      const isUser = msg.role === 'user';
                      const navPath = !isUser ? extractNavPath(msg.content) : null;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18 }}
                          className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isUser && (
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mb-0.5 ${msg.crisis_flagged ? 'bg-red-100' : 'bg-teal-100'}`}>
                              <Sparkles size={14} className="text-teal-600" />
                            </div>
                          )}
                          <div className="max-w-[78%] flex flex-col gap-1">
                            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                              isUser
                                ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-br-sm'
                                : msg.crisis_flagged
                                  ? 'bg-red-50 border-2 border-red-400 text-red-900 rounded-bl-sm'
                                  : msg.is_error
                                    ? 'bg-slate-100 border border-slate-300 text-slate-600 rounded-bl-sm'
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                            }`}>
                              {msg.crisis_flagged && !isUser && (
                                <div className="flex items-center gap-1.5 mb-2 text-red-700 font-bold text-xs">
                                  <AlertTriangle size={13} />CRISIS SUPPORT
                                </div>
                              )}
                              <MessageContent content={msg.content} streaming={msg.streaming} />
                              {navPath && !isUser && (
                                <button
                                  onClick={() => handleNavigate(navPath)}
                                  data-tip="Navigate to this page"
                                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition"
                                >
                                  <ExternalLink size={13} />Go there now
                                </button>
                              )}
                            </div>
                            <div className={`flex items-center gap-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[10px] text-slate-400">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isUser && !msg.streaming && <CheckCheck size={10} className="text-teal-400" />}
                            </div>
                          </div>
                          {isUser && (
                            <div className="w-8 h-8 rounded-full flex-shrink-0 bg-teal-600 flex items-center justify-center text-white text-xs font-bold mb-0.5">
                              {user?.full_name?.[0] || 'U'}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}

                    {/* Thinking */}
                    <AnimatePresence>
                      {thinking && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                          className="flex items-end gap-2"
                        >
                          <div className="w-8 h-8 rounded-full bg-teal-100 flex-shrink-0 flex items-center justify-center">
                            <Brain size={14} className="text-teal-600 animate-pulse" />
                          </div>
                          <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                {[0, 1, 2].map(i => (
                                  <motion.div key={i} className="w-2 h-2 bg-teal-400 rounded-full"
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 0.9, delay: i * 0.18, repeat: Infinity }} />
                                ))}
                              </div>
                              <span className="text-xs text-slate-500">{thinkingText}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSubmit} className="flex-shrink-0 px-4 py-3 border-t-2 border-slate-100 bg-white">
                    <div className="flex items-end gap-2">
                      <div className="flex-1 relative">
                        <textarea
                          ref={inputRef}
                          value={input}
                          onChange={e => {
                            setInput(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                          }}
                          placeholder="Type a message... (Enter to send)"
                          className="w-full resize-none px-4 py-3 text-sm border-2 border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 transition max-h-[120px] overflow-y-auto leading-relaxed pr-14"
                          rows={1}
                          maxLength={2000}
                          disabled={loading}
                        />
                        <span className="absolute bottom-2 right-3 text-[10px] text-slate-300 select-none">{input.length}/2000</span>
                      </div>
                      <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        data-tip={loading ? 'Waiting for response...' : 'Send message (Enter)'}
                        className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-xl flex items-center justify-center hover:shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Send"
                      >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} strokeWidth={2.5} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                      {isOffline ? '⚡ Offline mode - full AI available when connected' : '⚡ Powered by AI · Responses are not medical advice'}
                    </p>
                  </form>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

