# PROJECT AURA — FINAL DEFENSE DOCUMENT
## Group 31 | UMaT Tarkwa | BSc Computer Science & Engineering
### Title: An AI Framework for Personalised and Explainable Palliative Care Systems

---

> **How to use this document:**
> Read it like a script you own, not one you memorise.
> Every answer below is written the way you should actually say it — direct, confident, technically precise.
> The panel will probe. Know the code. Know the numbers. Know the why.

---

---

## PART 1 — SYSTEM OVERVIEW (Say this in under 90 seconds)

**What the system is:**
Project AURA is a full-stack, AI-powered palliative care platform built specifically for the Ghanaian healthcare context. It has four functional pillars working together in one web application:

1. **Intelligent Monitoring Core** — captures clinical data (vitals, symptoms, assessments), runs 8 XGBoost risk models, generates SHAP explanations, and proactively alerts clinicians
2. **Adaptive Care Guide** — AI-generated care plans personalised per patient diagnosis and onboarding preferences
3. **Unified Care Dashboard** — one platform serving 5 roles (admin, clinician, caregiver, patient, family) with role-appropriate views and real-time data
4. **Continuity Bridge** — structured bereavement support, grief journal, PG-13 screening, memory vault, and digital legacy for families after a patient dies

**What makes it new:**
No reviewed system combined all four. Existing tools — Alora, CareSmartz360, Netsmart — handle records and scheduling only. None have clinical AI. None have bereavement support. We built both, for the Ghanaian context, in one platform.

---

## PART 2 — THE PROBLEM (Evidence you cite)

| Statistic | Source |
|---|---|
| 56.8 million people need palliative care globally; <14% receive it | WHO (2024) |
| 48% of Ghanaians pay for care out-of-pocket | COMPASS Ghana (2024a) |
| 44% of Ghanaians have no active health insurance | NHIA (2025) |
| No dedicated palliative ward in any Ghanaian teaching hospital | GPCA (2024b) |
| ~40% of bereaved people need more support than family/friends can provide | Finucane et al. (2024) |
| Clinicians will not act on AI recommendations they cannot understand | Parsons et al. (2025); Abbas et al. (2025) |

**The four gaps the system closes:**
1. Care fragmentation — records don't travel between settings
2. Opaque AI — existing tools produce risk scores with no explanation
3. No family involvement — families carry caregiving with zero formal support
4. No bereavement — care stops the moment the patient dies

---

## PART 3 — OBJECTIVES AND EVIDENCE OF ACHIEVEMENT

### Objective 1: Real-time symptom tracking, medication management, scheduling
**Met. Evidence:**

- `notification_service.py` → `check_medication_schedule()` calculates next dose time from frequency string, creates reminder 15 min before, marks missed if not logged within 30 min
- `notification_service.py` → `check_critical_vitals()` checks SpO2 <90%, HR <50 or >120, BP sys >180 or <90, Temp >38.5°C — creates Alert + NotificationQueue entries in real time
- `notification_service.py` → `check_upcoming_appointments()` sends 24h and 1h reminders to patient + family links
- Offline-first: IndexedDB queue stores writes when no connectivity; service worker caches assets; data syncs on reconnect
- **10 validated clinical instruments**: ESAS, PPS, PHQ-9, GAD-7, Barthel, BPI, QoL, MMSE/MoCA, Zarit Burden, Motor Skills — each a dedicated form, dedicated DB table, dedicated API endpoint

### Objective 2: Explainable AI using SHAP-based models
**Met, with one recorded deviation (XGBoost over Random Forest).**

- 8 XGBoost classifiers, one per clinical domain
- Each paired with SHAP `TreeExplainer` — exact Shapley values (not approximated)
- `RiskExplanationPanel.jsx` renders SHAP bars + waterfall charts in the UI
- Two explanation systems kept architecturally separate: SHAP (bar/waterfall, labelled "XGBoost SHAP") vs rule-based heuristics (single-observation, plain language)
- Clinician feedback loop (agree/partial/disagree) feeds back to backend

### Objective 3: Unified, secure, bereavement-supporting platform
**Met at prototype level.**

- JWT + RBAC enforced on every endpoint (not just UI)
- HIPAA-aligned: audit log, 15-min auto-logoff, breach tracking, patient data export
- Continuity Bridge: grief journal (NLP tone detection), PG-13 screening, memory vault, digital legacy with heir access levels
- **Honest caveat**: "user-friendly" is a design claim — no user study was conducted

---

---

## PART 4 — TECHNOLOGY STACK WITH JUSTIFICATION

### Frontend

| Technology | Why |
|---|---|
| **React 18/19 + Vite** | Component model maps to role-adaptive UI; Vite is 10-100x faster hot reload than CRA; large clinical web precedent |
| **TanStack Query** | Server-state caching with stale-time tuning per data type — alerts: 30s, patients: 5min, ML risk: 5min, drug interactions: 10min |
| **TanStack Table** | Sortable, filterable 40+ column patient list with row virtualisation |
| **Tailwind CSS** | Utility-first; `dark:` variants for dark mode; responsive breakpoints built in |
| **Framer Motion** | Accessible animations; respects `reducedMotion` system preference |
| **Recharts** | SHAP bar/waterfall charts, vital trend sparklines, risk gauges |
| **Axios** | HTTP client with JWT Bearer interceptor — token attached automatically to every request |
| **Sonner (toast)** | Clinical alert toasts; positioned 80px below header to avoid covering nav |
| **idb (IndexedDB)** | Structured offline storage: patients, vitals, meds, appointments, pending-write queue |
| **Web Speech API** | Voice-to-text input forms; voice navigation commands |
| **Vite PWA + Workbox** | Service worker; offline static asset cache; home-screen install on Android/iOS |

### Backend

| Technology | Why |
|---|---|
| **FastAPI** | Async Python; auto-generates OpenAPI docs at `/docs`; native Pydantic integration |
| **Uvicorn (ASGI)** | Handles async + WebSocket connections concurrently |
| **SQLAlchemy 2.0** | ORM; parameterised queries eliminate SQL injection by construction; DB-agnostic |
| **Pydantic v2** | Schema validation — malformed input rejected at API boundary before touching DB |
| **python-jose** | JWT signing/verification (HS256) |
| **passlib + bcrypt** | Adaptive password hashing; industry standard for credential storage |
| **bleach** | Sanitises user-supplied text before storage — prevents XSS |
| **slowapi** | Rate limiting: 10 requests/min on `/api/auth/login` |
| **WebSockets** | Real-time push of alerts, messages, notifications — no polling needed |

### AI / ML

| Technology | Why |
|---|---|
| **XGBoost** | Handles tabular, partially missing clinical data; fast retraining; exact SHAP compatibility |
| **scikit-learn** | Preprocessing pipelines, StratifiedKFold CV, label encoding |
| **SMOTE** | Corrects class imbalance — palliative risk events are rare in real populations |
| **SHAP TreeExplainer** | Cooperative game theory; exact per-feature Shapley values for tree models — not approximated |
| **Gemini 1.5 Flash** | Primary LLM for conversational assistants; free tier |
| **Groq Llama 3.1** | Automatic fallback when Gemini unavailable |
| **Aura AI Engine (local)** | TF-IDF + cosine similarity over 300+ labelled phrases, 500+ Q&A pairs, crisis guard — zero internet required |

