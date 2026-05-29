"""Comprehensive Integration Tests for Project AURA"""

import pytest
import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src import db, simulator, alerts, xai, reporting, analytics, audit, notifications

class TestDatabaseIntegration:
    """Test database operations"""
    
    def test_patient_creation(self):
        """Test creating a patient"""
        patient = db.Patient(
            patient_id="TEST001",
            name="Test Patient",
            age=65,
            diagnosis="Test Diagnosis",
            admission_date=datetime.now()
        )
        assert patient.patient_id == "TEST001"
        assert patient.name == "Test Patient"
    
    def test_vital_signs_logging(self):
        """Test logging vital signs"""
        vitals = db.VitalSigns(
            patient_id="TEST001",
            timestamp=datetime.now(),
            blood_pressure="120/80",
            heart_rate=75,
            temperature=98.6,
            respiratory_rate=16
        )
        assert vitals.heart_rate == 75
        assert vitals.temperature == 98.6

class TestAlertSystem:
    """Test alert management system"""
    
    def test_pain_alert_creation(self):
        """Test creating pain level alert"""
        alert_mgr = alerts.get_alert_manager()
        alert = alert_mgr.check_pain_level("TEST001", 9)
        
        assert alert is not None
        assert alert.priority == alerts.AlertPriority.CRITICAL
        assert "9/10" in alert.message
    
    def test_vital_signs_alert(self):
        """Test vital signs alert"""
        alert_mgr = alerts.get_alert_manager()
        vitals = {
            'bp_systolic': 85,
            'bp_diastolic': 50,
            'heart_rate': 45
        }
        
        alerts_created = alert_mgr.check_vital_signs("TEST001", vitals)
        assert len(alerts_created) > 0
    
    def test_alert_acknowledgment(self):
        """Test acknowledging an alert"""
        alert_mgr = alerts.get_alert_manager()
        alert = alert_mgr.create_alert(
            patient_id="TEST001",
            alert_type=alerts.AlertType.PAIN_LEVEL,
            priority=alerts.AlertPriority.HIGH,
            title="Test Alert",
            message="Test message"
        )
        
        success = alert_mgr.acknowledge_alert(alert.alert_id, "test_user")
        assert success
        assert alert.status == alerts.AlertStatus.ACKNOWLEDGED

class TestXAIEngine:
    """Test explainable AI engine"""
    
    def test_pain_prediction(self):
        """Test pain level prediction"""
        xai_engine = xai.get_xai_engine()
        patient_data = {
            'current_pain': 6,
            'pain_history': [5, 5, 6, 6, 7],
            'hours_since_medication': 3
        }
        
        prediction = xai_engine.predict_pain_level(patient_data)
        assert prediction.prediction_type == 'pain_level'
        assert 0 <= prediction.value <= 10
        assert 0 <= prediction.confidence <= 1
    
    def test_symptom_likelihood(self):
        """Test symptom likelihood prediction"""
        xai_engine = xai.get_xai_engine()
        patient_data = {'current_pain': 7, 'medication_count': 5}
        
        probs = xai_engine.predict_symptom_likelihood(patient_data)
        assert 'nausea' in probs
        assert 'fatigue' in probs
        assert all(0 <= p <= 1 for p in probs.values())
    
    def test_deterioration_risk(self):
        """Test deterioration risk assessment"""
        xai_engine = xai.get_xai_engine()
        patient_data = {
            'pain_trend': 1.5,
            'vital_instability': 0.3,
            'functional_decline': 0.4,
            'medication_issues': 0.2,
            'psychological_distress': 0.3
        }
        
        risk, explanation = xai_engine.assess_deterioration_risk(patient_data)
        assert 0 <= risk <= 1
        assert 'risk_level' in explanation

