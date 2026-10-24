import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Zap, Save, MapPin, Activity, SmilePlus, Footprints, Briefcase, Users, Moon, Heart } from 'lucide-react';
import apiClient from '../api/client';
import toast from '../utils/toast';
import VoiceInput from '../components/VoiceInput';
import offlineStorage from '../utils/offlineStorage';
import FormFileUpload from '../components/FormFileUpload';

const interferenceItems = [
  { key: 'interference_activity',  label: 'General Activity',       Icon: Activity   },
  { key: 'interference_mood',      label: 'Mood',                   Icon: SmilePlus  },
  { key: 'interference_walking',   label: 'Walking Ability',        Icon: Footprints },
  { key: 'interference_work',      label: 'Normal Work',            Icon: Briefcase  },
  { key: 'interference_relations', label: 'Relations with Others',  Icon: Users      },
  { key: 'interference_sleep',     label: 'Sleep',                  Icon: Moon       },
  { key: 'interference_enjoyment', label: 'Enjoyment of Life',      Icon: Heart      },
];

const painTypes = [
  'Aching', 'Throbbing', 'Shooting', 'Stabbing', 'Gnawing', 
  'Sharp', 'Tender', 'Burning', 'Exhausting', 'Penetrating', 
  'Nagging', 'Numb', 'Miserable', 'Unbearable'
];

