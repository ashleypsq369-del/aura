import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, Save, Timer, Dumbbell } from 'lucide-react';
import apiClient from '../api/client';
import toast from '../utils/toast';
import offlineStorage from '../utils/offlineStorage';
import FormFileUpload from '../components/FormFileUpload';

export default function MotorSkillsForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Grip Strength
  const [gripRight, setGripRight] = useState('');
  const [gripLeft, setGripLeft] = useState('');
  const [gripInterpretation, setGripInterpretation] = useState('');

  // Timed Up & Go
  const [tugTime, setTugTime] = useState('');
  const [tugAssistance, setTugAssistance] = useState('');
  const [tugFallRisk, setTugFallRisk] = useState('');

  // 6-Minute Walk Test
  const [walkDistance, setWalkDistance] = useState('');
  const [dyspneaBefore, setDyspneaBefore] = useState('');
  const [dyspneaAfter, setDyspneaAfter] = useState('');
  const [o2SatBefore, setO2SatBefore] = useState('');
  const [o2SatAfter, setO2SatAfter] = useState('');

  // Balance & Coordination
  const [balanceScore, setBalanceScore] = useState('');
  const [coordinationScore, setCoordinationScore] = useState('');

  const [notes, setNotes] = useState('');

  // Fetch patient
  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/patients/${patientId}`);
      return response.data;
    }
  });

  // Auto-calculate TUG fall risk
  const calculateFallRisk = (time) => {
    const t = parseFloat(time);
    if (isNaN(t)) return '';
    if (t <= 10) return 'Low Risk';
    if (t <= 14) return 'Moderate Risk';
    return 'High Risk';
  };

  // Auto-update fall risk when TUG time changes
  useState(() => {
    if (tugTime) {
      const risk = calculateFallRisk(tugTime);
      setTugFallRisk(risk);
    }
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data) => {
      if (!navigator.onLine) {
        await offlineStorage.saveOffline('motor_skills', data);
        return { offline: true, data };
      }
      return await apiClient.post('/api/assessments/motor-skills', data);
    },
    onSuccess: (response) => {
      if (response.offline) {
        toast.success('Assessment saved offline! Will sync when online.', { duration: 5000 });
      } else {
        toast.success('Motor Skills assessment saved successfully!');
        
        if (response.data.alerts_generated && response.data.alerts_generated.length > 0) {
          toast.error(`${response.data.alerts_generated.length} clinical alert(s) generated - please review`, {
            duration: 5000
          });
        }
      }
      
      queryClient.invalidateQueries(['motor-skills', patientId]);
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
    
    // At least one test must be completed
    const hasGrip = gripRight || gripLeft;
    const hasTUG = tugTime;
    const hasWalk = walkDistance;
    const hasBalance = balanceScore || coordinationScore;

    if (!hasGrip && !hasTUG && !hasWalk && !hasBalance) {
      toast.error('Please complete at least one motor skills test');
      return;
    }

    const data = {
      patient_id: parseInt(patientId),
      grip_strength_right: gripRight ? parseFloat(gripRight) : null,
      grip_strength_left: gripLeft ? parseFloat(gripLeft) : null,
      grip_strength_interpretation: gripInterpretation || null,
      tug_time_seconds: tugTime ? parseFloat(tugTime) : null,
      tug_assistance_used: tugAssistance || null,
      tug_fall_risk: tugFallRisk || null,
      walk_distance_meters: walkDistance ? parseFloat(walkDistance) : null,
      walk_dyspnea_before: dyspneaBefore ? parseInt(dyspneaBefore) : null,
      walk_dyspnea_after: dyspneaAfter ? parseInt(dyspneaAfter) : null,
      walk_oxygen_sat_before: o2SatBefore ? parseInt(o2SatBefore) : null,
      walk_oxygen_sat_after: o2SatAfter ? parseInt(o2SatAfter) : null,
      balance_score: balanceScore ? parseInt(balanceScore) : null,
      coordination_score: coordinationScore ? parseInt(coordinationScore) : null,
      notes
    };
    
    submitMutation.mutate(data);
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
{/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-white/20">
            <Activity className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Motor Skills Assessment</h1>
            <p className="text-orange-100 text-lg">Physical Function & Mobility Tests</p>
            <p className="text-orange-200 text-sm mt-1">
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
        className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200"
      >
        <p className="text-sm text-orange-900">
          <strong>Instructions:</strong> Complete the relevant motor skills tests based on patient ability. 
          Not all tests need to be performed - select appropriate tests for the patient's functional level.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grip Strength Test */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#e8fafa] rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <Dumbbell className="w-6 h-6 mr-2 text-orange-600" />
            Grip Strength Test
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Measured in kilograms using a hand dynamometer
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Right Hand (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={gripRight}
                onChange={(e) => setGripRight(e.target.value)}
                placeholder="0.0"
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Left Hand (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={gripLeft}
                onChange={(e) => setGripLeft(e.target.value)}
                placeholder="0.0"
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Interpretation
            </label>
            <select
              value={gripInterpretation}
              onChange={(e) => setGripInterpretation(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
            >
              <option value="">Select...</option>
              <option value="Normal">Normal for age/gender</option>
              <option value="Mild Weakness">Mild Weakness</option>
              <option value="Moderate Weakness">Moderate Weakness</option>
              <option value="Severe Weakness">Severe Weakness</option>
            </select>
          </div>
        </motion.div>

        {/* Timed Up & Go Test */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#e8fafa] rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <Timer className="w-6 h-6 mr-2 text-orange-600" />
            Timed Up & Go Test (TUG)
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Time taken to stand from chair, walk 3 meters, turn, walk back, and sit down
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Time (seconds)
              </label>
              <input
                type="number"
                step="0.1"
                value={tugTime}
                onChange={(e) => {
                  setTugTime(e.target.value);
                  setTugFallRisk(calculateFallRisk(e.target.value));
                }}
                placeholder="0.0"
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
              />
              {tugTime && (
                <p className="text-xs text-slate-500 mt-1">
                  =10s: Low risk | 10-14s: Moderate | &gt;14s: High risk
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assistance Used
              </label>
              <select
                value={tugAssistance}
                onChange={(e) => setTugAssistance(e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
              >
                <option value="">Select...</option>
                <option value="None">None</option>
                <option value="Cane">Cane</option>
                <option value="Walker">Walker</option>
                <option value="Human Assistance">Human Assistance</option>
              </select>
            </div>
          </div>

          {tugFallRisk && (
            <div className={`mt-4 p-3 rounded-lg ${
              tugFallRisk === 'High Risk' ? 'bg-red-100 border border-red-300' :
              tugFallRisk === 'Moderate Risk' ? 'bg-yellow-100 border border-yellow-300' :
              'bg-green-100 border border-green-300'
            }`}>
              <p className={`text-sm font-bold ${
                tugFallRisk === 'High Risk' ? 'text-red-900' :
                tugFallRisk === 'Moderate Risk' ? 'text-yellow-900' :
                'text-green-900'
              }`}>
                Fall Risk: {tugFallRisk}
              </p>
            </div>
          )}
        </motion.div>

        {/* 6-Minute Walk Test */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#e8fafa] rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-orange-600" />
            6-Minute Walk Test (6MWT)
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Distance walked in 6 minutes with vitals monitoring
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Distance Walked (meters)
              </label>
              <input
                type="number"
                step="1"
                value={walkDistance}
                onChange={(e) => setWalkDistance(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
              />
              {walkDistance && (
                <p className="text-xs text-slate-500 mt-1">
                  Normal: 400-700m | Moderate impairment: 300-400m | Severe: &lt;300m
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Dyspnea Before (0-10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={dyspneaBefore}
                onChange={(e) => setDyspneaBefore(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Dyspnea After (0-10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={dyspneaAfter}
                onChange={(e) => setDyspneaAfter(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                O2 Saturation Before (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={o2SatBefore}
                onChange={(e) => setO2SatBefore(e.target.value)}
                placeholder="98"
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                O2 Saturation After (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={o2SatAfter}
                onChange={(e) => setO2SatAfter(e.target.value)}
                placeholder="96"
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {o2SatBefore && o2SatAfter && parseInt(o2SatBefore) - parseInt(o2SatAfter) > 4 && (
            <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-300">
              <p className="text-sm font-bold text-red-900">
                ?? Significant oxygen desaturation detected ({o2SatBefore}% ? {o2SatAfter}%)
              </p>
            </div>
          )}
        </motion.div>

        {/* Balance & Coordination */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#e8fafa] rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            Balance & Coordination
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Balance Score (0-10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={balanceScore}
                onChange={(e) => setBalanceScore(e.target.value)}
                placeholder="0-10"
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                0 = Unable to stand | 10 = Perfect balance
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Coordination Score (0-10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={coordinationScore}
                onChange={(e) => setCoordinationScore(e.target.value)}
                placeholder="0-10"
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                0 = No coordination | 10 = Perfect coordination
              </p>
            </div>
          </div>
        </motion.div>

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#e8fafa] rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any observations, limitations, or special considerations..."
            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
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
              label="Assessment Media"
              description="Attach photos or videos of motor skill assessments"
              accept="image/*,video/*,.pdf"
              multiple={true}
              maxSizeMB={50}
            />
          </motion.div>

          <button
            type="submit"
            disabled={submitMutation.isLoading}
            className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
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

