"""
Reports Router  --  ProjectAura
================================
Generates structured clinical and operational reports.
All endpoints require authentication. Role-based access enforced.
Reports are logged to AuditLog for traceability.

Standards referenced:
  HIPAA §164.312(b)   -- Audit controls (access records)
  NHS NACEL 2024      -- National Audit of Care at End of Life indicators
  HQIP (2020)         -- Documenting local clinical audit
  ISO 9001            -- Quality management traceability
  HCI usability       -- Time-on-task, task completion, error rate metrics

Endpoints:
  GET  /api/reports/patient/{patient_id}     -- Patient Clinical Summary
  GET  /api/reports/user-activity            -- User Activity & Time Report
  GET  /api/reports/audit-trail              -- Clinical Audit Trail (HIPAA)
  GET  /api/reports/population               -- Population / Caseload Report
  GET  /api/reports/incidents                -- Incident & Alert Report
  GET  /api/reports/caregiver/{user_id}      -- Caregiver Performance Report
  GET  /api/reports/types                    -- Available report types
"""

from __future__ import annotations
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from src.db import (
    get_db, User, Patient, Vital, Medication, Appointment,
    Alert, AuditLog, ESASAssessment, PPSAssessment,
    PHQ9Assessment, GAD7Assessment, BarthelIndexAssessment,
    Prediction, CarePlan, CarePlanGoal, CaregiverAssignment,
    NotificationQueue as Notification
)
from routers.auth import get_current_user, require_role
from services.audit_service import log_action
from fastapi import Request

router = APIRouter()


# ── Helpers ────────────────────────────────────────────────────────────────

def _parse_date(s: Optional[str], default: datetime) -> datetime:
    if not s:
        return default
    try:
        return datetime.fromisoformat(s)
    except Exception:
        return default

def _user_dict(u: User) -> dict:
    return {"id": u.id, "name": u.full_name, "role": u.role, "username": u.username}

def _alert_severity_level(severity: str) -> int:
    return {"low": 1, "moderate": 2, "high": 3, "critical": 4}.get(severity, 0)


# ── Report metadata ────────────────────────────────────────────────────────

REPORT_TYPES = [
    {
        "id": "patient_summary",
        "name": "Patient Clinical Summary",
        "description": "Complete clinical snapshot: vitals, medications, ESAS scores, risk level, care plan, alerts, and incident history for a specific patient over a selected period.",
        "access": ["admin", "clinician", "caregiver"],
        "uses": ["Handover", "Family briefing", "Case review", "Discharge summary"],
        "standard": "NHS NACEL 2024, HIPAA Right of Access",
    },
    {
        "id": "user_activity",
        "name": "User Activity & Time Report",
        "description": "All actions performed by a user (or all users) with timestamps — logins, patient views, assessments submitted, messages sent. Includes time-on-task estimates for HCI analysis.",
        "access": ["admin"],
        "uses": ["Accountability", "Staff performance", "HCI time-on-task", "Compliance"],
        "standard": "HIPAA §164.312(b) Audit Controls, ISO 9001 Traceability",
    },
    {
        "id": "audit_trail",
        "name": "Clinical Audit Trail",
        "description": "Chronological record of every clinically significant action on a patient or in the system. Includes who accessed records, what was changed, and when. HIPAA-compliant.",
        "access": ["admin", "clinician"],
        "uses": ["HIPAA compliance", "Legal evidence", "Incident investigation", "Data breach response"],
        "standard": "HIPAA §164.312(b), GDPR Art.30 Records of Processing",
    },
    {
        "id": "population",
        "name": "Population & Caseload Report",
        "description": "System-wide overview: patient count by risk level, alert distribution, care setting breakdown, assessment completion rates, and outcome trends.",
        "access": ["admin", "clinician"],
        "uses": ["Management oversight", "Resource planning", "Quality improvement", "Clinical governance"],
        "standard": "NHS Quality Account, HQIP Clinical Audit Guide 2020",
    },
    {
        "id": "incidents",
        "name": "Incident & Alert Report",
        "description": "All high and critical alerts generated in a period — patient, severity, type, response time, who acknowledged, and outcome. Identifies patterns of deterioration.",
        "access": ["admin", "clinician"],
        "uses": ["Patient safety", "Critical incident review", "Near-miss analysis", "Quality assurance"],
        "standard": "NHS Patient Safety Incident Framework, NPSA",
    },
    {
        "id": "caregiver_performance",
        "name": "Caregiver Performance Report",
        "description": "For a specific caregiver: assigned patients, tasks logged, response times to alerts, assessment completions, and time-on-task metrics.",
        "access": ["admin", "clinician"],
        "uses": ["Staff appraisal", "Workload balance", "Training needs", "HR accountability"],
        "standard": "CQC Fundamental Standards, NHS Staff Performance Framework",
    },
]


