#!/usr/bin/env python3
"""
Comprehensive UI upgrade using ui-ux-pro-max healthcare design system.
Replaces hardcoded Tailwind color classes with CSS variable equivalents.
Healthcare palette: Primary #0891B2, Accent #059669, Soft/Calm style.
"""
import glob, os, re

files = (
    glob.glob('frontend/src/**/*.jsx', recursive=True) +
    glob.glob('frontend/src/**/*.js',  recursive=True)
)

# Skip non-UI files
SKIP = ['node_modules','dist','.vite','__pycache__','vite.config','tailwind.config',
        'test','spec','.test.','App.jsx','main.jsx','router','index.js']

# ── Tailwind hardcoded bg replacements → CSS vars ──────────────────────────
BG_FIXES = [
    # Card/panel backgrounds
    ('bg-slate-50 ',              'bg-[var(--card-bg)] '),
    ('bg-slate-50\n',             'bg-[var(--card-bg)]\n'),
    ('"bg-slate-50"',             '"bg-[var(--card-bg)]"'),
    ('bg-gray-50 ',               'bg-[var(--card-bg)] '),
    # White backgrounds (forms, modals)
    # Don't replace bg-white inside className strings - too risky
    # Dark mode overrides - remove these since CSS vars handle it
    ('dark:bg-slate-800 ',        ''),
    ('dark:bg-slate-800\n',       '\n'),
    ('dark:bg-slate-700 ',        ''),
    ('dark:bg-slate-900 ',        ''),
    # Border fixes  
    ('border-slate-200 ',         'border-[var(--card-border)] '),
    ('border-slate-100 ',         'border-[var(--card-border)]/50 '),
    # Text fixes - hardcoded dark navies
    ('text-slate-900 ',           'text-[var(--text-900)] '),
    ('text-slate-800 ',           'text-[var(--text-800)] '),
    ('text-slate-700 ',           'text-[var(--text-700)] '),
    ('text-slate-600 ',           'text-[var(--text-600)] '),
    ('text-slate-500 ',           'text-[var(--text-500)] '),
    ('text-slate-400 ',           'text-[var(--text-400)] '),
    # Dark mode text overrides - CSS vars handle these
    ('dark:text-white ',          ''),
    ('dark:text-slate-100 ',      ''),
    ('dark:text-slate-200 ',      ''),
    ('dark:text-slate-300 ',      ''),
    ('dark:text-slate-400 ',      ''),
    ('dark:text-slate-500 ',      ''),
]

# ── Typography upgrades ─────────────────────────────────────────────────────
# Add Poppins to heading font families where Inter is used alone
FONT_FIXES = []  # Skip - handled via CSS

# Files to skip for bg-slate-50 replacement (intentional light backgrounds)
SAFE_BG_SKIP = ['Register.jsx', 'Login.jsx', 'ProviderRegister.jsx']

count = 0
for f in files:
    if any(s in f for s in SKIP):
        continue
    
    basename = os.path.basename(f)
    
    try:
        raw = open(f, 'rb').read()
        try:
            text = raw.decode('utf-8')
        except UnicodeDecodeError:
            continue
        
        orig = text
        
        for bad, good in BG_FIXES:
            # Skip bg-slate-50 replacement on form/auth pages
            if 'bg-slate-50' in bad and basename in SAFE_BG_SKIP:
                continue
            # Don't break JSX attribute syntax
            if bad in text:
                text = text.replace(bad, good)
        
        if text != orig:
            open(f, 'w', encoding='utf-8', newline='\n').write(text)
            print(f'  Fixed: {os.path.relpath(f)}')
            count += 1
    except Exception as e:
        print(f'  ERR {f}: {e}')

print(f'\nDone: {count} files updated.')
