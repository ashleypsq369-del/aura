# Project Aura - Quick Start Guide

## Installation

1. **Install Python 3.10+**
   Ensure you have Python 3.10 or higher installed.

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run Setup**
   ```bash
   python setup.py
   ```
   
   This will:
   - Initialize the database
   - Create demo users
   - Generate synthetic patients
   - Train AI models
   - Run initial simulation

## Running the Application

```bash
streamlit run app.py
```

The application will open in your browser at `http://localhost:8501`

## Demo Credentials

- **Clinician Account**
  - Username: `clinician`
  - Password: `demo123`

- **Family Account**
  - Username: `family`
  - Password: `demo123`

## Features

### For Clinicians
- View all patients and their status
- Log vitals and symptoms
- View AI-powered care recommendations with SHAP explanations
- Monitor alerts and trends
- Access full patient data

### For Family Members
- Log symptoms for their loved one
- View patient trends (restricted access)
- Access support resources
- Use bereavement support after patient death

## Project Structure

```
HCARE/
├── src/                    # Backend modules
│   ├── db.py              # Database layer
│   ├── models.py          # XAI Engine
│   ├── alerts.py          # Alert System
│   ├── chat.py            # Support Hub
│   ├── bereavement.py     # Bereavement Bridge
│   └── simulator.py       # Scenario Simulator
├── pages/                  # Streamlit pages
│   ├── 1_Login.py
│   ├── 2_Dashboard.py
│   ├── 3_Log_Data.py
│   ├── 4_AI_Insights.py
│   └── 5_Alerts.py
├── data/                   # Resource files
├── models/                 # Trained ML models
├── app.py                 # Main application
├── setup.py               # Setup script
└── requirements.txt       # Dependencies
```

## Troubleshooting

### Models Not Found
If you see "Models not found" errors:
```bash
python setup.py
```

### Database Errors
Delete the database and reinitialize:
```bash
del aura.db  # Windows
rm aura.db   # Linux/Mac
python setup.py
```

### Import Errors
Ensure all dependencies are installed:
```bash
pip install -r requirements.txt
```

## Next Steps

1. Explore the dashboard and patient data
2. Log some vitals and symptoms
3. Generate AI recommendations
4. Check the alerts system
5. Review the synthetic data indicators

## Important Notes

- **All data is synthetic** - Generated for demonstration only
- **No real patient information** - Privacy-first design
- **Explainable AI** - SHAP visualizations show reasoning
- **Prototype system** - For demonstration and research purposes

## Support

For issues or questions, refer to the full documentation in the `docs/` directory.
