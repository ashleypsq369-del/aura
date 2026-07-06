# 🧪 PROJECT AURA - COMPREHENSIVE TESTING GUIDE

## 🎯 Testing Overview

**Objective:** Verify all features work correctly before declaring 100% completion  
**Estimated Time:** 3-4 hours  
**Tester Role:** QA / Developer  

---

## 📋 PRE-TESTING CHECKLIST

### Servers Running
- [ ] Backend server running on http://localhost:8000
- [ ] Frontend server running on http://localhost:5173
- [ ] No console errors on startup
- [ ] Database file exists (`backend/aura.db`)

### Browser Setup
- [ ] Use Chrome/Edge/Firefox (latest version)
- [ ] Open Developer Tools (F12)
- [ ] Monitor Console tab for errors
- [ ] Monitor Network tab for failed requests

---

## 🔐 PHASE 1: AUTHENTICATION FLOWS (30 mins)

### Test 1.1: User Login
1. **Navigate to:** http://localhost:5173/login
2. **Test valid login:**
   - Username: `clinician`
   - Password: `password123`
   - Click "Sign In"
   - **Expected:** Redirect to dashboard, no errors
3. **Test invalid login:**
   - Username: `invalid`
   - Password: `wrong`
   - **Expected:** Error message displayed
4. **Test empty fields:**
   - Leave fields blank
   - **Expected:** Validation errors

### Test 1.2: User Registration
1. **Navigate to:** http://localhost:5173/register
2. **Fill form:**
   - Full Name: `Test User`
   - Username: `testuser123`
   - Email: `test@example.com`
   - Password: `StrongPass123!`
   - Phone: `+233241234567`
   - Role: `Patient`
   - Accept terms: ✓
3. **Submit form**
   - **Expected:** Account created, redirect to questionnaire
4. **Test duplicate username:**
   - Try to register with `patient` username
   - **Expected:** Error message

### Test 1.3: Password Recovery
1. **Navigate to:** http://localhost:5173/forgot-password
2. **Enter email:** `patient@example.com`
3. **Submit**
   - **Expected:** Success message + token shown (dev mode)
4. **Copy token from screen**

### Test 1.4: Password Reset
1. **Navigate to:** http://localhost:5173/reset-password
2. **Paste token** from previous step
3. **Enter new password:** `NewPassword123!`
4. **Confirm password:** `NewPassword123!`
5. **Submit**
   - **Expected:** Success message, redirect to login
6. **Login with new password**
   - **Expected:** Login successful

---

## 👤 PHASE 2: USER PROFILE MANAGEMENT (20 mins)

### Test 2.1: View Profile
1. **Login as:** `patient` / `password123`
2. **Navigate to:** http://localhost:5173/profile
3. **Verify displays:**
   - Avatar with initials
   - Full name
   - Username
   - Email
   - Phone (if set)
   - Role badge
   - **Expected:** All information correct

### Test 2.2: Edit Profile
1. **Click "Edit" button**
2. **Modify:**
   - Full Name: `Updated Patient Name`
   - Email: `updated@example.com`
   - Phone: `+233501234567`
3. **Click "Save Changes"**
   - **Expected:** Toast success message
4. **Refresh page**
   - **Expected:** Changes persisted

### Test 2.3: Change Password
1. **Click "Change" password button**
2. **Fill form:**
   - Current: `password123`
   - New: `NewSecurePass123!`
   - Confirm: `NewSecurePass123!`
3. **Submit**
   - **Expected:** Success message
4. **Logout and login with new password**
   - **Expected:** Login successful

### Test 2.4: Update Preferences
1. **Toggle notification switch**
2. **Change language** to `Twi`
3. **Verify:** Changes reflected

---

## 📚 PHASE 3: RESOURCES LIBRARY (30 mins)

### Test 3.1: Browse Resources
1. **Navigate to:** http://localhost:5173/resources
2. **Verify:**
   - Resources display in grid
   - At least 40 resources visible
   - Ghana flag 🇬🇭 on some resources
   - Format icons present
   - Difficulty badges visible
   - **Expected:** Professional card layout

