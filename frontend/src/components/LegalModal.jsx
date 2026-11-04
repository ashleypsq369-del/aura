/**
 * LegalModal — Terms, Privacy Policy, About
 * Portal-rendered white card modal. Scrollable body.
 * Accept closes + calls onAccept. Decline/Close just closes.
 * About type is wider (560px) and shows project info.
 */
import { createPortal } from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/* ─── Content ──────────────────────────────────────────────────── */

const TERMS_CONTENT = [
  { heading: 'General Site Usage', sub: 'Last Revised: October 2026',
    body: `Welcome to Project Aura. This platform is provided as a service to healthcare professionals, patients, and their families. It may be used for care coordination, symptom tracking, and informational purposes only. Because these Terms contain legal obligations, please read them carefully.` },
  { heading: '1. YOUR AGREEMENT',
    body: `By creating an account or using Project Aura, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use this platform.\n\nWe reserve the right to change or modify these Terms at any time. Such changes take effect immediately upon posting. Continued use constitutes your agreement to the modified Terms.` },
  { heading: '2. NATURE OF THE SERVICE',
    body: `Project Aura is a palliative care coordination platform. It facilitates communication, symptom tracking, care planning, and resource access. It does not replace professional medical advice, diagnosis, or treatment. Always seek guidance from qualified healthcare professionals. In an emergency, call 999 or 112 immediately.` },
  { heading: '3. USER ACCOUNTS',
    body: `Each account is assigned a role (Patient, Family, Caregiver, Clinician, or Provider) that determines access permissions. You are responsible for keeping your login credentials confidential. Do not share your account. Report any suspected unauthorised access to: admin@projectaura.gh` },
  { heading: '4. HEALTH INFORMATION AND CONSENT',
    body: `By using the Platform you consent to your health data being stored and used for care coordination, clinical monitoring, and personalisation. You may withdraw consent at any time by contacting us. This will result in account deactivation.` },
  { heading: '5. ACCEPTABLE USE',
    body: `You must not: upload false health information; access other users' data; harass, harm, or deceive others; reverse-engineer the Platform; or violate any applicable law. Violations may result in immediate account termination.` },
  { heading: '6. AI FEATURES DISCLAIMER',
    body: `AI insights (risk scoring, symptom analysis, care recommendations) are decision-support tools only. Clinical decisions must always be made by qualified healthcare professionals. AI outputs may contain errors. The Platform is not liable for decisions made solely on AI-generated content.` },
  { heading: '7. LIMITATION OF LIABILITY',
    body: `To the maximum extent permitted by law, Project Aura and its developers are not liable for any indirect, incidental, or consequential damages arising from use of the Platform. The Platform is provided as-is, without warranty.` },
  { heading: '8. CONTACT',
    body: `Questions: legal@projectaura.gh\nProject Aura, Group 31, Ghana. Last updated: October 2026.` },
];

const PRIVACY_CONTENT = [
  { heading: 'Data Protection Policy', sub: 'Last Revised: October 2026',
    body: `Your health data is sensitive and we take its protection seriously. This policy explains what we collect, how we use it, and how we protect it.` },
  { heading: '1. DATA WE COLLECT',
    body: `We collect: account information (name, email, phone, role); health data (symptoms, vitals, medications, assessments, preferences); usage data (pages visited, features used); device data (browser type, IP address). We collect only what is necessary to provide care coordination services.` },
  { heading: '2. HOW WE USE YOUR DATA',
    body: `Your data is used to: coordinate care between clinicians, caregivers, and family; personalise your care; generate AI clinical insights for your care team; send reminders and notifications; and improve the Platform through anonymised analytics. We never sell your data.` },
  { heading: '3. DATA STORAGE AND SECURITY',
    body: `All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Role-based access ensures clinicians see only their patients' data and family members see only their linked patient. If a data breach occurs, we will notify affected users within 72 hours.` },
  { heading: '4. DATA SHARING',
    body: `We share data only with: your care team as part of care coordination; family members you have linked; service providers under strict data processing agreements; and when legally required by Ghanaian law. We do not share data for advertising.` },
  { heading: '5. YOUR RIGHTS',
    body: `You have the right to: access a copy of your data; correct inaccuracies; request deletion; receive your data in a portable format; and withdraw consent at any time. Contact: privacy@projectaura.gh` },
  { heading: '6. RETENTION AND CONTACT',
    body: `Health data is kept for a minimum of 10 years per Ghanaian Medical Records Act. Non-clinical account data may be deleted on request.\n\nDPO: dpo@projectaura.gh\nLast updated: October 2026.` },
];

