# 🧠 INTELLIGENT CARE SYSTEM - IMPLEMENTATION PLAN

## YOUR REQUIREMENTS

You want the AI to:
1. ✅ **Give recommendations** - Disease-specific, personalized
2. ✅ **Show care guide** - Adapted to each patient's condition
3. ✅ **Actively monitor** - Continuous, automatic background monitoring
4. ✅ **Give alerts & notifications** - Real-time, proactive warnings
5. ✅ **Give directions reactively** - Respond to symptoms/triggers immediately
6. ✅ **Give directions proactively** - Anticipate issues before they occur
7. ✅ **Adapt to every illness** - Disease-specific knowledge for each condition
8. ✅ **Use questionnaire data** - Personalize based on preferences
9. ✅ **Tailor care** - Individualized to each patient

## CURRENT STATE

### What Exists But Isn't Used:
- ✅ AI models (XGBoost) - **exist but only show on AI Insights page**
- ✅ AI Analysis (`/api/ai-analysis/system-insights`) - **generates recommendations but not shown everywhere**
- ✅ Questionnaire data (PatientPreferences table) - **collected but not used for personalization**
- ✅ Alert system - **reactive only, no proactive triggers**
- ✅ Care Guide - **static, not adapted to patient**

### The Gap:
The intelligence exists in isolated components but isn't **integrated** into the user experience.

---

## SOLUTION: INTELLIGENT CARE ENGINE

### Architecture

```
[Patient Data] + [Questionnaire Prefs] + [Disease Profile]
            ↓
    [Intelligent Care Engine]
            ↓
    ┌───────┴──────────┬──────────────┬─────────────┐
    ↓                  ↓              ↓             ↓
[Personalized     [Proactive     [Adaptive    [Real-time
 Recommendations]  Monitoring]    Care Guide]  Alerts]
```

---

## COMPONENT 1: DISEASE-SPECIFIC KNOWLEDGE BASE

### What It Does:
- Stores clinical knowledge for each disease
- Defines symptoms, vital thresholds, monitoring frequency
- Lists care priorities and recommended resources

### Diseases to Cover:
1. **Cancer** (pain, fatigue, nausea management)
2. **Heart Failure** (fluid management, breathlessness)
3. **COPD** (oxygen therapy, breathing techniques)
4. **Dementia** (safety, routine, caregiver support)
5. **Kidney Disease** (dialysis, fluid/diet restrictions)
6. **Liver Disease** (encephalopathy, bleeding risk)
7. **Stroke** (rehabilitation, aspiration prevention)
8. **General Palliative** (fallback for other conditions)

### Data Structure:
```python
{
    "cancer": {
        "common_symptoms": ["pain", "fatigue", "nausea"],
        "critical_vitals": {"oxygen_saturation": 88, "temperature": 38.5},
        "pain_threshold": 5,  # Alert if pain > 5
        "monitoring_frequency": "daily",
        "key_concerns": ["infection_risk", "neutropenia"],
        "care_priorities": ["pain_management", "nutrition"],
        "resources": ["pain_management_cancer", "chemotherapy_guide"]
    }
}
```

---

## COMPONENT 2: PERSONALIZATION ENGINE

### What It Does:
- Combines disease profile + questionnaire preferences
- Creates individualized care plan
- Adapts content style, language, frequency

### Inputs:
1. **Patient.primary_diagnosis** → Disease profile
2. **PatientPreferences.info_style** → simple/detailed/visual
3. **PatientPreferences.emotional_states** → ["scared", "hopeful"]
4. **PatientPreferences.care_priorities** → ["pain_control", "family_time"]
5. **PatientPreferences.spiritual_importance** → high/medium/low
6. **PatientPreferences.wants_peer_connection** → True/False
7. **PatientPreferences.topic_interests** → ["nutrition", "pain"]

### Outputs:
```python
{
    "disease_type": "cancer",
    "communication_style": "simple",  # from preferences
    "priority_symptoms": ["pain", "fatigue"],
    "monitoring_schedule": "daily_vitals + twice_daily_pain",
    "recommended_resources": [filtered by interests],
    "spiritual_care_needed": True,
    "peer_support_recommended": False,
    "family_involvement": "high"  # from preferences
}
```

---

## COMPONENT 3: PROACTIVE MONITORING SYSTEM

### What It Does:
- **Background Task** running every 30 seconds
- Analyzes ALL patients automatically
- Compares current data against disease-specific thresholds
- Generates alerts when triggers detected

### Monitoring Rules (Disease-Specific):

#### Cancer Patients:
```
IF pain_level > 5 → Alert: "Pain spike detected"
IF temperature > 38.5 → Alert: "Fever - infection risk" (CRITICAL)
IF nausea frequency > 60% → Alert: "Persistent nausea"
IF oxygen_sat < 88% → Alert: "Critical hypoxemia"
```