class TestReporting:
    """Test reporting system"""
    
    def test_patient_summary_report(self):
        """Test patient summary report generation"""
        report_gen = reporting.get_report_generator()
        start_date = datetime.now() - timedelta(days=30)
        end_date = datetime.now()
        
        report = report_gen.generate_patient_summary_report("TEST001", start_date, end_date)
        assert 'metadata' in report
        assert 'demographics' in report
        assert 'pain_summary' in report
    
    def test_pain_management_report(self):
        """Test pain management report"""
        report_gen = reporting.get_report_generator()
        report = report_gen.generate_pain_management_report("TEST001", days=30)
        
        assert 'summary' in report
        assert 'pain_trends' in report
        assert 'medication_effectiveness' in report
    
    def test_quality_metrics_report(self):
        """Test quality metrics report"""
        report_gen = reporting.get_report_generator()
        start_date = datetime.now() - timedelta(days=30)
        end_date = datetime.now()
        
        report = report_gen.generate_quality_metrics_report("FAC001", start_date, end_date)
        assert 'patient_outcomes' in report
        assert 'clinical_quality' in report

class TestAnalytics:
    """Test analytics engine"""
    
    def test_patient_metrics(self):
        """Test patient metrics calculation"""
        analytics_engine = analytics.get_analytics_engine()
        metrics = analytics_engine.calculate_patient_metrics("TEST001", days=30)
        
        assert 'pain_management' in metrics
        assert 'symptom_burden' in metrics
        assert 'quality_of_life' in metrics
    
    def test_pain_trends_analysis(self):
        """Test pain trends analysis"""
        analytics_engine = analytics.get_analytics_engine()
        analysis = analytics_engine.analyze_pain_trends("TEST001", days=90)
        
        assert 'summary' in analysis
        assert 'trends' in analysis
        assert 'patterns' in analysis
    
    def test_facility_metrics(self):
        """Test facility metrics"""
        analytics_engine = analytics.get_analytics_engine()
        metrics = analytics_engine.calculate_facility_metrics("FAC001", days=30)
        
        assert 'census' in metrics
        assert 'quality_indicators' in metrics
        assert 'operational_efficiency' in metrics

class TestAuditSystem:
    """Test audit logging system"""
    
    def test_login_audit(self):
        """Test login audit logging"""
        audit_log = audit.get_audit_logger()
        entry = audit_log.log_login("user001", "Test User", "Nurse", "192.168.1.1", success=True)
        
        assert entry.action == audit.AuditAction.LOGIN
        assert entry.category == audit.AuditCategory.AUTHENTICATION
        assert entry.success
    
    def test_patient_access_audit(self):
        """Test patient access audit"""
        audit_log = audit.get_audit_logger()
        entry = audit_log.log_patient_access(
            "user001", "Test User", "Nurse", "TEST001",
            audit.AuditAction.READ, "Viewed patient record"
        )
        
        assert entry.category == audit.AuditCategory.PATIENT_DATA
        assert entry.resource_id == "TEST001"
    
    def test_audit_trail_retrieval(self):
        """Test retrieving audit trail"""
        audit_log = audit.get_audit_logger()
        
        # Create some audit entries
        audit_log.log_login("user001", "Test User", "Nurse", "192.168.1.1")
        audit_log.log_patient_access("user001", "Test User", "Nurse", "TEST001",
                                    audit.AuditAction.READ, "Test access")
        
        trail = audit_log.get_audit_trail(user_id="user001")
        assert len(trail) >= 2

class TestNotifications:
    """Test notification system"""
    
    def test_notification_creation(self):
        """Test creating a notification"""
        notif_mgr = notifications.get_notification_manager()
        notification = notif_mgr.create_notification(
            recipient_id="user001",
            recipient_name="Test User",
            channel=notifications.NotificationChannel.EMAIL,
            priority=notifications.NotificationPriority.MEDIUM,
            title="Test Notification",
            message="This is a test"
        )
        
        assert notification.recipient_id == "user001"
        assert notification.status == notifications.NotificationStatus.PENDING
    
    def test_pain_alert_notification(self):
        """Test pain alert notification"""
        notif_mgr = notifications.get_notification_manager()
        care_team = [
            {'user_id': 'nurse001', 'name': 'Nurse Smith'},
            {'user_id': 'doc001', 'name': 'Dr. Jones'}
        ]
        
        notifications_sent = notif_mgr.send_pain_alert(
            "TEST001", "Test Patient", 9, care_team
        )
        
        assert len(notifications_sent) > 0
    
    def test_notification_read_status(self):
        """Test marking notification as read"""
        notif_mgr = notifications.get_notification_manager()
        notification = notif_mgr.create_notification(
            recipient_id="user001",
            recipient_name="Test User",
            channel=notifications.NotificationChannel.IN_APP,
            priority=notifications.NotificationPriority.LOW,
            title="Test",
            message="Test message"
        )
        
        success = notif_mgr.mark_as_read(notification.notification_id)
        assert success
        assert notification.status == notifications.NotificationStatus.READ

