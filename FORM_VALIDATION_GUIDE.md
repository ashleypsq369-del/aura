# FORM VALIDATION GUIDE
## React Hook Form Implementation

**Date:** June 3, 2026  
**Status:** Validation utilities created, ready for implementation  
**Library:** react-hook-form v7+ ✅ Installed

---

## 🎯 OVERVIEW

This guide shows how to add inline form validation to Project Aura forms using react-hook-form.

**Benefits:**
- ✅ Real-time validation as user types
- ✅ Clear error messages
- ✅ Better UX (no surprises on submit)
- ✅ Reduced invalid submissions
- ✅ Consistent validation logic

---

## 📁 FILES CREATED

### 1. Validation Utilities ✅
**File:** `frontend/src/utils/formValidation.js`  
**Size:** 350+ lines  
**Contains:**
- `patientValidation` — Patient form rules
- `medicationValidation` — Medication form rules
- `appointmentValidation` — Appointment form rules
- `vitalsValidation` — Vitals form rules
- `loginValidation` — Login form rules
- `registrationValidation` — Registration form rules
- `emailValidation` — Generic email rules
- `phoneValidation` — Ghana phone format rules
- `getErrorMessage()` — Helper function
- `errorClasses` — Error styling classes

---

## 🚀 QUICK START

### Step 1: Install (Already Done) ✅
```bash
npm install react-hook-form
```

### Step 2: Import in Your Form
```jsx
import { useForm } from 'react-hook-form';
import { patientValidation } from '../utils/formValidation';
```

### Step 3: Initialize Hook
```jsx
const {
  register,
  handleSubmit,
  formState: { errors },
  reset,
} = useForm({
  mode: 'onChange', // Validate on change
  // OR mode: 'onBlur' for validate on blur
  // OR mode: 'onSubmit' for validate on submit only
});
```

### Step 4: Register Inputs
```jsx
<input
  {...register('full_name', patientValidation.full_name)}
  className={`input ${errors.full_name ? 'border-crisis' : 'border-gray-300'}`}
/>
{errors.full_name && (
  <span className="text-crisis text-sm">{errors.full_name.message}</span>
)}
```

### Step 5: Handle Submit
```jsx
const onSubmit = (data) => {
  console.log('Valid data:', data);
  // Call your API here
};

<form onSubmit={handleSubmit(onSubmit)}>
  {/* form fields */}
</form>
```

---

## 📋 COMPLETE EXAMPLE: Patient Form

Here's a complete example of how to add validation to the patient creation form:

```jsx
import { useForm } from 'react-hook-form';
import { patientValidation } from '../utils/formValidation';

export default function PatientForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    mode: 'onChange', // Validate as user types
    defaultValues: {
      patient_code: '',
      full_name: '',
      date_of_birth: '',
      gender: 'male',
      primary_diagnosis: '',
      admission_date: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      const response = await apiClient.post('/api/patients', data);
      toast.success('Patient added successfully!');
      reset(); // Clear form
    } catch (error) {
      toast.error('Failed to add patient');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      
      {/* Patient Code */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">
          Patient Code *
        </label>
        <input
          type="text"
          {...register('patient_code', patientValidation.patient_code)}
          placeholder="e.g., PAT001"
          className={`
            w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none
            ${errors.patient_code ? 'border-crisis focus:ring-crisis' : 'border-gray-200 focus:ring-forest'}
          `}
        />
        {errors.patient_code && (
          <p className="text-crisis text-sm mt-1">{errors.patient_code.message}</p>
        )}
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">
          Full Name *
        </label>
        <input
          type="text"
          {...register('full_name', patientValidation.full_name)}
          placeholder="e.g., John Mensah"
          className={`
            w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none
            ${errors.full_name ? 'border-crisis focus:ring-crisis' : 'border-gray-200 focus:ring-forest'}
          `}
        />
        {errors.full_name && (
          <p className="text-crisis text-sm mt-1">{errors.full_name.message}</p>
        )}
      </div>

      {/* Date of Birth */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">
          Date of Birth *
        </label>
        <input
          type="date"
          {...register('date_of_birth', patientValidation.date_of_birth)}
          className={`
            w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none
            ${errors.date_of_birth ? 'border-crisis focus:ring-crisis' : 'border-gray-200 focus:ring-forest'}
          `}
        />
        {errors.date_of_birth && (
          <p className="text-crisis text-sm mt-1">{errors.date_of_birth.message}</p>
        )}
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">
          Gender *
        </label>
        <select
          {...register('gender', patientValidation.gender)}
          className={`
            w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none
            ${errors.gender ? 'border-crisis focus:ring-crisis' : 'border-gray-200 focus:ring-forest'}
          `}
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        {errors.gender && (
          <p className="text-crisis text-sm mt-1">{errors.gender.message}</p>
        )}
      </div>

      {/* Primary Diagnosis */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">
          Primary Diagnosis *
        </label>
        <input
          type="text"
          {...register('primary_diagnosis', patientValidation.primary_diagnosis)}
          placeholder="e.g., Pancreatic Cancer Stage IV"
          className={`
            w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none
            ${errors.primary_diagnosis ? 'border-crisis focus:ring-crisis' : 'border-gray-200 focus:ring-forest'}
          `}
        />
        {errors.primary_diagnosis && (
          <p className="text-crisis text-sm mt-1">{errors.primary_diagnosis.message}</p>
        )}
      </div>

      {/* Admission Date (Optional) */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">
          Admission Date
        </label>
        <input
          type="date"
          {...register('admission_date', patientValidation.admission_date)}
          className={`
            w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none
            ${errors.admission_date ? 'border-crisis focus:ring-crisis' : 'border-gray-200 focus:ring-forest'}
          `}
        />
        {errors.admission_date && (
          <p className="text-crisis text-sm mt-1">{errors.admission_date.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={() => reset()}
          className="flex-1 px-4 py-2 border border-gray-200 text-charcoal rounded-lg hover:bg-warm-white transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-forest text-white rounded-lg hover:bg-forest-mid transition disabled:opacity-50"
        >
          {isSubmitting ? 'Adding...' : 'Add Patient'}
        </button>
      </div>
    </form>
  );
}
```

