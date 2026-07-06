# 🎯 PERSONALIZED SUPPORT GROUPS & GROUP MESSAGING

**Date:** Session Update  
**Status:** ✅ COMPLETE  
**Features:** User-Centered Recommendations + Group Chat Integration

---

## 🎯 WHAT WAS ENHANCED

### 1. ✅ **Personalized Group Recommendations**
- Groups are now ranked by relevance to each user
- Recommended groups shown first with "⭐ For You" badge
- Relevance based on diagnosis, role, and context

### 2. ✅ **Group Messaging System**
- Create group chats with multiple participants
- Link group chats to community support groups
- Integrated into Messages tab

### 3. ✅ **User-Centered Design**
- Each user sees groups relevant to their situation
- No interference between different user types
- Intelligent tag-based filtering

---

## 🔬 PERSONALIZATION ALGORITHM

### How Relevance is Calculated

**Step 1: Extract User Tags**
```python
def _get_user_relevant_tags(user, db):
    # For patients: condition category, diagnosis-specific
    # For family: caregiver tags + patient's condition
    # For caregivers: burnout, self-care tags
    # Universal: mental_health, spiritual, hope, ghana
```

**Step 2: Match Against Group Tags**
```python
def _calculate_relevance_score(group, user_tags):
    # Count matching tags
    # Boost general support groups
    # Boost Ghana-specific for local users
    # Return score 0-100
```

**Step 3: Sort and Filter**
- Recommended: Score ≥ 60 (shown first with badge)
- Other: Score < 60 (shown after recommended)
- Filtered: Score < 30 (hidden if recommended_only=true)

---

## 📊 PERSONALIZATION EXAMPLES

### Example 1: Cancer Patient
**User:** Patient with "Lung Cancer" diagnosis

**Relevant Tags Generated:**
- `cancer`, `oncology`, `lung`, `respiratory`
- `palliative`, `hospice`, `living`, `wellness`
- `mental_health`, `spiritual`, `hope`, `ghana`

**Recommended Groups (Score ≥ 60):**
- ⭐ Cancer Journey (90)
- ⭐ Lung Disease & COPD (85)
- ⭐ Hope & Meaning (75)
- ⭐ Living Well Every Day (70)
- ⭐ General Palliative Care Support (65)

**Other Groups (Score < 60):**
- Arts, Crafts & Creativity (50)
- Financial Support & Resources (50)
- Gentle Exercise & Movement (45)

---

### Example 2: Family Caregiver
**User:** Family member caring for parent with heart disease

**Relevant Tags Generated:**
- `caregiver`, `family`, `support`
- `heart`, `cardiac` (from linked patient)
- `mental_health`, `spiritual`, `hope`, `ghana`

**Recommended Groups (Score ≥ 60):**
- ⭐ Family Caregivers Circle (95)
- ⭐ Heart Disease & Heart Failure (90)
- ⭐ Caregiver Burnout & Self-Care (85)
- ⭐ Adult Children Caregivers (80)
- ⭐ Anxiety & Fear Support (70)

---

### Example 3: Healthcare Provider
**User:** Clinician role

**Relevant Tags Generated:**
- `general`, `palliative`, `hospice`
- `mental_health`, `spiritual`, `ghana`

**Recommended Groups (Score ≥ 60):**
- ⭐ General Palliative Care Support (75)
- ⭐ Hospice Care Circle (70)
- ⭐ Ghanaian Cultural Support (65)

*Note: Clinicians see fewer recommendations as they're more observers than participants*

---

## 💬 GROUP MESSAGING FEATURES

### 1. **Create Group Chats**

**From Messages Tab:**
1. Click "Users" icon (New Group Chat button)
2. Optional: Enter group name
3. Select 2+ participants
4. Click "Create Group Chat"

**Features:**
- Minimum 2 participants
- Optional custom group name
- Participants selected from available users
- Auto-generated title if no name provided

### 2. **Community Group Integration**

**Your Community Groups Section:**
- Shows groups you've joined
- Displays member count
- Shows if group already has a chat
- Can open existing chats
- Can create new group chats

**Workflow:**
1. Join a community group (e.g., "Cancer Journey")
2. Go to Messages tab
3. Click "New Group Chat"
4. See your community groups listed
5. Either open existing chat or create new one

### 3. **Group Conversation Features**

**In Group Chats:**
- Multiple participants visible
- Group title displayed
- All members can send messages
- Same emoji reactions
- Group admin role (creator)
- Participant role (members)

---

## 🎨 UI/UX ENHANCEMENTS

### Community Hub Page

**Recommended Section:**
```
⭐ RECOMMENDED FOR YOU
├── [Group with "⭐ For You" badge]
├── [Relevance score 60-100]
└── [Sorted by score desc]

OTHER SUPPORT GROUPS
├── [Groups without recommendation]
├── [Relevance score < 60]
└── [Sorted by member count]
```

