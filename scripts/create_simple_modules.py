"""Create simple working modules"""

modules = {
    'log_data_module.py': ('Log Data', '📝', 'Log patient data and symptoms'),
    'view_trends_module.py': ('View Trends', '📊', 'View patient trends and analytics'),
    'ai_insights_module.py': ('AI Insights', '🤖', 'AI-powered insights and predictions'),
    'alerts_module.py': ('Alerts', '🔔', 'View and manage alerts'),
    'support_module.py': ('Support Hub', '💬', 'Access support resources'),
    'bereavement_module.py': ('Bereavement', '🕊️', 'Bereavement support and resources'),
    'onboarding_module.py': ('Patient Onboarding', '🏥', 'Onboard new patients'),
    'simulation_module.py': ('Clinical Simulation', '🎬', 'Clinical scenario simulation'),
    'medications_module.py': ('Medications', '💊', 'Medication management'),
    'appointments_module.py': ('Appointments', '📅', 'Schedule and manage appointments'),
    'caregiver_module.py': ('Caregiver Portal', '👥', 'Caregiver resources and tools'),
    'memories_module.py': ('Memory Vault', '📸', 'Store and share memories'),
    'journal_module.py': ('Journal', '📔', 'Personal journaling'),
    'care_plan_module.py': ('Care Plan', '📋', 'Manage care plans'),
    'functional_module.py': ('Functional Status', '📊', 'Track functional status')
}

for filename, (title, icon, description) in modules.items():
    content = f'''"""{ title} Module"""
import streamlit as st

def render():
    st.markdown("""
    <div style='background: linear-gradient(135deg, #4299E1 0%, #2C5282 100%); color: white; padding: 2rem; border-radius: 20px; margin-bottom: 2rem;'>
        <div style='font-size: 3rem; text-align: center; margin-bottom: 1rem;'>{icon}</div>
        <h1 style='color: white; text-align: center; margin: 0;'>{title}</h1>
        <p style='text-align: center; font-size: 1.1rem; margin-top: 1rem; opacity: 0.9;'>{description}</p>
    </div>
    """, unsafe_allow_html=True)
    
    st.info("ℹ️ This feature is available. Full implementation coming soon.")
    st.success("✅ Page loaded successfully")
'''
    
    with open(f'page_modules/{filename}', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Created {filename}")

print("\n✅ All modules created!")
