"""Notifications Module - Multi-channel Notification System"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from enum import Enum

class NotificationChannel(Enum):
    """Notification delivery channels"""
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in_app"
    PHONE_CALL = "phone_call"

class NotificationPriority(Enum):
    """Notification priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class NotificationStatus(Enum):
    """Notification delivery status"""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"

@dataclass
class Notification:
    """Notification data structure"""
    notification_id: str
    recipient_id: str
    recipient_name: str
    channel: NotificationChannel
    priority: NotificationPriority
    title: str
    message: str
    created_at: datetime
    status: NotificationStatus
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    metadata: Optional[Dict] = None
    action_url: Optional[str] = None
    expires_at: Optional[datetime] = None

class NotificationManager:
    """Manages multi-channel notifications"""
    
    def __init__(self):
        self.notifications: List[Notification] = []
        self.user_preferences = {}
    
    def create_notification(self, recipient_id: str, recipient_name: str,
                          channel: NotificationChannel, priority: NotificationPriority,
                          title: str, message: str, action_url: Optional[str] = None,
                          metadata: Optional[Dict] = None,
                          expires_in_hours: Optional[int] = None) -> Notification:
        """Create a new notification"""
        notification_id = f"NOT-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        
        expires_at = None
        if expires_in_hours:
            expires_at = datetime.now() + timedelta(hours=expires_in_hours)
        
        notification = Notification(
            notification_id=notification_id,
            recipient_id=recipient_id,
            recipient_name=recipient_name,
            channel=channel,
            priority=priority,
            title=title,
            message=message,
            created_at=datetime.now(),
            status=NotificationStatus.PENDING,
            metadata=metadata or {},
            action_url=action_url,
            expires_at=expires_at
        )
        
        self.notifications.append(notification)
        return notification
    
    def send_notification(self, notification_id: str) -> bool:
        """Send a notification"""
        for notification in self.notifications:
            if notification.notification_id == notification_id:
                # Simulate sending (in production, integrate with actual services)
                notification.status = NotificationStatus.SENT
                notification.sent_at = datetime.now()
                
                # Simulate delivery
                notification.status = NotificationStatus.DELIVERED
                notification.delivered_at = datetime.now()
                
                return True
        return False
    
    def mark_as_read(self, notification_id: str) -> bool:
        """Mark notification as read"""
        for notification in self.notifications:
            if notification.notification_id == notification_id:
                notification.status = NotificationStatus.READ
                notification.read_at = datetime.now()
                return True
        return False
    
    def send_pain_alert(self, patient_id: str, patient_name: str,
                       pain_level: int, care_team: List[Dict]) -> List[Notification]:
        """Send pain level alert to care team"""
        notifications = []
        
        priority = NotificationPriority.URGENT if pain_level >= 8 else NotificationPriority.HIGH
        
        for member in care_team:
            # Determine channel based on priority and user preferences
            channels = self._get_preferred_channels(member['user_id'], priority)
            
            for channel in channels:
                notification = self.create_notification(
                    recipient_id=member['user_id'],
                    recipient_name=member['name'],
                    channel=channel,
                    priority=priority,
                    title=f"Pain Alert: {patient_name}",
                    message=f"Patient {patient_name} reported pain level {pain_level}/10. Immediate assessment recommended.",
                    action_url=f"/patient/{patient_id}/assessment",
                    metadata={'patient_id': patient_id, 'pain_level': pain_level}
                )
                
                self.send_notification(notification.notification_id)
                notifications.append(notification)
        
        return notifications
    
    def send_medication_reminder(self, patient_id: str, patient_name: str,
                                medication: str, scheduled_time: datetime,
                                caregiver_contacts: List[Dict]) -> List[Notification]:
        """Send medication reminder"""
        notifications = []
        
        for contact in caregiver_contacts:
            notification = self.create_notification(
                recipient_id=contact['user_id'],
                recipient_name=contact['name'],
                channel=NotificationChannel.SMS,
                priority=NotificationPriority.MEDIUM,
                title="Medication Reminder",
                message=f"Reminder: {medication} due for {patient_name} at {scheduled_time.strftime('%I:%M %p')}",
                metadata={'patient_id': patient_id, 'medication': medication}
            )
            
            self.send_notification(notification.notification_id)
            notifications.append(notification)
        
        return notifications
    
    def send_appointment_reminder(self, patient_id: str, patient_name: str,
                                 appointment_type: str, appointment_time: datetime,
                                 contacts: List[Dict]) -> List[Notification]:
        """Send appointment reminder"""
        notifications = []
        
        for contact in contacts:
            notification = self.create_notification(
                recipient_id=contact['user_id'],
                recipient_name=contact['name'],
                channel=NotificationChannel.EMAIL,
                priority=NotificationPriority.MEDIUM,
                title="Appointment Reminder",
                message=f"Upcoming {appointment_type} appointment for {patient_name} on {appointment_time.strftime('%B %d at %I:%M %p')}",
                action_url=f"/appointments/{patient_id}",
                metadata={'patient_id': patient_id, 'appointment_type': appointment_type}
            )
            
            self.send_notification(notification.notification_id)
            notifications.append(notification)
        
        return notifications
    
    def send_care_plan_update(self, patient_id: str, patient_name: str,
                             update_summary: str, care_team: List[Dict]) -> List[Notification]:
        """Send care plan update notification"""
        notifications = []
        
        for member in care_team:
            notification = self.create_notification(
                recipient_id=member['user_id'],
                recipient_name=member['name'],
                channel=NotificationChannel.IN_APP,
                priority=NotificationPriority.MEDIUM,
                title=f"Care Plan Updated: {patient_name}",
                message=update_summary,
                action_url=f"/patient/{patient_id}/care-plan",
                metadata={'patient_id': patient_id}
            )
            
            self.send_notification(notification.notification_id)
            notifications.append(notification)
        
        return notifications
    
    def send_emergency_alert(self, patient_id: str, patient_name: str,
                           emergency_type: str, details: str,
                           emergency_contacts: List[Dict]) -> List[Notification]:
        """Send emergency alert"""
        notifications = []
        
        for contact in emergency_contacts:
            # Send via multiple channels for emergencies
            for channel in [NotificationChannel.PHONE_CALL, NotificationChannel.SMS, NotificationChannel.PUSH]:
                notification = self.create_notification(
                    recipient_id=contact['user_id'],
                    recipient_name=contact['name'],
                    channel=channel,
                    priority=NotificationPriority.URGENT,
                    title=f"EMERGENCY: {patient_name}",
                    message=f"{emergency_type}: {details}",
                    action_url=f"/patient/{patient_id}/emergency",
                    metadata={'patient_id': patient_id, 'emergency_type': emergency_type}
                )
                
                self.send_notification(notification.notification_id)
                notifications.append(notification)
        
        return notifications
    
    def send_family_update(self, patient_id: str, patient_name: str,
                          update_message: str, family_members: List[Dict]) -> List[Notification]:
        """Send update to family members"""
        notifications = []
        
        for member in family_members:
            notification = self.create_notification(
                recipient_id=member['user_id'],
                recipient_name=member['name'],
                channel=NotificationChannel.EMAIL,
                priority=NotificationPriority.LOW,
                title=f"Update on {patient_name}",
                message=update_message,
                action_url=f"/family-portal/{patient_id}",
                metadata={'patient_id': patient_id}
            )
            
            self.send_notification(notification.notification_id)
            notifications.append(notification)
        
        return notifications
    
    def send_bereavement_support(self, family_id: str, family_name: str,
                                message: str, resources: List[str]) -> Notification:
        """Send bereavement support notification"""
        notification = self.create_notification(
            recipient_id=family_id,
            recipient_name=family_name,
            channel=NotificationChannel.EMAIL,
            priority=NotificationPriority.MEDIUM,
            title="Bereavement Support Resources",
            message=message,
            action_url="/bereavement-support",
            metadata={'resources': resources}
        )
        
        self.send_notification(notification.notification_id)
        return notification
    
    def send_survey_request(self, recipient_id: str, recipient_name: str,
                           survey_type: str, survey_url: str) -> Notification:
        """Send satisfaction survey request"""
        notification = self.create_notification(
            recipient_id=recipient_id,
            recipient_name=recipient_name,
            channel=NotificationChannel.EMAIL,
            priority=NotificationPriority.LOW,
            title="Your Feedback Matters",
            message=f"Please take a moment to complete our {survey_type} survey. Your feedback helps us improve our care.",
            action_url=survey_url,
            expires_in_hours=168  # 7 days
        )
        
        self.send_notification(notification.notification_id)
        return notification
    
    def _get_preferred_channels(self, user_id: str, 
                               priority: NotificationPriority) -> List[NotificationChannel]:
        """Get user's preferred notification channels based on priority"""
        # Default preferences
        preferences = self.user_preferences.get(user_id, {
            NotificationPriority.LOW: [NotificationChannel.EMAIL],
            NotificationPriority.MEDIUM: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
            NotificationPriority.HIGH: [NotificationChannel.SMS, NotificationChannel.PUSH],
            NotificationPriority.URGENT: [NotificationChannel.PHONE_CALL, NotificationChannel.SMS, NotificationChannel.PUSH]
        })
        
        return preferences.get(priority, [NotificationChannel.IN_APP])
    
    def set_user_preferences(self, user_id: str, preferences: Dict) -> None:
        """Set notification preferences for a user"""
        self.user_preferences[user_id] = preferences
    
    def get_user_notifications(self, user_id: str, 
                              status: Optional[NotificationStatus] = None,
                              unread_only: bool = False) -> List[Notification]:
        """Get notifications for a user"""
        notifications = [n for n in self.notifications if n.recipient_id == user_id]
        
        if status:
            notifications = [n for n in notifications if n.status == status]
        
        if unread_only:
            notifications = [n for n in notifications if n.status != NotificationStatus.READ]
        
        # Filter out expired notifications
        now = datetime.now()
        notifications = [n for n in notifications 
                        if not n.expires_at or n.expires_at > now]
        
        return sorted(notifications, key=lambda x: x.created_at, reverse=True)
    
    def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications"""
        return len(self.get_user_notifications(user_id, unread_only=True))
    
    def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications as read for a user"""
        count = 0
        for notification in self.notifications:
            if (notification.recipient_id == user_id and 
                notification.status != NotificationStatus.READ):
                notification.status = NotificationStatus.READ
                notification.read_at = datetime.now()
                count += 1
        return count
    
    def delete_notification(self, notification_id: str) -> bool:
        """Delete a notification"""
        for i, notification in enumerate(self.notifications):
            if notification.notification_id == notification_id:
                del self.notifications[i]
                return True
        return False
    
    def get_notification_statistics(self, days: int = 30) -> Dict:
        """Get notification statistics"""
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_notifications = [n for n in self.notifications if n.created_at >= cutoff_date]
        
        stats = {
            'total_sent': len(recent_notifications),
            'by_channel': {},
            'by_priority': {},
            'by_status': {},
            'delivery_rate': 0,
            'read_rate': 0
        }
        
        # Count by channel
        for channel in NotificationChannel:
            count = len([n for n in recent_notifications if n.channel == channel])
            if count > 0:
                stats['by_channel'][channel.value] = count
        
        # Count by priority
        for priority in NotificationPriority:
            count = len([n for n in recent_notifications if n.priority == priority])
            if count > 0:
                stats['by_priority'][priority.value] = count
        
        # Count by status
        for status in NotificationStatus:
            count = len([n for n in recent_notifications if n.status == status])
            if count > 0:
                stats['by_status'][status.value] = count
        
        # Calculate rates
        if recent_notifications:
            delivered = len([n for n in recent_notifications 
                           if n.status in [NotificationStatus.DELIVERED, NotificationStatus.READ]])
            read = len([n for n in recent_notifications if n.status == NotificationStatus.READ])
            
            stats['delivery_rate'] = delivered / len(recent_notifications)
            stats['read_rate'] = read / len(recent_notifications)
        
        return stats
    
    def cleanup_old_notifications(self, days: int = 90) -> int:
        """Clean up old read notifications"""
        cutoff_date = datetime.now() - timedelta(days=days)
        initial_count = len(self.notifications)
        
        self.notifications = [n for n in self.notifications 
                            if not (n.status == NotificationStatus.READ and 
                                   n.read_at and n.read_at < cutoff_date)]
        
        return initial_count - len(self.notifications)

# Global notification manager instance
notification_manager = NotificationManager()

def get_notification_manager() -> NotificationManager:
    """Get the global notification manager instance"""
    return notification_manager
