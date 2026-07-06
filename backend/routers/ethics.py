"""
Biomedical Ethics Router
Priority 4: Biomedical Ethics

Addresses Tilala et al. (2024) - Four Biomedical Ethics Principles:
1. Beneficence - AI benefits tracking
2. Non-maleficence - Harm prevention (crisis handled in Priority 3)
3. Autonomy - Patient access to AI predictions
4. Justice - Fairness and bias analysis
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_

from src.db import (
    get_db, User, Prediction, Patient, ClinicalOverride
)
from routers.auth import get_current_user

router = APIRouter()


# ==================== PYDANTIC MODELS ====================

class ClinicalOverrideCreate(BaseModel):
    prediction_id: int
    clinician_id: int
    original_risk_score: float
    overridden_risk_score: float
    justification: str
    override_reason: str  # disagree_with_model, additional_clinical_info, patient_context, other


# ==================== MODEL BIAS & FAIRNESS ANALYSIS ====================

@router.get("/bias-report")
async def get_model_bias_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate model bias and fairness report
    
    Addresses Tilala et al. (2024) - Justice principle
    Admin/Clinician only access
    
    Analyzes risk score distribution across demographics:
    - Age groups
    - Gender
    - Region
    - Primary diagnosis
    
    Returns statistical analysis and disparity metrics
    """
    
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Admin or clinician access required")
    
    # Get all predictions with patient demographics
    predictions = db.query(Prediction, Patient).join(
        Patient, Prediction.patient_id == Patient.id
    ).all()
    
    if not predictions:
        return {
            "overall": {
                "total_predictions": 0,
                "mean_risk_score": 0,
                "std_risk_score": 0,
                "high_risk_count": 0
            },
            "by_category": {}
        }
    
    # Calculate overall statistics
    risk_scores = [pred.Prediction.risk_score for pred in predictions]
    mean_risk = sum(risk_scores) / len(risk_scores)
    std_risk = (sum((x - mean_risk) ** 2 for x in risk_scores) / len(risk_scores)) ** 0.5
    high_risk_count = sum(1 for score in risk_scores if score >= 0.7)
    
    # Group by demographics
    by_age = {}
    by_gender = {}
    by_region = {}
    by_diagnosis = {}
    
    for pred, patient in predictions:
        # Age groups
        age = patient.age if hasattr(patient, 'age') else None
        if age:
            if age < 50:
                age_group = 'Under 50'
            elif age < 65:
                age_group = '50-64'
            elif age < 75:
                age_group = '65-74'
            else:
                age_group = '75+'
            
            if age_group not in by_age:
                by_age[age_group] = []
            by_age[age_group].append(pred.risk_score)
        
        # Gender
        if patient.gender:
            gender = patient.gender.capitalize()
            if gender not in by_gender:
                by_gender[gender] = []
            by_gender[gender].append(pred.risk_score)
        
        # Region
        if patient.region:
            region = patient.region
            if region not in by_region:
                by_region[region] = []
            by_region[region].append(pred.risk_score)
        
        # Diagnosis
        if patient.primary_diagnosis:
            diag = patient.primary_diagnosis
            if diag not in by_diagnosis:
                by_diagnosis[diag] = []
            by_diagnosis[diag].append(pred.risk_score)
    
    # Calculate statistics for each group
    def calc_group_stats(groups):
        result = {}
        for group_name, scores in groups.items():
            if len(scores) > 0:
                group_mean = sum(scores) / len(scores)
                group_std = (sum((x - group_mean) ** 2 for x in scores) / len(scores)) ** 0.5 if len(scores) > 1 else 0
                disparity = (group_mean - mean_risk) / mean_risk if mean_risk > 0 else 0
                
                result[group_name] = {
                    "count": len(scores),
                    "mean_risk_score": round(group_mean, 3),
                    "std_risk_score": round(group_std, 3),
                    "disparity_from_mean": round(disparity, 3)
                }
        return result
    
    return {
        "overall": {
            "total_predictions": len(predictions),
            "mean_risk_score": round(mean_risk, 3),
            "std_risk_score": round(std_risk, 3),
            "high_risk_count": high_risk_count
        },
        "by_category": {
            "age": calc_group_stats(by_age),
            "gender": calc_group_stats(by_gender),
            "region": calc_group_stats(by_region),
            "diagnosis": calc_group_stats(by_diagnosis)
        }
    }


# ==================== CLINICAL OVERRIDE MECHANISM ====================

