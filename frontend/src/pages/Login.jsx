import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoginSlideshow from '../components/LoginSlideshow';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
     * Layout strategy:
     * - Mobile/tablet (< lg): single column - slideshow is a tall banner at top,
     *   form sits below it. Feels native on phones.
     * - Desktop (‰¥ lg): classic 50/50 side-by-side split.
     */
    <div className="min-h-screen flex flex-col lg:flex-row text-[#2C3531]">

      {/* Slideshow panel — hidden on small app windows, visible on wider screens */}
      <div className="hidden sm:block w-full h-64 sm:h-80 lg:h-auto lg:w-1/2 lg:sticky lg:top-0 lg:min-h-screen flex-shrink-0 relative overflow-hidden">
        <LoginSlideshow />
      </div>

      {/* € Sign-in panel €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">

            {/* Header */}
            <div className="text-center mb-5">
              <div className="w-24 h-24 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm overflow-hidden">
                <img src="/logo.png" alt="Project Aura" className="w-20 h-20 object-contain" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Welcome back</h2>
              <p className="text-xs text-slate-500 font-medium">Sign in to continue your care journey</p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold leading-relaxed"
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                {/* Icon is outside the input - floats left of the border using negative margin trick */}
                <div className="flex items-center gap-0 border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/30 focus-within:border-teal-500 transition-all bg-white">
                  <div className="flex-shrink-0 w-10 flex items-center justify-center self-stretch bg-slate-50 border-r border-slate-200">
                    <UserIcon size={15} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="flex-1 px-3 py-2.5 outline-none text-sm text-slate-900 font-medium bg-transparent"
                    placeholder="Enter your username"
                    required
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-[11px] font-bold text-teal-600 hover:text-teal-700 hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className="flex items-center gap-0 border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/30 focus-within:border-teal-500 transition-all bg-white">
                  <div className="flex-shrink-0 w-10 flex items-center justify-center self-stretch bg-slate-50 border-r border-slate-200">
                    <Lock size={15} className="text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="flex-1 px-3 py-2.5 outline-none text-sm text-slate-900 font-medium bg-transparent"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="flex-shrink-0 w-10 flex items-center justify-center self-stretch text-slate-400 hover:text-teal-600 transition-colors bg-white"
                    tabIndex={-1}
                    data-tip={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Sign In button */}
              <button
                type="submit"
                disabled={loading}
                data-tip="Sign in to your care account"
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
            <p className="mt-4 text-center text-xs text-slate-500">
              New to Project Aura?{' '}
              <Link to="/register" className="text-teal-700 font-bold hover:underline">Create an account</Link>
            </p>

            {/* Demo credentials - collapsed/minimal */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
                Demo Accounts
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                {[
                  { label: 'Clinician', user: 'clinician', pass: 'clinician123', color: 'blue' },
                  { label: 'Family',   user: 'family',    pass: 'family123',    color: 'green' },
                  { label: 'Patient',  user: 'patient',   pass: 'patient123',   color: 'purple' },
                ].map(({ label, user, color }) => (
                  <button
                    key={user}
                    type="button"
                    onClick={() => { setUsername(user); setPassword(`${user}123`); }}
                    data-tip={`Auto-fill ${label.toLowerCase()} credentials`}
                    className={`p-2 rounded-lg border text-center transition-all hover:scale-[1.03] active:scale-[0.97]
                      ${color === 'blue'   ? 'bg-blue-50   border-blue-200   hover:border-blue-400'   :
                        color === 'green'  ? 'bg-green-50  border-green-200  hover:border-green-400'  :
                                             'bg-purple-50 border-purple-200 hover:border-purple-400'}`}
                  >
                    <p className="font-bold text-slate-800 text-[11px]">{label}</p>
                    <p className={`font-mono text-[10px] mt-0.5
                      ${color === 'blue' ? 'text-blue-600' :
                        color === 'green' ? 'text-green-600' : 'text-purple-600'}`}>
                      {user}
                    </p>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-center text-slate-400 mt-2">
                Click any card to auto-fill credentials
              </p>
            </div>

          </div>

          <p className="text-center text-[10px] text-slate-400 mt-3">
            ProjectAura v2.0.0 · Palliative Care Ghana
          </p>
        </motion.div>
      </div>
    </div>
  );
}

