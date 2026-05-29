"""
Optimize page modules for faster loading
"""

import os
import re

# Remove external font imports from all modules
modules_dir = "page_modules"

for filename in os.listdir(modules_dir):
    if not filename.endswith('.py'):
        continue
    
    filepath = os.path.join(modules_dir, filename)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove Google Fonts imports
    content = re.sub(
        r"@import url\('https://fonts\.googleapis\.com/[^']+'\);?\s*",
        '',
        content
    )
    
    # Remove duplicate font-family declarations (keep system fonts)
    content = re.sub(
        r"font-family: 'Inter'[^;]+;",
        "font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;",
        content
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Optimized {filename}")

print("\n✅ All modules optimized for offline use!")
