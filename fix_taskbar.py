"""Fix TaskStatusBar.jsx modal task rows for dark mode."""
import re

path = r"frontend/src/components/TaskStatusBar.jsx"
with open(path, encoding="utf-8") as f:
    src = f.read()

# Fix 1: ListChecks icon color - replace var(--c-teal) with hardcoded teal
src = src.replace("style={{color:'var(--c-teal)'}}", "style={{color:'#0d9488'}}")

# Fix 2: Refresh button - border:none -> explicit border
src = src.replace(
    "width:28,height:28,borderRadius:8,background:'var(--page-bg)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-400)'",
    "width:30,height:30,borderRadius:8,background:'transparent',border:'1px solid var(--card-border)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-500)'"
)

# Fix 3: Close button - border:none -> explicit border  
src = src.replace(
    "width:28,height:28,borderRadius:8,background:'var(--page-bg)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-500)'",
    "width:30,height:30,borderRadius:8,background:'transparent',border:'1px solid var(--card-border)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-500)'"
)

# Fix 4: Task row background - hardcoded light colors -> CSS vars
src = src.replace(
    "background: task.done ? '#f0fdf4' : isReq ? '#fef2f2' : 'var(--page-bg)'",
    "background: task.done ? 'rgba(22,163,74,0.08)' : 'var(--page-bg)'"
)

# Fix 5: Task row border - hardcoded light colors -> CSS vars
src = src.replace(
    "border:`1px solid ${task.done?'#bbf7d0':isReq?'#fca5a5':'var(--card-border)'}`",
    "border:`1px solid ${task.done?'rgba(22,163,74,0.2)':'var(--card-border)'}`"
)

# Fix 6: Icon container background - hardcoded light -> rgba
src = src.replace(
    "background:task.done?'#dcfce7':isReq?'#fee2e2':'#0d948815'",
    "background:task.done?'rgba(22,163,74,0.12)':'rgba(13,148,136,0.1)'"
)

# Fix 7: Icon color - isReq makes icon red, should always be teal
src = src.replace(
    "style={{color:isReq?'#dc2626':'#0d9488'}}/>}",
    "style={{color:'#0d9488'}}/>}"
)

# Fix 8: Task name color - isReq makes text red
src = src.replace(
    "color:task.done?'#15803d':isReq?'#dc2626':'var(--text-800)'",
    "color:task.done?'var(--text-400)':'var(--text-800)'"
)

# Fix 9: Add Required badge after task name, fix Do Now to navigate instead of acknowledge
# Replace the done/not-done CTA block
old_cta = """{task.done
                 ? <CheckCircle2 size={14} style={{color:'#22c55e',flexShrink:0}}/>
                 : <button onClick={e=>{e.stopPropagation();acknowledgeMutation.mutate(task.id)}} disabled={acknowledging===task.id}
                   style={{fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:7,background:'#0d9488',color:'#fff',border:'none',cursor:'pointer',opacity:acknowledging===task.id?0.5:1}}>
                   {acknowledging===task.id?'...':'Do Now'}
                 </button>
                 }"""

new_cta = """{task.done
                 ? <CheckCircle2 size={14} style={{color:'#22c55e',flexShrink:0}}/>
                 : <button onClick={e=>{e.stopPropagation();navigate(dest);setShowModal(false);}}
                   style={{fontSize:11,fontWeight:700,padding:'5px 11px',borderRadius:7,background:'#0d9488',color:'#fff',border:'none',cursor:'pointer',flexShrink:0}}>
                   Do Now
                 </button>
                 }"""

src = src.replace(old_cta, new_cta)

# Fix 10: Also add the dest variable inside the map and add Required badge
# Find the task row and inject dest + badge
old_map_start = """                 const Icon = ICON_MAP[task.icon] || Activity;
                 const isReq = task.required;
                 return ("""

new_map_start = """                 const Icon = ICON_MAP[task.icon] || Activity;
                 const isReq = task.required;
                 const _pid = task.patient_id;
                 const _link = task.link && _pid ? task.link.replace('{patient_id}', String(_pid)) : task.link;
                 const _n = (task.name||'').toLowerCase();
                 const dest = _link||(_n.includes('vital')&&_pid?`/patients/${_pid}/vitals`:_n.includes('esas')&&_pid?`/assessments/${_pid}/esas`:_n.includes('pps')&&_pid?`/assessments/${_pid}/pps`:_n.includes('assessment')&&_pid?`/assessments/${_pid}`:_n.includes('medication')?'/medications':_n.includes('appointment')?'/appointments':_n.includes('symptom')&&_pid?`/patients/${_pid}/symptoms`:_n.includes('wound')&&_pid?`/patients/${_pid}/wound-care`:_n.includes('wellness')||_n.includes('wellbeing')?'/wellness-checkin':_n.includes('message')?'/messages':_pid?`/patients/${_pid}`:'/dashboard');
                 return ("""

src = src.replace(old_map_start, new_map_start)

# Fix 11: Update onClick to use dest
old_click = """onClick={() => {
                   if (!task.done) {
                     const pid = task.patient_id;
                     const link = task.link && pid ? task.link.replace('{patient_id}', pid) : task.link;
                     const name = (task.name || '').toLowerCase();
                     const dest = link || (name.includes('vital') && pid ? `/patients/${pid}/vitals` : name.includes('esas') && pid ? `/assessments/${pid}/esas` : name.includes('medication') ? '/medications' : name.includes('appointment') ? '/appointments' : pid ? `/patients/${pid}` : '/dashboard');
                     navigate(dest);
                     setShowModal(false);
                   }
                 }}"""
new_click = "onClick={() => { if (!task.done) { navigate(dest); setShowModal(false); } }}"
src = src.replace(old_click, new_click)

# Fix 12: Add Required badge inline in the text section
old_name = """                 <div style={{flex:1,minWidth:0}}>
                 <p style={{fontWeight:600,fontSize:12,color:task.done?'var(--text-400)':'var(--text-800)',margin:0,textDecoration:task.done?'line-through':'none',opacity:task.done?0.6:1}}>{task.name}</p>
                 {task.description && <p style={{fontSize:11,color:'var(--text-400)',margin:'1px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.description}</p>}
                 </div>"""
new_name = """                 <div style={{flex:1,minWidth:0}}>
                 <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                   <p style={{fontWeight:600,fontSize:12,color:task.done?'var(--text-400)':'var(--text-800)',margin:0,textDecoration:task.done?'line-through':'none',opacity:task.done?0.6:1}}>{task.name}</p>
                   {!task.done&&isReq&&<span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:99,background:'#dc2626',color:'#fff',flexShrink:0}}>Required</span>}
                 </div>
                 {task.description&&<p style={{fontSize:11,color:'var(--text-400)',margin:'1px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.description}</p>}
                 </div>"""
src = src.replace(old_name, new_name)

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("Done. Changes applied.")
# Verify key fixes
checks = [
    ("'#0d9488'}}", "ListChecks color fixed"),
    ("'transparent',border:'1px solid var(--card-border)'", "Button border fixed"),
    ("rgba(22,163,74,0.08)", "Task row bg fixed"),
    ("navigate(dest);setShowModal(false);", "Do Now navigation fixed"),
]
for needle, label in checks:
    print(f"  {'OK' if needle in src else 'MISSING'}: {label}")
