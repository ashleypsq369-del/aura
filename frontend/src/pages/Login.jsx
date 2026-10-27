import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoginSlideshow from '../components/LoginSlideshow';

// ── client-side validation ────────────────────────────────────────────────
function validate(username, password) {
  const errors = {};
  if (!username.trim()) {
    errors.username = 'Username is required';
  } else if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  } else if (username.length > 50) {
    errors.username = 'Username cannot exceed 50 characters';
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.username = 'Username can only contain letters, numbers and underscores';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (password.length > 128) {
    errors.password = 'Password cannot exceed 128 characters';
  }

  return errors;
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation first
    const errors = validate(username, password);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    const result = await login(username, password);
    if (result.success) {
      const savedUserStr = localStorage.getItem('user');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        if (u.needs_questionnaire) navigate('/setup');
        else if (u.role === 'patient') navigate('/my-space');
        else navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    /*
     * Layout:
     * - Mobile: slideshow is a FULL-SCREEN background, form floats on top (glass card)
     * - Desktop (lg+): classic 50/50 side-by-side split
     */
    <div className="min-h-screen flex flex-col lg:flex-row text-[#2C3531]">

      {/* ── Slideshow ─────────────────────────────────────────────────────── */}
      {/* Mobile: fixed full-screen background */}
      <div className="fixed inset-0 lg:hidden z-0">
        <LoginSlideshow />
      </div>

      {/* Desktop: left half sticky panel */}
      <div className="hidden lg:block lg:w-1/2 lg:sticky lg:top-0 lg:min-h-screen flex-shrink-0 relative overflow-hidden z-0">
        <LoginSlideshow />
      </div>

      {/* ── Sign-in panel ─────────────────────────────────────────────────── */}
      {/* Mobile: overlays the slideshow with a semi-transparent card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-8 min-h-screen lg:min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          {/* Glass effect on mobile, solid white on desktop */}
          <div className="bg-white/90 lg:bg-white backdrop-blur-md lg:backdrop-blur-none rounded-2xl shadow-2xl border border-white/50 lg:border-slate-200 p-6 sm:p-8">

            {/* Header */}
            <div className="text-center mb-5">
              <div className="w-20 h-20 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm overflow-hidden">
                <img src="/logo.png" alt="Project Aura" className="w-16 h-16 object-contain" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Welcome back</h2>
              <p className="text-xs text-slate-500 font-medium">Sign in to continue your care journey</p>
            </div>

            {/* Server error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold leading-relaxed flex items-center gap-2"
              >
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Username */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600  mb-1.5">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-0 border rounded-xl overflow-hidden transition-all bg-white
                  ${fieldErrors.username
                    ? 'border-red-400 ring-2 ring-red-500/20'
                    : 'border-slate-300 focus-within:ring-2 focus-within:ring-teal-500/30 focus-within:border-teal-500'
                  }`}>
                  <div className="flex-shrink-0 w-10 flex items-center justify-center self-stretch bg-slate-50 border-r border-slate-200">
                    <UserIcon size={15} className={fieldErrors.username ? 'text-red-400' : 'text-slate-400'} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value);
                      // Re-validate if already shown an error
                      if (fieldErrors.username) {
                        const err = e.target.value.length < 3 ? 'Username must be at least 3 characters'
                          : e.target.value.length > 50 ? 'Username cannot exceed 50 characters'
                          : !/^[a-zA-Z0-9_]+$/.test(e.target.value) ? 'Letters, numbers and underscores only'
                          : undefined;
                        setFieldErrors(p => ({ ...p, username: err }));
                      }
                    }}
                    onBlur={() => {
                      const errors = validate(username, password);
                      if (errors.username) setFieldErrors(p => ({ ...p, username: errors.username }));
                    }}
                    className="flex-1 px-3 py-2.5 outline-none text-sm text-slate-900 font-medium bg-transparent"
                    placeholder="Enter your username"
                    required
                    disabled={loading}
                    autoComplete="username"
                    maxLength={50}
                    minLength={3}
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                  {/* Character count hint */}
                  {username.length > 40 && (
                    <span className="text-[10px] text-slate-400 pr-2 flex-shrink-0">{username.length}/50</span>
                  )}
                </div>
                {fieldErrors.username && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={11} />{fieldErrors.username}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 ">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <Link to="/forgot-password" className="text-[11px] font-bold text-teal-600 hover:text-teal-700 hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className={`flex items-center gap-0 border rounded-xl overflow-hidden transition-all bg-white
                  ${fieldErrors.password
                    ? 'border-red-400 ring-2 ring-red-500/20'
                    : 'border-slate-300 focus-within:ring-2 focus-within:ring-teal-500/30 focus-within:border-teal-500'
                  }`}>
                  <div className="flex-shrink-0 w-10 flex items-center justify-center self-stretch bg-slate-50 border-r border-slate-200">
                    <Lock size={15} className={fieldErrors.password ? 'text-red-400' : 'text-slate-400'} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        const err = e.target.value.length < 8 ? 'Password must be at least 8 characters'
                          : e.target.value.length > 128 ? 'Password cannot exceed 128 characters'
                          : undefined;
                        setFieldErrors(p => ({ ...p, password: err }));
                      }
                    }}
                    onBlur={() => {
                      const errors = validate(username, password);
                      if (errors.password) setFieldErrors(p => ({ ...p, password: errors.password }));
                    }}
                    className="flex-1 px-3 py-2.5 outline-none text-sm text-slate-900 font-medium bg-transparent"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    maxLength={128}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex-shrink-0 w-10 flex items-center justify-center self-stretch text-slate-400 hover:text-teal-600 transition-colors bg-white"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={11} />{fieldErrors.password}
                  </p>
                )}
                <p className="mt-1 text-[10px] text-slate-400">Min 8 characters · Max 128 characters</p>
              </div>

              {/* Sign In button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-700 hover:bg-teal-800 active:scale-[0.98] text-white py-2.5 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-1 shadow-md"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /><span>Signing in...</span></>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            {/* Register link */}
            <p className="mt-4 text-center text-xs text-slate-600">
              New to Project Aura?{' '}
              <Link to="/register" className="text-teal-700 font-bold hover:underline">Create an account</Link>
            </p>

            {/* Demo credentials */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-[10px] font-bold text-slate-400  text-center mb-2.5">
                Demo Accounts
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                {[
                  { label: 'Clinician', user: 'clinician', color: 'blue' },
                  { label: 'Family',    user: 'family',    color: 'green' },
                  { label: 'Patient',   user: 'patient',   color: 'purple' },
                ].map(({ label, user, color }) => (
                  <button
                    key={user}
                    type="button"
                    onClick={() => {
                      setUsername(user);
                      setPassword(`${user}123`);
                      setFieldErrors({});
                      setError('');
                    }}
                    className={`p-2 rounded-lg border text-center transition-all hover:scale-[1.03] active:scale-[0.97]
                      ${color === 'blue'   ? 'bg-blue-50   border-blue-200   hover:border-teal-400'   :
                        color === 'green'  ? 'bg-green-50  border-green-200  hover:border-green-400'  :
                                             'bg-purple-50 border-purple-200 hover:border-purple-400'}`}
                  >
                    <p className="font-bold text-slate-800 text-[11px]">{label}</p>
                    <p className={`font-mono text-[10px] mt-0.5
                      ${color === 'blue' ? 'text-teal-600' :
                        color === 'green' ? 'text-green-600' : 'text-purple-600'}`}>
                      {user}
                    </p>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-center text-slate-400 mt-2">Click any card to auto-fill credentials</p>
            </div>

          </div>

          <p className="text-center text-[10px] text-white/70 lg:text-slate-400 mt-3 drop-shadow">
            © {new Date().getFullYear()} Project Aura · Group 31 · Palliative Care Ghana
          </p>
        </motion.div>
      </div>
    </div>
  );
}
