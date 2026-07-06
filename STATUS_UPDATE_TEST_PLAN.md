# 🧪 Patient Status Update - Testing Plan

## Test Environment
- **Backend:** http://localhost:8000 (Running ✅)
- **Frontend:** http://localhost:5173
- **Database:** SQLite with test data

---

## Test Accounts

### Primary Test Account
```
Email: clinician@projectaura.com
Password: clinician123
Role: Clinician (Can update status ✓)
```

### Additional Test Accounts
```
Admin: admin@projectaura.com / admin123 (Can update ✓)
Patient: patient@projectaura.com / patient123 (Cannot update ✗)
```

---

## Test Cases

### ✅ TC1: View Status Display
**Objective:** Verify status is visible as text, not just symbol

**Steps:**
1. Login as clinician
2. Navigate to Patients page
3. Click any patient to view details
4. Look at patient header card

**Expected Results:**
- [ ] See label "Status:" in small gray text
- [ ] See status badge with text (e.g., "ACTIVE", "STABLE")
- [ ] Status badge is color-coded (green for active, teal for stable, etc.)
- [ ] Status is on separate row below age/location/risk badges
- [ ] Small edit icon (pencil) appears next to status badge
- [ ] Header layout looks clean and organized

**Pass/Fail:** ___________

---

### ✅ TC2: Open Status Modal
**Objective:** Verify modal opens correctly and is appropriately sized

**Steps:**
1. From patient detail page
2. Click the small edit icon (pencil) next to status badge
3. Observe modal appearance

**Expected Results:**
- [ ] Modal opens with smooth animation
- [ ] Modal is medium-sized (not too big)
- [ ] Background has dark overlay
- [ ] Modal shows "Update Status" as title
- [ ] Current status is displayed at top
- [ ] 6 status options are visible (Active, Stable, Deteriorating, Critical, Deceased, Discharged)
- [ ] Current status is pre-selected
- [ ] Two buttons at bottom: Cancel and Update

**Pass/Fail:** ___________

---

### ✅ TC3: Close Modal - Click Outside
**Objective:** Verify clicking outside modal closes it

**Steps:**
1. With modal open
2. Click on the dark overlay area (not on modal itself)

**Expected Results:**
- [ ] Modal closes immediately
- [ ] Returns to patient detail page
- [ ] No status change occurred

**Pass/Fail:** ___________

---

### ✅ TC4: Close Modal - Cancel Button
**Objective:** Verify Cancel button works

**Steps:**
1. Open modal again
2. Click "Cancel" button

**Expected Results:**
- [ ] Modal closes
- [ ] No status change occurred

**Pass/Fail:** ___________

---

### ✅ TC5: Update to Normal Status
**Objective:** Test updating to non-deceased status

**Steps:**
1. Open modal
2. Select "Stable" (or any non-deceased option)
3. Click "Update" button
4. Wait for response

**Expected Results:**
- [ ] Button shows "Updating..." briefly
- [ ] Success toast message appears: "Patient status updated to stable"
- [ ] Modal closes automatically
- [ ] Status badge updates to show "STABLE"
- [ ] Status badge changes to teal color
- [ ] No page redirect occurs

**Pass/Fail:** ___________

---

### ✅ TC6: Update to Deceased Status
**Objective:** Test deceased status with special confirmation

**Steps:**
1. Open modal
2. Select "Deceased ⚠️" option
3. Click "Update" button
4. Observe confirmation dialog

**Expected Results:**
- [ ] Browser confirmation dialog appears
- [ ] Dialog shows warning: "⚠️ Mark [Patient Name] as DECEASED?"
- [ ] Dialog lists 5 consequences (timestamp, bereavement, legacy, monitoring, records)
- [ ] Dialog says "cannot be easily undone"
- [ ] Two options: OK and Cancel

**Pass/Fail:** ___________

---

### ✅ TC7: Cancel Deceased Confirmation
**Objective:** Verify canceling deceased confirmation

**Steps:**
1. From deceased confirmation dialog
2. Click "Cancel"

**Expected Results:**
- [ ] Dialog closes
- [ ] Modal closes
- [ ] Status remains unchanged
- [ ] No toast message appears

**Pass/Fail:** ___________

---

### ✅ TC8: Confirm Deceased Status
**Objective:** Test full deceased workflow

**Steps:**
1. Open modal
2. Select "Deceased ⚠️"
3. Click "Update"
4. In confirmation dialog, click "OK"
5. Wait for response

**Expected Results:**
- [ ] Success toast appears with dove emoji: "Patient marked as deceased. Bereavement support activated. 🕊️"
- [ ] Toast stays visible for 5 seconds
- [ ] After 2 seconds, automatic navigation begins
- [ ] Redirected to Memory Vault page (/memory-vault)
- [ ] Patient status in database changed to "deceased"
- [ ] `deceased_at` timestamp set in database