#### Heart Failure Patients:
```
IF oxygen_sat < 90% → Alert: "Low oxygen"
IF weight_change > 2kg in 24h → Alert: "Fluid retention"
IF heart_rate > 120 → Alert: "Tachycardia"
IF breathlessness increasing → Alert: "Worsening dyspnea"
```

#### COPD Patients:
```
IF oxygen_sat < 88% → Alert: "Respiratory compromise"
IF respiratory_rate > 30 → Alert: "Tachypnea"
IF cough frequency increasing → Alert: "Possible infection"
```

### Alert Generation:
```python
def generate_disease_specific_alerts(patient, vitals, symptoms, disease_profile):
    alerts = []
    
    # Check vitals against disease thresholds
    if latest_vital.oxygen_sat < disease_profile["critical_vitals"]["oxygen_saturation"]:
        alerts.append({
            "severity": "CRITICAL",
            "type": "vital_abnormal",
            "message": f"O2 sat {latest_vital.oxygen_sat}% below threshold for {disease_type}",
            "action": disease_specific_intervention(disease_type, "hypoxemia"),
            "patient_id": patient.id
        })
    
    # Check symptom patterns
    if latest_symptom.pain_level > disease_profile["pain_threshold"]:
        alerts.append({
            "severity": "HIGH",
            "type": "pain_spike",
            "message": f"Pain level {latest_symptom.pain_level}/10 exceeds threshold",
            "action": disease_specific_intervention(disease_type, "pain"),
            "patient_id": patient.id
        })
    
    return alerts
```

---

## COMPONENT 4: ADAPTIVE CARE GUIDE

### What It Does:
- Replaces static Care Guide with **personalized** version
- Shows only relevant protocols for patient's disease
- Adapts language based on preferences (simple/detailed)
- Highlights priorities from questionnaire

### Example: Cancer Patient
**Shows:**
- WHO Pain Ladder (emphasized)
- Nausea management specific to chemotherapy
- Nutrition for cancer patients
- Infection prevention (emphasized if immunocompromised)
- Spiritual care section (if wants_spiritual_care = True)

**Hides:**
- Heart failure protocols
- COPD breathing exercises
- Stroke rehabilitation

### Example: Heart Failure Patient
**Shows:**
- Fluid restriction guidelines
- Low-sodium diet
- Daily weight monitoring
- Breathlessness management
- Medication adherence (ACE inhibitors, diuretics)

**Hides:**
- Cancer-specific content
- Dementia care strategies

---

## COMPONENT 5: INTELLIGENT RECOMMENDATIONS

### What It Does:
- Generates personalized action items for each patient
- Considers: disease + current symptoms + preferences + trends

### Recommendation Types:

#### 1. Immediate Actions (CRITICAL)
```
"Patient John: O2 sat 86% (below 88% threshold for cancer patients)"
Action: "Initiate oxygen therapy immediately"
Why: "Hypoxemia increases infection risk and reduces treatment tolerance"
Based on: Disease=cancer + Vital=low_O2 + Preference=wants_detailed_info
```

#### 2. Urgent Actions (HIGH)
```
"Patient Mary: Pain 8/10 for 6 hours"
Action: "Escalate to Step 3 of WHO Pain Ladder (strong opioid)"
Why: "Pain above threshold for heart failure patients, impacting quality of life"
Based on: Disease=heart_failure + Symptom=severe_pain + Priority=comfort
```

####
 3. Proactive Suggestions (MEDIUM)
```
"Patient David: Activity level declining over 5 days"
Action: "Consider physiotherapy referral or mobility aids"
Why: "Early intervention prevents complications in dementia patients"
Based on: Disease=dementia + Trend=declining_mobility + Preference=wants_independence
```

#### 4. Preventive Measures (LOW)
```
"Patient Sarah: Good pain control maintained"
Action: "Schedule medication review next week to optimize dosing"
Why: "Proactive management prevents breakthrough pain"
Based on: Disease=cancer + Status=stable + Priority=pain_management
```

---

## COMPONENT 6: REAL-TIME NOTIFICATION SYSTEM

### What It Does:
- **Frontend polls** `/api/intelligent-care/alerts` every 30 seconds
- **Badge count** on bell icon
- **Toast notifications** for new critical alerts
- **Dropdown** shows recent alerts with patient context

### UI Components:

#### Header Bell Icon:
```jsx
<div className="relative">
  <Bell className="w-6 h-6" />
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-600 text-white 
                     rounded-full w-5 h-5 text-xs flex items-center justify-center">
      {unreadCount}
    </span>
  )}
</div>
```

#### Toast Notification:
```jsx
// On new critical alert
toast.error(
  <div>
    <div className="font-bold">{alert.type}</div>
    <div>{alert.patient_name}</div>
    <div className="text-sm">{alert.message}</div>
  </div>,
  { duration: 10000 }
)
```

