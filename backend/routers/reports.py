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
    Prediction, CarePlan, CarePlanGoal, CarePlanChecklistItem,
    CaregiverAssignment, MedicationAdherenceLog,
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
        "description": "All actions performed by a user (or all users) with timestamps - logins, patient views, assessments submitted, messages sent. Includes time-on-task estimates for HCI analysis.",
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
        "description": "All high and critical alerts generated in a period - patient, severity, type, response time, who acknowledged, and outcome. Identifies patterns of deterioration.",
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
    {
        "id": "medication_adherence",
        "name": "Medication Adherence Report",
        "description": "Tracks whether each patient is taking prescribed medications on schedule. Shows doses taken vs missed, adherence %, PRN usage, and patterns of non-adherence by time-of-day.",
        "access": ["admin", "clinician", "caregiver"],
        "uses": ["Pain management review", "Patient safety", "Non-adherence investigation", "Pharmacy review"],
        "standard": "NHS Medicines Management, NICE NG209 Palliative Care",
    },
    {
        "id": "assessment_completion",
        "name": "Assessment Completion & Overdue Report",
        "description": "Shows which patients are overdue for ESAS, PPS, PHQ-9, GAD-7, Barthel and other assessments. Flags ESAS TSDS ≥40 (72% 30-day mortality risk) and PHQ-9 ≥15 (severe depression).",
        "access": ["admin", "clinician"],
        "uses": ["Clinical governance", "Quality monitoring", "Assessment compliance", "CQC evidence"],
        "standard": "NHS NACEL 2024, ESAS-r Watanabe 2011, PHQ-9 Kroenke 2002",
    },
    {
        "id": "care_plan_progress",
        "name": "Care Plan Goal Progress Report",
        "description": "Tracks achievement of care plan goals and daily checklist tasks. Shows progress % by goal category (pain, psychological, spiritual), overdue goals, and AI-suggested vs clinician goals.",
        "access": ["admin", "clinician", "caregiver"],
        "uses": ["Weekly care plan review", "Goal-oriented care", "Quality assurance", "NHS NACEL compliance"],
        "standard": "NHS NACEL 2024 Goal-Oriented Care, NICE NG31",
    },
    {
        "id": "mdt_handover",
        "name": "MDT Handover / Shift Summary",
        "description": "Multi-disciplinary team handover report: all active patients, risk levels, pending tasks, recent alerts, outstanding assessments, and priority actions for the incoming shift.",
        "access": ["admin", "clinician", "caregiver"],
        "uses": ["Shift handover", "MDT meeting preparation", "Safe care transfer", "Continuity of care"],
        "standard": "NHS Safe Handover (BMA 2004), SBAR Communication Framework, CQC Fundamental Standards",
    },
    {
        "id": "advance_care_plan",
        "name": "Advance Care Plan Summary",
        "description": "Documents the patient's stated wishes, DNR/DNACPR status, advance directive, preferred place of care/death, and spiritual/religious preferences. Essential for end-of-life decision making.",
        "access": ["admin", "clinician", "caregiver"],
        "uses": ["End-of-life planning", "Legal documentation", "Family communication", "Out-of-hours care"],
        "standard": "NICE NG31 Care of Dying Adults, GMC Treatment End of Life 2024, Mental Capacity Act 2005",
    },
    {
        "id": "bereavement_outcome",
        "name": "Bereavement & Family Outcome Report",
        "description": "Tracks family bereavement support engagement, PHQ-9/GAD-7 scores for bereaved relatives, journal activity, community participation, and identifies families at high grief risk requiring follow-up.",
        "access": ["admin", "clinician"],
        "uses": ["Bereavement risk assessment", "Family follow-up planning", "Grief support audit", "NACEL bereavement survey"],
        "standard": "NACEL 2024 Bereavement Survey, NICE NG31, CRUSE Bereavement UK Guidelines",
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
        "report_title": f"Clinical Summary - {patient.full_name}",
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": _user_dict(current_user),
        "period": {"from": start.isoformat(), "to": end.isoformat()},
        "confidentiality": "CLINICAL IN CONFIDENCE - Not for unauthorised disclosure",
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
        "report_title": f"User Activity Report - {'All Users' if not user_id else f'User #{user_id}'}",
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": _user_dict(current_user),
        "period": {"from": start.isoformat(), "to": end.isoformat()},
        "confidentiality": "RESTRICTED - Admin use only. Contains personal access data.",
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
    Clinical Audit Trail - HIPAA §164.312(b) compliant.
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
        "report_title": f"Clinical Audit Trail{' -  Patient #'+str(patient_id) if patient_id else ''}",
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": _user_dict(current_user),
        "period": {"from": start.isoformat(), "to": end.isoformat()},
        "confidentiality": "STRICTLY CONFIDENTIAL - Legal record. Do not alter.",
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
    System-wide overview of all patients - risk distribution, alerts, care settings.
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
    All alerts above a severity threshold - type, patient, response time, outcome.
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
        "confidentiality": "CLINICAL IN CONFIDENCE - Patient safety record",
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
        "report_title": f"Caregiver Performance - {caregiver.full_name}",
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


# ── Report 7: Medication Adherence Report ────────────────────────────────

@router.get("/medication-adherence/{patient_id}")
async def medication_adherence_report(
    patient_id: int,
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
    http_request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Medication Adherence Report.
    Tracks doses taken vs missed per medication. Flags <80% adherence.
    Standard: NHS Medicines Management, NICE NG209 Palliative Care.
    """
    if current_user.role not in ("admin", "clinician", "caregiver"):
        raise HTTPException(403, "Access denied")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")

    now   = datetime.utcnow()
    start = _parse_date(date_from, now - timedelta(days=30))
    end   = _parse_date(date_to, now)

    # Active medications
    meds = db.query(Medication).filter(
        Medication.patient_id == patient_id,
        Medication.is_active == True,
    ).all()

    # Adherence logs in period
    logs = db.query(MedicationAdherenceLog).filter(
        MedicationAdherenceLog.patient_id == patient_id,
        MedicationAdherenceLog.scheduled_at >= start,
        MedicationAdherenceLog.scheduled_at <= end,
    ).order_by(MedicationAdherenceLog.scheduled_at.desc()).all()

    # Group logs by medication
    from collections import defaultdict
    logs_by_med: dict = defaultdict(list)
    for lg in logs:
        logs_by_med[lg.medication_id].append(lg)

    # Build per-medication adherence summary
    FREQ_HOURS = {
        "once_daily": 24, "twice_daily": 12, "three_daily": 8,
        "every_4h": 4, "every_6h": 6, "every_8h": 8,
        "every_12h": 12, "prn": None,
    }

    med_details = []
    total_scheduled = 0
    total_taken = 0
    total_missed = 0

    for med in meds:
        med_logs = logs_by_med.get(med.id, [])
        taken  = sum(1 for lg in med_logs if lg.taken)
        missed = sum(1 for lg in med_logs if not lg.taken)
        scheduled = taken + missed

        # Estimate scheduled doses if no logs (based on frequency × days)
        if scheduled == 0 and med.frequency and med.frequency != "prn":
            h = FREQ_HOURS.get(med.frequency)
            if h:
                days = (min(end, now) - max(start, med.start_date or start)).days
                scheduled = max(0, int(days * 24 / h))
                taken = 0
                missed = scheduled

        adherence_pct = round(taken / max(scheduled, 1) * 100, 1) if scheduled > 0 else None

        # Missed dose patterns by hour of day
        missed_hours = [
            lg.scheduled_at.hour for lg in med_logs
            if not lg.taken and lg.scheduled_at
        ]
        morning_misses = sum(1 for h in missed_hours if 6 <= h < 12)
        afternoon_misses = sum(1 for h in missed_hours if 12 <= h < 18)
        evening_misses = sum(1 for h in missed_hours if 18 <= h < 24)
        night_misses = sum(1 for h in missed_hours if h < 6)

        # Recent missed doses (last 5)
        recent_missed = [
            {
                "scheduled_at": lg.scheduled_at.isoformat(),
                "skipped_reason": lg.skipped_reason or "No reason given",
            }
            for lg in med_logs if not lg.taken
        ][:5]

        med_details.append({
            "medication_id":   med.id,
            "name":            med.name,
            "dose":            med.dose,
            "frequency":       med.frequency,
            "route":           med.route,
            "is_prn":          med.is_prn,
            "scheduled":       scheduled,
            "taken":           taken,
            "missed":          missed,
            "adherence_pct":   adherence_pct,
            "status":          (
                "no_data" if adherence_pct is None
                else "good" if adherence_pct >= 80
                else "warning" if adherence_pct >= 60
                else "critical"
            ),
            "missed_patterns": {
                "morning":   morning_misses,
                "afternoon": afternoon_misses,
                "evening":   evening_misses,
                "night":     night_misses,
            },
            "recent_missed": recent_missed,
        })

        total_scheduled += scheduled
        total_taken     += taken
        total_missed    += missed

    overall_pct = round(total_taken / max(total_scheduled, 1) * 100, 1) if total_scheduled > 0 else None

    # Medications needing attention (<80% adherence)
    at_risk = [m for m in med_details if m["status"] in ("warning", "critical")]

    if http_request:
        log_action(db, user=current_user, action="REPORT_MED_ADHERENCE",
                   resource_type="report", patient_id=patient_id,
                   request=http_request,
                   details={"period_days": (end - start).days})
    db.commit()

    return {
        "report_type":  "medication_adherence",
        "report_title": f"Medication Adherence - {patient.full_name}",
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": _user_dict(current_user),
        "period":       {"from": start.isoformat(), "to": end.isoformat()},
        "confidentiality": "CLINICAL IN CONFIDENCE",
        "standard": "NHS Medicines Management / NICE NG209 Palliative Care",
        "patient": {
            "id": patient.id, "full_name": patient.full_name,
            "patient_code": patient.patient_code,
            "primary_diagnosis": patient.primary_diagnosis,
        },
        "summary": {
            "total_active_medications": len(meds),
            "total_scheduled_doses":   total_scheduled,
            "total_taken_doses":       total_taken,
            "total_missed_doses":      total_missed,
            "overall_adherence_pct":   overall_pct,
            "at_risk_medications":     len(at_risk),
            "adherence_status": (
                "no_data" if overall_pct is None
                else "good" if overall_pct >= 80
                else "warning" if overall_pct >= 60
                else "critical"
            ),
        },
        "medications": med_details,
        "at_risk_medications": at_risk,
    }


# ── Report 8: Assessment Completion & Overdue Report ─────────────────────

@router.get("/assessment-completion")
async def assessment_completion_report(
    days_overdue: int = Query(7, description="Flag assessments older than this many days"),
    http_request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Assessment Completion & Overdue Report.
    Flags patients overdue for ESAS (daily), PPS (monthly), PHQ-9 (fortnightly).
    Highlights concerning scores: ESAS TSDS ≥40, PHQ-9 ≥15.
    Standard: NHS NACEL 2024, ESAS-r (Watanabe 2011), PHQ-9 (Kroenke 2002).
    """
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(403, "Admin or clinician required")

    now      = datetime.utcnow()
    patients = db.query(Patient).filter(Patient.status.notin_(["deceased"])).all()

    # Overdue thresholds (days)
    THRESHOLDS = {
        "esas":    1,   # daily
        "pps":    30,   # monthly
        "phq9":   14,   # fortnightly
        "gad7":   14,
        "barthel":30,
    }

    patient_rows = []
    overdue_counts = {"esas": 0, "pps": 0, "phq9": 0, "gad7": 0, "barthel": 0}
    critical_scores = []

    for p in patients:
        # Last assessment dates
        last_esas    = db.query(ESASAssessment).filter(ESASAssessment.patient_id == p.id).order_by(ESASAssessment.assessed_at.desc()).first()
        last_pps     = db.query(PPSAssessment).filter(PPSAssessment.patient_id == p.id).order_by(PPSAssessment.assessed_at.desc()).first()
        last_phq9    = db.query(PHQ9Assessment).filter(PHQ9Assessment.patient_id == p.id).order_by(PHQ9Assessment.assessed_at.desc()).first()
        last_gad7    = db.query(GAD7Assessment).filter(GAD7Assessment.patient_id == p.id).order_by(GAD7Assessment.assessed_at.desc()).first()
        last_barthel = db.query(BarthelIndexAssessment).filter(BarthelIndexAssessment.patient_id == p.id).order_by(BarthelIndexAssessment.assessed_at.desc()).first()

        def days_since(rec):
            if not rec: return None
            return (now - rec.assessed_at).days

        esas_days  = days_since(last_esas)
        pps_days   = days_since(last_pps)
        phq9_days  = days_since(last_phq9)
        gad7_days  = days_since(last_gad7)
        barthel_days = days_since(last_barthel)

        # Flag overdues
        overdue_list = []
        if esas_days is None or esas_days > THRESHOLDS["esas"]:
            overdue_list.append("ESAS")
            overdue_counts["esas"] += 1
        if pps_days is None or pps_days > THRESHOLDS["pps"]:
            overdue_list.append("PPS")
            overdue_counts["pps"] += 1
        if phq9_days is None or phq9_days > THRESHOLDS["phq9"]:
            overdue_list.append("PHQ-9")
            overdue_counts["phq9"] += 1

        # Concerning scores
        if last_esas:
            tsds = sum([last_esas.pain, last_esas.tiredness, last_esas.nausea,
                        last_esas.depression, last_esas.anxiety, last_esas.drowsiness,
                        getattr(last_esas,'lack_of_appetite',0),
                        last_esas.shortness_of_breath, last_esas.wellbeing])
            if tsds >= 40:
                critical_scores.append({
                    "patient_id": p.id, "patient_name": p.full_name,
                    "assessment": "ESAS", "score": tsds,
                    "flag": "TSDS ≥40 - 72% 30-day mortality risk (Watanabe 2011)",
                    "date": last_esas.assessed_at.isoformat(),
                })

        if last_phq9:
            phq9_score = sum([getattr(last_phq9, f, 0) for f in [
                "little_interest","feeling_down","sleep_trouble","feeling_tired",
                "appetite_change","feeling_bad_about_self","trouble_concentrating",
                "moving_slowly_or_fidgety","thoughts_of_harm",
            ]])
            if phq9_score >= 15:
                critical_scores.append({
                    "patient_id": p.id, "patient_name": p.full_name,
                    "assessment": "PHQ-9", "score": phq9_score,
                    "flag": "PHQ-9 ≥15 - Moderately severe to severe depression",
                    "date": last_phq9.assessed_at.isoformat(),
                })

        patient_rows.append({
            "patient_id":    p.id,
            "patient_name":  p.full_name,
            "patient_code":  p.patient_code,
            "risk_level":    p.risk_level,
            "diagnosis":     p.primary_diagnosis,
            "overdue":       overdue_list,
            "overdue_count": len(overdue_list),
            "assessments": {
                "esas":    {"days_since": esas_days,    "overdue": esas_days is None or esas_days > THRESHOLDS["esas"],    "threshold_days": THRESHOLDS["esas"]},
                "pps":     {"days_since": pps_days,     "overdue": pps_days is None or pps_days > THRESHOLDS["pps"],       "threshold_days": THRESHOLDS["pps"]},
                "phq9":    {"days_since": phq9_days,    "overdue": phq9_days is None or phq9_days > THRESHOLDS["phq9"],    "threshold_days": THRESHOLDS["phq9"]},
                "gad7":    {"days_since": gad7_days,    "overdue": gad7_days is None or gad7_days > THRESHOLDS["gad7"],    "threshold_days": THRESHOLDS["gad7"]},
                "barthel": {"days_since": barthel_days, "overdue": barthel_days is None or barthel_days > THRESHOLDS["barthel"], "threshold_days": THRESHOLDS["barthel"]},
            },
        })

    # Sort: most overdue first
    patient_rows.sort(key=lambda x: -x["overdue_count"])

    if http_request:
        log_action(db, user=current_user, action="REPORT_ASSESSMENT_COMPLETION",
                   resource_type="report", request=http_request)
    db.commit()

    return {
        "report_type":  "assessment_completion",
        "report_title": "Assessment Completion & Overdue Report",
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": _user_dict(current_user),
        "confidentiality": "CLINICAL IN CONFIDENCE",
        "standard": "NHS NACEL 2024 / ESAS-r Watanabe 2011 / PHQ-9 Kroenke 2002",
        "thresholds": THRESHOLDS,
        "summary": {
            "total_patients":    len(patients),
            "patients_overdue":  sum(1 for r in patient_rows if r["overdue_count"] > 0),
            "overdue_by_type":   overdue_counts,
            "critical_scores":   len(critical_scores),
        },
        "critical_scores": critical_scores,
        "patients": patient_rows,
    }


# ── Report 9: Care Plan Goal Progress Report ──────────────────────────────

@router.get("/care-plan-progress/{patient_id}")
async def care_plan_progress_report(
    patient_id: int,
    http_request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Care Plan Goal Progress Report.
    Tracks achievement of care plan goals and daily checklist tasks.
    Flags overdue goals and poor-progress categories.
    Standard: NHS NACEL 2024 Goal-Oriented Care, NICE NG31.
    """
    if current_user.role not in ("admin", "clinician", "caregiver"):
        raise HTTPException(403, "Access denied")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")

    now = datetime.utcnow()

    # Get current care plan
    care_plan = db.query(CarePlan).filter(
        CarePlan.patient_id == patient_id,
        CarePlan.is_current == True,
    ).order_by(CarePlan.version.desc()).first()

    if not care_plan:
        # Try to get any care plan
        care_plan = db.query(CarePlan).filter(
            CarePlan.patient_id == patient_id,
        ).order_by(CarePlan.created_at.desc()).first()

    # All goals for this patient
    goals = db.query(CarePlanGoal).filter(
        CarePlanGoal.patient_id == patient_id,
    ).order_by(CarePlanGoal.priority.desc(), CarePlanGoal.created_at.desc()).all()

    # Goal status breakdown
    from collections import Counter, defaultdict
    status_counts = Counter(g.status for g in goals)
    category_progress: dict = defaultdict(list)

    goal_details = []
    overdue_goals = []

    for g in goals:
        # Checklist items for this goal
        checklist = db.query(CarePlanChecklistItem).filter(
            CarePlanChecklistItem.goal_id == g.id,
        ).all()
        completed_items = sum(1 for c in checklist if c.is_completed)
        total_items = len(checklist)

        # Is goal overdue?
        is_overdue = (
            g.target_date and
            g.target_date < now and
            g.status not in ("achieved", "discontinued")
        )

        goal_dict = {
            "id":           g.id,
            "title":        g.title,
            "category":     g.category or "general",
            "priority":     g.priority,
            "status":       g.status,
            "progress":     g.progress or 0,
            "target_date":  g.target_date.isoformat() if g.target_date else None,
            "achieved_date":g.achieved_date.isoformat() if g.achieved_date else None,
            "ai_suggested": g.ai_suggested,
            "is_overdue":   is_overdue,
            "checklist": {
                "total": total_items,
                "completed": completed_items,
                "completion_pct": round(completed_items / max(total_items, 1) * 100),
                "items": [
                    {
                        "task": c.task,
                        "frequency": c.frequency,
                        "is_completed": c.is_completed,
                        "completed_at": c.completed_at.isoformat() if c.completed_at else None,
                        "due_date": c.due_date.isoformat() if c.due_date else None,
                    }
                    for c in checklist
                ],
            },
            "notes": g.notes,
        }
        goal_details.append(goal_dict)
        category_progress[g.category or "general"].append(g.progress or 0)

        if is_overdue:
            overdue_goals.append(goal_dict)

    # Category averages
    category_avg = {
        cat: round(sum(progs) / len(progs))
        for cat, progs in category_progress.items()
    }

    # Overall progress
    all_progress = [g.progress or 0 for g in goals]
    overall_progress = round(sum(all_progress) / max(len(all_progress), 1))

    if http_request:
        log_action(db, user=current_user, action="REPORT_CARE_PLAN_PROGRESS",
                   resource_type="report", patient_id=patient_id,
                   request=http_request)
    db.commit()

    return {
        "report_type":  "care_plan_progress",
        "report_title": f"Care Plan Goal Progress - {patient.full_name}",
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": _user_dict(current_user),
        "confidentiality": "CLINICAL IN CONFIDENCE",
        "standard": "NHS NACEL 2024 Goal-Oriented Care / NICE NG31 End of Life Care",
        "patient": {
            "id": patient.id, "full_name": patient.full_name,
            "patient_code": patient.patient_code, "diagnosis": patient.primary_diagnosis,
        },
        "care_plan": {
            "id":           care_plan.id if care_plan else None,
            "version":      care_plan.version if care_plan else None,
            "is_current":   care_plan.is_current if care_plan else False,
            "created_at":   care_plan.created_at.isoformat() if care_plan else None,
            "ai_generated": care_plan.ai_generated if care_plan else False,
        } if care_plan else None,
        "summary": {
            "total_goals":       len(goals),
            "achieved":          status_counts.get("achieved", 0),
            "in_progress":       status_counts.get("in_progress", 0),
            "pending":           status_counts.get("pending", 0),
            "discontinued":      status_counts.get("discontinued", 0),
            "overdue":           len(overdue_goals),
            "overall_progress":  overall_progress,
            "ai_suggested":      sum(1 for g in goals if g.ai_suggested),
            "clinician_created": sum(1 for g in goals if not g.ai_suggested),
        },
        "category_progress": category_avg,
        "goals": goal_details,
        "overdue_goals": overdue_goals,
    }


# ── Report 10: MDT Handover / Shift Summary ──────────────────────────────

@router.get("/mdt-handover")
async def mdt_handover_report(
    http_request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    MDT Handover / Shift Summary.
    All active patients with risk, pending tasks, recent alerts, outstanding assessments.
    Standard: NHS Safe Handover (BMA 2004), SBAR Framework, CQC Fundamental Standards.
    """
    if current_user.role not in ("admin", "clinician", "caregiver"):
        raise HTTPException(403, "Access denied")

    now = datetime.utcnow()
    patients = db.query(Patient).filter(Patient.status.notin_(["deceased"])).all()

    patient_rows = []
    for p in patients:
        # Recent alerts (last 24h)
        recent_alerts = db.query(Alert).filter(
            Alert.patient_id == p.id,
            Alert.created_at >= now - timedelta(hours=24),
            Alert.is_acknowledged == False,
        ).order_by(Alert.severity.desc()).limit(3).all()

        # Last ESAS
        last_esas = db.query(ESASAssessment).filter(
            ESASAssessment.patient_id == p.id
        ).order_by(ESASAssessment.assessed_at.desc()).first()

        # Latest vitals
        last_vital = db.query(Vital).filter(
            Vital.patient_id == p.id
        ).order_by(Vital.recorded_at.desc()).first()

        # Upcoming appointments today
        today_end = now.replace(hour=23, minute=59, second=59)
        appts_today = db.query(Appointment).filter(
            Appointment.patient_id == p.id,
            Appointment.scheduled_at >= now,
            Appointment.scheduled_at <= today_end,
            Appointment.status == "scheduled",
        ).count()

        # Outstanding assessments
        esas_overdue = not last_esas or (now - last_esas.assessed_at).days > 1
        last_pps = db.query(PPSAssessment).filter(PPSAssessment.patient_id == p.id).order_by(PPSAssessment.assessed_at.desc()).first()
        pps_overdue = not last_pps or (now - last_pps.assessed_at).days > 30

        # Assigned caregivers
        assignments = db.query(CaregiverAssignment, User).join(
            User, CaregiverAssignment.caregiver_id == User.id
        ).filter(
            CaregiverAssignment.patient_id == p.id,
            CaregiverAssignment.active == True,
        ).all()

        patient_rows.append({
            "patient_id":      p.id,
            "patient_code":    p.patient_code,
            "full_name":       p.full_name,
            "age":             p.age,
            "diagnosis":       p.primary_diagnosis,
            "risk_level":      p.risk_level,
            "risk_score":      p.risk_score,
            "status":          p.status,
            "recent_alerts":   [
                {"type": a.alert_type, "severity": a.severity, "message": a.message[:80]}
                for a in recent_alerts
            ],
            "last_esas_days":  (now - last_esas.assessed_at).days if last_esas else None,
            "last_vitals_hours": round((now - last_vital.recorded_at).total_seconds() / 3600, 1) if last_vital else None,
            "appointments_today": appts_today,
            "outstanding": {
                "esas_overdue": esas_overdue,
                "pps_overdue": pps_overdue,
            },
            "assigned_caregivers": [u.full_name for _, u in assignments],
            "priority": "urgent" if any(a.severity in ("critical","high") for a in recent_alerts) or esas_overdue
                        else "normal",
        })

    # Sort: urgent first, then by risk score
    patient_rows.sort(key=lambda x: (0 if x["priority"] == "urgent" else 1, -(x["risk_score"] or 0)))

    if http_request:
        log_action(db, user=current_user, action="REPORT_MDT_HANDOVER",
                   resource_type="report", request=http_request)
    db.commit()

    return {
        "report_type":  "mdt_handover",
        "report_title": f"MDT Handover - {now.strftime('%d %b %Y, %H:%M')}",
        "generated_at": now.isoformat(),
        "generated_by": _user_dict(current_user),
        "confidentiality": "CLINICAL IN CONFIDENCE - For clinical staff only",
        "standard": "NHS Safe Handover BMA 2004 / SBAR / CQC Fundamental Standards",
        "summary": {
            "total_active_patients": len(patients),
            "urgent_patients": sum(1 for r in patient_rows if r["priority"] == "urgent"),
            "unacknowledged_alerts": sum(len(r["recent_alerts"]) for r in patient_rows),
            "esas_overdue": sum(1 for r in patient_rows if r["outstanding"]["esas_overdue"]),
        },
        "patients": patient_rows,
    }


# ── Report 11: Advance Care Plan Summary ────────────────────────────────

@router.get("/advance-care-plan/{patient_id}")
async def advance_care_plan_report(
    patient_id: int,
    http_request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Advance Care Plan Summary.
    DNR status, advance directive, preferred place of care/death, spiritual preferences.
    Standard: NICE NG31, GMC End of Life 2024, Mental Capacity Act 2005.
    """
    if current_user.role not in ("admin", "clinician", "caregiver"):
        raise HTTPException(403, "Access denied")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")

    # Get care plan
    care_plan = db.query(CarePlan).filter(
        CarePlan.patient_id == patient_id,
        CarePlan.is_current == True,
    ).order_by(CarePlan.version.desc()).first()

    # Goals
    goals = db.query(CarePlanGoal).filter(
        CarePlanGoal.patient_id == patient_id,
    ).all() if care_plan else []

    # Assigned clinician
    clinician = db.query(User).filter(User.id == patient.primary_clinician_id).first() if patient.primary_clinician_id else None

    # Caregivers
    assignments = db.query(CaregiverAssignment, User).join(
        User, CaregiverAssignment.caregiver_id == User.id
    ).filter(
        CaregiverAssignment.patient_id == patient_id,
        CaregiverAssignment.active == True,
    ).all()

    # Last PPS for functional status
    last_pps = db.query(PPSAssessment).filter(
        PPSAssessment.patient_id == patient_id
    ).order_by(PPSAssessment.assessed_at.desc()).first()

    # Last risk prediction
    prediction = db.query(Prediction).filter(
        Prediction.patient_id == patient_id
    ).order_by(Prediction.predicted_at.desc()).first()

    if http_request:
        log_action(db, user=current_user, action="REPORT_ADVANCE_CARE_PLAN",
                   resource_type="report", patient_id=patient_id,
                   request=http_request)
    db.commit()

    return {
        "report_type":  "advance_care_plan",
        "report_title": f"Advance Care Plan - {patient.full_name}",
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": _user_dict(current_user),
        "confidentiality": "STRICTLY CONFIDENTIAL - Legal document. Handle with care.",
        "standard": "NICE NG31 / GMC End of Life 2024 / Mental Capacity Act 2005",
        "patient": {
            "id": patient.id,
            "full_name": patient.full_name,
            "patient_code": patient.patient_code,
            "age": patient.age,
            "gender": patient.gender,
            "primary_diagnosis": patient.primary_diagnosis,
            "status": patient.status,
            "admission_date": patient.admission_date.isoformat() if patient.admission_date else None,
        },
        "clinical_team": {
            "primary_clinician": _user_dict(clinician) if clinician else None,
            "caregivers": [_user_dict(u) for _, u in assignments],
        },
        "advance_directives": {
            "has_advance_directive": patient.advance_directive,
            "dnr_status": patient.dnr_status,
            "preferred_language": patient.preferred_language,
            "religious_preference": patient.religious_preference,
            "note": "Advance directive and DNACPR documentation should be reviewed with patient/family and stored in the patient's legal file.",
        },
        "functional_status": {
            "pps_score": last_pps.pps_score if last_pps else None,
            "assessed_at": last_pps.assessed_at.isoformat() if last_pps else None,
            "risk_level": prediction.risk_level if prediction else None,
            "risk_score": prediction.risk_score if prediction else None,
        },
        "care_plan": {
            "version": care_plan.version if care_plan else None,
            "goals_of_care": care_plan.goals_of_care if care_plan else None,
            "pain_management_plan": care_plan.pain_management_plan if care_plan else None,
            "psychological_support": care_plan.psychological_support if care_plan else None,
            "spiritual_care": care_plan.spiritual_care if care_plan else None,
            "family_support_plan": care_plan.family_support_plan if care_plan else None,
            "advance_directives_notes": care_plan.advance_directives_notes if care_plan else None,
            "bereavement_plan": care_plan.bereavement_plan if care_plan else None,
            "review_date": care_plan.review_date.isoformat() if care_plan and care_plan.review_date else None,
            "ai_generated": care_plan.ai_generated if care_plan else False,
        } if care_plan else None,
        "goals_summary": {
            "total": len(goals),
            "by_category": {cat: sum(1 for g in goals if g.category == cat)
                           for cat in set(g.category for g in goals if g.category)},
            "achieved": sum(1 for g in goals if g.status == "achieved"),
        },
        "emergency_contact": {
            "name": patient.emergency_contact_name,
            "relationship": patient.emergency_contact_relationship,
            "phone": patient.emergency_contact_phone,
        },
    }


# ── Report 12: Bereavement & Family Outcome Report ────────────────────────

@router.get("/bereavement-outcome")
async def bereavement_outcome_report(
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
    http_request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Bereavement & Family Outcome Report.
    Tracks family engagement, PHQ-9/GAD-7 scores, journal activity, grief risk.
    Standard: NACEL 2024 Bereavement Survey, NICE NG31, CRUSE Guidelines.
    """
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(403, "Admin or clinician required")

    from src.db import PatientFamilyLink, BereavementEntry, GAD7Assessment

    now   = datetime.utcnow()
    start = _parse_date(date_from, now - timedelta(days=90))
    end   = _parse_date(date_to,   now)

    # Family users with linked patients
    family_links = db.query(PatientFamilyLink).all()

    family_outcomes = []
    at_risk_count = 0

    for link in family_links:
        family_user = db.query(User).filter(User.id == link.family_user_id).first()
        patient = db.query(Patient).filter(Patient.id == link.patient_id).first()
        if not family_user or not patient:
            continue

        # Bereavement entries
        bereavement_entries = db.query(BereavementEntry).filter(
            BereavementEntry.user_id == link.family_user_id,
            BereavementEntry.created_at >= start,
        ).count()

        # PHQ-9
        phq9 = db.query(PHQ9Assessment).filter(
            PHQ9Assessment.patient_id == link.patient_id,
        ).order_by(PHQ9Assessment.assessed_at.desc()).first()
        phq9_score = None
        if phq9:
            phq9_score = sum([getattr(phq9, f, 0) for f in [
                "little_interest","feeling_down","sleep_trouble","feeling_tired",
                "appetite_change","feeling_bad_about_self","trouble_concentrating",
                "moving_slowly_or_fidgety","thoughts_of_harm",
            ]])

        # GAD-7
        gad7 = db.query(GAD7Assessment).filter(
            GAD7Assessment.patient_id == link.patient_id,
        ).order_by(GAD7Assessment.assessed_at.desc()).first()
        gad7_score = None
        if gad7:
            gad7_score = sum([getattr(gad7, f, 0) for f in [
                "feeling_nervous","uncontrollable_worry","worrying_too_much",
                "trouble_relaxing","being_restless","easily_annoyed","feeling_afraid",
            ]])

        # High grief risk: PHQ-9 ≥15 OR GAD-7 ≥15 OR no bereavement engagement
        at_risk = (
            (phq9_score is not None and phq9_score >= 15) or
            (gad7_score is not None and gad7_score >= 15) or
            (patient.status == "deceased" and bereavement_entries == 0)
        )
        if at_risk:
            at_risk_count += 1

        family_outcomes.append({
            "family_user_id":    link.family_user_id,
            "family_name":       family_user.full_name,
            "relationship":      link.relationship,
            "patient_name":      patient.full_name,
            "patient_status":    patient.status,
            "bereavement_entries": bereavement_entries,
            "phq9_score":        phq9_score,
            "gad7_score":        gad7_score,
            "phq9_severity":     ("Minimal" if phq9_score < 5 else "Mild" if phq9_score < 10
                                  else "Moderate" if phq9_score < 15 else "Severe") if phq9_score is not None else None,
            "gad7_severity":     ("Minimal" if gad7_score < 5 else "Mild" if gad7_score < 8
                                  else "Moderate" if gad7_score < 15 else "Severe") if gad7_score is not None else None,
            "at_risk":           at_risk,
            "grief_support_needed": at_risk,
        })

    # Sort: at-risk first
    family_outcomes.sort(key=lambda x: (0 if x["at_risk"] else 1))

    if http_request:
        log_action(db, user=current_user, action="REPORT_BEREAVEMENT_OUTCOME",
                   resource_type="report", request=http_request,
                   details={"period_days": (end - start).days})
    db.commit()

    return {
        "report_type":  "bereavement_outcome",
        "report_title": "Bereavement & Family Outcome Report",
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": _user_dict(current_user),
        "period":       {"from": start.isoformat(), "to": end.isoformat()},
        "confidentiality": "CLINICAL IN CONFIDENCE - Bereavement data",
        "standard": "NACEL 2024 Bereavement Survey / NICE NG31 / CRUSE UK Guidelines",
        "summary": {
            "total_families":        len(family_outcomes),
            "at_risk_families":      at_risk_count,
            "bereaved_families":     sum(1 for f in family_outcomes if f["patient_status"] == "deceased"),
            "engaged_families":      sum(1 for f in family_outcomes if f["bereavement_entries"] > 0),
            "phq9_severe_count":     sum(1 for f in family_outcomes if f["phq9_score"] is not None and f["phq9_score"] >= 15),
        },
        "families": family_outcomes,
    }
