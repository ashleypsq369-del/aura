/**
 * Form Validation Utilities
 * 
 * Common validation rules for react-hook-form
 * Usage: import { patientValidation, medicationValidation } from './utils/formValidation'
 */

/**
 * Patient Form Validation Rules
 */
export const patientValidation = {
  patient_code: {
    required: 'Patient code is required',
    minLength: {
      value: 3,
      message: 'Patient code must be at least 3 characters',
    },
    maxLength: {
      value: 20,
      message: 'Patient code must not exceed 20 characters',
    },
    pattern: {
      value: /^[A-Za-z0-9-_]+$/,
      message: 'Patient code can only contain letters, numbers, hyphens, and underscores',
    },
  },
  full_name: {
    required: 'Full name is required',
    minLength: {
      value: 2,
      message: 'Name must be at least 2 characters',
    },
    maxLength: {
      value: 100,
      message: 'Name must not exceed 100 characters',
    },
    pattern: {
      value: /^[a-zA-Z\s'-]+$/,
      message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
    },
  },
  date_of_birth: {
    required: 'Date of birth is required',
    validate: {
      notFuture: (value) => {
        const selectedDate = new Date(value);
        const today = new Date();
        return selectedDate <= today || 'Date of birth cannot be in the future';
      },
      notTooOld: (value) => {
        const selectedDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - selectedDate.getFullYear();
        return age <= 120 || 'Please enter a valid date of birth';
      },
    },
  },
  gender: {
    required: 'Gender is required',
  },
  primary_diagnosis: {
    required: 'Primary diagnosis is required',
    minLength: {
      value: 3,
      message: 'Diagnosis must be at least 3 characters',
    },
    maxLength: {
      value: 200,
      message: 'Diagnosis must not exceed 200 characters',
    },
  },
  admission_date: {
    validate: {
      notFuture: (value) => {
        if (!value) return true; // Optional field
        const selectedDate = new Date(value);
        const today = new Date();
        return selectedDate <= today || 'Admission date cannot be in the future';
      },
    },
  },
};

/**
 * Medication Form Validation Rules
 */
export const medicationValidation = {
  medication_name: {
    required: 'Medication name is required',
  },
  dosage: {
    required: 'Dosage is required',
    pattern: {
      value: /^[\d.]+\s*(mg|g|ml|mcg|units?)$/i,
      message: 'Dosage must include amount and unit (e.g., 10mg, 5ml)',
    },
  },
  frequency: {
    required: 'Frequency is required',
    minLength: {
      value: 3,
      message: 'Frequency must be at least 3 characters',
    },
  },
  route: {
    required: 'Route is required',
  },
};

/**
 * Appointment Form Validation Rules
 */
export const appointmentValidation = {
  appointment_type: {
    required: 'Appointment type is required',
  },
  appointment_date: {
    required: 'Appointment date is required',
    validate: {
      notPast: (value) => {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to compare dates only
        return selectedDate >= today || 'Appointment date cannot be in the past';
      },
    },
  },
  location: {
    required: 'Location is required',
  },
};

/**
 * Vitals Form Validation Rules
 */
export const vitalsValidation = {
  heart_rate: {
    required: 'Heart rate is required',
    min: {
      value: 30,
      message: 'Heart rate must be at least 30 bpm',
    },
    max: {
      value: 250,
      message: 'Heart rate must not exceed 250 bpm',
    },
    pattern: {
      value: /^\d+$/,
      message: 'Heart rate must be a whole number',
    },
  },
  blood_pressure_systolic: {
    required: 'Systolic BP is required',
    min: {
      value: 60,
      message: 'Systolic BP must be at least 60 mmHg',
    },
    max: {
      value: 250,
      message: 'Systolic BP must not exceed 250 mmHg',
    },
  },
  blood_pressure_diastolic: {
    required: 'Diastolic BP is required',
    min: {
      value: 40,
      message: 'Diastolic BP must be at least 40 mmHg',
    },
    max: {
      value: 150,
      message: 'Diastolic BP must not exceed 150 mmHg',
    },
  },
  oxygen_saturation: {
    required: 'Oxygen saturation is required',
    min: {
      value: 70,
      message: 'O2 saturation must be at least 70%',
    },
    max: {
      value: 100,
      message: 'O2 saturation cannot exceed 100%',
    },
  },
  temperature: {
    required: 'Temperature is required',
    min: {
      value: 35,
      message: 'Temperature must be at least 35°C',
    },
    max: {
      value: 42,
      message: 'Temperature must not exceed 42°C',
    },
    validate: {
      validDecimal: (value) => {
        const num = parseFloat(value);
        return (num * 10) % 1 === 0 || 'Temperature can have at most 1 decimal place';
      },
    },
  },
};

/**
 * Login Form Validation Rules
 */
export const loginValidation = {
  username: {
    required: 'Username is required',
    minLength: {
      value: 3,
      message: 'Username must be at least 3 characters',
    },
  },
  password: {
    required: 'Password is required',
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters',
    },
  },
};

/**
 * Registration Form Validation Rules
 */
export const registrationValidation = {
  username: {
    required: 'Username is required',
    minLength: {
      value: 3,
      message: 'Username must be at least 3 characters',
    },
    maxLength: {
      value: 30,
      message: 'Username must not exceed 30 characters',
    },
    pattern: {
      value: /^[a-zA-Z0-9_-]+$/,
      message: 'Username can only contain letters, numbers, hyphens, and underscores',
    },
  },
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address',
    },
  },
  password: {
    required: 'Password is required',
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters',
    },
    validate: {
      hasUpperCase: (value) => /[A-Z]/.test(value) || 'Password must contain at least one uppercase letter',
      hasLowerCase: (value) => /[a-z]/.test(value) || 'Password must contain at least one lowercase letter',
      hasNumber: (value) => /[0-9]/.test(value) || 'Password must contain at least one number',
    },
  },
  confirmPassword: {
    required: 'Please confirm your password',
    validate: {
      matches: (value, formValues) => value === formValues.password || 'Passwords do not match',
    },
  },
  full_name: {
    required: 'Full name is required',
    minLength: {
      value: 2,
      message: 'Name must be at least 2 characters',
    },
  },
};

/**
 * Generic Email Validation
 */
export const emailValidation = {
  required: 'Email is required',
  pattern: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: 'Invalid email address',
  },
};

/**
 * Generic Phone Validation (Ghana format)
 */
export const phoneValidation = {
  pattern: {
    value: /^(\+233|0)[2-9]\d{8}$/,
    message: 'Invalid phone number. Format: 0XXXXXXXXX or +233XXXXXXXXX',
  },
};

/**
 * Helper function to get error message for a field
 * Usage: {errors.field_name && <span>{getErrorMessage(errors.field_name)}</span>}
 */
export const getErrorMessage = (error) => {
  return error?.message || 'This field is invalid';
};

/**
 * Error display component classNames
 */
export const errorClasses = {
  input: 'border-crisis focus:ring-crisis focus:border-crisis',
  text: 'text-crisis text-sm mt-1',
  icon: 'text-crisis',
};
