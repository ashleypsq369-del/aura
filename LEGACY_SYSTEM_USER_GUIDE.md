# 📖 Digital Legacy System - User Guide

## 🎯 What is the Digital Legacy System?

The Digital Legacy System allows patients to:
- Leave final messages for loved ones
- Designate who can access their memories after they pass away
- Create a lasting digital legacy
- Provide comfort to families during bereavement

---

## 👥 WHO CAN USE THIS?

### Patients Can:
- Give consent for digital legacy
- Designate heirs (anyone: family, friends, caregivers)
- Create final messages and letters
- Control what heirs can access
- Revoke consent anytime

### Family/Caregivers Can:
- Be designated as heirs
- Access delivered content after patient passes
- View memories (if permitted)
- Read final messages

### Clinicians Can:
- Witness patient consent
- Activate legacy when patient passes
- Ensure legal compliance

---

## 🚶 PATIENT WORKFLOW

### Step 1: Give Consent (Required)
**Page:** `/legacy-setup` (Digital Legacy in sidebar)

1. Click "Give My Consent"
2. Check boxes for what you want to share:
   - ☐ Memories
   - ☐ Journal Entries
   - ☐ Messages & Conversations
   - ☐ Photos & Videos
   - ☐ Medical Information
3. Select a clinician as witness (required)
4. Click "Submit Consent"

**Result:** Your digital legacy program is active ✅

---

### Step 2: Designate Heirs (Required)
**Page:** `/heir-management` (Manage Heirs in sidebar)

1. Click "Add Heir"
2. Fill in the form:
   - **Select User:** Choose from any user in system
   - **Relationship:** e.g., "Daughter", "Son", "Best Friend", "Caregiver"
   - **Access Level:** 
     - Full Access (recommended)
     - Memories Only
     - Messages Only
   - **Private Content:** ☐ Can access private memories/journal
   - **Personal Message:** Optional note to your heir
3. Click "Add Heir"
4. Repeat for each heir you want to designate

**Result:** Your heirs are designated ✅

---

### Step 3: Create Legacy Content (Optional)
**Page:** `/legacy-content` (Legacy Content in sidebar)

1. Click "Create Content"
2. Choose content type:
   - Final Message (recommended)
   - Letter
   - Personal Note
   - Audio Message (coming soon)
   - Video Message (coming soon)
3. Enter title and content
4. Choose recipient:
   - All Heirs (recommended)
   - Specific Heir
   - Specific Person
5. Choose delivery time:
   - After I Pass Away (recommended)
   - On a Specific Date
6. Click "Create Content"

**Result:** Your final messages are saved ✅

---

### Step 4: Create Memories (Optional)
**Page:** `/memory-vault` (Memory Vault in sidebar)

1. Click "Share a Memory"
2. Write your memory
3. Choose privacy:
   - Shared (all heirs with memory access can see)
   - Private (only heirs with "private access" can see)
4. Click "Save Memory"

**Result:** Your memories are saved ✅

---

### Step 5: Write Journal Entries (Optional)
**Page:** `/journal` (My Journal in sidebar)

1. Click "New Entry"
2. Write your journal entry
3. Choose privacy level
4. Click "Save Entry"

**Result:** Your journal is saved ✅

---

## 👨‍⚕️ CLINICIAN WORKFLOW

### When Patient Passes Away:

**Option 1: Via API** (recommended for system integration)
```bash
POST /api/legacy/activate/{patient_id}
{
  "clinician_user_id": 4,
  "deceased_at": "2024-03-15T10:30:00"
}
```

**Option 2: Via Future UI** (coming in Phase 2)
- Go to Patient Detail page
- Click "Activate Legacy"
- Confirm action

**What Happens:**
- Patient marked as deceased ✅
- All legacy content delivered ✅
- All heirs notified ✅
- Heirs can now access content ✅

---

## 👨‍👩‍👧‍👦 HEIR WORKFLOW

### View Legacy Access:
**Page:** `/my-legacy-access` (Legacy Access in sidebar)

1. Login to ProjectAura
2. Click "Legacy Access" in sidebar
3. You'll see list of patients you're heir for
4. Click on patient card to view full legacy

**What You Can See:**
- Patient's name and your relationship
- Your access level (full, memories only, etc.)
- Personal message patient left for you
- Delivered content (messages, letters, notes)
- Memories (if permitted)
- Journal entries (if permitted)
- Photos (if permitted)

---

## 🔒 ACCESS CONTROL EXPLAINED

### Access Levels:

**Full Access:**
- All memories (shared + private)
- All journal entries
- All messages
- All photos
- Medical information (if patient consented)

**Memories Only:**
- Only memories patient created
- No journal, messages, or medical info

**Messages Only:**
- Only delivered messages and letters
- No memories or journal

### Privacy Controls:

**Shared Content:**
- Visible to all heirs with that content type access
- Example: Shared memory → All heirs with "memory access" see it

**Private Content:**
- Only visible to heirs with "Can access private content" enabled
- Example: Private journal entry → Only heirs with private access see it

---

## ❓ FREQUENTLY ASKED QUESTIONS

### Q: Who can I designate as an heir?
**A:** Anyone! Family, friends, caregivers, clinicians, or any user in the system.

