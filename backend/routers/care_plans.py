"""
Care Plans Router  --  Full Implementation
=========================================
Endpoints:
  GET  /api/care-plans/{patient_id}               --  get full care plan with goals + interventions
  POST /api/care-plans/{patient_id}/generate      --  AI-generate / regenerate care plan
  PUT  /api/care-plans/{patient_id}               --  update care plan text fields
  POST /api/care-plans/{patient_id}/goals         --  add a goal
  PUT  /api/care-plans/{patient_id}/goals/{id}    --  update a goal
  DELETE /api/care-plans/{patient_id}/goals/{id}  --  delete a goal
  POST /api/care-plans/{patient_id}/goals/{id}/checklist        --  add checklist item
  PUT  /api/care-plans/{patient_id}/goals/{id}/checklist/{cid}  --  update checklist item
  DELETE /api/care-plans/{patient_id}/goals/{id}/checklist/{cid}
  POST /api/care-plans/{patient_id}/interventions         --  add intervention
  PUT  /api/care-plans/{patient_id}/interventions/{id}    --  update intervention
  DELETE /api/care-plans/{patient_id}/interventions/{id}
  GET  /api/care-plans/{patient_id}/guide         --  get disease-specific care guide
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from src.db import (
    get_db, User, Patient, CarePlan, Vital, Symptom, Medication,
    ESASAssessment, PPSAssessment, PHQ9Assessment, GAD7Assessment,
    BarthelIndexAssessment, CognitiveAssessment, PainAssessment,
    CaregiverBurdenAssessment, PatientPreferences,
)
from routers.auth import get_current_user
from services.care_plan_engine import generate_full_care_plan, detect_disease_profile

router = APIRouter()

# ── Try to import extended tables ──────────────────────────────────────────
try:
    from src.db import CarePlanGoal, CarePlanChecklistItem, CarePlanIntervention
    EXTENDED_TABLES = True
except ImportError:
    EXTENDED_TABLES = False
    print("⚠️  care_plans: extended tables not found  --  goals/checklist/interventions disabled")


# ═══════════════════════════════════════════════════════════════════════════
# PYDANTIC MODELS
# ═══════════════════════════════════════════════════════════════════════════

class CarePlanUpdate(BaseModel):
    goals_of_care: Optional[str] = None
    pain_management_plan: Optional[str] = None
    psychological_support: Optional[str] = None
    spiritual_care: Optional[str] = None
    family_support_plan: Optional[str] = None
    advance_directives_notes: Optional[str] = None
    bereavement_plan: Optional[str] = None
    overall_notes: Optional[str] = None
    care_phase: Optional[str] = None
    review_date: Optional[datetime] = None


class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "symptom"
    priority: str = "medium"
    target_date: Optional[datetime] = None
    notes: Optional[str] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = None
    target_date: Optional[datetime] = None
    notes: Optional[str] = None


class ChecklistCreate(BaseModel):
    task: str
    frequency: str = "daily"
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class ChecklistUpdate(BaseModel):
    task: Optional[str] = None
    frequency: Optional[str] = None
    is_completed: Optional[bool] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class InterventionCreate(BaseModel):
    name: str
    category: str = "therapy"
    description: Optional[str] = None
    frequency: Optional[str] = None
    responsible_role: Optional[str] = "clinician"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    notes: Optional[str] = None


class InterventionUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[str] = None
    responsible_role: Optional[str] = None
    status: Optional[str] = None
    outcome: Optional[str] = None
    end_date: Optional[datetime] = None


# ═══════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════

def _get_or_create_plan(patient_id: int, user_id: int, db: Session) -> CarePlan:
    plan = db.query(CarePlan).filter(
        CarePlan.patient_id == patient_id, CarePlan.is_current == True
    ).first()
    if not plan:
        plan = CarePlan(patient_id=patient_id, created_by=user_id)
        db.add(plan)
        db.commit()
        db.refresh(plan)
    return plan


def _collect_patient_data(patient_id: int, db: Session) -> Dict[str, Any]:
    """Gather all available patient data for the AI engine."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return {}

    data: Dict[str, Any] = {
        "full_name":     patient.full_name,
        "diagnosis":     patient.primary_diagnosis or "",
        "age":           patient.age,
        "gender":        patient.gender,
        "risk_score":    patient.risk_score,
        "status":        patient.status,
        "advance_directive": patient.advance_directive,
        "dnr_status":    patient.dnr_status,
        "religious_preference": patient.religious_preference,
        "language":      patient.preferred_language,
    }

    # Latest ESAS
    esas = db.query(ESASAssessment).filter(
        ESASAssessment.patient_id == patient_id
    ).order_by(ESASAssessment.assessed_at.desc()).first()
    if esas:
        data.update({
            "esas_pain":               esas.pain or 0,
            "esas_tiredness":          esas.tiredness or 0,
            "esas_nausea":             esas.nausea or 0,
            "esas_depression":         esas.depression or 0,
            "esas_anxiety":            esas.anxiety or 0,
            "esas_shortness_of_breath": esas.shortness_of_breath or 0,
            "esas_wellbeing":          esas.wellbeing or 5,
            "esas_drowsiness":         esas.drowsiness or 0,
            "esas_lack_of_appetite":   esas.lack_of_appetite or 0,
        })

    # Latest PPS
    pps = db.query(PPSAssessment).filter(
        PPSAssessment.patient_id == patient_id
    ).order_by(PPSAssessment.assessed_at.desc()).first()
    if pps:
        data["pps_score"] = pps.pps_score

    # Latest PHQ-9
    phq9 = db.query(PHQ9Assessment).filter(
        PHQ9Assessment.patient_id == patient_id
    ).order_by(PHQ9Assessment.assessed_at.desc()).first()
    if phq9:
        data["phq9_total"]    = phq9.total_score or 0
        data["phq9_severity"] = phq9.severity
        data["phq9_harm_item"] = phq9.thoughts_of_harm or 0

    # Latest GAD-7
    gad7 = db.query(GAD7Assessment).filter(
        GAD7Assessment.patient_id == patient_id
    ).order_by(GAD7Assessment.assessed_at.desc()).first()
    if gad7:
        data["gad7_total"]    = gad7.total_score or 0
        data["gad7_severity"] = gad7.severity

    # Latest Barthel
    barthel = db.query(BarthelIndexAssessment).filter(
        BarthelIndexAssessment.patient_id == patient_id
    ).order_by(BarthelIndexAssessment.assessed_at.desc()).first()
    if barthel:
        data["barthel_total"] = barthel.total_score

    # Latest Cognitive
    cog = db.query(CognitiveAssessment).filter(
        CognitiveAssessment.patient_id == patient_id
    ).order_by(CognitiveAssessment.assessed_at.desc()).first()
    if cog:
        data["mmse_total"] = cog.mmse_total
        data["moca_total"] = cog.moca_total
        data["cognitive_interpretation"] = cog.interpretation

    # Latest Pain Assessment
    pain_a = db.query(PainAssessment).filter(
        PainAssessment.patient_id == patient_id
    ).order_by(PainAssessment.assessed_at.desc()).first()
    if pain_a:
        data["pain_worst"]   = pain_a.pain_worst
        data["pain_average"] = pain_a.pain_average

    # Latest Caregiver Burden
    careb = db.query(CaregiverBurdenAssessment).filter(
        CaregiverBurdenAssessment.patient_id == patient_id
    ).order_by(CaregiverBurdenAssessment.assessed_at.desc()).first()
    if careb:
        data["caregiver_burden_total"] = careb.total_score

    # Latest vitals
    vital = db.query(Vital).filter(
        Vital.patient_id == patient_id
    ).order_by(Vital.recorded_at.desc()).first()
    if vital:
        data["latest_vitals"] = {
            "heart_rate":        vital.heart_rate,
            "blood_pressure_sys": vital.blood_pressure_sys,
            "o2_sat":            vital.oxygen_saturation,
            "temperature":       vital.temperature,
            "resp_rate":         vital.respiratory_rate,
        }

    # Active medications
    meds = db.query(Medication).filter(
        Medication.patient_id == patient_id,
        Medication.is_active == True,
    ).all()
    data["active_medications"] = [m.name for m in meds]

    # Patient preferences
    prefs = db.query(PatientPreferences).filter(
        PatientPreferences.user_id == patient_id
    ).first()
    if prefs:
        data["preferences"] = {
            "info_style":   prefs.info_style,
            "care_priorities": prefs.care_priorities,
        }

    # ── Care Setting ─────────────────────────────────────────────────────
    # Pull patient's current assigned care setting so the AI engine can
    # adapt the care plan to the delivery context (hospital vs hospice vs home etc.)
    try:
        from src.db import PatientCareSetting, CareSettingTemplate, CARE_SETTING_TYPES
        assignment = db.query(PatientCareSetting).filter(
            PatientCareSetting.patient_id == patient_id,
            PatientCareSetting.is_current == True,
        ).first()
        if assignment:
            template = db.query(CareSettingTemplate).filter(
                CareSettingTemplate.setting_key == assignment.setting_key
            ).first()
            data["care_setting"] = {
                "key":             assignment.setting_key,
                "label":           template.label if template else assignment.setting_key,
                "focus":           template.focus if template else "",
                "facility":        assignment.facility_name or "",
                "visit_frequency": assignment.visit_frequency or "",
                "key_interventions": (template.key_interventions or []) if template else [],
                "typical_duration":  (template.typical_duration or "") if template else "",
                "outcome_focus":     (template.outcome_focus or "") if template else "",
            }
        else:
            data["care_setting"] = None
    except Exception:
        data["care_setting"] = None

    return data


