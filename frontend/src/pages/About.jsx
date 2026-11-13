/**
 * About.jsx - Aura Care About Page
 * Public route: /about
 * Same layout pattern as TermsOfService / PrivacyPolicy.
 * Brief, honest, human - not a slide deck.
 */
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Info, Users, Cpu, BookOpen, ShieldCheck } from 'lucide-react';

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay: i * 0.05, duration: 0.35 },
});

export default function About() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)' }}>

      {/* -- Header - same pattern as Terms/Privacy ------------------- */}
      <div style={{
        background: 'linear-gradient(135deg,#071520 0%,#0b3028 50%,#0d9488 100%)',
        padding: '32px 24px 40px',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <button onClick={() => navigate(-1)}
            style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none',
              cursor:'pointer', color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:600,
              marginBottom:20, padding:0 }}>
            <ArrowLeft size={15}/> Back
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.12)',
              display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
              <img src="/logo.png" alt="" style={{ width:34, height:34, objectFit:'contain' }}
                onError={e => { e.currentTarget.style.display='none'; }}/>
            </div>
            <div>
              <h1 style={{ color:'#fff', fontSize:24, fontWeight:900, margin:0 }}>About Aura Care</h1>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, margin:'4px 0 0' }}>
                Group 31 � University of Mines and Technology, Tarkwa � March 2026
              </p>
            </div>
          </div>
          <p style={{ color:'rgba(255,255,255,0.75)', fontSize:14, lineHeight:1.7, maxWidth:600, margin:0 }}>
            A final-year computer science project building an AI-powered platform for palliative care coordination in Ghana.
          </p>
        </div>
      </div>

      {/* -- Content --------------------------------------------------- */}
      <div style={{ maxWidth:800, margin:'0 auto', padding:'32px 24px 64px' }}>

        {/* What it is */}
        <motion.div {...fade(0)} style={{
          background:'var(--card-bg)', borderRadius:16,
          border:'1px solid var(--card-border)', padding:'20px 24px', marginBottom:16,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'#0d948815',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Info size={16} style={{ color:'#0d9488' }}/>
            </div>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-900)', margin:0 }}>What is Aura Care?</h2>
          </div>
          <p style={{ fontSize:13, color:'var(--text-600)', lineHeight:1.8, margin:0 }}>
            Aura Care is a web platform built to help coordinate palliative care - the kind of care
            given to people living with serious, life-limiting illness. It connects the people involved
            in a patient's care: clinicians, caregivers, patients themselves, and family members,
            all in one place. Clinicians get AI-powered risk alerts. Families stay informed.
            Caregivers have everything they need for each visit. And when a patient passes, the platform
            continues supporting the family through bereavement.
          </p>
        </motion.div>

        {/* Why it was built */}
        <motion.div {...fade(1)} style={{
          background:'var(--card-bg)', borderRadius:16,
          border:'1px solid var(--card-border)', padding:'20px 24px', marginBottom:16,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'#e11d4815',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Heart size={16} style={{ color:'#e11d48' }}/>
            </div>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-900)', margin:0 }}>Why it was built</h2>
          </div>
          <p style={{ fontSize:13, color:'var(--text-600)', lineHeight:1.8, margin:0 }}>
            Ghana has no dedicated palliative ward in any of its teaching hospitals. Around 48% of
            Ghanaians pay for healthcare entirely out-of-pocket, and the tools clinicians use today -
            where they exist at all - are fragmented, expensive, and built for other healthcare systems
            entirely. None of the platforms we reviewed had clinical AI. None had bereavement support.
            None were built with the Ghanaian context in mind.
          </p>
          <p style={{ fontSize:13, color:'var(--text-600)', lineHeight:1.8, margin:'10px 0 0' }}>
            We built Aura as our final-year project to demonstrate that a small team, with the right
            tools, can build something genuinely useful for this gap - and to contribute a working
            prototype that future developers or healthcare organisations could build on.
          </p>
        </motion.div>

        {/* Who it's for */}
        <motion.div {...fade(2)} style={{
          background:'var(--card-bg)', borderRadius:16,
          border:'1px solid var(--card-border)', padding:'20px 24px', marginBottom:16,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'#7c3aed15',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Users size={16} style={{ color:'#7c3aed' }}/>
            </div>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-900)', margin:0 }}>Who it's for</h2>
          </div>
          <p style={{ fontSize:13, color:'var(--text-600)', lineHeight:1.8, margin:'0 0 12px' }}>
            The platform supports five roles, each with their own view of the same care:
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { role:'Clinician',  desc:'Oversees all patients, reviews AI risk scores with explanations, manages care plans and assignments.' },
              { role:'Caregiver',  desc:'Handles day-to-day visits, logs tasks, receives handover notes, accesses care guides per patient.' },
              { role:'Patient',    desc:'Tracks symptoms, views medications and appointments, reads their own care journey.' },
              { role:'Family',     desc:'Stays informed about their loved one\'s care, and receives bereavement support after a patient passes.' },
              { role:'Admin',      desc:'Manages all user accounts, reviews the audit trail, and controls platform settings.' },
            ].map(({ role, desc }) => (
              <div key={role} style={{ display:'flex', gap:10, padding:'10px 14px',
                background:'var(--page-bg)', borderRadius:10 }}>
                <span style={{ fontSize:12, fontWeight:700, color:'var(--c-teal)',
                  minWidth:72, flexShrink:0 }}>{role}</span>
                <span style={{ fontSize:12, color:'var(--text-500)', lineHeight:1.6 }}>{desc}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div {...fade(3)} style={{
          background:'var(--card-bg)', borderRadius:16,
          border:'1px solid var(--card-border)', padding:'20px 24px', marginBottom:16,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'#0891b215',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Cpu size={16} style={{ color:'#0891b2' }}/>
            </div>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-900)', margin:0 }}>How it works</h2>
          </div>
          <p style={{ fontSize:13, color:'var(--text-600)', lineHeight:1.8, margin:0 }}>
            Patients or caregivers log symptoms and vitals through the app. Eight AI models
            (trained using XGBoost) process that data continuously and flag risks - pain, respiratory
            distress, anxiety, depression, falls risk, and more. Crucially, every AI alert comes
            with an explanation: a chart showing which factors drove the score, so clinicians can
            decide whether to act rather than just being handed a number.
          </p>
          <p style={{ fontSize:13, color:'var(--text-600)', lineHeight:1.8, margin:'10px 0 0' }}>
            Appointments, medications, clinical assessments, care plans, messages - all live in one
            place. The platform works offline and syncs when the connection returns, which matters
            in areas with unreliable internet.
          </p>
        </motion.div>

        {/* The team */}
        <motion.div {...fade(4)} style={{
          background:'var(--card-bg)', borderRadius:16,
          border:'1px solid var(--card-border)', padding:'20px 24px', marginBottom:16,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'#d9770615',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <BookOpen size={16} style={{ color:'#d97706' }}/>
            </div>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-900)', margin:0 }}>The team</h2>
          </div>
          <p style={{ fontSize:13, color:'var(--text-600)', lineHeight:1.8, margin:'0 0 14px' }}>
            Built by three final-year Computer Science & Engineering students at the University of
            Mines and Technology (UMaT), Tarkwa, supervised by Dr. Alfred Adutwum Amponsah of
            the Department of Computing and Data Analytics.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { name:'Paul Smith Quaidoo',   id:'SRI.41.008.131.22' },
              { name:'Abdul-Basit Issah',    id:'SRI.41.008.098.22' },
              { name:'Alhassan Hina Ahmed',  id:'SRI.41.008.023.22' },
            ].map(({ name, id }) => (
              <div key={id} style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', padding:'9px 14px',
                background:'var(--page-bg)', borderRadius:10 }}>
                <span style={{ fontSize:13, fontWeight:600, color:'var(--text-800)' }}>{name}</span>
                <span style={{ fontSize:11, color:'var(--text-400)', fontFamily:'monospace' }}>{id}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.div {...fade(5)} style={{
          background:'var(--card-bg)', borderRadius:16,
          border:'1px solid var(--card-border)', padding:'20px 24px', marginBottom:32,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'#f59e0b15',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <ShieldCheck size={16} style={{ color:'#d97706' }}/>
            </div>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-900)', margin:0 }}>A note on this version</h2>
          </div>
          <p style={{ fontSize:13, color:'var(--text-600)', lineHeight:1.8, margin:0 }}>
            This is an academic prototype, submitted in partial fulfilment for a BSc degree. It has
            not been through a clinical trial, a formal security audit, or real-world patient testing.
            All patient data in the demo is synthetic. It should not be used for actual clinical
            decisions. If you're a developer, researcher, or healthcare organisation interested in
            building on this work, feel free to reach out.
          </p>
        </motion.div>

        {/* Bottom CTA - same as Terms "I Understand" block */}
        <motion.div {...fade(6)} style={{
          padding:'20px 24px', background:'rgba(13,148,136,0.06)',
          borderRadius:14, border:'1.5px solid rgba(13,148,136,0.2)', textAlign:'center',
        }}>
          <p style={{ fontSize:13, color:'var(--text-700)', margin:0 }}>
            Want to explore the system? Use the demo to try each role and see the platform in action.
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginTop:14 }}>
            <Link to="/login" style={{
              padding:'10px 24px', borderRadius:10,
              background:'#0d9488', color:'#fff',
              border:'none', fontSize:13, fontWeight:700,
              textDecoration:'none', display:'inline-block',
            }}>
              Try the demo
            </Link>
            <button onClick={() => navigate(-1)} style={{
              padding:'10px 24px', borderRadius:10,
              background:'transparent', color:'var(--text-600)',
              border:'1px solid var(--card-border)', fontSize:13, fontWeight:600,
              cursor:'pointer',
            }}>
              Go back
            </button>
          </div>
        </motion.div>

        {/* Footer links */}
        <p style={{ textAlign:'center', fontSize:12, color:'var(--text-400)', marginTop:28 }}>
          � 2026 Aura Care � Group 31 � UMaT Tarkwa �{' '}
          <Link to="/terms" style={{ color:'var(--c-teal)', textDecoration:'none' }}>Terms</Link>
          {' � '}
          <Link to="/privacy" style={{ color:'var(--c-teal)', textDecoration:'none' }}>Privacy</Link>
        </p>

      </div>
    </div>
  );
}
