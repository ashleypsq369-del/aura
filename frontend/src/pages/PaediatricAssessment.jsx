/**
 * PaediatricAssessment.jsx
 * =========================
 * Paediatric-specific clinical assessment tools:
 * - FACES Pain Scale (Wong-Baker) — for children 3+ who can self-report
 * - FLACC Scale — for children under 3 or non-verbal
 * - PPS-C (Paediatric Palliative Performance Scale)
 * - Weight-based medication dose calculator
 *
 * Route: /patients/:patientId/paediatric-assessment
 * Access: clinician, caregiver, admin
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, ChevronLeft, Loader2, CheckCircle,
  Baby, Calculator, AlertTriangle,
} from 'lucide-react';
import axios from 'axios';
import toast from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { patientsAPI, API_URL } from '../api/client';

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

/* ── FACES pain faces (emoji approximations) ─────────────────────── */
const FACES = [
  { score: 0, emoji: '😊', label: 'No Hurt',        color: '#22c55e' },
  { score: 2, emoji: '🙂', label: 'Hurts Little Bit',color: '#84cc16' },
  { score: 4, emoji: '😐', label: 'Hurts Little More',color: '#facc15'},
  { score: 6, emoji: '😟', label: 'Hurts Even More', color: '#f97316' },
  { score: 8, emoji: '😢', label: 'Hurts Whole Lot', color: '#ef4444' },
  { score: 10,emoji: '😭', label: 'Hurts Worst',     color: '#dc2626' },
];

/* ── FLACC scale ─────────────────────────────────────────────────── */
const FLACC_CATEGORIES = [
  {
    id: 'face', label: 'Face',
    options: [
      { value: 0, text: 'No particular expression or smile' },
      { value: 1, text: 'Occasional grimace or frown, withdrawn, disinterested' },
      { value: 2, text: 'Frequent to constant frown, clenched jaw, quivering chin' },
    ],
  },
  {
    id: 'legs', label: 'Legs',
    options: [
      { value: 0, text: 'Normal position or relaxed' },
      { value: 1, text: 'Uneasy, restless, tense' },
      { value: 2, text: 'Kicking or legs drawn up' },
    ],
  },
  {
    id: 'activity', label: 'Activity',
    options: [
      { value: 0, text: 'Lying quietly, normal position, moves easily' },
      { value: 1, text: 'Squirming, shifting back and forth, tense' },
      { value: 2, text: 'Arched, rigid, or jerking' },
    ],
  },
  {
    id: 'cry', label: 'Cry',
    options: [
      { value: 0, text: 'No cry (awake or asleep)' },
      { value: 1, text: 'Moans or whimpers, occasional complaint' },
      { value: 2, text: 'Crying steadily, screams or sobs, frequent complaints' },
    ],
  },
  {
    id: 'consolability', label: 'Consolability',
    options: [
      { value: 0, text: 'Content, relaxed' },
      { value: 1, text: 'Reassured by occasional touching, hugging, or talking' },
      { value: 2, text: 'Difficult to console or comfort' },
    ],
  },
];

/* ── PPS-C levels ────────────────────────────────────────────────── */
const PPSC_LEVELS = [
  { value: 100, label: '100%', desc: 'Full activity, normal, no evidence of disease' },
  { value: 90,  label: '90%',  desc: 'Normal activity, minor signs of disease' },
  { value: 80,  label: '80%',  desc: 'Normal activity with effort, some signs of disease' },
  { value: 70,  label: '70%',  desc: 'Reduced activity, unable to do normal work/school' },
  { value: 60,  label: '60%',  desc: 'Unable to hobby/house activity, significant disease' },
  { value: 50,  label: '50%',  desc: 'Mainly sits/lies, unable to do most activity' },
  { value: 40,  label: '40%',  desc: 'Mainly in bed, unable to do most activity' },
  { value: 30,  label: '30%',  desc: 'Totally bed bound, unable to do any work, extensive disease' },
  { value: 20,  label: '20%',  desc: 'Totally bed bound, minimal to no eating/drinking' },
  { value: 10,  label: '10%',  desc: 'Mouth care only, drowsy or comatose' },
  { value: 0,   label: '0%',   desc: 'Death' },
];

/* ── Common paediatric medications with dose ranges ─────────────── */
const PAED_MEDS = [
  { name: 'Paracetamol', dose_mg_kg: 15, interval_h: 6,  max_mg: 1000, notes: 'Max 60mg/kg/day, max 4g/day' },
  { name: 'Ibuprofen',   dose_mg_kg: 10, interval_h: 8,  max_mg: 400,  notes: 'With food. Avoid under 3 months' },
  { name: 'Morphine (oral)', dose_mg_kg: 0.2, interval_h: 4, max_mg: 10, notes: 'Start low. Titrate every 24-48h' },
  { name: 'Ondansetron', dose_mg_kg: 0.15,interval_h: 8,  max_mg: 8,   notes: 'Max 8mg per dose. IV or oral' },
  { name: 'Metoclopramide', dose_mg_kg: 0.15, interval_h: 8, max_mg: 10, notes: 'Avoid under 1 year' },
  { name: 'Lorazepam',   dose_mg_kg: 0.05, interval_h: 6, max_mg: 2,   notes: 'For seizure: 0.1mg/kg IV/IM' },
];

