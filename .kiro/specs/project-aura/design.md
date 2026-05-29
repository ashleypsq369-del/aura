# Design Document

## Overview

Project Aura is a web-based hospice care platform built on a **four-pillar architecture** that ensures comprehensive, ethical, and compassionate care throughout the entire patient journey:

**PILLAR 1: INTELLIGENT CORE (XAI Engine)**
- Explainable AI using XGBoost for care pathway recommendations and risk assessment
- SHAP-based visualizations for transparent feature importance
- Trained exclusively on synthetic data to ensure privacy

**PILLAR 2: SAFETY LAYER**
- **Structured Support Hub**: Menu-driven symptom logging and curated resource access (no open-ended AI)
- **Bereavement Bridge**: Post-death support with grief journaling, memory preservation, and stage-appropriate resources
- Safety through predefined interactions and vetted content only

**PILLAR 3: HUMAN BRIDGE (Care Dashboard)**
- Integrated Streamlit multi-page web application
- Role-based access for clinicians and family members
- Proactive Alert System with background monitoring and email notifications
- Empathetic UI design with accessibility features

**PILLAR 4: VALIDATION ENGINE (Scenario Simulator)**
- SDV-based synthetic data generation with diversity constraints
- End-to-end patient journey simulation (admission → death → bereavement)
- System integration validation and automated testing

**Technology Stack**: Python 3.10+, Streamlit (frontend), SQLite (database), XGBoost/SHAP (ML/XAI), SDV (synthetic data), SendGrid (alerts), SQLAlchemy (ORM), Pandas/NumPy (data processing), Pytest/Hypothesis (testing).

The design prioritizes ethical AI principles: transparency through SHAP visualizations, privacy through synthetic-only data, bias mitigation through diverse data generation, and safety through structured interactions.

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PILLAR 3: HUMAN BRIDGE                                │
│              STREAMLIT WEB APPLICATION (Care Dashboard)                  │
│                         (app.py + pages/)                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐           │
│  │   Login &    │  │   Symptom    │  │   Trends & Charts   │           │
│  │   Role Auth  │  │   Logging    │  │   Visualization     │           │
│  └──────────────┘  └──────────────┘  └─────────────────────┘           │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐           │
│  │  AI Insights │  │  Alert Setup │  │  Bereavement Bridge │           │
│  │  (SHAP viz)  │  │  & Config    │  │  (Post-death)       │           │
│  └──────────────┘  └──────────────┘  └─────────────────────┘           │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────┐           │
│  │  Proactive Alert System (Background Monitoring Thread)   │           │
│  │  • Trend Analysis  • Email Notifications via SendGrid    │           │
│  └──────────────────────────────────────────────────────────┘           │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┬─────────────────┐
        │                   │                   │                 │
        ▼                   ▼                   ▼                 ▼
┌───────────────┐   ┌──────────────┐   ┌──────────────┐  ┌──────────────┐
│  PILLAR 1:    │   │  PILLAR 2:   │   │  PILLAR 2:   │  │  PILLAR 4:   │
│  INTELLIGENT  │   │  SAFETY      │   │  SAFETY      │  │  VALIDATION  │
│  CORE         │   │  LAYER       │   │  LAYER       │  │  ENGINE      │
├───────────────┤   ├──────────────┤   ├──────────────┤  ├──────────────┤
│  XAI Engine   │   │ Support Hub  │   │ Bereavement  │  │  Scenario    │
│  (models.py)  │   │ (chat.py)    │   │ Bridge       │  │  Simulator   │
├───────────────┤   ├──────────────┤   │(bereavement  │  │(simulator.py)│
│ • XGBoost ML  │   │ • Structured │   │ .py)         │  ├──────────────┤
│ • SHAP XAI    │   │   Menus      │   ├──────────────┤  │ • SDV Data   │
│ • Risk Scores │   │ • Symptom    │   │ • Grief      │  │   Generation │
│ • Care Paths  │   │   Logging    │   │   Journaling │  │ • Diversity  │
│ • Transparent │   │ • Curated    │   │ • Memory     │  │   Constraints│
│   Predictions │   │   Resources  │   │   Vault      │  │ • Journey    │
│               │   │ • NO Open AI │   │ • Stage-     │  │   Simulation │
│               │   │              │   │   Appropriate│  │ • Validation │
│               │   │              │   │   Resources  │  │   Testing    │
└───────┬───────┘   └──────┬───────┘   └──────┬───────┘  └──────┬───────┘
        │                  │                  │                 │
        └──────────────────┼──────────────────┼─────────────────┘
                           │                  │
                           ▼                  ▼
                ┌───────────────────────────────────────┐
                │   SQLite Database (db.py)             │
                │   • Users & Roles                     │
                │   • Patient Records (Synthetic)       │
                │   • Vitals & Symptoms                 │
                │   • AI Predictions & SHAP Values      │
                │   • Alert Configs & History           │
                │   • Bereavement Journals & Memories   │
                │   • Audit Logs                        │
                └───────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: Streamlit 1.28+ (multi-page app, interactive widgets, charts)
