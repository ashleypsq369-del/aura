/**
 * schemas.js - Zod validation schemas for clinical forms
 * ======================================================
 * Client-side schema validation that rejects bad data
 * BEFORE it reaches the backend servers.
 *
 * Pairs with React Hook Form via zodResolver:
 *   import { zodResolver } from '@hookform/resolvers/zod';
 *   const { register } = useForm({ resolver: zodResolver(appointmentSchema) });
 */

import { z } from 'zod';

// -- Appointment ------------------------------------------------------------
export const appointmentSchema = z.object({
  appointment_type: z.string().min(1, 'Please select an appointment type'),
  appointment_date: z.string().min(1, 'Please select a date and time'),
  location:         z.string().min(1, 'Please select a location'),
  notes:            z.string().max(500, 'Notes must be under 500 characters').optional(),
});

// -- Medication -------------------------------------------------------------
export const medicationSchema = z.object({
  name:      z.string().min(1, 'Please select a medication'),
  dose:      z.string().min(1, 'Dose is required').max(50, 'Dose too long'),
  frequency: z.string().min(1, 'Frequency is required').max(100, 'Frequency too long'),
  route:     z.enum(['Oral', 'Injectable', 'Topical', 'Sublingual'], {
    errorMap: () => ({ message: 'Please select a route' }),
  }),
  notes:     z.string().max(300, 'Notes must be under 300 characters').optional(),
});

// -- Symptom log ------------------------------------------------------------
export const symptomSchema = z.object({
  pain_level: z.number().int().min(0).max(10),
  nausea:     z.boolean().default(false),
  fatigue:    z.boolean().default(false),
  anxiety:    z.boolean().default(false),
  notes:      z.string().max(500).optional(),
});

// -- Vital signs ------------------------------------------------------------
export const vitalSchema = z.object({
  heart_rate:              z.number().int().min(20, 'HR too low').max(300, 'HR too high').optional().or(z.literal('')),
  blood_pressure_systolic: z.number().int().min(50).max(300).optional().or(z.literal('')),
  blood_pressure_diastolic:z.number().int().min(20).max(200).optional().or(z.literal('')),
  oxygen_saturation:       z.number().min(50).max(100, 'O2 sat cannot exceed 100%').optional().or(z.literal('')),
  temperature:             z.number().min(30, 'Temperature too low').max(45, 'Temperature too high').optional().or(z.literal('')),
  notes:                   z.string().max(300).optional(),
});

// -- Patient registration ---------------------------------------------------
export const patientSchema = z.object({
  full_name:         z.string().min(2, 'Full name required').max(100),
  date_of_birth:     z.string().min(1, 'Date of birth required'),
  gender:            z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  primary_diagnosis: z.string().min(2, 'Diagnosis required').max(200),
  phone:             z.string().regex(/^[+\d\s()-]{7,20}$/, 'Invalid phone number').optional().or(z.literal('')),
  region:            z.string().optional(),
});

// -- Message/chat -----------------------------------------------------------
export const messageSchema = z.object({
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long')
    // HIPAA: warn if message looks like it contains dosage info
    .refine(
      (v) => !/\b\d+\s*mg\b/i.test(v),
      { message: 'For security, avoid including dosage details in messages. Use the Medications section instead.' }
    ),
});

// -- User registration ------------------------------------------------------
export const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name required').max(100),
  username:  z.string().min(3, 'Username must be at least 3 characters').max(50)
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers and underscores'),
  email:     z.string().email('Invalid email address'),
  password:  z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  phone:     z.string().optional(),
  role:      z.enum(['patient', 'family']),
});
