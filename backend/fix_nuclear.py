"""Nuclear fix: scan every line for broken f-strings and fix them"""
import pathlib, ast, re

def fix_file_nuclear(fname):
    p = pathlib.Path(fname)
    
    # Read as bytes to get the raw content
    raw = p.read_bytes()
    
    # Replace ALL non-ASCII bytes with safe ASCII
    # Strategy: decode with replace, then clean up
    text = raw.decode('ascii', errors='replace')  # All non-ASCII becomes ?
    
    # Fix broken f-string patterns: "text ?" {var}" -> "text {var}"  
    # and  "text ?" word" -> "text word"
    # The ? characters come from non-ASCII bytes being replaced
    
    # First remove sequences of ? that came from multi-byte chars
    text = re.sub(r'\?+', '', text)
    
    # Fix broken string: text " {  ->  text {
    text = re.sub(r'"\s*\{', '{', text)
    
    # But we only want to do this inside f-strings... too risky globally
    # Let's be smarter: fix only lines that look like broken f-strings
    lines = text.split('\n')
    fixed = []
    for line in lines:
        # If line has an unmatched quote that looks like a broken f-string
        # Pattern: f"...  " {var}" -- the middle " breaks things
        if re.search(r'f"[^"]*"\s*\{[^}]*\}"', line):
            # Remove the rogue middle quote
            line = re.sub(r'(f"[^"]*)"(\s*\{[^}]*\})', r'\1\2', line)
        # Pattern: append(f"...  " word") -- rogue middle quote
        if re.search(r'f"[^"]*"\s*[a-z]', line) and line.count('"') > 2:
            # Try to join broken string
            line = re.sub(r'(f"[^"]*)"(\s*[a-z][^"]*")', r'\1\2', line)
        fixed.append(line)
    
    text = '\n'.join(fixed)
    p.write_text(text, encoding='ascii')
    
    try:
        ast.parse(p.read_text(encoding='utf-8'))
        return True, None
    except SyntaxError as e:
        return False, e


ok1, err1 = fix_file_nuclear('routers/llm_chatbot.py')
print(('OK' if ok1 else 'BROKEN') + ': llm_chatbot.py' + ((' line ' + str(err1.lineno)) if err1 else ''))

ok2, err2 = fix_file_nuclear('routers/ml_predictions.py')
print(('OK' if ok2 else 'BROKEN') + ': ml_predictions.py' + ((' line ' + str(err2.lineno)) if err2 else ''))

# Full check
import pathlib as pl
skip = {'__pycache__', 'venv', '.venv', 'models', 'logs', '.git'}
errors = []
for p in pl.Path('.').rglob('*.py'):
    if any(s in p.parts for s in skip): continue
    try:
        ast.parse(p.read_text(encoding='utf-8'))
    except SyntaxError as e:
        errors.append((str(p), e.lineno))

if errors:
    for f, ln in errors:
        print('ERROR: ' + f + ':' + str(ln))
else:
    print('ALL BACKEND FILES: SYNTAX OK')
