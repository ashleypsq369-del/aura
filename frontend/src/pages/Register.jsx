import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, User as UserIcon, Mail, Phone, UserPlus,
  Building2, Heart, Home, Stethoscope, BedDouble,
  CheckCircle, AlertCircle, Eye, EyeOff, ChevronDown, Search,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import toast from '../utils/toast';
import PasswordStrength from '../components/PasswordStrength';
import { useAuth } from '../context/AuthContext';
import LoginSlideshow from '../components/LoginSlideshow';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── Country phone codes (comprehensive list) ─────────────────────────────
const COUNTRIES = [
  { code: 'GH', name: 'Ghana', dial: '+233', flag: 'GH' },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: 'NG' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: 'ZA' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: 'KE' },
  { code: 'ET', name: 'Ethiopia', dial: '+251', flag: 'ET' },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: 'EG' },
  { code: 'TZ', name: 'Tanzania', dial: '+255', flag: 'TZ' },
  { code: 'UG', name: 'Uganda', dial: '+256', flag: 'UG' },
  { code: 'CI', name: "Cote d'Ivoire", dial: '+225', flag: 'CI' },
  { code: 'CM', name: 'Cameroon', dial: '+237', flag: 'CM' },
  { code: 'SN', name: 'Senegal', dial: '+221', flag: 'SN' },
  { code: 'MA', name: 'Morocco', dial: '+212', flag: 'MA' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: 'GB' },
  { code: 'US', name: 'United States', dial: '+1', flag: 'US' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: 'CA' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: 'AU' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: 'DE' },
  { code: 'FR', name: 'France', dial: '+33', flag: 'FR' },
  { code: 'IN', name: 'India', dial: '+91', flag: 'IN' },
  { code: 'CN', name: 'China', dial: '+86', flag: 'CN' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: 'JP' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: 'BR' },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: 'MX' },
  { code: 'RU', name: 'Russia', dial: '+7', flag: 'RU' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: 'SA' },
  { code: 'AE', name: 'UAE', dial: '+971', flag: 'AE' },
  { code: 'ZW', name: 'Zimbabwe', dial: '+263', flag: 'ZW' },
  { code: 'ZM', name: 'Zambia', dial: '+260', flag: 'ZM' },
  { code: 'RW', name: 'Rwanda', dial: '+250', flag: 'RW' },
  { code: 'MZ', name: 'Mozambique', dial: '+258', flag: 'MZ' },
  { code: 'MW', name: 'Malawi', dial: '+265', flag: 'MW' },
  { code: 'LR', name: 'Liberia', dial: '+231', flag: 'LR' },
  { code: 'SL', name: 'Sierra Leone', dial: '+232', flag: 'SL' },
  { code: 'GN', name: 'Guinea', dial: '+224', flag: 'GN' },
  { code: 'BJ', name: 'Benin', dial: '+229', flag: 'BJ' },
  { code: 'TG', name: 'Togo', dial: '+228', flag: 'TG' },
  { code: 'BF', name: 'Burkina Faso', dial: '+226', flag: 'BF' },
  { code: 'ML', name: 'Mali', dial: '+223', flag: 'ML' },
  { code: 'NE', name: 'Niger', dial: '+227', flag: 'NE' },
  { code: 'SS', name: 'South Sudan', dial: '+211', flag: 'SS' },
  { code: 'SD', name: 'Sudan', dial: '+249', flag: 'SD' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: 'IT' },
  { code: 'ES', name: 'Spain', dial: '+34', flag: 'ES' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: 'NL' },
  { code: 'SE', name: 'Sweden', dial: '+46', flag: 'SE' },
  { code: 'NO', name: 'Norway', dial: '+47', flag: 'NO' },
  { code: 'DK', name: 'Denmark', dial: '+45', flag: 'DK' },
  { code: 'CH', name: 'Switzerland', dial: '+41', flag: 'CH' },
  { code: 'IE', name: 'Ireland', dial: '+353', flag: 'IE' },
];

