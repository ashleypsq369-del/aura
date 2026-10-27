/**
 * usePatientId
 * ============
 * Resolves the patient record ID for the currently logged-in user.
 *
 * Strategy (in order):
 * 1. If the user is not a patient/family → return null (staff don't have a patient ID)
 * 2. user.patient_id or user.linked_patient_id already on the auth object → use it
 * 3. Fetch GET /api/preferences/mine → prefs.patient_id → cache it on the user object
 * 4. Fetch GET /api/patients → find by full_name match → last resort
 *
 * Returns: { patientId: number|null, isLoading: boolean }
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../api/client';

export function usePatientId() {
 const { user } = useAuth();
 const [resolvedId, setResolvedId] = useState(null);

 // Step 2 - already on the user object
 const quickId =
 user?.patient_id ||
 user?.linked_patient_id ||
 null;

 // Step 3 - fetch from preferences (fast, single call)
 const token = localStorage.getItem('auth_token');
 const isPatientOrFamily = user?.role === 'patient' || user?.role === 'family';

 const { data: prefsData, isLoading: loadingPrefs } = useQuery({
 queryKey: ['prefs-mine', user?.id],
 queryFn: async () => {
 const r = await axios.get(`${API_URL}/api/preferences/my`, {
 headers: { Authorization: `Bearer ${token}` },
 });
 return r.data;
 },
 enabled: isPatientOrFamily && !!token && !!user?.id && !quickId,
 staleTime: 5 * 60 * 1000,
 retry: 1,
 });

 // Step 4 - fallback: search patients by name
 const { data: patientsList, isLoading: loadingPatients } = useQuery({
 queryKey: ['patients-mine', user?.id],
 queryFn: async () => {
 const r = await axios.get(`${API_URL}/api/patients`, {
 headers: { Authorization: `Bearer ${token}` },
 });
 return r.data;
 },
 enabled: isPatientOrFamily && !!token && !quickId && !prefsData?.patient_id,
 staleTime: 5 * 60 * 1000,
 retry: 1,
 });

 useEffect(() => {
 if (!isPatientOrFamily) { setResolvedId(null); return; }

 // Step 2
 if (quickId) { setResolvedId(quickId); return; }

 // Step 3
 if (prefsData?.patient_id) { setResolvedId(prefsData.patient_id); return; }

 // Step 4 - family: first patient in the list; patient: match by name
 if (patientsList) {
 const list = Array.isArray(patientsList) ? patientsList
 : patientsList.patients || [];
 if (user?.role === 'family') {
 if (list.length > 0) setResolvedId(list[0].id);
 } else {
 const match = list.find(
 p => p.full_name === user?.full_name || p.id === user?.id
 );
 if (match) setResolvedId(match.id);
 else if (list.length > 0) setResolvedId(list[0].id);
 }
 }
 }, [quickId, prefsData, patientsList, isPatientOrFamily, user]);

 const isLoading =
 isPatientOrFamily && !resolvedId &&
 (loadingPrefs || loadingPatients);

 return { patientId: resolvedId, isLoading };
}
