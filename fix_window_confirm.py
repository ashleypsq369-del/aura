#!/usr/bin/env python3
"""Replace window.confirm() with the useConfirmDialog hook in all affected files."""
import re, os, glob

FILES = [
    'frontend/src/pages/Settings.jsx',
    'frontend/src/pages/MedicalKnowledge.jsx',
    'frontend/src/pages/LegacySetup.jsx',
    'frontend/src/pages/LegacyContentCreator.jsx',
    'frontend/src/pages/Journal.jsx',
    'frontend/src/pages/HeirManagement.jsx',
    'frontend/src/components/ChatSettings.jsx',
]

HOOK_IMPORT = "import useConfirmDialog from '../hooks/useConfirmDialog';\n"
HOOK_IMPORT_COMP = "import useConfirmDialog from '../../hooks/useConfirmDialog';\n"

for fpath in FILES:
    if not os.path.exists(fpath):
        print(f'SKIP (not found): {fpath}')
        continue

    src = open(fpath, encoding='utf-8').read()

    # Check if already has the hook
    if 'useConfirmDialog' in src:
        print(f'SKIP (already has hook): {fpath}')
        continue

    # Check if has window.confirm
    if 'window.confirm' not in src:
        print(f'SKIP (no window.confirm): {fpath}')
        continue

    # Add import after first import block
    is_component = 'components' in fpath
    hook_import = HOOK_IMPORT_COMP if is_component else HOOK_IMPORT

    # Insert after last import line
    lines = src.split('\n')
    last_import_idx = 0
    for i, line in enumerate(lines):
        if line.startswith('import '):
            last_import_idx = i
    lines.insert(last_import_idx + 1, hook_import.rstrip())
    src = '\n'.join(lines)

    # Add hook usage inside the component - find the first useState/useNavigate call
    # and add the hook after it
    src = re.sub(
        r'(const \{ user \} = useAuth\(\);|const navigate = useNavigate\(\);|const queryClient = useQueryClient\(\);)',
        r'\1\n  const { confirm: confirmAction, ConfirmDialog } = useConfirmDialog();',
        src, count=1
    )

    # Replace window.confirm patterns
    # Pattern: if (window.confirm('...')) { ... }
    # Replace with: await confirmAction({ title: '...', confirmLabel: 'Confirm', variant: 'danger' })
    
    # Simple replacement - change function containing window.confirm to async
    src = re.sub(
        r'if \(window\.confirm\(([^)]+)\)\)',
        r'if (await confirmAction({ title: \1, confirmLabel: "Confirm", variant: "danger" }))',
        src
    )

    # Add ConfirmDialog to JSX return — find the last </div> or </motion.div> before end
    # Simple approach: add <ConfirmDialog /> just before the last closing return tag
    src = re.sub(
        r'(\s+</(?:div|motion\.div|AnimatePresence)>\s*\);\s*}[\s\n]*(?:export default|$))',
        r'\n      <ConfirmDialog />\1',
        src, count=1
    )

    open(fpath, 'w', encoding='utf-8', newline='\n').write(src)
    print(f'Fixed: {fpath}')

print('\nDone.')
