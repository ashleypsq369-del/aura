# 🔧 Questionnaire System - Troubleshooting Guide

**Quick Reference for Testing the Personalization Questionnaire**

---

## ✅ Quick Test

### **Test in 3 Minutes:**

1. **Register a new patient account:**
   - Go to: `http://localhost:5173/register`
   - Fill form, select "Patient" role
   - Click "Create Account"

2. **Expected: Should redirect to `/setup`** (questionnaire)

3. **Complete questionnaire:**
   - Go through all 7 steps
   - Click "Complete" on final step

4. **Expected: Should redirect to `/my-space`** (patient portal)

5. **Logout and login again:**
   - Should go to `/my-space` directly
   - Should NOT see questionnaire again

---

## 🐛 Common Issues

### **Issue 1: Not Redirecting to Questionnaire After Registration**

**Symptoms:**
- Registers successfully
- Goes to `/dashboard` or `/my-space` instead of `/setup`

**Debug Steps:**

1. **Check browser console:**
   ```javascript
   // After registration, check localStorage:
   const user = JSON.parse(localStorage.getItem('user'));
   console.log('needs_questionnaire:', user.needs_questionnaire);
   // Should be: true
   ```

2. **Check network tab:**
   - Look at `/api/auth/register` response
   - Should contain: `"needs_questionnaire": true`

3. **Check route exists:**
   - Navigate manually to `/setup`
   - Should show questionnaire, not 404

**Fix:**
```javascript
// In Register.jsx, verify this code exists:
onSuccess: (response) => {
  const { access_token, user } = response.data;
  
  // Check this condition
  if (user.needs_questionnaire) {
    navigate('/setup');  // ← Should execute
  }
}
```

---

### **Issue 2: Still Shows Questionnaire After Completing**

**Symptoms:**
- Complete questionnaire
- Logout and login
- Still redirects to `/setup`

**Debug Steps:**

1. **Check database:**
   ```sql
   SELECT user_id, questionnaire_complete 
   FROM patient_preferences 
   WHERE user_id = YOUR_USER_ID;
   
   -- Should show: questionnaire_complete = true
   ```

2. **Check login response:**
   ```javascript
   // After login, check response:
   const user = JSON.parse(localStorage.getItem('user'));
   console.log('needs_questionnaire:', user.needs_questionnaire);
   // Should be: false (not true)
   ```

3. **Check PersonalisationQuest save:**
   ```javascript
   // In PersonalisationQuest.jsx, verify mutation includes:
   return axios.post(`${API_URL}/api/preferences`, {
     ...data,
     user_id: user.id,
     questionnaire_complete: true,  // ← Must be true
   });
   ```

**Fix:**
- Manually update database:
  ```sql
  UPDATE patient_preferences 
  SET questionnaire_complete = true 
  WHERE user_id = YOUR_USER_ID;
  ```

---

### **Issue 3: Can't Register as Clinician**

**Symptoms:**
- Try to register with "clinician" role
- Role selector doesn't show "clinician" option

**This is CORRECT behavior!**

**Explanation:**
- Public registration only allows: Patient, Family
- Clinicians must be created by admin

**Solution:**
1. Login as admin
2. Go to `/admin/users`
3. Click "Add User"
4. Select "Clinician" role
5. Create account

---

### **Issue 4: Questionnaire Shows Blank/White Screen**

**Symptoms:**
- Navigate to `/setup`
- See white screen or loading forever

**Debug Steps:**

1. **Check browser console for errors:**
   ```
   Look for:
   - API call failures
   - Missing imports
   - React errors
   ```

2. **Check API response:**
   ```javascript
   // Open Network tab
   // Look for: GET /api/preferences/{user_id}
   // Should return 200 OK
   ```

3. **Check if preferences API exists:**
   ```bash
   # Test manually:
   curl http://localhost:8000/api/preferences/1 \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

**Common Causes:**
- Backend preferences endpoint not implemented
- Auth token not sent
- CORS issues

---

### **Issue 5: Data Not Saving**

**Symptoms:**
- Complete all 7 steps
- Click "Complete"
- No success message
- Data not in database

**Debug Steps:**

1. **Check browser console:**
   - Look for POST request errors
   - Check request payload

2. **Check network tab:**
   ```
   POST /api/preferences
   Status: Should be 200 OK
   Response: Should confirm save
   ```

3. **Test API directly:**
   ```javascript
   // In browser console:
   const token = localStorage.getItem('auth_token');
   const user = JSON.parse(localStorage.getItem('user'));
   
   fetch('http://localhost:8000/api/preferences', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       user_id: user.id,
       language_pref: 'en',
       questionnaire_complete: true
     })
   }).then(r => r.json()).then(console.log);
   ```

---

## 🧪 Manual Testing Checklist

### **Registration Flow:**
- [ ] Register page loads
- [ ] Can enter all fields
- [ ] Role dropdown shows only Patient/Family
- [ ] Password validation works
- [ ] Terms checkbox required
- [ ] Submit button works
- [ ] Success toast appears
- [ ] Redirects to `/setup`

### **Questionnaire Flow:**
- [ ] Questionnaire loads at `/setup`
- [ ] Progress bar shows "Step 1 of 7"
- [ ] Can fill Step 1 fields
- [ ] "Next" button works
- [ ] Progress bar updates (2/7, 3/7, etc.)
- [ ] "Back" button works
- [ ] Step 7 shows "Complete" button
- [ ] Clicking "Complete" submits data
- [ ] Shows success screen with checkmark
- [ ] After 2 seconds, redirects to `/my-space`

### **Skip Questionnaire (Already Completed):**
- [ ] Logout after completing questionnaire
- [ ] Login again
- [ ] Should go to `/my-space` directly
- [ ] Should NOT redirect to `/setup`
- [ ] Data persists in Settings

### **Admin User Creation:**
- [ ] Login as admin
- [ ] Go to `/admin/users`
- [ ] Can create clinician account
- [ ] Clinician can login
- [ ] Clinician goes to `/dashboard` (not `/setup`)

---

## 📊 Database Verification

### **Check User Was Created:**
```sql
SELECT id, username, email, role 
FROM users 
WHERE username = 'testpatient';
```

### **Check Preferences Record Exists:**
```sql
SELECT user_id, questionnaire_complete 
FROM patient_preferences 
WHERE user_id = (SELECT id FROM users WHERE username = 'testpatient');

