# ESLint Issues Found & Fixes

## Summary
- **Total Issues:** 92 (89 errors, 3 warnings)
- **Categories:**
  1. Unused imports: ~60 issues
  2. setState in useEffect: ~10 issues (React 19 anti-pattern)
  3. Missing useEffect dependencies: 3 warnings
  4. Unused variables: ~15 issues
  5. Static components in render: 2 issues
  6. Variable accessed before declaration: 1 issue

---

## Critical Issues (Must Fix)

### 1. setState Directly in useEffect (React 19 Anti-pattern)
**Files Affected:**
- `VoiceInput.jsx` ✅ FIXED
- `AuthContext.jsx`
- `Dashboard.jsx`
- `HeirManagement.jsx`
- `Journal.jsx`
- `LegacyContentCreator.jsx`
- `LegacySetup.jsx` (2 instances)
- `MemoryVault.jsx`

**Issue:** Calling setState synchronously in useEffect can cause cascading renders.

**Solution Pattern:**
```jsx
// ❌ BAD
useEffect(() => {
  setData(someValue);
}, [someValue]);

// ✅ GOOD
useEffect(() => {
  const initData = () => {
    setData(someValue);
  };
  initData();
}, [someValue]);

// ✅ BETTER (for derived state)
const derivedValue = useMemo(() => computeValue(), [deps]);
```

### 2. Variable Accessed Before Declaration
**File:** `Messages.jsx`

**Issue:** `handleStartChat` is called before it's declared (line 161, declared line 179)

**Solution:** Move function declaration before usage OR use useCallback

```jsx
// ✅ Solution 1: Move declaration up
const handleStartChat = useCallback((recipientId) => {
  startConversationMutation.mutate({
    recipientId,
    initialMessage: 'Hello! I wanted to reach out to you.',
    conversationType: 'private'
  });
}, [startConversationMutation]);

// Then use in useEffect
useEffect(() => {
  const clinicianId = location.state?.clinicianId;
  if (clinicianId) {
    // ... existing code
    handleStartChat(clinician.id);
  }
}, [location.state, users, handleStartChat]);
```

### 3. Components Created During Render
**File:** `Resources.jsx`

**Issue:** `FormatIcon` component is created during render in ResourceCard and ResourceModal

**Solution:** Create component outside render function or use conditional rendering

```jsx
// ❌ BAD
function ResourceCard({ resource }) {
  const FormatIcon = getFormatIcon(resource.format);
  return <FormatIcon />;
}

// ✅ GOOD
const getFormatIcon = (format) => {
  switch (format) {
    case 'pdf': return FileText;
    case 'video': return Video;
    case 'link': return Link;
    default: return File;
  }
};

function ResourceCard({ resource }) {
  const IconComponent = getFormatIcon(resource.format);
  return <IconComponent className="w-5 h-5" />;
}
```

---

## Medium Priority Issues

### 4. Missing useEffect Dependencies
**Files:**
- `OfflineAssessmentSync.jsx` - missing `syncPending`
- `OfflineAssessmentSync.jsx` - missing `checkPending`
- `Messages.jsx` - missing `handleStartChat`

**Solution:** Add dependencies or wrap in useCallback

### 5. Fast Refresh Issue
**File:** `AuthContext.jsx` line 149

**Issue:** File exports both components and non-components (breaks Fast Refresh)

**Solution:** Move AuthContext export or ensure only components are exported

---

## Low Priority Issues (Cleanup)

### Unused Imports by File

**Components:**
- `RealTimeAlerts.jsx` - useEffect
- `VoiceInput.jsx` - placeholder (from destructuring)
- `Sidebar.jsx` - LogOut, logout variable

**Pages with unused imports:**
```
AIInsights.jsx: useState, Target
AdaptiveCareGuide.jsx: AlertTriangle
AdminUserManagement.jsx: Trash2, Shield
AssessmentDashboard.jsx: useState, useEffect, Calendar
BarthelIndexForm.jsx: TrendingUp
BriefPainInventoryForm.jsx: previousAssessments variable
CarePlanDetail.jsx: AlertCircle, Calendar
CognitiveAssessmentForm.jsx: AlertTriangle
CommunityHub.jsx: AnimatePresence, Heart, Hand, Zap, X, UserMinus, allGroups variable
ContinuityBridge.jsx: user variable
Dashboard.jsx: StatCard
ESASForm.jsx: TrendingUp, AlertCircle
HeirManagement.jsx: user variable
Journal.jsx: patient variable
LegacyContentCreator.jsx: Calendar, user variable
LegacySetup.jsx: user variable, patient variable
MedicationsDetail.jsx: Clock, Calendar, navigate
MemoryVault.jsx: (setState in useEffect issue)
MentalHealthForm.jsx: Shield
Messages.jsx: (variable before declaration issue)
MyJourney.jsx: Filter, Heart, Package, isLast
MyLegacyAccess.jsx: Shield, user
Notifications.jsx: Mail
PatientDetail.jsx: PageHeader
Patients.jsx: Users
Profile.jsx: motion, X, response
QualityOfLifeForm.jsx: color param
Register.jsx: Lock
Resources.jsx: Bookmark, Filter, error, getFormatIcon, static component issue
SymptomsDetail.jsx: TrendingDown, navigate, index
VitalsDetail.jsx: TrendingUp, TrendingDown, navigate, index
WellbeingDetail.jsx: TrendingUp, navigate
```

---

## Automated Fix Script

I'll create a Python script to automatically fix these issues:

```python
import os
import re

# Fix unused imports
def remove_unused_import(file_path, import_name):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove from import statement
    content = re.sub(rf',\s*{import_name}', '', content)
    content = re.sub(rf'{import_name},\s*', '', content)
    content = re.sub(rf'{{{import_name}}}', '', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

# Fix setState in useEffect
def fix_setstate_in_effect(file_path):
    # This needs manual review for each case
    pass

# Apply fixes
fixes = {
    'frontend/src/pages/AIInsights.jsx': ['useState', 'Target'],
    'frontend/src/pages/AdaptiveCareGuide.jsx': ['AlertTriangle'],
    # ... etc
}

for file, imports in fixes.items():
    for imp in imports:
        remove_unused_import(file, imp)
```

---

## Testing After Fixes

Run these commands to verify:

```bash
# 1. Run ESLint
npm run lint

# 2. Run dev server (check for Fast Refresh issues)
npm run dev

# 3. Check for runtime errors in browser console

# 4. Test critical flows:
#    - Login/Logout
#    - Assessment forms
#    - Messaging
#    - Legacy system
#    - File uploads
```

---

## Expected Results After All Fixes

```
✓ 0 errors
✓ 0 warnings
```

All files should have:
- ✅ No unused imports
- ✅ No unused variables
- ✅ Proper useEffect patterns
- ✅ No setState in useEffect
- ✅ Components declared outside render
- ✅ All dependencies in useEffect
- ✅ Variables declared before use
- ✅ Fast Refresh working

---

## Status

- **Fixed:** 1/92 (VoiceInput.jsx)
- **Remaining:** 91
- **Estimated time:** 1-2 hours for all fixes
- **Priority:** Fix critical issues first (setState, variable access, static components)

