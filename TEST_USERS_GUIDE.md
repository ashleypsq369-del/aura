# Project Aura -- Test Users & Testing Guide
## All Passwords: `TestPass123!`

---

## LOGIN CREDENTIALS

| Role | Username | Full Name | What to test |
|---|---|---|---|
| **Admin** | `test.admin` | Test Administrator | User management, HIPAA compliance, audit log, model bias report |
| **Clinician** | `dr.mensah` | Dr. Samuel Mensah | Full clinical dashboard, all 11 patients, ML risk, SHAP, drug interactions |
| **Clinician** | `dr.osei` | Dr. Abena Osei | Second clinician view, team collaboration |
| **Caregiver** | `nurse.akua` | Nurse Akua Asante | Caregiver dashboard, assigned patients, shift handover, daily care log |
| **Caregiver** | `carer.kwesi` | Kwesi Boateng | Residential log, care setting workflows |
| **Patient** | `patient.ama2` | Ama Asante Boateng | Patient portal, wellness check-in, my journey, QUESTIONNAIRE FLOW |
| **Patient** | `patient.kofi2` | Kofi Mensah Junior | Stable patient portal, medications, appointments |
| **Patient** | `patient.abena2` | Abena Owusu Darko | Critical patient -- drug interaction alert, urgent care features |
| **Family** | `family.emmanuel` | Emmanuel Asante | Bereavement support, continuity bridge, memory vault (linked to Ama) |
| **Family** | `family.akos` | Akosua Mensah | Family dashboard, real journey events (linked to Kofi Jr) |

---

## EXISTING SEED USERS (also work for testing)

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Clinician | `clinician` | `clinician123` |
| Caregiver | `caregiver` | `caregiver123` |
| Patient | `patient` | `patient123` |
| Family | `family` | `family123` |

---

## PATIENT TEST DATA SUMMARY

### Ama Asante Boateng (patient.ama2)
- **Diagnosis:** Advanced Ovarian Cancer (Stage IV)
- **Status:** DETERIORATING -- declining ESAS scores over 14 days
- **Care setting:** Home-based
- **ESAS trends:** 14 days of check-ins showing upward pain trend
- **Family:** Emmanuel Asante linked as next of kin

### Kofi Mensah Junior (patient.kofi2)
- **Diagnosis:** End-Stage Heart Failure (NYHA Class IV)
- **Status:** STABLE
- **Care setting:** Outpatient clinic
- **3 upcoming appointments** in Appointments page
- **Family:** Akosua Mensah linked

### Abena Owusu Darko (patient.abena2)
- **Diagnosis:** COPD (Severe) with Lung Cancer
- **Status:** CRITICAL
- **Care setting:** Hospital-based
- **30 days of vitals** -- declining O2 saturation trend
- **1 SEVERE drug interaction** (Morphine + Diazepam on her medication list)
- **Prognosis:** 2-3 months (appears in AdvancedMLPanel)

---

## TESTING WORKFLOWS BY ROLE

### ADMIN (test.admin)
1. Dashboard -- see all 11 patients, drug interaction warning banner
2. Admin panel (/admin/users) -- manage all 10 test users
3. HIPAA Compliance (/admin/hipaa-compliance) -- log a breach incident
4. Audit Log (/admin/audit) -- see all user actions
5. Model Bias Report (/admin/model-bias-report)
6. Password reset flow -- use Forgot Password with any test email

### CLINICIAN (dr.mensah)
1. **Dashboard** -- 11 patients, ML drug interaction banner for Abena
2. **AI Insights** (/ai-insights) -- XGBoost batch risk table, drug interaction batch panel
3. **Patient: Abena** -- click SHAP button to open PatientMonitor ML tab
   - See 8/8 XGBoost task breakdowns with SHAP waterfall
   - See AdvancedMLPanel: SEVERE drug interaction, prognosis 2-3 months
   - Submit P11 ML feedback (thumbs up/down)
4. **Patient: Ama** -- deterioration trend visible in Advanced ML
5. **Medications** -- select Abena, see SEVERE drug interaction panel appear
6. **Caregivers** -- see burnout badges, assign patients
7. **Shift Handover** -- fill out and submit (saves to patient journey timeline)
8. **AI Assistant** -- open floating button, test clinical questions
9. **Alerts** -- see ML risk badges next to each alert
10. **Community** -- create/join groups

### CAREGIVER (nurse.akua)
1. **Dashboard** -- caregiver view showing assigned patients
2. **Daily Care Log** (/daily-care-log) -- fill out and submit
3. **Shift Handover** (/shift-handover) -- fill handover notes
4. **Residential Log** (/residential-log) -- for residential setting
5. **Medications** -- view active medications
6. **Appointments** -- upcoming schedule
7. **Messages** -- contact clinical team

