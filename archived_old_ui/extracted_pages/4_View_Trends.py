"""
View Trends - Project Aura
Professional Hospice Care Management Platform
"""
import streamlit as st
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src import db
from src.unified_design import setup_page, render_page_header

# Setup page with unified design
username, role = setup_page("View Trends", "📈")

# Render page header
render_page_header("View Trends", "📈", "Analyze patient data trends and patterns over time")

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
    <h1 style='color: white; margin: 0;'>📊 Patient Trends & Analytics</h1>
    <p style='margin-top: 0.5rem; opacity: 0.9;'>Visualize patient data over time</p>
</div>
""", unsafe_allow_html=True)

# Patient selection
patients = db.get_all_patients()
if not patients:
    st.warning("No patients found")
    st.stop()

patient_options = {f"{p.patient_code} (ID: {p.id})": p.id for p in patients}
selected_patient = st.selectbox("Select Patient", options=list(patient_options.keys()))
patient_id = patient_options[selected_patient]

# Date range
col1, col2 = st.columns(2)
with col1:
    start_date = st.date_input("Start Date", value=datetime.now() - timedelta(days=30))
with col2:
    end_date = st.date_input("End Date", value=datetime.now())

# Get patient data
try:
    patient_data = db.get_patient_data(patient_id, limit=100)
    
    if patient_data:
        # Convert to DataFrame
        df = pd.DataFrame([{
            'timestamp': d.timestamp,
            'pain_level': d.pain_level,
            'symptoms': d.symptoms,
            'notes': d.notes
        } for d in patient_data])
        
        df['date'] = pd.to_datetime(df['timestamp']).dt.date
        
        # Filter by date range
        df = df[(df['date'] >= start_date) & (df['date'] <= end_date)]
        
        if len(df) > 0:
            # Pain Trend Chart
            st.markdown("### 📈 Pain Level Trend")
            fig_pain = go.Figure()
            fig_pain.add_trace(go.Scatter(
                x=df['timestamp'],
                y=df['pain_level'],
                mode='lines+markers',
                name='Pain Level',
                line=dict(color='#e53e3e', width=3),
                marker=dict(size=8)
            ))
            fig_pain.update_layout(
                height=400,
                xaxis_title="Date",
                yaxis_title="Pain Level (0-10)",
                yaxis=dict(range=[0, 10]),
                hovermode='x unified'
            )
            st.plotly_chart(fig_pain, use_container_width=True)
            
            # Statistics
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Average Pain", f"{df['pain_level'].mean():.1f}/10")
            with col2:
                st.metric("Max Pain", f"{df['pain_level'].max()}/10")
            with col3:
                st.metric("Min Pain", f"{df['pain_level'].min()}/10")
            with col4:
                st.metric("Total Entries", len(df))
            
            # Symptom frequency
            st.markdown("### 📊 Symptom Frequency")
            symptom_counts = df['symptoms'].value_counts().head(10)
            
            fig_symptoms = px.bar(
                x=symptom_counts.values,
                y=symptom_counts.index,
                orientation='h',
                labels={'x': 'Count', 'y': 'Symptom'},
                color=symptom_counts.values,
                color_continuous_scale='Blues'
            )
            fig_symptoms.update_layout(height=400, showlegend=False)
            st.plotly_chart(fig_symptoms, use_container_width=True)
            
            # Daily summary
            st.markdown("### 📅 Daily Summary")
            daily_avg = df.groupby('date')['pain_level'].agg(['mean', 'min', 'max', 'count']).reset_index()
            daily_avg.columns = ['Date', 'Avg Pain', 'Min Pain', 'Max Pain', 'Entries']
            daily_avg['Avg Pain'] = daily_avg['Avg Pain'].round(1)
            
            st.dataframe(daily_avg, use_container_width=True, hide_index=True)
            
        else:
            st.info("No data found for the selected date range")
    else:
        st.info("No data logged for this patient yet")
        
except Exception as e:
    st.error(f"Error loading trend data: {e}")

