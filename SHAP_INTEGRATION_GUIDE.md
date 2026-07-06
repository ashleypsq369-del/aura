# 🎓 SHAP Integration Guide - How to Use

## Quick Start

This guide shows you how to integrate the new SHAP explainability components into your pages.

---

## 📦 Components Available

### 1. **ExplainabilityPanel** (For Clinicians)
Full-featured XAI interface with 3 tabs:
- Plain English explanation
- SHAP bar chart
- SHAP waterfall chart
- Clinician feedback system

### 2. **PatientRiskSummary** (For Patients)
Simplified, patient-friendly version:
- No technical jargon
- Plain language only
- Emoji indicators
- Action advice

### 3. **SHAPBarChart** (Standalone)
Just the feature importance bar chart

### 4. **SHAPWaterfallChart** (Standalone)
Just the waterfall contribution flow

---

## 🔧 Integration Examples

### Example 1: Add to AI Insights Page

**File**: `frontend/src/pages/AIInsights.jsx`

```jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import ExplainabilityPanel from '../components/ExplainabilityPanel';
import apiClient from '../api/client';

export default function AIInsights() {
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  // Fetch prediction for selected patient
  const { data: prediction, refetch } = useQuery({
    queryKey: ['prediction', selectedPatientId],
    queryFn: async () => {
      const response = await apiClient.post('/api/ai/predict', {
        patient_id: selectedPatientId
      });
      return response.data;
    },
    enabled: !!selectedPatientId
  });

  // Generate new prediction
  const generatePrediction = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/api/ai/predict', {
        patient_id: selectedPatientId
      });
      return response.data;
    },
    onSuccess: () => refetch()
  });

  return (
    <div>
      {/* Your existing AI Insights content */}
      
      {/* Add Explainability Panel */}
      {selectedPatientId && (
        <ExplainabilityPanel
          patientId={selectedPatientId}
          prediction={prediction}
          onRequestNewPrediction={generatePrediction.mutate}
        />
      )}
    </div>
  );
}
```

---

### Example 2: Add to Patient Detail Page

**File**: `frontend/src/pages/PatientDetail.jsx`

Add this section after the summary cards:

```jsx
import { useQuery, useMutation } from '@tanstack/react-query';
import ExplainabilityPanel from '../components/ExplainabilityPanel';
import apiClient from '../api/client';

export default function PatientDetail() {
  const { patientId } = useParams();

  // Fetch latest prediction
  const { data: prediction } = useQuery({
    queryKey: ['prediction', patientId],
    queryFn: async () => {
      const response = await apiClient.post('/api/ai/predict', {
        patient_id: parseInt(patientId)
      });
      return response.data;
    }
  });

  // Generate new prediction
  const generatePrediction = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/api/ai/predict', {
        patient_id: parseInt(patientId)
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['prediction', patientId], data);
    }
  });

  return (
    <PageTransition>
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Existing patient header and cards */}
        
        {/* Add AI Risk Assessment Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">
            AI Risk Assessment
          </h2>
          <ExplainabilityPanel
            patientId={parseInt(patientId)}
            prediction={prediction}
            onRequestNewPrediction={generatePrediction.mutate}
          />
        </motion.div>
      </div>
    </PageTransition>
  );
}
```

---

### Example 3: Patient Portal (Simplified View)

**File**: `frontend/src/pages/PatientPortalDashboard.jsx` (future)

```jsx
import { useQuery } from '@tanstack/react-query';
import PatientRiskSummary from '../components/PatientRiskSummary';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function PatientPortalDashboard() {
  const { user } = useAuth();
  
  // Get patient's own prediction
  const { data: prediction } = useQuery({
    queryKey: ['my-risk'],
    queryFn: async () => {
      const response = await apiClient.post('/api/ai/predict', {
        patient_id: user.patient_id
      });
      return response.data;
    }
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-serif font-bold text-gray-900 mb-6">
        My Health Dashboard
      </h1>
      
      {/* Patient-friendly risk summary */}
      <PatientRiskSummary prediction={prediction} />
      
      {/* Other patient portal content */}
    </div>
  );
}
```

---

### Example 4: Standalone SHAP Charts

If you want just the charts without the full panel:

```jsx
import SHAPBarChart from '../components/SHAPBarChart';
import SHAPWaterfallChart from '../components/SHAPWaterfallChart';

function PatientMonitorCard({ prediction }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-bold mb-4">Risk Factors</h3>
      
      {/* Just the bar chart */}
      <SHAPBarChart
        shapFeatures={prediction.shap_features}
        title="Top Risk Contributors"
      />
    </div>
  );
}
```

---

## 🔄 Fetching Prediction History

Show audit trail of past predictions:

```jsx
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

function PredictionHistory({ patientId }) {
  const { data: history } = useQuery({
    queryKey: ['prediction-history', patientId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/api/ai/predictions/${patientId}/history?limit=30`
      );
      return response.data;
    }
  });

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Prediction History</h3>
      {history?.predictions.map(pred => (
        <div key={pred.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">
                Risk: {(pred.risk_score * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-gray-600">
                {new Date(pred.predicted_at).toLocaleString()}
              </p>
            </div>
            {pred.clinician_feedback && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                ✓ {pred.clinician_feedback.type}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎨 Styling Notes

All components use:
- **Framer Motion** for animations
- **Lucide React** for icons
- **Tailwind CSS** for styling
- Color schemes:
  - Red: High risk
  - Amber: Moderate risk
  - Green: Low risk
  - Purple: AI/ML branding

---

## 🧪 Testing Checklist

Before deploying:

- [ ] Generate a prediction for a test patient
- [ ] Verify all 3 tabs render in ExplainabilityPanel
- [ ] Check SHAP bar chart shows correct colors (red/green)
- [ ] Verify waterfall chart flows correctly
- [ ] Submit clinician feedback (agree/disagree)
- [ ] Check database for prediction_feedback record
- [ ] View prediction history endpoint
- [ ] Test PatientRiskSummary with different risk levels

---

## 🐛 Troubleshooting

### "SHAP values not available"
- Check backend SHAP library is installed: `pip install shap`
- Verify `/api/ai/predict` returns `shap_features` in response
- Check network tab for API errors

### "Prediction undefined"
- Ensure prediction query is enabled: `enabled: !!patientId`
- Check patient has vitals/symptoms data
- Verify ML models are loaded in backend

### Charts not rendering
- Check browser console for errors
- Verify Framer Motion is installed: `npm install framer-motion`
- Ensure prediction.shap_features is an array

### Feedback not submitting
- Check user role (must be clinician/admin)
- Verify `prediction_id` is included in response
- Check API endpoint: `/api/ai/predictions/{id}/clinician-feedback`

---

## 📚 Additional Resources

- **Full Implementation Doc**: `SHAP_INTEGRATION_COMPLETE.md`
- **Gap Analysis Plan**: `GAP_ANALYSIS_IMPLEMENTATION_PLAN.md`
- **SHAP Library Docs**: https://shap.readthedocs.io/
- **XGBoost Docs**: https://xgboost.readthedocs.io/

---

## 🎯 Next Steps

1. ✅ Priority 1 (SHAP) - **COMPLETE**
2. ⏳ Priority 2 (HIPAA Compliance) - Up next
3. ⏳ Priority 3 (HCI & ChatBot Safety)
4. ⏳ Priority 4 (Biomedical Ethics)
5. ⏳ Priority 5 (Bereavement Support)

---

**Questions?** Check `SHAP_INTEGRATION_COMPLETE.md` for detailed implementation notes.