export default function PaediatricAssessment() {
  const { patientId } = useParams();
  const navigate      = useNavigate();
  const { user }      = useAuth();
  const pid           = parseInt(patientId, 10);
  const [activeTab, setActiveTab] = useState('faces');

  const { data: patient } = useQuery({
    queryKey: ['patient', pid],
    queryFn: () => patientsAPI.getById(pid).then(r => r.data),
    enabled: !!pid,
  });

  /* FACES state */
  const [facesScore, setFacesScore] = useState(null);

  /* FLACC state */
  const [flaccScores, setFlaccScores] = useState({ face:0, legs:0, activity:0, cry:0, consolability:0 });
  const flaccTotal = Object.values(flaccScores).reduce((a,b) => a+b, 0);
  const flaccLabel = flaccTotal <= 3 ? 'Mild' : flaccTotal <= 6 ? 'Moderate' : 'Severe';
  const flaccColor = flaccTotal <= 3 ? '#22c55e' : flaccTotal <= 6 ? '#f97316' : '#dc2626';

  /* PPS-C state */
  const [ppscScore, setPpscScore] = useState(null);

  /* Dose calculator state */
  const [weightKg, setWeightKg] = useState('');
  const [selectedMed, setSelectedMed] = useState(PAED_MEDS[0]);

  const calcDose = () => {
    const w = parseFloat(weightKg);
    if (!w || w <= 0) return null;
    const dose = Math.min(w * selectedMed.dose_mg_kg, selectedMed.max_mg);
    return dose.toFixed(1);
  };
  const dose = calcDose();

  /* Save */
  const saveMut = useMutation({
    mutationFn: (data) => axios.post(`${API_URL}/api/paediatric-assessments`, data, { headers: authH() })
      .catch(() => {
        const logs = JSON.parse(localStorage.getItem('paed_assessments') || '[]');
        logs.push({ ...data, id: Date.now(), saved_at: new Date().toISOString() });
        localStorage.setItem('paed_assessments', JSON.stringify(logs));
        return { data: { success: true } };
      }),
    onSuccess: () => { toast.success('Paediatric assessment saved'); navigate(`/patients/${patientId}`); },
  });

  const handleSave = () => {
    saveMut.mutate({
      patient_id: pid, recorded_by: user?.id,
      faces_score: facesScore,
      flacc_score: flaccTotal, flacc_breakdown: flaccScores,
      ppsc_score: ppscScore,
      recorded_at: new Date().toISOString(),
    });
  };

  const TABS = [
    { id: 'faces',      label: 'FACES Pain',  age: 'Age 3+' },
    { id: 'flacc',      label: 'FLACC',       age: 'Under 3 / Non-verbal' },
    { id: 'ppsc',       label: 'PPS-C',       age: 'All ages' },
    { id: 'calculator', label: 'Dose Calc',   age: 'Tool' },
  ];

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
            <h1 className="font-bold text-[var(--text-900)] text-sm flex items-center gap-2">
              <Baby size={15} className="text-teal-600 flex-shrink-0"/> Paediatric Assessment
            </h1>
            {patient && <p className="text-xs text-[var(--text-400)] truncate">{patient.full_name}</p>}
          </div>
        </div>
        <button onClick={handleSave} disabled={saveMut.isPending || activeTab === 'calculator'}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50 flex-shrink-0">
          {saveMut.isPending ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
          Save
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Tab bar */}
        <div className="flex overflow-x-auto gap-1 mb-5 pb-0.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                activeTab === t.id
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-[var(--card-bg)] text-[var(--text-600)] border-[var(--card-border)] hover:border-teal-300'
              }`}>
              <span className="font-bold">{t.label}</span>
              <span className={`text-[10px] mt-0.5 ${activeTab === t.id ? 'text-teal-100' : 'text-[var(--text-400)]'}`}>{t.age}</span>
            </button>
          ))}
        </div>

        {/* FACES */}
        {activeTab === 'faces' && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
            <h2 className="font-bold text-[var(--text-900)] text-sm mb-1">Wong-Baker FACES Pain Scale</h2>
            <p className="text-xs text-[var(--text-500)] mb-5">Show the faces to the child. Ask: "Point to the face that shows how much you hurt right now."</p>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
              {FACES.map(f => (
                <button key={f.score} type="button" onClick={() => setFacesScore(f.score)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    facesScore === f.score ? 'scale-105' : 'border-[var(--card-border)] opacity-70 hover:opacity-100'
                  }`}
                  style={facesScore === f.score ? { borderColor: f.color, background: `${f.color}12` } : {}}>
                  <span className="text-3xl leading-none">{f.emoji}</span>
                  <span className="text-[10px] font-bold text-center leading-tight"
                        style={{ color: facesScore === f.score ? f.color : 'var(--text-500)' }}>
                    {f.score}
                  </span>
                  <span className="text-[9px] text-center leading-tight text-[var(--text-400)]">{f.label}</span>
                </button>
              ))}
            </div>

            {facesScore !== null && (
              <div className="p-3 rounded-xl border"
                   style={{ background: `${FACES.find(f=>f.score===facesScore)?.color}12`,
                            borderColor: FACES.find(f=>f.score===facesScore)?.color }}>
                <p className="text-sm font-bold" style={{ color: FACES.find(f=>f.score===facesScore)?.color }}>
                  Selected: {facesScore}/10 — {FACES.find(f=>f.score===facesScore)?.label}
                </p>
                {facesScore >= 6 && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1.5">
                    <AlertTriangle size={11}/> Score ≥6 — consider analgesic review with clinician
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* FLACC */}
        {activeTab === 'flacc' && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            className="space-y-4">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[var(--text-500)] uppercase tracking-wider">FLACC Total Score</p>
                <p className="text-3xl font-black" style={{ color: flaccColor }}>{flaccTotal}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: flaccColor }}>{flaccLabel} Pain</p>
                <p className="text-xs text-[var(--text-400)]">0-3 mild · 4-6 moderate · 7-10 severe</p>
              </div>
            </div>

            {FLACC_CATEGORIES.map(cat => (
              <div key={cat.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
                <p className="text-sm font-bold text-[var(--text-800)] mb-3">{cat.label}</p>
                <div className="space-y-2">
                  {cat.options.map(opt => (
                    <label key={opt.value}
                      className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer border transition-all ${
                        flaccScores[cat.id] === opt.value
                          ? 'border-teal-400 bg-teal-50'
                          : 'border-transparent hover:border-[var(--card-border)]'
                      }`}>
                      <input type="radio" name={cat.id} value={opt.value}
                        checked={flaccScores[cat.id] === opt.value}
                        onChange={() => setFlaccScores(s => ({ ...s, [cat.id]: opt.value }))}
                        className="mt-0.5 accent-teal-600 flex-shrink-0"/>
                      <div>
                        <span className="text-xs font-bold text-[var(--text-700)]">{opt.value} — </span>
                        <span className="text-xs text-[var(--text-600)]">{opt.text}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* PPS-C */}
        {activeTab === 'ppsc' && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
            <h2 className="font-bold text-[var(--text-900)] text-sm mb-1">Paediatric Palliative Performance Scale (PPS-C)</h2>
            <p className="text-xs text-[var(--text-500)] mb-4">Select the level that best describes the child's current functional status.</p>

            <div className="space-y-2">
              {PPSC_LEVELS.map(level => (
                <button key={level.value} type="button" onClick={() => setPpscScore(level.value)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    ppscScore === level.value
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-[var(--card-border)] hover:border-teal-300'
                  }`}>
                  <span className={`text-sm font-black w-10 flex-shrink-0 ${ppscScore === level.value ? 'text-teal-600' : 'text-[var(--text-400)]'}`}>
                    {level.label}
                  </span>
                  <span className="text-xs text-[var(--text-700)] leading-relaxed">{level.desc}</span>
                  {ppscScore === level.value && <CheckCircle size={14} className="text-teal-600 ml-auto flex-shrink-0"/>}
                </button>
              ))}
            </div>

            {ppscScore !== null && ppscScore <= 30 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle size={12}/> PPS-C ≤30% — patient in advanced stage. Consider palliative care goals review and family meeting.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Dose Calculator */}
        {activeTab === 'calculator' && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Calculator size={16} className="text-teal-600"/>
              <h2 className="font-bold text-[var(--text-900)] text-sm">Weight-Based Dose Calculator</h2>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              ⚠️ For reference only. All medications must be prescribed by a qualified clinician. Confirm doses before administration.
            </p>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">Child's Weight (kg)</label>
              <input type="number" min="0.5" max="80" step="0.1" value={weightKg}
                onChange={e => setWeightKg(e.target.value)}
                placeholder="e.g. 12.5"
                className="w-full px-3 py-2.5 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--card-bg)] text-[var(--text-900)] outline-none focus:border-teal-500"/>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-700)] mb-2">Medication</label>
              <div className="space-y-2">
                {PAED_MEDS.map(med => (
                  <button key={med.name} type="button" onClick={() => setSelectedMed(med)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedMed.name === med.name
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-[var(--card-border)] hover:border-teal-300'
                    }`}>
                    <p className="text-sm font-bold text-[var(--text-800)]">{med.name}</p>
                    <p className="text-xs text-[var(--text-500)]">{med.dose_mg_kg} mg/kg every {med.interval_h}h · max {med.max_mg}mg/dose</p>
                  </button>
                ))}
              </div>
            </div>

            {dose && (
              <div className="p-4 bg-teal-50 border-2 border-teal-400 rounded-xl">
                <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">Calculated Dose</p>
                <p className="text-3xl font-black text-teal-700">{dose} <span className="text-lg font-semibold">mg</span></p>
                <p className="text-xs text-teal-600 mt-1">
                  {selectedMed.name} · {parseFloat(weightKg)}kg × {selectedMed.dose_mg_kg}mg/kg · every {selectedMed.interval_h}h
                </p>
                <p className="text-xs text-amber-600 mt-2 border-t border-teal-200 pt-2">{selectedMed.notes}</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