### Test 3.2: Search Resources
1. **Type in search bar:** `pain`
2. **Verify:**
   - Only pain-related resources show
   - Search is instant (no delay)
3. **Clear search**
   - All resources return

### Test 3.3: Filter by Category
1. **Click "Pain Management" tab**
   - **Expected:** Only pain management resources
2. **Click "Ghana Resources" tab**
   - **Expected:** Only Ghana-specific resources (with 🇬🇭)
3. **Click "All Resources"**
   - **Expected:** All resources return

### Test 3.4: View Resource
1. **Click any resource card**
2. **Verify modal shows:**
   - Full title
   - Complete content
   - Format icon
   - Ghana flag (if applicable)
   - Bookmark button
   - Helpful/Not Helpful buttons
3. **Click outside modal**
   - **Expected:** Modal closes

### Test 3.5: Bookmark Resource
1. **Open a resource**
2. **Click star icon** (bookmark)
   - **Expected:** Star turns yellow, "Bookmarked" text
3. **Close modal**
4. **Reopen same resource**
   - **Expected:** Star still yellow (persisted)
5. **Click star again**
   - **Expected:** Bookmark removed

### Test 3.6: Rate Resource
1. **Open a resource**
2. **Click "Yes" (helpful)**
   - **Expected:** Button turns green, toast message
3. **Close and reopen resource**
   - **Expected:** Button still green
4. **Click "No" (not helpful)**
   - **Expected:** Button changes to red

---

## 🗺️ PHASE 4: JOURNEY TRACKER (25 mins)

### Test 4.1: View Timeline
1. **Login as:** `patient` / `password123`
2. **Navigate to:** http://localhost:5173/my-journey
3. **Verify:**
   - Timeline displays vertically
   - Events grouped by date
   - Event cards have icons
   - Timeline dots visible
   - **Expected:** Professional timeline layout

### Test 4.2: Filter by Event Type
1. **Click "Admissions" filter**
   - **Expected:** Only admission events show
2. **Click "Critical Alerts" filter**
   - **Expected:** Only alert events show
3. **Click "Milestones" filter**
   - **Expected:** Only milestone events (with star icon)
4. **Click "All Events"**
   - **Expected:** All events return

### Test 4.3: Filter by Date Range
1. **Click "Last 30 Days"**
   - **Expected:** Only recent events
2. **Click "Last 90 Days"**
   - **Expected:** More events appear
3. **Click "All Time"**
   - **Expected:** All events visible

### Test 4.4: Verify Statistics
1. **Check summary cards at bottom:**
   - Total Events
   - Milestones
   - Critical Alerts
   - Appointments
2. **Verify:** Numbers match filtered events

### Test 4.5: Milestone Highlighting
1. **Look for events with star icons**
2. **Verify:**
   - Yellow/gold accent border
   - Star icon visible
   - "Milestone" badge or indication

---

## 👥 PHASE 5: COMMUNITY PLATFORM (30 mins)

### Test 5.1: View Groups
1. **Navigate to:** http://localhost:5173/community
2. **Verify:**
   - 6 groups listed in sidebar
   - Member counts visible
   - Group descriptions clear
   - **Expected:** Clean group list

### Test 5.2: Join Group
1. **Click "Cancer Warriors Support" group**
2. **Click "Join" button**
   - **Expected:** Button changes to "Leave", member count +1
3. **Verify:** Main feed shows posts from this group

### Test 5.3: Create Post
1. **In joined group, type post:** `This is a test support message for the community.`
2. **Watch character counter:** Should show `55/280`
3. **Click "Share Post"**
   - **Expected:** Post appears in feed with anonymized name
4. **Verify:**
   - Your name is anonymized (e.g., "Kofi · Cancer Journey")
   - Post content correct
   - Post time shows

