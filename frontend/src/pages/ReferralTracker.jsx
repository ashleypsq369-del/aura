import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Plus, ArrowLeft, Clock, CheckCircle, XCircle,
  AlertTriangle, RotateCcw, ChevronDown, ChevronUp, Edit3, Save
} from 'lucide-react';
import apiClient from '../api/client';
import toast from '../utils/toast';

const REFERRAL_TYPES = [
  { value: 'physiotherapy', label: 'Physiotherapy', color: 'blue' },
  { value: 'occupational_therapy', label: 'Occupational Therapy', color: 'purple' },
  { value: 'social_work', label: 'Social Work', color: 'green' },
  { value: 'chaplaincy', label: 'Chaplaincy / Spiritual Care', color: 'violet' },
  { value: 'dietitian', label: 'Dietitian', color: 'orange' },
  { value: 'speech_therapy', label: 'Speech & Language Therapy', color: 'sky' },
  { value: 'wound_care', label: 'Wound Care', color: 'rose' },
  { value: 'psychology', label: 'Psychology', color: 'indigo' },
  { value: 'palliative_specialist', label: 'Palliative Care Specialist', color: 'teal' },
  { value: 'traditional_healer_liaison', label: 'Traditional Healer Liaison', color: 'amber' },
  { value: 'legal_aid', label: 'Legal Aid / Social Support', color: 'slate' },
  { value: 'other', label: 'Other Specialist', color: 'gray' },
];

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     icon: Clock,         color: 'amber' },
  accepted:    { label: 'Accepted',    icon: CheckCircle,   color: 'blue' },
  in_progress: { label: 'In Progress', icon: RotateCcw,     color: 'teal' },
  completed:   { label: 'Completed',   icon: CheckCircle,   color: 'green' },
  declined:    { label: 'Declined',    icon: XCircle,       color: 'red' },
  cancelled:   { label: 'Cancelled',   icon: XCircle,       color: 'slate' },
};

const URGENCY_CONFIG = {
  routine:   { label: 'Routine',   color: 'slate' },
  urgent:    { label: 'Urgent',    color: 'amber' },
  emergency: { label: 'Emergency', color: 'red' },
};

