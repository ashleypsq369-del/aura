import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw, Activity, Plus, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { PageSkeleton } from '../components/LoadingSkeleton';
import toast from '../utils/toast';

/**
 * HIPAA Compliance Dashboard
 * Gap Analysis Priority 2: HIPAA Compliance
 * 
 * Shows 18-item compliance checklist and overall status
 */
export default function HIPAACompliance() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showBreachForm, setShowBreachForm] = useState(false);
  const [breachForm, setBreachForm] = useState({
    incident_type: 'unauthorized_access',
    description: '',
    affected_records: '',
    reported_by: '',
    severity: 'medium',
  });
  const queryClient = useQueryClient();

  // Fetch compliance status
  const { data: compliance, isLoading, error, refetch } = useQuery({
    queryKey: ['hipaa-compliance'],
    queryFn: async () => {
      const response = await apiClient.get('/api/hipaa/compliance/status');
      return response.data;
    }
  });

  // Fetch breach incidents stats
  const { data: breachStats } = useQuery({
    queryKey: ['breach-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/hipaa/breach-incidents/stats');
      return response.data;
    }
  });

  // Create breach incident mutation
  const createBreachMutation = useMutation({
    mutationFn: (data) => apiClient.post('/api/hipaa/breach-incidents', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['breach-stats']);
      toast.success('Breach incident logged successfully');
      setShowBreachForm(false);
      setBreachForm({ incident_type: 'unauthorized_access', description: '', affected_records: '', reported_by: '', severity: 'medium' });
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to log incident'),
  });

  if (isLoading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="bg-white rounded-lg p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Admin access required to view HIPAA compliance dashboard</p>
        </div>
      </div>
    );
  }

  const complianceScore = compliance?.compliance_score || 0;
  const scoreColor = 
    complianceScore >= 80 ? 'green' :
    complianceScore >= 60 ? 'amber' :
    'red';

  // Group items by category
  const categories = ['all', ...new Set(compliance?.items?.map(item => item.category) || [])];
  
  const filteredItems = selectedCategory === 'all' 
    ? compliance?.items || []
    : compliance?.items?.filter(item => item.category === selectedCategory) || [];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'partial':
        return <Activity className="w-6 h-6 text-amber-600" />;
      case 'not_implemented':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'implemented':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'partial':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'not_implemented':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-6">
{/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 shadow-xl border-3 border-blue-400"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Shield className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">HIPAA Compliance Dashboard</h1>
              <p className="text-blue-100">Health Insurance Portability and Accountability Act</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition flex items-center space-x-2"
          >
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Compliance Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`bg-gradient-to-br from-white to-${scoreColor}-50 rounded-xl p-8 shadow-lg border-3 border-${scoreColor}-300`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Overall Compliance Score</h2>
            <p className="text-gray-600 mb-4">Based on 18 HIPAA Security Rule specifications</p>
            <div className="flex items-center space-x-4">
              <div className={`text-6xl font-bold text-${scoreColor}-600`}>
                {complianceScore.toFixed(1)}%
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{compliance?.implemented || 0} Implemented</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{compliance?.partial || 0} Partial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{compliance?.not_implemented || 0} Not Implemented</span>
                </div>
              </div>
            </div>
          </div>

          {/* Circular Progress */}
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - complianceScore / 100)}`}
                className={`text-${scoreColor}-600`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className={`text-4xl font-bold text-${scoreColor}-600`}>{complianceScore.toFixed(0)}%</p>
                <p className="text-sm text-gray-600">Compliant</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>


      {/* Breach Incidents  --  moved to Log Incident section below */}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
            }`}
          >
            {category === 'all' ? 'All Categories' : category}
          </button>
        ))}
      </div>

      {/* Compliance Checklist */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-lg border-2 border-gray-200"
      >
        <div className="px-6 py-4 border-b-2 border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Compliance Checklist</h2>
          <p className="text-sm text-gray-600">18 HIPAA Security Rule specifications</p>
        </div>

        <div className="divide-y-2 divide-gray-200">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-6 hover:bg-gray-50 transition"
            >
              <div className="flex items-start space-x-4">
                {/* Status Icon */}
                <div className="mt-1">
                  {getStatusIcon(item.status)}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{item.requirement}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 uppercase ${getStatusBadge(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold">Category:</span> {item.category}
                  </p>
                  <p className="text-sm text-gray-700">{item.notes}</p>
                </div>

                {/* ID Badge */}
                <div className="text-gray-400 font-mono text-sm">
                  #{item.id}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Breach Incident Log Button + Form */}
      <div className="bg-white rounded-xl border-2 border-red-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100 flex items-center justify-between"
          >
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-red-600" />
            <h2 className="text-base font-bold text-slate-800">Breach Incident Reporting</h2>
          </div>
          <button
            onClick={() => setShowBreachForm(s => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {showBreachForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Log Incident</>}
          </button>
        </div>

        {showBreachForm && (
          <div className="p-6 space-y-4 border-b border-red-100 bg-red-50">
            <p className="text-sm text-red-700 font-semibold">
              Log a new HIPAA breach or security incident. All incidents are recorded with a timestamp and reported to the compliance log.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Incident Type</label>
                <select value={breachForm.incident_type} onChange={e => setBreachForm(f => ({ ...f, incident_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500">
                  <option value="unauthorized_access">Unauthorized Access</option>
                  <option value="data_theft">Data Theft</option>
                  <option value="accidental_disclosure">Accidental Disclosure</option>
                  <option value="system_breach">System Breach</option>
                  <option value="lost_device">Lost/Stolen Device</option>
                  <option value="insider_threat">Insider Threat</option>
                  <option value="ransomware">Ransomware</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Severity</label>
                <select value={breachForm.severity} onChange={e => setBreachForm(f => ({ ...f, severity: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Affected Records (count)</label>
                <input type="number" min="0" value={breachForm.affected_records}
                  onChange={e => setBreachForm(f => ({ ...f, affected_records: e.target.value }))}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Reported By</label>
                <input type="text" value={breachForm.reported_by}
                  onChange={e => setBreachForm(f => ({ ...f, reported_by: e.target.value }))}
                  placeholder="Your name or department"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Incident Description *</label>
              <textarea rows={4} value={breachForm.description}
                onChange={e => setBreachForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe what happened, how it was discovered, what data was affected, and immediate actions taken..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none" />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => createBreachMutation.mutate(breachForm)}
                disabled={!breachForm.description.trim() || createBreachMutation.isPending}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
              >
                {createBreachMutation.isPending ? 'Logging...' : 'Log Incident'}
              </button>
              <button onClick={() => setShowBreachForm(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {breachStats && (
          <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Incidents', value: breachStats.total_incidents, color: 'text-slate-800' },
              { label: 'Resolved',        value: breachStats.resolved,         color: 'text-green-600' },
              { label: 'Unresolved',      value: breachStats.unresolved,        color: 'text-red-600' },
              { label: 'Last 30 Days',    value: breachStats.recent_30_days,   color: 'text-amber-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Last Updated:</span> {new Date(compliance?.last_updated).toLocaleString()}
        </p>
        <p className="text-sm text-gray-700 mt-1">
          <span className="font-semibold">Next Review:</span> {new Date(compliance?.next_review_date).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
