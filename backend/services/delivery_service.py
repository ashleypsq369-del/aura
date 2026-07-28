"""
delivery_service.py
===================
Multi-channel notification delivery:
  - SMS via Twilio
  - Web Push (VAPID) for browser/device push
  - Email via SendGrid (reuses existing key)

All channels are optional — if keys are not configured the channel is silently
skipped and in-app notification still works.

Setup:
  TWILIO_ACCOUNT_SID=ACxxxxxxx
  TWILIO_AUTH_TOKEN=xxxxxxx
  TWILIO_FROM_NUMBER=+1415xxxxxxx   (your Twilio number)
  VAPID_PRIVATE_KEY=<base64>
  VAPID_PUBLIC_KEY=<base64>
  VAPID_CLAIMS_EMAIL=admin@projectaura.gh
  SENDGRID_API_KEY=SG.xxxxxxx
"""

from __future__ import annotations
import os
import json
import logging
from typing import Optional

log = logging.getLogger(__name__)

# ── Load env ──────────────────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID  = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
TWILIO_AUTH_TOKEN   = os.getenv("TWILIO_AUTH_TOKEN",  "").strip()
TWILIO_FROM_NUMBER  = os.getenv("TWILIO_FROM_NUMBER", "").strip()

VAPID_PRIVATE_KEY   = os.getenv("VAPID_PRIVATE_KEY",  "").strip()
VAPID_PUBLIC_KEY    = os.getenv("VAPID_PUBLIC_KEY",   "").strip()
VAPID_EMAIL         = os.getenv("VAPID_CLAIMS_EMAIL", "admin@projectaura.gh").strip()

SENDGRID_API_KEY    = os.getenv("SENDGRID_API_KEY",   "").strip()
FROM_EMAIL          = os.getenv("FROM_EMAIL",         "noreply@projectaura.gh").strip()

# ── SMS via Twilio ─────────────────────────────────────────────────────────────
def send_sms(to_number: str, message: str) -> bool:
    """Send SMS via Twilio. Returns True on success."""
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER]):
        log.debug("SMS skipped — Twilio not configured")
        return False
    if not to_number:
        return False
    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        # Normalise Ghana numbers: 0244... → +233244...
        num = to_number.strip()
        if num.startswith("0") and len(num) == 10:
            num = "+233" + num[1:]
        elif not num.startswith("+"):
            num = "+" + num
        msg = client.messages.create(
            body=message[:160],   # single SMS segment
            from_=TWILIO_FROM_NUMBER,
            to=num,
        )
        log.info(f"SMS sent to {num}: SID={msg.sid}")
        return True
    except Exception as e:
        log.error(f"SMS failed to {to_number}: {e}")
        return False


def send_sms_alert(to_number: str, patient_name: str, alert_type: str, detail: str) -> bool:
    """Format and send a clinical SMS alert."""
    type_labels = {
        "critical_vitals": "⚠ CRITICAL VITALS",
        "medication_missed": "💊 MISSED MEDICATION",
        "appointment_reminder_1h": "📅 APPOINTMENT IN 1 HOUR",
        "appointment_reminder_24h": "📅 APPOINTMENT TOMORROW",
        "ml_risk": "🧠 ML RISK ALERT",
        "crisis_alert": "🚨 CRISIS ALERT",
    }
    label = type_labels.get(alert_type, "📋 PROJECTAURA ALERT")
    body = f"{label}\nPatient: {patient_name}\n{detail}\nProjectAura"
    return send_sms(to_number, body)


# ── Web Push (VAPID) ──────────────────────────────────────────────────────────
def send_web_push(subscription_info: dict, title: str, body: str,
                  url: str = "/notifications", icon: str = "/favicon.svg") -> bool:
    """Send a browser push notification via VAPID/Web Push API."""
    if not all([VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY]):
        log.debug("Web push skipped — VAPID keys not configured")
        return False
    try:
        from pywebpush import webpush, WebPushException
        payload = json.dumps({
            "title": title,
            "body": body,
            "icon": icon,
            "url": url,
            "badge": "/favicon.svg",
            "vibrate": [200, 100, 200],
        })
        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{VAPID_EMAIL}"},
        )
        log.info(f"Web push sent: {title}")
        return True
    except Exception as e:
        log.error(f"Web push failed: {e}")
        return False


