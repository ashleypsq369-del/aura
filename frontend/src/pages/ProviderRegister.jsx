/**
 * ProviderRegister — 5-step professional registration wizard
 * Public route: /provider-register
 * Steps: Account → Service Type → Profile → Assessment → Documents & Submit
 */
import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ChevronLeft, ChevronRight, CheckCircle, AlertCircle,
  Upload, X, Plus, Loader2, Eye, EyeOff, Star,
  Stethoscope, Activity, Heart, Brain, Users, Hand,
  FileText, MapPin, Building2, User, Mail, Phone,
  Lock, Calendar, Globe,
} from 'lucide-react';
import { servicesAPI } from '../api/client';
import { toast } from 'sonner';
import LoginSlideshow from '../components/LoginSlideshow';
import PasswordStrength from '../components/PasswordStrength';

const ICON_MAP = { Stethoscope, Activity, Heart, Brain, Users, Hand, FileText };

const GHANA_REGIONS = [
  'Greater Accra','Ashanti','Western','Eastern','Central',
  'Northern','Upper East','Upper West','Volta','Brong-Ahafo',
  'Western North','Ahafo','Bono East','Oti','Savannah','North East',
];

const STEPS = ['Account','Service Type','Profile','Assessment','Documents'];

// ── Input helper ──────────────────────────────────────────────────────────────
function Field({ label, required, children, error }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-700)' }}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

function Input({ value, onChange, type='text', placeholder, onToggle, showToggle }) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-800"
      />
      {showToggle && (
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {type === 'password' ? <Eye size={15}/> : <EyeOff size={15}/>}
        </button>
      )}
    </div>
  );
}

// ── Step components ───────────────────────────────────────────────────────────
function StepAccount({ form, set, errors }) {
  const [showPw, setShowPw] = useState(false);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Full name" required error={errors.full_name}>
          <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Dr. Abena Mensah" />
        </Field>
        <Field label="Username" required error={errors.username}>
          <Input value={form.username} onChange={e => set('username', e.target.value)} placeholder="abena_m" />
        </Field>
      </div>
      <Field label="Email address" required error={errors.email}>
        <Input value={form.email} onChange={e => set('email', e.target.value)} type="email" placeholder="abena@example.com" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Password" required error={errors.password}>
          <Input value={form.password} onChange={e => set('password', e.target.value)}
            type={showPw ? 'text' : 'password'} placeholder="Min 8 chars, 1 uppercase, 1 number"
            showToggle onToggle={() => setShowPw(v => !v)} />
        </Field>
        <Field label="Confirm password" required error={errors.confirm_password}>
          <Input value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)}
            type="password" placeholder="Re-enter password" />
        </Field>
      </div>
      {form.password && <PasswordStrength password={form.password} />}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone number">
          <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+233 XX XXX XXXX" />
        </Field>
        <Field label="Gender">
          <select value={form.gender} onChange={e => set('gender', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date of birth">
          <Input value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)}
            type="date"
            max={new Date(Date.now() - 18*365.25*24*3600000).toISOString().split('T')[0]}
            min={new Date(Date.now() - 80*365.25*24*3600000).toISOString().split('T')[0]}
          />
        </Field>
        <Field label="Location / City">
          <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Accra, Greater Accra" />
        </Field>
      </div>
      <Field label="Home address">
        <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="House no., Street, Area, City" />
      </Field>
    </div>
  );
}

