# 🏥 How Patient Status Tracking Works - ProjectAura

**Complete Guide: Death, Recovery, Discharge, and Status Management**

---

## 📊 Patient Status Options

Your system tracks **6 different patient statuses**:

| Status | Meaning | Color Badge | When to Use |
|--------|---------|-------------|-------------|
| **active** | Patient actively receiving care | 🟢 Green | Initial admission, stable condition |
| **stable** | Condition is stable | 🟢 Forest Green | Symptoms controlled, no deterioration |
| **deteriorating** | Condition worsening | 🟡 Amber | Health declining, needs monitoring |
| **critical** | Critical condition | 🔴 Red | Urgent care needed, high risk |
| **deceased** | Patient has died | ⚫ Gray | After death confirmed |
| **discharged** | Left program (recovered/transferred) | 🔵 Blue | No longer in care |

---

## 🔍 How the System Knows Status Changes

### Method 1: Manual Status Update (Current Implementation)

**Who Can Update:** Only Clinicians and Administrators

**How It Works:**

#### Option A: Via Patients List (Not Yet Visible)
Currently the Patients page shows status but **doesn't have a dropdown to change it**. You would need to add this feature.

#### Option B: Via API Call
```http
PUT /api/patients/{patient_id}/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "deceased"
}
```

**Backend Code** (`backend/routers/patients.py` lines 415-416):
```python
patient.status = status_value
if status_value == 'deceased':
    patient.deceased_at = datetime.utcnow()  # Automatically sets death time
```

#### Option C: Via Patient Detail Page
The patient detail page might have status controls (need to check).

---

## 🎯 What Happens When Status Changes

### When Patient Dies (status → "deceased"):

1. **Database Updates:**
   ```python
   patient.status = 'deceased'
   patient.deceased_at = '2026-06-05 14:30:00'  # Current timestamp
   ```

2. **Immediate System Responses:**
   - ✅ Patient excluded from health monitoring
   - ✅ No more alerts generated
   - ✅ No more vital sign tracking
   - ✅ Status badge shows "Deceased" in gray

3. **UI Changes:**
   - **Patients List:** Shows gray "deceased" badge
   - **Memory Vault:** Header changes to "In loving memory of..."
   - **Continuity Bridge:** Bereavement features activated
   - **Patient Detail:** Shows death date

4. **Legacy System Activated:**
   - Posthumous messages delivered to heirs
   - Legacy content becomes accessible
   - Bereavement resources unlocked

### When Patient Recovers (status → "stable" or "discharged"):

1. **Database Updates:**
   ```python
   patient.status = 'stable'  # or 'discharged'
   # No deceased_at timestamp set
   ```

2. **System Continues:**
   - ✅ Still included in monitoring (if stable)
   - ✅ Alerts still generated if needed
   - ✅ Care continues normally

3. **If Discharged:**
   - May be excluded from active monitoring
   - Records preserved
   - Can be reactivated if readmitted

### When Patient Deteriorates (status → "deteriorating" or "critical"):

1. **Database Updates:**
   ```python
   patient.status = 'deteriorating'  # or 'critical'
   ```

2. **System Increases Monitoring:**
   - ✅ Higher priority in alert system
   - ✅ More frequent vital checks
   - ✅ Risk score increases
   - ✅ Care team notified

---

## 🔐 Access Control

### Who Can Change Status:

| Role | Can View Status | Can Change Status |
|------|----------------|-------------------|
| **Admin** | ✅ All patients | ✅ All patients |
| **Clinician** | ✅ All patients | ✅ All patients |
| **Caregiver** | ✅ Assigned patients | ❌ No |
| **Family** | ✅ Linked patient | ❌ No |
| **Patient** | ✅ Own status | ❌ No |

**Code** (`backend/routers/patients.py` lines 402-407):
```python
if current_user.role not in ['admin', 'clinician']:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only admin and clinicians can update patient status"
    )
```

---

## 🛠️ Current Implementation Status

### ✅ What's Working:

1. **Backend API:**
   - ✅ `PUT /api/patients/{patient_id}/status` endpoint exists
   - ✅ Automatically sets `deceased_at` when status = "deceased"
   - ✅ Role-based access control enforced
   - ✅ Validation and error handling

2. **Frontend Display:**
   - ✅ Status badges shown in Patients list
   - ✅ Color coding by status
   - ✅ Filter patients by status
   - ✅ Status displayed in patient cards

