"""
AI-Powered Caregiver Intelligence System
Features:
- Smart caregiver-patient matching
- Workload balancing
- Skill-based recommendations
- Alert routing optimization
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from src.db import get_db, User, Patient, CaregiverAssignment, Alert, Vital, Symptom
from routers.auth import get_current_user

router = APIRouter(prefix="/api/caregiver-intelligence", tags=["Caregiver Intelligence"])


def calculate_caregiver_workload(caregiver_id: int, db: Session) -> Dict:
    """Calculate current workload metrics for a caregiver"""
    
    # Active patient assignments
    active_assignments = db.query(CaregiverAssignment).filter(
        CaregiverAssignment.caregiver_id == caregiver_id,
        CaregiverAssignment.active == True
    ).count()
    
    # Recent alerts from their patients (last 24 hours)
    patient_ids = [a.patient_id for a in db.query(CaregiverAssignment).filter(
        CaregiverAssignment.caregiver_id == caregiver_id,
        CaregiverAssignment.active == True
    ).all()]
    
    recent_alerts = db.query(Alert).filter(
        Alert.patient_id.in_(patient_ids) if patient_ids else False,
        Alert.created_at >= datetime.utcnow() - timedelta(days=1),
        Alert.is_acknowledged == False
    ).count()
    
    # Critical patients (high severity alerts in last 48 hours)
    critical_patients = db.query(Alert.patient_id).filter(
        Alert.patient_id.in_(patient_ids) if patient_ids else False,
        Alert.severity == 'critical',
        Alert.created_at >= datetime.utcnow() - timedelta(days=2)
    ).distinct().count()
    
    # Calculate workload score (0-100)
    workload_score = min(100, (
        (active_assignments * 10) +  # Each patient = 10 points
        (recent_alerts * 5) +         # Each alert = 5 points
        (critical_patients * 15)      # Each critical patient = 15 points
    ))
    
    return {
        "caregiver_id": caregiver_id,
        "active_patients": active_assignments,
        "recent_alerts": recent_alerts,
        "critical_patients": critical_patients,
        "workload_score": workload_score,
        "capacity_status": "overloaded" if workload_score > 80 else "full" if workload_score > 60 else "available"
    }


def calculate_patient_complexity(patient_id: int, db: Session) -> Dict:
    """Calculate patient complexity/care needs"""
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return {"complexity_score": 0, "factors": []}
    
    complexity_score = 0
    factors = []
    
    # Age factor (elderly = more complex)
    if patient.age >= 75:
        complexity_score += 20
        factors.append("Elderly patient (75+)")
    elif patient.age >= 65:
        complexity_score += 10
        factors.append("Senior patient (65+)")
    
    # Recent vitals instability (last 7 days)
    recent_vitals = db.query(Vital).filter(
        Vital.patient_id == patient_id,
        Vital.recorded_at >= datetime.utcnow() - timedelta(days=7)
    ).all()
    
    if recent_vitals:
        # Check for vital instability
        hr_variance = max([v.heart_rate for v in recent_vitals]) - min([v.heart_rate for v in recent_vitals])
        if hr_variance > 40:
            complexity_score += 15
            factors.append("Vital sign instability")
    
    # Recent symptom burden
    recent_symptoms = db.query(Symptom).filter(
        Symptom.patient_id == patient_id,
        Symptom.recorded_at >= datetime.utcnow() - timedelta(days=3)
    ).order_by(desc(Symptom.recorded_at)).first()
    
    if recent_symptoms:
        if recent_symptoms.pain_level >= 7:
            complexity_score += 20
            factors.append("Severe pain (7+/10)")
        elif recent_symptoms.pain_level >= 5:
            complexity_score += 10
            factors.append("Moderate pain (5-6/10)")
        
        symptom_count = sum([
            recent_symptoms.nausea,
            recent_symptoms.fatigue,
            recent_symptoms.anxiety,
            recent_symptoms.dyspnea
        ])
        if symptom_count >= 3:
            complexity_score += 15
            factors.append(f"Multiple symptoms ({symptom_count})")
    
    # Recent critical alerts
    critical_alerts = db.query(Alert).filter(
        Alert.patient_id == patient_id,
        Alert.severity == 'critical',
        Alert.created_at >= datetime.utcnow() - timedelta(days=3)
    ).count()
    
    if critical_alerts > 0:
        complexity_score += critical_alerts * 10
        factors.append(f"{critical_alerts} critical alerts (last 3 days)")
    
    # Diagnosis complexity
    high_complexity_diagnoses = ['cancer', 'heart_failure', 'copd', 'dementia', 'kidney_disease']
    if patient.primary_diagnosis and any(d in patient.primary_diagnosis.lower() for d in high_complexity_diagnoses):
        complexity_score += 15
        factors.append(f"Complex diagnosis: {patient.primary_diagnosis}")
    
    return {
        "patient_id": patient_id,
        "complexity_score": min(100, complexity_score),
        "complexity_level": "high" if complexity_score > 60 else "moderate" if complexity_score > 30 else "low",
        "factors": factors
    }


def match_caregiver_to_patient(patient_id: int, db: Session) -> List[Dict]:
    """AI-powered caregiver matching for a patient"""
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get patient complexity
    patient_complexity = calculate_patient_complexity(patient_id, db)
    
    # Get all caregivers
    caregivers = db.query(User).filter(
        User.role == 'caregiver',
        User.is_active == True
    ).all()
    
    recommendations = []
    
    for caregiver in caregivers:
        # Calculate workload
        workload = calculate_caregiver_workload(caregiver.id, db)
        
        # Calculate match score
        match_score = 100
        reasons = []
        
        # Workload penalty
        if workload["capacity_status"] == "overloaded":
            match_score -= 40
            reasons.append(f"⚠️ High workload ({workload['active_patients']} patients)")
        elif workload["capacity_status"] == "full":
            match_score -= 20
            reasons.append(f"Moderate workload ({workload['active_patients']} patients)")
        else:
            reasons.append(f"✅ Available capacity ({workload['active_patients']} patients)")
        
        # Complexity matching
        if patient_complexity["complexity_level"] == "high":
            # High complexity patients need caregivers with capacity
            if workload["active_patients"] >= 5:
                match_score -= 30
                reasons.append("❌ May lack bandwidth for high-complexity case")
            else:
                reasons.append("✅ Has bandwidth for complex case")
        
        # Already assigned bonus
        existing_assignment = db.query(CaregiverAssignment).filter(
            CaregiverAssignment.patient_id == patient_id,
            CaregiverAssignment.caregiver_id == caregiver.id,
            CaregiverAssignment.active == True
        ).first()
        
        if existing_assignment:
            match_score += 30
            reasons.append("✅ Already assigned (continuity of care)")
        
        # Geographic preference (if available)
        # TODO: Add location-based matching when available
        
        recommendations.append({
            "caregiver_id": caregiver.id,
            "caregiver_name": caregiver.full_name,
            "match_score": max(0, match_score),
            "recommendation": "highly_recommended" if match_score >= 80 else "recommended" if match_score >= 60 else "possible" if match_score >= 40 else "not_recommended",
            "workload": workload,
            "reasons": reasons,
            "already_assigned": existing_assignment is not None
        })
    
    # Sort by match score
    recommendations.sort(key=lambda x: x["match_score"], reverse=True)
    
    return recommendations


@router.get("/caregiver-workload/{caregiver_id}")
async def get_caregiver_workload(
    caregiver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current workload metrics for a caregiver"""
    
    # Only admins and clinicians can view workload
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    caregiver = db.query(User).filter(User.id == caregiver_id, User.role == 'caregiver').first()
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver not found")
    
    workload = calculate_caregiver_workload(caregiver_id, db)
    
    # Get assigned patient details
    assignments = db.query(CaregiverAssignment, Patient).join(
        Patient, CaregiverAssignment.patient_id == Patient.id
    ).filter(
        CaregiverAssignment.caregiver_id == caregiver_id,
        CaregiverAssignment.active == True
    ).all()
    
    assigned_patients = []
    for assignment, patient in assignments:
        complexity = calculate_patient_complexity(patient.id, db)
        assigned_patients.append({
            "patient_id": patient.id,
            "patient_name": patient.full_name,
            "diagnosis": patient.primary_diagnosis,
            "complexity": complexity["complexity_level"],
            "assigned_date": assignment.assigned_date.isoformat() if assignment.assigned_date else None
        })
    
    return {
        "caregiver": {
            "id": caregiver.id,
            "name": caregiver.full_name,
            "email": caregiver.email
        },
        "workload": workload,
        "assigned_patients": assigned_patients,
        "recommendations": [
            "Consider reassigning if workload exceeds 80" if workload["workload_score"] > 80 else None,
            "At optimal capacity" if 40 <= workload["workload_score"] <= 60 else None,
            "Can take on more patients" if workload["workload_score"] < 40 else None
        ]
    }


