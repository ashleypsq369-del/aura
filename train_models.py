"""
Training Script for Project Aura XAI Models
Generates synthetic training data and trains XGBoost models with SHAP
"""

import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src import models, db

def main():
    """Main training function"""
    print("=" * 80)
    print("PROJECT AURA - MODEL TRAINING")
    print("=" * 80)
    print()
    
    # Initialize database
    print("Initializing database...")
    db.init_database()
    print("Database initialized")
    print()
    
    # Generate synthetic training data
    print("Generating synthetic training data...")
    n_samples = 1000
    training_data = models.generate_training_data(n_samples)
    print(f"Generated {len(training_data)} training samples")
    print()
    
    # Display data summary
    print("Training Data Summary:")
    print("-" * 80)
    print(f"Features: {', '.join(models.FEATURE_NAMES)}")
    print(f"Care Pathways: {training_data['care_pathway'].value_counts().to_dict()}")
    print(f"Risk Score Range: [{training_data['risk_score'].min():.3f}, {training_data['risk_score'].max():.3f}]")
    print()
    
    # Train models
    print("Training XGBoost models...")
    print("-" * 80)
    results = models.train_models(training_data)
    print()
    
    # Display results
    print("Training Results:")
    print("-" * 80)
    print(f"Care Pathway Classifier Accuracy: {results['pathway_accuracy']:.3f}")
    print(f"Risk Score Regressor MSE: {results['risk_mse']:.3f}")
    print()
    
    # Test predictions
    print("Testing Predictions:")
    print("-" * 80)
    
    test_cases = [
        {
            "name": "Stable Patient",
            "data": {
                "pain_level": 2,
                "heart_rate": 70.0,
                "blood_pressure_sys": 120.0,
                "blood_pressure_dia": 80.0,
                "oxygen_saturation": 97.0,
                "temperature": 98.6,
                "fatigue": False,
                "nausea": False,
                "anxiety": False
            }
        },
        {
            "name": "Deteriorating Patient",
            "data": {
                "pain_level": 6,
                "heart_rate": 95.0,
                "blood_pressure_sys": 105.0,
                "blood_pressure_dia": 70.0,
                "oxygen_saturation": 90.0,
                "temperature": 99.5,
                "fatigue": True,
                "nausea": True,
                "anxiety": True
            }
        },
        {
            "name": "Crisis Patient",
            "data": {
                "pain_level": 9,
                "heart_rate": 130.0,
                "blood_pressure_sys": 90.0,
                "blood_pressure_dia": 55.0,
                "oxygen_saturation": 82.0,
                "temperature": 101.0,
                "fatigue": True,
                "nausea": True,
                "anxiety": True
            }
        }
    ]
    
    for test_case in test_cases:
        print(f"\n{test_case['name']}:")
        pathway = models.predict_care_pathway(test_case['data'])
        risk_score = models.predict_risk_score(test_case['data'])
        print(f"  Care Pathway: {pathway}")
        print(f"  Risk Score: {risk_score:.3f}")
    
    print()
    print("=" * 80)
    print("TRAINING COMPLETE")
    print("=" * 80)
    print()
    print("Models saved to:")
    print(f"  - {models.PATHWAY_MODEL_PATH}")
    print(f"  - {models.RISK_MODEL_PATH}")
    print(f"  - {models.SCALER_PATH}")
    print(f"  - {models.LABEL_ENCODER_PATH}")
    print()


if __name__ == "__main__":
    main()