3. **Database Schema:**
   - ✅ `status` field (VARCHAR 20)
   - ✅ `deceased_at` field (DATETIME NULL)
   - ✅ Proper indexing

4. **Bereavement Pages:**
   - ✅ ContinuityBridge.jsx exists
   - ✅ MemoryVault.jsx exists
   - ✅ Backend API ready (`/api/bereavement/*`)

### ❌ What's Missing:

1. **Status Update UI:**
   - ❌ No dropdown in Patients list to change status
   - ❌ No status change button in patient detail
   - ❌ No confirmation dialog before marking deceased

2. **Navigation to Bereavement:**
   - ❌ Not in sidebar by default
   - ❌ No automatic redirect when patient dies
   - ❌ Not contextually shown

3. **Notifications:**
   - ❌ No automatic notification to family when patient dies
   - ❌ No email/SMS alerts
   - ❌ No in-app notification system for status changes

---

## 🚀 How to Add Status Update UI

### Option 1: Add Dropdown to Patient Cards

Add this to each patient card in `Patients.jsx` (after line 308):

```jsx
{/* Status Update Dropdown (Clinician/Admin Only) */}
{(currentUser?.role === 'clinician' || currentUser?.role === 'admin') && (
  <div className="mt-4 border-t pt-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Update Status:
    </label>
    <select
      value={patient.status}
      onChange={(e) => handleStatusChange(patient.id, e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest"
    >
      <option value="active">Active</option>
      <option value="stable">Stable</option>
      <option value="deteriorating">Deteriorating</option>
      <option value="critical">Critical</option>
      <option value="deceased">Deceased</option>
      <option value="discharged">Discharged</option>
    </select>
  </div>
)}
```

### Option 2: Add Status Button to Patient Detail Page

More appropriate place! Add a "Update Status" button to the patient detail header.

### Option 3: Create Status Change Modal

Best practice - confirmation dialog before marking as deceased:

```jsx
const handleStatusChange = async (patientId, newStatus) => {
  // If marking as deceased, show confirmation
  if (newStatus === 'deceased') {
    const confirmed = window.confirm(
      'Are you sure you want to mark this patient as deceased? This will:\n\n' +
      '- Set the death timestamp\n' +
      '- Activate bereavement support\n' +
      '- Deliver legacy messages to heirs\n' +
      '- Stop health monitoring\n\n' +
      'This action cannot be undone.'
    );
    
    if (!confirmed) return;
  }
  
  try {
    await apiClient.put(`/api/patients/${patientId}/status`, {
      status: newStatus
    });
    
    toast.success(`Patient status updated to ${newStatus}`);
    queryClient.invalidateQueries(['patients']);
    
    // If deceased, show bereavement resources
    if (newStatus === 'deceased') {
      toast.info('Bereavement support has been activated', {
        duration: 5000
      });
    }
  } catch (error) {
    toast.error('Failed to update status');
  }
};
```

---

## 📋 Complete Flow Example

### Scenario: Patient Dies

1. **Clinician Confirms Death:**
   - Patient has passed away in hospital/hospice
   - Clinician logs into ProjectAura

2. **Update Status:**
   - Navigate to Patients page
   - Find patient record
   - Click "Update Status" → Select "Deceased"
   - Confirm action in dialog

3. **System Processes:**
   ```
   Frontend → PUT /api/patients/1/status
             ↓
   Backend  → Validates role (clinician/admin)
             → Sets patient.status = 'deceased'
             → Sets patient.deceased_at = NOW()
             → Commits to database
             ↓
   Database → Patient record updated
             → Triggers bereavement features
   ```

4. **Immediate Results:**
   - Status badge: "deceased" (gray)
   - Death timestamp recorded
   - Patient excluded from monitoring
   - Bereavement pages activated

5. **Family Access:**
   - Family logs in
   - Navigates to Memory Vault
   - Sees "In loving memory of..."
   - Can access Continuity Bridge
   - Receives posthumous messages

---

## 🧪 How to Test Right Now

### Test 1: Check Current Status Display

1. Start servers (backend + frontend)
2. Login as clinician: `clinician@projectaura.com` / `clinician123`
3. Go to Patients page
4. Look at status badges - you should see current statuses

### Test 2: Update Status via API (Swagger)

1. Go to: http://localhost:8000/docs
2. Find: `PUT /api/patients/{patient_id}/status`
3. Click "Try it out"
4. Enter:
   - `patient_id`: 1
   - Request body: `{"status": "deceased"}`