### Q: Can I change my mind?
**A:** Yes! You can:
- Revoke consent anytime
- Remove heirs anytime
- Delete content (before it's delivered)

### Q: When is content delivered?
**A:** Content is delivered when:
1. You pass away (clinician activates legacy)
2. OR on specific date you chose (for scheduled delivery)

### Q: Can heirs see my content before I die?
**A:** No! Content is NOT visible to heirs until legacy is activated.

### Q: What if I don't want to share medical information?
**A:** You control what to share. Uncheck "Medical Information" when giving consent.

### Q: Can I have different access levels for different heirs?
**A:** Yes! Each heir can have different access:
- Daughter: Full access + private content
- Son: Memories only
- Friend: Messages only

### Q: Is this legal?
**A:** Yes! System follows:
- HIPAA (USA healthcare privacy law)
- GDPR (European privacy regulation)
- Ghana healthcare standards
- Consent must be witnessed by clinician
- Audit trail maintained

### Q: What happens to my data if I revoke consent?
**A:** Your consent is revoked immediately. Heirs lose access (optional: data can be deleted).

---

## 🎨 NAVIGATION GUIDE

### Patient Menu:
```
📊 My Space                  → /my-space
💬 Messages                  → /messages
🗺️ My Journey               → /my-journey
📚 Resources                 → /resources
👥 Community                 → /community
💜 Memory Vault              → /memory-vault
📝 My Journal                → /journal
🛡️ Digital Legacy           → /legacy-setup          ⭐ START HERE
👥 Manage Heirs              → /heir-management       ⭐ STEP 2
📧 Legacy Content            → /legacy-content        ⭐ STEP 3
👤 My Profile                → /profile
```

### Family/Caregiver Menu:
```
📊 Overview                  → /dashboard
💬 Messages                  → /messages
👥 Community                 → /community
📚 Resources                 → /resources
💜 Memory Vault              → /memory-vault
📝 Journal                   → /journal
❤️ Legacy Access             → /my-legacy-access      ⭐ VIEW LEGACIES
♾️ Continuity Bridge         → /continuity-bridge
👤 My Profile                → /profile
```

---

## 💡 TIPS & BEST PRACTICES

### For Patients:

1. **Start Early** 
   - Don't wait until it's too late
   - Set up legacy while you're feeling well

2. **Be Thoughtful**
   - Take time writing final messages
   - Include specific memories
   - Express gratitude and love

3. **Review Regularly**
   - Update heir list as relationships change
   - Add new memories regularly
   - Review content periodically

4. **Be Clear**
   - Clearly state access levels
   - Explain why certain heirs have different access
   - Leave personal notes for each heir

5. **Consider Privacy**
   - Mark sensitive content as "Private"
   - Only give private access to closest family
   - Be mindful of what you share

### For Heirs:

1. **Honor Their Wishes**
   - Respect access controls
   - Don't share content without permission
   - Follow their instructions

2. **Take Your Time**
   - Don't rush reading content
   - Process emotions at your own pace
   - Revisit memories when ready

3. **Preserve Legacy**
   - Save important messages
   - Share stories with others (if appropriate)
   - Keep memories alive

---

## 🔗 RELATED PAGES

- **Memory Vault** (`/memory-vault`) - Create and view memories
- **Journal** (`/journal`) - Write personal journal entries
- **Continuity Bridge** (`/continuity-bridge`) - Bereavement support
- **My Journey** (`/my-journey`) - Track your healthcare journey

---

## 📞 NEED HELP?

### Technical Support:
- Contact your healthcare provider
- Email: support@projectaura.com
- Phone: [Support number]

### Emotional Support:
- Talk to your clinician
- Join Community groups
- Access bereavement resources in Continuity Bridge

---

## 🌟 REAL-WORLD EXAMPLE

### Sarah's Story:

**Sarah** is a 68-year-old patient with advanced cancer.

**Step 1: Consent**
- Sarah gives consent at `/legacy-setup`
- She chooses to share: Memories, Journal, Messages
- Her nurse witnesses the consent

**Step 2: Heirs**
- Sarah designates 3 heirs:
  - Daughter (Full Access + Private)
  - Son (Full Access, no private)
  - Best Friend (Memories Only)

**Step 3: Content**
- Sarah creates 5 final messages:
  - "To My Daughter" (specific heir)
  - "To My Son" (specific heir)
  - "To My Family" (all heirs)
  - "Thank You Letter" (all heirs)
  - "My Life Story" (all heirs)

**Step 4: Memories**
- Sarah shares 20 memories over 3 months
- 15 marked "Shared" (all heirs see)
- 5 marked "Private" (only daughter sees)

**Step 5: Journal**
- Sarah writes weekly journal entries
- Some entries about her feelings (private)
- Some entries about family stories (shared)

**When Sarah Passes:**
- Her clinician activates legacy
- Content delivered to all heirs
- Daughter sees everything (15 shared + 5 private memories)
- Son sees 15 shared memories
- Best friend sees 15 shared memories only
- All receive the messages designated for them

**Result:** Sarah's family has comfort, closure, and lasting memories 💜

---

## ✅ QUICK START CHECKLIST

### For Patients:
- [ ] Give consent at `/legacy-setup`
- [ ] Designate at least 1 heir at `/heir-management`
- [ ] Create 1 final message at `/legacy-content`
- [ ] Share 1 memory at `/memory-vault`
- [ ] Write 1 journal entry at `/journal`

### For Heirs:
- [ ] Check legacy access at `/my-legacy-access`
- [ ] Read delivered messages
- [ ] View memories (if permitted)
- [ ] Honor patient's wishes

---

**Last Updated:** June 4, 2026
**System Version:** ProjectAura v2.0
**Status:** Production Ready ✅

---

💜 **Remember:** This system is about love, legacy, and comfort. Take your time, be thoughtful, and honor the gift of memories shared.
