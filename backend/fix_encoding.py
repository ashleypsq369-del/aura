"""Fix encoding artifacts in frontend JSX files."""
import os

files_to_fix = [
    r'c:\xampp\htdocs\ProjectAura_React\frontend\src\pages\Messages.jsx',
    r'c:\xampp\htdocs\ProjectAura_React\frontend\src\components\AddContactModal.jsx',
]

replacements = [
    # AddContactModal footer emoji
    (b'\xc3\xb0\xc5\xb8\xe2\x80\x99\xc2\xa1', b''),   # garbled 💡
    (b'\xf0\x9f\x92\xa1', b''),                          # 💡 UTF-8
    # Messages.jsx checkmark garble
    (b'font-bold">"', b'font-bold">\xe2\x9c\x93'),       # " -> ✓
    # ¥ member count
    (b'\xc2\xa5 ', b''),                                  # ¥ + space
]

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        print(f'SKIP: {filepath}')
        continue
    with open(filepath, 'rb') as f:
        content = f.read()
    original = content
    for bad, good in replacements:
        content = content.replace(bad, good)
    if content != original:
        with open(filepath, 'wb') as f:
            f.write(content)
        print(f'FIXED: {filepath}')
    else:
        print(f'NO CHANGE: {filepath}')
