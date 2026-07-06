# 🏗️ ProjectAura - System Architecture

## 📐 HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                      http://localhost:5173                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Patient    │  │    Family    │  │  Clinician   │        │
│  │   Portal     │  │    Portal    │  │   Portal     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │              Legacy System (NEW)                      │    │
│  │  • Legacy Setup      • Heir Management                │    │
│  │  • Legacy Content    • Legacy Access                  │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │              Assessment System                        │    │
│  │  • 10 Clinical Tools  • Scoring  • History            │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │              Communication Layer                      │    │
│  │  • Messaging  • Notifications  • Alerts               │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ▼
                    REST API (JSON over HTTP)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                          │
│                    http://localhost:8000                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │                   34 API Routers                     │     │
│  ├──────────────────────────────────────────────────────┤     │
│  │  • auth            • patients        • vitals        │     │
│  │  • admin           • caregivers      • medications   │     │
│  │  • ai              • appointments    • symptoms      │     │
│  │  • alerts          • care_plans      • messaging     │     │
│  │  • notifications   • bereavement     • legacy (NEW)  │     │
│  │  • assessments     • community       • resources     │     │
│  │  • chatbot         • journey         • portal        │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │              Middleware & Security                   │     │
│  │  • JWT Authentication  • RBAC  • CORS                │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │              Business Logic Services                 │     │
│  │  • Notification Service  • AI Analysis               │     │
│  │  • Personalization      • Risk Scoring               │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ▼
                       SQL Queries (ORM)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (SQLite)                            │
│                      backend/aura.db                            │
├─────────────────────────────────────────────────────────────────┤
│                       31 Tables                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Core Tables:                                                   │
│  • User                    • Patient                            │
│  • Caregiver              • PatientFamilyLink                   │
│                                                                 │
│  Clinical Tables:                                               │
│  • Vital                   • Medication                         │
│  • Symptom                 • CarePlan                           │
│  • Appointment             • ClinicalAssessment                 │
│                                                                 │
│  Legacy System (NEW):                                           │
│  • LegacyConsent           • LegacyHeir                         │
│  • LegacyContent                                                │
│                                                                 │
│  Communication:                                                 │
│  • Notification            • Alert                              │
│  • Conversation            • Message                            │
│                                                                 │
│  Bereavement:                                                   │
│  • BereavementEntry        • JournalEntry                       │
│                                                                 │
│  Community:                                                     │
│  • CommunityGroup          • CommunityPost                      │
│  • Resource                • Journey                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 DATA FLOW - DIGITAL LEGACY SYSTEM

