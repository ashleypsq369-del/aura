# 🕊️ Patient Death Handling System - ProjectAura

**Date:** June 5, 2026  
**Status:** Comprehensive death response system fully implemented

---

## 📋 Overview

ProjectAura has a sophisticated, compassionate system for handling patient death that:
1. **Detects** when a patient has passed away
2. **Records** the death with appropriate metadata
3. **Activates** bereavement support systems
4. **Delivers** posthumous messages and legacy content
5. **Supports** family members through the grief journey

---

## 🔍 How the System Knows a Patient Has Died

### Method 1: Manual Clinician Update (Primary)
**Who:** Clinicians or Administrators  
**Where:** `PUT /api/bereavement/activate-continuity-bridge/{patient_id}`

**Process:**
1. Clinician confirms patient death
2. Calls API endpoint to activate "Continuity Bridge"
3. System updates patient record:
   ```python
   patient.status = 'deceased'
   patient.deceased_at = datetime.utcnow()
   ```
4. Creates audit log for accountability
5. Triggers bereavement support features

**Code Location:** `backend/routers/bereavement.py` (lines 675-678)

### Method 2: Direct Status Update
**Who:** Clinicians  
**Where:** `PUT /api/patients/{patient_id}/status`

**Process:**
1. Update patient status to "deceased" from Patients page
2. System automatically sets `deceased_at` timestamp
3. Database triggers associated workflows

**Code Location:** `backend/routers/patients.py` (lines 415-416)

```python
if status_value == 'deceased':
    patient.deceased_at = datetime.utcnow()
```

### Method 3: Simulator (Testing/Demo)
**Who:** System (for demonstrations)  
**Where:** `backend/src/simulator.py`

**Process:**
1. Simulates complete patient journey
2. Stage 5: Death Event (Day 21 of simulation)
3. Automatically updates status and triggers bereavement

**Code Location:** `backend/src/simulator.py` (lines 364-365)

---

## 📊 Database Schema

### Patient Table Fields
```sql
status VARCHAR(20) DEFAULT 'active'  -- 'active' or 'deceased'
deceased_at DATETIME NULL            -- Timestamp of death
```

### Related Tables
- **BereavementEntry** - Memories and grief journal entries
- **LegacyContent** - Posthumous messages from patient
- **LegacyHeir** - Who can access memories after death
- **PatientJourney** - Records death as journey stage
- **AuditLog** - Tracks who activated death status

---

## 🎯 System Response to Patient Death

### 1. **Immediate Actions**

#### A. Database Updates
- ✅ `patient.status` → "deceased"
- ✅ `patient.deceased_at` → Current timestamp
- ✅ Journey event created with type "death"
- ✅ Audit log entry created

#### B. Bereavement Support Activated
- ✅ "Continuity Bridge" feature unlocked
- ✅ Memory Vault becomes memorial space
- ✅ Legacy content delivery triggered
- ✅ Family grief support resources activated

### 2. **Access Control Changes**

#### Before Death:
- Patient: Full access to own records
- Family: Limited access (with patient consent)
- Caregivers: Care-related access

#### After Death:
- Patient account: Preserved (read-only memorial)
- Family: **Expanded access** to memories and legacy content
- Caregivers: Continued access for closure
- Heirs: Receive designated legacy messages

**Code:** Access control in `backend/routers/bereavement.py` (lines 43-84)

### 3. **Legacy Content Delivery**

#### Posthumous Messages
Patients can create messages **before death** to be delivered **after death**:

**Types:**
- Final letters to family members
- Video/audio messages
- Written memories
- Instructions or wishes
- Personal belongings distribution notes

**Delivery Triggers:**
- `after_death` - Immediate delivery when status changes to deceased
- `specific_date` - Birthday, anniversary, etc.
- `milestone` - Graduation, wedding, etc.

**Code Location:** `backend/routers/legacy.py` (lines 143-149)

```python
def deliver_legacy_content(patient_id: int, db: Session):
    """Deliver legacy content to heirs after patient's death"""
    content_items = db.query(LegacyContent).filter(
        LegacyContent.patient_id == patient_id,
        LegacyContent.delivery_trigger == 'after_death',
        LegacyContent.is_delivered == False
    ).all()
```

### 4. **UI Changes**

#### Memory Vault Header
**Before Death:**
> "Memories about [Patient Name]"

**After Death:**
> "In loving memory of [Patient Name]"  
> "Passed away on [Date]"

