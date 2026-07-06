# Journey Event Tracking - Testing Guide 🧪

**Quick testing guide to verify automatic journey event collection is working**

---

## ⚠️ IMPORTANT: Restart Backend First

Before testing, you MUST restart the backend server to load the new `journey_tracker` service:

```bash
cd backend
# Stop the current backend (Ctrl+C if running)
# Then restart:
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🧪 Test Scenarios

### Test 1: Appointment Tracking ✅

**Steps:**
1. Login as clinician/admin
2. Navigate to **Appointments** page
3. Click **Add Appointment**
4. Fill in appointment details:
   - Select a patient
   - Choose appointment type (e.g., "Follow-up Consultation")
   - Set date and time
   - Add location
   - Click **Save**
5. Navigate to **My Journey** page (for that patient)
6. **Expected Result:** See new event "Follow-up Consultation Scheduled" with date/time/location

---

### Test 2: Medication Tracking ✅

**A. Adding Medication**
1. Login as clinician/admin
2. Navigate to **Medications** page
3. Click **Add Medication**
4. Fill in details:
   - Select patient
   - Medication name: "Morphine"
   - Dose: "10mg"
   - Frequency: "Every 4 hours"
   - Click **Save**
5. Check **My Journey**
6. **Expected Result:** "New Medication" event with "Morphine (10mg) - added"

**B. Updating Medication**
1. Click **Edit** on an existing medication
2. Change dosage (e.g., 10mg → 15mg)
3. Click **Update**
4. Check **My Journey**
5. **Expected Result:** "Medication Updated" event with new dosage

**C. Discontinuing Medication**
1. Click **Discontinue** on a medication
2. Confirm discontinuation
3. Check **My Journey**
4. **Expected Result:** "Medication Discontinued" event

---

### Test 3: Assessment Tracking ✅

**A. ESAS Assessment**
1. Navigate to **Assessments** page
2. Select patient
3. Click **ESAS Assessment**
4. Fill in symptom scores (try high scores like pain=9 to trigger alerts)
5. Submit assessment
6. Check **My Journey**
7. **Expected Results:**
   - "ESAS Assessment" event
   - If pain >= 8: "Critical Alert: Severe Pain" event (marked as milestone ⭐)

**B. PHQ-9 Depression Assessment**
1. Click **PHQ-9 Assessment**
2. Fill in all 9 questions
3. Submit
4. Check **My Journey**
5. **Expected Results:**
   - "PHQ-9 Assessment" event with severity level
   - If severe: Critical alert event

**C. PPS (Functional Status)**
1. Click **PPS Assessment**
2. Set PPS score (try 30% or lower for critical alert)
3. Submit
4. Check **My Journey**
5. **Expected Results:**
   - "PPS Assessment" event with score
   - If <= 30%: Critical PPS alert event

---

### Test 4: Critical Alert Tracking ✅

**Automatic from Assessments:**
- Complete any assessment with severe scores
- System automatically creates high/critical alerts
- These alerts are tracked as journey events
- Example triggers:
  - Pain >= 8
  - Depression (PHQ-9) >= 20
  - Anxiety (GAD-7) >= 15
  - PPS <= 30%
  - Low oxygen saturation

**Check My Journey:**
- Critical alerts appear as **milestone events** with ⭐
- Show severity and details
- Event type: "Critical Alert: [Type]"

---

### Test 5: Patient Status Change ✅

**Admin/Clinician Only:**
1. Navigate to **Patients** page
2. Click on a patient
3. Click **Edit Patient** or **Update Status**
4. Change status (e.g., "stable" → "critical")
5. Save changes
6. Check **My Journey**
7. **Expected Result:** "Care Status Updated" event showing old → new status
8. If changing to "critical" or "deceased", event is marked as milestone ⭐

---

### Test 6: Patient Admission ✅

**Admin/Clinician Only:**
1. Navigate to **Patients** page
2. Click **Add New Patient**
3. Fill in patient details:
   - Name
   - Date of birth
   - Diagnosis
   - Initial status
4. Click **Save**
5. Navigate to that patient's **My Journey**
6. **Expected Result:** "Patient Admitted" milestone event with diagnosis and admission date ⭐

---

## 🎯 What to Look For in My Journey

### Journey Event Display Should Show:

1. **Timeline Visualization**
   - Events grouped by date
   - Newest events at top
   - Date headers (e.g., "June 5, 2026")

2. **Event Cards**
   - Icon matching event type
   - Event title (bold)
   - Event detail description
   - Timestamp
   - Milestone indicator (⭐) for critical events

3. **Event Type Badges**
   - Color-coded badges
   - Event type labels

4. **Filter Options**
   - Filter by event type dropdown
   - Date range selectors

---

## 🔍 Debugging

### If Events Don't Appear:

1. **Check Backend Logs:**
   ```
   Look for: "✅" or "❌" messages from journey_tracker
   ```

2. **Verify Database:**
   - Check `patient_journey_events` table
   - Should have new entries after each action

3. **Check Browser Console:**
   - Look for API errors
   - Verify `/api/journey/patients/{id}` endpoint returns data

4. **Common Issues:**
   - ❌ Backend not restarted → Journey tracker not loaded
   - ❌ Patient ID mismatch → Events linked to wrong patient
   - ❌ Permission issues → User can't access journey
   - ❌ Frontend cache → Hard refresh (Ctrl+F5)

---

## 📊 Expected Timeline After Full Test

After completing all tests, a patient's journey should show:
1. ⭐ **Patient Admitted** (milestone)
2. 🟢 **Follow-up Consultation Scheduled**
3. 🟣 **New Medication - Morphine (10mg)**
4. 🟣 **Medication Updated - Morphine (15mg)**
5. 🟠 **ESAS Assessment** (Score: X)
6. ⭐ **Critical Alert: Severe Pain** (milestone)
7. 🟠 **PHQ-9 Assessment** (Severity: moderate)
8. 🟠 **PPS Assessment** (Score: 30%)
9. ⭐ **Critical Alert: Critical PPS** (milestone)
10. 🔶 **Care Status Updated** (stable → critical)
11. 🟣 **Medication Discontinued - Morphine**

All in **reverse chronological order** (newest first)!

---

## ✅ Success Criteria

Journey tracking is working if:
- ✅ All test events appear in My Journey
- ✅ Events show correct details (patient, date, description)
- ✅ Critical alerts are marked as milestones (⭐)
- ✅ Events appear immediately after action (no delay)
- ✅ Events are in correct chronological order
- ✅ Event type filters work correctly
- ✅ Date range filters work correctly

---

## 🎉 Completion Checklist

- [ ] Backend restarted successfully
- [ ] Appointment event tracked ✅
- [ ] Medication add/edit/delete tracked ✅
- [ ] ESAS assessment tracked ✅
- [ ] PHQ-9 assessment tracked ✅
- [ ] PPS assessment tracked ✅
- [ ] Critical alerts tracked as milestones ✅
- [ ] Patient status change tracked ✅
- [ ] Patient admission tracked ✅
- [ ] All events visible in My Journey ✅
- [ ] Timeline displays correctly ✅
- [ ] Filters work properly ✅

---

**If all tests pass:** 🎉 Journey tracking is fully operational!
