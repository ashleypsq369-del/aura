#!/usr/bin/env python3
"""Replace hardcoded text-gray-* / border-gray-* / bg-gray-* with CSS vars across all JSX."""
import glob, os

files = glob.glob('frontend/src/**/*.jsx', recursive=True)

FIXES = [
    # Text colors
    ('text-gray-900', 'text-[var(--text-900)]'),
    ('text-gray-800', 'text-[var(--text-800)]'),
    ('text-gray-700', 'text-[var(--text-700)]'),
    ('text-gray-600', 'text-[var(--text-600)]'),
    ('text-gray-500', 'text-[var(--text-500)]'),
    ('text-gray-400', 'text-[var(--text-400)]'),
    # Border colors
    ('border-gray-200', 'border-[var(--card-border)]'),
    ('border-gray-100', 'border-[var(--card-border)]/50'),
    # Background colors
    ('bg-gray-50',      'bg-[var(--card-bg)]'),
    ('bg-gray-100',     'bg-[var(--card-border)]/30'),
    # Also remaining dark: overrides
    (' dark:text-gray-100', ''),
    (' dark:text-gray-200', ''),
    (' dark:text-gray-300', ''),
    (' dark:text-gray-400', ''),
    (' dark:bg-gray-700',   ''),
    (' dark:bg-gray-800',   ''),
    (' dark:bg-gray-900',   ''),
    (' dark:border-gray-600',''),
    (' dark:border-gray-700',''),
]

SKIP = {'node_modules','dist','.vite','__pycache__'}

count = 0
for f in files:
    if any(s in f for s in SKIP):
        continue
    try:
        raw = open(f, encoding='utf-8', errors='replace').read()
        new = raw
        for bad, good in FIXES:
            new = new.replace(bad, good)
        if new != raw:
            open(f, 'w', encoding='utf-8', newline='\n').write(new)
            count += 1
            print(f'  {os.path.relpath(f)}')
    except Exception as e:
        print(f'  ERR {f}: {e}')

print(f'\nFixed {count} files.')
