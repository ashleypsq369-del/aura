"""
NotificationQueue Service - Monitor and Alert System
Monitors appointments, medications, and critical vitals
Sends alerts to patients, caregivers, and clinicians
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from src.db import (
    Appointment, Medication, Vital, Alert, NotificationQueue,
    Patient, User, PatientFamilyLink, MedicationAdherenceLog
)


def check_upcoming_appointments(db: Session):
    """
    Check for upcoming appointments and create notifications
    - 24 hours before: Reminder to patient and caregiver
    - 1 hour before: Final reminder
    """
    now = datetime.utcnow()
    tomorrow = now + timedelta(hours=24)
    one_hour_ahead = now + timedelta(hours=1)
    
    alerts_created = 0
    
    # Find appointments in next 24 hours (for 24h reminder)
    appointments_24h = db.query(Appointment).filter(
        Appointment.scheduled_at >= now,
        Appointment.scheduled_at <= tomorrow,
        Appointment.status == 'scheduled'
    ).all()
    
    for appt in appointments_24h:
        # Check if we already sent 24h reminder
        existing = db.query(NotificationQueue).filter(
            NotificationQueue.recipient_id == appt.patient_id,
            NotificationQueue.notification_type == 'appointment_reminder_24h',
            NotificationQueue.related_alert_id == appt.id,
            NotificationQueue.created_at >= now - timedelta(hours=1)
        ).first()
        
        if not existing:
            # Create notification for patient
            notification = NotificationQueue(
                recipient_id=appt.patient_id,
                notification_type='appointment_reminder_24h',
                title='Appointment Tomorrow',
                body=f"Reminder: {appt.appointment_type} appointment tomorrow at {appt.scheduled_at.strftime('%I:%M %p')} at {appt.location}",
                related_alert_id=appt.id,
                is_read=False,
                is_sent=True,
                sent_at=now
            )
            db.add(notification)
            alerts_created += 1
            
            # Alert caregiver/family
            family_links = db.query(PatientFamilyLink).filter(
                PatientFamilyLink.patient_id == appt.patient_id
            ).all()
            
            for link in family_links:
                family_notif = NotificationQueue(
                    recipient_id=link.family_user_id,
                    notification_type='appointment_reminder_24h',
                    title=f'Appointment Reminder for Patient',
                    body=f"Patient has {appt.appointment_type} appointment tomorrow at {appt.scheduled_at.strftime('%I:%M %p')}",
                    related_alert_id=appt.id,
                    is_read=False,
                    is_sent=True,
                    sent_at=now
                )
                db.add(family_notif)
    
    # Find appointments in next 1 hour (for 1h reminder)
    appointments_1h = db.query(Appointment).filter(
        Appointment.scheduled_at >= now,
        Appointment.scheduled_at <= one_hour_ahead,
        Appointment.status == 'scheduled'
    ).all()
    
    for appt in appointments_1h:
        # Check if we already sent 1h reminder
        existing = db.query(NotificationQueue).filter(
            NotificationQueue.recipient_id == appt.patient_id,
            NotificationQueue.notification_type == 'appointment_reminder_1h',
            NotificationQueue.related_alert_id == appt.id,
            NotificationQueue.created_at >= now - timedelta(minutes=30)
        ).first()
        
        if not existing:
            # Create urgent notification for patient
            notification = NotificationQueue(
                recipient_id=appt.patient_id,
                notification_type='appointment_reminder_1h',
                title='Appointment Starting Soon!',
                body=f"Your {appt.appointment_type} appointment starts in less than 1 hour at {appt.location}",
                related_alert_id=appt.id,
                is_read=False,
                is_sent=True,
                sent_at=now
            )
            db.add(notification)
            alerts_created += 1
    
    db.commit()
    return alerts_created


def check_medication_schedule(db: Session):
    """
    Check for upcoming and missed medications
    - 15 minutes before: Reminder to patient
    - At dose time: Alert to take medication
    - 30 minutes after: Mark as missed, alert caregiver
    """
    now = datetime.utcnow()
    alerts_created = 0
    
    # Get all active medications
    active_meds = db.query(Medication).filter(
        Medication.is_active == True
    ).all()
    
    for med in active_meds:
        # Skip PRN medications (take as needed)
        if med.is_prn:
            continue
        
        # Calculate next scheduled dose based on frequency
        next_dose_time = calculate_next_dose_time(med, now)
        
        if not next_dose_time:
            continue
        
        # Check if dose is upcoming (within 15 minutes)
        if timedelta(minutes=0) <= (next_dose_time - now) <= timedelta(minutes=15):
            # Create reminder notification
            existing = db.query(NotificationQueue).filter(
                NotificationQueue.patient_id == med.patient_id,
                NotificationQueue.notification_type == 'medication_reminder',
                NotificationQueue.related_id == med.id,
                NotificationQueue.created_at >= now - timedelta(minutes=10)
            ).first()
            
            if not existing:
                notification = NotificationQueue(
                    patient_id=med.patient_id,
                    notification_type='medication_reminder',
                    title='Medication Due Soon',
                    message=f"Time to take {med.name} ({med.dose}) in 15 minutes",
                    # priority='medium',
                    related_alert_id=med.id,
                    is_read=False
                )
                db.add(notification)
                alerts_created += 1
        
        # Check if dose time has passed (missed dose)
        if now > next_dose_time + timedelta(minutes=30):
            # Check if already logged as taken
            taken_log = db.query(MedicationAdherenceLog).filter(
                MedicationAdherenceLog.medication_id == med.id,
                MedicationAdherenceLog.scheduled_at == next_dose_time,
                MedicationAdherenceLog.taken == True
            ).first()
            
            if not taken_log:
                # Check if already created missed alert
                existing = db.query(NotificationQueue).filter(
                    NotificationQueue.patient_id == med.patient_id,
                    NotificationQueue.notification_type == 'medication_missed',
                    NotificationQueue.related_id == med.id,
                    NotificationQueue.created_at >= next_dose_time
                ).first()
                
                if not existing:
                    # Log as missed
                    missed_log = MedicationAdherenceLog(
                        medication_id=med.id,
                        patient_id=med.patient_id,
                        scheduled_at=next_dose_time,
                        taken=False,
                        skipped_reason='Missed - not taken within 30 minutes'
                    )
                    db.add(missed_log)
                    
                    # Alert patient
                    notification = NotificationQueue(
                        patient_id=med.patient_id,
                        notification_type='medication_missed',
                        title='Missed Medication',
                        message=f"You missed your {med.name} dose scheduled for {next_dose_time.strftime('%I:%M %p')}",
                        # priority='high',
                        related_alert_id=med.id,
                        is_read=False
                    )
                    db.add(notification)
                    
                    # Alert caregiver/family
                    family_links = db.query(PatientFamilyLink).filter(
                        PatientFamilyLink.patient_id == med.patient_id
                    ).all()
                    
                    for link in family_links:
                        family_notif = NotificationQueue(
                            user_id=link.family_user_id,
                            notification_type='medication_missed',
                            title='Patient Missed Medication',
                            message=f"Patient missed {med.name} dose at {next_dose_time.strftime('%I:%M %p')}",
                            # priority='high',
                            related_alert_id=med.id,
                            is_read=False
                        )
                        db.add(family_notif)
                    
                    alerts_created += 1
    
    db.commit()
    return alerts_created


def check_critical_vitals(db: Session):
    """
    Monitor latest vitals for critical values
    Alert clinician and caregiver immediately for:
    - O2 saturation < 90%
    - Heart rate < 50 or > 120
    - Blood pressure systolic > 180 or < 90
    - Temperature > 38.5°C or < 35°C
    """
    alerts_created = 0
    
    # Get all active patients
    patients = db.query(Patient).filter(
        Patient.status.in_(['active', 'critical'])
    ).all()
    
    for patient in patients:
        # Get latest vitals (within last 30 minutes)
        latest_vital = db.query(Vital).filter(
            Vital.patient_id == patient.id,
            Vital.recorded_at >= datetime.utcnow() - timedelta(minutes=30)
        ).order_by(Vital.recorded_at.desc()).first()
        
        if not latest_vital:
            continue
        
        critical_issues = []
        
        # Check O2 saturation
        if latest_vital.oxygen_saturation and latest_vital.oxygen_saturation < 90:
            critical_issues.append(f"Critical hypoxemia: O2 sat {latest_vital.oxygen_saturation}%")
        
        # Check heart rate
        if latest_vital.heart_rate:
            if latest_vital.heart_rate < 50:
                critical_issues.append(f"Critical bradycardia: HR {latest_vital.heart_rate} bpm")
            elif latest_vital.heart_rate > 120:
                critical_issues.append(f"Critical tachycardia: HR {latest_vital.heart_rate} bpm")
        
        # Check blood pressure
        if latest_vital.blood_pressure_sys:
            if latest_vital.blood_pressure_sys > 180:
                critical_issues.append(f"Critical hypertension: BP {latest_vital.blood_pressure_sys} mmHg")
            elif latest_vital.blood_pressure_sys < 90:
                critical_issues.append(f"Critical hypotension: BP {latest_vital.blood_pressure_sys} mmHg")
        
        # Check temperature
        if latest_vital.temperature:
            if latest_vital.temperature > 38.5:
                critical_issues.append(f"High fever: {latest_vital.temperature}°C")
            elif latest_vital.temperature < 35:
                critical_issues.append(f"Hypothermia: {latest_vital.temperature}°C")
        
        if critical_issues:
            # Check if alert already exists for this vital reading
            existing = db.query(Alert).filter(
                Alert.patient_id == patient.id,
                Alert.alert_type == 'critical_vitals',
                Alert.created_at >= latest_vital.recorded_at - timedelta(minutes=5)
            ).first()
            
            if not existing:
                # Create critical alert
                alert = Alert(
                    patient_id=patient.id,
                    alert_type='critical_vitals',
                    severity='critical',
                    message='; '.join(critical_issues),
                    triggered_value=f"Vitals recorded at {latest_vital.recorded_at.strftime('%I:%M %p')}",
                    is_acknowledged=False
                )
                db.add(alert)
                
                # Notify clinician
                if patient.primary_clinician_id:
                    clinician_notif = NotificationQueue(
                        user_id=patient.primary_clinician_id,
                        notification_type='critical_vitals',
                        title=f'🚨 CRITICAL VITALS: {patient.full_name}',
                        message='; '.join(critical_issues),
                        # priority='critical',
                        related_alert_id=patient.id,
                        is_read=False
                    )
                    db.add(clinician_notif)
                
                # Notify caregiver/family
                family_links = db.query(PatientFamilyLink).filter(
                    PatientFamilyLink.patient_id == patient.id
                ).all()
                
                for link in family_links:
                    family_notif = NotificationQueue(
                        user_id=link.family_user_id,
                        notification_type='critical_vitals',
                        title=f'Patient Needs Immediate Attention',
                        message=f"Critical vital signs detected. Please check on patient immediately.",
                        # priority='critical',
                        related_alert_id=patient.id,
                        is_read=False
                    )
                    db.add(family_notif)
                
                alerts_created += 1
    
    db.commit()
    return alerts_created


def calculate_next_dose_time(medication: Medication, current_time: datetime) -> datetime:
    """
    Calculate next scheduled dose time based on medication frequency
    Returns None if cannot calculate
    """
    if not medication.frequency:
        return None
    
    freq = medication.frequency.lower()
    
    # Parse frequency
    if 'every 4 hours' in freq or 'q4h' in freq:
        hours = 4
    elif 'every 6 hours' in freq or 'q6h' in freq:
        hours = 6
    elif 'every 8 hours' in freq or 'q8h' in freq:
        hours = 8
    elif 'every 12 hours' in freq or 'q12h' in freq or 'twice daily' in freq or 'bid' in freq:
        hours = 12
    elif 'once daily' in freq or 'daily' in freq or 'qd' in freq:
        hours = 24
    elif 'twice a day' in freq:
        hours = 12
    elif 'three times a day' in freq or 'tid' in freq:
        hours = 8
    elif 'four times a day' in freq or 'qid' in freq:
        hours = 6
    else:
        return None
    
    # Calculate next dose (round to next interval)
    start_time = medication.start_date or medication.created_at
    hours_since_start = (current_time - start_time).total_seconds() / 3600
    next_dose_interval = int(hours_since_start / hours) + 1
    next_dose_time = start_time + timedelta(hours=hours * next_dose_interval)
    
    return next_dose_time


def send_alert_to_role(db: Session, patient_id: int, alert_type: str, message: str, 
                       role: str, priority: str = 'medium'):
    """
    Send alert to specific role (clinician, caregiver, patient)
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return
    
    if role == 'clinician' and patient.primary_clinician_id:
        notification = NotificationQueue(
            user_id=patient.primary_clinician_id,
            notification_type=alert_type,
            title=f'Alert for {patient.full_name}',
            message=message,
            # priority=priority,
            related_alert_id=patient_id,
            is_read=False
        )
        db.add(notification)
    
    elif role == 'caregiver':
        family_links = db.query(PatientFamilyLink).filter(
            PatientFamilyLink.patient_id == patient_id
        ).all()
        
        for link in family_links:
            notification = NotificationQueue(
                user_id=link.family_user_id,
                notification_type=alert_type,
                title='Patient Alert',
                message=message,
                # priority=priority,
                related_alert_id=patient_id,
                is_read=False
            )
            db.add(notification)
    
    elif role == 'patient':
        notification = NotificationQueue(
            patient_id=patient_id,
            notification_type=alert_type,
            title='Health Alert',
            message=message,
            # priority=priority,
            related_alert_id=patient_id,
            is_read=False
        )
        db.add(notification)
    
    db.commit()



