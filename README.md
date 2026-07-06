(# PROJECT AURA 🌅
## AI-Powered Palliative Care Support Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**A comprehensive, INTELLIGENT palliative care platform for the Ghanaian healthcare context** — with proactive monitoring, disease-specific intelligence, and personalized care.

> **🤖 INTELLIGENT CARE SYSTEM (June 2026):** FULLY OPERATIONAL! 🎉  
> **Backend:** 100% ✅ | **Frontend:** 100% ✅ | **AI Intelligence:** 100% ✅ | **Proactive Monitoring:** ✅ | **Real-Time Alerts:** ✅  
> **🚀 Ready to Deploy:** Intelligent, proactive, and personalized!  
> **📖 Latest:** `FULL_INTELLIGENT_SYSTEM_COMPLETE.md` | `INTELLIGENT_CARE_PHASE1_COMPLETE.md`

---

## 🎯 Project Overview

Project Aura is a final-year university project that combines **Explainable AI**, **real-time monitoring**, and **bereavement support** into a single, compassionate platform designed specifically for Ghanaian palliative care.

### Key Features

🤖 **INTELLIGENT AI System (NEW!)**
- **Disease-Specific Intelligence:** 8 condition profiles (Cancer, Heart Failure, COPD, Dementia, Kidney, Liver, Stroke, Generic)
- **Proactive Monitoring:** Background analysis every 5 minutes automatically
- **Real-Time Alerts:** 30-second polling with toast notifications
- **Personalized Recommendations:** Based on diagnosis + questionnaire preferences
- **Adaptive Care Guides:** Content filtered by disease with clinical protocols
- **Smart Thresholds:** Different alert levels per condition (e.g., cancer fever = CRITICAL)
- **🧠 Intelligent Caregiver System:** AI-powered workload balancing, patient-caregiver matching, capacity planning
- **📊 Team Analytics:** Real-time workload metrics with AI recommendations
- **🎯 Smart Matching:** Top 5 caregiver recommendations with scores and reasons
- **⚖️ Workload Scoring:** Automatic capacity status (AVAILABLE/FULL/OVERLOADED)

📋 **Clinical Assessment System (LATEST! ✨)**
- **7 Validated Assessment Tools:** All evidence-based from NIH/medical journals
- **ESAS:** 9-symptom daily tracking (pain, tiredness, wellbeing, etc.)
- **PPS:** Functional status assessment (0-100%)
- **PHQ-9 & GAD-7:** Depression and anxiety screening with crisis detection
- **Barthel Index:** Activities of daily living (10 ADL items)
- **MMSE/MoCA:** Cognitive function testing (dual test support)
- **Brief Pain Inventory:** Comprehensive pain evaluation (severity + interference)
- **23 API Endpoints:** Complete CRUD operations for all assessments
- **Automatic AI Alerts:** Smart thresholds generate alerts for decline/crisis
- **Previous Score Comparison:** Shows improvement/decline trends automatically
- **Crisis Detection:** Suicide risk detection with emergency UI
- **📴 Offline Capability:** Work without internet, auto-sync when connected (NEW!)
- **🎤 Voice-to-Text Input:** Speak instead of typing for faster data entry (NEW!)

🧠 **AI-Powered Predictions**
- XGBoost classifier for care pathway recommendations
- SHAP explainability for transparent decision-making
- What-If simulator for intervention planning
- Continuous patient analysis with immediate actions

📊 **Real-Time Monitoring**
- Vital signs tracking with trend analysis
- Symptom logging and pain management
- Intelligent alert system with crisis detection
- Disease-specific thresholds and monitoring schedules

💜 **Continuity Bridge**
- Bereavement support for families
- Memory vault for preserving patient memories
- Grief journal with compassionate prompts
- Ghana-specific support resources (40+ resources)

👥 **Role-Based Access Control**
- 5 distinct user roles: Admin, Clinician, Caregiver, Patient, Family
- Granular permission system
- Role-specific dashboards
- Patient self-access permissions working perfectly

🎨 **Modern UI/UX Design**
- Teal/cyan healthcare color palette with gradients
- 3px deep borders throughout for clarity
- Professional shadows and smooth animations
- Responsive design with mobile support
- Click-outside-to-close modals and dropdowns

---

## 🚀 Quick Start

### One-Click Startup
Double-click: **`START_PROJECT_AURA.bat`**

This starts both servers automatically!

### Manual Startup

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access:**
- 🌐 Frontend: http://localhost:5173
- 🔌 Backend API: http://localhost:8000
- 📚 API Docs: http://localhost:8000/docs

---

## 👤 Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| **Clinician** | clinician | clinician123 |
| **Patient** | patient | patient123 |
| **Family** | family | family123 |
| **Caregiver** | caregiver | caregiver123 |
| **Admin** | admin | admin123 |

---

## 🎬 Demo Flow for Panel Defense

1. **Login as Clinician** → Show dashboard with real data
2. **AI Insights** → Display SHAP waterfall chart
3. **What-If Simulator** → Adjust pain level, watch risk drop
4. **Alerts** → Show crisis pulse animation
5. **Logout → Login as Family** → Continuity Bridge
6. **Memory Vault** → Ghana-specific resources

---

## 🏗️ Tech Stack

**Backend:**
- FastAPI + Uvicorn
- SQLAlchemy + SQLite
- XGBoost + SHAP
- JWT Authentication

**Frontend:**
- React 18 + Vite
- Tailwind CSS v3
- Framer Motion
- React Query
- Recharts

---

## 📊 Project Status

✅ **100% COMPLETE - DEFENSE READY**

All 5 objectives achieved:
1. ✅ AI-Powered Predictions
2. ✅ Explainable AI (SHAP)
3. ✅ Real-Time Monitoring
4. ✅ Bereavement Support
5. ✅ Role-Based Access Control

---

## 📚 Documentation

**Latest Updates (June 2026):**
- **OFFLINE_AND_VOICE_FEATURES.md** - ✅ Offline capability + voice input (NEW!)
- **PHASE2_COMPLETE_ALL_NEW_FORMS.md** - Assessment System Phase 2 complete (7 tools)
- **ASSESSMENT_SYSTEM_COMPLETE.md** - Complete clinical assessment system overview
- **START_TESTING_PHASE2.md** - Quick guide to test new assessment forms
- **ALL_ERRORS_FIXED.md** - Complete fix summary (401/403 errors resolved)
- **AI_CHATBOT_COMPLETE.md** - Super AI assistant with thinking process

**Project Completion:**
- **PROJECT_COMPLETE.md** - Full project guide
- **FORM_VALIDATION_COMPLETE.md** - Validation details
- **LOGIN_INFO.md** - Credentials reference

**Feature Documentation:**
- **UI_UX_UPGRADE_COMPLETE.md** - Modern design system
- **NAVIGATION_LAYOUT_IMPROVED.md** - Navigation enhancements
- **REGISTRATION_QUESTIONNAIRE_FIXED.md** - Registration flow
- **RESOURCES_AND_MYSPACE_FIXED.md** - Resources & portal fixes

---

## 🎓 Academic Info

**University of Ghana**  
Final Year Project 2026  
Computer Science Department

---

## 🔧 Troubleshooting

**Login issues?**
```bash
python fix_database.py
```

**Backend won't start?**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend won't start?**
```bash
cd frontend
npm install
```

**Seeing 401/403 errors?**
1. Clear browser cache (Ctrl + Shift + Delete)
2. Logout and login again to refresh token
3. Verify backend is running on port 8000
4. Check console: `localStorage.getItem('auth_token')` should exist

**Resources not loading?**
```bash
cd backend
python seed_resources.py
```

**Need fresh database?**
```bash
cd backend
del aura.db
python -m uvicorn main:app --reload
# Database will be recreated with seed data
```

---

**Built with ❤️ for compassionate care in Ghana**
