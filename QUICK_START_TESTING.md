# 🚀 Quick Start Testing Guide

**For**: Testing the newly completed features  
**Date**: June 5, 2026  
**Time Required**: 15 minutes

---

## 🎯 What's New Today

1. ✅ **Questionnaire Redesign** - Beautiful healthcare colors, compact, smooth animations
2. ✅ **Alerts vs Notifications** - Clear visual distinction (Red vs Teal)
3. ✅ **Complete Documentation** - Everything documented
4. ✅ **Compact Header Cards** - All pages have beautiful headers

---

## ⚡ 5-Minute Quick Test

### **Test 1: Questionnaire (3 minutes)**

```bash
1. Open: http://localhost:5173/register
2. Fill form as PATIENT:
   - Full Name: Test Patient
   - Username: testpatient1
   - Email: test@example.com
   - Password: Test1234
   - Accept terms
3. Click "Create Account"
4. ✅ CHECK: Should redirect to /setup automatically
5. ✅ CHECK: See beautiful teal-cyan-emerald colors
6. ✅ CHECK: Progress dots at top (not bar)
7. Click through all 7 steps (horizontal slide animations)
8. ✅ CHECK: Completion screen with spinning checkmark
9. ✅ CHECK: Auto-redirect to /my-space after 2 seconds
```

**What to Look For**:
- 🎨 Emerald-teal-cyan gradient background
- 📊 Progress dots (not bar)
- 🎴 Large touchable cards for radio options
- 💊 Animated chips for multi-select
- 🎚️ Beautiful gradient slider
- ✨ Smooth horizontal slide between steps
- 🎉 Celebration screen with checkmark spin

---

### **Test 2: Notifications (2 minutes)**

```bash
1. Login as patient (from test 1)
2. ✅ CHECK: See TEAL Bell icon in header
3. Go to /appointments
4. Create appointment for tomorrow
5. Wait 5 minutes (or trigger manually)
6. ✅ CHECK: Teal badge appears on Bell
7. Click Bell icon
8. ✅ CHECK: See dropdown with notification
9. Click notification
10. ✅ CHECK: Navigate to /appointments
```

**What to Look For**:
- 🔔 Teal Bell icon (not red)
- 📱 Teal badge (static, not pulsing)
- 📋 Notification dropdown
- 🔗 Click navigates to correct page

---

### **Test 3: Alerts (Clinician Only)**

**Only if you have clinician account:**

```bash
1. Login as clinician
2. ✅ CHECK: See RED AlertCircle icon in header
3. Go to patient detail
4. Record vitals with O2 < 90% (e.g., 87%)
5. Wait 5 minutes
6. ✅ CHECK: Red pulsing badge appears
7. ✅ CHECK: Red toast notification
8. Click AlertCircle
9. ✅ CHECK: See alert in dropdown
10. Click alert → navigate to patient
```

**What to Look For**:
- 🚨 Red AlertCircle icon (not bell)
- 💓 Red pulsing badge (animated)
- 🔴 Red toast notification
- ⚠️ Alert dropdown

---

## 🎨 Visual Checklist

### **Questionnaire Colors** ✅
```
Background: Emerald-Teal-Cyan gradient (NO white)
Orbs: Visible blur effects (emerald, teal, cyan)
Card: Glassmorphic with subtle teal tint
Progress: Gradient dots (emerald-teal-cyan)
Buttons: Gradient (emerald to cyan)
Text: Teal shades for hierarchy
```

### **Size Check** ✅
```
NOT too big:
  - Card padding: Moderate (p-6)
  - Text sizes: Readable but compact
  - Title: 4xl (not 5xl)
  - Button padding: 2.5 (not 3)
  - Checkmark: w-24 (not w-32)
```

### **Animations** ✅
```
✅ Horizontal slide (not vertical)
✅ Smooth transitions (0.3s)
✅ Progress dots animate
✅ Checkmark spins on completion
✅ Cards scale on hover
✅ Chips animate on select
```

---

## 🐛 Common Issues & Solutions

### **Issue: Questionnaire doesn't show after registration**

**Debug Steps**:
```bash
1. Open browser console (F12)
2. Register new patient
3. Look for console logs:
   🔍 Registration Response: {...}
   ✅ Redirecting to questionnaire at /setup
   
4. If no logs:
   - Check backend is running
   - Check API_URL in .env
   - Check network tab for errors

5. Manual test:
   - Go to /setup directly
   - If shows "Already completed", clear localStorage
   - Try again
```

---

### **Issue: Colors look wrong**

**Check**:
```bash
1. Clear browser cache (Ctrl+Shift+R)
2. Check tailwind.config.js has teal, emerald, cyan
3. Restart dev server
4. Check PersonalisationQuest.jsx has correct classes:
   - bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100
```

---

### **Issue: Notifications not showing**