# ── Email via SendGrid ────────────────────────────────────────────────────────
def send_email(to_email: str, subject: str, body_html: str) -> bool:
    """Send email via SendGrid."""
    if not SENDGRID_API_KEY:
        log.debug("Email skipped — SendGrid not configured")
        return False
    if not to_email:
        return False
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail
        sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
        mail = Mail(
            from_email=FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            html_content=body_html,
        )
        resp = sg.send(mail)
        log.info(f"Email sent to {to_email}: HTTP {resp.status_code}")
        return resp.status_code in (200, 201, 202)
    except Exception as e:
        log.error(f"Email failed to {to_email}: {e}")
        return False


def send_email_alert(to_email: str, patient_name: str, alert_type: str, detail: str) -> bool:
    """Format and send a clinical email alert."""
    subject = f"ProjectAura Alert — {patient_name}"
    body = f"""
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px">
      <div style="background:linear-gradient(135deg,#0d9488,#7c3aed);padding:16px 24px;border-radius:8px;margin-bottom:16px">
        <h1 style="color:white;margin:0;font-size:18px">ProjectAura Clinical Alert</h1>
      </div>
      <p style="font-size:14px;color:#334155"><strong>Patient:</strong> {patient_name}</p>
      <p style="font-size:14px;color:#334155"><strong>Alert:</strong> {alert_type.replace('_',' ').title()}</p>
      <p style="font-size:14px;color:#334155">{detail}</p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px">This is an automated alert from ProjectAura Palliative Care System. Do not reply to this email.</p>
    </div>
    """
    return send_email(to_email, subject, body)


# ── Combined delivery ─────────────────────────────────────────────────────────
def deliver_notification(
    user_phone: Optional[str],
    user_email: Optional[str],
    push_subscriptions: list,
    title: str,
    body: str,
    alert_type: str = "notification",
    patient_name: str = "",
    critical: bool = False,
) -> dict:
    """
    Deliver a notification via all configured channels.
    Returns dict of {channel: success/skipped}.
    """
    results = {}

    # SMS — only for critical alerts and if phone exists
    if critical and user_phone:
        results["sms"] = send_sms_alert(user_phone, patient_name, alert_type, body)
    else:
        results["sms"] = "skipped"

    # Email — critical alerts or if email enabled
    if critical and user_email:
        results["email"] = send_email_alert(user_email, patient_name, alert_type, body)
    else:
        results["email"] = "skipped"

    # Web push — all notifications
    push_results = []
    for sub in push_subscriptions:
        ok = send_web_push(sub, title, body)
        push_results.append(ok)
    results["web_push"] = all(push_results) if push_results else "no_subscriptions"

    return results


# ── VAPID key generation helper ───────────────────────────────────────────────
def generate_vapid_keys() -> dict:
    """Generate VAPID key pair for first-time setup."""
    try:
        from py_vapid import Vapid
        vapid = Vapid()
        vapid.generate_keys()
        private = vapid.private_key
        public = vapid.public_key
        # Convert to base64url strings
        import base64
        from cryptography.hazmat.primitives.serialization import (
            Encoding, PublicFormat, PrivateFormat, NoEncryption
        )
        pub_bytes = public.public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
        pub_b64 = base64.urlsafe_b64encode(pub_bytes).rstrip(b"=").decode()
        priv_der = private.private_bytes(Encoding.DER, PrivateFormat.PKCS8, NoEncryption())
        priv_b64 = base64.urlsafe_b64encode(priv_der).rstrip(b"=").decode()
        return {"public_key": pub_b64, "private_key": priv_b64}
    except Exception as e:
        return {"error": str(e)}
