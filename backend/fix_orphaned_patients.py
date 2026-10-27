"""
fix_orphaned_patients.py
========================
One-time migration: creates Patient records for any patient/family users
who registered before the auto-creation fix was applied.

Safe to run multiple times - skips users who already have a Patient link.

Usage:
  cd backend
  python fix_orphaned_patients.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime
from src.db import SessionLocal, User, Patient, PatientPreferences, CaregiverAssignment

def fix_orphaned():
    db = SessionLocal()
    try:
        # Find first real clinician to assign as care lead
        clinician = db.query(User).filter(
            User.role.in_(["clinician", "admin"]),
            User.is_active == True,
            User.username.notlike("test%"),
        ).order_by(User.id.asc()).first()

        if not clinician:
            print("No clinician found - assignments will be skipped")

        # Find all patient/family users
        patient_users = db.query(User).filter(
            User.role.in_(["patient", "family"])
        ).all()

        fixed = 0
        skipped = 0

        for user in patient_users:
            # Check if they already have a linked Patient
            prefs = db.query(PatientPreferences).filter(
                PatientPreferences.user_id == user.id,
                PatientPreferences.patient_id != None,
            ).first()

            if prefs and prefs.patient_id:
                # Verify the patient actually exists
                p = db.query(Patient).filter(Patient.id == prefs.patient_id).first()
                if p:
                    skipped += 1
                    continue  # already linked

            # Check by name match
            existing = db.query(Patient).filter(Patient.full_name == user.full_name).first()

            if existing:
                # Link existing patient to this user
                pref_row = db.query(PatientPreferences).filter(
                    PatientPreferences.user_id == user.id
                ).first()
                if pref_row:
                    pref_row.patient_id = existing.id
                else:
                    db.add(PatientPreferences(
                        user_id=user.id,
                        patient_id=existing.id,
                        questionnaire_complete=False,
                    ))
                print(f"  Linked existing patient '{existing.full_name}' (id={existing.id}) to user_id={user.id}")
                fixed += 1
                continue

            # No patient at all - create one
            code = f"PA{user.id:04d}"
            # Avoid duplicate patient_code
            existing_code = db.query(Patient).filter(Patient.patient_code == code).first()
            if existing_code:
                code = f"PA{user.id:04d}x"

            new_patient = Patient(
                full_name=user.full_name,
                patient_code=code,
                date_of_birth=datetime(1970, 1, 1),
                status="active",
                primary_diagnosis="To be assessed",
                phone=user.phone,
                created_at=datetime.utcnow(),
            )
            db.add(new_patient)
            db.flush()

            # Link via preferences
            pref_row = db.query(PatientPreferences).filter(
                PatientPreferences.user_id == user.id
            ).first()
            if pref_row:
                pref_row.patient_id = new_patient.id
            else:
                db.add(PatientPreferences(
                    user_id=user.id,
                    patient_id=new_patient.id,
                    questionnaire_complete=False,
                ))

            # Assign care team
            if clinician:
                existing_assign = db.query(CaregiverAssignment).filter(
                    CaregiverAssignment.patient_id == new_patient.id
                ).first()
                if not existing_assign:
                    db.add(CaregiverAssignment(
                        patient_id=new_patient.id,
                        caregiver_id=clinician.id,
                        assigned_at=datetime.utcnow(),
                        active=True,
                    ))

            print(f"  Created patient '{user.full_name}' (patient_id={new_patient.id}, code={code}) for user_id={user.id}")
            fixed += 1

        db.commit()

        total = db.query(Patient).count()
        print(f"\nDone. Fixed: {fixed} users | Skipped (already linked): {skipped}")
        print(f"Total patients in database: {total}")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Fixing orphaned patient users...\n")
    fix_orphaned()