---

## COMPONENT 7: PERSONALIZED DASHBOARD WIDGETS

### What It Does:
- Dashboard shows **different widgets** based on patient profile
- Emphasizes what matters most to THIS patient

### Example: Cancer Patient Dashboard
```
┌─────────────────────────────────────────┐
│ Pain Management Focus                    │
│ Current: 6/10 (trending up ⬆)          │
│ Action: Review medication efficacy       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Infection Risk Alert                     │
│ Temperature: 38.2°C                      │
│ WBC: Low (if tracked)                    │
│ Action: Monitor for sepsis signs         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Your Care Priorities (from questionnaire)│
│ 1. Pain control ✅ (current: good)      │
│ 2. Family time (guide available)         │
│ 3. Nutrition (resources below)           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Recommended for You                      │
│ 📄 Managing Chemotherapy Side Effects   │
│ 📄 Nutrition Tips for Cancer Patients   │
│ 📞 Support Hotline: 0800-CANCER         │
└─────────────────────────────────────────┘
```

### Example: Heart Failure Patient Dashboard
```
┌─────────────────────────────────────────┐
│ Fluid Status Monitor                     │
│ Weight: +1.5kg today ⚠️                 │
│ Action: Restrict fluids, increase diuretic│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Breathlessness Tracker                   │
│ Episodes: 3 today (usual: 1)             │
│ Action: Elevate head, oxygen PRN         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Your Medications (critical for HF)       │
│ ✅ Furosemide - taken today              │
│ ⚠️  ACE inhibitor - due in 2 hours       │
└─────────────────────────────────────────┘
```

---

## IMPLEMENTATION ROADMAP

### Phase 1: Disease Knowledge Base (2 hours)
- [ ] Create disease profiles for 8 conditions
- [ ] Define thresholds, symptoms, resources
- [ ] Store in backend as Python dict or JSON file

### Phase 2: Personalization Engine (3 hours)
- [ ] Build function to combine disease + preferences
- [ ] Create patient profile generator
- [ ] Test with real patient data

### Phase 3: Proactive Monitoring (4 hours)
- [ ] Create background task (FastAPI BackgroundTasks)
- [ ] Implement disease-specific alert logic
- [ ] Auto-generate alerts every 30 seconds
- [ ] Store alerts in database

### Phase 4: Real-Time Notifications (3 hours)
- [ ] Frontend polling hook (React Query)
- [ ] Bell icon with badge count
- [ ] Toast notifications (react-hot-toast)
- [ ] Alert dropdown component

### Phase 5: Adaptive Care Guide (3 hours)
- [ ] Filter care guide by disease
- [ ] Adjust language complexity
- [ ] Highlight priorities from questionnaire
- [ ] Show personalized resources

### Phase 6: Intelligent Recommendations (3 hours)
- [ ] Generate action items per patient
- [ ] Include rationale and timeframe
- [ ] Surface on Patient Monitor page
- [ ] Show on Dashboard

### Phase 7: Personalized Dashboards (4 hours)
- [ ] Create disease-specific widgets
- [ ] Pull questionnaire priorities
- [ ] Show relevant resources
- [ ] Adapt layout per patient

**Total: 22 hours**

---

## API ENDPOINTS NEEDED

### 1. Get Personalized Profile
```
GET /api/intelligent-care/profile/{patient_id}
Returns: disease profile + preferences + personalized care plan
```

### 2. Get Active Alerts (Real-Time)
```
GET /api/intelligent-care/alerts
Query params: ?severity=critical&unread_only=true
Returns: list of alerts with patient context
```

### 3. Mark Alert as Read
```
PUT /api/intelligent-care/alerts/{alert_id}/read
```

### 4. Get Personalized Recommendations
```
GET /api/intelligent-care/recommendations/{patient_id}
Returns: prioritized action items with rationale
```

### 5. Get Adaptive Care Guide
```
GET /api/intelligent-care/care-guide/{patient_id}
Returns: filtered protocols relevant to patient
```

### 6. Get Personalized Resources
```
GET /api/intelligent-care/resources/{patient_id}
Returns: resources matching disease + interests + complexity
```

### 7. Trigger Proactive Analysis (Background)
```
POST /api/intelligent-care/analyze-all
Triggers: background task to analyze all patients
```

---

## DATABASE CHANGES

### New Table: PersonalizedAlerts
```sql
CREATE TABLE personalized_alerts (
    id INTEGER PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    alert_type VARCHAR(50),  -- pain_spike, vital_abnormal, infection_risk
    severity VARCHAR(20),     -- CRITICAL, HIGH, MEDIUM, LOW
    message TEXT,
    disease_context VARCHAR(50),  -- cancer, heart_failure, etc.
    action_recommended TEXT,
    rationale TEXT,
    triggered_at DATETIME,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by INTEGER REFERENCES users(id),
    acknowledged_at DATETIME
);
```

