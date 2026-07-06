"""
AI Analysis Router - Proactive Patient Monitoring and Insights
Continuously analyzes all patients and provides actionable clinical guidance
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import numpy as np

from src.db import get_db, User, Patient, Vital, Symptom, Medication, Appointment, Alert
from routers.auth import get_current_user

router = APIRouter()


# Pydantic Models
class PatientInsight(BaseModel):
    patient_id: int
    patient_name: str
    patient_code: str
    risk_level: str
    priority: str
    key_concerns: List[str]
    recommended_actions: List[str]
    trend: str
    clinical_notes: str


class SystemInsights(BaseModel):
    critical_patients: List[PatientInsight]
    deteriorating_patients: List[PatientInsight]
    stable_patients: List[PatientInsight]
    immediate_actions: List[Dict[str, Any]]
    trends: Dict[str, Any]
    clinical_summary: str


class ClinicalRecommendation(BaseModel):
    patient_id: int
    patient_name: str
    recommendation_type: str
    priority: str
    title: str
    description: str
    rationale: str
    suggested_interventions: List[str]


# ==================== ANALYSIS FUNCTIONS ====================

def analyze_vital_trends(patient_id: int, db: Session) -> Dict[str, Any]:
    """Analyze vital sign trends over last 7 days"""
    week_ago = datetime.utcnow() - timedelta(days=7)
    vitals = db.query(Vital).filter(
        Vital.patient_id == patient_id,
        Vital.recorded_at >= week_ago
    ).order_by(Vital.recorded_at.desc()).all()
    
    if len(vitals) < 2:
        return {"trend": "insufficient_data", "concerns": [], "data_points": 0}
    
    concerns = []
    trend = "stable"
    
    # Heart rate trend
    recent_hr = [v.heart_rate for v in vitals[:3] if v.heart_rate]
    older_hr = [v.heart_rate for v in vitals[3:6] if v.heart_rate]
    
    if recent_hr and older_hr:
        avg_recent_hr = np.mean(recent_hr)
        avg_older_hr = np.mean(older_hr)
        
        if avg_recent_hr > avg_older_hr + 15:
            concerns.append(f"Heart rate increasing (from {avg_older_hr:.0f} to {avg_recent_hr:.0f} bpm)")
            trend = "deteriorating"
        elif avg_recent_hr > 110:
            concerns.append(f"Tachycardia: {avg_recent_hr:.0f} bpm")
            trend = "critical"
    
    # Oxygen saturation
    recent_o2 = [v.oxygen_saturation for v in vitals[:3] if v.oxygen_saturation]
    if recent_o2:
        avg_o2 = np.mean(recent_o2)
        if avg_o2 < 88:
            concerns.append(f"Critical hypoxemia: {avg_o2:.0f}% O2 saturation")
            trend = "critical"
        elif avg_o2 < 92:
            concerns.append(f"Low oxygen saturation: {avg_o2:.0f}%")
            if trend != "critical":
                trend = "deteriorating"
    
    # Blood pressure
    recent_bp_sys = [v.blood_pressure_sys for v in vitals[:3] if v.blood_pressure_sys]
    if recent_bp_sys:
        avg_bp = np.mean(recent_bp_sys)
        if avg_bp > 160:
            concerns.append(f"Hypertension: {avg_bp:.0f} mmHg systolic")
        elif avg_bp < 90:
            concerns.append(f"Hypotension: {avg_bp:.0f} mmHg systolic")
            if trend != "critical":
                trend = "deteriorating"
    
    return {
        "trend": trend,
        "concerns": concerns,
        "data_points": len(vitals)
    }


def analyze_symptom_burden(patient_id: int, db: Session) -> Dict[str, Any]:
    """Analyze symptom burden and trends"""
    week_ago = datetime.utcnow() - timedelta(days=7)
    symptoms = db.query(Symptom).filter(
        Symptom.patient_id == patient_id,
        Symptom.recorded_at >= week_ago
    ).order_by(Symptom.recorded_at.desc()).all()
    
    if not symptoms:
        return {"burden": "low", "concerns": [], "pain_trend": "stable"}
    
    concerns = []
    
    # Pain analysis
    pain_levels = [s.pain_level for s in symptoms if s.pain_level is not None]
    if pain_levels:
        avg_pain = np.mean(pain_levels)
        max_pain = max(pain_levels)
        
        if avg_pain > 7:
            concerns.append(f"Severe pain: average {avg_pain:.1f}/10")
        elif avg_pain > 5:
            concerns.append(f"Moderate pain: average {avg_pain:.1f}/10")
        
        if max_pain >= 9:
            concerns.append(f"Pain crisis episode: {max_pain}/10")
        
        # Pain trend
        if len(pain_levels) >= 3:
            recent_pain = np.mean(pain_levels[:2])
            older_pain = np.mean(pain_levels[-2:])
            pain_trend = "increasing" if recent_pain > older_pain + 1 else "stable"
        else:
            pain_trend = "stable"
    else:
        pain_trend = "no_data"
    
    # Symptom frequency
    nausea_count = sum(1 for s in symptoms if s.nausea)
    fatigue_count = sum(1 for s in symptoms if s.fatigue)
    anxiety_count = sum(1 for s in symptoms if s.anxiety)
    dyspnea_count = sum(1 for s in symptoms if s.breathlessness)
    
    total_symptoms = len(symptoms)
    if nausea_count / total_symptoms > 0.6:
        concerns.append(f"Frequent nausea ({nausea_count}/{total_symptoms} logs)")
    if dyspnea_count / total_symptoms > 0.5:
        concerns.append(f"Persistent breathlessness ({dyspnea_count}/{total_symptoms} logs)")
    if anxiety_count / total_symptoms > 0.7:
        concerns.append(f"High anxiety burden ({anxiety_count}/{total_symptoms} logs)")
    
    burden = "high" if len(concerns) >= 2 else "moderate" if len(concerns) == 1 else "low"
    
    return {
        "burden": burden,
        "concerns": concerns,
        "pain_trend": pain_trend,
        "avg_pain": np.mean(pain_levels) if pain_levels else None
    }


def analyze_medication_adherence(patient_id: int, db: Session) -> Dict[str, Any]:
    """Analyze medication patterns and adherence"""
    active_meds = db.query(Medication).filter(
        Medication.patient_id == patient_id,
        Medication.is_active == True
    ).all()
    
    concerns = []
    recommendations = []
    
    if len(active_meds) > 8:
        concerns.append(f"Polypharmacy: {len(active_meds)} active medications")
        recommendations.append("Review medication list for potential deprescribing")
    
    # Check for pain medications
    pain_meds = [m for m in active_meds if m.indication and ('pain' in m.indication.lower() or 'analges' in m.indication.lower())] if active_meds else []
    if not pain_meds:
        recommendations.append("No pain medications prescribed - assess pain management needs")
    
    # Check for PRN medications
    prn_meds = [m for m in active_meds if 'prn' in m.frequency.lower() or 'as needed' in m.frequency.lower()]
    
    return {
        "total_active": len(active_meds),
        "pain_medications": len(pain_meds),
        "prn_medications": len(prn_meds),
        "concerns": concerns,
        "recommendations": recommendations
    }


def generate_recommendations(patient: Patient, vitals_analysis: Dict, symptoms_analysis: Dict, 
                            meds_analysis: Dict, db: Session) -> List[str]:
    """Generate actionable clinical recommendations"""
    recommendations = []
    
    vitals_trend = vitals_analysis.get("trend", "insufficient_data")
    vitals_concerns = vitals_analysis.get("concerns", [])
    symptoms_burden = symptoms_analysis.get("burden", "low")
    symptoms_pain_trend = symptoms_analysis.get("pain_trend", "no_data")
    meds_concerns = meds_analysis.get("concerns", [])
    meds_recs = meds_analysis.get("recommendations", [])
    meds_total = meds_analysis.get("total_active", 0)

    if vitals_trend == "critical":
        recommendations.append("URGENT: Immediate clinical assessment required")
        recommendations.append("Consider emergency intervention or hospitalization")
    
    if vitals_trend == "deteriorating":
        recommendations.append("Schedule urgent clinician review within 24 hours")
        recommendations.append("Increase monitoring frequency to twice daily")
    
    if symptoms_analysis.get("avg_pain") and symptoms_analysis["avg_pain"] > 7:
        recommendations.append("Escalate pain management protocol")
        recommendations.append("Consider consultation with pain specialist")
    
    if symptoms_pain_trend == "increasing":
        recommendations.append("Pain trending upward - reassess current pain regimen")
    
    if symptoms_burden == "high":
        recommendations.append("Initiate aggressive symptom management")
        recommendations.append("Consider multidisciplinary team involvement")
    
    if meds_concerns:
        recommendations.extend(meds_recs)
    
    if any("oxygen" in c.lower() or "hypoxemia" in c.lower() for c in vitals_concerns):
        recommendations.append("Oxygen therapy assessment needed")
        recommendations.append("Consider pulmonary consultation")
    
    if vitals_trend == "stable" and meds_total > 6:
        recommendations.append("Medication reconciliation recommended")
    
    if not recommendations:
        recommendations.append("Continue current care plan")
        recommendations.append("Maintain routine monitoring schedule")
    
    return recommendations


def get_priority_level(vitals_analysis: Dict, symptoms_analysis: Dict) -> str:
    """Determine patient priority level"""
    vitals_trend = vitals_analysis.get("trend", "insufficient_data")
    symptoms_burden = symptoms_analysis.get("burden", "low")
    if vitals_trend == "critical":
        return "CRITICAL"
    elif vitals_trend == "deteriorating" or symptoms_burden == "high":
        return "HIGH"
    elif symptoms_burden == "moderate":
        return "MODERATE"
    else:
        return "LOW"


@router.get("/system-insights", response_model=SystemInsights)
def get_system_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Comprehensive AI analysis of all patients with actionable insights
    """
    try:
        patients = db.query(Patient).all()
        print(f"📊 Analyzing {len(patients)} patients...")
    except Exception as e:
        print(f"❌ Error fetching patients: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    critical_patients = []
    deteriorating_patients = []
    stable_patients = []
    immediate_actions = []
    
    for patient in patients:
        print(f"  → Analyzing patient {patient.id}: {patient.full_name}")
        
        try:
            # Analyze each patient
            try:
                vitals_analysis = analyze_vital_trends(patient.id, db)
                print(f"    ✓ Vitals analyzed")
            except Exception as e:
                print(f"    ❌ Vitals analysis error: {e}")
                vitals_analysis = {"trend": "insufficient_data", "concerns": [], "data_points": 0}
            
            try:
                symptoms_analysis = analyze_symptom_burden(patient.id, db)
                print(f"    ✓ Symptoms analyzed")
            except Exception as e:
                print(f"    ❌ Symptoms analysis error: {e}")
                symptoms_analysis = {"burden": "low", "concerns": [], "pain_trend": "no_data"}
            
            try:
                meds_analysis = analyze_medication_adherence(patient.id, db)
                print(f"    ✓ Medications analyzed")
            except Exception as e:
                print(f"    ❌ Meds analysis error: {e}")
                meds_analysis = {"total_active": 0, "pain_medications": 0, "prn_medications": 0, "concerns": [], "recommendations": []}
            
            # Generate recommendations
            try:
                recommendations = generate_recommendations(patient, vitals_analysis, symptoms_analysis, meds_analysis, db)
            except Exception as e:
                print(f"    ❌ Recommendations error: {e}")
                recommendations = ["✅ Continue current care plan"]
            
            # Determine priority
            try:
                priority = get_priority_level(vitals_analysis, symptoms_analysis)
            except Exception as e:
                print(f"    ❌ Priority error: {e}")
                priority = "LOW"
            
            # Combine concerns
            all_concerns = vitals_analysis.get("concerns", []) + symptoms_analysis.get("concerns", []) + meds_analysis.get("concerns", [])

            # Determine risk level
            if vitals_analysis.get("trend") == "critical":
                risk_level = "Critical"
            elif vitals_analysis.get("trend") == "deteriorating":
                risk_level = "High"
            elif symptoms_analysis.get("burden") == "high":
                risk_level = "Elevated"
            else:
                risk_level = "Stable"
            
            # Generate clinical notes
            clinical_notes = f"Patient {patient.full_name} "
            v_trend = vitals_analysis.get("trend", "insufficient_data")
            if v_trend == "critical":
                clinical_notes += "requires immediate attention. "
            elif v_trend == "deteriorating":
                clinical_notes += "is showing signs of deterioration. "
            else:
                clinical_notes += "is maintaining stable condition. "
            
            if symptoms_analysis.get("avg_pain"):
                clinical_notes += f"Average pain level: {symptoms_analysis['avg_pain']:.1f}/10. "
            
            if vitals_analysis.get("data_points", 0) > 0:
                clinical_notes += f"Based on {vitals_analysis['data_points']} vital signs recorded. "
            
            insight = PatientInsight(
                patient_id=patient.id,
                patient_name=patient.full_name,
                patient_code=patient.patient_code,
                risk_level=risk_level,
                priority=priority,
                key_concerns=all_concerns[:5],
                recommended_actions=recommendations[:4],
                trend=v_trend,
                clinical_notes=clinical_notes
            )
            print(f"    ✓ Insight created: {priority}")
            
            v_concerns = vitals_analysis.get("concerns", [])
            # Categorize
            if priority == "CRITICAL":
                critical_patients.append(insight)
                immediate_actions.append({
                    "patient": patient.full_name,
                    "patient_id": patient.id,
                    "action": "Immediate clinical assessment",
                    "urgency": "CRITICAL",
                    "reason": v_concerns[0] if v_concerns else "Critical condition"
                })
            elif priority == "HIGH":
                deteriorating_patients.append(insight)
                immediate_actions.append({
                    "patient": patient.full_name,
                    "patient_id": patient.id,
                    "action": "Schedule urgent review",
                    "urgency": "HIGH",
                    "reason": all_concerns[0] if all_concerns else "Deteriorating condition"
                })
            else:
                stable_patients.append(insight)
        
        except Exception as e:
            print(f"    ❌ Error processing patient {patient.id}: {e}")
            import traceback
            traceback.print_exc()
            # Continue with next patient instead of crashing
            continue
    
    # Generate trends
    total_critical = len(critical_patients)
    total_deteriorating = len(deteriorating_patients)
    total_stable = len(stable_patients)
    
    # Clinical summary
    clinical_summary = f"System Analysis: {len(patients)} total patients. "
    
    if total_critical > 0:
        clinical_summary += f"🔴 {total_critical} patient{'s' if total_critical != 1 else ''} require immediate attention. "
    if total_deteriorating > 0:
        clinical_summary += f"⚠️ {total_deteriorating} patient{'s' if total_deteriorating != 1 else ''} showing deterioration. "
    if total_stable > 0:
        clinical_summary += f"✅ {total_stable} patient{'s' if total_stable != 1 else ''} stable. "
    
    if total_critical > 0:
        clinical_summary += "Priority: Address critical patients first. "
    elif total_deteriorating > 0:
        clinical_summary += "Priority: Review deteriorating patients within 24 hours. "
    else:
        clinical_summary += "All patients stable - continue routine monitoring. "
    
    print(f"✅ Analysis complete: {total_critical} critical, {total_deteriorating} deteriorating, {total_stable} stable")
    
    try:
        result = SystemInsights(
            critical_patients=critical_patients,
            deteriorating_patients=deteriorating_patients,
            stable_patients=stable_patients,
            immediate_actions=immediate_actions[:10],  # Top 10 actions
            trends={
                "total_patients": len(patients),
                "critical_count": total_critical,
                "deteriorating_count": total_deteriorating,
                "stable_count": total_stable,
                "critical_percentage": (total_critical / len(patients) * 100) if patients else 0,
                "action_items": len(immediate_actions)
            },
            clinical_summary=clinical_summary
        )
        print(f"✅ Response model created successfully")
        return result
    except Exception as e:
        print(f"❌ Error creating response: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Response serialization error: {str(e)}")


@router.get("/patient-recommendations/{patient_id}")
def get_patient_recommendations(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed clinical recommendations for a specific patient
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Analyze
    vitals_analysis = analyze_vital_trends(patient_id, db)
    symptoms_analysis = analyze_symptom_burden(patient_id, db)
    meds_analysis = analyze_medication_adherence(patient_id, db)
    
    # Generate comprehensive recommendations
    recommendations = generate_recommendations(patient, vitals_analysis, symptoms_analysis, meds_analysis, db)
    
    return {
        "patient_id": patient_id,
        "patient_name": patient.full_name,
        "analysis": {
            "vitals": vitals_analysis,
            "symptoms": symptoms_analysis,
            "medications": meds_analysis
        },
        "recommendations": recommendations,
        "priority": get_priority_level(vitals_analysis, symptoms_analysis),
        "summary": f"Patient has {len(vitals_analysis.get('concerns', []) + symptoms_analysis.get('concerns', []))} active concerns requiring attention."
    }
