"""
Demo Script - Phase 3 Integration
Demonstrates all integrated features working together
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import datetime
from src.db_helpers import *
from src.sentiment_analyzer import analyze_sentiment, detect_grief_stage
from src.conversational_support import detect_crisis

print("=" * 70)
print("PROJECT AURA - PHASE 3 INTEGRATION DEMO")
print("=" * 70)
print("\nThis demo shows all integrated features working together.\n")

patient_id = 1

# Demo 1: Bereavement with Sentiment Analysis
print("\n" + "=" * 70)
print("DEMO 1: Bereavement Bridge with Sentiment Analysis")
print("=" * 70)

journal_text = "Today I'm feeling a mix of sadness and hope. I miss my loved one deeply, but I'm grateful for the memories we shared."

print(f"\n📝 Journal Entry:")
print(f'"{journal_text}"')

sentiment = analyze_sentiment(journal_text)
grief_stage = detect_grief_stage(journal_text)

print(f"\n🤖 AI Analysis:")
print(f"  • Sentiment Score: {sentiment['compound']:.3f}")
print(f"  • Sentiment Label: {sentiment['label']}")
print(f"  • Grief Stage: {grief_stage}")
print(f"  • Positive: {sentiment['positive']:.2f}")
print(f"  • Negative: {sentiment['negative']:.2f}")
print(f"  • Neutral: {sentiment['neutral']:.2f}")

entry_data = {
    'patient_id': patient_id,
    'family_member_id': 1,
    'entry_text': journal_text,
    'sentiment_score': sentiment['compound'],
    'sentiment_label': sentiment['label'],
    'grief_stage': grief_stage,
    'entry_date': datetime.now().isoformat()
}
entry_id = create_bereavement_entry(entry_data)
print(f"\n✅ Entry saved to database (ID: {entry_id})")

# Demo 2: Crisis Detection
print("\n" + "=" * 70)
print("DEMO 2: Crisis Detection in Support Hub")
print("=" * 70)

test_messages = [
    "I'm feeling overwhelmed but managing",
    "I want to hurt myself",
    "Everything is hopeless"
]

for msg in test_messages:
    is_crisis, crisis_type = detect_crisis(msg)
    status = "🚨 CRISIS DETECTED" if is_crisis else "✅ Safe"
    print(f'\n"{msg}"')
    print(f"  → {status}")
    if is_crisis:
        print(f"  → Type: {crisis_type}")
        print(f"  → Action: Alert care team, provide crisis resources")

# Demo 3: Complete Patient Workflow
print("\n" + "=" * 70)
print("DEMO 3: Complete Patient Care Workflow")
print("=" * 70)

# Add medication
print("\n1️⃣ Adding Medication...")
med_data = {
    'patient_id': patient_id,
    'name': 'Morphine Sulfate',
    'dosage': '15mg',
    'route': 'oral',
    'frequency': 'Every 4 hours as needed',
    'status': 'active'
}
med_id = create_medication(med_data)
print(f"   ✅ Medication added (ID: {med_id})")

# Create alert
print("\n2️⃣ Creating Alert...")
alert_data = {
    'patient_id': patient_id,
    'title': 'Pain Assessment Due',
    'message': 'Patient pain assessment due in 1 hour',
    'severity': 'medium',
    'alert_type': 'assessment',
    'status': 'active'
}
alert_id = create_alert(alert_data)
print(f"   ✅ Alert created (ID: {alert_id})")

# Schedule appointment
print("\n3️⃣ Scheduling Appointment...")
apt_data = {
    'patient_id': patient_id,
    'appointment_type': 'pain_management',
    'scheduled_date': '2026-01-27',
    'scheduled_time': '14:00:00',
    'status': 'scheduled'
}
apt_id = create_appointment(apt_data)
print(f"   ✅ Appointment scheduled (ID: {apt_id})")

# Add caregiver note
print("\n4️⃣ Logging Caregiver Note...")
note_data = {
    'patient_id': patient_id,
    'caregiver_id': 1,
    'note_type': 'vital_signs',
    'note_text': 'BP: 118/76, HR: 72, Temp: 98.4°F, O2 Sat: 97%',
    'created_at': datetime.now().isoformat()
}
note_id = create_caregiver_note(note_data)
print(f"   ✅ Caregiver note logged (ID: {note_id})")

# Add care plan goal
print("\n5️⃣ Setting Care Plan Goal...")
goal_data = {
    'patient_id': patient_id,
    'goal_text': 'Maintain pain level below 4/10',
    'category': 'pain_management',
    'target_date': '2026-02-01',
    'priority': 'high',
    'status': 'active'
}
goal_id = create_care_plan_goal(goal_data)
print(f"   ✅ Care goal set (ID: {goal_id})")

# Conduct functional assessment
print("\n6️⃣ Conducting Functional Assessment...")
assessment_data = {
    'patient_id': patient_id,
    'mobility': 'Walks with assistance',
    'self_care': 'Minimal assistance needed',
    'eating': 'Independent',
    'orientation': 'Fully oriented',
    'communication': 'Clear and coherent',
    'pain_level': 3,
    'comfort_level': 'Comfortable',
    'notes': 'Patient showing improvement in mobility',
    'assessment_date': datetime.now().isoformat()
}
assessment_id = create_functional_assessment(assessment_data)
print(f"   ✅ Assessment completed (ID: {assessment_id})")

# Demo 4: Data Retrieval
print("\n" + "=" * 70)
print("DEMO 4: Data Persistence & Retrieval")
print("=" * 70)

print("\n📊 Patient Summary:")

medications = get_medications_by_patient(patient_id, status='active')
print(f"\n  💊 Active Medications: {len(medications)}")
for med in medications[:3]:
    print(f"     • {med['name']} {med['dosage']} - {med['frequency']}")

alerts = get_alerts_by_patient(patient_id, status='active')
print(f"\n  🔔 Active Alerts: {len(alerts)}")
for alert in alerts[:3]:
    print(f"     • [{alert['severity'].upper()}] {alert['title']}")

appointments = get_appointments_by_patient(patient_id, status='scheduled')
print(f"\n  📅 Upcoming Appointments: {len(appointments)}")
for apt in appointments[:3]:
    print(f"     • {apt['appointment_type']} on {apt['scheduled_date']}")

entries = get_bereavement_entries_by_family(patient_id)
print(f"\n  🕊️ Bereavement Entries: {len(entries)}")
if entries:
    latest = entries[0]
    print(f"     • Latest: {latest['sentiment_label']} (Stage: {latest['grief_stage']})")

goals = get_care_plan_goals_by_patient(patient_id, status='active')
print(f"\n  📋 Active Care Goals: {len(goals)}")
for goal in goals[:3]:
    print(f"     • [{goal['priority'].upper()}] {goal['goal_text']}")

# Demo 5: AI-Powered Insights
print("\n" + "=" * 70)
print("DEMO 5: AI-Powered Insights")
print("=" * 70)

print("\n🤖 Analyzing Patient Emotional Journey...")

entries = get_bereavement_entries_by_family(patient_id)
if entries:
    sentiments = [e.get('sentiment_score', 0) for e in entries if e.get('sentiment_score')]
    if sentiments:
        avg_sentiment = sum(sentiments) / len(sentiments)
        trend = "improving" if sentiments[-1] > sentiments[0] else "declining" if sentiments[-1] < sentiments[0] else "stable"
        
        print(f"\n  📈 Emotional Trend: {trend.upper()}")
        print(f"  📊 Average Sentiment: {avg_sentiment:.3f}")
        print(f"  📝 Total Entries: {len(entries)}")
        
        if avg_sentiment < -0.3:
            print(f"\n  ⚠️  Recommendation: Increase support interventions")
        elif avg_sentiment > 0.3:
            print(f"\n  ✅ Observation: Patient showing positive emotional progress")
        else:
            print(f"\n  ℹ️  Status: Patient emotional state is neutral/stable")

# Summary
print("\n" + "=" * 70)
print("DEMO COMPLETE - ALL FEATURES OPERATIONAL")
print("=" * 70)

print("\n✅ Demonstrated Features:")
print("  • Sentiment analysis with grief stage detection")
print("  • Crisis detection and safety monitoring")
print("  • Complete patient care workflow")
print("  • Database persistence across all modules")
print("  • Data retrieval and reporting")
print("  • AI-powered emotional insights")

print("\n🎉 Phase 3 Integration: FULLY FUNCTIONAL")
print("\n" + "=" * 70)
