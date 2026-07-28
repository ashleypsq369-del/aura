/**
 * AIAssistant.jsx — Clinical Copilot v5
 * Sky-blue theme · for clinicians/admins/caregivers.
 * Purpose: summarise patients, explain AI predictions, answer clinical questions,
 *          flag concerns, draft notes. NO navigation tiles — sidebar does that.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  X, Send, Loader2, Brain, AlertTriangle, Activity,
  Zap, Bot, Copy, Check, ThumbsUp, ThumbsDown,
  RotateCcw, ChevronDown, UserCircle, Stethoscope,
  FileText, ClipboardList, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import AuraMascot from './AuraMascot';
import { API_URL } from '../api/client';
import HintTooltip from './HintTooltip';

const C = {
  bg:'#ffffff', bgAlt:'#f0f9ff', border:'#bae6fd',
  accent:'#0284c7', accentLight:'#e0f2fe', accentGlow:'rgba(2,132,199,0.18)',
  userBubble:'linear-gradient(135deg,#0284c7,#0369a1)', userShadow:'0 4px 16px rgba(2,132,199,0.3)',
  aiBubble:'#ffffff', aiBorder:'1px solid #cbd5e1', aiShadow:'0 2px 8px rgba(0,0,0,0.10)',
  text:'#0f172a', textMuted:'#475569', textFaint:'#64748b',
};

/* Analysis-focused chips — questions that NEED AI, not navigation */
const ANALYSIS_CHIPS = {
  '/patients':         ['Which patients deteriorated this week?','Who needs the most urgent review and why?','Summarise the top 3 high-risk patients'],
  '/medications':      ['Are there dangerous drug interactions?','Which medications are overdue for review?','Flag any contraindications in current prescriptions'],
  '/alerts':           ['What is causing the most alerts today?','Which alerts need immediate action first?','Summarise the alert patterns this week'],
  '/ai-insights':      ['Explain these risk predictions in plain English','Which SHAP factors are most clinically concerning?','What actions should I take for high-risk patients?'],
  '/appointments':     ['Are any high-risk patients missing appointments?','Which appointment today is most clinically urgent?','Draft a pre-appointment briefing'],
  '/caregivers':       ['Which caregivers have unsustainable workloads?','Who is showing early signs of burnout?'],
  '/care-settings':    ['What do the current care settings tell us?','Which patients need care setting changes?'],
};
const DEFAULT_CHIPS = ['What needs my attention right now?','Summarise today\'s clinical picture','Which patients are deteriorating?','Draft a shift handover note'];

/* Patient-page chips — when viewing a specific patient */
const PATIENT_CHIPS = ['Summarise this patient\'s recent changes','What are the key clinical concerns?','Explain the risk score in plain English','Draft a clinical note for this patient'];

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={()=>{navigator.clipboard.writeText(text).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1800);});}}
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
      style={{background:copied?'#d1fae5':'#f3f4f6',color:copied?'#059669':'#9ca3af',border:'1px solid #e5e7eb'}}>
      {copied?<Check size={10}/>:<Copy size={10}/>}{copied?'Copied':'Copy'}
    </button>
  );
}

function Feedback() {
  const [vote,setVote]=useState(null);
  return (
    <div className="flex items-center gap-1">
      <button onClick={()=>setVote(v=>v==='up'?null:'up')} className="p-1 rounded-lg transition-all"
        style={{background:vote==='up'?'#d1fae5':'#f3f4f6',color:vote==='up'?'#059669':'#d1d5db'}}><ThumbsUp size={11}/></button>
      <button onClick={()=>setVote(v=>v==='down'?null:'down')} className="p-1 rounded-lg transition-all"
        style={{background:vote==='down'?'#fee2e2':'#f3f4f6',color:vote==='down'?'#dc2626':'#d1d5db'}}><ThumbsDown size={11}/></button>
    </div>
  );
}

