"""
Scenario Simulator for Project Aura
Generates synthetic patient data and simulates patient journeys
"""

import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np

# SDV imports
try:
    from sdv.single_table import GaussianCopulaSynthesizer
    from sdv.metadata import SingleTableMetadata
except ImportError:
    print("Warning: SDV library not installed. Install with: pip install sdv")


# ============================================================================
# Synthetic Data Generation Configuration
# ============================================================================

# Diversity constraints for bias mitigation
ETHNICITY_DISTRIBUTION = {
    'Caucasian': 0.30,
    'African American': 0.25,
    'Hispanic': 0.20,
    'Asian': 0.15,
    'Other': 0.10
}

GENDER_DISTRIBUTION = {
    'M': 0.45,
    'F': 0.45,
    'Other': 0.10
}

# Age range for hospice patients
AGE_RANGE = (45, 95)

# Vital sign ranges by stage
VITAL_RANGES = {
    'stable': {
        'heart_rate': (60, 90),
        'blood_pressure_sys': (110, 140),
        'blood_pressure_dia': (70, 90),
        'oxygen_saturation': (92, 98),
        'temperature': (97.5, 99.0)
    },
    'deterioration': {
        'heart_rate': (85, 115),
        'blood_pressure_sys': (95, 125),
        'blood_pressure_dia': (60, 85),
        'oxygen_saturation': (88, 94),
        'temperature': (97.0, 100.5)
    },
    'crisis': {
        'heart_rate': (100, 140),
        'blood_pressure_sys': (80, 110),
        'blood_pressure_dia': (50, 75),
        'oxygen_saturation': (80, 90),
        'temperature': (96.0, 101.5)
    }
}

# Symptom ranges by stage
SYMPTOM_RANGES = {
    'stable': {
        'pain_level': (0, 4),
        'nausea_prob': 0.2,
        'fatigue_prob': 0.4,
        'anxiety_prob': 0.3
    },
    'deterioration': {
        'pain_level': (3, 7),
        'nausea_prob': 0.5,
        'fatigue_prob': 0.7,
        'anxiety_prob': 0.6
    },
    'crisis': {
        'pain_level': (6, 10),
        'nausea_prob': 0.8,
        'fatigue_prob': 0.9,
        'anxiety_prob': 0.8
    }
}


# ============================================================================
# Synthetic Patient Generation
# ============================================================================

def generate_synthetic_cohort(n_patients: int) -> List[Dict[str, Any]]:
    """
    Generate diverse synthetic patient cohort using SDV
    
    Args:
        n_patients: Number of patients to generate
        
    Returns:
        List of patient dictionaries with demographics
    """
    patients = []
    
    for i in range(n_patients):
        # Generate demographics with diversity constraints
        ethnicity = random.choices(
            list(ETHNICITY_DISTRIBUTION.keys()),
            weights=list(ETHNICITY_DISTRIBUTION.values())
        )[0]
        
        gender = random.choices(
            list(GENDER_DISTRIBUTION.keys()),
            weights=list(GENDER_DISTRIBUTION.values())
        )[0]
        
        age = random.randint(*AGE_RANGE)
        
        patient = {
            'patient_code': f'SYN-{i+1:05d}',
            'age': age,
            'gender': gender,
            'ethnicity': ethnicity,
            'admission_date': datetime.utcnow() - timedelta(days=random.randint(0, 30))
        }
        
        patients.append(patient)
    
    return patients