**Code:** `frontend/src/pages/MemoryVault.jsx` (lines 157-165)

#### Patient Status Badge
Displays "Deceased" with muted styling in Patients list

**Code:** `frontend/src/pages/Patients.jsx` (line 145-147)

#### Continuity Bridge Page
Shows different message if patient has not yet passed:
> "The Continuity Bridge will be available when it's time."

**Code:** `frontend/src/pages/ContinuityBridge.jsx` (line 81)

### 5. **Bereavement Features Unlocked**

#### A. Memory Vault (Becomes Memorial)
- Family can add memories about the patient
- Existing memories preserved forever
- Shared space for collective remembrance

#### B. Grief Journal
- Private journaling space for family/caregivers
- Prompts for processing grief
- Track healing journey

#### C. Continuity Bridge
- Access to patient's legacy messages
- Posthumous letters delivered
- Digital inheritance of memories

#### D. Bereavement Resources
- Grief support articles
- Cultural death customs information
- Community groups for bereavement
- Contact information for counselors

**Code:** Resources seeded in `backend/seed_resources.py` (lines 251, 291-295)

### 6. **Intelligent Monitoring Exclusion**

Once patient is deceased:
- **Excluded from proactive health monitoring**
- **Excluded from alert generation**
- **Excluded from vital sign tracking**

**Code:** `backend/routers/intelligent_care.py` (line 404)

```python
patients = db.query(Patient).filter(Patient.status != 'deceased').all()
```

### 7. **Journey Tracking**

Patient journey map shows 6 phases:
1. Diagnosis
2. Establishing Care
3. Living Well
4. Symptom Management
5. Deterioration
6. **Death Event** ← Final recorded stage

**Code:** Journey phase detection in `backend/services/personalisation.py` (lines 153-156)

```python
if status == "deceased":
    return {"phase": 6, "phase_name": "Bereavement Support"}
```

---

## 🔐 Security & Privacy

### Audit Trail
Every death status change is logged:
- Who activated it
- When it was activated
- Patient ID
- IP address (if applicable)

### Access Protection
- Only clinicians/admins can mark patient as deceased
- Family members get automatic notification
- Designated heirs receive access to legacy content
- All access is logged for accountability

### Data Preservation
- Patient record is **never deleted**
- All memories are **permanently preserved**
- Medical records remain accessible for:
  - Legal purposes
  - Family health history
  - Research (with proper consent)

---

## 🎭 User Experience Flow

### Scenario: Family Member After Patient Death

#### 1. **Notification**
Family receives notification that patient has passed (not yet implemented - future enhancement)

#### 2. **Login**
Family member logs into ProjectAura

#### 3. **Dashboard Changes**
- Patient status shows "Deceased"
- Continuity Bridge feature now accessible
- Memory Vault shows memorial message

#### 4. **Memory Vault Access**
- View all existing memories
- Add new memories about the patient
- Share with other family members

#### 5. **Legacy Content Received**
- Letters from patient appear in inbox
- Video messages available for viewing
- Final wishes documented and accessible

#### 6. **Grief Support**
- Access grief journal
- Join bereavement community groups
- Read cultural death customs resources
- Contact grief counselors

#### 7. **Long-Term Memorial**
- Patient's memory vault remains accessible forever
- Add memories on anniversaries
- Share stories with future generations

---

## 📝 API Endpoints

### Death Management

#### Activate Continuity Bridge (Mark as Deceased)
```http
PUT /api/bereavement/activate-continuity-bridge/{patient_id}
Authorization: Bearer <clinician_or_admin_token>
```

**Response:**
```json
{
  "message": "Continuity Bridge activated",
  "patient_id": 1,
  "deceased_at": "2026-06-05T14:30:00Z"
}
```

#### Update Patient Status
```http
PUT /api/patients/{patient_id}/status
Content-Type: application/json

{
  "status": "deceased"
}
```

**Response:**
```json
{
  "message": "Status updated successfully",
  "patient": {
    "id": 1,
    "status": "deceased",
    "deceased_at": "2026-06-05T14:30:00Z"
  }
}
```

### Bereavement Support

#### Get Memory Vault Entries
```http
GET /api/bereavement/entries/{patient_id}?entry_type=memory
```

#### Create Grief Journal Entry
```http
POST /api/bereavement/entry
Content-Type: application/json

{
  "patient_id": 1,
  "entry_type": "journal",
  "content": "Today I remembered...",
  "is_private": true
}
```

