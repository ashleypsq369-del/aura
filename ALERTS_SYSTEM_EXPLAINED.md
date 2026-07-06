# 🔔 Alerts & Notifications System - How It Works

## Overview
ProjectAura has a comprehensive alert and notification system to notify healthcare workers about patient status changes. Here's how it works and why it might not be showing alerts:

---

## 🏗️ System Architecture

### 1. **Alert Creation (Backend)**
Alerts are created automatically when clinical assessments detect concerning values.

**Location**: `backend/routers/clinical_assessments.py`

**Example** (from ESAS assessment):
```python
if data.pain >= 8:
    create_assessment_alert(
        db, data.patient_id, "severe_pain", "critical",
        f"Severe pain detected: {data.pain}/10", str(data.pain)
    )
```

**Alert Table** (`backend/src/db.py`, line 214):
```python
class Alert(Base):
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'))
    alert_type = Column(String(50))          # "severe_pain", "high_fall_risk", etc.
    severity = Column(String(20))            # "critical", "high", "medium", "low"
    message = Column(Text)                   # Human-readable message
    triggered_value = Column(String(100))    # The value that triggered the alert
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, ForeignKey('users.id'))
    acknowledged_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
```

---

### 2. **Alert Display (Frontend)**

There are **3 components** that show alerts:

#### A. **RealTimeAlerts** (Bell icon in top header)
**Location**: `frontend/src/components/RealTimeAlerts.jsx`
**Where**: Top right of every page (inside Layout header)
**Who sees it**: Admins, Clinicians, Caregivers only

**Features**:
- Red badge with unread count
- Polls every 30 seconds for new alerts
- Shows dropdown with 5 most recent active alerts
- Shows toast notifications for critical alerts
- Click alert to go to patient page

#### B. **Alerts Page** (Full alert management)
**Location**: `frontend/src/pages/Alerts.jsx`
**Route**: `/alerts`
**Who sees it**: All users (filtered by role)

**Features**:
- Full list of all alerts
- Filter by severity (critical, high, medium, low)
- Filter by status (active, acknowledged)
- Search functionality
- Acknowledge or dismiss alerts
- Shows stats cards (critical count, high priority, etc.)

#### C. **NotificationBell** (Alternative component - NOT CURRENTLY USED)
**Location**: `frontend/src/components/NotificationBell.jsx`
**Status**: Built but not imported in Layout
**Note**: This is a backup/alternative component

---

## 🔍 Why Alerts Might Not Be Working

### Issue 1: Missing `patient_name` field ❌

**Problem**: Frontend expects `patient_name` but backend doesn't return it.

**Frontend expects** (`Alerts.jsx`, line 56):
```jsx
alert.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())
```

**Backend returns** (`alerts.py`, line 13):
```python
class AlertResponse(BaseModel):
    id: int
    patient_id: int
    alert_type: str
    severity: str
    message: str
    created_at: datetime
    is_acknowledged: bool
    # ❌ NO patient_name field!
```

**Frontend also expects** (`RealTimeAlerts.jsx`, line 159):
```jsx
{alert.patient_name}  // ❌ Undefined
```

---

### Issue 2: Field Name Mismatch ❌

**Frontend RealTimeAlerts expects** (line 54):
```jsx
alert.type           // ❌ Wrong field name
alert.triggered_at   // ❌ Wrong field name
```

**Backend returns**:
```python
alert_type          # ✅ Correct field name
created_at          # ✅ Correct field name
```

---

### Issue 3: Query Parameter Mismatch ❌

**RealTimeAlerts component** (line 16):
```jsx
apiClient.get('/api/alerts?acknowledged=false')
```

**Backend expects** (`alerts.py`, line 20):
```python
async def get_alerts(
    patient_id: int = None,    # ✅ Supported
    severity: str = None,      # ✅ Supported
    # ❌ Does NOT support "acknowledged" parameter
```

---

## ✅ THE FIX

I need to update **3 files**:

### 1. Backend: Add patient_name to AlertResponse
```python
# backend/routers/alerts.py
class AlertResponse(BaseModel):
    id: int
    patient_id: int
    patient_name: Optional[str] = None  # ✅ ADD THIS
    alert_type: str
    severity: str
    message: str
    triggered_value: Optional[str] = None
    created_at: datetime
    is_acknowledged: bool
    acknowledged_at: Optional[datetime] = None
```

### 2. Backend: Join with Patient table to get patient_name
```python
@router.get("", response_model=List[AlertResponse])
async def get_alerts(...):
    # Join with Patient to get patient_name
    alerts = db.query(Alert, Patient.full_name).join(
        Patient, Alert.patient_id == Patient.id
    ).filter(Alert.is_acknowledged == False)
    
    # Return with patient_name
    return [
        {
            **alert.__dict__,
            "patient_name": patient_name
        }
        for alert, patient_name in alerts
    ]
```

### 3. Frontend: Fix field names in RealTimeAlerts
```jsx
// Change alert.type → alert.alert_type
// Change alert.triggered_at → alert.created_at
```

---

## 🧪 HOW TO TEST IF ALERTS ARE WORKING

### Test 1: Create an Alert Manually

Run this in backend Python console or create a test endpoint:
```python
from backend.src.db import Alert, get_db
from datetime import datetime

db = next(get_db())

# Create a test alert
alert = Alert(
    patient_id=1,  # Use an existing patient ID
    alert_type="test_alert",
    severity="high",
    message="This is a test alert",
    triggered_value="123",
    is_acknowledged=False,
    created_at=datetime.utcnow()
)

db.add(alert)
db.commit()

print(f"Created alert ID: {alert.id}")
```

