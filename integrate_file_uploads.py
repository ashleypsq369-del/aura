#!/usr/bin/env python3
"""
Integrate FormFileUpload component into all forms
"""

import os
import re
from pathlib import Path

FRONTEND_DIR = Path("frontend/src")

# Forms and their configurations
FORMS_TO_UPDATE = {
    # Assessment Forms
    "pages/ESASForm.jsx": {
        "category": "documents",
        "label": "Supporting Documentation",
        "description": "Attach medical reports, symptom photos, or charts",
        "accept": "image/*,video/*,.pdf,.doc,.docx"
    },
    "pages/PPSForm.jsx": {
        "category": "documents",
        "label": "Assessment Documentation",
        "description": "Attach assessment notes or supporting files",
        "accept": "image/*,.pdf,.doc,.docx"
    },
    "pages/PHQ9Form.jsx": {
        "category": "documents",
        "label": "Clinical Documentation",
        "description": "Attach clinical notes or related documents",
        "accept": ".pdf,.doc,.docx"
    },
    "pages/GAD7Form.jsx": {
        "category": "documents",
        "label": "Assessment Records",
        "description": "Attach assessment documentation or notes",
        "accept": ".pdf,.doc,.docx"
    },
    "pages/BarthelIndexForm.jsx": {
        "category": "documents",
        "label": "Supporting Evidence",
        "description": "Attach photos, videos, or documentation",
        "accept": "image/*,video/*,.pdf"
    },
    "pages/CognitiveAssessmentForm.jsx": {
        "category": "documents",
        "label": "Test Materials",
        "description": "Attach test results or supporting documentation",
        "accept": "image/*,.pdf"
    },
    "pages/BriefPainInventoryForm.jsx": {
        "category": "documents",
        "label": "Pain Documentation",
        "description": "Attach pain location images, charts, or reports",
        "accept": "image/*,video/*,.pdf"
    },
    "pages/QualityOfLifeForm.jsx": {
        "category": "documents",
        "label": "Supporting Materials",
        "description": "Attach supporting documentation",
        "accept": ".pdf,.doc,.docx"
    },
    "pages/CaregiverBurdenForm.jsx": {
        "category": "documents",
        "label": "Caregiver Documentation",
        "description": "Attach caregiver notes or related records",
        "accept": ".pdf,.doc,.docx,image/*"
    },
    "pages/MotorSkillsForm.jsx": {
        "category": "documents",
        "label": "Assessment Media",
        "description": "Attach photos or videos of motor skill assessments",
        "accept": "image/*,video/*,.pdf"
    },
    "pages/MentalHealthForm.jsx": {
        "category": "documents",
        "label": "Clinical Documentation",
        "description": "Attach clinical notes or assessment records",
        "accept": ".pdf,.doc,.docx"
    },
    # Patient Records
    "pages/PatientDetail.jsx": {
        "category": "documents",
        "label": "Medical Documents",
        "description": "Attach test results, reports, or medical records",
        "accept": "image/*,video/*,.pdf,.doc,.docx"
    },
    "pages/VitalsDetail.jsx": {
        "category": "documents",
        "label": "Vitals Documentation",
        "description": "Attach vital sign charts or related reports",
        "accept": "image/*,.pdf"
    },
    "pages/SymptomsDetail.jsx": {
        "category": "documents",
        "label": "Symptom Photos & Reports",
        "description": "Attach photos of symptoms or medical reports",
        "accept": "image/*,video/*,.pdf"
    },
    "pages/MedicationsDetail.jsx": {
        "category": "documents",
        "label": "Prescription Documents",
        "description": "Attach prescription images or medication schedules",
        "accept": "image/*,.pdf"
    },
    # Legacy & Memory
    "pages/LegacyContentCreator.jsx": {
        "category": "legacy",
        "label": "Media Message",
        "description": "Upload audio or video messages for your loved ones",
        "accept": "audio/*,video/*"
    },
    "pages/MemoryVault.jsx": {
        "category": "memories",
        "label": "Photos & Videos",
        "description": "Upload cherished photos and videos",
        "accept": "image/*,video/*"
    },
    "pages/Journal.jsx": {
        "category": "memories",
        "label": "Journal Attachments",
        "description": "Attach photos or documents to your journal entry",
        "accept": "image/*,video/*,.pdf"
    },
    # Communication
    "pages/CommunityHub.jsx": {
        "category": "community",
        "label": "Post Image",
        "description": "Add an image to your community post",
        "accept": "image/*"
    },
    "pages/Profile.jsx": {
        "category": "profiles",
        "label": "Profile Picture",
        "description": "Upload your profile picture",
        "accept": "image/*"
    },
}


