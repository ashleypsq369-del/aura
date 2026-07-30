# 🚨 Missing Critical Reports & Status Indicators

**Date:** 2026-07-30  
**Analysis:** Complete system review for dissertation readiness

---

## Part 1: Missing Critical Reports

### ❌ 1. Medication Adherence Report (CRITICAL for palliative care)

**Why critical:**
- Missed pain medications = patient suffering
- Opioid adherence is closely monitored in palliative care
- Non-adherence is a risk factor for deterioration

**What the system already tracks:**
- `MedicationAdherenceLog` table exists with `taken`, `skipped_reason`, `scheduled_at`, `taken_at`
- Medications have `frequency`, `start_date`, `end_date`
- Compliance engine checks `has_medication_log_today()` daily

**What's missing:**
- No report showing doses taken vs missed per patient
- No adherence % per medication type (opioids, anti-emetics, etc.)
- No missed dose patterns (time-of-day, caregiver on duty)
- No longitudinal adherence trends

**Backend endpoint needed:**
```
GET /api/reports/medication-adherence/{patient_id}?date_from=...&date_to=...
```

**Fields:**
- Total doses scheduled vs taken vs missed
- Adherence % overall + per medication
- PRN medication usage frequency
- Missed dose patterns (morning vs evening, weekday vs weekend)
- Medications with <80% adherence (warning threshold)

---

### ❌ 2. Care Plan Goal Progress Report

**Why critical:**
- Care plans drive all palliative care activity
- Goals must be reviewed weekly (NHS NACEL 2024 standard)
- Overdue goals = care quality issue

**What the system already tracks:**
- `CarePlanGoal` table: `status`, `progress`, `target_date`, `achieved_date`, `priority`
- `CarePlanChecklistItem` table: `is_completed`, `due_date`, `frequency`
- Goals categorized by type (pain, symptom, functional, psychological, spiritual, family)

**What's missing:**
- No report on goal achievement rates
- No overdue goal flagging
- No breakdown by goal category (are psychological goals being ignored?)
- No comparison of AI-suggested vs clinician-created goal outcomes

**Backend endpoint needed:**
```
GET /api/reports/care-plan-progress/{patient_id}
GET /api/reports/care-plan-progress-population  (all patients)
```

**Fields:**
- Goals by status (pending/in_progress/achieved/discontinued)
- Progress % per goal category
- Overdue goals list
- Average time to goal achievement by category
- Checklist task completion rates
- AI-suggested vs manual goal comparison

---

### ❌ 3. Assessment Completion & Trends Report

**Why critical:**
- ESAS is supposed to be daily — gaps indicate system failure
- PPS monthly assessment is mandatory
- PHQ-9 flags depression requiring intervention
- ESAS TSDS ≥40 = 72% 30-day mortality (must be tracked)

**What the system already tracks:**
- All 9 assessment types in DB (ESAS, PPS, PHQ-9, GAD-7, Barthel, BPI, QoL, Cognitive, Motor)
- Assessment timestamps, scores, `assessed_by` clinician
- Evidence-based scoring service provides PPI, PaP, ESAS-Risk

**What's missing:**
- No report showing which patients haven't had assessments in X days
- No score trend visualization
- No completion rate by clinician
- No flagging of concerning scores (PHQ-9 ≥15, ESAS TSDS ≥40)

**Backend endpoint needed:**
```
GET /api/reports/assessment-completion?days_overdue=14
GET /api/reports/assessment-trends/{patient_id}?type=esas
```

**Fields:**
- Patients overdue for each assessment type
- Completion rates per clinician
- Score trajectories (improving/stable/declining)
- Threshold violations (PHQ-9 ≥15, GAD-7 ≥10, ESAS TSDS ≥40)
- Assessment frequency heatmap

---

## Part 2: Missing Status Indicators in Frontend

### ❌ 1. Medications Page — No "Taken Today" Status

**Current state:**
- Shows list of active medications
- Shows next dose time (calculated from frequency)
- **No indication whether today's dose was taken**

**What users need to see:**
```
Morphine 10mg PO
├─ ✅ 08:00 — Taken 5 mins ago by Nurse Akua
├─ ⏰ 14:00 — Due in 2h 30m
└─ ⏰ 20:00 — Scheduled
```

**Missing UI elements:**
- Green ✅ for taken doses
- Red ⚠️ for missed doses (past due time)
- Orange ⏰ for upcoming doses
- "Mark as Taken" button for caregivers
- Adherence percentage badge on each medication card

**Frontend changes needed:**
- Fetch `/api/medications/{patient_id}/adherence-today`
- Add status dots/badges to medication list
- Add "Mark as Taken" quick action
- Show adherence % ring on medication cards

---

### ❌ 2. Patient Detail / Dashboard — No Assessment Overdue Warnings

**Current state:**
- Shows patient risk score, vitals, symptoms
- **Doesn't warn if ESAS is 7 days old (should be daily)**
- **Doesn't warn if PPS is 45 days old (should be monthly)**

**What clinicians need to see:**
```
⚠️ ESAS: Last completed 8 days ago (overdue)
✅ PPS: Completed 12 days ago
⚠️ PHQ-9: Last completed 21 days ago (overdue — fortnightly recommended)
```

**Missing UI elements:**
- Assessment status badges with days-since-last
- Color coding (green <3 days, yellow 3-7 days, red >7 days for ESAS)
- "Complete Now" quick action button
- Assessment compliance % for the patient

**Frontend changes needed:**
- Add AssessmentStatusBar component to PatientDetail
- Fetch `/api/assessments/{patient_id}/status`
- Show inline warnings when viewing a patient
- Link "Complete Now" to assessment forms

