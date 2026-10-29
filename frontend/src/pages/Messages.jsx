/**
 * Messages — Adaptive light/dark messaging interface
 * - Full CSS var support (light + dark mode)
 * - Contacts tab correctly opens the person's chat
 * - Amber accent for secondary text labels
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Search, Users, AlertCircle, Plus,
  MessageCircle, UserPlus, Loader2, MessagesSquare, Paperclip, X,
  Stethoscope, Phone, Video, Smile, Reply,
  MoreVertical, ArrowLeft,
} from 'lucide-react';
import axios from 'axios';
import toast from '../utils/toast';
import ContactsTab from '../components/ContactsTab';
import FileUpload from '../components/FileUpload';
import Modal, { ModalFooter } from '../components/Modal';
import { useWS } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../api/client';

/* ─── Emoji ─────────────────────────────────────────────── */
const EMOJI_GRID = [
  '😊','😂','🥰','😢','😮','🙏','❤️','💪','🤗','🫂',
  '🌟','🔥','🙌','💙','💚','💛','💜','🤍','👍','👏',
  '🫶','💝','🕊️','🌿','🍃','🌻','✨','🎉','🤲','😎',
  '🫀','💖','😌','🤒','💊','🏥','🩺','🩹','☀️','🌈',
];

/* ─── Urgency ────────────────────────────────────────────── */
const URGENT_KW = ['urgent','emergency','critical','asap','help','pain','crisis','severe','dying','bleeding','fell','unconscious','chest','breathing','vomiting','seizure','confused','fever','unresponsive'];
const HIGH_KW   = ['worried','concerned','worse','worsening','medication','missed','dose','nausea','side effect','appointment','cancel'];
function classifyUrgency(text) {
  if (!text) return 'normal';
  const t = text.toLowerCase();
  if (URGENT_KW.some(k => t.includes(k))) return 'urgent';
  if (HIGH_KW.some(k => t.includes(k))) return 'high';
  return 'normal';
}
const URG_CFG = {
  urgent: { color:'#ef4444', label:'URGENT' },
  high:   { color:'#f59e0b', label:'HIGH'   },
  normal: { color:null, label:null },
};

/* ─── Helpers ────────────────────────────────────────────── */
const GRAD = [
  'linear-gradient(135deg,#0d9488,#0891b2)',
  'linear-gradient(135deg,#7c3aed,#4338ca)',
  'linear-gradient(135deg,#db2777,#e11d48)',
  'linear-gradient(135deg,#059669,#0d9488)',
  'linear-gradient(135deg,#1d4ed8,#0891b2)',
  'linear-gradient(135deg,#d97706,#ea580c)',
];
const gradFor  = (id) => GRAD[(id||0) % GRAD.length];
const fmtTime  = (d) => new Date(d).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
const fmtDate  = (d) => {
  const dt = new Date(d), today = new Date();
  if (dt.toDateString() === today.toDateString()) return 'Today';
  const yest = new Date(today); yest.setDate(yest.getDate()-1);
  if (dt.toDateString() === yest.toDateString()) return 'Yesterday';
  return dt.toLocaleDateString('en-GB', { day:'numeric', month:'short' });
};

