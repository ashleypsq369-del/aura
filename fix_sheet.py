#!/usr/bin/env python3
"""Fix ProfileSheet and remaining hardcoded colors in Services.jsx."""
path = "frontend/src/pages/Services.jsx"
src = open(path, encoding='utf-8').read()

# ── ProfileSheet — white backgrounds → var(--card-bg)
src = src.replace(
    "width:'100%', maxWidth:480, background:'#fff',",
    "width:'100%', maxWidth:480, background:'var(--card-bg)',"
)
src = src.replace(
    "background:'#fff', display:'flex', flexDirection:'column', overflowY:'auto',",
    "background:'var(--card-bg)', display:'flex', flexDirection:'column', overflowY:'auto',"
)
# Stats strip in sheet
src = src.replace(
    "padding:'14px 0', textAlign:'center', borderRight:'1px solid #f1f5f9'",
    "padding:'14px 0', textAlign:'center', borderRight:'1px solid var(--card-border)'"
)
src = src.replace(
    "fontSize:17, fontWeight:900, color: s.vc||'#0f172a', margin:0",
    "fontSize:17, fontWeight:900, color: s.vc||'var(--text-900)', margin:0"
)
# Verification badges bg in sheet
src = src.replace(
    "padding:'14px 20px', display:'flex', gap:8, flexWrap:'wrap', borderBottom:'1px solid #f8fafc'",
    "padding:'14px 20px', display:'flex', gap:8, flexWrap:'wrap', borderBottom:'1px solid var(--card-border)'"
)
# Details grid in sheet
src = src.replace(
    "background:'#f8fafc', borderRadius:12, padding:'10px 14px'",
    "background:'var(--card-border)22', borderRadius:12, padding:'10px 14px'"
)
# Detail label text
src = src.replace(
    "fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3",
    "fontSize:9, color:'var(--text-500)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3"
)
# Detail value text
src = src.replace(
    "fontSize:13, fontWeight:700, color:'#0f172a', margin:0 }}",
    "fontSize:13, fontWeight:700, color:'var(--text-900)', margin:0 }}"
)
# About label
src = src.replace(
    "fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>About",
    "fontSize:10, fontWeight:700, color:'var(--text-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>About"
)
# About body text
src = src.replace(
    "fontSize:13, color:'#334155', lineHeight:1.75, margin:0 }}",
    "fontSize:13, color:'var(--text-800)', lineHeight:1.75, margin:0 }}"
)
# Review card bg
src = src.replace(
    "background:'#f8fafc', borderRadius:14, padding:'12px 14px'",
    "background:'var(--card-border)22', borderRadius:14, padding:'12px 14px'"
)
# Review text
src = src.replace(
    "fontSize:12, color:'#475569', lineHeight:1.5, margin:0",
    "fontSize:12, color:'var(--text-700)', lineHeight:1.5, margin:0"
)
# Qualifications body text
src = src.replace(
    "fontSize:13, fontWeight:700, color:'#0f172a', margin:0 }}>\n                      {q.title}",
    "fontSize:13, fontWeight:700, color:'var(--text-900)', margin:0 }}>\n                      {q.title}"
)
src = src.replace(
    "fontSize:11, color:'#64748b', margin:'2px 0 0'",
    "fontSize:11, color:'var(--text-600)', margin:'2px 0 0'"
)
# Qualifications check circle bg
src = src.replace(
    "width:20, height:20, borderRadius:'50%', background:'#f0fdfa', border:'1.5px solid #99f6e4'",
    "width:20, height:20, borderRadius:'50%', background:'var(--card-border)44', border:'1.5px solid var(--card-border)'"
)
# Sheet footer bg
src = src.replace(
    "padding:'14px 20px 20px', borderTop:'1px solid #f1f5f9', background:'#fff', flexShrink:0",
    "padding:'14px 20px 20px', borderTop:'1px solid var(--card-border)', background:'var(--card-bg)', flexShrink:0"
)
# Sheet Book button (dark black → teal)
src = src.replace(
    "background:'#0f172a', color:'#fff', border:'none', cursor:'pointer',\n            display:'flex', alignItems:'center', justifyContent:'center', gap:8,\n            marginBottom:10, letterSpacing:'0.01em',\n          }}\n            onMouseEnter={e => e.currentTarget.style.background='#1e293b'}\n            onMouseLeave={e => e.currentTarget.style.background='#0f172a'}",
    "background:'#0d9488', color:'#fff', border:'none', cursor:'pointer',\n            display:'flex', alignItems:'center', justifyContent:'center', gap:8,\n            marginBottom:10, letterSpacing:'0.01em',\n            boxShadow:'0 4px 16px rgba(13,148,136,0.35)',\n          }}\n            onMouseEnter={e => e.currentTarget.style.opacity='0.88'}\n            onMouseLeave={e => e.currentTarget.style.opacity='1'}"
)
# Sheet section headers
src = src.replace(
    "fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Qualifications",
    "fontSize:10, fontWeight:700, color:'var(--text-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Qualifications"
)
src = src.replace(
    "fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Patient Reviews",
    "fontSize:10, fontWeight:700, color:'var(--text-500)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Patient Reviews"
)
# Also fix the verification badge bg labels in sheet
src = src.replace(
    "padding:'14px 20px', display:'flex', gap:8, flexWrap:'wrap', borderBottom:'1px solid #f8fafc'",
    "padding:'14px 20px', display:'flex', gap:8, flexWrap:'wrap', borderBottom:'1px solid var(--card-border)'"
)
# "Browse by Role" h2 color
src = src.replace(
    "fontSize:16, fontWeight:800, color:'#0f172a', margin:0 }}>Who do you need?",
    "fontSize:16, fontWeight:800, color:'var(--text-900)', margin:0 }}>Who do you need?"
)
# "Who do you need" section h2
src = src.replace(
    "fontSize:17, fontWeight:800, color:'#0f172a', margin:0 }}>Who do you need?",
    "fontSize:17, fontWeight:800, color:'var(--text-900)', margin:0 }}>Who do you need?"
)
# Stats strip border
src = src.replace(
    "'display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderBottom:'1px solid #f1f5f9'",
    "'display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderBottom:'1px solid var(--card-border)'"
)
# Provider count label in browse tab
src = src.replace(
    "color:'#0f172a' }}>{total}</strong>",
    "color:'var(--text-900)' }}>{total}</strong>"
)

open(path, 'w', encoding='utf-8').write(src)
print(f"Done. {len(open(path,encoding='utf-8').readlines())} lines.")
