# 🧪 Test the New XAI Enhancements

## Quick Testing Guide

### ✅ 1. Test Complete Assessment Coverage

**Try these NEW assessment types** (they all work now!):

#### Using API Directly:

```bash
# Test ECOG (Performance Status 0-4)
curl -X POST http://localhost:8000/api/comprehensive-ai/focused-explanation \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 8,
    "focus_type": "assessment",
    "focus_data": {
      "assessment_type": "ECOG",
      "total_score": 3
    }
  }'

# Test Karnofsky (Performance Status 0-100)
curl -X POST http://localhost:8000/api/comprehensive-ai/focused-explanation \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 8,
    "focus_type": "assessment",
    "focus_data": {
      "assessment_type": "Karnofsky",
      "total_score": 40
    }
  }'

# Test Barthel (ADL Independence 0-100)
curl -X POST http://localhost:8000/api/comprehensive-ai/focused-explanation \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 8,
    "focus_type": "assessment",
    "focus_data": {
      "assessment_type": "Barthel",
      "total_score": 25
    }
  }'

# Test MMAS-8 (Medication Adherence 0-8)
curl -X POST http://localhost:8000/api/comprehensive-ai/focused-explanation \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 8,
    "focus_type": "assessment",
    "focus_data": {
      "assessment_type": "MMAS-8",
      "total_score": 4
    }
  }'

# Test CAGE (Substance Use 0-4)
curl -X POST http://localhost:8000/api/comprehensive-ai/focused-explanation \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 8,
    "focus_type": "assessment",
    "focus_data": {
      "assessment_type": "CAGE",
      "total_score": 3
    }
  }'

# Test MMSE (Cognitive Function 0-30)
curl -X POST http://localhost:8000/api/comprehensive-ai/focused-explanation \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 8,
    "focus_type": "assessment",
    "focus_data": {
      "assessment_type": "MMSE",
      "total_score": 16
    }
  }'

# Test MoCA (Cognitive Function 0-30)
curl -X POST http://localhost:8000/api/comprehensive-ai/focused-explanation \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 8,
    "focus_type": "assessment",
    "focus_data": {
      "assessment_type": "MoCA",
      "total_score": 20
    }
  }'

# Test Zarit (Caregiver Burden 0-88)
curl -X POST http://localhost:8000/api/comprehensive-ai/focused-explanation \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 8,
    "focus_type": "assessment",
    "focus_data": {
      "assessment_type": "Zarit",
      "total_score": 65
    }
  }'

# Test Individual ESAS Subscale - Pain
curl -X POST http://localhost:8000/api/comprehensive-ai/focused-explanation \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 8,
    "focus_type": "assessment",
    "focus_data": {
      "assessment_type": "ESAS_pain",
      "total_score": 8
    }
  }'

# Test Individual ESAS Subscale - Anxiety
curl -X POST http://localhost:8000/api/comprehensive-ai/focused-explanation \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 8,
    "focus_type": "assessment",
    "focus_data": {
      "assessment_type": "ESAS_anxiety",
      "total_score": 9
    }
  }'
```

#### Expected Results:
- ✅ Each assessment returns clinically accurate explanation
- ✅ Risk level (normal/warning/critical) is appropriate for score
- ✅ Recommendations are specific and actionable
- ✅ Relevant_factors includes the assessment score with SHAP-like importance

---

### ✅ 2. Test Feedback System

