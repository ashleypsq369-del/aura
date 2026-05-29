"""Role-Based Access Control (RBAC) Module"""

# Define role-based page access
ROLE_PERMISSIONS = {
    'admin': {
        'pages': [
            '2_Dashboard',
            '3_Log_Data',
            '4_View_Trends',
            '5_AI_Insights',
            '6_Alerts',
            '7_Support_Hub',
            '8_Bereavement_Bridge',
            '9_Patient_Onboarding',
            '10_Clinical_Simulation',
            '11_Medication_Management',
            '12_Appointment_Scheduling',
            '13_Caregiver_Portal',
            '14_Memory_Vault',
            '15_Journal',
            '16_Care_Plan',
            '17_Functional_Status'
        ],
        'display_name': 'Administrator',
        'icon': '👑'
    },
    'clinician': {
        'pages': [
            '2_Dashboard',
            '3_Log_Data',
            '4_View_Trends',
            '5_AI_Insights',
            '6_Alerts',
            '7_Support_Hub',
            '9_Patient_Onboarding',
            '10_Clinical_Simulation',
            '11_Medication_Management',
            '12_Appointment_Scheduling',
            '16_Care_Plan',
            '17_Functional_Status'
        ],
        'display_name': 'Clinician',
        'icon': '👨‍⚕️'
    },
    'caregiver': {
        'pages': [
            '2_Dashboard',
            '4_View_Trends',
            '7_Support_Hub',
            '8_Bereavement_Bridge',
            '12_Appointment_Scheduling',
            '13_Caregiver_Portal',
            '14_Memory_Vault',
            '15_Journal'
        ],
        'display_name': 'Caregiver',
        'icon': '👥'
    },
    'family': {
        'pages': [
            '2_Dashboard',
            '4_View_Trends',
            '7_Support_Hub',
            '8_Bereavement_Bridge',
            '12_Appointment_Scheduling',
            '13_Caregiver_Portal',
            '14_Memory_Vault',
            '15_Journal'
        ],
        'display_name': 'Family Member',
        'icon': '👨‍👩‍👧‍👦'
    },
    'patient': {
        'pages': [
            '2_Dashboard',
            '3_Log_Data',
            '4_View_Trends',
            '7_Support_Hub',
            '12_Appointment_Scheduling',
            '14_Memory_Vault',
            '15_Journal'
        ],
        'display_name': 'Patient',
        'icon': '🤗'
    }
}

# Page metadata for navigation
PAGE_METADATA = {
    '2_Dashboard': {'name': 'Dashboard', 'icon': '📊', 'category': 'Overview'},
    '3_Log_Data': {'name': 'Log Data', 'icon': '📝', 'category': 'Clinical'},
    '4_View_Trends': {'name': 'View Trends', 'icon': '📈', 'category': 'Analytics'},
    '5_AI_Insights': {'name': 'AI Insights', 'icon': '🤖', 'category': 'Analytics'},
    '6_Alerts': {'name': 'Alerts', 'icon': '🔔', 'category': 'Clinical'},
    '7_Support_Hub': {'name': 'Support Hub', 'icon': '💬', 'category': 'Support'},
    '8_Bereavement_Bridge': {'name': 'Bereavement', 'icon': '🕊️', 'category': 'Support'},
    '9_Patient_Onboarding': {'name': 'Onboarding', 'icon': '📋', 'category': 'Admin'},
    '10_Clinical_Simulation': {'name': 'Simulation', 'icon': '🎯', 'category': 'Training'},
    '11_Medication_Management': {'name': 'Medications', 'icon': '💊', 'category': 'Clinical'},
    '12_Appointment_Scheduling': {'name': 'Appointments', 'icon': '📅', 'category': 'Coordination'},
    '13_Caregiver_Portal': {'name': 'Caregiver Portal', 'icon': '👥', 'category': 'Support'},
    '14_Memory_Vault': {'name': 'Memory Vault', 'icon': '📸', 'category': 'Personal'},
    '15_Journal': {'name': 'Journal', 'icon': '📔', 'category': 'Personal'},
    '16_Care_Plan': {'name': 'Care Plan', 'icon': '📋', 'category': 'Clinical'},
    '17_Functional_Status': {'name': 'Functional Status', 'icon': '🏃', 'category': 'Clinical'}
}


def has_access(role, page_id):
    """Check if a role has access to a specific page"""
    if role not in ROLE_PERMISSIONS:
        return False
    return page_id in ROLE_PERMISSIONS[role]['pages']


def get_accessible_pages(role):
    """Get list of pages accessible to a role"""
    if role not in ROLE_PERMISSIONS:
        return []
    
    pages = ROLE_PERMISSIONS[role]['pages']
    return [
        {
            'id': page_id,
            'name': PAGE_METADATA[page_id]['name'],
            'icon': PAGE_METADATA[page_id]['icon'],
            'category': PAGE_METADATA[page_id]['category'],
            'path': f"pages/{page_id}.py"
        }
        for page_id in pages
        if page_id in PAGE_METADATA
    ]


def get_role_info(role):
    """Get role display information"""
    if role not in ROLE_PERMISSIONS:
        return {'display_name': 'Unknown', 'icon': '❓'}
    return {
        'display_name': ROLE_PERMISSIONS[role]['display_name'],
        'icon': ROLE_PERMISSIONS[role]['icon']
    }


def check_page_access(role, current_page):
    """
    Check if user has access to current page.
    Returns True if access granted, False otherwise.
    """
    # Extract page ID from path (e.g., "pages/2_Dashboard.py" -> "2_Dashboard")
    if '/' in current_page:
        page_id = current_page.split('/')[-1].replace('.py', '')
    else:
        page_id = current_page.replace('.py', '')
    
    # Login page is always accessible
    if page_id == '1_Login':
        return True
    
    return has_access(role, page_id)
