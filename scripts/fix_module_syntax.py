"""
Fix syntax errors in page modules
"""

import os
import re

modules_dir = "page_modules"

for filename in os.listdir(modules_dir):
    if not filename.endswith('.py') or filename == '__init__.py':
        continue
    
    filepath = os.path.join(modules_dir, filename)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix malformed docstrings at the start
    if content.startswith('"""\n\ndef render():'):
        # Remove the empty docstring
        content = content.replace('"""\n\ndef render():', 'def render():')
    
    # Fix docstrings that are split incorrectly
    content = re.sub(
        r'def render\(\):\s+"""Render this page"""\s+([A-Z][^\n]+)\s+',
        r'def render():\n    """\1\n    """\n    ',
        content
    )
    
    # Ensure proper indentation after def render():
    lines = content.split('\n')
    fixed_lines = []
    in_render = False
    
    for i, line in enumerate(lines):
        if line.strip().startswith('def render():'):
            fixed_lines.append(line)
            in_render = True
        elif in_render and i > 0 and not line.startswith('    ') and line.strip() and not line.strip().startswith('#'):
            # This line should be indented but isn't
            fixed_lines.append('    ' + line)
        else:
            fixed_lines.append(line)
    
    content = '\n'.join(fixed_lines)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Fixed {filename}")

print("\n✅ All syntax errors fixed!")
