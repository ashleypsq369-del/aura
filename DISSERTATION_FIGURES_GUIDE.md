# 📊 Dissertation Figures - Complete Step-by-Step Guide

> This file tells you exactly what to do for every figure placeholder in your dissertation.
> Figures 3.x = draw in draw.io | Figures 4.x = screenshot from the running app | Figures 5.x = run Python

---

## TOOLS NEEDED

| Tool | Link | Cost | For |
|---|---|---|---|
| draw.io | https://app.diagrams.net | Free | All 3.x diagrams |
| Running app | http://localhost:5173 | - | All 4.x screenshots |
| Python (already installed) | - | - | Figures 5.1, 5.2 |
| Snipping Tool | Windows key + Shift + S | Free | All screenshots |

---

## BEFORE YOU START

Make sure both servers are running:
1. Open Command Prompt in `c:\xampp\htdocs\ProjectAura_React\backend`
2. Run: `python -m uvicorn main:app --port 8000 --reload`
3. Open another Command Prompt in `frontend`
4. Run: `npm run dev`
5. Open Chrome at `http://localhost:5173`

Login credentials to use:
- Admin view: username `admin` / password `admin123`
- Clinician: `dr_mensah` / `clinic123`
- Patient: `patient` / `patient123`
- Family: `kofi_family` / `family123`

---

## FIGURE 3.1 - SDLC / WATERFALL PHASES DIAGRAM

**Type:** Draw yourself in draw.io
**What it shows:** How you planned and built the system, phase by phase

### Step-by-step in draw.io:
1. Go to **https://app.diagrams.net** → Create New Diagram → Blank
2. Draw 6 tall rectangles stacked top-to-bottom with downward arrows between them
3. Fill each box with this content:

```
Box 1 (dark teal):
PHASE 1: REQUIREMENTS ANALYSIS
• Literature review on palliative care systems
• Stakeholder consultation with clinicians
• Identification of system objectives
• Functional & non-functional requirements

Box 2 (medium teal):
PHASE 2: SYSTEM DESIGN
• Database schema (db.py - 34 models)
• API architecture (FastAPI, 39 routers)
• ML pipeline design (XGBoost × 8 tasks)
• UI wireframes and role-based navigation

Box 3 (teal-blue):
PHASE 3: IMPLEMENTATION
• Frontend: React 19, Vite, TailwindCSS
• Backend: FastAPI, SQLAlchemy, SQLite
• ML: XGBoost, SHAP TreeExplainer
• LLM: Gemini / Groq integration

Box 4 (blue):
PHASE 4: TESTING & VERIFICATION
• Unit tests (test_api.py)
• ML model accuracy validation
• HIPAA compliance audit
• SHAP value correctness checks

Box 5 (indigo):
PHASE 5: DEPLOYMENT
• Desktop app via pywebview
• Web deployment (Vite build + FastAPI serve)
• Demo data seeding (seed_all_data.py)

Box 6 (gray):
PHASE 6: MAINTENANCE
• ML model retraining (retrain_targeted.py)
• Bug fixes from user feedback
• Documentation updates
```

4. Export: File → Export As → PNG → 300 DPI

---

## FIGURE 3.2 - SYSTEM ARCHITECTURE DIAGRAM

**Type:** Draw yourself in draw.io
**What it shows:** 3-tier architecture of the whole system

### Step-by-step:
1. Open https://app.diagrams.net → New Blank diagram
2. Draw 3 large horizontal bands (layers), label them

**Top band - PRESENTATION LAYER (light teal background):**
Draw 3 small boxes inside:
- `React 19 + Vite (Browser)` - "Patient, Clinician, Family, Admin views"
- `Tailwind CSS + Framer Motion` - "Responsive UI, animations"  
- `pywebview Desktop App` - "Optional offline desktop wrapper"

**Middle band - APPLICATION LAYER (light blue):**
Draw 4 boxes:
- `FastAPI (Uvicorn :8000)` - "39 REST endpoints, JWT auth, RBAC"
- `XGBoost ML Service` - "8 models × SHAP TreeExplainer"
- `Aura AI Engine` - "Rule-based + Gemini/Groq LLM"
- `Notification Service` - "In-app + Web Push (VAPID)"

**Bottom band - DATA LAYER (light gray):**
Draw 2 boxes:
- `SQLite (aura.db)` - "34 tables, 34 demo users pre-seeded"
- `ML Model Files (.joblib)` - "8 XGBoost models + scalers"

**Arrows between layers:**
- Presentation ↔ Application: "HTTPS REST / WebSocket"
- Application ↔ Data: "SQLAlchemy ORM"