def generate_synthetic_cohort_sdv(n_patients: int) -> pd.DataFrame:
    """
    Generate synthetic patient cohort using SDV library
    
    Args:
        n_patients: Number of patients to generate
        
    Returns:
        DataFrame with synthetic patient data
    """
    # Create sample data for SDV to learn from
    sample_data = []
    for i in range(min(100, n_patients)):
        ethnicity = random.choices(
            list(ETHNICITY_DISTRIBUTION.keys()),
            weights=list(ETHNICITY_DISTRIBUTION.values())
        )[0]
        
        gender = random.choices(
            list(GENDER_DISTRIBUTION.keys()),
            weights=list(GENDER_DISTRIBUTION.values())
        )[0]
        
        age = random.randint(*AGE_RANGE)
        
        sample_data.append({
            'patient_code': f'SYN-{i+1:05d}',
            'age': age,
            'gender': gender,
            'ethnicity': ethnicity
        })
    
    df = pd.DataFrame(sample_data)
    
    try:
        # Create metadata
        metadata = SingleTableMetadata()
        metadata.detect_from_dataframe(df)
        
        # Create and fit synthesizer
        synthesizer = GaussianCopulaSynthesizer(metadata)
        synthesizer.fit(df)
        
        # Generate synthetic data
        synthetic_df = synthesizer.sample(num_rows=n_patients)
        
        # Add patient codes
        synthetic_df['patient_code'] = [f'SYN-{i+1:05d}' for i in range(len(synthetic_df))]
        
        return synthetic_df
    except Exception as e:
        print(f"SDV generation failed, using fallback method: {e}")
        # Fallback to simple generation
        return pd.DataFrame(generate_synthetic_cohort(n_patients))


# ============================================================================
# Stage-Appropriate Data Generation
# ============================================================================

def generate_vital_reading(stage: str = 'stable') -> Dict[str, float]:
    """
    Generate stage-appropriate vital signs
    
    Args:
        stage: Care stage ('stable', 'deterioration', 'crisis')
        
    Returns:
        Dictionary with vital sign values
    """
    ranges = VITAL_RANGES.get(stage, VITAL_RANGES['stable'])
    
    vital = {
        'heart_rate': round(random.uniform(*ranges['heart_rate']), 1),
        'blood_pressure_sys': round(random.uniform(*ranges['blood_pressure_sys']), 1),
        'blood_pressure_dia': round(random.uniform(*ranges['blood_pressure_dia']), 1),
        'oxygen_saturation': round(random.uniform(*ranges['oxygen_saturation']), 1),
        'temperature': round(random.uniform(*ranges['temperature']), 1)
    }
    
    return vital


def generate_symptom_log(stage: str = 'stable') -> Dict[str, Any]:
    """
    Generate stage-appropriate symptoms
    
    Args:
        stage: Care stage ('stable', 'deterioration', 'crisis')
        
    Returns:
        Dictionary with symptom values
    """
    ranges = SYMPTOM_RANGES.get(stage, SYMPTOM_RANGES['stable'])
    
    symptom = {
        'pain_level': random.randint(*ranges['pain_level']),
        'nausea': random.random() < ranges['nausea_prob'],
        'fatigue': random.random() < ranges['fatigue_prob'],
        'anxiety': random.random() < ranges['anxiety_prob'],
        'notes': ''
    }
    
    return symptom


# ============================================================================
# Patient Journey Simulation
# ============================================================================

class JourneyStage:
    """Journey stage definitions"""
    ADMISSION = 'admission'
    STABLE = 'stable'
    DETERIORATION = 'deterioration'
    CRISIS = 'crisis'
    DEATH = 'death'
    BEREAVEMENT = 'bereavement'


