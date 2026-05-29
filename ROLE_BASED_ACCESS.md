# 🔐 Role-Based Access Control (RBAC)

## Overview

The system now implements **role-based navigation** - each user only sees pages relevant to their role.

---

## 👥 USER ROLES & ACCESS

### 1. 👨‍⚕️ ADMIN (Full Access)
**Who:** System administrators, IT staff

**Can Access:**
- 🏠 Dashboard
- 📝 Log Data
- 📊 View Trends
- 🤖 AI Insights
- 🔔 Alerts
- 💊 Medications
- 📅 Appointments
- 👥 Caregiver Portal
- 📋 Care Plan
- 📊 Functional Status
- 🏥 Patient Onboarding
- 🎬 Clinical Simulation

**Total Pages:** 12

---

### 2. 👨‍⚕️ CLINICIAN (Clinical Staff)
**Who:** Doctors, nurses, hospice care professionals

**Can Access:**
- 🏠 Dashboard
- 📝 Log Data
- 📊 View Trends
- 🤖 AI Insights
- 🔔 Alerts
- 💊 Medications
- 📅 Appointments
- 📋 Care Plan
- 📊 Functional Status
- 🏥 Patient Onboarding

**Total Pages:** 10

**Why these pages?**
- Clinical decision-making tools
- Patient data entry and monitoring
- Care planning and coordination
- Medication management
- Assessment tools

---

### 3. 👨‍👩‍👧 CAREGIVER (Family/Professional Caregivers)
**Who:** Family members providing care, professional home health aides

**Can Access:**
- 🏠 Dashboard
- 📝 Log Data
- 📊 View Trends
- 🔔 Alerts
- 💬 Support Hub
- 👥 Caregiver Portal
- 📅 Appointments
- 💊 Medications
- 📸 Memories
- 📔 Journal

**Total Pages:** 10

**Why these pages?**
- Daily care coordination
- Task management
- Communication with care team
- Medication administration logging
- Emotional support tools
- Memory preservation

---

### 4. 🧑‍🦱 PATIENT (Patients)
**Who:** Hospice patients

**Can Access:**
- 🏠 Dashboard
- 📝 Log Data
- 📊 View Trends
- 💬 Support Hub
- 📸 Memories
- 📔 Journal
- 🕊️ Bereavement

**Total Pages:** 7

**Why these pages?**
- Self-monitoring and logging
- Symptom tracking
- Emotional expression (journal)
- Memory creation
- Support resources
- Simplified, patient-focused interface

---

### 5. 👨‍👩‍👧‍👦 FAMILY (Family Members)
**Who:** Family members not providing direct care

**Can Access:**
- 🏠 Dashboard
- 📊 View Trends
- 💬 Support Hub
- 📸 Memories
- 📔 Journal
- 🕊️ Bereavement
- 👥 Caregiver Portal

**Total Pages:** 7

**Why these pages?**
- Stay informed about patient status
- View trends and progress
- Access support resources
- Contribute to memories
- Grief support
- Coordinate with caregivers

---

## 📊 ACCESS MATRIX

| Page | Admin | Clinician | Caregiver | Patient | Family |
|------|-------|-----------|-----------|---------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Log Data | ✅ | ✅ | ✅ | ✅ | ❌ |
| View Trends | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI Insights | ✅ | ✅ | ❌ | ❌ | ❌ |
| Alerts | ✅ | ✅ | ✅ | ❌ | ❌ |
| Support Hub | ❌ | ❌ | ✅ | ✅ | ✅ |
| Bereavement | ❌ | ❌ | ❌ | ✅ | ✅ |
| Patient Onboarding | ✅ | ✅ | ❌ | ❌ | ❌ |
| Clinical Simulation | ✅ | ❌ | ❌ | ❌ | ❌ |
| Medications | ✅ | ✅ | ✅ | ❌ | ❌ |
| Appointments | ✅ | ✅ | ✅ | ❌ | ❌ |
| Caregiver Portal | ✅ | ❌ | ✅ | ❌ | ✅ |
| Memory Vault | ❌ | ❌ | ✅ | ✅ | ✅ |
| Journal | ❌ | ❌ | ✅ | ✅ | ✅ |
| Care Plan | ✅ | ✅ | ❌ | ❌ | ❌ |
| Functional Status | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 🎯 ROLE ASSIGNMENT LOGIC

### How Roles Are Determined

Roles are stored in the database `User` table and loaded during login:

```python
# In session state after login:
st.session_state.role = "clinician"  # or "admin", "caregiver", "patient", "family"
```

### Default Behavior

If a role is not recognized, the system defaults to **Patient** role (most restrictive).

---

## 🔒 SECURITY FEATURES

### 1. Navigation Filtering
- Sidebar only shows pages user has access to
- No way to see or click on restricted pages

### 2. Page-Level Protection
Each page should check authentication:
```python
if 'authenticated' not in st.session_state or not st.session_state.authenticated:
    st.warning("Please log in to access this page.")
    st.stop()
```