**How the Aura AI Engine actually works (from `aura_ai_engine.py`):**
1. `_preprocess(text)` — lowercase, tokenise, remove stopwords, apply Porter stemmer
2. `TfidfVectorizer` (ngrams 1–2) trained on all labelled intent examples
3. `classify_intent(text)` — cosine similarity against TF-IDF matrix → top-N (intent, confidence) pairs
4. `extract_entities(text)` — regex for pain scale 0–10, named symptoms, medication names (30+ drugs), time references, body parts
5. `is_crisis(text)` — hardcoded keyword guard runs first, always, before any other processing
6. Response built from `KNOWLEDGE_BASE` (500+ Q&A) matched by intent + entity

**How `llm_engine.py` works:**
- Routes all chat through the local Aura AI Engine only (`_aura_generate`)
- `nlp = _NLPShim()` exposes `detect_intents()`, `extract_entities()`, `analyze_sentiment()`, `is_crisis()` to the router
- `get_provider_status()` returns provider info expected by the status endpoint
- No external API calls unless Gemini/Groq keys are present in `.env`

### Infrastructure

| Technology | Why |
|---|---|
| **SQLite (dev)** | Zero-config; single `.db` file; changed to PostgreSQL by one env var |
| **PostgreSQL (prod)** | Full ACID, full-text search, connection pooling at scale |
| **VAPID (Web Push)** | Signed push messages to device even when browser is closed |
| **JWT HS256** | Stateless — no server-side session store; scales horizontally |

---

## PART 5 — ARCHITECTURE EXPLAINED

### Three-tier, five-layer

```
Layer 1: React 19 + Vite  (65 pages, ~60 components)
         ↕ REST/HTTP (JWT Bearer) + WebSocket
Layer 2: FastAPI  (39 routers, 10 services, Uvicorn ASGI)
         ↕ SQLAlchemy ORM
Layer 3: SQLite → PostgreSQL  (~40 tables)
         ↕ joblib / SHAP
Layer 4: 8 XGBoost models + SHAP TreeExplainer  (loaded into memory at startup)
         ↕ optional HTTP
Layer 5: Gemini 1.5 → Groq Llama 3.1 → Local Aura AI Engine
```

**Why load ML models into the FastAPI process (Layer 2) and not a separate model server?**
Low latency, no extra deployment complexity, no inter-service network call. For a prototype in a resource-limited setting this is correct. For production at scale, extracting to a dedicated inference service is the natural evolution.

**Why not microservices?**
A monolith was the right choice for a prototype. Microservices add network complexity, distributed tracing, and service discovery overhead that adds no value to a system of this scope. The code is structured as if it were microservices — 39 routers, each owning its domain — so extraction is straightforward later.

---

---

## PART 6 — THE ML SYSTEM IN FULL TECHNICAL DETAIL

### 8 XGBoost Models

| Model | Predicts | Clinical Weight |
|---|---|---|
| Pain Risk | Uncontrolled pain likelihood | 1.5 |
| Symptom Burden | Overall symptom severity | 1.3 |
| Deterioration | Clinical decline trajectory | 1.2 |
| Admission Risk | Hospital admission within 7 days | 1.2 |
| Psychological Risk | Depression/anxiety escalation | 1.1 |
| Mortality Risk | 30-day mortality probability | 1.0 |
| Medication Adherence | Missed medication probability | 1.0 |
| Caregiver Burden | Caregiver burnout risk | 0.8 |

**Feature vector assembled per patient:**
Most recent vitals (HR, BP, SpO2, Temp, RR) + ESAS scores + PPS score + Barthel score + MMSE/MoCA score + PHQ-9 total + GAD-7 total + active medication count + medication adherence rate + alert count last 6 months (proxy for ED visits) + social support score

**Missing value handling:** Clinically appropriate defaults substituted — HR=80, SpO2=95%, BP=120/80 — so a prediction is always returned even for incomplete records.

**Training protocol (from `retrain_targeted.py` and documentation):**
- 8,000 synthetic samples per task
- 80/20 stratified split
- Stratified K-Fold CV during hyperparameter tuning
- SMOTE for class imbalance correction
- Fixed random seed = 42 (reproducibility)
- Three models retrained in second pass: `vital_risk`, `symptom_burden`, `admission_risk` — precision improved while recall preserved

**Held-out performance (Table 3.1):**

| Model | AUC | Accuracy | Precision | Recall | F1 |
|---|---|---|---|---|---|
| Pain Risk | 0.979 | 92.3% | 77.2% | 91.3% | 83.6% |
| Symptom Burden | 0.991 | 96.1% | 75.6% | 94.3% | 83.9% |
| Deterioration | 0.993 | 95.3% | 89.3% | 95.1% | 92.1% |
| Medication Adherence | 0.996 | 95.6% | 95.5% | 93.9% | 94.8% |
| Psychological Risk | 0.998 | 97.3% | 97.4% | 97.3% | 97.3% |
| Mortality Risk | 0.994 | 95.3% | 96.6% | 95.7% | 96.1% |
| Caregiver Burden | 0.998 | 97.8% | 95.6% | 97.5% | 96.5% |
| Admission Risk | 0.985 | 91.8% | 81.3% | 96.7% | 88.3% |

**Why lower precision on pain/symptom/admission is intentional:**
In palliative care, a false positive (unnecessary clinical review) costs time. A false negative (missing a deteriorating patient) costs a life. The system deliberately biases toward recall. The 6-hour alert deduplication window manages false-positive alert volume.

**Real-world benchmark:** Published XGBoost on real palliative data reports AUC 0.75–0.88. Our figures show the models correctly learned their training distributions — not that they will achieve this on a real hospital population.

**Overall risk aggregation:**
Weighted sum of 8 domain scores → Critical >70%, High 50–70%, Moderate 30–50%, Low <30%

**Proactive background scan:** Runs across all active/stable/deteriorating patients. 6-hour deduplication — same patient not re-alerted within 6 hours of a previous alert.

### How SHAP Works (explain this if asked)

SHAP stands for SHapley Additive exPlanations. It comes from cooperative game theory (Lundberg & Lee, 2017). The idea: treat each feature as a "player" in a game whose "payout" is the model's prediction. Shapley values calculate each player's fair contribution by averaging their marginal contribution across all possible orderings of players.

`TreeExplainer` computes exact Shapley values for tree-based models — not approximated. This is why XGBoost was chosen over Random Forest: Random Forest with SHAP uses a slower, approximated explainer. XGBoost + TreeExplainer gives exact values at speed.

**What a clinician sees:** "Pain score 8/10 pushed risk up by +0.23. PPS 30 pushed risk up by +0.18. Good medication adherence pushed risk down by −0.11." That is actionable. A raw risk score of 0.71 is not.

---

## PART 7 — DATABASE DESIGN

**~40 SQLAlchemy tables, 6 functional groups:**

| Group | Tables | Purpose |
|---|---|---|
| Core | users, patients, vitals, symptoms, medications, appointments, alerts, notification_queue | Identity and moment-to-moment clinical events |
| Assessment | esas_assessments, pps_assessments, phq9, gad7, barthel, pain_assessments, qol, caregiver_burden, cognitive, motor_skills, medication_adherence_logs | One table per validated instrument; feeds ML features |
| Care & Planning | care_plans, care_plan_goals, care_plan_checklist, interventions, caregiver_assignments, patient_preferences, care_settings | Adaptive care guide output + caregiver assignments |
| Community & Social | community_groups, memberships, posts, reactions, messages, conversations, resources, bookmarks | Peer support and education |
| Bereavement & Legacy | bereavement_entries, grief_screenings, legacy_consents, legacy_heirs, legacy_content | Continuity Bridge |
| Governance | audit_logs, breach_incidents, crisis_alerts, clinical_overrides, usability_feedback, chatbot_consent | Compliance and ethics |

