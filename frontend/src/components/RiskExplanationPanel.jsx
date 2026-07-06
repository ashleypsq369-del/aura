import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ThumbsUp, ThumbsDown, Brain, Activity, Shield, Pill, Heart, User } from 'lucide-react';
import apiClient from '../api/client';

export default function RiskExplanationPanel({ data, onClose, onFeedbackSubmitted }) {
  const [feedbackType, setFeedbackType] = useState(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getRiskColor = (level) => {
    switch(level) {
      case 'Critical': return 'text-red-600 bg-red-50 border-red-300';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-300';
      case 'Moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-300';
      default: return 'text-green-600 bg-green-50 border-green-300';
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackType) return;
    
    setSubmitting(true);
    try {
      await apiClient.post('/api/comprehensive-ai/clinician-feedback', {
        prediction_id: data.prediction_id,
        feedback_type: feedbackType,
        note: feedbackNote
      });
      
      if (onFeedbackSubmitted) onFeedbackSubmitted();
      
      // Show success message
      alert('... Thank you! Your feedback helps improve the AI model.');
      onClose();
    } catch (error) {
      console.error('Feedback error:', error);
      alert(' Failed to submit feedback. Please try again.');
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
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Brain size={28} />
                  AI Risk Explanation
                </h2>
                <p className="text-sm text-blue-100">Understanding the comprehensive risk assessment</p>
              </div>
              <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition">
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Overall Risk */}
            <div className={`p-6 rounded-xl border-3 ${getRiskColor(data.risk_level)} mb-6`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-2xl font-bold">{data.risk_level} Risk</h3>
                  <p className="text-sm opacity-80">
                    Overall Risk Score: {(data.overall_risk_score * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">Confidence</p>
                  <p className="text-2xl font-bold">{(data.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
              <p className="text-sm">{data.summary}</p>
            </div>

            {/* Component Risks */}
            <div className="mb-6">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2"><Shield size={16} /> Risk Component Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Vital Signs',       value: data.vital_signs_risk,     Icon: Activity },
                  { label: 'Symptom Burden',    value: data.symptom_burden_risk,  Icon: AlertTriangle },
                  { label: 'Medication Safety', value: data.medication_risk,      Icon: Pill },
                  { label: 'Psychosocial',      value: data.psychosocial_risk,    Icon: Heart },
                  { label: 'Functional Status', value: data.functional_status_risk, Icon: User },
                ].map((component, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-lg border-2 border-slate-200">
                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <component.Icon size={12} className="flex-shrink-0" /> {component.label}
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {(component.value * 100).toFixed(0)}%
                    </p>
                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          component.value > 0.7 ? 'bg-red-500' : 
                          component.value > 0.4 ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${component.value * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SHAP Explanations */}
            <div className="mb-6">
              <h4 className="font-bold text-lg mb-3"> What's Contributing to This Risk?</h4>
              <p className="text-sm text-slate-600 mb-4">
                These are the top factors influencing the AI's prediction, ranked by importance:
              </p>
              
              <div className="space-y-3">
                {data.shap_explanations.slice(0, 10).map((exp, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {exp.impact === 'increases_risk' ? (
                            <TrendingUp className="text-red-500" size={16} />
                          ) : exp.impact === 'decreases_risk' ? (
                            <TrendingDown className="text-green-500" size={16} />
                          ) : (
                            <div className="w-4 h-4" />
                          )}
                          <span className="font-bold text-slate-900">
                            #{exp.importance_rank}. {exp.feature_name}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">{exp.explanation}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-lg font-bold text-slate-700">{exp.display_value}</p>
                        <p className={`text-xs font-semibold ${
                          exp.impact === 'increases_risk' ? 'text-red-600' : 
                          exp.impact === 'decreases_risk' ? 'text-green-600' : 'text-slate-500'
                        }`}>
                          {exp.shap_value > 0 ? '+' : ''}{(exp.shap_value * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Concerns */}
            {data.key_concerns.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <AlertTriangle className="text-orange-600" size={20} />
                  Key Concerns
                </h4>
                <ul className="space-y-2">
                  {data.key_concerns.map((concern, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <span className="text-orange-600 font-bold">-</span>
                      <span className="text-orange-900">{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            <div className="mb-6">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <CheckCircle className="text-blue-600" size={20} />
                Recommended Actions
              </h4>
              <ol className="space-y-2">
                {data.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <span className="font-bold text-blue-600">{idx + 1}.</span>
                    <span className="text-blue-900">{rec}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Clinician Feedback */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
              <h4 className="font-bold text-lg mb-3">­ Do you agree with this assessment?</h4>
              <p className="text-sm text-slate-600 mb-4">
                Your feedback helps improve the AI model for future predictions
              </p>
              
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setFeedbackType('agree')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    feedbackType === 'agree'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-white border-2 border-green-300 text-green-700 hover:bg-green-50'
                  }`}
                >
                  <ThumbsUp size={18} />
                  Agree
                </button>
                
                <button
                  onClick={() => setFeedbackType('partially_agree')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                    feedbackType === 'partially_agree'
                      ? 'bg-yellow-600 text-white shadow-lg'
                      : 'bg-white border-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                  }`}
                >
                  Partially
                </button>
                
                <button
                  onClick={() => setFeedbackType('disagree')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    feedbackType === 'disagree'
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'bg-white border-2 border-red-300 text-red-700 hover:bg-red-50'
                  }`}
                >
                  <ThumbsDown size={18} />
                  Disagree
                </button>
              </div>

              {feedbackType && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  <textarea
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    placeholder="Add a note (optional) to help us understand your assessment..."
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

