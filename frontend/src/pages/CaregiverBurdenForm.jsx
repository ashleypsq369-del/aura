import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, Save, Users } from 'lucide-react';
import apiClient from '../api/client';
import toast from '../utils/toast';
import offlineStorage from '../utils/offlineStorage';
import FormFileUpload from '../components/FormFileUpload';

const questions = [
  { key: 'q1_more_time', text: 'Do you feel that your relative asks for more help than he/she needs?' },
  { key: 'q2_stressed', text: 'Do you feel stressed between caring for your relative and trying to meet other responsibilities (work/family)?' },
  { key: 'q3_angry', text: 'Do you feel angry when you are around your relative?' },
  { key: 'q4_affect_relationship', text: 'Do you feel that your relative currently affects your relationship with other family members or friends in a negative way?' },
  { key: 'q5_strained', text: 'Do you feel strained when you are around your relative?' },
  { key: 'q6_health_suffered', text: 'Do you feel that your health has suffered because of your involvement with your relative?' },
  { key: 'q7_lack_privacy', text: 'Do you feel that you don\'t have as much privacy as you would like because of your relative?' },
  { key: 'q8_social_life_suffered', text: 'Do you feel that your social life has suffered because you are caring for your relative?' },
  { key: 'q9_lost_control', text: 'Do you feel that you have lost control of your life since your relative\'s illness?' },
  { key: 'q10_uncertain', text: 'Do you feel uncertain about what to do about your relative?' },
  { key: 'q11_do_more', text: 'Do you feel you should be doing more for your relative?' },
  { key: 'q12_do_better', text: 'Do you feel you could do a better job in caring for your relative?' }
];

const options = [
  { value: 0, label: 'Never', color: 'bg-green-500' },
  { value: 1, label: 'Rarely', color: 'bg-blue-500' },
  { value: 2, label: 'Sometimes', color: 'bg-yellow-500' },
  { value: 3, label: 'Frequently', color: 'bg-orange-500' },
  { value: 4, label: 'Nearly Always', color: 'bg-red-500' }
];

