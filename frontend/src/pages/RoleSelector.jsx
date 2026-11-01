/**
 * RoleSelector — "Who are you?" pre-registration screen
 * Premium motion: staggered entrance, spring hover, selection burst, gradient shimmer
 * Route: /get-started  (public)
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Users, UserCheck, Stethoscope, Briefcase,
  ChevronRight, ArrowLeft, CheckCircle, Sparkles,
} from 'lucide-react';
import LoginSlideshow from '../components/LoginSlideshow';

const ROLES = [
  {
    key: 'patient',
    label: 'I am a Patient',
    sublabel: 'Receiving palliative or home care',
    icon: Heart,
    gradient: ['#0d9488', '#0891b2'],
    route: '/register?role=patient',
  },
  {
    key: 'family',
    label: 'I am a Family Member',
    sublabel: 'Supporting a loved one',
    icon: Users,
    gradient: ['#0891b2', '#0369a1'],
    route: '/register?role=family',
  },
  {
    key: 'caregiver',
    label: 'I am a Caregiver',
    sublabel: 'Professional home care worker',
    icon: UserCheck,
    gradient: ['#059669', '#0d9488'],
    route: '/register?role=caregiver',
  },
  {
    key: 'provider',
    label: 'I am a Service Provider',
    sublabel: 'Nurse, therapist, counsellor, nanny...',
    icon: Briefcase,
    gradient: ['#d97706', '#ea580c'],
    route: '/provider-register',
    highlight: true,
  },
  {
    key: 'clinician',
    label: 'I am a Clinician',
    sublabel: 'Doctor, nurse — contact your admin',
    icon: Stethoscope,
    gradient: ['#4338ca', '#1d4ed8'],
    route: null,
    adminOnly: true,
  },
];

/* ── Animated role card ─────────────────────────────────── */
function RoleCard({ role, idx, selected, onSelect }) {
  const Icon    = role.icon;
  const [g1, g2] = role.gradient;
  const isSelected = selected === role.key;
  const isDisabled = role.adminOnly;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0,   filter: 'blur(0px)' }}
      transition={{ delay: 0.1 + idx * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
    >
      <motion.button
        type="button"
        onClick={() => !isDisabled && onSelect(role)}
        whileHover={!isDisabled ? { x: 4, transition: { type:'spring', stiffness:400, damping:20 } } : {}}
        whileTap={!isDisabled   ? { scale: 0.97 } : {}}
        style={{
          width: '100%', textAlign: 'left', position: 'relative',
          background: isSelected ? `linear-gradient(135deg,${g1},${g2})` : '#fff',
          border: `2px solid ${isSelected ? g1 : 'var(--card-border)'}`,
          borderRadius: 14, overflow: 'hidden',
          cursor: isDisabled ? 'default' : 'pointer',
          opacity: isDisabled ? 0.6 : 1,
          transition: 'background 0.22s, border-color 0.22s',
          boxShadow: isSelected ? `0 8px 28px ${g1}40` : '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {/* Shimmer sweep on selection */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              key="shimmer"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: 0, zIndex: 1,
                background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)',
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          {/* Icon container */}
          <motion.div
            animate={{ rotate: isSelected ? [0, -8, 8, 0] : 0 }}
            transition={{ duration: 0.4 }}
            style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isSelected ? 'rgba(255,255,255,0.22)' : `linear-gradient(135deg,${g1}18,${g2}12)`,
              border: isSelected ? '1.5px solid rgba(255,255,255,0.35)' : 'none',
            }}>
            <Icon size={17} style={{ color: isSelected ? '#fff' : g1 }} strokeWidth={2}/>
          </motion.div>

          {/* Labels */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 800, margin: 0, color: isSelected ? '#fff' : 'var(--text-900)', lineHeight: 1.25 }}>
              {role.label}
            </p>
            <p style={{ fontSize: 11, fontWeight: 500, margin: '2px 0 0', color: isSelected ? 'rgba(255,255,255,0.75)' : g1 }}>
              {role.sublabel}
            </p>
          </div>

          {/* Right badge */}
          {isDisabled ? (
            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: '#f1f5f9', color: '#94a3b8', flexShrink: 0 }}>
              Admin only
            </span>
          ) : isSelected ? (
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            >
              <CheckCircle size={18} style={{ color: '#fff' }} strokeWidth={2.5}/>
            </motion.div>
          ) : (
            <ChevronRight size={15} style={{ color: 'var(--card-border)', flexShrink: 0 }}/>
          )}
        </div>
      </motion.button>
    </motion.div>
  );
}

/* ── Main ───────────────────────────────────────────────── */
export default function RoleSelector() {
  const navigate  = useNavigate();
  const [selected, setSelected] = useState(null);
  const [going,    setGoing]    = useState(false);

  const handleSelect = (role) => {
    if (role.adminOnly) return;
    setSelected(role.key);
    // Slight delay so selection animation plays before navigation
    setTimeout(() => {
      setGoing(true);
      setTimeout(() => navigate(role.route), 250);
    }, 320);
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--page-bg)' }}>

      {/* Left slideshow — desktop only */}
      <div className="hidden lg:block w-5/12 flex-shrink-0">
        <LoginSlideshow />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center overflow-y-auto py-8 px-4">
        <motion.div
          className="w-full max-w-md mx-auto space-y-4"
          animate={{ opacity: going ? 0 : 1, y: going ? -12 : 0 }}
          transition={{ duration: 0.22 }}
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, type: 'spring', stiffness: 360, damping: 22 }}
              className="inline-block mb-3"
            >
              <div className="relative">
                <img src="/logo.png" alt="Project Aura" className="w-12 h-12 rounded-2xl mx-auto shadow-lg"/>
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.15, 0.5] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: 'radial-gradient(circle,#0d9488,transparent)', zIndex: -1 }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Sparkles size={13} style={{ color: '#0d9488' }}/>
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#0d9488' }}>
                  Project Aura
                </span>
              </div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-900)' }}>Welcome! How will you use Aura?</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-500)' }}>Select your role to get started</p>
            </motion.div>
          </motion.div>

          {/* Role cards */}
          <div className="space-y-2.5">
            {ROLES.map((role, idx) => (
              <RoleCard key={role.key} role={role} idx={idx} selected={selected} onSelect={handleSelect}/>
            ))}
          </div>

          {/* Admin note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="rounded-xl border px-4 py-3 text-center"
            style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-500)', lineHeight: 1.6 }}>
              <span className="font-semibold" style={{ color: 'var(--text-700)' }}>Clinician or admin?</span>{' '}
              Your account is created by your organisation's administrator.{' '}
              <Link to="/login" className="font-bold text-teal-600 hover:underline">Sign in</Link>{' '}
              if you already have one.
            </p>
          </motion.div>

          {/* Back to login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center"
          >
            <Link to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
              style={{ color: 'var(--text-400)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#0d9488'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-400)'}
            >
              <ArrowLeft size={12}/> Back to sign in
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