export default function BriefPainInventoryForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Pain Severity
  const [painWorst, setPainWorst] = useState(0);
  const [painLeast, setPainLeast] = useState(0);
  const [painAverage, setPainAverage] = useState(0);
  const [painCurrent, setPainCurrent] = useState(0);

  // Pain Characteristics
  const [painLocation, setPainLocation] = useState('');
  const [painType, setPainType] = useState([]);

  // Pain Interference
  const [interference, setInterference] = useState({
    interference_activity: 0,
    interference_mood: 0,
    interference_walking: 0,
    interference_work: 0,
    interference_relations: 0,
    interference_sleep: 0,
    interference_enjoyment: 0
  });

  // Management
  const [currentMedications, setCurrentMedications] = useState('');
  const [medicationEffectiveness, setMedicationEffectiveness] = useState(5);
  const [notes, setNotes] = useState('');

  // Fetch patient
  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/patients/${patientId}`);
      return response.data;
    }
  });

  // Fetch previous assessments (used for history display - kept for future use)
  useQuery({
    queryKey: ['pain', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/assessments/pain/${patientId}?limit=5`);
      return response.data;
    }
  });

  const togglePainType = (type) => {
    if (painType.includes(type)) {
      setPainType(painType.filter(t => t !== type));
    } else {
      setPainType([...painType, type]);
    }
  };

  const calculateAverageInterference = () => {
    const values = Object.values(interference);
    const sum = values.reduce((a, b) => a + b, 0);
    return (sum / values.length).toFixed(1);
  };

  const getInterferenceSeverity = (avg) => {
    if (avg >= 7) return { label: 'Severe Interference', color: 'text-red-600', bg: 'bg-red-100' };
    if (avg >= 5) return { label: 'Moderate Interference', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (avg >= 3) return { label: 'Mild Interference', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Minimal Interference', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const getScoreColor = (value) => {
    if (value === 0) return 'from-green-500 to-emerald-500';
    if (value <= 3) return 'from-green-400 to-teal-500';
    if (value <= 6) return 'from-yellow-400 to-orange-400';
    if (value <= 8) return 'from-orange-500 to-red-500';
    return 'from-red-600 to-rose-700';
  };

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data) => {
      // Check if online
      if (!navigator.onLine) {
        // Save offline
        await offlineStorage.saveOffline('pain', data);
        return { offline: true, data };
      }
      
      // Save online
      return await apiClient.post('/api/assessments/pain', data);
    },
    onSuccess: (response) => {
      if (response.offline) {
        toast.success('Assessment saved offline! Will sync when online.', { duration: 5000 });
      } else {
        toast.success('Pain assessment saved successfully!');
        
        if (response.data.alerts_generated && response.data.alerts_generated.length > 0) {
          toast.error(`${response.data.alerts_generated.length} clinical alert(s) generated - please review`, {
            duration: 5000
          });
        }
      }
      
      queryClient.invalidateQueries(['pain', patientId]);
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
    
    if (!painLocation.trim()) {
      toast.error('Please describe pain location');
      return;
    }
    
    submitMutation.mutate({
      patient_id: parseInt(patientId),
      pain_worst: painWorst,
      pain_least: painLeast,
      pain_average: painAverage,
      pain_current: painCurrent,
      pain_location: painLocation,
      pain_type: painType.join(', '),
      ...interference,
      current_medications: currentMedications,
      medication_effectiveness: medicationEffectiveness,
      notes
    });
  };

  const avgInterference = calculateAverageInterference();
  const interferenceSeverity = getInterferenceSeverity(parseFloat(avgInterference));

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
{/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 to-rose-600 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-white/20">
            <Zap className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Brief Pain Inventory</h1>
            <p className="text-red-100 text-lg">Comprehensive Pain Assessment</p>
            <p className="text-red-200 text-sm mt-1">
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
        className="bg-red-50 rounded-lg p-4 border-2 border-red-200"
      >
        <p className="text-sm text-red-900">
          <strong>Instructions:</strong> This assessment evaluates pain severity, location, and how it interferes with daily activities.
          Please rate pain levels <strong>in the last 24 hours</strong> on a scale from 0 (no pain) to 10 (pain as bad as you can imagine).
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pain Severity Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Zap size={20} className="text-rose-500 flex-shrink-0" /> Pain Severity
          </h2>

          <div className="space-y-4">
            {/* Worst Pain */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-slate-900">Worst Pain (last 24 hours)</label>
                <span className={`text-3xl font-bold bg-gradient-to-r ${getScoreColor(painWorst)} text-transparent bg-clip-text`}>
                  {painWorst}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={painWorst}
                onChange={(e) => setPainWorst(parseInt(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(253, 224, 71) 30%, rgb(251, 146, 60) 60%, rgb(239, 68, 68) 100%)`
                }}
              />
            </div>

            {/* Least Pain */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-slate-900">Least Pain (last 24 hours)</label>
                <span className={`text-3xl font-bold bg-gradient-to-r ${getScoreColor(painLeast)} text-transparent bg-clip-text`}>
                  {painLeast}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={painLeast}
                onChange={(e) => setPainLeast(parseInt(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(253, 224, 71) 30%, rgb(251, 146, 60) 60%, rgb(239, 68, 68) 100%)`
                }}
              />
            </div>

            {/* Average Pain */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-slate-900">Average Pain (last 24 hours)</label>
                <span className={`text-3xl font-bold bg-gradient-to-r ${getScoreColor(painAverage)} text-transparent bg-clip-text`}>
                  {painAverage}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={painAverage}
                onChange={(e) => setPainAverage(parseInt(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(253, 224, 71) 30%, rgb(251, 146, 60) 60%, rgb(239, 68, 68) 100%)`
                }}
              />
            </div>

            {/* Current Pain */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-slate-900">Pain Right Now</label>
                <span className={`text-3xl font-bold bg-gradient-to-r ${getScoreColor(painCurrent)} text-transparent bg-clip-text`}>
                  {painCurrent}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={painCurrent}
                onChange={(e) => setPainCurrent(parseInt(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(253, 224, 71) 30%, rgb(251, 146, 60) 60%, rgb(239, 68, 68) 100%)`
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Pain Location */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <MapPin className="w-6 h-6 mr-2" /> Pain Location
          </h2>
          
          <div className="flex items-start space-x-3">
            <textarea
              value={painLocation}
              onChange={(e) => setPainLocation(e.target.value)}
              rows={3}
              placeholder="Describe where you feel pain (e.g., lower back, right knee, chest, abdomen)..."
              className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-red-500 focus:outline-none"
              required
            />
            
            {/* Voice Input Button */}
            <VoiceInput
              onTranscript={(text) => {
                setPainLocation(prev => prev ? `${prev} ${text}` : text);
              }}
              placeholder="Speak to describe pain location"
              buttonClassName="p-3 rounded-lg border-2 border-blue-500 bg-blue-500 text-white hover:bg-blue-600 transition-all"
            />
          </div>
          
          <p className="text-xs text-slate-500 mt-2">
            ?? Click the microphone button to use voice input
          </p>
        </motion.div>

        {/* Pain Type */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Pain Type (Select all that apply)
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {painTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => togglePainType(type)}
                className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  painType.includes(type)
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-slate-200 text-slate-700 hover:border-red-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          {painType.length > 0 && (
            <p className="text-sm text-slate-600 mt-3">
              Selected: <span className="font-semibold">{painType.join(', ')}</span>
            </p>
          )}
        </motion.div>

        {/* Pain Interference */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Pain Interference with Daily Life
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Rate how much pain has interfered with each area (0 = does not interfere, 10 = completely interferes)
          </p>

          <div className="space-y-4">
            {interferenceItems.map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <item.Icon size={18} className="text-slate-500 flex-shrink-0" />
                    <label className="font-semibold text-slate-900">{item.label}</label>
                  </div>
                  <span className="text-2xl font-bold text-slate-700">
                    {interference[item.key]}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={interference[item.key]}
                  onChange={(e) => setInterference({ ...interference, [item.key]: parseInt(e.target.value) })}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-green-400 via-yellow-400 to-red-500"
                />
              </div>
            ))}
          </div>

          {/* Average Interference */}
          <div className={`mt-6 p-4 rounded-lg ${interferenceSeverity.bg}`}>
            <div className="text-center">
              <div className="text-sm text-slate-600 mb-1">Average Interference</div>
              <div className="text-4xl font-bold mb-2">{avgInterference} / 10</div>
              <div className={`text-lg font-bold ${interferenceSeverity.color}`}>
                {interferenceSeverity.label}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pain Management */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            ?? Current Pain Management
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current Medications
              </label>
              <textarea
                value={currentMedications}
                onChange={(e) => setCurrentMedications(e.target.value)}
                rows={2}
                placeholder="List all pain medications, doses, and frequency..."
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-red-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-slate-900">Medication Effectiveness</label>
                <span className="text-2xl font-bold text-slate-700">
                  {medicationEffectiveness}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={medicationEffectiveness}
                onChange={(e) => setMedicationEffectiveness(parseInt(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-red-400 via-yellow-400 to-green-500"
              />
              <div className="flex justify-between mt-1 text-xs text-slate-500">
                <span>0% (Not working)</span>
                <span>50%</span>
                <span>100% (Very effective)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Additional Notes (Optional)
          </label>
          
          <div className="flex items-start space-x-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional observations or context about the pain..."
              className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-red-500 focus:outline-none"
            />
            
            {/* Voice Input Button */}
            <VoiceInput
              onTranscript={(text) => {
                setNotes(prev => prev ? `${prev} ${text}` : text);
              }}
              placeholder="Speak to add notes"
              buttonClassName="p-3 rounded-lg border-2 border-blue-500 bg-blue-500 text-white hover:bg-blue-600 transition-all"
            />
          </div>
          
          <p className="text-xs text-slate-500 mt-2">
            ?? Use voice input to quickly add observations
          </p>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
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
              label="Pain Documentation"
              description="Attach pain location images, charts, or reports"
              accept="image/*,video/*,.pdf"
              multiple={true}
              maxSizeMB={50}
            />
          </motion.div>

          <button
            type="submit"
            disabled={submitMutation.isLoading}
            className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
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

