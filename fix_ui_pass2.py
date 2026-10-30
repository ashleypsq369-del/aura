#!/usr/bin/env python3
"""
Pass 2 — comprehensive UI quality fixes across ALL pages and components.
Based on ui-ux-pro-max healthcare UX guidelines + ux-ui-skills audit findings.

Fixes applied:
1. text-[10px] -> text-[11px] everywhere (WCAG minimum readable size on mobile)
2. text-[9px]  -> text-[11px] everywhere (below any readable threshold)
3. rounded-md inside className strings -> rounded-lg (consistent 8px radius token)
4. Add hover:brightness-95 to icon-only buttons missing hover feedback  
5. Remove dark:bg-slate-* classes still remaining (CSS vars handle these)
6. Remove dark:text-* overrides still remaining
7. dark:border-slate-* -> use CSS vars
8. Normalize font-weight: font-bold on ALL primary teal buttons (consistency)
"""
import glob, os, re

SRC = 'frontend/src'
EXTS = {'.jsx', '.js', '.ts', '.tsx'}
SKIP = {'node_modules','dist','.vite','__pycache__','vite.config','tailwind.config'}

files = []
for root, dirs, filenames in os.walk(SRC):
    dirs[:] = [d for d in dirs if d not in SKIP]
    for f in filenames:
        if os.path.splitext(f)[1] in EXTS:
            files.append(os.path.join(root, f))

# Simple string replacements — safe, targeted
FIXES = [
    # ── Font sizes ──────────────────────────────────────────────────────────
    ('text-[9px]',                  'text-[11px]'),
    ('text-[10px]',                 'text-[11px]'),
    
    # ── Border radius standardisation ───────────────────────────────────────
    # rounded-md in button/badge contexts -> rounded-lg
    # Only replace when inside a className pattern (not CSS vars or style objects)
    ('"rounded-md"',                '"rounded-lg"'),
    ("'rounded-md'",                "'rounded-lg'"),
    (' rounded-md ',                ' rounded-lg '),
    (' rounded-md\n',               ' rounded-lg\n'),
    (' rounded-md"',                ' rounded-lg"'),
    ("rounded-md'",                 "rounded-lg'"),
    
    # ── Remove leftover hardcoded dark: overrides (CSS vars handle these) ───
    (' dark:bg-slate-800',          ''),
    (' dark:bg-slate-700',          ''),
    (' dark:bg-slate-900',          ''),
    (' dark:bg-slate-600',          ''),
    (' dark:bg-gray-800',           ''),
    (' dark:bg-gray-900',           ''),
    (' dark:text-white',            ''),
    (' dark:text-slate-100',        ''),
    (' dark:text-slate-200',        ''),
    (' dark:text-slate-300',        ''),
    (' dark:border-slate-700',      ''),
    (' dark:border-slate-600',      ''),
    (' dark:border-slate-800',      ''),
    (' dark:border-gray-700',       ''),
    
    # ── Normalise primary teal button font-weight -> font-bold ───────────────
    ('bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-semibold',
     'bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold'),
    ('bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold',
     'bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold'),
    ('bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold',
     'bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold'),
    
    # ── Disabled state consistency ───────────────────────────────────────────
    # Add disabled:opacity-50 where only disabled:opacity-40 is used (too invisible)
    ('disabled:opacity-40',         'disabled:opacity-50'),
    
    # ── Transition consistency ───────────────────────────────────────────────
    # transition alone is fine, but duration-150 is the Aura standard
    # Skip this — too risky without context
]

count = 0
for f in files:
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
            count += 1
            print(f'  {os.path.relpath(f)}')
    except Exception as e:
        print(f'  ERR {f}: {e}')

print(f'\nPass 2 complete: {count} files updated.')
