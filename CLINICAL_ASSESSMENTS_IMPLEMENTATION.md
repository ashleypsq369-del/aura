# 🏥 CLINICAL ASSESSMENTS SYSTEM - IMPLEMENTATION PLAN

**Status: Database ✅ Complete | Backend 🔨 In Progress | Frontend ⏳ Pending**  
**Date: June 3, 2026**

---

## ✅ COMPLETED: DATABASE SCHEMA

### Tables Created:
1. ✅ `esas_assessments` - Edmonton Symptom Assessment (9 symptoms)
2. ✅ `pps_assessments` - Palliative Performance Scale
3. ✅ `cognitive_assessments` - MMSE/MoCA memory tests
4. ✅ `phq9_assessments` - Depression screening
5. ✅ `gad7_assessments` - Anxiety screening
6. ✅ `barthel_assessments` - Activities of Daily Living
7. ✅ `pain_assessments` - Brief Pain Inventory
8. ✅ `qol_assessments` - Quality of Life (FACT-G style)
9. ✅ `caregiver_burden_assessments` - Zarit Burden Interview
10. ✅ `motor_skills_assessments` - Physical function tests

**Location:** `backend/src/db.py` (lines 393-700 approximately)  
**Script:** `backend/create_assessment_tables.py`

---

## 🔨 IN PROGRESS: BACKEND API

### Router File Started:
`backend/routers/clinical_assessments.py`

### Required Endpoints (Per Assessment Type):

#### ESAS (Symptom Assessment):
- `POST /api/assessments/esas` - Create new ESAS assessment
- `GET /api/assessments/esas/{patient_id}` - Get all ESAS for patient
- `GET /api/assessments/esas/{patient_id}/latest` - Get most recent
- `GET /api/assessments/esas/{patient_id}/trends` - Get trends over time

#### PPS (Functional Status):
- `POST /api/assessments/pps` - Create new PPS assessment
- `GET /api/assessments/pps/{patient_id}` - Get all PPS for patient
- `GET /api/assessments/pps/{patient_id}/latest` - Get most recent
- `GET /api/assessments/pps/{patient_id}/decline-rate` - Calculate decline

#### Cognitive (MMSE/MoCA):
- `POST /api/assessments/cognitive` - Create assessment
- `GET /api/assessments/cognitive/{patient_id}` - Get all
- `GET /api/assessments/cognitive/{patient_id}/latest` - Most recent
- `GET /api/assessments/cognitive/{patient_id}/comparison` - Compare scores

#### PHQ-9 (Depression):
- `POST /api/assessments/phq9` - Create assessment
- `GET /api/assessments/phq9/{patient_id}` - Get all
- `GET /api/assessments/phq9/{patient_id}/latest` - Most recent
- `GET /api/assessments/phq9/{patient_id}/screening-result` - Interpret severity

#### GAD-7 (Anxiety):
- `POST /api/assessments/gad7` - Create assessment
- `GET /api/assessments/gad7/{patient_id}` - Get all
- `GET /api/assessments/gad7/{patient_id}/latest` - Most recent

#### Barthel Index (ADL):
- `POST /api/assessments/barthel` - Create assessment
- `GET /api/assessments/barthel/{patient_id}` - Get all
- `GET /api/assessments/barthel/{patient_id}/latest` - Most recent
- `GET /api/assessments/barthel/{patient_id}/independence-trend` - Track changes

#### Pain (BPI):
- `POST /api/assessments/pain` - Create assessment
- `GET /api/assessments/pain/{patient_id}` - Get all
- `GET /api/assessments/pain/{patient_id}/latest` - Most recent
- `GET /api/assessments/pain/{patient_id}/severity-trend` - Pain over time

#### Quality of Life:
- `POST /api/assessments/qol` - Create assessment
- `GET /api/assessments/qol/{patient_id}` - Get all
- `GET /api/assessments/qol/{patient_id}/latest` - Most recent
- `GET /api/assessments/qol/{patient_id}/domain-scores` - By domain

#### Caregiver Burden:
- `POST /api/assessments/caregiver-burden` - Create assessment
- `GET /api/assessments/caregiver-burden/{caregiver_id}` - Get all for caregiver
- `GET /api/assessments/caregiver-burden/{caregiver_id}/latest` - Most recent
- `GET /api/assessments/caregiver-burden/patient/{patient_id}` - By patient

#### Motor Skills:
- `POST /api/assessments/motor-skills` - Create assessment
- `GET /api/assessments/motor-skills/{patient_id}` - Get all
- `GET /api/assessments/motor-skills/{patient_id}/latest` - Most recent
- `GET /api/assessments/motor-skills/{patient_id}/fall-risk` - Risk assessment

