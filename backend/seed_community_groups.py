"""
Seed Community Support Groups for Palliative & Hospice Care
Comprehensive groups covering all aspects of end-of-life care support
"""

import sys
from datetime import datetime
from sqlalchemy.orm import Session
from src.db import get_session, CommunityGroup, CommunityMembership, CommunityPost, User
import json

def seed_community_groups():
    """
    Seed comprehensive community support groups for palliative and hospice care.
    Based on research of palliative care needs: physical, mental, spiritual, financial,
    social, condition-specific, and practical support.
    """
    db = get_session()
    
    try:
        # Delete existing groups and memberships
        print("🗑️  Clearing existing community groups...")
        db.query(CommunityPost).delete()
        db.query(CommunityMembership).delete()
        db.query(CommunityGroup).delete()
        db.commit()
        
        groups = [
            # ═══════════════════════════════════════════════════════════════
            # PHYSICAL SYMPTOM SUPPORT GROUPS
            # ═══════════════════════════════════════════════════════════════
            {
                "name": "Pain Management & Comfort",
                "description": "Share experiences and tips for managing pain, finding comfort, and working with pain medications. Support for patients and caregivers dealing with chronic pain.",
                "condition_tags": '["general", "pain", "symptoms"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Breathing & Respiratory Support",
                "description": "Support for managing breathlessness, oxygen therapy, and respiratory symptoms. Share techniques for easier breathing and coping strategies.",
                "condition_tags": '["respiratory", "breathlessness", "oxygen"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Nutrition & Appetite Support",
                "description": "Managing appetite changes, nutrition challenges, and finding joy in food. Share recipes, tips, and encouragement around eating and nutrition.",
                "condition_tags": '["nutrition", "appetite", "diet"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Fatigue & Energy Management",
                "description": "Living with extreme tiredness and finding ways to conserve energy. Share strategies for pacing, rest, and making the most of good days.",
                "condition_tags": '["fatigue", "energy", "weakness"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Sleep & Night-Time Support",
                "description": "Managing sleep problems, night-time anxiety, and finding rest. Support for both patients experiencing sleep issues and caregivers on night duty.",
                "condition_tags": '["sleep", "insomnia", "night"]',
                "is_active": True,
                "member_count": 0
            },
            
            # ═══════════════════════════════════════════════════════════════
            # MENTAL & EMOTIONAL HEALTH GROUPS
            # ═══════════════════════════════════════════════════════════════
            {
                "name": "Anxiety & Fear Support",
                "description": "A safe space to share fears, worries, and anxiety about the future. Learn coping strategies and find comfort in shared experiences.",
                "condition_tags": '["mental_health", "anxiety", "fear"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Depression & Sadness Support",
                "description": "Support for managing depression, grief, and overwhelming sadness. Share feelings in a judgment-free space and find hope together.",
                "condition_tags": '["mental_health", "depression", "grief"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Hope & Meaning",
                "description": "Finding purpose, hope, and meaning in difficult times. Share inspirational stories, moments of joy, and reasons to keep going.",
                "condition_tags": '["mental_health", "hope", "meaning"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Mindfulness & Meditation",
                "description": "Practice mindfulness, meditation, and being present in the moment. Share techniques for staying grounded and finding peace.",
                "condition_tags": '["mental_health", "mindfulness", "meditation"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Acceptance & Peace",
                "description": "Journey toward acceptance and inner peace. Discuss end-of-life wishes, legacy, and making peace with life's journey.",
                "condition_tags": '["mental_health", "acceptance", "peace"]',
                "is_active": True,
                "member_count": 0
            },
            
            # ═══════════════════════════════════════════════════════════════
            # SPIRITUAL & FAITH GROUPS
            # ═══════════════════════════════════════════════════════════════
            {
                "name": "Christian Faith & Prayer",
                "description": "Share prayers, scripture, and Christian faith during difficult times. Support from believers walking the same path with God.",
                "condition_tags": '["spiritual", "christian", "prayer"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Islamic Faith & Sabr (Patience)",
                "description": "Support for Muslim patients and families. Share Quranic verses, duas, and discuss sabr (patience) and tawakkul (trust in Allah).",
                "condition_tags": '["spiritual", "islamic", "muslim"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Traditional African Spirituality",
                "description": "Honor ancestral connections, traditional Ghanaian beliefs, and cultural spiritual practices during life's final journey.",
                "condition_tags": '["spiritual", "african", "traditional"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Interfaith & Universal Spirituality",
                "description": "Open to all faiths and spiritual beliefs. Share wisdom, prayers, and spiritual comfort from diverse traditions.",
                "condition_tags": '["spiritual", "interfaith", "universal"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Secular Spirituality & Meaning",
                "description": "Find meaning, purpose, and peace without religious framework. Humanist and secular perspectives on life's final chapter.",
                "condition_tags": '["spiritual", "secular", "humanist"]',
                "is_active": True,
                "member_count": 0
            },
            
            # ═══════════════════════════════════════════════════════════════
            # CONDITION-SPECIFIC GROUPS
            # ═══════════════════════════════════════════════════════════════
            {
                "name": "Cancer Journey",
                "description": "Support for patients and families facing cancer. Share experiences with treatments, side effects, and living with cancer.",
                "condition_tags": '["cancer", "oncology", "chemotherapy"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Heart Disease & Heart Failure",
                "description": "Living with heart conditions, managing symptoms, and supporting each other through cardiac challenges.",
                "condition_tags": '["heart", "cardiac", "heart_failure"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Kidney Disease & Dialysis",
                "description": "Support for kidney disease, dialysis journeys, and managing renal conditions. Share practical tips and emotional support.",
                "condition_tags": '["kidney", "renal", "dialysis"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Lung Disease & COPD",
                "description": "Living with lung conditions, COPD, pulmonary fibrosis, and other respiratory diseases. Breathe together.",
                "condition_tags": '["lung", "copd", "respiratory"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Liver Disease Support",
                "description": "Support for cirrhosis, hepatitis, and other liver conditions. Share experiences and find strength together.",
                "condition_tags": '["liver", "cirrhosis", "hepatic"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Neurological Conditions",
                "description": "Support for ALS, Parkinson's, dementia, stroke, and other neurological conditions affecting quality of life.",
                "condition_tags": '["neurological", "als", "parkinsons", "dementia"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "HIV/AIDS Care & Support",
                "description": "Living with HIV/AIDS in palliative stages. Share experiences, reduce stigma, and support each other with compassion.",
                "condition_tags": '["hiv", "aids", "infectious"]',
                "is_active": True,
                "member_count": 0
            },
            
            # ═══════════════════════════════════════════════════════════════
            # CAREGIVER & FAMILY SUPPORT GROUPS
            # ═══════════════════════════════════════════════════════════════
            {
                "name": "Family Caregivers Circle",
                "description": "Support for family members caring for loved ones. Share challenges, tips, and find respite in community.",
                "condition_tags": '["caregiver", "family", "support"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Spousal Caregivers",
                "description": "Unique support for spouses caring for their partners. Navigate the dual role of caregiver and life partner.",
                "condition_tags": '["caregiver", "spouse", "partner"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Adult Children Caregivers",
                "description": "For adult children caring for aging parents. Balance caregiving with work, family, and personal life.",
                "condition_tags": '["caregiver", "adult_children", "parent_care"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Caregiver Burnout & Self-Care",
                "description": "Recognize caregiver burnout and prioritize self-care. You can't pour from an empty cup - take care of yourself too.",
                "condition_tags": '["caregiver", "burnout", "self_care"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Children & Teens Support",
                "description": "Support for young people with seriously ill family members. Age-appropriate discussions and peer support.",
                "condition_tags": '["family", "children", "teens", "youth"]',
                "is_active": True,
                "member_count": 0
            },
            
            # ═══════════════════════════════════════════════════════════════
            # PRACTICAL & FINANCIAL SUPPORT GROUPS
            # ═══════════════════════════════════════════════════════════════
            {
                "name": "Financial Support & Resources",
                "description": "Navigate financial challenges, insurance, NHIS, medical bills, and find financial assistance resources.",
                "condition_tags": '["financial", "insurance", "resources"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Ghana NHIS & Healthcare Access",
                "description": "Understanding Ghana's National Health Insurance Scheme, accessing healthcare, and navigating the system.",
                "condition_tags": '["ghana", "nhis", "healthcare", "access"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Legal & Advance Directives",
                "description": "Discuss wills, advance directives, DNR orders, and legal preparation. Share resources for legal planning.",
                "condition_tags": '["legal", "directives", "planning"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Housing & Home Care",
                "description": "Adapting homes for illness, home care services, and housing options. Practical advice for safe home environments.",
                "condition_tags": '["housing", "home_care", "accessibility"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Transportation & Mobility",
                "description": "Getting to appointments, mobility aids, wheelchair access, and transportation resources in Ghana.",
                "condition_tags": '["transportation", "mobility", "access"]',
                "is_active": True,
                "member_count": 0
            },
            
            # ═══════════════════════════════════════════════════════════════
            # SOCIAL CONNECTION & WELLNESS GROUPS
            # ═══════════════════════════════════════════════════════════════
            {
                "name": "Gentle Exercise & Movement",
                "description": "Adapted exercises, chair yoga, gentle stretching, and movement for maintaining strength and flexibility.",
                "condition_tags": '["exercise", "movement", "wellness"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Arts, Crafts & Creativity",
                "description": "Express yourself through art, crafts, music, poetry, and creative activities. Share your creations and find joy.",
                "condition_tags": '["arts", "creativity", "crafts"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Books, Stories & Poetry",
                "description": "Share favorite books, poems, and stories. Discuss literature and find comfort in words.",
                "condition_tags": '["books", "reading", "poetry", "stories"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Music & Healing",
                "description": "Share music that brings comfort, healing, and joy. Discuss favorite songs, hymns, and how music helps.",
                "condition_tags": '["music", "healing", "comfort"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Nature & Outdoor Enjoyment",
                "description": "Appreciate nature, share photos, discuss gardens, and find peace in the natural world.",
                "condition_tags": '["nature", "outdoors", "peace"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Humor & Laughter",
                "description": "Share jokes, funny stories, and find moments of laughter. Humor can be healing - let's laugh together!",
                "condition_tags": '["humor", "laughter", "joy"]',
                "is_active": True,
                "member_count": 0
            },
            
            # ═══════════════════════════════════════════════════════════════
            # LIFE STAGE & PREPARATION GROUPS
            # ═══════════════════════════════════════════════════════════════
            {
                "name": "Young Adults Facing Serious Illness",
                "description": "Support for people under 40 facing life-limiting illness. Unique challenges of young adults in palliative care.",
                "condition_tags": '["young_adult", "age_specific"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Legacy & Life Stories",
                "description": "Preserve your legacy, share life stories, write letters to loved ones, and create meaningful memories.",
                "condition_tags": '["legacy", "memories", "stories"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "End-of-Life Planning",
                "description": "Discuss end-of-life wishes, funeral planning, and preparing for death with dignity and peace.",
                "condition_tags": '["end_of_life", "planning", "death"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Bereavement & Grief (Pre-Loss)",
                "description": "Anticipatory grief and supporting each other through the approaching loss of a loved one.",
                "condition_tags": '["bereavement", "anticipatory_grief", "loss"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "After Loss - Bereavement Support",
                "description": "Support after losing a loved one. Share grief, memories, and healing together after loss.",
                "condition_tags": '["bereavement", "grief", "loss", "after"]',
                "is_active": True,
                "member_count": 0
            },
            
            # ═══════════════════════════════════════════════════════════════
            # GHANA-SPECIFIC & CULTURAL GROUPS
            # ═══════════════════════════════════════════════════════════════
            {
                "name": "Ghanaian Cultural Support",
                "description": "Honor Ghanaian traditions, customs, and cultural practices in end-of-life care. Support in our local context.",
                "condition_tags": '["ghana", "culture", "traditions"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Twi-Speaking Support Circle",
                "description": "Ɔkra nkɔ! Support group for Twi speakers. Share in your mother tongue and find comfort in familiar language.",
                "condition_tags": '["ghana", "twi", "language"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Rural & Remote Communities",
                "description": "Support for those in rural Ghana with limited healthcare access. Share resources and strategies for remote care.",
                "condition_tags": '["ghana", "rural", "remote", "access"]',
                "is_active": True,
                "member_count": 0
            },
            
            # ═══════════════════════════════════════════════════════════════
            # GENERAL SUPPORT GROUPS
            # ═══════════════════════════════════════════════════════════════
            {
                "name": "General Palliative Care Support",
                "description": "Open to all in palliative care. Share experiences, questions, and support across all conditions and situations.",
                "condition_tags": '["general", "palliative", "all"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Hospice Care Circle",
                "description": "Support specifically for those in hospice care. Focus on comfort, dignity, and quality of remaining time.",
                "condition_tags": '["hospice", "end_of_life", "comfort"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "New to Palliative Care",
                "description": "Just starting your palliative care journey? Get oriented, ask questions, and find guidance from others further along.",
                "condition_tags": '["new", "orientation", "guidance"]',
                "is_active": True,
                "member_count": 0
            },
            {
                "name": "Living Well Every Day",
                "description": "Focus on living fully, finding joy, and making the most of each day. Celebrate life despite illness.",
                "condition_tags": '["living", "wellness", "joy", "quality_of_life"]',
                "is_active": True,
                "member_count": 0
            },
        ]
        
        print(f"\n🌱 Creating {len(groups)} community support groups...")
        
        created_groups = []
        for group_data in groups:
            group = CommunityGroup(**group_data)
            db.add(group)
            db.commit()
            db.refresh(group)
            created_groups.append(group)
            print(f"   ✅ {group.name}")
        
        print(f"\n✨ Successfully created {len(created_groups)} community groups!")
        
        # Add some sample posts to showcase the groups
        print("\n📝 Adding sample welcome posts...")
        
        # Get admin user for posting welcome messages
        admin = db.query(User).filter(User.username == "admin").first()
        
        if admin:
            sample_posts = [
                {
                    "group_name": "General Palliative Care Support",
                    "content": "Welcome to our community! 🌻 This is a safe space to share, ask questions, and support each other. You are not alone on this journey."
                },
                {
                    "group_name": "Hope & Meaning",
                    "content": "Today I found hope in a small thing - my grandchild's smile. What brings you hope today? 💫"
                },
                {
                    "group_name": "Family Caregivers Circle",
                    "content": "Remember: taking care of yourself is not selfish, it's necessary. What are you doing for self-care this week? 🌸"
                },
                {
                    "group_name": "Financial Support & Resources",
                    "content": "Did you know NHIS covers many palliative care services? Let's share resources that have helped us access care."
                },
                {
                    "group_name": "Living Well Every Day",
                    "content": "Just because we're facing serious illness doesn't mean we stop living. Share your small victories today! 🎉"
                },
                {
                    "group_name": "Humor & Laughter",
                    "content": "Laughter is good medicine! My nurse walked in during my nap and I sleep-yelled 'I'M UP!' 😂 Anyone else have funny hospital moments?"
                },
                {
                    "group_name": "Ghanaian Cultural Support",
                    "content": "Akwaaba! 🇬🇭 Let's honor our Ghanaian traditions while receiving modern palliative care. Share your experiences."
                },
                {
                    "group_name": "Pain Management & Comfort",
                    "content": "What non-medication comfort measures have worked for you? I've found warm compress and gentle music help me."
                },
            ]
            
            for post_data in sample_posts:
                group = next((g for g in created_groups if g.name == post_data["group_name"]), None)
                if group:
                    post = CommunityPost(
                        group_id=group.id,
                        author_id=admin.id,
                        display_name="Aura Care Team (Moderator)",
                        content=post_data["content"],
                        reactions='{"pray": 2, "heart": 5, "strong": 3}',
                        created_at=datetime.utcnow()
                    )
                    db.add(post)
                    print(f"   ✅ Welcome post in '{group.name}'")
            
            db.commit()
        
        print("\n" + "="*60)
        print("🎉 COMMUNITY HUB SEEDED SUCCESSFULLY!")
        print("="*60)
        print(f"\n📊 Summary:")
        print(f"   - Total Groups: {len(created_groups)}")
        print(f"   - Physical Support: 5 groups")
        print(f"   - Mental Health: 5 groups")
        print(f"   - Spiritual: 5 groups")
        print(f"   - Condition-Specific: 7 groups")
        print(f"   - Caregiver/Family: 5 groups")
        print(f"   - Practical/Financial: 5 groups")
        print(f"   - Social/Wellness: 6 groups")
        print(f"   - Life Stage: 5 groups")
        print(f"   - Ghana-Specific: 3 groups")
        print(f"   - General: 4 groups")
        print(f"\n🌍 All groups support palliative and hospice care in Ghana")
        print(f"💚 Groups cover physical, mental, spiritual, financial, and social needs")
        print("\n✅ Users can now join groups and start sharing support!\n")
        
    except Exception as e:
        print(f"\n❌ Error seeding community groups: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("\n" + "="*60)
    print("🌱 SEEDING COMMUNITY SUPPORT GROUPS")
    print("="*60)
    print("Creating comprehensive support groups for palliative & hospice care...\n")
    
    seed_community_groups()
    
    print("="*60)
    print("✅ SEEDING COMPLETE")
    print("="*60)
    print("\n📍 Next Steps:")
    print("   1. Navigate to Community Hub in the application")
    print("   2. Browse the 50 support groups")
    print("   3. Join groups that match your needs")
    print("   4. Share posts and support others")
    print("\n💡 All groups are active and ready for community engagement!\n")
