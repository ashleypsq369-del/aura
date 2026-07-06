"""
Add XAI Feedback Tables
========================
Adds tables for:
1. FocusedExplanationFeedback - Clinician feedback on focused AI explanations
2. ExplanationOverride - Admin custom explanation rules

Run this to create the tables:
  python add_xai_feedback_tables.py
"""

from src.db import Base, engine, SessionLocal
from sqlalchemy import inspect

def main():
    print("🔧 Adding XAI Feedback Tables...")
    
    # Get inspector to check existing tables
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    # Create all tables (only new ones will be created)
    Base.metadata.create_all(bind=engine)
    
    # Check what was added
    new_inspector = inspect(engine)
    new_tables = new_inspector.get_table_names()
    
    added_tables = set(new_tables) - set(existing_tables)
    
    if added_tables:
        print(f"\n✅ Added {len(added_tables)} new tables:")
        for table in added_tables:
            print(f"   - {table}")
    else:
        print("\n✅ All tables already exist")
    
    print("\n📊 XAI Feedback Tables Status:")
    print(f"   - focused_explanation_feedback: {'✓' if 'focused_explanation_feedback' in new_tables else '✗'}")
    print(f"   - explanation_overrides: {'✓' if 'explanation_overrides' in new_tables else '✗'}")
    
    print("\n🎉 XAI Feedback System Ready!")
    print("\nNext steps:")
    print("1. Backend: Add feedback endpoint to comprehensive_ai.py")
    print("2. Frontend: Add feedback UI to FocusedAIExplanation.jsx")
    print("3. Admin: Create ExplanationOverrides admin panel")

if __name__ == "__main__":
    main()
