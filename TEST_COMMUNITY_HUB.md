# 🧪 TEST COMMUNITY HUB - QUICK GUIDE

**Status:** Ready to Test  
**Groups:** 50 comprehensive support groups  
**Sample Posts:** 8 welcome messages

---

## ⚡ 60-SECOND TEST

1. **Login:** http://localhost:5173 with `admin`/`admin123`
2. **Navigate:** Click "Community Hub" in sidebar
3. **Browse:** Scroll through 50 groups in left sidebar
4. **Join:** Click "Join" on any group (e.g., "Hope & Meaning")
5. **View:** See welcome post with emoji reactions
6. **Post:** Type a message and click "Share Post"
7. **React:** Click 🙏 ❤️ or 💪 on any post

**Expected:** ✅ All features work, posts are anonymized!

---

## 📋 DETAILED TEST SCENARIOS

### Test 1: Browse All 50 Groups
**Steps:**
1. Login to application
2. Go to Community Hub
3. Scroll through left sidebar
4. Count groups (should be 50)
5. Read different categories

**Expected Results:**
- ✅ 50 groups display
- ✅ Categories cover all needs (physical, mental, spiritual, etc.)
- ✅ Each group has description and member count
- ✅ Ghana-specific groups present (NHIS, Twi, Rural)

---

### Test 2: Join Multiple Groups
**Steps:**
1. Browse groups
2. Click "Join" on "General Palliative Care Support"
3. Click "Join" on "Hope & Meaning"
4. Click "Join" on "Family Caregivers Circle"
5. Click "Join" on "Ghanaian Cultural Support"

**Expected Results:**
- ✅ Button changes to "Leave"
- ✅ "You're a member" badge appears
- ✅ Member count increases by 1
- ✅ Can join multiple groups

---

### Test 3: View Welcome Posts
**Steps:**
1. Join "Hope & Meaning" group
2. Select the group
3. Read welcome post
4. Check reactions (🙏 2, ❤️ 5, 💪 3)

**Expected Results:**
- ✅ Welcome post displays
- ✅ Post from "Aura Care Team (Moderator)"
- ✅ Reactions show with counts
- ✅ Post is inspiring and welcoming

---

### Test 4: Create Your Own Post
**Steps:**
1. Join any group
2. Type in text area: "Thank you for this community. I feel less alone already."
3. Watch character counter (67/280)
4. See anonymization notice
5. Click "Share Post"

**Expected Results:**
- ✅ Post created successfully
- ✅ Appears in feed immediately
- ✅ Your name is anonymized (e.g., "Admin · General Journey")
- ✅ Success toast appears

---

### Test 5: React to Posts
**Steps:**
1. View posts in a joined group
2. Click 🙏 (pray) on first post
3. Click ❤️ (heart) on second post
4. Click 💪 (strong) on third post
5. Hover over emojis

**Expected Results:**
- ✅ Counts increment by 1
- ✅ Emojis scale up on hover
- ✅ Smooth animations
- ✅ Reactions save to database

---

### Test 6: Search/Filter Groups
**Steps:**
1. Look for specific group
2. Scroll through sidebar
3. Read group names
4. Find "Cancer Journey" group
5. Find "Twi-Speaking Support Circle"

**Expected Results:**
- ✅ All 50 groups are findable
- ✅ Names are clear and descriptive
- ✅ Groups organized logically

---

### Test 7: Leave a Group
**Steps:**
1. Be member of a group
2. Click "Leave" button
3. Post creation form disappears
4. See "Join to participate" message

**Expected Results:**
- ✅ Can leave successfully
- ✅ UI updates immediately
- ✅ Member count decreases
- ✅ Cannot post anymore

---

### Test 8: Non-Member Experience
**Steps:**
1. Don't join a group
2. Select it from sidebar
3. Try to view posts

**Expected Results:**
- ✅ See group description
- ✅ See "Join to participate" prompt
- ✅ Cannot see posts
- ✅ Cannot create posts

---

### Test 9: Flag Inappropriate Post (Safety)
**Steps:**
1. View any post
2. Click flag icon (top-right)
3. Confirmation dialog appears
4. Click "Report"

**Expected Results:**
- ✅ Confirmation dialog shows
- ✅ "Post flagged for review" toast
- ✅ Flag count increases (visible to mods)
- ✅ Post auto-hides after 5 flags

---

### Test 10: Test Anonymization
**Steps:**
1. Login as different user roles
2. Create posts in groups
3. Check display names

**As Patient:**
- Expected: `FirstName · ConditionType Journey`

**As Family:**
- Expected: `Family of PatientName · ConditionType Journey`

**As Clinician:**
- Expected: `Dr. FullName (Care Team)`

**As Admin:**
- Expected: `Name (Moderator)`

---

