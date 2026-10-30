#!/usr/bin/env python3
"""Replace the role cards section in Services.jsx with a proper image slideshow."""
import re

path = "frontend/src/pages/Services.jsx"
lines = open(path, encoding='utf-8').readlines()

# Lines 1044..1097 (1-indexed) = indices 1043..1096
before = lines[:1043]
after  = lines[1097:]

NEW_SECTION = r"""        {/* ── ROLE IMAGE SLIDESHOW ── */}
        <section style={{ paddingTop:28, paddingBottom:28 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <p style={{ fontSize:10, fontWeight:800, color:'#0d9488', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:2 }}>Browse by Role</p>
              <h2 style={{ fontSize:17, fontWeight:800, color:'#0f172a', margin:0 }}>Who do you need?</h2>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={() => setSlideIdx(i => (i - 1 + 8) % 8)}
                style={{ width:30, height:30, borderRadius:'50%', border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}>
                <ChevronLeft size={15}/>
              </button>
              <button onClick={() => setSlideIdx(i => (i + 1) % 8)}
                style={{ width:30, height:30, borderRadius:'50%', border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}>
                <ChevronRight size={15}/>
              </button>
            </div>
          </div>

          {/* Pill filter strip */}
          <div style={{ display:'flex', gap:7, overflowX:'auto', paddingBottom:12, scrollbarWidth:'none' }}>
            <motion.button whileTap={{ scale:0.93 }}
              onClick={() => { setFilterType(''); setPage(1); setTab('browse'); }}
              style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, padding:'6px 14px', borderRadius:999, border:`2px solid ${filterType===''?'#0f172a':'#e2e8f0'}`, background:filterType===''?'#0f172a':'#fff', cursor:'pointer', transition:'all 0.18s' }}>
              <Briefcase size={11} style={{ color:filterType===''?'#fff':'#64748b' }}/>
              <span style={{ fontSize:11, fontWeight:700, color:filterType===''?'#fff':'#334155' }}>All</span>
            </motion.button>
            {Object.entries(TYPE_META).map(([key, meta]) => {
              const sel = filterType===key;
              return (
                <motion.button key={key} whileTap={{ scale:0.93 }}
                  onClick={() => { setFilterType(sel?'':key); setPage(1); setTab('browse'); }}
                  style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, padding:'6px 13px', borderRadius:999, border:`2px solid ${sel?meta.color:'#e2e8f0'}`, background:sel?meta.color:'#fff', cursor:'pointer', transition:'all 0.18s', boxShadow:sel?`0 3px 10px ${meta.color}35`:'none' }}>
                  <meta.icon size={11} style={{ color:sel?'#fff':meta.color }}/>
                  <span style={{ fontSize:11, fontWeight:700, color:sel?'#fff':'#334155', whiteSpace:'nowrap' }}>{meta.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Slideshow — 1 large featured + 2x2 thumbnail grid */}
          <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:12, height:210 }}>

            {/* Large featured card — rotates every 4s */}
            {(() => {
              const entries = Object.entries(TYPE_META);
              const [key, meta] = entries[slideIdx % entries.length];
              return (
                <motion.div key={`feat-${key}`}
                  initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
                  transition={{ duration:0.4 }}
                  onClick={() => { setFilterType(key); setPage(1); setTab('browse'); }}
                  style={{ borderRadius:18, overflow:'hidden', position:'relative', cursor:'pointer', boxShadow:`0 6px 28px ${meta.color}35` }}>
                  <img src={meta.img} alt={meta.label} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  {/* Dark gradient for text */}
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.78) 0%,rgba(0,0,0,0.15) 55%,transparent 100%)' }}/>
                  {/* Role badge */}
                  <div style={{ position:'absolute', top:10, left:10, display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:999, background:meta.color, boxShadow:`0 2px 8px ${meta.color}55` }}>
                    <meta.icon size={11} style={{ color:'#fff' }}/>
                    <span style={{ color:'#fff', fontSize:10, fontWeight:800 }}>{meta.label}</span>
                  </div>
                  {/* Slide dots */}
                  <div style={{ position:'absolute', top:14, right:10, display:'flex', gap:4 }}>
                    {entries.map((_,i) => (
                      <button key={i} onClick={e => { e.stopPropagation(); setSlideIdx(i); }}
                        style={{ width:i===slideIdx%entries.length?14:5, height:5, borderRadius:999, padding:0, border:'none', cursor:'pointer', background:i===slideIdx%entries.length?'#fff':'rgba(255,255,255,0.4)', transition:'all 0.3s' }}/>
                    ))}
                  </div>
                  {/* Label */}
                  <div style={{ position:'absolute', bottom:12, left:14, right:14 }}>
                    <p style={{ color:'#fff', fontWeight:900, fontSize:15, margin:'0 0 3px', textShadow:'0 1px 6px rgba(0,0,0,0.5)' }}>{meta.label}</p>
                    <p style={{ color:'rgba(255,255,255,0.75)', fontSize:11, margin:0 }}>2 verified providers · Tap to browse</p>
                  </div>
                </motion.div>
              );
            })()}

            {/* 2x2 thumbnail grid showing the other 4 roles */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap:8 }}>
              {(() => {
                const entries = Object.entries(TYPE_META);
                const start = (slideIdx + 1) % entries.length;
                return [0,1,2,3].map(i => {
                  const [key, meta] = entries[(start+i) % entries.length];
                  return (
                    <motion.div key={`thumb-${key}`}
                      whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                      onClick={() => { setFilterType(key); setPage(1); setTab('browse'); }}
                      style={{ borderRadius:12, overflow:'hidden', position:'relative', cursor:'pointer', border:`2.5px solid ${filterType===key?meta.color:'transparent'}`, transition:'border-color 0.2s', boxShadow:'0 2px 10px rgba(0,0,0,0.1)' }}>
                      <img src={meta.img} alt={meta.label} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 60%)' }}/>
                      <div style={{ position:'absolute', bottom:6, left:8, right:6, display:'flex', alignItems:'center', gap:4 }}>
                        <meta.icon size={10} style={{ color:'#fff', flexShrink:0 }}/>
                        <p style={{ color:'#fff', fontSize:10, fontWeight:700, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{meta.label}</p>
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </div>
          </div>
        </section>
"""

result = before + [NEW_SECTION] + after
with open(path, 'w', encoding='utf-8') as f:
    f.writelines(result)

lines2 = open(path, encoding='utf-8').readlines()
print(f"Done. File now has {len(lines2)} lines.")
