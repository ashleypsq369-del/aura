/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, Send, Trash2, Plus, Clock,
  ChevronDown, Download, Maximize2, Minimize2, Bot,
  Copy, RotateCcw, Zap, Brain, Cpu, Wifi, WifiOff,
  Sparkles, Check
} from 'lucide-react';
import { llmChatbotAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ChatbotConsentModal from './ChatbotConsentModal';
import CrisisInterventionOverlay from './CrisisInterventionOverlay';

/* --- Markdown renderer (minimal, no deps) --------------------------- */
function renderMarkdown(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const nodes = [];
  let inCodeBlock = false;
  let codeLines = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="list-disc list-inside space-y-0.5 my-1 pl-1">
          {listItems.map((item, i) => (
            <li key={i} className="leading-relaxed">{renderInline(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, idx) => {
    // Code blocks
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        flushList();
        inCodeBlock = true;
        codeLines = [];
      } else {
        inCodeBlock = false;
        nodes.push(
          <pre key={`code-${idx}`} className="bg-gray-900 text-green-300 text-xs rounded-lg p-3 my-2 overflow-x-auto font-mono">
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        codeLines = [];
      }
      return;
    }
    if (inCodeBlock) { codeLines.push(line); return; }

    // Headings
    if (line.startsWith('## ')) {
      flushList();
      nodes.push(<h4 key={idx} className="font-bold text-sm mt-2 mb-0.5">{renderInline(line.slice(3))}</h4>);
      return;
    }
    if (line.startsWith('# ')) {
      flushList();
      nodes.push(<h3 key={idx} className="font-bold text-base mt-2 mb-1">{renderInline(line.slice(2))}</h3>);
      return;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      flushList();
      nodes.push(<hr key={idx} className="border-current opacity-20 my-2" />);
      return;
    }

    // List items
    if (line.match(/^[-*-]\s/)) {
      listItems.push(line.replace(/^[-*-]\s/, ''));
      return;
    }

    flushList();

    // Blank line
    if (!line.trim()) {
      nodes.push(<div key={idx} className="h-1" />);
      return;
    }

    nodes.push(<p key={idx} className="leading-relaxed">{renderInline(line)}</p>);
  });

  flushList();
  return nodes;
}

function renderInline(text) {
  if (!text) return null;
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="bg-black/20 rounded px-1 py-0.5 font-mono text-xs">{part.slice(1, -1)}</code>;
    return part;
  });
}


/* --- Provider badge -------------------------------------------------- */
function ProviderBadge({ status }) {
  if (!status) return null;
  const cfg = {
    gemini:      { icon: <Sparkles size={10} />, label: 'Gemini',   color: 'bg-teal-500/20 text-blue-300' },
    groq:        { icon: <Zap size={10} />,       label: 'Groq',     color: 'bg-purple-500/20 text-purple-300' },
    'rule-based':{ icon: <Cpu size={10} />,       label: 'Offline',  color: 'bg-[var(--card-bg)]0/20 text-gray-300' },
    fallback:    { icon: <Cpu size={10} />,       label: 'Limited',  color: 'bg-[var(--card-bg)]0/20 text-gray-300' },
  };
  const c = cfg[status.provider] || cfg.fallback;
  return (
    <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${c.color}`}>
      {c.icon} {c.label}
    </span>
  );
}


/* --- Typing cursor --------------------------------------------------- */
function Cursor() {
  return (
    <span className="inline-block w-0.5 h-4 bg-current ml-0.5 align-middle animate-pulse" />
  );
}


/* --- Single message bubble ------------------------------------------- */
function MessageBubble({ message, onCopy, onRegenerate, isLast }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isStreaming = message.streaming === true;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot size={14} className="text-teal-600 dark:text-teal-400" />
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[82%] group relative`}>
        <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
          isUser
            ? 'bg-teal-600 dark:bg-teal-700 text-white rounded-tr-sm'
            : 'bg-[var(--card-bg)] border border-[var(--card-border)]/50 text-[var(--text-800)] rounded-tl-sm'
        }`}>
          {isUser ? (
            <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="space-y-0.5">
              {renderMarkdown(message.content)}
              {isStreaming && <Cursor />}
            </div>
          )}
        </div>

        {/* Timestamp + actions */}
        <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[11px] text-[var(--text-400)]">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.model_used && (
            <span className="text-[11px] text-[var(--text-400)]">{message.model_used}</span>
          )}

          {/* Action buttons - appear on hover */}
          {!isUser && !isStreaming && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-[var(--card-border)]/30 text-[var(--text-400)] hover:text-[var(--text-700)] transition-colors"
                title="Copy"
              >
                {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
              </button>
              {isLast && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1 rounded hover:bg-[var(--card-border)]/30 text-[var(--text-400)] hover:text-[var(--text-700)] transition-colors"
                  title="Regenerate"
                >
                  <RotateCcw size={11} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}


/* --- Thinking dots --------------------------------------------------- */
function ThinkingDots() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-2 flex-row"
    >
      <div className="w-7 h-7 rounded-full bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5 shadow">
        <Bot size={14} className="text-white" />
      </div>
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)]/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 150, 300].map(delay => (
            <div
              key={delay}
              className="w-2 h-2 bg-gradient-to-br bg-teal-500 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
          <span className="text-xs text-[var(--text-400)] ml-1">Aura is thinking...</span>
        </div>
      </div>
    </motion.div>
  );
}


/* --- Quick prompt chips ---------------------------------------------- */
const QUICK_PROMPTS = [
  '💬 What can you help me with?',
  '📋 Show me my care information',
  '🧭 How do I navigate the platform?',
  '❤️  I\'m feeling anxious about my condition',
];


/* -----------------------------------------------------------------------
   MAIN COMPONENT
----------------------------------------------------------------------- */
export default function ChatBot() {
  const { user } = useAuth();

  /* -- UI state -- */
  const [isOpen,        setIsOpen]        = useState(false);
  const [isMaximized,   setIsMaximized]   = useState(false);
  const [position,      setPosition]      = useState({ x: 0, y: 0 });
  const [buttonPos,     setButtonPos]     = useState({
    x: window.innerWidth  - 90,
    y: window.innerHeight - 90,
  });
  const [isDragging,    setIsDragging]    = useState(false);
  const [isDragBtn,     setIsDragBtn]     = useState(false);
  const [dragStart,     setDragStart]     = useState({ x: 0, y: 0 });
  const [showHistory,   setShowHistory]   = useState(false);

  /* -- Chat state -- */
  const [conversations, setConversations] = useState([]);
  const [activeConvId,  setActiveConvId]  = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState('');
  const [isLoading,     setIsLoading]     = useState(false);   // waiting for first token
  const [isStreaming,   setIsStreaming]   = useState(false);   // streaming in progress
  const [llmStatus,     setLlmStatus]     = useState(null);

  /* -- Safety state -- */
  const [showConsent,   setShowConsent]   = useState(false);
  const [showCrisis,    setShowCrisis]    = useState(false);
  const [crisisFlag,    setCrisisFlag]    = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const chatRef        = useRef(null);
  const abortRef       = useRef(null);   // AbortController for streams

  /* -- Init -- */
  useEffect(() => {
    const saved = localStorage.getItem('llm_conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
        if (parsed.length > 0) {
          setActiveConvId(parsed[0].id);
          setMessages(parsed[0].messages);
        }
      } catch { /* ignore */ }
    }
    llmChatbotAPI.getStatus()
      .then(r => setLlmStatus(r.data))
      .catch(() => {});
  }, []);

  /* -- Persist conversations -- */
  useEffect(() => {
    if (conversations.length > 0)
      localStorage.setItem('llm_conversations', JSON.stringify(conversations));
  }, [conversations]);

  /* -- Scroll to bottom -- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* -- Focus input -- */
  useEffect(() => {
    if (isOpen && !isLoading) inputRef.current?.focus();
  }, [isOpen, isLoading]);


  /* ---------------- Drag logic ---------------- */

  const handleWindowMouseMove = useCallback((e) => {
    if (isDragging)
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    if (isDragBtn)
      setButtonPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, isDragBtn, dragStart]);

  const handleWindowMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsDragBtn(false);
  }, []);

  useEffect(() => {
    if (isDragging || isDragBtn) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
      };
    }
  }, [isDragging, isDragBtn, handleWindowMouseMove, handleWindowMouseUp]);

  const handleHeaderMouseDown = (e) => {
    if (e.target.closest('.chat-header') && !isMaximized) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleBtnMouseDown = (e) => {
    e.stopPropagation();
    const sx = e.clientX, sy = e.clientY;
    setDragStart({ x: e.clientX - buttonPos.x, y: e.clientY - buttonPos.y, sx, sy });
    const check = (mv) => {
      if (Math.abs(mv.clientX - sx) > 5 || Math.abs(mv.clientY - sy) > 5) {
        setIsDragBtn(true);
        window.removeEventListener('mousemove', check);
      }
    };
    window.addEventListener('mousemove', check);
    window.addEventListener('mouseup', () => window.removeEventListener('mousemove', check), { once: true });
  };

  const handleBtnClick = () => {
    if (!isDragBtn) setIsOpen(true);
    setTimeout(() => setIsDragBtn(false), 100);
  };


  /* ---------------- Conversation management ---------------- */

  const createNewConversation = () => {
    const nc = {
      id: Date.now(),
      title: 'New conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      serverConvId: null,
    };
    setConversations(prev => [nc, ...prev]);
    setActiveConvId(nc.id);
    setMessages([]);
    setShowHistory(false);
  };

  const switchConversation = (cid) => {
    const conv = conversations.find(c => c.id === cid);
    if (conv) { setActiveConvId(cid); setMessages(conv.messages); setShowHistory(false); }
  };

  const deleteLocalConversation = (cid, e) => {
    e.stopPropagation();
    const filtered = conversations.filter(c => c.id !== cid);
    setConversations(filtered);
    if (cid === activeConvId) {
      if (filtered.length > 0) { setActiveConvId(filtered[0].id); setMessages(filtered[0].messages); }
      else                     { setActiveConvId(null); setMessages([]); }
    }
    // Also delete from server
    const conv = conversations.find(c => c.id === cid);
    if (conv?.serverConvId)
      llmChatbotAPI.deleteConversation(conv.serverConvId).catch(() => {});
  };

  const updateTitle = (cid, first) => {
    setConversations(prev => prev.map(c =>
      c.id === cid && c.title === 'New conversation'
        ? { ...c, title: first.slice(0, 45) + (first.length > 45 ? '...' : '') }
        : c
    ));
  };

  const downloadConversation = () => {
    const conv = conversations.find(c => c.id === activeConvId);
    if (!conv) return;
    const txt = conv.messages
      .map(m => `[${new Date(m.created_at).toLocaleString()}] ${m.role === 'user' ? 'You' : 'Aura'}:\n${m.content}\n`)
      .join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([txt], { type: 'text/plain' })),
      download: `aura-chat-${conv.id}.txt`,
    });
    a.click();
  };


  /* ---------------- Crisis detection ---------------- */

  const CRISIS_WORDS = [
    'suicide', 'kill myself', 'end my life', 'want to die',
    'self harm', 'hurt myself', 'no reason to live', 'end it all',
  ];
  const checkCrisis = (text) => CRISIS_WORDS.some(w => text.toLowerCase().includes(w));


  /* ---------------- Send + Stream ---------------- */

  const sendMessage = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading || isStreaming) return;

    // Consent gate
    if (!localStorage.getItem('chatbot_consent_given') && messages.length === 0) {
      setShowConsent(true);
      return;
    }

    // Crisis gate
    if (checkCrisis(text) && !crisisFlag) {
      setCrisisFlag(true);
      setShowCrisis(true);
    }

    // Ensure conversation exists
    let convId = activeConvId;
    if (!convId) {
      const nc = {
        id: Date.now(), title: 'New conversation',
        messages: [], createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(), serverConvId: null,
      };
      setConversations(prev => [nc, ...prev]);
      convId = nc.id;
      setActiveConvId(nc.id);
    }

    const userMsg = { role: 'user', content: text, created_at: new Date().toISOString() };
    const withUser = [...messages, userMsg];
    setMessages(withUser);
    if (messages.length === 0) updateTitle(convId, text);
    setInput('');
    setIsLoading(true);

    // Get server conversation ID for this local conversation
    const conv = conversations.find(c => c.id === convId);
    const serverConvId = conv?.serverConvId ?? null;

    // Placeholder assistant message - will be updated chunk by chunk
    const asstPlaceholder = {
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      streaming: true,
      model_used: null,
    };
    const withPlaceholder = [...withUser, asstPlaceholder];
    setMessages(withPlaceholder);

    try {
      let accumulated = '';
      let modelUsed   = null;
      let newServerId = serverConvId;

      for await (const event of llmChatbotAPI.stream({
        message: text,
        conversationId: serverConvId,
      })) {
        if (event.type === 'start') {
          setIsLoading(false);
          setIsStreaming(true);
          modelUsed = event.model;
        } else if (event.type === 'chunk') {
          accumulated += event.text;
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.streaming) {
              updated[updated.length - 1] = {
                ...last,
                content:   accumulated,
                model_used: modelUsed,
              };
            }
            return updated;
          });
        } else if (event.type === 'meta') {
          newServerId = event.conversation_id;
        } else if (event.type === 'done') {
          // Mark streaming complete
          const finalMsg = {
            role:      'assistant',
            content:   accumulated,
            created_at: new Date().toISOString(),
            streaming:  false,
            model_used: modelUsed,
          };
          const finalMessages = [...withUser, finalMsg];
          setMessages(finalMessages);
          setConversations(prev => prev.map(c =>
            c.id === convId
              ? { ...c, messages: finalMessages, updatedAt: new Date().toISOString(), serverConvId: newServerId }
              : c
          ));
        }
      }
    } catch (err) {
      console.error('[ChatBot] Stream error:', err);
      // Fall back to non-streaming
      try {
        const r = await llmChatbotAPI.chat({
          message: text,
          conversation_id: serverConvId,
        });
        const fallbackMsg = {
          role: 'assistant',
          content: r.data.message,
          created_at: new Date().toISOString(),
          streaming: false,
          model_used: r.data.model_used,
        };
        const finalMessages = [...withUser, fallbackMsg];
        setMessages(finalMessages);
        setConversations(prev => prev.map(c =>
          c.id === convId
            ? { ...c, messages: finalMessages, updatedAt: new Date().toISOString() }
            : c
        ));
      } catch {
        const errMsg = {
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please check that the backend is running and try again. 💙",
          created_at: new Date().toISOString(),
          streaming: false,
        };
        setMessages([...withUser, errMsg]);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleRegenerate = () => {
    // Find last user message
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    // Remove last assistant message and resend
    setMessages(prev => prev.slice(0, -1));
    sendMessage(lastUser.content);
  };

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(); };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const activeConv = conversations.find(c => c.id === activeConvId);
  const isRealLLM  = llmStatus?.is_real_llm;


  /* ---------------- Render ---------------- */

  return (
    <>
      {/* -- Floating button -- */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onMouseDown={handleBtnMouseDown}
            onClick={handleBtnClick}
            style={{ left: `${buttonPos.x}px`, top: `${buttonPos.y}px`, right: 'auto', bottom: 'auto' }}
            className="fixed w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 cursor-move group overflow-hidden"
            title="Aura AI - Drag to move"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-blue-600 to-indigo-700 animate-gradient-xy" />
            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 70%)' }} />
            <Bot className="text-white relative z-10" size={26} />

            {/* Online dot */}
            <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white z-10" />

            {/* Tooltip */}
            <div className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {isRealLLM ? '✨ Aura AI (Full LLM)' : '💬 Aura AI'}
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* -- Backdrop -- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40"
          />
        )}
      </AnimatePresence>

      {/* -- Chat window -- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            style={isMaximized ? {} : {
              left:   position.x ? `${position.x}px` : 'auto',
              top:    position.y ? `${position.y}px` : 'auto',
              right:  position.x ? 'auto' : '24px',
              bottom: position.y ? 'auto' : '24px',
            }}
            className={`fixed ${
              isMaximized ? 'inset-4' : 'w-[440px] h-[640px]'
            } bg-[var(--card-bg)] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-[var(--card-border)]/60 ${
              isDragging ? 'cursor-move select-none' : ''
            }`}
          >

            {/* -- Header -- */}
            <div
              className="chat-header relative bg-gradient-to-r from-violet-700 via-blue-700 to-indigo-700 text-white px-4 py-3 flex items-center justify-between cursor-move flex-shrink-0"
              onMouseDown={handleHeaderMouseDown}
            >
              {/* Shimmer */}
              <div className="absolute inset-0 opacity-30"
                style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)' }} />

              <div className="flex items-center gap-3 relative">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <Brain size={18} className="text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-violet-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">Aura AI</h3>
                    <ProviderBadge status={llmStatus} />
                  </div>
                  <p className="text-xs text-white/70">
                    {isRealLLM ? 'Full LLM · understands everything you say' : 'AI Companion'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 relative">
                <button onClick={() => setIsMaximized(v => !v)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-all"
                  title={isMaximized ? 'Restore' : 'Maximize'}>
                  {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-all"
                  title="Close">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* -- Toolbar -- */}
            <div className="px-3 py-2 border-b border-[var(--card-border)]/50 bg-[var(--card-bg)]/80 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <button onClick={createNewConversation}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs rounded-lg hover:shadow-md transition-all font-medium">
                  <Plus size={13} /> New Chat
                </button>

                <div className="relative">
                  <button onClick={() => setShowHistory(v => !v)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-600)] text-xs rounded-lg hover:bg-[var(--card-bg)] transition-all">
                    <Clock size={13} />
                    History ({conversations.length})
                    <ChevronDown size={11} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showHistory && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        className="absolute top-full mt-1 left-0 w-72 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-xl max-h-72 overflow-y-auto z-20"
                      >
                        {conversations.length === 0 ? (
                          <p className="p-4 text-xs text-[var(--text-500)] text-center">No conversations yet</p>
                        ) : (
                          conversations.map(conv => (
                            <div
                              key={conv.id}
                              onClick={() => switchConversation(conv.id)}
                              className={`p-3 border-b border-gray-50 hover:bg-[var(--card-bg)] cursor-pointer transition-all flex items-start justify-between gap-2 ${
                                conv.id === activeConvId ? 'bg-violet-50 border-l-2 border-l-violet-400' : ''
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[var(--text-900)] truncate">{conv.title}</p>
                                <p className="text-[11px] text-[var(--text-400)] mt-0.5">
                                  {new Date(conv.updatedAt).toLocaleDateString()} · {conv.messages.length} messages
                                </p>
                              </div>
                              <button onClick={(e) => deleteLocalConversation(conv.id, e)}
                                className="text-red-400 hover:text-red-600 p-1 transition-colors flex-shrink-0">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {activeConv && activeConv.messages.length > 0 && (
                <div className="flex items-center gap-1">
                  <button onClick={downloadConversation}
                    className="p-1.5 text-[var(--text-500)] hover:text-[var(--text-800)] hover:bg-[var(--card-border)]/30 rounded-lg transition-all"
                    title="Download">
                    <Download size={13} />
                  </button>
                  <button
                    onClick={() => {
                      setMessages([]);
                      setConversations(prev => prev.map(c =>
                        c.id === activeConvId ? { ...c, messages: [] } : c
                      ));
                    }}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Clear chat">
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* -- Messages area -- */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/50 to-white/80">
              {messages.length === 0 ? (
                /* Empty state */
                <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <Sparkles className="text-white" size={34} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-400 border-2 border-white flex items-center justify-center">
                      <Check size={12} className="text-white" strokeWidth={3} />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-[var(--text-900)]">
                      Hi{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! 👋
                    </h4>
                    <p className="text-sm text-[var(--text-500)] mt-1 max-w-xs">
                      {isRealLLM
                        ? "I'm Aura - powered by a real LLM. I understand everything you say, remember our conversation, and respond naturally."
                        : "I'm Aura, your AI companion. Ask me anything about your care or the platform."}
                    </p>
                    {isRealLLM && (
                      <div className="flex items-center justify-center gap-1.5 mt-2">
                        <Wifi size={11} className="text-green-500" />
                        <span className="text-[11px] text-green-600 font-medium">Full LLM active</span>
                      </div>
                    )}
                  </div>

                  <div className="w-full max-w-xs space-y-2">
                    {QUICK_PROMPTS.map((p, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.01, x: 2 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => { setInput(p.replace(/^[^\s]+\s/, '')); inputRef.current?.focus(); }}
                        className="w-full text-left px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl hover:border-violet-300 hover:bg-violet-50/50 transition-all text-sm text-[var(--text-700)] shadow-sm"
                      >
                        {p}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <MessageBubble
                    key={idx}
                    message={msg}
                    isLast={idx === messages.length - 1}
                    onCopy={() => {}}
                    onRegenerate={
                      idx === messages.length - 1 && msg.role === 'assistant' && !isStreaming
                        ? handleRegenerate
                        : null
                    }
                  />
                ))
              )}

              {/* Thinking indicator - shown only before first token */}
              {isLoading && !isStreaming && <ThinkingDots />}

              <div ref={messagesEndRef} />
            </div>

            {/* -- Input area -- */}
            <div className="px-4 py-3 border-t border-[var(--card-border)]/50 bg-[var(--card-bg)] flex-shrink-0">
              {/* Streaming indicator */}
              {isStreaming && (
                <div className="flex items-center gap-1.5 mb-2 text-xs text-teal-600">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                  Aura is responding...
                  <button onClick={() => setIsStreaming(false)}
                    className="ml-auto text-[var(--text-400)] hover:text-[var(--text-600)] flex items-center gap-1">
                    <X size={10} /> Stop
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Aura..."
                  rows={1}
                  maxLength={2000}
                  disabled={isLoading || isStreaming}
                  autoFocus
                  className="flex-1 px-4 py-2.5 text-sm border border-[var(--card-border)] rounded-xl focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all resize-none min-h-[42px] max-h-[140px] overflow-y-auto leading-relaxed bg-[var(--card-bg)] focus:bg-[var(--card-bg)] disabled:opacity-50"
                  style={{ height: 'auto' }}
                  onInput={e => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || isStreaming}
                  className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-xl hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send size={16} />
                </button>
              </form>

              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[11px] text-[var(--text-400)]">{input.length}/2000</p>
                <p className="text-[11px] text-[var(--text-400)]">Enter to send · Shift+Enter for new line</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -- Modals -- */}
      {showConsent && (
        <ChatbotConsentModal
          isOpen={showConsent}
          onAccept={() => {
            localStorage.setItem('chatbot_consent_given', 'true');
            setShowConsent(false);
            sendMessage();
          }}
          onDecline={() => { setShowConsent(false); setInput(''); }}
          userName={user?.full_name}
        />
      )}
      {showCrisis && (
        <CrisisInterventionOverlay
          isOpen={showCrisis}
          onClose={() => { setShowCrisis(false); setCrisisFlag(false); }}
          onTalkToHuman={() => { window.location.href = '/messages'; }}
          patientName={user?.full_name}
          crisisType="general"
        />
      )}
    </>
  );
}
