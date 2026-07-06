# 🚀 HOW TO START & SEE THE INTELLIGENT FEATURES

## STEP 1: Start Backend (IMPORTANT!)

Open **Terminal 1** (Command Prompt or PowerShell):

```cmd
cd c:\xampp\htdocs\ProjectAura_React\backend
python -m uvicorn main:app --reload --port 8000
```

**✅ You should see:**
```
🌅 PROJECT AURA - STARTING UP
✅ Database initialized
✅ Found X users in database
🤖 Starting proactive monitoring system...
✅ Proactive monitoring loop started (every 5 minutes)
🚀 Project Aura API Ready
📚 API Docs: http://localhost:8000/docs
```

**⚠️ If you see errors about imports:**
```cmd
pip install fastapi uvicorn sqlalchemy python-jose passlib anthropic pydantic
```

---

## STEP 2: Start Frontend

Open **Terminal 2** (new terminal):

```cmd
cd c:\xampp\htdocs\ProjectAura_React\frontend
npm run dev
```

**✅ You should see:**
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

---

## STEP 3: See the Intelligent Features

### A. Real-Time Alert Bell Icon

1. **Open browser:** http://localhost:5173
2. **Login as clinician:** `clinician / clinician123`
3. **Look at the header** (top right corner)
4. **You should see:** 🔔 Bell icon
5. **If there are alerts:** Red badge with count

**📍 Location:** Header, next to Logout button

**What it does:**
- Polls every 30 seconds for new alerts
- Shows badge count
- Click to see dropdown with recent alerts
- Toast notifications for critical alerts

---

### B. Intelligent Recommendations

1. **Go to:** Patients page (`/patients`)
2. **Click "View" on any patient**
3. **You should see:** Purple gradient card below patient header
4. **Card shows:**
   - AI-Powered Care Guidance
   - Disease type (e.g., "Personalized for Cancer")
   - Priority badge (CRITICAL/HIGH/MODERATE/LOW)
   - Care Priorities
   - AI recommendations

**📍 Location:** Patient Monitor page, below patient header card

**What it shows:**
- Disease-specific care priorities
- AI-generated action items
- Monitoring schedule
- Clinical recommendations

---

### C. Adaptive Care Guide

1. **From Patient Monitor page**
2. **Look for link or button to Care Guide** (we need to add this!)
3. **Or manually navigate to:** `/care-guide/{patientId}`
   - Example: http://localhost:5173/care-guide/1

**📍 Location:** New page `/care-guide/:patientId`

**What it shows:**
- Disease-specific protocols only
- Cancer patients: WHO Pain Ladder, Fever management
- Heart failure: Fluid management, Breathlessness
- Priority-sorted (Critical first)
- Expandable cards
- Emergency contacts

---

## STEP 4: Test Proactive Monitoring

### A. Trigger Manual Analysis

1. **Go to:** http://localhost:8000/docs (FastAPI Swagger UI)
2. **Find:** `POST /api/intelligent-care/analyze-all`
3. **Click:** "Try it out" → Execute
4. **You should see:**
   ```json
   {
     "patients_analyzed": 8,
     "alerts_generated": 2,
     "timestamp": "2026-06-03T..."
   }
   ```

### B. See Alerts in Real-Time

1. **Keep frontend open** (logged in as clinician)
2. **Watch the bell icon**
3. **Within 30 seconds:** Badge count should update
4. **If critical alert:** Red toast notification appears
5. **Click bell:** Dropdown shows alert details

---

## STEP 5: Test Disease-Specific Intelligence

### Create Test Alert (Cancer Patient)

1. **Go to Patient Monitor** for a cancer patient
2. **Click "Log Vitals"**
3. **Enter temperature:** 38.6°C (above cancer threshold of 38.5°C)
4. **Submit**
5. **Wait 5 minutes** (background task runs)
6. **OR trigger manual analysis** (Step 4A)
7. **Check bell icon:** Should show CRITICAL alert
8. **Alert message:** "Fever detected - infection risk"
9. **Action:** "Check for neutropenic sepsis..."

### Compare to Heart Failure Patient

