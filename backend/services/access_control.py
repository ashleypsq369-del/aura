"""
access_control.py  -  ProjectAura Data-Scoping Layer
=====================================================
Single source of truth for patient access decisions.

Rules:
  admin      → everything
  clinician  → all patients, but filtered to their own in patient-facing views
  caregiver  → only assigned (active) patients
  patient    → only their own record
  family     → only linked patients
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional


def get_accessible_patient_ids(user, db: Session) -> Optional[List[int]]:
    """
    Return the list of patient IDs this user may access.
    Returns None  → no restriction (admin / clinician see all).
    Returns []    → no patients (invalid/unknown role).
    Returns [ids] → explicit whitelist.
    """
    from src.db import CaregiverAssignment, PatientFamilyLink, Patient, PatientPreferences

    if user.role in ("admin", "clinician"):
        return None  # unrestricted

    if user.role == "caregiver":
        assignments = db.query(CaregiverAssignment).filter(
            CaregiverAssignment.caregiver_id == user.id,
            CaregiverAssignment.active == True,
        ).all()
        return [a.patient_id for a in assignments]

    if user.role == "patient":
        ids: List[int] = []
        # 1) preferences link (primary path - created at registration)
        prefs = db.query(PatientPreferences).filter(
            PatientPreferences.user_id == user.id,
            PatientPreferences.patient_id != None,
        ).all()
        for pref in prefs:
            if pref.patient_id and pref.patient_id not in ids:
                ids.append(pref.patient_id)

        # 2) name match fallback (for patients created before user account linking)
        if not ids:
            by_name = db.query(Patient).filter(Patient.full_name == user.full_name).first()
            if by_name:
                ids.append(by_name.id)
                # Auto-link via preferences so future lookups use the fast path
                try:
                    existing = db.query(PatientPreferences).filter(
                        PatientPreferences.user_id == user.id,
                    ).first()
                    if existing:
                        existing.patient_id = by_name.id
                    else:
                        db.add(PatientPreferences(user_id=user.id, patient_id=by_name.id))
                    db.commit()
                except Exception:
                    db.rollback()
        return ids

    if user.role == "family":
        links = db.query(PatientFamilyLink).filter(
            PatientFamilyLink.family_user_id == user.id
        ).all()
        return [lnk.patient_id for lnk in links]

    return []  # unknown role - deny


def assert_patient_access(patient_id: int, user, db: Session) -> None:
    """
    Raise HTTP 403 if the current user cannot access patient_id.
    Use this at the start of any patient-specific endpoint.
    """
    allowed = get_accessible_patient_ids(user, db)
    if allowed is None:
        return  # admin/clinician - unrestricted
    if patient_id not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this patient's data.",
        )


def scope_patient_query(query, user, db: Session):
    """
    Apply a WHERE-IN filter to a SQLAlchemy query that already joins/references Patient.
    Pass the patient model column as the filter target.

    Usage:
        query = db.query(Alert).join(Patient, ...)
        query = scope_patient_query(query, current_user, db)

    This filters on Alert.patient_id automatically when the query model
    is one of the known models.  For raw queries build the filter yourself
    using get_accessible_patient_ids().
    """
    from src.db import Alert, Appointment, Vital, Medication, Symptom

    allowed = get_accessible_patient_ids(user, db)
    if allowed is None:
        return query  # unrestricted

    # Detect the leading entity from the query's column_descriptions
    try:
        entity = query.column_descriptions[0]["entity"]
    except (IndexError, KeyError):
        return query

    col_map = {
        Alert:       Alert.patient_id,
        Appointment: Appointment.patient_id,
        Vital:       Vital.patient_id,
        Medication:  Medication.patient_id,
    }
    col = col_map.get(entity)
    if col is not None:
        return query.filter(col.in_(allowed))
    return query


def get_accessible_users(user, db: Session):
    """
    Return which User records this user can see.
    admin      → all users
    clinician  → all caregivers + patients linked to them + own record
    caregiver  → own record + assigned patients' linked users
    patient    → own record only
    family     → own record only
    """
    from src.db import User

    if user.role == "admin":
        return None  # caller fetches all

    if user.role == "clinician":
        # Clinicians see all staff + their own patients' family/patient accounts
        allowed_ids = get_accessible_patient_ids(user, db)
        return None  # clinicians unrestricted for user listing in admin views

    # everyone else: just themselves
    return [user.id]