**Pass/Fail:** ___________

---

### ✅ TC9: Role-Based Access Control
**Objective:** Verify patients cannot update status

**Steps:**
1. Logout
2. Login as: patient@projectaura.com / patient123
3. Navigate to a patient detail page (if accessible)
4. Look for edit icon

**Expected Results:**
- [ ] NO edit icon appears next to status badge
- [ ] Status is visible but cannot be edited
- [ ] (Patients may not have access to other patient details at all)

**Pass/Fail:** ___________

---

### ✅ TC10: Bereavement Navigation
**Objective:** Verify new sidebar links are accessible

**Steps:**
1. Login as clinician
2. Look at left sidebar navigation
3. Scroll through menu items

**Expected Results:**
- [ ] "Memory Vault" link visible with Heart icon
- [ ] "Continuity Bridge" link visible with Infinity icon
- [ ] Both links are clickable
- [ ] Clicking navigates to respective pages
- [ ] Pages load without errors

**Pass/Fail:** ___________

---

### ✅ TC11: Backend API Test
**Objective:** Test backend endpoint directly

**Steps:**
1. Open backend API docs: http://localhost:8000/docs
2. Find `PUT /api/patients/{patient_id}/status`
3. Click "Try it out"
4. Enter patient_id: 1
5. Request body: `{ "status": "stable" }`
6. Add Authorization header (copy token from browser localStorage)
7. Execute

**Expected Results:**
- [ ] Response code: 200
- [ ] Response body: `{ "message": "Status updated", "status": "stable" }`
- [ ] No errors in backend logs

**Pass/Fail:** ___________

---

### ✅ TC12: Status Color Coding
**Objective:** Verify all status colors are correct

**Steps:**
1. Update patient to each status one by one
2. Observe badge colors

**Expected Results:**
| Status | Background | Text Color | Border |
|--------|-----------|-----------|--------|
| Active | Light Green | Green | Green |
| Stable | Light Teal | Teal | Teal |
| Deteriorating | Light Amber | Amber | Amber |
| Critical | Light Red | Red | Red |
| Deceased | Light Gray | Gray | Gray |
| Discharged | Light Blue | Blue | Blue |

- [ ] All colors display correctly
- [ ] Text is readable on background
- [ ] Borders are visible

**Pass/Fail:** ___________

---

## Regression Tests

### ✅ TC13: Patient Header Layout
**Objective:** Ensure status update didn't break other UI elements

**Steps:**
1. View any patient detail page
2. Examine header card

**Expected Results:**
- [ ] Avatar displays correctly
- [ ] Patient name visible
- [ ] Age displays correctly
- [ ] Location shows properly
- [ ] Risk badge visible and colored
- [ ] Status badge doesn't overlap other elements
- [ ] Diagnosis text visible below
- [ ] Quick action buttons (Assessments, Message, Call, Email) work

**Pass/Fail:** ___________

---

### ✅ TC14: Summary Cards Navigation
**Objective:** Ensure other navigation still works

**Steps:**
1. From patient detail page
2. Click each summary card (Vitals, Medications, Symptoms, etc.)

**Expected Results:**
- [ ] All cards are clickable
- [ ] Navigation to sub-pages works
- [ ] No console errors
- [ ] Back button returns to patient detail

**Pass/Fail:** ___________

---

## Bug Report Template

If any test fails, use this template:

```
**Test Case:** TC# - Name
**Status:** ❌ FAILED
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**


**Actual Behavior:**


**Screenshots/Logs:**


**Browser:** Chrome/Firefox/Edge
**User Role:** admin/clinician/patient
**Priority:** High/Medium/Low
```

---

## Success Criteria

✅ **All 14 test cases must pass**

Minimum acceptance:
- TC1-TC8: MUST PASS (Core functionality)
- TC9-TC10: MUST PASS (Security & navigation)
- TC11-TC12: SHOULD PASS (Visual & API)
- TC13-TC14: SHOULD PASS (No regressions)

---

## Quick Smoke Test (5 minutes)

If short on time, run these critical tests:
1. ✅ TC1: Can see status text
2. ✅ TC2: Modal opens and looks good
3. ✅ TC3: Click outside to close
4. ✅ TC5: Update to normal status
5. ✅ TC6-TC8: Deceased workflow

**If all 5 pass → System is functional! ✅**

---

## Post-Testing Checklist

After all tests pass:
- [ ] Check browser console for errors
- [ ] Check backend logs for warnings
- [ ] Verify database has correct timestamps
- [ ] Test on different browser (Chrome, Firefox, Edge)
- [ ] Test with different screen sizes (mobile, tablet, desktop)
- [ ] Clear browser cache and test again

---

**Testing Start Time:** __________  
**Testing End Time:** __________  
**Tester Name:** __________  
**Overall Result:** PASS / FAIL  
**Notes:**
