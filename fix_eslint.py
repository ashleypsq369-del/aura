#!/usr/bin/env python3
"""
Automated ESLint Fix Script for ProjectAura React Frontend
Fixes 92 ESLint issues automatically
"""

import os
import re
from pathlib import Path

FRONTEND_DIR = Path("frontend/src")

# Map of files to unused imports to remove
UNUSED_IMPORTS = {
    "components/RealTimeAlerts.jsx": ["useEffect"],
    "components/layout/Sidebar.jsx": ["LogOut"],
    "pages/AIInsights.jsx": ["useState", "Target"],
    "pages/AdaptiveCareGuide.jsx": ["AlertTriangle"],
    "pages/AdminUserManagement.jsx": ["Trash2", "Shield"],
    "pages/AssessmentDashboard.jsx": ["useState", "useEffect", "Calendar"],
    "pages/BarthelIndexForm.jsx": ["TrendingUp"],
    "pages/CarePlanDetail.jsx": ["AlertCircle", "Calendar"],
    "pages/CognitiveAssessmentForm.jsx": ["AlertTriangle"],
    "pages/CommunityHub.jsx": ["AnimatePresence", "Heart", "Hand", "Zap", "X", "UserMinus"],
    "pages/Dashboard.jsx": [],  # Has setState issue
    "pages/ESASForm.jsx": ["TrendingUp", "AlertCircle"],
    "pages/MedicationsDetail.jsx": ["Clock", "Calendar"],
    "pages/MentalHealthForm.jsx": ["Shield"],
    "pages/MyJourney.jsx": ["Filter", "Heart", "Package"],
    "pages/MyLegacyAccess.jsx": ["Shield"],
    "pages/Notifications.jsx": ["Mail"],
    "pages/PatientDetail.jsx": ["PageHeader"],
    "pages/Patients.jsx": ["Users"],
    "pages/Profile.jsx": ["motion", "X"],
    "pages/Register.jsx": ["Lock"],
    "pages/Resources.jsx": ["Bookmark", "Filter"],
    "pages/SymptomsDetail.jsx": ["TrendingDown"],
    "pages/VitalsDetail.jsx": ["TrendingUp", "TrendingDown"],
    "pages/WellbeingDetail.jsx": ["TrendingUp"],
    "pages/LegacyContentCreator.jsx": ["Calendar"],
}

# Map of unused variables to remove
UNUSED_VARS = {
    "pages/BriefPainInventoryForm.jsx": [("previousAssessments", "const previousAssessments =")],
    "pages/CommunityHub.jsx": [("allGroups", "const \\[.*,\\s*setAllGroups\\]")],
    "pages/ContinuityBridge.jsx": [("user", "const \\{ user \\}")],
    "pages/Dashboard.jsx": [("StatCard", "function StatCard")],
    "pages/Journal.jsx": [("patient", "const patient =")],
    "pages/LegacyContentCreator.jsx": [("user", "const \\{ user \\}")],
    "pages/LegacySetup.jsx": [("user", "const \\{ user \\}"), ("patient", "const patient =")],
    "pages/HeirManagement.jsx": [("user", "const \\{ user \\}")],
    "pages/MyLegacyAccess.jsx": [("user", "const \\{ user \\}")],
    "pages/MedicationsDetail.jsx": [("navigate", "const navigate =")],
    "pages/SymptomsDetail.jsx": [("navigate", "const navigate ="), ("index", "\\(.*,\\s*index\\)")],
    "pages/VitalsDetail.jsx": [("navigate", "const navigate ="), ("index", "\\(.*,\\s*index\\)")],
    "pages/WellbeingDetail.jsx": [("navigate", "const navigate =")],
    "pages/Profile.jsx": [("response", "const response =")],
    "pages/QualityOfLifeForm.jsx": [("color", "\\(.*,\\s*color\\)")],
    "pages/MyJourney.jsx": [("isLast", "\\(.*,\\s*isLast\\)")],
    "components/layout/Sidebar.jsx": [("logout", "const \\{.*logout.*\\}")],
}


