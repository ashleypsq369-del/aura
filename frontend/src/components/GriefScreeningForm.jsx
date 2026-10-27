import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import toast from '../utils/toast';
import { bereavementAPI } from '../api/client';
import ModalShell from './ui/ModalShell';

/**
 * Grief Screening Form (PG-13 Questionnaire)
 * 
 * Priority 5: Bereavement Support
 * Implements Prolonged Grief-13 (PG-13) screening tool
 * 
 * Features:
 * - 13-question validated grief screening
 * - Score interpretation
 * - Automatic referral if high risk
 * - Track over time
 */

export default function GriefScreeningForm({ onClose, onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  // PG-13 Questions
  // Each question rated on 5-point scale: 1 = Not at all, 5 = Overwhelmingly
  const pg13Questions = [
    {
      id: 'yearning',
      question: 'Do you yearn for (miss very much) the person who died?',
      category: 'Separation Distress'
    },
    {
      id: 'loneliness',
      question: 'Do you feel emotional pain or pangs of grief related to the death?',
      category: 'Separation Distress'
    },
    {
      id: 'preoccupation',
      question: 'Are you preoccupied with thoughts or memories of the person who died?',
      category: 'Separation Distress'
    },
    {
      id: 'difficulty_accepting',
      question: 'Do you have difficulty accepting the death?',
      category: 'Cognitive/Emotional/Behavioral'
    },
    {
      id: 'disbelief',
      question: 'Do you feel shocked, stunned, or emotionally numb about the death?',
      category: 'Cognitive/Emotional/Behavioral'
    },
    {
      id: 'difficulty_positive',
      question: 'Is it hard for you to think positive things about your life or future without the person who died?',
      category: 'Cognitive/Emotional/Behavioral'
    },
    {
      id: 'bitterness',
      question: 'Do you feel bitter or angry about the death?',
      category: 'Cognitive/Emotional/Behavioral'
    },
    {
      id: 'self_blame',
      question: 'Do you blame yourself for the death?',
      category: 'Cognitive/Emotional/Behavioral'
    },
    {
      id: 'avoidance',
      question: 'Do you avoid reminders that the person died?',
      category: 'Cognitive/Emotional/Behavioral'
    },
    {
      id: 'difficulty_trusting',
      question: 'Do you have difficulty trusting other people since the death?',
      category: 'Cognitive/Emotional/Behavioral'
    },
    {
      id: 'detachment',
      question: 'Do you feel detached or distant from other people since the death?',
      category: 'Functional Impairment'
    },
    {
      id: 'meaninglessness',
      question: 'Do you feel that life is meaningless or empty without the person who died?',
      category: 'Functional Impairment'
    },
    {
      id: 'confusion',
      question: 'Do you feel confused about your role in life or feel like a part of you died?',
      category: 'Functional Impairment'
    }
  ];

  const scaleOptions = [
    { value: 1, label: 'Not at all' },
    { value: 2, label: 'Slightly' },
    { value: 3, label: 'Moderately' },
    { value: 4, label: 'Quite a bit' },
    { value: 5, label: 'Overwhelmingly' }
  ];

  // Submit screening mutation
  const submitScreeningMutation = useMutation({
    mutationFn: async (data) => {
      const response = await bereavementAPI.submitGriefScreening(data);
      return response.data;
    },
    onSuccess: (data) => {
      setResults(data);
      setShowResults(true);
    },
    onError: () => {
      toast.error('Failed to submit screening');
    }
  });

  const handleResponse = (value) => {
    const questionId = pg13Questions[currentQuestion].id;
    setResponses({ ...responses, [questionId]: value });

    // Auto-advance to next question
    if (currentQuestion < pg13Questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      // All questions answered - submit
      setTimeout(() => {
        submitScreeningMutation.mutate({
          responses: { ...responses, [questionId]: value }
        });
      }, 300);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const progressPercent = ((currentQuestion + 1) / pg13Questions.length) * 100;
  const currentQ = pg13Questions[currentQuestion];

  return (
    <ModalShell
      open={true}
      onClose={onClose}
      title={showResults ? 'Screening Complete' : 'Grief Check-In'}
      description={showResults ? 'Thank you for sharing your experience' : 'This helps us understand your grief experience'}
      accent="violet"
      size="md"
    >
      {!showResults ? (
        <div className="space-y-6">

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-700">
                    Question {currentQuestion + 1} of {pg13Questions.length}
                  </p>
                  <p className="text-sm text-slate-600">
                    {Math.round(progressPercent)}% complete
                  </p>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                  />
                </div>
              </div>

              {/* Question */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="mb-8"
                >
                  <div className="mb-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                    <p className="text-xs font-bold text-purple-700 uppercase mb-2">
                      {currentQ.category}
                    </p>
                    <p className="text-xl font-semibold text-slate-900 leading-relaxed">
                      {currentQ.question}
                    </p>
                  </div>

                  {/* Scale Options */}
                  <div className="space-y-3">
                    {scaleOptions.map((option) => {
                      const isSelected = responses[currentQ.id] === option.value;
                      return (
                        <motion.button
                          key={option.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleResponse(option.value)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all font-semibold ${
                            isSelected
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-500 shadow-lg'
                              : 'bg-slate-50 text-slate-700 border-slate-300 hover:border-purple-400 hover:bg-purple-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option.label}</span>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-white bg-slate-50'
                                : 'border-slate-300'
                            }`}>
                              {isSelected && (
                                <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t-2 border-slate-200">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <p className="text-sm text-slate-500">
                  Select an answer to continue
                </p>
              </div>
        </div>
      ) : (
        /* Results Screen */
        <div className="space-y-6">
          <div className="text-center mb-4">
            {results.flagged ? (
              <AlertTriangle size={64} className="text-amber-600 mx-auto mb-4" />
            ) : (
              <CheckCircle size={64} className="text-green-600 mx-auto mb-4" />
            )}
          </div>

          {/* Score Interpretation */}
          <div className={`p-6 rounded-xl border-2 ${
            results.flagged ? 'bg-amber-50 border-amber-300' : 'bg-green-50 border-green-300'
          }`}>
            <p className={`font-bold text-lg mb-3 ${results.flagged ? 'text-amber-900' : 'text-green-900'}`}>
              {results.interpretation}
            </p>
            <p className={`text-sm ${results.flagged ? 'text-amber-800' : 'text-green-800'}`}>
              {results.recommendation}
            </p>
          </div>

          {/* Professional Support Recommendation */}
          {results.flagged && (
            <div className="p-6 bg-purple-50 rounded-xl border-2 border-purple-300">
              <h3 className="font-bold text-purple-900 text-lg mb-3">Recommended Next Steps</h3>
              <ul className="space-y-2 text-purple-800 text-sm mb-4">
                {['Consider speaking with a grief counselor or therapist','Join a bereavement support group','Continue using self-care strategies','Retake this screening in 1-3 months'].map(s => (
                  <li key={s} className="flex items-start gap-2"><span>–</span><span>{s}</span></li>
                ))}
              </ul>
              <p className="text-purple-900 font-semibold text-sm">
                📞 Ghana Mental Health Authority: <span className="text-lg">0800-900-888</span> (Toll-free)
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => { onComplete(); onClose(); }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:shadow-lg transition-all">
              Continue
            </button>
            <button onClick={onClose}
              className="px-6 py-3 border-2 border-slate-300 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 transition-all">
              Close
            </button>
          </div>

          <p className="text-xs text-slate-500 text-center">
            🔒 Your responses are confidential and stored securely
          </p>
        </div>
      )}

      {/* Loading Overlay */}
      {submitScreeningMutation.isPending && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-3" />
          <p className="text-slate-700 font-semibold">Processing your responses...</p>
        </div>
      )}
    </ModalShell>
  );
}
