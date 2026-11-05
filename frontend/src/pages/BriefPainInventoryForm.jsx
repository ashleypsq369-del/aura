/**
 * BriefPainInventoryForm.jsx — Comprehensive Pain Assessment
 * Redesigned: PageHeader + segmented sliders + tag toggles
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Zap, Save, MapPin, Activity, SmilePlus, Footprints,
  Briefcase, Users, Moon, Heart, ChevronLeft, Wifi, WifiOff,
} from 'lucide-react';
import apiClient from '../api/client';
import toast from '../utils/toast';
import VoiceInput from '../components/VoiceInput';
import offlineStorage from '../utils/offlineStorage';
import FormFileUpload from '../components/FormFileUpload';
import PageHeader from '../components/PageHeader';

const PAIN_TYPES = [
  'Aching','Throbbing','Shooting','Stabbing','Gnawing',
  'Sharp','Tender','Burning','Exhausting','Penetrating',
  'Nagging','Numb','Miserable','Unbearable',
];

const INTERFERENCE_ITEMS = [
  { key:'interference_activity',  label:'General Activity', Icon:Activity  },
  { key:'interference_mood',      label:'Mood',             Icon:SmilePlus },
  { key:'interference_walking',   label:'Walking Ability',  Icon:Footprints},
  { key:'interference_work',      label:'Normal Work',      Icon:Briefcase },
  { key:'interference_relations', label:'Relations',        Icon:Users     },
  { key:'interference_sleep',     label:'Sleep',            Icon:Moon      },
  { key:'interference_enjoyment', label:'Enjoyment of Life',Icon:Heart     },
];

function PainSlider({ label, value, onChange }) {
  const color = value === 0 ? '#16a34a' : value <= 3 ? '#16a34a' : value <= 6 ? '#d97706' : '#dc2626';
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-semibold text-[var(--text-700)]">{label}</p>
        <span className="text-xl font-black tabular-nums" style={{ color }}>{value}</span>
      </div>
      <div className="relative">
        <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex-1 rounded-sm transition-all"
              style={{ backgroundColor: i < value ? (i < 3 ? '#16a34a' : i < 6 ? '#d97706' : '#dc2626') : 'var(--card-border)' }} />
          ))}
        </div>
        <input type="range" min="0" max="10" value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          aria-label={label} />
      </div>
      <div className="flex justify-between text-[10px] text-[var(--text-400)] mt-1">
        <span>0 — None</span><span>10 — Worst</span>
      </div>
    </div>
  );
}

export default function BriefPainInventoryForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [painWorst, setPainWorst]       = useState(0);
  const [painLeast, setPainLeast]       = useState(0);
  const [painAverage, setPainAverage]   = useState(0);
  const [painCurrent, setPainCurrent]   = useState(0);
  const [painLocation, setPainLocation] = useState('');
  const [painType, setPainType]         = useState([]);
  const [interference, setInterference] = useState(Object.fromEntries(
    INTERFERENCE_ITEMS.map(i => [i.key, 0])
  ));
  const [currentMedications, setCurrentMedications]         = useState('');
  const [medicationEffectiveness, setMedicationEffectiveness] = useState(5);
  const [notes, setNotes] = useState('');

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => (await apiClient.get(`/api/patients/${patientId}`)).data,
  });

  const toggleType = (type) =>
    setPainType(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);

  const avgInterference = (Object.values(interference).reduce((s, v) => s + v, 0) / INTERFERENCE_ITEMS.length).toFixed(1);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      if (!navigator.onLine) { await offlineStorage.saveOffline('pain', data); return { offline: true }; }
      return apiClient.post('/api/assessments/pain', data);
    },
    onSuccess: (res) => {
      if (res.offline) toast.success('Saved offline — will sync when online', { duration: 5000 });
      else {
        toast.success('Pain assessment saved');
        if (res.data.alerts_generated?.length > 0)
          toast.error(`${res.data.alerts_generated.length} alert(s) generated`, { duration: 5000 });
      }
      queryClient.invalidateQueries(['pain', patientId]);
      queryClient.invalidateQueries(['assessment-overview', patientId]);
      setTimeout(() => navigate(`/assessments/${patientId}`), 1500);
    },
    onError: () => toast.error('Failed to save assessment'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!painLocation.trim()) { toast.error('Please describe the pain location'); return; }
    submitMutation.mutate({
      patient_id: parseInt(patientId),
      pain_worst: painWorst, pain_least: painLeast,
      pain_average: painAverage, pain_current: painCurrent,
      pain_location: painLocation, pain_type: painType.join(', '),
      ...interference,
      current_medications: currentMedications,
      medication_effectiveness: medicationEffectiveness,
      notes,
    });
  };

  return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/african/african-vitals.jpg"
        title="Brief Pain Inventory"
        subtitle={`Comprehensive Pain Assessment${patient?.full_name ? ` · ${patient.full_name}` : ''}`}
        icon={Zap}
        stats={[
          { label: 'Worst Pain',   value: `${painWorst}/10`, color: painWorst > 6 ? '#f87171' : '#2dd4bf' },
          { label: 'Avg Interference', value: `${avgInterference}/10`, color: parseFloat(avgInterference) > 5 ? '#fbbf24' : '#2dd4bf' },
        ]}
      >
        <button onClick={() => navigate(`/assessments/${patientId}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--page-bg)] hover:bg-[var(--card-border)] text-[var(--text-700)] rounded-lg border border-[var(--card-border)] text-xs font-semibold transition">
          <ChevronLeft size={14} /> Assessments
        </button>
        {!navigator.onLine && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-700">
            <WifiOff size={13} /> Offline — will sync
          </span>
        )}
      </PageHeader>

      <div className="max-w-[760px] mx-auto px-4 py-5 space-y-4">
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 rounded-xl border border-red-200">
          <Zap size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">
            Rate pain <strong>in the last 24 hours</strong>. 0 = no pain, 10 = pain as bad as you can imagine.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Pain Severity */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4 space-y-4">
            <p className="text-xs font-bold text-[var(--text-500)] uppercase tracking-wider flex items-center gap-2">
              <Zap size={13} className="text-red-500" /> Pain Severity
            </p>
            <PainSlider label="Worst pain in the last 24 hours"  value={painWorst}   onChange={setPainWorst} />
            <PainSlider label="Least pain in the last 24 hours"  value={painLeast}   onChange={setPainLeast} />
            <PainSlider label="Average pain in the last 24 hours" value={painAverage} onChange={setPainAverage} />
            <PainSlider label="Pain right now"                    value={painCurrent} onChange={setPainCurrent} />
          </div>

          {/* Pain Location */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <p className="text-xs font-bold text-[var(--text-500)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin size={13} className="text-red-500" /> Pain Location <span className="text-red-500">*</span>
            </p>
            <VoiceInput value={painLocation} onChange={setPainLocation}
              placeholder="Describe where it hurts (e.g. lower back, right hip, chest)…"
              className="w-full px-3 py-2 text-sm border border-[var(--card-border)] rounded-lg bg-[var(--page-bg)] text-[var(--text-800)] focus:border-red-400 focus:outline-none" />
          </div>

          {/* Pain Type */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <p className="text-xs font-bold text-[var(--text-500)] uppercase tracking-wider mb-3">
              Pain Character <span className="font-normal text-[var(--text-400)]">(select all that apply)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {PAIN_TYPES.map(type => (
                <button key={type} type="button" onClick={() => toggleType(type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    painType.includes(type)
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-[var(--page-bg)] text-[var(--text-600)] border-[var(--card-border)] hover:border-red-300'
                  }`}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Interference */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-[var(--text-500)] uppercase tracking-wider">Pain Interference with Life</p>
              <span className="text-sm font-bold text-[var(--text-600)]">Avg: {avgInterference}/10</span>
            </div>
            <div className="space-y-4">
              {INTERFERENCE_ITEMS.map(({ key, label, Icon }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 border border-[var(--card-border)] flex items-center justify-center flex-shrink-0">
                    <Icon size={13} className="text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-[var(--text-700)]">{label}</p>
                      <span className="text-sm font-black tabular-nums text-orange-600">{interference[key]}</span>
                    </div>
                    <div className="relative">
                      <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
                        {[...Array(10)].map((_, i) => (
                          <div key={i} className="flex-1 rounded-sm transition-all"
                            style={{ backgroundColor: i < interference[key] ? '#f97316' : 'var(--card-border)' }} />
                        ))}
                      </div>
                      <input type="range" min="0" max="10" value={interference[key]}
                        onChange={e => setInterference(p => ({ ...p, [key]: parseInt(e.target.value) }))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" aria-label={label} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medication */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4 space-y-3">
            <p className="text-xs font-bold text-[var(--text-500)] uppercase tracking-wider">Pain Management</p>
            <div>
              <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">
                Current Pain Medications <span className="font-normal text-[var(--text-400)]">(optional)</span>
              </label>
              <textarea value={currentMedications} onChange={e => setCurrentMedications(e.target.value)} rows={2}
                placeholder="List current pain medications…"
                className="w-full px-3 py-2 text-sm border border-[var(--card-border)] rounded-lg bg-[var(--page-bg)] text-[var(--text-800)] focus:border-red-400 focus:outline-none resize-none" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-[var(--text-700)]">Medication Effectiveness</label>
                <span className="text-sm font-black text-teal-600">{medicationEffectiveness}%</span>
              </div>
              <input type="range" min="0" max="100" step="5" value={medicationEffectiveness}
                onChange={e => setMedicationEffectiveness(parseInt(e.target.value))}
                className="w-full accent-teal-600" aria-label="Medication effectiveness" />
              <div className="flex justify-between text-[10px] text-[var(--text-400)] mt-0.5">
                <span>0% — No relief</span><span>100% — Complete relief</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <label className="block text-sm font-semibold text-[var(--text-700)] mb-2">
              Additional Notes <span className="font-normal text-[var(--text-400)]">(optional)</span>
            </label>
            <VoiceInput value={notes} onChange={setNotes} rows={3}
              placeholder="Additional clinical observations…"
              className="w-full px-3 py-2 text-sm border border-[var(--card-border)] rounded-lg bg-[var(--page-bg)] text-[var(--text-800)] focus:border-red-400 focus:outline-none resize-none" />
          </div>

          <FormFileUpload category="documents" label="Supporting Documentation"
            description="Attach pain diagrams, imaging, or reports"
            accept="image/*,video/*,.pdf,.doc,.docx" multiple maxSizeMB={50} />

          <div className="flex gap-3">
            <button type="submit" disabled={submitMutation.isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50">
              <Save size={15} />
              {submitMutation.isLoading ? 'Saving…' : 'Save Pain Assessment'}
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