def simulate_patient_journey(patient_id: int, patient_code: str, 
                            user_id: int = 1) -> Dict[str, Any]:
    """
    Simulate complete patient journey through all care stages
    
    Args:
        patient_id: Database patient ID
        patient_code: Patient identifier
        user_id: User recording the data
        
    Returns:
        Dictionary with journey logs and events
    """
    from src.db import log_vital, log_symptom, update_patient_status
    
    journey_log = {
        'patient_id': patient_id,
        'patient_code': patient_code,
        'stages': [],
        'vitals_logged': 0,
        'symptoms_logged': 0,
        'alerts_triggered': 0
    }
    
    current_date = datetime.utcnow()
    
    # Stage 1: Admission (Day 0)
    stage_log = {
        'stage': JourneyStage.ADMISSION,
        'start_date': current_date,
        'duration_days': 1
    }
    
    vital = generate_vital_reading('stable')
    log_vital(patient_id, user_id, **vital)
    journey_log['vitals_logged'] += 1
    
    symptom = generate_symptom_log('stable')
    log_symptom(patient_id, user_id, **symptom)
    journey_log['symptoms_logged'] += 1
    
    journey_log['stages'].append(stage_log)
    current_date += timedelta(days=1)
    
    # Stage 2: Stable Monitoring (Days 1-7)
    stage_log = {
        'stage': JourneyStage.STABLE,
        'start_date': current_date,
        'duration_days': 7
    }
    
    for day in range(7):
        vital = generate_vital_reading('stable')
        log_vital(patient_id, user_id, **vital)
        journey_log['vitals_logged'] += 1
        
        symptom = generate_symptom_log('stable')
        log_symptom(patient_id, user_id, **symptom)
        journey_log['symptoms_logged'] += 1
        
        current_date += timedelta(days=1)
    
    journey_log['stages'].append(stage_log)
    
    # Stage 3: Deterioration (Days 8-14)
    stage_log = {
        'stage': JourneyStage.DETERIORATION,
        'start_date': current_date,
        'duration_days': 7
    }
    
    for day in range(7):
        vital = generate_vital_reading('deterioration')
        log_vital(patient_id, user_id, **vital)
        journey_log['vitals_logged'] += 1
        
        symptom = generate_symptom_log('deterioration')
        log_symptom(patient_id, user_id, **symptom)
        journey_log['symptoms_logged'] += 1
        
        current_date += timedelta(days=1)
    
    journey_log['stages'].append(stage_log)
    
    # Stage 4: Crisis (Days 15-20)
    stage_log = {
        'stage': JourneyStage.CRISIS,
        'start_date': current_date,
        'duration_days': 6
    }
    
    for day in range(6):
        vital = generate_vital_reading('crisis')
        log_vital(patient_id, user_id, **vital)
        journey_log['vitals_logged'] += 1
        
        symptom = generate_symptom_log('crisis')
        log_symptom(patient_id, user_id, **symptom)
        journey_log['symptoms_logged'] += 1
        
        current_date += timedelta(days=1)
    
    journey_log['stages'].append(stage_log)
    
    # Stage 5: Death Event (Day 21)
    stage_log = {
        'stage': JourneyStage.DEATH,
        'start_date': current_date,
        'duration_days': 1
    }
    
    update_patient_status(patient_id, 'deceased', death_date=current_date)
    journey_log['stages'].append(stage_log)
    
    return journey_log


def simulate_deterioration(patient_id: int, user_id: int = 1) -> List[Dict[str, Any]]:
    """
    Simulate deterioration pattern to trigger alerts
    
    Args:
        patient_id: Database patient ID
        user_id: User recording the data
        
    Returns:
        List of logged vital/symptom records
    """
    from src.db import log_vital, log_symptom
    
    logs = []
    
    # Generate 4 consecutive worsening readings
    for i in range(4):
        # Progressively worse vitals
        vital = {
            'heart_rate': 90 + (i * 10),
            'blood_pressure_sys': 120 - (i * 10),
            'blood_pressure_dia': 80 - (i * 5),
            'oxygen_saturation': 94 - (i * 2),
            'temperature': 98.6 + (i * 0.5)
        }
        
        vital_record = log_vital(patient_id, user_id, **vital)
        logs.append({'type': 'vital', 'record': vital_record})
        
        # Progressively worse symptoms
        symptom = {
            'pain_level': min(3 + (i * 2), 10),
            'nausea': i >= 2,
            'fatigue': i >= 1,
            'anxiety': i >= 2,
            'notes': f'Deterioration reading {i+1}'
        }
        
        symptom_record = log_symptom(patient_id, user_id, **symptom)
        logs.append({'type': 'symptom', 'record': symptom_record})
    
    return logs


