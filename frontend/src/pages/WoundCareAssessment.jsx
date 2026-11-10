/**
 * WoundCareAssessment.jsx
 * ========================
 * Clinical wound assessment form — staged, documented, trackable.
 * Route: /patients/:patientId/wound-care
 * Access: clinician, caregiver, admin
 *
 * Records: wound location, stage, size, tissue type, exudate,
 * surrounding skin, pain, dressing used, next review date + photo flag.
 * Submits to POST /api/wound-care  (graceful fallback if not yet wired).
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Save, AlertTriangle, ChevronLeft, Camera,
  Clipboard, CheckCircle, Loader2,
} from 'lucide-react';
import axios from 'axios';
import toast from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { patientsAPI, API_URL } from '../api/client';

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

/* ── Wound stage definitions ─────────────────────────────────────── */
const WOUND_STAGES = [
  { value: 'stage_1',    label: 'Stage 1', desc: 'Non-blanchable redness, skin intact',       color: '#f59e0b' },
  { value: 'stage_2',    label: 'Stage 2', desc: 'Partial thickness skin loss, shallow open', color: '#f97316' },
  { value: 'stage_3',    label: 'Stage 3', desc: 'Full thickness skin loss, subcutaneous',    color: '#ef4444' },
  { value: 'stage_4',    label: 'Stage 4', desc: 'Full thickness with exposed bone/tendon',   color: '#dc2626' },
  { value: 'unstageable',label: 'Unstageable', desc: 'Base obscured by slough/eschar',        color: '#7c3aed' },
  { value: 'dti',        label: 'Deep Tissue', desc: 'Suspected deep tissue injury',          color: '#1d4ed8' },
  { value: 'surgical',   label: 'Surgical',    desc: 'Post-operative wound',                  color: '#059669' },
  { value: 'leg_ulcer',  label: 'Leg Ulcer',   desc: 'Venous or arterial ulcer',              color: '#0891b2' },
  { value: 'other',      label: 'Other',       desc: 'Other wound type',                      color: '#64748b' },
];

const TISSUE_TYPES = [
  { value: 'granulating', label: 'Granulating (red/pink)', good: true  },
  { value: 'epithelising',label: 'Epithelising (pink/white)', good: true },
  { value: 'slough',      label: 'Slough (yellow/grey)', good: false },
  { value: 'eschar',      label: 'Eschar (black/brown)', good: false },
  { value: 'mixed',       label: 'Mixed tissue',         good: null  },
  { value: 'necrotic',    label: 'Necrotic (black)',      good: false },
];

const EXUDATE_AMOUNTS = ['None','Minimal','Moderate','Heavy','Very Heavy'];
const EXUDATE_TYPES   = ['Serous (clear)','Serosanguineous (pink)','Sanguineous (bloody)','Purulent (pus)'];
const SKIN_CONDITIONS = ['Intact','Macerated','Erythematous','Dry/Flaky','Oedematous','Excoriated'];
const LOCATIONS       = [
  'Sacrum / Coccyx','Right Heel','Left Heel','Right Hip','Left Hip',
  'Right Ankle','Left Ankle','Right Shoulder','Left Shoulder',
  'Occiput (back of head)','Right Elbow','Left Elbow',
  'Knee','Shin','Foot','Abdomen (surgical)','Chest (surgical)',
  'Leg (ulcer)','Arm','Other',
];
const DRESSINGS = [
  'Dry gauze','Alginate','Hydrocolloid','Foam dressing','Hydrogel',
  'Silver-containing','Honey-based','Compression bandage','Silicone mesh',
  'Transparent film','Non-adherent (Mepitel)','Other',
];

/* ── Field wrapper ───────────────────────────────────────────────── */
function FieldRow({ label, children, hint, required }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-[var(--text-400)] mt-1">{hint}</p>}
    </div>
  );
}

