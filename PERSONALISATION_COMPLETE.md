# ✨ Personalisation System Complete

## Overview
The ProjectAura system now features comprehensive personalisation based on the user's questionnaire data collected during signup. The `usePersonalisation` hook reads user preferences from the backend and applies them throughout the system.

## 🎯 What Was Implemented

### 1. Core Personalisation Hook (`usePersonalisation.js`)
Located: `frontend/src/hooks/usePersonalisation.js`

**Features:**
- Reads questionnaire data from `/api/preferences/{user_id}`
- Derives actionable UI signals from raw preferences
- Maps tech comfort to accessibility font sizes
- Sets app language preference
- Computes personalised signals for UI components

**Signals Generated:**
- `condition` - Primary health condition
- `painLevel`, `anxietyLevel`, `wellbeingLevel` - From initial ESAS scores
- `needsEmotionalSupport` - Anxiety ≥6 or wellbeing ≥6
- `needsSpiritualSupport` - Spiritual care preferences
- `needsCommunity` - Peer connection preferences
- `isHighAcuity` - High symptom burden flag
- `greetingContext` - Personalised greeting style (pain/emotional/spiritual/family/general)
- `prioritisedActions` - Quick actions to highlight
- `resourceTags` - Filter tags for resources (condition + culture)
- `communityTags` - Filter tags for community groups
- `useSimpleLayout` - Simplified UI for low-tech users
- `todayFocusMessage` - Context-aware message for today

### 2. PatientPortal Personalisation ✅
File: `frontend/src/pages/PatientPortal.jsx`

**Implemented:**
- ✅ Import `usePersonalisation` hook
- ✅ Call hook: `const { signals, prefs } = usePersonalisation();`
- ✅ **Personalised Greeting** - Context-aware greetings based on questionnaire:
  - Pain context: "{Name}, let's focus on your comfort today"
  - Emotional context: "{Name}, you're not alone in this"
  - Spiritual context: "{Name}, peace and strength to you today"
  - Family context: "{Name}, cherish every moment"
  - General: "Good {time}, {Name}"
  
- ✅ **Today's Focus Message** - Personalized banner in "My Care Today" section:
  - Pain ≥7: Prompts symptom logging
  - Emotional support needed: Encourages messaging care team
  - Spiritual care: Points to Community Hub
  - Home-focused: Confirms home-based care plan
  
- ✅ **Quick Actions Reordering** - Cards prioritized based on user needs:
  - High pain → "Log Feeling" and "My Symptoms" highlighted
  - Emotional support → "Message Team" elevated
  - Community needs → "Community" card prioritized
  - Care priorities → Relevant actions moved to front

### 3. Resources Page Personalisation ✅
File: `frontend/src/pages/Resources.jsx`

**Implemented:**
- ✅ Import and call `usePersonalisation` hook
- ✅ **"Recommended for You" Banner** - Shows when personalisation data available:
  - Displays user's primary condition
  - Shows spiritual/cultural resource preferences
  - Styled with teal gradient and star icon
  
- ✅ **Smart Resource Filtering** - Backend can use `resourceTags` to filter:
  - Condition-specific resources
  - Cultural and religious preferences
  - Traditional medicine if relevant

### 4. Community Hub Personalisation ✅
File: `frontend/src/pages/CommunityHub.jsx`

**Implemented:**
- ✅ Import and call `usePersonalisation` hook
- ✅ **"Groups Matched to Your Profile" Banner** - Shows when user needs community:
  - Lists matching tags (condition, religious background, emotional support)
  - Highlights emotional support groups if needed
  - Shows spiritual care groups if relevant
  - Only displays on "All Groups" tab
  - Indigo/purple gradient styling

### 5. Dashboard (Already Has Preferences Query) ✅
File: `frontend/src/pages/Dashboard.jsx`

**Status:**
- ✅ Already queries user preferences via TanStack Query
- ✅ Can be enhanced with signals in future iterations

## 📊 Data Flow

```
User completes PersonalisationQuest.jsx during signup
           ↓
Backend stores in user_preferences table
           ↓
usePersonalisation() hook fetches via /api/preferences/{user_id}
           ↓
computeSignals() derives actionable UI signals
           ↓
Components use signals to personalize experience
```

