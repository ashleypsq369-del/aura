/**
 * Messages — Premium messaging interface
 * WhatsApp / iMessage / Slack inspired layout
 * - Glass sidebar with avatar list + urgency badges
 * - Clean message bubbles with tails, timestamps, read receipts
 * - Premium pill tabs (Chats / Contacts)
 * - Emoji picker, file attach, reply strip
 * - Real-time via WebSocket
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Search, Users, AlertCircle, Plus,
  MessageCircle, UserPlus, Loader2, MessagesSquare, Paperclip, X,
  Zap, AlertTriangle, Stethoscope, Phone, Video, Smile, Reply,
  ChevronLeft, ChevronRight, MoreVertical, Check, CheckCheck,
  ArrowLeft,
} from 'lucide-react';
import axios from 'axios';
import toast from '../utils/toast';
import ContactsTab from '../components/ContactsTab';
import FileUpload from '../components/FileUpload';
import Modal, { ModalFooter } from '../components/Modal';
import { useWS } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../api/client';

/* ── Emoji grid ── */
const EMOJI_GRID = [
  '😊','😂','🥰','😢','😮','🙏','❤️','💪','🤗','🫂',
  '🌟','🔥','🙌','💙','💚','💛','💜','🤍','👍','👏',
  '🫶','💝','🕊️','🌿','🍃','🌻','✨','🎉','🤲','😎',
  '🫀','💖','😌','🤒','💊','🏥','🩺','🩹','☀️','🌈',
];

/* ── Urgency classifier ── */
const URGENT_KW = ['urgent','emergency','critical','asap','help','pain','crisis','severe','dying','bleeding','fell','unconscious','chest','breathing','vomiting','seizure','confused','fever','unresponsive'];
const HIGH_KW   = ['worried','concerned','worse','worsening','medication','missed','dose','nausea','side effect','appointment','cancel'];
function classifyUrgency(text) {
  if (!text) return 'normal';
  const t = text.toLowerCase();
  if (URGENT_KW.some(k => t.includes(k))) return 'urgent';
  if (HIGH_KW.some(k => t.includes(k))) return 'high';
  return 'normal';
}

const URGENCY = {
  urgent: { color:'#ef4444', bg:'#fef2f2', label:'URGENT' },
  high:   { color:'#f59e0b', bg:'#fffbeb', label:'HIGH'   },
  normal: { color:null, bg:null, label:null },
};

/* ── Avatar gradient pool ── */
const GRAD = [
  'linear-gradient(135deg,#0d9488,#0891b2)',
  'linear-gradient(135deg,#7c3aed,#4338ca)',
  'linear-gradient(135deg,#db2777,#e11d48)',
  'linear-gradient(135deg,#059669,#0d9488)',
  'linear-gradient(135deg,#1d4ed8,#0891b2)',
  'linear-gradient(135deg,#d97706,#ea580c)',
];
const gradFor = (id) => GRAD[(id||0) % GRAD.length];