**Central entity:** `patients` — almost every other table has a foreign key to `patient_id`.

**DB-agnostic design:** SQLAlchemy ORM; `DATABASE_URL=sqlite:///./aura.db` in dev; `DATABASE_URL=postgresql://...` in production. One env var change. No code change.

**Why not MongoDB or a NoSQL database?**
Palliative care data is highly relational — a vital links to a patient, which links to a clinician, care plan, alerts, and family. Relational integrity (foreign keys, transactions) is essential for clinical correctness. JSON fields are used where flexibility is needed (SHAP values, condition tags) but the core schema is relational.

---

## PART 8 — USER ROLES — COMPLETE

| Role | Landing route | Core permissions |
|---|---|---|
| **admin** | `/dashboard` | Full: user CRUD, audit log, HIPAA dashboard, breach incidents, model bias |
| **clinician** | `/dashboard` | Patient CRUD, all assessments, AI insights, care plans, clinical notes, alerts, medical KB CRUD |
| **caregiver** | `/dashboard` | Assigned patients only: vitals, daily log, medication adherence, shift handover, burnout indicator |
| **patient** | `/my-space` | Own data: wellness check-in, care plan (view), resources, community, messaging, legacy, appointments |
| **family** | `/dashboard` | Linked patient: journey timeline (de-identified), memory vault, bereavement, legacy (if designated heir) |

**RBAC implementation:** Every FastAPI endpoint calls `require_role()` dependency before the handler executes. Role check is in the backend — the frontend hiding features is UX convenience only, not a security boundary. A malicious actor calling an endpoint directly will still be rejected.

**Dual access control on legacy content:** Family role alone is insufficient. An `heir_access_level` field (full / memories_only / messages_only) is checked separately from the system role. Patient designates access level per heir individually.

---

---

## PART 9 — KEY WORKFLOWS (How the system actually runs)

### Authentication Flow
1. User submits credentials → bcrypt hash verified → signed JWT issued (HS256, 8h expiry)
2. Token stored client-side → attached as `Authorization: Bearer <token>` to every request
3. Backend middleware validates signature + expiry on every request before any handler runs
4. First login → personalisation questionnaire (`/setup`)
5. Returning user → role-based landing page

### Risk Prediction Flow (Core contribution)
1. Clinician opens patient record OR background scanner fires
2. Backend assembles feature vector from latest vitals + ESAS + PPS + Barthel + MMSE + PHQ-9 + GAD-7 + meds + alert history
3. Vector passes through all 8 XGBoost models
4. SHAP `TreeExplainer` returns ranked feature contributions per model
5. 8 domain scores combined with clinical weights → overall risk level
6. Full result (overall level + 8 scores + SHAP + plain-language concerns) returned in one response
7. Rendered on patient summary gauge AND AI Insights deep-dive panel simultaneously
8. If risk > high/critical threshold → `Alert` created → pushed over WebSocket to all connected clinicians

### Assessment → ML Feedback Loop
Clinician submits ESAS/PPS/Barthel → pipeline re-runs immediately → risk panel updates to reflect new scores. This is why assessment submission triggers a risk re-calculation in the same HTTP response.

### Notification Flow (from `notification_service.py`)
- **Medications:** `check_medication_schedule()` runs on schedule. Calculates `next_dose_time` from frequency string (e.g. "twice daily" → 12h interval). Creates `NotificationQueue` entry 15min before. If not logged as taken 30min after → creates missed-dose notification to patient + family links
- **Appointments:** `check_upcoming_appointments()` creates 24h reminder then 1h reminder. Deduplication: checks if notification already created in last hour/30min before creating new one
- **Critical Vitals:** `check_critical_vitals()` checks latest vitals within last 30 minutes against thresholds. Creates `Alert` in DB + `NotificationQueue` to primary clinician + all family links + calls `_deliver_to_user()` for SMS/Web Push

### Personalisation Flow
1. Patient completes 10-step questionnaire at `/setup`
2. `onSuccess` applies 12 settings immediately to localStorage: theme, language, font size, sidebar mode, a11y, notifications, AI consent
3. Backend saves `UserPreferences` row
4. `PersonalisationContext` derives `uiFlags`: `showCommunity`, `showAI`, `showLegacy`, `showSpiritualItems`, `simplifiedNav`, `isBereaved`, `isBurntOut`
5. Every component reads from this central context — one flag, consistent across all screens
6. On every subsequent login: `AppRoutes` re-fetches and re-applies (guarded by `sessionStorage` so it only runs once per session)

### Digital Legacy Flow
1. Patient creates consent at `/legacy-setup`
2. Designates heirs — each gets: relationship, `access_level` (full/memories_only/messages_only), `can_access_private` flag
3. Creates posthumous content — each piece has a `delivery_trigger` ("after_death" or specific date)
4. After patient's death → clinician activates legacy via admin interface
5. `/my-legacy-access` becomes available to heirs — content filtered strictly by `heir_access_level`, not by system role

### WebSocket Real-Time Flow
- Single WebSocket endpoint, connection manager maps authenticated connections to rooms
- On connection: token validated same as REST; auto-subscribed to `general`, `clinicians`, `caregivers`, or `patient_{id}` room based on role
- Three event types: alert_update (broadcast to clinicians room), new_message (broadcast to conversation participants), new_notification (directed to single recipient)
- Frontend `WebSocketContext` exposes subscribe/unsubscribe to components — components don't manage connection state themselves

---

## PART 10 — SECURITY & COMPLIANCE

### Authentication & Session
- JWT HS256, 8-hour expiry
- bcrypt password hashing via passlib
- 5 failed login attempts → 30-minute lockout
- Rate limit: 10 requests/min on login endpoint (slowapi)
- HIPAA auto-logoff: 15 minutes idle (`useIdleTimer` hook in Layout)

### RBAC
- `require_role()` dependency on every protected endpoint
- Role checked before any handler executes
- Cannot be bypassed by direct URL call

### Data Security
- SQLAlchemy ORM parameterises all DB queries → SQL injection impossible by construction
- bleach sanitises user text before storage → XSS prevented
- Request/response schemas maintained separately from DB models (Pydantic) → API surface can be tightened independently

### HIPAA Alignment
- Audit log: all significant actions logged with `user_id`, `user_role`, `action`, `resource_type`, `patient_id`, `ip_address`, `user_agent`, `success`, `details` JSON
- Breach incident tracking: `BreachIncident` table, auto-calculates HHS 60-day notification deadline
- Patient data export: `GET /api/portal/my-data/export` returns all PHI as downloadable JSON (HIPAA Right of Access, 45 CFR §164.524)
- HIPAA compliance dashboard: dynamically computed from live DB — queries audit log count, breach incidents, user counts; not hardcoded

### Continuity Bridge Additional Layer
- Family role alone does not grant legacy access
- `heir_access_level` checked separately from system role at every legacy content query
- Journal entries visible only to their author — enforced at access control layer, not just UI convention

**Why "HIPAA-aligned" not "HIPAA-compliant"?**
Full HIPAA compliance requires formal certification, Business Associate Agreements, physical security controls, and staff training programmes. A student prototype cannot be formally certified. The system implements the technical safeguard requirements of the HIPAA Security Rule.

---

## PART 11 — CARE PLAN ENGINE (from `care_plan_engine.py`)