---

## 🎨 ERROR STYLING PATTERNS

### Pattern 1: Red Border + Message Below
```jsx
<input
  {...register('field', validation)}
  className={`
    w-full px-3 py-2 border rounded-lg
    ${errors.field ? 'border-crisis focus:ring-crisis' : 'border-gray-200 focus:ring-forest'}
  `}
/>
{errors.field && (
  <p className="text-crisis text-sm mt-1">{errors.field.message}</p>
)}
```

### Pattern 2: With Icon
```jsx
import { AlertCircle } from 'lucide-react';

<div className="relative">
  <input {...register('field', validation)} />
  {errors.field && (
    <AlertCircle className="absolute right-3 top-3 w-5 h-5 text-crisis" />
  )}
</div>
{errors.field && (
  <p className="text-crisis text-sm mt-1">{errors.field.message}</p>
)}
```

### Pattern 3: Error Summary at Top
```jsx
{Object.keys(errors).length > 0 && (
  <div className="bg-crisis/10 border border-crisis rounded-lg p-4 mb-4">
    <h4 className="font-semibold text-crisis mb-2">Please fix the following errors:</h4>
    <ul className="list-disc list-inside space-y-1 text-sm text-crisis">
      {Object.keys(errors).map((key) => (
        <li key={key}>{errors[key].message}</li>
      ))}
    </ul>
  </div>
)}
```

---

## 📚 VALIDATION RULES REFERENCE

### Patient Form Rules
```javascript
{
  patient_code: required, min 3, max 20, alphanumeric + dash/underscore
  full_name: required, min 2, max 100, letters + spaces/hyphens/apostrophes
  date_of_birth: required, not future, not > 120 years old
  gender: required
  primary_diagnosis: required, min 3, max 200
  admission_date: optional, not future if provided
}
```

### Medication Form Rules
```javascript
{
  medication_name: required
  dosage: required, must include unit (e.g., "10mg", "5ml")
  frequency: required, min 3 characters
  route: required
}
```

### Appointment Form Rules
```javascript
{
  appointment_type: required
  appointment_date: required, not in past
  location: required
}
```

### Vitals Form Rules
```javascript
{
  heart_rate: required, 30-250 bpm, whole number
  blood_pressure_systolic: required, 60-250 mmHg
  blood_pressure_diastolic: required, 40-150 mmHg
  oxygen_saturation: required, 70-100%
  temperature: required, 35-42°C, max 1 decimal place
}
```

---

## 🔧 ADVANCED FEATURES

### Custom Validation Functions
```jsx
const customValidation = {
  username: {
    required: 'Username is required',
    validate: async (value) => {
      // Check if username is taken
      const response = await apiClient.get(`/api/check-username/${value}`);
      return response.data.available || 'Username is already taken';
    },
  },
};
```

### Conditional Validation
```jsx
const { watch } = useForm();
const hasSymptoms = watch('has_symptoms');

<input
  {...register('symptoms_description', {
    required: hasSymptoms ? 'Please describe symptoms' : false,
  })}
/>
```

### Dynamic Validation
```jsx
const getDosageValidation = (route) => {
  if (route === 'injectable') {
    return {
      required: 'Dosage is required',
      pattern: {
        value: /^\d+\s*ml$/,
        message: 'Injectable dosage must be in ml',
      },
    };
  }
  return medicationValidation.dosage;
};
```

---

## 🧪 TESTING VALIDATION