1. **Go to Patient Monitor** for a heart failure patient
2. **Log vital:** O2 saturation = 89% (below HF threshold of 90%)
3. **Wait 5 minutes or trigger manual analysis**
4. **Alert should be:** HIGH (not CRITICAL)
5. **Message:** Different from cancer alert
6. **Action:** "Assess fluid status; consider diuresis"

**This proves disease-specific intelligence is working!**

---

## TROUBLESHOOTING

### ❌ "Can't see bell icon"

**Check:**
1. Backend is running (`http://localhost:8000/docs` should load)
2. Logged in as `clinician`, `caregiver`, or `admin` (not patient/family)
3. Clear browser cache (Ctrl + Shift + Delete)
4. Refresh page (Ctrl + F5)

**Fix:**
- Open browser console (F12)
- Check for errors
- Look for: `RealTimeAlerts` component
- Verify: `/api/alerts` endpoint responding

---

### ❌ "Can't see recommendations card"

**Check:**
1. On Patient Monitor page (`/patients/{id}`)
2. Scroll down below patient header
3. Look for purple gradient card
4. Should say "AI-Powered Care Guidance"

**Fix:**
- Open browser console (F12)
- Check for errors about `/api/intelligent-care/profile/{id}`
- Verify backend route is registered
- Check: http://localhost:8000/docs - Should see `/api/intelligent-care` endpoints

---

### ❌ "Adaptive care guide shows 404"

**Check:**
1. URL is: `/care-guide/{patientId}` (e.g., `/care-guide/1`)
2. Not: `/care-guide` (without ID)

**Fix:**
- Verify route in `frontend/src/App.jsx`
- Should see: `<Route path="/care-guide/:patientId" element={<AdaptiveCareGuide />} />`
- Restart frontend: Ctrl+C in terminal, then `npm run dev`

---

### ❌ "Background monitoring not running"

**Check:**
1. Backend terminal shows: "✅ Proactive monitoring loop started"
2. Wait 5 minutes after startup
3. Check console for analysis logs

**Fix:**
- Stop backend (Ctrl+C)
- Restart: `python -m uvicorn main:app --reload --port 8000`
- Watch console for startup messages
- Should see proactive monitoring start

---

### ❌ "Import errors in backend"

**Error:**
```
ImportError: cannot import name 'intelligent_care' from 'routers'
```

**Fix:**
```cmd
cd c:\xampp\htdocs\ProjectAura_React\backend\routers
dir
```

**Should see:** `intelligent_care.py`

**If missing:** The file wasn't created properly. Check file exists.

**If exists but still error:**
```python
# Check backend/routers/__init__.py
# Should NOT have: from .intelligent_care import router
# Backend/main.py imports it directly
```

---

## VERIFICATION CHECKLIST

### Backend Running ✅
- [ ] Terminal shows "🚀 Project Aura API Ready"
- [ ] http://localhost:8000/docs loads
- [ ] See `/api/intelligent-care` in endpoint list
- [ ] Console shows "✅ Proactive monitoring loop started"

### Frontend Running ✅
- [ ] Terminal shows "Local: http://localhost:5173/"
- [ ] Browser loads login page
- [ ] Can login successfully
- [ ] Dashboard loads

### Real-Time Alerts ✅
- [ ] Bell icon visible in header (top right)
- [ ] Clicking bell opens dropdown
- [ ] Dropdown says "Active Alerts" or "No active alerts"
- [ ] Badge count shows number (if alerts exist)

### Intelligent Recommendations ✅
- [ ] Patient Monitor page loads
- [ ] Purple card below patient header
- [ ] Card says "AI-Powered Care Guidance"
- [ ] Shows disease type
- [ ] Shows priority badge
- [ ] Shows recommendations or "All parameters within target"

### Adaptive Care Guide ✅
- [ ] Navigate to `/care-guide/1` (or any patient ID)
- [ ] Page loads (not 404)
- [ ] Shows disease-matched protocols
- [ ] Cards are expandable
- [ ] Emergency contacts visible
- [ ] Content is disease-specific