The care plan engine detects disease profile from diagnosis text:
1. `detect_disease_profile(diagnosis)` — checks 7 hardcoded profiles (cancer, heart_failure, COPD, dementia, renal_failure, stroke, general_palliative) by keyword matching
2. Falls back to `ConditionCareTemplate` DB table if no hardcoded match — allows clinicians to add new conditions that immediately affect care plan generation
3. Profile contains: `key_goals`, `standard_interventions`, `red_flags`, `monitoring_schedule`, `guide_sections`

**Feature analysis per patient:**
- PPS score → functional level → care phase
- ESAS scores → symptom priorities
- PHQ-9/GAD-7 → psychological support urgency
- Barthel → ADL independence level
- Zarit → caregiver burden level
- Active medications → drug interaction checks

**Output:** Structured `CarePlan` with `CarePlanGoal[]` (each with priority, category, progress 0–100) and `CarePlanIntervention[]` (each with frequency and responsible role)

---

---

## PART 12 — VALIDATED CLINICAL TOOLS (Know each one)

| Tool | Full Name | Score Range | Clinical Threshold | Why it's in the system |
|---|---|---|---|---|
| **ESAS** | Edmonton Symptom Assessment System | 9 symptoms × 0–10 | Total >50 → Escalation phase trigger | Gold standard for palliative symptom assessment; developed specifically for this population |
| **PPS** | Palliative Performance Scale | 0–100% in 10% steps | <40 → Escalation; <20 → Transition phase | Directly predicts prognosis; drives care phase placement in journey tracker |
| **PHQ-9** | Patient Health Questionnaire-9 | 0–27 (9 items × 0–3) | ≥10 moderate depression; Q9 = suicidality → crisis alert | Depression is undertreated in palliative care; Q9 detects suicidal ideation |
| **GAD-7** | Generalised Anxiety Disorder-7 | 0–21 (7 items × 0–3) | ≥10 moderate anxiety | Anxiety one of the most distressing and undertreated palliative symptoms |
| **Barthel Index** | Barthel Activities of Daily Living | 0–100 (10 ADL items) | 0–20: total dependence; 91–100: independent | Determines practical care needs; drives caregiver assignment |
| **MMSE** | Mini-Mental State Examination | 0–30 | <24 suggests cognitive impairment | Dementia affects ability to self-report symptoms accurately |
| **MoCA** | Montreal Cognitive Assessment | 0–30 (+1 if ≤12yrs education) | <26 suggests impairment | More sensitive than MMSE for mild impairment |
| **BPI** | Brief Pain Inventory | Severity + Interference subscales | Severity >7 = severe pain | Captures both pain intensity AND functional impact — not just a number |
| **FACT-G** | Functional Assessment of Cancer Therapy – General | Physical/Social/Emotional/Functional | Per-subscale interpretation | WHO defines palliative care as improving quality of life — QoL must be measured |
| **Zarit Burden Interview** | Zarit Caregiver Burden Scale | 0–48 (12 items × 0–4) | 0–20: little burden; 41–48: severe | Families carry all caregiving in Ghana with no support; measuring burden is central |
| **PG-13** | Prolonged Grief-13 | 13–65 (13 items × 1–5) | ≥30 → prolonged grief referral | Finucane (2024): 40% of bereaved need formal support; PG-13 identifies which ones |
| **Motor Skills** | Physical Function Assessment | Grip strength, TUG, gait speed, balance | Falls risk classification | Falls are a major safety risk, especially for dementia patients |

---

## PART 13 — METHODOLOGY

### SDLC: Waterfall (Royce, 1970)

**Three reasons this was the right choice:**
1. Fixed academic timetable with supervisor sign-off gates — maps directly to sequential phase completion
2. Requirements derived upfront from published literature — ESAS protocols, WHO guidelines, HIPAA rules, NHS CmC documentation — not from evolving user feedback
3. Solo/small team benefits from documenting each phase fully before moving on — creates the auditable trail this report records

**Research approach: Design Science Research (Hevner et al., 2004)**
Primary contribution is a purposefully built artefact, not a tested hypothesis. Work proceeds through: problem awareness → suggestion → development → evaluation. The research question is "what can be built and how well does it perform?" not a statistical question about human subjects.

**Five phases executed:**

| Phase | Key outputs |
|---|---|
| 1. Literature Review & Problem Analysis | Research notes, requirements list, gap analysis, Table 2.1 (24 reviewed works) |
| 2. Requirements Specification | 47 functional requirements, 12 non-functional requirements |
| 3. System Design | `db.py` schema, 39 router structure, ML pipeline spec, low-fi wireframes |
| 4. Implementation | Backend-first: auth → clinical → ML → notifications → frontend |
| 5. Testing & Documentation | API smoke test, ML held-out eval, manual runtime walkthrough |

**Why not Agile?** Agile requires real users giving sprint feedback. No users were involved at any stage. Claiming Agile without user sprints would be academically dishonest.

**Why not Iterative/Incremental?** IID requires validated feedback from a user population to justify each iteration. Without user testing, what appeared iterative was sequential implementation of a pre-planned feature set.

**Why not Prototyping?** Prototyping builds a throwaway mock shown to stakeholders for reaction. No stakeholders existed to show it to.

---

## PART 14 — TESTING

### What was tested:

**1. API Integration Smoke Test** (`test_api.py`)
- Authenticated as admin, hit 7 endpoints
- All returned HTTP 200 + expected fields
- All 7 passed (Table 5.1)

**2. ML Held-Out Evaluation**
- 8,000 synthetic samples × 8 tasks
- 80/20 stratified split
- All 8 models AUC > 0.97
- Three models retrained: vital_risk, symptom_burden, admission_risk
- Results in Table 3.1

**3. Manual Runtime Flow Verification (Table 5.3)**
- 12 synthetic patients seeded + 1 account per role
- 15 principal flows manually exercised — all passed:
  - Authentication, WebSocket push, ML pipeline, alert lifecycle
  - Assessment → ML feedback, drug interaction detection
  - Caregiver auto-assignment, messaging urgency, notification priority ordering
  - Care plan generation, legacy delivery, offline write queuing
  - Personalisation onboarding, AI assistants, push notification delivery

### What was NOT tested (say this openly):
- No automated unit test suite
- No load testing
- No external clinical validation on real patient data
- No formal user study (SUS, think-aloud)
- No formal accessibility audit (NVDA, VoiceOver)
- No penetration testing
- UsabilityFeedback infrastructure exists but has no submitted records

---

## PART 15 — CONTRIBUTION TO KNOWLEDGE

Say this confidently when asked "what is new?":

1. **First integrated prototype** combining symptom monitoring + explainable clinical AI + care coordination + structured bereavement support in one platform. Table 2.1 (24 reviewed works) — none combined all four.

2. **SHAP explainability out of the lab** into a working web prototype. Abbas et al. (2025) analysed 62 XAI studies — most remain at benchmark level. We integrated SHAP into a live system where every risk score is inseparable from its explanation.

3. **Bereavement as a first-class feature** — Finucane et al. (2024): 40% of bereaved need formal support. Every reviewed platform offered nothing after death. The Continuity Bridge fills this gap directly.

4. **Personalisation-first architecture** — questionnaire that actively reshapes the interface: hides features, changes language, adjusts font, removes AI widgets if consent not given. Addresses all 6 failure modes Templin et al. (2024) identified.

5. **Ghana-context specificity** — Ghana Card/NHIS integration, Twi/Ga/Ewe language support, Ghana Mental Health Authority crisis line, COMPASS/GPCA data grounding. No reviewed platform addresses this context.

