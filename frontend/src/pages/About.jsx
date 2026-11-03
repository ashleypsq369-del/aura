/**
 * About.jsx — Project Aura About Page
 * Public route — accessible from login page and sidebar for all roles.
 * Real information: team, institution, mission, features, tech stack.
 */
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Brain, Heart, Shield, Users, Activity, BookOpen,
  ArrowLeft, Globe, Stethoscope, HeartHandshake,
  BarChart2, MessageCircle, Lock, Zap, ChevronRight,
  GraduationCap, Building2, Award, Clock, Database,
  ExternalLink,
} from 'lucide-react';

/* ── Fade-in variant ─────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.45, delay, ease: 'easeOut' },
});

/* ── Section wrapper ─────────────────────────────────────────────── */
function Section({ children, style = {} }) {
  return (
    <motion.section {...fadeUp(0.05)}
      style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px', ...style }}>
      {children}
    </motion.section>
  );
}

/* ── Stat card ───────────────────────────────────────────────────── */
function Stat({ value, label, color = '#0d9488' }) {
  return (
    <div style={{
      textAlign: 'center', padding: '20px 12px',
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <p style={{ fontSize: 28, fontWeight: 900, color, margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: 'var(--text-500)', margin: '4px 0 0', fontWeight: 500 }}>{label}</p>
    </div>
  );
}

/* ── Feature card ────────────────────────────────────────────────── */
function Feature({ icon: Icon, title, desc, color = '#0d9488' }) {
  return (
    <div style={{
      padding: '16px', borderRadius: 14,
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      display: 'flex', gap: 14,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 11, flexShrink: 0,
        background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-900)', margin: '0 0 4px' }}>{title}</p>
        <p style={{ fontSize: 12, color: 'var(--text-500)', margin: 0, lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}

/* ── Team member card ────────────────────────────────────────────── */
function TeamMember({ name, id, role, gradient }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--card-border)',
      borderRadius: 14, padding: '20px 16px', textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%', margin: '0 auto 12px',
        background: gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 900, color: '#fff',
        boxShadow: '0 4px 14px rgba(13,148,136,0.25)',
      }}>
        {initials}
      </div>
      <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-900)', margin: '0 0 3px' }}>{name}</p>
      <p style={{ fontSize: 11, color: 'var(--c-teal)', fontWeight: 600, margin: '0 0 4px', fontFamily: 'monospace' }}>{id}</p>
      <p style={{ fontSize: 11, color: 'var(--text-400)', margin: 0 }}>{role}</p>
    </div>
  );
}

export default function About() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', paddingBottom: 80 }}>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg,#0d9488 0%,#0891b2 50%,#1d4ed8 100%)',
        padding: '0 0 60px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Background texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.07,
          backgroundImage: `radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px),
                            radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }} />

        {/* Nav bar inside hero */}
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 600 }}>
            <ArrowLeft size={13} /> Back
          </button>
          <Link to="/login"
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '6px 12px', textDecoration: 'none', color: '#fff', fontSize: 12, fontWeight: 600 }}>
            Sign In <ChevronRight size={13} />
          </Link>
        </div>

        {/* Hero content */}
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px 0', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <motion.div {...fadeUp(0)} style={{ marginBottom: 20 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, margin: '0 auto',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src="/logo.png" alt="Project Aura" style={{ width: 52, height: 52, objectFit: 'contain' }}
                onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
              />
              <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={28} style={{ color: '#fff' }} />
              </div>
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.08)}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 10px' }}>
              Group 31 · UMaT Tarkwa · BSc Computer Science & Engineering
            </p>
            <h1 style={{ fontSize: 'clamp(28px,5vw,46px)', fontWeight: 900, color: '#fff', margin: '0 0 12px', lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
              Project Aura
            </h1>
            <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: 'rgba(255,255,255,0.80)', maxWidth: 560, margin: '0 auto 8px', lineHeight: 1.55 }}>
              An AI Framework for Personalised and Explainable Palliative Care Systems
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
              University of Mines and Technology, Sekondi-Takoradi, Ghana · March 2026
            </p>
          </motion.div>
        </div>

        {/* Hero image strip */}
        <div style={{ maxWidth: 960, margin: '32px auto 0', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, position: 'relative', zIndex: 1 }}>
          {[
            '/resources/african/african-hospital-ward.jpg',
            '/resources/african/african-doctor-female.jpg',
            '/resources/african/african-caregiver.jpg',
          ].map((src, i) => (
            <div key={i} style={{ borderRadius: 12, overflow: 'hidden', height: 100, border: '2px solid rgba(255,255,255,0.2)' }}>
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                onError={e => { e.currentTarget.parentElement.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.display = 'none'; }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────── */}
      <Section style={{ marginTop: -28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
          <Stat value="56.8M"  label="People need palliative care globally" color="#0d9488" />
          <Stat value="<14%"   label="Currently receive it (WHO, 2024)"     color="#e11d48" />
          <Stat value="5"      label="User roles in one platform"            color="#0891b2" />
          <Stat value="8"      label="XGBoost clinical AI models"            color="#7c3aed" />
          <Stat value="10"     label="Validated clinical instruments"        color="#059669" />
          <Stat value="48+"    label="REST API endpoints"                    color="#d97706" />
        </div>
      </Section>

      {/* ── What is Project Aura ─────────────────────────────────── */}
      <Section style={{ marginTop: 48 }}>
        <motion.div {...fadeUp(0)}>
          <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--c-teal)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px' }}>What is it</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-900)', margin: '0 0 14px' }}>Palliative care, reimagined for Ghana</h2>
          <p style={{ fontSize: 14, color: 'var(--text-600)', lineHeight: 1.7, maxWidth: 720, margin: 0 }}>
            Project Aura is a full-stack, AI-powered palliative care coordination platform built specifically
            for the Ghanaian healthcare context. It connects patients, families, caregivers, clinicians and
            administrators in a single web application — with explainable AI, real-time monitoring, and
            structured bereavement support that no existing platform provides.
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-600)', lineHeight: 1.7, maxWidth: 720, margin: '12px 0 0' }}>
            Ghana has no dedicated palliative ward in any teaching hospital. 48% of Ghanaians pay for care
            out-of-pocket. Existing tools like Alora and Netsmart handle records and scheduling only —
            none have clinical AI, none have bereavement support. Aura was built to close all four gaps
            in one platform.
          </p>
        </motion.div>
      </Section>

      {/* ── Four pillars ─────────────────────────────────────────── */}
      <Section style={{ marginTop: 48 }}>
        <motion.div {...fadeUp(0)}>
          <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--c-teal)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px' }}>How it works</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-900)', margin: '0 0 20px' }}>Four pillars, one platform</h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
          {[
            {
              icon: Activity, color: '#e11d48', title: '1. Intelligent Monitoring Core',
              desc: 'Captures vitals, symptoms and clinical assessments in real time. Eight XGBoost risk models run continuously and alert clinicians when thresholds are crossed — with SHAP explanations so clinicians understand exactly why.',
            },
            {
              icon: Brain, color: '#7c3aed', title: '2. Explainable Clinical AI',
              desc: 'Eight classifiers covering pain, dyspnea, anxiety, depression, nutritional risk, falls, caregiver burden and overall prognosis. Every prediction comes with a bar chart and waterfall chart showing which factors drove the score.',
            },
            {
              icon: Users, color: '#0891b2', title: '3. Unified Care Dashboard',
              desc: 'One platform, five roles. Patients track symptoms and appointments. Families stay informed. Caregivers manage daily tasks. Clinicians oversee all patients. Admins control access, compliance and feature flags.',
            },
            {
              icon: HeartHandshake, color: '#059669', title: '4. Continuity Bridge',
              desc: 'Care doesn\'t stop when a patient dies. Families get a grief journal with AI tone detection, PG-13 prolonged grief screening, a Memory Vault, and structured digital legacy access — all absent from every reviewed platform.',
            },
          ].map(f => <Feature key={f.title} {...f} />)}
        </div>
      </Section>

      {/* ── Who can use it ───────────────────────────────────────── */}
      <Section style={{ marginTop: 48 }}>
        <motion.div {...fadeUp(0)}>
          <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--c-teal)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px' }}>User roles</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-900)', margin: '0 0 20px' }}>Who uses Project Aura</h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
          {[
            { icon: Stethoscope, color: '#0891b2', title: 'Clinician', desc: 'Full patient oversight. AI risk scores, SHAP explanations, care planning, assessments, medication management, caregiver assignments, clinical alerts.' },
            { icon: HeartHandshake, color: '#0d9488', title: 'Caregiver', desc: 'View assigned patients, log daily tasks, receive shift handover notes, track workload, access care guides and cultural care profiles.' },
            { icon: Activity, color: '#7c3aed', title: 'Patient', desc: 'Self-report symptoms, view medications and appointments, access their care journey, join community groups, set care preferences.' },
            { icon: Heart, color: '#e11d48', title: 'Family', desc: 'View loved one\'s care setting, receive appointment reminders, access memory vault and bereavement resources after a patient passes.' },
            { icon: Shield, color: '#d97706', title: 'Administrator', desc: 'Manage all user accounts, toggle feature flags, view the full HIPAA audit trail, approve care setting change requests, monitor ML bias.' },
          ].map(r => <Feature key={r.title} {...r} />)}
        </div>
      </Section>

      {/* ── Key features ─────────────────────────────────────────── */}
      <Section style={{ marginTop: 48 }}>
        <motion.div {...fadeUp(0)}>
          <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--c-teal)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px' }}>Features</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-900)', margin: '0 0 20px' }}>What's inside</h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>
          {[
            { icon: BarChart2,     color:'#0d9488', title:'Real-time Risk Models',     desc:'8 XGBoost classifiers with SHAP explanations, clinician feedback loop' },
            { icon: Activity,      color:'#e11d48', title:'Clinical Alerts',           desc:'Automatic alerts for SpO2 <90%, abnormal vitals, missed medications' },
            { icon: BookOpen,      color:'#0891b2', title:'10 Clinical Instruments',   desc:'ESAS, PHQ-9, GAD-7, Barthel, BPI, PG-13, MMSE, MoCA, Zarit, FACT-G' },
            { icon: MessageCircle, color:'#7c3aed', title:'Real-time Messaging',       desc:'WebSocket-based secure messaging between all care team members' },
            { icon: Lock,          color:'#d97706', title:'HIPAA-Aligned Security',    desc:'JWT auth, RBAC, audit log, breach tracking, 15-min auto-logoff' },
            { icon: Zap,           color:'#059669', title:'Offline-First PWA',         desc:'IndexedDB caching, service worker, syncs when back online' },
            { icon: Globe,         color:'#0891b2', title:'Ghana-Specific Context',    desc:'Ghana Card, NHIS, Twi/Ga/Ewe language support, GPCA data' },
            { icon: HeartHandshake,color:'#e11d48', title:'Bereavement Support',       desc:'Grief journal, PG-13 screening, Memory Vault, Digital Legacy' },
            { icon: Database,      color:'#7c3aed', title:'NMC & Ghana Card Verified', desc:'Caregiver trust profiles with NMC PIN and Ghana Card verification' },
            { icon: Brain,         color:'#0d9488', title:'Aura AI Assistant',         desc:'LLM-powered care assistant with clinical context, role-aware responses' },
          ].map(f => <Feature key={f.title} {...f} />)}
        </div>
      </Section>

      {/* ── Tech stack ───────────────────────────────────────────── */}
      <Section style={{ marginTop: 48 }}>
        <motion.div {...fadeUp(0)}>
          <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--c-teal)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px' }}>Technology</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-900)', margin: '0 0 16px' }}>Built with</h2>
        </motion.div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            ['React 18', '#0891b2'], ['FastAPI', '#059669'], ['PostgreSQL', '#1d4ed8'],
            ['XGBoost', '#7c3aed'], ['SHAP', '#e11d48'], ['SQLAlchemy', '#d97706'],
            ['TanStack Query', '#0d9488'], ['Framer Motion', '#9333ea'], ['Tailwind CSS', '#06b6d4'],
            ['JWT / RBAC', '#d97706'], ['WebSockets', '#16a34a'], ['IndexedDB', '#0891b2'],
            ['Service Worker', '#059669'], ['Neon PostgreSQL', '#1d4ed8'], ['Render', '#64748b'],
          ].map(([label, color]) => (
            <span key={label} style={{
              padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
              background: `${color}12`, color, border: `1px solid ${color}30`,
            }}>
              {label}
            </span>
          ))}
        </div>
      </Section>

      {/* ── Team ─────────────────────────────────────────────────── */}
      <Section style={{ marginTop: 48 }}>
        <motion.div {...fadeUp(0)}>
          <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--c-teal)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px' }}>The team</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-900)', margin: '0 0 20px' }}>Group 31</h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 20 }}>
          <TeamMember name="Paul Smith Quaidoo"   id="SRI.41.008.131.22" role="Lead Developer"       gradient="linear-gradient(135deg,#0d9488,#0891b2)" />
          <TeamMember name="Abdul-Basit Issah"    id="SRI.41.008.098.22" role="ML & Backend Engineer" gradient="linear-gradient(135deg,#7c3aed,#0891b2)" />
          <TeamMember name="Alhassan Hina Ahmed"  id="SRI.41.008.023.22" role="Frontend & UI/UX"      gradient="linear-gradient(135deg,#059669,#0d9488)" />
        </div>

        {/* Supervisor + institution */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            borderRadius: 14, padding: '16px', display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f59e0b15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Award size={18} style={{ color: '#d97706' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-900)', margin: '0 0 3px' }}>Project Supervisor</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-teal)', margin: '0 0 2px' }}>Dr. Alfred Adutwum Amponsah</p>
              <p style={{ fontSize: 11, color: 'var(--text-400)', margin: 0 }}>Department of Computing and Data Analytics, UMaT</p>
            </div>
          </div>
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            borderRadius: 14, padding: '16px', display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0891b215', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 size={18} style={{ color: '#0891b2' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-900)', margin: '0 0 3px' }}>Institution</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-teal)', margin: '0 0 2px' }}>University of Mines and Technology (UMaT)</p>
              <p style={{ fontSize: 11, color: 'var(--text-400)', margin: 0 }}>School of Railway & Infrastructure Development, Essikado, Sekondi-Takoradi, Ghana</p>
            </div>
          </div>
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            borderRadius: 14, padding: '16px', display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0d948815', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GraduationCap size={18} style={{ color: '#0d9488' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-900)', margin: '0 0 3px' }}>Programme</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-teal)', margin: '0 0 2px' }}>BSc Computer Science & Engineering</p>
              <p style={{ fontSize: 11, color: 'var(--text-400)', margin: 0 }}>Final Year Project · March 2026</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Disclaimer ───────────────────────────────────────────── */}
      <Section style={{ marginTop: 48 }}>
        <motion.div {...fadeUp(0)}>
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a',
            borderLeft: '4px solid #f59e0b', borderRadius: 12, padding: '14px 18px',
          }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#92400e', margin: '0 0 6px' }}>Academic Prototype — Not for Clinical Use</p>
            <p style={{ fontSize: 12, color: '#78350f', margin: 0, lineHeight: 1.6 }}>
              Project Aura is a final-year academic prototype submitted to UMaT, Tarkwa. It has not undergone
              user studies, accessibility audits, or security penetration testing. It must not be used for
              actual clinical decision-making. All patient data in the demo system is synthetic. Clinical
              deployment would require formal security certification, HIPAA Business Associate Agreements,
              and regulatory approval.
            </p>
          </div>
        </motion.div>
      </Section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <Section style={{ marginTop: 48, textAlign: 'center' }}>
        <motion.div {...fadeUp(0)}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-900)', margin: '0 0 8px' }}>
            Ready to explore the system?
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-500)', margin: '0 0 20px' }}>
            Use the demo credentials to try every role.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '11px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: 'linear-gradient(135deg,#0d9488,#0891b2)',
              color: '#fff', textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(13,148,136,0.35)',
            }}>
              Sign In to Demo <ChevronRight size={14} />
            </Link>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '11px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: 'var(--card-bg)', color: 'var(--text-700)',
              border: '1px solid var(--card-border)', textDecoration: 'none',
            }}>
              Create Account
            </Link>
          </div>

          {/* Demo credentials table */}
          <div style={{ marginTop: 24, display: 'inline-block', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, overflow: 'hidden', textAlign: 'left' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--card-border)', background: 'var(--page-bg)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-400)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Demo Credentials</p>
            </div>
            <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--page-bg)' }}>
                  <th style={{ padding: '8px 16px', fontWeight: 700, color: 'var(--text-500)', textAlign: 'left', fontSize: 11 }}>Role</th>
                  <th style={{ padding: '8px 16px', fontWeight: 700, color: 'var(--text-500)', textAlign: 'left', fontSize: 11 }}>Username</th>
                  <th style={{ padding: '8px 16px', fontWeight: 700, color: 'var(--text-500)', textAlign: 'left', fontSize: 11 }}>Password</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Clinician',  'clinician',  'Clinician1234'],
                  ['Caregiver',  'caregiver',  'Care1234'],
                  ['Patient',    'patient',    'Patient1234'],
                  ['Family',     'family',     'Family1234'],
                ].map(([role, user, pass], i) => (
                  <tr key={role} style={{ borderTop: '1px solid var(--card-border)', background: i % 2 === 0 ? 'var(--card-bg)' : 'var(--page-bg)' }}>
                    <td style={{ padding: '8px 16px', fontWeight: 600, color: 'var(--text-700)' }}>{role}</td>
                    <td style={{ padding: '8px 16px', fontFamily: 'monospace', color: 'var(--c-teal)' }}>{user}</td>
                    <td style={{ padding: '8px 16px', fontFamily: 'monospace', color: 'var(--text-600)' }}>{pass}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </Section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '40px 24px 0', borderTop: '1px solid var(--card-border)', marginTop: 48 }}>
        <p style={{ fontSize: 12, color: 'var(--text-400)', margin: 0 }}>
          © 2026 Project Aura · Group 31 · University of Mines and Technology, Tarkwa ·{' '}
          <span style={{ color: 'var(--c-teal)' }}>BSc Computer Science & Engineering</span>
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-300)', margin: '4px 0 0' }}>
          Supervised by Dr. Alfred Adutwum Amponsah · For academic and demonstration use only
        </p>
      </div>

    </div>
  );
}
