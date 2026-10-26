import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Save, AlertTriangle, TrendingDown, Brain, ArrowRight } from 'lucide-react';
import apiClient, { mlAPI } from '../api/client';
import toast from '../utils/toast';
import FormFileUpload from '../components/FormFileUpload';

const RISK_LEVEL_CLASSES = {
  critical: 'text-red-700 bg-red-50 border-red-200',
  high:     'text-orange-700 bg-orange-50 border-orange-200',
  moderate: 'text-amber-700 bg-amber-50 border-amber-200',
  low:      'text-green-700 bg-green-50 border-green-200',
};

const PPS_LEVELS = {
  100: {
    ambulation: 'full',
    activity: 'normal_no_disease',
    self_care: 'complete',
    intake: 'normal',
    consciousness: 'full',
    description: 'Full ambulation, normal activity, no disease evidence'
  },
  90: {
    ambulation: 'full',
    activity: 'normal_some_disease',
    self_care: 'complete',
    intake: 'normal',
    consciousness: 'full',
    description: 'Full ambulation, normal activity with effort, some disease evidence'
  },
  80: {
    ambulation: 'full',
    activity: 'normal_extensive_disease',
    self_care: 'complete',
    intake: 'normal_reduced',
    consciousness: 'full',
    description: 'Full ambulation, normal activity with effort, extensive disease'
  },
  70: {
    ambulation: 'reduced',
    activity: 'unable_work',
    self_care: 'complete',
    intake: 'normal_reduced',
    consciousness: 'full',
    description: 'Reduced ambulation, unable to do work, significant disease'
  },
  60: {
    ambulation: 'reduced',
    activity: 'unable_hobbies',
    self_care: 'occasional_assistance',
    intake: 'normal_reduced',
    consciousness: 'full_confusion',
    description: 'Reduced ambulation, unable to do hobbies/housework, extensive disease'
  },
  50: {
    ambulation: 'mainly_sit_lie',
    activity: 'unable_any_work',
    self_care: 'considerable_assistance',
    intake: 'reduced',
    consciousness: 'full_confusion',
    description: 'Mainly sitting or lying, unable to do any work, extensive disease'
  },
  40: {
    ambulation: 'mainly_bed',
    activity: 'unable_most_activity',
    self_care: 'mainly_assistance',
    intake: 'reduced',
    consciousness: 'full_drowsy_confusion',
    description: 'Mainly in bed, unable to do most activity, extensive disease'
  },
  30: {
    ambulation: 'totally_bed',
    activity: 'unable_all_activity',
    self_care: 'total_care',
    intake: 'minimal_sips',
    consciousness: 'full_drowsy_confusion',
    description: 'Totally bed bound, unable to do any activity, extensive disease'
  },
  20: {
    ambulation: 'totally_bed',
    activity: 'unable_all_activity',
    self_care: 'total_care',
    intake: 'mouth_care_only',
    consciousness: 'drowsy_coma',
    description: 'Totally bed bound, minimal intake, drowsy or coma'
  },
  10: {
    ambulation: 'totally_bed',
    activity: 'unable_all_activity',
    self_care: 'total_care',
    intake: 'mouth_care_only',
    consciousness: 'drowsy_coma',
    description: 'Death imminent, mouth care only'
  }
};

