# 🚀 Phase 3 Quick Start Guide

## What Was Completed

Phase 3 added the final 3 clinical assessment tools to complete the full suite of 10 validated instruments:

1. **Quality of Life (FACT-G)** - 27-question wellbeing assessment (0-108 score)
2. **Caregiver Burden (Zarit)** - 12-question burden assessment (0-48 score)
3. **Motor Skills** - Physical function tests (TUG, 6MWT, grip strength, balance)

---

## 🎯 How to Test the New Features

### Step 1: Start Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```
Backend runs on: http://localhost:8000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5173

---

### Step 2: Login
- URL: http://localhost:5173
- Email: `nurse@projectaura.com`
- Password: `nurse123`

---

### Step 3: Access Clinical Assessments

1. Go to **Patients** page (sidebar)
2. Click on any patient
3. Click the **purple "Clinical Assessments"** button
4. You'll see the Assessment Dashboard with **10 cards**

---

### Step 4: Test Quality of Life Form

1. Click on **"FACT-G - Quality of Life"** card (green gradient)
2. Answer all 27 questions across 4 domains:
   - Physical Well-Being (7 questions)
   - Social/Family Well-Being (7 questions)
   - Emotional Well-Being (6 questions)
   - Functional Well-Being (7 questions)
3. Watch the domain scores calculate in real-time
4. See the total score out of 108
5. Add optional notes
6. Click **"Save Assessment"**
7. If score < 50, you'll see a high alert generated

**What to Look For:**
- ✅ All 27 questions must be answered before save button enables
- ✅ Each domain shows its score (e.g., Physical: 14/28)
- ✅ Total score updates as you answer
- ✅ Color-coded score summary at bottom
- ✅ Works offline (disable network in DevTools to test)

---

### Step 5: Test Caregiver Burden Form

1. Click on **"Zarit - Caregiver Burden"** card (violet gradient)
2. Answer all 12 questions about caregiving stress
3. Each question uses 5-point scale:
   - Never (0)
   - Rarely (1)
   - Sometimes (2)
   - Frequently (3)
   - Nearly Always (4)
4. Watch total score and burden level calculate
5. Check support needs if desired (respite care, support group, counseling)
6. Click **"Save Assessment"**
7. If score > 20, you'll see urgent caregiver support alert

**What to Look For:**
- ✅ Score calculates automatically (0-48)
- ✅ Burden level shown: Little/Mild/High with color coding
- ✅ High burden (>20) shows red warning box
- ✅ Support needs checkboxes optional
- ✅ Alert generated if support requested

---

### Step 6: Test Motor Skills Form

1. Click on **"Motor - Motor Skills & Mobility"** card (orange gradient)
2. Complete **at least one** of the four tests:

**A. Grip Strength:**
- Enter right hand strength (kg)
- Enter left hand strength (kg)
- Select interpretation (Normal, Mild/Moderate/Severe Weakness)

**B. Timed Up & Go (TUG):**
- Enter time in seconds
- Select assistance used (None, Cane, Walker, etc.)
- Fall risk auto-calculates:
  - ≤10s = Low Risk (Green)
  - 10-14s = Moderate Risk (Yellow)
  - >14s = High Risk (Red)

**C. 6-Minute Walk Test:**
- Enter distance walked (meters)
- Enter dyspnea before/after (0-10)
- Enter O2 saturation before/after (%)
- System detects desaturation >4%

**D. Balance & Coordination:**
- Enter balance score (0-10)
- Enter coordination score (0-10)

3. Add optional notes
4. Click **"Save Assessment"**

**What to Look For:**
- ✅ Form flexible - can complete any combination of tests
- ✅ TUG fall risk auto-calculates when time entered
- ✅ TUG risk shown with color coding
- ✅ O2 desaturation warning if drop >4%
- ✅ Alerts generated for high fall risk, poor exercise tolerance, etc.

---

## 🧪 Testing Scenarios

### Scenario 1: Low Quality of Life (Trigger Alert)
- Answer most questions with low scores (0-1)
- Keep total score below 50
- Save and check that high alert is generated

### Scenario 2: High Caregiver Burden (Trigger Alert)
- Answer most questions with 3-4 (Frequently/Nearly Always)
- Get total score above 20
- Check support needs boxes
- Verify urgent alert generated

### Scenario 3: High Fall Risk (Trigger Alert)
- Enter TUG time > 14 seconds
- Watch fall risk change to "High Risk" in red
- Save and verify high fall risk alert generated

