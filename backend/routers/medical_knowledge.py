"""
Medical Knowledge API
======================
Single source of truth for all palliative care medical knowledge.
Every component queries this instead of hardcoded data.

Endpoints:
  GET    /api/medical/conditions                --  list all conditions
  GET    /api/medical/conditions/search?q=      --  search by name/keyword
  GET    /api/medical/conditions/:name          --  full condition detail
  GET    /api/medical/conditions/:name/match    --  match patient diagnosis
  GET    /api/medical/questionnaire-conditions  --  for personalisation quest
  GET    /api/medical/chatbot-context/:name     --  chatbot knowledge for condition
  GET    /api/medical/red-flags/:name           --  red flags for alerts system
  GET    /api/medical/symptoms/:name            --  key symptoms to monitor

  POST   /api/medical/conditions                --  create (admin/clinician)
  PUT    /api/medical/conditions/:name          --  update (admin/clinician)
  DELETE /api/medical/conditions/:name          --  delete (admin only)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
import json

from src.db import get_db, User, ConditionCareTemplate
from routers.auth import get_current_user

router = APIRouter()

# ── Role guard helpers ───────────────────────────────────────────────────────

def _require_clinician(user: User):
    if user.role not in ("admin", "clinician"):
        raise HTTPException(status_code=403, detail="Clinician or admin role required")

def _require_admin(user: User):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class ConditionCreateRequest(BaseModel):
    condition_name: str
    keywords: List[str] = []
    plain_language_summary: Optional[str] = None
    goals_of_care: Optional[str] = None
    pain_management_plan: Optional[str] = None
    psychological_support: Optional[str] = None
    spiritual_care: Optional[str] = None
    family_support_plan: Optional[str] = None
    key_symptoms_to_monitor: List[str] = []
    red_flag_symptoms: List[str] = []

class ConditionUpdateRequest(BaseModel):
    condition_name: Optional[str] = None
    keywords: Optional[List[str]] = None
    plain_language_summary: Optional[str] = None
    goals_of_care: Optional[str] = None
    pain_management_plan: Optional[str] = None
    psychological_support: Optional[str] = None
    spiritual_care: Optional[str] = None
    family_support_plan: Optional[str] = None
    key_symptoms_to_monitor: Optional[List[str]] = None
    red_flag_symptoms: Optional[List[str]] = None


# ── Serialiser ───────────────────────────────────────────────────────────────

def _template_to_dict(t: ConditionCareTemplate, full: bool = True) -> dict:
    base = {
        "id":             t.id,
        "condition_name": t.condition_name,
        "keywords":       json.loads(t.condition_keywords or "[]"),
    }
    if full:
        base.update({
            "goals_of_care":          t.goals_of_care,
            "pain_management_plan":   t.pain_management_plan,
            "psychological_support":  t.psychological_support,
            "spiritual_care":         t.spiritual_care,
            "family_support_plan":    t.family_support_plan,
            "plain_language_summary": t.plain_language_summary,
            "key_symptoms_to_monitor": json.loads(t.key_symptoms_to_monitor or "[]"),
            "red_flag_symptoms":       json.loads(t.red_flag_symptoms or "[]"),
        })
    return base


def _match_condition(diagnosis: str, db: Session) -> Optional[ConditionCareTemplate]:
    """Find the best matching condition template for a diagnosis string."""
    if not diagnosis:
        return None
    diag_lower = diagnosis.lower()
    templates = db.query(ConditionCareTemplate).all()
    best, best_score = None, 0
    for t in templates:
        keywords = json.loads(t.condition_keywords or "[]")
        score = sum(1 for kw in keywords if kw.lower() in diag_lower)
        score += sum(len(kw) * 0.05 for kw in keywords if kw.lower() in diag_lower)
        if t.condition_name == "Advanced Cancer":
            score *= 0.5
        if t.condition_name.lower().replace(" advanced","").strip() in diag_lower:
            score += 5
        if score > best_score:
            best_score = score
            best = t
    return best if best_score > 0 else None


# ── Read endpoints ────────────────────────────────────────────────────────────

@router.get("/conditions")
async def list_conditions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all palliative care conditions in the knowledge base."""
    templates = db.query(ConditionCareTemplate).order_by(
        ConditionCareTemplate.condition_name
    ).all()
    return {
        "total": len(templates),
        "conditions": [_template_to_dict(t, full=False) for t in templates],
        "can_edit": current_user.role in ("admin", "clinician"),
    }


