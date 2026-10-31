#!/usr/bin/env python3
"""Make handler functions async where await confirmAction is used."""
import re, os

FILES = [
    'frontend/src/pages/LegacySetup.jsx',
    'frontend/src/pages/HeirManagement.jsx',
    'frontend/src/pages/LegacyContentCreator.jsx',
    'frontend/src/pages/Journal.jsx',
    'frontend/src/pages/Settings.jsx',
    'frontend/src/pages/MedicalKnowledge.jsx',
    'frontend/src/components/ChatSettings.jsx',
    'frontend/src/pages/MemoryVault.jsx',
]

for fpath in FILES:
    if not os.path.exists(fpath):
        continue
    src = open(fpath, encoding='utf-8').read()
    if 'await confirmAction' not in src:
        continue

    orig = src

    # Find the pattern: a non-async function containing await confirmAction
    # Pattern: const handleXxx = (e) => { ... await confirmAction ...
    # Fix: const handleXxx = async (e) => {

    # Fix arrow functions: const xxx = (...) => {
    src = re.sub(
        r'(const\s+\w+\s*=\s*)(\([^)]*\)\s*=>)',
        lambda m: m.group(1) + 'async ' + m.group(2) if 'async' not in m.group(1) + m.group(2) else m.group(0),
        src
    )

    # Fix regular functions: function handleXxx(...) {
    src = re.sub(
        r'(function\s+\w+\s*\([^)]*\)\s*\{)',
        lambda m: 'async ' + m.group(1) if 'async' not in m.group(1) else m.group(1),
        src
    )

    if src != orig:
        open(fpath, 'w', encoding='utf-8', newline='\n').write(src)
        print(f'Fixed async: {fpath}')
    else:
        print(f'No change: {fpath}')