- **Backend**: Python 3.10+ with SQLAlchemy ORM
- **Database**: SQLite (local, file-based)
- **ML/AI**: XGBoost (classification/regression), SHAP (explainability)
- **Data Generation**: SDV (Synthetic Data Vault)
- **Visualization**: Matplotlib, Seaborn (SHAP plots, trend charts)
- **Alerts**: SendGrid API (email notifications, free tier)
- **Data Processing**: Pandas, NumPy
- **Testing**: Pytest (unit and integration tests)
- **Model Persistence**: Joblib (save/load trained models)

### Deployment Model

- Single Streamlit application (`streamlit run app.py`)
- Local SQLite database file (`aura.db`)
- Environment variables for API keys (`.env` file)
- Virtual environment for dependency isolation
- Git repository structure for version control

## Components and Interfaces

### Foundation: Database Layer (db.py)

**Purpose**: Centralized data persistence using SQLAlchemy ORM with SQLite backend. This is the foundation that all four pillars interact with.

**Schema Design**:

```python
# Users table
class User:
    id: int (primary key)
    username: str (unique)
    password_hash: str
    role: str (enum: 'clinician', 'family')
    email: str
    created_at: datetime

# Patients table
class Patient:
    id: int (primary key)
    patient_code: str (synthetic identifier)
    age: int
    gender: str
    ethnicity: str
    admission_date: datetime
    status: str (enum: 'active', 'deceased')
    death_date: datetime (nullable)

# Vitals table
class Vital:
    id: int (primary key)
    patient_id: int (foreign key)
    recorded_by: int (foreign key to User)
    timestamp: datetime
    heart_rate: float
    blood_pressure_sys: float
    blood_pressure_dia: float
    oxygen_saturation: float
    temperature: float

# Symptoms table
class Symptom:
    id: int (primary key)
    patient_id: int (foreign key)
    recorded_by: int (foreign key to User)
    timestamp: datetime
    pain_level: int (0-10 scale)
    nausea: bool
    fatigue: bool
    anxiety: bool
    notes: text

# Predictions table
class Prediction:
    id: int (primary key)
    patient_id: int (foreign key)
    timestamp: datetime
    care_pathway: str
    risk_score: float
    shap_values: json (serialized SHAP explanation)
    model_version: str

# Alerts table
class Alert:
    id: int (primary key)
    patient_id: int (foreign key)
    triggered_at: datetime
    alert_type: str (enum: 'deterioration', 'critical_vital', 'symptom_spike')
    message: text
    sent_to: json (list of user IDs)
    acknowledged: bool

# Bereavement entries table
class BereavementEntry:
    id: int (primary key)
    patient_id: int (foreign key)
    user_id: int (foreign key)
    entry_type: str (enum: 'journal', 'memory')
    content: text
    created_at: datetime
```

**Key Functions**:
- `init_database()`: Create all tables and indexes
- `get_session()`: Return SQLAlchemy session for transactions
- `add_user()`, `get_user()`, `authenticate_user()`: User management
- `add_patient()`, `get_patient()`, `update_patient_status()`: Patient CRUD
- `log_vital()`, `log_symptom()`: Data entry functions
- `get_patient_history()`: Retrieve time-series data for trends
- `save_prediction()`, `get_predictions()`: AI result persistence
- `create_alert()`, `get_pending_alerts()`: Alert management
- `save_bereavement_entry()`, `get_bereavement_entries()`: Post-death support data

### PILLAR 1: INTELLIGENT CORE

### 2. XAI Engine (models.py)

**Purpose**: Train and deploy explainable ML models for care pathway recommendations and risk assessment.

**Model Architecture**:
- **Algorithm**: XGBoost Classifier (care pathway) + XGBoost Regressor (risk score)
- **Features**: pain_level, heart_rate, blood_pressure_sys, blood_pressure_dia, oxygen_saturation, temperature, fatigue, nausea, anxiety, days_since_admission
- **Targets**: 
  - Care pathway (classification): 'comfort_care', 'symptom_management', 'intensive_monitoring', 'crisis_intervention'
  - Risk score (regression): 0.0-1.0 (probability of deterioration in next 48 hours)