export default function PPSForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [ppsScore, setPpsScore] = useState(70);
  const [notes, setNotes] = useState('');
  const [mlResult, setMlResult] = useState(null);

  // Fetch patient
  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/patients/${patientId}`);
      return response.data;
    }
  });

  // Fetch previous PPS
  const { data: previousPPS } = useQuery({
    queryKey: ['pps', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/assessments/pps/${patientId}?limit=5`);
      return response.data;
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      return await apiClient.post('/api/assessments/pps', data);
    },
    onSuccess: (response) => {
      toast.success('PPS assessment saved successfully!');
      
      if (response.data.alerts_generated && response.data.alerts_generated.length > 0) {
        toast.error(`${response.data.alerts_generated.length} clinical alert(s) generated - please review`, {
          duration: 5000
        });
      }
      
      queryClient.invalidateQueries(['pps', patientId]);
      queryClient.invalidateQueries(['assessment-overview', patientId]);

      // Fetch ML functional decline risk before navigating
      try {
        mlAPI.getTaskPrediction(patientId, 'functional_decline').then(r => setMlResult(r.data));
      } catch (_) { /* silent fail */ }
    },
    onError: (error) => {
      toast.error('Failed to save assessment');
      console.error(error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const level = PPS_LEVELS[ppsScore];
    
    submitMutation.mutate({
      patient_id: parseInt(patientId),
      pps_score: ppsScore,
      ambulation: level.ambulation,
      activity_disease: level.activity,
      self_care: level.self_care,
      oral_intake: level.intake,
      consciousness: level.consciousness,
      notes
    });
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'from-green-500 to-emerald-500';
    if (score >= 50) return 'from-yellow-500 to-orange-500';
    if (score >= 30) return 'from-orange-500 to-red-500';
    return 'from-red-600 to-rose-700';
  };

  const getPrognosisText = (score) => {
    if (score >= 70) return 'Good functional status';
    if (score >= 50) return 'Moderate functional decline';
    if (score >= 30) return 'Significant decline - intensive care needed';
    return 'Critical - end-of-life care discussion';
  };

  const currentLevel = PPS_LEVELS[ppsScore];
  const previousScore = previousPPS?.assessments?.[0]?.pps_score;

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
{/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-white/20">
            <Activity className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">PPS Assessment</h1>
            <p className="text-blue-100 text-lg">
              Palliative Performance Scale
            </p>
            <p className="text-blue-200 text-sm mt-1">
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
          <strong>Instructions:</strong> Select the PPS level (0-100%) that best describes the patient's current functional status across 5 domains: ambulation, activity, self-care, oral intake, and consciousness.
        </p>
      </motion.div>

      {/* Warning for low scores */}
      {ppsScore <= 30 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 rounded-lg p-4 border-2 border-red-300"
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">Critical PPS Level</p>
              <p className="text-sm text-red-800 mt-1">
                PPS =30% indicates end-of-life trajectory. Consider discussing goals of care, advance directives, and hospice services with patient and family.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Decline Warning */}
      {previousScore && ppsScore < previousScore - 15 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-orange-50 rounded-lg p-4 border-2 border-orange-300"
        >
          <div className="flex items-start space-x-3">
            <TrendingDown className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-orange-900">Rapid Functional Decline</p>
              <p className="text-sm text-orange-800 mt-1">
                PPS has declined from {previousScore}% to {ppsScore}% (drop of {previousScore - ppsScore}%). 
                Consider team meeting to reassess care plan.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PPS Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <div className="mb-6">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">PPS Level</h2>
                <p className="text-sm text-slate-600">Select the appropriate functional level</p>
              </div>
              <div className="text-right">
                <div className={`text-6xl font-bold bg-gradient-to-r ${getScoreColor(ppsScore)} text-transparent bg-clip-text`}>
                  {ppsScore}%
                </div>
                <p className="text-sm text-slate-600 font-semibold mt-1">
                  {getPrognosisText(ppsScore)}
                </p>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={ppsScore}
              onChange={(e) => setPpsScore(parseInt(e.target.value))}
              className="w-full h-4 rounded-lg appearance-none cursor-pointer mb-2"
              style={{
                background: `linear-gradient(to right, 
                  rgb(220, 38, 38) 0%, 
                  rgb(249, 115, 22) 30%, 
                  rgb(234, 179, 8) 60%, 
                  rgb(34, 197, 94) 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>10%</span>
              <span>30%</span>
              <span>50%</span>
              <span>70%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Current Level Details */}
          <div className="bg-slate-50 rounded-lg p-4 border-2 border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3">PPS {ppsScore}% Description:</h3>
            <p className="text-slate-700 mb-4">{currentLevel.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded p-3">
                <p className="text-xs text-slate-600 font-semibold mb-1">Ambulation</p>
                <p className="text-sm text-slate-900">{currentLevel.ambulation.replace(/_/g, ' ')}</p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-xs text-slate-600 font-semibold mb-1">Activity & Disease</p>
                <p className="text-sm text-slate-900">{currentLevel.activity.replace(/_/g, ' ')}</p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-xs text-slate-600 font-semibold mb-1">Self-Care</p>
                <p className="text-sm text-slate-900">{currentLevel.self_care.replace(/_/g, ' ')}</p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-xs text-slate-600 font-semibold mb-1">Oral Intake</p>
                <p className="text-sm text-slate-900">{currentLevel.intake.replace(/_/g, ' ')}</p>
              </div>
              <div className="bg-white rounded p-3 md:col-span-2">
                <p className="text-xs text-slate-600 font-semibold mb-1">Consciousness</p>
                <p className="text-sm text-slate-900">{currentLevel.consciousness.replace(/_/g, ' ')}</p>
              </div>
            </div>
          </div>

          {/* Previous Score */}
          {previousScore && (
            <div className="mt-4 text-sm text-slate-600">
              <span className="font-semibold">Previous PPS: {previousScore}%</span>
              {ppsScore < previousScore && (
                <span className="ml-2 text-red-600 font-semibold">
                  ? Declined by {previousScore - ppsScore}%
                </span>
              )}
              {ppsScore > previousScore && (
                <span className="ml-2 text-green-600 font-semibold">
                  ? Improved by {ppsScore - previousScore}%
                </span>
              )}
              {ppsScore === previousScore && (
                <span className="ml-2 text-blue-600 font-semibold">
                  ? Stable
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Clinical Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Additional observations about functional status..."
            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
          />
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
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
              label="Assessment Documentation"
              description="Attach assessment notes or supporting files"
              accept="image/*,.pdf,.doc,.docx"
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
            <span>{submitMutation.isLoading ? 'Saving...' : 'Save PPS Assessment'}</span>
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

        {/* ML Functional Decline Results Panel */}
        <AnimatePresence>
          {mlResult && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="border-l-4 border-blue-500 bg-blue-50 rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                  <Brain size={15} className="text-blue-600" />
                  Functional Decline Risk
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-blue-700 tabular-nums">
                    {Math.round((mlResult.probability ?? 0) * 100)}%
                  </span>
                  {mlResult.risk_level && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${RISK_LEVEL_CLASSES[mlResult.risk_level] || RISK_LEVEL_CLASSES.low}`}>
                      {mlResult.risk_level}
                    </span>
                  )}
                </div>
              </div>

              {mlResult.top_features?.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Key Drivers</p>
                  {mlResult.top_features.slice(0, 3).map((feature, i) => (
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
                Continue
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}

