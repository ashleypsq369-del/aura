"""
Clinical Simulation - Project Aura
Professional Hospice Care Management Platform
"""
import streamlit as st
import pandas as pd
from datetime import datetime, timedelta
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.unified_design import setup_page, render_page_header

# Setup page with unified design
username, role = setup_page("Clinical Simulation", "🎓")

# Render page header
render_page_header("Clinical Simulation", "🎓", "Training scenarios and skill development")

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
<div style='background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); color: white; padding: 2rem; border-radius: 16px; margin-bottom: 2rem;'>
    <h1 style='color: white; margin: 0;'>🎯 Clinical Simulation Center</h1>
    <p style='margin-top: 0.5rem; opacity: 0.9;'>Training scenarios and clinical decision support</p>
</div>
""", unsafe_allow_html=True)

# Simulation tabs
tab1, tab2, tab3, tab4 = st.tabs(["🎮 Active Scenarios", "📚 Scenario Library", "📊 Performance Analytics", "🏆 Achievements"])

with tab1:
    st.markdown("### 🎮 Active Clinical Scenarios")
    
    # Scenario selection
    scenarios = {
        "Pain Crisis Management": {
            "difficulty": "Advanced",
            "duration": "15-20 min",
            "description": "Patient experiencing breakthrough pain requiring immediate intervention",
            "objectives": ["Assess pain level", "Review medication history", "Implement intervention", "Document response"]
        },
        "End-of-Life Care": {
            "difficulty": "Expert",
            "duration": "30-45 min",
            "description": "Supporting patient and family through active dying phase",
            "objectives": ["Symptom management", "Family support", "Spiritual care", "Documentation"]
        },
        "Medication Reconciliation": {
            "difficulty": "Intermediate",
            "duration": "10-15 min",
            "description": "Review and update patient medication regimen",
            "objectives": ["Identify discrepancies", "Check interactions", "Update orders", "Patient education"]
        },
        "Family Conference": {
            "difficulty": "Advanced",
            "duration": "20-30 min",
            "description": "Facilitate difficult conversation about goals of care",
            "objectives": ["Active listening", "Empathy", "Clear communication", "Shared decision-making"]
        },
        "Symptom Assessment": {
            "difficulty": "Beginner",
            "duration": "10 min",
            "description": "Comprehensive symptom assessment for new patient",
            "objectives": ["Complete assessment", "Identify priorities", "Develop care plan", "Set goals"]
        }
    }
    
    selected_scenario = st.selectbox("Select a Scenario", list(scenarios.keys()))
    
    scenario_info = scenarios[selected_scenario]
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Difficulty", scenario_info["difficulty"])
    with col2:
        st.metric("Duration", scenario_info["duration"])
    with col3:
        difficulty_colors = {"Beginner": "🟢", "Intermediate": "🟡", "Advanced": "🟠", "Expert": "🔴"}
        st.metric("Level", difficulty_colors.get(scenario_info["difficulty"], "⚪"))
    
    st.info(f"**Scenario Description:** {scenario_info['description']}")
    
    st.markdown("**Learning Objectives:**")
    for obj in scenario_info["objectives"]:
        st.write(f"✓ {obj}")
    
    # Scenario state management
    if 'scenario_active' not in st.session_state:
        st.session_state.scenario_active = False
        st.session_state.scenario_step = 0
        st.session_state.scenario_score = 0
        st.session_state.scenario_decisions = []
    
    if not st.session_state.scenario_active:
        col1, col2 = st.columns(2)
        with col1:
            if st.button("🎬 Start Scenario", use_container_width=True, type="primary"):
                st.session_state.scenario_active = True
                st.session_state.scenario_step = 1
                st.session_state.scenario_score = 0
                st.session_state.scenario_decisions = []
                st.session_state.start_time = datetime.now()
                st.rerun()
        
        with col2:
            if st.button("📖 View Scenario Details", use_container_width=True):
                st.info("Detailed scenario information would be displayed here")
    
    else:
        # Active scenario simulation
        st.markdown("---")
        st.markdown(f"### 🎬 Scenario in Progress: {selected_scenario}")
        
        # Progress bar
        progress = st.session_state.scenario_step / 5
        st.progress(progress)
        st.write(f"Step {st.session_state.scenario_step} of 5")
        
        # Scenario steps based on selection
        if selected_scenario == "Pain Crisis Management":
            if st.session_state.scenario_step == 1:
                st.markdown("#### Step 1: Initial Assessment")
                st.warning("**Scenario:** You receive a call from a family member. The patient is crying out in pain and appears very distressed.")
                
                st.markdown("**Patient Information:**")
                st.write("- Name: Sarah Johnson, 68 years old")
                st.write("- Diagnosis: Metastatic breast cancer")
                st.write("- Current pain medication: Morphine 15mg q4h")
                st.write("- Last dose: 2 hours ago")
                
                st.markdown("**What is your first action?**")
                
                action = st.radio(
                    "Select your response:",
                    [
                        "A. Immediately increase morphine dose without assessment",
                        "B. Perform comprehensive pain assessment using 0-10 scale",
                        "C. Tell family to wait until next scheduled dose",
                        "D. Call 911"
                    ]
                )
                
                if st.button("Submit Decision"):
                    if "B." in action:
                        st.success("✅ Correct! Comprehensive assessment is essential before intervention.")
                        st.session_state.scenario_score += 20
                        st.session_state.scenario_decisions.append({"step": 1, "correct": True})
                    else:
                        st.error("❌ Not optimal. Always assess before intervening.")
                        st.session_state.scenario_decisions.append({"step": 1, "correct": False})
                    
                    st.session_state.scenario_step = 2
                    st.rerun()
            
            elif st.session_state.scenario_step == 2:
                st.markdown("#### Step 2: Pain Assessment Results")
                st.info("**Assessment Findings:**")
                st.write("- Pain level: 9/10")
                st.write("- Location: Right hip and lower back")
                st.write("- Quality: Sharp, constant")
                st.write("- Onset: Gradual increase over past 3 hours")
                st.write("- Aggravating factors: Movement")
                st.write("- Vital signs: BP 145/90, HR 98, RR 22, Temp 98.6°F")
                
                st.markdown("**What intervention do you recommend?**")
                
                intervention = st.radio(
                    "Select intervention:",
                    [
                        "A. Administer breakthrough dose of morphine 5mg PO now",
                        "B. Apply heat pack and reassess in 30 minutes",
                        "C. Reposition patient only",
                        "D. Wait for physician to call back"
                    ]
                )
                
                if st.button("Submit Decision"):
                    if "A." in intervention:
                        st.success("✅ Correct! Breakthrough medication is appropriate for severe pain.")
                        st.session_state.scenario_score += 20
                        st.session_state.scenario_decisions.append({"step": 2, "correct": True})
                    else:
                        st.error("❌ Severe pain requires immediate pharmacological intervention.")
                        st.session_state.scenario_decisions.append({"step": 2, "correct": False})
                    
                    st.session_state.scenario_step = 3
                    st.rerun()
            
            elif st.session_state.scenario_step == 3:
                st.markdown("#### Step 3: Medication Administration")
                st.success("Breakthrough dose administered at 14:30")
                
                st.markdown("**What should you do next?**")
                
                next_action = st.radio(
                    "Select next action:",
                    [
                        "A. Leave immediately after giving medication",
                        "B. Stay and reassess pain in 30 minutes",
                        "C. Document and leave",
                        "D. Call physician immediately"
                    ]
                )
                
                if st.button("Submit Decision"):
                    if "B." in next_action:
                        st.success("✅ Correct! Always reassess after intervention.")
                        st.session_state.scenario_score += 20
                        st.session_state.scenario_decisions.append({"step": 3, "correct": True})
                    else:
                        st.error("❌ Reassessment is critical to evaluate intervention effectiveness.")
                        st.session_state.scenario_decisions.append({"step": 3, "correct": False})
                    
                    st.session_state.scenario_step = 4
                    st.rerun()
            
            elif st.session_state.scenario_step == 4:
                st.markdown("#### Step 4: Reassessment")
                st.info("**30 minutes later:**")
                st.write("- Pain level: 4/10")
                st.write("- Patient appears more comfortable")
                st.write("- Vital signs stable")
                st.write("- Patient able to rest")
                
                st.markdown("**What documentation is required?**")
                
                doc_items = st.multiselect(
                    "Select all that apply:",
                    [
                        "Initial pain assessment findings",
                        "Medication administered (dose, route, time)",
                        "Patient response to intervention",
                        "Reassessment findings",
                        "Family education provided",
                        "Physician notification (if applicable)"
                    ]
                )
                
                if st.button("Submit Documentation"):
                    if len(doc_items) >= 4:
                        st.success("✅ Excellent! Comprehensive documentation completed.")
                        st.session_state.scenario_score += 20
                        st.session_state.scenario_decisions.append({"step": 4, "correct": True})
                    else:
                        st.warning("⚠️ More complete documentation is needed.")
                        st.session_state.scenario_score += 10
                        st.session_state.scenario_decisions.append({"step": 4, "correct": False})
                    
                    st.session_state.scenario_step = 5
                    st.rerun()
            
            elif st.session_state.scenario_step == 5:
                st.markdown("#### Step 5: Follow-up Planning")
                st.success("Pain crisis successfully managed!")
                
                st.markdown("**What follow-up actions are needed?**")
                
                followup = st.multiselect(
                    "Select all appropriate actions:",
                    [
                        "Contact physician about pain pattern",
                        "Consider medication adjustment",
                        "Educate family on breakthrough medication use",
                        "Schedule follow-up visit",
                        "Update care plan",
                        "No follow-up needed"
                    ]
                )
                
                if st.button("Complete Scenario"):
                    if "No follow-up needed" not in followup and len(followup) >= 3:
                        st.success("✅ Excellent follow-up planning!")
                        st.session_state.scenario_score += 20
                        st.session_state.scenario_decisions.append({"step": 5, "correct": True})
                    else:
                        st.warning("⚠️ More comprehensive follow-up recommended.")
                        st.session_state.scenario_score += 10
                        st.session_state.scenario_decisions.append({"step": 5, "correct": False})
                    
                    # Calculate final score and time
                    end_time = datetime.now()
                    duration = (end_time - st.session_state.start_time).seconds // 60
                    
                    st.markdown("---")
                    st.markdown("### 🎉 Scenario Complete!")
                    
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.metric("Final Score", f"{st.session_state.scenario_score}/100")
                    with col2:
                        st.metric("Time Taken", f"{duration} minutes")
                    with col3:
                        correct_decisions = sum(1 for d in st.session_state.scenario_decisions if d["correct"])
                        st.metric("Correct Decisions", f"{correct_decisions}/5")
                    
                    # Performance feedback
                    if st.session_state.scenario_score >= 90:
                        st.success("🌟 **Outstanding Performance!** You demonstrated excellent clinical judgment and decision-making.")
                    elif st.session_state.scenario_score >= 70:
                        st.info("👍 **Good Performance!** You made solid clinical decisions with room for improvement.")
                    else:
                        st.warning("📚 **Needs Improvement.** Review pain management protocols and try again.")
                    
                    # Detailed feedback
                    with st.expander("📋 Detailed Performance Review"):
                        st.markdown("**Decision Analysis:**")
                        for i, decision in enumerate(st.session_state.scenario_decisions, 1):
                            status = "✅ Correct" if decision["correct"] else "❌ Incorrect"
                            st.write(f"Step {i}: {status}")
                        
                        st.markdown("**Key Learning Points:**")
                        st.write("• Always perform comprehensive assessment before intervention")
                        st.write("• Breakthrough medication is appropriate for severe pain")
                        st.write("• Reassessment is critical after any intervention")
                        st.write("• Complete documentation protects patient and provider")
                        st.write("• Follow-up planning ensures continuity of care")
                    
                    col1, col2 = st.columns(2)
                    with col1:
                        if st.button("Try Another Scenario", use_container_width=True):
                            st.session_state.scenario_active = False
                            st.session_state.scenario_step = 0
                            st.rerun()
                    
                    with col2:
                        if st.button("View Performance Analytics", use_container_width=True):
                            st.info("Navigate to Performance Analytics tab")
        
        # Add abort option
        st.markdown("---")
        if st.button("❌ Abort Scenario"):
            st.session_state.scenario_active = False
            st.session_state.scenario_step = 0
            st.warning("Scenario aborted. No score recorded.")
            st.rerun()

with tab2:
    st.markdown("### 📚 Scenario Library")
    
    # Filter scenarios
    col1, col2, col3 = st.columns(3)
    with col1:
        difficulty_filter = st.selectbox("Filter by Difficulty", ["All", "Beginner", "Intermediate", "Advanced", "Expert"])
    with col2:
        category_filter = st.selectbox("Filter by Category", ["All", "Pain Management", "End-of-Life", "Family Support", "Medication", "Assessment"])
    with col3:
        duration_filter = st.selectbox("Filter by Duration", ["All", "< 15 min", "15-30 min", "> 30 min"])
    
    # Scenario library
    library_scenarios = [
        {
            "title": "Pain Crisis Management",
            "category": "Pain Management",
            "difficulty": "Advanced",
            "duration": "15-20 min",
            "completed": True,
            "best_score": 85,
            "attempts": 3
        },
        {
            "title": "End-of-Life Care",
            "category": "End-of-Life",
            "difficulty": "Expert",
            "duration": "30-45 min",
            "completed": False,
            "best_score": 0,
            "attempts": 0
        },
        {
            "title": "Medication Reconciliation",
            "category": "Medication",
            "difficulty": "Intermediate",
            "duration": "10-15 min",
            "completed": True,
            "best_score": 92,
            "attempts": 2
        },
        {
            "title": "Family Conference",
            "category": "Family Support",
            "difficulty": "Advanced",
            "duration": "20-30 min",
            "completed": True,
            "best_score": 78,
            "attempts": 1
        },
        {
            "title": "Symptom Assessment",
            "category": "Assessment",
            "difficulty": "Beginner",
            "duration": "10 min",
            "completed": True,
            "best_score": 95,
            "attempts": 1
        },
        {
            "title": "Respiratory Distress",
            "category": "Assessment",
            "difficulty": "Advanced",
            "duration": "15-20 min",
            "completed": False,
            "best_score": 0,
            "attempts": 0
        },
        {
            "title": "Delirium Management",
            "category": "Assessment",
            "difficulty": "Expert",
            "duration": "20-30 min",
            "completed": False,
            "best_score": 0,
            "attempts": 0
        },
        {
            "title": "Grief Support",
            "category": "Family Support",
            "difficulty": "Intermediate",
            "duration": "15-20 min",
            "completed": True,
            "best_score": 88,
            "attempts": 2
        }
    ]
    
    # Display scenarios
    for scenario in library_scenarios:
        with st.container():
            col1, col2, col3, col4, col5 = st.columns([3, 1, 1, 1, 1])
            
            with col1:
                status_icon = "✅" if scenario["completed"] else "⭕"
                st.markdown(f"{status_icon} **{scenario['title']}**")
                st.caption(f"{scenario['category']}")
            
            with col2:
                st.write(scenario['difficulty'])
            
            with col3:
                st.write(scenario['duration'])
            
            with col4:
                if scenario['completed']:
                    st.metric("Best", f"{scenario['best_score']}%")
                else:
                    st.write("Not started")
            
            with col5:
                if st.button("Start", key=f"start_{scenario['title']}"):
                    st.info(f"Starting {scenario['title']}...")
            
            st.markdown("---")

with tab3:
    st.markdown("### 📊 Performance Analytics")
    
    # Overall statistics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Scenarios Completed", "5", "+1")
    with col2:
        st.metric("Average Score", "87.6%", "+2.3%")
    with col3:
        st.metric("Total Time", "2.5 hrs", "+0.5 hrs")
    with col4:
        st.metric("Skill Level", "Advanced", "↗️")
    
    # Performance over time
    st.markdown("#### 📈 Performance Trends")
    
    dates = pd.date_range(start=datetime.now() - timedelta(days=30), periods=10, freq='3D')
    scores = [72, 75, 78, 82, 85, 83, 87, 89, 90, 92]
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=dates,
        y=scores,
        mode='lines+markers',
        name='Score',
        line=dict(color='#4299e1', width=3),
        marker=dict(size=10)
    ))
    
    fig.update_layout(
        title="Score Progression",
        xaxis_title="Date",
        yaxis_title="Score (%)",
        height=400,
        yaxis=dict(range=[0, 100])
    )
    
    st.plotly_chart(fig, use_container_width=True)
    
    # Performance by category
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### 🎯 Performance by Category")
        
        category_data = pd.DataFrame({
            'Category': ['Pain Management', 'Assessment', 'Family Support', 'Medication', 'End-of-Life'],
            'Score': [85, 95, 88, 92, 0],
            'Attempts': [3, 1, 2, 2, 0]
        })
        
        fig2 = go.Figure(data=[
            go.Bar(x=category_data['Category'], y=category_data['Score'], marker_color='#48bb78')
        ])
        
        fig2.update_layout(
            title="Average Score by Category",
            yaxis=dict(range=[0, 100]),
            height=300
        )
        
        st.plotly_chart(fig2, use_container_width=True)
    
    with col2:
        st.markdown("#### ⏱️ Time Efficiency")
        
        time_data = pd.DataFrame({
            'Scenario': ['Pain Crisis', 'Med Recon', 'Symptom Assess', 'Family Conf', 'Grief Support'],
            'Time (min)': [18, 12, 9, 25, 17],
            'Target (min)': [20, 15, 10, 30, 20]
        })
        
        fig3 = go.Figure(data=[
            go.Bar(name='Actual', x=time_data['Scenario'], y=time_data['Time (min)'], marker_color='#4299e1'),
            go.Bar(name='Target', x=time_data['Scenario'], y=time_data['Target (min)'], marker_color='#cbd5e0')
        ])
        
        fig3.update_layout(
            title="Time vs Target",
            barmode='group',
            height=300
        )
        
        st.plotly_chart(fig3, use_container_width=True)
    
    # Strengths and areas for improvement
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### 💪 Strengths")
        st.success("✅ Excellent assessment skills (95%)")
        st.success("✅ Strong medication knowledge (92%)")
        st.success("✅ Good family communication (88%)")
    
    with col2:
        st.markdown("#### 📚 Areas for Improvement")
        st.warning("⚠️ Pain management protocols (85%)")
        st.info("💡 Complete end-of-life scenarios")
        st.info("💡 Practice delirium management")

with tab4:
    st.markdown("### 🏆 Achievements & Badges")
    
    # Achievement progress
    st.markdown("#### 🎯 Current Progress")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Total Points", "1,250", "+100")
    with col2:
        st.metric("Badges Earned", "8", "+1")
    with col3:
        st.metric("Rank", "Advanced Practitioner", "↗️")
    
    # Badges earned
    st.markdown("#### 🏅 Badges Earned")
    
    badges = [
        {"name": "First Steps", "description": "Complete first scenario", "earned": True, "icon": "🎯"},
        {"name": "Pain Expert", "description": "Score 90+ on pain management", "earned": False, "icon": "💊"},
        {"name": "Quick Learner", "description": "Complete scenario under target time", "earned": True, "icon": "⚡"},
        {"name": "Perfect Score", "description": "Achieve 100% on any scenario", "earned": False, "icon": "💯"},
        {"name": "Dedicated", "description": "Complete 10 scenarios", "earned": False, "icon": "📚"},
        {"name": "Assessment Pro", "description": "Master all assessment scenarios", "earned": True, "icon": "🔍"},
        {"name": "Team Player", "description": "Complete family support scenarios", "earned": True, "icon": "👥"},
        {"name": "Medication Master", "description": "Score 90+ on medication scenarios", "earned": True, "icon": "💉"}
    ]
    
    col1, col2, col3, col4 = st.columns(4)
    cols = [col1, col2, col3, col4]
    
    for i, badge in enumerate(badges):
        with cols[i % 4]:
            if badge["earned"]:
                st.markdown(f"""
                <div style='background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); 
                            padding: 1rem; border-radius: 12px; text-align: center; margin-bottom: 1rem;'>
                    <div style='font-size: 3rem;'>{badge['icon']}</div>
                    <div style='color: white; font-weight: bold;'>{badge['name']}</div>
                    <div style='color: white; font-size: 0.8rem; opacity: 0.9;'>{badge['description']}</div>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div style='background: #e2e8f0; padding: 1rem; border-radius: 12px; 
                            text-align: center; margin-bottom: 1rem; opacity: 0.6;'>
                    <div style='font-size: 3rem; filter: grayscale(100%);'>{badge['icon']}</div>
                    <div style='color: #4a5568; font-weight: bold;'>{badge['name']}</div>
                    <div style='color: #718096; font-size: 0.8rem;'>{badge['description']}</div>
                    <div style='color: #e53e3e; font-size: 0.75rem; margin-top: 0.5rem;'>🔒 Locked</div>
                </div>
                """, unsafe_allow_html=True)
    
    # Leaderboard
    st.markdown("#### 🏆 Leaderboard (This Month)")
    
    leaderboard = pd.DataFrame({
        'Rank': [1, 2, 3, 4, 5],
        'Name': ['Dr. Sarah Chen', 'Nurse Mike Johnson', 'You', 'Dr. Emily Brown', 'Nurse Tom Wilson'],
        'Score': [2450, 2180, 1250, 1120, 980],
        'Scenarios': [15, 13, 5, 7, 6],
        'Avg Score': ['94%', '91%', '88%', '85%', '82%']
    })
    
    st.dataframe(leaderboard, use_container_width=True, hide_index=True)
    
    # Upcoming challenges
    st.markdown("#### 🎯 Upcoming Challenges")
    
    challenges = [
        {"name": "Weekend Warrior", "description": "Complete 3 scenarios this weekend", "reward": "200 points", "deadline": "2 days"},
        {"name": "Expert Path", "description": "Complete all Expert level scenarios", "reward": "500 points + Badge", "deadline": "7 days"},
        {"name": "Speed Run", "description": "Complete any scenario in under 50% target time", "reward": "150 points", "deadline": "14 days"}
    ]
    
    for challenge in challenges:
        with st.container():
            col1, col2, col3 = st.columns([3, 1, 1])
            with col1:
                st.markdown(f"**{challenge['name']}**")
                st.caption(challenge['description'])
            with col2:
                st.write(f"🎁 {challenge['reward']}")
            with col3:
                st.write(f"⏰ {challenge['deadline']}")
            st.markdown("---")