### Test 5.4: React to Post
1. **Find any post**
2. **Click 🙏 (pray) icon**
   - **Expected:** Count increases
3. **Click ❤️ (heart) icon**
   - **Expected:** Count increases
4. **Click 💪 (strong) icon**
   - **Expected:** Count increases

### Test 5.5: Flag Post
1. **Click flag icon on any post**
2. **Confirm flagging**
   - **Expected:** "Post flagged for review" toast
3. **If you flag 5 times (use multiple accounts):**
   - **Expected:** Post auto-hides

### Test 5.6: Leave Group
1. **Click group name**
2. **Click "Leave" button**
   - **Expected:** Button changes to "Join", can't see posts

---

## 👨‍⚕️ PHASE 6: ADMIN FEATURES (25 mins)

### Test 6.1: View All Users
1. **Login as:** `admin` / `password123`
2. **Navigate to:** http://localhost:5173/admin/users
3. **Verify:**
   - User list displays
   - Role badges visible
   - Last login times shown
   - **Expected:** Table with all users

### Test 6.2: Search Users
1. **Type in search bar:** `patient`
2. **Verify:** Only users matching "patient" show
3. **Clear search**
   - **Expected:** All users return

### Test 6.3: Filter by Role
1. **Select "Clinician" from role filter**
   - **Expected:** Only clinicians show
2. **Select "All Roles"**
   - **Expected:** All users return

### Test 6.4: Create User
1. **Click "Create User" button**
2. **Fill form:**
   - Full Name: `New Test User`
   - Username: `newtestuser`
   - Email: `newtest@example.com`
   - Password: `Password123!`
   - Role: `Caregiver`
3. **Click "Create"**
   - **Expected:** Success toast, user appears in list

### Test 6.5: Edit User
1. **Click edit icon on any user**
2. **Change role** to different role
3. **Click "Save"**
   - **Expected:** Role updated, badge changes

### Test 6.6: Deactivate User
1. **Click toggle on any user**
2. **Confirm deactivation**
   - **Expected:** User marked as inactive
3. **Toggle again**
   - **Expected:** User reactivated

### Test 6.7: Reset Password
1. **Click "Reset Password" on any user**
2. **Copy temporary password shown**
3. **Logout**
4. **Login as that user with temp password**
   - **Expected:** Login successful

---

## 🔔 PHASE 7: REAL-TIME FEATURES (15 mins)

### Test 7.1: Alert Notifications
1. **Login as:** `clinician` / `password123`
2. **Look at top-right header**
3. **Verify:**
   - Bell icon present
   - Badge with unread count (if any alerts exist)
4. **Click bell icon**
   - **Expected:** Dropdown shows recent alerts
5. **Wait 30 seconds**
   - **Expected:** Data auto-refreshes

### Test 7.2: Real-time Polling
1. **Open Resources page**
2. **In another browser/tab, bookmark a resource**
3. **Wait 30 seconds on first tab**
   - **Expected:** Bookmark status updates automatically

### Test 7.3: Toast Notifications
1. **Perform various actions** (save, create, delete)
2. **Verify:**
   - Success toasts appear (green)
   - Error toasts appear (red)
   - Toasts auto-dismiss after 4 seconds
   - **Expected:** Professional toast UI

---

## 📱 PHASE 8: RESPONSIVE DESIGN (20 mins)

### Test 8.1: Desktop View (1920x1080)
1. **Open browser normally**
2. **Navigate through all pages**
3. **Verify:**
   - Layout uses full width appropriately
   - No horizontal scrolling
   - Cards display in grids
   - **Expected:** Professional desktop layout

### Test 8.2: Tablet View (768x1024)
1. **Open DevTools (F12)**
2. **Enable device toolbar**
3. **Select iPad**
4. **Navigate through pages**
5. **Verify:**
   - Sidebar collapses or adapts
   - Tables remain readable
   - Forms still usable
   - **Expected:** Tablet-optimized layout

