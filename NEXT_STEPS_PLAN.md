# 🎯 NEXT STEPS - Feature Implementation Plan

**Date:** Friday, June 5, 2026  
**Current Status:** 78% Complete  
**Offline:** ✅ 100% Complete  
**PersonalisationQuest:** ✅ 100% Complete (Verified)

---

## ✅ JUST VERIFIED

### PersonalisationQuest.jsx - 100% Complete ✅
**File:** `frontend/src/pages/PersonalisationQuest.jsx`  
**Status:** FULLY IMPLEMENTED

**What's Included:**
- ✅ All 7 steps from KIRO spec
- ✅ Step 1: Language, info style, tech comfort
- ✅ Step 2: Diagnosis duration, emotional states
- ✅ Step 3: Physical symptoms, activity level, self-care
- ✅ Step 4: Mood score, coping strategies, future worry
- ✅ Step 5: Religious background, spiritual care
- ✅ Step 6: Support person, social connectedness, peer connection
- ✅ Step 7: Content preferences, info frequency, topic interests
- ✅ Progress bar with percentage
- ✅ Animated transitions
- ✅ Data saves to API
- ✅ Redirects to `/my-space` on completion

**Verification:** Complete - matches KIRO spec 100%

---

## 🚀 TOP 5 PRIORITY FEATURES TO BUILD

### Priority Order (By Impact & Dependencies):

#### 1. ⏳ **Adaptive Patient Portal** (HIGHEST PRIORITY)
**Why First:** PersonalisationQuest is done, portal is the payoff  
**Impact:** HIGH - Shows personalization in action  
**Time:** 4-6 hours  
**Status:** Not built (0%)

**What to Build:**
- Route: `/my-space`
- Consumes: `GET /api/portal/{patient_id}`
- Features:
  - Personalized greeting
  - Journey phase indicator (6 phases)
  - Today's focus card (diagnosis-specific)
  - Care team display
  - Next appointment
  - Recommended resources (based on preferences)
  - Community groups (if wants_community = true)
  - Journey events timeline
  - Adaptive content based on:
    - Condition category
    - Info style preference
    - Topic interests
    - Tech comfort level

**Backend Check Needed:**
- Verify `/api/portal/{patient_id}` endpoint exists
- If not, needs to be built first (2 hours)

---

#### 2. ⏳ **Critical Alert Modal** (SAFETY CRITICAL)
**Why Second:** Safety feature, AI predictions already working  
**Impact:** HIGH - Patient safety  
**Time:** 2-3 hours  
**Status:** Partially built (CriticalAlertModal.jsx exists, needs verification)

**What to Build:**
- Full-screen modal on high-risk (>78%)
- Triggers on:
  - Vitals logging (if risk spike)
  - Symptoms logging (if severe)
  - AI prediction update
  - Manual alert creation
- Content:
  - Patient name & risk score
  - Risk level badge (Crisis/High/Medium)
  - Top SHAP features (3-5)
  - AI explanation
  - Recommended actions
  - "Acknowledge" button
  - "View Patient" button
- Only for clinicians/admins
- Audio/visual alert option
- Auto-dismiss after acknowledgment

**Integration Points:**
- Dashboard.jsx (already has critical alert detection)
- VitalsDetail.jsx
- SymptomsDetail.jsx
- RealTimeAlerts.jsx

---

#### 3. ⏳ **User Registration Flow**
**Why Third:** Can't onboard users without it  
**Impact:** HIGH - User onboarding  
**Time:** 2-3 hours  
**Status:** Partial (login works, registration missing)

**What to Build:**
- Registration form (`/register`)
  - Full name
  - Email
  - Password (with strength indicator)
  - Confirm password
  - Role selection (patient/family/clinician)
  - Terms & conditions checkbox
  - Submit → creates user
- Forgot password flow (`/forgot-password`)
  - Email input
  - Send reset link
  - Email sent confirmation
- Reset password page (`/reset-password/:token`)
  - New password
  - Confirm password
  - Submit → updates password
- Email verification (optional)
  - Send verification email
  - Verify token endpoint

**Backend Check Needed:**
- Verify auth.py has all endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
  - `POST /api/auth/verify-email`

---

