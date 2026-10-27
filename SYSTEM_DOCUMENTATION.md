# Project Aura - Complete System Documentation

> AI-powered palliative care platform built for Ghana's healthcare context.
> Full-stack: React 19 + FastAPI + SQLite + XGBoost + self-hosted NLP.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [User Roles & Access Control](#3-user-roles--access-control)
4. [Backend - File Structure](#4-backend--file-structure)
5. [Database Models](#5-database-models)
6. [API Routes](#6-api-routes)
7. [AI & ML System](#7-ai--ml-system)
8. [Frontend - File Structure](#8-frontend--file-structure)
9. [Frontend Pages](#9-frontend-pages)
10. [Frontend Components](#10-frontend-components)
11. [State Management & Context](#11-state-management--context)
12. [Hooks & Utilities](#12-hooks--utilities)
13. [Routing](#13-routing)
14. [Offline Support](#14-offline-support)
15. [Authentication & Security](#15-authentication--security)
16. [Notifications & Alerts](#16-notifications--alerts)
17. [Community & Chat Systems](#17-community--chat-systems)
18. [Legacy & Bereavement System](#18-legacy--bereavement-system)
19. [Data Relationships](#19-data-relationships)
20. [Technology Stack](#20-technology-stack)
21. [Environment Variables](#21-environment-variables)
22. [Development Setup](#22-development-setup)

---

## 1. System Overview

Project Aura is a comprehensive **palliative care management platform** designed for hospitals, hospices, home care, and outpatient settings in Ghana. It serves five user roles across the full continuum of care - from initial diagnosis through death and bereavement.

### Core Capabilities

| Domain | What it does |
|---|---|
| **Clinical AI** | XGBoost risk prediction (8 tasks), SHAP explainability, proactive alerts |
| **Patient Management** | Full CRUD, RBAC, intake forms, patient timelines |
| **Clinical Assessments** | ESAS, PPS, PHQ-9, GAD-7, Barthel Index, BPI, QoL, Caregiver Burden |
| **Care Plans** | AI-generated, goal-tracking, intervention management |
| **Medications** | Prescription tracking, adherence logging, reminders |
| **Appointments** | Scheduling, completion, cancellation, reminders |
| **Messaging** | Real-time patient↔clinician messaging, group chats |
| **Community** | Anonymised 280-char peer support groups, reactions, moderation |
| **AI Chatbot** | Self-hosted NLP companion (Aura AI Engine) + optional Groq/Ollama/Anthropic |
| **Legacy Planning** | Digital wills, heir designation, posthumous content delivery |
| **Bereavement** | Grief journal, PG-13 screening, post-death support schedule |
| **Resources** | Educational content, offline download, bookmarks |
| **HIPAA Compliance** | Audit trail, breach logging, data export, consent management |
| **Care Settings** | 5 palliative care delivery models with interaction matrices |
| **Accessibility** | Font scaling, high contrast, voice control, assisted mode |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (React 19)                       │
│  Vite dev server → http://localhost:5173                     │
│  Tailwind CSS + Framer Motion + Recharts + Lucide icons      │
│  React Query (server state) + React Hook Form                │
│  Offline: IndexedDB cache via idb                            │
└────────────────────┬────────────────────────────────────────┘
                     │ Axios HTTP (JWT Bearer)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI Backend                              │
│  http://localhost:8000                                       │
│  36 routers · 8 services · Uvicorn ASGI                      │
│  python-jose JWT · passlib bcrypt · SQLAlchemy ORM           │
└────────────────────┬────────────────────────────────────────┘
                     │ SQLAlchemy
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               SQLite (aura.db)                               │
│  50+ tables · Single file · Dev/prod same DB                 │
│  (PostgreSQL supported via DATABASE_URL change)              │
└─────────────────────────────────────────────────────────────┘
                     │ joblib
                     ▼
┌─────────────────────────────────────────────────────────────┐
│             XGBoost ML Models (backend/models/)              │
│  8 pre-trained risk models · SHAP explanations               │
│  Fallback: rule-based scoring if models not present          │
└─────────────────────────────────────────────────────────────┘
                     │ optional HTTP
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          External LLM (optional, zero-config fallback)       │
│  Groq API → Anthropic → Ollama → Self-hosted Aura AI Engine  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. User Roles & Access Control

| Role | Description | Key Permissions |
|---|---|---|
| `admin` | System administrator | Full access: user management, audit logs, HIPAA compliance, model bias reports |
| `clinician` | Doctor / nurse | Patient CRUD, all clinical data, AI insights, care plans, shift handover |
| `caregiver` | Care assistant / family caregiver | Assigned patients only, daily logs, vitals, medications |
| `patient` | The person receiving care | Own data only: symptoms, appointments, medications, messages, legacy, community |
| `family` | Family member of a patient | Linked patient's care info, memory vault, bereavement, legacy access |

Role is stored on the `User` model. RBAC is enforced in every FastAPI endpoint via `get_current_user` dependency + explicit `role` checks. The frontend adapts its navigation, dashboard layout, and feature visibility based on `user.role` from `AuthContext`.

---

## 4. Backend - File Structure

```
backend/
├── main.py                    ← FastAPI app, all router registrations, CORS
├── requirements.txt           ← Production Python dependencies
├── requirements_minimal.txt   ← Minimal 9-package subset
├── aura.db                    ← SQLite database file
├── .env                       ← Environment variables (not committed)
├── .env.example               ← Example env template
│
├── routers/                   ← One file per feature domain (36 total)
│   ├── admin.py               ← User management, audit log (admin only)
│   ├── ai.py                  ← XGBoost risk prediction + SHAP
│   ├── ai_analysis.py         ← Proactive patient monitoring
│   ├── alerts.py              ← Clinical alerts CRUD + acknowledgement
│   ├── appointments.py        ← Scheduling, cancel, complete
│   ├── auth.py                ← JWT login, register, password reset
│   ├── bereavement.py         ← Grief tracking, PG-13 screening, journal
│   ├── care_plans.py          ← AI-generated care plans, goals, interventions
│   ├── care_settings.py       ← 5 palliative care delivery settings
│   ├── caregiver_intelligence.py ← AI workload balancing, skill matching
│   ├── caregivers.py          ← Team directory, assignments
│   ├── chatbot.py             ← Navigation-focused AI assistant
│   ├── clinical_assessments.py ← ESAS, PPS, PHQ-9, GAD-7 validated tools
│   ├── community.py           ← Anonymised peer support groups
│   ├── comprehensive_ai.py    ← Full SHAP monitoring dashboard
│   ├── contacts.py            ← WhatsApp-style healthcare contacts
│   ├── conversational_chatbot.py ← LLM companion (Groq/Ollama/fallback)
│   ├── dashboard.py           ← Summary stats for dashboards
│   ├── ethics.py              ← Biomedical ethics endpoints
│   ├── hci.py                 ← HCI safety: consent, crisis detection
│   ├── hipaa.py               ← Compliance: export, breach log, audit
│   ├── intelligent_care.py    ← Personalised disease-specific AI care
│   ├── journey.py             ← Patient timeline events
│   ├── legacy.py              ← Digital legacy + heir management
│   ├── medical_knowledge.py   ← Palliative care knowledge base API
│   ├── medications.py         ← Prescription CRUD + adherence
│   ├── messaging.py           ← Real-time conversations + group chats
│   ├── notifications.py       ← Medication/appointment/message notifications
│   ├── patients.py            ← Patient CRUD + RBAC
│   ├── portal.py              ← Adaptive patient portal payload
│   ├── preferences.py         ← Personalisation questionnaire
│   ├── profile.py             ← User profile + notification preferences
│   ├── resources.py           ← Educational content + bookmarks
│   ├── symptoms.py            ← Symptom logs CRUD
│   ├── uploads.py             ← File upload handler
│   └── vitals.py              ← Vital signs CRUD
│
├── services/                  ← Business logic and AI engines
│   ├── aura_ai_engine.py      ← Self-hosted NLP: TF-IDF, 500+ Q&A, crisis guard
│   ├── care_plan_engine.py    ← Local AI care plan generation
│   ├── journey_tracker.py     ← Auto-creates journey events on clinical actions
│   ├── llm_engine.py          ← Routes chat: Groq → Anthropic → Ollama → local
│   ├── medical_knowledge_base.py ← Comprehensive medical knowledge store
│   ├── ml_model_service.py    ← XGBoost model loader (8 risk tasks)
│   ├── notification_service.py ← Background notification monitor
│   └── personalisation.py     ← Adaptive portal personalisation
│
├── src/
│   ├── db.py                  ← ALL SQLAlchemy models (50+ tables)
│   ├── alerts.py              ← Alert dataclasses and priority enums
│   ├── simulator.py           ← Synthetic patient data generator
│   └── xai.py                 ← SHAP value processing helpers
│
├── models/                    ← Pre-trained XGBoost .pkl files
├── seed_medical_db.py         ← Seeds medical knowledge base
├── seed_community_groups.py   ← Seeds 50 peer support groups
├── seed_all_data.py           ← Full database seeding script
└── ml_training/               ← ML model training pipeline
    ├── requirements.txt       ← Extra ML packages
    └── train_models.py        ← XGBoost training scripts
```

---

## 5. Database Models

All models defined in `backend/src/db.py` using SQLAlchemy ORM on SQLite.

### Users & Patients

| Model | Table | Key Fields |
|---|---|---|
| `User` | `users` | id, username, email, hashed_password, role, full_name, care_setting, is_professional, failed_logins, locked_until |
| `UserProfile` | `user_profiles` | user_id→users, department, license_number, specialisation, facility_name, language_pref |
| `Patient` | `patients` | id, patient_code, full_name, dob, gender, ghana_card_number, nhis_number, primary_diagnosis, risk_score, risk_level, dnr_status |
| `PatientFamilyLink` | `patient_family_links` | patient_id→patients, family_user_id→users, relationship, is_primary_contact |
| `CaregiverAssignment` | `caregiver_assignments` | patient_id→patients, caregiver_id→users, assigned_by, active |

### Clinical Data

| Model | Table | Key Fields |
|---|---|---|
| `Vital` | `vitals` | patient_id, heart_rate, bp_sys, bp_dia, oxygen_sat, temperature, respiratory_rate, blood_glucose, is_flagged |
| `Symptom` | `symptoms` | patient_id, pain_level, fatigue_level, nausea_level, anxiety_level, depression_level, breathlessness, sleep_quality |
| `Medication` | `medications` | patient_id, name, dose, frequency, route, is_prn, is_active, discontinued_at, prescribed_by |
| `MedicationAdherenceLog` | `medication_adherence_logs` | medication_id, scheduled_at, taken_at, taken, skipped_reason |
| `Appointment` | `appointments` | patient_id, clinician_id, appointment_type, scheduled_at, status, location, reminder_sent |
| `ClinicalNote` | `clinical_notes` | patient_id, author_id, note_type, content, is_private |

### AI & Predictions

| Model | Table | Key Fields |
|---|---|---|
| `Prediction` | `predictions` | patient_id, risk_score, risk_level, confidence, shap_values (JSON), model_version, overridden_by |
| `PredictionFeedback` | `prediction_feedback` | prediction_id, clinician_id, feedback_type (agree/partial/disagree) |
| `ClinicalOverride` | `clinical_overrides` | prediction_id, clinician_id, original_risk, overridden_risk, justification |

### Care Plans

| Model | Table | Key Fields |
|---|---|---|
| `CarePlan` | `care_plans` | patient_id, goals_of_care, pain_management_plan, ai_generated, care_phase, disease_profile |
| `CarePlanGoal` | `care_plan_goals` | care_plan_id, title, category, priority, status, progress (0–100), ai_suggested |
| `CarePlanChecklistItem` | `care_plan_checklist_items` | goal_id, task, frequency, is_completed, due_date |
| `CarePlanIntervention` | `care_plan_interventions` | care_plan_id, name, category, responsible_role, status |

### Clinical Assessment Tools

| Model | Table | Validated Tool |
|---|---|---|
| `ESASAssessment` | `esas_assessments` | Edmonton Symptom Assessment System (pain/fatigue/nausea/depression/anxiety/breathlessness/appetite/wellbeing each 0–10) |
| `PPSAssessment` | `pps_assessments` | Palliative Performance Scale (ambulation/activity/self_care/intake/consciousness → pps_score) |
| `PHQ9Assessment` | `phq9_assessments` | PHQ-9 Depression (q1–q9 scores, total, severity) |
| `GAD7Assessment` | `gad7_assessments` | GAD-7 Anxiety (q1–q7 scores, total, severity) |
| `BarthelIndexAssessment` | `barthel_assessments` | Barthel ADL (10 domains → total_score) |
| `PainAssessment` | `pain_assessments` | Brief Pain Inventory (worst/least/average/current pain + interference) |
| `QualityOfLifeAssessment` | `qol_assessments` | FACT-G QoL (physical/social/emotional/functional wellbeing) |
| `CaregiverBurdenAssessment` | `caregiver_burden_assessments` | Zarit Burden Interview (12 items → total, burden_level) |
| `CognitiveAssessment` | `cognitive_assessments` | MMSE/MoCA (orientation, memory, attention, language) |
| `MotorSkillsAssessment` | `motor_skills_assessments` | Physical function (grip_strength, balance, gait_speed, timed_up_go) |

### Alerts & Notifications

| Model | Table | Purpose |
|---|---|---|
| `Alert` | `alerts` | Clinical emergency alerts (severity: low/medium/high/critical) |
| `AlertThreshold` | `alert_thresholds` | Per-patient configurable vital thresholds |
| `NotificationQueue` | `notification_queue` | Scheduled routine notifications (meds, appointments) |
| `CrisisAlert` | `crisis_alerts` | Chatbot-detected crisis (keywords, confidence, escalation status) |
| `PatientConsent` | `patient_consents` | Consent records for AI/data/research use |

### Messaging

| Model | Table | Purpose |
|---|---|---|
| `Conversation` | `conversations` | Private or group conversation container |
| `ConversationParticipant` | `conversation_participants` | Many-to-many: users ↔ conversations |
| `Message` | `messages` | Individual messages (encrypted, supports media) |
| `MessageRead` | `message_reads` | Read receipts |
| `MessageReaction` | `message_reactions` | Emoji reactions |
| `Contact` | `contacts` | Saved healthcare contacts |
| `FileAttachment` | `file_attachments` | Uploaded files linked to messages |

### Community

| Model | Table | Purpose |
|---|---|---|
| `CommunityGroup` | `community_groups` | Support group (name, condition_tags, member_count, image_url, created_by) |
| `CommunityMembership` | `community_memberships` | User group membership (user_id, group_id, is_active) |
| `CommunityPost` | `community_posts` | Anonymised posts max 280 chars (display_name, reactions JSON, flag_count) |

### Legacy & Bereavement

| Model | Table | Purpose |
|---|---|---|
| `LegacyHeir` | `legacy_heirs` | Designated heirs (access_level, can_access_private, activated_at) |
| `LegacyContent` | `legacy_content` | Messages/audio/video for delivery after death |
| `LegacyConsent` | `legacy_consents` | Advance directives and sharing permissions |
| `BereavementEntry` | `bereavement_entries` | Grief journal (sentiment_score, grief_stage_hint) |
| `BereavementScreening` | `bereavement_screenings` | PG-13 prolonged grief screening |
| `GriefJournal` | `grief_journal` | Structured grief journal entries |
| `PostDeathSchedule` | `post_death_schedules` | Post-death support touchpoints schedule |

### Chatbot & HCI Safety

| Model | Table | Purpose |
|---|---|---|
| `ChatbotSession` | `chatbot_sessions` | Conversation sessions (escalated flag) |
| `ChatbotMessage` | `chatbot_messages` | Messages (intent, sentiment_score, crisis_flagged) |
| `ChatbotConsent` | `chatbot_consent` | HIPAA consent for AI chatbot use |
| `UsabilityFeedback` | `usability_feedback` | Page star ratings + comments |

### HIPAA & Compliance

| Model | Table | Purpose |
|---|---|---|
| `AuditLog` | `audit_logs` | Full action trail (action, resource_type, resource_id, ip_address) |
| `BreachIncident` | `breach_incidents` | HIPAA breach records |
| `PasswordResetToken` | `password_reset_tokens` | Time-limited reset tokens |

### Personalisation & Resources

| Model | Table | Purpose |
|---|---|---|
| `PatientPreferences` | `patient_preferences` | Questionnaire answers driving adaptive UI |
| `Resource` | `resources` | Educational content (condition_tags, topic_tags, is_downloadable) |
| `ResourceBookmark` | `resource_bookmarks` | user_id → resource_id |
| `ResourceFeedback` | `resource_feedback` | Helpful/not-helpful per resource |

### Care Settings & Journey

| Model | Table | Purpose |
|---|---|---|
| `CareSettingTemplate` | `care_setting_templates` | 5 setting definitions (hospital/hospice/home/outpatient/residential) |
| `PatientCareSetting` | `patient_care_settings` | Patient's current + historical care settings |
| `CareSettingInteraction` | `care_setting_interactions` | Role interaction matrix per setting |
| `PatientJourneyEvent` | `patient_journey_events` | Timeline milestones (admission, medication change, alert, assessment, appointment) |
| `ConditionCareTemplate` | `condition_care_templates` | Diagnosis-specific care plan templates |

---

## 6. API Routes

All endpoints require `Authorization: Bearer <JWT>` except `/api/auth/login` and `/api/auth/register`.

### Auth - `/api/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/login` | Returns JWT access token |
| POST | `/register` | Create new user account |
| POST | `/change-password` | Change authenticated user's password |
| POST | `/forgot-password` | Send reset token |
| POST | `/reset-password` | Apply new password with token |
| GET | `/me` | Get current user profile |

### Patients - `/api/patients`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List patients (admin/clinician: all; caregiver: assigned) |
| POST | `/` | Create patient |
| GET | `/{id}` | Get single patient |
| PUT | `/{id}` | Update patient |
| GET | `/search` | Search patients |

### Vitals - `/api/vitals`
| Method | Path | Description |
|---|---|---|
| GET | `/{patient_id}` | Get patient vitals |
| POST | `/` | Log new vitals |
| GET | `/{patient_id}/recent` | Most recent vitals |

### Medications - `/api/medications`
| Method | Path | Description |
|---|---|---|
| GET | `/{patient_id}` | List active medications |
| POST | `/` | Add medication |
| PUT | `/{id}` | Update medication |
| DELETE | `/{id}` | Discontinue medication |

### Appointments - `/api/appointments`
| Method | Path | Description |
|---|---|---|
| GET | `/{patient_id}` | List appointments |
| POST | `/` | Schedule appointment |
| PUT | `/{id}` | Update status (scheduled/completed/cancelled) |

### Clinical Assessments - `/api/clinical-assessments`
| Method | Path | Description |
|---|---|---|
| POST | `/esas` | Submit ESAS assessment |
| GET | `/esas/{patient_id}` | Get ESAS history |
| POST | `/pps` | Submit PPS assessment |
| GET | `/pps/{patient_id}` | Get PPS history |
| POST | `/phq9` | Submit PHQ-9 |
| POST | `/gad7` | Submit GAD-7 |
| POST | `/barthel` | Submit Barthel Index |
| POST | `/pain` | Submit Brief Pain Inventory |
| POST | `/qol` | Submit Quality of Life |
| POST | `/caregiver-burden` | Submit Caregiver Burden |
| POST | `/cognitive` | Submit Cognitive Assessment |
| POST | `/motor-skills` | Submit Motor Skills |

### Care Plans - `/api/care-plans`
| Method | Path | Description |
|---|---|---|
| GET | `/{patient_id}` | Get care plan |
| POST | `/generate/{patient_id}` | AI-generate care plan |
| PUT | `/{id}` | Update care plan |
| POST | `/{id}/goals` | Add goal |
| PUT | `/goals/{goal_id}` | Update goal |
| DELETE | `/goals/{goal_id}` | Delete goal |
| POST | `/{id}/interventions` | Add intervention |
| PUT | `/interventions/{iv_id}` | Update intervention |

### Alerts - `/api/alerts`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List all alerts |
| GET | `/unread-count` | Unread count |
| PUT | `/{id}/acknowledge` | Acknowledge alert |

### Notifications - `/api/notifications`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List notifications |
| GET | `/unread-count` | Unread count |
| PUT | `/{id}/read` | Mark read |
| PUT | `/mark-all-read` | Mark all read |
| DELETE | `/{id}` | Delete notification |
| DELETE | `/clear-read` | Clear read notifications |

### Community - `/api/community`
| Method | Path | Description |
|---|---|---|
| GET | `/groups` | List all groups (with `joined` per user) |
| POST | `/groups` | Create new group |
| PUT | `/groups/{id}` | Update group (creator/admin only) |
| GET | `/groups/{id}/members` | Anonymised member list |
| POST | `/groups/{id}/join` | Toggle join/leave |
| GET | `/groups/{id}/posts` | Get posts |
| POST | `/posts` | Create post |
| POST | `/posts/{id}/react` | React (pray/heart/strong) |
| POST | `/posts/{id}/flag` | Flag for moderation |
| PUT | `/posts/{id}/moderate` | Admin moderation |

### Messaging - `/api/messaging`
| Method | Path | Description |
|---|---|---|
| GET | `/conversations` | List conversations |
| POST | `/conversations/start` | Start conversation (private or group) |
| GET | `/conversations/{id}/messages` | Get messages |
| POST | `/conversations/{id}/messages` | Send message |
| GET | `/physicians` | List physicians for new chat |

### Journey - `/api/journey`
| Method | Path | Description |
|---|---|---|
| GET | `/patients/{patient_id}` | Get patient journey timeline |
| GET | `/my-journey` | Get logged-in user's journey |
| POST | `/` | Create journey event (clinician/admin) |

### AI - `/api/ai`
| Method | Path | Description |
|---|---|---|
| POST | `/predict/{patient_id}` | Run risk prediction |
| GET | `/insights/{patient_id}` | Get cached predictions |
| POST | `/predict-batch` | Batch risk prediction |
| POST | `/override/{prediction_id}` | Clinician override |

### Dashboard - `/api/dashboard`
| Method | Path | Description |
|---|---|---|
| GET | `/summary` | Role-adaptive summary stats |

### HIPAA - `/api/hipaa`
| Method | Path | Description |
|---|---|---|
| GET | `/compliance-dashboard` | Compliance overview |
| POST | `/breach-incident` | Log breach |
| GET | `/audit-trail` | Export audit log |
| GET | `/export/{patient_id}` | Full patient data export |

---

## 7. AI & ML System

### XGBoost Risk Models (`backend/services/ml_model_service.py`)

8 pre-trained models loaded from `backend/models/*.pkl`:

| Task | Output | Threshold |
|---|---|---|
| `vital_risk` | Low/Medium/High/Crisis | Score 0–1 |
| `symptom_burden` | Symptom severity class | Score 0–1 |
| `functional_decline` | Decline probability | Score 0–1 |
| `cognitive_impairment` | Impairment risk | Score 0–1 |
| `mental_health_risk` | Depression/anxiety risk | Score 0–1 |
| `medication_risk` | Adverse event risk | Score 0–1 |
| `caregiver_burden` | Burden level | Score 0–1 |
| `admission_risk` | Hospital admission risk | Score 0–1 |

**Fallback:** If `.pkl` files are absent, a rule-based scoring engine in `ml_model_service.py` computes estimates from raw vitals and symptom values.

**SHAP Explainability** (`backend/src/xai.py`): Each prediction returns `shap_values` (JSON array) and a `plain_explanation` (natural language). The frontend renders these in `SHAPBarChart.jsx` and `SHAPWaterfallChart.jsx`.

### Aura AI Engine (`backend/services/aura_ai_engine.py`)

Self-hosted NLP companion - zero external API calls required:

- **TF-IDF intent classifier** trained on 500+ medical Q&A pairs
- **Entity extraction**: symptoms, medications, body parts, emotions
- **Crisis detection**: keyword + phrase pattern matching → escalation to care team
- **Medical knowledge**: Ghana-specific palliative care protocols, NHIS info, cultural context
- **Sentiment analysis**: VaderSentiment for emotional support routing
- **7 conversation layers**: greeting, symptom assessment, medication, emotional support, resources, navigation, general

### LLM Routing (`backend/services/llm_engine.py`)

Priority cascade - falls back if API key absent or request fails:

```
Groq (llama3-8b) → Anthropic Claude → Ollama (local) → Aura AI Engine
```

### Care Plan AI (`backend/services/care_plan_engine.py`)

Reads all patient data (ESAS, PPS, PHQ-9, vitals, medications, diagnosis) and generates:
- Goals of care narrative
- Pain management plan
- List of `CarePlanGoal` objects with priority and progress tracking
- `CarePlanIntervention` objects with responsible role

---

## 8. Frontend - File Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── .eslintrc.cjs
│
├── public/
│   └── resources/
│       ├── headers/           ← Page header banner images (JPG)
│       └── cards/             ← Feature card + group images (JPG)
│
└── src/
    ├── App.jsx                ← Router setup, protected routes, global overlays
    ├── main.jsx               ← ReactDOM.createRoot entry point
    ├── index.css              ← Global CSS: search-wrap, scrollbar, base styles
    │
    ├── api/
    │   ├── client.js          ← Axios instance (baseURL, JWT interceptor)
    │   └── offlineClient.js   ← Offline wrapper + IndexedDB cache
    │
    ├── context/
    │   ├── AccessibilityContext.jsx  ← Font size, contrast, motion, voice
    │   ├── AppSettingsContext.jsx    ← AI widget visibility, theme
    │   ├── AuthContext.jsx           ← User, token, login/logout
    │   └── CareSettingContext.jsx    ← Active care setting for session
    │
    ├── hooks/
    │   ├── useAnimations.js          ← AOS init helpers
    │   ├── useIdleTimer.js           ← HIPAA 15-min auto-logoff
    │   ├── useTouchSupport.js        ← Mobile haptic + sound init
    │   └── useVoiceControl.js        ← Web Speech API voice commands
    │
    ├── utils/
    │   ├── animations.js             ← Framer Motion variants
    │   ├── chatEncryption.js         ← Client-side message encryption
    │   ├── formValidation.js         ← Shared form validation rules
    │   ├── offlineDataCache.js       ← IndexedDB (idb) cache layer
    │   ├── offlineStorage.js         ← Low-level offline primitives
    │   ├── resourceDownloader.js     ← Background resource downloader
    │   ├── toast.jsx                 ← Custom toast (react-hot-toast wrapper)
    │   ├── touchSupport.js           ← Haptic (vibrate) + Web Audio feedback
    │   └── voiceToText.js            ← Web Speech API transcription
    │
    ├── styles/
    │   ├── accessibility.css         ← Header icon overrides, focus styles
    │   ├── animations.css            ← CSS keyframe animations
    │   ├── symbol-fixes.css          ← Lucide SVG alignment fixes
    │   ├── themes.css                ← Dark/light theme CSS variable overrides
    │   └── touch.css                 ← Touch target sizing
    │
    ├── pages/                        ← 63 page components (see Section 9)
    └── components/                   ← 50 shared components (see Section 10)
```

---

## 9. Frontend Pages

### Authentication
| File | Route | Description |
|---|---|---|
| `Login.jsx` | `/login` | JWT login with animated slideshow |
| `Register.jsx` | `/register` | Multi-step registration + role selection |
| `ForgotPassword.jsx` | `/forgot-password` | Password reset request |
| `ResetPassword.jsx` | `/reset-password` | Apply token-based password reset |
| `PersonalisationQuest.jsx` | `/setup` | 5-step personalisation questionnaire (patients/family only) |

### Dashboards
| File | Route | Description |
|---|---|---|
| `Dashboard.jsx` | `/dashboard` | Role-adaptive: clinician KPIs, caregiver summary, family overview |
| `PatientPortal.jsx` | `/my-space` | Patient home - 12 feature tiles, journey phase, care team, wellbeing snapshot |

### Patient Management
| File | Route | Description |
|---|---|---|
| `Patients.jsx` | `/patients` | Searchable patient list with risk badges |
| `PatientDetail.jsx` | `/patients/:id` | Full patient profile - 8 clinical domain tiles |
| `PatientMonitor.jsx` | `/patient/:id` | Real-time monitoring - vitals chart, symptoms, care plan, assessments |
| `VitalsDetail.jsx` | `/patients/:id/vitals` | Vitals history charts |
| `MedicationsDetail.jsx` | `/patients/:id/medications` | Full medication history |
| `SymptomsDetail.jsx` | `/patients/:id/symptoms` | Symptom trend charts |
| `WellbeingDetail.jsx` | `/patients/:id/wellbeing` | QoL and psychological assessment charts |

### Clinical Tools
| File | Route | Description |
|---|---|---|
| `Appointments.jsx` | `/appointments` | Schedule, view, complete/cancel appointments |
| `Medications.jsx` | `/medications` | Prescribe and manage medications |
| `Alerts.jsx` | `/alerts` | Clinical alert management and triage |
| `AIInsights.jsx` | `/ai-insights` | XGBoost risk predictions with SHAP charts |
| `MedicalKnowledge.jsx` | `/medical-knowledge` | Palliative care knowledge base browser |
| `CarePlanDetail.jsx` | `/patients/:id/care-plan` | AI care plan with editable goals |
| `AdaptiveCareGuide.jsx` | `/care-guide/:id` | Personalised care guide from care plan |
| `CareGuide.jsx` | `/care-guide` | General palliative care guide |

### Clinical Assessments (all under `/assessments/:id/...`)
`ESASForm`, `PPSForm`, `MentalHealthForm`, `BarthelIndexForm`, `CognitiveAssessmentForm`, `BriefPainInventoryForm`, `QualityOfLifeForm`, `CaregiverBurdenForm`, `MotorSkillsForm`, `AssessmentDashboard`

### Communication
| File | Route | Description |
|---|---|---|
| `Messages.jsx` | `/messages` | WhatsApp-style messaging with group chats |
| `Notifications.jsx` | `/notifications` | Full notification history |

### Community
| File | Route | Description |
|---|---|---|
| `CommunityHub.jsx` | `/community` | Group listing - rich cards, join/leave, search, tabs |
| `CommunityGroupPage.jsx` | `/community/:groupId` | Full-screen group chat with info sidebar |

### Resources & Education
| File | Route | Description |
|---|---|---|
| `Resources.jsx` | `/resources` | Educational resources - search, filter, bookmark, download |

### Legacy & Bereavement
| File | Route | Description |
|---|---|---|
| `ContinuityBridge.jsx` | `/continuity-bridge` | Grief support hub - journal, resources, groups, counselling |
| `MemoryVault.jsx` | `/memory-vault` | Preserve and share memories |
| `Journal.jsx` | `/journal` | Private grief journal |
| `LegacySetup.jsx` | `/legacy-setup` | Digital legacy configuration |
| `LegacyContentCreator.jsx` | `/legacy-content` | Create messages/letters for heirs |
| `HeirManagement.jsx` | `/heir-management` | Designate heirs and access levels |
| `MyLegacyAccess.jsx` | `/my-legacy-access` | Heir views their access to a loved one's legacy |

### Wellness
| File | Route | Description |
|---|---|---|
| `WellnessCheckin.jsx` | `/wellness-checkin` | Patient daily ESAS self-report (8 dimensions 0–10) |
| `MyJourney.jsx` | `/my-journey` | Patient care journey timeline |

### Clinical Operations
| File | Route | Description |
|---|---|---|
| `Caregivers.jsx` | `/caregivers` | Care team directory + AI workload analytics |
| `CareSettings.jsx` | `/care-settings` | 5 palliative care setting management |
| `ShiftHandover.jsx` | `/shift-handover` | Structured shift handover notes |
| `DailyCareLog.jsx` | `/daily-care-log` | Daily care activity logging |
| `PreClinicChecklist.jsx` | `/pre-clinic` | Pre-consultation checklist |
| `ResidentialLog.jsx` | `/residential-log` | Residential facility daily log |

### Admin
| File | Route | Description |
|---|---|---|
| `AdminUserManagement.jsx` | `/admin/users` | User CRUD, role assignment |
| `AuditLog.jsx` | `/admin/audit` | Filterable audit trail |
| `HIPAACompliance.jsx` | `/admin/hipaa-compliance` | Compliance dashboard + breach logging |
| `ModelBiasReportPage.jsx` | `/admin/model-bias-report` | XGBoost fairness and bias analysis |

### User Profile & Settings
| File | Route | Description |
|---|---|---|
| `Profile.jsx` | `/profile` | User profile edit + notification preferences |
| `Settings.jsx` | `/settings` | Appearance, accessibility, AI tools toggle |

---

## 10. Frontend Components

### Layout
| Component | Purpose |
|---|---|
| `layout/Layout.jsx` | App shell: sticky header (nav, notifications, alerts, profile), sidebar, breadcrumbs, dark/light mode |

### Cards & Data Display
| Component | Purpose |
|---|---|
| `ModernCard.jsx` | Base card + `StatCard` + `ProStatCard` + `SectionCard` + `InfoCard` + `ProStatCardGrid` |
| `ImageCard.jsx` | Feature card with photo background, gradient overlay, title, description |
| `PageHeader.jsx` | Full-width page banner with photo, gradient overlay, title, subtitle, icon |
| `SummaryCard.jsx` | Compact summary tile |

### AI & Clinical
| Component | Purpose |
|---|---|
| `AuraChat.jsx` | Teal floating AI companion chatbot (bottom-right) |
| `AIAssistant.jsx` | Purple floating clinical navigation assistant (above AuraChat) |
| `CriticalAlertModal.jsx` | Full-screen critical alert overlay with SHAP data |
| `RealTimeAlerts.jsx` | Alerts bell in header - dropdown + "View All" modal |
| `NotificationCenter.jsx` | Bell in header - categorised notification dropdown |
| `ExplainabilityPanel.jsx` | SHAP explanation panel for predictions |
| `SHAPBarChart.jsx` | Horizontal SHAP bar chart |
| `SHAPWaterfallChart.jsx` | SHAP waterfall chart |
| `FocusedAIExplanation.jsx` | Inline AI explanation card |
| `IntelligentRecommendations.jsx` | AI-generated care recommendations display |
| `PatientRiskSummary.jsx` | Compact risk badge + score display |
| `RiskExplanationPanel.jsx` | Expandable risk factor explanation |
| `ModelBiasReport.jsx` | Fairness metrics charts |

### Forms & Input
| Component | Purpose |
|---|---|
| `Modal.jsx` + `ModalFooter` | Reusable modal wrapper |
| `PatientIntakeForm.jsx` | Validated patient intake form |
| `GriefScreeningForm.jsx` | PG-13 grief screening form |
| `ReminderModal.jsx` | Set reminder (day, time, note) |
| `ChatbotConsentModal.jsx` | HIPAA consent for chatbot use |
| `PasswordInput.jsx` | Password field with show/hide toggle |
| `PasswordStrength.jsx` | Password strength indicator |
| `FormFileUpload.jsx` | File upload with preview |
| `FileUpload.jsx` | Drag-and-drop file upload |

### Navigation & Layout
| Component | Purpose |
|---|---|
| `layout/Sidebar.jsx` | Collapsible sidebar with role-based nav items |
| `Breadcrumbs.jsx` | Path breadcrumb navigation |
| `KeyboardNav.jsx` | Keyboard navigation support for accessibility |
| `PageTransition.jsx` | Page entrance animation wrapper |

### Communication
| Component | Purpose |
|---|---|
| `ChatBot.jsx` | Conversational chatbot widget |
| `ChatSettings.jsx` | Chat preferences panel |
| `ContactCard.jsx` | Contact list item card |
| `ContactsTab.jsx` | Contacts tab panel |
| `AddContactModal.jsx` | Add new contact modal |

### Feedback & UX
| Component | Purpose |
|---|---|
| `AccessibilityPanel.jsx` | Font size, contrast, motion, screen reader settings |
| `AutoLogoffWarning.jsx` | HIPAA 15-min inactivity countdown overlay |
| `SignOutModal.jsx` | Confirm sign-out dialog |
| `UsabilityFeedback.jsx` | Star rating + comment widget |
| `CrisisInterventionOverlay.jsx` | Crisis support overlay |
| `OfflineIndicator.jsx` | "You're offline" banner |
| `LoadingSkeleton.jsx` | Shimmer loading placeholders |
| `EmptyState.jsx` | Empty list illustrations |
| `LoginSlideshow.jsx` | Login page rotating background slideshow |

### Touch & Mobile
| Component | Purpose |
|---|---|
| `TouchButton.jsx` | Mobile-optimised button with haptic feedback |
| `VoiceInput.jsx` | Voice transcription input field |
| `ResourceDownloadManager.jsx` | Offline resource download manager UI |

### Bereavement
| Component | Purpose |
|---|---|
| `GriefProgressTracker.jsx` | Grief stage timeline visualisation |

---

## 11. State Management & Context

| Context | File | What it provides |
|---|---|---|
| `AuthContext` | `context/AuthContext.jsx` | `user`, `token`, `isAuthenticated`, `login()`, `logout()`, `loading` |
| `AccessibilityContext` | `context/AccessibilityContext.jsx` | `settings` (fontSize, highContrast, reducedMotion, screenReader), `updateSetting()` |
| `AppSettingsContext` | `context/AppSettingsContext.jsx` | `theme`, `isDark`, `showAiWidgets`, `updateTheme()` |
| `CareSettingContext` | `context/CareSettingContext.jsx` | `careSetting`, `setCareSetting()`, care setting metadata |

**Server state:** All API data managed by `@tanstack/react-query` - queries with 30-second polling for live data (vitals, alerts, notifications).

---

## 12. Hooks & Utilities

### Hooks
| Hook | Purpose |
|---|---|
| `useIdleTimer` | Fires `onIdle` callback after 15 minutes, shows warning at 14 minutes - HIPAA compliance |
| `useVoiceControl` | Listens for voice commands via Web Speech API, navigates app hands-free |
| `useTouchSupport` | Initialises haptic feedback (navigator.vibrate) and Web Audio context |
| `useAnimations` | Provides AOS and Framer Motion animation helpers |

### Key Utilities
| Utility | Purpose |
|---|---|
| `offlineDataCache.js` | IndexedDB store with 24-hour TTL, per-store caching (13 stores) |
| `offlineClient.js` | Wraps every API call: online → axios; offline → IndexedDB cache |
| `touchSupport.js` | `haptic.light/medium/strong/success/error()`, `playSound.tap/click/notification()` via Web Audio API |
| `chatEncryption.js` | Client-side AES encryption for sensitive chat messages |
| `toast.jsx` | Extends react-hot-toast with `toast.success/error/info/warning()` |

---

## 13. Routing

Routing uses `react-router-dom` v7. Structure:

```
BrowserRouter
└── Routes
    ├── /login (public)
    ├── /register (public)
    ├── /setup → PersonalisationQuest (protected, no Layout)
    └── /* → ProtectedRoute → Layout
        └── (all app routes)
```

**Global overlays** rendered in `AppRoutes` regardless of route:
- `AuraChat` - teal AI companion (toggleable in Settings)
- `AIAssistant` - purple clinical assistant (toggleable in Settings)
- `AutoLogoffWarning` - HIPAA idle timer overlay

---

## 14. Offline Support

The app is designed to work offline for key read operations:

| Store | What's cached | TTL |
|---|---|---|
| `patients` | Patient list | 24h |
| `vitals` | Recent vitals | 24h |
| `medications` | Medication list | 24h |
| `symptoms` | Recent symptoms | 24h |
| `appointments` | Appointments | 24h |
| `alerts` | Active alerts | 24h |
| `assessments` | Assessment results | 24h |
| `caregivers` | Caregiver directory | 24h |
| `resources` | Educational resources | 24h |
| `community` | Community groups (live only, skip cache - joined state is user-specific) | - |
| `notifications` | Notification list | 24h |
| `predictions` | Risk predictions | 24h |
| `dashboard` | Dashboard summary | 24h |

Write operations (POST/PUT) are queued in `offlineStorage.js` and replayed when connectivity returns.

---

## 15. Authentication & Security

- **JWT tokens** signed with `SECRET_KEY` (HS256), 24-hour expiry
- **Bcrypt** password hashing via `passlib`
- **Account lockout** after 5 failed login attempts (`User.locked_until`)
- **HIPAA auto-logoff** at 15 minutes of inactivity (`useIdleTimer`)
- **Role-based access control** enforced on every backend endpoint
- **Audit trail** - every data access and mutation logged to `audit_logs`
- **Client-side encryption** for chat messages (`chatEncryption.js`)
- **CORS** configured in `main.py` for localhost development

---

## 16. Notifications & Alerts

Two parallel systems with different purposes:

### Alerts (`/api/alerts`) - Emergency
- Created by AI prediction engine when risk thresholds are crossed
- Severities: `low`, `medium`, `high`, `critical`
- Shown in `RealTimeAlerts` header component with red badge
- Critical alerts trigger browser toast notifications
- Clinicians must acknowledge each alert

### Notifications (`/api/notifications`) - Routine
- Created by `NotificationService` background monitor
- Types: `appointment_reminder_24h`, `appointment_reminder_1h`, `medication_reminder`, `medication_missed`, `new_message`, `community_post`, `high_risk`, `report_available`
- Shown in `NotificationCenter` header component with categorised dropdown
- Mark as read individually or bulk

---

## 17. Community & Chat Systems

### Community Support Groups (`/api/community`)

- 50 seeded condition-specific groups (pain, cancer, HIV, spiritual, counselling, Ghana-specific)
- Each group has `image_url`, `condition_tags`, `member_count`, `created_by`
- Posts are anonymised - display name shows `"Kofi · Cancer Journey"` not real name
- Posts max 280 characters
- Reactions: 🙏 pray, ❤️ heart, 💪 strong
- Flagging → admin moderation
- Groups have 3 tab categories: Support / Counselling / Spiritual Care
- Frontend: `CommunityHub.jsx` (listing) + `CommunityGroupPage.jsx` (full-screen chat)

### Real-Time Messaging (`/api/messaging`)

- Private 1:1 conversations between users
- Group conversations (multiple participants)
- File attachments (images, documents, audio)
- Read receipts + emoji reactions
- Frontend: `Messages.jsx` - WhatsApp-style layout

### AI Chatbot (`/api/chatbot` + `/api/conversational-chatbot`)

- Two separate chatbots with different purposes:
  - `chatbot` - Navigation-focused: helps users find pages, look up clinical data
  - `conversational-chatbot` - Emotional companion: full LLM with crisis detection
- Consent required before use (HIPAA)
- Crisis detection escalates to care team
- Chat messages optionally encrypted client-side

---

## 18. Legacy & Bereavement System

### Digital Legacy Planning
Patient designates heirs and creates posthumous content:
1. **Legacy Setup** (`/legacy-setup`) - consent, sharing permissions, witness designation
2. **Content Creator** (`/legacy-content`) - write letters, record audio/video messages, set delivery triggers
3. **Heir Management** (`/heir-management`) - assign heirs with access levels
4. **Heir Access** (`/my-legacy-access`) - heirs view their designated access after patient death

### Bereavement Support (`/continuity-bridge`)
For family members after patient death:
- **Grief Journal** - private entries with mood tracking
- **PG-13 Screening** - Prolonged Grief Disorder screening tool
- **Post-Death Schedule** - structured support touchpoints at 1 week, 1 month, 3 months, 6 months
- **Support Resources** - Ghana-specific grief counselling contacts

---

## 19. Data Relationships

```
User (1) ──────────────────── (many) Patient via PatientFamilyLink
User (1) ──────────────────── (many) CaregiverAssignment → Patient
Patient (1) ────────────────── (many) Vital
Patient (1) ────────────────── (many) Symptom
Patient (1) ────────────────── (many) Medication → MedicationAdherenceLog
Patient (1) ────────────────── (many) Appointment
Patient (1) ────────────────── (1) CarePlan → CarePlanGoal → CarePlanChecklistItem
                                               └─→ CarePlanIntervention
Patient (1) ────────────────── (many) ESASAssessment
Patient (1) ────────────────── (many) PPSAssessment
Patient (1) ────────────────── (many) Prediction → PredictionFeedback
Patient (1) ────────────────── (many) Alert
Patient (1) ────────────────── (many) PatientJourneyEvent
Patient (1) ────────────────── (many) PatientCareSetting
Patient (1) ────────────────── (1) PatientPreferences
Patient (1) ────────────────── (many) LegacyHeir → User (heir)
Patient (1) ────────────────── (many) LegacyContent
Patient (1) ────────────────── (1) LegacyConsent
User (1) ───────────────────── (many) ChatbotSession → ChatbotMessage
User (1) ───────────────────── (many) ConversationParticipant → Conversation → Message
User (1) ───────────────────── (many) CommunityMembership → CommunityGroup
CommunityGroup (1) ──────────── (many) CommunityPost
User (1) ───────────────────── (many) AuditLog
User (1) ───────────────────── (many) NotificationQueue
User (1) ───────────────────── (many) ResourceBookmark → Resource
```

---

## 20. Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.6 | UI framework |
| Vite | 8.0.12 | Build tool & dev server |
| Tailwind CSS | 4.3.0 | Utility-first CSS |
| Framer Motion | 12.40.0 | Animations and transitions |
| TanStack Query | 5.100.14 | Server state, caching, polling |
| Axios | 1.16.1 | HTTP client with JWT interceptors |
| React Router DOM | 7.16.0 | Client-side routing |
| React Hook Form | 7.77.0 | Form state management |
| React Hot Toast | 2.6.0 | Toast notification system |
| Recharts | 3.8.1 | Charts (LineChart, RadarChart, BarChart) |
| Lucide React | 1.17.0 | Icon library |
| Headless UI | 2.2.10 | Accessible primitives (dropdowns, modals) |
| idb | 8.0.3 | IndexedDB wrapper for offline cache |
| AOS | 2.3.4 | Animate On Scroll |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.111.0 | Web framework |
| Uvicorn | 0.29.0 | ASGI server |
| SQLAlchemy | 2.0.30 | ORM + query builder |
| Pydantic | 2.7.1 | Request/response validation |
| python-jose | 3.3.0 | JWT creation and verification |
| passlib[bcrypt] | 1.7.4 | Password hashing |
| XGBoost | 2.0.3 | Risk prediction ML models |
| SHAP | 0.45.1 | Model explainability |
| scikit-learn | 1.4.2 | Feature engineering + preprocessing |
| VaderSentiment | 3.3.2 | Sentiment analysis |
| NumPy | 1.26.4 | Numerical computing |
| joblib | 1.4.2 | Model serialisation |
| python-dotenv | 1.0.1 | Environment variable loading |
| Pillow | 10.3.0 | Image processing |
| bleach | 6.1.0 | HTML sanitisation |

### Optional LLM Integrations
| Integration | Env Variable | Model |
|---|---|---|
| Groq | `GROQ_API_KEY` | llama3-8b-8192 |
| Anthropic | `ANTHROPIC_API_KEY` | claude-3-haiku |
| Ollama (local) | `OLLAMA_BASE_URL` | llama3.2:latest |
| Self-hosted | *(always available)* | Aura AI Engine (TF-IDF + rules) |

### Database
| Technology | Purpose |
|---|---|
| SQLite | Default development database (`aura.db`) |
| PostgreSQL | Supported via `DATABASE_URL` change (production) |

### AI/ML Pipeline (training)
| Package | Purpose |
|---|---|
| pandas | Data manipulation |
| scikit-learn | Preprocessing, cross-validation |
| xgboost | Gradient boosted trees |
| shap | SHAP value computation |
| optuna | Hyperparameter tuning |
| lifelines | Survival analysis |
| faker | Synthetic training data generation |

---

## 21. Environment Variables

File: `backend/.env` (copy from `.env.example`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./aura.db` | DB connection string |
| `SECRET_KEY` | `change-in-production` | JWT signing secret |
| `DEBUG` | `True` | Debug mode |
| `ENVIRONMENT` | `development` | Environment name |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | JWT expiry (24h) |
| `API_HOST` | `0.0.0.0` | Uvicorn bind host |
| `API_PORT` | `8000` | Uvicorn port |
| `GROQ_API_KEY` | *(empty)* | Optional: Groq LLM |
| `ANTHROPIC_API_KEY` | *(empty)* | Optional: Anthropic Claude |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Optional: local Ollama |
| `OLLAMA_MODEL` | `llama3.2:latest` | Ollama model name |

---

## 22. Development Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- XAMPP (or any web server - only used as project root, not for serving)

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env - set SECRET_KEY at minimum
python seed_medical_db.py      # seed medical knowledge
python seed_community_groups.py # seed 50 community groups
python seed_all_data.py         # optional: seed full demo data
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### Seeded Test Accounts
| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | admin |
| `clinician` | `clinician123` | clinician |
| `caregiver` | `caregiver123` | caregiver |
| `patient` | `patient123` | patient |
| `family` | `family123` | family |

### ACE Launcher
The `ace.exe` / `ace.py` launcher in the project root starts both backend and frontend simultaneously:
```bash
# Windows
ace.exe
# or
python ace.py
```

---

*Document generated: June 2026 - Project Aura v1.0*
