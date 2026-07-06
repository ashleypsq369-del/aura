# 🧪 Test Questionnaire - Step by Step

**Quick test to see if questionnaire works**

---

## 🚀 Test Right Now (5 minutes)

### **Step 1: Prepare**

**Open TWO browser tabs:**
1. Tab 1: Frontend `http://localhost:5173`
2. Tab 2: Browser Console (Press F12)

---

### **Step 2: Clear Data**

**In Console tab, paste and run:**
```javascript
localStorage.clear();
sessionStorage.clear();
alert('✅ Cleared! Close this alert and refresh the page.');
location.reload();
```

---

### **Step 3: Register**

1. Go to: `http://localhost:5173/register`
2. Fill form:
   ```
   Full Name:  Test Questionnaire
   Username:   testquest123
   Email:      quest@test.com
   Password:   Quest1234
   Role:       Patient  ← IMPORTANT
   ```
3. ✅ Check: "I agree to terms..."
4. **BEFORE clicking "Create Account":**
   - Switch to Console tab (F12)
   - Keep it visible
5. **NOW click: "Create Account"**

---

### **Step 4: Watch Console**

**You should see output like:**

```javascript
🔍 Registration Response: {
  user: {
    id: 15,
    username: "testquest123",
    email: "quest@test.com",
    role: "patient",
    full_name: "Test Questionnaire",
    needs_questionnaire: true  ← LOOK FOR THIS
  },
  needs_questionnaire: true,
  role: "patient"
}
```

**Then one of:**
```javascript
✅ Redirecting to questionnaire at /setup
```
**OR**
```javascript
❌ Skipping questionnaire, going to dashboard
```

---

### **Step 5: Result**

#### **✅ SUCCESS (You see questionnaire):**

**URL:** `http://localhost:5173/setup`

**Screen shows:**
```
┌────────────────────────────────────┐
│ Step 1 of 7                   14%  │
├────────────────────────────────────┤
│                                    │
│ Let's get to know you              │
│                                    │
│ This helps us make Project Aura    │
│ feel like it was built just for you│
│                                    │
│ What language do you prefer?       │
│                                    │
│ ○ English                          │
│ ○ Twi                              │
│ ○ Ga                               │
│ ○ Ewe                              │
│ ○ Hausa                            │
│ ○ Dagbani                          │
│                                    │
│ [ Back ]              [ Next → ]   │
└────────────────────────────────────┘
```

**What to do:** Continue testing! Fill Step 1 and click Next.

---

#### **❌ PROBLEM (No questionnaire):**

**URL:** `http://localhost:5173/dashboard` or `/my-space`

**Console shows:**
```javascript
❌ Skipping questionnaire, going to dashboard
```

**What this means:**
- Backend is NOT returning `needs_questionnaire: true`
- Need to check backend response

**Next steps:**
1. Check Network tab
2. Find: `POST /api/auth/register`
3. Look at Response
4. Check if `needs_questionnaire: true` is there

---

## 🔍 Detailed Diagnostics

### **Check Network Tab**

1. Open DevTools (F12)
2. Go to "Network" tab
3. Filter: "Fetch/XHR"
4. Look for: `register`
5. Click on it
6. Check "Response" tab

**Should show:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 15,
    "username": "testquest123",
    "email": "quest@test.com",
    "role": "patient",
    "full_name": "Test Questionnaire",
    "phone": null,
    "consent_given": false,
    "needs_questionnaire": true  ← MUST BE HERE
  }
}
```

**If `needs_questionnaire` is missing or `false`:**
- Backend issue
- Check `backend/routers/auth.py` line 225-239

---

## 🎯 Quick Fixes

### **Fix 1: Backend Not Returning Flag**

**Check backend console for errors**

**Restart backend:**
```bash
cd backend
# Stop with Ctrl+C
uvicorn main:app --reload
```

**Look for:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Started reloader process
INFO:     Application startup complete.
```

---

### **Fix 2: Frontend Not Redirecting**

**Temporarily force redirect:**

Edit `frontend/src/pages/Register.jsx` line 33:

```javascript
// TEMPORARY FIX - Force redirect for patients
onSuccess: (response) => {
  const { access_token, user } = response.data;
  localStorage.setItem('auth_token', access_token);
  localStorage.setItem('user', JSON.stringify(user));
  
  toast.success('Account created successfully!');
  
  // Force redirect for testing
  if (user.role === 'patient' || user.role === 'family') {
    console.log('🔧 FORCING redirect to /setup');
    navigate('/setup');
    return;
  }
  
  // Original logic
  if (user.needs_questionnaire) {
    navigate('/setup');
  } else {
    navigate('/dashboard');
  }
}
```

---

### **Fix 3: /setup Route Missing**

**Verify route exists:**

Check `frontend/src/App.jsx` around line 123:

```javascript
<Route 
  path="/setup" 
  element={
    <ProtectedRoute>
      <PersonalisationQuest />
    </ProtectedRoute>
  } 
/>
```

**If missing, add it!**

---

## 📊 What Success Looks Like

### **Console Output:**
```
✅ Offline cache database initialized
✅ Touch Support initialized
✅ IndexedDB initialized
Account created successfully!
🔍 Registration Response: {
  user: { ... },
  needs_questionnaire: true,
  role: "patient"
}
✅ Redirecting to questionnaire at /setup
```

### **Browser:**
- URL: `http://localhost:5173/setup`
- Shows questionnaire Step 1
- Progress bar: "Step 1 of 7 (14%)"
- Can click Next button
- Can fill form fields

---

## 🎬 Complete Test (If Working)

**If you see the questionnaire, complete full test:**

1. **Step 1:** Select language, info style, tech comfort → Click Next
2. **Step 2:** Select diagnosis duration, emotional states → Click Next  
3. **Step 3:** Select symptoms, activity level, self-care → Click Next
4. **Step 4:** Set mood slider, select coping strategies → Click Next
5. **Step 5:** Select religion, spiritual importance → Click Next
6. **Step 6:** Select support person, connectedness → Click Next
7. **Step 7:** Select content prefs, frequency, topics → Click **Complete**

**Expected:**
- Shows green checkmark
- Message: "You're all set!"
- After 2 seconds → Redirects to `/my-space`

**Then:**
- Logout
- Login again with same credentials
- Should go to `/my-space` directly
- Should NOT show questionnaire again

---

## 📝 Report Results

**After testing, report:**

**✅ If it worked:**
```
✅ SUCCESS!
- Registered as patient
- Console showed: needs_questionnaire: true
- Redirected to /setup
- Saw questionnaire Step 1
- Could navigate through steps
```

**❌ If it didn't work:**
```
❌ FAILED
- Registered as patient
- Console showed: [paste console output]
- Redirected to: [url]
- Network response: [paste response from Network tab]
- Backend console: [any errors?]
```

---

**Created**: June 5, 2026  
**Purpose**: Quick test guide with debugging  
**Time**: 5 minutes to complete test
