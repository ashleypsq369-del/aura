"""
Clinical Assessments API - Phase 1: Core Assessments
ESAS, PPS, PHQ-9, GAD-7 - Most essential validated tools
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

from src.db import (get_db, User, Patient, Alert,
                    ESASAssessment, PPSAssessment, 
                    PHQ9Assessment, GAD7Assessment,
                    BarthelIndexAssessment, CognitiveAssessment, PainAssessment,
                    QualityOfLifeAssessment, CaregiverBurdenAssessment, MotorSkillsAssessment)
from routers.auth import get_current_user
from services.journey_tracker import track_critical_alert, track_assessment

router = APIRouter(prefix="/api/assessments", tags=["Clinical Assessments"])


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ESASCreate(BaseModel):
    patient_id: int
    pain: int
    tiredness: int
    drowsiness: int
    nausea: int
    lack_of_appetite: int
    depression: int
    anxiety: int
    shortness_of_breath: int
    wellbeing: int
    other_symptom_name: Optional[str] = None
    other_symptom_score: Optional[int] = None
    completed_by_proxy: bool = False
    proxy_relationship: Optional[str] = None
    notes: Optional[str] = None

class PPSCreate(BaseModel):
    patient_id: int
    pps_score: int
    ambulation: str
    activity_disease: str
    self_care: str
    oral_intake: str
    consciousness: str
    notes: Optional[str] = None

class PHQ9Create(BaseModel):
    patient_id: int
    little_interest: int
    feeling_down: int
    sleep_trouble: int
    feeling_tired: int
    appetite_change: int
    feeling_bad_about_self: int
    trouble_concentrating: int
    moving_slowly_or_fidgety: int
    thoughts_of_harm: int
    difficulty_level: Optional[str] = None
    notes: Optional[str] = None

class GAD7Create(BaseModel):
    patient_id: int
    feeling_nervous: int
    not_stop_worrying: int
    worrying_too_much: int
    trouble_relaxing: int
    being_restless: int
    easily_annoyed: int
    feeling_afraid: int
    difficulty_level: Optional[str] = None
    notes: Optional[str] = None


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_phq9_severity(total: int) -> str:
    """Calculate PHQ-9 depression severity"""
    if total <= 4:
        return "minimal"
    elif total <= 9:
        return "mild"
    elif total <= 14:
        return "moderate"
    elif total <= 19:
        return "moderately_severe"
    else:
        return "severe"

def calculate_gad7_severity(total: int) -> str:
    """Calculate GAD-7 anxiety severity"""
    if total <= 4:
        return "minimal"
    elif total <= 9:
        return "mild"
    elif total <= 14:
        return "moderate"
    else:
        return "severe"

def create_assessment_alert(db: Session, patient_id: int, alert_type: str, 
                           severity: str, message: str, value: str = ""):
    """Create alert from assessment score"""
    alert = Alert(
        patient_id=patient_id,
        alert_type=alert_type,
        severity=severity,
        message=message,
        triggered_value=value,
        is_acknowledged=False
    )
    db.add(alert)
    
    # Track high/critical alerts as journey events
    if severity in ['high', 'critical']:
        track_critical_alert(
            db=db,
            patient_id=patient_id,
            alert_type=alert_type.replace('_', ' ').title(),
            severity=severity.title(),
            details=message
        )
    
    return alert


# ============================================================================
# ESAS ENDPOINTS
# ============================================================================

@router.post("/esas")
async def create_esas_assessment(
    data: ESASCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new ESAS assessment and generate alerts"""
    
    # Create assessment
    assessment = ESASAssessment(
        patient_id=data.patient_id,
        assessed_by=current_user.id,
        pain=data.pain,
        tiredness=data.tiredness,
        drowsiness=data.drowsiness,
        nausea=data.nausea,
        lack_of_appetite=data.lack_of_appetite,
        depression=data.depression,
        anxiety=data.anxiety,
        shortness_of_breath=data.shortness_of_breath,
        wellbeing=data.wellbeing,
        other_symptom_name=data.other_symptom_name,
        other_symptom_score=data.other_symptom_score,
        completed_by_proxy=data.completed_by_proxy,
        proxy_relationship=data.proxy_relationship,
        notes=data.notes
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    # Track assessment completion as journey event
    track_assessment(
        db=db,
        patient_id=data.patient_id,
        assessment_type="ESAS",
        notes=data.notes,
        created_by=current_user.id
    )
    
    # Generate alerts for severe symptoms
    alerts_created = []
    
    if data.pain >= 8:
        create_assessment_alert(
            db, data.patient_id, "severe_pain", "critical",
            f"Severe pain detected: {data.pain}/10", str(data.pain)
        )
        alerts_created.append("severe_pain")
    elif data.pain >= 7:
        create_assessment_alert(
            db, data.patient_id, "high_pain", "high",
            f"High pain level: {data.pain}/10", str(data.pain)
        )
        alerts_created.append("high_pain")
    
    if data.depression >= 8:
        create_assessment_alert(
            db, data.patient_id, "severe_depression", "critical",
            f"Severe depression on ESAS: {data.depression}/10", str(data.depression)
        )
        alerts_created.append("severe_depression")
    
    if data.anxiety >= 8:
        create_assessment_alert(
            db, data.patient_id, "severe_anxiety", "critical",
            f"Severe anxiety on ESAS: {data.anxiety}/10", str(data.anxiety)
        )
        alerts_created.append("severe_anxiety")
    
    if data.wellbeing <= 2:
        create_assessment_alert(
            db, data.patient_id, "critical_wellbeing", "critical",
            f"Critical wellbeing score: {data.wellbeing}/10", str(data.wellbeing)
        )
        alerts_created.append("critical_wellbeing")
    
    if data.shortness_of_breath >= 8:
        create_assessment_alert(
            db, data.patient_id, "severe_dyspnea", "high",
            f"Severe breathlessness: {data.shortness_of_breath}/10", str(data.shortness_of_breath)
        )
        alerts_created.append("severe_dyspnea")
    
    db.commit()
    
    return {
        "message": "ESAS assessment created successfully",
        "assessment_id": assessment.id,
        "alerts_generated": alerts_created
    }


@router.get("/esas/{patient_id}")
async def get_patient_esas(
    patient_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all ESAS assessments for a patient"""
    
    assessments = db.query(ESASAssessment).filter(
        ESASAssessment.patient_id == patient_id
    ).order_by(desc(ESASAssessment.assessed_at)).limit(limit).all()
    
    return {
        "patient_id": patient_id,
        "count": len(assessments),
        "assessments": assessments
    }


@router.get("/esas/{patient_id}/latest")
async def get_latest_esas(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get most recent ESAS assessment"""
    
    assessment = db.query(ESASAssessment).filter(
        ESASAssessment.patient_id == patient_id
    ).order_by(desc(ESASAssessment.assessed_at)).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="No ESAS assessments found")
    
    return assessment


@router.get("/esas/{patient_id}/trends")
async def get_esas_trends(
    patient_id: int,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get ESAS trends over time"""
    
    since = datetime.utcnow() - timedelta(days=days)
    
    assessments = db.query(ESASAssessment).filter(
        ESASAssessment.patient_id == patient_id,
        ESASAssessment.assessed_at >= since
    ).order_by(ESASAssessment.assessed_at).all()
    
    # Format for charting
    trends = {
        "pain": [],
        "tiredness": [],
        "depression": [],
        "anxiety": [],
        "wellbeing": [],
        "dates": []
    }
    
    for a in assessments:
        trends["pain"].append(a.pain)
        trends["tiredness"].append(a.tiredness)
        trends["depression"].append(a.depression)
        trends["anxiety"].append(a.anxiety)
        trends["wellbeing"].append(a.wellbeing)
        trends["dates"].append(a.assessed_at.isoformat())
    
    return {
        "patient_id": patient_id,
        "period_days": days,
        "count": len(assessments),
        "trends": trends
    }


# ============================================================================
# PPS ENDPOINTS
# ============================================================================

@router.post("/pps")
async def create_pps_assessment(
    data: PPSCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new PPS assessment and check for decline"""
    
    # Create assessment
    assessment = PPSAssessment(
        patient_id=data.patient_id,
        assessed_by=current_user.id,
        pps_score=data.pps_score,
        ambulation=data.ambulation,
        activity_disease=data.activity_disease,
        self_care=data.self_care,
        oral_intake=data.oral_intake,
        consciousness=data.consciousness,
        notes=data.notes
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    # Track assessment completion as journey event
    track_assessment(
        db=db,
        patient_id=data.patient_id,
        assessment_type="PPS",
        score=data.pps_score,
        notes=data.notes,
        created_by=current_user.id
    )
    
    # Check for alerts
    alerts_created = []
    
    # Critical PPS
    if data.pps_score <= 30:
        create_assessment_alert(
            db, data.patient_id, "critical_pps", "critical",
            f"Critical PPS score: {data.pps_score}% - End-of-life care discussion needed",
            str(data.pps_score)
        )
        alerts_created.append("critical_pps")
    elif data.pps_score <= 50:
        create_assessment_alert(
            db, data.patient_id, "low_pps", "high",
            f"Low PPS score: {data.pps_score}% - Significant functional decline",
            str(data.pps_score)
        )
        alerts_created.append("low_pps")
    
    # Check for rapid decline
    previous = db.query(PPSAssessment).filter(
        PPSAssessment.patient_id == data.patient_id,
        PPSAssessment.id != assessment.id
    ).order_by(desc(PPSAssessment.assessed_at)).first()
    
    if previous and previous.pps_score - data.pps_score >= 20:
        create_assessment_alert(
            db, data.patient_id, "rapid_decline", "high",
            f"Rapid functional decline: {previous.pps_score}% → {data.pps_score}%",
            f"{previous.pps_score}->{data.pps_score}"
        )
        alerts_created.append("rapid_decline")
    
    db.commit()
    
    return {
        "message": "PPS assessment created successfully",
        "assessment_id": assessment.id,
        "pps_score": data.pps_score,
        "alerts_generated": alerts_created
    }


@router.get("/pps/{patient_id}")
async def get_patient_pps(
    patient_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all PPS assessments for a patient"""
    
    assessments = db.query(PPSAssessment).filter(
        PPSAssessment.patient_id == patient_id
    ).order_by(desc(PPSAssessment.assessed_at)).limit(limit).all()
    
    return {
        "patient_id": patient_id,
        "count": len(assessments),
        "assessments": assessments
    }


@router.get("/pps/{patient_id}/latest")
async def get_latest_pps(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get most recent PPS assessment"""
    
    assessment = db.query(PPSAssessment).filter(
        PPSAssessment.patient_id == patient_id
    ).order_by(desc(PPSAssessment.assessed_at)).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="No PPS assessments found")
    
    return assessment


# ============================================================================
# PHQ-9 ENDPOINTS
# ============================================================================

@router.post("/phq9")
async def create_phq9_assessment(
    data: PHQ9Create,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create PHQ-9 depression assessment with crisis detection"""
    
    # Calculate total
    total_score = (
        data.little_interest + data.feeling_down + data.sleep_trouble +
        data.feeling_tired + data.appetite_change + data.feeling_bad_about_self +
        data.trouble_concentrating + data.moving_slowly_or_fidgety + data.thoughts_of_harm
    )
    
    severity = calculate_phq9_severity(total_score)
    
    # Create assessment
    assessment = PHQ9Assessment(
        patient_id=data.patient_id,
        assessed_by=current_user.id,
        little_interest=data.little_interest,
        feeling_down=data.feeling_down,
        sleep_trouble=data.sleep_trouble,
        feeling_tired=data.feeling_tired,
        appetite_change=data.appetite_change,
        feeling_bad_about_self=data.feeling_bad_about_self,
        trouble_concentrating=data.trouble_concentrating,
        moving_slowly_or_fidgety=data.moving_slowly_or_fidgety,
        thoughts_of_harm=data.thoughts_of_harm,
        total_score=total_score,
        severity=severity,
        difficulty_level=data.difficulty_level,
        notes=data.notes
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    # Track assessment completion as journey event
    track_assessment(
        db=db,
        patient_id=data.patient_id,
        assessment_type="PHQ-9",
        score=total_score,
        notes=f"Severity: {severity}",
        created_by=current_user.id
    )
    
    # Generate alerts
    alerts_created = []
    
    # CRISIS: Suicide risk
    if data.thoughts_of_harm > 0:
        create_assessment_alert(
            db, data.patient_id, "suicide_risk", "critical",
            f"⚠️ CRISIS: Patient expressed thoughts of self-harm (Q9: {data.thoughts_of_harm}). Immediate psychiatric evaluation required.",
            str(data.thoughts_of_harm)
        )
        alerts_created.append("suicide_risk_CRISIS")
    
    # Severe depression
    if total_score >= 20:
        create_assessment_alert(
            db, data.patient_id, "severe_depression", "critical",
            f"Severe depression (PHQ-9: {total_score}/27). Urgent psychiatric referral needed.",
            str(total_score)
        )
        alerts_created.append("severe_depression")
    elif total_score >= 15:
        create_assessment_alert(
            db, data.patient_id, "moderately_severe_depression", "high",
            f"Moderately severe depression (PHQ-9: {total_score}/27). Psychiatric consultation recommended.",
            str(total_score)
        )
        alerts_created.append("moderately_severe_depression")
    elif total_score >= 10:
        create_assessment_alert(
            db, data.patient_id, "moderate_depression", "medium",
            f"Moderate depression (PHQ-9: {total_score}/27). Monitor closely and consider intervention.",
            str(total_score)
        )
        alerts_created.append("moderate_depression")
    
    db.commit()
    
    return {
        "message": "PHQ-9 assessment created successfully",
        "assessment_id": assessment.id,
        "total_score": total_score,
        "severity": severity,
        "alerts_generated": alerts_created,
        "crisis_alert": data.thoughts_of_harm > 0
    }


@router.get("/phq9/{patient_id}")
async def get_patient_phq9(
    patient_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all PHQ-9 assessments for a patient"""
    
    assessments = db.query(PHQ9Assessment).filter(
        PHQ9Assessment.patient_id == patient_id
    ).order_by(desc(PHQ9Assessment.assessed_at)).limit(limit).all()
    
    return {
        "patient_id": patient_id,
        "count": len(assessments),
        "assessments": assessments
    }


@router.get("/phq9/{patient_id}/latest")
async def get_latest_phq9(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get most recent PHQ-9 assessment"""
    
    assessment = db.query(PHQ9Assessment).filter(
        PHQ9Assessment.patient_id == patient_id
    ).order_by(desc(PHQ9Assessment.assessed_at)).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="No PHQ-9 assessments found")
    
    return assessment


# ============================================================================
# GAD-7 ENDPOINTS
# ============================================================================

@router.post("/gad7")
async def create_gad7_assessment(
    data: GAD7Create,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create GAD-7 anxiety assessment"""
    
    # Calculate total
    total_score = (
        data.feeling_nervous + data.not_stop_worrying + data.worrying_too_much +
        data.trouble_relaxing + data.being_restless + data.easily_annoyed +
        data.feeling_afraid
    )
    
    severity = calculate_gad7_severity(total_score)
    
    # Create assessment
    assessment = GAD7Assessment(
        patient_id=data.patient_id,
        assessed_by=current_user.id,
        feeling_nervous=data.feeling_nervous,
        not_stop_worrying=data.not_stop_worrying,
        worrying_too_much=data.worrying_too_much,
        trouble_relaxing=data.trouble_relaxing,
        being_restless=data.being_restless,
        easily_annoyed=data.easily_annoyed,
        feeling_afraid=data.feeling_afraid,
        total_score=total_score,
        severity=severity,
        difficulty_level=data.difficulty_level,
        notes=data.notes
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    # Track assessment completion as journey event
    track_assessment(
        db=db,
        patient_id=data.patient_id,
        assessment_type="GAD-7",
        score=total_score,
        notes=f"Severity: {severity}",
        created_by=current_user.id
    )
    
    # Generate alerts
    alerts_created = []
    
    if total_score >= 15:
        create_assessment_alert(
            db, data.patient_id, "severe_anxiety", "high",
            f"Severe anxiety (GAD-7: {total_score}/21). Psychiatric referral recommended.",
            str(total_score)
        )
        alerts_created.append("severe_anxiety")
    elif total_score >= 10:
        create_assessment_alert(
            db, data.patient_id, "moderate_anxiety", "medium",
            f"Moderate anxiety (GAD-7: {total_score}/21). Consider intervention.",
            str(total_score)
        )
        alerts_created.append("moderate_anxiety")
    
    db.commit()
    
    return {
        "message": "GAD-7 assessment created successfully",
        "assessment_id": assessment.id,
        "total_score": total_score,
        "severity": severity,
        "alerts_generated": alerts_created
    }


@router.get("/gad7/{patient_id}")
async def get_patient_gad7(
    patient_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all GAD-7 assessments for a patient"""
    
    assessments = db.query(GAD7Assessment).filter(
        GAD7Assessment.patient_id == patient_id
    ).order_by(desc(GAD7Assessment.assessed_at)).limit(limit).all()
    
    return {
        "patient_id": patient_id,
        "count": len(assessments),
        "assessments": assessments
    }


@router.get("/gad7/{patient_id}/latest")
async def get_latest_gad7(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get most recent GAD-7 assessment"""
    
    assessment = db.query(GAD7Assessment).filter(
        GAD7Assessment.patient_id == patient_id
    ).order_by(desc(GAD7Assessment.assessed_at)).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="No GAD-7 assessments found")
    
    return assessment


# ============================================================================
# SUMMARY ENDPOINTS
# ============================================================================

@router.get("/patient/{patient_id}/overview")
async def get_patient_assessment_overview(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get overview of all assessments for a patient"""
    
    # Get latest of each type
    latest_esas = db.query(ESASAssessment).filter(
        ESASAssessment.patient_id == patient_id
    ).order_by(desc(ESASAssessment.assessed_at)).first()
    
    latest_pps = db.query(PPSAssessment).filter(
        PPSAssessment.patient_id == patient_id
    ).order_by(desc(PPSAssessment.assessed_at)).first()
    
    latest_phq9 = db.query(PHQ9Assessment).filter(
        PHQ9Assessment.patient_id == patient_id
    ).order_by(desc(PHQ9Assessment.assessed_at)).first()
    
    latest_gad7 = db.query(GAD7Assessment).filter(
        GAD7Assessment.patient_id == patient_id
    ).order_by(desc(GAD7Assessment.assessed_at)).first()
    
    latest_barthel = db.query(BarthelIndexAssessment).filter(
        BarthelIndexAssessment.patient_id == patient_id
    ).order_by(desc(BarthelIndexAssessment.assessed_at)).first()
    
    latest_cognitive = db.query(CognitiveAssessment).filter(
        CognitiveAssessment.patient_id == patient_id
    ).order_by(desc(CognitiveAssessment.assessed_at)).first()
    
    latest_pain = db.query(PainAssessment).filter(
        PainAssessment.patient_id == patient_id
    ).order_by(desc(PainAssessment.assessed_at)).first()
    
    latest_qol = db.query(QualityOfLifeAssessment).filter(
        QualityOfLifeAssessment.patient_id == patient_id
    ).order_by(desc(QualityOfLifeAssessment.assessed_at)).first()
    
    latest_caregiver_burden = db.query(CaregiverBurdenAssessment).filter(
        CaregiverBurdenAssessment.patient_id == patient_id
    ).order_by(desc(CaregiverBurdenAssessment.assessed_at)).first()
    
    latest_motor = db.query(MotorSkillsAssessment).filter(
        MotorSkillsAssessment.patient_id == patient_id
    ).order_by(desc(MotorSkillsAssessment.assessed_at)).first()
    
    return {
        "patient_id": patient_id,
        "esas": latest_esas,
        "pps": latest_pps,
        "phq9": latest_phq9,
        "gad7": latest_gad7,
        "barthel": latest_barthel,
        "cognitive": latest_cognitive,
        "pain": latest_pain,
        "qol": latest_qol,
        "caregiver_burden": latest_caregiver_burden,
        "motor_skills": latest_motor
    }



# ============================================================================
# BARTHEL INDEX ENDPOINTS
# ============================================================================

class BarthelCreate(BaseModel):
    patient_id: int
    feeding: int
    bathing: int
    grooming: int
    dressing: int
    bowel_control: int
    bladder_control: int
    toilet_use: int
    transfers: int
    mobility: int
    stairs: int
    total_score: int
    independence_level: str
    notes: Optional[str] = None

@router.post("/barthel")
async def create_barthel_assessment(
    data: BarthelCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new Barthel Index assessment"""
    
    assessment = BarthelIndexAssessment(
        patient_id=data.patient_id,
        assessed_by=current_user.id,
        feeding=data.feeding,
        bathing=data.bathing,
        grooming=data.grooming,
        dressing=data.dressing,
        bowel_control=data.bowel_control,
        bladder_control=data.bladder_control,
        toilet_use=data.toilet_use,
        transfers=data.transfers,
        mobility=data.mobility,
        stairs=data.stairs,
        total_score=data.total_score,
        independence_level=data.independence_level,
        notes=data.notes
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    # Track assessment completion as journey event
    track_assessment(
        db=db,
        patient_id=data.patient_id,
        assessment_type="Barthel Index",
        score=data.total_score,
        notes=f"Independence level: {data.independence_level}",
        created_by=current_user.id
    )
    
    # Generate alerts
    alerts_created = []
    
    if data.total_score < 20:
        create_assessment_alert(
            db, data.patient_id, "severe_dependence", "high",
            f"Severe functional dependence (Barthel: {data.total_score}/100). Maximum care required.",
            str(data.total_score)
        )
        alerts_created.append("severe_dependence")
    elif data.total_score < 40:
        create_assessment_alert(
            db, data.patient_id, "moderate_dependence", "medium",
            f"Moderate functional dependence (Barthel: {data.total_score}/100). Substantial assistance needed.",
            str(data.total_score)
        )
        alerts_created.append("moderate_dependence")
    
    # Check for decline
    previous = db.query(BarthelIndexAssessment).filter(
        BarthelIndexAssessment.patient_id == data.patient_id,
        BarthelIndexAssessment.id != assessment.id
    ).order_by(desc(BarthelIndexAssessment.assessed_at)).first()
    
    if previous and previous.total_score - data.total_score >= 20:
        create_assessment_alert(
            db, data.patient_id, "functional_decline", "high",
            f"Significant functional decline: {previous.total_score} → {data.total_score}",
            f"{previous.total_score}->{data.total_score}"
        )
        alerts_created.append("functional_decline")
    
    db.commit()
    
    return {
        "message": "Barthel Index assessment created successfully",
        "assessment_id": assessment.id,
        "total_score": data.total_score,
        "independence_level": data.independence_level,
        "alerts_generated": alerts_created
    }

@router.get("/barthel/{patient_id}")
async def get_patient_barthel(
    patient_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all Barthel Index assessments for a patient"""
    
    assessments = db.query(BarthelIndexAssessment).filter(
        BarthelIndexAssessment.patient_id == patient_id
    ).order_by(desc(BarthelIndexAssessment.assessed_at)).limit(limit).all()
    
    return {
        "patient_id": patient_id,
        "count": len(assessments),
        "assessments": assessments
    }

@router.get("/barthel/{patient_id}/latest")
async def get_latest_barthel(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get most recent Barthel Index assessment"""
    
    assessment = db.query(BarthelIndexAssessment).filter(
        BarthelIndexAssessment.patient_id == patient_id
    ).order_by(desc(BarthelIndexAssessment.assessed_at)).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="No Barthel assessments found")
    
    return assessment


# ============================================================================
# COGNITIVE ASSESSMENT ENDPOINTS
# ============================================================================

class CognitiveCreate(BaseModel):
    patient_id: int
    assessment_type: str  # "MMSE" or "MoCA"
    # MMSE fields
    mmse_orientation_time: Optional[int] = None
    mmse_orientation_place: Optional[int] = None
    mmse_registration: Optional[int] = None
    mmse_attention_calculation: Optional[int] = None
    mmse_recall: Optional[int] = None
    mmse_language: Optional[int] = None
    mmse_visual_construction: Optional[int] = None
    mmse_total: Optional[int] = None
    # MoCA fields
    moca_visuospatial_executive: Optional[int] = None
    moca_naming: Optional[int] = None
    moca_attention: Optional[int] = None
    moca_language: Optional[int] = None
    moca_abstraction: Optional[int] = None
    moca_delayed_recall: Optional[int] = None
    moca_orientation: Optional[int] = None
    moca_education_adjustment: Optional[int] = None
    moca_total: Optional[int] = None
    # Common fields
    interpretation: str
    patient_education_years: Optional[int] = None
    notes: Optional[str] = None

@router.post("/cognitive")
async def create_cognitive_assessment(
    data: CognitiveCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new cognitive assessment (MMSE or MoCA)"""
    
    assessment = CognitiveAssessment(
        patient_id=data.patient_id,
        assessed_by=current_user.id,
        assessment_type=data.assessment_type,
        mmse_orientation_time=data.mmse_orientation_time,
        mmse_orientation_place=data.mmse_orientation_place,
        mmse_registration=data.mmse_registration,
        mmse_attention_calculation=data.mmse_attention_calculation,
        mmse_recall=data.mmse_recall,
        mmse_language=data.mmse_language,
        mmse_visual_construction=data.mmse_visual_construction,
        mmse_total=data.mmse_total,
        moca_visuospatial_executive=data.moca_visuospatial_executive,
        moca_naming=data.moca_naming,
        moca_attention=data.moca_attention,
        moca_language=data.moca_language,
        moca_abstraction=data.moca_abstraction,
        moca_delayed_recall=data.moca_delayed_recall,
        moca_orientation=data.moca_orientation,
        moca_education_adjustment=data.moca_education_adjustment,
        moca_total=data.moca_total,
        interpretation=data.interpretation,
        patient_education_years=data.patient_education_years,
        notes=data.notes
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    # Track assessment completion as journey event
    total_score = data.mmse_total if data.assessment_type == "MMSE" else data.moca_total
    track_assessment(
        db=db,
        patient_id=data.patient_id,
        assessment_type=data.assessment_type,
        score=total_score,
        notes=f"Interpretation: {data.interpretation}",
        created_by=current_user.id
    )
    
    # Generate alerts
    alerts_created = []
    
    if data.assessment_type == "MMSE" and data.mmse_total is not None:
        if data.mmse_total < 10:
            create_assessment_alert(
                db, data.patient_id, "severe_cognitive_impairment", "critical",
                f"Severe cognitive impairment (MMSE: {data.mmse_total}/30). Urgent specialist referral needed.",
                str(data.mmse_total)
            )
            alerts_created.append("severe_cognitive_impairment")
        elif data.mmse_total < 18:
            create_assessment_alert(
                db, data.patient_id, "moderate_cognitive_impairment", "high",
                f"Moderate cognitive impairment (MMSE: {data.mmse_total}/30). Further evaluation recommended.",
                str(data.mmse_total)
            )
            alerts_created.append("moderate_cognitive_impairment")
        elif data.mmse_total < 24:
            create_assessment_alert(
                db, data.patient_id, "mild_cognitive_impairment", "medium",
                f"Mild cognitive impairment (MMSE: {data.mmse_total}/30). Monitor closely.",
                str(data.mmse_total)
            )
            alerts_created.append("mild_cognitive_impairment")
    
    if data.assessment_type == "MoCA" and data.moca_total is not None:
        if data.moca_total < 10:
            create_assessment_alert(
                db, data.patient_id, "severe_cognitive_impairment", "critical",
                f"Severe cognitive impairment (MoCA: {data.moca_total}/30). Urgent specialist referral needed.",
                str(data.moca_total)
            )
            alerts_created.append("severe_cognitive_impairment")
        elif data.moca_total < 18:
            create_assessment_alert(
                db, data.patient_id, "moderate_cognitive_impairment", "high",
                f"Moderate cognitive impairment (MoCA: {data.moca_total}/30). Further evaluation recommended.",
                str(data.moca_total)
            )
            alerts_created.append("moderate_cognitive_impairment")
        elif data.moca_total < 26:
            create_assessment_alert(
                db, data.patient_id, "mild_cognitive_impairment", "medium",
                f"Possible mild cognitive impairment (MoCA: {data.moca_total}/30). Consider repeat testing.",
                str(data.moca_total)
            )
            alerts_created.append("mild_cognitive_impairment")
    
    db.commit()
    
    return {
        "message": f"{data.assessment_type} assessment created successfully",
        "assessment_id": assessment.id,
        "assessment_type": data.assessment_type,
        "total_score": data.mmse_total if data.assessment_type == "MMSE" else data.moca_total,
        "interpretation": data.interpretation,
        "alerts_generated": alerts_created
    }

@router.get("/cognitive/{patient_id}")
async def get_patient_cognitive(
    patient_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all cognitive assessments for a patient"""
    
    assessments = db.query(CognitiveAssessment).filter(
        CognitiveAssessment.patient_id == patient_id
    ).order_by(desc(CognitiveAssessment.assessed_at)).limit(limit).all()
    
    return {
        "patient_id": patient_id,
        "count": len(assessments),
        "assessments": assessments
    }

@router.get("/cognitive/{patient_id}/latest")
async def get_latest_cognitive(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get most recent cognitive assessment"""
    
    assessment = db.query(CognitiveAssessment).filter(
        CognitiveAssessment.patient_id == patient_id
    ).order_by(desc(CognitiveAssessment.assessed_at)).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="No cognitive assessments found")
    
    return assessment


# ============================================================================
# PAIN ASSESSMENT ENDPOINTS
# ============================================================================

class PainCreate(BaseModel):
    patient_id: int
    pain_worst: int
    pain_least: int
    pain_average: int
    pain_current: int
    pain_location: str
    pain_type: Optional[str] = None
    interference_activity: int
    interference_mood: int
    interference_walking: int
    interference_work: int
    interference_relations: int
    interference_sleep: int
    interference_enjoyment: int
    current_medications: Optional[str] = None
    medication_effectiveness: Optional[int] = None
    notes: Optional[str] = None

@router.post("/pain")
async def create_pain_assessment(
    data: PainCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new Brief Pain Inventory assessment"""
    
    assessment = PainAssessment(
        patient_id=data.patient_id,
        assessed_by=current_user.id,
        pain_worst=data.pain_worst,
        pain_least=data.pain_least,
        pain_average=data.pain_average,
        pain_current=data.pain_current,
        pain_location=data.pain_location,
        pain_type=data.pain_type,
        interference_activity=data.interference_activity,
        interference_mood=data.interference_mood,
        interference_walking=data.interference_walking,
        interference_work=data.interference_work,
        interference_relations=data.interference_relations,
        interference_sleep=data.interference_sleep,
        interference_enjoyment=data.interference_enjoyment,
        current_medications=data.current_medications,
        medication_effectiveness=data.medication_effectiveness,
        notes=data.notes
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    # Track assessment completion as journey event
    avg_interference = (
        data.interference_activity + data.interference_mood + data.interference_walking +
        data.interference_work + data.interference_relations + data.interference_sleep +
        data.interference_enjoyment
    ) / 7
    track_assessment(
        db=db,
        patient_id=data.patient_id,
        assessment_type="Brief Pain Inventory",
        score=data.pain_average,
        notes=f"Pain avg: {data.pain_average}/10, Interference: {avg_interference:.1f}/10",
        created_by=current_user.id
    )
    
    # Generate alerts
    alerts_created = []
    
    # Severe pain
    if data.pain_worst >= 8:
        create_assessment_alert(
            db, data.patient_id, "severe_pain", "critical",
            f"Severe worst pain reported: {data.pain_worst}/10. Immediate pain management review needed.",
            str(data.pain_worst)
        )
        alerts_created.append("severe_pain")
    
    if data.pain_average >= 7:
        create_assessment_alert(
            db, data.patient_id, "high_average_pain", "high",
            f"High average pain level: {data.pain_average}/10. Pain regimen adjustment recommended.",
            str(data.pain_average)
        )
        alerts_created.append("high_average_pain")
    
    # Check interference
    avg_interference = (
        data.interference_activity + data.interference_mood + data.interference_walking +
        data.interference_work + data.interference_relations + data.interference_sleep +
        data.interference_enjoyment
    ) / 7
    
    if avg_interference >= 7:
        create_assessment_alert(
            db, data.patient_id, "severe_pain_interference", "high",
            f"Pain severely interfering with daily life (avg: {avg_interference:.1f}/10). Comprehensive pain management needed.",
            f"{avg_interference:.1f}"
        )
        alerts_created.append("severe_pain_interference")
    
    # Check medication effectiveness
    if data.medication_effectiveness is not None and data.medication_effectiveness < 30:
        create_assessment_alert(
            db, data.patient_id, "ineffective_pain_meds", "high",
            f"Pain medications not effective ({data.medication_effectiveness}%). Medication review required.",
            str(data.medication_effectiveness)
        )
        alerts_created.append("ineffective_pain_meds")
    
    db.commit()
    
    return {
        "message": "Pain assessment created successfully",
        "assessment_id": assessment.id,
        "pain_average": data.pain_average,
        "interference_average": round(avg_interference, 1),
        "alerts_generated": alerts_created
    }

@router.get("/pain/{patient_id}")
async def get_patient_pain(
    patient_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all pain assessments for a patient"""
    
    assessments = db.query(PainAssessment).filter(
        PainAssessment.patient_id == patient_id
    ).order_by(desc(PainAssessment.assessed_at)).limit(limit).all()
    
    return {
        "patient_id": patient_id,
        "count": len(assessments),
        "assessments": assessments
    }

@router.get("/pain/{patient_id}/latest")
async def get_latest_pain(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get most recent pain assessment"""
    
    assessment = db.query(PainAssessment).filter(
        PainAssessment.patient_id == patient_id
    ).order_by(desc(PainAssessment.assessed_at)).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="No pain assessments found")
    
    return assessment


# ============================================================================
# QUALITY OF LIFE (FACT-G) ENDPOINTS
# ============================================================================

class QualityOfLifeCreate(BaseModel):
    patient_id: int
    # Physical
    physical_lack_of_energy: int
    physical_nausea: int
    physical_meeting_needs: int
    physical_pain: int
    physical_side_effects: int
    physical_feel_ill: int
    physical_bed_time: int
    # Social
    social_close_to_friends: int
    social_emotional_support: int
    social_support_from_family: int
    social_acceptance_of_illness: int
    social_family_communication: int
    social_close_to_partner: int
    social_satisfaction_sex_life: int
    # Emotional
    emotional_feel_sad: int
    emotional_coping_with_illness: int
    emotional_losing_hope: int
    emotional_feel_nervous: int
    emotional_worry_about_dying: int
    emotional_worry_about_condition: int
    # Functional
    functional_able_to_work: int
    functional_work_fulfilling: int
    functional_enjoy_life: int
    functional_accepted_illness: int
    functional_sleeping_well: int
    functional_enjoying_hobbies: int
    functional_content_with_qol: int
    # Scores
    physical_score: int
    social_score: int
    emotional_score: int
    functional_score: int
    total_score: int
    notes: Optional[str] = None

@router.post("/qol")
async def create_qol_assessment(
    data: QualityOfLifeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new Quality of Life (FACT-G) assessment"""
    
    assessment = QualityOfLifeAssessment(
        patient_id=data.patient_id,
        assessed_by=current_user.id,
        physical_lack_of_energy=data.physical_lack_of_energy,
        physical_nausea=data.physical_nausea,
        physical_meeting_needs=data.physical_meeting_needs,
        physical_pain=data.physical_pain,
        physical_side_effects=data.physical_side_effects,
        physical_feel_ill=data.physical_feel_ill,
        physical_bed_time=data.physical_bed_time,
        social_close_to_friends=data.social_close_to_friends,
        social_emotional_support=data.social_emotional_support,
        social_support_from_family=data.social_support_from_family,
        social_acceptance_of_illness=data.social_acceptance_of_illness,
        social_family_communication=data.social_family_communication,
        social_close_to_partner=data.social_close_to_partner,
        social_satisfaction_sex_life=data.social_satisfaction_sex_life,
        emotional_feel_sad=data.emotional_feel_sad,
        emotional_coping_with_illness=data.emotional_coping_with_illness,
        emotional_losing_hope=data.emotional_losing_hope,
        emotional_feel_nervous=data.emotional_feel_nervous,
        emotional_worry_about_dying=data.emotional_worry_about_dying,
        emotional_worry_about_condition=data.emotional_worry_about_condition,
        functional_able_to_work=data.functional_able_to_work,
        functional_work_fulfilling=data.functional_work_fulfilling,
        functional_enjoy_life=data.functional_enjoy_life,
        functional_accepted_illness=data.functional_accepted_illness,
        functional_sleeping_well=data.functional_sleeping_well,
        functional_enjoying_hobbies=data.functional_enjoying_hobbies,
        functional_content_with_qol=data.functional_content_with_qol,
        physical_score=data.physical_score,
        social_score=data.social_score,
        emotional_score=data.emotional_score,
        functional_score=data.functional_score,
        total_score=data.total_score,
        notes=data.notes
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    # Track assessment completion as journey event
    track_assessment(
        db=db,
        patient_id=data.patient_id,
        assessment_type="FACT-G Quality of Life",
        score=data.total_score,
        notes=f"Physical: {data.physical_score}, Social: {data.social_score}, Emotional: {data.emotional_score}, Functional: {data.functional_score}",
        created_by=current_user.id
    )
    
    # Generate alerts
    alerts_created = []
    
    # Low QOL overall
    if data.total_score < 50:
        create_assessment_alert(
            db, data.patient_id, "low_quality_of_life", "high",
            f"Low quality of life score (FACT-G: {data.total_score}/108). Comprehensive care review needed.",
            str(data.total_score)
        )
        alerts_created.append("low_quality_of_life")
    
    # Poor physical wellbeing
    if data.physical_score < 10:
        create_assessment_alert(
            db, data.patient_id, "poor_physical_wellbeing", "high",
            f"Poor physical wellbeing ({data.physical_score}/28). Symptom management review needed.",
            str(data.physical_score)
        )
        alerts_created.append("poor_physical_wellbeing")
    
    # Poor emotional wellbeing
    if data.emotional_score < 8:
        create_assessment_alert(
            db, data.patient_id, "poor_emotional_wellbeing", "medium",
            f"Poor emotional wellbeing ({data.emotional_score}/24). Consider psychological support.",
            str(data.emotional_score)
        )
        alerts_created.append("poor_emotional_wellbeing")
    
    # Low functional status
    if data.functional_score < 10:
        create_assessment_alert(
            db, data.patient_id, "poor_functional_wellbeing", "medium",
            f"Poor functional wellbeing ({data.functional_score}/28). Occupational therapy consultation recommended.",
            str(data.functional_score)
        )
        alerts_created.append("poor_functional_wellbeing")
    
    db.commit()
    
    return {
        "message": "Quality of Life assessment created successfully",
        "assessment_id": assessment.id,
        "total_score": data.total_score,
        "alerts_generated": alerts_created
    }

@router.get("/qol/{patient_id}")
async def get_patient_qol(
    patient_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all Quality of Life assessments for a patient"""
    
    assessments = db.query(QualityOfLifeAssessment).filter(
        QualityOfLifeAssessment.patient_id == patient_id
    ).order_by(desc(QualityOfLifeAssessment.assessed_at)).limit(limit).all()
    
    return {
        "patient_id": patient_id,
        "count": len(assessments),
        "assessments": assessments
    }

@router.get("/qol/{patient_id}/latest")
async def get_latest_qol(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get most recent Quality of Life assessment"""
    
    assessment = db.query(QualityOfLifeAssessment).filter(
        QualityOfLifeAssessment.patient_id == patient_id
    ).order_by(desc(QualityOfLifeAssessment.assessed_at)).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="No Quality of Life assessments found")
    
    return assessment


# ============================================================================
# CAREGIVER BURDEN (ZARIT) ENDPOINTS
# ============================================================================

class CaregiverBurdenCreate(BaseModel):
    patient_id: int
    caregiver_id: int
    q1_more_time: int
    q2_stressed: int
    q3_angry: int
    q4_affect_relationship: int
    q5_strained: int
    q6_health_suffered: int
    q7_lack_privacy: int
    q8_social_life_suffered: int
    q9_lost_control: int
    q10_uncertain: int
    q11_do_more: int
    q12_do_better: int
    total_score: int
    burden_level: str
    needs_respite_care: bool = False
    needs_support_group: bool = False
    needs_counseling: bool = False
    notes: Optional[str] = None

@router.post("/caregiver-burden")
async def create_caregiver_burden_assessment(
    data: CaregiverBurdenCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new Caregiver Burden (Zarit) assessment"""
    
    assessment = CaregiverBurdenAssessment(
        patient_id=data.patient_id,
        caregiver_id=data.caregiver_id,
        q1_more_time=data.q1_more_time,
        q2_stressed=data.q2_stressed,
        q3_angry=data.q3_angry,
        q4_affect_relationship=data.q4_affect_relationship,
        q5_strained=data.q5_strained,
        q6_health_suffered=data.q6_health_suffered,
        q7_lack_privacy=data.q7_lack_privacy,
        q8_social_life_suffered=data.q8_social_life_suffered,
        q9_lost_control=data.q9_lost_control,
        q10_uncertain=data.q10_uncertain,
        q11_do_more=data.q11_do_more,
        q12_do_better=data.q12_do_better,
        total_score=data.total_score,
        burden_level=data.burden_level,
        needs_respite_care=data.needs_respite_care,
        needs_support_group=data.needs_support_group,
        needs_counseling=data.needs_counseling,
        notes=data.notes
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    # Track assessment completion as journey event
    track_assessment(
        db=db,
        patient_id=data.patient_id,
        assessment_type="Caregiver Burden (Zarit)",
        score=data.total_score,
        notes=f"Burden level: {data.burden_level}",
        created_by=current_user.id
    )
    
    # Generate alerts
    alerts_created = []
    
    # High burden
    if data.total_score > 20:
        create_assessment_alert(
            db, data.patient_id, "high_caregiver_burden", "high",
            f"⚠️ HIGH CAREGIVER BURDEN ({data.total_score}/48). Urgent caregiver support needed to prevent burnout.",
            str(data.total_score)
        )
        alerts_created.append("high_caregiver_burden")
    elif data.total_score >= 10:
        create_assessment_alert(
            db, data.patient_id, "moderate_caregiver_burden", "medium",
            f"Moderate caregiver burden ({data.total_score}/48). Consider respite care and support services.",
            str(data.total_score)
        )
        alerts_created.append("moderate_caregiver_burden")
    
    # Specific support needs
    if data.needs_respite_care or data.needs_support_group or data.needs_counseling:
        needs = []
        if data.needs_respite_care:
            needs.append("respite care")
        if data.needs_support_group:
            needs.append("support group")
        if data.needs_counseling:
            needs.append("counseling")
        
        create_assessment_alert(
            db, data.patient_id, "caregiver_support_needed", "medium",
            f"Caregiver requested: {', '.join(needs)}",
            ', '.join(needs)
        )
        alerts_created.append("caregiver_support_requested")
    
    db.commit()
    
    return {
        "message": "Caregiver Burden assessment created successfully",
        "assessment_id": assessment.id,
        "total_score": data.total_score,
        "burden_level": data.burden_level,
        "alerts_generated": alerts_created
    }

@router.get("/caregiver-burden/{patient_id}")
async def get_patient_caregiver_burden(
    patient_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all Caregiver Burden assessments for a patient"""
    
    assessments = db.query(CaregiverBurdenAssessment).filter(
        CaregiverBurdenAssessment.patient_id == patient_id
    ).order_by(desc(CaregiverBurdenAssessment.assessed_at)).limit(limit).all()
    
    return {
        "patient_id": patient_id,
        "count": len(assessments),
        "assessments": assessments
    }

@router.get("/caregiver-burden/{patient_id}/latest")
async def get_latest_caregiver_burden(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get most recent Caregiver Burden assessment"""
    
    assessment = db.query(CaregiverBurdenAssessment).filter(
        CaregiverBurdenAssessment.patient_id == patient_id
    ).order_by(desc(CaregiverBurdenAssessment.assessed_at)).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="No Caregiver Burden assessments found")
    
    return assessment


# ============================================================================
# MOTOR SKILLS ENDPOINTS
# ============================================================================

class MotorSkillsCreate(BaseModel):
    patient_id: int
    grip_strength_right: Optional[float] = None
    grip_strength_left: Optional[float] = None
    grip_strength_interpretation: Optional[str] = None
    tug_time_seconds: Optional[float] = None
    tug_assistance_used: Optional[str] = None
    tug_fall_risk: Optional[str] = None
    walk_distance_meters: Optional[float] = None
    walk_dyspnea_before: Optional[int] = None
    walk_dyspnea_after: Optional[int] = None
    walk_oxygen_sat_before: Optional[int] = None
    walk_oxygen_sat_after: Optional[int] = None
    balance_score: Optional[int] = None
    coordination_score: Optional[int] = None
    notes: Optional[str] = None

@router.post("/motor-skills")
async def create_motor_skills_assessment(
    data: MotorSkillsCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new Motor Skills assessment"""
    
    assessment = MotorSkillsAssessment(
        patient_id=data.patient_id,
        assessed_by=current_user.id,
        grip_strength_right=data.grip_strength_right,
        grip_strength_left=data.grip_strength_left,
        grip_strength_interpretation=data.grip_strength_interpretation,
        tug_time_seconds=data.tug_time_seconds,
        tug_assistance_used=data.tug_assistance_used,
        tug_fall_risk=data.tug_fall_risk,
        walk_distance_meters=data.walk_distance_meters,
        walk_dyspnea_before=data.walk_dyspnea_before,
        walk_dyspnea_after=data.walk_dyspnea_after,
        walk_oxygen_sat_before=data.walk_oxygen_sat_before,
        walk_oxygen_sat_after=data.walk_oxygen_sat_after,
        balance_score=data.balance_score,
        coordination_score=data.coordination_score,
        notes=data.notes
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    # Track assessment completion as journey event
    notes_parts = []
    if data.tug_time_seconds:
        notes_parts.append(f"TUG: {data.tug_time_seconds}s")
    if data.walk_distance_meters:
        notes_parts.append(f"6MWT: {data.walk_distance_meters}m")
    if data.balance_score:
        notes_parts.append(f"Balance: {data.balance_score}/10")
    
    track_assessment(
        db=db,
        patient_id=data.patient_id,
        assessment_type="Motor Skills",
        notes=", ".join(notes_parts) if notes_parts else "Motor skills assessed",
        created_by=current_user.id
    )
    
    # Generate alerts
    alerts_created = []
    
    # High fall risk from TUG
    if data.tug_time_seconds and data.tug_time_seconds > 14:
        create_assessment_alert(
            db, data.patient_id, "high_fall_risk", "high",
            f"⚠️ HIGH FALL RISK: Timed Up & Go = {data.tug_time_seconds}s (>14s = high risk). Immediate fall prevention measures needed.",
            str(data.tug_time_seconds)
        )
        alerts_created.append("high_fall_risk")
    elif data.tug_time_seconds and data.tug_time_seconds > 12:
        create_assessment_alert(
            db, data.patient_id, "moderate_fall_risk", "medium",
            f"Moderate fall risk: TUG = {data.tug_time_seconds}s. Fall prevention strategies recommended.",
            str(data.tug_time_seconds)
        )
        alerts_created.append("moderate_fall_risk")
    
    # Low walk distance
    if data.walk_distance_meters and data.walk_distance_meters < 300:
        create_assessment_alert(
            db, data.patient_id, "poor_exercise_tolerance", "medium",
            f"Poor exercise tolerance: 6MWT = {data.walk_distance_meters}m (<300m). Consider cardiopulmonary assessment.",
            str(data.walk_distance_meters)
        )
        alerts_created.append("poor_exercise_tolerance")
    
    # Oxygen desaturation
    if (data.walk_oxygen_sat_before and data.walk_oxygen_sat_after and 
        data.walk_oxygen_sat_before - data.walk_oxygen_sat_after > 4):
        create_assessment_alert(
            db, data.patient_id, "oxygen_desaturation", "high",
            f"Significant oxygen desaturation with activity ({data.walk_oxygen_sat_before}% → {data.walk_oxygen_sat_after}%). O2 therapy assessment needed.",
            f"{data.walk_oxygen_sat_before}->{data.walk_oxygen_sat_after}"
        )
        alerts_created.append("oxygen_desaturation")
    
    # Poor balance
    if data.balance_score and data.balance_score < 3:
        create_assessment_alert(
            db, data.patient_id, "poor_balance", "high",
            f"Poor balance score ({data.balance_score}/10). Fall risk - physical therapy referral needed.",
            str(data.balance_score)
        )
        alerts_created.append("poor_balance")
    
    db.commit()
    
    return {
        "message": "Motor Skills assessment created successfully",
        "assessment_id": assessment.id,
        "alerts_generated": alerts_created
    }

@router.get("/motor-skills/{patient_id}")
async def get_patient_motor_skills(
    patient_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all Motor Skills assessments for a patient"""
    
    assessments = db.query(MotorSkillsAssessment).filter(
        MotorSkillsAssessment.patient_id == patient_id
    ).order_by(desc(MotorSkillsAssessment.assessed_at)).limit(limit).all()
    
    return {
        "patient_id": patient_id,
        "count": len(assessments),
        "assessments": assessments
    }

@router.get("/motor-skills/{patient_id}/latest")
async def get_latest_motor_skills(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get most recent Motor Skills assessment"""
    
    assessment = db.query(MotorSkillsAssessment).filter(
        MotorSkillsAssessment.patient_id == patient_id
    ).order_by(desc(MotorSkillsAssessment.assessed_at)).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="No Motor Skills assessments found")
    
    return assessment