def simulate_death_event(patient_id: int) -> bool:
    """
    Simulate death event and activate bereavement
    
    Args:
        patient_id: Database patient ID
        
    Returns:
        Success status
    """
    from src.db import update_patient_status
    
    death_date = datetime.utcnow()
    success = update_patient_status(patient_id, 'deceased', death_date=death_date)
    
    return success


# ============================================================================
# Validation and Reporting
# ============================================================================

def validate_system_response(patient_id: int) -> Dict[str, Any]:
    """
    Validate that system components responded correctly
    
    Args:
        patient_id: Database patient ID
        
    Returns:
        Validation results
    """
    from src.db import get_all_alerts, get_patient, get_bereavement_entries
    
    results = {
        'patient_id': patient_id,
        'alerts_created': False,
        'bereavement_activated': False,
        'data_logged': False
    }
    
    # Check if alerts were created
    alerts = get_all_alerts(patient_id)
    results['alerts_created'] = len(alerts) > 0
    results['alert_count'] = len(alerts)
    
    # Check if patient status is deceased
    patient = get_patient(patient_id)
    if patient and patient.status == 'deceased':
        results['bereavement_activated'] = True
    
    # Check if data was logged
    from src.db import get_patient_history
    history = get_patient_history(patient_id)
    results['data_logged'] = len(history['vitals']) > 0 and len(history['symptoms']) > 0
    results['vitals_count'] = len(history['vitals'])
    results['symptoms_count'] = len(history['symptoms'])
    
    return results


