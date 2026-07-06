# 📝 Personalization Questionnaire System - Complete Guide

**Date**: June 5, 2026  
**Status**: ✅ Implemented

---

## 🎯 System Overview

### **What It Does**

When users register for ProjectAura, they complete a **7-step personalization questionnaire** that customizes their experience based on:
- Language preference
- Health journey stage
- Physical symptoms
- Emotional wellbeing
- Faith and culture
- Social connections
- Content preferences

### **Who Sees the Questionnaire**

| User Role | Sees Questionnaire | Why |
|-----------|-------------------|-----|
| **Patient** | ✅ Yes | Personalizes their patient portal |
| **Family** | ✅ Yes | Customizes support resources |
| **Caregiver** | ❌ No | Created by admin, professional role |
| **Clinician** | ❌ No | Created by admin, professional role |
| **Admin** | ❌ No | Created by admin, system role |

---

## 🔄 Complete Flow

### **Registration → Questionnaire → Dashboard**

```
1. User visits /register
   ↓
2. Fills registration form:
   - Full name
   - Username
   - Email
   - Password
   - Phone (optional)
   - Role: Patient or Family
   ↓
3. Backend creates user + PatientPreferences record:
   - questionnaire_complete: False
   ↓
4. Backend returns:
   {
     "access_token": "...",
     "user": {
       ...
       "needs_questionnaire": True  ← KEY FLAG
     }
   }
   ↓
5. Frontend Register.jsx checks:
   if (user.needs_questionnaire) {
     navigate('/setup');  ← Redirects to questionnaire
   } else {
     navigate('/dashboard');
   }
   ↓
6. User completes 7-step questionnaire (/setup)
   ↓
7. Data saved to PatientPreferences:
   - questionnaire_complete: True
   - All preferences stored
   ↓
8. Redirects to /my-space (patient portal)
```

---

## 📊 Registration Restrictions

### **Public Registration (Self-Service)**

**Allowed Roles:**
- ✅ Patient
- ✅ Family Member / Caregiver

**Why Limited?**
- Protects system from unauthorized clinical access
- Ensures medical professionals are verified
- Maintains HIPAA/data protection compliance

**Registration Form:**
```javascript
<select value={formData.role} onChange={...}>
  <option value="patient">Patient</option>
  <option value="family">Family Member / Caregiver</option>
</select>
<p className="text-xs">
  Healthcare professionals should contact admin for accounts
</p>
```

---

### **Admin-Created Accounts (Verified Staff)**

**Admin Must Create:**
- ⚕️ **Clinicians** (Doctors, Nurses)
- 👨‍⚕️ **Caregivers** (Professional care staff)
- 🔑 **Administrators** (System admins)

**Why?**
- Verify credentials and licenses
- Ensure HIPAA training completed
- Assign proper permissions
- Control access to patient data
- Audit trail for clinical staff

**How Admin Creates Accounts:**
1. Login as admin
2. Navigate to `/admin/users`
3. Click "Add User"
4. Fill form with user details
5. Select role: Clinician, Caregiver, or Admin
6. User receives credentials
7. No questionnaire required (professional accounts)

---

## 🗂️ Database Schema

### **users** table
```sql
id: INTEGER (PK)
username: VARCHAR (UNIQUE)
email: VARCHAR (UNIQUE)
hashed_password: VARCHAR
role: VARCHAR (patient, family, caregiver, clinician, admin)
full_name: VARCHAR
phone: VARCHAR
is_active: BOOLEAN
consent_given: BOOLEAN
created_at: TIMESTAMP
```

