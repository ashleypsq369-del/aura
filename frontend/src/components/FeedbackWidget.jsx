/**
 * FeedbackWidget - draggable floating feedback + bug report
 * - Drag the button anywhere on screen (persists via localStorage)
 * - Shows "Feedback" label so users know what it does
 * - Star rating with labels instead of plain circles
 * - Portalled to document.body
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../api/client';
import toast from '../utils/toast';
import {
  MessageSquarePlus, X, Star, Bug, ThumbsUp, ThumbsDown,
  Send, ChevronRight, AlertTriangle, Loader2, Check,
} from 'lucide-react';

/* ── Page name map ─────────────────────────────────────────────────── */
const PAGE_NAMES = {
  '/dashboard':'Dashboard', '/my-space':'My Space', '/patients':'Patients',
  '/medications':'Medications', '/appointments':'Appointments', '/alerts':'Alerts',
  '/messages':'Messages', '/services':'Services', '/community':'Community Hub',
  '/resources':'Resources', '/settings':'Settings', '/profile':'Profile',
  '/caregivers':'Caregivers', '/ai-insights':'AI Insights',
  '/wellness-checkin':'Wellness Check', '/my-journey':'My Journey',
  '/memory-vault':'Memory Vault', '/care-settings':'Care Settings',
  '/care-guide':'Care Guide',
};

const BUG_TYPES = [
  { value:'ui_ux',   label:'UI/UX',         color:'#7c3aed' },
  { value:'broken',  label:'Not working',   color:'#e11d48' },
  { value:'slow',    label:'Performance',   color:'#d97706' },
  { value:'data',    label:'Wrong data',    color:'#0891b2' },
  { value:'crash',   label:'App crashed',   color:'#dc2626' },
  { value:'other',   label:'Other',         color:'#64748b' },
];

const STAR_LABELS = ['Very Bad', 'Bad', 'OK', 'Good', 'Excellent'];
const STAR_COLORS = ['#ef4444', '#f97316', '#d97706', '#22c55e', '#0d9488'];

/* ── Clamp position inside viewport ───────────────────────────────── */
function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