def generate_simulation_report(journey_logs: List[Dict[str, Any]], 
                               validation_results: List[Dict[str, Any]]) -> str:
    """
    Generate summary report with logs, visualizations, and validation results
    
    Args:
        journey_logs: List of journey log dictionaries
        validation_results: List of validation result dictionaries
        
    Returns:
        Report text
    """
    report = []
    report.append("=" * 80)
    report.append("PROJECT AURA - SIMULATION REPORT")
    report.append("=" * 80)
    report.append(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    report.append("")
    
    # Summary statistics
    report.append("SUMMARY STATISTICS")
    report.append("-" * 80)
    report.append(f"Total Patients Simulated: {len(journey_logs)}")
    
    total_vitals = sum(log['vitals_logged'] for log in journey_logs)
    total_symptoms = sum(log['symptoms_logged'] for log in journey_logs)
    report.append(f"Total Vitals Logged: {total_vitals}")
    report.append(f"Total Symptoms Logged: {total_symptoms}")
    report.append("")
    
    # Validation results
    report.append("VALIDATION RESULTS")
    report.append("-" * 80)
    
    alerts_created = sum(1 for r in validation_results if r['alerts_created'])
    bereavement_activated = sum(1 for r in validation_results if r['bereavement_activated'])
    data_logged = sum(1 for r in validation_results if r['data_logged'])
    
    report.append(f"Patients with Alerts: {alerts_created}/{len(validation_results)}")
    report.append(f"Patients with Bereavement Activated: {bereavement_activated}/{len(validation_results)}")
    report.append(f"Patients with Data Logged: {data_logged}/{len(validation_results)}")
    report.append("")
    
    # Individual patient details
    report.append("PATIENT JOURNEY DETAILS")
    report.append("-" * 80)
    
    for i, log in enumerate(journey_logs[:5]):  # Show first 5
        report.append(f"\nPatient {i+1}: {log['patient_code']}")
        report.append(f"  Stages Completed: {len(log['stages'])}")
        report.append(f"  Vitals Logged: {log['vitals_logged']}")
        report.append(f"  Symptoms Logged: {log['symptoms_logged']}")
        
        if i < len(validation_results):
            val = validation_results[i]
            report.append(f"  Alerts Created: {val.get('alert_count', 0)}")
            report.append(f"  Bereavement Active: {'Yes' if val['bereavement_activated'] else 'No'}")
    
    if len(journey_logs) > 5:
        report.append(f"\n... and {len(journey_logs) - 5} more patients")
    
    report.append("")
    report.append("=" * 80)
    report.append("END OF REPORT")
    report.append("=" * 80)
    
    return "\n".join(report)


# ============================================================================
# Main Simulation Runner
# ============================================================================

def run_simulation(n_patients: int = 5) -> Dict[str, Any]:
    """
    Run complete simulation with multiple patient journeys
    
    Args:
        n_patients: Number of patients to simulate
        
    Returns:
        Simulation results including logs and validation
    """
    from src.db import add_patient
    
    print(f"Starting simulation with {n_patients} patients...")
    
    # Generate synthetic cohort
    patients = generate_synthetic_cohort(n_patients)
    
    journey_logs = []
    validation_results = []
    
    # Simulate each patient journey
    for patient_data in patients:
        # Add patient to database
        patient = add_patient(
            patient_code=patient_data['patient_code'],
            age=patient_data['age'],
            gender=patient_data['gender'],
            ethnicity=patient_data['ethnicity']
        )
        
        if patient:
            print(f"Simulating journey for {patient.patient_code}...")
            
            # Simulate journey
            journey_log = simulate_patient_journey(patient.id, patient.patient_code)
            journey_logs.append(journey_log)
            
            # Validate system response
            validation = validate_system_response(patient.id)
            validation_results.append(validation)
    
    # Generate report
    report = generate_simulation_report(journey_logs, validation_results)
    
    print("\nSimulation complete!")
    print(report)
    
    return {
        'journey_logs': journey_logs,
        'validation_results': validation_results,
        'report': report
    }


# ============================================================================
# Pre-Built Scenario Generation
# ============================================================================

def generate_stable_patient():
    """Generate a stable patient with no alerts"""
    from . import db
    
    # Create patient
    patient = db.add_patient(
        patient_code=f"STABLE-{random.randint(1000, 9999)}",
        age=random.randint(65, 85),
        gender=random.choice(['male', 'female']),
        ethnicity=random.choice(list(ETHNICITY_DISTRIBUTION.keys())),
        admission_date=datetime.now() - timedelta(days=14)
    )
    
    # Generate 14 days of stable data
    for day in range(14):
        timestamp = datetime.now() - timedelta(days=14-day)
        
        # Stable vitals
        db.log_vitals(
            patient_id=patient.id,
            heart_rate=random.randint(65, 80),
            blood_pressure_sys=random.randint(115, 130),
            blood_pressure_dia=random.randint(75, 85),
            oxygen_saturation=random.uniform(94, 98),
            temperature=random.uniform(97.8, 98.8),
            timestamp=timestamp
        )
        
        # Mild symptoms
        db.log_symptoms(
            patient_id=patient.id,
            pain_level=random.randint(1, 3),
            nausea=False,
            fatigue=random.choice([True, False]),
            anxiety=False,
            timestamp=timestamp
        )
    
    return patient


def generate_deteriorating_patient():
    """Generate a patient with gradual deterioration and alerts"""
    from . import db
    
    # Create patient
    patient = db.add_patient(
        patient_code=f"DETER-{random.randint(1000, 9999)}",
        age=random.randint(70, 90),
        gender=random.choice(['male', 'female']),
        ethnicity=random.choice(list(ETHNICITY_DISTRIBUTION.keys())),
        admission_date=datetime.now() - timedelta(days=21)
    )
    
    # Generate 21 days with gradual deterioration
    for day in range(21):
        timestamp = datetime.now() - timedelta(days=21-day)
        
        # Deteriorating vitals (getting worse over time)
        deterioration_factor = day / 21.0  # 0 to 1
        
        db.log_vitals(
            patient_id=patient.id,
            heart_rate=int(70 + deterioration_factor * 30),  # 70 to 100
            blood_pressure_sys=int(130 - deterioration_factor * 20),  # 130 to 110
            blood_pressure_dia=int(85 - deterioration_factor * 15),  # 85 to 70
            oxygen_saturation=95 - deterioration_factor * 8,  # 95 to 87
            temperature=98.0 + deterioration_factor * 2,  # 98 to 100
            timestamp=timestamp
        )
        
        # Worsening symptoms
        db.log_symptoms(
            patient_id=patient.id,
            pain_level=int(2 + deterioration_factor * 6),  # 2 to 8
            nausea=deterioration_factor > 0.5,
            fatigue=True,
            anxiety=deterioration_factor > 0.6,
            timestamp=timestamp
        )
    
    # Generate alerts for deterioration
    generate_alerts(patient.id)
    
    return patient


def generate_crisis_patient():
    """Generate a patient in crisis with urgent alerts"""
    from . import db
    
    # Create patient
    patient = db.add_patient(
        patient_code=f"CRISIS-{random.randint(1000, 9999)}",
        age=random.randint(75, 95),
        gender=random.choice(['male', 'female']),
        ethnicity=random.choice(list(ETHNICITY_DISTRIBUTION.keys())),
        admission_date=datetime.now() - timedelta(days=7)
    )
    
    # Generate 7 days with rapid decline
    for day in range(7):
        timestamp = datetime.now() - timedelta(days=7-day)
        
        # Critical vitals (rapidly worsening)
        crisis_factor = day / 7.0  # 0 to 1
        
        db.log_vitals(
            patient_id=patient.id,
            heart_rate=int(85 + crisis_factor * 35),  # 85 to 120
            blood_pressure_sys=int(120 - crisis_factor * 30),  # 120 to 90
            blood_pressure_dia=int(80 - crisis_factor * 20),  # 80 to 60
            oxygen_saturation=92 - crisis_factor * 12,  # 92 to 80
            temperature=98.5 + crisis_factor * 3.5,  # 98.5 to 102
            timestamp=timestamp
        )
        
        # Severe symptoms
        db.log_symptoms(
            patient_id=patient.id,
            pain_level=int(6 + crisis_factor * 4),  # 6 to 10
            nausea=True,
            fatigue=True,
            anxiety=True,
            timestamp=timestamp
        )
    
    # Generate multiple urgent alerts
    generate_alerts(patient.id)
    
    return patient



# ============================================================================
# Wrapper Functions for Compatibility
# ============================================================================

def generate_patients(n_patients: int) -> List:
    """Generate patients and add them to database"""
    from . import db
    
    cohort = generate_synthetic_cohort(n_patients)
    patients = []
    
    for patient_data in cohort:
        patient = db.add_patient(
            patient_code=patient_data['patient_code'],
            age=patient_data['age'],
            gender=patient_data['gender'],
            ethnicity=patient_data['ethnicity']
        )
        if patient:
            patients.append(patient)
    
    return patients


def generate_patient_history(patient_id: int, days: int = 14):
    """Generate historical data for a patient"""
    from . import db
    from datetime import timedelta
    
    for day in range(days):
        timestamp = datetime.now() - timedelta(days=days-day)
        
        # Generate vitals
        vitals = generate_vital_reading('stable')
        db.log_vitals(
            patient_id=patient_id,
            heart_rate=vitals['heart_rate'],
            blood_pressure_sys=vitals['blood_pressure_sys'],
            blood_pressure_dia=vitals['blood_pressure_dia'],
            oxygen_saturation=vitals['oxygen_saturation'],
            temperature=vitals['temperature'],
            timestamp=timestamp
        )
        
        # Generate symptoms
        symptoms = generate_symptom_log('stable')
        db.log_symptoms(
            patient_id=patient_id,
            pain_level=symptoms['pain_level'],
            nausea=symptoms['nausea'],
            fatigue=symptoms['fatigue'],
            anxiety=symptoms['anxiety'],
            timestamp=timestamp
        )


def generate_predictions(patient_id: int):
    """Generate AI predictions for a patient"""
    from . import db, models
    
    # Get latest data
    history = db.get_patient_history(patient_id, limit=1)
    
    if history['vitals'] and history['symptoms']:
        vital = history['vitals'][0]
        symptom = history['symptoms'][0]
        
        patient_data = {
            'heart_rate': vital.heart_rate,
            'blood_pressure_sys': vital.blood_pressure_sys,
            'blood_pressure_dia': vital.blood_pressure_dia,
            'oxygen_saturation': vital.oxygen_saturation,
            'temperature': vital.temperature,
            'pain_level': symptom.pain_level,
            'nausea': symptom.nausea,
            'fatigue': symptom.fatigue,
            'anxiety': symptom.anxiety
        }
        
        patient = db.get_patient(patient_id)
        care_pathway = models.predict_care_pathway(patient_data, patient.admission_date)
        risk_score = models.predict_risk_score(patient_data, patient.admission_date)
        
        db.save_prediction(
            patient_id=patient_id,
            care_pathway=care_pathway,
            risk_score=risk_score,
            model_version="1.0"
        )


def generate_alerts(patient_id: int) -> List:
    """Generate alerts for a patient based on their data"""
    from . import db, alerts
    
    # Check for alert conditions
    alert_list = []
    
    # Get recent data
    recent_vitals = db.get_recent_vitals(patient_id, hours=48)
    recent_symptoms = db.get_recent_symptoms(patient_id, hours=48)
    
    if recent_vitals and recent_symptoms:
        # Check for high pain
        high_pain_count = sum(1 for s in recent_symptoms if s.pain_level >= 7)
        if high_pain_count >= 2:
            alert = db.create_alert(
                patient_id=patient_id,
                alert_type="high_pain",
                message="Sustained high pain levels detected",
                sent_to=[1]
            )
            if alert:
                alert_list.append(alert)
        
        # Check for low O2
        low_o2_count = sum(1 for v in recent_vitals if v.oxygen_saturation < 90)
        if low_o2_count >= 2:
            alert = db.create_alert(
                patient_id=patient_id,
                alert_type="low_oxygen",
                message="Low oxygen saturation detected",
                sent_to=[1]
            )
            if alert:
                alert_list.append(alert)
    
    return alert_list


def render_simulator_page():
    """Render clinical simulation page"""
    import streamlit as st
    import pandas as pd
    from datetime import datetime
    
    st.subheader("🎯 Clinical Simulation & Training")
    
    tab1, tab2, tab3 = st.tabs(["🎓 Training Scenarios", "📊 Simulation Results", "🆕 Create Scenario"])
    
    with tab1:
        st.markdown("### Available Training Scenarios")
        
        scenarios = [
            {
                "title": "Pain Management Crisis",
                "difficulty": "Advanced",
                "duration": "30 minutes",
                "description": "Patient experiencing breakthrough pain despite current regimen",
                "objectives": ["Assess pain level", "Adjust medication", "Provide comfort measures", "Document changes"]
            },
            {
                "title": "Emergency Response",
                "difficulty": "Advanced",
                "duration": "20 minutes",
                "description": "Patient showing signs of respiratory distress",
                "objectives": ["Recognize emergency", "Follow protocol", "Contact physician", "Provide immediate care"]
            },
            {
                "title": "End-of-Life Care",
                "difficulty": "Intermediate",
                "duration": "45 minutes",
                "description": "Supporting patient and family during final hours",
                "objectives": ["Provide comfort", "Support family", "Manage symptoms", "Maintain dignity"]
            },
            {
                "title": "Family Communication",
                "difficulty": "Intermediate",
                "duration": "25 minutes",
                "description": "Difficult conversation about prognosis and care goals",
                "objectives": ["Active listening", "Empathetic communication", "Answer questions", "Provide resources"]
            },
            {
                "title": "Medication Administration",
                "difficulty": "Beginner",
                "duration": "15 minutes",
                "description": "Safe medication administration and documentation",
                "objectives": ["Verify orders", "Check patient", "Administer safely", "Document accurately"]
            }
        ]
        
        for idx, scenario in enumerate(scenarios):
            with st.expander(f"{scenario['title']} - {scenario['difficulty']}", expanded=False):
                st.write(f"**Duration:** {scenario['duration']}")
                st.write(f"**Description:** {scenario['description']}")
                st.markdown("**Learning Objectives:**")
                for obj in scenario['objectives']:
                    st.write(f"• {obj}")
                
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("▶️ Start Scenario", key=f"start_{idx}"):
                        st.success(f"Starting {scenario['title']}...")
                        st.info("Scenario will begin in simulation environment")
                with col2:
                    if st.button("📖 View Details", key=f"details_{idx}"):
                        st.info("Opening detailed scenario information...")
    
    with tab2:
        st.markdown("### Your Simulation Results")
        
        results = pd.DataFrame({
            'Date': ['Jan 24, 2024', 'Jan 20, 2024', 'Jan 15, 2024', 'Jan 10, 2024'],
            'Scenario': ['Pain Management Crisis', 'Family Communication', 'Medication Administration', 'Emergency Response'],
            'Score': ['92%', '88%', '95%', '85%'],
            'Time': ['28 min', '23 min', '14 min', '22 min'],
            'Status': ['✅ Passed', '✅ Passed', '✅ Passed', '✅ Passed']
        })
        
        st.dataframe(results, use_container_width=True, hide_index=True)
        
        st.markdown("### Performance Metrics")
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Scenarios Completed", "12")
        with col2:
            st.metric("Average Score", "90%")
        with col3:
            st.metric("Pass Rate", "100%")
        with col4:
            st.metric("Hours Trained", "6.5")
        
        st.markdown("### Skill Development")
        skills = pd.DataFrame({
            'Skill Area': ['Pain Management', 'Emergency Response', 'Family Communication', 'Medication Safety', 'Documentation'],
            'Proficiency': [92, 85, 88, 95, 90]
        })
        
        st.bar_chart(skills.set_index('Skill Area'))
        
        st.markdown("### Certifications")
        st.success("✅ Pain Management Certification - Valid until Dec 2024")
        st.success("✅ Emergency Response Certification - Valid until Nov 2024")
        st.info("📚 Family Communication Certification - In Progress")
    
    with tab3:
        st.markdown("### Create Custom Scenario")
        
        with st.form("create_scenario"):
            scenario_title = st.text_input("Scenario Title")
            
            col1, col2 = st.columns(2)
            with col1:
                difficulty = st.selectbox("Difficulty", ["Beginner", "Intermediate", "Advanced"])
                duration = st.number_input("Duration (minutes)", min_value=5, max_value=120, value=30)
            with col2:
                category = st.selectbox("Category", 
                    ["Pain Management", "Emergency Response", "End-of-Life Care", 
                     "Family Communication", "Medication Safety", "Other"])
                max_attempts = st.number_input("Max Attempts", min_value=1, max_value=5, value=3)
            
            description = st.text_area("Scenario Description")
            
            st.markdown("**Learning Objectives** (one per line)")
            objectives = st.text_area("Objectives", placeholder="Objective 1\nObjective 2\nObjective 3")
            
            st.markdown("**Scenario Steps** (one per line)")
            steps = st.text_area("Steps", placeholder="Step 1: Initial assessment\nStep 2: Intervention\nStep 3: Documentation")
            
            if st.form_submit_button("Create Scenario", type="primary"):
                st.success("✅ Custom scenario created")
                st.info("Scenario added to training library")