**Training Pipeline**:
1. Load synthetic training data from database
2. Feature engineering (normalize vitals, encode categorical symptoms)
3. Train XGBoost models with cross-validation
4. Save trained models using Joblib
5. Validate on holdout synthetic test set

**Inference Pipeline**:
1. Accept current patient data (vitals + symptoms)
2. Preprocess features (same transformations as training)
3. Generate predictions (care pathway + risk score)
4. Compute SHAP values for the specific prediction
5. Return prediction + SHAP explanation object

**Key Functions**:
- `train_models(training_data)`: Train XGBoost models on synthetic data
- `load_models()`: Load pre-trained models from disk
- `predict_care_pathway(patient_data)`: Return care pathway classification
- `predict_risk_score(patient_data)`: Return deterioration risk (0-1)
- `explain_prediction(patient_data, prediction)`: Generate SHAP values
- `plot_shap_summary(shap_values)`: Create SHAP feature importance visualization
- `plot_shap_waterfall(shap_values)`: Create SHAP waterfall plot for single prediction

**Explainability**:
- Use SHAP TreeExplainer for XGBoost models
- Generate both global (summary plot) and local (waterfall plot) explanations
- Display feature contributions in human-readable format
- Save SHAP plots as images for Streamlit display

### PILLAR 2: SAFETY LAYER

### 3. Support Hub (chat.py)

**Purpose**: Structured, menu-driven interface for symptom logging and resource access.

**Menu Structure**:
```
Main Menu:
├── Log Symptoms
│   ├── Pain Assessment (0-10 scale + location)
│   ├── Physical Symptoms (nausea, fatigue, breathing)
│   ├── Emotional State (anxiety, depression, fear)
│   └── Other Concerns (free text, limited)
├── Access Resources
│   ├── Symptom Management Tips
│   ├── Medication Information
│   ├── Comfort Measures
│   ├── Communication Guides
│   └── Emergency Contacts
└── View Recent Logs
```

**Resource Knowledge Base**:
- Static JSON file with curated content
- Categories: pain_management, nausea_relief, anxiety_coping, breathing_techniques, family_communication
- Each resource: title, description, content, external_links (vetted sources)

**Key Functions**:
- `display_main_menu()`: Render menu options in Streamlit
- `handle_symptom_logging()`: Guide user through structured symptom entry
- `validate_symptom_input()`: Ensure data completeness and validity
- `save_symptom_log()`: Persist to database via db.py
- `display_resources(category)`: Show curated resources for selected topic
- `load_resource_database()`: Load JSON knowledge base
- `get_recent_logs(patient_id, limit)`: Retrieve and display recent entries

**Safety Measures**:
- No open-ended text generation (avoid AI hallucination risks)
- Predefined response templates only
- Input validation to prevent harmful content
- Clear disclaimers: "This is not medical advice - contact your care team for urgent concerns"

### PILLAR 3: HUMAN BRIDGE (Continued)

### 4. Alert System (alerts.py)

**Purpose**: Background monitoring of patient trends with proactive email/SMS notifications.

**Alert Triggers**:
- **Deterioration Pattern**: 3+ consecutive worsening vital readings
- **Critical Vital**: Any vital outside safe range (e.g., O2 sat < 88%, HR > 120)
- **Symptom Spike**: Pain level increase of 3+ points in 24 hours
- **High Risk Score**: XAI Engine risk score > 0.75

**Monitoring Logic**:
```python
def check_alerts():
    for patient in active_patients:
        recent_vitals = get_recent_vitals(patient, hours=24)
        recent_symptoms = get_recent_symptoms(patient, hours=24)
        
        # Check vital trends
        if detect_deterioration(recent_vitals):
            create_alert(patient, 'deterioration', details)
        
        # Check critical values
        if any_critical_vital(recent_vitals):
            create_alert(patient, 'critical_vital', details)
        
        # Check symptom spikes
        if detect_pain_spike(recent_symptoms):
            create_alert(patient, 'symptom_spike', details)
        
        # Check AI risk score
        risk = predict_risk_score(patient)
        if risk > 0.75:
            create_alert(patient, 'high_risk', details)
```

**Notification Delivery**:
- Use SendGrid API for email notifications
- Email template: patient identifier, alert type, summary, action recommendations
- Send to configured recipients (clinicians + designated family members)
- Log all sent alerts in database

