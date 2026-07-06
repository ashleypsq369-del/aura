# Quick Test - Registration & Questionnaire (FIXED!)

**Test this now to verify the fixes!**

---

## ✅ What Was Fixed

1. **Questionnaire now shows after registration** - Fixed token storage key inconsistency
2. **Clear labels explain name vs username** - Added helper text with examples
3. **Username auto-formats** - Converts to lowercase, removes spaces automatically

---

## 🚀 Quick Test (5 Minutes)

### Step 1: Create New Account
```
1. Go to: http://localhost:5173/register

2. Fill the form:
   Full Name: "Jane Doe"
     └─ Helper text says: "Your real name (e.g., John Mensah)"
   
   Username: "Jane Doe"  ← Try typing with spaces!
     └─ Should auto-convert to: "janedoe"
     └─ Helper text says: "For login (e.g., jmensah123) - no spaces"
   
   Email: "jane.doe@test.com"
   Password: "Test1234"
   Phone: (leave blank - it's optional)
   Role: Patient
   
   ✓ Check "I agree" box

3. Click "Create Account"
```

### Step 2: Verify Questionnaire Loads
```
4. Should redirect to: /setup

5. Check:
   ✓ Page loads (no white screen)
   ✓ Shows "Let's get to know you" heading
   ✓ Progress bar shows "Step 1 of 7"
   ✓ No errors in browser console (F12)
```

### Step 3: Complete Questionnaire
```
6. Select any answers (doesn't matter which)

7. Click "Next" button 7 times

8. On step 7, click "Complete"

9. Should show:
   ✓ Green checkmark animation
   ✓ "You're all set!" message
   ✓ Redirects to /my-space after 2 seconds
```

### Step 4: Verify Dashboard Loads
```
10. Dashboard should load showing:
    ✓ Your full name "Jane Doe" in header (not "janedoe")
    ✓ Personalized content
    ✓ No errors
```

---

## 🔍 What to Look For

### Username Field Behavior:
```
Type: "Jane Doe" → Becomes: "janedoe"
Type: "Jane123" → Becomes: "jane123"
Type: "JANE" → Becomes: "jane"
Type: "jane doe 123" → Becomes: "janedoe123"
```

### Helper Text Visibility:
```
Full Name field:
  ✓ Shows "Your real name (e.g., John Mensah)" in small gray text

Username field:
  ✓ Shows "For login (e.g., jmensah123) - no spaces" in small gray text
```

### Redirect Flow:
```
Register page → /setup → /my-space
     ✓              ✓         ✓
```

---

## ❌ Common Issues to Check

### Issue: Questionnaire doesn't load
**Check:**
1. Open browser console (F12)
2. Look for errors
3. Check Network tab for failed API calls
4. Verify `auth_token` is in localStorage (Application tab)

**Should see:**
- ✅ `auth_token`: "eyJ..."
- ✅ `user`: {"id": ..., "full_name": "Jane Doe", ...}

### Issue: Still confused about fields
**Check:**
1. Is helper text visible under Full Name?
2. Is helper text visible under Username?
3. Text should be small, gray, above the input

---

## 🎯 Success Checklist

After testing, verify:

- [ ] Registration form shows clear helper text
- [ ] Username auto-converts to lowercase
- [ ] Username removes spaces automatically
- [ ] Account created successfully (toast notification)
- [ ] Redirects to /setup (questionnaire)
- [ ] Questionnaire loads without errors
- [ ] Can navigate through all 7 steps
- [ ] Clicking "Complete" shows success animation
- [ ] Redirects to dashboard after 2 seconds
- [ ] Dashboard shows full name "Jane Doe" (not username)
- [ ] No console errors throughout entire flow

---

## 🐛 If Something Still Doesn't Work

### Questionnaire still won't load:
```bash
# Clear localStorage and try again
1. Open browser console (F12)
2. Type: localStorage.clear()
3. Press Enter
4. Try registration again
```

### Username not auto-formatting:
```
1. Clear browser cache (Ctrl+Shift+R)
2. Try registration again
3. Type in Username field
4. Should convert immediately as you type
```

### API errors:
```
1. Check backend is running: http://localhost:8000
2. Check backend terminal for errors
3. Verify database is accessible
```

---

## 📊 Before vs After

### Before (BROKEN):
```
1. Create account ✓
2. Redirect to /setup ✓
3. Questionnaire loads ✗ (white screen, API errors)
4. No idea what username vs name means ✗
5. Username can have spaces/capitals ✗
```

### After (FIXED):
```
1. Create account ✓
2. Redirect to /setup ✓
3. Questionnaire loads ✓ (works perfectly!)
4. Clear explanation of each field ✓
5. Username auto-formats correctly ✓
```

---

## 🎉 Expected Result

**Smooth flow from start to finish:**

```
Registration Form
  ↓ (Clear helper text, auto-formatting)
Account Created
  ↓ (Stores auth_token correctly)
Questionnaire Loads
  ↓ (7 steps, progress bar)
Preferences Saved
  ↓ (Success animation)
Dashboard Loads
  ✅ Complete!
```

---

## 💡 Try Edge Cases

### Test 1: Spaces in username
```
Type: "john smith" → Should become: "johnsmith" ✓
```

### Test 2: Mixed case
```
Type: "JohnSmith" → Should become: "johnsmith" ✓
```

### Test 3: Special characters
```
Type: "john@smith" → Should become: "john@smith"
(Special chars allowed, just lowercase)
```

### Test 4: Numbers
```
Type: "John123" → Should become: "john123" ✓
```

---

**Everything should work smoothly now! Test and enjoy! 🚀**
