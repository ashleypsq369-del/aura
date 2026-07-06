# 🔐 Project Aura - Role-Based Access Guide

## Complete Feature Access Matrix

This document shows **exactly** what features and components each user role can access in Project Aura.

---

## 👤 User Roles & Credentials

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| **Admin** | `admin` | `admin123` | System Administration |
| **Clinician** | `clinician` | `clinician123` | Full Clinical Access |
| **Caregiver** | `caregiver` | `caregiver123` | Limited Clinical Access |
| **Family** | `family` | `family123` | Family/Support Access |
| **Patient** | `patient` | `patient123` | Personal Health Access |

---

## 🔑 ROLE 1: ADMIN

### Sidebar Navigation:
1. ✅ **Overview** (Dashboard)
2. ✅ **Patients** (Patient List)
3. ✅ **AI Insights** (Proactive Patient Analysis)
4. ✅ **Alerts** (System Alerts)

### Dashboard Content:
- ✅ Statistics Cards:
  - Total Patients
  - High Risk Patients
  - Active Alerts
  - Average Pain Score
- ✅ Recent Patients Table (clickable to monitor)

### Additional Access:
- ✅ AI Chatbot (floating button)
- ✅ Can view all patient details
- ✅ Can access patient monitoring pages
- ✅ Full system overview

### Backend Permissions:
- ✅ **ALL PERMISSIONS** (unrestricted access)

### What Admin CANNOT See:
- ❌ Medications page (not in sidebar)
- ❌ Appointments page (not in sidebar)
- ❌ Caregivers page (not in sidebar)
- ❌ Care Guide (not in sidebar)
- ❌ Continuity Bridge (not in sidebar)
- ❌ Memory Vault (not in sidebar)
- ❌ Journal (not in sidebar)

**Note:** Admin can still ACCESS these pages by typing the URL directly (e.g., `/medications`), but they're not shown in the navigation menu.

---

## 🔑 ROLE 2: CLINICIAN (MOST COMPREHENSIVE ACCESS)

### Sidebar Navigation:
1. ✅ **Dashboard** (Clinical Dashboard)
2. ✅ **Patients** (Patient List)
3. ✅ **AI Insights** (Proactive Patient Analysis)
4. ✅ **Alerts** (Clinical Alerts)
5. ✅ **Medications** (Medication Management)
6. ✅ **Appointments** (Appointment Scheduling)
7. ✅ **Caregivers** (Caregiver Management)
8. ✅ **Care Guide** (Clinical Guidelines)
9. ✅ **Continuity Bridge** (Bereavement Resources)

### Dashboard Content:
- ✅ Full statistics dashboard with:
  - Total Patients count
  - High Risk Patients count
  - Active Alerts count
  - Average Pain Score
- ✅ Complete patient table with:
  - Patient name, age, diagnosis
  - Risk levels (color-coded)
  - Care pathways
  - Click to monitor individual patients

### Features Available:
- ✅ View all patients
- ✅ Monitor patient vitals, symptoms, medications
- ✅ Log vitals and symptoms
- ✅ Create and manage appointments
- ✅ View and acknowledge alerts
- ✅ Access AI insights and recommendations
- ✅ View and manage medications
- ✅ Access bereavement resources
- ✅ AI Chatbot with clinical queries

### Backend Permissions:
- ✅ `patients:read` + `patients:write`
- ✅ `vitals:read` + `vitals:write`
- ✅ `symptoms:read` + `symptoms:write`
- ✅ `ai:read` + `ai:write`
- ✅ `alerts:read` + `alerts:write`
- ✅ `medications:read` + `medications:write`
- ✅ `appointments:read` + `appointments:write`
- ✅ `caregivers:read` + `caregivers:write`

### What Clinician CANNOT See:
- ❌ Memory Vault (family feature)
- ❌ Journal (patient/family feature)

**Clinician has the MOST comprehensive clinical access!**

---

## 🔑 ROLE 3: CAREGIVER

