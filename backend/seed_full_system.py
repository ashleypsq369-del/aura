"""
seed_full_system.py
===================
FULL SYSTEM DATA SEED for Project Aura.

Populates every page, component, and feature with rich, realistic Ghanaian
palliative-care data so that EVERY role sees real content on every screen.

Run from backend/ folder:
    python seed_full_system.py

What gets created:
  - 5 roles x multiple users  (14 users total)
  - 11 patients with full demographics
  - 30-day vitals trends per patient
  - ESAS check-ins (daily, last 21 days)
  - PPS, PHQ-9, GAD-7, Barthel, MMSE, BPI, QoL, Caregiver Burden
  - Medications incl. SEVERE interaction pair
  - 3+ appointments per patient
  - Active care plans with goals + interventions
  - Journey events / patient timeline
  - Community groups + posts + memberships
  - Resources (articles, videos, PDFs) bookmarked
  - Chatbot sessions with messages
  - Notifications (unread, clinical, appointment)
  - Alerts (vital, ML risk, drug interaction)
  - Audit log entries
  - Bereavement entries + legacy content
  - Shift handover + daily care log events
  - Caregiver burden assessments
  - PatientPreferences (questionnaire complete) for all patients
  - Family links
  - Caregiver assignments
  - HIPAA breach incident
"""

import sys, json, random, hashlib
from datetime import datetime, timedelta, date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from src.db import (
    SessionLocal, init_database, Base, engine,
    User, Patient, Vital, Symptom, Medication, Appointment,
    Alert, CarePlan, CarePlanGoal, CarePlanIntervention,
    PatientFamilyLink, CaregiverAssignment,
    ESASAssessment, PPSAssessment,
    PHQ9Assessment, GAD7Assessment,
    BarthelIndexAssessment, CognitiveAssessment,
    PainAssessment, QualityOfLifeAssessment,
    CaregiverBurdenAssessment,
    PatientPreferences, PatientJourneyEvent,
    BereavementEntry, LegacyContent, LegacyHeir, LegacyConsent,
    ChatbotSession, ChatbotMessage,
    CommunityGroup, CommunityMembership, CommunityPost,
    Resource, ResourceBookmark,
    NotificationQueue, AuditLog,
    BreachIncident,
    Prediction,
)

try:
    from routers.auth import hash_password
except Exception:
    def hash_password(pw):
        import bcrypt
        return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

PASSWORD = "TestPass123!"
OLD_PASSWORDS = {"admin": "admin123", "clinician": "clinician123",
                 "caregiver": "caregiver123", "patient": "patient123",
                 "family": "family123"}

random.seed(42)


def pw(plain=PASSWORD):
    return hash_password(plain)


def rdt(days_ago=0, hours_offset=0):
    """Return a datetime N days ago + optional hour offset."""
    return datetime.utcnow() - timedelta(days=days_ago, hours=hours_offset)


def jstr(lst):
    return json.dumps(lst)


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def upsert_user(db, username, data):
    u = db.query(User).filter(User.username == username).first()
    if u:
        print(f"  EXISTS : {username}")
        return u
    u = User(**data)
    db.add(u)
    db.flush()
    print(f"  CREATE : {username} ({data['role']})")
    return u


def upsert_patient(db, code, data):
    p = db.query(Patient).filter(Patient.patient_code == code).first()
    if p:
        print(f"  EXISTS patient: {code}")
        return p
    p = Patient(**data)
    db.add(p)
    db.flush()
    print(f"  CREATE patient: {code} - {data['full_name']}")
    return p


def ensure_prefs(db, user_id, patient_id, data):
    prefs = db.query(PatientPreferences).filter(
        PatientPreferences.user_id == user_id).first()
    if prefs:
        return prefs
    prefs = PatientPreferences(user_id=user_id, patient_id=patient_id, **data)
    db.add(prefs)
    db.flush()
    return prefs


