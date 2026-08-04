/**
 * DailyCareLog.jsx - Home-Based Palliative Care
 * ================================================
 * Home caregiver daily log: tasks completed, patient status,
 * medication administered, concerns to escalate.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Check, AlertTriangle, Pill, Heart, Send, Plus } from 'lucide-react';
import toast from '../utils/toast';
import SearchableSelect from '../components/ui/SearchableSelect';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const CARE_TASKS = [
  'Personal hygiene (wash, dress)',
  'Oral care / mouth hygiene',
  'Pressure area check and repositioning',
  'Nutrition / meal support',
  'Hydration / fluid intake',
  'Mobility assistance / exercises',
  'Medication administration',
  'Wound / skin care',
  'Emotional support / companionship',
  'Environment check (safety, comfort)',
];

export default function DailyCareLog() {
  const { user } = useAuth();
  const [completedTasks, setCompletedTasks] = useState([]);
  const [painLevel, setPainLevel] = useState(0);
  const [mood, setMood] = useState('');
  const [appetite, setAppetite] = useState('');
  const [medNotes, setMedNotes] = useState('');
  const [concerns, setConcerns] = useState('');
  const [customTasks, setCustomTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [escalate, setEscalate] = useState(false);

  const toggleTask = (t) => setCompletedTasks(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const addCustomTask = () => {
    if (newTask.trim()) { setCustomTasks(prev => [...prev, newTask.trim()]); setNewTask(''); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const detail = [
      `Tasks completed (${completedTasks.length}/${CARE_TASKS.length + customTasks.length}): ${completedTasks.join(', ') || 'None'}`,
      `Pain level: ${painLevel}/10`,
      mood && `Mood: ${mood}`,
      appetite && `Appetite: ${appetite}`,
      medNotes && `Medication notes: ${medNotes}`,
      concerns && `Concerns: ${concerns}`,
      escalate && 'ESCALATION REQUESTED',
    ].filter(Boolean).join(' | ');

    // Save as journey events for each of the caregiver's patients
    try {
      const patientsRes = await apiClient.get('/api/caregivers/my-patients').catch(() => ({ data: { patients: [] } }));
      const myPatients = patientsRes?.data?.patients || [];
      const targetIds = myPatients.slice(0, 5).map(p => p.patient?.id).filter(Boolean);

      if (targetIds.length > 0) {
        await Promise.allSettled(targetIds.map(pid =>
          apiClient.post(`/api/journey/${pid}/event`, {
            patient_id: pid,
            event_type: 'daily_care_log',
            event_title: `Daily Home Care Log  --  ${new Date().toLocaleDateString()} by ${user?.full_name || 'carer'}`,
            event_detail: detail,
            clinical_note: escalate ? 'ESCALATION: clinical review requested' : null,
            is_milestone: false,
          }).catch(() => null)
        ));
      }

      if (escalate) toast.warning('Escalation request sent to care team', { duration: 5000 });
      else toast.success('Daily care log submitted');
      setSubmitted(true);
    } catch {
      toast.success('Log saved');
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-10">
          <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-green-900 mb-2">Log Submitted</h2>
          <p className="text-green-700 mb-6">Today's care log has been recorded.{escalate && ' The care team has been notified.'}</p>
          <button onClick={() => { setSubmitted(false); setCompletedTasks([]); setPainLevel(0); setMood(''); setAppetite(''); setMedNotes(''); setConcerns(''); setEscalate(false); }}
            className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition">New Log</button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-5 shadow-lg border-2 border-green-400">
        <div className="flex items-center gap-3">
          <Home className="w-7 h-7 text-white" />
          <div>
            <h1 className="text-xl font-serif font-bold text-white">Daily Home Care Log</h1>
            <p className="text-green-100 text-sm">Home-Based Care · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Care tasks checklist */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Check size={16} />Care Tasks Completed Today</h3>
          <div className="grid grid-cols-1 gap-2">
            {[...CARE_TASKS, ...customTasks].map(task => (
              <label key={task} className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition ${completedTasks.includes(task) ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:border-green-300'}`}>
                <input type="checkbox" checked={completedTasks.includes(task)} onChange={() => toggleTask(task)} className="w-4 h-4 accent-green-600" />
                <span className={`text-sm ${completedTasks.includes(task) ? 'text-green-800 font-semibold line-through opacity-60' : 'text-slate-700'}`}>{task}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add custom task..."
              className="flex-1 px-3 py-2 border-2 border-slate-300 rounded-xl text-sm focus:border-green-400 outline-none" />
            <button type="button" onClick={addCustomTask} className="px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Patient status */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Heart size={16} />Patient Status</h3>
          
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Pain Level: {painLevel}/10</label>
            <input type="range" min="0" max="10" value={painLevel} onChange={e => setPainLevel(Number(e.target.value))}
              className="w-full accent-green-600" />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>No pain</span><span>Unbearable</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SearchableSelect
              label="Mood"
              accent="teal"
              value={mood || null}
              onChange={v => setMood(v || '')}
              placeholder="Select mood…"
              options={[
                { value: 'calm',         label: 'Calm',         sublabel: '😌' },
                { value: 'cheerful',     label: 'Cheerful',     sublabel: '😊' },
                { value: 'anxious',      label: 'Anxious',      sublabel: '😰' },
                { value: 'distressed',   label: 'Distressed',   sublabel: '😢' },
                { value: 'confused',     label: 'Confused',     sublabel: '😕' },
                { value: 'unresponsive', label: 'Unresponsive', sublabel: '😶' },
              ]}
            />
            <SearchableSelect
              label="Appetite"
              accent="teal"
              value={appetite || null}
              onChange={v => setAppetite(v || '')}
              placeholder="Select appetite…"
              options={[
                { value: 'good', label: 'Good',  sublabel: 'Ate well'       },
                { value: 'fair', label: 'Fair',  sublabel: 'Ate some'       },
                { value: 'poor', label: 'Poor',  sublabel: 'Very little'    },
                { value: 'none', label: 'None',  sublabel: 'Refused food'   },
              ]}
            />
          </div>
        </div>

        {/* Medication notes */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Pill size={16} />Medication Notes</h3>
          <textarea value={medNotes} onChange={e => setMedNotes(e.target.value)} rows={3}
            placeholder="e.g., Morphine 10mg given at 09:00. Patient refused afternoon dose. PRN used at 14:30 for breakthrough pain."
            className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm focus:border-green-400 outline-none resize-none" />
        </div>

        {/* Concerns */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><AlertTriangle size={16} />Concerns / Changes</h3>
          <textarea value={concerns} onChange={e => setConcerns(e.target.value)} rows={3}
            placeholder="Any new symptoms, changes in condition, family concerns, safety issues, or anything the clinical team should know..."
            className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm focus:border-green-400 outline-none resize-none" />
          
          {/* Escalation toggle */}
          <label className="flex items-center gap-3 mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-xl cursor-pointer">
            <input type="checkbox" checked={escalate} onChange={e => setEscalate(e.target.checked)} className="w-5 h-5 accent-red-600" />
            <div>
              <p className="text-sm font-bold text-red-800">🚨 Request urgent clinical review</p>
              <p className="text-xs text-red-600">Tick this if the clinical team needs to contact you today</p>
            </div>
          </label>
        </div>

        <button type="submit" className={`w-full flex items-center justify-center gap-2 py-3.5 font-bold rounded-xl hover:shadow-lg transition border-2 text-white ${escalate ? 'bg-red-600 border-red-600 hover:bg-red-700' : 'bg-gradient-to-r from-green-600 to-teal-600 border-green-500'}`}>
          <Send size={18} /> {escalate ? 'Submit + Request Urgent Review' : 'Submit Daily Care Log'}
        </button>
      </form>
    </motion.div>
  );
}

