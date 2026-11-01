/**
 * DataTable — Admin data table on @tanstack/react-table v8
 *
 * Services design DNA applied:
 *  - Teal gradient table header (matches Services stat strip)
 *  - Shimmer skeleton rows (same pulse as Services card skeleton)
 *  - Teal left-border accent on selected/expanded rows
 *  - Warm hover: teal-tinted row highlight (like ProviderCard tilt)
 *  - Gradient search input focus ring
 *  - Empty state with warm icon treatment
 *  - Spring-cubic pagination buttons
 */
import { useState, Fragment } from 'react';
import {
  flexRender,
  getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getExpandedRowModel,
  getPaginationRowModel, useReactTable,
} from '@tanstack/react-table';
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown,
  X, ChevronLeft, ChevronRight, Inbox,
} from 'lucide-react';

/* ─── Sort indicator ──────────────────────────────────────────────── */
function SortIcon({ sorted }) {
  if (sorted === 'asc')  return <ChevronUp  size={11} style={{ color: 'var(--c-teal)' }} />;
  if (sorted === 'desc') return <ChevronDown size={11} style={{ color: 'var(--c-teal)' }} />;
  return <ChevronsUpDown size={10} style={{ color: 'var(--text-400)', opacity: 0.4 }} />;
}

/* ─── Shimmer skeleton — Services card shimmer style ─────────────── */
const shimmerStyle = {
  background: 'linear-gradient(90deg, var(--card-border) 25%, color-mix(in srgb,var(--card-border) 60%,var(--card-bg)) 50%, var(--card-border) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.6s infinite',
  borderRadius: 6,
  height: 11,
};

function SkeletonRow({ colCount }) {
  const widths = [52, 40, 36, 32, 28, 24, 20];
  return (
    <tr>
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i} style={{ padding: '13px 16px' }}>
          <div style={{ ...shimmerStyle, width: `${widths[i % widths.length]}%` }} />
        </td>
      ))}
    </tr>
  );
}

const PAGE_SIZES = [10, 25, 50, 100];

/* ─── Pill button (pagination) ───────────────────────────────────── */
function PillBtn({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 28, height: 28, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid var(--card-border)',
        background: disabled ? 'transparent' : 'var(--card-bg)',
        color: disabled ? 'var(--text-400)' : 'var(--text-600)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        boxShadow: disabled ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = 'var(--c-teal)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; }}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DataTable
