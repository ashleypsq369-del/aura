"""
fix_dark_mode_pages.py
======================
Fixes dark mode issues across pages:
1. MyLegacyAccess - remove light purple BG inline style
2. BereavedFamilyDashboard - fix light-only bg classes
3. ContinuityBridge - fix light bg sections
4. HeirManagement, LegacySetup - fix #6B4F7A inline colors
5. AIInsights table header - fix light bg in dark mode
All replacements use Tailwind classes that themes.css overrides correctly.
"""
import re
from pathlib import Path

SRC = Path(r'c:\xampp\htdocs\ProjectAura_React\frontend\src')

def patch(path_str, replacements):
    p = SRC / path_str
    if not p.exists():
        print(f"  SKIP (not found): {path_str}")
        return
    txt = p.read_text(encoding='utf-8')
    orig = txt
    for old, new in replacements:
        txt = txt.replace(old, new)
    if txt != orig:
        p.write_text(txt, encoding='utf-8')
        print(f"  FIXED: {path_str}")
    else:
        print(f"  SKIP (no match): {path_str}")

# ── MyLegacyAccess ────────────────────────────────────────────────────────────
patch('pages/MyLegacyAccess.jsx', [
    # Remove light lavender page background - let dark mode CSS handle it
    ('style={BG}', ''),
    ('const BG           = { background: \'linear-gradient(135deg, #F3F0F7 0%, #EDE8F5 100%)\' };',
     '// BG removed - dark mode handled by CSS'),
    # Make pageClass just the container class
    ('const pageClass = "min-h-full bg-purple-50";', ''),
    ('{pageClass + " flex items-center justify-center"}',
     '"min-h-full flex items-center justify-center"'),
    ('{pageClass}', '"min-h-full"'),
    # Replace PURPLE inline color with CSS classes
    ('style={{ color: PURPLE, opacity: 0.3 }}', 'className="text-purple-400"'),
    ('style={{ color: PURPLE }}', 'className="text-purple-700"'),
    # Fix bg-gradient that's invisible in dark
    ('className="min-h-full bg-gradient-to-b from-purple-50/60 to-slate-50"',
     'className="min-h-full"'),
    # Fix white/80 card bg
    ('bg-white/80 backdrop-blur-sm rounded-2xl', 'bg-white rounded-2xl'),
    # Fix #EDE8F5 inline bg (purple icon container)
    ("style={{ backgroundColor: '#EDE8F5' }}", 'className="bg-purple-100"'),
    # Fix other PURPLE inline color refs
    ("style={{ color: '#6B4F7A' }}", 'className="text-purple-700"'),
    ("style={{ borderColor: '#6B4F7A40' }}", 'className="border-purple-300"'),
    ("style={{ backgroundColor: '#6B4F7A', color: 'white' }}",
     'className="bg-purple-700 text-white"'),
    ("style={{ borderColor: '#6B4F7A' }}", ''),
    ("style={{ borderColor: '#6B4F7A', animationName: 'spin' }}", ''),
    # Fix purple text on purple bg (invisible in dark)
    ('text-purple-900', 'text-purple-700'),
    ('text-purple-800', 'text-purple-600'),
])

# ── BereavedFamilyDashboard ────────────────────────────────────────────────────
patch('pages/BereavedFamilyDashboard.jsx', [
    # Light bg sections invisible in dark
    ('bg-gradient-to-br from-purple-50 to-pink-50', 'bg-purple-50'),
    ('bg-purple-50 border-2 border-purple-300', 'bg-purple-50 border-2 border-purple-300'),
    # Fix bg-white cards - already handled by CSS
    # Fix purple text on light bg
    ('text-purple-900', 'text-purple-700'),
    ('text-purple-800 text-sm', 'text-purple-700 text-sm'),
    # Fix amber section
    ('bg-amber-50 border-2 border-amber-300', 'bg-amber-50 border-2 border-amber-300'),
    ('text-amber-900', 'text-amber-700'),
    ('text-amber-800 text-sm', 'text-amber-700 text-sm'),
    # Fix red section
    ('bg-red-50 border-2 border-red-300', 'bg-red-50 border-2 border-red-300'),
    ('text-red-900', 'text-red-700'),
    # Fix phone debris (was already fixed by encoding script)
    # Fix bullet debris
    ('<span>€¢</span>', '<span className="text-amber-600">-</span>'),
])

# ── HeirManagement ─────────────────────────────────────────────────────────────
patch('pages/HeirManagement.jsx', [
    # Light purple page bg
    ("style={{ background: 'linear-gradient(135deg, #F3F0F7 0%, #EDE8F5 100%)' }}",
     'className="bg-purple-50"'),
    # PURPLE inline refs
    ("style={{ color: '#6B4F7A', opacity: 0.5 }}", 'className="text-purple-400"'),
    ("style={{ color: '#6B4F7A' }}", 'className="text-purple-700"'),
    ("style={{ backgroundColor: '#6B4F7A', color: 'white' }}",
     'className="bg-purple-700 text-white"'),
    ("style={{ borderColor: '#6B4F7A40' }}", ''),
    ("style={{ borderColor: '#6B4F7A' }}", ''),
    ('bg-white/80 backdrop-blur-sm', 'bg-white'),
    ('text-purple-900', 'text-purple-700'),
    ('text-purple-800', 'text-purple-600'),
])

