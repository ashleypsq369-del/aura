# 🔧 LOGIN ISSUE - SOLUTION

## ❗ IMPORTANT: PORT CHANGED

**The frontend is now running on PORT 5174, not 5173!**

### ✅ CORRECT URL
```
http://localhost:5174
```

### ❌ WRONG URL  
```
http://localhost:5173
```

---

## 🔑 LOGIN CREDENTIALS

### All Test Accounts

| Role | Username | Password |
|------|----------|----------|
| **Clinician** | clinician | clinician123 |
| **Admin** | admin | admin123 |
| **Caregiver** | caregiver | caregiver123 |
| **Patient** | patient | patient123 |
| **Family** | family | family123 |

---

## 🏥 ROLE-BASED DASHBOARDS

Different users see different content based on their role:

### Clinician/Admin Dashboard
- **Statistics cards:** Total Patients, High Risk, Active Alerts, Avg Pain Score
- **Patient list** with details
- **Full access** to AI Insights, Patient Monitor, etc.

### Patient Dashboard
- **Personal care overview**
- Limited to own data
- Cannot see other patients

### Family Dashboard
- **Patient's information** only
- Care guide and resources
- Memory vault access

### Caregiver Dashboard
- **Assigned patients** only
- Task list and schedule
- Limited clinical data

---

## 🐛 TROUBLESHOOTING

### Issue 1: "Login Failed"

**Possible Causes:**
1. **Wrong port** - Using 5173 instead of 5174
2. **Backend not running** - Check http://localhost:8000/docs
3. **Wrong credentials** - Check spelling and case
4. **Browser cache** - Clear localStorage

**Solution:**
```bash
# 1. Make sure backend is running
# Check terminal: Should see "Project Aura API Ready"

# 2. Make sure you're on correct port
# URL must be: http://localhost:5174

# 3. Use exact credentials (case-sensitive)
Username: clinician
Password: clinician123
```

### Issue 2: "See Different Site for Different User"

This is **NORMAL and EXPECTED behavior**! 

Different roles see different dashboards:

**Example:**
- Login as **clinician** → See statistics, all patients, full features
- Login as **patient** → See personal dashboard, own data only
- Login as **family** → See patient's data, bereavement resources

**This is correct** - it's role-based access control (RBAC).

If you want to see the full clinical dashboard:
- Use: `clinician` / `clinician123`
- OR: `admin` / `admin123`

---

## ✅ CORRECT LOGIN FLOW

### Step-by-Step

1. **Open correct URL:**
   ```
   http://localhost:5174
   ```

2. **Enter credentials:**
   - Username: `clinician`
   - Password: `clinician123`

3. **Click "Sign In"**

4. **You should see:**
   - Dashboard with 4 statistics cards
   - Recent patients list
   - Sidebar with full menu (AI Insights, Patients, etc.)

5. **If you see different content:**
   - This means you logged in as a different role
   - Check username - did you type `patient` instead of `clinician`?
   - Logout and login again with correct credentials

---

## 🔄 HOW TO SWITCH ROLES

1. Click your name in top-right corner
2. Click "Logout"
3. Login with different credentials
4. Dashboard will change based on new role

---

## 🧪 TEST EACH ROLE

### Test Clinician (Full Access)
```
URL: http://localhost:5174
Username: clinician
Password: clinician123
```
**Should see:** Full dashboard, all patients, AI Insights, etc.

### Test Patient (Limited Access)
```
URL: http://localhost:5174
Username: patient  
Password: patient123
```
**Should see:** Personal dashboard, own data only

### Test Family (Limited Access)
```
URL: http://localhost:5174
Username: family
Password: family123
```
**Should see:** Patient's data, bereavement resources, memory vault

---

## 🆘 STILL NOT WORKING?

### Clear Browser Data

1. Open browser console (F12)
2. Go to "Application" or "Storage" tab
3. Find "Local Storage" → `http://localhost:5174`
4. Delete all items
5. Refresh page
6. Try login again

### Check Backend Status

Open: http://localhost:8000/docs

Should see: "Project Aura API" documentation page

If not, restart backend:
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Check Frontend Status

Should see in terminal:
```
VITE v8.0.16  ready in 1174 ms
➜  Local:   http://localhost:5174/
```

If not, restart frontend:
```bash
cd frontend
npm run dev
```

---

## 📊 COMPARISON

### What You Might Be Seeing

**If you see:**
- Statistics cards with patient counts
- Full patient list
- AI Insights in sidebar
- All menu options

**= You're logged in as CLINICIAN ✅**

---

**If you see:**
- Simple welcome message
- Limited menu
- Only "Dashboard" and "Resources"
- No patient list

**= You're logged in as PATIENT or FAMILY ✅**

**This is correct!** Different roles = different access.

---

## 🎯 QUICK FIX

If login fails:

1. **Check URL:** Must be http://localhost:5174 (not 5173)
2. **Check backend:** http://localhost:8000/docs should work
3. **Use exact credentials:**
   - clinician / clinician123 (for full access)
4. **Clear cache:** F12 → Application → Clear Storage
5. **Try again**

---

## ✅ EXPECTED BEHAVIOR

✅ **Different roles see different dashboards** - THIS IS CORRECT
✅ **Clinician sees full system** - THIS IS CORRECT
✅ **Patient sees limited view** - THIS IS CORRECT
✅ **Family sees bereavement/memory vault** - THIS IS CORRECT

This is **role-based access control (RBAC)** - it's working as designed!

---

**Quick Test:** Login as `clinician` / `clinician123` at http://localhost:5174

You should see full dashboard with AI Insights. If yes, everything works! 🎉