### Summary Endpoints:
- `GET /api/assessments/patient/{patient_id}/overview` - All assessment types summary
- `GET /api/assessments/patient/{patient_id}/dashboard` - Dashboard data
- `GET /api/assessments/due/{patient_id}` - Which assessments are due

---

## ⏳ TODO: FRONTEND COMPONENTS

### Assessment Pages Needed:

#### 1. Assessment Dashboard (`/assessments/:patientId`)
**Shows:**
- Grid of all assessment types
- Last completed date for each
- Status (due, overdue, completed)
- Quick view of latest scores
- Visual indicators (red/yellow/green)

#### 2. ESAS Form (`/assessments/:patientId/esas`)
**Interactive slider form:**
- 9 symptoms with 0-10 sliders
- Visual feedback (faces or colors)
- Optional 10th symptom
- Save and auto-calculate
- Show previous scores for comparison

#### 3. PPS Assessment (`/assessments/:patientId/pps`)
**Dropdown selections:**
- 5 domains with predefined options
- Auto-calculate PPS percentage
- Show interpretation
- Trend graph

#### 4. Cognitive Tests (`/assessments/:patientId/cognitive`)
**Two-part form:**
- Choose MMSE or MoCA
- Section-by-section scoring
- Auto-calculate totals
- Interpretation display
- Previous results comparison

#### 5. Mental Health Screening (`/assessments/:patientId/mental-health`)
**Combined PHQ-9 and GAD-7:**
- Radio button questions
- Clear instructions
- Auto-score and interpret
- Referral suggestions if severe

#### 6. ADL Assessment (`/assessments/:patientId/adl`)
**Barthel Index form:**
- 10 activities with scoring dropdowns
- Visual icons for each activity
- Auto-calculate total
- Independence level display

#### 7. Pain Assessment (`/assessments/:patientId/pain`)
**Comprehensive pain form:**
- Pain severity ratings
- Body map for location
- Pain type selectors
- Interference ratings
- Medication review

#### 8. Quality of Life (`/assessments/:patientId/qol`)
**4-domain questionnaire:**
- Physical, Social, Emotional, Functional
- 0-4 scale for each question
- Domain scores and total
- Visual representation

#### 9. Caregiver Burden (`/assessments/caregiver/:caregiverId`)
**Zarit questionnaire:**
- 12 questions, 0-4 scale
- Burden level interpretation
- Support recommendations
- Resources and referrals

#### 10. Motor Skills (`/assessments/:patientId/motor-skills`)
**Physical tests form:**
- Grip strength entry
- TUG timer integration
- Balance scores
- Fall risk calculator

### Shared Components:

#### `AssessmentCard.jsx`
Shows summary of one assessment type with:
- Icon
- Last completed date
- Latest score
- Status badge
- "Complete" or "View" button

#### `AssessmentTrend.jsx`
Line chart showing score over time:
- Multiple time ranges
- Color-coded thresholds
- Interactive tooltips

#### `AssessmentComparison.jsx`
Side-by-side comparison:
- Current vs previous
- Change indicators (↑↓)
- Percentage change

#### `ScoreInterpreter.jsx`
Displays score meaning:
- Severity level
- Color coding
- Clinical interpretation
- Recommendations

---

## 🤖 AI INTEGRATION FEATURES

### Automatic Alerts from Assessments:

#### ESAS Triggers:
```javascript
if (pain > 7) → "Severe pain - immediate intervention needed"
if (depression > 7) → "Severe depression - psychiatric referral"
if (anxiety > 7) → "Severe anxiety - support needed"
if (wellbeing < 3) → "Critical wellbeing decline"
```

#### PPS Triggers:
```javascript
if (pps_score declines by 20% in 2 weeks) → "Rapid functional decline"
if (pps_score <= 30) → "End-of-life care discussion needed"
if (pps_score <= 50 && previously > 70) → "Significant decline alert"
```

#### Cognitive Triggers:
```javascript
if (mmse_total < 18 || moca_total < 18) → "Severe cognitive impairment"
if (score declines > 3 points) → "Cognitive decline alert"
if (mmse < 24 && previously >= 24) → "New impairment detected"
```

#### PHQ-9 Triggers:
```javascript
if (total_score >= 20) → "Severe depression - urgent referral"
if (thoughts_of_harm > 0) → "CRISIS ALERT - suicide risk"
if (total_score >= 15) → "Moderately severe depression"
```

#### GAD-7 Triggers:
```javascript
if (total_score >= 15) → "Severe anxiety - referral needed"
if (total_score >= 10) → "Moderate anxiety - intervention"
```

#### Barthel Triggers:
```javascript
if (total_score < 40) → "Severe dependence - increased care"
if (score declines > 15 points) → "Functional decline alert"
if (total_score < 20) → "Total dependence - hospice consideration"
```

