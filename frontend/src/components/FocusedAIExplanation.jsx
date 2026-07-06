import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Brain, Minus, ThumbsUp, ThumbsDown } from 'lucide-react';
import axios from 'axios';

export default function FocusedAIExplanation({ data, onClose }) {
  const [feedbackType, setFeedbackType] = useState(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const getRiskColor = (level) => {
    switch(level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-300';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-300';
      default: return 'text-green-600 bg-green-50 border-green-300';
    }
  };

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'increasing':
      case 'worsening':
        return <TrendingUp className="text-red-500" size={20} />;
      case 'decreasing':
      case 'improving':
        return <TrendingDown className="text-green-500" size={20} />;
      default:
        return <Minus className="text-slate-400" size={20} />;
    }
  };

  const formatValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      if (value.systolic && value.diastolic) {
        return `${value.systolic}/${value.diastolic} mmHg`;
      }
      return JSON.stringify(value);
    }
    return value;
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackType) return;

    setSubmitting(true);
    try {
      await axios.post('http://localhost:8000/api/comprehensive-ai/focused-explanation-feedback', {
        patient_id: data.patient_id,
        focus_type: data.focus_type,
        focus_identifier: data.vital_type || data.symptom_type || data.medication_name || data.alert_type || data.assessment_type || 'unknown',
        focus_value: formatValue(data.current_value || data.current_severity || data.triggered_value || data.total_score),
        feedback_type: feedbackType,
        feedback_note: feedbackNote,
        risk_level_shown: data.risk_level,
        explanation_shown: data.explanation,
        recommendations_shown: data.recommendations
      });

      setFeedbackSubmitted(true);
      setTimeout(() => {
        setFeedbackSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Brain size={24} />
                  AI Focused Explanation
                </h2>
                <p className="text-sm text-purple-100">Understanding this specific concern</p>
              </div>
              <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition">
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-150px)]">
            {/* Patient Info */}
            <div className="mb-4">
              <p className="text-sm text-slate-600">Patient: <span className="font-bold text-slate-900">{data.patient_name}</span></p>
            </div>

            {/* Current Reading with Risk Level */}
            <div className={`p-5 rounded-xl border-3 ${getRiskColor(data.risk_level)} mb-5`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-1">
                    {data.vital_type ? data.vital_type.replace('_', ' ').toUpperCase() : 
                     data.symptom_type ? data.symptom_type.replace('_', ' ').toUpperCase() :
                     data.medication_name ? data.medication_name :
                     data.alert_type ? data.alert_type.replace('_', ' ').toUpperCase() : 'Reading'}
                  </h3>
                  <p className="text-2xl font-bold mb-2">
                    {data.current_value !== undefined ? formatValue(data.current_value) :
                     data.current_severity !== undefined ? `${data.current_severity}/10` :
                     data.triggered_value || 'N/A'}
                  </p>
                  <p className="text-sm font-semibold uppercase tracking-wide">
                    {data.risk_level} Risk
                  </p>
                </div>
                
                {/* Trend & Baseline */}
                {(data.trend || data.baseline_value) && (
                  <div className="text-right">
                    {data.trend && (
                      <div className="flex items-center gap-2 mb-2 justify-end">
                        {getTrendIcon(data.trend)}
                        <span className="text-sm font-semibold capitalize">{data.trend}</span>
                      </div>
                    )}
                    {data.baseline_value && (
                      <div className="text-xs text-slate-600">
                        <p className="font-semibold">Baseline:</p>
                        <p>{formatValue(data.baseline_value)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* AI Explanation */}
            <div className="mb-5">
              <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                <Brain className="text-purple-600" size={18} />
                Why is this concerning?
              </h4>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-slate-900 leading-relaxed">{data.explanation}</p>
                {data.confidence && (
                  <p className="text-xs text-slate-600 mt-3 border-t border-slate-300 pt-2">
                    AI Confidence: <span className="font-bold">{(data.confidence * 100).toFixed(0)}%</span>
                  </p>
                )}
              </div>
            </div>

            {/* Relevant Factors (SHAP-like) */}
            {data.relevant_factors && data.relevant_factors.length > 0 && (
              <div className="mb-5">
                <h4 className="font-bold text-base mb-3"> Contributing Factors</h4>
                <div className="space-y-2">
                  {data.relevant_factors.map((factor, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-300 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {factor.impact === 'increases_risk' ? (
                              <TrendingUp className="text-red-500" size={14} />
                            ) : factor.impact === 'decreases_risk' ? (
                              <TrendingDown className="text-green-500" size={14} />
                            ) : (
                              <div className="w-3 h-3" />
                            )}
                            <span className="font-bold text-sm text-slate-900">
                              {factor.feature_name}
                            </span>
                          </div>
                          {factor.explanation && (
                            <p className="text-xs text-slate-700">{factor.explanation}</p>
                          )}
                        </div>
                        <div className="ml-3 text-right">
                          <p className="text-base font-bold text-slate-700">{factor.display_value}</p>
                          {factor.importance && (
                            <p className="text-xs text-slate-500">Rank #{factor.importance}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medication Interactions */}
            {data.interactions && data.interactions.length > 0 && (
              <div className="mb-5">
                <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                  <AlertTriangle className="text-orange-600" size={18} />
                  Drug Interactions
                </h4>
                <div className="space-y-2">
                  {data.interactions.map((interaction, idx) => (
                    <div key={idx} className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-sm text-orange-900">{interaction.medication}</p>
                          <p className="text-xs text-orange-800">{interaction.interaction}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          interaction.severity === 'high' ? 'bg-red-200 text-red-800' :
                          interaction.severity === 'moderate' ? 'bg-orange-200 text-orange-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                          {interaction.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="mb-4">
              <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                <CheckCircle className="text-blue-600" size={18} />
                Recommended Actions
              </h4>
              <ol className="space-y-2">
                {data.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <span className="font-bold text-blue-600 flex-shrink-0">{idx + 1}.</span>
                    <span className="text-blue-900">{rec}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Additional Context */}
            {data.history_count !== undefined && (
              <div className="text-xs text-slate-500 text-center mt-4 pt-4 border-t border-slate-200">
                Based on analysis of {data.history_count} historical readings
              </div>
            )}

            {/* ========== CLINICIAN FEEDBACK SECTION (NEW!) ========== */}
            {!feedbackSubmitted ? (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 mt-6">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Brain className="text-purple-600" size={20} />
                  ­ Was this explanation helpful?
                </h4>
                <p className="text-sm text-slate-600 mb-4">
                  Your feedback helps improve XAI explanations for all clinicians
                </p>
                
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => setFeedbackType('helpful')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                      feedbackType === 'helpful'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-white border-2 border-green-300 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    <ThumbsUp size={18} />
                    Helpful
                  </button>
                  
                  <button
                    onClick={() => setFeedbackType('partially_helpful')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                      feedbackType === 'partially_helpful'
                        ? 'bg-yellow-600 text-white shadow-lg'
                        : 'bg-white border-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                    }`}
                  >
                    Partially
                  </button>
                  
                  <button
                    onClick={() => setFeedbackType('not_helpful')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                      feedbackType === 'not_helpful'
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'bg-white border-2 border-red-300 text-red-700 hover:bg-red-50'
                    }`}
                  >
                    <ThumbsDown size={18} />
                    Not Helpful
                  </button>
                </div>

                {feedbackType && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4"
                  >
                    <textarea
                      value={feedbackNote}
                      onChange={(e) => setFeedbackNote(e.target.value)}
                      placeholder="What would make this explanation more useful? (optional)"
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      rows={3}
                    />
                    
                    <button
                      onClick={handleFeedbackSubmit}
                      disabled={submitting}
                      className="mt-3 w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-green-50 border-2 border-green-300 rounded-xl p-6 mt-6 text-center"
              >
                <div className="text-5xl mb-3">...</div>
                <h4 className="font-bold text-lg text-green-800 mb-2">
                  Thank you for your feedback!
                </h4>
                <p className="text-sm text-green-700">
                  Your input helps us improve XAI explanations for everyone
                </p>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-3 border-t-2 border-slate-200">
            <button
              onClick={onClose}
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:shadow-lg transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

