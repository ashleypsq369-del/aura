# Frontend Integration Examples

Complete code examples for integrating the Comprehensive AI System

---

## 1. RiskExplanationPanel Component

Create: `frontend/src/components/RiskExplanationPanel.jsx`

```jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import apiClient from '../api/client';

export default function RiskExplanationPanel({ data, patientId, onClose, onFeedbackSubmitted }) {
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
      onClose();
    } catch (error) {
      console.error('Feedback error:', error);
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
                <h2 className="text-2xl font-bold">AI Risk Explanation</h2>
                <p className="text-sm text-blue-100">Understanding the prediction</p>
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
                  <p className="text-sm opacity-80">Overall Risk Score: {(data.overall_risk_score * 100).toFixed(0)}%</p>
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
              <h4 className="font-bold text-lg mb-3">Risk Component Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Vital Signs', value: data.vital_signs_risk },
                  { label: 'Symptom Burden', value: data.symptom_burden_risk },
                  { label: 'Medication Safety', value: data.medication_risk },
                  { label: 'Psychosocial', value: data.psychosocial_risk },
                  { label: 'Functional Status', value: data.functional_status_risk }
                ].map((component, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-lg border-2 border-slate-200">
                    <p className="text-xs font-semibold text-slate-600">{component.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{(component.value * 100).toFixed(0)}%</p>
                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${component.value > 0.7 ? 'bg-red-500' : component.value > 0.4 ? 'bg-orange-500' : 'bg-green-500'}`}
                        style={{ width: `${component.value * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SHAP Explanations */}
            <div className="mb-6">
              <h4 className="font-bold text-lg mb-3">🔍 What's Contributing to This Risk?</h4>
              <p className="text-sm text-slate-600 mb-4">
                These are the top factors influencing the AI's prediction, ranked by importance:
              </p>
              
              <div className="space-y-3">
                {data.shap_explanations.slice(0, 10).map((exp, idx) => (
                  <div key={idx} className="bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-blue-300 transition">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {exp.impact === 'increases_risk' ? (
                            <TrendingUp className="text-red-500" size={16} />
                          ) : exp.impact === 'decreases_risk' ? (
                            <TrendingDown className="text-green-500" size={16} />
                          ) : (
                            <div className="w-4 h-4" />
                          )}
                          <span className="font-bold text-slate-900">#{exp.importance_rank}. {exp.feature_name}</span>
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
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-orange-600 font-bold">•</span>
                      <span>{concern}</span>
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
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="font-bold text-blue-600">{idx + 1}.</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Clinician Feedback */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <h4 className="font-bold text-lg mb-3">💭 Do you agree with this assessment?</h4>
              <p className="text-sm text-slate-600 mb-4">
                Your feedback helps improve the AI model for future predictions
              </p>
              
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setFeedbackType('agree')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                    feedbackType === 'agree'
                      ? 'bg-green-600 text-white'
                      : 'bg-white border-2 border-green-300 text-green-700 hover:bg-green-50'
                  }`}
                >
                  <ThumbsUp className="inline mr-2" size={18} />
                  Agree
                </button>
                
                <button
                  onClick={() => setFeedbackType('partially_agree')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                    feedbackType === 'partially_agree'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-white border-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                  }`}
                >
                  Partially
                </button>
                
                <button
                  onClick={() => setFeedbackType('disagree')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                    feedbackType === 'disagree'
                      ? 'bg-red-600 text-white'
                      : 'bg-white border-2 border-red-300 text-red-700 hover:bg-red-50'
                  }`}
                >
                  <ThumbsDown className="inline mr-2" size={18} />
                  Disagree
                </button>
              </div>

              {feedbackType && (
                <div>
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
                    className="mt-3 w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## 2. Integration in PatientMonitor.jsx

Add this to your existing PatientMonitor component:

```jsx
import { useState } from 'react';
import RiskExplanationPanel from '../components/RiskExplanationPanel';
import apiClient from '../api/client';

export default function PatientMonitor() {
  const [showRiskExplanation, setShowRiskExplanation] = useState(false);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(false);

  const explainRisk = async (patientId) => {
    setLoading(true);
    try {
      const response = await apiClient.post(
        `/api/comprehensive-ai/comprehensive-risk/${patientId}`
      );
      setRiskData(response.data);
      setShowRiskExplanation(true);
    } catch (error) {
      console.error('Risk assessment error:', error);
      alert('Failed to generate risk assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Your existing patient monitor content */}
      
      {/* Add "Explain Risk" button */}
      <button
        onClick={() => explainRisk(currentPatient.id)}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
      >
        🔍 {loading ? 'Analyzing...' : 'Explain AI Risk Prediction'}
      </button>

      {/* Risk Explanation Modal */}
      {showRiskExplanation && riskData && (
        <RiskExplanationPanel
          data={riskData}
          patientId={currentPatient.id}
          onClose={() => setShowRiskExplanation(false)}
          onFeedbackSubmitted={() => {
            console.log('Feedback submitted successfully');
          }}
        />
      )}
    </div>
  );
}
```

---

## 3. Quick Risk Badge Component

Create: `frontend/src/components/QuickRiskBadge.jsx`

```jsx
import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import apiClient from '../api/client';

export default function QuickRiskBadge({ patientId, onExplainClick }) {
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRisk();
  }, [patientId]);

  const fetchRisk = async () => {
    try {
      const response = await apiClient.post(
        `/api/comprehensive-ai/comprehensive-risk/${patientId}`
      );
      setRisk(response.data);
    } catch (error) {
      console.error('Risk fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-xs text-slate-500">Calculating...</div>;
  if (!risk) return null;

  const getRiskStyle = () => {
    switch(risk.risk_level) {
      case 'Critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Moderate': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  return (
    <div 
      onClick={onExplainClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 ${getRiskStyle()} cursor-pointer hover:shadow-md transition`}
    >
      <AlertTriangle size={14} />
      <div>
        <span className="font-bold text-sm">{risk.risk_level}</span>
        <span className="text-xs ml-1">({(risk.overall_risk_score * 100).toFixed(0)}%)</span>
      </div>
    </div>
  );
}
```

---

## 4. Use in Patient List

In `Patients.jsx`:

```jsx
import QuickRiskBadge from '../components/QuickRiskBadge';
import RiskExplanationPanel from '../components/RiskExplanationPanel';

