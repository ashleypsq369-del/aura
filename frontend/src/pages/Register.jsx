/**
 * Register.jsx — Project Aura
 * Healthcare-standard signup form (NHS / MyChart / Epic conventions):
 * • One card, two steps, plenty of breathing room
 * • Inline errors on blur; live re-check while typing once touched
 * • Confirm password field
 * • Compact inline country + dial-code selector (no modal / drawer)
 * • No distracting character counters; no clutter
 * • Slideshow full-screen on mobile (glass card), left-half on desktop
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Loader2, User as UserIcon, Mail, Phone, Lock,
 Eye, EyeOff, Search, X, ChevronDown,
 CheckCircle, AlertCircle,
 Building2, Heart, Home, Stethoscope, BedDouble, Calendar,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import toast from '../utils/toast';
import PasswordStrength from '../components/PasswordStrength';
import { useAuth } from '../context/AuthContext';
import LoginSlideshow from '../components/LoginSlideshow';
import { API_URL } from '../api/client';

// ─── Countries (ITU-T E.164) ──────────────────────────────────────────────────
const COUNTRIES = [
 { code:'GH', name:'Ghana', dial:'+233', flag:'🇬🇭', max:9 },
 { code:'NG', name:'Nigeria', dial:'+234', flag:'🇳🇬', max:10 },
 { code:'ZA', name:'South Africa', dial:'+27', flag:'≡ƒç┐≡ƒçª', max:9 },
 { code:'KE', name:'Kenya', dial:'+254', flag:'🇰🇪', max:9 },
 { code:'ET', name:'Ethiopia', dial:'+251', flag:'🇪🇹', max:9 },
 { code:'EG', name:'Egypt', dial:'+20', flag:'🇪🇬', max:10 },
 { code:'TZ', name:'Tanzania', dial:'+255', flag:'≡ƒç╣≡ƒç┐', max:9 },
 { code:'UG', name:'Uganda', dial:'+256', flag:'🇺🇬', max:9 },
 { code:'CI', name:"C├┤te d'Ivoire", dial:'+225', flag:'🇨🇮', max:10 },
 { code:'CM', name:'Cameroon', dial:'+237', flag:'🇨🇲', max:9 },
 { code:'SN', name:'Senegal', dial:'+221', flag:'🇸🇳', max:9 },
 { code:'MA', name:'Morocco', dial:'+212', flag:'🇲🇦', max:9 },
 { code:'RW', name:'Rwanda', dial:'+250', flag:'🇷🇼', max:9 },
 { code:'ZW', name:'Zimbabwe', dial:'+263', flag:'≡ƒç┐≡ƒç╝', max:9 },
 { code:'ZM', name:'Zambia', dial:'+260', flag:'≡ƒç┐≡ƒç▓', max:9 },
 { code:'LR', name:'Liberia', dial:'+231', flag:'≡ƒç▒≡ƒç╖', max:8 },
 { code:'SL', name:'Sierra Leone', dial:'+232', flag:'≡ƒç╕≡ƒç▒', max:8 },
 { code:'GN', name:'Guinea', dial:'+224', flag:'🇬🇳', max:9 },
 { code:'BJ', name:'Benin', dial:'+229', flag:'🇧🇯', max:8 },
 { code:'TG', name:'Togo', dial:'+228', flag:'🇹🇬', max:8 },
 { code:'BF', name:'Burkina Faso', dial:'+226', flag:'🇧🇫', max:8 },
 { code:'ML', name:'Mali', dial:'+223', flag:'≡ƒç▓≡ƒç▒', max:8 },
 { code:'NE', name:'Niger', dial:'+227', flag:'🇳🇪', max:8 },
 { code:'SS', name:'South Sudan', dial:'+211', flag:'🇸🇸', max:9 },
 { code:'SD', name:'Sudan', dial:'+249', flag:'🇸🇩', max:9 },
 { code:'GB', name:'United Kingdom', dial:'+44', flag:'🇬🇧', max:10 },
 { code:'US', name:'United States', dial:'+1', flag:'🇺🇸', max:10 },
 { code:'CA', name:'Canada', dial:'+1', flag:'🇨🇦', max:10 },
 { code:'AU', name:'Australia', dial:'+61', flag:'🇦🇺', max:9 },
 { code:'DE', name:'Germany', dial:'+49', flag:'≡ƒç⌐≡ƒç¬', max:11 },
 { code:'FR', name:'France', dial:'+33', flag:'🇫🇷', max:9 },
 { code:'IN', name:'India', dial:'+91', flag:'🇮🇳', max:10 },
 { code:'BR', name:'Brazil', dial:'+55', flag:'🇧🇷', max:11 },
 { code:'IT', name:'Italy', dial:'+39', flag:'🇮🇹', max:10 },
 { code:'ES', name:'Spain', dial:'+34', flag:'🇪🇸', max:9 },
 { code:'NL', name:'Netherlands', dial:'+31', flag:'≡ƒç│≡ƒç▒', max:9 },
 { code:'IE', name:'Ireland', dial:'+353', flag:'🇮🇪', max:9 },
 { code:'SA', name:'Saudi Arabia', dial:'+966', flag:'🇸🇦', max:9 },
 { code:'AE', name:'UAE', dial:'+971', flag:'🇦🇪', max:9 },
];

// ─── Care settings ────────────────────────────────────────────────────────────
const CARE_SETTINGS = [
 {
 key: 'hospital_based', label: 'Hospital-Based Care',
 icon: Building2, description: 'Admitted to or regularly attending a hospital palliative care unit',
 accent: { border:'border-teal-500', bg:'bg-blue-50', dot:'bg-teal-500', text:'text-teal-700', ring:'ring-teal-200' },
 },
 {
 key: 'hospice', label: 'Hospice Care',
 icon: Heart, description: 'Receiving comfort-focused, end-of-life care',
 accent: { border:'border-rose-500', bg:'bg-rose-50', dot:'bg-rose-500', text:'text-rose-700', ring:'ring-rose-200' },
 },
 {
 key: 'home_based', label: 'Home-Based Care',
 icon: Home, description: 'A care team visits you at home to manage your condition',
 accent: { border:'border-emerald-500', bg:'bg-emerald-50', dot:'bg-emerald-500', text:'text-emerald-700', ring:'ring-emerald-200' },
 },
 {
 key: 'outpatient_clinic', label: 'Outpatient Clinic',
 icon: Stethoscope, description: 'Regular clinic appointments, returning home the same day',
 accent: { border:'border-teal-500', bg:'bg-teal-50', dot:'bg-teal-500', text:'text-teal-700', ring:'ring-teal-200' },
 },
 {
 key: 'long_term_residential', label: 'Residential / Nursing Home',
 icon: BedDouble, description: 'Living in a nursing home or long-term care facility',
 accent: { border:'border-teal-500', bg:'bg-violet-50', dot:'bg-teal-500', text:'text-teal-700', ring:'ring-violet-200' },
 },
];

// ─── Validators (called on blur + re-called while typing if already touched) ──
const VALIDATORS = {
 full_name: v => {
 if (!v.trim()) return 'Please enter your full name';
 if (v.trim().length < 2) return 'Name must be at least 2 characters';
 if (/\d/.test(v)) return 'Name should not contain numbers';
 return null;
 },
 username: v => {
 if (!v.trim()) return 'Please choose a username';
 if (v.length < 3) return 'Username must be at least 3 characters';
 if (v.length > 50) return 'Username is too long (max 50 characters)';
 if (!/^[a-z0-9_]+$/.test(v)) return 'Use lowercase letters, numbers or underscores only';
 return null;
 },
 email: v => {
 if (!v.trim()) return 'Please enter your email address';
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Please enter a valid email address';
 return null;
 },
 password: v => {
 if (!v) return 'Please create a password';
 if (v.length < 8) return 'Password must be at least 8 characters';
 if (!/[A-Z]/.test(v)) return 'Include at least one uppercase letter (A—Z)';
 if (!/[0-9]/.test(v)) return 'Include at least one number (0—9)';
 return null;
 },
 confirm_password: (v, pw) => {
 if (!v) return 'Please confirm your password';
 if (v !== pw) return 'Passwords do not match';
 return null;
 },
};

// ─── Compact inline country selector ─────────────────────────────────────────
function CountrySelector({ selected, onChange }) {
 const [open, setOpen] = useState(false);
 const [query, setQuery] = useState('');
 const wrapRef = useRef(null);
 const inputRef = useRef(null);

 const list = (() => {
 const base = [
 COUNTRIES[0], // Ghana first
 ...COUNTRIES.slice(1).sort((a,b) => a.name.localeCompare(b.name)),
 ];
 if (!query.trim()) return base;
 const q = query.toLowerCase();
 return base.filter(c => c.name.toLowerCase().includes(q) || c.dial.includes(q));
 })();

 // Close on outside click
 useEffect(() => {
 const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setQuery(''); } };
 document.addEventListener('mousedown', h);
 return () => document.removeEventListener('mousedown', h);
 }, []);

 // Focus search on open
 useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 40); }, [open]);

 // Escape closes
 useEffect(() => {
 if (!open) return;
 const h = e => { if (e.key === 'Escape') { setOpen(false); setQuery(''); } };
 window.addEventListener('keydown', h);
 return () => window.removeEventListener('keydown', h);
 }, [open]);

 return (
 <div className="relative flex-shrink-0" ref={wrapRef}>
 {/* Trigger */}
 <button
 type="button"
 onClick={() => setOpen(o => !o)}
 className="flex items-center gap-1.5 h-11 px-3 border-2 border-slate-200 rounded-xl bg-slate-50 hover:border-teal-400 focus:outline-none focus:border-slate-300 transition-all"
 aria-haspopup="listbox"
 aria-label={`Phone country: ${selected.name} ${selected.dial}`}
 >
 <span className="text-lg leading-none select-none">{selected.flag}</span>
 <span className="text-sm font-semibold text-slate-700 font-mono tracking-tight">{selected.dial}</span>
 <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180':''}`} />
 </button>

 {/* Dropdown */}
 <AnimatePresence>
 {open && (
 <motion.div
 initial={{ opacity:0, y:-6, scale:0.97 }}
 animate={{ opacity:1, y:0, scale:1 }}
 exit ={{ opacity:0, y:-6, scale:0.97 }}
 transition={{ duration:0.15 }}
 className="absolute top-full left-0 mt-1.5 w-72 bg-slate-50 border border-slate-200 rounded-2xl shadow-2xl z-[200] overflow-hidden"
 role="listbox"
 >
 {/* Search bar */}
 <div className="p-2.5 border-b border-slate-100">
 <div className="relative">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
 <input
 ref={inputRef}
 type="text"
 value={query}
 onChange={e => setQuery(e.target.value)}
 placeholder="Search country or code…"
 className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-300 bg-slate-50"
 autoComplete="off"
 />
 {query && (
 <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5">
 <X size={12}/>
 </button>
 )}
 </div>
 </div>

 {/* Country list */}
 <div className="max-h-52 overflow-y-auto overscroll-contain">
 {list.length === 0 ? (
 <p className="text-center text-sm text-slate-400 py-8">No results for "{query}"</p>
 ) : list.map(c => (
 <button
 key={c.code}
 type="button"
 role="option"
 aria-selected={c.code === selected.code}
 onClick={() => { onChange(c); setOpen(false); setQuery(''); }}
 className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 active:bg-teal-50 border-b border-slate-50 last:border-0 ${
 c.code === selected.code ? 'bg-teal-50/60' : ''
 }`}
 >
 <span className="text-xl leading-none w-7 text-center flex-shrink-0">{c.flag}</span>
 <span className={`flex-1 truncate font-medium ${c.code === selected.code ? 'text-teal-700':'text-slate-700'}`}>{c.name}</span>
 <span className="font-mono text-xs text-slate-400 flex-shrink-0">{c.dial}</span>
 {c.code === selected.code && <CheckCircle size={14} className="text-teal-500 flex-shrink-0"/>}
 </button>
 ))}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}

// ─── Input field wrapper ──────────────────────────────────────────────────────
function InputGroup({ id, label, required, error, success, hint, children }) {
 return (
 <div className="space-y-1.5">
 <label htmlFor={id} className="block text-sm font-semibold text-slate-700 leading-none">
 {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
 </label>
 {children}
 <AnimatePresence>
 {error ? (
 <motion.p key="err" role="alert" initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
 className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
 <AlertCircle size={12} className="flex-shrink-0"/>{error}
 </motion.p>
 ) : success ? (
 <motion.p key="ok" initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
 className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
 <CheckCircle size={12} className="flex-shrink-0"/>{success}
 </motion.p>
 ) : hint ? (
 <p className="text-xs text-slate-400">{hint}</p>
 ) : null}
 </AnimatePresence>
 </div>
 );
}

// Input border helper
const inputBorder = (err) =>
 err
 ? 'border-red-400 focus-within:border-red-400'
 : 'border-slate-200 focus-within:border-slate-300';

const inputWrap = (err) =>
 `flex items-center border-2 rounded-xl overflow-hidden bg-slate-50 transition-all ${inputBorder(err)}`;

function IconSlot({ err, children }) {
 return (
 <span className={`flex items-center justify-center w-10 h-11 flex-shrink-0 border-r transition-colors ${
 err ? 'border-red-200 bg-red-50/60 text-red-400' : 'border-slate-100 bg-slate-50 text-slate-400'
 }`}>{children}</span>
 );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Register() {
 const navigate = useNavigate();
 const { setUser } = useAuth();
 const [searchParams] = useSearchParams();
 const preRole = searchParams.get('role') || '';

 const [step, setStep] = useState(1);
 const [showPw, setShowPw] = useState(false);
 const [showCpw, setShowCpw] = useState(false);
 const [terms, setTerms] = useState(false);
 const [errors, setErrors] = useState({});
 const [touched, setTouched] = useState({});
 const [serverErr, setServerErr] = useState('');
 const [country, setCountry] = useState(COUNTRIES[0]); // Ghana default

 const [form, setForm] = useState({
 full_name:'', username:'', email:'',
 password:'', confirm_password:'',
 phone:'', role: preRole, care_setting:'', gender:'', date_of_birth:'',
 });

 // ── Validation helpers ────────────────────────────────────────────────────
 const validateOne = useCallback((field, value) => {
 if (field === 'confirm_password') return VALIDATORS.confirm_password(value, form.password);
 if (field === 'phone') {
 if (!value) return null; // optional
 if (value.length < 4) return 'Phone number is too short';
 return null;
 }
 return VALIDATORS[field]?.(value) ?? null;
 }, [form.password]);

 const setField = useCallback((field, value) => {
 setForm(p => ({ ...p, [field]: value }));
 setServerErr('');
 // Live re-validate once the field has already been touched
 setTouched(prev => {
 if (prev[field]) {
 const err = field === 'confirm_password'
 ? VALIDATORS.confirm_password(value, field === 'password' ? value : form.password)
 : validateOne(field, value);
 setErrors(e => ({ ...e, [field]: err || undefined }));
 }
 return prev;
 });
 // Also re-check confirm_password live when password changes
 if (field === 'password' && touched.confirm_password) {
 const err = VALIDATORS.confirm_password(form.confirm_password, value);
 setErrors(e => ({ ...e, confirm_password: err || undefined }));
 }
 }, [form.password, form.confirm_password, touched, validateOne]);

 const handleBlur = useCallback((field) => {
 setTouched(p => ({ ...p, [field]: true }));
 const val = field === 'confirm_password' ? form.confirm_password : form[field] ?? '';
 const err = validateOne(field, val);
 setErrors(e => ({ ...e, [field]: err || undefined }));
 }, [form, validateOne]);

 const handlePhone = (raw) => {
 const digits = raw.replace(/\D/g, '').slice(0, country.max);
 setField('phone', digits);
 };

 // ── Step 1 submit ─────────────────────────────────────────────────────────
 const handleStep1 = (e) => {
 e.preventDefault();
 const fields = ['full_name','username','email','password','confirm_password'];
 const newTouched = fields.reduce((a,f) => ({ ...a, [f]: true }), {});
 setTouched(p => ({ ...p, ...newTouched }));

 const newErrors = {};
 fields.forEach(f => {
 const err = f === 'confirm_password'
 ? VALIDATORS.confirm_password(form.confirm_password, form.password)
 : VALIDATORS[f]?.(form[f] ?? '');
 if (err) newErrors[f] = err;
 });
 if (form.phone && form.phone.length < 4) newErrors.phone = 'Phone number is too short';

 if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
 setStep(2);
 window.scrollTo(0, 0);
 };

 // ── Final submit ──────────────────────────────────────────────────────────
 const registerMutation = useMutation({
 mutationFn: (data) => axios.post(`${API_URL}/api/auth/register`, {
 username: data.username,
 email: data.email,
 password: data.password,
 full_name: data.full_name,
 role: data.role,
 phone: data.phone ? country.dial + data.phone.replace(/^0/,'') : undefined,
 care_setting: data.care_setting || undefined,
 }),
 onSuccess: (res) => {
 const { access_token, user } = res.data;
 localStorage.setItem('auth_token', access_token);
 localStorage.setItem('user', JSON.stringify(user));
 setUser(user);
 toast.success('Account created! Welcome to Project Aura.');
 navigate('/setup');
 },
 onError: (err) => setServerErr(err.response?.data?.detail || 'Registration failed. Please try again.'),
 });

 const handleSubmit = (e) => {
 e.preventDefault();
 if (!form.care_setting) { setServerErr('Please select your care setting.'); return; }
 if (!terms) { setServerErr('Please accept the Terms of Service to continue.'); return; }
 registerMutation.mutate(form);
 };

 // ── Render ────────────────────────────────────────────────────────────────
 return (
 <div className="min-h-screen flex flex-col lg:flex-row">

 {/* Slideshow - fixed full-bg on mobile, left half on desktop */}
 <div className="fixed inset-0 lg:hidden z-0 pointer-events-none">
 <LoginSlideshow />
 </div>
 <div className="hidden lg:block lg:w-[45%] xl:w-1/2 lg:sticky lg:top-0 lg:min-h-screen flex-shrink-0 overflow-hidden z-0">
 <LoginSlideshow />
 </div>

 {/* ── Form panel ───────────────────────────────────────────────────── */}
 <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8 lg:px-10 min-h-screen lg:min-h-0 overflow-y-auto bg-slate-50/0 lg:bg-slate-50">
 <motion.div
 initial={{ opacity:0, y:16 }}
 animate={{ opacity:1, y:0 }}
 transition={{ duration:0.35 }}
 className="w-full max-w-[440px] my-4"
 >

 {/* ── Card ───────────────────────────────────────────────────────── */}
 <div className="bg-white/95 lg:bg-slate-50 backdrop-blur-xl lg:backdrop-blur-none rounded-2xl shadow-2xl lg:shadow-lg border border-white/30 lg:border-slate-200 overflow-hidden">

 {/* Header banner */}
 <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-5">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center shadow overflow-hidden flex-shrink-0">
 <img src="/logo.png" alt="Project Aura" className="w-10 h-10 object-contain" />
 </div>
 <div>
 <h1 className="text-white font-bold text-lg leading-none">Create your account</h1>
 <p className="text-teal-100 text-xs mt-0.5">Project Aura · Palliative Care Platform</p>
 </div>
 </div>

 {/* Step indicator - clean horizontal stepper */}
 <div className="flex items-center gap-0">
 {[
 { n:1, label:'Your details' },
 { n:2, label:'Care setting' },
 ].map(({ n, label }, idx) => (
 <div key={n} className={`flex items-center ${idx < 1 ? 'flex-1':''}`}>
 <div className="flex items-center gap-2">
 <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
 n < step ? 'bg-slate-50 text-teal-600' :
 n === step? 'bg-slate-50 text-teal-700 shadow' :
 'bg-white/20 text-white/60'
 }`}>
 {n < step ? <CheckCircle size={14}/> : n}
 </div>
 <span className={`text-xs font-medium ${n === step ? 'text-white':'text-teal-200/80'}`}>{label}</span>
 </div>
 {idx < 1 && (
 <div className="flex-1 mx-3 h-px relative">
 <div className="absolute inset-0 bg-white/20 rounded-full"/>
 <motion.div className="absolute inset-y-0 left-0 bg-slate-50 rounded-full" animate={{ width: step > 1 ? '100%':'0%' }} transition={{ duration:0.4 }}/>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>

 {/* Body */}
 <div className="px-6 py-6 space-y-5">

 {/* Server error */}
 <AnimatePresence>
 {serverErr && (
 <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
 className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5" role="alert">
 <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0"/>
 <p className="text-sm text-red-700 font-medium">{serverErr}</p>
 </motion.div>
 )}
 </AnimatePresence>

 {/* ΓòÉΓòÉ STEP 1 ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
 {step === 1 && (
 <form onSubmit={handleStep1} noValidate className="space-y-4">

 {/* Full name */}
 <InputGroup id="full_name" label="Full name" required error={errors.full_name}
 hint={!errors.full_name ? 'Use your name as it appears on official documents' : undefined}>
 <div className={inputWrap(errors.full_name)}>
 <IconSlot err={errors.full_name}><UserIcon size={15}/></IconSlot>
 <input
 id="full_name" type="text" autoComplete="name"
 value={form.full_name}
 onChange={e => setField('full_name', e.target.value.replace(/\d/g,''))}
 onBlur={() => handleBlur('full_name')}
 className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
 placeholder="e.g., Kwame Mensah"
 maxLength={100} spellCheck={false}
 aria-describedby="full_name-hint"
 aria-invalid={!!errors.full_name}
 />
 </div>
 </InputGroup>

 {/* Username */}
 <InputGroup id="username" label="Username" required error={errors.username}
 success={!errors.username && form.username.length >= 3 && touched.username ? 'Username looks good' : undefined}
 hint={!errors.username && !touched.username ? 'Lowercase letters, numbers and underscores' : undefined}>
 <div className={inputWrap(errors.username)}>
 <IconSlot err={errors.username}><span className="text-xs font-bold text-current">@</span></IconSlot>
 <input
 id="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false}
 value={form.username}
 onChange={e => setField('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))}
 onBlur={() => handleBlur('username')}
 className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
 placeholder="e.g., kwame_mensah"
 maxLength={50}
 aria-invalid={!!errors.username}
 />
 </div>
 </InputGroup>

 {/* Email */}
 <InputGroup id="email" label="Email address" required error={errors.email}>
 <div className={inputWrap(errors.email)}>
 <IconSlot err={errors.email}><Mail size={15}/></IconSlot>
 <input
 id="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} inputMode="email"
 value={form.email}
 onChange={e => setField('email', e.target.value)}
 onBlur={() => handleBlur('email')}
 className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
 placeholder="your@email.com"
 maxLength={100}
 aria-invalid={!!errors.email}
 />
 </div>
 </InputGroup>

 {/* Phone (optional) */}
 <InputGroup id="phone" label="Phone number" error={errors.phone}
 hint={!errors.phone ? 'Optional - used for appointment reminders only' : undefined}>
 <div className="flex gap-2">
 <CountrySelector selected={country} onChange={(c) => { setCountry(c); setField('phone',''); }}/>
 <div className={`flex-1 flex items-center border-2 rounded-xl overflow-hidden bg-slate-50 transition-all ${inputBorder(errors.phone)}`}>
 <IconSlot err={errors.phone}><Phone size={14}/></IconSlot>
 <input
 id="phone" type="tel" inputMode="numeric" autoComplete="tel-national"
 value={form.phone}
 onChange={e => handlePhone(e.target.value)}
 onBlur={() => { setTouched(p=>({...p,phone:true})); if(form.phone&&form.phone.length<4) setErrors(e=>({...e,phone:'Phone number is too short'})); }}
 className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent font-mono placeholder:text-slate-400 placeholder:font-sans"
 placeholder="Phone number"
 maxLength={country.max}
 pattern="[0-9]*"
 />
 </div>
 </div>
 </InputGroup>

 {/* Password */}
 <InputGroup id="password" label="Password" required error={errors.password}
 hint={!errors.password && !touched.password ? 'At least 8 characters, one uppercase letter and one number' : undefined}>
 <div className={inputWrap(errors.password)}>
 <IconSlot err={errors.password}><Lock size={15}/></IconSlot>
 <input
 id="password" type={showPw?'text':'password'} autoComplete="new-password"
 value={form.password}
 onChange={e => setField('password', e.target.value)}
 onBlur={() => handleBlur('password')}
 className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
 placeholder="Create a secure password"
 maxLength={72}
 aria-invalid={!!errors.password}
 />
 <button type="button" onClick={() => setShowPw(s=>!s)}
 className="w-10 h-11 flex items-center justify-center flex-shrink-0 text-slate-400 hover:text-teal-600 border-l border-slate-100 transition-colors"
 aria-label={showPw?'Hide password':'Show password'}>
 {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
 </button>
 </div>
 {/* Strength bar - only shown once typing starts */}
 {form.password.length > 0 && (
 <div className="mt-2"><PasswordStrength password={form.password}/></div>
 )}
 </InputGroup>

 {/* Confirm password */}
 <InputGroup id="confirm_password" label="Confirm password" required error={errors.confirm_password}
 success={!errors.confirm_password && form.confirm_password && form.confirm_password === form.password ? 'Passwords match' : undefined}>
 <div className={inputWrap(errors.confirm_password)}>
 <IconSlot err={errors.confirm_password}><Lock size={15}/></IconSlot>
 <input
 id="confirm_password" type={showCpw?'text':'password'} autoComplete="new-password"
 value={form.confirm_password}
 onChange={e => setField('confirm_password', e.target.value)}
 onBlur={() => handleBlur('confirm_password')}
 className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
 placeholder="Re-enter your password"
 maxLength={72}
 aria-invalid={!!errors.confirm_password}
 />
 <button type="button" onClick={() => setShowCpw(s=>!s)}
 className="w-10 h-11 flex items-center justify-center flex-shrink-0 text-slate-400 hover:text-teal-600 border-l border-slate-100 transition-colors"
 aria-label={showCpw?'Hide password':'Show password'}>
 {showCpw ? <EyeOff size={15}/> : <Eye size={15}/>}
 </button>
 </div>
 </InputGroup>

 {/* Role */}
 <InputGroup id="role" label="I am registering as"
 hint="Healthcare professionals are registered by your organisation's administrator">
 <select id="role" value={form.role} onChange={e => setField('role', e.target.value)}
 className="w-full h-11 px-3 border-2 border-slate-200 rounded-xl text-sm text-slate-800 font-medium outline-none focus:border-slate-300 bg-slate-50 transition-all appearance-none cursor-pointer">
 <option value="patient">A patient</option>
 <option value="family">A family member (not a caregiver)</option>
 </select>
 </InputGroup>

 <button type="submit"
 className="w-full h-12 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white rounded-xl font-semibold text-sm transition-all shadow-sm mt-2 flex items-center justify-center gap-2">
 Continue <span aria-hidden="true">→</span>
 </button>

 <p className="text-center text-sm text-slate-500 pt-1">
 Already have an account?{' '}
 <Link to="/login" className="text-teal-600 font-semibold hover:underline">Sign in</Link>
 </p>
 </form>
 )}

 {/* ΓòÉΓòÉ STEP 2 ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
 {step === 2 && (
 <form onSubmit={handleSubmit} className="space-y-4">

 <div>
 <h2 className="text-base font-bold text-slate-900">Your care setting</h2>
 <p className="text-sm text-slate-500 mt-0.5 mb-4">
 How do you currently receive palliative care? This helps us personalise your dashboard and resources.
 </p>

 <div className="space-y-2.5">
 {CARE_SETTINGS.map(s => {
 const Icon = s.icon;
 const sel = form.care_setting === s.key;
 const a = s.accent;
 return (
 <button
 key={s.key} type="button"
 onClick={() => { setField('care_setting', s.key); setServerErr(''); }}
 className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
 sel
 ? `${a.border} ${a.bg} ring-2 ${a.ring}`
 : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-50'
 }`}
 >
 {/* Icon circle */}
 <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
 sel ? `${a.bg} border-2 ${a.border}` : 'bg-slate-100'
 }`}>
 <Icon size={18} className={sel ? a.text : 'text-slate-500'}/>
 </div>

 {/* Text */}
 <div className="flex-1 min-w-0">
 <p className={`font-semibold text-sm ${sel ? a.text : 'text-slate-800'}`}>{s.label}</p>
 <p className="text-xs text-slate-500 mt-0.5 leading-snug">{s.description}</p>
 </div>

 {/* Radio indicator */}
 <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
 sel ? `${a.border} bg-slate-50` : 'border-slate-300 bg-slate-50'
 }`}>
 {sel && <div className={`w-2.5 h-2.5 rounded-full ${a.dot}`}/>}
 </div>
 </button>
 );
 })}
 </div>
 </div>

 {/* Terms */}
 <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-teal-300 cursor-pointer transition-colors bg-slate-50/80">
 <input type="checkbox" checked={terms} onChange={e => { setTerms(e.target.checked); setServerErr(''); }}
 className="mt-0.5 w-4 h-4 flex-shrink-0 rounded accent-teal-600 cursor-pointer"/>
 <p className="text-xs text-slate-600 leading-relaxed">
 I agree to the{' '}
 <span className="text-teal-600 font-semibold">Terms of Service</span> and{' '}
 <span className="text-teal-600 font-semibold">Privacy Policy</span>, and consent to my health information being used for care coordination purposes.
 </p>
 </label>

 {/* Step 2 actions */}
 <div className="flex gap-3 pt-1">
 <button type="button" onClick={() => { setStep(1); setServerErr(''); }}
 className="flex-1 h-12 border-2 border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all">
 ← Back
 </button>
 <button type="submit"
 disabled={registerMutation.isPending || !terms || !form.care_setting}
 className="flex-[2] h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2">
 {registerMutation.isPending
 ? <><Loader2 size={15} className="animate-spin"/>Creating account…</>
 : 'Create account'}
 </button>
 </div>

 </form>
 )}

 </div>
 </div>

 <p className="text-center text-[10px] text-white/60 lg:text-slate-400 mt-3 drop-shadow-sm select-none">
 © {new Date().getFullYear()} Project Aura · Group 31 · All rights reserved
 </p>
 </motion.div>
 </div>
 </div>
 );
}
