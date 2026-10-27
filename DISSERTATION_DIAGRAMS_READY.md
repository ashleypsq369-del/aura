# 🎨 Dissertation Diagrams - Ready to Generate
# All prompts and code are ready. Just paste and export.

---

## ══════════════════════════════════════════════
## FIGURES 3.1 & 3.4 - USE MERMAID.LIVE
## ══════════════════════════════════════════════
## HOW TO USE MERMAID:
## 1. Go to https://mermaid.live
## 2. DELETE everything in the left editor panel
## 3. Paste the code block below
## 4. The diagram appears on the right instantly
## 5. Click "Download PNG" (top right) → 300 DPI option
## ══════════════════════════════════════════════

---

## FIGURE 3.1 - SDLC / Waterfall Phases
## PASTE THIS ENTIRE BLOCK into https://mermaid.live

```
flowchart TD
    A["📋 PHASE 1: REQUIREMENTS ANALYSIS\n────────────────────────────────\n• Literature review on palliative care systems\n• Stakeholder interviews with clinicians & patients\n• Identification of 5 user roles & 15 core features\n• Functional & non-functional requirements defined\n• Ghana healthcare context analysis\n• HIPAA/data privacy requirements identified"]

    B["🎨 PHASE 2: SYSTEM DESIGN\n────────────────────────────────\n• Database schema - 34 SQLAlchemy models\n• API architecture - FastAPI, 39 REST endpoints\n• ML pipeline design - XGBoost × 8 clinical tasks\n• UI wireframes for 5 role-based dashboards\n• 3-tier architecture blueprint\n• Personalisation engine design"]

    C["💻 PHASE 3: IMPLEMENTATION\n────────────────────────────────\n• Frontend: React 19 + Vite + TailwindCSS\n• Backend: FastAPI + SQLAlchemy + SQLite\n• ML: XGBoost 8-task classifier + SHAP\n• LLM: Gemini/Groq integration\n• Offline: Service worker + offlineClient.js\n• Accessibility: 14 a11y settings + voice control"]

    D["🧪 PHASE 4: TESTING & VALIDATION\n────────────────────────────────\n• Unit tests - test_api.py (39 endpoints)\n• ML model accuracy validation\n• SHAP value correctness verification\n• HIPAA compliance audit trail check\n• Cross-browser compatibility testing\n• Mobile responsiveness testing"]

    E["🚀 PHASE 5: DEPLOYMENT\n────────────────────────────────\n• Web: Vite build served via FastAPI\n• Desktop: pywebview wrapper\n• Demo data seeding - 34 users, 13 patients\n• Branch: feature/personalisation-and-ui-polish\n• GitHub repository (private)"]

    F["🔄 PHASE 6: MAINTENANCE\n────────────────────────────────\n• ML model retraining - retrain_targeted.py\n• Bug fixes from user testing feedback\n• Dark mode & mobile responsiveness patches\n• Personalisation engine enhancements\n• Documentation updates"]

    A --> B --> C --> D --> E --> F

    style A fill:#0f766e,color:#ffffff,stroke:#0d9488
    style B fill:#0369a1,color:#ffffff,stroke:#0284c7
    style C fill:#1d4ed8,color:#ffffff,stroke:#2563eb
    style D fill:#7c3aed,color:#ffffff,stroke:#8b5cf6
    style E fill:#b45309,color:#ffffff,stroke:#d97706
    style F fill:#374151,color:#ffffff,stroke:#6b7280
```

---

## FIGURE 3.4 - AI / SHAP Explainability Pipeline
## PASTE THIS ENTIRE BLOCK into https://mermaid.live