### Scenario 4: Oxygen Desaturation (Trigger Alert)
- Enter O2 sat before: 98%
- Enter O2 sat after: 93%
- Watch for warning message (5% drop)
- Save and verify desaturation alert

### Scenario 5: Offline Mode
- Open DevTools (F12)
- Go to Network tab
- Set to "Offline"
- Complete any assessment
- See offline indicator (orange, bottom-right)
- Save assessment
- See "Saved offline" toast
- Set back to "Online"
- Watch auto-sync happen

---

## 📊 Verify Data in Dashboard

1. Return to Assessment Dashboard
2. Find the 3 new cards (bottom row)
3. Each should now show:
   - **QOL**: "Completed Today" status, total score/108
   - **Caregiver**: "Completed Today" status, score with burden level badge
   - **Motor**: "Completed Today" status, TUG time, 6MWT distance, balance score

---

## 🚨 Check Alerts

1. Go to **Alerts** page (sidebar)
2. Look for new alerts generated:
   - "Low quality of life score" (if QOL < 50)
   - "High caregiver burden" (if burden > 20)
   - "High fall risk" (if TUG > 14s)
   - "Poor exercise tolerance" (if 6MWT < 300m)
   - "Oxygen desaturation" (if O2 drop > 4%)
   - "Caregiver support needed" (if support boxes checked)

---

## 🎨 Visual Design Check

All 3 new forms should have:
- ✅ Gradient header with icon
- ✅ Patient name displayed
- ✅ Clear instructions
- ✅ Real-time score calculation
- ✅ Color-coded feedback
- ✅ Optional notes field
- ✅ Save + Cancel buttons
- ✅ Loading state during save
- ✅ Success toast on save
- ✅ Auto-redirect back to dashboard

---

## 🔧 Troubleshooting

### Issue: Forms don't show up
**Fix**: Make sure you're logged in and viewing a patient's assessment dashboard

### Issue: Save button stays disabled
**Fix**: Answer ALL questions - every question must have a response

### Issue: No alerts generated
**Fix**: Check alert thresholds - you need scores that meet criteria:
- QOL < 50 for alert
- Caregiver > 20 for urgent alert
- TUG > 14s for high fall risk

### Issue: Offline mode not working
**Fix**: 
1. Check browser console for errors
2. Verify IndexedDB is enabled
3. Try Chrome/Edge (Firefox has limited support)

### Issue: Backend errors
**Fix**: 
1. Check terminal for Python errors
2. Verify database tables exist: `python create_assessment_tables.py`
3. Restart backend server

---

## ✅ Success Criteria

Phase 3 is working correctly if:

1. ✅ Assessment Dashboard shows 10 cards (not 7)
2. ✅ All 3 new forms are accessible via their cards
3. ✅ QOL form shows 27 questions and calculates total/108
4. ✅ Caregiver form shows 12 questions with burden level
5. ✅ Motor form has 4 test sections and auto-calculates fall risk
6. ✅ All forms save successfully
7. ✅ Alerts are generated for concerning scores
8. ✅ Offline mode works (orange indicator, auto-sync)
9. ✅ Dashboard shows latest assessment data for all 10 types
10. ✅ No console errors or build warnings

---

## 📱 Mobile Testing

Test on mobile/tablet view:
1. Open DevTools (F12)
2. Click device toolbar (Ctrl+Shift+M)
3. Select iPad or iPhone
4. Navigate through all 3 forms
5. Verify:
   - ✅ Forms are scrollable
   - ✅ Buttons are tappable
   - ✅ Text is readable
   - ✅ Score displays work
   - ✅ All functionality works

---

## 🎉 That's It!

You now have a complete clinical assessment system with:
- **10 validated assessment tools**
- **32 API endpoints**
- **Offline capability**
- **AI alert generation**
- **Real-time scoring**
- **Evidence-based thresholds**

All ready for deployment to palliative care settings in Ghana! 🇬🇭

---

## 📞 Support

If issues persist:
1. Check `PHASE3_COMPLETE_ALL_10_TOOLS.md` for detailed documentation
2. Review backend logs in terminal
3. Check browser console for frontend errors
4. Verify database has all tables: Check `backend/aura.db`

**Files to Check:**
- Backend: `backend/routers/clinical_assessments.py`
- Frontend Forms: `frontend/src/pages/QualityOfLifeForm.jsx`, `CaregiverBurdenForm.jsx`, `MotorSkillsForm.jsx`
- Dashboard: `frontend/src/pages/AssessmentDashboard.jsx`
- Routes: `frontend/src/App.jsx`
