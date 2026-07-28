/**
 * WellnessCheckin.jsx
 * Daily "how are you feeling" form for patients.
 * Submits to POST /api/assessments/esas
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Heart, Activity, Moon, Zap, Wind,
  Brain, AlertCircle, Smile, CheckCircle2, ChevronLeft, TrendingDown, TrendingUp, Minus
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/toast';
import PageHeader from '../components/PageHeader';
import { fireMilestone } from '../components/MilestoneConfetti';
import Progress from '../components/ui/Progress';
import { mlAPI } from '../api/client';

import { API_URL } from '../api/client';

// Each item maps to an ESAS field
const ITEMS = [
  { key: 'pain',               label: 'Pain',               icon: Zap,          color: 'rose',    desc: 'How much pain are you feeling right now?' },
  { key: 'tiredness',          label: 'Tiredness',          icon: Moon,         color: 'indigo',  desc: 'How tired or exhausted do you feel?' },
  { key: 'nausea',             label: 'Nausea',             icon: AlertCircle,  color: 'amber',   desc: 'How much nausea are you experiencing?' },
  { key: 'depression',         label: 'Low Mood',           icon: Brain,        color: 'purple',  desc: 'How low, sad or depressed are you feeling?' },
  { key: 'anxiety',            label: 'Anxiety',            icon: Activity,     color: 'orange',  desc: 'How anxious or worried are you feeling?' },
  { key: 'shortness_of_breath',label: 'Breathlessness',     icon: Wind,         color: 'sky',     desc: 'How short of breath are you feeling?' },
  { key: 'lack_of_appetite',   label: 'Appetite',           icon: Heart,        color: 'teal',    desc: 'How much has your appetite been affected? (0 = normal)' },
  { key: 'wellbeing',          label: 'Overall Wellbeing',  icon: Smile,        color: 'emerald', desc: 'How would you rate your overall sense of wellbeing? (0 = best)' },
];

const COLORS = {
  rose:    { bg: 'bg-rose-500',    light: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    fill: '#f43f5e' },
  indigo:  { bg: 'bg-indigo-500',  light: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700',  fill: '#6366f1' },
  amber:   { bg: 'bg-amber-500',   light: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   fill: '#f59e0b' },
  purple:  { bg: 'bg-purple-500',  light: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-700',  fill: '#a855f7' },
  orange:  { bg: 'bg-orange-500',  light: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  fill: '#f97316' },
  sky:     { bg: 'bg-sky-500',     light: 'bg-sky-50',     border: 'border-sky-200',     text: 'text-sky-700',     fill: '#0ea5e9' },
  teal:    { bg: 'bg-teal-500',    light: 'bg-teal-50',    border: 'border-teal-200',    text: 'text-teal-700',    fill: '#14b8a6' },
  emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', fill: '#10b981' },
};

const SCORE_LABELS = ['None', '', '', 'Mild', '', '', 'Moderate', '', '', 'Severe', 'Worst'];

function ScoreButton({ value, selected, color, onClick }) {
  const c = COLORS[color];
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`w-9 h-9 rounded-full text-sm font-bold border-2 transition-all ${
        selected
          ? `${c.bg} text-white border-transparent shadow-md scale-110`
          : `bg-white border-slate-200 text-slate-500 hover:border-slate-400`
      }`}
    >
      {value}
    </button>
  );
}

export default function WellnessCheckin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const patientId = user?.patient_id || user?.id;

  const [scores, setScores] = useState(
    Object.fromEntries(ITEMS.map(i => [i.key, null]))
  );
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Fetch previous check-ins for P6 trend comparison
  const { data: previousCheckins } = useQuery({
    queryKey: ['wellness-history', patientId],
    queryFn: () =>
      axios.get(`${API_URL}/api/assessments/esas/${patientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      }).then(r => r.data),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // ML risk query — always enabled so data is ready when success screen shows
  const { data: mlRisk } = useQuery({
    queryKey: ['wellness-ml-risk', patientId],
    queryFn: () => mlAPI.getPatientRisk(patientId).then(r => r.data),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (payload) =>
      axios.post(`${API_URL}/api/assessments/esas`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      }),
    onSuccess: () => {
      fireMilestone('hearts'); // Celebrate completing daily check-in
      setSubmitted(true);
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Could not save check-in. Please try again.'),
  });

  const allAnswered = ITEMS.every(i => scores[i.key] !== null);

  const handleSubmit = () => {
    if (!allAnswered) {
      toast.error('Please rate all items before submitting.');
      return;
    }
    submitMutation.mutate({
      patient_id: patientId,
      pain:                 scores.pain,
      tiredness:            scores.tiredness,
      drowsiness:           0,
      nausea:               scores.nausea,
      lack_of_appetite:     scores.lack_of_appetite,
      depression:           scores.depression,
      anxiety:              scores.anxiety,
      shortness_of_breath:  scores.shortness_of_breath,
      wellbeing:            scores.wellbeing,
      completed_by_proxy:   false,
      notes:                notes.trim() || null,
    });
  };

  // Success screen
  if (submitted) {
    const avgScore = (Object.values(scores).reduce((a, b) => a + b, 0) / ITEMS.length).toFixed(1);
    const feeling = avgScore <= 3 ? 'good' : avgScore <= 6 ? 'moderate' : 'difficult';
    const msg = {
      good:       "You're doing well today - keep it up!",
      moderate:   "Thank you for checking in. Your care team has been notified.",
      difficult:  "We see you're having a tough day. Your care team will follow up with you.",
    }[feeling];

    // P6: Compare with previous check-in
    const prevCheckins = Array.isArray(previousCheckins) ? previousCheckins : previousCheckins?.assessments || [];
    const prev = prevCheckins?.[0]; // most recent before this one
    const prevAvg = prev
      ? ((prev.pain || 0) + (prev.tiredness || 0) + (prev.nausea || 0) +
         (prev.depression || 0) + (prev.anxiety || 0) + (prev.shortness_of_breath || 0)) / 6
      : null;
    const delta = prevAvg !== null ? parseFloat(avgScore) - prevAvg : null;
    const improved = delta !== null && delta < -0.5;
    const worsened = delta !== null && delta > 0.5;

    return (
      <div className="min-h-full flex items-center justify-center p-6" >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-lg shadow-sm p-10 max-w-md w-full text-center border-2 border-emerald-200"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-base font-bold text-slate-900 mb-2">Check-in Recorded</h2>
          <p className="text-slate-600 mb-4">{msg}</p>

          {/* Today's score */}
          <div className="bg-emerald-50 rounded-xl p-4 mb-3 border border-emerald-100">
            <p className="text-sm text-emerald-700 font-semibold mb-2">Average symptom score: {avgScore} / 10</p>
            <Progress
              value={parseFloat(avgScore)}
              max={10}
              label="Overall symptom burden"
              showValue={false}
              size="md"
            />
          </div>

          {/* P6: Trend vs previous */}
          {delta !== null && (
            <div className={`rounded-xl p-3 mb-4 border flex items-center gap-3 ${
              improved ? 'bg-green-50 border-green-200' :
              worsened ? 'bg-red-50 border-red-200' :
              'bg-slate-50 border-slate-200'
            }`}>
              {improved ? <TrendingDown size={18} className="text-green-600 flex-shrink-0" /> :
               worsened ? <TrendingUp   size={18} className="text-red-600 flex-shrink-0"   /> :
                          <Minus        size={18} className="text-slate-500 flex-shrink-0" />}
              <div className="text-left">
                <p className={`text-xs font-bold ${improved ? 'text-green-700' : worsened ? 'text-red-700' : 'text-slate-600'}`}>
                  {improved ? `Improved by ${Math.abs(delta).toFixed(1)} points` :
                   worsened ? `Increased by ${Math.abs(delta).toFixed(1)} points` :
                   'Stable compared to last check-in'}
                </p>
                <p className="text-[11px] text-slate-400">
                  vs {prevAvg.toFixed(1)} last time · {prevCheckins.length} check-in{prevCheckins.length !== 1 ? 's' : ''} recorded
                </p>
              </div>
            </div>
          )}

          {/* ML feedback card — patient-friendly */}
          {mlRisk && mlRisk.overall_level !== 'unknown' && (() => {
            const friendlyLevel = {
              critical: { label: 'Your health needs attention today', color: 'bg-rose-50 border-rose-200', text: 'text-rose-800', dot: 'bg-rose-500 animate-pulse', emoji: '🔴' },
              high:     { label: 'Worth keeping an eye on', color: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500', emoji: '🟡' },
              moderate: { label: 'Managing reasonably well', color: 'bg-blue-50 border-blue-200', text: 'text-blue-800', dot: 'bg-blue-400', emoji: '🔵' },
              low:      { label: 'Feeling quite well today', color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500', emoji: '🟢' },
            }[mlRisk.overall_level] || { label: 'Check-in recorded', color: 'bg-slate-50 border-slate-200', text: 'text-slate-700', dot: 'bg-slate-400', emoji: '⚪' };

            const actions = (mlRisk.recommended_actions || []).slice(0, 2);

            return (
              <div className={`rounded-xl border p-4 mb-4 ${friendlyLevel.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${friendlyLevel.dot}`} />
                  <p className={`text-sm font-bold ${friendlyLevel.text}`}>
                    {friendlyLevel.emoji} {friendlyLevel.label}
                  </p>
                </div>
                {actions.length > 0 && (
                  <ul className="space-y-1">
                    {actions.map((action, i) => (
                      <li key={i} className={`text-xs flex items-start gap-1.5 ${friendlyLevel.text} opacity-80`}>
                        <span className="mt-0.5 flex-shrink-0">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-[10px] text-slate-400 mt-2">🧠 Powered by AI health analysis · shared with your care team</p>
              </div>
            );
          })()}

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/my-space')}
              className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition"
            >
              Back to My Space
            </button>
            <button
              onClick={() => { setSubmitted(false); setScores(Object.fromEntries(ITEMS.map(i => [i.key, null]))); setNotes(''); }}
              className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition"
            >
              Log Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // € Main form €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
  return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/african/african-wellbeing.jpg"
        title="Daily Wellness Check-in"
        subtitle="How are you feeling today? Rate each area from 0 (none) to 10 (worst)"
        icon={Heart}
      >
        <button
          onClick={() => navigate('/my-space')}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold border border-white/30 transition"
        >
          <ChevronLeft size={16} /> My Space
        </button>
      </PageHeader>

      <div className="p-6 max-w-2xl mx-auto">
        <div className="space-y-4">
          {ITEMS.map((item, idx) => {
            const c = COLORS[item.color];
            const Icon = item.icon;
            const val = scores[item.key];
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`bg-white rounded-2xl border-2 p-5 shadow-sm ${val !== null ? c.border : 'border-slate-200'}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-sm">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  {val !== null && (
                    <span className={`text-lg font-bold ${c.text}`}>{val}</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1">
                  {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                    <ScoreButton
                      key={n}
                      value={n}
                      selected={val === n}
                      color={item.color}
                      onClick={v => setScores(prev => ({ ...prev, [item.key]: v }))}
                    />
                  ))}
                </div>

                <div className="flex justify-between mt-1.5 px-1">
                  <span className="text-[10px] text-slate-400 font-medium">0 - None</span>
                  <span className="text-[10px] text-slate-400 font-medium">10 - Worst</span>
                </div>
              </motion.div>
            );
          })}

          {/* Notes */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ITEMS.length * 0.04 }}
            className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm"
          >
            <label className="block text-sm font-bold text-slate-900 mb-2">
              Anything else to share? <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Any concerns, changes, or messages for your care team..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition resize-none"
            />
            <p className="text-xs text-slate-400 text-right mt-1">{notes.length}/500</p>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: (ITEMS.length + 1) * 0.04 }}
          >
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitMutation.isPending}
              className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-base rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitMutation.isPending ? 'Saving...' : !allAnswered ? `Rate all items to continue (${ITEMS.filter(i => scores[i.key] !== null).length}/${ITEMS.length} done)` : 'Submit Check-in'}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}





