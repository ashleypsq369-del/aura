"""
seed_test_users.py
==================
Creates comprehensive test users for every role with full linked data.
All passwords are: TestPass123!

USERS CREATED:
  Clinician  : dr.mensah      / TestPass123!
  Clinician  : dr.osei         / TestPass123!
  Caregiver  : nurse.akua      / TestPass123!
  Caregiver  : carer.kwesi     / TestPass123!
  Patient    : patient.ama     / TestPass123!  (linked to patient record)
  Patient    : patient.kofi2   / TestPass123!  (linked to patient record)
  Patient    : patient.abena2  / TestPass123!  (linked to patient record)
  Family     : family.emmanuel / TestPass123!  (linked to patient)
  Family     : family.akos     / TestPass123!  (linked to patient)
  Admin      : test.admin      / TestPass123!

Run: python seed_test_users.py
"""

import sys, json, random
from datetime import datetime, timedelta, date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from src.db import (
    get_session, User, Patient, Vital, Symptom, Medication, Appointment,
    Alert, PatientJourneyEvent, PatientPreferences, PatientFamilyLink,
    ESASAssessment, PPSAssessment, CarePlan, CaregiverAssignment,
    ChatbotSession, ChatbotMessage, NotificationQueue,
)
from routers.auth import hash_password

PASSWORD = "TestPass123!"

def pw():
    return hash_password(PASSWORD)

def rdate(days_ago_min=0, days_ago_max=60):
    delta = random.randint(days_ago_min, days_ago_max)
    return datetime.utcnow() - timedelta(days=delta)

