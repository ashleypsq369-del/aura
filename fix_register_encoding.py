#!/usr/bin/env python3
import os

files_to_fix = [
    "frontend/src/pages/Register.jsx",
    "frontend/src/pages/ProviderRegister.jsx",
    "frontend/src/pages/Login.jsx",
    "frontend/src/pages/PatientPortal.jsx",
    "frontend/src/pages/Dashboard.jsx",
    "frontend/src/pages/Settings.jsx",
    "frontend/src/pages/Profile.jsx",
    "frontend/src/components/layout/Layout.jsx",
    "frontend/src/components/layout/Sidebar.jsx",
]

# Read all JSX files too
import glob
all_jsx = glob.glob("frontend/src/**/*.jsx", recursive=True) + \
          glob.glob("frontend/src/**/*.js", recursive=True)

# Specific text replacements using repr-safe byte sequences
# These are the actual bytes in the file
BYTE_FIXES = [
    # Arrow right → (UTF-8 of → is E2 86 92, mojibake as CP1252 gives ΓåÆ)
    (b'\xce\x93\xc3\xa5\xc3\x86', b'\xe2\x86\x92'),   # ΓåÆ → →
    # © copyright (┬⌐ = C2 A9 read as ┬ = C2 = 194, ⌐ = A9 = 169)
    (b'\xe2\x94\xac\xe2\x8c\x90', b'\xc2\xa9'),        # ┬⌐ → ©
    # · middle dot (┬╖ = C2 B7)
    (b'\xe2\x94\xac\xe2\x95\x97', b'\xc2\xb7'),        # ┬╖ → ·
    # … ellipsis (ΓÇª)
    (b'\xce\x93\xc3\x87\xc2\xaa', b'\xe2\x80\xa6'),    # ΓÇª → …
    # — em dash (ΓÇö)
    (b'\xce\x93\xc3\x87\xc3\xb6', b'\xe2\x80\x94'),    # ΓÇö → —
    # ' right single quote (ΓÇÖ)
    (b'\xce\x93\xc3\x87\xc3\x96', b'\xe2\x80\x99'),    # ΓÇÖ → '
    # ↩ return arrow (â†©)
    (b'\xc3\xa2\xe2\x80\xa0\xc2\xa9', b'\xe2\x86\xa9'), # â†© → ↩
    # → right arrow (ΓåÆ alternate encoding)
    (b'\xce\x93\xc3\xa5\xc3\x86', b'\xe2\x86\x92'),
]

fixed = 0
for fpath in all_jsx:
    try:
        raw = open(fpath, "rb").read()
        new = raw
        for bad, good in BYTE_FIXES:
            new = new.replace(bad, good)
        if new != raw:
            open(fpath, "wb").write(new)
            print("Fixed:", fpath)
            fixed += 1
    except Exception as e:
        print("ERR", fpath, e)

print(f"\nByte-level fixes: {fixed} files")

# Also do text-level fixes on decoded content
TEXT_FIXES = [
    # Arrow remaining as text
    ("\u0393\u00e5\u00c6", "\u2192"),   # ΓåÆ -> →
    # Copyright / middot as text
    ("\u252c\u231d", "\u00a9"),         # ┬⌐ -> ©
    ("\u252c\u2557", "\u00b7"),         # ┬╖ -> ·
    # Ellipsis
    ("\u0393\u00c7\u00aa", "\u2026"),   # ΓÇª -> …
    # Em dash
    ("\u0393\u00c7\u00f6", "\u2014"),   # ΓÇö -> —
    # Right single quote
    ("\u0393\u00c7\u0096", "\u2019"),   # ΓÇÖ -> '
    # Left double quote
    ("\u0393\u00c7\u0093", "\u201c"),   # ΓÇ£ -> "
    # Right double quote
    ("\u0393\u00c7\u009d", "\u201d"),   # ΓÇ¥ -> "
    # Non-breaking space / common garbage
    ("\u00c2\u00a0", "\u00a0"),
    # Search placeholder ellipsis
    ("Search country or codeΓÇª", "Search country or code\u2026"),
    ("Search country or code\u0393\u00c7\u00aa", "Search country or code\u2026"),
]

fixed2 = 0
for fpath in all_jsx:
    try:
        text = open(fpath, encoding="utf-8", errors="replace").read()
        orig = text
        for bad, good in TEXT_FIXES:
            text = text.replace(bad, good)
        if text != orig:
            open(fpath, "w", encoding="utf-8", newline="\n").write(text)
            print("Text-fixed:", fpath)
            fixed2 += 1
    except Exception as e:
        print("ERR", fpath, e)

print(f"Text-level fixes: {fixed2} files")
print(f"Total: {fixed + fixed2} files fixed.")