def _serialise_plan(plan: CarePlan, db: Session) -> Dict:
    goals_data = []
    interventions_data = []
    if EXTENDED_TABLES:
        goals = db.query(CarePlanGoal).filter(
            CarePlanGoal.care_plan_id == plan.id
        ).order_by(CarePlanGoal.priority, CarePlanGoal.created_at).all()
        for g in goals:
            items = db.query(CarePlanChecklistItem).filter(
                CarePlanChecklistItem.goal_id == g.id
            ).order_by(CarePlanChecklistItem.created_at).all()
            goals_data.append({
                "id": g.id,
                "title": g.title,
                "description": g.description,
                "category": g.category,
                "priority": g.priority,
                "status": g.status,
                "progress": g.progress,
                "target_date": g.target_date.isoformat() if g.target_date else None,
                "achieved_date": g.achieved_date.isoformat() if g.achieved_date else None,
                "ai_suggested": g.ai_suggested,
                "notes": g.notes,
                "checklist": [{
                    "id": c.id,
                    "task": c.task,
                    "frequency": c.frequency,
                    "is_completed": c.is_completed,
                    "completed_at": c.completed_at.isoformat() if c.completed_at else None,
                    "due_date": c.due_date.isoformat() if c.due_date else None,
                    "notes": c.notes,
                } for c in items],
            })

        ivs = db.query(CarePlanIntervention).filter(
            CarePlanIntervention.care_plan_id == plan.id,
            CarePlanIntervention.status != "discontinued",
        ).order_by(CarePlanIntervention.created_at).all()
        for iv in ivs:
            interventions_data.append({
                "id": iv.id,
                "name": iv.name,
                "category": iv.category,
                "description": iv.description,
                "frequency": iv.frequency,
                "responsible_role": iv.responsible_role,
                "start_date": iv.start_date.isoformat() if iv.start_date else None,
                "end_date": iv.end_date.isoformat() if iv.end_date else None,
                "status": iv.status,
                "ai_suggested": iv.ai_suggested,
                "outcome": iv.outcome,
            })

    return {
        "care_plan": {
            "id": plan.id,
            "patient_id": plan.patient_id,
            "version": plan.version,
            "is_current": plan.is_current,
            "goals_of_care": plan.goals_of_care,
            "pain_management_plan": plan.pain_management_plan,
            "psychological_support": plan.psychological_support,
            "spiritual_care": plan.spiritual_care,
            "family_support_plan": plan.family_support_plan,
            "advance_directives_notes": plan.advance_directives_notes,
            "bereavement_plan": plan.bereavement_plan,
            "overall_notes": plan.overall_notes,
            "care_phase": plan.care_phase,
            "disease_profile": plan.disease_profile,
            "ai_generated": plan.ai_generated,
            "ai_generated_at": plan.ai_generated_at.isoformat() if plan.ai_generated_at else None,
            "ai_confidence": plan.ai_confidence,
            "review_date": plan.review_date.isoformat() if plan.review_date else None,
            "created_at": plan.created_at.isoformat() if plan.created_at else None,
            "updated_at": plan.updated_at.isoformat() if plan.updated_at else None,
            "goals": goals_data,
            "interventions": interventions_data,
        }
    }


