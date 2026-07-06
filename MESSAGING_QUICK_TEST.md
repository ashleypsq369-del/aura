# 🧪 MESSAGING SYSTEM - QUICK TEST GUIDE

**Status:** Ready for Testing  
**Date:** Context Transfer Session

---

## ✅ PRE-TEST CHECKLIST

- [x] Backend running on `http://localhost:8000`
- [x] Frontend running on `http://localhost:5173`
- [x] Database initialized with 31 tables
- [x] 6 test users available
- [x] Messaging tables created
- [x] API endpoints registered

---

## 🎯 TEST SCENARIO 1: START A NEW CONVERSATION

### Steps:
1. **Open the app:** `http://localhost:5173`
2. **Login** with any user credentials (check `check_passwords.py` for user list)
3. **Navigate to Messages** (click Messages in sidebar)
4. **Click the "+" button** (New Chat button in top-right)
5. **Select a physician** from the modal list
6. **Conversation should be created** automatically with welcome message

### Expected Results:
- ✅ No 500 error in console
- ✅ Conversation appears in left sidebar
- ✅ Welcome message displays in chat
- ✅ Conversation is selected automatically

### What Was Fixed:
- **Before:** 500 Internal Server Error when starting conversation
- **After:** Conversation created successfully using simplified SQL query

---

## 🎯 TEST SCENARIO 2: SEND MESSAGES

### Steps:
1. **Select a conversation** from the list
2. **Type a message** in the input box at bottom
3. **Click "Send"** or press Enter
4. **Message should appear** in the chat area

### Expected Results:
- ✅ Message appears immediately after sending
- ✅ Message shows your name and avatar
- ✅ Timestamp is displayed
- ✅ Gradient background (teal/cyan) for your messages
- ✅ Conversation moves to top of list (last_message_at updates)

---

## 🎯 TEST SCENARIO 3: VIEW CRISIS ALERTS ON DASHBOARD

### Steps:
1. **Navigate to Dashboard** (Home)
2. **Check the Critical Alerts section** (top-right)
3. **Should see crisis-level alerts** if any exist

### Expected Results:
- ✅ No 401 error in console for `/api/alerts?severity=crisis`
- ✅ Crisis alerts display correctly
- ✅ Alert cards show severity badge

### What Was Fixed:
- **Before:** 401 Unauthorized error when fetching crisis alerts
- **After:** Alerts endpoint now accepts `severity` parameter

---

## 🎯 TEST SCENARIO 4: MULTIPLE USERS MESSAGING

### Steps:
1. **Login as User 1** (e.g., admin/admin123)
2. **Start conversation** with another user (e.g., clinician)
3. **Send a message** from User 1
4. **Logout and login as User 2** (the clinician)
5. **Navigate to Messages**
6. **Check for unread count badge** on conversation
7. **Open the conversation** and read messages
8. **Reply** with a message

### Expected Results:
- ✅ User 2 sees unread badge (teal number) on conversation
- ✅ User 2 can read User 1's message
- ✅ User 2 can reply
- ✅ Messages display in chronological order
- ✅ Different gradient colors for each user's messages

---

## 🎯 TEST SCENARIO 5: SEARCH CONVERSATIONS

### Steps:
1. **Have multiple conversations** (at least 3)
2. **Type a name** in the search box at top
3. **Conversation list should filter** in real-time

### Expected Results:
- ✅ Only matching conversations show
- ✅ Search is case-insensitive
- ✅ Clear search to show all conversations

---

## 🔍 DEBUGGING - WHAT TO CHECK

### In Browser Console (F12):

**Look for these ERRORS (should NOT appear):**
```
❌ Failed to load resource: 500 (Internal Server Error) at /api/messaging/conversations/start
❌ Failed to load resource: 401 (Unauthorized) at /api/alerts?severity=crisis
```

**Look for these SUCCESS responses (should appear):**
```
✅ GET /api/messaging/conversations → 200 OK
✅ POST /api/messaging/conversations/start → 200 OK
✅ GET /api/messaging/conversations/{id}/messages → 200 OK
✅ POST /api/messaging/conversations/{id}/messages → 200 OK
✅ GET /api/alerts?severity=crisis → 200 OK
```

### In Backend Terminal:

**Should see these logs:**
```
INFO: 127.0.0.1:xxxxx - "POST /api/messaging/conversations/start HTTP/1.1" 200 OK
INFO: 127.0.0.1:xxxxx - "POST /api/messaging/conversations/{id}/messages HTTP/1.1" 200 OK
INFO: 127.0.0.1:xxxxx - "GET /api/alerts?severity=crisis HTTP/1.1" 200 OK
```

**Should NOT see:**
```
❌ ERROR: Exception in ASGI application
❌ 500 Internal Server Error
❌ SQL execution error
```

---

## 📊 TEST USERS (From Database)

Use these credentials to test multi-user messaging:

| Username | Password | Role | Purpose |
|----------|----------|------|---------|
| admin | admin123 | admin | Full access |
| drkwame | password123 | clinician | Physician testing |
| caregiver1 | password123 | caregiver | Care team testing |
| family1 | password123 | family | Family member testing |
| patient1 | password123 | patient | Patient portal testing |

---

## 🎨 UI FEATURES TO VERIFY

### Messages Page:
- [x] **3px borders** on all cards (not 1px)
- [x] **Gradient backgrounds** (no plain white)
- [x] **Teal/cyan color scheme** throughout
- [x] **Unread badges** in teal with white text
- [x] **Message bubbles** with gradients
- [x] **Conversation list** with hover effects
- [x] **New chat modal** with gradient header
- [x] **Search box** with focus border animation

### Dashboard:
- [x] **Crisis alerts section** loading correctly
- [x] **No 401 errors** in console
- [x] **Alert severity badges** displaying

---

## 🐛 IF YOU ENCOUNTER ERRORS

### Error: "Failed to start conversation"
**Check:**
1. Backend is running (`http://localhost:8000/docs` should load)
2. User is logged in (check `localStorage.getItem('auth_token')`)
3. Recipient user exists in database

### Error: "Failed to send message"
**Check:**
1. Conversation is selected
2. Message content is not empty
3. User has auth token

### Error: "No conversations yet"
**This is normal** - click "+" to start first conversation

---

## ✅ VERIFICATION CHECKLIST

After testing all scenarios, confirm:

- [ ] Can start new conversations (no 500 error)
- [ ] Can send messages successfully
- [ ] Messages appear in correct order
- [ ] Unread counts work correctly
- [ ] Search filters conversations
- [ ] Crisis alerts load on dashboard (no 401 error)
- [ ] Multiple users can message each other
- [ ] Conversation list updates after sending message
- [ ] UI follows HCI guidelines (3px borders, gradients)

---

## 🚀 NEXT ENHANCEMENTS (Future)

1. **Real-time updates** with WebSockets
2. **Message reactions** (thumbs up, heart)
3. **Typing indicators** ("User is typing...")
4. **File attachments** (images, PDFs)
5. **Voice/video calls** integration
6. **Group conversations** (multi-user chats)
7. **Message search** within conversations
8. **Push notifications** for new messages

---

## 📞 SUPPORT

**If tests fail:**
1. Check `MESSAGING_ERRORS_FIXED.md` for technical details
2. Review browser console for specific error messages
3. Check backend logs for SQL errors
4. Verify database has all 31 tables (`sqlite3 aura.db ".tables"`)

---

*Happy testing! The messaging system should now work without 500 or 401 errors.* 🎉
