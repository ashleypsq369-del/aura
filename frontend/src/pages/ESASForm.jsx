import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Save, Zap, Moon, Wind, UtensilsCrossed,
  Brain, AlertCircle, Smile, Activity, ArrowRight
} from 'lucide-react';
import apiClient, { mlAPI } from '../api/client';
import toast from '../utils/toast';
import FormFileUpload from '../components/FormFileUpload';
import { fireMilestone } from '../components/MilestoneConfetti';
import SectionErrorBoundary from '../components/SectionErrorBoundary';

const symptoms = [
  { key: 'pain',              label: 'Pain',              description: '0 = No pain, 10 = Worst possible pain',        Icon: Zap,           color: 'rose'    },
  { key: 'tiredness',         label: 'Tiredness',         description: '0 = Not tired, 10 = Worst possible tiredness', Icon: Moon,          color: 'indigo'  },
  { key: 'drowsiness',        label: 'Drowsiness',        description: '0 = Not drowsy, 10 = Very drowsy',             Icon: Moon,          color: 'purple'  },
  { key: 'nausea',            label: 'Nausea',            description: '0 = No nausea, 10 = Worst possible nausea',    Icon: AlertCircle,   color: 'amber'   },
  { key: 'lack_of_appetite',  label: 'Lack of Appetite',  description: '0 = Normal appetite, 10 = No appetite',        Icon: UtensilsCrossed, color: 'orange' },
  { key: 'depression',        label: 'Depression',        description: '0 = Not depressed, 10 = Very depressed',       Icon: Brain,         color: 'blue'    },
  { key: 'anxiety',           label: 'Anxiety',           description: '0 = Not anxious, 10 = Very anxious',           Icon: Activity,      color: 'teal'    },
  { key: 'shortness_of_breath', label: 'Shortness of Breath', description: '0 = No shortness, 10 = Worst shortness',  Icon: Wind,          color: 'sky'     },
  { key: 'wellbeing',         label: 'Wellbeing',         description: '0 = Best wellbeing, 10 = Worst wellbeing',     Icon: Smile,         color: 'emerald' },
];

const RISK_LEVEL_CLASSES = {
  critical: 'text-red-700 bg-red-50 border-red-200',
  high:     'text-orange-700 bg-orange-50 border-orange-200',
  moderate: 'text-amber-700 bg-amber-50 border-amber-200',
  low:      'text-green-700 bg-green-50 border-green-200',
};