## 🎯 SPECIFIC GROUP CATEGORIES TO TEST

### Physical Support
- [ ] Pain Management & Comfort
- [ ] Breathing & Respiratory Support
- [ ] Sleep & Night-Time Support

### Mental Health
- [ ] Hope & Meaning (has welcome post)
- [ ] Anxiety & Fear Support
- [ ] Mindfulness & Meditation

### Spiritual
- [ ] Christian Faith & Prayer
- [ ] Islamic Faith & Sabr
- [ ] Traditional African Spirituality

### Condition-Specific
- [ ] Cancer Journey
- [ ] Heart Disease & Heart Failure
- [ ] HIV/AIDS Care & Support

### Caregiver
- [ ] Family Caregivers Circle (has welcome post)
- [ ] Caregiver Burnout & Self-Care
- [ ] Children & Teens Support

### Practical
- [ ] Financial Support & Resources (has welcome post)
- [ ] Ghana NHIS & Healthcare Access
- [ ] Legal & Advance Directives

### Social
- [ ] Humor & Laughter (has welcome post)
- [ ] Music & Healing
- [ ] Arts, Crafts & Creativity

### Ghana-Specific
- [ ] Ghanaian Cultural Support (has welcome post)
- [ ] Twi-Speaking Support Circle
- [ ] Rural & Remote Communities

### General
- [ ] General Palliative Care Support (has welcome post)
- [ ] Living Well Every Day (has welcome post)
- [ ] New to Palliative Care

---

## 🔍 WHAT TO CHECK

### UI/UX Standards
- [ ] All cards have 3px borders
- [ ] Gradient backgrounds (no plain white)
- [ ] Teal/cyan color scheme
- [ ] Hover effects work
- [ ] Animations smooth
- [ ] Responsive on mobile

### Functionality
- [ ] Can join/leave groups
- [ ] Can create posts (280 char limit)
- [ ] Can react to posts
- [ ] Can flag posts
- [ ] Character counter works
- [ ] Member counts update

### Content Quality
- [ ] Group descriptions clear
- [ ] Welcome posts encouraging
- [ ] Categories comprehensive
- [ ] Ghana-specific content present
- [ ] All needs covered (physical, mental, spiritual, etc.)

### Privacy & Safety
- [ ] Names are anonymized
- [ ] Non-members can't see posts
- [ ] Flag system works
- [ ] Moderation features present

---

## 🐛 IF YOU ENCOUNTER ISSUES

### Issue: No Groups Showing
**Check:**
1. Run seed script: `python seed_community_groups.py` in backend
2. Backend logs for errors
3. Database has `community_groups` table
4. Browser console for errors

### Issue: Can't Join Groups
**Check:**
1. User is logged in
2. Auth token in localStorage (`auth_token`)
3. Backend endpoint `/api/community/groups/{id}/join` responding
4. No 401/403 errors in console

### Issue: Can't Create Posts
**Check:**
1. You've joined the group
2. Post content is not empty
3. Character count under 280
4. Auth token present
5. Backend endpoint responding

### Issue: Posts Not Showing
**Check:**
1. Group has posts (some may be empty)
2. You're a member of the group
3. Backend endpoint returning data
4. No errors in console

---

## ✅ SUCCESS CRITERIA

### All Tests Pass When:
- [x] 50 groups display correctly
- [x] Can join and leave groups
- [x] Can create posts (anonymized)
- [x] Can react with emojis
- [x] Welcome posts visible
- [x] Member counts update
- [x] UI follows design standards
- [x] No console errors

---

## 📊 EXPECTED DATABASE STATE

After seeding:
```
✅ 50 community groups created
✅ 0 memberships (users join during use)
✅ 8 welcome posts in key groups
✅ All groups active
✅ Member counts at 0 (will increase as users join)
```

After testing:
```
✅ Multiple memberships created
✅ Member counts updated
✅ New posts from test users
✅ Reaction counts increased
✅ Flag counts may increase
```

---

## 🎉 COMPLETION

When all tests pass:
- ✅ Community Hub fully functional
- ✅ 50 comprehensive support groups active
- ✅ Users can find support for any need
- ✅ Ghana-specific and cultural support available
- ✅ Safety and privacy features working

---

## 📞 REPORTING RESULTS

**All Working:**
"✅ Community Hub tested successfully. All 50 groups display, can join/leave, create posts, react, and flag content. Anonymization working correctly."

**Issues Found:**
"⚠️ Issue in [feature]. Steps: [1, 2, 3]. Expected: [X]. Actual: [Y]. Console error: [error message]."

---

**🚀 Start Testing Now!**

1. Open http://localhost:5173
2. Login: admin / admin123
3. Go to Community Hub
4. Start exploring 50 groups!

*The community awaits your participation!* 🌻