function MsgContent({ text, streaming, isUser=false }) {
  if (!text && !streaming) return null;
  if (isUser) return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{color:'rgba(255,255,255,0.95)'}}>
      {text}{streaming&&<span className="inline-block w-2 h-4 bg-white/60 rounded-sm ml-0.5 animate-pulse align-middle"/>}
    </p>
  );
  return (
    <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-headings:text-sky-700 dark:prose-headings:text-sky-400 prose-strong:text-slate-900 dark:prose-strong:text-white prose-code:text-sky-700 dark:prose-code:text-sky-400 prose-code:bg-sky-50 dark:prose-code:bg-sky-900/30 prose-code:px-1 prose-code:rounded text-slate-700 dark:text-slate-200">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        code({node,inline,className,children,...props}){
          const m=/language-(\w+)/.exec(className||'');
          return !inline&&m?<SyntaxHighlighter style={oneDark} language={m[1]} PreTag="div" className="!rounded-xl !text-xs !my-2" {...props}>{String(children).replace(/\n$/,'')}</SyntaxHighlighter>:<code className="text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-1.5 py-0.5 rounded text-xs" {...props}>{children}</code>;
        },
        ul:({children})=><ul className="list-none space-y-1 my-2">{children}</ul>,
        li:({children})=><li className="flex items-start gap-2 text-slate-700 dark:text-slate-200"><span className="text-sky-500 font-bold flex-shrink-0 text-xs mt-0.5">▸</span><span>{children}</span></li>,
        a:({href,children})=><a href={href} target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 underline">{children}</a>,
        p:({children})=><p className="my-1.5 text-slate-700 dark:text-slate-200">{children}</p>,
      }}>{text||''}</ReactMarkdown>
      {streaming&&<span className="inline-block w-2 h-4 rounded-sm ml-0.5 animate-pulse align-middle" style={{background:C.accent}}/>}
    </div>
  );
}

