#!/usr/bin/env python3
"""
Make ProviderCard and CommunityHub GroupCard adaptive to light/dark mode
by replacing hardcoded dark colors with CSS variable references.
"""

import re

# ─── Services.jsx ────────────────────────────────────────────────────────────
services_path = "frontend/src/pages/Services.jsx"
src = open(services_path, encoding='utf-8').read()

# Card background
src = src.replace("background:'#0f172a', borderRadius:22,", "background:'var(--card-bg)', borderRadius:22,")
# Card border
src = src.replace("border:'1.5px solid #1e293b', cursor:'pointer', position:'relative',",
                   "border:'1.5px solid var(--card-border)', cursor:'pointer', position:'relative',")
# Name text color
src = src.replace("color:'#f1f5f9', fontSize:14, lineHeight:1.2, margin:0 }}",
                   "color:'var(--text-900)', fontSize:14, lineHeight:1.2, margin:0 }}")
# Role text
src = src.replace("color:'#94a3b8', margin:'0 0 7px', fontWeight:500 }}",
                   "color:'var(--text-500)', margin:'0 0 7px', fontWeight:500 }}")
# Bio text
src = src.replace("fontSize:11, color:'#64748b', lineHeight:1.55, margin:'0 0 10px',",
                   "fontSize:11, color:'var(--text-500)', lineHeight:1.55, margin:'0 0 10px',")
# Stats dividers in card
src = src.replace("borderTop:'1px solid #1e293b', paddingTop:9, marginBottom:10,",
                   "borderTop:'1px solid var(--card-border)', paddingTop:9, marginBottom:10,")
src = src.replace("borderRight: i < 2 ? '1px solid #1e293b' : 'none',",
                   "borderRight: i < 2 ? '1px solid var(--card-border)' : 'none',")
# Stats value text
src = src.replace("fontSize:13, fontWeight:800, color:'#e2e8f0', margin:0, lineHeight:1 }}",
                   "fontSize:13, fontWeight:800, color:'var(--text-900)', margin:0, lineHeight:1 }}")
# Stats label text
src = src.replace("fontSize:9, color:'#475569', margin:'2px 0 0', fontWeight:600 }}",
                   "fontSize:9, color:'var(--text-500)', margin:'2px 0 0', fontWeight:600 }}")
# Region text
src = src.replace("fontSize:10, color:'#475569', margin:'0 0 10px' }}",
                   "fontSize:10, color:'var(--text-500)', margin:'0 0 10px' }}")
# Secondary buttons dark bg
src = src.replace("background:'#1e293b', color:'#94a3b8', border:'1.5px solid #334155', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>",
                   "background:'var(--card-border)22', color:'var(--text-600)', border:'1.5px solid var(--card-border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>")
# Availability text (keep colored, just fix the region color above)

open(services_path, 'w', encoding='utf-8').write(src)
print(f"Services.jsx done ({len(open(services_path,encoding='utf-8').readlines())} lines)")

# ─── CommunityHub.jsx ────────────────────────────────────────────────────────
hub_path = "frontend/src/pages/CommunityHub.jsx"
src = open(hub_path, encoding='utf-8').read()

# Card background
src = src.replace(
    "background:'#0f172a', borderRadius:20, overflow:'hidden',\n        border:'1.5px solid #1e293b',",
    "background:'var(--card-bg)', borderRadius:20, overflow:'hidden',\n        border:'1.5px solid var(--card-border)',"
)
# Cover image background - gradient already uses color var so leave
# Dark gradient in cover bottom
src = src.replace(
    "background:'linear-gradient(to top,rgba(15,23,42,0.85) 0%,transparent 60%)'",
    "background:'linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 60%)'"
)
# Member count badge bg
src = src.replace(
    "background:'rgba(15,23,42,0.7)', backdropFilter:'blur(4px)',",
    "background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)',"
)
# Avatar tile border
src = src.replace(
    "border:'2.5px solid #0f172a', boxShadow:`0 4px 14px ${color}44`,",
    "border:'2.5px solid var(--card-bg)', boxShadow:`0 4px 14px ${color}44`,"
)
# Name text
src = src.replace(
    "color:'#f1f5f9', fontSize:14, lineHeight:1.25, margin:'0 0 4px'",
    "color:'var(--text-900)', fontSize:14, lineHeight:1.25, margin:'0 0 4px'"
)
# Description text
src = src.replace(
    "fontSize:11, color:'#64748b', lineHeight:1.55, margin:'0 0 10px',\n          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',\n        }}>\n          {group.description",
    "fontSize:11, color:'var(--text-500)', lineHeight:1.55, margin:'0 0 10px',\n          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',\n        }}>\n          {group.description"
)
# Tag chip bg/text
src = src.replace(
    "background:'#1e293b', color:'#64748b', border:'1px solid #334155',",
    "background:'var(--card-border)33', color:'var(--text-500)', border:'1px solid var(--card-border)',"
)
# Stats row divider
src = src.replace(
    "display:'flex', borderTop:'1px solid #1e293b', paddingTop:10, marginBottom:12",
    "display:'flex', borderTop:'1px solid var(--card-border)', paddingTop:10, marginBottom:12"
)
src = src.replace(
    "flex:1, textAlign:'center', borderRight: i<2?'1px solid #1e293b':'none'",
    "flex:1, textAlign:'center', borderRight: i<2?'1px solid var(--card-border)':'none'"
)
# Stats value text
src = src.replace(
    "fontSize:13, fontWeight:800, color:'#e2e8f0', margin:0, lineHeight:1 }}",
    "fontSize:13, fontWeight:800, color:'var(--text-900)', margin:0, lineHeight:1 }}"
)
# Stats label text (hub uses same pattern)
# Already fixed above in services if same line — but hub has different context, let's be safe
src = src.replace(
    "fontSize:9, color:'#475569', margin:'2px 0 0', fontWeight:600 }}",
    "fontSize:9, color:'var(--text-500)', margin:'2px 0 0', fontWeight:600 }}"
)
# Leave/Join secondary button
src = src.replace(
    "background:'#1e293b', color: group.joined?'#f87171':'#94a3b8',\n            border:`1.5px solid ${group.joined?'#7f1d1d':'#334155'}`,",
    "background:'var(--card-border)22', color: group.joined?'#ef4444':'var(--text-600)',\n            border:`1.5px solid ${group.joined?'#ef444444':'var(--card-border)'}`,\n"
)

open(hub_path, 'w', encoding='utf-8').write(src)
print(f"CommunityHub.jsx done ({len(open(hub_path,encoding='utf-8').readlines())} lines)")
