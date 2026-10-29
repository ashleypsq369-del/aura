/**
 * ServicesWidget — compact services roleshow card for PatientPortal / Dashboard
 * Shows the auto-rotating role image slideshow with a CTA to browse providers.
 * For providers: shows their own booking count + edit profile shortcut.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Stethoscope, Activity, Heart, Brain, Users, Hand,
  FileText, Calendar, Star, ArrowRight, Edit3, BadgeCheck,
  Bell, Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { servicesAPI } from '../api/client';

/* ── Role image data ────────────────────────────────────── */
const ROLES = [
  { key:'nurse',           label:'Palliative Nurse',     color:'#0d9488', icon:Stethoscope,
    img:'https://images.pexels.com/photos/7578806/pexels-photo-7578806.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop&crop=faces,top' },
  { key:'doctor',          label:'Palliative Physician', color:'#0891b2', icon:Activity,
    img:'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop&crop=faces,top' },
  { key:'physiotherapist', label:'Physiotherapist',      color:'#059669', icon:Heart,
    img:'https://images.pexels.com/photos/4506109/pexels-photo-4506109.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop&crop=top' },
  { key:'counsellor',      label:'Counsellor',           color:'#7c3aed', icon:Brain,
    img:'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop&crop=faces,top' },
  { key:'nanny',           label:'Specialist Nanny',     color:'#d97706', icon:Users,
    img:'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop&crop=faces,top' },
  { key:'masseur',         label:'Therapeutic Masseur',  color:'#ea580c', icon:Hand,
    img:'https://images.pexels.com/photos/3997989/pexels-photo-3997989.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop&crop=top' },
  { key:'social_worker',   label:'Social Worker',        color:'#db2777', icon:Users,
    img:'https://images.pexels.com/photos/6647324/pexels-photo-6647324.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop&crop=faces,top' },
  { key:'chaplain',        label:'Chaplain',             color:'#0369a1', icon:Heart,
    img:'https://images.pexels.com/photos/8942959/pexels-photo-8942959.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop&crop=faces,top' },
];

/* ── Provider profile summary ─────────────────────────── */
function ProviderDashboard({ navigate }) {
  const { data } = useQuery({
    queryKey: ['my-application'],
    queryFn:  () => servicesAPI.getMyApplication().then(r => r.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const { data: bookingsData } = useQuery({
    queryKey: ['my-bookings-provider'],
    queryFn:  () => servicesAPI.getMyBookings().then(r => r.data),
    staleTime: 60 * 1000,
    retry: false,
  });

  const app      = data?.application;
  const bookings = bookingsData?.bookings || [];
  const pending  = bookings.filter(b => b.status === 'pending').length;
  const upcoming = bookings.filter(b => b.status === 'confirmed').length;

  const statusColor = app?.approval_status === 'approved' ? '#0d9488'
    : app?.approval_status === 'pending' ? '#d97706' : '#64748b';
  const statusLabel = app?.approval_status === 'approved' ? 'Active'
    : app?.approval_status === 'pending' ? 'Under Review' : 'Not Applied';

  return (
    <div style={{
      background:'var(--card-bg)', borderRadius:18,
      border:'1.5px solid var(--card-border)',
      overflow:'hidden',
    }}>
      {/* Header bar */}
      <div style={{
        padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between',
        borderBottom:'1px solid var(--card-border)',
        background:'linear-gradient(135deg,rgba(13,148,136,0.08),rgba(8,145,178,0.05))',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#0d9488,#0891b2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Stethoscope size={16} style={{ color:'#fff' }}/>
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:800, color:'var(--text-900)', margin:0 }}>Provider Dashboard</p>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:statusColor, display:'inline-block' }}/>
              <p style={{ fontSize:10, color:statusColor, fontWeight:700, margin:0 }}>{statusLabel}</p>
            </div>
          </div>
        </div>
        <button onClick={() => navigate('/provider-register')}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:9, background:'#0d9488', color:'#fff', border:'none', cursor:'pointer', fontSize:11, fontWeight:700 }}>
          <Edit3 size={12}/> Edit Profile
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', borderBottom:'1px solid var(--card-border)' }}>
        {[
          { v: pending,  l:'Pending',  color:'#d97706', icon:Bell    },
          { v: upcoming, l:'Upcoming', color:'#0d9488', icon:Calendar },
          { v: bookings.filter(b=>b.status==='completed').length, l:'Done', color:'#059669', icon:BadgeCheck },
        ].map((s, i) => (
          <div key={s.l} style={{ padding:'12px 8px', textAlign:'center', borderRight:i<2?'1px solid var(--card-border)':'none' }}>
            <s.icon size={13} style={{ color:s.color, margin:'0 auto 3px', display:'block' }}/>
            <p style={{ fontSize:16, fontWeight:900, color:'var(--text-900)', margin:0, lineHeight:1 }}>{s.v}</p>
            <p style={{ fontSize:9, color:'var(--text-500)', margin:'2px 0 0', fontWeight:600 }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Upcoming bookings */}
      {bookings.filter(b=>b.status==='confirmed').slice(0,2).map(b => (
        <div key={b.id} style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid var(--card-border)' }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#0d9488,#0891b2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:12, flexShrink:0 }}>
            {(b.patient_name||'?').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:12, fontWeight:700, color:'var(--text-900)', margin:0 }}>{b.patient_name||'Patient'}</p>
            <p style={{ fontSize:10, color:'var(--text-500)', margin:0, display:'flex', alignItems:'center', gap:4 }}>
              <Clock size={9}/> {new Date(b.requested_date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})} {b.start_time && `· ${b.start_time}`}
            </p>
          </div>
          <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:999, background:'#f0fdfa', color:'#0d9488' }}>Confirmed</span>
        </div>
      ))}

      {/* CTA */}
      <div style={{ padding:'12px 14px' }}>
        <button onClick={() => navigate('/services')}
          style={{ width:'100%', padding:'10px', borderRadius:12, background:'linear-gradient(135deg,#0d9488,#0891b2)', color:'#fff', border:'none', cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          <Calendar size={13}/> View All Bookings <ArrowRight size={12}/>
        </button>
      </div>
    </div>
  );
}

