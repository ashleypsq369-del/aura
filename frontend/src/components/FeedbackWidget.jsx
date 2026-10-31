/**
 * FeedbackWidget — floating feedback + bug report
 * Uses createPortal so the panel renders at document.body level,
 * completely outside any overflow/clip/z-index stacking context.
 */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../api/client';
import toast from '../utils/toast';
import {
  MessageSquarePlus, X, Star, Bug, ThumbsUp, ThumbsDown,
  Send, ChevronRight, Smile, Meh, Frown, AlertTriangle,
  Loader2, Check,
} from 'lucide-react';

const PAGE_NAMES = {
  '/dashboard':'Dashboard','/my-space':'My Space','/patients':'Patients',
  '/medications':'Medications','/appointments':'Appointments','/alerts':'Alerts',
  '/messages':'Messages','/services':'Services','/community':'Community Hub',
  '/resources':'Resources','/settings':'Settings','/profile':'Profile',
  '/notifications':'Notifications','/caregivers':'Caregivers',
  '/ai-insights':'AI Insights','/wellness-checkin':'Wellness Check',
  '/my-journey':'My Journey','/memory-vault':'Memory Vault',
};

const BUG_TYPES = [
  {value:'ui_ux',   label:'UI/UX Issue',         color:'#7c3aed'},
  {value:'broken',  label:'Feature not working',  color:'#e11d48'},
  {value:'slow',    label:'Performance / slow',   color:'#d97706'},
  {value:'data',    label:'Wrong data shown',     color:'#0891b2'},
  {value:'crash',   label:'App crashed / error',  color:'#dc2626'},
  {value:'other',   label:'Other',                color:'#64748b'},
];

const EMOJI_RATINGS = [
  {score:1,icon:Frown, label:'Very Bad',  color:'#ef4444'},
  {score:2,icon:Frown, label:'Bad',       color:'#f97316'},
  {score:3,icon:Meh,   label:'OK',        color:'#d97706'},
  {score:4,icon:Smile, label:'Good',      color:'#22c55e'},
  {score:5,icon:Smile, label:'Excellent', color:'#0d9488'},
];

