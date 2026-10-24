import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Brain, Save, AlertTriangle } from 'lucide-react';
import apiClient from '../api/client';
import toast from '../utils/toast';
import FormFileUpload from '../components/FormFileUpload';

const PHQ9_QUESTIONS = [
  { key: 'little_interest', text: 'Little interest or pleasure in doing things' },
  { key: 'feeling_down', text: 'Feeling down, depressed, or hopeless' },
  { key: 'sleep_trouble', text: 'Trouble falling or staying asleep, or sleeping too much' },
  { key: 'feeling_tired', text: 'Feeling tired or having little energy' },
  { key: 'appetite_change', text: 'Poor appetite or overeating' },
  { key: 'feeling_bad_about_self', text: 'Feeling bad about yourself - or that you are a failure or have let yourself or your family down' },
  { key: 'trouble_concentrating', text: 'Trouble concentrating on things, such as reading or watching television' },
  { key: 'moving_slowly_or_fidgety', text: 'Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual' },
  { key: 'thoughts_of_harm', text: 'Thoughts that you would be better off dead, or of hurting yourself in some way' }
];

const GAD7_QUESTIONS = [
  { key: 'feeling_nervous', text: 'Feeling nervous, anxious, or on edge' },
  { key: 'not_stop_worrying', text: 'Not being able to stop or control worrying' },
  { key: 'worrying_too_much', text: 'Worrying too much about different things' },
  { key: 'trouble_relaxing', text: 'Trouble relaxing' },
  { key: 'being_restless', text: 'Being so restless that it is hard to sit still' },
  { key: 'easily_annoyed', text: 'Becoming easily annoyed or irritable' },
  { key: 'feeling_afraid', text: 'Feeling afraid, as if something awful might happen' }
];

const FREQUENCY_OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' }
];