@router.get("/conditions/search")
async def search_conditions(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search conditions by name or keyword."""
    q_lower = q.lower()
    templates = db.query(ConditionCareTemplate).all()
    results = []
    for t in templates:
        keywords = json.loads(t.condition_keywords or "[]")
        if (q_lower in t.condition_name.lower() or
                any(q_lower in kw.lower() for kw in keywords)):
            results.append(_template_to_dict(t, full=False))
    return {"total": len(results), "conditions": results}


@router.get("/conditions/match")
async def match_condition(
    diagnosis: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = _match_condition(diagnosis, db)
    if not template:
        template = db.query(ConditionCareTemplate).filter(
            ConditionCareTemplate.condition_name.like("%Cancer%")
        ).first()
    if not template:
        raise HTTPException(status_code=404, detail="No matching condition found")
    return _template_to_dict(template, full=True)


@router.get("/conditions/{condition_name}")
async def get_condition(
    condition_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = db.query(ConditionCareTemplate).filter(
        ConditionCareTemplate.condition_name == condition_name
    ).first()
    if not template:
        template = db.query(ConditionCareTemplate).filter(
            ConditionCareTemplate.condition_name.ilike(f"%{condition_name}%")
        ).first()
    if not template:
        raise HTTPException(status_code=404, detail=f"Condition '{condition_name}' not found")
    return _template_to_dict(template, full=True)


# ── Write endpoints (clinician / admin) ───────────────────────────────────────

@router.post("/conditions", status_code=201)
async def create_condition(
    body: ConditionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new condition entry. Requires clinician or admin role."""
    _require_clinician(current_user)

    # Prevent duplicates
    existing = db.query(ConditionCareTemplate).filter(
        ConditionCareTemplate.condition_name.ilike(body.condition_name)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Condition '{body.condition_name}' already exists")

    template = ConditionCareTemplate(
        condition_name           = body.condition_name,
        condition_keywords       = json.dumps(body.keywords),
        plain_language_summary   = body.plain_language_summary,
        goals_of_care            = body.goals_of_care,
        pain_management_plan     = body.pain_management_plan,
        psychological_support    = body.psychological_support,
        spiritual_care           = body.spiritual_care,
        family_support_plan      = body.family_support_plan,
        key_symptoms_to_monitor  = json.dumps(body.key_symptoms_to_monitor),
        red_flag_symptoms        = json.dumps(body.red_flag_symptoms),
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return _template_to_dict(template, full=True)


@router.put("/conditions/{condition_name}")
async def update_condition(
    condition_name: str,
    body: ConditionUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing condition. Requires clinician or admin role."""
    _require_clinician(current_user)

    template = db.query(ConditionCareTemplate).filter(
        ConditionCareTemplate.condition_name == condition_name
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail=f"Condition '{condition_name}' not found")

    if body.condition_name is not None:
        template.condition_name = body.condition_name
    if body.keywords is not None:
        template.condition_keywords = json.dumps(body.keywords)
    if body.plain_language_summary is not None:
        template.plain_language_summary = body.plain_language_summary
    if body.goals_of_care is not None:
        template.goals_of_care = body.goals_of_care
    if body.pain_management_plan is not None:
        template.pain_management_plan = body.pain_management_plan
    if body.psychological_support is not None:
        template.psychological_support = body.psychological_support
    if body.spiritual_care is not None:
        template.spiritual_care = body.spiritual_care
    if body.family_support_plan is not None:
        template.family_support_plan = body.family_support_plan
    if body.key_symptoms_to_monitor is not None:
        template.key_symptoms_to_monitor = json.dumps(body.key_symptoms_to_monitor)
    if body.red_flag_symptoms is not None:
        template.red_flag_symptoms = json.dumps(body.red_flag_symptoms)

    db.commit()
    db.refresh(template)
    return _template_to_dict(template, full=True)


@router.delete("/conditions/{condition_name}", status_code=204)
async def delete_condition(
    condition_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a condition. Requires admin role."""
    _require_admin(current_user)

    template = db.query(ConditionCareTemplate).filter(
        ConditionCareTemplate.condition_name == condition_name
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail=f"Condition '{condition_name}' not found")

    db.delete(template)
    db.commit()
    return None


# ── Remaining read endpoints (unchanged) ─────────────────────────────────────

@router.get("/questionnaire-conditions")
async def get_questionnaire_conditions(db: Session = Depends(get_db)):
    templates = db.query(ConditionCareTemplate).order_by(
        ConditionCareTemplate.condition_name
    ).all()
    return {
        "conditions": [
            {
                "value": t.condition_name,
                "label": t.condition_name,
                "keywords": json.loads(t.condition_keywords or "[]")[:3],
                "summary": (t.plain_language_summary or "")[:120] + "..." if t.plain_language_summary and len(t.plain_language_summary) > 120 else t.plain_language_summary,
            }
            for t in templates
        ]
    }


@router.get("/chatbot-context/{condition_name}")
async def get_chatbot_context(
    condition_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = db.query(ConditionCareTemplate).filter(
        ConditionCareTemplate.condition_name.ilike(f"%{condition_name}%")
    ).first()
    if not template:
        return {"condition": condition_name, "context": "", "found": False}

    context = f"""CONDITION: {template.condition_name}

GOALS OF CARE:
{template.goals_of_care or ''}

PAIN AND SYMPTOM MANAGEMENT:
{template.pain_management_plan or ''}

PSYCHOLOGICAL SUPPORT:
{template.psychological_support or ''}

SPIRITUAL AND CULTURAL CARE:
{template.spiritual_care or ''}

FAMILY SUPPORT:
{template.family_support_plan or ''}

PATIENT INFORMATION:
{template.plain_language_summary or ''}

KEY SYMPTOMS TO WATCH:
{', '.join(json.loads(template.key_symptoms_to_monitor or '[]'))}

RED FLAGS  --  SEEK URGENT HELP IF:
{chr(10).join('- ' + f for f in json.loads(template.red_flag_symptoms or '[]'))}"""

    return {
        "condition":        template.condition_name,
        "context":          context,
        "found":            True,
        "pain_plan":        template.pain_management_plan,
        "psych_support":    template.psychological_support,
        "spiritual_care":   template.spiritual_care,
        "family_plan":      template.family_support_plan,
        "red_flags":        json.loads(template.red_flag_symptoms or "[]"),
        "symptoms_monitor": json.loads(template.key_symptoms_to_monitor or "[]"),
    }


@router.get("/red-flags/{condition_name}")
async def get_red_flags(
    condition_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = db.query(ConditionCareTemplate).filter(
        ConditionCareTemplate.condition_name.ilike(f"%{condition_name}%")
    ).first()
    if not template:
        return {"condition": condition_name, "red_flags": []}
    return {
        "condition":  template.condition_name,
        "red_flags":  json.loads(template.red_flag_symptoms or "[]"),
        "symptoms":   json.loads(template.key_symptoms_to_monitor or "[]"),
    }


@router.get("/patient-context/{patient_id}")
async def get_patient_medical_context(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from src.db import Patient
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    template = _match_condition(patient.primary_diagnosis or "", db)

    if not template:
        return {
            "patient_id":     patient_id,
            "diagnosis":      patient.primary_diagnosis,
            "condition_name": "General Palliative Care",
            "matched":        False,
            "red_flags":      [],
            "symptoms_monitor": [],
            "goals":          [],
            "context":        "",
        }

    return {
        "patient_id":         patient_id,
        "diagnosis":          patient.primary_diagnosis,
        "condition_name":     template.condition_name,
        "matched":            True,
        "goals_of_care":      template.goals_of_care,
        "pain_plan":          template.pain_management_plan,
        "psych_support":      template.psychological_support,
        "spiritual_care":     template.spiritual_care,
        "family_plan":        template.family_support_plan,
        "patient_summary":    template.plain_language_summary,
        "red_flags":          json.loads(template.red_flag_symptoms or "[]"),
        "symptoms_monitor":   json.loads(template.key_symptoms_to_monitor or "[]"),
    }



def _template_to_dict(t: ConditionCareTemplate, full: bool = True) -> dict:
    base = {
        "id":             t.id,
        "condition_name": t.condition_name,
        "keywords":       json.loads(t.condition_keywords or "[]"),
    }
    if full:
        base.update({
            "goals_of_care":          t.goals_of_care,
            "pain_management_plan":   t.pain_management_plan,
            "psychological_support":  t.psychological_support,
            "spiritual_care":         t.spiritual_care,
            "family_support_plan":    t.family_support_plan,
            "plain_language_summary": t.plain_language_summary,
            "key_symptoms_to_monitor": json.loads(t.key_symptoms_to_monitor or "[]"),
            "red_flag_symptoms":       json.loads(t.red_flag_symptoms or "[]"),
        })
    return base


def _match_condition(diagnosis: str, db: Session) -> Optional[ConditionCareTemplate]:
    """Find the best matching condition template for a diagnosis string."""
    if not diagnosis:
        return None
    diag_lower = diagnosis.lower()
    templates = db.query(ConditionCareTemplate).all()
    best, best_score = None, 0
    for t in templates:
        keywords = json.loads(t.condition_keywords or "[]")
        score = sum(1 for kw in keywords if kw.lower() in diag_lower)
        # Prefer longer keyword matches (more specific)
        score += sum(len(kw) * 0.05 for kw in keywords if kw.lower() in diag_lower)
        # Penalise very generic conditions (Advanced Cancer matches everything)
        if t.condition_name == "Advanced Cancer":
            score *= 0.5
        # Bonus for condition name appearing directly in diagnosis
        if t.condition_name.lower().replace(" advanced","").strip() in diag_lower:
            score += 5
        if score > best_score:
            best_score = score
            best = t
    return best if best_score > 0 else None


# ── Endpoints ─────────────────────────────────────────────────────────────

@router.get("/conditions")
async def list_conditions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all palliative care conditions in the knowledge base."""
    templates = db.query(ConditionCareTemplate).order_by(
        ConditionCareTemplate.condition_name
    ).all()
    return {
        "total": len(templates),
        "conditions": [_template_to_dict(t, full=False) for t in templates],
    }


@router.get("/conditions/search")
async def search_conditions(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search conditions by name or keyword."""
    q_lower = q.lower()
    templates = db.query(ConditionCareTemplate).all()
    results = []
    for t in templates:
        keywords = json.loads(t.condition_keywords or "[]")
        if (q_lower in t.condition_name.lower() or
                any(q_lower in kw.lower() for kw in keywords)):
            results.append(_template_to_dict(t, full=False))
    return {"total": len(results), "conditions": results}


@router.get("/conditions/match")
async def match_condition(
    diagnosis: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Match a free-text diagnosis to the best condition template."""
    template = _match_condition(diagnosis, db)
    if not template:
        # Return general palliative if no match
        template = db.query(ConditionCareTemplate).filter(
            ConditionCareTemplate.condition_name.like("%Cancer%")
        ).first()
    if not template:
        raise HTTPException(status_code=404, detail="No matching condition found")
    return _template_to_dict(template, full=True)


@router.get("/conditions/{condition_name}")
async def get_condition(
    condition_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full details for a specific condition."""
    template = db.query(ConditionCareTemplate).filter(
        ConditionCareTemplate.condition_name == condition_name
    ).first()
    if not template:
        # Try partial match
        template = db.query(ConditionCareTemplate).filter(
            ConditionCareTemplate.condition_name.ilike(f"%{condition_name}%")
        ).first()
    if not template:
        raise HTTPException(status_code=404, detail=f"Condition '{condition_name}' not found")
    return _template_to_dict(template, full=True)


@router.get("/questionnaire-conditions")
async def get_questionnaire_conditions(
    db: Session = Depends(get_db),
):
    """
    Return condition list for the personalisation questionnaire.
    No auth required  --  used at onboarding.
    """
    templates = db.query(ConditionCareTemplate).order_by(
        ConditionCareTemplate.condition_name
    ).all()
    return {
        "conditions": [
            {
                "value": t.condition_name,
                "label": t.condition_name,
                "keywords": json.loads(t.condition_keywords or "[]")[:3],
                "summary": (t.plain_language_summary or "")[:120] + "..." if t.plain_language_summary and len(t.plain_language_summary) > 120 else t.plain_language_summary,
            }
            for t in templates
        ]
    }


@router.get("/chatbot-context/{condition_name}")
async def get_chatbot_context(
    condition_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return structured chatbot knowledge context for a condition.
    Used by the Aura AI engine to give condition-specific answers.
    """
    template = db.query(ConditionCareTemplate).filter(
        ConditionCareTemplate.condition_name.ilike(f"%{condition_name}%")
    ).first()
    if not template:
        return {"condition": condition_name, "context": "", "found": False}

    context = f"""CONDITION: {template.condition_name}

GOALS OF CARE:
{template.goals_of_care or ''}

PAIN AND SYMPTOM MANAGEMENT:
{template.pain_management_plan or ''}

PSYCHOLOGICAL SUPPORT:
{template.psychological_support or ''}

SPIRITUAL AND CULTURAL CARE:
{template.spiritual_care or ''}

FAMILY SUPPORT:
{template.family_support_plan or ''}

PATIENT INFORMATION:
{template.plain_language_summary or ''}

KEY SYMPTOMS TO WATCH:
{', '.join(json.loads(template.key_symptoms_to_monitor or '[]'))}

RED FLAGS  --  SEEK URGENT HELP IF:
{chr(10).join('- ' + f for f in json.loads(template.red_flag_symptoms or '[]'))}"""

    return {
        "condition":        template.condition_name,
        "context":          context,
        "found":            True,
        "pain_plan":        template.pain_management_plan,
        "psych_support":    template.psychological_support,
        "spiritual_care":   template.spiritual_care,
        "family_plan":      template.family_support_plan,
        "red_flags":        json.loads(template.red_flag_symptoms or "[]"),
        "symptoms_monitor": json.loads(template.key_symptoms_to_monitor or "[]"),
    }


@router.get("/red-flags/{condition_name}")
async def get_red_flags(
    condition_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get red flag symptoms for a condition  --  used by alert system."""
    template = db.query(ConditionCareTemplate).filter(
        ConditionCareTemplate.condition_name.ilike(f"%{condition_name}%")
    ).first()
    if not template:
        return {"condition": condition_name, "red_flags": []}
    return {
        "condition":  template.condition_name,
        "red_flags":  json.loads(template.red_flag_symptoms or "[]"),
        "symptoms":   json.loads(template.key_symptoms_to_monitor or "[]"),
    }


@router.get("/patient-context/{patient_id}")
async def get_patient_medical_context(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get the full medical knowledge context for a specific patient's diagnosis.
    Used to enrich care plans, chatbot, and assessment displays.
    """
    from src.db import Patient
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    template = _match_condition(patient.primary_diagnosis or "", db)

    if not template:
        return {
            "patient_id":     patient_id,
            "diagnosis":      patient.primary_diagnosis,
            "condition_name": "General Palliative Care",
            "matched":        False,
            "red_flags":      [],
            "symptoms_monitor": [],
            "goals":          [],
            "context":        "",
        }

    return {
        "patient_id":         patient_id,
        "diagnosis":          patient.primary_diagnosis,
        "condition_name":     template.condition_name,
        "matched":            True,
        "goals_of_care":      template.goals_of_care,
        "pain_plan":          template.pain_management_plan,
        "psych_support":      template.psychological_support,
        "spiritual_care":     template.spiritual_care,
        "family_plan":        template.family_support_plan,
        "patient_summary":    template.plain_language_summary,
        "red_flags":          json.loads(template.red_flag_symptoms or "[]"),
        "symptoms_monitor":   json.loads(template.key_symptoms_to_monitor or "[]"),
    }
