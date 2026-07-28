/**
 * MLRiskDetail — full ML risk analysis page
 * Route: /patients/:patientId/ml-risk
 * Shows all SHAP breakdowns, task cards, deterioration, drug interactions
 */
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain } from 'lucide-react';
import MLRiskPanel from '../components/MLRiskPanel';
import AdvancedMLPanel from '../components/AdvancedMLPanel';
import PageHeader from '../components/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { patientsAPI } from '../api/client';

export default function MLRiskDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsAPI.getById(parseInt(patientId)).then(r => r.data),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen space-y-5 pb-10"
    >
      <PageHeader
        image="/resources/african/african-health-tech.jpg"
        title="ML Risk Analysis"
        subtitle={patient ? `${patient.full_name} · ${patient.primary_diagnosis || '—'}` : 'Loading...'}
        icon={Brain}
      >
        <button
          onClick={() => navigate(`/patients/${patientId}`)}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl border border-white/30 text-sm font-semibold transition-all"
        >
          <ArrowLeft size={14}/> Back to Patient
        </button>
      </PageHeader>

      <div className="px-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">
        {/* Left: Full ML risk panel with all task SHAP cards */}
        <div>
          <MLRiskPanel patientId={patientId} />
        </div>

        {/* Right: Advanced ML — deterioration, prognosis, drug interactions */}
        <div className="lg:sticky lg:top-4">
          <AdvancedMLPanel patientId={patientId} />
        </div>
      </div>
    </motion.div>
  );
}