# ═══════════════════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/{patient_id}")
async def get_care_plan(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current care plan with all goals, checklists, and interventions."""
    plan = _get_or_create_plan(patient_id, current_user.id, db)
    return _serialise_plan(plan, db)


@router.post("/{patient_id}/generate")
async def generate_care_plan(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    AI-generate or regenerate the care plan for this patient.
    Analyses all available patient data and produces:
    - Full care plan text across all 7 domains
    - Prioritised goals list
    - Standard interventions
    - Checklist items per goal
    """
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(status_code=403, detail="Clinician access required to generate care plans")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Collect all patient data
    patient_data = _collect_patient_data(patient_id, db)

    # Get existing plan for context
    existing_plan = db.query(CarePlan).filter(
        CarePlan.patient_id == patient_id, CarePlan.is_current == True
    ).first()
    existing_ctx = {}
    if existing_plan and EXTENDED_TABLES:
        existing_ctx["goals"] = [{
            "title": g.title,
            "category": g.category,
        } for g in db.query(CarePlanGoal).filter(CarePlanGoal.care_plan_id == existing_plan.id).all()]
        existing_ctx["interventions"] = [{
            "name": iv.name,
        } for iv in db.query(CarePlanIntervention).filter(
            CarePlanIntervention.care_plan_id == existing_plan.id,
            CarePlanIntervention.status == "active",
        ).all()]

    # Generate
    result = generate_full_care_plan(patient_data, existing_ctx)

    # Create new version of care plan
    if existing_plan:
        existing_plan.is_current = False
        db.commit()

    plan = CarePlan(
        patient_id=patient_id,
        created_by=current_user.id,
        version=(existing_plan.version + 1) if existing_plan else 1,
        is_current=True,
        review_date=datetime.utcnow() + timedelta(days=7),
        **result["care_plan_fields"],
    )
    db.add(plan)
    db.flush()

    created_goals = []
    created_interventions = []

    if EXTENDED_TABLES:
        # Persist goals + checklists
        for g in result["goals"]:
            goal = CarePlanGoal(
                care_plan_id=plan.id,
                patient_id=patient_id,
                created_by=current_user.id,
                **{k: v for k, v in g.items() if k not in ("description",)},
                description=g.get("description"),
            )
            db.add(goal)
            db.flush()
            created_goals.append(goal.id)

            for item in result["checklists_per_goal"].get(g["title"], []):
                cl = CarePlanChecklistItem(
                    goal_id=goal.id,
                    patient_id=patient_id,
                    task=item["task"],
                    frequency=item["frequency"],
                )
                db.add(cl)

        # Persist interventions
        for iv in result["interventions"]:
            intervention = CarePlanIntervention(
                care_plan_id=plan.id,
                patient_id=patient_id,
                created_by=current_user.id,
                **iv,
            )
            db.add(intervention)
            db.flush()
            created_interventions.append(intervention.id)

    db.commit()
    db.refresh(plan)

    serialised = _serialise_plan(plan, db)
    serialised["ai_insights"] = result["insights"]
    serialised["guide_sections"] = result.get("guide_sections", [])
    serialised["monitoring_schedule"] = result.get("monitoring_schedule", "")
    serialised["red_flags"] = result.get("red_flags", [])
    serialised["generated_goals_count"] = len(result["goals"])
    serialised["generated_interventions_count"] = len(result["interventions"])
    serialised["confidence"] = result["confidence"]
    return serialised


@router.put("/{patient_id}")
async def update_care_plan(
    patient_id: int,
    update: CarePlanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(status_code=403, detail="Clinician access required")
    plan = _get_or_create_plan(patient_id, current_user.id, db)
    for field, value in update.dict(exclude_none=True).items():
        setattr(plan, field, value)
    plan.updated_at = datetime.utcnow()
    db.commit()
    return _serialise_plan(plan, db)


# ── Goals ──────────────────────────────────────────────────────────────────

@router.post("/{patient_id}/goals")
async def add_goal(
    patient_id: int,
    goal: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not EXTENDED_TABLES:
        raise HTTPException(status_code=501, detail="Goal tables not available")
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(status_code=403, detail="Clinician access required")
    plan = _get_or_create_plan(patient_id, current_user.id, db)
    new_goal = CarePlanGoal(
        care_plan_id=plan.id,
        patient_id=patient_id,
        created_by=current_user.id,
        **goal.dict(),
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return {"id": new_goal.id, "message": "Goal added", "goal": {
        "id": new_goal.id, "title": new_goal.title,
        "category": new_goal.category, "priority": new_goal.priority,
        "status": new_goal.status, "progress": new_goal.progress,
    }}


@router.put("/{patient_id}/goals/{goal_id}")
async def update_goal(
    patient_id: int,
    goal_id: int,
    update: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not EXTENDED_TABLES:
        raise HTTPException(status_code=501, detail="Goal tables not available")
    goal = db.query(CarePlanGoal).filter(
        CarePlanGoal.id == goal_id, CarePlanGoal.patient_id == patient_id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for field, value in update.dict(exclude_none=True).items():
        setattr(goal, field, value)
    if update.status == "achieved" and not goal.achieved_date:
        goal.achieved_date = datetime.utcnow()
        goal.progress = 100
    goal.updated_at = datetime.utcnow()
    goal.last_reviewed_by = current_user.id
    db.commit()
    return {"message": "Goal updated", "goal_id": goal_id}


@router.delete("/{patient_id}/goals/{goal_id}")
async def delete_goal(
    patient_id: int,
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not EXTENDED_TABLES:
        raise HTTPException(status_code=501, detail="Goal tables not available")
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(status_code=403, detail="Clinician access required")
    goal = db.query(CarePlanGoal).filter(
        CarePlanGoal.id == goal_id, CarePlanGoal.patient_id == patient_id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.query(CarePlanChecklistItem).filter(CarePlanChecklistItem.goal_id == goal_id).delete()
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted"}


# ── Checklist ──────────────────────────────────────────────────────────────

@router.post("/{patient_id}/goals/{goal_id}/checklist")
async def add_checklist_item(
    patient_id: int,
    goal_id: int,
    item: ChecklistCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not EXTENDED_TABLES:
        raise HTTPException(status_code=501, detail="Checklist tables not available")
    goal = db.query(CarePlanGoal).filter(
        CarePlanGoal.id == goal_id, CarePlanGoal.patient_id == patient_id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    new_item = CarePlanChecklistItem(
        goal_id=goal_id, patient_id=patient_id, **item.dict()
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return {"id": new_item.id, "message": "Checklist item added"}


@router.put("/{patient_id}/goals/{goal_id}/checklist/{item_id}")
async def update_checklist_item(
    patient_id: int,
    goal_id: int,
    item_id: int,
    update: ChecklistUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not EXTENDED_TABLES:
        raise HTTPException(status_code=501, detail="Checklist tables not available")
    item = db.query(CarePlanChecklistItem).filter(
        CarePlanChecklistItem.id == item_id,
        CarePlanChecklistItem.goal_id == goal_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    for field, value in update.dict(exclude_none=True).items():
        setattr(item, field, value)
    if update.is_completed and not item.completed_at:
        item.completed_at = datetime.utcnow()
        item.completed_by = current_user.id
    db.commit()

    # Auto-update goal progress
    all_items = db.query(CarePlanChecklistItem).filter(
        CarePlanChecklistItem.goal_id == goal_id
    ).all()
    if all_items:
        done = sum(1 for i in all_items if i.is_completed)
        goal = db.query(CarePlanGoal).filter(CarePlanGoal.id == goal_id).first()
        if goal:
            goal.progress = round((done / len(all_items)) * 100)
            db.commit()

    return {"message": "Checklist item updated"}


@router.delete("/{patient_id}/goals/{goal_id}/checklist/{item_id}")
async def delete_checklist_item(
    patient_id: int,
    goal_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not EXTENDED_TABLES:
        raise HTTPException(status_code=501, detail="Checklist tables not available")
    item = db.query(CarePlanChecklistItem).filter(
        CarePlanChecklistItem.id == item_id,
        CarePlanChecklistItem.goal_id == goal_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Item deleted"}


# ── Interventions ──────────────────────────────────────────────────────────

@router.post("/{patient_id}/interventions")
async def add_intervention(
    patient_id: int,
    iv: InterventionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not EXTENDED_TABLES:
        raise HTTPException(status_code=501, detail="Intervention tables not available")
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(status_code=403, detail="Clinician access required")
    plan = _get_or_create_plan(patient_id, current_user.id, db)
    new_iv = CarePlanIntervention(
        care_plan_id=plan.id,
        patient_id=patient_id,
        created_by=current_user.id,
        **iv.dict(),
    )
    db.add(new_iv)
    db.commit()
    db.refresh(new_iv)
    return {"id": new_iv.id, "message": "Intervention added"}


@router.put("/{patient_id}/interventions/{iv_id}")
async def update_intervention(
    patient_id: int,
    iv_id: int,
    update: InterventionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not EXTENDED_TABLES:
        raise HTTPException(status_code=501, detail="Intervention tables not available")
    iv = db.query(CarePlanIntervention).filter(
        CarePlanIntervention.id == iv_id,
        CarePlanIntervention.patient_id == patient_id,
    ).first()
    if not iv:
        raise HTTPException(status_code=404, detail="Intervention not found")
    for field, value in update.dict(exclude_none=True).items():
        setattr(iv, field, value)
    iv.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Intervention updated"}


@router.delete("/{patient_id}/interventions/{iv_id}")
async def delete_intervention(
    patient_id: int,
    iv_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not EXTENDED_TABLES:
        raise HTTPException(status_code=501, detail="Intervention tables not available")
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(status_code=403, detail="Clinician access required")
    iv = db.query(CarePlanIntervention).filter(
        CarePlanIntervention.id == iv_id,
        CarePlanIntervention.patient_id == patient_id,
    ).first()
    if not iv:
        raise HTTPException(status_code=404, detail="Intervention not found")
    iv.status = "discontinued"
    db.commit()
    return {"message": "Intervention discontinued"}


# ── Care Guide ────────────────────────────────────────────────────────────

@router.get("/{patient_id}/guide")
async def get_care_guide(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get disease-specific care guide for this patient."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    from services.care_plan_engine import (
        detect_disease_profile, DISEASE_PROFILES, determine_care_phase, analyse_patient_data
    )
    patient_data = _collect_patient_data(patient_id, db)
    disease_name, disease_prof = detect_disease_profile(patient.primary_diagnosis or "")
    care_phase = determine_care_phase(patient_data)
    insights = analyse_patient_data(patient_data)

    return {
        "patient_id":   patient_id,
        "patient_name": patient.full_name,
        "diagnosis":    patient.primary_diagnosis,
        "disease_profile": disease_name,
        "care_phase":   care_phase,
        "guide_sections": disease_prof.get("guide_sections", []),
        "monitoring_schedule": disease_prof.get("monitoring_schedule", "ESAS daily, PPS weekly"),
        "red_flags":    disease_prof.get("red_flags", []),
        "care_priorities": [g["title"] for g in disease_prof.get("key_goals", [])[:3]],
        "critical_flags": insights.get("critical_flags", []),
        "high_priority_concerns": insights.get("high_priority_concerns", []),
        "emergency_contacts": [
            "National Ambulance Service Ghana: 193",
            "Mental Health Authority: 0800-111-011",
            "Korle Bu Teaching Hospital: 0302-665-401",
            "37 Military Hospital: 0302-776-111",
        ],
    }
