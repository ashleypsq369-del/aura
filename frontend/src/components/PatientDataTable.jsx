/**
 * PatientDataTable.jsx - Enterprise patient list using TanStack Table
 * ====================================================================
 * - Multi-column sorting (click header to sort)
 * - Column-level search/filtering
 * - Pagination (10/25/50 per page)
 * - Keyboard accessible rows (Enter/Space to open)
 * - Screen reader: announces row count, sort state
 * - Zero layout shift - virtualisable via react-window if >200 rows
 *
 * Usage:
 * <PatientDataTable patients={patients} onViewPatient={(id) => navigate(`/patients/${id}`)} />
 */

import { useState, useMemo } from 'react';
import {
 useReactTable,
 getCoreRowModel,
 getSortedRowModel,
 getFilteredRowModel,
 getPaginationRowModel,
 flexRender,
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Building2, Heart, Home, Stethoscope, BedDouble } from 'lucide-react';
import Progress from './ui/Progress';
import useAppStore from '../store/useAppStore';
import ReminderBell from './ReminderBell';

// -- Care setting mini badge -----------------------------------------------
const SETTING_CFG = {
 hospital_based: { label: 'Hospital', icon: Building2, color: '#1d4ed8', bg: '#eff6ff' },
 hospice: { label: 'Hospice', icon: Heart, color: '#be123c', bg: '#fff1f2' },
 home_based: { label: 'Home Care', icon: Home, color: '#15803d', bg: '#f0fdf4' },
 outpatient_clinic: { label: 'Clinic', icon: Stethoscope, color: '#0d9488', bg: '#f0fdfa' },
 long_term_residential: { label: 'Residential', icon: BedDouble, color: '#7c3aed', bg: '#f5f3ff' },
};

function CareSettingBadge({ setting }) {
 const cfg = SETTING_CFG[setting];
 if (!cfg) return <span className="text-[11px] text-slate-400"> - </span>;
 const Icon = cfg.icon;
 return (
 <span className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full"
 style={{ backgroundColor: cfg.bg, color: cfg.color }}>
 <Icon size={9}/>{cfg.label}
 </span>
 );
}

// -- Risk level badge ------------------------------------------------------
function RiskBadge({ level }) {
 const cls = {
 Crisis: 'badge-critical',
 High: 'badge-high',
 Medium: 'badge-moderate',
 Moderate: 'badge-moderate',
 Low: 'badge-low',
 };
 return (
 <span className={cls[level] || 'badge-info'}>
 {level || 'Unknown'}
 </span>
 );
}

// -- Sort icon -------------------------------------------------------------
function SortIcon({ column }) {
 if (!column.getCanSort()) return null;
 const sorted = column.getIsSorted();
 if (sorted === 'asc') return <ChevronUp size={13} className="text-teal-600" />;
 if (sorted === 'desc') return <ChevronDown size={13} className="text-teal-600" />;
 return <ChevronsUpDown size={13} className="text-slate-400" />;
}