```
┌─────────────────────────────────────────────────────────────────┐
│                    PATIENT WORKFLOW                             │
└─────────────────────────────────────────────────────────────────┘

STEP 1: Give Consent
┌──────────────┐      POST /api/legacy/consent        ┌──────────┐
│   Patient    │ ────────────────────────────────────>│ Backend  │
│  /legacy-    │      {patient_id, what_to_share,     │          │
│   setup      │       witnessed_by_user_id}          │ Creates  │
└──────────────┘                                       │ consent  │
                                                       │ record   │
                  <────────────────────────────────────│          │
                      {consent_id, consent_given}      └──────────┘
                                                              │
                                                              ▼
                                                    ┌─────────────────┐
                                                    │ LegacyConsent   │
                                                    │   Table         │
                                                    └─────────────────┘

STEP 2: Designate Heirs
┌──────────────┐      POST /api/legacy/heirs          ┌──────────┐
│   Patient    │ ────────────────────────────────────>│ Backend  │
│  /heir-      │      {patient_id, heir_user_id,      │          │
│ management   │       relationship, access_level}    │ Creates  │
└──────────────┘                                       │ heir     │
                                                       │ record   │
                  <────────────────────────────────────│          │
                      {heir_id, heir_name}             └──────────┘
                                                              │
                                                              ▼
                                                    ┌─────────────────┐
                                                    │  LegacyHeir     │
                                                    │    Table        │
                                                    └─────────────────┘

STEP 3: Create Content
┌──────────────┐      POST /api/legacy/content        ┌──────────┐
│   Patient    │ ────────────────────────────────────>│ Backend  │
│  /legacy-    │      {patient_id, content_type,      │          │
│  content     │       title, content, recipient}     │ Creates  │
└──────────────┘                                       │ content  │
                                                       │ record   │
                  <────────────────────────────────────│          │
                      {content_id, is_delivered}       └──────────┘
                                                              │
                                                              ▼
                                                    ┌─────────────────┐
                                                    │ LegacyContent   │
                                                    │    Table        │
                                                    └─────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  ACTIVATION WORKFLOW                            │
└─────────────────────────────────────────────────────────────────┘

When Patient Passes Away:
┌──────────────┐   POST /api/legacy/activate/{id}     ┌──────────┐
│  Clinician   │ ────────────────────────────────────>│ Backend  │
│              │      {clinician_user_id,              │          │
│              │       deceased_at}                    │ Process: │
└──────────────┘                                       │ 1. Mark  │
                                                       │  patient │
                                                       │  deceased│
                                                       │ 2. Mark  │
                                                       │  content │
                                                       │  delivered│
                                                       │ 3. Notify│
                                                       │  heirs   │
                  <────────────────────────────────────│          │
                      {heirs_notified: 3,              └──────────┘
                       content_delivered: 5}

┌─────────────────────────────────────────────────────────────────┐
│                    HEIR WORKFLOW                                │
└─────────────────────────────────────────────────────────────────┘

View Legacy Access:
┌──────────────┐   GET /api/legacy/my-legacy-access   ┌──────────┐
│    Heir      │ ────────────────────────────────────>│ Backend  │
│ (Family/     │                                       │          │
│ Caregiver)   │                                       │ Query:   │
│ /my-legacy-  │                                       │ 1. Find  │
│  access      │                                       │  where   │
└──────────────┘                                       │  user is │
                                                       │  heir    │
                                                       │ 2. Filter│
                                                       │  activated│
                  <────────────────────────────────────│ 3. Return│
                      [{patient_name, relationship,    │  details │
                        access_level, permissions}]    └──────────┘

View Content:
┌──────────────┐   GET /api/legacy/content/{id}       ┌──────────┐
│    Heir      │ ────────────────────────────────────>│ Backend  │
│              │                                       │          │
│              │                                       │ Filter:  │
└──────────────┘                                       │ 1. Check │
                                                       │  access  │
                                                       │ 2. Apply │
                                                       │  privacy │
                  <────────────────────────────────────│ 3. Return│
                      [{title, content,                │  content │
                        delivered_at}]                 └──────────┘
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION FLOW

```
┌─────────────┐                                      ┌──────────┐
│   Client    │   POST /api/auth/login               │ Backend  │
│             │ ──────────────────────────────────> │          │
│             │   {email, password}                  │ Verify   │
│             │                                      │ password │
│             │ <────────────────────────────────── │          │
│             │   {token, user, role}                └──────────┘
└─────────────┘
       │
       │ Store JWT token in localStorage
       │
       ▼