def add_import_if_missing(content, import_line):
    """Add import if not already present"""
    if import_line.strip() in content:
        return content, False
    
    # Find last import line
    lines = content.split('\n')
    last_import_idx = -1
    for i, line in enumerate(lines):
        if line.strip().startswith('import '):
            last_import_idx = i
    
    if last_import_idx >= 0:
        lines.insert(last_import_idx + 1, import_line)
        return '\n'.join(lines), True
    
    return content, False


def add_file_upload_to_form(file_path, config):
    """Add FormFileUpload component to a form"""
    full_path = FRONTEND_DIR / file_path
    
    if not full_path.exists():
        print(f"⚠️  {file_path} - Not found")
        return False
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already added
    if 'FormFileUpload' in content and '<FormFileUpload' in content:
        print(f"✓ {file_path} - Already has FormFileUpload")
        return True
    
    # Add import
    import_line = "import FormFileUpload from '../components/FormFileUpload';"
    content, imported = add_import_if_missing(content, import_line)
    
    # Build the FormFileUpload component
    file_upload_component = '''
          {/* File Attachments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-6"
          >
            <FormFileUpload
              category="''' + config['category'] + '''"
              label="''' + config['label'] + '''"
              description="''' + config['description'] + '''"
              accept="''' + config['accept'] + '''"
              multiple={true}
              maxSizeMB={50}
            />
          </motion.div>
'''
    
    # Find where to insert (before submit button)
    # Look for common patterns
    patterns = [
        (r'(<button[^>]*type=["\']submit["\'][^>]*>)', file_upload_component + r'\n          \1'),
        (r'(className="flex space-x-4"[^>]*>\s*<button[^>]*type=["\']submit)', file_upload_component + r'\1'),
        (r'(<div[^>]*className="[^"]*flex[^"]*space-x-4[^"]*"[^>]*>\s*<button)', file_upload_component + r'\1'),
    ]
    
    inserted = False
    for pattern, replacement in patterns:
        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)
            inserted = True
            break
    
    if not inserted:
        # Try finding just before last </form> or last button
        if '</form>' in content:
            content = content.replace('</form>', file_upload_component + '\n        </form>', 1)
            inserted = True
    
    if inserted or imported:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ {file_path} - Added FormFileUpload")
        return True
    else:
        print(f"⚠️  {file_path} - Could not find insertion point")
        return False


def main():
    """Add file uploads to all forms"""
    print("=" * 70)
    print("ADDING FILE UPLOAD TO ALL FORMS")
    print("=" * 70)
    print()
    
    os.chdir(Path(__file__).parent)
    
    success = 0
    failed = 0
    
    for file_path, config in FORMS_TO_UPDATE.items():
        if add_file_upload_to_form(file_path, config):
            success += 1
        else:
            failed += 1
    
    print()
    print("=" * 70)
    print(f"✓ Successfully updated: {success} files")
    print(f"⚠️  Failed/Skipped: {failed} files")
    print("=" * 70)
    print()
    print("File uploads added! Features included:")
    print("  ✓ Images (photos, screenshots)")
    print("  ✓ Videos (recordings, demonstrations)")
    print("  ✓ Audio (voice notes, messages)")
    print("  ✓ Documents (PDFs, Word docs)")
    print("  ✓ Drag & drop support")
    print("  ✓ Multiple file uploads")
    print("  ✓ Progress tracking")
    print()


if __name__ == "__main__":
    main()