// -- Column definitions ----------------------------------------------------
const columns = [
 {
 accessorKey: 'full_name',
 header: 'Patient',
 cell: ({ row }) => {
 const colors = ['linear-gradient(135deg,#0d9488,#0891b2)','linear-gradient(135deg,#7c3aed,#4338ca)','linear-gradient(135deg,#db2777,#e11d48)','linear-gradient(135deg,#d97706,#ea580c)','linear-gradient(135deg,#1d4ed8,#0891b2)','linear-gradient(135deg,#059669,#0d9488)'];
 const idx = (row.original.id || 0) % colors.length;
 return (
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
 style={{ background: colors[idx] }}>
 {row.original.full_name?.split(' ').map(n => n[0]).slice(0, 2).join('')}
 </div>
 <div className="min-w-0">
 <p className="text-sm font-semibold text-[var(--text-900)] truncate">{row.original.full_name}</p>
 <p className="text-xs text-[var(--text-500)] dark:text-slate-400">{row.original.patient_code}</p>
 </div>
 </div>
 );
 },
 },
 {
 accessorFn: (row) => row.age ?? '',
 id: 'age',
 header: 'Age',
 cell: ({ getValue }) => <span className="text-sm font-medium text-[var(--text-800)]">{getValue()}</span>,
 },
 {
 accessorKey: 'primary_diagnosis',
 header: 'Diagnosis',
 cell: ({ getValue }) => (
 <span className="text-sm text-[var(--text-700)] max-w-[180px] truncate block">{getValue() || ' - '}</span>
 ),
 },
 {
 accessorKey: 'risk_level',
 header: 'Risk',
 cell: ({ getValue }) => <RiskBadge level={getValue()} />,
 sortingFn: (a, b) => {
 const order = { Crisis: 0, High: 1, Medium: 2, Moderate: 2, Low: 3 };
 return (order[a.original.risk_level] ?? 4) - (order[b.original.risk_level] ?? 4);
 },
 },
 {
 accessorKey: 'risk_score',
 header: 'Risk Score',
 cell: ({ getValue }) => {
 const score = getValue();
 if (score == null) return <span className="text-[var(--text-400)] dark:text-[var(--text-500)] text-xs font-medium">N/A</span>;
 const pct = Math.round(score * 100);
 const color = score >= 0.75 ? '#e11d48' : score >= 0.5 ? '#f97316' : '#0d9488';
 return (
 <div className="flex items-center gap-2 min-w-[80px]">
 <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
 <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
 </div>
 <span className="text-xs font-black tabular-nums w-8 text-right" style={{ color }}>{pct}%</span>
 </div>
 );
 },
 },
 {
 accessorKey: 'status',
 header: 'Status',
 cell: ({ getValue }) => {
 const v = getValue();
 const cls = { active: 'badge-low', inactive: 'badge-info', deceased: 'badge-stable' };
 return <span className={cls[v] || cls.active}>{v || 'active'}</span>;
 },
 },
 {
 accessorKey: 'care_setting',
 header: 'Care Setting',
 cell: ({ getValue }) => <CareSettingBadge setting={getValue()} />,
 },
 {
 id: 'reminder',
 header: '',
 enableSorting: false,
 cell: ({ row }) => (
 <div onClick={e => e.stopPropagation()}>
 <ReminderBell
 label={`Review ${row.original.full_name}`}
 type="patient"
 size="xs"
 />
 </div>
 ),
 size: 36,
 },
];

