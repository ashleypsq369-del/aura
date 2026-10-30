#!/usr/bin/env python3
import glob, os

files = (
    glob.glob('frontend/src/**/*.jsx', recursive=True) +
    glob.glob('frontend/src/**/*.js',  recursive=True) +
    glob.glob('frontend/src/**/*.ts',  recursive=True) +
    glob.glob('frontend/src/**/*.tsx', recursive=True)
)

BYTE_FIXES = [
    (b'\xe2\x94\xac\xe2\x95\x96', b'\xc2\xb7'),     # ┬╖ -> ·
    (b'\xe2\x94\xac\xe2\x94\xac', b'\xc2\xa9'),     # ┬┬ -> ©
    (b'\xce\x93\xc3\xa5\xc3\x86', b'\xe2\x86\x92'), # ΓåÆ -> →
    (b'\xce\x93\xc3\x87\xc2\xaa', b'\xe2\x80\xa6'), # ΓÇª -> …
    (b'\xce\x93\xc3\x87\xc3\xb6', b'\xe2\x80\x94'), # ΓÇö -> —
    (b'\xce\x93\xc3\x87\xc3\x96', b'\xe2\x80\x99'), # ΓÇÖ -> '
    (b'\xce\x93\xc3\x87\xc2\x93', b'\xe2\x80\x9c'), # ΓÇ£ -> "
    (b'\xce\x93\xc3\x87\xc2\x9d', b'\xe2\x80\x9d'), # ΓÇ¥ -> "
    (b'\xce\x93\xc3\x87\xe2\x80\x94', b'\xe2\x80\x94'), # variant
    (b'\xc3\xa2\xe2\x80\xa0\xc2\xa9', b'\xe2\x86\xa9'), # â†© -> ↩
    # Box drawing in comments ─
    (b'\xce\x93\xc3\xb6\xc3\x87', b'\xe2\x94\x80'), # ΓöÇ -> ─
]

fixed = 0
for f in files:
    if any(x in f for x in ['node_modules','dist','.vite']):
        continue
    try:
        raw = open(f,'rb').read()
        new = raw
        for bad, good in BYTE_FIXES:
            new = new.replace(bad, good)
        if new != raw:
            open(f,'wb').write(new)
            print('Fixed:', os.path.relpath(f))
            fixed += 1
    except Exception as e:
        print('ERR', f, e)

print(f'\nDone: {fixed} files fixed.')
