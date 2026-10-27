import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Brain, Save } from 'lucide-react';
import apiClient from '../api/client';
import toast from '../utils/toast';
import FormFileUpload from '../components/FormFileUpload';

const mmseComponents = [
  { key: 'mmse_orientation_time', label: 'Orientation to Time', max: 5, desc: 'Year, season, date, day, month' },
  { key: 'mmse_orientation_place', label: 'Orientation to Place', max: 5, desc: 'State, county, town, hospital, floor' },
  { key: 'mmse_registration', label: 'Registration', max: 3, desc: 'Repeat 3 words' },
  { key: 'mmse_attention_calculation', label: 'Attention & Calculation', max: 5, desc: 'Serial 7s or spell WORLD backwards' },
  { key: 'mmse_recall', label: 'Recall', max: 3, desc: 'Recall the 3 words' },
  { key: 'mmse_language', label: 'Language', max: 8, desc: 'Naming, repetition, 3-stage command, reading, writing' },
  { key: 'mmse_visual_construction', label: 'Visual Construction', max: 1, desc: 'Copy intersecting pentagons' }
];

const mocaComponents = [
  { key: 'moca_visuospatial_executive', label: 'Visuospatial/Executive', max: 5, desc: 'Trail making, cube copy, clock' },
  { key: 'moca_naming', label: 'Naming', max: 3, desc: 'Lion, rhinoceros, camel' },
  { key: 'moca_attention', label: 'Attention', max: 6, desc: 'Forward/backward digits, vigilance, serial 7s' },
  { key: 'moca_language', label: 'Language', max: 3, desc: 'Sentence repetition, fluency' },
  { key: 'moca_abstraction', label: 'Abstraction', max: 2, desc: 'Similarities' },
  { key: 'moca_delayed_recall', label: 'Delayed Recall', max: 5, desc: 'Remember 5 words' },
  { key: 'moca_orientation', label: 'Orientation', max: 6, desc: 'Date, month, year, day, place, city' }
];