export default function FeedbackWidget() {
  /* ── State ── */
  const [open,      setOpen]      = useState(false);
  const [mode,      setMode]      = useState('menu');
  const [rating,    setRating]    = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [uxGood,    setUxGood]    = useState('');
  const [uxBad,     setUxBad]     = useState('');
  const [bugType,   setBugType]   = useState('');
  const [bugDesc,   setBugDesc]   = useState('');
  const [email,     setEmail]     = useState('');

  /* ── Drag state ── */
  const BUTTON_W = 110; // approx button width
  const BUTTON_H = 44;
  const MARGIN   = 12;

  const getSavedPos = () => {
    try {
      const s = localStorage.getItem('feedback_widget_pos');
      if (s) return JSON.parse(s);
    } catch { /* ignore */ }
    return null;
  };

  const [pos, setPos] = useState(() => {
    const saved = getSavedPos();
    if (saved) return saved;
    return {
      x: window.innerWidth  - BUTTON_W - MARGIN,
      y: window.innerHeight - BUTTON_H - MARGIN,
    };
  });

  const dragging   = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
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
    setPos(p => {
      localStorage.setItem('feedback_widget_pos', JSON.stringify(p));
      return p;
    });
  }, []);

  /* ── Auth / location ── */
  const { user }  = useAuth();
  const location  = useLocation();
  useEffect(() => { if (user?.email) setEmail(user.email); }, [user]);

  /* ── Sync queued feedback ── */
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

  /* ── Submit mutation ── */
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
    type, page: pageName, url: location.pathname,
    user_id: user?.id, user_role: user?.role,
    user_name: user?.full_name || user?.username || null,
    email: email || user?.email,
    browser: navigator.userAgent.slice(0, 200),
    timestamp: new Date().toISOString(), ...extra,
  });

  /* ── Panel position: open above the button ── */
  const panelW = 300;
  const panelH = 480;
  const panelX = clamp(pos.x - (panelW - BUTTON_W) / 2, MARGIN, window.innerWidth - panelW - MARGIN);
  const panelY = clamp(pos.y - panelH - 10, MARGIN, pos.y - panelH - 10);

  /* ── Input style - dark mode aware ── */
  const inp = {
    width: '100%', padding: '9px 12px', borderRadius: 10,
    border: '1.5px solid var(--card-border)', fontSize: 13,
    color: 'var(--text-800)', background: 'var(--page-bg)',
    outline: 'none', resize: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  /* ── Widget ── */
  const widget = (
    <>
      {/* ── Draggable trigger button ── */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={() => { if (!hasMoved.current) { setOpen(v => !v); if (open) reset(); } }}
        style={{
          position: 'fixed',
          left: pos.x,
          top:  pos.y,
          zIndex: 9990,
          cursor: dragging.current ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <motion.div
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 14px', borderRadius: 99,
            background: open
              ? 'linear-gradient(135deg,#0f172a,#1e293b)'
              : 'linear-gradient(135deg,#0d9488,#0891b2)',
            boxShadow: '0 4px 20px rgba(13,148,136,0.40)',
            border: 'none',
            color: '#fff',
            pointerEvents: 'none', // events on parent div
          }}
        >
          {open
            ? <X size={16} style={{ color: '#fff', flexShrink: 0 }} />
            : <MessageSquarePlus size={16} style={{ color: '#fff', flexShrink: 0 }} />
          }
          <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1 }}>
            {open ? 'Close' : 'Feedback'}
          </span>
        </motion.div>
      </div>

      {/* ── Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{   opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              left: panelX,
              top:  Math.max(MARGIN, panelY),
              zIndex: 9991,
              width: panelW,
              maxHeight: `min(${panelH}px, calc(100vh - 80px))`,
              background: 'var(--card-bg)',
              borderRadius: 16,
              boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
              border: '1px solid var(--card-border)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '12px 14px', flexShrink: 0,
              background: 'linear-gradient(135deg,#0d9488,#0891b2)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ color:'#fff', fontWeight:800, fontSize:13, margin:0 }}>
                  { mode==='rate' ? 'Rate This Page'
                  : mode==='ux'   ? 'UX Feedback'
                  : mode==='bug'  ? 'Report a Bug'
                  : mode==='done' ? 'Thank You!'
                  : 'Share Feedback' }
                </p>
                <p style={{ color:'rgba(255,255,255,0.65)', fontSize:10, margin:'2px 0 0' }}>
                  {pageName}
                </p>
              </div>
              {mode !== 'menu' && mode !== 'done' && (
                <button onClick={() => setMode('menu')}
                  style={{ background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer',
                    color:'#fff', width:26, height:26, borderRadius:'50%',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <ChevronRight size={13} style={{ transform:'rotate(180deg)' }} />
                </button>
              )}
            </div>

            {/* Body */}
            <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', background:'var(--card-bg)' }}>

              {/* MENU */}
              {mode === 'menu' && (
                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                  <p style={{ fontSize:11, color:'var(--text-500)', margin:'0 0 4px' }}>
                    What would you like to do?
                  </p>
                  {[
                    { icon:Star,     label:'Rate this page', sub:'How is this screen?',        m:'rate', c:'#f59e0b' },
                    { icon:ThumbsUp, label:'UX feedback',    sub:"What works / what doesn't",  m:'ux',   c:'#0d9488' },
                    { icon:Bug,      label:'Report a bug',   sub:'Something broken or wrong',  m:'bug',  c:'#e11d48' },
                  ].map(item => (
                    <button key={item.m} onClick={() => setMode(item.m)}
                      style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 11px',
                        borderRadius:11, background:'var(--page-bg)', border:'1.5px solid var(--card-border)',
                        cursor:'pointer', textAlign:'left', transition:'border-color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = item.c}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--card-border)'}>
                      <div style={{ width:30, height:30, borderRadius:8, background:`${item.c}15`,
                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <item.icon size={14} style={{ color:item.c }} />
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:12, fontWeight:700, color:'var(--text-900)', margin:0 }}>{item.label}</p>
                        <p style={{ fontSize:10, color:'var(--text-500)', margin:0 }}>{item.sub}</p>
                      </div>
                      <ChevronRight size={12} style={{ color:'var(--text-400)', flexShrink:0 }} />
                    </button>
                  ))}
                  <p style={{ fontSize:10, color:'var(--text-400)', textAlign:'center', marginTop:4 }}>
                    Drag the button to reposition it anywhere
                  </p>
                </div>
              )}

              {/* RATE */}
              {mode === 'rate' && (
                <div>
                  <p style={{ fontSize:12, color:'var(--text-500)', marginBottom:12, textAlign:'center' }}>
                    How would you rate this page?
                  </p>
                  <div style={{ display:'flex', justifyContent:'center', gap:4, marginBottom:8 }}>
                    {[1,2,3,4,5].map(score => {
                      const active = (hovered || rating) >= score;
                      const color  = STAR_COLORS[score - 1];
                      return (
                        <button key={score}
                          onMouseEnter={() => setHovered(score)}
                          onMouseLeave={() => setHovered(0)}
                          onClick={() => setRating(score)}
                          style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 2px',
                            display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                          <Star size={28} style={{ color: active ? color : 'var(--card-border)', fill: active ? color : 'none', transition:'all 0.12s' }} />
                          <span style={{ fontSize:9, fontWeight:600, color: active ? color : 'var(--text-400)', transition:'color 0.12s' }}>{score}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p style={{ textAlign:'center', fontSize:12, fontWeight:700,
                    color: rating > 0 ? STAR_COLORS[rating-1] : 'var(--text-400)',
                    marginBottom:12, minHeight:18 }}>
                    {rating > 0 ? STAR_LABELS[rating - 1] : 'Select a rating'}
                  </p>
                  {rating > 0 && (
                    <>
                      <textarea placeholder="Any comments? (optional)"
                        value={uxGood} onChange={e => setUxGood(e.target.value)}
                        rows={2} style={{ ...inp, marginBottom:8 }} />
                      <button onClick={() => submitMut.mutate(payload('rating', { rating, label: STAR_LABELS[rating-1], what_works: uxGood }))}
                        disabled={submitMut.isPending}
                        style={{ width:'100%', padding:'10px', borderRadius:10, fontSize:13, fontWeight:700,
                          background:'linear-gradient(135deg,#0d9488,#0891b2)', color:'#fff', border:'none', cursor:'pointer',
                          display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
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
                    <textarea value={uxGood} onChange={e => setUxGood(e.target.value)} rows={2}
                      placeholder="e.g. Clear navigation, fast loading..." style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:'#ef4444', display:'flex', alignItems:'center', gap:4, marginBottom:4 }}>
                      <ThumbsDown size={11}/> What could improve?
                    </label>
                    <textarea value={uxBad} onChange={e => setUxBad(e.target.value)} rows={2}
                      placeholder="e.g. Buttons too small, confusing..." style={inp} />
                  </div>
                  <input value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="Email (optional)" style={inp} />
                  <button onClick={() => submitMut.mutate(payload('ux_feedback', { what_works:uxGood, what_doesnt:uxBad }))}
                    disabled={(!uxGood && !uxBad) || submitMut.isPending}
                    style={{ width:'100%', padding:'10px', borderRadius:10, fontSize:13, fontWeight:700,
                      background:'linear-gradient(135deg,#0d9488,#0891b2)', color:'#fff', border:'none', cursor:'pointer',
                      opacity:(!uxGood && !uxBad)?0.5:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
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
                            border:`1.5px solid ${bugType===bt.value ? bt.color : 'var(--card-border)'}`,
                            background: bugType===bt.value ? `${bt.color}15` : 'var(--page-bg)',
                            color: bugType===bt.value ? bt.color : 'var(--text-500)',
                            cursor:'pointer', transition:'all 0.12s' }}>
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
                  <input value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="Email for updates (optional)" style={inp} />
                  <button onClick={() => submitMut.mutate(payload('bug_report', { bug_type:bugType, description:bugDesc }))}
                    disabled={!bugDesc.trim() || submitMut.isPending}
                    style={{ width:'100%', padding:'10px', borderRadius:10, fontSize:13, fontWeight:700,
                      background:'linear-gradient(135deg,#e11d48,#dc2626)', color:'#fff', border:'none', cursor:'pointer',
                      opacity:!bugDesc.trim()?0.5:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    {submitMut.isPending ? <Loader2 size={13} className="animate-spin"/> : <AlertTriangle size={13}/>}
                    Report Bug
                  </button>
                </div>
              )}

              {/* DONE */}
              {mode === 'done' && (
                <div style={{ textAlign:'center', padding:'20px 0' }}>
                  <div style={{ width:52, height:52, borderRadius:'50%', background:'#f0fdf4',
                    display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
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
