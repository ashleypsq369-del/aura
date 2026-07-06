# Journey Event Tracking - System Flow

## 🔄 How Automatic Tracking Works

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER ACTIONS                               │
└─────────────────────────────────────────────────────────────────┘
              │
              ├─► Schedule Appointment
              ├─► Add/Edit/Delete Medication
              ├─► Complete Assessment (ESAS, PPS, PHQ-9, etc.)
              ├─► Change Patient Status
              ├─► Create New Patient
              └─► System Detects Crisis Keywords in Chat
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS                                │
│  • POST /api/appointments                                       │
│  • POST /api/medications                                        │
│  • POST /api/assessments/esas                                   │
│  • POST /api/assessments/phq9                                   │
│  • PUT /api/patients/{id}                                       │
│  • Background monitoring tasks                                  │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PROCESS & VALIDATE                             │
│  • Validate request data                                        │
│  • Check permissions                                            │
│  • Create/update database records                               │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SAVE TO DATABASE                              │
│  db.add(appointment)                                            │
│  db.add(medication)                                             │
│  db.add(assessment)                                             │
│  db.commit() ✅                                                 │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│              🎯 JOURNEY TRACKER CALLED                          │
│  from services.journey_tracker import track_xxx                 │
│                                                                 │
│  track_appointment(db, patient_id, ...)                        │
│  track_medication_change(db, patient_id, action, ...)          │
│  track_assessment(db, patient_id, type, score, ...)            │
│  track_critical_alert(db, patient_id, severity, ...)           │
│  track_status_change(db, patient_id, old, new, ...)            │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│            CREATE JOURNEY EVENT RECORD                          │
│  PatientJourneyEvent(                                           │
│      patient_id = patient_id,                                   │
│      event_type = 'appointment' | 'medication_change' | ...,    │
│      event_title = 'Follow-up Scheduled',                       │
│      event_detail = 'Details here...',                          │
│      is_milestone = true/false,                                 │
│      created_by = current_user.id                               │
│  )                                                              │
│  db.add(event)                                                  │
│  db.commit() ✅                                                 │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 FRONTEND RETRIEVES EVENTS                       │
│  GET /api/journey/patients/{patient_id}                         │
│  GET /api/journey/my-journey                                    │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│               MY JOURNEY PAGE DISPLAYS                          │
│  • Timeline visualization                                       │
│  • Events grouped by date                                       │
│  • Color-coded badges                                           │
│  • Icons for each event type                                    │
│  • Milestone indicators ⭐                                      │
│  • Filters and search                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Event Type Mapping

```
USER ACTION                →  EVENT TYPE         →  TIMELINE DISPLAY
────────────────────────────────────────────────────────────────────
Schedule Appointment       →  appointment        →  🟢 Appointment Scheduled
Add Medication            →  medication_change  →  🟣 New Medication
Update Medication         →  medication_change  →  🟣 Medication Updated
Discontinue Medication    →  medication_change  →  🟣 Medication Discontinued
Complete ESAS             →  assessment         →  🟠 ESAS Assessment
Complete PHQ-9            →  assessment         →  🟠 PHQ-9 Assessment
Complete PPS              →  assessment         →  🟠 PPS Assessment
High Pain Detected        →  high_alert         →  ⭐ Critical Alert: Severe Pain
Crisis Detected in Chat   →  high_alert         →  ⭐ Critical Alert: Mental Health Crisis
Status Change (→Critical) →  pathway_change     →  🔶 Care Status Updated
Create New Patient        →  admission          →  ⭐ Patient Admitted
```

---

## 🎯 Tracking Decision Logic

```
ACTION OCCURRED
    │
    ├─► Is this significant? (Yes/No)
    │   └─► No: Skip tracking
    │   └─► Yes: Continue
    │
    ├─► Is this an alert?
    │   ├─► Yes: Is severity High or Critical?
    │   │   ├─► Yes: Track as milestone (⭐)
    │   │   └─► No: Don't track (low/medium alerts not tracked)
    │   └─► No: Continue
    │
    ├─► Is this a status change?
    │   └─► Yes: Is new status critical/deceased?
    │       ├─► Yes: Track as milestone (⭐)
    │       └─► No: Track as regular event
    │
    ├─► Is this an admission?
    │   └─► Yes: Always track as milestone (⭐)
    │
    └─► Track as regular journey event
```

---

## 🔍 Journey Tracker Service Architecture