export default function MentalHealthForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [phq9Scores, setPhq9Scores] = useState({
    little_interest: 0,
    feeling_down: 0,
    sleep_trouble: 0,
    feeling_tired: 0,
    appetite_change: 0,
    feeling_bad_about_self: 0,
    trouble_concentrating: 0,
    moving_slowly_or_fidgety: 0,
    thoughts_of_harm: 0
  });

  const [gad7Scores, setGad7Scores] = useState({
    feeling_nervous: 0,
    not_stop_worrying: 0,
    worrying_too_much: 0,
    trouble_relaxing: 0,
    being_restless: 0,
    easily_annoyed: 0,
    feeling_afraid: 0
  });

  const [difficulty, setDifficulty] = useState('');
  const [notes, setNotes] = useState('');

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/patients/${patientId}`);
      return response.data;
    }
  });

  const submitPHQ9 = useMutation({
    mutationFn: async (data) => {
      return await apiClient.post('/api/assessments/phq9', data);
    }
  });

  const submitGAD7 = useMutation({
    mutationFn: async (data) => {
      return await apiClient.post('/api/assessments/gad7', data);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Submit both assessments
      const [phq9Response, gad7Response] = await Promise.all([
        submitPHQ9.mutateAsync({
          patient_id: parseInt(patientId),
          ...phq9Scores,
          difficulty_level: difficulty,
          notes
        }),
        submitGAD7.mutateAsync({
          patient_id: parseInt(patientId),
          ...gad7Scores,
          difficulty_level: difficulty,
          notes
        })
      ]);

      toast.success('Mental health assessments saved successfully!');
      
      // Check for crisis
      if (phq9Response.data.crisis_alert) {
        toast.error('CRISIS ALERT - Suicide risk detected. Immediate intervention required.', { duration: 10000 });
      }
      
      const totalAlerts = 
        (phq9Response.data.alerts_generated?.length || 0) + 
        (gad7Response.data.alerts_generated?.length || 0);
      
      if (totalAlerts > 0) {
        toast.error(`?? ${totalAlerts} alert(s) generated`, { duration: 5000 });
      }
      
      queryClient.invalidateQueries(['phq9', patientId]);
      queryClient.invalidateQueries(['gad7', patientId]);
      queryClient.invalidateQueries(['assessment-overview', patientId]);
      
      setTimeout(() => navigate(`/assessments/${patientId}`), 2000);
    } catch (error) {
      toast.error('Failed to save assessments');
      console.error(error);
    }
  };

  const phq9Total = Object.values(phq9Scores).reduce((sum, val) => sum + val, 0);
  const gad7Total = Object.values(gad7Scores).reduce((sum, val) => sum + val, 0);

  const getPHQ9Severity = (total) => {
    if (total <= 4) return { label: 'Minimal', color: 'green' };
    if (total <= 9) return { label: 'Mild', color: 'blue' };
    if (total <= 14) return { label: 'Moderate', color: 'yellow' };
    if (total <= 19) return { label: 'Moderately Severe', color: 'orange' };
    return { label: 'Severe', color: 'red' };
  };

  const getGAD7Severity = (total) => {
    if (total <= 4) return { label: 'Minimal', color: 'green' };
    if (total <= 9) return { label: 'Mild', color: 'blue' };
    if (total <= 14) return { label: 'Moderate', color: 'yellow' };
    return { label: 'Severe', color: 'red' };
  };

  const phq9Severity = getPHQ9Severity(phq9Total);
  const gad7Severity = getGAD7Severity(gad7Total);

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      <button onClick={() => window.history.back()} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700 transition-colors mb-4 group"><span className="group-hover:-translate-x-1 transition-transform">?</span> Back</button>
{/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-white/20">
            <Brain className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Mental Health Screening</h1>
            <p className="text-purple-100 text-lg">
              PHQ-9 (Depression) & GAD-7 (Anxiety)
            </p>
            <p className="text-purple-200 text-sm mt-1">
              Patient: <span className="font-bold">{patient?.full_name}</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200"
      >
        <p className="text-sm text-blue-900">
          <strong>Instructions:</strong> Over the <strong>last 2 weeks</strong>, how often have you been bothered by the following problems? Select the response that best describes your experience.
        </p>
      </motion.div>

      {/* Crisis Warning */}
      {phq9Scores.thoughts_of_harm > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-100 rounded-lg p-4 border-3 border-red-500"
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-900 text-lg">?? CRISIS ALERT</p>
              <p className="text-red-800 mt-1">
                Patient has indicated thoughts of self-harm. <strong>Immediate psychiatric evaluation is required.</strong> Do not leave patient alone. Contact crisis team or emergency services.
              </p>
              <div className="mt-3 flex space-x-3">
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">
                  Emergency: 193
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">
                  Mental Health: 0800-111-011
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* PHQ-9 Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-md border-3 border-purple-300"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-purple-900">PHQ-9: Depression Screening</h2>
              <p className="text-sm text-slate-600">9 questions about mood and interest</p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold text-${phq9Severity.color}-600`}>
                {phq9Total}/27
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold bg-${phq9Severity.color}-100 text-${phq9Severity.color}-800`}>
                {phq9Severity.label}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {PHQ9_QUESTIONS.map((question, idx) => (
              <QuestionItem
                key={question.key}
                question={question.text}
                value={phq9Scores[question.key]}
                onChange={(value) => setPhq9Scores({ ...phq9Scores, [question.key]: value })}
                isHighAlert={question.key === 'thoughts_of_harm' && phq9Scores[question.key] > 0}
                questionNumber={idx + 1}
              />
            ))}
          </div>
        </motion.div>

        {/* GAD-7 Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-md border-3 border-amber-300"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-amber-900">GAD-7: Anxiety Screening</h2>
              <p className="text-sm text-slate-600">7 questions about worry and anxiety</p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold text-${gad7Severity.color}-600`}>
                {gad7Total}/21
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold bg-${gad7Severity.color}-100 text-${gad7Severity.color}-800`}>
                {gad7Severity.label}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {GAD7_QUESTIONS.map((question, idx) => (
              <QuestionItem
                key={question.key}
                question={question.text}
                value={gad7Scores[question.key]}
                onChange={(value) => setGad7Scores({ ...gad7Scores, [question.key]: value })}
                questionNumber={idx + 1}
              />
            ))}
          </div>
        </motion.div>

        {/* Difficulty Level */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <label className="block text-sm font-medium text-slate-700 mb-3">
            If you checked off any problems, how <strong>difficult</strong> have these problems made it for you to do your work, take care of things at home, or get along with other people?
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['not_difficult', 'somewhat', 'very', 'extremely'].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                  difficulty === level
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {level.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200"
        >
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Clinical Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Additional observations or context..."
            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none"
          />
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex space-x-4"
        >
          
          {/* File Attachments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-6"
          >
            <FormFileUpload
              category="documents"
              label="Clinical Documentation"
              description="Attach clinical notes or assessment records"
              accept=".pdf,.doc,.docx"
              multiple={true}
              maxSizeMB={50}
            />
          </motion.div>

          <button
            type="submit"
            disabled={submitPHQ9.isLoading || submitGAD7.isLoading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>
              {submitPHQ9.isLoading || submitGAD7.isLoading ? 'Saving...' : 'Save Both Assessments'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/assessments/${patientId}`)}
            className="px-6 py-4 bg-slate-200 text-slate-900 rounded-xl font-bold hover:bg-slate-300 transition-colors"
          >
            Cancel
          </button>
        </motion.div>
      </form>
    </div>
  );
}

function QuestionItem({ question, value, onChange, isHighAlert, questionNumber }) {
  return (
    <div className={`p-4 rounded-lg border-2 ${isHighAlert ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-start space-x-3 mb-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
          {questionNumber}
        </span>
        <p className="text-sm text-slate-900 flex-1">
          {question}
          {isHighAlert && (
            <span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded font-bold">
              CRISIS QUESTION
            </span>
          )}
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 ml-9">
        {FREQUENCY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              value === option.value
                ? isHighAlert
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

