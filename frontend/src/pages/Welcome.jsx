/**
 * Welcome.jsx - Post-registration questionnaire opt-in
 * Shown immediately after account creation.
 * No auth context required — user data passed via router state.
 * User chooses: personalise (go to /setup) OR skip (go to dashboard).
 */
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Welcome() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  const user = location.state?.user;
  const token = location.state?.access_token;
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  // If arrived here without state (direct URL), redirect to login
  useEffect(() => {
    if (!user || !token) {
      navigate('/login', { replace: true });
    }
  }, [user, token, navigate]);

  const activateAndGo = (dest) => {
    // Now it's safe to call setUser — we're already on the right page
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.removeItem('pending_user');
    setUser(user);
    navigate(dest, { replace: true });
  };

  const handlePersonalise = () => activateAndGo('/setup');

  const handleSkip = () => {
    const dest = user?.role === 'patient' ? '/my-space'
      : user?.role === 'family'   ? '/dashboard'
      : '/dashboard';
    activateAndGo(dest);
  };

  if (!user) return null;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 50%, #f5f3ff 100%)',
      fontFamily: "'Inter','system-ui',sans-serif",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        style={{
          background: '#ffffff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 460,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        }}
      >
        {/* Accent bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg,#0d9488,#0891b2,#7c3aed)' }} />

        {/* Header */}
        <div style={{ padding: '28px 28px 20px', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: '#f0fdf4', border: '2px solid #d1fae5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Sparkles size={24} style={{ color: '#0d9488' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
            Welcome, {firstName}!
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
            Your account is ready. Would you like to personalise your care experience, or jump straight to your dashboard?
          </p>
        </div>

        {/* Options */}
        <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Personalise */}
          <button
            onClick={handlePersonalise}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 18px', borderRadius: 12,
              border: '2px solid #0d9488', background: '#f0fdf4',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: '#0d9488', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Sparkles size={20} style={{ color: '#fff' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 3px' }}>
                Personalise my care
              </p>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                3-5 minutes - tailors your dashboard, symptom tracking and features to you
              </p>
            </div>
            <ArrowRight size={18} style={{ color: '#0d9488', flexShrink: 0 }} />
          </button>

          {/* Skip */}
          <button
            onClick={handleSkip}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 18px', borderRadius: 12,
              border: '1.5px solid #e2e8f0', background: '#ffffff',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: '#f8fafc', border: '1.5px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <LayoutDashboard size={20} style={{ color: '#94a3b8' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#475569', margin: '0 0 3px' }}>
                Go to my dashboard
              </p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                Use standard settings for now - you can personalise later in Settings
              </p>
            </div>
          </button>

          <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: '4px 0 0' }}>
            You can always retake the questionnaire from Settings at any time
          </p>
        </div>
      </motion.div>
    </div>
  );
}