@router.get("/team-overview")
async def get_team_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get overview of entire care team workload and capacity"""
    
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    caregivers = db.query(User).filter(
        User.role == 'caregiver',
        User.is_active == True
    ).all()
    
    team_metrics = []
    total_capacity = 0
    total_assigned = 0
    overloaded_count = 0
    
    for caregiver in caregivers:
        workload = calculate_caregiver_workload(caregiver.id, db)
        team_metrics.append({
            "caregiver_id": caregiver.id,
            "caregiver_name": caregiver.full_name,
            "workload": workload
        })
        
        total_assigned += workload["active_patients"]
        
        if workload["capacity_status"] == "overloaded":
            overloaded_count += 1
        elif workload["capacity_status"] == "available":
            total_capacity += 1
    
    # Sort by workload (highest first)
    team_metrics.sort(key=lambda x: x["workload"]["workload_score"], reverse=True)
    
    return {
        "team_size": len(caregivers),
        "total_patients_assigned": total_assigned,
        "available_caregivers": total_capacity,
        "overloaded_caregivers": overloaded_count,
        "average_patients_per_caregiver": round(total_assigned / len(caregivers), 1) if caregivers else 0,
        "team_metrics": team_metrics,
        "recommendations": [
            f"⚠️ {overloaded_count} caregivers are overloaded - consider rebalancing" if overloaded_count > 0 else None,
            f"✅ {total_capacity} caregivers have available capacity" if total_capacity > 0 else None,
            "❌ Team at full capacity - consider hiring" if total_capacity == 0 and overloaded_count > 0 else None
        ]
    }


@router.get("/match-caregiver/{patient_id}")
async def get_caregiver_recommendations(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get AI-powered caregiver recommendations for a patient"""
    
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get patient complexity
    complexity = calculate_patient_complexity(patient_id, db)
    
    # Get caregiver recommendations
    recommendations = match_caregiver_to_patient(patient_id, db)
    
    return {
        "patient": {
            "id": patient.id,
            "name": patient.full_name,
            "diagnosis": patient.primary_diagnosis,
            "age": patient.age
        },
        "patient_complexity": complexity,
        "caregiver_recommendations": recommendations[:5],  # Top 5
        "analysis": {
            "requires_experienced_caregiver": complexity["complexity_score"] > 60,
            "needs_immediate_assignment": complexity["complexity_level"] == "high" and not any(r["already_assigned"] for r in recommendations),
            "current_assignment_optimal": any(r["already_assigned"] and r["match_score"] >= 70 for r in recommendations)
        }
    }