class TestSimulator:
    """Test clinical simulator"""
    
    def test_patient_simulation(self):
        """Test patient data simulation"""
        sim = simulator.ClinicalSimulator()
        patient_data = sim.simulate_patient_day("TEST001")
        
        assert 'pain_levels' in patient_data
        assert 'vital_signs' in patient_data
        assert 'symptoms' in patient_data
    
    def test_pain_trajectory(self):
        """Test pain trajectory simulation"""
        sim = simulator.ClinicalSimulator()
        trajectory = sim.generate_pain_trajectory(days=7)
        
        assert len(trajectory) == 7
        assert all(0 <= p <= 10 for p in trajectory)

class TestEndToEndWorkflow:
    """Test complete end-to-end workflows"""
    
    def test_pain_crisis_workflow(self):
        """Test complete pain crisis management workflow"""
        # 1. Patient reports high pain
        alert_mgr = alerts.get_alert_manager()
        alert = alert_mgr.check_pain_level("TEST001", 9)
        assert alert is not None
        
        # 2. Alert triggers notification
        notif_mgr = notifications.get_notification_manager()
        care_team = [{'user_id': 'nurse001', 'name': 'Nurse Smith'}]
        notifications_sent = notif_mgr.send_pain_alert("TEST001", "Test Patient", 9, care_team)
        assert len(notifications_sent) > 0
        
        # 3. Nurse acknowledges alert
        success = alert_mgr.acknowledge_alert(alert.alert_id, "nurse001")
        assert success
        
        # 4. AI provides prediction
        xai_engine = xai.get_xai_engine()
        patient_data = {'current_pain': 9, 'pain_history': [7, 8, 8, 9], 'hours_since_medication': 4}
        prediction = xai_engine.predict_pain_level(patient_data)
        assert prediction.value > 0
        
        # 5. Audit log captures all actions
        audit_log = audit.get_audit_logger()
        audit_log.log_alert_action("nurse001", "Nurse Smith", "Nurse", 
                                   alert.alert_id, audit.AuditAction.UPDATE,
                                   "Acknowledged pain alert")
        
        # 6. Alert resolved
        success = alert_mgr.resolve_alert(alert.alert_id, "nurse001")
        assert success
    
    def test_medication_management_workflow(self):
        """Test medication management workflow"""
        # 1. Create medication reminder
        notif_mgr = notifications.get_notification_manager()
        scheduled_time = datetime.now() + timedelta(minutes=30)
        caregivers = [{'user_id': 'caregiver001', 'name': 'Family Member'}]
        
        notifications_sent = notif_mgr.send_medication_reminder(
            "TEST001", "Test Patient", "Morphine 15mg", scheduled_time, caregivers
        )
        assert len(notifications_sent) > 0
        
        # 2. Log medication administration
        audit_log = audit.get_audit_logger()
        audit_log.log_medication_action(
            "nurse001", "Nurse Smith", "Nurse", "TEST001", "Morphine",
            audit.AuditAction.CREATE,
            after_value={'dose': '15mg', 'time': datetime.now().isoformat()}
        )
        
        # 3. Track in analytics
        analytics_engine = analytics.get_analytics_engine()
        med_patterns = analytics_engine.analyze_medication_patterns("TEST001")
        assert 'effectiveness' in med_patterns

def run_all_tests():
    """Run all integration tests"""
    pytest.main([__file__, '-v', '--tb=short'])

if __name__ == "__main__":
    run_all_tests()