### PATIENT (patient.ama2) -- QUESTIONNAIRE FLOW
1. Login -- should be redirected to /setup (questionnaire not complete)
2. Complete the 10-step questionnaire:
   - Step 1: Language, care priorities
   - Step 2: Current condition
   - Steps 3-6: ESAS symptoms, emotional wellbeing, physical function, nutrition
   - Steps 7-8: Spiritual/cultural, family support
   - Steps 9-10: Preferences, AI consent
3. After questionnaire -- redirected to My Space (/my-space)
4. **My Space** -- see care journey phase, ESAS sparklines, quick actions
5. **Wellness Check-In** (/wellness-checkin) -- fill daily check-in
   - After submission: see trend comparison vs previous check-in
6. **My Journey** -- see all journey events (admission, medications, assessments)
7. **Medications** -- see own medications auto-loaded
8. **Community** -- join support groups
9. **Memory Vault** -- add a memory entry
10. **AI Companion** button -- opens Aura chat (context-aware for Ama's condition)

### PATIENT (patient.abena2) -- CRITICAL SCENARIO
1. Login --> questionnaire --> My Space
2. Appointments page -- see 3 upcoming appointments
3. AI chat -- ask about her medications (should see drug interaction warning in response)

### FAMILY (family.emmanuel) -- BEREAVEMENT WORKFLOW
1. Login -- goes to Family Dashboard (real journey events for Ama)
2. **Continuity Bridge** -- see care narrative
3. **Bereavement Support** (/bereavement-support) -- 5-tab dashboard:
   - Overview, Resources (clickable links), Support Groups, Counseling, My Journey
4. **Memory Vault** -- add/view memories
5. **Messages** -- contact Ama's care team
6. **Community** -- join bereavement-specific groups
7. **Legacy Access** (/my-legacy-access) -- see what's been shared

### FAMILY (family.akos) -- KOFI'S FAMILY
1. Dashboard -- Kofi's real journey events shown
2. Appointments -- see upcoming care visits
3. Messages -- communicate with care team

---

## KEY FEATURES TO VERIFY

### ML Features
- [ ] AIInsights: 11 patients in batch table, SHAP column, Meds Risk column
- [ ] AIInsights: Drug interaction panel shows Abena with SEVERE interaction
- [ ] PatientMonitor ML tab: 8 task cards, click to expand SHAP waterfall
- [ ] PatientDetail compact: ML risk strip showing on every patient card
- [ ] Medications: Select Abena -- see red SEVERE drug interaction panel
- [ ] Dashboard: Drug interaction warning banner (Abena's Morphine+Diazepam)

### Navigation & Sidebar
- [ ] Clinician sidebar: Dashboard, Patients, AI Insights, Alerts, Medications, Appointments, Caregivers, Shift Handover, Pre-Clinic, Care Guide, Medical KB
- [ ] Caregiver sidebar: Dashboard, Patients, Medications, Appointments, Shift Handover, Daily Care Log, Residential Log, Care Settings
- [ ] Patient sidebar: My Space, Wellness Check, Messages, My Journey, Resources, Community, Memory Vault, Journal, Digital Legacy
- [ ] Family sidebar: Overview, Messages, Continuity Bridge, Bereavement Support, Community, Resources, Legacy Access

### Encoding (no mojibake)
- [ ] Register page: clean labels, no ? or â€ characters
- [ ] Alert messages: rounded numbers (84.3% not 84.256...)
- [ ] Care settings page: clean descriptions
- [ ] Questionnaire: all steps display cleanly

### Questionnaire Flow
- [ ] New patient login redirects to /setup
- [ ] Returning patient bypasses questionnaire
- [ ] 10 steps complete without errors
- [ ] After completion: redirects to /my-space

---

## QUICK START

```
URL:      http://localhost:5173
Backend:  http://localhost:8000

Start:    Double-click "Project Aura" desktop shortcut
          Wait 40 seconds for ML models to load

Test ML:  Login as dr.mensah / TestPass123!
          Go to AI Insights -- see all 11 patients with ML scores
          Click SHAP button on any patient -- see XGBoost + SHAP breakdown

Test drug interactions:
          Go to Medications -- search for Abena Owusu Darko
          See red SEVERE interaction panel: Morphine + Diazepam

Test patient portal:
          Login as patient.ama2 / TestPass123!
          Complete the questionnaire (10 steps)
          See My Space with ESAS sparklines and care journey
```

---

*Generated: Project Aura v2.0 -- All 10 test users verified working*
