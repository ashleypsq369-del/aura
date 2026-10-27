"""
Care Settings Router
=====================
The 5 palliative care delivery models integrated into Project Aura:
  1. Hospital-Based Palliative Care
  2. Hospice Care
  3. Home-Based Palliative Care
  4. Outpatient (Clinic) Palliative Care
  5. Long-Term / Residential Palliative Care

Endpoints:
  GET  /api/care-settings/templates             --  all 5 setting templates
  GET  /api/care-settings/templates/{key}       --  single template detail
  GET  /api/care-settings/interactions          --  role × setting interaction matrix
  GET  /api/care-settings/patients/{pid}        --  patient's setting history
  POST /api/care-settings/patients/{pid}        --  assign patient to setting
  PUT  /api/care-settings/patients/{pid}/{id}   --  update/end assignment
  GET  /api/care-settings/dashboard             --  overview for admin/clinician
  GET  /api/care-settings/my-setting            --  patient's own current setting
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from src.db import (
    get_db, User, Patient,
    CareSettingTemplate, PatientCareSetting, CareSettingInteraction,
    CARE_SETTING_TYPES,
)
from routers.auth import get_current_user

router = APIRouter(tags=["care-settings"])


# ── Pydantic models ──────────────────────────────────────────────────────────

class AssignSettingRequest(BaseModel):
    setting_key: str
    facility_name: Optional[str] = None
    visit_frequency: Optional[str] = None
    primary_contact: Optional[str] = None
    transition_reason: Optional[str] = None
    notes: Optional[str] = None


class UpdateSettingRequest(BaseModel):
    facility_name: Optional[str] = None
    visit_frequency: Optional[str] = None
    primary_contact: Optional[str] = None
    notes: Optional[str] = None
    ended_at: Optional[datetime] = None
    ended_reason: Optional[str] = None
    is_current: Optional[bool] = None


# ── Helpers ──────────────────────────────────────────────────────────────────

def _template_to_dict(t: CareSettingTemplate) -> dict:
    return {
        "id": t.id,
        "setting_key": t.setting_key,
        "label": t.label,
        "icon": t.icon,
        "color": t.color,
        "description": t.description,
        "focus": t.focus,
        "who_it_serves": t.who_it_serves or [],
        "care_team_roles": t.care_team_roles or [],
        "key_interventions": t.key_interventions or [],
        "indicators": t.indicators or [],
        "typical_duration": t.typical_duration,
        "outcome_focus": t.outcome_focus,
        "is_active": t.is_active,
    }


def _assignment_to_dict(a: PatientCareSetting, template: CareSettingTemplate = None) -> dict:
    return {
        "id": a.id,
        "patient_id": a.patient_id,
        "setting_key": a.setting_key,
        "setting_label": template.label if template else a.setting_key,
        "setting_color": template.color if template else "gray",
        "setting_icon": template.icon if template else "Circle",
        "is_current": a.is_current,
        "facility_name": a.facility_name,
        "visit_frequency": a.visit_frequency,
        "primary_contact": a.primary_contact,
        "transition_reason": a.transition_reason,
        "notes": a.notes,
        "assigned_at": a.assigned_at.isoformat() if a.assigned_at else None,
        "ended_at": a.ended_at.isoformat() if a.ended_at else None,
        "ended_reason": a.ended_reason,
    }


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/templates")
async def get_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all 5 palliative care setting templates."""
    templates = db.query(CareSettingTemplate).filter(
        CareSettingTemplate.is_active == True
    ).all()

    # Auto-seed if empty
    if not templates:
        _seed_templates(db)
        templates = db.query(CareSettingTemplate).filter(
            CareSettingTemplate.is_active == True
        ).all()

    return {"templates": [_template_to_dict(t) for t in templates]}