/* ── Time formatter ── */
const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
const fmtDate = (d) => {
  const dt = new Date(d);
  const today = new Date();
  if (dt.toDateString() === today.toDateString()) return 'Today';
  const yest = new Date(today); yest.setDate(yest.getDate()-1);
  if (dt.toDateString() === yest.toDateString()) return 'Yesterday';
  return dt.toLocaleDateString('en-GB', { day:'numeric', month:'short' });
};

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
export default function Messages() {
  const { user } = useAuth();
  const [activeTab, setActiveTab]                 = useState('chats');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage]               = useState('');
  const [searchQuery, setSearchQuery]             = useState('');
  const [showNewChat, setShowNewChat]             = useState(false);
  const [showNewGroup, setShowNewGroup]           = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [groupName, setGroupName]                 = useState('');
  const [showFileUpload, setShowFileUpload]       = useState(false);
  const [attachedFiles, setAttachedFiles]         = useState([]);
  const [newChatSearch, setNewChatSearch]         = useState('');
  const [showEmojiPicker, setShowEmojiPicker]     = useState(false);
  const [replyingTo, setReplyingTo]               = useState(null);
  const inputRef     = useRef(null);
  const messagesEnd  = useRef(null);
  const qc           = useQueryClient();
  const { subscribe } = useWS();
  const location     = useLocation();

  /* WS invalidation */
  useEffect(() => {
    const unsub = subscribe('new_message', (data) => {
      qc.invalidateQueries({ queryKey:['conversations'] });
      if (data.conversation_id === selectedConversation?.id)
        qc.invalidateQueries({ queryKey:['messages', data.conversation_id] });
    });
    return unsub;
  }, [subscribe, qc, selectedConversation]);

  const authH = { Authorization:`Bearer ${localStorage.getItem('auth_token')}` };

  const { data: careTeamData } = useQuery({
    queryKey:['my-care-team'],
    queryFn: () => axios.get(`${API_URL}/api/messaging/my-care-team`, { headers:authH }).then(r=>r.data),
    staleTime:5*60*1000,
  });
  const careTeam = careTeamData?.care_team || [];

  const { data: convsData, isLoading:loadingConvs } = useQuery({
    queryKey:['conversations'],
    queryFn: () => axios.get(`${API_URL}/api/messaging/conversations`, { headers:authH }).then(r=>r.data),
    refetchInterval:60000,
  });

  const { data: msgsData } = useQuery({
    queryKey:['messages', selectedConversation?.id],
    queryFn: () => selectedConversation
      ? axios.get(`${API_URL}/api/messaging/conversations/${selectedConversation.id}/messages`, { headers:authH }).then(r=>r.data)
      : { messages:[] },
    enabled:!!selectedConversation,
    refetchInterval:30000,
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
      qc.invalidateQueries(['messages', selectedConversation?.id]);
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
      toast.success(res.data.type==='group' ? 'Group created!' : 'Conversation started!');
      setShowNewChat(false); setShowNewGroup(false);
      setSelectedParticipants([]); setGroupName('');
      const convId = res.data.conversation_id;
      setTimeout(() => {
        qc.refetchQueries(['conversations']).then(() => {
          const c = qc.getQueryData(['conversations'])?.conversations?.find(c=>c.id===convId);
          if (c) setSelectedConversation(c);
        });
      }, 400);
    },
    onError: e => toast.error(e.response?.data?.detail || 'Failed'),
  });

  /* Auto-scroll */
  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [msgsData]);

  const handleStartChat = useCallback((recipientId) => {
    startMut.mutate({ recipientId, initialMessage:'Hello! I wanted to reach out to you.', conversationType:'private' });
  }, [startMut]);

  /* Care team deep-link */
  useEffect(() => {
    if (!location.state?.openCareTeamChat) return;
    const ct = location.state.careTeam;
    if (ct?.clinician?.id) {
      const existing = convsData?.conversations?.find(c =>
        c.participants?.some(p => String(p.id||p.user_id) === String(ct.clinician.id))
      );
      if (existing) setSelectedConversation(existing);
      else startMut.mutate({ recipientId:Number(ct.clinician.id), initialMessage:'Hello!', conversationType:'private' });
      window.history.replaceState({}, document.title, '/messages');
    }
  }, [location.state, convsData]);

  /* URL params deep-link */
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const uid = p.get('userId'); const preMsg = p.get('msg');
    if (!uid || !convsData) return;
    window.history.replaceState({}, document.title, '/messages');
    if (preMsg) setNewMessage(decodeURIComponent(preMsg));
    const existing = convsData?.conversations?.find(c =>
      c.participants?.some(pr => String(pr.id||pr.user_id) === String(uid)) ||
      String(c.other_user_id) === String(uid)
    );
    if (existing) setSelectedConversation(existing);
    else startMut.mutate({ recipientId:Number(uid), initialMessage:preMsg?decodeURIComponent(preMsg):'Hello!', conversationType:'private' });
  }, [location.search, convsData]);

  const insertEmoji = (emoji) => {
    const el = inputRef.current;
    if (!el) { setNewMessage(p=>p+emoji); return; }
    const s = el.selectionStart, e = el.selectionEnd;
    setNewMessage(p => p.slice(0,s)+emoji+p.slice(e));
    setTimeout(() => { el.selectionStart = el.selectionEnd = s+emoji.length; el.focus(); }, 0);
    setShowEmojiPicker(false);
  };

  const handleSend = (ev) => {
    ev.preventDefault();
    if (!newMessage.trim() && !attachedFiles.length) return;
    if (!selectedConversation) return;
    let content = newMessage.trim();
    if (replyingTo) content = `↩ ${replyingTo.sender?.name||'User'}: "${replyingTo.content.slice(0,60)}${replyingTo.content.length>60?'…':''}"\n\n${content}`;
    sendMut.mutate({ convId:selectedConversation.id, content });
    setReplyingTo(null); setShowEmojiPicker(false);
  };

  const handleStartGroup = () => {
    if (selectedParticipants.length < 2) { toast.error('Select at least 2 participants'); return; }
    startMut.mutate({ participantIds:selectedParticipants, initialMessage:groupName||'Support Group Chat', conversationType:'group' });
  };

  /* Data */
  const conversations = [...(convsData?.conversations||[])].sort(
    (a,b) => new Date(b.last_message_at||b.created_at||0) - new Date(a.last_message_at||a.created_at||0)
  );
  const messages = [...(msgsData?.messages||[])].sort(
    (a,b) => new Date(a.created_at) - new Date(b.created_at)
  );
  const physicians     = physData?.physicians||[];
  const communityGroups = groupsData?.groups||[];
  const filteredConvs  = conversations.filter(c => {
    if (!searchQuery) return true;
    return c.participants[0]?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  /* ────────────────────────────────────────────
     RENDER
  ──────────────────────────────────────────── */
  return (
    <div style={{ display:'flex', height:'calc(100vh - 64px)', overflow:'hidden', background:'var(--page-bg)' }}>

      {/* ════════════ SIDEBAR ════════════ */}
      <div style={{
        width:340, minWidth:300, maxWidth:360, flexShrink:0,
        display: selectedConversation ? 'none' : 'flex',
        flexDirection:'column',
        background:'#ffffff',
        borderRight:'1px solid #f1f5f9',
        boxShadow:'2px 0 16px rgba(0,0,0,0.04)',
      }}
        className="lg-sidebar"
      >
        {/* Sidebar header */}
        <div style={{ padding:'18px 16px 12px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <h1 style={{ fontSize:18, fontWeight:800, color:'#0f172a', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#0d9488,#0891b2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <MessageCircle size={16} style={{ color:'#fff' }}/>
              </div>
              Messages
            </h1>
            <div style={{ display:'flex', gap:6 }}>
              <motion.button whileTap={{ scale:0.9 }} onClick={() => setShowNewChat(true)}
                style={{
                  width:34, height:34, borderRadius:10,
                  background:'linear-gradient(135deg,#0d9488,#0891b2)',
                  border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 2px 8px rgba(13,148,136,0.35)',
                }}>
                <Plus size={16} style={{ color:'#fff' }}/>
              </motion.button>
              <motion.button whileTap={{ scale:0.9 }} onClick={() => setShowNewGroup(true)}
                style={{
                  width:34, height:34, borderRadius:10,
                  background:'#f1f5f9', border:'none', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b',
                }}>
                <Users size={16}/>
              </motion.button>
            </div>
          </div>

          {/* Premium pill tabs */}
          <div style={{ display:'flex', background:'#f1f5f9', borderRadius:12, padding:3, gap:2, marginBottom:12 }}>
            {[
              { id:'chats',    label:'Chats',    icon:MessageCircle },
              { id:'contacts', label:'Contacts', icon:Users },
            ].map(({ id, label, icon:Ic }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                style={{
                  flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  padding:'8px 12px', borderRadius:9, fontSize:12, fontWeight:700,
                  background: activeTab===id ? '#fff' : 'transparent',
                  color: activeTab===id ? '#0d9488' : '#64748b',
                  border:'none', cursor:'pointer', transition:'all 0.2s',
                  boxShadow: activeTab===id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                }}>
                <Ic size={13}/> {label}
              </button>
            ))}
          </div>

          {/* Search */}
          {activeTab === 'chats' && (
            <div style={{ position:'relative' }}>
              <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                style={{
                  width:'100%', paddingLeft:34, paddingRight:12, paddingTop:9, paddingBottom:9,
                  borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:13, color:'#0f172a',
                  background:'#f8fafc', outline:'none', boxSizing:'border-box',
                }}/>
            </div>
          )}
        </div>

        {/* Sidebar content */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {activeTab === 'chats' ? (
            <>
              {/* Care team pinned */}
              {careTeam.length > 0 && (
                <div style={{ padding:'12px 14px 0' }}>
                  <p style={{ fontSize:10, fontWeight:800, color:'#94a3b8', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
                    <Stethoscope size={11}/> Your Care Team
                  </p>
                  {careTeam.map(member => (
                    <button key={member.user_id}
                      onClick={() => {
                        if (member.existing_conversation_id) {
                          const c = conversations.find(c => c.id === member.existing_conversation_id);
                          if (c) { setSelectedConversation(c); return; }
                        }
                        startMut.mutate({ recipientId:member.user_id, initialMessage:'Hello!', conversationType:'private' });
                      }}
                      style={{
                        width:'100%', display:'flex', alignItems:'center', gap:10,
                        padding:'8px 10px', borderRadius:12, marginBottom:4,
                        background:'#f0fdfa', border:'1.5px solid #ccfbf1',
                        cursor:'pointer', textAlign:'left', transition:'all 0.15s',
                      }}>
                      <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#0d9488,#059669)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:800, flexShrink:0 }}>
                        {member.avatar_initials}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:0 }}>{member.name}</p>
                        <p style={{ fontSize:10, color:'#0d9488', fontWeight:600, margin:0 }}>{member.relation}</p>
                      </div>
                      <MessageCircle size={13} style={{ color:'#0d9488', flexShrink:0 }}/>
                    </button>
                  ))}
                  <div style={{ height:1, background:'#f1f5f9', margin:'12px 0 4px' }}/>
                </div>
              )}

              {/* Conversations list */}
              {loadingConvs ? (
                <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
                  <Loader2 size={22} style={{ color:'#0d9488', animation:'spin 1s linear infinite' }}/>
                </div>
              ) : filteredConvs.length === 0 ? (
                <div style={{ textAlign:'center', padding:'48px 24px' }}>
                  <div style={{ width:60, height:60, borderRadius:20, background:'#f1f5f9', margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <MessageCircle size={26} style={{ color:'#cbd5e1' }}/>
                  </div>
                  <p style={{ fontSize:14, fontWeight:700, color:'#475569' }}>No conversations yet</p>
                  <p style={{ fontSize:12, color:'#94a3b8', marginTop:4 }}>Start a new chat above</p>
                </div>
              ) : (
                [...filteredConvs].sort((a,b) => {
                  const o = { urgent:0, high:1, normal:2 };
                  return (o[classifyUrgency(a.last_message?.content)]||2) - (o[classifyUrgency(b.last_message?.content)]||2);
                }).map(conv => {
                  const other    = conv.participants[0];
                  const isActive = selectedConversation?.id === conv.id;
                  const urgency  = classifyUrgency(conv.last_message?.content);
                  const urg      = URGENCY[urgency];
                  return (
                    <motion.div key={conv.id}
                      initial={{ opacity:0 }} animate={{ opacity:1 }}
                      onClick={() => setSelectedConversation(conv)}
                      style={{
                        display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                        cursor:'pointer', transition:'background 0.15s',
                        background: isActive ? '#f0fdfa' : urgency==='urgent' ? '#fff5f5' : 'transparent',
                        borderLeft:`3px solid ${isActive ? '#0d9488' : urgency==='urgent' ? '#ef4444' : urgency==='high' ? '#f59e0b' : 'transparent'}`,
                      }}
                      onMouseEnter={e => { if(!isActive) e.currentTarget.style.background='#f8fafc'; }}
                      onMouseLeave={e => { if(!isActive) e.currentTarget.style.background=urgency==='urgent'?'#fff5f5':'transparent'; }}
                    >
                      {/* Avatar */}
                      <div style={{ position:'relative', flexShrink:0 }}>
                        <div style={{
                          width:44, height:44, borderRadius:'50%',
                          background: gradFor(conv.id),
                          display:'flex', alignItems:'center', justifyContent:'center',
                          color:'#fff', fontSize:14, fontWeight:800,
                          boxShadow:'0 2px 8px rgba(0,0,0,0.12)',
                        }}>
                          {(other?.name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        {urgency !== 'normal' && (
                          <span style={{
                            position:'absolute', top:-2, right:-2, width:12, height:12,
                            borderRadius:'50%', background:urg.color, border:'2px solid #fff',
                            animation: urgency==='urgent' ? 'pulse 2s infinite' : 'none',
                          }}/>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                          <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:0, maxWidth:'70%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {other?.name||'Unknown'}
                          </p>
                          <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                            {conv.unread_count > 0 && (
                              <span style={{
                                fontSize:10, fontWeight:800, color:'#fff',
                                background:'linear-gradient(135deg,#0d9488,#0891b2)',
                                padding:'1px 6px', borderRadius:999,
                              }}>{conv.unread_count}</span>
                            )}
                            {conv.last_message_at && (
                              <span style={{ fontSize:10, color:'#94a3b8', fontWeight:500 }}>
                                {fmtDate(conv.last_message_at)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          {urgency !== 'normal' && (
                            <span style={{
                              fontSize:9, fontWeight:800, padding:'1px 5px', borderRadius:4,
                              background:urg.bg, color:urg.color, textTransform:'uppercase', flexShrink:0,
                            }}>{urg.label}</span>
                          )}
                          <p style={{
                            fontSize:12, color: urgency==='urgent'?'#ef4444':urgency==='high'?'#d97706':'#64748b',
                            margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                            fontWeight: conv.unread_count > 0 ? 600 : 400,
                          }}>
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
            <ContactsTab onContactMessage={(userId) => {
              const c = conversations.find(c => c.participants.some(p=>p.id===userId));
              if (c) { setSelectedConversation(c); setActiveTab('chats'); }
              else { handleStartChat(userId); setActiveTab('chats'); }
            }}/>
          )}
        </div>
      </div>

      {/* ════════════ CHAT PANEL ════════════ */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        background:'#f8fafc',
        display: selectedConversation ? 'flex' : 'none',
      }}
        className="lg-chat"
      >
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div style={{
              padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between',
              background:'#ffffff', borderBottom:'1px solid #f1f5f9',
              boxShadow:'0 1px 8px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                {/* Back button mobile */}
                <button onClick={() => setSelectedConversation(null)}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'#64748b', display:'flex', alignItems:'center' }}>
                  <ArrowLeft size={20}/>
                </button>
                {/* Avatar */}
                <div style={{
                  width:42, height:42, borderRadius:'50%',
                  background: gradFor(selectedConversation.id),
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#fff', fontSize:15, fontWeight:800,
                  boxShadow:'0 2px 8px rgba(0,0,0,0.12)',
                }}>
                  {(selectedConversation.participants[0]?.name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize:14, fontWeight:800, color:'#0f172a', margin:0 }}>
                    {selectedConversation.participants[0]?.name||'Unknown'}
                  </p>
                  <p style={{ fontSize:11, color:'#0d9488', fontWeight:600, margin:0 }}>
                    {selectedConversation.participants[0]?.role||'User'} · Active recently
                  </p>
                </div>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {[
                  { Icon:Phone, tip:'Voice call (coming soon)' },
                  { Icon:Video, tip:'Video call (coming soon)' },
                  { Icon:MoreVertical, tip:'Options' },
                ].map(({ Icon, tip }) => (
                  <button key={tip} title={tip} onClick={() => toast(`${tip}`, { icon:'ℹ️' })}
                    style={{
                      width:36, height:36, borderRadius:10, background:'#f8fafc',
                      border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                      color:'#64748b', transition:'all 0.15s',
                    }}>
                    <Icon size={16}/>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages area */}
            <div style={{ flex:1, overflowY:'auto', padding:'20px 20px 0', display:'flex', flexDirection:'column', gap:4 }}>
              {messages.map((msg, i) => {
                const isOwn   = msg.sender.id === user.id;
                const isAlert = msg.message_type === 'alert';
                const time    = fmtTime(msg.created_at);
                const showDate = i === 0 || fmtDate(msg.created_at) !== fmtDate(messages[i-1].created_at);

                const isReply = msg.content?.startsWith('↩ ') && msg.content.includes('\n\n');
                const replyQuote = isReply ? msg.content.split('\n\n')[0].replace('↩ ','') : null;
                const mainText   = isReply ? msg.content.split('\n\n').slice(1).join('\n\n') : msg.content;

                return (
                  <div key={msg.id}>
                    {/* Date divider */}
                    {showDate && (
                      <div style={{ textAlign:'center', margin:'12px 0', display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ flex:1, height:1, background:'#e2e8f0' }}/>
                        <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8', padding:'2px 12px', background:'#f1f5f9', borderRadius:999 }}>
                          {fmtDate(msg.created_at)}
                        </span>
                        <div style={{ flex:1, height:1, background:'#e2e8f0' }}/>
                      </div>
                    )}

                    <motion.div
                      initial={{ opacity:0, y:8, scale:0.97 }}
                      animate={{ opacity:1, y:0, scale:1 }}
                      transition={{ type:'spring', damping:24, stiffness:320 }}
                      style={{ display:'flex', justifyContent: isOwn?'flex-end':'flex-start', marginBottom:6, alignItems:'flex-end', gap:8 }}
                    >
                      {/* Other user avatar */}
                      {!isOwn && (
                        <div style={{
                          width:28, height:28, borderRadius:'50%',
                          background: gradFor(selectedConversation.id),
                          display:'flex', alignItems:'center', justifyContent:'center',
                          color:'#fff', fontSize:10, fontWeight:800, flexShrink:0,
                        }}>
                          {(msg.sender.name||'?').charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div style={{ maxWidth:'68%', display:'flex', flexDirection:'column', alignItems: isOwn?'flex-end':'flex-start' }}>
                        {/* Alert banner */}
                        {isAlert && (
                          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:10, fontWeight:800, color:'#ef4444', background:'#fef2f2', padding:'3px 10px', borderRadius:6, marginBottom:4, border:'1px solid #fecaca' }}>
                            <AlertCircle size={11}/> CLINICAL ALERT
                          </div>
                        )}

                        {/* Bubble */}
                        <div
                          className="msg-bubble-group"
                          style={{
                            padding:'10px 14px', position:'relative',
                            borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: isOwn
                              ? 'linear-gradient(135deg,#0d9488,#0891b2)'
                              : isAlert ? '#fef2f2' : '#ffffff',
                            color: isOwn ? '#fff' : '#0f172a',
                            boxShadow: isOwn
                              ? '0 4px 12px rgba(13,148,136,0.3)'
                              : '0 2px 8px rgba(0,0,0,0.08)',
                            border: !isOwn ? '1px solid #f1f5f9' : 'none',
                          }}>

                          {/* Reply quote */}
                          {replyQuote && (
                            <div style={{
                              borderLeft:`2.5px solid ${isOwn?'rgba(255,255,255,0.5)':'#0d9488'}`,
                              paddingLeft:8, marginBottom:6, fontSize:11,
                              color: isOwn?'rgba(255,255,255,0.7)':'#64748b',
                              fontStyle:'italic',
                              overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                            }}>
                              {replyQuote}
                            </div>
                          )}

                          <p style={{ fontSize:14, lineHeight:1.55, margin:0, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                            {mainText}
                          </p>

                          {/* Attachments */}
                          {msg.attachments?.length > 0 && (
                            <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:4 }}>
                              {msg.attachments.map((f,fi) => (
                                <a key={fi} href={f.url} target="_blank" rel="noopener noreferrer"
                                  style={{
                                    display:'flex', alignItems:'center', gap:6, padding:'6px 10px',
                                    borderRadius:8, fontSize:12, fontWeight:600,
                                    background: isOwn?'rgba(255,255,255,0.2)':'#f1f5f9',
                                    color: isOwn?'#fff':'#334155', textDecoration:'none',
                                  }}>
                                  <Paperclip size={11}/> {f.original_filename||'Attachment'}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Time + status + reply action */}
                        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:3, padding:'0 2px' }}>
                          {isOwn && <span style={{ fontSize:10, color:'#94a3b8' }}>{msg.is_read ? '✓✓' : '✓'}</span>}
                          <span style={{ fontSize:10, color:'#94a3b8' }}>{time}</span>
                          <button onClick={() => { setReplyingTo(msg); inputRef.current?.focus(); }}
                            style={{ background:'none', border:'none', cursor:'pointer', padding:2, color:'#cbd5e1', transition:'color 0.15s', opacity:0 }}
                            className="reply-btn">
                            <Reply size={11}/>
                          </button>
                        </div>
                      </div>

                      {/* Own avatar */}
                      {isOwn && (
                        <div style={{
                          width:28, height:28, borderRadius:'50%',
                          background:'linear-gradient(135deg,#0d9488,#059669)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          color:'#fff', fontSize:10, fontWeight:800, flexShrink:0,
                        }}>
                          {(user.full_name||'Me').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </motion.div>
                  </div>
                );
              })}
              <div ref={messagesEnd} style={{ height:20 }}/>
            </div>

            {/* ── Input area ── */}
            <form onSubmit={handleSend} style={{ background:'#fff', borderTop:'1px solid #f1f5f9', padding:'12px 16px' }}>

              {/* Reply strip */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#f0fdfa', borderRadius:10, marginBottom:10, border:'1px solid #ccfbf1' }}>
                    <Reply size={13} style={{ color:'#0d9488', flexShrink:0 }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:10, fontWeight:800, color:'#0d9488', margin:0 }}>{replyingTo.sender?.name}</p>
                      <p style={{ fontSize:12, color:'#64748b', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{replyingTo.content?.slice(0,80)}</p>
                    </div>
                    <button type="button" onClick={() => setReplyingTo(null)}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:2 }}>
                      <X size={14}/>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Emoji picker */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                    style={{ background:'#f8fafc', borderRadius:12, marginBottom:10, padding:10, border:'1px solid #e2e8f0', overflow:'hidden' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(10,1fr)', gap:4 }}>
                      {EMOJI_GRID.map(e => (
                        <button key={e} type="button" onClick={() => insertEmoji(e)}
                          style={{ width:32, height:32, borderRadius:8, border:'none', background:'none', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* File upload */}
              {showFileUpload && (
                <div style={{ background:'#f8fafc', borderRadius:12, padding:12, marginBottom:10, border:'1px solid #e2e8f0' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <p style={{ fontSize:12, fontWeight:700, color:'#334155', margin:0 }}>Attach Files</p>
                    <button type="button" onClick={() => { setShowFileUpload(false); setAttachedFiles([]); }}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><X size={14}/></button>
                  </div>
                  <FileUpload category="messages" relatedId={selectedConversation?.id}
                    onUploadComplete={(files) => { setAttachedFiles(files); toast.success(`${files.length} file(s) attached`); }}
                    accept="image/*,video/*,application/pdf,.doc,.docx" multiple maxSizeMB={50}/>
                  {attachedFiles.length > 0 && (
                    <p style={{ fontSize:11, color:'#0d9488', fontWeight:700, marginTop:6, display:'flex', alignItems:'center', gap:5 }}>
                      <Paperclip size={11}/> {attachedFiles.length} file{attachedFiles.length!==1?'s':''} attached
                    </p>
                  )}
                </div>
              )}

              {/* Input row */}
              <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
                {/* Emoji */}
                <button type="button" onClick={() => setShowEmojiPicker(s=>!s)}
                  style={{
                    width:38, height:38, borderRadius:10, border:'none', cursor:'pointer', flexShrink:0,
                    background: showEmojiPicker ? '#f0fdfa' : '#f1f5f9',
                    color: showEmojiPicker ? '#0d9488' : '#64748b',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                  <Smile size={18}/>
                </button>

                {/* Attach */}
                <button type="button" onClick={() => setShowFileUpload(s=>!s)}
                  style={{
                    width:38, height:38, borderRadius:10, border:'none', cursor:'pointer', flexShrink:0,
                    background: showFileUpload ? '#f0fdfa' : '#f1f5f9',
                    color: showFileUpload ? '#0d9488' : '#64748b',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                  <Paperclip size={18}/>
                </button>

                {/* Textarea */}
                <textarea ref={inputRef} value={newMessage} rows={1}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }}}
                  placeholder="Type a message…  (Enter to send)"
                  style={{
                    flex:1, border:'1.5px solid #e2e8f0', borderRadius:12,
                    padding:'10px 14px', fontSize:14, color:'#0f172a',
                    background:'#f8fafc', outline:'none', resize:'none',
                    maxHeight:80, overflowY:'auto', lineHeight:1.5,
                    transition:'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor='#0d9488'}
                  onBlur={e => e.target.style.borderColor='#e2e8f0'}
                />

                {/* Send */}
                <motion.button type="submit" whileTap={{ scale:0.9 }}
                  disabled={(!newMessage.trim() && !attachedFiles.length) || sendMut.isPending}
                  style={{
                    width:42, height:42, borderRadius:12, border:'none', cursor:'pointer', flexShrink:0,
                    background: (!newMessage.trim() && !attachedFiles.length) ? '#e2e8f0' : 'linear-gradient(135deg,#0d9488,#0891b2)',
                    color: (!newMessage.trim() && !attachedFiles.length) ? '#94a3b8' : '#fff',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow: (!newMessage.trim() && !attachedFiles.length) ? 'none' : '0 4px 12px rgba(13,148,136,0.35)',
                    transition:'all 0.15s',
                  }}>
                  {sendMut.isPending ? <Loader2 size={17} style={{ animation:'spin 1s linear infinite' }}/> : <Send size={17}/>}
                </motion.button>
              </div>
            </form>
          </>
        ) : (
          /* Empty state */
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', padding:40, textAlign:'center' }}>
            <div style={{ width:80, height:80, borderRadius:24, background:'linear-gradient(135deg,#f0fdfa,#e0f2fe)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
              <MessageCircle size={36} style={{ color:'#0d9488' }}/>
            </div>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Your Messages</h2>
            <p style={{ fontSize:14, color:'#64748b', maxWidth:320, lineHeight:1.6 }}>
              Select a conversation from the sidebar, or start a new chat with your care team.
            </p>
            <button onClick={() => setShowNewChat(true)}
              style={{
                marginTop:20, padding:'12px 24px', borderRadius:12, fontSize:14, fontWeight:700,
                background:'linear-gradient(135deg,#0d9488,#0891b2)',
                color:'#fff', border:'none', cursor:'pointer',
                boxShadow:'0 4px 16px rgba(13,148,136,0.35)',
              }}>
              <Plus size={14} style={{ marginRight:6 }}/> New Conversation
            </button>
          </div>
        )}
      </div>

      {/* Desktop: always show both panels */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-sidebar { display: flex !important; width: 340px !important; }
          .lg-chat    { display: flex !important; }
        }
        .msg-bubble-group:hover .reply-btn { opacity: 1 !important; }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>

      {/* ── New Chat Modal ── */}
      <Modal isOpen={showNewChat} onClose={() => { setShowNewChat(false); setNewChatSearch(''); }}
        title="New Message" icon={MessageCircle} accent="teal" size="sm">
        <div style={{ position:'relative', marginBottom:12 }}>
          <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
          <input autoFocus value={newChatSearch} onChange={e => setNewChatSearch(e.target.value)}
            placeholder="Search by name or role..."
            style={{ width:'100%', paddingLeft:34, paddingRight:12, paddingTop:9, paddingBottom:9, borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:13, color:'#0f172a', background:'#f8fafc', outline:'none', boxSizing:'border-box' }}/>
        </div>
        <div style={{ maxHeight:280, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
          {physicians.filter(p => !newChatSearch || p.name.toLowerCase().includes(newChatSearch.toLowerCase()) || p.role.toLowerCase().includes(newChatSearch.toLowerCase())).map(person => (
            <button key={person.id} onClick={() => { handleStartChat(person.id); setNewChatSearch(''); }}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:12, background:'none', border:'none', cursor:'pointer', textAlign:'left', transition:'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background='none'}>
              <div style={{ width:36, height:36, borderRadius:'50%', background: gradFor(person.id), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:13, fontWeight:800, flexShrink:0 }}>
                {person.name[0]}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:0 }}>{person.name}</p>
                <p style={{ fontSize:11, color:'#64748b', margin:0, textTransform:'capitalize' }}>{person.role}</p>
              </div>
              <ChevronRight size={14} style={{ color:'#cbd5e1' }}/>
            </button>
          ))}
          {physicians.length === 0 && (
            <div style={{ textAlign:'center', padding:'32px 0', color:'#94a3b8' }}>
              <Users size={32} style={{ margin:'0 auto 8px', display:'block', color:'#cbd5e1' }}/>
              <p style={{ fontSize:13 }}>No users available</p>
            </div>
          )}
        </div>
      </Modal>

      {/* ── New Group Modal ── */}
      <Modal isOpen={showNewGroup} onClose={() => { setShowNewGroup(false); setSelectedParticipants([]); setGroupName(''); }}
        title="Create Group Chat" size="lg"
        footerContent={<ModalFooter>
          <button onClick={() => { setShowNewGroup(false); setSelectedParticipants([]); setGroupName(''); }}
            style={{ padding:'10px 20px', borderRadius:10, fontSize:13, fontWeight:700, background:'#f1f5f9', color:'#475569', border:'none', cursor:'pointer' }}>
            Cancel
          </button>
          <button onClick={handleStartGroup} disabled={selectedParticipants.length < 2 || startMut.isPending}
            style={{ padding:'10px 20px', borderRadius:10, fontSize:13, fontWeight:700, background:'linear-gradient(135deg,#0891b2,#1d4ed8)', color:'#fff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, opacity: selectedParticipants.length<2?0.5:1 }}>
            {startMut.isPending ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Creating...</> : <><Users size={14}/> Create Group</>}
          </button>
        </ModalFooter>}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'#475569', display:'block', marginBottom:6 }}>Group Name (optional)</label>
            <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Cancer Support Team"
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:13, color:'#0f172a', outline:'none', boxSizing:'border-box' }}/>
          </div>
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:'#475569', marginBottom:8 }}>Select participants (min. 2) · {selectedParticipants.length} selected</p>
            <div style={{ maxHeight:220, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
              {physicians.map(p => (
                <button key={p.id} onClick={() => setSelectedParticipants(prev => prev.includes(p.id) ? prev.filter(i=>i!==p.id) : [...prev,p.id])}
                  style={{
                    display:'flex', alignItems:'center', gap:12, padding:'10px 12px',
                    borderRadius:12, border:`2px solid ${selectedParticipants.includes(p.id)?'#0d9488':'#e2e8f0'}`,
                    background: selectedParticipants.includes(p.id)?'#f0fdfa':'#fff',
                    cursor:'pointer', textAlign:'left', transition:'all 0.15s',
                  }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:gradFor(p.id), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:13, fontWeight:800, flexShrink:0 }}>
                    {p.name[0]}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:0 }}>{p.name}</p>
                    <p style={{ fontSize:11, color:'#64748b', margin:0 }}>{p.role}</p>
                  </div>
                  {selectedParticipants.includes(p.id) && (
                    <div style={{ width:22, height:22, borderRadius:'50%', background:'#0d9488', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:800 }}>✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