### Test 2: Complete an Assessment with Critical Values

**Option A: Complete ESAS with severe pain**
1. Go to any patient
2. Click "Clinical Assessments"
3. Complete ESAS form
4. Set Pain = 10 (or 8+)
5. Submit
6. Check if alert appears in bell icon or `/alerts` page

**Option B: Complete Caregiver Burden with high score**
1. Complete Zarit form
2. Answer most questions with "Frequently" (3) or "Nearly Always" (4)
3. Get total score > 20
4. Submit
5. Check for urgent caregiver burden alert

### Test 3: Check Backend Directly

**Check if alerts exist in database:**
```bash
# Terminal
cd backend
python

# In Python
from src.db import get_db, Alert
db = next(get_db())
alerts = db.query(Alert).filter(Alert.is_acknowledged == False).all()
for alert in alerts:
    print(f"ID: {alert.id}, Type: {alert.alert_type}, Severity: {alert.severity}, Message: {alert.message}")
```

**Check API endpoint:**
```bash
# Get your auth token from localStorage
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/alerts
```

---

## 🔧 QUICK DEBUG CHECKLIST

If alerts aren't showing:

1. ✅ **Backend Running?** 
   - Check terminal: Backend should be on port 8000
   - Test: `http://localhost:8000/docs` should show API docs

2. ✅ **Alerts in Database?**
   - Run query above to check alerts table
   - Should have `is_acknowledged = False` rows

3. ✅ **API Endpoint Working?**
   - Test in browser: `http://localhost:8000/api/alerts` (might give auth error, that's OK)
   - Check backend terminal for errors

4. ✅ **Frontend Making Requests?**
   - Open DevTools (F12) → Network tab
   - Look for requests to `/api/alerts`
   - Check response data

5. ✅ **Authentication Working?**
   - Check localStorage has `auth_token`
   - Try logout → login again

6. ✅ **User Role Correct?**
   - Only admin, clinician, caregiver see RealTimeAlerts
   - Patients and family don't see bell icon

---

## 🎯 EXPECTED BEHAVIOR

### When Alerts Are Working Correctly:

**After completing assessment with critical values:**
1. ✅ Backend creates Alert record in database
2. ✅ Toast notification says "X alert(s) generated"
3. ✅ Bell icon in header shows red badge with count
4. ✅ Click bell → see alert in dropdown
5. ✅ Click "View All Alerts" → go to full alerts page
6. ✅ Can acknowledge or dismiss alerts
7. ✅ Critical alerts trigger red toast popup automatically
8. ✅ Badge count updates every 30 seconds

**Alert Polling:**
- Every 30 seconds, RealTimeAlerts checks for new alerts
- If new critical alert appears, shows toast notification
- Badge count updates automatically
- No page refresh needed

---

## 🚨 ALERT TYPES GENERATED

All assessment forms generate these alerts:

| Assessment | Alert Types |
|------------|------------|
| ESAS | severe_pain (≥8), high_pain (≥7), severe_depression (≥8), severe_anxiety (≥8), critical_wellbeing (≤2), severe_dyspnea (≥8) |
| PPS | critical_pps (≤30%), low_pps (≤50%), rapid_decline (20% drop) |
| PHQ-9 | suicide_risk_CRISIS (Q9>0), severe_depression (≥20), moderately_severe_depression (≥15) |
| GAD-7 | severe_anxiety (≥15), moderate_anxiety (≥10) |
| Barthel | severe_dependence (<20), moderate_dependence (<40), functional_decline (20 point drop) |
| Cognitive | severe_cognitive_impairment (MMSE<10 or MoCA<10), moderate_impairment |
| Pain | uncontrolled_pain, high_interference, inadequate_medication |
| QOL | low_quality_of_life (<50), poor_physical_wellbeing (<10), poor_emotional_wellbeing (<8) |
| Caregiver | high_caregiver_burden (>20), moderate_caregiver_burden (≥10), support_needs_requested |
| Motor | high_fall_risk (TUG>14s), moderate_fall_risk (TUG>12s), poor_exercise_tolerance (<300m), oxygen_desaturation (>4%), poor_balance (<3) |

---

## 📞 TROUBLESHOOTING STEPS

### Step 1: Verify Backend Alert Creation

Add this temporary logging to `backend/routers/clinical_assessments.py`:

```python
def create_assessment_alert(db: Session, patient_id: int, alert_type: str, 
                           severity: str, message: str, value: str = ""):
    alert = Alert(...)
    db.add(alert)
    print(f"🚨 ALERT CREATED: {alert_type} - {message}")  # ADD THIS
    return alert
```

Now when you complete an assessment with critical values, you should see console output.

### Step 2: Check Frontend Console

Open DevTools (F12) → Console tab. Look for:
- Network errors (red text)
- "401 Unauthorized" (means auth token expired)
- CORS errors (backend/frontend port mismatch)

### Step 3: Verify Token

In DevTools Console, run:
```javascript
console.log(localStorage.getItem('auth_token'))
```
Should print a long token string. If null, you need to login again.

---

## 🎬 I WILL NOW FIX THE ISSUES

Let me update the backend and frontend files to fix these issues...