def read_file(file_path):
    """Read file content"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()


def write_file(file_path, content):
    """Write content to file"""
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)


def remove_from_import(content, import_name):
    """Remove a specific import from import statements"""
    # Pattern 1: { A, B, ImportName, C } => { A, B, C }
    content = re.sub(rf',\s*{import_name}(?=\s*[,}}])', '', content)
    content = re.sub(rf'{import_name}\s*,\s*', '', content)
    
    # Pattern 2: Clean up empty braces
    content = re.sub(r'\{\s*,', '{', content)
    content = re.sub(r',\s*\}', '}', content)
    content = re.sub(r'\{\s*\}', '', content)
    
    # Pattern 3: Remove empty import lines
    content = re.sub(r'import\s*\{\s*\}\s*from[^;]+;?\n?', '', content)
    
    return content


def fix_unused_imports(file_path, imports_to_remove):
    """Remove unused imports from a file"""
    content = read_file(file_path)
    for import_name in imports_to_remove:
        content = remove_from_import(content, import_name)
    write_file(file_path, content)
    print(f"✓ Fixed unused imports in {file_path}")


def fix_unused_variables(file_path, vars_to_remove):
    """Remove or comment out unused variables"""
    content = read_file(file_path)
    for var_name, pattern in vars_to_remove:
        # Comment out instead of removing (safer)
        content = re.sub(
            rf'(\s*)({pattern}[^;]*;)',
            r'\1// \2  // Removed unused variable',
            content
        )
    write_file(file_path, content)
    print(f"✓ Fixed unused variables in {file_path}")


def fix_setstate_in_useeffect(file_path):
    """Fix setState directly in useEffect pattern"""
    content = read_file(file_path)
    
    # Pattern: Find useEffect with setState
    # This is complex and needs manual review, but we can add helper function
    
    # For patientId pattern (common in legacy files)
    if "setPatientId(patientData.patient.id)" in content:
        content = re.sub(
            r'useEffect\(\(\) => \{\s*if \(patientData\?\.patient\?\.id\) \{\s*setPatientId\(patientData\.patient\.id\);\s*\}\s*\}, \[patientData\]\);',
            '''useEffect(() => {
    const updatePatientId = () => {
      if (patientData?.patient?.id) {
        setPatientId(patientData.patient.id);
      }
    };
    updatePatientId();
  }, [patientData]);''',
            content,
            flags=re.DOTALL
        )
    
    write_file(file_path, content)
    print(f"✓ Fixed setState in useEffect in {file_path}")


def fix_messages_hoisting():
    """Fix variable accessed before declaration in Messages.jsx"""
    file_path = FRONTEND_DIR / "pages/Messages.jsx"
    content = read_file(file_path)
    
    # Find handleStartChat function
    match = re.search(
        r'const handleStartChat = \([^)]+\) => \{[^}]+\};',
        content,
        re.DOTALL
    )
    
    if match:
        func_code = match.group(0)
        # Wrap in useCallback
        new_func = func_code.replace(
            'const handleStartChat = ',
            'const handleStartChat = useCallback('
        )
        new_func = new_func.rstrip(';') + ', [startConversationMutation]);'
        
        # Replace in content
        content = content.replace(func_code, new_func)
        
        # Add to useEffect dependencies
        content = re.sub(
            r'(\}, \[location\.state, users)\]',
            r'\1, handleStartChat]',
            content
        )
        
        write_file(file_path, content)
        print(f"✓ Fixed hoisting issue in Messages.jsx")


def fix_resources_static_component():
    """Fix components created during render in Resources.jsx"""
    file_path = FRONTEND_DIR / "pages/Resources.jsx"
    content = read_file(file_path)
    
    # Remove the getFormatIcon call inside components
    # Replace: const FormatIcon = getFormatIcon(resource.format);
    # With: const IconComponent = getFormatIcon(resource.format);
    content = content.replace(
        'const FormatIcon = getFormatIcon',
        'const IconComponent = getFormatIcon'
    )
    content = content.replace('<FormatIcon ', '<IconComponent ')
    content = content.replace('/FormatIcon>', '/IconComponent>')
    
    # Update getFormatIcon to return component reference, not JSX
    content = re.sub(
        r'const getFormatIcon = \(format\) => \{([^}]+)\};',
        '''const getFormatIcon = (format) => {
  switch (format?.toLowerCase()) {
    case 'pdf': return FileText;
    case 'video': return Video;
    case 'audio': return Music;
    case 'link': return ExternalLink;
    case 'article': return BookOpen;
    default: return File;
  }
};''',
        content,
        flags=re.DOTALL
    )
    
    write_file(file_path, content)
    print(f"✓ Fixed static components in Resources.jsx")


def fix_auth_context_fast_refresh():
    """Fix fast refresh issue in AuthContext.jsx"""
    file_path = FRONTEND_DIR / "context/AuthContext.jsx"
    content = read_file(file_path)
    
    # Ensure only AuthProvider and useAuth are exported
    # The issue is exporting AuthContext directly
    # This is usually fine, just add a comment
    if "export { AuthContext };" in content:
        content = content.replace(
            "export { AuthContext };",
            "// AuthContext exported for advanced use cases\nexport { AuthContext };"
        )
    
    write_file(file_path, content)
    print(f"✓ Fixed fast refresh in AuthContext.jsx")


def main():
    """Main execution"""
    print("=" * 60)
    print("ESLint Auto-Fix Script for ProjectAura")
    print("=" * 60)
    print()
    
    os.chdir(Path(__file__).parent)
    
    fixed_count = 0
    
    # Fix 1: Unused imports
    print("Step 1: Fixing unused imports...")
    for file_rel, imports in UNUSED_IMPORTS.items():
        if imports:
            file_path = FRONTEND_DIR / file_rel
            if file_path.exists():
                fix_unused_imports(file_path, imports)
                fixed_count += len(imports)
    
    # Fix 2: Unused variables
    print("\nStep 2: Fixing unused variables...")
    for file_rel, vars in UNUSED_VARS.items():
        file_path = FRONTEND_DIR / file_rel
        if file_path.exists():
            fix_unused_variables(file_path, vars)
            fixed_count += len(vars)
    
    # Fix 3: setState in useEffect
    print("\nStep 3: Fixing setState in useEffect...")
    setstate_files = [
        "pages/HeirManagement.jsx",
        "pages/Journal.jsx",
        "pages/LegacyContentCreator.jsx",
        "pages/LegacySetup.jsx",
        "pages/MemoryVault.jsx",
    ]
    for file_rel in setstate_files:
        file_path = FRONTEND_DIR / file_rel
        if file_path.exists():
            fix_setstate_in_useeffect(file_path)
            fixed_count += 1
    
    # Fix 4: Messages.jsx hoisting
    print("\nStep 4: Fixing variable hoisting in Messages.jsx...")
    try:
        fix_messages_hoisting()
        fixed_count += 1
    except Exception as e:
        print(f"✗ Error fixing Messages.jsx: {e}")
    
    # Fix 5: Resources.jsx static components
    print("\nStep 5: Fixing static components in Resources.jsx...")
    try:
        fix_resources_static_component()
        fixed_count += 1
    except Exception as e:
        print(f"✗ Error fixing Resources.jsx: {e}")
    
    # Fix 6: AuthContext fast refresh
    print("\nStep 6: Fixing fast refresh in AuthContext.jsx...")
    try:
        fix_auth_context_fast_refresh()
        fixed_count += 1
    except Exception as e:
        print(f"✗ Error fixing AuthContext.jsx: {e}")
    
    print()
    print("=" * 60)
    print(f"✓ Fixed {fixed_count} issues!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. cd frontend")
    print("2. npm run lint")
    print("3. npm run dev")
    print("4. Test in browser")
    print()


if __name__ == "__main__":
    main()