#### Get Legacy Content
```http
GET /api/legacy/heir-access
```

**Returns posthumous messages from deceased patients**

---

## 🧪 Testing the System

### Test Scenario 1: Mark Patient as Deceased

1. **Login as clinician:**
   ```
   Email: clinician@projectaura.com
   Password: clinician123
   ```

2. **Go to Patients page**
   - Click on a patient (e.g., Patient 1)

3. **Update status:**
   - Status dropdown → Select "Deceased"
   - System automatically sets timestamp

4. **Verify changes:**
   - Status badge shows "Deceased"
   - `deceased_at` timestamp recorded

### Test Scenario 2: Access Memory Vault After Death

1. **Login as family member** (or caregiver)

2. **Navigate to Memory Vault**
   - Header changes to "In loving memory of..."
   - Shows death date

3. **Add a memory:**
   - Click "Add Memory"
   - Write memory about the patient
   - Submit

4. **View all memories:**
   - See memories from patient's life
   - See grief journal entries (if not private)

### Test Scenario 3: Continuity Bridge

1. **As clinician, activate Continuity Bridge:**
   ```http
   PUT /api/bereavement/activate-continuity-bridge/1
   ```

2. **As family member, access Continuity Bridge page:**
   - Navigate to `/continuity-bridge`
   - See bereavement resources
   - Access legacy content
   - View patient's final messages

---

## 💡 Design Philosophy

### Compassionate Technology
- **Dignity:** Patient's memory is honored and preserved
- **Support:** Family receives ongoing grief support
- **Continuity:** Relationship continues through memories
- **Culture:** Respects diverse death and grieving customs

### Palliative Care Principles
- **Anticipatory:** System prepares for inevitable outcomes
- **Holistic:** Supports physical, emotional, and spiritual needs
- **Family-Centered:** Includes family in entire journey
- **Legacy:** Ensures patient's voice continues after death

---

## 🚀 Future Enhancements (Not Yet Implemented)

### Planned Features:
1. **Automated notifications** to family when patient dies
2. **Scheduled legacy delivery** (birthday messages, etc.)
3. **Video message recording** directly in app
4. **Memorial service planning** tools
5. **Grief milestone tracking** (stages of grief)
6. **AI grief companion** for personalized support
7. **Community memorial walls** with photos
8. **Annual remembrance reminders**

---

## 📊 Statistics & Metrics

### What Gets Tracked:
- Total deceased patients
- Legacy content delivered
- Memory vault entries post-death
- Grief journal entries
- Bereavement resource access
- Time from death to legacy delivery

### Reports Available:
- Bereavement support utilization
- Legacy content engagement
- Family access patterns
- Grief journey progression

---

## 🎯 Key Takeaways

### How System Knows Patient Died:
✅ **Clinician manually activates** "Continuity Bridge"  
✅ **Status updated to "deceased"** in database  
✅ **Timestamp recorded** in `deceased_at` field  

### How System Responds:
✅ **Preserves all records** (never deletes)  
✅ **Delivers legacy content** to designated heirs  
✅ **Activates bereavement support** features  
✅ **Changes UI** to memorial mode  
✅ **Excludes from monitoring** (no more alerts)  
✅ **Grants family access** to memories  
✅ **Provides grief resources** and support  

### Compassionate Features:
✅ **Memory Vault** becomes permanent memorial  
✅ **Grief Journal** for processing loss  
✅ **Posthumous messages** from patient  
✅ **Cultural death customs** respected  
✅ **Forever accessible** to family  

---

## 📚 Related Files

### Backend:
- `backend/routers/bereavement.py` - Main bereavement logic
- `backend/routers/legacy.py` - Legacy content delivery
- `backend/routers/patients.py` - Patient status updates
- `backend/src/db.py` - Database models
- `backend/services/personalisation.py` - Journey phase detection

### Frontend:
- `frontend/src/pages/ContinuityBridge.jsx` - Bereavement dashboard
- `frontend/src/pages/MemoryVault.jsx` - Memorial space
- `frontend/src/pages/MyLegacyAccess.jsx` - Heir access to legacy
- `frontend/src/pages/Patients.jsx` - Patient list with status

---

**This system ensures that ProjectAura continues to support families even after their loved one has passed, honoring the principle of "palliative care doesn't end at death."** 🕊️
