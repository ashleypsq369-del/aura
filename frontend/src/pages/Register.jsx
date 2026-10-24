import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, User as UserIcon, Mail, Phone, Building2, Heart,
  Home, Stethoscope, BedDouble, CheckCircle, AlertCircle,
  Eye, EyeOff, Search, X, ChevronRight, Globe,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import toast from '../utils/toast';
import PasswordStrength from '../components/PasswordStrength';
import { useAuth } from '../context/AuthContext';
import LoginSlideshow from '../components/LoginSlideshow';
import { API_URL } from '../api/client';

// ─────────────────────────────────────────────────────────────────────────────
// COUNTRY DATA  (dial code + emoji flag + phone digit limit per ITU-T E.164)
// ─────────────────────────────────────────────────────────────────────────────
const COUNTRIES = [
  { code: 'GH', name: 'Ghana',           dial: '+233', flag: '🇬🇭', maxDigits: 9  },
  { code: 'NG', name: 'Nigeria',         dial: '+234', flag: '🇳🇬', maxDigits: 10 },
  { code: 'ZA', name: 'South Africa',    dial: '+27',  flag: '🇿🇦', maxDigits: 9  },
  { code: 'KE', name: 'Kenya',           dial: '+254', flag: '🇰🇪', maxDigits: 9  },
  { code: 'ET', name: 'Ethiopia',        dial: '+251', flag: '🇪🇹', maxDigits: 9  },
  { code: 'EG', name: 'Egypt',           dial: '+20',  flag: '🇪🇬', maxDigits: 10 },
  { code: 'TZ', name: 'Tanzania',        dial: '+255', flag: '🇹🇿', maxDigits: 9  },
  { code: 'UG', name: 'Uganda',          dial: '+256', flag: '🇺🇬', maxDigits: 9  },
  { code: 'CI', name: "Côte d'Ivoire",   dial: '+225', flag: '🇨🇮', maxDigits: 10 },
  { code: 'CM', name: 'Cameroon',        dial: '+237', flag: '🇨🇲', maxDigits: 9  },
  { code: 'SN', name: 'Senegal',         dial: '+221', flag: '🇸🇳', maxDigits: 9  },
  { code: 'MA', name: 'Morocco',         dial: '+212', flag: '🇲🇦', maxDigits: 9  },
  { code: 'RW', name: 'Rwanda',          dial: '+250', flag: '🇷🇼', maxDigits: 9  },
  { code: 'ZW', name: 'Zimbabwe',        dial: '+263', flag: '🇿🇼', maxDigits: 9  },
  { code: 'ZM', name: 'Zambia',          dial: '+260', flag: '🇿🇲', maxDigits: 9  },
  { code: 'MZ', name: 'Mozambique',      dial: '+258', flag: '🇲🇿', maxDigits: 9  },
  { code: 'MW', name: 'Malawi',          dial: '+265', flag: '🇲🇼', maxDigits: 9  },
  { code: 'LR', name: 'Liberia',         dial: '+231', flag: '🇱🇷', maxDigits: 8  },
  { code: 'SL', name: 'Sierra Leone',    dial: '+232', flag: '🇸🇱', maxDigits: 8  },
  { code: 'GN', name: 'Guinea',          dial: '+224', flag: '🇬🇳', maxDigits: 9  },
  { code: 'BJ', name: 'Benin',           dial: '+229', flag: '🇧🇯', maxDigits: 8  },
  { code: 'TG', name: 'Togo',            dial: '+228', flag: '🇹🇬', maxDigits: 8  },
  { code: 'BF', name: 'Burkina Faso',    dial: '+226', flag: '🇧🇫', maxDigits: 8  },
  { code: 'ML', name: 'Mali',            dial: '+223', flag: '🇲🇱', maxDigits: 8  },
  { code: 'NE', name: 'Niger',           dial: '+227', flag: '🇳🇪', maxDigits: 8  },
  { code: 'SS', name: 'South Sudan',     dial: '+211', flag: '🇸🇸', maxDigits: 9  },
  { code: 'SD', name: 'Sudan',           dial: '+249', flag: '🇸🇩', maxDigits: 9  },
  { code: 'GB', name: 'United Kingdom',  dial: '+44',  flag: '🇬🇧', maxDigits: 10 },
  { code: 'US', name: 'United States',   dial: '+1',   flag: '🇺🇸', maxDigits: 10 },
  { code: 'CA', name: 'Canada',          dial: '+1',   flag: '🇨🇦', maxDigits: 10 },
  { code: 'AU', name: 'Australia',       dial: '+61',  flag: '🇦🇺', maxDigits: 9  },
  { code: 'DE', name: 'Germany',         dial: '+49',  flag: '🇩🇪', maxDigits: 11 },
  { code: 'FR', name: 'France',          dial: '+33',  flag: '🇫🇷', maxDigits: 9  },
  { code: 'IN', name: 'India',           dial: '+91',  flag: '🇮🇳', maxDigits: 10 },
  { code: 'CN', name: 'China',           dial: '+86',  flag: '🇨🇳', maxDigits: 11 },
  { code: 'JP', name: 'Japan',           dial: '+81',  flag: '🇯🇵', maxDigits: 10 },
  { code: 'BR', name: 'Brazil',          dial: '+55',  flag: '🇧🇷', maxDigits: 11 },
  { code: 'MX', name: 'Mexico',          dial: '+52',  flag: '🇲🇽', maxDigits: 10 },
  { code: 'IT', name: 'Italy',           dial: '+39',  flag: '🇮🇹', maxDigits: 10 },
  { code: 'ES', name: 'Spain',           dial: '+34',  flag: '🇪🇸', maxDigits: 9  },
  { code: 'NL', name: 'Netherlands',     dial: '+31',  flag: '🇳🇱', maxDigits: 9  },
  { code: 'SE', name: 'Sweden',          dial: '+46',  flag: '🇸🇪', maxDigits: 9  },
  { code: 'NO', name: 'Norway',          dial: '+47',  flag: '🇳🇴', maxDigits: 8  },
  { code: 'DK', name: 'Denmark',         dial: '+45',  flag: '🇩🇰', maxDigits: 8  },
  { code: 'CH', name: 'Switzerland',     dial: '+41',  flag: '🇨🇭', maxDigits: 9  },
  { code: 'IE', name: 'Ireland',         dial: '+353', flag: '🇮🇪', maxDigits: 9  },
  { code: 'SA', name: 'Saudi Arabia',    dial: '+966', flag: '🇸🇦', maxDigits: 9  },
  { code: 'AE', name: 'UAE',             dial: '+971', flag: '🇦🇪', maxDigits: 9  },
  { code: 'RU', name: 'Russia',          dial: '+7',   flag: '🇷🇺', maxDigits: 10 },
];