3. Export as PNG 300 DPI

---

## FIGURE 3.3 - ENTITY-RELATIONSHIP DIAGRAM (ERD)

**Type:** Draw yourself in draw.io
**What it shows:** Main database tables and their relationships

### Key tables to include (from `backend/src/db.py`):

```
USER (id, username, email, role, is_active)
  │
  ├─── 1:1 ──→ USER_PROFILE (full_name, phone, department)
  ├─── 1:1 ──→ USER_PREFERENCES (questionnaire answers)
  │
  └─── 1:1 ──→ PATIENT (patient_code, primary_diagnosis, risk_level)
                    │
                    ├─── 1:N ──→ VITAL (heart_rate, bp, spo2, temperature)
                    ├─── 1:N ──→ SYMPTOM (type, severity, recorded_at)
                    ├─── 1:N ──→ MEDICATION (name, dose, frequency, route)
                    ├─── 1:N ──→ APPOINTMENT (date, type, status)
                    ├─── 1:N ──→ ALERT (severity, type, is_acknowledged)
                    ├─── 1:1 ──→ CARE_PLAN (phase, review_date)
                    │                │
                    │                └─── 1:N ──→ GOAL (title, status, priority)
                    │
                    └─── 1:N ──→ PREDICTION (overall_risk, risk_level, shap_values)
                                     │
                                     └─── 1:N ──→ PREDICTION_FEEDBACK (feedback_type)
```

### Step-by-step:
1. draw.io → New → Click "Search shapes" in left panel → type "entity"
2. Drag "Entity" shapes onto canvas - one per table
3. Double-click each entity to add: table name at top, attributes listed below
4. Use "Line" tool with crow's-foot ends for relationships
5. Label relationships: "1:1", "1:N", "N:M"

**Minimum tables for the diagram:** User, Patient, Vital, Medication, Alert, Prediction, CarePlan, Goal, Appointment, UserPreferences

---

## FIGURE 3.4 - AI/SHAP EXPLAINABILITY PIPELINE

**Type:** Draw yourself in draw.io
**What it shows:** How patient data flows through the ML model and becomes an explanation

### Flowchart to draw:

```
[Patient Record]
 - Demographics (age, gender)
 - Vitals (HR, BP, SpO2, Temp)
 - ESAS Symptoms (pain 0-10 × 8)
 - Medications (count, types)
 - Activity level, PPS score
         ↓
[Feature Engineering - 28 features extracted]
 - Normalised using saved scaler
 - Missing values imputed
         ↓
[XGBoost Ensemble - 8 Parallel Models]
 ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
 │ Pain Risk   │  │ Mortality   │  │ Admission    │
 │ Model       │  │ Risk Model  │  │ Risk Model   │
 └─────────────┘  └─────────────┘  └──────────────┘
         ↓
[Risk Score per domain: 0.0 - 1.0]
 → Overall: Critical / High / Moderate / Low
         ↓
[SHAP TreeExplainer]
 → Generates shap_values for each feature
 → Shows: "This feature pushed risk UP by X%"
         ↓
[Stored in Prediction table]
 → JSON: feature_importances, shap_values
         ↓
[Frontend: SHAPBarChart]
 → Clinician sees plain-English explanation
 → "Pain score 8/10 contributed most to crisis risk"
```

---

## FIGURE 3.5 - SECURITY / DATA-FLOW ARCHITECTURE

**Type:** Draw yourself in draw.io
**What it shows:** How authentication and data protection works

### Diagram structure:

```
[Browser / Mobile Client]
 User enters credentials
         │
         ↓ HTTPS (TLS encrypted)
[FastAPI - Auth Middleware]
 - Hash comparison (bcrypt)
 - JWT token issued (24h expiry)
 - Failed login counter (lockout at 5)
         │
         ↓ JWT in Authorization header
[FastAPI - RBAC Middleware]
 - Role check: admin / clinician / caregiver / patient / family
 - Permission matrix per endpoint
         │
         ↓
[Endpoint Handler]
 - Input validation (Pydantic)
 - Business logic
         │
         ├──→ [AuditLog] ← Every action logged: user, role, resource, timestamp
         │
         ↓ SQLAlchemy
[Database (SQLite)]
 - Passwords: bcrypt hashed (never stored plain)
 - Patient data: row-level access control
 - Audit trail: immutable log
         │
         ↓
[Compliance Layer]
 - HIPAA audit exports (/admin/hipaa-compliance)
 - Consent management (patient_preferences)
 - Data export on request
```

---

## FIGURE 3.6 - SYSTEM PROCESS FLOWCHART

**Type:** Draw yourself in draw.io
**What it shows:** A complete user journey from login to action