```
flowchart TB
    subgraph INPUT["📥 INPUT - Patient Clinical Record"]
        direction LR
        D1["Demographics\nAge, Gender, Diagnosis"]
        D2["ESAS Symptoms\nPain 0-10 × 8 items"]
        D3["Vitals\nHR, BP, SpO₂, Temp"]
        D4["Medications\nCount, Types, Adherence"]
        D5["Assessments\nPPS, Barthel, PHQ-9"]
    end

    subgraph FE["⚙️ FEATURE ENGINEERING - ml_model_service.py"]
        F1["28 Features Extracted\n& Normalised via SavedScaler"]
    end

    subgraph ML["🤖 XGBOOST ENSEMBLE - 8 Parallel Classifiers"]
        direction LR
        M1["Pain\nRisk"]
        M2["Mortality\nRisk"]
        M3["Admission\nRisk"]
        M4["Symptom\nBurden"]
        M5["Psych\nRisk"]
        M6["Med\nAdherence"]
        M7["Caregiver\nBurden"]
        M8["Deterioration\nRisk"]
    end

    subgraph SCORE["📊 RISK SCORING"]
        S1["Overall Risk Score\n0.0 - 1.0"]
        S2["Risk Level\nLow / Moderate / High / Crisis"]
    end

    subgraph SHAP["🔍 SHAP TreeExplainer - shap_values computed"]
        SH1["Feature: Pain Score (ESAS)\nImpact: +12.3% → Increases risk"]
        SH2["Feature: PPS Score\nImpact: +9.1% → Increases risk"]
        SH3["Feature: Age\nImpact: +7.4% → Increases risk"]
        SH4["Feature: SpO₂\nImpact: -5.2% → Decreases risk"]
    end

    subgraph STORE["💾 STORED in Prediction Table"]
        P1["overall_risk, risk_level\nshap_values JSON\ntask_scores JSON"]
    end

    subgraph UI["🖥️ FRONTEND - RiskExplanationPanel.jsx"]
        U1["SHAP Bar Chart\nClinician sees plain-English\nexplanation of each factor"]
        U2["Domain Breakdown\n8 risk task scores\nwith progress bars"]
        U3["Clinician Feedback\nAgree / Partial / Disagree\n→ ML learning loop"]
    end

    INPUT --> FE
    FE --> ML
    ML --> SCORE
    SCORE --> SHAP
    SHAP --> STORE
    STORE --> UI

    style INPUT fill:#f0fdfa,stroke:#0d9488
    style FE fill:#eff6ff,stroke:#3b82f6
    style ML fill:#f5f3ff,stroke:#7c3aed
    style SCORE fill:#fff7ed,stroke:#ea580c
    style SHAP fill:#fef3c7,stroke:#d97706
    style STORE fill:#f0fdf4,stroke:#16a34a
    style UI fill:#fdf4ff,stroke:#a855f7
```

---

## ══════════════════════════════════════════════
## FIGURES 3.2, 3.3, 3.5, 3.6 - USE ERASER.IO
## ══════════════════════════════════════════════
## HOW TO USE ERASER:
## 1. Go to the URL shown for each figure
## 2. Click "Try it free" - NO account needed for 5 free diagrams
## 3. Paste the EXACT prompt shown below
## 4. Click Generate
## 5. Export → PNG → Download
## ══════════════════════════════════════════════

---

## FIGURE 3.2 - SYSTEM ARCHITECTURE DIAGRAM
## GO TO: https://eraser.io/ai/system-architecture-diagram-generator
## PASTE THIS PROMPT:

Three-tier system architecture for ProjectAura - an AI-powered palliative care management platform.

PRESENTATION LAYER (top):
- React 19 web application (browser-based, runs on port 5173 in dev)
- Tailwind CSS + Framer Motion for responsive, animated UI
- pywebview desktop wrapper (optional offline desktop app)
- Role-based views for: Admin, Clinician, Caregiver, Patient, Family

APPLICATION LAYER (middle):
- FastAPI REST API server (Python, Uvicorn, port 8000) with 39 routers
- XGBoost ML Service: 8 parallel clinical risk models + SHAP TreeExplainer
- Aura AI Engine: rule-based clinical AI + optional Gemini/Groq LLM
- WebSocket Server: real-time alerts and notifications
- Web Push Notification Service (VAPID keys)
- Personalisation Engine: questionnaire-driven UI customisation

