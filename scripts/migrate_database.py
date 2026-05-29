"""
Database Migration Script
Adds new tables for comprehensive hospice care features
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine
from src.models_extended import Base
from src.db import DATABASE_URL

def migrate_database():
    """Create all new tables"""
    print("Starting database migration...")
    print(f"Database URL: {DATABASE_URL}")
    
    engine = create_engine(DATABASE_URL, echo=True)
    
    try:
        # Create all tables defined in models_extended
        Base.metadata.create_all(bind=engine)
        print("\n✅ Migration completed successfully!")
        print("Added 17 new tables:")
        print("  - medications, prescriptions, medication_administrations")
        print("  - appointments, care_team_members")
        print("  - tasks, communication_logs")
        print("  - memory_entries, journal_entries")
        print("  - care_plans, care_goals, care_interventions")
        print("  - grief_assessments, bereavement_resources, bereavement_plans")
        print("  - functional_status, qol_assessments")
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    migrate_database()
