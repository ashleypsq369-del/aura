/**
 * FamilyConsentSettings.jsx
 * Patients control exactly which categories of their health data
 * family members are allowed to view.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Heart, Pill, Activity, Calendar, FileText,
  Brain, BookOpen, CheckCircle, AlertCircle, Info,
  Users, Lock, Unlock, Save, RefreshCw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import toast from '../utils/toast';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  {
    key: 'vitals',
    label: 'Vital Signs',
    desc: 'Blood pressure, heart rate, oxygen levels, temperature',
    icon: Activity,
    iconBg: '#fee2e2', iconColor: '#dc2626',
    sensitivity: 'medium',
  },
  {
    key: 'medications',
    label: 'Medications',
    desc: 'Current medications, dosages, and schedules',
    icon: Pill,
    iconBg: '#dbeafe', iconColor: '#1d4ed8',
    sensitivity: 'medium',
  },
  {
    key: 'symptoms',
    label: 'Symptom Scores',
    desc: 'ESAS symptom ratings — pain, fatigue, nausea, etc.',
    icon: Heart,
    iconBg: '#ffedd5', iconColor: '#c2410c',
    sensitivity: 'medium',
  },
  {
    key: 'appointments',
    label: 'Appointments',
    desc: 'Scheduled clinic visits and care team meetings',
    icon: Calendar,
    iconBg: '#ccfbf1', iconColor: '#0f766e',
    sensitivity: 'low',
  },
  {
    key: 'care_plan',
    label: 'Care Plan',
    desc: 'Goals of care, interventions, and care notes',
    icon: FileText,
    iconBg: '#e0e7ff', iconColor: '#3730a3',
    sensitivity: 'high',
  },
  {
    key: 'assessments',
    label: 'Clinical Assessments',
    desc: 'Depression, anxiety, cognition, and function scores',
    icon: Brain,
    iconBg: '#f3e8ff', iconColor: '#7e22ce',
    sensitivity: 'high',
  },
  {
    key: 'daily_notes',
    label: 'Daily Care Notes',
    desc: 'Caregiver daily logs, mood, appetite, activity',
    icon: BookOpen,
    iconBg: '#dcfce7', iconColor: '#15803d',
    sensitivity: 'medium',
  },
  {
    key: 'ai_insights',
    label: 'AI Insights',
    desc: 'Risk scores and AI-generated care recommendations',
    icon: Brain,
    iconBg: '#ede9fe', iconColor: '#6d28d9',
    sensitivity: 'high',
  },
];

const SENSITIVITY_LABEL = {
  low:    { label: 'Low sensitivity',    style: { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' } },
  medium: { label: 'Medium sensitivity', style: { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' } },
  high:   { label: 'High sensitivity',  style: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' } },
};

export default function FamilyConsentSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [consent, setConsent] = useState({});
  const [dirty, setDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['my-consent'],
    queryFn: async () => (await apiClient.get('/api/consent/my')).data,
    enabled: user?.role === 'patient',
  });

  // Sync fetched consent into local state
  useEffect(() => {
    if (data?.consent) setConsent(data.consent);
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (payload) => apiClient.put('/api/consent/my', payload),
    onSuccess: (res) => {
      setConsent(res.data.consent);
      setDirty(false);
      queryClient.invalidateQueries(['my-consent']);
      toast.success('Consent settings saved');
    },
    onError: () => toast.error('Failed to save — please try again'),
  });

  const toggle = (key) => {
    setConsent(prev => ({ ...prev, [key]: !prev[key] }));
    setDirty(true);
  };

  const setAll = (val) => {
    const all = Object.fromEntries(CATEGORIES.map(c => [c.key, val]));
    setConsent(all);
    setDirty(true);
  };

  const handleSave = () => mutation.mutate(consent);

  const grantedCount = CATEGORIES.filter(c => consent[c.key]).length;

  if (user?.role !== 'patient') {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        Family consent settings are only available to patients.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-gradient-to-br from-teal-600 to-indigo-600 rounded-2xl p-5 text-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base mb-1">Family Data Sharing</h2>
            <p className="text-sm text-white/80 leading-relaxed">
              You are in control. Choose exactly which parts of your health information your family members can see. You can change or withdraw consent at any time.
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            grantedCount === 0 ? 'bg-white/10 text-white/70' : 'bg-white/20 text-white'
          }`}>
            {grantedCount === 0 ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {grantedCount === 0 ? 'No access granted' : `${grantedCount} of ${CATEGORIES.length} categories shared`}
          </div>
        </div>
      </div>

      {/* Legal note */}
      <div className="flex items-start gap-2 rounded-xl px-4 py-3 text-xs font-medium"
        style={{ background: '#eff6ff', border: '1px solid #93c5fd', color: '#1e3a8a' }}>
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#1d4ed8' }} />
        <span>Family members can only <strong>view</strong> data you share — they cannot edit, delete, or add to your records. Sensitive notes (spiritual care, mental health assessments) are never shared regardless of settings.</span>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAll(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-teal-300 dark:border-teal-600 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 text-xs font-semibold hover:bg-teal-100 dark:hover:bg-teal-900/30 transition"
        >
          <Unlock className="w-3 h-3" /> Grant all
        </button>
        <button
          type="button"
          onClick={() => setAll(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <Lock className="w-3 h-3" /> Revoke all
        </button>
      </div>

      {/* Category toggles */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-200 dark:divide-slate-700"
        style={{ border: '1px solid #d1d5db' }}>
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon;
          const granted = !!consent[cat.key];
          const sens = SENSITIVITY_LABEL[cat.sensitivity];
          return (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 px-5 py-4"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: cat.iconBg }}>
                <Icon style={{ color: cat.iconColor }} className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{cat.label}</p>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                    style={sens.style}
                  >{sens.label}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{cat.desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={granted}
                aria-label={`${granted ? 'Revoke' : 'Grant'} family access to ${cat.label}`}
                onClick={() => toggle(cat.key)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
                  granted ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  granted ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl px-4 py-3 text-center"
          style={{ border: '1px solid #d1d5db' }}>
          <div className="text-2xl font-bold text-teal-600">{grantedCount}</div>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">Categories shared</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl px-4 py-3 text-center"
          style={{ border: '1px solid #d1d5db' }}>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{CATEGORIES.length - grantedCount}</div>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">Categories private</div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center justify-between">
        {dirty && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Unsaved changes
          </p>
        )}
        <div className={dirty ? 'ml-auto' : 'w-full'}>
          <button
            type="button"
            onClick={handleSave}
            disabled={mutation.isLoading || !dirty}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition w-full justify-center"
          >
            {mutation.isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {mutation.isLoading ? 'Saving...' : dirty ? 'Save Consent Settings' : 'Settings Saved'}
          </button>
        </div>
      </div>

      {/* What family can see */}
      {grantedCount > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
            <CheckCircle className="w-4 h-4" />
            Your family can currently see:
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter(c => consent[c.key]).map(c => (
              <span key={c.key} className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                {c.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {grantedCount === 0 && !isLoading && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-medium"
          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569' }}>
          <Lock className="w-4 h-4 flex-shrink-0" />
          Family members currently cannot see any of your health data. Toggle categories above to share specific information.
        </div>
      )}
    </div>
  );
}
