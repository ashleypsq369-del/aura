# Project Aura

An AI-powered framework for continuity of care in hospice settings.

## Overview

Project Aura provides an integrated, explainable, ethical AI platform that serves patients, families, and clinicians throughout the entire care continuum—from diagnosis through end-of-life care and into bereavement support.

## Key Features

### Core Platform
- **Explainable AI Engine**: Transparent care recommendations with SHAP visualizations
- **Integrated Care Dashboard**: Unified interface for logging, trends, and alerts
- **Proactive Alert System**: Background monitoring with email notifications
- **Structured Support Hub**: Safe, menu-driven symptom logging and resources
- **Bereavement Bridge**: Post-death support with grief journaling and resources
- **Synthetic Data**: Privacy-first approach using SDV-generated data only

### 🆕 Enhanced Features (2026 Upgrade)
- **Sentiment Analysis**: VADER + TextBlob analysis with grief stage detection (inspired by nanaBEREAVEMENT)
- **Conversational Support**: Structured, safe AI conversations with crisis detection (inspired by Wysa)
- **Professional Dashboard Components**: KPI cards, alerts, timelines, progress rings (inspired by MatrixCare/Alora)
- **Comprehensive Design System**: Colors, typography, spacing, animations for consistent UX
- **Platform Resources**: Industry best practices, workflows, and templates from leading hospice platforms

## Technology Stack

- **Frontend**: Streamlit 1.28+, Streamlit-Extras
- **Backend**: Python 3.10+
- **Database**: SQLite with SQLAlchemy ORM
- **ML/AI**: XGBoost, SHAP, LightGBM, CatBoost
- **NLP**: NLTK, TextBlob, VADER Sentiment
- **Data Generation**: SDV (Synthetic Data Vault), Faker
- **Security**: Cryptography, Bcrypt
- **Testing**: Pytest, Hypothesis
- **Monitoring**: Loguru

## Setup Instructions

### Prerequisites

- Python 3.10 or higher
- pip package manager
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd HCARE
```

2. Create and activate virtual environment:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your SendGrid API key
```

5. Initialize database and generate synthetic data:
```bash
python setup.py
```

6. Run the application:
```bash
streamlit run app.py
```

## Project Structure

```
HCARE/
├── src/                           # Source code
│   ├── db.py                     # Database layer
│   ├── xai.py                    # XAI Engine
│   ├── alerts.py                 # Alert System
│   ├── sentiment_analyzer.py    # 🆕 Sentiment analysis (nanaBEREAVEMENT inspired)
│   ├── conversational_support.py # 🆕 Structured conversations (Wysa inspired)
│   ├── dashboard_components.py   # 🆕 Professional UI components (MatrixCare/Alora)
│   └── simulator.py              # Scenario Simulator
├── assets/                        # Design assets
│   └── design_system.py          # 🆕 Comprehensive design system
├── data/                          # Data files and resources
│   └── platform_resources.json   # 🆕 Industry best practices
├── docs/                          # Documentation
│   └── PLATFORM_COMPARISON.md    # 🆕 Competitive analysis
├── pages/                         # Streamlit pages
├── tests/                         # Test suite
├── logs/                          # Application logs
├── models/                        # Trained ML models
├── app.py                        # Main Streamlit application
├── requirements.txt              # Python dependencies
└── UPGRADE_COMPLETE.md           # 🆕 Upgrade documentation
```

## Usage

### For Clinicians

1. Log in with clinician credentials
2. View patient dashboard with AI insights
3. Monitor alerts and trends
4. Access full patient data and recommendations

### For Family Members

1. Log in with family credentials
2. Log symptoms and vitals
3. Access support resources
4. View patient trends (restricted access)
5. Access bereavement support after patient death

## Testing

Run the test suite:
```bash
# All tests
pytest tests/ -v

# Unit tests only
pytest tests/test_*.py -v

# Property-based tests
pytest tests/test_properties.py -v --hypothesis-show-statistics

# With coverage
pytest --cov=src --cov-report=html
```

## Ethical Considerations

- **Privacy**: All data is synthetic (SDV-generated), no real patient information
- **Transparency**: SHAP explanations for all AI recommendations
- **Bias Mitigation**: Diverse synthetic data generation
- **Safety**: Structured interactions, no open-ended AI generation

## Documentation

- [Architecture](docs/architecture.md)
- [Ethics](docs/ethics.md)
- [User Guide](docs/user_guide.md)
- [Developer Guide](docs/developer_guide.md)

## License

[To be determined]

## Contact

[To be determined]