═══════════════════════════════════════════════════════════════════ */
export default function DataTable({
  columns,
  data              = [],
  isLoading         = false,
  skeletonRows      = 6,
  searchPlaceholder = 'Search…',
  searchColumnId,
  emptyTitle        = 'No records',
  emptyBody         = '',
  noResultsTitle    = 'No results',
  noResultsBody     = 'Try adjusting your search or filters.',
  renderSubRow,
  bulkActions,
  onRowClick,
  pageSize          = 25,
  showPagination    = true,
  className         = '',
}) {
  const [sorting,      setSorting]      = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [expanded,     setExpanded]     = useState({});

  const table = useReactTable({
    data, columns,
    state:                  { sorting, globalFilter, rowSelection, expanded },
    onSortingChange:        setSorting,
    onGlobalFilterChange:   setGlobalFilter,
    onRowSelectionChange:   setRowSelection,
    onExpandedChange:       setExpanded,
    getCoreRowModel:        getCoreRowModel(),
    getSortedRowModel:      getSortedRowModel(),
    getFilteredRowModel:    getFilteredRowModel(),
    getExpandedRowModel:    getExpandedRowModel(),
    getPaginationRowModel:  getPaginationRowModel(),
    enableRowSelection:     !!bulkActions,
    initialState:           { pagination: { pageSize } },
  });

  const rows          = table.getRowModel().rows;
  const totalFiltered = table.getFilteredRowModel().rows.length;
  const selectedRows  = table.getSelectedRowModel().rows;
  const hasFilter     = globalFilter.length > 0;
  const isEmpty       = !isLoading && rows.length === 0;
  const pageCount     = table.getPageCount();
  const pageIndex     = table.getState().pagination.pageIndex;
  const curPageSize   = table.getState().pagination.pageSize;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className={className}>

      {/* shimmer keyframe — injected once */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* ── Search input ── */}
      {searchColumnId !== undefined && (
        <div style={{ position: 'relative', width: 280 }}>
          <Search size={13} style={{
            position: 'absolute', left: 11, top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-400)', pointerEvents: 'none',
          }} />
          <input
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              width: '100%', height: 36,
              paddingLeft: 34, paddingRight: globalFilter ? 30 : 12,
              fontSize: 12, borderRadius: 10,
              border: '1px solid var(--card-border)',
              background: 'var(--card-bg)',
              color: 'var(--text-800)',
              outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'var(--c-teal)';
              e.target.style.boxShadow   = '0 0 0 3px rgba(13,148,136,0.12)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--card-border)';
              e.target.style.boxShadow   = 'none';
            }}
          />
          {globalFilter && (
            <button onClick={() => setGlobalFilter('')} style={{
              position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-400)', padding: 2,
            }}>
              <X size={11} />
            </button>
          )}
        </div>
      )}

      {/* ── Bulk-action bar ── */}
      {bulkActions && selectedRows.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 14px', borderRadius: 12,
          border: '1.5px solid var(--c-teal)',
          background: 'color-mix(in srgb,var(--c-teal) 8%,var(--card-bg))',
          boxShadow: '0 2px 8px rgba(13,148,136,0.12)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-teal)' }}>
            {selectedRows.length} selected
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {bulkActions(selectedRows)}
            <button onClick={() => table.resetRowSelection()} style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 8,
              border: '1px solid var(--card-border)', background: 'transparent',
              color: 'var(--text-500)', cursor: 'pointer',
            }}>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div style={{
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid var(--card-border)',
        background: 'var(--card-bg)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>

            {/* ── Head — teal-tinted, same as Services stat strip ── */}
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id} style={{
                  borderBottom: '1px solid var(--card-border)',
                  background: 'linear-gradient(90deg,color-mix(in srgb,var(--c-teal) 6%,var(--card-bg)),var(--card-bg))',
                }}>
                  {hg.headers.map(header => {
                    const canSort = header.column.getCanSort();
                    const sorted  = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        style={{
                          padding: '10px 16px',
                          fontSize: 11, fontWeight: 600,
                          color: 'var(--text-500)',
                          whiteSpace: 'nowrap',
                          userSelect: 'none',
                          cursor: canSort ? 'pointer' : 'default',
                          letterSpacing: '0.03em',
                          ...(header.column.columnDef.meta?.thStyle || {}),
                        }}
                      >
                        {header.isPlaceholder ? null : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {canSort && <SortIcon sorted={sorted} />}
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            {/* ── Body ── */}
            <tbody>
              {isLoading
                ? Array.from({ length: skeletonRows }).map((_, i) => (
                    <SkeletonRow key={i} colCount={columns.length} />
                  ))
                : isEmpty
                ? (
                  <tr>
                    <td colSpan={columns.length} style={{ padding: '52px 16px', textAlign: 'center' }}>
                      {/* Warm empty state — Services style */}
                      <div style={{
                        width: 48, height: 48, borderRadius: 16,
                        background: 'linear-gradient(135deg,#f0fdfa,#e0f2fe)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 12px',
                        boxShadow: '0 2px 12px rgba(13,148,136,0.12)',
                      }}>
                        <Inbox size={22} style={{ color: 'var(--c-teal)' }} />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-600)', margin: '0 0 4px' }}>
                        {hasFilter ? noResultsTitle : emptyTitle}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-400)', margin: 0 }}>
                        {hasFilter ? noResultsBody : emptyBody}
                      </p>
                      {hasFilter && (
                        <button onClick={() => setGlobalFilter('')} style={{
                          marginTop: 12, fontSize: 12, fontWeight: 600,
                          color: 'var(--c-teal)', background: 'none',
                          border: 'none', cursor: 'pointer', textDecoration: 'underline',
                        }}>
                          Clear search
                        </button>
                      )}
                    </td>
                  </tr>
                )
                : rows.map((row, rowIdx) => {
                  const isSelected  = row.getIsSelected();
                  const isExpanded  = row.getIsExpanded();
                  const isClickable = !!(onRowClick || renderSubRow);
                  return (
                    <Fragment key={row.id}>
                      <tr
                        onClick={() => {
                          if (renderSubRow) row.toggleExpanded();
                          if (onRowClick)   onRowClick(row.original);
                        }}
                        style={{
                          borderBottom: '1px solid color-mix(in srgb,var(--card-border) 60%,transparent)',
                          cursor:       isClickable ? 'pointer' : 'default',
                          transition:   'background 0.12s',
                          /* Teal left border accent on selected/expanded — like ProviderCard featured */
                          borderLeft:   (isSelected || isExpanded) ? '3px solid var(--c-teal)' : '3px solid transparent',
                          background:   isSelected
                            ? 'color-mix(in srgb,var(--c-teal) 7%,var(--card-bg))'
                            : isExpanded
                            ? 'color-mix(in srgb,var(--c-teal) 4%,var(--card-bg))'
                            : 'transparent',
                        }}
                        onMouseEnter={e => {
                          if (!isSelected && isClickable) {
                            e.currentTarget.style.background = 'color-mix(in srgb,var(--c-teal) 4%,var(--card-bg))';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) {
                            e.currentTarget.style.background = isExpanded
                              ? 'color-mix(in srgb,var(--c-teal) 4%,var(--card-bg))'
                              : 'transparent';
                          }
                        }}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td
                            key={cell.id}
                            style={{
                              padding: '11px 16px',
                              verticalAlign: 'middle',
                              ...(cell.column.columnDef.meta?.tdStyle || {}),
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>

                      {/* Sub-row — teal accent, like Services featured strip */}
                      {renderSubRow && isExpanded && (
                        <tr style={{
                          borderBottom: '1px solid var(--card-border)',
                          borderLeft: '3px solid var(--c-teal)',
                          background: 'color-mix(in srgb,var(--c-teal) 4%,var(--card-bg))',
                        }}>
                          <td colSpan={columns.length}>
                            {renderSubRow(row)}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              }
            </tbody>
          </table>
        </div>

        {/* ── Footer ── */}
        {!isLoading && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 16px',
            borderTop: '1px solid var(--card-border)',
            background: 'color-mix(in srgb,var(--page-bg) 20%,var(--card-bg))',
            flexWrap: 'wrap', gap: 8,
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-400)' }}>
              {isEmpty
                ? hasFilter ? 'No results match your search' : 'No records yet'
                : `${totalFiltered}${data.length !== totalFiltered ? ` of ${data.length}` : ''} record${data.length !== 1 ? 's' : ''}${hasFilter ? ' (filtered)' : ''}`
              }
            </span>

            {showPagination && !isEmpty && pageCount > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <select
                  value={curPageSize}
                  onChange={e => table.setPageSize(Number(e.target.value))}
                  style={{
                    fontSize: 11, height: 28, padding: '0 8px',
                    borderRadius: 8, border: '1px solid var(--card-border)',
                    background: 'var(--card-bg)', color: 'var(--text-600)',
                    cursor: 'pointer', outline: 'none',
                  }}
                >
                  {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
                </select>

                <PillBtn onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                  <ChevronLeft size={13} />
                </PillBtn>
                <span style={{ fontSize: 11, color: 'var(--text-500)', minWidth: 40, textAlign: 'center' }}>
                  {pageIndex + 1} / {pageCount}
                </span>
                <PillBtn onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  <ChevronRight size={13} />
                </PillBtn>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
