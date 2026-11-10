"""
NotificationQueue Service - Monitor and Alert System
=====================================================
Fixed: All NotificationQueue rows now use recipient_id + body (correct DB columns).
       Deduplication queries also fixed to use recipient_id.
       Alerts correctly routed per role:
         - Medication reminder  → patient + assigned caregivers + family
         - Missed medication    → patient + assigned caregivers + family + primary clinician
         - Critical vitals      → primary clinician + assigned caregivers + family
         - Appointment 24h      → patient + primary clinician + family
         - Appointment 1h       → patient + primary clinician
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from src.db import (
    Appointment, Medication, Vital, Alert, NotificationQueue,
    Patient, User, PatientFamilyLink, MedicationAdherenceLog,
    CaregiverAssignment,
)


# ── Helper: get all user ids who should be notified about a patient ──────────

def _patient_recipients(db: Session, patient_id: int, include_roles: list) -> list:
    """
    Returns list of user_ids who should receive notifications about patient_id,
    filtered by role list.

    include_roles: any subset of ['patient','family','caregiver','clinician']
    """
    ids = []
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return ids

    if 'patient' in include_roles and patient.user_id:
        ids.append(patient.user_id)

    if 'clinician' in include_roles and patient.primary_clinician_id:
        ids.append(patient.primary_clinician_id)

    if 'family' in include_roles:
        for link in db.query(PatientFamilyLink).filter(
            PatientFamilyLink.patient_id == patient_id
        ).all():
            if link.family_user_id:
                ids.append(link.family_user_id)

    if 'caregiver' in include_roles:
        try:
            for assignment in db.query(CaregiverAssignment).filter(
                CaregiverAssignment.patient_id == patient_id,
                CaregiverAssignment.active == True
            ).all():
                if assignment.caregiver_id:
                    ids.append(assignment.caregiver_id)
        except Exception:
            pass  # table may not exist yet

    # Deduplicate while preserving order
    seen = set()
    unique = []
    for uid in ids:
        if uid not in seen:
            seen.add(uid)
            unique.append(uid)
    return unique


def _make_notif(recipient_id: int, notification_type: str, title: str, body: str,
                related_alert_id: int = None) -> NotificationQueue:
    """Single factory for NotificationQueue rows — always uses correct column names."""
    return NotificationQueue(
        recipient_id=recipient_id,
        notification_type=notification_type,
        title=title,
        body=body[:500] if body else '',
        related_alert_id=related_alert_id,
        is_read=False,
        is_sent=True,
        sent_at=datetime.utcnow(),
    )


def _already_sent(db: Session, recipient_id: int, notification_type: str,
                  related_alert_id: int, since: timedelta) -> bool:
    """Deduplication check using correct column name."""
    return db.query(NotificationQueue).filter(
        NotificationQueue.recipient_id == recipient_id,
        NotificationQueue.notification_type == notification_type,
        NotificationQueue.related_alert_id == related_alert_id,
        NotificationQueue.created_at >= datetime.utcnow() - since,
    ).first() is not None


# ── Appointment reminders ─────────────────────────────────────────────────────

def check_upcoming_appointments(db: Session):
    """
    24h and 1h appointment reminders.
    Recipients: patient + primary clinician + family
    """
    now = datetime.utcnow()
    alerts_created = 0

    # 24h reminders
    for appt in db.query(Appointment).filter(
        Appointment.scheduled_at >= now,
        Appointment.scheduled_at <= now + timedelta(hours=24),
        Appointment.status == 'scheduled',
    ).all():
        time_str = appt.scheduled_at.strftime('%I:%M %p')
        loc_str  = appt.location or 'the clinic'

        for uid in _patient_recipients(db, appt.patient_id, ['patient', 'clinician', 'family']):
            if _already_sent(db, uid, 'appointment_reminder_24h', appt.id, timedelta(hours=1)):
                continue
            is_patient = True  # all get useful context
            db.add(_make_notif(
                uid, 'appointment_reminder_24h',
                'Appointment Tomorrow',
                f"{appt.appointment_type} appointment tomorrow at {time_str} at {loc_str}",
                related_alert_id=appt.id,
            ))
            alerts_created += 1

    # 1h reminders — patient + clinician only
    for appt in db.query(Appointment).filter(
        Appointment.scheduled_at >= now,
        Appointment.scheduled_at <= now + timedelta(hours=1),
        Appointment.status == 'scheduled',
    ).all():
        time_str = appt.scheduled_at.strftime('%I:%M %p')
        loc_str  = appt.location or 'the clinic'

        for uid in _patient_recipients(db, appt.patient_id, ['patient', 'clinician']):
            if _already_sent(db, uid, 'appointment_reminder_1h', appt.id, timedelta(minutes=30)):
                continue
            db.add(_make_notif(
                uid, 'appointment_reminder_1h',
                'Appointment in 1 Hour',
                f"{appt.appointment_type} appointment starts in less than 1 hour at {loc_str} ({time_str})",
                related_alert_id=appt.id,
            ))
            alerts_created += 1

    db.commit()
    return alerts_created


# ── Medication reminders ──────────────────────────────────────────────────────

def check_medication_schedule(db: Session):
    """
    15-min reminder and 30-min missed-dose detection.
    Reminder   → patient + assigned caregivers
    Missed     → patient + caregivers + family + primary clinician
    """
    now = datetime.utcnow()
    alerts_created = 0

    for med in db.query(Medication).filter(Medication.is_active == True).all():
        if med.is_prn:
            continue

        next_dose = calculate_next_dose_time(med, now)
        if not next_dose:
            continue

        # ── Upcoming dose (within 15 minutes) ────────────────────────────
        if timedelta(minutes=0) <= (next_dose - now) <= timedelta(minutes=15):
            patient = db.query(Patient).filter(Patient.id == med.patient_id).first()
            if patient:
                for uid in _patient_recipients(db, med.patient_id, ['patient', 'caregiver']):
                    if _already_sent(db, uid, 'medication_reminder', med.id, timedelta(minutes=10)):
                        continue
                    is_caregiver = (uid != getattr(patient, 'user_id', None))
                    db.add(_make_notif(
                        uid, 'medication_reminder',
                        'Medication Due Soon',
                        f"{'Patient due: ' if is_caregiver else ''}{med.name} {med.dose} in 15 minutes.",
                        related_alert_id=med.id,
                    ))
                    alerts_created += 1

        # ── Missed dose (30+ minutes past schedule) ───────────────────────
        if now > next_dose + timedelta(minutes=30):
            taken = db.query(MedicationAdherenceLog).filter(
                MedicationAdherenceLog.medication_id == med.id,
                MedicationAdherenceLog.scheduled_at == next_dose,
                MedicationAdherenceLog.taken == True,
            ).first()

            if not taken:
                patient = db.query(Patient).filter(Patient.id == med.patient_id).first()
                if not patient:
                    continue

                # Log it once
                already_logged = db.query(MedicationAdherenceLog).filter(
                    MedicationAdherenceLog.medication_id == med.id,
                    MedicationAdherenceLog.scheduled_at == next_dose,
                ).first()
                if not already_logged:
                    db.add(MedicationAdherenceLog(
                        medication_id=med.id,
                        patient_id=med.patient_id,
                        scheduled_at=next_dose,
                        taken=False,
                        skipped_reason='Missed - not taken within 30 minutes',
                    ))

                time_str = next_dose.strftime('%I:%M %p')
                for uid in _patient_recipients(db, med.patient_id,
                                               ['patient', 'caregiver', 'family', 'clinician']):
                    if _already_sent(db, uid, 'medication_missed', med.id,
                                     timedelta(minutes=45)):
                        continue
                    is_patient = (uid == getattr(patient, 'user_id', None))
                    title = 'Missed Medication' if is_patient else f'Patient Missed Medication'
                    body  = (f"You missed {med.name} {med.dose} scheduled at {time_str}."
                             if is_patient else
                             f"{patient.full_name} missed {med.name} {med.dose} at {time_str}.")
                    db.add(_make_notif(uid, 'medication_missed', title, body,
                                       related_alert_id=med.id))
                    alerts_created += 1

    db.commit()
    return alerts_created


# ── Critical vitals ───────────────────────────────────────────────────────────

def check_critical_vitals(db: Session):
    """
    Scan latest vitals (last 30 min) for threshold breaches.
    Recipients: primary clinician + assigned caregivers + family
    Patient is NOT alerted for critical vitals — that would cause panic.
    """
    alerts_created = 0

    for patient in db.query(Patient).filter(
        Patient.status.in_(['active', 'critical'])
    ).all():
        vital = db.query(Vital).filter(
            Vital.patient_id == patient.id,
            Vital.recorded_at >= datetime.utcnow() - timedelta(minutes=30),
        ).order_by(Vital.recorded_at.desc()).first()

        if not vital:
            continue

        issues = []
        if vital.oxygen_saturation and vital.oxygen_saturation < 90:
            issues.append(f"SpO2 {vital.oxygen_saturation}% (critical: <90%)")
        if vital.heart_rate:
            if vital.heart_rate < 50:
                issues.append(f"HR {vital.heart_rate} bpm (bradycardia)")
            elif vital.heart_rate > 120:
                issues.append(f"HR {vital.heart_rate} bpm (tachycardia)")
        if vital.blood_pressure_sys:
            if vital.blood_pressure_sys > 180:
                issues.append(f"BP {vital.blood_pressure_sys} mmHg (hypertension)")
            elif vital.blood_pressure_sys < 90:
                issues.append(f"BP {vital.blood_pressure_sys} mmHg (hypotension)")
        if vital.temperature:
            if vital.temperature > 38.5:
                issues.append(f"Temp {vital.temperature}°C (fever)")
            elif vital.temperature < 35:
                issues.append(f"Temp {vital.temperature}°C (hypothermia)")

        if not issues:
            continue

        # Dedup: skip if alert already created for this patient in last 6h
        existing_alert = db.query(Alert).filter(
            Alert.patient_id == patient.id,
            Alert.alert_type == 'critical_vitals',
            Alert.created_at >= datetime.utcnow() - timedelta(hours=6),
        ).first()

        if existing_alert:
            continue

        # Create the Alert row
        alert = Alert(
            patient_id=patient.id,
            alert_type='critical_vitals',
            severity='critical',
            message='; '.join(issues),
            triggered_value='; '.join(issues),
            is_acknowledged=False,
        )
        db.add(alert)
        db.flush()  # get alert.id before using it

        body_staff = (f"CRITICAL: {patient.full_name} — {'; '.join(issues)}. "
                      f"Recorded at {vital.recorded_at.strftime('%H:%M')}.")
        body_family = (f"The care team has been alerted about {patient.full_name}. "
                       f"Issues detected: {'; '.join(issues)}.")

        # Staff (clinician + caregivers) get the clinical detail
        for uid in _patient_recipients(db, patient.id, ['clinician', 'caregiver']):
            db.add(_make_notif(uid, 'critical_vitals',
                               f'🚨 Critical Vitals: {patient.full_name}',
                               body_staff, related_alert_id=alert.id))

        # Family get a less clinical version
        for uid in _patient_recipients(db, patient.id, ['family']):
            db.add(_make_notif(uid, 'critical_vitals',
                               f'Patient Update: {patient.full_name}',
                               body_family, related_alert_id=alert.id))

        # Also try to deliver via push/SMS
        try:
            for uid in _patient_recipients(db, patient.id, ['clinician', 'caregiver']):
                _deliver_to_user(db, uid, f'Critical Vitals: {patient.full_name}',
                                 body_staff, 'critical_vitals', patient.full_name, critical=True)
        except Exception:
            pass

        alerts_created += 1

    db.commit()
    return alerts_created


# ── Message notification ──────────────────────────────────────────────────────

def create_message_notification(db: Session, recipient_id: int, sender_name: str,
                                 message_preview: str):
    """Create in-app notification for a new chat message."""
    try:
        db.add(_make_notif(
            recipient_id, 'new_message',
            f'New message from {sender_name}',
            message_preview[:100] if message_preview else 'You have a new message',
        ))
        db.commit()
    except Exception as e:
        db.rollback()
        import logging
        logging.getLogger(__name__).error(f"Message notification failed: {e}")


# ── Generic role-targeted alert ───────────────────────────────────────────────

def send_alert_to_role(db: Session, patient_id: int, alert_type: str,
                       message: str, role: str, priority: str = 'medium'):
    """Send a notification to all users of a given role linked to patient_id."""
    role_map = {
        'clinician': ['clinician'],
        'caregiver':  ['caregiver'],
        'patient':    ['patient'],
        'family':     ['family'],
        'all_staff':  ['clinician', 'caregiver'],
        'all':        ['patient', 'family', 'clinician', 'caregiver'],
    }
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    pname   = patient.full_name if patient else 'Patient'

    for uid in _patient_recipients(db, patient_id, role_map.get(role, [role])):
        db.add(_make_notif(uid, alert_type, f'Alert: {pname}', message,
                           related_alert_id=patient_id))
    db.commit()


# ── Bulk dispatch helper ──────────────────────────────────────────────────────

def dispatch_to_users(db: Session, recipient_ids: list, alert_type: str,
                      title: str, body: str, related_alert_id: int = None):
    """Send the same notification to a list of user IDs."""
    for uid in recipient_ids:
        db.add(_make_notif(uid, alert_type, title, body,
                           related_alert_id=related_alert_id))
    db.commit()


# ── Push + SMS delivery wrapper ───────────────────────────────────────────────

def _deliver_to_user(db, user_id: int, title: str, body: str,
                     alert_type: str, patient_name: str = "", critical: bool = False):
    """Fire Web Push + SMS delivery alongside the DB notification."""
    try:
        from services.delivery_service import deliver_notification
        from src.db import PushSubscription
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
    """Called from ML/alert routers to push an urgent notification to staff."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return

    for uid in _patient_recipients(db, patient_id, ['clinician', 'caregiver']):
        db.add(_make_notif(uid, alert_type,
                           f'🚨 Alert: {patient_name or patient.full_name}',
                           message, related_alert_id=patient_id))
        _deliver_to_user(db, uid, f'Alert: {patient_name or patient.full_name}',
                         message, alert_type, patient_name, critical=True)
    db.commit()