### Sidebar Navigation:
1. ✅ **Overview** (Dashboard)
2. ✅ **Patients** (Patient List)
3. ✅ **Medications** (View/Manage Medications)
4. ✅ **Appointments** (View/Manage Appointments)

### Dashboard Content:
- ⚠️ **Limited Dashboard:** Shows basic welcome message
- ❌ No statistics cards
- ❌ No patient table on dashboard

### Features Available:
- ✅ View patient list
- ✅ View patient medications (read + write)
- ✅ View and manage appointments
- ✅ AI Chatbot (limited queries)

### Backend Permissions:
- ✅ `patients:read` (view only)
- ✅ `medications:read` + `medications:write`
- ✅ `appointments:read` + `appointments:write`
- ✅ `caregivers:read`

### What Caregiver CANNOT Access:
- ❌ AI Insights page
- ❌ Alerts page
- ❌ Cannot log vitals or symptoms
- ❌ Care Guide
- ❌ Continuity Bridge
- ❌ Memory Vault
- ❌ Journal
- ❌ Full patient monitoring

---

## 🔑 ROLE 4: FAMILY

### Sidebar Navigation:
1. ✅ **Overview** (Dashboard)
2. ✅ **Continuity Bridge** (Bereavement Resources)
3. ✅ **Memory Vault** (Family Memories)
4. ✅ **Journal** (Family Journal)

### Dashboard Content:
- ⚠️ **Minimal Dashboard:** Shows welcome message only
- ❌ No statistics
- ❌ No patient list

### Features Available:
- ✅ View dashboard overview
- ✅ Access bereavement and continuity resources
- ✅ Use Memory Vault for family memories
- ✅ Read/write in family journal
- ✅ AI Chatbot (general support queries)

### Backend Permissions:
- ✅ `patients:read` (limited view)
- ✅ `bereavement:read` + `bereavement:write`

### What Family CANNOT Access:
- ❌ Patient List page
- ❌ AI Insights
- ❌ Alerts
- ❌ Medications
- ❌ Appointments
- ❌ Caregivers
- ❌ Care Guide
- ❌ Cannot log clinical data

---

## 🔑 ROLE 5: PATIENT

### Sidebar Navigation:
1. ✅ **My Health** (Personal Dashboard)
2. ✅ **My Journal** (Personal Journal)

### Dashboard Content:
- ⚠️ **Personal Dashboard:** Shows welcome message
- ❌ No system statistics
- ❌ Cannot view other patients

### Features Available:
- ✅ View own health dashboard
- ✅ Write personal journal
- ✅ Log own vitals (write access)
- ✅ Log own symptoms (write access)
- ✅ AI Chatbot (personal health queries)

### Backend Permissions:
- ✅ `vitals:write` (own data only)
- ✅ `symptoms:write` (own data only)
- ✅ `bereavement:read` + `bereavement:write`

### What Patient CANNOT Access:
- ❌ View other patients
- ❌ AI Insights
- ❌ Alerts
- ❌ Medications list
- ❌ Appointments (full page)
- ❌ Caregivers
- ❌ Care Guide
- ❌ Continuity Bridge
- ❌ Memory Vault

---

## 📊 Feature Access Matrix

