# 🔔 Alerts System - Visual Flow Diagram

## 📊 How Alerts Work: Complete Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ALERT LIFECYCLE                             │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: ASSESSMENT COMPLETION
┌──────────────────────────────────────────────────────────────────┐
│  Staff Member completes assessment (e.g., ESAS form)             │
│  • Sets Pain = 10                                                │
│  • Clicks "Save Assessment"                                      │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
                    [POST /api/assessments/esas]
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: clinical_assessments.py                                │
│  ├─ Saves assessment to database                                │
│  ├─ Checks thresholds:                                           │
│  │   if pain >= 8:                                               │
│  │      create_assessment_alert(...)                             │
│  ├─ Creates Alert record:                                        │
│  │   • patient_id = 1                                            │
│  │   • alert_type = "severe_pain"                                │
│  │   • severity = "critical"                                     │
│  │   • message = "Severe pain detected: 10/10"                   │
│  │   • is_acknowledged = False                                   │
│  └─ Returns: { alerts_generated: ["severe_pain"] }               │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
                    [Response to Frontend]
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND: ESASForm.jsx                                          │
│  • Shows success toast: "1 alert(s) generated"                   │
│  • Navigates back to Assessment Dashboard                        │
└──────────────────────────────────────────────────────────────────┘


STEP 2: REAL-TIME NOTIFICATION (Within 30 seconds)
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND: RealTimeAlerts.jsx (Bell Icon Component)             │
│  • Runs every 30 seconds automatically                           │
│  • Makes request: GET /api/alerts?acknowledged=false             │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
                    [GET /api/alerts?acknowledged=false]
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: alerts.py                                              │
│  • Queries database:                                             │
│    SELECT alerts.*, patients.full_name                           │
│    FROM alerts                                                   │
│    JOIN patients ON alerts.patient_id = patients.id             │
│    WHERE is_acknowledged = False                                 │
│    ORDER BY created_at DESC                                      │
│  • Returns array of alerts with patient names                    │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
                    [Response: Array of Alerts]
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND: RealTimeAlerts.jsx                                    │
│  • Receives alerts array                                         │
│  • Count = 1 unread alert                                        │
│  • Shows RED BADGE on bell icon with "1"                         │
│  • If critical severity:                                         │
│    └─ Shows RED TOAST popup automatically                        │
│       "🔴 SEVERE PAIN: Severe pain detected: 10/10"              │
└──────────────────────────────────────────────────────────────────┘


STEP 3: USER INTERACTION
┌──────────────────────────────────────────────────────────────────┐
│  Staff Member clicks BELL ICON 🔔                                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  DROPDOWN OPENS                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  📊 Active Alerts              [X]                         │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  🔴 CRITICAL                    Just now                   │ │
│  │  Severe Pain                                               │ │
│  │  Severe pain detected: 10/10                               │ │
│  │  Patient: John Doe                            ✓ [Ack]     │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  View All Alerts →                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘


STEP 4: ACKNOWLEDGMENT
┌──────────────────────────────────────────────────────────────────┐
│  Staff clicks ✓ Acknowledge button                               │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
                    [PUT /api/alerts/123/acknowledge]
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: alerts.py                                              │
│  • Finds alert by ID                                             │
│  • Updates:                                                      │
│    - is_acknowledged = True                                      │
│    - acknowledged_by = current_user.id                           │
│    - acknowledged_at = now()                                     │
│  • Saves to database                                             │
│  • Returns: { message: "Alert acknowledged" }                    │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND: RealTimeAlerts.jsx                                    │
│  • Invalidates query cache                                       │
│  • Refetches alerts                                              │
│  • Badge count updates: 1 → 0                                    │
│  • Shows toast: "Alert acknowledged"                             │
│  • Red badge disappears                                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Alert Triggers (Threshold Reference)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ASSESSMENT → ALERT MAPPING                   │
└─────────────────────────────────────────────────────────────────┘

ESAS Assessment
├─ Pain ≥ 8         → "severe_pain"         [CRITICAL]
├─ Pain ≥ 7         → "high_pain"           [HIGH]
├─ Depression ≥ 8   → "severe_depression"   [CRITICAL]
├─ Anxiety ≥ 8      → "severe_anxiety"      [CRITICAL]
├─ Wellbeing ≤ 2    → "critical_wellbeing"  [CRITICAL]
└─ Breathless ≥ 8   → "severe_dyspnea"      [HIGH]

