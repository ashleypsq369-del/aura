"""
fix_inline_gradients.py
========================
Replaces light-color inline style backgrounds that appear white in dark mode
with CSS classes that themes.css correctly handles.
"""
from pathlib import Path

SRC = Path(r'c:\xampp\htdocs\ProjectAura_React\frontend\src')

def patch(rel, replacements):
    p = SRC / rel
    if not p.exists():
        print(f"  SKIP: {rel}")
        return
    t = p.read_text(encoding='utf-8')
    orig = t
    for old, new in replacements:
        t = t.replace(old, new)
    if t != orig:
        p.write_text(t, encoding='utf-8')
        print(f"  FIXED: {rel}")
    else:
        print(f"  SKIP (no match): {rel}")

# AIInsights table header
patch('pages/AIInsights.jsx', [
    ("style={{ background:'linear-gradient(to right,#f5f3ff,#eff6ff)' }}",
     ""),
    ('style={{ background:\'linear-gradient(to right,#f5f3ff,#eff6ff)\' }}',
     ''),
])

# ContinuityBridge - light purple page bg
patch('pages/ContinuityBridge.jsx', [
    ("style={{ background: 'linear-gradient(135deg, #F3F0F7 0%, #EDE8F5 100%)' }}",
     ""),
])

# Dashboard table card headers
patch('pages/Dashboard.jsx', [
    ("style={{ background: 'linear-gradient(to right, #f0fdfa, #eff6ff)' }}",
     ""),
    ("style={{ background: 'linear-gradient(to right, #faf5ff, #ede9fe)' }}",
     ""),
    ("style={{ background: 'linear-gradient(to right, #fff1f2, #fdf2f8)' }}",
     ""),
])

# HIPAACompliance
patch('pages/HIPAACompliance.jsx', [
    ("style={{ background: 'linear-gradient(to right, #fff1f2, #fff)' }}",
     ""),
])

# Journal - light purple page bg
patch('pages/Journal.jsx', [
    ("style={{ background: 'linear-gradient(135deg, #F3F0F7 0%, #EDE8F5 100%)' }}",
     ""),
    ("style={{ color: '#6B4F7A', opacity: 0.5 }}", 'className="text-purple-400"'),
])

# Medications - light rose icon bg
patch('pages/Medications.jsx', [
    ("style={{ background: 'linear-gradient(135deg,#ffe4e6,#fecdd3)', color: '#be123c' }}",
     "className=\"bg-rose-100\" style={{ color: '#be123c' }}"),
])

# MemoryVault - light purple page bg
patch('pages/MemoryVault.jsx', [
    ("style={{ background: 'linear-gradient(135deg, #F3F0F7 0%, #EDE8F5 100%)' }}",
     ""),
    ("style={{ color: '#6B4F7A', opacity: 0.5 }}", 'className="text-purple-400"'),
    ("style={{ color: '#6B4F7A' }}", 'className="text-purple-700"'),
])

# Messages - light gradient page background
patch('pages/Messages.jsx', [
    ("style={{ background: 'linear-gradient(135deg,#f0fdfa 0%,#eff6ff 50%,#faf5ff 100%)' }}",
     ""),
])

# WellnessCheckin - success screen bg
patch('pages/WellnessCheckin.jsx', [
    ("style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' }}",
     ""),
])

print("\nDone.")
