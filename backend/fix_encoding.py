"""Fix mojibake encoding in backend files"""
import pathlib

files = [
    'main.py',
    'routers/advanced_ml.py',
    'routers/llm_chatbot.py',
    'routers/ml_predictions.py',
    'routers/ai_analysis.py',
    'services/aura_ai_engine.py',
    'services/true_llm_engine.py',
]

# Common mojibake patterns from UTF-8 double-encoded as latin-1
replacements = [
    # em dash variants
    ('\u00e2\u20ac\u201c', '--'),
    ('\u00e2\u20ac\u2014', '--'),
    ('\u00e2\u20ac\u0094', '--'),
    # smart quotes
    ('\u00e2\u20ac\u02dc', "'"),
    ('\u00e2\u20ac\u2122', "'"),
    ('\u00e2\u20ac\u0153', '"'),
    ('\u00e2\u20ac\x9d', '"'),
    ('\u00e2\u0080\x94', '--'),
    ('\u00e2\u0080\x99', "'"),
    ('\u00e2\u0080\x9c', '"'),
    ('\u00e2\u0080\x9d', '"'),
    # box drawing chars that appear as mojibake
    ('\u00e2\u0094\u0080', '--'),
    ('\u00e2\u0094\u0082', '|'),
    # other common ones
    ('\u00c3\u00b9', 'u'),
    ('\u00c3\u00a2', ''),
    ('\u00c3\xa2', ''),
]

for fname in files:
    p = pathlib.Path(fname)
    if not p.exists():
        print(f"SKIP (not found): {fname}")
        continue
    try:
        text = p.read_text(encoding='utf-8')
        original = text
        for bad, good in replacements:
            text = text.replace(bad, good)
        if text != original:
            p.write_text(text, encoding='utf-8')
            print(f"Fixed: {fname}")
        else:
            print(f"Clean: {fname}")
    except Exception as e:
        print(f"ERROR {fname}: {e}")

print("Done")
