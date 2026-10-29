/**
 * ProviderRegister — 5-step professional registration wizard
 * Public route: /provider-register
 * Uses the same InputGroup/inputWrap/IconSlot/VALIDATORS pattern as Register.jsx
 * Steps: Account -> Service Type -> Profile -> Assessment -> Documents & Submit
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ChevronLeft, ChevronRight, CheckCircle, AlertCircle,
  Upload, X, Plus, Loader2, Eye, EyeOff,
  Stethoscope, Activity, Heart, Brain, Users, Hand,
  FileText, User, Mail, Phone, Lock, Calendar, MapPin,
  Search, ChevronDown,
} from 'lucide-react';
import { servicesAPI } from '../api/client';
import { toast } from 'sonner';
import LoginSlideshow from '../components/LoginSlideshow';
import PasswordStrength from '../components/PasswordStrength';

/* ── Constants ──────────────────────────────────────────────────────────────── */
const ICON_MAP = { Stethoscope, Activity, Heart, Brain, Users, Hand, FileText };

const GHANA_REGIONS = [
  'Greater Accra','Ashanti','Western','Eastern','Central',
  'Northern','Upper East','Upper West','Volta','Brong-Ahafo',
  'Western North','Ahafo','Bono East','Oti','Savannah','North East',
];

const STEPS = ['Account','Service Type','Profile','Assessment','Documents'];

// Fallback service types shown if API is unavailable
const FALLBACK_TYPES = [
  { key:'nurse',          label:'Palliative Nurse',        description:'Clinical nursing care and symptom management at home', icon_name:'Stethoscope', color:'#0d9488', min_pass_score:70, assessment_questions:[], required_certifications:['RGN Certificate','NMC PIN'] },
  { key:'doctor',         label:'Palliative Physician',    description:'Medical assessment, prescribing, and care planning', icon_name:'Activity',    color:'#0891b2', min_pass_score:75, assessment_questions:[], required_certifications:['MBCHB','Medical Licence (GCMC)'] },
  { key:'physiotherapist',label:'Physiotherapist',         description:'Mobility, rehabilitation and breathing support', icon_name:'Heart',       color:'#059669', min_pass_score:70, assessment_questions:[], required_certifications:['BSc Physiotherapy','HCPC Registration'] },
  { key:'counsellor',     label:'Counsellor / Therapist',  description:'Psychological support and grief counselling', icon_name:'Brain',       color:'#7c3aed', min_pass_score:70, assessment_questions:[], required_certifications:['Counselling Diploma','BACP Accreditation'] },
  { key:'nanny',          label:'Specialist Nanny',        description:'Childcare for families caring for a palliative patient', icon_name:'Users',  color:'#d97706', min_pass_score:60, assessment_questions:[], required_certifications:['Childcare Certificate','First Aid','DBS Check'] },
  { key:'masseur',        label:'Therapeutic Masseur',     description:'Comfort massage for pain and relaxation', icon_name:'Hand',        color:'#ea580c', min_pass_score:60, assessment_questions:[], required_certifications:['Massage Certificate','Oncology/Palliative Training'] },
  { key:'social_worker',  label:'Social Worker',           description:'Practical, financial, and emotional support', icon_name:'Users',      color:'#db2777', min_pass_score:70, assessment_questions:[], required_certifications:['Social Work Degree','GSWC Licence'] },
  { key:'chaplain',       label:'Chaplain / Spiritual Care',description:'Interfaith spiritual support for patients and families', icon_name:'Heart', color:'#0369a1', min_pass_score:60, assessment_questions:[], required_certifications:['Theology Degree or Chaplaincy Certificate'] },
];

/* ── Background images for full-screen cycling ─────────────────────────────── */
const BG_IMAGES = [
  '/resources/slideshow/care-1.jpg',
  '/resources/slideshow/care-2.jpg',
  '/resources/slideshow/care-3.jpg',
  '/resources/slideshow/care-4.jpg',
  '/resources/slideshow/care-5.jpg',
  '/resources/slideshow/care-6.jpg',
  '/resources/slideshow/care-7.jpg',
  '/resources/slideshow/care-8.jpg',
  '/resources/slideshow/care-9.jpg',
  '/resources/slideshow/care-10.jpg',
];

const STEP_TITLES = [
  'Create your account',
  'Choose your service type',
  'Your professional profile',
  'Knowledge assessment',
  'Documents & declaration',
];

const STEP_SUBTITLES = [
  'Tell us about you — all information is kept secure and private',
  'Your assessment questions will be tailored to this specific role',
  'Your experience, qualifications, and location',
  'Scenario-based questions to assess your palliative care knowledge',
  'Upload credentials and agree to our provider code of conduct',
];

