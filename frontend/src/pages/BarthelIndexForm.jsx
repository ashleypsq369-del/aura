import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Save, UtensilsCrossed, Droplets, Scissors,
  Shirt, Activity, Droplet, Home, BedDouble, Footprints, StepForward,
  Brain, ArrowRight
} from 'lucide-react';
import apiClient, { mlAPI } from '../api/client';
import toast from '../utils/toast';
import FormFileUpload from '../components/FormFileUpload';

const RISK_LEVEL_CLASSES = {
  critical: 'text-red-700 bg-red-50 border-red-200',
  high:     'text-orange-700 bg-orange-50 border-orange-200',
  moderate: 'text-amber-700 bg-amber-50 border-amber-200',
  low:      'text-green-700 bg-green-50 border-green-200',
};

const barthelItems = [
  {
    key: 'feeding', label: 'Feeding', Icon: UtensilsCrossed,
    options: [
      { value: 0, label: 'Unable (0)', desc: 'Needs to be fed' },
      { value: 5, label: 'Needs help (5)', desc: 'Cutting, spreading butter, etc.' },
      { value: 10, label: 'Independent (10)', desc: 'Can use any device' }
    ]
  },
  {
    key: 'bathing', label: 'Bathing', Icon: Droplets,
    options: [
      { value: 0, label: 'Dependent (0)', desc: 'Needs full assistance' },
      { value: 5, label: 'Independent (5)', desc: 'Bath, shower, or sponge bath' }
    ]
  },
  {
    key: 'grooming', label: 'Grooming', Icon: Scissors,
    options: [
      { value: 0, label: 'Needs help (0)', desc: 'With personal care' },
      { value: 5, label: 'Independent (5)', desc: 'Face, hair, teeth, shaving' }
    ]
  },
  {
    key: 'dressing', label: 'Dressing', Icon: Shirt,
    options: [
      { value: 0, label: 'Dependent (0)', desc: 'Needs full help' },
      { value: 5, label: 'Needs help (5)', desc: 'With at least half the task' },
      { value: 10, label: 'Independent (10)', desc: 'Including buttons, zips, laces' }
    ]
  },
  {
    key: 'bowel_control', label: 'Bowel Control', Icon: Activity,
    options: [
      { value: 0, label: 'Incontinent (0)', desc: 'Or needs enemas' },
      { value: 5, label: 'Occasional accident (5)', desc: 'Once per week or less' },
      { value: 10, label: 'Continent (10)', desc: 'No accidents' }
    ]
  },
  {
    key: 'bladder_control', label: 'Bladder Control', Icon: Droplet,
    options: [
      { value: 0, label: 'Incontinent/Catheterized (0)', desc: 'Unable to manage' },
      { value: 5, label: 'Occasional accident (5)', desc: 'Max once per day' },
      { value: 10, label: 'Continent (10)', desc: 'For >7 days' }
    ]
  },
  {
    key: 'toilet_use', label: 'Toilet Use', Icon: Home,
    options: [
      { value: 0, label: 'Dependent (0)', desc: 'Needs full help' },
      { value: 5, label: 'Needs some help (5)', desc: 'Balance, clothes, wiping' },
      { value: 10, label: 'Independent (10)', desc: 'On/off, dressing, wiping' }
    ]
  },
  {
    key: 'transfers', label: 'Transfers (Bed/Chair)', Icon: BedDouble,
    options: [
      { value: 0, label: 'Unable (0)', desc: 'No sitting balance' },
      { value: 5, label: 'Major help (5)', desc: '1-2 people, physical help' },
      { value: 10, label: 'Minor help (10)', desc: 'Verbal or physical' },
      { value: 15, label: 'Independent (15)', desc: 'No help needed' }
    ]
  },
  {
    key: 'mobility', label: 'Mobility', Icon: Footprints,
    options: [
      { value: 0, label: 'Immobile (0)', desc: 'Cannot use wheelchair' },
      { value: 5, label: 'Wheelchair independent (5)', desc: '50m independently' },
      { value: 10, label: 'Walks with help (10)', desc: 'One person, 50m' },
      { value: 15, label: 'Independent (15)', desc: '50m, may use aid' }
    ]
  },
  {
    key: 'stairs', label: 'Stairs', Icon: StepForward,
    options: [
      { value: 0, label: 'Unable (0)', desc: 'Cannot climb stairs' },
      { value: 5, label: 'Needs help (5)', desc: 'Verbal, physical, or carrying aid' },
      { value: 10, label: 'Independent (10)', desc: 'May use handrail or aid' }
    ]
  }
];

