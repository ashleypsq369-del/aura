"""Alert Management System - Comprehensive Alert Handling"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from enum import Enum
import json

class AlertPriority(Enum):
    """Alert priority levels"""
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"

class AlertStatus(Enum):
    """Alert status"""
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"

class AlertType(Enum):
    """Types of alerts"""
    PAIN_LEVEL = "pain_level"
    VITAL_SIGNS = "vital_signs"
    MEDICATION = "medication"
    BEHAVIORAL = "behavioral"
    APPOINTMENT = "appointment"
    SYSTEM = "system"

@dataclass
class Alert:
    """Alert data structure"""
    alert_id: str
    patient_id: str
    alert_type: AlertType
    priority: AlertPriority
    title: str
    message: str
    timestamp: datetime
    status: AlertStatus
    assigned_to: Optional[str] = None
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    metadata: Optional[Dict] = None

class AlertManager:
    """Manages alert creation, tracking, and resolution"""
    
    def __init__(self):
        self.alerts: List[Alert] = []
        self.alert_rules = self._load_alert_rules()
    
    def _load_alert_rules(self) -> Dict:
        """Load alert threshold rules"""
        return {
            'pain_critical': 8,
            'pain_warning': 6,
            'bp_systolic_low': 90,
            'bp_systolic_high': 180,
            'heart_rate_low': 50,
            'heart_rate_high': 120,
            'temp_high': 101.5,
            'medication_reminder_minutes': 30,
            'medication_overdue_minutes': 60
        }
    
    def create_alert(self, patient_id: str, alert_type: AlertType, 
                    priority: AlertPriority, title: str, message: str,
                    assigned_to: Optional[str] = None, metadata: Optional[Dict] = None) -> Alert:
        """Create a new alert"""
        alert_id = f"ALT-{datetime.now().strftime('%Y%m%d%H%M%S')}-{len(self.alerts)}"
        
        alert = Alert(
            alert_id=alert_id,
            patient_id=patient_id,
            alert_type=alert_type,
            priority=priority,
            title=title,
            message=message,
            timestamp=datetime.now(),
            status=AlertStatus.ACTIVE,
            assigned_to=assigned_to,
            metadata=metadata or {}
        )
        
        self.alerts.append(alert)
        return alert
    
    def check_pain_level(self, patient_id: str, pain_level: int) -> Optional[Alert]:
        """Check pain level and create alert if needed"""
        if pain_level >= self.alert_rules['pain_critical']:
            return self.create_alert(
                patient_id=patient_id,
                alert_type=AlertType.PAIN_LEVEL,
                priority=AlertPriority.CRITICAL,
                title="Critical Pain Level",
                message=f"Patient reported pain level {pain_level}/10 - immediate attention required",
                metadata={'pain_level': pain_level}
            )
        elif pain_level >= self.alert_rules['pain_warning']:
            return self.create_alert(
                patient_id=patient_id,
                alert_type=AlertType.PAIN_LEVEL,
                priority=AlertPriority.WARNING,
                title="Elevated Pain Level",
                message=f"Patient reported pain level {pain_level}/10 - assessment recommended",
                metadata={'pain_level': pain_level}
            )
        return None
    
    def check_vital_signs(self, patient_id: str, vitals: Dict) -> List[Alert]:
        """Check vital signs and create alerts if needed"""
        alerts = []
        
        # Blood pressure
        if 'bp_systolic' in vitals:
            bp = vitals['bp_systolic']
            if bp < self.alert_rules['bp_systolic_low']:
                alerts.append(self.create_alert(
                    patient_id=patient_id,
                    alert_type=AlertType.VITAL_SIGNS,
                    priority=AlertPriority.CRITICAL,
                    title="Low Blood Pressure",
                    message=f"Blood pressure critically low: {bp}/{vitals.get('bp_diastolic', '?')} mmHg",
                    metadata=vitals
                ))
            elif bp > self.alert_rules['bp_systolic_high']:
                alerts.append(self.create_alert(
                    patient_id=patient_id,
                    alert_type=AlertType.VITAL_SIGNS,
                    priority=AlertPriority.WARNING,
                    title="High Blood Pressure",
                    message=f"Blood pressure elevated: {bp}/{vitals.get('bp_diastolic', '?')} mmHg",
                    metadata=vitals
                ))
        
        # Heart rate
        if 'heart_rate' in vitals:
            hr = vitals['heart_rate']
            if hr < self.alert_rules['heart_rate_low'] or hr > self.alert_rules['heart_rate_high']:
                priority = AlertPriority.CRITICAL if hr < 40 or hr > 140 else AlertPriority.WARNING
                alerts.append(self.create_alert(
                    patient_id=patient_id,
                    alert_type=AlertType.VITAL_SIGNS,
                    priority=priority,
                    title="Abnormal Heart Rate",
                    message=f"Heart rate: {hr} bpm",
                    metadata=vitals
                ))
        
        # Temperature
        if 'temperature' in vitals:
            temp = vitals['temperature']
            if temp > self.alert_rules['temp_high']:
                alerts.append(self.create_alert(
                    patient_id=patient_id,
                    alert_type=AlertType.VITAL_SIGNS,
                    priority=AlertPriority.WARNING,
                    title="Elevated Temperature",
                    message=f"Temperature: {temp}°F",
                    metadata=vitals
                ))
        
        return alerts
    
    def create_medication_reminder(self, patient_id: str, medication: str, 
                                   scheduled_time: datetime) -> Alert:
        """Create medication reminder alert"""
        return self.create_alert(
            patient_id=patient_id,
            alert_type=AlertType.MEDICATION,
            priority=AlertPriority.INFO,
            title="Medication Reminder",
            message=f"Medication due: {medication} at {scheduled_time.strftime('%I:%M %p')}",
            metadata={'medication': medication, 'scheduled_time': scheduled_time.isoformat()}
        )
    
    def create_medication_overdue(self, patient_id: str, medication: str, 
                                 scheduled_time: datetime) -> Alert:
        """Create overdue medication alert"""
        minutes_overdue = (datetime.now() - scheduled_time).seconds // 60
        return self.create_alert(
            patient_id=patient_id,
            alert_type=AlertType.MEDICATION,
            priority=AlertPriority.WARNING,
            title="Medication Overdue",
            message=f"Medication overdue by {minutes_overdue} minutes: {medication}",
            metadata={'medication': medication, 'scheduled_time': scheduled_time.isoformat(), 
                     'minutes_overdue': minutes_overdue}
        )
    
    def acknowledge_alert(self, alert_id: str, user: str) -> bool:
        """Acknowledge an alert"""
        for alert in self.alerts:
            if alert.alert_id == alert_id:
                alert.status = AlertStatus.ACKNOWLEDGED
                alert.acknowledged_by = user
                alert.acknowledged_at = datetime.now()
                return True
        return False
    
    def resolve_alert(self, alert_id: str, user: str) -> bool:
        """Resolve an alert"""
        for alert in self.alerts:
            if alert.alert_id == alert_id:
                alert.status = AlertStatus.RESOLVED
                alert.resolved_by = user
                alert.resolved_at = datetime.now()
                return True
        return False
    
    def dismiss_alert(self, alert_id: str, user: str) -> bool:
        """Dismiss an alert"""
        for alert in self.alerts:
            if alert.alert_id == alert_id:
                alert.status = AlertStatus.DISMISSED
                alert.resolved_by = user
                alert.resolved_at = datetime.now()
                return True
        return False
    
    def get_active_alerts(self, patient_id: Optional[str] = None, 
                         priority: Optional[AlertPriority] = None) -> List[Alert]:
        """Get active alerts with optional filters"""
        alerts = [a for a in self.alerts if a.status == AlertStatus.ACTIVE]
        
        if patient_id:
            alerts = [a for a in alerts if a.patient_id == patient_id]
        
        if priority:
            alerts = [a for a in alerts if a.priority == priority]
        
        return sorted(alerts, key=lambda x: (x.priority.value, x.timestamp), reverse=True)
    
    def get_alert_statistics(self, days: int = 7) -> Dict:
        """Get alert statistics for specified period"""
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_alerts = [a for a in self.alerts if a.timestamp >= cutoff_date]
        
        stats = {
            'total': len(recent_alerts),
            'by_priority': {
                'critical': len([a for a in recent_alerts if a.priority == AlertPriority.CRITICAL]),
                'warning': len([a for a in recent_alerts if a.priority == AlertPriority.WARNING]),
                'info': len([a for a in recent_alerts if a.priority == AlertPriority.INFO])
            },
            'by_status': {
                'active': len([a for a in recent_alerts if a.status == AlertStatus.ACTIVE]),
                'acknowledged': len([a for a in recent_alerts if a.status == AlertStatus.ACKNOWLEDGED]),
                'resolved': len([a for a in recent_alerts if a.status == AlertStatus.RESOLVED]),
                'dismissed': len([a for a in recent_alerts if a.status == AlertStatus.DISMISSED])
            },
            'by_type': {}
        }
        
        for alert_type in AlertType:
            stats['by_type'][alert_type.value] = len([a for a in recent_alerts if a.alert_type == alert_type])
        
        # Calculate average response time
        resolved_alerts = [a for a in recent_alerts if a.resolved_at]
        if resolved_alerts:
            response_times = [(a.resolved_at - a.timestamp).seconds / 60 for a in resolved_alerts]
            stats['avg_response_time_minutes'] = sum(response_times) / len(response_times)
        else:
            stats['avg_response_time_minutes'] = 0
        
        return stats
    
    def get_alert_by_id(self, alert_id: str) -> Optional[Alert]:
        """Get specific alert by ID"""
        for alert in self.alerts:
            if alert.alert_id == alert_id:
                return alert
        return None
    
    def assign_alert(self, alert_id: str, assigned_to: str) -> bool:
        """Assign alert to a user"""
        for alert in self.alerts:
            if alert.alert_id == alert_id:
                alert.assigned_to = assigned_to
                return True
        return False
    
    def get_alerts_by_user(self, user: str) -> List[Alert]:
        """Get all alerts assigned to a user"""
        return [a for a in self.alerts if a.assigned_to == user and a.status == AlertStatus.ACTIVE]

# Global alert manager instance
alert_manager = AlertManager()

def get_alert_manager() -> AlertManager:
    """Get the global alert manager instance"""
    return alert_manager


def render_alerts_page():
    """Render the alerts page in Streamlit"""
    import streamlit as st
    import pandas as pd
    from datetime import datetime
    
    st.subheader("🔔 Alert Management")
    
    manager = get_alert_manager()
    
    # Alert statistics
    stats = manager.get_alert_statistics(days=7)
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Alerts (7 days)", stats['total'])
    with col2:
        st.metric("Critical", stats['by_priority']['critical'], 
                 delta=None, delta_color="inverse")
    with col3:
        st.metric("Active", stats['by_status']['active'])
    with col4:
        avg_response = stats['avg_response_time_minutes']
        st.metric("Avg Response Time", f"{avg_response:.1f} min")
    
    st.markdown("---")
    
    # Filter options
    col1, col2 = st.columns(2)
    with col1:
        priority_filter = st.selectbox(
            "Filter by Priority",
            ["All", "Critical", "Warning", "Info"]
        )
    with col2:
        status_filter = st.selectbox(
            "Filter by Status",
            ["Active", "All", "Acknowledged", "Resolved", "Dismissed"]
        )
    
    # Get alerts
    if status_filter == "Active":
        alerts = manager.get_active_alerts()
    else:
        alerts = manager.alerts
        if status_filter != "All":
            alerts = [a for a in alerts if a.status.value == status_filter.lower()]
    
    if priority_filter != "All":
        alerts = [a for a in alerts if a.priority.value == priority_filter.lower()]
    
    # Display alerts
    if alerts:
        for alert in alerts[:20]:  # Show latest 20
            priority_colors = {
                'critical': '🔴',
                'warning': '🟡',
                'info': '🔵'
            }
            
            icon = priority_colors.get(alert.priority.value, '⚪')
            
            with st.expander(f"{icon} {alert.title} - {alert.timestamp.strftime('%Y-%m-%d %H:%M')}"):
                st.write(f"**Message:** {alert.message}")
                st.write(f"**Patient ID:** {alert.patient_id}")
                st.write(f"**Type:** {alert.alert_type.value}")
                st.write(f"**Status:** {alert.status.value}")
                
                if alert.assigned_to:
                    st.write(f"**Assigned to:** {alert.assigned_to}")
                
                if alert.acknowledged_by:
                    st.write(f"**Acknowledged by:** {alert.acknowledged_by} at {alert.acknowledged_at}")
                
                if alert.resolved_by:
                    st.write(f"**Resolved by:** {alert.resolved_by} at {alert.resolved_at}")
                
                # Action buttons
                col1, col2, col3 = st.columns(3)
                with col1:
                    if alert.status == AlertStatus.ACTIVE:
                        if st.button("Acknowledge", key=f"ack_{alert.alert_id}"):
                            manager.acknowledge_alert(alert.alert_id, st.session_state.get('username', 'User'))
                            st.success("Alert acknowledged")
                            st.rerun()
                
                with col2:
                    if alert.status in [AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]:
                        if st.button("Resolve", key=f"res_{alert.alert_id}"):
                            manager.resolve_alert(alert.alert_id, st.session_state.get('username', 'User'))
                            st.success("Alert resolved")
                            st.rerun()
                
                with col3:
                    if alert.status == AlertStatus.ACTIVE:
                        if st.button("Dismiss", key=f"dis_{alert.alert_id}"):
                            manager.dismiss_alert(alert.alert_id, st.session_state.get('username', 'User'))
                            st.success("Alert dismissed")
                            st.rerun()
    else:
        st.info("No alerts match the selected filters")
    
    # Create test alert (for demo purposes)
    st.markdown("---")
    st.subheader("Create Test Alert")
    with st.form("create_alert"):
        test_patient = st.text_input("Patient ID", "PAT-001")
        test_title = st.text_input("Title", "Test Alert")
        test_message = st.text_area("Message", "This is a test alert")
        test_priority = st.selectbox("Priority", ["critical", "warning", "info"])
        
        if st.form_submit_button("Create Alert"):
            manager.create_alert(
                patient_id=test_patient,
                alert_type=AlertType.SYSTEM,
                priority=AlertPriority[test_priority.upper()],
                title=test_title,
                message=test_message
            )
            st.success("Test alert created!")
            st.rerun()


def render():
    """Render alerts page"""
    import streamlit as st
    from src import db
    
    st.markdown("### 🔔 Priority Alerts")
    
    # Get all alerts
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, patient_id, alert_type, severity, message, created_at, resolved
        FROM alerts
        ORDER BY created_at DESC
        LIMIT 50
    """)
    alerts = cursor.fetchall()
    conn.close()
    
    if not alerts:
        st.info("No alerts at this time")
        return
    
    # Display alerts
    for alert in alerts:
        alert_id, patient_id, alert_type, severity, message, created_at, resolved = alert
        
        if resolved:
            continue
            
        severity_colors = {
            'critical': '🔴',
            'high': '🟠',
            'medium': '🟡',
            'low': '🟢'
        }
        
        icon = severity_colors.get(severity, '🔵')
        
        with st.expander(f"{icon} {alert_type} - {message[:50]}..."):
            st.write(f"**Patient ID:** {patient_id}")
            st.write(f"**Severity:** {severity}")
            st.write(f"**Message:** {message}")
            st.write(f"**Time:** {created_at}")
            
            if st.button(f"Resolve Alert {alert_id}", key=f"resolve_{alert_id}"):
                conn = db.get_connection()
                cursor = conn.cursor()
                cursor.execute("UPDATE alerts SET resolved = 1 WHERE id = ?", (alert_id,))
                conn.commit()
                conn.close()
                st.success("Alert resolved!")
                st.rerun()
