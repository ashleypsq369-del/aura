#!/usr/bin/env python3
src = open('frontend/src/components/ModernCard.jsx', encoding='utf-8').read()

# Find and replace the className block using a marker approach
OLD_MARKER = "relative bg-slate-50 rounded-xl overflow-hidden"
NEW_BLOCK = """  className={[
 'relative overflow-hidden',
 elevated
 ? 'shadow-[0_2px_4px_rgba(0,0,0,0.05),0_8px_28px_rgba(8,145,178,0.09)]'
 : 'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.05)]',
 hover ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(8,145,178,0.12),0_8px_28px_rgba(0,0,0,0.07)]' : '',
 onClick ? 'cursor-pointer' : '',
 className,
 ].filter(Boolean).join(' ')}
 style={{ background:'var(--card-bg)', borderRadius:14, border:'1px solid var(--card-border)' }}"""

# Find the line with the old marker and replace the whole className block
if OLD_MARKER in src:
    # Find start of className={[
    start = src.rfind(' className={[\n', 0, src.index(OLD_MARKER))
    # Find end - the line after .join(' ')}
    end_marker = ".filter(Boolean).join(' ')}"
    end = src.index(end_marker, start) + len(end_marker)
    src = src[:start] + NEW_BLOCK + src[end:]
    open('frontend/src/components/ModernCard.jsx', 'w', encoding='utf-8').write(src)
    print('Done')
else:
    print('Marker not found')
