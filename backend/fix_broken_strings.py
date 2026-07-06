"""
Fix broken f-strings caused by encoding script replacing em-dash inside string literals.
Reads each file as raw bytes, finds the problematic patterns, and fixes them.
"""
import pathlib, ast, re

def clean_file_bytes(fname):
    p = pathlib.Path(fname)
    raw = p.read_bytes()
    
    # Step 1: Remove all non-ASCII bytes that aren't valid UTF-8 sequences for
    # the characters we want to keep. Replace every multi-byte non-ASCII sequence
    # with a safe ASCII substitute.
    
    # Decode with replacement to get a clean string
    text = raw.decode('utf-8', errors='replace')
    
    # Now fix the specific patterns introduced by the em-dash replacement
    # The pattern: something  -- " {var}" became broken because " was inside
    # We need to join them back: replace ' -- " ' with ' -- ' in f-strings
    # But more precisely: replace the broken pattern back to a dash
    
    # Pattern 1: f"text  -- " {something}" -> f"text -- {something}"
    # This happens when  -- " splits a string and variable
    text = re.sub(r'\s*--\s*"\s*\{', ' -- {', text)
    text = re.sub(r'\s*--\s*"\s*monitor', ' -- monitor', text)
    text = re.sub(r'\s*--\s*"\s*immediate', ' -- immediate', text)
    text = re.sub(r'\s*--\s*"\s*follow', ' -- follow', text)
    
    # Step 2: Remove all replacement characters and remaining mojibake
    text = text.replace('\ufffd', '')  # Unicode replacement character
    
    # Step 3: Remove emoji that got corrupted
    # Replace corrupted emoji sequences (they show as question marks or boxes)
    # with text alternatives
    text = re.sub(r'[\xc3][\xb0][\xc5][\xb8][\xc5][\xa1][\xc2][\xa8]', '[ALERT]', text)
    
    # Remove any remaining non-ASCII outside of string literals that could cause issues
    # Actually, let's just ensure the file is valid by removing replacement chars
    
    p.write_text(text, encoding='utf-8')
    
    try:
        ast.parse(p.read_text(encoding='utf-8'))
        return True, None
    except SyntaxError as e:
        return False, e


# Fix llm_chatbot.py line 119
# The broken line is: title = f"ðŸš¨ CRISIS ALERT  -- " {user_display}"
# Should be:          title = f"[ALERT] CRISIS ALERT -- {user_display}"

p1 = pathlib.Path('routers/llm_chatbot.py')
lines = p1.read_bytes().split(b'\n')
fixed_lines = []
for i, line in enumerate(lines):
    decoded = line.decode('utf-8', errors='replace')
    # Fix the broken f-string patterns
    if ' -- "' in decoded and '{' in decoded:
        # This is a broken em-dash replacement inside an f-string
        # Rejoin: "text  -- " {var}" -> "text -- {var}"
        decoded = re.sub(r'\s+--\s+"(\s*\{)', r' -- \1', decoded)
    # Also clean up replacement chars from emoji
    decoded = decoded.replace('\ufffd', '')
    # Remove corrupted emoji byte sequences
    decoded = re.sub(r'[^\x00-\x7f\u0080-\u024f\u2000-\u206f]+', '', decoded)
    fixed_lines.append(decoded.encode('utf-8'))

p1.write_bytes(b'\n'.join(fixed_lines))

ok, err = clean_file_bytes('routers/llm_chatbot.py')
print(('OK' if ok else 'BROKEN') + ': llm_chatbot.py' + ('' if ok else ' -- ' + str(err)))

p2 = pathlib.Path('routers/ml_predictions.py')
lines = p2.read_bytes().split(b'\n')
fixed_lines = []
for i, line in enumerate(lines):
    decoded = line.decode('utf-8', errors='replace')
    if ' -- "' in decoded and ('{' in decoded or 'monitor' in decoded or 'attention' in decoded):
        decoded = re.sub(r'\s+--\s+"(\s*\{|\s*[a-z])', lambda m: ' -- ' + m.group(1).lstrip(), decoded)
    decoded = decoded.replace('\ufffd', '')
    decoded = re.sub(r'[^\x00-\x7f\u0080-\u024f\u2000-\u206f]+', '', decoded)
    fixed_lines.append(decoded.encode('utf-8'))

p2.write_bytes(b'\n'.join(fixed_lines))

ok, err = clean_file_bytes('routers/ml_predictions.py')
print(('OK' if ok else 'BROKEN') + ': ml_predictions.py' + ('' if ok else ' -- ' + str(err)))

# Final full check
import pathlib as pl
skip = {'__pycache__', 'venv', '.venv', 'models', 'logs', '.git'}
errors = []
for p in pl.Path('.').rglob('*.py'):
    if any(s in p.parts for s in skip): continue
    try:
        ast.parse(p.read_text(encoding='utf-8'))
    except SyntaxError as e:
        errors.append((str(p), e.lineno, str(e)))

if errors:
    print('Remaining syntax errors:')
    for f, ln, msg in errors:
        print('  ' + f + ':' + str(ln) + ' -- ' + msg)
else:
    print('ALL BACKEND FILES: SYNTAX OK')
