"""Final fix for triple-encoded em-dash sequences"""
import pathlib, ast

def fix_file(fname):
    p = pathlib.Path(fname)
    raw = p.read_bytes()
    
    # The sequence is: c3 a2 e2 82 ac XX where XX could be various quote/dash bytes
    # This is UTF-8 for Ã (c3 a2) + â‚¬ (e2 82 ac) = double-encoded em dash
    replacements = [
        # Triple-encoded variants ending with dash/quote
        (b'\xc3\xa2\xe2\x82\xac\xe2\x80\x94', b' -- '),
        (b'\xc3\xa2\xe2\x82\xac\xe2\x80\x93', b'-'),
        (b'\xc3\xa2\xe2\x82\xac\xe2\x80\x99', b"'"),
        (b'\xc3\xa2\xe2\x82\xac\xe2\x80\x9c', b'"'),
        (b'\xc3\xa2\xe2\x82\xac\xe2\x80\x9d', b'"'),
        # Partial sequences that terminate strings
        (b'\xc3\xa2\xe2\x82\xac', b' -- '),
        # Standard em-dash
        (b'\xe2\x80\x94', b' -- '),
        (b'\xe2\x80\x93', b'-'),
        (b'\xe2\x80\x99', b"'"),
        (b'\xe2\x80\x9c', b'"'),
        (b'\xe2\x80\x9d', b'"'),
        (b'\xe2\x80\xa6', b'...'),
        # Emoji bytes
        (b'\xf0\x9f\x9a\xa8', b'[ALERT]'),
        (b'\xf0\x9f\xa9\xba', b''),
        (b'\xf0\x9f\x93\x88', b''),
        (b'\xf0\x9f\x92\xa8', b''),
        (b'\xf0\x9f\x93\x8b', b''),
        (b'\xc2\xa0', b' '),
    ]
    
    for bad, good in replacements:
        raw = raw.replace(bad, good)
    
    p.write_bytes(raw)
    
    try:
        ast.parse(p.read_text(encoding='utf-8'))
        print('FIXED OK: ' + fname)
        return True
    except SyntaxError as e:
        print('STILL BROKEN ' + fname + ' line ' + str(e.lineno) + ': ' + str(e))
        # Show hex of offending line
        lines = p.read_bytes().split(b'\n')
        if e.lineno and e.lineno <= len(lines):
            print('  HEX: ' + lines[e.lineno-1][:100].hex())
        return False

fix_file('routers/llm_chatbot.py')
fix_file('routers/ml_predictions.py')

# Now fix ALL backend files
import pathlib as pl
skip = {'__pycache__','venv','.venv','models','logs','.git'}
errors = []
for p in pl.Path('.').rglob('*.py'):
    if any(s in p.parts for s in skip): continue
    try:
        ast.parse(p.read_text(encoding='utf-8'))
    except SyntaxError as e:
        errors.append((str(p), e))

if errors:
    print('Remaining errors:')
    for f, e in errors:
        print('  ' + f + ': line ' + str(e.lineno))
else:
    print('ALL BACKEND FILES: OK')