const ABOUT_CONTENT = [
  { heading: 'What is Project Aura?',
    body: `Project Aura is a web platform built to help coordinate palliative care, the kind of care given to people living with serious, life-limiting illness. It connects everyone involved in a patient's care: clinicians, caregivers, the patient, and their family, all in one place.\n\nClinicians get AI-powered risk alerts with plain explanations. Families stay informed. Caregivers have everything they need for each visit. And when a patient passes, the platform keeps supporting the family through bereavement.` },
  { heading: 'Why we built it',
    body: `Ghana has no dedicated palliative ward in any of its teaching hospitals. Around 48% of Ghanaians pay for healthcare entirely out of pocket. The tools that exist today are fragmented, expensive, and built for other healthcare systems. None of the platforms we reviewed had clinical AI. None had bereavement support. None were built for the Ghanaian context.\n\nWe built Aura as our final-year project to fill those gaps and leave behind a working prototype that others can build on.` },
  { heading: 'Who it is for',
    body: `Five roles use the platform, each with their own view of the same care:\n\n• Clinician — oversees all patients, reviews AI risk scores with explanations, manages care plans\n• Caregiver — handles day-to-day visits, logs tasks, accesses care guides and handover notes\n• Patient — tracks symptoms, medications, and appointments, reads their care journey\n• Family — stays informed about their loved one's care, receives bereavement support\n• Admin — manages accounts, audit trails, and platform settings` },
  { heading: 'How it works',
    body: `Patients and caregivers log symptoms and vitals through the app. Eight AI models process that data and flag risks across pain, breathing, anxiety, depression, falls risk, and more. Every alert comes with a chart showing which factors drove the score, so clinicians can see why the system flagged something and decide whether to act.\n\nAppointments, medications, assessments, care plans, and messages all live in one place. The platform works offline and syncs when the connection returns.` },
  { heading: 'The team — Group 31',
    body: `Built by three final-year Computer Science and Engineering students at the University of Mines and Technology (UMaT), Tarkwa, supervised by Dr. Alfred Adutwum Amponsah.\n\nPaul Smith Quaidoo · SRI.41.008.131.22\nAbdul-Basit Issah · SRI.41.008.098.22\nAlhassan Hina Ahmed · SRI.41.008.023.22` },
  { heading: 'A note on this version',
    body: `This is an academic prototype submitted for a BSc degree. It has not been through a clinical trial, a formal security audit, or real-world patient testing. All patient data in the demo is synthetic. It should not be used for actual clinical decisions.\n\nIf you are a developer, researcher, or healthcare organisation interested in building on this work, please get in touch.` },
];

const CONFIG = {
  terms:   { title: 'Terms and Conditions', items: TERMS_CONTENT,  maxWidth: 480, showAccept: true,  acceptLabel: 'Accept',  declineLabel: 'Decline' },
  privacy: { title: 'Privacy Policy',       items: PRIVACY_CONTENT, maxWidth: 480, showAccept: false, acceptLabel: 'Got it',  declineLabel: 'Close'   },
  about:   { title: 'About Project Aura',   items: ABOUT_CONTENT,  maxWidth: 560, showAccept: false, acceptLabel: 'Got it',  declineLabel: 'Close'   },
};

