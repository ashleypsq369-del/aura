# 🔧 TROUBLESHOOT LOGIN - Step by Step

## ✅ BACKEND IS WORKING

I tested the login API directly - it works perfectly:
```
✅ POST http://localhost:8000/api/auth/login
✅ Returns: Token + User data
✅ Backend is running correctly
```

---

## 🧪 TEST LOGIN YOURSELF

### Option 1: Test HTML File (Easiest)

1. Open this file in your browser:
   ```
   c:\xampp\htdocs\ProjectAura_React\test_login.html
   ```

2. Click "Test Login" button

3. **What you should see:**
   - ✅ LOGIN SUCCESS
   - User: (name)
   - Role: clinician
   - Token: (long string)

4. **If you see error:**
   - Open browser console (F12)
   - Look for error messages
   - Tell me what error you see

### Option 2: Test API Docs

1. Open: http://localhost:8000/docs
2. Find `/api/auth/login` endpoint
3. Click "Try it out"
4. Enter:
   ```json
   {
     "username": "clinician",
     "password": "clinician123"
   }
   ```
5. Click "Execute"
6. **Should see:** 200 response with token

### Option 3: Test Frontend

1. **IMPORTANT:** Make sure you're on correct port!
   ```
   http://localhost:5174  ← CORRECT
   ```
   NOT 5173!

2. Open browser console (F12) before logging in

3. Try to login with:
   - Username: clinician
   - Password: clinician123

4. **Look at console for errors**

---

## 🔍 COMMON ISSUES

### Issue 1: Wrong Port
```
❌ http://localhost:5173
✅ http://localhost:5174
```

**Fix:** Use port 5174

### Issue 2: Backend Not Running
**Check:** http://localhost:8000/docs

**Should see:** API documentation page

**If not:** Restart backend:
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Issue 3: Frontend Not Running
**Check terminal:** Should see:
```
VITE v8.0.16  ready
➜  Local:   http://localhost:5174/
```

**If not:** Restart frontend:
```bash
cd frontend
npm run dev
```

### Issue 4: CORS Error
**Console shows:** "CORS policy blocked"

**This shouldn't happen** - backend CORS is configured for localhost:5173 and localhost:5174

**Fix:** Check if backend has correct CORS settings

### Issue 5: Network Error
**Console shows:** "Failed to fetch" or "Network error"

**Possible causes:**
- Backend not running
- Wrong backend URL in frontend
- Firewall blocking

---

## 📝 WHAT ERROR DO YOU SEE?

When you try to login, tell me EXACTLY what happens:

### A) Do you see an error message on the page?
- What does it say?
- "Incorrect username or password"?
- "Login failed"?
- Something else?

### B) What's in the browser console? (F12)
Open browser console and look for:
- Red error messages
- Network errors
- API call failures

Take a screenshot or copy the error message

### C) Which URL are you using?
- http://localhost:5173? (wrong port)
- http://localhost:5174? (correct port)
- Something else?

---

## 🎯 NEXT STEPS

1. **Try the test HTML file** (`test_login.html`)
   - Open it in browser
   - Click "Test Login"
   - Tell me what you see

2. **If test HTML works but frontend doesn't:**
   - Open frontend in browser
   - Open console (F12)
   - Try to login
   - Copy error messages from console
   - Tell me what the error says

3. **If test HTML doesn't work:**
   - Check http://localhost:8000/docs
   - If docs page doesn't open, backend isn't running
   - Restart backend

---

## 💡 QUICK DEBUG

Run these commands to check status:

```powershell
# Check if backend is running
curl http://localhost:8000/docs

# Check if frontend port 5174 is open
curl http://localhost:5174

# Test login API directly
$body = @{username='clinician';password='clinician123'} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:8000/api/auth/login' -Method POST -Body $body -ContentType 'application/json'
```

---

## ⚠️ TELL ME

To help you further, I need to know:

1. **What error message do you see?**
2. **Which URL are you using?** (5173 or 5174?)
3. **What's in the browser console?** (F12 → Console tab)
4. **Does http://localhost:8000/docs open?**
5. **Does the test_login.html file work?**

With this information, I can pinpoint the exact issue!
