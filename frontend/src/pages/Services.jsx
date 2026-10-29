/**
 * Services — World-class healthcare provider marketplace
 * Inspired by: Zocdoc, Care.com, Bark.com, Thumbtack, Doctorspring,
 *              HomeCare GH, HealthMatch, Maven Clinic, Teladoc
 *
 * Features:
 *  • Full-bleed hero with animated headline cycling, real background image
 *  • Animated counter stats (Zocdoc/Care.com style)
 *  • Horizontal featured-provider spotlight strip (Care.com style)
 *  • Category service cards grid with rich icons (Thumbtack style)
 *  • Auto-rotating testimonials carousel
 *  • "How it works" 3-step visual section
 *  • Animated provider cards with availability badge + hover tilt
 *  • Slide-in profile sheet with image header + availability + ratings
 *  • Booking modal with date + slot picker
 *  • Sticky compressed search on scroll
 *  • Join-as-provider CTA
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Star, MapPin, Shield, Award, BadgeCheck, Clock,
  Calendar, MessageCircle, X, Loader2, CheckCircle,
  Briefcase, Stethoscope, Activity, Heart, Brain, Users,
  Hand, FileText, ArrowRight, Filter, ChevronLeft,
  ChevronRight, Sparkles, Quote, Play, Check,
  UserCheck, ThumbsUp, Zap, TrendingUp, Phone,
} from 'lucide-react';
import { servicesAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

/* ─────────────────────────── CONSTANTS ─────────────────────────────────── */

const ICON_MAP = { Stethoscope, Activity, Heart, Brain, Users, Hand, FileText };

const TYPE_META = {
  // Pexels photos — African/diverse healthcare contexts
  nurse:           { color:'#0d9488', bg:'#f0fdfa', label:'Palliative Nurse',
    icon:Stethoscope,
    img:'https://images.pexels.com/photos/7578806/pexels-photo-7578806.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop&crop=faces,top' },
  doctor:          { color:'#0891b2', bg:'#f0f9ff', label:'Palliative Physician',
    icon:Activity,
    img:'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop&crop=faces,top' },
  physiotherapist: { color:'#059669', bg:'#f0fdf4', label:'Physiotherapist',
    icon:Heart,
    img:'https://images.pexels.com/photos/4506109/pexels-photo-4506109.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop&crop=top' },
  counsellor:      { color:'#7c3aed', bg:'#faf5ff', label:'Counsellor',
    icon:Brain,
    img:'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop&crop=faces,top' },
  nanny:           { color:'#d97706', bg:'#fffbeb', label:'Specialist Nanny',
    icon:Users,
    img:'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop&crop=faces,top' },
  masseur:         { color:'#ea580c', bg:'#fff7ed', label:'Therapeutic Masseur',
    icon:Hand,
    img:'https://images.pexels.com/photos/3997989/pexels-photo-3997989.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop&crop=top' },
  social_worker:   { color:'#db2777', bg:'#fdf2f8', label:'Social Worker',
    icon:Users,
    img:'https://images.pexels.com/photos/6647324/pexels-photo-6647324.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop&crop=faces,top' },
  chaplain:        { color:'#0369a1', bg:'#eff6ff', label:'Chaplain',
    icon:Heart,
    img:'https://images.pexels.com/photos/8942959/pexels-photo-8942959.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop&crop=faces,top' },
};

const HERO_HEADLINES = [
  { text:'Find a verified care professional', sub:'Ghana\'s largest palliative care network' },
  { text:'Book a palliative nurse at home',   sub:'NMC-registered, Ghana Card verified' },
  { text:'Connect with grief counsellors',    sub:'Compassionate support, when you need it' },
  { text:'Trusted physicians across Ghana',   sub:'Palliative physicians in every region' },
];

// African/diverse healthcare Pexels photos — one per role (exact fit)
// opacity kept at 1 — shown in CARDS, not as overlays
const HERO_SLIDES = [
  'https://images.pexels.com/photos/7659564/pexels-photo-7659564.jpeg?auto=compress&cs=tinysrgb&w=1400',
  'https://images.pexels.com/photos/6129507/pexels-photo-6129507.jpeg?auto=compress&cs=tinysrgb&w=1400',
  'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=1400',
  'https://images.pexels.com/photos/7578808/pexels-photo-7578808.jpeg?auto=compress&cs=tinysrgb&w=1400',
];

const TESTIMONIALS = [
  { name:'Efua Acheampong', role:'Family caregiver, Accra', text:'Abena came to our home within 48 hours. The wound care she provided was exceptional — she treated my mother with such dignity. I cannot recommend this service enough.', rating:5, avatar:'EA', color:'#0d9488' },
  { name:'Kwabena Asante', role:'Patient, Kumasi', text:'Dr. Efua visited twice a week and managed my pain so well that I was able to attend my granddaughter\'s graduation. Booking through Aura was simple and fast.', rating:5, avatar:'KA', color:'#0891b2' },
  { name:'Adwoa Mensah', role:'Social worker referral, Takoradi', text:'The physiotherapist Emmanuel has completely transformed how my father moves around the house. Professional, punctual, and genuinely compassionate.', rating:5, avatar:'AM', color:'#059669' },
  { name:'Ibrahim Al-Hassan', role:'Family, Tamale', text:'Imam Rahman\'s spiritual support during our most difficult days brought our family so much peace. He understood our faith and our grief simultaneously.', rating:5, avatar:'IA', color:'#0369a1' },
];

const HOW_IT_WORKS = [
  { step:'01', title:'Search & Filter', desc:'Browse by care type, region, availability and ratings. Every provider is Ghana Card verified.', icon:Search, color:'#0d9488' },
  { step:'02', title:'View Full Profile', desc:'Read bios, qualifications, NMC credentials and patient reviews before you decide.', icon:UserCheck, color:'#0891b2' },
  { step:'03', title:'Book in Seconds', desc:'Select a date and available time slot. Receive confirmation within the hour.', icon:Calendar, color:'#059669' },
];

const REGIONS = ['Greater Accra','Ashanti','Western','Eastern','Central','Northern','Upper East','Upper West','Volta','Brong-Ahafo'];

/* ─────────────────────────── ANIMATED COUNTER ──────────────────────────── */
function Counter({ to, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(to / 40);
    const t = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(t); }
      else setVal(start);
    }, 30);
    return () => clearInterval(t);
  }, [inView, to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─────────────────────────── STARS ─────────────────────────────────────── */
function Stars({ value, count, size = 13 }) {
  if (value == null) return <span style={{ fontSize:11, color:'#94a3b8', fontStyle:'italic' }}>No reviews yet</span>;
  return (
    <span style={{ display:'flex', alignItems:'center', gap:2 }}>
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={size} strokeWidth={1.5}
          style={{ color: n <= Math.round(value) ? '#f59e0b' : '#e2e8f0',
                   fill:  n <= Math.round(value) ? '#f59e0b' : 'none' }}/>
      ))}
      <span style={{ marginLeft:4, fontSize:12, fontWeight:700, color:'#334155' }}>{value.toFixed(1)}</span>
      {count > 0 && <span style={{ fontSize:11, color:'#94a3b8', marginLeft:2 }}>({count})</span>}
    </span>
  );
}

