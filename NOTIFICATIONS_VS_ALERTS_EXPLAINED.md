# 🔔 Notifications vs Alerts - Complete System Design

## 🎯 The Difference

### 🚨 **ALERTS** (Already Working)
**Purpose**: Medical emergencies and critical clinical events  
**Severity**: Critical, High, Medium, Low  
**Examples**:
- Severe pain detected (≥8/10)
- Suicide risk identified
- High fall risk (TUG >14s)
- Critical PPS score (≤30%)
- Oxygen desaturation

**Who sees**: Clinical staff (admins, clinicians, caregivers)  
**UI**: Red bell icon with badge in header  
**Table**: `alerts` table  
**Response needed**: IMMEDIATE clinical action  

---

### 📬 **NOTIFICATIONS** (NOT YET IMPLEMENTED) ❌
**Purpose**: Routine events, reminders, and system updates  
**Priority**: High, Medium, Low  
**Examples**:
- 💊 Medication due in 30 minutes
- 📅 Appointment reminder (tomorrow at 2pm)
- 💬 New message from Dr. Smith
- 👥 Community group meeting today
- 📝 Care plan updated
- 🎂 Patient birthday today
- 📊 Weekly report available
- ✅ Assessment completed

**Who sees**: ALL users (patients, family, caregivers, staff)  
**UI**: Inbox icon with badge (separate from alerts)  
**Table**: `notification_queue` table (EXISTS but not used)  
**Response needed**: Informational, no immediate action

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     TWO SEPARATE SYSTEMS                         │
└─────────────────────────────────────────────────────────────────┘

ALERTS (Medical Emergencies)              NOTIFICATIONS (Routine Events)
━━━━━━━━━━━━━━━━━━━━━━━━━━              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Icon: 🔔 Bell (Red)                       Icon: 📬 Inbox (Blue)
Badge: Red, pulsing                       Badge: Blue, static
Table: alerts                             Table: notification_queue
Router: /api/alerts                       Router: /api/notifications (TO BUILD)
Component: RealTimeAlerts.jsx             Component: NotificationCenter.jsx (TO BUILD)
Page: /alerts                             Page: /notifications (TO BUILD)

Triggered by:                             Triggered by:
├─ Assessment thresholds                  ├─ Scheduled events (cron jobs)
├─ Vital sign anomalies                   ├─ User actions (messages, updates)
├─ Rapid decline                          ├─ Time-based reminders
└─ Clinical risk factors                  └─ System events (reports ready)

Examples:                                 Examples:
├─ "Severe pain: 10/10" [CRITICAL]        ├─ "Medication due in 30 min" [HIGH]
├─ "Fall risk detected" [HIGH]            ├─ "Appointment tomorrow at 2pm" [MEDIUM]
├─ "Caregiver burnout" [HIGH]             ├─ "New message from doctor" [HIGH]
└─ "Low QOL score" [HIGH]                 └─ "Care plan updated" [LOW]

Cleared by:                               Cleared by:
└─ Acknowledge/Dismiss                    └─ Mark as read
```

---

## 🗃️ Database Schema

### Existing: `notification_queue` table ✅

```sql
CREATE TABLE notification_queue (
    id INTEGER PRIMARY KEY,
    recipient_id INTEGER,          -- User who receives notification
    notification_type VARCHAR(30),  -- Type of notification
    title VARCHAR(200),            -- Short title
    body TEXT,                     -- Detailed message
    related_alert_id INTEGER,      -- Link to alert if applicable
    is_sent BOOLEAN DEFAULT FALSE, -- Was it delivered?
    sent_at DATETIME,              -- When delivered
    is_read BOOLEAN DEFAULT FALSE, -- Did user read it?
    read_at DATETIME,              -- When read
    created_at DATETIME,           -- When created
    
    FOREIGN KEY (recipient_id) REFERENCES users(id),
    FOREIGN KEY (related_alert_id) REFERENCES alerts(id)
);
```

---

## 📋 Notification Types to Implement

### 1. **Medication Reminders** 💊
**Trigger**: 30 minutes before scheduled medication time  
**Example**:
```
Title: "Medication Due Soon"
Body: "Morphine 10mg due at 2:00 PM (in 30 minutes)"
Type: "medication_reminder"
Priority: HIGH
```

### 2. **Appointment Reminders** 📅
**Trigger**: 24 hours before appointment  
**Example**:
```
Title: "Appointment Tomorrow"
Body: "You have an appointment with Dr. Mensah tomorrow at 2:00 PM"
Type: "appointment_reminder"
Priority: MEDIUM
```

### 3. **New Messages** 💬
**Trigger**: When message received  
**Example**:
```
Title: "New Message from Dr. Smith"
Body: "I've reviewed your recent vitals..."
Type: "new_message"
Priority: HIGH
```

### 4. **Community Group Events** 👥
**Trigger**: Day of group meeting  
**Example**:
```
Title: "Support Group Today"
Body: "Caregiver support group starts at 4:00 PM"
Type: "community_event"
Priority: MEDIUM
```

### 5. **Care Plan Updates** 📝
**Trigger**: When care plan modified  
**Example**:
```
Title: "Care Plan Updated"
Body: "Your care team has updated your care plan"
Type: "care_plan_update"
Priority: LOW
```

### 6. **Assessment Reminders** 📊
**Trigger**: Scheduled assessment due  
**Example**:
```
Title: "Weekly Assessment Due"
Body: "Time for your weekly ESAS symptom assessment"
Type: "assessment_reminder"
Priority: MEDIUM
```

### 7. **Report Available** 📄
**Trigger**: Weekly/monthly report generated  
**Example**:
```
Title: "Weekly Report Ready"
Body: "Your weekly symptom summary is now available"
Type: "report_available"
Priority: LOW
```

### 8. **Birthday/Special Days** 🎂
**Trigger**: Patient birthday or anniversary  
**Example**:
```
Title: "Patient Birthday"
Body: "Today is John Doe's birthday!"
Type: "special_day"
Priority: LOW
```

---

## 🎨 UI Design

### Header Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  Project Aura              [Search...]     📬 3  🔔 2  [Profile] │
│                                             ↑    ↑                │
│                                         Notifs Alerts            │
└─────────────────────────────────────────────────────────────────┘
```