/* Countries list (same as Register.jsx) */
const COUNTRIES = [
  { code:'GH', name:'Ghana',          dial:'+233', flag:'\uD83C\uDDEC\uD83C\uDDED', max:9  },
  { code:'NG', name:'Nigeria',         dial:'+234', flag:'\uD83C\uDDF3\uD83C\uDDEC', max:10 },
  { code:'ZA', name:'South Africa',    dial:'+27',  flag:'\uD83C\uDDFF\uD83C\uDDE6', max:9  },
  { code:'KE', name:'Kenya',           dial:'+254', flag:'\uD83C\uDDF0\uD83C\uDDEA', max:9  },
  { code:'GB', name:'United Kingdom',  dial:'+44',  flag:'\uD83C\uDDEC\uD83C\uDDE7', max:10 },
  { code:'US', name:'United States',   dial:'+1',   flag:'\uD83C\uDDFA\uD83C\uDDF8', max:10 },
  { code:'CA', name:'Canada',          dial:'+1',   flag:'\uD83C\uDDE8\uD83C\uDDE6', max:10 },
  { code:'AU', name:'Australia',       dial:'+61',  flag:'\uD83C\uDDE6\uD83C\uDDFA', max:9  },
  { code:'ET', name:'Ethiopia',        dial:'+251', flag:'\uD83C\uDDEA\uD83C\uDDF9', max:9  },
  { code:'TZ', name:'Tanzania',        dial:'+255', flag:'\uD83C\uDDF9\uD83C\uDDFF', max:9  },
  { code:'UG', name:'Uganda',          dial:'+256', flag:'\uD83C\uDDFA\uD83C\uDDEC', max:9  },
  { code:'CM', name:'Cameroon',        dial:'+237', flag:'\uD83C\uDDE8\uD83C\uDDF2', max:9  },
  { code:'SN', name:'Senegal',         dial:'+221', flag:'\uD83C\uDDF8\uD83C\uDDF3', max:9  },
  { code:'RW', name:'Rwanda',          dial:'+250', flag:'\uD83C\uDDF7\uD83C\uDDFC', max:9  },
  { code:'DE', name:'Germany',         dial:'+49',  flag:'\uD83C\uDDE9\uD83C\uDDEA', max:11 },
  { code:'FR', name:'France',          dial:'+33',  flag:'\uD83C\uDDEB\uD83C\uDDF7', max:9  },
  { code:'IN', name:'India',           dial:'+91',  flag:'\uD83C\uDDEE\uD83C\uDDF3', max:10 },
  { code:'SA', name:'Saudi Arabia',    dial:'+966', flag:'\uD83C\uDDF8\uD83C\uDDE6', max:9  },
  { code:'AE', name:'UAE',             dial:'+971', flag:'\uD83C\uDDE6\uD83C\uDDEA', max:9  },
];