// -- Main component --------------------------------------------------------
export default function PatientDataTable({ patients = [], onViewPatient, loading = false }) {
 const [sorting, setSorting] = useState([{ id: 'risk_level', desc: false }]);
 const [globalFilter, setGlobalFilter] = useState('');

 // Read virtualizedLists setting - when OFF, show all rows per page (no pagination limit)
 // When ON, use 25 per page for performance with large lists
 let featureSettings = { virtualizedLists: true };
 try {
 const saved = localStorage.getItem('feature_settings');
 if (saved) featureSettings = { ...featureSettings, ...JSON.parse(saved) };
 } catch { /* use default */ }

 const defaultPageSize = featureSettings.virtualizedLists ? 25 : Math.max(patients.length, 25);
 const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: defaultPageSize });

 // Write active patient to Zustand when row is opened
 const setActivePatient = useAppStore(s => s.setActivePatient);

 const handleViewPatient = (patient) => {
 setActivePatient({
 id: patient.id,
 full_name: patient.full_name,
 patient_code: patient.patient_code,
 risk_level: patient.risk_level,
 });
 onViewPatient?.(patient.id);
 };

 const data = useMemo(() => patients, [patients]);

 const table = useReactTable({
 data,
 columns,
 state: { sorting, globalFilter, pagination },
 onSortingChange: setSorting,
 onGlobalFilterChange: setGlobalFilter,
 onPaginationChange: setPagination,
 getCoreRowModel: getCoreRowModel(),
 getSortedRowModel: getSortedRowModel(),
 getFilteredRowModel: getFilteredRowModel(),
 getPaginationRowModel: getPaginationRowModel(),
 });

 const { rows } = table.getRowModel();
 const totalFiltered = table.getFilteredRowModel().rows.length;

 return (
 <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] shadow-sm overflow-hidden">
 {/* Toolbar - table-level filter for quick in-grid search */}
 <div className="px-4 py-2.5 border-b border-[var(--card-border)] flex items-center justify-between gap-3 bg-[var(--card-bg)]">
 <p className="text-xs text-[var(--text-500)] dark:text-[var(--text-400)] font-medium" aria-live="polite" aria-atomic="true">
 {loading ? 'Loading...' : `${totalFiltered} patient${totalFiltered !== 1 ? 's' : ''}`}
 </p>
 {/* Hide the secondary search on small screens - the page-level search handles it */}
 <input
 type="search"
 value={globalFilter}
 onChange={e => setGlobalFilter(e.target.value)}
 placeholder="Search patients..."
 aria-label="Search patients by name, diagnosis or code"
 className="hidden sm:block px-3 py-1.5 text-sm border border-slate-300 dark:placeholder-slate-400 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 w-44"
 />
 </div>

 {/* Table */}
 <div className="overflow-x-auto">
 <table className="w-full text-sm" role="grid" aria-label="Patient list">
 <thead className="bg-slate-100 border-b-2 border-[var(--card-border)]">
 {table.getHeaderGroups().map(hg => (
 <tr key={hg.id}>
 {hg.headers.map(header => (
 <th
 key={header.id}
 scope="col"
 onClick={header.column.getToggleSortingHandler()}
 aria-sort={
 header.column.getIsSorted() === 'asc' ? 'ascending' :
 header.column.getIsSorted() === 'desc' ? 'descending' : 'none'
 }
 className={`px-4 py-3 text-left text-xs font-bold text-[var(--text-700)] whitespace-nowrap ${
 header.column.getCanSort() ? 'cursor-pointer hover:text-teal-300 select-none' : ''
 }`}
 >
 <span className="flex items-center gap-1">
 {flexRender(header.column.columnDef.header, header.getContext())}
 <SortIcon column={header.column} />
 </span>
 </th>
 ))}
 <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-[var(--text-700)] ">
 Action
 </th>
 </tr>
 ))}
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
 {loading ? (
 [...Array(5)].map((_, i) => (
 <tr key={i} className="bg-[var(--card-bg)]">
 {columns.map((_, j) => (
 <td key={j} className="px-4 py-3">
 <div className="h-4 bg-slate-200 rounded skeleton" />
 </td>
 ))}
 <td className="px-4 py-3"><div className="h-4 w-16 bg-slate-200 rounded skeleton ml-auto" /></td>
 </tr>
 ))
 ) : rows.length === 0 ? (
 <tr>
 <td colSpan={columns.length + 1} className="py-12 text-center text-[var(--text-500)] dark:text-[var(--text-400)] text-sm">
 No patients match your search.
 </td>
 </tr>
 ) : (
 rows.map((row, i) => (
 <motion.tr
 key={row.id}
 initial={{ opacity: 0, x: -8 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: i * 0.02 }}
 className="bg-[var(--card-bg)] hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group border-l-2 border-l-transparent hover:border-l-teal-500"
 onClick={() => handleViewPatient(row.original)}
 onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleViewPatient(row.original)}
 tabIndex={0}
 role="row"
 aria-label={`Patient ${row.original.full_name}, ${row.original.risk_level} risk`}
 >
 {row.getVisibleCells().map(cell => (
 <td key={cell.id} className="px-4 py-3">
 {flexRender(cell.column.columnDef.cell, cell.getContext())}
 </td>
 ))}
 <td className="px-4 py-3 text-right">
 <button
 onClick={e => { e.stopPropagation(); handleViewPatient(row.original); }}
 data-tip="Open patient record"
 className="px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 rounded-lg hover:bg-teal-600 hover:text-white hover:border-teal-600 dark:hover:bg-teal-600 dark:hover:text-white transition-colors"
 >
 View
 </button>
 </td>
 </motion.tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 <div className="px-5 py-3 border-t border-[var(--card-border)] flex items-center justify-between gap-3 flex-wrap bg-[var(--card-bg)]">
 <div className="flex items-center gap-2 text-xs text-[var(--text-600)]">
 <span>Rows per page:</span>
 <select
 value={pagination.pageSize}
 onChange={e => table.setPageSize(Number(e.target.value))}
 className="border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-teal-500"
 aria-label="Rows per page"
 >
 {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
 </select>
 </div>
 <div className="flex items-center gap-1 text-xs text-[var(--text-600)]">
 <span>
 {pagination.pageIndex * pagination.pageSize + 1}-
 {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalFiltered)} of {totalFiltered}
 </span>
 </div>
 <div className="flex items-center gap-1">
 <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
 aria-label="Previous page"
 className="p-1.5 rounded-lg text-[var(--text-600)] hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
 <ChevronLeft size={16} />
 </button>
 <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
 aria-label="Next page"
 className="p-1.5 rounded-lg text-[var(--text-600)] hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
 <ChevronRight size={16} />
 </button>
 </div>
 </div>
 </div>
 );
}