### AI Recommendations:

#### Based on Assessment Combinations:
```javascript
// Example 1: Pain + Depression
if (ESAS.pain > 7 && PHQ9.total >= 10) {
  recommendation: "Pain-depression cycle detected. Consider:"
  - Dual antidepressant/pain medication
  - Psychiatric consultation
  - Pain psychology referral
}

// Example 2: Cognitive + ADL decline
if (Cognitive.mmse < 20 && Barthel.total < 60) {
  recommendation: "Cognitive and functional decline. Consider:"
  - Dementia care pathway
  - Family caregiver training
  - Safety assessment
  - Respite care options
}

// Example 3: Caregiver burden + patient complexity
if (CaregiverBurden.total > 40 && PPS.score < 50) {
  recommendation: "High caregiver burden with complex patient. Consider:"
  - Respite care urgently
  - Additional home health support
  - Support group referral
  - Hospice evaluation
}
```

### Adaptive Care Plan Adjustments:

```javascript
// Auto-adjust monitoring frequency
if (PPS.score <= 50) {
  monitoring_frequency = "daily"
  assessment_schedule = {
    ESAS: "daily",
    PPS: "weekly",
    PHQ9: "weekly"
  }
}

// Auto-adjust care priorities
if (PHQ9.total >= 15 || GAD7.total >= 10) {
  care_priorities.add("mental_health_support")
  recommended_resources.add("psychiatry_consult")
}

// Auto-adjust alert thresholds
if (PainAssessment.pain_average > 7) {
  pain_threshold = 6  // Lower threshold for quicker alerts
}
```

---

## 📊 ASSESSMENT SCHEDULE AUTOMATION

### AI-Powered Scheduling:

```javascript
// Initial assessment battery (admission)
admission_assessments = {
  required: ["ESAS", "PPS", "PHQ9", "GAD7", "Barthel"],
  optional: ["Cognitive", "Pain", "QOL"],
  timing: "within 48 hours"
}

// Ongoing schedule based on patient status
if (PPS.score > 60) {
  schedule = {
    ESAS: "weekly",
    PPS: "bi-weekly",
    PHQ9: "monthly",
    GAD7: "monthly",
    Barthel: "monthly"
  }
} else if (PPS.score 40-60) {
  schedule = {
    ESAS: "twice weekly",
    PPS: "weekly",
    PHQ9: "bi-weekly",
    GAD7: "bi-weekly",
    Barthel: "bi-weekly",
    Cognitive: "monthly"
  }
} else { // PPS < 40
  schedule = {
    ESAS: "daily",
    PPS: "weekly",
    PHQ9: "weekly",
    GAD7: "weekly",
    Barthel: "weekly"
  }
}

// Adaptive rescheduling
if (any_score_worsens_significantly) {
  increase_frequency_for_that_assessment()
}

if (all_scores_stable_for_month) {
  consider_decreasing_frequency()
}
```

### Due Assessment Notifications:

```javascript
// Dashboard badge shows:
"Assessments Due: 3"
- ESAS (due today)
- PPS (overdue by 2 days)
- PHQ9 (due in 1 day)

// Automatic reminders:
- Email to assigned caregiver
- In-app notification
- Alert on patient page
```

---

## 🎮 GAME-BASED COGNITIVE ASSESSMENTS

### Interactive Tests to Build:

#### 1. Memory Card Game
**Tests:** Visual memory, attention  
**Scoring:** Time to complete, errors  
**Levels:** 4, 6, 8, 12 pairs  
**Integration:** Supplement to MoCA

#### 2. Digit Span Challenge
**Tests:** Working memory  
**Scoring:** Longest sequence recalled  
**Variations:** Forward, backward  
**Integration:** MMSE attention component

#### 3. Clock Drawing Digital
**Tests:** Visuospatial, executive function  
**Scoring:** Automated analysis of drawing  
**Integration:** Part of cognitive battery

#### 4. Word Fluency Timer
**Tests:** Language, executive function  
**Scoring:** Number of words in 60 seconds  
**Categories:** Letters, categories  
**Integration:** MoCA language component

#### 5. Trail Making Game
**Tests:** Visual attention, task switching  
**Scoring:** Time to complete, errors  
**Levels:** Part A (numbers), Part B (alternating)  
**Integration:** Executive function assessment

#### 6. Reaction Time Test
**Tests:** Processing speed  
**Scoring:** Average reaction time  
**Variations:** Simple, choice reaction  
**Integration:** Cognitive speed metric

### Gamification Features:
- Progress badges
- Friendly competition (if appropriate)
- Personal best tracking
- Motivational feedback
- Accessibility options (large text, high contrast)

---

## 📱 MOBILE-FRIENDLY FEATURES

