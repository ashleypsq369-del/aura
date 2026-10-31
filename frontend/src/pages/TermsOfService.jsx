/**
 * TermsOfService.jsx — Project Aura Terms of Service
 * Public route: /terms
 * Linked from Register.jsx checkbox and any footer
 */
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Heart, Lock, AlertTriangle, FileText, Users, Globe } from 'lucide-react';

const SECTIONS = [
  {
    icon: FileText,
    color: '#0d9488',
    title: '1. Acceptance of Terms',
    body: `By creating an account or using Project Aura ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform. These terms apply to all users including patients, family members, caregivers, clinicians, and healthcare providers.`,
  },
  {
    icon: Heart,
    color: '#e11d48',
    title: '2. Nature of the Service',
    body: `Project Aura is a palliative care coordination platform designed to support healthcare professionals and families managing serious illness care in Ghana and beyond. The Platform facilitates communication, symptom tracking, care planning, and resource access. It is a support tool only — it does not replace professional medical advice, diagnosis, or treatment. Always seek guidance from qualified healthcare professionals.`,
  },
  {
    icon: Users,
    color: '#7c3aed',
    title: '3. User Accounts & Roles',
    body: `Each user account is assigned a role (Patient, Family, Caregiver, Clinician, Administrator, or Provider) that determines access permissions. You are responsible for maintaining the confidentiality of your login credentials. You must not share your account or allow others to use it. You must immediately notify us at admin@projectaura.gh if you suspect unauthorised access.`,
  },
  {
    icon: Lock,
    color: '#0891b2',
    title: '4. Health Information & Consent',
    body: `By using the Platform, you consent to your health information being stored and used for the purposes of care coordination, clinical monitoring, and personalisation of your care experience. Health data is processed in accordance with our Privacy Policy. Clinicians and caregivers access only information relevant to patients under their care. You may withdraw consent at any time by contacting us — this will result in account deactivation.`,
  },
  {
    icon: Shield,
    color: '#059669',
    title: '5. Acceptable Use',
    body: `You agree to use the Platform only for lawful purposes. You must not: (a) upload false or misleading health information; (b) attempt to access data belonging to other users; (c) use the Platform to harass, harm, or deceive others; (d) attempt to reverse-engineer or scrape the Platform; (e) use the Platform in violation of any applicable law or regulation.`,
  },
  {
    icon: Globe,
    color: '#d97706',
    title: '6. AI Features & Clinical Decision Support',
    body: `Project Aura uses artificial intelligence features including risk scoring, symptom analysis, and care recommendations. These are decision-support tools only. Clinical decisions must always be made by qualified healthcare professionals. AI outputs are not guarantees and may contain errors. The Platform disclaims liability for any clinical decisions made solely on the basis of AI-generated content.`,
  },
  {
    icon: AlertTriangle,
    color: '#ea580c',
    title: '7. Limitation of Liability',
    body: `To the maximum extent permitted by law, Project Aura and its developers shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform. The Platform is provided "as is" without warranty of any kind. In an emergency, always call your national emergency number (in Ghana: 999 or 112).`,
  },
  {
    icon: FileText,
    color: '#64748b',
    title: '8. Changes to Terms',
    body: `We may update these Terms from time to time. We will notify users of material changes via the Platform or by email. Continued use of the Platform after changes constitutes acceptance of the updated Terms. The current version of these Terms is always available at /terms.`,
  },
  {
    icon: FileText,
    color: '#334155',
    title: '9. Contact',
    body: `For questions about these Terms, contact us at: legal@projectaura.gh | Project Aura, Group 31, Ghana. These Terms were last updated: October 2026.`,
  },
];

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#071520 0%,#0b3028 50%,#0891b2 100%)',
        padding: '32px 24px 40px',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <button onClick={() => navigate(-1)}
            style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:600, marginBottom:20, padding:0 }}>
            <ArrowLeft size={15}/> Back
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FileText size={22} style={{ color:'#5eead4' }}/>
            </div>
            <div>
              <h1 style={{ color:'#fff', fontSize:24, fontWeight:900, margin:0 }}>Terms of Service</h1>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, margin:'4px 0 0' }}>Project Aura Healthcare Platform · Last updated October 2026</p>
            </div>
          </div>
          <p style={{ color:'rgba(255,255,255,0.75)', fontSize:14, lineHeight:1.7, maxWidth:600, margin:0 }}>
            Please read these terms carefully before using Project Aura. They govern your use of our palliative care coordination platform.
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:800, margin:'0 auto', padding:'32px 24px 64px' }}>
        {SECTIONS.map((s, i) => (
          <motion.div key={i}
            initial={{ opacity:0, y:12 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ delay:i*0.05 }}
            style={{
              background:'var(--card-bg)', borderRadius:16,
              border:'1px solid var(--card-border)',
              padding:'20px 24px', marginBottom:16,
            }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:`${s.color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <s.icon size={16} style={{ color:s.color }}/>
              </div>
              <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-900)', margin:0 }}>{s.title}</h2>
            </div>
            <p style={{ fontSize:13, color:'var(--text-600)', lineHeight:1.75, margin:0 }}>{s.body}</p>
          </motion.div>
        ))}

        <div style={{ marginTop:32, padding:'20px 24px', background:'rgba(13,148,136,0.06)', borderRadius:14, border:'1.5px solid rgba(13,148,136,0.2)', textAlign:'center' }}>
          <p style={{ fontSize:13, color:'var(--text-700)', margin:0 }}>
            By using Project Aura, you confirm that you have read, understood, and agree to these Terms of Service.
          </p>
          <button onClick={() => navigate(-1)}
            style={{ marginTop:14, padding:'10px 28px', borderRadius:10, background:'#0d9488', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700 }}>
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
