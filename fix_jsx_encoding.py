"""
fix_jsx_encoding.py
====================
Fixes broken emoji/symbol encoding in JSX files.
Replaces mangled multi-byte sequences with clean ASCII equivalents.
"""
import os, re
from pathlib import Path

SRC = Path(__file__).parent / "frontend" / "src"

# Each tuple: (broken_string, replacement)
FIXES = [
    # Emoji debris from previous encoding passes
    ("Œ...",            "Morning"),
    ("˜€ï¸",           "Afternoon"),
    ("˜€",             "Afternoon"),
    ("Œ Night",         "Night"),
    (" Œ",             " Night"),
    ("Œ",              ""),          # lone broken sunrise/moon remnant
    # Bullet points
    ("€¢",             "-"),
    ("â€¢",            "-"),
    ("•",              "-"),         # keep raw bullet as dash for safety
    # Phone / checkmark debris
    ("ž ",             ""),
    ("ž",              ""),
    ("´ ",             ""),
    ("´",              ""),
    # Dove / flourish symbols
    ("œ ",             ""),
    ("œ",              ""),
    # Quote debris
    ("\u2018",         "'"),
    ("\u2019",         "'"),
    ("\u201c",         '"'),
    ("\u201d",         '"'),
    ("\u2014",         " -- "),
    ("\u2013",         " - "),
    ("\u2026",         "..."),
    # Remaining mojibake fragments
    ("Ã¢â‚¬â€",        " -- "),
    ("Ã¢â‚¬â„¢",       "'"),
    ("Ã‚Â",            ""),
    ("â€™",            "'"),
    ("â€œ",            '"'),
    ("â€",             '"'),
    ("Ã©",             "e"),
    # Stray non-breaking spaces
    ("\u00a0",         " "),
]

def fix_file(path: Path) -> int:
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        print(f"  SKIP (read error): {path.name} -- {e}")
        return 0

    original = text
    for broken, good in FIXES:
        text = text.replace(broken, good)

    if text != original:
        path.write_text(text, encoding="utf-8")
        changes = sum(original.count(b) for b, _ in FIXES if b in original)
        return changes
    return 0


total_files = 0
total_fixes = 0
for path in SRC.rglob("*.jsx"):
    n = fix_file(path)
    if n > 0:
        total_files += 1
        total_fixes += n
        print(f"  FIXED {n:3d} occurrences: {path.relative_to(SRC)}")

print(f"\nDone. Fixed {total_fixes} occurrences across {total_files} files.")