**Key Functions**:
- `start_monitoring_thread()`: Launch background thread for continuous monitoring
- `check_alerts()`: Main monitoring loop (runs every 5 minutes)
- `detect_deterioration(vitals)`: Analyze vital trends
- `detect_pain_spike(symptoms)`: Analyze symptom changes
- `create_alert(patient, type, details)`: Create alert record in database
- `send_alert_email(alert, recipients)`: Send via SendGrid API
- `get_alert_config(patient)`: Retrieve notification preferences

### PILLAR 2: SAFETY LAYER (Continued)

### 5. Bereavement Bridge (bereavement.py)

**Purpose**: Post-death support module for family members.

**Features**:
- **Grief Journaling**: Prompted writing exercises (e.g., "Share a favorite memory", "What are you feeling today?")
- **Digital Memories**: Text-based memory preservation (stories, reflections)
- **Resource Library**: Curated grief support content organized by stage (shock, anger, acceptance, etc.)
- **Support Contacts**: Hotlines, support groups, counseling services

**Resource Categories**:
```json
{
  "grief_stages": {
    "shock": ["Understanding Initial Grief", "Self-Care in Early Days"],
    "anger": ["Processing Difficult Emotions", "Healthy Expression"],
    "bargaining": ["Making Sense of Loss", "Finding Meaning"],
    "depression": ["Coping with Sadness", "When to Seek Help"],
    "acceptance": ["Moving Forward", "Honoring Memory"]
  },
  "support_types": {
    "hotlines": ["National Grief Hotline: 1-800-XXX-XXXX"],
    "support_groups": ["Local Hospice Groups", "Online Communities"],
    "professional_help": ["Finding a Grief Counselor", "Therapy Options"]
  }
}
```

**Key Functions**:
- `activate_bereavement_bridge(patient_id)`: Enable module after death event
- `display_journal_prompts()`: Show guided writing prompts
- `save_journal_entry(user, patient, content)`: Persist journal entry
- `display_memory_form()`: Interface for adding memories
- `save_memory(user, patient, content)`: Persist memory
- `display_grief_resources(stage)`: Show stage-appropriate resources
- `get_user_entries(user, patient)`: Retrieve past journals/memories
- `load_bereavement_resources()`: Load curated content from JSON

### PILLAR 4: VALIDATION ENGINE

### 6. Scenario Simulator (simulator.py)

**Purpose**: Generate synthetic patient journeys and validate end-to-end system functionality.

**Simulation Pipeline**:
1. **Data Generation**: Use SDV to create synthetic patient cohort
2. **Journey Simulation**: Progress each patient through care stages
3. **Event Triggering**: Log vitals/symptoms, trigger alerts, activate bereavement
4. **Validation**: Verify all system components respond correctly
5. **Reporting**: Generate summary with logs, visualizations, test results

**SDV Configuration**:
```python
# Define data schema for synthetic generation
schema = {
    'patients': {
        'age': {'type': 'numerical', 'subtype': 'integer', 'range': [45, 95]},
        'gender': {'type': 'categorical', 'values': ['M', 'F', 'Other']},
        'ethnicity': {'type': 'categorical', 'values': ['Caucasian', 'African American', 'Hispanic', 'Asian', 'Other']},
    },
    'vitals': {
        'heart_rate': {'type': 'numerical', 'distribution': 'normal', 'mean': 75, 'std': 15},
        'oxygen_saturation': {'type': 'numerical', 'distribution': 'normal', 'mean': 94, 'std': 3},
        # ... other vitals
    }
}

# Ensure diversity for bias mitigation
constraints = {
    'ethnicity_distribution': {'Caucasian': 0.3, 'African American': 0.25, 'Hispanic': 0.2, 'Asian': 0.15, 'Other': 0.1},
    'gender_distribution': {'M': 0.45, 'F': 0.45, 'Other': 0.1}
}
```

**Journey Stages**:
1. **Admission** (Day 0): Create patient, initial vitals/symptoms
2. **Stable Monitoring** (Days 1-7): Regular vitals, mild symptoms
3. **Deterioration** (Days 8-14): Worsening vitals, increased pain → triggers alerts
4. **Crisis** (Days 15-20): Critical vitals, high risk scores → intensive alerts
5. **Death Event** (Day 21): Record death, activate Bereavement Bridge
6. **Bereavement** (Days 22-30): Family accesses grief support

