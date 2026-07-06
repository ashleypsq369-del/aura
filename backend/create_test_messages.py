"""
Create Test Messages  --  Project Aura
Creates sample conversations and messages between various users for testing
"""

import sys
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from src.db import (
    get_db, User, Patient, Conversation, ConversationParticipant, Message
)


def create_test_messages():
    """Create sample messages between users"""
    db = next(get_db())
    
    try:
        print("🔍 Fetching users...")
        
        # Get all users
        users = db.query(User).filter(User.is_active == True).all()
        if not users:
            print("❌ No users found. Run seed_database.py first.")
            return
        
        # Get specific users by role
        nurse = db.query(User).filter(User.role == 'clinician').first()
        admin_user = db.query(User).filter(User.role == 'admin').first()
        family_user = db.query(User).filter(User.role == 'family').first()
        caregiver = db.query(User).filter(User.role == 'caregiver').first()
        patient_user = db.query(User).filter(User.role == 'patient').first()
        
        print(f"✅ Found {len(users)} users")
        
        # Clear existing test messages (optional)
        print("🗑️  Clearing old test messages...")
        db.query(Message).delete()
        db.query(ConversationParticipant).delete()
        db.query(Conversation).delete()
        db.commit()
        
        print("📝 Creating test conversations and messages...\n")
        
        # ================================================================
        # CONVERSATION 1: Nurse → Patient
        # ================================================================
        if nurse and patient_user:
            print(f"💬 Creating conversation: {nurse.full_name} ↔ {patient_user.full_name}")
            
            conv1 = Conversation(
                conversation_type="private",
                created_by=nurse.id,
                last_message_at=datetime.utcnow() - timedelta(hours=2)
            )
            db.add(conv1)
            db.flush()
            
            # Add participants
            part1a = ConversationParticipant(
                conversation_id=conv1.id,
                user_id=nurse.id,
                role="participant",
                last_read_at=datetime.utcnow() - timedelta(hours=2)
            )
            part1b = ConversationParticipant(
                conversation_id=conv1.id,
                user_id=patient_user.id,
                role="participant",
                last_read_at=datetime.utcnow() - timedelta(hours=3)  # Not read yet
            )
            db.add_all([part1a, part1b])
            db.flush()
            
            # Messages
            msg1 = Message(
                conversation_id=conv1.id,
                sender_id=nurse.id,
                content="Hello! How are you feeling today?",
                message_type="text",
                priority="normal",
                created_at=datetime.utcnow() - timedelta(hours=2)
            )
            msg2 = Message(
                conversation_id=conv1.id,
                sender_id=patient_user.id,
                content="I'm doing better, thank you. The pain medication is helping.",
                message_type="text",
                priority="normal",
                created_at=datetime.utcnow() - timedelta(hours=1, minutes=45)
            )
            msg3 = Message(
                conversation_id=conv1.id,
                sender_id=nurse.id,
                content="That's great to hear! Make sure to take it as prescribed. Let me know if you have any questions.",
                message_type="text",
                priority="normal",
                created_at=datetime.utcnow() - timedelta(hours=1, minutes=30)
            )
            db.add_all([msg1, msg2, msg3])
            print(f"  ✓ Added 3 messages")
        
        # ================================================================
        # CONVERSATION 2: Nurse → Family
        # ================================================================
        if nurse and family_user:
            print(f"💬 Creating conversation: {nurse.full_name} ↔ {family_user.full_name}")
            
            conv2 = Conversation(
                conversation_type="private",
                created_by=family_user.id,
                last_message_at=datetime.utcnow() - timedelta(hours=5)
            )
            db.add(conv2)
            db.flush()
            
            part2a = ConversationParticipant(
                conversation_id=conv2.id,
                user_id=nurse.id,
                role="participant",
                last_read_at=datetime.utcnow() - timedelta(hours=4, minutes=30)
            )
            part2b = ConversationParticipant(
                conversation_id=conv2.id,
                user_id=family_user.id,
                role="participant",
                last_read_at=datetime.utcnow() - timedelta(minutes=10)  # Just read
            )
            db.add_all([part2a, part2b])
            db.flush()
            
            msg4 = Message(
                conversation_id=conv2.id,
                sender_id=family_user.id,
                content="Nurse, I have some questions about my mother's care plan.",
                message_type="text",
                priority="normal",
                created_at=datetime.utcnow() - timedelta(hours=5)
            )
            msg5 = Message(
                conversation_id=conv2.id,
                sender_id=nurse.id,
                content="Of course! I'm here to help. What would you like to know?",
                message_type="text",
                priority="normal",
                created_at=datetime.utcnow() - timedelta(hours=4, minutes=45)
            )
            msg6 = Message(
                conversation_id=conv2.id,
                sender_id=family_user.id,
                content="Can we adjust her medication schedule? It's difficult to give her medicine at 6am.",
                message_type="text",
                priority="normal",
                created_at=datetime.utcnow() - timedelta(hours=4, minutes=30)
            )
            msg7 = Message(
                conversation_id=conv2.id,
                sender_id=nurse.id,
                content="Let me check with the doctor and get back to you. We can likely adjust it to 8am.",
                message_type="text",
                priority="normal",
                created_at=datetime.utcnow() - timedelta(hours=4)
            )
            db.add_all([msg4, msg5, msg6, msg7])
            print(f"  ✓ Added 4 messages")
        
        # ================================================================
        # CONVERSATION 3: Caregiver → Patient (UNREAD by patient)
        # ================================================================
        if caregiver and patient_user:
            print(f"💬 Creating conversation: {caregiver.full_name} ↔ {patient_user.full_name}")
            
            conv3 = Conversation(
                conversation_type="private",
                created_by=caregiver.id,
                last_message_at=datetime.utcnow() - timedelta(minutes=15)
            )
            db.add(conv3)
            db.flush()
            
            part3a = ConversationParticipant(
                conversation_id=conv3.id,
                user_id=caregiver.id,
                role="participant",
                last_read_at=datetime.utcnow() - timedelta(minutes=15)
            )
            part3b = ConversationParticipant(
                conversation_id=conv3.id,
                user_id=patient_user.id,
                role="participant",
                last_read_at=datetime.utcnow() - timedelta(days=1)  # UNREAD
            )
            db.add_all([part3a, part3b])
            db.flush()
            
            msg8 = Message(
                conversation_id=conv3.id,
                sender_id=caregiver.id,
                content="Good morning! Just a reminder about your physical therapy session at 2pm today.",
                message_type="text",
                priority="normal",
                created_at=datetime.utcnow() - timedelta(minutes=15)
            )
            msg9 = Message(
                conversation_id=conv3.id,
                sender_id=caregiver.id,
                content="Please let me know if you need any help getting ready.",
                message_type="text",
                priority="normal",
                created_at=datetime.utcnow() - timedelta(minutes=14)
            )
            db.add_all([msg8, msg9])
            print(f"  ✓ Added 2 messages (UNREAD by patient)")
        
        # ================================================================
        # CONVERSATION 4: Admin → Nurse (URGENT)
        # ================================================================
        if admin_user and nurse:
            print(f"💬 Creating conversation: {admin_user.full_name} ↔ {nurse.full_name}")
            
            conv4 = Conversation(
                conversation_type="private",
                created_by=admin_user.id,
                last_message_at=datetime.utcnow() - timedelta(minutes=5)
            )
            db.add(conv4)
            db.flush()
            
            part4a = ConversationParticipant(
                conversation_id=conv4.id,
                user_id=admin_user.id,
                role="participant",
                last_read_at=datetime.utcnow() - timedelta(minutes=5)
            )
            part4b = ConversationParticipant(
                conversation_id=conv4.id,
                user_id=nurse.id,
                role="participant",
                last_read_at=datetime.utcnow() - timedelta(hours=1)  # UNREAD
            )
            db.add_all([part4a, part4b])
            db.flush()
            
            msg10 = Message(
                conversation_id=conv4.id,
                sender_id=admin_user.id,
                content="Please review the new care protocols before your shift tomorrow.",
                message_type="text",
                priority="high",
                created_at=datetime.utcnow() - timedelta(minutes=5)
            )
            db.add(msg10)
            print(f"  ✓ Added 1 message (HIGH PRIORITY, UNREAD by nurse)")
        
        # ================================================================
        # CONVERSATION 5: Caregiver → Family
        # ================================================================
        if caregiver and family_user:
            print(f"💬 Creating conversation: {caregiver.full_name} ↔ {family_user.full_name}")
            
            conv5 = Conversation(
                conversation_type="private",
                created_by=caregiver.id,
                last_message_at=datetime.utcnow() - timedelta(hours=1)
            )
            db.add(conv5)
            db.flush()
            
            part5a = ConversationParticipant(
                conversation_id=conv5.id,
                user_id=caregiver.id,
                role="participant",
                last_read_at=datetime.utcnow() - timedelta(hours=1)
            )
            part5b = ConversationParticipant(
                conversation_id=conv5.id,
                user_id=family_user.id,
                role="participant",
                last_read_at=datetime.utcnow() - timedelta(hours=1)
            )
            db.add_all([part5a, part5b])
            db.flush()
            
            msg11 = Message(
                conversation_id=conv5.id,
                sender_id=caregiver.id,
                content="Your mother had a good day today. She ate well and participated in all activities.",
                message_type="text",
                priority="normal",
                created_at=datetime.utcnow() - timedelta(hours=1, minutes=10)
            )
            msg12 = Message(
                conversation_id=conv5.id,
                sender_id=family_user.id,
                content="Thank you so much for the update! That's wonderful to hear.",
                message_type="text",
                priority="normal",
                created_at=datetime.utcnow() - timedelta(hours=1, minutes=5)
            )
            msg13 = Message(
                conversation_id=conv5.id,
                sender_id=caregiver.id,
                content="You're welcome! She's been asking about you. Will you be visiting this weekend?",
                message_type="text",
                priority="normal",
                created_at=datetime.utcnow() - timedelta(hours=1)
            )
            db.add_all([msg11, msg12, msg13])
            print(f"  ✓ Added 3 messages")
        
        # ================================================================
        # CONVERSATION 6: Multiple Recent Messages (Testing Notifications)
        # ================================================================
        if nurse and family_user:
            print(f"💬 Creating recent conversation: {nurse.full_name} ↔ {family_user.full_name}")
            
            conv6 = Conversation(
                conversation_type="private",
                created_by=nurse.id,
                last_message_at=datetime.utcnow() - timedelta(minutes=2)
            )
            db.add(conv6)
            db.flush()
            
            part6a = ConversationParticipant(
                conversation_id=conv6.id,
                user_id=nurse.id,
                role="participant",
                last_read_at=datetime.utcnow() - timedelta(minutes=2)
            )
            part6b = ConversationParticipant(
                conversation_id=conv6.id,
                user_id=family_user.id,
                role="participant",
                last_read_at=datetime.utcnow() - timedelta(hours=2)  # UNREAD
            )
            db.add_all([part6a, part6b])
            db.flush()
            
            msg14 = Message(
                conversation_id=conv6.id,
                sender_id=nurse.id,
                content="Just wanted to update you on the assessment we completed today.",
                message_type="text",
                priority="normal",
                created_at=datetime.utcnow() - timedelta(minutes=10)
            )
            msg15 = Message(
                conversation_id=conv6.id,
                sender_id=nurse.id,
                content="Everything looks stable. We'll continue with the current care plan.",
                message_type="text",
                priority="normal",
                created_at=datetime.utcnow() - timedelta(minutes=9)
            )
            msg16 = Message(
                conversation_id=conv6.id,
                sender_id=nurse.id,
                content="Please call me if you have any questions.",
                message_type="text",
                priority="normal",
                created_at=datetime.utcnow() - timedelta(minutes=2)
            )
            db.add_all([msg14, msg15, msg16])
            print(f"  ✓ Added 3 recent messages (UNREAD by family)")
        
        db.commit()
        
        print("\n" + "="*60)
        print("✅ Test messages created successfully!")
        print("="*60)
        
        # Print summary
        total_conversations = db.query(Conversation).count()
        total_messages = db.query(Message).count()
        
        print(f"\n📊 Summary:")
        print(f"  - Total conversations: {total_conversations}")
        print(f"  - Total messages: {total_messages}")
        
        print(f"\n👥 Users with messages:")
        for user in users:
            # Count conversations for this user
            conv_count = db.query(ConversationParticipant).filter(
                ConversationParticipant.user_id == user.id
            ).count()
            
            # Count unread messages
            participants = db.query(ConversationParticipant).filter(
                ConversationParticipant.user_id == user.id
            ).all()
            
            unread_count = 0
            for participant in participants:
                if participant.last_read_at:
                    unread = db.query(Message).filter(
                        Message.conversation_id == participant.conversation_id,
                        Message.created_at > participant.last_read_at,
                        Message.sender_id != user.id,
                        Message.is_deleted == False
                    ).count()
                    unread_count += unread
            
            if conv_count > 0:
                unread_badge = f" ({unread_count} unread)" if unread_count > 0 else ""
                print(f"  - {user.full_name} ({user.role}): {conv_count} conversations{unread_badge}")
        
        print(f"\n🔐 Login credentials:")
        print(f"  - Nurse: nurse@projectaura.com / nurse123")
        print(f"  - Admin: admin@projectaura.com / admin123")
        print(f"  - Family: family@projectaura.com / family123")
        print(f"  - Caregiver: caregiver@projectaura.com / caregiver123")
        print(f"  - Patient: patient@projectaura.com / patient123")
        
        print(f"\n🧪 Test scenarios:")
        print(f"  1. Login as patient → See unread messages from caregiver")
        print(f"  2. Login as nurse → See unread message from admin (HIGH PRIORITY)")
        print(f"  3. Login as family → See multiple unread messages")
        print(f"  4. Send a message → Recipient should get notification (📬)")
        print(f"  5. Open conversation → Messages should mark as read")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    print("="*60)
    print("🧪 Creating Test Messages for Project Aura")
    print("="*60)
    create_test_messages()
