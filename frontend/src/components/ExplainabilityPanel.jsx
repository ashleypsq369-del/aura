import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, BarChart3, Activity, ThumbsUp, ThumbsDown, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from '../utils/toast';
import apiClient from '../api/client';
import SHAPBarChart from './SHAPBarChart';
import SHAPWaterfallChart from './SHAPWaterfallChart';

/**
 * Explainability Panel Component
 * Comprehensive AI Explain interface combining risk gauge, SHAP visualization, and clinician feedback
 * Gap Analysis Priority 1: AI Explain/SHAP Integration
 */
export default function ExplainabilityPanel({ 
  patientId,
  prediction,
  onRequestNewPrediction 
}) {
  const [activeTab, setActiveTab] = useState('explanation');
  const [feedbackExpanded, setFeedbackExpanded] = useState(false);
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackNote, setFeedbackNote] = useState('');
  const queryClient = useQueryClient();

  // Mutation for clinician feedback
  const feedbackMutation = useMutation({
    mutationFn: async ({ predictionId, feedbackType, note }) => {
      const response = await apiClient.post(
        `/api/ai/predictions/${predictionId}/clinician-feedback`,
        { feedback_type: feedbackType, note }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Feedback submitted successfully');
      setFeedbackExpanded(false);
      setFeedbackType('');
      setFeedbackNote('');
      queryClient.invalidateQueries(['prediction-history', patientId]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to submit feedback');
    }
  });

  const handleSubmitFeedback = () => {
    if (!feedbackType) {
      toast.error('Please select a feedback type');
      return;
    }
    feedbackMutation.mutate({
      predictionId: prediction.prediction_id,
      feedbackType,
      note: feedbackNote
    });
  };

  if (!prediction) {
    return (
      <div className="bg-[var(--card-bg)] rounded-lg p-8 shadow-md border-2 border-gray-200 text-center">
        <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">No AI prediction available</p>
        {onRequestNewPrediction && (
          <button
            onClick={onRequestNewPrediction}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Generate Prediction
          </button>
        )}
      </div>
    );
  }

  const riskColor = 
    prediction.risk_level === 'High' ? 'red' :
    prediction.risk_level === 'Moderate' ? 'amber' :
    'green';

  return (
    <div className="space-y-4">
      {/* Header with Risk Gauge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br from-${riskColor}-50 to-white rounded-lg p-6 shadow-lg border-3 border-${riskColor}-300`}
      >
        <div className="flex items-start justify-between">
          {/* Risk Score */}
          <div className="flex items-center space-x-4">
            <div className={`w-24 h-24 rounded-full bg-${riskColor}-100 border-4 border-${riskColor}-400 flex items-center justify-center`}>
              <div className="text-center">
                <p className={`text-3xl font-bold text-${riskColor}-700`}>
                  {(prediction.risk_score * 100).toFixed(0)}
                </p>
                <p className={`text-xs text-${riskColor}-600 font-semibold`}>RISK</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {prediction.risk_level} Risk Patient
              </h2>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Pathway:</span> {prediction.predicted_pathway}
              </p>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${riskColor}-100 text-${riskColor}-700 border-2 border-${riskColor}-300`}>
                  {(prediction.confidence * 100).toFixed(0)}% Confidence
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border-2 border-purple-300">
                  §  XGBoost + SHAP
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col space-y-2">
            {onRequestNewPrediction && (
              <button
                onClick={onRequestNewPrediction}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition"
              >
                Refresh Prediction
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="bg-[var(--card-bg)] rounded-lg shadow-md border-2 border-gray-200 overflow-hidden">
        <div className="flex border-b-2 border-gray-200">
          {[
            { id: 'explanation', label: 'Plain English', icon: MessageSquare },
            { id: 'bar-chart', label: 'Feature Importance', icon: BarChart3 },
            { id: 'waterfall', label: 'Contribution Flow', icon: Activity }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-[var(--card-bg)] text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'explanation' && (
              <motion.div
                key="explanation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-3">Clinical Explanation</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {prediction.plain_english_explanation}
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'bar-chart' && (
              <motion.div
                key="bar-chart"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <SHAPBarChart 
                  shapFeatures={prediction.shap_features}
                  title="SHAP Feature Importance"
                />
              </motion.div>
            )}

            {activeTab === 'waterfall' && (
              <motion.div
                key="waterfall"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <SHAPWaterfallChart
                  shapFeatures={prediction.shap_features}
                  baseValue={prediction.shap_base_value || 0.5}
                  finalPrediction={prediction.risk_score}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Clinician Feedback Section */}
      <div className="bg-[var(--card-bg)] rounded-lg shadow-md border-2 border-gray-200 overflow-hidden">
        <button
          onClick={() => setFeedbackExpanded(!feedbackExpanded)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--card-bg)] transition"
        >
          <div className="flex items-center space-x-3">
            <TrendingUp className="text-purple-600" size={20} />
            <span className="font-semibold text-gray-900">Clinician Feedback</span>
            <span className="text-sm text-gray-500">(Help improve AI accuracy)</span>
          </div>
          {feedbackExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        <AnimatePresence>
          {feedbackExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t-2 border-gray-200 p-6 space-y-4"
            >
              <p className="text-sm text-gray-600 mb-4">
                Do you agree with this AI prediction? Your feedback helps improve model accuracy.
              </p>

              {/* Feedback Options */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setFeedbackType('agree')}
                  className={`p-4 rounded-lg border-2 transition ${
                    feedbackType === 'agree'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <ThumbsUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-semibold">Agree</p>
                </button>

                <button
                  onClick={() => setFeedbackType('partial')}
                  className={`p-4 rounded-lg border-2 transition ${
                    feedbackType === 'partial'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Activity className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                  <p className="text-sm font-semibold">Partially</p>
                </button>

                <button
                  onClick={() => setFeedbackType('disagree')}
                  className={`p-4 rounded-lg border-2 transition ${
                    feedbackType === 'disagree'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <ThumbsDown className="w-8 h-8 mx-auto mb-2 text-red-600" />
                  <p className="text-sm font-semibold">Disagree</p>
                </button>
              </div>

              {/* Optional Note */}
              {feedbackType && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    placeholder="Explain your reasoning..."
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                    rows={3}
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmitFeedback}
                disabled={!feedbackType || feedbackMutation.isPending}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {feedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