┌─────────────┐
│  All Future │   Authorization: Bearer {token}
│  Requests   │ ──────────────────────────────────>
│             │                                      ┌──────────┐
│             │                                      │ Middleware│
│             │                                      │          │
│             │                                      │ 1. Verify│
│             │                                      │   JWT    │
│             │                                      │ 2. Check │
│             │                                      │   role   │
│             │                                      │ 3. Check │
│             │                                      │   access │
│             │ <────────────────────────────────── │          │
│             │   {data} or {401 Unauthorized}       └──────────┘
└─────────────┘
```

---

## 🎯 ROLE-BASED ACCESS CONTROL (RBAC)

```
┌────────────────────────────────────────────────────────────────┐
│                      ACCESS MATRIX                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Resource          │ Patient │ Family │ Caregiver │ Clinician │
│ ────────────────── │ ─────── │ ────── │ ───────── │ ───────── │
│  Own Profile       │   RW    │   RW   │    RW     │    RW     │
│  Other Profiles    │   R     │   R    │    R      │    R      │
│  Patient List      │   -     │   L*   │    L*     │    L      │
│  Vitals (create)   │   -     │   -    │    RW     │    RW     │
│  Vitals (view)     │   R     │   R*   │    R*     │    R      │
│  Medications       │   R     │   R*   │    RW*    │    RW     │
│  Symptoms          │   RW    │   -    │    R*     │    RW     │
│  Assessments       │   R     │   R*   │    RW*    │    RW     │
│  AI Insights       │   -     │   -    │    -      │    R      │
│  Alerts            │   -     │   -    │    -      │    RW     │
│  Notifications     │   RW    │   RW   │    RW     │    RW     │
│  Messages          │   RW    │   RW   │    RW     │    RW     │
│  Memory Vault (W)  │   RW    │   -    │    -      │    -      │
│  Memory Vault (R)  │   R     │   R*   │    R*     │    R      │
│  Journal (W)       │   RW    │   -    │    -      │    -      │
│  Journal (R)       │   R     │   R*   │    -      │    R*     │
│  Legacy Setup      │   RW    │   -    │    -      │    W**    │
│  Heir Management   │   RW    │   -    │    -      │    -      │
│  Legacy Content    │   RW    │   -    │    -      │    -      │
│  Legacy Access     │   -     │   R*   │    R*     │    -      │
│  Legacy Activate   │   -     │   -    │    -      │    W      │
│  Community         │   RW    │   RW   │    RW     │    R      │
│  Resources         │   R     │   R    │    R      │    RW     │
│                                                                │
│  Legend:                                                       │
│  R   = Read          W  = Write        RW = Read/Write        │
│  L   = List          -  = No Access                           │
│  *   = Linked patients only (family/caregiver assignments)    │
│  **  = Witness consent only                                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA - LEGACY SYSTEM

```
┌─────────────────────────────────────────────────────────────────┐
│                        LegacyConsent                            │
├─────────────────────────────────────────────────────────────────┤
│  id                    INTEGER PRIMARY KEY                      │
│  patient_id            INTEGER FK → Patient.id                  │
│  consent_given         BOOLEAN                                  │
│  consent_date          TIMESTAMP                                │
│  what_to_share         TEXT (JSON array)                        │
│  witnessed_by_user_id  INTEGER FK → User.id                     │
│  revoked               BOOLEAN                                  │
│  revocation_date       TIMESTAMP NULL                           │
│  created_at            TIMESTAMP                                │
│  updated_at            TIMESTAMP                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          LegacyHeir                             │
├─────────────────────────────────────────────────────────────────┤
│  id                    INTEGER PRIMARY KEY                      │
│  patient_id            INTEGER FK → Patient.id                  │
│  heir_user_id          INTEGER FK → User.id                     │
│  relationship          TEXT                                     │
│  access_level          TEXT (full, memories_only, messages_only)│
│  can_access_private    BOOLEAN                                  │
│  notes_from_patient    TEXT NULL                                │
│  designated_at         TIMESTAMP                                │
│  created_at            TIMESTAMP                                │
│  updated_at            TIMESTAMP                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        LegacyContent                            │
├─────────────────────────────────────────────────────────────────┤
│  id                    INTEGER PRIMARY KEY                      │
│  patient_id            INTEGER FK → Patient.id                  │
│  content_type          TEXT (final_message, letter, note, etc.) │
│  title                 TEXT                                     │
│  content               TEXT                                     │
│  file_path             TEXT NULL (for audio/video)              │
│  recipient_type        TEXT (all_heirs, specific_heir, person)  │
│  recipient_heir_id     INTEGER NULL FK → LegacyHeir.id          │
│  recipient_user_id     INTEGER NULL FK → User.id                │
│  delivery_trigger      TEXT (after_death, specific_date)        │
│  delivery_date         DATE NULL                                │
│  is_delivered          BOOLEAN                                  │
│  delivered_at          TIMESTAMP NULL                           │
│  created_at            TIMESTAMP                                │
│  updated_at            TIMESTAMP                                │
└─────────────────────────────────────────────────────────────────┘

RELATIONSHIPS:
• Patient 1:1 LegacyConsent (optional)
• Patient 1:N LegacyHeir
• Patient 1:N LegacyContent
• User 1:N LegacyHeir (as heir)
• LegacyHeir 1:N LegacyContent (optional, if recipient_type = specific_heir)
```

---

## 🔄 INTEGRATION POINTS

