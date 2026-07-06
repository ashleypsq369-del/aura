"""
Recreate predictions table with all required columns
"""
from src.db import engine, Base, Prediction
from sqlalchemy import text

print("Recreating predictions table...")

try:
    with engine.connect() as conn:
        # Drop existing table
        print("Dropping old predictions table...")
        conn.execute(text("DROP TABLE IF EXISTS predictions"))
        conn.commit()
        print("✅ Old table dropped")
        
        # Create new table with all columns
        print("Creating new predictions table with all columns...")
        Prediction.__table__.create(engine)
        print("✅ New table created")
        
    print("\n✅ Predictions table recreated successfully!")
    print("\nTable now has all required columns:")
    print("  - id, patient_id, predicted_at")
    print("  - care_pathway, risk_score, risk_level, confidence")
    print("  - shap_values, feature_values, feature_names, base_value")
    print("  - plain_explanation, model_version, triggered_by")
    print("  - clinical_action_taken, overridden_by, override_justification")
    
except Exception as e:
    print(f"❌ Error: {e}")
