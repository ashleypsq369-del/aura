# 🔐 LOGIN GUIDE

## ⚡ QUICK LOGIN (Copy-Paste These)

### 1. Open Browser
Type this EXACT URL:
```
http://localhost:5174
```

### 2. Login Credentials
```
Username: clinician
Password: clinician123
```

### 3. Press "Sign In"

**That's it!**

---

## ❌ "STILL NOT WORKING"?

Since you keep saying "still not working", I need MORE INFORMATION.

### Answer These Questions:

**Q1:** What URL are you using?
- [ ] http://localhost:5174
- [ ] http://localhost:5173
- [ ] Something else: __________

**Q2:** Do you see a login page?
- [ ] Yes - I see username/password boxes
- [ ] No - I see error/blank page

**Q3:** When you click "Sign In", what happens?
- [ ] Error message appears
- [ ] Nothing happens
- [ ] Button keeps spinning
- [ ] Page refreshes

**Q4:** If error appears, what does it say EXACTLY?
```
Error message: ___________________________
```

**Q5:** Is http://localhost:8000/docs working?
- [ ] Yes - I see API docs
- [ ] No - Cannot connect

**Q6:** Press F12, do you see red errors in Console?
- [ ] Yes - error says: __________
- [ ] No errors

---

## 🔧 CHECK THESE

### Backend Running?
Open: http://localhost:8000/docs
- ✅ Should see API documentation
- ❌ If not, backend isn't running

### Frontend Running?
Open: http://localhost:5174
- ✅ Should see login page
- ❌ If not, frontend isn't running

---

## 🚀 RESTART EVERYTHING

If STILL not working:

```bash
# Terminal 1 - Backend
cd c:\xampp\htdocs\ProjectAura_React\backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend  
cd c:\xampp\htdocs\ProjectAura_React\frontend
npm run dev
```

Wait for both to start, then try:
http://localhost:5174

---

## 📞 I NEED TO KNOW

**"Still not working" is not enough information!**

Tell me:
1. What URL you're using
2. What you see on screen
3. What error message appears
4. What's in console (F12)

Then I can actually help!
