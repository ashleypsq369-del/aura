# ProjectAura — Complete System Master Documentation

> **Last Updated:** July 28, 2026
> **Version:** 3.1 (Post-UI Polish · Personalisation Engine · Methodology Clarification)
> **Stack:** React 19 + Vite · FastAPI + SQLAlchemy · XGBoost + SHAP · SQLite · WebSockets

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Development Methodology](#2-development-methodology)
3. [Architecture](#3-architecture)
4. [User Roles](#4-user-roles)
5. [What's New — July 2026 Session](#5-whats-new--july-2026-session)
5. [Frontend — Pages](#5-frontend--pages)
6. [Frontend — Components](#6-frontend--components)
7. [Frontend — Hooks](#7-frontend--hooks)
8. [Frontend — Context Providers](#8-frontend--context-providers)
9. [Frontend — API Client](#9-frontend--api-client)
10. [Backend — Routers / Endpoints](#10-backend--routers--endpoints)
11. [Backend — Services](#11-backend--services)
12. [ML System — 8 XGBoost Models + SHAP](#12-ml-system--8-xgboost-models--shap)
13. [Database Models](#13-database-models)
14. [Personalisation Engine](#14-personalisation-engine)
15. [Accessibility System](#15-accessibility-system)
16. [Settings & Feature Flags](#16-settings--feature-flags)
17. [Dark Mode System](#17-dark-mode-system)
18. [Mobile Responsiveness](#18-mobile-responsiveness)
19. [AI Systems](#19-ai-systems)
20. [Care Setting System](#20-care-setting-system)
21. [Digital Legacy System](#21-digital-legacy-system)
22. [Bereavement Support System](#22-bereavement-support-system)
23. [Toast Notification System](#23-toast-notification-system)
24. [Authentication & Security](#24-authentication--security)
25. [Environment & Configuration](#25-environment--configuration)
26. [File Tree](#26-file-tree)
27. [System Interaction Flows](#27-system-interaction-flows)
28. [Test Results & Evaluation Status](#28-test-results--evaluation-status)
29. [Objectives Fulfilment Mapping](#29-objectives-fulfilment-mapping)
30. [Why ProjectAura Is a Framework](#30-why-projectaura-is-a-framework)

---

## 1. System Overview

**ProjectAura** is a comprehensive digital palliative care platform for Ghana and globally. It unites clinical management, AI risk prediction, patient/family support, bereavement tools, and peer community features.

### Core Mission
Improve palliative care outcomes by giving clinicians real-time ML risk insights, patients dignity and autonomy, and families connection before and after bereavement.

### Quick Access
| URL | Purpose |
|---|---|
| `http://localhost:5173` | Frontend dev server (Vite hot-reload) |
| `http://localhost:8000` | Backend FastAPI server |
| `http://localhost:8000/docs` | Interactive Swagger API docs |
| `http://localhost:8000/redoc` | ReDoc API documentation |

### Demo Logins
| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Clinician | `dr_mensah` | `clinic123` |
| Patient | `patient` | `patient123` |
| Family | `kofi_family` | `family123` |
| Caregiver | `caregiver1` | `care123` |

---

## 2. Development Methodology

### 2.1 Chosen Methodology: Waterfall (Literature-Driven)

ProjectAura followed a **sequential Waterfall methodology**, adapted for the constraints of a solo final-year undergraduate dissertation project. This choice is justified by three key realities of how the project was conducted:

1. **No direct stakeholder consultation.** Requirements were not gathered through interviews, focus groups, or surveys with clinicians, patients, or families. No real users were consulted at any stage of development.

2. **Requirements derived from literature, not users.** System requirements were extracted from published clinical frameworks and academic literature:
   - ESAS (Edmonton Symptom Assessment System) — validated 8-symptom palliative care tool
   - WHO (2020) *Palliative Care Fact Sheet* — global need and care gap evidence
   - Hui & Bruera (2017) — clinical decision-making frameworks in palliative oncology
   - HIPAA Security Rule — data protection requirements for health records systems
   - NHS Coordinate My Care programme documentation — multi-role care coordination patterns

3. **No user acceptance testing.** The system was evaluated through technical testing only — API endpoint tests (`test_api.py`), ML model validation (AUC/ROC curves, confusion matrices), and SHAP explainability correctness checks. No usability testing with target clinical populations was conducted.

Because requirements were defined upfront from literature and did not evolve through user feedback loops, the Waterfall model is the honest and accurate description of this project's lifecycle.

---

### 2.2 Why Not Other Models

| Model | Reason Not Applicable |
|---|---|
| **Agile / Scrum** | Agile requires real users providing feedback between sprints. No users were involved. Feature additions during development were driven by design decisions, not user stories. |
| **Iterative / Incremental** | IID requires validated feedback from a user population to justify each new iteration. Without user testing, what appeared iterative was simply sequential implementation of a pre-planned feature set. |
| **Prototyping** | Prototyping builds a throwaway mock to gather user reactions before committing to a design. No prototype was shown to stakeholders — no stakeholders existed for this project. |
| **Spiral** | Spiral is a risk-driven enterprise model requiring formal risk registers and management reviews between each cycle. Inapplicable to a solo student project. |
| **Big Bang** | Big Bang implies no structured plan — features are implemented in arbitrary order. ProjectAura had a deliberate design-first approach: database schema → API → ML pipeline → frontend. |

---

### 2.3 Development Phases (as executed)

| Phase | Activities | Key Outputs |
|---|---|---|
| **1. Literature Review & Problem Analysis** | Systematic review of palliative care coordination challenges, existing systems (PalliativeCare.org, NHS CmC), and clinical assessment tools. Gap analysis: no AI-powered, multi-role, community-integrated system existed for sub-Saharan contexts. | Research notes, requirements list, gap analysis |
| **2. Requirements Specification** | Functional requirements derived from clinical literature. Non-functional requirements: WCAG 2.1 AA accessibility, HIPAA audit compliance, offline capability, multi-role RBAC. No user interviews conducted. | 47 functional requirements, 12 non-functional requirements |
| **3. System Design** | Database schema (34 SQLAlchemy models, `db.py`). API architecture (FastAPI, 39 routers). ML pipeline design (XGBoost × 8 tasks, SHAP TreeExplainer). UI role-based navigation structure. | `db.py`, API router structure, ML pipeline spec |
| **4. Implementation** | Backend-first: auth → patient CRUD → vitals → ML → notifications. Frontend: routing → role dashboards → forms → AI integration. | Full-stack system: 39 API endpoints, 8 ML models, 30+ frontend pages |
| **5. Technical Testing & Validation** | API endpoint testing (`test_api.py`). ML model accuracy: AUC/ROC curves (Fig 5.2), confusion matrices. SHAP value correctness. Accessibility audit (automated). | Test results, Figures 5.1 & 5.2 |
| **6. Evaluation & Documentation** | System capability review against requirements. Identification of limitations. Dissertation write-up. This documentation. | Dissertation, system docs, figures 3.1–5.2 |

---

### 2.4 Academic Justification for Waterfall

The Waterfall model is appropriate when requirements are well-understood before implementation begins (Sommerville, 2016). In this project, requirements were derived from validated clinical tools and published evidence rather than evolving through discovery with users. This mirrors how many clinical decision-support system prototypes are built in academic research settings — from evidence-based specification rather than participatory design.

> *"Although participatory design and user-centred iterative approaches are generally preferred for healthcare systems, the scope of this project — a solo undergraduate dissertation without access to clinical populations for ethical research — necessitated a literature-driven, sequential development approach. User acceptance testing and co-design with clinicians and patients are explicitly identified as primary directions for future work."*

---

### 2.5 Acknowledged Limitations

The absence of user involvement is a significant limitation that is acknowledged transparently:

- **No requirement validation** — requirements reflect the developer's interpretation of clinical literature, not verified clinician needs
- **No usability testing** — the interface has not been evaluated for learnability or efficiency with real clinical users
- **No clinical validation** — ML risk predictions have not been validated against real patient outcomes; synthetic training data was used
- **No ethical approval** — the system was developed as a proof-of-concept artefact; deployment with real patients would require full NHS/GHS ethics committee approval, GDPR compliance review, and clinical safety certification (DCB0129)

These limitations do not invalidate the project as an academic artefact. The contribution is a **functional proof-of-concept system** demonstrating the technical feasibility of AI-assisted palliative care coordination, with a clear pathway to clinical validation in future work.

---

## 3. Architecture

```┌─────────────────────────────────────────────────────┐
│  Frontend (React 19 + Vite)  :5173 / served by :8000│
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ PatientPortal│ │ClinicianDash │ │FamilyPortal  │ │
│  └─────────────┘ └──────────────┘ └──────────────┘ │
│  ┌──────────────────────────────────────────────────┐│
│  │ PersonalisationContext → uiFlags (hide/show)    ││
│  │ AppSettingsContext → theme/sidebar/features     ││
│  │ AccessibilityContext → font/motion/contrast     ││
│  └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
              ↕ REST / WebSocket
┌─────────────────────────────────────────────────────┐
│  Backend (FastAPI + SQLAlchemy)  :8000              │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │ 39 Routers   │ │ 13 Services  │ │ ML Pipeline │ │
│  └──────────────┘ └──────────────┘ └─────────────┘ │
│  ┌──────────────────────────────────────────────────┐│
│  │ SQLite (aura.db) — 34 demo users pre-seeded     ││
│  │ XGBoost models × 8 tasks + SHAP TreeExplainer   ││
│  └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

## 4. User Roles

| Role | Dashboard | Key Features |
|---|---|---|
| **admin** | `/dashboard` | User management, audit log, HIPAA, model bias |
| **clinician** | `/dashboard` | Patient list, AI insights, alerts, care plans, medical KB |
| **caregiver** | `/dashboard` | Assigned patients, daily care log, shift handover |
| **patient** | `/my-space` | Wellness check-in, care plan, resources, community |
| **family** | `/dashboard` | Continuity bridge, memory vault, bereavement support |

---

## 5. What's New — July 2026 Session

### 4.1 Personalisation Engine (NEW)
The questionnaire now fully customises the system per user:

**At questionnaire completion:**
- `language_pref` → sets `document.lang` + `app_language` immediately
- `tech_comfort: basic/low` → font size large/xlarge, large touch targets, sidebar icons mode
- `theme_pref` → applies CSS class to `<html>`, stores in localStorage
- `notification_pref: none` → disables all in-app notifications
- `activity_level: bedbound/very_low` → enables reducedMotion + largeTouch
- `ai_analysis_consent: no` → hides AuraChat + AIAssistant globally
- `wants_community: no` → removes Community from sidebar + PatientPortal quick actions
- `legacy_interest: no` → removes Legacy Setup, Heir Management, Legacy Content from sidebar

**New questionnaire questions added:**
- Theme preference (Light / Dark / Auto)
- Notification preference (All / Important only / None)

**On every login (returning users):**
Global applier in `AppRoutes` fetches preferences from backend once per session (guarded by `sessionStorage`) and re-applies all settings.

### 4.2 PersonalisationContext (NEW)
`frontend/src/context/PersonalisationContext.jsx`

Derives `uiFlags` and `hiddenNavPaths` from questionnaire responses. Every component reads from this instead of checking preferences directly.

**uiFlags include:**
- `showCommunity` — false if `wants_community: no`
- `showLegacy` — false if `legacy_interest: no`
- `showAI` — false if `ai_analysis_consent: no`
- `showSpiritualItems` — false if `spiritual_importance: not`
- `simplifiedNav` — true if `tech_comfort: basic` or `info_style: simple`
- `isBurntOut`, `isBereaved` — derived from questionnaire emotional state

**What gets hidden by PersonalisationContext:**
- Sidebar nav items (Community, Legacy paths, Digital Legacy, etc.)
- CarePlanDetail: Spiritual Care section
- MedicalKnowledge tabs: spiritual_care field hidden
- CommunityHub tabs: Spiritual Care tab removed
- BereavedFamilyDashboard tabs: Grief Journey if not bereaved
- PatientPortal quick actions: Community, Memory Vault, AI Companion filtered
- AI widgets (AuraChat + AIAssistant): hidden if no AI consent
- CareGuide tabs: spiritual items filtered

### 4.3 Medical Knowledge Base — CRUD (NEW)
- Backend: `POST /api/medical/conditions` — create (clinician/admin)
- Backend: `PUT /api/medical/conditions/:name` — update (clinician/admin)
- Backend: `DELETE /api/medical/conditions/:name` — delete (admin only)
- Frontend: Add/Edit forms with tag inputs for keywords, red flags, symptoms
- GET `/api/medical/conditions` now returns `can_edit` flag

### 4.4 Medical KB + CareGuide — Two-Column Library Layout (NEW)
Both pages redesigned from card grid + modal → **two-column library**:
- Left sidebar: searchable index with dot colours per entry
- Right pane: full reading view with book-like sections
- CareGuide: Contents page inside protocol modal, §-numbered sections
- MedicalKnowledge: `BookSection` components, chapter tabs with §-numbers

### 4.5 Book-Like Detail Modals (NEW)
All detail/preview forms redesigned to look like clinical reference books:
- `ConditionModalContent`: left-border sections, §-footnotes, contained boxes
- `ProtocolModalContent`: chapter number badges, colour-accent stripes, contents list
- `RiskExplanationPanel`: ledger-style risk header, folder tabs with § numbers
- `FocusedAIExplanation`: per-section bordered boxes with accent stripes
- `ResourceModal`: reading-guide line, `border-l-2` margin annotation style

### 4.6 Settings — All Buttons Wired (FIXED)
Previously placeholder-only items now all functional:
- Install App (PWA) — shows when `pwa.canInstall` is true, calls `pwa.install()`
- Restart App Tour — calls `useRestartTour()` hook, fires `aura:restart-tour` event
- Clear All Data — now clears all 19 relevant localStorage keys + shows toast
- Language change — shows `toast.success('Language updated')`
- Accessibility Reset — shows toast confirmation
- `featureSettings.virtualizedLists` — wired to PatientDataTable page size
- `featureSettings.smoothScrollReveal` — wired to AOS init in AppRoutes
- `featureSettings.pageProgressBar` — wired in NProgressBar ✅ (was already done)
- `featureSettings.errorBoundaries` — wired in SectionErrorBoundary ✅

### 4.7 Dark Mode — Comprehensive Fix
Added `dark:` Tailwind variants across:
- `AuraChat` — message area, AI bubbles, history cards, feel-scale buttons
- `AIAssistant` — conversation area, chip buttons, capability cards
- `AuraOnboarding` — tour card background, skip confirm overlay
- `Settings` — Section wrapper (cascades to ALL settings cards), tab bar
- `Notifications` — page bg, filter card, group containers, row hover
- `PatientPortal` — Section component (cascades to all portal sections)
- `Dashboard` — care updates card, patient table footer
- `CommunityHub` — ML recommendation panel, inner group cards
- `BereavedFamilyDashboard` — sticky tab bar
- `MyLegacyAccess` — page bg, sticky tabs, list/content cards
- `ContinuityBridge` — sticky tab bar
- `AdminUserManagement` — table header text (was `text-slate-200` on light bg)
- `Journal` — privacy notice, prompt card, entry cards
- `MemoryVault` — memory cards, empty state

### 4.8 Mobile Responsiveness Fixes
- **Sidebar mobile**: when drawer opens, `showLabels = isOpen ? true : expanded` — labels always show on mobile
- **WellnessCheckin ESAS buttons**: `w-9→w-7 sm:w-9`, overflow-x-auto scroll row
- **PageHeader**: `px-6→px-3 sm:px-6 md:px-8` to prevent left-clip on small screens
- **Global CSS**: `html, body { overflow-x: hidden; max-width: 100vw }` added
- **Dashboard** (all 3 role views): `px-8 → px-4 sm:px-8`
- **Resources, MemoryVault, Journal, Settings**: `px-6 → px-3 sm:px-6`
- **`.page-section`** utility class added to `index.css` (responsive padding 12px→32px)

### 4.9 Toast / Sonner Fixes
- Sonner `offset="80px"` prop positions toaster below 60px header
- `expand={false}`, `visibleToasts={3}`, `gap={6}` — clean stacked look
- Duration increased to 6000ms
- Duplicate "Offline data ready" toast fixed with `id: 'offline-prefetch'`
- `prefetchForOffline()` now only fires on `user?.id` change (not every render)

### 4.10 Audit Log Fix
- Frontend was calling `/api/admin/audit-logs` (plural) → fixed to `/api/admin/audit-log`
- Frontend used `action_type` param → fixed to `action`

### 4.11 KPI/Stat Cards Reduced
Across Medications, Appointments, ModernCard `ProStatCard`:
- Number: `text-4xl → text-2xl font-bold`
- Icon box: `w-8 h-8 → w-6 h-6`
- Padding: `px-5 py-4 → px-4 py-3`

### 4.12 Patient Page Max-Width Gap Fixed
`Patients.jsx` had `max-w-5xl` wrapper causing right-side gap when sidebar collapsed. Removed the max-width constraint so table fills full available width.

---

## 5. Frontend — Pages

### Patient-Facing
| Page | Route | Description |
|---|---|---|
| `PatientPortal` | `/my-space` | Personalised dashboard with quick actions (filtered by uiFlags), journey phase, community groups, care team |
| `WellnessCheckin` | `/wellness-checkin` | ESAS 8-item daily symptom check-in, trend comparison, ML feedback |
| `Journal` | `/journal` | Grief/legacy journal with compassionate prompts, private entries |
| `MemoryVault` | `/memory-vault` | Memory preservation, clustering by theme, photos |
| `MyJourney` | `/my-journey` | Care timeline, life events, journey phase tracker |
| `ContinuityBridge` | `/continuity-bridge` | Patient legacy space: messages, memories, journal, heir management |
| `BereavedFamilyDashboard` | `/bereavement-support` | Grief support, screening, counseling, support groups (tabs personalisation-filtered) |
| `MyLegacyAccess` | `/my-legacy-access` | Heir view of deceased patient's legacy |
| `PersonalisationQuest` | `/setup` | 10-step onboarding questionnaire (patient) / 8-step (family) |

### Clinician-Facing
| Page | Route | Description |
|---|---|---|
| `Dashboard` | `/dashboard` | Overview (clinician/caregiver/admin/family — role-adaptive) |
| `Patients` | `/patients` | Patient list with TanStack Table, sorting, filtering |
| `PatientDetail` | `/patients/:id` | Full patient profile, risk summary, caregiver assignment |
| `AIInsights` | `/ai-insights` | Two-pane: patient list + DeepDive XAI panel |
| `Alerts` | `/alerts` | Clinical alert feed with StatStrip, FocusedAIExplanation |
| `CareGuide` | `/care-guide` | **Two-column library**: index sidebar + reading pane (8 static protocols) |
| `MedicalKnowledge` | `/medical-knowledge` | **Two-column library**: index + reading pane + Add/Edit for clinician/admin |
| `AdaptiveCareGuide` | `/care-guide/:patientId` | AI-personalised care guide for a specific patient |
| `CarePlanDetail` | `/patients/:id/care-plan` | Goals, interventions, AI-explain, section editor |
| `ShiftHandover` | `/shift-handover` | End-of-shift notes |
| `DailyCareLog` | `/daily-care-log` | Caregiver daily log |
| `PreClinicChecklist` | `/pre-clinic` | Pre-appointment checklist |
| `AssessmentDashboard` | `/assessments/:id` | Hub for all clinical assessments |

### Shared
| Page | Route | Description |
|---|---|---|
| `Settings` | `/settings` | Tabbed: Profile, Avatar, Appearance, Accessibility, AI & Features |
| `Messages` | `/messages` | Real-time chat with `?userId=X` deep-link |
| `Notifications` | `/notifications` | Grouped by Today/Week/Older, type/status filter |
| `CommunityHub` | `/community` | Group listing, ML recommendations, spiritual tab (personalisation-filtered) |
| `Resources` | `/resources` | Educational resources with PDF viewer, bookmarks |
| `Profile` | `/profile` | Profile edit, password change |
| `AuditLog` | `/admin/audit` | Audit trail (admin only) — fixed route `/api/admin/audit-log` |
| `AdminUserManagement` | `/admin/users` | User CRUD (admin only) |

---

## 6. Frontend — Components

### Layout
| Component | Purpose |
|---|---|
| `Layout.jsx` | Outer shell: sticky header, sidebar, main content, HIPAA auto-logoff |
| `Sidebar.jsx` | Nav with personalisation filtering (`hiddenNavPaths`), mobile shows labels when open |
| `PageHeader.jsx` | Full-width image banner, inspirational ticker, responsive `px-3 sm:px-6 md:px-8` |

### AI Widgets
| Component | Purpose |
|---|---|
| `AuraChat.jsx` | Patient/family LLM companion (teal theme), dark mode fixed |
| `AIAssistant.jsx` | Clinician copilot (sky-blue theme), dark mode fixed |
| `AuraOnboarding.jsx` | Guided app tour, skip confirmation, dark mode fixed |

### Clinical
| Component | Purpose |
|---|---|
| `RiskExplanationPanel.jsx` | XAI modal: SHAP bars, domain breakdown, feedback — book-style |
| `FocusedAIExplanation.jsx` | Per-alert clinical AI explanation — book-style |
| `RealTimeAlerts.jsx` | Header bell with live poll |
| `PatientDataTable.jsx` | TanStack Table with `virtualizedLists` feature flag |
| `MLRiskSummaryCard.jsx` | Compact risk card for patient detail |

### UI Primitives
| Component | Purpose |
|---|---|
| `ModernCard.jsx` | `ProStatCard` (compact: text-2xl, p-3.5), `ProStatCardGrid`, `StatCard` |
| `ModalShell.jsx` | Shared modal wrapper: gradient header, spring animation, focus trap |
| `BookSection` (inline) | Labelled section box used in medical KB and care guide detail views |
| `Switch.jsx` | Radix UI Switch (used throughout Settings) |

---

## 7. Frontend — Hooks

| Hook | Purpose |
|---|---|
| `usePersonalisation` | Fetches questionnaire prefs, applies language/theme/font/a11y on login |
| `usePushNotifications` | Web Push API subscribe/unsubscribe/sendTest |
| `useInstallPrompt` | PWA beforeinstallprompt capture → `pwa.canInstall` / `pwa.install()` |
| `useRestartTour` | Dispatches `aura:restart-tour` event to reset AuraOnboarding |
| `useVoiceControl` | Voice command recognition |
| `useTouchSupport` | Haptic + sound feedback |
| `useIdleTimer` | HIPAA 15-min auto-logoff |
| `useWebSocket` | Real-time connection for alerts/messages |

---

## 8. Frontend — Context Providers

| Context | Purpose |
|---|---|
| `PersonalisationContext` | `uiFlags`, `hiddenNavPaths`, `hiddenSections` — derived from questionnaire |
| `AppSettingsContext` | theme, language, notifications, chatbot/assistant settings, sidebar, featureFlags |
| `AccessibilityContext` | highContrast, fontSize, reducedMotion, assistedMode, presets |
| `AuthContext` | user, isAuthenticated, login/logout |
| `CareSettingContext` | careSetting, navAdditions, meta (hospital/hospice/home/etc.) |
| `WebSocketContext` | WS connection, message handler |

### PersonalisationContext — uiFlags Reference
```js
{
  showCommunity,      // false if wants_community === 'no'
  showLegacy,         // false if legacy_interest === 'no'
  showAI,             // false if ai_analysis_consent === 'no'
  showSpiritualItems, // false if spiritual_importance === 'not'
  showEolPlanning,    // false if eol_planning_readiness === 'no'
  simplifiedNav,      // true if tech_comfort === 'basic' or info_style === 'simple'
  isHighAcuity,       // from signals
  isBurntOut,         // caregiver_burnout_risk === 'burnout'/'struggling'
  isBereaved,         // grief_stage === 'bereaved'
  showSpiritualTab,   // for CarePlanDetail / MedicalKnowledge tabs
  showFamilyTab,      // for care plan family tab
}
```

### AppSettingsContext — featureSettings
```js
{
  confettiOnMilestone: true,   // MilestoneConfetti on goal completion
  pageProgressBar:     true,   // NProgressBar on route change
  smoothScrollReveal:  true,   // AOS animations (AppRoutes useEffect)
  inlineDatePicker:    true,   // rich date picker
  virtualizedLists:    true,   // PatientDataTable page size
  errorBoundaries:     true,   // SectionErrorBoundary active
}
```

---

## 9. Frontend — API Client

`frontend/src/api/client.js` — all API calls via Axios with `Bearer` token.

### Key API groups
| Export | Endpoints |
|---|---|
| `medicalKnowledgeAPI` | list, search, get, match, **create, update, delete** (new CRUD) |
| `mlAPI` | patient risk, all-patients risk, trigger scan |
| `advancedMlAPI` | SHAP, deterioration, drug interactions |
| `carePlanAPI` | get, generate, update, goals CRUD, interventions CRUD |
| `resourcesAPI` | getAll, getRecommended, bookmark, feedback |
| `communityAPI` | groups, join, posts, react, flag, moderate |
| `preferencesAPI` | getMine, save, getByUserId, updateByUserId |
| `adminAPI` | listUsers, createUser, updateUser, deactivate, resetPassword |
| `chatbotAPI` | legacy chatbot |
| `llmChatbotAPI` | Gemini/Groq streaming chat |

---

## 10. Backend — Routers / Endpoints

`backend/routers/` — 39 router files mounted in `main.py`.

### Key routes
| Router | Prefix | Notable endpoints |
|---|---|---|
| `auth.py` | `/api/auth` | login, register, me, change-password |
| `patients.py` | `/api/patients` | CRUD, status, vitals summary |
| `medical_knowledge.py` | `/api/medical` | conditions CRUD (POST/PUT/DELETE added) |
| `ml_predictions.py` | `/api/ml` | patient risk, all-patients, trigger scan |
| `comprehensive_ai.py` | `/api/comprehensive-ai` | SHAP explanation, feedback |
| `care_plans.py` | `/api/care-plans` | generate, goals, interventions |
| `notifications.py` | `/api/notifications` | CRUD, mark-read, push |
| `admin.py` | `/api/admin` | users CRUD, `/audit-log` (singular — not audit-logs) |
| `preferences.py` | `/api/preferences` | questionnaire data, personalisation |
| `messaging.py` | `/api/messages` | conversations, messages, `?userId=X` deep-link |
| `legacy.py` | `/api/legacy` | consent, heir, content, my-legacy-access |
| `bereavement.py` | `/api/bereavement` | grief entries, screening, support schedule |
| `resources.py` | `/api/resources` | list, bookmark, helpful, PDF download |
| `community.py` | `/api/community` | groups, posts, reactions |

---

## 11. Backend — Services

| Service | Purpose |
|---|---|
| `true_llm_engine.py` | Gemini/Groq/OpenRouter LLM calls (uses `os.getenv` — no hardcoded keys) |
| `ml_model_service.py` | XGBoost inference, SHAP TreeExplainer |
| `care_plan_engine.py` | AI care plan generation from assessment data |
| `notification_service.py` | Push + in-app notifications, Web Push VAPID |
| `personalisation.py` | Questionnaire signal derivation |
| `aura_ai_engine.py` | Rule-based clinical AI (offline-capable) |
| `llm_engine.py` | Multi-provider LLM wrapper |
| `medical_knowledge_base.py` | Condition template matching |
| `journey_tracker.py` | Care timeline events |
| `advanced_ml_service.py` | Drug interactions, deterioration, caregiver burnout |

---

## 12. ML System — 8 XGBoost Models + SHAP

8 parallel XGBoost classifiers trained on clinically-parameterised synthetic data:

| Task | Predicts |
|---|---|
| `pain_risk` | Uncontrolled pain likelihood |
| `symptom_burden` | Overall symptom severity |
| `psychological_risk` | Depression/anxiety escalation |
| `admission_risk` | Hospital admission within 7 days |
| `medication_adherence` | Missed medication probability |
| `caregiver_burden` | Caregiver burnout risk |
| `deterioration` | Clinical deterioration trajectory |
| `mortality_risk` | 30-day mortality probability |

**SHAP:** TreeExplainer provides feature-level impact scores shown in `RiskExplanationPanel`. Features include: pain score, SpO2, activity level, medication count, days since assessment, social support score, etc.

**Models location:** `backend/ml_training/models/`

---

## 13. Database Models

Key SQLAlchemy models in `backend/src/db.py`:

- `User` — auth, role, care_setting, professional verification
- `Patient` — demographics, diagnosis, risk level, linked user
- `ConditionCareTemplate` — medical knowledge base conditions (**now supports CRUD**)
- `CarePlan` — goals, interventions, AI-generated sections
- `Goal` — status, priority, category, checklist
- `Intervention` — clinical interventions with frequency
- `Assessment` / `ESAS` / `PPS` / `PHQ9` — clinical assessments
- `Alert` — severity, type, acknowledged, patient link
- `Message` / `Conversation` — messaging system
- `Notification` — in-app + push notifications
- `UserPreferences` — questionnaire answers (full personalisation data)
- `CommunityGroup` / `CommunityPost` / `CommunityReaction` — community system
- `LegacyConsent` / `HeirDesignation` / `LegacyContent` — digital legacy
- `BereavedFamilyEntry` — grief journal, screening, support
- `AuditLog` — HIPAA audit trail
- `PushSubscription` — Web Push VAPID subscriptions

---

## 14. Personalisation Engine

### How It Works

**1. Questionnaire (`/setup` — PersonalisationQuest.jsx)**
- Patient: 10 steps covering language, diagnosis, ESAS symptoms, emotional wellbeing, physical function, nutrition, spiritual/cultural care, family/social, content preferences (theme, notification preference NEW), AI consent
- Family: 8 steps covering relationship, caregiving role, emotional wellbeing, faith/culture, legacy, consent
- On completion: `onSuccess` immediately applies 12 settings to localStorage (theme, language, font, sidebar mode, a11y, notifications, AI consent)

**2. `usePersonalisation` hook**
- Fetches preferences from `/api/preferences/:userId`
- Applies: language, theme, font size, notification preference, activity level → reduced motion, AI consent → widgets
- All guarded: "only override if not manually changed"

**3. `PersonalisationContext`**
- Wraps entire app (inside `PersonalisationProvider`)
- Derives `uiFlags` and `hiddenNavPaths` sets from prefs
- Components read `usePersonalisationFlags()` to conditionally render

**4. `AppRoutes` global applier**
- Runs once per session via `sessionStorage` guard
- Fetches preferences from backend on login
- Re-applies all settings for returning users

### Questionnaire → System Mapping

| Answer | Immediate Effect | Persistent Effect |
|---|---|---|
| `language_pref: twi` | `document.lang = 'twi'` | `app_language` in localStorage |
| `tech_comfort: basic` | Font xlarge, large touch, sidebar icons | Accessibility settings |
| `theme_pref: dark` | CSS `dark` class on `<html>` | `app_theme` in localStorage |
| `notification_pref: none` | n/a | `app_notifications: false` |
| `activity_level: bedbound` | `reducedMotion + largeTouch` | Accessibility settings |
| `ai_analysis_consent: no` | AI widgets hidden | `show_ai_widgets: false` |
| `wants_community: no` | Sidebar: Community removed | Community section hidden |
| `legacy_interest: no` | Sidebar: Legacy paths removed | Legacy cards hidden |
| `spiritual_importance: not` | Spiritual tabs removed | Section hidden in care plans |

---

## 15. Accessibility System

Managed by `AccessibilityContext`. All settings saved to `localStorage('accessibility_settings')`.

### Settings
| Setting | Effect |
|---|---|
| `highContrast` | Adds `high-contrast` CSS class to `<html>` |
| `colorBlindMode` | Adds `cb-protanopia` / `cb-deuteranopia` / `cb-tritanopia` / `cb-monochrome` |
| `fontSize` | Adds `text-small/medium/large/xlarge/xxlarge` class to `<html>` |
| `reducedMotion` | Adds `reduced-motion` class — CSS reduces all animations |
| `screenReaderMode` | Adds `screen-reader-mode` class — enhanced ARIA descriptions |
| `voiceControl` | Enables `useVoiceControl` hook |
| `largeTouch` | Adds `large-touch` class — bigger tap targets |
| `simplifiedUI` | Adds `simplified-ui` class — cleaner layout |
| `assistedMode` | Combines multiple settings for cognitive impairment |
| `focusMode` | Dims everything except focused element |
| `readingGuide` | Horizontal line follows cursor |
| `textSpacing` | `spacing-normal/relaxed/wide` class |
| `dyslexiaFont` | Adds `dyslexia-font` class — rounded spaced font |

### Condition Presets
- Dementia: xxlarge font, voice, reduced motion, large touch
- Parkinson's: xlarge font, voice, reduced motion, large touch
- Low Vision: xxlarge font, high contrast, screen reader
- Stroke/Hemiplegia: xlarge font, large touch, reduced motion
- Severe Fatigue: large font, large touch, reduced motion
- Anxiety/PTSD: reduced motion only

---

## 16. Settings & Feature Flags

### Settings Tabs
1. **Profile** — account details (read-only), Edit Profile → `/profile`, Export Settings (JSON), Clear All Data (19 localStorage keys), App Info, **Install App (PWA)**, **Restart Tour**
2. **Avatar** — avatar builder modal, role presets, reset to default
3. **Appearance** — theme (light/dark/auto), language (with toast), sidebar mode
4. **Accessibility** — high contrast, colour blind, font size, motion, assistive tech, condition presets
5. **AI & Features** — AI widgets toggle, Aura Chat, AI Assistant settings, notifications, push notifications, optional feature flags

### Feature Flags (all wired)
| Flag | Where consumed |
|---|---|
| `pageProgressBar` | `NProgressBar.jsx` — stops/starts NProgress |
| `errorBoundaries` | `SectionErrorBoundary.jsx` — wraps/unwraps ErrorBoundary |
| `smoothScrollReveal` | `AppRoutes useEffect` — AOS.init(disable: true/false) |
| `virtualizedLists` | `PatientDataTable.jsx` — sets pageSize to full count when off |
| `confettiOnMilestone` | `MilestoneConfetti` — fires on assessment/goal completion |
| `inlineDatePicker` | Date fields in forms |

---

## 17. Dark Mode System

**How it works:**
1. `AppSettingsContext` stores theme in `localStorage('app_theme')`
2. On change: removes `light-theme`/`dark-theme`/`dark` classes from `<html>`, adds new ones
3. `dark` class on `<html>` activates all Tailwind `dark:` utilities
4. `auto` mode: checks `window.matchMedia('(prefers-color-scheme: dark)')`

**CSS Variable overrides** in `index.css` for `html.dark`:
- `--color-text-primary: #f8fafc`
- `--color-card-bg: #1e293b`
- `--color-border-light: #334155`

**AuraChat/AIAssistant** — hardcoded `background: '#ffffff'` replaced with `bg-white dark:bg-slate-800`

**Sonner toasts** — `theme="system"` on `<SonnerToaster>` + colour overrides in `sonner-overrides.css`

---

## 18. Mobile Responsiveness

### Layout
- Mobile sidebar: drawer (fixed, z-40, w-72) with dark backdrop overlay
- When drawer opens: `showLabels = true` — nav labels always visible on mobile
- Main content: `flex-1 min-w-0 overflow-x-hidden`
- Global: `html, body { overflow-x: hidden; max-width: 100vw }`

### Responsive Patterns Used
- `px-3 sm:px-6 md:px-8` — page container padding
- `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` — card grids
- `w-7 h-7 sm:w-9 sm:h-9` — ESAS score buttons
- `text-xl md:text-2xl` — page titles
- `hidden sm:inline` — tab labels (icon-only on mobile)

### `.page-section` CSS utility
```css
.page-section {
  max-width: 1400px;
  margin: 0 auto;
  padding: 12px → 32px (responsive breakpoints)
}
```

---

## 19. AI Systems

### AuraChat (Patient/Family Companion)
- Teal theme, bottom-right floating widget
- LLM: Gemini / Groq / OpenRouter (via `true_llm_engine.py`)
- Offline fallback: rule-based `aura_ai_engine.py`
- Features: crisis detection, consent modal, history, feel-scale mood picker
- Hidden if `ai_analysis_consent: no`

### AIAssistant (Clinical Copilot)
- Sky-blue theme, bottom-right floating widget (clinician/admin/caregiver only)
- Context-aware: reads current page, patient ID, system insights
- Analysis chips: page-specific suggested questions
- Streaming via Server-Sent Events
- Hidden if `ai_analysis_consent: no`

### RiskExplanationPanel (XAI Modal)
- 4 tabs: SHAP Drivers, Components, Concerns, Feedback
- Book-style: ledger header, §-numbered tabs, contained section boxes
- Clinician feedback (agree/partial/disagree) → backend learning loop

### FocusedAIExplanation (Per-Alert)
- Book-style: bordered sections per clinical domain
- Shows trend indicator, SHAP-like contributing factors, drug interactions
- Clinician feedback: helpful/partial/not helpful

---

## 20. Care Setting System

5 care delivery modes:
- `hospital_based` — full clinical team, 24h monitoring
- `hospice` — comfort-focused, family visits
- `home_based` — caregiver-led, telemedicine
- `outpatient_clinic` — scheduled visits
- `long_term_residential` — nursing home

Each mode adds context-specific nav items via `CareSettingContext.navAdditions`.
Care setting visible in sidebar (when expanded) as a coloured badge.

---

## 21. Digital Legacy System

**Flow:**
1. Patient creates legacy consent at `/legacy-setup`
2. Designates heirs with access levels (full / memories_only / messages_only)
3. Creates content: final messages, photos, journal entries
4. After death: heir activates access at `/my-legacy-access`
5. Content delivered per consent permissions

**Components:** `LegacySetup`, `HeirManagement`, `LegacyContentCreator`, `MyLegacyAccess`
**Backend:** `legacy.py` router, `LegacyConsent`, `HeirDesignation`, `LegacyContent` models

---

## 22. Bereavement Support System

For family members after patient death:
- Grief journal (separate from legacy journal)
- PG-13 prolonged grief screening
- Support group directory (Ghana-specific)
- Counselor contacts
- Grief Journey tracking
- BereavedFamilyDashboard tabs personalisation-filtered (no grief tab if not bereaved)

---

## 23. Toast Notification System

**Library:** Sonner (`sonner` package)
**Configuration** (`App.jsx`):
```jsx
<SonnerToaster
  position="top-right"
  richColors
  expand={false}
  visibleToasts={3}
  gap={6}
  offset="80px"          // below 60px header
  theme="system"
  toastOptions={{ duration: 6000 }}
/>
```

**CSS overrides** (`sonner-overrides.css`):
- Position: right-aligned, 80px from top
- Width: 280px max
- No vertical left bar (`::before { display: none }`)
- Dark mode: `bg-slate-800` with white/light text
- Type colours: success/error/warning/info all customised

**Toast utility** (`utils/toast.jsx`):
```js
toast.success(msg)     // 3500ms
toast.error(msg)       // 6000ms
toast.info(msg)        // 4000ms
toast.warning(msg)     // 5000ms
toast.promise(promise, { loading, success, error })
toast.dismiss(id)
```

---

## 24. Authentication & Security

- **JWT** tokens with 8h expiry (configurable via `ACCESS_TOKEN_EXPIRE_HOURS`)
- **RBAC** via `require_role()` dependency on all protected routes
- **HIPAA auto-logoff** at 15 minutes inactivity (`useIdleTimer`)
- **Password hashing** via bcrypt
- **Failed login tracking** with lockout after 5 attempts (30-minute lockout)
- **Rate limiting** on `/api/auth/login` — 10 requests/minute via `slowapi`

### 24.1 Audit Logging — Full Implementation

All significant actions now write to the `AuditLog` table with **IP address and User-Agent captured**.

**Centralised service:** `backend/services/audit_service.py`
```python
from services.audit_service import log_action
log_action(db, user=current_user, action="CREATE_VITAL",
           resource_type="vital", patient_id=..., request=request,
           details={...})
```

**Coverage after July 2026 implementation:**

| Router | Actions Audited |
|---|---|
| `auth.py` | `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `USER_REGISTERED`, `PASSWORD_RESET`, `PASSWORD_CHANGED`, `CONSENT_GIVEN` |
| `patients.py` | `CREATE_PATIENT`, `UPDATE_PATIENT` |
| `vitals.py` | `CREATE_VITAL`, `VIEW_VITALS` |
| `medications.py` | `CREATE_MEDICATION`, `UPDATE_MEDICATION`, `DISCONTINUE_MEDICATION` |
| `appointments.py` | `CREATE_APPOINTMENT`, `UPDATE_APPOINTMENT` |
| `clinical_assessments.py` | `CREATE_ESAS_ASSESSMENT` |
| `admin.py` | `admin_create_user`, `admin_update_user`, `admin_activate/deactivate_user` |
| `bereavement.py` | Journal entry create/delete |
| `caregivers.py` | Caregiver assignment create/remove |

**All entries now include:** `ip_address`, `user_agent`, `user_id`, `user_role`, `action`, `resource_type`, `resource_id`, `patient_id`, `details` (JSON), `success`, `created_at`

### 24.2 HIPAA Compliance Dashboard

`GET /api/compliance/status` — now **dynamically computed** from live DB state:
- Queries `AuditLog` count and IP coverage percentage in real time
- Queries `BreachIncident` table for open/resolved counts
- Queries `User` table for total/active user counts
- Returns 18-item checklist with statuses computed from actual system state
- `compliance_score` reflects real implementation level (~72% for this prototype)
- `live_metrics` block shows: `audit_log_entries`, `audit_ip_coverage_pct`, `open_breach_incidents`

### 24.3 HIPAA Data Export

`GET /api/portal/my-data/export` (patients/family only):
- Returns complete JSON of all PHI: vitals, symptoms, medications, appointments, clinical notes, all assessments, AI predictions, bereavement entries
- `Content-Disposition: attachment` header triggers browser download
- Covers HIPAA Right of Access (45 CFR §164.524)

### 24.4 Breach Incident Tracking

`GET/POST/PUT /api/breach-incidents` (admin only):
- Full CRUD on `BreachIncident` table
- Auto-calculates HHS 60-day notification deadline from `discovered_at`
- Tracks: `breach_type`, `affected_count`, `severity`, `resolution_notes`, `reported_to_authorities`
- **GitHub secret scanning** blocks push if API keys detected in commits (use `.env` only)

---

## 25. Environment & Configuration

`backend/.env` (pre-configured for SQLite, no external DB required):
```
GEMINI_API_KEY=       # optional — free from aistudio.google.com
GROQ_API_KEY=         # optional — free from groq.com
OPENROUTER_API_KEY=   # optional
SECRET_KEY=           # JWT secret
DATABASE_URL=sqlite:///./aura.db
```

Chatbot works fully offline with rule-based engine. LLM keys unlock Gemini/Groq chat.

---

## 26. File Tree (Key Files)

```
ProjectAura_React/
├── backend/
│   ├── main.py                    # FastAPI entry point
│   ├── aura.db                    # SQLite database
│   ├── .env                       # API keys + config
│   ├── routers/                   # 39 API router files
│   │   ├── medical_knowledge.py   # CRUD for conditions (NEW)
│   │   ├── admin.py               # audit-log (singular) endpoint
│   │   └── preferences.py        # questionnaire data
│   ├── services/
│   │   ├── true_llm_engine.py    # Gemini/Groq/OpenRouter
│   │   ├── ml_model_service.py   # XGBoost + SHAP
│   │   ├── personalisation.py    # signal derivation
│   │   └── notification_service.py
│   └── ml_training/models/       # 8 XGBoost .joblib files
│
├── frontend/src/
│   ├── App.jsx                   # Routes + PersonalisationProvider + global applier
│   ├── context/
│   │   ├── PersonalisationContext.jsx  # NEW — uiFlags, hiddenNavPaths
│   │   ├── AppSettingsContext.jsx      # featureSettings, theme, sidebar
│   │   └── AccessibilityContext.jsx    # a11y settings + presets
│   ├── hooks/
│   │   ├── usePersonalisation.js       # applies prefs on login
│   │   ├── useInstallPrompt.js         # PWA install
│   │   └── usePushNotifications.js    # Web Push
│   ├── pages/
│   │   ├── MedicalKnowledge.jsx       # Two-column library + CRUD
│   │   ├── CareGuide.jsx              # Two-column library
│   │   ├── PersonalisationQuest.jsx   # 10/8 step questionnaire
│   │   └── Settings.jsx               # All buttons wired
│   ├── components/
│   │   ├── layout/Sidebar.jsx          # showLabels mobile fix
│   │   ├── PageHeader.jsx              # responsive px-3 sm:px-6
│   │   ├── AuraChat.jsx               # dark mode fixed
│   │   ├── AIAssistant.jsx            # dark mode fixed
│   │   └── AuraOnboarding.jsx         # dark mode fixed
│   └── styles/
│       ├── sonner-overrides.css       # toast positioning + styling
│       └── index.css                  # .page-section utility, overflow-x fix
│
└── HOW_TO_RUN.md                  # Quick start (run START_HERE.bat)
```

---

## 27. System Interaction Flows

### 27.1 Questionnaire → System Customisation Flow
```
User completes PersonalisationQuest
  → onSuccess applies 12 settings immediately:
      language, theme, font, sidebar, a11y, notifications, AI consent
  → Backend saves UserPreferences
  → On next login: AppRoutes fetches prefs, re-applies (sessionStorage guard)
  → PersonalisationContext derives uiFlags from prefs
  → Sidebar filters hiddenNavPaths
  → PatientPortal filters quickActions
  → CommunityHub filters tabs
  → MedicalKnowledge TABS dynamic (spiritual hidden if opted out)
  → AI widgets hidden if ai_analysis_consent === 'no'
```

### 27.2 ML Risk → Alert → Clinician Flow
```
Patient submits ESAS / Vitals
  → backend calculates risk via ml_model_service.py
  → If threshold exceeded → Alert created
  → WebSocket broadcasts alert to connected clinicians
  → NotificationCenter badge increments (Zustand)
  → Clinician opens Alerts page → clicks Explain
  → FocusedAIExplanation modal opens (book-style layout)
  → SHAP feature bars + recommendations shown
  → Clinician submits feedback → learning loop
```

### 27.3 Settings → App Behaviour Flow
```
User toggles setting in Settings page
  → AppSettingsContext.updateFeature(key, value)
  → localStorage saved
  → React state updates (no page reload)
  → Components reading featureSettings re-render:
      smoothScrollReveal → AppRoutes AOS.init(disable: true/false)
      virtualizedLists   → PatientDataTable pageSize changes
      pageProgressBar    → NProgressBar starts/stops on route change
      errorBoundaries    → SectionErrorBoundary wraps/unwraps
```

---

## 28. Test Results & Evaluation Status

### ML Model Accuracy
| Model | AUC-ROC | Precision | Recall |
|---|---|---|---|
| pain_risk | ~0.87 | ~0.82 | ~0.79 |
| symptom_burden | ~0.84 | ~0.79 | ~0.76 |
| psychological_risk | ~0.86 | ~0.81 | ~0.78 |
| admission_risk | ~0.89 | ~0.85 | ~0.82 |
| medication_adherence | ~0.83 | ~0.78 | ~0.74 |
| caregiver_burden | ~0.85 | ~0.80 | ~0.77 |
| deterioration | ~0.88 | ~0.84 | ~0.81 |
| mortality_risk | ~0.91 | ~0.87 | ~0.84 |

*Trained on clinically-parameterised synthetic data. Real-world validation with patient data required before clinical deployment.*

### Known Limitations
- Training data is synthetic — real-world accuracy will differ
- Personalisation questionnaire `ai_analysis_consent: no` silences AI features
- GitHub secret scanning blocks push if old API keys exist in commit history — use `.env`
- Image assets (African photos, slideshow) are excluded from git (`.gitignore`) — must be present locally

---

## 29. Objectives Fulfilment Mapping

| Objective | Status | Implementation |
|---|---|---|
| AI risk prediction with explainability | ✅ Complete | 8 XGBoost + SHAP + RiskExplanationPanel |
| Personalised care plans | ✅ Complete | CarePlanDetail + AI generation |
| Patient-facing portal | ✅ Complete | PatientPortal, WellnessCheckin, MyJourney |
| Family support module | ✅ Complete | ContinuityBridge, BereavedFamilyDashboard |
| Digital legacy system | ✅ Complete | LegacySetup, HeirManagement, MyLegacyAccess |
| Community peer support | ✅ Complete | CommunityHub, CommunityGroupPage |
| Ghana context adaptation | ✅ Complete | Ghana emergency contacts, Twi/Ga/Ewe language support |
| Questionnaire personalisation | ✅ Complete | PersonalisationContext, uiFlags, 12 immediate settings applied |
| Accessibility | ✅ Complete | 14 a11y settings, 6 condition presets, voice control |
| Dark mode | ✅ Complete | All major components fixed July 2026 |
| Mobile responsiveness | ✅ Complete | Sidebar labels, ESAS buttons, responsive padding, overflow fix |
| Offline support | ✅ Complete | Service worker, offlineClient.js, SQLite local cache |
| Medical knowledge base | ✅ Complete | 2-column library, book-style modals, clinician CRUD |
| Clinical care guide | ✅ Complete | 2-column library, chapter sections |
| Settings functionality | ✅ Complete | All 20+ settings buttons wired, feature flags consumed |

---

## 30. Why ProjectAura Is a Framework

ProjectAura is designed as a **palliative care platform framework**, not a single-purpose app:

1. **Role-adaptive UI** — same codebase serves 5 completely different user types with different navigation, features, and content
2. **Personalisation-driven hiding** — the questionnaire doesn't just save preferences, it actively reshapes the interface
3. **Pluggable AI** — rule-based offline + LLM online + XGBoost clinical models can be swapped independently
4. **Care-setting aware** — hospital, hospice, home, clinic, and residential modes each surface different workflows
5. **Culturally-parameterised** — language choices, spiritual care, cultural practices, Ghana-specific resources all affect what's shown
6. **Feature-flagged** — all optional enhancements toggleable without code changes
7. **Extensible medical KB** — clinicians add conditions; AI engine, community, resources all benefit automatically

---

*Documentation generated: July 28, 2026 | ProjectAura v3.0*
