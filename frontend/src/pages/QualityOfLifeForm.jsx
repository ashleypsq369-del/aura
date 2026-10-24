import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Smile, Save } from 'lucide-react';
import apiClient from '../api/client';
import toast from '../utils/toast';
import offlineStorage from '../utils/offlineStorage';
import FormFileUpload from '../components/FormFileUpload';

const questions = {
  physical: [
    { key: 'physical_lack_of_energy', text: 'I have a lack of energy' },
    { key: 'physical_nausea', text: 'I have nausea' },
    { key: 'physical_meeting_needs', text: 'Because of my physical condition, I have trouble meeting the needs of my family' },
    { key: 'physical_pain', text: 'I have pain' },
    { key: 'physical_side_effects', text: 'I am bothered by side effects of treatment' },
    { key: 'physical_feel_ill', text: 'I feel ill' },
    { key: 'physical_bed_time', text: 'I am forced to spend time in bed' }
  ],
  social: [
    { key: 'social_close_to_friends', text: 'I feel close to my friends' },
    { key: 'social_emotional_support', text: 'I get emotional support from my family' },
    { key: 'social_support_from_family', text: 'I get support from my friends' },
    { key: 'social_acceptance_of_illness', text: 'My family has accepted my illness' },
    { key: 'social_family_communication', text: 'I am satisfied with family communication about my illness' },
    { key: 'social_close_to_partner', text: 'I feel close to my partner (or the person who is my main support)' },
    { key: 'social_satisfaction_sex_life', text: 'I am satisfied with my sex life' }
  ],
  emotional: [
    { key: 'emotional_feel_sad', text: 'I feel sad' },
    { key: 'emotional_coping_with_illness', text: 'I am satisfied with how I am coping with my illness' },
    { key: 'emotional_losing_hope', text: 'I am losing hope in the fight against my illness' },
    { key: 'emotional_feel_nervous', text: 'I feel nervous' },
    { key: 'emotional_worry_about_dying', text: 'I worry about dying' },
    { key: 'emotional_worry_about_condition', text: 'I worry that my condition will get worse' }
  ],
  functional: [
    { key: 'functional_able_to_work', text: 'I am able to work (include work at home)' },
    { key: 'functional_work_fulfilling', text: 'My work (include work at home) is fulfilling' },
    { key: 'functional_enjoy_life', text: 'I am able to enjoy life' },
    { key: 'functional_accepted_illness', text: 'I have accepted my illness' },
    { key: 'functional_sleeping_well', text: 'I am sleeping well' },
    { key: 'functional_enjoying_hobbies', text: 'I am enjoying the things I usually do for fun' },
    { key: 'functional_content_with_qol', text: 'I am content with the quality of my life right now' }
  ]
};

const options = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'A little bit' },
  { value: 2, label: 'Somewhat' },
  { value: 3, label: 'Quite a bit' },
  { value: 4, label: 'Very much' }
];

