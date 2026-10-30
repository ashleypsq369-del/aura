import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield, Search, Activity, User, Eye, Edit2, Trash2, LogIn, LogOut } from 'lucide-react';
import axios from 'axios';

import { API_URL } from '../api/client';

const ACTION_CONFIG = {
 CREATE: { cls: 'badge-low', Icon: Activity, label: 'Create' },
 UPDATE: { cls: 'badge-stable', Icon: Edit2, label: 'Update' },
 DELETE: { cls: 'badge-critical', Icon: Trash2, label: 'Delete' },
 LOGIN: { cls: 'badge-moderate', Icon: LogIn, label: 'Login' },
 LOGOUT: { cls: 'chip-slate', Icon: LogOut, label: 'Logout' },
 VIEW: { cls: 'badge-info', Icon: Eye, label: 'View' },
 ACCESS: { cls: 'badge-info', Icon: Shield, label: 'Access' },
};

function getActionCfg(action) {
 const key = Object.keys(ACTION_CONFIG).find(k => action?.toUpperCase().includes(k));
 return ACTION_CONFIG[key] || { cls: 'badge-info', Icon: Activity, label: action };
}

export default function AuditLog() {
 const [search, setSearch] = useState('');
 const [actionFilter, setActionFilter] = useState('all');
 const token = localStorage.getItem('auth_token');
 const headers = { Authorization: `Bearer ${token}` };

 const { data: logsData, isLoading } = useQuery({
 queryKey: ['audit-logs', actionFilter],
 queryFn: async () => {
 const params = new URLSearchParams({ limit: 200 });
 if (actionFilter !== 'all') params.append('action', actionFilter);
 const r = await axios.get(`${API_URL}/api/admin/audit-log?${params}`, { headers });
 return r.data;
 },
 retry: 1,
 });

 const logs = Array.isArray(logsData) ? logsData
 : Array.isArray(logsData?.logs) ? logsData.logs : [];

 const filtered = useMemo(() => {
 if (!search) return logs;
 const q = search.toLowerCase();
 return logs.filter(l =>
 l.user_name?.toLowerCase().includes(q) ||
 l.action?.toLowerCase().includes(q) ||
 l.resource?.toLowerCase().includes(q) ||
 l.details?.toLowerCase().includes(q)
 );
 }, [logs, search]);

 return (
 <div className="min-h-screen">
 <div className="max-w-[1400px] mx-auto px-6 py-6">
 {/* Header */}
 <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl"
 style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
 <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
 <Shield size={18} className="text-white" />
 </div>
 <div>
 <h1 className="text-base font-bold text-white">Audit Log</h1>
 <p className="text-xs text-white/70">Complete system activity trail - HIPAA compliance record</p>
 </div>
 </div>

 {/* Filters */}
 <div className="bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] p-3 mb-4">
 <div className="flex gap-3 flex-wrap">
 <div className="flex-1 min-w-[200px] search-wrap">
 <span className="search-icon"><Search size={15} /></span>
 <input type="text" placeholder="Search by user, action or resource..."
 value={search} onChange={e => setSearch(e.target.value)}
 className="w-full pr-4 py-2 border border-[var(--card-border)] rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none" />
 </div>
 <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
 className="px-3 py-2 border border-[var(--card-border)] rounded-lg text-sm focus:border-teal-500 outline-none">
 <option value="all">All Actions</option>
 {Object.entries(ACTION_CONFIG).map(([key, { label }]) => (
 <option key={key} value={key}>{label}</option>
 ))}
 </select>
 </div>
 <p className="text-xs text-[var(--text-400)] mt-2">{filtered.length} of {logs.length} entries</p>
 </div>

 {/* Table */}
 <div className="bg-[var(--card-bg)] rounded-xl shadow-sm border border-[var(--card-border)] overflow-hidden">
 <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b-2 border-slate-200">
 <h2 className="text-base font-bold text-slate-900">Activity Log</h2>
 <p className="text-[var(--text-500)] text-sm">Complete audit trail of system actions</p>
 </div>

 {isLoading ? (
 <div className="p-10 text-center">
 <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
 <p className="text-sm text-slate-500">Loading audit records...</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="bg-slate-100 border-b-2 border-[var(--card-border)] dark:border-slate-700">
 {['Timestamp','User','Action','Resource','IP Address','Details'].map(h => (
 <th key={h} className="text-left py-3 px-4 text-xs font-bold text-[var(--text-700)] uppercase tracking-wide">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
 {filtered.map((log, i) => {
 const cfg = getActionCfg(log.action_type || log.action);
 const CfgIcon = cfg.Icon;
 return (
 <motion.tr key={log.id || i}
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.005 }}
 className="hover:bg-[var(--card-bg)] transition-colors h-[48px]">
 <td className="py-2.5 px-4 text-xs font-medium text-[var(--text-700)] whitespace-nowrap">
 {log.timestamp || log.created_at
 ? new Date(log.timestamp || log.created_at).toLocaleString('en-GB', {
 day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
 })
 : '--'}
 </td>
 <td className="py-2.5 px-4">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
 <User size={11} className="text-teal-700" />
 </div>
 <div>
 <p className="text-xs font-semibold text-slate-800">{log.user_name || log.username || 'System'}</p>
 <p className="text-[10px] text-[var(--text-400)] capitalize">{log.user_role || ''}</p>
 </div>
 </div>
 </td>
 <td className="py-2.5 px-4">
 <span className={`${cfg.cls} flex items-center gap-1 w-fit`}>
 <CfgIcon size={10} />
 {log.action_type || log.action || cfg.label}
 </span>
 </td>
 <td className="py-2.5 px-4 text-xs text-[var(--text-600)] max-w-[140px] truncate">
 {log.resource_type || log.resource || ' - '}
 {log.resource_id ? <span className="text-slate-400"> #{log.resource_id}</span> : null}
 </td>
 <td className="py-2.5 px-4 text-xs text-[var(--text-500)] font-mono">
 {log.ip_address || ' - '}
 </td>
 <td className="py-2.5 px-4 text-xs text-[var(--text-500)] max-w-[200px] truncate">
 {log.details || log.description || ' - '}
 </td>
 </motion.tr>
 );
 })}
 </tbody>
 </table>

 {filtered.length === 0 && (
 <div className="py-16 text-center">
 <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
 <p className="text-[var(--text-500)] font-medium">No audit records found</p>
 <p className="text-sm text-[var(--text-400)] mt-1">
 {search ? 'Try adjusting your search' : 'No activity recorded yet'}
 </p>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