### Manual Testing Checklist
For each form:
- [ ] Submit empty form → See all required field errors
- [ ] Enter invalid data → See format errors
- [ ] Enter partially valid data → See only remaining errors
- [ ] Fix all errors → Submit succeeds
- [ ] Check error messages are clear and helpful

### Example Test Cases

**Patient Form:**
```
✅ Valid: patient_code = "PAT001"
❌ Invalid: patient_code = "P" (too short)
❌ Invalid: patient_code = "PAT@001" (special chars)

✅ Valid: full_name = "John Mensah"
❌ Invalid: full_name = "J" (too short)
❌ Invalid: full_name = "John123" (numbers)

✅ Valid: date_of_birth = "1960-01-15"
❌ Invalid: date_of_birth = "2030-01-01" (future)
❌ Invalid: date_of_birth = "1800-01-01" (too old)
```

---

## 🎯 IMPLEMENTATION PRIORITY

### High Priority (Implement First)
1. ✅ **Validation utilities** — COMPLETE
2. ⏳ **Patient form** — Patients.jsx (add/edit modal)
3. ⏳ **Vitals form** — PatientMonitor.jsx (log vitals modal)
4. ⏳ **Medication form** — Medications.jsx (add/edit modal)

### Medium Priority
5. ⏳ **Appointment form** — Appointments.jsx
6. ⏳ **Symptoms form** — PatientMonitor.jsx (log symptoms)
7. ⏳ **Login form** — Login.jsx (optional, already works)

### Low Priority
8. ⏳ **Registration form** — If it exists
9. ⏳ **Profile forms** — Change password, update profile
10. ⏳ **Admin forms** — User management

---

## 📊 ESTIMATED TIME

| Task | Time | Difficulty |
|------|------|------------|
| Create validation utils | 30 min | ✅ DONE |
| Patient form | 20 min | Easy |
| Vitals form | 15 min | Easy |
| Medication form | 15 min | Easy |
| Appointment form | 15 min | Easy |
| Testing all forms | 30 min | Easy |
| **TOTAL** | **2 hours** | **Easy** |

---

## 🚀 QUICK WINS

### Minimal Implementation (30 minutes)
Just add validation to the 3 most important forms:
1. Patient creation form (15 min)
2. Vitals logging form (10 min)
3. Medication form (5 min)

This gives 80% of the benefit with 25% of the effort!

---

## 🐛 TROUBLESHOOTING

### Error: "register is not a function"
**Cause:** Forgot to destructure from useForm  
**Fix:** `const { register } = useForm();`

### Error: Validation not working
**Cause:** Not using handleSubmit wrapper  
**Fix:** `<form onSubmit={handleSubmit(onSubmit)}>`

### Error: Error messages not showing
**Cause:** Not checking errors object  
**Fix:** `{errors.fieldName && <span>{errors.fieldName.message}</span>}`

### Validation too strict
**Solution:** Adjust rules in formValidation.js

### Validation fires too early
**Solution:** Change mode to 'onBlur' instead of 'onChange'

---

## ✅ SUCCESS CRITERIA

When validation is properly implemented:
- ✅ Red border appears on invalid fields
- ✅ Clear error message shows below field
- ✅ Error disappears when field becomes valid
- ✅ Submit button works only when form is valid
- ✅ User gets immediate feedback (not on submit)

---

## 🎉 BENEFITS

### For Users
- ✅ Know exactly what's wrong before submitting
- ✅ Get helpful error messages, not technical jargon
- ✅ Save time (no failed submissions)
- ✅ Better experience overall

### For Developers
- ✅ Less invalid data reaching backend
- ✅ Consistent validation logic across forms
- ✅ Easy to add new forms with validation
- ✅ Reduced support tickets ("Why didn't it submit?")

### For System
- ✅ Reduced server load (fewer invalid requests)
- ✅ Better data quality in database
- ✅ Fewer errors in logs
- ✅ More reliable system overall

---

## 📚 RESOURCES

### Documentation
- **react-hook-form:** https://react-hook-form.com/
- **Validation examples:** https://react-hook-form.com/get-started#Applyvalidation

### Project Files
- **Validation utilities:** `frontend/src/utils/formValidation.js`
- **PasswordInput example:** `frontend/src/components/PasswordInput.jsx`
- **PasswordStrength example:** `frontend/src/components/PasswordStrength.jsx`

---

## 🎯 NEXT STEPS

1. **Read this guide** — Understand the patterns
2. **Pick a form** — Start with patient form (easiest)
3. **Add validation** — Follow the complete example
4. **Test it** — Try invalid data
5. **Repeat** — Add to other forms

**Estimated time to complete all key forms:** 2 hours

---

*Guide created: June 3, 2026*  
*Validation utilities: COMPLETE*  
*Implementation: READY TO START*  
*Expected impact: +3% overall completion*  
*🎯 Let's make forms bulletproof!*