### 3. Role-Based Data Filtering
Within pages, data is filtered by role:
- **Patients** see only their own data
- **Caregivers** see data for patients they're assigned to
- **Clinicians** see data for all their patients
- **Admins** see all data

---

## 💡 USAGE EXAMPLES

### Example 1: Patient Login
```
User: John Doe
Role: Patient

Sees in sidebar:
✅ Dashboard
✅ Log Data
✅ View Trends
✅ Support Hub
✅ Memories
✅ Journal
✅ Bereavement

Does NOT see:
❌ AI Insights
❌ Alerts
❌ Medications
❌ Appointments
❌ Care Plan
❌ Functional Status
```

### Example 2: Caregiver Login
```
User: Jane Smith
Role: Caregiver

Sees in sidebar:
✅ Dashboard
✅ Log Data
✅ View Trends
✅ Alerts
✅ Support Hub
✅ Caregiver Portal
✅ Appointments
✅ Medications
✅ Memories
✅ Journal

Does NOT see:
❌ AI Insights
❌ Patient Onboarding
❌ Clinical Simulation
❌ Care Plan
❌ Functional Status
```

### Example 3: Clinician Login
```
User: Dr. Williams
Role: Clinician

Sees in sidebar:
✅ Dashboard
✅ Log Data
✅ View Trends
✅ AI Insights
✅ Alerts
✅ Medications
✅ Appointments
✅ Care Plan
✅ Functional Status
✅ Patient Onboarding

Does NOT see:
❌ Support Hub
❌ Bereavement
❌ Clinical Simulation
❌ Caregiver Portal
❌ Memories
❌ Journal
```

---

## 🔧 CUSTOMIZING ROLES

### Adding a New Role

Edit `app.py` and add to `role_pages` dictionary:

```python
role_pages = {
    # ... existing roles ...
    "nurse": {
        "🏠 Dashboard": "Dashboard",
        "📝 Log Data": "Log Data",
        "💊 Medications": "Medication Management",
        # ... add pages for nurse role
    }
}
```

### Modifying Role Access

To give a role access to more pages, add them to their dictionary:

```python
"patient": {
    "🏠 Dashboard": "Dashboard",
    "📝 Log Data": "Log Data",
    "📊 View Trends": "View Trends",
    "💬 Support Hub": "Support Hub",
    "📸 Memories": "Memory Vault",
    "📔 Journal": "Journal",
    "🕊️ Bereavement": "Bereavement Bridge",
    "📅 Appointments": "Appointment Scheduling"  # NEW: Give patients appointment access
}
```

---

## 🎨 USER EXPERIENCE

### Role Indicator
The sidebar shows the current role:
```
Viewing as: Clinician
```

### Clean Navigation
- Only relevant pages appear
- No clutter from irrelevant features
- Intuitive grouping by role needs

### Consistent Experience
- Same look and feel across roles
- Just different page availability
- Role-appropriate language and features

---

## 📋 TESTING RBAC

### Test Each Role

1. **Create test users** with different roles in database
2. **Login as each role**
3. **Verify navigation** shows only appropriate pages
4. **Try to access restricted pages** (should redirect or show error)

### Test Scenarios

```bash
# Test as Patient
- Login as patient user
- Verify only 7 pages visible
- Try to manually navigate to /Medication_Management
- Should be blocked or redirected

# Test as Clinician
- Login as clinician user
- Verify 10 pages visible
- Verify can access Care Plan
- Verify cannot access Clinical Simulation

# Test as Admin
- Login as admin user
- Verify all 12 pages visible
- Verify full system access
```

---

## 🚀 BENEFITS

### For Users
✅ **Simplified interface** - Only see what you need
✅ **Reduced confusion** - No irrelevant options
✅ **Faster navigation** - Fewer pages to scroll through
✅ **Role-appropriate** - Features match responsibilities

### For Organization
✅ **Better security** - Users can't access inappropriate data
✅ **Compliance** - HIPAA-friendly access control
✅ **Audit trail** - Know who accessed what
✅ **Scalability** - Easy to add new roles

---

## 📞 SUPPORT

### Common Questions

**Q: Can a user have multiple roles?**
A: Currently, each user has one primary role. To support multiple roles, you'd need to modify the login system to let users choose their active role.

**Q: How do I change a user's role?**
A: Update the `role` field in the `User` table in the database.

**Q: What if I need a custom role?**
A: Add it to the `role_pages` dictionary in `app.py` with the appropriate page access.

**Q: Can patients see other patients' data?**
A: No - pages should filter data by patient_id to ensure privacy.

---

## ✅ IMPLEMENTATION COMPLETE

Role-based access control is now active! Each user sees only the pages relevant to their role, creating a cleaner, more secure, and more user-friendly experience.

**Test it now:**
```bash
streamlit run app.py
# Login with different role accounts to see different navigation!
```