PPS Assessment
├─ Score ≤ 30%      → "critical_pps"        [CRITICAL]
├─ Score ≤ 50%      → "low_pps"             [HIGH]
└─ 20% decline      → "rapid_decline"       [HIGH]

PHQ-9 Assessment
├─ Question 9 > 0   → "suicide_risk_CRISIS" [CRITICAL] 🚨
├─ Total ≥ 20       → "severe_depression"   [CRITICAL]
└─ Total ≥ 15       → "mod_severe_depression" [HIGH]

Caregiver Burden
├─ Score > 20       → "high_caregiver_burden"     [HIGH]
└─ Score ≥ 10       → "moderate_caregiver_burden" [MEDIUM]

Motor Skills
├─ TUG > 14s        → "high_fall_risk"      [HIGH]
├─ 6MWT < 300m      → "poor_exercise_tolerance" [MEDIUM]
├─ O2 drop > 4%     → "oxygen_desaturation" [HIGH]
└─ Balance < 3      → "poor_balance"        [HIGH]

Quality of Life
├─ Total < 50       → "low_quality_of_life" [HIGH]
├─ Physical < 10    → "poor_physical_wellbeing" [HIGH]
└─ Emotional < 8    → "poor_emotional_wellbeing" [MEDIUM]
```

---

## 🔄 Real-Time Polling Mechanism

```
┌─────────────────────────────────────────────────────────────────┐
│                   AUTOMATIC 30-SECOND POLLING                    │
└─────────────────────────────────────────────────────────────────┘

Time: 0s
┌──────────────────────────┐
│  RealTimeAlerts.jsx      │
│  • Component mounts      │
│  • Initial query runs    │
│  • Gets current alerts   │
└────────────┬─────────────┘
             │
             ▼
      [GET /api/alerts]
             │
             ▼
        Returns: []
      (No alerts yet)


Time: 15s
┌──────────────────────────┐
│  Staff completes ESAS    │
│  • Pain = 10             │
│  • Alert created in DB   │
└──────────────────────────┘


Time: 30s (Automatic Poll)
┌──────────────────────────┐
│  RealTimeAlerts.jsx      │
│  • Auto-refetch          │
│  • React Query timer     │
└────────────┬─────────────┘
             │
             ▼
      [GET /api/alerts]
             │
             ▼
    Returns: [{ alert1 }]
      (New alert found!)
             │
             ▼
┌──────────────────────────┐
│  • Badge appears: 🔔[1]  │
│  • Toast shows (if crit) │
│  • lastCount: 0 → 1      │
└──────────────────────────┘


Time: 60s (Next Poll)
┌──────────────────────────┐
│  RealTimeAlerts.jsx      │
│  • Auto-refetch again    │
└────────────┬─────────────┘
             │
             ▼
      [GET /api/alerts]
             │
             ▼
    Returns: [{ alert1 }]
      (Same alert, still unacknowledged)
             │
             ▼
┌──────────────────────────┐
│  • Badge stays: 🔔[1]    │
│  • No new toast          │
│  • lastCount: 1 → 1      │
└──────────────────────────┘


[Continues every 30 seconds...]
```

---

## 👥 Role-Based Alert Filtering

```
┌─────────────────────────────────────────────────────────────────┐
│                   WHO SEES WHICH ALERTS?                         │
└─────────────────────────────────────────────────────────────────┘

User Role: ADMIN
├─ Sees: ALL alerts for ALL patients
├─ Bell Icon: YES
└─ Use Case: System-wide monitoring

User Role: CLINICIAN
├─ Sees: ALL alerts for ALL patients
├─ Bell Icon: YES
└─ Use Case: Clinical oversight

User Role: CAREGIVER
├─ Sees: Alerts for ASSIGNED patients only
│   (via CaregiverAssignment table)
├─ Bell Icon: YES
└─ Use Case: Care team notifications

User Role: PATIENT
├─ Sees: Only their OWN alerts
├─ Bell Icon: NO (goes to Alerts page directly)
└─ Use Case: Self-monitoring

User Role: FAMILY
├─ Sees: Alerts for LINKED patients
│   (via PatientFamilyLink table)
├─ Bell Icon: NO
└─ Use Case: Family awareness
```

---

## 🎨 Alert Severity Visual System

```
┌─────────────────────────────────────────────────────────────────┐
│                        SEVERITY LEVELS                           │
└─────────────────────────────────────────────────────────────────┘

