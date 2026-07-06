#!/usr/bin/env python3
"""
Add File Upload capability to all forms and pages in ProjectAura
"""

import os
from pathlib import Path

FRONTEND_DIR = Path("frontend/src")

# File upload configurations for each page
UPLOAD_CONFIGS = {
    # Assessment Forms
    "pages/ESASForm.jsx": {
        "category": "documents",
        "accept": "image/*,.pdf,.doc,.docx",
        "label": "Supporting Documentation",
        "description": "Attach medical reports, charts, or photos"
    },
    "pages/PPSForm.jsx": {
        "category": "documents",
        "accept": "image/*,.pdf",
        "label": "Assessment Notes",
        "description": "Attach assessment documentation"
    },
    "pages/PHQ9Form.jsx": {
        "category": "documents",
        "accept": ".pdf,.doc,.docx",
        "label": "Clinical Documentation",
        "description": "Attach clinical notes or records"
    },
    "pages/GAD7Form.jsx": {
        "category": "documents",
        "accept": ".pdf,.doc,.docx",
        "label": "Assessment Records",
        "description": "Attach assessment documentation"
    },
    "pages/BarthelIndexForm.jsx": {
        "category": "documents",
        "accept": "image/*,.pdf",
        "label": "Supporting Evidence",
        "description": "Attach photos or documentation"
    },
    "pages/CognitiveAssessmentForm.jsx": {
        "category": "documents",
        "accept": "image/*,.pdf",
        "label": "Test Materials",
        "description": "Attach test results or documentation"
    },
    "pages/BriefPainInventoryForm.jsx": {
        "category": "documents",
        "accept": "image/*,.pdf",
        "label": "Pain Charts & Images",
        "description": "Attach pain location images or charts"
    },
    "pages/QualityOfLifeForm.jsx": {
        "category": "documents",
        "accept": ".pdf,.doc,.docx",
        "label": "Supporting Materials",
        "description": "Attach supporting documentation"
    },
    "pages/CaregiverBurdenForm.jsx": {
        "category": "documents",
        "accept": ".pdf,.doc,.docx",
        "label": "Documentation",
        "description": "Attach caregiver notes or records"
    },
    "pages/MotorSkillsForm.jsx": {
        "category": "documents",
        "accept": "image/*,video/*,.pdf",
        "label": "Assessment Videos/Photos",
        "description": "Attach motor skill assessment media"
    },
    
    # Patient Records
    "pages/PatientDetail.jsx": {
        "category": "documents",
        "accept": "image/*,.pdf,.doc,.docx",
        "label": "Medical Documents",
        "description": "Attach test results, reports, or records"
    },
    "pages/VitalsDetail.jsx": {
        "category": "documents",
        "accept": "image/*,.pdf",
        "label": "Supporting Documents",
        "description": "Attach vital sign charts or reports"
    },
    "pages/SymptomsDetail.jsx": {
        "category": "documents",
        "accept": "image/*,.pdf",
        "label": "Symptom Photos & Reports",
        "description": "Attach photos of symptoms or medical reports"
    },
    "pages/MedicationsDetail.jsx": {
        "category": "documents",
        "accept": "image/*,.pdf",
        "label": "Prescription Images",
        "description": "Attach prescription images or medication schedules"
    },
    
    # Legacy & Memory
    "pages/LegacyContentCreator.jsx": {
        "category": "legacy",
        "accept": "audio/*,video/*",
        "label": "Audio/Video Message",
        "description": "Record or upload audio/video messages for heirs"
    },
    "pages/MemoryVault.jsx": {
        "category": "memories",
        "accept": "image/*,video/*",
        "label": "Photos & Videos",
        "description": "Upload photos and videos for memory vault"
    },
    "pages/Journal.jsx": {
        "category": "memories",
        "accept": "image/*,.pdf",
        "label": "Attached Memories",
        "description": "Attach photos or documents to journal entry"
    },
    
    # Community & Communication
    "pages/CommunityHub.jsx": {
        "category": "community",
        "accept": "image/*",
        "label": "Post Image",
        "description": "Attach an image to your post"
    },
    "pages/CarePlans.jsx": {
        "category": "documents",
        "accept": ".pdf,.doc,.docx",
        "label": "Care Plan Documents",
        "description": "Attach care instructions or medical orders"
    },
    "pages/Appointments.jsx": {
        "category": "documents",
        "accept": "image/*,.pdf,.doc,.docx",
        "label": "Appointment Documents",
        "description": "Attach appointment notes or prescriptions"
    },
    
    # Profile & Admin
    "pages/Profile.jsx": {
        "category": "profiles",
        "accept": "image/*",
        "label": "Profile Picture",
        "description": "Upload your profile picture",
        "max_size": 5
    },
}

def add_file_upload_to_page(file_path, config):
    """Add file upload capability to a page"""
    full_path = FRONTEND_DIR / file_path
    
    if not full_path.exists():
        print(f"⚠️  Skipping {file_path} - file not found")
        return False
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if FileUpload is already imported
    if 'import FileUpload' in content:
        print(f"✓ {file_path} - FileUpload already imported")
        return True
    
    # Add import for FileUpload and Paperclip if not present
    if "from 'lucide-react'" in content:
        # Find the lucide-react import and add Paperclip if needed
        if ', Paperclip' not in content:
            content = content.replace(
                "from 'lucide-react'",
                ", Paperclip } from 'lucide-react'"
            ).replace('} from', ', Paperclip } from', 1)
    
    # Add FileUpload import after other imports
    import_line = "import FileUpload from '../components/FileUpload';\n"
    
    # Find where to insert (after last import)
    lines = content.split('\n')
    last_import_idx = 0
    for i, line in enumerate(lines):
        if line.startswith('import '):
            last_import_idx = i
    
    lines.insert(last_import_idx + 1, import_line.rstrip())
    content = '\n'.join(lines)
    
    # Write back
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Added FileUpload import to {file_path}")
    return True

def main():
    """Add file uploads to all configured pages"""
    print("=" * 60)
    print("Adding File Upload Capability to All Forms")
    print("=" * 60)
    print()
    
    os.chdir(Path(__file__).parent)
    
    success_count = 0
    skip_count = 0
    
    for file_path, config in UPLOAD_CONFIGS.items():
        if add_file_upload_to_page(file_path, config):
            success_count += 1
        else:
            skip_count += 1
    
    print()
    print("=" * 60)
    print(f"✓ Added to {success_count} files")
    print(f"⚠ Skipped {skip_count} files")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Review the changes in each file")
    print("2. Add file upload UI sections manually to forms")
    print("3. Test file upload in each page")
    print()

if __name__ == "__main__":
    main()