**Check**:
```bash
1. Backend running? Check: http://localhost:8000/docs
2. Frontend polling? Check console for:
   🔔 Checking notifications... (every 30s)
3. Create test notification:
   POST /api/notifications/test-notification
4. Check notification_queue table in database
```

---

### **Issue: Alerts not showing**

**Check**:
```bash
1. Logged in as clinician/caregiver? (Patients don't see alerts)
2. Backend monitoring running? Check console:
   🚨 Alert monitoring loop started
3. Create test alert:
   - Record vitals with O2: 87%
   - Wait 5 minutes
   - Check alerts table in database
```

---

## 📱 Testing Checklist

### **Questionnaire** ✅
- [ ] Opens after patient registration
- [ ] Shows emerald-teal-cyan colors
- [ ] No white backgrounds
- [ ] Progress dots (not bar)
- [ ] Horizontal slide animations
- [ ] Compact sizing (not too big)
- [ ] Radio buttons are large cards
- [ ] Multi-select chips animate
- [ ] Slider has gradient
- [ ] Completion screen matches colors
- [ ] Auto-redirects after 2 seconds

### **Notifications** ✅
- [ ] Teal Bell icon in header
- [ ] Badge is teal (not red)
- [ ] Badge is static (not pulsing)
- [ ] Dropdown shows notifications
- [ ] Click navigates correctly
- [ ] Mark as read works
- [ ] Badge count updates

### **Alerts** ✅
- [ ] Red AlertCircle icon (clinician only)
- [ ] Badge is red (not teal)
- [ ] Badge pulses
- [ ] Red toast appears
- [ ] Dropdown shows alerts
- [ ] Click navigates to patient
- [ ] Acknowledge works
- [ ] Badge count updates

---

## 🔍 Console Commands

### **Check if backend monitoring is running**:
```bash
# In backend terminal, should see:
🔔 Starting notification monitoring system...
✅ Notification monitoring loop started (every 5 minutes)
🚨 Alert monitoring loop started (every 30 seconds)
```

### **Check frontend polling**:
```bash
# In browser console (F12), should see every 30s:
🔔 Checking notifications...
🚨 Checking alerts...
```

### **Manual API test**:
```bash
# Test notification creation
curl -X POST http://localhost:8000/api/notifications/test-notification \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Check unread count
curl http://localhost:8000/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Expected Behavior

### **New Patient Registration Flow**:
```
1. Visit /register
2. Fill form → Submit
3. Backend creates user + preferences (questionnaire_complete: false)
4. Frontend receives: needs_questionnaire: true
5. Auto-redirect to /setup
6. Complete questionnaire (7 steps)
7. Submit → Backend sets questionnaire_complete: true
8. Show completion screen (2 seconds)
9. Auto-redirect to /my-space
10. See personalized dashboard
```

### **Notification Flow**:
```
1. User creates appointment
2. Background loop runs (every 5 min)
3. Detects appointment in 24h
4. Creates notification in database
5. Frontend polls API (every 30s)
6. Teal badge appears
7. User clicks Bell
8. Sees notification
9. Clicks notification
10. Navigates to page
11. Notification marked as read
12. Badge count decrements
```

### **Alert Flow (Clinician)**:
```
1. Caregiver records critical vitals
2. Background loop runs (every 5 min)
3. Detects O2 < 90%
4. Creates alert in database
5. Frontend polls API (every 30s)
6. Red pulsing badge appears
7. Red toast pops up
8. Clinician clicks AlertCircle
9. Sees alert
10. Clicks alert
11. Navigates to patient
12. Takes action
13. Acknowledges alert
14. Badge count decrements
```

---

## 🎯 Success Criteria

After testing, you should see:

✅ **Questionnaire**:
- Beautiful healthcare colors
- Smooth animations
- Compact design
- Working flow

✅ **Notifications**:
- Teal Bell icon
- Static teal badge
- Dropdown works
- Navigation works

✅ **Alerts**:
- Red AlertCircle icon
- Pulsing red badge
- Toast notifications
- Navigation works

✅ **Overall**:
- Clean, professional look
- Clear visual hierarchy
- Intuitive navigation
- No errors in console

---

## 📚 More Information

- **Complete Documentation**: `COMPLETE_SYSTEM_DOCUMENTATION.md`
- **Design Details**: `QUESTIONNAIRE_REDESIGNED.md`
- **Alerts vs Notifications**: `ALERTS_VS_NOTIFICATIONS_GUIDE.md`
- **Session Summary**: `SESSION_SUMMARY_JUNE_5_2026.md`

---

## 🆘 Need Help?

1. **Check console** (F12) for errors
2. **Check backend terminal** for monitoring logs
3. **Review documentation** in markdown files
4. **Test with `/notification-tester`** page
5. **Check database** for records

---

**Happy Testing!** 🎉

**Everything should work beautifully now!**
