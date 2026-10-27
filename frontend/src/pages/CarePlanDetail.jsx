import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Plus, CheckCircle, Circle, AlertCircle,
  RefreshCw, Target, Heart, Brain, Users, Shield,
  ChevronDown, ChevronRight, ArrowLeft, Edit2, Save, X
} from 'lucide-react';
import apiClient from '../api/client';
import toast from '../utils/toast';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import FocusedAIExplanation from '../components/FocusedAIExplanation';
import { usePersonalisationFlags } from '../context/PersonalisationContext';

const CATEGORY_CONFIG = {
  symptom:       { label: 'Symptom',       color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200',    Icon: AlertCircle },
  psychological: { label: 'Psychological', color: 'text-purple-600',  bg: 'bg-purple-50',  border: 'border-purple-200',  Icon: Brain },
  spiritual:     { label: 'Spiritual',     color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   Icon: Heart },
  family:        { label: 'Family',        color: 'text-teal-600',    bg: 'bg-teal-50',    border: 'border-teal-200',    Icon: Users },
  functional:    { label: 'Functional',    color: 'text-teal-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    Icon: Target },
  general:       { label: 'General',       color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-200',   Icon: Shield },
};

const PRIORITY_BADGE = {
  high:   'badge-high',
  medium: 'badge-moderate',
  low:    'badge-low',
};

const STATUS_BADGE = {
  active:    'badge-stable',
  completed: 'badge-low',
  on_hold:   'badge-moderate',
};

function GoalCard({ goal, patientId, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.general;
  const CatIcon = cfg.Icon;

  const toggleMutation = useMutation({
    mutationFn: (newStatus) =>
      apiClient.put(`/api/care-plans/${patientId}/goals/${goal.id}`, { status: newStatus }),
    onSuccess: () => onUpdate(),
    onError: () => toast.error('Failed to update goal'),
  });

  const isCompleted = goal.status === 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#f0f6fa] rounded-xl border-2 ${cfg.border} overflow-hidden`}
    >
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <button
          onClick={e => { e.stopPropagation(); toggleMutation.mutate(isCompleted ? 'active' : 'completed'); }}
          className="mt-0.5 flex-shrink-0"
          data-tip={isCompleted ? 'Mark as active' : 'Mark as complete'}
        >
          {isCompleted
            ? <CheckCircle size={20} className="text-green-500" />
            : <Circle size={20} className="text-slate-300 hover:text-teal-500 transition-colors" />
          }
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className={`text-sm font-semibold ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
              {goal.title}
            </p>
            <span className={`${PRIORITY_BADGE[goal.priority] || 'badge-info'}`}>{goal.priority}</span>
            <span className={`${STATUS_BADGE[goal.status] || 'badge-info'}`}>{goal.status?.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
              <CatIcon size={10} />
              {cfg.label}
            </div>
            {goal.target_date && (
              <span className="text-[11px] text-slate-400">
                Due {new Date(goal.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 text-slate-400">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
          {goal.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{goal.description}</p>
          )}

          {/* Progress bar */}
          {goal.progress != null && (
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Progress</span>
                <span className="font-semibold">{goal.progress}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Checklist */}
          {goal.checklist?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-500 ">Checklist</p>
              {goal.checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  {item.is_completed
                    ? <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    : <Circle size={14} className="text-slate-300 flex-shrink-0" />
                  }
                  <span className={item.is_completed ? 'text-slate-400 line-through' : 'text-slate-700'}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          )}

          {goal.notes && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs font-bold text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-600">{goal.notes}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function CarePlanDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hiddenSections, uiFlags } = usePersonalisationFlags();
  const [showAIExplanation, setShowAIExplanation] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editText, setEditText] = useState('');

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => apiClient.get(`/api/patients/${patientId}`).then(r => r.data),
    enabled: !!patientId,
  });

  const { data: carePlan, isLoading, error } = useQuery({
    queryKey: ['care-plan', patientId],
    queryFn: () => apiClient.get(`/api/care-plans/${patientId}`).then(r => r.data),
    enabled: !!patientId,
    retry: 1,
  });

  const generateMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/care-plans/${patientId}/generate`),
    onSuccess: () => {
      queryClient.invalidateQueries(['care-plan', patientId]);
      toast.success('Care plan generated successfully');
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to generate care plan'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => apiClient.put(`/api/care-plans/${patientId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['care-plan', patientId]);
      setEditingSection(null);
      toast.success('Care plan updated');
    },
    onError: () => toast.error('Failed to update'),
  });

  const handleExplainSection = async (sectionKey, sectionText) => {
    try {
      const res = await apiClient.post('/api/comprehensive-ai/focused-explanation', {
        patient_id: parseInt(patientId),
        focus_type: 'care_plan',
        focus_data: { section: sectionKey, content: sectionText },
      });
      setAiData(res.data);
      setShowAIExplanation(true);
    } catch {
      toast.error('Could not get AI explanation');
    }
  };

  const startEdit = (key, currentText) => {
    setEditingSection(key);
    setEditText(currentText || '');
  };

  const saveEdit = () => {
    if (!editingSection) return;
    updateMutation.mutate({ [editingSection]: editText });
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-36 bg-slate-200 rounded-xl" />
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error || !carePlan) {
    return (
      <PageTransition>
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900 mb-2">No Care Plan Found</h2>
            <p className="text-sm text-slate-500 mb-5">No care plan exists for this patient yet.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate(-1)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition flex items-center gap-2">
                <ArrowLeft size={14} /> Back
              </button>
              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={14} className={generateMutation.isPending ? 'animate-spin' : ''} />
                {generateMutation.isPending ? 'Generating...' : 'Generate Care Plan'}
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  const goals = carePlan.goals || [];
  const interventions = carePlan.interventions || [];
  const activeGoals = goals.filter(g => g.status !== 'completed');
  const completedGoals = goals.filter(g => g.status === 'completed');

  const PLAN_SECTIONS = [
    { key: 'goals_of_care',        label: 'Goals of Care',         icon: Target,  color: 'text-teal-600',   bg: 'bg-teal-50' },
    { key: 'pain_management_plan', label: 'Pain Management',        icon: Heart,   color: 'text-rose-600',   bg: 'bg-rose-50' },
    { key: 'psychological_support',label: 'Psychological Support',  icon: Brain,   color: 'text-purple-600', bg: 'bg-purple-50' },
    ...(hiddenSections.has('spiritual') || hiddenSections.has('spiritual_care') ? [] : [
      { key: 'spiritual_care',     label: 'Spiritual Care',         icon: Shield,  color: 'text-amber-600',  bg: 'bg-amber-50' },
    ]),
    { key: 'family_support_plan',  label: 'Family Support',         icon: Users,   color: 'text-teal-600',   bg: 'bg-blue-50' },
    { key: 'overall_notes',        label: 'Overall Notes',          icon: FileText,color: 'text-slate-600',  bg: 'bg-slate-50' },
  ];

  return (
    <PageTransition>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-0">
        <PageHeader
          image="/resources/african/african-doctor-female.jpg"
          title={patient ? `${patient.full_name} — Care Plan` : 'Care Plan'}
          subtitle={`Phase: ${carePlan.care_phase || 'Active'} · Last updated: ${carePlan.updated_at ? new Date(carePlan.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not recorded'}`}
          icon={FileText}
        >
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl border border-white/30 text-xs font-bold transition">
              <ArrowLeft size={13} /> Back
            </button>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl border border-white/30 text-xs font-bold transition disabled:opacity-50"
            >
              <RefreshCw size={13} className={generateMutation.isPending ? 'animate-spin' : ''} />
              {generateMutation.isPending ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>
        </PageHeader>

        {/* Summary strip */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-3 flex items-center gap-6 flex-wrap text-sm mb-0">
          <div className="flex items-center gap-2">
            <span className="badge-stable">{carePlan.care_phase || 'Active'}</span>
          </div>
          <div className="text-slate-600"><strong className="text-slate-900">{goals.length}</strong> goals total</div>
          <div className="text-slate-600"><strong className="text-teal-700">{completedGoals.length}</strong> completed</div>
          <div className="text-slate-600"><strong className="text-slate-900">{interventions.length}</strong> interventions</div>
          {carePlan.review_date && (
            <div className="text-slate-600 ml-auto">
              Review: <strong>{new Date(carePlan.review_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
            </div>
          )}
        </div>

        {/* Main two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

          {/* Left: Goals */}
          <div className="lg:col-span-2 space-y-5">

            {/* Active Goals */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between"
                style={{ background: 'linear-gradient(to right, #0d948815, transparent)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Target size={16} className="text-teal-600" />
                  </div>
                  <h2 className="font-bold text-slate-800 text-sm">Active Goals</h2>
                </div>
                <span className="chip-teal">{activeGoals.length}</span>
              </div>

              <div className="p-4 space-y-3">
                {activeGoals.length > 0 ? activeGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} patientId={patientId}
                    onUpdate={() => queryClient.invalidateQueries(['care-plan', patientId])} />
                )) : (
                  <p className="text-center text-slate-400 text-sm py-6">No active goals</p>
                )}
              </div>
            </div>

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                      <CheckCircle size={16} className="text-green-600" />
                    </div>
                    <h2 className="font-bold text-slate-800 text-sm">Completed Goals</h2>
                  </div>
                  <span className="chip-emerald">{completedGoals.length}</span>
                </div>
                <div className="p-4 space-y-3">
                  {completedGoals.map(goal => (
                    <GoalCard key={goal.id} goal={goal} patientId={patientId}
                      onUpdate={() => queryClient.invalidateQueries(['care-plan', patientId])} />
                  ))}
                </div>
              </div>
            )}

            {/* Interventions */}
            {interventions.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Shield size={16} className="text-teal-600" />
                    </div>
                    <h2 className="font-bold text-slate-800 text-sm">Interventions</h2>
                  </div>
                  <span className="chip-blue">{interventions.length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wide">Intervention</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wide">Category</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wide">Frequency</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {interventions.map((iv) => (
                        <tr key={iv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <p className="text-sm font-semibold text-slate-900">{iv.title}</p>
                            {iv.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{iv.description}</p>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="chip-teal">{iv.category || 'General'}</span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">{iv.frequency || '—'}</td>
                          <td className="py-3 px-4">
                            <span className={STATUS_BADGE[iv.status] || 'badge-info'}>
                              {iv.status || 'active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right: Plan sections */}
          <div className="space-y-4">
            {PLAN_SECTIONS.map(({ key, label, icon: SectionIcon, color, bg }) => {
              const text = carePlan[key];
              const isEditing = editingSection === key;
              return (
                <div key={key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between"
                    style={{ background: `linear-gradient(to right, ${bg.replace('bg-', '')}40, transparent)` }}>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                        <SectionIcon size={14} className={color} />
                      </div>
                      <h3 className="font-bold text-slate-800 text-xs">{label}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {text && (
                        <button
                          onClick={() => handleExplainSection(key, text)}
                          className="p-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                          data-tip="Explain with AI"
                        >
                          <Brain size={13} className="text-purple-500" />
                        </button>
                      )}
                      {isEditing ? (
                        <>
                          <button onClick={saveEdit} disabled={updateMutation.isPending}
                            className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 transition-colors" data-tip="Save">
                            <Save size={13} className="text-teal-600" />
                          </button>
                          <button onClick={() => setEditingSection(null)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" data-tip="Cancel">
                            <X size={13} className="text-red-500" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => startEdit(key, text)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" data-tip="Edit">
                          <Edit2 size={13} className="text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    {isEditing ? (
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        rows={5}
                        autoFocus
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
                      />
                    ) : text ? (
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{text}</p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Not documented yet. Click edit to add.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Explanation Modal */}
        {showAIExplanation && aiData && (
          <FocusedAIExplanation
            data={aiData}
            onClose={() => { setShowAIExplanation(false); setAiData(null); }}
          />
        )}
      </div>
    </PageTransition>
  );
}