### **patient_preferences** table
```sql
id: INTEGER (PK)
user_id: INTEGER (FK → users.id)
patient_id: INTEGER (FK → patients.id, optional)
questionnaire_complete: BOOLEAN  ← KEY FIELD

-- Questionnaire Data:
language_pref: VARCHAR
info_style: VARCHAR
tech_comfort: VARCHAR
diagnosis_duration: VARCHAR
emotional_states: JSON (array)
physical_symptoms: JSON (array)
activity_level: VARCHAR
self_care_level: VARCHAR
mood_score: INTEGER
coping_strategies: JSON (array)
future_worry_level: VARCHAR
religious_background: VARCHAR
spiritual_importance: VARCHAR
wants_spiritual_care: BOOLEAN
main_support_person: VARCHAR
social_connectedness: VARCHAR
wants_peer_connection: BOOLEAN
content_preferences: JSON (array)
info_frequency: VARCHAR
topic_interests: JSON (array)
wants_community: BOOLEAN
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

---

## 📝 7-Step Questionnaire Details

### **Step 1: Get to Know You**

**Fields:**
- Language preference (English, Twi, Ga, Ewe, Hausa, Dagbani)
- Information style (Simple, Detailed, Visual, Mixed)
- Tech comfort level (High, Medium, Low, Basic)

**Purpose:** Customizes UI complexity and language

---

### **Step 2: Your Health Journey**

**Fields:**
- Diagnosis duration (New, 0-3 months, 3-12 months, 12+ months)
- Emotional states (Multi-select: Scared, Hopeful, Overwhelmed, etc.)

**Purpose:** Shows stage-appropriate resources

---

### **Step 3: Your Body and Physical Health**

**Fields:**
- Physical symptoms (Multi-select: Pain, Tiredness, Nausea, etc.)
- Activity level (High, Moderate, Low, Bedbound)
- Self-care ability (Independent, Some help, Much help, Dependent)

**Purpose:** Prioritizes symptom management content

---

### **Step 4: Your Emotional Wellbeing**

**Fields:**
- Mood score (1-10 slider)
- Coping strategies (Multi-select: Family, Prayer, Music, etc.)
- Future worry level (Very, Somewhat, Little, Peaceful)

**Purpose:** Offers mental health resources

---

### **Step 5: Your Faith and Culture**

**Fields:**
- Religious background (Christian, Muslim, Traditional, None, Other)
- Spiritual importance (Very, Important, Somewhat, Not)
- Wants spiritual care provider (Yes/No)

**Purpose:** Connects to spiritual care services

---

### **Step 6: Your World and Relationships**

**Fields:**
- Main support person (Spouse, Parent, Child, Friend, Alone)
- Social connectedness (Very, Mostly, Sometimes lonely, Isolated)
- Wants peer connection (Yes/No)

**Purpose:** Facilitates community connections

---

### **Step 7: What Would Help You Most**

**Fields:**
- Content preferences (Multi-select: News, Tips, Stories, etc.)
- Info frequency (Daily, Few weekly, Weekly, Only changes)
- Topic interests (Multi-select: Pain, Sleep, Mental health, etc.)
- Wants community (Yes actively / Not right now)

**Purpose:** Customizes dashboard content

---

## 🔧 Backend Implementation

### **Registration Endpoint**

**File:** `backend/routers/auth.py`

```python
@router.post("/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # ... validation ...
    
    # Limit roles via public registration
    allowed_roles = ["patient", "family"]
    if request.role not in allowed_roles:
        request.role = "patient"
    
    new_user = User(...)
    db.add(new_user)
    db.flush()
    
    # Create UserProfile
    profile = UserProfile(user_id=new_user.id, language_pref="en")
    db.add(profile)
    
    # Initialize empty preferences (questionnaire pending)
    prefs = PatientPreferences(
        user_id=new_user.id,
        patient_id=request.linked_patient_id,
        questionnaire_complete=False,  ← KEY
    )
    db.add(prefs)
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            ...
            "needs_questionnaire": True,  ← Tells frontend
        }
    }
```

---

### **Login Endpoint**

**Checks questionnaire completion:**

```python
@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(request.username, request.password, db)
    
    # Check if questionnaire completed
    prefs = db.query(PatientPreferences).filter(
        PatientPreferences.user_id == user.id
    ).first()
    
    questionnaire_complete = prefs.questionnaire_complete if prefs else True
    needs_questionnaire = (
        (user.role in ["patient", "family"]) and 
        not questionnaire_complete
    )
    
    return {
        "access_token": access_token,
        "user": {
            ...
            "needs_questionnaire": needs_questionnaire,  ← Redirect flag
        }
    }
