"""Enhanced Dashboard with Professional Components"""
import streamlit as st
from datetime import datetime, timedelta
import json
from src.dashboard_components import (
    render_kpi_card, render_alert_card, render_timeline_item,
    render_stat_card, render_progress_card
)
from src.db_helpers import (
    get_alerts_by_patient, get_medications_by_patient,
    get_appointments_by_patient, get_bereavement_entries_by_family
)

def render():
    """Render professional dashboard"""
    st.title("📊 Patient Dashboard")
    
    patient_id = st.session_state.get('current_patient_id', 1)
    
    # KPI Cards Row
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        alerts = get_alerts_by_patient(patient_id, status='active')
        render_kpi_card("Active Alerts", len(alerts), "🔔", "critical" if len(alerts) > 5 else "normal")
    
    with col2:
        medications = get_medications_by_patient(patient_id, status='active')
        render_kpi_card("Active Medications", len(medications), "💊", "normal")
    
    with col3:
        today = datetime.now().date()
        appointments = get_appointments_by_patient(patient_id, 
                                                   start_date=datetime.combine(today, datetime.min.time()))
        render_kpi_card("Upcoming Appointments", len(appointments), "📅", "normal")
    
    with col4:
        entries = get_bereavement_entries_by_family(patient_id)
        avg_sentiment = sum([e.get('sentiment_score', 0) for e in entries]) / len(entries) if entries else 0
        sentiment_label = "Positive" if avg_sentiment > 0.3 else "Neutral" if avg_sentiment > -0.3 else "Needs Support"
        render_kpi_card("Family Sentiment", sentiment_label, "💭", 
                       "normal" if avg_sentiment > 0 else "warning")
    
    st.markdown("---")
    
    # Main content area
    col_left, col_right = st.columns([2, 1])
    
    with col_left:
        st.subheader("📋 Recent Activity Timeline")
        
        # Combine recent activities
        activities = []
        
        # Recent alerts
        for alert in alerts[:3]:
            activities.append({
                'type': 'alert',
                'title': alert['title'],
                'description': alert['message'],
                'timestamp': alert['created_at'],
                'severity': alert['severity']
            })
        
        # Recent appointments
        for apt in appointments[:3]:
            activities.append({
                'type': 'appointment',
                'title': f"Appointment: {apt.get('appointment_type', 'Visit')}",
                'description': f"Scheduled for {apt.get('scheduled_date', 'TBD')}",
                'timestamp': apt.get('created_at', datetime.now().isoformat()),
                'severity': 'normal'
            })
        
        # Sort by timestamp
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        if activities:
            for activity in activities[:10]:
                icon = "🔔" if activity['type'] == 'alert' else "📅"
                render_timeline_item(
                    icon,
                    activity['title'],
                    activity['description'],
                    activity['timestamp']
                )
        else:
            st.info("No recent activity")
    
    with col_right:
        st.subheader("⚠️ Priority Alerts")
        
        critical_alerts = [a for a in alerts if a['severity'] in ['high', 'critical']]
        
        if critical_alerts:
            for alert in critical_alerts[:5]:
                render_alert_card(
                    alert['title'],
                    alert['message'],
                    alert['severity'],
                    alert['created_at']
                )
        else:
            st.success("✅ No critical alerts")
        
        st.markdown("---")
        st.subheader("📈 Quick Stats")
        
        # Load platform resources for insights
        try:
            with open('data/platform_resources.json', 'r') as f:
                resources = json.load(f)
            
            best_practices = resources.get('best_practices', {})
            if best_practices:
                st.info(f"💡 **Tip:** {best_practices.get('pain_management', {}).get('description', 'Stay informed')}")
        except:
            pass
