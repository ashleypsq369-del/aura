"""Patch Register.jsx: add createPortal import + questionnaire opt-in modal"""
import re

path = "frontend/src/pages/Register.jsx"
with open(path, encoding="utf-8") as f:
    src = f.read()

# 1. Add createPortal to react-dom import (or add new import)
if "from 'react-dom'" not in src:
    src = src.replace(
        "from 'framer-motion';",
        "from 'framer-motion';\nimport { createPortal } from 'react-dom';"
    )

# 2. Add Sparkles, ArrowRight to lucide imports
if "Sparkles" not in src:
    src = src.replace(
        " Building2, Heart, Home, Stethoscope, BedDouble, Calendar,",
        " Building2, Heart, Home, Stethoscope, BedDouble, Calendar, Sparkles, ArrowRight,"
    )

# 3. Add showSetupModal state after the existing useState declarations in the component
if "showSetupModal" not in src:
    src = src.replace(
        "const [legalModal, setLegalModal] = useState(null);",
        "const [legalModal, setLegalModal] = useState(null);\n const [showSetupModal, setShowSetupModal] = useState(false);\n const [registeredUser, setRegisteredUser] = useState(null);"
    )

# 4. Replace navigate('/setup') with show modal instead
src = src.replace(
    """    setUser(user);
    toast.success('Account created! Welcome to Project Aura.');
    navigate('/setup');""",
    """    setUser(user);
    toast.success('Account created! Welcome to Project Aura.');
    setRegisteredUser(user);
    setShowSetupModal(true);"""
)

# 5. Add the modal JSX before the closing </> at the very end of the return
MODAL_JSX = """
      {/* Questionnaire opt-in modal */}
      {showSetupModal && typeof document !== 'undefined' && createPortal(
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9900, background: 'rgba(0,0,0,0.5)' }}
          />
          <div style={{ position: 'fixed', inset: 0, zIndex: 9901, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, pointerEvents: 'none' }}>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              onClick={e => e.stopPropagation()}
              style={{ pointerEvents: 'all', background: '#ffffff', borderRadius: 14, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: "'Inter','system-ui',sans-serif" }}
            >
              {/* Accent */}
              <div style={{ height: 3, background: 'linear-gradient(90deg,#0d9488,#0891b2)' }} />

              {/* Header */}
              <div style={{ padding: '20px 22px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: '#f0fdf4', border: '1px solid #d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={19} style={{ color: '#0d9488' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Welcome, {registeredUser?.full_name?.split(' ')[0] || 'there'}!
                    </p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                      Your account is ready
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, margin: 0 }}>
                  Would you like to personalise your care experience? A short questionnaire helps us tailor your dashboard, symptom tracking, and care recommendations to your specific needs.
                </p>
              </div>

              {/* Options */}
              <div style={{ padding: '0 22px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Personalise option */}
                <button
                  onClick={() => { setShowSetupModal(false); navigate('/setup'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    borderRadius: 11, border: '2px solid #0d9488',
                    background: '#f0fdf4', cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={16} style={{ color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      Personalise my care
                    </p>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
                      Takes 3-5 minutes - tailors every part of the app to you
                    </p>
                  </div>
                  <ArrowRight size={16} style={{ color: '#0d9488', flexShrink: 0 }} />
                </button>

                {/* Skip option */}
                <button
                  onClick={() => {
                    setShowSetupModal(false);
                    const dest = registeredUser?.role === 'patient' ? '/my-space'
                      : registeredUser?.role === 'family' ? '/dashboard'
                      : '/dashboard';
                    navigate(dest);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    borderRadius: 11, border: '1px solid #e2e8f0',
                    background: '#ffffff', cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ArrowRight size={16} style={{ color: '#94a3b8' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', margin: 0 }}>
                      Skip for now
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                      Use standard settings - you can personalise later in Settings
                    </p>
                  </div>
                </button>
              </div>

              <div style={{ padding: '0 22px 16px' }}>
                <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                  You can always retake the questionnaire from Settings at any time
                </p>
              </div>
            </motion.div>
          </div>
        </>,
        document.body
      )}
"""

# Insert before the last closing tags of the return
src = src.replace("  </>\n );", f"{MODAL_JSX}  </>\n );", 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("Register.jsx patched successfully")

# Verify
checks = [
    ("showSetupModal", "Modal state added"),
    ("createPortal", "createPortal imported"),
    ("Personalise my care", "Modal content added"),
    ("Skip for now", "Skip option added"),
    ("Sparkles", "Sparkles icon imported"),
]
for needle, label in checks:
    print(f"  {'OK' if needle in src else 'MISSING'}: {label}")
