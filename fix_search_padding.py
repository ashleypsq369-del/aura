"""
fix_search_padding.py
=====================
Fixes search icon overlap in new search inputs.
Pattern used: absolute icon left-2.5 or left-3 + input pl-8 or pl-9.
Fix: use left-3.5 (14px) + pl-10 (40px) to match search-wrap standard (40px).
"""
from pathlib import Path

SRC = Path(r'c:\xampp\htdocs\ProjectAura_React\frontend\src')

FIXES = [
    # icon position fix
    ('left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none',
     'left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'),
    ('left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none',
     'left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'),
    # input padding fix — only when paired with the absolute icon pattern
    # we target specific class combinations to avoid changing other pl-8/pl-9 uses
]

# Per-file targeted fixes
FILE_FIXES = {
    'pages/Resources.jsx':    [('pl-9 pr-3', 'pl-10 pr-3'), ('pl-8 pr-3', 'pl-10 pr-3')],
    'pages/Medications.jsx':  [('pl-9 pr-3', 'pl-10 pr-3'), ('pl-8 pr-3', 'pl-10 pr-3')],
    'pages/Appointments.jsx': [('pl-9 pr-3', 'pl-10 pr-3'), ('pl-8 pr-3', 'pl-10 pr-3')],
    'pages/AIInsights.jsx':   [('pl-9 pr-3', 'pl-10 pr-3'), ('pl-8 pr-3', 'pl-10 pr-3')],
    'pages/Alerts.jsx':       [('pl-9 pr-4', 'pl-10 pr-4')],
    'pages/Patients.jsx':     [('pl-9 pr-4', 'pl-10 pr-4')],
}

total = 0
for rel, extras in FILE_FIXES.items():
    p = SRC / rel
    if not p.exists():
        print(f'  SKIP: {rel}')
        continue
    t = p.read_text(encoding='utf-8')
    orig = t
    for old, new in FIXES:
        t = t.replace(old, new)
    for old, new in extras:
        t = t.replace(old, new)
    if t != orig:
        p.write_text(t, encoding='utf-8')
        print(f'  FIXED: {rel}')
        total += 1
    else:
        print(f'  SKIP (no match): {rel}')

print(f'\nDone. {total} files updated.')