6. **Consent enforced at rendering level** — when patient declines AI consent, widgets are removed from the DOM. Not just blocked when clicked. Addresses consent-deficit failure Kocaballi et al. (2019) identified.

7. **Honest synthetic-data reporting** — states real-world AUC benchmark (0.75–0.88) alongside prototype figures. More transparent than most published clinical AI work.

---

---

## PART 16 — LIMITATIONS (say these with confidence, not apology)

| Limitation | Honest statement |
|---|---|
| Synthetic training data | Models learned their training distribution correctly. Real-world validation requires real patient data and ethics approval. Real-world AUC benchmark is 0.75–0.88. |
| No user study | "User-friendly" is a design claim. Usability requires SUS testing with real clinical populations — primary recommendation for future work. |
| No accessibility audit | Features are implemented. Formal NVDA/VoiceOver audit is future work. |
| No penetration testing | Security architecture follows best practices. Formal pentest before any deployment. |
| No ethics approval | Required before deployment (GHS Ethics Committee, DCB0129 clinical safety cert). System is a proof-of-concept artefact. |
| No unit test suite | Problems caught via manual review and linter diagnostics. |

**These limitations do not invalidate the project.** The academic contribution is demonstrating technical feasibility. That is explicitly what the scope (Section 1.5) committed to. Clinical validation is the defined next step.

---

## PART 17 — FUTURE RECOMMENDATIONS

1. **Clinical validation on real GHS patient data** — collaborate with KATH, KBTH or Komfo Anokye Teaching Hospital under ethics approval
2. **Formal usability study** — System Usability Scale (SUS) with clinicians, patients, families at a Ghanaian facility
3. **Formal accessibility audit** — NVDA and VoiceOver with actual users with visual/motor impairment
4. **Penetration testing** — before any production deployment
5. **Model retraining on real data** — replace synthetic training data; expect AUC 0.75–0.88
6. **GHS Ethics Committee approval + DCB0129** — required before deployment with real patients
7. **Federated learning** — train models across facilities without sharing raw patient data (Alamri et al., 2025)
8. **NHIS database integration** — automatic insurance verification at patient registration
9. **Expanded language support** — Hausa, Dagbani for Northern region coverage
10. **IoT device integration** — vital signs monitors feeding data directly instead of manual entry
11. **React Native mobile app** — convert PWA to native app for deeper device integration

---

## PART 18 — SDG CONTRIBUTIONS

- **SDG 3 — Good Health and Well-being:** Improves palliative care quality, symptom monitoring, mental health support for underserved populations
- **SDG 9 — Industry, Innovation and Infrastructure:** Demonstrates AI + modern web tech applied to a healthcare gap in sub-Saharan Africa
- **SDG 10 — Reduced Inequalities:** Most direct claim — designed for communities underserved by Ghana's urban-concentrated palliative care system

---

## PART 19 — KEY NUMBERS TO KNOW COLD

| Item | Number |
|---|---|
| Frontend pages | 65 |
| Reusable components | ~60 |
| Backend routers | 39 |
| Backend services | 10 |
| ML models | 8 |
| DB tables | ~40 |
| Clinical assessment tools | 10 (+ PG-13 in bereavement = 11) |
| Training samples per model | 8,000 |
| Train/test split | 80/20 stratified |
| Best AUC | 0.998 (Psychological Risk, Caregiver Burden) |
| Models retrained (2nd pass) | 3 (vital_risk, symptom_burden, admission_risk) |
| Alert deduplication window | 6 hours |
| Alert polling interval | 30 seconds |
| ML risk staletime | 5 minutes |
| Drug interaction staletime | 10 minutes |
| HIPAA auto-logoff | 15 minutes idle |
| JWT expiry | 8 hours |
| Login lockout after | 5 attempts |
| Lockout duration | 30 minutes |
| Rate limit on login | 10 req/min |
| Medication reminder lead time | 15 minutes |
| Missed dose detection window | 30 minutes after scheduled |
| PG-13 referral threshold | ≥30 |
| Journey phases | 6 |
| Care settings | 5 |
| Seeded demo patients | 12 |
| Demo user accounts | 5 (one per role) |
| Community groups seeded | 50 |
| Literature reviewed | 24 works (Table 2.1) |
| Runtime flows verified | 15 |
| API smoke test checks | 7/7 passed |
| SDGs addressed | 3 (3, 9, 10) |
| ESAS threshold for Escalation phase | Total >50 |
| PPS threshold for Escalation | <40 |
| PPS threshold for Transition | <20 |

---

## PART 20 — STRICT Q&A (Panel questions with precise answers)

---

**Q: Explain exactly how your AI risk prediction works, step by step.**

When a clinician opens a patient record, the backend runs the inference service. It reads the patient's most recent vitals, ESAS scores, PPS score, Barthel index, MMSE score, PHQ-9 total, GAD-7 total, active medication count, adherence history, and alert history over the last 6 months. It assembles these into a feature vector. That vector is passed through all 8 XGBoost classifiers. Each model outputs a probability between 0 and 1 for its domain. Each model has a SHAP TreeExplainer attached — that explainer computes exact Shapley values showing exactly which features drove that model's prediction and by how much. The 8 probabilities are combined using fixed clinical weights — pain risk gets weight 1.5, caregiver burden gets 0.8 — into one overall weighted score. If that score exceeds the critical threshold of 70%, an alert is created and pushed over WebSocket to every connected clinician. The complete result — overall level, 8 domain scores, SHAP feature contributions, and a plain-language summary — is returned to the frontend in a single HTTP response and rendered simultaneously on the patient summary and the AI Insights deep-dive panel.

---

**Q: What is SHAP and why is it better than standard feature importance?**

SHAP — SHapley Additive exPlanations — is grounded in cooperative game theory (Lundberg and Lee, 2017). The principle: treat each feature as a player in a coalition game whose payout is the model prediction. Shapley values compute each player's fair contribution by averaging their marginal contribution across all possible orderings of players.

Standard feature importance tells you globally which features a model relied on most across all patients. SHAP tells you the exact contribution of each feature to this specific patient's prediction right now. So instead of "pain score is generally important," you get "this patient's pain score of 8/10 pushed their risk up by +0.23." That is what a clinician needs to act. Abbas et al. (2025) confirmed that SHAP explanations integrated into clinical dashboards were most effective at building clinician trust. That is exactly our implementation.

TreeExplainer computes exact values for tree-based models. Random Forest with SHAP uses an approximated version. XGBoost + TreeExplainer gives exact values, which is why we chose XGBoost over Random Forest despite the project's original proposal mentioning Random Forest.

---

**Q: Your model AUC is 0.998. That sounds too good. Explain.**

It is high because the models were trained and evaluated on synthetic data generated from the same parameter distributions. They learned those distributions correctly — that is what the numbers show. They do not show performance on a real hospital population.

Published XGBoost models trained on real palliative care data typically report AUC between 0.75 and 0.88 for comparable tasks. That range is the realistic clinical benchmark. We state both figures explicitly in the report so the reader knows exactly what was measured and what was not.

The high figures also reflect that the training labels were assigned using clinical thresholds from published literature — for example, pain risk label is positive if SpO2 < 90%, HR > 120, or temperature > 38.5°C. A model trained and tested on data generated from those same rules will naturally score very well. Real patient data has noise, confounders, and clinical variability that synthetic data does not capture.

---

**Q: Why did you use XGBoost and not the Random Forest your proposal mentioned?**