export default function QualityOfLifeForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState('');

  // Initialize all scores to null
  useState(() => {
    const initial = {};
    Object.values(questions).flat().forEach(q => {
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

  const calculateDomainScore = (domain) => {
    const domainQuestions = questions[domain];
    const values = domainQuestions.map(q => scores[q.key] || 0);
    return values.reduce((sum, val) => sum + val, 0);
  };

  const calculateTotalScore = () => {
    return Object.keys(questions).reduce((sum, domain) => sum + calculateDomainScore(domain), 0);
  };

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data) => {
      if (!navigator.onLine) {
        await offlineStorage.saveOffline('qol', data);
        return { offline: true, data };
      }
      return await apiClient.post('/api/assessments/qol', data);
    },
    onSuccess: (response) => {
      if (response.offline) {
        toast.success('Assessment saved offline - will sync when online', { duration: 5000 });
      } else {
        toast.success('Quality of Life assessment saved successfully');
        
        if (response.data.alerts_generated && response.data.alerts_generated.length > 0) {
          toast.error(`${response.data.alerts_generated.length} clinical alert(s) generated - please review`, {
            duration: 5000
          });
        }
      }
      
      queryClient.invalidateQueries(['qol', patientId]);
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
    
    // Check all questions answered
    const allAnswered = Object.values(scores).every(val => val !== null);
    if (!allAnswered) {
      toast.error('Please answer all questions');
      return;
    }

    const physicalScore = calculateDomainScore('physical');
    const socialScore = calculateDomainScore('social');
    const emotionalScore = calculateDomainScore('emotional');
    const functionalScore = calculateDomainScore('functional');
    const totalScore = calculateTotalScore();
    
    submitMutation.mutate({
      patient_id: parseInt(patientId),
      ...scores,
      physical_score: physicalScore,
      social_score: socialScore,
      emotional_score: emotionalScore,
      functional_score: functionalScore,
      total_score: totalScore,
      notes
    });
  };

  const allAnswered = Object.values(scores).every(val => val !== null);
  const totalScore = calculateTotalScore();

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      <button onClick={() => window.history.back()} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700 transition-colors mb-4 group"><span className="group-hover:-translate-x-1 transition-transform">?</span> Back</button>
{/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-white/20">
              <Smile className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Quality of Life</h1>
              <p className="text-green-100 text-lg">FACT-G (Functional Assessment of Cancer Therapy - General)</p>
              <p className="text-green-200 text-sm mt-1">
                Patient: <span className="font-bold">{patient?.full_name}</span>
              </p>
            </div>
          </div>
          {allAnswered && (
            <div className="text-right">
              <div className="text-5xl font-bold text-white">{totalScore}</div>
              <div className="text-sm text-green-100">/ 108</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-green-50 rounded-lg p-4 border-2 border-green-200"
      >
        <p className="text-sm text-green-900">
          <strong>Instructions:</strong> Below is a list of statements that other people with your illness have said are important. 
          Please indicate how true each statement has been for you <strong>during the past 7 days</strong>.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Physical Well-Being */}
        <DomainSection
          title="Physical Well-Being"
          icon="??"
          color="from-red-500 to-orange-500"
          questions={questions.physical}
          scores={scores}
          setScores={setScores}
          domainScore={calculateDomainScore('physical')}
          maxScore={28}
        />

        {/* Social/Family Well-Being */}
        <DomainSection
          title="Social/Family Well-Being"
          icon="???????????"
          color="from-blue-500 to-cyan-500"
          questions={questions.social}
          scores={scores}
          setScores={setScores}
          domainScore={calculateDomainScore('social')}
          maxScore={28}
        />

        {/* Emotional Well-Being */}
        <DomainSection
          title="Emotional Well-Being"
          icon="??"
          color="from-purple-500 to-pink-500"
          questions={questions.emotional}
          scores={scores}
          setScores={setScores}
          domainScore={calculateDomainScore('emotional')}
          maxScore={24}
        />

        {/* Functional Well-Being */}
        <DomainSection
          title="Functional Well-Being"
          icon="?"
          color="from-green-500 to-teal-500"
          questions={questions.functional}
          scores={scores}
          setScores={setScores}
          domainScore={calculateDomainScore('functional')}
          maxScore={28}
        />

        {/* Score Summary */}
        {allAnswered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 rounded-xl p-6 border-2 border-green-300"
          >
            <h3 className="text-lg font-bold text-green-900 mb-4">Quality of Life Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <ScorePill label="Physical" score={calculateDomainScore('physical')} max={28} />
              <ScorePill label="Social" score={calculateDomainScore('social')} max={28} />
              <ScorePill label="Emotional" score={calculateDomainScore('emotional')} max={24} />
              <ScorePill label="Functional" score={calculateDomainScore('functional')} max={28} />
              <ScorePill label="Total" score={totalScore} max={108} highlight />
            </div>
            <p className="text-xs text-green-700 mt-4">
              Higher scores indicate better quality of life. Total score ranges from 0-108.
            </p>
          </motion.div>
        )}

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
            placeholder="Any additional observations..."
            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-green-500 focus:outline-none"
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
              label="Supporting Materials"
              description="Attach supporting documentation"
              accept=".pdf,.doc,.docx"
              multiple={true}
              maxSizeMB={50}
            />
          </motion.div>

          <button
            type="submit"
            disabled={submitMutation.isLoading || !allAnswered}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
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

function DomainSection({ title, icon, questions, scores, setScores, domainScore, maxScore }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200"
    >
      <div className={`flex items-center justify-between mb-4 pb-3 border-b-2`}>
        <h3 className="text-xl font-bold text-slate-900 flex items-center">
          <span className="text-3xl mr-3">{icon}</span>
          {title}
        </h3>
        <div className="text-2xl font-bold text-slate-700">
          {domainScore} / {maxScore}
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question, idx) => (
          <div key={question.key} className="border-b border-slate-100 pb-4 last:border-0">
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
                      ? 'bg-green-500 text-white border-2 border-green-600'
                      : 'bg-slate-100 text-slate-700 border-2 border-slate-200 hover:border-green-300'
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
  );
}

function ScorePill({ label, score, max, highlight }) {
  const percentage = (score / max) * 100;
  const getColor = () => {
    if (percentage >= 70) return 'bg-green-100 text-green-800 border-green-300';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  return (
    <div className={`text-center p-3 rounded-lg border-2 ${highlight ? 'border-green-500 bg-green-100' : getColor()}`}>
      <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>
      <div className="text-2xl font-bold">{score}</div>
      <div className="text-xs text-slate-600">/ {max}</div>
    </div>
  );
}