export default function ESASForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [mlResult, setMlResult] = useState(null);

  const [scores, setScores] = useState({
    pain: 0,
    tiredness: 0,
    drowsiness: 0,
    nausea: 0,
    lack_of_appetite: 0,
    depression: 0,
    anxiety: 0,
    shortness_of_breath: 0,
    wellbeing: 0
  });

  const [notes, setNotes] = useState('');
  const [completedByProxy, setCompletedByProxy] = useState(false);
  const [proxyRelationship, setProxyRelationship] = useState('');

  // Fetch patient
  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/patients/${patientId}`);
      return response.data;
    }
  });

  // Fetch previous assessments for comparison
  const { data: previousAssessments } = useQuery({
    queryKey: ['esas', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/assessments/esas/${patientId}?limit=5`);
      return response.data;
    }
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data) => {
      return await apiClient.post('/api/assessments/esas', data);
    },
    onSuccess: (response) => {
      toast.success('ESAS assessment saved successfully!');
      fireMilestone('hearts'); // Gentle celebration on assessment completion
      
      // Show alerts if generated
      if (response.data.alerts_generated && response.data.alerts_generated.length > 0) {
        toast.error(`${response.data.alerts_generated.length} clinical alert(s) generated - please review`, {
          duration: 5000
        });
      }
      
      queryClient.invalidateQueries(['esas', patientId]);
      queryClient.invalidateQueries(['assessment-overview', patientId]);
      
      // Fetch ML risk before navigating
      try {
        mlAPI.getPatientRisk(patientId).then(r => setMlResult(r.data));
      } catch (_) { /* silent fail */ }
    },
    onError: (error) => {
      toast.error('Failed to save assessment');
      console.error(error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    submitMutation.mutate({
      patient_id: parseInt(patientId),
      ...scores,
      notes,
      completed_by_proxy: completedByProxy,
      proxy_relationship: completedByProxy ? proxyRelationship : null
    });
  };

  const getScoreColor = (value) => {
    if (value === 0) return 'from-green-500 to-emerald-500';
    if (value <= 3) return 'from-green-400 to-teal-500';
    if (value <= 6) return 'from-yellow-400 to-orange-400';
    if (value <= 8) return 'from-orange-500 to-red-500';
    return 'from-red-600 to-rose-700';
  };

  const getScoreLabel = (value) => {
    if (value === 0) return 'None';
    if (value <= 3) return 'Mild';
    if (value <= 6) return 'Moderate';
    if (value <= 8) return 'Severe';
    return 'Very Severe';
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
{/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-white/20">
            <Heart className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">ESAS Assessment</h1>
            <p className="text-rose-100 text-lg">
              Edmonton Symptom Assessment System
            </p>
            <p className="text-rose-200 text-sm mt-1">
              Patient: <span className="font-bold">{patient?.full_name}</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200"
      >
        <p className="text-sm text-blue-900">
          <strong>Instructions:</strong> Please rate each symptom on a scale from 0 to 10. 
          Move the slider to indicate how much each symptom has affected you <strong>in the last 24 hours</strong>.
        </p>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {symptoms.map((symptom, idx) => (
          <motion.div
            key={symptom.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-[#e8fafa] rounded-xl p-6 shadow-md border-2 border-slate-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${symptom.color}-50 flex-shrink-0`}>
                  <symptom.Icon size={20} className={`text-${symptom.color}-600`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{symptom.label}</h3>
                  <p className="text-sm text-slate-600">{symptom.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold bg-gradient-to-r ${getScoreColor(scores[symptom.key])} text-transparent bg-clip-text`}>
                  {scores[symptom.key]}
                </div>
                <div className="text-xs text-slate-600 font-semibold">
                  {getScoreLabel(scores[symptom.key])}
                </div>
              </div>
            </div>

            {/* Slider */}
            <div className="relative">
              <input
                type="range"
                min="0"
                max="10"
                value={scores[symptom.key]}
                onChange={(e) => setScores({ ...scores, [symptom.key]: parseInt(e.target.value) })}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, 
                    rgb(34, 197, 94) 0%, 
                    rgb(253, 224, 71) 30%, 
                    rgb(251, 146, 60) 60%, 
                    rgb(239, 68, 68) 100%)`
                }}
              />
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>0</span>
                <span>2</span>
                <span>4</span>
                <span>6</span>
                <span>8</span>
                <span>10</span>
              </div>
            </div>

            {/* Show previous score if available */}
            {previousAssessments?.assessments?.[0]?.[symptom.key] !== undefined && (
              <div className="mt-3 text-xs text-slate-600">
                Previous: <span className="font-semibold">{previousAssessments.assessments[0][symptom.key]}/10</span>
                {scores[symptom.key] > previousAssessments.assessments[0][symptom.key] && (
                  <span className="ml-2 text-red-600">? Worsened</span>
                )}
                {scores[symptom.key] < previousAssessments.assessments[0][symptom.key] && (
                  <span className="ml-2 text-green-600">? Improved</span>
                )}
              </div>
            )}
          </motion.div>
        ))}

        {/* Proxy Completion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-[#e8fafa] rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="proxy"
              checked={completedByProxy}
              onChange={(e) => setCompletedByProxy(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
            <label htmlFor="proxy" className="text-sm font-semibold text-slate-900">
              Completed by proxy (nurse, family member)
            </label>
          </div>

          {completedByProxy && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Relationship to Patient
              </label>
              <input
                type="text"
                value={proxyRelationship}
                onChange={(e) => setProxyRelationship(e.target.value)}
                placeholder="e.g., Spouse, Daughter, Nurse"
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                required={completedByProxy}
              />
            </div>
          )}
        </motion.div>

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-[#e8fafa] rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any additional observations or context..."
            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
          />
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex space-x-4"
        >
          
          {/* File Attachments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-6"
          >
            <FormFileUpload
              category="documents"
              label="Supporting Documentation"
              description="Attach medical reports, symptom photos, or charts"
              accept="image/*,video/*,.pdf,.doc,.docx"
              multiple={true}
              maxSizeMB={50}
            />
          </motion.div>

          <button
            type="submit"
            disabled={submitMutation.isLoading || !!mlResult}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>{submitMutation.isLoading ? 'Saving...' : 'Save Assessment'}</span>
          </button>

          {!mlResult && (
            <button
              type="button"
              onClick={() => navigate(`/assessments/${patientId}`)}
              className="px-6 py-4 bg-slate-200 text-slate-900 rounded-xl font-bold hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </motion.div>

        {/* ML Risk Results Panel */}
        <AnimatePresence>
          {mlResult && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="border-l-4 border-teal-500 bg-teal-50 rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-teal-900 text-sm flex items-center gap-2">
                  <Brain size={15} className="text-teal-600" />
                  Updated Risk Assessment
                </h3>
                {mlResult.overall_level && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${RISK_LEVEL_CLASSES[mlResult.overall_level] || RISK_LEVEL_CLASSES.low}`}>
                    {mlResult.overall_level} &middot; {Math.round((mlResult.overall_risk ?? 0) * 100)}%
                  </span>
                )}
              </div>

              {mlResult.key_concerns?.length > 0 && (
                <ul className="mb-3 space-y-1">
                  {mlResult.key_concerns.slice(0, 3).map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-teal-800">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              )}

              {mlResult.tasks?.symptom_burden?.top_features?.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-[10px] font-bold text-teal-600 ">Symptom Burden Drivers</p>
                  {mlResult.tasks.symptom_burden.top_features.slice(0, 3).map((feature, i) => (
                    <div key={i}>
                      <p className="text-xs text-slate-700 mb-0.5">{feature.display_name}</p>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(feature.pct, 100)}%`,
                            backgroundColor: feature.impact === 'increases_risk' ? '#e11d48' : '#16a34a'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate(`/assessments/${patientId}`)}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition"
              >
                Continue to Assessments
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}

