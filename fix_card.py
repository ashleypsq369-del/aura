#!/usr/bin/env python3
"""
Replace ProviderCard (lines 153-345) and ProfileSheet (lines 346-572)
with new Style-A card + full-detail slide-in sheet.
"""
path = "frontend/src/pages/Services.jsx"
lines = open(path, encoding='utf-8').readlines()

# ProviderCard: lines 153–345 (1-indexed) = indices 152–344
# ProfileSheet: lines 346–572 (1-indexed) = indices 345–571
before      = lines[:152]           # everything before ProviderCard
after_sheet = lines[572:]           # everything after ProfileSheet closing }

NEW_CARD = r"""/* ─────────────────────────── PROVIDER CARD  (Style A) ─────────────────── */
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
        background:'#ffffff', borderRadius:22, overflow:'hidden',
        border:'1.5px solid #f1f5f9', cursor:'pointer', position:'relative',
        boxShadow: featured ? '0 6px 28px rgba(13,148,136,0.14)' : '0 2px 12px rgba(0,0,0,0.07)',
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
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
          <p style={{ fontWeight:800, color:'#0f172a', fontSize:15, lineHeight:1.2, margin:0 }}>
            {p.full_name}
          </p>
          {p.is_verified && (
            <BadgeCheck size={16} style={{ color:'#0d9488', flexShrink:0 }}/>
          )}
        </div>

        {/* Role */}
        <p style={{ fontSize:11, color:'#64748b', margin:'0 0 8px', fontWeight:500 }}>{meta.label}</p>

        {/* Bio — 2 lines max */}
        {p.bio && (
          <p style={{
            fontSize:11, color:'#64748b', lineHeight:1.55, margin:'0 0 12px',
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
          }}>
            {p.bio}
          </p>
        )}

        {/* Stats row — like the "20k Reviews · 50+ Projects · $50/hr" row in Style A */}
        <div style={{
          display:'flex', alignItems:'center', gap:0,
          borderTop:'1px solid #f1f5f9', paddingTop:10, marginBottom:12,
        }}>
          {[
            { v: p.total_reviews > 0 ? `${p.total_reviews}` : '0',  l:'Reviews' },
            { v: p.years_experience > 0 ? `${p.years_experience}yr` : 'New', l:'Exp' },
            { v: p.nmc_pin ? 'NMC' : p.is_verified ? 'VRF' : '-',  l:'Cert' },
          ].map((s, i) => (
            <div key={s.l} style={{
              flex:1, textAlign:'center',
              borderRight: i < 2 ? '1px solid #f1f5f9' : 'none',
            }}>
              <p style={{ fontSize:13, fontWeight:800, color:'#0f172a', margin:0, lineHeight:1 }}>{s.v}</p>
              <p style={{ fontSize:9, color:'#94a3b8', margin:'2px 0 0', fontWeight:600 }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* Availability + region */}
        {p.region && (
          <p style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#94a3b8', margin:'0 0 10px' }}>
            <MapPin size={9}/> {p.region}
            <span style={{ marginLeft:'auto' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:9, fontWeight:700, color: available ? '#16a34a' : '#dc2626' }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background: available ? '#22c55e' : '#ef4444', display:'inline-block', boxShadow: available ? '0 0 0 2px #bbf7d0' : 'none' }}/>
                {available ? 'Available' : 'Busy'}
              </span>
            </span>
          </p>
        )}
      </div>

      {/* ── CTA — full-width dark button like Style A ── */}
      <div style={{ padding:'0 16px 14px' }}>
        <button
          onClick={e => { e.stopPropagation(); onBook(p); }}
          style={{
            width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            padding:'11px 0', borderRadius:12, fontSize:13, fontWeight:800,
            background:'#0f172a', color:'#fff', border:'none', cursor:'pointer',
            transition:'background 0.15s', letterSpacing:'0.01em',
          }}
          onMouseEnter={e => e.currentTarget.style.background='#1e293b'}
          onMouseLeave={e => e.currentTarget.style.background='#0f172a'}
        >
          <Calendar size={14}/> Book Session
        </button>
        {/* Secondary actions row */}
        <div style={{ display:'flex', gap:8, marginTop:8 }}>
          <button onClick={e => { e.stopPropagation(); onView(p); }}
            style={{ flex:1, padding:'8px 0', borderRadius:10, fontSize:11, fontWeight:700, background:`${meta.color}12`, color:meta.color, border:`1.5px solid ${meta.color}30`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
            <FileText size={12}/> Profile
          </button>
          <button onClick={e => { e.stopPropagation(); onMessage(p); }}
            style={{ flex:1, padding:'8px 0', borderRadius:10, fontSize:11, fontWeight:700, background:'#f8fafc', color:'#64748b', border:'1.5px solid #e2e8f0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
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

"""

result = before + [NEW_CARD] + after_sheet
with open(path, 'w', encoding='utf-8') as f:
    f.writelines(result)
count = len(open(path, encoding='utf-8').readlines())
print(f"Done. {count} lines.")
