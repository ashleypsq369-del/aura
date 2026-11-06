/**
 * CaregiverBurdenForm.jsx - Zarit Burden Interview (12 questions)
 * Redesigned: PageHeader + clean question cards
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Save, ChevronLeft, AlertTriangle, Heart } from 'lucide-react';
import apiClient from '../api/client';
import toast from '../utils/toast';
import offlineStorage from '../utils/offlineStorage';
import FormFileUpload from '../components/FormFileUpload';
import PageHeader from '../components/PageHeader';

const QUESTIONS = [
  { key:'q1_more_time',          text:'Do you feel that your relative asks for more help than he/she needs?' },
  { key:'q2_stressed',           text:'Do you feel stressed between caring for your relative and trying to meet other responsibilities?' },
  { key:'q3_angry',              text:'Do you feel angry when you are around your relative?' },
  { key:'q4_affect_relationship',text:'Do you feel that your relative currently affects your relationship with others negatively?' },
  { key:'q5_strained',          text:'Do you feel strained when you are around your relative?' },
  { key:'q6_health_suffered',    text:'Do you feel that your health has suffered because of your involvement with your relative?' },
  { key:'q7_lack_privacy',       text:'Do you feel that you don\'t have as much privacy as you would like?' },
  { key:'q8_social_life_suffered',text:'Do you feel that your social life has suffered because you are caring for your relative?' },
  { key:'q9_lost_control',       text:'Do you feel that you have lost control of your life since your relative\'s illness?' },
  { key:'q10_uncertain',         text:'Do you feel uncertain about what to do about your relative?' },
  { key:'q11_do_more',           text:'Do you feel you should be doing more for your relative?' },
  { key:'q12_do_better',         text:'Do you feel you could do a better job in caring for your relative?' },
];

const OPTIONS = [
  { value:0, label:'Never',        color:'bg-green-500'  },
  { value:1, label:'Rarely',       color:'bg-teal-500'   },
  { value:2, label:'Sometimes',    color:'bg-yellow-500' },
  { value:3, label:'Frequently',   color:'bg-orange-500' },
  { value:4, label:'Nearly Always',color:'bg-red-500'    },
];

function getBurdenLevel(total) {
  if (total <= 10) return { label:'Little or No Burden',    badge:'badge-low',      hex:'#16a34a' };
  if (total <= 20) return { label:'Mild to Moderate Burden',badge:'badge-moderate', hex:'#d97706' };
  return                   { label:'High Burden',            badge:'badge-critical', hex:'#dc2626' };
}

export default function CaregiverBurdenForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [scores, setScores] = useState(Object.fromEntries(QUESTIONS.map(q => [q.key, null])));
  const [caregiverId, setCaregiverId] = useState('');
  const [supportNeeds, setSupportNeeds] = useState({ respite_care:false, support_group:false, counseling:false });
  const [notes, setNotes] = useState('');

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => (await apiClient.get(`/api/patients/${patientId}`)).data,
  });

  const total = Object.values(scores).reduce((s, v) => s + (v ?? 0), 0);
  const answered = Object.values(scores).filter(v => v !== null).length;
  const burden = getBurdenLevel(total);
  const highBurden = total > 20;

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      if (!navigator.onLine) { await offlineStorage.saveOffline('caregiver_burden', data); return { offline: true }; }
      return apiClient.post('/api/assessments/caregiver-burden', data);
    },
    onSuccess: (res) => {
      if (res.offline) toast.success('Saved offline - will sync when online', { duration: 5000 });
      else {
        toast.success('Caregiver burden assessment saved');
        if (res.data.alerts_generated?.length > 0)
          toast.error(`${res.data.alerts_generated.length} alert(s) generated`, { duration: 5000 });
      }
      queryClient.invalidateQueries(['caregiver_burden', patientId]);
      queryClient.invalidateQueries(['assessment-overview', patientId]);
      setTimeout(() => navigate(`/assessments/${patientId}`), 1500);
    },
    onError: () => toast.error('Failed to save assessment'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (answered < QUESTIONS.length) { toast.error('Please answer all 12 questions'); return; }
    submitMutation.mutate({
      patient_id: parseInt(patientId), caregiver_id: caregiverId || null,
      ...scores, total_score: total, burden_level: burden.label,
      support_needs_respite: supportNeeds.respite_care,
      support_needs_group: supportNeeds.support_group,
      support_needs_counseling: supportNeeds.counseling,
      notes,
    });
  };

  return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/african/african-nurse-female.jpg"
        title="Caregiver Burden"
        subtitle={`Zarit Burden Interview${patient?.full_name ? ` · ${patient.full_name}` : ''}`}
        icon={Users}
        stats={[
          { label: 'Score',     value: total,                    color: burden.hex },
          { label: 'Out of',    value: '48',                     color: '#818cf8' },
          { label: 'Answered',  value: `${answered}/12`,         color: '#2dd4bf' },
        ]}
      >
        <button onClick={() => navigate(`/assessments/${patientId}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--page-bg)] hover:bg-[var(--card-border)] text-[var(--text-700)] rounded-lg border border-[var(--card-border)] text-xs font-semibold transition">
          <ChevronLeft size={14} /> Assessments
        </button>
      </PageHeader>

      <div className="max-w-[760px] mx-auto px-4 py-5 space-y-4">
        <div className="flex items-start gap-3 px-4 py-3 bg-violet-50 rounded-xl border border-violet-200">
          <Users size={15} className="text-violet-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-violet-800">
            12 questions about caring for this patient. Select how often each statement applies.
            Score ≤10 = Little burden · 10-20 = Mild to Moderate · &gt;20 = High burden.
          </p>
        </div>

        {/* High burden alert */}
        {highBurden && (
          <motion.div initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
            className="flex items-start gap-3 px-4 py-3 bg-red-50 rounded-xl border border-red-200">
            <AlertTriangle size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-900">High Caregiver Burden Detected</p>
              <p className="text-xs text-red-800 mt-0.5">
                Score {total}/48. Consider immediate referral to social work, respite care, or counselling services.
              </p>
            </div>
          </motion.div>
        )}

        {/* Caregiver ID */}
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
          <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">
            Caregiver Name / ID <span className="font-normal text-[var(--text-400)]">(optional)</span>
          </label>
          <input type="text" value={caregiverId} onChange={e => setCaregiverId(e.target.value)}
            placeholder="e.g. Jane Smith - Spouse"
            className="w-full px-3 py-2 text-sm border border-[var(--card-border)] rounded-lg bg-[var(--page-bg)] text-[var(--text-800)] focus:border-violet-500 focus:outline-none" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          {QUESTIONS.map((q, idx) => (
            <motion.div key={q.key} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden">
              <div className="flex items-start gap-3 px-4 py-3">
                <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-xs text-[var(--text-800)] flex-1 leading-relaxed">{q.text}</p>
                {scores[q.key] !== null && (
                  <span className="text-xs font-bold text-violet-600 flex-shrink-0">{scores[q.key]}</span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-px px-3 pb-3">
                {OPTIONS.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setScores(p => ({ ...p, [q.key]: opt.value }))}
                    className={`py-2 rounded-lg text-[10px] font-semibold transition-all border ${
                      scores[q.key] === opt.value
                        ? `${opt.color} text-white border-transparent`
                        : 'bg-[var(--page-bg)] text-[var(--text-600)] border-[var(--card-border)] hover:border-violet-300'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Support needs */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <p className="text-sm font-bold text-[var(--text-800)] mb-3 flex items-center gap-2">
              <Heart size={14} className="text-violet-500" /> Support Needs Identified
            </p>
            <div className="space-y-2">
              {[
                { key:'respite_care',  label:'Respite care' },
                { key:'support_group', label:'Support group' },
                { key:'counseling',    label:'Counselling / mental health' },
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={supportNeeds[opt.key]}
                    onChange={e => setSupportNeeds(p => ({ ...p, [opt.key]: e.target.checked }))}
                    className="w-4 h-4 rounded accent-violet-600" />
                  <span className="text-sm text-[var(--text-700)]">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <label className="block text-sm font-semibold text-[var(--text-700)] mb-2">
              Clinical Notes <span className="font-normal text-[var(--text-400)]">(optional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Additional observations about caregiver's wellbeing…"
              className="w-full px-3 py-2 text-sm border border-[var(--card-border)] rounded-lg bg-[var(--page-bg)] text-[var(--text-800)] focus:border-violet-500 focus:outline-none resize-none" />
          </div>

          <FormFileUpload category="documents" label="Supporting Documentation"
            description="Attach clinical notes or referral forms"
            accept=".pdf,.doc,.docx" multiple maxSizeMB={50} />

          <div className="flex gap-3">
            <button type="submit" disabled={submitMutation.isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50">
              <Save size={15} />
              {submitMutation.isLoading ? 'Saving…' : 'Save Assessment'}
            </button>
            <button type="button" onClick={() => navigate(`/assessments/${patientId}`)}
              className="px-5 py-3 bg-[var(--page-bg)] hover:bg-[var(--card-border)] text-[var(--text-700)] rounded-xl text-sm font-semibold border border-[var(--card-border)] transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