### Test 8.3: Mobile View (375x667)
1. **Select iPhone SE**
2. **Navigate through pages**
3. **Verify:**
   - Single column layouts
   - Hamburger menu (if applicable)
   - Forms stack vertically
   - Buttons remain tappable (min 44px)
   - **Expected:** Mobile-optimized layout

---

## 🐛 PHASE 9: ERROR HANDLING (15 mins)

### Test 9.1: Network Errors
1. **Stop backend server** (Ctrl+C)
2. **Try to load Resources page**
   - **Expected:** Error message or loading state
3. **Restart backend server**
4. **Refresh page**
   - **Expected:** Data loads successfully

### Test 9.2: Invalid Data
1. **Try to create post with 300 characters**
   - **Expected:** Error message "280 characters max"
2. **Try to register with weak password** (`123`)
   - **Expected:** Password strength warning

### Test 9.3: Unauthorized Access
1. **Logout**
2. **Try to navigate to:** http://localhost:5173/admin/users
   - **Expected:** Redirect to login page
3. **Login as patient**
4. **Try to access admin page**
   - **Expected:** Access denied or redirect

---

## ✅ PHASE 10: FINAL VERIFICATION (20 mins)

### Test 10.1: Browser Console
1. **Open all pages**
2. **Check console (F12 → Console)**
3. **Verify:** No red errors (warnings OK)

### Test 10.2: Network Requests
1. **Open DevTools (F12 → Network)**
2. **Navigate through pages**
3. **Verify:**
   - All API calls return 200/201
   - No 404 or 500 errors
   - Response times reasonable (<1s)

### Test 10.3: Performance
1. **Navigate between pages**
2. **Verify:**
   - Page loads feel instant
   - No lag when typing
   - Animations smooth
   - **Expected:** Fast, responsive UI

### Test 10.4: Data Persistence
1. **Create bookmark**
2. **Close browser completely**
3. **Reopen browser**
4. **Login again**
5. **Verify:** Bookmark still present

---

## 📊 TEST RESULTS TEMPLATE

Use this template to record your findings:

```
### Test Session: [Date/Time]
### Tester: [Your Name]
### Browser: [Chrome/Firefox/Edge] [Version]

## Summary
- Total Tests: 60
- Passed: __
- Failed: __
- Blocked: __
- Completion: ___%

## Failed Tests
1. [Test ID] - [Description] - [Expected vs Actual]
2. [Test ID] - [Description] - [Expected vs Actual]

## Bugs Found
1. [Severity: High/Medium/Low] - [Description] - [Steps to Reproduce]
2. [Severity: High/Medium/Low] - [Description] - [Steps to Reproduce]

## Notes
- [Any additional observations]
- [Performance issues]
- [UX suggestions]
```

---

## 🎯 PASS CRITERIA

### Must Pass (Critical):
- ✅ All authentication flows work
- ✅ No console errors on any page
- ✅ All API calls return successful
- ✅ No data loss on refresh
- ✅ Forms validate correctly
- ✅ Real-time features update

### Should Pass (Important):
- ✅ Mobile responsive
- ✅ Fast performance (<1s loads)
- ✅ Error messages clear
- ✅ Toast notifications work
- ✅ All filters functional

### Nice to Have:
- ✅ Smooth animations
- ✅ Keyboard navigation
- ✅ Accessibility features

---

## 🐛 BUG REPORTING

If you find bugs, report them with:
1. **Title:** Short description
2. **Severity:** High/Medium/Low
3. **Steps to Reproduce:** Numbered list
4. **Expected Result:** What should happen
5. **Actual Result:** What actually happens
6. **Screenshots:** If applicable
7. **Browser/Device:** Test environment

---

## 📞 SUPPORT

If you need help during testing:
- Check `SERVERS_RUNNING.md` for server status
- Check browser console for errors
- Check backend terminal for API errors
- Restart servers if needed

---

**Good luck with testing! 🚀**

*Let's get to 100% completion!*