/* ─── Modal ─────────────────────────────────────────────────────── */
export default function LegalModal({ type = 'terms', open, onClose, onAccept }) {
  const cfg = CONFIG[type] || CONFIG.terms;
  const [phase, setPhase] = useState('idle'); // 'idle' | 'accepted' | 'closing'
  const timerRef = useRef(null);
  const acceptedRef = useRef(false);

  useEffect(() => {
    if (open) {
      setPhase('idle');
      acceptedRef.current = false;
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [open]);

  const handleAccept = () => {
    acceptedRef.current = true;
    setPhase('accepted');
    onAccept?.();
    timerRef.current = setTimeout(() => {
      setPhase('closing');
      onClose();
    }, 1100);
  };

  const handleDecline = () => onClose();
  const isAccepted = phase === 'accepted' || phase === 'closing';

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="legal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{ position:'fixed', inset:0, zIndex:99998, background:'rgba(15,23,42,0.55)', backdropFilter:'blur(4px)' }}
          />

          {/* Centering shell */}
          <div key="legal-shell" style={{ position:'fixed', inset:0, zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center', padding:16, pointerEvents:'none' }}>
            <motion.div
              key="legal-card"
              initial={{ opacity:0, scale:0.96, y:16 }}
              animate={{ opacity:1, scale:1, y:0 }}
              exit={{    opacity:0, scale:0.96, y:8 }}
              transition={{ type:'spring', damping:30, stiffness:360 }}
              onClick={e => e.stopPropagation()}
              style={{
                pointerEvents:'all',
                background:'var(--card-bg)',
                borderRadius:14,
                boxShadow:'0 12px 60px rgba(15,23,42,0.22), 0 2px 8px rgba(0,0,0,0.08)',
                width:'100%', maxWidth:cfg.maxWidth,
                maxHeight:'85vh',
                display:'flex', flexDirection:'column',
                overflow:'hidden',
              }}
            >
              {/* Teal top accent bar */}
              <div style={{ height:3, background:'linear-gradient(90deg,#0d9488,#0891b2)', flexShrink:0 }} />

              {/* Header */}
              <div style={{ padding:'20px 22px 12px', flexShrink:0, position:'relative', borderBottom:'1px solid var(--card-border)' }}>
                <button onClick={onClose} aria-label="Close"
                  style={{ position:'absolute', top:14, right:14, width:28, height:28, borderRadius:'50%', background:'var(--page-bg)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-500)' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--card-border)'}
                  onMouseLeave={e=>e.currentTarget.style.background='var(--page-bg)'}>
                  <X size={14} strokeWidth={2.5} />
                </button>
                <h2 style={{ fontSize:18, fontWeight:800, color:'var(--text-900)', margin:0, paddingRight:36 }}>
                  {cfg.title}
                </h2>
              </div>

              {/* Scrollable body */}
              <div style={{ flex:1, overflowY:'auto', padding:'16px 22px 8px', scrollbarWidth:'thin', scrollbarColor:'#0d948860 var(--page-bg)', background:'var(--card-bg)' }}>
                <div className="lm-scroll" style={{ height:'100%', overflowY:'auto' }}>
                  {cfg.items.map((item, i) => (
                    <div key={i} style={{ marginBottom:18 }}>
                      <p style={{ fontSize:11, fontWeight:700, color:'#0d9488', margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                        {item.heading}
                      </p>
                      {item.sub && (
                        <p style={{ fontSize:11, fontWeight:600, color:'var(--text-400)', margin:'0 0 6px' }}>{item.sub}</p>
                      )}
                      <p style={{ fontSize:13, color:'var(--text-600)', lineHeight:1.75, margin:0, whiteSpace:'pre-line' }}>
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding:'14px 22px', borderTop:'1px solid var(--card-border)', display:'flex', gap:10, flexShrink:0, background:'var(--card-bg)' }}>
                {cfg.showAccept ? (
                  <>
                    <button onClick={isAccepted ? undefined : handleAccept}
                      style={{ flex:1, padding:'11px 0', borderRadius:8, fontSize:14, fontWeight:700,
                        background: isAccepted ? '#059669' : '#0d9488',
                        color:'#fff', border:'none', cursor: isAccepted ? 'default' : 'pointer',
                        transition:'background 0.25s',
                        display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      {isAccepted
                        ? <><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3L11.5 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> Accepted</>
                        : cfg.acceptLabel}
                    </button>
                    <button onClick={handleDecline}
                      style={{ flex:1, padding:'11px 0', borderRadius:8, fontSize:14, fontWeight:600, background:'transparent', color:'#0d9488', border:'1.5px solid #0d9488', cursor:'pointer' }}>
                      {cfg.declineLabel}
                    </button>
                  </>
                ) : (
                  <button onClick={isAccepted ? undefined : handleAccept}
                    style={{ flex:1, padding:'11px 0', borderRadius:8, fontSize:14, fontWeight:700,
                      background: isAccepted ? '#059669' : '#0d9488',
                      color:'#fff', border:'none', cursor: isAccepted ? 'default' : 'pointer',
                      transition:'background 0.25s',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    {isAccepted
                      ? <><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3L11.5 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> Got it</>
                      : cfg.acceptLabel}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