**Key Functions**:
- `generate_synthetic_cohort(n_patients)`: Create diverse patient dataset using SDV
- `simulate_patient_journey(patient)`: Progress through all care stages
- `generate_vital_reading(patient, stage)`: Create stage-appropriate vital signs
- `generate_symptom_log(patient, stage)`: Create stage-appropriate symptoms
- `simulate_deterioration(patient)`: Trigger alert-worthy trends
- `simulate_death_event(patient)`: Record death and activate bereavement
- `validate_system_response()`: Check that alerts fired, bereavement activated, etc.
- `generate_simulation_report()`: Create summary with statistics and visualizations

### PILLAR 3: HUMAN BRIDGE

### 7. Care Dashboard (app.py)

**Purpose**: Main Streamlit application integrating all components.

**Page Structure**:
```
app.py (main entry, routing)
├── pages/
│   ├── 1_Login.py (authentication)
│   ├── 2_Dashboard_Home.py (overview, quick stats)
│   ├── 3_Log_Data.py (symptom/vital entry forms)
│   ├── 4_View_Trends.py (charts, visualizations)
│   ├── 5_AI_Insights.py (XAI recommendations + SHAP)
│   ├── 6_Support_Hub.py (structured chat, resources)
│   ├── 7_Alerts.py (alert config, history)
│   └── 8_Bereavement.py (grief support, conditional access)
```

**Session State Management**:
```python
st.session_state = {
    'authenticated': bool,
    'user_id': int,
    'username': str,
    'role': str,  # 'clinician' or 'family'
    'current_patient': int,  # selected patient ID
    'alert_thread_started': bool
}
```

**Key Functions**:
- `main()`: Application entry point, routing logic
- `render_sidebar()`: Navigation menu with role-based visibility
- `check_authentication()`: Verify user logged in, redirect if not
- `initialize_app()`: Database setup, model loading, alert thread start
- `apply_theme()`: Set empathetic UI styling (soft colors, large fonts)

**UI Design Principles**:
- Soft color palette: blues, greens, warm neutrals
- Large, readable fonts (minimum 14pt body text)
- High contrast for accessibility
- Clear visual hierarchy
- Minimal cognitive load (one primary action per page)
- Compassionate language throughout
- Mobile-responsive layouts

## Data Models

### Patient Data Flow

```
User Input (Streamlit Forms)
    ↓
Validation (chat.py / app.py)
    ↓
Database Persistence (db.py)
    ↓
Background Monitoring (alerts.py)
    ↓
Trend Analysis & Alert Triggers
    ↓
Notification Delivery (SendGrid)
```

### AI Prediction Flow

```
Patient Current State (vitals + symptoms from DB)
    ↓
Feature Engineering (models.py)
    ↓
XGBoost Inference
    ↓
SHAP Explanation Generation
    ↓
Prediction + Explanation Storage (DB)
    ↓
Visualization in Dashboard (Streamlit)
```

### Synthetic Data Flow