def create_message_notification(db: Session, recipient_id: int, sender_name: str, message_preview: str):
    """
    Create notification for new message
    Used by messaging system
    """
    try:
        notification = NotificationQueue(
            recipient_id=recipient_id,
            notification_type='new_message',
            title=f'New message from {sender_name}',
            body=message_preview[:100] if message_preview else 'You have a new message',
            is_read=False,
            is_sent=True,
            sent_at=datetime.utcnow()
        )
        db.add(notification)
        db.commit()
        return notification
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to create message notification: {e}")
        return None


def _deliver_to_user(db, user_id: int, title: str, body: str,
                     alert_type: str, patient_name: str = "", critical: bool = False):
    """Fire SMS + Web Push delivery for a user alongside the DB notification."""
    try:
        from services.delivery_service import deliver_notification
        from src.db import PushSubscription, User
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return
        subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
        push_payloads = [
            {"endpoint": s.endpoint, "keys": {"p256dh": s.p256dh, "auth": s.auth}}
            for s in subs
        ]
        deliver_notification(
            user_phone=user.phone,
            user_email=user.email,
            push_subscriptions=push_payloads,
            title=title,
            body=body,
            alert_type=alert_type,
            patient_name=patient_name,
            critical=critical,
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Delivery failed for user {user_id}: {e}")


def dispatch_critical_alert(db, patient_id: int, alert_type: str,
                             message: str, patient_name: str = ""):
    """
    Create in-app notification AND fire SMS + Push for critical alerts.
    Call this from check_critical_vitals, ML risk triggers, crisis detection.
    """
    from src.db import Patient, PatientFamilyLink, NotificationQueue, User
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient and not patient_name:
        patient_name = patient.full_name or f"Patient #{patient_id}"

    # Recipients: clinicians + family
    recipient_ids = []
    if patient and patient.primary_clinician_id:
        recipient_ids.append(patient.primary_clinician_id)
    for link in db.query(PatientFamilyLink).filter(
        PatientFamilyLink.patient_id == patient_id
    ).all():
        recipient_ids.append(link.family_user_id)

    title = f"🚨 {alert_type.replace('_', ' ').title()} — {patient_name}"

    for uid in recipient_ids:
        # In-app notification
        notif = NotificationQueue(
            recipient_id=uid,
            notification_type=alert_type,
            title=title,
            body=message,
            is_sent=True,
            sent_at=__import__('datetime').datetime.utcnow(),
            is_read=False,
        )
        db.add(notif)
        # SMS + Push
        _deliver_to_user(db, uid, title, message, alert_type, patient_name, critical=True)

    db.commit()
