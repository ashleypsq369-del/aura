# 🧪 RBAC Testing Guide

## Quick Test Procedure

### 1. Start the Application
```bash
streamlit run app.py
```

### 2. Test Login & Clean UI

**Expected Behavior:**
- ✅ App opens directly to Login page
- ✅ NO hamburger menu visible
- ✅ NO "Made with Streamlit" footer
- ✅ NO "Deploy" button
- ✅ Clean, professional login interface

### 3. Test Admin Role (Full Access)

**Login:**
- Username: `admin`
- Password: `admin123`

**Expected:**
- ✅ Redirected to Dashboard
- ✅ Sidebar shows user badge: "👑 admin - Administrator"
- ✅ Navigation menu shows ALL 16 pages (grouped by category)
- ✅ Can access any page
- ✅ Logout button at bottom of sidebar

**Test Navigation:**
1. Click "📊 Dashboard" → Should load
2. Click "🤖 AI Insights" → Should load
3. Click "🎯 Simulation" → Should load
4. Click "📋 Onboarding" → Should load

### 4. Test Clinician Role (Clinical Tools)

**Logout first, then login:**
- Username: `doctor`
- Password: `doctor123`

**Expected:**
- ✅ Sidebar shows: "👨‍⚕️ doctor - Clinician"
- ✅ Navigation menu shows 12 pages (clinical focus)
- ✅ Can access: Dashboard, Log Data, AI Insights, Alerts, etc.
- ✅ CANNOT see: Bereavement, Caregiver Portal, Memory Vault, Journal

**Test Access Control:**
1. Try to manually navigate to a restricted page
2. Should be blocked and redirected to Dashboard

### 5. Test Family Role (Family Features)

**Logout first, then login:**
- Username: `family`
- Password: `family123`

**Expected:**
- ✅ Sidebar shows: "👨‍👩‍👧‍👦 family - Family Member"
- ✅ Navigation menu shows 8 pages (family focus)
- ✅ Can access: Dashboard, Support Hub, Bereavement, Caregiver Portal, Memory Vault, Journal
- ✅ CANNOT see: AI Insights, Alerts, Clinical Simulation, Medications, Care Plan

### 6. Test Patient Role (Patient Tools)

**Logout first, then login:**
- Username: `patient`
- Password: `patient123`

**Expected:**
- ✅ Sidebar shows: "🤗 patient - Patient"
- ✅ Navigation menu shows 7 pages (patient focus)
- ✅ Can access: Dashboard, Log Data, View Trends, Support Hub, Appointments, Memory Vault, Journal
- ✅ CANNOT see: AI Insights, Alerts, Clinical tools, Admin features

### 7. Test Security Features

**Test 1: Unauthorized Access**
1. Login as patient
2. Try to access: `http://localhost:8501/5_AI_Insights`
3. Expected: Blocked with error message, redirected to Dashboard

**Test 2: Session Management**
1. Login successfully
2. Close browser
3. Reopen and navigate to app
4. Expected: Redirected to login (session cleared)

**Test 3: Logout**
1. Login with any account
2. Click "🚪 Logout" button
3. Expected: Session cleared, redirected to login

### 8. Verify Clean UI

**Check these elements are HIDDEN:**
- ❌ Hamburger menu (top right)
- ❌ "Made with Streamlit" footer
- ❌ "Deploy" button
- ❌ Streamlit branding
- ❌ Settings menu

**Check these elements are VISIBLE:**
- ✅ Custom navigation menu in sidebar
- ✅ User role badge
- ✅ Logout button
- ✅ Page content
- ✅ Clean, professional interface

---

## 🎯 Success Criteria

All tests should pass:
- [x] Login required for all pages
- [x] Each role sees different navigation menu
- [x] Access control enforced (unauthorized pages blocked)
- [x] Streamlit UI elements hidden
- [x] Custom navigation works
- [x] Logout clears session
- [x] User badge displays correctly
- [x] Smooth page transitions

---

## 🐛 Troubleshooting

### Issue: Hamburger menu still visible
**Solution:** Clear browser cache and refresh

### Issue: Can access unauthorized pages
**Solution:** Check `src/rbac.py` permissions are correct

### Issue: Navigation menu not showing
**Solution:** Verify `setup_page()` is called in page

### Issue: Login not working
**Solution:** Run `python scripts/setup_demo_users.py`

---

## 📊 Expected Navigation Menus

### Admin (16 pages)
```
Overview
  📊 Dashboard

Clinical
  📝 Log Data
  💊 Medications
  📋 Care Plan
  🏃 Functional Status

Analytics
  📈 View Trends
  🤖 AI Insights
  🔔 Alerts

Support
  💬 Support Hub
  🕊️ Bereavement

Admin
  📋 Onboarding

Training
  🎯 Simulation

Coordination
  📅 Appointments

Support
  👥 Caregiver Portal

Personal
  📸 Memory Vault
  📔 Journal
```

### Clinician (12 pages)
```
Overview
  📊 Dashboard

Clinical
  📝 Log Data
  💊 Medications
  📋 Care Plan
  🏃 Functional Status

Analytics
  📈 View Trends
  🤖 AI Insights
  🔔 Alerts

Support
  💬 Support Hub

Admin
  📋 Onboarding

Training
  🎯 Simulation

Coordination
  📅 Appointments
```

### Family (8 pages)
```
Overview
  📊 Dashboard

Analytics
  📈 View Trends

Support
  💬 Support Hub
  🕊️ Bereavement
  👥 Caregiver Portal

Coordination
  📅 Appointments

Personal
  📸 Memory Vault
  📔 Journal
```

### Patient (7 pages)
```
Overview
  📊 Dashboard

Clinical
  📝 Log Data

Analytics
  📈 View Trends

Support
  💬 Support Hub

Coordination
  📅 Appointments

Personal
  📸 Memory Vault
  📔 Journal
```

---

## ✅ Final Verification

Run through this checklist:

1. [ ] App starts and shows login page
2. [ ] No Streamlit branding visible
3. [ ] Admin can access all pages
4. [ ] Clinician sees only clinical pages
5. [ ] Family sees only family pages
6. [ ] Patient sees only patient pages
7. [ ] Unauthorized access is blocked
8. [ ] Navigation menu works smoothly
9. [ ] Logout clears session
10. [ ] User badge shows correct role

**If all checked: RBAC is working perfectly! ✅**