| Feature | Admin | Clinician | Caregiver | Family | Patient |
|---------|-------|-----------|-----------|--------|---------|
| **Dashboard Stats** | ✅ Full | ✅ Full | ❌ Basic | ❌ Basic | ❌ Basic |
| **Patient List** | ✅ | ✅ | ✅ View | ❌ | ❌ |
| **Patient Monitoring** | ✅ | ✅ | ❌ | ❌ | ✅ Own |
| **AI Insights** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Alerts** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Medications** | ⚠️ URL only | ✅ | ✅ | ❌ | ❌ |
| **Appointments** | ⚠️ URL only | ✅ | ✅ | ❌ | ❌ |
| **Caregivers** | ⚠️ URL only | ✅ | ❌ | ❌ | ❌ |
| **Care Guide** | ⚠️ URL only | ✅ | ❌ | ❌ | ❌ |
| **Continuity Bridge** | ⚠️ URL only | ✅ | ❌ | ✅ | ❌ |
| **Memory Vault** | ⚠️ URL only | ❌ | ❌ | ✅ | ❌ |
| **Journal** | ⚠️ URL only | ❌ | ❌ | ✅ | ✅ |
| **AI Chatbot** | ✅ | ✅ | ✅ Limited | ✅ Limited | ✅ Own |
| **Log Vitals** | ✅ | ✅ | ❌ | ❌ | ✅ Own |
| **Log Symptoms** | ✅ | ✅ | ❌ | ❌ | ✅ Own |

---

## 🔍 WHY ADMIN SEES LESS THAN CLINICIAN

**This is intentional design!**

### Admin Role Purpose:
- **System oversight** and user management
- **High-level monitoring** of critical metrics
- **Alert management** and system health
- Focus on **system-wide view**, not detailed clinical work

### Clinician Role Purpose:
- **Day-to-day clinical operations**
- **Direct patient care** and monitoring
- **Comprehensive clinical tools**
- **Detailed patient management**

### Design Rationale:
1. **Separation of Concerns:** Admins manage the system, clinicians manage care
2. **Reduced Clutter:** Admins don't need all clinical workflow tools
3. **Security:** Admin focuses on oversight, not operational clinical data entry
4. **Workflow Optimization:** Each role sees only what they need for their job

---

## 🛠️ HOW TO ACCESS "HIDDEN" FEATURES AS ADMIN

As Admin, you can access any page by typing the URL directly:

```
http://localhost:5173/medications
http://localhost:5173/appointments
http://localhost:5173/caregivers
http://localhost:5173/care-guide
http://localhost:5173/continuity-bridge
http://localhost:5173/memory-vault
http://localhost:5173/journal
```

**These pages work for Admin** - they're just not shown in the sidebar navigation.

---

## 💡 RECOMMENDATIONS

### If You Want Full Feature Access:
**Login as Clinician:** `clinician` / `clinician123`
- This gives you access to ALL clinical features
- Most comprehensive sidebar navigation
- Full dashboard with statistics

### If You Want to Test Admin Features:
**Login as Admin:** `admin` / `admin123`
- System overview and monitoring
- Access to critical alerts
- Can still access other pages via URL

### If You Want to Customize:
1. Edit `frontend/src/components/layout/Sidebar.jsx`
2. Add more items to the `admin` array in the `navigation` object
3. Add the pages you want admins to see

---

## 📝 Example: Adding Medications to Admin Sidebar

Edit `Sidebar.jsx`:

```javascript
const navigation = {
  admin: [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Patients', path: '/patients', icon: Users },
    { name: 'AI Insights', path: '/ai-insights', icon: Brain },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    // ADD THIS LINE:
    { name: 'Medications', path: '/medications', icon: Pill },  // ← NEW
  ],
  // ... rest of roles
}
```

---

## 🎯 SUMMARY

| Role | Best For | Navigation Items | Dashboard Content |
|------|----------|------------------|-------------------|
| **Admin** | System oversight | 4 items | Full stats + patient table |
| **Clinician** | Clinical care | 9 items | Full stats + patient table |
| **Caregiver** | Care support | 4 items | Basic welcome |
| **Family** | Family support | 4 items | Basic welcome |
| **Patient** | Personal use | 2 items | Basic welcome |

**For testing all features:** Use **Clinician** account (`clinician`/`clinician123`)

---

## ✅ Current Status: Working as Designed

- ✅ Admin sees system-level overview (intentionally limited)
- ✅ Clinician sees full clinical workflow
- ✅ Each role has appropriate access level
- ✅ All roles can use AI Chatbot
- ✅ RBAC enforced at backend level

**Last Updated:** June 2, 2026
