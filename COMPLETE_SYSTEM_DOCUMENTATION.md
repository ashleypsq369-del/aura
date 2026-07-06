# 📋 ProjectAura - COMPLETE System Documentation

**Date**: June 5, 2026  
**Version**: 2.0.0 (COMPREHENSIVE)  
**Status**: ✅ Production Ready

---

## 🎯 Executive Summary

**ProjectAura** is a comprehensive, AI-powered palliative care management platform specifically designed for Ghana's healthcare system. It provides holistic end-of-life care support spanning clinical management, patient wellbeing, family support, digital legacy planning, and bereavement care.

### **Core Mission**
- Improve quality of life for palliative care patients
- Support families through difficult journeys
- Empower healthcare workers with intelligent tools
- Preserve legacies and memories
- Bridge the gap between clinical care and human compassion

### **Target Users**
- 🏥 **Clinicians**: Doctors, nurses, palliative care specialists
- 👤 **Patients**: Individuals receiving palliative care
- 👨‍👩‍👧 **Family Members**: Loved ones providing support
- 🩺 **Caregivers**: Professional home care providers
- 🔧 **Administrators**: System managers and data analysts

---

## 📑 Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Database Schema (Complete)](#database-schema)
4. [All Features & Modules](#all-features--modules)
5. [User Roles & Permissions](#user-roles--permissions)
6. [API Endpoints (All 30+ Routers)](#api-endpoints)
7. [Frontend Components & Pages](#frontend-components--pages)
8. [Data Flows & Relationships](#data-flows--relationships)
9. [Background Services](#background-services)
10. [AI & Intelligence Systems](#ai--intelligence-systems)
11. [Clinical Assessment Tools](#clinical-assessment-tools)
12. [Digital Legacy System](#digital-legacy-system)
13. [Bereavement & Memory Support](#bereavement--memory-support)
14. [Community & Peer Support](#community--peer-support)
15. [Educational Resources](#educational-resources)
16. [Messaging & Communication](#messaging--communication)
17. [Notifications & Alerts](#notifications--alerts)
18. [Journey Tracking](#journey-tracking)
19. [Accessibility Features](#accessibility-features)
20. [Security & Compliance](#security--compliance)
21. [Testing & Quality Assurance](#testing--quality-assurance)
22. [Deployment & Configuration](#deployment--configuration)

---

## 🏗️ System Architecture

### **Three-Tier Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│                       (React Frontend)                           │
├─────────────────────────────────────────────────────────────────┤
│  • 50+ Page Components                                          │
│  • 35+ Reusable Components                                      │
│  • Real-time UI Updates                                         │
│  • Responsive Design (Mobile/Tablet/Desktop)                    │
│  • Accessibility-First (WCAG 2.1 AA)                           │
│  • Multi-language Support (English, Twi, Ga, Ewe, etc.)        │
└──────────────────────┬──────────────────────────────────────────┘
                       │ REST API / HTTP
                       │ (JSON Communication)
┌──────────────────────▼──────────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│                      (FastAPI Backend)                           │
├─────────────────────────────────────────────────────────────────┤
│  • 30+ API Routers                                              │
│  • Business Logic Services                                      │
│  • AI/ML Processing                                             │
│  • Background Task Workers                                      │
│  • Notification Engine                                          │
│  • Journey Tracker                                              │
│  • Authentication & Authorization (JWT)                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │ SQLAlchemy ORM
                       │ (Database Abstraction)
┌──────────────────────▼──────────────────────────────────────────┐
│                      DATA LAYER                                  │
│                    (PostgreSQL Database)                         │
├─────────────────────────────────────────────────────────────────┤
│  • 40+ Tables                                                   │
│  • Relational Data Model                                        │
│  • JSON Fields for Flexibility                                 │
│  • Full-Text Search                                             │
│  • Transaction Management                                       │
│  • Audit Logging                                                │
└─────────────────────────────────────────────────────────────────┘
```

### **System Flow Overview**

```
User Action → Frontend Component → API Request → Backend Router
     ↓                                                ↓
React State Update                           Business Logic
     ↓                                                ↓
UI Re-render ← Response ← JSON ← Database Operation
```

---


## 💻 Technology Stack

### **Frontend Technologies**
```yaml
Core Framework: React 18
Build Tool: Vite 4
Routing: React Router v6
State Management: TanStack Query (React Query v4)
HTTP Client: Axios
Styling: Tailwind CSS 3
Animations: Framer Motion
Icons: Lucide React
Notifications: React Hot Toast
Forms: Native React + Validation
File Uploads: HTML5 + FormData
Charts: Recharts (for dashboards)
Voice: Web Speech API
Touch: React Touch Events
```

### **Backend Technologies**
```yaml
Framework: FastAPI 0.100+
Language: Python 3.9+
ORM: SQLAlchemy 2.0
Database: PostgreSQL 14+
Authentication: JWT (python-jose)
Password Hashing: Bcrypt
Validation: Pydantic v2
CORS: FastAPI Middleware
Background Tasks: AsyncIO
API Documentation: OpenAPI (Swagger)
```

### **AI & Intelligence**
```yaml
LLM Integration: Anthropic Claude API
ML Models: XGBoost (Risk Prediction)
NLP: Text Analysis, Sentiment Detection
Personalization: Recommendation Engine
```

### **Infrastructure**
```yaml
Web Server: Uvicorn (ASGI)
Reverse Proxy: Nginx (Production)
File Storage: Local Filesystem / S3-compatible
Environment: Python venv / Docker
CI/CD: Git-based workflows
```

---

## 🗄️ Database Schema (Complete)

### **40+ Database Tables Organized by Category**

#### **1. Core User Management (4 tables)**


**COMPLETE FEATURE INVENTORY**: See `COMPREHENSIVE_FEATURES_LIST.md` for detailed breakdown of all 52+ major feature systems.

```sql
users (id, username, email, hashed_password, role, full_name, phone, 
       is_active, consent_given, created_at, last_login, failed_logins, locked_until)

user_profiles (id, user_id FK, avatar_initials, department, license_number,
               specialisation, facility_name, region, language_pref, 
               notification_email, notification_sms)

patients (id, patient_code, full_name, date_of_birth, gender, ghana_card_number,
          nhis_number, phone, address, region, district, facility_name,
          primary_diagnosis, secondary_diagnoses, admission_date, status,
          care_pathway, primary_clinician_id FK, risk_score, risk_level,
          last_assessment, deceased_at, preferred_language, religious_preference,
          advance_directive, dnr_status, emergency_contact_*, created_at, updated_at)

patient_family_links (id, patient_id FK, family_user_id FK, relationship,
                      is_primary_contact, emergency_contact, created_at)
```

#### **2. Clinical Data (10 tables)**
```sql
vitals (id, patient_id FK, recorded_by FK, recorded_at, heart_rate,
        blood_pressure_sys, blood_pressure_dia, oxygen_saturation, temperature,
        respiratory_rate, weight_kg, blood_glucose, source, notes, 
        is_flagged, flag_reason)

symptoms (id, patient_id FK, recorded_by FK, recorded_at, pain_level,
          pain_location, fatigue, fatigue_level, nausea, nausea_level,
          anxiety, anxiety_level, depression_level, appetite_level,
          sleep_quality, breathlessness, constipation, confusion, mood_notes, notes)

medications (id, patient_id FK, prescribed_by FK, name, generic_name, dose, unit,
             frequency, route, indication, start_date, end_date, is_prn,
             prn_max_dose, is_active, discontinued_at, discontinued_by FK,
             discontinue_reason, special_instructions, created_at)

medication_adherence_logs (id, medication_id FK, patient_id FK, scheduled_at,
                           taken_at, taken, skipped_reason, logged_by FK)

appointments (id, patient_id FK, clinician_id FK, created_by FK, appointment_type,
              scheduled_at, duration_minutes, location, location_detail, status,
              notes, reminder_sent, cancelled_at, cancel_reason, completed_at,
              completion_notes, created_at)

care_plans (id, patient_id FK, created_by FK, version, is_current,
            goals_of_care, pain_management_plan, psychological_support,
            spiritual_care, family_support_plan, advance_directives_notes,
            bereavement_plan, review_date, created_at, updated_at)

clinical_notes (id, patient_id FK, author_id FK, note_type, content,
                is_private, created_at, updated_at)

caregiver_assignments (id, patient_id FK, caregiver_id FK, assigned_at,
                       assigned_by FK, active, notes)

functional_assessments (id, patient_id FK, assessed_by FK, assessed_at,
                        pps_*, esas_*, notes)

predictions (id, patient_id FK, predicted_at, care_pathway, risk_score,
             risk_level, confidence, shap_values, feature_values,
             plain_explanation, model_version, triggered_by)
```

#### **3. Clinical Assessment Tools (12 tables)**
```sql
esas_assessments (id, patient_id FK, assessed_by FK, assessed_at,
                  pain, tiredness, drowsiness, nausea, lack_of_appetite,
                  depression, anxiety, shortness_of_breath, wellbeing,
                  other_symptom_name, other_symptom_score, completed_by_proxy,
                  proxy_relationship, notes)

pps_assessments (id, patient_id FK, assessed_by FK, assessed_at, pps_score,
                 ambulation, activity_disease, self_care, oral_intake,
                 consciousness, notes)

cognitive_assessments (id, patient_id FK, assessed_by FK, assessed_at,
                       assessment_type, mmse_*, moca_*, interpretation,
                       patient_education_years, notes)

phq9_assessments (id, patient_id FK, assessed_by FK, assessed_at,
                  9 depression questions, total_score, severity, difficulty_level)

gad7_assessments (id, patient_id FK, assessed_by FK, assessed_at,
                  7 anxiety questions, total_score, severity, difficulty_level)

barthel_assessments (id, patient_id FK, assessed_by FK, assessed_at,
                     10 ADL items, total_score, independence_level, notes)

pain_assessments (id, patient_id FK, assessed_by FK, assessed_at,
                  pain_worst, pain_least, pain_average, pain_current,
                  pain_location, pain_type, interference_*, current_medications,
                  medication_effectiveness, notes)

qol_assessments (id, patient_id FK, assessed_by FK, assessed_at,
                 physical_*, social_*, emotional_*, functional_* questions,
                 scores, total_score, notes)

caregiver_burden_assessments (id, patient_id FK, caregiver_id FK, assessed_at,
                               12 burden questions, total_score, burden_level,
                               needs_respite_care, needs_support_group,
                               needs_counseling, notes)

motor_skills_assessments (id, patient_id FK, assessed_by FK, assessed_at,
                          grip_strength_*, tug_time_seconds, tug_assistance_used,
                          tug_fall_risk, gait_speed_*, balance_test_*,
                          recommendations, notes)

# Plus 2 more assessment tables
```

#### **4. Alerts & Notifications (2 tables)**
```sql
alerts (id, patient_id FK, alert_type, severity, triggered_value,
        threshold_value, message, is_acknowledged, acknowledged_by FK,
        acknowledged_at, is_dismissed, created_at, vital_id FK)

notification_queue (id, recipient_id FK, notification_type, title, body,
                    related_alert_id, is_sent, sent_at, is_read, read_at, created_at)
```

#### **5. Digital Legacy System (4 tables)**
```sql
legacy_consents (id, patient_id FK, consent_given, consent_date,
                 witnessed_by_user_id FK, witness_signature, share_medical_records,
                 share_memories, share_journal, share_messages, share_photos,
                 follows_hipaa, follows_gdpr, follows_local_law,
                 legal_document_path, can_be_revoked, revoked_at,
                 revocation_reason, created_at, updated_at)

legacy_heirs (id, patient_id FK, heir_user_id FK, heir_type, relationship,
              access_level, can_access_private, designated_at, activated_at,
              is_active, notes_from_patient)

legacy_content (id, patient_id FK, content_type, title, content, media_path,
                media_type, recipient_type, recipient_heir_id FK,
                recipient_user_id FK, delivery_trigger, delivery_date,
                is_delivered, delivered_at, created_at, updated_at)

bereavement_entries (id, patient_id FK, user_id FK, entry_type, content,
                     prompt_used, media_path, sentiment_score, grief_stage_hint,
                     is_private, created_at)
```

#### **6. Community & Social (3 tables)**
```sql
community_groups (id, name, description, condition_tags JSON, member_count,
                  is_active, created_at)

community_memberships (id, user_id FK, group_id FK, joined_at, is_active)

community_posts (id, group_id FK, author_id FK, display_name, content,
                 reactions JSON, flag_count, is_hidden, is_moderated, created_at)
```

#### **7. Educational Resources (3 tables)**
```sql
resources (id, title, category, format, language, summary, content, media_url,
           duration_minutes, author, source, condition_tags JSON, topic_tags JSON,
           is_ghana_specific, is_published, view_count, helpful_count, created_at)

resource_bookmarks (id, user_id FK, resource_id FK, created_at)

resource_feedback (id, user_id FK, resource_id FK, helpful, created_at)
```

#### **8. Messaging (3 tables)**
```sql
conversations (id, title, is_group, created_by FK, created_at)

conversation_participants (id, conversation_id FK, user_id FK, joined_at)

messages (id, conversation_id FK, sender_id FK, message, is_read, created_at)
```

#### **9. AI & Chatbot (2 tables)**
```sql
chatbot_sessions (id, user_id FK, patient_context_id FK, started_at, ended_at,
                  message_count, escalated, escalation_reason)

chatbot_messages (id, session_id FK, role, content, intent_detected,
                  sentiment_score, crisis_flagged, created_at)
```

#### **10. Journey & Audit (2 tables)**
```sql
patient_journey_events (id, patient_id FK, event_type, event_title, event_detail,
                        clinical_note, is_milestone, created_by FK, created_at)

audit_logs (id, user_id FK, user_role, action, resource_type, resource_id,
            patient_id FK, success, details JSON, created_at)
```

#### **11. Patient Preferences (1 table)**
```sql
patient_preferences (id, user_id FK, patient_id FK, 
                     # Step 1-7 questionnaire fields
                     language_pref, info_style, tech_comfort, diagnosis_duration,
                     emotional_states JSON, physical_symptoms JSON, activity_level,
                     self_care_level, mood_score, coping_strategies JSON,
                     future_worry_level, religious_background, spiritual_importance,
                     wants_spiritual_care, main_support_person, social_connectedness,
                     wants_peer_connection, content_preferences JSON, info_frequency,
                     wants_community, topic_interests JSON, questionnaire_complete,
                     completed_at, last_updated)
```

---

## 🎯 All Features & Modules

**See `COMPREHENSIVE_FEATURES_LIST.md` for complete detailed breakdown.**

### **Quick Feature Summary (52 Major Systems)**

1. Patient Management
2. Vital Signs Monitoring  
3. Medication Management
4. Symptoms Tracking
5. Clinical Assessments (12 tools)
6. Appointments
7. Care Plans
8. Alerts System 🚨
9. Clinical Notes
10. Intelligent Care (AI)
11-18. Patient & Family Features
19-22. Communication & Social
23-25. Education & Resources
26-28. Caregiver Support
29-32. AI & Chatbot
33-35. Reporting & Analytics
36-40. Admin & System Management
41-48. Accessibility Features
49-52. Responsive Design & UX

---

## 👥 User Roles & Permissions Matrix

| Feature/Action | Patient | Family | Caregiver | Clinician | Admin |
|----------------|---------|--------|-----------|-----------|-------|
| **View Own Data** | ✅ Full | ❌ | ❌ | ✅ | ✅ |
| **View Patients** | Own Only | Linked | Assigned | All | All |
| **Record Vitals** | Self | ❌ | ✅ | ✅ | ✅ |
| **Prescribe Meds** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **View Alerts** 🚨 | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Receive Notifs** 🔔 | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Clinical Assessments** | ❌ | ❌ | Some | ✅ | ✅ |
| **Care Plans** | View | View | View | Edit | Edit |
| **Digital Legacy** | Create | View (if heir) | ❌ | Witness | ✅ |
| **Community Posts** | ✅ | ✅ | ✅ | ✅ | ✅ Moderate |
| **User Management** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Audit Logs** | ❌ | ❌ | ❌ | Limited | ✅ Full |
| **AI Insights** | ❌ | ❌ | Limited | ✅ | ✅ |
| **Journey Timeline** | Own | Linked | Assigned | All | All |
| **Educational Resources** | ✅ | ✅ | ✅ | ✅ | ✅ Edit |

---

**STATUS: Documentation comprehensive. See COMPREHENSIVE_FEATURES_LIST.md for full details of all 52+ systems.**

**Remaining sections available in subsequent documentation pages for: API Endpoints (200+), Data Flows, Background Services, Complete User Flows, etc.**


## 📋 COMPLETE FEATURE DOCUMENTATION

### **🏥 CLINICAL MANAGEMENT FEATURES (Detailed)**

#### **1. Patient Management System**

**Purpose**: Complete lifecycle management of palliative care patients

**Features**:
- **Patient Registration**:
  - Full demographic information (name, DOB, gender, contact)
  - Ghana-specific: NHIS number, Ghana Card number
  - Address with region & district
  - Facility assignment
  - Patient code generation (unique identifier)

- **Clinical Information**:
  - Primary diagnosis (free text + categorization)
  - Secondary diagnoses (multiple conditions)
  - Care pathway assignment (cancer, cardiac, renal, respiratory, liver, HIV/AIDS, general palliative)
  - Admission date tracking
  - Religious preference for spiritual care
  
- **Advance Care Planning**:
  - Advance directive flag
  - DNR (Do Not Resuscitate) status
  - Legal document storage
  
- **Emergency Contacts**:
  - Name, relationship, phone number
  - Multiple contacts supported via family links
  
- **Status Management**:
  - Active, Critical, Inactive, Discharged, Deceased
  - Status change tracking with timestamps
  - Deceased date recording for legacy activation
  
- **Risk Assessment**:
  - AI-generated risk score (0-100)
  - Risk level classification (low, moderate, high, critical)
  - Last assessment date tracking
  - Automated re-assessment triggers

**Database Table**: `patients`
**API Endpoints**: 
- GET `/api/patients` - List all patients
- GET `/api/patients/{id}` - Get patient details
- POST `/api/patients` - Create new patient
- PUT `/api/patients/{id}` - Update patient
- DELETE `/api/patients/{id}` - Soft delete

**Access Control**:
- Clinicians: Full access to all patients
- Caregivers: Access to assigned patients only
- Family: Access to linked patient only
- Patients: Access to own record only
- Admin: Full system access

**Related Systems**: Vitals, Medications, Appointments, Assessments, Journey Timeline, Alerts

---

#### **2. Vital Signs Monitoring**

**Purpose**: Track patient physiological parameters with automated alerting

**Vital Signs Tracked**:
- **Heart Rate** (bpm): Normal 60-100, Alert if <50 or >120
- **Blood Pressure**: Systolic/Diastolic (mmHg), Alert if sys >180 or <90
- **Oxygen Saturation** (%): CRITICAL if <90%
- **Temperature** (°C): Alert if >38.5° or <35°
- **Respiratory Rate** (breaths/min): Normal 12-20
- **Weight** (kg): Trend tracking for nutrition assessment
- **Blood Glucose** (mg/dL): For diabetic patients

**Features**:
- **Manual Entry**: Caregiver/clinician records vitals
- **Device Integration Ready**: Source field for future IoT devices
- **Automated Flagging**: Abnormal values automatically flagged
- **Flag Reasons**: Explains why value is concerning
- **Historical Trends**: Chart vitals over time
- **Critical Alerts**: Triggers real-time alerts for abnormal values
- **Notes**: Contextual information (e.g., "patient just exercised")

**Alert Thresholds** (Configurable):
```
Oxygen Saturation: < 90% → CRITICAL ALERT
Heart Rate: < 50 or > 120 → HIGH ALERT
Blood Pressure Systolic: > 180 or < 90 → HIGH ALERT
Temperature: > 38.5°C or < 35°C → MEDIUM ALERT
```

**Workflow**:
1. Caregiver/Clinician records vitals
2. System checks against thresholds
3. If abnormal → Creates Alert in `alerts` table
4. Alert monitoring loop detects (30 sec)
5. Notification sent to clinical team
6. Clinician reviews and takes action
7. Journey event logged

**Database Table**: `vitals`
**API Endpoints**:
- POST `/api/vitals` - Record new vitals
- GET `/api/vitals/{patient_id}` - Get patient vitals history
- GET `/api/vitals/{patient_id}/latest` - Get most recent vitals
- GET `/api/vitals/{id}` - Get specific vital record

**Integration**: 
- Triggers alerts system
- Feeds AI risk prediction
- Updates journey timeline
- Influences care recommendations

---

#### **3. Medication Management**

**Purpose**: Complete medication lifecycle from prescription to adherence tracking

**Medication Information**:
- **Name**: Brand/generic medication name
- **Dose**: Amount (e.g., "100mg", "5ml")
- **Unit**: mg, ml, tablets, etc.
- **Frequency**: "once daily", "twice daily", "every 4 hours", "every 6 hours"
- **Route**: Oral, IV, topical, subcutaneous, inhalation, rectal, sublingual
- **Indication**: Why medication is prescribed
- **Start Date**: When medication begins
- **End Date**: When medication stops (NULL for ongoing)
- **PRN Status**: As-needed vs scheduled
- **PRN Max Dose**: Maximum frequency for PRN medications
- **Special Instructions**: Taking with food, timing, etc.

**Features**:
- **Prescription Management**:
  - Prescriber tracking (clinician who ordered)
  - Active/inactive status
  - Discontinuation tracking with reason
  - Date-based automatic stopping
  
- **Medication Reminders**:
  - 15-minute advance reminders
  - Scheduled dose notifications
  - Smart frequency parsing ("twice daily" → specific times)
  
- **Adherence Tracking**:
  - Scheduled vs actual dose times
  - Taken/not taken logging
  - Reason for skipping
  - Missed dose detection (30 min after scheduled)
  - Adherence rate calculation
  
- **Safety Features**:
  - Drug interaction checking (future)
  - Allergy alerts (future)
  - Duplicate medication warnings

**Notification Schedule Examples**:
```
Medication: Morphine 10mg every 4 hours
Schedule: 06:00, 10:00, 14:00, 18:00, 22:00, 02:00

Reminders sent:
- 05:45, 09:45, 13:45, 17:45, 21:45, 01:45 (15 min before)

If not logged by:
- 06:30, 10:30, 14:30, 18:30, 22:30, 02:30 → Missed dose alert
```

**Workflow**:
1. Clinician prescribes medication
2. Medication added to patient record
3. System calculates dose schedule
4. Notification monitoring loop (5 min) checks schedule
5. 15 min before dose → Sends reminder notification
6. Patient/caregiver logs dose taken (or not)
7. If not logged 30 min after → Missed dose notification
8. Adherence logged in `medication_adherence_logs`
9. Journey event created

**Database Tables**: 
- `medications` - Prescription information
- `medication_adherence_logs` - Dose-by-dose tracking

**API Endpoints**:
- POST `/api/medications` - Create prescription
- GET `/api/medications?patient_id={id}` - Get patient medications
- PUT `/api/medications/{id}` - Update medication
- DELETE `/api/medications/{id}` - Discontinue
- POST `/api/medications/{id}/log-adherence` - Log dose taken

---

#### **4. Symptoms Tracking**

**Purpose**: Monitor and trend patient-reported and observed symptoms

**Symptoms Tracked**:
- **Pain**:
  - Level (0-10 scale)
  - Location (body part)
  - Type (sharp, dull, burning, etc.)
  
- **Fatigue**: Boolean + level (0-10)
- **Nausea**: Boolean + level (0-10)
- **Anxiety**: Boolean + level (0-10)
- **Depression**: Level (0-10)
- **Appetite**: Level (0-10, 0=no appetite, 10=excellent)
- **Sleep Quality**: Level (0-10)
- **Breathlessness**: Level (0-10)
- **Constipation**: Boolean
- **Confusion**: Boolean
- **Mood Notes**: Free text for context

**Features**:
- Patient self-reporting via portal
- Caregiver/clinician observation entry
- Temporal tracking (symptoms over time)
- Correlation analysis (symptom relationships)
- Trend alerts (worsening patterns)
- Integration with ESAS assessments

**Workflow**:
1. Patient reports symptoms via portal OR caregiver observes
2. Symptoms recorded with timestamp
3. System analyzes trends
4. If significant change → Alert to clinician
5. Journey event logged
6. Influences care plan adjustments

**Database Table**: `symptoms`
**API Endpoints**:
- POST `/api/symptoms` - Record symptoms
- GET `/api/symptoms/{patient_id}` - Get symptom history
- GET `/api/symptoms/{patient_id}/latest` - Most recent

---

#### **5. Clinical Assessments (12 Validated Tools)**

**Purpose**: Standardized clinical measurement tools for comprehensive patient assessment


**A. ESAS (Edmonton Symptom Assessment System)**
- **Purpose**: Gold standard for palliative symptom assessment
- **9 Core Symptoms** (0-10 scale each):
  1. Pain (0=none, 10=worst possible)
  2. Tiredness
  3. Drowsiness
  4. Nausea
  5. Lack of Appetite
  6. Depression
  7. Anxiety
  8. Shortness of Breath
  9. Wellbeing (0=best, 10=worst)
- **Optional 10th Symptom**: Patient-defined
- **Proxy Support**: Can be completed by family if patient unable
- **Scoring**: Individual scores + total score
- **Frequency**: Daily to weekly depending on care stage
- **Database Table**: `esas_assessments`

**B. PPS (Palliative Performance Scale)**
- **Purpose**: Functional status assessment (0-100% in 10% increments)
- **Domains Assessed**:
  - Ambulation (bed-bound to fully ambulatory)
  - Activity & Disease extent
  - Self-Care ability
  - Oral Intake
  - Level of Consciousness
- **Scoring**: 0% (death) to 100% (full function)
- **Uses**: Prognosis estimation, care planning, staffing decisions
- **Frequency**: Weekly or with status changes
- **Database Table**: `pps_assessments`

**C. MMSE & MoCA (Cognitive Assessments)**
- **MMSE (Mini-Mental State Examination)**:
  - Orientation to time (5 points)
  - Orientation to place (5 points)
  - Registration (3 points)
  - Attention & Calculation (5 points)
  - Recall (3 points)
  - Language (8 points)
  - Visual Construction (1 point)
  - **Total**: 30 points (≥24 = normal)
  
- **MoCA (Montreal Cognitive Assessment)**:
  - More sensitive than MMSE
  - Visuospatial/Executive (5 points)
  - Naming (3 points)
  - Attention (6 points)
  - Language (3 points)
  - Abstraction (2 points)
  - Delayed Recall (5 points)
  - Orientation (6 points)
  - +1 if ≤12 years education
  - **Total**: 30 points (≥26 = normal)
  
- **Database Table**: `cognitive_assessments`

**D. PHQ-9 (Depression Screening)**
- **9 Questions** (0-3 scale each):
  - Little interest or pleasure
  - Feeling down, depressed, hopeless
  - Sleep troubles
  - Feeling tired
  - Appetite changes
  - Feeling bad about self
  - Trouble concentrating
  - Moving slowly or fidgety
  - Thoughts of self-harm
- **Scoring**:
  - 0-4: Minimal depression
  - 5-9: Mild depression
  - 10-14: Moderate depression
  - 15-19: Moderately severe
  - 20-27: Severe depression
- **Action**: Score ≥10 → Consider treatment
- **Database Table**: `phq9_assessments`

**E. GAD-7 (Anxiety Screening)**
- **7 Questions** (0-3 scale each):
  - Feeling nervous, anxious
  - Can't stop worrying
  - Worrying too much
  - Trouble relaxing
  - Being restless
  - Easily annoyed
  - Feeling afraid
- **Scoring**:
  - 0-4: Minimal anxiety
  - 5-9: Mild anxiety
  - 10-14: Moderate anxiety
  - 15-21: Severe anxiety
- **Database Table**: `gad7_assessments`

**F. Barthel Index (Activities of Daily Living)**
- **10 ADL Items** (scored 0-100 total):
  1. Feeding (0, 5, 10)
  2. Bathing (0, 5)
  3. Grooming (0, 5)
  4. Dressing (0, 5, 10)
  5. Bowel Control (0, 5, 10)
  6. Bladder Control (0, 5, 10)
  7. Toilet Use (0, 5, 10)
  8. Transfers (0, 5, 10, 15)
  9. Mobility (0, 5, 10, 15)
  10. Stairs (0, 5, 10)
- **Interpretation**:
  - 0-20: Total dependence
  - 21-60: Severe dependence
  - 61-90: Moderate dependence
  - 91-99: Slight dependence
  - 100: Fully independent
- **Database Table**: `barthel_assessments`

**G. Brief Pain Inventory**
- **Pain Severity** (0-10 each):
  - Worst pain in last 24h
  - Least pain in last 24h
  - Average pain
  - Pain right now
- **Pain Characteristics**:
  - Location (body map)
  - Type (sharp, dull, burning, etc.)
- **Pain Interference** (0-10 each):
  - General activity
  - Mood
  - Walking ability
  - Normal work
  - Relations with others
  - Sleep
  - Enjoyment of life
- **Current Management**:
  - Medications listed
  - Effectiveness rating
- **Database Table**: `pain_assessments`

**H. Quality of Life Assessment (FACT-G style)**
- **4 Domains**:
  1. **Physical Wellbeing** (7 items, 0-4 each)
  2. **Social/Family Wellbeing** (7 items, 0-4 each)
  3. **Emotional Wellbeing** (6 items, 0-4 each)
  4. **Functional Wellbeing** (7 items, 0-4 each)
- **Total Score**: 0-108 (higher = better QoL)
- **Database Table**: `qol_assessments`

**I. Zarit Burden Interview (Caregiver Burden)**
- **12 Questions** (0-4 scale):
  - Need more time for self
  - Feeling stressed
  - Feeling angry
  - Relationship strain
  - Feeling strained
  - Health suffered
  - Lack of privacy
  - Social life suffered
  - Lost control
  - Uncertain about care
  - Should be doing more
  - Could do better job
- **Scoring**:
  - 0-10: Little/no burden
  - 10-20: Mild to moderate
  - 21-40: Moderate to severe
  - 41-48: Severe burden
- **Recommendations**: Respite care, support groups, counseling
- **Database Table**: `caregiver_burden_assessments`

**J. Motor Skills Assessment**
- **Grip Strength**: Right & left hand (kg)
- **Timed Up and Go (TUG)**: Time to stand, walk 3m, return, sit
- **Gait Speed**: Walking speed over set distance
- **Balance Tests**: Single-leg stand, tandem stand
- **Fall Risk Assessment**: Based on combined results
- **Database Table**: `motor_skills_assessments`

**K-L. Additional Assessment Tools**
- Custom forms for specific palliative care needs
- Spiritual assessment
- Cultural preferences assessment

**Assessment Workflow**:
1. Clinician selects appropriate assessment tool
2. Questions presented (patient/proxy completes)
3. Scores automatically calculated
4. Interpretation provided
5. Results stored with timestamp
6. Trends tracked over time
7. Alerts triggered if concerning scores
8. Journey event logged
9. Care plan updated based on results

**API Endpoints** (Pattern):
- POST `/api/clinical-assessments/{patient_id}/{tool_name}` - Create assessment
- GET `/api/clinical-assessments/{patient_id}?type={tool}` - Get assessments
- GET `/api/clinical-assessments/{id}` - Get specific assessment

---

#### **6. Appointments System**

**Purpose**: Schedule, track, and manage patient-clinician interactions

**Appointment Types**:
- Consultation (initial or follow-up)
- Treatment (chemotherapy, radiation, procedures)
- Assessment (periodic reviews)
- Home Visit
- Telehealth/Virtual
- Emergency
- Family Conference
- Bereavement Support

**Appointment Information**:
- **Patient**: Linked to patient record
- **Clinician**: Assigned healthcare provider
- **Date & Time**: Scheduled appointment time
- **Duration**: In minutes (default 30)
- **Location**:
  - Type: Facility, Home, Telehealth
  - Detail: Room number, address, video link
- **Status**:
  - Scheduled: Confirmed appointment
  - Completed: Appointment occurred
  - Cancelled: Cancelled with reason
  - Missed: Patient no-show
- **Notes**: Pre-appointment notes (reason, preparation needed)
- **Completion Notes**: Post-appointment documentation

**Automated Reminders**:
- **24 Hours Before**: 
  - Patient notification
  - Clinician notification
  - Preparation reminders
  
- **1 Hour Before**:
  - Final reminder
  - Direction/location info
  - Join link for telehealth

**Workflow**:
1. Appointment created (by patient, family, or clinician)
2. Stored in database
3. Notification monitoring loop checks schedule
4. 24h before → Reminder notifications sent
5. 1h before → Final reminder sent
6. Appointment time arrives
7. After appointment → Clinician marks complete with notes
8. Journey event logged
9. If missed → Status updated, follow-up triggered

**Cancellation Handling**:
- Cancellation reason required
- Timestamp recorded
- Notifications sent to all parties
- Option to reschedule

**Database Table**: `appointments`
**API Endpoints**:
- POST `/api/appointments` - Create appointment
- GET `/api/appointments?patient_id={id}` - Get patient appointments
- GET `/api/appointments?clinician_id={id}` - Get clinician schedule
- PUT `/api/appointments/{id}` - Update appointment
- PUT `/api/appointments/{id}/complete` - Mark complete
- PUT `/api/appointments/{id}/cancel` - Cancel appointment

---

#### **7. Care Plans**

**Purpose**: Comprehensive, holistic care planning for palliative patients

**Care Plan Components**:

1. **Goals of Care**:
   - Patient's wishes and priorities
   - Quality of life goals
   - Treatment preferences
   - End-of-life wishes
   
2. **Pain Management Plan**:
   - Current pain levels and patterns
   - Medications and dosing
   - Non-pharmacological interventions
   - Breakthrough pain management
   - Side effect management
   
3. **Psychological Support**:
   - Mental health assessment
   - Counseling needs
   - Support resources
   - Family therapy
   - Grief counseling
   
4. **Spiritual Care**:
   - Religious/spiritual preferences
   - Spiritual distress assessment
   - Chaplain/spiritual care provider involvement
   - Cultural considerations
   - Ritual preferences
   
5. **Family Support Plan**:
   - Family dynamics
   - Education needs
   - Respite care
   - Caregiver burden assessment
   - Bereavement planning
   
6. **Advance Directives Notes**:
   - DNR status
   - Healthcare proxy
   - Living will
   - POLST/MOLST forms
   - Legal documentation references
   
7. **Bereavement Plan**:
   - Family support post-death
   - Grief resources
   - Memorial planning
   - Legacy content activation

**Care Plan Features**:
- **Version Control**: Track changes over time
- **Current Flag**: Only one current plan per patient
- **Review Scheduling**: Regular review dates
- **Multi-disciplinary**: Input from entire care team
- **Patient-Centered**: Based on patient preferences
- **Family Involvement**: Include family in planning

**Workflow**:
1. Initial care plan created at admission
2. Regular reviews (weekly/monthly based on status)
3. Updated with each significant change
4. Versioned for historical tracking
5. Accessible to entire care team
6. Patient/family can view
7. Guides daily care decisions

**Database Table**: `care_plans`
**API Endpoints**:
- POST `/api/care-plans` - Create new care plan
- GET `/api/care-plans/{patient_id}` - Get current plan
- GET `/api/care-plans/{patient_id}/history` - Get all versions
- PUT `/api/care-plans/{id}` - Update plan (creates new version)

---

#### **8. Alerts System 🚨**

**Purpose**: Real-time notification of critical medical situations requiring immediate attention

**Alert Types**:
- **Critical Vitals**:
  - Oxygen saturation < 90%
  - Heart rate < 50 or > 120 bpm
  - Blood pressure extremes
  - Temperature > 38.5°C or < 35°C
  
- **Patient Deterioration**:
  - Rapid decline in functional status
  - Sudden change in consciousness
  - Severe symptom escalation
  
- **Fall Incidents**:
  - Patient fall reported
  - Injury assessment needed
  
- **Severe Pain**:
  - Pain score ≥ 8/10
  - Uncontrolled pain despite medication
  
- **Equipment Issues**:
  - Oxygen concentrator failure
  - Medical device malfunction
  
- **Critical Lab Results** (future):
  - Dangerous lab values

**Alert Properties**:
- **Severity Levels**:
  - CRITICAL: Life-threatening, act now
  - HIGH: Urgent, act within 1 hour
  - MEDIUM: Important, act within 4 hours
  - LOW: Monitor, act within 24 hours
  
- **Visual Design**:
  - Icon: RED AlertCircle ⚠️
  - Badge: RED with pulsing animation
  - Toast: RED notification popup
  - Sound: Alert tone (optional)
  
- **Acknowledgment**:
  - Clinician must acknowledge
  - Timestamp recorded
  - Action taken documented

**Alert Workflow**:
```
1. Critical Event Occurs
   ↓
2. Alert Created in Database
   - Patient ID
   - Alert Type
   - Severity
   - Triggered Value
   - Threshold Value
   - Message
   ↓
3. Alert Monitoring Loop Detects (30 sec)
   ↓
4. Frontend Polls API (30 sec)
   ↓
5. RED Pulsing Badge Appears
   ↓
6. RED Toast Notification Pops Up
   ↓
7. Clinician Clicks AlertCircle Icon
   ↓
8. Dropdown Shows Alert Details
   ↓
9. Clinician Clicks Alert
   ↓
10. Navigates to Patient Detail Page
   ↓
11. Reviews Patient Status
   ↓
12. Takes Clinical Action
   ↓
13. Documents Action
   ↓
14. Acknowledges Alert
   ↓
15. Alert Marked as Handled
   ↓
16. Badge Count Decrements
   ↓
17. Journey Event Logged
```

**Access Control**:
- ✅ Clinicians: See all alerts
- ✅ Caregivers: See assigned patient alerts
- ✅ Administrators: See all alerts
- ❌ Patients: Do NOT see alerts (avoid causing alarm)
- ❌ Family: Generally do NOT see alerts

**Database Table**: `alerts`
**API Endpoints**:
- GET `/api/alerts` - List user's alerts
- GET `/api/alerts/unread-count` - Badge count
- GET `/api/alerts/{id}` - Get alert details
- PUT `/api/alerts/{id}/acknowledge` - Mark handled
- DELETE `/api/alerts/{id}` - Dismiss alert

**Integration**:
- Triggered by: Vitals, Symptoms, Assessments, AI Predictions
- Creates: Journey events
- Influences: Care plan adjustments

---

#### **9. Clinical Notes**

**Purpose**: Free-text clinical documentation for patient records

**Note Types**:
- Progress Notes
- Assessment Notes
- Consultation Notes
- Phone Call Notes
- Family Conference Notes
- Incident Reports
- Discharge Summary

**Features**:
- Author tracking (who wrote it)
- Timestamp (when written)
- Patient context
- Privacy controls (private vs shared with family)
- Search & filter
- Export capabilities

**Database Table**: `clinical_notes`
**API Endpoints**:
- POST `/api/patients/{id}/notes` - Create note
- GET `/api/patients/{id}/notes` - Get patient notes

---

#### **10. Intelligent Care System 🤖**

**Purpose**: AI-powered risk prediction and proactive care recommendations

**Features**:
- **Risk Prediction Model**:
  - XGBoost machine learning algorithm
  - Predicts patient deterioration risk
  - Score: 0-100 (higher = more at risk)
  - Risk Level: Low, Moderate, High, Critical
  - Confidence Score: Model certainty
  
- **SHAP Explainability**:
  - Shows which factors contribute to risk
  - Feature importance values
  - Transparent AI decision-making
  
- **Plain Language Explanations**:
  - Converts technical data to readable insights
  - "This patient is at high risk because..."
  
- **Proactive Monitoring**:
  - Runs every 5 minutes
  - Analyzes all active patients
  - Creates alerts for concerning patterns
  - No human intervention needed
  
- **Recommendations**:
  - Suggested interventions
  - Resource allocation
  - Care pathway adjustments

**Analysis Factors**:
- Recent vitals trends
- Symptom escalation
- Medication adherence
- Functional status (PPS)
- Recent assessment scores
- Historical patterns
- Similar patient outcomes

**Workflow**:
1. Background loop runs (every 5 min)
2. For each active patient:
   - Gather recent data
   - Run through ML model
   - Generate risk score
   - Create explanation
3. If risk increased → Create alert
4. Store prediction in database
5. Journey event logged
6. Clinician dashboard updated

**Database Table**: `predictions`
**API Endpoints**:
- GET `/api/intelligent-care/risk/{patient_id}` - Get risk assessment
- GET `/api/ai-analysis/explain/{patient_id}` - Get SHAP explanation
- POST `/api/ai/analyze` - Trigger manual analysis

---

This completes the detailed Clinical Management Features. Continue to next sections? (Patient & Family Features, Communication, Education, etc.)


### **👤 PATIENT & FAMILY FEATURES (Detailed)**

#### **11. Patient Portal (My Space)**

**Purpose**: Personalized dashboard for patients to manage their own care

**Dashboard Components**:
- **Welcome Section**: Personalized greeting with patient name
- **Today's Schedule**: Upcoming appointments and medication times
- **Quick Actions**:
  - Report symptoms
  - Log medication taken
  - Send message to care team
  - View test results
  - Access educational resources
  
- **Health Summary**:
  - Latest vitals display
  - Current medications list
  - Upcoming appointments
  - Recent symptoms
  
- **Journey Timeline**: Visual representation of care journey
- **Notifications**: Personal notification feed
- **Resources**: Recommended educational content
- **Community**: Quick access to support groups

**Personalization**:
- Content adapted based on questionnaire responses
- Language preference applied
- Information density based on tech comfort level
- Topic interests reflected in resource suggestions

**Access Control**: Patient sees only their own data

**Frontend Page**: `PatientPortal.jsx`
**API Endpoints**: Multiple (aggregates data from various sources)

---

#### **12. Personalization Questionnaire (7-Step Journey)**

**Purpose**: Capture patient preferences to personalize entire experience

**Design Specifications**:
- **Colors**: Emerald-Teal-Cyan healthcare gradient (NO white backgrounds)
- **Layout**: Compact (p-6 padding), professional sizing
- **Animation**: Smooth horizontal sliding between steps (0.3s duration)
- **Progress**: Beautiful dots (not bar), gradient for current step
- **Form Elements**:
  - Radio: Large touchable cards (2-column grid)
  - Multi-select: Animated gradient chips
  - Slider: Beautiful gradient track with large value display

**Step 1: Getting to Know You**
- Language preference (en, twi, ga, ewe, hausa, dagbani)
- Information style (simple, detailed, visual, mixed)
- Tech comfort (high, medium, low, basic)

**Step 2: Your Health Journey**
- Diagnosis duration (new, 0-3 months, 3-12 months, 12+ months)
- Emotional states (multi-select: scared, hopeful, overwhelmed, peaceful, confused, determined, sad, grateful)

**Step 3: Physical Health**
- Physical symptoms (multi-select: pain, tiredness, sleep trouble, nausea, breathlessness, appetite loss, difficulty moving, none)
- Activity level (high, moderate, low, bedbound)
- Self-care level (independent, some help, much help, fully dependent)

**Step 4: Emotional Wellbeing**
- Mood score (1-10 slider with emojis)
- Coping strategies (multi-select: family, prayer, music, nature, reading, films, creative, alone time, professional, exercise)
- Future worry level (very, somewhat, little, peaceful)

**Step 5: Faith & Culture**
- Religious background (Christian, Muslim, traditional African, none, other)
- Spiritual importance (very, important, somewhat, not)
- Wants spiritual care (yes/no)

**Step 6: Relationships**
- Main support person (spouse, parent, child, sibling, friend, caregiver, alone)
- Social connectedness (very, mostly, sometimes lonely, very isolated)
- Wants peer connection (yes/no)

**Step 7: Content Preferences**
- Content preferences (multi-select: condition news, symptom tips, inspirational stories, practical guides, videos, coping articles, family info)
- Information frequency (daily, few times weekly, weekly, only changes)
- Topic interests (multi-select: pain management, sleep, nutrition, mental health, family communication, spiritual peace, legacy, finances, home care, medication side effects)
- Wants community (yes/no actively, not right now)

**Completion Screen**:
- Large spinning checkmark (w-24 h-24)
- Emerald-teal-cyan gradient colors
- "You're all set!" message
- Auto-redirect to /my-space after 2 seconds

**Data Usage**:
- Personalizes dashboard content
- Influences resource recommendations
- Adjusts information complexity
- Determines community group suggestions
- Guides spiritual care planning
- Informs care team about patient preferences

**Database Table**: `patient_preferences`
**API Endpoints**:
- GET `/api/preferences/{user_id}` - Get preferences
- POST `/api/preferences` - Save questionnaire
- PUT `/api/preferences/{user_id}` - Update preferences

**Frontend Page**: `PersonalisationQuest.jsx` (no layout, full-screen experience)
**Route**: `/setup` (requires authentication)

---

#### **13. Memory Vault**

**Purpose**: Sacred digital space for preserving cherished memories

**Content Types**:
- **Photos**: Upload & organize images
- **Videos**: Record/upload video memories
- **Audio**: Voice recordings, songs, messages
- **Written Memories**: Stories, reflections, moments
- **Documents**: Scanned letters, certificates, etc.

**Features**:
- **Organization**:
  - Timeline view (chronological)
  - Albums/collections
  - Tags for categorization
  - Search functionality
  
- **Privacy Controls**:
  - Public (visible to all linked family)
  - Family-only
  - Private (patient only)
  - Legacy heir access settings
  
- **Sharing**:
  - Share with specific family members
  - Include in digital legacy
  - Accessible after patient's death (if permitted)
  
- **Media Upload**:
  - Drag & drop interface
  - Multiple file selection
  - Progress indicators
  - File type validation
  
- **Continuity Bridge**:
  - Memories preserved for bereavement support
  - Family can continue adding memories after death
  - Becomes part of legacy content

**Emotional Support**:
- Prompts for memory creation (e.g., "Tell us about a favorite childhood memory")
- Guided reflection questions
- Sentiment tracking for therapeutic insights

**Database Table**: `bereavement_entries` (type="memory")
**API Endpoints**:
- POST `/api/bereavement/entry` - Create memory
- GET `/api/bereavement/entries/{patient_id}?type=memory` - Get memories
- DELETE `/api/bereavement/entry/{id}` - Delete memory
- POST `/api/uploads` - Upload media files

**Frontend Page**: `MemoryVault.jsx`
**Access**: Patient, family members, designated heirs (post-death)

---

#### **14. Journal System**

**Purpose**: Private space for patient reflection and emotional processing

**Features**:
- **Free-form Journaling**: Write whatever's on your mind
- **Prompted Journaling**: Guided reflection questions
- **Mood Tracking**: Integrated mood logging
- **Sentiment Analysis**: AI tracks emotional patterns (not shown to user, clinical use only)
- **Privacy**: Completely private unless patient chooses to share
- **Export**: Download journal entries
- **Therapeutic Value**: Proven benefits for emotional wellbeing

**Prompts Examples**:
- "What brought you joy today?"
- "What are you grateful for?"
- "What's weighing on your mind?"
- "Describe a moment of peace today"
- "What do you want your family to know?"

**Database Table**: `bereavement_entries` (type="journal")
**Frontend Page**: `Journal.jsx`
**Access**: Patient only (unless explicitly shared)

---

#### **15-17. Digital Legacy System (Comprehensive)**

**LEGAL FOUNDATION**:
- HIPAA compliant (USA healthcare privacy)
- GDPR compliant (EU data protection)
- Supports advance directives
- Requires informed consent
- Allows revocation at any time
- Witness requirements for legal validity

**Three Core Components**:

**A. Legacy Consent Management**

**Purpose**: Legal authorization for digital legacy and posthumous access

**Consent Elements**:
- **Primary Consent**: Patient agrees to digital legacy program
- **Witnessed Consent**: Clinician/admin witnesses and signs
- **Sharing Permissions**:
  - Share medical records? (yes/no)
  - Share memories? (yes/no)
  - Share journal entries? (yes/no)
  - Share messages? (yes/no)
  - Share photos? (yes/no)
  
- **Legal Compliance Flags**:
  - Follows HIPAA
  - Follows GDPR
  - Follows local law
  
- **Revocation Rights**:
  - Patient can revoke anytime
  - Reason for revocation recorded
  - All heir access immediately suspended

**Workflow**:
1. Patient or clinician initiates consent process
2. System explains digital legacy program
3. Patient reviews permissions
4. Patient provides consent (digital signature)
5. Clinician witnesses (optional but recommended)
6. Consent stored with timestamp
7. Heir designation now permitted
8. Can be revised/revoked anytime

**Database Table**: `legacy_consents`
**API Endpoints**:
- POST `/api/legacy/consent` - Give/update consent
- GET `/api/legacy/consent/{patient_id}` - Get consent status
- PUT `/api/legacy/consent/{patient_id}/revoke` - Revoke consent

---

**B. Heir Management**

**Purpose**: Designate who can access digital legacy after death

**Heir Designation**:
- **Who Can Be Heir**: Anyone in system (family, friends, caregivers, anyone)
- **Relationship**: Specify relationship (daughter, son, spouse, friend, etc.)
- **Access Levels**:
  - **Full**: Everything patient permitted
  - **Memories Only**: Memory Vault access only
  - **Messages Only**: Final messages only
  
- **Privacy Control**:
  - Can access private content? (yes/no)
  - Based on patient's comfort level
  
- **Personal Notes**: Patient can write private note to each heir
- **Activation**: Access granted automatically upon patient's death

**Multiple Heirs Supported**:
- No limit on number of heirs
- Each heir has individual permissions
- Patient controls who sees what
- Family dynamics respected

**Workflow**:
1. Patient (or clinician helping) designates heir
2. Heir user must exist in system
3. System verifies consent exists
4. Patient sets access level and permissions
5. Patient writes personal note (optional)
6. Heir designation stored
7. Heir notified of designation (optional)
8. Upon patient death → Heir access activated
9. Heir can view permitted content

**Database Table**: `legacy_heirs`
**API Endpoints**:
- POST `/api/legacy/heirs` - Designate heir
- GET `/api/legacy/heirs/{patient_id}` - List patient's heirs
- DELETE `/api/legacy/heirs/{heir_id}` - Remove heir
- GET `/api/legacy/my-legacy-access` - See patients where I'm heir

**Frontend Pages**:
- `HeirManagement.jsx` - For patients to manage heirs
- `MyLegacyAccess.jsx` - For heirs to see their access

---

**C. Legacy Content Creation**

**Purpose**: Create messages, letters, media to be delivered after death

**Content Types**:
- **Final Message**: Last words to loved ones
- **Letter**: Written correspondence
- **Audio**: Voice recording
- **Video**: Video message
- **Note**: Short message or instruction

**Delivery Options**:
- **After Death**: Delivered when patient passes (most common)
- **Specific Date**: Birthday, anniversary, milestone
- **Specific Event**: When grandchild graduates, etc.

**Recipient Options**:
- **All Heirs**: Everyone designated as heir
- **Specific Heir**: One particular heir
- **Specific Person**: Any user in system (not necessarily heir)

**Content Creation Process**:
1. Patient selects content type
2. Writes/records content
3. Chooses recipient(s)
4. Sets delivery trigger
5. Reviews and saves
6. Can edit until delivered
7. Upon trigger → Content delivered automatically

**Media Support**:
- Audio: Record in browser or upload MP3/WAV
- Video: Record via webcam or upload MP4
- Documents: Upload PDF, DOCX
- File size limits enforced
- Secure storage

**Database Table**: `legacy_content`
**API Endpoints**:
- POST `/api/legacy/content` - Create content
- GET `/api/legacy/content/{patient_id}` - Get patient's content
- PUT `/api/legacy/content/{id}` - Edit content
- DELETE `/api/legacy/content/{id}` - Delete content (before delivery)
- POST `/api/uploads` - Upload media files

**Frontend Page**: `LegacyContentCreator.jsx`

---

**D. Legacy Activation (Upon Death)**

**Trigger**: Clinician/admin marks patient as deceased

**Automated Actions**:
1. Patient status → "deceased"
2. Deceased date recorded
3. All designated heirs activated
4. Legacy content marked for delivery
5. "After death" content delivered
6. Notifications sent to heirs
7. Heir access granted
8. Journey timeline updated
9. Audit log created

**Heir Notification**:
- Email/SMS to each heir
- "You have been granted access to [Patient Name]'s digital legacy"
- Login link provided
- Instructions for accessing content

**Heir Access Experience**:
1. Heir logs into system
2. Sees notification of access granted
3. Navigates to "My Legacy Access"
4. Sees list of patients (where they're designated heir)
5. Clicks patient
6. Sees permitted content (memories, messages, etc.)
7. Can view, download, share within permissions
8. Cannot edit patient's content

**Database Tables**: `patients` (deceased_at), `legacy_heirs` (activated_at), `legacy_content` (delivered_at)
**API Endpoint**: PUT `/api/legacy/activate/{patient_id}` (clinician only)

---

#### **18. Continuity Bridge / Bereavement Support**

**Purpose**: Support family through grief, before and after patient's death

**Features**:
- **Available Throughout Journey**: Not just after death
- **Dual Purpose**:
  - **Before Death**: Family prepares, creates memories together
  - **After Death**: Grief processing and support
  
- **Grief Journaling**:
  - Private journal for family members
  - Prompted reflections
  - Sentiment analysis for tracking grief stages
  - Grief stage hints (denial, anger, bargaining, depression, acceptance)
  
- **Shared Memories**:
  - Family can add memories about patient
  - Photo/video tributes
  - Story sharing
  - Celebration of life
  
- **Bereavement Prompts**:
  - "What do you miss most?"
  - "Share a favorite memory"
  - "What would you want to tell them?"
  - "How are you coping today?"
  
- **Support Resources**:
  - Grief counseling information
  - Support group recommendations
  - Educational materials on grief
  - Cultural/religious resources

**Privacy Levels**:
- **Private**: Only visible to author
- **Family**: Visible to all linked family members
- **Public**: Visible to all with access to patient record

**Database Table**: `bereavement_entries`
**API Endpoints**:
- POST `/api/bereavement/entry` - Create entry
- GET `/api/bereavement/entries/{patient_id}` - Get entries
- GET `/api/bereavement/my-patient` - Get linked patient info
- PUT `/api/bereavement/activate-continuity-bridge/{patient_id}` - Mark deceased

**Frontend Pages**:
- `ContinuityBridge.jsx` - Overview
- `MemoryVault.jsx` - Memory creation
- `Journal.jsx` - Grief journaling

---

### **💬 COMMUNICATION & SOCIAL FEATURES (Detailed)**

#### **19. Messaging System**

**Purpose**: Secure, HIPAA-compliant communication within care team

**Message Types**:
- **One-on-One**: Direct message between two users
- **Group Conversations**: Multiple participants
- **Care Team Chats**: Patient + all assigned clinicians/caregivers

**Features**:
- **Real-time**: Messages appear immediately
- **Read Receipts**: See when message was read
- **Message History**: Full conversation history
- **Search**: Find past messages
- **Attachments**: Share documents/images (future)
- **Notifications**: Alert on new message

**Conversation Management**:
- **Start Conversation**: Initiate with any user
- **Add Participants**: Expand to group chat
- **Leave Conversation**: Remove self from group
- **Conversation Titles**: Name group chats

**Privacy & Security**:
- Encrypted storage
- Access control (only participants can view)
- Audit trail
- HIPAA compliant

**Workflow**:
1. User clicks "New Message"
2. Selects recipient(s)
3. Types message
4. Sends
5. Message stored in database
6. Notification created for recipient(s)
7. Recipient sees notification
8. Clicks to open message
9. Reads message (marked as read)
10. Can reply

**Database Tables**:
- `conversations` - Conversation metadata
- `conversation_participants` - Who's in each conversation
- `messages` - Individual messages

**API Endpoints**:
- GET `/api/messaging/conversations` - List user's conversations
- POST `/api/messaging/conversations/start` - Start new conversation
- GET `/api/messaging/conversations/{id}/messages` - Get messages
- POST `/api/messaging/conversations/{id}/messages` - Send message

**Frontend Page**: `Messages.jsx`
**Integration**: Creates notifications, journey events

---

#### **20. Community Hub**

**Purpose**: Anonymous peer support groups for patients and families

**Design Philosophy**:
- **Anonymity**: Display names anonymized (e.g., "Sarah · Cancer Journey")
- **Privacy**: No personal medical details required
- **Support**: Peer-to-peer emotional support
- **Ghana-Specific**: Groups tailored to Ghanaian culture

**Group Types**:
- **Condition-Specific**: Cancer, Cardiac, Kidney, Respiratory, Liver, HIV/AIDS
- **General**: "General Palliative Care Support", "New to Palliative Care"
- **Stage-Specific**: "Living Well Every Day", "Advanced Care Conversations"
- **Caregiver-Specific**: "Caregiver Support", "Preventing Burnout"
- **Cultural**: "Ghana Palliative Care Community"

**Post Features**:
- **280-Character Limit**: Short, focused posts (Twitter-style)
- **Reactions**:
  - 🙏 Pray (prayer/support)
  - ❤️ Heart (love/empathy)
  - 💪 Strong (encouragement)
- **No Comments**: Keeps it simple, reduces negativity
- **Flagging**: Report inappropriate content
- **Moderation**: Admin/clinician review flagged posts

**Anonymization Examples**:
- Patient with cancer: "John · Cancer Journey"
- Family member: "Family of Mary · Cardiac Journey"
- Caregiver: "Professional Caregiver"
- Clinician: "Dr. Smith (Care Team)"

**Group Recommendations**:
- Based on patient diagnosis
- Based on questionnaire responses
- Based on current symptoms/concerns
- Relevance score (0-100)

**Moderation**:
- **Auto-moderation**: 5+ flags → post hidden automatically
- **Manual moderation**: Clinician/admin can hide/unhide posts
- **Flagged posts**: Shown grayed to moderators
- **Reason tracking**: Why post was moderated

**Workflow**:
1. User joins relevant support groups
2. Reads posts from community
3. Clicks "Create Post"
4. Writes 280-char post
5. Posts to group
6. Other members see post
7. React with pray/heart/strong
8. If inappropriate → Flag post
9. Moderator reviews → Hides if needed

**Database Tables**:
- `community_groups` - Support groups
- `community_memberships` - User group memberships
- `community_posts` - Individual posts

**API Endpoints**:
- GET `/api/community/groups` - List groups
- POST `/api/community/groups/{id}/join` - Join/leave group
- GET `/api/community/groups/{id}/posts` - Get group posts
- POST `/api/community/posts` - Create post
- POST `/api/community/posts/{id}/react` - React to post
- POST `/api/community/posts/{id}/flag` - Flag post
- PUT `/api/community/posts/{id}/moderate` - Moderate post (admin)

**Frontend Page**: `CommunityHub.jsx`

---

**Continue with remaining sections? (Education, Caregiver Support, AI, Admin, Accessibility, etc.)**


#### **21. Notifications System 🔔**

**Purpose**: Routine reminders and informational updates for all users

**Notification Types**:

1. **Appointment Reminders**:
   - `appointment_reminder_24h` - 24 hours before appointment
   - `appointment_reminder_1h` - 1 hour before appointment
   - Title: "Appointment tomorrow" or "Appointment in 1 hour"
   - Body: Details with time, location, clinician name
   
2. **Medication Reminders**:
   - `medication_reminder` - 15 minutes before dose time
   - Title: "Time to take your medication"
   - Body: Medication name, dose, time
   
3. **Missed Medication**:
   - `medication_missed` - 30 minutes after missed dose
   - Title: "Missed medication"
   - Body: Which medication was missed
   
4. **New Messages**:
   - `new_message` - When message received
   - Title: "New message from [Sender]"
   - Body: Message preview
   - Icon: MessageSquare 💬
   
5. **Report Available**:
   - `report_available` - Lab results, assessment reports ready
   - Title: "New report available"
   - Body: Report type
   - Icon: FileText 📄
   
6. **Critical Vitals** (duplicates to notifications):
   - When vital signs cross thresholds
   - Redundant with alerts system

**Visual Design**:
- **Icon**: TEAL Bell 🔔
- **Badge**: TEAL color, static (no animation)
- **Badge Count**: Number of unread notifications
- **Hover**: Light teal background
- **Dropdown**: Shows notifications grouped by date

**Notification Properties**:
- **Recipient**: Specific user ID
- **Type**: One of the types above
- **Title**: Short headline
- **Body**: Detailed message
- **Related ID**: Links to appointment, medication, message, etc.
- **Is Sent**: Whether notification was delivered
- **Sent At**: Timestamp of sending
- **Is Read**: Whether user has read it
- **Read At**: When user marked as read
- **Created At**: When notification was created

**User Experience**:
1. **Badge Count**: Shows unread count
2. **Click Bell**: Opens dropdown
3. **Dropdown Organization**:
   - "Today" section
   - "Yesterday" section
   - "This Week" section
   - Older grouped by week
4. **Notification Items**:
   - Icon (based on type)
   - Title (bold if unread)
   - Body text
   - Timestamp (relative: "2 hours ago")
5. **Click Notification**:
   - Marks as read
   - Navigates to relevant page
   - Closes dropdown
6. **Actions**:
   - Mark all as read
   - Clear read notifications
   - Delete individual notification

**Auto-Refresh**: Frontend polls every 30 seconds for new notifications

**Background Generation**: 
- Notification monitoring loop runs every 5 minutes
- Checks upcoming appointments, medication schedules
- Creates notifications proactively

**Access Control**:
- ✅ ALL users receive notifications
- Each user sees only their own notifications
- Targeted based on role and relationships

**Database Table**: `notification_queue`

**API Endpoints**:
- GET `/api/notifications` - List user's notifications
- GET `/api/notifications/unread-count` - Badge count
- PUT `/api/notifications/{id}/read` - Mark as read
- PUT `/api/notifications/mark-all-read` - Bulk mark read
- DELETE `/api/notifications/{id}` - Delete notification
- DELETE `/api/notifications/clear-read` - Clear all read
- POST `/api/notifications/test-notification` - Create test (dev only)

**Frontend Component**: `NotificationCenter.jsx`

**Key Differences from Alerts**:
| Aspect | Notifications 🔔 | Alerts 🚨 |
|--------|------------------|-----------|
| Purpose | Routine reminders | Medical emergencies |
| Color | Teal | Red |
| Badge | Static | Pulsing |
| Urgency | Informational | Critical |
| Audience | All users | Clinical staff only |
| Action | FYI, optional | ACT NOW, required |

---

#### **22. Real-Time Updates**

**Purpose**: Keep UI synchronized with backend data changes

**Technologies**:
- **Polling**: Frontend checks backend every 30 seconds
- **React Query**: Automatic background refetching
- **Toast Notifications**: Popup alerts for important updates

**What Gets Updated**:
- **Notification Badge**: Unread count
- **Alert Badge**: Unread critical alerts
- **Message Count**: New messages
- **Patient Status**: Status changes
- **Vitals Display**: New vital recordings
- **Appointment List**: New/changed appointments

**Polling Intervals**:
- Notifications: 30 seconds
- Alerts: 30 seconds
- Messages: 30 seconds (when on messages page)
- Dashboard Data: 60 seconds
- Patient List: On demand (manual refresh)

**Toast Notifications**:
- **Success**: Green background, checkmark icon
- **Error**: Red background, X icon
- **Info**: Blue background, info icon
- **Warning**: Yellow background, warning icon
- **Position**: Top-right corner
- **Duration**: 4 seconds (auto-dismiss)
- **Actions**: Click to dismiss early

**Sound & Haptics** (Optional):
- Alert sound for critical alerts
- Notification tone for new messages
- Haptic feedback on touch devices
- User can enable/disable in settings

**Frontend Implementation**:
```javascript
// React Query with auto-refetch
const { data: notifications } = useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
  refetchInterval: 30000, // 30 seconds
});

// Toast usage
toast.success('Vitals recorded successfully!');
toast.error('Failed to save medication');
```

---

### **📚 EDUCATION & RESOURCES FEATURES (Detailed)**

#### **23. Educational Resources Library**

**Purpose**: Comprehensive knowledge base for patients, families, and caregivers

**Content Organization**:

**Categories**:
- Symptom Management
- Emotional Support
- Spiritual Care
- Family Guidance
- Advance Care Planning
- Cultural Considerations
- Medication Information
- Nutrition & Hydration
- Daily Living Support
- End-of-Life Preparation
- Bereavement Support

**Formats**:
- **Article**: Written content with images
- **Video**: Educational videos
- **Audio**: Podcast-style content
- **Infographic**: Visual guides
- **Guide**: Step-by-step instructions
- **Checklist**: Practical checklists

**Languages**:
- English
- Twi
- Ga
- Ewe
- Hausa
- Dagbani
- (Expandable to other Ghanaian languages)

**Metadata for Each Resource**:
- **Title**: Clear, descriptive title
- **Summary**: Brief overview (2-3 sentences)
- **Content**: Full article text (Markdown supported)
- **Media URL**: Link to video/audio if applicable
- **Duration**: Reading/viewing time in minutes
- **Author**: Content creator
- **Source**: Original source if external
- **Condition Tags**: Which conditions it's relevant for
- **Topic Tags**: Specific topics covered
- **Ghana-Specific Flag**: Content tailored for Ghana
- **Published Status**: Draft vs published
- **View Count**: How many times accessed
- **Helpful Count**: How many found it helpful

**Search & Filter**:
- **Text Search**: Title, summary, content
- **Category Filter**: Select category
- **Condition Filter**: Filter by condition (cancer, cardiac, etc.)
- **Topic Filter**: Specific topics
- **Format Filter**: Article, video, audio, etc.
- **Language Filter**: Select language
- **Ghana-Specific**: Show only Ghana content

**User Features**:
- **Bookmarking**: Save resources for later
- **Helpful Feedback**: Mark as helpful/not helpful
- **View History**: Track what you've read
- **Recommendations**: Personalized suggestions
- **Download**: Save for offline (PDFs)
- **Share**: Share with family members

**Recommendation Engine**:
Suggests resources based on:
- Patient diagnosis
- Questionnaire responses (topic interests)
- Current symptoms
- Care stage
- Language preference
- Previous views
- Helpful feedback

**Ranking Algorithm**:
```
Relevance Score = 
  (Condition Match × 30) +
  (Topic Interest Match × 25) +
  (Language Match × 20) +
  (Helpful Ratio × 15) +
  (Recency × 10)
```

**Database Tables**:
- `resources` - Resource content
- `resource_bookmarks` - User bookmarks
- `resource_feedback` - Helpful votes

**API Endpoints**:
- GET `/api/resources` - List with filters
- GET `/api/resources/{id}` - Get resource (increments view count)
- GET `/api/resources/recommended` - Personalized recommendations
- GET `/api/resources/bookmarks` - User's bookmarks
- POST `/api/resources/{id}/bookmark` - Toggle bookmark
- POST `/api/resources/{id}/helpful` - Mark helpful/not helpful

**Frontend Page**: `Resources.jsx`
**Access**: All authenticated users

---

#### **24. Adaptive Care Guide**

**Purpose**: Dynamic, patient-specific care guidance

**Features**:
- **Personalized Content**: Based on questionnaire responses
- **Stage-Appropriate**: Matches care stage (stable, declining, end-of-life)
- **Symptom-Specific**: Addresses current symptoms
- **Cultural Sensitivity**: Respects cultural/religious preferences
- **Family Involvement**: Guidance for family support
- **Regular Updates**: Changes as patient condition changes

**Content Sections**:
1. **Your Current Status**: Summary of where patient is in journey
2. **Managing Your Symptoms**: Specific to reported symptoms
3. **Medication Guide**: Understanding current medications
4. **What to Expect**: Preparing for what's ahead
5. **Family Support**: Resources for loved ones
6. **Spiritual Care**: Based on religious preference
7. **Questions to Ask**: Prompts for care team discussions
8. **Emergency Signs**: When to call for help

**Adaptation Logic**:
```
if (pps_score < 30):
  show end-of-life specific content
elif (pain_score > 7):
  emphasize pain management
elif (anxiety_high):
  focus on emotional support
```

**Frontend Page**: `AdaptiveCareGuide.jsx`
**API Endpoint**: GET `/api/care-guide/{patient_id}` - Generate personalized guide

---

#### **25. Resource Recommendations Engine**

**Purpose**: AI-powered content suggestions

**How It Works**:
1. Analyze patient profile
2. Review questionnaire responses
3. Check current symptoms
4. Consider diagnosis
5. Factor in language preference
6. Look at viewing history
7. Generate ranked list of resources

**Ranking Factors**:
- **Diagnosis Match**: Resources for patient's condition
- **Topic Interest**: Matches questionnaire interests
- **Symptom Relevance**: Addresses current symptoms
- **Language**: In preferred language
- **Popularity**: Well-rated by others
- **Recency**: Newer content ranked higher
- **Not Yet Viewed**: Prioritize new content

**Display**:
- "Recommended for You" section on dashboard
- "Because you're interested in [topic]" explanations
- "Others with [condition] found this helpful"

**API Endpoint**: GET `/api/resources/recommended` or `/api/resources/recommended/{user_id}`

---

### **🩺 CAREGIVER SUPPORT FEATURES (Detailed)**

#### **26. Caregiver Intelligence System**

**Purpose**: AI-powered support to prevent caregiver burnout

**Analysis Components**:

**A. Burnout Risk Assessment**
- Workload analysis (number of patients, hours worked)
- Recent Zarit Burden scores
- Time since last break
- Emotional wellbeing indicators
- Sleep patterns (if tracked)
- **Risk Levels**: Low, Moderate, High, Critical

**B. Workload Distribution**
- Patient assignments per caregiver
- Complexity of care needs (PPS scores)
- Geographic distribution
- Specialty requirements
- Recommended caseload limits

**C. Proactive Recommendations**:
- "Consider respite care for [Patient]"
- "You haven't taken a break in 3 weeks"
- "High patient complexity - need support"
- "Burnout risk increasing - take action"

**D. Support Resources**:
- Self-care tips
- Stress management techniques
- Local support groups
- Counseling services
- Respite care options
- Training materials

**Features**:
- **Dashboard**: Caregiver-specific analytics
- **Alerts**: Burnout risk warnings
- **Recommendations**: Actionable suggestions
- **Peer Connection**: Connect with other caregivers
- **Training Library**: Educational content

**Database Table**: `caregiver_assignments` + analysis logic in `caregiver_intelligence.py`

**API Endpoints**:
- GET `/api/caregiver-intelligence/burnout-risk` - Get risk assessment
- GET `/api/caregiver-intelligence/workload` - Workload analysis
- GET `/api/caregiver-intelligence/recommendations` - Get suggestions

**Frontend Page**: `Caregivers.jsx` (with intelligence features)

---

#### **27. Caregiver Assignments**

**Purpose**: Manage which caregivers are assigned to which patients

**Assignment Properties**:
- **Patient**: Who is being cared for
- **Caregiver**: Who is providing care
- **Assigned At**: When assignment started
- **Assigned By**: Admin/clinician who made assignment
- **Active Status**: Currently active or past assignment
- **Notes**: Special instructions, handoff notes

**Features**:
- **Assignment History**: Track past caregivers
- **Handoff Notes**: Communication between caregivers
- **Workload Tracking**: How many patients per caregiver
- **Skill Matching**: Match caregiver skills to patient needs (future)

**Workflow**:
1. Admin/clinician creates assignment
2. Caregiver notified
3. Caregiver gains access to patient data
4. Care provided
5. Handoff notes when assignment changes
6. Assignment marked inactive when complete

**Database Table**: `caregiver_assignments`

**API Endpoints**:
- POST `/api/caregivers/assign` - Create assignment
- GET `/api/caregivers/assignments?caregiver_id={id}` - Get caregiver's patients
- GET `/api/caregivers/assignments?patient_id={id}` - Get patient's caregivers
- PUT `/api/caregivers/assignments/{id}` - Update assignment
- DELETE `/api/caregivers/assignments/{id}` - End assignment

---

#### **28. Caregiver Burden Assessment**

**(Already documented in Clinical Assessments section - Zarit Burden Interview)**

**Additional Notes for Caregivers**:
- Self-administered (caregiver fills out about themselves)
- Tracked over time to see trends
- Triggers recommendations from Intelligence System
- Used to justify respite care requests
- Links to support resources

---

### **🤖 AI & CHATBOT FEATURES (Detailed)**

#### **29. AI Chatbot (AuraChat)**

**Purpose**: 24/7 conversational AI support for emotional and informational needs

**Technology**: Anthropic Claude API integration

**Features**:

**A. Always Available**:
- 24/7 support when humans unavailable
- Instant responses
- No wait times
- Consistent quality

**B. Context-Aware**:
- Knows patient's diagnosis
- Aware of current medications
- Understands recent symptoms
- Tailored responses

**C. Capabilities**:
- Answer health questions
- Provide emotional support
- Explain medical terms
- Guide to resources
- Help with navigation
- Crisis detection

**D. Safety Features**:
- **Crisis Detection**: Identifies suicidal ideation, self-harm
- **Escalation**: Flags urgent situations for human intervention
- **Boundaries**: Doesn't provide medical diagnosis or treatment
- **Disclaimers**: Clear about AI limitations

**E. Conversation Management**:
- Session tracking
- Message history
- Intent recognition (what user wants)
- Sentiment analysis (how user feels)
- Crisis flagging

**Conversation Flow**:
```
User: "I'm in so much pain, I can't take this anymore"
  ↓
AI analyzes: High distress, possible crisis
  ↓
AI responds: "I'm so sorry you're suffering. Your pain is important. 
             Let's talk about this. On a scale of 0-10, how bad is your pain?"
  ↓
If crisis detected → Alert sent to care team
  ↓
AI provides: Immediate coping strategies + comfort
  ↓
AI suggests: "Would you like me to notify your care team right now?"
```

**Fallback Mode**:
- When Claude API unavailable
- Basic responses from templates
- "I'm having technical difficulties, but help is available at [number]"
- Still functional for navigation help

**Database Tables**:
- `chatbot_sessions` - Conversation sessions
- `chatbot_messages` - Individual messages with intent/sentiment

**API Endpoints**:
- POST `/api/chatbot/chat` - Send message, get response
- GET `/api/chatbot/sessions` - Get user's sessions
- GET `/api/chatbot/sessions/{id}/messages` - Get session history
- POST `/api/chatbot/escalate` - Manual escalation trigger

**Frontend Component**: `ChatBot.jsx` (floating chat button)

**Access**: All authenticated users

---

#### **30. AI Assistant**

**Purpose**: Quick clinical insights for healthcare providers

**Features**:
- **Patient Summary**: One-click patient overview
- **Quick Insights**: Key trends and concerns
- **Treatment Suggestions**: Based on current data
- **Resource Links**: Relevant educational content
- **Natural Language**: Ask questions in plain English

**Example Queries**:
- "Summarize this patient"
- "What are the main concerns?"
- "Any medication interactions?"
- "Recommend pain management approaches"
- "Find resources about [topic]"

**Response Format**:
- Concise bullet points
- Key metrics highlighted
- Action items clearly stated
- Links to relevant records

**Frontend Component**: `AIAssistant.jsx`
**Access**: Clinicians and caregivers only

---

#### **31. AI Insights Dashboard**

**Purpose**: Visual display of AI predictions and analytics

**Insights Displayed**:
- **Risk Score**: Current patient risk (0-100)
- **Risk Trend**: Increasing, stable, decreasing
- **Contributing Factors**: What's driving the risk
- **SHAP Values**: Feature importance visualization
- **Recommendations**: AI-suggested interventions
- **Confidence Score**: How certain the AI is
- **Historical Predictions**: Track accuracy over time

**Visualizations**:
- Risk score gauge
- Trend line charts
- Feature importance bar charts
- Timeline of predictions
- Comparison to similar patients

**Frontend Page**: `AIInsights.jsx`
**API Endpoint**: GET `/api/ai-analysis/explain/{patient_id}`

---

#### **32. Sentiment & Crisis Detection**

**Purpose**: Automatically identify emotional distress and crises

**What's Analyzed**:
- Chatbot messages
- Journal entries
- Bereavement journal
- Symptom notes
- Community posts (for moderation)

**Sentiment Scoring**:
- -1.0 (very negative) to +1.0 (very positive)
- Stored with content
- Tracked over time

**Crisis Indicators**:
- Suicidal ideation keywords
- Self-harm mentions
- Hopelessness expressions
- Emergency situation descriptions
- Severe distress language

**When Crisis Detected**:
1. Message flagged in database
2. Alert sent to care team
3. Priority escalation
4. Immediate response protocol activated
5. Human clinician notified
6. Follow-up ensured

**Database Fields**:
- `sentiment_score` - Numerical sentiment
- `crisis_flagged` - Boolean crisis indicator
- `grief_stage_hint` - Estimated grief stage

---

This covers Education, Caregiver Support, and AI features in detail. Continuing with Admin, Accessibility, Background Services, and more...


---

## 🔐 ADMIN & SYSTEM MANAGEMENT FEATURES (Detailed)

#### **36. User Management System**

**Purpose**: Complete user lifecycle management across all roles

**Features**:
- **User Creation**:
  - Username (unique identifier)
  - Email address
  - Password (hashed with bcrypt)
  - Role assignment (patient, family, caregiver, clinician, admin)
  - Full name, phone number
  - Consent tracking (GDPR compliance)
  
- **Account Security**:
  - Password strength validation (8+ chars, uppercase, number)
  - Failed login tracking (max 5 attempts)
  - Account lockout mechanism
  - Lockout expiry (30 minutes)
  - Last login timestamp
  - Session management
  
- **User Profile Management**:
  - Avatar initials
  - Department & facility assignment
  - License numbers (for clinicians)
  - Specialization tracking
  - Region assignment
  - Language preference
  - Notification preferences (email, SMS)
  
- **Account Status**:
  - Active/inactive toggle
  - Soft delete capabilities
  - Activation/deactivation tracking

**Database Tables**: 
- `users` - Core authentication & role
- `user_profiles` - Extended profile information

**API Endpoints** (Admin Router):
- GET `/api/admin/users` - List all users
- GET `/api/admin/users/{id}` - Get user details
- POST `/api/admin/users` - Create new user
- PUT `/api/admin/users/{id}` - Update user
- DELETE `/api/admin/users/{id}` - Deactivate user
- POST `/api/admin/users/{id}/reset-password` - Reset password
- POST `/api/admin/users/{id}/unlock` - Unlock account

**Access Control**: Administrators only

---

#### **37. Audit Logging System**

**Purpose**: Comprehensive tracking of all system actions for compliance and security

**What Gets Logged**:
- **User Actions**:
  - Login/logout attempts (success/failure)
  - Password changes
  - Profile updates
  
- **Patient Data Access**:
  - Patient record views
  - Vitals recording
  - Medication prescriptions
  - Assessment completions
  - Care plan modifications
  
- **Critical Operations**:
  - User creation/deletion
  - Role changes
  - Alert acknowledgments
  - Legacy consent signing
  - File uploads/deletions

**Log Fields**:
- `user_id` - Who performed action
- `user_role` - Their role at time of action
- `action` - What was done (e.g., "login", "view_patient", "prescribe_medication")
- `resource_type` - What was affected (e.g., "patient", "medication", "user")
- `resource_id` - Specific resource ID
- `patient_id` - Patient context (if applicable)
- `success` - Boolean success indicator
- `details` - JSON with additional context
- `ip_address` - Source IP (future)
- `created_at` - Timestamp

**Retention**: 
- Critical logs: 7 years (HIPAA compliance)
- Non-critical: 1 year
- Anonymization after retention period

**Database Table**: `audit_logs`

**API Endpoints**:
- GET `/api/admin/audit-logs` - Search logs
- GET `/api/admin/audit-logs/user/{user_id}` - User activity
- GET `/api/admin/audit-logs/patient/{patient_id}` - Patient access history
- GET `/api/admin/audit-logs/export` - Export for compliance

**Use Cases**:
- Security incident investigation
- Compliance audits (HIPAA, GDPR)
- User activity monitoring
- Unauthorized access detection
- Data breach analysis

---

#### **38. Authentication & Authorization System**

**Purpose**: Secure access control using industry-standard JWT tokens

**Authentication Flow**:
```
1. User submits username + password
2. Backend validates credentials
3. If valid → Generate JWT token (8-hour expiry)
4. Return token + user profile
5. Client stores token (localStorage)
6. All subsequent requests include token in header:
   Authorization: Bearer <token>
7. Backend validates token on each request
8. If expired → 401 Unauthorized
```

**Password Security**:
- Bcrypt hashing (cost factor 12)
- Never stored in plain text
- Minimum 8 characters
- Must contain: uppercase, lowercase, number
- Special characters recommended

**Account Lockout**:
- Max 5 failed login attempts
- 30-minute lockout period
- Automatic unlock after expiry
- Admin can manually unlock

**Role-Based Access Control (RBAC)**:
```python
Role Hierarchy:
- Admin: Full system access
- Clinician: All patient data, clinical features
- Caregiver: Assigned patients only, limited features
- Patient: Own data only
- Family: Linked patient data only

Permission Checks:
- @require_role(["clinician", "admin"])
- @require_patient_access(patient_id)
- @require_owner_or_role(resource, ["admin"])
```

**Token Structure**:
```json
{
  "sub": "user_id",
  "role": "clinician",
  "exp": 1738790400,
  "iat": 1738761600
}
```

**Security Headers**:
- CORS: Restricted origins
- Content-Type validation
- CSRF protection (future)
- Rate limiting (future)

**Database Fields**: 
- `users.hashed_password`
- `users.failed_logins`
- `users.locked_until`
- `users.last_login`

**API Endpoints** (Auth Router):
- POST `/api/auth/login` - Authenticate user
- POST `/api/auth/register` - Register new account (if enabled)
- POST `/api/auth/logout` - Invalidate session
- POST `/api/auth/refresh` - Refresh token
- POST `/api/auth/change-password` - Change password
- POST `/api/auth/forgot-password` - Password reset flow (future)

---

#### **39. File Upload System**

**Purpose**: Secure file storage and management for medical documents, memories, and legacy content

**Supported File Types**:
- **Images**: JPG, PNG, GIF, WEBP (Memory Vault, profiles)
- **Documents**: PDF (medical records, consent forms)
- **Audio**: MP3, WAV, OGG (voice messages, legacy recordings)
- **Video**: MP4, WEBM (memory videos, legacy messages)

**Storage Configuration**:
- Base directory: `uploads/` (configurable)
- Organized by type: `uploads/profiles/`, `uploads/memories/`, `uploads/legacy/`, `uploads/documents/`
- Unique filenames (timestamp + UUID)
- Metadata stored in database

**File Validation**:
- File type verification (MIME type + extension)
- Size limits:
  - Images: 5 MB max
  - Documents: 10 MB max
  - Audio: 20 MB max
  - Video: 50 MB max
- Virus scanning (future integration)

**Access Control**:
- Patient files: Patient + care team + family (if permitted)
- Legacy files: Heirs only (after patient death)
- Medical documents: Clinical staff only
- Profile pictures: Public within platform

**Features**:
- Chunked uploads for large files
- Progress tracking
- Automatic thumbnail generation (images)
- Metadata extraction (duration, dimensions)
- Secure deletion (overwrite before delete)

**Database Tracking**:
- `legacy_content.media_path`
- `bereavement_entries.media_path`
- `resources.media_url`
- File upload audit logs

**API Endpoints** (Uploads Router):
- POST `/api/uploads/profile-picture` - Upload profile image
- POST `/api/uploads/memory` - Upload memory file
- POST `/api/uploads/legacy-content` - Upload legacy file
- POST `/api/uploads/document` - Upload medical document
- GET `/api/uploads/{file_id}` - Download file
- DELETE `/api/uploads/{file_id}` - Delete file

**Future Enhancements**:
- Cloud storage (S3, Azure Blob)
- CDN integration
- Image optimization
- Video transcoding

---

#### **40. Settings & Preferences System**

**Purpose**: Customizable user experience and notification management

**User Settings Categories**:

**1. Profile Information**:
- Full name
- Department & facility
- License number (clinicians)
- Specialization
- Contact phone
- Avatar/initials

**2. Notification Preferences**:
- Email notifications (on/off)
- SMS notifications (on/off)
- Appointment reminders (24h, 1h, both, none)
- Medication reminders (on/off)
- Alert notifications (critical only, all, none)
- Message notifications (real-time, digest, off)
- Frequency: instant, hourly digest, daily digest

**3. Language & Localization**:
- Interface language (English, Twi, Ga, Ewe, Hausa, Dagbani)
- Date format (DD/MM/YYYY, MM/DD/YYYY)
- Time format (12-hour, 24-hour)
- Timezone (GMT/UTC)

**4. Accessibility Preferences**:
- Screen reader mode
- High contrast theme
- Font size (75%, 100%, 125%, 150%)
- Reduce motion
- Voice control
- Touch sounds
- Haptic feedback

**5. Privacy Settings**:
- Profile visibility
- Activity status
- Community display name
- Share statistics (anonymous)

**6. Clinical Preferences** (Clinicians):
- Default care pathway
- Assessment reminder frequency
- Dashboard layout
- Patient list sorting

**Database Tables**:
- `user_profiles` - Profile settings
- `patient_preferences` - Patient-specific (from questionnaire)
- `users` - Core preferences

**API Endpoints** (Profile Router):
- GET `/api/profile` - Get current user profile
- PUT `/api/profile` - Update profile
- PUT `/api/profile/notifications` - Update notification settings
- PUT `/api/profile/language` - Change language
- PUT `/api/profile/accessibility` - Update accessibility
- GET `/api/profile/settings` - Get all settings

**Workflow**:
1. User accesses Settings page
2. Modifies preferences
3. Saves changes
4. Backend validates & updates database
5. Settings immediately applied to session
6. Toast confirmation shown
7. Some settings require page reload (language)



---

## ♿ ACCESSIBILITY FEATURES (Detailed)

#### **41. Screen Reader Support (WCAG 2.1 AA)**

**Purpose**: Enable blind and low-vision users to navigate and use the platform

**Implementation**:
- **ARIA Labels**: All interactive elements labeled
  - Buttons: `<button aria-label="Save patient record">`
  - Icons: `<AlertCircle aria-hidden="true" />` (decorative)
  - Forms: `<input aria-label="Patient name" aria-required="true">`
  - Navigation: `<nav aria-label="Main navigation">`
  
- **Semantic HTML**:
  - Proper heading hierarchy (h1 → h2 → h3)
  - `<main>`, `<nav>`, `<aside>`, `<section>` landmarks
  - `<table>` with `<caption>`, `<thead>`, `<th scope="col">`
  - Lists: `<ul>`, `<ol>` for related items
  
- **Focus Management**:
  - Skip to main content link
  - Focus indicators (2px solid border)
  - Focus trap in modals
  - Focus restoration after modal close
  
- **Alt Text**:
  - All images: `<img alt="Patient vital signs graph">`
  - Decorative images: `alt=""` (empty)
  - Complex images: Link to long description
  
- **Screen Reader Announcements**:
  - Live regions: `<div aria-live="polite">` for status updates
  - Alert region: `<div role="alert">` for critical messages
  - Toast notifications: Announced automatically
  
- **Form Accessibility**:
  - Labels associated: `<label htmlFor="email">Email</label>`
  - Error messages: `aria-describedby="email-error"`
  - Required fields: `aria-required="true"`
  - Field instructions: Connected via `aria-describedby`

**Tested With**:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS, iOS)
- TalkBack (Android)

---

#### **42. Keyboard Navigation**

**Purpose**: Full platform access without mouse

**Keyboard Controls**:
- **Tab**: Move to next interactive element
- **Shift + Tab**: Move to previous element
- **Enter**: Activate button/link
- **Space**: Toggle checkbox, activate button
- **Escape**: Close modal/dialog
- **Arrow keys**: Navigate within components (menus, tabs)
- **Home/End**: Jump to first/last element

**Focus Indicators**:
- Visible 2px outline on all interactive elements
- High contrast focus ring (blue/yellow for dark mode)
- Focus persists during interaction
- No focus on non-interactive elements

**Tab Order**:
- Logical flow (left-to-right, top-to-bottom)
- Skip navigation link at top
- No tabindex > 0 (natural order)
- Modals trap focus (can't tab outside)
- Disabled elements removed from tab order

**Keyboard Shortcuts** (Future):
- `Ctrl + /` - Open command palette
- `Ctrl + K` - Search
- `Ctrl + N` - New patient
- `Ctrl + S` - Save
- `?` - Show keyboard shortcuts

---

#### **43. Voice Control**

**Purpose**: Hands-free operation for motor-impaired users

**Web Speech API Integration**:
- Voice input for text fields
- Voice commands for navigation
- Text-to-speech for content reading

**Voice Commands**:
- "Go to patients" → Navigate to patients page
- "Open menu" → Expand navigation
- "Search for..." → Activate search
- "Save" → Submit current form
- "Cancel" → Close modal
- "Read page" → TTS narration

**Features**:
- Microphone permission request
- Visual indicator when listening
- Confidence threshold (90%+)
- Fallback to keyboard input
- Multi-language voice recognition

**Privacy**:
- Voice data not stored
- Processing happens locally (browser API)
- Optional feature (opt-in)

---

#### **44. Touch Optimization**

**Purpose**: Mobile-friendly experience for touchscreen devices

**Touch Targets**:
- Minimum 44px × 44px (WCAG AAA)
- Spacing between targets: 8px minimum
- Large buttons on mobile
- Swipe gestures for navigation

**Touch Interactions**:
- Tap: Primary action
- Double-tap: Zoom (where applicable)
- Long press: Context menu
- Swipe left/right: Navigate between items
- Pinch: Zoom in/out (images, charts)

**Haptic Feedback**:
- Button press: Light tap
- Success action: Success pattern
- Error: Warning pattern
- Alert received: Notification pattern

**Touch Sounds**:
- Button click: Soft click sound
- Success: Chime
- Error: Gentle warning tone
- Configurable (on/off)

**Mobile Optimizations**:
- No hover-dependent interactions
- Touch-friendly form controls
- Large tap targets for checkboxes/radio
- Easy-to-tap links

---

#### **45. Visual Accessibility**

**Purpose**: Support users with color blindness and low vision

**High Contrast Mode**:
- Toggle in settings
- WCAG AAA contrast ratios (7:1)
- Text: Pure black on pure white
- Borders: High contrast outlines
- Icons: Filled solid colors
- No reliance on color alone

**Font Size Adjustment**:
- 75% (small)
- 100% (default)
- 125% (large)
- 150% (extra large)
- Affects all text
- Layout adapts to prevent overflow
- Preserves readability

**Color Blind Friendly Palettes**:
- Protanopia support (red-blind)
- Deuteranopia support (green-blind)
- Tritanopia support (blue-blind)
- Uses patterns + color for status
- Icon + text labels (not color alone)

**Color Contrast**:
- Primary text: 16:1 (dark on white)
- Secondary text: 7:1
- Disabled text: 4.5:1
- Borders: 3:1
- Focus indicators: 3:1

**Visual Hierarchy**:
- Clear headings (size + weight)
- Whitespace for separation
- Consistent layouts
- Predictable navigation
- Visual cues for relationships

---

#### **46. Motion & Animation Controls**

**Purpose**: Prevent vestibular disorders and motion sickness

**Reduce Motion Setting**:
- Honors OS preference: `prefers-reduced-motion`
- Manual toggle in settings
- Disables:
  - Page transitions
  - Element animations
  - Auto-playing carousels
  - Parallax effects
  - Animated backgrounds

**When Reduced Motion Active**:
- Instant state changes (no fade/slide)
- Static page loads
- Crossfade instead of slide
- No bouncing/rotating elements
- Scroll behavior: smooth → auto

**Animation Options**:
- None (instant)
- Reduced (fade only)
- Normal (default)
- Enhanced (full animations)

**Safe Animations**:
- Short durations (< 300ms)
- Subtle movements
- No flashing (seizure risk)
- User-initiated (not auto)

---

#### **47. Text & Readability**

**Purpose**: Improve reading comprehension for all users

**Dyslexia-Friendly Font**:
- OpenDyslexic font option
- Weighted bottoms (prevent letter flipping)
- Unique letter shapes
- Increased spacing
- Optional in settings

**Text Spacing**:
- Line height: 1.5× font size minimum
- Paragraph spacing: 2× font size
- Letter spacing: 0.12× font size
- Word spacing: 0.16× font size
- Adjustable in settings

**Text Customization**:
- Font family choice
- Text alignment (left, justified)
- Background color
- Text color
- Reading ruler (future)

**Readability Features**:
- Short paragraphs
- Bullet points for lists
- Descriptive headings
- Simple language (B1 level target)
- Plain language summaries for technical content

**Screen Reader Announcements**:
- Status changes: "Patient record saved"
- Errors: "Error: Please fill required fields"
- Loading states: "Loading patient data"
- Completion: "Form submitted successfully"

---

#### **48. Multi-language Support**

**Purpose**: Serve Ghana's diverse linguistic population

**Supported Languages**:
1. **English** (official, medical terminology)
2. **Twi** (Akan, most widely spoken)
3. **Ga** (Greater Accra region)
4. **Ewe** (Volta region)
5. **Hausa** (Northern Ghana)
6. **Dagbani** (Northern Ghana)

**Localization Features**:
- UI translation (buttons, labels, messages)
- Content translation (resources, guides)
- Medical term glossary per language
- Cultural adaptations (greetings, idioms)
- Right-to-left (RTL) support ready (future Arabic)

**Language Switcher**:
- Globe icon in header
- Dropdown with all languages
- Instant switching (no reload)
- Persists across sessions
- Per-user preference

**Translation Coverage**:
- 100%: UI elements, navigation, buttons
- 80%: Educational resources (prioritized content)
- 60%: Community content (user-generated)
- 100%: Critical messages (alerts, errors)

**Implementation**:
- i18n framework (react-i18next or similar)
- JSON language files
- Fallback to English
- Professional medical translations
- Community contributions for non-critical

**Cultural Considerations**:
- Respectful terms for death/dying
- Spiritual language appropriateness
- Family structure terminology
- Local health practices acknowledgment



---

## ⚙️ BACKGROUND SERVICES (Detailed)

ProjectAura runs 3 autonomous background services that continuously monitor the system and trigger automated actions.

#### **Service 1: Proactive Monitoring Loop** 🤖

**Purpose**: Continuously analyze all patients for clinical deterioration and risk changes

**Frequency**: Every 5 minutes (300 seconds)

**What It Does**:
1. **Fetches all non-deceased patients**
2. **For each patient**:
   - Loads latest vitals (last 48 hours)
   - Loads recent symptoms
   - Loads medication adherence
   - Loads assessment scores
   - Analyzes using AI risk model
   
3. **Risk Analysis**:
   - Calculates risk score (0-100)
   - Determines risk level (low, moderate, high, critical)
   - Generates SHAP explanations
   - Creates plain-language recommendations
   
4. **Alert Generation** (if risks detected):
   - Checks for duplicate alerts (last hour)
   - Creates new alert if none exists
   - Triggers notification queue
   - Logs journey event for high/critical alerts
   
5. **Alert Types Created**:
   - Patient deterioration
   - High risk score increase
   - Critical clinical pattern
   - Rapid decline detected
   - Overdue assessment

**Code Location**: `backend/main.py` → `proactive_monitoring_loop()`

**Database Impact**:
- Reads: `patients`, `vitals`, `symptoms`, `medications`, `alerts`
- Writes: `alerts`, `patient_journey_events`

**Performance**:
- Asynchronous (non-blocking)
- Processes ~10-20 patients per minute
- Scales with patient count
- Error handling per patient (one failure doesn't stop loop)

**Example Alert Created**:
```python
{
  "patient_id": 123,
  "type": "patient_deterioration",
  "severity": "high",
  "message": "Patient vitals showing concerning trends. Oxygen saturation declining.",
  "value": "O2: 89%",
  "triggered_at": "2026-06-05 14:30:00"
}
```

---

#### **Service 2: Notification Monitoring Loop** 🔔

**Purpose**: Monitor appointments, medications, and vitals to send timely notifications

**Frequency**: Every 5 minutes (300 seconds)

**What It Does**:

**A. Appointment Reminders**:
1. Fetch upcoming appointments (next 24 hours + next 1 hour)
2. Check if reminder already sent
3. Create notifications:
   - **24-hour reminder**: "Appointment tomorrow at 2:00 PM"
   - **1-hour reminder**: "Appointment in 1 hour at Dr. Smith's office"
4. Send to patient + assigned clinician

**B. Medication Reminders & Missed Dose Alerts**:
1. Fetch all active medications
2. Parse frequency to calculate next dose times
3. For each scheduled dose:
   - **15 minutes before**: Send reminder
   - **30 minutes after**: Check if logged
   - **If not logged**: Send missed dose alert
4. Examples:
   - "Time to take Morphine 10mg" (15 min before)
   - "Missed dose: Morphine 10mg was due at 2:00 PM" (30 min after)

**C. Critical Vitals Alerts**:
1. Fetch recent vitals (last hour)
2. Check thresholds:
   - O2 < 90%
   - HR < 50 or > 120
   - BP sys > 180 or < 90
   - Temp > 38.5°C or < 35°C
3. Create critical alert notifications
4. Send to clinical team immediately

**Notification Creation**:
```python
notification = NotificationQueue(
    recipient_id=patient.user_id,
    notification_type="medication_reminder",
    title="💊 Medication Reminder",
    body="Time to take Morphine 10mg (oral)",
    is_sent=True,
    sent_at=datetime.utcnow()
)
```

**Code Location**: `backend/services/notification_service.py`

**Database Impact**:
- Reads: `appointments`, `medications`, `medication_adherence_logs`, `vitals`
- Writes: `notification_queue`

**Rate Limiting**:
- Max 1 notification per topic per hour (prevent spam)
- Deduplicated by content hash
- Patient can adjust frequency in settings

---

#### **Service 3: Journey Tracker** 📍

**Purpose**: Automatically log significant patient events for timeline visualization

**Triggering Events** (Real-time, not polled):

1. **Clinical Events**:
   - Appointment completed → "Attended appointment with Dr. Smith"
   - Medication prescribed → "New medication: Morphine 10mg prescribed"
   - Assessment completed → "ESAS assessment completed (score: 45)"
   - Care plan updated → "Care plan revised"
   - Vitals recorded → "Vitals recorded: O2 89%, HR 95" (if abnormal)

2. **Status Changes**:
   - Patient status changed → "Status changed to Critical"
   - Admission → "Admitted to facility"
   - Discharge → "Discharged to home care"
   - Deceased → "Patient passed away peacefully"

3. **Alert Events**:
   - High/critical alert → "Critical Alert: Oxygen saturation low"
   - Alert acknowledged → "Alert resolved by Dr. Smith"

4. **Legacy & Memory**:
   - Legacy consent signed → "Digital legacy consent signed"
   - Heir designated → "Heir designated: John Doe (son)"
   - Legacy content created → "Final message created"

5. **Social & Support**:
   - Joined community group → "Joined Cancer Support Community"
   - Family member added → "Family member Jane Doe linked"

**Event Structure**:
```python
journey_event = PatientJourneyEvent(
    patient_id=123,
    event_type="appointment_completed",
    event_title="Follow-up Appointment",
    event_detail="Reviewed medication effectiveness. Patient reports improved pain control.",
    clinical_note="Morphine effective. Continue current dose.",
    is_milestone=False,
    created_by_id=clinician.id,
    created_at=datetime.utcnow()
)
```

**Milestone Events** (Special visual treatment):
- First appointment
- Care plan created
- Legacy consent signed
- Discharge
- Remission (cancer)
- Status improvements

**Code Location**: `backend/services/journey_tracker.py`

**Functions**:
- `track_appointment(db, patient_id, appointment_id, clinician_id, details)`
- `track_medication_prescribed(db, patient_id, medication_name, prescriber_id)`
- `track_assessment_completed(db, patient_id, assessment_type, score)`
- `track_status_change(db, patient_id, old_status, new_status, changed_by_id)`
- `track_critical_alert(db, patient_id, alert_type, severity, details)`
- `track_legacy_consent(db, patient_id, witnessed_by_id)`

**Database Impact**:
- Writes: `patient_journey_events`
- No reads (triggered by other operations)

**Performance**:
- Synchronous (happens immediately after triggering event)
- <10ms overhead per event
- Indexed by patient_id and created_at for fast timeline queries

---

## 🌐 COMPLETE API ENDPOINTS REFERENCE

ProjectAura backend has **30+ routers** with **200+ API endpoints**. Below is the comprehensive reference.

### **Router 1: Authentication** (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Authenticate user, returns JWT token | No |
| POST | `/api/auth/register` | Register new user account | No |
| POST | `/api/auth/logout` | Invalidate session | Yes |
| POST | `/api/auth/refresh` | Refresh expired token | Yes |
| POST | `/api/auth/change-password` | Change user password | Yes |
| GET | `/api/auth/me` | Get current authenticated user | Yes |

---

### **Router 2: Patients** (`/api/patients`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/patients` | List all patients (filtered by role) | Yes | All |
| GET | `/api/patients/{id}` | Get patient details | Yes | Clinician, Caregiver (assigned), Patient (self), Family (linked) |
| POST | `/api/patients` | Create new patient | Yes | Clinician, Admin |
| PUT | `/api/patients/{id}` | Update patient | Yes | Clinician, Admin |
| DELETE | `/api/patients/{id}` | Soft delete patient | Yes | Admin |
| GET | `/api/patients/{id}/summary` | Get patient summary (vitals, meds, alerts) | Yes | Clinical staff |
| GET | `/api/patients/{id}/risk` | Get AI risk assessment | Yes | Clinician |
| POST | `/api/patients/{id}/predict-risk` | Trigger risk prediction | Yes | Clinician |

---

### **Router 3: Vitals** (`/api/vitals`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/vitals` | Record new vitals | Yes | Caregiver, Clinician |
| GET | `/api/vitals/{patient_id}` | Get patient vitals history | Yes | Clinical staff |
| GET | `/api/vitals/{patient_id}/latest` | Get most recent vitals | Yes | Clinical staff |
| GET | `/api/vitals/{id}` | Get specific vital record | Yes | Clinical staff |
| GET | `/api/vitals/{patient_id}/trends` | Get vitals trends (7/30 days) | Yes | Clinician |

---

### **Router 4: Symptoms** (`/api/symptoms`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/symptoms` | Record symptoms | Yes | Patient (self), Caregiver, Clinician |
| GET | `/api/symptoms/{patient_id}` | Get symptom history | Yes | Clinical staff, Patient (self) |
| GET | `/api/symptoms/{patient_id}/latest` | Get most recent symptoms | Yes | Clinical staff, Patient (self) |
| GET | `/api/symptoms/{patient_id}/trends` | Symptom trends over time | Yes | Clinician |

---

### **Router 5: Medications** (`/api/medications`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/medications` | Prescribe medication | Yes | Clinician |
| GET | `/api/medications` | Get patient medications (query param: patient_id) | Yes | Clinical staff, Patient (self) |
| GET | `/api/medications/{id}` | Get medication details | Yes | Clinical staff |
| PUT | `/api/medications/{id}` | Update medication | Yes | Clinician |
| DELETE | `/api/medications/{id}` | Discontinue medication | Yes | Clinician |
| POST | `/api/medications/{id}/log-adherence` | Log dose taken/missed | Yes | Patient, Caregiver |
| GET | `/api/medications/{id}/adherence` | Get adherence logs | Yes | Clinical staff |
| GET | `/api/medications/{patient_id}/schedule` | Get today's medication schedule | Yes | Patient, Caregiver |

---

### **Router 6: Appointments** (`/api/appointments`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/appointments` | Create appointment | Yes | Clinician, Admin |
| GET | `/api/appointments` | List appointments (filtered by role) | Yes | All |
| GET | `/api/appointments/{id}` | Get appointment details | Yes | Involved parties |
| PUT | `/api/appointments/{id}` | Update appointment | Yes | Clinician, Admin |
| DELETE | `/api/appointments/{id}` | Cancel appointment | Yes | Clinician, Admin |
| POST | `/api/appointments/{id}/complete` | Mark as completed | Yes | Clinician |
| GET | `/api/appointments/upcoming` | Get upcoming appointments | Yes | All |

---

### **Router 7: Clinical Assessments** (`/api/assessments`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/assessments/esas` | Submit ESAS assessment | Yes | Clinician, Caregiver |
| POST | `/api/assessments/pps` | Submit PPS assessment | Yes | Clinician |
| POST | `/api/assessments/cognitive` | Submit MMSE/MoCA | Yes | Clinician |
| POST | `/api/assessments/phq9` | Submit PHQ-9 (depression) | Yes | Clinician |
| POST | `/api/assessments/gad7` | Submit GAD-7 (anxiety) | Yes | Clinician |
| POST | `/api/assessments/barthel` | Submit Barthel Index (ADL) | Yes | Clinician, Caregiver |
| POST | `/api/assessments/pain` | Submit Brief Pain Inventory | Yes | Clinician |
| POST | `/api/assessments/qol` | Submit Quality of Life | Yes | Clinician |
| POST | `/api/assessments/caregiver-burden` | Submit Zarit Burden Interview | Yes | Caregiver |
| POST | `/api/assessments/motor-skills` | Submit Motor Skills Assessment | Yes | Clinician |
| GET | `/api/assessments/{patient_id}` | Get all assessments for patient | Yes | Clinician |
| GET | `/api/assessments/{patient_id}/{type}` | Get specific assessment type | Yes | Clinician |
| GET | `/api/assessments/{patient_id}/{type}/latest` | Get latest assessment | Yes | Clinician |

---

### **Router 8: Alerts** (`/api/alerts`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/alerts` | Get all unacknowledged alerts | Yes | Clinician, Caregiver, Admin |
| GET | `/api/alerts/{id}` | Get alert details | Yes | Clinical staff |
| POST | `/api/alerts/{id}/acknowledge` | Acknowledge alert | Yes | Clinician |
| POST | `/api/alerts/{id}/dismiss` | Dismiss alert | Yes | Clinician |
| GET | `/api/alerts/patient/{patient_id}` | Get patient-specific alerts | Yes | Clinical staff |
| GET | `/api/alerts/critical` | Get only critical alerts | Yes | Clinical staff |

---

### **Router 9: Notifications** (`/api/notifications`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/notifications` | Get user notifications | Yes | All |
| GET | `/api/notifications/unread` | Get unread notifications | Yes | All |
| POST | `/api/notifications/{id}/read` | Mark as read | Yes | All |
| POST | `/api/notifications/read-all` | Mark all as read | Yes | All |
| DELETE | `/api/notifications/{id}` | Delete notification | Yes | All |
| POST | `/api/notifications/clear-read` | Clear all read notifications | Yes | All |



---

### **Router 10: Care Plans** (`/api/care-plans`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/care-plans` | Create care plan | Yes | Clinician |
| GET | `/api/care-plans/{patient_id}` | Get patient care plans | Yes | Clinical staff, Patient (self), Family (linked) |
| GET | `/api/care-plans/{patient_id}/current` | Get current active care plan | Yes | Clinical staff, Patient, Family |
| PUT | `/api/care-plans/{id}` | Update care plan | Yes | Clinician |
| GET | `/api/care-plans/{id}` | Get specific care plan | Yes | Clinical staff |

---

### **Router 11: Clinical Notes** (`/api/notes`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/notes` | Create clinical note | Yes | Clinician, Caregiver |
| GET | `/api/notes/{patient_id}` | Get patient notes | Yes | Clinician |
| GET | `/api/notes/{id}` | Get specific note | Yes | Clinician |
| PUT | `/api/notes/{id}` | Update note | Yes | Author only |
| DELETE | `/api/notes/{id}` | Delete note | Yes | Author, Admin |

---

### **Router 12: Dashboard** (`/api/dashboard`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/dashboard/stats` | Get overview statistics | Yes | Clinician, Admin |
| GET | `/api/dashboard/patient-summary` | Get patient summaries | Yes | Clinical staff |
| GET | `/api/dashboard/alerts-summary` | Get alerts breakdown | Yes | Clinician |
| GET | `/api/dashboard/appointments-today` | Today's appointments | Yes | Clinician, Caregiver |
| GET | `/api/dashboard/medication-adherence` | System-wide adherence rates | Yes | Admin |

---

### **Router 13: AI & Intelligent Care** (`/api/ai`, `/api/intelligent-care`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/ai/analyze-patient` | Trigger AI analysis | Yes | Clinician |
| GET | `/api/ai/insights/{patient_id}` | Get AI insights | Yes | Clinician |
| POST | `/api/ai/recommendations` | Get care recommendations | Yes | Clinician |
| GET | `/api/intelligent-care/risk-assessment/{patient_id}` | Get risk assessment | Yes | Clinician |
| GET | `/api/intelligent-care/trends/{patient_id}` | Get predictive trends | Yes | Clinician |

---

### **Router 14: Chatbot (AuraChat)** (`/api/chatbot`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/chatbot/session/start` | Start chatbot session | Yes | All |
| POST | `/api/chatbot/message` | Send message to chatbot | Yes | All |
| GET | `/api/chatbot/session/{session_id}` | Get session history | Yes | All |
| POST | `/api/chatbot/session/{session_id}/end` | End session | Yes | All |
| POST | `/api/chatbot/escalate` | Escalate to human | Yes | All |

---

### **Router 15: Resources** (`/api/resources`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/resources` | List educational resources (filtered) | Yes | All |
| GET | `/api/resources/{id}` | Get resource details | Yes | All |
| POST | `/api/resources` | Create resource | Yes | Admin, Clinician |
| PUT | `/api/resources/{id}` | Update resource | Yes | Admin, Clinician |
| DELETE | `/api/resources/{id}` | Delete resource | Yes | Admin |
| POST | `/api/resources/{id}/bookmark` | Bookmark resource | Yes | All |
| DELETE | `/api/resources/{id}/bookmark` | Remove bookmark | Yes | All |
| POST | `/api/resources/{id}/feedback` | Mark helpful/not helpful | Yes | All |
| GET | `/api/resources/recommended` | Get personalized recommendations | Yes | All |
| GET | `/api/resources/categories` | Get all categories | Yes | All |

---

### **Router 16: Community** (`/api/community`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/community/groups` | List all groups | Yes | All |
| GET | `/api/community/groups/{id}` | Get group details | Yes | All |
| POST | `/api/community/groups` | Create group | Yes | Admin |
| POST | `/api/community/groups/{id}/join` | Join group | Yes | All |
| POST | `/api/community/groups/{id}/leave` | Leave group | Yes | All |
| GET | `/api/community/groups/{id}/posts` | Get group posts | Yes | Group members |
| POST | `/api/community/groups/{id}/posts` | Create post | Yes | Group members |
| POST | `/api/community/posts/{id}/react` | React to post | Yes | All |
| POST | `/api/community/posts/{id}/flag` | Flag inappropriate post | Yes | All |
| POST | `/api/community/posts/{id}/hide` | Hide post (moderator) | Yes | Admin, Clinician |
| POST | `/api/community/posts/{id}/unhide` | Unhide post | Yes | Admin |

---

### **Router 17: Messaging** (`/api/messaging`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/messaging/conversations` | List user conversations | Yes | All |
| POST | `/api/messaging/conversations` | Create conversation | Yes | All |
| GET | `/api/messaging/conversations/{id}` | Get conversation details | Yes | Participants |
| GET | `/api/messaging/conversations/{id}/messages` | Get messages | Yes | Participants |
| POST | `/api/messaging/conversations/{id}/messages` | Send message | Yes | Participants |
| POST | `/api/messaging/conversations/{id}/read` | Mark conversation as read | Yes | Participants |
| POST | `/api/messaging/conversations/{id}/participants` | Add participant | Yes | Creator |
| DELETE | `/api/messaging/conversations/{id}/participants/{user_id}` | Remove participant | Yes | Creator |

---

### **Router 18: Digital Legacy** (`/api/legacy`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/legacy/consent` | Sign legacy consent | Yes | Patient |
| GET | `/api/legacy/consent/{patient_id}` | Get consent status | Yes | Patient, Clinician (witness) |
| PUT | `/api/legacy/consent/{id}` | Update consent | Yes | Patient |
| POST | `/api/legacy/consent/{id}/revoke` | Revoke consent | Yes | Patient |
| POST | `/api/legacy/heirs` | Designate heir | Yes | Patient |
| GET | `/api/legacy/heirs/{patient_id}` | List heirs | Yes | Patient |
| PUT | `/api/legacy/heirs/{id}` | Update heir | Yes | Patient |
| DELETE | `/api/legacy/heirs/{id}` | Remove heir | Yes | Patient |
| POST | `/api/legacy/content` | Create legacy content | Yes | Patient |
| GET | `/api/legacy/content/{patient_id}` | List legacy content | Yes | Patient (creator), Heirs (after death) |
| GET | `/api/legacy/content/{id}` | Get content details | Yes | Patient, Heir (if authorized) |
| PUT | `/api/legacy/content/{id}` | Update content | Yes | Patient |
| DELETE | `/api/legacy/content/{id}` | Delete content | Yes | Patient |
| POST | `/api/legacy/activate/{patient_id}` | Activate legacy (after death) | Yes | Admin, Clinician |

---

### **Router 19: Bereavement** (`/api/bereavement`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/bereavement/entries` | Create bereavement entry | Yes | Family, Patient (anticipatory grief) |
| GET | `/api/bereavement/entries/{patient_id}` | Get entries for patient | Yes | Family (linked), Patient |
| GET | `/api/bereavement/entries/{id}` | Get specific entry | Yes | Author, Family (if not private) |
| PUT | `/api/bereavement/entries/{id}` | Update entry | Yes | Author |
| DELETE | `/api/bereavement/entries/{id}` | Delete entry | Yes | Author |
| GET | `/api/bereavement/prompts` | Get journaling prompts | Yes | All |
| GET | `/api/bereavement/resources` | Get grief resources | Yes | All |

---

### **Router 20: Journey Timeline** (`/api/journey`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/journey/{patient_id}` | Get patient journey timeline | Yes | Clinical staff, Patient (self), Family (linked) |
| GET | `/api/journey/{patient_id}/milestones` | Get milestone events only | Yes | Clinical staff, Patient, Family |
| POST | `/api/journey/event` | Manually create journey event | Yes | Clinician |

---

### **Router 21: Patient Portal** (`/api/portal`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/portal/my-info` | Get patient's own information | Yes | Patient |
| GET | `/api/portal/my-appointments` | Get patient's appointments | Yes | Patient |
| GET | `/api/portal/my-medications` | Get patient's medications | Yes | Patient |
| GET | `/api/portal/my-journey` | Get patient's timeline | Yes | Patient |
| POST | `/api/portal/report-symptom` | Self-report symptoms | Yes | Patient |

---

### **Router 22: Preferences (Personalization)** (`/api/preferences`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/preferences/questionnaire` | Submit questionnaire | Yes | Patient |
| GET | `/api/preferences/{patient_id}` | Get patient preferences | Yes | Patient (self), Clinical staff |
| PUT | `/api/preferences/{patient_id}` | Update preferences | Yes | Patient |
| GET | `/api/preferences/questionnaire/prompts` | Get questionnaire questions | Yes | Patient |

---

### **Router 23: Profile** (`/api/profile`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/profile` | Get current user profile | Yes | All |
| PUT | `/api/profile` | Update profile | Yes | All |
| PUT | `/api/profile/password` | Change password | Yes | All |
| PUT | `/api/profile/notifications` | Update notification settings | Yes | All |
| PUT | `/api/profile/language` | Change language | Yes | All |
| PUT | `/api/profile/accessibility` | Update accessibility settings | Yes | All |
| POST | `/api/profile/avatar` | Upload avatar image | Yes | All |

---

### **Router 24: Admin** (`/api/admin`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/admin/users` | List all users | Yes | Admin |
| GET | `/api/admin/users/{id}` | Get user details | Yes | Admin |
| POST | `/api/admin/users` | Create user | Yes | Admin |
| PUT | `/api/admin/users/{id}` | Update user | Yes | Admin |
| DELETE | `/api/admin/users/{id}` | Deactivate user | Yes | Admin |
| POST | `/api/admin/users/{id}/reset-password` | Reset user password | Yes | Admin |
| POST | `/api/admin/users/{id}/unlock` | Unlock locked account | Yes | Admin |
| GET | `/api/admin/audit-logs` | Search audit logs | Yes | Admin |
| GET | `/api/admin/audit-logs/user/{user_id}` | User activity logs | Yes | Admin |
| GET | `/api/admin/audit-logs/patient/{patient_id}` | Patient access logs | Yes | Admin |
| GET | `/api/admin/system-stats` | System statistics | Yes | Admin |

---

### **Router 25: Caregivers** (`/api/caregivers`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/caregivers` | List all caregivers | Yes | Clinician, Admin |
| POST | `/api/caregivers/assign` | Assign caregiver to patient | Yes | Clinician, Admin |
| GET | `/api/caregivers/assignments/{caregiver_id}` | Get caregiver's assignments | Yes | Caregiver (self), Clinician, Admin |
| DELETE | `/api/caregivers/assignments/{id}` | Remove assignment | Yes | Clinician, Admin |
| GET | `/api/caregivers/{id}/workload` | Get caregiver workload | Yes | Caregiver (self), Admin |

---

### **Router 26: Caregiver Intelligence** (`/api/caregiver-intelligence`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/caregiver-intelligence/{caregiver_id}/burnout-risk` | Assess burnout risk | Yes | Caregiver (self), Admin |
| GET | `/api/caregiver-intelligence/{caregiver_id}/recommendations` | Get support recommendations | Yes | Caregiver (self), Admin |
| GET | `/api/caregiver-intelligence/workload-analysis` | System-wide workload | Yes | Admin |

---

### **Router 27: Contacts** (`/api/contacts`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/contacts/search` | Search users for messaging | Yes | All |
| GET | `/api/contacts/clinicians` | List clinicians | Yes | All |
| GET | `/api/contacts/caregivers` | List caregivers | Yes | Clinician, Admin |

---

### **Router 28: Uploads** (`/api/uploads`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/uploads/profile-picture` | Upload profile image | Yes | All |
| POST | `/api/uploads/memory` | Upload memory file | Yes | Patient, Family |
| POST | `/api/uploads/legacy-content` | Upload legacy media | Yes | Patient |
| POST | `/api/uploads/document` | Upload medical document | Yes | Clinician, Admin |
| GET | `/api/uploads/{file_id}` | Download file | Yes | Authorized users |
| DELETE | `/api/uploads/{file_id}` | Delete file | Yes | Uploader, Admin |

---

### **Router 29: AI Analysis** (`/api/ai-analysis`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/ai-analysis/risk-prediction` | ML risk prediction | Yes | Clinician |
| POST | `/api/ai-analysis/symptom-analysis` | Analyze symptom patterns | Yes | Clinician |
| POST | `/api/ai-analysis/medication-optimization` | Suggest medication adjustments | Yes | Clinician |
| GET | `/api/ai-analysis/explainability/{prediction_id}` | Get SHAP values | Yes | Clinician |

---

### **Router 30: Contacts Management** (Emergency Contacts)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/patients/{patient_id}/contacts` | Add emergency contact | Yes | Clinician, Admin |
| GET | `/api/patients/{patient_id}/contacts` | List emergency contacts | Yes | Clinical staff |
| PUT | `/api/patients/{patient_id}/contacts/{id}` | Update contact | Yes | Clinician |
| DELETE | `/api/patients/{patient_id}/contacts/{id}` | Remove contact | Yes | Clinician |

---

## 📊 API Summary Statistics

- **Total Routers**: 30+
- **Total Endpoints**: 200+
- **Authentication**: JWT Bearer Token (required on all except login/register)
- **Response Format**: JSON
- **Error Format**: `{ "detail": "Error message" }`
- **Success Format**: `{ "id": 123, ...fields }` or `{ "message": "Success", "data": {...} }`
- **HTTP Status Codes**:
  - 200: Success
  - 201: Created
  - 400: Bad Request (validation error)
  - 401: Unauthorized (missing/invalid token)
  - 403: Forbidden (insufficient permissions)
  - 404: Not Found
  - 500: Internal Server Error

**API Documentation**: Available at `http://localhost:8000/docs` (Swagger UI)



---

## 🎨 FRONTEND COMPONENTS & PAGES (Complete Reference)

### **Frontend Architecture**

```
frontend/
├── src/
│   ├── pages/          (50+ page components - full-screen routes)
│   ├── components/     (35+ reusable components)
│   ├── layouts/        (Layout wrappers: AuthLayout, MainLayout)
│   ├── lib/            (Utilities: axios config, auth helpers)
│   ├── App.jsx         (Router configuration)
│   └── main.jsx        (React entry point)
├── public/             (Static assets)
└── index.html          (HTML entry point)
```

---

### **📄 PAGE COMPONENTS (50+ Full Routes)**

#### **Authentication Pages (4)**
1. **Login.jsx** - `/login` - User authentication with JWT
2. **Register.jsx** - `/register` - New user registration
3. **ForgotPassword.jsx** - `/forgot-password` - Password reset request
4. **ResetPassword.jsx** - `/reset-password` - Complete password reset

#### **Dashboard & Overview (3)**
5. **Dashboard.jsx** - `/dashboard` - Main system overview (role-specific)
6. **PatientMonitor.jsx** - `/patient-monitor` - Real-time patient monitoring
7. **AIInsights.jsx** - `/ai-insights` - AI analytics dashboard

#### **Patient Management (4)**
8. **Patients.jsx** - `/patients` - Patient list (searchable, filterable)
9. **PatientDetail.jsx** - `/patients/:id` - Comprehensive patient view
10. **PatientPortal.jsx** - `/my-space` - Patient's personal dashboard
11. **MyJourney.jsx** - `/my-journey` - Patient journey timeline

#### **Clinical Data Entry (3)**
12. **VitalsDetail.jsx** - `/vitals/:patientId` - Record & view vitals
13. **SymptomsDetail.jsx** - `/symptoms/:patientId` - Symptom tracking
14. **WellbeingDetail.jsx** - `/wellbeing/:patientId` - Overall wellbeing assessment

#### **Medications & Appointments (3)**
15. **Medications.jsx** - `/medications` - Medication list
16. **MedicationsDetail.jsx** - `/medications/:patientId` - Patient-specific meds
17. **Appointments.jsx** - `/appointments` - Appointment calendar

#### **Clinical Assessments (12 Forms)**
18. **AssessmentDashboard.jsx** - `/assessments/:patientId` - Assessment hub
19. **ESASForm.jsx** - `/assessments/esas/:patientId` - ESAS (Edmonton Symptom)
20. **PPSForm.jsx** - `/assessments/pps/:patientId` - PPS (Palliative Performance Scale)
21. **CognitiveAssessmentForm.jsx** - `/assessments/cognitive/:patientId` - MMSE/MoCA
22. **MentalHealthForm.jsx** - `/assessments/mental-health/:patientId` - PHQ-9/GAD-7 combined
23. **BarthelIndexForm.jsx** - `/assessments/barthel/:patientId` - ADL assessment
24. **BriefPainInventoryForm.jsx** - `/assessments/pain/:patientId` - Pain assessment
25. **QualityOfLifeForm.jsx** - `/assessments/qol/:patientId` - Quality of life
26. **CaregiverBurdenForm.jsx** - `/assessments/caregiver-burden/:patientId` - Zarit scale
27. **MotorSkillsForm.jsx** - `/assessments/motor/:patientId` - Motor function

#### **Care Planning (2)**
28. **CareGuide.jsx** - `/care-guide` - Care planning dashboard
29. **CarePlanDetail.jsx** - `/care-plan/:patientId` - View/edit care plans

#### **Alerts & Notifications (3)**
30. **Alerts.jsx** - `/alerts` - Critical alerts dashboard (🚨 RED AlertCircle)
31. **Notifications.jsx** - `/notifications` - Notification center (🔔 TEAL Bell)
32. **NotificationTester.jsx** - `/test-notifications` - Testing tool (dev)

#### **Caregiver Features (2)**
33. **Caregivers.jsx** - `/caregivers` - Caregiver management
34. **AdaptiveCareGuide.jsx** - `/adaptive-care-guide` - Personalized caregiver guidance

#### **Digital Legacy System (4)**
35. **LegacySetup.jsx** - `/legacy-setup` - Initial legacy consent & configuration
36. **HeirManagement.jsx** - `/legacy-heirs` - Designate & manage heirs
37. **LegacyContentCreator.jsx** - `/legacy-content` - Create final messages
38. **MyLegacyAccess.jsx** - `/my-legacy` - Heir access to inherited content

#### **Memory & Bereavement (3)**
39. **MemoryVault.jsx** - `/memory-vault` - Store cherished memories
40. **Journal.jsx** - `/journal` - Private journaling
41. **ContinuityBridge.jsx** - `/continuity-bridge` - Bereavement support

#### **Community & Social (2)**
42. **CommunityHub.jsx** - `/community` - Support groups & peer connection
43. **Messages.jsx** - `/messages` - Secure messaging

#### **Educational Resources (1)**
44. **Resources.jsx** - `/resources` - Educational content library

#### **User Management (4)**
45. **Profile.jsx** - `/profile` - User profile view/edit
46. **Settings.jsx** - `/settings` - User preferences & settings
47. **AdminUserManagement.jsx** - `/admin/users` - Admin user management
48. **AuditLog.jsx** - `/admin/audit-log` - System audit logs

#### **Personalization (1)**
49. **PersonalisationQuest.jsx** - `/personalization-questionnaire` - 7-step onboarding

#### **Demo/Testing Pages (3)**
50. **AnimationDemo.jsx** - `/animation-demo` - Animation showcase
51. **AnimationDemoSimple.jsx** - `/animation-demo-simple` - Simplified animations
52. **TouchDemo.jsx** - `/touch-demo` - Touch interaction testing

---

### **🧩 REUSABLE COMPONENTS (35+)**

#### **Layout Components**
1. **Breadcrumbs.jsx** - Navigation breadcrumb trail
2. **PageHeader.jsx** - Standard page header with title & actions
3. **PageTransition.jsx** - Smooth page transition wrapper (Framer Motion)
4. **ModernCard.jsx** - Card container with consistent styling
5. **EmptyState.jsx** - "No data" placeholder with icon & message

#### **Navigation & Alerts**
6. **RealTimeAlerts.jsx** - 🚨 RED AlertCircle badge with pulse animation
7. **NotificationBell.jsx** - 🔔 TEAL Bell icon with badge (deprecated, merged into NotificationCenter)
8. **NotificationCenter.jsx** - 🔔 TEAL Bell with dropdown panel
9. **CriticalAlertModal.jsx** - Full-screen critical alert overlay
10. **OfflineIndicator.jsx** - Network status indicator

#### **AI & Chatbot**
11. **AuraChat.jsx** - Modern AI chatbot interface with Claude integration
12. **ChatBot.jsx** - Alternative chatbot component (legacy)
13. **AIAssistant.jsx** - Inline AI assistant for clinical decisions
14. **IntelligentRecommendations.jsx** - AI-powered care suggestions
15. **ChatSettings.jsx** - Chatbot configuration panel

#### **Forms & Input**
16. **FileUpload.jsx** - Drag-and-drop file uploader
17. **FormFileUpload.jsx** - Form-integrated file upload
18. **PasswordInput.jsx** - Password field with show/hide toggle
19. **PasswordStrength.jsx** - Real-time password strength meter
20. **VoiceInput.jsx** - Voice-to-text input component

#### **Accessibility Components**
21. **AccessibilityPanel.jsx** - Floating accessibility controls (font size, contrast, etc.)
22. **KeyboardNav.jsx** - Keyboard shortcut overlay
23. **TouchButton.jsx** - Touch-optimized button with haptics & sound

#### **User Interface**
24. **LoadingSkeleton.jsx** - Skeleton loading state
25. **SummaryCard.jsx** - Statistics card (Dashboard)
26. **ContactCard.jsx** - User contact card with avatar
27. **ContactsTab.jsx** - Contacts list component
28. **AddContactModal.jsx** - Add contact dialog
29. **SignOutModal.jsx** - Sign-out confirmation modal
30. **ResourceDownloadManager.jsx** - Resource download progress tracker

---

### **📐 LAYOUT COMPONENTS**

Located in `frontend/src/components/layout/`:

1. **AuthLayout.jsx** - Wrapper for login/register pages (centered, no nav)
2. **MainLayout.jsx** - Authenticated user layout (sidebar, header, main content area)
3. **Header.jsx** - Top navigation bar with user menu, notifications, alerts
4. **Sidebar.jsx** - Left navigation menu (role-based items)
5. **Footer.jsx** - Optional footer (copyright, links)

---

### **🎬 ANIMATION COMPONENTS**

Located in `frontend/src/components/animations/`:

1. **FadeIn.jsx** - Fade-in animation wrapper
2. **SlideUp.jsx** - Slide up from bottom
3. **ScaleIn.jsx** - Scale from 0 to 1
4. **StaggerChildren.jsx** - Stagger child animations
5. **PageTransition.jsx** - Full-page transition effects

Uses **Framer Motion** for smooth, performant animations.

---

## 🌊 DATA FLOWS & RELATIONSHIPS

### **Critical Data Flow: Vitals → Alerts → Notifications**

```
1. Caregiver records vitals via VitalsDetail.jsx
   ↓
2. POST /api/vitals → Backend validates
   ↓
3. Vitals saved to database
   ↓
4. Backend checks thresholds (O2 < 90%, HR abnormal, etc.)
   ↓
5. If abnormal → Create Alert (alerts table)
   ↓
6. Alert Monitoring Loop detects new alert (30 sec polling)
   ↓
7. Create Notification (notification_queue table)
   ↓
8. Notification appears in NotificationCenter.jsx (TEAL 🔔)
   ↓
9. Notification appears in Alerts.jsx (RED 🚨) for clinical staff
   ↓
10. Clinician acknowledges alert
   ↓
11. Alert marked as acknowledged
   ↓
12. Journey event logged (patient_journey_events)
```

---

### **Data Flow: Medication Reminders**

```
1. Clinician prescribes medication via MedicationsDetail.jsx
   ↓
2. POST /api/medications → Medication saved
   ↓
3. Notification Monitoring Loop (every 5 min)
   ↓
4. Calculates next dose times from frequency
   ↓
5. 15 minutes before dose → Create notification
   ↓
6. Notification sent to patient
   ↓
7. Patient logs dose via portal (or caregiver logs)
   ↓
8. POST /api/medications/{id}/log-adherence
   ↓
9. Adherence log created
   ↓
10. Journey event logged
```

---

### **Data Flow: AI Risk Prediction**

```
1. Proactive Monitoring Loop (every 5 min)
   ↓
2. Fetches patient data (vitals, symptoms, meds, assessments)
   ↓
3. Sends to XGBoost ML model
   ↓
4. Model predicts risk score (0-100)
   ↓
5. Generates SHAP values (feature importance)
   ↓
6. Creates plain-language explanation
   ↓
7. Saves prediction to database (predictions table)
   ↓
8. If risk increased significantly → Create alert
   ↓
9. Clinician views in AIInsights.jsx
   ↓
10. Clinician takes action (adjust care plan)
```

---

### **Data Flow: Digital Legacy Activation**

```
1. Patient creates legacy content (LegacyContentCreator.jsx)
   ↓
2. POST /api/legacy/content → Saved to legacy_content table
   ↓
3. Patient signs consent (LegacySetup.jsx)
   ↓
4. POST /api/legacy/consent → Saved to legacy_consents
   ↓
5. Patient designates heirs (HeirManagement.jsx)
   ↓
6. POST /api/legacy/heirs → Saved to legacy_heirs
   ↓
7. Patient status changes to "deceased" (PatientDetail.jsx)
   ↓
8. PUT /api/patients/{id} (status=deceased)
   ↓
9. Backend triggers legacy activation
   ↓
10. POST /api/legacy/activate/{patient_id}
   ↓
11. Heirs granted access to content
   ↓
12. Scheduled deliveries queued
   ↓
13. Heir accesses via MyLegacyAccess.jsx
   ↓
14. GET /api/legacy/content/{patient_id} (heir context)
```

---

### **Database Relationships Diagram (Key Tables)**

```
users ←→ user_profiles (1:1)
  ↓
  └─→ patients (1:many via clinician_id)
        ↓
        ├─→ vitals (1:many)
        ├─→ symptoms (1:many)
        ├─→ medications (1:many)
        │     └─→ medication_adherence_logs (1:many)
        ├─→ appointments (1:many)
        ├─→ alerts (1:many)
        ├─→ care_plans (1:many)
        ├─→ clinical_notes (1:many)
        ├─→ assessments (1:many per type, 12 tables)
        ├─→ predictions (1:many)
        ├─→ patient_journey_events (1:many)
        ├─→ patient_family_links (1:many)
        ├─→ caregiver_assignments (1:many)
        ├─→ legacy_consents (1:1)
        ├─→ legacy_heirs (1:many)
        ├─→ legacy_content (1:many)
        ├─→ bereavement_entries (1:many)
        └─→ patient_preferences (1:1)

users ←→ notification_queue (1:many via recipient_id)
users ←→ audit_logs (1:many via user_id)
users ←→ conversations ←→ messages (many:many via participants)
users ←→ community_groups ←→ community_posts (many:many)
users ←→ resource_bookmarks (many:many)
```

---

## 🎯 COMPLETE USER FLOWS (Step-by-Step)

### **User Flow 1: New Patient Onboarding (Clinician)**

1. Clinician logs in → Dashboard.jsx
2. Clicks "Add Patient" button
3. Navigates to `/patients` → Patients.jsx
4. Clicks "+ New Patient" → PatientDetail.jsx (create mode)
5. Fills form:
   - Full name, DOB, gender
   - Ghana Card, NHIS number
   - Phone, address, region
   - Primary diagnosis
   - Care pathway selection
   - Advance directive status
6. Clicks "Save Patient"
7. POST `/api/patients` → Patient created
8. Redirected to patient detail page
9. Can now record vitals, prescribe meds, schedule appointments

---

### **User Flow 2: Recording Vitals & Triggering Alert (Caregiver)**

1. Caregiver logs in → Dashboard.jsx
2. Sees assigned patients
3. Clicks patient name → PatientDetail.jsx
4. Clicks "Record Vitals" → VitalsDetail.jsx
5. Enters vitals:
   - Heart rate: 95 bpm
   - Blood pressure: 140/85 mmHg
   - **Oxygen saturation: 88%** ← Critical!
   - Temperature: 37.2°C
6. Clicks "Save Vitals"
7. POST `/api/vitals` → Backend detects O2 < 90%
8. Alert created automatically (severity: critical)
9. Notification sent to clinical team
10. Clinician sees RED pulsing 🚨 badge
11. Clicks Alerts.jsx → Sees "Critical: Oxygen saturation 88%"
12. Clicks patient link → Reviews full context
13. Takes action (oxygen therapy, call doctor)
14. Clicks "Acknowledge Alert"
15. Alert resolved, journey event logged

---

### **User Flow 3: Patient Self-Reporting Symptoms (Patient Portal)**

1. Patient logs in → PatientPortal.jsx ("My Space")
2. Sees personalized dashboard
3. Clicks "How are you feeling?" card
4. Redirected to SymptomsDetail.jsx
5. Reports symptoms:
   - Pain level: 7/10 (abdomen)
   - Nausea: Yes, level 6/10
   - Fatigue: Yes, level 8/10
   - Anxiety: Yes, level 5/10
   - Mood: "Feeling worried about tomorrow's appointment"
6. Clicks "Submit Symptoms"
7. POST `/api/symptoms` → Saved
8. Symptoms appear in clinician's view
9. If severe → May trigger AI alert
10. Journey event logged: "Patient reported symptoms"

---

### **User Flow 4: Completing Personalization Questionnaire (Patient)**

1. New patient logs in first time
2. Automatically redirected to `/personalization-questionnaire`
3. **Step 1: Language & Information Style**
   - Selects: Twi, Detailed explanations, Comfortable with tech
4. **Step 2: Health Journey**
   - Diagnosis duration: 3-6 months
   - Emotional states: [Fear, Hope, Determination]
5. **Step 3: Physical Wellbeing**
   - Symptoms: [Pain, Fatigue]
   - Activity level: Limited activities
   - Self-care: Need some help
6. **Step 4: Emotional Wellbeing**
   - Mood: 5/10
   - Coping: [Family support, Prayer]
   - Future worry: 7/10
7. **Step 5: Spiritual Preferences**
   - Religion: Christian
   - Importance: Very important
   - Wants spiritual care: Yes
8. **Step 6: Social Support**
   - Main support: Spouse
   - Connectedness: 6/10
   - Wants peer support: Yes
9. **Step 7: Preferences**
   - Content: [Audio, Simple text]
   - Frequency: Daily
   - Topics: [Pain management, Emotional support, Spiritual care]
10. Clicks "Complete Questionnaire"
11. POST `/api/preferences/questionnaire`
12. Redirected to PatientPortal.jsx with personalized content

---

### **User Flow 5: Digital Legacy Creation & Activation (Patient → Heir)**

**Phase 1: Patient Creates Legacy**
1. Patient logs in → Dashboard
2. Clicks "My Legacy" → LegacySetup.jsx
3. Reviews consent form
4. Checks permissions (share medical records, memories, messages)
5. Signs consent → Clinician witnesses signature
6. POST `/api/legacy/consent` → Consent saved
7. Clicks "Designate Heirs" → HeirManagement.jsx
8. Adds heir:
   - Name: John Doe
   - Relationship: Son
   - Email: john@example.com
   - Access level: Full access
   - Can access private: Yes
9. POST `/api/legacy/heirs` → Heir saved
10. Clicks "Create Content" → LegacyContentCreator.jsx
11. Writes final message: "Dear John, I want you to know..."
12. Uploads video message
13. Sets delivery: "After my passing"
14. Sets recipient: John Doe
15. POST `/api/legacy/content` → Content saved (encrypted)

**Phase 2: Patient Passes Away**
16. Clinician updates patient status → deceased
17. PUT `/api/patients/{id}` (status=deceased, deceased_at=now)
18. Backend triggers legacy activation
19. POST `/api/legacy/activate/{patient_id}`
20. Heirs granted access
21. Scheduled deliveries queued

**Phase 3: Heir Accesses Legacy**
22. Heir (John) logs in → MyLegacyAccess.jsx
23. Sees available legacies
24. Clicks mother's legacy
25. GET `/api/legacy/content/{patient_id}` (heir context)
26. Views final message
27. Downloads video
28. Reads medical history (if permitted)
29. Accesses Memory Vault photos
30. Uses Continuity Bridge for grief journaling



---

## 🧪 TESTING & QUALITY ASSURANCE

### **Testing Strategy**

ProjectAura employs multi-layered testing approach:

1. **Unit Testing** (Functions, Components)
2. **Integration Testing** (API endpoints, Database)
3. **End-to-End Testing** (Full user workflows)
4. **Accessibility Testing** (WCAG 2.1 AA compliance)
5. **Performance Testing** (Load, Stress)
6. **Security Testing** (Penetration, Vulnerability scanning)
7. **User Acceptance Testing** (Clinical staff, Patients)

---

### **Backend Testing**

**Framework**: pytest

**Test Coverage**:
- ✅ Authentication & Authorization
- ✅ Patient CRUD operations
- ✅ Vitals threshold detection
- ✅ Medication schedule calculations
- ✅ Alert generation logic
- ✅ AI risk prediction accuracy
- ✅ Legacy content access control
- ✅ Notification delivery
- ✅ Role-based permissions

**Sample Test Files**:
```
backend/tests/
├── test_auth.py
├── test_patients.py
├── test_vitals.py
├── test_medications.py
├── test_alerts.py
├── test_ai.py
├── test_legacy.py
├── test_assessments.py
└── test_permissions.py
```

**Running Tests**:
```bash
cd backend
pytest
pytest --cov  # With coverage report
pytest -v     # Verbose output
```

---

### **Frontend Testing**

**Frameworks**: Vitest + React Testing Library

**Test Coverage**:
- ✅ Component rendering
- ✅ User interactions (clicks, form inputs)
- ✅ API integration (mocked)
- ✅ Accessibility (a11y)
- ✅ Responsive design
- ✅ Error handling

**Sample Test Files**:
```
frontend/src/__tests__/
├── Login.test.jsx
├── Dashboard.test.jsx
├── PatientDetail.test.jsx
├── VitalsDetail.test.jsx
├── NotificationCenter.test.jsx
├── RealTimeAlerts.test.jsx
└── AccessibilityPanel.test.jsx
```

**Running Tests**:
```bash
cd frontend
npm run test
npm run test:coverage
npm run test:watch
```

---

### **Accessibility Testing Checklist**

**Manual Testing**:
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Screen reader (NVDA, JAWS, VoiceOver)
- [ ] Color contrast (WCAG AAA where possible)
- [ ] Text scaling (up to 200%)
- [ ] Voice control functionality
- [ ] Touch target size (minimum 44px)
- [ ] Focus indicators visible
- [ ] Alt text for images
- [ ] ARIA labels appropriate
- [ ] Form labels associated
- [ ] Error messages clear

**Automated Tools**:
- axe DevTools (Chrome extension)
- WAVE (Web Accessibility Evaluation Tool)
- Lighthouse (Chrome DevTools)
- Pa11y (CI integration)

**Target**: WCAG 2.1 Level AA compliance (minimum)

---

### **Performance Testing**

**Metrics to Monitor**:
- Page load time: < 2 seconds
- Time to interactive: < 3 seconds
- API response time: < 500ms (95th percentile)
- Database query time: < 100ms (average)
- Background task execution: No blocking

**Load Testing**:
- Tool: Locust or Apache JMeter
- Scenarios:
  - 100 concurrent users
  - 1000 patients in database
  - 10,000 vitals records
  - 5,000 medications
  - Real-time alerts under load

**Stress Testing**:
- Gradual load increase until system failure
- Identify bottlenecks
- Database connection pool limits
- API rate limiting effectiveness

---

### **Security Testing**

**Vulnerability Scanning**:
- OWASP ZAP (penetration testing)
- Snyk (dependency vulnerabilities)
- Bandit (Python security linter)
- npm audit (JavaScript dependencies)

**Security Checklist**:
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CSRF protection
- [ ] Authentication bypass attempts
- [ ] Authorization bypass attempts
- [ ] Session hijacking prevention
- [ ] Password hashing strength (bcrypt)
- [ ] JWT token validation
- [ ] File upload validation (malware)
- [ ] API rate limiting
- [ ] HTTPS enforcement
- [ ] Secure headers (HSTS, CSP)

**Penetration Testing**:
- External security audit (annual)
- Ghana-specific compliance (Data Protection Act)
- HIPAA compliance (international standards)
- GDPR compliance (EU standards)

---

### **User Acceptance Testing (UAT)**

**Test Groups**:
1. **Clinicians** (5-10 users)
   - Test clinical workflows
   - Assessment tools usability
   - Alert response times
   - Care plan creation

2. **Patients** (10-15 users)
   - Portal usability
   - Personalization effectiveness
   - Symptom reporting ease
   - Legacy system understanding

3. **Family Members** (5-10 users)
   - Communication effectiveness
   - Memory Vault usability
   - Bereavement support value
   - Legacy content access

4. **Caregivers** (5-10 users)
   - Vitals recording speed
   - Medication logging
   - Alert management
   - Workload balance

**UAT Scenarios**:
- Complete patient onboarding
- Record vitals and trigger alert
- Prescribe medication and set reminders
- Complete all 12 assessments
- Create and activate digital legacy
- Join community and post
- Use chatbot for support
- Navigate with screen reader
- Use with voice control

**Success Criteria**:
- 80% task completion rate
- < 5% error rate
- 4+ stars satisfaction (1-5 scale)
- < 10 seconds per common task
- 90% accessibility pass rate

---

## 🚀 DEPLOYMENT & CONFIGURATION

### **Development Environment Setup**

**Prerequisites**:
- Python 3.9+
- Node.js 16+
- PostgreSQL 14+
- Git

**Backend Setup**:
```bash
# Clone repository
git clone https://github.com/your-org/projectaura.git
cd projectaura/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with database credentials, secret keys, etc.

# Initialize database
python -c "from src.db import init_database; init_database()"

# Seed test data
python seed_database.py

# Run development server
uvicorn main:app --reload --port 8000
```

**Frontend Setup**:
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with API URL

# Run development server
npm run dev
```

**Database Setup**:
```bash
# Create PostgreSQL database
createdb projectaura

# Run migrations (if using Alembic)
alembic upgrade head
```

---

### **Environment Variables**

**Backend (.env)**:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/projectaura

# Security
SECRET_KEY=your-secret-key-here-min-32-chars
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# AI Integration
ANTHROPIC_API_KEY=your-claude-api-key-here

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# File Upload
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=50

# Email (future)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@projectaura.com
SMTP_PASSWORD=your-smtp-password

# SMS (future - for Ghana)
SMS_API_KEY=your-sms-api-key
SMS_PROVIDER=hubtel
```

**Frontend (.env)**:
```env
VITE_API_URL=http://localhost:8000
VITE_ENVIRONMENT=development
```

---

### **Production Deployment**

**Architecture**:
```
Internet → Nginx (Reverse Proxy) → FastAPI (Uvicorn)
                                 → PostgreSQL
                                 → File Storage (S3/Local)
```

**Server Requirements** (Minimum):
- CPU: 2 cores
- RAM: 4 GB
- Storage: 50 GB SSD
- OS: Ubuntu 20.04 LTS
- Network: 100 Mbps

**Deployment Steps**:

**1. Server Setup**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install python3 python3-pip postgresql nginx git -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**2. Database Setup**:
```bash
# Configure PostgreSQL
sudo -u postgres createuser projectaura
sudo -u postgres createdb projectaura
sudo -u postgres psql -c "ALTER USER projectaura WITH PASSWORD 'secure-password';"
```

**3. Backend Deployment**:
```bash
# Clone repository
cd /opt
sudo git clone https://github.com/your-org/projectaura.git
cd projectaura/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
sudo nano .env  # Add production settings

# Initialize database
python -c "from src.db import init_database; init_database()"

# Create systemd service
sudo nano /etc/systemd/system/projectaura.service
```

**Systemd Service** (`/etc/systemd/system/projectaura.service`):
```ini
[Unit]
Description=ProjectAura FastAPI Application
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/opt/projectaura/backend
Environment="PATH=/opt/projectaura/backend/venv/bin"
ExecStart=/opt/projectaura/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable projectaura
sudo systemctl start projectaura
sudo systemctl status projectaura
```

**4. Frontend Build & Deploy**:
```bash
cd /opt/projectaura/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Copy to Nginx directory
sudo cp -r dist/* /var/www/projectaura/
```

**5. Nginx Configuration**:
```nginx
# /etc/nginx/sites-available/projectaura
server {
    listen 80;
    server_name projectaura.example.com;

    # Frontend (React)
    location / {
        root /var/www/projectaura;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API documentation
    location /docs {
        proxy_pass http://127.0.0.1:8000;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/projectaura /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**6. SSL Certificate** (Let's Encrypt):
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d projectaura.example.com
sudo systemctl reload nginx
```

---

### **Backup & Disaster Recovery**

**Database Backups**:
```bash
# Daily automated backup
sudo crontab -e

# Add this line (daily at 2 AM)
0 2 * * * /usr/bin/pg_dump projectaura > /backups/projectaura_$(date +\%Y\%m\%d).sql
```

**File Backups**:
- Uploads directory: Daily sync to S3 or external storage
- Configuration files: Version controlled in Git
- Database dumps: Keep 30 days, weekly archives for 1 year

**Disaster Recovery Plan**:
1. Database restore: < 1 hour
2. Application restore: < 30 minutes
3. Full system rebuild: < 4 hours
4. Data loss tolerance: < 24 hours (daily backups)

---

### **Monitoring & Logging**

**Application Logs**:
- Location: `/var/log/projectaura/`
- Rotation: Daily, keep 30 days
- Level: INFO (production), DEBUG (development)

**Monitoring Tools**:
- Uptime: UptimeRobot or Pingdom
- Application: New Relic or DataDog
- Database: PostgreSQL logs + pg_stat_statements
- Server: Netdata or Prometheus + Grafana

**Alerts** (Set up notifications for):
- API response time > 2 seconds
- Database connections > 80% of pool
- Disk usage > 80%
- Memory usage > 90%
- 5xx errors > 10 per minute
- Background task failures

---

### **Scaling Strategy**

**Horizontal Scaling**:
1. Add more Uvicorn workers (CPU-bound tasks)
2. Deploy multiple backend servers behind load balancer
3. Database read replicas (for heavy read workloads)
4. Redis for caching (session, API responses)
5. CDN for static assets (Cloudflare, AWS CloudFront)

**Vertical Scaling**:
1. Increase server resources (CPU, RAM)
2. Optimize database queries (indexes, query plans)
3. Connection pooling (SQLAlchemy, pgBouncer)

**Ghana-Specific Considerations**:
- Low-bandwidth optimization (aggressive caching, compressed assets)
- Offline-first features (PWA, service workers)
- Regional data centers (Accra, Kumasi)
- Multi-language content delivery
- Mobile-first design (majority access via phones)

---

## 🔐 SECURITY & COMPLIANCE

### **Security Architecture**

**Layers of Security**:
1. **Network Layer**: Firewall, DDoS protection, HTTPS
2. **Application Layer**: Input validation, XSS/CSRF prevention, rate limiting
3. **Authentication Layer**: JWT tokens, password hashing, MFA (future)
4. **Authorization Layer**: Role-based access control (RBAC)
5. **Data Layer**: Encryption at rest, encrypted backups, audit logging

---

### **Data Protection**

**Encryption**:
- **In Transit**: TLS 1.3 (HTTPS)
- **At Rest**: PostgreSQL encryption (future), encrypted file storage
- **Passwords**: Bcrypt (cost factor 12)
- **JWT Tokens**: HS256 algorithm, 8-hour expiry
- **Legacy Content**: AES-256 encryption (future)

**Data Minimization**:
- Collect only necessary information
- Anonymize community posts
- Pseudonymize analytics data
- Regular data purging (old logs, expired tokens)

**Patient Rights**:
- **Right to Access**: Patients can download their data
- **Right to Rectification**: Patients can correct information
- **Right to Erasure**: Patients can request deletion (with legal exceptions)
- **Right to Portability**: Data export in JSON/CSV format
- **Right to Revoke**: Legacy consent revocable at any time

---

### **Compliance Frameworks**

**HIPAA Compliance** (US Standard - Best Practice):
- ✅ Access controls (role-based)
- ✅ Audit logging (all data access)
- ✅ Encryption (in transit)
- ✅ Breach notification procedures
- ✅ Business associate agreements
- ⏳ Physical safeguards (production)
- ⏳ Encryption at rest (future)

**GDPR Compliance** (EU Standard - Best Practice):
- ✅ Consent management (explicit, revocable)
- ✅ Data subject rights (access, rectification, erasure)
- ✅ Privacy by design (built-in)
- ✅ Data breach notification (72-hour)
- ✅ Data portability
- ⏳ Data protection officer (DPO) appointment
- ⏳ Data processing agreements

**Ghana Data Protection Act (2012)**:
- ✅ Lawful data processing
- ✅ Purpose limitation (specific, legitimate)
- ✅ Data minimization
- ✅ Accuracy maintenance
- ✅ Storage limitation (retention policies)
- ✅ Security measures
- ⏳ Registration with Data Protection Commission

---

### **Audit & Compliance Reporting**

**Audit Logs Include**:
- Who accessed what data (user ID, role)
- When it was accessed (timestamp)
- What action was performed (view, edit, delete)
- Success or failure
- Patient context (if applicable)
- IP address (future)
- Device information (future)

**Compliance Reports** (Generate on Demand):
- Data access report (by user, by patient, by date range)
- Security incidents report
- Consent status report (legacy, research)
- Data retention report
- User activity summary
- System uptime & availability

**Retention Policy**:
- Medical records: 7 years (HIPAA standard)
- Audit logs: 7 years
- User accounts: Indefinite (active), 1 year (inactive)
- Legacy content: Indefinite (heir access)
- Community posts: Indefinite (anonymized)
- Bereavement journals: Indefinite (family access)

---

## 📚 DOCUMENTATION SUMMARY

### **What This Document Covers**

✅ **Complete System Architecture** (3-tier design)  
✅ **Technology Stack** (Frontend, Backend, AI, Infrastructure)  
✅ **Database Schema** (40+ tables, all relationships)  
✅ **All 52+ Major Features** (Detailed breakdowns)  
✅ **User Roles & Permissions** (Complete matrix)  
✅ **200+ API Endpoints** (30 routers documented)  
✅ **50+ Frontend Pages** (All routes)  
✅ **35+ Reusable Components** (All documented)  
✅ **3 Background Services** (Monitoring, Notifications, Journey Tracker)  
✅ **Data Flows** (Critical workflows with diagrams)  
✅ **User Flows** (5+ complete scenarios)  
✅ **Testing Strategy** (Backend, Frontend, Accessibility, Security)  
✅ **Deployment Guide** (Development, Production)  
✅ **Security & Compliance** (HIPAA, GDPR, Ghana standards)  
✅ **Accessibility Features** (8 comprehensive features)

---

### **Additional Resources**

- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Source Code**: GitHub repository
- **User Guides**: See `ACCESSIBILITY_USER_GUIDE.md`, `ALL_DONE_START_HERE.md`
- **Feature Lists**: See `COMPREHENSIVE_FEATURES_LIST.md`
- **Testing Checklists**: See `ACCESSIBILITY_TESTING_CHECKLIST.md`

---

### **System Statistics (Summary)**

| Category | Count |
|----------|-------|
| **Database Tables** | 40+ |
| **API Routers** | 30+ |
| **API Endpoints** | 200+ |
| **Frontend Pages** | 50+ |
| **Reusable Components** | 35+ |
| **Major Features** | 52+ |
| **Clinical Assessments** | 12 validated tools |
| **User Roles** | 5 (Patient, Family, Caregiver, Clinician, Admin) |
| **Languages Supported** | 6 (English, Twi, Ga, Ewe, Hausa, Dagbani) |
| **Background Services** | 3 autonomous loops |
| **Accessibility Features** | 8 comprehensive systems |

---

## 🎓 FOR DEVELOPERS

### **Key Directories**

```
projectaura/
├── backend/
│   ├── main.py                    # FastAPI app, routers, background services
│   ├── src/
│   │   └── db.py                  # Database models (40+ tables)
│   ├── routers/                   # 30+ API routers
│   ├── services/                  # Business logic (AI, notifications, journey)
│   ├── seed_database.py           # Test data generation
│   └── requirements.txt           # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/                 # 50+ page components
│   │   ├── components/            # 35+ reusable components
│   │   ├── lib/                   # Utilities (axios, auth)
│   │   └── App.jsx                # Router configuration
│   ├── package.json               # npm dependencies
│   └── vite.config.js             # Build configuration
└── docs/                          # This documentation
```

### **Quick Start for New Developers**

1. **Read this document** (you're doing it!)
2. **Setup development environment** (see Deployment section)
3. **Run backend**: `uvicorn main:app --reload`
4. **Run frontend**: `npm run dev`
5. **Explore API docs**: http://localhost:8000/docs
6. **Review database schema**: `backend/src/db.py`
7. **Check existing tests**: `backend/tests/`, `frontend/src/__tests__/`
8. **Follow code style**: PEP 8 (Python), Prettier (JavaScript)

### **Development Principles**

- **Security First**: Always validate input, check permissions
- **Patient Privacy**: Never log sensitive data
- **Accessibility**: Test with screen reader, keyboard-only
- **Performance**: Optimize queries, lazy load components
- **Testing**: Write tests for new features
- **Documentation**: Update this file when adding features
- **Ghana Context**: Consider low-bandwidth, mobile-first, multi-language

---

**📅 Document Version**: 2.0.0 (COMPREHENSIVE)  
**🗓️ Last Updated**: June 5, 2026  
**✍️ Author**: ProjectAura Development Team  
**📧 Contact**: support@projectaura.com

---

**END OF COMPLETE SYSTEM DOCUMENTATION**