export default function AIAssistant() {
  const [isOpen,setIsOpen]=useState(false);
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState('');
  const [loading,setLoading]=useState(false);
  const [streaming,setStreaming]=useState(false);
  const [sessionId,setSessionId]=useState(null);
  const [provider,setProvider]=useState(null);
  const [atBottom,setAtBottom]=useState(true);

  const abortRef=useRef(null);
  const msgEndRef=useRef(null);
  const scrollRef=useRef(null);
  const inputRef=useRef(null);
  const streamId=useRef(null);

  const {user}=useAuth();
  const navigate=useNavigate();
  const location=useLocation();
  const params=useParams();
  const urlPid=params.patientId||params.patient_id||null;
  const isClinical=['clinician','admin','caregiver'].includes(user?.role);

  const {data:sysInsights}=useQuery({queryKey:['ai-system-insights-assistant'],queryFn:()=>apiClient.get('/api/ai-analysis/system-insights').then(r=>r.data),enabled:isClinical,refetchInterval:60000,retry:false});
  const {data:dashSummary}=useQuery({queryKey:['assistant-dashboard-summary'],queryFn:()=>apiClient.get('/api/dashboard/summary').then(r=>r.data),enabled:isClinical,refetchInterval:30000,retry:false});
  const {data:mlBatch}=useQuery({queryKey:['assistant-ml-batch'],queryFn:()=>apiClient.get('/api/ml/patients/batch-risk').then(r=>r.data),enabled:isClinical,staleTime:5*60*1000,retry:false});
  const {data:patientData}=useQuery({queryKey:['assistant-patient',urlPid],queryFn:()=>apiClient.get(`/api/patients/${urlPid}`).then(r=>r.data),enabled:!!urlPid,staleTime:2*60*1000,retry:false});

  const criticalML=mlBatch?.patients?.filter(p=>p.risk_level==='critical').length||0;
  const critical=sysInsights?.critical_patients?.length||0;
  const hasUrgent=critical>0||criticalML>0;
  const topActions=sysInsights?.immediate_actions?.slice(0,2)||[];

  const handleScroll=useCallback(()=>{const el=scrollRef.current;if(!el)return;setAtBottom(el.scrollHeight-el.scrollTop-el.clientHeight<60);},[]);
  const scrollToBottom=()=>msgEndRef.current?.scrollIntoView({behavior:'smooth'});
  useEffect(()=>{if(atBottom)scrollToBottom();},[messages,streaming,atBottom]);
  useEffect(()=>{if(isOpen&&!loading)setTimeout(()=>inputRef.current?.focus(),200);},[isOpen,loading]);
  useEffect(()=>()=>{abortRef.current?.abort();},[]);

  // Listen for header button event
  useEffect(()=>{
    const h=()=>setIsOpen(true);
    window.addEventListener('aura:copilot-open',h);
    return()=>window.removeEventListener('aura:copilot-open',h);
  },[]);

  const sendMessage=useCallback(async(text=input)=>{
    const trimmed=text.trim();
    if(!trimmed||loading)return;
    if(abortRef.current)abortRef.current.abort();
    const ctrl=new AbortController();abortRef.current=ctrl;
    const uid=`u-${Date.now()}`;
    setMessages(p=>[...p,{id:uid,role:'user',content:trimmed,ts:new Date()}]);
    setInput('');setLoading(true);
    const aid=`a-${Date.now()}`;streamId.current=aid;
    setTimeout(()=>{setStreaming(true);setMessages(p=>[...p,{id:aid,role:'assistant',content:'',streaming:true,ts:new Date()}]);},300);
    try{
      const p=new URLSearchParams({message:trimmed});
      if(sessionId)p.set('conversation_id',String(sessionId));
      if(urlPid)p.set('patient_id',String(urlPid));
      const resp=await fetch(`${API_URL}/api/llm-chatbot/stream?${p}`,{headers:{Authorization:`Bearer ${localStorage.getItem('auth_token')}`},signal:ctrl.signal});
      if(!resp.ok)throw new Error(`HTTP ${resp.status}`);
      const reader=resp.body.getReader();const dec=new TextDecoder();
      let buf='',full='';
      while(true){
        const{done,value}=await reader.read();if(done)break;
        buf+=dec.decode(value,{stream:true});const lines=buf.split('\n');buf=lines.pop();
        for(const line of lines){
          if(!line.startsWith('data: '))continue;
          try{const pl=JSON.parse(line.slice(6));
            if(pl.type==='start'&&pl.model){const m=pl.model.toLowerCase();if(m.includes('nex')||m.includes('nemotron'))setProvider('Nemotron');else if(m.includes('gemini'))setProvider('Gemini');else if(m.includes('llama')||m.includes('groq'))setProvider('Groq');else setProvider(pl.model.split('/').pop()?.split(':')[0]||'AI');}
            else if(pl.type==='chunk'&&pl.text){full+=pl.text;setMessages(p=>p.map(m=>m.id===aid?{...m,content:full}:m));}
            else if(pl.type==='meta'&&!sessionId&&pl.conversation_id)setSessionId(pl.conversation_id);
          }catch{}
        }
      }
      setMessages(p=>p.map(m=>m.id===aid?{...m,content:full||'Let me know how I can help.',streaming:false}:m));
    }catch(e){if(e.name==='AbortError')return;setMessages(p=>p.map(m=>m.id===aid?{...m,content:'Connection issue — please try again.',streaming:false,error:true}:m));}
    finally{setLoading(false);setStreaming(false);}
  },[input,loading,sessionId,urlPid]);

  const clearChat=()=>setMessages([]);

  /* Pick chips based on current page */
  const pagePath=location.pathname;
  const chips=urlPid ? PATIENT_CHIPS : (ANALYSIS_CHIPS[pagePath]||ANALYSIS_CHIPS['/'+pagePath.split('/')[1]]||DEFAULT_CHIPS);
  const pageName=pagePath.split('/').filter(Boolean)[0]||'dashboard';
  const readablePageName=pageName.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());

  return (
    <>
      {/* No floating trigger — opened via header Stethoscope button */}

      {/* Drawer */}
      <AnimatePresence>
        {isOpen&&(
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setIsOpen(false)}
              className="fixed inset-0 z-40" style={{background:'rgba(0,0,0,0.2)',backdropFilter:'blur(2px)'}}/>
            <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}}
              transition={{type:'spring',damping:28,stiffness:260}}
              className="fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-white"
              style={{width:'min(92vw,520px)',borderLeft:'1px solid #e2e8f0',boxShadow:'-8px 0 40px rgba(0,0,0,0.10)'}}
              onClick={e=>e.stopPropagation()}>

              {/* Header — sky-blue gradient (distinct from teal AuraChat) */}
              <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
                style={{background:'linear-gradient(135deg,#0284c7,#0369a1)',borderBottom:'1px solid rgba(255,255,255,0.15)'}}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'rgba(255,255,255,0.15)'}}>
                  <AuraMascot size={28} isThinking={loading&&!streaming} isStreaming={streaming}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">Clinical Copilot</span>
                    {hasUrgent&&(
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white" style={{background:'rgba(239,68,68,0.85)'}}>
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"/>{critical} urgent
                      </span>
                    )}
                    {provider&&(
                      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full text-white/80" style={{background:'rgba(255,255,255,0.2)'}}>
                        <Zap size={9}/>{provider}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] mt-0.5 text-white/60 font-medium capitalize">
                    {user?.role} · {readablePageName}{urlPid&&` · Patient #${urlPid}`}
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  {messages.length>0&&<button onClick={clearChat} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/15 transition-all"><RotateCcw size={14}/></button>}
                  <button onClick={()=>setIsOpen(false)} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/15 transition-all"><X size={16}/></button>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 border-b" style={{borderColor:'#fde68a',background:'#fef3c7'}}>
                <AlertTriangle size={10} className="text-amber-600 flex-shrink-0"/>
                <p className="text-[10px] text-amber-800 font-medium">AI suggestions only — always apply clinical judgement · Emergency: <strong>193</strong></p>
              </div>

              {/* Conversation area */}
              <div className="flex-1 flex flex-col overflow-hidden relative bg-sky-50 dark:bg-slate-800">

                {/* Patient context card */}
                {urlPid&&patientData&&(
                  <div className="flex-shrink-0 mx-4 mt-3 px-3 py-2.5 rounded-xl flex items-center gap-3 border bg-white dark:bg-slate-700 border-sky-200 dark:border-sky-800">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'#e0f2fe'}}>
                      <UserCircle size={16} style={{color:C.accent}}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{patientData.full_name||patientData.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {patientData.primary_diagnosis||'—'} · {patientData.age||'—'}y ·
                        <span className={`ml-1 font-bold ${patientData.risk_level==='Crisis'||patientData.risk_level==='critical'?'text-red-500':patientData.risk_level==='High'||patientData.risk_level==='high'?'text-amber-500':'text-emerald-600'}`}>{patientData.risk_level||'—'} risk</span>
                      </p>
                    </div>
                    <Stethoscope size={14} className="text-slate-300 dark:text-slate-500"/>
                  </div>
                )}

                {/* Urgent actions banner */}
                {isClinical&&hasUrgent&&topActions.length>0&&messages.length===0&&(
                  <div className="flex-shrink-0 mx-4 mt-3 p-3 rounded-xl border" style={{background:'#fffbeb',borderColor:'#fde68a'}}>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity size={12} className="text-amber-600 flex-shrink-0"/>
                      <p className="text-xs font-bold text-amber-800">{critical} patient{critical!==1?'s':''} need attention</p>
                    </div>
                    <div className="space-y-1.5">
                      {topActions.map((a,i)=>(
                        <button key={i} onClick={()=>sendMessage(`Tell me about ${a.patient}: ${a.action}`)}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50">
                          <span className="font-semibold text-amber-800">{a.patient}:</span> <span className="text-amber-700">{a.action}</span>
                          <span className="float-right text-amber-500 font-semibold">Ask AI →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-5" style={{scrollbarWidth:'thin'}}>

                  {/* Empty state — analysis-focused */}
                  {messages.length===0&&(
                    <div className="flex flex-col items-center pt-4 space-y-5">
                      <div className="w-14 h-14"><AuraMascot size={56} isThinking={loading&&!streaming} isStreaming={streaming}/></div>
                      <div className="text-center">
                        <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Clinical Copilot</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">Ask me to summarise patients, explain AI predictions, flag drug interactions, or draft clinical notes.</p>
                      </div>

                      {/* Stats — clinical overview */}
                      {isClinical&&dashSummary&&(
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                          {[{label:'Patients',value:dashSummary.total_patients??'—',color:'#7c3aed'},{label:'Critical',value:critical||'0',color:'#dc2626'},{label:'Alerts',value:dashSummary.active_alerts??'—',color:'#d97706'},{label:'Appointments',value:dashSummary.todays_appointments??'—',color:C.accent}].map(s=>(
                            <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm">
                              <span className="text-sm font-black tabular-nums" style={{color:s.color}}>{s.value}</span>
                              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{s.label}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Analysis chips — what AI can actually do here */}
                      <div className="w-full">
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Ask about this page</p>
                        <div className="flex flex-wrap gap-2">
                          {chips.map(c=>(
                            <button key={c} onClick={()=>sendMessage(c)}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all border border-sky-300 bg-sky-100 dark:bg-sky-900/40 dark:border-sky-700 text-sky-800 dark:text-sky-300 hover:bg-sky-600 hover:text-white hover:border-sky-600 dark:hover:bg-sky-600 dark:hover:text-white">
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Capability hints */}
                      <div className="w-full grid grid-cols-2 gap-2">
                        {[{icon:TrendingUp,label:'Summarise patients',desc:'Risk levels & changes',q:'Summarise all patients by risk level'},{icon:Brain,label:'Explain AI predictions',desc:'SHAP values in plain English',q:'Explain the top risk factors for high-risk patients'},{icon:ClipboardList,label:'Draft clinical notes',desc:'Handover, SOAP notes',q:'Draft a shift handover summary'},{icon:FileText,label:'Flag drug interactions',desc:'Current prescriptions',q:'Are there any dangerous drug interactions in current prescriptions?'}].map(h=>{
                          const Icon=h.icon;
                          return (
                            <button key={h.label} onClick={()=>sendMessage(h.q)}
                              className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-slate-600 shadow-sm">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:'#e0f2fe'}}><Icon size={13} style={{color:C.accent}}/></div>
                              <div className="min-w-0"><p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{h.label}</p><p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{h.desc}</p></div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Bubbles */}
                  {messages.map(msg=>{
                    const isUser=msg.role==='user';
                    return (
                      <motion.div key={msg.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.15}}
                        className={`group flex ${isUser?'justify-end':'justify-start'} items-end gap-2`}>
                        {!isUser&&(
                          <div className="w-7 h-7 rounded-full flex-shrink-0 mb-6 flex items-center justify-center shadow-sm" style={{background:C.userBubble}}>
                            <Bot size={12} className="text-white"/>
                          </div>
                        )}
                        <div className={`flex flex-col gap-1.5 max-w-[84%] ${isUser?'items-end':'items-start'}`}>
                          <div className={`px-4 py-3 rounded-2xl ${isUser?'rounded-br-sm':'rounded-bl-sm'} ${
                              isUser ? '' :
                              msg.error ? 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700' :
                              'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm'
                            }`}
                            style={isUser ? {background:C.userBubble, boxShadow:C.userShadow} : undefined}>
                            <MsgContent text={msg.content} streaming={msg.streaming} isUser={isUser}/>
                          </div>
                          <div className={`flex items-center gap-2 px-1 ${isUser?'justify-end':'justify-start'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                            <span className="text-[10px] text-gray-400">{msg.ts?.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                            {!isUser&&msg.content&&!msg.streaming&&<CopyBtn text={msg.content}/>}
                            {!isUser&&msg.content&&!msg.streaming&&<Feedback/>}
                          </div>
                        </div>
                        {isUser&&(
                          <div className="w-7 h-7 rounded-full flex-shrink-0 mb-6 flex items-center justify-center text-white text-[10px] font-bold" style={{background:C.userBubble}}>
                            {user?.full_name?.[0]||'U'}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* Typing */}
                  <AnimatePresence>
                    {loading&&!streaming&&(
                      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-end gap-2">
                        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{background:C.userBubble}}>
                          <Brain size={12} className="text-white animate-pulse"/>
                        </div>
                        <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white border shadow-sm" style={{borderColor:'#bae6fd'}}>
                          <div className="flex items-center gap-2">
                            {[0,1,2].map(i=>(<motion.div key={i} className="w-2 h-2 rounded-full" style={{background:C.accent}} animate={{y:[0,-4,0],opacity:[0.5,1,0.5]}} transition={{duration:0.7,delay:i*0.15,repeat:Infinity}}/>))}
                            <span className="text-xs text-gray-600 font-medium ml-1">Analysing…</span>
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
                      className="absolute left-1/2 -translate-x-1/2 bottom-20 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg"
                      style={{background:C.userBubble,boxShadow:C.userShadow}}>
                      <ChevronDown size={13}/>Jump to latest
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Follow-up chips after conversation started */}
                {messages.length>0&&messages.length<6&&(
                  <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto" style={{scrollbarWidth:'none',background:'#f0f9ff'}}>
                    {chips.slice(0,3).map(c=>(
                      <button key={c} onClick={()=>sendMessage(c)}
                        className="flex-shrink-0 px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all border"
                        style={{background:'#dbeafe',borderColor:'#93c5fd',color:'#1d4ed8'}}
                        onMouseEnter={e=>{e.currentTarget.style.background='#1d4ed8';e.currentTarget.style.color='#ffffff';}}
                        onMouseLeave={e=>{e.currentTarget.style.background='#dbeafe';e.currentTarget.style.color='#1d4ed8';}}>
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <form onSubmit={e=>{e.preventDefault();sendMessage();}}
                  className="flex-shrink-0 px-3 pb-3 pt-2 border-t flex gap-2 items-center bg-white" style={{borderColor:'#bae6fd'}}>
                  <input ref={inputRef} type="text" value={input} onChange={e=>setInput(e.target.value)}
                    placeholder="Ask about patients, get summaries, or draft notes…" disabled={loading}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-900 rounded-2xl outline-none transition-all disabled:opacity-50 min-w-0"
                    style={{background:'#f0f9ff',border:'1px solid #94a3b8',caretColor:C.accent}}
                    onFocus={e=>{e.target.style.border=`2px solid ${C.accent}`;e.target.style.boxShadow=`0 0 0 3px ${C.accentGlow}`;e.target.style.background='#ffffff';}}
                    onBlur={e=>{e.target.style.border='1px solid #94a3b8';e.target.style.boxShadow='none';e.target.style.background='#f0f9ff';}}/>
                  <motion.button type="submit" disabled={!input.trim()||loading}
                    whileHover={{scale:1.06}} whileTap={{scale:0.94}}
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all disabled:cursor-not-allowed"
                    style={{background:input.trim()&&!loading?C.userBubble:'#94a3b8',boxShadow:input.trim()&&!loading?C.userShadow:'none',opacity:!input.trim()&&!loading?0.55:1}}>
                    {loading?<Loader2 size={16} className="animate-spin"/>:<Send size={16} strokeWidth={2.5}/>}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
