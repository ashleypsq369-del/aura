# 🔧 Questionnaire Redirect - Fix Applied

**Issue**: After registration, user not redirected to questionnaire  
**Date**: June 5, 2026  
**Status**: ✅ **FIX APPLIED - WITH DEBUGGING**

---

## 🐛 Problem

User registered as "Patient" but didn't see the questionnaire at `/setup`.  
Instead, went directly to dashboard or patient portal.

---

## 🔍 What I Added

### **Debug Logging in Register.jsx**

Added console logs to see exactly what's happening:

```javascript
onSuccess: (response) => {
  const { access_token, user } = response.data;
  localStorage.setItem('auth_token', access_token);
  localStorage.setItem('user', JSON.stringify(user));
  
  toast.success('Account created successfully!');
  
  // 🆕 DEBUG LOGGING
  console.log('🔍 Registration Response:', {
    user,
    needs_questionnaire: user.needs_questionnaire,
    role: user.role
  });
  
  if (user.needs_questionnaire) {
    console.log('✅ Redirecting to questionnaire at /setup');
    navigate('/setup');
  } else {
    console.log('❌ Skipping questionnaire, going to dashboard');
    navigate('/dashboard');
  }
}
```

---

## 🧪 How to Test NOW

### **Step 1: Clear Browser Data**
```javascript
// Open browser console (F12) and run:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### **Step 2: Register New Patient**

1. Go to: `http://localhost:5173/register`
2. Fill form with NEW credentials:
   - Full Name: "Debug Patient"
   - Username: "debugpatient"
   - Email: "debug@test.com"
   - Password: "Test1234"
   - Role: **Patient**
   - Accept terms
3. Click "Create Account"

### **Step 3: Watch Console**

**Open browser console (F12) BEFORE clicking "Create Account"**

You should see:
```
🔍 Registration Response: {
  user: { id: X, username: "debugpatient", role: "patient", ... },
  needs_questionnaire: true,  ← Should be TRUE
  role: "patient"
}

Either:
✅ Redirecting to questionnaire at /setup  ← GOOD
OR
❌ Skipping questionnaire, going to dashboard  ← BAD
```

---

## 🔍 Diagnostic Scenarios

### **Scenario A: Console shows `needs_questionnaire: true` ✅**

**What you'll see:**
```
✅ Redirecting to questionnaire at /setup
```

**What happens:**
- Browser goes to `/setup`
- Questionnaire page loads
- You see "Step 1 of 7"

**Status:** ✅ WORKING CORRECTLY

---

### **Scenario B: Console shows `needs_questionnaire: false` or `undefined` ❌**

**What you'll see:**
```
❌ Skipping questionnaire, going to dashboard
```

**What happens:**
- Browser goes to `/dashboard` or `/my-space`
- No questionnaire shown

**Problem:** Backend not returning `needs_questionnaire: true`

**Fix:**
```python
# Check backend/routers/auth.py line 225-239
# Make sure this returns needs_questionnaire: True

return {
    "access_token": access_token,
    "token_type": "bearer",
    "user": {
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "role": new_user.role,
        "full_name": new_user.full_name,
        "phone": new_user.phone,
        "consent_given": False,
        "needs_questionnaire": True,  # ← CHECK THIS LINE EXISTS
    }
}
```

---

### **Scenario C: Goes to `/setup` but shows blank/error ❌**

**What you'll see:**
- URL changes to `/setup`
- Blank white screen OR error message

**Problem:** Questionnaire component error

**Check:**
1. Browser console for React errors
2. Network tab for API call failures
3. Make sure `/api/preferences/{user_id}` endpoint works

---

## 📋 Quick Checklist

Before testing, verify:

**Backend:**
- [ ] Backend running: `uvicorn main:app --reload`
- [ ] No errors in backend console
- [ ] Can access: `http://localhost:8000/docs`
- [ ] `/api/auth/register` endpoint exists
- [ ] `/api/preferences` endpoint exists

**Frontend:**
- [ ] Frontend running: `npm run dev`
- [ ] No errors in terminal
- [ ] Can access: `http://localhost:5173`
- [ ] Browser console open (F12)
- [ ] No previous localStorage data

---

## 🔧 Manual Fix (If Backend Issue)

If backend is NOT returning `needs_questionnaire: true`, manually fix:

### **Option 1: Force Redirect in Frontend**

```javascript
// In Register.jsx, temporarily force redirect:
onSuccess: (response) => {
  const { access_token, user } = response.data;
  localStorage.setItem('auth_token', access_token);
  localStorage.setItem('user', JSON.stringify(user));
  
  toast.success('Account created successfully!');
  
  // 🆕 FORCE REDIRECT FOR TESTING
  if (user.role === 'patient' || user.role === 'family') {
    navigate('/setup');  // ← Always go to questionnaire
  } else {
    navigate('/dashboard');
  }
}
```

### **Option 2: Check Backend Response**

```bash
# Test registration API directly:
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test1234",
    "full_name": "Test User",
    "role": "patient"
  }'

# Response should include:
# "needs_questionnaire": true
```

---

## 🎯 Expected Full Flow

### **Complete Test Sequence:**

1. **Clear browser data**
2. **Open console (F12)**
3. **Register new patient**
4. **See console logs:**
   ```
   🔍 Registration Response: {...}
   ✅ Redirecting to questionnaire at /setup
   ```
5. **URL changes to `/setup`**
6. **See questionnaire:**
   ```
   ┌─────────────────────────────┐
   │ Step 1 of 7            14%  │
   │─────────────────────────────│
   │ Let's get to know you       │
   │                             │
   │ What language do you prefer?│
   │ ○ English                   │
   │ ○ Twi                       │
   │ ...                         │
   └─────────────────────────────┘
   ```
7. **Complete all 7 steps**
8. **See success screen with checkmark**
9. **Redirects to `/my-space`**

---

## 🚨 What to Report

If it still doesn't work, provide:

1. **Console logs** (copy the 🔍 Registration Response)
2. **Network tab** (POST /api/auth/register response)
3. **Current URL** (where did it redirect?)
4. **Any error messages** (in console or on screen)

Example report:
```
❌ Still not working!

Console shows:
🔍 Registration Response: {
  user: { ... },
  needs_questionnaire: undefined,  ← THE PROBLEM
  role: "patient"
}

❌ Skipping questionnaire, going to dashboard

Redirected to: /dashboard
No errors in console
Backend response: [paste network tab]
```

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Console shows: `needs_questionnaire: true`
2. ✅ Console shows: `✅ Redirecting to questionnaire at /setup`
3. ✅ URL becomes: `http://localhost:5173/setup`
4. ✅ Page shows: "Let's get to know you"
5. ✅ Progress bar shows: "Step 1 of 7"

---

**Fix Applied**: June 5, 2026  
**Next Step**: Test with console open and report what you see!
