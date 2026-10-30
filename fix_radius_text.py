#!/usr/bin/env python3
"""
Fix the specific UI quality issues found by the audit:
1. Inconsistent border-radius in buttons (rounded-md -> rounded-lg for small action buttons)
2. Sub-readable font sizes (text-[9px] -> text-[10px], text-[10px] -> text-[11px])
3. Missing focus-visible rings on common button patterns
4. Sidebar collapse button rounded-md -> rounded-lg
5. Consistent font-weight on primary action buttons (font-bold everywhere)
"""
import glob, os

files = (
    glob.glob('frontend/src/**/*.jsx', recursive=True) +
    glob.glob('frontend/src/**/*.js',  recursive=True)
)

FIXES = [
    # ── Font size: bump up tiny illegible sizes ──
    ('text-[9px]',   'text-[11px]'),
    # text-[10px] → text-[11px] ONLY in className strings (not in style objects)
    # We do a safe version: only replace when it's inside className
    # ── Rounded-md → rounded-lg for small action buttons in alert/medication rows ──
    # Only in very specific contexts — look for the pattern in button classes
    ('rounded-md text-[10px]',  'rounded-lg text-[11px]'),
    ('rounded-md text-[11px]',  'rounded-lg text-[11px]'),
    # Sidebar collapse specific fix
    ('rounded-md hover:bg-white/20 text-white/60 hover:text-white transition-all flex-shrink-0',
     'rounded-lg hover:bg-white/20 text-white/60 hover:text-white transition-all flex-shrink-0'),
    # Appointments KpiCard rounded-lg → rounded-xl (match Medications)
    # Only in the KpiCard context
    ("rounded-lg text-left w-full transition-all duration-150 bg-[var(--card-bg)] hover:shadow-md",
     "rounded-xl text-left w-full transition-all duration-150 bg-[var(--card-bg)] hover:shadow-md"),
    # Add focus-visible to common teal primary buttons that are missing it
    ('bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold transition"',
     'bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"'),
    ('bg-teal-600 hover:bg-teal-700 text-white rounded-md text-[10px] font-semibold transition',
     'bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50'),
    ('bg-teal-600 hover:bg-teal-700 text-white rounded-md text-[10px] font-bold transition',
     'bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50'),
    # Explain/secondary small buttons — unify radius
    ('bg-slate-100 hover:bg-slate-200 text-[var(--text-600)] rounded-md text-[10px] font-semibold',
     'bg-[var(--card-border)]/40 hover:bg-[var(--card-border)] text-[var(--text-600)] rounded-lg text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40'),
    # text-[10px] in badge/chip spans → text-[11px]
    ('text-[10px] font-bold px-1.5 py-0.5 rounded-full',
     'text-[11px] font-bold px-1.5 py-0.5 rounded-full'),
    ('text-[10px] font-semibold rounded-full px-2 py-0.5',
     'text-[11px] font-semibold rounded-full px-2 py-0.5'),
]

count = 0
for f in files:
    if any(x in f for x in ['node_modules','dist','.vite','__pycache__']):
        continue
    try:
        raw = open(f, 'rb').read()
        try:
            text = raw.decode('utf-8')
        except UnicodeDecodeError:
            continue
        orig = text
        for bad, good in FIXES:
            text = text.replace(bad, good)
        if text != orig:
            open(f, 'w', encoding='utf-8', newline='\n').write(text)
            print(f'  Fixed: {os.path.relpath(f)}')
            count += 1
    except Exception as e:
        print(f'  ERR {f}: {e}')

print(f'\nDone: {count} files.')