🔴 CRITICAL
├─ Color: Red background, red border
├─ Badge: Red with "CRITICAL" text
├─ Icon: ❌ XCircle (red)
├─ Animation: Pulsing
├─ Toast: Auto-appears (red)
├─ Sound: (Could add alert sound)
└─ Examples: Suicide risk, severe pain ≥8, PPS ≤30%

🟠 HIGH
├─ Color: Orange background, orange border
├─ Badge: Orange with "HIGH" text
├─ Icon: ⚠️  AlertTriangle (orange)
├─ Animation: None
├─ Toast: No auto-popup
└─ Examples: High pain ≥7, fall risk, caregiver burden >20

🟡 MEDIUM
├─ Color: Yellow background, yellow border
├─ Badge: Yellow with "MEDIUM" text
├─ Icon: 🔔 Bell (yellow)
├─ Animation: None
├─ Toast: No auto-popup
└─ Examples: Moderate depression, moderate anxiety

🔵 LOW
├─ Color: Blue background, blue border
├─ Badge: Blue with "LOW" text
├─ Icon: 🔔 Bell (blue)
├─ Animation: None
├─ Toast: No auto-popup
└─ Examples: Informational alerts, reminders
```

---

## 📱 Components Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENTS                           │
└─────────────────────────────────────────────────────────────────┘

Layout.jsx (Top Header)
└─── RealTimeAlerts.jsx (Bell Icon)
     ├─── Polls: GET /api/alerts?acknowledged=false
     ├─── Shows: Badge with count
     ├─── Dropdown with 5 recent alerts
     └─── Toast notifications (critical only)

Sidebar.jsx
└─── Link to /alerts
     └─── Shows badge indicator

Alerts.jsx (Full Page)
├─── Polls: GET /api/alerts (all)
├─── Shows: Stats cards
├─── Filters: Severity, status, search
├─── Lists: Active + Acknowledged
└─── Actions: Acknowledge, Dismiss


┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND ENDPOINTS                            │
└─────────────────────────────────────────────────────────────────┘

GET /api/alerts
├─ Query Params: patient_id, severity, acknowledged
├─ Returns: Array of alerts with patient names
└─ Used By: RealTimeAlerts, Alerts page

GET /api/alerts/unread-count
├─ Returns: { count: 5 }
└─ Used By: Badge count

PUT /api/alerts/{id}/acknowledge
├─ Marks alert as acknowledged
└─ Used By: Acknowledge buttons

DELETE /api/alerts/{id}
├─ Soft deletes alert (is_dismissed=true)
└─ Used By: Dismiss button
```

---

## ✅ Success Indicators Checklist

```
□ Backend running on port 8000
□ Frontend running on port 5173
□ Logged in as staff member (not patient)
□ Bell icon visible in top right corner

After completing assessment with critical values:
□ Success toast shows "X alert(s) generated"
□ Within 30 seconds: Red badge appears on bell
□ Badge shows correct count
□ Badge has pulsing animation
□ Clicking bell opens dropdown
□ Dropdown shows alerts with patient names
□ Can click alert to navigate to patient
□ Can acknowledge with checkmark button
□ Critical alerts show red toast popup
□ Alerts page (/alerts) shows same alerts
□ Stats cards update with counts
□ Can filter and search alerts
□ Acknowledged alerts move to bottom section
```

---

## 🎯 Quick Test Script

**5-Minute Alert Test:**

1. ✅ Login as nurse
2. ✅ Check bell - should be clear initially
3. ✅ Go to any patient → Clinical Assessments
4. ✅ Complete ESAS: Pain = 10, save
5. ✅ See toast: "2 alert(s) generated"
6. ✅ Wait 30 seconds or refresh
7. ✅ Bell badge appears with "2"
8. ✅ Click bell → see "Severe pain detected: 10/10"
9. ✅ Click alert → goes to patient page
10. ✅ Go back → Alerts page → see same alert
11. ✅ Acknowledge alert → badge decreases to "1"
12. ✅ Alert moves to "Acknowledged" section

**✅ PASS** = Alerts system working correctly!

---

This visual guide shows the complete flow from assessment completion to alert notification and acknowledgment. The system is production-ready! 🎉