// ─────────────────────────────────────────────────────────────────────────────
// CARE SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
const CARE_SETTINGS = [
  {
    key: 'hospital_based', label: 'Hospital-Based Care', icon: Building2,
    color: 'border-blue-200 bg-blue-50/80', active: 'border-blue-500 bg-blue-100 ring-2 ring-blue-400/40',
    textColor: 'text-blue-700', description: 'Admitted to or regularly attending a hospital palliative care unit',
  },
  {
    key: 'hospice', label: 'Hospice Care', icon: Heart,
    color: 'border-rose-200 bg-rose-50/80', active: 'border-rose-500 bg-rose-100 ring-2 ring-rose-400/40',
    textColor: 'text-rose-700', description: 'Receiving comfort-focused, end-of-life care',
  },
  {
    key: 'home_based', label: 'Home-Based Care', icon: Home,
    color: 'border-green-200 bg-green-50/80', active: 'border-green-500 bg-green-100 ring-2 ring-green-400/40',
    textColor: 'text-green-700', description: 'A care team visits at home to manage your condition',
  },
  {
    key: 'outpatient_clinic', label: 'Outpatient Clinic', icon: Stethoscope,
    color: 'border-teal-200 bg-teal-50/80', active: 'border-teal-500 bg-teal-100 ring-2 ring-teal-400/40',
    textColor: 'text-teal-700', description: 'Regular clinic appointments, returning home the same day',
  },
  {
    key: 'long_term_residential', label: 'Residential / Nursing Home', icon: BedDouble,
    color: 'border-purple-200 bg-purple-50/80', active: 'border-purple-500 bg-purple-100 ring-2 ring-purple-400/40',
    textColor: 'text-purple-700', description: 'Living in a nursing home or long-term care facility',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PER-FIELD VALIDATORS  (called on blur + on change if already touched)
// ─────────────────────────────────────────────────────────────────────────────
const VALIDATORS = {
  full_name: (v) => {
    if (!v.trim()) return 'Full name is required';
    if (v.trim().length < 2) return 'Name must be at least 2 characters';
    if (v.trim().length > 100) return 'Name cannot exceed 100 characters';
    if (/[0-9]/.test(v)) return 'Name cannot contain numbers';
    if (!/^[\p{L}\s'\-\.]+$/u.test(v.trim())) return 'Letters, spaces, hyphens and apostrophes only';
    return null;
  },
  username: (v) => {
    if (!v.trim()) return 'Username is required';
    if (v.length < 3) return 'Username must be at least 3 characters';
    if (v.length > 50) return 'Username cannot exceed 50 characters';
    if (!/^[a-z0-9_]+$/.test(v)) return 'Lowercase letters, numbers and underscores only';
    return null;
  },
  email: (v) => {
    if (!v.trim()) return 'Email address is required';
    if (v.length > 100) return 'Email cannot exceed 100 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Please enter a valid email address';
    return null;
  },
  password: (v) => {
    if (!v) return 'Password is required';
    if (v.length < 8) return 'Password must be at least 8 characters';
    if (v.length > 72) return 'Password cannot exceed 72 characters';
    if (!/[A-Z]/.test(v)) return 'Must contain at least one uppercase letter';
    if (!/[0-9]/.test(v)) return 'Must contain at least one number';
    return null;
  },
};

function validateStep1(data, country) {
  const errors = {};
  Object.entries(VALIDATORS).forEach(([field, fn]) => {
    const err = fn(data[field] ?? '');
    if (err) errors[field] = err;
  });
  if (data.phone_number?.trim()) {
    const digits = data.phone_number.replace(/\D/g, '');
    const max = country?.maxDigits ?? 15;
    if (digits.length < 4) errors.phone_number = 'Phone number must be at least 4 digits';
    else if (digits.length > max) errors.phone_number = `Max ${max} digits for ${country?.name}`;
  }
  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNTRY DRAWER — slides in from the left as a panel
// ─────────────────────────────────────────────────────────────────────────────
function CountryDrawer({ isOpen, onClose, selected, onSelect }) {
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);

  // Focus search when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 100);
      setSearch('');
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const filtered = search.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  // Group: show Ghana first, then alphabetical
  const sorted = [
    ...filtered.filter(c => c.code === 'GH'),
    ...filtered.filter(c => c.code !== 'GH').sort((a, b) => a.name.localeCompare(b.name)),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer panel — slides from left */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 left-0 h-full w-80 max-w-[90vw] bg-white shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Select country"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-600 to-cyan-600">
              <div className="flex items-center gap-2.5">
                <Globe size={18} className="text-white" />
                <h2 className="font-bold text-white text-base">Select Country</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                aria-label="Close country picker"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search country or dial code…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-slate-50 transition-all"
                  autoComplete="off"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                {sorted.length} {sorted.length === 1 ? 'country' : 'countries'}
              </p>
            </div>

            {/* Country list */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {sorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Globe size={32} className="mb-3 opacity-40" />
                  <p className="text-sm font-medium">No countries found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                sorted.map(country => {
                  const isSelected = selected.code === country.code;
                  return (
                    <button
                      key={country.code}
                      onClick={() => { onSelect(country); onClose(); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-slate-50 hover:bg-teal-50 active:bg-teal-100 ${
                        isSelected ? 'bg-teal-50 border-l-4 border-l-teal-500' : ''
                      }`}
                    >
                      {/* Flag emoji */}
                      <span className="text-xl w-8 text-center flex-shrink-0 leading-none">{country.flag}</span>
                      {/* Country info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-teal-700' : 'text-slate-800'}`}>
                          {country.name}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">{country.dial}</p>
                      </div>
                      {/* Max digits hint */}
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{country.maxDigits}d</span>
                      {isSelected && <CheckCircle size={16} className="text-teal-500 flex-shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Selected summary */}
            {selected && (
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                <p className="text-xs text-slate-500">Selected:</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg">{selected.flag}</span>
                  <span className="text-sm font-bold text-slate-800">{selected.name}</span>
                  <span className="text-sm font-mono text-teal-600">{selected.dial}</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, error, required, hint, children, charCount, maxChars }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className={`text-[11px] font-bold uppercase tracking-wider ${error ? 'text-red-600' : 'text-slate-600'}`}>
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {maxChars && charCount !== undefined && (
          <span className={`text-[10px] font-mono tabular-nums ${
            charCount >= maxChars ? 'text-red-500 font-bold' :
            charCount >= maxChars * 0.85 ? 'text-amber-500' : 'text-slate-400'
          }`}>
            {charCount}/{maxChars}
          </span>
        )}
      </div>
      {children}
      <AnimatePresence>
        {error ? (
          <motion.p
            key="err"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium"
          >
            <AlertCircle size={11} className="flex-shrink-0" />{error}
          </motion.p>
        ) : hint ? (
          <p className="mt-1 text-[10px] text-slate-400">{hint}</p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT CLASS HELPER
// ─────────────────────────────────────────────────────────────────────────────
function inputCls(error, extra = '') {
  return `flex-1 h-11 px-3 text-sm font-medium outline-none bg-transparent ${extra} ${
    error ? 'placeholder:text-red-300' : 'placeholder:text-slate-400'
  }`;
}

function wrapCls(error) {
  return `flex items-center border-2 rounded-xl overflow-hidden transition-all ${
    error
      ? 'border-red-400 bg-red-50 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20'
      : 'border-slate-200 bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20'
  }`;
}

function IconSlot({ error, children }) {
  return (
    <span className={`flex items-center justify-center w-10 h-11 flex-shrink-0 border-r ${
      error ? 'border-red-200 bg-red-50 text-red-400' : 'border-slate-100 bg-slate-50 text-slate-400'
    }`}>
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({}); // which fields user has left/interacted with
  const [serverError, setServerError] = useState('');
  const [countryDrawerOpen, setCountryDrawerOpen] = useState(false);

  const defaultCountry = COUNTRIES.find(c => c.code === 'GH');
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);

  const [formData, setFormData] = useState({
    full_name: '', username: '', email: '', password: '',
    phone_number: '', role: 'patient', care_setting: '',
  });

  // Validate a single field and update errors
  const validateField = useCallback((field, value) => {
    if (field === 'phone_number') {
      if (!value.trim()) { setFieldErrors(p => ({ ...p, phone_number: undefined })); return; }
      const digits = value.replace(/\D/g, '');
      const max = selectedCountry?.maxDigits ?? 15;
      if (digits.length < 4)
        setFieldErrors(p => ({ ...p, phone_number: 'Phone number must be at least 4 digits' }));
      else if (digits.length > max)
        setFieldErrors(p => ({ ...p, phone_number: `Max ${max} digits for ${selectedCountry?.name}` }));
      else
        setFieldErrors(p => ({ ...p, phone_number: undefined }));
      return;
    }
    const fn = VALIDATORS[field];
    if (!fn) return;
    const err = fn(value);
    setFieldErrors(p => ({ ...p, [field]: err || undefined }));
  }, [selectedCountry]);

  const set = useCallback((field, value) => {
    setFormData(p => ({ ...p, [field]: value }));
    setServerError('');
    // Re-validate immediately if field was already touched (show errors as you fix them)
    setTouched(prev => {
      if (prev[field]) validateField(field, value);
      return prev;
    });
  }, [validateField]);

  // Called when user leaves a field — mark as touched and validate
  const handleBlur = useCallback((field) => {
    setTouched(p => ({ ...p, [field]: true }));
    validateField(field, formData[field] ?? '');
  }, [validateField, formData]);

  // Phone: digits only, capped at country max, validate immediately
  const handlePhone = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, selectedCountry.maxDigits);
    setFormData(p => ({ ...p, phone_number: digits }));
    setServerError('');
    if (touched.phone_number) validateField('phone_number', digits);
  };

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      const phone = data.phone_number
        ? selectedCountry.dial + data.phone_number.replace(/^0/, '')
        : '';
      return axios.post(`${API_URL}/api/auth/register`, {
        username:     data.username,
        email:        data.email,
        password:     data.password,
        full_name:    data.full_name,
        role:         data.role,
        phone:        phone || undefined,
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
    // Mark all fields as touched so all errors show
    setTouched({ full_name: true, username: true, email: true, password: true, phone_number: true });
    const errors = validateStep1(formData, selectedCountry);
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
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
    <>
      {/* Country drawer — portal-level, above everything */}
      <CountryDrawer
        isOpen={countryDrawerOpen}
        onClose={() => setCountryDrawerOpen(false)}
        selected={selectedCountry}
        onSelect={(c) => { setSelectedCountry(c); set('phone_number', ''); }}
      />

      <div className="min-h-screen flex flex-col lg:flex-row text-slate-800">

        {/* Mobile: full-screen background slideshow */}
        <div className="fixed inset-0 lg:hidden z-0">
          <LoginSlideshow />
        </div>

        {/* Desktop: left half sticky slideshow */}
        <div className="hidden lg:block lg:w-1/2 lg:sticky lg:top-0 lg:min-h-screen flex-shrink-0 relative overflow-hidden z-0">
          <LoginSlideshow />
        </div>

        {/* Form panel */}
        <div className="relative z-10 flex-1 flex items-start justify-center p-4 sm:p-8 lg:p-10 overflow-y-auto min-h-screen lg:min-h-0">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md my-4 sm:my-6"
          >
            <div className="bg-white/92 lg:bg-white backdrop-blur-md lg:backdrop-blur-none rounded-2xl shadow-2xl border border-white/50 lg:border-slate-200 overflow-hidden">

              {/* ── Header ──────────────────────────────────────────────── */}
              <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-5 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                    <img src="/logo.png" alt="Project Aura" className="w-9 h-9 object-contain" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold leading-none">Create Account</h1>
                    <p className="text-teal-100 text-xs mt-0.5">Project Aura · AI Palliative Care Platform</p>
                  </div>
                </div>
                {/* Step progress */}
                <div className="flex items-center gap-2">
                  {[1, 2].map(s => (
                    <div
                      key={s}
                      className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                        s === step ? 'bg-white text-teal-700 shadow' :
                        s < step   ? 'bg-teal-400/60 text-white' :
                                     'bg-white/20 text-white/50'
                      }`}
                    >
                      {s < step ? <CheckCircle size={14} /> : s}
                    </div>
                  ))}
                  <div className="flex-1 h-0.5 bg-white/20 mx-1 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white rounded-full"
                      animate={{ width: step > 1 ? '100%' : '0%' }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <span className="text-teal-100 text-xs font-medium">Step {step} of 2</span>
                </div>
              </div>

              <div className="px-6 py-5">

                {/* Server error */}
                <AnimatePresence>
                  {serverError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5"
                    >
                      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 font-medium">{serverError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── STEP 1 ─────────────────────────────────────────────── */}
                {step === 1 && (
                  <form onSubmit={handleStep1} noValidate className="space-y-4">

                    {/* Full Name */}
                    <Field
                      label="Full Name" required
                      error={fieldErrors.full_name}
                      hint="Letters, spaces, hyphens and apostrophes only"
                      charCount={formData.full_name.length} maxChars={100}
                    >
                      <div className={wrapCls(fieldErrors.full_name)}>
                        <IconSlot error={fieldErrors.full_name}><UserIcon size={15} /></IconSlot>
                        <input
                          type="text"
                          value={formData.full_name}
                          onChange={e => {
                            // Block digits immediately — don't let numbers in
                            const clean = e.target.value.replace(/[0-9]/g, '');
                            set('full_name', clean);
                          }}
                          onBlur={() => handleBlur('full_name')}
                          className={inputCls(fieldErrors.full_name)}
                          placeholder="e.g., Kwame Mensah"
                          maxLength={100}
                          minLength={2}
                          autoComplete="name"
                          spellCheck={false}
                        />
                      </div>
                    </Field>

                    {/* Username */}
                    <Field
                      label="Username" required
                      error={fieldErrors.username}
                      hint="Lowercase letters, numbers and underscores only"
                      charCount={formData.username.length} maxChars={50}
                    >
                      <div className={wrapCls(fieldErrors.username)}>
                        <IconSlot error={fieldErrors.username}>
                          <span className="text-xs font-bold text-slate-400">@</span>
                        </IconSlot>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          onBlur={() => handleBlur('username')}
                          className={inputCls(fieldErrors.username)}
                          placeholder="e.g., kwame_mensah"
                          maxLength={50}
                          minLength={3}
                          autoComplete="username"
                          autoCapitalize="none"
                          spellCheck={false}
                          pattern="[a-z0-9_]+"
                        />
                      </div>
                      {!fieldErrors.username && formData.username.length >= 3 && (
                        <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1 font-medium">
                          <CheckCircle size={11} />Username looks good
                        </p>
                      )}
                    </Field>

                    {/* Email */}
                    <Field
                      label="Email Address" required
                      error={fieldErrors.email}
                      charCount={formData.email.length} maxChars={100}
                    >
                      <div className={wrapCls(fieldErrors.email)}>
                        <IconSlot error={fieldErrors.email}><Mail size={15} /></IconSlot>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e => set('email', e.target.value)}
                          onBlur={() => handleBlur('email')}
                          className={inputCls(fieldErrors.email)}
                          placeholder="your.email@example.com"
                          maxLength={100}
                          autoComplete="email"
                          autoCapitalize="none"
                          spellCheck={false}
                          inputMode="email"
                        />
                      </div>
                    </Field>

                    {/* Phone */}
                    <Field
                      label="Phone" error={fieldErrors.phone_number}
                      hint={`Optional · ${selectedCountry.name} numbers: max ${selectedCountry.maxDigits} digits`}
                    >
                      <div className="flex gap-2 items-stretch">
                        {/* Country trigger button */}
                        <button
                          type="button"
                          onClick={() => setCountryDrawerOpen(true)}
                          className="flex items-center gap-2 h-11 px-3 border-2 border-slate-200 rounded-xl bg-white hover:border-teal-400 hover:bg-teal-50 transition-all font-semibold text-sm flex-shrink-0 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 group"
                          aria-label={`Selected country: ${selectedCountry.name} ${selectedCountry.dial}. Click to change`}
                        >
                          <span className="text-xl leading-none">{selectedCountry.flag}</span>
                          <span className="text-teal-700 font-mono text-sm">{selectedCountry.dial}</span>
                          <ChevronRight size={13} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                        </button>

                        {/* Phone number — digits only, enforced by type=tel + pattern */}
                        <div className={`flex-1 flex items-center border-2 rounded-xl overflow-hidden transition-all ${
                          fieldErrors.phone_number
                            ? 'border-red-400 bg-red-50'
                            : 'border-slate-200 bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20'
                        }`}>
                          <IconSlot error={fieldErrors.phone_number}><Phone size={14} /></IconSlot>
                          <input
                            type="tel"
                            value={formData.phone_number}
                            onChange={e => handlePhone(e.target.value)}
                            onBlur={() => { setTouched(p => ({ ...p, phone_number: true })); validateField('phone_number', formData.phone_number); }}
                            className={inputCls(fieldErrors.phone_number, 'font-mono tracking-wider')}
                            placeholder={`Max ${selectedCountry.maxDigits} digits`}
                            maxLength={selectedCountry.maxDigits}
                            pattern="[0-9]*"
                            inputMode="numeric"
                            autoComplete="tel-national"
                          />
                          {formData.phone_number && (
                            <span className={`text-[10px] font-mono pr-2 flex-shrink-0 tabular-nums ${
                              formData.phone_number.length >= selectedCountry.maxDigits
                                ? 'text-red-500 font-bold'
                                : 'text-slate-400'
                            }`}>
                              {formData.phone_number.length}/{selectedCountry.maxDigits}
                            </span>
                          )}
                        </div>
                      </div>
                    </Field>

                    {/* Password */}
                    <Field
                      label="Password" required
                      error={fieldErrors.password}
                      charCount={formData.password.length} maxChars={72}
                    >
                      {/* Requirements hint */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {[
                          { label: '8+ chars',   ok: formData.password.length >= 8 },
                          { label: 'Uppercase',  ok: /[A-Z]/.test(formData.password) },
                          { label: 'Number',     ok: /[0-9]/.test(formData.password) },
                          { label: 'Max 72',     ok: formData.password.length > 0 && formData.password.length <= 72 },
                        ].map(({ label, ok }) => (
                          <span
                            key={label}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                              ok
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                          >
                            {ok ? <CheckCircle size={9} /> : <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />}
                            {label}
                          </span>
                        ))}
                      </div>

                      <div className={wrapCls(fieldErrors.password)}>
                        <IconSlot error={fieldErrors.password}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        </IconSlot>
                        <input
                          type={showPw ? 'text' : 'password'}
                          value={formData.password}
                          onChange={e => set('password', e.target.value)}
                          onBlur={() => handleBlur('password')}
                          className={inputCls(fieldErrors.password)}
                          placeholder="Create a strong password"
                          maxLength={72}
                          minLength={8}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(s => !s)}
                          className="flex items-center justify-center w-10 h-11 flex-shrink-0 text-slate-400 hover:text-teal-600 transition-colors border-l border-slate-100 bg-white"
                          aria-label={showPw ? 'Hide password' : 'Show password'}
                        >
                          {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <div className="mt-2">
                        <PasswordStrength password={formData.password} />
                      </div>
                    </Field>

                    {/* Role */}
                    <Field label="I am a..." error={fieldErrors.role}>
                      <select
                        value={formData.role}
                        onChange={e => set('role', e.target.value)}
                        className="w-full h-11 px-4 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white transition-all appearance-none cursor-pointer"
                      >
                        <option value="patient">Patient</option>
                        <option value="family">Family Member / Caregiver</option>
                      </select>
                      <p className="mt-1 text-[10px] text-slate-400">
                        Healthcare professionals are registered by your admin with a verified badge.
                      </p>
                    </Field>

                    <button
                      type="submit"
                      className="w-full h-11 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 mt-2"
                    >
                      Continue · Choose Care Setting
                      <ChevronRight size={16} />
                    </button>

                    <p className="text-center text-sm text-slate-500">
                      Already have an account?{' '}
                      <Link to="/login" className="text-teal-600 font-bold hover:text-teal-700 hover:underline">
                        Sign in
                      </Link>
                    </p>
                  </form>
                )}

                {/* ── STEP 2 ─────────────────────────────────────────────── */}
                {step === 2 && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">Your Current Care Setting</h3>
                      <p className="text-xs text-slate-500 mb-4">
                        This personalises your dashboard, resources, and care plan.
                      </p>
                      <div className="space-y-2.5">
                        {CARE_SETTINGS.map(s => {
                          const Icon = s.icon;
                          const sel = formData.care_setting === s.key;
                          return (
                            <button
                              key={s.key}
                              type="button"
                              onClick={() => { set('care_setting', s.key); setServerError(''); }}
                              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left group ${
                                sel ? s.active : s.color + ' hover:border-slate-300'
                              }`}
                            >
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                                sel ? 'bg-white/70' : 'bg-white/80 group-hover:bg-white'
                              }`}>
                                <Icon size={18} className={s.textColor} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-bold text-sm ${s.textColor}`}>{s.label}</p>
                                <p className="text-xs text-slate-500 leading-tight mt-0.5">{s.description}</p>
                              </div>
                              {sel && <CheckCircle size={16} className={`${s.textColor} flex-shrink-0`} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Terms */}
                    <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-teal-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={e => { setAcceptedTerms(e.target.checked); setServerError(''); }}
                        className="mt-0.5 w-4 h-4 flex-shrink-0 text-teal-600 border-2 border-slate-300 rounded focus:ring-teal-500 cursor-pointer accent-teal-600"
                      />
                      <p className="text-xs text-slate-600 leading-relaxed">
                        I agree to the <strong className="text-teal-600">Terms of Service</strong> and{' '}
                        <strong className="text-teal-600">Privacy Policy</strong>, and consent to collection
                        and use of my health data for care coordination.
                      </p>
                    </label>

                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => { setStep(1); setServerError(''); }}
                        className="flex-1 h-11 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
                      >
                        ← Back
                      </button>
                      <button
                        type="submit"
                        disabled={registerMutation.isPending || !acceptedTerms || !formData.care_setting}
                        className="flex-[2] h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        {registerMutation.isPending ? (
                          <><Loader2 size={16} className="animate-spin" />Creating account...</>
                        ) : (
                          <><CheckCircle size={16} />Create Account</>
                        )}
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </div>

            <p className="text-center text-[10px] text-white/70 lg:text-slate-400 mt-3 drop-shadow">
              © {new Date().getFullYear()} Project Aura · Group 31 · Palliative Care Ghana
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