def main():
    db = get_session()
    print("=" * 60)
    print("PROJECT AURA -- Test User Seeder")
    print("=" * 60)

    # -- Helpers ---------------------------------------------------------------
    def get_or_create_user(username, data):
        u = db.query(User).filter(User.username == username).first()
        if u:
            print(f"  EXISTS: {username}")
            return u
        u = User(**data)
        db.add(u)
        db.flush()
        # Create preferences record
        prefs = PatientPreferences(
            user_id=u.id,
            language_pref="en",
            questionnaire_complete=data.get("role") not in ("patient", "family"),
        )
        db.add(prefs)
        print(f"  CREATED: {username} ({data['role']})")
        return u

    # ── 1. Clinicians ─────────────────────────────────────────────────────────
    print("\n[1/6] Creating clinicians...")
    dr_mensah = get_or_create_user("dr.mensah", dict(
        username="dr.mensah", email="dr.mensah@projectaura.test",
        hashed_password=pw(), full_name="Dr. Samuel Mensah", role="clinician",
        phone="+233244000001", is_active=True, consent_given=True,
        is_professional=True, is_verified=True,
        professional_title="Consultant Palliative Medicine",
        last_login=datetime.utcnow() - timedelta(hours=2),
    ))

    dr_osei = get_or_create_user("dr.osei", dict(
        username="dr.osei", email="dr.osei@projectaura.test",
        hashed_password=pw(), full_name="Dr. Abena Osei", role="clinician",
        phone="+233244000002", is_active=True, consent_given=True,
        is_professional=True, is_verified=True,
        professional_title="Palliative Care Specialist",
        last_login=datetime.utcnow() - timedelta(hours=5),
    ))

    # ── 2. Caregivers ─────────────────────────────────────────────────────────
    print("\n[2/6] Creating caregivers...")
    nurse_akua = get_or_create_user("nurse.akua", dict(
        username="nurse.akua", email="nurse.akua@projectaura.test",
        hashed_password=pw(), full_name="Nurse Akua Asante", role="caregiver",
        phone="+233244000003", is_active=True, consent_given=True,
        is_professional=True, is_verified=True,
        professional_title="Palliative Care Nurse",
        last_login=datetime.utcnow() - timedelta(hours=1),
    ))

    carer_kwesi = get_or_create_user("carer.kwesi", dict(
        username="carer.kwesi", email="carer.kwesi@projectaura.test",
        hashed_password=pw(), full_name="Kwesi Boateng", role="caregiver",
        phone="+233244000004", is_active=True, consent_given=True,
        last_login=datetime.utcnow() - timedelta(days=1),
    ))

    # ── 3. Patients (users) ────────────────────────────────────────────────────
    print("\n[3/6] Creating patient users and patient records...")

    def create_patient_user_and_record(username, full_name, email, phone, dob, gender,
                                        diagnosis, code, scenario, care_setting):
        u = get_or_create_user(username, dict(
            username=username, email=email,
            hashed_password=pw(), full_name=full_name, role="patient",
            phone=phone, is_active=True, consent_given=True,
            last_login=datetime.utcnow() - timedelta(hours=random.randint(1, 48)),
        ))
        # Update prefs to show questionnaire needed
        prefs = db.query(PatientPreferences).filter(PatientPreferences.user_id == u.id).first()
        if prefs:
            prefs.questionnaire_complete = False
        # Find or create patient record
        p = db.query(Patient).filter(Patient.patient_code == username).first()
        if not p:
            p = Patient(
                patient_code=username,
                full_name=full_name,
                date_of_birth=datetime(dob.year, dob.month, dob.day),
                gender=gender,
                primary_diagnosis=diagnosis,
                status=scenario,
                admission_date=datetime.utcnow() - timedelta(days=random.randint(10, 90)),
                phone=phone,
                emergency_contact_name="Family Member",
                emergency_contact_phone="+233244999999",
                risk_level="High" if scenario in ("critical", "deteriorating") else "Medium",
                primary_clinician_id=dr_mensah.id,
            )
            db.add(p)
            db.flush()
            print(f"    Patient record: {full_name} ({diagnosis[:30]})")
        return u, p

    pat_ama, rec_ama = create_patient_user_and_record(
        "patient.ama2", "Ama Asante Boateng",
        "ama.boateng@test.com", "+233244100001",
        date(1958, 3, 15), "female",
        "Advanced Ovarian Cancer (Stage IV)", "PAT-AMA-002",
        "deteriorating", "home_based",
    )

    pat_kofi, rec_kofi = create_patient_user_and_record(
        "patient.kofi2", "Kofi Mensah Junior",
        "kofi.junior@test.com", "+233244100002",
        date(1945, 7, 22), "male",
        "End-Stage Heart Failure (NYHA Class IV)", "PAT-KFJ-002",
        "stable", "outpatient_clinic",
    )

    pat_abena, rec_abena = create_patient_user_and_record(
        "patient.abena2", "Abena Owusu Darko",
        "abena.darko@test.com", "+233244100003",
        date(1962, 11, 8), "female",
        "COPD (Severe) with Lung Cancer", "PAT-AOD-002",
        "critical", "hospital_based",
    )

    # ── 4. Family users ───────────────────────────────────────────────────────
    print("\n[4/6] Creating family users...")
    fam_emmanuel = get_or_create_user("family.emmanuel", dict(
        username="family.emmanuel", email="emmanuel.asante@test.com",
        hashed_password=pw(), full_name="Emmanuel Asante", role="family",
        phone="+233244200001", is_active=True, consent_given=True,
        last_login=datetime.utcnow() - timedelta(hours=3),
    ))

    fam_akos = get_or_create_user("family.akos", dict(
        username="family.akos", email="akosua.mensah2@test.com",
        hashed_password=pw(), full_name="Akosua Mensah", role="family",
        phone="+233244200002", is_active=True, consent_given=True,
        last_login=datetime.utcnow() - timedelta(days=2),
    ))

    # Link family to patients
    for fam_user, patient_rec in [(fam_emmanuel, rec_ama), (fam_akos, rec_kofi)]:
        existing = db.query(PatientFamilyLink).filter(
            PatientFamilyLink.family_user_id == fam_user.id,
            PatientFamilyLink.patient_id == patient_rec.id,
        ).first()
        if not existing:
            db.add(PatientFamilyLink(
                family_user_id=fam_user.id,
                patient_id=patient_rec.id,
                relationship="son" if fam_user == fam_emmanuel else "daughter",
                is_primary_contact=True,
            ))
            print(f"    Linked {fam_user.full_name} to patient {patient_rec.full_name}")

    # ── 5. Admin ──────────────────────────────────────────────────────────────
    print("\n[5/6] Creating test admin...")
    test_admin = get_or_create_user("test.admin", dict(
        username="test.admin", email="test.admin@projectaura.test",
        hashed_password=pw(), full_name="Test Administrator", role="admin",
        phone="+233244300001", is_active=True, consent_given=True,
        is_professional=True, is_verified=True,
        last_login=datetime.utcnow() - timedelta(minutes=30),
    ))

    db.commit()

    # ── 6. Clinical data for patient records ──────────────────────────────────
    print("\n[6/6] Adding clinical data...")

    for patient_rec, scenario in [
        (rec_ama, "deteriorating"),
        (rec_kofi, "stable"),
        (rec_abena, "critical"),
    ]:
        pid = patient_rec.id
        clin_id = dr_mensah.id

        # Vitals (30 days)
        existing_vitals = db.query(Vital).filter(Vital.patient_id == pid).count()
        if existing_vitals < 20:
            hr_base = {"stable": 78, "deteriorating": 92, "critical": 108}[scenario]
            o2_base = {"stable": 94, "deteriorating": 90, "critical": 86}[scenario]
            temp_base = {"stable": 36.8, "deteriorating": 37.2, "critical": 37.6}[scenario]
            for day in range(30):
                ts = datetime.utcnow() - timedelta(days=30 - day, hours=random.randint(6, 20))
                drift = day * 0.08 if scenario == "deteriorating" else (day * 0.03 if scenario == "critical" else 0)
                db.add(Vital(
                    patient_id=pid,
                    recorded_by=clin_id,
                    recorded_at=ts,
                    heart_rate=round(hr_base + drift + random.uniform(-5, 5), 1),
                    blood_pressure_sys=round(random.uniform(110, 135) - (drift * 0.5), 1),
                    blood_pressure_dia=round(random.uniform(68, 85), 1),
                    oxygen_saturation=round(o2_base - (drift * 0.15) + random.uniform(-1.5, 1.5), 1),
                    temperature=round(temp_base + (drift * 0.02) + random.uniform(-0.2, 0.3), 1),
                    respiratory_rate=round(random.uniform(14, 22) + drift * 0.1, 1),
                    source="manual",
                ))

        # ESAS assessments (last 14 days)
        existing_esas = db.query(ESASAssessment).filter(ESASAssessment.patient_id == pid).count()
        if existing_esas < 5:
            pain_base = {"stable": 4, "deteriorating": 6, "critical": 8}[scenario]
            for day in range(14):
                if random.random() < 0.6:  # ~60% days have check-in
                    ts = datetime.utcnow() - timedelta(days=14 - day, hours=random.randint(8, 20))
                    drift = day * 0.1 if scenario == "deteriorating" else 0
                    db.add(ESASAssessment(
                        patient_id=pid,
                        assessed_by=clin_id,
                        assessed_at=ts,
                        pain=min(10, round(pain_base + drift + random.uniform(-1, 1))),
                        tiredness=min(10, round(random.randint(4, 7) + drift)),
                        nausea=min(10, round(random.randint(2, 5))),
                        depression=min(10, round(random.randint(3, 6))),
                        anxiety=min(10, round(random.randint(3, 6))),
                        shortness_of_breath=min(10, round(random.randint(2, 7) + drift * 0.5)),
                        lack_of_appetite=min(10, round(random.randint(3, 7))),
                        wellbeing=min(10, round(random.randint(4, 7))),
                        completed_by_proxy=False,
                    ))

        # PPS
        if not db.query(PPSAssessment).filter(PPSAssessment.patient_id == pid).first():
            pps_score = {"stable": 60, "deteriorating": 50, "critical": 40}[scenario]
            db.add(PPSAssessment(
                patient_id=pid,
                assessed_by=clin_id,
                assessed_at=datetime.utcnow() - timedelta(days=3),
                pps_score=pps_score,
                ambulation="Reduced" if pps_score < 70 else "Normal or some reduction",
                activity_disease="Palliative care required",
                self_care="Occasional assistance" if pps_score >= 50 else "Mainly assistance",
                oral_intake="Normal" if pps_score >= 60 else "Reduced",
                consciousness="Full",
            ))

        # Medications
        med_list = [
            ("Morphine (Oral)", "10mg", "Every 4 hours", "Oral"),
            ("Ondansetron", "8mg", "Three times daily", "Oral"),
            ("Dexamethasone", "4mg", "Twice daily", "Oral"),
        ]
        if scenario == "critical":
            med_list.append(("Diazepam", "5mg", "As needed", "Oral"))
            med_list.append(("Furosemide", "40mg", "Once daily", "Oral"))
        existing_meds = db.query(Medication).filter(Medication.patient_id == pid).count()
        if existing_meds < 2:
            for name, dose, freq, route in med_list:
                db.add(Medication(
                    patient_id=pid,
                    prescribed_by=clin_id,
                    name=name, dose=dose, frequency=freq, route=route,
                    indication="Palliative symptom management",
                    is_active=True,
                    start_date=datetime.utcnow() - timedelta(days=random.randint(5, 30)),
                ))

        # Appointments
        if not db.query(Appointment).filter(Appointment.patient_id == pid).first():
            for i, (atype, loc, days_ahead) in enumerate([
                ("Palliative Care Review", "Korle Bu Teaching Hospital", 7),
                ("Pain Management Consultation", "Ridgeway Hospital", 14),
                ("Family Meeting", "Home Visit", 3),
            ]):
                db.add(Appointment(
                    patient_id=pid,
                    clinician_id=clin_id,
                    created_by=clin_id,
                    appointment_type=atype,
                    scheduled_at=datetime.utcnow() + timedelta(days=days_ahead, hours=i*2+9),
                    location=loc,
                    status="scheduled",
                    notes=f"{atype} for {patient_rec.full_name}",
                ))

        # Journey events
        existing_events = db.query(PatientJourneyEvent).filter(PatientJourneyEvent.patient_id == pid).count()
        if existing_events < 5:
            events = [
                ("admission", f"Admitted to palliative care programme", None, True),
                ("assessment", "Initial ESAS assessment completed", "Pain 7/10, Fatigue 8/10", False),
                ("medication_started", "Morphine commenced for pain management", "10mg oral every 4 hours", False),
                ("care_plan_created", "Personalised care plan generated", "Focus: pain control and family support", True),
                ("status_change", f"Status updated to {scenario}", f"Patient condition: {scenario}", False),
            ]
            if scenario == "deteriorating":
                events.append(("alert_high", "Oxygen saturation declining trend noted", "Avg SpO2 90% over 3 days", False))
            elif scenario == "critical":
                events.append(("alert_critical", "Critical hypoxemia detected", "SpO2 < 88% requiring urgent review", False))
            for i, (etype, title, detail, milestone) in enumerate(events):
                db.add(PatientJourneyEvent(
                    patient_id=pid,
                    event_type=etype,
                    event_title=title,
                    event_detail=detail,
                    is_milestone=milestone,
                    created_by=clin_id,
                    created_at=datetime.utcnow() - timedelta(days=len(events)-i, hours=random.randint(0, 12)),
                ))

        # Caregiver assignment
        cg = nurse_akua if pid % 2 == 0 else carer_kwesi
        existing_assign = db.query(CaregiverAssignment).filter(
            CaregiverAssignment.patient_id == pid,
            CaregiverAssignment.caregiver_id == cg.id,
        ).first()
        if not existing_assign:
            db.add(CaregiverAssignment(
                patient_id=pid,
                caregiver_id=cg.id,
                notes=f"Primary caregiver for {patient_rec.full_name}",
                assigned_at=datetime.utcnow() - timedelta(days=random.randint(5, 20)),
            ))

    db.commit()

    # ── 7. Notifications for clinicians ──────────────────────────────────────
    for user in [dr_mensah, dr_osei, nurse_akua]:
        existing = db.query(NotificationQueue).filter(NotificationQueue.recipient_id == user.id).count()
        if existing < 2:
            db.add(NotificationQueue(
                recipient_id=user.id,
                notification_type="system",
                title="Welcome to Project Aura",
                body="Your account is ready. All patient data and ML risk assessments are live.",
                is_read=False,
            ))
            db.add(NotificationQueue(
                recipient_id=user.id,
                notification_type="appointment_reminder",
                title="3 patient appointments this week",
                body="Upcoming palliative care reviews scheduled. Check the Appointments page.",
                is_read=False,
            ))

    # Family notifications
    for fam_user in [fam_emmanuel, fam_akos]:
        if db.query(NotificationQueue).filter(NotificationQueue.recipient_id == fam_user.id).count() < 1:
            db.add(NotificationQueue(
                recipient_id=fam_user.id,
                notification_type="care_update",
                title="Care team update",
                body="Your loved one's care team has logged new vitals and updated the care plan.",
                is_read=False,
            ))

    db.commit()
    db.close()

    # ── Summary ───────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("TEST USERS CREATED SUCCESSFULLY")
    print("=" * 60)
    print("\nAll passwords: TestPass123!\n")
    print(f"{'Role':<12} {'Username':<22} {'Full Name'}")
    print("-" * 60)
    users = [
        ("admin",     "test.admin",        "Test Administrator"),
        ("clinician", "dr.mensah",         "Dr. Samuel Mensah"),
        ("clinician", "dr.osei",           "Dr. Abena Osei"),
        ("caregiver", "nurse.akua",        "Nurse Akua Asante"),
        ("caregiver", "carer.kwesi",       "Kwesi Boateng"),
        ("patient",   "patient.ama2",      "Ama Asante Boateng (Home-based, deteriorating)"),
        ("patient",   "patient.kofi2",     "Kofi Mensah Junior (Outpatient, stable)"),
        ("patient",   "patient.abena2",    "Abena Owusu Darko (Hospital, critical)"),
        ("family",    "family.emmanuel",   "Emmanuel Asante (family of Ama)"),
        ("family",    "family.akos",       "Akosua Mensah (family of Kofi)"),
    ]
    for role, username, name in users:
        print(f"  {role:<12} {username:<22} {name}")
    print("\nPatient records: 3 new (Ama, Kofi Jr, Abena) + full clinical data")
    print("  - 30 days of vitals per patient")
    print("  - ESAS assessments (last 14 days)")
    print("  - PPS assessments")
    print("  - Active medications (including drug interaction pair for Abena)")
    print("  - 3 upcoming appointments per patient")
    print("  - 5-7 journey events per patient")
    print("  - Caregiver assignments")
    print("  - Notifications for all staff")
    print("\nFamily linkages:")
    print("  Emmanuel Asante --> Ama Asante Boateng (Home-based)")
    print("  Akosua Mensah  --> Kofi Mensah Junior (Outpatient)")
    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