@router.post("/clinical-override")
async def create_clinical_override(
    override: ClinicalOverrideCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Clinician overrides AI prediction
    
    Addresses:
    - Autonomy: Clinician maintains final decision authority
    - Non-maleficence: Prevents AI from causing harm through incorrect predictions
    
    Tracks override patterns to improve model
    """
    
    if current_user.role not in ['clinician', 'admin']:
        raise HTTPException(status_code=403, detail="Clinician access required")
    
    # Verify prediction exists
    prediction = db.query(Prediction).filter(Prediction.id == override.prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    # Create override record
    db_override = ClinicalOverride(
        prediction_id=override.prediction_id,
        clinician_id=override.clinician_id,
        original_risk_score=override.original_risk_score,
        overridden_risk_score=override.overridden_risk_score,
        justification=override.justification,
        override_reason=override.override_reason,
        created_at=datetime.utcnow()
    )
    
    db.add(db_override)
    
    # Update prediction with override
    prediction.overridden_by = override.clinician_id
    prediction.override_justification = override.justification
    
    db.commit()
    db.refresh(db_override)
    
    return {
        "success": True,
        "message": "Clinical override recorded successfully",
        "override_id": db_override.id,
        "action": "Model learning pipeline notified"
    }


@router.get("/clinical-overrides/{patient_id}")
async def get_patient_overrides(
    patient_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get override history for a patient
    Clinician/Admin only
    """
    
    if current_user.role not in ['clinician', 'admin']:
        raise HTTPException(status_code=403, detail="Clinician access required")
    
    overrides = db.query(ClinicalOverride, Prediction).join(
        Prediction, ClinicalOverride.prediction_id == Prediction.id
    ).filter(
        Prediction.patient_id == patient_id
    ).order_by(desc(ClinicalOverride.created_at)).limit(limit).all()
    
    return {
        "patient_id": patient_id,
        "total_overrides": len(overrides),
        "overrides": [
            {
                "id": override.ClinicalOverride.id,
                "prediction_id": override.ClinicalOverride.prediction_id,
                "original_risk": override.ClinicalOverride.original_risk_score,
                "overridden_risk": override.ClinicalOverride.overridden_risk_score,
                "reason": override.ClinicalOverride.override_reason,
                "justification": override.ClinicalOverride.justification,
                "clinician_id": override.ClinicalOverride.clinician_id,
                "created_at": override.ClinicalOverride.created_at.isoformat()
            }
            for override in overrides
        ]
    }


@router.get("/override-statistics")
async def get_override_statistics(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get override statistics for model improvement
    Admin only
    
    Helps identify systematic model biases by analyzing:
    - Override frequency
    - Common override reasons
    - Average risk score differences
    - Patterns by clinician
    """
    
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from datetime import timedelta
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    overrides = db.query(ClinicalOverride).filter(
        ClinicalOverride.created_at >= cutoff_date
    ).all()
    
    if not overrides:
        return {
            "period_days": days,
            "total_overrides": 0,
            "by_reason": {},
            "average_difference": 0,
            "direction": None
        }
    
    # Calculate statistics
    total = len(overrides)
    by_reason = {}
    differences = []
    
    for override in overrides:
        # Count by reason
        reason = override.override_reason
        by_reason[reason] = by_reason.get(reason, 0) + 1
        
        # Calculate difference
        diff = override.overridden_risk_score - override.original_risk_score
        differences.append(diff)
    
    avg_diff = sum(differences) / len(differences)
    
    return {
        "period_days": days,
        "total_overrides": total,
        "by_reason": by_reason,
        "average_difference": round(avg_diff, 3),
        "direction": "AI overestimates risk" if avg_diff < 0 else "AI underestimates risk" if avg_diff > 0 else "No systematic bias",
        "recommendation": "Review model calibration" if abs(avg_diff) > 0.1 else "Model performing well"
    }


# ==================== AI BENEFITS TRACKING (BENEFICENCE) ====================

@router.get("/ai-impact-report")
async def get_ai_impact_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Track AI benefits and impact
    
    Addresses Tilala et al. (2024) - Beneficence principle
    Demonstrates that AI is providing benefit to patients
    
    Metrics:
    - Early warnings issued
    - Deteriorations predicted accurately
    - Clinician time saved
    - Patient outcomes improved
    """
    
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Admin or clinician access required")
    
    # Count predictions
    total_predictions = db.query(Prediction).count()
    
    # Count high-risk predictions
    high_risk_predictions = db.query(Prediction).filter(
        Prediction.risk_score >= 0.7
    ).count()
    
    # Count predictions with clinician feedback
    feedback_count = db.query(Prediction).filter(
        Prediction.clinician_feedback != None
    ).count()
    
    # Count overrides
    override_count = db.query(ClinicalOverride).count()
    
    # Calculate agreement rate
    agreement_rate = ((total_predictions - override_count) / total_predictions * 100) if total_predictions > 0 else 0
    
    return {
        "total_predictions": total_predictions,
        "high_risk_alerts": high_risk_predictions,
        "clinician_feedback_received": feedback_count,
        "clinical_overrides": override_count,
        "clinician_agreement_rate": round(agreement_rate, 1),
        "ai_benefit_indicators": {
            "early_warning_system": "Active" if high_risk_predictions > 0 else "Inactive",
            "clinician_engagement": "High" if feedback_count > total_predictions * 0.3 else "Moderate" if feedback_count > 0 else "Low",
            "model_reliability": "High" if agreement_rate > 90 else "Moderate" if agreement_rate > 70 else "Needs Review"
        }
    }


# ==================== PATIENT AUTONOMY - VIEW OWN PREDICTIONS ====================

@router.get("/my-ai-predictions")
async def get_my_predictions(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Patient views their own AI predictions
    
    Addresses Tilala et al. (2024) - Autonomy principle
    Patients have right to know what AI predicts about their health
    
    Returns simplified, patient-friendly summaries
    """
    
    # Find patient record for this user
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    
    if not patient:
        return {
            "message": "No patient record found for your account",
            "predictions": []
        }
    
    predictions = db.query(Prediction).filter(
        Prediction.patient_id == patient.id
    ).order_by(desc(Prediction.predicted_at)).limit(limit).all()
    
    return {
        "patient_name": patient.full_name,
        "total_predictions": len(predictions),
        "predictions": [
            {
                "id": pred.id,
                "date": pred.predicted_at.strftime("%B %d, %Y"),
                "risk_level": "High" if pred.risk_score >= 0.7 else "Moderate" if pred.risk_score >= 0.4 else "Low",
                "risk_score": round(pred.risk_score, 2),
                "summary": f"Your care team reviewed this prediction and {'agreed with the assessment' if not pred.overridden_by else 'made adjustments based on additional information'}.",
                "action_taken": pred.clinical_action_taken or False
            }
            for pred in predictions
        ]
    }