---

### ❌ 3. Care Plan Detail — No Goal/Checklist Task Completion UI

**Current state:**
- Care plans exist in the system
- Goals and checklist items are in the DB
- **Zero frontend UI to view or update goal progress**
- **Zero UI to mark checklist tasks as done**

**What care teams need:**
```
Goal: Reduce pain from 7/10 to 4/10 within 7 days
├─ Status: In Progress (60% complete)
├─ Target: 3 days remaining
└─ Checklist:
    ├─ ✅ Increase morphine to 15mg (completed yesterday)
    ├─ ⏳ Log pain scores after each dose (0/3 today)
    └─ ⏳ Assess side effects daily (0/1 today)
```

**Missing UI elements:**
- Goal progress bars
- Checklist task checkboxes
- Overdue goal warnings
- "Mark Goal as Achieved" button
- Goal category breakdown (pain/psychological/spiritual)

**Frontend changes needed:**
- Create CarePlanGoalCard component
- Add checkboxes for daily tasks
- Fetch `/api/care-plans/{patient_id}/goals`
- PUT `/api/care-plans/goals/{goal_id}/progress` to update

---

## Part 3: Existing Checklist System (Already Works! ✅)

The **DailyTaskChecklist** component DOES show completion status for:
- ✅ ESAS daily check-in
- ✅ Medication acknowledgement
- ✅ Vitals recording
- ✅ PPS monthly
- ✅ PHQ-9 fortnightly
- ✅ Upcoming appointments

**Where it's visible:**
- Patient Portal (`/my-space`) — full version
- Dashboard — compact version

**What it does well:**
- Progress ring showing % complete
- Required vs optional task distinction
- Links to complete each task
- Real-time updates from `/api/compliance/my-tasks`

**What it doesn't cover:**
- Individual medication doses (only generic "medication acknowledgement")
- Care plan goals (separate from daily tasks)
- Assessment overdue warnings on patient detail pages

---

## Implementation Priority

### High Priority (Must Have for Dissertation)

1. **Medication Adherence Report** — demonstrates real clinical utility
2. **Medication "Taken Today" Status UI** — shows working adherence tracking
3. **Assessment Overdue Warnings** — proves system enforces clinical standards

### Medium Priority (Nice to Have)

4. **Care Plan Goal Progress Report** — shows goal-driven care
5. **Care Plan Goal UI** — interactive goal tracking

### Low Priority (Can Defer)

6. **Assessment Trends Report** — nice visualizations but not critical
7. **Bereavement Outcomes Report** — niche use case

---

## Dissertation Impact

### Current Strength ✅
- DailyTaskChecklist proves compliance system works
- Reports page shows 6 functional report types
- Evidence-based scoring shows real clinical models

### Current Weakness ❌
- No way to see if medications were taken today (major usability gap)
- Care plan goals are in DB but invisible to users (wasted feature)
- Assessment overdue warnings missing (doesn't enforce standards)

### After Implementation ✅
- Medication adherence tracking demonstrates **patient safety** focus
- Care plan goal tracking demonstrates **goal-oriented care** (NHS NACEL 2024)
- Assessment compliance demonstrates **clinical standard enforcement**

---

## Technical Implementation Plan

### Backend (3 new endpoints)

**1. Medication Adherence Report**
```python
@router.get("/medication-adherence/{patient_id}")
# Query MedicationAdherenceLog, group by medication
# Calculate adherence %, missed dose patterns
# Flag <80% adherence as warning
```

**2. Care Plan Goal Progress Report**
```python
@router.get("/care-plan-progress/{patient_id}")
# Query CarePlanGoal + CarePlanChecklistItem
# Group by goal category, calculate completion rates
# Flag overdue goals (target_date < now, status != 'achieved')
```

**3. Assessment Status Endpoint** (lightweight — not full report)
```python
@router.get("/assessments/{patient_id}/status")
# Query last ESAS, PPS, PHQ-9, GAD-7, Barthel, BPI
# Return days_since_last for each
# Flag overdue based on recommended frequency
```

### Frontend (3 UI enhancements)

**1. Medications Page — Add "Taken Today" Section**
```jsx
<Section title="Today's Doses">
  {medications.map(med => (
    <MedicationDoseCard
      med={med}
      log={adherenceLog[med.id]}  // from new API
      onMarkTaken={() => markTaken(med.id)}
    />
  ))}
</Section>
```

**2. PatientDetail — Add Assessment Status Bar**
```jsx
<AssessmentStatusBar
  esas={8}     // days since last
  pps={12}
  phq9={21}
  overdue={['esas','phq9']}
  onComplete={type => navigate(`/assessments/${patientId}/${type}`)}
/>
```

**3. CarePlanDetail Page** (new page)
```jsx
/care-plan/{patientId}
├─ Goal list with progress bars
├─ Checklist items with checkboxes
├─ "Mark Goal Achieved" buttons
└─ Overdue warnings
```

---

## Standards & Compliance

### NHS NACEL 2024 Requirements
- Weekly care plan reviews → **Goal Progress Report** demonstrates this
- Daily symptom assessments → **ESAS completion tracked** via checklist
- Medication safety monitoring → **Adherence Report** proves it

### HIPAA §164.312(b)
- All report generations already logged ✅
- New reports follow same audit pattern ✅

### CQC Fundamental Standards
- Person-centered goal-oriented care → **Goal Progress Report**
- Safe medication management → **Adherence tracking**

---

**Next: Implement the 3 high-priority items to close these critical gaps before dissertation submission.**
