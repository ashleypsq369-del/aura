"""Fix specific broken lines by reading bytes and cleaning non-ASCII in string literals"""
import pathlib, ast, re

def fix_file(fname):
    p = pathlib.Path(fname)
    # Read as latin-1 so we can see the raw bytes as characters
    text_latin = p.read_text(encoding='latin-1')
    # Re-encode as bytes
    raw = text_latin.encode('latin-1')
    
    # Replace em-dash and related sequences
    replacements = [
        (b'\xe2\x80\x94', b' -- '),  # em dash
        (b'\xe2\x80\x93', b'-'),      # en dash
        (b'\xe2\x80\x99', b"'"),      # right single quote
        (b'\xe2\x80\x9c', b'"'),      # left double quote
        (b'\xe2\x80\x9d', b'"'),      # right double quote  
        (b'\xe2\x80\xa6', b'...'),    # ellipsis
        (b'\xe2\x80\xa2', b'-'),      # bullet
        (b'\xf0\x9f\x9a\xa8', b'[ALERT]'),  # emoji
        (b'\xf0\x9f\xa9\xba', b''),   # emoji
        (b'\xf0\x9f\x93\x88', b''),   # emoji
        (b'\xf0\x9f\x92\xa8', b''),   # emoji
        (b'\xf0\x9f\x93\x8b', b''),   # emoji
        (b'\xc2\xa0', b' '),          # nbsp
    ]
    
    for bad, good in replacements:
        raw = raw.replace(bad, good)
    
    p.write_bytes(raw)
    
    try:
        ast.parse(p.read_text(encoding='utf-8'))
        print('OK: ' + fname)
        return True
    except SyntaxError as e:
        lines = p.read_bytes().split(b'\n')
        if e.lineno and e.lineno <= len(lines):
            print('STILL ERROR line ' + str(e.lineno) + ': ' + repr(lines[e.lineno-1][:80]))
        return False

fix_file('routers/llm_chatbot.py')
fix_file('routers/ml_predictions.py')
print('Done')