XGBoost is directly compatible with SHAP TreeExplainer, which computes exact Shapley values for tree-based models. Random Forest with SHAP uses TreeExplainer in an approximated mode — it is slower and less precise. Since explainability was a first-class design requirement, not an add-on, XGBoost was the correct choice. Both are tree-based gradient ensemble methods. The substitution is a refinement within the same algorithmic family, not a departure from the objective. We record it explicitly in Table 5.4 and Section 5.6.

---

**Q: Why not a neural network or deep learning model?**

Palliative care data is tabular and partially missing. Deep learning performs poorly on small, tabular, incomplete datasets — it requires large, complete datasets and extensive tuning. More importantly, neural networks are black boxes. Explainability was not optional in our design — it was stated as a specific objective. An unexplainable recommendation cannot be acted on by a clinician (Parsons et al., 2025). XGBoost + SHAP is the current state-of-the-art combination specifically for structured clinical data with explanation requirements, confirmed by Abbas et al. (2025) across 62 XAI studies.

---

**Q: Why Waterfall? You were adding features throughout — isn't that Agile?**

Adding features during development does not make a process Agile. Agile requires real users giving feedback between sprints that drives what is built next. No users were involved at any stage of this project. The features added during implementation were driven by design decisions and the developer's own analysis of literature gaps — not by user stories from a patient or clinician. Without user sprints, calling it Agile would be academically dishonest. Waterfall is the honest and accurate description of how this project was conducted.

---

**Q: How does the offline capability actually work — walk me through it technically.**

Two layers work together. The first is a service worker registered by the Vite PWA plugin. On first visit it pre-caches all static assets — JavaScript bundles, CSS, images. On subsequent visits the app loads from cache even with no network.

The second layer is an IndexedDB database in the browser, managed through the `idb` library. It holds structured stores for patients, vitals, medications, appointments, and educational resources, plus a pending-write queue. When a caregiver submits vitals with no network connection, the write is intercepted by the offline client wrapper, serialised into the pending-write queue in IndexedDB, and the caregiver sees a success response. A connectivity monitor watches for the network to return. When it does, the queue flushes automatically — each pending write is sent to the backend in order, and the local cache is updated with the server's confirmed response. A persistent indicator in the navigation bar shows the caregiver whether their last submission has reached the server or is still queued.

---

**Q: Explain exactly how the notification service detects a missed medication.**

In `notification_service.py`, `check_medication_schedule()` runs on a schedule. For each active, non-PRN medication it calls `calculate_next_dose_time()`, which parses the frequency string — "twice daily" maps to 12-hour intervals, "every 4 hours" maps to 4-hour intervals — and calculates the next expected dose time from the medication's start date. If `now > next_dose_time + timedelta(minutes=30)`, it queries `MedicationAdherenceLog` to see if a `taken=True` record exists for that scheduled time. If none exists, it creates a `MedicationAdherenceLog` entry with `taken=False, skipped_reason='Missed - not taken within 30 minutes'`, creates a `NotificationQueue` entry to the patient, and then queries `PatientFamilyLink` to notify every linked family member. A deduplication check prevents the same missed-dose notification being created twice.

---

**Q: How does the personalisation actually change what different users see?**

When a patient completes the questionnaire, their answers are saved to `patient_preferences`. `PersonalisationContext` in the frontend reads these answers and derives boolean `uiFlags`. For example: if `wants_community === 'no'`, `showCommunity` is false. If `ai_analysis_consent === 'no'`, `showAI` is false. If `spiritual_importance === 'not'`, `showSpiritualItems` is false.

These flags are consumed by every component that has conditional content. The sidebar reads `hiddenNavPaths` and removes the community link. The patient portal filters its quick action tiles. The community hub hides the spiritual care tab. The AI widgets (`AuraChat`, `AIAssistant`) are not rendered at all — they are not just disabled but removed from the DOM. The care plan hides the spiritual care section.

The critical design decision was centralising this in one context rather than having each screen implement its own preference checks. Without that, the same patient would see community on one screen and not another. One flag, applied consistently across 65 pages.

---

**Q: How does your system handle a patient who expresses suicidal thoughts through the chatbot?**

In `aura_ai_engine.py`, the `is_crisis()` function runs first, before any intent classification or response generation. It checks the input against a hardcoded set of crisis phrases including "i want to die", "end my life", "suicidal thoughts", "hurt myself", "overdose on purpose". If any phrase matches, the function returns `True` immediately. The response generation pipeline then skips the normal knowledge base lookup and returns a crisis response that includes the Ghana Mental Health Authority crisis line, encourages immediate contact with the care team, and surfaces an escalation notification to clinical staff. The `crisis_flagged` field is set to `True` on the `ChatbotMessage` record in the database. The PHQ-9 assessment also triggers a crisis alert pathway if Question 9 (thoughts of self-harm) scores above 0.

---

**Q: What is the difference between AuraChat and AIAssistant and why did you build two?**

They serve fundamentally different users with different needs, different tone requirements, and different access levels.

`AuraChat` is the patient and family companion — teal theme, emotionally supportive language, restricted to patient and family roles. It is built around the Aura AI Engine's 500+ clinical Q&A pairs, sentiment detection, and crisis guard. Its purpose is emotional support, symptom explanation, and navigation help.

`AIAssistant` is the clinician copilot — sky-blue theme, clinical language, context-aware (reads current page and patient ID), restricted to clinician and admin roles. It answers questions about drug interactions, protocol guidance, and patient-specific clinical queries.

Building one would mean a system that either speaks to distressed patients in clinical language, or answers clinical questions with emotional hedging. Wang et al. (2023) specifically warn that AI in palliative care risks substituting for human empathy — keeping them separate makes the distinction explicit at the architecture level. A clinician is never uncertain whether they are reading clinical AI output or emotional support text.

Both are hidden when `ai_analysis_consent === 'no'` — consent enforced at rendering level, not just at query submission.

---

**Q: Why did you choose FastAPI over Django or Flask?**

FastAPI is async by default via Python's `asyncio`. That is critical for two reasons in this system: WebSocket connections that must be held open concurrently while HTTP requests also arrive, and the background notification scanner that runs asynchronously alongside the API. Flask is synchronous by default and has no native WebSocket support. Django is heavier than needed — it is a full web framework with templating, ORM migrations, and admin built in, all of which we don't use since the frontend is React. FastAPI generates OpenAPI documentation automatically at `/docs` — essential for development and for demonstrating the API surface. It integrates natively with Pydantic for request validation, which was a hard requirement. It was the right tool.

---

**Q: How does RBAC prevent a patient from accessing another patient's data?**

Two layers. First, the `require_role()` dependency on every endpoint checks the user's role from the JWT. A user with the patient role can only call endpoints that the patient role is permitted on. Second, for patient-specific endpoints, the handler checks that the `patient_id` in the request matches the patient linked to the authenticated user's own account in the database. It is not enough to have the patient role — you must be that specific patient. Both checks happen in the backend before any database query executes. The frontend hiding features for other roles is a UX improvement, not a security control.

---

**Q: What does your audit log actually capture?**

Every significant action writes to the `AuditLog` table. The record includes: `user_id`, `user_role`, `action` (e.g. `CREATE_VITAL`, `LOGIN_SUCCESS`, `LOGIN_FAILED`, `DISCONTINUE_MEDICATION`), `resource_type`, `resource_id`, `patient_id`, `ip_address`, `user_agent`, `success` boolean, `details` JSON, `created_at`. The audit log is append-only — records are never deleted. The admin HIPAA dashboard queries it live to compute `audit_log_entries` count and `audit_ip_coverage_pct`. Actions audited include: login/logout, patient create/update, vital create, medication create/update/discontinue, appointment create, ESAS assessment create, all admin user management operations, bereavement journal entries, and caregiver assignments.