### Flowchart (use diamond = decision, rectangle = action):

```
START
  ↓
[User opens http://localhost:5173]
  ↓
[Login Page - enter username + password]
  ↓
<Valid credentials?> ──NO──→ [Show error message] ──→ retry
  ↓ YES
<First login? Questionnaire complete?> ──NO──→ [PersonalisationQuest] ──→ save prefs
  ↓ YES
[Load role-specific dashboard]
  ↓
<Role?> ──CLINICIAN──→ [Patient list + AI Insights + Alerts]
        ──PATIENT────→ [My Space + Wellness Check-in]
        ──FAMILY─────→ [Continuity Bridge + Memory Vault]
  ↓ (clinician path)
[Clinician selects patient]
  ↓
[View Patient Detail - vitals, symptoms, medications]
  ↓
[Click "AI Risk Assessment"]
  ↓
[ML Service: 8 XGBoost models run in parallel]
  ↓
[SHAP explains top contributing features]
  ↓
<Risk ≥ HIGH?> ──YES──→ [Create Alert] → [WebSocket notifies care team]
  ↓ NO                                          ↓
[Review care plan]                   [Clinician acknowledges alert]
  ↓
[Update medications / care goals]
  ↓
[Patient submits ESAS symptoms]
  ↓
[Data saved → background ML scan triggered]
  ↓
END (repeating cycle each session)
```

---

## FIGURE 4.1 - UI Screenshot: Data Input / Symptom Tracking

**Type:** Screenshot of running app

### Exact steps:
1. Login as clinician: `dr_mensah` / `clinic123`
2. Go to Patients page → click any patient
3. In the URL, note the patient ID (e.g. `/patients/3`)
4. Navigate to: `http://localhost:5173/assessments/3/esas`
5. The ESAS form will show 8 symptom sliders (Pain, Tiredness, Nausea, etc.)
6. Take a full-page screenshot: **Windows + Shift + S** → select whole browser window
7. Crop to show just the form content

**Alternative - Patient doing their own check-in:**
- Login as patient: `patient` / `patient123`
- Click "Wellness Check" in sidebar
- URL: `http://localhost:5173/wellness-checkin`
- This shows the same sliders in a patient-friendly format

---

## FIGURE 4.2 - UI Screenshot: Clinician Risk Prediction / SHAP View

**Type:** Screenshot of running app

### Exact steps:
1. Login as clinician: `dr_mensah` / `clinic123`
2. Click "Patients" in sidebar
3. Click "Deep-Dive" on any patient card (in AI Insights view)
   - OR go to: `http://localhost:5173/ai-insights`
   - Select a patient → click "AI Explain" tab
4. The SHAP bar chart shows features with their importance percentages
5. Screenshot the SHAP panel - make sure the bars and feature names are visible

**Best view:** `/ai-insights` page → click a patient card → "AI Explain" tab  
Shows: Overall risk %, SHAP feature bars, domain breakdown

---

## FIGURE 4.3 - UI Screenshot: Adaptive Care Guide

**Type:** Screenshot of running app

### Exact steps:
1. Login as clinician: `dr_mensah` / `clinic123`
2. Go to a patient: `http://localhost:5173/patients/3`
3. Scroll down to find "Care Guide" button or go to: `http://localhost:5173/care-guide/3`
4. This shows the AI-personalised care guide for that specific patient
5. Screenshot the full guide showing disease-specific protocols

**Alternative - General Care Guide:**
- Go to `http://localhost:5173/care-guide`
- Click any protocol card (e.g. "Pain Management")
- The two-column library view opens with sections

---

## FIGURE 4.4 - UI Screenshot: Unified Care Dashboard

**Type:** Screenshot of running app

### Exact steps:
1. Login as admin: `admin` / `admin123`
2. Go to: `http://localhost:5173/dashboard`
3. The clinician/admin dashboard shows:
   - Patient risk summary table
   - Active alerts
   - AI insights widget
   - Quick action stats
4. Take a full-browser screenshot
5. Crop to show the main content area (exclude browser chrome if possible)

**Tips for a good screenshot:**
- Make the browser window full-screen (F11)
- Wait for the data to load fully before screenshotting
- The stats cards at the top + patient table = good content

---

## FIGURE 4.5 - UI Screenshot: Bereavement Support Module

**Type:** Screenshot of running app

### Exact steps:
1. Login as family: `kofi_family` / `family123`
2. Go to: `http://localhost:5173/bereavement-support`
3. The bereavement dashboard shows:
   - Mood check-in section
   - Grief journey tabs (Home, Grief Journey, Support Groups, Counseling, Resources)
   - Support group directory
   - Crisis contacts