// ── Care settings ────────────────────────────────────────────────────────
const CARE_SETTINGS = [
  {
    key: 'hospital_based', label: 'Hospital-Based Care', icon: Building2,
    color: 'border-blue-200 bg-blue-50', active: 'border-blue-600 bg-blue-100 ring-2 ring-blue-400',
    textColor: 'text-blue-700', description: 'Admitted to or regularly attending a hospital palliative care unit',
  },
  {
    key: 'hospice', label: 'Hospice Care', icon: Heart,
    color: 'border-rose-200 bg-rose-50', active: 'border-rose-600 bg-rose-100 ring-2 ring-rose-400',
    textColor: 'text-rose-700', description: 'Receiving comfort-focused, end-of-life care',
  },
  {
    key: 'home_based', label: 'Home-Based Care', icon: Home,
    color: 'border-green-200 bg-green-50', active: 'border-green-600 bg-green-100 ring-2 ring-green-400',
    textColor: 'text-green-700', description: 'A care team visits at home to manage your condition',
  },
  {
    key: 'outpatient_clinic', label: 'Outpatient Clinic', icon: Stethoscope,
    color: 'border-teal-200 bg-teal-50', active: 'border-teal-600 bg-teal-100 ring-2 ring-teal-400',
    textColor: 'text-teal-700', description: 'Regular clinic appointments, returning home the same day',
  },
  {
    key: 'long_term_residential', label: 'Residential / Nursing Home', icon: BedDouble,
    color: 'border-purple-200 bg-purple-50', active: 'border-purple-600 bg-purple-100 ring-2 ring-purple-400',
    textColor: 'text-purple-700', description: 'Living in a nursing home or long-term care facility',
  },
];

// ── Validation helpers ────────────────────────────────────────────────────
function validateStep1(data) {
  const errors = {};
  if (!data.full_name.trim()) errors.full_name = 'Full name is required';
  else if (data.full_name.trim().length < 2) errors.full_name = 'Name must be at least 2 characters';

  if (!data.username.trim()) errors.username = 'Username is required';
  else if (data.username.length < 3) errors.username = 'Username must be at least 3 characters';
  else if (!/^[a-z0-9_]+$/.test(data.username)) errors.username = 'Username: lowercase letters, numbers and underscores only';

  if (!data.email.trim()) errors.email = 'Email address is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Please enter a valid email address';

  if (data.phone_number && data.phone_number.trim()) {
    if (!/^\d{4,15}$/.test(data.phone_number.replace(/[\s\-()]/g, ''))) {
      errors.phone_number = 'Phone number should be 4-15 digits';
    }
  }

  if (!data.password) errors.password = 'Password is required';
  else if (data.password.length < 8) errors.password = 'Password must be at least 8 characters';
  else if (!/[A-Z]/.test(data.password)) errors.password = 'Password must contain at least one uppercase letter';
  else if (!/[0-9]/.test(data.password)) errors.password = 'Password must contain at least one number';

  return errors;
}

