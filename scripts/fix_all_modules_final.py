"""
Fix ALL module syntax errors - Final solution
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
    
    # Check if it already has proper structure
    if content.strip().startswith('def render():'):
        print(f"✓ {filename} already correct")
        continue
    
    # Remove any malformed def render() lines
    content = re.sub(r'^def render\(\):\s*$', '', content, flags=re.MULTILINE)
    
    # Find the module docstring
    lines = content.split('\n')
    new_lines = []
    found_docstring = False
    docstring_end = 0
    
    for i, line in enumerate(lines):
        if '"""' in line and not found_docstring:
            found_docstring = True
            new_lines.append(line)
            if line.count('"""') == 2:  # Single line docstring
                docstring_end = i + 1
                break
        elif '"""' in line and found_docstring:
            new_lines.append(line)
            docstring_end = i + 1
            break
        elif found_docstring:
            new_lines.append(line)
        else:
            new_lines.append(line)
    
    # Get header (docstring + imports)
    header_lines = []
    code_start = docstring_end
    
    for i in range(docstring_end, len(lines)):
        line = lines[i]
        stripped = line.strip()
        
        if (stripped.startswith('import ') or 
            stripped.startswith('from ') or 
            'sys.path' in stripped or
            stripped == '' or
            stripped.startswith('#')):
            header_lines.append(line)
            code_start = i + 1
        else:
            break
    
    # Get the body (everything after imports)
    body_lines = lines[code_start:]
    
    # Remove any existing def render() or def main()
    body_text = '\n'.join(body_lines)
    body_text = re.sub(r'^\s*def (render|main)\(\):\s*\n', '', body_text, flags=re.MULTILINE)
    body_text = re.sub(r'\nif __name__ == "__main__":\s*\n\s*main\(\)\s*$', '', body_text)
    
    # Indent the body
    body_lines = body_text.split('\n')
    indented_body = []
    for line in body_lines:
        if line.strip():
            indented_body.append('    ' + line)
        else:
            indented_body.append('')
    
    # Reconstruct the module
    final_content = '\n'.join(new_lines[:docstring_end]) + '\n'
    final_content += '\n'.join(header_lines) + '\n\n'
    final_content += 'def render():\n'
    final_content += '    """Render this page"""\n'
    final_content += '\n'.join(indented_body)
    
    # Write the fixed module
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(final_content)
    
    print(f"✓ Fixed {filename}")

print("\n✅ All modules fixed!")
