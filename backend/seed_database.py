"""
Database Seeder for Project Aura - KIRO Specification
Seeds all demo data with realistic Ghana-specific content
"""

from datetime import datetime, timedelta
import random
from src.db import *

def seed_database():
    """Seed database with all demo data"""
    session = get_session()
    
    try:
        print("🌱 Starting database seeding...")
        
        # Delete old database
        import os
        if os.path.exists('aura.db'):
            os.remove('aura.db')
            print("🗑️  Deleted old database")
        
        # Create all tables
        init_database()
        
        # 1. Create 5 demo users
        print("👤 Creating users...")
        admin_pw = hash_password('admin123')
        clinician_pw = hash_password('clinician123')
        caregiver_pw = hash_password('caregiver123')
        patient_pw = hash_password('patient123')
        family_pw = hash_password('family123')
        
        admin = User(username='admin', email='admin@projectaura.gh', hashed_password=admin_pw, role='admin', full_name='Dr. Samuel Mensah', phone='+233 302 000 000', consent_given=True, consent_at=datetime.utcnow())
        clinician = User(username='clinician', email='clinician@projectaura.gh', hashed_password=clinician_pw, role='clinician', full_name='Dr. Grace Asante', phone='+233 244 111 111', consent_given=True, consent_at=datetime.utcnow())
        caregiver = User(username='caregiver', email='caregiver@projectaura.gh', hashed_password=caregiver_pw, role='caregiver', full_name='Nurse Akua Mensah', phone='+233 244 222 222', consent_given=True, consent_at=datetime.utcnow())
        patient_user = User(username='patient', email='patient@projectaura.gh', hashed_password=patient_pw, role='patient', full_name='Kofi Mensah', phone='+233 244 333 333', consent_given=True, consent_at=datetime.utcnow())
        family = User(username='family', email='family@projectaura.gh', hashed_password=family_pw, role='family', full_name='Emmanuel Mensah', phone='+233 244 444 444', consent_given=True, consent_at=datetime.utcnow())
        
        session.add_all([admin, clinician, caregiver, patient_user, family])
        session.commit()
        print(f"✅ Created 5 users")
        
        # 2. Create 8 demo patients (2 per scenario)
        print("🏥 Creating patients...")
        patients_data = [
            # STABLE
            {'code': 'PAT-001', 'name': 'Kofi Mensah', 'age': 67, 'gender': 'Male', 'diagnosis': 'Prostate Cancer (Stage III)', 'scenario': 'stable'},
            {'code': 'PAT-002', 'name': 'Abena Sarpong', 'age': 72, 'gender': 'Female', 'diagnosis': 'Congestive Heart Failure', 'scenario': 'stable'},
            # MODERATE
            {'code': 'PAT-003', 'name': 'Emmanuel Ofori', 'age': 58, 'gender': 'Male', 'diagnosis': 'Non-Small Cell Lung Cancer', 'scenario': 'moderate'},
            {'code': 'PAT-004', 'name': 'Grace Asante', 'age': 61, 'gender': 'Female', 'diagnosis': 'COPD (Severe)', 'scenario': 'moderate'},
            # DETERIORATING
            {'code': 'PAT-005', 'name': 'Kwame Boateng', 'age': 74, 'gender': 'Male', 'diagnosis': 'Pancreatic Cancer (Metastatic)', 'scenario': 'deteriorating'},
            {'code': 'PAT-006', 'name': 'Akosua Darko', 'age': 69, 'gender': 'Female', 'diagnosis': 'End-Stage Liver Failure', 'scenario': 'deteriorating'},
            # CRISIS
            {'code': 'PAT-007', 'name': 'Yaw Asiedu', 'age': 81, 'gender': 'Male', 'diagnosis': 'End-Stage Renal Failure', 'scenario': 'crisis'},
            {'code': 'PAT-008', 'name': 'Ama Osei', 'age': 77, 'gender': 'Female', 'diagnosis': 'Ovarian Cancer (Advanced)', 'scenario': 'crisis'},
        ]
        
        patients = []
        for p in patients_data:
            dob = datetime.utcnow() - timedelta(days=365 * p['age'])
            admission = datetime.utcnow() - timedelta(days=random.randint(30, 180))
            
            patient = Patient(
                patient_code=p['code'],
                full_name=p['name'],
                date_of_birth=dob,
                gender=p['gender'],
                ghana_card_number=f"GHA-{random.randint(100000000, 999999999):09d}-{random.randint(0,9)}",
                nhis_number=f"NHIS-{random.randint(10000000, 99999999)}",
                phone=f"+233 {random.randint(200,299)} {random.randint(100,999)} {random.randint(100,999)}",
                address=f"House {random.randint(1,200)}, {random.choice(['Osu', 'Labone', 'East Legon', 'Tema', 'Kumasi', 'Tamale'])}",
                region=random.choice(['Greater Accra', 'Ashanti', 'Northern', 'Western']),
                district=random.choice(['Accra Metro', 'Kumasi Metro', 'Tamale Metro']),
                facility_name='Korle Bu Teaching Hospital',
                primary_diagnosis=p['diagnosis'],
                admission_date=admission,
                status='active',
                primary_clinician_id=clinician.id,
                preferred_language='en',
                religious_preference=random.choice(['Christian', 'Muslim', 'Traditional']),
            )
            patients.append(patient)
            session.add(patient)
        
        session.commit()
        print(f"✅ Created {len(patients)} patients")
        
        # 3. Link family user to Kofi Mensah
        family_link = PatientFamilyLink(
            patient_id=patients[0].id,
            family_user_id=family.id,
            relationship='Son',
            is_primary_contact=True,
            emergency_contact=True
        )
        session.add(family_link)
        session.commit()
        print("✅ Created family link")
        
        # 4. Assign caregiver to 4 patients
        for i in range(4):
            assignment = CaregiverAssignment(
                patient_id=patients[i].id,
                caregiver_id=caregiver.id,
                assigned_by=clinician.id,
                assigned_at=datetime.utcnow() - timedelta(days=random.randint(10, 60)),
                active=True
            )
            session.add(assignment)
        session.commit()
        print("✅ Created caregiver assignments")
        
        # 5. Create 30 days of vitals for each patient
        print("📊 Creating vitals history...")
        # All temperature values in CELSIUS
        vitals_scenarios = {
            'stable':       {'hr': (65, 85),   'bp_sys': (110, 130), 'bp_dia': (70, 85), 'o2': (94, 98), 'temp': (36.4, 37.2)},
            'moderate':     {'hr': (75, 95),   'bp_sys': (100, 120), 'bp_dia': (65, 80), 'o2': (90, 95), 'temp': (36.5, 37.4)},
            'deteriorating':{'hr': (85, 110),  'bp_sys': (90, 115),  'bp_dia': (60, 75), 'o2': (86, 92), 'temp': (36.8, 38.2)},
            'crisis':       {'hr': (100, 130), 'bp_sys': (80, 100),  'bp_dia': (50, 65), 'o2': (80, 88), 'temp': (37.5, 39.0)},
        }
        
        for i, patient in enumerate(patients):
            scenario = patients_data[i]['scenario']
            ranges = vitals_scenarios[scenario]
            
            for day in range(30):
                timestamp = datetime.utcnow() - timedelta(days=30-day, hours=random.randint(8, 18))
                vital = Vital(
                    patient_id=patient.id,
                    recorded_by=clinician.id,
                    recorded_at=timestamp,
                    heart_rate=random.uniform(*ranges['hr']),
                    blood_pressure_sys=random.uniform(*ranges['bp_sys']),
                    blood_pressure_dia=random.uniform(*ranges['bp_dia']),
                    oxygen_saturation=random.uniform(*ranges['o2']),
                    temperature=random.uniform(*ranges['temp']),
                    respiratory_rate=random.uniform(12, 22),
                    source='manual'
                )
                session.add(vital)
        
        session.commit()
        print(f"✅ Created {30 * len(patients)} vital records")
        
        # 6. Create 30 days of symptoms for each patient
        print("🤒 Creating symptoms history...")
        symptom_scenarios = {
            'stable': {'pain': (1, 4), 'fatigue': 0.2, 'nausea': 0.1, 'anxiety': 0.2},
            'moderate': {'pain': (3, 6), 'fatigue': 0.5, 'nausea': 0.3, 'anxiety': 0.4},
            'deteriorating': {'pain': (5, 8), 'fatigue': 0.7, 'nausea': 0.5, 'anxiety': 0.6},
            'crisis': {'pain': (7, 10), 'fatigue': 0.9, 'nausea': 0.7, 'anxiety': 0.8},
        }
        
        for i, patient in enumerate(patients):
            scenario = patients_data[i]['scenario']
            ranges = symptom_scenarios[scenario]
            
            for day in range(30):
                timestamp = datetime.utcnow() - timedelta(days=30-day, hours=random.randint(8, 18))
                symptom = Symptom(
                    patient_id=patient.id,
                    recorded_by=clinician.id,
                    recorded_at=timestamp,
                    pain_level=random.randint(*ranges['pain']),
                    pain_location=random.choice(['Chest', 'Abdomen', 'Lower Back', 'Generalized']),
                    fatigue=random.random() < ranges['fatigue'],
                    fatigue_level=random.randint(0, 10) if random.random() < ranges['fatigue'] else 0,
                    nausea=random.random() < ranges['nausea'],
                    nausea_level=random.randint(0, 10) if random.random() < ranges['nausea'] else 0,
                    anxiety=random.random() < ranges['anxiety'],
                    anxiety_level=random.randint(0, 10) if random.random() < ranges['anxiety'] else 0,
                    depression_level=random.randint(2, 8),
                    appetite_level=random.randint(3, 8),
                    sleep_quality=random.randint(3, 8),
                    breathlessness=random.randint(2, 8),
                )
                session.add(symptom)
        
        session.commit()
        print(f"✅ Created {30 * len(patients)} symptom records")
        
        # 7. Create medications for each patient
        print("💊 Creating medications...")
        ghana_meds = [
            {'name': 'Morphine Sulfate', 'dose': '10mg', 'frequency': 'Twice daily', 'route': 'Oral', 'indication': 'Pain management'},
            {'name': 'Paracetamol', 'dose': '1000mg', 'frequency': 'Four times daily', 'route': 'Oral', 'indication': 'Pain and fever'},
            {'name': 'Ondansetron', 'dose': '4mg', 'frequency': 'As needed', 'route': 'Oral', 'indication': 'Nausea and vomiting'},
            {'name': 'Lorazepam', 'dose': '0.5mg', 'frequency': 'As needed', 'route': 'Sublingual', 'indication': 'Anxiety'},
            {'name': 'Dexamethasone', 'dose': '4mg', 'frequency': 'Once daily', 'route': 'Oral', 'indication': 'Inflammation and appetite'},
            {'name': 'Lactulose', 'dose': '15ml', 'frequency': 'Twice daily', 'route': 'Oral', 'indication': 'Constipation'},
        ]
        
        for patient in patients:
            num_meds = random.randint(2, 4)
            for med_data in random.sample(ghana_meds, num_meds):
                medication = Medication(
                    patient_id=patient.id,
                    prescribed_by=clinician.id,
                    name=med_data['name'],
                    dose=med_data['dose'],
                    frequency=med_data['frequency'],
                    route=med_data['route'],
                    indication=med_data['indication'],
                    start_date=datetime.utcnow() - timedelta(days=random.randint(7, 90)),
                    is_active=True,
                    is_prn='As needed' in med_data['frequency']
                )
                session.add(medication)
        
        session.commit()
        print("✅ Created medications")
        
        # 8. Create 3 appointments per patient
        print("📅 Creating appointments...")
        for patient in patients:
            for i in range(3):
                appointment = Appointment(
                    patient_id=patient.id,
                    clinician_id=clinician.id,
                    created_by=clinician.id,
                    appointment_type=random.choice(['Clinical Review', 'Medication Review', 'Home Visit', 'Family Meeting']),
                    scheduled_at=datetime.utcnow() + timedelta(days=random.randint(1, 30)),
                    duration_minutes=30,
                    location=random.choice(['Hospital', 'Home']),
                    location_detail=random.choice(['Korle Bu Teaching Hospital', 'Ridge Hospital', 'Patient Home']),
                    status='scheduled'
                )
                session.add(appointment)
        
        session.commit()
        print("✅ Created appointments")
        
        # 9. Create care plans
        print("📋 Creating care plans...")
        for patient in patients:
            care_plan = CarePlan(
                patient_id=patient.id,
                created_by=clinician.id,
                goals_of_care='Optimize comfort, maintain dignity, support family through care journey',
                pain_management_plan='WHO Pain Ladder approach with regular morphine and PRN breakthrough medication',
                psychological_support='Weekly counseling sessions, anxiety management with medication as needed',
                spiritual_care='Chaplaincy support, respect for religious preferences',
                family_support_plan='Regular family meetings, caregiver education, bereavement preparation',
                review_date=datetime.utcnow() + timedelta(days=14)
            )
            session.add(care_plan)
        
        session.commit()
        print("✅ Created care plans")
        
        # 10. Create predictions for each patient
        print("🤖 Creating AI predictions...")
        pathway_map = {
            'stable': 'home_hospice_care',
            'moderate': 'palliative_care_standard',
            'deteriorating': 'inpatient_hospice',
            'crisis': 'crisis_intervention'
        }
        risk_map = {
            'stable': (0.15, 0.30, 'Low'),
            'moderate': (0.40, 0.55, 'Medium'),
            'deteriorating': (0.65, 0.75, 'High'),
            'crisis': (0.82, 0.95, 'Crisis')
        }
        
        for i, patient in enumerate(patients):
            scenario = patients_data[i]['scenario']
            pathway = pathway_map[scenario]
            risk_min, risk_max, risk_level = risk_map[scenario]
            risk_score = random.uniform(risk_min, risk_max)
            
            prediction = Prediction(
                patient_id=patient.id,
                predicted_at=datetime.utcnow(),
                care_pathway=pathway,
                risk_score=risk_score,
                risk_level=risk_level,
                confidence=random.uniform(0.85, 0.98),
                shap_values='{}',
                feature_values='{}',
                plain_explanation=f'Patient assessed as {risk_level} risk based on current vitals and symptoms.',
                triggered_by='manual'
            )
            session.add(prediction)
            
            # Update patient risk
            patient.risk_score = risk_score
            patient.risk_level = risk_level
            patient.care_pathway = pathway
            patient.last_assessment = datetime.utcnow()
        
        session.commit()
        print("✅ Created predictions")
        
        # 11. Create some alerts
        print("🚨 Creating alerts...")
        crisis_patients = [p for i, p in enumerate(patients) if patients_data[i]['scenario'] == 'crisis']
        for patient in crisis_patients:
            alert = Alert(
                patient_id=patient.id,
                alert_type='high_risk_score',
                severity='crisis',
                triggered_value=f'Risk Score: {int(patient.risk_score * 100)}%',
                threshold_value='Threshold: 78%',
                message=f'AI model predicts crisis-level risk for {patient.full_name}',
                is_acknowledged=False
            )
            session.add(alert)
        
        session.commit()
        print("✅ Created alerts")
        
        # 12. Create sample bereavement entries
        print("💜 Creating bereavement entries...")
        memory = BereavementEntry(
            patient_id=patients[0].id,
            user_id=family.id,
            entry_type='memory',
            content='I remember how he loved to sit in the garden every morning with his tea.',
            is_private=False,
            sentiment_score=0.3
        )
        session.add(memory)
        session.commit()
        print("✅ Created bereavement entries")
        
        # 13. Create audit logs
        print("📝 Creating audit logs...")
        for user in [admin, clinician, caregiver, patient_user, family]:
            log = AuditLog(
                user_id=user.id,
                user_role=user.role,
                action='login_success',
                resource_type='user',
                resource_id=user.id,
                success=True
            )
            session.add(log)
        session.commit()
        print("✅ Created audit logs")
        
        print("\n🎉 DATABASE SEEDING COMPLETE!")
        print(f"✅ 5 users created")
        print(f"✅ 8 patients created")
        print(f"✅ {30 * 8} vitals created")
        print(f"✅ {30 * 8} symptoms created")
        print(f"✅ Medications, appointments, care plans created")
        print(f"✅ Predictions and alerts created")
        print("\n👤 LOGIN CREDENTIALS:")
        print("  Admin:      admin / admin123")
        print("  Clinician:  clinician / clinician123")
        print("  Caregiver:  caregiver / caregiver123")
        print("  Patient:    patient / patient123")
        print("  Family:     family / family123")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()


if __name__ == '__main__':
    seed_database()
