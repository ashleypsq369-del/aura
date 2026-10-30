#!/usr/bin/env python3
"""Replace role image slideshow section with clean single crossfading card."""
path = "frontend/src/pages/Services.jsx"
lines = open(path, encoding='utf-8').readlines()

# Lines 1033..1134 (1-indexed) = indices 1032..1133
before = lines[:1032]
after  = lines[1134:]

NEW = r"""        {/* ── ROLE CARD SLIDESHOW  (LoginSlideshow style, horizontal) ── */}
        <section style={{ paddingTop:24, paddingBottom:24 }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <p style={{ fontSize:10, fontWeight:800, color:'#0d9488', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:2 }}>Browse by Role</p>
              <h2 style={{ fontSize:16, fontWeight:800, color:'#0f172a', margin:0 }}>Who do you need?</h2>
            </div>
            {/* Pill strip — scrollable, no chevrons */}
            <div style={{ display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none', maxWidth:'60%' }}>
              <motion.button whileTap={{ scale:0.93 }}
                onClick={() => { setFilterType(''); setPage(1); setTab('browse'); }}
                style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0, padding:'5px 11px', borderRadius:999, border:`1.5px solid ${filterType===''?'#0f172a':'#e2e8f0'}`, background:filterType===''?'#0f172a':'#fff', cursor:'pointer' }}>
                <span style={{ fontSize:11, fontWeight:700, color:filterType===''?'#fff':'#475569' }}>All</span>
              </motion.button>
              {Object.entries(TYPE_META).map(([key, meta]) => {
                const sel = filterType===key;
                return (
                  <motion.button key={key} whileTap={{ scale:0.93 }}
                    onClick={() => { setFilterType(sel?'':key); setPage(1); setTab('browse'); setSlideIdx(Object.keys(TYPE_META).indexOf(key)); }}
                    style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0, padding:'5px 11px', borderRadius:999, border:`1.5px solid ${sel?meta.color:'#e2e8f0'}`, background:sel?meta.color:'#fff', cursor:'pointer', boxShadow:sel?`0 2px 8px ${meta.color}30`:'none' }}>
                    <meta.icon size={10} style={{ color:sel?'#fff':meta.color }}/>
                    <span style={{ fontSize:11, fontWeight:700, color:sel?'#fff':'#475569', whiteSpace:'nowrap' }}>{meta.label}</span>
                  </motion.button>
                );
              })}
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
        </section>
"""

result = before + [NEW] + after
with open(path, 'w', encoding='utf-8') as f:
    f.writelines(result)

count = len(open(path, encoding='utf-8').readlines())
print(f"Done. {count} lines.")
