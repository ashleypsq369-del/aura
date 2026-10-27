import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Brain, AlertCircle, Clock, Target, TrendingUp, CheckCircle, Circle } from 'lucide-react';
import apiClient from '../api/client';

export default function IntelligentRecommendations({ patientId }) {
  // Fetch AI-generated recommendations
  const { data: profile, isLoading } = useQuery({
    queryKey: ['intelligent-profile', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/intelligent-care/profile/${patientId}`);
      return response.data;
    },
    enabled: !!patientId,
    staleTime: 60000, // 1 minute
  });

  // Fetch AI analysis recommendations
  const { data: aiRecommendations } = useQuery({
    queryKey: ['patient-recommendations', patientId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/ai-analysis/patient-recommendations/${patientId}`);
      return response.data;
    },
    enabled: !!patientId,
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="bg-slate-50 rounded-lg p-6 border-2 border-slate-200 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 rounded"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const recommendations = aiRecommendations?.recommendations || [];
  const priority = aiRecommendations?.priority || 'LOW';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-3 border-purple-300 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-lg bg-purple-100 border-2 border-purple-300">
          <Brain className="w-6 h-6 text-purple-600" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">AI-Powered Care Guidance</h3>
          <p className="text-sm text-slate-600">
            Personalized for <span className="font-semibold">{profile.diagnosis}</span>
          </p>
        </div>
      </div>

      {/* Priority Badge */}
      <div className="mb-4">
        <PriorityBadge priority={priority} />
      </div>

      {/* Disease-Specific Context */}
      <div className="bg-slate-50 rounded-lg p-4 border-2 border-purple-200 mb-4">
        <div className="flex items-start space-x-3">
          <Target className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-2">Care Priorities:</p>
            <div className="flex flex-wrap gap-2">
              {profile.care_priorities?.map((priority, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full border border-purple-300"
                >
                  {priority.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {recommendations.length > 0 ? (
          recommendations.map((rec, idx) => (
            <RecommendationItem key={idx} recommendation={rec} index={idx} />
          ))
        ) : (
          <div className="bg-slate-50 rounded-lg p-4 border-2 border-green-200 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-900">All parameters within target range</p>
            <p className="text-xs text-slate-600 mt-1">Continue current care plan</p>
          </div>
        )}
      </div>

      {/* Monitoring Schedule */}
      <div className="mt-4 pt-4 border-t-2 border-purple-200">
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <Clock className="w-4 h-4" />
          <span>
            Monitoring: <span className="font-semibold text-slate-900">{profile.monitoring_schedule}</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function PriorityBadge({ priority }) {
  const config = {
    CRITICAL: { bg: 'bg-red-100',    text: 'text-red-900',    border: 'border-red-300',    dotCls: 'text-red-500',    label: 'CRITICAL' },
    HIGH:     { bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-300', dotCls: 'text-orange-500', label: 'HIGH' },
    MODERATE: { bg: 'bg-yellow-100', text: 'text-yellow-900', border: 'border-yellow-300', dotCls: 'text-yellow-500', label: 'MODERATE' },
    LOW:      { bg: 'bg-green-100',  text: 'text-green-900',  border: 'border-green-300',  dotCls: 'text-green-500',  label: 'STABLE' }
  };

  const style = config[priority] || config.LOW;

  return (
    <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${style.bg} ${style.text} border-2 ${style.border}`}>
      <Circle size={12} className={`${style.dotCls} fill-current flex-shrink-0`} />
      <span className="font-bold text-sm">Priority: {style.label}</span>
    </div>
  );
}

function RecommendationItem({ recommendation, index }) {
  const icon = recommendation.includes('🔴') || recommendation.includes('URGENT') 
    ? <AlertCircle className="w-5 h-5 text-red-600" />
    : recommendation.includes('📈') 
    ? <TrendingUp className="w-5 h-5 text-orange-600" />
    : <Target className="w-5 h-5 text-purple-600" />;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-slate-50 rounded-lg p-4 border-2 border-slate-200 hover:border-purple-300 transition-all"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {icon}
        </div>
        <p className="text-sm text-slate-800 leading-relaxed">
          {recommendation}
        </p>
      </div>
    </motion.div>
  );
}
