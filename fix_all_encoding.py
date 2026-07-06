"""
fix_all_encoding.py - Clean mojibake from all source files
Uses raw bytes to avoid the fix script itself having encoding issues
"""
import pathlib

ROOT = pathlib.Path(".")
EXTENSIONS = {".py", ".jsx", ".js", ".ts", ".tsx"}
SKIP_DIRS = {"__pycache__", "venv", ".venv", "env", "node_modules",
             ".git", "models", "logs", "dist", "build", ".kiro"}

# Each pair: (bad_bytes_as_hex_string, replacement_char)
# Built entirely from byte values to avoid encoding the script itself
def make_fixes():
    fixes = []
    # em dash (U+2014) -- appears as bytes C3A2 E282AC E28094 or e2 80 94
    fixes.append((bytes([0xc3,0xa2,0xe2,0x82,0xac,0xe2,0x80,0x94]).decode('latin-1'), "\u2014"))
    fixes.append((bytes([0xe2,0x80,0x94]).decode('latin-1'), "\u2014"))
    fixes.append((bytes([0xc3,0xa2,0xe2,0x82,0xac,0xe2,0x80,0x93]).decode('latin-1'), "\u2013"))
    fixes.append((bytes([0xe2,0x80,0x93]).decode('latin-1'), "\u2013"))
    # right single quote (U+2019)
    fixes.append((bytes([0xe2,0x80,0x99]).decode('latin-1'), "\u2019"))
    fixes.append((bytes([0xc3,0xa2,0xe2,0x82,0xac,0xe2,0x84,0xa2]).decode('latin-1'), "\u2019"))
    # left single quote (U+2018)
    fixes.append((bytes([0xe2,0x80,0x98]).decode('latin-1'), "\u2018"))
    # left double quote (U+201C)
    fixes.append((bytes([0xe2,0x80,0x9c]).decode('latin-1'), "\u201c"))
    fixes.append((bytes([0xc3,0xa2,0xe2,0x82,0xac,0xc5,0x93]).decode('latin-1'), "\u201c"))
    # right double quote (U+201D)
    fixes.append((bytes([0xe2,0x80,0x9d]).decode('latin-1'), "\u201d"))
    # ellipsis (U+2026)
    fixes.append((bytes([0xe2,0x80,0xa6]).decode('latin-1'), "\u2026"))
    # bullet (U+2022)
    fixes.append((bytes([0xe2,0x80,0xa2]).decode('latin-1'), "\u2022"))
    # non-breaking space
    fixes.append((bytes([0xc2,0xa0]).decode('latin-1'), " "))
    # box drawing
    fixes.append((bytes([0xe2,0x94,0x80]).decode('latin-1'), "-"))
    fixes.append((bytes([0xe2,0x94,0x82]).decode('latin-1'), "|"))
    return fixes

FIXES = make_fixes()

def should_skip(p):
    return any(s in p.parts for s in SKIP_DIRS)

total_fixed = 0
total_checked = 0

for path in ROOT.rglob("*"):
    if not path.is_file(): continue
    if path.suffix not in EXTENSIONS: continue
    if should_skip(path): continue
    try:
        raw = path.read_bytes()
        # Remove BOM if present
        if raw[:3] == b'\xef\xbb\xbf':
            raw = raw[3:]
        text = raw.decode('utf-8')
    except Exception:
        continue

    original = text
    total_checked += 1

    for bad, good in FIXES:
        if bad in text:
            text = text.replace(bad, good)

    if text != original:
        path.write_text(text, encoding='utf-8')
        total_fixed += 1
        print("Fixed: " + str(path))

print("")
print("Checked " + str(total_checked) + " files")
print("Fixed   " + str(total_fixed) + " files")
