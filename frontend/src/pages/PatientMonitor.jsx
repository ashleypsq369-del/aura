import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { patientsAPI, vitalsAPI, symptomsAPI, medicationsAPI, appointmentsAPI } from '../api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Heart, Thermometer, Droplets, AlertCircle, Pill, Calendar, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function PatientMonitor() {
  const { id } = useParams();
  const patientId = parseInt(id) || 1;
  const [activeTab, setActiveTab] = useState('vitals');
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState('vital');

  // Fetch patient data
  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const response = await patientsAPI.getById(patientId);
      return response.data;
    },
  });

  // Fetch vitals
  const { data: vitals } = useQuery({
    queryKey: ['vitals', patientId],
    queryFn: async () => {
      const response = await vitalsAPI.getPatientVitals(patientId, 50);
      return response.data;
    },
  });

  // Fetch symptoms
  const { data: symptoms } = useQuery({
    queryKey: ['symptoms', patientId],
    queryFn: async () => {
      const response = await symptomsAPI.getPatientSymptoms(patientId, 50);
      return response.data;
    },
  });

  // Fetch medications
  const { data: medications } = useQuery({
    queryKey: ['medications', patientId],
    queryFn: async () => {
      const response = await medicationsAPI.getPatientMedications(patientId);
      return response.data;
    },
  });

  // Fetch appointments
  const { data: appointments } = useQuery({
    queryKey: ['appointments', patientId],
    queryFn: async () => {
      const response = await appointmentsAPI.getPatientAppointments(patientId);
      return response.data;
    },
  });

  // Prepare vitals chart data
  const vitalsChartData = vitals?.slice(-20).map(v => ({
    time: new Date(v.recorded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    'Heart Rate': Math.round(v.heart_rate),
    'BP Systolic': Math.round(v.blood_pressure_sys || v.blood_pressure_systolic),
    'O2 Sat': parseFloat((v.oxygen_saturation).toFixed(1)),
    'Temp': parseFloat((v.temperature).toFixed(1)),
  })) || [];

  // Get latest vitals
  const latestVitals = vitals?.[0];

  // Get vital status
  const getVitalStatus = (value, min, max) => {
    if (value < min || value > max) return 'critical';
    if (value < min + 5 || value > max - 5) return 'warning';
    return 'normal';
  };

  const tabs = [
    { id: 'vitals', name: 'Vitals', icon: Activity },
    { id: 'symptoms', name: 'Symptoms', icon: AlertCircle },
    { id: 'medications', name: 'Medications', icon: Pill },
    { id: 'appointments', name: 'Appointments', icon: Calendar },
    { id: 'careplan', name: 'Care Plan', icon: FileText },
  ];

  return (
    <div>
      {/* Patient Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6 bg-gradient-to-r from-forest/5 to-forest-light/5"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-serif text-charcoal mb-2">
              Patient: {patient?.patient_code || 'Loading...'}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted">
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Age:</span>
                <span>{patient?.age} years</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Gender:</span>
                <span>{patient?.gender}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Diagnosis:</span>
                <span>{patient?.primary_diagnosis || '—'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Admitted:</span>
                <span>{patient?.admission_date ? new Date(patient.admission_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Risk:</span>
                <span className={`font-bold ${
                  patient?.risk_level === 'Crisis' ? 'text-red-700' :
                  patient?.risk_level === 'High' ? 'text-amber-700' :
                  patient?.risk_level === 'Medium' ? 'text-blue-700' : 'text-green-700'
                }`}>
                  {patient?.risk_level} ({patient?.risk_score ? Math.round(patient.risk_score * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowLogModal(true)}
            className="btn-primary"
          >
            Log New Data
          </button>
        </div>
      </motion.div>

      {/* Quick Stats */}
      {latestVitals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <VitalCard
            icon={Heart}
            label="Heart Rate"
            value={Math.round(latestVitals.heart_rate)}
            unit="bpm"
            status={getVitalStatus(latestVitals.heart_rate, 60, 100)}
            normalRange="60-100"
          />
          <VitalCard
            icon={Activity}
            label="Blood Pressure"
            value={`${Math.round(latestVitals.blood_pressure_sys || latestVitals.blood_pressure_systolic)}/${Math.round(latestVitals.blood_pressure_dia || latestVitals.blood_pressure_diastolic)}`}
            unit="mmHg"
            status={getVitalStatus(latestVitals.blood_pressure_sys || latestVitals.blood_pressure_systolic, 90, 140)}
            normalRange="90-140/60-90"
          />
          <VitalCard
            icon={Droplets}
            label="Oxygen Sat"
            value={parseFloat((latestVitals.oxygen_saturation).toFixed(1))}
            unit="%"
            status={getVitalStatus(latestVitals.oxygen_saturation, 95, 100)}
            normalRange="95-100%"
          />
          <VitalCard
            icon={Thermometer}
            label="Temperature"
            value={parseFloat((latestVitals.temperature).toFixed(1))}
            unit="°C"
            status={getVitalStatus(latestVitals.temperature, 36.5, 37.5)}
            normalRange="36.5-37.5°C"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-forest text-white'
                  : 'bg-warm-card text-charcoal hover:bg-forest-light/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'vitals' && (
          <div className="space-y-6">
            {/* Vitals Chart */}
            <div className="card">
              <h3 className="text-xl font-serif text-charcoal mb-4">Vitals Trend (Last 20 Readings)</h3>
              {vitalsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={vitalsChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="time" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Heart Rate" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="BP Systolic" stroke="#1B4332" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="O2 Sat" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Temp" stroke="#D4A017" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted text-center py-12">No vitals data available</p>
              )}
            </div>

            {/* Vitals Table */}
            <div className="card">
              <h3 className="text-xl font-serif text-charcoal mb-4">Recent Vitals</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-forest-light/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-charcoal font-semibold">Time</th>
                      <th className="px-4 py-3 text-left text-charcoal font-semibold">HR</th>
                      <th className="px-4 py-3 text-left text-charcoal font-semibold">BP</th>
                      <th className="px-4 py-3 text-left text-charcoal font-semibold">O2</th>
                      <th className="px-4 py-3 text-left text-charcoal font-semibold">Temp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vitals?.slice(0, 10).map((vital, index) => (
                      <tr key={vital.id} className={index % 2 === 0 ? 'bg-warm-white' : ''}>
                        <td className="px-4 py-3 text-muted">
                          {new Date(vital.recorded_at).toLocaleString('en-GB', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3">{Math.round(vital.heart_rate)} bpm</td>
                        <td className="px-4 py-3">{Math.round(vital.blood_pressure_sys || vital.blood_pressure_systolic)}/{Math.round(vital.blood_pressure_dia || vital.blood_pressure_diastolic)}</td>
                        <td className="px-4 py-3">{parseFloat((vital.oxygen_saturation).toFixed(1))}%</td>
                        <td className="px-4 py-3">{parseFloat((vital.temperature).toFixed(1))}°C</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'symptoms' && (
          <div className="card">
            <h3 className="text-xl font-serif text-charcoal mb-4">Symptom Log</h3>
            {symptoms && symptoms.length > 0 ? (
              <div className="space-y-4">
                {symptoms.slice(0, 10).map((symptom, index) => (
                  <motion.div
                    key={symptom.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-l-4 border-forest-light pl-4 py-2"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-charcoal">
                          Pain Level: {symptom.pain_level}/10
                        </p>
                        <p className="text-sm text-muted">
                          {new Date(symptom.recorded_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {symptom.nausea && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">Nausea</span>
                        )}
                        {symptom.fatigue && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">Fatigue</span>
                        )}
                        {symptom.anxiety && (
                          <span className="px-2 py-1 bg-violet-100 text-violet-800 rounded text-xs font-medium">Anxiety</span>
                        )}
                        {symptom.dyspnea && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">Breathlessness</span>
                        )}
                      </div>
                    </div>
                    {symptom.notes && (
                      <p className="text-sm text-muted italic">"{symptom.notes}"</p>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center py-12">No symptoms recorded</p>
            )}
          </div>
        )}

        {activeTab === 'medications' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medications && medications.length > 0 ? (
              medications.map((med, index) => (
                <motion.div
                  key={med.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-charcoal">{med.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${med.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>
                      {med.is_active ? 'Active' : 'Discontinued'}
                    </span>
                  </div>
                  <p className="text-sm text-muted mb-1">Dose: {med.dose}</p>
                  <p className="text-sm text-muted mb-1">Frequency: {med.frequency}</p>
                  {med.route && <p className="text-sm text-muted mb-1">Route: {med.route}</p>}
                  {med.indication && <p className="text-sm text-muted">Indication: {med.indication}</p>}
                </motion.div>
              ))
            ) : (
              <div className="col-span-2 card text-center py-12">
                <p className="text-muted">No medications prescribed</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {appointments && appointments.length > 0 ? (
              appointments.map((apt, index) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-charcoal mb-1">{apt.appointment_type || 'Consultation'}</h4>
                      <p className="text-sm text-muted mb-1">
                        {apt.scheduled_at ? new Date(apt.scheduled_at).toLocaleString('en-GB', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : 'Date TBC'}
                      </p>
                      <p className="text-sm text-muted">{apt.location || 'Hospital'}</p>
                      {apt.status && (
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                          apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                          apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>{apt.status}</span>
                      )}
                    </div>
                    <Calendar className="w-8 h-8 text-forest flex-shrink-0" />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="card text-center py-12">
                <p className="text-muted">No upcoming appointments</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'careplan' && (
          <div className="card">
            <h3 className="text-xl font-serif text-charcoal mb-4">Care Plan</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-charcoal mb-2">Current Care Pathway</h4>
                <div className="mt-2 p-4 bg-forest-light/5 rounded-lg">
                  <p className="font-semibold text-forest capitalize">
                    {patient?.care_pathway?.replace(/_/g, ' ') || 'Standard Palliative Care'}
                  </p>
                  <p className="text-sm text-muted mt-1">
                    Risk score: {patient?.risk_score ? `${Math.round(patient.risk_score * 100)}%` : '—'} · Level: {patient?.risk_level || '—'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-charcoal mb-2">Patient Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { l: 'Diagnosis', v: patient?.primary_diagnosis },
                    { l: 'Status', v: patient?.status },
                    { l: 'DNR Status', v: patient?.dnr_status || 'Not specified' },
                    { l: 'Advance Directive', v: patient?.advance_directive || 'Not specified' },
                    { l: 'Preferred Language', v: patient?.preferred_language || '—' },
                    { l: 'Facility', v: patient?.facility_name || '—' },
                  ].map(({ l, v }) => v && (
                    <div key={l} className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-muted  mb-0.5">{l}</p>
                      <p className="font-semibold text-charcoal capitalize">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {patient?.secondary_diagnoses && (
                <div>
                  <h4 className="font-semibold text-charcoal mb-2">Secondary Diagnoses</h4>
                  <p className="text-sm text-muted p-3 bg-slate-50 rounded-lg">{patient.secondary_diagnoses}</p>
                </div>
              )}

              {(patient?.emergency_contact_name) && (
                <div>
                  <h4 className="font-semibold text-charcoal mb-2">Emergency Contact</h4>
                  <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-1">
                    <p className="font-semibold text-charcoal">{patient.emergency_contact_name}</p>
                    {patient.emergency_contact_relationship && <p className="text-muted">{patient.emergency_contact_relationship}</p>}
                    {patient.emergency_contact_phone && <p className="text-muted">{patient.emergency_contact_phone}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function VitalCard({ icon: Icon, label, value, unit, status, normalRange }) {
  const statusColors = {
    normal: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    critical: 'bg-red-50 border-red-200 text-red-800 crisis-alert',
  };

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`card border-2 ${statusColors[status]}`}
    >
      <div className="flex items-start justify-between mb-2">
        <Icon className="w-6 h-6" />
        <span className="text-xs font-semibold px-2 py-1 bg-white/50 rounded">
          {status === 'normal' ? 'Normal' : status === 'warning' ? 'Watch' : 'Alert'}
        </span>
      </div>
      <p className="text-sm font-semibold mb-1">{label}</p>
      <p className="text-2xl font-bold">
        {value} <span className="text-sm font-normal">{unit}</span>
      </p>
      <p className="text-xs mt-1 opacity-75">Normal: {normalRange}</p>
    </motion.div>
  );
}
