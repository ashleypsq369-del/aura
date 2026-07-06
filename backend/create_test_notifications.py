"""
Test Notification Creator
Run this script to create sample notifications for testing
Usage: python create_test_notifications.py
"""

from src.db import get_db, NotificationQueue, User
from datetime import datetime

def create_test_notifications():
    """Create various test notifications"""
    
    db = next(get_db())
    
    # Get first user (nurse)
    user = db.query(User).filter(User.email == "nurse@projectaura.com").first()
    if not user:
        print("❌ User not found. Please ensure nurse@projectaura.com exists.")
        return
    
    recipient_id = user.id
    print(f"Creating notifications for user: {user.full_name} (ID: {recipient_id})")
    
    # Define test notifications
    test_notifications = [
        {
            "type": "medication_reminder",
            "title": "💊 Medication Due Soon",
            "body": "Morphine 10mg due at 2:00 PM (in 30 minutes)",
        },
        {
            "type": "appointment_reminder",
            "title": "📅 Appointment Tomorrow",
            "body": "You have a consultation appointment with Dr. Mensah tomorrow at 2:00 PM",
        },
        {
            "type": "new_message",
            "title": "💬 New Message from Dr. Smith",
            "body": "I've reviewed your recent vitals and everything looks good. Keep up the great work!",
        },
        {
            "type": "care_plan_update",
            "title": "📝 Care Plan Updated",
            "body": "Your care team has updated the care plan based on recent assessment results",
        },
        {
            "type": "assessment_reminder",
            "title": "📊 Weekly Assessment Due",
            "body": "Time to complete the weekly ESAS symptom assessment for your patients",
        },
        {
            "type": "community_event",
            "title": "👥 Support Group Today",
            "body": "Caregiver support group meeting starts at 4:00 PM in the community hall",
        },
        {
            "type": "report_available",
            "title": "📄 Weekly Report Ready",
            "body": "Your weekly patient summary report is now available to view",
        },
        {
            "type": "special_day",
            "title": "🎂 Patient Birthday",
            "body": "Today is John Doe's birthday! Consider sending a card or visiting.",
        },
    ]
    
    # Create notifications
    created_count = 0
    for notif_data in test_notifications:
        notification = NotificationQueue(
            recipient_id=recipient_id,
            notification_type=notif_data["type"],
            title=notif_data["title"],
            body=notif_data["body"],
            is_sent=True,
            sent_at=datetime.utcnow(),
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(notification)
        created_count += 1
    
    db.commit()
    
    print(f"\n✅ Successfully created {created_count} test notifications!")
    print("\nNotifications created:")
    for i, notif in enumerate(test_notifications, 1):
        print(f"  {i}. {notif['title']}")
    
    print("\n📬 Check your inbox icon in the app to see them!")
    print("   Badge should show: [8]")
    print("\n💡 Tip: Refresh the frontend or wait 60 seconds for auto-refresh")


def delete_all_notifications():
    """Delete all notifications (clean slate)"""
    db = next(get_db())
    
    count = db.query(NotificationQueue).count()
    db.query(NotificationQueue).delete()
    db.commit()
    
    print(f"🗑️  Deleted {count} notifications")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("📬 NOTIFICATION TEST CREATOR")
    print("="*60)
    print("\nOptions:")
    print("  1. Create test notifications")
    print("  2. Delete all notifications")
    print("  3. Exit")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == "1":
        create_test_notifications()
    elif choice == "2":
        confirm = input("Are you sure you want to delete all notifications? (yes/no): ").strip().lower()
        if confirm == "yes":
            delete_all_notifications()
        else:
            print("❌ Cancelled")
    elif choice == "3":
        print("👋 Goodbye!")
    else:
        print("❌ Invalid choice")
