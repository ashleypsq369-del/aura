/**
 * FeatureRequestPanel
 * ====================
 * Component shown in Settings for patients/family/caregivers.
 * Lists features that are currently hidden for their care setting
 * and lets them request access, showing pending/approved/denied status.
 *
 * Usage: <FeatureRequestPanel />
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Unlock, Clock, CheckCircle, XCircle,
  Send, ChevronDown, ChevronUp, AlertCircle, Loader2,
} from 'lucide-react';
import axios from 'axios';
import { useCareSettingContext } from '../context/CareSettingContext';
import { API_URL } from '../api/client';
import toast from '../utils/toast';

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

const ALL_REQUESTABLE = {
  '/memory-vault':        'Memory Vault',
  '/legacy-setup':        'Digital Legacy Setup',
  '/legacy-content':      'Legacy Content Creator',
  '/heir-management':     'Heir Management',
  '/journal':             'Personal Journal',
  '/community':           'Community Hub',
  '/bereavement-support': 'Bereavement Support',
  '/pre-clinic':          'Pre-Clinic Checklist',
  '/appointments':        'Appointments',
};

const STATUS_CFG = {
  pending:  { label: 'Pending review',  cls: 'bg-amber-100 text-amber-700',   icon: Clock },
  approved: { label: 'Approved',        cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  denied:   { label: 'Denied',          cls: 'bg-red-100 text-red-700',        icon: XCircle },
};

export default function FeatureRequestPanel() {
  const { isHidden, isLocked, userOverrides } = useCareSettingContext();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [requesting, setRequesting] = useState(null); // feature path
  const [reason, setReason] = useState('');

  // Only show features that are currently hidden (and not locked)
  const hiddenFeatures = Object.entries(ALL_REQUESTABLE).filter(
    ([path]) => isHidden(path)
  );

  const { data: myRequests } = useQuery({
    queryKey: ['my-feature-requests'],
    queryFn: () => axios.get(`${API_URL}/api/features/my-requests`, { headers: authH() }).then(r => r.data),
    staleTime: 30000,
  });

  const requestMutation = useMutation({
    mutationFn: ({ feature_path, reason }) =>
      axios.post(`${API_URL}/api/features/request`, { feature_path, reason }, { headers: authH() }),
    onSuccess: () => {
      toast.success('Request submitted — an admin will review it shortly');
      queryClient.invalidateQueries({ queryKey: ['my-feature-requests'] });
      setRequesting(null);
      setReason('');
    },
    onError: e => toast.error(e.response?.data?.detail || 'Failed to submit request'),
  });

  const existingRequest = (path) =>
    (myRequests?.requests || []).find(r => r.feature_path === path);

  if (hiddenFeatures.length === 0) return null;

  return (
    <div className="bg-[#e8fafa] dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Lock size={16} className="text-amber-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
              Request Feature Access
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {hiddenFeatures.length} feature{hiddenFeatures.length !== 1 ? 's' : ''} hidden for your care setting
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-100 dark:border-slate-700 overflow-hidden"
          >
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                These features are not included in your current care setting. If you believe you need access, you can request it below. An admin will review your request.
              </p>

              {hiddenFeatures.map(([path, name]) => {
                const locked = isLocked(path);
                const req = existingRequest(path);
                const sc = req ? STATUS_CFG[req.status] : null;
                const StatusIcon = sc?.icon;

                return (
                  <div key={path} className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {locked
                          ? <Lock size={15} className="text-red-400 flex-shrink-0" />
                          : <Unlock size={15} className="text-amber-500 flex-shrink-0" />
                        }
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{name}</p>
                          {locked && (
                            <p className="text-xs text-red-500 mt-0.5">This feature has been locked by your care administrator.</p>
                          )}
                          {req && (
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 font-medium ${sc.cls}`}>
                              <StatusIcon size={10} />{sc.label}
                            </span>
                          )}
                          {req?.admin_note && (
                            <p className="text-xs text-slate-400 mt-1 italic">Note: {req.admin_note}</p>
                          )}
                        </div>
                      </div>

                      {!locked && !req && (
                        <button
                          onClick={() => setRequesting(requesting === path ? null : path)}
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition"
                        >
                          <Send size={12} /> Request Access
                        </button>
                      )}
                    </div>

                    {/* Inline reason form */}
                    <AnimatePresence>
                      {requesting === path && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-2">
                            <textarea
                              value={reason}
                              onChange={e => setReason(e.target.value)}
                              rows={2}
                              placeholder="Why do you need access to this feature? (e.g. My doctor recommended I use the Memory Vault)"
                              className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500 bg-[#e8fafa] dark:bg-slate-800 dark:text-slate-100 resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setRequesting(null); setReason(''); }}
                                className="flex-1 py-2 border border-slate-300 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                              >
                                Cancel
                              </button>
                              <button
                                disabled={!reason.trim() || requestMutation.isPending}
                                onClick={() => requestMutation.mutate({ feature_path: path, reason })}
                                className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                              >
                                {requestMutation.isPending
                                  ? <Loader2 size={12} className="animate-spin" />
                                  : <Send size={12} />}
                                Submit Request
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
