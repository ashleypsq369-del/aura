/**
 * MotorSkillsForm.jsx - Physical Function & Mobility Tests
 * Redesigned: PageHeader + clean test cards + auto-calculated fall risk
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Activity, Save, Timer, Dumbbell, ChevronLeft,
  AlertTriangle, Footprints, Wind,
} from 'lucide-react';
import apiClient from '../api/client';
import toast from '../utils/toast';
import offlineStorage from '../utils/offlineStorage';
import FormFileUpload from '../components/FormFileUpload';
import PageHeader from '../components/PageHeader';

function calcFallRisk(sec) {
  const t = parseFloat(sec);
  if (isNaN(t)) return '';
  if (t <= 10) return 'Low Risk';
  if (t <= 14) return 'Moderate Risk';
  return 'High Risk';
}

function FallRiskBadge({ risk }) {
  if (!risk) return null;
  const cls = risk === 'Low Risk' ? 'badge-low' : risk === 'Moderate Risk' ? 'badge-moderate' : 'badge-critical';
  return <span className={cls}>{risk}</span>;
}

function FieldRow({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-bold text-[var(--text-600)] mb-1">{label}</label>
      {hint && <p className="text-[11px] text-[var(--text-400)] mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

function NumInput({ value, onChange, placeholder, unit, min = 0, step = 1 }) {
  return (
    <div className="flex items-center gap-2">
      <input type="number" min={min} step={step} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-28 px-3 py-2 text-sm border border-[var(--card-border)] rounded-lg bg-[var(--page-bg)] text-[var(--text-800)] focus:border-orange-400 focus:outline-none" />
      {unit && <span className="text-xs text-[var(--text-400)]">{unit}</span>}
    </div>
  );
}

export default function MotorSkillsForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Grip Strength
  const [gripRight, setGripRight]               = useState('');
  const [gripLeft, setGripLeft]                 = useState('');
  const [gripInterpretation, setGripInterpretation] = useState('');

  // TUG
  const [tugTime, setTugTime]         = useState('');
  const [tugAssistance, setTugAssistance] = useState('');

  // 6MWT
  const [walkDistance, setWalkDistance]   = useState('');
  const [dyspneaBefore, setDyspneaBefore] = useState('');
  const [dyspneaAfter, setDyspneaAfter]   = useState('');
  const [o2SatBefore, setO2SatBefore]     = useState('');
  const [o2SatAfter, setO2SatAfter]       = useState('');

  // Balance
  const [balanceScore, setBalanceScore]         = useState('');
  const [coordinationScore, setCoordinationScore] = useState('');
  const [notes, setNotes] = useState('');

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => (await apiClient.get(`/api/patients/${patientId}`)).data,
  });

  const fallRisk = calcFallRisk(tugTime);
  const o2Drop  = o2SatBefore && o2SatAfter ? parseInt(o2SatBefore) - parseInt(o2SatAfter) : null;

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      if (!navigator.onLine) { await offlineStorage.saveOffline('motor_skills', data); return { offline: true }; }
      return apiClient.post('/api/assessments/motor-skills', data);
    },
    onSuccess: (res) => {
      if (res.offline) toast.success('Saved offline - will sync when online', { duration: 5000 });
      else {
        toast.success('Motor Skills assessment saved');
        if (res.data.alerts_generated?.length > 0)
          toast.error(`${res.data.alerts_generated.length} alert(s) generated`, { duration: 5000 });
      }
      queryClient.invalidateQueries(['motor-skills', patientId]);
      queryClient.invalidateQueries(['assessment-overview', patientId]);
      setTimeout(() => navigate(`/assessments/${patientId}`), 1500);
    },
    onError: () => toast.error('Failed to save assessment'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasGrip    = gripRight || gripLeft;
    const hasTUG     = tugTime;
    const hasWalk    = walkDistance;
    const hasBalance = balanceScore || coordinationScore;
    if (!hasGrip && !hasTUG && !hasWalk && !hasBalance) {
      toast.error('Complete at least one motor skills test');
      return;
    }
    submitMutation.mutate({
      patient_id: parseInt(patientId),
      grip_strength_right:       gripRight        ? parseFloat(gripRight)        : null,
      grip_strength_left:        gripLeft         ? parseFloat(gripLeft)         : null,
      grip_strength_interpretation: gripInterpretation || null,
      tug_time_seconds:          tugTime          ? parseFloat(tugTime)          : null,
      tug_assistance_used:       tugAssistance || null,
      tug_fall_risk:             fallRisk          || null,
      walk_distance_meters:      walkDistance     ? parseFloat(walkDistance)     : null,
      walk_dyspnea_before:       dyspneaBefore    ? parseInt(dyspneaBefore)      : null,
      walk_dyspnea_after:        dyspneaAfter     ? parseInt(dyspneaAfter)       : null,
      walk_oxygen_sat_before:    o2SatBefore      ? parseInt(o2SatBefore)        : null,
      walk_oxygen_sat_after:     o2SatAfter       ? parseInt(o2SatAfter)         : null,
      balance_score:             balanceScore     ? parseInt(balanceScore)       : null,
      coordination_score:        coordinationScore? parseInt(coordinationScore)  : null,
      notes,
    });
  };

  return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/african/african-vitals.jpg"
        title="Motor Skills Assessment"
        subtitle={`Physical Function & Mobility${patient?.full_name ? ` · ${patient.full_name}` : ''}`}
        icon={Activity}
        stats={[
          { label: 'TUG Fall Risk', value: fallRisk || '-', color: fallRisk === 'High Risk' ? '#f87171' : fallRisk === 'Moderate Risk' ? '#fbbf24' : '#2dd4bf' },
          { label: 'Walk Distance', value: walkDistance ? `${walkDistance}m` : '-', color: '#818cf8' },
        ]}
      >
        <button onClick={() => navigate(`/assessments/${patientId}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--page-bg)] hover:bg-[var(--card-border)] text-[var(--text-700)] rounded-lg border border-[var(--card-border)] text-xs font-semibold transition">
          <ChevronLeft size={14} /> Assessments
        </button>
      </PageHeader>

      <div className="max-w-[760px] mx-auto px-4 py-5 space-y-4">
        <div className="flex items-start gap-3 px-4 py-3 bg-orange-50 rounded-xl border border-orange-200">
          <Activity size={15} className="text-orange-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-orange-800">
            Complete at least one test. All tests are optional - document those applicable to this patient.
            Fall risk is automatically calculated from TUG time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Grip Strength */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-[var(--card-border)] flex items-center justify-center">
                <Dumbbell size={15} className="text-orange-600" />
              </div>
              <p className="text-sm font-bold text-[var(--text-900)]">Grip Strength</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <FieldRow label="Right hand" hint="Dominant hand">
                <NumInput value={gripRight} onChange={setGripRight} placeholder="e.g. 28" unit="kg" step={0.1} />
              </FieldRow>
              <FieldRow label="Left hand">
                <NumInput value={gripLeft} onChange={setGripLeft} placeholder="e.g. 25" unit="kg" step={0.1} />
              </FieldRow>
            </div>
            <FieldRow label="Interpretation">
              <select value={gripInterpretation} onChange={e => setGripInterpretation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--card-border)] rounded-lg bg-[var(--page-bg)] text-[var(--text-800)] focus:border-orange-400 focus:outline-none">
                <option value="">Select…</option>
                {['Normal','Slightly Weak','Moderately Weak','Severely Weak'].map(v => (
                  <option key={v} value={v.toLowerCase().replace(/ /g,'_')}>{v}</option>
                ))}
              </select>
            </FieldRow>
          </div>

          {/* TUG */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 border border-[var(--card-border)] flex items-center justify-center">
                  <Timer size={15} className="text-orange-600" />
                </div>
                <p className="text-sm font-bold text-[var(--text-900)]">Timed Up &amp; Go (TUG)</p>
              </div>
              {fallRisk && <FallRiskBadge risk={fallRisk} />}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Time" hint="Stand, walk 3m, return, sit">
                <NumInput value={tugTime} onChange={setTugTime} placeholder="e.g. 12.5" unit="seconds" step={0.1} />
              </FieldRow>
              <FieldRow label="Assistance used">
                <select value={tugAssistance} onChange={e => setTugAssistance(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--card-border)] rounded-lg bg-[var(--page-bg)] text-[var(--text-800)] focus:border-orange-400 focus:outline-none">
                  <option value="">None</option>
                  {['Walking stick','Walker/frame','Crutches','Personal assistance'].map(v => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </FieldRow>
            </div>
            {tugTime && (
              <p className="text-xs text-[var(--text-400)] mt-2">
                Auto-calculated: ≤10s Low · 10-14s Moderate · &gt;14s High fall risk
              </p>
            )}
          </div>

          {/* 6-Minute Walk */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-[var(--card-border)] flex items-center justify-center">
                <Footprints size={15} className="text-orange-600" />
              </div>
              <p className="text-sm font-bold text-[var(--text-900)]">6-Minute Walk Test (6MWT)</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Distance walked">
                <NumInput value={walkDistance} onChange={setWalkDistance} placeholder="e.g. 320" unit="metres" />
              </FieldRow>
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <FieldRow label="Dyspnoea before" hint="Borg 0-10">
                  <NumInput value={dyspneaBefore} onChange={setDyspneaBefore} placeholder="0-10" min={0} />
                </FieldRow>
                <FieldRow label="Dyspnoea after" hint="Borg 0-10">
                  <NumInput value={dyspneaAfter} onChange={setDyspneaAfter} placeholder="0-10" min={0} />
                </FieldRow>
                <FieldRow label="O₂ saturation before">
                  <NumInput value={o2SatBefore} onChange={setO2SatBefore} placeholder="e.g. 97" unit="%" />
                </FieldRow>
                <FieldRow label="O₂ saturation after">
                  <NumInput value={o2SatAfter} onChange={setO2SatAfter} placeholder="e.g. 92" unit="%" />
                </FieldRow>
              </div>
            </div>
            {o2Drop !== null && o2Drop > 4 && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                className="mt-3 flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg border border-orange-200">
                <AlertTriangle size={13} className="text-orange-600 flex-shrink-0" />
                <p className="text-xs text-orange-800 font-semibold">
                  O₂ desaturation of {o2Drop}% - consider stopping test / monitoring closely
                </p>
              </motion.div>
            )}
          </div>

          {/* Balance */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-[var(--card-border)] flex items-center justify-center">
                <Wind size={15} className="text-orange-600" />
              </div>
              <p className="text-sm font-bold text-[var(--text-900)]">Balance &amp; Coordination</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Balance score" hint="0-10 clinical rating">
                <NumInput value={balanceScore} onChange={setBalanceScore} placeholder="0-10" min={0} />
              </FieldRow>
              <FieldRow label="Coordination score" hint="0-10 clinical rating">
                <NumInput value={coordinationScore} onChange={setCoordinationScore} placeholder="0-10" min={0} />
              </FieldRow>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <label className="block text-sm font-semibold text-[var(--text-700)] mb-2">
              Clinical Notes <span className="font-normal text-[var(--text-400)]">(optional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Testing conditions, patient cooperation, any safety concerns…"
              className="w-full px-3 py-2 text-sm border border-[var(--card-border)] rounded-lg bg-[var(--page-bg)] text-[var(--text-800)] focus:border-orange-400 focus:outline-none resize-none" />
          </div>

          <FormFileUpload category="documents" label="Assessment Records"
            description="Attach test reports or supporting evidence"
            accept="image/*,.pdf,.doc,.docx" multiple maxSizeMB={50} />

          <div className="flex gap-3">
            <button type="submit" disabled={submitMutation.isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50">
              <Save size={15} />
              {submitMutation.isLoading ? 'Saving…' : 'Save Assessment'}
            </button>
            <button type="button" onClick={() => navigate(`/assessments/${patientId}`)}
              className="px-5 py-3 bg-[var(--page-bg)] hover:bg-[var(--card-border)] text-[var(--text-700)] rounded-xl text-sm font-semibold border border-[var(--card-border)] transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