### Proactive Monitoring ✅
- [ ] Backend console shows monitoring loop started
- [ ] Manual trigger works (`POST /api/intelligent-care/analyze-all`)
- [ ] Alerts generated when thresholds exceeded
- [ ] Alerts appear in bell dropdown within 30 seconds
- [ ] Different diseases have different alert thresholds

---

## QUICK DEMO SCRIPT

### 1. Show Proactive Monitoring (2 min)
```
1. Show backend terminal: "Proactive monitoring loop started"
2. Go to Swagger: http://localhost:8000/docs
3. POST /api/intelligent-care/analyze-all
4. Show response: X patients analyzed, Y alerts generated
5. Frontend: Watch bell icon update within 30 seconds
```

### 2. Show Real-Time Alerts (1 min)
```
1. Click bell icon
2. Show dropdown with alerts
3. Click an alert
4. Navigate to patient page
5. Show recommendations appear
```

### 3. Show Disease Intelligence (2 min)
```
1. Patient Monitor: Cancer patient
2. Show intelligent recommendations card
3. Navigate to /care-guide/1
4. Show cancer-specific protocols (WHO Pain Ladder, Fever)
5. Compare to heart failure patient: Different content
```

### 4. Show Personalization (1 min)
```
1. Show questionnaire data collected
2. Show care priorities in recommendations
3. Explain: Content adapts to preferences
```

**Total Demo Time: 6 minutes**

---

## WHAT IF NOTHING SHOWS UP?

### Nuclear Option: Fresh Start

```cmd
# Stop both terminals (Ctrl+C)

# Terminal 1: Backend
cd c:\xampp\htdocs\ProjectAura_React\backend
python -m uvicorn main:app --reload --port 8000

# Wait for: "Proactive monitoring loop started"

# Terminal 2: Frontend  
cd c:\xampp\htdocs\ProjectAura_React\frontend
npm run dev

# Wait for: "Local: http://localhost:5173/"

# Browser: Clear cache (Ctrl + Shift + Delete)
# Go to: http://localhost:5173
# Login: clinician / clinician123
# Look for bell icon in header
```

---

## FILES LOCATION (for verification)

### Backend Files:
```
c:\xampp\htdocs\ProjectAura_React\backend\routers\intelligent_care.py  ← 500+ lines
c:\xampp\htdocs\ProjectAura_React\backend\main.py  ← Has monitoring loop
```

### Frontend Files:
```
c:\xampp\htdocs\ProjectAura_React\frontend\src\components\RealTimeAlerts.jsx
c:\xampp\htdocs\ProjectAura_React\frontend\src\components\IntelligentRecommendations.jsx
c:\xampp\htdocs\ProjectAura_React\frontend\src\pages\AdaptiveCareGuide.jsx
c:\xampp\htdocs\ProjectAura_React\frontend\src\components\layout\Layout.jsx  ← Has RealTimeAlerts
c:\xampp\htdocs\ProjectAura_React\frontend\src\pages\PatientMonitor.jsx  ← Has IntelligentRecommendations
c:\xampp\htdocs\ProjectAura_React\frontend\src\App.jsx  ← Has route for AdaptiveCareGuide
```

### Check Files Exist:
```cmd
dir c:\xampp\htdocs\ProjectAura_React\backend\routers\intelligent_care.py
dir c:\xampp\htdocs\ProjectAura_React\frontend\src\components\RealTimeAlerts.jsx
dir c:\xampp\htdocs\ProjectAura_React\frontend\src\components\IntelligentRecommendations.jsx
dir c:\xampp\htdocs\ProjectAura_React\frontend\src\pages\AdaptiveCareGuide.jsx
```

---

## STILL CAN'T SEE THEM?

**Tell me:**
1. ✅ Is backend running? (shows "Proactive monitoring loop started")
2. ✅ Is frontend running? (loads in browser)
3. ✅ Can you login successfully?
4. ✅ What role are you logged in as? (clinician/caregiver/admin/patient)
5. ❌ Where exactly do you expect to see features but don't?
6. ❌ Any errors in browser console (F12)?
7. ❌ Any errors in backend terminal?

**I'll help you debug specifically!**

---

*Created: June 3, 2026*  
*Purpose: Help you SEE and USE the intelligent features*  
*Status: Step-by-step guide to verify everything works*