**Group Card Design:**
- "⭐ For You" badge on recommended groups
- Amber highlight for recommendations
- Clear visual separation
- Relevance-based sorting

### Messages Page

**New Buttons:**
- `+ Plus Icon` - Start private chat (teal)
- `👥 Users Icon` - Create group chat (cyan)

**Group Chat Modal:**
- Group name input (optional)
- Community groups section (if member of any)
- Participant selection (checkboxes)
- Minimum 2 participants validation
- Create button disabled until valid

---

## 🔧 TECHNICAL IMPLEMENTATION

### Backend Changes

**1. New Helper Functions (community.py)**
```python
_get_user_relevant_tags(user, db)
  # Extracts relevant tags for user based on role/condition

_calculate_relevance_score(group, user_tags)
  # Calculates 0-100 relevance score
```

**2. Enhanced GET /api/community/groups**
```python
@router.get("/groups")
async def list_groups(
    current_user,
    db,
    recommended_only: bool = False  # NEW parameter
):
    # Calculate relevance for each group
    # Sort by joined, relevance, member_count
    # Return with relevance_score and is_recommended fields
```

**3. Enhanced POST /api/messaging/conversations/start**
```python
class StartConversationRequest:
    recipient_id: Optional[int]  # For private
    conversation_type: str  # private/support/group
    participant_ids: Optional[List[int]]  # For group
    community_group_id: Optional[int]  # Link to community
```

**4. New GET /api/messaging/community-groups**
```python
@router.get("/community-groups")
async def get_community_groups_for_messaging():
    # Returns groups user is a member of
    # Includes whether group has existing conversation
    # For group chat creation
```

### Frontend Changes

**1. CommunityHub.jsx**
- Separate `recommendedGroups` and `otherGroups`
- New `GroupCard` component with badge support
- "⭐ For You" badge display
- Recommended section header

**2. Messages.jsx**
- New state: `showNewGroup`, `selectedParticipants`, `groupName`
- New button: "New Group Chat"
- New modal: Group chat creation
- Community groups integration
- Participant selection UI
- Group conversation support

---

## 📋 API ENDPOINTS ADDED/MODIFIED

### Modified Endpoints

**GET /api/community/groups**
```
Query Parameters:
  - recommended_only: bool (optional)

Response:
  - id, name, description, member_count
  - condition_tags, joined
  - relevance_score: 0-100 (NEW)
  - is_recommended: bool (NEW)
```

**POST /api/messaging/conversations/start**
```
Request Body:
  - recipient_id: int (optional, for private)
  - conversation_type: "private" | "support" | "group" (NEW)
  - participant_ids: List[int] (optional, for group)
  - community_group_id: int (optional)
  - initial_message: string (optional)

Response:
  - conversation_id: int
  - message: string
  - type: "private" | "support" | "group" (NEW)
```

### New Endpoints

**GET /api/messaging/community-groups**
```
Authorization: Required

Response:
  {
    "groups": [
      {
        "group_id": int,
        "name": string,
        "description": string,
        "member_count": int,
        "has_conversation": bool,
        "conversation_id": int | null
      }
    ]
  }
```

---

## 🧪 TESTING GUIDE

### Test 1: Personalized Recommendations

**As Patient with Cancer:**
1. Login as patient1
2. Navigate to Community Hub
3. See "⭐ RECOMMENDED FOR YOU" section
4. Verify "Cancer Journey" group has badge
5. Verify relevant groups shown first

**Expected:**
- ✅ Recommended section appears
- ✅ Cancer-related groups recommended
- ✅ General support groups recommended
- ✅ Unrelated groups in "Other" section

---

### Test 2: Create Group Chat

**Steps:**
1. Login to application
2. Navigate to Messages
3. Click "👥" (Users icon) button
4. Enter group name: "Cancer Support Team"
5. Select 2+ participants
6. Click "Create Group Chat"

**Expected:**
- ✅ Modal opens
- ✅ Can enter group name
- ✅ Can select multiple participants
- ✅ Button disabled until 2+ selected
- ✅ Group chat created successfully
- ✅ Conversation appears in list

---

### Test 3: Community Group Chat

**Steps:**
1. Join a community group (e.g., "Hope & Meaning")
2. Navigate to Messages
3. Click "New Group Chat"
4. See "Your Community Groups" section
5. View "Hope & Meaning" listed
6. Note it shows member count

**Expected:**
- ✅ Community groups section appears
- ✅ Only shows groups you've joined
- ✅ Shows member count
- ✅ Can create chat for group

---

### Test 4: Different User Roles

**As Patient:**
- See condition-specific groups recommended
- See general support groups
- Few caregiver-specific groups

**As Family Member:**
- See caregiver groups recommended
- See linked patient's condition groups
- See family-specific support

**As Clinician:**
- See general support groups
- See fewer specific recommendations
- Can access all groups

