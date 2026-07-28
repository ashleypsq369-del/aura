# -*- mode: python ; coding: utf-8 -*-
"""
ProjectAura PyInstaller spec file.
Bundles: projectaura_app.py + pywebview runtime
The backend Python files and frontend dist are NOT bundled —
they stay in the project folder and are launched as subprocesses.

Build:  pyinstaller projectaura_app.spec
Output: dist/ProjectAura.exe  (~80MB standalone)
"""
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

block_cipher = None

a = Analysis(
    ['projectaura_app.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        # Include pywebview data files
        *collect_data_files('webview'),
    ],
    hiddenimports=[
        'webview',
        'webview.platforms.winforms',
        'clr',
        'pythonnet',
        'clr_loader',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'numpy', 'pandas', 'PIL'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='ProjectAura',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,          # no console window
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='frontend/public/icons/icon-512.png',
)
