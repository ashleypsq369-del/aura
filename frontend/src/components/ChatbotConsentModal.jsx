/**
 * ChatbotConsentModal
 * Redesigned to match FocusedAIExplanation DNA:
 * portal · spring animation · fixed header / scrollable body / fixed footer
 * inline styles · no AI-template colored box grids
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Shield, Phone, Check, AlertTriangle } from 'lucide-react';

const CAN = [
  'Navigate the platform and answer questions',
  'Explain your medications and care plan',
  'Offer emotional support and reassurance',
  'Summarise your health records',
  'Guide you through features',
];

const CANNOT = [
  'Diagnose medical conditions',
  'Prescribe or change medications',
  'Handle emergencies — call 193',
  'Replace your doctor or care team',
  'Modify your health records',
];

export default function ChatbotConsentModal({ isOpen, onAccept, onDecline, userName }) {
  const [agreed, setAgreed] = useState(false);
  const firstName = userName?.split(' ')[0] || null;

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          key="ccm-bg"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onDecline}
          style={{ position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(0,0,0,0.45)' }}
        />

        {/* Card */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 9501, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, pointerEvents: 'none' }}>
          <motion.div
            key="ccm-card"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            onClick={e => e.stopPropagation()}
            style={{
              pointerEvents: 'all',
              background: '#ffffff',
              borderRadius: 14,
              width: '100%',
              maxWidth: 480,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              fontFamily: "'Inter','system-ui',sans-serif",
            }}
          >
            {/* Teal accent bar */}
            <div style={{ height: 3, background: 'linear-gradient(90deg,#0d9488,#0891b2)', flexShrink: 0 }} />

            {/* Fixed header */}
            <div style={{
              padding: '16px 20px 14px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f0fdf4', border: '1px solid #d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={18} style={{ color: '#0d9488' }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Meet Aura AI</p>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                    {firstName ? `Hi ${firstName}, a quick note before we chat` : 'A quick note before we chat'}
                  </p>
                </div>
              </div>
              <button onClick={onDecline} style={{ width: 30, height: 30, borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Disclaimer — compact single block */}
              <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
                <AlertTriangle size={15} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', margin: 0 }}>Not a medical professional</p>
                  <p style={{ fontSize: 12, color: '#78350f', margin: '3px 0 0', lineHeight: 1.5 }}>
                    Aura cannot diagnose, prescribe, or handle emergencies. For urgent needs call <strong>193</strong> or contact your care team.
                  </p>
                </div>
              </div>

              {/* Capabilities — info row grid, not colored boxes */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>CAPABILITIES</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                  {/* Can */}
                  <div style={{ padding: '12px 0 12px 0', borderRight: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#0d9488', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={11} /> What Aura can do
                    </p>
                    {CAN.map(t => (
                      <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 5 }}>
                        <span style={{ fontSize: 10, color: '#0d9488', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>+</span>
                        <span style={{ fontSize: 12, color: '#334155', lineHeight: 1.4 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                  {/* Cannot */}
                  <div style={{ padding: '12px 0 12px 12px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <X size={11} /> What Aura cannot do
                    </p>
                    {CANNOT.map(t => (
                      <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 5 }}>
                        <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>-</span>
                        <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Privacy + emergency — single compact row */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', gap: 8, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', alignItems: 'flex-start' }}>
                  <Shield size={13} style={{ color: '#94a3b8', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.5 }}>Conversations are <strong>securely stored</strong> and may be reviewed by your care team. HIPAA-compliant.</p>
                </div>
                <div style={{ flex: 1, display: 'flex', gap: 8, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', alignItems: 'flex-start' }}>
                  <Phone size={13} style={{ color: '#94a3b8', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.5 }}>Emergency: <strong style={{ color: '#dc2626' }}>193</strong><br />National: <strong>112</strong></p>
                </div>
              </div>

              {/* Consent */}
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
                padding: '12px 14px', borderRadius: 10,
                border: `2px solid ${agreed ? '#0d9488' : '#e2e8f0'}`,
                background: agreed ? '#f0fdf4' : '#ffffff',
                transition: 'all 0.15s',
              }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  style={{ marginTop: 2, width: 15, height: 15, accentColor: '#0d9488', cursor: 'pointer', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#334155', lineHeight: 1.55 }}>
                  I understand Aura is an AI. For medical concerns I will contact my care team or emergency services.
                </span>
              </label>
            </div>

            {/* Fixed footer */}
            <div style={{ padding: '12px 20px', background: '#fafafa', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexShrink: 0 }}>
              <button onClick={onDecline} style={{ padding: '9px 16px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#ffffff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Use Human Support
              </button>
              <button onClick={onAccept} disabled={!agreed} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 9, border: 'none',
                background: agreed ? '#0d9488' : '#e2e8f0',
                color: agreed ? '#ffffff' : '#94a3b8',
                fontSize: 13, fontWeight: 700, cursor: agreed ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}>
                <Sparkles size={13} /> Start chatting with Aura
              </button>
            </div>
          </motion.div>
        </div>
      </>
    </AnimatePresence>,
    document.body
  );
}
