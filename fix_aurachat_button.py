import re

f = 'frontend/src/components/AuraChat.jsx'
with open(f, 'r', encoding='utf-8') as fh:
    text = fh.read()

# 1. Replace the Sparkles floating button with Guardian mascot
# Find the floating button motion.div block
old_btn = re.search(
    r'<motion\.div\s*\n\s*whileHover.*?AI Companion.*?</motion\.div>\s*\n\s*</motion\.div>\s*\n\s*\)\}',
    text, re.DOTALL
)
if old_btn:
    print("Found floating button at:", old_btn.start())
    print(repr(old_btn.group(0)[:200]))
else:
    # Try a simpler match
    idx = text.find('AI Companion')
    print("AI Companion found at:", idx)
    if idx > 0:
        print(repr(text[max(0,idx-300):idx+100]))

# 2. Add the Guardian SVG component before AuraChat export
GUARDIAN_SVG = '''
// Guardian mascot for AuraChat (same as AIAssistant)
function GuardianMascot({ size = 48 }) {
  const s1='#8faec8',s2='#7096b8',s3='#5a7d9e',s4='#4a6a88';
  const c1='#d4824a',c2='#b86830',c3='#8f4e20';
  const id='chat';
  return (
    <svg width={size} height={size} viewBox="0 0 120 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`hc_${id}`} cx="38%" cy="32%" r="62%"><stop offset="0%" stopColor={s1}/><stop offset="55%" stopColor={s2}/><stop offset="100%" stopColor={s4}/></radialGradient>
        <radialGradient id={`tc_${id}`} cx="45%" cy="28%" r="65%"><stop offset="0%" stopColor={s1}/><stop offset="50%" stopColor={s2}/><stop offset="100%" stopColor={s4}/></radialGradient>
        <radialGradient id={`lac_${id}`} cx="35%" cy="28%" r="62%"><stop offset="0%" stopColor={c1}/><stop offset="55%" stopColor={c2}/><stop offset="100%" stopColor={c3}/></radialGradient>
        <radialGradient id={`rac_${id}`} cx="40%" cy="30%" r="60%"><stop offset="0%" stopColor={s1}/><stop offset="55%" stopColor={s2}/><stop offset="100%" stopColor={s4}/></radialGradient>
        <radialGradient id={`lc_${id}`} cx="50%" cy="25%" r="60%"><stop offset="0%" stopColor={c1}/><stop offset="55%" stopColor={c2}/><stop offset="100%" stopColor={c3}/></radialGradient>
        <radialGradient id={`orbc_${id}`} cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="white" stopOpacity="0.95"/><stop offset="40%" stopColor="#e8f4ff" stopOpacity="0.8"/><stop offset="100%" stopColor={s2} stopOpacity="0"/></radialGradient>
      </defs>
      <rect x="34" y="118" width="20" height="28" rx="10" fill={`url(#lc_${id})`}/>
      <rect x="66" y="118" width="20" height="28" rx="10" fill={`url(#lc_${id})`}/>
      <rect x="28" y="100" width="64" height="26" rx="18" fill={`url(#lc_${id})`}/>
      <rect x="8" y="52" width="26" height="46" rx="13" fill={`url(#lac_${id})`} transform="rotate(-4 21 75)"/>
      <circle cx="22" cy="56" r="13" fill={`url(#lac_${id})`}/>
      <rect x="86" y="52" width="26" height="44" rx="13" fill={`url(#rac_${id})`} transform="rotate(4 99 74)"/>
      <circle cx="98" cy="56" r="13" fill={`url(#rac_${id})`}/>
      <rect x="26" y="48" width="68" height="60" rx="24" fill={`url(#tc_${id})`}/>
      <path d="M 52 52 Q 58 75 54 108" stroke={s4} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" fill="none"/>
      <circle cx="60" cy="76" r="14" fill={`url(#orbc_${id})`}/>
      <circle cx="60" cy="76" r="8" fill="white" opacity="0.5"/>
      <circle cx="60" cy="76" r="4" fill="white" opacity="0.85"/>
      <rect x="50" y="40" width="20" height="14" rx="8" fill={`url(#tc_${id})`}/>
      <circle cx="60" cy="30" r="27" fill={`url(#hc_${id})`}/>
      <ellipse cx="50" cy="20" rx="10" ry="7" fill="white" opacity="0.18" transform="rotate(-18 50 20)"/>
      <ellipse cx="60" cy="54" rx="16" ry="5" fill={s4} opacity="0.25"/>
    </svg>
  );
}

'''

# Insert before export default function AuraChat
if 'function GuardianMascot' not in text:
    text = text.replace('export default function AuraChat()', GUARDIAN_SVG + 'export default function AuraChat()')
    print("Added GuardianMascot component")
else:
    print("GuardianMascot already present")

# 3. Replace the floating pill button content
# Match the inner motion.div with rounded-full class
old_pattern = re.compile(
    r'(<motion\.div\s*\n\s*whileHover=\{\{ scale: 1\.05 \}\}\s*\n\s*className="flex items-center gap-2\.5.*?</motion\.div>)',
    re.DOTALL
)

new_btn = '''<motion.div
              whileHover={{ scale: 1.06, y: -2 }}
              className="flex flex-col items-center gap-0 select-none cursor-pointer relative"
              title="Aura AI - drag to move, click to open"
              style={{ filter: 'drop-shadow(0 4px 16px rgba(90,125,158,0.5))' }}
            >
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}>
                <GuardianMascot size={56} />
              </motion.div>
              <div className="px-3 py-0.5 text-white text-[10px] font-bold rounded-full -mt-2 shadow-sm"
                style={{ background: 'linear-gradient(to right, #5a7d9e, #4a6a88)' }}>
                Aura AI
              </div>
              {loading && <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse border-2 border-white" />}
            </motion.div>'''

new_text, n = old_pattern.subn(new_btn, text, count=1)
if n:
    print("Replaced floating button")
else:
    print("Could not replace floating button - trying simpler match")
    # Try matching on the Sparkles content
    idx = text.find('<Sparkles size={15}')
    if idx > 0:
        # Find the containing motion.div
        start = text.rfind('<motion.div', 0, idx)
        end = text.find('</motion.div>', idx) + len('</motion.div>')
        print(f"Found Sparkles button from {start} to {end}")
        print(repr(text[start:start+300]))
    text = new_text  # keep whatever was changed

# 4. Update the chat header to use GuardianMascot
text = text.replace(
    '<Sparkles size={20} className="text-white" />',
    '<GuardianMascot size={32} />'
)

with open(f, 'w', encoding='utf-8', newline='\n') as fh:
    fh.write(text)
print("Done - AuraChat.jsx updated")
