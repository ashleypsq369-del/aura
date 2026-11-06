"""
Remove em dashes (U+2014) and en dashes (U+2013) from all source files.
Replaces — with - and -- with - throughout.
"""
import os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))

INCLUDE_DIRS = [
    os.path.join(ROOT, "frontend", "src"),
    os.path.join(ROOT, "backend"),
    os.path.join(ROOT),  # root level md/txt/yaml files
]

INCLUDE_EXTS = {
    ".jsx", ".js", ".ts", ".tsx",
    ".py", ".css", ".md", ".txt",
    ".yaml", ".yml", ".html", ".json",
}

EXCLUDE_DIRS = {"node_modules", "dist", ".git", "__pycache__", "build", ".venv", "venv", "frontend", "backend"}
EXCLUDE_FILES = {"remove_emdashes.py"}

changed = []
skipped = 0

for base_dir in INCLUDE_DIRS:
    for dirpath, dirnames, filenames in os.walk(base_dir):
        # Prune excluded dirs in-place
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for fname in filenames:
            ext = os.path.splitext(fname)[1].lower()
            if ext not in INCLUDE_EXTS:
                continue
            fpath = os.path.join(dirpath, fname)
            try:
                with open(fpath, "r", encoding="utf-8", errors="replace") as f:
                    original = f.read()
            except Exception:
                skipped += 1
                continue

            if fname in EXCLUDE_FILES:
                continue

            # Replace em dash and en dash with plain hyphen
            fixed = original.replace("\u2014", "-").replace("\u2013", "-")

            if fixed != original:
                with open(fpath, "w", encoding="utf-8") as f:
                    f.write(fixed)
                rel = os.path.relpath(fpath, ROOT)
                changed.append(rel)
                print(f"FIXED: {rel}")

print(f"\nDone. Changed: {len(changed)} files | Skipped (unreadable): {skipped}")
