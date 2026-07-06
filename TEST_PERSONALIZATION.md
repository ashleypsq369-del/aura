# 🧪 TEST PERSONALIZED GROUPS & GROUP MESSAGING

**Quick Test Guide - 5 Minutes**

---

## ⚡ QUICK TEST

### Test 1: See Personalized Recommendations (2 min)

1. **Login:** http://localhost:5173 with `patient1` / `password123`
2. **Navigate:** Community Hub
3. **Observe:** 
   - "⭐ RECOMMENDED FOR YOU" section appears
   - Groups with "⭐ For You" amber badge
   - Relevant groups shown first
4. **Scroll:** See "Other Support Groups" below

**Expected:** ✅ Personalized groups with badges, sorted by relevance

---

### Test 2: Create Group Chat (3 min)

1. **Stay logged in**
2. **Navigate:** Messages tab
3. **Click:** 👥 (Users icon - New Group Chat button)
4. **Enter:** Group name: "Support Team"
5. **Select:** Check 2+ physicians/caregivers
6. **Click:** "Create Group Chat"
7. **Verify:** Group chat appears in conversation list

**Expected:** ✅ Group chat created, can send messages

---

## 📋 DETAILED TESTS

### Test 3: Different User Recommendations

**As Patient (patient1):**
```
Recommended:
- ⭐ General Palliative Care Support
- ⭐ Living Well Every Day
- ⭐ New to Palliative Care
- ⭐ Hope & Meaning

Other:
- (Non-recommended groups)
```

**As Admin:**
```
Recommended:
- ⭐ General Palliative Care Support
- ⭐ Ghanaian Cultural Support

Other:
- (Most groups, as admin sees all)
```

**Steps:**
1. Login as different users
2. Check Community Hub
3. Note different recommendations

**Expected:** ✅ Each user sees personalized groups

---

### Test 4: Community Group Messaging

**Steps:**
1. Login as any user
2. Join "Hope & Meaning" in Community Hub
3. Go to Messages tab
4. Click "New Group Chat" (👥 icon)
5. See "Your Community Groups" section
6. See "Hope & Meaning" listed
7. Note member count shown

**Expected:** ✅ Community groups appear in messaging

---

### Test 5: Group Chat Features

**Steps:**
1. Create group chat with 3+ people
2. Open the group chat
3. Send a message
4. Verify all participants see it
5. Check group title displays

**Expected:** ✅ Group messaging works correctly

---

## 🐛 WHAT TO CHECK

### Community Hub
- [ ] "⭐ RECOMMENDED FOR YOU" header appears
- [ ] Groups have "⭐ For You" badge
- [ ] Amber highlighting on recommended
- [ ] "Other Support Groups" header
- [ ] Recommended groups shown first
- [ ] Can still access all groups

### Messages Page
- [ ] Two buttons: + (private) and 👥 (group)
- [ ] Group chat modal opens
- [ ] Can enter group name
- [ ] Community groups section shows
- [ ] Can select multiple participants
- [ ] Button disabled until 2+ selected
- [ ] Group chat created successfully

### Personalization
- [ ] Different users see different recommendations
- [ ] Patient sees condition-relevant groups
- [ ] Family sees caregiver groups
- [ ] Score-based sorting working

---

## ✅ SUCCESS CRITERIA

**All working when:**
- ✅ Personalized recommendations display
- ✅ "⭐ For You" badges show
- ✅ Different users see different groups first
- ✅ Can create group chats
- ✅ Can select 2+ participants
- ✅ Group messaging works
- ✅ Community groups integrate with messaging

---

## 📞 IF ISSUES FOUND

**Recommendations not showing:**
- Check backend logs for errors
- Verify user has profile/patient record
- Check relevance scoring logic

**Group chat not creating:**
- Check console for errors
- Verify auth_token in localStorage
- Check backend endpoint `/api/messaging/conversations/start`
- Verify at least 2 participants selected

**Community groups not in messaging:**
- Verify user joined groups
- Check endpoint `/api/messaging/community-groups`
- Ensure groups are active

---

**🚀 Start testing now!**

Login and see your personalized recommendations!
