# 📘 PROJECT AURA - Complete User Guide

## 🌟 Welcome to Project Aura

Project Aura is a comprehensive AI-powered hospice care platform that provides compassionate, transparent, and proactive support throughout the entire care journey—from admission through bereavement.

---

## 🚀 Getting Started

### Access the Application

**URL:** http://localhost:8502

### Demo Accounts

**Clinician Account:**
- Username: `clinician`
- Password: `demo123`
- Access: Full system access, all patients, AI insights, administrative features

**Family Account:**
- Username: `family`
- Password: `demo123`
- Access: Patient-specific data, symptom logging, support resources, bereavement support

---

## 📱 Application Features

### 1. 🏠 Dashboard (Home)

**What you'll see:**
- Active patient count
- Pending alerts
- System status
- Quick statistics
- Recent activity

**Who can access:** Both Clinicians and Family members

**Key actions:**
- Select a patient to work with
- View overall system health
- Navigate to other features

---

### 2. 🔐 Login

**Features:**
- Secure authentication
- Role-based access control
- Demo user creation
- Logout functionality

**How to use:**
1. Enter username and password
2. Click "Login"
3. System assigns appropriate role
4. Access features based on your role

---

### 3. 📝 Log Data

**Purpose:** Record patient vitals and symptoms

**Vitals you can log:**
- Heart Rate (bpm)
- Blood Pressure (Systolic/Diastolic)
- Oxygen Saturation (%)
- Temperature (°F)

**Symptoms you can log:**
- Pain Level (0-10 scale)
- Nausea (Yes/No)
- Fatigue (Yes/No)
- Anxiety (Yes/No)
- Additional notes

**How to use:**
1. Select patient
2. Choose "Log Vitals" or "Log Symptoms" tab
3. Fill in the form
4. Click "Save"
5. Confirmation message appears

**Best practices:**
- Log data regularly for accurate trends
- Be honest about pain levels
- Include detailed notes when helpful
- Record immediately after observations

---

### 4. 📈 View Trends

**Purpose:** Visualize patient data over time

**Charts available:**
- Heart Rate trends
- Blood Pressure (Systolic & Diastolic)
- Oxygen Saturation with critical threshold
- Temperature trends
- Pain Level progression
- Symptom presence (Nausea, Fatigue, Anxiety)

**Features:**
- Adjustable time range (1-30 days)
- Interactive charts
- Summary statistics
- Latest readings displayed

**How to interpret:**
- **Upward trends in vitals:** May indicate stress or deterioration
- **Downward O2 saturation:** Requires immediate attention if below 90%
- **Increasing pain:** May need medication adjustment
- **Persistent symptoms:** Discuss with care team

---

### 5. 🤖 AI Insights (XAI Engine)

**Purpose:** Get explainable AI-powered care recommendations

**What you get:**
- **Care Pathway Recommendation:**
  - Comfort Care
  - Symptom Management
  - Intensive Monitoring
  - Crisis Intervention

- **Deterioration Risk Score:** 0.0 to 1.0
  - 0.0-0.3: Low risk (🟢)
  - 0.3-0.7: Moderate risk (🟡)
  - 0.7-1.0: High risk (🔴)

- **SHAP Explanations:** Visual charts showing:
  - Which factors influenced the prediction
  - How much each factor contributed
  - Why the AI made this recommendation

**How to use:**
1. Select patient
2. Click "Generate AI Recommendation"
3. Review care pathway and risk score
4. Examine SHAP visualization
5. Discuss with care team

**Understanding SHAP charts:**
- **Red bars:** Factors increasing risk
- **Blue bars:** Factors decreasing risk
- **Longer bars:** Stronger influence
- **Feature names:** What was measured

**Important:** AI recommendations are decision support tools, not replacements for clinical judgment.

---

### 6. 🚨 Alerts

**Purpose:** Proactive monitoring and notifications

**Alert types:**
- **Deterioration:** 3+ consecutive worsening readings
- **Critical Vital:** Values outside safe ranges
- **Symptom Spike:** Pain increase of 3+ points in 24 hours
- **High Risk:** AI risk score above 0.75

**Features:**
- Alert history
- Pending vs. acknowledged alerts
- Alert details (type, time, message)
- Acknowledgment functionality

**How to use:**
1. Select patient
2. View alert list
3. Click on alert to see details
4. Acknowledge alerts after reviewing
5. Take appropriate action

**Alert response:**
- Review patient immediately
- Check recent vitals and symptoms
- Contact care team if needed
- Document actions taken

---

### 7. 💬 Support Hub (Structured Chatbot)

**Purpose:** Safe, structured symptom logging and resource access

**Three main sections:**

#### 📝 Log Symptoms
**Structured categories:**

**Pain Assessment:**
- Pain level (0-10)
- Location
- Type (sharp, dull, burning, etc.)
- Triggers and relievers

**Physical Symptoms:**
- Nausea
- Fatigue
- Breathing difficulty
- Other symptoms

**Emotional State:**
- Anxiety
- Sadness
- Sleep issues
- Distress causes

**How to use:**
1. Select symptom category
2. Answer structured questions
3. Provide details
4. Save assessment

#### 📚 Resources
**Available categories:**
- Pain Management
- Nausea Relief
- Anxiety Coping
- Breathing Techniques
- Family Communication
- Emergency Contacts

**How to use:**
1. Select resource category
2. Browse available resources
3. Read content
4. Access external links if provided

#### 📋 Recent Logs
- View past symptom entries
- Track patterns over time
- Review notes

**Safety features:**
- No open-ended AI generation
- Predefined responses only
- Clear medical disclaimers
- Vetted information only

---