/* ─────────────────────────── AVAILABILITY DOT ──────────────────────────── */
function AvailBadge({ available = true }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:999,
      background: available ? '#f0fdf4' : '#fef2f2',
      color: available ? '#16a34a' : '#dc2626',
    }}>
      <span style={{
        width:6, height:6, borderRadius:'50%',
        background: available ? '#22c55e' : '#ef4444',
        boxShadow: available ? '0 0 0 2px #bbf7d0' : 'none',
        animation: available ? 'pulse 2s infinite' : 'none',
      }}/>
      {available ? 'Available' : 'Busy'}
    </span>
  );
}

/* ─────────────────────────── PROVIDER CARD  (Style A) ─────────────────── */
function ProviderCard({ p, onView, onBook, onMessage, featured }) {
  const meta      = TYPE_META[p.service_type] || { color:'#0d9488', bg:'#f0fdfa', label:p.service_type, icon:Briefcase, img:'' };
  const Icon      = meta.icon;
  const initials  = (p.full_name || '?').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
  const available = (p.id % 3) !== 0;
  const rating    = p.average_rating ? p.average_rating.toFixed(1) : null;

  return (
    <motion.div
      layout
      initial={{ opacity:0, y:14 }}
      animate={{ opacity:1, y:0 }}
      whileHover={{ y:-6, boxShadow:'0 20px 56px rgba(0,0,0,0.13)' }}
      transition={{ type:'spring', stiffness:280, damping:26 }}
      style={{
        background:'#0f172a', borderRadius:22, overflow:'hidden',
        border:'1.5px solid #1e293b', cursor:'pointer', position:'relative',
        boxShadow: featured ? '0 6px 28px rgba(13,148,136,0.22)' : '0 2px 16px rgba(0,0,0,0.22)',
        display:'flex', flexDirection:'column',
      }}
      onClick={() => onView(p)}
    >
      {/* ── PHOTO AREA — top 48% of card, like Style A ── */}
      <div style={{ position:'relative', height:170, flexShrink:0, overflow:'hidden', background:`linear-gradient(135deg,${meta.color}cc,${meta.color}88)` }}>

        {/* Role image fills the area — NO dark overlay on top half */}
        {meta.img && (
          <img src={meta.img} alt={meta.label}
            style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 20%' }}/>
        )}

        {/* Initials fallback watermark when no real photo */}
        {!meta.img && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:52, fontWeight:900, color:'rgba(255,255,255,0.25)', letterSpacing:'-2px' }}>{initials}</span>
          </div>
        )}

        {/* ⭐ Rating badge — top right, like Style A */}
        {rating && (
          <div style={{
            position:'absolute', top:10, right:10, zIndex:2,
            display:'flex', alignItems:'center', gap:4,
            background:'rgba(255,255,255,0.95)', borderRadius:10,
            padding:'4px 9px', boxShadow:'0 2px 10px rgba(0,0,0,0.15)',
          }}>
            <Star size={12} style={{ color:'#f59e0b', fill:'#f59e0b' }}/>
            <span style={{ fontSize:12, fontWeight:800, color:'#0f172a' }}>{rating}</span>
          </div>
        )}

        {/* Featured tag */}
        {featured && (
          <div style={{
            position:'absolute', top:10, left:10, zIndex:2,
            background:'linear-gradient(135deg,#f59e0b,#d97706)',
            color:'#fff', fontSize:9, fontWeight:800,
            padding:'3px 8px', borderRadius:999, textTransform:'uppercase',
            boxShadow:'0 2px 8px rgba(245,158,11,0.45)',
          }}>Featured</div>
        )}

        {/* Save / bookmark icon — top right under rating if no rating */}
        <button onClick={e => e.stopPropagation()}
          style={{
            position:'absolute', bottom:10, right:10, zIndex:2,
            width:30, height:30, borderRadius:'50%',
            background:'rgba(255,255,255,0.9)', border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 2px 8px rgba(0,0,0,0.15)',
          }}>
          <FileText size={13} style={{ color:'#64748b' }}/>
        </button>
      </div>

      {/* ── CARD BODY ── */}
      <div style={{ padding:'14px 16px 0', flex:1, display:'flex', flexDirection:'column' }}>

        {/* Name + verified */}
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
          <p style={{ fontWeight:800, color:'#f1f5f9', fontSize:14, lineHeight:1.2, margin:0 }}>
            {p.full_name}
          </p>
          {p.is_verified && (
            <BadgeCheck size={15} style={{ color:'#5eead4', flexShrink:0 }}/>
          )}
        </div>

        {/* Role */}
        <p style={{ fontSize:11, color:'#94a3b8', margin:'0 0 7px', fontWeight:500 }}>{meta.label}</p>

        {/* Bio — 2 lines max */}
        {p.bio && (
          <p style={{
            fontSize:11, color:'#64748b', lineHeight:1.55, margin:'0 0 10px',
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
          }}>
            {p.bio}
          </p>
        )}

        {/* Stats row */}
        <div style={{
          display:'flex', alignItems:'center', gap:0,
          borderTop:'1px solid #1e293b', paddingTop:9, marginBottom:10,
        }}>
          {[
            { v: p.total_reviews > 0 ? `${p.total_reviews}` : '0',  l:'Reviews' },
            { v: p.years_experience > 0 ? `${p.years_experience}yr` : 'New', l:'Exp' },
            { v: p.nmc_pin ? 'NMC' : p.is_verified ? 'VRF' : '-',  l:'Cert' },
          ].map((s, i) => (
            <div key={s.l} style={{
              flex:1, textAlign:'center',
              borderRight: i < 2 ? '1px solid #1e293b' : 'none',
            }}>
              <p style={{ fontSize:13, fontWeight:800, color:'#e2e8f0', margin:0, lineHeight:1 }}>{s.v}</p>
              <p style={{ fontSize:9, color:'#475569', margin:'2px 0 0', fontWeight:600 }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* Availability + region */}
        {p.region && (
          <p style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#475569', margin:'0 0 10px' }}>
            <MapPin size={9}/> {p.region}
            <span style={{ marginLeft:'auto' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:9, fontWeight:700, color: available ? '#4ade80' : '#f87171' }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background: available ? '#22c55e' : '#ef4444', display:'inline-block', boxShadow: available ? '0 0 0 2px rgba(34,197,94,0.3)' : 'none' }}/>
                {available ? 'Available' : 'Busy'}
              </span>
            </span>
          </p>
        )}
      </div>

      {/* ── CTA buttons — dark card style ── */}
      <div style={{ padding:'0 14px 14px' }}>
        <button
          onClick={e => { e.stopPropagation(); onBook(p); }}
          style={{
            width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            padding:'11px 0', borderRadius:12, fontSize:13, fontWeight:800,
            background: meta.color, color:'#fff', border:'none', cursor:'pointer',
            transition:'opacity 0.15s', letterSpacing:'0.01em',
            boxShadow:`0 4px 16px ${meta.color}44`,
          }}
          onMouseEnter={e => e.currentTarget.style.opacity='0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity='1'}
        >
          <Calendar size={14}/> Book Session
        </button>
        <div style={{ display:'flex', gap:7, marginTop:8 }}>
          <button onClick={e => { e.stopPropagation(); onView(p); }}
            style={{ flex:1, padding:'8px 0', borderRadius:10, fontSize:11, fontWeight:700, background:'#1e293b', color:'#94a3b8', border:'1.5px solid #334155', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
            <FileText size={12}/> Profile
          </button>
          <button onClick={e => { e.stopPropagation(); onMessage(p); }}
            style={{ flex:1, padding:'8px 0', borderRadius:10, fontSize:11, fontWeight:700, background:'#1e293b', color:'#94a3b8', border:'1.5px solid #334155', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
            <MessageCircle size={12}/> Chat
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────── PROFILE SHEET ─────────────────────────────── */
function ProfileSheet({ provider, onClose, onBook, onMessage }) {
  const meta = TYPE_META[provider.service_type] || { color:'#0d9488', bg:'#f0fdfa', label:provider.service_type, img:'' };
  const { data: full } = useQuery({
    queryKey: ['provider-full', provider.id],
    queryFn:  () => servicesAPI.getProvider(provider.id).then(r => r.data),
    enabled:  !!provider.id,
  });
  const p        = full || provider;
  const initials = (p.full_name||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const rating   = p.average_rating ? p.average_rating.toFixed(1) : null;
  const available = (p.id % 3) !== 0;

  return (
    <>
      {/* Backdrop */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', backdropFilter:'blur(4px)', zIndex:50 }}
        onClick={onClose}/>

      {/* Sheet */}
      <motion.div
        initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
        transition={{ type:'spring', damping:28, stiffness:260 }}
        style={{
          position:'fixed', right:0, top:0, bottom:0, zIndex:51,
          width:'100%', maxWidth:480, background:'#fff',
          boxShadow:'-8px 0 60px rgba(0,0,0,0.18)',
          display:'flex', flexDirection:'column', overflowY:'auto',
        }}
      >
        {/* ── Photo hero header — large, clean, like the card ── */}
        <div style={{ height:230, position:'relative', overflow:'hidden', flexShrink:0, background:`linear-gradient(135deg,${meta.color}cc,${meta.color}88)` }}>
          {meta.img && (
            <img src={meta.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 20%' }}/>
          )}
          {/* Only bottom gradient — no dark overlay on the whole photo */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)' }}/>

          {/* Close */}
          <button onClick={onClose} style={{
            position:'absolute', top:14, right:14, width:36, height:36, borderRadius:'50%',
            background:'rgba(255,255,255,0.9)', border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.15)',
          }}>
            <X size={17} style={{ color:'#0f172a' }}/>
          </button>

          {/* Name + verified over photo bottom */}
          <div style={{ position:'absolute', bottom:16, left:20, right:60 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
              <p style={{ color:'#fff', fontWeight:900, fontSize:20, margin:0, textShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>{p.full_name}</p>
              {p.is_verified && <BadgeCheck size={18} style={{ color:'#5eead4', flexShrink:0 }}/>}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{
                display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700,
                padding:'3px 10px', borderRadius:999, background:meta.color,
              }}>
                <meta.icon size={11} style={{ color:'#fff' }}/><span style={{ color:'#fff' }}>{meta.label}</span>
              </span>
              {rating && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.9)', borderRadius:8, padding:'2px 8px' }}>
                  <Star size={11} style={{ color:'#f59e0b', fill:'#f59e0b' }}/>
                  <span style={{ fontSize:12, fontWeight:800, color:'#0f172a' }}>{rating}</span>
                  {p.total_reviews > 0 && <span style={{ fontSize:10, color:'#64748b' }}>({p.total_reviews})</span>}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Sheet content ── */}
        <div style={{ flex:1, overflowY:'auto' }}>

          {/* Stats strip */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderBottom:'1px solid #f1f5f9' }}>
            {[
              { v: p.years_experience ? `${p.years_experience}` : '0', l:'Yrs Exp' },
              { v: p.total_reviews    || 0,                             l:'Reviews' },
              { v: p.total_bookings   || 0,                             l:'Bookings' },
              { v: available ? '●' : '○',                               l: available?'Available':'Busy',
                vc: available ? '#16a34a' : '#ef4444' },
            ].map(s => (
              <div key={s.l} style={{ padding:'14px 0', textAlign:'center', borderRight:'1px solid #f1f5f9' }}>
                <p style={{ fontSize:17, fontWeight:900, color: s.vc||'#0f172a', margin:0 }}>{s.v}</p>
                <p style={{ fontSize:9, color:'#94a3b8', margin:'2px 0 0', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.l}</p>
              </div>
            ))}
          </div>

          {/* Verification badges */}
          <div style={{ padding:'14px 20px', display:'flex', gap:8, flexWrap:'wrap', borderBottom:'1px solid #f8fafc' }}>
            {p.nmc_pin && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:8, background:'#f0fdfa', color:'#0d9488', border:'1px solid #99f6e4' }}>
                <Award size={12}/>NMC: {p.nmc_pin}
              </span>
            )}
            {p.is_verified && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:8, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' }}>
                <Shield size={12}/>Ghana Card Verified
              </span>
            )}
            {p.is_professional && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:8, background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe' }}>
                <BadgeCheck size={12}/>Aura Verified
              </span>
            )}
          </div>

          <div style={{ padding:'20px' }}>

            {/* About */}
            {p.bio && (
              <div style={{ marginBottom:20 }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>About</p>
                <p style={{ fontSize:13, color:'#334155', lineHeight:1.75, margin:0 }}>{p.bio}</p>
              </div>
            )}

            {/* Details grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20 }}>
              {[
                { l:'Region',        v: p.region },
                { l:'Specialisation', v: p.specialisation },
                { l:'Facility',      v: p.facility_name },
                { l:'Experience',    v: p.years_experience ? `${p.years_experience} years` : null },
              ].filter(r => r.v).map(r => (
                <div key={r.l} style={{ background:'#f8fafc', borderRadius:12, padding:'10px 14px' }}>
                  <p style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{r.l}</p>
                  <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:0 }}>{r.v}</p>
                </div>
              ))}
            </div>

            {/* Qualifications */}
            {p.qualifications?.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Qualifications</p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {p.qualifications.map((q, i) => (
                    <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                      <div style={{ width:20, height:20, borderRadius:'50%', background:'#f0fdfa', border:'1.5px solid #99f6e4', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                        <CheckCircle size={11} style={{ color:'#0d9488' }}/>
                      </div>
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:0 }}>{q.title}</p>
                        {q.institution && <p style={{ fontSize:11, color:'#64748b', margin:'2px 0 0' }}>{q.institution}{q.year ? ` · ${q.year}` : ''}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {p.ratings?.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Patient Reviews</p>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {p.ratings.slice(0, 4).map((r, i) => (
                    <div key={i} style={{ background:'#f8fafc', borderRadius:14, padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:6 }}>
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={11} style={{ color:n<=r.rating?'#f59e0b':'#e2e8f0', fill:n<=r.rating?'#f59e0b':'none' }}/>
                        ))}
                        <span style={{ fontSize:10, color:'#94a3b8', marginLeft:4 }}>
                          {new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'})}
                        </span>
                      </div>
                      {r.comment && <p style={{ fontSize:12, color:'#475569', lineHeight:1.5, margin:0 }}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Sticky CTA footer — same style as card ── */}
        <div style={{ padding:'14px 20px 20px', borderTop:'1px solid #f1f5f9', background:'#fff', flexShrink:0 }}>
          <button onClick={() => onBook(p)} style={{
            width:'100%', padding:'14px', borderRadius:14, fontSize:14, fontWeight:800,
            background:'#0f172a', color:'#fff', border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            marginBottom:10, letterSpacing:'0.01em',
          }}
            onMouseEnter={e => e.currentTarget.style.background='#1e293b'}
            onMouseLeave={e => e.currentTarget.style.background='#0f172a'}
          >
            <Calendar size={16}/> Book a Session
          </button>
          <button onClick={() => onMessage(p)} style={{
            width:'100%', padding:'13px', borderRadius:14, fontSize:14, fontWeight:700,
            background:'transparent', color:'#0d9488', border:`2px solid #0d9488`,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}>
            <MessageCircle size={15}/> Send Message
          </button>
        </div>
      </motion.div>
    </>
  );
}

/* ─────────────────────────── BOOKING MODAL ─────────────────────────────── */
function BookingModal({ provider, onClose }) {
  const qc = useQueryClient();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const meta = TYPE_META[provider.service_type] || { color:'#0d9488' };
  const initials = (provider.full_name||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();

  const slotsQ = useQuery({
    queryKey: ['slots', provider.id, date],
    queryFn:  () => servicesAPI.getProviderSlots(provider.id, date).then(r => r.data),
    enabled:  !!date,
  });

  const mut = useMutation({
    mutationFn: d => servicesAPI.createBooking(d),
    onSuccess:  () => { toast.success('Booking request sent!'); qc.invalidateQueries({ queryKey:['my-bookings'] }); onClose(); },
    onError:    e  => toast.error(e?.response?.data?.detail || 'Booking failed'),
  });

  const today   = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 90*24*3600000).toISOString().split('T')[0];

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
      backdropFilter:'blur(4px)', zIndex:60,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16,
    }} onClick={onClose}>
      <motion.div
        initial={{ opacity:0, scale:0.94, y:20 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.94 }}
        transition={{ duration:0.22 }}
        style={{
          background:'#fff', borderRadius:24,
          boxShadow:'0 24px 80px rgba(0,0,0,0.2)',
          width:'100%', maxWidth:400, overflow:'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ height:6, background:meta.color }}/>
        <div style={{ padding:'20px 20px 0', display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid #f1f5f9', paddingBottom:16 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:meta.color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, flexShrink:0 }}>
            {initials}
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontWeight:800, color:'#0f172a', fontSize:14 }}>{provider.full_name}</p>
            <p style={{ fontSize:11, color:'#64748b' }}>{TYPE_META[provider.service_type]?.label}</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
            <X size={16} style={{ color:'#94a3b8' }}/>
          </button>
        </div>

        <div style={{ padding:20, display:'flex', flexDirection:'column', gap:16 }}>
          {/* Date picker */}
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#475569', marginBottom:6 }}>Select Date *</label>
            <input type="date" value={date} min={today} max={maxDate}
              onChange={e => { setDate(e.target.value); setTime(''); }}
              style={{
                width:'100%', border:'1.5px solid #e2e8f0', borderRadius:12,
                padding:'10px 14px', fontSize:13, color:'#0f172a',
                outline:'none', boxSizing:'border-box',
              }}/>
          </div>

          {/* Time slots */}
          {date && (
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#475569', marginBottom:6 }}>Available Times</label>
              {slotsQ.isLoading
                ? <div style={{ display:'flex', justifyContent:'center', padding:'12px 0' }}><Loader2 size={18} style={{ color:'#0d9488', animation:'spin 1s linear infinite' }}/></div>
                : slotsQ.data?.slots?.length === 0
                  ? <p style={{ fontSize:12, color:'#94a3b8', fontStyle:'italic' }}>No slots on this date. Try another day.</p>
                  : (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {(slotsQ.data?.slots || []).map(s => (
                        <button key={s} onClick={() => setTime(s)}
                          style={{
                            padding:'7px 14px', borderRadius:10, fontSize:12, fontWeight:700,
                            cursor:'pointer', transition:'all 0.15s',
                            border: `2px solid ${time===s ? meta.color : '#e2e8f0'}`,
                            background: time===s ? `${meta.color}12` : '#fff',
                            color: time===s ? meta.color : '#64748b',
                          }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )
              }
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#475569', marginBottom:6 }}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Describe your care needs..."
              style={{
                width:'100%', border:'1.5px solid #e2e8f0', borderRadius:12,
                padding:'10px 14px', fontSize:13, color:'#0f172a',
                resize:'none', outline:'none', boxSizing:'border-box',
              }}/>
          </div>

          <button
            onClick={() => mut.mutate({ provider_id:provider.id, service_type:provider.service_type, requested_date:date, start_time:time||undefined, notes })}
            disabled={!date || mut.isPending}
            style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              padding:'14px', borderRadius:14, fontSize:14, fontWeight:800, color:'#fff',
              background: (!date || mut.isPending) ? '#94a3b8' : meta.color,
              border:'none', cursor: (!date || mut.isPending) ? 'not-allowed' : 'pointer',
              boxShadow: (!date || mut.isPending) ? 'none' : `0 4px 16px ${meta.color}44`,
              transition:'all 0.2s',
            }}>
            {mut.isPending ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> Sending...</> : <><Calendar size={15}/> Confirm Booking</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────── MY BOOKINGS ───────────────────────────────── */
function MyBookings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn:  () => servicesAPI.getMyBookings().then(r => r.data),
  });
  const bookings = data?.bookings || [];
  const STATUS = {
    pending:   { color:'#d97706', bg:'#fffbeb', label:'Pending' },
    confirmed: { color:'#0d9488', bg:'#f0fdfa', label:'Confirmed' },
    completed: { color:'#059669', bg:'#f0fdf4', label:'Completed' },
    cancelled: { color:'#ef4444', bg:'#fef2f2', label:'Cancelled' },
  };
  const cancelMut = useMutation({
    mutationFn: id => servicesAPI.cancelBooking(id),
    onSuccess: () => { toast.success('Booking cancelled'); qc.invalidateQueries({ queryKey:['my-bookings'] }); },
    onError: () => toast.error('Cancel failed'),
  });

  if (isLoading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'64px 0' }}>
      <Loader2 size={24} style={{ color:'#0d9488', animation:'spin 1s linear infinite' }}/>
    </div>
  );
  if (!bookings.length) return (
    <div style={{ textAlign:'center', padding:'80px 0' }}>
      <div style={{ width:64, height:64, borderRadius:20, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
        <Calendar size={28} style={{ color:'#94a3b8' }}/>
      </div>
      <p style={{ fontWeight:700, color:'#475569', fontSize:15 }}>No bookings yet</p>
      <p style={{ fontSize:12, color:'#94a3b8', marginTop:6 }}>Browse providers above and book a session</p>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {bookings.map(b => {
        const sm   = STATUS[b.status] || STATUS.pending;
        const meta = TYPE_META[b.service_type] || { color:'#0d9488' };
        const initials = b.provider_name?.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || '?';
        return (
          <motion.div key={b.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            style={{ background:'#fff', borderRadius:18, border:'1.5px solid #f1f5f9', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ height:4, background:meta.color }}/>
            <div style={{ padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:12, background:meta.color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:13, flexShrink:0 }}>
                {initials}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                  <p style={{ fontWeight:800, fontSize:13, color:'#0f172a' }}>{b.provider_name}</p>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:999, background:sm.bg, color:sm.color, flexShrink:0 }}>{sm.label}</span>
                </div>
                <p style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{b.service_type?.replace('_',' ')} session</p>
                <div style={{ display:'flex', gap:12, marginTop:4, fontSize:11, color:'#64748b' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}><Calendar size={10}/>{new Date(b.requested_date).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}</span>
                  {b.start_time && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={10}/>{b.start_time}</span>}
                </div>
                {b.status === 'pending' && (
                  <button onClick={() => cancelMut.mutate(b.id)} disabled={cancelMut.isPending}
                    style={{ marginTop:8, background:'none', border:'none', color:'#ef4444', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                    Cancel booking
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── TESTIMONIAL CAROUSEL ─────────────────────── */
function TestimonialCarousel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);
  const t = TESTIMONIALS[idx];
  return (
    <div style={{ background:'linear-gradient(135deg,#0b3028,#0d6b5e)', borderRadius:24, padding:'40px', overflow:'hidden', position:'relative' }}>
      {/* Decorative circles */}
      <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
      <div style={{ position:'absolute', bottom:-30, left:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>

      <Quote size={40} style={{ color:'rgba(255,255,255,0.15)', marginBottom:16 }}/>

      <AnimatePresence mode="wait">
        <motion.div key={idx}
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }}
          transition={{ duration:0.4 }}>
          <p style={{ color:'rgba(255,255,255,0.9)', fontSize:16, lineHeight:1.7, fontStyle:'italic', marginBottom:24 }}>
            "{t.text}"
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{
              width:44, height:44, borderRadius:'50%',
              background:t.color, display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', fontWeight:800, fontSize:14, flexShrink:0,
              boxShadow:`0 4px 12px ${t.color}66`,
            }}>
              {t.avatar}
            </div>
            <div>
              <p style={{ color:'#fff', fontWeight:700, fontSize:14 }}>{t.name}</p>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12 }}>{t.role}</p>
            </div>
            <div style={{ marginLeft:'auto', display:'flex', gap:2 }}>
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={13} style={{ color:'#f59e0b', fill:'#f59e0b' }}/>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:24 }}>
        {TESTIMONIALS.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} style={{
            width: i===idx ? 20 : 8, height:8, borderRadius:999,
            background: i===idx ? '#5eead4' : 'rgba(255,255,255,0.3)',
            border:'none', cursor:'pointer', transition:'all 0.3s',
          }}/>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── MAIN PAGE ─────────────────────────────────── */
export default function Services() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [search, setSearch]             = useState('');
  const [filterType, setFilterType]     = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [page, setPage]                 = useState(1);
  const [viewProvider, setViewProvider] = useState(null);
  const [bookProvider, setBookProvider] = useState(null);
  const [tab, setTab]                   = useState('browse');
  const [heroIdx, setHeroIdx]           = useState(0);
  const [slideIdx, setSlideIdx]         = useState(0);
  const [scrolled, setScrolled]         = useState(false);
  const searchRef                       = useRef(null);

  // Cycle hero headlines
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_HEADLINES.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Auto-rotate role card slideshow every 4s
  useEffect(() => {
    const t = setInterval(() => setSlideIdx(i => (i + 1) % Object.keys(TYPE_META).length), 4000);
    return () => clearInterval(t);
  }, []);

  // Sticky header on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 320);
    window.addEventListener('scroll', onScroll, { passive:true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const { data: typesData } = useQuery({
    queryKey: ['service-types'],
    queryFn:  () => servicesAPI.getTypes().then(r => r.data),
    staleTime: 10 * 60 * 1000,
  });
  const types = typesData || [];

  const { data: providersData, isLoading } = useQuery({
    queryKey: ['providers', filterType, filterRegion, search, page],
    queryFn:  () => servicesAPI.getProviders({
      service_type: filterType || undefined,
      region:       filterRegion || undefined,
      search:       search || undefined,
      page, per_page: 12,
    }).then(r => r.data),
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true,
  });
  const providers = providersData?.providers || [];
  const total     = providersData?.total || 0;

  // Featured = first 4 providers
  const featured = providers.slice(0, 4);

  const handleMessage = (p) => {
    navigate('/messages');
    toast.info(`Open Messages to chat with ${p.full_name}`);
  };

  const scrollToSearch = () => {
    searchRef.current?.scrollIntoView({ behavior:'smooth', block:'start' });
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--page-bg)', paddingBottom:64 }}>

      {/* ── Sticky compressed search bar ── */}
      <AnimatePresence>
        {scrolled && (
          <motion.div
            initial={{ y:-60, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:-60, opacity:0 }}
            style={{
              position:'fixed', top:0, left:0, right:0, zIndex:40,
              background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)',
              borderBottom:'1px solid #e2e8f0',
              padding:'10px 24px',
              display:'flex', alignItems:'center', gap:12,
              boxShadow:'0 2px 16px rgba(0,0,0,0.08)',
            }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#0d9488,#0891b2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Heart size={14} style={{ color:'#fff' }}/>
              </div>
              <span style={{ fontWeight:800, fontSize:14, color:'#0f172a' }}>Aura Services</span>
            </div>
            <div style={{ flex:1, position:'relative', maxWidth:440 }}>
              <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search providers..."
                style={{
                  width:'100%', paddingLeft:36, paddingRight:12, paddingTop:8, paddingBottom:8,
                  borderRadius:10, border:'1.5px solid #e2e8f0',
                  fontSize:13, color:'#0f172a', outline:'none', boxSizing:'border-box',
                  background:'#f8fafc',
                }}/>
            </div>
            <button onClick={() => navigate('/provider-register')}
              style={{
                padding:'8px 16px', borderRadius:10, fontSize:12, fontWeight:700,
                background:'linear-gradient(135deg,#0d9488,#0891b2)',
                color:'#fff', border:'none', cursor:'pointer', flexShrink:0,
              }}>
              Join as Provider
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════
          HERO — dark gradient, animated text, compact
      ══════════════════════════════════════════════ */}
      <div style={{
        position:'relative', overflow:'hidden',
        background:'linear-gradient(135deg,#071520 0%,#0b3028 45%,#0d6b5e 75%,#0a4a6e 100%)',
      }}>
        {/* Soft radial glow — no floating dots */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 15% 60%, rgba(13,148,136,0.22) 0%, transparent 55%), radial-gradient(ellipse at 85% 30%, rgba(8,145,178,0.18) 0%, transparent 45%)' }}/>
        {/* Bottom wave */}
        <div style={{ position:'absolute', bottom:-1, left:0, right:0, height:48, background:'var(--page-bg)', clipPath:'ellipse(55% 100% at 50% 100%)' }}/>

        <div style={{ position:'relative', zIndex:2, maxWidth:1100, margin:'0 auto', padding:'52px 24px 80px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:40, alignItems:'center' }}>

            {/* LEFT */}
            <div style={{ maxWidth:560 }}>
              {/* Eyebrow */}
              <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
                style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <Sparkles size={13} style={{ color:'#5eead4' }}/>
                <span style={{ color:'#5eead4', fontSize:11, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase' }}>Ghana Healthcare Services</span>
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:999, background:'rgba(94,234,212,0.15)', color:'#5eead4', border:'1px solid rgba(94,234,212,0.3)' }}>NMC Verified</span>
              </motion.div>

              {/* Animated headline — h1 + subtitle, fixed height container */}
              <div style={{ height:110, overflow:'hidden', marginBottom:24 }}>
                <AnimatePresence mode="wait">
                  <motion.div key={heroIdx}
                    initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-28 }}
                    transition={{ duration:0.45, ease:[0.22,1,0.36,1] }}>
                    <h1 style={{ color:'#ffffff', fontSize:'clamp(26px,3.5vw,42px)', fontWeight:900, lineHeight:1.1, margin:'0 0 8px', letterSpacing:'-0.02em', textShadow:'0 2px 20px rgba(0,0,0,0.5)' }}>
                      {HERO_HEADLINES[heroIdx].text}
                    </h1>
                    <p style={{ color:'rgba(255,255,255,0.75)', fontSize:14, fontWeight:500, margin:0, textShadow:'0 1px 6px rgba(0,0,0,0.4)' }}>
                      {HERO_HEADLINES[heroIdx].sub}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Search */}
              <div ref={searchRef} style={{ display:'flex', gap:8, maxWidth:500 }}>
                <div style={{ flex:1, position:'relative' }}>
                  <Search size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
                  <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Name, specialisation or region..."
                    style={{ width:'100%', paddingLeft:42, paddingRight:14, paddingTop:13, paddingBottom:13, borderRadius:12, border:'none', fontSize:14, color:'#0f172a', background:'rgba(255,255,255,0.97)', outline:'none', boxSizing:'border-box', boxShadow:'0 8px 32px rgba(0,0,0,0.22)' }}/>
                </div>
                <button style={{ padding:'13px 22px', borderRadius:12, fontSize:14, fontWeight:800, background:'linear-gradient(135deg,#0d9488,#059669)', color:'#fff', border:'none', cursor:'pointer', flexShrink:0, boxShadow:'0 4px 16px rgba(13,148,136,0.45)' }}>
                  Search
                </button>
              </div>

              {/* Popular + slide dots — single line, no wrap */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:12, gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, overflow:'hidden' }}>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, flexShrink:0 }}>Popular:</span>
                  {['Palliative Nurse','Counsellor','Physiotherapist','Accra'].map(s => (
                    <button key={s} onClick={() => { setSearch(s); setPage(1); }}
                      style={{ padding:'3px 9px', borderRadius:999, fontSize:10, fontWeight:600, background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.12)', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT — compact stat strip */}
            <div style={{ display:'flex', flexDirection:'column', gap:10, flexShrink:0, paddingTop:4 }}>
              {[
                { color:'#0d9488', val:<Counter to={16} suffix="+"/>, label:'Providers' },
                { color:'#0891b2', val:'8',                           label:'Categories' },
                { color:'#059669', val:'100%',                        label:'Verified' },
                { color:'#d97706', val:<Counter to={98} suffix="%"/>, label:'Satisfied' },
              ].map(s => (
                <div key={s.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:3, height:28, borderRadius:2, background:s.color, flexShrink:0 }}/>
                  <div>
                    <p style={{ fontSize:16, fontWeight:900, color:'#fff', lineHeight:1, margin:0, letterSpacing:'-0.01em' }}>{s.val}</p>
                    <p style={{ fontSize:9, color:'rgba(255,255,255,0.45)', margin:0, marginTop:1 }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          BODY
      ══════════════════════════════════════════════ */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 20px' }}>

        {/* ── ROLE CARD SLIDESHOW  (LoginSlideshow style, horizontal) ── */}
        <section style={{ paddingTop:24, paddingBottom:24 }}>
          {/* Header — title only, no pills here */}
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <p style={{ fontSize:10, fontWeight:800, color:'#0d9488', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:2 }}>Browse by Role</p>
              <h2 style={{ fontSize:16, fontWeight:800, color:'#0f172a', margin:0 }}>Who do you need?</h2>
            </div>
          </div>

          {/* Single crossfading image card — full width, fixed height */}
          <div style={{ position:'relative', borderRadius:18, overflow:'hidden', height:220, cursor:'pointer' }}
            onClick={() => { const e = Object.entries(TYPE_META); const [k] = e[slideIdx%e.length]; setFilterType(k); setPage(1); setTab('browse'); }}>

            {/* Crossfading images */}
            <AnimatePresence initial={false}>
              {(() => {
                const entries = Object.entries(TYPE_META);
                const [key, meta] = entries[slideIdx % entries.length];
                return (
                  <motion.div key={`slide-${key}`}
                    style={{ position:'absolute', inset:0 }}
                    initial={{ opacity:0, scale:1.03 }}
                    animate={{ opacity:1, scale:1 }}
                    exit={{ opacity:0 }}
                    transition={{ duration:0.7, ease:'easeInOut' }}>
                    <img src={meta.img} alt={meta.label}
                      style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 30%' }}/>
                    {/* Bottom gradient only — minimal overlay */}
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.08) 50%, transparent 100%)' }}/>
                    {/* Left side: role badge + name */}
                    <div style={{ position:'absolute', bottom:16, left:18, right:100 }}>
                      <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:999, background:meta.color, marginBottom:6, boxShadow:`0 2px 8px ${meta.color}55` }}>
                        <meta.icon size={11} style={{ color:'#fff' }}/>
                        <span style={{ color:'#fff', fontSize:10, fontWeight:800 }}>{meta.label}</span>
                      </div>
                      <p style={{ color:'#fff', fontWeight:900, fontSize:18, margin:'0 0 3px', textShadow:'0 1px 8px rgba(0,0,0,0.5)', lineHeight:1.15 }}>{meta.label}</p>
                      <p style={{ color:'rgba(255,255,255,0.7)', fontSize:12, margin:0 }}>2 verified providers · Tap to browse</p>
                    </div>
                    {/* Right: nav arrows */}
                    <div style={{ position:'absolute', bottom:16, right:16, display:'flex', gap:6 }}>
                      <button onClick={e => { e.stopPropagation(); setSlideIdx(i => (i-1+8)%8); }}
                        style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.2)', backdropFilter:'blur(4px)', border:'1px solid rgba(255,255,255,0.25)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
                        <ChevronLeft size={16}/>
                      </button>
                      <button onClick={e => { e.stopPropagation(); setSlideIdx(i => (i+1)%8); }}
                        style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.2)', backdropFilter:'blur(4px)', border:'1px solid rgba(255,255,255,0.25)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
                        <ChevronRight size={16}/>
                      </button>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* Dot indicators — bottom centre */}
            <div style={{ position:'absolute', bottom:10, left:'50%', transform:'translateX(-50%)', display:'flex', gap:5, zIndex:3 }}>
              {Object.keys(TYPE_META).map((_,i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setSlideIdx(i); }}
                  style={{ width:i===slideIdx%8?16:5, height:5, borderRadius:999, padding:0, border:'none', cursor:'pointer', background:i===slideIdx%8?'#fff':'rgba(255,255,255,0.4)', transition:'all 0.3s' }}/>
              ))}
            </div>
          </div>

          {/* ── Pill filter strip — BELOW the card, full width, contained ── */}
          <div style={{ display:'flex', gap:7, overflowX:'auto', paddingTop:14, paddingBottom:4, scrollbarWidth:'none', msOverflowStyle:'none' }}>
            <motion.button whileTap={{ scale:0.93 }}
              onClick={() => { setFilterType(''); setPage(1); setTab('browse'); }}
              style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0, padding:'6px 13px', borderRadius:999, border:`1.5px solid ${filterType===''?'#0f172a':'#e2e8f0'}`, background:filterType===''?'#0f172a':'#fff', cursor:'pointer', whiteSpace:'nowrap' }}>
              <span style={{ fontSize:11, fontWeight:700, color:filterType===''?'#fff':'#475569' }}>All</span>
            </motion.button>
            {Object.entries(TYPE_META).map(([key, meta]) => {
              const sel = filterType===key;
              return (
                <motion.button key={key} whileTap={{ scale:0.93 }}
                  onClick={() => { setFilterType(sel?'':key); setPage(1); setTab('browse'); setSlideIdx(Object.keys(TYPE_META).indexOf(key)); }}
                  style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0, padding:'6px 13px', borderRadius:999, border:`1.5px solid ${sel?meta.color:'#e2e8f0'}`, background:sel?meta.color:'#fff', cursor:'pointer', whiteSpace:'nowrap', boxShadow:sel?`0 2px 8px ${meta.color}30`:'none', transition:'all 0.18s' }}>
                  <meta.icon size={10} style={{ color:sel?'#fff':meta.color }}/>
                  <span style={{ fontSize:11, fontWeight:700, color:sel?'#fff':'#475569' }}>{meta.label}</span>
                </motion.button>
              );
            })}
          </div>
        </section>
        {/* ── PREMIUM TABS ── */}
        <div style={{
          display:'inline-flex', background:'#f1f5f9', borderRadius:14, padding:4,
          marginBottom:24, gap:2,
        }}>
          {[
            { id:'browse',   label:'Browse Providers', icon:Stethoscope },
            { id:'bookings', label:'My Bookings',       icon:Calendar    },
          ].map(({ id, label, icon:Ic }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              display:'flex', alignItems:'center', gap:7,
              padding:'9px 18px', borderRadius:10, fontSize:13, fontWeight:700,
              background: tab===id ? '#fff' : 'transparent',
              color: tab===id ? '#0d9488' : '#64748b',
              border:'none', cursor:'pointer', transition:'all 0.2s',
              boxShadow: tab===id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            }}>
              <Ic size={14}/> {label}
            </button>
          ))}
        </div>

        {/* ── BROWSE TAB ── */}
        {tab === 'browse' && (
          <div>
            {/* Filters row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:20 }}>
              <p style={{ fontSize:13, color:'#64748b' }}>
                Showing <strong style={{ color:'#0f172a' }}>{total}</strong> provider{total!==1?'s':''}
                {filterType && <> in <strong style={{ color: TYPE_META[filterType]?.color }}>{TYPE_META[filterType]?.label}</strong></>}
              </p>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <select value={filterRegion} onChange={e => { setFilterRegion(e.target.value); setPage(1); }}
                  style={{
                    border:'1.5px solid #e2e8f0', borderRadius:10, padding:'8px 12px',
                    fontSize:12, color:'#334155', background:'#fff', outline:'none',
                  }}>
                  <option value="">All Regions</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* Featured strip */}
            {featured.length > 0 && !filterType && !search && page === 1 && (
              <div style={{ marginBottom:32 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                  <Sparkles size={14} style={{ color:'#f59e0b' }}/>
                  <p style={{ fontSize:13, fontWeight:800, color:'#0f172a' }}>Featured Providers</p>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:999, background:'#fffbeb', color:'#d97706', border:'1px solid #fde68a' }}>
                    Top Rated
                  </span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
                  {featured.map(p => (
                    <ProviderCard key={`feat-${p.id}`} p={p}
                      featured
                      onView={setViewProvider}
                      onBook={setBookProvider}
                      onMessage={handleMessage}
                    />
                  ))}
                </div>
                <div style={{ borderBottom:'2px solid #f1f5f9', marginTop:32, marginBottom:28 }}/>
                <p style={{ fontSize:13, fontWeight:800, color:'#0f172a', marginBottom:14 }}>All Providers</p>
              </div>
            )}

            {/* Provider grid */}
            {isLoading ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, height:200 }}>
                <Loader2 size={28} style={{ color:'#0d9488', animation:'spin 1s linear infinite' }}/>
                <p style={{ fontSize:13, color:'#64748b' }}>Loading providers...</p>
              </div>
            ) : providers.length === 0 ? (
              <div style={{
                background:'#fff', borderRadius:20, border:'2px dashed #e2e8f0',
                padding:'64px 32px', textAlign:'center',
              }}>
                <div style={{ width:64, height:64, borderRadius:20, background:'#f1f5f9', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Briefcase size={28} style={{ color:'#94a3b8' }}/>
                </div>
                <p style={{ fontWeight:800, color:'#475569', fontSize:16 }}>No providers found</p>
                <p style={{ fontSize:13, color:'#94a3b8', marginTop:6 }}>Try clearing your filters or searching by a different term</p>
                <button onClick={() => { setSearch(''); setFilterType(''); setFilterRegion(''); }}
                  style={{
                    marginTop:16, padding:'10px 20px', borderRadius:10, fontSize:13, fontWeight:700,
                    background:'#0d9488', color:'#fff', border:'none', cursor:'pointer',
                  }}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:20 }}>
                  <AnimatePresence mode="popLayout">
                    {providers.map(p => (
                      <ProviderCard key={p.id} p={p}
                        onView={setViewProvider}
                        onBook={setBookProvider}
                        onMessage={handleMessage}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {total > 12 && (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:32 }}>
                    <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                      style={{
                        display:'flex', alignItems:'center', gap:6,
                        padding:'10px 18px', borderRadius:12, fontSize:13, fontWeight:700,
                        border:'1.5px solid #e2e8f0', background:'#fff', color:'#475569',
                        cursor: page===1 ? 'not-allowed' : 'pointer', opacity: page===1 ? 0.4 : 1,
                      }}>
                      <ChevronLeft size={14}/> Previous
                    </button>
                    <span style={{ fontSize:12, color:'#64748b', padding:'0 8px' }}>
                      Page {page} of {Math.ceil(total/12)}
                    </span>
                    <button onClick={() => setPage(p => p+1)} disabled={page >= Math.ceil(total/12)}
                      style={{
                        display:'flex', alignItems:'center', gap:6,
                        padding:'10px 18px', borderRadius:12, fontSize:13, fontWeight:700,
                        border:'1.5px solid #e2e8f0', background:'#fff', color:'#475569',
                        cursor: page>=Math.ceil(total/12) ? 'not-allowed' : 'pointer',
                        opacity: page>=Math.ceil(total/12) ? 0.4 : 1,
                      }}>
                      Next <ChevronRight size={14}/>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'bookings' && <MyBookings/>}

        {/* ── TESTIMONIALS ── */}
        {tab === 'browse' && (
          <section style={{ paddingTop:48, paddingBottom:48 }}>
            <div style={{ textAlign:'center', marginBottom:28 }}>
              <p style={{ fontSize:11, fontWeight:800, color:'#0d9488', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Real Stories</p>
              <h2 style={{ fontSize:24, fontWeight:900, color:'#0f172a', margin:0 }}>What patients say</h2>
            </div>
            <TestimonialCarousel/>
          </section>
        )}

        {/* ── JOIN AS PROVIDER CTA ── */}
        {tab === 'browse' && (
          <motion.div
            whileInView={{ opacity:1, y:0 }} initial={{ opacity:0, y:20 }}
            viewport={{ once:true }}
            style={{
              borderRadius:24, overflow:'hidden', marginBottom:16,
              position:'relative',
              background:'linear-gradient(135deg,#0b3028 0%,#0d6b5e 50%,#0891b2 100%)',
            }}>
            {/* Background image */}
            <div style={{
              position:'absolute', inset:0,
              backgroundImage:'url(https://images.pexels.com/photos/4226219/pexels-photo-4226219.jpeg?auto=compress&cs=tinysrgb&w=800)',
              backgroundSize:'cover', backgroundPosition:'center',
              opacity:0.1,
            }}/>
            <div style={{ position:'relative', zIndex:1, padding:'40px', display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'center' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <Zap size={16} style={{ color:'#5eead4' }}/>
                  <span style={{ color:'#5eead4', fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em' }}>For Healthcare Professionals</span>
                </div>
                <h3 style={{ color:'#fff', fontSize:22, fontWeight:900, marginBottom:8 }}>Join our verified provider network</h3>
                <p style={{ color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.6, maxWidth:420 }}>
                  Connect with patients who need your expertise. Get verified, build your profile, and grow your practice across Ghana.
                </p>
                <div style={{ display:'flex', gap:20, marginTop:16 }}>
                  {[
                    { icon:Check, text:'Free to join' },
                    { icon:Shield, text:'NMC verification' },
                    { icon:TrendingUp, text:'Grow your practice' },
                  ].map(item => (
                    <div key={item.text} style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:18, height:18, borderRadius:'50%', background:'rgba(94,234,212,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <item.icon size={10} style={{ color:'#5eead4' }}/>
                      </div>
                      <span style={{ color:'rgba(255,255,255,0.8)', fontSize:12, fontWeight:600 }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, flexShrink:0 }}>
                <button onClick={() => navigate('/provider-register')}
                  style={{
                    display:'flex', alignItems:'center', gap:8,
                    padding:'14px 24px', borderRadius:14, fontSize:14, fontWeight:800,
                    background:'#fff', color:'#0d9488',
                    border:'none', cursor:'pointer',
                    boxShadow:'0 4px 20px rgba(0,0,0,0.25)',
                    whiteSpace:'nowrap',
                  }}>
                  Apply Now <ArrowRight size={14}/>
                </button>
                <button onClick={scrollToSearch}
                  style={{
                    display:'flex', alignItems:'center', gap:8, justifyContent:'center',
                    padding:'12px 24px', borderRadius:14, fontSize:13, fontWeight:700,
                    background:'rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.9)',
                    border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer',
                  }}>
                  <Phone size={13}/> Learn More
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {viewProvider && (
          <ProfileSheet
            provider={viewProvider}
            onClose={() => setViewProvider(null)}
            onBook={p => { setViewProvider(null); setBookProvider(p); }}
            onMessage={handleMessage}
          />
        )}
        {bookProvider && (
          <BookingModal provider={bookProvider} onClose={() => setBookProvider(null)}/>
        )}
      </AnimatePresence>
    </div>
  );
}