import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from '../utils/toast';
import { useForm } from 'react-hook-form';
import apiClient from '../api/client';
import { offlinePatientsAPI } from '../api/offlineClient';
import { EmptyPatients } from '../components/EmptyState';
import { patientValidation } from '../utils/formValidation';
import PatientIntakeForm from '../components/PatientIntakeForm';
import Modal, { ModalFooter } from '../components/Modal';
import PageHeader from '../components/PageHeader';
import SectionErrorBoundary from '../components/SectionErrorBoundary';
import PatientDataTable from '../components/PatientDataTable';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, Search, Building2, Heart, Home, Stethoscope, BedDouble } from 'lucide-react';

const CARE_SETTING_FILTERS = [
 { value: 'all', label: 'All Settings', icon: null },
 { value: 'hospital_based', label: 'Hospital', icon: Building2, color: '#1d4ed8' },
 { value: 'hospice', label: 'Hospice', icon: Heart, color: '#be123c' },
 { value: 'home_based', label: 'Home Care', icon: Home, color: '#15803d' },
 { value: 'outpatient_clinic', label: 'Clinic', icon: Stethoscope, color: '#0d9488' },
 { value: 'long_term_residential',label: 'Residential', icon: BedDouble, color: '#7c3aed' },
];

export default function Patients() {
 const navigate = useNavigate();
 const location = useLocation();
 const { user } = useAuth();
 const [searchTerm, setSearchTerm] = useState('');
 const [filterStatus, setFilterStatus] = useState(
 location.state?.filterStatus || 'all'
 );
 const [filterCareSetting, setFilterCareSetting] = useState('all');

 // Patients and family should not access the full patient list - redirect to their appropriate home
 useEffect(() => {
 if (user?.role === 'patient') navigate('/my-space', { replace: true });
 else if (user?.role === 'family') navigate('/dashboard', { replace: true });
 }, [user?.role, navigate]);
 const [showAddModal, setShowAddModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [editingPatient, setEditingPatient] = useState(null);

 const queryClient = useQueryClient();

 // Form validation for Add Patient - only resetAdd is used (form handled by PatientIntakeForm)
 const {
 reset: resetAdd} = useForm({
 mode: 'onChange',
 defaultValues: {
 patient_code: '',
 full_name: '',
 date_of_birth: '',
 gender: 'male',
 primary_diagnosis: '',
 admission_date: ''}});

 // Form validation for Edit Patient
 const {
 register: registerEdit,
 handleSubmit: handleSubmitEdit,
 formState: { errors: errorsEdit },
 reset: resetEdit,
 setValue: setValueEdit} = useForm({
 mode: 'onChange',
 defaultValues: {
 patient_code: '',
 full_name: '',
 date_of_birth: '',
 gender: 'male',
 primary_diagnosis: '',
 admission_date: ''}});

 // Fetch patients with offline support
 const { data: patients, isLoading } = useQuery({
 queryKey: ['patients'],
 queryFn: async () => {
 const response = await offlinePatientsAPI.getAll();
 return response.data;
 },
 staleTime: 0, // always refetch - patient list changes frequently
 refetchOnMount: true, // refresh every time the page is visited
 });

 // Create patient mutation with offline support
 const createMutation = useMutation({
 mutationFn: async (data) => {
 const response = await offlinePatientsAPI.create(data);
 return response.data;
 },
 onSuccess: (data) => {
 queryClient.invalidateQueries(['patients']);
 if (data.offline) {
 toast.success('Patient saved offline! Will sync when connected.', { });
 } else {
 toast.success('Patient added successfully!');
 }
 setShowAddModal(false);
 resetAdd();
 },
 onError: (error) => {
 toast.error(error.response?.data?.detail || 'Failed to add patient');
 }
 });

 // Update patient mutation
 const updateMutation = useMutation({
 mutationFn: async ({ id, data }) => {
 const response = await apiClient.put(`/api/patients/${id}`, data);
 return response.data;
 },
 onSuccess: () => {
 queryClient.invalidateQueries(['patients']);
 toast.success('Patient updated successfully!');
 setShowEditModal(false);
 setEditingPatient(null);
 resetEdit();
 },
 onError: (error) => {
 toast.error(error.response?.data?.detail || 'Failed to update patient');
 }
 });

 const onSubmitAdd = (data) => {
 const payload = {
 ...data,
 date_of_birth: data.date_of_birth ? new Date(data.date_of_birth).toISOString() : null,
 admission_date: data.admission_date ? new Date(data.admission_date).toISOString() : null,
 advance_directive: !!data.advance_directive,
 dnr_status: !!data.dnr_status,
 };
 createMutation.mutate(payload);
 };

 const onSubmitEdit = (data) => {
 updateMutation.mutate({ id: editingPatient.id, data });
 };

 const handleEditClick = (patient) => {
 setEditingPatient(patient);
 setValueEdit('patient_code', patient.patient_code);
 setValueEdit('full_name', patient.full_name);
 setValueEdit('date_of_birth', patient.date_of_birth ? new Date(patient.date_of_birth).toISOString().split('T')[0] : '');
 setValueEdit('gender', patient.gender);
 setValueEdit('primary_diagnosis', patient.primary_diagnosis || '');
 setValueEdit('admission_date', patient.admission_date ? new Date(patient.admission_date).toISOString().split('T')[0] : '');
 setShowEditModal(true);
 };

 // Filter patients
 const filteredPatients = patients?.filter((patient) => {
 const matchesSearch = 
 patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 patient.primary_diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 patient.patient_code?.toLowerCase().includes(searchTerm.toLowerCase());
 const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;
 const matchesSetting = filterCareSetting === 'all' || patient.care_setting === filterCareSetting;
 return matchesSearch && matchesStatus && matchesSetting;
 });

 return (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.2 }}
 className="space-y-4 ambient-bg min-h-screen"
 >
 {/* Header */}
 <PageHeader
 image="/resources/african/african-nurse-patient.jpg"
 title="Patients"
 subtitle="Manage patient records and care"
 icon={Users}
 stats={[
 { label:'Total',         value:patients?.length ?? 0,                                            color:'#2dd4bf', pulse:false },
 { label:'Critical',      value:patients?.filter(p=>p.status==='critical').length ?? 0,            color:'#f87171', pulse:(patients?.filter(p=>p.status==='critical').length??0)>0, onClick:()=>setFilterStatus('critical') },
 { label:'Deteriorating', value:patients?.filter(p=>p.status==='deteriorating').length ?? 0,       color:'#fbbf24', pulse:false, onClick:()=>setFilterStatus('deteriorating') },
 { label:'Stable',        value:patients?.filter(p=>p.status==='stable').length ?? 0,              color:'#4ade80', pulse:false, onClick:()=>setFilterStatus('stable') },
 ]}
 >
 {/* Search */}
 <div style={{ position:'relative', flex:1, minWidth:160, maxWidth:300 }}>
 <Search size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-400)', pointerEvents:'none' }}/>
 <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
 placeholder="Search name, diagnosis, code…"
 style={{ width:'100%', height:34, paddingLeft:32, paddingRight:12, fontSize:12, borderRadius:20, border:'1px solid var(--card-border)', background:'var(--page-bg)', color:'var(--text-800)', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }}
 onFocus={e=>(e.target.style.borderColor='var(--c-teal)')}
 onBlur={e=>(e.target.style.borderColor='var(--card-border)')}/>
 </div>

 {/* Separator */}
 <div style={{ width:1, height:20, background:'var(--card-border)', flexShrink:0 }}/>

 {/* Status pills */}
 <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
 {[{value:'all',label:'All',color:'#475569'},{value:'active',label:'Active',color:'#0d9488'},{value:'stable',label:'Stable',color:'#059669'},{value:'deteriorating',label:'Deteriorating',color:'#d97706'},{value:'critical',label:'Critical',color:'#e11d48'}].map(({value:v,label,color})=>(
 <button key={v} onClick={()=>setFilterStatus(v)} style={{
 padding:'4px 11px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
 border: filterStatus===v ? `1.5px solid ${color}` : '1px solid var(--card-border)',
 background: filterStatus===v ? `${color}12` : 'var(--card-bg)',
 color: filterStatus===v ? color : 'var(--text-500)',
 }}>{label}</button>
 ))}
 </div>

 {/* Separator */}
 <div style={{ width:1, height:20, background:'var(--card-border)', flexShrink:0 }}/>

 {/* Care setting pills — compact */}
 <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
 {CARE_SETTING_FILTERS.map(({value:v,label,icon:CSIcon,color})=>{
 const active = filterCareSetting===v;
 return (
 <button key={v} onClick={()=>setFilterCareSetting(v)} style={{
 display:'flex', alignItems:'center', gap:4,
 padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
 border: active ? `1.5px solid ${color||'#475569'}` : '1px solid var(--card-border)',
 background: active ? `${color||'#475569'}12` : 'var(--card-bg)',
 color: active ? color||'#475569' : 'var(--text-500)',
 }}>
 {CSIcon && <CSIcon size={10}/>}{label}
 </button>
 );
 })}
 </div>

 {/* Add patient */}
 <button onClick={()=>setShowAddModal(true)} style={{
 display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:20,
 fontSize:12, fontWeight:700, border:'none', cursor:'pointer', marginLeft:'auto',
 background:'linear-gradient(135deg,#1d4ed8,#0891b2)', color:'#fff',
 boxShadow:'0 2px 8px rgba(29,78,216,0.3)', transition:'opacity 0.15s', flexShrink:0,
 }}
 onMouseEnter={e=>(e.currentTarget.style.opacity='0.88')}
 onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
 <Plus size={14}/> Add Patient
 </button>
 </PageHeader>

 {/* Patients Table */}
 <div className="px-3 sm:px-4">
 <SectionErrorBoundary name="Patient Table">
 <PatientDataTable
 patients={filteredPatients || []}
 loading={isLoading}
 onViewPatient={(id) => navigate(`/patients/${id}`)}
 />
 {!isLoading && (!filteredPatients || filteredPatients.length === 0) && (
 <EmptyPatients onAddClick={() => setShowAddModal(true)} />
 )}
 </SectionErrorBoundary>
 </div>

 {/* Add Patient Modal */}
 <Modal
 isOpen={showAddModal}
 onClose={() => { setShowAddModal(false); resetAdd(); }}
 title="Patient Intake Questionnaire"
 size="xl"
 closeOnBackdrop={false}
 >
 <p className="text-sm text-[var(--text-500)] mb-4">Complete all steps to register a new patient with full clinical and contact details.</p>
 <PatientIntakeForm
 onSubmit={onSubmitAdd}
 onCancel={() => { setShowAddModal(false); resetAdd(); }}
 isSubmitting={createMutation.isPending}
 />
 </Modal>

 {/* Edit Patient Modal */}
 <Modal
 isOpen={showEditModal && !!editingPatient}
 onClose={() => { setShowEditModal(false); setEditingPatient(null); resetEdit(); }}
 title="Edit Patient"
 size="lg"
 closeOnBackdrop={false}
 footerContent={
 <ModalFooter>
 <button
 type="button"
 onClick={() => { setShowEditModal(false); setEditingPatient(null); resetEdit(); }}
 className="px-4 py-2 text-sm font-semibold text-[var(--text-700)] border-2 border-slate-300 rounded-xl hover:bg-[var(--card-bg)] transition-all duration-150"
 >
 Cancel
 </button>
 <button
 type="submit"
 form="edit-patient-form"
 disabled={updateMutation.isPending}
 data-tip="Save patient record changes"
 className="px-5 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl border-2 border-teal-600 transition-all duration-150 disabled:opacity-50"
 >
 {updateMutation.isPending ? 'Updating...' : 'Update Patient'}
 </button>
 </ModalFooter>
 }
 >
 <form id="edit-patient-form" onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
 <div>
 <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">Patient Code *</label>
 <input
 type="text"
 {...registerEdit('patient_code')}
 disabled
 className="w-full px-3 py-2.5 border border-[var(--card-border)] rounded-xl bg-slate-100 cursor-not-allowed text-slate-500"
 />
 <p className="text-xs text-[var(--text-400)] mt-1">Patient code cannot be changed</p>
 </div>

 <div>
 <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">Full Name *</label>
 <input
 type="text"
 {...registerEdit('full_name', patientValidation.full_name)}
 className={`w-full px-3 py-2.5 border-2 rounded-xl focus:ring-2 focus:outline-none transition ${errorsEdit.full_name ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'}`}
 />
 {errorsEdit.full_name && <p className="text-red-600 text-xs mt-1">{errorsEdit.full_name.message}</p>}
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">Date of Birth *</label>
 <input
 type="date"
 {...registerEdit('date_of_birth', patientValidation.date_of_birth)}
 className={`w-full px-3 py-2.5 border-2 rounded-xl focus:ring-2 focus:outline-none transition ${errorsEdit.date_of_birth ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'}`}
 />
 {errorsEdit.date_of_birth && <p className="text-red-600 text-xs mt-1">{errorsEdit.date_of_birth.message}</p>}
 </div>
 <div>
 <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">Gender *</label>
 <select
 {...registerEdit('gender', patientValidation.gender)}
 className={`w-full px-3 py-2.5 border-2 rounded-xl focus:ring-2 focus:outline-none transition ${errorsEdit.gender ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'}`}
 >
 <option value="male">Male</option>
 <option value="female">Female</option>
 <option value="other">Other</option>
 </select>
 {errorsEdit.gender && <p className="text-red-600 text-xs mt-1">{errorsEdit.gender.message}</p>}
 </div>
 </div>

 <div>
 <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">Primary Diagnosis *</label>
 <input
 type="text"
 {...registerEdit('primary_diagnosis', patientValidation.primary_diagnosis)}
 className={`w-full px-3 py-2.5 border-2 rounded-xl focus:ring-2 focus:outline-none transition ${errorsEdit.primary_diagnosis ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'}`}
 />
 {errorsEdit.primary_diagnosis && <p className="text-red-600 text-xs mt-1">{errorsEdit.primary_diagnosis.message}</p>}
 </div>

 <div>
 <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">Admission Date (Optional)</label>
 <input
 type="date"
 {...registerEdit('admission_date', patientValidation.admission_date)}
 className={`w-full px-3 py-2.5 border-2 rounded-xl focus:ring-2 focus:outline-none transition ${errorsEdit.admission_date ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'}`}
 />
 {errorsEdit.admission_date && <p className="text-red-600 text-xs mt-1">{errorsEdit.admission_date.message}</p>}
 </div>
 </form>
 </Modal>

 {/* Toaster for notifications */}
 </motion.div>
 );
}