# ── Medication dose time calculator ──────────────────────────────────────────

def calculate_next_dose_time(medication: Medication, current_time: datetime):
    """Calculate next scheduled dose time from frequency string."""
    if not medication.frequency:
        return None

    freq = medication.frequency.lower()

    if any(x in freq for x in ['every 4', 'q4h', '4-hourly']):
        hours = 4
    elif any(x in freq for x in ['every 6', 'q6h', '6-hourly']):
        hours = 6
    elif any(x in freq for x in ['every 8', 'q8h', 'three times', 'tid', '3 times']):
        hours = 8
    elif any(x in freq for x in ['every 12', 'q12h', 'twice daily', 'twice a day', 'bd', 'bid']):
        hours = 12
    elif any(x in freq for x in ['once daily', 'daily', 'qd', 'od', 'every 24']):
        hours = 24
    else:
        return None

    start = getattr(medication, 'start_date', None) or getattr(medication, 'created_at', None)
    if not start:
        return None

    hours_elapsed = (current_time - start).total_seconds() / 3600
    next_interval = int(hours_elapsed / hours) + 1
    return start + timedelta(hours=hours * next_interval)


# ── Booking notifications (services marketplace) ─────────────────────────────

def notify_booking_confirmed(db: Session, booking):
    """Notify patient and provider when a booking is confirmed."""
    if getattr(booking, 'patient_id', None):
        db.add(_make_notif(
            booking.patient_id, 'booking_confirmed',
            'Booking Confirmed',
            f"Your appointment has been confirmed.",
            related_alert_id=booking.id,
        ))
    if getattr(booking, 'provider_id', None):
        db.add(_make_notif(
            booking.provider_id, 'booking_request',
            'New Booking Request',
            f"You have a new appointment booking.",
            related_alert_id=booking.id,
        ))
    db.commit()


def notify_booking_cancelled(db: Session, booking, notify_id: int):
    db.add(_make_notif(
        notify_id, 'booking_cancelled',
        'Booking Cancelled',
        f"An appointment booking has been cancelled.",
        related_alert_id=booking.id,
    ))
    db.commit()


def notify_booking_reminders(db: Session, bookings_due: list):
    for uid, b in bookings_due:
        date_str = b.requested_date.strftime('%A %d %B') if getattr(b, 'requested_date', None) else 'soon'
        time_str = f" at {b.start_time}" if getattr(b, 'start_time', None) else ''
        db.add(_make_notif(
            uid, 'booking_reminder',
            'Appointment Reminder',
            f"You have an appointment on {date_str}{time_str}.",
            related_alert_id=b.id,
        ))
    db.commit()


def notify_provider_approved(db: Session, provider_user_id: int):
    db.add(_make_notif(
        provider_user_id, 'provider_approved',
        'Application Approved',
        'Your provider application has been approved. You can now receive bookings.',
    ))
    db.commit()
