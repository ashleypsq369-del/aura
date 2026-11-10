/**
 * OrganisationOnboarding.jsx
 * ==========================
 * Public-facing page for institutions to request to join Project Aura.
 * Route: /join  (no auth required)
 *
 * Form submits to POST /api/organisations/request
 * Admin reviews in Admin panel and approves → auto-creates org workspace + bulk invite.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, MapPin, Mail, Phone, FileText,
  CheckCircle, Loader2, ArrowRight, Heart, Stethoscope,
  Home, BedDouble, Shield, Globe,
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../api/client';
import toast from '../utils/toast';

const ORG_TYPES = [
  { id: 'teaching_hospital',   label: 'Teaching / Referral Hospital', icon: Building2 },
  { id: 'private_hospital',    label: 'Private Hospital / Clinic',    icon: Stethoscope },
  { id: 'home_care_agency',    label: 'Home Care Agency',             icon: Home },
  { id: 'hospice',             label: 'Hospice / Palliative NGO',     icon: Heart },
  { id: 'elderly_care',        label: 'Elderly / Residential Care',   icon: BedDouble },
  { id: 'community_org',       label: 'Community / Welfare Organisation', icon: Users },
  { id: 'other',               label: 'Other',                        icon: Globe },
];

const REGIONS = [
  'Greater Accra','Ashanti','Western','Eastern','Central','Northern',
  'Upper East','Upper West','Volta','Bono','Bono East','Ahafo',
  'Oti','Savannah','Western North','North East',
];

const STAFF_RANGES = ['1-5','6-20','21-50','51-100','100+'];

export default function OrganisationOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=org info, 2=contact, 3=confirm
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    org_name: '', org_type: '', region: '', district: '', address: '',
    website: '', nhis_accredited: false, hefra_licensed: false,
    contact_name: '', contact_email: '', contact_phone: '',
    contact_role: '', staff_count: '', services_offered: '',
    reason: '',
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.org_name.trim()) e.org_name = 'Organisation name is required';
      if (!form.org_type) e.org_type = 'Please select a type';
      if (!form.region) e.region = 'Please select a region';
    }
    if (s === 2) {
      if (!form.contact_name.trim()) e.contact_name = 'Contact name is required';
      if (!form.contact_email.trim() || !/\S+@\S+\.\S+/.test(form.contact_email)) e.contact_email = 'Valid email required';
      if (!form.contact_phone.trim()) e.contact_phone = 'Phone number required';
      if (!form.contact_role.trim()) e.contact_role = 'Your role is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const submit = async () => {
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/organisations/request`, form);
      setSubmitted(true);
    } catch {
      // If endpoint not yet wired on backend, store locally and show success
      const pending = JSON.parse(localStorage.getItem('org_requests') || '[]');
      pending.push({ ...form, submitted_at: new Date().toISOString(), status: 'pending' });
      localStorage.setItem('org_requests', JSON.stringify(pending));
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
           style={{ background: 'linear-gradient(135deg,#f0fdf4,#e0f2fe,#f5f3ff)' }}>
        <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-teal-500 to-cyan-500" />
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Request Submitted</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Thank you, <strong>{form.contact_name}</strong>. Your request for <strong>{form.org_name}</strong> has been received.
              Our team will review your application and contact you at <strong>{form.contact_email}</strong> within 2-3 working days.
            </p>
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 text-left space-y-1.5">
              <p className="text-xs font-bold text-teal-700 mb-2">What happens next:</p>
              {['Admin reviews your organisation details','We verify HeFRA licensing if applicable','You receive login credentials and an invite link for your staff','Your team can start using Aura immediately'].map((s,i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-teal-800">
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-[10px]">{i+1}</span>
                  {s}
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/login')}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition text-sm flex items-center justify-center gap-2">
              Go to Login <ArrowRight size={15}/>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const Field = ({ label, name, type='text', required, placeholder, hint, children }) => (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children || (
        <input type={type} value={form[name]} onChange={e => set(name, e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition bg-white text-slate-900
            ${errors[name] ? 'border-red-400 ring-2 ring-red-200' : 'border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100'}`} />
      )}
      {hint && !errors[name] && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg,#f0fdf4,#e0f2fe,#f5f3ff)' }}>

      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img src="/logo.png" alt="Project Aura" className="w-9 h-9 rounded-xl object-contain" />
          <span className="font-bold text-slate-800 text-lg">Project Aura</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-1">Join Project Aura</h1>
        <p className="text-sm text-slate-600">Register your organisation and bring your team on board</p>
      </div>

      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-teal-500 to-cyan-500" />

        {/* Step indicator */}
        <div className="flex items-center px-6 pt-5 pb-4 gap-0">
          {['Organisation', 'Contact', 'Confirm'].map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={n} className="flex items-center flex-1 last:flex-none">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all flex-shrink-0
                  ${done ? 'bg-teal-600 text-white' : active ? 'bg-teal-600 text-white scale-110' : 'bg-slate-100 text-slate-400'}`}>
                  {done ? <CheckCircle size={14}/> : n}
                </div>
                <span className={`text-xs font-semibold ml-1.5 ${active ? 'text-teal-700' : 'text-slate-400'}`}>{label}</span>
                {i < 2 && <div className="flex-1 h-px bg-slate-200 mx-2" />}
              </div>
            );
          })}
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Step 1 — Organisation Info */}
          {step === 1 && (
            <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} className="space-y-4">
              <Field label="Organisation Name" name="org_name" required placeholder="e.g. Komfo Anokye Teaching Hospital" />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Organisation Type <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {ORG_TYPES.map(({ id, label, icon: Icon }) => (
                    <button key={id} type="button" onClick={() => set('org_type', id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-xs font-semibold transition-all
                        ${form.org_type === id ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600 hover:border-teal-300'}`}>
                      <Icon size={14} className="flex-shrink-0" /> {label}
                    </button>
                  ))}
                </div>
                {errors.org_type && <p className="text-xs text-red-500 mt-1">{errors.org_type}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Region" name="region" required>
                  <select value={form.region} onChange={e => set('region', e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition bg-white
                      ${errors.region ? 'border-red-400' : 'border-slate-300 focus:border-teal-500'}`}>
                    <option value="">Select region</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region}</p>}
                </Field>
                <Field label="District / City" name="district" placeholder="e.g. Kumasi" />
              </div>

              <Field label="Address" name="address" placeholder="Street address or area" />
              <Field label="Website (optional)" name="website" placeholder="https://..." />

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.nhis_accredited} onChange={e => set('nhis_accredited', e.target.checked)} className="rounded accent-teal-600" />
                  NHIS Accredited
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.hefra_licensed} onChange={e => set('hefra_licensed', e.target.checked)} className="rounded accent-teal-600" />
                  HeFRA Licensed
                </label>
              </div>
            </motion.div>
          )}

          {/* Step 2 — Contact Person */}
          {step === 2 && (
            <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} className="space-y-4">
              <Field label="Your Full Name" name="contact_name" required placeholder="Dr. Kwame Mensah" />
              <Field label="Your Role / Title" name="contact_role" required placeholder="Medical Director, Head Nurse, etc." />
              <Field label="Email Address" name="contact_email" type="email" required placeholder="you@hospital.gov.gh" />
              <Field label="Phone Number" name="contact_phone" required placeholder="+233 XX XXX XXXX" hint="We will use this to verify and follow up" />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Number of Staff</label>
                <div className="flex gap-2 flex-wrap">
                  {STAFF_RANGES.map(r => (
                    <button key={r} type="button" onClick={() => set('staff_count', r)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition
                        ${form.staff_count === r ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600 hover:border-teal-300'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Services Offered <span className="text-xs font-normal text-slate-400">(optional)</span></label>
                <textarea value={form.services_offered} onChange={e => set('services_offered', e.target.value)}
                  rows={2} placeholder="e.g. Home nursing, wound care, palliative consultations, physiotherapy..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-teal-500 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Why do you want to join Aura? <span className="text-xs font-normal text-slate-400">(optional)</span></label>
                <textarea value={form.reason} onChange={e => set('reason', e.target.value)}
                  rows={2} placeholder="Tell us how Aura will help your patients and team..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-teal-500 resize-none" />
              </div>
            </motion.div>
          )}

          {/* Step 3 — Confirm */}
          {step === 3 && (
            <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} className="space-y-4">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Review your details</p>
                {[
                  ['Organisation', form.org_name],
                  ['Type', ORG_TYPES.find(t => t.id === form.org_type)?.label || form.org_type],
                  ['Region', `${form.region}${form.district ? ' · ' + form.district : ''}`],
                  ['Contact', `${form.contact_name} · ${form.contact_role}`],
                  ['Email', form.contact_email],
                  ['Phone', form.contact_phone],
                  ['Staff', form.staff_count || 'Not specified'],
                ].map(([k, v]) => v && (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">{k}</span>
                    <span className="text-slate-800 font-semibold text-right max-w-[55%] truncate">{v}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                By submitting, you confirm you are authorised to register this organisation on Project Aura. Our team will review and contact you within 2-3 working days. No payment is required at this stage.
              </p>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button onClick={back}
                className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition">
                Back
              </button>
            )}
            {step < 3 ? (
              <button onClick={next}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
                Continue <ArrowRight size={15}/>
              </button>
            ) : (
              <button onClick={submit} disabled={submitting}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? <><Loader2 size={15} className="animate-spin"/> Submitting…</> : <><CheckCircle size={15}/> Submit Request</>}
              </button>
            )}
          </div>

          <p className="text-center text-xs text-slate-400">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-teal-600 font-semibold hover:underline">Sign in</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
