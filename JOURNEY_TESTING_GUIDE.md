# 🧪 Journey Event Tracking - Testing Guide

## Quick Testing Checklist

Follow these steps to verify all journey event types are working correctly.

---

## ✅ Pre-Testing Setup

1. **Backend Running:** Check at http://localhost:8000/docs
2. **Frontend Running:** Check at http://localhost:5174
3. **Logged In:** Use any test account (patient, clinician, or admin)
4. **Have a Test Patient:** Patient ID to test with

---

## 🎯 Test Each Event Type

### **1. Admission Events** 🏥

**Action:** Create a new patient

**Steps:**
1. Go to **Patients** page
2. Click "Add New Patient"
3. Fill in required fields:
   - Full Name: "Test Patient Journey"
   - Date of Birth: Any date
   - Primary Diagnosis: "Cancer"
   - Status: "stable"
4. Click "Add Patient"

**Expected Result:**
- ✅ Patient created
- ✅ Journey event created: Type = `admission`, Title = "Patient Admitted"

**Verify:**
- Go to **My Journey** page (or patient's journey)
- Should see admission event at the top with diagnosis

---

### **2. Appointment Events** 📅

**Action:** Schedule an appointment

**Steps:**
1. Go to **Appointments** page
2. Click "Schedule New Appointment"
3. Fill in:
   - Patient: Select test patient
   - Type: "Follow-up"
   - Date/Time: Any future date
   - Location: "Clinic Room 101"
4. Click "Schedule"

**Expected Result:**
- ✅ Appointment created
- ✅ Journey event: Type = `appointment`, Title = "Follow-up Scheduled"

**Verify:**
- Go to **My Journey**
- Filter by "Appointments"
- Should see appointment event with location and date

---

### **3. Medication Change Events** 💊

**Action:** Add, update, and discontinue medication

#### **3a. Add Medication**

**Steps:**
1. Go to **Medications** page
2. Click "Add Medication"
3. Fill in:
   - Medication Name: "Morphine"
   - Dose: "10mg"
   - Frequency: "Every 4 hours"
   - Route: "Oral"
   - Purpose: "Pain management"
4. Click "Add Medication"

**Expected Result:**
- ✅ Medication added
- ✅ Journey event: Type = `medication_change`, Title = "New Medication", Detail = "Morphine (10mg) - added"

#### **3b. Update Medication** (NEW FEATURE)

**Steps:**
1. Find the Morphine medication in the list
2. Click "Edit" or update button
3. Change dose to "15mg"
4. Change frequency to "Every 6 hours"
5. Save changes

**Expected Result:**
- ✅ Medication updated
- ✅ Journey event: Type = `medication_change`, Title = "Medication Updated", Detail = "Morphine (15mg) - changed"

#### **3c. Discontinue Medication** (NEW FEATURE)

**Steps:**
1. Find the Morphine medication
2. Click "Discontinue" or delete button
3. Confirm discontinuation

**Expected Result:**
- ✅ Medication marked inactive
- ✅ Journey event: Type = `medication_change`, Title = "Medication Discontinued", Detail = "Morphine (15mg) - discontinued"

**Verify:**
- Go to **My Journey**
- Filter by "Medications"
- Should see **3 events**: added → changed → discontinued

---

### **4. Pathway Change Events** 🔄

**Action:** Change patient status

**Steps:**
1. Go to **Patients** page
2. Click on test patient to view details
3. Click "Edit" or "Update Status"
4. Change status from "stable" to "deteriorating"
5. Save changes

**Expected Result:**
- ✅ Status updated
- ✅ Journey event: Type = `pathway_change`, Title = "Care Status Updated", Detail = "Status changed from stable to deteriorating"

**Verify:**
- Go to **My Journey**
- Filter by "Care Changes"
- Should see pathway change event marked as milestone (major change)

---

### **5. Assessment Events** 📋

**Action:** Complete clinical assessments

#### **5a. ESAS Assessment**

**Steps:**
1. Go to **Assessments** page
2. Select "ESAS" tab
3. Click "New ESAS Assessment"
4. Fill in symptom scores (0-10):
   - Pain: 8 (will trigger alert)
   - Tiredness: 6
   - Drowsiness: 4
   - Nausea: 3
   - Lack of Appetite: 5
   - Depression: 7
   - Anxiety: 8 (will trigger alert)
   - Shortness of Breath: 6
   - Wellbeing: 2 (will trigger alert)
5. Add notes (optional)
6. Click "Submit"

**Expected Result:**
- ✅ ESAS assessment completed
- ✅ Journey event: Type = `assessment`, Title = "ESAS Assessment"
- ✅ Multiple journey events: Type = `high_alert` (for pain≥8, anxiety≥8, wellbeing≤2)

#### **5b. PHQ-9 Assessment (Depression)**

**Steps:**
1. Select "PHQ-9" tab
2. Answer all 9 questions (0-3 scale)
3. Set high scores to trigger alerts (e.g., all 3s = severe depression)
4. Click "Submit"

**Expected Result:**
- ✅ PHQ-9 completed
- ✅ Journey event: Type = `assessment`, Title = "PHQ-9 Assessment"
- ✅ If severe: Journey event Type = `high_alert`, Title = "Critical Alert: Severe Depression"

#### **5c. Test Other Assessments**

Repeat for:
- **PPS** (Palliative Performance Scale)
- **GAD-7** (Anxiety)
- **Barthel Index** (Functional Independence)

**Verify:**
- Go to **My Journey**
- Filter by "Assessments"
- Should see all completed assessments
- Filter by "Critical Alerts"
- Should see alerts generated from severe scores

---

### **6. High Alert Events** 🚨

**Action:** Trigger critical alerts

#### **6a. Chatbot Crisis Detection**

**Steps:**
1. Open **Aura Chat** (bottom right corner)
2. Type a crisis message: "I don't want to live anymore"
3. Send message

**Expected Result:**
- ✅ Chatbot detects crisis
- ✅ Crisis alert created
- ✅ Journey event: Type = `high_alert`, Title = "Critical Alert: Mental Health Crisis"

#### **6b. Proactive Monitoring Alerts**

**Action:** Wait for automatic monitoring (runs every 5 minutes)

**What it checks:**
- Abnormal vital signs
- Severe symptoms
- Medication adherence
- Assessment scores

**Expected Result:**
- ✅ System automatically creates alerts for concerning patterns
- ✅ High/Critical alerts appear as journey events

**Verify:**
- Wait 5-10 minutes after entering concerning data
- Go to **Alerts** page - see new alerts
- Go to **My Journey** → Filter "Critical Alerts"
- Should see auto-generated alert events

---

### **7. Milestone Events** ⭐

**Action:** Manual milestone creation (via API or future UI)

**Note:** Milestones are currently manual - no automatic detection yet.

**API Test (optional):**
```bash
POST /api/journey/milestone
{
  "patient_id": 1,
  "title": "100 Days in Care",
  "description": "Patient has been in palliative care for 100 days",
  "created_by": 1
}
```

**Expected Result:**
- ✅ Journey event: Type = `milestone`, is_milestone = true
- ✅ Shows with star icon on timeline

---

## 📊 Comprehensive Verification

### **View Complete Journey Timeline**

**Steps:**
1. Go to **My Journey** page (or click "Journey" in patient details)
2. Set filter to "All Events"
3. Set time range to "All Time"

**What You Should See:**

✅ **Grouped by Date:**
- Events organized by day
- Most recent at top

✅ **Event Cards Show:**
- Icon indicating event type
- Event title
- Timestamp
- Detailed description
- Event type badge
- Star icon for milestones

✅ **Filtering Works:**
- Click "Admissions" → See only admission events
- Click "Medications" → See only medication events
- Click "Critical Alerts" → See only alert events
- Click "All Events" → See everything

✅ **Time Range Filtering:**
- "Last 30 Days" → Recent events only
- "Last 90 Days" → 3 months
- "All Time" → Complete history

✅ **Summary Statistics (Bottom Cards):**
- Total Events count
- Milestones count
- Critical Alerts count
- Appointments count

✅ **Journey Phase Indicator:**
- Shows current care phase
- Visual timeline of phases
- Description of what's next

---

## 🐛 Troubleshooting

### **Problem: No events appearing**

**Check:**
1. ✅ Backend is running (http://localhost:8000/health)
2. ✅ You're logged in
3. ✅ Viewing correct patient's journey
4. ✅ Filters not too restrictive (set to "All Events", "All Time")
5. ✅ Browser console for errors

**Fix:**
- Clear browser cache
- Refresh page
- Check backend logs for errors
- Verify database has `patient_journey_events` table

---

### **Problem: Events created but not showing**

**Check:**
1. ✅ API endpoint working: GET /api/journey/{patient_id}
2. ✅ Frontend query not failing
3. ✅ React Query cache might be stale

**Fix:**
- Hard refresh page (Ctrl+Shift+R)
- Check Network tab for API response
- Backend should return events array

---

### **Problem: Assessment events not created**

**Check:**
1. ✅ Import statements in clinical_assessments.py
2. ✅ `track_assessment()` function being called
3. ✅ No exceptions in backend logs

**Fix:**
- Check backend terminal for errors
- Verify journey_tracker.py exists in services/
- Check database for events: `SELECT * FROM patient_journey_events WHERE event_type='assessment'`

---

### **Problem: Medication update/delete not working**

**Check:**
1. ✅ New endpoints exist: PUT /api/medications/{id}, DELETE /api/medications/{id}
2. ✅ Frontend calling correct endpoints

**Fix:**
- Check API docs: http://localhost:8000/docs
- Look for PUT and DELETE under Medications section
- Test endpoints directly in Swagger UI

---

## 📈 Success Metrics

### **Complete Test Pass Criteria:**

✅ **7 Event Types Visible:**
1. Admission events
2. Appointment events
3. Medication change events (added, changed, discontinued)
4. High alert events
5. Pathway change events
6. Assessment events
7. (Milestone events - manual only)

✅ **Journey Timeline Features:**
- Events grouped by date
- Icons show event types
- Filtering works (type and date)
- Summary statistics accurate
- Journey phase indicator displays

✅ **Automatic Tracking:**
- Events created without manual API calls
- Real-time updates (within 30 seconds)
- All clinical actions tracked

---

## 🎉 Test Completion

Once you've completed all tests above, you should have:

- **10-20+ journey events** in the timeline
- **Multiple event types** visible
- **Working filters** for exploration
- **Rich patient care history** documented

---

## 📝 Report Issues

If you find any issues:

1. **Check browser console** for JavaScript errors
2. **Check backend logs** for Python errors
3. **Verify database** has events: 
   ```sql
   SELECT event_type, COUNT(*) 
   FROM patient_journey_events 
   GROUP BY event_type;
   ```
4. **Note which event type** is not working
5. **Document steps** to reproduce

---

**Happy Testing!** 🚀

Your journey tracking system is now complete and ready for comprehensive clinical documentation.
