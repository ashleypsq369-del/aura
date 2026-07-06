# 🎯 ProjectAura Gap Analysis - Implementation Plan

## 📊 Executive Summary

This document tracks the implementation of critical gaps identified in the comprehensive gap analysis report comparing the UMaT Final Year Report claims against actual ProjectAura implementation.

**Report Date**: Based on Gap Analysis dated June 2026  
**Supervisor**: Dr. Alfred Adutwum Amponsah  
**Institution**: University of Mines and Technology (UMaT), Tarkwa

---

## 🚨 Critical Issues Identified

### Priority Breakdown:
- **🔴 CRITICAL**: 4 gaps (XAI/SHAP, Wrong ML Model, Federated Learning, HIPAA Breach)
- **🟠 HIGH**: 5 gaps (HIPAA Compliance, HCI Testing, Biomedical Ethics, Privacy)
- **🟡 MEDIUM**: 5 gaps (Bereavement, ChatBot Safety, Personalization)
- **🟢 OK**: 1 area (Ghana-specific contextualization)

---

## 📋 Implementation Priorities

### PRIORITY 1: XAI / SHAP (CRITICAL - Core Research Claim)

**Status**: ✅ **COMPLETE** (June 6, 2026)

**Key Issues**:
1. ✅ ~~Wrong ML model~~ **USER CORRECTION**: Keep XGBoost, integrate SHAP properly
2. ✅ SHAP now visualized - Bar chart + Waterfall components created
3. ✅ Plain-language explanation UI complete
4. ✅ Prediction audit trail endpoint created
5. ✅ Patient-facing explanation component built
6. ✅ Clinician trust mechanism implemented (feedback system)

**Implementation Steps**:
- [x] ~~Replace XGBoost with sklearn RandomForestClassifier~~ **Keep XGBoost per user request**
- [x] Integrate shap.TreeExplainer for per-patient SHAP values
- [x] Create SHAPBarChart.jsx component
- [x] Create SHAPWaterfallChart.jsx component
- [x] Create ExplainabilityPanel.jsx
- [x] Create PatientRiskSummary.jsx for patient portal
- [x] Add GET /api/predictions/{patient_id}/history endpoint
- [x] Add clinician feedback mechanism
- [x] Update AI router to return SHAP values

**Files Created/Modified**:
- ✅ `backend/routers/ai.py` - Real SHAP integration with XGBoost
- ✅ `backend/src/db.py` - Added PredictionFeedback and PatientConsent tables
- ✅ `frontend/src/components/SHAPBarChart.jsx` - Feature importance visualization
- ✅ `frontend/src/components/SHAPWaterfallChart.jsx` - Contribution flow visualization
- ✅ `frontend/src/components/ExplainabilityPanel.jsx` - Main XAI interface
- ✅ `frontend/src/components/PatientRiskSummary.jsx` - Patient-friendly version
- ✅ `SHAP_INTEGRATION_COMPLETE.md` - Full implementation documentation

**See**: `SHAP_INTEGRATION_COMPLETE.md` for complete implementation details

---

### PRIORITY 2: HIPAA Compliance (HIGH)

**Status**: 🟠 Partial Implementation Exists

**Key Issues**:
1. ⚠️ No auto-logoff (15-min inactivity required)
2. ❌ No patient data export (Right of Access)
3. ❌ No breach notification workflow
4. ❌ No workforce training records
5. ⚠️ No encryption at rest
6. ⚠️ No field-level access control

**Implementation Steps**:
- [ ] Add 15-minute inactivity auto-logoff
- [ ] Create GET /api/portal/my-data/export endpoint
- [ ] Create BreachIncidentLog model and UI
- [ ] Create HIPAAComplianceDashboard.jsx
- [ ] Implement field masking for sensitive data
- [ ] Add encryption_at_rest configuration
- [ ] Create compliance checklist (18 specifications)

---

### PRIORITY 3: HCI & ChatBot Safety (HIGH)

**Status**: 🟡 Basic Implementation, Needs Enhancement