export default function FeedbackWidget() {
  const [open,      setOpen]      = useState(false);
  const [mode,      setMode]      = useState('menu');
  const [rating,    setRating]    = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [uxGood,    setUxGood]    = useState('');
  const [uxBad,     setUxBad]     = useState('');
  const [bugType,   setBugType]   = useState('');
  const [bugDesc,   setBugDesc]   = useState('');
  const [email,     setEmail]     = useState('');
  const { user }  = useAuth();
  const location  = useLocation();

  useEffect(() => { if (user?.email) setEmail(user.email); }, [user]);

  // Sync any queued feedback when component mounts (retry after backend restart)
  useEffect(() => {
    const queue = JSON.parse(localStorage.getItem('feedback_queue') || '[]');
    if (!queue.length) return;
    Promise.all(queue.map(item => apiClient.post('/api/feedback', item).catch(() => null)))
      .then(results => {
        const failed = queue.filter((_, i) => !results[i]);
        localStorage.setItem('feedback_queue', JSON.stringify(failed));
        if (failed.length < queue.length) {
          console.log(`[FeedbackWidget] Synced ${queue.length - failed.length} queued item(s)`);
        }
      });
  }, []);

  const pageName = PAGE_NAMES[location.pathname] ||
    location.pathname.split('/').filter(Boolean)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ') || 'Unknown Page';

  const submitMut = useMutation({
    mutationFn: async (data) => {
      try {
        return await apiClient.post('/api/feedback', data);
      } catch (err) {
        // Offline fallback — save to localStorage so nothing is lost
        const saved = JSON.parse(localStorage.getItem('feedback_queue') || '[]');
        saved.push({ ...data, saved_at: new Date().toISOString() });
        localStorage.setItem('feedback_queue', JSON.stringify(saved));
        throw err;
      }
    },
    onSuccess: () => { setMode('done'); setTimeout(() => { setOpen(false); reset(); }, 2500); },
    onError: () => {
      // Still show done — it was saved locally
      setMode('done');
      setTimeout(() => { setOpen(false); reset(); }, 2500);
      toast.error('Saved locally — will sync when backend is reachable.');
    },
  });

  const reset = () => {
    setMode('menu'); setRating(0); setHovered(0);
    setUxGood(''); setUxBad(''); setBugType(''); setBugDesc('');
  };

  const payload = (type, extra={}) => ({
    type, page:pageName, url:location.pathname,
    user_id:user?.id, user_role:user?.role,
    email:email||user?.email,
    browser:navigator.userAgent.slice(0,200),
    timestamp:new Date().toISOString(), ...extra,
  });

  // Input style
  const inp = {
    width:'100%', padding:'9px 12px', borderRadius:10,
    border:'1.5px solid #e2e8f0', fontSize:13,
    color:'#0f172a', background:'#f8fafc',
    outline:'none', resize:'none', boxSizing:'border-box',
    fontFamily:'inherit',
  };

  // The floating button + panel, portalled to document.body
  const widget = (
    <>
      {/* Floating trigger button — fixed bottom-right */}
      <motion.button
        whileHover={{ scale:1.08 }} whileTap={{ scale:0.94 }}
        onClick={() => { setOpen(v => !v); if (open) reset(); }}
        style={{
          position:'fixed', bottom:20, right:20, zIndex:9990,
          width:48, height:48, borderRadius:'50%',
          background:'linear-gradient(135deg,#0d9488,#0891b2)',
          border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 20px rgba(13,148,136,0.45)',
        }}
        title="Feedback & Bug Report"
      >
        {open ? <X size={20} style={{color:'#fff'}}/> : <MessageSquarePlus size={20} style={{color:'#fff'}}/>}
      </motion.button>

      {/* Panel — portalled, fixed position, constrained size */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:12, scale:0.97 }}
            animate={{ opacity:1, y:0,  scale:1    }}
            exit={{    opacity:0, y:12, scale:0.97 }}
            transition={{ duration:0.18, ease:'easeOut' }}
            style={{
              position:'fixed',
              bottom:76, right:20,
              zIndex:9991,
              width:300,
              maxHeight:'min(520px, calc(100vh - 100px))',
              background:'#ffffff',
              borderRadius:16,
              boxShadow:'0 8px 40px rgba(0,0,0,0.18)',
              border:'1px solid #e2e8f0',
              display:'flex', flexDirection:'column',
              overflow:'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding:'13px 14px', flexShrink:0,
              background:'linear-gradient(135deg,#0d9488,#0891b2)',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div>
                <p style={{color:'#fff',fontWeight:800,fontSize:13,margin:0}}>
                  {mode==='rate'?'Rate This Page':mode==='ux'?'UX Feedback':
                   mode==='bug'?'Report a Bug':mode==='done'?'Thank You!':'Share Feedback'}
                </p>
                <p style={{color:'rgba(255,255,255,0.65)',fontSize:10,margin:'2px 0 0'}}>{pageName}</p>
              </div>
              {mode!=='menu'&&mode!=='done' && (
                <button onClick={()=>setMode('menu')}
                  style={{background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',
                    color:'#fff',width:26,height:26,borderRadius:'50%',
                    display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <ChevronRight size={13} style={{transform:'rotate(180deg)'}}/>
                </button>
              )}
            </div>

            {/* Body — scrollable */}
            <div style={{flex:1,overflowY:'auto',padding:'12px 14px'}}>

              {/* MENU */}
              {mode==='menu' && (
                <div style={{display:'flex',flexDirection:'column',gap:7}}>
                  <p style={{fontSize:11,color:'#64748b',marginBottom:2}}>What would you like to do?</p>
                  {[
                    {icon:Star,     label:'Rate this page',    sub:'How is this screen?',          m:'rate', c:'#f59e0b'},
                    {icon:ThumbsUp, label:'UX feedback',       sub:'What works / what doesn\'t',   m:'ux',   c:'#0d9488'},
                    {icon:Bug,      label:'Report a bug',      sub:'Something broken or wrong',    m:'bug',  c:'#e11d48'},
                  ].map(item=>(
                    <button key={item.m} onClick={()=>setMode(item.m)}
                      style={{display:'flex',alignItems:'center',gap:9,padding:'9px 11px',
                        borderRadius:11,background:'#f8fafc',border:'1.5px solid #e2e8f0',
                        cursor:'pointer',textAlign:'left',transition:'border-color 0.15s'}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=item.c}
                      onMouseLeave={e=>e.currentTarget.style.borderColor='#e2e8f0'}>
                      <div style={{width:30,height:30,borderRadius:8,background:`${item.c}15`,
                        display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <item.icon size={14} style={{color:item.c}}/>
                      </div>
                      <div style={{flex:1}}>
                        <p style={{fontSize:12,fontWeight:700,color:'#0f172a',margin:0}}>{item.label}</p>
                        <p style={{fontSize:10,color:'#64748b',margin:0}}>{item.sub}</p>
                      </div>
                      <ChevronRight size={12} style={{color:'#94a3b8',flexShrink:0}}/>
                    </button>
                  ))}
                </div>
              )}

              {/* RATE */}
              {mode==='rate' && (
                <div>
                  <p style={{fontSize:12,color:'#64748b',marginBottom:14,textAlign:'center'}}>
                    How would you rate this page?
                  </p>
                  <div style={{display:'flex',justifyContent:'center',gap:6,marginBottom:16}}>
                    {EMOJI_RATINGS.map(({score,icon:Ic,label,color})=>(
                      <button key={score}
                        onMouseEnter={()=>setHovered(score)}
                        onMouseLeave={()=>setHovered(0)}
                        onClick={()=>setRating(score)}
                        style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,
                          background:'none',border:'none',cursor:'pointer',padding:3}}>
                        <Ic size={26} style={{color:(hovered||rating)>=score?color:'#e2e8f0',
                          fill:(hovered||rating)>=score?color:'none',transition:'all 0.15s'}}/>
                        {rating===score&&<span style={{fontSize:9,fontWeight:700,color}}>{label}</span>}
                      </button>
                    ))}
                  </div>
                  {rating>0 && <>
                    <textarea placeholder="Any comments? (optional)" value={uxGood}
                      onChange={e=>setUxGood(e.target.value)} rows={2}
                      style={{...inp,marginBottom:8}}/>
                    <button onClick={()=>submitMut.mutate(payload('rating',{rating,label:EMOJI_RATINGS[rating-1]?.label,what_works:uxGood}))}
                      disabled={submitMut.isPending}
                      style={{width:'100%',padding:'10px',borderRadius:10,fontSize:13,fontWeight:700,
                        background:'linear-gradient(135deg,#0d9488,#0891b2)',color:'#fff',
                        border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                      {submitMut.isPending?<Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>:<Send size={13}/>}
                      Send Rating
                    </button>
                  </>}
                </div>
              )}

              {/* UX */}
              {mode==='ux' && (
                <div style={{display:'flex',flexDirection:'column',gap:9}}>
                  <div>
                    <label style={{fontSize:11,fontWeight:700,color:'#22c55e',display:'flex',alignItems:'center',gap:4,marginBottom:4}}>
                      <ThumbsUp size={11}/> What works well?
                    </label>
                    <textarea value={uxGood} onChange={e=>setUxGood(e.target.value)} rows={2}
                      placeholder="e.g. Clear navigation, fast loading..." style={inp}/>
                  </div>
                  <div>
                    <label style={{fontSize:11,fontWeight:700,color:'#ef4444',display:'flex',alignItems:'center',gap:4,marginBottom:4}}>
                      <ThumbsDown size={11}/> What could improve?
                    </label>
                    <textarea value={uxBad} onChange={e=>setUxBad(e.target.value)} rows={2}
                      placeholder="e.g. Buttons too small, confusing..." style={inp}/>
                  </div>
                  <input value={email} onChange={e=>setEmail(e.target.value)}
                    placeholder="Email (optional)" style={inp}/>
                  <button onClick={()=>submitMut.mutate(payload('ux_feedback',{what_works:uxGood,what_doesnt:uxBad}))}
                    disabled={(!uxGood&&!uxBad)||submitMut.isPending}
                    style={{width:'100%',padding:'10px',borderRadius:10,fontSize:13,fontWeight:700,
                      background:'linear-gradient(135deg,#0d9488,#0891b2)',color:'#fff',
                      border:'none',cursor:'pointer',opacity:(!uxGood&&!uxBad)?0.5:1,
                      display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                    {submitMut.isPending?<Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>:<Send size={13}/>}
                    Send Feedback
                  </button>
                </div>
              )}

              {/* BUG */}
              {mode==='bug' && (
                <div style={{display:'flex',flexDirection:'column',gap:9}}>
                  <p style={{fontSize:11,color:'#64748b',margin:0}}>
                    Page and browser info are auto-attached to your report.
                  </p>
                  <div>
                    <label style={{fontSize:11,fontWeight:700,color:'#334155',marginBottom:5,display:'block'}}>Bug type</label>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                      {BUG_TYPES.map(bt=>(
                        <button key={bt.value} onClick={()=>setBugType(bt.value)}
                          style={{padding:'4px 9px',borderRadius:999,fontSize:10,fontWeight:700,
                            border:`1.5px solid ${bugType===bt.value?bt.color:'#e2e8f0'}`,
                            background:bugType===bt.value?`${bt.color}15`:'#f8fafc',
                            color:bugType===bt.value?bt.color:'#64748b',cursor:'pointer'}}>
                          {bt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{fontSize:11,fontWeight:700,color:'#334155',marginBottom:4,display:'block'}}>
                      What happened? *
                    </label>
                    <textarea value={bugDesc} onChange={e=>setBugDesc(e.target.value)} rows={3}
                      placeholder="What were you doing? What did you expect vs what happened?"
                      style={inp}/>
                  </div>
                  <input value={email} onChange={e=>setEmail(e.target.value)}
                    placeholder="Email for updates (optional)" style={inp}/>
                  <button onClick={()=>submitMut.mutate(payload('bug_report',{bug_type:bugType,description:bugDesc}))}
                    disabled={!bugDesc.trim()||submitMut.isPending}
                    style={{width:'100%',padding:'10px',borderRadius:10,fontSize:13,fontWeight:700,
                      background:'linear-gradient(135deg,#e11d48,#dc2626)',color:'#fff',
                      border:'none',cursor:'pointer',opacity:!bugDesc.trim()?0.5:1,
                      display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                    {submitMut.isPending?<Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>:<AlertTriangle size={13}/>}
                    Report Bug
                  </button>
                </div>
              )}

              {/* DONE */}
              {mode==='done' && (
                <div style={{textAlign:'center',padding:'20px 0'}}>
                  <div style={{width:52,height:52,borderRadius:'50%',background:'#f0fdf4',
                    display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
                    <Check size={24} style={{color:'#16a34a'}}/>
                  </div>
                  <p style={{fontSize:14,fontWeight:800,color:'#0f172a',margin:'0 0 5px'}}>Thank you!</p>
                  <p style={{fontSize:12,color:'#64748b',margin:0}}>
                    Your feedback has been sent to the development team.
                  </p>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  );

  // Portal to document.body — completely outside any overflow context
  if (typeof document === 'undefined') return null;
  return createPortal(widget, document.body);
}
