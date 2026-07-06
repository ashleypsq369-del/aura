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
 *   <PatientDataTable patients={patients} onViewPatient={(id) => navigate(`/patients/${id}`)} />
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
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Progress from './ui/Progress';
import useAppStore from '../store/useAppStore';

// -- Risk level badge ------------------------------------------------------
function RiskBadge({ level }) {
  const cls = {
    Crisis:   'badge-critical',
    High:     'badge-high',
    Medium:   'badge-moderate',
    Moderate: 'badge-moderate',
    Low:      'badge-low',
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
  if (sorted === 'asc')  return <ChevronUp size={13} className="text-teal-600" />;
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
            <p className="text-sm font-semibold text-slate-900 truncate">{row.original.full_name}</p>
            <p className="text-xs text-slate-400">{row.original.patient_code}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorFn: (row) => row.age ?? '',
    id: 'age',
    header: 'Age',
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{getValue()}</span>,
  },
  {
    accessorKey: 'primary_diagnosis',
    header: 'Diagnosis',
    cell: ({ getValue }) => (
      <span className="text-sm text-slate-700 max-w-[180px] truncate block">{getValue() || '-'}</span>
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
      if (score == null) return <span className="text-slate-400 text-xs">N/A</span>;
      return (
        <div className="w-24">
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${Math.round(score * 100)}%`,
                background: score >= 0.75 ? 'linear-gradient(to right,#e11d48,#dc2626)' :
                            score >= 0.5  ? 'linear-gradient(to right,#d97706,#ea580c)' :
                                            'linear-gradient(to right,#059669,#0d9488)',
              }} />
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5 tabular-nums">{Math.round(score * 100)}%</p>
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
];

// -- Main component --------------------------------------------------------
export default function PatientDataTable({ patients = [], onViewPatient, loading = false }) {
  const [sorting, setSorting]           = useState([{ id: 'risk_level', desc: false }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination]     = useState({ pageIndex: 0, pageSize: 25 });

  // Write active patient to Zustand when row is opened
  const setActivePatient = useAppStore(s => s.setActivePatient);

  const handleViewPatient = (patient) => {
    setActivePatient({
      id:           patient.id,
      full_name:    patient.full_name,
      patient_code: patient.patient_code,
      risk_level:   patient.risk_level,
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-slate-500" aria-live="polite" aria-atomic="true">
          {loading ? 'Loading patients...' : `${totalFiltered} patient${totalFiltered !== 1 ? 's' : ''}`}
        </p>
        <input
          type="search"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Search patients..."
          aria-label="Search patients by name, diagnosis or code"
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 w-56"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="grid" aria-label="Patient list">
          <thead className="bg-slate-100 border-b-2 border-slate-300">
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
                    className={`px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide whitespace-nowrap ${
                      header.column.getCanSort() ? 'cursor-pointer hover:text-teal-700 select-none' : ''
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <SortIcon column={header.column} />
                    </span>
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Action
                </th>
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
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
                <td colSpan={columns.length + 1} className="py-12 text-center text-slate-400 text-sm">
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
                  className="hover:bg-teal-50/50 transition-colors cursor-pointer group"
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
                      className="px-3 py-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-colors"
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
      <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap bg-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-500">
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
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span>
            {pagination.pageIndex * pagination.pageSize + 1}-
            {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalFiltered)} of {totalFiltered}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
            className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
            aria-label="Next page"
            className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