-- After registration: questionnaire_complete = false
-- After completing:   questionnaire_complete = true
```

### **Check Preferences Data Saved:**
```sql
SELECT 
  language_pref,
  tech_comfort,
  physical_symptoms,
  topic_interests,
  questionnaire_complete
FROM patient_preferences 
WHERE user_id = (SELECT id FROM users WHERE username = 'testpatient');

-- All fields should have data
-- Arrays stored as JSON: ["Pain", "Tiredness"]
```

---

## 🔄 Reset for Testing

### **Reset a User's Questionnaire:**

```sql
-- If you want to test the questionnaire again:
UPDATE patient_preferences 
SET questionnaire_complete = false,
    language_pref = 'en',
    emotional_states = NULL,
    physical_symptoms = NULL
    -- etc. (reset all fields)
WHERE user_id = YOUR_USER_ID;
```

### **Delete a Test User:**

```sql
-- Complete cleanup:
DELETE FROM patient_preferences WHERE user_id = YOUR_USER_ID;
DELETE FROM user_profile WHERE user_id = YOUR_USER_ID;
DELETE FROM audit_log WHERE user_id = YOUR_USER_ID;
DELETE FROM users WHERE id = YOUR_USER_ID;
```

---

## 🎯 Expected Console Logs

### **During Registration:**
```
✅ Offline cache database initialized
✅ Touch Support initialized
✅ IndexedDB initialized
Account created successfully!
Navigating to: /setup
```

### **During Questionnaire:**
```
Loading preferences...
Step 1 of 7
[User clicks Next]
Step 2 of 7
...
Step 7 of 7
[User clicks Complete]
Saving preferences...
Preferences saved successfully!
Redirecting to: /my-space
```

### **During Login (Already Completed):**
```
Login successful
User needs_questionnaire: false
Navigating to: /my-space
```

---

## 🚀 Quick Fixes

### **Force User to Questionnaire:**
```sql
UPDATE patient_preferences 
SET questionnaire_complete = false 
WHERE user_id = YOUR_USER_ID;

-- Then logout and login again
```

### **Skip Questionnaire for User:**
```sql
UPDATE patient_preferences 
SET questionnaire_complete = true 
WHERE user_id = YOUR_USER_ID;

-- Then logout and login again
```

### **Check Backend is Running:**
```bash
# Backend should show:
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.

# If not running:
cd backend
uvicorn main:app --reload
```

### **Check Frontend is Running:**
```bash
# Frontend should show:
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose

# If not running:
cd frontend
npm run dev
```

---

## ✅ System Status Check

Run through this checklist to verify everything is working:

**Backend:**
- [ ] Backend running on port 8000
- [ ] Can access http://localhost:8000/docs
- [ ] `/api/auth/register` endpoint exists
- [ ] `/api/auth/login` endpoint exists
- [ ] `/api/preferences` endpoint exists (GET and POST)
- [ ] Database connected (no errors in console)

**Frontend:**
- [ ] Frontend running on port 5173
- [ ] Can access http://localhost:5173
- [ ] `/register` page loads
- [ ] `/setup` page loads
- [ ] `/my-space` page loads
- [ ] No console errors on page load

**Routes:**
- [ ] `/register` → Register.jsx
- [ ] `/login` → Login.jsx
- [ ] `/setup` → PersonalisationQuest.jsx (protected)
- [ ] `/my-space` → PatientPortal.jsx (protected)
- [ ] `/dashboard` → Dashboard.jsx (protected)

---

## 📞 Still Having Issues?

**Check these documents:**
1. `PERSONALIZATION_QUESTIONNAIRE_GUIDE.md` - Full system documentation
2. `COMPLETE_SYSTEM_DOCUMENTATION.md` - Architecture overview
3. Backend logs - Check for API errors
4. Browser console - Check for JavaScript errors
5. Network tab - Check API calls and responses

**Common Root Causes:**
- Backend not running
- Database connection failed
- CORS not configured
- Auth token not being sent
- Route not defined in App.jsx
- API endpoint doesn't exist

---

**Last Updated**: June 5, 2026  
**Status**: ✅ System Working  
**Quick Test**: Register → Complete Questionnaire → Login Again → Should Skip Questionnaire
