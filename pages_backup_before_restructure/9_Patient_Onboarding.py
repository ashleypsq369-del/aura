"""
Patient Onboarding - Project Aura
Professional Hospice Care Management Platform
"""
import streamlit as st
from datetime import date, datetime
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.unified_design import setup_page, render_page_header

# Setup page with unified design
username, role = setup_page("Patient Onboarding", "👤")

# Render page header
render_page_header("Patient Onboarding", "👤", "New patient intake and registration")

# Original page content below


# Simple auth check
if not st.session_state.get('authenticated', False):
    st.switch_page("pages/1_Login.py")

# Hide Streamlit branding
st.markdown("""
<style>
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
header {visibility: hidden;}
[data-testid="stSidebarNav"] {display: none;}
</style>
""", unsafe_allow_html=True)

# Get user info
username = st.session_state.get('username', 'User')
role = st.session_state.get('role', 'user')

# Sidebar
with st.sidebar:
    st.markdown(f"""
    <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem;'>
        <div style='font-size: 2rem; text-align: center; margin-bottom: 0.5rem;'>👤</div>
        <div style='font-weight: bold; font-size: 1.1rem; text-align: center;'>{username}</div>
        <div style='opacity: 0.9; font-size: 0.9rem; text-align: center;'>{role.title()}</div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("### 🧭 Navigation")
    
    if st.button("📊 Dashboard", use_container_width=True, disabled=False):
        st.switch_page("pages/2_Dashboard.py")
    if st.button("📝 Log Data", use_container_width=True):
        st.switch_page("pages/3_Log_Data.py")
    if st.button("📈 View Trends", use_container_width=True):
        st.switch_page("pages/4_View_Trends.py")
    if st.button("🤖 AI Insights", use_container_width=True):
        st.switch_page("pages/5_AI_Insights.py")
    if st.button("🔔 Alerts", use_container_width=True):
        st.switch_page("pages/6_Alerts.py")
    if st.button("💬 Support Hub", use_container_width=True):
        st.switch_page("pages/7_Support_Hub.py")
    
    st.markdown("---")
    
    if st.button("🚪 Logout", use_container_width=True, type="primary"):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.switch_page("pages/1_Login.py")


st.markdown("""
<div style='background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); color: white; padding: 2rem; border-radius: 16px; margin-bottom: 2rem;'>
    <h1 style='color: white; margin: 0;'>📋 Patient Onboarding</h1>
    <p style='margin-top: 0.5rem; opacity: 0.9;'>Comprehensive patient registration and intake</p>
</div>
""", unsafe_allow_html=True)

# Onboarding progress
if 'onboarding_step' not in st.session_state:
    st.session_state.onboarding_step = 1

# Progress indicator
progress_steps = ["Basic Info", "Medical History", "Insurance", "Emergency Contacts", "Preferences", "Review"]
current_step = st.session_state.onboarding_step

col1, col2, col3, col4, col5, col6 = st.columns(6)
cols = [col1, col2, col3, col4, col5, col6]

for i, (col, step) in enumerate(zip(cols, progress_steps), 1):
    with col:
        if i < current_step:
            st.markdown(f"✅ **{step}**")
        elif i == current_step:
            st.markdown(f"🔵 **{step}**")
        else:
            st.markdown(f"⚪ {step}")

st.progress((current_step - 1) / (len(progress_steps) - 1))

st.markdown("---")

# Step 1: Basic Information
if current_step == 1:
    st.markdown("### 📝 Step 1: Basic Information")
    
    with st.form("basic_info"):
        col1, col2 = st.columns(2)
        
        with col1:
            first_name = st.text_input("First Name *", placeholder="John")
            middle_name = st.text_input("Middle Name", placeholder="Michael")
            last_name = st.text_input("Last Name *", placeholder="Doe")
            
            dob = st.date_input("Date of Birth *", min_value=date(1900, 1, 1), max_value=date.today())
            gender = st.selectbox("Gender *", ["Male", "Female", "Non-binary", "Prefer not to say"])
            ssn = st.text_input("Social Security Number *", placeholder="XXX-XX-XXXX", type="password")
        
        with col2:
            phone = st.text_input("Phone Number *", placeholder="(555) 123-4567")
            email = st.text_input("Email", placeholder="john.doe@email.com")
            address = st.text_area("Address *", placeholder="123 Main St\nApt 4B\nCity, State ZIP")
            preferred_language = st.selectbox("Preferred Language", ["English", "Spanish", "Chinese", "Vietnamese", "Other"])
        
        st.markdown("### 👤 Demographics")
        
        col1, col2 = st.columns(2)
        with col1:
            marital_status = st.selectbox("Marital Status", ["Single", "Married", "Divorced", "Widowed", "Separated"])
            ethnicity = st.selectbox("Ethnicity", ["Hispanic or Latino", "Not Hispanic or Latino", "Prefer not to say"])
        
        with col2:
            race = st.multiselect("Race", ["White", "Black or African American", "Asian", "Native American", "Pacific Islander", "Other"])
            religion = st.text_input("Religion (optional)", placeholder="Optional")
        
        submitted = st.form_submit_button("Next Step →")
        
        if submitted:
            if first_name and last_name and phone and address:
                st.session_state.basic_info = {
                    'first_name': first_name,
                    'middle_name': middle_name,
                    'last_name': last_name,
                    'dob': dob,
                    'gender': gender,
                    'ssn': ssn,
                    'phone': phone,
                    'email': email,
                    'address': address,
                    'preferred_language': preferred_language,
                    'marital_status': marital_status,
                    'ethnicity': ethnicity,
                    'race': race,
                    'religion': religion
                }
                st.session_state.onboarding_step = 2
                st.rerun()
            else:
                st.error("Please fill in all required fields marked with *")

# Step 2: Medical History
elif current_step == 2:
    st.markdown("### 🏥 Step 2: Medical History")
    
    with st.form("medical_history"):
        st.markdown("#### Primary Diagnosis")
        primary_diagnosis = st.text_area("Primary Hospice Diagnosis *", placeholder="e.g., Stage IV Lung Cancer")
        diagnosis_date = st.date_input("Date of Diagnosis", max_value=date.today())
        
        st.markdown("#### Medical Conditions")
        conditions = st.multiselect(
            "Select all that apply:",
            ["Diabetes", "Hypertension", "Heart Disease", "COPD", "Kidney Disease", 
             "Liver Disease", "Dementia", "Stroke", "Cancer", "Other"]
        )
        other_conditions = st.text_area("Other Medical Conditions", placeholder="List any other conditions...")
        
        st.markdown("#### Allergies")
        has_allergies = st.checkbox("Patient has known allergies")
        allergies = ""
        if has_allergies:
            allergies = st.text_area("List Allergies *", placeholder="Medication, food, environmental allergies...")
        
        st.markdown("#### Current Medications")
        medications = st.text_area(
            "Current Medications",
            placeholder="List all current medications with dosages...\ne.g., Morphine 10mg every 4 hours"
        )
        
        st.markdown("#### Functional Status")
        col1, col2 = st.columns(2)
        with col1:
            mobility = st.select_slider("Mobility", ["Bedbound", "Wheelchair", "Walker", "Cane", "Independent"])
            adl_assistance = st.select_slider("ADL Assistance Needed", ["Total", "Extensive", "Moderate", "Minimal", "Independent"])
        
        with col2:
            cognitive_status = st.select_slider("Cognitive Status", ["Severe Impairment", "Moderate", "Mild", "Alert & Oriented"])
            pain_level = st.slider("Current Pain Level (0-10)", 0, 10, 5)
        
        col1, col2 = st.columns(2)
        with col1:
            if st.form_submit_button("← Previous"):
                st.session_state.onboarding_step = 1
                st.rerun()
        
        with col2:
            submitted = st.form_submit_button("Next Step →")
        
        if submitted:
            if primary_diagnosis:
                st.session_state.medical_history = {
                    'primary_diagnosis': primary_diagnosis,
                    'diagnosis_date': diagnosis_date,
                    'conditions': conditions,
                    'other_conditions': other_conditions,
                    'has_allergies': has_allergies,
                    'allergies': allergies,
                    'medications': medications,
                    'mobility': mobility,
                    'adl_assistance': adl_assistance,
                    'cognitive_status': cognitive_status,
                    'pain_level': pain_level
                }
                st.session_state.onboarding_step = 3
                st.rerun()
            else:
                st.error("Please provide primary diagnosis")

# Step 3: Insurance Information
elif current_step == 3:
    st.markdown("### 💳 Step 3: Insurance Information")
    
    with st.form("insurance_info"):
        st.markdown("#### Primary Insurance")
        col1, col2 = st.columns(2)
        
        with col1:
            primary_insurance = st.text_input("Insurance Provider *", placeholder="e.g., Medicare")
            policy_number = st.text_input("Policy Number *", placeholder="Policy/Member ID")
            group_number = st.text_input("Group Number", placeholder="Group ID (if applicable)")
        
        with col2:
            policy_holder = st.text_input("Policy Holder Name *", placeholder="Name on policy")
            relationship = st.selectbox("Relationship to Patient", ["Self", "Spouse", "Parent", "Child", "Other"])
            effective_date = st.date_input("Effective Date", max_value=date.today())
        
        st.markdown("#### Secondary Insurance (if applicable)")
        has_secondary = st.checkbox("Patient has secondary insurance")
        
        if has_secondary:
            col1, col2 = st.columns(2)
            with col1:
                secondary_insurance = st.text_input("Secondary Provider", placeholder="Insurance name")
                secondary_policy = st.text_input("Secondary Policy Number", placeholder="Policy ID")
            with col2:
                secondary_holder = st.text_input("Secondary Policy Holder", placeholder="Name on policy")
                secondary_relationship = st.selectbox("Relationship", ["Self", "Spouse", "Parent", "Child", "Other"], key="sec_rel")
        
        st.markdown("#### Medicare/Medicaid")
        col1, col2 = st.columns(2)
        with col1:
            has_medicare = st.checkbox("Medicare")
            if has_medicare:
                medicare_number = st.text_input("Medicare Number", placeholder="Medicare ID")
        
        with col2:
            has_medicaid = st.checkbox("Medicaid")
            if has_medicaid:
                medicaid_number = st.text_input("Medicaid Number", placeholder="Medicaid ID")
        
        col1, col2 = st.columns(2)
        with col1:
            if st.form_submit_button("← Previous"):
                st.session_state.onboarding_step = 2
                st.rerun()
        
        with col2:
            submitted = st.form_submit_button("Next Step →")
        
        if submitted:
            if primary_insurance and policy_number and policy_holder:
                st.session_state.insurance_info = {
                    'primary_insurance': primary_insurance,
                    'policy_number': policy_number,
                    'group_number': group_number,
                    'policy_holder': policy_holder,
                    'relationship': relationship,
                    'effective_date': effective_date,
                    'has_secondary': has_secondary,
                    'has_medicare': has_medicare,
                    'has_medicaid': has_medicaid
                }
                st.session_state.onboarding_step = 4
                st.rerun()
            else:
                st.error("Please fill in all required insurance fields")

# Step 4: Emergency Contacts
elif current_step == 4:
    st.markdown("### 🚨 Step 4: Emergency Contacts")
    
    with st.form("emergency_contacts"):
        st.markdown("#### Primary Emergency Contact")
        col1, col2 = st.columns(2)
        
        with col1:
            ec1_name = st.text_input("Full Name *", placeholder="Jane Doe")
            ec1_relationship = st.text_input("Relationship *", placeholder="Daughter")
            ec1_phone = st.text_input("Phone Number *", placeholder="(555) 123-4567")
        
        with col2:
            ec1_email = st.text_input("Email", placeholder="jane.doe@email.com")
            ec1_address = st.text_area("Address", placeholder="123 Main St, City, State ZIP")
            ec1_is_caregiver = st.checkbox("Primary Caregiver")
        
        st.markdown("#### Secondary Emergency Contact")
        col1, col2 = st.columns(2)
        
        with col1:
            ec2_name = st.text_input("Full Name", placeholder="Bob Smith", key="ec2_name")
            ec2_relationship = st.text_input("Relationship", placeholder="Son", key="ec2_rel")
            ec2_phone = st.text_input("Phone Number", placeholder="(555) 234-5678", key="ec2_phone")
        
        with col2:
            ec2_email = st.text_input("Email", placeholder="bob.smith@email.com", key="ec2_email")
            ec2_address = st.text_area("Address", placeholder="456 Oak Ave, City, State ZIP", key="ec2_addr")
            ec2_is_caregiver = st.checkbox("Secondary Caregiver", key="ec2_care")
        
        st.markdown("#### Healthcare Proxy / Power of Attorney")
        has_proxy = st.checkbox("Patient has designated healthcare proxy")
        
        if has_proxy:
            col1, col2 = st.columns(2)
            with col1:
                proxy_name = st.text_input("Proxy Name *", placeholder="Full name")
                proxy_phone = st.text_input("Proxy Phone *", placeholder="Phone number")
            with col2:
                proxy_relationship = st.text_input("Proxy Relationship", placeholder="Relationship to patient")
                proxy_document = st.file_uploader("Upload POA Document (optional)", type=['pdf', 'jpg', 'png'])
        
        st.markdown("#### Advance Directives")
        col1, col2 = st.columns(2)
        with col1:
            has_living_will = st.checkbox("Living Will on file")
            has_dnr = st.checkbox("DNR (Do Not Resuscitate)")
        with col2:
            has_polst = st.checkbox("POLST form completed")
            has_advance_directive = st.checkbox("Advance Directive on file")
        
        col1, col2 = st.columns(2)
        with col1:
            if st.form_submit_button("← Previous"):
                st.session_state.onboarding_step = 3
                st.rerun()
        
        with col2:
            submitted = st.form_submit_button("Next Step →")
        
        if submitted:
            if ec1_name and ec1_relationship and ec1_phone:
                st.session_state.emergency_contacts = {
                    'ec1_name': ec1_name,
                    'ec1_relationship': ec1_relationship,
                    'ec1_phone': ec1_phone,
                    'ec1_email': ec1_email,
                    'ec1_address': ec1_address,
                    'ec1_is_caregiver': ec1_is_caregiver,
                    'ec2_name': ec2_name,
                    'ec2_relationship': ec2_relationship,
                    'ec2_phone': ec2_phone,
                    'has_proxy': has_proxy,
                    'has_living_will': has_living_will,
                    'has_dnr': has_dnr,
                    'has_polst': has_polst,
                    'has_advance_directive': has_advance_directive
                }
                st.session_state.onboarding_step = 5
                st.rerun()
            else:
                st.error("Please provide at least one emergency contact")

# Step 5: Patient Preferences
elif current_step == 5:
    st.markdown("### ⚙️ Step 5: Patient Preferences & Goals")
    
    with st.form("preferences"):
        st.markdown("#### Care Goals")
        care_goals = st.text_area(
            "What are the patient's primary goals for hospice care? *",
            placeholder="e.g., Pain management, comfort, spending time with family...",
            height=100
        )
        
        st.markdown("#### Communication Preferences")
        col1, col2 = st.columns(2)
        
        with col1:
            preferred_contact = st.multiselect(
                "Preferred Contact Methods",
                ["Phone Call", "Text Message", "Email", "Portal Message"]
            )
            best_time = st.selectbox(
                "Best Time to Contact",
                ["Morning (8AM-12PM)", "Afternoon (12PM-5PM)", "Evening (5PM-8PM)", "Anytime"]
            )
        
        with col2:
            language_interpreter = st.checkbox("Requires language interpreter")
            if language_interpreter:
                interpreter_language = st.text_input("Language", placeholder="Spanish, Chinese, etc.")
            
            hearing_impaired = st.checkbox("Hearing impaired")
            vision_impaired = st.checkbox("Vision impaired")
        
        st.markdown("#### Spiritual & Cultural Preferences")
        col1, col2 = st.columns(2)
        
        with col1:
            spiritual_support = st.checkbox("Would like spiritual support")
            if spiritual_support:
                spiritual_preference = st.text_input("Spiritual/Religious Preference", placeholder="e.g., Christian, Buddhist, etc.")
            
            cultural_considerations = st.text_area(
                "Cultural Considerations",
                placeholder="Any cultural practices or preferences we should know about..."
            )
        
        with col2:
            dietary_restrictions = st.multiselect(
                "Dietary Restrictions",
                ["Vegetarian", "Vegan", "Kosher", "Halal", "Gluten-free", "Diabetic", "Low sodium", "Other"]
            )
            
            if "Other" in dietary_restrictions:
                other_dietary = st.text_input("Other Dietary Needs", placeholder="Specify...")
        
        st.markdown("#### Environment Preferences")
        col1, col2 = st.columns(2)
        
        with col1:
            preferred_location = st.selectbox(
                "Preferred Care Location",
                ["Home", "Hospice Facility", "Hospital", "Nursing Home", "Flexible"]
            )
            
            pet_presence = st.checkbox("Pets in home")
            if pet_presence:
                pet_details = st.text_input("Pet Details", placeholder="Type and number of pets")
        
        with col2:
            music_preference = st.text_input("Music Preferences", placeholder="Favorite music or artists")
            room_preferences = st.text_area(
                "Room/Environment Preferences",
                placeholder="e.g., Quiet, windows open, specific temperature..."
            )
        
        st.markdown("#### Visitor Preferences")
        visitor_restrictions = st.text_area(
            "Visitor Preferences or Restrictions",
            placeholder="Any preferences about visitors, visiting hours, etc."
        )
        
        col1, col2 = st.columns(2)
        with col1:
            if st.form_submit_button("← Previous"):
                st.session_state.onboarding_step = 4
                st.rerun()
        
        with col2:
            submitted = st.form_submit_button("Review & Submit →")
        
        if submitted:
            if care_goals and preferred_contact:
                st.session_state.preferences = {
                    'care_goals': care_goals,
                    'preferred_contact': preferred_contact,
                    'best_time': best_time,
                    'language_interpreter': language_interpreter,
                    'hearing_impaired': hearing_impaired,
                    'vision_impaired': vision_impaired,
                    'spiritual_support': spiritual_support,
                    'dietary_restrictions': dietary_restrictions,
                    'preferred_location': preferred_location,
                    'pet_presence': pet_presence,
                    'music_preference': music_preference,
                    'visitor_restrictions': visitor_restrictions
                }
                st.session_state.onboarding_step = 6
                st.rerun()
            else:
                st.error("Please provide care goals and contact preferences")

# Step 6: Review and Submit
elif current_step == 6:
    st.markdown("### ✅ Step 6: Review & Submit")
    
    st.info("Please review all information before submitting. You can go back to edit any section.")
    
    # Display all collected information
    with st.expander("📝 Basic Information", expanded=True):
        if 'basic_info' in st.session_state:
            info = st.session_state.basic_info
            col1, col2 = st.columns(2)
            with col1:
                st.write(f"**Name:** {info['first_name']} {info['middle_name']} {info['last_name']}")
                st.write(f"**DOB:** {info['dob']}")
                st.write(f"**Gender:** {info['gender']}")
                st.write(f"**Phone:** {info['phone']}")
            with col2:
                st.write(f"**Email:** {info['email']}")
                st.write(f"**Language:** {info['preferred_language']}")
                st.write(f"**Marital Status:** {info['marital_status']}")
            
            if st.button("Edit Basic Info"):
                st.session_state.onboarding_step = 1
                st.rerun()
    
    with st.expander("🏥 Medical History"):
        if 'medical_history' in st.session_state:
            med = st.session_state.medical_history
            st.write(f"**Primary Diagnosis:** {med['primary_diagnosis']}")
            st.write(f"**Conditions:** {', '.join(med['conditions'])}")
            st.write(f"**Mobility:** {med['mobility']}")
            st.write(f"**Pain Level:** {med['pain_level']}/10")
            
            if st.button("Edit Medical History"):
                st.session_state.onboarding_step = 2
                st.rerun()
    
    with st.expander("💳 Insurance Information"):
        if 'insurance_info' in st.session_state:
            ins = st.session_state.insurance_info
            st.write(f"**Primary Insurance:** {ins['primary_insurance']}")
            st.write(f"**Policy Number:** {ins['policy_number']}")
            st.write(f"**Policy Holder:** {ins['policy_holder']}")
            
            if st.button("Edit Insurance"):
                st.session_state.onboarding_step = 3
                st.rerun()
    
    with st.expander("🚨 Emergency Contacts"):
        if 'emergency_contacts' in st.session_state:
            ec = st.session_state.emergency_contacts
            st.write(f"**Primary Contact:** {ec['ec1_name']} ({ec['ec1_relationship']})")
            st.write(f"**Phone:** {ec['ec1_phone']}")
            st.write(f"**DNR Status:** {'Yes' if ec['has_dnr'] else 'No'}")
            
            if st.button("Edit Emergency Contacts"):
                st.session_state.onboarding_step = 4
                st.rerun()
    
    with st.expander("⚙️ Preferences"):
        if 'preferences' in st.session_state:
            pref = st.session_state.preferences
            st.write(f"**Care Goals:** {pref['care_goals']}")
            st.write(f"**Contact Methods:** {', '.join(pref['preferred_contact'])}")
            st.write(f"**Preferred Location:** {pref['preferred_location']}")
            
            if st.button("Edit Preferences"):
                st.session_state.onboarding_step = 5
                st.rerun()
    
    st.markdown("---")
    
    # Consent and agreements
    st.markdown("### 📋 Consent & Agreements")
    
    consent_hospice = st.checkbox("I consent to hospice care services *")
    consent_privacy = st.checkbox("I acknowledge receipt of HIPAA Privacy Notice *")
    consent_communication = st.checkbox("I consent to communication via selected methods *")
    consent_share = st.checkbox("I authorize sharing of medical information with care team *")
    
    signature = st.text_input("Electronic Signature (Type Full Name) *", placeholder="Type your full name")
    signature_date = st.date_input("Date", value=date.today())
    
    st.markdown("---")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("← Previous", use_container_width=True):
            st.session_state.onboarding_step = 5
            st.rerun()
    
    with col2:
        if st.button("Save as Draft", use_container_width=True):
            st.success("✅ Application saved as draft")
    
    with col3:
        if st.button("Submit Application", use_container_width=True, type="primary"):
            if consent_hospice and consent_privacy and consent_communication and consent_share and signature:
                # In real app, save to database
                st.success("✅ Patient onboarding completed successfully!")
                st.balloons()
                
                st.info("""
                **Next Steps:**
                1. Our intake coordinator will review your application
                2. You'll receive a call within 24 hours
                3. Initial assessment will be scheduled
                4. Care team will be assigned
                
                **Application ID:** ONB-2024-{:05d}
                """.format(12345))
                
                if st.button("Return to Dashboard"):
                    st.session_state.onboarding_step = 1
                    st.switch_page("pages/2_Dashboard.py")
            else:
                st.error("Please complete all required consents and signature")

