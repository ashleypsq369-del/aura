/**
 * RoleSelector — "Who are you?" pre-registration screen
 * Shows beautiful role cards, routes to Register with role pre-selected,
 * or routes to ProviderRegister for healthcare professionals.
 * Route: /get-started  (public)
 */
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart, Users, UserCheck, Stethoscope, Briefcase,
  ChevronRight, ArrowLeft,
} from 'lucide-react';
import LoginSlideshow from '../components/LoginSlideshow';

const ROLES = [
  {
    key: 'patient',
    label: 'I am a Patient',
    sublabel: 'Receiving palliative or home care',
    description: 'Access your care plan, track symptoms, message your care team, and manage appointments.',
    icon: Heart,
    gradient: ['#0d9488', '#0891b2'],
    image: '/resources/african/african-wellbeing.jpg',
    route: '/register?role=patient',
    external: false,
  },
  {
    key: 'family',
    label: 'I am a Family Member',
    sublabel: 'Supporting a loved one',
    description: 'Stay connected with your loved one\'s care, receive updates, access support resources and the community.',
    icon: Users,
    gradient: ['#0891b2', '#0369a1'],
    image: '/resources/african/african-family-care.jpg',
    route: '/register?role=family',
    external: false,
  },
  {
    key: 'caregiver',
    label: 'I am a Caregiver',
    sublabel: 'Professional home care worker',
    description: 'Manage assigned patients, log daily care activities, complete shift handovers, and coordinate with the clinical team.',
    icon: UserCheck,
    gradient: ['#059669', '#0d9488'],
    image: '/resources/african/african-caregiver.jpg',
    route: '/register?role=caregiver',
    external: false,
  },
  {
    key: 'clinician',
    label: 'I am a Clinician',
    sublabel: 'Doctor, nurse, or specialist',
    description: 'Registered through your organisation. Contact your administrator or use the admin panel to create a clinical account.',
    icon: Stethoscope,
    gradient: ['#1d4ed8', '#0891b2'],
    image: '/resources/african/african-clinical-team.jpg',
    route: null,   // clinicians are admin-created — show info
    external: false,
    adminOnly: true,
  },
  {
    key: 'provider',
    label: 'I am a Service Provider',
    sublabel: 'Nurse, therapist, counsellor, nanny...',
    description: 'Register as a verified independent provider: physiotherapist, counsellor, masseur, social worker, chaplain, specialist nanny, and more.',
    icon: Briefcase,
    gradient: ['#d97706', '#ea580c'],
    image: '/resources/african/african-nurse-male.jpg',
    route: '/provider-register',
    external: false,
    highlight: true,
  },
];

function RoleCard({ role, idx, onClick }) {
  const Icon = role.icon;
  const [g1, g2] = role.gradient;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06, duration: 0.25 }}
      whileHover={{ y: -2, transition: { duration: 0.12 } }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(role)}
      className="w-full text-left rounded-xl overflow-hidden transition-all duration-150 bg-white border-2 group"
      style={{ borderColor: 'var(--card-border)' }}
      onMouseEnter={e => { if (!role.adminOnly) e.currentTarget.style.borderColor = g1; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; }}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg,${g1}22,${g2}18)` }}>
          <Icon size={18} style={{ color: g1 }}/>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-[var(--text-900)] leading-tight">{role.label}</p>
          <p className="text-[11px] font-medium mt-0.5" style={{ color: g1 }}>{role.sublabel}</p>
        </div>

        {/* Right indicator */}
        {role.adminOnly
          ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-[var(--text-500)] flex-shrink-0">Admin only</span>
          : <ChevronRight size={15} className="flex-shrink-0 transition-colors" style={{ color: 'var(--card-border)' }}/>
        }
      </div>
    </motion.button>
  );
}

export default function RoleSelector() {
  const navigate = useNavigate();

  const handleSelect = (role) => {
    if (role.adminOnly) {
      // Show info — clinicians are admin-created
      return;
    }
    if (role.route) {
      navigate(role.route);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#c2dde8' }}>
      {/* Left slideshow — desktop only */}
      <div className="hidden lg:block w-5/12 flex-shrink-0">
        <LoginSlideshow />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center overflow-y-auto py-8 px-4">
        <div className="w-full max-w-md mx-auto space-y-5">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <img src="/logo.png" alt="Project Aura" className="w-10 h-10 rounded-xl mx-auto mb-3 shadow-md" />
            <h1 className="text-xl font-bold text-slate-900">Welcome to Project Aura</h1>
            <p className="text-sm text-[var(--text-600)] mt-1">How will you be using the platform?</p>
          </motion.div>

          {/* Role cards */}
          <div className="space-y-3">
            {ROLES.map((role, idx) => (
              <RoleCard key={role.key} role={role} idx={idx} onClick={handleSelect} />
            ))}
          </div>

          {/* Admin note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl border border-[var(--card-border)] bg-white/80 px-4 py-3"
          >
            <p className="text-xs text-[var(--text-500)] text-center leading-relaxed">
              <span className="font-semibold text-slate-700">Clinician or admin?</span>{' '}
              Accounts are created by your organisation's administrator.
              Contact your system admin or{' '}
              <Link to="/login" className="text-teal-600 font-semibold hover:underline">sign in</Link>
              {' '}if you already have an account.
            </p>
          </motion.div>

          {/* Back to login */}
          <div className="text-center">
            <Link to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-500)] hover:text-teal-600 font-semibold transition-colors">
              <ArrowLeft size={12} /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
