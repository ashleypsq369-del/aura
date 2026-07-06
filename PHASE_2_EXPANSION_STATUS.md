# 🚀 Phase 2: Focused AI Expansion - IN PROGRESS

## ✅ Phase 1 Complete
- VitalsDetail page with Brain icons on warning vitals ✅
- Backend focused-explanation endpoint working ✅
- All 4 vital types supported ✅

## 🎯 Phase 2: Expand to Other Pages

### 1. Alerts Page - READY TO IMPLEMENT
**File**: `frontend/src/pages/Alerts.jsx`
**Goal**: Add Brain icon to each alert card
**Focus Type**: `alert`
**Focus Data**: 
```js
{
  alert_id: alert.id
}
```

**When to Show**: On all alerts
**What it Explains**:
- Why this alert was triggered
- Patient context at time of alert
- Severity justification
- Recommended actions

---

### 2. SymptomsDetail Page - READY TO IMPLEMENT
**File**: `frontend/src/pages/SymptomsDetail.jsx`
**Goal**: Add Brain icon to symptom cards with high severity
**Focus Type**: `symptom`
**Focus Data**:
```js
{
  symptom_type: 'pain',
  severity: symptom.pain_level
}
```

**When to Show**: When pain_level >= 7 or any symptom level >= 7
**What it Explains**:
- Symptom trend (worsening/improving/stable)
- Correlation with other symptoms
- Treatment effectiveness
- When to escalate

---

### 3. MedicationsDetail Page - READY TO IMPLEMENT
**File**: `frontend/src/pages/MedicationsDetail.jsx`
**Goal**: Add Brain icon to medication cards (especially multiple active meds)
**Focus Type**: `medication`
**Focus Data**:
```js
{
  medication_name: medication.medication_name
}
```

**When to Show**: Always available on active medications
**What it Explains**:
- Drug interactions with other meds
- Allergy warnings (CRITICAL)
- Side effects relevant to symptoms
- Timing recommendations

---

### 4. WellbeingDetail Page - READY TO IMPLEMENT
**File**: `frontend/src/pages/WellbeingDetail.jsx`
**Goal**: Add Brain icon to ESAS/PHQ-9/GAD-7 assessment scores
**Focus Type**: `assessment`  (NEW - needs backend implementation)
**Focus Data**:
```js
{
  assessment_type: 'ESAS' | 'PHQ-9' | 'GAD-7',
  total_score: 45,
  subscores: {...}
}
```

**When to Show**: When total score indicates concern:
- ESAS: > 40
- PHQ-9: > 10
- GAD-7: > 10

**What it Explains**:
- What the score means for THIS patient
- Trend over time
- Which domains are most concerning
- Recommended psychological support

---

## 📋 Implementation Checklist

### Backend Updates Needed
- [ ] Add `assessment` focus type handler in `explain_*_focus()` functions
- [ ] Fix any remaining field name mismatches (blood_pressure_sys vs systolic)

### Frontend Updates Needed
- [x] VitalsDetail.jsx ✅
- [ ] Alerts.jsx
- [ ] SymptomsDetail.jsx  
- [ ] MedicationsDetail.jsx
- [ ] WellbeingDetail.jsx

### Pattern to Follow (Copy from VitalsDetail)
```jsx
// 1. Imports
import { Brain } from 'lucide-react';
import FocusedAIExplanation from '../components/FocusedAIExplanation';
import apiClient from '../api/client';
import { useState } from 'react';

// 2. State
const [showFocusedExplanation, setShowFocusedExplanation] = useState(false);
const [focusedData, setFocusedData] = useState(null);
const [loadingExplanation, setLoadingExplanation] = useState(false);

// 3. Function
const explainData = async (focusType, focusDataObj) => {
  setLoadingExplanation(true);
  try {
    const response = await apiClient.post('/api/comprehensive-ai/focused-explanation', {
      patient_id: parseInt(patientId),
      focus_type: focusType,
      focus_data: focusDataObj
    });
    setFocusedData(response.data);
    setShowFocusedExplanation(true);
  } catch (error) {
    console.error('Failed to get AI explanation:', error);
    alert('❌ Failed to get AI explanation.');
  } finally {
    setLoadingExplanation(false);
  }
};

// 4. Button
<button
  onClick={() => explainData('alert', { alert_id: alert.id })}
  disabled={loadingExplanation}
  className="p-1 rounded-lg bg-purple-100 hover:bg-purple-200 transition disabled:opacity-50"
  title="AI Explain"
>
  <Brain className="w-3 h-3 text-purple-600" />
</button>

// 5. Modal
{showFocusedExplanation && focusedData && (
  <FocusedAIExplanation
    data={focusedData}
    onClose={() => setShowFocusedExplanation(false)}
  />
)}
```

---

## 🎨 Visual Consistency

All pages should follow the same pattern:
- Purple Brain icon (small, top-right of card)
- Only shows when relevant (warning/concern detected)
- Same modal styling (FocusedAIExplanation component)
- Same loading states
- Same error handling

---

## ⏱️ Estimated Time

- Alerts Page: 15 mins
- SymptomsDetail: 20 mins
- MedicationsDetail: 20 mins
- WellbeingDetail: 25 mins (needs backend assessment handler)
- Testing: 20 mins

**Total**: ~2 hours

---

## 🧪 Testing Strategy

For each page:
1. Navigate to page
2. Verify Brain icons appear appropriately
3. Click Brain icon
4. Verify modal opens with correct data
5. Verify explanations are contextual
6. Verify recommendations are specific

---

*Status: Phase 2 implementation starting...*
