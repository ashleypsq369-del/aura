"""Fix syntax errors caused by mojibake in string literals"""
import pathlib, ast

files = [
    'routers/llm_chatbot.py',
    'routers/ml_predictions.py',
]

for fname in files:
    p = pathlib.Path(fname)
    raw = p.read_bytes()

    # Fix at byte level first
    byte_replacements = [
        (b'\xe2\x80\x94', b' -- '),
        (b'\xe2\x80\x93', b'-'),
        (b'\xe2\x80\x99', b"'"),
        (b'\xe2\x80\x9c', b'"'),
        (b'\xe2\x80\x9d', b'"'),
        (b'\xe2\x80\xa6', b'...'),
        (b'\xe2\x80\xa2', b'-'),
        (b'\xc2\xa0', b' '),
    ]
    changed = False
    for bad, good in byte_replacements:
        if bad in raw:
            raw = raw.replace(bad, good)
            changed = True
    if changed:
        p.write_bytes(raw)

    # Now fix at text level - remaining visible mojibake
    text = p.read_text(encoding='utf-8')
    orig = text

    # Remove emoji/special unicode that break syntax
    import re
    # Replace anything that looks like mojibake in string context
    text = re.sub(r'\xc3\xa2\xe2\x82\xac[^\x00-\x7f]*', ' -- ', text)

    # Fix specific visible patterns
    patterns = [
        ('\u00e2\u20ac\u201c', ' -- '),   # visible mojibake em-dash
        ('\u00e2\u20ac\u201d', '-'),
        ('\u00e2\u20ac\u2122', "'"),
        ('\u00e2\u20ac\u0153', '"'),
        ('\u00c3\xa2\u00e2\u20ac\u00e2\u20ac\u201c', ' -- '),
    ]
    for bad, good in patterns:
        text = text.replace(bad, good)

    if text != orig:
        p.write_text(text, encoding='utf-8')
        print('Fixed text level: ' + fname)

    # Verify
    try:
        ast.parse(p.read_text(encoding='utf-8'))
        print('OK: ' + fname)
    except SyntaxError as e:
        print('STILL ERROR ' + fname + ': ' + str(e))
        # Show the problematic line
        lines = p.read_text(encoding='utf-8').splitlines()
        if e.lineno and e.lineno <= len(lines):
            print('  Line ' + str(e.lineno) + ': ' + repr(lines[e.lineno-1]))

print('Done')