```
┌─────────────────────────────────────────────────────────────────┐
│                  SYSTEM INTEGRATIONS                            │
└─────────────────────────────────────────────────────────────────┘

Legacy System ──────> Memory Vault
  │                      │
  │  When heir views     │
  │  legacy, queries     │
  │  BereavementEntry    │
  │  filtered by         │
  │  permissions         │
  │                      │
  └──────────────────────┘

Legacy System ──────> Journal
  │                      │
  │  When heir views     │
  │  legacy, queries     │
  │  JournalEntry        │
  │  filtered by         │
  │  permissions         │
  │                      │
  └──────────────────────┘

Legacy System ──────> Notifications
  │                      │
  │  When designated     │
  │  as heir, creates    │
  │  notification        │
  │                      │
  │  When legacy         │
  │  activated, creates  │
  │  notification        │
  │                      │
  └──────────────────────┘

Notifications ──────> Messaging
  │                      │
  │  When new message,   │
  │  creates            │
  │  notification        │
  │                      │
  └──────────────────────┘

Alerts ──────────────> AI Insights
  │                      │
  │  Risk predictions    │
  │  trigger alerts      │
  │                      │
  └──────────────────────┘

Assessments ─────────> AI Insights
  │                      │
  │  Assessment scores   │
  │  feed AI models      │
  │                      │
  └──────────────────────┘
```

---

## 🚀 DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRODUCTION SETUP                           │
└─────────────────────────────────────────────────────────────────┘

                         INTERNET
                            │
                            ▼
                    ┌───────────────┐
                    │  Load Balancer│
                    │   (Nginx)     │
                    └───────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
      ┌──────────────┐            ┌──────────────┐
      │   Frontend   │            │   Frontend   │
      │  (React +    │            │  (React +    │
      │   Nginx)     │            │   Nginx)     │
      │  Port 80/443 │            │  Port 80/443 │
      └──────────────┘            └──────────────┘
              │                           │
              └─────────────┬─────────────┘
                            │
                    API Gateway / CORS
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
      ┌──────────────┐            ┌──────────────┐
      │   Backend    │            │   Backend    │
      │  (FastAPI +  │            │  (FastAPI +  │
      │   Gunicorn)  │            │   Gunicorn)  │
      │  Port 8000   │            │  Port 8000   │
      └──────────────┘            └──────────────┘
              │                           │
              └─────────────┬─────────────┘
                            │
                    Database Connection Pool
                            │
                            ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    │  (or SQLite  │
                    │   for dev)   │
                    │  Port 5432   │
                    └──────────────┘

Additional Services:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    Redis     │  │  File        │  │   Email      │
│   (Cache)    │  │  Storage     │  │   Service    │
│  Port 6379   │  │  (S3/local)  │  │  (SMTP)      │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 📈 SCALABILITY CONSIDERATIONS

### Current (Development):
- Single server
- SQLite database
- File-based storage
- In-memory caching

### Future (Production):
- Multiple frontend servers (Nginx load balancer)
- Multiple backend servers (Gunicorn workers)
- PostgreSQL database (master-replica)
- Redis cache (shared cache layer)
- S3/CDN for file storage
- Email service (SendGrid/SES)
- Monitoring (Prometheus + Grafana)
- Logging (ELK stack)

---

## 🔒 SECURITY LAYERS

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Network Security
  • HTTPS/TLS encryption
  • CORS policies
  • Rate limiting
  • DDoS protection

Layer 2: Authentication
  • JWT tokens
  • Password hashing (bcrypt)
  • Session management
  • Token expiration

Layer 3: Authorization
  • Role-based access control (RBAC)
  • Resource-level permissions
  • Ownership checks
  • Access control lists

Layer 4: Data Security
  • Encrypted at rest (database)
  • Encrypted in transit (HTTPS)
  • Privacy controls (public/private)
  • Audit logging

Layer 5: Compliance
  • HIPAA compliance
  • GDPR compliance
  • Consent management
  • Data retention policies
```

---

## 📊 PERFORMANCE METRICS

| Metric | Current | Target |
|--------|---------|--------|
| Page Load Time | < 1s | < 500ms |
| API Response Time | < 100ms | < 50ms |
| Database Query Time | < 50ms | < 20ms |
| Concurrent Users | 100 | 10,000 |
| Uptime | 99% | 99.9% |

---

**Last Updated:** June 4, 2026
**Version:** ProjectAura v2.0
**Status:** 🟢 Production Architecture Documented