### Notification Center Dropdown
```
┌────────────────────────────────────────────────────────────┐
│  📬 Notifications                                    [X]   │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 💊 HIGH - Just now                                   │ │
│  │ Medication Due Soon                                  │ │
│  │ Morphine 10mg due at 2:00 PM (in 25 minutes)       │ │
│  │                                         [Mark Read] │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ 💬 HIGH - 5m ago                                     │ │
│  │ New Message from Dr. Smith                           │ │
│  │ I've reviewed your recent vitals...                  │ │
│  │                                         [View] [✓]  │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ 📅 MEDIUM - 1h ago                                   │ │
│  │ Appointment Tomorrow                                 │ │
│  │ Dr. Mensah - Tomorrow at 2:00 PM                     │ │
│  │                                         [✓]         │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  View All Notifications →                                 │
└────────────────────────────────────────────────────────────┘
```

### Full Notifications Page
```
┌────────────────────────────────────────────────────────────┐
│  Notifications                     [Filters ▼]  [Search]   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Unread (3)                       [Mark All Read]     │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ 💊 Medication Due Soon - 5m ago            [HIGH]    │ │
│  │ Morphine 10mg due at 2:00 PM                         │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ 💬 New Message - 15m ago                   [HIGH]    │ │
│  │ From Dr. Smith: "I've reviewed..."                   │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ 📅 Appointment Reminder - 2h ago          [MEDIUM]   │ │
│  │ Tomorrow at 2:00 PM with Dr. Mensah                  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Read (8)                          [Clear All ▼]      │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ ✅ Care Plan Updated - Yesterday              [LOW]  │ │
│  │ ✅ Weekly Report Ready - 2 days ago          [LOW]  │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Needed

### Backend Files to Create:

1. **`backend/routers/notifications.py`** (NEW)
   ```python
   # Endpoints:
   # GET /api/notifications - Get all notifications for user
   # GET /api/notifications/unread-count - Badge count
   # PUT /api/notifications/{id}/read - Mark as read
   # PUT /api/notifications/mark-all-read - Mark all as read
   # DELETE /api/notifications/{id} - Delete notification
   # POST /api/notifications/create - Create notification (internal)
   ```

2. **`backend/services/notification_service.py`** (NEW)
   ```python
   # Functions:
   # create_medication_reminder()
   # create_appointment_reminder()
   # create_message_notification()
   # create_care_plan_notification()
   # create_assessment_reminder()
   # send_notification_batch()
   ```

3. **`backend/tasks/scheduled_notifications.py`** (NEW)
   ```python
   # Cron jobs:
   # check_upcoming_medications() - Run every 30 min
   # check_upcoming_appointments() - Run every hour
   # check_assessment_due() - Run daily
   # check_birthdays() - Run daily at midnight
   ```

4. **Update `backend/main.py`**
   ```python
   # Add router:
   from routers import notifications
   app.include_router(notifications.router, prefix="/api")
   ```

### Frontend Files to Create:

1. **`frontend/src/components/NotificationCenter.jsx`** (NEW)
   - Bell icon (different color from alerts)
   - Badge with unread count
   - Dropdown with recent notifications
   - Poll every 60 seconds

2. **`frontend/src/pages/Notifications.jsx`** (NEW)
   - Full page view
   - Filter by type/priority
   - Search functionality
   - Mark as read/unread
   - Delete notifications

3. **Update `frontend/src/components/layout/Layout.jsx`**
   ```jsx
   // Add NotificationCenter next to RealTimeAlerts
   <NotificationCenter />
   <RealTimeAlerts />
   ```

4. **Update `frontend/src/App.jsx`**
   ```jsx
   // Add route:
   <Route path="/notifications" element={<Notifications />} />
   ```

---

## 🎯 Priority Implementation Order

### Phase 1: Basic Infrastructure (2-3 hours)
1. ✅ Create notifications router (`backend/routers/notifications.py`)
2. ✅ Create notification service (`backend/services/notification_service.py`)
3. ✅ Create NotificationCenter component
4. ✅ Create Notifications page
5. ✅ Add routes and integrate

### Phase 2: Medication Reminders (1 hour)
1. ✅ Create scheduled task to check upcoming medications
2. ✅ Generate notifications 30 minutes before
3. ✅ Link to medication details

### Phase 3: Appointment Reminders (1 hour)
1. ✅ Create scheduled task to check upcoming appointments
2. ✅ Generate notifications 24 hours before
3. ✅ Link to appointment details

### Phase 4: Message Notifications (30 minutes)
1. ✅ Update messaging router to create notification on new message
2. ✅ Link to message thread

### Phase 5: Other Notifications (1-2 hours)
1. ✅ Care plan updates
2. ✅ Assessment reminders
3. ✅ Community events
4. ✅ Reports available
5. ✅ Special days (birthdays)

**Total Estimated Time**: 6-8 hours

---

## 🧪 Testing Scenarios

### Test 1: Medication Reminder
1. Create medication schedule for patient
2. Set time 30 minutes in future
3. Wait for notification (or run cron manually)
4. Check notification appears in inbox
5. Click to view medication details

### Test 2: Appointment Reminder
1. Create appointment for tomorrow
2. Run daily check (or wait)
3. Notification should appear
4. Click to view appointment

### Test 3: New Message
1. Send message to user
2. Notification should appear immediately
3. Badge count increases
4. Click to open message thread

### Test 4: Mark as Read
1. Click notification
2. Badge count decreases
3. Notification moves to "Read" section
4. Can still view in history

---

## 🎨 Visual Distinction

| Feature | Alerts 🔔 | Notifications 📬 |
|---------|-----------|------------------|
| Icon Color | Red | Blue |
| Badge Color | Red, pulsing | Blue, static |
| Severity | Critical/High/Medium/Low | High/Medium/Low |
| Sound | Optional alarm | Optional chime |
| Auto-popup | Critical only | Never |
| Polling | Every 30 seconds | Every 60 seconds |
| Cleared by | Acknowledge | Mark as read |
| Persistence | Until acknowledged | Until deleted |
| Who sees | Clinical staff only | All users |

---

## 📊 Example Data Flow

### Medication Reminder Flow:
```
Time: 1:30 PM
┌──────────────────────────┐
│ Scheduled Job runs       │
│ (every 30 minutes)       │
└────────────┬─────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ Check medication_schedule table        │
│ Find: Morphine due at 2:00 PM          │
│ Time until due: 30 minutes             │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ Create Notification:                   │
│ {                                      │
│   recipient_id: 123,                   │
│   type: "medication_reminder",         │
│   title: "Medication Due Soon",        │
│   body: "Morphine 10mg at 2:00 PM",   │
│   priority: "high",                    │
│   created_at: now()                    │
│ }                                      │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ Save to notification_queue table       │
│ is_read = False                        │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ Frontend polls (next 60s cycle)        │
│ GET /api/notifications/unread-count    │
│ Returns: { count: 1 }                  │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ Badge appears: 📬 [1]                  │
│ User clicks inbox icon                 │
│ Sees: "Medication Due Soon"            │
└────────────────────────────────────────┘
```

---

## ✅ Success Criteria

Notifications system is working when:
- [ ] Inbox icon visible next to alerts bell
- [ ] Badge shows unread count
- [ ] Clicking opens dropdown with recent notifications
- [ ] Can mark notifications as read
- [ ] Badge count decreases when marked read
- [ ] Full notifications page accessible at `/notifications`
- [ ] Medication reminders generate automatically
- [ ] Appointment reminders generate 24h before
- [ ] New message creates notification immediately
- [ ] Can filter and search notifications
- [ ] Can delete old notifications
- [ ] System distinguishes alerts from notifications

---

## 🚀 Ready to Implement?

I can now build this complete notifications system! It will be separate from alerts and provide all the routine reminders and updates users need.

Would you like me to:
1. Build the complete notifications system now?
2. Start with Phase 1 (basic infrastructure)?
3. Focus on specific notification types first (like medications)?

Let me know and I'll implement it! 🎉