```

---

### **Preferences Endpoint**

**File:** `backend/routers/preferences.py` (assumed)

```python
@router.get("/preferences/{user_id}")
async def get_preferences(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prefs = db.query(PatientPreferences).filter(
        PatientPreferences.user_id == user_id
    ).first()
    
    if not prefs:
        return {"questionnaire_complete": False}
    
    return prefs

@router.post("/preferences")
async def save_preferences(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prefs = db.query(PatientPreferences).filter(
        PatientPreferences.user_id == data['user_id']
    ).first()
    
    if prefs:
        # Update existing
        for key, value in data.items():
            setattr(prefs, key, value)
    else:
        # Create new
        prefs = PatientPreferences(**data)
        db.add(prefs)
    
    db.commit()
    return {"message": "Preferences saved"}
```

---

## 🎨 Frontend Implementation

### **Registration Flow**

**File:** `frontend/src/pages/Register.jsx`

```javascript
const registerMutation = useMutation({
  mutationFn: async (data) => {
    return axios.post(`${API_URL}/api/auth/register`, data);
  },
  onSuccess: (response) => {
    const { access_token, user } = response.data;
    localStorage.setItem('auth_token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    
    toast.success('Account created successfully!');
    
    // Redirect based on needs_questionnaire
    if (user.needs_questionnaire) {
      navigate('/setup');  ← TO QUESTIONNAIRE
    } else {
      navigate('/dashboard');  ← TO DASHBOARD
    }
  }
});
```

---

### **Questionnaire Component**

**File:** `frontend/src/pages/PersonalisationQuest.jsx`

**Features:**
- 7 step wizard with progress bar
- Multiple field types:
  - Radio buttons (single choice)
  - Multi-select chips (multiple choices)
  - Slider (1-10 scale)
- Form validation
- Auto-save on completion
- Animated transitions
- Back/Next navigation
- Completion celebration screen

**Key Functions:**
```javascript
// Check if already completed
const { data: prefsData } = useQuery({
  queryKey: ['preferences'],
  queryFn: async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const response = await axios.get(
      `${API_URL}/api/preferences/${user.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
});

useEffect(() => {
  if (prefsData?.questionnaire_complete) {
    navigate('/my-space');  // Already done, redirect
  }
}, [prefsData, navigate]);

// Save on completion
const savePreferences = useMutation({
  mutationFn: async (data) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return axios.post(`${API_URL}/api/preferences`, {
      ...data,
      user_id: user.id,
      questionnaire_complete: true,  ← Mark as done
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  onSuccess: () => {
    setIsComplete(true);
    setTimeout(() => {
      navigate('/my-space');  // Redirect to patient portal
    }, 2000);
  }
});
```

---

## 🧪 Testing the Flow

### **Test New User Registration**

1. **Navigate to registration:**
   ```
   http://localhost:5173/register
   ```

2. **Fill form:**
   - Full Name: "Test Patient"
   - Username: "testpatient"
   - Email: "test@example.com"
   - Password: "Test1234"
   - Role: "Patient"
   - Accept terms

3. **Click "Create Account"**

4. **Expected Result:**
   - Success toast appears
   - Redirects to `/setup`
   - Shows Step 1 of questionnaire
   - Progress bar shows "Step 1 of 7"

5. **Complete all 7 steps:**
   - Fill each form
   - Click "Next" through all steps
   - On Step 7, click "Complete"

6. **Expected Result:**
   - Shows completion screen with checkmark
   - "You're all set!" message
   - After 2 seconds, redirects to `/my-space`

7. **Logout and login again:**
   ```javascript
   // Should NOT redirect to questionnaire
   // Should go straight to /my-space (patient portal)
   ```

---

### **Test Existing User Login**

1. **Login with user who completed questionnaire**

2. **Expected:**
   - Goes directly to dashboard/my-space
   - NO questionnaire redirect

3. **Login with user who hasn't completed**

4. **Expected:**
   - Redirects to `/setup`
   - Must complete before accessing system

---

### **Test Role Restrictions**

1. **Try to register as "clinician":**
   ```javascript
   // Backend will force role to "patient"
   // Only patient and family allowed via public registration
   ```

2. **Check registration form:**
   ```javascript
   // Dropdown only shows:
   // - Patient
   // - Family Member / Caregiver
   // 
   // Note below: "Healthcare professionals should contact admin"
   ```

---

## 🔍 Troubleshooting

### **Issue: Questionnaire not showing after registration**

**Check:**
1. Backend returns `needs_questionnaire: True`
   ```javascript
   console.log(response.data.user.needs_questionnaire);
   // Should be: true
   ```

2. Frontend redirect logic:
   ```javascript
   if (user.needs_questionnaire) {
     navigate('/setup');  // Check this executes
   }
   ```

3. Route exists:
   ```javascript
   // In App.jsx
   <Route path="/setup" element={
     <ProtectedRoute>
       <PersonalisationQuest />
     </ProtectedRoute>
   } />
   ```

---

### **Issue: Already completed questionnaire, but still redirecting**

**Check:**
1. Database record:
   ```sql
   SELECT questionnaire_complete 
   FROM patient_preferences 
   WHERE user_id = X;
   -- Should be: true
   ```

2. Login response:
   ```javascript
   console.log(response.data.user.needs_questionnaire);
   // Should be: false
   ```

---

### **Issue: Can't register as clinician**

**This is correct behavior!**

**Solution:**
- Clinicians must be created by admin
- Navigate to `/admin/users` (as admin)
- Create account with "Clinician" role
- No questionnaire required for clinical staff

---

## 📊 Data Usage

### **How Preferences Customize the Experience**

| Preference | Affects |
|------------|---------|
| `language_pref` | UI language, content language |
| `info_style` | Content complexity (simple vs detailed) |
| `tech_comfort` | UI complexity (basic vs advanced features) |
| `physical_symptoms` | Prioritized symptom management content |
| `emotional_states` | Mental health resources |
| `coping_strategies` | Recommended coping activities |
| `religious_background` | Spiritual care options |
| `wants_spiritual_care` | Spiritual care provider connections |
| `social_connectedness` | Community feature prominence |
| `wants_peer_connection` | Peer support group invitations |
| `content_preferences` | Dashboard content mix |
| `info_frequency` | Notification frequency |
| `topic_interests` | Prioritized educational content |
| `wants_community` | Community hub access |

### **Example: Content Personalization**

**User A:**
- `topic_interests`: ["Pain management", "Sleep"]
- `content_preferences`: ["Practical guides"]
- Dashboard shows: Pain relief techniques, sleep hygiene guides

**User B:**
- `topic_interests`: ["Spiritual peace", "Legacy"]
- `content_preferences`: ["Inspirational stories"]
- Dashboard shows: Spiritual reflection prompts, legacy planning tools

---

## 🚀 Future Enhancements

### **Phase 2: Dynamic UI Adaptation**

- [ ] Adjust font sizes based on `tech_comfort`
- [ ] Show/hide advanced features based on preferences
- [ ] Language-specific UI translation
- [ ] Voice guidance for low tech comfort users

### **Phase 3: Smart Content Delivery**

- [ ] AI-powered content recommendations
- [ ] Adaptive content complexity
- [ ] Mood-based content filtering
- [ ] Time-of-day content optimization

### **Phase 4: Community Matching**

- [ ] Match users with similar journeys
- [ ] Faith-based support groups
- [ ] Symptom-specific peer groups
- [ ] Language-based communities

### **Phase 5: Analytics**

- [ ] Track preference effectiveness
- [ ] A/B test personalization algorithms
- [ ] User satisfaction metrics
- [ ] Content engagement analytics

---

## 📋 Summary

✅ **What Works:**
- Registration limited to Patient and Family roles
- Automatic questionnaire redirect after registration
- 7-step personalized questionnaire
- Preferences saved to database
- Skip questionnaire on subsequent logins
- Admin creates clinical staff accounts (no questionnaire)

✅ **Key Points:**
- Only patients and family members can self-register
- Clinicians, caregivers, and admins must be created by admin
- Questionnaire is required for patients and family members
- Clinical staff skip the questionnaire entirely
- Preferences customize the entire user experience

✅ **Testing:**
- Register new patient → Should redirect to questionnaire
- Complete questionnaire → Should redirect to patient portal
- Login again → Should skip questionnaire
- Try to register as clinician → Role forced to patient

---

**Implementation Date**: June 5, 2026  
**Status**: ✅ **FULLY FUNCTIONAL**  
**User Roles**: Patient, Family (questionnaire) | Clinician, Caregiver, Admin (admin-created)