```
┌──────────────────────────────────────────────────────────┐
│         services/journey_tracker.py                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Core Function:                                          │
│  • create_journey_event(db, patient_id, ...)            │
│                                                          │
│  Convenience Functions (call core function):            │
│  • track_appointment()                                   │
│  • track_medication_change(action: add/change/stop)     │
│  • track_critical_alert(severity: high/critical)        │
│  • track_assessment(type, score, notes)                 │
│  • track_status_change(old_status, new_status)          │
│  • track_admission(admission_date, diagnosis)           │
│  • track_milestone(title, description)                  │
│                                                          │
│  Error Handling:                                         │
│  • Try/except wrapper                                    │
│  • Rollback on error                                     │
│  • Log errors (doesn't crash main flow)                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

```sql
patient_journey_events
├── id (PK)
├── patient_id (FK → patients.id)
├── event_type (admission, appointment, medication_change, ...)
├── event_title (Short title)
├── event_detail (Full description)
├── clinical_note (Clinician-only notes)
├── is_milestone (boolean - shows ⭐)
├── created_by (FK → users.id)
├── created_at (timestamp)
└── updated_at (timestamp)
```

---

## 🎨 Frontend Display Components

```
MyJourney.jsx
    │
    ├─► Fetches events from API
    │   GET /api/journey/patients/{id}
    │
    ├─► Groups events by date
    │   groupEventsByDate(events)
    │
    ├─► Filters events
    │   • By event type
    │   • By date range
    │   • By milestone status
    │
    ├─► Renders Timeline
    │   ├─► Date Headers
    │   ├─► Event Cards
    │   │   ├─► Icon (based on event_type)
    │   │   ├─► Badge (color-coded)
    │   │   ├─► Title
    │   │   ├─► Detail
    │   │   ├─► Timestamp
    │   │   └─► Milestone Indicator ⭐
    │   └─► Empty State
    │
    └─► Update on new events
        (Auto-refresh or manual)
```

---

## 🔐 Access Control

```
USER ROLE     │ CAN VIEW          │ CAN CREATE         │ SEES CLINICAL NOTES
──────────────┼───────────────────┼────────────────────┼────────────────────
Admin         │ All patients      │ ✅ Manual events  │ ✅ Yes
Clinician     │ All patients      │ ✅ Manual events  │ ✅ Yes
Patient       │ Own journey only  │ ❌ No (auto only) │ ❌ No
Family        │ Linked patient    │ ❌ No (auto only) │ ❌ No
```

---

## 📈 Event Volume Expectations

**Typical Patient Journey (30 days):**
- 1 Admission event
- 4-8 Appointment events
- 10-15 Medication events
- 20-30 Assessment events (2-3 per week)
- 5-10 Alert events (high/critical only)
- 2-4 Status change events
- **Total: 42-68 events per month**

---

## ⚡ Performance Considerations

1. **Database Indexing:**
   - Index on `patient_id` (for fast patient lookup)
   - Index on `event_type` (for filtering)
   - Index on `created_at` (for sorting)

2. **API Optimization:**
   - Pagination (limit results per page)
   - Date range filtering (reduce data transfer)
   - Event type filtering (reduce data transfer)

3. **Frontend Caching:**
   - Cache journey events in React state
   - Only refetch on user action or manual refresh

4. **Background Jobs:**
   - Journey tracking is lightweight (single INSERT)
   - Doesn't slow down main operations
   - Error handling prevents crashes

---

## 🚨 Error Handling Flow

```
ACTION OCCURS
    │
    ├─► Main Operation (e.g., create appointment)
    │   └─► SUCCESS ✅
    │
    ├─► Try: Track Journey Event
    │   ├─► SUCCESS ✅
    │   │   └─► Continue normally
    │   │
    │   └─► FAILURE ❌
    │       ├─► Rollback journey event only
    │       ├─► Log error
    │       └─► Main operation still succeeds!
    │
    └─► Return Success to User
        (Even if tracking failed, main action succeeded)
```

**Key Point:** Journey tracking failures DON'T break the main operation!

---

## 📝 Logging & Debugging

**Success Indicators:**
```
✅ Journey event created: appointment for patient 42
✅ Journey event created: medication_change for patient 42
✅ Journey event created: assessment for patient 42
```

**Error Indicators:**
```
❌ Failed to create journey event: [error details]
```

**Database Queries:**
```sql
-- View all journey events for patient
SELECT * FROM patient_journey_events 
WHERE patient_id = 42 
ORDER BY created_at DESC;

-- Count events by type
SELECT event_type, COUNT(*) 
FROM patient_journey_events 
WHERE patient_id = 42 
GROUP BY event_type;

-- View recent milestones
SELECT * FROM patient_journey_events 
WHERE patient_id = 42 AND is_milestone = true 
ORDER BY created_at DESC LIMIT 10;
```

---

## 🎉 Result: Complete Care Timeline

```
Patient View (My Journey):
┌─────────────────────────────────────────────────────┐
│  📅 June 5, 2026                                    │
│  ┌────────────────────────────────────────────────┐ │
│  │ ⭐ 🔴 Critical Alert: Severe Pain              │ │
│  │ Severity: Critical - Pain level 9/10           │ │
│  │ 2:30 PM                                        │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │ 🟠 ESAS Assessment                             │ │
│  │ Assessment completed - Pain: 9, Anxiety: 7     │ │
│  │ 2:25 PM                                        │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │ 🟢 Follow-up Consultation Scheduled            │ │
│  │ At Palliative Care Unit on June 15, 2026      │ │
│  │ 10:15 AM                                       │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

**This visual flow shows exactly how the automatic tracking system works from user action to timeline display!**
