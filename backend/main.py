"""
Project Aura - FastAPI Backend
Complete KIRO Specification Implementation
"""

import warnings
import os

# Suppress version mismatch warnings for serialized models
warnings.filterwarnings("ignore", category=UserWarning, module="xgboost")
warnings.filterwarnings("ignore", message=".*InconsistentVersionWarning.*")
warnings.filterwarnings("ignore", message=".*unpickle estimator.*")
warnings.filterwarnings("ignore", message=".*If you are loading a serialized model.*")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import asyncio

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from services.rate_limiter import limiter

# Import all routers
from routers import (
    auth,
    patients,
    vitals,
    symptoms,
    ai,
    ai_analysis,
    comprehensive_ai,  # NEW: Comprehensive AI with SHAP
    intelligent_care,
    caregiver_intelligence,
    clinical_assessments,
    alerts,
    notifications,
    medications,
    appointments,
    bereavement,
    dashboard,
    caregivers,
    care_plans,
    chatbot,
    conversational_chatbot,  # Conversational AI ChatBot (legacy)
    llm_chatbot,             # NEW: True LLM ChatBot (Gemini / Groq)
    profile,
    admin,
    preferences,
    resources,
    community,
    portal,
    journey,
    messaging,
    contacts,
    legacy,  # Digital legacy & heir management
    uploads,  # File uploads
    hipaa,  # HIPAA Compliance (Gap Analysis Priority 2)
    hci,  # HCI & ChatBot Safety (Gap Analysis Priority 3)
    ethics,  # Biomedical Ethics (Gap Analysis Priority 4)
    medical_knowledge,  # Medical Knowledge Database
    care_settings,      # 5 Palliative Care Delivery Settings
    palliative_care,    # ACP, MDT Meetings, Referrals, Chaplaincy
)
from routers import consent  # Patient family data-sharing consent

# New ML predictions router (trained XGBoost + real SHAP)
from routers import ml_predictions
# Advanced ML router (P6-P11)
from routers import advanced_ml
# WebSocket real-time router
from routers import websocket as ws_router

# Initialize FastAPI app
app = FastAPI(
    title="Project Aura API",
    version="1.0.0",
    description="AI-Powered Palliative Care Support Platform for Ghana"
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS Configuration — locked to known origins; set ALLOWED_ORIGINS env var to extend
_ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173"
).split(",")

# Always include the standalone app origin (pywebview loads from 127.0.0.1:8000)
_standalone_origins = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "null",   # pywebview on some platforms sends Origin: null
]
for _o in _standalone_origins:
    if _o not in _ALLOWED_ORIGINS:
        _ALLOWED_ORIGINS.append(_o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

# Serve static files (PDFs, uploads)
_static_dir = Path(__file__).parent / "static"
_static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(_static_dir)), name="static")

# NOTE: Full dist static file mounting is done at the BOTTOM of this file
# (after all API routers) via dedicated sub-directory mounts + SPA fallback.
# Do NOT add partial /assets or /icons mounts here — they are handled below.

# Global exception handler — ensures CORS headers even on 500 errors
from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "")
    cors_origin = origin if origin in _ALLOWED_ORIGINS else (_ALLOWED_ORIGINS[0] if _ALLOWED_ORIGINS else "")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": cors_origin,
            "Access-Control-Allow-Credentials": "true",
        }
    )


# Security headers middleware
@app.middleware("http")
async def security_headers(request: Request, call_next):
    # Skip for WebSocket upgrade requests — middleware breaks WS handshake
    if request.headers.get("upgrade", "").lower() == "websocket":
        return await call_next(request)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