export default function Patients() {
  const [selectedPatientForRisk, setSelectedPatientForRisk] = useState(null);
  
  return (
    <div>
      {/* In your patient list/table */}
      {patients.map(patient => (
        <div key={patient.id} className="patient-card">
          <h3>{patient.full_name}</h3>
          
          {/* Add risk badge */}
          <QuickRiskBadge 
            patientId={patient.id}
            onExplainClick={() => setSelectedPatientForRisk(patient)}
          />
        </div>
      ))}

      {/* Risk explanation modal */}
      {selectedPatientForRisk && (
        <RiskExplanationPanel
          patientId={selectedPatientForRisk.id}
          onClose={() => setSelectedPatientForRisk(null)}
        />
      )}
    </div>
  );
}
```

---

## 5. Alert Explanation Button

In your Alerts component:

```jsx
const explainAlert = async (alertId) => {
  try {
    const response = await apiClient.get(
      `/api/comprehensive-ai/alert-explanation/${alertId}`
    );
    
    // Show modal with explanation
    setAlertExplanation(response.data);
    setShowAlertModal(true);
  } catch (error) {
    console.error('Alert explanation error:', error);
  }
};

// In your alert card:
<button 
  onClick={() => explainAlert(alert.id)}
  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
>
  ❓ Why was this triggered?
</button>
```

---

## Summary

All examples above are **ready to use**! Just:

1. Copy the components
2. Add to your pages
3. Import `apiClient`
4. Restart frontend if needed

The backend is already complete and ready to handle all these requests! 🚀

