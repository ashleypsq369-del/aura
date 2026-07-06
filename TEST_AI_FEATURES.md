╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║         🧪 AI FEATURES TESTING SCRIPT                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Follow these exact steps to test every AI feature:

═══════════════════════════════════════════════════════════════
  TEST 1: CHATBOT - DATABASE QUERIES
═══════════════════════════════════════════════════════════════

**Steps:**
1. Open ProjectAura (http://localhost:5173)
2. Login: clinician / clinician123
3. Look for FLOATING BUTTON bottom-right (teal/cyan circle)
4. Click the floating chat button
5. Chat panel opens (large panel, right side)

**Test Query 1: Show Patients**
Type exactly: `Show me all patients`

✅ **Expected Result:**
```
📋 **Patient Overview** (Showing 8 of 8 total)

**Kwame Asante** (Code: PA-0001)
  • Age: 68 | Diagnosis: Advanced Cancer
  • Status: Stable | Active Meds: 3
  • Latest HR: 75 | O2: 96%

**Akosua Mensah** (Code: PA-0002)
  • Age: 72 | Diagnosis: Heart Failure
  ... [continues for all 8 patients]
```

**Test Query 2: Show Vitals**
Type exactly: `Show latest vitals`

✅ **Expected Result:**
```
❤️ **Latest Vital Signs** - All Patients

**Kwame Asante** (PA-0001)
  • HR: 75 bpm | BP: 120/80
  • O2 Sat: 96% | Temp: 36.8°C
  • Recorded: 2026-06-06 10:30

... [5 most recent vitals]
```

**Test Query 3: Show Alerts**
Type exactly: `Show active alerts`

✅ **Expected Result:**
```
🚨 **Active Alerts** - All (2 total)

🔴 **Vital Signs Alert**
  • Patient: Kwame Asante (PA-0001)
  • Message: Critical oxygen saturation
  • Value: 85%
  • Time: 2026-06-06 10:15

... [continues]
```

**Test Query 4: Navigation**
Type exactly: `Take me to AI Insights`

✅ **Expected Result:**
```
🚀 **Navigation:** Taking you to **AI Insights**

📝 AI-powered analytics and patient risk analysis

**Action Required:** Click this link → `/ai-insights`

[Go to Page] button appears

💡 **Tip:** I can also help you:
• Understand what you'll find there
... [continues]
```

Click the "Go to Page" button → Should navigate to AI Insights


═══════════════════════════════════════════════════════════════
  TEST 2: AI INSIGHTS PAGE
═══════════════════════════════════════════════════════════════

**Steps:**
1. In sidebar (left), click "AI Insights" (brain icon)
2. OR type in URL: http://localhost:5173/ai-insights

✅ **Expected Result:**

**Page Header:**
- Purple/indigo gradient banner
- Brain icon
- "AI-Powered Clinical Insights"
- Last updated timestamp

**Patient Categories:**

🔴 **Critical Patients** (Red section)
- List of patients with risk >75%
- Each shows:
  * Name, patient code
  * Risk level: "Critical"
  * Priority: HIGH
  * Clinical notes
  * Recommended actions
  * Vital trends
  * Symptom burden

🟡 **Deteriorating Patients** (Orange section)
- Risk 50-75%
- Similar details
- Priority: MEDIUM

🟢 **Stable Patients** (Green section)
- Risk <50%
- Priority: LOW

**What to Check:**
□ All 8 patients appear across categories
□ Each patient has AI-generated notes
□ Recommendations are specific
□ Risk levels make sense
□ Can click patient name → goes to patient page


═══════════════════════════════════════════════════════════════
  TEST 3: INDIVIDUAL PATIENT RISK PREDICTION
═══════════════════════════════════════════════════════════════

**Steps:**
1. Go to sidebar → "Patients"
2. Click on first patient: "Kwame Asante"
3. Patient detail page opens
4. Look for tabs: Overview | Vitals | Symptoms | Medications | etc.
5. Find "AI Analysis" or "Risk Score" tab (may be in different position)

✅ **Expected Result:**

**Risk Score Card:**
```
🎯 Risk Score: 45%
Status: Moderate Risk
Confidence: 89%
```

**Care Pathway:**
```
Recommended Pathway: Supportive Care
Alternatives: Comfort Care, Active Treatment
```

**Top Risk Factors** (SHAP Explanation):
```
1. ❤️ Heart Rate: 75 bpm (+5%)
   Impact: Within normal range, slightly elevated

2. 🫁 Oxygen Saturation: 96% (-3%)
   Impact: Good oxygen levels, protective factor

3. 😣 Pain Level: 4/10 (+8%)
   Impact: Moderate pain, needs monitoring

4. 🌡️ Temperature: 36.8°C (+1%)
   Impact: Normal temperature

5. 💊 Active Medications: 3 (+2%)
   Impact: Multiple medications, watch interactions
```

**Recommendations:**
```
✅ Continue current care plan
⚠️ Monitor pain levels - trending up
💊 Review pain medication effectiveness
📞 Schedule follow-up in 3 days
```

**What to Check:**
□ Risk score displays (0-100%)
□ Care pathway recommendation shown
□ Confidence score present
□ Top 5-10 factors listed with impact
□ Each factor has explanation
□ Recommendations are actionable


═══════════════════════════════════════════════════════════════
  TEST 4: ALERT GENERATION (PROACTIVE MONITORING)
═══════════════════════════════════════════════════════════════

**Steps:**
1. Go to patient: "Kwame Asante"
2. Click "Vitals" tab
3. Click "Add Vitals" or "Record Vitals" button
4. Enter ABNORMAL vitals:
   - Heart Rate: 135
   - Blood Pressure Sys: 185
   - Blood Pressure Dia: 110
   - Oxygen Saturation: 85
   - Temperature: 38.8
   - Respiratory Rate: 28
5. Click "Save" or "Record"

✅ **Expected Result (Immediate):**

**Alert Badge:**
- Bell icon (top-right navbar) turns RED
- Badge number increases
- Shows count of unacknowledged alerts

**Critical Alert Modal:**
- Large modal popup appears
- Cannot dismiss by clicking outside
- Red header: "CRITICAL RISK DETECTED"
- Patient name: Kwame Asante
- Risk score: ~85-90% (calculated in real-time)
- Top risk drivers:
  * Oxygen Saturation: 85% (+25%)
  * Blood Pressure: 185/110 (+20%)
  * Heart Rate: 135 (+15%)
  * Temperature: 38.8°C (+12%)
- AI explanation: "Patient showing multiple concerning vital signs..."
- Action buttons:
  * Assign to Urgent Review
  * Contact Family Now
  * Escalate to Senior

**What to Check:**
□ Alert triggers within 1-2 seconds
□ Modal appears automatically
□ Cannot close by clicking backdrop
□ Risk drivers make sense
□ Percentages add up logically
□ Action buttons work (click one)
□ Alert marked as acknowledged after action
□ Toast notification appears


═══════════════════════════════════════════════════════════════
  TEST 5: CHATBOT NAVIGATION INTELLIGENCE
═══════════════════════════════════════════════════════════════

**Steps:**
Open chatbot and test these queries:

**Query 1: General Navigation**
Type: `Where can I find medications?`

✅ Expected:
- Explains Medications page
- Provides direct link: `/medications`
- Shows "Go to Page" button
- Describes what's on that page

**Query 2: Task Guidance**
Type: `How do I add a patient?`

✅ Expected:
```
➕ **Adding a New Patient**

**Step-by-step guide:**
1. Go to the **Patients** page (left sidebar)
2. Click the **"+ Add Patient"** button (top-right)
3. Fill in the required information:
   • Full name
   • Date of birth
   • Contact information
   • Primary diagnosis
   • Emergency contacts
4. Click **"Save Patient"**

**Pro tips:**
• All fields marked with * are required
• You can always edit details later
• Patient code is auto-generated

Need me to take you to the Patients page?
```

**Query 3: Feature Explanation**
Type: `What is risk score?`

✅ Expected:
```
🎯 **What is a Risk Score?**

Risk scores predict how likely a patient's condition may deteriorate.

**How it's calculated:**
• Vital signs (heart rate, BP, O2 sat)
• Symptom burden (pain, nausea, etc.)
• Disease trajectory
• Recent changes/trends

**Score meanings:**
🟢 **0-30% (Low):** Stable, routine care
🟡 **30-70% (Moderate):** Monitor closely
🔴 **70-100% (High):** Urgent attention needed

**Why it matters:**
Helps prioritize care and catch problems early!

Want to see risk scores for your patients?
```

**Query 4: Statistics**
Type: `Show me statistics`

✅ Expected:
```
📊 **System Overview**

**Patients:**
  • Total: 8
  • Stable: 5
  • Deteriorating: 3

**Alerts:**
  • Active: 2
  • Critical: 1

**Today:**
  • Appointments: 3
  • Active Medications: 24
  • Vitals (24h): 15
```


═══════════════════════════════════════════════════════════════
  TEST 6: RECOMMENDATIONS SYSTEM
═══════════════════════════════════════════════════════════════

**Steps:**
1. Go to AI Insights page
2. Find a patient in "Critical" or "Deteriorating" section
3. Look at "Recommended Actions" for that patient

✅ **Expected Format:**
```
Patient: Kwame Asante | Priority: HIGH

Immediate Actions:
1. ⚠️ Review vital signs
   - Multiple concerning readings
   - Action: Immediate assessment

2. 💊 Pain management review
   - Pain level elevated
   - Action: Adjust medication protocol

3. 📞 Family communication
   - Patient status change
   - Action: Update family on condition

Timeline: Within 2 hours
Priority: HIGH
Confidence: 87%
```

**What to Check:**
□ Actions are specific (not generic)
□ Each action has context
□ Timeline is reasonable
□ Priority makes sense
□ Actions are clinically appropriate


═══════════════════════════════════════════════════════════════
  TEST 7: BACKEND VERIFICATION
═══════════════════════════════════════════════════════════════

**Steps:**
1. Open backend console window (minimized window from START_PROJECTAURA.bat)
2. Look at startup logs

✅ **Expected Startup Messages:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
[OK] ML Models loaded successfully
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Key Line to Find:**
```
[OK] ML Models loaded successfully
```

If you see:
```
[WARNING] Could not load ML models
```

Then models didn't load - check `backend/models/` folder exists with:
- risk_score_model.joblib
- care_pathway_model.joblib
- feature_scaler.joblib
- label_encoder.joblib

**Test API Endpoint Directly:**
Open browser, go to: http://localhost:8000/docs

Should see:
- FastAPI automatic documentation
- List of all API endpoints
- Including:
  * /api/ai/predict-risk
  * /api/ai-analysis/system-insights
  * /api/chatbot/chat
  * etc.


═══════════════════════════════════════════════════════════════
  TROUBLESHOOTING
═══════════════════════════════════════════════════════════════

**Problem: Chatbot gives fixed responses**

Reason: Using rule-based mode (not Claude AI)

Solutions:
1. ✅ This is NORMAL - chatbot IS working!
2. For full AI, add Anthropic API key (optional)
3. Rule-based mode can still:
   - Query database
   - Navigate app
   - Explain features
   - Guide tasks

Test: Type "Show me all patients" - if it lists patients, IT WORKS!


**Problem: AI Insights page shows "No data"**

Reason: No patients in database OR API error

Solutions:
1. Check if patients exist (go to Patients page)
2. Check backend console for errors
3. Reload page (Ctrl+F5)
4. Check network tab in browser DevTools


**Problem: Risk scores not showing**

Reason: Patient needs more data OR models didn't load

Solutions:
1. Add vitals to patient (need at least 1 vital reading)
2. Add symptoms to patient
3. Check backend console for "[OK] ML Models loaded"
4. Restart backend if models warning shown


**Problem: Alerts not generating**

Reason: Vitals not abnormal enough OR alert threshold not met

Solutions:
1. Use EXTREME values:
   - HR: 135 or 45
   - BP Sys: 185 or 85
   - O2 Sat: 85 or below
   - Temp: 38.5+ or 35-
2. Check bell icon for existing alerts
3. Check backend console for alert generation logs


**Problem: Chatbot says "I'm sorry, I'm having trouble..."**

Reason: Backend connection error

Solutions:
1. Check backend is running (http://localhost:8000)
2. Check browser console for API errors
3. Verify CORS is working (no CORS errors)
4. Restart backend


═══════════════════════════════════════════════════════════════
  SUCCESS CHECKLIST
═══════════════════════════════════════════════════════════════

After testing, you should see:

✅ Chatbot responds with real patient data
✅ AI Insights shows categorized patients
✅ Individual patients have risk scores
✅ Risk factors (SHAP) listed with explanations
✅ Alerts generate for abnormal vitals
✅ Critical alerts show modal popup
✅ Recommendations are specific and actionable
✅ Navigation commands work in chat
✅ Backend console shows "[OK] ML Models loaded"

If ALL checked → ✅ AI is FULLY FUNCTIONAL!


═══════════════════════════════════════════════════════════════
  WHAT'S AI vs WHAT'S RULE-BASED
═══════════════════════════════════════════════════════════════

**ACTUAL AI (Machine Learning):**
✅ Risk score prediction (XGBoost model)
✅ Care pathway classification (XGBoost model)
✅ Feature importance (SHAP explainability)
✅ Risk level categorization (ML-based)
✅ Trend analysis (statistical + ML)

**RULE-BASED INTELLIGENCE:**
✅ Alert thresholds (if HR > 120, alert)
✅ Chatbot pattern matching (keyword detection)
✅ Navigation logic (route mapping)
✅ Recommendation templates (condition-based)
✅ Clinical notes generation (rule-based NLG)

**OPTIONAL AI (Requires API Key):**
⚠️ Claude AI conversational understanding
⚠️ Advanced NLP for chatbot
⚠️ Open-ended medical discussions
⚠️ Emotional intelligence in responses

**Your app has BOTH AI and intelligent rules working together!**


═══════════════════════════════════════════════════════════════

Start testing now! Follow each test in order. ✅

If anything doesn't work as expected, check the Troubleshooting section.

═══════════════════════════════════════════════════════════════