/* CountrySelector (same pattern as Register.jsx) */
function CountrySelector({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const list = (() => {
    const base = [COUNTRIES[0], ...COUNTRIES.slice(1).sort((a,b) => a.name.localeCompare(b.name))];
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(c => c.name.toLowerCase().includes(q) || c.dial.includes(q));
  })();

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setQuery(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 40); }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = e => { if (e.key === 'Escape') { setOpen(false); setQuery(''); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open]);

  return (
    <div className="relative flex-shrink-0" ref={wrapRef}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-11 px-3 border-2 border-slate-200 rounded-xl bg-white hover:border-teal-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
        aria-label={`Phone country: ${selected.name} ${selected.dial}`}>
        <span className="text-lg leading-none">{selected.flag}</span>
        <span className="text-sm font-semibold text-slate-700 font-mono tracking-tight">{selected.dial}</span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:-6, scale:0.97 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:-6, scale:0.97 }}
            transition={{ duration:0.15 }}
            className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[200] overflow-hidden">
            <div className="p-2.5 border-b border-slate-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search country..."
                  className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-400 bg-white text-slate-800"
                  autoComplete="off"/>
                {query && (
                  <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5">
                    <X size={12}/>
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto overscroll-contain">
              {list.length === 0
                ? <p className="text-center text-sm text-slate-400 py-6">No results</p>
                : list.map(c => (
                  <button key={c.code} type="button"
                    onClick={() => { onChange(c); setOpen(false); setQuery(''); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-0 ${
                      c.code === selected.code ? 'bg-teal-50/60' : ''
                    }`}>
                    <span className="text-xl leading-none w-7 text-center flex-shrink-0">{c.flag}</span>
                    <span className={`flex-1 truncate font-medium ${c.code === selected.code ? 'text-teal-700' : 'text-slate-700'}`}>{c.name}</span>
                    <span className="font-mono text-xs text-slate-400 flex-shrink-0">{c.dial}</span>
                    {c.code === selected.code && <CheckCircle size={14} className="text-teal-500 flex-shrink-0"/>}
                  </button>
                ))
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Validators (same rules as Register.jsx) */
const VALIDATORS = {
  full_name: v => {
    if (!v?.trim()) return 'Please enter your full name';
    if (v.trim().length < 2) return 'Name must be at least 2 characters';
    if (/\d/.test(v)) return 'Name should not contain numbers';
    return null;
  },
  username: v => {
    if (!v?.trim()) return 'Please choose a username';
    if (v.length < 3) return 'Username must be at least 3 characters';
    if (v.length > 50) return 'Username is too long (max 50 characters)';
    if (!/^[a-z0-9_]+$/.test(v)) return 'Use lowercase letters, numbers or underscores only';
    return null;
  },
  email: v => {
    if (!v?.trim()) return 'Please enter your email address';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Please enter a valid email address';
    return null;
  },
  password: v => {
    if (!v) return 'Please create a password';
    if (v.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(v)) return 'Include at least one uppercase letter (A-Z)';
    if (!/[0-9]/.test(v)) return 'Include at least one number (0-9)';
    return null;
  },
  confirm_password: (v, pw) => {
    if (!v) return 'Please confirm your password';
    if (v !== pw) return 'Passwords do not match';
    return null;
  },
};

/* ── Reusable form components (matches Register.jsx quality) ────────────────── */
function InputGroup({ id, label, required, error, success, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 leading-none">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error ? (
          <motion.p key="err" role="alert"
            initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
            <AlertCircle size={12} className="flex-shrink-0"/>{error}
          </motion.p>
        ) : success ? (
          <motion.p key="ok"
            initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
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

const inputBorder = err =>
  err
    ? 'border-red-400 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-500/15'
    : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/15';

const inputWrap = err =>
  `flex items-center border-2 rounded-xl overflow-hidden bg-white transition-all ${inputBorder(err)}`;

function IconSlot({ err, children }) {
  return (
    <span className={`flex items-center justify-center w-10 h-11 flex-shrink-0 border-r transition-colors ${
      err ? 'border-red-200 bg-red-50/60 text-red-400' : 'border-slate-100 bg-slate-50 text-slate-400'
    }`}>{children}</span>
  );
}

/* ── Step 1: Account ─────────────────────────────────────────────────────────── */
function StepAccount({ form, set, errors, touched, onBlur }) {
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [country, setCountry] = useState(COUNTRIES[0]);

  const handlePhone = raw => {
    const digits = raw.replace(/\D/g, '').slice(0, country.max);
    set('phone', digits);
  };

  return (
    <div className="space-y-4">
      {/* Full name */}
      <InputGroup id="full_name" label="Full name" required error={errors.full_name}
        hint={!errors.full_name && !touched.full_name ? 'Use your name as it appears on official documents' : undefined}>
        <div className={inputWrap(errors.full_name)}>
          <IconSlot err={errors.full_name}><User size={15}/></IconSlot>
          <input id="full_name" type="text" autoComplete="name"
            value={form.full_name}
            onChange={e => set('full_name', e.target.value.replace(/\d/g,''))}
            onBlur={() => onBlur('full_name')}
            className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
            placeholder="e.g., Dr. Abena Mensah"
            maxLength={100} spellCheck={false} aria-invalid={!!errors.full_name} />
        </div>
      </InputGroup>

      {/* Username */}
      <InputGroup id="username" label="Username" required error={errors.username}
        success={!errors.username && form.username.length >= 3 && touched.username ? 'Username looks good' : undefined}
        hint={!errors.username && !touched.username ? 'Lowercase letters, numbers and underscores only' : undefined}>
        <div className={inputWrap(errors.username)}>
          <IconSlot err={errors.username}><span className="text-xs font-bold">@</span></IconSlot>
          <input id="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false}
            value={form.username}
            onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))}
            onBlur={() => onBlur('username')}
            className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
            placeholder="e.g., abena_mensah"
            maxLength={50} aria-invalid={!!errors.username} />
        </div>
      </InputGroup>

      {/* Email */}
      <InputGroup id="email" label="Email address" required error={errors.email}>
        <div className={inputWrap(errors.email)}>
          <IconSlot err={errors.email}><Mail size={15}/></IconSlot>
          <input id="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} inputMode="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            onBlur={() => onBlur('email')}
            className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
            placeholder="your@email.com"
            maxLength={100} aria-invalid={!!errors.email} />
        </div>
      </InputGroup>

      {/* Phone with country selector */}
      <InputGroup id="phone" label="Phone number" error={errors.phone}
        hint={!errors.phone ? 'Optional - select your country then enter your number' : undefined}>
        <div className="flex gap-2">
          <CountrySelector selected={country} onChange={c => { setCountry(c); set('phone', ''); }}/>
          <div className={`flex-1 flex items-center border-2 rounded-xl overflow-hidden bg-white transition-all ${inputBorder(errors.phone)}`}>
            <IconSlot err={errors.phone}><Phone size={14}/></IconSlot>
            <input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national"
              value={form.phone}
              onChange={e => handlePhone(e.target.value)}
              onBlur={() => onBlur('phone')}
              className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent font-mono placeholder:text-slate-400 placeholder:font-sans"
              placeholder={`${country.max} digit number`}
              maxLength={country.max}
              pattern="[0-9]*"/>
          </div>
        </div>
      </InputGroup>

      {/* Password */}
      <InputGroup id="password" label="Password" required error={errors.password}
        hint={!errors.password && !touched.password ? 'At least 8 characters, one uppercase letter and one number' : undefined}>
        <div className={inputWrap(errors.password)}>
          <IconSlot err={errors.password}><Lock size={15}/></IconSlot>
          <input id="password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            onBlur={() => onBlur('password')}
            className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
            placeholder="Create a secure password"
            maxLength={72} aria-invalid={!!errors.password} />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="w-10 h-11 flex items-center justify-center text-slate-400 hover:text-teal-600 border-l border-slate-100 transition-colors">
            {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
          </button>
        </div>
        {form.password.length > 0 && <div className="mt-2"><PasswordStrength password={form.password}/></div>}
      </InputGroup>

      {/* Confirm password */}
      <InputGroup id="confirm_password" label="Confirm password" required error={errors.confirm_password}
        success={!errors.confirm_password && form.confirm_password && form.confirm_password === form.password ? 'Passwords match' : undefined}>
        <div className={inputWrap(errors.confirm_password)}>
          <IconSlot err={errors.confirm_password}><Lock size={15}/></IconSlot>
          <input id="confirm_password" type={showCpw ? 'text' : 'password'} autoComplete="new-password"
            value={form.confirm_password}
            onChange={e => set('confirm_password', e.target.value)}
            onBlur={() => onBlur('confirm_password')}
            className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
            placeholder="Re-enter your password"
            maxLength={72} aria-invalid={!!errors.confirm_password} />
          <button type="button" onClick={() => setShowCpw(v => !v)}
            className="w-10 h-11 flex items-center justify-center text-slate-400 hover:text-teal-600 border-l border-slate-100 transition-colors">
            {showCpw ? <EyeOff size={15}/> : <Eye size={15}/>}
          </button>
        </div>
      </InputGroup>

      {/* Gender - compact dropdown */}
      <InputGroup id="gender" label="Gender" hint="Optional">
        <div className={inputWrap(false)}>
          <IconSlot err={false}><span className="text-[10px] font-bold text-slate-400">Sex</span></IconSlot>
          <select id="gender" value={form.gender} onChange={e => set('gender', e.target.value)}
            className="flex-1 h-11 px-3 text-sm text-slate-700 outline-none bg-transparent appearance-none cursor-pointer">
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other / Non-binary</option>
          </select>
          <span className="w-10 h-11 flex items-center justify-center text-slate-400 border-l border-slate-100 flex-shrink-0 pointer-events-none">
            <ChevronDown size={14}/>
          </span>
        </div>
      </InputGroup>

      {/* Date of birth */}
      <InputGroup id="dob" label="Date of birth" hint="Optional - must be at least 18 years old to register">
        <div className={inputWrap(false)}>
          <IconSlot err={false}><Calendar size={14}/></IconSlot>
          <input id="dob" type="date"
            value={form.date_of_birth}
            onChange={e => set('date_of_birth', e.target.value)}
            max={new Date(Date.now() - 18*365.25*24*3600000).toISOString().split('T')[0]}
            min={new Date(Date.now() - 80*365.25*24*3600000).toISOString().split('T')[0]}
            className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent" />
        </div>
      </InputGroup>

      {/* Location */}
      <div className="grid grid-cols-2 gap-3">
        <InputGroup id="location" label="City / District" hint="Optional">
          <div className={inputWrap(false)}>
            <IconSlot err={false}><MapPin size={14}/></IconSlot>
            <input id="location" type="text"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
              placeholder="Accra, Greater Accra"
              maxLength={100} />
          </div>
        </InputGroup>
        <InputGroup id="address" label="Home address" hint="Optional">
          <div className={inputWrap(false)}>
            <IconSlot err={false}><FileText size={14}/></IconSlot>
            <input id="address" type="text"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
              placeholder="Street, Area, City"
              maxLength={200} />
          </div>
        </InputGroup>
      </div>
    </div>
  );
}

/* ── Step 2: Service Type ────────────────────────────────────────────────────── */
function StepServiceType({ form, set, types }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Choose your primary service type. Your knowledge assessment will be tailored to this role.
      </p>
      {types.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-3 text-slate-400">
          <Loader2 size={22} className="animate-spin text-teal-400"/>
          <p className="text-sm">Loading service types...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {types.map(t => {
            const Icon = ICON_MAP[t.icon_name] || Heart;
            const sel = form.service_type === t.key;
            return (
              <button key={t.key} type="button" onClick={() => set('service_type', t.key)}
                className="text-left p-4 rounded-xl border-2 transition-all"
                style={{
                  borderColor: sel ? t.color : '#e2e8f0',
                  background: sel ? `${t.color}10` : 'white',
                  boxShadow: sel ? `0 0 0 1px ${t.color}30` : undefined,
                }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${t.color}20`, color: t.color }}>
                    <Icon size={16}/>
                  </div>
                  {sel && <CheckCircle size={14} style={{ color: t.color }} className="ml-auto"/>}
                </div>
                <p className="font-bold text-sm text-slate-900 leading-tight">{t.label}</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{t.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Min pass: {t.min_pass_score}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Step 3: Professional Profile ───────────────────────────────────────────── */
function StepProfile({ form, set, errors, onBlur, selectedType }) {
  const isClinic = ['nurse','doctor','physiotherapist'].includes(form.service_type);
  const [quals, setQuals] = useState(form.qualifications?.length ? form.qualifications : [{ title:'', institution:'', year:'' }]);

  const updateQual = (i, k, v) => {
    const next = quals.map((q, idx) => idx === i ? { ...q, [k]: v } : q);
    setQuals(next);
    set('qualifications', next);
  };
  const addQual = () => {
    const next = [...quals, { title:'', institution:'', year:'' }];
    setQuals(next);
    set('qualifications', next);
  };
  const removeQual = i => {
    const next = quals.filter((_, idx) => idx !== i);
    setQuals(next);
    set('qualifications', next);
  };

  return (
    <div className="space-y-4">
      {/* Bio */}
      <InputGroup id="bio" label="Professional bio" required error={errors.bio}
        hint={!errors.bio ? 'Describe your experience and approach to palliative care (20-500 characters)' : undefined}>
        <div className="relative">
          <textarea id="bio"
            value={form.bio}
            onChange={e => set('bio', e.target.value)}
            onBlur={() => onBlur('bio')}
            rows={3} maxLength={500}
            placeholder="I am a registered palliative nurse with 5 years experience in home-based care..."
            className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none resize-none transition-all ${inputBorder(errors.bio)}`}
          />
          <span className="absolute bottom-2 right-3 text-[10px] text-slate-400">{(form.bio||'').length}/500</span>
        </div>
      </InputGroup>

      {/* Years + Region */}
      <div className="grid grid-cols-2 gap-3">
        <InputGroup id="years" label="Years of experience" required error={errors.years_experience}>
          <div className={inputWrap(errors.years_experience)}>
            <IconSlot err={errors.years_experience}><span className="text-xs font-bold text-slate-400">yr</span></IconSlot>
            <input id="years" type="number" min="0" max="50"
              value={form.years_experience}
              onChange={e => set('years_experience', Math.min(50, Math.max(0, parseInt(e.target.value)||0)))}
              onBlur={() => onBlur('years_experience')}
              className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent"
              placeholder="5" />
          </div>
        </InputGroup>

        <InputGroup id="region" label="Region" required error={errors.region}>
          <select id="region" value={form.region} onChange={e => set('region', e.target.value)}
            onBlur={() => onBlur('region')}
            className={`w-full h-11 px-3 border-2 rounded-xl text-sm text-slate-800 outline-none bg-white transition-all ${inputBorder(errors.region)}`}>
            <option value="">Select region</option>
            {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </InputGroup>
      </div>

      {/* Facility + Specialisation */}
      <div className="grid grid-cols-2 gap-3">
        <InputGroup id="facility" label="Facility / Organisation" hint="Optional">
          <div className={inputWrap(false)}>
            <IconSlot err={false}><FileText size={14}/></IconSlot>
            <input id="facility" type="text"
              value={form.facility_name}
              onChange={e => set('facility_name', e.target.value)}
              className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
              placeholder="Korle Bu Teaching Hospital"
              maxLength={200} />
          </div>
        </InputGroup>

        <InputGroup id="spec" label="Sub-specialisation" hint="Optional">
          <div className={inputWrap(false)}>
            <IconSlot err={false}><FileText size={14}/></IconSlot>
            <input id="spec" type="text"
              value={form.specialisation}
              onChange={e => set('specialisation', e.target.value)}
              className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
              placeholder="Oncology, Paediatrics..."
              maxLength={100} />
          </div>
        </InputGroup>
      </div>

      {/* NMC/Licence (clinical roles only) */}
      {isClinic && (
        <InputGroup id="licence" label="Licence / NMC PIN" required error={errors.license_number}
          hint="Your professional registration number">
          <div className={inputWrap(errors.license_number)}>
            <IconSlot err={errors.license_number}><span className="text-[10px] font-bold">ID</span></IconSlot>
            <input id="licence" type="text"
              value={form.license_number}
              onChange={e => set('license_number', e.target.value)}
              onBlur={() => onBlur('license_number')}
              className="flex-1 h-11 px-3 text-sm text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
              placeholder="NMC/GCMC registration number"
              maxLength={50} />
          </div>
        </InputGroup>
      )}

      {/* Qualifications */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-slate-700">Qualifications</label>
          {quals.length < 5 && (
            <button type="button" onClick={addQual}
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-semibold">
              <Plus size={13}/> Add
            </button>
          )}
        </div>
        <div className="space-y-2">
          {quals.map((q, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <input value={q.title} onChange={e => updateQual(i,'title',e.target.value)}
                placeholder="e.g. RGN"
                maxLength={100}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
              <input value={q.institution} onChange={e => updateQual(i,'institution',e.target.value)}
                placeholder="Institution"
                maxLength={100}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
              <div className="flex gap-1">
                <input value={q.year} onChange={e => updateQual(i,'year',e.target.value)}
                  placeholder="Year" type="number" min="1950" max="2030"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
                {quals.length > 1 && (
                  <button type="button" onClick={() => removeQual(i)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                    <X size={13}/>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-1">Add your degrees, certificates, and professional qualifications</p>
      </div>
    </div>
  );
}

/* ── Step 4: Knowledge Assessment ───────────────────────────────────────────── */
function StepAssessment({ form, set, questions, serviceColor }) {
  const [current, setCurrent] = useState(0);
  const answers = form.assessment_answers || {};

  const selectAnswer = (qid, optIdx) => {
    const next = { ...answers, [String(qid)]: optIdx };
    set('assessment_answers', next);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-10 space-y-3">
        <CheckCircle size={40} className="text-teal-500 mx-auto"/>
        <p className="font-semibold text-slate-800">No assessment required for this service type.</p>
        <p className="text-sm text-slate-500">You can proceed to the next step.</p>
      </div>
    );
  }

  const q = questions[current];
  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / questions.length) * 100);

  const previewScore = () => {
    let earned = 0, maxS = 0;
    questions.forEach(qq => {
      const opts = qq.options || [];
      const maxQ = Math.max(...opts.map(o => o.score || 0), 0);
      maxS += maxQ;
      const sel = answers[String(qq.id)];
      if (sel !== undefined) {
        try { earned += opts[parseInt(sel)].score || 0; } catch {}
      }
    });
    return maxS > 0 ? Math.round(earned / maxS * 100) : 0;
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Question {current + 1} of {questions.length}</span>
          <span>{answered} answered - Preview: {previewScore()}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: serviceColor || '#0d9488' }}/>
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }}
          exit={{ opacity:0, x:-10 }} transition={{ duration:0.15 }}
          className="space-y-3">
          {q.scenario_context && (
            <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 italic">
              Scenario: {q.scenario_context}
            </div>
          )}
          <p className="font-semibold text-slate-800 text-sm leading-relaxed">{q.question}</p>
          <div className="space-y-2">
            {(q.options||[]).map((opt, oi) => {
              const sel = answers[String(q.id)] === oi;
              return (
                <button key={oi} type="button" onClick={() => selectAnswer(q.id, oi)}
                  className="w-full text-left p-3 rounded-xl border-2 text-sm transition-all"
                  style={{
                    borderColor: sel ? (serviceColor||'#0d9488') : '#e2e8f0',
                    background: sel ? `${serviceColor||'#0d9488'}10` : 'white',
                    color: 'var(--text-800)',
                  }}>
                  <span className="font-semibold mr-2" style={{ color: serviceColor||'#0d9488' }}>
                    {String.fromCharCode(65+oi)}.
                  </span>
                  {opt.text}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Question nav */}
      <div className="flex items-center justify-between pt-1">
        <button type="button" onClick={() => setCurrent(c => Math.max(0,c-1))} disabled={current===0}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-30 font-semibold">
          <ChevronLeft size={14}/> Prev
        </button>
        <div className="flex gap-1">
          {questions.map((_,i) => (
            <button key={i} type="button" onClick={() => setCurrent(i)}
              className="h-2 rounded-full transition-all"
              style={{
                background: answers[String(questions[i].id)] !== undefined
                  ? (serviceColor||'#0d9488')
                  : i===current ? '#94a3b8' : '#e2e8f0',
                width: i===current ? 16 : 8,
              }}/>
          ))}
        </div>
        <button type="button" onClick={() => setCurrent(c => Math.min(questions.length-1,c+1))}
          disabled={current===questions.length-1}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-30 font-semibold">
          Next <ChevronRight size={14}/>
        </button>
      </div>
    </div>
  );
}

/* ── Step 5: Documents & Submit ─────────────────────────────────────────────── */
function StepDocuments({ form, set }) {
  const fileRef = useRef();
  const [docs, setDocs] = useState(form.document_names || []);
  const [terms, setTerms] = useState(form.terms || false);

  const handleFiles = e => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.size <= 5*1024*1024);
    if (valid.length < files.length) toast.error('Some files exceed 5MB and were skipped');
    const names = valid.map(f => f.name);
    const next = [...docs, ...names].slice(0,5);
    setDocs(next);
    set('document_names', next);
    e.target.value = '';
  };

  const removeDoc = i => {
    const next = docs.filter((_,idx) => idx !== i);
    setDocs(next);
    set('document_names', next);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Upload your licence, certificates, and credentials. Maximum 5 files, 5MB each.
        Accepted: PDF, JPEG, PNG.
      </p>

      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-teal-300 rounded-xl p-6 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50/30 transition-all">
        <Upload size={28} className="text-teal-400 mx-auto mb-2"/>
        <p className="font-semibold text-sm text-slate-700">Click to upload documents</p>
        <p className="text-xs text-slate-400 mt-1">NMC licence, degree certificate, DBS/police clearance</p>
        <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
          className="hidden" onChange={handleFiles}/>
      </div>

      {docs.length > 0 && (
        <div className="space-y-1.5">
          {docs.map((name,i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg border border-teal-100">
              <FileText size={14} className="text-teal-600 flex-shrink-0"/>
              <span className="text-xs text-slate-700 flex-1 truncate">{name}</span>
              <button type="button" onClick={() => removeDoc(i)}
                className="text-slate-400 hover:text-red-500 transition-colors">
                <X size={13}/>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
        <strong>Note:</strong> In this demo, file names are recorded. In production, files would be securely encrypted and stored.
      </div>

      <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-teal-300 cursor-pointer transition-colors bg-white">
        <input type="checkbox" checked={terms}
          onChange={e => { setTerms(e.target.checked); set('terms', e.target.checked); }}
          className="mt-0.5 w-4 h-4 rounded accent-teal-600"/>
        <p className="text-xs text-slate-600 leading-relaxed">
          I declare that all information provided is accurate and truthful. I agree to the{' '}
          <span className="text-teal-600 font-semibold">Terms of Service</span>,{' '}
          <span className="text-teal-600 font-semibold">Privacy Policy</span>, and the
          Project Aura Provider Code of Conduct. I consent to background verification checks.
        </p>
      </label>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────────── */
const EMPTY = {
  full_name:'', username:'', email:'', password:'', confirm_password:'',
  phone:'', gender:'', date_of_birth:'', address:'', location:'',
  service_type:'',
  bio:'', years_experience:0, qualifications:[{ title:'', institution:'', year:'' }],
  license_number:'', specialisation:'', facility_name:'', region:'',
  assessment_answers:{},
  document_names:[], terms:false,
};

const PROF_VALIDATORS = {
  bio: v => {
    if (!v?.trim()) return 'Please write a short professional bio';
    if (v.trim().length < 20) return 'Bio must be at least 20 characters';
    return null;
  },
  years_experience: v => {
    if (v === undefined || v === null || v === '') return 'Please enter your years of experience';
    if (Number(v) < 0 || Number(v) > 50) return 'Enter a value between 0 and 50';
    return null;
  },
  region: v => (!v ? 'Please select your region' : null),
  license_number: v => (!v?.trim() ? 'Licence/NMC PIN is required for clinical roles' : null),
};

export default function ProviderRegister() {
  const navigate = useNavigate();
  const [step, setStep]         = useState(0);
  const [form, setForm]         = useState(EMPTY);
  const [errors, setErrors]     = useState({});
  const [touched, setTouched]   = useState({});
  const [serverErr, setServerErr] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [bgIdx, setBgIdx]       = useState(0);

  // Cycle background every 6s
  useEffect(() => {
    const t = setInterval(() => setBgIdx(i => (i+1) % BG_IMAGES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const set = useCallback((k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setServerErr('');
    // Live re-validate if already touched
    if (touched[k]) {
      const validator = VALIDATORS[k] || PROF_VALIDATORS[k];
      if (validator) {
        const err = k === 'confirm_password'
          ? VALIDATORS.confirm_password(v, form.password)
          : validator(v);
        setErrors(e => ({ ...e, [k]: err || undefined }));
      }
    }
    // Keep passwords in sync
    if (k === 'password' && touched.confirm_password) {
      const err = VALIDATORS.confirm_password(form.confirm_password, v);
      setErrors(e => ({ ...e, confirm_password: err || undefined }));
    }
  }, [touched, form.password, form.confirm_password]);

  const onBlur = useCallback((field) => {
    setTouched(p => ({ ...p, [field]: true }));
    const val = field === 'confirm_password' ? form.confirm_password : form[field] ?? '';
    const validator = VALIDATORS[field] || PROF_VALIDATORS[field];
    if (!validator) return;
    const err = field === 'confirm_password'
      ? VALIDATORS.confirm_password(val, form.password)
      : validator(val);
    setErrors(e => ({ ...e, [field]: err || undefined }));
  }, [form]);

  // Fetch service types from API, fall back to local if API unavailable
  const { data: typesData, isLoading: loadingTypes } = useQuery({
    queryKey: ['service-types-public'],
    queryFn: () => servicesAPI.getTypes().then(r => r.data),
    retry: 1,
    staleTime: 10 * 60 * 1000,
  });
  const types = (typesData && typesData.length > 0) ? typesData : FALLBACK_TYPES;
  const selectedType = types.find(t => t.key === form.service_type);
  const questions = selectedType?.assessment_questions || [];
  const isClinic = ['nurse','doctor','physiotherapist'].includes(form.service_type);

  const submitMutation = useMutation({
    mutationFn: data => servicesAPI.apply(data),
    onSuccess: res => setSubmitted(res.data),
    onError: err => setServerErr(err?.response?.data?.detail || 'Submission failed. Please try again.'),
  });

  // Validate step 0 (Account)
  const validateStep0 = () => {
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
    setErrors(e => ({ ...e, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Validate step 2 (Profile)
  const validateStep2 = () => {
    const toCheck = ['bio','years_experience','region'];
    if (isClinic) toCheck.push('license_number');
    const newTouched = toCheck.reduce((a,f) => ({ ...a, [f]: true }), {});
    setTouched(p => ({ ...p, ...newTouched }));
    const newErrors = {};
    toCheck.forEach(f => {
      const err = PROF_VALIDATORS[f]?.(form[f]);
      if (err) newErrors[f] = err;
    });
    setErrors(e => ({ ...e, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const canNext = () => {
    if (step === 0) return true; // validate on submit
    if (step === 1) return !!form.service_type;
    if (step === 2) return true; // validate on submit
    if (step === 3) return true; // assessment optional
    return form.terms;
  };

  const handleNext = () => {
    setServerErr('');
    if (step === 0 && !validateStep0()) return;
    if (step === 2 && !validateStep2()) return;
    if (step < 4) {
      setStep(s => s + 1);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      full_name: form.full_name.trim(),
      phone: form.phone || undefined,
      gender: form.gender || undefined,
      date_of_birth: form.date_of_birth || undefined,
      address: form.address || undefined,
      location: form.location || undefined,
      service_type: form.service_type,
      bio: form.bio,
      years_experience: Number(form.years_experience),
      qualifications: form.qualifications.filter(q => q.title.trim()),
      license_number: form.license_number || undefined,
      specialisation: form.specialisation || undefined,
      facility_name: form.facility_name || undefined,
      region: form.region || undefined,
      assessment_answers: form.assessment_answers,
    };
    submitMutation.mutate(payload);
  };

  // Success screen
  if (submitted) {
    const passed = submitted.passed;
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        {/* Background */}
        <div className="fixed inset-0 z-0">
          <img src={BG_IMAGES[bgIdx]} alt="" aria-hidden="true"
            className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-teal-950/70"/>
        </div>
        <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
          transition={{ duration:0.4 }}
          className="relative z-10 bg-white/95 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border border-white/30">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${passed?'bg-teal-100':'bg-amber-100'}`}>
            {passed
              ? <CheckCircle size={44} className="text-teal-600"/>
              : <AlertCircle size={44} className="text-amber-500"/>
            }
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
          <p className="text-slate-600 text-sm mb-5 leading-relaxed">
            Your application as a <strong>{selectedType?.label}</strong> has been received.
            Our team reviews all applications within <strong>2 business days</strong>.
            You will receive a notification on your registered email once approved.
          </p>
          <div className={`rounded-xl p-5 mb-5 ${passed?'bg-teal-50 border-2 border-teal-200':'bg-amber-50 border-2 border-amber-200'}`}>
            <p className="text-3xl font-black tabular-nums" style={{ color: passed?'#0d9488':'#d97706' }}>
              {submitted.assessment_score}%
            </p>
            <p className="text-sm font-semibold mt-1" style={{ color: passed?'#0d9488':'#d97706' }}>
              Knowledge Assessment {passed ? '- PASS' : `- minimum ${submitted.min_pass_score}% required`}
            </p>
            {!passed && (
              <p className="text-xs text-amber-700 mt-2">
                Your score is below the minimum, but our admin team will still review your full application including documents and experience.
              </p>
            )}
          </div>
          <button onClick={() => navigate('/login')}
            className="w-full py-3 rounded-xl text-sm font-bold text-white shadow-md active:scale-[0.98] transition-all"
            style={{ background:'#0d9488' }}>
            Go to Login
          </button>
          <p className="text-xs text-slate-400 mt-3">
            Questions? Contact us at <span className="text-teal-600 font-semibold">support@projectaura.health</span>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-y-auto">

      {/* Full-screen cycling background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AnimatePresence initial={false}>
          <motion.img
            key={bgIdx}
            src={BG_IMAGES[bgIdx]}
            alt="" aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ zIndex:1 }}
            initial={{ opacity:0, scale:1.04 }}
            animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0 }}
            transition={{ duration:1.2, ease:'easeInOut' }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-teal-950/65" style={{ zIndex:2 }}/>
      </div>

      {/* Centered card */}
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.4 }}
        className="relative z-10 w-full max-w-2xl my-6">

        {/* Header badge */}
        <div className="flex items-center justify-center mb-4">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
            <img src="/logo.png" alt="Project Aura" className="w-5 h-5 rounded-md"/>
            <span className="text-xs font-bold tracking-wide" style={{ color: '#ffffff' }}>Project Aura</span>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>|</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#D4A017' }}>Provider Registration</span>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-5">
          {STEPS.map((s, i) => (
            <div key={s} className="rounded-full transition-all duration-300 flex items-center justify-center"
              title={s}
              style={{
                height: 8,
                width: i === step ? 32 : 8,
                background: i < step ? '#2dd4bf' : i === step ? (selectedType?.color || '#0d9488') : 'rgba(255,255,255,0.2)',
              }}/>
          ))}
        </div>

        {/* Step label */}
        <div className="text-center mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Step {step+1} of {STEPS.length}
          </p>
          <h2 className="text-2xl font-bold mt-0.5" style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            {STEP_TITLES[step]}
          </h2>
          <p className="text-sm mt-1 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            {STEP_SUBTITLES[step]}
          </p>
        </div>

        {/* Glass card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="h-1.5 transition-all duration-500"
            style={{ background: selectedType?.color || '#0d9488' }}/>

          {/* Server error */}
          <AnimatePresence>
            {serverErr && (
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5" role="alert">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0"/>
                <div className="flex-1">
                  <p className="text-sm text-red-700 font-medium">{serverErr}</p>
                  <button onClick={() => setServerErr('')} className="text-xs text-red-500 hover:text-red-700 font-semibold mt-0.5">Dismiss</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step content */}
          <div className="px-7 py-6">
            <AnimatePresence mode="wait">
              <motion.div key={step}
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-20 }} transition={{ duration:0.2 }}>
                {step === 0 && <StepAccount form={form} set={set} errors={errors} touched={touched} onBlur={onBlur}/>}
                {step === 1 && <StepServiceType form={form} set={set} types={types}/>}
                {step === 2 && <StepProfile form={form} set={set} errors={errors} onBlur={onBlur} selectedType={selectedType}/>}
                {step === 3 && <StepAssessment form={form} set={set} questions={questions} serviceColor={selectedType?.color}/>}
                {step === 4 && <StepDocuments form={form} set={set}/>}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer nav */}
          <div className="px-7 pb-6 pt-2 flex gap-3 border-t border-slate-100">
            {step > 0 && (
              <button onClick={() => { setStep(s => s-1); setServerErr(''); }}
                className="flex items-center gap-1.5 px-5 py-3 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:border-teal-400 hover:text-teal-700 transition-all">
                <ChevronLeft size={15}/> Back
              </button>
            )}
            <button onClick={handleNext}
              disabled={!canNext() || submitMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all active:scale-[0.98] shadow-md"
              style={{ background: selectedType?.color || '#0d9488' }}>
              {submitMutation.isPending
                ? <><Loader2 size={15} className="animate-spin"/> Submitting...</>
                : step === 4
                  ? <><CheckCircle size={15}/> Submit Application</>
                  : <>Continue <ChevronRight size={15}/></>
              }
            </button>
          </div>
        </div>

        {/* Bottom links */}
        <div className="text-center mt-5 flex items-center justify-center gap-4 flex-wrap">
          <Link to="/login"
            className="font-bold text-sm transition-all hover:opacity-80"
            style={{ color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            Sign in
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>|</span>
          <Link to="/get-started"
            className="font-bold text-sm transition-all hover:opacity-80"
            style={{ color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            Patient / family
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>|</span>
          <Link to="/register?role=caregiver"
            className="font-bold text-sm transition-all hover:opacity-80"
            style={{ color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            Caregiver
          </Link>
        </div>
      </motion.div>
    </div>
  );
}