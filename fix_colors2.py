#!/usr/bin/env python3
"""Fix remaining hardcoded colors in Services.jsx — pill strips + modal inputs."""
path = "frontend/src/pages/Services.jsx"
src = open(path, encoding='utf-8').read()

# Booking modal provider name
src = src.replace(
    "fontWeight:800, color:'#0f172a', fontSize:14 }}>{provider.full_name}",
    "fontWeight:800, color:'var(--text-900)', fontSize:14 }}>{provider.full_name}"
)
# Booking modal input text
src = src.replace(
    "padding:'10px 14px', fontSize:13, color:'#0f172a',",
    "padding:'10px 14px', fontSize:13, color:'var(--text-900)',"
)
# Pill strip unselected borders (#e2e8f0 → var(--card-border))
src = src.replace("'#e2e8f0'", "'var(--card-border)'")
# Pill 'All' dark active (#0f172a → var(--text-900))
src = src.replace(
    "filterType===''?'#0f172a':'var(--card-border)'",
    "filterType===''?'var(--text-900)':'var(--card-border)'"
)
# Pill 'All' background when selected
src = src.replace(
    "background:filterType===''?'#0f172a':'var(--card-bg)'",
    "background:filterType===''?'var(--text-900)':'var(--card-bg)'"
)
# Pill unselected bg #fff
src = src.replace("background:sel?meta.color:'#fff'", "background:sel?meta.color:'var(--card-bg)'")
src = src.replace("background:filterType===''?'#0f172a':'#fff'", "background:filterType===''?'var(--text-900)':'var(--card-bg)'")
# Region filter select bg
src = src.replace(
    "border:'1.5px solid #e2e8f0', borderRadius:10, padding:'8px 12px',\n                fontSize:12, color:'#334155', background:'#fff', outline:'none',",
    "border:'1.5px solid var(--card-border)', borderRadius:10, padding:'8px 12px',\n                fontSize:12, color:'var(--text-800)', background:'var(--card-bg)', outline:'none',"
)
# Browse tab provider count text
src = src.replace(
    "fontSize:13, color:'#64748b' }}\n                Showing",
    "fontSize:13, color:'var(--text-600)' }}\n                Showing"
)
# No providers found card
src = src.replace(
    "background:'#fff', borderRadius:20, border:'2px dashed #e2e8f0',",
    "background:'var(--card-bg)', borderRadius:20, border:'2px dashed var(--card-border)',"
)
src = src.replace(
    "fontWeight:800, color:'#475569', fontSize:16 }}>No providers found",
    "fontWeight:800, color:'var(--text-700)', fontSize:16 }}>No providers found"
)
src = src.replace(
    "fontSize:13, color:'#94a3b8', marginTop:6 }}>Try clearing",
    "fontSize:13, color:'var(--text-500)', marginTop:6 }}>Try clearing"
)
# Clear filters button
src = src.replace(
    "background:'#0d9488', color:'#fff', border:'none', cursor:'pointer',\n              }}>\n                Clear Filters",
    "background:'var(--c-teal)', color:'#fff', border:'none', cursor:'pointer',\n              }}>\n                Clear Filters"
)
# Join as provider section
src = src.replace(
    "color:'#fff', fontWeight:900, fontSize:22, marginBottom:8",
    "color:'#ffffff', fontWeight:900, fontSize:22, marginBottom:8"
)
# Testimonials section heading
src = src.replace(
    "fontSize:24, fontWeight:900, color:'#0f172a', margin:0",
    "fontSize:24, fontWeight:900, color:'var(--text-900)', margin:0"
)
src = src.replace(
    "fontSize:11, fontWeight:800, color:'#0d9488', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8",
    "fontSize:11, fontWeight:800, color:'var(--c-teal)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8"
)

open(path, 'w', encoding='utf-8').write(src)
print(f"Done: {len(open(path,encoding='utf-8').readlines())} lines")
