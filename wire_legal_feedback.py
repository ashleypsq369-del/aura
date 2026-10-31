#!/usr/bin/env python3
"""
Wire LegalModal into Register.jsx and FeedbackWidget into Layout.jsx
"""
import os

# ── Register.jsx ─────────────────────────────────────────────────────────────
reg = open('frontend/src/pages/Register.jsx', encoding='utf-8').read()

# 1. Add modal state after terms state
OLD_STATE = " const [country, setCountry] = useState(COUNTRIES[0]); // Ghana default"
NEW_STATE = """ const [country, setCountry] = useState(COUNTRIES[0]); // Ghana default
 const [showTermsModal, setShowTermsModal] = useState(false);
 const [showPrivacyModal, setShowPrivacyModal] = useState(false);"""
reg = reg.replace(OLD_STATE, NEW_STATE)

# 2. Replace the span links with button links that open the modal
OLD_LINKS = """ <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-teal-600 font-semibold underline hover:text-teal-700">Terms of Service</a>{' '}and{' '}
 <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-teal-600 font-semibold underline hover:text-teal-700">Privacy Policy</a>"""
NEW_LINKS = """ <button type="button" onClick={() => setShowTermsModal(true)} className="text-teal-600 font-semibold underline hover:text-teal-700 bg-none border-none cursor-pointer p-0">Terms of Service</button>{' '}and{' '}
 <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-teal-600 font-semibold underline hover:text-teal-700 bg-none border-none cursor-pointer p-0">Privacy Policy</button>"""

# Also handle the original span version if still present
OLD_SPANS = """ <span className="text-teal-600 font-semibold">Terms of Service</span> and{' '}
 <span className="text-teal-600 font-semibold">Privacy Policy</span>"""
NEW_SPANS = """ <button type="button" onClick={() => setShowTermsModal(true)} className="text-teal-600 font-semibold underline hover:text-teal-700 bg-transparent border-none cursor-pointer p-0">Terms of Service</button>{' '}and{' '}
 <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-teal-600 font-semibold underline hover:text-teal-700 bg-transparent border-none cursor-pointer p-0">Privacy Policy</button>"""

if OLD_LINKS in reg:
    reg = reg.replace(OLD_LINKS, NEW_LINKS)
elif OLD_SPANS in reg:
    reg = reg.replace(OLD_SPANS, NEW_SPANS)

# 3. Add LegalModal components before the closing return tag
# Find the last </> or </motion.div> in the return
CLOSE = "  );\n}"
MODAL_JSX = """      {/* Legal Modals */}
      <LegalModal type="terms"   open={showTermsModal}   onClose={() => setShowTermsModal(false)} />
      <LegalModal type="privacy" open={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </>
  );
}"""

# Replace the last occurrence of the closing
last_idx = reg.rfind(CLOSE)
if last_idx != -1:
    # Find the <> wrapper
    reg = reg[:last_idx] + MODAL_JSX
else:
    print("WARNING: Could not find closing tag for Register")

open('frontend/src/pages/Register.jsx', 'w', encoding='utf-8', newline='\n').write(reg)
print("Register.jsx done")

# ── Layout.jsx ────────────────────────────────────────────────────────────────
layout = open('frontend/src/components/layout/Layout.jsx', encoding='utf-8').read()

# Add FeedbackWidget to the main render
# Find the closing </div> of the main layout just before export end
if 'FeedbackWidget' not in layout:
    print("FeedbackWidget not in Layout - need to add render")

# Find where TaskStatusBar is rendered and add FeedbackWidget after main content
OLD_MAIN = "      </main>\n    </div>"
NEW_MAIN = """      </main>
      {/* Floating feedback widget — shown for all authenticated users */}
      <FeedbackWidget />
    </div>"""

if OLD_MAIN in layout:
    layout = layout.replace(OLD_MAIN, NEW_MAIN)
    print("Layout.jsx: added FeedbackWidget to render")
else:
    # Try to find any pattern
    import re
    matches = [m.start() for m in re.finditer(r'</main>', layout)]
    print(f"Found {len(matches)} </main> tags at positions:", matches)
    if matches:
        pos = matches[-1] + len('</main>')
        layout = layout[:pos] + '\n      <FeedbackWidget />' + layout[pos:]
        print("Layout.jsx: inserted FeedbackWidget after last </main>")

open('frontend/src/components/layout/Layout.jsx', 'w', encoding='utf-8', newline='\n').write(layout)
print("Layout.jsx done")

# ── App.jsx: remove the standalone /terms and /privacy routes since they're now modals
# Actually keep them as fallback pages too - they're already added
print("\nAll done.")
