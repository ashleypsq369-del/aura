#!/usr/bin/env python3
import os

SRC = "frontend/src"
EXTS = {".jsx", ".js", ".ts", ".tsx", ".css"}

# Visible mojibake strings -> correct Unicode
# All strings here use only ASCII + explicit unicode escapes
FIXES = [
    # Flag emojis (the most visible issue)
    ("\u2261\u0192\u00e7\u00bc\u2261\u0192\u00e7\u00a1", "\U0001f1ec\U0001f1ed"),  # Ghana GH
    ("\u2261\u0192\u00e7\u2502\u2261\u0192\u00e7\u00bc", "\U0001f1f3\U0001f1ec"),  # Nigeria NG
    ("\u2261\u0192\u00e7\u2590\u2261\u0192\u00e7\u00aa", "\U0001f1ff\U0001f1e6"),  # South Africa ZA
    ("\u2261\u0192\u00e7\u2591\u2261\u0192\u00e7\u00ac", "\U0001f1f0\U0001f1ea"),  # Kenya KE
    ("\u2261\u0192\u00e7\u00ac\u2261\u0192\u00e7\u2563", "\U0001f1ea\U0001f1f9"),  # Ethiopia ET
    ("\u2261\u0192\u00e7\u00ac\u2261\u0192\u00e7\u00bc", "\U0001f1ea\U0001f1ec"),  # Egypt EG
    ("\u2261\u0192\u00e7\u2563\u2261\u0192\u00e7\u2590", "\U0001f1f9\U0001f1ff"),  # Tanzania TZ
    ("\u2261\u0192\u00e7\u2551\u2261\u0192\u00e7\u00bc", "\U0001f1fa\U0001f1ec"),  # Uganda UG
    ("\u2261\u0192\u00e7\u00bf\u2261\u0192\u00e7\u00ab", "\U0001f1e8\U0001f1ee"),  # Ivory Coast CI
    ("\u2261\u0192\u00e7\u00bf\u2261\u0192\u00e7\u2593", "\U0001f1e8\U0001f1f2"),  # Cameroon CM
    ("\u2261\u0192\u00e7\u2555\u2261\u0192\u00e7\u2502", "\U0001f1f8\U0001f1f3"),  # Senegal SN
    ("\u2261\u0192\u00e7\u2593\u2261\u0192\u00e7\u00aa", "\U0001f1f2\U0001f1e6"),  # Morocco MA
    ("\u2261\u0192\u00e7\u2556\u2261\u0192\u00e7\u255d", "\U0001f1f7\U0001f1fc"),  # Rwanda RW
    ("\u2261\u0192\u00e7\u2590\u2261\u0192\u00e7\u255d", "\U0001f1ff\U0001f1fc"),  # Zimbabwe ZW
    ("\u2261\u0192\u00e7\u2590\u2261\u0192\u00e7\u2593", "\U0001f1ff\U0001f1f2"),  # Zambia ZM
    ("\u2261\u0192\u00e7\u2591\u2261\u0192\u00e7\u2556", "\U0001f1f1\U0001f1f7"),  # Liberia LR
    ("\u2261\u0192\u00e7\u2555\u2261\u0192\u00e7\u2591", "\U0001f1f8\U0001f1f1"),  # Sierra Leone SL
    ("\u2261\u0192\u00e7\u00bc\u2261\u0192\u00e7\u2502", "\U0001f1ec\U0001f1f3"),  # Guinea GN
    ("\u2261\u0192\u00e7\u00ba\u2261\u0192\u00e7\u00bb", "\U0001f1e7\U0001f1ef"),  # Benin BJ
    ("\u2261\u0192\u00e7\u2563\u2261\u0192\u00e7\u00bc", "\U0001f1f9\U0001f1ec"),  # Togo TG
    ("\u2261\u0192\u00e7\u00ba\u2261\u0192\u00e7\u00bd", "\U0001f1e7\U0001f1eb"),  # Burkina BF
    ("\u2261\u0192\u00e7\u2593\u2261\u0192\u00e7\u2591", "\U0001f1f2\U0001f1f1"),  # Mali ML
    ("\u2261\u0192\u00e7\u2502\u2261\u0192\u00e7\u00ac", "\U0001f1f3\U0001f1ea"),  # Niger NE
    ("\u2261\u0192\u00e7\u2555\u2261\u0192\u00e7\u2555", "\U0001f1f8\U0001f1f8"),  # S Sudan SS
    ("\u2261\u0192\u00e7\u2555\u2261\u0192\u00e7\u2310", "\U0001f1f8\U0001f1e9"),  # Sudan SD
    ("\u2261\u0192\u00e7\u00bc\u2261\u0192\u00e7\u00ba", "\U0001f1ec\U0001f1e7"),  # UK GB
    ("\u2261\u0192\u00e7\u2551\u2261\u0192\u00e7\u2555", "\U0001f1fa\U0001f1f8"),  # US
    ("\u2261\u0192\u00e7\u00bf\u2261\u0192\u00e7\u00aa", "\U0001f1e8\U0001f1e6"),  # Canada CA
    ("\u2261\u0192\u00e7\u00aa\u2261\u0192\u00e7\u2551", "\U0001f1e6\U0001f1fa"),  # Australia AU
    ("\u2261\u0192\u00e7\u00ac\u2261\u0192\u00e7\u00ac", "\U0001f1e9\U0001f1ea"),  # Germany DE (ambiguous, keep)
    ("\u2261\u0192\u00e7\u00bd\u2261\u0192\u00e7\u2556", "\U0001f1eb\U0001f1f7"),  # France FR
    ("\u2261\u0192\u00e7\u00ab\u2261\u0192\u00e7\u2502", "\U0001f1ee\U0001f1f3"),  # India IN
    ("\u2261\u0192\u00e7\u00ba\u2261\u0192\u00e7\u2556", "\U0001f1e7\U0001f1f7"),  # Brazil BR
    ("\u2261\u0192\u00e7\u00ab\u2261\u0192\u00e7\u2563", "\U0001f1ee\U0001f1f9"),  # Italy IT
    ("\u2261\u0192\u00e7\u00ac\u2261\u0192\u00e7\u2555", "\U0001f1ea\U0001f1f8"),  # Spain ES
    ("\u2261\u0192\u00e7\u2502\u2261\u0192\u00e7\u2591", "\U0001f1f3\U0001f1f1"),  # Netherlands NL
    ("\u2261\u0192\u00e7\u00ab\u2261\u0192\u00e7\u00ac", "\U0001f1ee\U0001f1ea"),  # Ireland IE
    ("\u2261\u0192\u00e7\u2555\u2261\u0192\u00e7\u00aa", "\U0001f1f8\U0001f1e6"),  # Saudi SA
    ("\u2261\u0192\u00e7\u00aa\u2261\u0192\u00e7\u00ac", "\U0001f1e6\U0001f1ea"),  # UAE AE
    # Cote d'Ivoire
    ("C\u00c4\u00b4te", "C\u00f4te"),
    ("C\u251cte", "C\u00f4te"),
]

count = 0
for root, dirs, files in os.walk(SRC):
    dirs[:] = [d for d in dirs if d not in {"node_modules","dist",".vite","__pycache__"}]
    for fname in files:
        if not any(fname.endswith(e) for e in EXTS):
            continue
        fpath = os.path.join(root, fname)
        try:
            raw = open(fpath, "rb").read()
            try:
                text = raw.decode("utf-8")
            except UnicodeDecodeError:
                text = raw.decode("cp1252", errors="replace")
            orig = text
            for bad, good in FIXES:
                text = text.replace(bad, good)
            if text != orig:
                open(fpath, "w", encoding="utf-8", newline="\n").write(text)
                print("Fixed:", os.path.relpath(fpath))
                count += 1
        except Exception as ex:
            print("ERR", fpath, ex)

print("Done.", count, "files fixed.")
