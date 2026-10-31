/**
 * LegalModal — Terms & Conditions + Privacy Policy
 * Uses ReactDOM.createPortal to render at document.body level
 * so it is NEVER clipped, never bleeds, always perfectly centered.
 * Matches the reference design: white card, scrollable body, X, Accept/Decline.
 */
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/* ─── Content ──────────────────────────────────────────── */
const TERMS_CONTENT = [
  { heading: 'General Site Usage', sub: 'Last Revised: October 2026',
    body: `Welcome to Project Aura. This platform is provided as a service to healthcare professionals, patients, and their families. It may be used for care coordination, symptom tracking, and informational purposes only. Because these Terms contain legal obligations, please read them carefully.` },
  { heading: '1. YOUR AGREEMENT',
    body: `By creating an account or using Project Aura, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use this platform.\n\nPLEASE NOTE: We reserve the right, at our sole discretion, to change or modify these Terms at any time. Such changes are effective immediately upon posting. Continued use constitutes your agreement to the modified Terms.` },
  { heading: '2. NATURE OF THE SERVICE',
    body: `Project Aura is a palliative care coordination platform. It facilitates communication, symptom tracking, care planning, and resource access. It does not replace professional medical advice, diagnosis, or treatment. Always seek guidance from qualified healthcare professionals. In an emergency, call 999 or 112 immediately.` },
  { heading: '3. USER ACCOUNTS',
    body: `Each account is assigned a role (Patient, Family, Caregiver, Clinician, or Provider) that determines access permissions. You are responsible for maintaining the confidentiality of your login credentials. Do not share your account. Report any suspected unauthorised access to: admin@projectaura.gh` },
  { heading: '4. HEALTH INFORMATION & CONSENT',
    body: `By using the Platform you consent to your health data being stored and used for care coordination, clinical monitoring, and personalisation. You may withdraw consent at any time by contacting us — this will result in account deactivation.` },
  { heading: '5. ACCEPTABLE USE',
    body: `You must not: upload false health information; access other users' data; harass, harm, or deceive others; reverse-engineer the Platform; violate any applicable law. Violations may result in immediate account termination.` },
  { heading: '6. AI FEATURES DISCLAIMER',
    body: `AI insights (risk scoring, symptom analysis, care recommendations) are decision-support tools only. Clinical decisions must always be made by qualified healthcare professionals. AI outputs may contain errors; the Platform disclaims liability for decisions made solely on AI-generated content.` },
  { heading: '7. LIMITATION OF LIABILITY',
    body: `To the maximum extent permitted by law, Project Aura and its developers shall not be liable for any indirect, incidental, or consequential damages arising from use of the Platform. The Platform is provided "as is" without warranty.` },
  { heading: '8. CONTACT',
    body: `Questions: legal@projectaura.gh | Project Aura, Group 31, Ghana.` },
];

const PRIVACY_CONTENT = [
  { heading: 'Data Protection Policy', sub: 'Last Revised: October 2026',
    body: `Your health data is sensitive and we take its protection seriously. This policy explains what we collect, how we use it, and how we protect it.` },
  { heading: '1. DATA WE COLLECT',
    body: `We collect: account information (name, email, phone, role); health data (symptoms, vitals, medications, assessments, preferences); usage data (pages visited, features used); device data (browser, IP address). We collect only what is necessary to provide care coordination services.` },
  { heading: '2. HOW WE USE YOUR DATA',
    body: `Your data is used to: coordinate care between clinicians, caregivers, and family; personalise your care; generate AI clinical insights for your care team; send reminders and notifications; improve the Platform through anonymised analytics. We never sell your data.` },
  { heading: '3. DATA STORAGE & SECURITY',
    body: `All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Role-based access ensures clinicians see only their patients' data, and family members see only their linked patient. In the event of a breach, we notify affected users within 72 hours.` },
  { heading: '4. DATA SHARING',
    body: `We share data only with: your care team as part of care coordination; family members you have linked; service providers under strict data processing agreements; and when legally required by Ghanaian law. We do not share data for advertising.` },
  { heading: '5. YOUR RIGHTS',
    body: `You have the right to: access a copy of your data; correct inaccuracies; request deletion; receive your data in a portable format; and withdraw consent at any time. Contact: privacy@projectaura.gh` },
  { heading: '6. RETENTION & CONTACT',
    body: `Health data is retained for a minimum of 10 years per Ghanaian Medical Records Act. Non-clinical account data may be deleted on request. DPO: dpo@projectaura.gh | Last updated: October 2026.` },
];

/* ─── Modal ─────────────────────────────────────────────── */
export default function LegalModal({ type = 'terms', open, onClose, onAccept }) {
  const isTerms = type === 'terms';
  const title   = isTerms ? 'Terms and Conditions' : 'Privacy Policy';
  const items   = isTerms ? TERMS_CONTENT : PRIVACY_CONTENT;

  const handleAccept = () => {
    onAccept?.();
    onClose();
  };

  // Use a portal so the modal renders at document.body level,
  // completely outside any overflow:hidden or z-index stacking context
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="legal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 99998,
              background: 'rgba(148,163,184,0.45)',
              backdropFilter: 'blur(3px)',
            }}
          />

          {/* ── Card ── */}
          <div
            key="legal-centering-shell"
            style={{
              position: 'fixed', inset: 0,
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              key="legal-card"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.96, y: 8  }}
              transition={{ type: 'spring', damping: 30, stiffness: 360 }}
              onClick={e => e.stopPropagation()}
              style={{
                pointerEvents: 'all',
                background: '#ffffff',
                borderRadius: 12,
                boxShadow: '0 8px 48px rgba(100,116,139,0.22), 0 2px 8px rgba(0,0,0,0.08)',
                width: '100%',
                maxWidth: 480,
                maxHeight: '82vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{ padding: '22px 22px 0', flexShrink: 0, position: 'relative' }}>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  style={{
                    position: 'absolute', top: 14, right: 14,
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#f1f5f9', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                >
                  <X size={14} strokeWidth={2.5} />
                </button>

                <h2 style={{
                  fontSize: 20, fontWeight: 700, color: '#0f172a',
                  margin: '0 0 14px', paddingRight: 36,
                  fontFamily: "'Poppins','Inter',sans-serif",
                }}>
                  {title}
                </h2>
              </div>

              {/* Scrollable body — thin blue scrollbar */}
              <div
                style={{
                  flex: 1, overflowY: 'auto', padding: '0 22px 10px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#93c5fd #f1f5f9',
                }}
              >
                <style>{`
                  .lm-body::-webkit-scrollbar{width:4px}
                  .lm-body::-webkit-scrollbar-track{background:#f1f5f9;border-radius:99px}
                  .lm-body::-webkit-scrollbar-thumb{background:#93c5fd;border-radius:99px}
                `}</style>
                <div className="lm-body" style={{ height: '100%', overflowY: 'auto' }}>
                  {items.map((item, i) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>
                        {item.heading}
                      </p>
                      {item.sub && (
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', margin: '0 0 6px' }}>
                          {item.sub}
                        </p>
                      )}
                      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer — Accept + Decline */}
              <div style={{
                padding: '14px 22px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex', gap: 12, flexShrink: 0,
                background: '#fff',
              }}>
                <button
                  onClick={handleAccept}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 8,
                    fontSize: 14, fontWeight: 700,
                    background: '#3b82f6', color: '#fff',
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(59,130,246,0.35)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
                  onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
                >
                  Accept
                </button>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 8,
                    fontSize: 14, fontWeight: 600,
                    background: '#fff', color: '#3b82f6',
                    border: '1.5px solid #3b82f6', cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  Decline
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
