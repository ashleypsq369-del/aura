"""
Create Clinical Assessment Tables
Adds all validated assessment tool tables to database
"""

from src.db import Base, engine
from src.db import (
    ESASAssessment, PPSAssessment, CognitiveAssessment,
    PHQ9Assessment, GAD7Assessment, BarthelIndexAssessment,
    PainAssessment, QualityOfLifeAssessment, CaregiverBurdenAssessment,
    MotorSkillsAssessment
)

def create_assessment_tables():
    """Create all assessment tables"""
    print("🏗️  Creating clinical assessment tables...")
    
    try:
        # Create all tables defined in Base
        Base.metadata.create_all(bind=engine)
        print("✅ Assessment tables created successfully!")
        
        print("\n📋 Tables created:")
        print("   - esas_assessments (Edmonton Symptom Assessment)")
        print("   - pps_assessments (Palliative Performance Scale)")
        print("   - cognitive_assessments (MMSE/MoCA)")
        print("   - phq9_assessments (Depression)")
        print("   - gad7_assessments (Anxiety)")
        print("   - barthel_assessments (ADL)")
        print("   - pain_assessments (Brief Pain Inventory)")
        print("   - qol_assessments (Quality of Life)")
        print("   - caregiver_burden_assessments (Zarit)")
        print("   - motor_skills_assessments (Physical Function)")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise

if __name__ == "__main__":
    create_assessment_tables()