function StepServiceType({ form, set, types, loadingTypes }) {
  if (loadingTypes) return (
    <div className="flex items-center justify-center h-40 gap-2 text-slate-500">
      <Loader2 size={20} className="animate-spin text-teal-500"/> Loading service types...
    </div>
  );
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Choose your primary service type. Your assessment will be tailored to this role.</p>
      <div className="grid grid-cols-2 gap-3">
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
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${t.color}20`, color: t.color }}>
                  <Icon size={16} />
                </div>
                {sel && <CheckCircle size={14} style={{ color: t.color }} className="ml-auto"/>}
              </div>
              <p className="font-bold text-sm text-slate-800">{t.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{t.description}</p>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${t.color}15`, color: t.color }}>
                  Min score: {t.min_pass_score}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepProfile({ form, set, selectedType }) {
  const isClinic = ['nurse','doctor','physiotherapist'].includes(form.service_type);
  const [quals, setQuals] = useState(form.qualifications || [{ title:'', institution:'', year:'' }]);

  const updateQual = (i, k, v) => {
    const next = quals.map((q, idx) => idx === i ? { ...q, [k]: v } : q);
    setQuals(next);
    set('qualifications', next);
  };
  const addQual = () => { const next = [...quals, { title:'', institution:'', year:'' }]; setQuals(next); set('qualifications', next); };
  const removeQual = i => { const next = quals.filter((_, idx) => idx !== i); setQuals(next); set('qualifications', next); };

  return (
    <div className="space-y-4">
      <Field label="Professional bio" required>
        <div className="relative">
          <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
            rows={3} maxLength={500} placeholder="Describe your experience, approach to care, and what makes you the right provider..."
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
          <span className="absolute bottom-2 right-3 text-[10px] text-slate-400">{(form.bio||'').length}/500</span>
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Years of experience" required>
          <Input value={form.years_experience} onChange={e => set('years_experience', parseInt(e.target.value)||0)} type="number" placeholder="5" />
        </Field>
        <Field label="Region" required>
          <select value={form.region} onChange={e => set('region', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="">Select region</option>
            {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Facility / Organisation">
          <Input value={form.facility_name} onChange={e => set('facility_name', e.target.value)} placeholder="Korle Bu Teaching Hospital" />
        </Field>
        <Field label="Specialisation">
          <Input value={form.specialisation} onChange={e => set('specialisation', e.target.value)} placeholder="Palliative Care, Oncology..." />
        </Field>
      </div>
      {isClinic && (
        <Field label="Licence / NMC PIN number" required>
          <Input value={form.license_number} onChange={e => set('license_number', e.target.value)} placeholder="NMC/GCMC licence number" />
        </Field>
      )}

      {/* Qualifications */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-slate-700">Qualifications</label>
          <button type="button" onClick={addQual}
            className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-semibold">
            <Plus size={13}/> Add
          </button>
        </div>
        <div className="space-y-2">
          {quals.map((q, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 items-start">
              <input value={q.title} onChange={e => updateQual(i,'title',e.target.value)}
                placeholder="Qualification title"
                className="col-span-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500" />
              <input value={q.institution} onChange={e => updateQual(i,'institution',e.target.value)}
                placeholder="Institution"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500" />
              <div className="flex gap-1">
                <input value={q.year} onChange={e => updateQual(i,'year',e.target.value)}
                  placeholder="Year" type="number" min="1950" max="2030"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                {quals.length > 1 && (
                  <button type="button" onClick={() => removeQual(i)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-50">
                    <X size={13}/>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepAssessment({ form, set, questions, serviceColor }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(form.assessment_answers || {});

  const selectAnswer = (qid, optIdx) => {
    const next = { ...answers, [String(qid)]: optIdx };
    setAnswers(next);
    set('assessment_answers', next);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-10">
        <CheckCircle size={40} className="text-teal-500 mx-auto mb-3" />
        <p className="font-semibold text-slate-800">No assessment required for this service type.</p>
        <p className="text-sm text-slate-500 mt-1">You can proceed to the next step.</p>
      </div>
    );
  }

  const q = questions[current];
  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / questions.length) * 100);

  // Quick score preview
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
          <span>{answered} answered · Preview score: {previewScore()}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: serviceColor || '#0d9488' }} />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}
          className="space-y-3">
          {q.scenario_context && (
            <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 italic">
              Scenario: {q.scenario_context}
            </div>
          )}
          <p className="font-semibold text-slate-800 text-sm leading-relaxed">{q.question}</p>
          <div className="space-y-2">
            {(q.options || []).map((opt, oi) => {
              const sel = answers[String(q.id)] === oi;
              return (
                <button key={oi} type="button" onClick={() => selectAnswer(q.id, oi)}
                  className="w-full text-left p-3 rounded-xl border-2 text-sm transition-all"
                  style={{
                    borderColor: sel ? (serviceColor || '#0d9488') : '#e2e8f0',
                    background: sel ? `${serviceColor || '#0d9488'}10` : 'white',
                    color: 'var(--text-800)',
                  }}>
                  <span className="font-semibold mr-2"
                    style={{ color: serviceColor || '#0d9488' }}>
                    {String.fromCharCode(65 + oi)}.
                  </span>
                  {opt.text}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation between questions */}
      <div className="flex items-center justify-between pt-1">
        <button type="button" onClick={() => setCurrent(c => Math.max(0, c-1))} disabled={current === 0}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-30 font-semibold">
          <ChevronLeft size={14}/> Prev
        </button>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <button key={i} type="button" onClick={() => setCurrent(i)}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                background: answers[String(questions[i].id)] !== undefined
                  ? (serviceColor || '#0d9488')
                  : i === current ? '#94a3b8' : '#e2e8f0',
                width: i === current ? 16 : 8,
              }} />
          ))}
        </div>
        <button type="button" onClick={() => setCurrent(c => Math.min(questions.length-1, c+1))}
          disabled={current === questions.length - 1}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-30 font-semibold">
          Next <ChevronRight size={14}/>
        </button>
      </div>
    </div>
  );
}

function StepDocuments({ form, set }) {
  const fileRef = useRef();
  const [docs, setDocs] = useState([]);
  const [terms, setTerms] = useState(false);

  const handleFiles = e => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.size <= 5*1024*1024);
    if (valid.length < files.length) toast.error('Some files exceed 5MB and were skipped');
    const names = valid.map(f => f.name);
    const next = [...docs, ...names].slice(0, 5);
    setDocs(next);
    set('document_names', next);
    set('terms', terms);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Upload your licence, certificates, and any supporting credentials.
        Maximum 5 files, 5MB each. PDF, JPEG, or PNG.
      </p>

      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-teal-300 rounded-xl p-6 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50/30 transition-all">
        <Upload size={28} className="text-teal-400 mx-auto mb-2"/>
        <p className="font-semibold text-sm text-slate-700">Click to upload documents</p>
        <p className="text-xs text-slate-500 mt-0.5">NMC licence, degree certificate, DBS check, police clearance</p>
        <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
          className="hidden" onChange={handleFiles} />
      </div>

      {docs.length > 0 && (
        <div className="space-y-1.5">
          {docs.map((name, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg border border-teal-100">
              <FileText size={14} className="text-teal-600 flex-shrink-0"/>
              <span className="text-xs text-slate-700 flex-1 truncate">{name}</span>
              <button type="button" onClick={() => {
                const next = docs.filter((_, idx) => idx !== i);
                setDocs(next); set('document_names', next);
              }} className="text-slate-400 hover:text-red-500">
                <X size={13}/>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
        <strong>Note:</strong> Document upload in this demo stores file names. In production, files would be securely uploaded and encrypted.
        Your application will still be reviewed by our admin team.
      </div>

      <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-teal-300 cursor-pointer transition-colors bg-white">
        <input type="checkbox" checked={terms} onChange={e => { setTerms(e.target.checked); set('terms', e.target.checked); }}
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

// ── Main component ────────────────────────────────────────────────────────────
const EMPTY = {
  // Account
  full_name:'', username:'', email:'', password:'', confirm_password:'',
  phone:'', gender:'', date_of_birth:'', address:'', location:'',
  // Service
  service_type:'',
  // Profile
  bio:'', years_experience:0, qualifications:[], license_number:'',
  specialisation:'', facility_name:'', region:'',
  // Assessment
  assessment_answers:{},
  // Documents
  document_names:[], terms: false,
};

export default function ProviderRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(null);

  const set = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  const { data: typesData, isLoading: loadingTypes } = useQuery({
    queryKey: ['service-types-public'],
    queryFn: () => servicesAPI.getTypes().then(r => r.data),
  });
  const types = typesData || [];
  const selectedType = types.find(t => t.key === form.service_type);
  const questions = selectedType?.assessment_questions || [];

  const submitMutation = useMutation({
    mutationFn: (data) => servicesAPI.apply(data),
    onSuccess: (res) => setSubmitted(res.data),
    onError: (err) => toast.error(err?.response?.data?.detail || 'Submission failed'),
  });

  const validate0 = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Required';
    if (!form.username.trim() || form.username.length < 3) e.username = 'Min 3 chars';
    if (!form.email.includes('@')) e.email = 'Valid email required';
    if (form.password.length < 8) e.password = 'Min 8 chars';
    if (!/[A-Z]/.test(form.password)) e.password = 'Need one uppercase letter';
    if (!/\d/.test(form.password)) e.password = 'Need one number';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match';
    return e;
  };

  const canNext = () => {
    if (step === 0) return Object.keys(validate0()).length === 0;
    if (step === 1) return !!form.service_type;
    if (step === 2) return form.bio.length >= 20 && form.region;
    if (step === 3) return true; // assessment optional
    return form.terms;
  };

  const handleNext = () => {
    if (step === 0) {
      const e = validate0();
      if (Object.keys(e).length) { setErrors(e); return; }
    }
    setErrors({});
    if (step < 4) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = () => {
    const payload = {
      username: form.username,
      email: form.email,
      password: form.password,
      full_name: form.full_name,
      phone: form.phone || undefined,
      gender: form.gender || undefined,
      date_of_birth: form.date_of_birth || undefined,
      address: form.address || undefined,
      location: form.location || undefined,
      service_type: form.service_type,
      bio: form.bio,
      years_experience: form.years_experience,
      qualifications: form.qualifications,
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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#c2dde8' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-teal-100' : 'bg-amber-100'}`}>
            {passed
              ? <CheckCircle size={36} className="text-teal-600"/>
              : <AlertCircle size={36} className="text-amber-500"/>
            }
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
          <p className="text-slate-600 text-sm mb-4 leading-relaxed">
            Your application as a <strong>{selectedType?.label}</strong> has been received.
            We review all applications within <strong>2 business days</strong>.
          </p>
          <div className={`rounded-xl p-4 mb-5 ${passed ? 'bg-teal-50 border border-teal-100' : 'bg-amber-50 border border-amber-100'}`}>
            <p className="text-2xl font-black" style={{ color: passed ? '#0d9488' : '#d97706' }}>
              {submitted.assessment_score}%
            </p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: passed ? '#0d9488' : '#d97706' }}>
              Knowledge Assessment Score {passed ? '- PASS' : `- min ${submitted.min_pass_score}% required`}
            </p>
          </div>
          <p className="text-xs text-slate-500 mb-5">
            You'll receive a notification on approval. You can check status by logging in.
          </p>
          <button onClick={() => navigate('/login')}
            className="w-full py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: '#0d9488' }}>
            Go to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#c2dde8' }}>
      {/* Left slideshow — desktop only */}
      <div className="hidden lg:block w-1/2">
        <LoginSlideshow />
      </div>

      {/* Right form */}
      <div className="w-full lg:w-1/2 flex items-start justify-center overflow-y-auto py-8 px-4">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-6">
            <img src="/logo.png" alt="Project Aura" className="w-8 h-8 rounded-lg"/>
            <div>
              <p className="font-bold text-sm text-slate-800 leading-tight">Project Aura</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#D4A017' }}>Provider Registration</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Progress bar */}
            <div className="h-1" style={{ background: '#e2e8f0' }}>
              <div className="h-full transition-all duration-500 rounded-full"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: selectedType?.color || '#0d9488' }} />
            </div>

            {/* Step pills */}
            <div className="px-5 pt-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1 overflow-x-auto">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-1 flex-shrink-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      i < step ? 'bg-teal-600 text-white'
                        : i === step ? 'text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                      style={{ background: i === step ? (selectedType?.color || '#0d9488') : undefined }}>
                      {i < step ? <CheckCircle size={12}/> : i + 1}
                    </div>
                    <span className={`text-[11px] font-semibold hidden sm:block ${i === step ? 'text-slate-800' : 'text-slate-400'}`}>{s}</span>
                    {i < STEPS.length - 1 && <ChevronRight size={12} className="text-slate-200"/>}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <AnimatePresence mode="wait">
                <motion.div key={step}
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
                  {step === 0 && <StepAccount form={form} set={set} errors={errors} />}
                  {step === 1 && <StepServiceType form={form} set={set} types={types} loadingTypes={loadingTypes} />}
                  {step === 2 && <StepProfile form={form} set={set} selectedType={selectedType} />}
                  {step === 3 && <StepAssessment form={form} set={set} questions={questions} serviceColor={selectedType?.color} />}
                  {step === 4 && <StepDocuments form={form} set={set} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex gap-3">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:border-slate-300">
                  <ChevronLeft size={15}/> Back
                </button>
              )}
              <button onClick={handleNext} disabled={!canNext() || submitMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
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

          <p className="text-center text-xs text-slate-500 mt-4">
            Already a provider?{' '}
            <Link to="/login" className="text-teal-600 font-semibold hover:underline">Sign in</Link>
            {' '}&bull;{' '}
            <Link to="/register" className="text-teal-600 font-semibold hover:underline">Patient/family registration</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