def has_vitals(db, patient_id, min_count=25):
    return db.query(Vital).filter(Vital.patient_id == patient_id).count() >= min_count


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    init_database()
    db = SessionLocal()

    print("=" * 65)
    print("PROJECT AURA  --  FULL SYSTEM DATA SEED")
    print("=" * 65)

    # ── SECTION 1: USERS ─────────────────────────────────────────────────────
    print("\n[1] Users")

    admin = upsert_user(db, "admin", dict(
        username="admin", email="admin@projectaura.gh",
        hashed_password=pw("admin123"), full_name="Dr. Samuel Mensah",
        role="admin", phone="+233302000000",
        is_active=True, consent_given=True,
        is_professional=True, is_verified=True,
        professional_title="Chief Medical Officer",
        last_login=rdt(0, 1),
    ))

    clinician = upsert_user(db, "clinician", dict(
        username="clinician", email="clinician@projectaura.gh",
        hashed_password=pw("clinician123"), full_name="Dr. Grace Asante",
        role="clinician", phone="+233244111111",
        is_active=True, consent_given=True,
        is_professional=True, is_verified=True,
        professional_title="Palliative Care Specialist",
        last_login=rdt(0, 2),
    ))

    caregiver = upsert_user(db, "caregiver", dict(
        username="caregiver", email="caregiver@projectaura.gh",
        hashed_password=pw("caregiver123"), full_name="Nurse Akua Mensah",
        role="caregiver", phone="+233244222222",
        is_active=True, consent_given=True,
        is_professional=True, is_verified=True,
        professional_title="Palliative Care Nurse",
        last_login=rdt(0, 3),
    ))

    patient_user = upsert_user(db, "patient", dict(
        username="patient", email="patient@projectaura.gh",
        hashed_password=pw("patient123"), full_name="Kofi Mensah",
        role="patient", phone="+233244333333",
        is_active=True, consent_given=True,
        last_login=rdt(0, 5),
    ))

    family_user = upsert_user(db, "family", dict(
        username="family", email="family@projectaura.gh",
        hashed_password=pw("family123"), full_name="Emmanuel Mensah",
        role="family", phone="+233244444444",
        is_active=True, consent_given=True,
        last_login=rdt(1),
    ))

    # Test users
    dr_mensah = upsert_user(db, "dr.mensah", dict(
        username="dr.mensah", email="dr.mensah@projectaura.test",
        hashed_password=pw(), full_name="Dr. Samuel Mensah (Test)",
        role="clinician", phone="+233244000001",
        is_active=True, consent_given=True,
        is_professional=True, is_verified=True,
        professional_title="Consultant Palliative Medicine",
        last_login=rdt(0, 2),
    ))

    dr_osei = upsert_user(db, "dr.osei", dict(
        username="dr.osei", email="dr.osei@projectaura.test",
        hashed_password=pw(), full_name="Dr. Abena Osei",
        role="clinician", phone="+233244000002",
        is_active=True, consent_given=True,
        is_professional=True, is_verified=True,
        professional_title="Palliative Care Specialist",
        last_login=rdt(0, 5),
    ))

    nurse_akua = upsert_user(db, "nurse.akua", dict(
        username="nurse.akua", email="nurse.akua@projectaura.test",
        hashed_password=pw(), full_name="Nurse Akua Asante",
        role="caregiver", phone="+233244000003",
        is_active=True, consent_given=True,
        is_professional=True, is_verified=True,
        professional_title="Palliative Care Nurse",
        last_login=rdt(0, 1),
    ))

    carer_kwesi = upsert_user(db, "carer.kwesi", dict(
        username="carer.kwesi", email="carer.kwesi@projectaura.test",
        hashed_password=pw(), full_name="Kwesi Boateng",
        role="caregiver", phone="+233244000004",
        is_active=True, consent_given=True,
        last_login=rdt(1),
    ))

    test_admin = upsert_user(db, "test.admin", dict(
        username="test.admin", email="test.admin@projectaura.test",
        hashed_password=pw(), full_name="Test Administrator",
        role="admin", phone="+233244300001",
        is_active=True, consent_given=True,
        is_professional=True, is_verified=True,
        last_login=rdt(0, 0),
    ))

    db.commit()
    print(f"  Total users committed")

    # ── SECTION 2: PATIENTS ───────────────────────────────────────────────────
    print("\n[2] Patients")

    PATIENTS_DEF = [
        # (code, name, dob, gender, diagnosis, status, care_setting, scenario)
        ("PAT-001", "Kofi Mensah", date(1957, 4, 10), "Male",
         "Prostate Cancer (Stage III)", "stable", "outpatient_clinic", "stable"),
        ("PAT-002", "Abena Sarpong", date(1952, 8, 22), "Female",
         "Congestive Heart Failure (NYHA III)", "stable", "home_based", "stable"),
        ("PAT-003", "Emmanuel Ofori", date(1966, 1, 15), "Male",
         "Non-Small Cell Lung Cancer (Stage IIIB)", "active", "outpatient_clinic", "moderate"),
        ("PAT-004", "Grace Asante", date(1963, 6, 30), "Female",
         "COPD (Severe) - FEV1 < 30%", "active", "home_based", "moderate"),
        ("PAT-005", "Kwame Boateng", date(1950, 3, 5), "Male",
         "Pancreatic Cancer (Metastatic)", "deteriorating", "hospital_based", "deteriorating"),
        ("PAT-006", "Akosua Darko", date(1955, 11, 19), "Female",
         "End-Stage Liver Failure (Child-Pugh C)", "deteriorating", "hospital_based", "deteriorating"),
        ("PAT-007", "Yaw Asiedu", date(1943, 7, 8), "Male",
         "End-Stage Renal Failure (eGFR < 10)", "critical", "hospital_based", "critical"),
        ("PAT-008", "Ama Osei", date(1947, 9, 14), "Female",
         "Ovarian Cancer (Advanced Stage IV)", "critical", "hospital_based", "critical"),
        ("patient", "Kofi Mensah (Portal)", date(1957, 4, 10), "Male",
         "Prostate Cancer (Stage III)", "stable", "outpatient_clinic", "stable"),
        ("patient.ama2", "Ama Asante Boateng", date(1958, 3, 15), "Female",
         "Advanced Ovarian Cancer (Stage IV)", "deteriorating", "home_based", "deteriorating"),
        ("patient.kofi2", "Kofi Mensah Junior", date(1945, 7, 22), "Male",
         "End-Stage Heart Failure (NYHA Class IV)", "stable", "outpatient_clinic", "stable"),
        ("patient.abena2", "Abena Owusu Darko", date(1962, 11, 8), "Female",
         "COPD (Severe) with Lung Cancer", "critical", "hospital_based", "critical"),
    ]

    STATUS_MAP = {
        "stable": "stable", "moderate": "active",
        "deteriorating": "deteriorating", "critical": "critical",
    }

    patients = {}
    for (code, name, dob, gender, diag, status, setting, scenario) in PATIENTS_DEF:
        p = upsert_patient(db, code, dict(
            patient_code=code,
            full_name=name,
            date_of_birth=datetime(dob.year, dob.month, dob.day),
            gender=gender,
            ghana_card_number=f"GHA-{random.randint(100000000,999999999)}-{random.randint(0,9)}",
            nhis_number=f"NHIS-{random.randint(10000000,99999999)}",
            phone=f"+233{random.randint(240000000,249999999)}",
            address=f"House {random.randint(1,200)}, {random.choice(['Osu','Labone','East Legon','Tema','Kumasi','Takoradi'])}",
            region=random.choice(["Greater Accra", "Ashanti", "Northern", "Western"]),
            district=random.choice(["Accra Metro", "Kumasi Metro", "Tamale Metro"]),
            facility_name="Korle Bu Teaching Hospital",
            primary_diagnosis=diag,
            secondary_diagnoses=json.dumps(["Hypertension", "Type 2 Diabetes"]),
            admission_date=rdt(random.randint(20, 90)),
            status=STATUS_MAP.get(scenario, "active"),
            care_pathway="palliative_care_standard",
            primary_clinician_id=clinician.id,
            risk_level="High" if scenario in ("critical", "deteriorating") else "Medium",
            preferred_language="en",
            religious_preference=random.choice(["Christian", "Muslim", "Traditional"]),
            emergency_contact_name="Family Contact",
            emergency_contact_phone=f"+233{random.randint(240000000,249999999)}",
        ))
        patients[code] = (p, scenario)

    db.commit()
    print(f"  {len(patients)} patients committed")

    # ── SECTION 3: PATIENT USERS → PATIENT RECORDS link & preferences ─────────
    print("\n[3] Patient preferences & questionnaire data")

    # Map patient user → patient record code
    USER_PATIENT_MAP = {
        "patient":         "patient",
        "patient.ama2":    "patient.ama2",
        "patient.kofi2":   "patient.kofi2",
        "patient.abena2":  "patient.abena2",
    }

    pat_users = {
        "patient":         patient_user,
        "patient.ama2":    upsert_user(db, "patient.ama2", dict(
            username="patient.ama2", email="ama.boateng@test.com",
            hashed_password=pw(), full_name="Ama Asante Boateng",
            role="patient", phone="+233244100001",
            is_active=True, consent_given=True, last_login=rdt(0, 6))),
        "patient.kofi2":   upsert_user(db, "patient.kofi2", dict(
            username="patient.kofi2", email="kofi.junior@test.com",
            hashed_password=pw(), full_name="Kofi Mensah Junior",
            role="patient", phone="+233244100002",
            is_active=True, consent_given=True, last_login=rdt(0, 8))),
        "patient.abena2":  upsert_user(db, "patient.abena2", dict(
            username="patient.abena2", email="abena.darko@test.com",
            hashed_password=pw(), full_name="Abena Owusu Darko",
            role="patient", phone="+233244100003",
            is_active=True, consent_given=True, last_login=rdt(1))),
    }

    PREFS_DATA = {
        "patient": dict(
            language_pref="en", info_style="simple", tech_comfort="medium",
            primary_condition="Prostate Cancer (Stage III)",
            diagnosis_duration="12months+",
            care_priorities=jstr(["Pain control", "Staying at home", "Spending time with family"]),
            emotional_states=jstr(["Hopeful", "Grateful", "Determined"]),
            physical_symptoms=jstr(["Pain", "Tiredness/fatigue", "Loss of appetite"]),
            activity_level="moderate", mobility_aid="stick", self_care_level="some_help",
            mood_score=6, coping_strategies=jstr(["Prayer or meditation", "Talking to family"]),
            future_worry_level="somewhat", religious_background="christian",
            spiritual_importance="very", wants_spiritual_care=True,
            main_support_person="spouse", social_connectedness="mostly",
            wants_peer_connection=True, family_involvement_pref="full",
            topic_interests=jstr(["Pain management", "Family communication"]),
            info_frequency="few_weekly", wants_community=True,
            esas_pain=5, esas_tiredness=6, esas_nausea=3,
            esas_shortness_of_breath=2, esas_depression=4,
            esas_anxiety=4, esas_wellbeing=5, esas_appetite=5,
            ai_analysis_consent="yes", care_team_sharing="yes",
            questionnaire_complete=True, completed_at=rdt(30),
        ),
        "patient.ama2": dict(
            language_pref="en", info_style="mixed", tech_comfort="medium",
            primary_condition="Advanced Ovarian Cancer (Stage IV)",
            diagnosis_duration="3-12months",
            care_priorities=jstr(["Pain control", "Being comfortable", "Spending time with family"]),
            emotional_states=jstr(["Scared", "Hopeful", "Overwhelmed"]),
            physical_symptoms=jstr(["Pain", "Nausea", "Breathlessness", "Loss of appetite"]),
            activity_level="low", mobility_aid="none", self_care_level="some_help",
            mood_score=4, coping_strategies=jstr(["Talking to family", "Prayer or meditation", "Music"]),
            future_worry_level="very", religious_background="christian",
            spiritual_importance="very", wants_spiritual_care=True,
            main_support_person="child", social_connectedness="mostly",
            wants_peer_connection=True, family_involvement_pref="full",
            topic_interests=jstr(["Pain management", "Mental health and emotions", "Spiritual peace and legacy"]),
            info_frequency="daily", wants_community=True,
            esas_pain=7, esas_tiredness=8, esas_nausea=6,
            esas_shortness_of_breath=5, esas_depression=7,
            esas_anxiety=7, esas_wellbeing=7, esas_appetite=7,
            ai_analysis_consent="yes", care_team_sharing="yes",
            questionnaire_complete=True, completed_at=rdt(14),
        ),
        "patient.kofi2": dict(
            language_pref="en", info_style="detailed", tech_comfort="high",
            primary_condition="End-Stage Heart Failure (NYHA Class IV)",
            diagnosis_duration="12months+",
            care_priorities=jstr(["Staying at home", "Maintaining independence", "Understanding my condition"]),
            emotional_states=jstr(["Peaceful", "Determined", "Sad"]),
            physical_symptoms=jstr(["Breathlessness", "Tiredness/fatigue", "Swollen legs"]),
            activity_level="very_low", mobility_aid="frame", self_care_level="much_help",
            mood_score=5, coping_strategies=jstr(["Music", "Reading", "Talking to family"]),
            future_worry_level="somewhat", religious_background="christian",
            spiritual_importance="important", wants_spiritual_care=False,
            main_support_person="child", social_connectedness="sometimes",
            wants_peer_connection=False, family_involvement_pref="some",
            topic_interests=jstr(["Nutrition and appetite", "Sleep improvement", "Practical home care"]),
            info_frequency="weekly", wants_community=False,
            esas_pain=4, esas_tiredness=8, esas_nausea=2,
            esas_shortness_of_breath=8, esas_depression=5,
            esas_anxiety=4, esas_wellbeing=6, esas_appetite=6,
            ai_analysis_consent="yes", care_team_sharing="yes",
            questionnaire_complete=True, completed_at=rdt(60),
        ),
        "patient.abena2": dict(
            language_pref="en", info_style="simple", tech_comfort="low",
            primary_condition="COPD (Severe) with Lung Cancer",
            diagnosis_duration="12months+",
            care_priorities=jstr(["Being comfortable", "Pain control", "Emotional and spiritual support"]),
            emotional_states=jstr(["Scared", "Lonely", "Overwhelmed"]),
            physical_symptoms=jstr(["Breathlessness", "Pain", "Tiredness/fatigue", "Confusion or memory problems"]),
            activity_level="very_low", mobility_aid="wheelchair", self_care_level="dependent",
            mood_score=3, coping_strategies=jstr(["Prayer or meditation", "Being alone and reflecting"]),
            future_worry_level="very", religious_background="muslim",
            spiritual_importance="very", wants_spiritual_care=True,
            main_support_person="sibling", social_connectedness="isolated",
            wants_peer_connection=False, family_involvement_pref="full",
            topic_interests=jstr(["Pain management", "Advance care planning", "Spiritual peace and legacy"]),
            info_frequency="changes", wants_community=False,
            esas_pain=9, esas_tiredness=9, esas_nausea=5,
            esas_shortness_of_breath=9, esas_depression=8,
            esas_anxiety=8, esas_wellbeing=9, esas_appetite=8,
            ai_analysis_consent="yes", care_team_sharing="yes",
            questionnaire_complete=True, completed_at=rdt(20),
        ),
    }

    for uname, prefs_data in PREFS_DATA.items():
        u = pat_users[uname]
        pat_code = USER_PATIENT_MAP[uname]
        pat_rec = patients[pat_code][0]
        ensure_prefs(db, u.id, pat_rec.id, prefs_data)

    # Staff prefs (questionnaire not needed)
    for staff_user in [admin, clinician, caregiver, dr_mensah, dr_osei,
                       nurse_akua, carer_kwesi, test_admin]:
        if not db.query(PatientPreferences).filter(
                PatientPreferences.user_id == staff_user.id).first():
            db.add(PatientPreferences(
                user_id=staff_user.id, patient_id=None,
                language_pref="en", questionnaire_complete=True,
            ))

    db.commit()
    print("  Preferences committed")

    # ── SECTION 4: FAMILY USERS & LINKS ──────────────────────────────────────
    print("\n[4] Family users & links")

    fam_emmanuel = upsert_user(db, "family.emmanuel", dict(
        username="family.emmanuel", email="emmanuel.asante@test.com",
        hashed_password=pw(), full_name="Emmanuel Asante",
        role="family", phone="+233244200001",
        is_active=True, consent_given=True, last_login=rdt(0, 3),
    ))

    fam_akos = upsert_user(db, "family.akos", dict(
        username="family.akos", email="akosua.mensah2@test.com",
        hashed_password=pw(), full_name="Akosua Mensah",
        role="family", phone="+233244200002",
        is_active=True, consent_given=True, last_login=rdt(2),
    ))

    db.commit()

    # Family prefs
    for fam in [family_user, fam_emmanuel, fam_akos]:
        if not db.query(PatientPreferences).filter(
                PatientPreferences.user_id == fam.id).first():
            db.add(PatientPreferences(
                user_id=fam.id, patient_id=None,
                language_pref="en", questionnaire_complete=True,
            ))

    FAMILY_LINKS = [
        (fam_emmanuel.id, patients["patient.ama2"][0].id, "son", True),
        (fam_akos.id,     patients["patient.kofi2"][0].id, "daughter", True),
        (family_user.id,  patients["patient"][0].id, "son", True),
    ]

    for fam_uid, pat_id, rel, primary in FAMILY_LINKS:
        exists = db.query(PatientFamilyLink).filter(
            PatientFamilyLink.family_user_id == fam_uid,
            PatientFamilyLink.patient_id == pat_id,
        ).first()
        if not exists:
            db.add(PatientFamilyLink(
                family_user_id=fam_uid, patient_id=pat_id,
                relationship=rel, is_primary_contact=primary,
                emergency_contact=primary,
            ))

    db.commit()
    print("  Family links committed")

    # ── SECTION 5: CAREGIVER ASSIGNMENTS ─────────────────────────────────────
    print("\n[5] Caregiver assignments")

    ASSIGNMENTS = [
        # (caregiver_user, patient_code)
        (caregiver,    "PAT-001"), (caregiver,    "PAT-002"),
        (caregiver,    "PAT-003"), (caregiver,    "PAT-004"),
        (nurse_akua,   "patient.ama2"), (nurse_akua, "patient.abena2"),
        (nurse_akua,   "PAT-005"), (nurse_akua,   "PAT-006"),
        (carer_kwesi,  "patient.kofi2"), (carer_kwesi, "PAT-007"),
        (carer_kwesi,  "PAT-008"),
    ]

    for cg_user, pat_code in ASSIGNMENTS:
        if pat_code not in patients:
            continue
        pat_rec = patients[pat_code][0]
        exists = db.query(CaregiverAssignment).filter(
            CaregiverAssignment.caregiver_id == cg_user.id,
            CaregiverAssignment.patient_id == pat_rec.id,
        ).first()
        if not exists:
            db.add(CaregiverAssignment(
                patient_id=pat_rec.id,
                caregiver_id=cg_user.id,
                assigned_by=clinician.id,
                assigned_at=rdt(random.randint(10, 40)),
                active=True,
                notes=f"Primary caregiver for {pat_rec.full_name}",
            ))

    db.commit()
    print("  Assignments committed")

    # ── SECTION 6: VITALS (30 days per patient) ──────────────────────────────
    print("\n[6] Vitals (30 days per patient)")

    VITAL_RANGES = {
        "stable":       {"hr": (64, 82),  "sys": (112, 128), "dia": (70, 82), "o2": (94, 98), "temp": (36.4, 37.1), "rr": (13, 17)},
        "moderate":     {"hr": (76, 96),  "sys": (100, 120), "dia": (64, 79), "o2": (90, 95), "temp": (36.5, 37.4), "rr": (15, 20)},
        "deteriorating":{"hr": (88, 110), "sys": (90, 114),  "dia": (58, 74), "o2": (86, 92), "temp": (36.9, 38.1), "rr": (17, 22)},
        "critical":     {"hr": (100, 128),"sys": (80, 100),  "dia": (50, 64), "o2": (80, 88), "temp": (37.5, 39.0), "rr": (20, 28)},
    }

    for code, (pat, scenario) in patients.items():
        if has_vitals(db, pat.id):
            print(f"  SKIP vitals: {code}")
            continue
        r = VITAL_RANGES.get(scenario, VITAL_RANGES["moderate"])
        for day in range(30):
            # deteriorating/critical trend gets worse over time
            drift = (day / 30) * (0.15 if scenario == "deteriorating" else
                                   0.08 if scenario == "critical" else 0.0)
            ts = rdt(30 - day, random.randint(6, 20))
            db.add(Vital(
                patient_id=pat.id,
                recorded_by=clinician.id,
                recorded_at=ts,
                heart_rate=round(random.uniform(*r["hr"]) + drift * 15, 1),
                blood_pressure_sys=round(random.uniform(*r["sys"]) - drift * 8, 1),
                blood_pressure_dia=round(random.uniform(*r["dia"]) - drift * 4, 1),
                oxygen_saturation=round(max(75, random.uniform(*r["o2"]) - drift * 5), 1),
                temperature=round(random.uniform(*r["temp"]) + drift * 0.5, 1),
                respiratory_rate=round(random.uniform(*r["rr"]) + drift * 3, 1),
                source="manual",
            ))
        print(f"  vitals: {code} - 30 records")

    db.commit()

    # ── SECTION 7: ESAS ASSESSMENTS (daily last 21 days) ─────────────────────
    print("\n[7] ESAS assessments")

    ESAS_BASE = {
        "stable":       {"pain": 3, "tired": 4, "nausea": 2, "depr": 3, "anx": 3, "sob": 2, "app": 3, "wb": 3},
        "moderate":     {"pain": 5, "tired": 6, "nausea": 4, "depr": 5, "anx": 5, "sob": 4, "app": 5, "wb": 5},
        "deteriorating":{"pain": 7, "tired": 7, "nausea": 5, "depr": 6, "anx": 6, "sob": 5, "app": 6, "wb": 6},
        "critical":     {"pain": 8, "tired": 9, "nausea": 6, "depr": 8, "anx": 8, "sob": 8, "app": 7, "wb": 8},
    }

    for code, (pat, scenario) in patients.items():
        existing = db.query(ESASAssessment).filter(
            ESASAssessment.patient_id == pat.id).count()
        if existing >= 10:
            print(f"  SKIP ESAS: {code}")
            continue
        b = ESAS_BASE.get(scenario, ESAS_BASE["moderate"])
        for day in range(21):
            if random.random() < 0.65:  # ~65% days have a check-in (realistic)
                drift = (day / 21) * (1.5 if scenario == "deteriorating" else
                                       0.8 if scenario == "critical" else 0.0)
                ts = rdt(21 - day, random.randint(7, 22))
                db.add(ESASAssessment(
                    patient_id=pat.id,
                    assessed_by=clinician.id,
                    assessed_at=ts,
                    pain=min(10, round(b["pain"] + drift + random.uniform(-0.8, 0.8))),
                    tiredness=min(10, round(b["tired"] + drift * 0.5 + random.uniform(-0.8, 0.8))),
                    drowsiness=min(10, round(b["tired"] * 0.6 + random.uniform(-1, 1))),
                    nausea=min(10, round(b["nausea"] + random.uniform(-0.8, 1))),
                    lack_of_appetite=min(10, round(b["app"] + drift * 0.3 + random.uniform(-0.8, 0.8))),
                    depression=min(10, round(b["depr"] + drift * 0.4 + random.uniform(-0.8, 0.8))),
                    anxiety=min(10, round(b["anx"] + drift * 0.3 + random.uniform(-0.8, 0.8))),
                    shortness_of_breath=min(10, round(b["sob"] + drift * 0.5 + random.uniform(-0.8, 1))),
                    wellbeing=min(10, round(b["wb"] + drift * 0.4 + random.uniform(-0.8, 0.8))),
                    completed_by_proxy=False,
                    notes=random.choice([None, None, None,
                        "Feeling slightly better today",
                        "Pain worse overnight - did not sleep well",
                        "Nausea after morning medication",
                        "Anxiety high - worried about family",
                    ]),
                ))
        print(f"  ESAS: {code}")

    db.commit()

    # ── SECTION 8: PPS ASSESSMENTS ────────────────────────────────────────────
    print("\n[8] PPS assessments")

    PPS_BY_SCENARIO = {
        "stable": 70, "moderate": 60, "deteriorating": 50, "critical": 40,
    }

    for code, (pat, scenario) in patients.items():
        if db.query(PPSAssessment).filter(PPSAssessment.patient_id == pat.id).first():
            continue
        score = PPS_BY_SCENARIO.get(scenario, 60)
        # Two PPS over time to show trend
        for weeks_ago, adj in [(8, 10), (0, 0)]:
            db.add(PPSAssessment(
                patient_id=pat.id,
                assessed_by=clinician.id,
                assessed_at=rdt(weeks_ago * 7),
                pps_score=min(100, score + adj),
                ambulation="Reduced" if score < 70 else "Normal or some reduction",
                activity_disease="Some normal activity, evidence of disease",
                self_care="Occasional assistance" if score >= 50 else "Mainly assistance",
                oral_intake="Normal" if score >= 60 else "Reduced",
                consciousness="Full",
                notes=f"Functional status assessed at {min(100, score + adj)}%",
            ))

    db.commit()
    print("  PPS committed")

    # ── SECTION 9: PHQ-9 & GAD-7 ─────────────────────────────────────────────
    print("\n[9] PHQ-9 and GAD-7")

    PHQ_BASE = {"stable": 6, "moderate": 10, "deteriorating": 14, "critical": 18}
    GAD_BASE = {"stable": 5, "moderate": 9,  "deteriorating": 13, "critical": 16}

    for code, (pat, scenario) in patients.items():
        if not db.query(PHQ9Assessment).filter(PHQ9Assessment.patient_id == pat.id).first():
            total = PHQ_BASE.get(scenario, 10) + random.randint(-2, 2)
            q = max(0, total // 9)
            db.add(PHQ9Assessment(
                patient_id=pat.id, assessed_by=clinician.id,
                assessed_at=rdt(7),
                little_interest=min(3, q+random.randint(0,1)),
                feeling_down=min(3, q+random.randint(0,1)),
                sleep_trouble=min(3, q+random.randint(0,1)),
                feeling_tired=min(3, q+random.randint(0,1)),
                appetite_change=min(3, q),
                feeling_bad_about_self=min(3, max(0,q-1)),
                trouble_concentrating=min(3, max(0,q-1)),
                moving_slowly_or_fidgety=min(3, max(0,q-1)),
                thoughts_of_harm=0,
                total_score=total,
                severity=(
                    "Minimal" if total < 5 else "Mild" if total < 10 else
                    "Moderate" if total < 15 else "Moderately Severe" if total < 20 else "Severe"
                ),
                notes="Routine depression screening",
            ))

        if not db.query(GAD7Assessment).filter(GAD7Assessment.patient_id == pat.id).first():
            total = GAD_BASE.get(scenario, 9) + random.randint(-2, 2)
            q = max(0, total // 7)
            db.add(GAD7Assessment(
                patient_id=pat.id, assessed_by=clinician.id,
                assessed_at=rdt(7),
                feeling_nervous=min(3, q+random.randint(0,1)),
                not_stop_worrying=min(3, q+random.randint(0,1)),
                worrying_too_much=min(3, q),
                trouble_relaxing=min(3, q),
                being_restless=min(3, max(0,q-1)),
                easily_annoyed=min(3, max(0,q-1)),
                feeling_afraid=min(3, max(0,q-1)),
                total_score=total,
                severity=(
                    "Minimal" if total < 5 else "Mild" if total < 10 else
                    "Moderate" if total < 15 else "Severe"
                ),
                notes="Routine anxiety screening",
            ))

    db.commit()
    print("  PHQ-9 & GAD-7 committed")

    # ── SECTION 10: BARTHEL & COGNITIVE ──────────────────────────────────────
    print("\n[10] Barthel & MMSE")

    BARTHEL_BASE = {"stable": 80, "moderate": 65, "deteriorating": 50, "critical": 30}
    MMSE_BASE    = {"stable": 26, "moderate": 23, "deteriorating": 20, "critical": 17}

    for code, (pat, scenario) in patients.items():
        if not db.query(BarthelIndexAssessment).filter(
                BarthelIndexAssessment.patient_id == pat.id).first():
            total = BARTHEL_BASE.get(scenario, 65) + random.randint(-5, 5)
            # distribute across 10 items
            items = [max(0, min(10, (total // 10) + random.randint(-1, 1))) for _ in range(10)]
            db.add(BarthelIndexAssessment(
                patient_id=pat.id, assessed_by=clinician.id,
                assessed_at=rdt(10),
                feeding=items[0], bathing=items[1], grooming=items[2],
                dressing=items[3], bowel_control=items[4], bladder_control=items[5],
                toilet_use=items[6], transfers=items[7], mobility=items[8], stairs=items[9],
                total_score=total,
                independence_level=(
                    "Independent" if total >= 90 else "Mild dependence" if total >= 60 else
                    "Moderate dependence" if total >= 40 else "Severe dependence"
                ),
                notes="Activities of daily living assessment",
            ))

        if not db.query(CognitiveAssessment).filter(
                CognitiveAssessment.patient_id == pat.id).first():
            total = MMSE_BASE.get(scenario, 23) + random.randint(-2, 2)
            db.add(CognitiveAssessment(
                patient_id=pat.id, assessed_by=clinician.id,
                assessed_at=rdt(10),
                assessment_type="MMSE",
                mmse_orientation_time=min(5, total // 6),
                mmse_orientation_place=min(5, total // 6),
                mmse_registration=3,
                mmse_attention_calculation=min(5, total // 5),
                mmse_recall=min(3, total // 9),
                mmse_language=min(7, (total * 7) // 30),
                mmse_visual_construction=min(1, total // 26),
                mmse_total=total,
                interpretation=(
                    "Normal" if total >= 24 else "Mild impairment" if total >= 18 else
                    "Moderate impairment" if total >= 10 else "Severe impairment"
                ),
                notes="Mini Mental State Examination",
            ))

    db.commit()
    print("  Barthel & MMSE committed")

    # ── SECTION 11: MEDICATIONS (incl. drug interaction for abena2) ───────────
    print("\n[11] Medications")

    MED_SETS = {
        "stable": [
            ("Paracetamol", "1000mg", "Four times daily", "Oral", "Pain management"),
            ("Morphine (Oral)", "10mg", "Every 4 hours", "Oral", "Moderate pain control"),
            ("Ondansetron", "4mg", "As needed", "Oral", "Nausea"),
        ],
        "moderate": [
            ("Morphine (Oral)", "10mg", "Every 4 hours", "Oral", "Moderate-severe pain"),
            ("Dexamethasone", "4mg", "Twice daily", "Oral", "Anti-inflammatory, appetite"),
            ("Ondansetron", "8mg", "Three times daily", "Oral", "Nausea and vomiting"),
            ("Lactulose", "15ml", "Twice daily", "Oral", "Opioid-induced constipation"),
        ],
        "deteriorating": [
            ("Morphine (Oral)", "20mg", "Every 4 hours", "Oral", "Severe pain - escalated"),
            ("Dexamethasone", "8mg", "Once daily", "Oral", "Inflammation, fatigue"),
            ("Ondansetron", "8mg", "Three times daily", "Oral", "Persistent nausea"),
            ("Midazolam", "2.5mg", "As needed", "Subcutaneous", "Agitation/breathlessness"),
            ("Haloperidol", "0.5mg", "As needed", "Oral", "Nausea, delirium"),
        ],
        "critical": [
            ("Morphine (Oral)", "30mg", "Every 4 hours", "Oral", "Severe refractory pain"),
            ("Diazepam", "5mg", "As needed", "Oral", "Severe anxiety - palliative"),
            ("Dexamethasone", "8mg", "Once daily", "Oral", "Cerebral oedema, appetite"),
            ("Hyoscine Butylbromide", "20mg", "Every 6 hours", "Subcutaneous", "Secretions"),
            ("Ondansetron", "8mg", "Three times daily", "Oral", "Severe nausea"),
            ("Furosemide", "40mg", "Once daily", "Oral", "Fluid retention/oedema"),
        ],
    }

    for code, (pat, scenario) in patients.items():
        existing = db.query(Medication).filter(Medication.patient_id == pat.id).count()
        if existing >= 2:
            continue
        meds = MED_SETS.get(scenario, MED_SETS["moderate"])
        for name, dose, freq, route, ind in meds:
            db.add(Medication(
                patient_id=pat.id, prescribed_by=clinician.id,
                name=name, dose=dose, frequency=freq, route=route,
                indication=ind,
                start_date=rdt(random.randint(10, 45)),
                is_active=True,
                is_prn="needed" in freq.lower(),
            ))

    # Special: ensure patient.abena2 has Morphine + Diazepam (SEVERE interaction)
    abena_pat = patients["patient.abena2"][0]
    abena_meds = [m.name for m in
                  db.query(Medication).filter(Medication.patient_id == abena_pat.id).all()]
    if "Morphine (Oral)" not in abena_meds:
        db.add(Medication(patient_id=abena_pat.id, prescribed_by=clinician.id,
            name="Morphine (Oral)", dose="30mg", frequency="Every 4 hours",
            route="Oral", indication="Severe pain", is_active=True,
            start_date=rdt(15)))
    if "Diazepam" not in abena_meds:
        db.add(Medication(patient_id=abena_pat.id, prescribed_by=clinician.id,
            name="Diazepam", dose="5mg", frequency="As needed",
            route="Oral", indication="Severe anxiety - palliative", is_active=True,
            start_date=rdt(10)))

    db.commit()
    print("  Medications committed")

    # ── SECTION 12: APPOINTMENTS ──────────────────────────────────────────────
    print("\n[12] Appointments")

    APPT_TYPES = [
        ("Palliative Care Review", "Korle Bu Teaching Hospital", 7),
        ("Pain Management Consultation", "Ridgeway Hospital", 14),
        ("Family Meeting", "Home Visit", 3),
        ("Medication Review", "Korle Bu Teaching Hospital", 21),
        ("Physiotherapy Assessment", "Ridge Hospital", 10),
    ]

    for code, (pat, scenario) in patients.items():
        existing = db.query(Appointment).filter(Appointment.patient_id == pat.id).count()
        if existing >= 3:
            continue
        for i, (atype, loc, days_ahead) in enumerate(APPT_TYPES[:3]):
            db.add(Appointment(
                patient_id=pat.id,
                clinician_id=clinician.id,
                created_by=clinician.id,
                appointment_type=atype,
                scheduled_at=rdt(-days_ahead - i, random.randint(-2, 2)),  # future
                location=loc,
                location_detail=loc,
                status="scheduled",
                notes=f"{atype} - {pat.full_name}",
                duration_minutes=30,
            ))
        # One completed past appointment
        db.add(Appointment(
            patient_id=pat.id,
            clinician_id=clinician.id,
            created_by=clinician.id,
            appointment_type="Initial Palliative Assessment",
            scheduled_at=rdt(14),
            location="Korle Bu Teaching Hospital",
            status="completed",
            notes=f"Initial assessment completed. Care plan initiated.",
            duration_minutes=60,
            completed_at=rdt(14),
            completion_notes="Patient reviewed, medications adjusted, care plan shared with family.",
        ))

    db.commit()
    print("  Appointments committed")

    # ── SECTION 13: CARE PLANS ────────────────────────────────────────────────
    print("\n[13] Care plans")

    CARE_PLAN_DATA = {
        "stable": dict(
            goals_of_care="Maintain quality of life, manage symptoms, support family.",
            pain_management_plan="WHO Step 2 analgesia. Paracetamol 1g QDS + Morphine 10mg PRN. Review monthly.",
            psychological_support="Monthly psychological support sessions. Anxiety screening quarterly.",
            spiritual_care="Chaplaincy referral. Respect for religious preferences (Christian).",
            family_support_plan="Bi-monthly family meetings. Caregiver education provided.",
            advance_directives_notes="Patient has expressed preference for home-based care. No active resuscitation.",
            bereavement_plan="Family support resources shared. Community group membership arranged.",
            care_phase="stable",
        ),
        "moderate": dict(
            goals_of_care="Symptom control, maintaining function, family preparation.",
            pain_management_plan="WHO Step 3 analgesia. Regular Morphine 10mg q4h with breakthrough provision.",
            psychological_support="Fortnightly counselling. PHQ-9 monitoring monthly.",
            spiritual_care="Chaplaincy monthly visits. Prayer support arranged per patient's request.",
            family_support_plan="Weekly family updates. Advance care planning discussion initiated.",
            advance_directives_notes="DNR discussed, decision pending family meeting.",
            bereavement_plan="Pre-bereavement counselling started. Memory-making activities encouraged.",
            care_phase="unstable",
        ),
        "deteriorating": dict(
            goals_of_care="Comfort-focused care. Minimise distressing symptoms. Family at bedside.",
            pain_management_plan="Morphine 20mg q4h + PRN 10mg for breakthrough. Syringe driver considered.",
            psychological_support="Daily emotional check-ins. Crisis protocol in place.",
            spiritual_care="Daily chaplaincy support. Family rituals facilitated.",
            family_support_plan="Daily family briefings. Bereavement preparation active.",
            advance_directives_notes="DNR in place. Patient does not wish for hospital admission.",
            bereavement_plan="Immediate bereavement support on standby. Memory vault set up.",
            care_phase="deteriorating",
        ),
        "critical": dict(
            goals_of_care="End-of-life comfort. Dignity preservation. Family presence.",
            pain_management_plan="Syringe driver: Morphine 120mg/24h + Midazolam 20mg/24h. No oral route.",
            psychological_support="Crisis psychological support. Chaplain present.",
            spiritual_care="Last rites facilitated per patient's faith. Family led religious support.",
            family_support_plan="24/7 family presence supported. Bereavement resources issued.",
            advance_directives_notes="DNAR in place. Liverpool Care Pathway activated.",
            bereavement_plan="Post-death support plan active. Social worker assigned.",
            care_phase="terminal",
        ),
    }

    for code, (pat, scenario) in patients.items():
        if db.query(CarePlan).filter(CarePlan.patient_id == pat.id).first():
            continue
        cp_data = CARE_PLAN_DATA.get(scenario, CARE_PLAN_DATA["moderate"])
        cp = CarePlan(
            patient_id=pat.id,
            created_by=clinician.id,
            version=1,
            is_current=True,
            ai_generated=True,
            ai_confidence=0.91,
            **cp_data,
            review_date=rdt(-14),  # 14 days in future
            disease_profile=pat.primary_diagnosis.split(" ")[0].lower(),
            created_at=rdt(20),
        )
        db.add(cp)
        db.flush()

        # Care plan goals
        GOAL_SETS = {
            "stable": [
                ("Control pain to 3/10 or less", "pain", "high"),
                ("Maintain independence in daily activities", "functional", "medium"),
                ("Support family in caregiver role", "family", "medium"),
            ],
            "moderate": [
                ("Reduce pain from 5/10 to 3/10", "pain", "critical"),
                ("Manage nausea to allow oral intake", "symptom", "high"),
                ("Provide psychological support weekly", "psychological", "high"),
            ],
            "deteriorating": [
                ("Achieve comfort and minimise suffering", "pain", "critical"),
                ("Ensure family readiness for end of life", "family", "critical"),
                ("Spiritual peace and legacy preparation", "spiritual", "high"),
            ],
            "critical": [
                ("Complete pain and distress elimination", "pain", "critical"),
                ("Maintain dignity through end of life", "safety", "critical"),
                ("Family and legacy wishes fulfilled", "family", "critical"),
            ],
        }
        for title, category, priority in GOAL_SETS.get(scenario, GOAL_SETS["moderate"]):
            db.add(CarePlanGoal(
                care_plan_id=cp.id, patient_id=pat.id,
                title=title, category=category, priority=priority,
                status="in_progress" if scenario in ("stable", "moderate") else "pending",
                progress=random.randint(20, 60),
                ai_suggested=True,
                created_by=clinician.id,
                notes=f"Goal established at care plan creation.",
            ))

        # Interventions
        db.add(CarePlanIntervention(
            care_plan_id=cp.id, patient_id=pat.id,
            name="Regular pain assessment and medication review",
            category="monitoring", frequency="Daily",
            responsible_role="nurse", status="active",
            ai_suggested=True, created_by=clinician.id,
        ))
        db.add(CarePlanIntervention(
            care_plan_id=cp.id, patient_id=pat.id,
            name="Family education on symptom recognition",
            category="education", frequency="Weekly",
            responsible_role="clinician", status="active",
            ai_suggested=True, created_by=clinician.id,
        ))

    db.commit()
    print("  Care plans committed")

    # ── SECTION 14: PATIENT JOURNEY EVENTS ───────────────────────────────────
    print("\n[14] Journey events")

    JOURNEY_TEMPLATES = {
        "stable": [
            ("admission", "Admitted to Palliative Care Programme", "Initial assessment completed. Symptom control initiated.", True),
            ("medication_started", "Morphine commenced for pain control", "10mg oral every 4 hours as per WHO analgesic ladder.", False),
            ("assessment", "ESAS assessment completed - pain 3/10", "Symptom burden improving. Family meeting held.", False),
            ("care_plan_created", "Personalised care plan created", "Goals: comfort, independence, family support.", True),
            ("milestone", "First week of care completed", "Patient reports improved pain control. Family satisfied.", True),
        ],
        "moderate": [
            ("admission", "Enrolled in palliative care - moderate needs", "Comprehensive needs assessment completed.", True),
            ("medication_started", "Morphine 10mg q4h started", "Step 3 WHO pain ladder initiated due to worsening pain.", False),
            ("assessment", "ESAS score 42/90 - moderate burden", "Nausea and fatigue primary concerns.", False),
            ("care_plan_created", "Care plan with psychological support goals", "Fortnightly counselling arranged.", True),
            ("daily_care_log", "Daily care log entry - Nurse Akua", "Vitals stable. Medication administered on time. Patient resting.", False),
        ],
        "deteriorating": [
            ("admission", "Care pathway escalated - deteriorating status", "Family meeting: advance care planning discussed.", True),
            ("status_change", "Status changed from moderate to deteriorating", "Functional decline noted - PPS 50%.", False),
            ("medication_changed", "Morphine dose escalated to 20mg q4h", "Breakthrough pain requiring dose increase.", False),
            ("alert_high", "Deterioration trend detected by ML system", "ESAS pain score trending up over 7 days. Urgent review.", False),
            ("shift_handover", "Night shift handover - Dr. Mensah to Dr. Osei", "Patient comfortable. Family present. Pain 6/10.", False),
            ("assessment", "PPS reassessment - 50% functional status", "Progressive decline. Goals of care discussed.", True),
        ],
        "critical": [
            ("admission", "Critical pathway activated", "End-of-life care plan implemented. Family notified.", True),
            ("alert_critical", "Critical hypoxemia - SpO2 < 88%", "Oxygen commenced. Immediate clinical review.", False),
            ("medication_changed", "Syringe driver commenced", "Subcutaneous morphine 120mg/24h. Midazolam added.", False),
            ("status_change", "End-of-life care status confirmed", "DNAR in place. Chaplain present. Family at bedside.", True),
            ("shift_handover", "Critical patient handover - all staff", "Comfort measures only. Family informed and prepared.", False),
            ("milestone", "Legacy wishes documented", "Memory vault set up. Letters recorded for family.", True),
        ],
    }

    for code, (pat, scenario) in patients.items():
        existing = db.query(PatientJourneyEvent).filter(
            PatientJourneyEvent.patient_id == pat.id).count()
        if existing >= 4:
            continue
        events = JOURNEY_TEMPLATES.get(scenario, JOURNEY_TEMPLATES["moderate"])
        for i, (etype, title, detail, milestone) in enumerate(events):
            db.add(PatientJourneyEvent(
                patient_id=pat.id,
                event_type=etype,
                event_title=title,
                event_detail=detail,
                is_milestone=milestone,
                created_by=clinician.id,
                created_at=rdt(len(events) - i, random.randint(0, 10)),
            ))

    db.commit()
    print("  Journey events committed")

    # ── SECTION 15: ALERTS ────────────────────────────────────────────────────
    print("\n[15] Alerts")

    for code, (pat, scenario) in patients.items():
        existing = db.query(Alert).filter(Alert.patient_id == pat.id).count()
        if existing >= 2:
            continue
        if scenario in ("critical", "deteriorating"):
            db.add(Alert(
                patient_id=pat.id,
                alert_type="vital_abnormal",
                severity="critical" if scenario == "critical" else "high",
                message=f"{'Critically low' if scenario == 'critical' else 'Low'} oxygen saturation detected - "
                        f"SpO2 {'85.2' if scenario == 'critical' else '89.5'}% (threshold: 90%). Immediate review required.",
                triggered_value="85.2" if scenario == "critical" else "89.5",
                is_acknowledged=False,
                created_at=rdt(0, 2),
            ))
            db.add(Alert(
                patient_id=pat.id,
                alert_type="ml_risk",
                severity="critical" if scenario == "critical" else "high",
                message=f"ML risk model flagged {pat.full_name}: overall risk "
                        f"{'87.3' if scenario == 'critical' else '73.1'}%. Highest: "
                        f"admission_risk. Clinician review recommended.",
                triggered_value="87.3" if scenario == "critical" else "73.1",
                is_acknowledged=False,
                created_at=rdt(0, 4),
            ))

    # Drug interaction alert for Abena
    abena = patients["patient.abena2"][0]
    if not db.query(Alert).filter(
            Alert.patient_id == abena.id,
            Alert.alert_type == "drug_interaction").first():
        db.add(Alert(
            patient_id=abena.id,
            alert_type="drug_interaction",
            severity="critical",
            message="SEVERE drug interaction: Morphine (Oral) + Diazepam. "
                    "Combined CNS/respiratory depression risk. Pharmacist review required immediately.",
            triggered_value="2",
            is_acknowledged=False,
            created_at=rdt(0, 1),
        ))

    db.commit()
    print("  Alerts committed")

    # ── SECTION 16: COMMUNITY GROUPS + POSTS + MEMBERSHIPS ───────────────────
    print("\n[16] Community groups")

    GROUPS = [
        ("Cancer Support Circle Ghana",
         "A safe space for people living with cancer and their families in Ghana. Share your journey, ask questions, and find hope together.",
         ["cancer"], 47),
        ("Heart Failure Warriors",
         "Community for patients and families navigating heart failure. Tips on breathlessness management, daily life, and staying positive.",
         ["heart_failure", "cardiac"], 31),
        ("Breathe Easy - COPD & Lung Disease",
         "Support group for those with COPD, lung cancer, and breathing difficulties. Breathing exercises, oxygen tips, daily coping strategies.",
         ["copd", "lung_cancer", "respiratory"], 28),
        ("Palliative Care Family Support",
         "For family members of palliative care patients. Caregiver self-care, grief support, and navigating the care journey together.",
         ["family", "caregiver", "bereavement"], 62),
        ("Bereavement & Grief Journey",
         "A space to process grief after losing a loved one. Peer support, remembrance, and moving forward with compassion.",
         ["bereavement", "grief"], 19),
        ("Ghana Palliative Network",
         "Connecting palliative care patients, families, and professionals across Ghana. News, resources, and community advocacy.",
         ["general", "ghana"], 104),
        ("End of Life & Legacy Planning",
         "Helping patients and families prepare for end of life with dignity. Advance directives, memory vaults, digital legacy guidance.",
         ["legacy", "end_of_life"], 23),
        ("Pain Management & Comfort Care",
         "Practical support for managing chronic and cancer pain. Medication tips, non-pharmacological methods, clinical Q&A.",
         ["pain", "symptom_management"], 38),
    ]

    group_records = []
    for name, desc, tags, count in GROUPS:
        existing = db.query(CommunityGroup).filter(CommunityGroup.name == name).first()
        if existing:
            group_records.append(existing)
            continue
        g = CommunityGroup(
            name=name, description=desc,
            condition_tags=jstr(tags),
            member_count=count, is_active=True,
            created_by=admin.id,
        )
        db.add(g)
        db.flush()
        group_records.append(g)

    db.commit()
    print(f"  {len(group_records)} groups committed")

    # Memberships
    USER_GROUP_MEMBERSHIPS = [
        (pat_users["patient"],       [0, 7]),
        (pat_users["patient.ama2"],  [0, 3, 6]),
        (pat_users["patient.kofi2"], [1, 3]),
        (pat_users["patient.abena2"],[2, 3]),
        (fam_emmanuel,               [3, 4, 5]),
        (fam_akos,                   [3, 4]),
        (family_user,                [3, 5]),
        (clinician,                  [5, 7]),
        (caregiver,                  [3, 5]),
        (nurse_akua,                 [3, 5, 7]),
    ]

    for usr, group_indices in USER_GROUP_MEMBERSHIPS:
        for gi in group_indices:
            if gi >= len(group_records):
                continue
            g = group_records[gi]
            exists = db.query(CommunityMembership).filter(
                CommunityMembership.user_id == usr.id,
                CommunityMembership.group_id == g.id,
            ).first()
            if not exists:
                db.add(CommunityMembership(user_id=usr.id, group_id=g.id, is_active=True))

    db.commit()

    # Community posts
    POSTS = [
        (0, pat_users["patient.ama2"],       "Ama · Cancer Journey",    "Today was a hard day, but I reminded myself that each day is a gift. The pain was managed well thanks to my care team. Grateful for this community."),
        (0, pat_users["patient"],            "Kofi · Cancer Journey",   "Three months since I started palliative care and I feel so much more comfortable. The Morphine has truly changed my life. Anyone else on this journey?"),
        (1, pat_users["patient.kofi2"],      "Kofi Jr · Heart Failure", "Breathlessness is my biggest challenge. The team showed me the pursed-lip breathing technique and it genuinely helps. Try it!"),
        (2, pat_users["patient.abena2"],     "Abena · COPD Journey",    "Using my oxygen concentrator consistently has improved my energy. It took time to accept needing it, but now I feel stronger."),
        (3, fam_emmanuel,                    "Emmanuel · Family Carer",  "Caring for my mother is the hardest and most meaningful thing I have ever done. This group keeps me going when I feel alone in this journey."),
        (3, fam_akos,                        "Akosua · Family Carer",   "Reminder to all caregivers: YOU need care too. I started seeing a counselor through the hospital and it has made a huge difference."),
        (4, fam_emmanuel,                    "Emmanuel · Bereaved",      "One year since we lost my mother. The grief comes in waves but I am grateful for the time we had and the memories in her memory vault."),
        (5, clinician,                       "Dr. Grace · Team",         "Palliative care in Ghana is growing. We now have 11 patients receiving specialist care. Every life matters. Every comfort matters."),
        (7, caregiver,                       "Nurse Akua · Team",        "Pain is the most treatable symptom in palliative care and yet still under-treated. Advocate for your loved ones. Ask the care team."),
    ]

    for gi, usr, display_name, content in POSTS:
        if gi >= len(group_records):
            continue
        g = group_records[gi]
        exists = db.query(CommunityPost).filter(
            CommunityPost.group_id == g.id,
            CommunityPost.author_id == usr.id,
        ).first()
        if not exists:
            db.add(CommunityPost(
                group_id=g.id, author_id=usr.id,
                display_name=display_name, content=content,
                created_at=rdt(random.randint(0, 30)),
            ))

    db.commit()
    print("  Community posts & memberships committed")

    # ── SECTION 17: RESOURCES ─────────────────────────────────────────────────
    print("\n[17] Resources")

    RESOURCES_DATA = [
        ("Understanding Palliative Care in Ghana",
         "A practical guide to palliative care services available in Ghana, what to expect, and how to access support.",
         "palliative_care", ["general", "ghana"], ["understanding_care", "getting_started"],
         "article", True, "simple"),
        ("Managing Cancer Pain at Home",
         "Step-by-step guide on using WHO pain ladder medications safely, recognising pain escalation, and when to call your care team.",
         "pain_management", ["cancer"], ["pain", "medication"],
         "article", True, "standard"),
        ("Living with Heart Failure: Day-to-Day Guide",
         "Practical tips for managing fluid intake, recognising worsening breathlessness, and maintaining quality of life with heart failure.",
         "condition_specific", ["heart_failure"], ["breathlessness", "daily_life"],
         "article", True, "standard"),
        ("COPD Breathing Exercises Video",
         "Instructional video demonstrating pursed-lip breathing, diaphragmatic breathing, and the active cycle of breathing technique.",
         "symptom_management", ["copd", "lung_cancer"], ["breathlessness", "exercise"],
         "video", True, "simple"),
        ("Nutrition and Appetite in Advanced Illness",
         "Why appetite changes in palliative illness, what to eat when nausea is present, and how to manage weight loss compassionately.",
         "nutrition", ["cancer", "general"], ["nutrition", "appetite"],
         "article", False, "simple"),
        ("Supporting Your Loved One: A Family Guide",
         "Comprehensive guide for families and caregivers on understanding palliative care, managing emotions, and preparing for end of life.",
         "family_support", ["family", "caregiver"], ["family", "emotional_support"],
         "article", True, "standard"),
        ("Advance Care Planning: Your Wishes, Your Choice",
         "How to document your care wishes, understand DNR decisions, and ensure your voice is heard in medical decisions.",
         "advance_planning", ["general"], ["advance_directives", "legacy"],
         "article", True, "detailed"),
        ("Managing Anxiety and Depression in Serious Illness",
         "Evidence-based strategies for coping with anxiety and depression. When to seek professional help and what treatments are available.",
         "mental_health", ["general"], ["anxiety", "depression", "mental_health"],
         "article", False, "standard"),
        ("Ghana Palliative Care Helpline",
         "24-hour helpline for palliative care patients and families in Ghana. Free counselling and crisis support.",
         "support_services", ["ghana"], ["crisis", "support"],
         "hotline", True, "simple"),
        ("Spiritual Care and Finding Peace",
         "Exploring spiritual needs in serious illness. Working with chaplains, traditional healers, and your faith community.",
         "spiritual_care", ["general", "ghana"], ["spiritual", "peace", "faith"],
         "article", True, "standard"),
        ("Sleep Problems in Palliative Care",
         "Why sleep is disrupted in serious illness and proven strategies to improve sleep quality without medication.",
         "symptom_management", ["general"], ["sleep", "fatigue"],
         "article", False, "simple"),
        ("Bereavement: Navigating Grief",
         "Understanding the grief journey after losing a loved one. Stages, self-care, and seeking professional support.",
         "bereavement", ["family", "bereavement"], ["grief", "bereavement"],
         "article", True, "standard"),
        ("Morphine: What Patients and Families Need to Know",
         "Addressing fears about morphine, safe use in palliative care, and why effective pain control improves quality of life.",
         "medication_education", ["cancer", "general"], ["pain", "medication"],
         "article", True, "simple"),
        ("Creating a Memory Box: A Guide for Patients",
         "How to create a meaningful memory box to preserve your story, values, and messages for your loved ones.",
         "legacy", ["general"], ["legacy", "memory"],
         "article", True, "simple"),
        ("Korle Bu Palliative Care Unit - Patient Guide (PDF)",
         "Official patient guide for the Korle Bu Teaching Hospital Palliative Care Unit. Services, contacts, visiting hours.",
         "facility_guide", ["ghana"], ["facility", "hospital"],
         "pdf", True, "simple"),
    ]

    resource_records = []
    for (title, summary, category, cond_tags, topic_tags,
         fmt, ghana, level) in RESOURCES_DATA:
        existing = db.query(Resource).filter(Resource.title == title).first()
        if existing:
            resource_records.append(existing)
            continue
        r = Resource(
            title=title, summary=summary,
            category=category,
            condition_tags=jstr(cond_tags),
            topic_tags=jstr(topic_tags),
            format=fmt,
            is_ghana_specific=ghana,
            difficulty_level=level,
            language="en",
            source="Project Aura Clinical Team",
            is_published=True,
            view_count=random.randint(20, 200),
            helpful_count=random.randint(5, 60),
            created_at=rdt(random.randint(30, 180)),
        )
        db.add(r)
        db.flush()
        resource_records.append(r)

    db.commit()

    # Bookmarks
    BOOKMARK_MAP = [
        (pat_users["patient"],        [0, 1, 5]),
        (pat_users["patient.ama2"],   [1, 4, 5, 6]),
        (pat_users["patient.kofi2"],  [2, 3, 10]),
        (pat_users["patient.abena2"], [3, 12, 9]),
        (fam_emmanuel,                [5, 11, 13]),
        (fam_akos,                    [5, 11]),
        (family_user,                 [5, 6, 11]),
    ]

    for usr, idxs in BOOKMARK_MAP:
        for i in idxs:
            if i >= len(resource_records):
                continue
            res = resource_records[i]
            exists = db.query(ResourceBookmark).filter(
                ResourceBookmark.user_id == usr.id,
                ResourceBookmark.resource_id == res.id,
            ).first()
            if not exists:
                db.add(ResourceBookmark(user_id=usr.id, resource_id=res.id))

    db.commit()
    print(f"  {len(resource_records)} resources + bookmarks committed")

    # ── SECTION 18: CHATBOT SESSIONS & MESSAGES ───────────────────────────────
    print("\n[18] Chatbot sessions")

    CHAT_HISTORIES = {
        "patient.ama2": [
            ("user",      "Hi Aura, I am feeling very tired today and my pain is bad."),
            ("assistant", "I am sorry to hear that, Ama. Your care team can see your check-in scores. A pain of 7/10 is too high -- have you been able to take your breakthrough dose of Morphine? If the pain is not settling, please contact your nurse."),
            ("user",      "Yes I took it but it helped only a little. My family is coming tonight."),
            ("assistant", "It is good your family will be with you. When your breakthrough dose only partially helps, that is a signal the regular dose may need reviewing. I will flag this so your care team can call you. In the meantime, try a warm compress on the painful area and gentle breathing exercises."),
            ("user",      "Thank you. What should I eat when I feel sick?"),
            ("assistant", "When nausea is present, small and frequent meals work best. Cold or room-temperature foods are easier to tolerate than hot meals. Plain foods like rice, bread, or crackers are gentler on the stomach. Ginger tea can also help. Would you like me to find you a resource on nutrition during illness?"),
        ],
        "patient.kofi2": [
            ("user",      "Aura I am struggling to breathe when I walk even a few steps."),
            ("assistant", "Thank you for telling me, Kofi. Breathlessness at rest or with minimal activity in heart failure is a sign your care team needs to know. Have you had any increased swelling in your ankles or legs? Please rate your breathlessness and I can include it in today's check-in report."),
            ("user",      "Yes my ankles are quite swollen today."),
            ("assistant", "Ankle swelling alongside breathlessness can mean fluid is building up -- this is something that needs a clinical review today. I have flagged this to Dr. Mensah. Please do not lie flat; sit upright or with extra pillows. If breathing worsens significantly, call emergency services on 193."),
            ("user",      "Thank you. My appointment is on Thursday."),
            ("assistant", "Good. Your Thursday appointment is already in the system. If things worsen before then, contact the care team directly. I will make sure your breathlessness and swelling are noted in your record so your clinician can review at the start of the appointment."),
        ],
        "patient": [
            ("user",      "Good morning Aura. How am I doing with my check-ins?"),
            ("assistant", "Good morning, Kofi! Looking at your recent check-ins, your average pain score over the last 7 days is 4.2/10, which is down from 5.1 last week -- that is a real improvement. Your fatigue scores are still high at 6/10. Your next palliative care review is in 7 days."),
            ("user",      "What does my risk score mean?"),
            ("assistant", "Your current risk score is in the moderate range, around 45%. This reflects your pain levels and the number of active medications. It is not a prediction of how long you have -- it guides how closely your care team monitors you. Your score has been stable, which is a good sign."),
        ],
        "family": [
            ("user",      "How is my father doing? Is he getting better?"),
            ("assistant", "Emmanuel, I understand how much you care for your father. Based on his recent check-ins, his pain has been better controlled this week. His care team has noted good medication compliance. Palliative care focuses on comfort and quality of life -- your support as family is one of the most important parts of his care."),
            ("user",      "I am feeling very stressed and tired from caring for him."),
            ("assistant", "What you are feeling is completely normal and very common among caregivers. It is called caregiver burnout and it is important to address it. Your own health matters too. The system shows there are caregiver support resources available to you -- would you like me to find a support group or counselling referral? You are not alone in this."),
        ],
    }

    for uname, history in CHAT_HISTORIES.items():
        usr = pat_users.get(uname) or (family_user if uname == "family" else None)
        if not usr:
            continue
        existing = db.query(ChatbotSession).filter(
            ChatbotSession.user_id == usr.id).first()
        if existing:
            continue
        sess = ChatbotSession(
            user_id=usr.id,
            started_at=rdt(2),
            message_count=len(history),
        )
        db.add(sess)
        db.flush()
        for i, (role, content) in enumerate(history):
            db.add(ChatbotMessage(
                session_id=sess.id,
                role=role,
                content=content,
                created_at=rdt(2, -(i * 0.1)),
                crisis_flagged=False,
            ))

    # Second session for ama2 (more recent)
    ama_user = pat_users["patient.ama2"]
    existing_sessions = db.query(ChatbotSession).filter(
        ChatbotSession.user_id == ama_user.id).count()
    if existing_sessions < 2:
        sess2 = ChatbotSession(user_id=ama_user.id, started_at=rdt(0, 3), message_count=2)
        db.add(sess2)
        db.flush()
        db.add(ChatbotMessage(session_id=sess2.id, role="user",
            content="Aura, can you remind me what my medications are for?",
            created_at=rdt(0, 3)))
        db.add(ChatbotMessage(session_id=sess2.id, role="assistant",
            content="Of course, Ama. Looking at your current medications: "
                    "Morphine 30mg every 4 hours is for pain control, "
                    "Dexamethasone 8mg once daily helps with inflammation and appetite, "
                    "and Ondansetron 8mg three times daily is for your nausea. "
                    "Always take them as prescribed and tell your care team if side effects change.",
            created_at=rdt(0, 2, )))

    db.commit()
    print("  Chatbot sessions committed")

    # ── SECTION 19: NOTIFICATIONS ─────────────────────────────────────────────
    print("\n[19] Notifications")

    NOTIFICATIONS = [
        # (recipient_user, type, title, body, is_read)
        (clinician,   "ml_risk_alert",        "ML Risk Alert -- Abena Owusu Darko",
         "ML risk model flagged Abena Owusu Darko: overall risk 87.3%. Highest: admission_risk (89%). Immediate review recommended.", False),
        (clinician,   "drug_interaction",      "SEVERE Drug Interaction -- Abena Owusu Darko",
         "SEVERE interaction detected: Morphine + Diazepam for Abena Owusu Darko. Combined CNS depression risk. Pharmacist review required.", False),
        (clinician,   "appointment_reminder",  "3 Appointments This Week",
         "Palliative Care Reviews scheduled for Ama Asante (Mon), Kofi Jr (Wed), Abena Darko (Fri). Check Appointments page.", False),
        (clinician,   "care_update",           "ESAS Trend Alert -- Ama Asante Boateng",
         "Ama's average pain score has increased by 2.1 points over 7 days. Deterioration trend detected. Consider care plan review.", False),
        (clinician,   "system",                "System Ready -- All ML Models Loaded",
         "All 8 XGBoost models loaded successfully. SHAP explainability active. 11 patients assessed in batch risk run.", True),

        (dr_mensah,   "ml_risk_alert",         "ML Risk Alert -- Ama Asante Boateng",
         "Overall risk 73.1%. Deterioration trend: pain 7/10 trending up over 14 days. Review care plan.", False),
        (dr_mensah,   "appointment_reminder",  "Palliative Care Review Tomorrow",
         "Ama Asante Boateng -- Palliative Care Review tomorrow at 09:00 at Korle Bu. Patient and family confirmed.", False),
        (dr_mensah,   "system",                "Welcome to Project Aura",
         "Your account is ready. Dashboard shows all 11 patients. AI Insights tab has full XGBoost risk table.", True),

        (dr_osei,     "system",                "Welcome to Project Aura",
         "Dr. Osei, your clinician account is ready. You have access to all 11 patient records.", True),
        (dr_osei,     "care_update",           "Critical Patient -- Yaw Asiedu",
         "Yaw Asiedu (PAT-007) has been flagged as critical. SpO2 85.2%. Immediate review required.", False),

        (nurse_akua,  "appointment_reminder",  "Daily Care Rounds -- 3 Patients",
         "Morning care round: Ama Asante (09:00), Abena Darko (10:30), Kwame Boateng (14:00). All vitals due.", False),
        (nurse_akua,  "care_update",           "Medication Due -- Abena Owusu Darko",
         "Abena's Morphine 30mg is due at 14:00. Please confirm administration and record in system.", False),
        (nurse_akua,  "system",                "Shift Handover Reminder",
         "Your shift ends at 18:00. Please complete Shift Handover form for Ama Asante and Abena Darko.", False),

        (carer_kwesi, "appointment_reminder",  "Home Visit -- Kofi Mensah Junior",
         "Home visit scheduled for Kofi Mensah Junior today at 15:00. Family member Akosua will be present.", False),
        (carer_kwesi, "system",                "Welcome to Project Aura",
         "Your caregiver account is active. You have 3 assigned patients. Check the Caregivers page for workload.", True),

        (test_admin,  "system",                "System Status Report",
         "All services operational. 14 users active. 11 patients enrolled. 8 ML models loaded. No critical system errors.", True),
        (test_admin,  "ml_risk_alert",         "Batch ML Risk Run Complete",
         "All 11 patients assessed. 3 critical, 2 deteriorating, 4 moderate, 2 stable. View AI Insights for full report.", False),

        (pat_users["patient"],       "care_update", "Your Care Team Has Logged New Vitals",
         "Dr. Grace Asante has reviewed your recent check-in. Your pain control is improving. See your My Space page.", False),
        (pat_users["patient.ama2"],  "care_update", "Pain Management Update",
         "Your care team has reviewed your ESAS check-in. Pain 7/10 noted. Dr. Mensah will call you today to discuss.", False),
        (pat_users["patient.ama2"],  "appointment_reminder", "Appointment Tomorrow -- Palliative Care Review",
         "Your Palliative Care Review is tomorrow at 09:00 at Korle Bu Teaching Hospital. Emmanuel will accompany you.", False),
        (pat_users["patient.kofi2"], "care_update", "Appointment Confirmed",
         "Your Pain Management Consultation in 14 days is confirmed. Dr. Mensah will review your breathlessness symptoms.", True),
        (pat_users["patient.abena2"],"care_update", "Critical: Care Team Review Scheduled",
         "Your care team has flagged urgent concerns with your current medications. A clinical review is scheduled for today.", False),

        (fam_emmanuel,"care_update", "Update on Ama's Care",
         "Ama's care team has updated her care plan. Her comfort is the priority. A family meeting has been arranged for this week.", False),
        (fam_emmanuel,"care_update", "Bereavement Support Available",
         "The palliative care team has resources and counselling support available for you. Please reach out when ready.", True),
        (fam_akos,    "care_update", "Kofi's Appointment Confirmed",
         "Kofi Mensah Junior's next care review is confirmed. The care team will provide an update afterwards.", True),
        (family_user, "care_update", "Your Loved One's Care Update",
         "Dr. Grace Asante has logged new vitals for Kofi Mensah. Everything is stable. Care plan remains unchanged.", True),
    ]

    for (usr, ntype, title, body, is_read) in NOTIFICATIONS:
        existing = db.query(NotificationQueue).filter(
            NotificationQueue.recipient_id == usr.id,
            NotificationQueue.title == title,
        ).first()
        if not existing:
            db.add(NotificationQueue(
                recipient_id=usr.id,
                notification_type=ntype,
                title=title,
                body=body,
                is_read=is_read,
                is_sent=True,
                sent_at=rdt(random.randint(0, 5)),
                created_at=rdt(random.randint(0, 5)),
            ))

    db.commit()
    print(f"  {len(NOTIFICATIONS)} notifications committed")

    # ── SECTION 20: BEREAVEMENT ENTRIES & LEGACY ─────────────────────────────
    print("\n[20] Bereavement & Legacy")

    BEREAVEMENT_ENTRIES = [
        (fam_emmanuel.id, patients["patient.ama2"][0].id, "memory",
         "I remember my mother singing hymns every morning while she prepared breakfast. Even when she was ill, she would hum quietly. That sound is something I will carry forever.",
         False, 0.4),
        (fam_emmanuel.id, patients["patient.ama2"][0].id, "reflection",
         "Some days the grief feels unbearable. I found myself talking to her photo this morning. But I also feel grateful -- grateful that she had good pain control at the end, grateful for the care team, and grateful for the time we had.",
         True, 0.3),
        (fam_akos.id, patients["patient.kofi2"][0].id, "memory",
         "Papa used to take me to the market every Saturday. He knew every seller by name. Watching him struggle to walk now is hard, but he still lights up when I arrive. He is still him.",
         False, 0.5),
        (family_user.id, patients["patient"][0].id, "memory",
         "Dad was always the one who fixed everything -- the car, the roof, whatever was broken. Now we are caring for him and I see how much strength it takes. I understand his love differently now.",
         False, 0.4),
    ]

    for (uid, pid, etype, content, is_private, sentiment) in BEREAVEMENT_ENTRIES:
        existing = db.query(BereavementEntry).filter(
            BereavementEntry.user_id == uid,
            BereavementEntry.patient_id == pid,
        ).first()
        if not existing:
            db.add(BereavementEntry(
                patient_id=pid, user_id=uid,
                entry_type=etype, content=content,
                is_private=is_private,
                sentiment_score=sentiment,
                grief_stage_hint="acceptance" if sentiment > 0.4 else "grief",
                created_at=rdt(random.randint(3, 30)),
            ))

    # Legacy heirs
    ama_pat = patients["patient.ama2"][0]
    if not db.query(LegacyHeir).filter(
            LegacyHeir.patient_id == ama_pat.id).first():
        heir = LegacyHeir(
            patient_id=ama_pat.id,
            heir_user_id=fam_emmanuel.id,
            heir_type="family",
            relationship="son",
            access_level="full",
            can_access_private=True,
            designated_at=rdt(20),
            is_active=True,
            notes_from_patient="Emmanuel -- you have been my greatest support. Everything in my memory vault is for you. I love you.",
        )
        db.add(heir)
        db.flush()

        db.add(LegacyContent(
            patient_id=ama_pat.id,
            content_type="final_message",
            title="My Final Letter to Emmanuel",
            content="My dear son, by the time you read this I will be at peace. Thank you for every moment you sat with me, for every meal you brought, and for every prayer you said. You have been the greatest gift of my life. Live fully, love deeply, and remember me with joy, not sadness. Your mother always.",
            delivery_trigger="after_death",
            is_delivered=False,
            created_at=rdt(10),
        ))

    db.commit()
    print("  Bereavement & legacy committed")

    # ── SECTION 21: AUDIT LOG ─────────────────────────────────────────────────
    print("\n[21] Audit log")

    AUDIT_ACTIONS = [
        (admin,     "admin",     "login_success",    "user",    None, "Admin login from Accra"),
        (clinician, "clinician", "login_success",    "user",    None, "Clinician login"),
        (clinician, "clinician", "view_patient",     "patient", 1,    "Viewed patient record PAT-001"),
        (clinician, "clinician", "add_vitals",       "vital",   1,    "Logged vitals for PAT-001"),
        (clinician, "clinician", "ml_risk_run",      "prediction",1,  "XGBoost risk assessment run for all patients"),
        (clinician, "clinician", "prescribe_medication","medication",1,"Morphine 30mg prescribed for patient.abena2"),
        (caregiver, "caregiver", "login_success",    "user",    None, "Caregiver login"),
        (caregiver, "caregiver", "view_patient",     "patient", 2,    "Viewed assigned patient record"),
        (caregiver, "caregiver", "log_care",         "journey", None, "Daily care log entry submitted"),
        (nurse_akua,"caregiver", "shift_handover",   "journey", None, "Shift handover submitted for Ama Asante"),
        (test_admin,"admin",     "user_management",  "user",    None, "Reviewed all 14 system users"),
        (test_admin,"admin",     "hipaa_review",     "compliance",None,"HIPAA compliance report generated"),
        (dr_mensah, "clinician", "ai_insights_view", "prediction",None,"Batch ML risk run reviewed in AI Insights"),
        (dr_mensah, "clinician", "clinical_override","prediction",1,   "ML prediction reviewed -- agreed with model"),
    ]

    for (usr, role, action, rtype, rid, detail) in AUDIT_ACTIONS:
        db.add(AuditLog(
            user_id=usr.id, user_role=role,
            action=action, resource_type=rtype,
            resource_id=rid,
            details=detail,
            ip_address=f"192.168.1.{random.randint(10, 200)}",
            success=True,
            created_at=rdt(random.randint(0, 14)),
        ))

    db.commit()
    print("  Audit log committed")

    # ── SECTION 22: HIPAA BREACH INCIDENT ────────────────────────────────────
    print("\n[22] HIPAA breach incident (demo)")

    existing_breach = db.query(BreachIncident).first()
    if not existing_breach:
        db.add(BreachIncident(
            breach_type="unauthorized_access",
            discovered_at=rdt(45),
            affected_patient_ids=jstr([]),
            affected_count=0,
            description="Demo: A test device accessed the staging API without authentication. "
                        "No patient data was exposed. Access immediately revoked. "
                        "Security patch applied within 2 hours.",
            severity="low",
            reported_to_authorities=False,
            notification_sent=False,
            resolution_notes="API key rotated. Rate limiting increased. No PHI accessed.",
            resolved_at=rdt(44),
            created_by=admin.id,
        ))
        db.commit()
    print("  Breach incident committed")

    # ── SECTION 23: CAREGIVER BURDEN ASSESSMENTS ─────────────────────────────
    print("\n[23] Caregiver burden assessments")

    BURDEN_BY_PATIENT = {
        "patient.ama2":   (caregiver.id,  28, "Moderate burden", True,  True,  False),
        "patient.kofi2":  (carer_kwesi.id, 18, "Mild burden",    False, True,  False),
        "patient.abena2": (nurse_akua.id,  38, "High burden",    True,  True,  True),
        "PAT-005":        (nurse_akua.id,  42, "High burden",    True,  True,  True),
        "PAT-006":        (caregiver.id,   35, "Moderate burden",True,  True,  False),
    }

    for code, (cg_id, total, level, respite, support_grp, counselling) in BURDEN_BY_PATIENT.items():
        if code not in patients:
            continue
        pat = patients[code][0]
        if db.query(CaregiverBurdenAssessment).filter(
                CaregiverBurdenAssessment.patient_id == pat.id).first():
            continue
        per_q = max(0, total // 12)
        db.add(CaregiverBurdenAssessment(
            patient_id=pat.id,
            caregiver_id=cg_id,
            assessed_at=rdt(7),
            q1_more_time=min(4, per_q + random.randint(0, 1)),
            q2_stressed=min(4, per_q + random.randint(0, 1)),
            q3_angry=min(4, max(0, per_q - 1)),
            q4_affect_relationship=min(4, per_q),
            q5_strained=min(4, per_q + random.randint(0, 1)),
            q6_health_suffered=min(4, max(0, per_q - 1)),
            q7_lack_privacy=min(4, per_q),
            q8_social_life_suffered=min(4, per_q + random.randint(0, 1)),
            q9_lost_control=min(4, max(0, per_q - 1)),
            q10_uncertain=min(4, per_q),
            q11_do_more=min(4, max(0, per_q - 1)),
            q12_do_better=min(4, max(0, per_q - 1)),
            total_score=total,
            burden_level=level,
            needs_respite_care=respite,
            needs_support_group=support_grp,
            needs_counseling=counselling,
            notes="Zarit Burden Interview (12-item short form). "
                  "Caregiver requires additional support and monitoring.",
        ))

    db.commit()
    print("  Caregiver burden assessments committed")

    # ── SECTION 24: AI PREDICTIONS (for Predictions table) ───────────────────
    print("\n[24] AI Predictions")

    RISK_BY_SCENARIO = {
        "stable":        (0.22, "Low"),
        "moderate":      (0.48, "Medium"),
        "deteriorating": (0.73, "High"),
        "critical":      (0.88, "Crisis"),
    }

    for code, (pat, scenario) in patients.items():
        if db.query(Prediction).filter(Prediction.patient_id == pat.id).first():
            continue
        risk_score, risk_level = RISK_BY_SCENARIO.get(scenario, (0.48, "Medium"))
        risk_score += random.uniform(-0.04, 0.04)
        db.add(Prediction(
            patient_id=pat.id,
            predicted_at=rdt(0, 1),
            care_pathway={
                "stable": "home_hospice_care",
                "moderate": "palliative_care_standard",
                "deteriorating": "inpatient_hospice",
                "critical": "crisis_intervention",
            }.get(scenario, "palliative_care_standard"),
            risk_score=round(risk_score, 4),
            risk_level=risk_level,
            confidence=round(random.uniform(0.87, 0.97), 3),
            shap_values=jstr({"esas_pain": 0.18, "oxygen_saturation": 0.14,
                              "esas_total": 0.12, "pps": -0.10, "age": 0.08}),
            feature_values=jstr({"esas_pain": 7, "oxygen_saturation": 89,
                                 "esas_total": 52, "pps": 50, "age": 65}),
            plain_explanation=(
                f"Patient assessed as {risk_level} risk based on ESAS symptom scores, "
                f"vital signs, and functional status. "
                f"Primary drivers: pain severity, oxygen saturation trend."
            ),
            model_version="xgboost_v2",
            triggered_by="proactive_monitor",
        ))
        pat.risk_score = round(risk_score, 4)
        pat.risk_level = risk_level
        pat.last_assessment = rdt(0, 1)

    db.commit()
    print("  Predictions committed")

    # ── SECTION 25: SYMPTOM RECORDS ───────────────────────────────────────────
    print("\n[25] Symptom records")

    SYM_BASE = {
        "stable":        {"pain": (1, 4),  "fatigue": 0.2, "nausea": 0.1, "anxiety": 0.2},
        "moderate":      {"pain": (3, 6),  "fatigue": 0.5, "nausea": 0.3, "anxiety": 0.4},
        "deteriorating": {"pain": (5, 8),  "fatigue": 0.7, "nausea": 0.5, "anxiety": 0.6},
        "critical":      {"pain": (7, 10), "fatigue": 0.9, "nausea": 0.7, "anxiety": 0.8},
    }

    for code, (pat, scenario) in patients.items():
        existing = db.query(Symptom).filter(Symptom.patient_id == pat.id).count()
        if existing >= 15:
            continue
        r = SYM_BASE.get(scenario, SYM_BASE["moderate"])
        for day in range(21):
            if random.random() < 0.55:
                ts = rdt(21 - day, random.randint(7, 20))
                db.add(Symptom(
                    patient_id=pat.id,
                    recorded_by=clinician.id,
                    recorded_at=ts,
                    pain_level=random.randint(*r["pain"]),
                    pain_location=random.choice(
                        ["Abdomen", "Chest", "Lower back", "Generalised", "Pelvis", "Head"]),
                    fatigue=random.random() < r["fatigue"],
                    fatigue_level=random.randint(4, 9) if random.random() < r["fatigue"] else 0,
                    nausea=random.random() < r["nausea"],
                    nausea_level=random.randint(2, 7) if random.random() < r["nausea"] else 0,
                    anxiety=random.random() < r["anxiety"],
                    anxiety_level=random.randint(3, 8) if random.random() < r["anxiety"] else 0,
                    depression_level=random.randint(2, 7),
                    appetite_level=random.randint(2, 7),
                    sleep_quality=random.randint(2, 7),
                    breathlessness=random.randint(1, 7),
                    notes=random.choice([
                        None, None,
                        "Pain worse at night",
                        "Nausea after medication",
                        "Fatigue improved with rest",
                        "Anxiety about upcoming appointment",
                    ]),
                ))

    db.commit()
    print("  Symptom records committed")

    # ── SECTION 26: QUALITY OF LIFE ASSESSMENTS ───────────────────────────────
    print("\n[26] Quality of Life assessments")

    QOL_BASE = {
        "stable":        75, "moderate": 55,
        "deteriorating": 38, "critical": 22,
    }

    for code, (pat, scenario) in patients.items():
        if db.query(QualityOfLifeAssessment).filter(
                QualityOfLifeAssessment.patient_id == pat.id).first():
            continue
        total = QOL_BASE.get(scenario, 55) + random.randint(-5, 5)
        # distribute across 4 domains
        phys  = max(5,  min(28, int(total * 0.25) + random.randint(-3, 3)))
        soc   = max(5,  min(28, int(total * 0.26) + random.randint(-3, 3)))
        emot  = max(5,  min(24, int(total * 0.24) + random.randint(-3, 3)))
        func  = max(5,  min(28, int(total * 0.25) + random.randint(-3, 3)))
        db.add(QualityOfLifeAssessment(
            patient_id=pat.id, assessed_by=clinician.id,
            assessed_at=rdt(14),
            physical_lack_of_energy=min(4, phys // 7),
            physical_nausea=min(4, phys // 7),
            physical_meeting_needs=min(4, phys // 7),
            physical_side_effects=min(4, phys // 7),
            physical_feel_ill=min(4, phys // 7),
            physical_bed_time=min(4, phys // 7),
            physical_pain=min(4, phys // 7),
            social_close_to_friends=min(4, soc // 7),
            social_emotional_support=min(4, soc // 7),
            social_support_from_family=min(4, soc // 7),
            social_acceptance_of_illness=min(4, soc // 7),
            social_family_communication=min(4, soc // 7),
            social_close_to_partner=min(4, soc // 7),
            social_satisfaction_sex_life=0,
            emotional_feel_sad=min(4, emot // 6),
            emotional_coping_with_illness=min(4, emot // 6),
            emotional_losing_hope=min(4, emot // 6),
            emotional_feel_nervous=min(4, emot // 6),
            emotional_worry_about_dying=min(4, emot // 6),
            emotional_worry_about_condition=min(4, emot // 6),
            functional_able_to_work=min(4, func // 7),
            functional_work_fulfilling=min(4, func // 7),
            functional_enjoy_life=min(4, func // 7),
            functional_accepted_illness=min(4, func // 7),
            functional_sleeping_well=min(4, func // 7),
            functional_enjoying_hobbies=min(4, func // 7),
            functional_content_with_qol=min(4, func // 7),
            physical_score=phys,
            social_score=soc,
            emotional_score=emot,
            functional_score=func,
            total_score=phys + soc + emot + func,
            notes="FACT-G Quality of Life assessment",
        ))

    db.commit()
    print("  QoL assessments committed")

    # ── SECTION 27: PAIN ASSESSMENTS (Brief Pain Inventory) ──────────────────
    print("\n[27] Pain assessments (BPI)")

    PAIN_WORST = {
        "stable": 4, "moderate": 6, "deteriorating": 8, "critical": 9,
    }

    for code, (pat, scenario) in patients.items():
        if db.query(PainAssessment).filter(
                PainAssessment.patient_id == pat.id).first():
            continue
        worst = PAIN_WORST.get(scenario, 6)
        avg   = max(1, worst - 2)
        curr  = max(1, worst - random.randint(1, 3))
        least = max(0, worst - 4)
        db.add(PainAssessment(
            patient_id=pat.id, assessed_by=clinician.id,
            assessed_at=rdt(7),
            pain_worst=worst, pain_least=least,
            pain_average=avg, pain_current=curr,
            pain_location=random.choice([
                "Abdominal region", "Chest and thorax", "Lower back and pelvis",
                "Generalised throughout body", "Right side abdomen"]),
            pain_type=random.choice([
                "Constant aching", "Intermittent sharp", "Burning",
                "Pressure and heaviness", "Mixed nociceptive and neuropathic"]),
            interference_activity=min(10, worst + random.randint(-1, 1)),
            interference_mood=min(10, worst - 1),
            interference_walking=min(10, worst - 2),
            interference_work=min(10, worst),
            interference_relations=min(10, worst - 2),
            interference_sleep=min(10, worst - 1),
            interference_enjoyment=min(10, worst),
            current_medications="Morphine oral, Paracetamol, Ondansetron",
            medication_effectiveness=random.randint(40, 75),
            notes="Brief Pain Inventory - short form. "
                  "Pain score is lowest in morning, highest at night.",
        ))

    db.commit()
    print("  BPI assessments committed")

    # ── SECTION 28: SHIFT HANDOVER & DAILY CARE LOG (journey events) ─────────
    print("\n[28] Shift handover & daily care log entries")

    SHIFT_EVENTS = [
        (patients.get("patient.ama2", (None,))[0], nurse_akua,
         "shift_handover",
         "Night to Morning Shift Handover -- Nurse Akua to Nurse Kwame",
         "Patient Ama Asante Boateng: Pain controlled at 5/10 with scheduled morphine. "
         "Family (Emmanuel) present overnight. Breathlessness mild, oxygen not required. "
         "Morning ESAS due. Medications all administered. Next dose Morphine at 08:00.",
        ),
        (patients.get("patient.abena2", (None,))[0], nurse_akua,
         "shift_handover",
         "Evening Handover -- Critical Patient Abena Owusu Darko",
         "SpO2 fluctuating between 85-88% on 4L O2. Syringe driver running. "
         "Family notified -- sister arriving tonight. DNR in place. "
         "Pain currently 8/10 despite breakthrough dose -- escalation discussed with Dr. Mensah.",
        ),
        (patients.get("patient.ama2", (None,))[0], caregiver,
         "daily_care_log",
         "Daily Care Log -- Ama Asante Boateng",
         "Morning routine completed. Personal hygiene assisted. Breakfast taken (half portion). "
         "Morphine 09:00 administered and confirmed. Pain 5/10 -- improved from yesterday 7/10. "
         "Patient in good spirits, spoke with family by phone. Afternoon walk attempted -- 5 minutes, tolerated well.",
        ),
        (patients.get("patient.kofi2", (None,))[0], carer_kwesi,
         "daily_care_log",
         "Daily Care Log -- Kofi Mensah Junior",
         "Home visit completed 15:00-17:00. Blood pressure 105/68, HR 88, SpO2 91%. "
         "Furosemide administered. Ankle oedema mild today -- better than yesterday. "
         "Nutrition: small lunch, no appetite for dinner. Akosua (daughter) present and well-supported.",
        ),
    ]

    for (pat, staff, etype, title, detail) in SHIFT_EVENTS:
        if not pat:
            continue
        if not db.query(PatientJourneyEvent).filter(
                PatientJourneyEvent.patient_id == pat.id,
                PatientJourneyEvent.event_type == etype,
                PatientJourneyEvent.event_title == title,
        ).first():
            db.add(PatientJourneyEvent(
                patient_id=pat.id,
                event_type=etype,
                event_title=title,
                event_detail=detail,
                is_milestone=False,
                created_by=staff.id,
                created_at=rdt(0, random.randint(1, 8)),
            ))

    db.commit()
    print("  Shift handover & daily care log events committed")

    # ── SECTION 29: MESSAGING (direct messages) ───────────────────────────────
    print("\n[29] Messaging records")

    # Messages use the messaging/contacts tables -- check if tables exist
    try:
        from src.db import Message, MessageThread
        THREADS = [
            # (sender, recipient, subject, messages_list)
            (pat_users["patient.ama2"], clinician,
             "Pain medication question",
             [
                 (pat_users["patient.ama2"], "Good morning Doctor. My pain was very bad last night. I took the breakthrough dose but it only helped for about 2 hours. Is this normal?"),
                 (clinician, "Good morning Ama. Thank you for letting me know. Two hours of relief suggests the breakthrough dose may be too low. I will review your prescription today and call you this afternoon. In the meantime please continue taking it as needed and keep track of how often you need it."),
                 (pat_users["patient.ama2"], "Thank you Doctor. Emmanuel will be with me when you call."),
             ]
            ),
            (fam_emmanuel, clinician,
             "Update on mother's care",
             [
                 (fam_emmanuel, "Dr. Mensah, I wanted to thank you and the team for the wonderful care you are giving my mother. She told me she felt the most comfortable she has in months. Is there anything more we can do as a family?"),
                 (clinician, "Emmanuel, thank you for your kind words. Your presence is the most important thing. For her comfort: ensure she takes her medications on time, keep her hydrated with small sips, and do not worry if her appetite is low. Call us any time if her symptoms worsen."),
             ]
            ),
            (pat_users["patient.kofi2"], nurse_akua,
             "Breathlessness at night",
             [
                 (pat_users["patient.kofi2"], "Nurse Akua, I am having a lot of difficulty breathing when I lie down at night. It is keeping me awake."),
                 (nurse_akua, "Kofi, that is orthopnoea -- breathlessness when lying flat, common in heart failure. Try sleeping with 2-3 extra pillows to prop yourself up. If it worsens or you feel chest pain, call me immediately on the number I gave you."),
                 (pat_users["patient.kofi2"], "Thank you, I will try the pillows tonight."),
                 (nurse_akua, "Good. I will also flag this to Dr. Mensah so he can review your Furosemide dose at your next visit. Let me know how the night goes."),
             ]
            ),
        ]

        for (sender, recipient, subject, messages) in THREADS:
            # Create thread
            existing_thread = db.query(MessageThread).filter(
                MessageThread.subject == subject).first() if hasattr(MessageThread, 'subject') else None

            if not existing_thread:
                try:
                    thread = MessageThread(
                        subject=subject,
                        participant_ids=jstr([sender.id, recipient.id]),
                        created_at=rdt(3),
                        last_message_at=rdt(0, 6),
                    )
                    db.add(thread)
                    db.flush()

                    for i, (msg_sender, msg_content) in enumerate(messages):
                        db.add(Message(
                            thread_id=thread.id,
                            sender_id=msg_sender.id,
                            content=msg_content,
                            is_read=True if i < len(messages) - 1 else False,
                            created_at=rdt(3, -(i * 0.5)),
                        ))
                except Exception:
                    db.rollback()

        db.commit()
        print("  Messages committed")
    except Exception as e:
        db.rollback()
        print(f"  Messages skipped (table structure differs): {e}")

    # ── SECTION 30: FINAL SUMMARY ─────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("FULL SYSTEM SEED COMPLETE")
    print("=" * 65)

    # Count everything
    total_users      = db.query(User).count()
    total_patients   = db.query(Patient).count()
    total_vitals     = db.query(Vital).count()
    total_esas       = db.query(ESASAssessment).count()
    total_meds       = db.query(Medication).count()
    total_appts      = db.query(Appointment).count()
    total_alerts     = db.query(Alert).count()
    total_notifs     = db.query(NotificationQueue).count()
    total_groups     = db.query(CommunityGroup).count()
    total_resources  = db.query(Resource).count()
    total_care_plans = db.query(CarePlan).count()

    print(f"\n  Users           : {total_users}")
    print(f"  Patients        : {total_patients}")
    print(f"  Vitals          : {total_vitals}")
    print(f"  ESAS check-ins  : {total_esas}")
    print(f"  Medications     : {total_meds}")
    print(f"  Appointments    : {total_appts}")
    print(f"  Alerts          : {total_alerts}")
    print(f"  Notifications   : {total_notifs}")
    print(f"  Community groups: {total_groups}")
    print(f"  Resources       : {total_resources}")
    print(f"  Care plans      : {total_care_plans}")

    print("\nLOGIN CREDENTIALS")
    print("-" * 65)
    print(f"  {'ROLE':<12} {'USERNAME':<22} {'PASSWORD'}")
    CREDS = [
        ("admin",     "admin",           "admin123"),
        ("admin",     "test.admin",      "TestPass123!"),
        ("clinician", "clinician",       "clinician123"),
        ("clinician", "dr.mensah",       "TestPass123!"),
        ("clinician", "dr.osei",         "TestPass123!"),
        ("caregiver", "caregiver",       "caregiver123"),
        ("caregiver", "nurse.akua",      "TestPass123!"),
        ("caregiver", "carer.kwesi",     "TestPass123!"),
        ("patient",   "patient",         "patient123"),
        ("patient",   "patient.ama2",    "TestPass123!"),
        ("patient",   "patient.kofi2",   "TestPass123!"),
        ("patient",   "patient.abena2",  "TestPass123!"),
        ("family",    "family",          "family123"),
        ("family",    "family.emmanuel", "TestPass123!"),
        ("family",    "family.akos",     "TestPass123!"),
    ]
    for role, username, password in CREDS:
        print(f"  {role:<12} {username:<22} {password}")

    print("\nKEY TEST SCENARIOS")
    print("-" * 65)
    print("  patient.abena2  --> SEVERE Morphine + Diazepam drug interaction")
    print("  patient.ama2    --> Deteriorating ESAS trend over 14 days")
    print("  patient.abena2  --> Critical ML risk score ~87%")
    print("  dr.mensah       --> Full AI Insights: 12 patients, SHAP, drug interactions")
    print("  nurse.akua      --> Caregiver dashboard: shift handover, daily care log")
    print("  family.emmanuel --> Bereavement support, memory vault, legacy content")
    print("\nURL:     http://localhost:5173")
    print("Backend: http://localhost:8000")
    print("=" * 65)

    db.close()


if __name__ == "__main__":
    main()
