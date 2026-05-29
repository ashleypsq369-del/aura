# 📋 Original Project AURA System Documentation

## System Overview

**Project AURA** is a comprehensive Hospice Care Management Platform with 17 full-featured pages covering the entire hospice care journey.

---

## 🏗️ System Architecture

### Core Application
- **app.py** - Main entry point with authentication routing
- **Database** - SQLite database (aura.db) with patient records
- **Authentication** - Role-based user system

### User Roles
1. **Admin** - Full system access
2. **Clinician** - Clinical tools and patient care
3. **Caregiver** - Care coordination and tasks
4. **Family** - Family member access to patient info
5. **Patient** - Personal health dashboard

---

## 📄 All 17 Pages

### 1. **Login (pages/1_Login.py)**
- Beautiful gradient background
- User authentication
- Demo credentials display
- Role-based routing

### 2. **Dashboard (pages/2_Dashboard.py)**
- Role-specific dashboards
- Key metrics (Patients, Alerts, Appointments, Tasks)
- Patient trend charts
- Recent alerts feed
- Quick action buttons
- Personalized for each user role

### 3. **Log Data (pages/3_Log_Data.py)**
- Patient data entry
- Vital signs logging
- Pain assessment
- Symptom tracking
- Medication administration records

### 4. **View Trends (pages/4_View_Trends.py)**
- Patient analytics
- Trend visualizations
- Pain level charts
- Vital signs graphs
- Historical data analysis

### 5. **AI Insights (pages/5_AI_Insights.py)**
- XGBoost pain prediction models
- Risk assessment algorithms
- SHAP explanations
- Predictive analytics
- Clinical decision support

### 6. **Alerts (pages/6_Alerts.py)**
- Multi-level alerts (Critical/Warning/Info)
- Alert management
- Priority filtering
- Alert assignment
- Response tracking
- Configurable thresholds

### 7. **Support Hub (pages/7_Support_Hub.py)**
- Educational resources
- Symptom management guides
- Medication information
- FAQ section
- Emergency contacts
- Support resources

### 8. **Bereavement Bridge (pages/8_Bereavement_Bridge.py)**
- Grief support resources
- Memorial creation
- Memory sharing
- Support group directory
- Grief counseling info
- Healing journey tracking

### 9. **Patient Onboarding (pages/9_Patient_Onboarding.py)**
- 6-step registration wizard
- Basic information
- Medical history
- Insurance details
- Emergency contacts
- Patient preferences
- Consent forms

### 10. **Clinical Simulation (pages/10_Clinical_Simulation.py)**
- Training scenarios
- Clinical decision practice
- Performance tracking
- Scenario library
- Achievement system

### 11. **Medication Management (pages/11_Medication_Management.py)**
- Medication tracking
- Dosage schedules
- Medication alerts
- Drug interaction checks
- Administration records

### 12. **Appointment Scheduling (pages/12_Appointment_Scheduling.py)**
- Calendar view
- Appointment booking
- Visit scheduling
- Reminder system
- Team coordination

### 13. **Caregiver Portal (pages/13_Caregiver_Portal.py)**
- Task management
- Caregiver resources
- Burnout prevention
- Self-assessment tools
- Support network

### 14. **Memory Vault (pages/14_Memory_Vault.py)**
- Digital memory storage
- Photo sharing
- Story recording
- Family collaboration
- Legacy preservation

### 15. **Journal (pages/15_Journal.py)**
- Patient journaling
- Family notes
- Care team documentation
- Progress tracking
- Reflection tools

### 16. **Care Plan (pages/16_Care_Plan.py)**
- Personalized care plans
- Goal setting
- Care coordination
- Plan updates
- Team collaboration

### 17. **Functional Status (pages/17_Functional_Status.py)**
- ADL assessments
- Mobility tracking
- Functional decline monitoring
- Independence measures
- Care level determination

---

## 🔧 Core Modules (src/)

### Database & Models
- **db.py** - Database operations, patient CRUD
- **models.py** - Data models (Patient, User, VitalSigns)
- **models_extended.py** - Extended data models

### AI & Analytics
- **xai.py** - Explainable AI models
- **simulator.py** - Clinical simulation engine
- **analytics.py** - Data analytics
- **reporting.py** - Report generation

### Features
- **alerts.py** - Alert generation and management
- **notifications.py** - Notification system
- **medication.py** - Medication management
- **scheduling.py** - Appointment scheduling
- **caregiver.py** - Caregiver support
- **memory_vault.py** - Memory storage
- **journal.py** - Journaling system
- **care_plan.py** - Care planning
- **functional_status.py** - Functional assessments
- **bereavement_enhanced.py** - Bereavement support