**Key Issues**:
1. ❌ No chatbot consent screen
2. ❌ No crisis escalation UI
3. ❌ No usability testing framework
4. ⚠️ Generic error messages
5. ❌ No onboarding tour
6. ⚠️ Tech comfort preference not used

**Implementation Steps**:
- [ ] Create ChatbotConsentModal.jsx
- [ ] Create CrisisInterventionOverlay.jsx
- [ ] Add UsabilityFeedback widget
- [ ] Implement adaptive UI based on tech_comfort
- [ ] Create user-friendly error messages dictionary
- [ ] Add first-login onboarding tour
- [ ] Integrate axe-core for accessibility auditing

---

### PRIORITY 4: Biomedical Ethics (HIGH)

**Status**: ⚠️ No UI Evidence

**Key Issues**:
1. ❌ Beneficence - No tracking of AI benefit
2. ⚠️ Non-maleficence - Crisis response unclear
3. ❌ Autonomy - Patients can't see AI predictions
4. ❌ Justice - No bias audit

**Implementation Steps**:
- [ ] Add AI Data Use Consent to onboarding
- [ ] Create patient-facing risk summary
- [ ] Add opt-out of AI analysis option
- [ ] Add predictions.clinical_action_taken tracking
- [ ] Create ModelBiasReport.jsx
- [ ] Add clinical override mechanism
- [ ] Create patient_consents table

---

### PRIORITY 5: Bereavement & Continuity Bridge (MEDIUM)

**Status**: 🟡 Partial - Needs Enhancement

**Key Issues**:
1. ⚠️ Grief stage tracking exists but not displayed
2. ⚠️ No dedicated bereavement peer support
3. ⚠️ Resources not surfaced at right moment
4. ❌ No post-death support schedule
5. ❌ No complicated grief screening

**Implementation Steps**:
- [ ] Create BereavedFamilyDashboard.jsx
- [ ] Add GriefProgressTracker.jsx component
- [ ] Create dedicated bereavement community group
- [ ] Implement automated post-death support schedule
- [ ] Add grief screening questionnaire (PHQ-2 / PG-13)
- [ ] Add legacy content delivery confirmation

---

### PRIORITY 6: Privacy-Preserving Architecture (CRITICAL)

**Status**: 🔴 Major Gaps

**Key Issues**:
1. ❌ No encryption at rest
2. ❌ No federated learning (cited as design basis)
3. ⚠️ No sensitive field masking
4. ⚠️ Consent tracking incomplete
5. ⚠️ No data minimization enforcement

**Implementation Steps**:
- [ ] Enable pgcrypto and encrypt PHI fields
- [ ] Add field serializer for data masking
- [ ] Create patient_consents table
- [ ] Add 'My Privacy Settings' to patient portal
- [ ] Document federated learning architecture (future work)
- [ ] Implement data_completeness_profile

---

### PRIORITY 7: ChatBot Safety Enhancements (MEDIUM)

**Status**: 🟡 Basic Crisis Detection, Needs Safety Features

**Key Issues**:
1. ❌ No pre-session consent
2. ⚠️ No anthropomorphism prevention
3. ⚠️ Crisis escalation protocol not defined in UI
4. ❌ No session handoff to clinician
5. ⚠️ System prompt boundaries unclear

**Implementation Steps**:
- [ ] Create ChatbotConsentModal.jsx
- [ ] Add periodic AI reminders in chat
- [ ] Add 'Talk to a Human' button
- [ ] Define crisis escalation pipeline
- [ ] Create ChatbotSessionReview.jsx
- [ ] Update system prompt with boundaries

---

## 📊 Components to Build

### Frontend Components (Priority Order):

#### CRITICAL (Build First):
1. ✅ **SHAPBarChart.jsx** - SHAP feature importance bar chart (DONE)
2. ✅ **SHAPWaterfallChart.jsx** - SHAP waterfall visualization (DONE)
3. ✅ **ExplainabilityPanel.jsx** - Combined risk + SHAP + feedback (DONE)
4. ✅ **PatientRiskSummary.jsx** - Simplified for patient portal (DONE)
5. ⏳ **ChatbotConsentModal.jsx** - Pre-session consent
6. ⏳ **CrisisInterventionOverlay.jsx** - Crisis response UI