// ── Country Phone Picker ──────────────────────────────────────────────────
function CountryPhonePicker({ countryDial, onCountryChange, phoneNumber, onPhoneChange, error, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const selected = COUNTRIES.find(c => c.dial === countryDial) || COUNTRIES[0];
  const filtered = search
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search))
    : COUNTRIES;

  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
        Phone <span className="text-slate-400 normal-case font-normal">(optional)</span>
      </label>
      <div className="flex gap-2">
        {/* Country selector */}
        <div className="relative" ref={ref}>
          <button type="button" disabled={disabled} onClick={() => setOpen(o => !o)}
            className={`flex items-center gap-1.5 h-11 px-3 border-2 rounded-xl text-sm font-semibold transition-all outline-none whitespace-nowrap ${
              error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white hover:border-teal-400 focus:border-teal-500'
            }`}>
            <span className="text-base">{selected.flag === 'GH' ? 'GH' : selected.code}</span>
            <span className="text-slate-700">{selected.dial}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          <AnimatePresence>
            {open && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="absolute left-0 top-12 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl w-64 overflow-hidden">
                <div className="p-2 border-b border-slate-100">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search country..."
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-400" />
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {filtered.map(c => (
                    <button key={c.code + c.dial} type="button"
                      onClick={() => { onCountryChange(c.dial); setOpen(false); setSearch(''); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-teal-50 text-left transition-colors ${selected.code === c.code ? 'bg-teal-50 font-bold text-teal-700' : 'text-slate-700'}`}>
                      <span className="w-8 font-mono text-slate-500 flex-shrink-0">{c.dial}</span>
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                  {!filtered.length && <p className="px-3 py-4 text-xs text-slate-400 text-center">No countries found</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Number input */}
        <input type="tel" value={phoneNumber} onChange={e => onPhoneChange(e.target.value)} disabled={disabled}
          placeholder="Phone number"
          className={`flex-1 h-11 px-3 border-2 rounded-xl text-sm font-medium outline-none transition-all ${
            error ? 'border-red-400 bg-red-50' : 'border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
          }`} />
      </div>
      {error && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  );
}

// ── Field wrapper with validation ─────────────────────────────────────────
function Field({ label, error, required, children }) {
  return (
    <div>
      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${error ? 'text-red-600' : 'text-slate-700'}`}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
            <AlertCircle size={11} className="flex-shrink-0" />{error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function inputCls(error) {
  return `w-full h-11 pl-10 pr-4 border-2 rounded-xl text-sm font-medium outline-none transition-all ${
    error ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
           : 'border-slate-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
  }`;
}

// ── Main component ────────────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '', username: '', email: '', password: '',
    phone_dial: '+233', phone_number: '', role: 'patient', care_setting: '',
  });

  const set = (field, value) => {
    setFormData(p => ({ ...p, [field]: value }));
    setFieldErrors(p => ({ ...p, [field]: undefined }));
    setServerError('');
  };

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      const phone = data.phone_number ? data.phone_dial + data.phone_number.replace(/^0/, '') : '';
      return axios.post(`${API_URL}/api/auth/register`, {
        username:  data.username,
        email:     data.email,
        password:  data.password,
        full_name: data.full_name,
        role:      data.role,
        phone:     phone || undefined,
        care_setting: data.care_setting || undefined,
      });
    },
    onSuccess: (res) => {
      const { access_token, user } = res.data;
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      toast.success('Account created! Welcome to Project Aura.');
      navigate('/setup');
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      setServerError(msg);
    },
  });

  const handleStep1 = (e) => {
    e.preventDefault();
    const errors = validateStep1(formData);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.care_setting) { setServerError('Please select your current care setting.'); return; }
    if (!acceptedTerms) { setServerError('Please accept the Terms of Service and Privacy Policy to continue.'); return; }
    registerMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row text-slate-800">
      {/* Left: slideshow */}
      <div className="w-full h-48 sm:h-64 lg:h-auto lg:w-1/2 lg:sticky lg:top-0 lg:min-h-screen flex-shrink-0 relative overflow-hidden">
        <LoginSlideshow />
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-start justify-center p-6 sm:p-10 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="w-full max-w-md my-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-8 py-6 text-white">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <UserPlus size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Create Account</h1>
                  <p className="text-teal-100 text-xs">Project Aura -- AI Palliative Care Platform</p>
                </div>
              </div>
              {/* Step progress */}
              <div className="flex items-center gap-2 mt-4">
                {[1,2].map(s => (
                  <div key={s} className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                    s === step ? 'bg-white text-teal-700' : s < step ? 'bg-white/40 text-white' : 'bg-white/20 text-white/60'
                  }`}>{s < step ? <CheckCircle size={14} /> : s}</div>
                ))}
                <div className="flex-1 h-0.5 bg-white/20 mx-1">
                  <div className={`h-full bg-white transition-all ${step > 1 ? 'w-full' : 'w-0'}`} />
                </div>
                <span className="text-teal-100 text-xs">Step {step} of 2</span>
              </div>
            </div>

            <div className="px-8 py-6">
              {/* Server error */}
              <AnimatePresence>
                {serverError && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{serverError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* STEP 1 */}
              {step === 1 && (
                <form onSubmit={handleStep1} noValidate className="space-y-4">
                  <Field label="Full Name" error={fieldErrors.full_name} required>
                    <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-all ${fieldErrors.full_name ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20'}`}>
                      <span className="flex items-center justify-center w-10 h-11 flex-shrink-0 text-slate-400 border-r border-slate-200 bg-slate-50">
                        <UserIcon size={15} />
                      </span>
                      <input value={formData.full_name} onChange={e => set('full_name', e.target.value)}
                        className="flex-1 h-11 px-3 text-sm font-medium outline-none bg-transparent"
                        placeholder="e.g., Kwame Mensah" />
                    </div>
                  </Field>

                  <Field label="Username" error={fieldErrors.username} required>
                    <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-all ${fieldErrors.username ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20'}`}>
                      <span className="flex items-center justify-center w-10 h-11 flex-shrink-0 text-slate-400 border-r border-slate-200 bg-slate-50">
                        <UserIcon size={15} />
                      </span>
                      <input value={formData.username}
                        onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        className="flex-1 h-11 px-3 text-sm font-medium outline-none bg-transparent"
                        placeholder="lowercase, no spaces" />
                    </div>
                    {!fieldErrors.username && formData.username.length >= 3 && (
                      <p className="mt-1 text-xs text-green-600 flex items-center gap-1"><CheckCircle size={11} />Username looks good</p>
                    )}
                  </Field>

                  <Field label="Email Address" error={fieldErrors.email} required>
                    <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-all ${fieldErrors.email ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20'}`}>
                      <span className="flex items-center justify-center w-10 h-11 flex-shrink-0 text-slate-400 border-r border-slate-200 bg-slate-50">
                        <Mail size={15} />
                      </span>
                      <input type="email" value={formData.email} onChange={e => set('email', e.target.value)}
                        className="flex-1 h-11 px-3 text-sm font-medium outline-none bg-transparent"
                        placeholder="your.email@example.com" />
                    </div>
                  </Field>

                  <CountryPhonePicker
                    countryDial={formData.phone_dial}
                    onCountryChange={v => set('phone_dial', v)}
                    phoneNumber={formData.phone_number}
                    onPhoneChange={v => set('phone_number', v)}
                    error={fieldErrors.phone_number}
                    disabled={registerMutation.isPending}
                  />

                  <Field label="Password" error={fieldErrors.password} required>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2 flex items-center gap-2">
                      <AlertCircle size={13} className="text-amber-600 flex-shrink-0" />
                      <p className="text-xs text-amber-700 font-medium">Min 8 characters, one uppercase letter, one number</p>
                    </div>
                    <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-all ${fieldErrors.password ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20'}`}>
                      <span className="flex items-center justify-center w-10 h-11 flex-shrink-0 text-slate-400 border-r border-slate-200 bg-slate-50">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </span>
                      <input type={showPw ? 'text' : 'password'} value={formData.password}
                        onChange={e => set('password', e.target.value)}
                        className="flex-1 h-11 px-3 text-sm font-medium outline-none bg-transparent pr-0"
                        placeholder="Min 8 chars, 1 uppercase, 1 number" />
                      <button type="button" onClick={() => setShowPw(s => !s)}
                        className="flex items-center justify-center w-10 h-11 flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <div className="mt-2"><PasswordStrength password={formData.password} /></div>
                  </Field>

                  <Field label="I am a..." error={fieldErrors.role}>
                    <select value={formData.role} onChange={e => set('role', e.target.value)}
                      className="w-full h-11 px-4 border-2 border-slate-300 rounded-xl text-sm font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white">
                      <option value="patient">Patient</option>
                      <option value="family">Family Member / Caregiver</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-500">Healthcare professionals are registered by your admin with a verified badge.</p>
                  </Field>

                  <button type="submit"
                    className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2">
                    Continue -- Choose Care Setting
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>

                  <p className="text-center text-sm text-slate-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-teal-600 font-bold hover:text-teal-700 hover:underline">Sign in</Link>
                  </p>
                </form>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Your Current Care Setting</h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Select the type of palliative care you currently receive. This personalises your dashboard, resources, and care plan.
                    </p>
                    <div className="space-y-2">
                      {CARE_SETTINGS.map(s => {
                        const Icon = s.icon;
                        const sel = formData.care_setting === s.key;
                        return (
                          <button key={s.key} type="button"
                            onClick={() => { set('care_setting', s.key); setServerError(''); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left group ${sel ? s.active : s.color + ' hover:border-slate-400'}`}>
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${sel ? 'bg-white/60' : 'bg-white/80 group-hover:bg-white'}`}>
                              <Icon size={18} className={s.textColor} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold text-sm ${s.textColor}`}>{s.label}</p>
                              <p className="text-xs text-slate-500 leading-tight mt-0.5">{s.description}</p>
                            </div>
                            {sel && <CheckCircle size={16} className={s.textColor + ' flex-shrink-0'} />}
                          </button>
                        );
                      })}
                    </div>
                    {serverError?.includes('care setting') && (
                      <p className="mt-2 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{serverError}</p>
                    )}
                  </div>

                  {/* Terms */}
                  <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-teal-300 transition-colors">
                    <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 flex-shrink-0 text-teal-600 border-2 border-slate-300 rounded focus:ring-teal-500 cursor-pointer" />
                    <p className="text-xs text-slate-600 leading-relaxed">
                      I agree to the <strong className="text-teal-600">Terms of Service</strong> and <strong className="text-teal-600">Privacy Policy</strong>, and consent to collection and use of my health data for care coordination.
                    </p>
                  </label>

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => { setStep(1); setServerError(''); }}
                      className="flex-1 h-11 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                      Back
                    </button>
                    <button type="submit" disabled={registerMutation.isPending || !acceptedTerms || !formData.care_setting}
                      className="flex-[2] h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {registerMutation.isPending
                        ? <><Loader2 size={16} className="animate-spin" /> Creating account...</>
                        : <><CheckCircle size={16} /> Create Account</>
                      }
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
