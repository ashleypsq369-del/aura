"""Memory Vault Module with Database Integration"""
import streamlit as st
from datetime import datetime
from src.db_helpers import create_memory, get_memories_by_patient, delete_memory

def render():
    """Render memory vault"""
    st.title("📸 Memory Vault")
    st.markdown("*Preserve precious memories and stories*")
    
    patient_id = st.session_state.get('current_patient_id', 1)
    
    tab1, tab2 = st.tabs(["Add Memory", "View Memories"])
    
    with tab1:
        st.subheader("Create New Memory")
        
        with st.form("add_memory"):
            title = st.text_input("Memory Title")
            description = st.text_area("Description", height=150)
            memory_date = st.date_input("Date of Memory")
            tags = st.text_input("Tags (comma-separated)")
            
            if st.form_submit_button("Save Memory"):
                if title and description:
                    memory_data = {
                        'patient_id': patient_id,
                        'title': title,
                        'description': description,
                        'memory_date': memory_date.isoformat(),
                        'tags': tags,
                        'created_at': datetime.now().isoformat()
                    }
                    create_memory(memory_data)
                    st.success("Memory saved!")
                    st.rerun()
    
    with tab2:
        st.subheader("Memory Collection")
        
        memories = get_memories_by_patient(patient_id)
        
        if memories:
            for memory in memories:
                with st.expander(f"📖 {memory['title']} - {memory['memory_date']}"):
                    st.write(memory['description'])
                    if memory.get('tags'):
                        st.caption(f"Tags: {memory['tags']}")
                    
                    if st.button(f"Delete", key=f"del_{memory['id']}"):
                        delete_memory(memory['id'])
                        st.success("Memory deleted")
                        st.rerun()
        else:
            st.info("No memories yet. Start preserving precious moments!")
