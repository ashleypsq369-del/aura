# ✅ TESTING CHECKLIST

**Use this to track what you've tested**

---

## 🔥 CRITICAL TESTS (Must Do First)

### Test 1: Start Conversation (500 Error Fixed)
- [ ] Login as admin
- [ ] Navigate to Messages
- [ ] Click "+" button
- [ ] Select a physician
- [ ] Verify conversation appears
- [ ] **Expected:** No 500 error in console

**Status:** _________  
**Notes:** _________________________________________

---

### Test 2: Send Message (Dependent on Test 1)
- [ ] Continue from Test 1
- [ ] Type a message
- [ ] Click Send
- [ ] Verify message appears in chat
- [ ] **Expected:** Message displays with gradient background

**Status:** _________  
**Notes:** _________________________________________

---

### Test 3: Crisis Alerts (401 Error Fixed)
- [ ] Login as admin
- [ ] Navigate to Dashboard
- [ ] Look at Critical Alerts section (top-right)
- [ ] Open browser console (F12)
- [ ] **Expected:** No 401 errors, alerts display

**Status:** _________  
**Notes:** _________________________________________

---

## 📋 SECONDARY TESTS (Do After Critical Tests Pass)

### Test 4: Multi-User Messaging
- [ ] Login as admin
- [ ] Start conversation with drkwame
- [ ] Send message "Hello from admin"
- [ ] Logout
- [ ] Login as drkwame / password123
- [ ] Navigate to Messages
- [ ] Verify unread badge appears
- [ ] Open conversation
- [ ] Verify admin's message is visible
- [ ] Reply "Hello from physician"
- [ ] Logout
- [ ] Login as admin
- [ ] Check for reply

**Status:** _________  
**Notes:** _________________________________________

---

### Test 5: Search Conversations
- [ ] Have at least 3 conversations
- [ ] Type a name in search box
- [ ] Verify filtering works
- [ ] Clear search
- [ ] Verify all conversations return

**Status:** _________  
**Notes:** _________________________________________

---

### Test 6: Unread Message Count
- [ ] Have unread messages
- [ ] Check conversation list
- [ ] Verify teal badge shows count
- [ ] Open conversation
- [ ] Check if badge disappears
- [ ] **Expected:** Badge updates correctly

**Status:** _________  
**Notes:** _________________________________________

---

### Test 7: Patient Form Submission
- [ ] Login as admin or clinician
- [ ] Navigate to Patient Monitor
- [ ] Fill in vitals form:
  - Heart Rate: 80
  - Blood Pressure: 120/80
  - Temperature: 37
- [ ] Click Submit
- [ ] **Expected:** No blank page, success message

**Status:** _________  
**Notes:** _________________________________________

---

### Test 8: Symptom Logging
- [ ] Navigate to Patient Monitor
- [ ] Fill symptom form
- [ ] Click Submit
- [ ] **Expected:** Success, no errors

**Status:** _________  
**Notes:** _________________________________________

---

### Test 9: Patient Portal Access
- [ ] Login as patient1 / password123
- [ ] Navigate to Patient Portal
- [ ] Verify data displays
- [ ] Check vitals, appointments, medications
- [ ] **Expected:** No blank pages

**Status:** _________  
**Notes:** _________________________________________

---

### Test 10: AI Chatbot
- [ ] Login as any user
- [ ] Click on Aura chat icon
- [ ] Send a message
- [ ] **Expected:** Bot responds (fallback mode)

**Status:** _________  
**Notes:** _________________________________________

---

## 🎨 UI/UX VERIFICATION

### Visual Standards Check
- [ ] All cards have 3px borders (not 1px)
- [ ] No plain white backgrounds (gradients used)
- [ ] Teal/cyan color scheme throughout
- [ ] Messages page has proper styling
- [ ] Conversation list has hover effects
- [ ] Message bubbles have gradients
- [ ] Unread badges are teal with white text

**Status:** _________  
**Notes:** _________________________________________

---

## 🔍 BROWSER CONSOLE CHECK

### Open Console (F12) and Verify:
- [ ] No 500 Internal Server Error
- [ ] No 401 Unauthorized errors
- [ ] No 403 Forbidden errors
- [ ] All API calls return 200 OK
- [ ] No red error messages

**Errors Found:** _________________________________________

---

## 🖥️ BACKEND LOG CHECK

### Check Terminal Running Uvicorn:
- [ ] Only "200 OK" responses
- [ ] No "500 Internal Server Error"
- [ ] No "ERROR:" messages
- [ ] No SQL execution errors
- [ ] No Python exceptions

**Errors Found:** _________________________________________

---

## 📊 RESULTS SUMMARY

### Critical Tests
- **Passed:** _____ / 3
- **Failed:** _____ / 3
- **Blocked:** _____ / 3

### Secondary Tests
- **Passed:** _____ / 7
- **Failed:** _____ / 7
- **Skipped:** _____ / 7

### Overall Status
- [ ] ✅ All critical tests passed
- [ ] ✅ Most secondary tests passed
- [ ] ⚠️ Some issues found (see notes)
- [ ] ❌ Major issues preventing testing

---

## 🐛 ISSUES FOUND

### Issue 1
**Test:** _________________________________________  
**Description:** _________________________________________  
**Severity:** Critical / High / Medium / Low  
**Screenshot/Log:** _________________________________________

### Issue 2
**Test:** _________________________________________  
**Description:** _________________________________________  
**Severity:** Critical / High / Medium / Low  
**Screenshot/Log:** _________________________________________

### Issue 3
**Test:** _________________________________________  
**Description:** _________________________________________  
**Severity:** Critical / High / Medium / Low  
**Screenshot/Log:** _________________________________________

---

## ✅ SIGN-OFF

**Tester Name:** _________________________________________  
**Date:** _________________________________________  
**Time Spent:** _________________________________________  

**Overall Assessment:**
- [ ] Ready for production
- [ ] Ready for staging
- [ ] Needs more work
- [ ] Major issues found

**Comments:** _________________________________________
_________________________________________
_________________________________________

---

## 📝 NOTES FOR DEVELOPERS

_________________________________________
_________________________________________
_________________________________________
_________________________________________
_________________________________________

---

*Print this checklist or keep it open while testing!*