/* ─── CSS var shorthand helpers (inline styles can't use :root vars directly in some places) ── */
const S = {
  pageBg:     'var(--page-bg)',
  cardBg:     'var(--card-bg)',
  border:     'var(--card-border)',
  t900:       'var(--text-900)',
  t800:       'var(--text-800)',
  t700:       'var(--text-700)',
  t600:       'var(--text-600)',
  t500:       'var(--text-500)',
  teal:       'var(--c-teal)',
  amber:      '#d97706',  // amber accent for secondary labels
  amberLight: '#f59e0b',
};

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
export default function Messages() {
  const { user } = useAuth();
  const [activeTab, setActiveTab]           = useState('chats');
  const [selectedConv, setSelectedConv]     = useState(null);
  const [pendingUserId, setPendingUserId]   = useState(null); // wait for conv after startMut
  const [newMessage, setNewMessage]         = useState('');
  const [searchQuery, setSearchQuery]       = useState('');
  const [showNewChat, setShowNewChat]       = useState(false);
  const [showNewGroup, setShowNewGroup]     = useState(false);
  const [selectedParts, setSelectedParts]  = useState([]);
  const [groupName, setGroupName]          = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [attachedFiles, setAttachedFiles]  = useState([]);
  const [newChatSearch, setNewChatSearch]  = useState('');
  const [showEmojiPicker, setShowEmoji]    = useState(false);
  const [replyingTo, setReplyingTo]        = useState(null);
  const inputRef    = useRef(null);
  const msgEnd      = useRef(null);
  const qc          = useQueryClient();
  const { subscribe } = useWS();
  const location    = useLocation();

  const authH = { Authorization:`Bearer ${localStorage.getItem('auth_token')}` };

  /* WS */
  useEffect(() => {
    const unsub = subscribe('new_message', (data) => {
      qc.invalidateQueries({ queryKey:['conversations'] });
      if (data.conversation_id === selectedConv?.id)
        qc.invalidateQueries({ queryKey:['messages', data.conversation_id] });
    });
    return unsub;
  }, [subscribe, qc, selectedConv]);

  /* Queries */
  const { data: careTeamData } = useQuery({
    queryKey:['my-care-team'],
    queryFn: () => axios.get(`${API_URL}/api/messaging/my-care-team`, { headers:authH }).then(r=>r.data),
    staleTime:5*60*1000,
  });
  const careTeam = careTeamData?.care_team || [];

  const { data: convsData, isLoading:loadingConvs } = useQuery({
    queryKey:['conversations'],
    queryFn: () => axios.get(`${API_URL}/api/messaging/conversations`, { headers:authH }).then(r=>r.data),
    refetchInterval:30000,
  });

  const { data: msgsData } = useQuery({
    queryKey:['messages', selectedConv?.id],
    queryFn: () => selectedConv
      ? axios.get(`${API_URL}/api/messaging/conversations/${selectedConv.id}/messages`, { headers:authH }).then(r=>r.data)
      : { messages:[] },
    enabled:!!selectedConv,
    refetchInterval:15000,
  });

  const { data: physData } = useQuery({
    queryKey:['physicians'],
    queryFn: () => axios.get(`${API_URL}/api/messaging/physicians`, { headers:authH }).then(r=>r.data),
    enabled:showNewChat||showNewGroup,
  });

  const { data: groupsData } = useQuery({
    queryKey:['messaging-community-groups'],
    queryFn: () => axios.get(`${API_URL}/api/messaging/community-groups`, { headers:authH }).then(r=>r.data),
    enabled:showNewGroup,
  });

  /* Mutations */
  const sendMut = useMutation({
    mutationFn: ({ convId, content }) =>
      axios.post(`${API_URL}/api/messaging/conversations/${convId}/messages`,
        { content, message_type:'text', priority:'normal' }, { headers:authH }),
    onSuccess: () => {
      qc.invalidateQueries(['messages', selectedConv?.id]);
      qc.invalidateQueries(['conversations']);
      setNewMessage('');
    },
    onError: e => toast.error(e.response?.data?.detail || 'Failed to send'),
  });

  const startMut = useMutation({
    mutationFn: ({ recipientId, initialMessage, conversationType, participantIds }) => {
      const payload = { conversation_type:conversationType||'private', initial_message:initialMessage };
      if (conversationType === 'group') payload.participant_ids = participantIds;
      else payload.recipient_id = recipientId;
      return axios.post(`${API_URL}/api/messaging/conversations/start`, payload, { headers:authH });
    },
    onSuccess: (res) => {
      qc.invalidateQueries(['conversations']);
      setShowNewChat(false); setShowNewGroup(false);
      setSelectedParts([]); setGroupName('');
      setActiveTab('chats');
      // After conversation list refreshes, select the new conv
      const convId = res.data.conversation_id;
      setTimeout(() => {
        qc.refetchQueries(['conversations']).then(() => {
          const list = qc.getQueryData(['conversations'])?.conversations || [];
          const found = list.find(c => c.id === convId);
          if (found) setSelectedConv(found);
        });
      }, 400);
    },
    onError: e => toast.error(e.response?.data?.detail || 'Failed'),
  });

  /* Auto-scroll */
  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [msgsData]);

  /* When pendingUserId is set AND conversations have loaded → find and open */
  useEffect(() => {
    if (!pendingUserId || !convsData) return;
    const list = convsData?.conversations || [];
    const found = list.find(c =>
      c.participants?.some(p => String(p.id||p.user_id) === String(pendingUserId)) ||
      String(c.other_user_id) === String(pendingUserId)
    );
    if (found) {
      setSelectedConv(found);
      setActiveTab('chats');
      setPendingUserId(null);
    }
  }, [convsData, pendingUserId]);

  /* Handle contact click — open existing conv OR start new one then open */
  const handleContactMessage = useCallback((userId) => {
    const list = convsData?.conversations || [];
    const existing = list.find(c =>
      c.participants?.some(p => p.id === userId || p.user_id === userId)
    );
    if (existing) {
      setSelectedConv(existing);
      setActiveTab('chats');
    } else {
      // Start conversation, then pendingUserId will catch it once list refreshes
      setPendingUserId(userId);
      startMut.mutate({
        recipientId: userId,
        initialMessage: 'Hello! I wanted to reach out to you.',
        conversationType: 'private',
      });
      setActiveTab('chats');
    }
  }, [convsData, startMut]);

  const handleStartChat = useCallback((recipientId) => {
    startMut.mutate({ recipientId, initialMessage:'Hello! I wanted to reach out.', conversationType:'private' });
  }, [startMut]);

  /* Deep-link: care team */
  useEffect(() => {
    if (!location.state?.openCareTeamChat) return;
    const ct = location.state.careTeam;
    if (ct?.clinician?.id) {
      const list = convsData?.conversations || [];
      const existing = list.find(c =>
        c.participants?.some(p => String(p.id||p.user_id) === String(ct.clinician.id))
      );
      if (existing) setSelectedConv(existing);
      else startMut.mutate({ recipientId:Number(ct.clinician.id), initialMessage:'Hello!', conversationType:'private' });
      window.history.replaceState({}, document.title, '/messages');
    }
  }, [location.state, convsData]);

  /* Deep-link: URL ?userId=X or ?conv=ID */
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const uid    = p.get('userId');
    const convId = p.get('conv');   // direct conversation ID link
    const preMsg = p.get('msg');
    if (!convsData) return;
    const list = convsData?.conversations || [];

    // Direct conversation ID link — highest priority
    if (convId) {
      window.history.replaceState({}, document.title, '/messages');
      const found = list.find(c => String(c.id) === String(convId));
      if (found) { setSelectedConv(found); return; }
    }

    if (!uid) return;
    window.history.replaceState({}, document.title, '/messages');
    if (preMsg) setNewMessage(decodeURIComponent(preMsg));
    const existing = list.find(c =>
      c.participants?.some(pr => String(pr.id||pr.user_id) === String(uid)) ||
      String(c.other_user_id) === String(uid)
    );
    if (existing) setSelectedConv(existing);
    else { setPendingUserId(uid); startMut.mutate({ recipientId:Number(uid), initialMessage:preMsg?decodeURIComponent(preMsg):'Hello!', conversationType:'private' }); }
  }, [location.search, convsData]);

  const insertEmoji = (emoji) => {
    const el = inputRef.current;
    if (!el) { setNewMessage(p=>p+emoji); return; }
    const s = el.selectionStart, e2 = el.selectionEnd;
    setNewMessage(p => p.slice(0,s)+emoji+p.slice(e2));
    setTimeout(() => { el.selectionStart = el.selectionEnd = s+emoji.length; el.focus(); }, 0);
    setShowEmoji(false);
  };

  const handleSend = (ev) => {
    ev.preventDefault();
    if (!newMessage.trim() && !attachedFiles.length) return;
    if (!selectedConv) return;
    let content = newMessage.trim();
    if (replyingTo) content = `↩ ${replyingTo.sender?.name||'User'}: "${replyingTo.content.slice(0,60)}${replyingTo.content.length>60?'…':''}"\n\n${content}`;
    sendMut.mutate({ convId:selectedConv.id, content });
    setReplyingTo(null); setShowEmoji(false);
  };

  const handleStartGroup = () => {
    if (selectedParts.length < 2) { toast.error('Select at least 2 participants'); return; }
    startMut.mutate({ participantIds:selectedParts, initialMessage:groupName||'Support Group Chat', conversationType:'group' });
  };

  /* Data */
  const conversations = [...(convsData?.conversations||[])].sort(
    (a,b) => new Date(b.last_message_at||b.created_at||0) - new Date(a.last_message_at||a.created_at||0)
  );
  const messages = [...(msgsData?.messages||[])].sort(
    (a,b) => new Date(a.created_at) - new Date(b.created_at)
  );
  const physicians = physData?.physicians||[];
  const filteredConvs = conversations.filter(c => {
    if (!searchQuery) return true;
    return c.participants[0]?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  /* ── RENDER ── */
  return (
    <div style={{ display:'flex', height:'calc(100vh - 64px)', overflow:'hidden', background:S.pageBg }}>

      {/* ══ SIDEBAR ══ */}
      <div
        className="lg-sidebar"
        style={{
          width:340, minWidth:300, maxWidth:360, flexShrink:0,
          display: selectedConv ? 'none' : 'flex',
          flexDirection:'column',
          background:S.cardBg,
          borderRight:`1px solid ${S.border}`,
        }}
      >
        {/* Header */}
        <div style={{ padding:'16px 14px 12px', borderBottom:`1px solid ${S.border}` }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <h1 style={{ fontSize:17, fontWeight:800, color:S.t900, display:'flex', alignItems:'center', gap:8, margin:0 }}>
              <div style={{ width:30, height:30, borderRadius:9, background:'linear-gradient(135deg,#0d9488,#0891b2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <MessageCircle size={15} style={{ color:'#fff' }}/>
              </div>
              Messages
            </h1>
            <div style={{ display:'flex', gap:6 }}>
              <motion.button whileTap={{ scale:0.9 }} onClick={() => setShowNewChat(true)}
                style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#0d9488,#0891b2)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(13,148,136,0.35)' }}>
                <Plus size={15} style={{ color:'#fff' }}/>
              </motion.button>
              <motion.button whileTap={{ scale:0.9 }} onClick={() => setShowNewGroup(true)}
                style={{ width:32, height:32, borderRadius:9, background:`${S.border}44`, border:`1px solid ${S.border}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:S.t600 }}>
                <Users size={15}/>
              </motion.button>
            </div>
          </div>

          {/* Pill tabs */}
          <div style={{ display:'flex', background:`${S.border}66`, borderRadius:11, padding:3, gap:2, marginBottom:10 }}>
            {[{ id:'chats', label:'Chats', icon:MessageCircle }, { id:'contacts', label:'Contacts', icon:Users }].map(({ id, label, icon:Ic }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                style={{
                  flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                  padding:'7px 10px', borderRadius:8, fontSize:12, fontWeight:700,
                  background: activeTab===id ? S.cardBg : 'transparent',
                  color: activeTab===id ? S.teal : S.t600,
                  border:'none', cursor:'pointer', transition:'all 0.2s',
                  boxShadow: activeTab===id ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
                }}>
                <Ic size={12}/> {label}
              </button>
            ))}
          </div>

          {/* Search */}
          {activeTab === 'chats' && (
            <div style={{ position:'relative' }}>
              <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:S.t500 }}/>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                style={{ width:'100%', paddingLeft:32, paddingRight:10, paddingTop:8, paddingBottom:8, borderRadius:9, border:`1.5px solid ${S.border}`, fontSize:12, color:S.t900, background:S.pageBg, outline:'none', boxSizing:'border-box' }}/>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {activeTab === 'chats' ? (
            <>
              {/* Care team */}
              {careTeam.length > 0 && (
                <div style={{ padding:'10px 12px 0' }}>
                  <p style={{ fontSize:10, fontWeight:800, color:S.amber, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:7, display:'flex', alignItems:'center', gap:5 }}>
                    <Stethoscope size={10}/> Your Care Team
                  </p>
                  {careTeam.map(member => (
                    <button key={member.user_id}
                      onClick={() => handleContactMessage(member.user_id)}
                      style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'7px 9px', borderRadius:10, marginBottom:4, background:`rgba(13,148,136,0.08)`, border:`1.5px solid rgba(13,148,136,0.2)`, cursor:'pointer', textAlign:'left' }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#0d9488,#059669)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:800, flexShrink:0 }}>
                        {member.avatar_initials}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:700, color:S.t900, margin:0 }}>{member.name}</p>
                        <p style={{ fontSize:10, color:S.teal, fontWeight:600, margin:0 }}>{member.relation}</p>
                      </div>
                      <MessageCircle size={12} style={{ color:S.teal, flexShrink:0 }}/>
                    </button>
                  ))}
                  <div style={{ height:1, background:S.border, margin:'10px 0 3px' }}/>
                </div>
              )}

              {/* Conversations */}
              {loadingConvs ? (
                <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
                  <Loader2 size={20} style={{ color:S.teal, animation:'spin 1s linear infinite' }}/>
                </div>
              ) : filteredConvs.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 20px' }}>
                  <div style={{ width:52, height:52, borderRadius:16, background:`${S.border}44`, margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <MessageCircle size={22} style={{ color:S.t500 }}/>
                  </div>
                  <p style={{ fontSize:13, fontWeight:700, color:S.t700 }}>No conversations yet</p>
                  <p style={{ fontSize:11, color:S.amber, marginTop:3 }}>Start a new chat above</p>
                </div>
              ) : (
                [...filteredConvs].sort((a,b) => {
                  const o = { urgent:0, high:1, normal:2 };
                  return (o[classifyUrgency(a.last_message?.content)]||2) - (o[classifyUrgency(b.last_message?.content)]||2);
                }).map(conv => {
                  const other    = conv.participants[0];
                  const isActive = selectedConv?.id === conv.id;
                  const urgency  = classifyUrgency(conv.last_message?.content);
                  const urg      = URG_CFG[urgency];
                  return (
                    <motion.div key={conv.id}
                      initial={{ opacity:0 }} animate={{ opacity:1 }}
                      onClick={() => setSelectedConv(conv)}
                      style={{
                        display:'flex', alignItems:'center', gap:10, padding:'11px 12px',
                        cursor:'pointer', transition:'background 0.12s',
                        background: isActive ? 'rgba(13,148,136,0.08)' : 'transparent',
                        borderLeft:`3px solid ${isActive?'#0d9488':urg.color||'transparent'}`,
                      }}
                      onMouseEnter={e => { if(!isActive) e.currentTarget.style.background=`${S.border}44`; }}
                      onMouseLeave={e => { if(!isActive) e.currentTarget.style.background='transparent'; }}
                    >
                      <div style={{ position:'relative', flexShrink:0 }}>
                        <div style={{ width:42, height:42, borderRadius:'50%', background:gradFor(conv.id), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:13, fontWeight:800, boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
                          {(other?.name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        {urgency !== 'normal' && (
                          <span style={{ position:'absolute', top:-2, right:-2, width:11, height:11, borderRadius:'50%', background:urg.color, border:`2px solid ${S.cardBg}`, animation:urgency==='urgent'?'pulse 2s infinite':'none' }}/>
                        )}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                          <p style={{ fontSize:13, fontWeight:700, color:S.t900, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'65%' }}>
                            {other?.name||'Unknown'}
                          </p>
                          <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                            {conv.unread_count > 0 && (
                              <span style={{ fontSize:9, fontWeight:800, color:'#fff', background:'linear-gradient(135deg,#0d9488,#0891b2)', padding:'1px 5px', borderRadius:999 }}>{conv.unread_count}</span>
                            )}
                            {conv.last_message_at && (
                              <span style={{ fontSize:10, color:S.amber, fontWeight:500 }}>{fmtDate(conv.last_message_at)}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          {urgency !== 'normal' && (
                            <span style={{ fontSize:8, fontWeight:800, padding:'1px 4px', borderRadius:4, background:`${urg.color}22`, color:urg.color, textTransform:'uppercase', flexShrink:0 }}>{urg.label}</span>
                          )}
                          <p style={{ fontSize:11, color:urgency==='urgent'?'#ef4444':urgency==='high'?'#f59e0b':S.t600, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:conv.unread_count>0?600:400 }}>
                            {conv.last_message?.content||'Start a conversation'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </>
          ) : (
            <ContactsTab onContactMessage={handleContactMessage}/>
          )}
        </div>
      </div>

      {/* ══ CHAT PANEL ══ */}
      <div
        className="lg-chat"
        style={{
          flex:1, flexDirection:'column',
          background:S.pageBg,
          display: selectedConv ? 'flex' : 'none',
        }}
      >
        {selectedConv ? (
          <>
            {/* Chat header */}
            <div style={{ padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', background:S.cardBg, borderBottom:`1px solid ${S.border}`, boxShadow:'0 1px 6px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <button onClick={() => setSelectedConv(null)}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:S.t600, display:'flex', alignItems:'center' }}>
                  <ArrowLeft size={18}/>
                </button>
                <div style={{ width:38, height:38, borderRadius:'50%', background:gradFor(selectedConv.id), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:13, fontWeight:800, boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
                  {(selectedConv.participants[0]?.name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize:14, fontWeight:800, color:S.t900, margin:0 }}>{selectedConv.participants[0]?.name||'Unknown'}</p>
                  <p style={{ fontSize:10, color:S.amber, fontWeight:600, margin:0 }}>{selectedConv.participants[0]?.role||'User'} · Active recently</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {[{ Icon:Phone, tip:'Voice call' }, { Icon:Video, tip:'Video call' }, { Icon:MoreVertical, tip:'Options' }].map(({ Icon, tip }) => (
                  <button key={tip} title={tip} onClick={() => toast(`${tip} coming soon`, { icon:'ℹ️' })}
                    style={{ width:34, height:34, borderRadius:9, background:`${S.border}44`, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:S.t600 }}>
                    <Icon size={15}/>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 0', display:'flex', flexDirection:'column', gap:2 }}>
              {messages.map((msg, i) => {
                const isOwn    = msg.sender.id === user.id;
                const isAlert  = msg.message_type === 'alert';
                const time     = fmtTime(msg.created_at);
                const showDate = i===0 || fmtDate(msg.created_at) !== fmtDate(messages[i-1].created_at);
                const isReply  = msg.content?.startsWith('↩ ') && msg.content.includes('\n\n');
                const quote    = isReply ? msg.content.split('\n\n')[0].replace('↩ ','') : null;
                const text     = isReply ? msg.content.split('\n\n').slice(1).join('\n\n') : msg.content;

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div style={{ textAlign:'center', margin:'10px 0', display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ flex:1, height:1, background:S.border }}/>
                        <span style={{ fontSize:10, fontWeight:700, color:S.amber, padding:'2px 10px', background:`${S.border}44`, borderRadius:999 }}>{fmtDate(msg.created_at)}</span>
                        <div style={{ flex:1, height:1, background:S.border }}/>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity:0, y:6, scale:0.97 }}
                      animate={{ opacity:1, y:0, scale:1 }}
                      transition={{ type:'spring', damping:24, stiffness:320 }}
                      style={{ display:'flex', justifyContent:isOwn?'flex-end':'flex-start', marginBottom:5, alignItems:'flex-end', gap:6 }}
                    >
                      {!isOwn && (
                        <div style={{ width:26, height:26, borderRadius:'50%', background:gradFor(selectedConv.id), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:9, fontWeight:800, flexShrink:0 }}>
                          {(msg.sender.name||'?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ maxWidth:'68%', display:'flex', flexDirection:'column', alignItems:isOwn?'flex-end':'flex-start' }}>
                        {isAlert && (
                          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:9, fontWeight:800, color:'#ef4444', background:'rgba(239,68,68,0.1)', padding:'2px 8px', borderRadius:5, marginBottom:3, border:'1px solid rgba(239,68,68,0.2)' }}>
                            CLINICAL ALERT
                          </div>
                        )}
                        <div style={{
                          padding:'9px 13px', position:'relative',
                          borderRadius:isOwn?'16px 16px 4px 16px':'16px 16px 16px 4px',
                          background:isOwn?'linear-gradient(135deg,#0d9488,#0891b2)':S.cardBg,
                          color:isOwn?'#fff':S.t900,
                          boxShadow:isOwn?'0 3px 12px rgba(13,148,136,0.3)':`0 1px 6px rgba(0,0,0,0.07)`,
                          border:isOwn?'none':`1px solid ${S.border}`,
                        }}>
                          {quote && (
                            <div style={{ borderLeft:`2.5px solid ${isOwn?'rgba(255,255,255,0.5)':'#0d9488'}`, paddingLeft:7, marginBottom:5, fontSize:10, color:isOwn?'rgba(255,255,255,0.7)':S.t500, fontStyle:'italic', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                              {quote}
                            </div>
                          )}
                          <p style={{ fontSize:13, lineHeight:1.55, margin:0, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{text}</p>
                          {msg.attachments?.length > 0 && (
                            <div style={{ marginTop:6, display:'flex', flexDirection:'column', gap:3 }}>
                              {msg.attachments.map((f,fi) => (
                                <a key={fi} href={f.url} target="_blank" rel="noopener noreferrer"
                                  style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 8px', borderRadius:7, fontSize:11, fontWeight:600, background:isOwn?'rgba(255,255,255,0.2)':S.border, color:isOwn?'#fff':S.t700, textDecoration:'none' }}>
                                  <Paperclip size={10}/>{f.original_filename||'Attachment'}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:3, marginTop:2, padding:'0 2px' }}>
                          {isOwn && <span style={{ fontSize:9, color:S.amber }}>{msg.is_read?'✓✓':'✓'}</span>}
                          <span style={{ fontSize:9, color:S.amber }}>{time}</span>
                          <button onClick={() => { setReplyingTo(msg); inputRef.current?.focus(); }}
                            style={{ background:'none', border:'none', cursor:'pointer', padding:1, color:S.t500, opacity:0 }}
                            className="reply-btn">
                            <Reply size={10}/>
                          </button>
                        </div>
                      </div>
                      {isOwn && (
                        <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#0d9488,#059669)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:9, fontWeight:800, flexShrink:0 }}>
                          {(user.full_name||'Me').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </motion.div>
                  </div>
                );
              })}
              <div ref={msgEnd} style={{ height:16 }}/>
            </div>

            {/* Input area */}
            <form onSubmit={handleSend} style={{ background:S.cardBg, borderTop:`1px solid ${S.border}`, padding:'10px 14px' }}>
              <AnimatePresence>
                {replyingTo && (
                  <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                    style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 10px', background:'rgba(13,148,136,0.08)', borderRadius:9, marginBottom:8, border:'1px solid rgba(13,148,136,0.2)' }}>
                    <Reply size={12} style={{ color:S.teal, flexShrink:0 }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:9, fontWeight:800, color:S.teal, margin:0 }}>{replyingTo.sender?.name}</p>
                      <p style={{ fontSize:11, color:S.t600, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{replyingTo.content?.slice(0,80)}</p>
                    </div>
                    <button type="button" onClick={() => setReplyingTo(null)} style={{ background:'none', border:'none', cursor:'pointer', color:S.t500 }}><X size={13}/></button>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                    style={{ background:S.pageBg, borderRadius:10, marginBottom:8, padding:8, border:`1px solid ${S.border}`, overflow:'hidden' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(10,1fr)', gap:3 }}>
                      {EMOJI_GRID.map(e => (
                        <button key={e} type="button" onClick={() => insertEmoji(e)}
                          style={{ width:30, height:30, borderRadius:7, border:'none', background:'none', cursor:'pointer', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {showFileUpload && (
                <div style={{ background:S.pageBg, borderRadius:10, padding:10, marginBottom:8, border:`1px solid ${S.border}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:S.t800, margin:0 }}>Attach Files</p>
                    <button type="button" onClick={() => { setShowFileUpload(false); setAttachedFiles([]); }} style={{ background:'none', border:'none', cursor:'pointer', color:S.t500 }}><X size={13}/></button>
                  </div>
                  <FileUpload category="messages" relatedId={selectedConv?.id}
                    onUploadComplete={(files) => { setAttachedFiles(files); toast.success(`${files.length} file(s) attached`); }}
                    accept="image/*,video/*,application/pdf,.doc,.docx" multiple maxSizeMB={50}/>
                </div>
              )}

              <div style={{ display:'flex', alignItems:'flex-end', gap:7 }}>
                <button type="button" onClick={() => setShowEmoji(s=>!s)}
                  style={{ width:36, height:36, borderRadius:9, border:'none', cursor:'pointer', flexShrink:0, background:showEmojiPicker?'rgba(13,148,136,0.12)':S.pageBg, color:showEmojiPicker?S.teal:S.t600, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Smile size={17}/>
                </button>
                <button type="button" onClick={() => setShowFileUpload(s=>!s)}
                  style={{ width:36, height:36, borderRadius:9, border:'none', cursor:'pointer', flexShrink:0, background:showFileUpload?'rgba(13,148,136,0.12)':S.pageBg, color:showFileUpload?S.teal:S.t600, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Paperclip size={17}/>
                </button>
                <textarea ref={inputRef} value={newMessage} rows={1}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }}}
                  placeholder="Type a message… (Enter to send)"
                  style={{ flex:1, border:`1.5px solid ${S.border}`, borderRadius:11, padding:'9px 12px', fontSize:13, color:S.t900, background:S.pageBg, outline:'none', resize:'none', maxHeight:72, overflowY:'auto', lineHeight:1.5, transition:'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor='#0d9488'}
                  onBlur={e => e.target.style.borderColor=`var(--card-border)`}
                />
                <motion.button type="submit" whileTap={{ scale:0.9 }}
                  disabled={(!newMessage.trim() && !attachedFiles.length) || sendMut.isPending}
                  style={{
                    width:40, height:40, borderRadius:11, border:'none', cursor:'pointer', flexShrink:0,
                    background: (!newMessage.trim() && !attachedFiles.length)?`${S.border}66`:'linear-gradient(135deg,#0d9488,#0891b2)',
                    color: (!newMessage.trim() && !attachedFiles.length)?S.t500:'#fff',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow: (!newMessage.trim() && !attachedFiles.length)?'none':'0 3px 12px rgba(13,148,136,0.35)',
                    transition:'all 0.15s',
                  }}>
                  {sendMut.isPending ? <Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/> : <Send size={16}/>}
                </motion.button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', padding:40, textAlign:'center' }}>
            <div style={{ width:72, height:72, borderRadius:22, background:`rgba(13,148,136,0.1)`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
              <MessageCircle size={32} style={{ color:S.teal }}/>
            </div>
            <h2 style={{ fontSize:18, fontWeight:800, color:S.t900, marginBottom:8 }}>Your Messages</h2>
            <p style={{ fontSize:13, color:S.amber, maxWidth:300, lineHeight:1.6 }}>
              Select a conversation from the sidebar or start a new chat.
            </p>
            <button onClick={() => setShowNewChat(true)}
              style={{ marginTop:18, padding:'11px 22px', borderRadius:11, fontSize:13, fontWeight:700, background:'linear-gradient(135deg,#0d9488,#0891b2)', color:'#fff', border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(13,148,136,0.35)', display:'flex', alignItems:'center', gap:7 }}>
              <Plus size={13}/> New Conversation
            </button>
          </div>
        )}
      </div>

      {/* Desktop: always show both */}
      <style>{`
        @media (min-width:1024px) {
          .lg-sidebar { display:flex !important; width:340px !important; }
          .lg-chat    { display:flex !important; }
        }
        .msg-bubble-group:hover .reply-btn { opacity:1 !important; }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>

      {/* ── New Chat Modal ── */}
      <Modal isOpen={showNewChat} onClose={() => { setShowNewChat(false); setNewChatSearch(''); }}
        title="New Message" icon={MessageCircle} accent="teal" size="sm">
        <div style={{ position:'relative', marginBottom:10 }}>
          <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:S.t500 }}/>
          <input autoFocus value={newChatSearch} onChange={e => setNewChatSearch(e.target.value)}
            placeholder="Search by name or role..."
            style={{ width:'100%', paddingLeft:32, paddingRight:10, paddingTop:8, paddingBottom:8, borderRadius:9, border:`1.5px solid ${S.border}`, fontSize:12, color:S.t900, background:S.cardBg, outline:'none', boxSizing:'border-box' }}/>
        </div>
        <div style={{ maxHeight:260, overflowY:'auto', display:'flex', flexDirection:'column', gap:3 }}>
          {physicians.filter(p => !newChatSearch || p.name.toLowerCase().includes(newChatSearch.toLowerCase()) || p.role.toLowerCase().includes(newChatSearch.toLowerCase())).map(person => (
            <button key={person.id} onClick={() => { handleStartChat(person.id); setNewChatSearch(''); }}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:10, background:'none', border:'none', cursor:'pointer', textAlign:'left', transition:'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background=`${S.border}44`}
              onMouseLeave={e => e.currentTarget.style.background='none'}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:gradFor(person.id), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:800, flexShrink:0 }}>
                {person.name[0]}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:700, color:S.t900, margin:0 }}>{person.name}</p>
                <p style={{ fontSize:10, color:S.amber, margin:0 }}>{person.role}</p>
              </div>
            </button>
          ))}
          {physicians.length === 0 && (
            <div style={{ textAlign:'center', padding:'28px 0', color:S.t500 }}>
              <Users size={28} style={{ margin:'0 auto 7px', display:'block', color:S.border }}/>
              <p style={{ fontSize:12 }}>No users available</p>
            </div>
          )}
        </div>
      </Modal>

      {/* ── New Group Modal ── */}
      <Modal isOpen={showNewGroup} onClose={() => { setShowNewGroup(false); setSelectedParts([]); setGroupName(''); }}
        title="Create Group Chat" size="lg"
        footerContent={<ModalFooter>
          <button onClick={() => { setShowNewGroup(false); setSelectedParts([]); setGroupName(''); }}
            style={{ padding:'9px 18px', borderRadius:9, fontSize:12, fontWeight:700, background:S.pageBg, color:S.t600, border:`1.5px solid ${S.border}`, cursor:'pointer' }}>
            Cancel
          </button>
          <button onClick={handleStartGroup} disabled={selectedParts.length < 2 || startMut.isPending}
            style={{ padding:'9px 18px', borderRadius:9, fontSize:12, fontWeight:700, background:'linear-gradient(135deg,#0891b2,#1d4ed8)', color:'#fff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:5, opacity:selectedParts.length<2?0.5:1 }}>
            {startMut.isPending ? <><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> Creating...</> : <><Users size={13}/> Create Group</>}
          </button>
        </ModalFooter>}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:S.t700, display:'block', marginBottom:5 }}>Group Name (optional)</label>
            <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Cancer Support Team"
              style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${S.border}`, fontSize:12, color:S.t900, outline:'none', boxSizing:'border-box', background:S.cardBg }}/>
          </div>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:S.t700, marginBottom:7 }}>Select participants (min. 2) · <span style={{ color:S.teal }}>{selectedParts.length} selected</span></p>
            <div style={{ maxHeight:200, overflowY:'auto', display:'flex', flexDirection:'column', gap:3 }}>
              {physicians.map(p => (
                <button key={p.id} onClick={() => setSelectedParts(prev => prev.includes(p.id)?prev.filter(i=>i!==p.id):[...prev,p.id])}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:10, border:`1.5px solid ${selectedParts.includes(p.id)?'#0d9488':S.border}`, background:selectedParts.includes(p.id)?'rgba(13,148,136,0.08)':S.cardBg, cursor:'pointer', textAlign:'left', transition:'all 0.12s' }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:gradFor(p.id), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:800, flexShrink:0 }}>{p.name[0]}</div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:12, fontWeight:700, color:S.t900, margin:0 }}>{p.name}</p>
                    <p style={{ fontSize:10, color:S.amber, margin:0 }}>{p.role}</p>
                  </div>
                  {selectedParts.includes(p.id) && <div style={{ width:20, height:20, borderRadius:'50%', background:'#0d9488', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:800, flexShrink:0 }}>✓</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
