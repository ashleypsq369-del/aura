import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pill, CheckCircle, AlertCircle, Brain, ArrowLeft, Plus } from 'lucide-react';
import apiClient from '../api/client';
import { offlineMedicationsAPI } from '../api/offlineClient';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import FocusedAIExplanation from '../components/FocusedAIExplanation';

function getFrequencyText(frequency) {
  const map = {
    once_daily:         'Once Daily',
    twice_daily:        'Twice Daily',
    three_times_daily:  'Three Times Daily',
    four_times_daily:   'Four Times Daily',
    as_needed:          'As Needed',
    weekly:             'Weekly',
    monthly:            'Monthly',
  };
  return map[frequency] || frequency || 'Oral';
}

export default function MedicationsDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [showAI, setShowAI] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => apiClient.get(`/api/patients/${patientId}`).then(r => r.data),
    enabled: !!patientId,
  });

  const { data: medsData, isLoading } = useQuery({
    queryKey: ['patient-medications-detail', patientId],
    queryFn: () => offlineMedicationsAPI.getPatientMedications(patientId).then(r => r.data),
    enabled: !!patientId,
  });

  const meds = Array.isArray(medsData) ? medsData
    : Array.isArray(medsData?.medications) ? medsData.medications : [];

  const activeMeds = meds.filter(m => m.is_active);
  const inactiveMeds = meds.filter(m => !m.is_active);

  const explainMedication = async (medName) => {
    setLoadingAI(true);
    try {
      const res = await apiClient.post('/api/comprehensive-ai/focused-explanation', {
        patient_id: parseInt(patientId),
        focus_type: 'medication',
        focus_data: { medication_name: medName },
      });
      setAiData(res.data);
      setShowAI(true);
    } catch { /* non-fatal */ }
    finally { setLoadingAI(false); }
  };

  const actions = [{ label: 'Prescribe', icon: Plus, primary: true, onClick: () => navigate('/medications') }];

  return (
    <PageTransition>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-0">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-teal-700 transition-colors mt-4 mb-2 group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Back
        </button>

        <PageHeader
          image="/resources/cards/card-medications.jpg"
          title={patient ? `${patient.full_name} — Medications` : 'Medications'}
          subtitle="Complete medication history and prescriptions"
          icon={Pill}
          actions={actions}
        />

        {isLoading ? (
          <div className="grid grid-cols-3 gap-4 mt-6 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-200 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              {[
                { label: 'Active',      value: activeMeds.length,   icon: CheckCircle, color: '#059669' },
                { label: 'Inactive',    value: inactiveMeds.length, icon: AlertCircle, color: '#64748b' },
                { label: 'Total',       value: meds.length,         icon: Pill,        color: '#0d9488' },
              ].map(({ label, value, icon: Icon, color }, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                      <Icon size={15} style={{ color }} />
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                </motion.div>
              ))}
            </div>

            {/* Active Medications */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b-2 border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Active Medications</h2>
                  <p className="text-slate-500 text-sm">Currently prescribed medications</p>
                </div>
                <span className="chip-teal">{activeMeds.length} Active</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-200">
                      {['Medication','Dosage','Frequency','Start Date','Route','AI'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeMeds.map((med) => (
                      <tr key={med.id} className="hover:bg-slate-50 transition-colors h-[52px]">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                              <Pill size={13} className="text-rose-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{med.name}</p>
                              {med.generic_name && <p className="text-xs text-slate-500">{med.generic_name}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-slate-700">{med.dosage}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{getFrequencyText(med.frequency)}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {med.start_date ? new Date(med.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '--'}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">{med.route || 'Oral'}</td>
                        <td className="py-3 px-4">
                          <button onClick={() => explainMedication(med.name)} disabled={loadingAI}
                            className="p-1.5 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50" data-tip="Explain with AI">
                            <Brain size={14} className="text-purple-600" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {activeMeds.length === 0 && (
                  <div className="py-10 text-center">
                    <Pill className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-slate-500 text-sm font-medium">No active medications</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Inactive / History */}
            {inactiveMeds.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b-2 border-slate-200">
                  <h2 className="text-base font-bold text-slate-900">Medication History</h2>
                  <p className="text-slate-500 text-sm">Discontinued medications</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b-2 border-slate-200">
                        {['Medication','Dosage','Frequency','Start Date','End Date','Reason'].map(h => (
                          <th key={h} className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inactiveMeds.map((med) => (
                        <tr key={med.id} className="hover:bg-slate-50 transition-colors opacity-70 h-[52px]">
                          <td className="py-3 px-4 text-sm font-semibold text-slate-700">{med.name}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{med.dosage}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{getFrequencyText(med.frequency)}</td>
                          <td className="py-3 px-4 text-sm text-slate-500">
                            {med.start_date ? new Date(med.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '--'}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500">
                            {med.end_date ? new Date(med.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '--'}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-400">{med.discontinue_reason || 'Not specified'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </>
        )}

        {showAI && aiData && (
          <FocusedAIExplanation data={aiData} onClose={() => { setShowAI(false); setAiData(null); }} />
        )}
      </div>
    </PageTransition>
  );
}