#### Step 1: Generate an XAI Explanation (through Frontend)
1. Go to http://localhost:5173
2. Navigate to any patient (e.g., Patient #8)
3. Click on **Vitals** tab
4. Click the 🧠 brain icon next to Blood Pressure
5. XAI explanation modal opens

#### Step 2: Submit Feedback
6. Scroll to bottom of modal
7. See "💭 Was this explanation helpful?"
8. Click one of the 3 buttons:
   - **👍 Helpful** (green)
   - **😐 Partially** (yellow)
   - **👎 Not Helpful** (red)
9. (Optional) Add text feedback: "Explanation was clear but recommendations too generic"
10. Click **"Submit Feedback"**
11. ✅ Success message appears: "Thank you for your feedback!"

#### Step 3: View Feedback Stats
```bash
# View overall feedback stats
curl http://localhost:8000/api/comprehensive-ai/focused-explanation-feedback/stats

# View feedback for vitals only
curl http://localhost:8000/api/comprehensive-ai/focused-explanation-feedback/stats?focus_type=vital

# View feedback for assessments only
curl http://localhost:8000/api/comprehensive-ai/focused-explanation-feedback/stats?focus_type=assessment
```

Expected Response:
```json
{
  "overall": {
    "total": 5,
    "helpful": 3,
    "partially_helpful": 1,
    "not_helpful": 1,
    "helpfulness_percentage": 60.0
  },
  "by_identifier": {
    "blood_pressure": {
      "total": 2,
      "helpful": 1,
      "partially_helpful": 1,
      "not_helpful": 0,
      "helpfulness_score": 75.0
    },
    "PHQ-9": {
      "total": 1,
      "helpful": 1,
      "partially_helpful": 0,
      "not_helpful": 0,
      "helpfulness_score": 100.0
    }
  },
  "focus_type": "all"
}
```

---

### ✅ 3. Test Feedback from All XAI Locations

**Feedback works everywhere XAI is shown**:

#### 3a. Vitals XAI Feedback:
1. Go to **VitalsDetail** page
2. Click 🧠 on any vital (BP, HR, O2, Temp)
3. Review explanation
4. Submit feedback

#### 3b. Medications XAI Feedback:
1. Go to **MedicationsDetail** page
2. Click **"XAI"** button on any medication
3. Review drug interaction explanation
4. Submit feedback

#### 3c. Symptoms XAI Feedback:
1. Go to **SymptomsDetail** page
2. Click 🧠 on high pain (≥7)
3. Review symptom pattern explanation
4. Submit feedback

#### 3d. Alerts XAI Feedback:
1. Go to **Alerts** page
2. Click **"XAI"** button on any alert
3. Review alert explanation
4. Submit feedback

#### 3e. Assessments XAI Feedback (NEW!):
1. Go to **AssessmentsDetail** or **WellbeingDetail** page
2. Click 🧠 on any assessment score
3. Review assessment explanation (now includes ALL assessment types!)
4. Submit feedback

---

### ✅ 4. Verify Database Tables

```bash
# Check focused_explanation_feedback table exists
sqlite3 backend/aura.db "SELECT * FROM focused_explanation_feedback LIMIT 5;"

# Check explanation_overrides table exists
sqlite3 backend/aura.db "SELECT * FROM explanation_overrides LIMIT 5;"

# Count feedback submissions
sqlite3 backend/aura.db "SELECT COUNT(*) FROM focused_explanation_feedback;"

# See feedback breakdown
sqlite3 backend/aura.db "SELECT feedback_type, COUNT(*) FROM focused_explanation_feedback GROUP BY feedback_type;"
```

---

### ✅ 5. Test Assessment Type Coverage

**Verify ALL these assessment types work**:

```python
# In Python console:
assessment_types = [
    "ESAS",           # ✅ Original
    "PHQ-9",          # ✅ Original
    "GAD-7",          # ✅ Original
    "PPS",            # ✅ Original
    "ECOG",           # ✅ NEW
    "Karnofsky",      # ✅ NEW
    "Barthel",        # ✅ NEW
    "MMAS-8",         # ✅ NEW
    "CAGE",           # ✅ NEW
    "MMSE",           # ✅ NEW
    "MoCA",           # ✅ NEW
    "Zarit",          # ✅ NEW
    "ESAS_pain",      # ✅ NEW
    "ESAS_tiredness", # ✅ NEW
    "ESAS_nausea",    # ✅ NEW
    "ESAS_depression",# ✅ NEW
    "ESAS_anxiety",   # ✅ NEW
    "ESAS_drowsiness",# ✅ NEW
    "ESAS_appetite",  # ✅ NEW
    "ESAS_wellbeing", # ✅ NEW
    "ESAS_shortness_of_breath" # ✅ NEW
]

for assessment in assessment_types:
    print(f"Testing {assessment}...")
    # Make API call and verify response
```

---

### ✅ 6. Test Error Handling

**Unknown assessment type**:
```bash
curl -X POST http://localhost:8000/api/comprehensive-ai/focused-explanation \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 8,
    "focus_type": "assessment",
    "focus_data": {
      "assessment_type": "UnknownAssessment",
      "total_score": 50
    }
  }'
```

Expected Response:
```json
{
  "explanation": "Assessment type 'UnknownAssessment' not recognized in current XAI system.",
  "recommendations": [
    "Manual clinical review required",
    "Contact system administrator if this is a standard assessment"
  ]
}
```

---

### ✅ 7. Visual Verification Checklist

Open the app and verify:

**Frontend UI**:
- [ ] XAI modal opens when clicking 🧠 icon
- [ ] Feedback section appears at bottom
- [ ] 3 feedback buttons are visible and colorful
- [ ] Feedback buttons have hover effects
- [ ] Text area appears when selecting a feedback type
- [ ] Submit button works and shows loading state
- [ ] Success message appears after submission
- [ ] Success message auto-dismisses after 3 seconds

**Backend Logs**:
- [ ] No errors when XAI endpoint is called
- [ ] Feedback endpoint logs successful submissions
- [ ] Database updates are logged

**Database**:
- [ ] focused_explanation_feedback table has new rows after submission
- [ ] All fields are populated correctly
- [ ] Timestamps are accurate

---

## 🎯 Success Criteria

### For Assessment Coverage:
- ✅ All 13+ assessment types return explanations
- ✅ Risk levels are clinically appropriate
- ✅ Recommendations are specific and actionable
- ✅ No errors in backend logs

### For Feedback System:
- ✅ Feedback UI appears in all XAI modals
- ✅ All 3 feedback types (helpful/partially/not_helpful) work
- ✅ Optional text feedback is saved
- ✅ Feedback stats endpoint returns correct data
- ✅ Database records all feedback submissions

### For User Experience:
- ✅ UI is intuitive and beautiful
- ✅ Animations are smooth
- ✅ No console errors
- ✅ Feedback submission is quick (<1 second)
- ✅ Success confirmation is clear

---

## 🐛 Common Issues

### Issue: "No such table: focused_explanation_feedback"
**Solution**: Run the migration script:
```bash
cd backend
python add_xai_feedback_tables.py
```

### Issue: CORS error when submitting feedback
**Solution**: Backend is not running. Start it:
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Issue: Feedback button does nothing
**Solution**: Check browser console for errors. Ensure axios is imported in component.

### Issue: Assessment type not recognized
**Solution**: Check spelling. Assessment types are case-sensitive:
- ✅ "ECOG" (not "ecog")
- ✅ "Karnofsky" (not "karnofsky")
- ✅ "ESAS_pain" (with underscore, not hyphen)

---

## 📊 Monitoring Feedback Quality

### Track These Metrics:

1. **Helpfulness Rate**: 
   - Target: >80% helpful or partially helpful
   - Alert if <60%

2. **Feedback Volume**:
   - Track submissions per day
   - Goal: At least 10% of XAI views get feedback

3. **Low-Performing Explanations**:
   - Identify focus_identifiers with <50% helpfulness
   - Prioritize improvements for these

4. **Common Feedback Themes**:
   - Review feedback_note field weekly
   - Categorize common complaints
   - Action top 3 issues monthly

---

*Last Updated: June 7, 2026*
*Backend Running: Terminal 12*
*Frontend Running: Terminal 3*