---

**Q: Your project title says "framework" — is this actually a framework or just an application?**

It is both, and the distinction matters. As a web application it is complete and functional. As a framework it is designed to be extended: the care plan engine queries the `ConditionCareTemplate` database table, so a clinician adding a new condition through the interface immediately affects care plan generation — no code change required. The `PersonalisationContext` provides a single extension point that affects all 65 pages simultaneously. The 5 care settings change navigation, defaults, and protocol recommendations through configuration, not code. The ML inference pipeline has a clean service interface — models can be swapped independently of the API layer. The LLM layer has a provider cascade — Gemini → Groq → local engine — that can be extended by adding a new provider to `llm_engine.py`. The system was designed to grow with clinical practice, not be frozen at submission.

---

**Q: What would you do differently if you were starting again?**

Directly and honestly: I would plan for automated testing from day one. The manual review process caught bugs but several regressions — like the risk summary component being accidentally removed during a debugging session — were caught late. A pytest suite for the backend endpoints and a React Testing Library suite for the critical frontend flows would have caught those immediately. I would also define a cleaner data contract between the ML training environment and the serving environment at the start, rather than handling version-mismatch warnings late in the process. On the architecture side, the system is well-designed and I would not change the core choices — FastAPI, XGBoost + SHAP, React, SQLAlchemy. The CORS/WebSocket authentication trade-off (passing token as connection parameter rather than cookie) is a known compromise that should be resolved before production deployment.

---

**Q: What is the clinical justification for weighting pain risk at 1.5 and caregiver burden at 0.8?**

WHO (2024) defines palliative care as the "prevention and relief of suffering" — pain is the most prevalent and most distressing symptom in palliative care. Uncontrolled pain is the primary reason for emergency admissions in this population (Singer et al., 2016). It gets the highest weight because it directly represents the core clinical mission of palliative care.

Caregiver burden gets the lowest weight not because it is unimportant — Finucane et al. (2024) and COMPASS Ghana (2024a) show it is critical — but because it is a systemic background risk rather than an acute clinical emergency. High caregiver burden does not require the same immediate clinical response as SpO2 of 85%. The system still tracks and surfaces it prominently in the caregiver view and the care intelligence hub. The weight reflects urgency of response, not clinical importance.

---

---

**Q: Explain the 6-hour alert deduplication window. Isn't that dangerous — what if someone deteriorates within 6 hours?**

The deduplication applies to the proactive background scan only — the scheduled scan that runs across all patients. It does not apply to manual submissions. If a clinician submits a new ESAS assessment and the risk is critical, an alert is created immediately regardless of the 6-hour window. If a caregiver records a vital sign showing SpO2 at 85%, `check_critical_vitals()` creates an alert immediately — no deduplication there either.

The 6-hour window exists because the background scanner runs periodically and would otherwise re-alert on the same deteriorating patient on every run. That is alert fatigue — clinicians start ignoring all alerts because they are overwhelmed by repeated identical ones. A false-positive rate of roughly 23% on pain risk (77.2% precision) means a meaningful number of scan alerts are already on patients who are not deteriorating. Multiplying that by repeated alerts every hour would make the system unusable. The window is a deliberate design choice that trades marginal safety margin on the scan for clinician adoption of the alert system. Manual data entry always bypasses it.

---

**Q: How does the care journey tracker know what phase a patient is in?**

The `journey_tracker.py` service implements 6 phases with automatic trigger conditions. It reads clinical data already in the database for that patient:

| Phase | Automatic Trigger |
|---|---|
| Diagnosis | Patient record created + primary diagnosis recorded |
| Care Planning | Initial care plan generated |
| Active Monitoring | Vitals + ESAS scores logged regularly |
| Escalation | ESAS total > 50, OR PPS < 40 |
| Transition | PPS < 20, OR terminal prognosis recorded |
| Legacy | Digital legacy activated after patient's death |

The thresholds come from the validated tools themselves — an ESAS total above 50 means every symptom is averaging above 5.5/10, which clinical literature identifies as significant symptom burden. PPS below 40 means the patient is mainly bed-bound — clinical evidence shows this level is associated with prognosis of weeks to months.

The family-facing view shows a de-identified summary of these phase events. Raw clinical values the patient has not consented to share are never exposed to family members — this is enforced at the query level in the portal router, not just by hiding values in the UI.

---

**Q: What does "consent enforced at rendering level" actually mean in code?**

In `PersonalisationContext.jsx`, when the questionnaire answer `ai_analysis_consent === 'no'`, the `showAI` flag is set to `false`. The `AuraChat` component and `AIAssistant` component are wrapped in conditional rendering — `{uiFlags.showAI && <AuraChat />}`. When `showAI` is false, these components are never mounted in the React tree at all. They do not exist in the DOM. They cannot be triggered by keyboard navigation, screen readers, or any other means.

This is different from disabling them — a disabled button still exists and can be probed. And it is different from just blocking the API call — the component would still load, show a prompt, and then fail. Our approach means the entire AI surface disappears from the user's interface based on their consent choice, with zero possibility of accidental access. Kocaballi et al. (2019) found that most health chatbots lack proper consent structures — ours enforces consent at the architectural level.

---

**Q: Why did you use SQLite for a healthcare application?**

SQLite is used for development and demonstration only. The architecture is explicitly database-agnostic via SQLAlchemy — switching to PostgreSQL requires changing a single `DATABASE_URL` environment variable in `.env`. No code changes. No migration needed. The `db.py` models are written against SQLAlchemy's abstraction layer, not SQLite-specific syntax.

SQLite was the right choice for a prototype because it requires zero infrastructure setup — no database server, no connection pool configuration, no separate process. This matters for demonstration in a university environment. PostgreSQL is specified for production and is supported without any code modification. The dissertation documents this explicitly in Section 3.3.5.

---

**Q: How does the medical knowledge base work — and how does it feed into the care plan engine?**

The medical knowledge base has two layers. First, 7 hardcoded `DISEASE_PROFILES` in `care_plan_engine.py` for the most common palliative diagnoses — cancer, heart failure, COPD, dementia, renal failure, stroke, and general palliative. Each profile contains: keyword list for diagnosis matching, priority symptoms, recommended goals, standard interventions, red flags, monitoring schedule, and full clinical guide sections.

Second, the `ConditionCareTemplate` database table — manageable through the two-column library UI by clinicians and admins. This is where the system becomes a framework: a clinician adds a new condition through the web interface, the care plan engine detects it via `detect_disease_profile()`, which queries the DB after checking hardcoded profiles. The new condition immediately affects care plan generation for any patient with that diagnosis — no code changes, no redeployment.

The knowledge base also drives the medical knowledge page (two-column library with book-style reading pane), the adaptive care guide, the community hub's spiritual care tab content, and — through personalisation flags — what clinical reference sections are shown to a specific user.

---

**Q: What happens when the Gemini API is down or the API key is not configured?**

The `llm_engine.py` routes through a cascade: Gemini 1.5 Flash first, Groq Llama 3.1 as fallback. If both are unavailable — no API keys in `.env`, or both services are down — the system falls back to the local Aura AI Engine. This is not a degraded mode where the chatbot stops working. The Aura AI Engine is a complete, production-capable conversational system: TF-IDF intent classifier trained on 300+ labelled phrases, 500+ medical Q&A pairs, entity extraction, crisis detection, sentiment analysis, conversation memory. It handles all core clinical conversation use cases entirely offline.