export default function CaregiverBurdenForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [scores, setScores] = useState({});
  const [caregiverId, setCaregiverId] = useState('');
  const [supportNeeds, setSupportNeeds] = useState({
    respite_care: false,
    support_group: false,
    counseling: false
  });
  const [notes, setNotes] = useState('');

  // Initialize scores
  useState(() => {
    const initial = {};
    questions.forEach(q => {
      initial[q.key] = null;
    });
    setScores(initial);
  });

  // Fetch patient
  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/patients/${patientId}`);
      return response.data;
    }
  });

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiClient.get('/api/auth/me');
      return response.data;
    }
  });

  // Auto-set caregiver ID when user loaded
  useState(() => {
    if (currentUser?.id && !caregiverId) {
      setCaregiverId(currentUser.id);
    }
  });

  const calculateTotalScore = () => {
    return Object.values(scores).reduce((sum, val) => sum + (val || 0), 0);
  };

  const getBurdenLevel = (total) => {
    if (total <= 10) return 'Little or No Burden';
    if (total <= 20) return 'Mild to Moderate Burden';
    return 'High Burden';
  };

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data) => {
      if (!navigator.onLine) {
        await offlineStorage.saveOffline('caregiver_burden', data);
        return { offline: true, data };
      }
      return await apiClient.post('/api/assessments/caregiver-burden', data);
    },
    onSuccess: (response) => {
      if (response.offline) {
        toast.success('Assessment saved offline! Will sync when online.', { duration: 5000 });
      } else {
        toast.success('Caregiver Burden assessment saved successfully!');
        
        if (response.data.alerts_generated && response.data.alerts_generated.length > 0) {
          toast.error(`${response.data.alerts_generated.length} clinical alert(s) generated - please review`, {
            duration: 5000
          });
        }
      }
      
      queryClient.invalidateQueries(['caregiver-burden', patientId]);
      queryClient.invalidateQueries(['assessment-overview', patientId]);
      
      setTimeout(() => navigate(`/assessments/${patientId}`), 1500);
    },
    onError: (error) => {
      toast.error('Failed to save assessment');
      console.error(error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const allAnswered = Object.values(scores).every(val => val !== null);
    if (!allAnswered) {
      toast.error('Please answer all 12 questions');
      return;
    }

    if (!caregiverId) {
      toast.error('Caregiver ID is required');
      return;
    }

    const totalScore = calculateTotalScore();
    const burdenLevel = getBurdenLevel(totalScore);
    
    submitMutation.mutate({
      patient_id: parseInt(patientId),
      caregiver_id: parseInt(caregiverId),
      ...scores,
      total_score: totalScore,
      burden_level: burdenLevel,
      needs_respite_care: supportNeeds.respite_care,
      needs_support_group: supportNeeds.support_group,
      needs_counseling: supportNeeds.counseling,
      notes
    });
  };

  const allAnswered = Object.values(scores).every(val => val !== null);
  const totalScore = calculateTotalScore();
  const burdenLevel = getBurdenLevel(totalScore);

  const getBurdenColor = () => {
    if (totalScore <= 10) return 'text-green-600';
    if (totalScore <= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-[1000px] mx-auto px-8 py-8 space-y-6">
      <button onClick={() => window.history.back()} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700 transition-colors mb-4 group"><span className="group-hover:-translate-x-1 transition-transform">?</span> Back</button>
{/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-white/20">
              <Users className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Caregiver Burden Assessment</h1>
              <p className="text-purple-100 text-lg">Zarit Burden Interview (Short Form)</p>
              <p className="text-purple-200 text-sm mt-1">
                Patient: <span className="font-bold">{patient?.full_name}</span>
              </p>
            </div>
          </div>
          {allAnswered && (
            <div className="text-right">
              <div className="text-5xl font-bold text-white">{totalScore}</div>
              <div className="text-sm text-purple-100">/ 48</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200"
      >
        <p className="text-sm text-purple-900">
          <strong>For Caregivers:</strong> This assessment helps us understand the challenges you face in providing care. 
          Your honest responses help us provide better support for both you and your loved one. All responses are confidential.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Questions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <Heart className="w-6 h-6 mr-2 text-purple-600" />
            How often do you feel this way?
          </h3>

          <div className="space-y-6">
            {questions.map((question, idx) => (
              <div key={question.key} className="border-b border-slate-100 pb-5 last:border-0">
                <p className="text-sm font-medium text-slate-900 mb-3">
                  {idx + 1}. {question.text}
                </p>
                <div className="flex flex-wrap gap-2">
                  {options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setScores(prev => ({ ...prev, [question.key]: option.value }))}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-all
                        ${scores[question.key] === option.value
                          ? `${option.color} text-white border-2 border-slate-900`
                          : 'bg-slate-100 text-slate-700 border-2 border-slate-200 hover:border-purple-300'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Score Summary */}
        {allAnswered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-purple-50 rounded-xl p-6 border-2 border-purple-300"
          >
            <h3 className="text-lg font-bold text-purple-900 mb-4">Burden Assessment Results</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-slate-900">{totalScore} / 48</div>
                <div className={`text-xl font-bold mt-2 ${getBurdenColor()}`}>
                  {burdenLevel}
                </div>
              </div>
              <div className="text-sm text-slate-700 space-y-1">
                <div>- 0-10: Little or no burden</div>
                <div>- 10-20: Mild to moderate burden</div>
                <div>- 20+: High burden</div>
              </div>
            </div>
            {totalScore > 20 && (
              <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-300">
                <p className="text-sm font-semibold text-red-900">
                  ⚠️ High burden detected. Please consider requesting support services below.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Support Needs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-4">Support Needs (Optional)</h3>
          <p className="text-sm text-slate-600 mb-4">
            Select any support services you would like to learn more about:
          </p>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={supportNeeds.respite_care}
                onChange={(e) => setSupportNeeds(prev => ({ ...prev, respite_care: e.target.checked }))}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-slate-900">
                Respite Care (Temporary relief from caregiving duties)
              </span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={supportNeeds.support_group}
                onChange={(e) => setSupportNeeds(prev => ({ ...prev, support_group: e.target.checked }))}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-slate-900">
                Caregiver Support Group
              </span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={supportNeeds.counseling}
                onChange={(e) => setSupportNeeds(prev => ({ ...prev, counseling: e.target.checked }))}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-slate-900">
                Professional Counseling
              </span>
            </label>
          </div>
        </motion.div>

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any additional concerns or comments..."
            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none"
          />
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
              label="Caregiver Documentation"
              description="Attach caregiver notes or related records"
              accept=".pdf,.doc,.docx,image/*"
              multiple={true}
              maxSizeMB={50}
            />
          </motion.div>

          <button
            type="submit"
            disabled={submitMutation.isLoading || !allAnswered}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>{submitMutation.isLoading ? 'Saving...' : 'Save Assessment'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/assessments/${patientId}`)}
            className="px-6 py-4 bg-slate-200 text-slate-900 rounded-xl font-bold hover:bg-slate-300 transition-colors"
          >
            Cancel
          </button>
        </motion.div>
      </form>
    </div>
  );
}

