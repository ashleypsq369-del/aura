import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, MapPin, Heart, Phone } from 'lucide-react';
import { patientValidation } from '../utils/formValidation';
import { Field, FieldGroup, FieldSection, SelectField, TextareaField, ToggleField, StepWizard } from './ui/ModalContent';

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 'Northern',
  'Volta', 'Upper East', 'Upper West', 'Bono', 'Bono East', 'Ahafo',
  'Western North', 'Oti', 'Savannah', 'North East',
];

const STEPS = [
  { id: 'identity', title: 'Patient Identity', icon: User },
  { id: 'location', title: 'Location & Facility', icon: MapPin },
  { id: 'clinical', title: 'Clinical Profile', icon: Heart },
  { id: 'contacts', title: 'Emergency Contacts', icon: Phone },
];

const defaultValues = {
  patient_code: '',
  full_name: '',
  date_of_birth: '',
  gender: 'male',
  ghana_card_number: '',
  nhis_number: '',
  phone: '',
  address: '',
  region: 'Greater Accra',
  district: '',
  facility_name: '',
  primary_diagnosis: '',
  secondary_diagnoses: '',
  admission_date: '',
  preferred_language: 'en',
  religious_preference: '',
  advance_directive: false,
  dnr_status: false,
  care_pathway: 'standard',
  emergency_contact_name: '',
  emergency_contact_relationship: '',
  emergency_contact_phone: '',
};

export default function PatientIntakeForm({ onSubmit, onCancel, isSubmitting }) {
  const [step, setStep] = useState(0);
  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ mode: 'onChange', defaultValues });

  const fieldsByStep = {
    0: ['patient_code', 'full_name', 'date_of_birth', 'gender', 'ghana_card_number', 'nhis_number', 'phone'],
    1: ['region', 'district', 'facility_name', 'address'],
    2: ['primary_diagnosis', 'secondary_diagnoses', 'admission_date', 'preferred_language', 'religious_preference', 'care_pathway'],
    3: ['emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone'],
  };

  const nextStep = async () => {
    const valid = await trigger(fieldsByStep[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  // Helper: register + error binding for Field component
  const rf = (name, rules) => ({
    error: errors[name]?.message,
    ...register(name, rules),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* Step progress */}
      <StepWizard steps={STEPS} current={step} />

      {/* ── Step 0: Patient Identity ── */}
      {step === 0 && (
        <FieldSection title="Basic Information" icon={User} accent="teal">
          <Field label="Patient Code" name="patient_code" required placeholder="PAT001" {...rf('patient_code', patientValidation.patient_code)} />
          <Field label="Full Name" name="full_name" required {...rf('full_name', patientValidation.full_name)} />
          <FieldGroup>
            <Field label="Date of Birth" name="date_of_birth" type="date" required {...rf('date_of_birth', patientValidation.date_of_birth)} />
            <SelectField label="Gender" name="gender" required
              options={[{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other'}]}
              {...rf('gender', patientValidation.gender)} />
          </FieldGroup>
          <FieldGroup>
            <Field label="Ghana Card" name="ghana_card_number" placeholder="GHA-123456789-0" {...rf('ghana_card_number')} />
            <Field label="NHIS Number" name="nhis_number" placeholder="8 digits" {...rf('nhis_number')} />
          </FieldGroup>
          <Field label="Phone" name="phone" type="tel" placeholder="+233..." {...rf('phone')} />
        </FieldSection>
      )}

      {/* ── Step 1: Location & Facility ── */}
      {step === 1 && (
        <FieldSection title="Location & Facility" icon={MapPin} accent="blue">
          <FieldGroup>
            <SelectField label="Region" name="region" required
              options={GHANA_REGIONS}
              {...rf('region', { required: 'Region is required' })} />
            <Field label="District" name="district" required {...rf('district', { required: 'District is required' })} />
          </FieldGroup>
          <Field label="Facility Name" name="facility_name" required {...rf('facility_name', { required: 'Facility is required' })} />
          <TextareaField label="Home Address" name="address" rows={2} {...rf('address')} />
        </FieldSection>
      )}

      {/* ── Step 2: Clinical Profile ── */}
      {step === 2 && (
        <FieldSection title="Clinical Profile" icon={Heart} accent="red">
          <Field label="Primary Diagnosis" name="primary_diagnosis" required {...rf('primary_diagnosis', patientValidation.primary_diagnosis)} />
          <Field label="Secondary Diagnoses" name="secondary_diagnoses" helperText="Comma-separated if multiple" {...rf('secondary_diagnoses')} />
          <FieldGroup>
            <Field label="Admission Date" name="admission_date" type="date" {...rf('admission_date')} />
            <SelectField label="Care Pathway" name="care_pathway"
              options={[{value:'standard',label:'Standard Palliative'},{value:'oncology',label:'Oncology'},{value:'dementia',label:'Dementia'},{value:'pediatric',label:'Pediatric'}]}
              {...rf('care_pathway')} />
          </FieldGroup>
          <FieldGroup>
            <SelectField label="Preferred Language" name="preferred_language"
              options={[{value:'en',label:'English'},{value:'twi',label:'Twi'},{value:'ga',label:'Ga'},{value:'ewe',label:'Ewe'}]}
              {...rf('preferred_language')} />
            <Field label="Religious Preference" name="religious_preference" placeholder="e.g. Christian" {...rf('religious_preference')} />
          </FieldGroup>
          <div className="space-y-2 pt-1">
            <ToggleField label="Advance directive on file" name="advance_directive"
              checked={!!watch('advance_directive')}
              onChange={(e) => setValue('advance_directive', e.target.checked)} />
            <ToggleField label="DNR (Do Not Resuscitate) status" name="dnr_status"
              checked={!!watch('dnr_status')}
              onChange={(e) => setValue('dnr_status', e.target.checked)} />
          </div>
        </FieldSection>
      )}

      {/* ── Step 3: Emergency Contact ── */}
      {step === 3 && (
        <FieldSection title="Emergency Contact" icon={Phone} accent="amber">
          <Field label="Contact Name" name="emergency_contact_name" required {...rf('emergency_contact_name', { required: 'Required' })} />
          <Field label="Relationship" name="emergency_contact_relationship" required placeholder="Spouse, Son, Daughter..."
            {...rf('emergency_contact_relationship', { required: 'Required' })} />
          <Field label="Contact Phone" name="emergency_contact_phone" type="tel" required
            {...rf('emergency_contact_phone', { required: 'Required' })} />
        </FieldSection>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-2 border-t border-slate-100">
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)}
            className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1">
            ← Back
          </button>
        )}
        <div className="flex-1" />
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={nextStep}
            className="px-6 py-2.5 bg-teal-700 text-white rounded-xl text-sm font-bold hover:bg-teal-800 transition-colors flex items-center gap-1 shadow-sm">
            Next →
          </button>
        ) : (
          <button type="submit" disabled={isSubmitting}
            className="px-6 py-2.5 bg-teal-700 text-white rounded-xl text-sm font-bold hover:bg-teal-800 disabled:opacity-50 transition-colors shadow-sm">
            {isSubmitting ? 'Creating…' : 'Create Patient'}
          </button>
        )}
      </div>
    </form>
  );
}
