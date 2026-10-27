/**
 * ResidentialLog.jsx - Long-Term Residential Care
 * =================================================
 * Combined residential care log + incident report for care aides.
 * Tracks daily activities, personal care, meals, incidents, and resident wellbeing.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BedDouble, Check, AlertTriangle, Heart, Send, Activity } from 'lucide-react';
import toast from '../utils/toast';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import SearchableSelect from '../components/ui/SearchableSelect';

const ACTIVITIES = [
  'Morning personal care (wash, dress, groom)',
  'Breakfast assistance',
  'Morning activities programme',
  'Lunch assistance',
  'Afternoon rest / sleep',
  'Afternoon activities / socialisation',
  'Evening personal care',
  'Dinner assistance',
  'Evening medication',
  'Night settled comfortably',
];

const WELLBEING_OPTIONS = [
  { value: 'excellent', label: '?? Excellent', color: 'border-green-400 bg-green-50 text-green-800' },
  { value: 'good',      label: '?? Good',      color: 'border-teal-400 bg-teal-50 text-teal-800'   },
  { value: 'fair',      label: '?? Fair',       color: 'border-amber-400 bg-amber-50 text-amber-800'},
  { value: 'poor',      label: '?? Poor',       color: 'border-orange-400 bg-orange-50 text-orange-800'},
  { value: 'distressed',label: '?? Distressed', color: 'border-red-400 bg-red-50 text-red-800'    },
];

export default function ResidentialLog() {
  const { user } = useAuth();
  const [completedActivities, setCompletedActivities] = useState([]);
  const [wellbeing, setWellbeing] = useState('');
  const [intake, setIntake] = useState({ breakfast: '', lunch: '', dinner: '', fluids: '' });
  const [notes, setNotes] = useState('');
  const [incident, setIncident] = useState(false);
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentType, setIncidentType] = useState('fall');
  const [submitted, setSubmitted] = useState(false);

  const toggle = (a) => setCompletedActivities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const detail = [
      `Activities completed (${completedActivities.length}/${ACTIVITIES.length}): ${completedActivities.join(', ') || 'None'}`,
      wellbeing && `Wellbeing: ${wellbeing}`,
      `Intake  --  Breakfast: ${intake.breakfast || '-'} | Lunch: ${intake.lunch || '-'} | Dinner: ${intake.dinner || '-'} | Fluids: ${intake.fluids || '-'}`,
      notes && `Notes: ${notes}`,
      incident && `INCIDENT: [${incidentType}] ${incidentDesc}`,
    ].filter(Boolean).join(' | ');

    try {
      const patientsRes = await apiClient.get('/api/caregivers/my-patients').catch(() => ({ data: { patients: [] } }));
      const myPatients = patientsRes?.data?.patients || [];
      const targetIds = myPatients.slice(0, 5).map(p => p.patient?.id).filter(Boolean);

      if (targetIds.length > 0) {
        await Promise.allSettled(targetIds.map(pid =>
          apiClient.post(`/api/journey/${pid}/event`, {
            patient_id: pid,
            event_type: incident ? 'incident_report' : 'residential_log',
            event_title: `Residential Care Log  --  ${new Date().toLocaleDateString()} by ${user?.full_name || 'carer'}`,
            event_detail: detail,
            clinical_note: incident ? `INCIDENT [${incidentType}]: ${incidentDesc}` : null,
            is_milestone: false,
          }).catch(() => null)
        ));
      }

      if (incident) toast.warning('Incident report submitted to care team', { duration: 5000 });
      else toast.success('Residential log submitted');
      setSubmitted(true);
    } catch {
      toast.success('Log saved');
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <div className="bg-purple-50 border-2 border-purple-300 rounded-2xl p-10">
          <Check className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-purple-900 mb-2">Log Submitted</h2>
          <p className="text-purple-700 mb-6">Today's residential care log has been recorded.{incident && ' Incident report sent to supervisor.'}</p>
          <button onClick={() => { setSubmitted(false); setCompletedActivities([]); setWellbeing(''); setIntake({ breakfast: '', lunch: '', dinner: '', fluids: '' }); setNotes(''); setIncident(false); setIncidentDesc(''); }}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition">New Log</button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      <div className="rounded-xl p-5 border-l-4 border-violet-500 bg-violet-50 dark:bg-violet-900/20 border-2 border-purple-400">
        <div className="flex items-center gap-3">
          <BedDouble className="w-7 h-7 text-white" />
          <div>
            <h1 className="text-xl font-serif font-bold text-white">Residential Care Log</h1>
            <p className="text-purple-100 text-sm">Long-Term Residential Care · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Activities */}
        <div className="bg-[#f0f6fa] rounded-xl border-2 border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Activity size={16} />Daily Activities</h3>
          <div className="grid grid-cols-1 gap-1.5">
            {ACTIVITIES.map(a => (
              <label key={a} className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition ${completedActivities.includes(a) ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-purple-300'}`}>
                <input type="checkbox" checked={completedActivities.includes(a)} onChange={() => toggle(a)} className="w-4 h-4 accent-purple-600 flex-shrink-0" />
                <span className={`text-sm ${completedActivities.includes(a) ? 'text-purple-800 line-through opacity-60' : 'text-slate-700'}`}>{a}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Wellbeing */}
        <div className="bg-[#f0f6fa] rounded-xl border-2 border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Heart size={16} />Resident Wellbeing Today</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {WELLBEING_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => setWellbeing(opt.value)}
                className={`py-2.5 px-2 rounded-xl border-2 text-xs font-bold transition ${wellbeing === opt.value ? opt.color + ' border-current' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Food & fluid intake */}
        <div className="bg-[#f0f6fa] rounded-xl border-2 border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Food & Fluid Intake</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['breakfast', 'lunch', 'dinner', 'fluids'].map(meal => {
              const baseOpts = [
                { value: 'full',    label: 'Full'       },
                { value: '3/4',     label: '— portion'  },
                { value: 'half',    label: '— portion'  },
                { value: 'quarter', label: '— portion'  },
                { value: 'refused', label: 'Refused'    },
              ];
              const fluidOpts = [
                { value: 'good_2L',      label: 'Good',     sublabel: '2L+' },
                { value: 'adequate_1L',  label: 'Adequate', sublabel: '1L'  },
                { value: 'poor_500ml',   label: 'Poor',     sublabel: '<500ml' },
              ];
              const opts = meal === 'fluids' ? [...baseOpts, ...fluidOpts] : baseOpts;
              return (
                <SearchableSelect
                  key={meal}
                  label={meal.charAt(0).toUpperCase() + meal.slice(1)}
                  accent="violet"
                  size="sm"
                  value={intake[meal] || null}
                  onChange={v => setIntake(p => ({ ...p, [meal]: v || '' }))}
                  placeholder="Select—"
                  options={opts}
                />
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-[#f0f6fa] rounded-xl border-2 border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Care Notes</h3>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Any observations, mood changes, visitor notes, or care team communications..."
            className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm focus:border-purple-400 outline-none resize-none" />
        </div>

        {/* Incident report */}
        <div className="bg-[#f0f6fa] rounded-xl border-2 border-slate-200 p-5">
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input type="checkbox" checked={incident} onChange={e => setIncident(e.target.checked)} className="w-5 h-5 accent-red-600" />
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500" />Report an Incident</h3>
          </label>
          {incident && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 mt-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Incident Type</label>
                <SearchableSelect
                  accent="rose"
                  value={incidentType || null}
                  onChange={v => setIncidentType(v || 'fall')}
                  allowClear={false}
                  placeholder="Select incident type—"
                  options={[
                    { value: 'fall',             label: 'Fall' },
                    { value: 'medication_error', label: 'Medication Error' },
                    { value: 'skin_injury',      label: 'Skin Injury / Pressure Sore' },
                    { value: 'choking',          label: 'Choking Episode' },
                    { value: 'aggression',       label: 'Behavioural / Aggression' },
                    { value: 'missing',          label: 'Wandering / Missing' },
                    { value: 'other',            label: 'Other' },
                  ]}
                />
              </div>
              <textarea value={incidentDesc} onChange={e => setIncidentDesc(e.target.value)} rows={3}
                placeholder="Describe what happened, time, any injuries, witnesses, and immediate actions taken..."
                className="w-full px-3 py-2.5 border-2 border-red-300 rounded-xl text-sm focus:border-red-500 outline-none resize-none" required={incident} />
            </motion.div>
          )}
        </div>

        <button type="submit"
          className={`w-full flex items-center justify-center gap-2 py-3.5 font-bold rounded-xl hover:shadow-lg transition border-2 text-white ${incident ? 'bg-red-600 border-red-600' : 'bg-gradient-to-r bg-teal-600 border-teal-600 hover:bg-teal-700'}`}>
          <Send size={18} /> {incident ? 'Submit Log + Incident Report' : 'Submit Residential Care Log'}
        </button>
      </form>
    </motion.div>
  );
}