### 8. 🕊️ Bereavement Bridge

**Purpose:** Post-death support for family members

**Activation:** Automatically available after patient death is recorded

**Four main sections:**

#### 📝 Journal
**Features:**
- Guided prompts or free writing
- Private entries
- Unlimited journaling
- Prompts include:
  - "Share a favorite memory"
  - "What are you feeling today?"
  - "What would you like to say to your loved one?"

**How to use:**
1. Choose a prompt or write freely
2. Express your thoughts
3. Save entry (private and secure)

#### 💭 Memories
**Features:**
- Preserve special moments
- Add titles to memories
- Detailed descriptions
- Permanent storage

**How to use:**
1. Give memory a title
2. Describe the memory
3. Save to preserve forever

#### 📚 Resources
**Grief Stages:**
- Shock
- Anger
- Bargaining
- Depression
- Acceptance

**Support Types:**
- Crisis hotlines (24/7)
- Support groups (local and online)
- Professional counseling
- Therapy options

**How to use:**
1. Select grief stage or support type
2. Read relevant resources
3. Access contact information
4. Reach out when ready

#### 📖 My Entries
- View all journal entries
- Review saved memories
- Reflect on your journey

**Important reminders:**
- Grief has no timeline
- All feelings are valid
- You're not alone
- Professional help is available

---

## 👥 Role-Based Features

### Clinician Access
✅ All patients
✅ Full patient data
✅ AI recommendations
✅ Alert configuration
✅ Administrative controls
✅ All system features

### Family Member Access
✅ Assigned patient(s) only
✅ Symptom logging
✅ Trend viewing (restricted)
✅ Support Hub
✅ Bereavement Bridge
❌ Other patients' data
❌ Administrative features

---

## 🔒 Privacy & Security

### Data Protection
- **100% Synthetic Data:** No real patient information
- **Local Storage:** SQLite database on local machine
- **No Cloud Transmission:** All data stays local
- **Audit Logging:** All actions tracked for transparency

### Synthetic Data Indicators
- Yellow banners on all pages
- Clear labels on data displays
- Prototype system notices

---

## 🎯 Best Practices

### For Clinicians

**Daily routine:**
1. Check pending alerts
2. Review patient trends
3. Generate AI insights for high-risk patients
4. Document interventions
5. Update care plans

**Weekly routine:**
1. Review all patient trends
2. Analyze alert patterns
3. Adjust monitoring thresholds
4. Train staff on new features

### For Family Members

**Daily routine:**
1. Log symptoms honestly
2. Record vitals as instructed
3. Check for alerts
4. Use Support Hub for questions

**When to contact care team:**
- New or worsening symptoms
- Alerts appear
- Questions about care
- Emotional support needed

---

## 🆘 Troubleshooting

### Can't login?
- Verify username and password
- Check caps lock
- Use demo credentials to test
- Contact administrator

### No data showing?
- Ensure patient is selected
- Check if data has been logged
- Verify date range filters
- Refresh the page

### Charts not displaying?
- Wait for data to load
- Check if patient has historical data
- Try different time range
- Refresh browser

### AI insights not working?
- Ensure models are trained (run setup.py)
- Check if patient has recent vitals AND symptoms
- Verify model files exist in models/ directory

### Alerts not appearing?
- Check if monitoring thread is running
- Verify alert thresholds
- Ensure data is being logged
- Check alert configuration

---

## 📞 Support Resources

### Emergency Contacts
- **Emergency Services:** 911
- **Hospice 24/7 Line:** [Contact your provider]
- **Crisis Support:** 988

### Technical Support
- Review documentation in docs/ folder
- Check QUICKSTART.md for setup issues
- Review error logs in logs/ folder

---

## 🌈 Tips for Meaningful Use

### Building Trust
- Log data consistently
- Review trends regularly
- Discuss AI insights with care team
- Ask questions freely

### Emotional Support
- Use Support Hub resources
- Journal in Bereavement Bridge
- Connect with support groups
- Seek professional help when needed

### Communication
- Share trends with care team
- Discuss concerns openly
- Include family in care decisions
- Document important conversations

---

## 🎓 Understanding the Technology

### Explainable AI (XAI)
- **What it is:** AI that shows its reasoning
- **Why it matters:** Builds trust, enables oversight
- **How it works:** SHAP values show feature importance
- **Limitations:** Predictions are probabilities, not certainties

### Synthetic Data
- **What it is:** Artificially generated patient data
- **Why we use it:** Privacy protection, no HIPAA concerns
- **How it's made:** SDV library with diversity constraints
- **Benefit:** Safe demonstration and research

### Proactive Monitoring
- **What it is:** Background checking for deterioration
- **Why it matters:** Early intervention saves lives
- **How it works:** Continuous trend analysis
- **Result:** Alerts before crises occur

---

## ✨ Making the Most of Project Aura

### For Optimal Care
1. **Log regularly:** Daily vitals and symptoms
2. **Review trends:** Weekly pattern analysis
3. **Use AI insights:** For complex decisions
4. **Respond to alerts:** Promptly and appropriately
5. **Access resources:** When questions arise
6. **Communicate openly:** With care team and family

### For Emotional Well-being
1. **Use Support Hub:** For guidance and resources
2. **Journal feelings:** In Bereavement Bridge
3. **Preserve memories:** Before and after loss
4. **Seek support:** Groups and counseling
5. **Be patient:** With yourself and the process

---

## 🙏 Remember

**Project Aura is here to support you through one of life's most challenging journeys. The technology serves compassion, not the other way around.**

**You are not alone. Your care team, your family, and this system are here to help.**

---

*For additional help, see QUICKSTART.md, README.md, or contact your system administrator.*