# Include all routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(patients.router, prefix="/api/patients", tags=["patients"])
app.include_router(vitals.router, prefix="/api/vitals", tags=["vitals"])
app.include_router(symptoms.router, prefix="/api/symptoms", tags=["symptoms"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(ai_analysis.router, prefix="/api/ai-analysis", tags=["ai-analysis"])
app.include_router(comprehensive_ai.router, prefix="/api/comprehensive-ai", tags=["comprehensive-ai"])  # NEW: Comprehensive AI with SHAP
app.include_router(intelligent_care.router, prefix="/api/intelligent-care", tags=["intelligent-care"])
app.include_router(caregiver_intelligence.router)  # Prefix already in router
app.include_router(clinical_assessments.router)  # Clinical assessments - NEW
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])
app.include_router(notifications.router)  # Notifications - prefix already in router
app.include_router(medications.router, prefix="/api/medications", tags=["medications"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["appointments"])
app.include_router(bereavement.router, prefix="/api/bereavement", tags=["bereavement"])
app.include_router(legacy.router, prefix="/api/legacy", tags=["legacy"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(caregivers.router, prefix="/api/caregivers", tags=["caregivers"])
app.include_router(care_plans.router, prefix="/api/care-plans", tags=["care-plans"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["chatbot"])  # AIAssistant - navigation & data
app.include_router(conversational_chatbot.router, prefix="/api/conversational-chatbot", tags=["conversational-chatbot"])  # ChatBot - legacy AI
app.include_router(llm_chatbot.router, prefix="/api/llm-chatbot", tags=["llm-chatbot"])  # NEW: True LLM (Gemini/Groq)
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(preferences.router, prefix="/api/preferences", tags=["preferences"])
app.include_router(resources.router, prefix="/api/resources", tags=["resources"])
app.include_router(community.router, prefix="/api/community", tags=["community"])
app.include_router(journey.router, prefix="/api/journey", tags=["journey"])
app.include_router(portal.router, prefix="/api", tags=["portal"])
app.include_router(messaging.router, prefix="/api/messaging", tags=["messaging"])
app.include_router(contacts.router, prefix="/api/contacts", tags=["contacts"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])
app.include_router(hipaa.router, prefix="/api/hipaa", tags=["hipaa"])  # HIPAA Compliance (Priority 2)
app.include_router(hci.router, prefix="/api/hci", tags=["hci"])  # HCI & ChatBot Safety (Priority 3)
app.include_router(ethics.router, prefix="/api/ethics", tags=["ethics"])  # Biomedical Ethics (Priority 4)
app.include_router(medical_knowledge.router, prefix="/api/medical", tags=["medical-knowledge"])
app.include_router(care_settings.router, prefix="/api/care-settings", tags=["care-settings"])
app.include_router(palliative_care.router, prefix="/api/palliative", tags=["palliative-care"])
app.include_router(consent.router)
app.include_router(ml_predictions.router, prefix="/api/ml", tags=["ml-predictions"])
app.include_router(advanced_ml.router, prefix="/api/advanced-ml", tags=["advanced-ml"])

# Feature gates: per-user feature overrides + user access requests + admin control
from routers import feature_gates
app.include_router(feature_gates.router, prefix="/api/features", tags=["feature-gates"])

# Clinical & operational reporting system
from routers import reports
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

# Care task compliance tracking & reminders
from routers import compliance
app.include_router(compliance.router, prefix="/api/compliance", tags=["compliance"])

# WebSocket — no prefix, handles its own /ws/{user_id} path
app.include_router(ws_router.router, tags=["websocket"])


@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    from src.db import init_database, get_session, User, Patient, Alert
    
    print("\n" + "="*60)
    print("PROJECT AURA - STARTING UP")
    print("="*60)
    
    # Initialize database
    init_database()
    print("Database initialized")
    
    # Check if data exists
    db = get_session()
    user_count = db.query(User).count()
    patient_count = db.query(Patient).count()
    db.close()
    
    if user_count == 0:
        print("No users found - please run seed_database.py first")
    else:
        print(f"Found {user_count} users in database")
    
    if patient_count > 0:
        print(f"Found {patient_count} patients in database")

    # Seed care settings templates and interaction matrix
    try:
        from routers.care_settings import _seed_templates, _seed_interactions
        from src.db import CareSettingTemplate, CareSettingInteraction
        db2 = get_session()
        if db2.query(CareSettingTemplate).count() == 0:
            _seed_templates(db2)
            print("Care setting templates seeded (5 palliative care models)")
        if db2.query(CareSettingInteraction).count() == 0:
            _seed_interactions(db2)
            print("Care setting interaction matrix seeded")
        db2.close()
    except Exception as e:
        print(f"Care settings seed: {e}")
    
    # Check optional integrations
    import os
    print("Aura AI Engine: self-hosted, zero subscriptions")
    
    # Start proactive monitoring
    print("Starting proactive monitoring system...")
    asyncio.create_task(proactive_monitoring_loop())
    
    # Start notification monitoring
    print("Starting notification monitoring system...")
    asyncio.create_task(notification_monitoring_loop())

    # Start compliance scan loop (runs every 4 hours)
    print("Starting care task compliance scanner...")
    asyncio.create_task(compliance_scan_loop())
    
    print("\nProject Aura API Ready")
    print(f"API Docs: http://localhost:8000/docs")
    print(f"Frontend: http://localhost:5173")
    print("="*60 + "\n")


async def proactive_monitoring_loop():
    """Background task - continuously monitor all patients"""
    from src.db import SessionLocal, Patient, Alert
    from routers.intelligent_care import analyze_patient_proactively
    from datetime import datetime, timedelta
    
    print("Proactive monitoring loop started (every 5 minutes)")
    
    while True:
        try:
            await asyncio.sleep(300)  # Every 5 minutes
            
            db = SessionLocal()
            try:
                patients = db.query(Patient).filter(Patient.status != 'deceased').all()
                alerts_created = 0
                
                for patient in patients:
                    try:
                        alerts_data = analyze_patient_proactively(patient, db)
                        
                        for alert_data in alerts_data:
                            # Check for duplicates in last 24 hours (prevents flooding)
                            existing = db.query(Alert).filter(
                                Alert.patient_id == alert_data["patient_id"],
                                Alert.alert_type == alert_data["type"],
                                Alert.created_at > datetime.utcnow() - timedelta(hours=24),
                                Alert.is_acknowledged == False
                            ).first()
                            
                            if not existing:
                                new_alert = Alert(
                                    patient_id=alert_data["patient_id"],
                                    alert_type=alert_data["type"],
                                    severity=alert_data["severity"],
                                    message=alert_data["message"],
                                    triggered_value=f"{float(alert_data.get('value', 0)):.1f}" if alert_data.get("value") is not None else "",
                                    is_acknowledged=False
                                )
                                db.add(new_alert)
                                alerts_created += 1
                                
                                # Track high/critical alerts as journey events
                                if alert_data.get("severity") in ['high', 'critical']:
                                    from services.journey_tracker import track_critical_alert
                                    track_critical_alert(
                                        db=db,
                                        patient_id=alert_data["patient_id"],
                                        alert_type=alert_data["type"].replace('_', ' ').title(),
                                        severity=alert_data["severity"].title(),
                                        details=alert_data["message"]
                                    )
                    except Exception as e:
                        print(f"Error analyzing patient {patient.id}: {e}")
                        continue
                
                db.commit()
                
                if alerts_created > 0:
                    print(f"Proactive monitoring: Created {alerts_created} new alerts")

                # â"€â"€ ML-powered proactive risk scan â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
                try:
                    from routers.ml_predictions import _proactive_scan
                    from services.ml_model_service import ml_service
                    if ml_service.is_available():
                        await _proactive_scan(db)
                except Exception as ml_err:
                    print(f"ML proactive scan error: {ml_err}")

                # â"€â"€ Advanced ML: deterioration + drug interaction alerts â"€â"€
                try:
                    from services.advanced_ml_service import (
                        detect_longitudinal_deterioration,
                        detect_drug_interactions,
                    )
                    from src.db import Medication
                    adv_alerts = 0
                    for patient in patients[:20]:  # Cap at 20 to avoid overload
                        try:
                            # P7 deterioration alert
                            det = detect_longitudinal_deterioration(patient.id, db, window_days=14)
                            if det.get("level") in ("rapid", "moderate"):
                                existing = db.query(Alert).filter(
                                    Alert.patient_id == patient.id,
                                    Alert.alert_type == "deterioration_trend",
                                    Alert.created_at > datetime.utcnow() - timedelta(hours=6),
                                    Alert.is_acknowledged == False,
                                ).first()
                                if not existing:
                                    severity = "critical" if det["level"] == "rapid" else "high"
                                    db.add(Alert(
                                        patient_id=patient.id,
                                        alert_type="deterioration_trend",
                                        severity=severity,
                                        message=(
                                            f"ML Deterioration ({det['level'].upper()}): "
                                            f"Score {det['deterioration_score']:.0%}. "
                                            + (det["top_drivers"][0]["reason"] if det.get("top_drivers") else "")
                                        ),
                                        triggered_value=str(det["deterioration_score"]),
                                        is_acknowledged=False,
                                    ))
                                    adv_alerts += 1

                            # P9 drug interaction alert (SEVERE only)
                            meds = db.query(Medication).filter(
                                Medication.patient_id == patient.id,
                                Medication.is_active == True,
                            ).all()
                            med_list = [{"name": m.name} for m in meds if m.name]
                            if med_list:
                                interactions = detect_drug_interactions(med_list)
                                severe = [ix for ix in interactions if ix["severity"] == "SEVERE"]
                                if severe:
                                    existing = db.query(Alert).filter(
                                        Alert.patient_id == patient.id,
                                        Alert.alert_type == "drug_interaction",
                                        Alert.created_at > datetime.utcnow() - timedelta(hours=24),
                                        Alert.is_acknowledged == False,
                                    ).first()
                                    if not existing:
                                        db.add(Alert(
                                            patient_id=patient.id,
                                            alert_type="drug_interaction",
                                            severity="critical",
                                            message=(
                                                f"SEVERE drug interaction: "
                                                f"{severe[0]['drug_a']} + {severe[0]['drug_b']}. "
                                                f"{severe[0]['effect']}"
                                            ),
                                            triggered_value=str(len(severe)),
                                            is_acknowledged=False,
                                        ))
                                        adv_alerts += 1
                        except Exception:
                            continue
                    if adv_alerts > 0:
                        db.commit()
                        print(f"Advanced ML: Created {adv_alerts} deterioration/interaction alerts")
                except Exception as adv_err:
                    print(f"Advanced ML scan error: {adv_err}")
                
            finally:
                db.close()
                
        except Exception as e:
            print(f"Error in proactive monitoring loop: {e}")
            await asyncio.sleep(60)  # Wait 1 minute before retry


async def notification_monitoring_loop():
    """Background task - monitor appointments, medications, and vitals"""
    from src.db import SessionLocal
    from services.notification_service import (
        check_upcoming_appointments,
        check_medication_schedule,
        check_critical_vitals
    )
    
    print("Notification monitoring loop started (every 5 minutes)")
    
    while True:
        try:
            await asyncio.sleep(300)  # Every 5 minutes
            
            db = SessionLocal()
            try:
                # Check for upcoming appointments
                appt_alerts = check_upcoming_appointments(db)
                if appt_alerts > 0:
                    print(f"Created {appt_alerts} appointment notifications")
                
                # Check medication schedules
                med_alerts = check_medication_schedule(db)
                if med_alerts > 0:
                    print(f"Created {med_alerts} medication alerts")
                
                # Check critical vitals
                vital_alerts = check_critical_vitals(db)
                if vital_alerts > 0:
                    print(f"Created {vital_alerts} critical vital alerts")
                
            finally:
                db.close()
                
        except Exception as e:
            print(f"Error in notification monitoring loop: {e}")
            await asyncio.sleep(60)  # Wait 1 minute before retry


async def compliance_scan_loop():
    """
    Background task — runs the care task compliance scan every 4 hours.
    Checks whether compulsory daily tasks (ESAS, medication acknowledgement, vitals)
    have been completed and creates reminder notifications for overdue ones.
    Fires appointment reminders at 24h and 1h before each appointment.
    """
    from src.db import SessionLocal
    from services.compliance_engine import run_compliance_scan

    print("Compliance scan loop started (every 4 hours)")

    # Run immediately on startup so there's no 4-hour wait on first boot
    await asyncio.sleep(30)   # brief delay to let DB initialise
    try:
        db = SessionLocal()
        result = run_compliance_scan(db)
        db.close()
        print(f"[Compliance] Initial scan: {result}")
    except Exception as e:
        print(f"[Compliance] Initial scan error: {e}")

    while True:
        try:
            await asyncio.sleep(4 * 3600)   # every 4 hours
            db = SessionLocal()
            try:
                result = run_compliance_scan(db)
                print(f"[Compliance] Periodic scan: {result}")
            finally:
                db.close()
        except Exception as e:
            print(f"[Compliance] Scan loop error: {e}")
            await asyncio.sleep(300)   # retry in 5 min on error


@app.get("/api")
async def root():
    """API info endpoint (moved from / so SPA can own the root)"""
    return {
        "message": "Project Aura API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Project Aura API"}


@app.get("/")
async def serve_root():
    """Root — serve React SPA if built, otherwise API info"""
    _idx = Path(__file__).parent.parent / "frontend" / "dist" / "index.html"
    if _idx.exists():
        from fastapi.responses import FileResponse as _FR
        return _FR(str(_idx))
    return {
        "message": "Project Aura API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)


# ── SPA Fallback (must be LAST — after all API routers) ──────────────────────
# Mount the entire dist folder as static files so ALL public assets
# (images, fonts, resources/, icons/, sw.js, manifest.json, etc.)
# are served correctly with proper MIME types.
# The SPA catchall only fires for routes not matched by a real file.
_dist_dir_spa = Path(__file__).parent.parent / "frontend" / "dist"
_dist_index = _dist_dir_spa / "index.html"

if _dist_index.exists():
    from fastapi.responses import FileResponse as _FileResponse
    from fastapi.staticfiles import StaticFiles as _SFSpa

    # Dedicated mounts for sub-directories in dist (resources, icons, assets)
    # These must be mounted BEFORE the catchall so they take priority.
    for _subdir in ("resources", "icons", "assets"):
        _subpath = _dist_dir_spa / _subdir
        if _subpath.exists():
            app.mount(f"/{_subdir}", _SFSpa(directory=str(_subpath)), name=f"dist-{_subdir}")

    @app.get("/manifest.json", include_in_schema=False)
    async def _manifest():
        return _FileResponse(str(_dist_dir_spa / "manifest.json"))

    @app.get("/sw.js", include_in_schema=False)
    async def _sw():
        return _FileResponse(str(_dist_dir_spa / "sw.js"))

    @app.get("/favicon.svg", include_in_schema=False)
    async def _fav():
        return _FileResponse(str(_dist_dir_spa / "favicon.svg"))

    @app.get("/{full_path:path}", include_in_schema=False)
    async def _spa_fallback(full_path: str):
        # Never intercept API or WebSocket paths
        if (full_path.startswith("api/") or full_path.startswith("ws/")
                or full_path.startswith("static/") or full_path.startswith("assets/")
                or full_path.startswith("icons/") or full_path.startswith("resources/")):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not found")
        # Try to serve a real file from dist first (e.g. favicon.ico, robots.txt)
        _candidate = _dist_dir_spa / full_path
        if _candidate.exists() and _candidate.is_file():
            return _FileResponse(str(_candidate))
        # Fall back to index.html so React Router handles the route
        return _FileResponse(str(_dist_index))
 

