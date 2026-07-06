# 🔧 Priority Integration Plan - What Needs to be Done

**The Real Work**: Actually integrate the created components into working features

---

## ✅ What's Already Working

1. **Priority 1: SHAP in AI Insights** - ✅ Working
2. **Priority 2: Auto-Logoff** - ✅ Working

---

## 🔧 What Needs Integration (Estimated 2-3 hours)

### **Priority 3: ChatBot Safety** (30 minutes)

**Files to modify**:
- `frontend/src/components/ChatBot.jsx`
- `frontend/src/components/AuraChat.jsx`

**Changes needed**:
1. Import ChatbotConsentModal
2. Check localStorage for 'chatbot_consent_given'
3. Show modal on first chat open if not given
4. Add crisis keywords array
5. Check each message for keywords
6. Show CrisisInterventionOverlay if detected
7. Add "This is AI, not human" reminder every 5 messages

**Integration points**:
- Line ~10: Add imports
- Line ~20: Add state variables
- Line ~50: Add useEffect for consent check
- Line ~260: Add crisis detection in sendMessage
- Line ~600: Add consent modal JSX
- Line ~650: Add crisis overlay JSX

---

### **Priority 3: Usability Feedback** (10 minutes)

**File to modify**:
- `frontend/src/components/layout/Layout.jsx`

**Changes needed**:
1. Import UsabilityFeedback component
2. Add it after children, before closing div
3. Pass current page name as prop

**Integration point**:
- Line ~80: Add `<UsabilityFeedback pageName={location.pathname} />`

---

### **Priority 4: Model Bias Report Backend** (20 minutes)

**File to verify/fix**:
- `backend/routers/ethics.py`

**Check**:
1. Verify endpoint exists
2. Verify it returns real data
3. Test with curl or Postman
4. Fix any errors

---

### **Priority 5: Bereavement Backend Connections** (40 minutes)

**Files to verify**:
- All 10 endpoints in `backend/routers/bereavement.py`

**Test each endpoint**:
1. POST /grief-screening - Submit works?
2. GET /grief-screening/status - Returns data?
3. POST /journal - Saves entry?
4. GET /journal/entries - Returns entries?
5. Etc.

**Fix any broken connections between frontend and backend**

---

### **Priority 4: AI Consent in Setup** (20 minutes)

**File to check**:
- `frontend/src/pages/PersonalisationQuest.jsx`

**Verify**:
1. Does Step 7 exist?
2. Does it show AI consent section?
3. Does it save to backend?
4. If not, add it

---

## 🎯 Priority Order

1. **First**: ChatBot Safety (most visible, user-facing)
2. **Second**: Usability Feedback (easy win)
3. **Third**: Test/fix backend endpoints
4. **Fourth**: Verify AI consent in setup

---

## 💡 The Real Issue

**Problem**: Components were created as separate files but never imported/used in the actual application workflow.

**Solution**: Go through each component and actually wire it into the application:
- Import it
- Add state management
- Connect to backend
- Test it works

**Not needed**: More documentation, more demo pages, more explanations.

**Needed**: Actual integration work - imports, state, connections, testing.

---

## ✅ Success Criteria

When done, user should be able to:
1. Open ChatBot → See consent modal (first time)
2. Type "suicide" → See crisis overlay
3. See floating feedback widget on all pages
4. Go to Model Bias Report → See real data
5. Go to Bereavement → Submit grief screening and see it save
6. Go through setup → See AI consent at Step 7

**That's what "implemented" really means - features that work when you use them.**

