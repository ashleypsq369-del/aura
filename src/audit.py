"""Audit Module - Comprehensive Audit Trail and Compliance"""

from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
import json

class AuditAction(Enum):
    """Types of auditable actions"""
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    ACCESS = "access"
    EXPORT = "export"
    PRINT = "print"
    SHARE = "share"

class AuditCategory(Enum):
    """Audit categories"""
    AUTHENTICATION = "authentication"
    PATIENT_DATA = "patient_data"
    MEDICATION = "medication"
    CLINICAL_NOTE = "clinical_note"
    CARE_PLAN = "care_plan"
    ALERT = "alert"
    REPORT = "report"
    SYSTEM = "system"
    SECURITY = "security"

@dataclass
class AuditEntry:
    """Audit trail entry"""
    audit_id: str
    timestamp: datetime
    user_id: str
    user_name: str
    user_role: str
    action: AuditAction
    category: AuditCategory
    resource_type: str
    resource_id: str
    description: str
    ip_address: Optional[str] = None
    session_id: Optional[str] = None
    before_value: Optional[Dict] = None
    after_value: Optional[Dict] = None
    metadata: Optional[Dict] = None
    success: bool = True
    error_message: Optional[str] = None

class AuditLogger:
    """Comprehensive audit logging system"""
    
    def __init__(self):
        self.audit_trail: List[AuditEntry] = []
        self.retention_days = 2555  # 7 years for HIPAA compliance
    
    def log_action(self, user_id: str, user_name: str, user_role: str,
                   action: AuditAction, category: AuditCategory,
                   resource_type: str, resource_id: str, description: str,
                   ip_address: Optional[str] = None, session_id: Optional[str] = None,
                   before_value: Optional[Dict] = None, after_value: Optional[Dict] = None,
                   metadata: Optional[Dict] = None, success: bool = True,
                   error_message: Optional[str] = None) -> AuditEntry:
        """Log an auditable action"""
        audit_id = f"AUD-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        
        entry = AuditEntry(
            audit_id=audit_id,
            timestamp=datetime.now(),
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            action=action,
            category=category,
            resource_type=resource_type,
            resource_id=resource_id,
            description=description,
            ip_address=ip_address,
            session_id=session_id,
            before_value=before_value,
            after_value=after_value,
            metadata=metadata,
            success=success,
            error_message=error_message
        )
        
        self.audit_trail.append(entry)
        return entry
    
    def log_login(self, user_id: str, user_name: str, user_role: str,
                  ip_address: str, success: bool = True,
                  error_message: Optional[str] = None) -> AuditEntry:
        """Log user login attempt"""
        return self.log_action(
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            action=AuditAction.LOGIN,
            category=AuditCategory.AUTHENTICATION,
            resource_type="user_session",
            resource_id=user_id,
            description=f"User {user_name} login {'successful' if success else 'failed'}",
            ip_address=ip_address,
            success=success,
            error_message=error_message
        )
    
    def log_logout(self, user_id: str, user_name: str, user_role: str,
                   session_id: str) -> AuditEntry:
        """Log user logout"""
        return self.log_action(
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            action=AuditAction.LOGOUT,
            category=AuditCategory.AUTHENTICATION,
            resource_type="user_session",
            resource_id=user_id,
            description=f"User {user_name} logged out",
            session_id=session_id
        )
    
    def log_patient_access(self, user_id: str, user_name: str, user_role: str,
                          patient_id: str, action: AuditAction,
                          description: str) -> AuditEntry:
        """Log patient data access"""
        return self.log_action(
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            action=action,
            category=AuditCategory.PATIENT_DATA,
            resource_type="patient",
            resource_id=patient_id,
            description=description
        )
    
    def log_medication_action(self, user_id: str, user_name: str, user_role: str,
                             patient_id: str, medication: str, action: AuditAction,
                             before_value: Optional[Dict] = None,
                             after_value: Optional[Dict] = None) -> AuditEntry:
        """Log medication-related action"""
        return self.log_action(
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            action=action,
            category=AuditCategory.MEDICATION,
            resource_type="medication",
            resource_id=f"{patient_id}_{medication}",
            description=f"Medication {action.value}: {medication} for patient {patient_id}",
            before_value=before_value,
            after_value=after_value
        )
    
    def log_clinical_note(self, user_id: str, user_name: str, user_role: str,
                         patient_id: str, note_id: str, action: AuditAction) -> AuditEntry:
        """Log clinical note action"""
        return self.log_action(
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            action=action,
            category=AuditCategory.CLINICAL_NOTE,
            resource_type="clinical_note",
            resource_id=note_id,
            description=f"Clinical note {action.value} for patient {patient_id}"
        )
    
    def log_care_plan_change(self, user_id: str, user_name: str, user_role: str,
                            patient_id: str, before_value: Dict,
                            after_value: Dict) -> AuditEntry:
        """Log care plan modification"""
        return self.log_action(
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            action=AuditAction.UPDATE,
            category=AuditCategory.CARE_PLAN,
            resource_type="care_plan",
            resource_id=patient_id,
            description=f"Care plan updated for patient {patient_id}",
            before_value=before_value,
            after_value=after_value
        )
    
    def log_alert_action(self, user_id: str, user_name: str, user_role: str,
                        alert_id: str, action: AuditAction,
                        description: str) -> AuditEntry:
        """Log alert-related action"""
        return self.log_action(
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            action=action,
            category=AuditCategory.ALERT,
            resource_type="alert",
            resource_id=alert_id,
            description=description
        )
    
    def log_report_generation(self, user_id: str, user_name: str, user_role: str,
                             report_type: str, report_id: str,
                             parameters: Dict) -> AuditEntry:
        """Log report generation"""
        return self.log_action(
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            action=AuditAction.CREATE,
            category=AuditCategory.REPORT,
            resource_type="report",
            resource_id=report_id,
            description=f"Generated {report_type} report",
            metadata=parameters
        )
    
    def log_data_export(self, user_id: str, user_name: str, user_role: str,
                       export_type: str, record_count: int,
                       patient_ids: List[str]) -> AuditEntry:
        """Log data export"""
        return self.log_action(
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            action=AuditAction.EXPORT,
            category=AuditCategory.PATIENT_DATA,
            resource_type="data_export",
            resource_id=f"export_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            description=f"Exported {record_count} {export_type} records",
            metadata={'patient_ids': patient_ids, 'record_count': record_count}
        )
    
    def log_security_event(self, user_id: str, event_type: str,
                          description: str, severity: str,
                          ip_address: Optional[str] = None) -> AuditEntry:
        """Log security event"""
        return self.log_action(
            user_id=user_id,
            user_name="System",
            user_role="System",
            action=AuditAction.ACCESS,
            category=AuditCategory.SECURITY,
            resource_type="security_event",
            resource_id=f"sec_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            description=description,
            ip_address=ip_address,
            metadata={'event_type': event_type, 'severity': severity}
        )
    
    def get_audit_trail(self, start_date: Optional[datetime] = None,
                       end_date: Optional[datetime] = None,
                       user_id: Optional[str] = None,
                       category: Optional[AuditCategory] = None,
                       action: Optional[AuditAction] = None,
                       resource_id: Optional[str] = None) -> List[AuditEntry]:
        """Retrieve audit trail with filters"""
        filtered_entries = self.audit_trail
        
        if start_date:
            filtered_entries = [e for e in filtered_entries if e.timestamp >= start_date]
        
        if end_date:
            filtered_entries = [e for e in filtered_entries if e.timestamp <= end_date]
        
        if user_id:
            filtered_entries = [e for e in filtered_entries if e.user_id == user_id]
        
        if category:
            filtered_entries = [e for e in filtered_entries if e.category == category]
        
        if action:
            filtered_entries = [e for e in filtered_entries if e.action == action]
        
        if resource_id:
            filtered_entries = [e for e in filtered_entries if e.resource_id == resource_id]
        
        return sorted(filtered_entries, key=lambda x: x.timestamp, reverse=True)
    
    def get_user_activity(self, user_id: str, days: int = 30) -> Dict:
        """Get user activity summary"""
        cutoff_date = datetime.now() - timedelta(days=days)
        user_entries = [e for e in self.audit_trail 
                       if e.user_id == user_id and e.timestamp >= cutoff_date]
        
        activity = {
            'total_actions': len(user_entries),
            'by_action': {},
            'by_category': {},
            'by_day': {},
            'most_accessed_resources': {},
            'failed_actions': len([e for e in user_entries if not e.success])
        }
        
        # Count by action type
        for action in AuditAction:
            count = len([e for e in user_entries if e.action == action])
            if count > 0:
                activity['by_action'][action.value] = count
        
        # Count by category
        for category in AuditCategory:
            count = len([e for e in user_entries if e.category == category])
            if count > 0:
                activity['by_category'][category.value] = count
        
        return activity
    
    def get_patient_access_log(self, patient_id: str) -> List[AuditEntry]:
        """Get all access logs for a specific patient"""
        return [e for e in self.audit_trail 
                if e.resource_id == patient_id or 
                (e.metadata and e.metadata.get('patient_id') == patient_id)]
    
    def detect_suspicious_activity(self) -> List[Dict]:
        """Detect potentially suspicious activity"""
        suspicious_events = []
        
        # Check for multiple failed login attempts
        recent_logins = [e for e in self.audit_trail 
                        if e.action == AuditAction.LOGIN 
                        and e.timestamp >= datetime.now() - timedelta(hours=1)]
        
        failed_by_user = {}
        for entry in recent_logins:
            if not entry.success:
                failed_by_user[entry.user_id] = failed_by_user.get(entry.user_id, 0) + 1
        
        for user_id, count in failed_by_user.items():
            if count >= 3:
                suspicious_events.append({
                    'type': 'multiple_failed_logins',
                    'user_id': user_id,
                    'count': count,
                    'severity': 'high'
                })
        
        # Check for unusual access patterns
        recent_access = [e for e in self.audit_trail 
                        if e.category == AuditCategory.PATIENT_DATA 
                        and e.timestamp >= datetime.now() - timedelta(hours=1)]
        
        access_by_user = {}
        for entry in recent_access:
            access_by_user[entry.user_id] = access_by_user.get(entry.user_id, 0) + 1
        
        for user_id, count in access_by_user.items():
            if count > 50:  # Unusually high access rate
                suspicious_events.append({
                    'type': 'unusual_access_volume',
                    'user_id': user_id,
                    'count': count,
                    'severity': 'medium'
                })
        
        return suspicious_events
    
    def generate_compliance_report(self, start_date: datetime, 
                                   end_date: datetime) -> Dict:
        """Generate compliance report for audit period"""
        period_entries = [e for e in self.audit_trail 
                         if start_date <= e.timestamp <= end_date]
        
        report = {
            'period': f"{start_date.date()} to {end_date.date()}",
            'total_events': len(period_entries),
            'by_category': {},
            'by_user_role': {},
            'failed_actions': len([e for e in period_entries if not e.success]),
            'security_events': len([e for e in period_entries 
                                   if e.category == AuditCategory.SECURITY]),
            'patient_data_access': len([e for e in period_entries 
                                       if e.category == AuditCategory.PATIENT_DATA]),
            'medication_actions': len([e for e in period_entries 
                                      if e.category == AuditCategory.MEDICATION]),
            'unique_users': len(set(e.user_id for e in period_entries)),
            'suspicious_activity': self.detect_suspicious_activity()
        }
        
        # Count by category
        for category in AuditCategory:
            count = len([e for e in period_entries if e.category == category])
            report['by_category'][category.value] = count
        
        # Count by user role
        role_counts = {}
        for entry in period_entries:
            role_counts[entry.user_role] = role_counts.get(entry.user_role, 0) + 1
        report['by_user_role'] = role_counts
        
        return report
    
    def export_audit_trail(self, start_date: datetime, end_date: datetime,
                          format: str = 'json') -> str:
        """Export audit trail for specified period"""
        entries = self.get_audit_trail(start_date=start_date, end_date=end_date)
        
        if format == 'json':
            export_data = []
            for entry in entries:
                export_data.append({
                    'audit_id': entry.audit_id,
                    'timestamp': entry.timestamp.isoformat(),
                    'user_id': entry.user_id,
                    'user_name': entry.user_name,
                    'user_role': entry.user_role,
                    'action': entry.action.value,
                    'category': entry.category.value,
                    'resource_type': entry.resource_type,
                    'resource_id': entry.resource_id,
                    'description': entry.description,
                    'success': entry.success
                })
            
            return json.dumps(export_data, indent=2)
        
        return "Export format not supported"

# Global audit logger instance
audit_logger = AuditLogger()

def get_audit_logger() -> AuditLogger:
    """Get the global audit logger instance"""
    return audit_logger

# Import timedelta for use in methods
from datetime import timedelta