# ── LegacySetup ────────────────────────────────────────────────────────────────
patch('pages/LegacySetup.jsx', [
    ("style={{ color: '#6B4F7A' }}", 'className="text-purple-700"'),
    ("style={{ backgroundColor: '#6B4F7A', color: 'white' }}",
     'className="bg-purple-700 text-white"'),
    ("style={{ background: 'linear-gradient(135deg, #F3F0F7 0%, #EDE8F5 100%)' }}",
     'className="bg-purple-50"'),
    ('bg-white/80 backdrop-blur-sm', 'bg-white'),
    ('text-purple-900', 'text-purple-700'),
])

# ── LegacyContentCreator ───────────────────────────────────────────────────────
patch('pages/LegacyContentCreator.jsx', [
    ("style={{ color: '#6B4F7A' }}", 'className="text-purple-700"'),
    ("style={{ backgroundColor: '#6B4F7A' }}", 'className="bg-purple-700"'),
    ("style={{ background: 'linear-gradient(135deg, #F3F0F7 0%, #EDE8F5 100%)' }}",
     'className="bg-purple-50"'),
    ('bg-white/80 backdrop-blur-sm', 'bg-white'),
    ('text-purple-900', 'text-purple-700'),
    ('text-purple-800', 'text-purple-600'),
])

# ── ContinuityBridge ───────────────────────────────────────────────────────────
patch('pages/ContinuityBridge.jsx', [
    # Fix light purple bg
    ('bg-white/80 rounded-2xl', 'bg-white rounded-2xl'),
    ('bg-white/80 rounded-xl', 'bg-white rounded-xl'),
    # Fix #6B4F7A inline
    ("style={{ color: '#6B4F7A' }}", 'className="text-purple-700"'),
    ("style={{ backgroundColor: '#6B4F7A' }}", 'className="bg-purple-700"'),
    ("style={selectedTab === tab.id ? { backgroundColor: '#6B4F7A' } : {}}",
     'style={selectedTab === tab.id ? { backgroundColor: "#7c3aed" } : {}}'),
    ('text-purple-900', 'text-purple-700'),
    ('text-purple-800', 'text-purple-600'),
    # Fix h1 with inline color
    ('<h1 className="text-4xl font-serif" style={{ color: \'#6B4F7A\' }}>',
     '<h1 className="text-4xl font-serif text-purple-700">'),
    # Fix h2/h3 inline colors
    ('className="text-lg font-semibold" style={{ color: \'#6B4F7A\' }}',
     'className="text-lg font-semibold text-purple-700"'),
    ('className="font-bold text-lg mb-3" style={{ color: \'#6B4F7A\' }}',
     'className="font-bold text-lg mb-3 text-purple-700"'),
    ('className="font-bold text-xl mb-4" style={{ color: \'#6B4F7A\' }}',
     'className="font-bold text-xl mb-4 text-purple-700"'),
    ('className="font-bold text-lg mb-2" style={{ color: \'#6B4F7A\' }}',
     'className="font-bold text-lg mb-2 text-purple-700"'),
    ('className="text-lg font-semibold mb-4" style={{ color: \'#6B4F7A\' }}',
     'className="text-lg font-semibold mb-4 text-purple-700"'),
    ('className="text-lg font-semibold mb-2" style={{ color: \'#6B4F7A\' }}',
     'className="text-lg font-semibold mb-2 text-purple-700"'),
    # Save button
    ('className="px-4 py-2 text-white rounded-xl font-semibold self-end disabled:opacity-50 flex items-center gap-2" style={{ backgroundColor: \'#6B4F7A\' }}',
     'className="px-4 py-2 text-white rounded-xl font-semibold self-end disabled:opacity-50 flex items-center gap-2 bg-purple-700 hover:bg-purple-800"'),
])

# ── AIInsights — fix table header on light bg ─────────────────────────────────
patch('pages/AIInsights.jsx', [
    # The gradient header above the XGBoost table
    ("style={{ background: 'linear-gradient(to right, #faf5ff, #eff6ff)' }}",
     ''),
    ("style={{ background: 'linear-gradient(to right, #fff7ed, #fee2e2)' }}",
     ''),
    ("style={{ background: 'linear-gradient(to right, #fffbeb, #fff7ed)' }}",
     ''),
])

# ── ShiftHandover — remaining encoding issues ─────────────────────────────────
patch('pages/ShiftHandover.jsx', [
    # Already fixed morning/afternoon/night labels above
    # Fix any remaining broken chars
    ('˜€ï¸', 'Afternoon'),
    ('Œ...', 'Morning'),
])

print("\nAll fixes applied.")
