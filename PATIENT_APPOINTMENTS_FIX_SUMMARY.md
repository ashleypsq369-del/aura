# Patient Appointments & Monitor - Summary

**Date:** June 5, 2026

---

## ✅ COMPLETED: Patients Can Now Add Appointments

### What Was Fixed:

1. **Auto-select Patient ID** - Patients and family members automatically see their own appointments
2. **Fixed API Field Mapping** - Changed `appointment_date` → `scheduled_at` to match backend
3. **Hide Patient Selector** - Patients/family don't need to select from dropdown
4. **Added AuthContext** - Using user role to determine permissions

### Changes Made:
- ✅ `frontend/src/pages/Appointments.jsx`
  - Added `useAuth()` hook
  - Auto-select patient ID on mount for patients/family
  - Hide patient selector for non-clinician roles
  - Fixed field mapping (`scheduled_at`, `location_detail`)

### Result:
**Patients can now add their own appointments!** 🎉

---

## 🔄 TODO: PatientMonitor Alerting System

### Current State:
PatientMonitor currently only **displays** data. It shows:
- Vitals charts
- Symptoms log
- Medications list
- Appointments list
- Care plan

### Requested Features:

#### 1. **Appointment Monitoring** 📅
- Check for upcoming appointments (24 hours, 1 hour before)
- Send notifications to patients
- Alert caregivers/clinicians if patient might miss appointment

#### 2. **Medication Monitoring** 💊
- Track medication schedule
- Alert when dose is due
- Alert when dose is missed
- Notify caregivers if patient misses medications

#### 3. **Alert System** 🚨
- Send alerts to clinicians about:
  - Critical vitals
  - Severe symptoms
  - Missed medications
  - Declined health status
- Send alerts to caregivers about:
  - Patient needs assistance
  - Missed appointments
  - Medication reminders

---

## 📋 Implementation Plan

### Phase 1: Backend Alert System

#### A. Create Notification Service
**File:** `backend/services/notification_service.py`

Functions needed:
```python
def check_upcoming_appointments(db):
    """Check for appointments in next 24h and 1h"""
    # Find appointments due soon
    # Create notifications for patient
    # Create alerts for caregiver if no confirmation
    
def check_medication_schedule(db):
    """Check if medications are due or missed"""
    # Find medications due now
    # Find missed medications
    # Create alerts for patient and caregiver
    
def check_critical_vitals(db):
    """Monitor patient vitals for critical values"""
    # Check latest vitals
    # If critical, alert clinician immediately
    # Alert caregiver if configured
    
def send_alert_to_role(db, patient_id, alert_type, message, role):
    """Send alert to specific role (clinician, caregiver, patient)"""
    # Create notification in database
    # Send push notification (if configured)
    # Send email (if configured)
```

#### B. Create Scheduled Background Task
**File:** `backend/main.py` (add to existing scheduler)

```python
@repeat_every(seconds=300, wait_first=True)  # Every 5 minutes
async def monitor_patient_alerts():
    """Background task to monitor patients and send alerts"""
    db = SessionLocal()
    try:
        check_upcoming_appointments(db)
        check_medication_schedule(db)
        check_critical_vitals(db)
    finally:
        db.close()
```

#### C. Create Medication Tracking Table
**File:** `backend/src/db.py`