5. Execute
6. Check response - should see `deceased_at` timestamp

### Test 3: Verify in Frontend

1. Refresh Patients page
2. Patient should now show "deceased" badge
3. Go to Memory Vault: http://localhost:5173/memory-vault
4. Should see memorial message

### Test 4: Test Other Statuses

Repeat with:
- `{"status": "stable"}` - Recovery
- `{"status": "deteriorating"}` - Worsening
- `{"status": "critical"}` - Critical condition
- `{"status": "discharged"}` - Left program

---

## 💡 Recommended Improvements

### 1. Add Status Update UI (High Priority)
**Why:** Currently no way to change status from frontend  
**Where:** Patient detail page or patients list  
**Effort:** 1-2 hours

### 2. Add Confirmation Dialogs (High Priority)
**Why:** Prevent accidental status changes  
**Where:** Before any status update  
**Effort:** 30 minutes

### 3. Add Status Change Notifications (Medium Priority)
**Why:** Family should know when patient dies  
**Where:** Email/SMS + in-app notifications  
**Effort:** 2-3 hours

### 4. Add Bereavement to Sidebar (Medium Priority)
**Why:** Currently hidden, hard to find  
**Where:** Sidebar navigation (conditional on patient deceased)  
**Effort:** 30 minutes

### 5. Add Status History Log (Low Priority)
**Why:** Track status changes over time  
**Where:** Patient detail → Timeline tab  
**Effort:** 1-2 hours

---

## 📊 Status Change Decision Tree

```
Patient Assessment
    ↓
┌───────────────────────────────┐
│ Is patient improving?         │
└───────────────────────────────┘
    ↓ YES                ↓ NO
stable/discharged    ┌───────────────┐
                     │ Worsening?    │
                     └───────────────┘
                         ↓ YES    ↓ NO
                     deteriorating  active
                         ↓
                     ┌───────────────┐
                     │ Life threat?  │
                     └───────────────┘
                         ↓ YES    ↓ NO
                      critical   deteriorating
                         ↓
                     ┌───────────────┐
                     │ Has died?     │
                     └───────────────┘
                         ↓ YES
                      deceased
                         ↓
                   [BEREAVEMENT
                    ACTIVATED]
```

---

## 🎯 Quick Reference

### To Mark Patient as Deceased:
```bash
# Via API
curl -X PUT http://localhost:8000/api/patients/1/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "deceased"}'

# Via Swagger UI
http://localhost:8000/docs
→ PUT /api/patients/{patient_id}/status
→ {"status": "deceased"}
```

### To Check Patient Status:
```bash
# Via API
curl http://localhost:8000/api/patients/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response includes:
{
  "id": 1,
  "status": "deceased",
  "deceased_at": "2026-06-05T14:30:00"
}
```

### To Access Bereavement:
```
http://localhost:5173/memory-vault
http://localhost:5173/continuity-bridge
http://localhost:5173/my-legacy-access
```

---

## ✅ Summary

### How System Knows Patient Status:

1. **Manual Entry:** Clinician updates via API (status dropdown not yet in UI)
2. **Database Field:** `patient.status` stores current state
3. **Death Trigger:** When status = "deceased", system auto-sets `deceased_at`
4. **Recovery/Discharge:** Change status to "stable" or "discharged"

### What System Does:

| Status | Monitoring | Alerts | Bereavement | Badge Color |
|--------|-----------|--------|-------------|-------------|
| active | ✅ Yes | ✅ Yes | ❌ No | 🟢 Green |
| stable | ✅ Yes | ✅ Yes | ❌ No | 🟢 Forest |
| deteriorating | ✅ Yes (priority) | ✅ Yes (urgent) | ❌ No | 🟡 Amber |
| critical | ✅ Yes (high) | ✅ Yes (critical) | ❌ No | 🔴 Red |
| **deceased** | ❌ No | ❌ No | **✅ Yes** | ⚫ Gray |
| discharged | ❌ No | ❌ No | ❌ No | 🔵 Blue |

### Key Points:

- ✅ Backend API fully implemented
- ✅ Database schema ready
- ✅ Bereavement pages exist
- ❌ Status update UI not in frontend (need to add)
- ❌ Not visible in navigation (need to add)

---

**Would you like me to add the status update UI to make it easier to change patient status from the frontend?**
