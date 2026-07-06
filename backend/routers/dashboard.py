"""Dashboard Router"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.db import get_db, User, Patient, Alert
from routers.auth import get_current_user

router = APIRouter()

@router.get("/summary")
async def get_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get role-specific dashboard summary"""
    
    if current_user.role in ['admin', 'clinician']:
        total_patients = db.query(Patient).filter(Patient.status == 'active').count()
        high_risk = db.query(Patient).filter(Patient.risk_level.in_(['High', 'Crisis'])).count()
        active_alerts = db.query(Alert).filter(Alert.is_acknowledged == False).count()
        
        # Get patients for table
        patients = db.query(Patient).filter(Patient.status == 'active').order_by(Patient.risk_score.desc()).limit(10).all()
        patients_list = [{
            "id": p.id,
            "patient_code": p.patient_code,
            "full_name": p.full_name,
            "age": p.age,
            "primary_diagnosis": p.primary_diagnosis,
            "risk_level": p.risk_level,
            "risk_score": p.risk_score,
            "care_pathway": p.care_pathway
        } for p in patients]
        
        return {
            "role": current_user.role,
            "stats": {
                "total_patients": total_patients,
                "high_risk_patients": high_risk,
                "active_alerts": active_alerts,
                "avg_pain_score": 5.2
            },
            "patients": patients_list,
            "recent_alerts": []
        }
    
    return {"role": current_user.role, "stats": {}, "patients": []}