export default function BarthelIndexForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [scores, setScores] = useState({
    feeding: null,
    bathing: null,
    grooming: null,
    dressing: null,
    bowel_control: null,
    bladder_control: null,
    toilet_use: null,
    transfers: null,
    mobility: null,
    stairs: null
  });

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

  // Fetch previous assessments
  const { data: previousAssessments } = useQuery({
    queryKey: ['barthel', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/assessments/barthel/${patientId}?limit=5`);
      return response.data;
    }
  });

  // Calculate total
  const calculateTotal = () => {
    return Object.values(scores).reduce((sum, val) => sum + (val || 0), 0);
  };

  const getIndependenceLevel = (total) => {
    if (total >= 90) return { label: 'Independent', color: 'text-green-600', bg: 'bg-green-100' };
    if (total >= 60) return { label: 'Slightly Dependent', color: 'text-teal-600', bg: 'bg-blue-100' };
    if (total >= 40) return { label: 'Moderately Dependent', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (total >= 20) return { label: 'Severely Dependent', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { label: 'Totally Dependent', color: 'text-red-600', bg: 'bg-red-100' };
  };

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data) => {
      return await apiClient.post('/api/assessments/barthel', data);
    },
    onSuccess: (response) => {
      toast.success('Barthel Index assessment saved successfully!');
      
      if (response.data.alerts_generated && response.data.alerts_generated.length > 0) {
        toast.error(`${response.data.alerts_generated.length} clinical alert(s) generated - please review`, {
          duration: 5000
        });
      }
      
      queryClient.invalidateQueries(['barthel', patientId]);
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
    
    // Check all items are scored
    const allScored = Object.values(scores).every(val => val !== null);
    if (!allScored) {
      toast.error('Please score all 10 items');
      return;
    }
    
    const total = calculateTotal();
    const independence = getIndependenceLevel(total);
    
    submitMutation.mutate({
      patient_id: parseInt(patientId),
      ...scores,
      total_score: total,
      independence_level: independence.label,
      notes
    });
  };

  const total = calculateTotal();
  const independence = getIndependenceLevel(total);
  const allScored = Object.values(scores).every(val => val !== null);

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      <button onClick={() => window.history.back()} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700 transition-colors mb-4 group"><span className="group-hover:-translate-x-1 transition-transform">?</span> Back</button>
{/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-white/20">
              <User className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Barthel Index</h1>
              <p className="text-blue-100 text-lg">Activities of Daily Living Assessment</p>
              <p className="text-blue-200 text-sm mt-1">
                Patient: <span className="font-bold">{patient?.full_name}</span>
              </p>
            </div>
          </div>
          {allScored && (
            <div className="text-right">
              <div className="text-5xl font-bold text-white">{total}</div>
              <div className="text-sm text-blue-100">/ 100</div>
              <div className={`mt-2 px-3 py-1 rounded-full text-sm font-bold bg-white/20 text-white`}>
                {independence.label}
              </div>
            </div>
          )}
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
          <strong>Instructions:</strong> Score the patient's ability to perform each activity independently. 
          Select the option that best describes their current functional status. Higher scores indicate greater independence.
        </p>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {barthelItems.map((item, idx) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-[#e8fafa] rounded-xl p-6 shadow-md border-2 border-slate-200"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                <item.Icon size={20} className="text-teal-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">{item.label}</h3>
              </div>
              {scores[item.key] !== null && (
                <div className="text-2xl font-bold text-teal-600">
                  {scores[item.key]}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="space-y-2">
              {item.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setScores({ ...scores, [item.key]: option.value })}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                    scores[item.key] === option.value
                      ? 'border-teal-500 bg-blue-50 shadow-md'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{option.label}</div>
                      <div className="text-sm text-slate-600">{option.desc}</div>
                    </div>
                    {scores[item.key] === option.value && (
                      <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#e8fafa]"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Previous score */}
            {previousAssessments?.assessments?.[0]?.[item.key] !== undefined && (
              <div className="mt-3 text-xs text-slate-600">
                Previous: <span className="font-semibold">{previousAssessments.assessments[0][item.key]}</span>
                {scores[item.key] !== null && (
                  <>
                    {scores[item.key] > previousAssessments.assessments[0][item.key] && (
                      <span className="ml-2 text-green-600">? Improved</span>
                    )}
                    {scores[item.key] < previousAssessments.assessments[0][item.key] && (
                      <span className="ml-2 text-red-600">? Declined</span>
                    )}
                  </>
                )}
              </div>
            )}
          </motion.div>
        ))}

        {/* Score Summary */}
        {allScored && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${independence.bg} rounded-xl p-6 border-2 border-slate-300`}
          >
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{total} / 100</div>
              <div className={`text-2xl font-bold ${independence.color} mb-3`}>
                {independence.label}
              </div>
              <div className="text-sm text-slate-700">
                {total >= 90 && 'Patient can perform all activities independently'}
                {total >= 60 && total < 90 && 'Patient needs minimal assistance with some activities'}
                {total >= 40 && total < 60 && 'Patient requires moderate assistance'}
                {total >= 20 && total < 40 && 'Patient needs substantial help with most activities'}
                {total < 20 && 'Patient requires maximum assistance for all activities'}
              </div>
            </div>
          </motion.div>
        )}

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
            placeholder="Any additional observations about patient's functional status..."
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
              label="Supporting Evidence"
              description="Attach photos, videos, or documentation"
              accept="image/*,video/*,.pdf"
              multiple={true}
              maxSizeMB={50}
            />
          </motion.div>

          <button
            type="submit"
            disabled={submitMutation.isLoading || !allScored || !!mlResult}
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

        {/* ML Functional Independence Results Panel */}
        <AnimatePresence>
          {mlResult && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="border-l-4 border-cyan-500 bg-cyan-50 rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-cyan-900 text-sm flex items-center gap-2">
                  <Brain size={15} className="text-cyan-600" />
                  Functional Independence Risk
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-cyan-700 tabular-nums">
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
                  <p className="text-[10px] font-bold text-cyan-600 ">Key Drivers</p>
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
                className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold transition"
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