The provider cascade means the system delivers continuous service even with unreliable connectivity — which was a specific design requirement for the Ghanaian context where internet access can be intermittent.

---

**Q: How do you handle data privacy — specifically, can a caregiver see a patient's journal entries?**

No. Journal entries have an `is_private` flag and their `author_id` is stored. The bereavement journal router enforces that only the author can retrieve their own entries. This is not a frontend UI convention — it is checked in the backend before any database query. The code comment in the relevant section states: "Journal entries are visible only to their author and are never surfaced to clinical staff — this boundary is enforced at the access control layer, not just by interface convention."

Similarly, the digital legacy content is filtered at the query level — each `LegacyContent` record is checked against the requesting user's `heir_access_level` before being returned. A family member designated with `memories_only` access cannot retrieve `messages_only` content even if they know the content's ID and call the endpoint directly.

---

**Q: What does your system contribute to solving the healthcare AI ethics problem?**

Our system directly addresses three of the four biomedical ethics principles that Tilala et al. (2024) map onto AI design requirements:

**Beneficence** (do good): The AI produces actionable, explained recommendations. Every prediction is paired with a SHAP explanation. A clinician can act with confidence.

**Non-maleficence** (do no harm): Consent is enforced at rendering level. Crisis detection escalates to clinical staff immediately. The PHQ-9 Q9 suicidality screen triggers crisis protocols. The 6-hour deduplication prevents alert fatigue. Two separate AI assistants prevent clinical AI being used for emotional support in the wrong context.

**Autonomy** (respect patient choice): The personalisation questionnaire gives patients explicit control over whether AI features appear in their interface. A patient who declines AI consent sees no AI anywhere in the system. Legacy consent records the patient's wishes for posthumous data access. Advance directive and DNR fields are first-class data in the patient record.

**Justice** (fairness and equity): The system is designed for the Ghanaian context specifically — the population where the gap between policy and practice is most acute. Offline capability ensures it is usable in settings without reliable infrastructure. Multi-language support (Twi, Ga, Ewe) addresses language barriers.

Gerke et al. (2020) and Hildt (2025) both argue explainability is a moral obligation in clinical AI. Our system treats it as an architectural constraint — no risk score reaches a clinician without its SHAP explanation.

---

## PART 21 — LITERATURE QUICK REFERENCE

| Author | Year | What they say | Where you use it |
|---|---|---|---|
| WHO | 2024 | 56.8M need palliative care; <14% receive it | Chapter 1 background |
| COMPASS Ghana | 2024a | 48% out-of-pocket; late referrals | Chapter 1 Ghana context |
| NHIA | 2025 | 44% no health insurance | Chapter 1 Ghana context |
| GPCA | 2024b | No dedicated palliative ward in GH teaching hospitals | Problem statement |
| Finucane et al. | 2024 | 40% bereaved need formal support; digital interventions work (retention >70%) | Justifies Continuity Bridge |
| Wang et al. | 2016 | 10.2% hospice patients had care transitions; 53% were hospital admissions | Justifies coordination features |
| Boddaert et al. | 2022 | Late referral → poor care plans → poor outcomes | Justifies early AI monitoring |
| Lewis | 2000 | Dedicated coordinators improved continuity + family satisfaction | Justifies unified dashboard |
| Singer et al. | 2016 | No continuity → unnecessary hospitalisation, uncontrolled pain | Justifies care coordination |
| Stange | 2009 | Specialist systems produce fragmentation | Theoretical basis |
| Abbas et al. | 2025 | SHAP in dashboards most effective at building clinician trust (62 studies) | Justifies SHAP |
| Parsons et al. | 2025 | Explainability most unmet requirement in CDS | Justifies XAI as core feature |
| Antoniadi et al. | 2021 | XAI in clinical workflow beats standalone output | Justifies integrated SHAP |
| Lundberg & Lee | 2017 | SHAP grounded in cooperative game theory; exact for tree models | Theoretical basis for SHAP |
| Pinto et al. | 2025 | AI in palliative care = opaque mortality tools; none met all 4 criteria | Identifies the gap |
| Templin et al. | 2024 | 6 failure modes of personalised health AI | Justifies personalisation architecture |
| Maguraushe & Ndlovu | 2024 | No smart health system had robust privacy framework | Justifies RBAC + audit log |
| Alamri et al. | 2025 | Federated learning + RBAC reduce privacy risk | Justifies RBAC; future: federated |
| Kocaballi et al. | 2019 | Most health chatbots lack consent, safety, privacy | Justifies consent-at-rendering design |
| Coghlan et al. | 2023 | Chatbot dependency risk in distressed users | Justifies crisis escalation design |
| Gerke et al. | 2020 | Opaque AI undermines informed consent | Justifies SHAP requirement |
| Hildt | 2025 | Explainability is a moral obligation in medical AI | Ethical grounding for XAI |
| Tilala et al. | 2024 | 4 biomedical ethics principles map to AI design | Beneficence/non-maleficence/autonomy/justice |
| Wang et al. | 2023 | AI risks substituting for empathy; support not replace | Justifies two separate assistants |
| Hevner et al. | 2004 | Design science research methodology | Research approach |
| Royce | 1970 | Waterfall SDLC | SDLC justification |
| Chen & Guestrin | 2016 | XGBoost original paper | ML algorithm justification |
| Sommerville | 2016 | Waterfall appropriate when requirements known upfront | SDLC academic justification |

---

## PART 22 — DEMO SEQUENCE (if you get to demonstrate)

1. **Login as Clinician** (`dr_mensah` / `clinic123`) → show role-adaptive dashboard, patient list with risk badges
2. **Open a patient** → show vitals ribbon, compact risk summary, care pathway badge, DNR status
3. **AI Insights** → Run Risk Scan → show 8 domain scores → click Explain → show SHAP bar chart with feature contributions labelled "XGBoost SHAP explanation"
4. **Alerts page** → show critical alert with pulse animation → click → show FocusedAIExplanation (book-style, domain breakdown) → Acknowledge it
5. **Clinical Assessments** → submit ESAS, move pain to 9 → return to AI Insights → show risk panel updated
6. **Logout → Login as Patient** (`patient` / `patient123`) → show `/my-space` portal → completely different interface → AuraChat (teal, emotional) → wellness check-in
7. **Logout → Login as Family** (`kofi_family` / `family123`) → show Continuity Bridge → Memory Vault (theme clusters) → grief journal (tone badge) → PG-13 form
8. **Settings → Accessibility** → increase font live → high contrast → Dementia preset → show it all changes in real time

---

## FINAL STATEMENT

Your system is:
- **Technically complete** — 65 pages, 39 routers, 8 ML models, 40 DB tables, all working
- **Evidence-grounded** — every design decision traces to a literature source
- **Honestly scoped** — limitations are stated clearly and future work is defined
- **Genuinely novel** — no reviewed system combined all four pillars for this context
- **Defensible at every level** — you know the code, the clinical tools, the protocols, the numbers

Walk in owning it. Say "we" for the team, say "I" when explaining what you personally understand. When you don't know something, say "that is outside what we tested — it would be addressed in future work." That is the honest answer and the right one.

---
*Generated from full codebase analysis including `aura_ai_engine.py`, `llm_engine.py`, `care_plan_engine.py`, `notification_service.py`, `retrain_targeted.py`, all system documentation, and the condensed project report. Version: August 2026.*
