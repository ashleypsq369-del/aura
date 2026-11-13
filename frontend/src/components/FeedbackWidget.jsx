/**
 * FeedbackWidget - draggable floating feedback button
 * Context-aware: captures the page OR modal the user is reviewing
 * Collects submitter name for demo/anonymous users
 * zIndex 8000 - sits below all modals (9500+)
 *
 * Modals can register context via:
 *   window.dispatchEvent(new CustomEvent('feedback:context', { detail: { label: 'Modal Name', isModal: true } }))
 *   window.dispatchEvent(new CustomEvent('feedback:context', { detail: null })) // clear on close
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../api/client';
import {
  MessageSquarePlus, X, Star, Bug, ThumbsUp, ThumbsDown,
  Send, ChevronRight, AlertTriangle, Loader2, Check, MapPin,
} from 'lucide-react';

const PAGE_NAMES = {
  '/dashboard':'Dashboard', '/my-space':'My Space', '/patients':'Patients',
  '/medications':'Medications', '/appointments':'Appointments', '/alerts':'Alerts',
  '/messages':'Messages', '/services':'Services', '/community':'Community Hub',
  '/resources':'Resources', '/settings':'Settings', '/profile':'Profile',
  '/caregivers':'Caregivers', '/ai-insights':'AI Insights',
  '/wellness-checkin':'Wellness Check', '/my-journey':'My Journey',
  '/memory-vault':'Memory Vault', '/care-settings':'Care Settings',
  '/care-guide':'Care Guide', '/journal':'My Journal',
  '/heir-management':'Heir Management', '/legacy-setup':'Digital Legacy',
  '/assessments':'Assessments', '/reports':'Reports',
};

const BUG_TYPES = [
  { value:'ui_ux',  label:'UI/UX',       color:'#7c3aed' },
  { value:'broken', label:'Not working', color:'#e11d48' },
  { value:'slow',   label:'Performance', color:'#d97706' },
  { value:'data',   label:'Wrong data',  color:'#0891b2' },
  { value:'crash',  label:'App crashed', color:'#dc2626' },
  { value:'other',  label:'Other',       color:'#64748b' },
];

const STAR_LABELS = ['Very Bad', 'Bad', 'OK', 'Good', 'Excellent'];
const STAR_COLORS = ['#ef4444', '#f97316', '#d97706', '#22c55e', '#0d9488'];

function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

export default function FeedbackWidget() {
  const [open,       setOpen]      = useState(false);
  const [mode,       setMode]      = useState('menu');
  const [rating,     setRating]    = useState(0);
  const [hovered,    setHovered]   = useState(0);
  const [uxGood,     setUxGood]    = useState('');
  const [uxBad,      setUxBad]     = useState('');
  const [bugType,    setBugType]   = useState('');
  const [bugDesc,    setBugDesc]   = useState('');
  const [nameInput,  setNameInput] = useState('');
  const [email,      setEmail]     = useState('');
  const [modalCtx,   setModalCtx]  = useState(null);   // { label, isModal } from event
  const [useGeneral, setUseGeneral]= useState(false);

  const BUTTON_W = 110;
  const BUTTON_H = 44;
  const MARGIN   = 12;

  const getSaved = () => {
    try { const s = localStorage.getItem('feedback_widget_pos'); if (s) return JSON.parse(s); } catch {}
    return null;
  };
  const defPos = () => ({ x: window.innerWidth - BUTTON_W - MARGIN - 16, y: window.innerHeight - BUTTON_H - MARGIN - 16 });
  const [pos, setPos] = useState(() => getSaved() || defPos());

  const dragging   = useRef(false);
  const dragOffset = useRef({ x:0, y:0 });
  const hasMoved   = useRef(false);

  const onPointerDown = useCallback((e) => {
    dragging.current = true;
    hasMoved.current = false;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return;
    hasMoved.current = true;
    const nx = clamp(e.clientX - dragOffset.current.x, MARGIN, window.innerWidth  - BUTTON_W - MARGIN);
    const ny = clamp(e.clientY - dragOffset.current.y, MARGIN, window.innerHeight - BUTTON_H - MARGIN);
    setPos({ x: nx, y: ny });
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    setPos(p => { localStorage.setItem('feedback_widget_pos', JSON.stringify(p)); return p; });
  }, []);

  /* Listen for modal context events */
  useEffect(() => {
    const handler = (e) => { setModalCtx(e.detail || null); setUseGeneral(false); };
    window.addEventListener('feedback:context', handler);
    return () => window.removeEventListener('feedback:context', handler);
  }, []);

  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user?.email) setEmail(user.email);
    // Don't pre-fill name - user should enter their own name
    // The placeholder shows their account name as a hint
  }, [user]);

  /* Clear modal context on navigation */
  useEffect(() => { setModalCtx(null); setUseGeneral(false); }, [location.pathname]);

  /* Sync offline queue */
  useEffect(() => {
    const queue = JSON.parse(localStorage.getItem('feedback_queue') || '[]');
    if (!queue.length) return;
    Promise.all(queue.map(item => apiClient.post('/api/feedback', item).catch(() => null)))
      .then(results => {
        const failed = queue.filter((_, i) => !results[i]);
        localStorage.setItem('feedback_queue', JSON.stringify(failed));
      });
  }, []);

  const pageName = PAGE_NAMES[location.pathname] ||
    location.pathname.split('/').filter(Boolean)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ') || 'Unknown Page';

  /* What the user is currently reviewing */
  const reviewCtx = useGeneral
    ? { label: 'General - Whole System', type: 'general' }
    : modalCtx
    ? { label: modalCtx.label, type: 'modal' }
    : { label: pageName, type: 'page' };

  const submitMut = useMutation({
    mutationFn: async (data) => {
      try { return await apiClient.post('/api/feedback', data); }
      catch (err) {
        const saved = JSON.parse(localStorage.getItem('feedback_queue') || '[]');
        saved.push({ ...data, saved_at: new Date().toISOString() });
        localStorage.setItem('feedback_queue', JSON.stringify(saved));
        throw err;
      }
    },
    onSuccess: () => { setMode('done'); setTimeout(() => { setOpen(false); reset(); }, 2500); },
    onError:   () => { setMode('done'); setTimeout(() => { setOpen(false); reset(); }, 2500); },
  });

  const reset = () => {
    setMode('menu'); setRating(0); setHovered(0);
    setUxGood(''); setUxBad(''); setBugType(''); setBugDesc('');
  };

  const payload = (type, extra = {}) => ({
    type,
    page:         reviewCtx.label,
    url:          location.pathname,
    context_type: reviewCtx.type,
    user_id:      user?.id,
    user_role:    user?.role,
    user_name:    nameInput || user?.full_name || user?.username || null,
    email:        email || user?.email,
    browser:      navigator.userAgent.slice(0, 200),
    timestamp:    new Date().toISOString(),
    ...extra,
  });

  const inp = {
    width:'100%', padding:'9px 12px', borderRadius:10,
    border:'1.5px solid var(--card-border)', fontSize:13,
    color:'var(--text-800)', background:'var(--page-bg)',
    outline:'none', resize:'none', boxSizing:'border-box', fontFamily:'inherit',
  };

  /* Panel dimensions */
  const panelW = 300;
  const panelH = 520;
  const panelX = clamp(pos.x - (panelW - BUTTON_W) / 2, MARGIN, window.innerWidth - panelW - MARGIN);
  const panelY = clamp(pos.y - panelH - 10, MARGIN, pos.y - panelH - 10);

  /* ── Name + Email fields shown in every form ── */
  const NameRow = (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <input
        value={nameInput}
        onChange={e => setNameInput(e.target.value)}
        placeholder={user?.full_name ? `Your name (e.g. ${user.full_name})` : 'Your name - who is giving this feedback?'}
        required
        style={{ ...inp, borderColor: nameInput ? 'var(--card-border)' : '#f59e0b' }}
      />
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email (optional - for follow-up)"
        style={inp}
      />
    </div>
  );

  const widget = (
    <>
      {/* Draggable trigger */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={() => { if (!hasMoved.current) { setOpen(v => !v); if (open) reset(); } }}
        style={{ position:'fixed', left:pos.x, top:pos.y, zIndex:8000,
          cursor:dragging.current?'grabbing':'grab', userSelect:'none', touchAction:'none' }}
        data-feedback-widget=""
      >
        <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
          style={{
            display:'flex', alignItems:'center', gap:7, padding:'10px 14px', borderRadius:99,
            background: open ? 'linear-gradient(135deg,#0f172a,#1e293b)' : 'linear-gradient(135deg,#0d9488,#0891b2)',
            boxShadow:'0 4px 20px rgba(13,148,136,0.40)', border:'none', color:'#fff', pointerEvents:'none',
          }}>
          {open ? <X size={16} style={{ color:'#fff', flexShrink:0 }} /> : <MessageSquarePlus size={16} style={{ color:'#fff', flexShrink:0 }} />}
          <span style={{ fontSize:12, fontWeight:700, whiteSpace:'nowrap', lineHeight:1 }}>
            {open ? 'Close' : 'Feedback'}
          </span>
        </motion.div>
      </div>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:8, scale:0.97 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{   opacity:0, y:8, scale:0.97 }}
            transition={{ duration:0.16, ease:'easeOut' }}
            style={{
              position:'fixed', left:panelX, top:Math.max(MARGIN, panelY), zIndex:8001,
              width:panelW, maxHeight:`min(${panelH}px, calc(100vh - 80px))`,
              background:'var(--card-bg)', borderRadius:16,
              boxShadow:'0 8px 40px rgba(0,0,0,0.22)', border:'1px solid var(--card-border)',
              display:'flex', flexDirection:'column', overflow:'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding:'12px 14px', flexShrink:0, background:'linear-gradient(135deg,#0d9488,#0891b2)', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ color:'#fff', fontWeight:800, fontSize:13, margin:0 }}>
                  {mode==='rate'?'Rate This':mode==='ux'?'UX Feedback':mode==='bug'?'Report a Bug':mode==='done'?'Thank You!':'Share Feedback'}
                </p>
                {/* Context hint */}
                <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:3, flexWrap:'wrap' }}>
                  <MapPin size={9} style={{ color:'rgba(255,255,255,0.7)', flexShrink:0 }} />
                  <span style={{ color:'rgba(255,255,255,0.85)', fontSize:10, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:130 }}>
                    {reviewCtx.type==='modal'?'Modal: ':reviewCtx.type==='general'?'':' '}{reviewCtx.label}
                  </span>
                  {reviewCtx.type !== 'general' && (
                    <button onClick={() => setUseGeneral(true)}
                      style={{ background:'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.9)', fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:99, flexShrink:0 }}>
                      General?
                    </button>
                  )}
                  {reviewCtx.type === 'general' && (
                    <button onClick={() => setUseGeneral(false)}
                      style={{ background:'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.9)', fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:99, flexShrink:0 }}>
                      Specific?
                    </button>
                  )}
                </div>
              </div>
              {mode !== 'menu' && mode !== 'done' && (
                <button onClick={() => setMode('menu')}
                  style={{ background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer', color:'#fff', width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <ChevronRight size={13} style={{ transform:'rotate(180deg)' }} />
                </button>
              )}
            </div>

            {/* Body */}
            <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', background:'var(--card-bg)' }}>

              {/* MENU */}
              {mode === 'menu' && (
                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                  {/* Context card */}
                  <div style={{ padding:'8px 10px', borderRadius:9, background:'var(--page-bg)', border:'1px solid var(--card-border)', marginBottom:2 }}>
                    <p style={{ fontSize:10, fontWeight:700, color:'var(--text-500)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 2px' }}>
                      {reviewCtx.type==='modal'?'Reviewing modal':reviewCtx.type==='general'?'Reviewing':'Reviewing page'}
                    </p>
                    <p style={{ fontSize:12, fontWeight:700, color:'var(--text-800)', margin:'0 0 2px' }}>{reviewCtx.label}</p>
                    <p style={{ fontSize:11, color:'var(--text-600)', margin:0 }}>
                      {reviewCtx.type==='general'
                        ? 'Feedback applies to the whole system'
                        : reviewCtx.type==='modal'
                        ? 'Feedback is about this specific dialog'
                        : 'Feedback is about this specific page'}
                    </p>
                  </div>
                  <p style={{ fontSize:11, fontWeight:600, color:'var(--text-700)', margin:'0 0 2px' }}>What would you like to do?</p>
                  {[
                    { icon:Star,     label:'Rate this',    sub:'How is this screen?',       m:'rate', c:'#f59e0b' },
                    { icon:ThumbsUp, label:'UX feedback',  sub:"What works and what doesn't", m:'ux',   c:'#0d9488' },
                    { icon:Bug,      label:'Report a bug', sub:'Something broken or wrong', m:'bug',  c:'#e11d48' },
                  ].map(item => (
                    <button key={item.m} onClick={() => setMode(item.m)}
                      style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 11px', borderRadius:11,
                        background:'var(--page-bg)', border:'1.5px solid var(--card-border)', cursor:'pointer', textAlign:'left', transition:'border-color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = item.c)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--card-border)')}>
                      <div style={{ width:30, height:30, borderRadius:8, background:`${item.c}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <item.icon size={14} style={{ color:item.c }} />
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:0 }}>{item.label}</p>
                        <p style={{ fontSize:11, color:'#475569', margin:0 }}>{item.sub}</p>
                      </div>
                      <ChevronRight size={12} style={{ color:'var(--text-400)', flexShrink:0 }} />
                    </button>
                  ))}
                  <p style={{ fontSize:10, color:'var(--text-400)', textAlign:'center', marginTop:4 }}>
                    Drag the button to reposition it
                  </p>
                </div>
              )}

              {/* RATE */}
              {mode === 'rate' && (
                <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                  <p style={{ fontSize:12, color:'var(--text-500)', marginBottom:4, textAlign:'center' }}>How would you rate this?</p>
                  <div style={{ display:'flex', justifyContent:'center', gap:4, marginBottom:4 }}>
                    {[1,2,3,4,5].map(score => {
                      const active = (hovered || rating) >= score;
                      const color  = STAR_COLORS[score - 1];
                      return (
                        <button key={score}
                          onMouseEnter={() => setHovered(score)}
                          onMouseLeave={() => setHovered(0)}
                          onClick={() => setRating(score)}
                          style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 2px', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                          <Star size={28} style={{ color:active?color:'var(--card-border)', fill:active?color:'none', transition:'all 0.12s' }} />
                          <span style={{ fontSize:9, fontWeight:600, color:active?color:'var(--text-400)', transition:'color 0.12s' }}>{score}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p style={{ textAlign:'center', fontSize:12, fontWeight:700, color:rating>0?STAR_COLORS[rating-1]:'var(--text-400)', minHeight:18 }}>
                    {rating > 0 ? STAR_LABELS[rating - 1] : 'Select a rating'}
                  </p>
                  {rating > 0 && (
                    <>
                      <textarea placeholder="Any comments? (optional)" value={uxGood} onChange={e => setUxGood(e.target.value)} rows={2} style={inp} />
                      {NameRow}
                      <button onClick={() => submitMut.mutate(payload('rating', { rating, label:STAR_LABELS[rating-1], what_works:uxGood }))}
                        disabled={submitMut.isPending}
                        style={{ width:'100%', padding:'10px', borderRadius:10, fontSize:13, fontWeight:700, background:'linear-gradient(135deg,#0d9488,#0891b2)', color:'#fff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                        {submitMut.isPending ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
                        Send Rating
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* UX */}
              {mode === 'ux' && (
                <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:'#22c55e', display:'flex', alignItems:'center', gap:4, marginBottom:4 }}>
                      <ThumbsUp size={11}/> What works well?
                    </label>
                    <textarea value={uxGood} onChange={e => setUxGood(e.target.value)} rows={2} placeholder="e.g. Clear navigation, fast loading..." style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:'#ef4444', display:'flex', alignItems:'center', gap:4, marginBottom:4 }}>
                      <ThumbsDown size={11}/> What could improve?
                    </label>
                    <textarea value={uxBad} onChange={e => setUxBad(e.target.value)} rows={2} placeholder="e.g. Buttons too small, confusing layout..." style={inp} />
                  </div>
                  {NameRow}
                  <button onClick={() => submitMut.mutate(payload('ux_feedback', { what_works:uxGood, what_doesnt:uxBad }))}
                    disabled={(!uxGood && !uxBad) || submitMut.isPending}
                    style={{ width:'100%', padding:'10px', borderRadius:10, fontSize:13, fontWeight:700, background:'linear-gradient(135deg,#0d9488,#0891b2)', color:'#fff', border:'none', cursor:'pointer', opacity:(!uxGood&&!uxBad)?0.5:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    {submitMut.isPending ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
                    Send Feedback
                  </button>
                </div>
              )}

              {/* BUG */}
              {mode === 'bug' && (
                <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                  <p style={{ fontSize:11, color:'var(--text-500)', margin:0 }}>Page and browser info are auto-attached.</p>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:'var(--text-700)', marginBottom:5, display:'block' }}>Bug type</label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                      {BUG_TYPES.map(bt => (
                        <button key={bt.value} onClick={() => setBugType(bt.value)}
                          style={{ padding:'4px 9px', borderRadius:999, fontSize:10, fontWeight:700,
                            border:`1.5px solid ${bugType===bt.value?bt.color:'var(--card-border)'}`,
                            background:bugType===bt.value?`${bt.color}15`:'var(--page-bg)',
                            color:bugType===bt.value?bt.color:'var(--text-500)', cursor:'pointer', transition:'all 0.12s' }}>
                          {bt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:'var(--text-700)', marginBottom:4, display:'block' }}>What happened? *</label>
                    <textarea value={bugDesc} onChange={e => setBugDesc(e.target.value)} rows={3}
                      placeholder="What were you doing? What did you expect vs what happened?" style={inp} />
                  </div>
                  {NameRow}
                  <button onClick={() => submitMut.mutate(payload('bug_report', { bug_type:bugType, description:bugDesc }))}
                    disabled={!bugDesc.trim() || submitMut.isPending}
                    style={{ width:'100%', padding:'10px', borderRadius:10, fontSize:13, fontWeight:700, background:'linear-gradient(135deg,#e11d48,#dc2626)', color:'#fff', border:'none', cursor:'pointer', opacity:!bugDesc.trim()?0.5:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    {submitMut.isPending ? <Loader2 size={13} className="animate-spin"/> : <AlertTriangle size={13}/>}
                    Report Bug
                  </button>
                </div>
              )}

              {/* DONE */}
              {mode === 'done' && (
                <div style={{ textAlign:'center', padding:'20px 0' }}>
                  <div style={{ width:52, height:52, borderRadius:'50%', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                    <Check size={24} style={{ color:'#16a34a' }} />
                  </div>
                  <p style={{ fontSize:14, fontWeight:800, color:'var(--text-900)', margin:'0 0 5px' }}>Thank you!</p>
                  <p style={{ fontSize:12, color:'var(--text-500)', margin:0 }}>Your feedback has been sent to the team.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(widget, document.body);
}