export default function CognitiveAssessmentForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [assessmentType, setAssessmentType] = useState('MMSE'); // or 'MoCA'
  const [educationYears, setEducationYears] = useState('');
  
  const [mmseScores, setMmseScores] = useState({
    mmse_orientation_time: '',
    mmse_orientation_place: '',
    mmse_registration: '',
    mmse_attention_calculation: '',
    mmse_recall: '',
    mmse_language: '',
    mmse_visual_construction: ''
  });

  const [mocaScores, setMocaScores] = useState({
    moca_visuospatial_executive: '',
    moca_naming: '',
    moca_attention: '',
    moca_language: '',
    moca_abstraction: '',
    moca_delayed_recall: '',
    moca_orientation: ''
  });

  const [notes, setNotes] = useState('');

  // Fetch patient
  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/patients/${patientId}`);
      return response.data;
    }
  });

  // Calculate MMSE total
  const calculateMMSETotal = () => {
    return Object.values(mmseScores).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
  };

  // Calculate MoCA total
  const calculateMoCATotal = () => {
    let total = Object.values(mocaScores).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
    // Add 1 point if education <= 12 years
    if (parseInt(educationYears) <= 12 && parseInt(educationYears) > 0) {
      total += 1;
    }
    return Math.min(total, 30); // Cap at 30
  };

  const getMMSEInterpretation = (total) => {
    if (total >= 24) return { label: 'Normal', color: 'text-green-600', bg: 'bg-green-100' };
    if (total >= 18) return { label: 'Mild Impairment', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (total >= 10) return { label: 'Moderate Impairment', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { label: 'Severe Impairment', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getMoCAInterpretation = (total) => {
    if (total >= 26) return { label: 'Normal', color: 'text-green-600', bg: 'bg-green-100' };
    if (total >= 18) return { label: 'Mild Cognitive Impairment', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (total >= 10) return { label: 'Moderate Impairment', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { label: 'Severe Impairment', color: 'text-red-600', bg: 'bg-red-100' };
  };

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data) => {
      return await apiClient.post('/api/assessments/cognitive', data);
    },
    onSuccess: (response) => {
      toast.success('Cognitive assessment saved successfully!');
      
      if (response.data.alerts_generated && response.data.alerts_generated.length > 0) {
        toast.error(`${response.data.alerts_generated.length} clinical alert(s) generated - please review`, {
          duration: 5000
        });
      }
      
      queryClient.invalidateQueries(['cognitive', patientId]);
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
    
    const data = {
      patient_id: parseInt(patientId),
      assessment_type: assessmentType,
      patient_education_years: parseInt(educationYears) || null,
      notes
    };

    if (assessmentType === 'MMSE') {
      // Check all MMSE scores are filled
      const allScored = Object.values(mmseScores).every(val => val !== '');
      if (!allScored) {
        toast.error('Please complete all MMSE components');
        return;
      }
      
      Object.entries(mmseScores).forEach(([key, value]) => {
        data[key] = parseInt(value);
      });
      data.mmse_total = calculateMMSETotal();
      data.interpretation = getMMSEInterpretation(data.mmse_total).label;
    } else {
      // Check all MoCA scores are filled
      const allScored = Object.values(mocaScores).every(val => val !== '');
      if (!allScored) {
        toast.error('Please complete all MoCA components');
        return;
      }
      
      Object.entries(mocaScores).forEach(([key, value]) => {
        data[key] = parseInt(value);
      });
      data.moca_education_adjustment = (parseInt(educationYears) <= 12 && parseInt(educationYears) > 0) ? 1 : 0;
      data.moca_total = calculateMoCATotal();
      data.interpretation = getMoCAInterpretation(data.moca_total).label;
    }
    
    submitMutation.mutate(data);
  };

  const mmseTotal = calculateMMSETotal();
  const mocaTotal = calculateMoCATotal();
  const mmseInterpretation = getMMSEInterpretation(mmseTotal);
  const mocaInterpretation = getMoCAInterpretation(mocaTotal);

  const currentComponents = assessmentType === 'MMSE' ? mmseComponents : mocaComponents;
  const currentScores = assessmentType === 'MMSE' ? mmseScores : mocaScores;
  const setCurrentScores = assessmentType === 'MMSE' ? setMmseScores : setMocaScores;
  const currentTotal = assessmentType === 'MMSE' ? mmseTotal : mocaTotal;
  const currentInterpretation = assessmentType === 'MMSE' ? mmseInterpretation : mocaInterpretation;

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
{/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-5 border-l-4 border-teal-500 bg-violet-50 dark:bg-violet-900/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-white/20">
              <Brain className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Cognitive Assessment</h1>
              <p className="text-purple-100 text-lg">MMSE & MoCA Screening</p>
              <p className="text-purple-200 text-sm mt-1">
                Patient: <span className="font-bold">{patient?.full_name}</span>
              </p>
            </div>
          </div>
          {(Object.values(currentScores).every(v => v !== '')) && (
            <div className="text-right">
              <div className="text-5xl font-bold text-white">{currentTotal}</div>
              <div className="text-sm text-purple-100">/ 30</div>
              <div className="mt-2 px-3 py-1 rounded-full text-sm font-bold bg-white/20 text-white">
                {currentInterpretation.label}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Test Type Selector */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-[#f0f6fa] rounded-xl p-6 shadow-md border-2 border-slate-200"
      >
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Select Assessment Type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setAssessmentType('MMSE')}
            className={`p-4 rounded-lg border-2 transition-all ${
              assessmentType === 'MMSE'
                ? 'border-purple-500 bg-purple-50'
                : 'border-slate-200 hover:border-purple-300'
            }`}
          >
            <div className="font-bold text-lg text-slate-900">MMSE</div>
            <div className="text-sm text-slate-600">Mini-Mental State Examination</div>
            <div className="text-xs text-slate-500 mt-1">Most widely used, 7 components</div>
          </button>
          
          <button
            type="button"
            onClick={() => setAssessmentType('MoCA')}
            className={`p-4 rounded-lg border-2 transition-all ${
              assessmentType === 'MoCA'
                ? 'border-purple-500 bg-purple-50'
                : 'border-slate-200 hover:border-purple-300'
            }`}
          >
            <div className="font-bold text-lg text-slate-900">MoCA</div>
            <div className="text-sm text-slate-600">Montreal Cognitive Assessment</div>
            <div className="text-xs text-slate-500 mt-1">More sensitive, 7 components</div>
          </button>
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200"
      >
        <p className="text-sm text-purple-900 mb-2">
          <strong>Instructions:</strong> Administer the {assessmentType} according to standardized protocol. 
          Score each component based on patient's responses. All components must be completed.
        </p>
        {assessmentType === 'MoCA' && (
          <p className="text-sm text-purple-900 font-semibold">
            ?? Note: 1 point is added if education = 12 years (automatically calculated)
          </p>
        )}
      </motion.div>

      {/* Education */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-[#f0f6fa] rounded-xl p-6 shadow-md border-2 border-slate-200"
      >
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Patient's Years of Education {assessmentType === 'MoCA' && <span className="text-red-500">*</span>}
        </label>
        <input
          type="number"
          min="0"
          max="30"
          value={educationYears}
          onChange={(e) => setEducationYears(e.target.value)}
          placeholder="e.g., 12"
          className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none"
          required={assessmentType === 'MoCA'}
        />
        {assessmentType === 'MoCA' && parseInt(educationYears) <= 12 && parseInt(educationYears) > 0 && (
          <p className="text-xs text-green-600 mt-1">
            ? +1 bonus point will be added to final score
          </p>
        )}
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {currentComponents.map((component, idx) => (
          <motion.div
            key={component.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + idx * 0.05 }}
            className="bg-[#f0f6fa] rounded-xl p-6 shadow-md border-2 border-slate-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">{component.label}</h3>
                <p className="text-sm text-slate-600">{component.desc}</p>
                <p className="text-xs text-slate-500 mt-1">Maximum: {component.max} points</p>
              </div>
              {currentScores[component.key] !== '' && (
                <div className="text-3xl font-bold text-purple-600">
                  {currentScores[component.key]} / {component.max}
                </div>
              )}
            </div>

            {/* Score Input */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-700">Score:</label>
              <input
                type="number"
                min="0"
                max={component.max}
                value={currentScores[component.key]}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= component.max)) {
                    setCurrentScores({ ...currentScores, [component.key]: val });
                  }
                }}
                className="w-24 px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none text-center text-lg font-bold"
                required
              />
              <span className="text-slate-600">/ {component.max}</span>
            </div>
          </motion.div>
        ))}

        {/* Score Summary */}
        {Object.values(currentScores).every(v => v !== '') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${currentInterpretation.bg} rounded-xl p-6 border-2 border-slate-300`}
          >
            <div className="text-center">
              <div className="text-sm text-slate-600 mb-2">{assessmentType} Total Score</div>
              <div className="text-5xl font-bold mb-2">{currentTotal} / 30</div>
              {assessmentType === 'MoCA' && parseInt(educationYears) <= 12 && parseInt(educationYears) > 0 && (
                <div className="text-xs text-slate-600 mb-2">
                  (Base: {mocaTotal - 1} + Education adjustment: +1)
                </div>
              )}
              <div className={`text-2xl font-bold ${currentInterpretation.color} mb-3`}>
                {currentInterpretation.label}
              </div>
              <div className="text-sm text-slate-700">
                {currentTotal >= 26 && assessmentType === 'MoCA' && 'Normal cognitive function'}
                {currentTotal >= 24 && assessmentType === 'MMSE' && 'No cognitive impairment detected'}
                {currentTotal >= 18 && currentTotal < 24 && assessmentType === 'MMSE' && 'Mild cognitive impairment - consider further evaluation'}
                {currentTotal >= 18 && currentTotal < 26 && assessmentType === 'MoCA' && 'Possible mild cognitive impairment'}
                {currentTotal >= 10 && currentTotal < 18 && 'Moderate impairment - interventions recommended'}
                {currentTotal < 10 && 'Severe impairment - urgent specialist referral needed'}
              </div>
            </div>
          </motion.div>
        )}

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-[#f0f6fa] rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Clinical Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Observations during testing, patient cooperation, environmental factors..."
            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none"
          />
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
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
              label="Test Materials"
              description="Attach test results or supporting documentation"
              accept="image/*,.pdf"
              multiple={true}
              maxSizeMB={50}
            />
          </motion.div>

          <button
            type="submit"
            disabled={submitMutation.isLoading}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
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