```
SDV Configuration (simulator.py)
    ↓
Synthetic Patient Generation
    ↓
Journey Stage Progression
    ↓
Automated Data Logging (DB)
    ↓
System Response Validation
    ↓
Report Generation
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Core AI Properties

Property 1: Care pathway generation completeness
*For any* valid patient data input (vitals, symptoms, pain levels), the XAI_Engine should generate both a care pathway recommendation from the defined set ('comfort_care', 'symptom_management', 'intensive_monitoring', 'crisis_intervention') and a deterioration risk score between 0.0 and 1.0.
**Validates: Requirements 1.1, 1.5**

Property 2: SHAP explanation presence
*For any* prediction made by the XAI_Engine, SHAP-based explanations should be generated containing feature importance values for all input features used in the prediction.
**Validates: Requirements 1.2**

Property 3: Recommendation display completeness
*For any* AI recommendation displayed to a clinician, the Care_Dashboard should render both the care pathway text and the corresponding SHAP visualization (feature importance plot).
**Validates: Requirements 1.3**

### Synthetic Data Properties

Property 4: Synthetic data exclusivity
*For any* data used in training, prediction, or storage operations, the system should verify that all data originates from synthetic sources (SDV-generated) with no real patient information present.
**Validates: Requirements 1.4, 2.4, 9.1, 9.3**

Property 5: Synthetic patient record completeness
*For any* patient record generated by the Scenario_Simulator, the record should contain all required fields: demographics (age, gender, ethnicity), vitals (heart rate, blood pressure, oxygen saturation, temperature), symptoms (pain level, nausea, fatigue, anxiety), and timeline information.
**Validates: Requirements 2.1**

Property 6: Demographic diversity in cohorts
*For any* cohort of synthetic patients generated (n ≥ 20), the distribution across demographic dimensions (age ranges, gender, ethnicity) should meet minimum diversity thresholds (no single category > 40% of cohort).
**Validates: Requirements 2.2**

Property 7: Local storage verification
*For any* data storage operation, the system should write to the local SQLite database file without making network calls to cloud services for patient data transmission.
**Validates: Requirements 2.3, 9.2**

Property 8: Patient journey completeness
*For any* synthetic patient journey generated by the Scenario_Simulator, the journey should include all care continuum stages in sequence: admission, stable monitoring, deterioration, crisis, death event, and bereavement activation.
**Validates: Requirements 2.5, 7.2**

### Dashboard and User Interface Properties

Property 9: Role-based interface rendering
*For any* authenticated user accessing the Care_Dashboard, the interface should display features appropriate to their role: clinicians see full patient data and administrative controls, while family members see patient-specific information with restricted access to sensitive clinical details.
**Validates: Requirements 3.1, 8.2, 8.3, 8.4**

Property 10: Data persistence with metadata
*For any* user-submitted data (symptom logs, vital readings, journal entries, memories), the system should persist the entry to the database with complete metadata including timestamp, user attribution, and patient association.
**Validates: Requirements 3.2, 5.5, 6.4**

Property 11: Trend visualization presence
*For any* patient with historical data (≥ 3 data points), the trend view should generate and display interactive charts showing progression over time for vitals and symptoms.
**Validates: Requirements 3.3**

Property 12: Session state persistence
*For any* authenticated user session, the system should maintain session state (user ID, role, selected patient) consistently across page navigations until explicit logout.
**Validates: Requirements 8.5**

### Alert System Properties

Property 13: Deterioration pattern detection
*For any* sequence of patient vitals or symptoms showing deteriorating trends (3+ consecutive worsening readings or pain increase ≥ 3 points in 24 hours), the Alert_System should detect the pattern and create an alert record.
**Validates: Requirements 4.1**

Property 14: Alert notification triggering
*For any* detected deterioration pattern or high risk score (> 0.75), the Alert_System should trigger email notifications to all designated recipients (clinicians and family members configured for that patient).
**Validates: Requirements 4.2**

Property 15: Alert configuration persistence
*For any* user-configured alert settings (thresholds, notification preferences), the Care_Dashboard should persist the configuration to the database and apply it in subsequent alert evaluations.
**Validates: Requirements 4.3**

Property 16: Alert message completeness
*For any* alert notification sent, the message should include required fields: patient identifier, alert type, alert reason, and trend summary.
**Validates: Requirements 4.4**

Property 17: Non-blocking background monitoring
*For any* alert evaluation cycle, the Alert_System should check database entries and evaluate trends without blocking user interface operations (runs in separate thread).
**Validates: Requirements 4.5**

### Support Hub Properties

Property 18: Structured interaction flow
*For any* symptom category selected in the Support_Hub, the system should present structured questions (not open-ended prompts) to guide detailed symptom logging.
**Validates: Requirements 5.2**

Property 19: Knowledge base response sourcing
*For any* resource request in the Support_Hub, the response content should match an entry from the predefined knowledge base (JSON file) rather than being generated by AI.
**Validates: Requirements 5.3**

Property 20: Generative AI avoidance
*For any* user input processed by the Support_Hub, the system should respond using template-based or menu-driven interactions without invoking open-ended generative AI models.
**Validates: Requirements 5.4**

### Bereavement Bridge Properties

Property 21: Death event triggers bereavement activation
*For any* patient death event recorded in the system, the Bereavement_Bridge should activate and become accessible to family users associated with that patient.
**Validates: Requirements 6.1, 7.4**

Property 22: Grief resource availability
*For any* family member accessing the active Bereavement_Bridge, the system should display curated grief support resources organized by grief stages (shock, anger, bargaining, depression, acceptance) and support types (hotlines, groups, professional help).
**Validates: Requirements 6.3**

Property 23: Resource organization structure
*For any* resource display in the Bereavement_Bridge, content should be organized into defined categories (grief stages, support types) with clear navigation between categories.
**Validates: Requirements 6.5**

### Simulation and Validation Properties

Property 24: Journey diversity in simulations
*For any* simulator run generating multiple patient journeys (n ≥ 5), the generated journeys should exhibit varied characteristics across demographics, symptom patterns, and timeline durations.
**Validates: Requirements 7.1**

Property 25: Alert system integration validation
*For any* simulated patient journey that includes deterioration events, the Alert_System should trigger and create alert records, validating the integration between simulation and alerting.
**Validates: Requirements 7.3**

Property 26: Simulation report completeness
*For any* completed simulation run, the Scenario_Simulator should generate a summary report containing logs of all events, visualizations of patient trajectories, and validation results for system responses.
**Validates: Requirements 7.5**

### Authentication and Access Control Properties

Property 27: Authentication and role assignment
*For any* valid user login with correct credentials, the Care_Dashboard should authenticate the user and assign the appropriate role (clinician or family member) based on their user record.
**Validates: Requirements 8.1**

### Privacy and Audit Properties

Property 28: Audit logging for transparency
*For any* data access operation or AI decision made by the system, an audit log entry should be created recording the action, timestamp, user, and affected patient.
**Validates: Requirements 9.4**

Property 29: Synthetic data indicators in UI
*For any* data displayed in the Care_Dashboard, the interface should include clear visual indicators (labels, banners, or watermarks) that all data is synthetic for prototype purposes.
**Validates: Requirements 9.5**

### System Integration Properties

Property 30: Subsystem initialization on launch
*For any* application launch, the Care_Dashboard should successfully initialize all subsystems (database connection, XAI_Engine model loading, Alert_System thread start, Support_Hub resource loading, Bereavement_Bridge resource loading) before accepting user requests.
**Validates: Requirements 10.1**

Property 31: Cross-component data consistency
*For any* data written to the database by one component, other components reading that data should retrieve consistent values without corruption or loss.
**Validates: Requirements 10.2**

## Error Handling

### XAI Engine Errors

- **Missing Features**: If patient data lacks required features, return error with list of missing fields rather than making prediction
- **Model Loading Failure**: If trained models cannot be loaded, display clear error message and prevent AI Insights page access
- **SHAP Computation Failure**: If SHAP values cannot be computed, log error and display prediction without explanation (with warning)
- **Invalid Predictions**: If model outputs invalid values (e.g., risk score > 1.0), clamp to valid range and log warning

### Database Errors

- **Connection Failure**: On database connection error, display user-friendly message and prevent data operations
- **Constraint Violations**: On foreign key or unique constraint violations, rollback transaction and show specific error
- **Query Failures**: On query errors, log full error details and show generic message to user
- **Data Corruption**: Implement database integrity checks on startup; alert if corruption detected

### Alert System Errors

- **SendGrid API Failure**: If email sending fails, log error, mark alert as "failed to send", and retry up to 3 times
- **Network Errors**: On network failures, queue alerts for retry when connection restored
- **Invalid Recipients**: If recipient email invalid, log warning and send to remaining valid recipients
- **Thread Crashes**: If monitoring thread crashes, log error and attempt restart; alert admin if restart fails

### Support Hub Errors

- **Resource Loading Failure**: If knowledge base JSON cannot be loaded, display error and disable resource access
- **Invalid User Input**: Validate all form inputs; show specific validation errors for invalid entries
- **Database Write Failures**: If symptom log cannot be saved, show error and allow user to retry

### Bereavement Bridge Errors

- **Premature Access**: If family member tries to access before death event, show message explaining module is not yet active
- **Resource Loading Failure**: If grief resources cannot be loaded, show error and provide fallback contact information

### Simulator Errors

- **SDV Generation Failure**: If synthetic data generation fails, log error with SDV details and halt simulation
- **Journey Progression Errors**: If journey simulation encounters errors, log details and continue with remaining journeys
- **Report Generation Failure**: If report cannot be generated, save raw logs and alert user

### General Error Handling Principles

- All errors logged with full stack traces to `logs/aura_errors.log`
- User-facing error messages are compassionate and non-technical
- Critical errors prevent system operation; non-critical errors allow degraded functionality
- All database operations wrapped in try-except with rollback on failure
- API calls include timeout and retry logic

## Testing Strategy

Project Aura employs a dual testing approach combining unit tests for specific functionality and property-based tests for universal correctness properties. This comprehensive strategy ensures both concrete bug detection and general correctness verification.

### Unit Testing Approach

Unit tests verify specific examples, edge cases, and integration points between components. They provide concrete validation of expected behavior for known scenarios.

**Unit Test Coverage**:

- **Database Operations** (test_db.py):
  - User creation and authentication with valid/invalid credentials
  - Patient CRUD operations
  - Vital and symptom logging with edge cases (boundary values, missing fields)
  - Query operations for trend data retrieval
  - Foreign key constraint enforcement

- **XAI Engine** (test_models.py):
  - Model loading from saved files
  - Prediction with known synthetic patient data
  - SHAP value computation for sample predictions
  - Feature engineering transformations
  - Edge cases: missing features, extreme values

- **Alert System** (test_alerts.py):
  - Deterioration detection with known trend patterns
  - Alert creation and persistence
  - Email notification formatting (mock SendGrid)
  - Alert configuration persistence and retrieval

- **Support Hub** (test_chat.py):
  - Menu navigation and selection handling
  - Symptom logging form validation
  - Resource retrieval from knowledge base
  - Template response generation

- **Bereavement Bridge** (test_bereavement.py):
  - Activation on death event
  - Journal entry persistence
  - Resource loading and categorization
  - Access control (family only)

- **Simulator** (test_simulator.py):
  - SDV synthetic data generation
  - Journey stage progression
  - Integration with alert system
  - Report generation

**Unit Test Framework**: Pytest with fixtures for database setup/teardown, mock objects for external APIs (SendGrid), and test data generators.

### Property-Based Testing Approach

Property-based tests verify universal properties that should hold across all valid inputs. The system uses Hypothesis (Python PBT library) to generate diverse test cases and validate correctness properties from the design document.

**PBT Configuration**:
- Library: Hypothesis 6.0+
- Minimum iterations per property: 100 test cases
- Custom strategies for domain-specific data (patient vitals, symptoms, demographics)

**Property Test Implementation Requirements**:
- Each property-based test MUST be tagged with a comment referencing the design document property
- Tag format: `# Feature: project-aura, Property {number}: {property_text}`
- Each correctness property MUST be implemented by a SINGLE property-based test
- Tests should use Hypothesis strategies to generate diverse, valid inputs