### Patient Self-Assessment:
- ESAS can be completed daily by patient on phone
- PHQ-9 and GAD-7 via text message links
- Push notifications for reminders
- Offline mode with sync

### Caregiver App:
- Quick ESAS entry for proxy reporting
- Caregiver burden self-assessment
- Photo upload of physical assessments
- Emergency contact button

---

## 🔒 COMPLIANCE & VALIDATION

### Data Validation:
- Score ranges enforced (e.g., ESAS 0-10)
- Required fields marked clearly
- Invalid entries prevented
- Confirmation on submission

### Audit Trail:
- Who completed assessment
- When completed
- Any modifications
- Proxy completion noted

### Clinical Guidelines:
- Display instructions from validated tools
- Show scoring interpretation
- Reference clinical thresholds
- Link to evidence base

---

## 📈 ANALYTICS & REPORTING

### Patient-Level Analytics:
- Assessment completion rate
- Score trends over time
- Domain comparisons
- Deterioration alerts

### System-Level Analytics:
- Average scores by diagnosis
- Assessment compliance rates
- Time to complete assessments
- Alert response times

### Research Export:
- De-identified data export
- Aggregate statistics
- Correlation analysis
- Outcome tracking

---

## 🎯 IMPLEMENTATION PRIORITY

### Phase 1 (Essential - Week 1):
1. ✅ Database schema - DONE
2. 🔨 Backend API for ESAS
3. 🔨 Backend API for PPS
4. 🔨 Backend API for PHQ-9/GAD-7
5. ⏳ Frontend: Assessment Dashboard
6. ⏳ Frontend: ESAS Form
7. ⏳ AI integration for alerts

### Phase 2 (Important - Week 2):
8. Backend API for Barthel
9. Backend API for Cognitive
10. Backend API for Pain
11. Frontend: All forms for Phase 2 assessments
12. Assessment scheduling system
13. Trend visualization

### Phase 3 (Enhanced - Week 3):
14. Backend API for QOL
15. Backend API for Caregiver Burden
16. Backend API for Motor Skills
17. Frontend: Remaining forms
18. Game-based assessments
19. Mobile responsiveness
20. Export and reporting

---

## 💻 CODE STRUCTURE

### Backend:
```
backend/
├── routers/
│   └── clinical_assessments.py (new - in progress)
├── src/
│   └── db.py (updated with assessment tables)
├── services/
│   └── assessment_scoring.py (new - scoring logic)
│   └── assessment_scheduler.py (new - due date logic)
└── create_assessment_tables.py (completed)
```

### Frontend:
```
frontend/src/
├── pages/
│   ├── AssessmentDashboard.jsx (new)
│   ├── ESASForm.jsx (new)
│   ├── PPSForm.jsx (new)
│   ├── CognitiveForm.jsx (new)
│   ├── MentalHealthForm.jsx (new)
│   ├── ADLForm.jsx (new)
│   ├── PainForm.jsx (new)
│   ├── QOLForm.jsx (new)
│   ├── CaregiverBurdenForm.jsx (new)
│   └── MotorSkillsForm.jsx (new)
├── components/
│   ├── assessments/
│   │   ├── AssessmentCard.jsx
│   │   ├── AssessmentTrend.jsx
│   │   ├── ScoreInterpreter.jsx
│   │   └── AssessmentComparison.jsx
│   └── games/
│       ├── MemoryCardGame.jsx
│       ├── DigitSpanTest.jsx
│       ├── ClockDrawing.jsx
│       └── WordFluencyTest.jsx
└── hooks/
    └── useAssessments.js (new - data fetching)
```

---

## 📚 DOCUMENTATION CREATED

1. ✅ `CLINICAL_ASSESSMENTS_RESEARCH.md` - All validated tools researched
2. ✅ `CLINICAL_ASSESSMENTS_IMPLEMENTATION.md` - This file
3. ⏳ `ASSESSMENT_USER_GUIDE.md` - For clinicians (to create)
4. ⏳ `ASSESSMENT_API_DOCS.md` - API documentation (to create)

---

## 🎉 CURRENT STATUS

**Database:** ✅ Complete (10 tables created)  
**Backend API:** 🔨 Started (needs completion)  
**Frontend:** ⏳ Not started  
**AI Integration:** ⏳ Not started  
**Game-based Tests:** ⏳ Not started

**Estimated Time to Complete:**
- Backend API: 8-12 hours
- Frontend Forms: 12-16 hours
- AI Integration: 4-6 hours
- Game-based Tests: 8-10 hours
- Testing & Polish: 4-6 hours
**Total: 36-50 hours (5-7 working days)**

---

*Created: June 3, 2026*  
*All assessment tools are evidence-based and validated*  
*Ready for full implementation* 🚀