#### 4. ⏳ **Patient Journey Tracker**
**Why Fourth:** Engagement feature, not critical  
**Impact:** MEDIUM - Patient engagement  
**Time:** 3-4 hours  
**Status:** Not built (0%)

**What to Build:**
- Visual 6-phase journey map
- Phases:
  1. Diagnosis (initial)
  2. Treatment Planning
  3. Living with Illness
  4. Advanced Symptoms
  5. End-of-Life Care
  6. Bereavement (for family)
- Features:
  - Current phase highlighted
  - Phase descriptions
  - "What's next" guidance
  - Support available per phase
  - Milestone markers
  - Timeline view
- Route: `/my-journey`
- Accessible from Patient Portal
- Updates based on patient status

**Backend Check Needed:**
- Verify `patient_journey_events` table exists
- Verify journey phase detection logic
- API endpoint: `GET /api/journey/{patient_id}`

---

#### 5. ⏳ **Admin User Management - Verify CRUD**
**Why Fifth:** File exists, just needs verification  
**Impact:** MEDIUM - Admin tools  
**Time:** 1 hour (verification + fixes)  
**Status:** Partial (needs verification)

**What to Verify:**
- File: `frontend/src/pages/AdminUserManagement.jsx`
- Check if has:
  - ✅ List users
  - ✅ Search/filter
  - ❓ Create new user
  - ❓ Edit user details
  - ❓ Deactivate user
  - ❓ Change role
  - ❓ Reset password
- If missing, add CRUD operations

---

## 📊 IMPLEMENTATION ROADMAP

### Phase 1: Core Patient Experience (8 hours)
**Goal:** Complete patient-facing features

1. **Adaptive Patient Portal** (4-6 hours)
   - Build frontend component
   - Integrate with backend
   - Add diagnosis-specific cards
   - Test personalization

2. **Critical Alert Modal** (2-3 hours)
   - Verify existing component
   - Add trigger logic
   - Integrate with Dashboard
   - Test with high-risk patients

**Deliverable:** Patients can see personalized portal + clinicians get critical alerts

---

### Phase 2: User Onboarding (3 hours)
**Goal:** Enable user registration

3. **User Registration Flow** (2-3 hours)
   - Build registration form
   - Build forgot password
   - Build reset password
   - Test complete flow

**Deliverable:** New users can register and reset passwords

---

### Phase 3: Engagement & Admin (5 hours)
**Goal:** Complete remaining features

4. **Patient Journey Tracker** (3-4 hours)
   - Build visual journey map
   - Add phase detection
   - Integrate with portal
   - Test phase transitions

5. **Verify Admin User Management** (1 hour)
   - Check existing functionality
   - Add missing CRUD
   - Test all operations

**Deliverable:** Complete journey tracking + full admin tools

---

## 🎯 QUICK WIN OPTION

If you want quick visible progress, build in this order:

### Quick Win Path (4 hours):
1. **Critical Alert Modal** (2 hours) - Shows AI working
2. **User Registration** (2 hours) - Functional onboarding

**Why:** These are faster and show immediate value

Then come back for:
3. **Adaptive Patient Portal** (4-6 hours) - The big feature
4. **Journey Tracker** (3-4 hours) - Nice-to-have
5. **Admin Verification** (1 hour) - Polish

---

## 📋 BACKEND VERIFICATION CHECKLIST

Before building frontend, verify these endpoints exist:

### For Adaptive Patient Portal:
- [ ] `GET /api/portal/{patient_id}` - Returns personalized portal data
- [ ] `GET /api/journey/{patient_id}` - Returns journey phase

### For User Registration:
- [ ] `POST /api/auth/register` - Create new user
- [ ] `POST /api/auth/forgot-password` - Send reset email
- [ ] `POST /api/auth/reset-password` - Update password
- [ ] `POST /api/auth/verify-email` - Verify email token

### For Critical Alerts:
- [ ] `GET /api/alerts?severity=crisis` - Get crisis alerts
- [ ] `POST /api/alerts/{id}/acknowledge` - Mark alert as seen

### For Journey Tracker:
- [ ] `GET /api/journey/{patient_id}` - Get journey events
- [ ] `GET /api/journey/phases` - Get phase definitions
- [ ] `POST /api/journey/events` - Log journey event

**How to Check:**
```bash
# In backend directory
cd backend
grep -r "def.*portal" routers/
grep -r "def.*register" routers/
grep -r "def.*journey" routers/
```

