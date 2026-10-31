/**
 * PrivacyPolicy.jsx — Project Aura Privacy Policy
 * Public route: /privacy
 */
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Database, Eye, Shield, Globe, Mail, Trash2, Bell } from 'lucide-react';

const SECTIONS = [
  {
    icon: Database, color: '#0891b2',
    title: '1. What Data We Collect',
    body: `We collect: (a) Account information — name, email, phone, username, role; (b) Health data — symptoms, vitals, medications, assessments, care preferences; (c) Usage data — pages visited, features used, timestamps; (d) Device data — browser type, IP address, operating system. We only collect data necessary to provide care coordination services.`,
  },
  {
    icon: Eye, color: '#0d9488',
    title: '2. How We Use Your Data',
    body: `Your data is used to: coordinate care between clinicians, caregivers, and family; personalise your care experience; generate AI-assisted clinical insights for your care team; send notifications and reminders; improve the Platform through anonymised analytics. We never sell your personal data to third parties.`,
  },
  {
    icon: Shield, color: '#7c3aed',
    title: '3. Data Storage & Security',
    body: `All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Health data is stored on secure servers compliant with HIPAA-equivalent standards. We implement role-based access control — clinicians see only their patients' data, family members see only their linked patient. Regular security audits are conducted. In the event of a data breach, we will notify affected users within 72 hours.`,
  },
  {
    icon: Globe, color: '#059669',
    title: '4. Data Sharing',
    body: `We share data only: (a) With your care team (clinicians, caregivers) as part of care coordination; (b) With family members you have linked to your account; (c) With service providers who process data on our behalf under strict data processing agreements; (d) When legally required by Ghanaian law or a court order. We do not share identifiable health data for advertising or marketing purposes.`,
  },
  {
    icon: Bell, color: '#d97706',
    title: '5. Cookies & Analytics',
    body: `We use essential cookies for authentication and session management. We use anonymised analytics to understand how users interact with the Platform and improve it. We do not use tracking cookies for advertising. You can manage cookie preferences in your browser settings, though disabling essential cookies will prevent you from logging in.`,
  },
  {
    icon: Lock, color: '#e11d48',
    title: '6. Your Rights',
    body: `You have the right to: (a) Access — request a copy of your personal data; (b) Correction — update inaccurate information; (c) Deletion — request deletion of your data (subject to clinical retention requirements); (d) Portability — receive your data in a structured format; (e) Objection — object to certain processing activities; (f) Withdrawal of consent — stop sharing your data at any time. To exercise these rights, contact: privacy@projectaura.gh`,
  },
  {
    icon: Trash2, color: '#64748b',
    title: '7. Data Retention',
    body: `Account data is retained for the duration of your account plus 7 years (required by Ghanaian health records law). Clinical health data is retained for a minimum of 10 years per Medical Records Act requirements. You may request early deletion of non-clinical account data. Anonymised analytics data may be retained indefinitely.`,
  },
  {
    icon: Mail, color: '#0891b2',
    title: '8. Contact & Complaints',
    body: `Data Protection Officer: dpo@projectaura.gh. For complaints about how we handle your data, you may also contact the Data Protection Commission of Ghana. This Privacy Policy was last updated: October 2026. We will notify you of material changes via the Platform or email.`,
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight:'100vh', background:'var(--page-bg)' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#071520 0%,#1d4ed8 50%,#0891b2 100%)', padding:'32px 24px 40px' }}>
        <div style={{ maxWidth:800, margin:'0 auto' }}>
          <button onClick={() => navigate(-1)}
            style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:600, marginBottom:20, padding:0 }}>
            <ArrowLeft size={15}/> Back
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Lock size={22} style={{ color:'#93c5fd' }}/>
            </div>
            <div>
              <h1 style={{ color:'#fff', fontSize:24, fontWeight:900, margin:0 }}>Privacy Policy</h1>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, margin:'4px 0 0' }}>Project Aura Healthcare Platform · Last updated October 2026</p>
            </div>
          </div>
          <p style={{ color:'rgba(255,255,255,0.75)', fontSize:14, lineHeight:1.7, maxWidth:600, margin:0 }}>
            Your health data is sensitive. This policy explains exactly what we collect, how we use it, and how we protect it.
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:800, margin:'0 auto', padding:'32px 24px 64px' }}>
        {SECTIONS.map((s, i) => (
          <motion.div key={i}
            initial={{ opacity:0, y:12 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ delay:i*0.05 }}
            style={{ background:'var(--card-bg)', borderRadius:16, border:'1px solid var(--card-border)', padding:'20px 24px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:`${s.color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <s.icon size={16} style={{ color:s.color }}/>
              </div>
              <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-900)', margin:0 }}>{s.title}</h2>
            </div>
            <p style={{ fontSize:13, color:'var(--text-600)', lineHeight:1.75, margin:0 }}>{s.body}</p>
          </motion.div>
        ))}

        <div style={{ marginTop:32, padding:'20px 24px', background:'rgba(29,78,216,0.06)', borderRadius:14, border:'1.5px solid rgba(29,78,216,0.2)', textAlign:'center' }}>
          <p style={{ fontSize:13, color:'var(--text-700)', margin:0 }}>
            Questions about your privacy? Email us at <strong>privacy@projectaura.gh</strong>
          </p>
          <button onClick={() => navigate(-1)}
            style={{ marginTop:14, padding:'10px 28px', borderRadius:10, background:'#1d4ed8', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700 }}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