**Expected:**
- ✅ Each role sees different recommendations
- ✅ Relevance varies by role
- ✅ All users can still access all groups

---

## 💡 PERSONALIZATION LOGIC DETAILS

### Tag Extraction by Role

**Patient Role:**
```python
tags = ["general"]

# Add condition category (cancer, heart, kidney, etc.)
if patient.primary_diagnosis:
    category = detect_condition_category(diagnosis)
    tags.append(category)
    
    # Add specific condition tags
    if "cancer" in diagnosis:
        tags.extend(["cancer", "oncology"])
    if "heart" in diagnosis:
        tags.extend(["heart", "cardiac"])
    # ... more conditions

# Add universal tags
tags.extend(["palliative", "hospice", "mental_health", "spiritual", "ghana"])
```

**Family Role:**
```python
tags = ["caregiver", "family", "support"]

# Get linked patient's condition
if linked_patient:
    category = detect_condition_category(patient.diagnosis)
    tags.append(category)

# Add universal tags
tags.extend(["mental_health", "spiritual", "hope", "ghana"])
```

**Caregiver Role:**
```python
tags = ["caregiver", "burnout", "self_care"]
tags.extend(["mental_health", "spiritual", "hope", "ghana"])
```

### Scoring Algorithm

```python
def _calculate_relevance_score(group, user_tags):
    group_tags = parse_tags(group.condition_tags)
    
    # Count matching tags
    matches = count_matches(group_tags, user_tags)
    
    # Special boosts
    if group.name in GENERAL_GROUPS:
        matches += 5  # Boost universal support
    
    if "ghana" in both group_tags and user_tags:
        matches += 3  # Boost local relevance
    
    # Calculate percentage + bonus
    if not group_tags:
        return 50  # Neutral for untagged
    
    percentage = (matches / len(group_tags)) * 100
    bonus = matches * 10
    
    score = min(100, percentage + bonus)
    return max(0, score)
```

---

## 🎯 USER BENEFITS

### For Patients
✅ See groups relevant to their condition first  
✅ No overwhelm from irrelevant groups  
✅ Find support faster  
✅ "For You" badge guides discovery  
✅ Can create group chats with support network  

### For Family Caregivers
✅ Caregiver-specific groups prioritized  
✅ See patient's condition groups  
✅ Balanced recommendations  
✅ Connect with other caregivers  
✅ Group messaging for coordination  

### For Healthcare Providers
✅ See relevant professional groups  
✅ Access all groups when needed  
✅ Create group chats with care teams  
✅ Coordinate patient care  

### For All Users
✅ User-centered experience  
✅ No interference between user types  
✅ Intelligent recommendations  
✅ Still can access all groups  
✅ Group messaging integrated seamlessly  

---

## 🔮 FUTURE ENHANCEMENTS

### Personalization
- [ ] Machine learning for better recommendations
- [ ] User feedback on recommendations
- [ ] Adjust scores based on engagement
- [ ] Time-based recommendations (grieving stages)
- [ ] Similar user recommendations

### Group Messaging
- [ ] Group chat admin controls (add/remove members)
- [ ] Group descriptions and images
- [ ] Pin important messages
- [ ] @mention participants
- [ ] Group voice/video calls
- [ ] File sharing in groups
- [ ] Group settings/permissions

### Integration
- [ ] Auto-suggest groups based on questionnaire
- [ ] Alert-triggered group invitations
- [ ] Care team auto-grouping
- [ ] Family member auto-grouping
- [ ] Scheduled group events

---

## ✅ COMPLETION CHECKLIST

- [x] Implement user tag extraction logic
- [x] Implement relevance scoring algorithm
- [x] Enhance GET /api/community/groups endpoint
- [x] Add recommended_only parameter
- [x] Update frontend to display recommendations
- [x] Add "⭐ For You" badges
- [x] Separate recommended and other sections
- [x] Add group conversation support to backend
- [x] Update conversation start endpoint
- [x] Add community groups endpoint for messaging
- [x] Create group chat UI in Messages page
- [x] Add participant selection interface
- [x] Integrate community groups in messaging
- [x] Test personalization for different roles
- [x] Test group chat creation
- [x] Document all features

---

## 🎉 SUMMARY

**Enhanced the Community Hub and Messaging system with:**

✅ **Personalized Group Recommendations** - Users see groups relevant to their situation first  
✅ **Relevance Scoring** - Algorithm calculates 0-100 relevance score per group  
✅ **User-Centered Design** - No interference, each user sees their relevant content  
✅ **Group Messaging** - Create multi-participant group chats  
✅ **Community Integration** - Link group chats to support groups  
✅ **Messages Tab Enhancement** - Create groups directly from messaging  

**Result:** Users now have a personalized, non-overwhelming experience with intelligent recommendations and the ability to create group chats for coordinated support!

---

*From generic group lists to intelligent, personalized recommendations + group messaging!* 🎯