### Extend Existing Alert Table:
```sql
ALTER TABLE alerts ADD COLUMN disease_specific BOOLEAN DEFAULT FALSE;
ALTER TABLE alerts ADD COLUMN personalized_action TEXT;
ALTER TABLE alerts ADD COLUMN based_on_preferences BOOLEAN DEFAULT FALSE;
```

---

## FRONTEND COMPONENTS NEEDED

### 1. Real-Time Alert System
```
components/AlertNotificationSystem.jsx
- Polls every 30 seconds
- Shows badge count
- Toast for critical alerts
- Dropdown with recent alerts
```

### 2. Personalized Dashboard Widgets
```
components/PersonalizedWidget.jsx
- Disease-specific content
- Priority highlights
- Recommended resources
```

### 3. Adaptive Care Guide
```
pages/AdaptiveCareGuide.jsx
- Filtered by disease
- Adjusted complexity
- Personalized priorities
```

### 4. Intelligent Recommendations Panel
```
components/IntelligentRecommendations.jsx
- Action items with rationale
- Priority badges
- Timeframe indicators
```

---

## EXAMPLE USER EXPERIENCE

### Scenario: Cancer Patient with High Pain

**Morning (8 AM):**
1. Patient logs pain: 8/10
2. AI detects: pain > threshold (5) for cancer patients
3. **Alert generated automatically:** "Pain spike detected - John Mensah"
4. **Notification appears:** Toast + Bell badge
5. **Clinician clicks:** Sees recommendation
   - "Action: Escalate to WHO Step 3 (strong opioid)"
   - "Rationale: Pain above 5/10 threshold for cancer, impacting QOL"
   - "Based on: Disease=cancer + Symptom=severe_pain + Priority=comfort"
6. **Care Guide adapts:** Emphasizes WHO Pain Ladder
7. **Dashboard shows:** Pain management focus widget

**Afternoon (2 PM):**
1. Patient logs temperature: 38.6°C
2. AI detects: fever in cancer patient (infection risk)
3. **CRITICAL alert generated:** "Fever detected - infection risk"
4. **Notification:** Red toast, sound alert
5. **Recommendation:** "Immediate clinical assessment, consider antibiotics"
6. **Rationale:** "Immunocompromised patients at high sepsis risk"

**Evening (6 PM):**
1. Pain reassessed: 4/10 (improved)
2. AI detects: positive response to intervention
3. **Update generated:** "Pain management effective"
4. **Dashboard shows:** ✅ Pain control achieved
5. **Resource suggested:** "Maintaining pain control at home"

---

## TECHNICAL IMPLEMENTATION DETAILS

### Background Monitoring Task
```python
from fastapi import BackgroundTasks

@app.on_event("startup")
async def startup_event():
    # Start background monitoring
    asyncio.create_task(proactive_monitoring_loop())

async def proactive_monitoring_loop():
    while True:
        db = SessionLocal()
        try:
            analyze_all_patients_proactively(db)
        finally:
            db.close()
        await asyncio.sleep(30)  # Every 30 seconds
```

### React Query Polling
```jsx
const { data: alerts } = useQuery({
  queryKey: ['realtime-alerts'],
  queryFn: fetchAlerts,
  refetchInterval: 30000,  // 30 seconds
  onSuccess: (newAlerts) => {
    // Show toast for new critical alerts
    newAlerts.filter(a => a.severity === 'CRITICAL').forEach(alert => {
      toast.error(`${alert.type}: ${alert.patient_name}`);
    });
  }
});
```

---

## SUMMARY

### What You'll Get:

1. **✅ Disease-Specific Intelligence**
   - Each condition has tailored thresholds and recommendations

2. **✅ Personalized Care**
   - Uses questionnaire data to adapt everything

3. **✅ Proactive Monitoring**
   - Analyzes continuously, doesn't wait for user to check

4. **✅ Real-Time Alerts**
   - Immediate notifications when issues detected

5. **✅ Reactive + Proactive Directions**
   - Responds to current state AND anticipates problems

6. **✅ Adaptive Care Guide**
   - Shows only what's relevant to THIS patient

7. **✅ Intelligent Recommendations**
   - Explains WHY, not just WHAT

8. **✅ Context-Aware**
   - Considers disease, preferences, priorities, trends

---

**Next Step:** Implement this system component by component.

**Estimated Time:** 22 hours for full implementation

**Priority Order:**
1. Disease Knowledge Base (foundation)
2. Proactive Monitoring (safety-critical)
3. Real-Time Notifications (user-facing)
4. Personalization Engine (value-add)
5. Adaptive Components (enhancement)