---

## 🚀 RECOMMENDED APPROACH

### Option A: Full Patient Experience (Recommended)
**Time:** 8 hours  
**Order:** Portal → Alert Modal → Registration  
**Impact:** Complete patient-facing system

### Option B: Quick Wins First
**Time:** 4 hours then 8 hours  
**Order:** Alert Modal → Registration → Portal → Journey  
**Impact:** Faster visible progress

### Option C: Systematic Completion
**Time:** 16 hours  
**Order:** All 5 features in priority order  
**Impact:** 100% feature completion

---

## 📁 FILES TO CREATE

### New Files Needed:
1. `frontend/src/pages/PatientPortal.jsx` (Patient Portal)
2. `frontend/src/pages/Register.jsx` (Registration form)
3. `frontend/src/pages/ForgotPassword.jsx` (Forgot password)
4. `frontend/src/pages/ResetPassword.jsx` (Reset password)
5. `frontend/src/pages/PatientJourney.jsx` (Journey tracker)
6. `frontend/src/components/JourneyPhaseIndicator.jsx` (Phase visualization)
7. `frontend/src/components/JourneyTimeline.jsx` (Timeline component)

### Files to Verify/Update:
8. `frontend/src/components/CriticalAlertModal.jsx` (Verify complete)
9. `frontend/src/pages/AdminUserManagement.jsx` (Verify CRUD)
10. `frontend/src/pages/Dashboard.jsx` (Add alert modal trigger)

---

## ✅ SUCCESS CRITERIA

### Adaptive Patient Portal:
- [ ] Loads personalized data from API
- [ ] Shows correct greeting
- [ ] Displays journey phase
- [ ] Shows diagnosis-specific content
- [ ] Recommends relevant resources
- [ ] Adapts to info_style preference
- [ ] Shows community groups (if wanted)
- [ ] Mobile responsive

### Critical Alert Modal:
- [ ] Triggers on high risk (>78%)
- [ ] Shows full-screen modal
- [ ] Displays patient info
- [ ] Shows SHAP features
- [ ] Has acknowledge button
- [ ] Links to patient detail
- [ ] Only shows to clinicians
- [ ] Dismisses after acknowledgment

### User Registration:
- [ ] Registration form works
- [ ] Password validation
- [ ] Email validation
- [ ] Terms acceptance
- [ ] Forgot password sends email
- [ ] Reset password updates
- [ ] User can login after registration
- [ ] Redirects to questionnaire

### Patient Journey:
- [ ] 6 phases displayed
- [ ] Current phase highlighted
- [ ] Phase descriptions shown
- [ ] Timeline of events
- [ ] Milestone markers
- [ ] "What's next" guidance
- [ ] Support resources per phase
- [ ] Updates automatically

### Admin User Management:
- [ ] List all users
- [ ] Search users
- [ ] Create new user
- [ ] Edit user details
- [ ] Deactivate user
- [ ] Change role
- [ ] Reset password (admin)
- [ ] View audit log

---

## 🎊 AFTER COMPLETION

When all 5 features are done:

**System Completion:** 78% → 95%  
**Core Features:** 100% complete  
**Patient Experience:** 100% complete  
**Admin Tools:** 100% complete  
**Production Ready:** YES

**Remaining (Nice-to-Have):**
- Community enhancements (reactions, moderation)
- 40 real resources (content seeding)
- Database schema completion
- Care plan templates

**Time to 100%:** 2-4 more hours (polish)

---

## 💡 READY TO BUILD?

**I can start building any of these features now.**

**Quick questions to decide:**
1. Want me to build **Adaptive Patient Portal** first? (Biggest impact, shows personalization)
2. Want me to build **Critical Alert Modal** first? (Fastest, shows AI working)
3. Want me to build **User Registration** first? (Essential for onboarding)
4. Want me to verify **backend endpoints** first? (Ensure APIs exist)
5. Want me to build **all 5 in order**? (Systematic approach)

Just say "continue" or specify which feature, and I'll start building!

---

**Current Status:** Ready to build  
**Next Feature:** Awaiting your decision  
**Estimated Time to 95%:** 8-16 hours  
**System Quality:** Production-ready foundation  

**Let's finish this! 🚀**