#### HIGH (Build Next):
7. ⚠️ HIPAAComplianceDashboard.jsx
8. ⚠️ BreachIncidentLog.jsx
9. ⚠️ ChatbotSessionReview.jsx
10. ⚠️ ModelBiasReport.jsx

#### MEDIUM:
11. ⚠️ BereavedFamilyDashboard.jsx
12. ⚠️ GriefProgressTracker.jsx
13. ⚠️ UsabilityFeedback.jsx

---

## 🔧 Backend Endpoints to Build

### CRITICAL:
- [x] **GET /api/predictions/{patient_id}/history** (DONE)
- [x] **POST /api/predictions/{id}/clinician-feedback** (DONE)
- [x] **GET /api/patients/{patient_id}/ai-consent** (DONE)
- [x] **POST /api/patients/{patient_id}/ai-consent** (DONE)
- [x] **Update POST /api/ai/predict to return SHAP values** (DONE)

### HIGH:
- [ ] POST /api/chatbot/sessions/{id}/crisis-escalate
- [ ] GET /api/admin/hipaa-compliance
- [ ] POST /api/breach-incidents
- [ ] POST /api/patients/{id}/ai-consent

### MEDIUM:
- [ ] GET /api/admin/model-bias-report
- [ ] GET /api/bereavement/grief-screening/{user_id}
- [ ] POST /api/bereavement/grief-screening
- [ ] GET /api/chatbot/sessions/flagged

---

## 💾 Database Additions Required

### New Tables:
```sql
-- PRIORITY 1
CREATE TABLE patient_consents (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    consent_type VARCHAR(50), -- data_processing, ai_analysis, research_use, community
    consent_given BOOLEAN,
    consented_at TIMESTAMP,
    revoked_at TIMESTAMP
);

CREATE TABLE breach_incidents (
    id SERIAL PRIMARY KEY,
    breach_type VARCHAR(100),
    discovered_at TIMESTAMP,
    affected_patient_ids TEXT,
    reported_at TIMESTAMP,
    notification_sent BOOLEAN
);

CREATE TABLE usability_feedback (
    id SERIAL PRIMARY KEY,
    page_name VARCHAR(100),
    rating INTEGER,
    user_role VARCHAR(50),
    user_id INTEGER,
    created_at TIMESTAMP
);

CREATE TABLE prediction_feedback (
    id SERIAL PRIMARY KEY,
    prediction_id INTEGER,
    clinician_id INTEGER,
    feedback_type VARCHAR(20), -- agree, partial, disagree
    note TEXT,
    created_at TIMESTAMP
);

CREATE TABLE bereavement_screening (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    patient_id INTEGER,
    responses JSONB,
    score INTEGER,
    flagged BOOLEAN,
    completed_at TIMESTAMP
);

CREATE TABLE post_death_schedule (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER,
    family_user_id INTEGER,
    scheduled_at TIMESTAMP,
    type VARCHAR(50),
    sent BOOLEAN,
    sent_at TIMESTAMP
);
```

### Column Additions:
```sql
-- Add to predictions table
ALTER TABLE predictions ADD COLUMN clinician_feedback VARCHAR(20);
ALTER TABLE predictions ADD COLUMN clinical_action_taken BOOLEAN;

-- Add to patient_preferences table
ALTER TABLE patient_preferences ADD COLUMN ai_analysis_consent BOOLEAN DEFAULT TRUE;

-- Add to chatbot_sessions table
ALTER TABLE chatbot_sessions ADD COLUMN consent_given BOOLEAN;

-- Add to user_profiles table (if exists)
ALTER TABLE user_profiles ADD COLUMN chatbot_consent_given BOOLEAN;
```

---

## 🎯 Success Criteria

