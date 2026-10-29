"""
Seed demo provider users for the Services marketplace.
Run: python seed_providers.py
Creates 16 approved provider accounts across all 8 service types.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from datetime import datetime
from src.db import get_session, User, UserProfile, UserExtended, ProviderApplication, ServiceTypeConfig
from src.db import hash_password

PROVIDERS = [
    # Nurses
    {"full_name":"Abena Mensah","username":"abena_nurse","email":"abena@demo.aura","gender":"female","region":"Greater Accra","service_type":"nurse","specialisation":"Palliative & Wound Care","years_experience":7,"bio":"Registered palliative nurse with 7 years of home-based care experience in Accra. Specialises in wound management, syringe driver administration, and end-of-life symptom control.","license_number":"NMC/GH/2019/4821","facility":"Korle Bu Teaching Hospital","score":87.5},
    {"full_name":"Kwame Asante","username":"kwame_nurse","email":"kwame@demo.aura","gender":"male","region":"Ashanti","service_type":"nurse","specialisation":"Oncology Nursing","years_experience":5,"bio":"Experienced oncology nurse providing compassionate home visits for cancer patients in the Ashanti region. Trained in pain management and family caregiver support.","license_number":"NMC/GH/2020/5234","facility":"Komfo Anokye Teaching Hospital","score":82.0},
    # Doctors
    {"full_name":"Dr. Efua Boateng","username":"dr_efua","email":"efua@demo.aura","gender":"female","region":"Greater Accra","service_type":"doctor","specialisation":"Palliative Medicine","years_experience":12,"bio":"Consultant palliative care physician with 12 years in hospice and home-based medicine. Expert in advanced symptom management, opioid prescribing, and DNACPR planning.","license_number":"GCMC/2012/3301","facility":"Private Practice - Accra","score":95.0},
    {"full_name":"Dr. Kofi Owusu","username":"dr_kofi","email":"kofi@demo.aura","gender":"male","region":"Western","service_type":"doctor","specialisation":"Geriatric Medicine","years_experience":9,"bio":"Geriatrician specialising in complex elderly patients with multiple co-morbidities. Provides home-based comprehensive assessments and medication reviews.","license_number":"GCMC/2015/4102","facility":"Takoradi Teaching Hospital","score":90.0},
    # Physiotherapists
    {"full_name":"Ama Darko","username":"ama_physio","email":"ama@demo.aura","gender":"female","region":"Ashanti","service_type":"physiotherapist","specialisation":"Palliative Rehabilitation","years_experience":6,"bio":"Physiotherapist specialising in palliative rehabilitation, lymphoedema management, and end-of-life comfort positioning. Works with patients across Kumasi and surrounds.","license_number":"HCPC/GH/2018/1234","facility":"KATH Physiotherapy Dept","score":85.0},
    {"full_name":"Emmanuel Tetteh","username":"emma_physio","email":"emmaphysio@demo.aura","gender":"male","region":"Greater Accra","service_type":"physiotherapist","specialisation":"Respiratory Physiotherapy","years_experience":4,"bio":"Respiratory physiotherapist helping patients with breathlessness, reduced mobility, and postural drainage. Based in Accra with home visit coverage across Greater Accra.","license_number":"HCPC/GH/2020/1891","facility":"37 Military Hospital","score":78.0},
    # Counsellors
    {"full_name":"Akosua Frimpong","username":"akosua_counsel","email":"akosua@demo.aura","gender":"female","region":"Greater Accra","service_type":"counsellor","specialisation":"Grief & Bereavement Counselling","years_experience":8,"bio":"BACP-accredited grief counsellor with 8 years supporting families through anticipatory grief, loss, and bereavement. Culturally sensitive practice incorporating Ghanaian traditions.","license_number":"BACP/12345","facility":"Private Practice","score":90.0},
    {"full_name":"Yaw Mensah","username":"yaw_counsel","email":"yaw@demo.aura","gender":"male","region":"Eastern","service_type":"counsellor","specialisation":"Trauma & Anxiety","years_experience":5,"bio":"Counsellor specialising in trauma, anxiety, and adjustment disorders arising from life-limiting illness. Offers sessions in Twi and English.","license_number":"BACP/67890","facility":"Hope Counselling Centre - Koforidua","score":82.0},
    # Nannies
    {"full_name":"Adjoa Aidoo","username":"adjoa_nanny","email":"adjoa@demo.aura","gender":"female","region":"Greater Accra","service_type":"nanny","specialisation":"Children Affected by Parental Illness","years_experience":6,"bio":"Specialist nanny with experience supporting children whose parents are receiving palliative care. Trained in child bereavement support and creating safe, nurturing environments.","license_number":"CC/GH/2018/0045","facility":"Private","score":88.0},
    {"full_name":"Fatima Alhassan","username":"fatima_nanny","email":"fatima@demo.aura","gender":"female","region":"Northern","service_type":"nanny","specialisation":"Infant & Toddler Care","years_experience":4,"bio":"Experienced nanny with paediatric first aid certification and experience in supporting families under stress. Speaks Dagbani, Hausa, and English.","license_number":"CC/GH/2020/0112","facility":"Private","score":80.0},
    # Masseurs
    {"full_name":"Nana Osei","username":"nana_massage","email":"nana@demo.aura","gender":"male","region":"Ashanti","service_type":"masseur","specialisation":"Oncology Massage","years_experience":5,"bio":"Certified oncology massage therapist trained to work with patients undergoing treatment or in palliative care. Provides adapted massage focused on comfort and relaxation.","license_number":"GMAT/2019/0234","facility":"Wellness Centre - Kumasi","score":82.0},
    {"full_name":"Serwa Mensah","username":"serwa_massage","email":"serwa@demo.aura","gender":"female","region":"Greater Accra","service_type":"masseur","specialisation":"Lymphoedema & Palliative Massage","years_experience":7,"bio":"Specialist in therapeutic massage for palliative patients including manual lymphatic drainage, gentle Swedish massage, and seated massage for reduced mobility patients.","license_number":"GMAT/2017/0156","facility":"Private Practice - Accra","score":90.0},
    # Social Workers
    {"full_name":"Adwoa Kumi","username":"adwoa_social","email":"adwoa@demo.aura","gender":"female","region":"Greater Accra","service_type":"social_worker","specialisation":"Palliative Family Support","years_experience":9,"bio":"Registered social worker specialising in palliative care family support, carer assessment, discharge planning, and connecting families with NHIS and community resources.","license_number":"GSWC/2015/0892","facility":"Ridge Hospital Social Work Dept","score":92.0},
    {"full_name":"Osei Bonsu","username":"osei_social","email":"osei@demo.aura","gender":"male","region":"Brong-Ahafo","service_type":"social_worker","specialisation":"Elder Care & Housing","years_experience":6,"bio":"Social worker focused on elderly palliative patients, including home safety assessments, benefits navigation, and coordinating family care packages.","license_number":"GSWC/2018/1045","facility":"Brong-Ahafo Regional Hospital","score":85.0},
    # Chaplains
    {"full_name":"Rev. Grace Appiah","username":"rev_grace","email":"grace@demo.aura","gender":"female","region":"Greater Accra","service_type":"chaplain","specialisation":"Christian & Interfaith Spiritual Care","years_experience":14,"bio":"Ordained chaplain with 14 years in clinical settings. Provides spiritual care across faiths including Christianity, Islam, and traditional African beliefs. Trained in clinical chaplaincy.","license_number":"CHAP/GH/2010/001","facility":"La General Hospital Chaplaincy","score":88.0},
    {"full_name":"Imam Abdul Rahman","username":"imam_rahman","email":"rahman@demo.aura","gender":"male","region":"Northern","service_type":"chaplain","specialisation":"Islamic Spiritual Care","years_experience":10,"bio":"Qualified chaplain and imam providing Islamic spiritual care for Muslim patients and families in palliative settings. Facilitates prayer, Quran recitation, and family guidance.","license_number":"CHAP/GH/2014/023","facility":"Tamale Teaching Hospital","score":85.0},
]

def seed():
    db = get_session()
    try:
        created = 0
        for p in PROVIDERS:
            # Skip if already exists
            if db.query(User).filter(User.username == p["username"]).first():
                print(f"  Skip (exists): {p['username']}")
                continue

            # Create approved user
            user = User(
                username=p["username"],
                email=p["email"],
                hashed_password=hash_password("DemoPass1"),
                role="provider",
                full_name=p["full_name"],
                is_active=True,
                is_verified=True,
                is_professional=True,
                professional_title=f"Verified {p['service_type'].replace('_',' ').title()}",
                created_at=datetime.utcnow(),
            )
            db.add(user)
            db.flush()

            # UserProfile
            profile = UserProfile(
                user_id=user.id,
                specialisation=p["specialisation"],
                facility_name=p["facility"],
                region=p["region"],
                language_pref="en",
            )
            db.add(profile)

            # UserExtended
            ext = UserExtended(
                user_id=user.id,
                gender=p["gender"],
            )
            db.add(ext)

            # ProviderApplication (approved)
            stype = db.query(ServiceTypeConfig).filter(ServiceTypeConfig.key == p["service_type"]).first()
            app = ProviderApplication(
                user_id=user.id,
                service_type=p["service_type"],
                bio=p["bio"],
                years_experience=p["years_experience"],
                qualifications=[],
                assessment_answers={},
                assessment_score=p["score"],
                approval_status="approved",
                submitted_at=datetime.utcnow(),
                reviewed_at=datetime.utcnow(),
            )
            db.add(app)
            created += 1
            print(f"  Created: {p['full_name']} ({p['service_type']})")

        db.commit()
        print(f"\nSeeded {created} provider(s) successfully.")
        print("Login with any username above, password: DemoPass1")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
