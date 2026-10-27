/**
 * usePatientCareSetting
 * =====================
 * Returns the care setting for a SPECIFIC patient - used by clinicians
 * and caregivers who are viewing a patient record.
 *
 * For patients/family: use useCareSettingContext() directly (reads their own setting).
 * For staff: use this hook with the patient's ID to get THAT patient's setting.
 *
 * Returns:
 * {
 * careSetting: string | null,
 * meta: object | null, -- label, icon, color, description
 * clinicalNotes: string | null, -- guidance for clinical staff
 * keyTasks: string[], -- recommended tasks for this setting
 * isHiddenForPatient: (path) => bool, -- would this path be hidden for a patient in this setting?
 * isLoading: bool,
 * }
 */
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../api/client';
import {
 CARE_SETTING_META,
 SETTING_FEATURE_GATES,
 isFeatureHidden,
} from '../context/CareSettingContext';

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

// Clinical guidance per setting (staff-facing)
const SETTING_CLINICAL = {
 hospital_based: {
 notes: 'Inpatient specialist care. Prioritise: vitals q4-8h, pain control, daily MDT review.',
 tasks: ['Vitals every 4–8h', 'Daily ESAS check-in', 'Medication review', 'MDT daily review'],
 },
 hospice: {
 notes: 'Comfort-focused. Prioritise: dignity, pain & symptom control, family support.',
 tasks: ['Comfort measures', 'Pain & symptom control', 'Family/bereavement support', 'Advance directive'],
 },
 home_based: {
 notes: 'Community visits. Prioritise: medication compliance, carer education, remote monitoring.',
 tasks: ['Daily vitals log', 'Medication adherence', 'Carer training', 'Remote symptom check'],
 },
 outpatient_clinic: {
 notes: 'Clinic visits. Prioritise: appointment adherence, assessment completion, medication review.',
 tasks: ['Appointment attendance', 'Assessment completion', 'Medication review', 'Pre-clinic prep'],
 },
 long_term_residential: {
 notes: 'Residential facility. Prioritise: ADL support, monthly PPS, family updates.',
 tasks: ['Monthly PPS assessment', 'ADL monitoring', 'Community engagement', 'Family liaison'],
 },
};

export function usePatientCareSetting(patientId) {
 const { user } = useAuth();
 const isStaff = ['clinician', 'admin', 'caregiver'].includes(user?.role);

 // Fetch patient record to get their care_setting field
 const { data: patient, isLoading } = useQuery({
 queryKey: ['patient-care-setting-lookup', patientId],
 queryFn: () =>
 axios.get(`${API_URL}/api/patients/${patientId}`, { headers: authH() })
 .then(r => r.data),
 enabled: isStaff && !!patientId,
 staleTime: 5 * 60 * 1000,
 retry: false,
 });

 const setting = patient?.care_setting || null;
 const meta = setting ? CARE_SETTING_META[setting] : null;
 const clinical = setting ? SETTING_CLINICAL[setting] : null;

 return {
 careSetting: setting,
 meta,
 clinicalNotes: clinical?.notes || null,
 keyTasks: clinical?.tasks || [],
 isHiddenForPatient: (path) => isFeatureHidden(setting, path, 'patient'),
 isLoading,
 };
}