export default function ReferralTracker() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({});

  const emptyForm = {
    referral_type: '',
    referral_reason: '',
    urgency: 'routine',
    priority: 'medium',
    clinical_goals: '',
    specific_concerns: '',
    referred_to_name: '',
    referred_to_team: '',
    referred_to_contact: '',
  };
  const [form, setForm] = useState(emptyForm);
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => (await apiClient.get(`/api/patients/${patientId}`)).data,
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals', patientId],
    queryFn: async () => {
      try { return (await apiClient.get(`/api/palliative/referrals/${patientId}`)).data; }
      catch { return []; }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => apiClient.post('/api/palliative/referrals', payload),
    onSuccess: () => {
      toast.success('Referral created');
      queryClient.invalidateQueries(['referrals', patientId]);
      queryClient.invalidateQueries(['assessment-overview', patientId]);
      setForm(emptyForm);
      setShowForm(false);
    },
    onError: () => toast.error('Failed to create referral'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => apiClient.put(`/api/palliative/referrals/${id}`, data),
    onSuccess: () => {
      toast.success('Referral updated');
      queryClient.invalidateQueries(['referrals', patientId]);
      setEditingId(null);
      setStatusUpdate({});
    },
    onError: () => toast.error('Failed to update referral'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.referral_type) return toast.error('Please select referral type');
    if (!form.referral_reason) return toast.error('Please enter a referral reason');
    createMutation.mutate({ patient_id: parseInt(patientId), ...form });
  };

  const handleStatusUpdate = (referralId) => {
    if (!statusUpdate.status) return toast.error('Please select a status');
    updateMutation.mutate({ id: referralId, data: statusUpdate });
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-[#e8fafa] dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
  const textareaCls = `${inputCls} resize-none`;

  const groupedReferrals = referrals.reduce((acc, r) => {
    const status = r.status || 'pending';
    if (!acc[status]) acc[status] = [];
    acc[status].push(r);
    return acc;
  }, {});

  const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-${cfg.color}-100 text-${cfg.color}-700 dark:bg-${cfg.color}-900/30 dark:text-${cfg.color}-300`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  const UrgencyBadge = ({ urgency }) => {
    const cfg = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.routine;
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium bg-${cfg.color}-100 text-${cfg.color}-700 dark:bg-${cfg.color}-900/30 dark:text-${cfg.color}-300`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/assessments/${patientId}`)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Send className="w-6 h-6 text-green-600" />
              Referral Tracker
            </h1>
            {patient && <p className="text-slate-500 dark:text-slate-400 text-sm">{patient.full_name}</p>}
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition"
        >
          <Plus className="w-4 h-4" /> New Referral
        </button>
      </div>

      {/* New Referral Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-[#e8fafa] dark:bg-slate-800 rounded-xl border border-green-200 dark:border-green-700 overflow-hidden"
          >
            <div className="px-5 py-3 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-700 flex items-center justify-between">
              <h3 className="font-semibold text-green-900 dark:text-green-100 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> New Referral
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-green-600 dark:text-green-400 hover:underline text-xs">Cancel</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Referral Type *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {REFERRAL_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => set('referral_type', t.value)}
                      className={`text-left px-3 py-2 rounded-lg border-2 text-sm transition ${
                        form.referral_type === t.value
                          ? `border-${t.color}-500 bg-${t.color}-50 dark:bg-${t.color}-900/30 font-medium`
                          : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Urgency</label>
                  <div className="flex gap-2">
                    {Object.entries(URGENCY_CONFIG).map(([val, cfg]) => (
                      <button key={val} type="button" onClick={() => set('urgency', val)}
                        className={`flex-1 py-1.5 rounded-lg text-sm border-2 transition ${
                          form.urgency === val
                            ? `border-${cfg.color}-500 bg-${cfg.color}-50 dark:bg-${cfg.color}-900/30 font-medium`
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                        }`}>
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Referred To</label>
                  <input className={inputCls} placeholder="Clinician / team name" value={form.referred_to_name} onChange={e => set('referred_to_name', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Referral Reason *</label>
                <textarea className={textareaCls} rows={2} placeholder="Clinical reason for referral..." value={form.referral_reason} onChange={e => set('referral_reason', e.target.value)} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Clinical Goals</label>
                <textarea className={textareaCls} rows={2} placeholder="What should this referral achieve for the patient? (comfort-focused goals)" value={form.clinical_goals} onChange={e => set('clinical_goals', e.target.value)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Team / Department</label>
                  <input className={inputCls} value={form.referred_to_team} onChange={e => set('referred_to_team', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact</label>
                  <input className={inputCls} placeholder="Phone / email" value={form.referred_to_contact} onChange={e => set('referred_to_contact', e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isLoading} className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
                  <Send className="w-4 h-4" />
                  {createMutation.isLoading ? 'Sending...' : 'Create Referral'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Referrals List */}
      {referrals.length === 0 ? (
        <div className="bg-[#e8fafa] dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Send className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-600 dark:text-slate-300 mb-1">No referrals yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Click "New Referral" to create the first referral for this patient.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map(r => {
            const typeInfo = REFERRAL_TYPES.find(t => t.value === r.referral_type);
            const isEditing = editingId === r.id;
            return (
              <div key={r.id} className="bg-[#e8fafa] dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750"
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{typeInfo?.label || r.referral_type}</span>
                    <StatusBadge status={r.status} />
                    <UrgencyBadge urgency={r.urgency} />
                    <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setEditingId(isEditing ? null : r.id); setStatusUpdate({ status: r.status }); }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {expandedId === r.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === r.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="border-t border-slate-200 dark:border-slate-600 px-4 py-4 bg-slate-50 dark:bg-slate-750 space-y-3 text-sm"
                    >
                      {r.referral_reason && <div><span className="font-medium text-slate-600 dark:text-slate-300">Reason: </span><span className="text-slate-700 dark:text-slate-200">{r.referral_reason}</span></div>}
                      {r.clinical_goals && <div><span className="font-medium text-slate-600 dark:text-slate-300">Goals: </span><span className="text-slate-700 dark:text-slate-200">{r.clinical_goals}</span></div>}
                      {r.referred_to_name && <div><span className="font-medium text-slate-600 dark:text-slate-300">Referred to: </span><span className="text-slate-700 dark:text-slate-200">{r.referred_to_name}{r.referred_to_team && ` (${r.referred_to_team})`}</span></div>}
                      {r.outcome_notes && <div><span className="font-medium text-slate-600 dark:text-slate-300">Outcome: </span><span className="text-slate-700 dark:text-slate-200">{r.outcome_notes}</span></div>}

                      {isEditing && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 space-y-3">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 ">Update Status</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {Object.entries(STATUS_CONFIG).map(([val, cfg]) => {
                              const Icon = cfg.icon;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setStatusUpdate(s => ({ ...s, status: val }))}
                                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border-2 transition ${
                                    statusUpdate.status === val
                                      ? `border-${cfg.color}-500 bg-${cfg.color}-50 dark:bg-${cfg.color}-900/30`
                                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5" /> {cfg.label}
                                </button>
                              );
                            })}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Outcome Notes</label>
                            <textarea
                              className={`${inputCls} resize-none`} rows={2}
                              value={statusUpdate.outcome_notes || ''}
                              onChange={e => setStatusUpdate(s => ({ ...s, outcome_notes: e.target.value }))}
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(r.id)}
                              disabled={updateMutation.isLoading}
                              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                            >
                              <Save className="w-3.5 h-3.5" />
                              {updateMutation.isLoading ? 'Saving...' : 'Save Update'}
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-start">
        <button onClick={() => navigate(`/assessments/${patientId}`)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Assessments
        </button>
      </div>
    </div>
  );
}
