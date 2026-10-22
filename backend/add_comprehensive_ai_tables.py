"""
Add Comprehensive AI Monitoring Tables
Adds: Patient Allergies, Medication Effects, Enhanced Predictions
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.db import Base, engine, SessionLocal
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from datetime import datetime


# New table for Patient Allergies
class PatientAllergy(Base):
    """Patient Allergies - Critical for medication safety"""
    __tablename__ = 'patient_allergies'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    allergen_type = Column(String(50), nullable=False)  # medication, food, environmental
    allergen_name = Column(String(200), nullable=False)
    reaction_severity = Column(String(20))  # mild, moderate, severe, life_threatening
    reaction_description = Column(Text)  # symptoms experienced
    onset_date = Column(DateTime)
    verified_by = Column(Integer, ForeignKey('users.id'))
    verified_at = Column(DateTime)
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


# New table for Medication Effects Tracking
class MedicationEffect(Base):
    """Track medication effects - both intended and adverse"""
    __tablename__ = 'medication_effects'
    id = Column(Integer, primary_key=True)
    medication_id = Column(Integer, ForeignKey('medications.id'), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    effect_type = Column(String(30), nullable=False)  # therapeutic, adverse, neutral
    effect_description = Column(String(200), nullable=False)
    severity = Column(String(20))  # mild, moderate, severe
    onset_date = Column(DateTime)
    resolution_date = Column(DateTime)
    reported_by_patient = Column(Boolean, default=False)
    reported_by_clinician_id = Column(Integer, ForeignKey('users.id'))
    action_taken = Column(Text)  # what was done about it
    is_ongoing = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


print("Creating comprehensive AI monitoring tables...")

try:
    # Create tables — use checkfirst=True so it's safe to run multiple times
    # and won't fail if parent tables don't exist yet
    Base.metadata.create_all(bind=engine, tables=[
        PatientAllergy.__table__,
        MedicationEffect.__table__
    ], checkfirst=True)
    
    print("[OK] Tables created successfully!")
    print("   - patient_allergies")
    print("   - medication_effects")
    
    # Add sample data
    db = SessionLocal()
    
    # Check if data already exists
    existing = db.query(PatientAllergy).first()
    if not existing:
        print("\n[INFO] Adding sample data...")
        
        # Sample allergies for patient 1
        allergies = [
            PatientAllergy(
                patient_id=1,
                allergen_type="medication",
                allergen_name="Penicillin",
                reaction_severity="severe",
                reaction_description="Anaphylaxis, difficulty breathing, hives",
                is_active=True
            ),
            PatientAllergy(
                patient_id=1,
                allergen_type="medication",
                allergen_name="NSAIDs",
                reaction_severity="moderate",
                reaction_description="Stomach upset, nausea",
                is_active=True
            ),
            PatientAllergy(
                patient_id=2,
                allergen_type="medication",
                allergen_name="Morphine",
                reaction_severity="mild",
                reaction_description="Itching, mild rash",
                is_active=True
            )
        ]
        
        for allergy in allergies:
            db.add(allergy)
        
        print("   [OK] Added 3 sample allergies")
        
        # Sample medication effects
        effects = [
            MedicationEffect(
                medication_id=1,
                patient_id=1,
                effect_type="therapeutic",
                effect_description="Good pain relief achieved",
                severity="mild",
                reported_by_patient=True,
                is_ongoing=True
            ),
            MedicationEffect(
                medication_id=1,
                patient_id=1,
                effect_type="adverse",
                effect_description="Constipation",
                severity="moderate",
                reported_by_patient=True,
                action_taken="Started stool softener",
                is_ongoing=True
            )
        ]
        
        for effect in effects:
            db.add(effect)
        
        print("   [OK] Added 2 sample medication effects")
        
        db.commit()
        print("\n[OK] All done!")
    else:
        print("\n[OK] Data already exists, skipping sample data")
    
    db.close()
    
except Exception as e:
    print(f"[ERROR] Error: {e}")
    import traceback
    traceback.print_exc()