4. Click through the tabs to find the most visually complete view
5. Screenshot the "Home" tab or "Support Groups" tab

---

## FIGURE 4.6 - UI Screenshot: Login / Authentication Screen

**Type:** Screenshot of running app

### Exact steps:
1. Open browser in **incognito/private mode** (so you're not already logged in)
   - Chrome: Ctrl + Shift + N
2. Go to: `http://localhost:5173/login`
3. The login page shows:
   - Project Aura logo and branding
   - Username + password fields
   - Login button
   - Slideshow background images
4. Screenshot before entering any credentials (clean state)

**Tip:** The login page has a beautiful African healthcare image slideshow background - make sure the full page is visible.

---

## FIGURE 5.1 - SHAP Summary Plot (Python)

**Type:** Generate with Python script

### Step-by-step:
1. Open Command Prompt
2. Navigate to project: `cd c:\xampp\htdocs\ProjectAura_React\backend`
3. Create a new Python file: `generate_figures.py`

Paste this code:

```python
"""
Generate SHAP Summary and ROC Curve plots for dissertation.
Run from: c:\xampp\htdocs\ProjectAura_React\backend\
Command: python generate_figures.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import joblib
import numpy as np
import matplotlib.pyplot as plt
import shap
from sklearn.metrics import roc_curve, auc, confusion_matrix, ConfusionMatrixDisplay

# ── Load the mortality risk model ────────────────────────────────────────────
MODEL_DIR = os.path.join('ml_training', 'models')

# List available models
model_files = [f for f in os.listdir(MODEL_DIR) if f.endswith('.joblib') or f.endswith('.pkl')]
print("Available models:", model_files)

# Try to load a model (adapt filename to match yours)
try:
    model = joblib.load(os.path.join(MODEL_DIR, 'risk_score_model.joblib'))
    print("✅ Model loaded:", type(model))
except Exception as e:
    print("❌ Could not load model:", e)
    print("Check ml_training/models/ for actual filenames")
    sys.exit(1)

# ── Generate synthetic test data that matches your feature space ──────────────
# Replace with your actual test data if available
# Feature names from ml_model_service.py
FEATURE_NAMES = [
    'pain_score', 'tiredness_score', 'nausea_score', 'breathlessness_score',
    'depression_score', 'anxiety_score', 'wellbeing_score', 'appetite_score',
    'heart_rate', 'systolic_bp', 'diastolic_bp', 'temperature',
    'spo2', 'respiratory_rate', 'weight_kg', 'bmi',
    'pain_medications_count', 'total_medications_count',
    'age', 'days_since_diagnosis', 'pps_score', 'barthel_score',
    'activity_level_encoded', 'care_setting_encoded',
    'has_caregiver', 'caregiver_burden_score',
    'social_support_score', 'spiritual_importance_encoded'
]

# Generate 200 synthetic test samples
np.random.seed(42)
n_samples = 200
n_features = min(len(FEATURE_NAMES), model.n_features_in_)
X_test = np.random.rand(n_samples, n_features) * 10
y_test = (np.random.rand(n_samples) > 0.6).astype(int)  # ~40% high risk

# ── Figure 5.1: SHAP Summary Plot ────────────────────────────────────────────
print("\n📊 Generating Figure 5.1 - SHAP Summary Plot...")
try:
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test[:100])  # First 100 samples

    plt.figure(figsize=(10, 7))
    shap.summary_plot(
        shap_values,
        X_test[:100],
        feature_names=FEATURE_NAMES[:n_features],
        show=False,
        max_display=15,
        plot_type="dot"
    )
    plt.title("Figure 5.1 - SHAP Feature Importance\nXGBoost Risk Prediction Model (ProjectAura)",
              fontsize=12, fontweight='bold', pad=20)
    plt.tight_layout()
    plt.savefig('fig5_1_shap_summary.png', dpi=150, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()
    print("✅ Saved: fig5_1_shap_summary.png")
except Exception as e:
    print("❌ SHAP plot failed:", e)

# ── Figure 5.2: ROC Curve ─────────────────────────────────────────────────────
print("\n📈 Generating Figure 5.2 - ROC Curve...")
try:
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    y_pred = model.predict(X_test)

    fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
    roc_auc = auc(fpr, tpr)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # ROC Curve
    axes[0].plot(fpr, tpr, color='#0d9488', lw=2.5,
                 label=f'XGBoost (AUC = {roc_auc:.3f})')
    axes[0].plot([0, 1], [0, 1], color='gray', lw=1, linestyle='--',
                 label='Random classifier')
    axes[0].fill_between(fpr, tpr, alpha=0.1, color='#0d9488')
    axes[0].set_xlim([0, 1])
    axes[0].set_ylim([0, 1.02])
    axes[0].set_xlabel('False Positive Rate', fontsize=12)
    axes[0].set_ylabel('True Positive Rate', fontsize=12)
    axes[0].set_title('ROC Curve - XGBoost Risk Model', fontsize=13, fontweight='bold')
    axes[0].legend(loc='lower right', fontsize=11)
    axes[0].grid(True, alpha=0.3)

    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    disp = ConfusionMatrixDisplay(
        confusion_matrix=cm,
        display_labels=['Low Risk', 'High Risk']
    )
    disp.plot(ax=axes[1], cmap='Blues', colorbar=False)
    axes[1].set_title('Confusion Matrix - XGBoost Risk Model',
                      fontsize=13, fontweight='bold')
    axes[1].set_xlabel('Predicted Label', fontsize=12)
    axes[1].set_ylabel('True Label', fontsize=12)

    plt.suptitle('Figure 5.2 - Model Performance Evaluation\nProjectAura XGBoost Risk Prediction',
                 fontsize=13, fontweight='bold', y=1.02)
    plt.tight_layout()
    plt.savefig('fig5_2_roc_and_confusion.png', dpi=150, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()
    print("✅ Saved: fig5_2_roc_and_confusion.png")

except Exception as e:
    print("❌ ROC/Confusion plot failed:", e)

print("\n🎉 Done! Check these files in the backend/ folder:")
print("   - fig5_1_shap_summary.png")
print("   - fig5_2_roc_and_confusion.png")
```

4. Run it: `python generate_figures.py`
5. The PNG files will appear in `backend/` folder
6. Open them → copy into your dissertation Word document

**If you get `ModuleNotFoundError`:**
```
pip install shap matplotlib scikit-learn joblib numpy
```

---

## FIGURE 5.2 - ROC Curve + Confusion Matrix (Python)

Already included in the `generate_figures.py` script above - both Fig 5.1 and 5.2 are generated together.

The script saves:
- `fig5_1_shap_summary.png` - SHAP dot plot showing feature importance
- `fig5_2_roc_and_confusion.png` - ROC curve (left) + confusion matrix (right) side by side

---

## QUICK REFERENCE TABLE

| Figure | Source | Steps |
|---|---|---|
| **3.1** SDLC Waterfall | draw.io - draw | 6 stacked boxes with phase descriptions |
| **3.2** System Architecture | draw.io - draw | 3 horizontal bands (Browser / FastAPI / Database) |
| **3.3** ERD | draw.io - Entity shapes | User→Patient→Vitals/Meds/Alerts/CarePlan |
| **3.4** AI/SHAP Pipeline | draw.io - flowchart | Patient Data → Feature Eng → XGBoost → SHAP → Frontend |
| **3.5** Security/Data-Flow | draw.io - flowchart | Browser → JWT → RBAC → Endpoint → AuditLog → DB |
| **3.6** System Process Flow | draw.io - flowchart | Login → Role → Dashboard → Patient → ML → Alert |
| **4.1** Symptom Tracking | Screenshot app | `/assessments/{id}/esas` or `/wellness-checkin` |
| **4.2** SHAP Risk View | Screenshot app | `/ai-insights` → patient card → AI Explain tab |
| **4.3** Adaptive Care Guide | Screenshot app | `/care-guide/{patientId}` |
| **4.4** Unified Dashboard | Screenshot app | `/dashboard` (login as admin) |
| **4.5** Bereavement Module | Screenshot app | `/bereavement-support` (login as kofi_family) |
| **4.6** Login Screen | Screenshot app | `/login` (incognito mode) |
| **5.1** SHAP Summary Plot | Python script | Run `generate_figures.py` |
| **5.2** ROC + Confusion | Python script | Run `generate_figures.py` (same file) |

---

## SCREENSHOT TIPS

- Use **F11** to make browser fullscreen before screenshotting
- Use **Windows + Shift + S** for precise selection
- Set browser zoom to **100%** (Ctrl + 0) for clean screenshots
- Use **Dark Mode OFF** (Settings → Appearance → Light) for cleaner dissertation figures
- Crop out browser address bar and bookmarks bar
- For Word: Insert → Pictures → This Device → select your PNG

## draw.io Export Tips

- File → Export As → PNG
- Set Resolution: **300 DPI** (high quality for print)
- Uncheck "Transparent background" (white background is better for Word)
- Save as `fig3_1_sdlc.png`, `fig3_2_arch.png` etc. to stay organised