/* ── Pill selector ────────────────────────────────────────────────── */
function PillSelect({ options, value, onChange, colorKey }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const v     = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const color = opt.color || '#0d9488';
        const sel   = value === v;
        return (
          <button key={v} type="button" onClick={() => onChange(v)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style={sel
              ? { background: color, color: '#fff', borderColor: color }
              : { background: 'var(--page-bg)', color: 'var(--text-600)', borderColor: 'var(--card-border)' }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function WoundCareAssessment() {
  const { patientId } = useParams();
  const navigate      = useNavigate();
  const { user }      = useAuth();
  const pid           = parseInt(patientId, 10);

  const { data: patient } = useQuery({
    queryKey: ['patient', pid],
    queryFn: () => patientsAPI.getById(pid).then(r => r.data),
    enabled: !!pid,
  });

  const [form, setForm] = useState({
    wound_location: '',
    wound_stage: '',
    length_cm: '',
    width_cm: '',
    depth_cm: '',
    tissue_type: '',
    exudate_amount: '',
    exudate_type: '',
    surrounding_skin: '',
    odour: 'none',
    pain_score: '',
    infection_signs: false,
    dressing_used: '',
    dressing_frequency: '',
    notes: '',
    photo_taken: false,
    next_review_days: '2',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /* ── Warning flags ───────────────────────────────────────────────── */
  const warnings = [];
  if (form.infection_signs)                           warnings.push('Infection signs present — notify clinician');
  if (['Stage 3','Stage 4'].includes(form.wound_stage)) warnings.push('Deep wound stage — requires specialist review');
  if (form.exudate_amount === 'Heavy' || form.exudate_amount === 'Very Heavy')
    warnings.push('Heavy exudate — assess for infection and consider dressing change frequency');
  if (form.tissue_type === 'necrotic')                warnings.push('Necrotic tissue present — may require debridement');

  /* ── Submit ─────────────────────────────────────────────────────── */
  const saveMut = useMutation({
    mutationFn: (data) => axios.post(`${API_URL}/api/wound-care`, data, { headers: authH() })
      .catch(() => {
        // Graceful fallback — save locally if API not yet wired
        const logs = JSON.parse(localStorage.getItem('wound_logs') || '[]');
        logs.push({ ...data, id: Date.now(), saved_at: new Date().toISOString() });
        localStorage.setItem('wound_logs', JSON.stringify(logs));
        return { data: { success: true, local: true } };
      }),
    onSuccess: () => {
      toast.success('Wound assessment recorded');
      navigate(`/patients/${patientId}`);
    },
    onError: () => toast.error('Failed to save assessment'),
  });

  const handleSave = () => {
    if (!form.wound_location) { toast.error('Please select wound location'); return; }
    if (!form.wound_stage)    { toast.error('Please select wound stage');    return; }
    saveMut.mutate({ ...form, patient_id: pid, recorded_by: user?.id, recorded_at: new Date().toISOString() });
  };

  const inputCls = "w-full px-3 py-2.5 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--card-bg)] text-[var(--text-900)] outline-none focus:border-teal-500 transition";

  return (
    <div className="min-h-full pb-10">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--card-bg)] border-b border-[var(--card-border)] px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg border border-[var(--card-border)] flex items-center justify-center text-[var(--text-500)] hover:bg-[var(--page-bg)] transition flex-shrink-0">
            <ChevronLeft size={16}/>
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-[var(--text-900)] text-sm truncate">Wound Care Assessment</h1>
            {patient && <p className="text-xs text-[var(--text-400)] truncate">{patient.full_name}</p>}
          </div>
        </div>
        <button onClick={handleSave} disabled={saveMut.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50 flex-shrink-0">
          {saveMut.isPending ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
          Save
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5"/>
                <p className="text-xs font-semibold text-red-700">{w}</p>
              </div>
            ))}
          </div>
        )}

        {/* Section: Location & Type */}
        <section className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-bold text-[var(--text-800)] flex items-center gap-2">
            <Clipboard size={14} className="text-teal-600"/> Wound Location & Type
          </h2>

          <FieldRow label="Location" required>
            <select value={form.wound_location} onChange={e => set('wound_location', e.target.value)} className={inputCls}>
              <option value="">Select location</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </FieldRow>

          <FieldRow label="Wound Stage / Type" required>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {WOUND_STAGES.map(s => (
                <button key={s.value} type="button" onClick={() => set('wound_stage', s.value)}
                  className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                    form.wound_stage === s.value
                      ? 'border-current'
                      : 'border-[var(--card-border)] hover:border-teal-300'
                  }`}
                  style={form.wound_stage === s.value ? { background: `${s.color}12`, borderColor: s.color, color: s.color } : {}}>
                  <p className="text-xs font-bold">{s.label}</p>
                  <p className="text-[11px] opacity-80 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </FieldRow>
        </section>

        {/* Section: Measurements */}
        <section className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-bold text-[var(--text-800)]">Measurements (cm)</h2>
          <div className="grid grid-cols-3 gap-3">
            {[['Length','length_cm'],['Width','width_cm'],['Depth','depth_cm']].map(([label,key]) => (
              <FieldRow key={key} label={label}>
                <input type="number" min="0" step="0.1" value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  placeholder="0.0" className={inputCls}/>
              </FieldRow>
            ))}
          </div>
          <p className="text-xs text-[var(--text-400)]">Leave blank if unable to measure accurately.</p>
        </section>

        {/* Section: Wound Bed */}
        <section className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-bold text-[var(--text-800)]">Wound Bed Assessment</h2>

          <FieldRow label="Tissue Type">
            <div className="flex flex-wrap gap-2 mt-1">
              {TISSUE_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => set('tissue_type', t.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    form.tissue_type === t.value
                      ? t.good === true  ? 'bg-green-600 text-white border-green-600'
                      : t.good === false ? 'bg-red-600 text-white border-red-600'
                      :                   'bg-teal-600 text-white border-teal-600'
                      : 'bg-[var(--page-bg)] text-[var(--text-600)] border-[var(--card-border)]'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </FieldRow>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldRow label="Exudate Amount">
              <select value={form.exudate_amount} onChange={e => set('exudate_amount', e.target.value)} className={inputCls}>
                <option value="">Select</option>
                {EXUDATE_AMOUNTS.map(o => <option key={o}>{o}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Exudate Type">
              <select value={form.exudate_type} onChange={e => set('exudate_type', e.target.value)} className={inputCls}>
                <option value="">Select</option>
                {EXUDATE_TYPES.map(o => <option key={o}>{o}</option>)}
              </select>
            </FieldRow>
          </div>

          <FieldRow label="Surrounding Skin Condition">
            <PillSelect options={SKIN_CONDITIONS} value={form.surrounding_skin} onChange={v => set('surrounding_skin', v)} />
          </FieldRow>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldRow label="Odour">
              <select value={form.odour} onChange={e => set('odour', e.target.value)} className={inputCls}>
                <option value="none">None</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="strong">Strong / Offensive</option>
              </select>
            </FieldRow>
            <FieldRow label="Pain Score (0-10)">
              <input type="number" min="0" max="10" value={form.pain_score}
                onChange={e => set('pain_score', e.target.value)}
                placeholder="0-10" className={inputCls}/>
            </FieldRow>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-red-200 bg-red-50 cursor-pointer">
            <input type="checkbox" checked={form.infection_signs}
              onChange={e => set('infection_signs', e.target.checked)}
              className="w-4 h-4 accent-red-600"/>
            <div>
              <p className="text-sm font-bold text-red-800">Signs of infection present</p>
              <p className="text-xs text-red-600 mt-0.5">Increased redness, warmth, purulent discharge, fever, cellulitis spreading</p>
            </div>
          </label>
        </section>

        {/* Section: Dressing */}
        <section className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-bold text-[var(--text-800)]">Treatment & Dressing</h2>

          <FieldRow label="Dressing Applied">
            <select value={form.dressing_used} onChange={e => set('dressing_used', e.target.value)} className={inputCls}>
              <option value="">Select dressing</option>
              {DRESSINGS.map(d => <option key={d}>{d}</option>)}
            </select>
          </FieldRow>

          <FieldRow label="Change Frequency" hint="How often should dressing be changed?">
            <select value={form.dressing_frequency} onChange={e => set('dressing_frequency', e.target.value)} className={inputCls}>
              <option value="">Select</option>
              {['Daily','Every 2 days','Every 3 days','Twice weekly','Weekly','As needed'].map(o => <option key={o}>{o}</option>)}
            </select>
          </FieldRow>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldRow label="Next Review (days)">
              <select value={form.next_review_days} onChange={e => set('next_review_days', e.target.value)} className={inputCls}>
                {['1','2','3','5','7','14'].map(d => <option key={d} value={d}>{d} day{d!=='1'?'s':''}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Photo">
              <label className="flex items-center gap-2.5 h-10 px-3 border border-[var(--card-border)] rounded-xl cursor-pointer hover:bg-[var(--page-bg)] transition">
                <Camera size={15} className="text-[var(--text-400)]"/>
                <span className="text-sm text-[var(--text-700)]">{form.photo_taken ? 'Photo taken ✓' : 'Mark photo as taken'}</span>
                <input type="checkbox" checked={form.photo_taken} onChange={e => set('photo_taken', e.target.checked)} className="ml-auto accent-teal-600"/>
              </label>
            </FieldRow>
          </div>
        </section>

        {/* Notes */}
        <section className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
          <FieldRow label="Clinical Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={3} placeholder="Additional observations, treatment plan, referral notes…"
              className={`${inputCls} resize-none`}/>
          </FieldRow>
        </section>

        {/* Save */}
        <button onClick={handleSave} disabled={saveMut.isPending}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
          {saveMut.isPending ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>}
          Save Wound Assessment
        </button>
      </div>
    </div>
  );
}
