# Quick Start: Patient Monitoring System

**Everything is implemented and ready to test!**

---

## ⚡ Quick Start (2 Steps)

### Step 1: Restart Backend
```bash
cd backend
python -m uvicorn main:app --reload
```

**Look for these messages:**
```
🤖 Starting proactive monitoring system...
🔔 Starting notification monitoring system...
✅ Notification monitoring loop started (every 5 minutes)
```

### Step 2: Test It
1. **Log in as a patient**
2. **Add an appointment for tomorrow**
3. **Wait 5 minutes** (or restart backend)
4. **Check notifications:**
   - Go to browser: `http://localhost:8000/api/notifications`
   - You'll see JSON with your notifications!

---

## ✅ What's Working

### 1. Appointment Monitoring
- **24 hours before:** "Appointment Tomorrow" notification
- **1 hour before:** "Appointment Starting Soon!" notification
- **Caregivers notified** automatically

### 2. Medication Monitoring
- **15 minutes before dose:** "Medication Due Soon" notification
- **30 minutes after missed:** "Missed Medication" alert
- **Caregivers alerted** for missed doses

### 3. Critical Vitals Monitoring
- **O2 sat < 90%:** Immediate alert to clinician
- **Heart rate < 50 or > 120:** Critical alert
- **BP abnormal:** Alert sent
- **Temperature abnormal:** Alert sent
- **Caregivers notified** of critical issues

---

## 🧪 Quick Tests

### Test 1: Appointment Reminder
```
1. Login as clinician
2. Go to Appointments
3. Add appointment for tomorrow
4. Restart backend (to trigger immediately)
5. Visit: http://localhost:8000/api/notifications
6. ✅ See "Appointment Tomorrow" notification
```

### Test 2: Medication Reminder
```
1. Add medication with frequency "Every 4 hours"
2. Wait for monitoring cycle (5 minutes)
3. Check notifications API
4. ✅ See medication reminder (if due time matches)
```

### Test 3: Critical Vitals Alert
```
1. Go to Patient Monitor
2. Log vitals with O2 sat = 85% (below 90%)
3. Wait 5 minutes
4. Check: http://localhost:8000/api/alerts
5. ✅ See critical vitals alert
6. Check notifications for clinician
7. ✅ Clinician has critical notification
```

---

## 📱 Viewing Notifications

### Via API (Current Method):
```
GET http://localhost:8000/api/notifications
GET http://localhost:8000/api/notifications/unread-count
GET http://localhost:8000/api/notifications/stats
```

### Via Frontend (TODO):
- Notification Center component needed in header
- Will show bell icon with unread count
- Dropdown with notifications list
- Click to mark as read

---

## 🔍 Checking if It's Working

### Backend Logs:
```
📅 Created 2 appointment notifications
💊 Created 1 medication alerts  
🚨 Created 1 critical vital alerts
```

### Database Check:
```sql
-- View all notifications
SELECT * FROM notification_queue ORDER BY created_at DESC LIMIT 10;

-- Count unread
SELECT COUNT(*) FROM notification_queue WHERE is_read = FALSE;

-- View critical alerts
SELECT * FROM alerts WHERE severity = 'critical' ORDER BY created_at DESC;
```

---

## ⚙️ Configuration

### Change Monitoring Interval:
**File:** `backend/main.py` (line ~245)
```python
await asyncio.sleep(300)  # Change to 60 for 1 minute, 30 for 30 seconds
```

### Change Medication Timing:
**File:** `backend/services/notification_service.py`
```python
timedelta(minutes=15)  # Reminder time before dose
timedelta(minutes=30)  # Time after which dose is "missed"
```

---

## 🎯 Next: Add Frontend UI

Create **NotificationCenter.jsx** component:
- Bell icon in header
- Badge showing unread count
- Dropdown showing notifications
- Mark as read functionality
- Auto-refresh every 30 seconds

See `MONITORING_SYSTEM_IMPLEMENTATION_COMPLETE.md` for full frontend example code!

---

## ✅ Status

- ✅ Backend service running
- ✅ Monitoring appointments
- ✅ Monitoring medications
- ✅ Monitoring vitals
- ✅ Creating notifications
- ✅ Alerting caregivers
- ✅ Alerting clinicians
- ⏳ Frontend UI (next step)

**The system is LIVE and monitoring patients! Just need UI to display notifications.**