### Phase 1 (CRITICAL - Week 1-2): ✅ **COMPLETE** (June 6, 2026)
- [x] ~~Random Forest model replacing XGBoost~~ **USER CORRECTION: Keep XGBoost**
- [x] SHAP values computed and returned (Real SHAP library)
- [x] SHAP visualization components created (Bar + Waterfall)
- [x] ExplainabilityPanel integrated
- [x] Clinician feedback mechanism working
- [x] Patient-facing risk summary visible
- [x] Database tables created (PredictionFeedback, PatientConsent)
- [x] API endpoints for history and feedback

**STATUS**: 🎉 **100% COMPLETE**

### Phase 2 (HIGH - Week 3-4):
- [ ] 15-min auto-logoff implemented
- [ ] Patient data export working
- [ ] Breach incident logging functional
- [ ] HIPAA compliance dashboard live
- [ ] ChatBot consent modal working
- [ ] Crisis escalation UI complete

### Phase 3 (MEDIUM - Week 5-6):
- [ ] Bereavement dashboard accessible
- [ ] Post-death support schedule automated
- [ ] Grief screening implemented
- [ ] Model bias report generated
- [ ] Usability feedback collection active

---

## 📚 Research Alignment

### Key Citations Being Addressed:

1. **Abbas et al. (2025)**: SHAP integration into clinician dashboards ✅
2. **Alamri et al. (2025)**: Privacy-preserving architecture (encryption, federated learning) ⚠️
3. **Antoniadi et al. (2021)**: Visual explanation interfaces in clinical workflow ✅
4. **Coghlan et al. (2023)**: ChatBot crisis detection and escalation ⚠️
5. **Finucane et al. (2024)**: Bereavement support evidence-based components ⚠️
6. **Hildt (2025)**: Explainability as moral imperative ✅
7. **Kocaballi et al. (2019)**: ChatBot consent and safety frameworks ⚠️
8. **Maguraushe & Ndlovu (2024)**: Privacy frameworks and user testing ❌
9. **Parsons et al. (2025)**: Auditability requirements ⚠️
10. **Templin et al. (2024)**: Six deployment failure modes ⚠️
11. **Tilala et al. (2024)**: Four biomedical ethics principles ❌

---

## 📈 Progress Tracking

**Last Updated**: June 6, 2026  
**Overall Completion**: 35% (Priority 1 COMPLETE)  
**Target Completion**: 85% (Academic prototype standard)  
**Critical Gaps Remaining**: 3 (Priority 1 ✅ Done)  
**High Priority Remaining**: 12  
**Medium Priority Remaining**: 10

### Completed Priorities:
- ✅ **PRIORITY 1: XAI/SHAP Integration** (June 6, 2026)
  - Real SHAP library with XGBoost
  - Bar chart + Waterfall visualizations
  - Clinician feedback system
  - Patient-friendly explanations
  - Prediction audit trail
  - Database tables for tracking

### In Progress:
- 🔄 None (awaiting next session)

### Upcoming:
- ⏳ PRIORITY 2: HIPAA Compliance
- ⏳ PRIORITY 3: HCI & ChatBot Safety  
- ⏳ PRIORITY 4: Biomedical Ethics
- ⏳ PRIORITY 5: Bereavement Support

---

## 🎓 Academic Requirements Met

- ✅ Ghana-specific contextualization (NHIA, COMPASS)
- ⚠️ XAI/SHAP (partially - not visualized)
- ❌ HIPAA compliance (partial implementation)
- ❌ HCI/Usability testing (not done)
- ❌ Biomedical ethics (no UI evidence)
- ⚠️ Bereavement support (partial)
- ❌ Federated learning (not implemented)
- ⚠️ ChatBot safety (basic only)

---

## 🚀 Next Immediate Actions

1. Start with PRIORITY 1 - Replace XGBoost with Random Forest
2. Implement SHAP TreeExplainer integration
3. Build SHAP visualization components
4. Create ExplainabilityPanel
5. Test end-to-end XAI workflow

**Ready to begin implementation!**