@router.get("/templates/{setting_key}")
async def get_template(
    setting_key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return a single care setting template with full detail."""
    t = db.query(CareSettingTemplate).filter(
        CareSettingTemplate.setting_key == setting_key
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail=f"Care setting '{setting_key}' not found")

    # Fetch interactions for this setting
    interactions = db.query(CareSettingInteraction).filter(
        CareSettingInteraction.setting_key == setting_key
    ).all()

    interaction_map: Dict[str, List[dict]] = {}
    for ix in interactions:
        role = ix.user_role
        if role not in interaction_map:
            interaction_map[role] = []
        interaction_map[role].append({
            "interaction_type": ix.interaction_type,
            "description": ix.description,
            "system_features_used": ix.system_features_used or [],
            "frequency": ix.frequency,
            "priority": ix.priority,
        })

    return {**_template_to_dict(t), "interactions_by_role": interaction_map}


@router.get("/interactions")
async def get_interaction_matrix(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the full role × setting interaction matrix."""
    interactions = db.query(CareSettingInteraction).all()

    # Auto-seed if empty
    if not interactions:
        _seed_interactions(db)
        interactions = db.query(CareSettingInteraction).all()

    matrix: Dict[str, Dict[str, List[dict]]] = {}
    for ix in interactions:
        if ix.setting_key not in matrix:
            matrix[ix.setting_key] = {}
        if ix.user_role not in matrix[ix.setting_key]:
            matrix[ix.setting_key][ix.user_role] = []
        matrix[ix.setting_key][ix.user_role].append({
            "interaction_type": ix.interaction_type,
            "description": ix.description,
            "system_features_used": ix.system_features_used or [],
            "frequency": ix.frequency,
            "priority": ix.priority,
        })

    return {"matrix": matrix}


@router.get("/my-setting")
async def get_my_setting(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Patient  --  get their current assigned care setting."""
    if current_user.role not in ("patient", "family"):
        raise HTTPException(status_code=403, detail="Only patients and family can use this endpoint")

    from src.db import PatientFamilyLink
    patient_id = None

    if current_user.role == "patient":
        # Match patient record by username (patient_code) or full_name
        patient = (
            db.query(Patient).filter(Patient.patient_code == current_user.username).first()
            or db.query(Patient).filter(Patient.full_name == current_user.full_name).first()
        )
        if patient:
            patient_id = patient.id
        else:
            # Fallback: find via direct care setting assignment linked to user id
            assignment = db.query(PatientCareSetting).filter(
                PatientCareSetting.is_current == True,
                PatientCareSetting.patient_id == getattr(current_user, 'patient_id', None),
            ).first()
            if assignment:
                patient_id = assignment.patient_id

    elif current_user.role == "family":
        link = db.query(PatientFamilyLink).filter(
            PatientFamilyLink.family_user_id == current_user.id
        ).first()
        if link:
            patient_id = link.patient_id

    if not patient_id:
        return {"current_setting": None, "history": []}

    return await _get_patient_settings_response(patient_id, db)


@router.get("/patients/{patient_id}")
async def get_patient_settings(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get care setting history for a patient."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return await _get_patient_settings_response(patient_id, db)


async def _get_patient_settings_response(patient_id: int, db: Session) -> dict:
    assignments = db.query(PatientCareSetting).filter(
        PatientCareSetting.patient_id == patient_id
    ).order_by(PatientCareSetting.assigned_at.desc()).all()

    result = []
    for a in assignments:
        t = db.query(CareSettingTemplate).filter(
            CareSettingTemplate.setting_key == a.setting_key
        ).first()
        result.append(_assignment_to_dict(a, t))

    current = next((r for r in result if r["is_current"]), None)
    return {"current_setting": current, "history": result}


@router.post("/patients/{patient_id}")
async def assign_patient_setting(
    patient_id: int,
    body: AssignSettingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Assign a patient to a care setting (clinician/admin only)."""
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(status_code=403, detail="Only clinicians and admins can assign care settings")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    template = db.query(CareSettingTemplate).filter(
        CareSettingTemplate.setting_key == body.setting_key
    ).first()
    if not template:
        raise HTTPException(status_code=400, detail=f"Unknown care setting: {body.setting_key}")

    # Mark any previous current assignment as ended
    prev = db.query(PatientCareSetting).filter(
        PatientCareSetting.patient_id == patient_id,
        PatientCareSetting.is_current == True,
    ).first()
    if prev:
        prev.is_current = False
        prev.ended_at = datetime.utcnow()
        prev.ended_reason = body.transition_reason or "Transitioned to new setting"

    # Also update patient.care_pathway to match
    patient.care_pathway = body.setting_key
    patient.updated_at = datetime.utcnow()

    assignment = PatientCareSetting(
        patient_id=patient_id,
        setting_key=body.setting_key,
        assigned_by=current_user.id,
        is_current=True,
        facility_name=body.facility_name,
        visit_frequency=body.visit_frequency,
        primary_contact=body.primary_contact,
        transition_reason=body.transition_reason,
        notes=body.notes,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "message": f"Patient assigned to {template.label}",
        "assignment": _assignment_to_dict(assignment, template),
    }


@router.put("/patients/{patient_id}/{assignment_id}")
async def update_patient_setting(
    patient_id: int,
    assignment_id: int,
    body: UpdateSettingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update or end a care setting assignment."""
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(status_code=403, detail="Only clinicians and admins can update care settings")

    assignment = db.query(PatientCareSetting).filter(
        PatientCareSetting.id == assignment_id,
        PatientCareSetting.patient_id == patient_id,
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if body.facility_name is not None:
        assignment.facility_name = body.facility_name
    if body.visit_frequency is not None:
        assignment.visit_frequency = body.visit_frequency
    if body.primary_contact is not None:
        assignment.primary_contact = body.primary_contact
    if body.notes is not None:
        assignment.notes = body.notes
    if body.ended_at is not None:
        assignment.ended_at = body.ended_at
    if body.ended_reason is not None:
        assignment.ended_reason = body.ended_reason
    if body.is_current is not None:
        assignment.is_current = body.is_current

    db.commit()
    db.refresh(assignment)

    t = db.query(CareSettingTemplate).filter(
        CareSettingTemplate.setting_key == assignment.setting_key
    ).first()
    return {"message": "Assignment updated", "assignment": _assignment_to_dict(assignment, t)}


@router.post("/request-change")
async def request_care_setting_change(
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Patient requests a care setting change (pending admin approval). Family cannot request changes - only the patient themselves."""
    if current_user.role != "patient":
        raise HTTPException(
            status_code=403,
            detail="Only the patient can request a care setting change. "
                   "Family members should contact the care team via Messages."
        )

    new_setting = body.get("care_setting")
    reason = body.get("reason", "")

    if new_setting not in ["hospital_based", "hospice", "home_based", "outpatient_clinic", "long_term_residential"]:
        raise HTTPException(status_code=400, detail=f"Invalid care setting: {new_setting}")

    try:
        current_user.care_setting_change_request = new_setting
        current_user.care_setting_change_reason = reason
        db.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save request: {e}")

    return {
        "message": "Care setting change request submitted. An admin will review and approve it.",
        "requested_setting": new_setting,
    }


@router.get("/dashboard")
async def get_dashboard(    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin/Clinician: distribution of patients across the 5 care settings."""
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(status_code=403, detail="Access denied")

    templates = db.query(CareSettingTemplate).filter(
        CareSettingTemplate.is_active == True
    ).all()

    distribution = []
    total_assigned = 0

    for t in templates:
        count = db.query(PatientCareSetting).filter(
            PatientCareSetting.setting_key == t.setting_key,
            PatientCareSetting.is_current == True,
        ).count()
        total_assigned += count
        distribution.append({
            "setting_key": t.setting_key,
            "label": t.label,
            "icon": t.icon,
            "color": t.color,
            "patient_count": count,
            "focus": t.focus,
        })

    # Total patients without a setting
    total_patients = db.query(Patient).filter(Patient.status != "deceased").count()
    unassigned = total_patients - total_assigned

    return {
        "distribution": distribution,
        "total_patients": total_patients,
        "total_assigned": total_assigned,
        "unassigned": unassigned,
    }


# ── Seed helpers ─────────────────────────────────────────────────────────────

def _seed_templates(db: Session):
    """Populate CareSettingTemplate from CARE_SETTING_TYPES dict."""
    for key, data in CARE_SETTING_TYPES.items():
        exists = db.query(CareSettingTemplate).filter(
            CareSettingTemplate.setting_key == key
        ).first()
        if not exists:
            db.add(CareSettingTemplate(
                setting_key=key,
                label=data["label"],
                icon=data["icon"],
                color=data["color"],
                description=data["description"],
                focus=data["focus"],
                who_it_serves=data["who_it_serves"],
                care_team_roles=data["care_team_roles"],
                key_interventions=data["key_interventions"],
                indicators=data["indicators"],
                typical_duration=data["typical_duration"],
                outcome_focus=data["outcome_focus"],
                is_active=True,
            ))
    db.commit()


def _seed_interactions(db: Session):
    """
    Populate the interaction matrix  --  what every user role does in each setting.
    This is the 'database info for all users and how they interact with this system'
    requested by the user.
    """
    INTERACTIONS = [
        # ── HOSPITAL-BASED ────────────────────────────────────────────────────
        ("hospital_based", "clinician", "Acute Symptom Assessment", "Conduct urgent ESAS and PPS assessments at bedside for newly admitted patients with acute symptom crisis", ["PatientMonitor", "ESASForm", "PPSForm"], "per-admission", "critical"),
        ("hospital_based", "clinician", "Pain Crisis Management", "Review and escalate pain medications using WHO ladder; prescribe breakthrough doses; log in Medications page", ["Medications", "PatientMonitor", "CarePlan"], "daily", "critical"),
        ("hospital_based", "clinician", "Goals-of-Care Discussion", "Facilitate family meetings to clarify treatment goals; document advance directives; update DNR status", ["Patients", "CarePlan", "Messages"], "per-admission", "critical"),
        ("hospital_based", "clinician", "Care Plan Generation", "AI-generate or manually build inpatient care plan covering pain, psychological, spiritual, and family domains", ["CarePlanDetail", "CareGuide"], "per-admission", "high"),
        ("hospital_based", "clinician", "Transition Planning", "Plan discharge to home, hospice, or outpatient setting; coordinate with community teams", ["Appointments", "Patients", "Messages"], "daily", "high"),
        ("hospital_based", "nurse", "Vital Signs Monitoring", "Log hourly or 4-hourly vitals using PatientMonitor; flag critical readings for clinician review", ["PatientMonitor"], "daily", "critical"),
        ("hospital_based", "nurse", "Symptom Logging", "Record patient-reported symptoms including pain, nausea, anxiety, dyspnea every shift", ["PatientMonitor"], "daily", "high"),
        ("hospital_based", "nurse", "Medication Administration", "Administer and log medications; record adherence; flag missed doses", ["Medications"], "daily", "critical"),
        ("hospital_based", "caregiver", "Family Liaison", "Provide families with daily updates; relay concerns to clinical team via Messages", ["Messages", "Caregivers"], "daily", "high"),
        ("hospital_based", "patient", "Symptom Self-Report", "Record own pain and symptom levels from patient portal or tablet at bedside", ["MyJourney", "PersonalisationQuest"], "daily", "high"),
        ("hospital_based", "family", "Crisis Support Access", "Access emergency contacts, chaplain, and social worker directly through Messages", ["Messages", "Resources"], "as-needed", "high"),
        ("hospital_based", "admin", "Inpatient Bed Management", "Track which patients are in which settings; view distribution dashboard; reassign caregivers", ["CareSettings", "Patients", "Caregivers"], "daily", "medium"),

        # ── HOSPICE ───────────────────────────────────────────────────────────
        ("hospice", "clinician", "End-of-Life Care Plan", "Generate and maintain comfort-focused care plan; remove curative interventions; focus on dignity and pain control", ["CarePlanDetail", "CareGuide", "Medications"], "weekly", "critical"),
        ("hospice", "clinician", "Spiritual & Psychological Assessment", "Complete PHQ-9, GAD-7, and spiritual wellbeing assessment; refer to chaplain or bereavement counsellor", ["MentalHealthForm", "PatientMonitor", "Messages"], "weekly", "critical"),
        ("hospice", "clinician", "Advance Directive Review", "Review and update DNR status, preferred place of death, and advance care plan with patient and family", ["Patients", "CarePlan"], "per-review", "critical"),
        ("hospice", "clinician", "Bereavement Preparation", "Initiate post-death support schedule; introduce family to bereavement resources", ["BereavedFamilyDashboard", "Resources", "Messages"], "monthly", "high"),
        ("hospice", "nurse", "Comfort Round Monitoring", "Complete ESAS every 24 hours; assess mouth care, pressure areas, and position changes", ["PatientMonitor", "ESASForm"], "daily", "critical"),
        ("hospice", "nurse", "Symptom Crisis Response", "Respond to acute pain, breathlessness, or distress; administer PRN medications; escalate to on-call clinician", ["PatientMonitor", "Medications", "Alerts"], "as-needed", "critical"),
        ("hospice", "caregiver", "Personal Care Support", "Assist with hygiene, positioning, and comfort measures; log care tasks in Caregivers module", ["Caregivers", "Medications"], "daily", "high"),
        ("hospice", "patient", "Memory & Legacy Creation", "Record voice messages, write letters, or add memories to Memory Vault for family", ["MemoryVault", "LegacyContentCreator", "Journal"], "as-needed", "medium"),
        ("hospice", "patient", "Legacy Planning", "Set up digital legacy, designate heirs, and create final messages for loved ones", ["LegacySetup", "HeirManagement", "LegacyContentCreator"], "once", "medium"),
        ("hospice", "family", "Bereavement Support Access", "Access grief resources, join community support groups, and complete grief screening tools", ["BereavedFamilyDashboard", "CommunityHub", "Resources"], "weekly", "high"),
        ("hospice", "family", "Memory Vault Contribution", "Add shared memories to the patient's Memory Vault; access legacy content", ["MemoryVault", "MyLegacyAccess"], "as-needed", "medium"),
        ("hospice", "family", "Continuity Bridge", "Access continuity of care information; contact care team; review patient's journey", ["ContinuityBridge", "Messages"], "weekly", "high"),
        ("hospice", "admin", "Hospice Capacity Planning", "Monitor patient census; ensure staffing ratios; track bereavement programme enrollment", ["CareSettings", "Patients", "AdminUserManagement"], "weekly", "medium"),

        # ── HOME-BASED ────────────────────────────────────────────────────────
        ("home_based", "clinician", "Remote Patient Monitoring", "Review vitals and symptom logs submitted by patient or family from home; respond via Messages", ["PatientMonitor", "Messages", "Alerts"], "daily", "high"),
        ("home_based", "clinician", "Home Visit Care Plan Review", "Update care plan following home visit; adjust medications; document clinical notes", ["CarePlanDetail", "Medications", "Patients"], "weekly", "high"),
        ("home_based", "clinician", "Caregiver Burden Assessment", "Administer Zarit Burden Interview to family caregiver; review results and offer support", ["CaregiverBurdenForm", "Messages"], "monthly", "high"),
        ("home_based", "nurse", "Home Visit Vital Signs", "Attend patient home to log vitals, ESAS, and wound care; upload results from mobile", ["PatientMonitor", "ESASForm"], "weekly", "high"),
        ("home_based", "nurse", "Medication Review at Home", "Review medication stock, adherence, and side effects during home visit; log in Medications", ["Medications", "PatientMonitor"], "weekly", "high"),
        ("home_based", "caregiver", "Daily Home Care Logging", "Log daily care activities, patient comfort level, and any concerns via Caregivers module", ["Caregivers", "Messages"], "daily", "high"),
        ("home_based", "caregiver", "Crisis Escalation", "Identify and escalate acute symptoms or emergencies to clinical team immediately via Alerts/Messages", ["Messages", "Alerts"], "as-needed", "critical"),
        ("home_based", "patient", "Self-Reported Symptom Diary", "Submit daily symptom diary from My Journey page; include pain, mood, sleep, and appetite", ["MyJourney", "Journal"], "daily", "high"),
        ("home_based", "patient", "Medication Reminder Tracking", "Confirm medication taken or skip via adherence log; access instructions from Medications page", ["Medications"], "daily", "high"),
        ("home_based", "patient", "AI Companion Chat", "Use Aura AI chatbot for symptom questions, emotional support, and care guidance at home", ["AuraChat"], "daily", "medium"),
        ("home_based", "family", "Caregiver Support Resources", "Access practical guides for home caregiving; connect with peer support in Community Hub", ["Resources", "CommunityHub", "Messages"], "weekly", "medium"),
        ("home_based", "family", "Emergency Contact Quick Access", "Access emergency numbers, on-call clinician, and crisis resources from any page", ["Resources", "Messages"], "as-needed", "critical"),
        ("home_based", "admin", "Home Visit Scheduling", "Coordinate home visit scheduling for nurses and community physicians via Appointments", ["Appointments", "Caregivers", "CareSettings"], "weekly", "medium"),

        # ── OUTPATIENT CLINIC ─────────────────────────────────────────────────
        ("outpatient_clinic", "clinician", "Pre-Clinic Patient Review", "Review latest vitals, symptoms, medications, and ESAS scores before scheduled appointment", ["PatientMonitor", "Patients", "Appointments"], "per-visit", "high"),
        ("outpatient_clinic", "clinician", "Clinic Consultation & Care Plan Update", "Conduct appointment; adjust medications and care plan; update goals of care", ["Appointments", "Medications", "CarePlanDetail"], "per-visit", "critical"),
        ("outpatient_clinic", "clinician", "Symptom Assessment Battery", "Administer ESAS, PHQ-9, GAD-7, and PPS at each clinic visit; compare trends over time", ["ESASForm", "MentalHealthForm", "PPSForm", "AssessmentDashboard"], "per-visit", "high"),
        ("outpatient_clinic", "clinician", "Specialist Referral Coordination", "Refer to physiotherapy, dietetics, psychology, or specialist palliative care via Appointments", ["Appointments", "Messages"], "as-needed", "medium"),
        ("outpatient_clinic", "nurse", "Pre-Clinic Assessment", "Take vitals, weight, and pain score before patient sees clinician; log in PatientMonitor", ["PatientMonitor"], "per-visit", "high"),
        ("outpatient_clinic", "nurse", "Patient Education", "Provide medication education, symptom management tips, and self-care instructions at each visit", ["Resources", "Medications"], "per-visit", "medium"),
        ("outpatient_clinic", "patient", "Appointment Preparation", "Review upcoming appointment details; prepare symptom questions; complete pre-clinic ESAS", ["Appointments", "ESASForm", "MyJourney"], "per-visit", "high"),
        ("outpatient_clinic", "patient", "Post-Clinic Follow-Up", "Log how you felt after clinic; update symptom diary; message care team with questions", ["Journal", "MyJourney", "Messages"], "per-visit", "medium"),
        ("outpatient_clinic", "family", "Appointment Attendance Support", "Join appointments to ask questions; receive care team updates via Messages", ["Messages", "Appointments"], "per-visit", "medium"),
        ("outpatient_clinic", "admin", "Appointment Scheduling", "Manage clinic appointment calendar; send reminders; handle cancellations and rescheduling", ["Appointments", "Patients", "AdminUserManagement"], "daily", "high"),

        # ── LONG-TERM RESIDENTIAL ─────────────────────────────────────────────
        ("long_term_residential", "clinician", "Resident Care Plan Review", "Conduct monthly or quarterly care plan reviews; adjust goals as functional status changes", ["CarePlanDetail", "CareGuide", "AssessmentDashboard"], "monthly", "high"),
        ("long_term_residential", "clinician", "Barthel Index & Cognitive Assessment", "Assess ADL independence and cognitive function to track decline and adjust care plans", ["BarthelIndexForm", "CognitiveAssessmentForm", "AssessmentDashboard"], "monthly", "high"),
        ("long_term_residential", "clinician", "Quality of Life Monitoring", "Complete FACT-G QoL assessment; compare trends; adjust psychosocial support accordingly", ["QualityOfLifeForm", "PatientMonitor"], "monthly", "medium"),
        ("long_term_residential", "nurse", "Daily Resident Monitoring", "Log daily vitals, food intake, skin integrity, and symptom changes for all residents", ["PatientMonitor", "ESASForm"], "daily", "high"),
        ("long_term_residential", "nurse", "Medication Administration", "Administer and log all scheduled and PRN medications; flag any refused medications", ["Medications"], "daily", "critical"),
        ("long_term_residential", "nurse", "Incident & Falls Reporting", "Document any incidents, falls, or changes in condition; flag for clinician review", ["PatientMonitor", "Alerts"], "as-needed", "critical"),
        ("long_term_residential", "caregiver", "Personal Care Assistance", "Provide daily hygiene, dressing, and mobility assistance; log completed tasks", ["Caregivers"], "daily", "high"),
        ("long_term_residential", "caregiver", "Activity & Engagement Logging", "Document social activities, exercises, and engagement completed by resident", ["Caregivers", "PatientMonitor"], "daily", "medium"),
        ("long_term_residential", "patient", "Wellbeing Check-In", "Complete daily or weekly wellbeing check-in using simple emoji/score scale in My Space", ["MySpace", "MyJourney"], "weekly", "medium"),
        ("long_term_residential", "patient", "Community Connection", "Join virtual community support groups and peer forums from the Community Hub", ["CommunityHub", "Messages"], "weekly", "low"),
        ("long_term_residential", "family", "Regular Family Updates", "Receive weekly care summaries; request care team meetings; access Memory Vault", ["Messages", "MemoryVault", "ContinuityBridge"], "weekly", "medium"),
        ("long_term_residential", "family", "Advance Care Planning Involvement", "Participate in advance care planning discussions; review and update family wishes", ["Messages", "Resources"], "monthly", "high"),
        ("long_term_residential", "admin", "Residential Census Management", "Monitor all residents' care settings; track care dependency levels; manage staffing", ["CareSettings", "Patients", "Caregivers", "AdminUserManagement"], "daily", "high"),
        ("long_term_residential", "admin", "Compliance & Audit", "Review care documentation for regulatory compliance; run audit logs; export reports", ["AuditLog", "HIPAACompliance"], "weekly", "medium"),
    ]

    for (setting_key, role, interaction_type, description, features, frequency, priority) in INTERACTIONS:
        exists = db.query(CareSettingInteraction).filter(
            CareSettingInteraction.setting_key == setting_key,
            CareSettingInteraction.user_role == role,
            CareSettingInteraction.interaction_type == interaction_type,
        ).first()
        if not exists:
            db.add(CareSettingInteraction(
                setting_key=setting_key,
                user_role=role,
                interaction_type=interaction_type,
                description=description,
                system_features_used=features,
                frequency=frequency,
                priority=priority,
            ))
    db.commit()