```python
class MedicationLog(Base):
    """Track when medications are taken or missed"""
    __tablename__ = "medication_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id"))
    patient_id = Column(Integer, ForeignKey("patients.id"))
    scheduled_time = Column(DateTime)
    taken_time = Column(DateTime, nullable=True)
    status = Column(String)  # 'pending', 'taken', 'missed', 'skipped'
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Phase 2: Frontend Notification Display

#### A. Create Notification Center Component
**File:** `frontend/src/components/NotificationCenter.jsx`

- Bell icon in header showing unread count
- Dropdown showing recent notifications
- Categories: Appointments, Medications, Alerts
- Mark as read functionality
- Link to relevant page (e.g., click appointment notification → go to appointments)

#### B. Update Layout Component
**File:** `frontend/src/components/layout/Layout.jsx`

- Add NotificationCenter to header
- Poll for new notifications every 30 seconds
- Show toast for critical alerts

#### C. Add Medication Tracker to PatientMonitor
**File:** `frontend/src/pages/PatientMonitor.jsx`

New tab: "Medication Schedule"
- Show today's medication schedule
- Mark medication as taken
- Show missed medications in red
- Send notification for upcoming doses

---

## 🎯 Example User Flows

### Flow 1: Upcoming Appointment Alert

1. **T-24 hours before appointment:**
   - System checks for appointments tomorrow
   - Creates notification: "Reminder: Follow-up appointment tomorrow at 2:00 PM"
   - Patient sees notification
   - Caregiver receives alert

2. **T-1 hour before appointment:**
   - System checks for appointments in 1 hour
   - Creates notification: "Appointment starting soon! Follow-up at 2:00 PM"
   - If patient hasn't acknowledged, alert caregiver

3. **T-0 (appointment time passed, not marked complete):**
   - System checks if appointment was attended
   - If no-show, alert clinician and caregiver
   - Journey event: "Appointment Missed"

### Flow 2: Medication Reminder

1. **T-15 minutes before dose:**
   - System checks medication schedule
   - Creates notification: "Medication due in 15 minutes: Morphine 10mg"
   - Patient receives alert

2. **T-0 (dose time):**
   - Notification: "Time to take: Morphine 10mg"
   - Patient marks as "Taken"
   - System logs medication_log entry

3. **T+30 minutes (if not taken):**
   - Medication marked as "Missed"
   - Alert caregiver: "Patient missed Morphine dose at 2:00 PM"
   - Alert clinician if critical medication

### Flow 3: Critical Vitals Alert

1. **Vitals logged with critical values:**
   - Clinician/patient logs vitals
   - System detects O2 sat < 90%
   - IMMEDIATE alert to clinician: "🚨 CRITICAL: Patient O2 sat 87%"
   - Alert caregiver: "Patient needs immediate attention"
   - Journey event: "Critical Alert: Severe Hypoxemia"

---

## 🚀 Quick Implementation (Minimal Version)

### Just Upcoming Appointments:

**Add to `backend/main.py`:**
```python
@repeat_every(seconds=3600)  # Every hour
async def check_appointment_reminders():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        tomorrow = now + timedelta(hours=24)
        
        # Find appointments in next 24 hours
        appointments = db.query(Appointment).filter(
            Appointment.scheduled_at >= now,
            Appointment.scheduled_at <= tomorrow,
            Appointment.status == 'scheduled'
        ).all()
        
        for appt in appointments:
            # Create notification
            notification = Notification(
                user_id=appt.patient_id,
                message=f"Reminder: {appt.appointment_type} appointment tomorrow",
                type="appointment_reminder",
                is_read=False
            )
            db.add(notification)
        
        db.commit()
    finally:
        db.close()
```

---

## 📂 Files to Create/Modify

### Backend:
- [ ] `backend/services/notification_service.py` (NEW)
- [ ] `backend/src/db.py` (add MedicationLog table)
- [ ] `backend/routers/notifications.py` (add alert endpoints)
- [ ] `backend/main.py` (add monitoring background tasks)

### Frontend:
- [ ] `frontend/src/components/NotificationCenter.jsx` (NEW)
- [ ] `frontend/src/components/layout/Layout.jsx` (add notification center)
- [ ] `frontend/src/pages/PatientMonitor.jsx` (add medication schedule tab)
- [ ] `frontend/src/pages/Appointments.jsx` (✅ ALREADY FIXED)

---

## ✅ Current Status

**Completed:**
- ✅ Patients can add appointments
- ✅ Journey tracking for appointments
- ✅ Journey tracking for medications
- ✅ Journey tracking for critical alerts

**Next Steps:**
1. Decide which monitoring features to implement first
2. Create notification service
3. Add background monitoring tasks
4. Create notification center UI
5. Test alert flows

---

**The appointments issue is FIXED. PatientMonitor alerting system is ready to be built based on your priorities!**