DATA LAYER (bottom):
- SQLite database (aura.db): 34 SQLAlchemy models, 34 demo users pre-seeded
- XGBoost model files (.joblib): 8 trained models + scaler + encoder
- Static file storage: PDFs, uploaded images, legacy content

CONNECTIONS:
- Presentation to Application: HTTPS REST API, WebSocket (ws://)
- Application to Data: SQLAlchemy ORM

---

## FIGURE 3.3 - ENTITY-RELATIONSHIP DIAGRAM (ERD)
## GO TO: https://eraser.io/ai/erd-generator
## PASTE THIS PROMPT:

Create a detailed ERD for ProjectAura - a palliative care management platform database.

ENTITIES and their key attributes:

USER: id (PK), username, email, hashed_password, role (admin/clinician/caregiver/patient/family), is_active, last_login, created_at

PATIENT: id (PK), user_id (FK → USER), patient_code, full_name, date_of_birth, gender, primary_diagnosis, risk_level, status, admission_date

USER_PREFERENCES: id (PK), user_id (FK → USER), language_pref, info_style, tech_comfort, primary_condition, esas_pain, esas_anxiety, esas_wellbeing, wants_community, ai_analysis_consent, questionnaire_complete

VITAL: id (PK), patient_id (FK → PATIENT), heart_rate, systolic_bp, diastolic_bp, temperature, spo2, respiratory_rate, recorded_at

SYMPTOM: id (PK), patient_id (FK → PATIENT), symptom_type, severity (0-10), notes, recorded_at

MEDICATION: id (PK), patient_id (FK → PATIENT), name, dose, frequency, route, start_date, is_active

APPOINTMENT: id (PK), patient_id (FK → PATIENT), clinician_id (FK → USER), date_time, appointment_type, status, notes

ALERT: id (PK), patient_id (FK → PATIENT), severity (low/medium/high/critical/crisis), alert_type, message, is_acknowledged, created_at

PREDICTION: id (PK), patient_id (FK → PATIENT), overall_risk_score, risk_level, task_scores (JSON), shap_values (JSON), models_run, created_at

CARE_PLAN: id (PK), patient_id (FK → PATIENT, unique), care_phase, goals_of_care, pain_management_plan, psychological_support, spiritual_care, review_date

GOAL: id (PK), care_plan_id (FK → CARE_PLAN), title, description, status, priority, category, target_date, progress

AUDIT_LOG: id (PK), user_id (FK → USER), action, resource_type, resource_id, details, created_at

RELATIONSHIPS:
USER one-to-one PATIENT
USER one-to-one USER_PREFERENCES
PATIENT one-to-many VITAL
PATIENT one-to-many SYMPTOM
PATIENT one-to-many MEDICATION
PATIENT one-to-many APPOINTMENT
PATIENT one-to-many ALERT
PATIENT one-to-one CARE_PLAN
CARE_PLAN one-to-many GOAL
PATIENT one-to-many PREDICTION
USER one-to-many AUDIT_LOG

---

## FIGURE 3.5 - SECURITY / DATA-FLOW ARCHITECTURE
## GO TO: https://eraser.io/ai/system-architecture-diagram-generator
## PASTE THIS PROMPT:

Security and data-flow architecture diagram for ProjectAura - a HIPAA-compliant palliative care platform.

Show the complete security chain as a vertical flow with these layers:

LAYER 1 - CLIENT (Browser/Desktop App):
- User enters username + password
- HTTPS/TLS encrypts all data in transit
- JWT token stored in localStorage after successful login
- All subsequent requests include: Authorization: Bearer <token>

LAYER 2 - FASTAPI AUTHENTICATION MIDDLEWARE:
- JWT token decoded and verified (SECRET_KEY, 24h expiry)
- User identity confirmed: user_id, role extracted
- Failed login counter incremented (lockout after 5 attempts)
- Password comparison via bcrypt hash (never stored plaintext)

LAYER 3 - RBAC (Role-Based Access Control):
- 5 roles: admin, clinician, caregiver, patient, family
- require_role() dependency decorator on each endpoint
- Admin-only: user management, audit log, HIPAA compliance
- Patient-only: own data access (patient_id filtering)
- Clinician: all patient data for assigned patients

LAYER 4 - ENDPOINT HANDLER:
- Input validated via Pydantic models (type safety)
- Business logic executed
- Response data filtered by role

LAYER 5 - AUDIT LOG (HIPAA Compliance):
- Every action recorded: user_id, role, action, resource_type, resource_id, timestamp
- Immutable - no UPDATE or DELETE on audit records
- Exportable via /api/admin/hipaa-compliance

LAYER 6 - DATABASE (SQLite):
- Passwords: bcrypt hashed (never readable)
- Patient data: row-level isolation per patient_id
- Sensitive fields: questionnaire data encrypted at rest
- Connection pool: SQLAlchemy with thread-safe sessions

---

## FIGURE 3.6 - SYSTEM PROCESS FLOWCHART
## GO TO: https://eraser.io/ai/flowchart-generator
## PASTE THIS PROMPT:

Create a detailed system process flowchart for ProjectAura palliative care platform. Use diamond shapes for decisions, rectangles for actions, parallelograms for inputs/outputs.

START

User opens http://localhost:5173 in browser

DECISION: Is user already logged in (JWT in localStorage)?
→ YES → Load role-specific dashboard
→ NO → Show Login Page

User enters username and password

DECISION: Are credentials valid?
→ NO → Show error "Invalid credentials" → increment failed count → DECISION: Failed count ≥ 5? → YES → Lock account 30 mins → NO → retry login
→ YES → Issue JWT token (24h) → determine role

DECISION: Is this the user's first login? (questionnaire_complete = false)
→ YES → Redirect to PersonalisationQuestionnaire (10 steps)
→ User completes questionnaire → Apply settings (theme, language, font size, accessibility) → Save to backend
→ NO → Continue

Load role-specific dashboard:
→ CLINICIAN path: Patient list + AI Insights + Real-time Alerts
→ PATIENT path: My Space + Wellness Check-in + Community
→ FAMILY path: Continuity Bridge + Memory Vault + Bereavement Support

[CLINICIAN PATH - MAIN WORKFLOW]
Clinician selects a patient from the patient list

System loads Patient Detail:
- Latest vitals (heart rate, BP, SpO2, temperature)
- ESAS symptom scores (pain, anxiety, breathlessness × 8)
- Current medications
- Active care plan goals

Clinician clicks "Run AI Risk Assessment"

ML Service runs 8 parallel XGBoost classifiers:
- Pain Risk Model
- Mortality Risk Model
- Admission Risk Model
- Symptom Burden Model
- Psychological Risk Model
- Medication Adherence Model
- Caregiver Burden Model
- Deterioration Model

SHAP TreeExplainer computes feature contributions for each prediction

DECISION: Overall risk score ≥ HIGH (0.65)?
→ YES → Create Alert in database → WebSocket broadcasts to all connected clinicians → Push notification sent to mobile devices → Clinician sees alert badge increment in header
→ NO → Save prediction quietly to database

DECISION: Clinician acknowledges alert?
→ YES → Mark alert as acknowledged → Update patient status
→ NO → Alert remains in active alerts list

Clinician reviews SHAP explanation in RiskExplanationPanel:
- See top contributing features with impact %
- Read plain-English explanation
- Submit clinical feedback (agree/disagree)

Clinician updates care plan:
- Adjust medication doses
- Update care goals
- Record clinical notes

Patient submits daily ESAS wellness check-in
→ 8 symptom scores saved
→ Background ML scan triggered automatically
→ System checks for deterioration trends

END (continuous daily cycle)