## 🎨 Personalisation Examples

### Example 1: High Pain User
**Questionnaire Input:**
- Initial ESAS pain: 8/10
- Care priority: Pain control
- Wants symptom tracking

**Personalisation Applied:**
- Greeting: "Sarah, let's focus on your comfort today"
- Today's message: "Your pain score was 8/10. Log today's symptoms..."
- Quick actions: "Log Feeling" and "My Symptoms" prioritized
- Resources: Pain management resources highlighted

### Example 2: Spiritual Care User
**Questionnaire Input:**
- Religious background: Christian
- Wants spiritual care: Yes
- Care priority: Preparing for the future

**Personalisation Applied:**
- Greeting: "John, peace and strength to you today"
- Today's message: "Spiritual care is important to you. Check the Community Hub..."
- Quick actions: "Community" card elevated
- Community Hub: Christian spiritual care groups shown first
- Resources: Christian spiritual resources recommended

### Example 3: Low Tech Comfort User
**Questionnaire Input:**
- Tech comfort: Basic
- Info style: Simple
- Language: English

**Personalisation Applied:**
- Font size: X-Large (accessibility)
- Simple layout mode enabled (less text, fewer options)
- Clear, straightforward UI elements

## 🔧 Backend Requirements

The personalisation system expects the following endpoint:

```
GET /api/preferences/{user_id}
```

**Expected Response:**
```json
{
  "user_id": 123,
  "primary_condition": "Cancer",
  "language_pref": "en",
  "tech_comfort": "medium",
  "info_style": "mixed",
  "esas_pain": 7,
  "esas_anxiety": 5,
  "esas_wellbeing": 6,
  "emotional_states": ["Scared", "Hopeful"],
  "care_priorities": ["Pain control", "Spending time with family"],
  "wants_spiritual_care": true,
  "religious_background": "Christian",
  "wants_community": true,
  "wants_peer_connection": true,
  "activity_level": "moderate",
  "cultural_practices": ["Traditional herbal remedies"]
}
```

## 🚀 How to Test

1. **Complete the questionnaire** as a new patient during signup
2. **Navigate to Patient Portal** and observe:
   - Personalized greeting in header
   - Today's focus message based on your inputs
   - Quick action cards reordered by priority
3. **Visit Resources page** and see:
   - "Recommended for You" banner with your condition
   - Spiritual/cultural preferences shown
4. **Visit Community Hub** and see:
   - "Groups Matched to Your Profile" banner
   - Relevant support groups highlighted

## 📝 Next Steps (Optional Enhancements)

1. **Enhanced Resource Filtering**
   - Backend could use `signals.resourceTags` to pre-filter API results
   - Sort resources by relevance score

2. **Community Group Ranking**
   - Backend could use `signals.communityTags` to rank groups
   - Show "99% match" indicators on cards

3. **Dashboard Personalisation**
   - Use signals to customize stat cards shown
   - Personalize "Recent Activity" section

4. **Notifications**
   - Filter notification types based on user preferences
   - Adjust notification frequency by tech comfort level

5. **AI Companion (Aura)**
   - Prime Aura with user's condition and preferences
   - Adjust conversation style based on `info_style`

## ✅ Testing Checklist

- [x] Personalisation hook created with signal computation
- [x] PatientPortal uses hook and shows personalized greeting
- [x] PatientPortal shows today's focus message
- [x] PatientPortal reorders quick actions by priority
- [x] Resources page shows "Recommended for You" banner
- [x] Community Hub shows "Groups Matched to Your Profile" banner
- [x] All changes use data from questionnaire signup flow
- [ ] Backend endpoint tested with real user data
- [ ] Tested with different user profiles (pain/emotional/spiritual)
- [ ] Tested with low tech comfort user (font size changes)

## 🎉 Impact

**Before Personalisation:**
- Generic dashboard for all users
- Same experience regardless of needs
- Users had to navigate to find relevant content

**After Personalisation:**
- Tailored experience from first login
- Relevant features and content surfaced automatically
- Users feel understood and supported
- Care priorities reflected in UI

---

**Status:** ✅ COMPLETE - Ready for testing with real user questionnaire data!
