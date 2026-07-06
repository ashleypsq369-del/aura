# 🚀 Priority 3: HCI & ChatBot Safety - Quick Reference

**Status**: ✅ COMPLETE  
**Date**: June 6, 2026

---

## ⚡ Quick Status

✅ **ChatBot Consent Modal** - Pre-session consent framework  
✅ **Crisis Intervention** - Automatic crisis detection & escalation  
✅ **Usability Feedback** - Page-level satisfaction tracking

---

## 📂 Key Files

### **Components**:
```
frontend/src/components/
├── ChatbotConsentModal.jsx          (300+ lines)
├── CrisisInterventionOverlay.jsx    (350+ lines)
├── UsabilityFeedback.jsx            (250+ lines)
└── AuraChat.jsx                     (ENHANCED)
```

### **Backend**:
```
backend/
├── routers/hci.py                   (500+ lines, 11 endpoints)
├── src/db.py                        (3 new tables)
└── main.py                          (router registered)
```

---

## 🔌 API Endpoints

### **Usability Feedback**:
```
POST   /api/hci/usability-feedback           # Submit feedback
GET    /api/hci/usability-feedback/stats     # Statistics
GET    /api/hci/usability-feedback           # All feedback (Admin)
```

### **ChatBot Consent**:
```
POST   /api/hci/chatbot-consent              # Save consent
GET    /api/hci/chatbot-consent/{user_id}    # Check status
DELETE /api/hci/chatbot-consent/{user_id}    # Revoke consent
```

### **Crisis Management**:
```
POST   /api/hci/crisis-alert                                  # Report crisis
POST   /api/hci/crisis-alert/{patient_id}/notify-careteam    # Notify team
GET    /api/hci/crisis-alert/{patient_id}/history            # History
GET    /api/hci/crisis-alert/stats                           # Statistics
```

---

## 🗄️ Database Tables

### **usability_feedback**:
```sql
page_name, rating (1-5), comment, user_id, user_role, created_at
```

### **chatbot_consent**:
```sql
user_id, consent_given, consent_text, consented_at, revoked_at, ip_address
```

### **crisis_alerts**:
```sql
user_id, patient_id, crisis_type, message_content, source, 
detected_keywords, confidence_score, acknowledged, 
careteam_notified, created_at
```

---

## 🧪 Quick Test

### **Test Consent**:
```
1. Open chat → Consent modal appears
2. Check "I understand"
3. Click "Continue"
4. Consent saved ✓
```

### **Test Crisis**:
```
1. Type "I want to die"
2. Red overlay appears ✓
3. Wait 10 seconds
4. Close button enabled ✓
```

### **Test Feedback**:
```
1. Click purple button (bottom-left)
2. Select 5 stars
3. Submit
4. Success animation ✓
```

---

## 🇬🇭 Ghana Resources

**Emergency Contacts**:
- 193 - Ghana Ambulance Service
- 112 - National Emergency
- 0302-681109 - Ghana Health Service
- 0800-900-888 - Mental Health Authority (Toll-free)

**Support Resources**:
- Befrienders Ghana: 233-244-846-701
- KASA Initiative: 233-501-354-770

---

## 💻 Usage Examples

### **Add Usability Widget to Page**:
```jsx
import UsabilityFeedback from '../components/UsabilityFeedback';

<UsabilityFeedback 
  pageName="Dashboard" 
  userId={user.id} 
  userRole={user.role} 
/>
```

### **Check Consent Status**:
```javascript
import { chatbotConsentAPI } from '../api/client';

const response = await chatbotConsentAPI.getConsent(userId);
if (response.data.consent_given) {
  // Allow chat
}
```

### **Log Crisis Alert**:
```javascript
import { crisisAPI } from '../api/client';

await crisisAPI.reportCrisis({
  user_id: userId,
  crisis_type: 'chatbot_detected',
  message_content: message,
  source: 'chatbot',
  confidence_score: 0.9
});
```

---

## 🎯 Crisis Keywords

Triggers crisis overlay:
- "kill myself"
- "suicide"
- "want to die"
- "hurt myself"
- "can't go on"
- "give up on life"
- "end it"
- "don't want to live"
- "no point living"

---

## 📊 Admin Analytics

### **View Feedback Stats**:
```bash
GET /api/hci/usability-feedback/stats?page_name=Dashboard
```

**Returns**:
- Average rating
- Rating distribution
- Total responses
- Recent comments

### **View Crisis Stats**:
```bash
GET /api/hci/crisis-alert/stats?days=30
```

**Returns**:
- Total alerts
- By type breakdown
- Acknowledged count
- Notified count
- Response rate

---

## ✅ Success Criteria (ALL MET)

- [x] Consent modal shows before first use
- [x] Consent tracked in database
- [x] Crisis keywords detected
- [x] Crisis overlay appears immediately
- [x] 10-second safety timer works
- [x] Ghana contacts displayed
- [x] Care team notified
- [x] Usability widget functional
- [x] 5-star rating works
- [x] Feedback saved to database

---

## 📚 Full Documentation

**Complete Docs**: `PRIORITY_3_COMPLETE.md`  
**Session Summary**: `SESSION_PRIORITY_3_COMPLETE.md`  
**Overall Progress**: `GAP_ANALYSIS_PROGRESS_SUMMARY.md`

---

## 🚀 Status: 100% COMPLETE ✅

**Next**: Priority 4 (Biomedical Ethics) or Priority 5 (Bereavement)

