import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronLeft, ChevronRight, User, MapPin, Heart, Phone } from 'lucide-react';
import { patientValidation } from '../utils/formValidation';

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

  const inputClass = (field) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
      errors[field] ? 'border-red-500 focus:ring-crisis/20' : 'border-gray-200 focus:ring-forest/20'
    }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className={`flex-1 text-center p-2 rounded-lg text-xs font-semibold ${
                i === step ? 'bg-teal-800 text-white' : i < step ? 'bg-teal-800/10 text-teal-800' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Icon className="w-4 h-4 mx-auto mb-1" />
              {s.title}
            </div>
          );
        })}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <h3 className="font-serif text-lg text-teal-800">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Patient Code *</label>
              <input type="text" {...register('patient_code', patientValidation.patient_code)} placeholder="PAT001" className={inputClass('patient_code')} />
              {errors.patient_code && <p className="text-red-600 text-sm mt-1">{errors.patient_code.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <input type="text" {...register('full_name', patientValidation.full_name)} className={inputClass('full_name')} />
              {errors.full_name && <p className="text-red-600 text-sm mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth *</label>
              <input type="date" {...register('date_of_birth', patientValidation.date_of_birth)} className={inputClass('date_of_birth')} />
              {errors.date_of_birth && <p className="text-red-600 text-sm mt-1">{errors.date_of_birth.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender *</label>
              <select {...register('gender', patientValidation.gender)} className={inputClass('gender')}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <p className="text-red-600 text-sm mt-1">{errors.gender.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ghana Card</label>
              <input type="text" {...register('ghana_card_number')} placeholder="GHA-123456789-0" className={inputClass('ghana_card_number')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">NHIS Number</label>
              <input type="text" {...register('nhis_number')} placeholder="8 digits" className={inputClass('nhis_number')} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input type="tel" {...register('phone')} placeholder="+233..." className={inputClass('phone')} />
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-serif text-lg text-teal-800">Location & Facility</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Region *</label>
              <select {...register('region', { required: 'Region is required' })} className={inputClass('region')}>
                {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.region && <p className="text-red-600 text-sm mt-1">{errors.region.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">District *</label>
              <input type="text" {...register('district', { required: 'District is required' })} className={inputClass('district')} />
              {errors.district && <p className="text-red-600 text-sm mt-1">{errors.district.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Facility Name *</label>
              <input type="text" {...register('facility_name', { required: 'Facility is required' })} className={inputClass('facility_name')} />
              {errors.facility_name && <p className="text-red-600 text-sm mt-1">{errors.facility_name.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Home Address</label>
              <textarea {...register('address')} rows={2} className={inputClass('address')} />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-serif text-lg text-teal-800">Clinical Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Primary Diagnosis *</label>
              <input type="text" {...register('primary_diagnosis', patientValidation.primary_diagnosis)} className={inputClass('primary_diagnosis')} />
              {errors.primary_diagnosis && <p className="text-red-600 text-sm mt-1">{errors.primary_diagnosis.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Secondary Diagnoses</label>
              <input type="text" {...register('secondary_diagnoses')} className={inputClass('secondary_diagnoses')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Admission Date</label>
                <input type="date" {...register('admission_date')} className={inputClass('admission_date')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Care Pathway</label>
                <select {...register('care_pathway')} className={inputClass('care_pathway')}>
                  <option value="standard">Standard Palliative</option>
                  <option value="oncology">Oncology</option>
                  <option value="dementia">Dementia</option>
                  <option value="pediatric">Pediatric</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preferred Language</label>
                <select {...register('preferred_language')} className={inputClass('preferred_language')}>
                  <option value="en">English</option>
                  <option value="twi">Twi</option>
                  <option value="ga">Ga</option>
                  <option value="ewe">Ewe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Religious Preference</label>
                <input type="text" {...register('religious_preference')} className={inputClass('religious_preference')} />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('advance_directive')} className="rounded" />
                Advance directive on file
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('dnr_status')} className="rounded" />
                DNR status
              </label>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-serif text-lg text-teal-800">Emergency Contact</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Contact Name *</label>
              <input type="text" {...register('emergency_contact_name', { required: 'Required' })} className={inputClass('emergency_contact_name')} />
              {errors.emergency_contact_name && <p className="text-red-600 text-sm mt-1">{errors.emergency_contact_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Relationship *</label>
              <input type="text" {...register('emergency_contact_relationship', { required: 'Required' })} placeholder="Spouse, Son, Daughter..." className={inputClass('emergency_contact_relationship')} />
              {errors.emergency_contact_relationship && <p className="text-red-600 text-sm mt-1">{errors.emergency_contact_relationship.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Phone *</label>
              <input type="tel" {...register('emergency_contact_phone', { required: 'Required' })} className={inputClass('emergency_contact_phone')} />
              {errors.emergency_contact_phone && <p className="text-red-600 text-sm mt-1">{errors.emergency_contact_phone.message}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="px-4 py-2 border rounded-lg flex items-center gap-1">
            <ChevronLeft size={16} /> Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={nextStep} className="flex-1 px-4 py-2 bg-teal-800 text-white rounded-lg flex items-center justify-center gap-1">
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-teal-800 text-white rounded-lg disabled:opacity-50">
            {isSubmitting ? 'Creating...' : 'Create Patient'}
          </button>
        )}
      </div>
    </form>
  );
}