/* ── Patient/Family services slideshow ─────────────────── */
function ServicesSlideshow({ navigate }) {
  const [idx, setIdx] = useState(0);

  // Auto-rotate
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i+1) % ROLES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const role = ROLES[idx];

  return (
    <div style={{
      background:'var(--card-bg)', borderRadius:18,
      border:'1.5px solid var(--card-border)',
      overflow:'hidden',
    }}>
      {/* Section header */}
      <div style={{
        padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between',
        borderBottom:'1px solid var(--card-border)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#0d9488,#0891b2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Stethoscope size={14} style={{ color:'#fff' }}/>
          </div>
          <p style={{ fontSize:13, fontWeight:800, color:'var(--text-900)', margin:0 }}>Find Care</p>
        </div>
        <button onClick={() => navigate('/services')}
          style={{ fontSize:11, fontWeight:700, color:'#0d9488', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
          Browse All <ArrowRight size={11}/>
        </button>
      </div>

      {/* Crossfading image */}
      <div style={{ position:'relative', height:140, overflow:'hidden', cursor:'pointer' }}
        onClick={() => navigate(`/services?search=${role.key}`)}>
        <AnimatePresence initial={false}>
          <motion.div key={`sw-${role.key}`}
            style={{ position:'absolute', inset:0 }}
            initial={{ opacity:0, scale:1.04 }}
            animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.7, ease:'easeInOut' }}>
            <img src={role.img} alt={role.label}
              style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 20%' }}/>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.72) 0%,rgba(0,0,0,0.05) 55%,transparent 100%)' }}/>
            {/* Role badge */}
            <div style={{ position:'absolute', top:10, left:12, display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:999, background:role.color, boxShadow:`0 2px 8px ${role.color}55` }}>
              <role.icon size={10} style={{ color:'#fff' }}/>
              <span style={{ color:'#fff', fontSize:10, fontWeight:800 }}>{role.label}</span>
            </div>
            {/* Bottom label */}
            <div style={{ position:'absolute', bottom:10, left:12, right:60 }}>
              <p style={{ color:'#fff', fontWeight:800, fontSize:14, margin:0, textShadow:'0 1px 6px rgba(0,0,0,0.5)' }}>{role.label}</p>
              <p style={{ color:'rgba(255,255,255,0.7)', fontSize:10, margin:0 }}>Tap to find verified providers</p>
            </div>
            {/* Dots */}
            <div style={{ position:'absolute', bottom:12, right:12, display:'flex', gap:4 }}>
              {ROLES.map((_,i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
                  style={{ width:i===idx?12:4, height:4, borderRadius:999, padding:0, border:'none', cursor:'pointer', background:i===idx?'#fff':'rgba(255,255,255,0.4)', transition:'all 0.3s' }}/>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Quick role buttons */}
      <div style={{ padding:'10px 12px', display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none' }}>
        {ROLES.slice(0,5).map(r => (
          <button key={r.key}
            onClick={() => navigate(`/services?search=${r.key}`)}
            style={{
              flexShrink:0, display:'flex', alignItems:'center', gap:5,
              padding:'5px 10px', borderRadius:999,
              border:`1.5px solid ${idx===ROLES.indexOf(r)?r.color:'var(--card-border)'}`,
              background: idx===ROLES.indexOf(r) ? `${r.color}12` : 'var(--card-bg)',
              cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s',
            }}>
            <r.icon size={10} style={{ color:r.color }}/>
            <span style={{ fontSize:10, fontWeight:700, color:'var(--text-700)' }}>{r.label}</span>
          </button>
        ))}
      </div>

      {/* Book now CTA */}
      <div style={{ padding:'0 12px 12px' }}>
        <button onClick={() => navigate('/services')}
          style={{ width:'100%', padding:'10px', borderRadius:12, background:'linear-gradient(135deg,#0d9488,#0891b2)', color:'#fff', border:'none', cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:6, boxShadow:'0 4px 14px rgba(13,148,136,0.3)' }}>
          <Stethoscope size={13}/> Browse All Providers <ArrowRight size={12}/>
        </button>
      </div>
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────── */
export default function ServicesWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user?.role === 'provider') {
    return <ProviderDashboard navigate={navigate}/>;
  }

  // patient, family, caregiver — show the slideshow
  return <ServicesSlideshow navigate={navigate}/>;
}