@router.get("/types")
async def get_report_types(current_user: User = Depends(get_current_user)):
    """Return available report types and their access requirements."""
    accessible = [r for r in REPORT_TYPES if current_user.role in r["access"]]
    return {
        "reports": accessible,
        "generated_by": _user_dict(current_user),
        "timestamp": datetime.utcnow().isoformat(),
    }


# ── Report 1: Patient Clinical Summary ────────────────────────────────────

@router.get("/patient/{patient_id}")
async def patient_clinical_summary(
    patient_id: int,
    date_from: Optional[str] = Query(None, description="ISO date e.g. 2025-01-01"),
    date_to:   Optional[str] = Query(None, description="ISO date e.g. 2025-12-31"),
    http_request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Patient Clinical Summary Report.
    Covers: demographics, risk level, vitals trend, medications,
            ESAS/PPS/PHQ-9/GAD-7/Barthel assessments, care plan,
            active alerts, and all audit actions on this patient.
    """
    if current_user.role not in ("admin", "clinician", "caregiver"):
        raise HTTPException(403, "Access denied")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")

    now   = datetime.utcnow()
    start = _parse_date(date_from, now - timedelta(days=30))
    end   = _parse_date(date_to,   now)

    # ── Vitals ──────────────────────────────────────────────────────────
    vitals = (db.query(Vital)
              .filter(Vital.patient_id == patient_id,
                      Vital.recorded_at >= start,
                      Vital.recorded_at <= end)
              .order_by(Vital.recorded_at.desc()).limit(50).all())

    def _vital(v):
        return {
            "recorded_at": v.recorded_at.isoformat(),
            "heart_rate": v.heart_rate,
            "bp_sys": getattr(v, "blood_pressure_sys", None),
            "bp_dia": getattr(v, "blood_pressure_dia", None),
            "spo2": v.oxygen_saturation,
            "temperature": v.temperature,
            "respiratory_rate": getattr(v, "respiratory_rate", None),
        }

    # ── Medications ─────────────────────────────────────────────────────
    meds = (db.query(Medication)
            .filter(Medication.patient_id == patient_id)
            .order_by(Medication.is_active.desc()).all())

    # ── ESAS assessments ─────────────────────────────────────────────────
    esas = (db.query(ESASAssessment)
            .filter(ESASAssessment.patient_id == patient_id,
                    ESASAssessment.assessed_at >= start,
                    ESASAssessment.assessed_at <= end)
            .order_by(ESASAssessment.assessed_at.desc()).all())

    # ── PPS assessments ──────────────────────────────────────────────────
    pps = (db.query(PPSAssessment)
           .filter(PPSAssessment.patient_id == patient_id,
                   PPSAssessment.assessed_at >= start,
                   PPSAssessment.assessed_at <= end)
           .order_by(PPSAssessment.assessed_at.desc()).all())

    # ── Mental health ────────────────────────────────────────────────────
    phq9_list = (db.query(PHQ9Assessment)
                 .filter(PHQ9Assessment.patient_id == patient_id,
                         PHQ9Assessment.assessed_at >= start)
                 .order_by(PHQ9Assessment.assessed_at.desc()).limit(5).all())

    # ── Barthel ──────────────────────────────────────────────────────────
    barthel_list = (db.query(BarthelIndexAssessment)
                    .filter(BarthelIndexAssessment.patient_id == patient_id,
                            BarthelIndexAssessment.assessed_at >= start)
                    .order_by(BarthelIndexAssessment.assessed_at.desc()).limit(5).all())

    # ── Latest ML prediction ─────────────────────────────────────────────
    prediction = (db.query(Prediction)
                  .filter(Prediction.patient_id == patient_id)
                  .order_by(Prediction.predicted_at.desc()).first())

    # ── Alerts ───────────────────────────────────────────────────────────
    alerts = (db.query(Alert)
              .filter(Alert.patient_id == patient_id,
                      Alert.created_at >= start,
                      Alert.created_at <= end)
              .order_by(Alert.created_at.desc()).all())

    # ── Appointments ─────────────────────────────────────────────────────
    appointments = (db.query(Appointment)
                    .filter(Appointment.patient_id == patient_id,
                            Appointment.scheduled_at >= start,
                            Appointment.scheduled_at <= end)
                    .order_by(Appointment.scheduled_at.desc()).all())

    # ── Audit trail on this patient ───────────────────────────────────────
    audit = (db.query(AuditLog)
             .filter(AuditLog.patient_id == patient_id,
                     AuditLog.created_at >= start,
                     AuditLog.created_at <= end)
             .order_by(AuditLog.created_at.desc()).limit(200).all())

    # ── ESAS trend summary ────────────────────────────────────────────────
    esas_trend = []
    for e in esas[:10]:
        tsds = sum([e.pain, e.tiredness, e.nausea, e.depression, e.anxiety,
                    e.drowsiness, getattr(e,'lack_of_appetite',0),
                    e.shortness_of_breath, e.wellbeing])
        esas_trend.append({
            "date": e.assessed_at.isoformat(),
            "tsds": tsds,
            "pain": e.pain,
            "depression": e.depression,
            "anxiety": e.anxiety,
            "wellbeing": e.wellbeing,
            "risk_flag": "critical" if tsds >= 40 else "high" if tsds >= 20 else "normal",
        })

    # ── Critical events (high/critical alerts) ────────────────────────────
    critical_events = [
        {
            "date": a.created_at.isoformat(),
            "type": a.alert_type,
            "severity": a.severity,
            "message": a.message,
            "acknowledged": a.is_acknowledged,
            "response_time_hours": (
                round((a.acknowledged_at - a.created_at).total_seconds() / 3600, 1)
                if getattr(a, "acknowledged_at", None) and a.is_acknowledged
                else None
            ),
        }
        for a in alerts if _alert_severity_level(a.severity) >= 3
    ]

    # Log this report generation
    if http_request:
        log_action(db, user=current_user, action="REPORT_PATIENT_SUMMARY",
                   resource_type="report", patient_id=patient_id,
                   request=http_request,
                   details={"period_days": (end - start).days})
    db.commit()

    return {
        "report_type": "patient_summary",
        "report_title": f"Clinical Summary — {patient.full_name}",
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": _user_dict(current_user),
        "period": {"from": start.isoformat(), "to": end.isoformat()},
        "confidentiality": "CLINICAL IN CONFIDENCE — Not for unauthorised disclosure",
        "standard": "NHS NACEL 2024 / HIPAA Right of Access §164.524",

        "patient": {
            "id": patient.id,
            "patient_code": patient.patient_code,
            "full_name": patient.full_name,
            "age": getattr(patient, "age", None),
            "gender": patient.gender,
            "primary_diagnosis": patient.primary_diagnosis,
            "care_setting": getattr(patient, "care_setting", None),
            "risk_level": patient.risk_level,
            "risk_score": patient.risk_score,
            "status": patient.status,
            "admission_date": patient.admission_date.isoformat() if patient.admission_date else None,
        },

        "latest_risk_prediction": {
            "risk_level": prediction.risk_level if prediction else "unknown",
            "risk_score": prediction.risk_score if prediction else None,
            "predicted_at": prediction.predicted_at.isoformat() if prediction else None,
            "explanation": prediction.plain_explanation if prediction else None,
        } if prediction else None,

        "vitals_summary": {
            "count": len(vitals),
            "latest": _vital(vitals[0]) if vitals else None,
            "trend": [_vital(v) for v in vitals[:10]],
        },

        "medications": {
            "active_count": sum(1 for m in meds if m.is_active),
            "total_count": len(meds),
            "list": [
                {"name": m.name, "dose": m.dose, "frequency": m.frequency,
                 "route": m.route, "is_active": m.is_active,
                 "start_date": m.start_date.isoformat() if m.start_date else None}
                for m in meds
            ],
        },

        "symptom_assessments": {
            "esas_count": len(esas),
            "esas_trend": esas_trend,
            "pps_latest": {
                "score": pps[0].pps_score,
                "assessed_at": pps[0].assessed_at.isoformat(),
            } if pps else None,
            "phq9_latest": {
                "score": sum([getattr(phq9_list[0], f, 0) for f in [
                    "little_interest","feeling_down","sleep_trouble","feeling_tired",
                    "appetite_change","feeling_bad_about_self","trouble_concentrating",
                    "moving_slowly_or_fidgety","thoughts_of_harm"
                ]]),
                "assessed_at": phq9_list[0].assessed_at.isoformat(),
            } if phq9_list else None,
            "barthel_latest": {
                "score": getattr(barthel_list[0], "total_score", None) or getattr(barthel_list[0], "barthel_score", None),
                "assessed_at": barthel_list[0].assessed_at.isoformat(),
            } if barthel_list else None,
        },

        "critical_events": {
            "total_alerts": len(alerts),
            "critical_count": len([a for a in alerts if a.severity == "critical"]),
            "high_count": len([a for a in alerts if a.severity == "high"]),
            "events": critical_events,
            "unacknowledged": len([a for a in alerts if not a.is_acknowledged]),
        },

        "appointments": {
            "count": len(appointments),
            "list": [
                {"date": a.scheduled_at.isoformat(), "type": a.appointment_type,
                 "location": a.location, "status": a.status}
                for a in appointments[:10]
            ],
        },

        "audit_trail": {
            "total_actions": len(audit),
            "actions": [
                {
                    "timestamp": a.created_at.isoformat(),
                    "action": a.action,
                    "user_role": a.user_role,
                    "success": a.success,
                }
                for a in audit[:50]
            ],
        },
    }


# ── Report 2: User Activity & Time Report ─────────────────────────────────

@router.get("/user-activity")
async def user_activity_report(
    user_id:   Optional[int] = Query(None, description="Specific user ID, or omit for all"),
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
    http_request: Request = None,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """
    User Activity & Time Report.
    Shows every logged action by a user (or all users) in a period.
    Includes estimated time-on-task (gap between consecutive actions).
    Used for: accountability, HCI time-on-task analysis, compliance auditing.
    Standard: HIPAA §164.312(b), ISO 9001 Traceability.
    """
    now   = datetime.utcnow()
    start = _parse_date(date_from, now - timedelta(days=7))
    end   = _parse_date(date_to,   now)

    q = db.query(AuditLog, User).outerjoin(User, AuditLog.user_id == User.id)
    q = q.filter(AuditLog.created_at >= start, AuditLog.created_at <= end)
    if user_id:
        q = q.filter(AuditLog.user_id == user_id)
    q = q.order_by(AuditLog.created_at.asc())
    rows = q.all()

    # Group by user
    from collections import defaultdict
    user_actions: dict = defaultdict(list)
    for log, user in rows:
        uid = log.user_id or 0
        user_actions[uid].append((log, user))

    # Build per-user summaries with time-on-task estimation
    user_summaries = []
    for uid, entries in user_actions.items():
        logs = [e[0] for e in entries]
        u    = entries[0][1]

        # Time-on-task: gap between consecutive actions capped at 30 min
        sessions = []
        session_start = logs[0].created_at if logs else None
        total_active_mins = 0
        for i in range(1, len(logs)):
            gap = (logs[i].created_at - logs[i-1].created_at).total_seconds() / 60
            if gap > 30:  # session boundary
                dur = (logs[i-1].created_at - session_start).total_seconds() / 60
                sessions.append({"start": session_start.isoformat(),
                                  "end": logs[i-1].created_at.isoformat(),
                                  "duration_mins": round(dur, 1)})
                total_active_mins += dur
                session_start = logs[i].created_at
        if logs and session_start:
            dur = (logs[-1].created_at - session_start).total_seconds() / 60
            sessions.append({"start": session_start.isoformat(),
                              "end": logs[-1].created_at.isoformat(),
                              "duration_mins": round(dur, 1)})
            total_active_mins += dur

        # Action type breakdown
        action_counts: dict = defaultdict(int)
        for log in logs:
            action_counts[log.action] += 1

        # Critical actions (anything touching patient care)
        critical_actions = [
            {
                "timestamp": log.created_at.isoformat(),
                "action": log.action,
                "resource": log.resource_type,
                "patient_id": log.patient_id,
                "success": log.success,
                "ip": log.ip_address,
            }
            for log in logs
            if log.action.startswith(("CREATE_", "UPDATE_", "DELETE_", "DISCONTINUE_",
                                      "LOGIN_FAILED", "PASSWORD_", "FEATURE_"))
        ]

        user_summaries.append({
            "user_id":           uid,
            "user_name":         u.full_name if u else "System/Unknown",
            "user_role":         u.role if u else "unknown",
            "total_actions":     len(logs),
            "active_sessions":   len(sessions),
            "total_active_mins": round(total_active_mins, 1),
            "action_breakdown":  dict(action_counts),
            "critical_actions":  critical_actions,
            "sessions":          sessions[:20],  # cap for response size
            "login_count":       sum(1 for log in logs if log.action == "LOGIN_SUCCESS"),
            "failed_logins":     sum(1 for log in logs if log.action == "LOGIN_FAILED"),
        })

    user_summaries.sort(key=lambda x: -x["total_actions"])

    if http_request:
        log_action(db, user=current_user, action="REPORT_USER_ACTIVITY",
                   resource_type="report", request=http_request,
                   details={"user_id": user_id, "period_days": (end-start).days})
    db.commit()

    return {
        "report_type": "user_activity",
        "report_title": f"User Activity Report — {'All Users' if not user_id else f'User #{user_id}'}",
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": _user_dict(current_user),
        "period": {"from": start.isoformat(), "to": end.isoformat()},
        "confidentiality": "RESTRICTED — Admin use only. Contains personal access data.",
        "standard": "HIPAA §164.312(b) Audit Controls / ISO 9001:2015 §8.5.2 Traceability",
        "summary": {
            "total_users": len(user_summaries),
            "total_actions": sum(u["total_actions"] for u in user_summaries),
            "total_active_mins": round(sum(u["total_active_mins"] for u in user_summaries), 1),
            "total_failed_logins": sum(u["failed_logins"] for u in user_summaries),
        },
        "users": user_summaries,
    }


# ── Report 3: Clinical Audit Trail ────────────────────────────────────────

@router.get("/audit-trail")
async def clinical_audit_trail(
    patient_id: Optional[int] = Query(None),
    action:     Optional[str] = Query(None, description="Filter by action keyword"),
    date_from:  Optional[str] = Query(None),
    date_to:    Optional[str] = Query(None),
    http_request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Clinical Audit Trail — HIPAA §164.312(b) compliant.
    Full chronological log of all system actions.
    Clinicians can query for their own patients; admins see everything.
    Standard: HIPAA §164.312(b), GDPR Art.30.
    """
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(403, "Admin or clinician required")

    now   = datetime.utcnow()
    start = _parse_date(date_from, now - timedelta(days=30))
    end   = _parse_date(date_to,   now)

    q = db.query(AuditLog, User).outerjoin(User, AuditLog.user_id == User.id)
    q = q.filter(AuditLog.created_at >= start, AuditLog.created_at <= end)
    if patient_id:
        q = q.filter(AuditLog.patient_id == patient_id)
    if action:
        q = q.filter(AuditLog.action.ilike(f"%{action}%"))
    q = q.order_by(AuditLog.created_at.desc())
    rows = q.all()

    entries = [
        {
            "id":           log.id,
            "timestamp":    log.created_at.isoformat(),
            "user_id":      log.user_id,
            "user_name":    u.full_name if u else "System",
            "user_role":    log.user_role,
            "action":       log.action,
            "resource_type":log.resource_type,
            "resource_id":  log.resource_id,
            "patient_id":   log.patient_id,
            "success":      log.success,
            "ip_address":   log.ip_address,
            "details":      log.details,
        }
        for log, u in rows
    ]

    # Classify severity of each entry
    CRITICAL_ACTIONS = {"DELETE_PATIENT", "DISCONTINUE_MEDICATION", "LOGIN_FAILED",
                        "FEATURE_REQUEST_DENIED", "PASSWORD_RESET"}
    HIGH_ACTIONS = {"CREATE_PATIENT", "UPDATE_PATIENT", "CREATE_MEDICATION",
                    "UPDATE_MEDICATION", "CREATE_VITAL", "CREATE_ESAS_ASSESSMENT"}

    for e in entries:
        if e["action"] in CRITICAL_ACTIONS or not e["success"]:
            e["severity"] = "critical"
        elif e["action"] in HIGH_ACTIONS:
            e["severity"] = "high"
        elif e["action"].startswith("VIEW_"):
            e["severity"] = "info"
        else:
            e["severity"] = "normal"

    if http_request:
        log_action(db, user=current_user, action="REPORT_AUDIT_TRAIL",
                   resource_type="report", request=http_request,
                   details={"patient_id": patient_id, "period_days": (end-start).days})
    db.commit()

    return {
        "report_type": "audit_trail",
        "report_title": f"Clinical Audit Trail{'— Patient #'+str(patient_id) if patient_id else ''}",
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": _user_dict(current_user),
        "period": {"from": start.isoformat(), "to": end.isoformat()},
        "confidentiality": "STRICTLY CONFIDENTIAL — Legal record. Do not alter.",
        "standard": "HIPAA §164.312(b) / GDPR Art.30 / NHS IG Toolkit",
        "totals": {
            "total_entries": len(entries),
            "critical":  sum(1 for e in entries if e["severity"] == "critical"),
            "high":      sum(1 for e in entries if e["severity"] == "high"),
            "failed":    sum(1 for e in entries if not e["success"]),
        },
        "entries": entries,
    }


# ── Report 4: Population / Caseload Report ─────────────────────────────────

@router.get("/population")
async def population_report(
    http_request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Population & Caseload Report.
    System-wide overview of all patients — risk distribution, alerts, care settings.
    Standard: NHS Quality Account, HQIP Clinical Audit Guide 2020.
    """
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(403, "Admin or clinician required")

    patients = db.query(Patient).filter(Patient.status != "deceased").all()
    all_alerts = db.query(Alert).filter(Alert.is_acknowledged == False).all()

    risk_dist = {"low": 0, "moderate": 0, "high": 0, "critical": 0, "unknown": 0}
    for p in patients:
        lvl = (p.risk_level or "unknown").lower()
        risk_dist[lvl if lvl in risk_dist else "unknown"] += 1

    care_settings: dict = {}
    for p in patients:
        cs = getattr(p, "care_setting", None) or "unspecified"
        care_settings[cs] = care_settings.get(cs, 0) + 1

    diagnoses: dict = {}
    for p in patients:
        dx = p.primary_diagnosis or "Unspecified"
        diagnoses[dx] = diagnoses.get(dx, 0) + 1
    top_diagnoses = sorted(diagnoses.items(), key=lambda x: -x[1])[:10]

    # Alert stats
    alert_by_sev: dict = {}
    for a in all_alerts:
        alert_by_sev[a.severity] = alert_by_sev.get(a.severity, 0) + 1

    # Assessment completeness
    recent_esas = db.query(ESASAssessment.patient_id).filter(
        ESASAssessment.assessed_at >= datetime.utcnow() - timedelta(days=7)
    ).distinct().count()

    if http_request:
        log_action(db, user=current_user, action="REPORT_POPULATION",
                   resource_type="report", request=http_request)
    db.commit()

    return {
        "report_type": "population",
        "report_title": "Population & Caseload Report",
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": _user_dict(current_user),
        "standard": "NHS Quality Account / HQIP Clinical Audit Guide 2020",
        "confidentiality": "CLINICAL IN CONFIDENCE",
        "summary": {
            "total_active_patients": len(patients),
            "unacknowledged_alerts": len(all_alerts),
            "critical_alerts": alert_by_sev.get("critical", 0),
            "high_alerts":     alert_by_sev.get("high", 0),
            "esas_last_7days": recent_esas,
            "esas_completion_rate_pct": round(recent_esas / max(len(patients), 1) * 100, 1),
        },
        "risk_distribution": risk_dist,
        "care_settings": care_settings,
        "top_diagnoses": [{"diagnosis": d, "count": c} for d, c in top_diagnoses],
        "alert_distribution": alert_by_sev,
    }


# ── Report 5: Incident & Alert Report ─────────────────────────────────────

@router.get("/incidents")
async def incident_report(
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
    min_severity: str = Query("high", description="Minimum severity: low|moderate|high|critical"),
    http_request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Incident & Alert Report.
    All alerts above a severity threshold — type, patient, response time, outcome.
    Standard: NHS Patient Safety Incident Framework, NPSA.
    """
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(403, "Admin or clinician required")

    now   = datetime.utcnow()
    start = _parse_date(date_from, now - timedelta(days=30))
    end   = _parse_date(date_to,   now)
    min_lvl = _alert_severity_level(min_severity)

    alerts = (db.query(Alert, Patient)
              .outerjoin(Patient, Alert.patient_id == Patient.id)
              .filter(Alert.created_at >= start, Alert.created_at <= end)
              .order_by(Alert.created_at.desc()).all())

    incidents = []
    for a, p in alerts:
        if _alert_severity_level(a.severity) < min_lvl:
            continue
        resp_time = None
        if getattr(a, "acknowledged_at", None) and a.is_acknowledged:
            resp_time = round((a.acknowledged_at - a.created_at).total_seconds() / 60, 1)

        incidents.append({
            "alert_id":          a.id,
            "created_at":        a.created_at.isoformat(),
            "severity":          a.severity,
            "alert_type":        a.alert_type,
            "message":           a.message,
            "patient_id":        a.patient_id,
            "patient_name":      p.full_name if p else "Unknown",
            "patient_diagnosis": p.primary_diagnosis if p else None,
            "is_acknowledged":   a.is_acknowledged,
            "response_time_mins":resp_time,
            "triggered_value":   getattr(a, "triggered_value", None),
            "overdue":           not a.is_acknowledged and (now - a.created_at).total_seconds() > 3600,
        })

    # Response time stats
    responded = [i for i in incidents if i["response_time_mins"] is not None]
    avg_resp = round(sum(i["response_time_mins"] for i in responded) / max(len(responded), 1), 1)

    if http_request:
        log_action(db, user=current_user, action="REPORT_INCIDENTS",
                   resource_type="report", request=http_request,
                   details={"period_days": (end-start).days, "min_severity": min_severity})
    db.commit()

    return {
        "report_type": "incidents",
        "report_title": f"Incident & Alert Report ({min_severity.title()}+)",
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": _user_dict(current_user),
        "period": {"from": start.isoformat(), "to": end.isoformat()},
        "standard": "NHS Patient Safety Incident Framework / NPSA",
        "confidentiality": "CLINICAL IN CONFIDENCE — Patient safety record",
        "summary": {
            "total_incidents":     len(incidents),
            "critical":            sum(1 for i in incidents if i["severity"] == "critical"),
            "high":                sum(1 for i in incidents if i["severity"] == "high"),
            "unacknowledged":      sum(1 for i in incidents if not i["is_acknowledged"]),
            "overdue":             sum(1 for i in incidents if i["overdue"]),
            "avg_response_mins":   avg_resp,
            "fastest_response_mins": min((i["response_time_mins"] for i in responded), default=None),
            "slowest_response_mins": max((i["response_time_mins"] for i in responded), default=None),
        },
        "incidents": incidents,
    }


# ── Report 6: Caregiver Performance Report ─────────────────────────────────

@router.get("/caregiver/{caregiver_user_id}")
async def caregiver_performance_report(
    caregiver_user_id: int,
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
    http_request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Caregiver Performance Report.
    Assigned patients, tasks logged, alert response times, assessment completions.
    Standard: CQC Fundamental Standards, NHS Staff Performance Framework.
    """
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(403, "Admin or clinician required")

    caregiver = db.query(User).filter(User.id == caregiver_user_id).first()
    if not caregiver:
        raise HTTPException(404, "User not found")

    now   = datetime.utcnow()
    start = _parse_date(date_from, now - timedelta(days=30))
    end   = _parse_date(date_to,   now)

    # Assigned patients
    assignments = (db.query(CaregiverAssignment, Patient)
                   .join(Patient, CaregiverAssignment.patient_id == Patient.id)
                   .filter(CaregiverAssignment.caregiver_id == caregiver_user_id,
                           CaregiverAssignment.active == True).all())

    patient_ids = [a.patient_id for a, _ in assignments]

    # All audit actions by this caregiver in period
    audit = (db.query(AuditLog)
             .filter(AuditLog.user_id == caregiver_user_id,
                     AuditLog.created_at >= start,
                     AuditLog.created_at <= end)
             .order_by(AuditLog.created_at.desc()).all())

    # Vitals logged
    vitals_logged = sum(1 for a in audit if a.action == "CREATE_VITAL")

    # ESAS submitted
    esas_submitted = sum(1 for a in audit if a.action == "CREATE_ESAS_ASSESSMENT")

    # Alert acknowledgements (action timestamps)
    from collections import defaultdict
    action_breakdown: dict = defaultdict(int)
    for a in audit:
        action_breakdown[a.action] += 1

    # Sessions (same gap logic as user activity)
    session_count = 0
    total_mins = 0.0
    if audit:
        sorted_audit = sorted(audit, key=lambda x: x.created_at)
        session_start = sorted_audit[0].created_at
        for i in range(1, len(sorted_audit)):
            gap = (sorted_audit[i].created_at - sorted_audit[i-1].created_at).total_seconds() / 60
            if gap > 30:
                dur = (sorted_audit[i-1].created_at - session_start).total_seconds() / 60
                total_mins += dur
                session_count += 1
                session_start = sorted_audit[i].created_at
        dur = (sorted_audit[-1].created_at - session_start).total_seconds() / 60
        total_mins += dur
        session_count += 1

    if http_request:
        log_action(db, user=current_user, action="REPORT_CAREGIVER_PERFORMANCE",
                   resource_type="report", request=http_request,
                   details={"caregiver_id": caregiver_user_id, "period_days": (end-start).days})
    db.commit()

    return {
        "report_type": "caregiver_performance",
        "report_title": f"Caregiver Performance — {caregiver.full_name}",
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": _user_dict(current_user),
        "period": {"from": start.isoformat(), "to": end.isoformat()},
        "standard": "CQC Fundamental Standards / NHS Staff Performance Framework",
        "confidentiality": "HR CONFIDENTIAL",
        "caregiver": _user_dict(caregiver),
        "summary": {
            "assigned_patients":  len(assignments),
            "total_actions":      len(audit),
            "vitals_logged":      vitals_logged,
            "assessments_submitted": esas_submitted,
            "active_sessions":    session_count,
            "total_active_mins":  round(total_mins, 1),
            "login_count":        action_breakdown.get("LOGIN_SUCCESS", 0),
            "action_breakdown":   dict(action_breakdown),
        },
        "assigned_patients": [
            {
                "patient_id": p.id,
                "patient_name": p.full_name,
                "diagnosis": p.primary_diagnosis,
                "risk_level": p.risk_level,
                "assigned_since": a.assigned_at.isoformat() if getattr(a, "assigned_at", None) else None,
            }
            for a, p in assignments
        ],
    }
