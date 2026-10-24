/**
 * AuraChat.jsx — Aura Companion v5
 * Emotional/care support for patients, family, caregivers.
 * NO navigation tiles — sidebar handles navigation.
 * Purpose: symptom support, medication Q&A, emotional support, crisis detection.
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  X, Send, Loader2, Brain, AlertTriangle, Sparkles, Zap, WifiOff,
  CheckCheck, History, ChevronLeft, Trash2, MessageSquare, ShieldAlert,
  Plus, ChevronDown, MessageCircle, Copy, Check, ThumbsUp, ThumbsDown,
  RotateCcw, Heart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppSettings } from '../context/AppSettingsContext';
import ChatbotConsentModal from './ChatbotConsentModal';
import CrisisInterventionOverlay from './CrisisInterventionOverlay';
import { chatbotConsentAPI, crisisAPI } from '../api/client';
import useAppStore from '../store/useAppStore';
import AuraMascot from './AuraMascot';
import usePersonalisation from '../hooks/usePersonalisation';
import { API_URL } from '../api/client';
import HintTooltip from './HintTooltip';

const MAX_CHARS = 2000;
const CRISIS_PHRASES = ['kill myself','end my life','want to die','better off dead','suicide','suicidal','self harm','hurt myself','end it all','no reason to live',"can't go on","don't want to live"];
const isCrisis = t => CRISIS_PHRASES.some(p => t.toLowerCase().includes(p));

const QUICK_PROMPTS = {
  clinician: ['Summarise my patient load','Any urgent clinical concerns?','What medications need review?','Draft a handover note'],
  patient:   ["I'm in pain right now","I'm feeling anxious or scared",'Tell me about my medications','I need emotional support'],
  family:    ['How can I help my loved one today?','What is palliative care?','How do I cope with grief?','What support is available?'],
  caregiver: ['My patient seems worse today','How do I manage a patient in pain?','I feel burnt out','What should I document?'],
  admin:     ['Any system issues to know about?','Summarise user activity','Are there compliance gaps?','What needs attention today?'],
};

const FEEL_SCALE = [
  { emoji: '😢', label: 'Struggling', msg: "I'm feeling 😢 today — I'm struggling and need support" },
  { emoji: '😐', label: 'Okay',       msg: "I'm feeling 😐 today — just getting by" },
  { emoji: '🙂', label: 'Alright',    msg: "I'm feeling 🙂 today — alright" },
  { emoji: '😊', label: 'Good',       msg: "I'm feeling 😊 today — pretty good!" },
];

// ── Dual-mode theme tokens ─────────────────────────────────────────────────────
function buildTheme(dark) {
  if (dark) return {
    accent:'#2dd4bf',
    drawerBg:'#0f172a', drawerBdr:'#1e293b',
    headerBg:'#1e293b', headerBdr:'#334155',
    msgBg:'#0f172a',
    aiBubbleBg:'#1e293b', aiBubbleBdr:'#334155',
    inputAreaBg:'#1e293b', inputAreaBdr:'#334155',
    inputFieldBg:'#0f172a', inputFieldBdr:'#334155', inputFieldText:'#f1f5f9',
    histBg:'#0f172a', histItemBg:'#1e293b', histItemBdr:'#334155',
    emptyChipBg:'#1e293b', emptyChipBdr:'#334155', emptyChipText:'#94a3b8',
    footerNote:'#475569',
    userBubble:'#0f766e',
    botIconBg:'rgba(45,212,191,0.12)', botIconBdr:'rgba(45,212,191,0.2)',
    nameText:'#f1f5f9', badgeBg:'rgba(45,212,191,0.12)', badgeBdr:'rgba(45,212,191,0.25)', badgeText:'#2dd4bf',
    subText:'#64748b', msgCountText:'#64748b',
    btnText:'#64748b', btnHoverBg:'rgba(255,255,255,0.07)', btnHoverText:'#f1f5f9',
    sessionBarBg:'#1e293b', sessionBarBdr:'#334155',
    typingBubbleBg:'#1e293b', typingBubbleBdr:'#334155',
    typingDot:'#475569', typingText:'#64748b',
    scrollPillBg:'#1e293b', scrollPillBdr:'#334155', scrollPillText:'#94a3b8',
    patientCardBg:'#1e293b', patientCardBdr:'#334155',
    hintBg:'#1e293b', hintBdr:'#334155', hintTitle:'#f1f5f9',
  };
  return {
    accent:'#0d9488',
    drawerBg:'#ffffff', drawerBdr:'#e2e8f0',
    headerBg:'#ffffff', headerBdr:'#e2e8f0',
    msgBg:'#f8fafc',
    aiBubbleBg:'#ffffff', aiBubbleBdr:'#e2e8f0',
    inputAreaBg:'#ffffff', inputAreaBdr:'#e2e8f0',
    inputFieldBg:'#f8fafc', inputFieldBdr:'#e2e8f0', inputFieldText:'#0f172a',
    histBg:'#f8fafc', histItemBg:'#ffffff', histItemBdr:'#e2e8f0',
    emptyChipBg:'#ffffff', emptyChipBdr:'#e2e8f0', emptyChipText:'#475569',
    footerNote:'#94a3b8',
    userBubble:'#0d9488',
    botIconBg:'#f0fdf4', botIconBdr:'#d1fae5',
    nameText:'#0f172a', badgeBg:'#f0fdf4', badgeBdr:'#99f6e4', badgeText:'#0f766e',
    subText:'#64748b', msgCountText:'#94a3b8',
    btnText:'#9ca3af', btnHoverBg:'#f1f5f9', btnHoverText:'#374151',
    sessionBarBg:'#f8fafc', sessionBarBdr:'#e2e8f0',
    typingBubbleBg:'#ffffff', typingBubbleBdr:'#e2e8f0',
    typingDot:'#cbd5e1', typingText:'#64748b',
    scrollPillBg:'#ffffff', scrollPillBdr:'#e2e8f0', scrollPillText:'#475569',
    patientCardBg:'#ffffff', patientCardBdr:'#e2e8f0',
    hintBg:'#ffffff', hintBdr:'#e2e8f0', hintTitle:'#0f172a',
  };
}

const C = { accent:'#0d9488', accentLight:'#f0fdf4' };

function CharRing({ len, max }) {
  const pct = len / max;
  const r = 10, circ = 2 * Math.PI * r;
  const color = pct > 0.9 ? '#ef4444' : pct > 0.7 ? '#f59e0b' : C.accent;
  if (len === 0) return null;
  return (
    <svg width={24} height={24} className="flex-shrink-0 -rotate-90">
      <circle cx={12} cy={12} r={r} fill="none" stroke="#e5e7eb" strokeWidth={2}/>
      <circle cx={12} cy={12} r={r} fill="none" stroke={color} strokeWidth={2}
        strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round"
        style={{transition:'stroke-dashoffset 0.2s,stroke 0.2s'}}/>
    </svg>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1800);}); }}
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
      style={{ background: copied?'#d1fae5':'#f3f4f6', color: copied?'#059669':'#9ca3af', border:'1px solid #e5e7eb' }}>
      {copied?<Check size={10}/>:<Copy size={10}/>}{copied?'Copied':'Copy'}
    </button>
  );
}

function Feedback() {
  const [vote, setVote] = useState(null);
  return (
    <div className="flex items-center gap-1">
      <button onClick={()=>setVote(v=>v==='up'?null:'up')} className="p-1 rounded-lg transition-all"
        style={{ background:vote==='up'?'#d1fae5':'#f3f4f6', color:vote==='up'?'#059669':'#d1d5db' }}><ThumbsUp size={11}/></button>
      <button onClick={()=>setVote(v=>v==='down'?null:'down')} className="p-1 rounded-lg transition-all"
        style={{ background:vote==='down'?'#fee2e2':'#f3f4f6', color:vote==='down'?'#dc2626':'#d1d5db' }}><ThumbsDown size={11}/></button>
    </div>
  );
}

function LLMBadge({ provider, offline }) {
  if (offline) return <span className="flex items-center gap-1 text-[10px] font-semibold text-orange-500"><WifiOff size={9}/>Offline</span>;
  const map = { openrouter:'Nemotron 550B', gemini:'Gemini 2.0', groq:'Groq Llama' };
  return <span className="flex items-center gap-1 text-[10px] font-semibold text-teal-600"><Zap size={9}/>{map[provider]||'AI'}</span>;
}

function MsgContent({ content, streaming=false, isUser=false }) {
  if (!content && !streaming) return null;
  if (isUser) return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-white">
      {content}{streaming&&<span className="inline-block w-2 h-4 bg-white/60 rounded-sm ml-0.5 animate-pulse align-middle"/>}
    </p>
  );
  return (
    <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-headings:text-teal-700 prose-strong:text-slate-900 prose-code:text-teal-700 prose-code:bg-teal-50 prose-code:px-1 prose-code:rounded text-slate-800">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        code({node,inline,className,children,...props}){
          const m=/language-(\w+)/.exec(className||'');
          return !inline&&m?<SyntaxHighlighter style={oneDark} language={m[1]} PreTag="div" className="!rounded-xl !text-xs !my-2" {...props}>{String(children).replace(/\n$/,'')}</SyntaxHighlighter>:<code className="text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded text-xs" {...props}>{children}</code>;
        },
        ul:({children})=><ul className="list-none space-y-1 my-2">{children}</ul>,
        li:({children})=><li className="flex items-start gap-2 text-slate-800"><span className="text-teal-500 font-bold flex-shrink-0 text-xs mt-0.5">▸</span><span>{children}</span></li>,
        a:({href,children})=><a href={href} target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">{children}</a>,
        p:({children})=><p className="my-1.5 text-slate-800">{children}</p>,
      }}>{content||''}</ReactMarkdown>
      {streaming&&<span className="inline-block w-2 h-4 rounded-sm ml-0.5 animate-pulse align-middle" style={{background:C.accent}}/>}
    </div>
  );
}

export default function AuraChat() {
  const [isOpen,setIsOpen]=useState(false);
  const [view,setView]=useState('chat');
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState('');
  const [loading,setLoading]=useState(false);
  const [sessionId,setSessionId]=useState(null);
  const [thinking,setThinking]=useState(false);
  const [thinkingText,setThinkingText]=useState('');
  const [provider,setProvider]=useState(null);
  const [activeFlags,setActiveFlags]=useState([]);
  const [conversations,setConversations]=useState([]);
  const [histLoading,setHistLoading]=useState(false);
  const [showConsent,setShowConsent]=useState(false);
  const [hasConsent,setHasConsent]=useState(false);
  const [showCrisis,setShowCrisis]=useState(false);
  const [atBottom,setAtBottom]=useState(true);

  const abortRef=useRef(null);
  const msgEndRef=useRef(null);
  const scrollRef=useRef(null);
  const inputRef=useRef(null);
  const taRef=useRef(null);
  const hasWelcomed=useRef(false);

  const {user}=useAuth();
  const {signals}=usePersonalisation();
  const navigate=useNavigate();
  const pushCrisis=useAppStore(s=>s.pushCrisis);
  const tok=()=>localStorage.getItem('auth_token');
  const isPatient=['patient','family'].includes(user?.role);

  useEffect(()=>{const h=()=>setIsOpen(true);window.addEventListener('aura:open',h);return()=>window.removeEventListener('aura:open',h);},[]);
  const handleScroll=useCallback(()=>{const el=scrollRef.current;if(!el)return;setAtBottom(el.scrollHeight-el.scrollTop-el.clientHeight<60);},[]);
  const scrollToBottom=()=>msgEndRef.current?.scrollIntoView({behavior:'smooth'});
  useEffect(()=>{if(atBottom)scrollToBottom();},[messages,thinking,atBottom]);
  useEffect(()=>{if(isOpen&&view==='chat')setTimeout(()=>inputRef.current?.focus(),200);},[isOpen,view]);
  const resizeTA=()=>{const el=taRef.current;if(!el)return;el.style.height='auto';el.style.height=Math.min(el.scrollHeight,140)+'px';};

  const showWelcome=useCallback(()=>{
    const first=user?.full_name?.split(' ')[0]||'there';
    setMessages([{id:'welcome',role:'assistant',content:`Hello ${first}! 👋 I'm **Aura**, your care companion.\n\nI'm here for emotional support, symptom questions, medication guidance, or just to listen. How are you feeling today?`,created_at:new Date().toISOString()}]);
  },[user]);

  useEffect(()=>{if(isOpen&&messages.length===0&&!hasWelcomed.current&&view==='chat'){hasWelcomed.current=true;setTimeout(showWelcome,150);}},[isOpen,messages.length,view,showWelcome]);

  useEffect(()=>{
    if(isOpen&&user&&!hasConsent){
      chatbotConsentAPI.getConsent(user.id).then(r=>{if(r.data.consent_given)setHasConsent(true);else setShowConsent(true);}).catch(()=>setShowConsent(true));
    }
  },[isOpen,user,hasConsent]);

  useEffect(()=>{
    if(isOpen&&!provider){
      fetch(`${API_URL}/api/llm-chatbot/status`,{headers:{Authorization:`Bearer ${tok()}`}}).then(r=>r.json()).then(d=>setProvider(d.provider)).catch(()=>setProvider('rule-based'));
    }
  },[isOpen,provider]);

  const loadHistory=useCallback(async()=>{
    setHistLoading(true);
    try{const r=await fetch(`${API_URL}/api/llm-chatbot/conversations`,{headers:{Authorization:`Bearer ${tok()}`}});const d=await r.json();setConversations(d.conversations||[]);}catch{setConversations([]);}finally{setHistLoading(false);}
  },[]);
  useEffect(()=>{if(isOpen&&view==='history')loadHistory();},[isOpen,view,loadHistory]);

  const loadConv=useCallback(async id=>{
    try{const r=await fetch(`${API_URL}/api/llm-chatbot/conversations/${id}/messages`,{headers:{Authorization:`Bearer ${tok()}`}});const d=await r.json();
    setMessages(d.messages.map(m=>({id:`db-${m.id}`,role:m.role,content:m.content,crisis_flagged:m.crisis_flagged,created_at:m.created_at})));setSessionId(id);setView('chat');}catch{setView('chat');}
  },[]);

  const delConv=useCallback(async id=>{
    try{await fetch(`${API_URL}/api/llm-chatbot/conversations/${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${tok()}`}});setConversations(p=>p.filter(c=>c.id!==id));}catch{}
  },[]);

  const startNew=useCallback(()=>{setSessionId(null);setMessages([]);setActiveFlags([]);hasWelcomed.current=false;setView('chat');},[]);
  const clearChat=useCallback(()=>{setMessages([]);setActiveFlags([]);hasWelcomed.current=false;setTimeout(showWelcome,150);},[showWelcome]);
  const handleConsentAccept=async()=>{try{await chatbotConsentAPI.saveConsent({user_id:user.id,consent_given:true,consent_text:'User consented.',ip_address:null});setHasConsent(true);setShowConsent(false);}catch{alert('Failed to save consent.');}};

  const sendMessage=useCallback(async(text=input)=>{
    const trimmed=text.trim();
    if(!trimmed||loading)return;
    if(abortRef.current)abortRef.current.abort();
    const ctrl=new AbortController();abortRef.current=ctrl;
    const uid=`user-${Date.now()}`;
    setMessages(p=>[...p,{id:uid,role:'user',content:trimmed,created_at:new Date().toISOString()}]);
    setInput('');resizeTA();setLoading(true);setThinking(true);setThinkingText('Connecting…');setActiveFlags([]);
    const sid=`stream-${Date.now()}`;
    setTimeout(()=>{setThinking(false);setMessages(p=>[...p,{id:sid,role:'assistant',content:'',streaming:true,created_at:new Date().toISOString()}]);},350);
    const params=new URLSearchParams({message:trimmed});
    if(sessionId)params.set('conversation_id',String(sessionId));
    if(signals&&user?.role==='patient'){if(signals.condition)params.set('patient_condition',signals.condition);if(signals.painLevel)params.set('pain_level',String(signals.painLevel));}
    let full='';
    try{
      const resp=await fetch(`${API_URL}/api/llm-chatbot/stream?${params}`,{headers:{Authorization:`Bearer ${tok()}`},signal:ctrl.signal});
      if(!resp.ok)throw new Error(`HTTP ${resp.status}`);
      const reader=resp.body.getReader();const dec=new TextDecoder();let buf='';
      while(true){
        const{done,value}=await reader.read();if(done)break;
        buf+=dec.decode(value,{stream:true});const lines=buf.split('\n');buf=lines.pop();
        for(const line of lines){
          if(!line.startsWith('data: '))continue;
          try{const pl=JSON.parse(line.slice(6));
            if(pl.type==='start'&&pl.model){const m=pl.model.toLowerCase();if(m.includes('nex')||m.includes('nemotron'))setProvider('openrouter');else if(m.includes('gemini'))setProvider('gemini');else if(m.includes('llama')||m.includes('groq'))setProvider('groq');}
            else if(pl.type==='chunk'&&pl.text){full+=pl.text;setMessages(p=>p.map(m=>m.id===sid?{...m,content:full}:m));}
            else if(pl.type==='meta'){if(!sessionId&&pl.conversation_id)setSessionId(pl.conversation_id);if(pl.flags?.length)setActiveFlags(pl.flags);}
          }catch{}
        }
      }
      setMessages(p=>p.map(m=>m.id===sid?{...m,content:full||"I'm here. Could you rephrase that?",streaming:false}:m));
      if(isCrisis(trimmed)){
        setShowCrisis(true);
        pushCrisis({id:Date.now(),patient_name:user?.full_name||'Unknown',message:trimmed.slice(0,120),created_at:new Date().toISOString()});
        try{await crisisAPI.reportCrisis({user_id:user?.id,crisis_type:'chatbot_detected',message_content:trimmed.slice(0,500),source:'chatbot',confidence_score:0.9});}catch{}
      }
    }catch(e){if(e.name==='AbortError')return;setMessages(p=>p.map(m=>m.id===sid?{...m,content:"Connection issue. Please try again.",streaming:false,is_error:true}:m));}
    finally{setLoading(false);setThinking(false);setTimeout(()=>inputRef.current?.focus(),100);}
  },[input,loading,sessionId,user,signals,showWelcome]);

  useEffect(()=>()=>abortRef.current?.abort(),[]);

  const basePrompts=QUICK_PROMPTS[user?.role]||QUICK_PROMPTS.patient;
  const prompts=useMemo(()=>{
    if(user?.role!=='patient'||!signals)return basePrompts;
    const p=[];
    if(signals.painLevel>=5)p.push("How can I manage my pain better?");
    if(signals.needsEmotionalSupport)p.push("I'm feeling anxious and overwhelmed");
    if(signals.needsSpiritualSupport)p.push("Can you suggest spiritual care resources?");
    return [...new Set([...p,...basePrompts])].slice(0,4);
  },[user,signals,basePrompts]);

  const { theme } = useAppSettings();
  const isDark = theme === 'dark';
  const T = buildTheme(isDark);
  const isOffline=provider==='rule-based'||provider==='offline-fallback';
  const msgCount=messages.filter(m=>m.role==='user').length;
  const subLabel=isPatient?'Your personal care companion':'Clinical support';

  return (
    <>
      <ChatbotConsentModal isOpen={showConsent} onAccept={handleConsentAccept} onDecline={()=>{setShowConsent(false);setIsOpen(false);navigate('/messages');}} userName={user?.full_name}/>
      <CrisisInterventionOverlay isOpen={showCrisis} onClose={()=>setShowCrisis(false)} onTalkToHuman={()=>{setShowCrisis(false);setIsOpen(false);navigate('/messages');}} patientName={user?.full_name} crisisType="chatbot_detected"/>

      {/* No floating trigger — opened via header MessageCircle button */}

      {/* Drawer */}
      <AnimatePresence>
        {isOpen&&(
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setIsOpen(false)}
              className="fixed inset-0 z-40" style={{background:'rgba(0,0,0,0.25)',backdropFilter:'blur(2px)'}}/>
            <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}}
              transition={{type:'spring',damping:28,stiffness:260}}
              className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
              style={{width:'min(92vw,420px)',background:T.drawerBg,borderLeft:`1px solid ${T.drawerBdr}`,boxShadow:'-8px 0 32px rgba(0,0,0,0.12)'}}
              onClick={e=>e.stopPropagation()}>

              {/* Header — clean white */}
              <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3" style={{background:T.headerBg,borderBottom:`1px solid ${T.headerBdr}`}}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{background:T.botIconBg,border:`1px solid ${T.botIconBdr}`}}>
                  <AuraMascot size={28} isThinking={thinking} isStreaming={loading&&!thinking}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" style={{color:T.nameText}}>Aura</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{background:T.badgeBg,border:`1px solid ${T.badgeBdr}`,color:T.badgeText}}>Companion</span>
                    {msgCount>0&&<span className="text-xs" style={{color:T.msgCountText}}>{msgCount} msg{msgCount!==1?'s':''}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <LLMBadge provider={provider} offline={isOffline}/>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">{subLabel}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <button onClick={()=>setView(v=>v==='history'?'chat':'history')} title="Chat history"
                    style={{color:view==='history'?T.btnHoverText:T.btnText,background:view==='history'?T.btnHoverBg:'transparent'}} className="p-1.5 rounded-lg transition-colors">
                    <History size={15}/>
                  </button>
                  <button onClick={startNew} title="New chat" className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <Plus size={15}/>
                  </button>
                  {messages.length>1&&<button onClick={clearChat} title="Clear" className="p-1.5 rounded-lg transition-colors" style={{color:T.btnText}}><RotateCcw size={14}/></button>}
                  <button onClick={()=>setIsOpen(false)} className="p-1.5 rounded-lg transition-colors ml-1" style={{color:T.btnText}}><X size={16}/></button>
                </div>
              </div>

              {/* Safety bar */}
              <div className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 border-b" style={{borderColor:isDark?'#78350f':'#fde68a',background:isDark?'#1c1000':'#fef3c7'}}>
                <AlertTriangle size={10} className="text-amber-600 flex-shrink-0"/>
                <p className="text-[10px] font-medium" style={{color:isDark?'#fcd34d':'#92400e'}}>Not medical advice · Emergency: <strong>193</strong> · Crisis Line: <strong>0800-567890</strong></p>
              </div>

              {/* History panel */}
              {view==='history'&&(
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5" style={{background:T.histBg,scrollbarWidth:'thin'}}>
                  {histLoading&&<div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin" style={{color:C.accent}}/></div>}
                  {!histLoading&&conversations.length===0&&(
                    <div className="text-center py-14"><MessageSquare size={28} className="mx-auto text-slate-300 mb-2"/><p className="text-sm text-slate-500 font-medium">No previous conversations</p></div>
                  )}
                  {!histLoading&&conversations.map(conv=>(
                    <div key={conv.id} className="group flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all" style={{background:T.histItemBg,border:`1px solid ${T.histItemBdr}`}} onClick={()=>loadConv(conv.id)}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:C.accentLight}}><MessageSquare size={12} style={{color:C.accent}}/></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{color:T.nameText}}>{conv.has_crisis&&<span className="text-red-500 mr-1">[Crisis]</span>}{conv.title}</p>
                        <p className="text-[11px] truncate mt-0.5" style={{color:T.subText}}>{conv.last_message}</p>
                        <p className="text-[10px] mt-1" style={{color:T.footerNote}}>{conv.message_count} messages · {new Date(conv.updated_at||conv.created_at).toLocaleDateString()}</p>
                      </div>
                      <button onClick={e=>{e.stopPropagation();delConv(conv.id);}} className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-500 transition-all"><Trash2 size={12}/></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Chat view */}
              {view==='chat'&&(
                <>
                  {/* Restored session bar */}
                  {sessionId&&messages.some(m=>m.id?.startsWith('db-'))&&(
                    <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b" style={{background:T.sessionBarBg,borderColor:T.sessionBarBdr}}>
                      <button onClick={startNew} className="flex items-center gap-1 text-xs font-semibold transition-colors" style={{color:C.accent}}><ChevronLeft size={13}/>New chat</button>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400">Viewing saved conversation</span>
                    </div>
                  )}
                  {/* Flag banner */}
                  {activeFlags.length>0&&(
                    <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}}
                      className="flex-shrink-0 mx-3 mt-2 px-3 py-2 rounded-xl flex items-start gap-2 text-xs font-medium border"
                      style={activeFlags.some(f=>f.severity==='critical')?{background:'#fef2f2',borderColor:'#fecaca',color:'#ef4444'}:{background:'#fffbeb',borderColor:'#fde68a',color:'#92400e'}}>
                      <ShieldAlert size={12} className="flex-shrink-0 mt-0.5"/>
                      <span>{activeFlags.some(f=>f.severity==='critical')?"Care team notified immediately.":"Your care team has been notified."}</span>
                    </motion.div>
                  )}

                  {/* Messages */}
                  <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-5 space-y-5" style={{background:T.msgBg,scrollbarWidth:'thin'}}>

                    {/* Empty state */}
                    {messages.length===0&&(
                      <div className="flex flex-col items-center pt-6 space-y-5">
                        <div className="w-16 h-16"><AuraMascot size={64} isThinking={thinking} isStreaming={loading&&!thinking}/></div>
                        <div className="text-center px-4">
                          <p className="font-semibold text-base mb-1" style={{color:T.nameText}}>I'm here for you</p>
                          <p className="text-sm leading-relaxed" style={{color:T.subText}}>Ask me anything — symptoms, medications,<br/>emotional support, or just to talk.</p>
                        </div>
                        {isPatient&&(
                          <div className="w-full">
                            <p className="text-xs font-semibold uppercase tracking-wider text-center mb-3" style={{color:T.subText}}>How are you feeling today?</p>
                            <div className="flex justify-center gap-3">
                              {FEEL_SCALE.map(f=>(
                                <button key={f.emoji} onClick={()=>sendMessage(f.msg)} title={f.label}
                                  className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all" style={{background:T.emptyChipBg,border:`1px solid ${T.emptyChipBdr}`}}>
                                  <span className="text-2xl">{f.emoji}</span>
                                  <span className="text-[10px] font-semibold" style={{color:T.subText}}>{f.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="w-full">
                          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{color:T.subText}}>Suggested</p>
                          <div className="flex flex-wrap gap-2">
                            {prompts.map((p,i)=>(
                              <button key={i} onClick={()=>sendMessage(p)} disabled={loading}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40" style={{background:T.emptyChipBg,border:`1px solid ${T.emptyChipBdr}`,color:T.emptyChipText}}>
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Message bubbles */}
                    {messages.map(msg=>{
                      const isUser=msg.role==='user';
                      return (
                        <motion.div key={msg.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.15}}
                          className={`group flex ${isUser?'justify-end':'justify-start'} items-end gap-2`}>
                          {!isUser&&(
                            <div className="w-7 h-7 rounded-full flex-shrink-0 mb-6 flex items-center justify-center shadow-sm" style={{background:T.botIconBg,border:`1px solid ${T.botIconBdr}`}}>
                              <Sparkles size={13} style={{color:T.accent}}/>
                            </div>
                          )}
                          <div className={`flex flex-col gap-1.5 max-w-[84%] ${isUser?'items-end':'items-start'}`}>
                            <div
                              className={`px-4 py-3 rounded-2xl ${isUser?'rounded-br-none':'rounded-bl-none'}`}
                              style={isUser
                                ? {background:T.userBubble,color:'#ffffff'}
                                : msg.crisis_flagged
                                  ? {background:'#fef2f2',border:'1px solid #fecaca',color:'#7f1d1d'}
                                  : {background:T.aiBubbleBg,border:`1px solid ${T.aiBubbleBdr}`,color:T.nameText,boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}
                            >
                              {msg.crisis_flagged&&!isUser&&(<div className="flex items-center gap-1 mb-2 text-[11px] font-bold text-red-500"><AlertTriangle size={11}/>CRISIS SUPPORT</div>)}
                              <MsgContent content={msg.content} streaming={msg.streaming} isUser={isUser}/>
                            </div>
                            <div className={`flex items-center gap-2 px-1 ${isUser?'justify-end':'justify-start'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                              <span className="text-[10px] text-slate-400">{new Date(msg.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                              {isUser&&!msg.streaming&&<CheckCheck size={10} style={{color:C.accent}}/>}
                              {!isUser&&msg.content&&!msg.streaming&&<CopyBtn text={msg.content}/>}
                              {!isUser&&msg.content&&!msg.streaming&&<Feedback/>}
                            </div>
                          </div>
                          {isUser&&(
                            <div className="w-7 h-7 rounded-full flex-shrink-0 mb-6 flex items-center justify-center text-white text-xs font-bold" style={{background:T.userBubble}}>
                              {user?.full_name?.[0]||'U'}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}

                    {/* Typing indicator */}
                    <AnimatePresence>
                      {thinking&&(
                        <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="flex items-end gap-2">
                          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{background:T.typingBubbleBg,border:`1px solid ${T.typingBubbleBdr}`}}>
                            <Brain size={12} className="animate-pulse" style={{color:T.accent}}/>
                          </div>
                          <div className="px-4 py-3 rounded-2xl rounded-bl-none" style={{background:T.typingBubbleBg,border:`1px solid ${T.typingBubbleBdr}`}}>
                            <div className="flex items-center gap-2">
                              {[0,1,2].map(i=>(<motion.div key={i} className="w-2 h-2 rounded-full" style={{background:T.typingDot}} animate={{y:[0,-4,0],opacity:[0.5,1,0.5]}} transition={{duration:0.7,delay:i*0.15,repeat:Infinity}}/>))}
                              <span className="text-xs font-medium ml-1" style={{color:T.typingText}}>Aura is typing…</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div ref={msgEndRef}/>
                  </div>

                  {/* Scroll pill */}
                  <AnimatePresence>
                    {!atBottom&&(
                      <motion.button initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}} onClick={scrollToBottom}
                        className="absolute left-1/2 -translate-x-1/2 bottom-24 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg bg-teal-600 hover:bg-teal-700 transition-colors">
                        <ChevronDown size={13}/>New messages
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* Input */}
                  <div className="flex-shrink-0 px-4 py-3 border-t" style={{background:T.inputAreaBg,borderColor:T.inputAreaBdr}}>
                    <form onSubmit={e=>{e.preventDefault();sendMessage();}} className="space-y-1.5">
                      <div className="flex items-end gap-2">
                        <div className="flex-1 relative">
                          <textarea ref={el=>{inputRef.current=el;taRef.current=el;}} value={input}
                            onChange={e=>{setInput(e.target.value);resizeTA();}}
                            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}}
                            placeholder="Message Aura…" rows={1} maxLength={MAX_CHARS} disabled={loading}
                            className="w-full resize-none rounded-xl outline-none transition-all max-h-[140px] overflow-y-auto leading-relaxed px-4 py-2.5 disabled:opacity-50 text-sm"
                            style={{background:T.inputFieldBg,border:`1px solid ${T.inputFieldBdr}`,color:T.inputFieldText,caretColor:T.accent}}/>
                        </div>
                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                          <CharRing len={input.length} max={MAX_CHARS}/>
                          <motion.button type="submit" disabled={!input.trim()||loading}
                            whileHover={{scale:1.06}} whileTap={{scale:0.94}}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all disabled:cursor-not-allowed bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400">
                            {loading?<Loader2 size={15} className="animate-spin"/>:<Send size={15} strokeWidth={2.5}/>}
                          </motion.button>
                        </div>
                      </div>
                      <p className="text-[10px] text-center mt-1" style={{color:T.footerNote}}>{isOffline?'⚡ Offline mode':'Shift+Enter for new line · Not medical advice'}</p>
                    </form>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
