# Project Aura - Complete System Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Installation](#installation)
5. [Usage Guide](#usage-guide)
6. [API Reference](#api-reference)
7. [Testing](#testing)
8. [Deployment](#deployment)

---

## System Overview

### What is Project Aura?

Project Aura is a comprehensive, AI-powered hospice care management platform that provides:

- **Intelligent Care Recommendations** using explainable AI
- **Real-time Patient Monitoring** with proactive alerts
- **Comprehensive Care Management** across 17 specialized modules
- **Advanced Analytics** for trend analysis and predictions
- **Complete Audit Trail** for compliance and security
- **Multi-channel Notifications** for care team coordination
- **Bereavement Support** extending care beyond patient passing

### Four-Pillar Architecture

#### Pillar 1: Intelligent Core (XAI Engine)
- XGBoost-based machine learning models
- SHAP explanations for transparency
- Pain prediction and risk assessment
- Care pathway recommendations
- Symptom forecasting

#### Pillar 2: Safety Layer
- Structured Support Hub with curated resources
- Bereavement Bridge for grief support
- No open-ended AI to prevent harmful content
- Vetted information only

#### Pillar 3: Human Bridge (Care Dashboard)
- 17 specialized pages
- Role-based access control
- Real-time data visualization
- Proactive alert system
- Empathetic UI design

#### Pillar 4: Validation Engine
- Synthetic data generation using SDV
- Clinical scenario simulation
- End-to-end testing
- System validation

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    WEB APPLICATION                           │
│                   (Streamlit Frontend)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Core Modules:                                               │
│  • XAI Engine (xai.py)                                      │
│  • Analytics Engine (analytics.py)                          │
│  • Reporting System (reporting.py)                          │
│  • Audit Logger (audit.py)                                  │
│  • Notification Manager (notifications.py)                  │
│  • Database Layer (db.py)                                   │
│  • Simulator (simulator.py)                                 │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                    DATABASE LAYER                            │
│                   (SQLite + SQLAlchemy)                      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: Streamlit 1.28+
- **Backend**: Python 3.10+
- **Database**: SQLite with SQLAlchemy ORM
- **ML/AI**: XGBoost, SHAP, scikit-learn
- **Data**: Pandas, NumPy, SDV
- **Testing**: Pytest, Hypothesis
- **Visualization**: Plotly, Matplotlib

---

## Components

### 1. XAI Engine (`src/xai.py`)

**Purpose**: Explainable AI for care recommendations

**Key Functions**:
- `predict_pain_level()` - Predict future pain levels
- `assess_deterioration_risk()` - Calculate risk scores
- `predict_symptoms()` - Forecast symptom likelihood
- `generate_care_pathway()` - Recommend care pathways
- `explain_prediction()` - Generate SHAP-style explanations

**Example Usage**:
```python
from src.xai import get_xai_engine

xai = get_xai_engine()
patient_data = {
    'pain_level': 7,
    'heart_rate': 95,
    'oxygen_saturation': 92
}

# Get care pathway recommendation
pathway = xai.generate_care_pathway(patient_data)
print(f"Recommended pathway: {pathway['pathway']}")
print(f"Priority: {pathway['priority']}")

# Get explanation
explanation = xai.explain_prediction(patient_data, 'care_pathway')
print(f"Top factors: {explanation['top_features']}")
```

### 2. Analytics Engine (`src/analytics.py`)

**Purpose**: Advanced data analysis and insights

**Key Functions**:
- `analyze_pain_trends()` - Trend analysis with statistics
- `analyze_symptom_correlations()` - Find symptom relationships
- `predict_deterioration_window()` - Predict risk timeline
- `analyze_medication_effectiveness()` - Medication analysis
- `calculate_quality_indicators()` - Quality metrics

**Example Usage**:
```python
from src.analytics import get_analytics_engine

analytics = get_analytics_engine(db_connection)

# Analyze pain trends
trends = analytics.analyze_pain_trends('PATIENT001', days=30)
print(f"Pain trend: {trends['trend']['direction']}")
print(f"Recommendations: {trends['recommendations']}")

# Calculate quality indicators
quality = analytics.calculate_quality_indicators(start_date, end_date)
print(f"Overall quality score: {quality['overall_quality_score']}")
```

### 3. Reporting System (`src/reporting.py`)

**Purpose**: Generate comprehensive reports

**Key Functions**:
- `generate_patient_summary()` - Patient summary report
- `generate_care_team_report()` - Team performance metrics
- `generate_quality_metrics_report()` - Quality indicators
- `generate_financial_report()` - Financial summary
- `generate_compliance_report()` - Regulatory compliance

**Example Usage**:
```python
from src.reporting import get_report_generator

reporting = get_report_generator(db_connection)

# Generate patient summary
summary = reporting.generate_patient_summary('PATIENT001')

# Generate care team report
team_report = reporting.generate_care_team_report(start_date, end_date)

# Export to JSON
reporting.export_report_to_json(team_report, 'report.json')
```

### 4. Audit Logger (`src/audit.py`)

**Purpose**: Comprehensive audit logging and compliance

**Key Functions**:
- `log_event()` - Log any audit event
- `log_data_access()` - Log data access
- `log_medication_administration()` - Log medication events
- `log_ai_prediction()` - Log AI predictions
- `generate_compliance_report()` - Compliance metrics

**Example Usage**:
```python
from src.audit import get_audit_logger, AuditEventType, AuditSeverity

audit = get_audit_logger(db_connection)

# Log data access
audit.log_data_access(
    user_id='nurse_001',
    patient_id='PATIENT001',
    data_type='vitals',
    action='view'
)

# Log medication administration
audit.log_medication_administration(
    user_id='nurse_001',
    patient_id='PATIENT001',
    medication='Morphine',
    dosage='10mg'
)

# Generate compliance report
compliance = audit.generate_compliance_report(start_date, end_date)
print(f"Compliance score: {compliance['compliance_score']}")
```

### 5. Notification Manager (`src/notifications.py`)

**Purpose**: Multi-channel notification system

**Key Functions**:
- `send_notification()` - Send multi-channel notification
- `send_alert_notification()` - Send alert to care team
- `send_medication_reminder()` - Medication reminders
- `send_appointment_reminder()` - Appointment reminders
- `send_care_plan_update()` - Care plan notifications

**Example Usage**:
```python
from src.notifications import get_notification_manager, NotificationChannel, NotificationPriority

notif = get_notification_manager(db_connection)

# Send alert
notif.send_alert_notification(
    patient_id='PATIENT001',
    alert_type='High Pain',
    severity='high',
    details='Pain level 8/10 reported'
)

# Send medication reminder
notif.send_medication_reminder(
    patient_id='PATIENT001',
    medication='Morphine',
    dosage='10mg',
    time=scheduled_time
)
```

---

## Installation

### Quick Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd HCARE

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Run comprehensive setup
python scripts/comprehensive_setup.py
```

### Manual Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Initialize database
python -c "from src import db; db.get_db()"

# 3. Create demo data
python demo_system.py

# 4. Run tests
pytest tests/ -v
```

### Verify Installation

```bash
python verify_installation.py
```

---

## Usage Guide

### Starting the Application

```bash
streamlit run app.py
```

Access at: http://localhost:8501

### Default Login Credentials

- **Admin**: admin / admin123
- **Doctor**: doctor / doctor123
- **Family**: family / family123

### Page Navigation

1. **Login** - User authentication
2. **Dashboard** - Overview and key metrics
3. **Log Data** - Record vitals and symptoms
4. **View Trends** - Visualize patient data
5. **AI Insights** - XAI predictions and explanations
6. **Alerts** - Alert management
7. **Support Hub** - Resources and support
8. **Bereavement Bridge** - Grief support
9. **Patient Onboarding** - New patient registration
10. **Clinical Simulation** - Training scenarios
11. **Medication Management** - Medication tracking
12. **Appointment Scheduling** - Schedule management
13. **Caregiver Portal** - Caregiver resources
14. **Memory Vault** - Memory preservation
15. **Journal** - Patient journaling
16. **Care Plan** - Care plan management
17. **Functional Status** - Functional assessments

### Common Workflows

#### Workflow 1: New Patient Admission

1. Navigate to **Patient Onboarding**
2. Complete all 6 steps:
   - Basic Information
   - Medical Information
   - Care Preferences
   - Family & Support
   - Initial Assessment
   - Review & Submit
3. System generates patient ID
4. Care team is notified

#### Workflow 2: Daily Monitoring

1. Navigate to **Log Data**
2. Select patient
3. Record vitals and symptoms
4. System analyzes data
5. Alerts generated if needed
6. View trends in **View Trends**

#### Workflow 3: AI-Assisted Care Planning

1. Navigate to **AI Insights**
2. Select patient
3. Review predictions:
   - Pain level forecast
   - Risk assessment
   - Symptom likelihood
4. Review AI recommendations
5. Update care plan accordingly

#### Workflow 4: Alert Management

1. Navigate to **Alerts**
2. Review active alerts
3. Acknowledge or resolve
4. Add notes if needed
5. Assign to team members

---

## API Reference

### XAI Engine API

```python
# Initialize
from src.xai import get_xai_engine
xai = get_xai_engine()

# Predict pain
pain_pred = xai.predict_pain_level(patient_data)
# Returns: {'predicted_pain': float, 'confidence': float, 'trend': str, 'recommendation': str}

# Assess risk
risk = xai.assess_deterioration_risk(patient_data)
# Returns: {'risk_score': float, 'risk_level': str, 'color': str, 'risk_factors': list, 'recommendations': list}

# Generate care pathway
pathway = xai.generate_care_pathway(patient_data)
# Returns: {'pathway': str, 'priority': str, 'actions': list, 'confidence': float}

# Explain prediction
explanation = xai.explain_prediction(patient_data, 'care_pathway')
# Returns: {'feature_importance': dict, 'top_features': list, 'explanation_text': str}
```

### Analytics Engine API

```python
# Initialize
from src.analytics import get_analytics_engine
analytics = get_analytics_engine(db_connection)

# Analyze pain trends
trends = analytics.analyze_pain_trends(patient_id, days=30)
# Returns: {'statistics': dict, 'trend': dict, 'variability': str, 'patterns': list, 'recommendations': list}

# Analyze correlations
correlations = analytics.analyze_symptom_correlations(patient_id, days=30)
# Returns: {'correlation_matrix': dict, 'strong_correlations': list, 'insights': list}

# Predict deterioration
prediction = analytics.predict_deterioration_window(patient_id)
# Returns: {'risk_score': float, 'predicted_window': str, 'urgency': str, 'contributing_factors': list}

# Quality indicators
quality = analytics.calculate_quality_indicators(start_date, end_date)
# Returns: {'pain_management': dict, 'symptom_management': dict, 'patient_safety': dict, 'overall_quality_score': float}
```

---

## Testing

### Run All Tests

```bash
# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_comprehensive_integration.py -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html
```

### Test Categories

1. **Unit Tests** - Individual component testing
2. **Integration Tests** - Component interaction testing
3. **Property Tests** - Hypothesis-based testing
4. **End-to-End Tests** - Complete workflow testing

### Example Test

```python
def test_xai_prediction():
    xai = get_xai_engine()
    patient_data = {'pain_level': 7, 'heart_rate': 95}
    
    result = xai.predict_pain_level(patient_data)
    
    assert 'predicted_pain' in result
    assert 0 <= result['predicted_pain'] <= 10
    assert 0 <= result['confidence'] <= 1
```

---

## Deployment

### Production Deployment

1. **Environment Setup**
```bash
# Set production environment variables
export DATABASE_URL=postgresql://...
export SECRET_KEY=<secure-key>
export DEBUG=False
```

2. **Database Migration**
```bash
python scripts/migrate_database.py
```

3. **Start Application**
```bash
streamlit run app.py --server.port=8501 --server.address=0.0.0.0
```

### Docker Deployment

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8501

CMD ["streamlit", "run", "app.py"]
```

### Security Considerations

- Use environment variables for sensitive data
- Enable HTTPS in production
- Implement rate limiting
- Regular security audits
- Keep dependencies updated
- Use strong authentication
- Enable audit logging
- Regular backups

---

## Support and Maintenance

### Logs

- Application logs: `logs/app.log`
- Audit logs: `logs/audit.log`
- Error logs: `logs/error.log`

### Backup

```bash
# Backup database
python scripts/backup_database.py

# Backup configuration
python scripts/backup_config.py
```

### Monitoring

- Check system health: `python scripts/health_check.py`
- View metrics: Navigate to Dashboard
- Review audit logs: `python scripts/view_audit_log.py`

### Troubleshooting

**Issue**: Application won't start
- Check Python version (3.8+)
- Verify dependencies installed
- Check database connection
- Review error logs

**Issue**: Database errors
- Run database migration
- Check file permissions
- Verify SQLite installation

**Issue**: Import errors
- Verify PYTHONPATH
- Check module installation
- Review requirements.txt

---

## License

This project is for educational and demonstration purposes.

## Contributors

Project Aura Development Team

## Version

Current Version: 2.0.0
Last Updated: 2024

---

**For additional support, consult the following documents:**
- USER_GUIDE.md - End user documentation
- QUICK_START_GUIDE.md - Quick start instructions
- SETUP_COMPLETE.md - Post-setup information
- API documentation in source code