### UI & Navigation
- **navigation.py** - Navigation system
- **styles.py** - Styling and themes
- **theme.py** - Theme management
- **ui_utils.py** - UI utilities

### Security
- **audit.py** - Audit logging
- **rbac.py** - Role-based access control

---

## 📊 Data Files

### Resources
- **data/resources.json** - Support resources
- **data/bereavement_resources.json** - Grief resources
- **data/bereavement_resources_extended.json** - Extended grief support
- **data/medications.json** - Medication database

### Assets
- **assets/healthcare_theme.css** - Healthcare styling
- **assets/animations.css** - UI animations
- **assets/icons.py** - Icon library
- **assets/fonts/inter.css** - Typography

---

## 🎯 Key Features

### 1. **Comprehensive Patient Care**
- Full patient lifecycle management
- Vital signs monitoring
- Pain assessment
- Symptom tracking
- Medication management

### 2. **AI-Powered Insights**
- Predictive analytics
- Risk assessment
- Clinical decision support
- Explainable AI (SHAP)

### 3. **Family Engagement**
- Family portal
- Memory sharing
- Communication tools
- Bereavement support

### 4. **Clinical Tools**
- Training simulations
- Care planning
- Functional assessments
- Documentation

### 5. **Support Resources**
- Educational materials
- Symptom guides
- Emergency contacts
- Grief counseling

---

## 🔐 Security Features

- Role-based access control
- User authentication
- Session management
- Audit logging
- Data encryption ready

---

## 📈 Analytics & Reporting

- Patient trend analysis
- Alert statistics
- Performance metrics
- Custom reports
- Data visualization

---

## 🎨 User Experience

- Modern healthcare-themed UI
- Responsive design
- Intuitive navigation
- Interactive visualizations
- Mobile-friendly

---

## 🗄️ Database Schema

### Tables
- **users** - User accounts and roles
- **patients** - Patient records
- **vital_signs** - Vital signs data
- **medications** - Medication records
- **appointments** - Scheduling data
- **alerts** - Alert records
- **journal_entries** - Journal data
- **memories** - Memory vault data

---

## 🚀 Deployment

### Requirements
- Python 3.8+
- Streamlit
- SQLite
- Plotly
- Pandas
- NumPy
- XGBoost (for AI features)

### Launch
```bash
streamlit run app.py
```

### Demo Accounts
- admin / admin123
- doctor / doctor123
- caregiver / caregiver123
- family / family123
- patient / patient123

---

## 📚 Documentation Files

- README.md - Project overview
- USER_GUIDE.md - User documentation
- QUICK_START_GUIDE.md - Getting started
- DEPLOYMENT_GUIDE.md - Deployment instructions
- ROLE_BASED_ACCESS.md - RBAC documentation

---

## 🎓 Training & Support

- Clinical simulation scenarios
- Interactive tutorials
- Video demonstrations
- User guides
- FAQ sections

---

## ✨ Innovation Highlights

1. **Holistic Care** - Covers physical, emotional, and spiritual needs
2. **AI Integration** - Predictive analytics with explainability
3. **Family-Centered** - Engages families in care process
4. **Bereavement Support** - Comprehensive grief resources
5. **Memory Preservation** - Digital legacy creation
6. **Clinical Training** - Built-in simulation system

---

## 📊 System Statistics

- **17 Pages** - Full-featured application
- **23 Core Modules** - Comprehensive functionality
- **5 User Roles** - Role-based access
- **4 Data Files** - Resource libraries
- **Multiple Tests** - Unit and integration tests
- **Extensive Documentation** - Complete guides

---

## 🎯 Use Cases

1. **Clinical Care** - Patient monitoring and care delivery
2. **Family Support** - Family engagement and communication
3. **Training** - Clinical staff education
4. **Analytics** - Data-driven decision making
5. **Bereavement** - Grief support and counseling
6. **Memory Preservation** - Legacy creation

---

## 🔄 Workflow

1. **Patient Onboarding** → Registration and intake
2. **Care Delivery** → Daily care and monitoring
3. **Data Logging** → Vital signs and symptoms
4. **Analytics** → Trend analysis and insights
5. **Alerts** → Proactive notifications
6. **Support** → Resources and guidance
7. **Bereavement** → Grief support after loss

---

**This is your complete, comprehensive hospice care management platform with all 17 pages and full functionality!**
