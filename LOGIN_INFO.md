# Project Aura - Login Information

## Application URLs

**Frontend (React):** http://localhost:5173/  
**Backend API:** http://localhost:8000/  
**API Documentation:** http://localhost:8000/docs

## Demo User Credentials

### Clinician Account
- **Username:** `clinician`
- **Password:** `clinician123`
- **Role:** Clinician
- **Email:** clinician@aura.com
- **Access:** Full patient monitoring, AI insights, care management

### Patient Account
- **Username:** `patient`
- **Password:** `patient123`
- **Role:** Patient
- **Email:** patient@aura.com
- **Access:** Own health data, symptom logging

### Family Account
- **Username:** `family`
- **Password:** `family123`
- **Role:** Family
- **Email:** family@aura.com
- **Access:** Patient data (if authorized), bereavement support

### Caregiver Account
- **Username:** `caregiver`
- **Password:** `caregiver123`
- **Role:** Caregiver
- **Email:** caregiver@aura.com
- **Access:** Care coordination, patient support

### Admin Account
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Admin
- **Email:** admin@aura.com
- **Access:** System administration, user management

## Quick Start

1. **Start the Backend:**
   ```cmd
   START_BACKEND.bat
   ```
   Or manually:
   ```cmd
   cd backend
   python -m uvicorn main:app --reload --port 8000
   ```

2. **Start the Frontend:**
   ```cmd
   START_FRONTEND.bat
   ```
   Or manually:
   ```cmd
   cd frontend
   npm run dev
   ```

3. **Access the Application:**
   - Open your browser to http://localhost:5173/
   - Use any of the demo credentials above to log in

## Troubleshooting

### Login Failed Issue
If you encounter login errors, the database schema was fixed by:
- Mapping the SQLAlchemy User model to use the correct column names (`password` instead of `password_hash`)
- Ensuring the authentication function queries the right fields

### Database Issues
If you need to reset or check the database:
```cmd
python fix_database.py
```

This script will:
- Check the database structure
- Create missing tables
- Add demo users if needed

### Backend Not Starting
Make sure you have all dependencies installed:
```cmd
cd backend
pip install -r requirements.txt
```

### Frontend Not Starting
Make sure you have Node.js installed and dependencies are up to date:
```cmd
cd frontend
npm install
```

## Features by Role

### Clinician Features
- Patient Dashboard
- Vital Signs Monitoring
- Symptom Tracking
- AI-Powered Insights (XGBoost + SHAP)
- Care Pathway Predictions
- Alert Management
- Medication Management
- Appointment Scheduling

### Patient Features
- Personal Health Dashboard
- Symptom Logging
- Medication Reminders
- Appointment View
- Care Guide Access

### Family Features
- Patient Monitoring (authorized access)
- Bereavement Support
- Memory Vault
- Continuity Bridge
- Journal/Grief Support

### Admin Features
- User Management
- System Configuration
- Analytics Dashboard
- Audit Logs

## Important Notes

- All demo accounts use simple passwords for development purposes
- In production, use strong passwords and enable proper authentication
- The database is SQLite for development (aura.db)
- Consider switching to PostgreSQL for production use
- JWT tokens are used for API authentication
- Tokens are stored in localStorage on the frontend

## Support

For issues or questions:
1. Check the console logs (backend terminal and browser console)
2. Review the BUILD_SUMMARY.md for system architecture
3. Check API documentation at http://localhost:8000/docs