**Property Test Coverage** (test_properties.py):

- **Property 1**: Generate random patient data, verify care pathway and risk score always returned
- **Property 2**: Generate random predictions, verify SHAP values present for all features
- **Property 4**: Generate random data operations, verify all data has synthetic markers
- **Property 6**: Generate cohorts of varying sizes, verify demographic diversity thresholds
- **Property 8**: Generate random journeys, verify all stages present in sequence
- **Property 9**: Generate random user/role combinations, verify appropriate interface rendering
- **Property 10**: Generate random data submissions, verify persistence with complete metadata
- **Property 13**: Generate random vital/symptom sequences, verify deterioration detection
- **Property 14**: Generate random deterioration events, verify alert notifications triggered
- **Property 16**: Generate random alerts, verify message completeness
- **Property 19**: Generate random resource requests, verify responses match knowledge base
- **Property 21**: Generate random death events, verify bereavement activation
- **Property 27**: Generate random login attempts, verify authentication and role assignment
- **Property 28**: Generate random operations, verify audit log creation
- **Property 31**: Generate random data writes, verify cross-component read consistency

**Hypothesis Strategies**:

```python
# Example custom strategies for domain data
@st.composite
def patient_vitals(draw):
    return {
        'heart_rate': draw(st.integers(min_value=40, max_value=180)),
        'blood_pressure_sys': draw(st.integers(min_value=70, max_value=200)),
        'blood_pressure_dia': draw(st.integers(min_value=40, max_value=130)),
        'oxygen_saturation': draw(st.floats(min_value=70.0, max_value=100.0)),
        'temperature': draw(st.floats(min_value=95.0, max_value=105.0))
    }

@st.composite
def patient_symptoms(draw):
    return {
        'pain_level': draw(st.integers(min_value=0, max_value=10)),
        'nausea': draw(st.booleans()),
        'fatigue': draw(st.booleans()),
        'anxiety': draw(st.booleans())
    }

@st.composite
def user_roles(draw):
    return draw(st.sampled_from(['clinician', 'family']))
```

### Integration Testing

Integration tests validate end-to-end workflows across multiple components:

- **Complete Patient Journey**: Create patient → log data → trigger alerts → record death → access bereavement
- **AI Recommendation Flow**: Log symptoms → generate prediction → display SHAP → verify persistence
- **Alert Pipeline**: Log deteriorating vitals → detect pattern → send notification → verify delivery
- **Simulation Validation**: Run simulator → verify all components respond → check report generation

### Test Execution

- Run unit tests: `pytest tests/test_*.py -v`
- Run property tests: `pytest tests/test_properties.py -v --hypothesis-show-statistics`
- Run all tests: `pytest tests/ -v`
- Coverage report: `pytest --cov=src --cov-report=html`

### Continuous Validation

- All tests run before commits (pre-commit hook)
- Simulator runs as validation suite after major changes
- Property tests catch regressions across input space
- Unit tests catch specific known bugs

This dual approach ensures Project Aura maintains both specific correctness (unit tests) and general correctness (property tests), providing comprehensive confidence in system behavior.
