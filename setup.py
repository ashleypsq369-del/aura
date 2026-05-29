"""
Setup script for Project Aura
Initializes database, creates demo users, and generates initial data
"""

import sys
sys.path.insert(0, 'src')

from src.db import init_database, add_user, add_patient
from src.simulator import generate_synthetic_cohort, run_simulation
from src.models import generate_training_data, train_models
import os

def setup():
    print("=" * 60)
    print("PROJECT AURA - SETUP")
    print("=" * 60)
    
    # Initialize database
    print("\n1. Initializing database...")
    init_database()
    print("    Database initialized")
    
    # Create demo users
    print("\n2. Creating demo users...")
    try:
        add_user("clinician", "demo123", "clinician", "clinician@demo.com")
        add_user("family", "demo123", "family", "family@demo.com")
        print("    Demo users created")
        print("     - Clinician: username='clinician', password='demo123'")
        print("     - Family: username='family', password='demo123'")
    except Exception as e:
        print(f"    Users may already exist: {e}")
    
    # Generate synthetic patients
    print("\n3. Generating synthetic patients...")
    patients = generate_synthetic_cohort(10)
    for patient_data in patients:
        add_patient(
            patient_code=patient_data['patient_code'],
            age=patient_data['age'],
            gender=patient_data['gender'],
            ethnicity=patient_data['ethnicity']
        )
    print(f"   ✓ Created {len(patients)} synthetic patients")
    
    # Generate training data and train models
    print("\n4. Training AI models...")
    try:
        training_data = generate_training_data(n_samples=500)
        results = train_models(training_data)
        print(f"    Models trained successfully")
        print(f"     - Care Pathway Accuracy: {results['pathway_accuracy']:.3f}")
        print(f"     - Risk Score MSE: {results['risk_mse']:.3f}")
    except Exception as e:
        print(f"    Model training failed: {e}")
        print("     You can train models later using the models module")
    
    # Run initial simulation
    print("\n5. Running initial simulation...")
    try:
        run_simulation(n_patients=3)
        print("    Simulation complete")
    except Exception as e:
        print(f"    Simulation failed: {e}")
    
    print("\n" + "=" * 60)
    print("SETUP COMPLETE!")
    print("=" * 60)
    print("\nTo start the application:")
    print("  streamlit run app.py")
    print("\nDemo credentials:")
    print("  Clinician - username: clinician, password: demo123")
    print("  Family    - username: family, password: demo123")
    print("=" * 60)

if __name__ == "__main__":
    setup()