@router.post("/assign-optimal-caregiver/{patient_id}")
async def assign_optimal_caregiver(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Automatically assign best-match caregiver to patient"""
    
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Get recommendations
    recommendations = match_caregiver_to_patient(patient_id, db)
    
    if not recommendations:
        raise HTTPException(status_code=404, detail="No caregivers available")
    
    # Check if already assigned
    if recommendations[0]["already_assigned"]:
        return {
            "status": "already_assigned",
            "message": "Patient already has optimal caregiver assigned",
            "assignment": recommendations[0]
        }
    
    # Assign best match
    best_match = recommendations[0]
    
    # Deactivate any existing assignments
    db.query(CaregiverAssignment).filter(
        CaregiverAssignment.patient_id == patient_id,
        CaregiverAssignment.active == True
    ).update({"active": False})
    
    # Create new assignment
    new_assignment = CaregiverAssignment(
        patient_id=patient_id,
        caregiver_id=best_match["caregiver_id"],
        assigned_at=datetime.utcnow(),
        assigned_by=current_user.id,
        active=True
    )
    
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    
    return {
        "status": "assigned",
        "message": f"Patient assigned to {best_match['caregiver_name']}",
        "assignment": {
            "assignment_id": new_assignment.id,
            "caregiver_id": best_match["caregiver_id"],
            "caregiver_name": best_match["caregiver_name"],
            "match_score": best_match["match_score"],
            "reasons": best_match["reasons"]
        }
    }


@router.get("/alert-routing-suggestions")
async def get_alert_routing_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Suggest optimal caregiver for routing new alerts"""
    
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Get unacknowledged critical alerts
    critical_alerts = db.query(Alert, Patient).join(
        Patient, Alert.patient_id == Patient.id
    ).filter(
        Alert.severity == 'critical',
        Alert.is_acknowledged == False
    ).all()
    
    routing_suggestions = []
    
    for alert, patient in critical_alerts:
        # Check if patient has assigned caregiver
        assignment = db.query(CaregiverAssignment, User).join(
            User, CaregiverAssignment.caregiver_id == User.id
        ).filter(
            CaregiverAssignment.patient_id == patient.id,
            CaregiverAssignment.active == True
        ).first()
        
        if assignment:
            caregiver_assignment, caregiver = assignment
            workload = calculate_caregiver_workload(caregiver.id, db)
            
            routing_suggestions.append({
                "alert_id": alert.id,
                "patient_id": patient.id,
                "patient_name": patient.full_name,
                "alert_message": alert.message,
                "route_to": {
                    "caregiver_id": caregiver.id,
                    "caregiver_name": caregiver.full_name,
                    "reason": "Assigned caregiver",
                    "availability": workload["capacity_status"]
                },
                "priority": "immediate" if workload["capacity_status"] != "overloaded" else "escalate_to_clinician"
            })
        else:
            # No assigned caregiver - suggest best match
            recommendations = match_caregiver_to_patient(patient.id, db)
            if recommendations:
                best_match = recommendations[0]
                routing_suggestions.append({
                    "alert_id": alert.id,
                    "patient_id": patient.id,
                    "patient_name": patient.full_name,
                    "alert_message": alert.message,
                    "route_to": {
                        "caregiver_id": best_match["caregiver_id"],
                        "caregiver_name": best_match["caregiver_name"],
                        "reason": "Best match available",
                        "availability": best_match["workload"]["capacity_status"]
                    },
                    "priority": "assign_then_route"
                })
    
    return {
        "total_critical_alerts": len(critical_alerts),
        "routing_suggestions": routing_suggestions,
        "summary": {
            "immediate_route": len([s for s in routing_suggestions if s["priority"] == "immediate"]),
            "needs_assignment": len([s for s in routing_suggestions if s["priority"] == "assign_then_route"]),
            "escalate_to_clinician": len([s for s in routing_suggestions if s["priority"] == "escalate_to_clinician"])
        }
    }


class AssignCaregiverRequest(BaseModel):
    caregiver_id: int
    notes: Optional[str] = None


@router.post("/assign/{patient_id}")
async def assign_caregiver_to_patient(
    patient_id: int,
    request: AssignCaregiverRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually assign a caregiver to a patient (admin/clinician)."""
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    caregiver = db.query(User).filter(
        User.id == request.caregiver_id,
        User.role == 'caregiver',
        User.is_active == True,
    ).first()
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver not found")

    db.query(CaregiverAssignment).filter(
        CaregiverAssignment.patient_id == patient_id,
        CaregiverAssignment.active == True,
    ).update({"active": False})

    assignment = CaregiverAssignment(
        patient_id=patient_id,
        caregiver_id=request.caregiver_id,
        assigned_at=datetime.utcnow(),
        assigned_by=current_user.id,
        active=True,
        notes=request.notes,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "status": "assigned",
        "assignment_id": assignment.id,
        "patient_id": patient_id,
        "patient_name": patient.full_name,
        "caregiver_id": caregiver.id,
        "caregiver_name": caregiver.full_name,
    }


@router.delete("/assign/{patient_id}/{caregiver_id}")
async def unassign_caregiver(
    patient_id: int,
    caregiver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove caregiver assignment from a patient."""
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    updated = db.query(CaregiverAssignment).filter(
        CaregiverAssignment.patient_id == patient_id,
        CaregiverAssignment.caregiver_id == caregiver_id,
        CaregiverAssignment.active == True,
    ).update({"active": False})
    db.commit()

    if not updated:
        raise HTTPException(status_code=404, detail="Active assignment not found")

    return {"message": "Assignment removed"}


@router.get("/my-patients")
async def get_my_assigned_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Caregiver view: all assigned patients with care summary."""
    if current_user.role != 'caregiver':
        raise HTTPException(status_code=403, detail="Caregiver access only")

    assignments = db.query(CaregiverAssignment, Patient).join(
        Patient, CaregiverAssignment.patient_id == Patient.id
    ).filter(
        CaregiverAssignment.caregiver_id == current_user.id,
        CaregiverAssignment.active == True,
    ).all()

    patients = []
    for assignment, patient in assignments:
        recent_alerts = db.query(Alert).filter(
            Alert.patient_id == patient.id,
            Alert.is_dismissed == False,
            Alert.is_acknowledged == False,
        ).count()
        patients.append({
            "patient_id": patient.id,
            "patient_code": patient.patient_code,
            "full_name": patient.full_name,
            "age": patient.age,
            "primary_diagnosis": patient.primary_diagnosis,
            "status": patient.status,
            "risk_level": patient.risk_level,
            "risk_score": patient.risk_score,
            "phone": patient.phone,
            "emergency_contact_name": patient.emergency_contact_name,
            "emergency_contact_phone": patient.emergency_contact_phone,
            "assigned_at": assignment.assigned_at.isoformat() if assignment.assigned_at else None,
            "active_alerts": recent_alerts,
        })

    return {"total": len(patients), "patients": patients}
